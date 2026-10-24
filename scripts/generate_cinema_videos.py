#!/usr/bin/env python3
"""
scripts/generate_cinema_videos.py
SNSHero 40-Episode 24fps Live-Action Cinema Theatrical MP4 Engine

Renders all 40 Live-Action Movie episodes (`public/videos/cinema/episode_01.mp4` .. `episode_40.mp4`)
using all 2,009 photorealistic live-action cuts (+ 40 opening title cards = 2,049 WebP scenes)
in `public/images/cinema/episode_01..40/scene_00..XX.webp`:
1. True 24fps cinema frame rate (800x450) with sub-pixel affine/crop camera motion
   (70mm Anamorphic Dolly-In/Out, Tracking Pan L/R, Crane Up, Handheld Breathing, Combat Shake).
2. Smooth 8-frame (0.33s) cross-dissolve transitions between every cut with zero frame loss.
3. Live 24fps atmospheric VFX (blizzard snow, battle fire embers, arcane rune dust, abyssal mist)
   + subtle horizontal blue anamorphic lens flare streaks.
4. Authentic theatrical cinema subtitles (Speaker tag + KO/EN subtitle lines) overlaid cleanly
   above the 2.39:1 CinemaScope letterbox bar + 70mm IMAX timecode HUD.
5. Studio-grade 44.1kHz stereo soundtrack (warm orchestral ambient BGM + English male narrator
   `en-US-ChristopherNeural` from `/Users/dayyoung/Desktop/내문서/movie/improve/`).
"""

import os
import re
import sys
import json
import wave
import math
import shutil
import tempfile
import textwrap
import argparse
import subprocess
import concurrent.futures
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = PROJECT_ROOT / "src" / "content" / "webtoonEpisodeManifest.json"
MAPPING_PATH = PROJECT_ROOT / "src" / "content" / "movieEpisodeMapping.ts"
CINEMA_IMG_DIR = PROJECT_ROOT / "public" / "images" / "cinema"
OUTPUT_DIR = PROJECT_ROOT / "public" / "videos" / "cinema"
IMPROVE_MOVIE_DIR = Path("/Users/dayyoung/Desktop/내문서/movie/improve")

FFMPEG_BIN = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
FFPROBE_BIN = shutil.which("ffprobe") or "/opt/homebrew/bin/ffprobe"

FPS = 24
WIDTH = 800
HEIGHT = 450
LETTERBOX_H = 24

FONT_KO = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
FONT_MONO = "/System/Library/Fonts/Menlo.ttc"


def load_episode_themes() -> dict[int, str]:
    themes: dict[int, str] = {}
    if not MAPPING_PATH.is_file():
        return themes
    content = MAPPING_PATH.read_text(encoding="utf-8")
    ep_blocks = re.findall(r"(\d+):\s*\{([^}]+)\}", content)
    for ep_num_str, body in ep_blocks:
        try:
            ep_num = int(ep_num_str)
            bgm_theme = re.search(r'bgmTheme:\s*["\']([^"\']+)["\']', body)
            if bgm_theme:
                themes[ep_num] = bgm_theme.group(1)
        except Exception:
            continue
    return themes


def build_scrolling_particle_atlas(theme: str) -> tuple[Image.Image, tuple[int, int]]:
    """
    Pre-renders a seamless 1600x900 RGBA atmospheric particle sheet and (vx, vy) per-frame velocity
    at 24fps so every live-action frame has subtle snow, fire embers, starlight motes, or abyssal mist.
    """
    aw, ah = 1600, 900
    atlas = Image.new("RGBA", (aw, ah), (0, 0, 0, 0))
    draw = ImageDraw.Draw(atlas)
    rng = np.random.default_rng(77)

    if theme == "arctic-blizzard":
        color_main = (235, 245, 255)
        color_sub = (185, 220, 250)
        vel = (-8, 5)
        n_dots = 190
    elif theme == "battle-march":
        color_main = (255, 170, 65)
        color_sub = (255, 95, 35)
        vel = (3, -6)
        n_dots = 150
    elif theme == "dark-ominous":
        color_main = (185, 125, 245)
        color_sub = (235, 75, 95)
        vel = (-3, -4)
        n_dots = 135
    elif theme == "triumph-fanfare":
        color_main = (255, 230, 140)
        color_sub = (155, 230, 255)
        vel = (2, -5)
        n_dots = 140
    else:
        color_main = (145, 225, 250)
        color_sub = (195, 245, 215)
        vel = (-2, -3)
        n_dots = 130

    for _ in range(n_dots):
        x = int(rng.integers(0, WIDTH))
        y = int(rng.integers(0, HEIGHT))
        r = int(rng.choice([1, 1, 2, 2, 3]))
        alpha = int(rng.integers(55, 145))
        c = color_main if rng.random() > 0.35 else color_sub
        fill = (c[0], c[1], c[2], alpha)
        for tx in (0, WIDTH):
            for ty in (0, HEIGHT):
                px, py = x + tx, y + ty
                if theme == "arctic-blizzard" and r >= 2:
                    draw.line([(px, py), (px - 4, py + 2)], fill=fill, width=2)
                else:
                    draw.ellipse([px - r, py - r, px + r, py + r], fill=fill)

    return atlas, vel


