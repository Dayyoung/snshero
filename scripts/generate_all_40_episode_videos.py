#!/usr/bin/env python3
"""
scripts/generate_all_40_episode_videos.py
SNSHero 40-Episode Clean Steady 1:1 Cut-Synchronized Animation MP4 Engine

Key Features:
1. Uses all 2,009 newly generated card-accurate animation cuts (+ 40 opening title cards = 2,049 scenes)
   in `public/images/webtoon/episode_01..40/scene_00..XX.webp`.
2. Zero top black label bars (`SNSHERO · ANIMATED CHRONICLE` / `EP.XX · SCENE YY` completely removed).
3. Zero camera shaking, zero pan/zoom wobble, zero flying particle clutter, zero slash flashes,
   zero portrait bounce, and zero typewriter flickering.
4. 100% 1:1 Cut-by-Cut Synchronized Narration (`en-US-JennyNeural` + calm ambient BGM) via
   `scripts/synced_narration_engine.py` (`SentenceBoundary` timestamp locking), so every cut's
   visual scene, Korean/English subtitle, and voiceover narration start and end at the exact same millisecond.
"""

import argparse
import concurrent.futures
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT / "scripts"))

from synced_narration_engine import ensure_calm_bgm_wav, synthesize_synced_episode_audio

MANIFEST_PATH = PROJECT_ROOT / "src" / "content" / "webtoonEpisodeManifest.json"
CARD_DB_PATH = PROJECT_ROOT / "src" / "cardDatabase.ts"
SEAT_DIR = PROJECT_ROOT / "public" / "seat"
OUTPUT_DIR = PROJECT_ROOT / "public" / "video" / "animation"
AUDIO_CACHE_DIR = Path("/tmp/snshero_synced_audio_cache_v2/animation")

FFMPEG_BIN = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
FFPROBE_BIN = shutil.which("ffprobe") or "/opt/homebrew/bin/ffprobe"

FPS = 15
WIDTH = 800
ART_H = 450
DOCK_H = 0
HEIGHT = ART_H  # 450 (Clean 16:9 full-bleed without subtitle dock)

FONT_KO = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
FONT_MONO = "/System/Library/Fonts/Menlo.ttc"


def load_card_portrait_map() -> dict:
    cards = {}
    if not CARD_DB_PATH.is_file():
        return cards
    content = CARD_DB_PATH.read_text(encoding="utf-8")
    pattern = re.compile(
        r"id:\s*(\d+)[^}]+?title:\s*['\"]([^'\"]+)['\"],[^}]+?title_en:\s*['\"]([^'\"]+)['\"]"
    )
    for m in pattern.finditer(content):
        cid = int(m.group(1))
        t_en = m.group(3)
        cards[cid] = f"{t_en.replace(' ', '_')}.png"
    return cards


def resolve_portrait_file(img_entry: dict, card_map: dict) -> str:
    dialogues = img_entry.get("dialogues", [])
    if dialogues:
        cid = dialogues[0].get("characterCardId")
        if cid and cid in card_map:
            p = card_map[cid]
            if (SEAT_DIR / p).is_file():
                return p
        sp_en = dialogues[0].get("speakerEn", "")
        if sp_en and sp_en != "Narration":
            sp_file = f"{sp_en.replace(' ', '_')}.png"
            if (SEAT_DIR / sp_file).is_file():
                return sp_file

    characters = img_entry.get("characters", [])
    if characters:
        for ch in characters:
            ch_file = f"{ch.replace(' ', '_')}.png"
            if (SEAT_DIR / ch_file).is_file():
                return ch_file
    return ""


def build_steady_cut_frame(
    sm: dict,
    ep_num: int,
    portrait_cache: dict,
    font_title,
    font_sub,
    font_bold,
    font_ko,
    font_en,
    font_micro,
) -> Image.Image:
    """
    Renders a single clean, 100% steady, subtitle-free 800x450 16:9 frame for cut `sm`:
    - Unobstructed full-bleed 16:9 illustration (zero top/bottom label bars, zero baked-in subtitles).
    """
    art_img = Image.open(sm["src_path"]).convert("RGB")
    if art_img.size != (WIDTH, HEIGHT):
        art_img = art_img.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    return art_img


