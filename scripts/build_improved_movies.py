#!/usr/bin/env python3
"""
Remaster & Improve All 40 SNSHero Movie Episodes + Full Theatrical Edition.

Improvements performed:
1. Normalize cut durations for EP07, EP08, and EP09 from 10s cuts down to 8.0s cuts
   (20 cuts * 8.0s = 160.0s body, 1280x720, 24fps, h264 High L3.1, no embedded subtitle stream).
2. Prepend a 4.0s cinematic black-screen Episode Number & Title card (with fade-in/out)
   at the beginning of every episode (total episode duration = 164.0s).
3. Strip the inconsistent/noisy original video audio and replace it with:
   - A warm, soft, consistent ambient orchestral background music track (BGM)
   - An English male voice actor (edge-tts `en-US-ChristopherNeural`) reading the episode's
     story chronologically across all 20 scenes.
4. Concatenate Opening Credits + all 40 improved episodes + Ending Credits into a single
   Full Theatrical Edition movie in `/Users/dayyoung/Desktop/내문서/movie/improve/`.
"""

import asyncio
import glob
import json
import math
import os
import re
import shutil
import subprocess
import sys
import time
import wave
from pathlib import Path
from typing import Dict, List, Tuple

import edge_tts
import numpy as np
from PIL import Image, ImageDraw, ImageFont

MOVIE_DIR = Path("/Users/dayyoung/Desktop/내문서/movie")
IMPROVE_DIR = MOVIE_DIR / "improve"
WORK_DIR = Path("/tmp/snshero_movie_improve_work")
FLOW_EP_DIR = MOVIE_DIR / "flow_episodes"
NARRATION_JSON_DIR = Path("/Users/dayyoung/project/snshero/public/book/image_narrations")
ENGLISH_TXT_DIR = NARRATION_JSON_DIR / "english_txt"

FONT_SERIF_BOLD = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
FONT_SERIF_REG = "/System/Library/Fonts/Supplemental/Georgia.ttf"
FONT_KR = "/System/Library/Fonts/AppleSDGothicNeo.ttc"

VOICE_NAME = "en-US-ChristopherNeural"


def log(msg: str) -> None:
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def get_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ]
    ).decode().strip()
    return float(out)


def find_source_episodes() -> Dict[int, Tuple[Path, str, str]]:
    """
    Returns dict mapping ep_num (1..40) -> (source_mp4_path, title_en, title_ko)
    """
    mp4_files = list(MOVIE_DIR.glob("SNSHero com The Movie EP*.mp4"))
    ep_map: Dict[int, Path] = {}
    for p in mp4_files:
        m = re.search(r"EP(\d+)\s+(.+)\.mp4$", p.name)
        if m:
            ep_num = int(m.group(1))
            ep_map[ep_num] = p

    result: Dict[int, Tuple[Path, str, str]] = {}
    for ep in range(1, 41):
        if ep not in ep_map:
            raise FileNotFoundError(f"Missing source MP4 for EP{ep:02d} in {MOVIE_DIR}")
        src_p = ep_map[ep]
        m = re.search(r"EP\d+\s+(.+)\.mp4$", src_p.name)
        title_en = m.group(1).strip() if m else f"Episode {ep}"
        title_ko = ""
        nar_json = NARRATION_JSON_DIR / f"episode_{ep:02d}_narrations.json"
        if nar_json.exists():
            try:
                data = json.loads(nar_json.read_text(encoding="utf-8"))
                title_en = data.get("episodeTitleEn") or title_en
                title_ko = data.get("episodeTitleKo") or ""
            except Exception:
                pass
        result[ep] = (src_p, title_en, title_ko)
    return result


