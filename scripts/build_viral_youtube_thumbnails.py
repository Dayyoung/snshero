#!/usr/bin/env python3
"""
Build 3 high-CTR, seductive & provocative YouTube Ad Thumbnails (1280x720)
designed to maximize mobile & desktop In-Feed / In-Stream CTR.
"""
import os
import shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

ROOT_DIR = "/Users/dayyoung/project/snshero"
BRAIN_DIR = "/Users/dayyoung/.gemini/antigravity/brain/2ea9d3e0-d54e-4d74-a021-5bc044369600"
DOWNLOADS_DIR = "/Users/dayyoung/Downloads"
VIDEO_DIR = os.path.join(ROOT_DIR, "public", "video")
os.makedirs(VIDEO_DIR, exist_ok=True)

BG1_SRC = os.path.join(BRAIN_DIR, "thumb_bg_seductive_heroine_png_1792726193990.jpg")
BG2_SRC = os.path.join(BRAIN_DIR, "thumb_bg_ssr_awakening_png_1792726213866.jpg")

BG1_DST = os.path.join(VIDEO_DIR, "thumb_bg_seductive_heroine.jpg")
BG2_DST = os.path.join(VIDEO_DIR, "thumb_bg_ssr_awakening.jpg")

shutil.copyfile(BG1_SRC, BG1_DST)
shutil.copyfile(BG2_SRC, BG2_DST)

FONT_Candidates = [
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
]


def load_kr_font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    path = FONT_Candidates[0]
    # In AppleSDGothicNeo.ttc: index 8 is Heavy/ExtraBold, index 6 is Bold
    for idx in ([8, 6, 7, 0] if bold else [0]):
        try:
            return ImageFont.truetype(path, size, index=idx)
        except Exception:
            continue
    return ImageFont.load_default()


def draw_glow_text(
    base_img: Image.Image,
    pos: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: tuple,
    stroke_fill: tuple = (0, 0, 0, 255),
    stroke_width: int = 10,
    glow_color: tuple = (255, 0, 128, 160),
    glow_radius: int = 14,
    shadow_offset: tuple[int, int] = (5, 7),
):
    # Create glow layer
    glow_layer = Image.new("RGBA", base_img.size, (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow_layer)
    x, y = pos
    # Drop shadow
    g_draw.text(
        (x + shadow_offset[0], y + shadow_offset[1]),
        text,
        font=font,
        fill=(0, 0, 0, 230),
        stroke_width=stroke_width + 4,
        stroke_fill=(0, 0, 0, 230),
    )
    # Outer neon glow
    g_draw.text(
        (x, y),
        text,
        font=font,
        fill=glow_color,
        stroke_width=stroke_width + 6,
        stroke_fill=glow_color,
    )
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=glow_radius))
    base_img.alpha_composite(glow_layer)

    # Crisp main text on top
    draw = ImageDraw.Draw(base_img)
    draw.text(
        (x, y),
        text,
        font=font,
        fill=fill,
        stroke_width=stroke_width,
        stroke_fill=stroke_fill,
    )


def prepare_canvas(bg_path: str, saturation: float = 1.22, contrast: float = 1.12) -> Image.Image:
    img = Image.open(bg_path).convert("RGB").resize((1280, 720), Image.Resampling.LANCZOS)
    img = ImageEnhance.Color(img).enhance(saturation)
    img = ImageEnhance.Contrast(img).enhance(contrast)
    canvas = img.convert("RGBA")

    # Subtle left-side dark gradient so text pops with 100% legibility while keeping right-side heroine vivid
    grad = Image.new("RGBA", (1280, 720), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grad)
    for x in range(760):
        alpha = int(185 * (1 - (x / 760) ** 1.35))
        g_draw.line([(x, 0), (x, 720)], fill=(8, 4, 15, alpha))
    # Bottom bar gradient
    for y in range(580, 720):
        alpha = int(215 * ((y - 580) / 140))
        g_draw.line([(0, y), (1280, y)], fill=(6, 3, 12, alpha))

    canvas.alpha_composite(grad)
    return canvas


