import warnings
from PIL import Image
from pathlib import Path
import glob

with warnings.catch_warnings(record=True) as w_list:
    warnings.simplefilter("always")
    # Check all PNGs
    for p in glob.glob("public/character_sheet_*.png") + ["public/cards1.png", "public/cards2.png", "public/card100.png", "public/card100_gemini.png"]:
        with Image.open(p) as img:
            _ = img.convert("RGBA")
    for w in w_list:
        print(f"Warning: {w.message}")
