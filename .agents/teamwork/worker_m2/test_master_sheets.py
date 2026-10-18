import io
from pathlib import Path
from PIL import Image
from tests.e2e_character_assets.helpers import (
    load_card_dataset,
    get_card_seat_filename,
    calculate_image_similarity,
)

cards = load_card_dataset()
card_map = {c["id"]: c for c in cards}

def aspect_fill_crop(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    w, h = img.size
    scale = max(target_w / w, target_h / h)
    nw, nh = max(target_w, round(w * scale)), max(target_h, round(h * scale))
    resized = img.convert("RGBA").resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - target_w) // 2
    top = (nh - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))

# Preload all seat portraits
seat_images = {}
for cid, card in card_map.items():
    p = Path("public/seat") / get_card_seat_filename(card)
    seat_images[cid] = Image.open(p).convert("RGBA")

print(f"Preloaded {len(seat_images)} seat images")

# 1. Test cards1.png (1000x1000, IDs 1-100)
c1 = Image.new("RGBA", (1000, 1000), (0, 0, 0, 0))
for cid in range(1, 101):
    idx = cid - 1
    col = idx % 10
    row = idx // 10
    cell = aspect_fill_crop(seat_images[cid], 100, 100)
    c1.paste(cell, (col * 100, row * 100))

q_c1 = c1.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
buf = io.BytesIO()
q_c1.save(buf, format="PNG", optimize=True, compress_level=9)
sz_c1 = len(buf.getvalue())
print(f"cards1.png size: {sz_c1:,} bytes ({sz_c1/1024:.1f} KB) (Budget: <= 819,200 B, PASS: {sz_c1 <= 819200})")

# 2. Test cards2.png (1000x1000, Row 0 = IDs 101-110, Rows 1-9 preserved)
with Image.open("public/cards2.png") as orig_c2:
    lower_c2 = orig_c2.crop((0, 100, 1000, 1000)).convert("RGBA")

c2 = Image.new("RGBA", (1000, 1000), (0, 0, 0, 0))
for cid in range(101, 111):
    col = (cid - 101) % 10
    cell = aspect_fill_crop(seat_images[cid], 100, 100)
    c2.paste(cell, (col * 100, 0))
c2.paste(lower_c2, (0, 100))

q_c2 = c2.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
buf = io.BytesIO()
q_c2.save(buf, format="PNG", optimize=True, compress_level=9)
sz_c2 = len(buf.getvalue())
print(f"cards2.png size: {sz_c2:,} bytes ({sz_c2/1024:.1f} KB) (Budget: <= 819,200 B, PASS: {sz_c2 <= 819200})")

# 3. Test card100.png (1135x1315, IDs 1-110)
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
buf = io.BytesIO()
q_c100.save(buf, format="PNG", optimize=True, compress_level=9)
sz_c100 = len(buf.getvalue())
print(f"card100.png size: {sz_c100:,} bytes ({sz_c100/1024:.1f} KB) (Budget: <= 819,200 B, PASS: {sz_c100 <= 819200})")

# 4. Test card100_gemini.png (1024x1024, IDs 1-110)
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
buf = io.BytesIO()
q_gem.save(buf, format="PNG", optimize=True, compress_level=9)
sz_gem = len(buf.getvalue())
print(f"card100_gemini.png size: {sz_gem:,} bytes ({sz_gem/1024:.1f} KB) (Budget: <= 819,200 B, PASS: {sz_gem <= 819200})")
