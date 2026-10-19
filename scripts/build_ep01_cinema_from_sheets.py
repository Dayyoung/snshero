#!/usr/bin/env python3
"""
scripts/build_ep01_cinema_from_sheets.py
Slices the 6 photorealistic live-action 3x3 cinema storyboard sheets (sheet_01.png .. sheet_06.png)
into 50 bespoke Episode 1 live-action theatrical stills (public/images/cinema/episode_01/scene_00.webp .. scene_49.webp).

Applies authentic Hollywood Dark Fantasy Live-Action post-processing:
- Anamorphic Color Grading LUT (Cold Blizzard Slate-Blue & Warm Tavern Torchlight Amber)
- Subtle 35mm Kodak Vision3 film grain & shallow depth-of-field edge vignette
- 2.39:1 CinemaScope matte letterbox bars with 70mm IMAX timecode metadata
- Theatrical Live-Action Opening Title Card (scene_00.webp)
"""

import json
import hashlib
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MANIFEST_PATH = PROJECT_ROOT / "src/content/webtoonEpisodeManifest.json"
RAW_DIR = PROJECT_ROOT / "public/images/cinema/raw_ep01_sheets"
OUT_DIR = PROJECT_ROOT / "public/images/cinema/episode_01"
POSTER_WEBP = PROJECT_ROOT / "public/images/cinema/ep01_live_action_poster.webp"

WIDTH = 800
HEIGHT = 450

FONT_KO_TITLE = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
FONT_EN_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_MONO = "/System/Library/Fonts/Menlo.ttc"


def apply_live_action_lut_and_grain(img: Image.Image, scene_idx: int, is_tavern: bool = False) -> Image.Image:
    """
    Applies a cinematic 35mm live-action color grade (Teal/Slate shadows + Warm Amber highlights),
    subtle shallow DoF edge softness, anamorphic vignette, and fine 35mm film grain.
    """
    arr = np.asarray(img, dtype=np.float32) / 255.0
    h, w, _ = arr.shape

    # 1. S-curve contrast for theatrical film stock look
    arr = np.clip((arr - 0.5) * 1.12 + 0.5, 0.0, 1.0)

    # 2. Split-toning LUT (Shadows -> Cold Slate Blue, Highlights -> Warm Torch Amber)
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    shadow_mask = np.clip(1.0 - lum * 1.6, 0.0, 1.0)
    highlight_mask = np.clip((lum - 0.45) * 1.8, 0.0, 1.0)

    if is_tavern:
        # Warm hearth firelight & deep shadows
        arr[:, :, 0] += highlight_mask * 0.055 - shadow_mask * 0.025
        arr[:, :, 1] += highlight_mask * 0.018 - shadow_mask * 0.010
        arr[:, :, 2] -= highlight_mask * 0.035 - shadow_mask * 0.035
    else:
        # Cold blizzard & steel tone
        arr[:, :, 0] += highlight_mask * 0.030 - shadow_mask * 0.045
        arr[:, :, 1] += highlight_mask * 0.010 - shadow_mask * 0.010
        arr[:, :, 2] += shadow_mask * 0.055

    # 3. Radial Anamorphic Lens Vignette
    y_grid, x_grid = np.ogrid[:h, :w]
    nx = (x_grid - w / 2.0) / (w / 2.0)
    ny = (y_grid - h / 2.0) / (h / 2.0)
    dist_sq = (nx ** 2) * 0.85 + (ny ** 2) * 1.25
    vignette = np.clip(1.0 - 0.28 * (dist_sq ** 1.35), 0.55, 1.0)
    arr *= vignette[:, :, np.newaxis]

    # 4. Subtle deterministic 35mm Kodak Vision3 film grain
    rng = np.random.default_rng(seed=1000 + scene_idx)
    grain = rng.normal(0.0, 0.016, size=(h, w, 1)).astype(np.float32)
    arr = np.clip(arr + grain, 0.0, 1.0)

    out = Image.fromarray((arr * 255.0).astype(np.uint8), mode="RGB")
    out = ImageEnhance.Sharpness(out).enhance(1.10)
    return out


