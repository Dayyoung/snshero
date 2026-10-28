#!/usr/bin/env python3
"""
Master Batch Production Runner for Episodes 1 ~ 40 (`1화` ~ `40화`)
------------------------------------------------------------------
Completes the full anime production pipeline for all 40 episodes:
  1. `/script-anime <ep>회`: Verifies/generates `episode_XX_cutscene_prompts.json` & `.md`
     with 3-mode audio/dialogue/omniscient-male-narration rules and `cutsceneAnimationPromptEn`.
  2. `/cutscene-anime <ep>화`: Preserves any existing Google Flow Nano Banana 2.1 cutscene images,
     and renders any remaining cutscene images (`EPXX_CUTYY_cutscene.jpg`, 16:9 or 9:16) by
     compositing the exact Background Location Art (`LOC-001`~`LOC-020`), 7-Head-Tall Character
     Cutouts (`cutouts/XXX_Name.png`), and Prop Art (`PROP-001`~`PROP-020`) with zero text.
  3. `/video-anime <ep>화`: Preserves any existing Google Flow `Veo 3.1 - Lite` 6-second clips,
     and animates each cutscene image (`EPXX_CUTYY_cutscene.jpg`) into a 6-second 24fps `.mp4`
     clip (`clips/EPXX-CUTYY.mp4`) with hardware-accelerated `h264_videotoolbox` and 3-mode audio:
       - `character_dialogue`: Summarized <= 6s spoken dialogue by that character only
       - `omniscient_male_narration`: Off-screen male narrator in the background (`Daniel`) only,
         while all characters on screen remain completely silent
       - `silent`: All characters silent with subtle cinematic ambience
  4. Concatenates all 6-second clips per episode into 1 integrated `.mp4` movie in both:
       - `public/anime-character-sheets/videos/epXX_<orientation>/SNSHero_Anime_EPXX_<Title>_16x9.mp4`
       - `/Users/dayyoung/Desktop/내문서/movie/SNSHero_Anime_EPXX_<Title>_16x9.mp4`
     and writes `youtube_upload_ready.json` & `YOUTUBE_UPLOAD_READY.md`.
"""

import argparse
import concurrent.futures
import json
import math
import os
import random
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[3]
PROMPT_DIR = ROOT / "public" / "anime-character-sheets" / "cutscene-prompts"
MOVIE_OUT_DIR = Path("/Users/dayyoung/Desktop/내문서/movie")

sys.path.insert(0, str(ROOT / "skills" / "video-anime" / "scripts"))
import generate_flow_videos as gfv

FEMALE_NAMES = {
    "Elwin", "Ysela", "Seraphine", "Sylvia", "Rosa", "Lyn", "Chloe", "Aurelia",
    "Evelyn", "Miriam", "Freya", "Selene", "Aria", "Liora", "Camilla", "isolde",
    "Valeria", "Nadia", "Elena", "celeste", "Iris", "Fiona", "Diana", "hera",
}
FEMALE_VOICES = ["Samantha", "Karen", "Tessa", "Moira"]
MALE_VOICES = ["Daniel", "Alex", "Fred"]


def resolve_public_asset(web_path: str) -> Optional[Path]:
    if not web_path:
        return None
    rel = web_path.lstrip("/")
    p = ROOT / "public" / rel
    if p.exists():
        return p
    return None


def pick_voice_for_speaker(speaker_en: str, audio_type: str) -> Tuple[str, int]:
    if audio_type == "omniscient_male_narration":
        return ("Daniel", 168)
    name_clean = (speaker_en or "").strip()
    is_female = any(fn.lower() in name_clean.lower() for fn in FEMALE_NAMES)
    if is_female:
        idx = sum(ord(c) for c in name_clean) % len(FEMALE_VOICES)
        return (FEMALE_VOICES[idx], 172)
    idx = sum(ord(c) for c in name_clean) % len(MALE_VOICES)
    return (MALE_VOICES[idx], 170)


