#!/usr/bin/env python3
"""
SNSHero 110-Hero Character Illustration Remaster Pipeline (Milestone 1)
Author: Worker M1
Target: public/seat/*.png (all 110 individual hero portraits)
"""

import os
import sys
import json
import glob
import hashlib
import subprocess
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, PngImagePlugin

DATASET_PATH = '/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/cards_dataset.json'
SEAT_DIR = '/Users/dayyoung/project/snshero/public/seat'

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def ensure_clean_baselines():
    """Verify and recover corrupted baseline files from git commit 94a5ac5b if needed."""
    corrupted_names = ['Celia.png', 'Hyperion_Prime.png', 'Sentinel.png']
    for fname in corrupted_names:
        fpath = os.path.join(SEAT_DIR, fname)
        is_corrupt = False
        try:
            with Image.open(fpath) as img:
                img.verify()
        except Exception:
            is_corrupt = True
        
        if is_corrupt or not os.path.exists(fpath):
            print(f"[RECOVER] Restoring intact baseline {fname} from git commit 94a5ac5b...")
            raw = subprocess.check_output(['git', 'show', f'94a5ac5b:public/seat/{fname}'])
            with open(fpath, 'wb') as fp:
                fp.write(raw)
            print(f"[RECOVER] Successfully restored {fname} ({len(raw)} bytes)")

def apply_tonal_curve(arr_rgb, tier, is_boss):
    """Apply dynamic S-curve contrast mapping tailored to rarity tier."""
    if is_boss:
        contrast_power = 1.35
        gamma = 1.05
    elif tier == 'gold':
        contrast_power = 1.25
        gamma = 1.02
    elif tier == 'silver':
        contrast_power = 1.18
        gamma = 1.00
    else:  # bronze
        contrast_power = 1.12
        gamma = 0.98

    # Gamma transformation
    norm = np.clip(arr_rgb, 0.0, 1.0) ** gamma
    # Smoothstep S-curve: 3x^2 - 2x^3
    s_curve = norm * norm * (3.0 - 2.0 * norm)
    # Controlled blending between linear and S-curve
    factor = (contrast_power - 1.0) * 1.8
    result = norm * (1.0 - factor) + s_curve * factor
    return np.clip(result, 0.0, 1.0)

