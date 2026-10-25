#!/usr/bin/env python3
"""
scripts/synced_narration_engine.py
1:1 Cut-Synchronized Voiceover & Calm Ambient BGM Synthesis Engine for SNSHero Animation & Live-Action Movie (40 Episodes, 2,009 Cuts).

Key Features:
1. Synthesizes every single cut's exact full English text (`narrationEn`) with zero mid-sentence truncation.
2. Uses `edge_tts` native `SentenceBoundary` events + alphanumeric character-cursor mapping to determine
   the exact start and end timestamp (`0.0001s` precision) of every cut `0 .. N-1` in the audio stream.
3. Computes exact monotonic cut transition boundaries `B[0 .. N]` at the midpoint of the breath pause
   between consecutive cuts, so `sum(aligned_durations) == audio_duration` with 0.00s drift from Cut 00 to Cut 49.
4. Mixes the voiceover with a gentle, drum-free, noise-free warm ambient chord pad (`-20 dB`) into a 44.1kHz stereo AAC `.m4a`.
"""

import asyncio
import json
import math
import os
import re
import shutil
import subprocess
import wave
from pathlib import Path
from typing import List, Tuple

import edge_tts
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[1]
FFMPEG_BIN = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
FFPROBE_BIN = shutil.which("ffprobe") or "/opt/homebrew/bin/ffprobe"

CALM_BGM_CACHE = Path("/tmp/snshero_unified_calm_bgm_900s.wav")


