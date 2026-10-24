#!/usr/bin/env python3
"""
Slices a newly generated 3x3 16:9 multi-character AI storybook sheet
(public/images/storybook/raw_sheets/epXX_storybook_sheet.png)
into 10 Picture-Book WebP illustrations (public/images/storybook/ep_XX/page_01..10.webp)
with participating character portrait medallions and header bar.
"""

import json
import re
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFont

PROJECT_ROOT = Path(__file__).resolve().parent.parent
STORYBOOK_DIR = PROJECT_ROOT / "public" / "images" / "storybook"
RAW_SHEETS_DIR = STORYBOOK_DIR / "raw_sheets"
SCRIPT_TS_PATH = PROJECT_ROOT / "src" / "content" / "kadanRpgNovelScript.ts"
FONT_MONO = "/System/Library/Fonts/Supplemental/Andale Mono.ttf"
WIDTH, HEIGHT = 800, 450


def extract_3x3_cells(sheet_path: Path) -> list[Image.Image]:
    img = Image.open(sheet_path).convert("RGB")
    w, h = img.size
    cell_w = w / 3.0
    cell_h = h / 3.0
    cells = []
    for r in range(3):
        for c in range(3):
            x0 = int(r_c_val := c * cell_w) + 6
            y0 = int(r * cell_h) + 6
            x1 = int((c + 1) * cell_w) - 6
            y1 = int((r + 1) * cell_h) - 6
            sub = img.crop((x0, y0, x1, y1))
            cw, ch = sub.size
            target_ratio = WIDTH / HEIGHT
            curr_ratio = cw / ch
            if curr_ratio > target_ratio:
                nw = int(ch * target_ratio)
                ox = (cw - nw) // 2
                sub = sub.crop((ox, 0, ox + nw, ch))
            elif curr_ratio < target_ratio:
                nh = int(cw / target_ratio)
                oy = (ch - nh) // 2
                sub = sub.crop((0, oy, cw, oy + nh))
            panel = sub.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
            panel = ImageEnhance.Contrast(panel).enhance(1.04)
            panel = ImageEnhance.Sharpness(panel).enhance(1.06)
            cells.append(panel)
    return cells


