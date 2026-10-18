import io
from PIL import Image

# Create a test RGBA image with some transparent pixels
img = Image.new("RGBA", (100, 100), (0, 0, 0, 0))
img.paste(Image.new("RGBA", (50, 50), (255, 0, 0, 255)), (25, 25))

# Quantize with FASTOCTREE
q = img.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
buf = io.BytesIO()
q.save(buf, format="PNG", optimize=True, compress_level=9)
buf.seek(0)

# Reload and check
reloaded = Image.open(buf)
print(f"Reloaded format: {reloaded.format}")
print(f"Reloaded mode: {reloaded.mode}")
print(f"Reloaded info keys: {reloaded.info.keys()}")
has_alpha = reloaded.mode in ("RGBA", "LA") or (reloaded.mode == "P" and "transparency" in reloaded.info)
print(f"Has alpha: {has_alpha}")
if "transparency" in reloaded.info:
    print(f"Transparency info: {reloaded.info['transparency']}")
