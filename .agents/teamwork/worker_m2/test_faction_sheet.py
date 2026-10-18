import json
from pathlib import Path
from PIL import Image
from tests.e2e_character_assets.helpers import (
    calculate_image_similarity,
    get_card_seat_filename,
    load_card_dataset,
    FACTION_DEFINITIONS
)

cards = load_card_dataset()
water_cards = [c for c in cards if 1 <= c["id"] <= 10]

# Create 2560x296 RGBA canvas
sheet = Image.new("RGBA", (2560, 296), (0, 0, 0, 0))
for c in water_cards:
    col = (c["id"] - 1) % 10
    seat_fn = get_card_seat_filename(c)
    seat_p = Path("public/seat") / seat_fn
    with Image.open(seat_p) as p_img:
        sheet.paste(p_img.convert("RGBA"), (col * 256, 0))

# Test saving as FASTOCTREE
q_sheet = sheet.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
import io
buf = io.BytesIO()
q_sheet.save(buf, format="PNG", optimize=True, compress_level=9)
print(f"Quantized water sheet size: {len(buf.getvalue()):,} bytes ({len(buf.getvalue())/1024:.1f} KB)")

# Reload and test similarity for all 10 cards
buf.seek(0)
reloaded = Image.open(buf)
for c in water_cards:
    col = (c["id"] - 1) % 10
    cell = reloaded.crop((col * 256, 0, (col + 1) * 256, 296))
    seat_fn = get_card_seat_filename(c)
    with Image.open(Path("public/seat") / seat_fn) as seat_img:
        sim = calculate_image_similarity(cell, seat_img)
        print(f"ID {c['id']:2d} ({c['title_en']:12s}): sim = {sim:.4f}")