def generate_soft_ambient_bgm(out_wav: Path, duration_sec: float = 180.0, sr: int = 48000) -> None:
    """
    Synthesizes a warm, gentle, cinematic fantasy ambient soundtrack (stereo 48kHz WAV).
    Uses slow evolving string/pad chords in D minor / F major / Bb major / A minor
    with gentle harp/celesta overtones and a warm low-pass filter so it sits naturally
    behind a male narrator without ever clashing with voice frequencies.
    """
    if out_wav.exists() and out_wav.stat().st_size > 1000000:
        log(f"Reusing existing BGM track: {out_wav}")
        return

    log(f"Synthesizing soft ambient orchestral BGM ({duration_sec:.0f}s, {sr}Hz stereo)...")
    n_samples = int(duration_sec * sr)
    t = np.linspace(0.0, duration_sec, n_samples, endpoint=False, dtype=np.float32)

    # 6-chord progression cycling smoothly every 8 seconds (48s full cycle)
    # Frequencies in Hz (low cello bass + warm middle strings + soft high fifth)
    chords = [
        # Dm9: D2, A2, D3, F3, A3, E4
        [73.42, 110.00, 146.83, 174.61, 220.00, 329.63],
        # Bbmaj7: Bb1, F2, Bb2, D3, F3, A3
        [58.27, 87.31, 116.54, 146.83, 174.61, 220.00],
        # Fmaj7: F1, C2, F2, A2, C3, E3
        [43.65, 65.41, 87.31, 110.00, 130.81, 164.81],
        # Cadd9: C2, G2, C3, E3, G3, D4
        [65.41, 98.00, 130.81, 164.81, 196.00, 293.66],
        # Gm7: G1, D2, G2, Bb2, D3, F3
        [49.00, 73.42, 98.00, 116.54, 146.83, 174.61],
        # Am7: A1, E2, A2, C3, E3, G3
        [55.00, 82.41, 110.00, 130.81, 164.81, 196.00],
    ]

    chord_len = 8.0
    left = np.zeros(n_samples, dtype=np.float32)
    right = np.zeros(n_samples, dtype=np.float32)

    # Slow LFO for gentle stereo breathing
    lfo_l = 1.0 + 0.08 * np.sin(2.0 * math.pi * 0.11 * t)
    lfo_r = 1.0 + 0.08 * np.cos(2.0 * math.pi * 0.11 * t)

    num_steps = int(math.ceil(duration_sec / chord_len)) + 1
    for step in range(num_steps):
        c_idx = step % len(chords)
        freqs = chords[c_idx]
        center_t = step * chord_len
        # Raised-cosine window spanning [center_t - chord_len, center_t + chord_len] for 100% smooth crossfade
        start_t = max(0.0, center_t - chord_len)
        end_t = min(duration_sec, center_t + chord_len)
        i0 = int(start_t * sr)
        i1 = int(end_t * sr)
        if i1 <= i0:
            continue
        seg_t = t[i0:i1]
        rel = (seg_t - center_t) / chord_len  # in [-1, 1]
        env = 0.5 * (1.0 + np.cos(math.pi * np.clip(rel, -1.0, 1.0)))

        seg_l = np.zeros_like(seg_t)
        seg_r = np.zeros_like(seg_t)
        voice_weights = [0.32, 0.24, 0.20, 0.16, 0.12, 0.08]
        for v_i, (f, w) in enumerate(zip(freqs, voice_weights)):
            # Slight detune between L and R for warm orchestral ensemble width
            detune = 1.0012 if (v_i % 2 == 0) else 0.9988
            vib = 0.0015 * np.sin(2.0 * math.pi * (3.2 + 0.3 * v_i) * seg_t)
            phase_l = 2.0 * math.pi * f * (seg_t + vib)
            phase_r = 2.0 * math.pi * (f * detune) * (seg_t - vib)
            # Fundamental + soft 2nd harmonic
            tone_l = np.sin(phase_l) + 0.22 * np.sin(2.0 * phase_l + 0.4)
            tone_r = np.sin(phase_r + 0.3) + 0.22 * np.sin(2.0 * phase_r + 0.9)
            seg_l += w * tone_l
            seg_r += w * tone_r

        # Gentle harp/celesta arpeggio notes on beats
        arp_freqs = [freqs[2] * 2.0, freqs[3] * 2.0, freqs[4] * 2.0, freqs[5] * 2.0]
        for n_i, af in enumerate(arp_freqs):
            note_start = center_t - 0.5 * chord_len + n_i * (chord_len / 4.0)
            ni0 = max(i0, int(note_start * sr))
            ni1 = min(i1, int((note_start + 3.5) * sr))
            if ni1 > ni0:
                nt = t[ni0:ni1] - note_start
                # Soft pluck attack (80ms) + exponential decay
                n_env = (1.0 - np.exp(-nt / 0.08)) * np.exp(-nt / 1.4)
                n_wave = 0.045 * n_env * np.sin(2.0 * math.pi * af * nt)
                if n_i % 2 == 0:
                    left[ni0:ni1] += n_wave * 1.1
                    right[ni0:ni1] += n_wave * 0.7
                else:
                    left[ni0:ni1] += n_wave * 0.7
                    right[ni0:ni1] += n_wave * 1.1

        left[i0:i1] += env * seg_l
        right[i0:i1] += env * seg_r

    left *= lfo_l
    right *= lfo_r

    # Normalize to peak 0.85
    peak = max(float(np.max(np.abs(left))), float(np.max(np.abs(right))), 1e-6)
    left = (left / peak) * 0.85
    right = (right / peak) * 0.85

    stereo = np.empty((n_samples, 2), dtype=np.int16)
    stereo[:, 0] = np.clip(left * 32767.0, -32768, 32767).astype(np.int16)
    stereo[:, 1] = np.clip(right * 32767.0, -32768, 32767).astype(np.int16)

    out_wav.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out_wav), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(stereo.tobytes())
    log(f"BGM synthesized: {out_wav} ({out_wav.stat().st_size / (1024*1024):.1f} MB)")


def draw_centered_text(
    draw: ImageDraw.ImageDraw,
    y: int,
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: Tuple[int, int, int],
    width: int = 1280,
) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (width - tw) // 2
    draw.text((x, y), text, font=font, fill=fill)
    return th


