#!/usr/bin/env python3
"""
Generate 5 soothing, gentle, lyrical fantasy BGM tracks ('잔잔한 노래')
for /game.html (public/hs-assets/snshero-audio/bgm/*.mp3):
- Soft felt piano + warm nylon acoustic guitar arpeggios + gentle harp/celesta + warm strings pad
- Slow, peaceful tempos (64-74 BPM) with soft low-pass warmth and seamless loop crossfade
"""
import math
import os
import subprocess
import tempfile
import wave
import numpy as np

SR = 44100
BGM_DIR = "/Users/dayyoung/project/snshero/public/hs-assets/snshero-audio/bgm"
FFMPEG = "/opt/homebrew/bin/ffmpeg"

NOTE_SEMI = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
    "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
    "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11,
}


def hz(note: str) -> float:
    name = note[:-1]
    octv = int(note[-1])
    midi = 12 * (octv + 1) + NOTE_SEMI[name]
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


def add_at(buf: np.ndarray, sig: np.ndarray, start_s: float, gain: float = 1.0):
    i0 = int(start_s * SR)
    if i0 >= len(buf) or len(sig) == 0:
        return
    if i0 < 0:
        sig = sig[-i0:]
        i0 = 0
    end = min(len(buf), i0 + len(sig))
    buf[i0:end] += sig[: end - i0] * gain


def felt_piano_note(freq: float, dur: float) -> np.ndarray:
    """Warm, soft felt-piano tone with gentle hammer attack and natural decay."""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    att = np.clip(t / 0.022, 0.0, 1.0)
    env = att * (0.72 * np.exp(-2.1 * t / max(0.6, dur * 0.7)) + 0.28 * np.exp(-0.7 * t / max(0.8, dur)))
    # Slight detuned unison + warm fundamental & soft 2nd/3rd harmonics
    sig = (
        0.66 * np.sin(2 * math.pi * freq * t)
        + 0.18 * np.sin(2 * math.pi * (freq * 1.0008) * t)
        + 0.22 * np.sin(2 * math.pi * (freq * 2.0) * t) * np.exp(-3.2 * t)
        + 0.07 * np.sin(2 * math.pi * (freq * 3.0) * t) * np.exp(-5.0 * t)
        + 0.025 * np.sin(2 * math.pi * (freq * 4.0) * t) * np.exp(-7.5 * t)
    )
    # Fade tail smoothly
    tail = int(min(n * 0.18, SR * 0.12))
    if tail > 0:
        env[-tail:] *= np.linspace(1.0, 0.0, tail)
    return (sig * env).astype(np.float32)


def nylon_pluck(freq: float, dur: float) -> np.ndarray:
    """Soft fingerpicked nylon guitar / warm harp string (mellow Karplus-Strong)."""
    n = int(SR * dur)
    period = max(4, int(round(SR / freq)))
    rng = np.random.default_rng(int(freq * 100) % 99991)
    # Smoothly filtered initial excitation so there is zero harshness
    raw = rng.uniform(-0.6, 0.6, period).astype(np.float64)
    burst = np.convolve(raw, np.ones(6) / 6.0, mode="same")
    out = np.zeros(n, dtype=np.float64)
    buf = burst.copy()
    idx = 0
    for i in range(n):
        out[i] = buf[idx]
        nxt = (idx + 1) % period
        buf[idx] = 0.9955 * (0.62 * buf[idx] + 0.38 * buf[nxt])
        idx = nxt
    fade = int(min(n * 0.15, SR * 0.1))
    if fade > 0:
        out[-fade:] *= np.linspace(1.0, 0.0, fade)
    return out.astype(np.float32)


def warm_pad_chord(freqs: list[float], dur: float) -> np.ndarray:
    """Silky, breathing warm strings/choir pad with slow attack & release."""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    att = np.clip(t / min(0.9, dur * 0.28), 0.0, 1.0)
    rel = np.clip((dur - t) / min(0.9, dur * 0.28), 0.0, 1.0)
    env = np.sin(att * math.pi * 0.5) * np.sin(rel * math.pi * 0.5)
    vib = 1.0 + 0.0018 * np.sin(2 * math.pi * 4.2 * t)
    sig = np.zeros(n, dtype=np.float64)
    for f in freqs:
        ph = 2 * math.pi * f * np.cumsum(vib) / SR
        sig += 0.62 * np.sin(ph) + 0.24 * np.sin(2 * ph) * 0.45 + 0.14 * np.sin(0.5 * ph) * 0.35
    sig /= max(1, len(freqs))
    return (sig * env).astype(np.float32)


