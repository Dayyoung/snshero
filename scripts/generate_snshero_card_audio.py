#!/usr/bin/env python3
"""
scripts/generate_snshero_card_audio.py

Benchmarks Hearthstone's iconic audio architecture (BGM / Korean VO / Tactile SFX)
and generates 100% original, studio-mastered SNSHero audio assets into:
  - public/hs-assets/snshero-audio/bgm/{tavern_hub,collection,mulligan,duel_1,duel_2}.mp3
  - public/hs-assets/snshero-audio/sfx/<30 tactile foley + orchestral sfx>.mp3
  - public/hs-assets/snshero-audio/vo/<135 Korean neural character voiceovers>.mp3
"""

import asyncio
import math
import os
import subprocess
import tempfile
import wave
from pathlib import Path

import edge_tts
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT_BASE = ROOT / "public" / "hs-assets" / "snshero-audio"
BGM_DIR = OUT_BASE / "bgm"
SFX_DIR = OUT_BASE / "sfx"
VO_DIR = OUT_BASE / "vo"

SR = 44100


def ensure_dirs() -> None:
    for d in (BGM_DIR, SFX_DIR, VO_DIR):
        d.mkdir(parents=True, exist_ok=True)


# ============================================================================
# DSP & PHYSICAL MODELING SYNTHESIS ENGINE (44.1 kHz Stereo)
# ============================================================================

def midi_to_hz(midi_note: float) -> float:
    return 440.0 * (2.0 ** ((midi_note - 69.0) / 12.0))


def one_pole_lp(x: np.ndarray, cutoff_hz: float) -> np.ndarray:
    rc = 1.0 / (2.0 * math.pi * max(20.0, cutoff_hz))
    dt = 1.0 / SR
    alpha = dt / (rc + dt)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += alpha * (float(x[i]) - acc)
        y[i] = acc
    return y


def fast_lp(x: np.ndarray, cutoff_hz: float) -> np.ndarray:
    """Fast FFT brickwall-softened lowpass filter for long buffers."""
    n = len(x)
    if n == 0:
        return x
    freqs = np.fft.rfftfreq(n, d=1.0 / SR)
    spec = np.fft.rfft(x)
    mask = 1.0 / (1.0 + (freqs / max(30.0, cutoff_hz)) ** 4)
    return np.fft.irfft(spec * mask, n=n).astype(np.float32)


def fast_bp(x: np.ndarray, low_hz: float, high_hz: float) -> np.ndarray:
    n = len(x)
    if n == 0:
        return x
    freqs = np.fft.rfftfreq(n, d=1.0 / SR)
    spec = np.fft.rfft(x)
    hp = 1.0 - 1.0 / (1.0 + (freqs / max(20.0, low_hz)) ** 4)
    lp = 1.0 / (1.0 + (freqs / max(40.0, high_hz)) ** 4)
    return np.fft.irfft(spec * hp * lp, n=n).astype(np.float32)


def karplus_strong(freq: float, dur: float, brightness: float = 0.994, pick_pos: float = 0.23, rng: np.random.Generator | None = None) -> np.ndarray:
    """Physical plucked acoustic lute / harp / tavern guitar string."""
    if rng is None:
        rng = np.random.default_rng(int(freq * 100))
    n_samples = max(64, int(dur * SR))
    delay = max(8, int(round(SR / max(35.0, freq))))
    burst = rng.uniform(-1.0, 1.0, delay).astype(np.float32)
    # Comb-filter pick position for warm wooden body tone
    comb_shift = max(1, int(delay * pick_pos))
    burst = burst - 0.65 * np.roll(burst, comb_shift)
    burst -= np.mean(burst)

    out = np.zeros(n_samples, dtype=np.float32)
    buf = burst.copy()
    idx = 0
    prev = 0.0
    damp = min(0.9992, max(0.96, brightness))
    for i in range(n_samples):
        cur = float(buf[idx])
        out[i] = cur
        nxt = damp * (0.54 * cur + 0.46 * prev)
        prev = cur
        buf[idx] = nxt
        idx = (idx + 1) % delay

    # Subtle body resonance boost around 180Hz-380Hz
    env = np.exp(-np.linspace(0, 2.2, n_samples)).astype(np.float32)
    return out * (0.75 + 0.25 * env)


def flute_note(freq: float, dur: float, vibrato: float = 0.009) -> np.ndarray:
    """Warm Celtic wooden flute / tin whistle lead."""
    n = max(32, int(dur * SR))
    t = np.arange(n, dtype=np.float32) / SR
    vib = 1.0 + vibrato * np.sin(2.0 * math.pi * 5.6 * t) * np.clip(t / 0.12, 0.0, 1.0)
    phase = 2.0 * math.pi * np.cumsum(freq * vib) / SR
    tone = (
        0.68 * np.sin(phase)
        + 0.22 * np.sin(2.0 * phase + 0.3)
        + 0.08 * np.sin(3.0 * phase + 0.7)
        + 0.03 * np.sin(4.0 * phase)
    ).astype(np.float32)
    # Chiff breath transient at attack
    rng = np.random.default_rng(int(freq * 17) + n)
    breath = fast_bp(rng.normal(0, 1, n).astype(np.float32), freq * 1.4, freq * 3.2)
    chiff_env = np.exp(-t * 28.0).astype(np.float32) * 0.16 + 0.025
    atk = np.clip(t / min(0.035, dur * 0.25), 0.0, 1.0)
    rel = np.clip((dur - t) / min(0.055, dur * 0.3), 0.0, 1.0)
    env = (atk * rel).astype(np.float32)
    return (tone + breath * chiff_env) * env


def fiddle_or_strings_note(freq: float, dur: float, richness: float = 1.0) -> np.ndarray:
    """Bowed tavern fiddle / orchestral ensemble strings."""
    n = max(32, int(dur * SR))
    t = np.arange(n, dtype=np.float32) / SR
    sig = np.zeros(n, dtype=np.float32)
    for detune, gain in [(-0.0045, 0.34), (0.0, 0.45), (0.0048, 0.34)]:
        vib = 1.0 + 0.0055 * np.sin(2.0 * math.pi * (5.2 + detune * 90) * t)
        ph = 2.0 * math.pi * np.cumsum(freq * (1.0 + detune) * vib) / SR
        # Band-limited sawtooth (10 harmonics)
        voice = np.zeros(n, dtype=np.float32)
        for k in range(1, 11):
            if freq * k < SR * 0.42:
                voice += ((-1) ** (k + 1)) * (1.0 / (k ** 1.15)) * np.sin(k * ph)
        sig += gain * voice
    sig = fast_lp(sig, min(4800.0, freq * (5.5 * richness)))
    atk = np.clip(t / min(0.065, dur * 0.3), 0.0, 1.0)
    rel = np.clip((dur - t) / min(0.08, dur * 0.35), 0.0, 1.0)
    return sig * atk * rel * 0.55


def brass_horn_note(freq: float, dur: float) -> np.ndarray:
    """Heroic French horn / orchestral brass fanfare note."""
    n = max(32, int(dur * SR))
    t = np.arange(n, dtype=np.float32) / SR
    ph = 2.0 * math.pi * freq * t
    # Brass brightness opens up on attack
    swell = 0.55 + 0.45 * np.exp(-((t - min(0.09, dur * 0.25)) ** 2) / 0.04)
    sig = np.zeros(n, dtype=np.float32)
    weights = [1.0, 0.88, 0.72, 0.54, 0.38, 0.25, 0.16, 0.09]
    for k, w in enumerate(weights, start=1):
        if freq * k < SR * 0.42:
            sig += w * (swell ** (k * 0.35)) * np.sin(k * ph)
    atk = np.clip(t / min(0.032, dur * 0.22), 0.0, 1.0)
    rel = np.clip((dur - t) / min(0.075, dur * 0.32), 0.0, 1.0)
    return (sig * atk * rel * 0.32).astype(np.float32)


