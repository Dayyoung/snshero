import os
import json
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

DATASET_PATH = '/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/cards_dataset.json'
with open(DATASET_PATH, 'r', encoding='utf-8') as f:
    cards_data = json.load(f)

cards_by_id = {c['id']: c for c in cards_data['cards']}
factions = cards_data['factions']

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def apply_tonal_curve(arr_rgb, tier, is_boss):
    # arr_rgb: float array [0..1]
    # S-curve: x' = 3x^2 - 2x^3 or customized smoothstep
    # Tier-based contrast boost
    if is_boss:
        contrast_power = 1.35
        gamma = 1.05
    elif tier == 'gold':
        contrast_power = 1.25
        gamma = 1.02
    elif tier == 'silver':
        contrast_power = 1.18
        gamma = 1.00
    else: # bronze
        contrast_power = 1.12
        gamma = 0.98

    # Apply gamma
    norm = np.clip(arr_rgb, 0.0, 1.0) ** gamma
    # S-curve blend
    s_curve = norm * norm * (3.0 - 2.0 * norm)
    # Blend between linear and S-curve
    factor = (contrast_power - 1.0) * 1.8
    result = norm * (1.0 - factor) + s_curve * factor
    return np.clip(result, 0.0, 1.0)

def remaster_image(img_path, card_meta):
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

    # Step 1: Base pass - Fine detail sharpening
    # Multi-pass sharpening
    pass1 = orig.filter(ImageFilter.UnsharpMask(radius=1.2, percent=160, threshold=2))
    pass2 = pass1.filter(ImageFilter.UnsharpMask(radius=2.2, percent=120, threshold=3))

    # Step 2: Color and dynamic contrast enhancement
    if is_boss:
        color_enhancer = ImageEnhance.Color(pass2)
        enhanced = color_enhancer.enhance(1.22)
        contrast_enhancer = ImageEnhance.Contrast(enhanced)
        enhanced = contrast_enhancer.enhance(1.25)
    elif tier == 'gold':
        color_enhancer = ImageEnhance.Color(pass2)
        enhanced = color_enhancer.enhance(1.18)
        contrast_enhancer = ImageEnhance.Contrast(enhanced)
        enhanced = contrast_enhancer.enhance(1.18)
    elif tier == 'silver':
        color_enhancer = ImageEnhance.Color(pass2)
        enhanced = color_enhancer.enhance(1.08)
        contrast_enhancer = ImageEnhance.Contrast(enhanced)
        enhanced = contrast_enhancer.enhance(1.15)
    else: # bronze
        color_enhancer = ImageEnhance.Color(pass2)
        enhanced = color_enhancer.enhance(1.05)
        contrast_enhancer = ImageEnhance.Contrast(enhanced)
        enhanced = contrast_enhancer.enhance(1.10)

    # Step 3: NumPy array manipulation for specular highlights, dynamic tonal curves, and elemental aura
    arr = np.array(enhanced, dtype=np.float32)
    rgb = arr[:, :, :3] / 255.0
    alpha = arr[:, :, 3:4] / 255.0

    # Apply dynamic tonal curve
    rgb_curved = apply_tonal_curve(rgb, tier, is_boss)

    # Calculate luminance
    lum = 0.299 * rgb_curved[:, :, 0] + 0.587 * rgb_curved[:, :, 1] + 0.114 * rgb_curved[:, :, 2]
    lum_3d = np.repeat(lum[:, :, np.newaxis], 3, axis=2)

    # Specular lighting accentuation
    # Detect high specular peaks (> 0.72)
    specular_mask = np.maximum(0.0, (lum_3d - 0.70) / 0.30) ** 1.8
    if is_boss:
        specular_strength = 0.35
        # Add metallic/elemental sheen to speculars using accent color
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
    else: # bronze
        specular_strength = 0.15
        bronze_factor = np.array([1.0, 0.9, 0.8], dtype=np.float32)
        rgb_specular = rgb_curved + specular_mask * specular_strength * bronze_factor

    # Step 4: Elemental aura / glow rendering tailored to rarity tier
    # Extract edge / contour aura
    prim_rgb = np.array(primary_color, dtype=np.float32) / 255.0
    acc_rgb = np.array(accent_color, dtype=np.float32) / 255.0

    # Build subtle radial vignette and aura
    y_coords, x_coords = np.ogrid[:h, :w]
    # Center of character typically around (h * 0.45, w * 0.50)
    cy, cx = h * 0.46, w * 0.50
    dist_sq = ((x_coords - cx) / (w * 0.5)) ** 2 + ((y_coords - cy) / (h * 0.5)) ** 2
    radial_falloff = np.clip(1.0 - 0.5 * dist_sq, 0.0, 1.0)[:, :, np.newaxis]

    # Create soft elemental glow on highlights and midtone rims
    rim_mask = np.clip((lum_3d - 0.35) * (1.1 - lum_3d) * 4.0, 0.0, 1.0)
    
    if is_boss:
        # Supreme elemental aura: dramatic radiant blooming
        aura_intensity = 0.20
        elemental_aura = (0.65 * prim_rgb + 0.35 * acc_rgb) * rim_mask * radial_falloff * aura_intensity
        # Add subtle deep atmosphere around edges
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
    else: # bronze
        # Grounded natural glow: subtle warm rim light
        aura_intensity = 0.05
        natural_tint = 0.5 * prim_rgb + 0.5 * np.array([0.95, 0.88, 0.75], dtype=np.float32)
        elemental_aura = natural_tint * rim_mask * aura_intensity
        final_rgb = np.clip(rgb_specular + elemental_aura, 0.0, 1.0)

    # Convert back to uint8 RGBA image
    out_arr = np.zeros((h, w, 4), dtype=np.uint8)
    out_arr[:, :, :3] = (final_rgb * 255.0).astype(np.uint8)
    out_arr[:, :, 3] = (alpha[:, :, 0] * 255.0).astype(np.uint8)
    
    out_img = Image.fromarray(out_arr, 'RGBA')

    # Final micro-contrast polish pass
    out_img = out_img.filter(ImageFilter.UnsharpMask(radius=0.8, percent=70, threshold=1))
    return out_img