def ensure_calm_bgm_wav(out_wav: Path = CALM_BGM_CACHE, duration_sec: float = 900.0, sr: int = 44100) -> Path:
    """
    Generates (or reuses) a 15-minute (900s) warm, tranquil ambient string/pad BGM WAV
    with zero drums, zero white noise, and zero harsh frequencies.
    """
    if out_wav.is_file() and out_wav.stat().st_size > 50_000_000:
        return out_wav

    n_samples = int(duration_sec * sr)
    t = np.linspace(0.0, duration_sec, n_samples, endpoint=False, dtype=np.float32)

    chords = [
        [87.31, 130.81, 174.61, 220.00, 261.63, 329.63],  # Fmaj7
        [73.42, 110.00, 146.83, 174.61, 220.00, 329.63],  # Dm9
        [58.27, 87.31, 116.54, 146.83, 174.61, 220.00],   # Bbmaj7
        [65.41, 98.00, 130.81, 164.81, 196.00, 293.66],   # Cadd9
        [55.00, 82.41, 110.00, 130.81, 164.81, 196.00],   # Am7
        [49.00, 73.42, 98.00, 116.54, 146.83, 174.61],    # Gm7
    ]

    chord_len = 10.0
    left = np.zeros(n_samples, dtype=np.float32)
    right = np.zeros(n_samples, dtype=np.float32)

    num_steps = int(math.ceil(duration_sec / chord_len)) + 1
    weights = [0.34, 0.26, 0.20, 0.14, 0.10, 0.06]

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
        for v_i, (f, w) in enumerate(zip(freqs, weights)):
            detune = 1.0010 if (v_i % 2 == 0) else 0.9990
            ph_l = 2.0 * math.pi * f * seg_t
            ph_r = 2.0 * math.pi * (f * detune) * seg_t + 0.35
            seg_l += w * (np.sin(ph_l) + 0.12 * np.sin(2.0 * ph_l))
            seg_r += w * (np.sin(ph_r) + 0.12 * np.sin(2.0 * ph_r))

        left[i0:i1] += env * seg_l
        right[i0:i1] += env * seg_r

    peak = max(float(np.max(np.abs(left))), float(np.max(np.abs(right))), 1e-6)
    left = (left / peak) * 0.78
    right = (right / peak) * 0.78

    stereo = np.empty((n_samples, 2), dtype=np.int16)
    stereo[:, 0] = np.clip(left * 32767.0, -32768, 32767).astype(np.int16)
    stereo[:, 1] = np.clip(right * 32767.0, -32768, 32767).astype(np.int16)

    out_wav.parent.mkdir(parents=True, exist_ok=True)
    tmp_wav = out_wav.with_suffix(f".tmp.{os.getpid()}.wav")
    with wave.open(str(tmp_wav), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(stereo.tobytes())
    shutil.move(str(tmp_wav), str(out_wav))
    return out_wav


def clean_cut_text_for_tts(text: str) -> str:
    """Cleans a cut's English narration/dialogue text for natural TTS reading without truncating."""
    c = re.sub(r"\[\[.*?\]\]", " ", text or "")
    c = re.sub(r'["“”`*_~<>|]', " ", c)
    c = re.sub(r"\s+", " ", c).strip()
    if not c:
        return "The chronicle continues."
    if c[-1] not in ".!?":
        c += "."
    return c


def probe_audio_duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            FFPROBE_BIN,
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


async def _stream_edge_tts_with_boundaries(
    scene_texts: List[str],
    out_mp3: Path,
    voice: str,
    rate: str,
    pitch: str,
) -> List[Tuple[float, float, str]]:
    """
    Streams TTS audio from `edge_tts` and collects all `SentenceBoundary` events:
    returns list of `(start_sec, end_sec, sentence_text)`.
    """
    full_text = "\n\n".join(scene_texts)
    out_mp3.parent.mkdir(parents=True, exist_ok=True)

    last_err = None
    for attempt in range(5):
        try:
            comm = edge_tts.Communicate(full_text, voice=voice, rate=rate, pitch=pitch)
            audio_buf = bytearray()
            boundaries: List[Tuple[float, float, str]] = []
            async for chunk in comm.stream():
                ctype = chunk.get("type")
                if ctype == "audio":
                    audio_buf.extend(chunk["data"])
                elif ctype == "SentenceBoundary":
                    st = float(chunk.get("offset", 0)) / 1e7
                    dur = float(chunk.get("duration", 0)) / 1e7
                    txt = str(chunk.get("text", ""))
                    boundaries.append((st, st + dur, txt))
            if len(audio_buf) > 4000 and len(boundaries) > 0:
                out_mp3.write_bytes(bytes(audio_buf))
                return boundaries
        except Exception as e:
            last_err = e
            await asyncio.sleep(1.5 * (attempt + 1))

    raise RuntimeError(f"edge_tts failed after 5 attempts: {last_err}")


def compute_exact_cut_boundaries(
    scene_texts: List[str],
    sentence_boundaries: List[Tuple[float, float, str]],
    total_audio_dur: float,
) -> List[float]:
    """
    Maps `sentence_boundaries` `(start_sec, end_sec, text)` onto `scene_texts[0 .. N-1]`
    using cumulative alphanumeric character intervals, and returns exact monotonic
    cut transition timestamps `B[0 .. N]` where `B[0] = 0.0` and `B[N] = total_audio_dur`.
    """
    n_cuts = len(scene_texts)
    if n_cuts <= 1:
        return [0.0, total_audio_dur]

    alpha_lens = [max(1, len(re.sub(r"[^a-zA-Z0-9]", "", s))) for s in scene_texts]
    scene_alpha_start = [0] * n_cuts
    scene_alpha_end = [0] * n_cuts
    acc = 0
    for i, al in enumerate(alpha_lens):
        scene_alpha_start[i] = acc
        acc += al
        scene_alpha_end[i] = acc
    total_alpha = max(1, acc)

    INF = 1e12
    cut_first_start = [INF] * n_cuts
    cut_last_end = [-1.0] * n_cuts

    cur_alpha = 0
    for st_sec, en_sec, s_txt in sentence_boundaries:
        s_al = max(1, len(re.sub(r"[^a-zA-Z0-9]", "", s_txt)))
        mid_al = cur_alpha + 0.5 * s_al
        cur_alpha += s_al

        # Find the cut `i` whose alphanumeric range contains `mid_al`
        chosen_i = n_cuts - 1
        for i in range(n_cuts):
            if scene_alpha_start[i] <= mid_al < scene_alpha_end[i]:
                chosen_i = i
                break
        if st_sec < cut_first_start[chosen_i]:
            cut_first_start[chosen_i] = st_sec
        if en_sec > cut_last_end[chosen_i]:
            cut_last_end[chosen_i] = en_sec

    # Build boundary array B[0 .. n_cuts]
    B: List[float | None] = [None] * (n_cuts + 1)
    B[0] = 0.0
    B[n_cuts] = total_audio_dur

    for i in range(1, n_cuts):
        prev_end = cut_last_end[i - 1]
        next_start = cut_first_start[i]
        if prev_end >= 0.0 and next_start < INF and next_start >= prev_end - 0.05:
            B[i] = 0.5 * (prev_end + next_start)
        elif next_start < INF:
            B[i] = max(0.1, next_start - 0.12)
        elif prev_end >= 0.0:
            B[i] = min(total_audio_dur - 0.1, prev_end + 0.12)

    # Interpolate any missing B[i] proportionally by alphanumeric length
    known_indices = [i for i in range(n_cuts + 1) if B[i] is not None]
    for k_idx in range(len(known_indices) - 1):
        i_left = known_indices[k_idx]
        i_right = known_indices[k_idx + 1]
        if i_right - i_left > 1:
            t_left = float(B[i_left])
            t_right = float(B[i_right])
            al_left = scene_alpha_start[i_left] if i_left < n_cuts else total_alpha
            al_right = scene_alpha_start[i_right] if i_right < n_cuts else total_alpha
            span_al = max(1, al_right - al_left)
            for m in range(i_left + 1, i_right):
                ratio = (scene_alpha_start[m] - al_left) / float(span_al)
                B[m] = t_left + ratio * (t_right - t_left)

    # Enforce strict monotonicity with minimum 1.2s per cut
    b_final = [float(x) if x is not None else 0.0 for x in B]
    b_final[0] = 0.0
    b_final[n_cuts] = total_audio_dur
    min_step = min(1.2, total_audio_dur / float(n_cuts + 2))
    for i in range(1, n_cuts):
        if b_final[i] < b_final[i - 1] + min_step:
            b_final[i] = b_final[i - 1] + min_step
    for i in range(n_cuts - 1, 0, -1):
        if b_final[i] > b_final[i + 1] - min_step:
            b_final[i] = b_final[i + 1] - min_step

    return b_final


def synthesize_synced_episode_audio(
    ep_num: int,
    scene_texts: List[str],
    out_m4a: Path,
    voice: str = "en-US-JennyNeural",
    rate: str = "+8%",
    pitch: str = "+0Hz",
    cache_dir: Path | None = None,
) -> Tuple[Path, List[float], List[float]]:
    """
    Synthesizes (or loads from `cache_dir` if already synthesized for this exact script & voice)
    the 44.1kHz stereo `.m4a` (voiceover + calm ambient BGM) and exact per-cut durations
    `aligned_durations[0 .. N-1]` and boundary timestamps `B[0 .. N]`.
    """
    cleaned_texts = [clean_cut_text_for_tts(t) for t in scene_texts]
    if cache_dir is not None:
        cache_dir.mkdir(parents=True, exist_ok=True)
        cache_m4a = cache_dir / f"ep_{ep_num:02d}_{voice}.m4a"
        cache_json = cache_dir / f"ep_{ep_num:02d}_{voice}.json"
        if cache_m4a.is_file() and cache_json.is_file() and cache_m4a.stat().st_size > 50_000:
            try:
                meta = json.loads(cache_json.read_text(encoding="utf-8"))
                if meta.get("scene_count") == len(cleaned_texts) and meta.get("texts") == cleaned_texts:
                    shutil.copy2(cache_m4a, out_m4a)
                    return out_m4a, meta["aligned_durations"], meta["boundaries"]
            except Exception:
                pass

    vo_mp3 = out_m4a.with_suffix(".vo.mp3")
    boundaries_raw = asyncio.run(
        _stream_edge_tts_with_boundaries(cleaned_texts, vo_mp3, voice=voice, rate=rate, pitch=pitch)
    )

    vo_dur = probe_audio_duration(vo_mp3)
    total_dur = vo_dur + 0.85  # Gentle 0.85s tail fade-out after last spoken word

    bgm_wav = ensure_calm_bgm_wav()
    bgm_offset = ((ep_num - 1) * 17) % 240
    fade_out_st = max(0.0, total_dur - 2.0)

    filter_complex = (
        f"[0:a]atrim=start={bgm_offset}:duration={total_dur:.3f},asetpts=PTS-STARTPTS,"
        f"volume=0.09,afade=t=in:st=0:d=1.2,afade=t=out:st={fade_out_st:.3f}:d=2.0[bgm];"
        f"[1:a]aresample=44100,pan=stereo|c0=c0|c1=c0,volume=1.30,apad=whole_dur={total_dur:.3f}[vo];"
        f"[bgm][vo]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]"
    )

    subprocess.run(
        [
            FFMPEG_BIN,
            "-y",
            "-i",
            str(bgm_wav),
            "-i",
            str(vo_mp3),
            "-filter_complex",
            filter_complex,
            "-map",
            "[aout]",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-ar",
            "44100",
            str(out_m4a),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    vo_mp3.unlink(missing_ok=True)

    actual_m4a_dur = probe_audio_duration(out_m4a)
    B = compute_exact_cut_boundaries(cleaned_texts, boundaries_raw, actual_m4a_dur)
    aligned_durations = [B[i + 1] - B[i] for i in range(len(cleaned_texts))]

    if cache_dir is not None:
        cache_m4a = cache_dir / f"ep_{ep_num:02d}_{voice}.m4a"
        cache_json = cache_dir / f"ep_{ep_num:02d}_{voice}.json"
        shutil.copy2(out_m4a, cache_m4a)
        cache_json.write_text(
            json.dumps(
                {
                    "ep_num": ep_num,
                    "voice": voice,
                    "scene_count": len(cleaned_texts),
                    "total_duration": actual_m4a_dur,
                    "aligned_durations": aligned_durations,
                    "boundaries": B,
                    "texts": cleaned_texts,
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

    return out_m4a, aligned_durations, B