def celesta_bell(freq: float, dur: float) -> np.ndarray:
    """Sparkling celesta / arcane crystal bell."""
    n = max(32, int(dur * SR))
    t = np.arange(n, dtype=np.float32) / SR
    sig = (
        0.70 * np.sin(2 * math.pi * freq * t) * np.exp(-t * 3.2)
        + 0.24 * np.sin(2 * math.pi * freq * 2.0 * t) * np.exp(-t * 5.5)
        + 0.12 * np.sin(2 * math.pi * freq * 3.004 * t) * np.exp(-t * 8.5)
        + 0.07 * np.sin(2 * math.pi * freq * 5.02 * t) * np.exp(-t * 14.0)
    ).astype(np.float32)
    atk = np.clip(t / 0.005, 0.0, 1.0)
    rel = np.clip((dur - t) / 0.04, 0.0, 1.0)
    return sig * atk * rel


def drum_hit(kind: str, rng: np.random.Generator) -> np.ndarray:
    """Bodhran / war-timpani / snare / shaker / cymbal hits."""
    if kind == "bodhran_low" or kind == "war_tom":
        dur = 0.34 if kind == "bodhran_low" else 0.48
        n = int(dur * SR)
        t = np.arange(n, dtype=np.float32) / SR
        f0 = 108.0 if kind == "bodhran_low" else 82.0
        f1 = 58.0 if kind == "bodhran_low" else 44.0
        freq = f1 + (f0 - f1) * np.exp(-t * 24.0)
        ph = 2 * math.pi * np.cumsum(freq) / SR
        body = np.sin(ph) * np.exp(-t * (10.5 if kind == "bodhran_low" else 7.2))
        skin = fast_bp(rng.normal(0, 1, n).astype(np.float32), 140, 950) * np.exp(-t * 34.0) * 0.38
        return (body * 0.85 + skin).astype(np.float32)
    if kind == "bodhran_rim":
        n = int(0.16 * SR)
        t = np.arange(n, dtype=np.float32) / SR
        tone = np.sin(2 * math.pi * 235.0 * t) * np.exp(-t * 26.0) * 0.55
        snap = fast_bp(rng.normal(0, 1, n).astype(np.float32), 600, 3600) * np.exp(-t * 48.0) * 0.55
        return (tone + snap).astype(np.float32)
    if kind == "shaker":
        n = int(0.09 * SR)
        t = np.arange(n, dtype=np.float32) / SR
        sh = fast_bp(rng.normal(0, 1, n).astype(np.float32), 4200, 12000)
        env = np.sin(math.pi * np.clip(t / 0.09, 0, 1)) ** 1.6
        return (sh * env * 0.22).astype(np.float32)
    if kind == "cymbal":
        n = int(1.6 * SR)
        t = np.arange(n, dtype=np.float32) / SR
        cym = fast_bp(rng.normal(0, 1, n).astype(np.float32), 2800, 14500) * np.exp(-t * 2.6)
        shimmer = np.sin(2 * math.pi * 3420 * t) * np.exp(-t * 6.0) * 0.08
        return ((cym * 0.42 + shimmer) * np.clip(t / 0.008, 0, 1)).astype(np.float32)
    return np.zeros(128, dtype=np.float32)


def mix_at(stereo: np.ndarray, mono: np.ndarray, start_sec: float, gain: float = 1.0, pan: float = 0.0) -> None:
    idx = max(0, int(round(start_sec * SR)))
    if idx >= stereo.shape[0]:
        return
    end = min(stereo.shape[0], idx + len(mono))
    seg = mono[: end - idx]
    angle = (np.clip(pan, -1.0, 1.0) + 1.0) * (math.pi / 4.0)
    gl = math.cos(angle) * gain
    gr = math.sin(angle) * gain
    stereo[idx:end, 0] += seg * gl
    stereo[idx:end, 1] += seg * gr


def apply_hall_reverb(stereo: np.ndarray, wet: float = 0.24, decay: float = 0.42) -> np.ndarray:
    """Warm stereo tavern/hall multi-tap feedback reverb."""
    out = stereo.copy()
    taps_ms = [
        (23.7, 0.34, 0),
        (37.3, 0.29, 1),
        (53.1, 0.24, 0),
        (79.4, 0.19, 1),
        (113.8, 0.15, 0),
        (161.2, 0.11, 1),
        (229.0, 0.08 * decay * 2.0, 0),
    ]
    rev_l = np.zeros(stereo.shape[0], dtype=np.float32)
    rev_r = np.zeros(stereo.shape[0], dtype=np.float32)
    mono_sum = 0.5 * (stereo[:, 0] + stereo[:, 1])
    lp_sum = fast_lp(mono_sum, 4600.0)
    for ms, g, ch in taps_ms:
        d = int(ms * 0.001 * SR)
        if d < len(lp_sum):
            if ch == 0:
                rev_l[d:] += lp_sum[:-d] * g
                rev_r[d:] += lp_sum[:-d] * (g * 0.72)
            else:
                rev_r[d:] += lp_sum[:-d] * g
                rev_l[d:] += lp_sum[:-d] * (g * 0.72)
    out[:, 0] = (1.0 - wet) * out[:, 0] + wet * rev_l
    out[:, 1] = (1.0 - wet) * out[:, 1] + wet * rev_r
    return out


def save_stereo_mp3(stereo: np.ndarray, out_path: Path, peak_db: float = -1.5, bitrate: str = "160k", seamless_fade: bool = False) -> None:
    peak = float(np.max(np.abs(stereo)))
    target = 10.0 ** (peak_db / 20.0)
    if peak > 1e-6:
        stereo = stereo * (target / peak)
    if seamless_fade and stereo.shape[0] > int(0.08 * SR):
        fade_n = int(0.03 * SR)
        ramp = np.linspace(0.0, 1.0, fade_n, dtype=np.float32)[:, None]
        stereo[:fade_n] *= ramp
        stereo[-fade_n:] *= ramp[::-1]
    pcm = np.clip(stereo * 32767.0, -32768, 32767).astype(np.int16)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        wav_path = tmp.name
    try:
        with wave.open(wav_path, "wb") as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(SR)
            wf.writeframes(pcm.tobytes())
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", wav_path,
                "-codec:a", "libmp3lame", "-b:a", bitrate,
                str(out_path),
            ],
            check=True,
        )
    finally:
        if os.path.exists(wav_path):
            os.remove(wav_path)


# ============================================================================
# 1. GENERATE 30 BENCHMARKED HEARTHSTONE-GRADE TACTILE FOLEY & ARCANE SFX
# ============================================================================

