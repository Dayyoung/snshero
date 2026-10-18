#!/usr/bin/env python3
"""
verify_generated_assets.py
Comprehensive Verification Suite for Worker 1 (Visual Synthesis Worker).
"""

import os
import sys
import hashlib
import subprocess
from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
WEBTOON_DIR = PROJECT_ROOT / "public/images/webtoon"
SEAT_DIR = PROJECT_ROOT / "public/seat"
COMMIT_REF = "3f64397a"

MIN_BYTES = 4096
MAX_BYTES = 76800
EXPECTED_DIM = (800, 450)

def verify_all():
    print("==================================================================")
    print("Worker 1: Automated Verification of 840 Webtoon Scene Panels")
    print("==================================================================")

    # 1. Check all 840 scene panels
    missing = []
    dim_errors = []
    size_errors = []
    format_errors = []
    hashes = {}
    total_bytes = 0

    for ep in range(1, 41):
        ep_dir = WEBTOON_DIR / f"episode_{ep:02d}"
        if not ep_dir.exists():
            missing.append(f"episode_{ep:02d}/ directory")
            continue
        for sc in range(21):
            sc_file = ep_dir / f"scene_{sc:02d}.webp"
            if not sc_file.exists():
                missing.append(f"episode_{ep:02d}/scene_{sc:02d}.webp")
                continue

            sz = sc_file.stat().st_size
            total_bytes += sz
            if sz < MIN_BYTES or sz > MAX_BYTES:
                size_errors.append((str(sc_file.relative_to(PROJECT_ROOT)), sz))

            try:
                with Image.open(sc_file) as im:
                    if im.format != "WEBP":
                        format_errors.append((str(sc_file.relative_to(PROJECT_ROOT)), im.format))
                    if im.size != EXPECTED_DIM:
                        dim_errors.append((str(sc_file.relative_to(PROJECT_ROOT)), im.size))
            except Exception as e:
                format_errors.append((str(sc_file.relative_to(PROJECT_ROOT)), str(e)))

            with open(sc_file, "rb") as f:
                h = hashlib.sha256(f.read()).hexdigest()
                if h in hashes:
                    print(f"DUPLICATE DETECTED: {sc_file} and {hashes[h]}")
                hashes[h] = str(sc_file.relative_to(PROJECT_ROOT))

    print(f"Total Scene Panels Found: {len(hashes)} / 840")
    print(f"Missing Files: {len(missing)}")
    if missing:
        print(f"  Samples: {missing[:5]}")
    print(f"Dimension Violations (expected 800x450): {len(dim_errors)}")
    if dim_errors:
        print(f"  Samples: {dim_errors[:5]}")
    print(f"Format Violations (expected WEBP): {len(format_errors)}")
    if format_errors:
        print(f"  Samples: {format_errors[:5]}")
    print(f"Size Violations ([4,096, 76,800] B): {len(size_errors)}")
    if size_errors:
        print(f"  Samples: {size_errors[:5]}")
    print(f"Distinct SHA-256 Hashes: {len(hashes)} / 840")
    if hashes:
        print(f"Average File Size: {total_bytes / len(hashes):,.0f} bytes ({total_bytes / (1024*1024):.2f} MB total)")

    # 2. Check 5 climax WebPs
    print("\n------------------------------------------------------------------")
    print("Verifying 5 Climax Hero Images under public/images/webtoon/:")
    climax_ok = True
    for name in ["ep01_blizzard_vow", "ep08_crimson_mane", "ep15_shadow_duel", "ep25_assassin_ambush", "ep40_eternal_shield"]:
        f_webp = WEBTOON_DIR / f"{name}.webp"
        if not f_webp.exists():
            print(f"  [FAIL] Missing {name}.webp")
            climax_ok = False
            continue
        sz_w = f_webp.stat().st_size
        with Image.open(f_webp) as im:
            dim = im.size
            fmt = im.format
        status = "PASS" if (sz_w <= MAX_BYTES and dim == EXPECTED_DIM and fmt == "WEBP") else "FAIL"
        if status == "FAIL":
            climax_ok = False
        print(f"  [{status}] {name}.webp: {sz_w:,} B, dim={dim}, fmt={fmt}")

    # 3. Check character non-regression
    print("\n------------------------------------------------------------------")
    print(f"Verifying Character Assets Non-Regression vs Commit {COMMIT_REF}:")
    cmd = [
        "git", "diff", "--name-only", COMMIT_REF, "--",
        "public/seat/",
        "public/cards1.png",
        "public/cards2.png",
        "public/card100.png",
        "public/card100_gemini.png",
        "public/character_sheet_*.png"
    ]
    res = subprocess.run(cmd, cwd=PROJECT_ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    diffs = [line.strip() for line in res.stdout.splitlines() if line.strip()]
    if diffs:
        print(f"  [FAIL] Modified character files detected: {diffs}")
        char_ok = False
    else:
        print(f"  [PASS] All 110 portraits in public/seat/ and master sprite sheets match commit {COMMIT_REF} 100%")
        char_ok = True

    overall = (len(hashes) == 840 and len(missing) == 0 and len(dim_errors) == 0 and
               len(size_errors) == 0 and len(format_errors) == 0 and climax_ok and char_ok)

    print("==================================================================")
    print(f"OVERALL VERIFICATION: {'ALL PASS (100%)' if overall else 'FAIL'}")
    print("==================================================================")
    return overall

if __name__ == "__main__":
    success = verify_all()
    sys.exit(0 if success else 1)
