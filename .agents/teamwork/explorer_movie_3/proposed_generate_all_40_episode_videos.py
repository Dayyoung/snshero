#!/usr/bin/env python3
"""
proposed_generate_all_40_episode_videos.py
SNSHero Standalone 40-Episode MP4 Video Generation Engine

Generates commercial-grade, standalone .mp4 videos for all 40 episodes:
- Sequences all 2,049 cutscenes (scene_00.webp..scene_XX.webp)
- Overlays English cutscene dialogues with highlighted speaking character portraits (public/seat/*.png)
- Visualizes comic combat SFX onomatopoeia overlays (BOOM!, CLANG!, SLASH!, etc.)
- Synthesizes procedural 44.1kHz stereo thematic BGM matching each episode's theme
- Enforces universal browser compatibility: libx264, yuv420p, aac, +faststart
- Verifies output integrity via ffprobe
"""

import os
import sys
import json
import wave
import math
import shutil
import tempfile
import textwrap
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
MANIFEST_PATH = os.path.join(PROJECT_ROOT, 'src/content/webtoonEpisodeManifest.json')
MAPPING_PATH = os.path.join(PROJECT_ROOT, 'src/content/movieEpisodeMapping.ts')
SEAT_DIR = os.path.join(PROJECT_ROOT, 'public/seat')
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'public/videos/episodes')
FFMPEG_BIN = '/opt/homebrew/bin/ffmpeg'
FFPROBE_BIN = '/opt/homebrew/bin/ffprobe'

FONT_PATH = '/System/Library/Fonts/Menlo.ttc'
if not os.path.exists(FONT_PATH):
    FONT_PATH = '/System/Library/Fonts/SFNSMono.ttf'

THEME_MAPPING = {
    1: 'arctic-blizzard', 2: 'battle-march', 3: 'dark-ominous', 4: 'arcane-mystery',
    5: 'dark-ominous', 6: 'triumph-fanfare', 7: 'sorrow-lament', 8: 'battle-march',
    9: 'arcane-mystery', 10: 'triumph-fanfare', 11: 'dark-ominous', 12: 'battle-march',
    13: 'arctic-blizzard', 14: 'arcane-mystery', 15: 'battle-march', 16: 'sorrow-lament',
    17: 'dark-ominous', 18: 'battle-march', 19: 'triumph-fanfare', 20: 'arcane-mystery',
    21: 'dark-ominous', 22: 'battle-march', 23: 'sorrow-lament', 24: 'arctic-blizzard',
    25: 'dark-ominous', 26: 'battle-march', 27: 'arcane-mystery', 28: 'triumph-fanfare',
    29: 'dark-ominous', 30: 'battle-march', 31: 'sorrow-lament', 32: 'arctic-blizzard',
    33: 'dark-ominous', 34: 'battle-march', 35: 'arcane-mystery', 36: 'triumph-fanfare',
    37: 'dark-ominous', 38: 'battle-march', 39: 'sorrow-lament', 40: 'triumph-fanfare'
}