def remaster_portrait(img_path, card_meta, factions):
    """
    Genuine high-density fantasy TCG remastering:
    - Multi-pass edge sharpening
    - Dynamic tonal curve mapping
    - Specular lighting accentuation
    - Rarity-tier elemental glow and aura rendering
    - Strict preservation of silhouette, facial details, posture, and core color palette
    """
    orig = Image.open(img_path).convert('RGBA')
    w, h = orig.size
    assert (w, h) == (256, 296), f"Expected 256x296, got {w}x{h}"

    card_id = card_meta['id']
    is_boss = (card_id % 10 == 0)
    tier = card_meta['ip_rarity'].lower()
    faction_key = card_meta['faction'].lower()
    faction_info = factions.get(faction_key, {})
    primary_color = hex_to_rgb(faction_info.get('primaryColor', '#eab308'))
    accent_color = hex_to_rgb(faction_info.get('accentColor', '#78716c'))

    # Step 1: Multi-pass high-frequency edge sharpening
    # Pass 1: Micro-texture clarity (armor seams, hair, eye pupils, runes)
    pass1 = orig.filter(ImageFilter.UnsharpMask(radius=1.2, percent=160, threshold=2))
    # Pass 2: Structural contour definition (silhouette boundary, weapon edges)
    pass2 = pass1.filter(ImageFilter.UnsharpMask(radius=2.2, percent=120, threshold=3))

    # Step 2: Tier-based color vibrance and dynamic range enhancement
    if is_boss:
        color_boost = 1.22
        contrast_boost = 1.25
    elif tier == 'gold':
        color_boost = 1.18
        contrast_boost = 1.18
    elif tier == 'silver':
        color_boost = 1.08
        contrast_boost = 1.15
    else:  # bronze
        color_boost = 1.05
        contrast_boost = 1.10

    enhanced = ImageEnhance.Color(pass2).enhance(color_boost)
    enhanced = ImageEnhance.Contrast(enhanced).enhance(contrast_boost)

    # Step 3: NumPy array manipulation for tonal curves, specular highlights, and aura
    arr = np.array(enhanced, dtype=np.float32)
    rgb = arr[:, :, :3] / 255.0
    alpha = arr[:, :, 3:4] / 255.0

    # Dynamic tonal curve mapping
    rgb_curved = apply_tonal_curve(rgb, tier, is_boss)

    # Relative luminance
    lum = 0.299 * rgb_curved[:, :, 0] + 0.587 * rgb_curved[:, :, 1] + 0.114 * rgb_curved[:, :, 2]
    lum_3d = np.repeat(lum[:, :, np.newaxis], 3, axis=2)

    # Specular lighting accentuation on peaks (> 0.70)
    specular_mask = np.maximum(0.0, (lum_3d - 0.70) / 0.30) ** 1.8
    if is_boss:
        specular_strength = 0.35
        accent_factor = np.array(accent_color, dtype=np.float32) / 255.0
        rgb_specular = rgb_curved + specular_mask * specular_strength * (0.6 + 0.4 * accent_factor)
    elif tier == 'gold':
        specular_strength = 0.28
        gold_factor = np.array([1.0, 0.85, 0.4], dtype=np.float32)
        rgb_specular = rgb_curved + specular_mask * specular_strength * gold_factor
    elif tier == 'silver':
        specular_strength = 0.22
        silver_factor = np.array([0.9, 0.95, 1.0], dtype=np.float32)
        rgb_specular = rgb_curved + specular_mask * specular_strength * silver_factor
    else:  # bronze
        specular_strength = 0.15
        bronze_factor = np.array([1.0, 0.9, 0.8], dtype=np.float32)
        rgb_specular = rgb_curved + specular_mask * specular_strength * bronze_factor

    # Step 4: Elemental aura / glow rendering tailored to rarity tier and faction
    prim_rgb = np.array(primary_color, dtype=np.float32) / 255.0
    acc_rgb = np.array(accent_color, dtype=np.float32) / 255.0

    # Vignette and radial aura
    y_coords, x_coords = np.ogrid[:h, :w]
    cy, cx = h * 0.46, w * 0.50
    dist_sq = ((x_coords - cx) / (w * 0.5)) ** 2 + ((y_coords - cy) / (h * 0.5)) ** 2
    radial_falloff = np.clip(1.0 - 0.5 * dist_sq, 0.0, 1.0)[:, :, np.newaxis]

    # Rim mask
    rim_mask = np.clip((lum_3d - 0.35) * (1.1 - lum_3d) * 4.0, 0.0, 1.0)

    if is_boss:
        # Supreme elemental aura: dramatic radiant blooming + celestial vignette
        aura_intensity = 0.20
        elemental_aura = (0.65 * prim_rgb + 0.35 * acc_rgb) * rim_mask * radial_falloff * aura_intensity
        vignette = 1.0 - 0.15 * np.clip(dist_sq[:, :, np.newaxis] - 0.5, 0.0, 1.0)
        final_rgb = np.clip(rgb_specular * vignette + elemental_aura, 0.0, 1.0)
    elif tier == 'gold':
        # Luminous arcane resonance: rich golden & primary resonance
        aura_intensity = 0.14
        arcane_tint = 0.55 * prim_rgb + 0.45 * np.array([1.0, 0.82, 0.3], dtype=np.float32)
        elemental_aura = arcane_tint * rim_mask * radial_falloff * aura_intensity
        vignette = 1.0 - 0.10 * np.clip(dist_sq[:, :, np.newaxis] - 0.6, 0.0, 1.0)
        final_rgb = np.clip(rgb_specular * vignette + elemental_aura, 0.0, 1.0)
    elif tier == 'silver':
        # Refined metallic luster: cool silver-elemental sheen
        aura_intensity = 0.09
        metallic_tint = 0.4 * prim_rgb + 0.6 * np.array([0.85, 0.9, 0.98], dtype=np.float32)
        elemental_aura = metallic_tint * rim_mask * aura_intensity
        final_rgb = np.clip(rgb_specular + elemental_aura, 0.0, 1.0)
    else:  # bronze
        # Grounded natural glow: subtle warm rim light
        aura_intensity = 0.05
        natural_tint = 0.5 * prim_rgb + 0.5 * np.array([0.95, 0.88, 0.75], dtype=np.float32)
        elemental_aura = natural_tint * rim_mask * aura_intensity
        final_rgb = np.clip(rgb_specular + elemental_aura, 0.0, 1.0)

    # Reassemble RGBA
    out_arr = np.zeros((h, w, 4), dtype=np.uint8)
    out_arr[:, :, :3] = (final_rgb * 255.0).astype(np.uint8)
    out_arr[:, :, 3] = (alpha[:, :, 0] * 255.0).astype(np.uint8)

    out_img = Image.fromarray(out_arr)

    # Final micro-contrast polish pass
    out_img = out_img.filter(ImageFilter.UnsharpMask(radius=0.8, percent=70, threshold=1))
    return out_img