def build_all_sfx() -> None:
    rng = np.random.default_rng(20261111)

    def make_buf(sec: float) -> np.ndarray:
        return np.zeros((int(sec * SR), 2), dtype=np.float32)

    def wood_knock(f_base: float, dur: float = 0.14) -> np.ndarray:
        n = int(dur * SR)
        t = np.arange(n, dtype=np.float32) / SR
        modes = (
            0.75 * np.sin(2 * math.pi * f_base * t) * np.exp(-t * 36.0)
            + 0.42 * np.sin(2 * math.pi * (f_base * 1.58) * t) * np.exp(-t * 52.0)
            + 0.22 * np.sin(2 * math.pi * (f_base * 2.41) * t) * np.exp(-t * 78.0)
        )
        click = fast_bp(rng.normal(0, 1, n).astype(np.float32), 500, 3800) * np.exp(-t * 110.0) * 0.45
        return (modes + click).astype(np.float32)

    def brass_click(f_base: float = 1320.0, dur: float = 0.12) -> np.ndarray:
        n = int(dur * SR)
        t = np.arange(n, dtype=np.float32) / SR
        ping = (
            0.65 * np.sin(2 * math.pi * f_base * t) * np.exp(-t * 38.0)
            + 0.35 * np.sin(2 * math.pi * (f_base * 2.37) * t) * np.exp(-t * 55.0)
        )
        snap = fast_bp(rng.normal(0, 1, n).astype(np.float32), 1800, 7500) * np.exp(-t * 130.0) * 0.35
        return (ping + snap).astype(np.float32)

    def swoosh(dur: float, f_lo: float = 350.0, f_hi: float = 2800.0) -> np.ndarray:
        n = int(dur * SR)
        t = np.arange(n, dtype=np.float32) / SR
        noise = fast_bp(rng.normal(0, 1, n).astype(np.float32), f_lo, f_hi)
        env = np.sin(math.pi * np.clip(t / dur, 0, 1)) ** 1.8
        return (noise * env * 0.65).astype(np.float32)

    # 1. Hover micro-foley (box_hover, ui_hover, card_hover, menu_select)
    for name, f0 in [("box_hover", 420.0), ("ui_hover", 520.0), ("card_hover", 680.0), ("menu_select", 780.0)]:
        b = make_buf(0.09)
        mix_at(b, wood_knock(f0, 0.08), 0.0, 0.55)
        mix_at(b, swoosh(0.07, 900, 4800), 0.0, 0.35)
        save_stereo_mp3(b, SFX_DIR / f"{name}.mp3", peak_db=-5.0)

    # 2. Brass & Wood Button Presses (box_press, ui_click, open_menu, menu_press)
    for name, f_w, f_b, dur in [
        ("box_press", 210.0, 1180.0, 0.45),
        ("ui_click", 290.0, 1480.0, 0.32),
        ("open_menu", 250.0, 980.0, 0.28),
        ("menu_press", 195.0, 1260.0, 0.55),
    ]:
        b = make_buf(dur)
        mix_at(b, wood_knock(f_w, 0.16), 0.0, 0.85, -0.1)
        mix_at(b, brass_click(f_b, 0.18), 0.008, 0.70, 0.12)
        mix_at(b, celesta_bell(f_b * 0.5, dur * 0.8), 0.015, 0.25)
        save_stereo_mp3(apply_hall_reverb(b, 0.20), SFX_DIR / f"{name}.mp3", peak_db=-2.5)

    # 3. Hinged Box & Turntable Mechanics (box_open, box_close, box_disk_flip, box_tray_in, box_tray_out)
    b = make_buf(1.05)
    mix_at(b, drum_hit("bodhran_low", rng), 0.0, 0.75)
    mix_at(b, swoosh(0.65, 220, 2200), 0.05, 0.65, -0.2)
    for i, m in enumerate([62, 66, 69, 74]):
        mix_at(b, celesta_bell(midi_to_hz(m), 0.65), 0.08 + i * 0.09, 0.42, -0.3 + i * 0.2)
    save_stereo_mp3(apply_hall_reverb(b, 0.32), SFX_DIR / "box_open.mp3", peak_db=-2.0)

    b = make_buf(0.85)
    mix_at(b, swoosh(0.32, 300, 1800), 0.0, 0.55)
    mix_at(b, wood_knock(145.0, 0.24), 0.16, 0.95)
    mix_at(b, brass_click(760.0, 0.22), 0.18, 0.60)
    save_stereo_mp3(apply_hall_reverb(b, 0.22), SFX_DIR / "box_close.mp3", peak_db=-2.5)

    b = make_buf(0.95)
    mix_at(b, wood_knock(190.0, 0.18), 0.0, 0.80)
    mix_at(b, swoosh(0.48, 280, 2600), 0.03, 0.75, 0.25)
    mix_at(b, wood_knock(240.0, 0.20), 0.34, 0.85, -0.15)
    mix_at(b, celesta_bell(midi_to_hz(69), 0.50), 0.35, 0.35)
    save_stereo_mp3(apply_hall_reverb(b, 0.26), SFX_DIR / "box_disk_flip.mp3", peak_db=-2.0)

    for name, notes in [("box_tray_in", [57, 64, 69]), ("box_tray_out", [69, 64, 57])]:
        b = make_buf(0.75)
        mix_at(b, swoosh(0.42, 260, 1900), 0.0, 0.6)
        mix_at(b, wood_knock(175.0, 0.18), 0.22, 0.75)
        for i, m in enumerate(notes):
            mix_at(b, karplus_strong(midi_to_hz(m), 0.45, 0.992, rng=rng), i * 0.07, 0.35)
        save_stereo_mp3(apply_hall_reverb(b, 0.22), SFX_DIR / f"{name}.mp3", peak_db=-3.0)

    # 4. Card Handling & Board Placement (card_flip, card_place, whoosh, cm_select_hero, cm_remove_card)
    b = make_buf(0.40)
    mix_at(b, swoosh(0.22, 700, 5600), 0.0, 0.85, -0.15)
    mix_at(b, wood_knock(490.0, 0.10), 0.07, 0.55, 0.15)
    mix_at(b, celesta_bell(midi_to_hz(76), 0.28), 0.06, 0.28)
    save_stereo_mp3(apply_hall_reverb(b, 0.18), SFX_DIR / "card_flip.mp3", peak_db=-2.5)

    b = make_buf(0.46)
    mix_at(b, swoosh(0.12, 500, 3400), 0.0, 0.55)
    mix_at(b, drum_hit("bodhran_low", rng), 0.06, 0.92)
    mix_at(b, wood_knock(215.0, 0.16), 0.065, 0.85)
    save_stereo_mp3(apply_hall_reverb(b, 0.22), SFX_DIR / "card_place.mp3", peak_db=-1.8)

    b = make_buf(0.75)
    mix_at(b, swoosh(0.62, 220, 3800), 0.0, 0.90, -0.3)
    mix_at(b, swoosh(0.48, 600, 5200), 0.12, 0.65, 0.35)
    save_stereo_mp3(apply_hall_reverb(b, 0.26), SFX_DIR / "whoosh.mp3", peak_db=-2.5)

    b = make_buf(1.25)
    mix_at(b, drum_hit("war_tom", rng), 0.0, 0.85)
    for i, m in enumerate([50, 57, 62, 66, 74]):
        mix_at(b, brass_horn_note(midi_to_hz(m), 0.85), i * 0.05, 0.45, -0.3 + i * 0.15)
        mix_at(b, celesta_bell(midi_to_hz(m + 12), 0.75), 0.06 + i * 0.06, 0.28)
    save_stereo_mp3(apply_hall_reverb(b, 0.34), SFX_DIR / "cm_select_hero.mp3", peak_db=-2.0)

    b = make_buf(0.55)
    mix_at(b, swoosh(0.28, 500, 3500), 0.0, 0.65)
    mix_at(b, wood_knock(310.0, 0.16), 0.12, 0.70)
    save_stereo_mp3(apply_hall_reverb(b, 0.18), SFX_DIR / "cm_remove_card.mp3", peak_db=-3.0)

    # 5. Combat Impacts (attack, big_attack, hero_power, end_turn, player_turn)
    b = make_buf(0.85)
    mix_at(b, swoosh(0.14, 400, 4200), 0.0, 0.75)
    mix_at(b, drum_hit("war_tom", rng), 0.08, 1.0)
    mix_at(b, wood_knock(165.0, 0.22), 0.085, 0.95)
    mix_at(b, brass_click(940.0, 0.20), 0.09, 0.65)
    save_stereo_mp3(apply_hall_reverb(b, 0.25), SFX_DIR / "attack.mp3", peak_db=-1.2)

    b = make_buf(1.65)
    mix_at(b, swoosh(0.18, 250, 3800), 0.0, 0.85)
    mix_at(b, drum_hit("war_tom", rng), 0.10, 1.25)
    mix_at(b, drum_hit("cymbal", rng), 0.11, 0.75)
    # Sub-bass shockwave boom
    t_sub = np.arange(int(0.85 * SR), dtype=np.float32) / SR
    sub = np.sin(2 * math.pi * np.cumsum(92.0 * np.exp(-t_sub * 3.5) + 34.0) / SR) * np.exp(-t_sub * 4.2)
    mix_at(b, sub.astype(np.float32), 0.10, 0.95)
    mix_at(b, brass_horn_note(midi_to_hz(38), 0.75), 0.11, 0.65)
    save_stereo_mp3(apply_hall_reverb(b, 0.34), SFX_DIR / "big_attack.mp3", peak_db=-0.9)

    b = make_buf(1.35)
    mix_at(b, swoosh(0.55, 350, 4800), 0.0, 0.65)
    for i, m in enumerate([62, 69, 74, 78, 81]):
        mix_at(b, celesta_bell(midi_to_hz(m), 0.85), i * 0.055, 0.45, -0.35 + i * 0.18)
    mix_at(b, fiddle_or_strings_note(midi_to_hz(62), 0.95), 0.05, 0.45)
    save_stereo_mp3(apply_hall_reverb(b, 0.38), SFX_DIR / "hero_power.mp3", peak_db=-2.0)

    b = make_buf(0.45)
    mix_at(b, wood_knock(230.0, 0.16), 0.0, 0.90)
    mix_at(b, brass_click(880.0, 0.25), 0.03, 0.75)
    save_stereo_mp3(apply_hall_reverb(b, 0.20), SFX_DIR / "end_turn.mp3", peak_db=-2.2)

    b = make_buf(2.10)
    mix_at(b, drum_hit("bodhran_low", rng), 0.0, 0.75)
    for i, (m, d) in enumerate([(62, 0.0), (69, 0.14), (74, 0.28), (78, 0.42)]):
        mix_at(b, brass_horn_note(midi_to_hz(m), 1.15 - d * 0.5), d, 0.52, -0.25 + i * 0.16)
        mix_at(b, celesta_bell(midi_to_hz(m + 12), 1.1), d + 0.02, 0.36)
    save_stereo_mp3(apply_hall_reverb(b, 0.38), SFX_DIR / "player_turn.mp3", peak_db=-1.8)

    # 6. Pack Opening, Rarity Fanfares, Purchase, Crowd & Victory!
    b = make_buf(0.80)
    for i, f_coin in enumerate([1760.0, 2217.0, 2637.0, 3136.0]):
        mix_at(b, brass_click(f_coin, 0.35), i * 0.055, 0.65, -0.2 + i * 0.14)
        mix_at(b, celesta_bell(f_coin * 0.5, 0.45), i * 0.055, 0.38)
    save_stereo_mp3(apply_hall_reverb(b, 0.28), SFX_DIR / "purchase.mp3", peak_db=-2.0)

    b = make_buf(2.35)
    # Arcane buildup + explosive seal burst + shimmering chord
    t_b = np.arange(int(0.48 * SR), dtype=np.float32) / SR
    riser = np.sin(2 * math.pi * np.cumsum(180 + 920 * (t_b / 0.48) ** 2) / SR) * (t_b / 0.48)
    mix_at(b, riser.astype(np.float32), 0.0, 0.55)
    mix_at(b, drum_hit("war_tom", rng), 0.46, 1.15)
    mix_at(b, drum_hit("cymbal", rng), 0.47, 0.70)
    for i, m in enumerate([62, 66, 69, 74, 78, 81, 86]):
        mix_at(b, celesta_bell(midi_to_hz(m), 1.5), 0.48 + i * 0.045, 0.44, -0.4 + i * 0.13)
        mix_at(b, karplus_strong(midi_to_hz(m), 1.4, 0.996, rng=rng), 0.49 + i * 0.045, 0.32)
    save_stereo_mp3(apply_hall_reverb(b, 0.40), SFX_DIR / "pack_open.mp3", peak_db=-1.4)

    # Rare (Sapphire Chime Chord)
    b = make_buf(1.10)
    for i, m in enumerate([69, 73, 76, 81]):
        mix_at(b, celesta_bell(midi_to_hz(m), 0.85), i * 0.06, 0.55, -0.25 + i * 0.16)
        mix_at(b, karplus_strong(midi_to_hz(m), 0.80, 0.995, rng=rng), i * 0.06, 0.35)
    save_stereo_mp3(apply_hall_reverb(b, 0.34), SFX_DIR / "pack_rare.mp3", peak_db=-2.0)

    # Epic (Amethyst Brass + Harp Surge)
    b = make_buf(1.55)
    mix_at(b, drum_hit("bodhran_low", rng), 0.0, 0.75)
    for i, m in enumerate([60, 64, 67, 72, 76, 79]):
        mix_at(b, brass_horn_note(midi_to_hz(m), 0.95), i * 0.065, 0.42, -0.3 + i * 0.12)
        mix_at(b, celesta_bell(midi_to_hz(m + 12), 1.0), i * 0.065, 0.42)
    save_stereo_mp3(apply_hall_reverb(b, 0.38), SFX_DIR / "pack_epic.mp3", peak_db=-1.6)

    # Legendary (Full Golden Dragon Fanfare + Crowd + Timpani!)
    b = make_buf(2.85)
    mix_at(b, drum_hit("war_tom", rng), 0.0, 1.1)
    mix_at(b, drum_hit("cymbal", rng), 0.02, 0.75)
    leg_fanfare = [(62, 0.0, 0.22), (69, 0.18, 0.22), (74, 0.36, 0.26), (78, 0.58, 1.65), (81, 0.62, 1.65), (86, 0.66, 1.75)]
    for m, st, du in leg_fanfare:
        mix_at(b, brass_horn_note(midi_to_hz(m), du), st, 0.62, -0.2)
        mix_at(b, brass_horn_note(midi_to_hz(m - 12), du), st, 0.45, 0.2)
        mix_at(b, celesta_bell(midi_to_hz(m + 12), du * 0.9), st + 0.02, 0.42)
    mix_at(b, drum_hit("war_tom", rng), 0.58, 1.0)
    save_stereo_mp3(apply_hall_reverb(b, 0.42), SFX_DIR / "pack_legendary.mp3", peak_db=-1.0)

    # Tavern Crowd Cheer & Applause (crowd.mp3)
    b = make_buf(3.20)
    n_c = b.shape[0]
    t_c = np.arange(n_c, dtype=np.float32) / SR
    env_c = np.clip(t_c / 0.35, 0, 1) * np.exp(-np.maximum(0, t_c - 0.8) * 0.95)
    roar_l = fast_bp(rng.normal(0, 1, n_c).astype(np.float32), 280, 2400) * env_c * 0.45
    roar_r = fast_bp(rng.normal(0, 1, n_c).astype(np.float32), 310, 2600) * env_c * 0.45
    b[:, 0] += roar_l
    b[:, 1] += roar_r
    for _ in range(58):
        st = float(rng.uniform(0.05, 2.5))
        clap_n = int(0.045 * SR)
        clap = fast_bp(rng.normal(0, 1, clap_n).astype(np.float32), 900, 4800) * np.exp(-np.linspace(0, 5, clap_n)).astype(np.float32)
        mix_at(b, clap, st, float(rng.uniform(0.18, 0.42)), float(rng.uniform(-0.7, 0.7)))
    for i, m in enumerate([62, 66, 69, 74]):
        mix_at(b, fiddle_or_strings_note(midi_to_hz(m), 1.8), 0.1 + i * 0.05, 0.22)
    save_stereo_mp3(apply_hall_reverb(b, 0.36), SFX_DIR / "crowd.mp3", peak_db=-2.2)

    # Grand Victory Fanfare (victory.mp3 — ~7.5s heroic orchestral celebration)
    b = make_buf(7.6)
    chords = [
        (0.0, 1.1, [50, 57, 62, 66, 74]),
        (1.1, 0.55, [48, 55, 60, 64, 72]),
        (1.65, 0.55, [43, 50, 59, 62, 71]),
        (2.2, 1.2, [45, 52, 57, 64, 73]),
        (3.4, 3.6, [50, 57, 62, 66, 74, 78, 86]),
    ]
    for st, du, notes in chords:
        mix_at(b, drum_hit("war_tom", rng), st, 0.95)
        if du >= 1.1:
            mix_at(b, drum_hit("cymbal", rng), st, 0.65)
        for j, m in enumerate(notes):
            pan = -0.45 + (j / max(1, len(notes) - 1)) * 0.9
            mix_at(b, brass_horn_note(midi_to_hz(m), du * 1.05), st, 0.48, pan)
            mix_at(b, fiddle_or_strings_note(midi_to_hz(m), du * 1.1), st, 0.36, -pan)
            if m >= 69:
                mix_at(b, celesta_bell(midi_to_hz(m + 12), du), st + 0.02, 0.26, pan)
    save_stereo_mp3(apply_hall_reverb(b, 0.42), SFX_DIR / "victory.mp3", peak_db=-1.2)


