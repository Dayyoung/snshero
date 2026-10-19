#!/usr/bin/env python3
"""
build_all_40_webtoons_from_sheets.py
Builds all 40 episodes (2,049 total scenes) of card-accurate webtoon cutscenes:
- Episode 1: Uses the 6 3x3 sheets in public/images/webtoon/raw_ep01_sheets/sheet_01..06.png
- Episodes 2..40: Uses the 39 3x3 sheets in public/images/webtoon/raw_ep_sheets/ep02_sheet..ep40_sheet.png
- All 40 opening title cards (scene_00.webp) are rendered in 100% ENGLISH ONLY.
"""

import json
import hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MANIFEST_PATH = PROJECT_ROOT / "src/content/webtoonEpisodeManifest.json"
RAW_EP01_DIR = PROJECT_ROOT / "public/images/webtoon/raw_ep01_sheets"
RAW_ALL_DIR = PROJECT_ROOT / "public/images/webtoon/raw_ep_sheets"
WEBTOON_DIR = PROJECT_ROOT / "public/images/webtoon"

WIDTH = 800
HEIGHT = 450

FONT_EN_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_MONO = "/System/Library/Fonts/Menlo.ttc"


def get_act_header_en(ep_num: int) -> str:
    if ep_num <= 10:
        return "— ACT I · VOWS IN THE BLIZZARD & BIRTH OF FATE —"
    elif ep_num <= 20:
        return "— ACT II · THE AWAKENING DAGGER & STORM OF WIND ISLE —"
    elif ep_num <= 30:
        return "— ACT III · RELICS OF THE CAVERN & THE JADE REVOLT —"
    else:
        return "— ACT IV · MARCH ON THE BLACK MARSH & DAWN OF PEACE —"


def extract_raw_cells(sheet_path: Path) -> list[Image.Image]:
    """
    Extracts the 9 cells from a 3x3 grid sheet at full raw resolution,
    trimming inner grid borders cleanly.
    """
    im = Image.open(sheet_path).convert("RGB")
    sw, sh = im.size
    cell_w = sw / 3.0
    cell_h = sh / 3.0

    pad_x = int(cell_w * 0.024)
    pad_y = int(cell_h * 0.026)

    cells = []
    for row in range(3):
        for col in range(3):
            x0 = int(col * cell_w) + pad_x
            y0 = int(row * cell_h) + pad_y
            x1 = int((col + 1) * cell_w) - pad_x
            y1 = int((row + 1) * cell_h) - pad_y
            crop = im.crop((x0, y0, x1, y1))
            cells.append(crop)
    return cells


def crop_16x9_and_resize(img: Image.Image, rx0: float = 0.0, ry0: float = 0.0, rx1: float = 1.0, ry1: float = 1.0) -> Image.Image:
    """
    Crops a normalized sub-rectangle (rx0, ry0, rx1, ry1) from img,
    adjusts to exact 16:9 aspect ratio, and resizes to 800x450.
    """
    w, h = img.size
    x0 = max(0, int(w * rx0))
    y0 = max(0, int(h * ry0))
    x1 = min(w, int(w * rx1))
    y1 = min(h, int(h * ry1))
    sub = img.crop((x0, y0, x1, y1))

    cw, ch = sub.size
    target_ratio = WIDTH / HEIGHT
    curr_ratio = cw / ch
    if curr_ratio > target_ratio:
        new_w = int(ch * target_ratio)
        off_x = (cw - new_w) // 2
        sub = sub.crop((off_x, 0, off_x + new_w, ch))
    elif curr_ratio < target_ratio:
        new_h = int(cw / target_ratio)
        off_y = (ch - new_h) // 2
        sub = sub.crop((0, off_y, cw, off_y + new_h))

    panel = sub.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    panel = ImageEnhance.Contrast(panel).enhance(1.04)
    panel = ImageEnhance.Sharpness(panel).enhance(1.08)
    return panel


def save_webp_under_limit(img: Image.Image, out_file: Path, limit_bytes: int = 75000) -> int:
    for q in [86, 82, 78, 74, 70, 66, 62, 58, 54]:
        img.save(out_file, "WEBP", quality=q, method=5)
        sz = out_file.stat().st_size
        if sz <= limit_bytes:
            return sz
    return out_file.stat().st_size