def build_png_metadata(card_meta):
    """Build standard PNG text chunks storing character metadata."""
    meta = PngImagePlugin.PngInfo()
    meta.add_text('Hero', card_meta['title_en'])
    meta.add_text('TitleKo', card_meta['title_ko'])
    meta.add_text('Faction', card_meta['faction'])
    meta.add_text('Element', card_meta['element'])
    meta.add_text('Rarity', card_meta['ip_rarity'])
    meta.add_text('Power', str(card_meta['power']))
    meta.add_text('Archetype', card_meta.get('archetype', 'adventurer'))
    meta.add_text('Remaster', 'SNSHero High-Density Fantasy TCG v2026')
    return meta

def run_remaster_pipeline():
    print("=" * 70)
    print("SNSHero 110-Hero Character Illustration Remaster Pipeline")
    print("=" * 70)

    # Step 1: Ensure clean baselines
    ensure_clean_baselines()

    # Step 2: Load card metadata
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        dataset = json.load(f)
    factions = dataset['factions']
    cards = dataset['cards']
    print(f"[DATA] Loaded {len(cards)} card specifications across {len(factions)} factions.")

    # Step 3: Execute remastering for all 110 cards
    results = []
    for i, c in enumerate(cards, 1):
        fname = f"{c['title_en'].replace(' ', '_')}.png"
        fpath = os.path.join(SEAT_DIR, fname)
        assert os.path.exists(fpath), f"Missing source file: {fpath}"

        # Remaster portrait
        remastered = remaster_portrait(fpath, c, factions)
        assert remastered.size == (256, 296), f"Invalid dimensions for {fname}: {remastered.size}"

        # Apply FASTOCTREE 256-color palette quantization
        quantized = remastered.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
        meta = build_png_metadata(c)

        # Temporary save to check file size
        tmp_path = f"/tmp/remaster_{fname}"
        quantized.save(tmp_path, 'PNG', pnginfo=meta, optimize=True, compress_level=9)
        file_size = os.path.getsize(tmp_path)

        # Enforce file size boundary: 4,096 <= file_size <= 35,840
        if file_size < 4096:
            # Fallback to direct RGBA if FASTOCTREE produces < 4KB
            print(f"  [ADAPTIVE] Card {c['id']} ({fname}) size {file_size} < 4096 B. Saving as RGBA direct.")
            remastered.save(tmp_path, 'PNG', pnginfo=meta, optimize=True, compress_level=9)
            file_size = os.path.getsize(tmp_path)

        assert 4096 <= file_size <= 35840, f"Size violation for {fname}: {file_size} bytes (not in [4096, 35840])"

        # Overwrite destination file in public/seat/
        with open(tmp_path, 'rb') as src_fp:
            data = src_fp.read()
        with open(fpath, 'wb') as dst_fp:
            dst_fp.write(data)

        # Compute hash
        sha256 = hashlib.sha256(data).hexdigest()
        results.append({
            'id': c['id'],
            'title_en': c['title_en'],
            'title_ko': c['title_ko'],
            'faction': c['faction'],
            'rarity': c['ip_rarity'],
            'is_boss': (c['id'] % 10 == 0),
            'filename': fname,
            'file_size': file_size,
            'sha256': sha256
        })

        if i % 10 == 0 or i == len(cards):
            print(f"  [PROGRESS] Remastered {i:3d}/110 cards... (Latest: {c['title_en']:18s} -> {file_size:5d} B)")

    manifest_path = '/Users/dayyoung/project/snshero/.agents/teamwork/worker_m1/remaster_manifest.json'
    with open(manifest_path, 'w', encoding='utf-8') as fp:
        json.dump(results, fp, indent=2, ensure_ascii=False)
    print(f"[MANIFEST] Wrote {len(results)} records to {manifest_path}")

    print("[SUCCESS] All 110 hero portraits remastered and saved to public/seat/!")
    return results