def build_type_1_seductive():
    """
    Type 1: 매혹적 히로인 대사 & 금지된 호기심 자극형
    """
    canvas = prepare_canvas(BG1_DST, saturation=1.25, contrast=1.15)
    draw = ImageDraw.Draw(canvas)

    # 1. Top Warning Pill Badge (Hot Pink / Crimson)
    badge_rect = [44, 42, 640, 106]
    draw.rounded_rectangle(badge_rect, radius=12, fill=(225, 18, 75, 248), outline=(255, 215, 235, 255), width=3)
    f_badge = load_kr_font(31, bold=True)
    draw.text((68, 56), "[주의] 후방주의! 혼자 있을 때만 켜세요", font=f_badge, fill=(255, 255, 255, 255), stroke_width=2, stroke_fill=(80, 0, 20, 255))

    # 2. Top-Right Secret SSR Stamp on Heroine side
    stamp_rect = [930, 32, 1246, 92]
    draw.rounded_rectangle(stamp_rect, radius=10, fill=(22, 10, 34, 225), outline=(255, 205, 70, 255), width=3)
    f_stamp = load_kr_font(24, bold=True)
    draw.text((954, 48), "SSR 실리아 // 호감도 MAX", font=f_stamp, fill=(255, 220, 90, 255))

    # 3. Giant Main Copy Lines (Left Side)
    f_quote = load_kr_font(56, bold=True)
    f_main1 = load_kr_font(86, bold=True)
    f_main2 = load_kr_font(92, bold=True)

    draw_glow_text(
        canvas,
        (46, 145),
        "“오빠.. 내 카드 뽑아줄 거지?”",
        f_quote,
        fill=(255, 195, 235, 255),
        stroke_fill=(25, 0, 18, 255),
        stroke_width=9,
        glow_color=(255, 30, 140, 180),
        glow_radius=14,
    )

    draw_glow_text(
        canvas,
        (44, 238),
        "1화부터 선 넘은",
        f_main1,
        fill=(255, 255, 255, 255),
        stroke_fill=(0, 0, 0, 255),
        stroke_width=13,
        glow_color=(255, 0, 100, 160),
        glow_radius=16,
    )

    draw_glow_text(
        canvas,
        (44, 348),
        "미친 몰입감..!",
        f_main2,
        fill=(255, 230, 50, 255),
        stroke_fill=(0, 0, 0, 255),
        stroke_width=14,
        glow_color=(255, 120, 0, 190),
        glow_radius=18,
    )

    # 4. Provocative Sub-hook box
    sub_rect = [46, 480, 685, 558]
    draw.rounded_rectangle(sub_rect, radius=10, fill=(25, 8, 38, 230), outline=(255, 105, 180, 240), width=3)
    f_sub = load_kr_font(33, bold=True)
    draw.text(
        (68, 501),
        "접속 즉시 [SSR 여신 카드] 100% 무료 해금!",
        font=f_sub,
        fill=(255, 240, 150, 255),
        stroke_width=3,
        stroke_fill=(0, 0, 0, 255),
    )

    # 5. Bottom Full-Width CTA Bar
    draw.rounded_rectangle([44, 616, 1236, 688], radius=12, fill=(18, 12, 28, 240), outline=(255, 200, 60, 220), width=2)
    f_cta = load_kr_font(30, bold=True)
    draw.text(
        (72, 636),
        "애니 40화 전편 무료 감상 + 설치 없는 1초 카드배틀",
        font=f_cta,
        fill=(255, 255, 255, 255),
    )

    # Right CTA Button inside bar
    draw.rounded_rectangle([815, 625, 1224, 679], radius=8, fill=(235, 25, 75, 255), outline=(255, 255, 255, 255), width=2)
    f_btn = load_kr_font(26, bold=True)
    draw.text((840, 639), "지금 무료 플레이 ▶ SNSHero.com", font=f_btn, fill=(255, 255, 255, 255))

    # Border frame
    draw.rectangle([0, 0, 1279, 719], outline=(255, 60, 140, 220), width=5)
    return canvas.convert("RGB")