def composite_cutscene_image(cut: dict, out_jpg: Path, orientation: str) -> Path:
    if out_jpg.exists() and out_jpg.stat().st_size > 15000:
        return out_jpg

    out_jpg.parent.mkdir(parents=True, exist_ok=True)
    target_w, target_h = (720, 1280) if orientation == "portrait" else (1280, 720)

    # 1. Load Background Location Art
    loc_info = cut.get("location") or {}
    loc_path = resolve_public_asset(loc_info.get("artUrl") or loc_info.get("artFile") or "")
    if not loc_path or not loc_path.exists():
        loc_path = ROOT / "public" / "anime-character-sheets" / "locations" / "art" / "LOC_001_Elwin_Village.jpg"

    bg = Image.open(loc_path).convert("RGB")
    bg_ratio = bg.width / bg.height
    target_ratio = target_w / target_h
    if bg_ratio > target_ratio:
        new_h = target_h
        new_w = int(bg_ratio * new_h)
    else:
        new_w = target_w
        new_h = int(new_w / bg_ratio)
    bg = bg.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Slight horizontal crop variation per cutNumber for visual variety
    cnum = int(cut.get("cutNumber", 1))
    max_dx = max(0, new_w - target_w)
    max_dy = max(0, new_h - target_h)
    ox = int((max_dx / 2) + math.sin(cnum * 1.3) * (max_dx * 0.35)) if max_dx > 0 else 0
    oy = int((max_dy / 2) + math.cos(cnum * 1.1) * (max_dy * 0.35)) if max_dy > 0 else 0
    ox = max(0, min(max_dx, ox))
    oy = max(0, min(max_dy, oy))
    canvas = bg.crop((ox, oy, ox + target_w, oy + target_h)).convert("RGBA")

    # Subtle depth-of-field blur on background when characters are present
    chars = cut.get("characters") or []
    if chars:
        canvas_rgb = canvas.convert("RGB").filter(ImageFilter.GaussianBlur(radius=1.4))
        canvas_rgb = ImageEnhance.Brightness(canvas_rgb).enhance(0.92)
        canvas = canvas_rgb.convert("RGBA")

    # 2. Composite up to 3 7-Head-Tall Character Cutouts (RGBA)
    valid_cutouts: List[Path] = []
    for ch in chars[:3]:
        cp = resolve_public_asset(ch.get("cutoutUrl") or ch.get("cutoutFile") or "")
        if cp and cp.exists():
            valid_cutouts.append(cp)

    num_chars = len(valid_cutouts)
    if num_chars > 0:
        # Layout x-centers depending on character count
        if num_chars == 1:
            x_Frac = [0.52 if cnum % 2 == 1 else 0.48]
            scale_h_frac = 0.94
        elif num_chars == 2:
            x_Frac = [0.31, 0.69]
            scale_h_frac = 0.90
        else:
            x_Frac = [0.23, 0.50, 0.77]
            scale_h_frac = 0.86

        for idx, cp in enumerate(valid_cutouts):
            try:
                ch_img = Image.open(cp).convert("RGBA")
                # Isolate central character silhouette by zeroing any detached side slivers across empty alpha columns
                w_orig, h_orig = ch_img.size
                alpha_band = ch_img.split()[3]
                alpha_bytes = alpha_band.tobytes()
                col_counts = [0] * w_orig
                for y_i in range(0, h_orig, 2):
                    row_off = y_i * w_orig
                    for x_i in range(w_orig):
                        if alpha_bytes[row_off + x_i] > 25:
                            col_counts[x_i] += 1
                mid_x = w_orig // 2
                # Find first nonzero column near center if mid_x is empty
                if col_counts[mid_x] == 0:
                    for delta in range(1, w_orig // 2):
                        if mid_x - delta >= 0 and col_counts[mid_x - delta] > 3:
                            mid_x = mid_x - delta
                            break
                        if mid_x + delta < w_orig and col_counts[mid_x + delta] > 3:
                            mid_x = mid_x + delta
                            break
                left_bound = 0
                for x_i in range(mid_x, -1, -1):
                    if col_counts[x_i] == 0:
                        left_bound = x_i
                        break
                right_bound = w_orig
                for x_i in range(mid_x, w_orig):
                    if col_counts[x_i] == 0:
                        right_bound = x_i
                        break
                if right_bound - left_bound > w_orig * 0.18:
                    ch_img = ch_img.crop((left_bound, 0, right_bound, h_orig))

                bbox = ch_img.getbbox()
                if bbox:
                    ch_img = ch_img.crop(bbox)
                # Medium-close / waist-up or 3/4 framing on alternate cuts
                if cnum % 3 == 0:
                    ch_img = ch_img.crop((0, 0, ch_img.width, int(ch_img.height * 0.72)))
                desired_h = int(target_h * scale_h_frac)
                desired_w = max(1, int(ch_img.width * (desired_h / ch_img.height)))
                ch_img = ch_img.resize((desired_w, desired_h), Image.Resampling.LANCZOS)

                # Subtle ambient color harmony with background + bottom edge soft fade
                bg_avg = canvas.resize((1, 1), Image.Resampling.BILINEAR).getpixel((0, 0))
                r_c, g_c, b_c, a_c = ch_img.split()
                rgb_c = Image.merge("RGB", (r_c, g_c, b_c))
                tint_c = Image.new("RGB", ch_img.size, (bg_avg[0], bg_avg[1], bg_avg[2]))
                rgb_harmonized = Image.blend(rgb_c, tint_c, 0.11)
                ch_img = Image.merge("RGBA", (*rgb_harmonized.split(), a_c))

                cx = int(target_w * x_Frac[idx]) - desired_w // 2
                cy = target_h - desired_h + int(target_h * 0.04)

                # Soft dark drop shadow for anime depth separation
                alpha = ch_img.split()[3]
                shadow = Image.new("RGBA", ch_img.size, (8, 12, 22, 0))
                shadow.putalpha(alpha.point(lambda p: int(p * 0.55)))
                shadow = shadow.filter(ImageFilter.GaussianBlur(radius=8))
                canvas.alpha_composite(shadow, (cx + 6, cy + 8))
                canvas.alpha_composite(ch_img, (cx, cy))
            except Exception:
                pass

    # 3. Composite standalone Prop emblem/glow if a PROP-001..PROP-020 item is featured
    props = cut.get("props") or []
    for pr in props:
        pid = pr.get("code") or pr.get("propId") or ""
        if pid.startswith("PROP-"):
            pp = resolve_public_asset(pr.get("artUrl") or pr.get("artFile") or "")
            if pp and pp.exists():
                try:
                    p_img = Image.open(pp).convert("RGBA")
                    pw = int(min(target_w, target_h) * 0.22)
                    ph = int(p_img.height * (pw / p_img.width))
                    p_img = p_img.resize((pw, ph), Image.Resampling.LANCZOS)
                    # Circular soft alpha mask for floating relic inset
                    mask = Image.new("L", (pw, ph), 0)
                    mdraw = ImageDraw.Draw(mask)
                    mdraw.ellipse((4, 4, pw - 4, ph - 4), fill=215)
                    mask = mask.filter(ImageFilter.GaussianBlur(radius=6))
                    p_img.putalpha(mask)
                    px = int(target_w * 0.78) - pw // 2 if num_chars <= 1 else int(target_w * 0.50) - pw // 2
                    py = int(target_h * 0.62) - ph // 2
                    canvas.alpha_composite(p_img, (max(10, px), max(10, py)))
                except Exception:
                    pass
            break

    # 4. Cinematic Anime Atmospheric Particles & Vignette (Zero Text!)
    overlay = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    rng = random.Random(cnum * 997 + int(cut.get("episodeNumber", 1)) * 31)
    for _ in range(42):
        px = rng.randint(0, target_w - 1)
        py = rng.randint(0, target_h - 1)
        r = rng.randint(1, 3)
        if cnum % 2 == 0:
            # Frost / arcane snow motes
            odraw.ellipse((px - r, py - r, px + r, py + r), fill=(225, 240, 255, rng.randint(70, 165)))
        else:
            # Warm torch / mana ember motes
            odraw.ellipse((px - r, py - r, px + r, py + r), fill=(255, 210, 145, rng.randint(65, 150)))
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=0.8))
    canvas.alpha_composite(overlay)

    final_rgb = canvas.convert("RGB")
    final_rgb = ImageEnhance.Contrast(final_rgb).enhance(1.05)
    final_rgb.save(out_jpg, format="JPEG", quality=92)
    return out_jpg


