#!/usr/bin/env python3
"""
Build high-CTR YouTube Thumbnails (1280x720, <2MB JPG + PNG) for the
SNSHero 40-Episode Animation & AI Web Card Battle promotional video.
Outputs:
- /Users/dayyoung/Downloads/SNSHero_Animation_Promo_Thumbnail_KO.jpg (& .png)
- /Users/dayyoung/Downloads/SNSHero_Animation_Promo_Thumbnail_EN.jpg (& .png)
- /Users/dayyoung/project/snshero/public/video/SNSHero_Animation_Promo_Thumbnail.jpg
"""

import math
import shutil
import subprocess
from pathlib import Path
from typing import Tuple
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
ANIM_DIR = PROJECT_ROOT / "public" / "video" / "animation"
SEAT_DIR = PROJECT_ROOT / "public" / "seat"
WORK_DIR = Path("/tmp/snshero_thumb_work")

DOWNLOADS_DIR = Path("/Users/dayyoung/Downloads")
PUBLIC_VIDEO_DIR = PROJECT_ROOT / "public" / "video"
ARTIFACT_DIR = Path("/Users/dayyoung/.gemini/antigravity/brain/2ea9d3e0-d54e-4d74-a021-5bc044369600")

FONT_SERIF_BOLD = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
FONT_KR = "/System/Library/Fonts/AppleSDGothicNeo.ttc"


def get_font(path: str, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            return ImageFont.load_default()


def draw_star_polygon(
    draw: ImageDraw.ImageDraw,
    cx: float,
    cy: float,
    outer_r: float,
    inner_r: float,
    fill: Tuple[int, int, int, int],
) -> None:
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * (math.pi / 5)
        r = outer_r if i % 2 == 0 else inner_r
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    draw.polygon(pts, fill=fill)


def draw_play_icon(
    draw: ImageDraw.ImageDraw,
    cx: int,
    cy: int,
    r: int,
    bg_fill: Tuple[int, int, int, int],
    fg_fill: Tuple[int, int, int, int],
) -> None:
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=bg_fill)
    pts = [
        (cx - int(r * 0.35), cy - int(r * 0.50)),
        (cx - int(r * 0.35), cy + int(r * 0.50)),
        (cx + int(r * 0.52), cy),
    ]
    draw.polygon(pts, fill=fg_fill)


def extract_frame(ep_num: int, timestamp_sec: float, out_png: Path) -> Image.Image:
    matches = sorted(ANIM_DIR.glob(f"SNSHero.com_E{ep_num}_*.mp4"))
    if not matches:
        return Image.new("RGB", (640, 360), (18, 24, 38))
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            f"{timestamp_sec:.2f}",
            "-i",
            str(matches[0]),
            "-frames:v",
            "1",
            "-q:v",
            "2",
            str(out_png),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return Image.open(out_png).convert("RGB")


def draw_text_with_stroke(
    draw: ImageDraw.ImageDraw,
    pos: Tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: Tuple[int, int, int],
    stroke_fill: Tuple[int, int, int] = (8, 10, 18),
    stroke_width: int = 6,
    shadow_offset: Tuple[int, int] = (4, 5),
) -> None:
    x, y = pos
    sx, sy = shadow_offset
    if sx or sy:
        draw.text(
            (x + sx, y + sy),
            text,
            font=font,
            fill=(0, 0, 0),
            stroke_width=stroke_width + 2,
            stroke_fill=(0, 0, 0),
        )
    draw.text(
        (x, y),
        text,
        font=font,
        fill=fill,
        stroke_width=stroke_width,
        stroke_fill=stroke_fill,
    )