def build_type_2_midnight():
    """
    Type 2: 모바일 초고클릭률 4단어 극대비 자극형 ("잠들기 전 클릭 금지! 밤샘 주의")
    """
    canvas = prepare_canvas(BG1_DST, saturation=1.30, contrast=1.18)
    draw = ImageDraw.Draw(canvas)

    # 1. Top Alert Tag
    badge_rect = [44, 42, 575, 108]
    draw.rounded_rectangle(badge_rect, radius=12, fill=(255, 195, 0, 255), outline=(255, 255, 255, 255), width=3)
    f_badge = load_kr_font(34, bold=True)
    draw.text((68, 56), "경고 // 자기 전에 절대 켜지 마세요", font=f_badge, fill=(20, 10, 10, 255))

    # 2. Ultra-Huge 2-Line Mobile Hook (Readable even on 120px mobile thumbnail!)
    f_huge1 = load_kr_font(104, bold=True)
    f_huge2 = load_kr_font(108, bold=True)

    draw_glow_text(
        canvas,
        (44, 145),
        "잠 못 자는",
        f_huge1,
        fill=(255, 255, 255, 255),
        stroke_fill=(0, 0, 0, 255),
        stroke_width=15,
        glow_color=(255, 40, 120, 180),
        glow_radius=16,
    )

    draw_glow_text(
        canvas,
        (44, 272),
        "19금급 중독성?!",
        f_huge2,
        fill=(255, 65, 125, 255),
        stroke_fill=(0, 0, 0, 255),
        stroke_width=16,
        glow_color=(255, 0, 80, 210),
        glow_radius=20,
    )

    # 3. Quote Bubble
    f_quote = load_kr_font(42, bold=True)
    draw_glow_text(
        canvas,
        (48, 425),
        "“잠깐만 보려다 40화 정주행하고 밤샜습니다..”",
        f_quote,
        fill=(255, 235, 120, 255),
        stroke_fill=(0, 0, 0, 255),
        stroke_width=8,
        glow_color=(255, 160, 0, 150),
        glow_radius=10,
    )

    # 4. Bottom Gift Pill
    draw.rounded_rectangle([44, 520, 770, 594], radius=12, fill=(210, 15, 65, 245), outline=(255, 225, 100, 255), width=3)
    f_gift = load_kr_font(34, bold=True)
    draw.text((70, 538), "지금 접속만 해도 [SSR 전설 히로인] 즉시 지급!", font=f_gift, fill=(255, 255, 255, 255), stroke_width=2, stroke_fill=(60, 0, 20, 255))

    # 5. Footer URL strip
    f_url = load_kr_font(30, bold=True)
    draw_glow_text(
        canvas,
        (48, 632),
        "설치 0초 · 무료 웹 카드배틀 & 40부작 애니 ▶ SNSHero.com",
        f_url,
        fill=(255, 255, 255, 255),
        stroke_fill=(0, 0, 0, 255),
        stroke_width=7,
        glow_color=(0, 0, 0, 200),
        glow_radius=8,
    )

    draw.rectangle([0, 0, 1279, 719], outline=(255, 200, 0, 230), width=5)
    return canvas.convert("RGB")


