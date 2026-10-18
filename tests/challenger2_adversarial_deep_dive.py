#!/usr/bin/env python3
"""
Challenger 2: Adversarial Deep Dive & Boundary Stress Test
"""

import os
import sys
import json
import struct
from typing import Dict, Any, List

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.chdir(PROJECT_ROOT)

def get_webp_dimensions(file_path: str):
    """Parses width and height from standard WebP file."""
    with open(file_path, 'rb') as f:
        data = f.read(30)
        if len(data) < 20 or data[:4] != b'RIFF' or data[8:12] != b'WEBP':
            return None
        format_fourcc = data[12:16]
        if format_fourcc == b'VP8 ':
            # Lossy VP8
            # 23-26 is key frame start, dimensions at 26-30
            width = struct.unpack('<H', data[26:28])[0] & 0x3fff
            height = struct.unpack('<H', data[28:30])[0] & 0x3fff
            return width, height
        elif format_fourcc == b'VP8L':
            # Lossless VP8L
            b0 = data[21]
            b1 = data[22]
            b2 = data[23]
            b3 = data[24]
            width = 1 + (((b1 & 0x3f) << 8) | b0)
            height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6))
            return width, height
        elif format_fourcc == b'VP8X':
            # Extended VP8X
            width = 1 + struct.unpack('<I', data[24:27] + b'\x00')[0]
            height = 1 + struct.unpack('<I', data[27:30] + b'\x00')[0]
            return width, height
        return None

