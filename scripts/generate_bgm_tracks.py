#!/usr/bin/env python3
"""
scripts/generate_bgm_tracks.py

SNSHero Unified RPG Synthesizer BGM Generator.
Generates 4 cohesive, seamless-looping BGM tracks with a unified warm synth timbre
(warm triangle/sine harmonic pads, crystal harp/celesta arpeggios, and gentle sub-bass):
  1. public/bgm/hero-awakening.mp3 (+ public/mixkit-games-worldbeat-466.mp3)
  2. public/bgm/whispering-wind.mp3
  3. public/bgm/colosseum-battle.mp3
  4. public/bgm/sanctuary-lobby.mp3
"""

import math
import os
import shutil
import struct
import subprocess
import tempfile
import wave

SAMPLE_RATE = 44100


def note_freq(note_name: str) -> float:
    notes = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
        'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    }
    if len(note_name) == 2:
        key = note_name[0]
        octave = int(note_name[1])
    else:
        key = note_name[:2]
        octave = int(note_name[2])
    midi = (octave + 1) * 12 + notes[key]
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


def triangle_wave(phase: float) -> float:
    p = phase % 1.0
    if p < 0.25:
        return p * 4.0
    elif p < 0.75:
        return 2.0 - p * 4.0
    else:
        return p * 4.0 - 4.0


def soft_synth_voice(freq: float, t: float, harmonic_mix: float = 0.25) -> float:
    """Unified SNSHero warm synth timbre: fundamental triangle + sine + 2nd harmonic."""
    phase = freq * t
    tri = triangle_wave(phase)
    sin1 = math.sin(2.0 * math.pi * phase)
    sin2 = math.sin(4.0 * math.pi * phase)
    return 0.55 * tri + 0.30 * sin1 + harmonic_mix * sin2


def adsr_envelope(t: float, duration: float, attack: float = 0.03, decay: float = 0.15, sustain: float = 0.45, release: float = 0.20) -> float:
    if t < 0.0 or t >= duration:
        return 0.0
    if t < attack:
        return t / max(attack, 0.001)
    if t < attack + decay:
        progress = (t - attack) / max(decay, 0.001)
        return 1.0 - (1.0 - sustain) * progress
    if t < duration - release:
        return sustain * math.exp(-1.5 * (t - attack - decay))
    rel_progress = (t - (duration - release)) / max(release, 0.001)
    return max(0.0, sustain * math.exp(-1.5 * max(0.0, duration - release - attack - decay)) * (1.0 - rel_progress))