def build_type_3_jackpot():
    """
    Type 3: 도파민 폭발 SSR 각성 & 0.001% 사기캐 무료 유출 자극형
    """
    canvas = prepare_canvas(BG2_DST, saturation=1.25, contrast=1.15)
    draw = ImageDraw.Draw(canvas)

    # 1. Top Urgent Badge
    badge_rect = [44, 42, 615, 106]
    draw.rounded_rectangle(badge_rect, radius=12, fill=(230, 20, 35, 250), outline=(255, 230, 90, 255), width=3)
    f_badge = load_kr_font(32, bold=True)
    draw.text((68, 56), "[긴급] 운영자 실수?! 막히기 전에 받으세요", font=f_badge, fill=(255, 255, 255, 255), stroke_width=2, stroke_fill=(60, 0, 0, 255))

    # 2. Giant Main Copy
    f_sub_top = load_kr_font(54, bold=True)
    f_main1 = load_kr_font(92, bold=True)
    f_main2 = load_kr_font(96, bold=True)

    draw_glow_text(
        canvas,
        (46, 140),
        "확률 0.001% 신화 카드",
        f_sub_top,
        fill=(130, 245, 255, 255),
        stroke_fill=(0, 10, 25, 255),
        stroke_width=10,
        glow_color=(0, 180, 255, 180),
        glow_radius=14,
    )

    draw_glow_text(
        canvas,
        (44, 222),
        "접속 즉시 100%",
        f_main1,
        fill=(255, 255, 255, 255),
        stroke_fill=(0, 0, 0, 255),
        stroke_width=14,
        glow_color=(255, 150, 0, 170),
        glow_radius=16,
    )

    draw_glow_text(
        canvas,
        (44, 338),
        "무료 지급 실화?!",
        f_main2,
        fill=(255, 225, 40, 255),
        stroke_fill=(0, 0, 0, 255),
        stroke_width=15,
        glow_color=(255, 90, 0, 200),
        glow_radius=18,
    )

    # 3. Spec Box
    draw.rounded_rectangle([46, 476, 680, 558], radius=10, fill=(15, 22, 42, 235), outline=(255, 210, 60, 255), width=3)
    f_spec = load_kr_font(33, bold=True)
    draw.text(
        (68, 498),
        "전설 SSR 2장 + 1,000 SNS 정착금 즉시 입금!",
        font=f_spec,
        fill=(255, 235, 110, 255),
        stroke_width=3,
        stroke_fill=(0, 0, 0, 255),
    )

    # 4. Bottom Bar
    draw.rounded_rectangle([44, 614, 1236, 688], radius=12, fill=(12, 14, 26, 240), outline=(255, 200, 60, 220), width=2)
    f_cta = load_kr_font(29, bold=True)
    draw.text((68, 635), "대작 판타지 애니 40화 무료 + 1초 원클릭 AI 카드배틀", font=f_cta, fill=(255, 255, 255, 255))
    draw.rounded_rectangle([815, 623, 1224, 679], radius=8, fill=(255, 185, 0, 255), outline=(255, 255, 255, 255), width=2)
    f_btn = load_kr_font(26, bold=True)
    draw.text((840, 637), "1초 만에 보상 받기 ▶ SNSHero.com", font=f_btn, fill=(15, 10, 10, 255))

    draw.rectangle([0, 0, 1279, 719], outline=(255, 205, 50, 230), width=5)
    return canvas.convert("RGB")


def save_all():
    t1 = build_type_1_seductive()
    t2 = build_type_2_midnight()
    t3 = build_type_3_jackpot()

    outputs = [
        (t1, "SNSHero_Viral_Thumbnail_1_Seductive.jpg"),
        (t2, "SNSHero_Viral_Thumbnail_2_Midnight.jpg"),
        (t3, "SNSHero_Viral_Thumbnail_3_Jackpot.jpg"),
    ]

    for img, fname in outputs:
        dl_path = os.path.join(DOWNLOADS_DIR, fname)
        vid_path = os.path.join(VIDEO_DIR, fname)
        brain_path = os.path.join(BRAIN_DIR, fname)
        img.save(dl_path, "JPEG", quality=94, optimize=True)
        img.save(vid_path, "JPEG", quality=94, optimize=True)
        img.save(brain_path, "JPEG", quality=94, optimize=True)
        print(f"Saved {fname}: {os.path.getsize(dl_path) // 1024} KB")

    # Update default promo thumbnail as well
    t1.save(os.path.join(VIDEO_DIR, "SNSHero_Animation_Promo_Thumbnail.jpg"), "JPEG", quality=94, optimize=True)
    t1.save(os.path.join(DOWNLOADS_DIR, "SNSHero_Animation_Promo_Thumbnail_KO.jpg"), "JPEG", quality=94, optimize=True)


if __name__ == "__main__":
    save_all()