def render_episode_title_card_mp4(
    ep_num: int,
    title_en: str,
    title_ko: str,
    out_mp4: Path,
    duration: float = 4.0,
) -> None:
    """
    Renders a 4.0-second 1280x720 24fps black-screen Episode Intro Card with
    smooth fade-in (0.0s..0.8s) and fade-out (3.2s..4.0s), encoded with exact
    h264 High L3.1 1/12288 parameters for instant lossless stream concat.
    """
    img = Image.new("RGB", (1280, 720), (0, 0, 0))
    draw = ImageDraw.Draw(img)

    font_top = get_font(FONT_SERIF_REG, 20)
    font_ep = get_font(FONT_SERIF_BOLD, 56)
    font_title = get_font(FONT_SERIF_BOLD, 42)
    font_ko = get_font(FONT_KR, 28)

    # Top series label
    draw_centered_text(draw, 195, "S N S H E R O . C O M     T H E   M O V I E", font_top, (175, 155, 110))

    # Episode number
    ep_label = f"EPISODE {ep_num:02d}"
    draw_centered_text(draw, 255, ep_label, font_ep, (245, 240, 230))

    # Decorative gold horizontal line + center diamond
    line_y = 345
    draw.line([(420, line_y), (625, line_y)], fill=(180, 150, 95), width=2)
    draw.polygon([(640, line_y - 6), (646, line_y), (640, line_y + 6), (634, line_y)], fill=(215, 185, 120))
    draw.line([(655, line_y), (860, line_y)], fill=(180, 150, 95), width=2)

    # English Episode Title (wrap if very long)
    if len(title_en) > 38:
        font_title = get_font(FONT_SERIF_BOLD, 36)
    draw_centered_text(draw, 380, title_en, font_title, (255, 252, 245))

    # Korean Episode Title subtitle
    if title_ko:
        draw_centered_text(draw, 455, f"제{ep_num}화 · {title_ko}", font_ko, (185, 185, 190))

    png_path = out_mp4.with_suffix(".png")
    img.save(png_path)

    fade_out_start = max(0.0, duration - 0.8)
    vf = f"fade=t=in:st=0:d=0.8,fade=t=out:st={fade_out_start:.2f}:d=0.8,format=yuv420p"
    cmd = [
        "ffmpeg",
        "-y",
        "-loop",
        "1",
        "-t",
        f"{duration:.2f}",
        "-r",
        "24",
        "-i",
        str(png_path),
        "-vf",
        vf,
        "-c:v",
        "libx264",
        "-profile:v",
        "high",
        "-level:v",
        "3.1",
        "-pix_fmt",
        "yuv420p",
        "-r",
        "24",
        "-video_track_timescale",
        "12288",
        "-crf",
        "18",
        "-an",
        str(out_mp4),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def clean_sentence_for_tts(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    # Replace double quotes so narrator reads smoothly as third-person storyteller
    text = text.replace('"', "").replace("“", "").replace("”", "")
    text = text.replace("—", ", ")
    return text.strip()


def build_episode_story_script(ep_num: int, title_en: str) -> str:
    """
    Builds a cohesive, chronological ~325-345 word English storytelling script
    across the 20 scenes of the episode so the male voice actor narrates the full
    story arc from beginning to end across the 160-second video body.
    """
    sb_path = FLOW_EP_DIR / f"ep{ep_num:02d}" / "storyboard.json"
    scenes_text: List[str] = []

    if sb_path.exists():
        scenes = json.loads(sb_path.read_text(encoding="utf-8"))
        for sc in scenes:
            raw = sc.get("narrationEn") or sc.get("dialogueEn") or ""
            raw = clean_sentence_for_tts(raw)
            if not raw:
                continue
            # Split into sentences and take the first 1-2 sentences (~16-18 words per scene)
            sents = re.split(r"(?<=[.!?])\s+", raw)
            chosen: List[str] = []
            w_count = 0
            for s in sents:
                s = s.strip()
                if not s:
                    continue
                words = s.split()
                if w_count == 0 and len(words) > 22:
                    # Trim overly long compound sentence at a comma or clause boundary near 17 words
                    clause = " ".join(words[:18]).rstrip(",;:") + "."
                    chosen.append(clause)
                    w_count += 18
                    break
                elif w_count + len(words) <= 19 or w_count == 0:
                    chosen.append(s)
                    w_count += len(words)
                else:
                    break
            if chosen:
                scenes_text.append(" ".join(chosen))

    # Fallback to english_txt if storyboard wasn't found
    if not scenes_text:
        txt_files = sorted(ENGLISH_TXT_DIR.glob(f"SNSHero_Novel_Episode_{ep_num:02d}_*_EN.txt"))
        if txt_files:
            lines = [
                clean_sentence_for_tts(line)
                for line in txt_files[0].read_text(encoding="utf-8").splitlines()
                if len(line.strip()) > 30
            ]
            step = max(1, len(lines) // 16)
            for i in range(0, len(lines), step):
                words = lines[i].split()[:20]
                scenes_text.append(" ".join(words).rstrip(",;:") + ".")
                if len(scenes_text) >= 18:
                    break

    # Cap total body word count around 335 words so it speaks naturally in ~135-148s
    body_paragraphs: List[str] = []
    total_words = 0
    for chunk in scenes_text:
        w = len(chunk.split())
        if total_words + w > 345 and total_words >= 290:
            break
        body_paragraphs.append(chunk)
        total_words += w

    return "\n\n".join(body_paragraphs)


async def synthesize_voice_mp3(text: str, out_mp3: Path, rate: str = "-4%") -> None:
    """
    Uses edge-tts (`en-US-ChristopherNeural`) with automatic retry,
    and falls back to macOS `say -v Daniel` only if all retries fail.
    """
    out_mp3.parent.mkdir(parents=True, exist_ok=True)
    last_err = None
    for attempt in range(5):
        try:
            comm = edge_tts.Communicate(text, voice=VOICE_NAME, rate=rate)
            await comm.save(str(out_mp3))
            if out_mp3.exists() and out_mp3.stat().st_size > 1000:
                return
        except Exception as e:
            last_err = e
            await asyncio.sleep(1.5 * (attempt + 1))

    log(f"WARN: edge-tts failed after retries ({last_err}), falling back to macOS Daniel voice for {out_mp3.name}")
    aiff_path = out_mp3.with_suffix(".aiff")
    subprocess.run(["say", "-v", "Daniel", "-r", "155", "-o", str(aiff_path), text], check=True)
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(aiff_path), "-c:a", "libmp3lame", "-q:a", "2", str(out_mp3)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    aiff_path.unlink(missing_ok=True)


def normalize_video_body_160s(ep_num: int, src_mp4: Path, out_silent_mp4: Path) -> None:
    """
    Produces a 160.0s (20 * 8.0s), 1280x720, 24fps, h264 High L3.1 (timescale 12288)
    silent video body for the given episode.
    - For EP07: uses clip_01..clip_18 (8s each) + trims [144..152s] and [154..162s] from src_mp4.
    - For EP08 & EP09 (200s = 20 * 10s cuts): trims [i*10 .. i*10+8] for i in 0..19 from src_mp4.
    - For all other 37 episodes (already 160.0s, 1280x720, 24fps, h264 High L3.1): strips audio/subs via `-c:v copy -an -sn`.
    """
    if out_silent_mp4.exists() and out_silent_mp4.stat().st_size > 5_000_000:
        dur = probe_duration(out_silent_mp4)
        if 159.5 <= dur <= 160.5:
            return

    out_silent_mp4.parent.mkdir(parents=True, exist_ok=True)

    if ep_num == 7:
        log("Normalizing EP07: trimming scenes 19 & 20 from 10s -> 8s and matching 1280x720 24fps...")
        ep7_tmp = WORK_DIR / "ep07_clips"
        ep7_tmp.mkdir(parents=True, exist_ok=True)
        clip_paths: List[Path] = []
        for idx in range(1, 19):
            c_src = FLOW_EP_DIR / "ep07" / f"clip_{idx:02d}.mp4"
            c_dst = ep7_tmp / f"clip_{idx:02d}_silent.mp4"
            subprocess.run(
                ["ffmpeg", "-y", "-i", str(c_src), "-c:v", "copy", "-an", "-sn", str(c_dst)],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            clip_paths.append(c_dst)

        # Scenes 19 (144..152s) and 20 (154..162s)
        for idx, start_sec in [(19, 144.0), (20, 154.0)]:
            c_dst = ep7_tmp / f"clip_{idx:02d}_silent.mp4"
            cmd = [
                "ffmpeg",
                "-y",
                "-ss",
                f"{start_sec:.2f}",
                "-t",
                "8.00",
                "-i",
                str(src_mp4),
                "-vf",
                "scale=1280:720:flags=lanczos,fps=24,format=yuv420p",
                "-c:v",
                "libx264",
                "-profile:v",
                "high",
                "-level:v",
                "3.1",
                "-pix_fmt",
                "yuv420p",
                "-r",
                "24",
                "-video_track_timescale",
                "12288",
                "-crf",
                "18",
                "-an",
                "-sn",
                str(c_dst),
            ]
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            clip_paths.append(c_dst)

        list_file = ep7_tmp / "concat.txt"
        list_file.write_text("\n".join(f"file '{p}'" for p in clip_paths) + "\n", encoding="utf-8")
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(list_file),
                "-c:v",
                "copy",
                "-an",
                "-sn",
                str(out_silent_mp4),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return

    if ep_num in (8, 9):
        log(f"Normalizing EP{ep_num:02d}: trimming all 20 cuts from 10s -> 8s (200s -> 160s, 1280x720 24fps)...")
        ep_tmp = WORK_DIR / f"ep{ep_num:02d}_clips"
        ep_tmp.mkdir(parents=True, exist_ok=True)
        clip_paths = []
        for idx in range(20):
            start_sec = idx * 10.0
            c_dst = ep_tmp / f"clip_{idx+1:02d}_silent.mp4"
            cmd = [
                "ffmpeg",
                "-y",
                "-ss",
                f"{start_sec:.2f}",
                "-t",
                "8.00",
                "-i",
                str(src_mp4),
                "-vf",
                "scale=1280:720:flags=lanczos,fps=24,format=yuv420p",
                "-c:v",
                "libx264",
                "-profile:v",
                "high",
                "-level:v",
                "3.1",
                "-pix_fmt",
                "yuv420p",
                "-r",
                "24",
                "-video_track_timescale",
                "12288",
                "-crf",
                "18",
                "-an",
                "-sn",
                str(c_dst),
            ]
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            clip_paths.append(c_dst)

        list_file = ep_tmp / "concat.txt"
        list_file.write_text("\n".join(f"file '{p}'" for p in clip_paths) + "\n", encoding="utf-8")
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(list_file),
                "-c:v",
                "copy",
                "-an",
                "-sn",
                str(out_silent_mp4),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return

    # Standard 160s 1280x720 24fps episode: lossless video stream copy stripping original audio & subs
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(src_mp4), "-c:v", "copy", "-an", "-sn", str(out_silent_mp4)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def build_episode_audio_mix(
    title_tts_mp3: Path,
    story_tts_mp3: Path,
    bgm_wav: Path,
    out_m4a: Path,
    total_duration: float = 164.0,
) -> None:
    """
    Combines:
    - BGM (soft ambient pad at volume 0.14 with 1.5s fade-in and 2.5s fade-out)
    - Title narration at t = 0.6s (during the 4.0s intro card)
    - Story narration at t = 4.6s (if story_tts duration > 155.0s, applies slight atempo so it finishes cleanly before 160.5s)
    Outputs stereo 48kHz AAC (192k) of exact `total_duration` seconds.
    """
    story_dur = probe_duration(story_tts_mp3)
    max_story_dur = total_duration - 7.5  # 156.5s max so there's a gentle tail before fade-out
    atempo_filter = ""
    if story_dur > max_story_dur:
        tempo = min(1.25, (story_dur / max_story_dur) * 1.02)
        atempo_filter = f"atempo={tempo:.3f},"

    fade_out_st = total_duration - 2.5
    filter_complex = (
        f"[0:a]volume=0.14,afade=t=in:st=0:d=1.5,afade=t=out:st={fade_out_st:.2f}:d=2.5[bgm];"
        f"[1:a]volume=1.35,adelay=600|600[title_vo];"
        f"[2:a]{atempo_filter}volume=1.35,adelay=4600|4600[story_vo];"
        f"[bgm][title_vo][story_vo]amix=inputs=3:duration=first:dropout_transition=0:normalize=0,"
        f"alimiter=limit=0.95[aout]"
    )

    cmd = [
        "ffmpeg",
        "-y",
        "-t",
        f"{total_duration:.2f}",
        "-i",
        str(bgm_wav),
        "-i",
        str(title_tts_mp3),
        "-i",
        str(story_tts_mp3),
        "-filter_complex",
        filter_complex,
        "-map",
        "[aout]",
        "-ac",
        "2",
        "-ar",
        "48000",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-t",
        f"{total_duration:.2f}",
        str(out_m4a),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def render_credit_card_mp4(
    lines: List[Tuple[str, int, Tuple[int, int, int], bool]],
    out_mp4: Path,
    duration: float = 4.0,
) -> None:
    """
    Renders a single 1280x720 24fps black-screen credit slide with fade-in and fade-out.
    Each tuple in `lines` is (text, font_size, rgb_color, is_korean).
    """
    img = Image.new("RGB", (1280, 720), (0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Compute total vertical height for centering
    spacing = 18
    rendered_fonts = []
    total_h = 0
    for text, fsize, color, is_kr in lines:
        if not text:
            rendered_fonts.append((text, None, color, 22))
            total_h += 22
            continue
        fpath = FONT_KR if is_kr else FONT_SERIF_BOLD
        font = get_font(fpath, fsize)
        bbox = draw.textbbox((0, 0), text, font=font)
        th = bbox[3] - bbox[1]
        rendered_fonts.append((text, font, color, th))
        total_h += th + spacing

    cur_y = max(60, (720 - total_h) // 2)
    for text, font, color, th in rendered_fonts:
        if text and font is not None:
            draw_centered_text(draw, cur_y, text, font, color)
        cur_y += th + spacing

    png_path = out_mp4.with_suffix(".png")
    img.save(png_path)

    fade_out_st = max(0.0, duration - 0.8)
    vf = f"fade=t=in:st=0:d=0.8,fade=t=out:st={fade_out_st:.2f}:d=0.8,format=yuv420p"
    cmd = [
        "ffmpeg",
        "-y",
        "-loop",
        "1",
        "-t",
        f"{duration:.2f}",
        "-r",
        "24",
        "-i",
        str(png_path),
        "-vf",
        vf,
        "-c:v",
        "libx264",
        "-profile:v",
        "high",
        "-level:v",
        "3.1",
        "-pix_fmt",
        "yuv420p",
        "-r",
        "24",
        "-video_track_timescale",
        "12288",
        "-crf",
        "18",
        "-an",
        str(out_mp4),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


async def build_opening_and_ending_credits(
    ep_info: Dict[int, Tuple[Path, str, str]],
    bgm_wav: Path,
) -> Tuple[Path, Path]:
    """
    Creates:
    1. `opening_credits_final.mp4` (16.0s, 4 slides * 4s, with BGM + English male intro narration)
    2. `ending_credits_final.mp4` (24.0s, 6 slides * 4s, with BGM + English male closing narration)
    Both match the exact 1280x720 24fps h264 High L3.1 + 48kHz stereo AAC spec for lossless concat.
    """
    credits_dir = WORK_DIR / "credits"
    credits_dir.mkdir(parents=True, exist_ok=True)

    # --- OPENING CREDITS (16.0s = 4 cards * 4.0s) ---
    open_cards_spec = [
        [
            ("S N S H E R O . C O M     P R E S E N T S", 24, (185, 160, 110), False),
            ("", 0, (0, 0, 0), False),
            ("AN ORIGINAL DARK FANTASY FEATURE CHRONICLE", 34, (245, 242, 235), False),
            ("SNS히어로 공식 오리지널 판타지 대서사시", 24, (175, 175, 180), True),
        ],
        [
            ("S N S H E R O . C O M", 26, (185, 160, 110), False),
            ("THE MOVIE", 64, (255, 250, 240), False),
            ("THE COMPLETE 40-EPISODE THEATRICAL EDITION", 24, (210, 190, 145), False),
            ("천하제일 영웅전 · 전 40화 통합 극장판", 26, (185, 185, 190), True),
        ],
        [
            ("FEATURING THE LEGENDS OF THE CONTINENT", 22, (185, 160, 110), False),
            ("", 0, (0, 0, 0), False),
            ("KADAN   ·   IGNIS   ·   CELIA   ·   ALIA", 32, (245, 242, 235), False),
            ("ALEKSANDAR   ·   BALIAN   ·   HERCUL   ·   GILGAMESH", 26, (215, 210, 200), False),
            ("FENRIR   ·   MALFUON   ·   PEGASUS   ·   LUCIAN", 24, (185, 180, 175), False),
        ],
        [
            ("PRODUCED & DIRECTED BY SNSHERO STUDIO", 22, (185, 160, 110), False),
            ("", 0, (0, 0, 0), False),
            ("“Two vows forged beneath the blizzard shall awaken destiny.”", 30, (245, 240, 230), False),
            ("눈보라 아래 맺어진 두 개의 맹세가 대륙의 운명을 깨운다", 24, (175, 175, 180), True),
        ],
    ]

    open_card_mp4s: List[Path] = []
    for i, spec in enumerate(open_cards_spec, start=1):
        c_mp4 = credits_dir / f"open_card_{i:02d}.mp4"
        render_credit_card_mp4(spec, c_mp4, duration=4.0)
        open_card_mp4s.append(c_mp4)

    open_concat_txt = credits_dir / "open_concat.txt"
    open_concat_txt.write_text("\n".join(f"file '{p}'" for p in open_card_mp4s) + "\n", encoding="utf-8")
    open_video_silent = credits_dir / "open_video_silent.mp4"
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(open_concat_txt), "-c:v", "copy", str(open_video_silent)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    open_tts_mp3 = credits_dir / "open_tts.mp3"
    open_narration = (
        "S N S Hero dot com presents: S N S Hero, The Movie. "
        "The Complete Forty-Episode Theatrical Chronicle. "
        "When two sacred vows are forged beneath the northern blizzard, "
        "a generation of heroes rises to defy the shadows."
    )
    await synthesize_voice_mp3(open_tts_mp3=open_tts_mp3, text=open_narration, rate="-5%") if False else await synthesize_voice_mp3(open_narration, open_tts_mp3, rate="-5%")

    open_final_mp4 = credits_dir / "opening_credits_final.mp4"
    open_fc = (
        "[1:a]volume=0.18,afade=t=in:st=0:d=1.5,afade=t=out:st=13.5:d=2.5[bgm];"
        "[2:a]volume=1.35,adelay=1000|1000[vo];"
        "[bgm][vo]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95[aout]"
    )
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(open_video_silent),
            "-t",
            "16.0",
            "-i",
            str(bgm_wav),
            "-i",
            str(open_tts_mp3),
            "-filter_complex",
            open_fc,
            "-map",
            "0:v:0",
            "-map",
            "[aout]",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-ar",
            "48000",
            "-ac",
            "2",
            "-t",
            "16.0",
            str(open_final_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # --- ENDING CREDITS (24.0s = 6 cards * 4.0s) ---
    def ep_group_lines(start_ep: int, end_ep: int, header: str) -> List[Tuple[str, int, Tuple[int, int, int], bool]]:
        rows: List[Tuple[str, int, Tuple[int, int, int], bool]] = [
            (header, 22, (185, 160, 110), False),
        ]
        # Pair 2 episodes per line so 14 episodes fit in 7 neat lines
        for e in range(start_ep, end_ep + 1, 2):
            t1 = ep_info[e][1]
            if e + 1 <= end_ep:
                t2 = ep_info[e + 1][1]
                line_str = f"EP{e:02d}  {t1}     |     EP{e+1:02d}  {t2}"
            else:
                line_str = f"EP{e:02d}  {t1}"
            rows.append((line_str, 18, (230, 228, 222), False))
        return rows

    end_cards_spec = [
        [
            ("S N S H E R O . C O M     T H E   M O V I E", 24, (185, 160, 110), False),
            ("", 0, (0, 0, 0), False),
            ("END OF THE 40-EPISODE SAGA", 46, (255, 250, 240), False),
            ("전 40화 대단원의 막 — 새로운 여정을 향하여", 26, (185, 185, 190), True),
        ],
        ep_group_lines(1, 14, "EPISODE CHRONICLE  —  ACT I  (EPISODES 01 – 14)"),
        ep_group_lines(15, 28, "EPISODE CHRONICLE  —  ACT II  (EPISODES 15 – 28)"),
        ep_group_lines(29, 40, "EPISODE CHRONICLE  —  ACT III  (EPISODES 29 – 40)"),
        [
            ("PRODUCTION & CAST CREDITS", 24, (185, 160, 110), False),
            ("", 0, (0, 0, 0), False),
            ("Original Story & Universe   ·   SNSHero.com", 26, (240, 238, 232), False),
            ("English Story Narrator   ·   Christopher (Male Storyteller Voice)", 24, (220, 215, 205), False),
            ("Original Ambient Score   ·   SNSHero Symphonic Suite", 24, (220, 215, 205), False),
            ("Visual Direction & Remastering   ·   SNSHero Cinema Division", 24, (220, 215, 205), False),
        ],
        [
            ("THANK YOU FOR WATCHING", 44, (255, 250, 240), False),
            ("시청해 주셔서 감사합니다", 28, (195, 195, 200), True),
            ("", 0, (0, 0, 0), False),
            ("Experience the AI Card Battle & Full Novel Online", 24, (185, 160, 110), False),
            ("https://snshero.com", 32, (255, 255, 255), False),
        ],
    ]

    end_card_mp4s: List[Path] = []
    for i, spec in enumerate(end_cards_spec, start=1):
        c_mp4 = credits_dir / f"end_card_{i:02d}.mp4"
        render_credit_card_mp4(spec, c_mp4, duration=4.0)
        end_card_mp4s.append(c_mp4)

    end_concat_txt = credits_dir / "end_concat.txt"
    end_concat_txt.write_text("\n".join(f"file '{p}'" for p in end_card_mp4s) + "\n", encoding="utf-8")
    end_video_silent = credits_dir / "end_video_silent.mp4"
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(end_concat_txt), "-c:v", "copy", str(end_video_silent)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    end_tts_mp3 = credits_dir / "end_tts.mp3"
    end_narration = (
        "Thank you for watching S N S Hero: The Movie, the complete forty-episode chronicle. "
        "Though the trials of the four gates have ended, a new horizon awaits our heroes. "
        "Continue the legend and command your own deck of heroes at S N S Hero dot com."
    )
    await synthesize_voice_mp3(end_narration, end_tts_mp3, rate="-5%")

    end_final_mp4 = credits_dir / "ending_credits_final.mp4"
    end_fc = (
        "[1:a]volume=0.18,afade=t=in:st=0:d=1.5,afade=t=out:st=21.0:d=3.0[bgm];"
        "[2:a]volume=1.35,adelay=1200|1200[vo];"
        "[bgm][vo]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95[aout]"
    )
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(end_video_silent),
            "-t",
            "24.0",
            "-i",
            str(bgm_wav),
            "-i",
            str(end_tts_mp3),
            "-filter_complex",
            end_fc,
            "-map",
            "0:v:0",
            "-map",
            "[aout]",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-ar",
            "48000",
            "-ac",
            "2",
            "-t",
            "24.0",
            str(end_final_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    return open_final_mp4, end_final_mp4


async def process_single_episode(
    ep_num: int,
    src_mp4: Path,
    title_en: str,
    title_ko: str,
    bgm_wav: Path,
    sem: asyncio.Semaphore,
) -> Path:
    """
    Processes one episode (EP01..EP40) and writes the improved MP4 to `IMPROVE_DIR`.
    """
    out_name = f"SNSHero com The Movie EP{ep_num:02d} {title_en}.mp4"
    out_mp4 = IMPROVE_DIR / out_name
    if out_mp4.exists() and out_mp4.stat().st_size > 10_000_000:
        dur = probe_duration(out_mp4)
        if 163.0 <= dur <= 165.0:
            log(f"[EP{ep_num:02d}/40] Already completed ({dur:.2f}s): {out_name}")
            return out_mp4

    ep_work = WORK_DIR / f"ep{ep_num:02d}"
    ep_work.mkdir(parents=True, exist_ok=True)

    # 1. Generate 4.0s black-screen Episode Number & Title intro card
    title_card_mp4 = ep_work / "title_card.mp4"
    render_episode_title_card_mp4(ep_num, title_en, title_ko, title_card_mp4, duration=4.0)

    # 2. Prepare 160.0s normalized silent video body
    body_silent_mp4 = ep_work / "body_160s_silent.mp4"
    normalize_video_body_160s(ep_num, src_mp4, body_silent_mp4)

    # 3. Concatenate 4.0s Title Card + 160.0s Body (lossless video stream copy -> 164.0s)
    joined_video_mp4 = ep_work / "joined_164s_silent.mp4"
    concat_list = ep_work / "video_concat.txt"
    concat_list.write_text(
        f"file '{title_card_mp4}'\nfile '{body_silent_mp4}'\n",
        encoding="utf-8",
    )
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_list),
            "-c:v",
            "copy",
            "-an",
            "-sn",
            str(joined_video_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # 4. Synthesize English Male Narration (Title announcement + 20-scene story script)
    title_tts_mp3 = ep_work / "title_tts.mp3"
    story_tts_mp3 = ep_work / "story_tts.mp3"
    title_spoken = f"Episode {ep_num}. {clean_sentence_for_tts(title_en)}."
    story_script = build_episode_story_script(ep_num, title_en)
    (ep_work / "story_script.txt").write_text(story_script, encoding="utf-8")

    async with sem:
        if not (title_tts_mp3.exists() and title_tts_mp3.stat().st_size > 1000):
            await synthesize_voice_mp3(title_spoken, title_tts_mp3, rate="-6%")
        if not (story_tts_mp3.exists() and story_tts_mp3.stat().st_size > 5000):
            await synthesize_voice_mp3(story_script, story_tts_mp3, rate="-4%")

    # 5. Mix Soft Ambient BGM + Male Voiceover -> 164.0s stereo AAC
    mixed_m4a = ep_work / "mixed_audio.m4a"
    vid_dur = probe_duration(joined_video_mp4)
    build_episode_audio_mix(title_tts_mp3, story_tts_mp3, bgm_wav, mixed_m4a, total_duration=vid_dur)

    # 6. Mux 164.0s video + 164.0s audio into final improved MP4
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(joined_video_mp4),
            "-i",
            str(mixed_m4a),
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-c:v",
            "copy",
            "-c:a",
            "copy",
            "-movflags",
            "+faststart",
            str(out_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    final_dur = probe_duration(out_mp4)
    size_mb = out_mp4.stat().st_size / (1024 * 1024)
    log(f"[EP{ep_num:02d}/40] DONE -> {out_mp4.name} ({final_dur:.2f}s, {size_mb:.1f} MB)")
    return out_mp4


async def main() -> None:
    t_start = time.time()
    IMPROVE_DIR.mkdir(parents=True, exist_ok=True)
    WORK_DIR.mkdir(parents=True, exist_ok=True)

    log("Discovering all 40 source episodes in /Users/dayyoung/Desktop/내문서/movie/ ...")
    ep_info = find_source_episodes()
    log(f"Found all {len(ep_info)} episodes (EP01..EP40).")

    bgm_wav = WORK_DIR / "bgm_soft_fantasy.wav"
    generate_soft_ambient_bgm(bgm_wav, duration_sec=180.0, sr=48000)

    # First normalize EP07, EP08, EP09 sequentially so CPU isn't overloaded by parallel x264 encodes
    for special_ep in (7, 8, 9):
        src_mp4, title_en, title_ko = ep_info[special_ep]
        ep_work = WORK_DIR / f"ep{special_ep:02d}"
        ep_work.mkdir(parents=True, exist_ok=True)
        normalize_video_body_160s(special_ep, src_mp4, ep_work / "body_160s_silent.mp4")

    # Process all 40 episodes in batches of 4 with a concurrency semaphore of 3 for edge-tts
    sem = asyncio.Semaphore(3)
    improved_paths: Dict[int, Path] = {}
    for batch_start in range(1, 41, 4):
        batch_eps = list(range(batch_start, min(41, batch_start + 4)))
        tasks = [
            process_single_episode(
                ep,
                ep_info[ep][0],
                ep_info[ep][1],
                ep_info[ep][2],
                bgm_wav,
                sem,
            )
            for ep in batch_eps
        ]
        results = await asyncio.gather(*tasks)
        for ep, p in zip(batch_eps, results):
            improved_paths[ep] = p

    # Build Opening Credits & Ending Credits
    log("Building Opening Credits (16s) and Ending Credits (24s) for the Full Theatrical Edition...")
    open_mp4, end_mp4 = await build_opening_and_ending_credits(ep_info, bgm_wav)

    # Concatenate Opening Credits + EP01..EP40 + Ending Credits into Full Theatrical Edition
    theatrical_mp4 = IMPROVE_DIR / "SNSHero com The Movie - Full Theatrical Edition (EP01-EP40).mp4"
    log(f"Assembling Full Theatrical Edition (Opening + 40 Episodes + Ending) -> {theatrical_mp4.name} ...")
    theatrical_list = WORK_DIR / "theatrical_concat.txt"
    concat_entries = [f"file '{open_mp4}'"]
    for ep in range(1, 41):
        concat_entries.append(f"file '{improved_paths[ep]}'")
    concat_entries.append(f"file '{end_mp4}'")
    theatrical_list.write_text("\n".join(concat_entries) + "\n", encoding="utf-8")

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(theatrical_list),
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            str(theatrical_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    total_dur = probe_duration(theatrical_mp4)
    total_gb = theatrical_mp4.stat().st_size / (1024 * 1024 * 1024)
    elapsed = time.time() - t_start
    log(
        f"ALL COMPLETED in {elapsed:.1f}s! "
        f"Theatrical Edition: {theatrical_mp4.name} "
        f"(Duration: {total_dur/60:.2f} mins / {total_dur:.1f}s, Size: {total_gb:.2f} GB)"
    )


if __name__ == "__main__":
    asyncio.run(main())
