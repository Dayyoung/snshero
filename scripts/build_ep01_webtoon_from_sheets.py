#!/usr/bin/env python3
"""
build_ep01_webtoon_from_sheets.py
Slices the 6 AI-illustrated 3x3 webtoon storyboard sheets (sheet_01.png .. sheet_06.png)
into 50 bespoke Episode 1 webtoon panels (scene_00.webp .. scene_49.webp),
each featuring scene-specific locations, character gestures/acting, and story props.
"""

import json
import hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MANIFEST_PATH = PROJECT_ROOT / "src/content/webtoonEpisodeManifest.json"
RAW_DIR = PROJECT_ROOT / "public/images/webtoon/raw_ep01_sheets"
OUT_DIR = PROJECT_ROOT / "public/images/webtoon/episode_01"
CLIMAX_WEBP = PROJECT_ROOT / "public/images/webtoon/ep01_blizzard_vow.webp"
CLIMAX_JPG = PROJECT_ROOT / "public/images/webtoon/ep01_blizzard_vow.jpg"

WIDTH = 800
HEIGHT = 450

FONT_KO_TITLE = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
FONT_MONO = "/System/Library/Fonts/Menlo.ttc"


def extract_3x3_panels(sheet_path: Path) -> list[Image.Image]:
    """
    Slices a 3x3 grid sheet image into 9 clean panels, trimming inner grid gutters
    so no black/white border bars remain around the edges.
    """
    im = Image.open(sheet_path).convert("RGB")
    sw, sh = im.size
    cell_w = sw / 3.0
    cell_h = sh / 3.0

    # Trim ~2.2% margin from each cell edge to cleanly remove grid divider lines
    pad_x = int(cell_w * 0.022)
    pad_y = int(cell_h * 0.024)

    panels = []
    for row in range(3):
        for col in range(3):
            x0 = int(col * cell_w) + pad_x
            y0 = int(row * cell_h) + pad_y
            x1 = int((col + 1) * cell_w) - pad_x
            y1 = int((row + 1) * cell_h) - pad_y
            crop = im.crop((x0, y0, x1, y1))

            # Center-crop to exact 16:9 aspect ratio before resizing to 800x450
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
            # Slight contrast/sharpness boost for crisp webtoon linework
            panel = ImageEnhance.Contrast(panel).enhance(1.04)
            panel = ImageEnhance.Sharpness(panel).enhance(1.08)
            panels.append(panel)

    return panels


def save_webp_under_limit(img: Image.Image, out_file: Path, limit_bytes: int = 75000) -> int:
    for q in [86, 82, 78, 74, 70, 66, 62, 58, 54]:
        img.save(out_file, "WEBP", quality=q, method=5)
        sz = out_file.stat().st_size
        if sz <= limit_bytes:
            return sz
    return out_file.stat().st_size