# Test on sample cards
sample_ids = [1, 10, 16, 20, 41, 50, 71, 80, 93, 100, 101, 110]
for sid in sample_ids:
    c = cards_by_id[sid]
    fname = f"{c['title_en'].replace(' ', '_')}.png"
    in_path = f"public/seat/{fname}"
    remastered = remaster_image(in_path, c)
    
    # Test quantizations
    # 1. Direct FASTOCTREE 256 colors
    quant_256 = remastered.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    test_path_256 = f"/tmp/test_256_{fname}"
    quant_256.save(test_path_256, 'PNG', optimize=True, compress_level=9)
    sz_256 = os.path.getsize(test_path_256)
    
    # 2. FASTOCTREE 192 colors
    quant_192 = remastered.quantize(colors=192, method=Image.Quantize.FASTOCTREE)
    test_path_192 = f"/tmp/test_192_{fname}"
    quant_192.save(test_path_192, 'PNG', optimize=True, compress_level=9)
    sz_192 = os.path.getsize(test_path_192)

    # 3. FASTOCTREE 160 colors
    quant_160 = remastered.quantize(colors=160, method=Image.Quantize.FASTOCTREE)
    test_path_160 = f"/tmp/test_160_{fname}"
    quant_160.save(test_path_160, 'PNG', optimize=True, compress_level=9)
    sz_160 = os.path.getsize(test_path_160)

    print(f"Card {c['id']:3d} ({c['title_en']:18s} | {c['faction']:7s} | {c['ip_rarity']:6s}) -> "
          f"256-col: {sz_256:5d} B ({sz_256/1024:.1f} KB) | "
          f"192-col: {sz_192:5d} B ({sz_192/1024:.1f} KB) | "
          f"160-col: {sz_160:5d} B ({sz_160/1024:.1f} KB)")