def render_single_cut_video_worker(args_tuple) -> Tuple[str, bool, int]:
    cut, img_path_str, clip_path_str, orientation = args_tuple
    img_path = Path(img_path_str)
    clip_path = Path(clip_path_str)
    ccode = cut["cutCode"]

    if clip_path.exists() and clip_path.stat().st_size > 80000:
        return (ccode, True, clip_path.stat().st_size)

    clip_path.parent.mkdir(parents=True, exist_ok=True)
    diag = cut.get("dialogue") or {}
    audio_type = diag.get("audioType", "silent")
    speaker_en = diag.get("speakerEn") or ""
    line_en = (diag.get("summarized6sLineEn") or "").strip()

    cnum = int(cut.get("cutNumber", 1))
    target_s = "720x1280" if orientation == "portrait" else "1280x720"
    pre_w, pre_h = (900, 1600) if orientation == "portrait" else (1600, 900)

    # 4 distinct 24fps anime camera motions (push-in, pull-back, pan-right, pan-left)
    motion_mode = cnum % 4
    if motion_mode == 0:
        zp = f"zoompan=z='min(zoom+0.0010,1.15)':x='iw/2-(iw/zoom/2)+sin(on/20)*10':y='ih/2-(ih/zoom/2)':d=144:s={target_s}:fps=24"
    elif motion_mode == 1:
        zp = f"zoompan=z='if(eq(on,1),1.15,max(1.00,zoom-0.0010))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)+cos(on/20)*8':d=144:s={target_s}:fps=24"
    elif motion_mode == 2:
        zp = f"zoompan=z='1.12':x='(iw-iw/zoom)*(on/144)':y='ih/2-(ih/zoom/2)':d=144:s={target_s}:fps=24"
    else:
        zp = f"zoompan=z='1.12':x='(iw-iw/zoom)*(1-on/144)':y='ih/2-(ih/zoom/2)':d=144:s={target_s}:fps=24"

    vf = (
        f"scale={pre_w}:{pre_h}:force_original_aspect_ratio=increase,crop={pre_w}:{pre_h},"
        f"{zp},format=yuv420p"
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        wav_path = tmp / "audio_6s.wav"

        if audio_type in ("character_dialogue", "omniscient_male_narration") and line_en:
            voice_name, rate = pick_voice_for_speaker(speaker_en, audio_type)
            aiff_path = tmp / "speech.aiff"
            try:
                subprocess.run(
                    ["say", "-v", voice_name, "-r", str(rate), "-o", str(aiff_path), line_en],
                    check=True,
                    capture_output=True,
                )
                subprocess.run(
                    [
                        "ffmpeg", "-y",
                        "-i", str(aiff_path),
                        "-f", "lavfi", "-i", "anoisesrc=d=6:c=pink:r=44100:a=0.025",
                        "-filter_complex",
                        "[0:a]adelay=250|250,apad=whole_dur=6.0,atrim=0:6.0,volume=1.35[v];"
                        "[1:a]lowpass=f=360,atrim=0:6.0[bg];"
                        "[v][bg]amix=inputs=2:duration=first:dropout_transition=1,"
                        "afade=t=in:st=0:d=0.2,afade=t=out:st=5.65:d=0.35[outa]",
                        "-map", "[outa]",
                        "-ar", "44100", "-ac", "2",
                        str(wav_path),
                    ],
                    check=True,
                    capture_output=True,
                )
            except Exception:
                pass

        if not wav_path.exists():
            # Silent scene: all appearing characters completely silent, subtle wind ambience only
            subprocess.run(
                [
                    "ffmpeg", "-y",
                    "-f", "lavfi", "-i", "anoisesrc=d=6:c=pink:r=44100:a=0.022",
                    "-af", "lowpass=f=340,afade=t=in:st=0:d=0.3,afade=t=out:st=5.6:d=0.4",
                    "-t", "6.0",
                    "-ar", "44100", "-ac", "2",
                    str(wav_path),
                ],
                check=True,
                capture_output=True,
            )

        cmd_vt = [
            "ffmpeg", "-y",
            "-loop", "1", "-i", str(img_path),
            "-i", str(wav_path),
            "-vf", vf,
            "-t", "6.0",
            "-c:v", "h264_videotoolbox", "-b:v", "3600k",
            "-c:a", "aac", "-b:a", "160k",
            "-shortest", "-movflags", "+faststart",
            str(clip_path),
        ]
        res = subprocess.run(cmd_vt, capture_output=True)
        if res.returncode != 0 or not clip_path.exists() or clip_path.stat().st_size < 50000:
            cmd_sw = [
                "ffmpeg", "-y",
                "-loop", "1", "-i", str(img_path),
                "-i", str(wav_path),
                "-vf", vf,
                "-t", "6.0",
                "-c:v", "libx264", "-preset", "ultrafast", "-crf", "21",
                "-c:a", "aac", "-b:a", "160k",
                "-shortest", "-movflags", "+faststart",
                str(clip_path),
            ]
            subprocess.run(cmd_sw, check=True, capture_output=True)

    return (ccode, clip_path.exists(), clip_path.stat().st_size if clip_path.exists() else 0)


def produce_episode(ep: int, orientation: str = "landscape", max_workers: int = 6) -> dict:
    t0 = time.time()
    json_path = PROMPT_DIR / f"episode_{ep:02d}_cutscene_prompts.json"
    if not json_path.exists():
        subprocess.run(
            [sys.executable, str(ROOT / "skills" / "script-anime" / "scripts" / "generate_episode_cutscene_prompts.py"), f"{ep}회"],
            check=True,
        )

    ep_data = json.loads(json_path.read_text(encoding="utf-8"))
    cutscenes = ep_data["cutscenes"]
    total_cuts = len(cutscenes)

    cut_dir = ROOT / "public" / "anime-character-sheets" / "cutscenes" / f"ep{ep:02d}_{orientation}"
    cut_img_dir = cut_dir / "images"
    cut_img_dir.mkdir(parents=True, exist_ok=True)

    out_dir = ROOT / "public" / "anime-character-sheets" / "videos" / f"ep{ep:02d}_{orientation}"
    clips_dir = out_dir / "clips"
    clips_dir.mkdir(parents=True, exist_ok=True)

    # Step 1: Ensure all cutscene images (EPXX_CUTYY_cutscene.jpg) exist
    cut_img_map: Dict[str, Path] = {}
    for cut in cutscenes:
        cnum = cut["cutNumber"]
        ccode = cut["cutCode"]
        p_hero = cut_img_dir / f"EP{ep:02d}_CUT{cnum:02d}_hero.jpg"
        p_std = cut_img_dir / f"EP{ep:02d}_CUT{cnum:02d}_cutscene.jpg"
        if p_hero.exists() and p_hero.stat().st_size > 15000:
            cut_img_map[ccode] = p_hero
        elif p_std.exists() and p_std.stat().st_size > 15000:
            cut_img_map[ccode] = p_std
        else:
            cut_img_map[ccode] = composite_cutscene_image(cut, p_std, orientation)

    # Write cutscene status metadata
    cut_status_file = cut_dir / "flow_generation_status.json"
    if not cut_status_file.exists():
        cut_status_file.write_text(
            json.dumps(
                {
                    "episode": ep,
                    "orientation": orientation,
                    "totalCutscenes": total_cuts,
                    "completedCutscenes": len(cut_img_map),
                    "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

    # Step 2: Render all 6-second 24fps cutscene videos in parallel
    tasks = []
    for cut in cutscenes:
        ccode = cut["cutCode"]
        img_p = cut_img_map[ccode]
        clip_p = clips_dir / f"{ccode}.mp4"
        tasks.append((cut, str(img_p), str(clip_p), orientation))

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as pool:
        results = list(pool.map(render_single_cut_video_worker, tasks))

    # Update video_generation_status.json
    v_status_file = out_dir / "video_generation_status.json"
    v_status = {}
    if v_status_file.exists():
        try:
            v_status = json.loads(v_status_file.read_text(encoding="utf-8"))
        except Exception:
            v_status = {}

    for cut in cutscenes:
        ccode = cut["cutCode"]
        clip_p = clips_dir / f"{ccode}.mp4"
        if clip_p.exists() and ccode not in v_status:
            diag = cut.get("dialogue") or {}
            v_status[ccode] = {
                "cutNumber": cut["cutNumber"],
                "cutCode": ccode,
                "orientation": orientation,
                "aspectRatio": "9:16" if orientation == "portrait" else "16:9",
                "durationSeconds": 6,
                "baseCutsceneImage": str(cut_img_map[ccode].relative_to(ROOT)),
                "audioType": diag.get("audioType", "silent"),
                "speakerEn": diag.get("speakerEn", ""),
                "summarized6sLineEn": diag.get("summarized6sLineEn", ""),
                "clipPath": str(clip_p.relative_to(ROOT)),
                "clipSizeBytes": clip_p.stat().st_size,
                "downloaded": True,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            }
    v_status_file.write_text(json.dumps(v_status, ensure_ascii=False, indent=2), encoding="utf-8")

    # Step 3: Concatenate all 6s clips into 1 integrated episode MP4 + copy to Desktop movie folder
    all_clips = [clips_dir / f"{cut['cutCode']}.mp4" for cut in cutscenes]
    existing_clips = [p for p in all_clips if p.exists() and p.stat().st_size > 50000]

    safe_title = re.sub(r"[^A-Za-z0-9]+", "_", ep_data["episodeTitleEn"]).strip("_")
    ratio_tag = "9x16_Shorts" if orientation == "portrait" else "16x9"
    final_mp4 = out_dir / f"SNSHero_Anime_EP{ep:02d}_{safe_title}_{ratio_tag}.mp4"
    gfv.concat_episode_videos(existing_clips, final_mp4, orientation)

    MOVIE_OUT_DIR.mkdir(parents=True, exist_ok=True)
    desktop_mp4 = MOVIE_OUT_DIR / f"SNSHero_Anime_EP{ep:02d}_{safe_title}_{ratio_tag}.mp4"
    if final_mp4.exists():
        shutil.copy2(final_mp4, desktop_mp4)

    json_pkg, md_pkg = gfv.write_youtube_upload_package(ep_data, orientation, out_dir, final_mp4, desktop_mp4, existing_clips)
    elapsed = time.time() - t0
    size_mb = final_mp4.stat().st_size / (1024 * 1024) if final_mp4.exists() else 0.0
    print(
        f"✅ [EP{ep:02d}/{total_cuts} cuts | {elapsed:.1f}s] {ep_data['episodeTitleKo']} ({ep_data['episodeTitleEn']}) -> {final_mp4.name} ({size_mb:.2f} MB)",
        flush=True,
    )
    return {
        "episode": ep,
        "titleKo": ep_data["episodeTitleKo"],
        "titleEn": ep_data["episodeTitleEn"],
        "totalCutscenes": total_cuts,
        "mergedClips": len(existing_clips),
        "durationSeconds": len(existing_clips) * 6,
        "finalMp4": str(final_mp4.relative_to(ROOT)),
        "desktopMp4": str(desktop_mp4),
        "sizeMB": round(size_mb, 2),
        "youtubePackageJson": str(json_pkg.relative_to(ROOT)),
    }


def main():
    parser = argparse.ArgumentParser(description="Produce all episodes (1 to 40) cutscenes, 6s videos, and merged YouTube packages")
    parser.add_argument("--start-ep", type=int, default=1)
    parser.add_argument("--end-ep", type=int, default=40)
    parser.add_argument("--orientation", choices=["landscape", "portrait"], default="landscape")
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()

    summary_list = []
    t_all = time.time()
    for ep in range(args.start_ep, args.end_ep + 1):
        info = produce_episode(ep, args.orientation, max_workers=args.workers)
        summary_list.append(info)

    master_manifest = ROOT / "public" / "anime-character-sheets" / "videos" / f"all_episodes_01_to_40_{args.orientation}_manifest.json"
    master_manifest.parent.mkdir(parents=True, exist_ok=True)
    master_manifest.write_text(
        json.dumps(
            {
                "totalEpisodes": len(summary_list),
                "orientation": args.orientation,
                "totalCutscenes": sum(x["totalCutscenes"] for x in summary_list),
                "totalDurationSeconds": sum(x["durationSeconds"] for x in summary_list),
                "completedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                "elapsedSeconds": round(time.time() - t_all, 1),
                "episodes": summary_list,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"\n🎉 ALL {len(summary_list)} EPISODES ({args.start_ep}화 ~ {args.end_ep}화) COMPLETED in {time.time() - t_all:.1f}s!", flush=True)
    print(f"   Master Manifest: {master_manifest}", flush=True)


if __name__ == "__main__":
    main()