def extract_3x3_cinema_panels(sheet_path: Path) -> list[Image.Image]:
    """
    Slices a 3x3 live-action grid sheet into 9 clean 16:9 panels,
    trimming inner grid borders cleanly.
    """
    im = Image.open(sheet_path).convert("RGB")
    sw, sh = im.size
    cell_w = sw / 3.0
    cell_h = sh / 3.0

    pad_x = int(cell_w * 0.024)
    pad_y = int(cell_h * 0.026)

    panels = []
    for row in range(3):
        for col in range(3):
            x0 = int(col * cell_w) + pad_x
            y0 = int(row * cell_h) + pad_y
            x1 = int((col + 1) * cell_w) - pad_x
            y1 = int((row + 1) * cell_h) - pad_y
            crop = im.crop((x0, y0, x1, y1))

            cw, ch = crop.size
            target_ratio = WIDTH / HEIGHT
            curr_ratio = cw / ch
            if curr_ratio > target_ratio:
                new_w = int(ch * target_ratio)
                off_x = (cw - new_w) // 2
                crop = crop.crop((off_x, 0, off_x + new_w, ch))
            elif curr_ratio < target_ratio:
                new_h = int(cw / target_ratio)
                off_y = (ch - new_h) // 2
                crop = crop.crop((0, off_y, cw, off_y + new_h))

            panel = crop.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
            panels.append(panel)

    return panels


def save_webp_under_limit(img: Image.Image, out_file: Path, limit_bytes: int = 85000) -> int:
    for q in [88, 84, 80, 76, 72, 68, 64, 60]:
        img.save(out_file, "WEBP", quality=q, method=5)
        sz = out_file.stat().st_size
        if sz <= limit_bytes:
            return sz
    return out_file.stat().st_size