# ============================================================================
# 2. GENERATE 5 MULTI-INSTRUMENT CELTIC-TAVERN & FANTASY ORCHESTRAL BGM TRACKS
# ============================================================================

def build_all_bgm() -> None:
    rng = np.random.default_rng(7772026)

    # --- Track 1: tavern_hub.mp3 (Lively Celtic-Fantasy Tavern Jig — 32 bars, ~44s seamless loop) ---
    beat = 60.0 / 138.0  # dotted-quarter pulse feel
    step = beat / 2.0    # eighth-note grid
    total_steps = 192    # 32 bars of 6/8!
    dur = total_steps * step
    buf = np.zeros((int(dur * SR), 2), dtype=np.float32)

    # D Mixolydian progression (D - C - G - D | D - Bm - C - A)
    prog = [
        (50, [57, 62, 66]),  # D
        (48, [55, 60, 64]),  # C
        (43, [55, 59, 62]),  # G
        (50, [57, 62, 66]),  # D
        (50, [57, 62, 66]),  # D
        (47, [54, 59, 62]),  # Bm
        (48, [55, 60, 64]),  # C
        (45, [57, 61, 64]),  # A
    ] * 4

    # Catchy 6/8 Celtic Tin-Whistle / Wooden Flute Melody (in MIDI notes, 0 = rest)
    phrase_a = [
        74, 76, 78, 81, 78, 76,   72, 74, 76, 79, 76, 72,
        71, 74, 79, 83, 79, 74,   74, 0,  78, 74, 69, 74,
        74, 76, 78, 81, 83, 81,   78, 74, 71, 74, 78, 74,
        72, 76, 79, 76, 72, 74,   76, 0,  73, 76, 79, 81,
    ]
    phrase_b = [
        86, 83, 81, 78, 81, 78,   79, 76, 72, 76, 79, 81,
        83, 79, 74, 79, 83, 86,   81, 0,  78, 76, 74, 0,
        78, 81, 83, 86, 83, 81,   78, 74, 71, 74, 78, 81,
        79, 76, 72, 74, 76, 79,   76, 73, 69, 73, 76, 79,
    ]
    melody = phrase_a + phrase_b + phrase_a + phrase_b

    hit_low = drum_hit("bodhran_low", rng)
    hit_rim = drum_hit("bodhran_rim", rng)
    hit_shk = drum_hit("shaker", rng)

    for bar_idx, (bass_m, chord_ms) in enumerate(prog):
        b_t = bar_idx * 6 * step
        # Plucked warm bass on beats 1 and 4
        mix_at(buf, karplus_strong(midi_to_hz(bass_m - 12), step * 3.2, 0.996, rng=rng), b_t, 0.62, -0.05)
        mix_at(buf, karplus_strong(midi_to_hz(bass_m - 5), step * 2.8, 0.996, rng=rng), b_t + 3 * step, 0.52, 0.05)

        # Acoustic Tavern Lute / Guitar 6/8 arpeggio & strum
        arp_pattern = [0, 1, 2, 1, 2, 0]
        for s_in_bar, c_i in enumerate(arp_pattern):
            st = b_t + s_in_bar * step
            vel = 0.44 if s_in_bar in (0, 3) else 0.28
            mix_at(
                buf,
                karplus_strong(midi_to_hz(chord_ms[c_i]), step * 2.2, 0.994, rng=rng),
                st,
                vel,
                -0.32 if s_in_bar % 2 == 0 else 0.28,
            )
        # Warm fiddle double-stop pad in second half of song
        if bar_idx >= 8:
            mix_at(buf, fiddle_or_strings_note(midi_to_hz(chord_ms[0]), step * 5.8, 0.8), b_t, 0.16, 0.35)
            mix_at(buf, fiddle_or_strings_note(midi_to_hz(chord_ms[2]), step * 5.8, 0.8), b_t, 0.14, -0.35)

        # Bodhran & Tavern Percussion
        mix_at(buf, hit_low, b_t, 0.58)
        mix_at(buf, hit_shk, b_t + 2 * step, 0.45, 0.25)
        mix_at(buf, hit_rim, b_t + 3 * step, 0.52, -0.15)
        mix_at(buf, hit_shk, b_t + 5 * step, 0.40, 0.25)

    for i, m in enumerate(melody):
        if m <= 0:
            continue
        nxt_rest = i + 1 < len(melody) and melody[i + 1] == 0
        n_dur = step * (1.85 if nxt_rest else 0.96)
        st = i * step
        mix_at(buf, flute_note(midi_to_hz(m), n_dur), st, 0.42, -0.12)
        if i >= 48 and i % 3 == 0:
            mix_at(buf, fiddle_or_strings_note(midi_to_hz(m - 12), step * 2.6), st, 0.20, 0.28)

    save_stereo_mp3(apply_hall_reverb(buf, 0.28), BGM_DIR / "tavern_hub.mp3", peak_db=-3.0, seamless_fade=True)

    # --- Track 2: collection.mp3 (Enchanting Starlight Tome Waltz — 3/4 Harp + Celesta + Strings) ---
    beat_c = 60.0 / 104.0
    bars_c = 24
    dur_c = bars_c * 3 * beat_c
    buf_c = np.zeros((int(dur_c * SR), 2), dtype=np.float32)
    waltz_prog = [
        (57, [64, 69, 72, 76]),  # Am
        (53, [60, 65, 69, 72]),  # F
        (48, [60, 64, 67, 72]),  # C
        (55, [59, 62, 67, 71]),  # G
        (57, [64, 69, 72, 76]),  # Am
        (50, [62, 65, 69, 74]),  # Dm
        (52, [59, 64, 68, 71]),  # E
        (57, [64, 69, 72, 76]),  # Am
    ] * 3
    waltz_mel = [
        (0, 76, 2.0), (2, 79, 1.0), (3, 81, 2.0), (5, 76, 1.0),
        (6, 79, 2.0), (8, 76, 1.0), (9, 74, 2.5),
        (12, 76, 2.0), (14, 81, 1.0), (15, 86, 2.0), (17, 84, 1.0),
        (18, 83, 2.0), (20, 79, 1.0), (21, 81, 2.8),
    ]
    for b_i, (bm, ch) in enumerate(waltz_prog):
        bt = b_i * 3 * beat_c
        mix_at(buf_c, karplus_strong(midi_to_hz(bm - 12), beat_c * 2.8, 0.996, rng=rng), bt, 0.48)
        for sub in range(6):
            m_arp = ch[sub % len(ch)]
            mix_at(buf_c, karplus_strong(midi_to_hz(m_arp), beat_c * 1.6, 0.995, rng=rng), bt + sub * 0.5 * beat_c, 0.30, -0.35 + (sub % 3) * 0.35)
        mix_at(buf_c, fiddle_or_strings_note(midi_to_hz(ch[0]), beat_c * 2.9, 0.7), bt, 0.16, -0.3)
        mix_at(buf_c, fiddle_or_strings_note(midi_to_hz(ch[2]), beat_c * 2.9, 0.7), bt, 0.14, 0.3)
    for rep in range(3):
        base_b = rep * 24
        for off_b, m_note, d_b in waltz_mel:
            st = (base_b + off_b) * beat_c
            mix_at(buf_c, celesta_bell(midi_to_hz(m_note), d_b * beat_c * 1.2), st, 0.38, 0.15)
            if rep >= 1:
                mix_at(buf_c, flute_note(midi_to_hz(m_note), d_b * beat_c * 0.92), st, 0.26, -0.18)
    save_stereo_mp3(apply_hall_reverb(buf_c, 0.36), BGM_DIR / "collection.mp3", peak_db=-3.5, seamless_fade=True)

    # --- Track 3: mulligan.mp3 (Suspenseful Pre-Battle War Horns & Timpani — ~28s) ---
    beat_m = 60.0 / 108.0
    dur_m = 12 * 4 * beat_m
    buf_m = np.zeros((int(dur_m * SR), 2), dtype=np.float32)
    tom_m = drum_hit("war_tom", rng)
    rim_m = drum_hit("bodhran_rim", rng)
    for bar in range(12):
        bt = bar * 4 * beat_m
        root = 50 if bar % 2 == 0 else 46
        mix_at(buf_m, tom_m, bt, 0.72)
        mix_at(buf_m, rim_m, bt + 1.5 * beat_m, 0.38, -0.25)
        mix_at(buf_m, tom_m, bt + 2.5 * beat_m, 0.55, 0.2)
        for eighth in range(8):
            mix_at(buf_m, fiddle_or_strings_note(midi_to_hz(root), beat_m * 0.38, 0.9), bt + eighth * 0.5 * beat_m, 0.26, -0.25 if eighth % 2 == 0 else 0.25)
        if bar in (2, 6, 10):
            for step_h, hm in [(0.0, 62), (1.0, 69), (2.0, 70), (2.5, 69)]:
                mix_at(buf_m, brass_horn_note(midi_to_hz(hm), beat_m * 1.3), bt + step_h * beat_m, 0.44)
    save_stereo_mp3(apply_hall_reverb(buf_m, 0.36), BGM_DIR / "mulligan.mp3", peak_db=-3.0, seamless_fade=True)

    # --- Track 4 & 5: duel_1.mp3 & duel_2.mp3 (Heroic Orchestral Arena Battle Scores!) ---
    for track_name, bpm, prog_duel, lead_motif in [
        (
            "duel_1.mp3",
            138.0,
            [(50, [57, 62, 65]), (46, [53, 58, 62]), (48, [55, 60, 64]), (45, [52, 57, 61])] * 6,
            [74, 0, 74, 77, 81, 0, 79, 77,  76, 0, 79, 76, 74, 72, 69, 0,
             74, 77, 81, 86, 84, 81, 79, 77, 76, 0, 73, 76, 79, 81, 85, 0],
        ),
        (
            "duel_2.mp3",
            144.0,
            [(52, [59, 64, 67]), (53, [60, 65, 69]), (50, [57, 62, 65]), (47, [54, 59, 63])] * 6,
            [76, 76, 79, 83, 84, 83, 79, 76, 77, 0, 81, 77, 74, 77, 76, 0,
             79, 83, 88, 86, 84, 83, 79, 76, 78, 0, 75, 78, 83, 84, 83, 0],
        ),
    ]:
        bt_len = 60.0 / bpm
        st_len = bt_len / 2.0
        total_bars = len(prog_duel)
        dur_d = total_bars * 4 * bt_len
        buf_d = np.zeros((int(dur_d * SR), 2), dtype=np.float32)
        w_tom = drum_hit("war_tom", rng)
        w_rim = drum_hit("bodhran_rim", rng)
        w_cym = drum_hit("cymbal", rng)

        for b_i, (root_m, ch_ms) in enumerate(prog_duel):
            bt = b_i * 4 * bt_len
            # Driving War Drums
            mix_at(buf_d, w_tom, bt, 0.85)
            mix_at(buf_d, w_rim, bt + 1.0 * bt_len, 0.55, -0.2)
            mix_at(buf_d, w_tom, bt + 1.5 * bt_len, 0.62, 0.15)
            mix_at(buf_d, w_tom, bt + 2.0 * bt_len, 0.80)
            mix_at(buf_d, w_rim, bt + 3.0 * bt_len, 0.60, 0.2)
            mix_at(buf_d, w_rim, bt + 3.5 * bt_len, 0.45, -0.2)
            if b_i % 4 == 0:
                mix_at(buf_d, w_cym, bt, 0.45)

            # Spiccato Ostinato Low & Mid Strings
            for e in range(8):
                om = root_m if e % 2 == 0 else ch_ms[e % 3]
                mix_at(buf_d, fiddle_or_strings_note(midi_to_hz(om), st_len * 0.85, 1.1), bt + e * st_len, 0.30, -0.35 if e % 2 == 0 else 0.35)

            # Heroic Brass Chord Stabs on beats 1 and 3.5
            for c_m in ch_ms:
                mix_at(buf_d, brass_horn_note(midi_to_hz(c_m), bt_len * 1.4), bt, 0.28, 0.15)
                mix_at(buf_d, brass_horn_note(midi_to_hz(c_m), bt_len * 0.9), bt + 2.5 * bt_len, 0.24, -0.15)

        # Heroic Lead Melody (Brass + Soaring Violin/Flute)
        full_lead = lead_motif * (total_bars // 4)
        for idx_n, m_n in enumerate(full_lead):
            if m_n <= 0:
                continue
            st = idx_n * st_len
            n_dur = st_len * (1.8 if (idx_n + 1 < len(full_lead) and full_lead[idx_n + 1] == 0) else 0.95)
            mix_at(buf_d, brass_horn_note(midi_to_hz(m_n - 12), n_dur), st, 0.42, -0.15)
            mix_at(buf_d, fiddle_or_strings_note(midi_to_hz(m_n), n_dur, 1.2), st, 0.36, 0.20)

        save_stereo_mp3(apply_hall_reverb(buf_d, 0.32), BGM_DIR / track_name, peak_db=-2.8, seamless_fade=True)


# ============================================================================
# 3. GENERATE 135 KOREAN CHARACTER VOICEOVER MP3s (edge-tts + ffmpeg DSP)
# ============================================================================

INNKEEPER_AND_ANNOUNCER = [
    # Warm Boisterous Elwin Sanctuary Keeper
    ("innkeeper_welcome", "ko-KR-HyunsuMultilingualNeural", "+6%", "+3Hz", "tavern", "엘윈마을 성소에 어서 오세요! 따뜻한 난로 곁에 자리를 잡고 앉으세요!"),
    ("innkeeper_mulligan", "ko-KR-HyunsuMultilingualNeural", "+5%", "+2Hz", "tavern", "결전이 곧 시작됩니다! 시작할 카드를 신중히 고르세요!"),
    ("innkeeper_coin", "ko-KR-HyunsuMultilingualNeural", "+6%", "+2Hz", "tavern", "후공이군요! 엘윈의 은화를 사용해 마나를 얻으세요!"),
    ("innkeeper_collection", "ko-KR-HyunsuMultilingualNeural", "+4%", "+2Hz", "tavern", "별빛 기록실에 오셨군요! 최강의 덱을 편성해 보세요!"),
    # Dramatic Pack Opening Innkeeper / Stadium Announcer (Authentic Hearthstone Korean Callouts)
    ("announcer_rare", "ko-KR-InJoonNeural", "+16%", "+7Hz", "announcer", "희귀 카드!"),
    ("announcer_epic", "ko-KR-InJoonNeural", "+10%", "+7Hz", "announcer", "특급 카드!"),
    ("announcer_legendary", "ko-KR-InJoonNeural", "+6%", "+9Hz", "announcer", "오~ 전설 카드!"),
    ("announcer_golden_common", "ko-KR-InJoonNeural", "+12%", "+7Hz", "announcer", "황금 일반 카드!"),
    ("announcer_golden_rare", "ko-KR-InJoonNeural", "+12%", "+8Hz", "announcer", "황금 희귀 카드!"),
    ("announcer_golden_epic", "ko-KR-InJoonNeural", "+10%", "+8Hz", "announcer", "황금 특급 카드!"),
    ("announcer_golden_legendary", "ko-KR-InJoonNeural", "+7%", "+10Hz", "announcer", "오~ 황금 전설 카드!"),
    ("announcer_versus", "ko-KR-InJoonNeural", "+4%", "+4Hz", "announcer", "대!"),
    ("announcer_priest", "ko-KR-InJoonNeural", "+6%", "+4Hz", "announcer", "엘윈의 눈히어로, 카단!"),
    ("announcer_mage", "ko-KR-InJoonNeural", "+6%", "+4Hz", "announcer", "심연의 바다신, 포세이돈!"),
    ("announcer_warrior", "ko-KR-InJoonNeural", "+6%", "+4Hz", "announcer", "불꽃의 태양황제, 이그니시우스!"),
    ("announcer_hunter", "ko-KR-InJoonNeural", "+6%", "+4Hz", "announcer", "천공의 폭풍신, 바람신 토람!"),
    ("announcer_paladin", "ko-KR-InJoonNeural", "+6%", "+4Hz", "announcer", "대지 성채의 거신, 콜로서스!"),
    ("announcer_rogue", "ko-KR-InJoonNeural", "+6%", "+4Hz", "announcer", "어둠의 데스나이트, 아르투스!"),
    ("announcer_shaman", "ko-KR-InJoonNeural", "+6%", "+4Hz", "announcer", "달빛 실반의 대마도사, 에일라!"),
    ("announcer_warlock", "ko-KR-InJoonNeural", "+6%", "+4Hz", "announcer", "딥포지의 거신병, 아이언포지!"),
    ("announcer_druid", "ko-KR-InJoonNeural", "+6%", "+4Hz", "announcer", "야성 설원의 늑대왕, 펜릴!"),
]

HERO_VO_CONFIGS = {
    "priest": {
        "voice": "ko-KR-InJoonNeural", "rate": "+6%", "pitch": "+5Hz", "fx": "heroic",
        "lines": {
            "greetings": "엘윈마을의 이름으로 인사드립니다!",
            "well_played": "정말 훌륭한 한 수였어요!",
            "thanks": "고맙습니다, 동료여!",
            "wow": "은빛 단검이 공명할 만큼 놀랍군요!",
            "oops": "앗, 성급한 판단이었네요.",
            "threaten": "눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!",
            "start": "엘윈마을의 별빛이여, 길을 밝혀라!",
            "concede": "완패입니다. 당신의 기개를 인정합니다.",
            "attack": "설원의 일격이다!",
            "error_mana": "아직 마나가 부족합니다!",
            "error_attacked": "그 동료는 이미 행동했습니다.",
            "error_taunt": "도발 수호병이 길을 막고 있습니다!",
            "time": "서둘러야 합니다, 시간이 얼마 없습니다!",
        },
    },
    "mage": {
        "voice": "ko-KR-HyunsuMultilingualNeural", "rate": "-5%", "pitch": "-14Hz", "fx": "abyss",
        "lines": {
            "greetings": "태초의 해류가 그대를 맞이한다.",
            "well_played": "심연처럼 깊은 지략이로군.",
            "thanks": "바다의 이름으로 감사하마.",
            "wow": "거대한 해일 같은 일격이군!",
            "oops": "조류가 잠시 어긋났군.",
            "threaten": "심연 해구의 수압으로 산산이 부숴주마!",
            "start": "모든 물의 정령들이여, 내 삼지창에 답하라!",
            "concede": "해류가 물러난다. 이번 승리는 그대의 것이다.",
            "attack": "심해의 파도여, 덮쳐라!",
            "error_mana": "해류의 마나가 부족하다.",
            "error_attacked": "그 정령은 이미 공격을 마쳤다.",
            "error_taunt": "방패병이 앞을 가로막고 있군.",
            "time": "밀물의 시간이 끝나간다.",
        },
    },
    "warrior": {
        "voice": "ko-KR-InJoonNeural", "rate": "-2%", "pitch": "-10Hz", "fx": "flame",
        "lines": {
            "greetings": "불꽃 궁정의 열기를 견딜 수 있겠느냐!",
            "well_played": "제법 뜨거운 투지로군!",
            "thanks": "황제의 이름으로 치하하마.",
            "wow": "초신성 같은 위력이군!",
            "oops": "불길이 잠시 빗나갔다.",
            "threaten": "태양신 대검으로 재조차 남기지 않겠다!",
            "start": "최초의 불꽃이여, 전장을 불살라라!",
            "concede": "내 불꽃이 사그라들다니, 기억해 두마!",
            "attack": "태양의 불꽃으로 베어주마!",
            "error_mana": "마나가 모자란다!",
            "error_attacked": "이미 공격한 전사다!",
            "error_taunt": "도발하는 자부터 불태워야 한다!",
            "time": "결단을 내려라, 불길이 식는다!",
        },
    },
    "hunter": {
        "voice": "ko-KR-HyunsuMultilingualNeural", "rate": "+8%", "pitch": "+2Hz", "fx": "wind",
        "lines": {
            "greetings": "바람섬의 순풍이 함께하길.",
            "well_played": "바람보다 날렵한 수였소.",
            "thanks": "고맙소, 바람의 벗이여.",
            "wow": "천공을 가르는 번개 같군!",
            "oops": "난기류에 휩쓸렸군.",
            "threaten": "쌍둥이 태풍이 네 숨통을 꿰뚫을 것이다!",
            "start": "천공의 모든 폭풍이여, 사냥을 시작하자!",
            "concede": "바람이 멎었군. 그대의 완승이오.",
            "attack": "폭풍의 화살을 받아라!",
            "error_mana": "아직 마나가 부족하오.",
            "error_attacked": "이미 바람을 가른 뒤요.",
            "error_taunt": "방패잡이가 시야를 가리고 있소!",
            "time": "바람은 기다려 주지 않소!",
        },
    },
    "paladin": {
        "voice": "ko-KR-HyunsuMultilingualNeural", "rate": "-9%", "pitch": "-20Hz", "fx": "titan",
        "lines": {
            "greetings": "대지 성채의 이름으로 문안하노라.",
            "well_played": "반석처럼 단단한 전술이군.",
            "thanks": "대지의 축복이 깃들기를.",
            "wow": "산맥이 울릴 만한 기적이로군!",
            "oops": "지반이 잠시 흔들렸군.",
            "threaten": "대지 심장부의 분노로 심판하리라!",
            "start": "성채의 결계를 펼쳐라, 한 걸음도 물러서지 않는다!",
            "concede": "거신이 무릎을 꿇는다. 경이로운 승리다.",
            "attack": "대지의 무게를 느껴라!",
            "error_mana": "대지의 마력이 아직 부족하다.",
            "error_attacked": "그 수호병은 이미 공격했다.",
            "error_taunt": "전열의 수호자를 먼저 돌파해야 한다.",
            "time": "모래시계가 다 흘러간다.",
        },
    },
    "rogue": {
        "voice": "ko-KR-InJoonNeural", "rate": "-6%", "pitch": "-16Hz", "fx": "undead",
        "lines": {
            "greetings": "붉은 유리 궁정의 밤안개에 온 걸 환영하지.",
            "well_played": "꽤나 예리한 찌르기였군.",
            "thanks": "기꺼이 받아두지.",
            "wow": "서리 마검조차 떨릴 만한 위력이군!",
            "oops": "그림자가 잠시 흔들렸군.",
            "threaten": "네 영혼마저 얼어붙은 어둠 속에 가둬주마!",
            "start": "섀도우렐름의 어둠이 모든 빛을 삼키리라.",
            "concede": "이번 국면은 물러나지. 끝이라고 생각 마라.",
            "attack": "어둠 속으로 사라져라!",
            "error_mana": "어둠의 마나가 부족하군.",
            "error_attacked": "그 망령은 이미 움직였다.",
            "error_taunt": "방해꾼이 앞을 막고 있군.",
            "time": "시간이 죽어가고 있다.",
        },
    },
    "shaman": {
        "voice": "ko-KR-SunHiNeural", "rate": "+3%", "pitch": "+4Hz", "fx": "sylvan",
        "lines": {
            "greetings": "달빛 실반의 은총이 그대를 비추기를.",
            "well_played": "고대 룬의 이치를 꿰뚫으셨군요.",
            "thanks": "실반의 이름으로 감사드려요.",
            "wow": "별빛이 춤출 만큼 경이로운 마력이네요!",
            "oops": "룬 배열이 한 획 어긋났군요.",
            "threaten": "초승달의 마검과 정령석이 당신을 심판할 거예요!",
            "start": "고대 문자의 비전이여, 실반의 숲을 수호하라!",
            "concede": "아름다운 지략이었어요. 당신의 승리입니다.",
            "attack": "초승달의 빛이여, 꿰뚫어라!",
            "error_mana": "아직 마나가 충분하지 않아요.",
            "error_attacked": "그 정령은 이미 공격을 마쳤어요.",
            "error_taunt": "도발 수호자가 앞을 가로막고 있어요.",
            "time": "별빛이 기울고 있어요, 서둘러요!",
        },
    },
    "warlock": {
        "voice": "ko-KR-HyunsuMultilingualNeural", "rate": "-5%", "pitch": "-12Hz", "fx": "mecha",
        "lines": {
            "greetings": "딥포지 왕국의 대장간 불꽃은 꺼지지 않는다!",
            "well_played": "명장의 망치질처럼 정확한 수로군!",
            "thanks": "고맙다, 강철의 전우여.",
            "wow": "오리하르콘도 꿰뚫을 일격이군!",
            "oops": "용광로 압력이 너무 높았군.",
            "threaten": "별자리 룬 대방패 아래 가루로 빻아주마!",
            "start": "딥포지의 용광로를 최대 출력으로 가동하라!",
            "concede": "장갑이 한계에 달했군. 훌륭한 대결이었다!",
            "attack": "강철 망치 맛을 봐라!",
            "error_mana": "동력 마나가 부족하다!",
            "error_attacked": "그 기체는 이미 가동했다.",
            "error_taunt": "앞에 선 방패병부터 부숴야 한다!",
            "time": "보일러 과열 직전이다, 서둘러라!",
        },
    },
    "druid": {
        "voice": "ko-KR-InJoonNeural", "rate": "-4%", "pitch": "-13Hz", "fx": "beast",
        "lines": {
            "greetings": "만년설 황야의 기개를 보여보아라.",
            "well_played": "영수의 왕도 인정할 만한 발톱이군.",
            "thanks": "기억해 두마, 인간의 벗이여.",
            "wow": "대지를 가르는 포효로군!",
            "oops": "사냥감의 발자국을 놓쳤군.",
            "threaten": "서리 룬 발톱으로 네 목줄을 물어뜯어 주마!",
            "start": "야성의 대지여, 늑대왕의 부름에 깨어나라!",
            "concede": "강한 자가 승리하는 것이 야성의 법칙. 네 승리다.",
            "attack": "서리 늑대의 송곳니를 받아라!",
            "error_mana": "야성의 마나가 부족하다!",
            "error_attacked": "그 맹수는 이미 덮쳤다.",
            "error_taunt": "방패 든 사냥감이 앞을 막고 있다!",
            "time": "사냥의 순간이 지나간다, 결단하라!",
        },
    },
}

FX_CHAINS = {
    "tavern": "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-46dB,equalizer=f=220:t=q:w=1.2:g=3,equalizer=f=3400:t=q:w=1.4:g=2.5,aecho=0.85:0.75:32|64:0.18|0.10,dynaudnorm=f=150:g=9",
    "announcer": "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-46dB,equalizer=f=150:t=q:w=1.1:g=4.5,equalizer=f=3800:t=q:w=1.3:g=3.5,aecho=0.85:0.80:65|135:0.28|0.16,dynaudnorm=f=150:g=9",
    "heroic": "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-46dB,equalizer=f=260:t=q:w=1.2:g=2.5,equalizer=f=4200:t=q:w=1.3:g=3.0,aecho=0.85:0.75:28:0.15,dynaudnorm=f=150:g=9",
    "abyss": "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-46dB,equalizer=f=120:t=q:w=1.0:g=5.0,aecho=0.85:0.82:55|110:0.26|0.15,dynaudnorm=f=150:g=9",
    "flame": "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-46dB,equalizer=f=180:t=q:w=1.1:g=4.0,equalizer=f=3200:t=q:w=1.2:g=3.0,aecho=0.85:0.75:38:0.20,dynaudnorm=f=150:g=9",
    "wind": "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-46dB,equalizer=f=4500:t=q:w=1.3:g=3.5,aecho=0.85:0.78:42|84:0.20|0.11,dynaudnorm=f=150:g=9",
    "titan": "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-46dB,asetrate=24000*0.92,aresample=44100,equalizer=f=110:t=q:w=1.0:g=6.0,aecho=0.85:0.82:60|120:0.28|0.16,dynaudnorm=f=150:g=9",
    "undead": "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-46dB,chorus=0.7:0.9:26|34:0.35|0.28:0.25|0.3:1.8|2.1,equalizer=f=140:t=q:w=1.1:g=4.0,aecho=0.85:0.80:52:0.25,dynaudnorm=f=150:g=9",
    "sylvan": "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-46dB,chorus=0.8:0.88:22:0.22:0.25:1.6,equalizer=f=5200:t=q:w=1.4:g=3.0,aecho=0.85:0.78:45|90:0.22|0.12,dynaudnorm=f=150:g=9",
    "mecha": "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-46dB,aecho=0.88:0.85:11|23:0.36|0.22,equalizer=f=190:t=q:w=1.2:g=4.0,equalizer=f=2400:t=q:w=1.8:g=3.5,dynaudnorm=f=150:g=9",
    "beast": "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-46dB,asetrate=24000*0.95,aresample=44100,equalizer=f=135:t=q:w=1.0:g=5.0,aecho=0.85:0.78:44:0.22,dynaudnorm=f=150:g=9",
}


async def render_single_vo(sem: asyncio.Semaphore, key: str, voice: str, rate: str, pitch: str, fx: str, text: str) -> None:
    out_mp3 = VO_DIR / f"{key}.mp3"
    async with sem:
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            raw_path = tmp.name
        try:
            comm = edge_tts.Communicate(text=text, voice=voice, rate=rate, pitch=pitch)
            await comm.save(raw_path)
            af = FX_CHAINS.get(fx, FX_CHAINS["heroic"])
            subprocess.run(
                [
                    "ffmpeg", "-y", "-loglevel", "error",
                    "-i", raw_path,
                    "-af", af,
                    "-ar", "44100", "-ac", "2",
                    "-codec:a", "libmp3lame", "-b:a", "128k",
                    str(out_mp3),
                ],
                check=True,
            )
        finally:
            if os.path.exists(raw_path):
                os.remove(raw_path)


async def build_all_vo() -> int:
    jobs = list(INNKEEPER_AND_ANNOUNCER)
    for vo_key, cfg in HERO_VO_CONFIGS.items():
        for kind, line_text in cfg["lines"].items():
            jobs.append((f"hero_{vo_key}_{kind}", cfg["voice"], cfg["rate"], cfg["pitch"], cfg["fx"], line_text))

    sem = asyncio.Semaphore(10)
    await asyncio.gather(*(render_single_vo(sem, *job) for job in jobs))
    return len(jobs)


def main() -> None:
    ensure_dirs()
    print("[1/3] Synthesizing 30 benchmarked Hearthstone-grade physical foley + arcane SFX MP3s...")
    build_all_sfx()
    print(f"  -> {len(list(SFX_DIR.glob('*.mp3')))} SFX files ready in {SFX_DIR}")

    print("[2/3] Synthesizing 5 multi-instrument Celtic-Tavern & Fantasy Orchestral BGM MP3s...")
    build_all_bgm()
    print(f"  -> {len(list(BGM_DIR.glob('*.mp3')))} BGM files ready in {BGM_DIR}")

    print("[3/3] Generating & mastering 135 Korean neural character voiceover MP3s...")
    vo_count = asyncio.run(build_all_vo())
    print(f"  -> {vo_count} VO files ready in {VO_DIR}")
    print("ALL 170 SNSHERO AUDIO ASSETS GENERATED SUCCESSFULLY!")


if __name__ == "__main__":
    main()
