from PIL import Image

with Image.open("public/cards2.png") as img:
    print(f"cards2 size: {img.size}, mode: {img.mode}, format: {img.format}")
    lower = img.crop((0, 100, 1000, 1000))
    print(f"lower size: {lower.size}, extrema: {lower.getextrema()}")