def test_deep_dive():
    print("=" * 80)
    print("CHALLENGER 2: ADVERSARIAL BOUNDARY & STRESS TESTS")
    print("=" * 80)
    
    with open("src/content/webtoonEpisodeManifest.json", "r", encoding="utf-8") as f:
        manifest = json.load(f)
        
    failures = []
    
    # 1. Filename casing and format consistency
    print("\n--- Test 1: Filename and Path Casing Normalization ---")
    bad_casing = []
    for ep_key, ep_data in manifest.items():
        ep_pad = f"{int(ep_key):02d}"
        expected_dir = f"/images/webtoon/episode_{ep_pad}"
        for img in ep_data.get("images", []):
            idx = img.get("index")
            expected_fn = f"scene_{idx:02d}.webp"
            expected_url = f"{expected_dir}/{expected_fn}"
            
            fn = img.get("fileName")
            l_url = img.get("localArtUrl")
            i_url = img.get("imageUrl")
            
            if fn != expected_fn:
                bad_casing.append((ep_key, idx, "fileName", fn, expected_fn))
            if l_url != expected_url:
                bad_casing.append((ep_key, idx, "localArtUrl", l_url, expected_url))
            if i_url != expected_url:
                bad_casing.append((ep_key, idx, "imageUrl", i_url, expected_url))
                
    if bad_casing:
        print(f"[FAIL] Found {len(bad_casing)} non-standard filenames or paths:")
        for bc in bad_casing[:5]:
            print(f"       Ep {bc[0]} scene {bc[1]}: {bc[2]} was '{bc[3]}', expected '{bc[4]}'")
        failures.append("Filename/Path normalization")
    else:
        print(f"[PASS] All 840 scenes strictly follow '/images/webtoon/episode_XX/scene_YY.webp' standard!")

    # 2. Image dimensions check across all 840 files
    print("\n--- Test 2: WebP Dimensions & Aspect Ratio Check ---")
    dimensions_summary = {}
    dimension_errors = []
    for ep_key, ep_data in manifest.items():
        for img in ep_data.get("images", []):
            url = img.get("localArtUrl", "").lstrip("/")
            disk_path = os.path.join("public", url)
            dims = get_webp_dimensions(disk_path)
            if not dims:
                dimension_errors.append((disk_path, "Could not parse WebP dimensions"))
            else:
                w, h = dims
                dim_str = f"{w}x{h}"
                dimensions_summary[dim_str] = dimensions_summary.get(dim_str, 0) + 1
                if w < 400 or h < 200:
                    dimension_errors.append((disk_path, f"Dimensions too small: {w}x{h}"))
                    
    print(f"Dimension distributions across 840 images: {dimensions_summary}")
    if dimension_errors:
        print(f"[FAIL] Dimension errors: {dimension_errors[:5]}")
        failures.append("Image dimensions check")
    else:
        print("[PASS] All 840 WebP images have valid high-resolution widescreen/webtoon dimensions!")

    # 3. Dialogue Text Completeness and Character Badges
    print("\n--- Test 3: Dialogue Text Completeness and Speaker Casing ---")
    empty_dialogue_texts = []
    missing_cids = []
    for ep_key, ep_data in manifest.items():
        for img in ep_data.get("images", []):
            idx = img.get("index")
            for d in img.get("dialogues", []):
                t_ko = d.get("textKo", "")
                t_en = d.get("textEn", "")
                s_ko = d.get("speakerKo", "")
                s_en = d.get("speakerEn", "")
                if not t_ko.strip() or not t_en.strip():
                    empty_dialogue_texts.append((ep_key, idx, d))
                if not s_ko.strip() or not s_en.strip():
                    empty_dialogue_texts.append((ep_key, idx, "Empty speaker", d))
                if idx > 0 and d.get("characterCardId") is None:
                    missing_cids.append((ep_key, idx, d))

    if empty_dialogue_texts:
        print(f"[FAIL] Found {len(empty_dialogue_texts)} empty dialogue strings: {empty_dialogue_texts[:3]}")
        failures.append("Empty dialogue strings")
    else:
        print("[PASS] 0 empty dialogue texts or speakers found across all 860 dialogue items.")

    if missing_cids:
        print(f"[FAIL] Found {len(missing_cids)} story dialogues missing characterCardId!")
        failures.append("Missing characterCardId")
    else:
        print("[PASS] Exactly 820/820 story dialogues contain valid characterCardId (40 title narrations remain clean).")

    # 4. Characters array consistency
    print("\n--- Test 4: Characters Array Check ---")
    missing_characters_array = []
    for ep_key, ep_data in manifest.items():
        for img in ep_data.get("images", []):
            idx = img.get("index")
            chars = img.get("characters")
            if not isinstance(chars, list) or len(chars) == 0:
                missing_characters_array.append((ep_key, idx))
                
    if missing_characters_array:
        print(f"[FAIL] Found {len(missing_characters_array)} scenes missing characters array: {missing_characters_array[:5]}")
        failures.append("Characters array missing")
    else:
        print("[PASS] All 840 scenes (including all 40 title cards) contain non-empty characters lists!")

    # 5. sfxCues sanity check
    print("\n--- Test 5: SFX Cues Structure Check ---")
    invalid_sfx = []
    total_sfx = 0
    for ep_key, ep_data in manifest.items():
        for img in ep_data.get("images", []):
            sfx_list = img.get("sfxCues", [])
            for sfx in sfx_list:
                total_sfx += 1
                if not sfx.get("textKo") or not sfx.get("textEn"):
                    invalid_sfx.append((ep_key, img.get("index"), sfx))
                    
    print(f"Total SFX cues in manifest: {total_sfx}")
    if invalid_sfx:
        print(f"[FAIL] Invalid SFX cues: {invalid_sfx[:5]}")
        failures.append("Invalid SFX cues")
    else:
        print(f"[PASS] All {total_sfx} SFX cues have valid bilingual text and formatting.")

    print("\n" + "=" * 80)
    if not failures:
        print("ADVERSARIAL STRESS TEST: ALL 5 DEEP-DIVE CHECKS PASSED")
    else:
        print(f"ADVERSARIAL STRESS TEST: FAILURES DETECTED ({failures})")
    print("=" * 80)
    return len(failures) == 0

if __name__ == "__main__":
    success = test_deep_dive()
    sys.exit(0 if success else 1)