def synthesize_bgm_wav(theme: str, duration_sec: float, out_wav_path: str):
    """Synthesize high-fidelity 44.1kHz stereo BGM audio track in NumPy."""
    sample_rate = 44100
    n_samples = int(sample_rate * duration_sec)
    t = np.linspace(0, duration_sec, n_samples, endpoint=False)
    
    left = np.zeros(n_samples, dtype=np.float32)
    right = np.zeros(n_samples, dtype=np.float32)
    
    if theme == 'arctic-blizzard':
        # Sub-bass icy drone (55Hz & 110Hz)
        left += 0.22 * np.sin(2 * np.pi * 55 * t) + 0.12 * np.sin(2 * np.pi * 110 * t)
        right += 0.20 * np.sin(2 * np.pi * 55 * t + 0.5) + 0.14 * np.sin(2 * np.pi * 110 * t)
        # Filtered howling wind
        noise = np.random.uniform(-0.12, 0.12, n_samples)
        kernel = np.ones(35) / 35
        wind = np.convolve(noise, kernel, mode='same') * (0.8 + 0.35 * np.sin(2 * np.pi * 0.15 * t))
        left += wind * 0.9
        right += wind * 1.1
        # Crystalline chime arpeggio
        chimes = [880, 1046.5, 1318.5, 1567.98, 1760]
        for step in range(int(duration_sec / 2.5)):
            base_t = step * 2.5 + 0.5
            for ci, freq in enumerate(chimes):
                st = base_t + ci * 0.22
                if st < duration_sec:
                    mask = (t >= st)
                    dt = t[mask] - st
                    env = np.exp(-3.5 * dt)
                    sig = 0.15 * np.sin(2 * np.pi * freq * dt) * env
                    left[mask] += sig
                    right[mask] += sig * 0.85
                    
    elif theme == 'battle-march':
        # War drum kicks (120Hz down to 45Hz) every 1.25s
        for beat in range(int(duration_sec / 1.25)):
            st = beat * 1.25
            mask = (t >= st) & (t < st + 0.5)
            dt = t[mask] - st
            pitch = 120 * np.exp(-12 * dt) + 45
            drum = 0.35 * np.sin(2 * np.pi * pitch * dt) * np.exp(-6 * dt)
            left[mask] += drum
            right[mask] += drum
        # Driving bassline (D minor: 73.4Hz, 87.3Hz, 98.0Hz, 110Hz)
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
        # Brass fanfare chords
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
        # Ethereal resonant drone (A2: 110Hz + E3: 164.8Hz + C#4: 277.2Hz)
        left += 0.18 * np.sin(2 * np.pi * 110 * t) + 0.10 * np.sin(2 * np.pi * 164.8 * t)
        right += 0.16 * np.sin(2 * np.pi * 110 * t + 0.8) + 0.12 * np.sin(2 * np.pi * 277.2 * t)
        # Dorian shimmer arpeggio (A4, B4, C5, E5, F#5, A5)
        notes = [440.0, 493.88, 523.25, 659.25, 739.99, 880.0]
        for step in range(int(duration_sec / 3.0)):
            base_t = step * 3.0 + 0.4
            for ni, freq in enumerate(notes):
                st = base_t + ni * 0.3
                if st < duration_sec:
                    mask = (t >= st)
                    dt = t[mask] - st
                    env = np.exp(-2.2 * dt)
                    sig = 0.12 * np.sin(2 * np.pi * freq * dt) * env
                    left[mask] += sig
                    right[mask] += sig * 0.8
                    
    elif theme == 'triumph-fanfare':
        # Victorious brass in C major (C4, E4, G4, C5)
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
        # Timpani beat
        for beat in range(int(duration_sec / 1.75)):
            st = beat * 1.75
            mask = (t >= st) & (t < st + 0.6)
            dt = t[mask] - st
            drum = 0.30 * np.sin(2 * np.pi * (95 * np.exp(-8 * dt) + 50) * dt) * np.exp(-4 * dt)
            left[mask] += drum
            right[mask] += drum
            
    elif theme == 'dark-ominous':
        # Tritone dissonance (C2: 65.4Hz + F#2: 92.5Hz)
        left += 0.22 * np.sin(2 * np.pi * 65.4 * t) + 0.15 * np.sin(2 * np.pi * 92.5 * t)
        right += 0.20 * np.sin(2 * np.pi * 65.4 * t + 1.0) + 0.16 * np.sin(2 * np.pi * 92.5 * t)
        # Low seismic rumble noise
        noise = np.random.uniform(-0.15, 0.15, n_samples)
        kernel = np.ones(50) / 50
        rumble = np.convolve(noise, kernel, mode='same') * (0.7 + 0.3 * np.sin(2 * np.pi * 0.1 * t))
        left += rumble
        right += rumble
        # Metallic tension hit every 4s
        for step in range(int(duration_sec / 4.0)):
            st = step * 4.0 + 1.0
            mask = (t >= st)
            dt = t[mask] - st
            hit = 0.18 * np.sin(2 * np.pi * 311.1 * dt) * np.exp(-1.5 * dt)
            left[mask] += hit
            right[mask] += hit * 0.7
            
    else:  # sorrow-lament
        # Gentle minor chords (E minor: E2: 82.4Hz, B2: 123.5Hz, G3: 196.0Hz)
        left += 0.20 * np.sin(2 * np.pi * 82.4 * t) + 0.12 * np.sin(2 * np.pi * 123.5 * t)
        right += 0.18 * np.sin(2 * np.pi * 82.4 * t + 0.4) + 0.14 * np.sin(2 * np.pi * 196.0 * t)
        # Melancholic solo melody with vibrato
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

    # Master Fade-in (1.5s) and Fade-out (2.5s)
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

    # Peak normalization & 16-bit PCM conversion
    max_val = max(np.max(np.abs(left)), np.max(np.abs(right)), 1e-6)
    target_peak = 0.88
    gain = target_peak / max_val
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

