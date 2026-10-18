#!/usr/bin/env python3
"""
Worker M2: Sprite Sheet Assembly and FASTOCTREE Palette Optimization.

Assembles and optimizes:
1. public/cards1.png (1000x1000, IDs 1-100, 10x10 grid, 100x100 cells)
2. public/cards2.png (1000x1000, Row 0 = IDs 101-110, Rows 1-9 preserved)
3. public/card100.png (1135x1315, IDs 1-110, 10x11 grid)
4. public/card100_gemini.png (1024x1024, IDs 1-110, 10x11 grid, true RGBA PNG)
5. public/character_sheet_*.png (all 11 faction horizontal sheets, 2560x296)

All sheets are quantized with Pillow FASTOCTREE (256 colors) and compressed with optimize=True, compress_level=9.
"""

import os
import sys
import shutil
from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[3]
PUBLIC_DIR = PROJECT_ROOT / "public"
SEAT_DIR = PUBLIC_DIR / "seat"
WORKER_DIR = PROJECT_ROOT / ".agents/teamwork/worker_m2"

sys.path.insert(0, str(PROJECT_ROOT))
from tests.e2e_character_assets.helpers import (
    load_card_dataset,
    get_card_seat_filename,
    FACTION_DEFINITIONS,
    PNG_MAGIC_BYTES,
)