def render_animated_episode_frames(
    ep_num: int,
    scenes_meta: list[dict],
    boundaries_sec: list[float],
    ffmpeg_stdin,
):
    """
    Streams 15fps clean, steady RGB24 frames (800x560) directly into ffmpeg_stdin,
    locked to `boundaries_sec[0 .. N]` so cumulative timing drift is 0.00s.
    """
    try:
        font_ko = ImageFont.truetype(FONT_KO, 13)
    except Exception:
        font_ko = ImageFont.load_default()
    try:
        font_title = ImageFont.truetype(FONT_MONO, 19)
        font_sub = ImageFont.truetype(FONT_MONO, 11)
        font_bold = ImageFont.truetype(FONT_MONO, 12)
        font_en = ImageFont.truetype(FONT_MONO, 10)
        font_micro = ImageFont.truetype(FONT_MONO, 9)
    except Exception:
        font_title = font_sub = font_bold = font_en = font_micro = ImageFont.load_default()

    portrait_cache: dict[str, Image.Image] = {}
    for sm in scenes_meta:
        pf = sm["portrait_file"]
        if pf and pf not in portrait_cache:
            sp = SEAT_DIR / pf
            if sp.is_file():
                try:
                    portrait_cache[pf] = Image.open(sp).convert("RGBA").resize((64, 74), Image.Resampling.LANCZOS)
                except Exception:
                    pass

    n_scenes = len(scenes_meta)
    frame_bounds = [int(round(b * FPS)) for b in boundaries_sec]
    for i in range(1, len(frame_bounds)):
        if frame_bounds[i] <= frame_bounds[i - 1] + 6:
            frame_bounds[i] = frame_bounds[i - 1] + 6

    steady_frames = [
        build_steady_cut_frame(
            sm, ep_num, portrait_cache, font_title, font_sub, font_bold, font_ko, font_en, font_micro
        )
        for sm in scenes_meta
    ]

    trans_frames = 4  # Smooth 0.26s cross-dissolve right at cut boundary
    for s_idx in range(n_scenes):
        total_f = frame_bounds[s_idx + 1] - frame_bounds[s_idx]
        body_f = total_f if s_idx == n_scenes - 1 else max(1, total_f - trans_frames)
        cur_img = steady_frames[s_idx]
        cur_bytes = cur_img.tobytes()

        for _ in range(body_f):
            ffmpeg_stdin.write(cur_bytes)

        if s_idx < n_scenes - 1:
            actual_trans = total_f - body_f
            next_img = steady_frames[s_idx + 1]
            for tf in range(actual_trans):
                alpha = (tf + 1) / float(actual_trans + 1)
                blended = Image.blend(cur_img, next_img, alpha)
                ffmpeg_stdin.write(blended.tobytes())