def prepare_highres_liveaction_source(src_path: Path, is_title: bool) -> Image.Image:
    """
    Loads `public/images/cinema/episode_XX/scene_YY.webp`.
    For narrative cuts (idx >= 1), crops inside the 22px top/bottom letterbox bars so the
    inner 70mm live-action photograph pans and zooms cleanly without moving the letterbox border.
    Upscales to 960x540 (1.20x of 800x450) for smooth 24fps sub-pixel camera motion.
    """
    im = Image.open(src_path).convert("RGB")
    w, h = im.size
    if not is_title and h >= 440:
        im = im.crop((2, 23, w - 2, h - 23))
    return im.resize((960, 540), Image.Resampling.LANCZOS)


def compute_cinema_camera_box(
    scene_idx: int,
    is_title: bool,
    has_impact: bool,
    progress: float,
    frame_in_scene: int,
    global_frame: int,
) -> tuple[float, float, float, float]:
    """
    Computes smooth 24fps sub-pixel floating-point (x0, y0, x1, y1) inside the 960x540 canvas.
    Includes subtle 70mm handheld breathing and damped combat impact shake.
    """
    sw, sh = 960.0, 540.0
    ease = 0.5 - 0.5 * math.cos(math.pi * min(1.0, max(0.0, progress)))

    if is_title:
        scale = 0.96 - 0.05 * ease
        cx = sw * 0.50
        cy = sh * (0.50 + 0.015 * ease)
    else:
        mode = scene_idx % 6
        if mode == 0:
            # 1. Slow Anamorphic Dolly-In toward center-left
            scale = 0.94 - 0.12 * ease
            cx = sw * (0.50 - 0.035 * ease)
            cy = sh * (0.50 - 0.015 * ease)
        elif mode == 1:
            # 2. Wide Pull-Out Reveal
            scale = 0.82 + 0.12 * ease
            cx = sw * (0.53 - 0.03 * ease)
            cy = sh * (0.49 + 0.015 * ease)
        elif mode == 2:
            # 3. Tracking Pan Left -> Right
            scale = 0.85 - 0.02 * ease
            cx = sw * (0.44 + 0.12 * ease)
            cy = sh * 0.50
        elif mode == 3:
            # 4. Tracking Pan Right -> Left
            scale = 0.85 - 0.02 * ease
            cx = sw * (0.56 - 0.12 * ease)
            cy = sh * 0.50
        elif mode == 4:
            # 5. Heroic Crane Up-Right
            scale = 0.87 - 0.05 * ease
            cx = sw * (0.47 + 0.06 * ease)
            cy = sh * (0.53 - 0.06 * ease)
        else:
            # 6. Dramatic Center Push-In
            scale = 0.93 - 0.13 * ease
            cx = sw * 0.50
            cy = sh * (0.51 - 0.025 * ease)

    # Subtle 24fps organic handheld camera breathing
    breath_x = 1.4 * math.sin(global_frame * 0.07) if not is_title else 0.0
    breath_y = 1.0 * math.cos(global_frame * 0.055) if not is_title else 0.0

    # Damped combat impact camera shake
    shake_x = 0.0
    shake_y = 0.0
    if has_impact and 0.15 <= progress <= 0.52:
        dt = progress - 0.15
        decay = math.exp(-10.0 * dt)
        shake_x = 9.5 * decay * math.sin(frame_in_scene * 2.2)
        shake_y = 6.5 * decay * math.cos(frame_in_scene * 2.8)

    win_w = sw * scale
    win_h = sh * scale
    x0 = max(0.0, min(sw - win_w, cx - win_w * 0.5 + breath_x + shake_x))
    y0 = max(0.0, min(sh - win_h, cy - win_h * 0.5 + breath_y + shake_y))
    return (x0, y0, x0 + win_w, y0 + win_h)


