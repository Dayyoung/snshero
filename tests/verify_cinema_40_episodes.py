#!/usr/bin/env python3
"""
tests/verify_cinema_40_episodes.py
SNSHero 40-Episode Live-Action Cinema Automated Quality & Conformance Test Harness

Validates:
1. MP4 container & stream specifications via ffprobe:
   - Video codec: h264
   - Dimensions: 800x450 (2.39:1 CinemaScope letterbox)
   - Frame rate: 24fps (24/1)
   - Audio codec: aac
   - Sample rate: 44,100 Hz stereo (2 channels)
   - Duration: >= 60.0 seconds
   - File size: > 3,000,000 bytes (3.0 MB)
2. 72 Sequential Acting WebP frames:
   - Directory: public/images/cinema/episode_XX_acting/
   - 72 files: seq_01_frame_01.webp .. seq_08_frame_09.webp
   - Exact dimensions: (800, 450)
   - File size budget: 4,096 bytes <= size <= 75,000 bytes
   - SHA-256 uniqueness: exactly 72 distinct hashes per episode (0 duplicate frames)
"""

import os
import sys
import json
import shutil
import hashlib
import argparse
import subprocess
from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[1]
CINEMA_VIDEO_DIR = PROJECT_ROOT / "public" / "videos" / "cinema"
CINEMA_IMAGE_DIR = PROJECT_ROOT / "public" / "images" / "cinema"

FFPROBE_BIN = shutil.which("ffprobe") or "/opt/homebrew/bin/ffprobe"


def probe_mp4(video_path: Path) -> dict:
    """Probes the MP4 file using ffprobe and returns stream and format metadata."""
    if not video_path.is_file():
        return {"error": f"File does not exist: {video_path}"}

    file_size = video_path.stat().st_size
    if file_size < 3_000_000:
        return {"error": f"File size too small: {file_size} bytes (< 3 MB)"}

    cmd = [
        FFPROBE_BIN,
        "-v", "error",
        "-show_entries", "stream=index,codec_name,codec_type,width,height,r_frame_rate,sample_rate,channels,duration",
        "-show_entries", "format=duration,size,bit_rate",
        "-of", "json",
        str(video_path),
    ]

    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=15)
        info = json.loads(res.stdout)
    except Exception as e:
        return {"error": f"ffprobe execution failed: {e}"}

    streams = info.get("streams", [])
    format_info = info.get("format", {})

    v_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
    a_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)

    if not v_stream:
        return {"error": "Missing video stream"}
    if not a_stream:
        return {"error": "Missing audio stream"}

    # Extract metrics
    v_codec = v_stream.get("codec_name")
    width = v_stream.get("width")
    height = v_stream.get("height")
    fps = v_stream.get("r_frame_rate")

    a_codec = a_stream.get("codec_name")
    sample_rate = int(a_stream.get("sample_rate", 0))
    channels = int(a_stream.get("channels", 0))

    duration_str = format_info.get("duration") or v_stream.get("duration") or "0"
    duration = float(duration_str)

    errors = []
    if v_codec != "h264":
        errors.append(f"Invalid video codec: {v_codec} (expected h264)")
    if width != 800 or height != 450:
        errors.append(f"Invalid dimensions: {width}x{height} (expected 800x450)")
    if fps not in ("24/1", "24"):
        errors.append(f"Invalid frame rate: {fps} (expected 24/1)")
    if a_codec != "aac":
        errors.append(f"Invalid audio codec: {a_codec} (expected aac)")
    if sample_rate != 44100:
        errors.append(f"Invalid audio sample rate: {sample_rate} (expected 44100)")
    if channels != 2:
        errors.append(f"Invalid audio channels: {channels} (expected 2)")
    if duration < 60.0:
        errors.append(f"Duration too short: {duration:.1f}s (expected >= 60.0s)")

    if errors:
        return {"error": "; ".join(errors)}

    return {
        "success": True,
        "size_bytes": file_size,
        "duration_sec": duration,
        "width": width,
        "height": height,
        "fps": fps,
        "v_codec": v_codec,
        "a_codec": a_codec,
        "sample_rate": sample_rate,
        "channels": channels,
    }