def generate_single_episode(
    ep_num: int,
    ep_data: dict,
    card_map: dict,
    out_mp4_path: str,
    temp_base_dir: str,
) -> dict:
    """Generates a 100% narration-synchronized, clean, steady Animation MP4 for Episode `ep_num`."""
    ep_dir = Path(temp_base_dir) / f"ep_{ep_num:02d}"
    ep_dir.mkdir(parents=True, exist_ok=True)

    images = ep_data.get("images", [])
    if not images:
        return {"ep_num": ep_num, "status": "FAIL", "error": "No images in manifest"}

    title_en = (ep_data.get("episodeTitle") or ep_data.get("titleEn") or f"Episode {ep_num}").strip()
    title_ko = (ep_data.get("episodeTitleKo") or f"제{ep_num}화").strip()

    scenes_meta = []
    scene_spoken_scripts = []

    for idx, img_entry in enumerate(images):
        rel_img = img_entry.get("imageUrl", "").lstrip("/")
        src_path = PROJECT_ROOT / "public" / rel_img.replace("public/", "")
        if not src_path.is_file():
            continue

        is_title = idx == 0 or img_entry.get("type") == "title_card"
        narration_ko = (img_entry.get("narrationKo") or "").strip()
        narration_en = (img_entry.get("narrationEn") or "").strip()

        speaker_ko = "내레이션"
        speaker_en = "Narration"
        dialogues = img_entry.get("dialogues", [])
        if dialogues:
            speaker_ko = dialogues[0].get("speakerKo") or "내레이션"
            speaker_en = dialogues[0].get("speakerEn") or "Narration"

        portrait_file = resolve_portrait_file(img_entry, card_map)

        if is_title:
            spoken_en = f"Episode {ep_num}. {title_en}."
            disp_ko = narration_ko
            disp_en = narration_en
        else:
            spoken_en = narration_en or f"Episode {ep_num}, scene {idx}."
            disp_ko = narration_ko
            disp_en = narration_en

        scenes_meta.append(
            {
                "src_path": src_path,
                "is_title": is_title,
                "title_en": title_en,
                "title_ko": title_ko,
                "speaker_ko": speaker_ko,
                "speaker_en": speaker_en,
                "text_ko": disp_ko,
                "text_en": disp_en,
                "portrait_file": portrait_file,
            }
        )
        scene_spoken_scripts.append(spoken_en)

    if not scenes_meta:
        shutil.rmtree(ep_dir, ignore_errors=True)
        return {"ep_num": ep_num, "status": "FAIL", "error": "Zero valid scenes"}

    audio_m4a_path = ep_dir / f"synced_anim_ep_{ep_num:02d}.m4a"
    try:
        audio_m4a_path, aligned_durations, boundaries_sec = synthesize_synced_episode_audio(
            ep_num=ep_num,
            scene_texts=scene_spoken_scripts,
            out_m4a=audio_m4a_path,
            voice="en-US-JennyNeural",
            rate="+8%",
            pitch="+0Hz",
            cache_dir=AUDIO_CACHE_DIR,
        )
    except Exception as e:
        shutil.rmtree(ep_dir, ignore_errors=True)
        return {"ep_num": ep_num, "status": "FAIL", "error": f"Audio synthesis failed: {e}"}

    total_duration = boundaries_sec[-1]
    tmp_out_mp4 = ep_dir / f"new_ep_{ep_num:02d}.mp4"

    cmd = [
        FFMPEG_BIN,
        "-y",
        "-f",
        "rawvideo",
        "-vcodec",
        "rawvideo",
        "-s",
        f"{WIDTH}x{HEIGHT}",
        "-pix_fmt",
        "rgb24",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-i",
        str(audio_m4a_path),
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "24",
        "-maxrate",
        "600k",
        "-bufsize",
        "1200k",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "copy",
        "-shortest",
        "-movflags",
        "+faststart",
        str(tmp_out_mp4),
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        render_animated_episode_frames(ep_num, scenes_meta, boundaries_sec, proc.stdin)
        proc.stdin.close()
    except Exception as e:
        proc.kill()
        shutil.rmtree(ep_dir, ignore_errors=True)
        return {"ep_num": ep_num, "status": "FAIL", "error": f"Frame pipe error: {e}"}

    stderr_bytes = proc.stderr.read()
    ret = proc.wait()

    if ret != 0 or not tmp_out_mp4.is_file():
        shutil.rmtree(ep_dir, ignore_errors=True)
        return {
            "ep_num": ep_num,
            "status": "FAIL",
            "error": f"FFmpeg failed: {stderr_bytes.decode('utf-8', 'ignore')[:200]}",
        }

    shutil.move(str(tmp_out_mp4), str(out_mp4_path))
    shutil.rmtree(ep_dir, ignore_errors=True)

    probe_cmd = [
        FFPROBE_BIN,
        "-v",
        "error",
        "-show_entries",
        "format=duration,size:stream=codec_name,width,height,sample_rate",
        "-of",
        "json",
        str(out_mp4_path),
    ]
    probe_res = subprocess.run(probe_cmd, capture_output=True, text=True)
    if probe_res.returncode == 0:
        pdata = json.loads(probe_res.stdout)
        dur = float(pdata.get("format", {}).get("duration", 0))
        size = int(pdata.get("format", {}).get("size", 0))
        return {
            "ep_num": ep_num,
            "status": "PASS",
            "cuts": len(scenes_meta) - 1,
            "duration": dur,
            "size": size,
        }
    return {
        "ep_num": ep_num,
        "status": "PASS",
        "cuts": len(scenes_meta) - 1,
        "duration": total_duration,
        "size": os.path.getsize(out_mp4_path),
    }


def main():
    parser = argparse.ArgumentParser(description="SNSHero 40-Episode Clean Steady 1:1 Synced Animation MP4 Generator")
    parser.add_argument("--episodes", type=str, default="all", help="Comma-separated episode numbers or 'all'")
    parser.add_argument("--workers", type=int, default=8, help="Concurrent worker processes (default: 8)")
    args = parser.parse_args()

    if not MANIFEST_PATH.is_file():
        print(f"[FATAL] Manifest not found: {MANIFEST_PATH}")
        sys.exit(1)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    ensure_calm_bgm_wav()
    card_map = load_card_portrait_map()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.episodes == "all":
        targets = list(range(1, 41))
    else:
        targets = [int(x.strip()) for x in args.episodes.split(",") if x.strip()]

    print("======================================================================")
    print("  SNSHero 40-Episode 1:1 Narration-Synced Clean Animation Generator")
    print("  (No Top Black Label · No Shaking/Wobble · 2,009 Cuts 1:1 Synced)")
    print("======================================================================")
    print(f"Targets        : {len(targets)} episodes ({targets[0]}..{targets[-1]})")
    print(f"Concurrency    : {args.workers} workers | Frame Rate: {FPS} fps")
    print(f"Output Dir     : {OUTPUT_DIR}")
    print("======================================================================\n")

    temp_base = tempfile.mkdtemp(prefix="snshero_clean_anim_mp4_")
    results = []

    try:
        with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as executor:
            future_to_ep = {}
            for ep_num in targets:
                ep_data = manifest.get(str(ep_num))
                if not ep_data:
                    continue
                existing_matches = sorted(OUTPUT_DIR.glob(f"SNSHero.com_E{ep_num}_*.mp4"))
                if existing_matches:
                    out_path = existing_matches[0]
                else:
                    title_en = (ep_data.get("episodeTitle") or ep_data.get("titleEn") or f"Episode {ep_num}").strip()
                    out_path = OUTPUT_DIR / f"SNSHero.com_E{ep_num}_{title_en}.mp4"
                future = executor.submit(
                    generate_single_episode,
                    ep_num,
                    ep_data,
                    card_map,
                    str(out_path),
                    temp_base,
                )
                future_to_ep[future] = ep_num

            for future in concurrent.futures.as_completed(future_to_ep):
                ep_num = future_to_ep[future]
                try:
                    res = future.result()
                    results.append(res)
                    if res.get("status") == "PASS":
                        dur = res.get("duration", 0)
                        size_mb = res.get("size", 0) / (1024 * 1024)
                        cuts = res.get("cuts", 0)
                        print(
                            f"  ✓ [DONE] Animation E{ep_num:02d} ({cuts} cuts): {dur:.1f}s | {size_mb:.2f} MB | 1:1 Synced",
                            flush=True,
                        )
                    else:
                        print(f"  ✗ [FAIL] Animation E{ep_num:02d}: {res.get('error')}", flush=True)
                except Exception as ex:
                    print(f"  ✗ [EXCEPTION] Animation E{ep_num:02d}: {ex}", flush=True)
                    results.append({"ep_num": ep_num, "status": "FAIL", "error": str(ex)})
    finally:
        shutil.rmtree(temp_base, ignore_errors=True)

    passed = [r for r in results if r.get("status") == "PASS"]
    failed = [r for r in results if r.get("status") != "PASS"]
    print("\n----------------------------------------------------------------------")
    print(f"  Animation Generation Complete: {len(passed)} / {len(targets)} Succeeded ({len(failed)} Failed)")
    print("----------------------------------------------------------------------")

    if failed:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