def celesta_bell(freq: float, dur: float) -> np.ndarray:
    """Delicate music-box / celesta bell overtone."""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    att = np.clip(t / 0.012, 0.0, 1.0)
    env = att * np.exp(-3.0 * t / max(0.5, dur * 0.65))
    sig = 0.78 * np.sin(2 * math.pi * freq * t) + 0.22 * np.sin(2 * math.pi * freq * 2.0 * t) * np.exp(-4.5 * t)
    return (sig * env).astype(np.float32)


def save_calm_mp3(filename: str, left: np.ndarray, right: np.ndarray):
    # Crossfade last 2.0s with first 2.0s for a click-free seamless loop
    xf = int(2.0 * SR)
    if len(left) > xf * 3:
        w_out = np.linspace(1.0, 0.0, xf, dtype=np.float32)
        w_in = np.linspace(0.0, 1.0, xf, dtype=np.float32)
        left_loop = left[:-xf].copy()
        right_loop = right[:-xf].copy()
        left_loop[:xf] = left_loop[:xf] * w_in + left[-xf:] * w_out
        right_loop[:xf] = right_loop[:xf] * w_in + right[-xf:] * w_out
        left, right = left_loop, right_loop

    peak = max(float(np.max(np.abs(left))), float(np.max(np.abs(right))), 1e-6)
    # Normalize gently to -4.5 dBFS peak so overall dynamics stay calm & soothing
    scale = 0.58 / peak
    stereo = np.stack([left * scale, right * scale], axis=-1)
    pcm = np.clip(stereo * 32767.0, -32767, 32767).astype(np.int16)

    os.makedirs(BGM_DIR, exist_ok=True)
    out_mp3 = os.path.join(BGM_DIR, filename)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
        wav_path = tf.name
    try:
        with wave.open(wav_path, "wb") as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(SR)
            wf.writeframes(pcm.tobytes())
        # Warm studio reverb + gentle lowpass at 6.5kHz so there is zero ear fatigue
        af = (
            "lowpass=f=6500,"
            "highpass=f=45,"
            "aecho=0.8:0.78:65|115:0.22|0.15,"
            "alimiter=limit=0.72"
        )
        subprocess.run(
            [FFMPEG, "-y", "-loglevel", "error", "-i", wav_path, "-af", af, "-c:a", "libmp3lame", "-b:a", "160k", out_mp3],
            check=True,
        )
    finally:
        if os.path.exists(wav_path):
            os.remove(wav_path)