def verify_acting_frames(ep_num: int) -> dict:
    """Verifies that all 72 sequential WebP frames exist and are unique."""
    ep_dir = CINEMA_IMAGE_DIR / f"episode_{ep_num:02d}_acting"
    if not ep_dir.is_dir():
        return {"error": f"Frame directory does not exist: {ep_dir}"}

    hashes = set()
    frames_checked = 0
    errors = []

    for seq in range(1, 9):
        for frm in range(1, 10):
            fname = f"seq_{seq:02d}_frame_{frm:02d}.webp"
            fpath = ep_dir / fname
            if not fpath.is_file():
                errors.append(f"Missing frame: {fname}")
                continue

            data = fpath.read_bytes()
            size = len(data)
            if size < 4096:
                errors.append(f"Frame {fname} too small: {size} bytes (< 4 KB)")
            elif size > 75000:
                errors.append(f"Frame {fname} exceeds budget: {size} bytes (> 75 KB)")

            try:
                with Image.open(fpath) as img:
                    if img.size != (800, 450):
                        errors.append(f"Frame {fname} wrong size: {img.size} (expected 800x450)")
            except Exception as e:
                errors.append(f"Frame {fname} corrupted: {e}")

            h = hashlib.sha256(data).hexdigest()
            hashes.add(h)
            frames_checked += 1

    if frames_checked != 72:
        errors.append(f"Expected 72 frames, found {frames_checked}")
    if len(hashes) != 72:
        errors.append(f"Duplicate frame hashes detected: {len(hashes)} unique / 72 total")

    if errors:
        return {"error": "; ".join(errors[:5])}

    return {
        "success": True,
        "frames_count": frames_checked,
        "unique_hashes": len(hashes),
    }


def verify_episode(ep_num: int, verbose: bool = False) -> tuple[bool, str]:
    """Verifies both MP4 and WebP frames for a single episode."""
    mp4_path = CINEMA_VIDEO_DIR / f"episode_{ep_num:02d}.mp4"
    mp4_res = probe_mp4(mp4_path)
    frame_res = verify_acting_frames(ep_num)

    if not mp4_res.get("success"):
        return False, f"EP {ep_num:02d} MP4 FAIL: {mp4_res.get('error')}"

    if not frame_res.get("success"):
        return False, f"EP {ep_num:02d} FRAMES FAIL: {frame_res.get('error')}"

    sz_mb = mp4_res["size_bytes"] / (1024 * 1024)
    dur = mp4_res["duration_sec"]
    msg = (
        f"EP {ep_num:02d} PASS | MP4: {sz_mb:.2f}MB, {dur:.1f}s, 800x450, 24fps, "
        f"aac@44.1kHz | Frames: 72/72 distinct WebPs (100% unique hashes)"
    )
    return True, msg


def main():
    parser = argparse.ArgumentParser(description="Verify SNSHero 40-Episode Live-Action Cinema Assets")
    parser.add_argument("--episodes", type=str, help="Comma-separated episode list (e.g. 1,2,3)")
    parser.add_argument("--range", nargs=2, type=int, metavar=("START", "END"), help="Episode range (e.g. 1 40)")
    parser.add_argument("--all", action="store_true", help="Verify all 40 episodes")
    parser.add_argument("--verbose", action="store_true", help="Print verbose verification logs")
    args = parser.parse_args()

    episodes = []
    if args.episodes:
        for part in args.episodes.split(","):
            part = part.strip()
            if part:
                episodes.append(int(part))
    elif args.range:
        episodes = list(range(args.range[0], args.range[1] + 1))
    elif args.all:
        episodes = list(range(1, 41))
    else:
        # Default: verify episode 1
        episodes = [1]

    print(f"=== SNSHero Live-Action Cinema Verification ===")
    print(f"Episodes to verify: {episodes}")
    print("-" * 75)

    all_passed = True
    results = []

    for ep in episodes:
        passed, msg = verify_episode(ep, verbose=args.verbose)
        results.append((ep, passed, msg))
        if passed:
            print(f"[PASS] {msg}")
        else:
            print(f"[FAIL] {msg}")
            all_passed = False

    print("-" * 75)
    passed_count = sum(1 for _, p, _ in results if p)
    total_count = len(results)
    print(f"Summary: {passed_count}/{total_count} episodes passed.")

    if not all_passed:
        sys.exit(1)
    else:
        print("ALL VERIFICATION CHECKS PASSED.")
        sys.exit(0)


if __name__ == "__main__":
    main()