def verify_all_portraits(results):
    print("\n" + "=" * 70)
    print("MANDATORY VERIFICATION SUITE")
    print("=" * 70)

    # 1. Check all 110 files exist
    files = sorted(glob.glob(os.path.join(SEAT_DIR, '*.png')))
    print(f"1. Total files in public/seat/*.png: {len(files)} (Expected: 110)")
    assert len(files) == 110, f"Expected 110 files, found {len(files)}"

    # 2. Dimensions & Decoding
    decodable = 0
    dimensions_ok = 0
    non_blank = 0
    sizes = []
    hashes = set()

    for fpath in files:
        fname = os.path.basename(fpath)
        sz = os.path.getsize(fpath)
        sizes.append(sz)
        assert 4096 <= sz <= 35840, f"Size budget violation in {fname}: {sz} bytes"

        with open(fpath, 'rb') as fp:
            data = fp.read()
            h = hashlib.sha256(data).hexdigest()
            hashes.add(h)

        with Image.open(fpath) as img:
            decodable += 1
            if img.size == (256, 296):
                dimensions_ok += 1
            arr = np.array(img.convert('RGBA').convert('RGB'), dtype=np.float32)
            std = float(np.std(arr))
            if std > 20.0:
                non_blank += 1

    print(f"2. Valid decodable PNGs: {decodable}/110")
    print(f"3. Exact 256x296 dimensions: {dimensions_ok}/110")
    print(f"4. Non-blank, real illustrations (std > 20.0): {non_blank}/110")
    print(f"5. Unique SHA-256 hashes: {len(hashes)}/110")
    print(f"6. File size range: Min = {min(sizes):,} B ({min(sizes)/1024:.1f} KB), "
          f"Max = {max(sizes):,} B ({max(sizes)/1024:.1f} KB), "
          f"Average = {sum(sizes)/len(sizes):,.1f} B ({sum(sizes)/len(sizes)/1024:.1f} KB)")
    print(f"7. Files in budget [4096, 35840]: {len([s for s in sizes if 4096 <= s <= 35840])}/110 (100.0%)")

    assert decodable == 110
    assert dimensions_ok == 110
    assert non_blank == 110
    assert len(hashes) == 110
    print("\n>>> ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS! <<<")

if __name__ == '__main__':
    results = run_remaster_pipeline()
    verify_all_portraits(results)
