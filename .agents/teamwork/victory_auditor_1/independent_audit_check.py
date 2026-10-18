#!/usr/bin/env python3
import json
import os
import sys
import hashlib
import struct
import subprocess
from pathlib import Path

ROOT = Path('/Users/dayyoung/project/snshero')
VIDEOS_DIR = ROOT / 'public' / 'videos' / 'episodes'
MANIFEST_PATH = ROOT / 'src' / 'content' / 'webtoonEpisodeManifest.json'
MAPPING_PATH = ROOT / 'src' / 'content' / 'movieEpisodeMapping.ts'
PLAYER_PATH = ROOT / 'src' / 'components' / 'movie' / 'CinematicMoviePlayer.tsx'
VIEW_PATH = ROOT / 'src' / 'views' / 'MovieView.tsx'

def check_mp4_faststart(filepath):
    with open(filepath, 'rb') as f:
        atoms = []
        offset = 0
        file_size = filepath.stat().st_size
        while offset < file_size:
            header = f.read(8)
            if len(header) < 8:
                break
            size, atom_type = struct.unpack('>I4s', header)
            name = atom_type.decode('latin1', errors='replace')
            atoms.append((name, offset))
            if size == 1:
                s64 = f.read(8)
                if len(s64) < 8: break
                size = struct.unpack('>Q', s64)[0]
                offset += size
                f.seek(offset)
            elif size == 0:
                break
            else:
                offset += size
                f.seek(offset)
    moov_idx = next((i for i, (n, _) in enumerate(atoms) if n == 'moov'), None)
    mdat_idx = next((i for i, (n, _) in enumerate(atoms) if n == 'mdat'), None)
    return moov_idx is not None and mdat_idx is not None and moov_idx < mdat_idx