def render_cinema_title_card(cover_panel: Image.Image, ep_data: dict, out_file: Path) -> int:
    graded = apply_live_action_lut_and_grain(cover_panel, 0, is_tavern=False)
    base = graded.convert("RGBA")

    veil = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(veil)
    for y in range(HEIGHT):
        dist_center = abs(y - HEIGHT * 0.42) / (HEIGHT * 0.58)
        alpha = int(95 + 110 * min(1.0, dist_center ** 1.25))
        vdraw.line([(0, y), (WIDTH, y)], fill=(8, 9, 12, alpha))

    # 2.39:1 CinemaScope Top & Bottom Letterbox Bars (32px each)
    vdraw.rectangle([0, 0, WIDTH, 32], fill=(5, 5, 7, 255))
    vdraw.rectangle([0, HEIGHT - 32, WIDTH, HEIGHT], fill=(5, 5, 7, 255))

    # Subtle horizontal blue anamorphic flare streak across lower third
    for fy in range(298, 304):
        flare_alpha = 65 if fy in (300, 301) else 25
        vdraw.line([(80, fy), (WIDTH - 80, fy)], fill=(110, 185, 255, flare_alpha))

    card = Image.alpha_composite(base, veil)
    draw = ImageDraw.Draw(card)

    # Cinema frame hairline
    draw.rectangle([24, 42, WIDTH - 24, HEIGHT - 42], outline=(215, 190, 140, 160), width=1)

    font_badge = ImageFont.truetype(FONT_MONO, 11)
    font_ko = ImageFont.truetype(FONT_KO_TITLE, 30)
    try:
        font_en = ImageFont.truetype(FONT_EN_BOLD, 16)
    except Exception:
        font_en = ImageFont.truetype(FONT_MONO, 15)
    font_meta = ImageFont.truetype(FONT_MONO, 10)

    title_ko = ep_data.get("episodeTitleKo", "눈보라 아래 두 서약")
    title_en = ep_data.get("episodeTitle", "Two Vows Beneath the Blizzard").upper()

    draw.text((WIDTH // 2, 16), "SNSHERO LIVE-ACTION CINEMA · SHOT ON 70MM ANAMORPHIC", fill=(215, 195, 150), font=font_meta, anchor="mm")
    draw.text((WIDTH // 2, 66), "— ACT I · VOWS IN THE BLIZZARD & BIRTH OF FATE —", fill=(180, 195, 210), font=font_badge, anchor="mm")

    draw.rectangle([WIDTH // 2 - 90, 274, WIDTH // 2 + 90, 296], fill=(15, 16, 20, 220), outline=(215, 190, 140, 190), width=1)
    draw.text((WIDTH // 2, 285), "LIVE-ACTION EPISODE 01", fill=(240, 215, 160), font=font_badge, anchor="mm")

    draw.text((WIDTH // 2 + 2, 336 + 2), f"제01화 : {title_ko}", fill=(0, 0, 0, 220), font=font_ko, anchor="mm")
    draw.text((WIDTH // 2, 336), f"제01화 : {title_ko}", fill=(255, 255, 255), font=font_ko, anchor="mm")
    draw.text((WIDTH // 2, 376), title_en, fill=(165, 210, 245), font=font_en, anchor="mm")
    draw.text((WIDTH // 2, HEIGHT - 16), "2.39:1 CINEMASCOPE · 24FPS MASTER · DOLBY ATMOS SYNTH", fill=(145, 145, 155), font=font_meta, anchor="mm")

    final_rgb = card.convert("RGB")
    return save_webp_under_limit(final_rgb, out_file)


def frame_cinema_scene(panel_img: Image.Image, scene_idx: int, is_tavern: bool, out_file: Path) -> int:
    graded = apply_live_action_lut_and_grain(panel_img, scene_idx, is_tavern=is_tavern)
    comp = graded.convert("RGBA")
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)

    # 2.39:1 CinemaScope Top & Bottom Letterbox Bars (28px each)
    bar_h = 28
    odraw.rectangle([0, 0, WIDTH, bar_h], fill=(6, 6, 8, 245))
    odraw.rectangle([0, HEIGHT - bar_h, WIDTH, HEIGHT], fill=(6, 6, 8, 245))
    odraw.line([(0, bar_h), (WIDTH, bar_h)], fill=(180, 160, 120, 90), width=1)
    odraw.line([(0, HEIGHT - bar_h), (WIDTH, HEIGHT - bar_h)], fill=(180, 160, 120, 90), width=1)

    font_mono = ImageFont.truetype(FONT_MONO, 10)
    tc_min = (scene_idx * 7) // 60
    tc_sec = (scene_idx * 7) % 60
    odraw.text((14, bar_h // 2), "SNSHERO LIVE-ACTION · 70MM ANAMORPHIC", fill=(195, 180, 150, 185), font=font_mono, anchor="lm")
    odraw.text((WIDTH - 14, bar_h // 2), f"EP.01 · SHOT {scene_idx:02d} · TC 00:{tc_min:02d}:{tc_sec:02d}:12", fill=(175, 195, 215, 185), font=font_mono, anchor="rm")

    final_rgb = Image.alpha_composite(comp, overlay).convert("RGB")
    return save_webp_under_limit(final_rgb, out_file)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    ep1_data = manifest["1"]

    sheets = []
    for i in range(1, 7):
        sp = RAW_DIR / f"sheet_{i:02d}.png"
        if not sp.exists():
            raise FileNotFoundError(f"Missing generated live-action cinema sheet: {sp}")
        sheets.append(extract_3x3_cinema_panels(sp))

    scene_to_panel: dict[int, Image.Image] = {}
    scene_to_panel[0] = sheets[5][0]

    for idx in range(1, 10):
        scene_to_panel[idx] = sheets[0][idx - 1]
    for idx in range(10, 19):
        scene_to_panel[idx] = sheets[1][idx - 10]
    for idx in range(19, 28):
        scene_to_panel[idx] = sheets[2][idx - 19]
    for idx in range(28, 37):
        scene_to_panel[idx] = sheets[3][idx - 28]
    for idx in range(37, 46):
        scene_to_panel[idx] = sheets[4][idx - 37]
    for idx in range(46, 50):
        scene_to_panel[idx] = sheets[5][idx - 46 + 1]

    sizes = []
    hashes = set()
    for idx in range(50):
        out_file = OUT_DIR / f"scene_{idx:02d}.webp"
        panel = scene_to_panel[idx]
        # Scenes 3..26 take place largely inside the firelit tavern
        is_tavern = 3 <= idx <= 26
        if idx == 0:
            sz = render_cinema_title_card(panel, ep1_data, out_file)
        else:
            sz = frame_cinema_scene(panel, idx, is_tavern, out_file)
        sizes.append(sz)
        hashes.add(hashlib.sha256(out_file.read_bytes()).hexdigest())

    # Save master poster
    poster_img = apply_live_action_lut_and_grain(sheets[2][6], 25, is_tavern=True)
    save_webp_under_limit(poster_img, POSTER_WEBP)

    print("Successfully built 50 Episode 1 Live-Action Cinema scenes!")
    print(f"Unique SHA-256 hashes: {len(hashes)} / 50")
    print(f"Min size: {min(sizes):,} B | Max size: {max(sizes):,} B | Avg size: {sum(sizes)//len(sizes):,} B")


if __name__ == "__main__":
    main()