def render_english_title_card(cover_panel: Image.Image, ep_num: int, ep_data: dict, out_file: Path) -> int:
    """
    Renders scene_00.webp with 100% English-only typography.
    """
    base = cover_panel.convert("RGBA")
    veil = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(veil)
    for y in range(HEIGHT):
        dist_center = abs(y - HEIGHT * 0.44) / (HEIGHT * 0.56)
        alpha = int(105 + 85 * min(1.0, dist_center ** 1.2))
        vdraw.line([(0, y), (WIDTH, y)], fill=(10, 9, 12, alpha))

    card = Image.alpha_composite(base, veil)
    draw = ImageDraw.Draw(card)

    # Terminal-Flat double hairline frame
    draw.rectangle([18, 18, WIDTH - 18, HEIGHT - 18], outline=(215, 195, 150, 200), width=1)
    draw.rectangle([22, 22, WIDTH - 22, HEIGHT - 22], outline=(120, 110, 95, 130), width=1)

    font_badge = ImageFont.truetype(FONT_MONO, 12)
    font_act = ImageFont.truetype(FONT_MONO, 11)
    font_ep = ImageFont.truetype(FONT_MONO, 15)

    title_en = ep_data.get("episodeTitle", f"Episode {ep_num}").strip()
    title_upper = title_en.upper()

    # Choose font size dynamically so long English titles fit cleanly inside the frame
    title_font_size = 28 if len(title_upper) <= 26 else (24 if len(title_upper) <= 34 else 20)
    try:
        font_title = ImageFont.truetype(FONT_EN_BOLD, title_font_size)
    except Exception:
        font_title = ImageFont.truetype(FONT_MONO, title_font_size)

    draw.text((WIDTH // 2, 62), "SNSHERO · ARCANE ECHOES WEBTOON", fill=(225, 205, 160), font=font_badge, anchor="mm")
    draw.text((WIDTH // 2, 90), get_act_header_en(ep_num), fill=(175, 168, 155), font=font_act, anchor="mm")

    # Episode pill badge above main English title
    draw.rectangle([WIDTH // 2 - 76, 308, WIDTH // 2 + 76, 332], fill=(24, 22, 26, 210), outline=(215, 195, 150, 180), width=1)
    draw.text((WIDTH // 2, 320), f"EPISODE {ep_num:02d}", fill=(235, 215, 165), font=font_ep, anchor="mm")

    # Main English Title (with subtle dark text shadow for legibility)
    draw.text((WIDTH // 2 + 2, 368 + 2), title_upper, fill=(0, 0, 0, 220), font=font_title, anchor="mm")
    draw.text((WIDTH // 2, 368), title_upper, fill=(255, 255, 255), font=font_title, anchor="mm")

    draw.text((WIDTH // 2, 404), "OFFICIAL DARK FANTASY CHRONICLE", fill=(175, 210, 240), font=font_act, anchor="mm")

    final_rgb = card.convert("RGB")
    return save_webp_under_limit(final_rgb, out_file)


def compose_webtoon_cut(raw_cells: list[Image.Image], p: int, sub_idx: int, scene_idx: int) -> Image.Image:
    """
    Creates a distinct cinematic webtoon panel composition for (p, sub_idx)
    from the high-resolution raw 3x3 cells.
    """
    cell = raw_cells[p]
    next_cell = raw_cells[min(8, p + 1)] if p < 8 else raw_cells[max(0, p - 1)]

    if sub_idx == 0:
        # 1. Full Wide Establishing Cut
        return crop_16x9_and_resize(cell, 0.0, 0.0, 1.0, 1.0)

    elif sub_idx == 1:
        # 2. Left Subject / Action Focus Zoom
        return crop_16x9_and_resize(cell, 0.0, 0.03, 0.78, 0.93)

    elif sub_idx == 2:
        # 3. Right Subject / Reaction Focus Zoom
        return crop_16x9_and_resize(cell, 0.22, 0.05, 1.0, 0.95)

    elif sub_idx == 3:
        # 4. Dramatic Center Close-Up (Gesture & Prop Focus)
        img = crop_16x9_and_resize(cell, 0.11, 0.08, 0.89, 0.91)
        return ImageEnhance.Contrast(img).enhance(1.04)

    elif sub_idx == 4:
        # 5. Dynamic Slanted 2-Panel Webtoon Split (Action -> Reaction)
        left_img = crop_16x9_and_resize(cell, 0.04, 0.04, 0.84, 0.94)
        right_img = crop_16x9_and_resize(next_cell, 0.14, 0.04, 0.96, 0.94)

        canvas = left_img.copy()
        # Create slanted polygon mask for right side
        mask = Image.new("L", (WIDTH, HEIGHT), 0)
        mdraw = ImageDraw.Draw(mask)
        split_top = int(WIDTH * 0.54)
        split_bot = int(WIDTH * 0.46)
        mdraw.polygon([(split_top, 0), (WIDTH, 0), (WIDTH, HEIGHT), (split_bot, HEIGHT)], fill=255)
        canvas.paste(right_img, (0, 0), mask)

        # Draw crisp angled comic gutter divider
        cdraw = ImageDraw.Draw(canvas)
        cdraw.line([(split_top, 0), (split_bot, HEIGHT)], fill=(12, 10, 10), width=10)
        cdraw.line([(split_top - 4, 0), (split_bot - 4, HEIGHT)], fill=(210, 190, 145), width=1)
        cdraw.line([(split_top + 4, 0), (split_bot + 4, HEIGHT)], fill=(210, 190, 145), width=1)
        return canvas

    elif sub_idx == 5:
        # 6. Webtoon Picture-in-Picture Prop/Expression Inset Cut
        base = crop_16x9_and_resize(cell, 0.02, 0.0, 0.98, 0.96)
        inset_src = next_cell if (scene_idx % 2 == 0) else cell
        inset = crop_16x9_and_resize(inset_src, 0.18, 0.12, 0.82, 0.84).resize((290, 164), Image.Resampling.LANCZOS)

        ix, iy = WIDTH - 312, HEIGHT - 188
        draw = ImageDraw.Draw(base)
        draw.rectangle([ix - 4, iy - 4, ix + 294, iy + 168], fill=(12, 10, 12), outline=(215, 195, 150), width=2)
        base.paste(inset, (ix, iy))
        return base

    else:
        # 7. Upper/Lower Widescreen Cinematic Pan
        shift = min(0.12, (sub_idx - 5) * 0.03)
        return crop_16x9_and_resize(cell, 0.05 + shift, 0.02, 0.95 - shift * 0.5, 0.88)


def frame_webtoon_scene(panel_img: Image.Image, ep_num: int, scene_idx: int, out_file: Path) -> int:
    comp = panel_img.convert("RGBA")
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)

    # Top & bottom webtoon letterbox trim & 1px hairline border
    odraw.rectangle([0, 0, WIDTH, 18], fill=(10, 9, 9, 148))
    odraw.rectangle([0, HEIGHT - 14, WIDTH, HEIGHT], fill=(10, 9, 9, 148))
    odraw.rectangle([0, 0, WIDTH - 1, HEIGHT - 1], outline=(45, 42, 40, 210), width=1)

    font_mono = ImageFont.truetype(FONT_MONO, 10)
    odraw.text((WIDTH - 12, 9), f"EP.{ep_num:02d} · CUT {scene_idx:02d}", fill=(205, 198, 185, 180), font=font_mono, anchor="rm")
    odraw.text((12, 9), "SNSHERO WEBTOON", fill=(175, 165, 145, 165), font=font_mono, anchor="lm")

    final_rgb = Image.alpha_composite(comp, overlay).convert("RGB")
    return save_webp_under_limit(final_rgb, out_file)


def build_episode_01(ep_data: dict) -> tuple[int, list[int], set[str]]:
    out_dir = WEBTOON_DIR / "episode_01"
    out_dir.mkdir(parents=True, exist_ok=True)

    sheets = []
    for i in range(1, 7):
        sp = RAW_EP01_DIR / f"sheet_{i:02d}.png"
        cells = extract_raw_cells(sp)
        sheets.append([crop_16x9_and_resize(c) for c in cells])

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
        out_file = out_dir / f"scene_{idx:02d}.webp"
        panel = scene_to_panel[idx]
        if idx == 0:
            sz = render_english_title_card(panel, 1, ep_data, out_file)
        else:
            sz = frame_webtoon_scene(panel, 1, idx, out_file)
        sizes.append(sz)
        hashes.add(hashlib.sha256(out_file.read_bytes()).hexdigest())

    return 50, sizes, hashes


def build_episode_n(ep_num: int, ep_data: dict) -> tuple[int, list[int], set[str]]:
    out_dir = WEBTOON_DIR / f"episode_{ep_num:02d}"
    out_dir.mkdir(parents=True, exist_ok=True)

    sheet_path = RAW_ALL_DIR / f"ep{ep_num:02d}_sheet.png"
    if not sheet_path.exists():
        raise FileNotFoundError(f"Missing sheet for EP {ep_num:02d}: {sheet_path}")

    raw_cells = extract_raw_cells(sheet_path)
    images_list = ep_data.get("images", [])
    total_scenes = len(images_list) if images_list else int(ep_data.get("totalImages", 50))
    n_narrative = total_scenes - 1  # scene_01 .. scene_{total_scenes-1}

    # Group narrative scenes across the 9 panels
    panel_buckets: dict[int, list[int]] = {p: [] for p in range(9)}
    for idx in range(1, total_scenes):
        p = min(8, int((idx - 1) * 9 / max(1, n_narrative)))
        panel_buckets[p].append(idx)

    scene_to_p_sub: dict[int, tuple[int, int]] = {}
    for p, idx_list in panel_buckets.items():
        for sub_idx, idx in enumerate(idx_list):
            scene_to_p_sub[idx] = (p, sub_idx)

    sizes = []
    hashes = set()

    # Scene 00: English-only title card using a dramatic composite of Panel 0 and Panel 8
    cover_base = compose_webtoon_cut(raw_cells, 0, 4, 0)
    out_00 = out_dir / "scene_00.webp"
    sz0 = render_english_title_card(cover_base, ep_num, ep_data, out_00)
    sizes.append(sz0)
    hashes.add(hashlib.sha256(out_00.read_bytes()).hexdigest())

    # Scenes 01 .. total_scenes - 1
    for idx in range(1, total_scenes):
        p, sub_idx = scene_to_p_sub[idx]
        cut_img = compose_webtoon_cut(raw_cells, p, sub_idx, idx)
        out_file = out_dir / f"scene_{idx:02d}.webp"
        sz = frame_webtoon_scene(cut_img, ep_num, idx, out_file)
        sizes.append(sz)
        hashes.add(hashlib.sha256(out_file.read_bytes()).hexdigest())

    return total_scenes, sizes, hashes


def main():
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    total_files = 0
    all_sizes = []
    global_hashes = set()

    for ep_num in range(1, 41):
        ep_data = manifest[str(ep_num)]
        title_en = ep_data.get("episodeTitle", f"Episode {ep_num}").strip()
        en_caption = f"SNSHERO · EPISODE {ep_num:02d} - {title_en}"
        if ep_data.get("images") and len(ep_data["images"]) > 0:
            img0 = ep_data["images"][0]
            img0["narrationKo"] = en_caption
            img0["narrationEn"] = en_caption
            img0["dialogues"] = []

        if ep_num == 1:
            cnt, sizes, hashes = build_episode_01(ep_data)
        else:
            cnt, sizes, hashes = build_episode_n(ep_num, ep_data)
        total_files += cnt
        all_sizes.extend(sizes)
        global_hashes.update(hashes)
        print(f"[EP {ep_num:02d}] Built {cnt} scenes | Unique hashes: {len(hashes)}/{cnt} | Max size: {max(sizes):,} B")

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print("=" * 68)
    print(f"COMPLETED ALL 40 EPISODES: {total_files} total WebP scenes")
    print(f"Global unique SHA-256 hashes: {len(global_hashes)} / {total_files}")
    print(f"Size stats: min={min(all_sizes):,} B, avg={sum(all_sizes)//len(all_sizes):,} B, max={max(all_sizes):,} B")


if __name__ == "__main__":
    main()
