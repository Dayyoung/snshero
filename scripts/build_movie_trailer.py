#!/usr/bin/env python3
"""
Build an impressive 2.5-minute (154s) Official Theatrical Movie Trailer
(`SNSHero com The Movie - Official Theatrical Trailer.mp4`) from the 40 remastered
episodes, culminating in "Visit SNSHero.com!".
"""

import asyncio
import math
import subprocess
import time
import wave
from pathlib import Path
from typing import List, Tuple

import edge_tts
import numpy as np
from PIL import Image, ImageDraw, ImageFont

IMPROVE_DIR = Path("/Users/dayyoung/Desktop/내문서/movie/improve")
WORK_DIR = Path("/tmp/snshero_trailer_work")

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


def find_improved_ep(ep_num: int) -> Path:
    matches = sorted(IMPROVE_DIR.glob(f"SNSHero com The Movie EP{ep_num:02d} *.mp4"))
    if not matches:
        raise FileNotFoundError(f"Could not find improved MP4 for EP{ep_num:02d} in {IMPROVE_DIR}")
    return matches[0]


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


def render_trailer_card(
    lines: List[Tuple[str, int, Tuple[int, int, int], bool]],
    out_mp4: Path,
    duration: float,
    gold_border: bool = True,
    fade_in: float = 0.5,
    fade_out: float = 0.5,
) -> None:
    """
    Renders a 1280x720 24fps cinematic black/gold trailer title card.
    """
    img = Image.new("RGB", (1280, 720), (0, 0, 0))
    draw = ImageDraw.Draw(img)

    if gold_border:
        # Subtle cinematic letterbox accent bars & center ornamental rule
        draw.line([(180, 110), (1100, 110)], fill=(120, 98, 60), width=1)
        draw.line([(180, 610), (1100, 610)], fill=(120, 98, 60), width=1)

    spacing = 18
    rendered = []
    total_h = 0
    for text, fsize, color, is_kr in lines:
        if not text:
            rendered.append((text, None, color, 20))
            total_h += 20
            continue
        fpath = FONT_KR if is_kr else FONT_SERIF_BOLD
        font = get_font(fpath, fsize)
        bbox = draw.textbbox((0, 0), text, font=font)
        th = bbox[3] - bbox[1]
        rendered.append((text, font, color, th))
        total_h += th + spacing

    cur_y = max(80, (720 - total_h) // 2)
    for text, font, color, th in rendered:
        if text and font is not None:
            draw_centered_text(draw, cur_y, text, font, color)
        cur_y += th + spacing

    png_path = out_mp4.with_suffix(".png")
    img.save(png_path)

    fade_out_st = max(0.0, duration - fade_out)
    vf = f"fade=t=in:st=0:d={fade_in:.2f},fade=t=out:st={fade_out_st:.2f}:d={fade_out:.2f},format=yuv420p"
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


def extract_trailer_cut(
    ep_num: int,
    scene_idx_1based: int,
    offset_in_scene: float,
    duration: float,
    out_mp4: Path,
    fade_in: float = 0.20,
    fade_out: float = 0.20,
) -> None:
    """
    Extracts a high-impact cutscene clip from `EP{ep_num:02d}` in `IMPROVE_DIR`.
    Note: In the improved individual episode files, 0.0..4.0s is the title card,
    and scene `k` (1..20) starts at `4.0 + (k-1)*8.0` seconds.
    """
    src_mp4 = find_improved_ep(ep_num)
    start_sec = 4.0 + (scene_idx_1based - 1) * 8.0 + offset_in_scene
    fade_out_st = max(0.0, duration - fade_out)
    vf = f"fade=t=in:st=0:d={fade_in:.2f},fade=t=out:st={fade_out_st:.2f}:d={fade_out:.2f},format=yuv420p"
    cmd = [
        "ffmpeg",
        "-y",
        "-ss",
        f"{start_sec:.2f}",
        "-t",
        f"{duration:.2f}",
        "-i",
        str(src_mp4),
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
        "-sn",
        str(out_mp4),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def generate_epic_trailer_bgm(out_wav: Path, duration_sec: float = 160.0, sr: int = 48000) -> None:
    """
    Synthesizes a dramatic 4-stage cinematic trailer score (48kHz stereo WAV):
    - 0..32s (Act I): Deep atmospheric cello/bass drone + haunting minor choir pad
    - 32..68s (Act II): Adds steady cinematic heartbeat / low taiko pulse (every 1.0s)
    - 68..105s (Act III): Rising orchestral strings + double-time percussion & brass swells
    - 105..136s (Act IV Climax): Epic full orchestral progression (Dm - Bb - F - C - Gm - A7) with dramatic hits
    - 136..160s (Act V Finale): Grand resonant D-minor/D-major picardy cadence + shimmering harp & brass sustain
    """
    log(f"Synthesizing epic theatrical trailer soundtrack ({duration_sec:.1f}s)...")
    n_samples = int(duration_sec * sr)
    t = np.linspace(0.0, duration_sec, n_samples, endpoint=False, dtype=np.float32)

    left = np.zeros(n_samples, dtype=np.float32)
    right = np.zeros(n_samples, dtype=np.float32)

    # Epic trailer chord progression (4-second bars)
    chords = [
        # Dm: D2, A2, D3, F3, A3, D4
        [73.42, 110.00, 146.83, 174.61, 220.00, 293.66],
        # Bbmaj7: Bb1, F2, Bb2, D3, F3, A3
        [58.27, 87.31, 116.54, 146.83, 174.61, 220.00],
        # F: F1, C2, F2, A2, C3, F3
        [43.65, 65.41, 87.31, 110.00, 130.81, 174.61],
        # C: C2, G2, C3, E3, G3, C4
        [65.41, 98.00, 130.81, 164.81, 196.00, 261.63],
        # Gm: G1, D2, G2, Bb2, D3, G3
        [49.00, 73.42, 98.00, 116.54, 146.83, 196.00],
        # A7sus4 -> A: A1, E2, A2, C#3, E3, A3
        [55.00, 82.41, 110.00, 138.59, 164.81, 220.00],
    ]

    bar_len = 4.0
    num_bars = int(math.ceil(duration_sec / bar_len)) + 1

    for bar in range(num_bars):
        c_idx = bar % len(chords)
        freqs = chords[c_idx]
        center_t = bar * bar_len
        start_t = max(0.0, center_t - bar_len)
        end_t = min(duration_sec, center_t + bar_len)
        i0 = int(start_t * sr)
        i1 = int(end_t * sr)
        if i1 <= i0:
            continue
        seg_t = t[i0:i1]
        rel = (seg_t - center_t) / bar_len
        env = 0.5 * (1.0 + np.cos(math.pi * np.clip(rel, -1.0, 1.0)))

        # Dynamic intensity curve across the trailer (builds from 0.45 in Act I to 1.0 in Act IV)
        intensity = np.interp(center_t, [0, 32, 68, 105, 136, duration_sec], [0.48, 0.62, 0.78, 1.00, 0.90, 0.70])

        seg_l = np.zeros_like(seg_t)
        seg_r = np.zeros_like(seg_t)
        weights = [0.35, 0.25, 0.20, 0.16, 0.13, 0.10]
        for v_i, (f, w) in enumerate(zip(freqs, weights)):
            detune = 1.0018 if (v_i % 2 == 0) else 0.9982
            vib = 0.0018 * np.sin(2.0 * math.pi * (3.6 + 0.25 * v_i) * seg_t)
            ph_l = 2.0 * math.pi * f * (seg_t + vib)
            ph_r = 2.0 * math.pi * (f * detune) * (seg_t - vib)
            # Warm brass + string harmonics (stronger 2nd and 3rd harmonics during climax)
            h2 = 0.30 * intensity
            h3 = 0.12 * intensity
            tone_l = np.sin(ph_l) + h2 * np.sin(2.0 * ph_l + 0.3) + h3 * np.sin(3.0 * ph_l + 0.7)
            tone_r = np.sin(ph_r + 0.25) + h2 * np.sin(2.0 * ph_r + 0.8) + h3 * np.sin(3.0 * ph_r + 1.2)
            seg_l += w * tone_l
            seg_r += w * tone_r

        # Add melodic heroic motif notes in Acts II-V
        motif = [freqs[3] * 2.0, freqs[4] * 2.0, freqs[5] * 2.0, freqs[4] * 2.0]
        for m_i, mf in enumerate(motif):
            ns = center_t - 0.5 * bar_len + m_i * (bar_len / 4.0)
            ni0 = max(i0, int(ns * sr))
            ni1 = min(i1, int((ns + 1.8) * sr))
            if ni1 > ni0:
                nt = t[ni0:ni1] - ns
                n_env = (1.0 - np.exp(-nt / 0.04)) * np.exp(-nt / 0.85)
                n_sig = 0.065 * intensity * n_env * (np.sin(2.0 * math.pi * mf * nt) + 0.25 * np.sin(4.0 * math.pi * mf * nt))
                if m_i % 2 == 0:
                    left[ni0:ni1] += n_sig * 1.15
                    right[ni0:ni1] += n_sig * 0.75
                else:
                    left[ni0:ni1] += n_sig * 0.75
                    right[ni0:ni1] += n_sig * 1.15

        left[i0:i1] += intensity * env * seg_l
        right[i0:i1] += intensity * env * seg_r

    # Add cinematic trailer percussion (deep taiko / sub-bass boom on downbeats & pulse beats)
    pulse_times: List[Tuple[float, float]] = []
    # Act I major title hits
    for hit_t in [0.2, 3.8, 18.0]:
        pulse_times.append((hit_t, 0.85))
    # Act II steady heartbeat pulse every 2.0s
    cur = 32.0
    while cur < 68.0:
        pulse_times.append((cur, 0.55))
        cur += 2.0
    # Act III rising pulse every 1.0s
    cur = 68.0
    while cur < 104.0:
        amp = 0.70 if int(round(cur)) % 2 == 0 else 0.40
        pulse_times.append((cur, amp))
        cur += 1.0
    # Act IV climax driving cinematic drums every 0.75s
    cur = 104.0
    while cur < 135.0:
        pulse_times.append((cur, 0.85))
        cur += 1.5
    # Act V Finale grand boom on "SNSHERO.COM : THE MOVIE" and "Visit SNSHero.com!"
    for hit_t in [135.5, 141.0, 146.0]:
        pulse_times.append((hit_t, 1.0))

    for hit_t, amp in pulse_times:
        hi0 = int(hit_t * sr)
        hi1 = min(n_samples, int((hit_t + 0.9) * sr))
        if hi1 > hi0:
            ht = t[hi0:hi1] - hit_t
            # Pitch-dropping sub-bass taiko drum (95Hz -> 42Hz) + soft low-passed impact
            freq_curve = 42.0 + 55.0 * np.exp(-ht / 0.09)
            phase = 2.0 * math.pi * freq_curve * ht
            drum_env = (1.0 - np.exp(-ht / 0.008)) * np.exp(-ht / 0.28)
            boom = 0.38 * amp * drum_env * np.sin(phase)
            left[hi0:hi1] += boom
            right[hi0:hi1] += boom

    # Normalize to 0.88 peak
    peak = max(float(np.max(np.abs(left))), float(np.max(np.abs(right))), 1e-6)
    left = (left / peak) * 0.88
    right = (right / peak) * 0.88

    stereo = np.empty((n_samples, 2), dtype=np.int16)
    stereo[:, 0] = np.clip(left * 32767.0, -32768, 32767).astype(np.int16)
    stereo[:, 1] = np.clip(right * 32767.0, -32768, 32767).astype(np.int16)

    out_wav.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out_wav), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(stereo.tobytes())
    log(f"Trailer BGM synthesized: {out_wav}")


async def synthesize_trailer_vo_segment(text: str, out_mp3: Path, rate: str = "-5%", pitch: str = "-3Hz") -> float:
    out_mp3.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(5):
        try:
            comm = edge_tts.Communicate(text, voice=VOICE_NAME, rate=rate, pitch=pitch)
            await comm.save(str(out_mp3))
            if out_mp3.exists() and out_mp3.stat().st_size > 1000:
                return probe_duration(out_mp3)
        except Exception:
            await asyncio.sleep(1.2 * (attempt + 1))
    raise RuntimeError(f"Failed to synthesize trailer VO: {text[:40]}")


async def main() -> None:
    t0 = time.time()
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    clips_dir = WORK_DIR / "clips"
    clips_dir.mkdir(parents=True, exist_ok=True)

    # Define the visual timeline of the ~154-second (2m 34s) Official Theatrical Trailer
    # Each item is either ("card", lines, duration) or ("cut", ep_num, scene_idx, offset_sec, duration)
    timeline = [
        # --- ACT I: THE OATH IN THE BLIZZARD (0.0s .. 32.5s = 32.5s) ---
        (
            "card",
            [
                ("S N S H E R O . C O M     P R E S E N T S", 24, (190, 165, 115), False),
                ("", 0, (0, 0, 0), False),
                ("AN ORIGINAL DARK FANTASY MOTION PICTURE EVENT", 32, (245, 242, 235), False),
                ("천하제일 영웅전 · 오리지널 다크 판타지 대서사시", 24, (175, 175, 180), True),
            ],
            3.5,
        ),
        ("cut", 1, 1, 0.5, 4.0),   # EP01: Blizzard frontier village & tavern vows
        ("cut", 1, 5, 0.5, 4.0),   # EP01: Golden protective aegis & silver daggers
        ("cut", 1, 12, 0.5, 3.5),  # EP01: Burning village & wooden bridge defense
        ("cut", 2, 4, 0.5, 3.5),   # EP02: Oath of the Seven Pursuers
        ("cut", 3, 9, 0.5, 3.5),   # EP03: Blood on the Mist Cliff battle
        ("cut", 4, 6, 0.5, 3.5),   # EP04: Child raised in the northern wastes
        ("cut", 5, 11, 0.5, 3.5),  # EP05: Phantom in the downpour duel
        ("cut", 6, 14, 0.5, 3.5),  # EP06: The Art of Breathing Stars awakening

        # --- ACT II: THE RISING HEROES & COMPANIONS (32.5s .. 68.0s = 35.5s) ---
        (
            "card",
            [
                ("TWO SILVER DAGGERS.   ONE SHATTERED KINGDOM.", 34, (245, 240, 230), False),
                ("두 자루의 은빛 단검, 그리고 깨어나는 운명", 26, (185, 165, 120), True),
            ],
            3.5,
        ),
        ("cut", 7, 8, 0.5, 4.0),   # EP07: The Traitors' Pavilion confrontation
        ("cut", 8, 10, 0.5, 4.0),  # EP08: Rider of the Crimson Mane
        ("cut", 9, 12, 0.5, 4.0),  # EP09: Wind in Beggar's Clothes
        ("cut", 10, 7, 0.5, 4.0),  # EP10: Prisoner of the Flame Court
        ("cut", 11, 15, 0.5, 4.0), # EP11: The Dagger That Wakes Memory
        ("cut", 13, 9, 0.5, 4.0),  # EP13: Master of the Jade Staff
        ("cut", 15, 11, 0.5, 4.0), # EP15: Night of Serpent and Lion
        ("cut", 16, 14, 0.5, 4.0), # EP16: Brothers Before the Ruins

        # --- ACT III: TRIALS OF SEA, SHADOW & SANCTUM (68.0s .. 104.5s = 36.5s) ---
        (
            "card",
            [
                ("ACROSS FORTY EPISODES OF WAR & BETRAYAL", 34, (245, 240, 230), False),
                ("전 40화에 걸쳐 펼쳐지는 거대한 전쟁과 음모", 26, (185, 165, 120), True),
            ],
            3.5,
        ),
        ("cut", 18, 10, 0.5, 3.8), # EP18: Secret of the Black Sanctum
        ("cut", 19, 13, 0.5, 3.8), # EP19: The Three Trials
        ("cut", 20, 15, 0.5, 3.8), # EP20: The Wave That Swallowed the Flower Ship
        ("cut", 21, 9, 0.5, 3.8),  # EP21: Betrayal Aboard the Burning Ship
        ("cut", 24, 12, 0.5, 3.6), # EP24: Seven Nights in the Sealed Chamber
        ("cut", 25, 14, 0.5, 3.6), # EP25: Night of the False Wedding
        ("cut", 28, 11, 0.5, 3.6), # EP28: Revolt of the Jade Council
        ("cut", 29, 16, 0.5, 3.5), # EP29: Queen of the Wind
        ("cut", 30, 13, 0.5, 3.5), # EP30: Poison at the Four Gates

        # --- ACT IV: CLIMAX MONTAGE OF KINGS & LEGENDS (104.5s .. 135.5s = 31.0s) ---
        (
            "card",
            [
                ("TRUE HEROES ARE FORGED IN THE STORM", 38, (255, 248, 235), False),
                ("폭풍의 끝에서 진정한 영웅의 전설이 완성된다", 26, (185, 165, 120), True),
            ],
            3.0,
        ),
        ("cut", 31, 14, 0.5, 2.8), # EP31: The Hand That Wagered Everything
        ("cut", 32, 11, 0.5, 2.8), # EP32: Echo of First Love
        ("cut", 33, 15, 0.5, 2.8), # EP33: Grudge of the Black Marsh
        ("cut", 34, 12, 0.5, 2.8), # EP34: The Fallen Wind Isle
        ("cut", 35, 10, 0.5, 2.8), # EP35: Mistaken in the Fog
        ("cut", 36, 14, 0.5, 2.8), # EP36: Map of the Cross-Shaped Scar
        ("cut", 37, 16, 0.5, 2.8), # EP37: War of the Conqueror King
        ("cut", 38, 13, 0.5, 2.8), # EP38: Three Silk Seals
        ("cut", 39, 17, 0.5, 2.8), # EP39: The World Worth Protecting
        ("cut", 40, 19, 0.5, 2.8), # EP40: One Who Is Not Called a Hero

        # --- ACT V: GRAND FINALE & "Visit SNSHero.com!" (135.5s .. 154.0s = 18.5s) ---
        (
            "card",
            [
                ("S N S H E R O . C O M", 28, (195, 170, 115), False),
                ("THE MOVIE", 66, (255, 250, 240), False),
                ("THE COMPLETE 40-EPISODE THEATRICAL EDITION", 24, (215, 195, 150), False),
                ("천하제일 영웅전 · 전 40화 통합 극장판", 26, (185, 185, 190), True),
            ],
            5.5,
        ),
        (
            "card",
            [
                ("PLAY THE AI CARD BATTLE   ·   READ THE NOVEL   ·   WATCH THE SAGA", 24, (220, 200, 155), False),
                ("", 0, (0, 0, 0), False),
                ("COMMAND 110 LEGENDARY HEROES IN REAL-TIME TACTICAL BATTLES", 28, (245, 242, 235), False),
                ("110종의 영웅 카드 배틀과 원작 판타지 웹소설을 지금 만나보세요", 26, (185, 185, 190), True),
            ],
            5.0,
        ),
        (
            "card",
            [
                ("YOUR LEGEND AWAITS", 26, (195, 170, 115), False),
                ("", 0, (0, 0, 0), False),
                ("Visit SNSHero.com!", 68, (255, 252, 240), False),
                ("", 0, (0, 0, 0), False),
                ("https://snshero.com", 32, (215, 195, 145), False),
                ("지금 바로 SNSHero.com에 접속하세요!", 26, (185, 185, 190), True),
            ],
            8.0,
        ),
    ]

    log(f"Rendering {len(timeline)} trailer cuts & title cards...")
    segment_mp4s: List[Path] = []
    cur_t = 0.0
    for idx, item in enumerate(timeline, start=1):
        seg_mp4 = clips_dir / f"seg_{idx:03d}.mp4"
        kind = item[0]
        if kind == "card":
            _, lines, dur = item
            render_trailer_card(
                lines,
                seg_mp4,
                duration=dur,
                gold_border=True,
                fade_in=0.45,
                fade_out=0.45,
            )
            cur_t += dur
        else:
            _, ep_num, sc_idx, offset_s, dur = item
            extract_trailer_cut(
                ep_num,
                sc_idx,
                offset_s,
                dur,
                seg_mp4,
                fade_in=0.18,
                fade_out=0.18,
            )
            cur_t += dur
        segment_mp4s.append(seg_mp4)
        if idx % 10 == 0 or idx == len(timeline):
            log(f"  Rendered {idx}/{len(timeline)} segments (timeline at {cur_t:.1f}s)")

    concat_txt = WORK_DIR / "trailer_concat.txt"
    concat_txt.write_text("\n".join(f"file '{p}'" for p in segment_mp4s) + "\n", encoding="utf-8")

    trailer_silent_mp4 = WORK_DIR / "trailer_silent.mp4"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_txt),
            "-c:v",
            "copy",
            "-an",
            "-sn",
            str(trailer_silent_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    total_vid_dur = probe_duration(trailer_silent_mp4)
    log(f"Trailer video stream assembled: {total_vid_dur:.2f}s (2m {int(total_vid_dur)%60:02d}s)")

    # Synthesize the 5-Act Movie Trailer Voiceover (timed precisely to the 5 Acts!)
    vo_specs = [
        # (start_time_sec, narration_text)
        (
            1.2,
            "At the edge of a frozen kingdom, where blizzard winds bury the fallen... "
            "three sworn brothers forged a sacred vow beneath the storm. "
            "Two silver daggers were placed into the hands of unborn sons, Kadan and Ignis... "
            "before the fires of betrayal consumed their homeland.",
        ),
        (
            33.5,
            "Raised apart by fate, one grew amid the merciless northern wastes, "
            "while the other mastered the ancient art of breathing stars. "
            "From the Traitors' Pavilion to the Rider of the Crimson Mane, "
            "and the flames of the imperial court... "
            "every clash draws them closer to the truth.",
        ),
        (
            69.0,
            "Across storm-tossed seas, burning flower ships, and the shadows of the Black Sanctum... "
            "secret covenants and deadly poison threaten to tear the continent apart. "
            "When the Jade Council rises in revolt, allies and rivals alike must face the ultimate trial.",
        ),
        (
            105.2,
            "Now, forty epic chapters of loyalty, sacrifice, and war converge. "
            "When the Conqueror King marches and the dark marsh awakens... "
            "who will stand to protect the world, and claim the destiny of a true hero?",
        ),
        (
            136.0,
            "S N S Hero: The Movie. "
            "Experience the complete forty-episode saga, read the original novel, "
            "and command over one hundred legendary heroes in battle. "
            "Visit S N S Hero dot com!",
        ),
    ]

    vo_files: List[Tuple[int, Path]] = []
    for i, (st_sec, text) in enumerate(vo_specs, start=1):
        vo_mp3 = WORK_DIR / f"vo_act_{i}.mp3"
        vo_dur = await synthesize_trailer_vo_segment(text, vo_mp3, rate="-5%", pitch="-3Hz")
        log(f"  Act {i} VO: starts at {st_sec:.1f}s, duration {vo_dur:.2f}s (ends at {st_sec+vo_dur:.1f}s)")
        vo_files.append((int(round(st_sec * 1000)), vo_mp3))

    bgm_wav = WORK_DIR / "trailer_epic_bgm.wav"
    generate_epic_trailer_bgm(bgm_wav, duration_sec=total_vid_dur + 2.0, sr=48000)

    # Mix BGM + 5 Act VO tracks
    fade_out_st = total_vid_dur - 2.5
    fc_parts = [
        f"[0:a]volume=0.22,afade=t=in:st=0:d=1.0,afade=t=out:st={fade_out_st:.2f}:d=2.5[bgm]"
    ]
    mix_labels = ["[bgm]"]
    cmd_inputs = ["-t", f"{total_vid_dur:.2f}", "-i", str(bgm_wav)]
    for idx, (delay_ms, vo_mp3) in enumerate(vo_files, start=1):
        cmd_inputs.extend(["-i", str(vo_mp3)])
        lbl = f"[vo{idx}]"
        fc_parts.append(f"[{idx}:a]volume=1.45,adelay={delay_ms}|{delay_ms}{lbl}")
        mix_labels.append(lbl)

    n_in = len(mix_labels)
    fc_parts.append(
        f"{''.join(mix_labels)}amix=inputs={n_in}:duration=first:dropout_transition=0:normalize=0,"
        f"alimiter=limit=0.96[aout]"
    )
    filter_complex = ";".join(fc_parts)

    trailer_audio_m4a = WORK_DIR / "trailer_audio.m4a"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            *cmd_inputs,
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
            f"{total_vid_dur:.2f}",
            str(trailer_audio_m4a),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    out_trailer_mp4 = IMPROVE_DIR / "SNSHero com The Movie - Official Theatrical Trailer.mp4"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(trailer_silent_mp4),
            "-i",
            str(trailer_audio_m4a),
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
            str(out_trailer_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    final_dur = probe_duration(out_trailer_mp4)
    size_mb = out_trailer_mp4.stat().st_size / (1024 * 1024)
    log(
        f"TRAILER COMPLETED in {time.time()-t0:.1f}s -> {out_trailer_mp4} "
        f"(Duration: {final_dur:.2f}s / {int(final_dur)//60}m {int(final_dur)%60:02d}s, Size: {size_mb:.1f} MB)"
    )


if __name__ == "__main__":
    asyncio.run(main())
