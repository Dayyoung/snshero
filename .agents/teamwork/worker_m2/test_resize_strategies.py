import os
import json
from pathlib import Path
from PIL import Image
import numpy as np

# Load card dataset
dataset_path = Path(".agents/teamwork/explorer_survey_1/cards_dataset.json")
with open(dataset_path, "r", encoding="utf-8") as f:
    cards = json.load(f)["cards"]

print(f"Loaded {len(cards)} cards")

# Test similarity of seat portraits with aspect-fill vs aspect-fit vs direct resize
from tests.e2e_character_assets.helpers import calculate_image_similarity, get_card_seat_filename

sample_ids = [1, 10, 25, 50, 75, 100, 101, 105, 110]
for cid in sample_ids:
    card = next(c for c in cards if c["id"] == cid)
    seat_fn = get_card_seat_filename(card)
    seat_p = Path("public/seat") / seat_fn
    with Image.open(seat_p) as seat_img:
        # Method 1: direct resize to 100x100
        m1 = seat_img.convert("RGBA").resize((100, 100), Image.Resampling.LANCZOS)
        sim1 = calculate_image_similarity(m1, seat_img)

        # Method 2: aspect-fill center-crop to 100x100
        w, h = seat_img.size # 256, 296
        # scale such that min(w, h) >= 100
        scale = max(100 / w, 100 / h) # 100 / 256 = 0.390625
        nw, nh = round(w * scale), round(h * scale)
        scaled = seat_img.convert("RGBA").resize((nw, nh), Image.Resampling.LANCZOS)
        left = (nw - 100) // 2
        top = (nh - 100) // 2
        m2 = scaled.crop((left, top, left + 100, top + 100))
        sim2 = calculate_image_similarity(m2, seat_img)

        # Method 3: aspect-fit inside 100x100 with transparent padding
        scale_fit = min(100 / w, 100 / h) # 100 / 296
        fw, fh = round(w * scale_fit), round(h * scale_fit)
        fitted = seat_img.convert("RGBA").resize((fw, fh), Image.Resampling.LANCZOS)
        m3 = Image.new("RGBA", (100, 100), (0, 0, 0, 0))
        m3.paste(fitted, ((100 - fw) // 2, (100 - fh) // 2))
        sim3 = calculate_image_similarity(m3, seat_img)

        print(f"ID {cid:3d} ({card['title_en']:15s}): Direct={sim1:.3f}, AspectFill={sim2:.3f}, AspectFit={sim3:.3f}")