def render_title_card(cover_panel: Image.Image, ep_data: dict, out_file: Path) -> int:
    base = cover_panel.convert("RGBA")
    # Keep the illustrated characters/props clearly visible while adding a cinematic title gradient
    veil = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(veil)
    for y in range(HEIGHT):
        # Darker at top and bottom, clearer in the middle so the cover illustration shines through
        dist_center = abs(y - HEIGHT * 0.45) / (HEIGHT * 0.55)
        alpha = int(115 + 75 * min(1.0, dist_center ** 1.2))
        vdraw.line([(0, y), (WIDTH, y)], fill=(12, 10, 12, alpha))

    card = Image.alpha_composite(base, veil)
    draw = ImageDraw.Draw(card)

    # Terminal-Flat double hairline frame
    draw.rectangle([18, 18, WIDTH - 18, HEIGHT - 18], outline=(210, 190, 150, 195), width=1)
    draw.rectangle([22, 22, WIDTH - 22, HEIGHT - 22], outline=(120, 110, 95, 120), width=1)

    font_badge = ImageFont.truetype(FONT_MONO, 12)
    font_ko = ImageFont.truetype(FONT_KO_TITLE, 32)
    font_en = ImageFont.truetype(FONT_MONO, 15)
    font_act = ImageFont.truetype(FONT_MONO, 11)

    title_ko = ep_data.get("episodeTitleKo", "눈보라 아래 두 서약")
    title_en = ep_data.get("episodeTitle", "Two Vows Beneath the Blizzard")

    draw.text((WIDTH // 2, 65), "SNSHERO · ARCANE ECHOES WEBTOON", fill=(225, 205, 160), font=font_badge, anchor="mm")
    draw.text((WIDTH // 2, 95), "— ACT I · VOWS IN THE BLIZZARD & BIRTH OF FATE —", fill=(175, 165, 150), font=font_act, anchor="mm")
    draw.text((WIDTH // 2, 345), f"제01화 : {title_ko}", fill=(255, 255, 255), font=font_ko, anchor="mm")
    draw.text((WIDTH // 2, 390), title_en, fill=(185, 220, 250), font=font_en, anchor="mm")

    final_rgb = card.convert("RGB")
    return save_webp_under_limit(final_rgb, out_file)


def frame_webtoon_scene(panel_img: Image.Image, scene_idx: int, out_file: Path) -> int:
    comp = panel_img.convert("RGBA")
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)

    # Subtle top & bottom 18px webtoon letterbox trim & 1px hairline border
    odraw.rectangle([0, 0, WIDTH, 18], fill=(10, 9, 9, 145))
    odraw.rectangle([0, HEIGHT - 14, WIDTH, HEIGHT], fill=(10, 9, 9, 145))
    odraw.rectangle([0, 0, WIDTH - 1, HEIGHT - 1], outline=(45, 42, 40, 210), width=1)

    font_mono = ImageFont.truetype(FONT_MONO, 10)
    odraw.text((WIDTH - 12, 9), f"EP.01 · CUT {scene_idx:02d}", fill=(200, 195, 185, 175), font=font_mono, anchor="rm")
    odraw.text((12, 9), "SNSHERO WEBTOON", fill=(175, 165, 145, 160), font=font_mono, anchor="lm")

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
            raise FileNotFoundError(f"Missing generated sheet: {sp}")
        sheets.append(extract_3x3_panels(sp))

    # Map 50 scenes (0..49):
    # Scene 00 (Title Card) -> sheet_06[0] (Panel 1 of Sheet 6)
    # Scenes 01..09 -> sheet_01[0..8]
    # Scenes 10..18 -> sheet_02[0..8]
    # Scenes 19..27 -> sheet_03[0..8]
    # Scenes 28..36 -> sheet_04[0..8]
    # Scenes 37..45 -> sheet_05[0..8]
    # Scenes 46..49 -> sheet_06[1..4]
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
        if idx == 0:
            sz = render_title_card(panel, ep1_data, out_file)
        else:
            sz = frame_webtoon_scene(panel, idx, out_file)
        sizes.append(sz)
        hashes.add(hashlib.sha256(out_file.read_bytes()).hexdigest())

    # Update ep01_blizzard_vow climax preview with Sheet 3 Panel 7 (Scene 25: the 3-way oath over the glowing silver daggers)
    climax_panel = sheets[2][6]
    save_webp_under_limit(climax_panel, CLIMAX_WEBP)
    for q in [84, 80, 75, 70, 65]:
        climax_panel.save(CLIMAX_JPG, "JPEG", quality=q, optimize=True)
        if CLIMAX_JPG.stat().st_size <= 75000:
            break

    print(f"Successfully generated 50 Episode 1 webtoon scenes!")
    print(f"Unique SHA-256 hashes: {len(hashes)} / 50")
    print(f"Min size: {min(sizes):,} B | Max size: {max(sizes):,} B | Avg size: {sum(sizes)//len(sizes):,} B")


if __name__ == "__main__":
    main()