def frame_storybook_panel(panel: Image.Image, ep_num: int, page_num: int, total_pages: int, chars: list[dict], is_choice: bool, out_webp: Path):
    base = panel.convert("RGBA")
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)

    odraw.rectangle([0, 0, WIDTH, 24], fill=(15, 13, 13, 210))
    odraw.line([(0, 24), (WIDTH, 24)], fill=(215, 195, 150, 175), width=1)

    try:
        font_mono = ImageFont.truetype(FONT_MONO, 11)
    except Exception:
        font_mono = ImageFont.load_default()

    char_names_en = " · ".join(c["nameEn"].upper() for c in chars[:3])
    left_label = f"SNSHERO PICTURE BOOK · EP.{ep_num:02d}"
    right_label = f"SCENE {page_num:02d}/{total_pages:02d} · {'FATE DECISION' if is_choice else char_names_en}"
    odraw.text((12, 12), left_label, fill=(235, 220, 185, 240), font=font_mono, anchor="lm")
    odraw.text((WIDTH - 12, 12), right_label, fill=(210, 205, 195, 230), font=font_mono, anchor="rm")

    comp = Image.alpha_composite(base, overlay)

    shown_chars = chars[:4]
    badge_size = 50
    gap = 6
    start_x = WIDTH - 10 - (len(shown_chars) * (badge_size + gap)) + gap
    by = HEIGHT - badge_size - 8

    for idx, ch in enumerate(shown_chars):
        bx = start_x + idx * (badge_size + gap)
        seat_path = PROJECT_ROOT / "public" / ch["seatAsset"].lstrip("/")
        if not seat_path.exists():
            continue
        try:
            b_bg = Image.new("RGBA", (badge_size, badge_size), (18, 16, 16, 215))
            b_draw = ImageDraw.Draw(b_bg)
            border_col = (245, 190, 75, 255) if ch.get("isSpeaker") else (165, 155, 140, 200)
            b_draw.rectangle([0, 0, badge_size - 1, badge_size - 1], outline=border_col, width=2 if ch.get("isSpeaker") else 1)

            sp = Image.open(seat_path).convert("RGBA")
            alpha = sp.getchannel("A")
            bbox = alpha.getbbox()
            if bbox:
                sp = sp.crop(bbox)
            sp.thumbnail((badge_size - 6, badge_size - 6), Image.Resampling.LANCZOS)
            sx = (badge_size - sp.width) // 2
            sy = (badge_size - sp.height) // 2
            b_bg.paste(sp, (sx, sy), sp)
            comp.paste(b_bg, (bx, by), b_bg)
        except Exception:
            pass

    cdraw = ImageDraw.Draw(comp)
    cdraw.rectangle([0, 0, WIDTH - 1, HEIGHT - 1], outline=(55, 50, 45, 230), width=1)
    cdraw.rectangle([3, 27, WIDTH - 4, HEIGHT - 4], outline=(215, 195, 150, 110), width=1)

    out_webp.parent.mkdir(parents=True, exist_ok=True)
    final_rgb = comp.convert("RGB")
    for q in [84, 80, 76, 72, 68]:
        final_rgb.save(out_webp, "WEBP", quality=q, method=5)
        if out_webp.stat().st_size <= 78000:
            break


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/bake_ai_storybook_sheet.py <ep_num>")
        sys.exit(1)
    ep_num = int(sys.argv[1])
    sheet_path = RAW_SHEETS_DIR / f"ep{ep_num:02d}_storybook_sheet.png"
    if not sheet_path.exists():
        print(f"Sheet not found: {sheet_path}")
        sys.exit(1)

    raw_ts = SCRIPT_TS_PATH.read_text(encoding="utf-8")
    m = re.search(r"export const KADAN_RPG_NOVEL_SCRIPTS: Record<number, KadanRpgDialogLine\[\]> = (\{.*\});\s*$", raw_ts, re.S)
    if not m:
        print("Could not parse KADAN_RPG_NOVEL_SCRIPTS")
        sys.exit(1)
    scripts = json.loads(m.group(1))
    ep_lines = scripts.get(str(ep_num), [])
    if not ep_lines:
        print(f"No lines for EP {ep_num}")
        sys.exit(1)

    cells = extract_3x3_cells(sheet_path)
    total_pages = len(ep_lines)
    narrative_idx = 0
    for i, line in enumerate(ep_lines):
        page_num = i + 1
        is_choice = line.get("speaker") == "choice"
        chars = line.get("sceneCharacters", [])
        out_webp = STORYBOOK_DIR / f"ep_{ep_num:02d}" / f"page_{page_num:02d}.webp"
        if is_choice:
            # Blend or zoom cell 5 for the choice page
            c_base = cells[min(8, max(0, narrative_idx - 1))]
            w, h = c_base.size
            panel = c_base.crop((int(w * 0.06), int(h * 0.04), int(w * 0.94), int(h * 0.92))).resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
        else:
            panel = cells[min(8, narrative_idx)]
            narrative_idx += 1
        frame_storybook_panel(panel, ep_num, page_num, total_pages, chars, is_choice, out_webp)

    prog_path = STORYBOOK_DIR / "generation_progress.json"
    prog = {"completedEpisodes": []}
    if prog_path.exists():
        try:
            prog = json.loads(prog_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    if ep_num not in prog.get("completedEpisodes", []):
        prog.setdefault("completedEpisodes", []).append(ep_num)
        prog["completedEpisodes"].sort()
    prog_path.write_text(json.dumps(prog, indent=2), encoding="utf-8")
    print(f"Successfully baked AI storybook sheet for EP.{ep_num:02d} into {total_pages} pages!")


if __name__ == "__main__":
    main()