def main():
    print("=== VICTORY AUDITOR INDEPENDENT VERIFICATION ===")
    results = {}

    # 1. 40 Standalone MP4 video files
    mp4_results = []
    hashes = set()
    total_size = 0

    for ep in range(1, 41):
        filename = f"episode_{ep:02d}.mp4"
        filepath = VIDEOS_DIR / filename
        if not filepath.exists():
            mp4_results.append((ep, False, "Missing file"))
            continue
        size = filepath.stat().st_size
        total_size += size
        if size < 1_000_000: # < 1MB
            mp4_results.append((ep, False, f"File too small: {size} bytes"))
            continue
        if size > 25_000_000: # > 25MB
            mp4_results.append((ep, False, f"File too large: {size} bytes"))
            continue

        # Hash check
        h = hashlib.sha256(filepath.read_bytes()[:1048576]).hexdigest()
        if h in hashes:
            mp4_results.append((ep, False, "Duplicate hash detected"))
            continue
        hashes.add(h)

        # Faststart check
        fs = check_mp4_faststart(filepath)
        if not fs:
            mp4_results.append((ep, False, "Faststart (moov before mdat) failed"))
            continue

        # ffprobe
        cmd = [
            'ffprobe', '-v', 'error',
            '-show_entries', 'stream=codec_type,codec_name,width,height,channels,sample_rate',
            '-show_entries', 'format=duration,format_name',
            '-of', 'json', str(filepath)
        ]
        probe = subprocess.run(cmd, capture_output=True, text=True)
        if probe.returncode != 0:
            mp4_results.append((ep, False, f"ffprobe error: {probe.stderr}"))
            continue
        info = json.loads(probe.stdout)
        streams = info.get('streams', [])
        fmt = info.get('format', {})
        dur = float(fmt.get('duration', 0))
        
        v_stream = next((s for s in streams if s.get('codec_type') == 'video'), None)
        a_stream = next((s for s in streams if s.get('codec_type') == 'audio'), None)

        if not v_stream or v_stream.get('codec_name') != 'h264':
            mp4_results.append((ep, False, f"Invalid video stream: {v_stream}"))
            continue
        if not a_stream or a_stream.get('codec_name') != 'aac':
            mp4_results.append((ep, False, f"Invalid audio stream: {a_stream}"))
            continue
        if dur <= 10.0:
            mp4_results.append((ep, False, f"Duration too short: {dur}s"))
            continue
        
        mp4_results.append((ep, True, f"OK ({size/1024/1024:.2f}MB, {dur:.1f}s, {v_stream['width']}x{v_stream['height']})"))

    all_mp4_ok = all(r[1] for r in mp4_results)
    results['mp4_videos'] = {
        'count': len(mp4_results),
        'passed': sum(1 for r in mp4_results if r[1]),
        'total_size_mb': round(total_size / 1024 / 1024, 2),
        'all_ok': all_mp4_ok,
    }
    print(f"1. MP4 Videos: {results['mp4_videos']['passed']}/40 passed, Total: {results['mp4_videos']['total_size_mb']}MB")

    # 2. Cutscenes in webtoonEpisodeManifest.json
    with open(MANIFEST_PATH, 'r') as f:
        manifest = json.load(f)
    ep_count = len(manifest)
    total_cutscenes = sum(len(ep['images']) for ep in manifest.values())
    all_scenes_exist = True
    missing_scenes = []
    for ep_id, ep_data in manifest.items():
        for img in ep_data['images']:
            url = img.get('localArtUrl') or img.get('imageUrl')
            if url and url.startswith('/'):
                p = ROOT / 'public' / url.lstrip('/')
                if not p.exists():
                    missing_scenes.append(str(p))
                    all_scenes_exist = False
    
    results['cutscenes'] = {
        'ep_count': ep_count,
        'total_cutscenes': total_cutscenes,
        'all_scenes_exist': all_scenes_exist,
        'missing_count': len(missing_scenes)
    }
    print(f"2. Cutscenes: {ep_count} episodes, {total_cutscenes} cutscenes, missing files: {len(missing_scenes)}")

    # 3. Source code features
    player_src = PLAYER_PATH.read_text()
    view_src = VIEW_PATH.read_text()
    mapping_src = MAPPING_PATH.read_text()

    # Check continuous BGM
    has_continuous_bgm = 'startEpisodeBgm' in player_src and 'stopEpisodeBgm' in player_src
    # Check English TTS
    has_english_tts = 'speakEnglishNarration' in player_src and 'en-US' in player_src or 'en-GB' in player_src or 'speakEnglishNarration' in player_src
    # Check speaking character highlight
    has_speaker_highlight = 'ring-amber-400' in player_src and 'getCharacterPortraitUrl' in player_src and 'grayscale' in player_src
    # Check SFX cues
    has_sfx_cues = 'sfxCues' in player_src and 'CinematicSfxCue' in player_src
    # Check Subtitles & CC toggle
    has_subtitles = 'isCcEnabled' in player_src and 'handleToggleCc' in player_src and 'CC' in player_src
    # Check MP4 video mode and download
    has_mp4_mode = 'video' in view_src and 'episode_' in view_src and 'SNSHero_Episode_' in view_src
    # Check 40 episodes in mapping
    episodes_in_mapping = mapping_src.count('titleKo:')
    
    results['code_features'] = {
        'has_continuous_bgm': has_continuous_bgm,
        'has_english_tts': has_english_tts,
        'has_speaker_highlight': has_speaker_highlight,
        'has_sfx_cues': has_sfx_cues,
        'has_subtitles': has_subtitles,
        'has_mp4_mode': has_mp4_mode,
        'episodes_in_mapping': episodes_in_mapping
    }
    print(f"3. Code Features: {results['code_features']}")

    # 4. Git status check
    git_head = subprocess.run(['git', 'rev-parse', 'HEAD'], capture_output=True, text=True).stdout.strip()
    git_origin = subprocess.run(['git', 'rev-parse', 'origin/main'], capture_output=True, text=True).stdout.strip()
    ahead = subprocess.run(['git', 'rev-list', '--count', 'origin/main..HEAD'], capture_output=True, text=True).stdout.strip()
    results['git'] = {
        'head': git_head[:8],
        'origin': git_origin[:8],
        'ahead_commits': int(ahead),
        'pushed_to_remote': (git_head == git_origin)
    }
    print(f"4. Git: HEAD {results['git']['head']} is {ahead} commits ahead of origin/main. Pushed: {results['git']['pushed_to_remote']}")

    # Output full json
    out_path = Path('/Users/dayyoung/project/snshero/.agents/teamwork/victory_auditor_1/independent_audit_results.json')
    out_path.write_text(json.dumps(results, indent=2))
    print("Verification completed successfully!")

if __name__ == '__main__':
    main()