def render_calm_song(
    filename: str,
    bpm: float,
    chords: list[list[str]],
    melody: list[tuple[float, str, float]],
    arp_pattern: list[int],
    cycles: int = 2,
):
    beat = 60.0 / bpm
    bar = beat * 4.0
    cycle_dur = bar * len(chords)
    total_dur = cycle_dur * cycles + 2.0
    n = int(total_dur * SR)
    L = np.zeros(n, dtype=np.float32)
    R = np.zeros(n, dtype=np.float32)

    for cyc in range(cycles):
        base_t = cyc * cycle_dur
        for idx, ch in enumerate(chords):
            b0 = base_t + idx * bar
            # 1. Warm sustained string/pad bed
            pad = warm_pad_chord([hz(nt) for nt in ch[:3]], bar * 1.06)
            add_at(L, pad, b0, 0.22)
            add_at(R, pad, b0 + 0.012, 0.22)

            # 2. Deep soft bass root piano note on beat 1 & 3
            bass_root = ch[0][:-1] + str(max(2, int(ch[0][-1]) - 1))
            bn = felt_piano_note(hz(bass_root), beat * 2.4)
            add_at(L, bn, b0, 0.28)
            add_at(R, bn, b0, 0.28)
            bn2 = felt_piano_note(hz(ch[0]), beat * 2.0)
            add_at(L, bn2, b0 + beat * 2.0, 0.20)
            add_at(R, bn2, b0 + beat * 2.0, 0.20)

            # 3. Gentle eighth-note nylon guitar / harp arpeggio
            step = beat * 0.5
            for s_i, p_idx in enumerate(arp_pattern):
                nt = ch[p_idx % len(ch)]
                pl = nylon_pluck(hz(nt), step * 2.6)
                pan_l = 0.22 if s_i % 2 == 0 else 0.14
                pan_r = 0.14 if s_i % 2 == 0 else 0.22
                add_at(L, pl, b0 + s_i * step, pan_l)
                add_at(R, pl, b0 + s_i * step, pan_r)

        # 4. Expressive felt-piano + celesta melody
        for beat_offset, note_name, beat_len in melody:
            t0 = base_t + beat_offset * beat
            dur = beat_len * beat * 1.15
            pn = felt_piano_note(hz(note_name), dur)
            add_at(L, pn, t0, 0.36)
            add_at(R, pn, t0 + 0.006, 0.34)
            # Subtle celesta shimmer one octave higher on long notes
            if beat_len >= 1.5:
                hi_note = note_name[:-1] + str(min(6, int(note_name[-1]) + 1))
                bell = celesta_bell(hz(hi_note), dur * 0.85)
                add_at(L, bell, t0 + 0.015, 0.08)
                add_at(R, bell, t0 + 0.022, 0.10)

    save_calm_mp3(filename, L, R)
    print(f"  -> Generated calm track: {filename}")