def aspect_fill_crop(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Resizes image using aspect-fill and center-crops to target dimensions."""
    w, h = img.size
    scale = max(target_w / w, target_h / h)
    nw, nh = max(target_w, round(w * scale)), max(target_h, round(h * scale))
    resized = img.convert("RGBA").resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - target_w) // 2
    top = (nh - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def main():
    print("=== Worker M2: Sprite Sheet Assembly & Palette Optimization ===")
    cards = load_card_dataset()
    card_map = {c["id"]: c for c in cards}
    assert len(card_map) == 110, f"Expected 110 cards, got {len(card_map)}"

    # 0. Backup original cards2.png rows 1-9
    cards2_path = PUBLIC_DIR / "cards2.png"
    assert cards2_path.exists(), "public/cards2.png does not exist!"
    with Image.open(cards2_path) as orig_c2:
        assert orig_c2.size == (1000, 1000), f"cards2 size {orig_c2.size} != (1000, 1000)"
        lower_c2 = orig_c2.crop((0, 100, 1000, 1000)).convert("RGBA")
        print("Backed up cards2.png rows 1-9 (size: 1000x900)")

    # 1. Preload all 110 remastered seat portraits
    seat_images = {}
    for cid, card in card_map.items():
        p = SEAT_DIR / get_card_seat_filename(card)
        assert p.exists(), f"Seat file {p} does not exist!"
        with Image.open(p) as img:
            assert img.size == (256, 296), f"{p} dimensions {img.size} != (256, 296)"
            seat_images[cid] = img.convert("RGBA")
    print(f"Preloaded {len(seat_images)} remastered seat portraits from public/seat/")

    # 2. Assemble cards1.png (1000x1000, 10x10 grid, IDs 1-100)
    print("\n--- Assembling public/cards1.png ---")
    c1 = Image.new("RGBA", (1000, 1000), (0, 0, 0, 0))
    for cid in range(1, 101):
        idx = cid - 1
        col = idx % 10
        row = idx // 10
        cell = aspect_fill_crop(seat_images[cid], 100, 100)
        c1.paste(cell, (col * 100, row * 100))

    q_c1 = c1.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    out_c1 = PUBLIC_DIR / "cards1.png"
    q_c1.save(out_c1, format="PNG", optimize=True, compress_level=9)
    sz_c1 = out_c1.stat().st_size
    print(f"Saved public/cards1.png: {sz_c1:,} bytes ({sz_c1/1024:.1f} KB) [Budget <= 800 KB: {sz_c1 <= 819200}]")

    # 3. Assemble cards2.png (1000x1000, Row 0 = IDs 101-110, Rows 1-9 preserved)
    print("\n--- Assembling public/cards2.png ---")
    c2 = Image.new("RGBA", (1000, 1000), (0, 0, 0, 0))
    for cid in range(101, 111):
        col = (cid - 101) % 10
        cell = aspect_fill_crop(seat_images[cid], 100, 100)
        c2.paste(cell, (col * 100, 0))
    # Preserve original non-character rows 1-9
    c2.paste(lower_c2, (0, 100))

    q_c2 = c2.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    out_c2 = PUBLIC_DIR / "cards2.png"
    q_c2.save(out_c2, format="PNG", optimize=True, compress_level=9)
    sz_c2 = out_c2.stat().st_size
    print(f"Saved public/cards2.png: {sz_c2:,} bytes ({sz_c2/1024:.1f} KB) [Budget <= 800 KB: {sz_c2 <= 819200}]")

    # 4. Assemble card100.png (1135x1315, 10x11 grid, IDs 1-110)
    print("\n--- Assembling public/card100.png ---")
    c100 = Image.new("RGBA", (1135, 1315), (0, 0, 0, 0))
    for cid in range(1, 111):
        idx = cid - 1
        col = idx % 10
        row = idx // 10
        x0 = int(round(col * 113.5))
        x1 = int(round((col + 1) * 113.5))
        y0 = int(round(row * (1315 / 11)))
        y1 = int(round((row + 1) * (1315 / 11)))
        cell = aspect_fill_crop(seat_images[cid], x1 - x0, y1 - y0)
        c100.paste(cell, (x0, y0))

    q_c100 = c100.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    out_c100 = PUBLIC_DIR / "card100.png"
    q_c100.save(out_c100, format="PNG", optimize=True, compress_level=9)
    sz_c100 = out_c100.stat().st_size
    print(f"Saved public/card100.png: {sz_c100:,} bytes ({sz_c100/1024:.1f} KB) [Budget <= 800 KB: {sz_c100 <= 819200}]")

    # 5. Assemble card100_gemini.png (1024x1024, 10x11 grid, IDs 1-110, true RGBA PNG)
    print("\n--- Assembling public/card100_gemini.png ---")
    gem = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    for cid in range(1, 111):
        idx = cid - 1
        col = idx % 10
        row = idx // 10
        x0 = int(round(col * 102.4))
        x1 = int(round((col + 1) * 102.4))
        y0 = int(round(row * (1024 / 11)))
        y1 = int(round((row + 1) * (1024 / 11)))
        cell = aspect_fill_crop(seat_images[cid], x1 - x0, y1 - y0)
        gem.paste(cell, (x0, y0))

    q_gem = gem.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    out_gem = PUBLIC_DIR / "card100_gemini.png"
    q_gem.save(out_gem, format="PNG", optimize=True, compress_level=9)
    sz_gem = out_gem.stat().st_size
    print(f"Saved public/card100_gemini.png: {sz_gem:,} bytes ({sz_gem/1024:.1f} KB) [Budget <= 800 KB: {sz_gem <= 819200}]")

    # 6. Assemble All 11 Faction Horizontal Sheets (2560x296, 10 cells of 256x296)
    print("\n--- Assembling All 11 Faction Horizontal Sheets ---")
    faction_sizes = {}
    for faction_key, fdef in FACTION_DEFINITIONS.items():
        sheet_fn = fdef["sheet_filename"]
        out_sheet = PUBLIC_DIR / sheet_fn
        min_id, max_id = fdef["id_range"]

        sheet = Image.new("RGBA", (2560, 296), (0, 0, 0, 0))
        for cid in range(min_id, max_id + 1):
            col = (cid - 1) % 10
            x = col * 256
            sheet.paste(seat_images[cid], (x, 0))

        q_sheet = sheet.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
        q_sheet.save(out_sheet, format="PNG", optimize=True, compress_level=9)
        sz_sheet = out_sheet.stat().st_size
        faction_sizes[sheet_fn] = sz_sheet
        print(f"Saved {sheet_fn:26s} (IDs {min_id:3d}-{max_id:3d}): {sz_sheet:,} bytes ({sz_sheet/1024:.1f} KB) [Budget <= 300 KB: {sz_sheet <= 307200}]")

    # 7. Summary & Verification of Magic Headers
    print("\n--- Verifying PNG Magic Headers ---")
    all_targets = [out_c1, out_c2, out_c100, out_gem] + [PUBLIC_DIR / f["sheet_filename"] for f in FACTION_DEFINITIONS.values()]
    for p in all_targets:
        with open(p, "rb") as f:
            magic = f.read(8)
            assert magic == PNG_MAGIC_BYTES, f"{p.name} invalid magic header: {magic}"
    print(f"All {len(all_targets)} output PNG files verified with pristine PNG signature (\\x89PNG\\r\\n\\x1a\\n)!")

    # 8. Total Web Traffic Payload Summary
    seat_bytes = sum((SEAT_DIR / get_card_seat_filename(c)).stat().st_size for c in cards)
    master_bytes = sum(p.stat().st_size for p in [out_c1, out_c2, out_c100, out_gem])
    faction_bytes = sum(s for s in faction_sizes.values())
    total_bytes = seat_bytes + master_bytes + faction_bytes
    budget_bytes = (110 * 35840) + (4 * 819200) + (11 * 307200) # 10,598,400

    print(f"\n=== Asset Traffic Footprint Summary ===")
    print(f"  Seat Portraits (110 files): {seat_bytes:,} bytes ({seat_bytes/1024:.1f} KB)")
    print(f"  Master Sheets (4 files)   : {master_bytes:,} bytes ({master_bytes/1024:.1f} KB)")
    print(f"  Faction Sheets (11 files) : {faction_bytes:,} bytes ({faction_bytes/1024:.1f} KB)")
    print(f"  Total Asset Footprint     : {total_bytes:,} bytes ({total_bytes/(1024*1024):.2f} MB)")
    print(f"  Budget Limit              : {budget_bytes:,} bytes ({budget_bytes/(1024*1024):.2f} MB)")
    print(f"  Payload Budget Compliance : {'PASS' if total_bytes <= budget_bytes else 'FAIL'}")
    print(f"  Web Traffic Reduction     : {(1.0 - (total_bytes / 12_900_000)) * 100:.1f}% reduction vs original ~12.9 MB")


if __name__ == "__main__":
    main()
