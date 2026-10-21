#!/usr/bin/env python3
"""
Remaster all 40 animation videos in `/Users/dayyoung/project/snshero/public/video/animation/`:
1. Strip the loud/noisy procedural BGM and robotic macOS `say` voice.
2. Replace with a single unified, calm, soft ambient background music track (gentle low-volume
   warm string/celesta pad at volume 0.09 / -21 dB) across all 40 episodes.
3. Synthesize a soft, gentle, natural female voiceover (`edge-tts` `en-US-JennyNeural`) reading
   each episode's full story smoothly from start to finish, synchronized to the exact video
   duration while preserving the video stream losslessly (`-c:v copy`).
"""

import asyncio
import json
import math
import os
import re
import shutil
import subprocess
import time
import wave
from pathlib import Path
from typing import Dict, List, Tuple

import edge_tts
import numpy as np

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MANIFEST_PATH = PROJECT_ROOT / "src" / "content" / "webtoonEpisodeManifest.json"
ANIM_DIR = PROJECT_ROOT / "public" / "video" / "animation"
WORK_DIR = Path("/tmp/snshero_anim_remaster_work")

# Soft, gentle, warm female storyteller voice
FEMALE_VOICE = "en-US-JennyNeural"


def log(msg: str) -> None:
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


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


def generate_calm_unified_bgm(out_wav: Path, duration_sec: float = 900.0, sr: int = 44100) -> None:
    """
    Synthesizes a 15-minute (900s) unified, calm, warm ambient background music track
    (44.1kHz stereo WAV) so even the longest animation episode (~600s) has a seamless,
    tranquil background atmosphere with zero drums, zero white noise, and zero harsh highs.
    """
    if out_wav.exists() and out_wav.stat().st_size > 50_000_000:
        log(f"Reusing existing calm unified BGM: {out_wav}")
        return

    log(f"Synthesizing unified calm ambient BGM ({duration_sec:.0f}s, {sr}Hz stereo)...")
    n_samples = int(duration_sec * sr)
    t = np.linspace(0.0, duration_sec, n_samples, endpoint=False, dtype=np.float32)

    # Warm, soothing major/minor pastoral chord progression (10s per chord = 60s cycle)
    chords = [
        # Fmaj7: F2, C3, F3, A3, C4, E4
        [87.31, 130.81, 174.61, 220.00, 261.63, 329.63],
        # Dm9: D2, A2, D3, F3, A3, E4
        [73.42, 110.00, 146.83, 174.61, 220.00, 329.63],
        # Bbmaj7: Bb1, F2, Bb2, D3, F3, A3
        [58.27, 87.31, 116.54, 146.83, 174.61, 220.00],
        # Cadd9: C2, G2, C3, E3, G3, D4
        [65.41, 98.00, 130.81, 164.81, 196.00, 293.66],
        # Am7: A1, E2, A2, C3, E3, G3
        [55.00, 82.41, 110.00, 130.81, 164.81, 196.00],
        # Gm7: G1, D2, G2, Bb2, D3, F3
        [49.00, 73.42, 98.00, 116.54, 146.83, 174.61],
    ]

    chord_len = 10.0
    left = np.zeros(n_samples, dtype=np.float32)
    right = np.zeros(n_samples, dtype=np.float32)

    num_steps = int(math.ceil(duration_sec / chord_len)) + 1
    for step in range(num_steps):
        freqs = chords[step % len(chords)]
        center_t = step * chord_len
        start_t = max(0.0, center_t - chord_len)
        end_t = min(duration_sec, center_t + chord_len)
        i0 = int(start_t * sr)
        i1 = int(end_t * sr)
        if i1 <= i0:
            continue
        seg_t = t[i0:i1]
        rel = (seg_t - center_t) / chord_len
        env = 0.5 * (1.0 + np.cos(math.pi * np.clip(rel, -1.0, 1.0)))

        seg_l = np.zeros_like(seg_t)
        seg_r = np.zeros_like(seg_t)
        weights = [0.34, 0.26, 0.20, 0.14, 0.10, 0.06]
        for v_i, (f, w) in enumerate(zip(freqs, weights)):
            detune = 1.0010 if (v_i % 2 == 0) else 0.9990
            ph_l = 2.0 * math.pi * f * seg_t
            ph_r = 2.0 * math.pi * (f * detune) * seg_t + 0.35
            # Pure warm sine + very soft 2nd harmonic
            seg_l += w * (np.sin(ph_l) + 0.14 * np.sin(2.0 * ph_l))
            seg_r += w * (np.sin(ph_r) + 0.14 * np.sin(2.0 * ph_r))

        # Soft music-box / harp bell note every 2.5s
        bell_freqs = [freqs[2] * 2.0, freqs[3] * 2.0, freqs[4] * 2.0, freqs[5] * 2.0]
        for b_i, bf in enumerate(bell_freqs):
            ns = center_t - 0.5 * chord_len + b_i * (chord_len / 4.0)
            ni0 = max(i0, int(ns * sr))
            ni1 = min(i1, int((ns + 3.2) * sr))
            if ni1 > ni0:
                nt = t[ni0:ni1] - ns
                b_env = (1.0 - np.exp(-nt / 0.10)) * np.exp(-nt / 1.5)
                b_wave = 0.032 * b_env * np.sin(2.0 * math.pi * bf * nt)
                if b_i % 2 == 0:
                    left[ni0:ni1] += b_wave
                    right[ni0:ni1] += b_wave * 0.7
                else:
                    left[ni0:ni1] += b_wave * 0.7
                    right[ni0:ni1] += b_wave

        left[i0:i1] += env * seg_l
        right[i0:i1] += env * seg_r

    peak = max(float(np.max(np.abs(left))), float(np.max(np.abs(right))), 1e-6)
    left = (left / peak) * 0.80
    right = (right / peak) * 0.80

    stereo = np.empty((n_samples, 2), dtype=np.int16)
    stereo[:, 0] = np.clip(left * 32767.0, -32768, 32767).astype(np.int16)
    stereo[:, 1] = np.clip(right * 32767.0, -32768, 32767).astype(np.int16)

    out_wav.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out_wav), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(stereo.tobytes())
    log(f"Calm unified BGM synthesized: {out_wav} ({out_wav.stat().st_size / (1024*1024):.1f} MB)")


