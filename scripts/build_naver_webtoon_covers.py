#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Naver Webtoon Official Series Cover Generator
- 포스터형 (Poster): 480 x 623 px
- 가로형 (Landscape): 434 x 330 px
Rendered at 3x supersampling with crisp ufotable/theatrical Korean poster typography.
"""

import glob
import os
import shutil
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

sys.path.insert(0, "scripts")
from universal_webtoon_processor import auto_crop_letterbox, remove_kadan_forehead_scar_pil

BRAIN_DIR = "/Users/dayyoung/.gemini/antigravity/brain/dcf8e55e-cf78-47fd-96bd-ced03464aa0a"
FONT_GOTHIC = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
FONT_SANS_EN = "/System/Library/Fonts/Avenir Next.ttc"


def find_latest_image(prefix: str) -> str:
    matches = glob.glob(os.path.join(BRAIN_DIR, f"{prefix}_*.jpg")) + glob.glob(os.path.join(BRAIN_DIR, f"{prefix}_*.png"))
    if not matches:
        raise FileNotFoundError(f"No image found for prefix: {prefix}")
    matches.sort(key=os.path.getmtime, reverse=True)
    return matches[0]


def draw_tracked(
    draw: ImageDraw.ImageDraw,
    cx: float,
    y: float,
    text: str,
    font: ImageFont.FreeTypeFont,
    tracking: float,
    fill: tuple,
    stroke_width: int = 0,
    stroke_fill: tuple = (0, 0, 0, 255),
) -> float:
    widths = [font.getlength(ch) for ch in text]
    total_w = sum(widths) + tracking * max(0, len(text) - 1)
    x = cx - total_w / 2.0
    for ch, gw in zip(text, widths):
        draw.text((x, y), ch, font=font, fill=fill, stroke_width=stroke_width, stroke_fill=stroke_fill)
        x += gw + tracking
    return total_w


def render_metallic_korean_title(
    canvas: Image.Image,
    cx: float,
    y: float,
    title_text: str,
    font: ImageFont.FreeTypeFont,
    tracking: float,
    stroke_w: int,
):
    """Renders crisp white-to-icy-cyan vertical gradient poster title with deep ink rim & glow."""
    w, h = canvas.size

    # 1. Outer dark+cyan atmospheric glow shadow
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    draw_tracked(
        g_draw, cx, y + 6, title_text, font, tracking,
        fill=(0, 0, 0, 245), stroke_width=stroke_w + 10, stroke_fill=(0, 0, 0, 245)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=12))
    canvas.alpha_composite(glow)

    # 2. Deep sumi-e ink outline layer
    ink = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    i_draw = ImageDraw.Draw(ink)
    draw_tracked(
        i_draw, cx, y, title_text, font, tracking,
        fill=(10, 14, 24, 255), stroke_width=stroke_w, stroke_fill=(8, 11, 20, 255)
    )
    canvas.alpha_composite(ink)

    # 3. Metallic pure-white top -> luminous ice-cyan bottom fill mask
    mask = Image.new("L", (w, h), 0)
    m_draw = ImageDraw.Draw(mask)
    draw_tracked(m_draw, cx, y, title_text, font, tracking, fill=255, stroke_width=0)

    bbox = mask.getbbox()
    if bbox:
        _, y0, _, y1 = bbox
        grad_arr = np.zeros((h, w, 4), dtype=np.uint8)
        span = max(1.0, float(y1 - y0))
        for yy in range(y0, y1 + 1):
            t = (yy - y0) / span
            # Pure radiant white on upper 55%, subtle ice-cyan tint toward bottom edge
            r = int(round(255 - 32 * (t ** 1.8)))
            g = int(round(255 - 6 * (t ** 1.8)))
            b = 255
            grad_arr[yy, :, 0] = r
            grad_arr[yy, :, 1] = g
            grad_arr[yy, :, 2] = b
            grad_arr[yy, :, 3] = 255
        grad_im = Image.fromarray(grad_arr)
        masked_fill = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        masked_fill.paste(grad_im, (0, 0), mask)
        canvas.alpha_composite(masked_fill)


def compose_poster_480x623(src_path: str, out_dirs: list[Path]) -> list[Path]:
    target_w, target_h = 480, 623
    scale = 3
    ss_w, ss_h = target_w * scale, target_h * scale  # 1440 x 1869

    im = auto_crop_letterbox(Image.open(src_path).convert("RGB"))
    im, _ = remove_kadan_forehead_scar_pil(im)
    fitted = ImageOps.fit(im, (ss_w, ss_h), method=Image.Resampling.LANCZOS, centering=(0.5, 0.35)).convert("RGBA")

    # Smooth bottom poster vignette + subtle top vignette
    grad = np.zeros((ss_h, ss_w, 4), dtype=np.uint8)
    y_start = int(ss_h * 0.60)
    for y in range(y_start, ss_h):
        t = (y - y_start) / max(1.0, float(ss_h - 1 - y_start))
        grad[y, :, :3] = (6, 9, 17)
        grad[y, :, 3] = min(238, int(round(238 * (t ** 1.45))))
    canvas = Image.alpha_composite(fitted, Image.fromarray(grad))

    f_kicker = ImageFont.truetype(FONT_GOTHIC, 34, index=14)   # ExtraBold
    f_title = ImageFont.truetype(FONT_GOTHIC, 152, index=14)   # ExtraBold
    f_sub_en = ImageFont.truetype(FONT_SANS_EN, 30, index=2)   # Demi Bold

    cx = ss_w / 2.0
    kicker_y = ss_h - 365
    title_y = ss_h - 302
    sub_y = ss_h - 108

    # Kicker + diamond hairlines
    fg = Image.new("RGBA", (ss_w, ss_h), (0, 0, 0, 0))
    dr = ImageDraw.Draw(fg)
    kicker_str = "눈히어로 · 판타지 액션 웹툰"
    kw = draw_tracked(
        dr, cx, kicker_y, kicker_str, f_kicker, tracking=5.0,
        fill=(224, 242, 254, 245), stroke_width=4, stroke_fill=(8, 11, 20, 235)
    )
    km_y = kicker_y + 19
    gap = 28
    l_x1 = cx - kw / 2.0 - gap
    l_x0 = max(72, l_x1 - 120)
    r_x0 = cx + kw / 2.0 + gap
    r_x1 = min(ss_w - 72, r_x0 + 120)
    dr.line([(l_x0, km_y), (l_x1, km_y)], fill=(186, 230, 253, 195), width=3)
    dr.line([(r_x0, km_y), (r_x1, km_y)], fill=(186, 230, 253, 195), width=3)
    for dx_pt in (l_x1 + 8, r_x0 - 8):
        r = 6
        dr.polygon([(dx_pt, km_y - r), (dx_pt + r, km_y), (dx_pt, km_y + r), (dx_pt - r, km_y)], fill=(255, 255, 255, 230))

    draw_tracked(
        dr, cx, sub_y, "SNSHERO  ·  KADAN'S JOURNEY", f_sub_en, tracking=8.5,
        fill=(203, 213, 225, 235), stroke_width=3, stroke_fill=(8, 11, 20, 225)
    )
    canvas.alpha_composite(fg)

    # Main Poster Title: 카단의 여정
    render_metallic_korean_title(canvas, cx, title_y, "카단의 여정", f_title, tracking=8.0, stroke_w=10)

    final_im = canvas.convert("RGB").resize((target_w, target_h), Image.Resampling.LANCZOS)
    saved = []
    for od in out_dirs:
        od.mkdir(parents=True, exist_ok=True)
        p_png = od / "웹툰표지_포스터형_480x623.png"
        p_jpg = od / "웹툰표지_포스터형_480x623.jpg"
        final_im.save(p_png, "PNG", optimize=True)
        final_im.save(p_jpg, "JPEG", quality=95, subsampling=0, optimize=True)
        saved.append(p_png)
    return saved


def compose_landscape_434x330(src_path: str, out_dirs: list[Path]) -> list[Path]:
    target_w, target_h = 434, 330
    scale = 3
    ss_w, ss_h = target_w * scale, target_h * scale  # 1302 x 990

    im = auto_crop_letterbox(Image.open(src_path).convert("RGB"))
    im, _ = remove_kadan_forehead_scar_pil(im)
    fitted = ImageOps.fit(im, (ss_w, ss_h), method=Image.Resampling.LANCZOS, centering=(0.5, 0.28)).convert("RGBA")

    # Smooth lower vignette
    grad = np.zeros((ss_h, ss_w, 4), dtype=np.uint8)
    y_start = int(ss_h * 0.56)
    for y in range(y_start, ss_h):
        t = (y - y_start) / max(1.0, float(ss_h - 1 - y_start))
        grad[y, :, :3] = (6, 9, 17)
        grad[y, :, 3] = min(232, int(round(232 * (t ** 1.5))))
    canvas = Image.alpha_composite(fitted, Image.fromarray(grad))

    f_kicker = ImageFont.truetype(FONT_GOTHIC, 28, index=14)   # ExtraBold
    f_title = ImageFont.truetype(FONT_GOTHIC, 118, index=14)   # ExtraBold

    cx = ss_w / 2.0
    kicker_y = ss_h - 228
    title_y = ss_h - 178

    fg = Image.new("RGBA", (ss_w, ss_h), (0, 0, 0, 0))
    dr = ImageDraw.Draw(fg)
    kicker_str = "눈히어로 · SNSHERO"
    kw = draw_tracked(
        dr, cx, kicker_y, kicker_str, f_kicker, tracking=5.5,
        fill=(224, 242, 254, 245), stroke_width=4, stroke_fill=(8, 11, 20, 235)
    )
    km_y = kicker_y + 16
    gap = 24
    l_x1 = cx - kw / 2.0 - gap
    l_x0 = max(80, l_x1 - 110)
    r_x0 = cx + kw / 2.0 + gap
    r_x1 = min(ss_w - 80, r_x0 + 110)
    dr.line([(l_x0, km_y), (l_x1, km_y)], fill=(186, 230, 253, 195), width=3)
    dr.line([(r_x0, km_y), (r_x1, km_y)], fill=(186, 230, 253, 195), width=3)
    for dx_pt in (l_x1 + 7, r_x0 - 7):
        r = 5
        dr.polygon([(dx_pt, km_y - r), (dx_pt + r, km_y), (dx_pt, km_y + r), (dx_pt - r, km_y)], fill=(255, 255, 255, 230))
    canvas.alpha_composite(fg)

    render_metallic_korean_title(canvas, cx, title_y, "카단의 여정", f_title, tracking=6.5, stroke_w=9)

    final_im = canvas.convert("RGB").resize((target_w, target_h), Image.Resampling.LANCZOS)
    saved = []
    for od in out_dirs:
        od.mkdir(parents=True, exist_ok=True)
        p_png = od / "웹툰표지_가로형_434x330.png"
        p_jpg = od / "웹툰표지_가로형_434x330.jpg"
        final_im.save(p_png, "PNG", optimize=True)
        final_im.save(p_jpg, "JPEG", quality=95, subsampling=0, optimize=True)
        saved.append(p_png)
    return saved


def main():
    poster_src = find_latest_image("naver_cover_poster_raw")
    land_src = find_latest_image("naver_cover_landscape_raw")
    out_dirs = [
        Path("exports/naver_webtoon"),
        Path(os.path.expanduser("~/Downloads")),
        Path("dist/naver-webtoon"),
    ]
    p_saved = compose_poster_480x623(poster_src, out_dirs)
    l_saved = compose_landscape_434x330(land_src, out_dirs)
    im_p = Image.open(p_saved[0])
    im_l = Image.open(l_saved[0])
    print(f"Poster Cover: {p_saved[0]} -> {im_p.size} ({round(p_saved[0].stat().st_size/1024, 1)} KB)")
    print(f"Landscape Cover: {l_saved[0]} -> {im_l.size} ({round(l_saved[0].stat().st_size/1024, 1)} KB)")


if __name__ == "__main__":
    main()