def main():
    print("Generating 5 calm, soothing fantasy BGM tracks...")

    # 1. tavern_hub.mp3: Peaceful Snowy Elwin Village Sanctuary (Fmaj7 - C/E - Dm7 - Bbmaj7, 68 BPM)
    render_calm_song(
        "tavern_hub.mp3",
        bpm=68,
        chords=[
            ["F3", "A3", "C4", "E4"],
            ["E3", "G3", "C4", "E4"],
            ["D3", "F3", "A3", "C4"],
            ["Bb2", "F3", "A3", "D4"],
            ["F3", "A3", "C4", "F4"],
            ["C3", "G3", "B3", "E4"],
            ["Dm3" if False else "D3", "A3", "C4", "F4"],
            ["Bb2", "F3", "Bb3", "D4"],
        ],
        melody=[
            (0.0, "A4", 1.5), (1.5, "C5", 0.5), (2.0, "G4", 2.0),
            (4.0, "G4", 1.5), (5.5, "A4", 0.5), (6.0, "E4", 2.0),
            (8.0, "F4", 1.5), (9.5, "A4", 0.5), (10.0, "C5", 1.5), (11.5, "A4", 0.5),
            (12.0, "D5", 2.0), (14.0, "C5", 2.0),
            (16.0, "A4", 1.5), (17.5, "F4", 0.5), (18.0, "C5", 2.0),
            (20.0, "B4", 1.5), (21.5, "G4", 0.5), (22.0, "E4", 2.0),
            (24.0, "F4", 1.5), (25.5, "G4", 0.5), (26.0, "A4", 2.0),
            (28.0, "G4", 2.0), (30.0, "F4", 2.0),
        ],
        arp_pattern=[0, 1, 2, 3, 2, 1, 2, 3],
        cycles=2,
    )

    # 2. collection.mp3: Starlight Archive Lullaby (Gmaj7 - Em7 - Cmaj7 - D6, 64 BPM)
    render_calm_song(
        "collection.mp3",
        bpm=64,
        chords=[
            ["G3", "B3", "D4", "F#4"],
            ["E3", "B3", "D4", "G4"],
            ["C3", "G3", "B3", "E4"],
            ["D3", "A3", "B3", "F#4"],
        ],
        melody=[
            (0.0, "B4", 2.0), (2.0, "D5", 1.5), (3.5, "B4", 0.5),
            (4.0, "G4", 2.5), (6.5, "A4", 1.5),
            (8.0, "E4", 2.0), (10.0, "G4", 1.5), (11.5, "B4", 0.5),
            (12.0, "A4", 3.0), (15.0, "F#4", 1.0),
        ],
        arp_pattern=[0, 2, 1, 3, 2, 3, 1, 2],
        cycles=3,
    )

    # 3. mulligan.mp3: Calm Star-Breathing Meditation Before Duel (Am7 - Fmaj7 - Cmaj7 - G6, 66 BPM)
    render_calm_song(
        "mulligan.mp3",
        bpm=66,
        chords=[
            ["A2", "E3", "C4", "E4"],
            ["F2", "C3", "A3", "E4"],
            ["C3", "G3", "C4", "E4"],
            ["G2", "D3", "B3", "D4"],
        ],
        melody=[
            (0.0, "E4", 2.0), (2.0, "A4", 2.0),
            (4.0, "C5", 2.5), (6.5, "B4", 1.5),
            (8.0, "G4", 2.0), (10.0, "E4", 2.0),
            (12.0, "D4", 3.5),
        ],
        arp_pattern=[0, 1, 2, 3, 1, 2, 3, 2],
        cycles=2,
    )

    # 4. duel_1.mp3: Lyrical Snowfield Journey Ballad (Am9 - Fmaj7 - C - G/B, 72 BPM)
    render_calm_song(
        "duel_1.mp3",
        bpm=72,
        chords=[
            ["A2", "E3", "A3", "C4"],
            ["F2", "C3", "A3", "C4"],
            ["C3", "G3", "C4", "E4"],
            ["G2", "D3", "G3", "B3"],
            ["D3", "A3", "D4", "F4"],
            ["A2", "E3", "A3", "C4"],
            ["F2", "C3", "A3", "E4"],
            ["E2", "B2", "G#3" if False else "G3", "B3"],
        ],
        melody=[
            (0.0, "E4", 1.5), (1.5, "A4", 0.5), (2.0, "C5", 1.5), (3.5, "B4", 0.5),
            (4.0, "A4", 2.0), (6.0, "F4", 2.0),
            (8.0, "G4", 1.5), (9.5, "C5", 0.5), (10.0, "E5", 1.5), (11.5, "D5", 0.5),
            (12.0, "B4", 2.5), (14.5, "G4", 1.5),
            (16.0, "A4", 1.5), (17.5, "D5", 0.5), (18.0, "C5", 2.0),
            (20.0, "B4", 1.5), (21.5, "A4", 0.5), (22.0, "E4", 2.0),
            (24.0, "F4", 1.5), (25.5, "A4", 0.5), (26.0, "C5", 2.0),
            (28.0, "B4", 2.0), (30.0, "A4", 2.0),
        ],
        arp_pattern=[0, 1, 2, 3, 2, 1, 2, 3],
        cycles=2,
    )

    # 5. duel_2.mp3: Gentle Moonlight Wind-Isle Serenade (Dm7 - Bbmaj7 - Fmaj7 - C6, 70 BPM)
    render_calm_song(
        "duel_2.mp3",
        bpm=70,
        chords=[
            ["D3", "A3", "C4", "F4"],
            ["Bb2", "F3", "Bb3", "D4"],
            ["F3", "A3", "C4", "E4"],
            ["C3", "G3", "A3", "E4"],
            ["G2", "D3", "Bb3", "D4"],
            ["D3", "A3", "D4", "F4"],
            ["Bb2", "F3", "A3", "D4"],
            ["A2", "E3", "A3", "C4"],
        ],
        melody=[
            (0.0, "F4", 1.5), (1.5, "A4", 0.5), (2.0, "D5", 2.0),
            (4.0, "C5", 1.5), (5.5, "Bb4", 0.5), (6.0, "F4", 2.0),
            (8.0, "A4", 1.5), (9.5, "C5", 0.5), (10.0, "G4", 2.0),
            (12.0, "G4", 2.0), (14.0, "E4", 2.0),
            (16.0, "Bb4", 1.5), (17.5, "A4", 0.5), (18.0, "G4", 2.0),
            (20.0, "A4", 1.5), (21.5, "F4", 0.5), (22.0, "D4", 2.0),
            (24.0, "F4", 1.5), (25.5, "G4", 0.5), (26.0, "A4", 2.0),
            (28.0, "E4", 3.0),
        ],
        arp_pattern=[0, 1, 3, 2, 0, 2, 3, 1],
        cycles=2,
    )


if __name__ == "__main__":
    main()