def render_track_to_mp3(samples: list[float], output_mp3_path: str) -> None:
    os.makedirs(os.path.dirname(output_mp3_path), exist_ok=True)

    # Apply 1-pole warm lowpass filter (~2400 Hz cutoff) for cohesive warm RPG timbre
    rc = 1.0 / (2.0 * math.pi * 2400.0)
    dt = 1.0 / SAMPLE_RATE
    alpha = dt / (rc + dt)
    filtered = [0.0] * len(samples)
    prev = 0.0
    for i, s in enumerate(samples):
        prev = prev + alpha * (s - prev)
        filtered[i] = prev

    # Normalize safely to -3 dBFS
    peak = max(abs(x) for x in filtered) or 1.0
    scale = 0.70 / peak

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_wav:
        wav_path = tmp_wav.name

    try:
        with wave.open(wav_path, 'w') as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(SAMPLE_RATE)
            frames = bytearray()
            for i, s in enumerate(filtered):
                # Subtle stereo chorus width
                val_l = max(-1.0, min(1.0, s * scale))
                delayed_idx = max(0, i - 18)
                val_r = max(-1.0, min(1.0, (0.85 * s + 0.15 * filtered[delayed_idx]) * scale))
                frames.extend(struct.pack('<hh', int(val_l * 32767), int(val_r * 32767)))
            wf.writeframes(frames)

        subprocess.run(
            [
                "ffmpeg", "-y",
                "-i", wav_path,
                "-codec:a", "libmp3lame",
                "-b:a", "128k",
                "-ar", "44100",
                output_mp3_path
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    finally:
        if os.path.exists(wav_path):
            os.remove(wav_path)


def generate_hero_awakening() -> list[float]:
    """
    Track 1: Hero Awakening (타이틀 테마 / 모험의 서막)
    Key: C Major / A Minor Heroic Overture (C - G - Am - F - C - G - Dm7 - G)
    Step duration: 0.26s (32 steps = 8.32s * 2 loops = 16.64s)
    """
    step_sec = 0.26
    chords = [
        ('C3', 'G3', 'E4'), ('G2', 'D3', 'B3'), ('A2', 'E3', 'C4'), ('F2', 'C3', 'A3'),
        ('C3', 'G3', 'E4'), ('G2', 'D3', 'B3'), ('D3', 'A3', 'F4'), ('G2', 'D3', 'B3'),
    ]
    melody = [
        'G4', 'C5', 'D5', 'E5',  'D5', 'B4', 'G4', 'D5',
        'C5', 'A4', 'E5', 'D5',  'C5', 'A4', 'F4', 'A4',
        'G4', 'C5', 'E5', 'G5',  'F5', 'D5', 'B4', 'G4',
        'A4', 'D5', 'F5', 'E5',  'D5', 'C5', 'B4', 'D5',
    ] * 2
    total_steps = len(melody)
    total_samples = int(total_steps * step_sec * SAMPLE_RATE)
    buf = [0.0] * total_samples

    for step_idx, mel_note in enumerate(melody):
        t_start = step_idx * step_sec
        chord = chords[(step_idx // 4) % len(chords)]

        # Melody note
        f_mel = note_freq(mel_note)
        note_dur = step_sec * 1.45
        start_sample = int(t_start * SAMPLE_RATE)
        end_sample = min(total_samples, int((t_start + note_dur) * SAMPLE_RATE))
        for i in range(start_sample, end_sample):
            t_local = (i - start_sample) / SAMPLE_RATE
            env = adsr_envelope(t_local, note_dur, attack=0.025, decay=0.12, sustain=0.45, release=0.18)
            buf[i] += 0.38 * env * soft_synth_voice(f_mel, i / SAMPLE_RATE, 0.22)

        # Chord pad & bass every 4 steps
        if step_idx % 4 == 0:
            pad_dur = step_sec * 4.0
            p_start = int(t_start * SAMPLE_RATE)
            p_end = min(total_samples, int((t_start + pad_dur) * SAMPLE_RATE))
            f_bass = note_freq(chord[0]) * 0.5
            f_p1 = note_freq(chord[0])
            f_p2 = note_freq(chord[1])
            f_p3 = note_freq(chord[2])
            for i in range(p_start, p_end):
                t_local = (i - p_start) / SAMPLE_RATE
                t_abs = i / SAMPLE_RATE
                pad_env = adsr_envelope(t_local, pad_dur, attack=0.15, decay=0.3, sustain=0.65, release=0.25)
                pad_sig = (
                    0.35 * math.sin(2.0 * math.pi * f_bass * t_abs)
                    + 0.25 * soft_synth_voice(f_p1, t_abs, 0.1)
                    + 0.22 * soft_synth_voice(f_p2, t_abs, 0.1)
                    + 0.18 * soft_synth_voice(f_p3, t_abs, 0.1)
                )
                buf[i] += 0.42 * pad_env * pad_sig

        # Gentle adventure bass pulse on beats 0 and 2
        if step_idx % 2 == 0:
            b_dur = step_sec * 1.6
            b_start = int(t_start * SAMPLE_RATE)
            b_end = min(total_samples, int((t_start + b_dur) * SAMPLE_RATE))
            f_b = note_freq(chord[0])
            for i in range(b_start, b_end):
                t_local = (i - b_start) / SAMPLE_RATE
                b_env = adsr_envelope(t_local, b_dur, attack=0.015, decay=0.10, sustain=0.35, release=0.12)
                buf[i] += 0.24 * b_env * triangle_wave(f_b * (i / SAMPLE_RATE))

    return buf


def generate_whispering_wind() -> list[float]:
    """
    Track 2: Whispering Wind (바람 속삭임 / 대사 서정 테마)
    Key: A Minor / F Major Lyrical Starlight (Am - F - C - G)
    """
    step_sec = 0.34
    chords = [
        ('A2', 'E3', 'C4'), ('F2', 'C3', 'A3'), ('C3', 'G3', 'E4'), ('G2', 'D3', 'B3'),
    ]
    melody = [
        'E5', 'C5', 'A4', 'E4',  'F4', 'A4', 'C5', 'F5',
        'E5', 'C5', 'G4', 'C5',  'D5', 'B4', 'G4', 'B4',
        'C5', 'E5', 'A5', 'E5',  'F5', 'C5', 'A4', 'C5',
        'E5', 'D5', 'C5', 'B4',  'A4', 'E4', 'A4', 'C5',
    ]
    total_steps = len(melody)
    total_samples = int(total_steps * step_sec * SAMPLE_RATE)
    buf = [0.0] * total_samples

    for step_idx, mel_note in enumerate(melody):
        t_start = step_idx * step_sec
        chord = chords[(step_idx // 4) % len(chords)]

        f_mel = note_freq(mel_note)
        note_dur = step_sec * 1.75
        start_sample = int(t_start * SAMPLE_RATE)
        end_sample = min(total_samples, int((t_start + note_dur) * SAMPLE_RATE))
        for i in range(start_sample, end_sample):
            t_local = (i - start_sample) / SAMPLE_RATE
            env = adsr_envelope(t_local, note_dur, attack=0.035, decay=0.18, sustain=0.40, release=0.25)
            buf[i] += 0.34 * env * soft_synth_voice(f_mel, i / SAMPLE_RATE, 0.18)

        if step_idx % 4 == 0:
            pad_dur = step_sec * 4.0
            p_start = int(t_start * SAMPLE_RATE)
            p_end = min(total_samples, int((t_start + pad_dur) * SAMPLE_RATE))
            f_p1 = note_freq(chord[0])
            f_p2 = note_freq(chord[1])
            f_p3 = note_freq(chord[2])
            for i in range(p_start, p_end):
                t_local = (i - p_start) / SAMPLE_RATE
                t_abs = i / SAMPLE_RATE
                pad_env = adsr_envelope(t_local, pad_dur, attack=0.25, decay=0.4, sustain=0.60, release=0.35)
                pad_sig = (
                    0.38 * math.sin(2.0 * math.pi * f_p1 * t_abs)
                    + 0.34 * math.sin(2.0 * math.pi * f_p2 * t_abs)
                    + 0.28 * triangle_wave(f_p3 * t_abs)
                )
                buf[i] += 0.38 * pad_env * pad_sig

    return buf


def generate_colosseum_battle() -> list[float]:
    """
    Track 3: Colosseum Battle (투기장 결투 / 전투 결전 테마)
    Key: D Minor Driving Tactical Theme (Dm - Bb - C - A)
    """
    step_sec = 0.22
    bass_notes = [
        'D2', 'D3', 'D2', 'A2',  'Bb1', 'Bb2', 'Bb1', 'F2',
        'C2', 'C3', 'C2', 'G2',  'A1',  'A2',  'A1',  'E2',
    ] * 2
    lead_notes = [
        'D4', 'F4', 'A4', 'D5',  'C5', 'Bb4', 'A4', 'F4',
        'G4', 'A4', 'C5', 'E5',  'D5', 'C#5', 'A4', 'E4',
        'D5', 'F5', 'A5', 'F5',  'D5', 'Bb4', 'F4', 'Bb4',
        'C5', 'G4', 'E5', 'C5',  'A4', 'C#5', 'E5', 'A5',
    ]
    total_steps = len(lead_notes)
    total_samples = int(total_steps * step_sec * SAMPLE_RATE)
    buf = [0.0] * total_samples

    for step_idx, lead_note in enumerate(lead_notes):
        t_start = step_idx * step_sec
        b_note = bass_notes[step_idx % len(bass_notes)]

        # Lead synth
        f_lead = note_freq(lead_note)
        l_dur = step_sec * 1.25
        s_idx = int(t_start * SAMPLE_RATE)
        e_idx = min(total_samples, int((t_start + l_dur) * SAMPLE_RATE))
        for i in range(s_idx, e_idx):
            t_local = (i - s_idx) / SAMPLE_RATE
            env = adsr_envelope(t_local, l_dur, attack=0.015, decay=0.09, sustain=0.50, release=0.10)
            buf[i] += 0.36 * env * soft_synth_voice(f_lead, i / SAMPLE_RATE, 0.30)

        # Driving bass pulse
        f_bass = note_freq(b_note)
        b_dur = step_sec * 0.92
        bs_idx = int(t_start * SAMPLE_RATE)
        be_idx = min(total_samples, int((t_start + b_dur) * SAMPLE_RATE))
        for i in range(bs_idx, be_idx):
            t_local = (i - bs_idx) / SAMPLE_RATE
            b_env = adsr_envelope(t_local, b_dur, attack=0.008, decay=0.08, sustain=0.40, release=0.06)
            buf[i] += 0.38 * b_env * soft_synth_voice(f_bass, i / SAMPLE_RATE, 0.35)

        # Synthesized war timpani kick on every 2nd step
        if step_idx % 2 == 0:
            k_dur = 0.14
            ks_idx = int(t_start * SAMPLE_RATE)
            ke_idx = min(total_samples, int((t_start + k_dur) * SAMPLE_RATE))
            for i in range(ks_idx, ke_idx):
                t_local = (i - ks_idx) / SAMPLE_RATE
                f_kick = 120.0 * math.exp(-16.0 * t_local) + 42.0
                k_env = math.exp(-18.0 * t_local)
                buf[i] += 0.32 * k_env * math.sin(2.0 * math.pi * f_kick * t_local)

    return buf


def generate_sanctuary_lobby() -> list[float]:
    """
    Track 4: Sanctuary of Kadan (영지 로비 테마)
    Key: E Minor / G Major Noble Sanctuary (Em - C - G - D)
    """
    step_sec = 0.30
    chords = [
        ('E3', 'G3', 'B3'), ('C3', 'E3', 'G3'), ('G2', 'D3', 'B3'), ('D3', 'F#3', 'A3'),
    ]
    melody = [
        'E4', 'G4', 'B4', 'E5',  'D5', 'B4', 'G4', 'B4',
        'C4', 'E4', 'G4', 'C5',  'B4', 'G4', 'E4', 'G4',
        'G4', 'B4', 'D5', 'G5',  'F#5', 'D5', 'B4', 'D5',
        'D4', 'F#4', 'A4', 'D5', 'F#5', 'D5', 'A4', 'F#4',
    ]
    total_steps = len(melody)
    total_samples = int(total_steps * step_sec * SAMPLE_RATE)
    buf = [0.0] * total_samples

    for step_idx, mel_note in enumerate(melody):
        t_start = step_idx * step_sec
        chord = chords[(step_idx // 8) % len(chords)]

        f_mel = note_freq(mel_note)
        note_dur = step_sec * 1.65
        s_idx = int(t_start * SAMPLE_RATE)
        e_idx = min(total_samples, int((t_start + note_dur) * SAMPLE_RATE))
        for i in range(s_idx, e_idx):
            t_local = (i - s_idx) / SAMPLE_RATE
            env = adsr_envelope(t_local, note_dur, attack=0.025, decay=0.14, sustain=0.45, release=0.20)
            buf[i] += 0.35 * env * soft_synth_voice(f_mel, i / SAMPLE_RATE, 0.25)

        if step_idx % 8 == 0:
            pad_dur = step_sec * 8.0
            p_start = int(t_start * SAMPLE_RATE)
            p_end = min(total_samples, int((t_start + pad_dur) * SAMPLE_RATE))
            f_p1 = note_freq(chord[0])
            f_p2 = note_freq(chord[1])
            f_p3 = note_freq(chord[2])
            for i in range(p_start, p_end):
                t_local = (i - p_start) / SAMPLE_RATE
                t_abs = i / SAMPLE_RATE
                pad_env = adsr_envelope(t_local, pad_dur, attack=0.30, decay=0.5, sustain=0.65, release=0.40)
                pad_sig = (
                    0.36 * soft_synth_voice(f_p1, t_abs, 0.12)
                    + 0.32 * soft_synth_voice(f_p2, t_abs, 0.12)
                    + 0.28 * soft_synth_voice(f_p3, t_abs, 0.12)
                )
                buf[i] += 0.40 * pad_env * pad_sig

    return buf


def main() -> None:
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    bgm_dir = os.path.join(root_dir, "public", "bgm")
    os.makedirs(bgm_dir, exist_ok=True)

    tracks = {
        "hero-awakening.mp3": generate_hero_awakening(),
        "whispering-wind.mp3": generate_whispering_wind(),
        "colosseum-battle.mp3": generate_colosseum_battle(),
        "sanctuary-lobby.mp3": generate_sanctuary_lobby(),
    }

    for filename, samples in tracks.items():
        out_path = os.path.join(bgm_dir, filename)
        render_track_to_mp3(samples, out_path)
        print(f"[BGM Generator] Generated {out_path} ({os.path.getsize(out_path)} bytes)")

    # Replace legacy /mixkit-games-worldbeat-466.mp3 with self-generated hero-awakening.mp3
    legacy_mp3 = os.path.join(root_dir, "public", "mixkit-games-worldbeat-466.mp3")
    shutil.copyfile(os.path.join(bgm_dir, "hero-awakening.mp3"), legacy_mp3)
    print(f"[BGM Generator] Updated {legacy_mp3} with self-generated Hero Awakening track.")


if __name__ == "__main__":
    main()
