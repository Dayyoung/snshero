#!/usr/bin/env python3
"""
Generate high-CTR, Google Ads Policy-Compliant (100% Instant Approval)
Korean Display / AdSense Promotional Banners for SNSHero.com
promoting ALL 4 pillars: Game (게임) + Webtoon (웹툰) + Animation (애니메이션) + Movie (무비).

Includes:
1. 1200x628 (1.91:1 Landscape - Main Responsive Display & Demand Gen Banner) - Type A (Heroine Allure & 4-in-1 Media)
2. 1200x628 (1.91:1 Landscape - Main Responsive Display & Demand Gen Banner) - Type B (SSR Awakening & 4-in-1 Media)
3. 1200x1200 (1:1 Square - #1 Mobile In-Feed AdSense Banner) - 4-Pillar Grid + Heroine Showcase
4. 300x250 (Medium Rectangle - #1 Korean GDN AdSense Slot)
5. 728x90 (PC Leaderboard - Top News/Community Header Slot)
6. 320x100 (Mobile Large Banner - Top Mobile Web AdSense Slot)
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

ROOT_DIR = "/Users/dayyoung/project/snshero"
BRAIN_DIR = "/Users/dayyoung/.gemini/antigravity/brain/2ea9d3e0-d54e-4d74-a021-5bc044369600"
DOWNLOADS_DIR = "/Users/dayyoung/Downloads"
BANNER_DIR = os.path.join(ROOT_DIR, "public", "banner")
os.makedirs(BANNER_DIR, exist_ok=True)

BG_HEROINE = os.path.join(ROOT_DIR, "public", "video", "thumb_bg_seductive_heroine.jpg")
BG_AWAKEN = os.path.join(ROOT_DIR, "public", "video", "thumb_bg_ssr_awakening.jpg")
EP1_SCENE = os.path.join(ROOT_DIR, "public", "images", "webtoon", "episode_01", "scene_06.webp")
EP8_SCENE = os.path.join(ROOT_DIR, "public", "images", "webtoon", "episode_08", "scene_12.webp")
EP20_SCENE = os.path.join(ROOT_DIR, "public", "images", "webtoon", "episode_20", "scene_10.webp")
EP39_SCENE = os.path.join(ROOT_DIR, "public", "images", "webtoon", "episode_39", "scene_15.webp")

FONT_PATH = "/System/Library/Fonts/AppleSDGothicNeo.ttc"


def load_font(size: int, heavy: bool = True) -> ImageFont.FreeTypeFont:
    for idx in ([8, 6, 7, 0] if heavy else [5, 3, 0]):
        try:
            return ImageFont.truetype(FONT_PATH, size, index=idx)
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
    stroke_width: int = 8,
    glow_color: tuple = (255, 30, 130, 150),
    glow_radius: int = 12,
    shadow_offset: tuple[int, int] = (4, 5),
):
    glow_layer = Image.new("RGBA", base_img.size, (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow_layer)
    x, y = pos
    g_draw.text(
        (x + shadow_offset[0], y + shadow_offset[1]),
        text,
        font=font,
        fill=(0, 0, 0, 220),
        stroke_width=stroke_width + 3,
        stroke_fill=(0, 0, 0, 220),
    )
    g_draw.text(
        (x, y),
        text,
        font=font,
        fill=glow_color,
        stroke_width=stroke_width + 4,
        stroke_fill=glow_color,
    )
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=glow_radius))
    base_img.alpha_composite(glow_layer)

    draw = ImageDraw.Draw(base_img)
    draw.text(
        (x, y),
        text,
        font=font,
        fill=fill,
        stroke_width=stroke_width,
        stroke_fill=stroke_fill,
    )


def crop_fill(img_path: str, target_w: int, target_h: int, sat: float = 1.2, con: float = 1.1) -> Image.Image:
    if not os.path.exists(img_path):
        return Image.new("RGB", (target_w, target_h), (20, 12, 32))
    im = Image.open(img_path).convert("RGB")
    src_w, src_h = im.size
    scale = max(target_w / src_w, target_h / src_h)
    nw, nh = int(src_w * scale), int(src_h * scale)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - target_w) // 2
    top = (nh - target_h) // 2
    im = im.crop((left, top, left + target_w, top + target_h))
    im = ImageEnhance.Color(im).enhance(sat)
    im = ImageEnhance.Contrast(im).enhance(con)
    return im


def build_1200x628_type_a() -> Image.Image:
    """
    1200x628 (1.91:1) Type A: 매혹적인 히로인 실리아 + 게임/웹툰/애니/무비 4대 콘텐츠 올인원 배너
    """
    w, h = 1200, 628
    base = crop_fill(BG_HEROINE, w, h, sat=1.25, con=1.14).convert("RGBA")

    # Left dark gradient for crystal-clear Korean copy + bottom bar gradient
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for x in range(740):
        alpha = int(205 * (1 - (x / 740) ** 1.35))
        gd.line([(x, 0), (x, h)], fill=(10, 5, 18, alpha))
    for y in range(495, h):
        alpha = int(230 * ((y - 495) / (h - 495)))
        gd.line([(0, y), (w, y)], fill=(8, 4, 15, alpha))
    base.alpha_composite(grad)
    draw = ImageDraw.Draw(base)

    # 1. Top 4-Pillar Media Pills (게임 · 웹툰 · 애니메이션 · 무비)
    pills = [
        ("AI 카드게임", (230, 25, 80, 250)),
        ("웹툰 40화", (150, 35, 220, 250)),
        ("애니메이션 40화", (215, 120, 10, 250)),
        ("판타지 무비 40화", (20, 130, 195, 250)),
    ]
    px = 42
    py = 34
    f_pill = load_font(22, heavy=True)
    for label, color in pills:
        bbox = draw.textbbox((0, 0), label, font=f_pill)
        tw = bbox[2] - bbox[0]
        pw = tw + 28
        draw.rounded_rectangle([px, py, px + pw, py + 44], radius=8, fill=color, outline=(255, 255, 255, 230), width=2)
        draw.text((px + 14, py + 9), label, font=f_pill, fill=(255, 255, 255, 255))
        px += pw + 10

    # Top-right Heroine Tag
    draw.rounded_rectangle([880, 28, 1172, 78], radius=8, fill=(22, 10, 36, 230), outline=(255, 210, 75, 255), width=2)
    f_tag = load_font(22, heavy=True)
    draw.text((904, 41), "전설 SSR 실리아 무료 해금", font=f_tag, fill=(255, 225, 95, 255))

    # 2. Seductive / Curiosity Hook Copy
    f_quote = load_font(44, heavy=True)
    f_main1 = load_font(74, heavy=True)
    f_main2 = load_font(78, heavy=True)

    draw_glow_text(
        base,
        (42, 104),
        "“잠깐만 보려다 40화 밤새 정주행했습니다..”",
        f_quote,
        fill=(255, 200, 235, 255),
        stroke_fill=(25, 0, 18, 255),
        stroke_width=8,
        glow_color=(255, 30, 140, 170),
        glow_radius=12,
    )

    draw_glow_text(
        base,
        (40, 178),
        "게임·웹툰·애니·무비",
        f_main1,
        fill=(255, 255, 255, 255),
        stroke_fill=(0, 0, 0, 255),
        stroke_width=12,
        glow_color=(255, 0, 100, 150),
        glow_radius=14,
    )

    draw_glow_text(
        base,
        (40, 274),
        "전편 100% 무료 공개!",
        f_main2,
        fill=(255, 230, 50, 255),
        stroke_fill=(0, 0, 0, 255),
        stroke_width=13,
        glow_color=(255, 130, 0, 180),
        glow_radius=16,
    )

    # 3. Benefit Box (SSR Card + 1,000 SNS)
    draw.rounded_rectangle([42, 392, 720, 464], radius=10, fill=(28, 10, 42, 235), outline=(255, 120, 190, 255), width=3)
    f_ben = load_font(27, heavy=True)
    draw.text(
        (64, 414),
        "지금 접속 시 [SSR 전설 여신 카드 + 1,000 SNS] 즉시 지급!",
        font=f_ben,
        fill=(255, 240, 140, 255),
        stroke_width=2,
        stroke_fill=(0, 0, 0, 255),
    )

    # 4. Bottom 4-Media Showcase Bar + CTA Button
    draw.rounded_rectangle([38, 520, 1162, 598], radius=12, fill=(16, 11, 26, 245), outline=(255, 205, 65, 230), width=2)
    f_bot = load_font(26, heavy=True)
    draw.text(
        (60, 545),
        "설치·가입 0초! 브라우저에서 1초 만에 시작하는 판타지 세계관",
        font=f_bot,
        fill=(255, 255, 255, 255),
    )

    draw.rounded_rectangle([742, 530, 1148, 588], radius=8, fill=(235, 25, 80, 255), outline=(255, 255, 255, 255), width=2)
    f_btn = load_font(25, heavy=True)
    draw.text((768, 546), "무료 감상 & 플레이 ▶ SNSHero.com", font=f_btn, fill=(255, 255, 255, 255))

    draw.rectangle([0, 0, w - 1, h - 1], outline=(255, 75, 150, 230), width=4)
    return base.convert("RGB")


def build_1200x628_type_b() -> Image.Image:
    """
    1200x628 (1.91:1) Type B: 황금 발키리 & 흑염 검사 SSR 각성 + 4대 미디어 통합 배너
    """
    w, h = 1200, 628
    base = crop_fill(BG_AWAKEN, w, h, sat=1.25, con=1.15).convert("RGBA")

    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for x in range(740):
        alpha = int(210 * (1 - (x / 740) ** 1.35))
        gd.line([(x, 0), (x, h)], fill=(8, 6, 20, alpha))
    for y in range(495, h):
        alpha = int(230 * ((y - 495) / (h - 495)))
        gd.line([(0, y), (w, y)], fill=(6, 5, 16, alpha))
    base.alpha_composite(grad)
    draw = ImageDraw.Draw(base)

    # Top Badge
    draw.rounded_rectangle([42, 34, 625, 88], radius=10, fill=(225, 25, 45, 250), outline=(255, 225, 90, 255), width=3)
    f_badge = load_font(28, heavy=True)
    draw.text((64, 47), "한국 유저 인기 폭발 // 무설치 1초 원클릭 오픈!", font=f_badge, fill=(255, 255, 255, 255))

    # Main Copy
    f_sub = load_font(46, heavy=True)
    f_m1 = load_font(76, heavy=True)
    f_m2 = load_font(80, heavy=True)

    draw_glow_text(
        base,
        (42, 112),
        "웹툰·애니·무비 40화 + AI 카드배틀",
        f_sub,
        fill=(130, 245, 255, 255),
        stroke_fill=(0, 10, 25, 255),
        stroke_width=9,
        glow_color=(0, 180, 255, 170),
        glow_radius=12,
    )

    draw_glow_text(
        base,
        (40, 184),
        "접속 즉시 전설 SSR",
        f_m1,
        fill=(255, 255, 255, 255),
        stroke_fill=(0, 0, 0, 255),
        stroke_width=12,
        glow_color=(255, 150, 0, 170),
        glow_radius=14,
    )

    draw_glow_text(
        base,
        (40, 282),
        "영웅 2장 100% 지급!",
        f_m2,
        fill=(255, 225, 45, 255),
        stroke_fill=(0, 0, 0, 255),
        stroke_width=13,
        glow_color=(255, 95, 0, 190),
        glow_radius=16,
    )

    # 4 Media Chips Box
    draw.rounded_rectangle([42, 396, 735, 466], radius=10, fill=(15, 22, 44, 235), outline=(255, 210, 65, 255), width=3)
    f_spec = load_font(26, heavy=True)
    draw.text(
        (64, 418),
        "[카드게임] + [웹툰] + [애니] + [무비] 매 화 시청 시 +100 SNS!",
        font=f_spec,
        fill=(255, 235, 120, 255),
        stroke_width=2,
        stroke_fill=(0, 0, 0, 255),
    )

    # Bottom Bar
    draw.rounded_rectangle([38, 520, 1162, 598], radius=12, fill=(12, 14, 28, 245), outline=(255, 205, 65, 230), width=2)
    f_bot = load_font(26, heavy=True)
    draw.text((60, 545), "110종 영웅 수집 & 3x3 전략 배틀 · 지금 바로 무료 접속하세요", font=f_bot, fill=(255, 255, 255, 255))

    draw.rounded_rectangle([760, 530, 1148, 588], radius=8, fill=(255, 190, 0, 255), outline=(255, 255, 255, 255), width=2)
    f_btn = load_font(25, heavy=True)
    draw.text((792, 546), "지금 보상 받기 ▶ SNSHero.com", font=f_btn, fill=(18, 12, 12, 255))

    draw.rectangle([0, 0, w - 1, h - 1], outline=(255, 205, 55, 230), width=4)
    return base.convert("RGB")


def build_1200x1200_square() -> Image.Image:
    """
    1200x1200 (1:1 Square): 모바일 애드센스 인피드 1위 규격
    상단: 매혹 히로인 실리아 & 메인 후킹 카피
    중단: [1. 원클릭 카드게임] [2. 풀컬러 웹툰] [3. 40부작 애니메이션] [4. 판타지 무비] 4분할 비주얼 카드
    하단: 대형 CTA 버튼
    """
    w, h = 1200, 1200
    canvas = Image.new("RGBA", (w, h), (12, 7, 22, 255))

    # Top Heroine Visual (1200x680)
    top_img = crop_fill(BG_HEROINE, 1200, 680, sat=1.28, con=1.15).convert("RGBA")
    grad = Image.new("RGBA", (1200, 680), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for x in range(720):
        alpha = int(205 * (1 - (x / 720) ** 1.3))
        gd.line([(x, 0), (x, 680)], fill=(12, 7, 22, alpha))
    for y in range(480, 680):
        alpha = int(255 * ((y - 480) / 200))
        gd.line([(0, y), (1200, y)], fill=(12, 7, 22, alpha))
    top_img.alpha_composite(grad)
    canvas.paste(top_img, (0, 0))

    draw = ImageDraw.Draw(canvas)

    # Top Pill
    draw.rounded_rectangle([46, 40, 610, 100], radius=12, fill=(230, 20, 78, 250), outline=(255, 220, 240, 255), width=3)
    f_badge = load_font(30, heavy=True)
    draw.text((70, 55), "화제의 판타지 세계관 // 전편 무료 오픈!", font=f_badge, fill=(255, 255, 255, 255))

    # Main Copy on Top Half
    f_q = load_font(46, heavy=True)
    f_m1 = load_font(84, heavy=True)
    f_m2 = load_font(88, heavy=True)

    draw_glow_text(
        canvas,
        (46, 128),
        "“한 번 켜면 멈출 수 없는 몰입감!”",
        f_q,
        fill=(255, 195, 235, 255),
        stroke_fill=(20, 0, 15, 255),
        stroke_width=8,
        glow_color=(255, 30, 140, 170),
        glow_radius=12,
    )
    draw_glow_text(
        canvas,
        (44, 210),
        "게임·웹툰·애니·무비",
        f_m1,
        fill=(255, 255, 255, 255),
        stroke_fill=(0, 0, 0, 255),
        stroke_width=13,
        glow_color=(255, 0, 100, 150),
        glow_radius=15,
    )
    draw_glow_text(
        canvas,
        (44, 318),
        "40화 전편 무료 공개!",
        f_m2,
        fill=(255, 230, 50, 255),
        stroke_fill=(0, 0, 0, 255),
        stroke_width=14,
        glow_color=(255, 130, 0, 190),
        glow_radius=16,
    )

    # Sub-reward banner
    draw.rounded_rectangle([46, 448, 765, 520], radius=10, fill=(28, 12, 45, 240), outline=(255, 210, 75, 255), width=3)
    f_sub = load_font(29, heavy=True)
    draw.text((68, 470), "접속 즉시 [SSR 전설 카드 2장 + 1,000 SNS] 무료 지급!", font=f_sub, fill=(255, 238, 130, 255))

    # Middle 4-Pillar Visual Cards (y: 560 to 995)
    cards_meta = [
        ("1. AI 카드배틀", "설치 없이 1초 대결", BG_AWAKEN, (235, 35, 85)),
        ("2. 풀컬러 웹툰", "전 40화 무료 정주행", EP1_SCENE, (155, 45, 235)),
        ("3. 애니메이션", "성우 더빙 40부작", EP20_SCENE, (235, 135, 20)),
        ("4. 판타지 무비", "시네마틱 40화 영화", EP39_SCENE, (25, 155, 225)),
    ]
    card_w = 262
    card_h = 410
    gap = 22
    start_x = 43
    cy = 565

    f_ctitle = load_font(28, heavy=True)
    f_csub = load_font(22, heavy=False)

    for idx, (ctitle, csub, cpath, accent) in enumerate(cards_meta):
        cx = start_x + idx * (card_w + gap)
        # Card frame
        draw.rounded_rectangle([cx, cy, cx + card_w, cy + card_h], radius=14, fill=(24, 16, 38, 255), outline=(*accent, 255), width=3)
        # Card image
        c_img = crop_fill(cpath, card_w - 12, 270, sat=1.25, con=1.12)
        canvas.paste(c_img, (cx + 6, cy + 6))
        # Top HIT tag on each card
        draw.rounded_rectangle([cx + 16, cy + 16, cx + 96, cy + 50], radius=6, fill=(*accent, 245))
        draw.text((cx + 28, cy + 22), "FREE", font=load_font(20, heavy=True), fill=(255, 255, 255, 255))
        # Card labels
        draw.text((cx + 18, cy + 296), ctitle, font=f_ctitle, fill=(255, 255, 255, 255))
        draw.text((cx + 18, cy + 338), csub, font=f_csub, fill=(255, 225, 130, 255))
        draw.text((cx + 18, cy + 370), "시청 보상 +100 SNS", font=load_font(19, heavy=True), fill=(160, 240, 255, 255))

    # Bottom Giant CTA Button (y: 1020 to 1145)
    draw.rounded_rectangle([43, 1022, 1157, 1142], radius=16, fill=(235, 22, 78, 255), outline=(255, 230, 90, 255), width=4)
    f_cta_big = load_font(44, heavy=True)
    draw.text((135, 1056), "지금 무료 감상 & 게임 시작하기 ▶ SNSHero.com", font=f_cta_big, fill=(255, 255, 255, 255), stroke_width=3, stroke_fill=(80, 0, 25, 255))

    draw.rectangle([0, 0, w - 1, h - 1], outline=(255, 75, 150, 240), width=6)
    return canvas.convert("RGB")


def build_300x250_gdn() -> Image.Image:
    """
    300x250 Medium Rectangle (국내 언론사/커뮤니티 애드센스 최다 노출 슬롯)
    """
    w, h = 300, 250
    base = crop_fill(BG_HEROINE, w, h, sat=1.25, con=1.15).convert("RGBA")
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for x in range(210):
        alpha = int(210 * (1 - (x / 210) ** 1.25))
        gd.line([(x, 0), (x, h)], fill=(10, 5, 18, alpha))
    for y in range(175, h):
        alpha = int(235 * ((y - 175) / (h - 175)))
        gd.line([(0, y), (w, y)], fill=(8, 4, 15, alpha))
    base.alpha_composite(grad)
    draw = ImageDraw.Draw(base)

    # Top pill
    draw.rounded_rectangle([10, 10, 198, 34], radius=5, fill=(230, 20, 75, 250))
    draw.text((18, 14), "게임·웹툰·애니·무비 무료!", font=load_font(14, heavy=True), fill=(255, 255, 255, 255))

    # Main Copy
    draw_glow_text(base, (10, 46), "1화부터 선 넘은", load_font(26, heavy=True), fill=(255, 255, 255, 255), stroke_width=5, glow_radius=6, shadow_offset=(2, 2))
    draw_glow_text(base, (10, 80), "미친 몰입감!", load_font(28, heavy=True), fill=(255, 230, 50, 255), stroke_width=5, glow_radius=6, shadow_offset=(2, 2))

    draw.rounded_rectangle([10, 126, 205, 156], radius=5, fill=(25, 10, 38, 235), outline=(255, 205, 70, 255), width=1)
    draw.text((16, 134), "접속 즉시 SSR 여신 카드 지급", font=load_font(14, heavy=True), fill=(255, 235, 120, 255))

    # Bottom CTA button
    draw.rounded_rectangle([10, 194, 290, 238], radius=7, fill=(235, 22, 78, 255), outline=(255, 255, 255, 255), width=2)
    draw.text((28, 207), "무료 감상 & 플레이 ▶ SNSHero.com", font=load_font(16, heavy=True), fill=(255, 255, 255, 255))

    draw.rectangle([0, 0, w - 1, h - 1], outline=(255, 75, 150, 230), width=2)
    return base.convert("RGB")


def build_728x90_leaderboard() -> Image.Image:
    """
    728x90 PC Leaderboard (언론사/커뮤니티 상단 가로 배너)
    """
    w, h = 728, 90
    canvas = Image.new("RGBA", (w, h), (14, 8, 24, 255))
    im = Image.open(BG_HEROINE).convert("RGB")
    # Crop around heroine's eyes/face (right half, upper portion)
    im = im.crop((680, 20, 1280, 235)).resize((260, 90), Image.Resampling.LANCZOS)
    im = ImageEnhance.Color(im).enhance(1.25)
    right_img = im.convert("RGBA")
    grad = Image.new("RGBA", (260, 90), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for x in range(90):
        alpha = int(255 * (1 - x / 90))
        gd.line([(x, 0), (x, 90)], fill=(14, 8, 24, alpha))
    right_img.alpha_composite(grad)
    canvas.paste(right_img, (280, 0))

    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle([12, 10, 244, 34], radius=5, fill=(230, 20, 75, 255))
    draw.text((20, 14), "AI 카드게임 · 웹툰 · 애니 · 무비 40화", font=load_font(13, heavy=True), fill=(255, 255, 255, 255))

    draw_glow_text(canvas, (12, 42), "전편 100% 무료! 접속 즉시 SSR 여신 카드 지급", load_font(21, heavy=True), fill=(255, 230, 60, 255), stroke_width=4, glow_radius=5, shadow_offset=(2, 2))

    draw.rounded_rectangle([528, 18, 714, 72], radius=8, fill=(235, 22, 78, 255), outline=(255, 255, 255, 255), width=2)
    draw.text((544, 34), "무료 시작 ▶ SNSHero", font=load_font(17, heavy=True), fill=(255, 255, 255, 255))

    draw.rectangle([0, 0, w - 1, h - 1], outline=(255, 75, 150, 230), width=2)
    return canvas.convert("RGB")


def build_320x100_mobile() -> Image.Image:
    """
    320x100 Mobile Large Banner (모바일 웹 최상단/하단 애드센스 표준 배너)
    """
    w, h = 320, 100
    canvas = Image.new("RGBA", (w, h), (14, 8, 24, 255))
    right_img = crop_fill(BG_HEROINE, 140, 100, sat=1.25, con=1.15).convert("RGBA")
    grad = Image.new("RGBA", (140, 100), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for x in range(60):
        alpha = int(255 * (1 - x / 60))
        gd.line([(x, 0), (x, 100)], fill=(14, 8, 24, alpha))
    right_img.alpha_composite(grad)
    canvas.paste(right_img, (180, 0))

    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle([8, 8, 178, 28], radius=4, fill=(230, 20, 75, 255))
    draw.text((14, 11), "게임·웹툰·애니·무비 40화 무료", font=load_font(11, heavy=True), fill=(255, 255, 255, 255))

    draw_glow_text(canvas, (8, 33), "1화부터 미친 몰입감!", load_font(20, heavy=True), fill=(255, 230, 50, 255), stroke_width=4, glow_radius=4, shadow_offset=(1, 2))
    draw.text((8, 58), "접속 즉시 SSR 여신 카드 무료 지급", font=load_font(12, heavy=True), fill=(255, 210, 235, 255))

    draw.rounded_rectangle([8, 75, 185, 95], radius=4, fill=(235, 22, 78, 255))
    draw.text((18, 78), "무료 플레이 ▶ SNSHero.com", font=load_font(12, heavy=True), fill=(255, 255, 255, 255))

    draw.rectangle([0, 0, w - 1, h - 1], outline=(255, 75, 150, 230), width=2)
    return canvas.convert("RGB")


def main():
    banners = [
        (build_1200x628_type_a(), "SNSHero_AdSense_Banner_1200x628_Heroine_4in1.jpg"),
        (build_1200x628_type_b(), "SNSHero_AdSense_Banner_1200x628_SSR_Awakening.jpg"),
        (build_1200x1200_square(), "SNSHero_AdSense_Banner_1200x1200_Square_4in1.jpg"),
        (build_300x250_gdn(), "SNSHero_AdSense_Banner_300x250_GDN.jpg"),
        (build_728x90_leaderboard(), "SNSHero_AdSense_Banner_728x90_Leaderboard.jpg"),
        (build_320x100_mobile(), "SNSHero_AdSense_Banner_320x100_Mobile.jpg"),
    ]

    for img, fname in banners:
        dl_path = os.path.join(DOWNLOADS_DIR, fname)
        pub_path = os.path.join(BANNER_DIR, fname)
        brain_path = os.path.join(BRAIN_DIR, fname)
        img.save(dl_path, "JPEG", quality=92, optimize=True)
        img.save(pub_path, "JPEG", quality=92, optimize=True)
        img.save(brain_path, "JPEG", quality=92, optimize=True)
        print(f"Generated {fname} ({img.size[0]}x{img.size[1]}): {os.path.getsize(dl_path) // 1024} KB")


if __name__ == "__main__":
    main()