def clean_line_for_female_tts(text: str) -> str:
    c = re.sub(r"\[\[.*?\]\]", " ", text or "")
    c = re.sub(r'["“”\'‘’`*_~<>|]', " ", c)
    c = re.sub(r"\s+", " ", c).strip()
    if not c:
        return ""
    if c[-1] not in ".!?":
        c += "."
    return c


def build_episode_script_from_manifest(ep_num: int, ep_data: dict, vid_dur: float) -> str:
    """
    Extracts non-redundant narrative sentences across all scenes of the episode
    in `webtoonEpisodeManifest.json` (never duplicating dialogue + narration),
    budgeted to fit comfortably within `vid_dur` at a slow, unhurried `-15%`
    reading speed (~2.05 words/sec) so the voice is NEVER sped up!
    """
    images = ep_data.get("images", [])
    title_en = ep_data.get("episodeTitle", f"Episode {ep_num}")
    target_words = int(max(60.0, vid_dur - 12.0) * 2.05)
    n_scenes = max(1, len(images))
    words_per_scene = max(11, target_words // n_scenes)

    lines: List[str] = [f"Episode {ep_num}. {clean_line_for_female_tts(title_en)}"]
    total_w = len(lines[0].split())

    for idx, img_entry in enumerate(images):
        is_title = idx == 0 or img_entry.get("type") == "title_card"
        if is_title:
            continue

        narration_en = (img_entry.get("narrationEn") or "").strip()
        if not narration_en:
            dialogues = img_entry.get("dialogues", [])
            if dialogues:
                narration_en = (dialogues[0].get("textEn") or "").strip()

        cleaned = clean_line_for_female_tts(narration_en)
        if not cleaned:
            continue

        sents = re.split(r"(?<=[.!?])\s+", cleaned)
        chosen: List[str] = []
        sw = 0
        for s in sents:
            w = len(s.split())
            if sw == 0 and w > words_per_scene + 8:
                clause = " ".join(s.split()[: words_per_scene + 4]).rstrip(",;:") + "."
                chosen.append(clause)
                sw += len(clause.split())
                break
            elif sw == 0 or sw + w <= words_per_scene + 5:
                chosen.append(s)
                sw += w
            else:
                break

        scene_line = " ".join(chosen).strip()
        if scene_line and total_w + sw <= target_words + 10:
            lines.append(scene_line)
            total_w += sw

    return "\n\n".join(lines)


async def synthesize_female_voice(text: str, out_mp3: Path, rate: str = "-15%", pitch: str = "-1Hz") -> None:
    out_mp3.parent.mkdir(parents=True, exist_ok=True)
    last_err = None
    for attempt in range(5):
        try:
            comm = edge_tts.Communicate(text, voice=FEMALE_VOICE, rate=rate, pitch=pitch)
            await comm.save(str(out_mp3))
            if out_mp3.exists() and out_mp3.stat().st_size > 2000:
                return
        except Exception as e:
            last_err = e
            await asyncio.sleep(1.5 * (attempt + 1))

    log(f"WARN: edge-tts failed after retries ({last_err}), falling back to macOS Samantha voice")
    aiff_path = out_mp3.with_suffix(".aiff")
    subprocess.run(["say", "-v", "Samantha", "-r", "140", "-o", str(aiff_path), text], check=True)
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(aiff_path), "-c:a", "libmp3lame", "-q:a", "2", str(out_mp3)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    aiff_path.unlink(missing_ok=True)


async def remaster_single_animation_episode(
    ep_num: int,
    ep_data: dict,
    bgm_wav: Path,
    sem: asyncio.Semaphore,
) -> None:
    matches = sorted(ANIM_DIR.glob(f"SNSHero.com_E{ep_num}_*.mp4"))
    if not matches:
        raise FileNotFoundError(f"Missing animation MP4 for EP{ep_num} in {ANIM_DIR}")
    mp4_path = matches[0]

    ep_work = WORK_DIR / f"ep{ep_num:02d}"
    ep_work.mkdir(parents=True, exist_ok=True)
    done_marker = ep_work / "done_slow_v2.ok"
    if done_marker.exists():
        log(f"[Anim EP{ep_num:02d}/40] Already remastered (slow v2), skipping.")
        return

    vid_dur = probe_duration(mp4_path)
    script_text = build_episode_script_from_manifest(ep_num, ep_data, vid_dur)
    tts_mp3 = ep_work / "female_vo_slow.mp3"

    async with sem:
        if not (tts_mp3.exists() and tts_mp3.stat().st_size > 5000):
            await synthesize_female_voice(script_text, tts_mp3, rate="-15%", pitch="-1Hz")

    tts_dur = probe_duration(tts_mp3)
    # NEVER speed up the voice (no atempo > 1.0)! Keep 100% natural slow -15% cadence.
    fade_out_st = max(0.0, vid_dur - 2.5)

    # BGM is kept very calm and gentle (volume=0.09, ~ -21dB) while the soft female voice sits clearly at 1.30
    filter_complex = (
        f"[0:a]volume=0.09,afade=t=in:st=0:d=1.5,afade=t=out:st={fade_out_st:.2f}:d=2.5[bgm];"
        f"[1:a]volume=1.30,adelay=1000|1000[vo];"
        f"[bgm][vo]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,"
        f"alimiter=limit=0.95[aout]"
    )

    mixed_m4a = ep_work / "mixed_audio.m4a"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-t",
            f"{vid_dur:.2f}",
            "-i",
            str(bgm_wav),
            "-i",
            str(tts_mp3),
            "-filter_complex",
            filter_complex,
            "-map",
            "[aout]",
            "-ac",
            "2",
            "-ar",
            "44100",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-t",
            f"{vid_dur:.2f}",
            str(mixed_m4a),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    out_tmp_mp4 = ep_work / f"remastered_{mp4_path.name}"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(mp4_path),
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
            str(out_tmp_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    shutil.move(str(out_tmp_mp4), str(mp4_path))
    done_marker.write_text("ok", encoding="utf-8")
    log(
        f"[Anim EP{ep_num:02d}/40] DONE -> {mp4_path.name} "
        f"(Video: {vid_dur:.1f}s, Female VO raw: {tts_dur:.1f}s)"
    )


async def main() -> None:
    t0 = time.time()
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    bgm_wav = WORK_DIR / "calm_unified_bgm.wav"
    generate_calm_unified_bgm(bgm_wav, duration_sec=900.0, sr=44100)

    sem = asyncio.Semaphore(5)
    for batch_start in range(1, 41, 8):
        batch_eps = list(range(batch_start, min(41, batch_start + 8)))
        tasks = [
            remaster_single_animation_episode(ep, manifest[str(ep)], bgm_wav, sem)
            for ep in batch_eps
        ]
        await asyncio.gather(*tasks)

    log(f"ALL 40 ANIMATION VIDEOS REMASTERED in {time.time() - t0:.1f}s!")


if __name__ == "__main__":
    asyncio.run(main())