def make_ssr_card(
    png_name: str,
    hero_name: str,
    pwr_str: str,
    elem_color: Tuple[int, int, int],
    size: Tuple[int, int] = (230, 330),
) -> Image.Image:
    w, h = size
    card = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(card)

    # Outer gold border + dark interior
    draw.rounded_rectangle([0, 0, w - 1, h - 1], radius=12, fill=(16, 20, 32, 255), outline=(245, 205, 105, 255), width=5)
    draw.rounded_rectangle([7, 7, w - 8, h - 8], radius=8, outline=elem_color + (220,), width=2)

    # Portrait
    p_path = SEAT_DIR / png_name
    if p_path.exists():
        p_img = Image.open(p_path).convert("RGBA")
        p_img = p_img.resize((w - 20, h - 84), Image.Resampling.LANCZOS)
        bg = Image.new("RGBA", p_img.size, (20, 26, 42, 255))
        merged = Image.alpha_composite(bg, p_img)
        card.paste(merged, (10, 38))

    # Top SSR header bar with vector gold star
    draw.rectangle([8, 8, w - 9, 38], fill=(38, 28, 14, 245))
    draw_star_polygon(draw, 22, 23, 8, 3.8, (255, 215, 70, 255))
    f_ssr = get_font(FONT_SERIF_BOLD, 16)
    f_pwr = get_font(FONT_SERIF_BOLD, 16)
    draw.text((34, 13), "SSR", font=f_ssr, fill=(255, 220, 110, 255))
    draw.text((w - 82, 13), pwr_str, font=f_pwr, fill=(255, 245, 195, 255))

    # Bottom nameplate
    draw.rectangle([8, h - 46, w - 9, h - 9], fill=(12, 15, 24, 245))
    f_name = get_font(FONT_KR, 20, index=6)
    bbox = draw.textbbox((0, 0), hero_name, font=f_name)
    tw = bbox[2] - bbox[0]
    draw.text(((w - tw) // 2, h - 39), hero_name, font=f_name, fill=(255, 250, 235, 255))

    return card


def build_thumbnail(lang: str = "ko") -> Tuple[Path, Path]:
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    canvas = Image.new("RGBA", (1280, 720), (8, 11, 20, 255))

    # 1. Extract 4 dramatic animation scenes for the background 2x2 collage (pure artwork region)
    bg_specs = [
        (1, 32.0, (0, 0)),
        (8, 52.0, (640, 0)),
        (20, 55.0, (0, 360)),
        (39, 60.0, (640, 360)),
    ]
    for ep_num, ts, (bx, by) in bg_specs:
        frame = extract_frame(ep_num, ts, WORK_DIR / f"bg_ep{ep_num}.png")
        fw, fh = frame.size
        # Crop strictly to the central pure illustration area (12%..74% height) to exclude any HUD bars
        cropped = frame.crop((int(fw * 0.04), int(fh * 0.12), int(fw * 0.96), int(fh * 0.74)))
        tile = cropped.resize((640, 360), Image.Resampling.LANCZOS)
        tile = ImageEnhance.Contrast(tile).enhance(1.18)
        tile = ImageEnhance.Color(tile).enhance(1.22)
        canvas.paste(tile.convert("RGBA"), (bx, by))

    # 2. Dark gradient & dramatic left-side vignette so typography pops with 100% clarity
    overlay = Image.new("RGBA", (1280, 720), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    for x in range(1280):
        if x < 720:
            alpha = int(218 - (x / 720.0) * 65)
        else:
            alpha = int(153 - ((x - 720) / 560.0) * 38)
        odraw.line([(x, 0), (x, 720)], fill=(7, 10, 20, alpha))

    odraw.line([(640, 0), (640, 720)], fill=(215, 180, 95, 70), width=2)
    odraw.line([(0, 360), (1280, 360)], fill=(215, 180, 95, 70), width=2)

    canvas = Image.alpha_composite(canvas, overlay)

    # 3. Composite 3 angled SSR Hero Cards on the right side (Bahamut, Celia, Kadan center front)
    card_bahamut = make_ssr_card("Bahamut.png", "바하무트" if lang == "ko" else "Bahamut", "PWR 99", (235, 85, 55), (215, 310))
    card_celia = make_ssr_card("Celia.png", "실리아" if lang == "ko" else "Celia", "PWR 95", (75, 175, 245), (215, 310))
    card_kadan = make_ssr_card("Kadan.png", "카단 (Kadan)" if lang == "ko" else "Kadan", "PWR 98", (245, 200, 85), (246, 355))

    rot_left = card_bahamut.rotate(12, expand=True, resample=Image.Resampling.BICUBIC)
    rot_right = card_celia.rotate(-12, expand=True, resample=Image.Resampling.BICUBIC)

    def paste_with_glow(base: Image.Image, fg: Image.Image, pos: Tuple[int, int]) -> None:
        alpha = fg.split()[3]
        shadow = Image.new("RGBA", fg.size, (0, 0, 0, 210))
        shadow.putalpha(alpha)
        shadow = shadow.filter(ImageFilter.GaussianBlur(10))
        base.alpha_composite(shadow, (pos[0] + 6, pos[1] + 10))
        base.alpha_composite(fg, pos)

    paste_with_glow(canvas, rot_left, (735, 155))
    paste_with_glow(canvas, rot_right, (985, 160))
    paste_with_glow(canvas, card_kadan, (868, 130))

    draw = ImageDraw.Draw(canvas)

    # 4. Outer high-impact gold frame
    draw.rectangle([10, 10, 1270, 710], outline=(245, 205, 105, 255), width=6)
    draw.rectangle([18, 18, 1262, 702], outline=(120, 95, 45, 220), width=2)

    # 5. Top-left Red/Gold Ribbon Badge with Vector Play Icon
    badge_w = 655 if lang == "ko" else 695
    draw.rounded_rectangle([42, 42, badge_w, 104], radius=8, fill=(210, 32, 38, 255), outline=(255, 225, 130, 255), width=3)
    draw_play_icon(draw, 76, 73, 18, (255, 248, 230, 255), (210, 32, 38, 255))
    f_badge = get_font(FONT_KR, 30, index=8)
    badge_txt = "공식 애니메이션 40화 × AI 카드게임" if lang == "ko" else "40 ANIME EPISODES × AI CARD GAME"
    draw.text((106, 54), badge_txt, font=f_badge, fill=(255, 252, 240, 255))

    # 6. Giant Center-Left Headlines
    if lang == "ko":
        f_h1 = get_font(FONT_KR, 78, index=8)
        f_h2 = get_font(FONT_KR, 86, index=8)
        f_h3 = get_font(FONT_SERIF_BOLD, 64)

        draw_text_with_stroke(
            draw,
            (44, 132),
            "전 40화 무료 공개!",
            f_h1,
            fill=(255, 252, 240),
            stroke_fill=(10, 12, 22),
            stroke_width=9,
        )
        draw_text_with_stroke(
            draw,
            (44, 232),
            "1초 원클릭 카드배틀",
            f_h2,
            fill=(255, 215, 75),
            stroke_fill=(20, 12, 8),
            stroke_width=10,
        )
        draw_text_with_stroke(
            draw,
            (46, 348),
            "SNSHero.com",
            f_h3,
            fill=(125, 235, 255),
            stroke_fill=(8, 14, 28),
            stroke_width=8,
        )

        # Feature bullet tags with vector gold star
        f_tag = get_font(FONT_KR, 28, index=7)
        draw.rounded_rectangle([44, 445, 695, 504], radius=6, fill=(18, 26, 44, 240), outline=(120, 200, 255, 225), width=2)
        draw_star_polygon(draw, 72, 474, 12, 5.5, (255, 215, 70, 255))
        draw.text((94, 456), "설치 0초 · 가입 0초 · 110종 전설 영웅 카드", font=f_tag, fill=(235, 248, 255, 255))
    else:
        f_h1 = get_font(FONT_SERIF_BOLD, 66)
        f_h2 = get_font(FONT_SERIF_BOLD, 74)
        f_h3 = get_font(FONT_SERIF_BOLD, 64)

        draw_text_with_stroke(
            draw,
            (44, 140),
            "40 EPISODES FREE!",
            f_h1,
            fill=(255, 252, 240),
            stroke_fill=(10, 12, 22),
            stroke_width=8,
        )
        draw_text_with_stroke(
            draw,
            (44, 235),
            "AI CARD BATTLE",
            f_h2,
            fill=(255, 215, 75),
            stroke_fill=(20, 12, 8),
            stroke_width=9,
        )
        draw_text_with_stroke(
            draw,
            (46, 345),
            "SNSHero.com",
            f_h3,
            fill=(125, 235, 255),
            stroke_fill=(8, 14, 28),
            stroke_width=8,
        )

        f_tag = get_font(FONT_SERIF_BOLD, 22)
        draw.rounded_rectangle([44, 445, 725, 504], radius=6, fill=(18, 26, 44, 240), outline=(120, 200, 255, 225), width=2)
        draw_star_polygon(draw, 72, 474, 12, 5.5, (255, 215, 70, 255))
        draw.text((94, 461), "NO DOWNLOAD · 110+ HERO CARDS · INSTANT PLAY", font=f_tag, fill=(235, 248, 255, 255))

    # 7. Bottom Full-Width Reward Callout Bar
    draw.rounded_rectangle([42, 548, 1238, 668], radius=12, fill=(18, 22, 34, 248), outline=(245, 205, 100, 255), width=4)
    draw.rounded_rectangle([54, 562, 348, 654], radius=8, fill=(245, 190, 55, 255))
    draw_star_polygon(draw, 86, 608, 16, 7.5, (20, 24, 36, 255))

    f_gift_badge = get_font(FONT_KR, 34, index=8)
    f_gift_text = get_font(FONT_KR, 34, index=8)
    f_gift_sub = get_font(FONT_KR, 23, index=6)

    if lang == "ko":
        draw.text((112, 586), "특별 보상 지급", font=f_gift_badge, fill=(15, 18, 28, 255))
        draw.text((374, 566), "접속 즉시 1,000 SNS + SSR 전설 카드 무료!", font=f_gift_text, fill=(255, 240, 130, 255))
        draw.text((374, 614), "애니메이션 매 화 시청 시 +100 SNS 추가 지급 (총 +4,000 SNS)", font=f_gift_sub, fill=(220, 235, 250, 255))
    else:
        draw.text((112, 588), "FREE BONUS", font=f_gift_badge, fill=(15, 18, 28, 255))
        draw.text((374, 568), "GET 1,000 SNS + SSR HERO CARD INSTANTLY!", font=f_gift_text, fill=(255, 240, 130, 255))
        draw.text((374, 616), "Watch 40 Anime Episodes & Earn +100 SNS Per Episode!", font=f_gift_sub, fill=(220, 235, 250, 255))

    rgb_out = canvas.convert("RGB")
    suffix = "KO" if lang == "ko" else "EN"
    out_jpg = DOWNLOADS_DIR / f"SNSHero_Animation_Promo_Thumbnail_{suffix}.jpg"
    out_png = DOWNLOADS_DIR / f"SNSHero_Animation_Promo_Thumbnail_{suffix}.png"

    rgb_out.save(out_jpg, format="JPEG", quality=95, optimize=True)
    rgb_out.save(out_png, format="PNG", optimize=True)
    return out_jpg, out_png


def main() -> None:
    ko_jpg, ko_png = build_thumbnail("ko")
    en_jpg, en_png = build_thumbnail("en")

    PUBLIC_VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ko_jpg, PUBLIC_VIDEO_DIR / "SNSHero_Animation_Promo_Thumbnail.jpg")

    if ARTIFACT_DIR.exists():
        shutil.copy2(ko_jpg, ARTIFACT_DIR / "SNSHero_Animation_Promo_Thumbnail_KO.jpg")
        shutil.copy2(en_jpg, ARTIFACT_DIR / "SNSHero_Animation_Promo_Thumbnail_EN.jpg")

    print(f"Created KO Thumbnail: {ko_jpg} ({ko_jpg.stat().st_size / 1024:.1f} KB)")
    print(f"Created EN Thumbnail: {en_jpg} ({en_jpg.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
