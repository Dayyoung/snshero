#!/usr/bin/env python3
"""
scripts/generate_all_40_episode_videos.py
SNSHero 40-Episode 20fps Continuous Motion Cinema MP4 Engine

Transforms the 40 episodes (2,049 card-accurate webtoon scenes) into fluid,
continuous 20fps animated movies (.mp4):
1. Sub-pixel C-level floating-point camera motion (Dolly In/Out, Pan L/R, Diagonal Crane)
   on every single frame (zero static slideshow frames).
2. Live 2-layer parallax atmospheric particle animation (blizzard snow, battle fire embers,
   arcane starlight motes, abyssal mist) moving continuously at 20fps.
3. Dynamic combat camera shake + sword-slash/impact flash on action & SFX scenes.
4. Audio-reactive speaking character portrait animation (portrait bounce + live 5-bar
   voice equalizer synced to the 44.1kHz English TTS voiceover waveform) + progressive
   dialogue subtitle reveal.
5. Smooth 0.45s cross-dissolve transitions between every scene while cameras are moving.
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
MANIFEST_PATH = PROJECT_ROOT / 'src' / 'content' / 'webtoonEpisodeManifest.json'
MAPPING_PATH = PROJECT_ROOT / 'src' / 'content' / 'movieEpisodeMapping.ts'
CARD_DB_PATH = PROJECT_ROOT / 'src' / 'cardDatabase.ts'
SEAT_DIR = PROJECT_ROOT / 'public' / 'seat'
STORYBOOK_RAW_DIR = PROJECT_ROOT / 'public' / 'images' / 'storybook' / 'raw_sheets'
OUTPUT_DIR = PROJECT_ROOT / 'public' / 'video' / 'animation'

FFMPEG_BIN = shutil.which('ffmpeg') or '/opt/homebrew/bin/ffmpeg'
FFPROBE_BIN = shutil.which('ffprobe') or '/opt/homebrew/bin/ffprobe'

FPS = 15
WIDTH = 800
ART_H = 450
DOCK_H = 110
HEIGHT = ART_H + DOCK_H  # 560

FONT_CANDIDATES = [
    '/System/Library/Fonts/Menlo.ttc',
    '/System/Library/Fonts/SFNSMono.ttf',
    '/Library/Fonts/Courier New.ttf',
    '/System/Library/Fonts/Supplemental/Courier New.ttf',
]
FONT_PATH = next((p for p in FONT_CANDIDATES if os.path.exists(p)), None)


def load_card_portrait_map() -> dict:
    cards = {}
    if not CARD_DB_PATH.is_file():
        return cards
    content = CARD_DB_PATH.read_text(encoding='utf-8')
    pattern = re.compile(
        r"id:\s*(\d+)[^}]+?title:\s*['\"]([^'\"]+)['\"],[^}]+?title_en:\s*['\"]([^'\"]+)['\"]"
    )
    for m in pattern.finditer(content):
        cid = int(m.group(1))
        t_en = m.group(3)
        cards[cid] = f"{t_en.replace(' ', '_')}.png"
    return cards


def load_episode_themes() -> dict:
    themes = {}
    if not MAPPING_PATH.is_file():
        return themes
    content = MAPPING_PATH.read_text(encoding='utf-8')
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


def synthesize_bgm_wav(theme: str, duration_sec: float, out_wav_path: str):
    """Synthesize high-fidelity 44.1kHz stereo BGM audio track in NumPy."""
    sample_rate = 44100
    n_samples = max(sample_rate, int(sample_rate * duration_sec))
    t = np.linspace(0, duration_sec, n_samples, endpoint=False)

    left = np.zeros(n_samples, dtype=np.float32)
    right = np.zeros(n_samples, dtype=np.float32)

    if theme == 'arctic-blizzard':
        left += 0.22 * np.sin(2 * np.pi * 55 * t) + 0.12 * np.sin(2 * np.pi * 110 * t)
        right += 0.20 * np.sin(2 * np.pi * 55 * t + 0.5) + 0.14 * np.sin(2 * np.pi * 110 * t)
        noise = np.random.uniform(-0.12, 0.12, n_samples)
        kernel = np.ones(35) / 35
        wind = np.convolve(noise, kernel, mode='same') * (0.8 + 0.35 * np.sin(2 * np.pi * 0.15 * t))
        left += wind * 0.9
        right += wind * 1.1
        chimes = [880, 1046.5, 1318.5, 1567.98, 1760]
        for step in range(int(duration_sec / 2.5)):
            base_t = step * 2.5 + 0.5
            for ci, freq in enumerate(chimes):
                st = base_t + ci * 0.22
                if st < duration_sec:
                    mask = (t >= st) & (t < st + 1.8)
                    dt = t[mask] - st
                    env = np.exp(-3.5 * dt)
                    sig = 0.15 * np.sin(2 * np.pi * freq * dt) * env
                    left[mask] += sig
                    right[mask] += sig * 0.85

    elif theme == 'battle-march':
        for beat in range(int(duration_sec / 1.25)):
            st = beat * 1.25
            mask = (t >= st) & (t < st + 0.5)
            dt = t[mask] - st
            pitch = 120 * np.exp(-12 * dt) + 45
            drum = 0.35 * np.sin(2 * np.pi * pitch * dt) * np.exp(-6 * dt)
            left[mask] += drum
            right[mask] += drum
        bass_notes = [73.4, 87.3, 98.0, 110.0]
        for step in range(int(duration_sec / 2.5)):
            st = step * 2.5
            freq = bass_notes[step % len(bass_notes)]
            mask = (t >= st) & (t < st + 2.4)
            dt = t[mask] - st
            env = np.minimum(dt * 10, 1.0) * np.exp(-0.8 * dt)
            bass = 0.20 * np.sin(2 * np.pi * freq * dt) * env
            left[mask] += bass
            right[mask] += bass
        chords = [[146.8, 220.0, 293.7], [174.6, 261.6, 349.2], [130.8, 196.0, 261.6]]
        for step in range(int(duration_sec / 5.0)):
            st = step * 5.0 + 0.2
            chord = chords[step % len(chords)]
            mask = (t >= st) & (t < st + 4.5)
            dt = t[mask] - st
            env = np.minimum(dt * 5, 1.0) * np.exp(-0.4 * dt)
            for f in chord:
                sig = 0.08 * (np.sin(2 * np.pi * f * dt) + 0.4 * np.sin(4 * np.pi * f * dt)) * env
                left[mask] += sig
                right[mask] += sig * 0.9

    elif theme == 'arcane-mystery':
        left += 0.18 * np.sin(2 * np.pi * 110 * t) + 0.10 * np.sin(2 * np.pi * 164.8 * t)
        right += 0.16 * np.sin(2 * np.pi * 110 * t + 0.8) + 0.12 * np.sin(2 * np.pi * 277.2 * t)
        notes = [440.0, 493.88, 523.25, 659.25, 739.99, 880.0]
        for step in range(int(duration_sec / 3.0)):
            base_t = step * 3.0 + 0.4
            for ni, freq in enumerate(notes):
                st = base_t + ni * 0.3
                if st < duration_sec:
                    mask = (t >= st) & (t < st + 2.2)
                    dt = t[mask] - st
                    env = np.exp(-2.2 * dt)
                    sig = 0.12 * np.sin(2 * np.pi * freq * dt) * env
                    left[mask] += sig
                    right[mask] += sig * 0.8

    elif theme == 'triumph-fanfare':
        chords = [[261.6, 329.6, 392.0], [293.7, 369.9, 440.0], [392.0, 493.9, 587.3], [523.2, 659.3, 784.0]]
        for step in range(int(duration_sec / 3.5)):
            st = step * 3.5
            chord = chords[step % len(chords)]
            mask = (t >= st) & (t < st + 3.2)
            dt = t[mask] - st
            env = np.minimum(dt * 15, 1.0) * np.exp(-0.6 * dt)
            for f in chord:
                sig = 0.12 * (np.sin(2 * np.pi * f * dt) + 0.3 * np.sin(4 * np.pi * f * dt)) * env
                left[mask] += sig
                right[mask] += sig
        for beat in range(int(duration_sec / 1.75)):
            st = beat * 1.75
            mask = (t >= st) & (t < st + 0.6)
            dt = t[mask] - st
            drum = 0.30 * np.sin(2 * np.pi * (95 * np.exp(-8 * dt) + 50) * dt) * np.exp(-4 * dt)
            left[mask] += drum
            right[mask] += drum

    elif theme == 'dark-ominous':
        left += 0.22 * np.sin(2 * np.pi * 65.4 * t) + 0.15 * np.sin(2 * np.pi * 92.5 * t)
        right += 0.20 * np.sin(2 * np.pi * 65.4 * t + 1.0) + 0.16 * np.sin(2 * np.pi * 92.5 * t)
        noise = np.random.uniform(-0.15, 0.15, n_samples)
        kernel = np.ones(50) / 50
        rumble = np.convolve(noise, kernel, mode='same') * (0.7 + 0.3 * np.sin(2 * np.pi * 0.1 * t))
        left += rumble
        right += rumble
        for step in range(int(duration_sec / 4.0)):
            st = step * 4.0 + 1.0
            mask = (t >= st) & (t < st + 2.5)
            dt = t[mask] - st
            hit = 0.18 * np.sin(2 * np.pi * 311.1 * dt) * np.exp(-1.5 * dt)
            left[mask] += hit
            right[mask] += hit * 0.7

    else:
        left += 0.20 * np.sin(2 * np.pi * 82.4 * t) + 0.12 * np.sin(2 * np.pi * 123.5 * t)
        right += 0.18 * np.sin(2 * np.pi * 82.4 * t + 0.4) + 0.14 * np.sin(2 * np.pi * 196.0 * t)
        solo_notes = [329.6, 392.0, 440.0, 493.9, 587.3, 523.2]
        for step in range(int(duration_sec / 3.0)):
            st = step * 3.0 + 0.5
            freq = solo_notes[step % len(solo_notes)]
            mask = (t >= st) & (t < st + 2.8)
            dt = t[mask] - st
            vibrato = 1.0 + 0.015 * np.sin(2 * np.pi * 4.5 * dt)
            env = np.minimum(dt * 3, 1.0) * np.exp(-0.5 * dt)
            sig = 0.15 * np.sin(2 * np.pi * (freq * vibrato) * dt) * env
            left[mask] += sig
            right[mask] += sig * 0.85

    fade_in_samples = int(sample_rate * 1.5)
    if n_samples > fade_in_samples:
        fade_in_curve = np.linspace(0.0, 1.0, fade_in_samples)
        left[:fade_in_samples] *= fade_in_curve
        right[:fade_in_samples] *= fade_in_curve

    fade_out_samples = int(sample_rate * 2.5)
    if n_samples > fade_out_samples:
        fade_out_curve = np.linspace(1.0, 0.0, fade_out_samples)
        left[-fade_out_samples:] *= fade_out_curve
        right[-fade_out_samples:] *= fade_out_curve

    max_val = max(np.max(np.abs(left)), np.max(np.abs(right)), 1e-6)
    gain = 0.88 / max_val
    left = np.clip(left * gain, -0.99, 0.99)
    right = np.clip(right * gain, -0.99, 0.99)

    int_l = (left * 32767).astype(np.int16)
    int_r = (right * 32767).astype(np.int16)
    stereo = np.empty((n_samples * 2,), dtype=np.int16)
    stereo[0::2] = int_l
    stereo[1::2] = int_r

    with wave.open(out_wav_path, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(stereo.tobytes())


def clean_tts_line(text: str) -> str:
    cleaned = re.sub(r'\[\[.*?\]\]', ' ', text or '')
    cleaned = re.sub(r'["“”\'‘’`*_~<>|]', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    if not cleaned:
        return 'Next scene.'
    if cleaned[-1] not in '.!?':
        cleaned += '.'
    return cleaned


def synthesize_tts_and_bgm_wav(ep_num: int, scene_scripts: list, theme: str,
                               fallback_durations: list, out_wav_path: str) -> tuple[list, np.ndarray]:
    """
    Synthesizes 44.1kHz stereo WAV (English TTS + ducked BGM) and returns:
      (aligned_durations_per_scene, voice_envelope_at_FPS)
    """
    say_bin = '/usr/bin/say'
    tts_wav_path = out_wav_path + '.tts22k.wav'
    n_scenes = len(scene_scripts)

    if os.path.exists(say_bin) and n_scenes > 0:
        joined_script = ' [[slnc 900]] '.join(clean_tts_line(s) for s in scene_scripts)
        cmd = [
            say_bin,
            '-v', 'Samantha',
            '-r', '185',
            '-o', tts_wav_path,
            '--data-format=LEI16@22050',
            joined_script,
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0 and os.path.exists(tts_wav_path):
            try:
                with wave.open(tts_wav_path, 'rb') as wf:
                    sr_tts = wf.getframerate()
                    n_frames = wf.getnframes()
                    raw_bytes = wf.readframes(n_frames)
                os.remove(tts_wav_path)

                tts_pcm = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
                win = int(sr_tts * 0.02)
                n_wins = len(tts_pcm) // win
                if n_wins > 0 and n_scenes > 1:
                    reshaped = tts_pcm[:n_wins * win].reshape(n_wins, win)
                    rms = np.sqrt(np.mean(reshaped * reshaped, axis=1))
                    silent = rms < 0.0035

                    gaps = []
                    in_gap = False
                    g_start = 0
                    for wi, is_s in enumerate(silent):
                        if is_s and not in_gap:
                            in_gap = True
                            g_start = wi
                        elif not is_s and in_gap:
                            in_gap = False
                            g_len = wi - g_start
                            if g_len >= 28 and g_start > 5 and wi < n_wins - 5:
                                mid_sec = ((g_start + wi) / 2.0) * 0.02
                                gaps.append((g_len, mid_sec))

                    if len(gaps) >= n_scenes - 1:
                        top_gaps = sorted(gaps, key=lambda x: x[0], reverse=True)[:n_scenes - 1]
                        split_points = sorted(x[1] for x in top_gaps)
                    else:
                        total_tts_sec = len(tts_pcm) / float(sr_tts)
                        weights = [max(len(s), 8) for s in scene_scripts]
                        total_w = float(sum(weights))
                        acc = 0.0
                        split_points = []
                        for w in weights[:-1]:
                            acc += (w / total_w) * total_tts_sec
                            split_points.append(acc)

                    total_tts_sec = len(tts_pcm) / float(sr_tts) + 0.75
                    boundaries = [0.0] + split_points + [total_tts_sec]
                    aligned_durations = [
                        max(1.8, boundaries[i + 1] - boundaries[i])
                        for i in range(n_scenes)
                    ]
                else:
                    total_tts_sec = len(tts_pcm) / float(sr_tts) + 0.75
                    aligned_durations = [total_tts_sec] if n_scenes == 1 else fallback_durations

                total_dur = sum(aligned_durations)
                bgm_only_path = out_wav_path + '.bgm.wav'
                synthesize_bgm_wav(theme, total_dur, bgm_only_path)

                with wave.open(bgm_only_path, 'rb') as bwf:
                    bgm_frames = bwf.readframes(bwf.getnframes())
                os.remove(bgm_only_path)

                bgm_stereo = np.frombuffer(bgm_frames, dtype=np.int16).astype(np.float32) / 32768.0
                bgm_l = bgm_stereo[0::2]
                bgm_r = bgm_stereo[1::2]
                n_44k = len(bgm_l)

                tts_44k_len = len(tts_pcm) * 2
                tts_44k = np.zeros(n_44k, dtype=np.float32)
                x_old = np.arange(len(tts_pcm), dtype=np.float32)
                x_new = np.linspace(0, len(tts_pcm) - 1, min(tts_44k_len, n_44k), dtype=np.float32)
                tts_up = np.interp(x_new, x_old, tts_pcm).astype(np.float32)

                tts_peak = max(float(np.max(np.abs(tts_up))), 1e-5)
                tts_up = (tts_up / tts_peak) * 0.90
                tts_44k[:len(tts_up)] = tts_up

                voice_env = np.abs(tts_44k)
                duck_kernel = np.ones(2205, dtype=np.float32) / 2205.0
                voice_active = np.convolve(voice_env, duck_kernel, mode='same')
                bgm_gain = np.where(voice_active > 0.015, 0.24, 0.48).astype(np.float32)

                mix_l = np.clip(bgm_l * bgm_gain + tts_44k * 0.92, -0.99, 0.99)
                mix_r = np.clip(bgm_r * bgm_gain + tts_44k * 0.92, -0.99, 0.99)

                out_stereo = np.empty((n_44k * 2,), dtype=np.int16)
                out_stereo[0::2] = (mix_l * 32767).astype(np.int16)
                out_stereo[1::2] = (mix_r * 32767).astype(np.int16)

                with wave.open(out_wav_path, 'wb') as wf:
                    wf.setnchannels(2)
                    wf.setsampwidth(2)
                    wf.setframerate(44100)
                    wf.writeframes(out_stereo.tobytes())

                # Compute per-video-frame voice envelope at FPS
                samples_per_vframe = int(44100 / FPS)
                n_vframes = max(1, len(voice_active) // samples_per_vframe)
                v_env = voice_active[:n_vframes * samples_per_vframe].reshape(n_vframes, samples_per_vframe).mean(axis=1)
                v_env = np.clip(v_env * 5.5, 0.0, 1.0)
                return aligned_durations, v_env
            except Exception as e:
                print(f"[WARN] Ep {ep_num} TTS mix fallback: {e}")

    total_dur = sum(fallback_durations)
    synthesize_bgm_wav(theme, total_dur, out_wav_path)
    n_vframes = int(total_dur * FPS) + 10
    return fallback_durations, np.full(n_vframes, 0.4, dtype=np.float32)


def resolve_portrait_file(img_entry: dict, card_map: dict) -> str:
    dialogues = img_entry.get('dialogues', [])
    if dialogues:
        cid = dialogues[0].get('characterCardId')
        if cid and cid in card_map:
            p = card_map[cid]
            if (SEAT_DIR / p).is_file():
                return p
        sp_en = dialogues[0].get('speakerEn', '')
        if sp_en and sp_en != 'Narration':
            sp_file = f"{sp_en.replace(' ', '_')}.png"
            if (SEAT_DIR / sp_file).is_file():
                return sp_file

    characters = img_entry.get('characters', [])
    if characters:
        for ch in characters:
            ch_file = f"{ch.replace(' ', '_')}.png"
            if (SEAT_DIR / ch_file).is_file():
                return ch_file
    return ''


def build_scrolling_particle_atlas(theme: str) -> tuple[Image.Image, tuple[int, int]]:
    """
    Pre-renders a seamless 1600x900 RGBA atmospheric particle sheet and (vx, vy) per-frame velocity
    so every frame has live animated snow, fire embers, starlight motes, or abyssal mist.
    """
    aw, ah = 1600, 900
    atlas = Image.new('RGBA', (aw, ah), (0, 0, 0, 0))
    draw = ImageDraw.Draw(atlas)
    rng = np.random.default_rng(42)

    if theme == 'arctic-blizzard':
        color_main = (235, 245, 255)
        color_sub = (180, 220, 255)
        vel = (-11, 7)  # Diagonal driving blizzard wind
        n_dots = 260
    elif theme == 'battle-march':
        color_main = (255, 165, 50)
        color_sub = (255, 90, 30)
        vel = (4, -8)   # Rising battle embers and sparks
        n_dots = 200
    elif theme == 'dark-ominous':
        color_main = (195, 110, 255)
        color_sub = (255, 65, 95)
        vel = (-4, -5)  # Floating abyssal ash & dark mana
        n_dots = 180
    elif theme == 'triumph-fanfare':
        color_main = (255, 230, 130)
        color_sub = (140, 235, 255)
        vel = (3, -6)   # Rising golden starlight motes
        n_dots = 190
    else:  # arcane-mystery / sorrow-lament
        color_main = (130, 235, 255)
        color_sub = (190, 255, 210)
        vel = (-3, -4)  # Gently drifting spirit motes
        n_dots = 175

    # Tile seamlessly across 2x2 quadrants (800x450 each)
    for _ in range(n_dots):
        x = int(rng.integers(0, WIDTH))
        y = int(rng.integers(0, ART_H))
        r = int(rng.choice([1, 2, 2, 3, 4]))
        alpha = int(rng.integers(75, 195))
        c = color_main if rng.random() > 0.35 else color_sub
        fill = (c[0], c[1], c[2], alpha)
        for tx in (0, WIDTH):
            for ty in (0, ART_H):
                px, py = x + tx, y + ty
                if theme == 'arctic-blizzard' and r >= 3:
                    # Slight diagonal snow streak
                    draw.line([(px, py), (px - 5, py + 3)], fill=fill, width=2)
                else:
                    draw.ellipse([px - r, py - r, px + r, py + r], fill=fill)

    return atlas, vel


def extract_raw_storybook_cells(ep_num: int) -> list[Image.Image]:
    """
    Extracts the 9 cells from today's 3x3 multi-character storybook sheet
    `public/images/storybook/raw_sheets/ep{ep_num:02d}_storybook_sheet.png` at full raw resolution.
    """
    sheet_path = STORYBOOK_RAW_DIR / f"ep{ep_num:02d}_storybook_sheet.png"
    if not sheet_path.is_file():
        return []
    im = Image.open(sheet_path).convert('RGB')
    sw, sh = im.size
    cell_w = sw / 3.0
    cell_h = sh / 3.0
    pad_x = int(cell_w * 0.024)
    pad_y = int(cell_h * 0.026)

    cells = []
    for row in range(3):
        for col in range(3):
            x0 = int(col * cell_w) + pad_x
            y0 = int(row * cell_h) + pad_y
            x1 = int((col + 1) * cell_w) - pad_x
            y1 = int((row + 1) * cell_h) - pad_y
            cells.append(im.crop((x0, y0, x1, y1)))
    return cells


def crop_cell_to_highres_960x540(cell: Image.Image, sub_idx: int) -> Image.Image:
    """
    Crops a clean full-bleed 16:9 widescreen sub-region from a raw 3x3 storybook cell
    and resizes to 960x540 (1.20x of 800x450) for smooth sub-pixel camera motion.
    """
    if sub_idx == 0:
        rx0, ry0, rx1, ry1 = 0.0, 0.0, 1.0, 1.0
    elif sub_idx == 1:
        rx0, ry0, rx1, ry1 = 0.0, 0.03, 0.80, 0.94
    elif sub_idx == 2:
        rx0, ry0, rx1, ry1 = 0.20, 0.04, 1.0, 0.95
    elif sub_idx == 3:
        rx0, ry0, rx1, ry1 = 0.10, 0.06, 0.90, 0.92
    elif sub_idx == 4:
        rx0, ry0, rx1, ry1 = 0.04, 0.01, 0.86, 0.89
    elif sub_idx == 5:
        rx0, ry0, rx1, ry1 = 0.14, 0.08, 0.96, 0.97
    else:
        shift = min(0.12, (sub_idx - 5) * 0.03)
        rx0, ry0, rx1, ry1 = 0.05 + shift, 0.02, 0.95 - shift * 0.5, 0.90

    w, h = cell.size
    x0 = max(0, int(w * rx0))
    y0 = max(0, int(h * ry0))
    x1 = min(w, int(w * rx1))
    y1 = min(h, int(h * ry1))
    sub = cell.crop((x0, y0, x1, y1))

    cw, ch = sub.size
    target_ratio = 960.0 / 540.0
    curr_ratio = cw / float(max(1, ch))
    if curr_ratio > target_ratio:
        new_w = int(ch * target_ratio)
        off_x = (cw - new_w) // 2
        sub = sub.crop((off_x, 0, off_x + new_w, ch))
    elif curr_ratio < target_ratio:
        new_h = int(cw / target_ratio)
        off_y = (ch - new_h) // 2
        sub = sub.crop((0, off_y, cw, off_y + new_h))

    panel = sub.resize((960, 540), Image.Resampling.LANCZOS)
    panel = ImageEnhance.Contrast(panel).enhance(1.04)
    panel = ImageEnhance.Sharpness(panel).enhance(1.08)
    return panel


def prepare_highres_art_source(src_path: Path, is_title: bool,
                               raw_cell: Image.Image = None, sub_idx: int = 0) -> Image.Image:
    """
    Loads the scene image for 960x540 virtual camera motion.
    For narrative scenes (not is_title), uses today's raw multi-character storybook cell directly
    when available so there is zero WebP compression loss or letterbox cropping needed.
    """
    if not is_title and raw_cell is not None:
        return crop_cell_to_highres_960x540(raw_cell, sub_idx)

    im = Image.open(src_path).convert('RGB')
    w, h = im.size
    if not is_title and h >= 440:
        # Crop inside the top/bottom letterbox trim
        im = im.crop((2, 19, w - 2, h - 15))
    # Upscale to 960x540 (1.20x of 800x450) so our 800x450 virtual camera has generous headroom
    return im.resize((960, 540), Image.Resampling.LANCZOS)


def compute_camera_box(scene_idx: int, is_title: bool, has_impact: bool,
                       progress: float, frame_in_scene: int) -> tuple[float, float, float, float]:
    """
    Computes smooth sub-pixel floating-point (x0, y0, x1, y1) inside the 960x540 canvas
    for frame progress in [0.0, 1.0].
    """
    sw, sh = 960.0, 540.0
    # Smooth cosine-eased progress for natural cinematic acceleration/deceleration
    ease = 0.5 - 0.5 * math.cos(math.pi * min(1.0, max(0.0, progress)))

    if is_title:
        # Gentle heroic push-in on title card (preserving title typography near bottom)
        scale = 0.96 - 0.06 * ease
        cx = sw * 0.50
        cy = sh * (0.50 + 0.02 * ease)
    else:
        mode = scene_idx % 6
        if mode == 0:
            # Push-in Zoom toward center-left subject
            scale = 0.95 - 0.14 * ease
            cx = sw * (0.50 - 0.04 * ease)
            cy = sh * (0.50 - 0.02 * ease)
        elif mode == 1:
            # Wide Pull-out Reveal from tight center-right focus
            scale = 0.81 + 0.14 * ease
            cx = sw * (0.54 - 0.04 * ease)
            cy = sh * (0.48 + 0.02 * ease)
        elif mode == 2:
            # Pan Left -> Right across the widescreen panel
            scale = 0.84 - 0.03 * ease
            cx = sw * (0.43 + 0.14 * ease)
            cy = sh * (0.50 - 0.01 * ease)
        elif mode == 3:
            # Pan Right -> Left across the widescreen panel
            scale = 0.84 - 0.03 * ease
            cx = sw * (0.57 - 0.14 * ease)
            cy = sh * (0.50 + 0.01 * ease)
        elif mode == 4:
            # Diagonal Heroic Crane Up-Right
            scale = 0.86 - 0.06 * ease
            cx = sw * (0.46 + 0.08 * ease)
            cy = sh * (0.54 - 0.08 * ease)
        else:
            # Dramatic Center Push-In
            scale = 0.94 - 0.15 * ease
            cx = sw * 0.50
            cy = sh * (0.51 - 0.03 * ease)

    # Add damped combat impact camera shake if scene has SFX / combat clash
    shake_x = 0.0
    shake_y = 0.0
    if has_impact and 0.18 <= progress <= 0.58:
        dt = progress - 0.18
        decay = math.exp(-9.5 * dt)
        shake_x = 11.0 * decay * math.sin(frame_in_scene * 2.1)
        shake_y = 7.5 * decay * math.cos(frame_in_scene * 2.7)

    win_w = sw * scale
    win_h = sh * scale
    x0 = max(0.0, min(sw - win_w, cx - win_w * 0.5 + shake_x))
    y0 = max(0.0, min(sh - win_h, cy - win_h * 0.5 + shake_y))
    return (x0, y0, x0 + win_w, y0 + win_h)


def render_animated_episode_frames(
    ep_num: int,
    scenes_meta: list[dict],
    aligned_durations: list[float],
    voice_env: np.ndarray,
    theme: str,
    ffmpeg_stdin,
):
    """
    Streams 20fps continuous motion RGB24 frames (800x560) directly into ffmpeg_stdin.
    Includes cross-dissolve transitions between consecutive scenes.
    """
    font_title = ImageFont.truetype(FONT_PATH, 21) if FONT_PATH else ImageFont.load_default()
    font_sub = ImageFont.truetype(FONT_PATH, 13) if FONT_PATH else ImageFont.load_default()
    font_bold = ImageFont.truetype(FONT_PATH, 13) if FONT_PATH else ImageFont.load_default()
    font_body = ImageFont.truetype(FONT_PATH, 12) if FONT_PATH else ImageFont.load_default()
    font_sfx = ImageFont.truetype(FONT_PATH, 12) if FONT_PATH else ImageFont.load_default()
    font_micro = ImageFont.truetype(FONT_PATH, 9) if FONT_PATH else ImageFont.load_default()
    font_hud = ImageFont.truetype(FONT_PATH, 10) if FONT_PATH else ImageFont.load_default()

    particle_atlas, (vx, vy) = build_scrolling_particle_atlas(theme)

    # Pre-cache character portrait thumbnails
    portrait_cache: dict[str, Image.Image] = {}
    for sm in scenes_meta:
        pf = sm['portrait_file']
        if pf and pf not in portrait_cache:
            sp = SEAT_DIR / pf
            if sp.is_file():
                try:
                    p_img = Image.open(sp).convert('RGBA').resize((64, 74), Image.Resampling.LANCZOS)
                    portrait_cache[pf] = p_img
                except Exception:
                    pass

    def render_single_scene_frame(sm: dict, s_idx: int, f_local: int, n_scene_frames: int, g_frame: int) -> Image.Image:
        progress = f_local / float(max(1, n_scene_frames - 1))
        has_impact = bool(sm['sfx_list']) or sm['has_combat_kw']

        # 1. Sub-pixel C-level camera pan/zoom/shake on 960x540 high-res artwork
        box = compute_camera_box(s_idx, sm['is_title'], has_impact, progress, f_local)
        art_frame = sm['highres_art'].resize((WIDTH, ART_H), Image.Resampling.BILINEAR, box=box)

        # Impact flash at clash onset
        if has_impact and 0.18 <= progress <= 0.30:
            flash_p = 1.0 - (progress - 0.18) / 0.12
            art_frame = ImageEnhance.Brightness(art_frame).enhance(1.0 + 0.28 * flash_p)

        # 2. Live scrolling atmospheric particles (snow / embers / starlight / mist)
        art_rgba = art_frame.convert('RGBA')
        ox = (g_frame * vx) % WIDTH
        oy = (g_frame * vy) % ART_H
        p_crop = particle_atlas.crop((ox, oy, ox + WIDTH, oy + ART_H))
        art_rgba = Image.alpha_composite(art_rgba, p_crop)

        # 3. Stationary cinema top bar, combat slash streak & animated SFX badge on artwork
        hud_draw = ImageDraw.Draw(art_rgba)
        if has_impact and 0.16 <= progress <= 0.34:
            slash_p = (progress - 0.16) / 0.18
            sx1 = int(WIDTH * (0.12 + 0.55 * slash_p))
            sy1 = int(ART_H * (0.82 - 0.58 * slash_p))
            sx2 = int(WIDTH * (0.38 + 0.52 * slash_p))
            sy2 = int(ART_H * (0.50 - 0.42 * slash_p))
            alpha_s = int(235 * (1.0 - abs(slash_p - 0.5) * 1.8))
            hud_draw.line([sx1, sy1, sx2, sy2], fill=(255, 240, 175, max(0, alpha_s)), width=5)
            hud_draw.line([sx1 - 6, sy1 + 4, sx2 + 6, sy2 - 4], fill=(255, 255, 255, max(0, alpha_s)), width=2)

        if not sm['is_title']:
            hud_draw.rectangle([0, 0, WIDTH, 20], fill=(10, 9, 10, 165))
            hud_draw.rectangle([0, ART_H - 12, WIDTH, ART_H], fill=(10, 9, 10, 155))
            hud_draw.text((12, 10), "SNSHERO · ANIMATED CHRONICLE", fill=(195, 180, 150, 210), font=font_hud, anchor="lm")
            hud_draw.text((WIDTH - 12, 10), f"EP.{ep_num:02d} · SCENE {s_idx:02d}", fill=(215, 210, 200, 210), font=font_hud, anchor="rm")

        # Assemble full 800x560 frame with bottom cinema dock
        canvas = Image.new('RGB', (WIDTH, HEIGHT), (14, 12, 12))
        canvas.paste(art_rgba.convert('RGB'), (0, 0))
        draw = ImageDraw.Draw(canvas)

        dock_y1 = ART_H
        draw.line([0, dock_y1, WIDTH, dock_y1], fill=(212, 175, 55), width=1)

        if sm['is_title']:
            draw.rectangle([16, dock_y1 + 14, 196, dock_y1 + 36], fill=(30, 27, 27), outline=(212, 175, 55), width=1)
            draw.text((24, dock_y1 + 18), 'SNSHERO · THEATER', font=font_bold, fill=(212, 175, 55))
            draw.text((210, dock_y1 + 15), sm['title_en'], font=font_title, fill=(253, 252, 252))
            draw.text((210, dock_y1 + 48), f"EPISODE {ep_num:02d} · OFFICIAL ANIMATED WEBTOON MOVIE", font=font_sub, fill=(185, 210, 235))
        else:
            v_level = float(voice_env[min(g_frame, len(voice_env) - 1)]) if len(voice_env) > 0 else 0.3
            pf = sm['portrait_file']
            portrait_rendered = False
            if pf and pf in portrait_cache:
                p_thumb = portrait_cache[pf]
                # Audio-reactive speaking character bobbing animation!
                bob_y = -int(round(3.5 * v_level * abs(math.sin(g_frame * 0.65))))
                p_x, p_y = 18, dock_y1 + 12
                draw.rectangle([p_x, p_y, p_x + 64, p_y + 74], fill=(28, 25, 25))
                canvas.paste(p_thumb, (p_x, p_y + bob_y), p_thumb)
                border_col = (255, 215, 90) if v_level > 0.25 else (180, 150, 60)
                draw.rectangle([p_x - 1, p_y - 1, p_x + 64, p_y + 74], outline=border_col, width=1)
                draw.rectangle([p_x - 1, p_y + 76, p_x + 65, p_y + 89], fill=border_col)
                draw.text((p_x + 8, p_y + 77), 'SPEAKER', font=font_micro, fill=(14, 12, 12))
                portrait_rendered = True

            text_x = 96 if portrait_rendered else 20
            label = (sm['speaker_en'].upper() if sm['speaker_en'] else 'NARRATION')
            draw.text((text_x, dock_y1 + 12), f"[{label}]", font=font_bold,
                      fill=(212, 175, 55) if portrait_rendered else (140, 200, 255))

            # Live 5-bar audio equalizer next to speaker name
            eq_base_x = text_x + len(label) * 8 + 26
            for bi in range(5):
                bh = max(2, int(12 * v_level * (0.45 + 0.55 * abs(math.sin(g_frame * 0.8 + bi * 1.1)))))
                bx = eq_base_x + bi * 5
                by2 = dock_y1 + 26
                draw.rectangle([bx, by2 - bh, bx + 3, by2], fill=(235, 195, 75))

            if sm['sfx_list']:
                sfx_entry = sm['sfx_list'][0]
                sfx_text = sfx_entry.get('textEn') or sfx_entry.get('textKo') or 'SFX!'
                sfx_w = max(95, len(sfx_text) * 9 + 24)
                sfx_box = [784 - sfx_w, dock_y1 + 10, 784, dock_y1 + 32]
                draw.rectangle(sfx_box, fill=(38, 18, 18), outline=(239, 68, 68), width=1)
                draw.text((792 - sfx_w, dock_y1 + 13), f"SFX: {sfx_text}", font=font_sfx, fill=(255, 210, 90))

            # Progressive typewriter reveal over the first 55% of the scene
            full_text = sm['text_en']
            reveal_ratio = min(1.0, (progress + 0.12) / 0.62)
            n_chars = max(1, int(len(full_text) * reveal_ratio))
            visible_text = full_text[:n_chars]

            wrap_width = 76 if portrait_rendered else 86
            wrapped_lines = textwrap.wrap(visible_text, width=wrap_width)
            curr_y = dock_y1 + 34
            for line in wrapped_lines[:3]:
                draw.text((text_x, curr_y), line, font=font_body, fill=(253, 252, 252))
                curr_y += 17

        return canvas

    # Pre-compute frame counts per scene and render with 6-frame (0.40s) cross-dissolve transitions.
    # Add trans_frames to scenes 1..N-1 to compensate for the cross-dissolve overlap so total emitted
    # frames equal sum(aligned_durations) * FPS with zero truncation!
    trans_frames = 6  # 0.40s smooth cross-dissolve between scenes at 15fps
    scene_frame_counts = [
        max(FPS * 2, int(round(d * FPS)) + (trans_frames if i > 0 else 0))
        for i, d in enumerate(aligned_durations)
    ]
    g_frame = 0

    n_scenes = len(scenes_meta)
    for s_idx, sm in enumerate(scenes_meta):
        sm['highres_art'] = prepare_highres_art_source(
            sm['src_path'], sm['is_title'], sm.get('raw_cell'), sm.get('sub_idx', 0)
        )

    for s_idx in range(n_scenes):
        sm = scenes_meta[s_idx]
        n_f = scene_frame_counts[s_idx]
        start_f = 0 if s_idx == 0 else trans_frames
        end_f = n_f if s_idx == n_scenes - 1 else (n_f - trans_frames)

        # Main body of scene s_idx
        for f_local in range(start_f, end_f):
            frame_img = render_single_scene_frame(sm, s_idx, f_local, n_f, g_frame)
            ffmpeg_stdin.write(frame_img.tobytes())
            g_frame += 1

        # Cross-dissolve transition from scene s_idx -> scene s_idx + 1
        if s_idx < n_scenes - 1:
            next_sm = scenes_meta[s_idx + 1]
            next_nf = scene_frame_counts[s_idx + 1]
            for tf in range(trans_frames):
                alpha = (tf + 1) / float(trans_frames + 1)
                f_a = render_single_scene_frame(sm, s_idx, end_f + tf, n_f, g_frame)
                f_b = render_single_scene_frame(next_sm, s_idx + 1, tf, next_nf, g_frame)
                blended = Image.blend(f_a, f_b, alpha)
                ffmpeg_stdin.write(blended.tobytes())
                g_frame += 1

        # Free highres_art of finished scene to keep memory low
        sm['highres_art'] = None


def extract_existing_remastered_audio(existing_mp4: Path, ep_dir: Path, fallback_durations: list[float]) -> tuple[Path, list[float], np.ndarray] | None:
    """
    If `existing_mp4` already exists and has the remastered soft female voiceover + calm BGM
    audio stream, extracts the lossless AAC audio track (.m4a), computes the per-frame voice
    envelope at FPS, and scales scene durations proportionally to match the exact audio duration.
    """
    if not existing_mp4.is_file() or existing_mp4.stat().st_size < 100_000:
        return None
    try:
        out_m4a = ep_dir / 'remastered_audio.m4a'
        out_wav = ep_dir / 'remastered_probe.wav'
        subprocess.run(
            [FFMPEG_BIN, '-y', '-i', str(existing_mp4), '-vn', '-c:a', 'copy', str(out_m4a)],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        subprocess.run(
            [FFMPEG_BIN, '-y', '-i', str(out_m4a), '-ac', '1', '-ar', '22050', str(out_wav)],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        with wave.open(str(out_wav), 'rb') as wf:
            sr = wf.getframerate()
            n_frames = wf.getnframes()
            raw_bytes = wf.readframes(n_frames)
        out_wav.unlink(missing_ok=True)

        audio_dur = n_frames / float(max(1, sr))
        if audio_dur < 30.0:
            return None

        pcm = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        samples_per_vframe = max(1, int(sr / FPS))
        n_vframes = max(1, len(pcm) // samples_per_vframe)
        v_env = np.abs(pcm[:n_vframes * samples_per_vframe]).reshape(n_vframes, samples_per_vframe).mean(axis=1)
        v_env = np.clip(v_env * 6.0, 0.0, 1.0)

        base_sum = sum(fallback_durations)
        scale = audio_dur / max(1.0, base_sum)
        aligned_durations = [max(1.8, d * scale) for d in fallback_durations]
        # Adjust last scene so total duration matches audio_dur
        diff = audio_dur - sum(aligned_durations)
        aligned_durations[-1] = max(2.0, aligned_durations[-1] + diff)

        return out_m4a, aligned_durations, v_env
    except Exception:
        return None


def generate_single_episode(ep_num: int, ep_data: dict, theme: str, card_map: dict,
                            out_mp4_path: str, temp_base_dir: str) -> dict:
    """Generate standalone 15fps continuous-motion MP4 video for one episode using today's storybook sheets."""
    ep_dir = Path(temp_base_dir) / f'ep_{ep_num:02d}'
    ep_dir.mkdir(parents=True, exist_ok=True)

    images = ep_data.get('images', [])
    if not images:
        return {'ep_num': ep_num, 'status': 'FAIL', 'error': 'No images in manifest'}

    raw_cells = extract_raw_storybook_cells(ep_num)
    total_scenes = len(images)
    n_narrative = max(1, total_scenes - 1)
    panel_buckets: dict[int, list[int]] = {p: [] for p in range(9)}
    for idx in range(1, total_scenes):
        p = min(8, int((idx - 1) * 9 / n_narrative))
        panel_buckets[p].append(idx)
    scene_to_p_sub: dict[int, tuple[int, int]] = {}
    for p, idx_list in panel_buckets.items():
        for sub_idx, idx in enumerate(idx_list):
            scene_to_p_sub[idx] = (p, sub_idx)

    title_en = ep_data.get('episodeTitle') or ep_data.get('titleEn') or f'Episode {ep_num}'
    scenes_meta = []
    fallback_durations = []
    scene_scripts = []

    combat_re = re.compile(r'\b(slash|strike|shatter|roar|clash|fire|blast|explod|pierc|blade|spear|sword|ambush)\b', re.I)

    for idx, img_entry in enumerate(images):
        rel_img = img_entry.get('imageUrl', '').lstrip('/')
        src_path = PROJECT_ROOT / 'public' / rel_img.replace('public/', '')
        if not src_path.is_file():
            continue

        is_title = (idx == 0 or img_entry.get('type') == 'title_card')
        speaker_en = ''
        narration_en = (img_entry.get('narrationEn') or '').strip()
        text_en = narration_en

        dialogues = img_entry.get('dialogues', [])
        if dialogues:
            speaker_en = dialogues[0].get('speakerEn', '')
            text_en = (dialogues[0].get('textEn') or narration_en).strip()

        portrait_file = resolve_portrait_file(img_entry, card_map)
        sfx_list = img_entry.get('sfxCues', [])

        if is_title:
            spoken_en = f"Episode {ep_num}. {title_en}."
        elif speaker_en and speaker_en not in ('Narration', '내레이션'):
            if narration_en and narration_en != text_en:
                spoken_en = f"{speaker_en} says: {text_en}. {narration_en}"
            else:
                spoken_en = f"{speaker_en} says: {text_en}"
        else:
            spoken_en = text_en or narration_en or f"Episode {ep_num}, scene {idx + 1}."

        if is_title:
            duration = 3.5
        elif idx == len(images) - 1:
            duration = 4.0
        else:
            word_count = len(spoken_en.split())
            duration = 2.4 + min(word_count * 0.04, 1.2)

        raw_cell = None
        sub_idx = 0
        if not is_title and len(raw_cells) == 9 and idx in scene_to_p_sub:
            p, sub_idx = scene_to_p_sub[idx]
            raw_cell = raw_cells[p]

        scenes_meta.append({
            'src_path': src_path,
            'is_title': is_title,
            'title_en': title_en,
            'speaker_en': speaker_en,
            'text_en': text_en,
            'portrait_file': portrait_file,
            'sfx_list': sfx_list,
            'has_combat_kw': bool(combat_re.search(spoken_en)),
            'raw_cell': raw_cell,
            'sub_idx': sub_idx,
            'highres_art': None,
        })
        fallback_durations.append(duration)
        scene_scripts.append(spoken_en)

    if not scenes_meta:
        shutil.rmtree(ep_dir, ignore_errors=True)
        return {'ep_num': ep_num, 'status': 'FAIL', 'error': 'Zero valid scenes'}

    existing_mp4 = Path(out_mp4_path)
    remastered = extract_existing_remastered_audio(existing_mp4, ep_dir, fallback_durations)
    if remastered is not None:
        audio_input_path, aligned_durations, voice_env = remastered
        audio_codec_args = ['-c:a', 'copy']
    else:
        bgm_wav_path = ep_dir / 'bgm.wav'
        aligned_durations, voice_env = synthesize_tts_and_bgm_wav(
            ep_num, scene_scripts, theme, fallback_durations, str(bgm_wav_path)
        )
        audio_input_path = bgm_wav_path
        audio_codec_args = ['-c:a', 'aac', '-b:a', '128k', '-ar', '44100']

    total_duration = sum(aligned_durations)
    tmp_out_mp4 = ep_dir / f'new_ep_{ep_num:02d}.mp4'

    # Stream raw RGB24 video frames directly into FFmpeg alongside the audio track
    cmd = [
        FFMPEG_BIN, '-y',
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-s', f'{WIDTH}x{HEIGHT}',
        '-pix_fmt', 'rgb24',
        '-r', str(FPS),
        '-i', '-',
        '-i', str(audio_input_path),
        '-c:v', 'libx264', '-preset', 'veryfast',
        '-crf', '26', '-maxrate', '420k', '-bufsize', '840k',
        '-pix_fmt', 'yuv420p',
        *audio_codec_args,
        '-shortest',
        '-movflags', '+faststart',
        str(tmp_out_mp4)
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        render_animated_episode_frames(ep_num, scenes_meta, aligned_durations, voice_env, theme, proc.stdin)
        proc.stdin.close()
    except Exception as e:
        proc.kill()
        shutil.rmtree(ep_dir, ignore_errors=True)
        return {'ep_num': ep_num, 'status': 'FAIL', 'error': f"Frame pipe error: {e}"}

    stderr_bytes = proc.stderr.read()
    ret = proc.wait()

    if ret != 0 or not tmp_out_mp4.is_file():
        shutil.rmtree(ep_dir, ignore_errors=True)
        return {'ep_num': ep_num, 'status': 'FAIL', 'error': f"FFmpeg failed: {stderr_bytes.decode('utf-8', 'ignore')[:200]}"}

    shutil.move(str(tmp_out_mp4), str(out_mp4_path))
    shutil.rmtree(ep_dir, ignore_errors=True)

    probe_cmd = [
        FFPROBE_BIN, '-v', 'error',
        '-show_entries', 'format=duration,size:stream=codec_name,width,height,sample_rate',
        '-of', 'json', str(out_mp4_path)
    ]
    probe_res = subprocess.run(probe_cmd, capture_output=True, text=True)
    if probe_res.returncode == 0:
        pdata = json.loads(probe_res.stdout)
        dur = float(pdata.get('format', {}).get('duration', 0))
        size = int(pdata.get('format', {}).get('size', 0))
        streams = pdata.get('streams', [])
        v_stream = next((s for s in streams if s.get('codec_name') == 'h264'), None)
        a_stream = next((s for s in streams if s.get('codec_name') == 'aac'), None)
        return {
            'ep_num': ep_num,
            'status': 'PASS',
            'duration': dur,
            'size': size,
            'v_codec': v_stream.get('codec_name') if v_stream else None,
            'a_codec': a_stream.get('codec_name') if a_stream else None,
            'sample_rate': a_stream.get('sample_rate') if a_stream else None,
        }
    return {'ep_num': ep_num, 'status': 'PASS', 'duration': total_duration, 'size': os.path.getsize(out_mp4_path)}


def main():
    parser = argparse.ArgumentParser(description="SNSHero 40-Episode 20fps Animated Motion MP4 Generator")
    parser.add_argument('--episodes', type=str, default='all',
                        help="Comma-separated episode numbers (e.g. 1,2,3) or 'all' (default: all)")
    parser.add_argument('--workers', type=int, default=4,
                        help="Number of concurrent worker processes (default: 4)")
    args = parser.parse_args()

    if not MANIFEST_PATH.is_file():
        print(f"[FATAL] Manifest not found: {MANIFEST_PATH}")
        sys.exit(1)

    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    card_map = load_card_portrait_map()
    themes = load_episode_themes()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.episodes == 'all':
        targets = list(range(1, 41))
    else:
        targets = [int(x.strip()) for x in args.episodes.split(',') if x.strip()]

    print(f"======================================================================")
    print(f"  SNSHero 40-Episode 20fps Continuous Motion Movie Generator")
    print(f"======================================================================")
    print(f"Targets        : {len(targets)} episodes ({targets[0]}..{targets[-1]})")
    print(f"Concurrency    : {args.workers} workers | Frame Rate: {FPS} fps continuous motion")
    print(f"Output Dir     : {OUTPUT_DIR}")
    print(f"======================================================================\n")

    temp_base = tempfile.mkdtemp(prefix='snshero_motion_mp4_')
    results = []

    try:
        with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as executor:
            future_to_ep = {}
            for ep_num in targets:
                ep_data = manifest.get(str(ep_num))
                if not ep_data:
                    continue
                theme = themes.get(ep_num, 'arctic-blizzard')
                existing_matches = sorted(OUTPUT_DIR.glob(f'SNSHero.com_E{ep_num}_*.mp4'))
                if existing_matches:
                    out_path = existing_matches[0]
                else:
                    title_en = (ep_data.get('episodeTitle') or ep_data.get('titleEn') or f'Episode {ep_num}').strip()
                    out_path = OUTPUT_DIR / f'SNSHero.com_E{ep_num}_{title_en}.mp4'
                future = executor.submit(
                    generate_single_episode,
                    ep_num, ep_data, theme, card_map, str(out_path), temp_base
                )
                future_to_ep[future] = ep_num

            for future in concurrent.futures.as_completed(future_to_ep):
                ep_num = future_to_ep[future]
                try:
                    res = future.result()
                    results.append(res)
                    if res.get('status') == 'PASS':
                        dur = res.get('duration', 0)
                        size_mb = res.get('size', 0) / (1024 * 1024)
                        vc = res.get('v_codec', 'h264')
                        ac = res.get('a_codec', 'aac')
                        sr = res.get('sample_rate', '44100')
                        print(f"  ✓ [DONE] Episode {ep_num:02d}.mp4: {dur:.1f}s | {size_mb:.2f} MB | {vc}/{ac}@{sr}Hz", flush=True)
                    else:
                        print(f"  ✗ [FAIL] Episode {ep_num:02d}.mp4: {res.get('error')}", flush=True)
                except Exception as ex:
                    print(f"  ✗ [EXCEPTION] Episode {ep_num:02d}: {ex}", flush=True)
                    results.append({'ep_num': ep_num, 'status': 'FAIL', 'error': str(ex)})
    finally:
        shutil.rmtree(temp_base, ignore_errors=True)

    passed = [r for r in results if r.get('status') == 'PASS']
    failed = [r for r in results if r.get('status') != 'PASS']
    print(f"\n----------------------------------------------------------------------")
    print(f"  Generation Complete: {len(passed)} / {len(targets)} Succeeded ({len(failed)} Failed)")
    print(f"----------------------------------------------------------------------")

    if failed:
        sys.exit(1)
    sys.exit(0)


if __name__ == '__main__':
    main()