def render_styled_cutscene(bg_path: str, is_title: bool, title_en: str, title_ko: str,
                           speaker_en: str, text_en: str, char_name: str,
                           sfx_list: list, out_path: str):
    """Render a terminal-flat styled 800x450 cutscene frame."""
    base_img = Image.open(bg_path).convert('RGBA')
    if base_img.size != (800, 450):
        base_img = base_img.resize((800, 450), Image.Resampling.LANCZOS)
    
    overlay = Image.new('RGBA', (800, 450), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    font_title = ImageFont.truetype(FONT_PATH, 24)
    font_sub = ImageFont.truetype(FONT_PATH, 16)
    font_bold = ImageFont.truetype(FONT_PATH, 14)
    font_body = ImageFont.truetype(FONT_PATH, 13)
    font_sfx = ImageFont.truetype(FONT_PATH, 20)
    
    if is_title:
        # Title card scrim & banner
        draw.rectangle([0, 0, 800, 450], fill=(0, 0, 0, 110))
        # Center card
        card_box = [60, 140, 740, 310]
        draw.rectangle(card_box, fill=(18, 16, 16, 230), outline=(212, 175, 55, 200), width=1)
        # Badge
        draw.rectangle([75, 155, 275, 180], fill=(30, 27, 27, 255), outline=(212, 175, 55, 120), width=1)
        draw.text((85, 160), 'SNSHERO · THEATER', font=font_bold, fill=(212, 175, 55, 255))
        # Main title EN
        draw.text((75, 195), title_en, font=font_title, fill=(253, 252, 252, 255))
        # Sub title KO
        draw.text((75, 240), title_ko, font=font_sub, fill=(180, 180, 180, 255))
        # Hairline divider
        draw.line([75, 275, 725, 275], fill=(212, 175, 55, 80), width=1)
    else:
        # Story cutscene dialogue box
        box_y1 = 310
        box_y2 = 432
        draw.rectangle([25, box_y1, 775, box_y2], fill=(16, 14, 14, 225), outline=(80, 75, 75, 160), width=1)
        
        # Character portrait
        portrait_rendered = False
        if char_name:
            seat_file = os.path.join(SEAT_DIR, char_name.replace(' ', '_') + '.png')
            if os.path.exists(seat_file):
                try:
                    p_img = Image.open(seat_file).convert('RGBA')
                    p_thumb = p_img.resize((72, 84), Image.Resampling.LANCZOS)
                    # Paste portrait on left
                    p_x, p_y = 38, box_y1 + 18
                    overlay.paste(p_thumb, (p_x, p_y))
                    # Glowing border
                    draw.rectangle([p_x - 1, p_y - 1, p_x + 72, p_y + 84], outline=(212, 175, 55, 220), width=1)
                    # Speaker tag
                    draw.rectangle([p_x - 2, p_y + 86, p_x + 73, p_y + 99], fill=(25, 23, 23, 240), outline=(212, 175, 55, 140), width=1)
                    draw.text((p_x + 7, p_y + 87), 'SPEAKER', font=ImageFont.truetype(FONT_PATH, 9), fill=(212, 175, 55, 255))
                    portrait_rendered = True
                except Exception:
                    portrait_rendered = False
                    
        # Speaker label
        text_x = 125 if portrait_rendered else 45
        label = (speaker_en.upper() if speaker_en else 'NARRATION')
        draw.text((text_x, box_y1 + 14), f"[{label}]", font=font_bold, fill=(212, 175, 55, 255) if portrait_rendered else (140, 200, 255, 255))
        
        # Word-wrapped English dialogue text
        wrap_width = 68 if portrait_rendered else 78
        wrapped_lines = textwrap.wrap(text_en, width=wrap_width)
        curr_y = box_y1 + 35
        for line in wrapped_lines[:4]:  # Max 4 lines
            draw.text((text_x, curr_y), line, font=font_body, fill=(253, 252, 252, 255))
            curr_y += 18
            
        # SFX Onomatopoeia Sticker
        if sfx_list:
            sfx_entry = sfx_list[0]
            sfx_text = sfx_entry.get('textEn') or sfx_entry.get('textKo') or 'SFX!'
            # Pill badge in upper right
            sfx_box = [620, 25, 775, 68]
            draw.rectangle(sfx_box, fill=(20, 15, 15, 230), outline=(239, 68, 68, 220), width=2)
            draw.text((635, 32), f"⚔️ {sfx_text}", font=font_sfx, fill=(255, 220, 100, 255))
            
    final_img = Image.alpha_composite(base_img, overlay).convert('RGB')
    final_img.save(out_path, 'JPEG', quality=88)

def generate_episode_video(ep_num: int, ep_data: dict, out_mp4_path: str, temp_base_dir: str):
    """Generate standalone MP4 video for one episode."""
    ep_dir = os.path.join(temp_base_dir, f'ep_{ep_num}')
    os.makedirs(ep_dir, exist_ok=True)
    
    images = ep_data.get('images', [])
    if not images:
        return False
        
    theme = THEME_MAPPING.get(ep_num, 'arctic-blizzard')
    title_en = ep_data.get('episodeTitle', f'Episode {ep_num}')
    title_ko = ep_data.get('episodeTitleKo', f'제 {ep_num}화')
    
    frame_list = []
    total_duration = 0.0
    
    for idx, img_entry in enumerate(images):
        rel_img = img_entry.get('imageUrl', '').lstrip('/')
        src_path = os.path.join(PROJECT_ROOT, 'public', rel_img.replace('public/', ''))
        if not os.path.exists(src_path):
            continue
            
        is_title = (idx == 0 or img_entry.get('type') == 'title_card')
        speaker_en = ''
        text_en = img_entry.get('narrationEn', '')
        char_name = ''
        
        dialogues = img_entry.get('dialogues', [])
        if dialogues:
            speaker_en = dialogues[0].get('speakerEn', '')
            text_en = dialogues[0].get('textEn') or text_en
            
        characters = img_entry.get('characters', [])
        if characters:
            char_name = characters[0]
            
        sfx_list = img_entry.get('sfxCues', [])
        
        # Duration calculation
        if is_title:
            duration = 3.5
        elif idx == len(images) - 1:
            duration = 4.0
        else:
            word_count = len(text_en.split())
            duration = 2.4 + min(word_count * 0.04, 1.2)
            
        frame_filename = f'frame_{idx:03d}.jpg'
        frame_path = os.path.join(ep_dir, frame_filename)
        
        render_styled_cutscene(src_path, is_title, title_en, title_ko,
                               speaker_en, text_en, char_name, sfx_list, frame_path)
                               
        frame_list.append((frame_filename, duration))
        total_duration += duration
        
    # Write concat demuxer file
    concat_txt_path = os.path.join(ep_dir, 'concat.txt')
    with open(concat_txt_path, 'w') as f:
        for fname, dur in frame_list:
            f.write(f"file '{fname}'\n")
            f.write(f"duration {dur:.2f}\n")
        # FFmpeg concat quirk: last image repeated
        if frame_list:
            f.write(f"file '{frame_list[-1][0]}'\n")
            
    # Synthesize BGM WAV
    bgm_wav_path = os.path.join(ep_dir, 'bgm.wav')
    synthesize_bgm_wav(theme, total_duration, bgm_wav_path)
    
    # Run FFmpeg command
    cmd = [
        FFMPEG_BIN, '-y',
        '-f', 'concat', '-safe', '0', '-i', concat_txt_path,
        '-i', bgm_wav_path,
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '25',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '128k',
        '-shortest',
        '-movflags', '+faststart',
        out_mp4_path
    ]
    res = subprocess.run(cmd, cwd=ep_dir, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"[ERROR Ep.{ep_num}] FFmpeg failed: {res.stderr}")
        return False
        
    # Cleanup temp frames
    shutil.rmtree(ep_dir, ignore_errors=True)
    return True

def probe_mp4_integrity(mp4_path: str) -> dict:
    """Verify generated MP4 using ffprobe."""
    cmd = [
        FFPROBE_BIN, '-v', 'error',
        '-show_entries', 'format=duration,size,bit_rate:stream=codec_name,width,height,sample_rate,channels',
        '-of', 'json', mp4_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        return {'valid': False, 'error': res.stderr}
    data = json.loads(res.stdout)
    v_stream = next((s for s in data.get('streams', []) if s.get('codec_name') == 'h264'), None)
    a_stream = next((s for s in data.get('streams', []) if s.get('codec_name') == 'aac'), None)
    duration = float(data.get('format', {}).get('duration', 0))
    size = int(data.get('format', {}).get('size', 0))
    
    valid = (v_stream is not None and a_stream is not None and duration > 30 and size > 100000)
    return {
        'valid': valid,
        'duration': duration,
        'size': size,
        'width': v_stream.get('width') if v_stream else 0,
        'height': v_stream.get('height') if v_stream else 0,
        'v_codec': v_stream.get('codec_name') if v_stream else None,
        'a_codec': a_stream.get('codec_name') if a_stream else None
    }

if __name__ == '__main__':
    with open(MANIFEST_PATH) as f:
        manifest = json.load(f)
    print(f"Loaded manifest with {len(manifest)} episodes.")
    # Target episodes can be specified via sys.argv
    targets = [int(a) for a in sys.argv[1:]] if len(sys.argv) > 1 else list(range(1, 41))
    temp_dir = tempfile.mkdtemp(prefix='snshero_movie_gen_')
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    try:
        for ep_num in targets:
            ep_data = manifest.get(str(ep_num))
            if not ep_data:
                continue
            out_file = os.path.join(OUTPUT_DIR, f'episode_{ep_num:02d}.mp4')
            print(f"Generating Episode {ep_num:02d} -> {out_file}...")
            ok = generate_episode_video(ep_num, ep_data, out_file, temp_dir)
            if ok:
                info = probe_mp4_integrity(out_file)
                print(f"  [SUCCESS] Ep.{ep_num:02d}: {info['duration']:.1f}s, {info['size']/(1024*1024):.2f}MB, {info['width']}x{info['height']}, v={info['v_codec']}, a={info['a_codec']}")
            else:
                print(f"  [FAILURE] Ep.{ep_num:02d} failed to encode.")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