def extract_movie_audio_track(
    ep_num: int,
    existing_cinema_mp4: Path,
    ep_dir: Path,
    fallback_durations: list[float],
) -> tuple[Path, list[float]] | None:
    """
    Extracts the 44.1kHz stereo AAC audio track for Episode `ep_num` from:
    1) `/Users/dayyoung/Desktop/내문서/movie/improve/SNSHero com The Movie EP{ep_num:02d} *.mp4`
       (warm orchestral BGM + `en-US-ChristopherNeural` male movie narrator), or
    2) `public/videos/cinema/episode_{ep_num:02d}.mp4` if improve MP4 is unavailable.
    Scales scene durations proportionally (keeping scene_00 title card at 4.0s) so
    total video duration matches the audio track duration to the frame.
    """
    src_mp4: Path | None = None
    if IMPROVE_MOVIE_DIR.is_dir():
        matches = sorted(IMPROVE_MOVIE_DIR.glob(f"SNSHero com The Movie EP{ep_num:02d} *.mp4"))
        if matches and matches[0].stat().st_size > 100_000:
            src_mp4 = matches[0]
    if src_mp4 is None and existing_cinema_mp4.is_file() and existing_cinema_mp4.stat().st_size > 100_000:
        src_mp4 = existing_cinema_mp4
    if src_mp4 is None:
        return None

    try:
        out_m4a = ep_dir / "movie_audio_44k.m4a"
        subprocess.run(
            [
                FFMPEG_BIN, "-y", "-i", str(src_mp4),
                "-vn", "-ac", "2", "-ar", "44100", "-c:a", "aac", "-b:a", "128k",
                str(out_m4a),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        probe_out = subprocess.check_output(
            [
                FFPROBE_BIN, "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(out_m4a),
            ]
        ).decode().strip()
        audio_dur = float(probe_out)
        if audio_dur < 30.0:
            return None

        if len(fallback_durations) <= 1:
            return out_m4a, [audio_dur]

        title_dur = 4.0
        rem_audio = max(20.0, audio_dur - title_dur)
        narr_weights = fallback_durations[1:]
        w_sum = max(1.0, sum(narr_weights))
        aligned = [title_dur] + [max(1.5, w * rem_audio / w_sum) for w in narr_weights]
        diff = audio_dur - sum(aligned)
        aligned[-1] = max(1.5, aligned[-1] + diff)
        return out_m4a, aligned
    except Exception:
        return None


def render_liveaction_episode_frames(
    ep_num: int,
    scenes_meta: list[dict],
    aligned_durations: list[float],
    theme: str,
    ffmpeg_stdin,
):
    """
    Streams 24fps continuous-motion RGB24 frames (800x450) directly into ffmpeg_stdin.
    Includes 8-frame (0.33s) cross-dissolve transitions between consecutive live-action cuts.
    """
    try:
        font_ko_sub = ImageFont.truetype(FONT_KO, 14)
    except Exception:
        font_ko_sub = ImageFont.load_default()
    try:
        font_en_sub = ImageFont.truetype(FONT_MONO, 10)
        font_speaker = ImageFont.truetype(FONT_MONO, 10)
        font_hud = ImageFont.truetype(FONT_MONO, 10)
    except Exception:
        font_en_sub = font_speaker = font_hud = ImageFont.load_default()

    particle_atlas, (vx, vy) = build_scrolling_particle_atlas(theme)
    n_scenes = len(scenes_meta)
    n_narrative = max(1, n_scenes - 1)

    trans_frames = 8  # 0.33s smooth cross-dissolve at 24fps
    scene_frame_counts = [
        max(FPS * 2, int(round(d * FPS)) + (trans_frames if i > 0 else 0))
        for i, d in enumerate(aligned_durations)
    ]

    for sm in scenes_meta:
        sm["highres_art"] = prepare_highres_liveaction_source(sm["src_path"], sm["is_title"])

    def render_single_cut_frame(sm: dict, s_idx: int, f_local: int, n_scene_frames: int, g_frame: int) -> Image.Image:
        progress = f_local / float(max(1, n_scene_frames - 1))
        has_impact = sm["has_impact"]

        box = compute_cinema_camera_box(s_idx, sm["is_title"], has_impact, progress, f_local, g_frame)
        art_frame = sm["highres_art"].resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR, box=box)

        if has_impact and 0.16 <= progress <= 0.26:
            flash_p = 1.0 - (progress - 0.16) / 0.10
            art_frame = ImageEnhance.Brightness(art_frame).enhance(1.0 + 0.22 * flash_p)

        art_rgba = art_frame.convert("RGBA")
        ox = (g_frame * vx) % WIDTH
        oy = (g_frame * vy) % HEIGHT
        p_crop = particle_atlas.crop((ox, oy, ox + WIDTH, oy + HEIGHT))
        art_rgba = Image.alpha_composite(art_rgba, p_crop)

        overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        odraw = ImageDraw.Draw(overlay)

        # Subtle horizontal blue anamorphic lens flare streak
        flare_y = int(HEIGHT * 0.24 + 10 * math.sin(g_frame * 0.025))
        odraw.line([(80, flare_y), (WIDTH - 80, flare_y)], fill=(110, 185, 255, 26), width=2)

        if not sm["is_title"]:
            ko_lines = sm["ko_lines"]
            en_lines = sm["en_lines"]
            if ko_lines or en_lines:
                odraw.rectangle(
                    [44, HEIGHT - LETTERBOX_H - 68, WIDTH - 44, HEIGHT - LETTERBOX_H - 4],
                    fill=(6, 7, 10, 172),
                    outline=(195, 175, 130, 85),
                    width=1,
                )
                if sm["speaker_label"]:
                    odraw.text(
                        (WIDTH // 2, HEIGHT - LETTERBOX_H - 57),
                        sm["speaker_label"],
                        fill=(245, 205, 115, 240),
                        font=font_speaker,
                        anchor="mm",
                    )
                if ko_lines:
                    ko_str = " ".join(ko_lines)
                    odraw.text((WIDTH // 2 + 1, HEIGHT - LETTERBOX_H - 38 + 1), ko_str, fill=(0, 0, 0, 225), font=font_ko_sub, anchor="mm")
                    odraw.text((WIDTH // 2, HEIGHT - LETTERBOX_H - 38), ko_str, fill=(255, 255, 255, 248), font=font_ko_sub, anchor="mm")
                if en_lines:
                    en_str = " ".join(en_lines)
                    odraw.text((WIDTH // 2, HEIGHT - LETTERBOX_H - 18), en_str[:78], fill=(185, 215, 245, 220), font=font_en_sub, anchor="mm")

            # Stationary 2.39:1 CinemaScope Top & Bottom Letterbox Bars
            odraw.rectangle([0, 0, WIDTH, LETTERBOX_H], fill=(5, 5, 7, 255))
            odraw.rectangle([0, HEIGHT - LETTERBOX_H, WIDTH, HEIGHT], fill=(5, 5, 7, 255))
            odraw.line([(0, LETTERBOX_H), (WIDTH, LETTERBOX_H)], fill=(195, 175, 130, 105), width=1)
            odraw.line([(0, HEIGHT - LETTERBOX_H), (WIDTH, HEIGHT - LETTERBOX_H)], fill=(195, 175, 130, 105), width=1)

            cur_sec = int(g_frame / FPS)
            tc_str = f"EP.{ep_num:02d} LIVE-ACTION · CUT {s_idx:02d}/{n_narrative:02d} · {cur_sec // 60:02d}:{cur_sec % 60:02d}:{g_frame % FPS:02d}"
            odraw.text((14, LETTERBOX_H // 2), "SNSHERO CINEMA · 70MM IMAX ANAMORPHIC", fill=(210, 190, 145, 210), font=font_hud, anchor="lm")
            odraw.text((WIDTH - 14, LETTERBOX_H // 2), tc_str, fill=(175, 200, 225, 210), font=font_hud, anchor="rm")

        return Image.alpha_composite(art_rgba, overlay).convert("RGB")

    g_frame = 0
    for s_idx in range(n_scenes):
        sm = scenes_meta[s_idx]
        n_f = scene_frame_counts[s_idx]
        start_f = 0 if s_idx == 0 else trans_frames
        end_f = n_f if s_idx == n_scenes - 1 else (n_f - trans_frames)

        for f_local in range(start_f, end_f):
            frame_img = render_single_cut_frame(sm, s_idx, f_local, n_f, g_frame)
            ffmpeg_stdin.write(frame_img.tobytes())
            g_frame += 1

        if s_idx < n_scenes - 1:
            next_sm = scenes_meta[s_idx + 1]
            next_nf = scene_frame_counts[s_idx + 1]
            for tf in range(trans_frames):
                alpha = (tf + 1) / float(trans_frames + 1)
                f_a = render_single_cut_frame(sm, s_idx, end_f + tf, n_f, g_frame)
                f_b = render_single_cut_frame(next_sm, s_idx + 1, tf, next_nf, g_frame)
                blended = Image.blend(f_a, f_b, alpha)
                ffmpeg_stdin.write(blended.tobytes())
                g_frame += 1

        sm["highres_art"] = None


def generate_single_cinema_episode(
    ep_num: int,
    ep_data: dict,
    theme: str,
    out_mp4_path: str,
    temp_base_dir: str,
) -> dict:
    """Renders a standalone 24fps Live-Action Cinema MP4 for Episode `ep_num` from all ~50 live-action cuts."""
    ep_dir = Path(temp_base_dir) / f"cinema_ep_{ep_num:02d}"
    ep_dir.mkdir(parents=True, exist_ok=True)

    images = ep_data.get("images", [])
    if not images:
        return {"ep_num": ep_num, "status": "FAIL", "error": "No images in manifest"}

    combat_re = re.compile(r"\b(slash|strike|shatter|roar|clash|fire|blast|explod|pierc|blade|spear|sword|ambush)\b", re.I)
    scenes_meta: list[dict] = []
    fallback_durations: list[float] = []

    for idx, sc in enumerate(images):
        img_path = CINEMA_IMG_DIR / f"episode_{ep_num:02d}" / f"scene_{idx:02d}.webp"
        if not img_path.is_file():
            continue

        is_title = idx == 0 or sc.get("type") == "title_card"
        nar_ko = (sc.get("narrationKo") or "").strip()
        nar_en = (sc.get("narrationEn") or "").strip()
        dialogs = sc.get("dialogues") or []

        speaker_ko = ""
        speaker_en = ""
        sub_ko = nar_ko
        sub_en = nar_en
        if dialogs:
            d0 = dialogs[0]
            speaker_ko = d0.get("speakerKo") or ""
            speaker_en = d0.get("speakerEn") or ""
            if d0.get("textKo"):
                sub_ko = f"\"{d0['textKo']}\""
            if d0.get("textEn"):
                sub_en = f"\"{d0['textEn']}\""

        speaker_label = ""
        if speaker_ko or speaker_en:
            if speaker_ko and speaker_en and speaker_ko != speaker_en:
                speaker_label = f"[ {speaker_ko} · {speaker_en.upper()} ]"
            else:
                speaker_label = f"[ {(speaker_ko or speaker_en).upper()} ]"

        ko_lines = textwrap.wrap(sub_ko, width=38)[:1] if sub_ko else []
        en_lines = textwrap.wrap(sub_en, width=64)[:1] if sub_en else []

        has_impact = bool(sc.get("sfxCues")) or bool(combat_re.search(sub_en))
        word_count = len((sub_en or nar_en).split())
        dur = 4.0 if is_title else (2.4 + min(word_count * 0.05, 1.4))

        scenes_meta.append(
            {
                "src_path": img_path,
                "is_title": is_title,
                "speaker_label": speaker_label,
                "ko_lines": ko_lines,
                "en_lines": en_lines,
                "has_impact": has_impact,
                "highres_art": None,
            }
        )
        fallback_durations.append(dur)

    if not scenes_meta:
        shutil.rmtree(ep_dir, ignore_errors=True)
        return {"ep_num": ep_num, "status": "FAIL", "error": "Zero live-action scenes found"}

    existing_mp4 = Path(out_mp4_path)
    extracted = extract_movie_audio_track(ep_num, existing_mp4, ep_dir, fallback_durations)
    if extracted is None:
        shutil.rmtree(ep_dir, ignore_errors=True)
        return {"ep_num": ep_num, "status": "FAIL", "error": "Could not extract audio track"}

    audio_m4a_path, aligned_durations = extracted
    tmp_out_mp4 = ep_dir / f"liveaction_ep_{ep_num:02d}.mp4"

    cmd = [
        FFMPEG_BIN, "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",
        "-i", str(audio_m4a_path),
        "-c:v", "libx264", "-preset", "veryfast",
        "-crf", "23", "-maxrate", "850k", "-bufsize", "1700k",
        "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        "-shortest",
        "-movflags", "+faststart",
        str(tmp_out_mp4),
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        render_liveaction_episode_frames(ep_num, scenes_meta, aligned_durations, theme, proc.stdin)
        proc.stdin.close()
    except Exception as e:
        proc.kill()
        shutil.rmtree(ep_dir, ignore_errors=True)
        return {"ep_num": ep_num, "status": "FAIL", "error": f"Frame pipe error: {e}"}

    stderr_bytes = proc.stderr.read()
    ret = proc.wait()

    if ret != 0 or not tmp_out_mp4.is_file():
        shutil.rmtree(ep_dir, ignore_errors=True)
        return {"ep_num": ep_num, "status": "FAIL", "error": f"FFmpeg failed: {stderr_bytes.decode('utf-8', 'ignore')[:200]}"}

    shutil.move(str(tmp_out_mp4), str(out_mp4_path))
    shutil.rmtree(ep_dir, ignore_errors=True)

    probe_cmd = [
        FFPROBE_BIN, "-v", "error",
        "-show_entries", "format=duration,size:stream=codec_name,width,height,sample_rate",
        "-of", "json", str(out_mp4_path),
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
        "duration": sum(aligned_durations),
        "size": os.path.getsize(out_mp4_path),
    }


def main():
    parser = argparse.ArgumentParser(description="SNSHero 40-Episode 24fps Live-Action Movie MP4 Generator (2,009 Cuts)")
    parser.add_argument("--episodes", type=str, default="all", help="Comma-separated episode numbers or 'all'")
    parser.add_argument("--workers", type=int, default=6, help="Concurrent worker processes (default: 6)")
    args = parser.parse_args()

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    themes = load_episode_themes()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.episodes == "all":
        targets = list(range(1, 41))
    else:
        targets = [int(x.strip()) for x in args.episodes.split(",") if x.strip()]

    print("======================================================================")
    print("  SNSHero 40-Episode 24fps Live-Action Cinema Movie Generator")
    print("  Source: 2,009 Photorealistic Live-Action Cuts (+ 40 Title Cards)")
    print("======================================================================")
    print(f"Targets        : {len(targets)} episodes ({targets[0]}..{targets[-1]})")
    print(f"Concurrency    : {args.workers} workers | Frame Rate: {FPS} fps CinemaScope")
    print(f"Output Dir     : {OUTPUT_DIR}")
    print("======================================================================\n")

    temp_base = tempfile.mkdtemp(prefix="snshero_liveaction_mp4_")
    results = []

    try:
        with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as executor:
            future_to_ep = {}
            for ep_num in targets:
                ep_data = manifest.get(str(ep_num))
                if not ep_data:
                    continue
                theme = themes.get(ep_num, "arctic-blizzard")
                out_path = OUTPUT_DIR / f"episode_{ep_num:02d}.mp4"
                future = executor.submit(
                    generate_single_cinema_episode,
                    ep_num, ep_data, theme, str(out_path), temp_base,
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
                            f"  ✓ [DONE] Live-Action episode_{ep_num:02d}.mp4 ({cuts} cuts): "
                            f"{dur:.1f}s | {size_mb:.2f} MB | h264 24fps / aac@44100Hz",
                            flush=True,
                        )
                    else:
                        print(f"  ✗ [FAIL] episode_{ep_num:02d}.mp4: {res.get('error')}", flush=True)
                except Exception as ex:
                    print(f"  ✗ [EXCEPTION] episode_{ep_num:02d}: {ex}", flush=True)
                    results.append({"ep_num": ep_num, "status": "FAIL", "error": str(ex)})
    finally:
        shutil.rmtree(temp_base, ignore_errors=True)

    passed = [r for r in results if r.get("status") == "PASS"]
    failed = [r for r in results if r.get("status") != "PASS"]
    total_cuts = sum(r.get("cuts", 0) for r in passed)
    print("\n----------------------------------------------------------------------")
    print(f"  Live-Action Movie Generation Complete: {len(passed)} / {len(targets)} Succeeded ({total_cuts} narrative cuts)")
    print("----------------------------------------------------------------------")

    if failed:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
