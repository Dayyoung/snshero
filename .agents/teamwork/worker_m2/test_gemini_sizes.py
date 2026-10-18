import io
from pathlib import Path
from PIL import Image
from tests.e2e_character_assets.helpers import (
    load_card_dataset,
    get_card_seat_filename,
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

seat_images = {}
for cid, card in card_map.items():
    p = Path("public/seat") / get_card_seat_filename(card)
    seat_images[cid] = Image.open(p).convert("RGBA")

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

# Test direct RGBA save
buf_rgba = io.BytesIO()
gem.save(buf_rgba, format="PNG", optimize=True, compress_level=9)
sz_rgba = len(buf_rgba.getvalue())
print(f"Direct RGBA card100_gemini.png size: {sz_rgba:,} bytes ({sz_rgba/1024:.1f} KB)")

# Test FASTOCTREE mode P save
q_gem = gem.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
buf_p = io.BytesIO()
q_gem.save(buf_p, format="PNG", optimize=True, compress_level=9)
sz_p = len(buf_p.getvalue())
print(f"FASTOCTREE card100_gemini.png size: {sz_p:,} bytes ({sz_p/1024:.1f} KB)")
