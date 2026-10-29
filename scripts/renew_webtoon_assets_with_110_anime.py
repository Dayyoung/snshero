#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
renew_webtoon_assets_with_110_anime.py
Renews all key webtoon visuals using the 110 newly remastered anime characters:
1. webtoon_cover_480x623.jpg (Naver Webtoon official vertical cover with new #041 Kadan & rune shield logo)
2. webtoon_cover_434x330.jpg (Naver Webtoon official horizontal thumbnail with new #041 Kadan)
3. scene_ending_snshero.jpg & .webp (Official card game promo end-card with new #041 Kadan)
4. episode_01..40/scene_00.webp (All 40 opening title cards featuring the episode's main hero bust & location)
"""

import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
WEBTOON_DIR = PROJECT_ROOT / "public/images/webtoon"
ANIME_DIR = PROJECT_ROOT / "public/anime-character-sheets"
MANIFEST_PATH = PROJECT_ROOT / "src/content/webtoonEpisodeManifest.json"

FONT_KO = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
FONT_EN_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_MONO = "/System/Library/Fonts/Menlo.ttc"

# Episode Location mapping (EP 1..40 -> LOC_001..020)
EP_LOC_MAP = {
    1: "LOC_001_Elwin_Village.jpg",
    2: "LOC_002_Drunken_Bell_Tower.jpg",
    3: "LOC_003_Mistfall_Cliff.jpg",
    4: "LOC_004_Great_Plains_of_the_Wildlands.jpg",
    5: "LOC_004_Great_Plains_of_the_Wildlands.jpg",
    6: "LOC_004_Great_Plains_of_the_Wildlands.jpg",
    7: "LOC_005_Pegasus_Valley.jpg",
    8: "LOC_005_Pegasus_Valley.jpg",
    9: "LOC_005_Pegasus_Valley.jpg",
    10: "LOC_006_Lighthaven_Inner_Forum.jpg",
    11: "LOC_006_Lighthaven_Inner_Forum.jpg",
    12: "LOC_007_Red_Glass_Palace.jpg",
    13: "LOC_008_Seventh_Subterranean_Labor_Camp.jpg",
    14: "LOC_009_Cloud_Return_Manor_Mist_Lake.jpg",
    15: "LOC_009_Cloud_Return_Manor_Mist_Lake.jpg",
    16: "LOC_010_Whispering_Wind_Island.jpg",
    17: "LOC_010_Whispering_Wind_Island.jpg",
    18: "LOC_011_Black_Temple_Jade_Barrier_Spire.jpg",
    19: "LOC_012_Sky_Altar.jpg",
    20: "LOC_012_Sky_Altar.jpg",
    21: "LOC_013_Flower_Ship_Siren_Strait.jpg",
    22: "LOC_013_Flower_Ship_Siren_Strait.jpg",
    23: "LOC_014_Mount_Dragonhorn_Dragon_Grotto.jpg",
    24: "LOC_015_The_Sealed_Chamber.jpg",
    25: "LOC_016_Jade_Council_Hall.jpg",
    26: "LOC_016_Jade_Council_Hall.jpg",
    27: "LOC_016_Jade_Council_Hall.jpg",
    28: "LOC_016_Jade_Council_Hall.jpg",
    29: "LOC_017_Citadel_of_the_Four_Gates.jpg",
    30: "LOC_017_Citadel_of_the_Four_Gates.jpg",
    31: "LOC_017_Citadel_of_the_Four_Gates.jpg",
    32: "LOC_018_Quicksand_River_Black_Marsh.jpg",
    33: "LOC_018_Quicksand_River_Black_Marsh.jpg",
    34: "LOC_018_Quicksand_River_Black_Marsh.jpg",
    35: "LOC_019_Black_Citadel_Starlight_Archive.jpg",
    36: "LOC_019_Black_Citadel_Starlight_Archive.jpg",
    37: "LOC_020_Altar_of_Ruin_Two_Graves.jpg",
    38: "LOC_020_Altar_of_Ruin_Two_Graves.jpg",
    39: "LOC_020_Altar_of_Ruin_Two_Graves.jpg",
    40: "LOC_020_Altar_of_Ruin_Two_Graves.jpg",
}

# Act headers
def get_act_info(ep_num: int) -> tuple[str, str]:
    if ep_num <= 10:
        return "ACT I", "— ACT I · VOWS IN THE BLIZZARD & BIRTH OF FATE —"
    elif ep_num <= 20:
        return "ACT II", "— ACT II · THE AWAKENING DAGGER & STORM OF WIND ISLE —"
    elif ep_num <= 30:
        return "ACT III", "— ACT III · RELICS OF THE CAVERN & THE JADE REVOLT —"
    else:
        return "ACT IV", "— ACT IV · MARCH ON THE BLACK MARSH & DAWN OF PEACE —"


def load_anime_characters_meta():
    with open(ANIME_DIR / "manifest.json", "r", encoding="utf-8") as f:
        mf = json.load(f)
    chars_by_id = {c["id"]: c for c in mf["characters"]}
    name_to_id = {}
    for c in mf["characters"]:
        name_to_id[c["nameEn"].lower()] = c["id"]
        name_to_id[c["nameKo"].lower()] = c["id"]
    
    # Specific aliases
    aliases = {
        "kadan": 41, "aleksandar": 50, "balian": 43, "elwin": 42, "gawain": 45,
        "rondol": 46, "gilgamesh": 47, "robinyard": 48, "hercul": 49, "kaze": 50,
        "walker": 51, "artus": 60, "death knight artus": 60, "celia": 62, "malfuon": 62,
        "lucian": 61, "eliana": 64, "titania": 65, "aila": 70, "grimli": 74,
        "balbo": 73, "ursoc": 88, "leonar": 86, "barghest": 87, "fenrir": 83,
        "griffon": 84, "medusa gorgo": 89, "pegasus": 90, "spiderbot": 91, "chronos": 92,
        "ironclad": 98, "magitech golem": 99, "ysela": 107, "alexstra": 108,
        "malygon": 109, "dreadwing": 110, "ignis": 11, "belphegor": 13, "balrog": 15,
        "sylphid": 23, "harpy": 24, "aeolus": 25, "aquaris": 1, "kelpie": 4,
    }
    for k, v in aliases.items():
        name_to_id[k] = v
    return chars_by_id, name_to_id


def save_webp_under_limit(img: Image.Image, out_file: Path, limit_bytes: int = 75000) -> int:
    for q in [86, 82, 78, 74, 70, 66, 62, 58, 54]:
        img.save(out_file, "WEBP", quality=q, method=5)
        sz = out_file.stat().st_size
        if sz <= limit_bytes:
            return sz
    return out_file.stat().st_size


# ─── 1. RENEW WEBTOON OFFICIAL COVERS (480x623 & 434x330) ───
def build_webtoon_covers():
    print("Building Webtoon Official Covers with new #041 Kadan Anime Art...")
    kadan_cutout = Image.open(ANIME_DIR / "cutouts/041_Kadan.png").convert("RGBA")
    logo = Image.open(PROJECT_ROOT / "public/logo-ko.png").convert("RGBA")
    loc_bg = Image.open(ANIME_DIR / "locations/art/LOC_001_Elwin_Village.jpg").convert("RGB")

    # Font definitions
    f_korean_title = ImageFont.truetype(FONT_KO, 36, index=14)
    f_korean_sub = ImageFont.truetype(FONT_KO, 24, index=14)
    f_en_sub = ImageFont.truetype(FONT_EN_BOLD, 14)
    f_footer = ImageFont.truetype(FONT_MONO, 11)

    # 1A. 480x623 Vertical Cover
    W, H = 480, 623
    # Crop & adjust background
    bg_w, bg_h = loc_bg.size
    # Focus on the snowy mountains and sky
    bg_crop = loc_bg.crop((0, 0, bg_w, int(bg_h * 0.85))).resize((W, H), Image.Resampling.LANCZOS)
    bg_enhanced = ImageEnhance.Color(bg_crop).enhance(1.15)
    bg_enhanced = ImageEnhance.Contrast(bg_enhanced).enhance(1.08)

    canvas = bg_enhanced.convert("RGBA")
    draw = ImageDraw.Draw(canvas)

    # Vignette darkening at top and bottom for typography readability
    veil = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(veil)
    for y in range(H):
        if y < 140:
            a = int(180 * (1.0 - y / 140.0) ** 1.2)
        elif y > 380:
            a = int(190 * ((y - 380) / (H - 380)) ** 1.3)
        else:
            a = 30
        vdraw.line([(0, y), (W, y)], fill=(12, 16, 26, a))
    canvas = Image.alpha_composite(canvas, veil)

    # Paste Kadan: scale so he stands majestically in center
    kw, kh = kadan_cutout.size
    k_target_h = int(H * 0.82)
    k_target_w = int(kw * (k_target_h / float(kh)))
    kadan_scaled = kadan_cutout.resize((k_target_w, k_target_h), Image.Resampling.LANCZOS)

    # Add soft blue aura glow behind Kadan
    k_alpha = kadan_scaled.split()[3]
    glow = Image.new("RGBA", kadan_scaled.size, (110, 195, 255, 120))
    glow.putalpha(k_alpha)
    glow_blurred = glow.filter(ImageFilter.GaussianBlur(16))
    kx = (W - k_target_w) // 2 + 10
    ky = H - k_target_h - 20
    canvas.alpha_composite(glow_blurred, (kx, ky))
    canvas.alpha_composite(kadan_scaled, (kx, ky))

    # Paste Logo: centered horizontally at lower-middle
    lw, lh = logo.size
    logo_target_w = int(W * 0.78)
    logo_target_h = int(lh * (logo_target_w / float(lw)))
    logo_scaled = logo.resize((logo_target_w, logo_target_h), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo_scaled, ((W - logo_target_w) // 2, H - logo_target_h - 52))

    # Re-draw typography overlay
    tdraw = ImageDraw.Draw(canvas)

    # Top Title text
    # "눈히어로" with shadow
    t1 = "눈히어로"
    tdraw.text((W // 2 + 2, 42 + 2), t1, fill=(0, 0, 0, 230), font=f_korean_title, anchor="mm")
    tdraw.text((W // 2, 42), t1, fill=(245, 248, 255, 255), font=f_korean_title, anchor="mm")

    # "카단의 여정" golden subtitle
    t2 = "카단의 여정"
    tdraw.text((W // 2 + 1, 80 + 1), t2, fill=(0, 0, 0, 230), font=f_korean_sub, anchor="mm")
    tdraw.text((W // 2, 80), t2, fill=(255, 218, 130, 255), font=f_korean_sub, anchor="mm")

    t3 = "SNSHero : Kadan's Journey"
    tdraw.text((W // 2, 108), t3, fill=(195, 215, 240, 240), font=f_en_sub, anchor="mm")

    # Bottom official webtoon pill
    t_foot = "OFFICIAL WEBTOON  ·  https://SNSHero.com"
    tdraw.text((W // 2, H - 24), t_foot, fill=(255, 225, 140, 240), font=f_footer, anchor="mm")

    # Dual hairline gold/ink frame
    tdraw.rectangle([8, 8, W - 8, H - 8], outline=(230, 195, 110, 220), width=1)
    tdraw.rectangle([11, 11, W - 11, H - 11], outline=(15, 20, 30, 160), width=1)

    out_480 = WEBTOON_DIR / "webtoon_cover_480x623.jpg"
    canvas.convert("RGB").save(out_480, "JPEG", quality=94, optimize=True)
    print(f"Saved {out_480} ({out_480.stat().st_size:,} B)")

    # 1B. 434x330 Horizontal Thumbnail Cover
    W2, H2 = 434, 330
    bg_w2, bg_h2 = loc_bg.size
    bg_crop2 = loc_bg.crop((0, 0, bg_w2, int(bg_h2 * 0.75))).resize((W2, H2), Image.Resampling.LANCZOS)
    canvas2 = bg_crop2.convert("RGBA")

    veil2 = Image.new("RGBA", (W2, H2), (0, 0, 0, 0))
    vdraw2 = ImageDraw.Draw(veil2)
    for y in range(H2):
        if y < 70:
            a = int(170 * (1.0 - y / 70.0))
        elif y > 220:
            a = int(180 * ((y - 220) / (H2 - 220)))
        else:
            a = 30
        vdraw2.line([(0, y), (W2, y)], fill=(12, 16, 26, a))
    canvas2 = Image.alpha_composite(canvas2, veil2)

    # Scale Kadan for 434x330
    k_h2 = int(H2 * 0.94)
    k_w2 = int(kw * (k_h2 / float(kh)))
    k_scaled2 = kadan_cutout.resize((k_w2, k_h2), Image.Resampling.LANCZOS)
    k_alpha2 = k_scaled2.split()[3]
    glow2 = Image.new("RGBA", k_scaled2.size, (110, 195, 255, 120))
    glow2.putalpha(k_alpha2)
    glow_blurred2 = glow2.filter(ImageFilter.GaussianBlur(12))
    kx2 = (W2 - k_w2) // 2 + 6
    ky2 = H2 - k_h2 - 4
    canvas2.alpha_composite(glow_blurred2, (kx2, ky2))
    canvas2.alpha_composite(k_scaled2, (kx2, ky2))

    # Scaled Logo
    logo_w2 = int(W2 * 0.68)
    logo_h2 = int(lh * (logo_w2 / float(lw)))
    logo_scaled2 = logo.resize((logo_w2, logo_h2), Image.Resampling.LANCZOS)
    canvas2.alpha_composite(logo_scaled2, ((W2 - logo_w2) // 2, H2 - logo_h2 - 32))

    tdraw2 = ImageDraw.Draw(canvas2)
    f_korean_title2 = ImageFont.truetype(FONT_KO, 24, index=14)
    f_footer2 = ImageFont.truetype(FONT_MONO, 10)

    tdraw2.text((W2 // 2 + 1, 26 + 1), "눈히어로 · 카단의 여정", fill=(0, 0, 0, 220), font=f_korean_title2, anchor="mm")
    tdraw2.text((W2 // 2, 26), "눈히어로 · 카단의 여정", fill=(255, 245, 220, 255), font=f_korean_title2, anchor="mm")

    t_foot2 = "OFFICIAL WEBTOON  ·  https://SNSHero.com"
    tdraw2.text((W2 // 2, H2 - 14), t_foot2, fill=(255, 225, 140, 240), font=f_footer2, anchor="mm")

    tdraw2.rectangle([6, 6, W2 - 6, H2 - 6], outline=(230, 195, 110, 220), width=1)
    tdraw2.rectangle([8, 8, W2 - 8, H2 - 8], outline=(15, 20, 30, 160), width=1)

    out_434 = WEBTOON_DIR / "webtoon_cover_434x330.jpg"
    canvas2.convert("RGB").save(out_434, "JPEG", quality=94, optimize=True)
    print(f"Saved {out_434} ({out_434.stat().st_size:,} B)")


# ─── 2. RENEW ENDING PROMO SCENE (scene_ending_snshero.jpg & .webp) ───
def build_ending_promo_scene():
    print("Building Webtoon Ending Promo Scene with new #041 Kadan Anime Art...")
    W, H = 1080, 608
    kadan_cutout = Image.open(ANIME_DIR / "cutouts/041_Kadan.png").convert("RGBA")
    logo = Image.open(PROJECT_ROOT / "public/logo-ko.png").convert("RGBA")
    loc_bg = Image.open(ANIME_DIR / "locations/art/LOC_001_Elwin_Village.jpg").convert("RGB")

    bg_crop = loc_bg.resize((W, H), Image.Resampling.LANCZOS)
    canvas = bg_crop.convert("RGBA")

    # Dark cinematic gradient overlay, much darker on right side for the UI card
    veil = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(veil)
    for x in range(W):
        ratio = x / float(W)
        if ratio < 0.40:
            a = int(60 + 50 * ratio)
        else:
            a = int(110 + 135 * ((ratio - 0.40) / 0.60) ** 1.2)
        vdraw.line([(x, 0), (x, H)], fill=(8, 12, 20, a))
    canvas = Image.alpha_composite(canvas, veil)

    # Paste Kadan on left side
    kw, kh = kadan_cutout.size
    k_h = int(H * 0.94)
    k_w = int(kw * (k_h / float(kh)))
    k_scaled = kadan_cutout.resize((k_w, k_h), Image.Resampling.LANCZOS)

    glow = Image.new("RGBA", k_scaled.size, (120, 200, 255, 120))
    glow.putalpha(k_scaled.split()[3])
    glow_blurred = glow.filter(ImageFilter.GaussianBlur(16))

    kx = 60
    ky = H - k_h - 10
    canvas.alpha_composite(glow_blurred, (kx, ky))
    canvas.alpha_composite(k_scaled, (kx, ky))

    # Right side: UI Elements
    right_cx = 720

    # Top gold badge: "★ 공식 웹툰 원작 AI 전략 카드배틀 게임 ★"
    b_w, b_h = 450, 36
    bx0, by0 = right_cx - b_w // 2, 28
    draw = ImageDraw.Draw(canvas)
    draw.rectangle([bx0, by0, bx0 + b_w, by0 + b_h], fill=(20, 22, 28, 220), outline=(225, 185, 95, 230), width=1)
    f_badge = ImageFont.truetype(FONT_KO, 14, index=14)
    draw.text((right_cx, by0 + b_h // 2), "★ 공식 웹툰 원작 AI 전략 카드배틀 게임 ★", fill=(255, 220, 130), font=f_badge, anchor="mm")

    # Middle: Big Logo
    lw, lh = logo.size
    logo_w = 460
    logo_h = int(lh * (logo_w / float(lw)))
    logo_scaled = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo_scaled, (right_cx - logo_w // 2, 85))

    # Bottom: Dark Modern Action Box
    box_w, box_h = 680, 160
    box_x0 = right_cx - box_w // 2
    box_y0 = H - box_h - 32
    draw = ImageDraw.Draw(canvas)
    draw.rectangle([box_x0, box_y0, box_x0 + box_w, box_y0 + box_h], fill=(14, 18, 26, 240), outline=(50, 140, 220, 160), width=2)

    f_box_h = ImageFont.truetype(FONT_KO, 19, index=14)
    f_box_p = ImageFont.truetype(FONT_KO, 15, index=6)
    f_btn = ImageFont.truetype(FONT_KO, 18, index=14)

    draw.text((right_cx, box_y0 + 30), "웹툰 관련 카드게임 플레이를 원하시나요?", fill=(255, 255, 255), font=f_box_h, anchor="mm")
    draw.text((right_cx, box_y0 + 60), "아래 사이트에서 무료로 즉시 플레이 하세요!", fill=(185, 205, 230), font=f_box_p, anchor="mm")

    # Orange CTA Button
    btn_w, btn_h = 540, 46
    btn_x0 = right_cx - btn_w // 2
    btn_y0 = box_y0 + 92
    draw.rectangle([btn_x0, btn_y0, btn_x0 + btn_w, btn_y0 + btn_h], fill=(225, 125, 10, 255), outline=(255, 185, 70, 255), width=1)
    draw.text((right_cx, btn_y0 + btn_h // 2), "▶  https://SNSHero.com  (눈히어로.com)", fill=(255, 255, 255), font=f_btn, anchor="mm")

    # Double hairline gold frame
    draw.rectangle([14, 14, W - 14, H - 14], outline=(225, 185, 95, 200), width=1)
    draw.rectangle([18, 18, W - 18, H - 18], outline=(25, 30, 42, 140), width=1)

    out_jpg = WEBTOON_DIR / "scene_ending_snshero.jpg"
    out_webp = WEBTOON_DIR / "scene_ending_snshero.webp"
    final_rgb = canvas.convert("RGB")
    final_rgb.save(out_jpg, "JPEG", quality=92, optimize=True)
    save_webp_under_limit(final_rgb, out_webp, limit_bytes=160000)
    print(f"Saved {out_jpg} ({out_jpg.stat().st_size:,} B) and {out_webp} ({out_webp.stat().st_size:,} B)")


# ─── 3. RENEW ALL 40 EPISODE SCENE_00 TITLE CARDS (episode_01..40/scene_00.webp) ───
def build_all_40_scene_00_title_cards():
    print("Building all 40 Episode Opening Title Cards (scene_00.webp) with 110 Anime Hero Busts...")
    chars_by_id, name_to_id = load_anime_characters_meta()

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    WIDTH, HEIGHT = 800, 450
    f_badge = ImageFont.truetype(FONT_MONO, 12)
    f_act = ImageFont.truetype(FONT_MONO, 11)
    f_ep = ImageFont.truetype(FONT_MONO, 14)
    f_feat = ImageFont.truetype(FONT_KO, 12, index=14)
    f_feat_name = ImageFont.truetype(FONT_KO, 11, index=6)

    total_updated = 0
    all_sizes = []

    for ep_num in range(1, 41):
        ep_data = manifest.get(str(ep_num), {})
        ep_dir = WEBTOON_DIR / f"episode_{ep_num:02d}"
        ep_dir.mkdir(parents=True, exist_ok=True)
        out_file = ep_dir / "scene_00.webp"

        # 1. Resolve Background from LOC
        loc_fname = EP_LOC_MAP.get(ep_num, "LOC_001_Elwin_Village.jpg")
        loc_path = ANIME_DIR / "locations/art" / loc_fname
        if loc_path.exists():
            loc_img = Image.open(loc_path).convert("RGB")
        else:
            loc_img = Image.new("RGB", (WIDTH, HEIGHT), (20, 22, 28))

        # Resize to 800x450
        lw, lh = loc_img.size
        target_ratio = WIDTH / float(HEIGHT)
        curr_ratio = lw / float(lh)
        if curr_ratio > target_ratio:
            nw = int(lh * target_ratio)
            ox = (lw - nw) // 2
            bg_crop = loc_img.crop((ox, 0, ox + nw, lh)).resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
        else:
            nh = int(lw / target_ratio)
            oy = (lh - nh) // 2
            bg_crop = loc_img.crop((0, oy, lw, oy + nh)).resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)

        canvas = bg_crop.convert("RGBA")

        # 2. Dark Vignette Veil
        veil = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        vdraw = ImageDraw.Draw(veil)
        for x in range(WIDTH):
            for y in range(HEIGHT):
                # Horizontal split: darker on left for text, semi-dark on right for bust
                dist_center_y = abs(y - HEIGHT * 0.5) / (HEIGHT * 0.5)
                a_vert = 40 + int(70 * dist_center_y ** 1.3)
                if x < 480:
                    a_horiz = int(140 + 70 * (1.0 - x / 480.0) ** 1.1)
                else:
                    a_horiz = int(70 + 60 * ((x - 480) / 320.0))
                alpha = min(240, a_vert + a_horiz)
                vdraw.point((x, y), fill=(10, 12, 18, alpha))
        canvas = Image.alpha_composite(canvas, veil)

        # 3. Resolve Main Characters for this episode
        raw_chars = []
        for img in ep_data.get("images", []):
            for c in img.get("characters", []):
                if c and c not in raw_chars:
                    raw_chars.append(c)

        featured_cids = []
        for rc in raw_chars:
            cid = name_to_id.get(rc.lower())
            if not cid:
                for k, v in name_to_id.items():
                    if k in rc.lower() or rc.lower() in k:
                        cid = v
                        break
            if cid and cid not in featured_cids:
                featured_cids.append(cid)

        if not featured_cids:
            featured_cids = [41]
        elif 41 not in featured_cids and ep_num > 3:
            featured_cids.insert(0, 41)

        primary_cid = featured_cids[0]
        primary_char = chars_by_id.get(primary_cid, chars_by_id[41])

        # 4. Render Primary Character 1:1 Standardized Bust on the right side
        bust_path = ANIME_DIR / f"busts/{primary_cid:03d}_bust.png"
        if not bust_path.exists():
            bust_path = ANIME_DIR / "busts/041_bust.png"

        bust_img = Image.open(bust_path).convert("RGBA")
        # Resize bust so it fits beautifully in the right quadrant (height ~ 380px)
        b_target_h = 385
        b_target_w = int(bust_img.width * (b_target_h / float(bust_img.height)))
        bust_scaled = bust_img.resize((b_target_w, b_target_h), Image.Resampling.LANCZOS)

        # Circular glow aura behind the bust
        glow_size = int(b_target_h * 0.95)
        glow_canvas = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        gdraw = ImageDraw.Draw(glow_canvas)
        gx_center = WIDTH - 190
        gy_center = HEIGHT // 2 + 10
        fac_hex = primary_char.get("factionColor", "#4A90E2")
        fac_r, fac_g, fac_b = int(fac_hex[1:3], 16), int(fac_hex[3:5], 16), int(fac_hex[5:7], 16)

        for rad in range(glow_size // 2, 0, -6):
            alpha_glow = int(45 * (rad / float(glow_size / 2)))
            gdraw.ellipse(
                [gx_center - rad, gy_center - rad, gx_center + rad, gy_center + rad],
                fill=(fac_r, fac_g, fac_b, alpha_glow),
            )
        glow_blurred = glow_canvas.filter(ImageFilter.GaussianBlur(18))
        canvas = Image.alpha_composite(canvas, glow_blurred)

        # Paste Bust
        bx = WIDTH - b_target_w - 24
        by = HEIGHT - b_target_h - 10
        canvas.alpha_composite(bust_scaled, (bx, by))

        # Primary Hero Floating Badge on the bust
        draw = ImageDraw.Draw(canvas)
        badge_text = f"★ NO.{primary_cid:03d} {primary_char['nameKo'].upper()} ({primary_char['nameEn'].upper()})"
        badge_w = int(draw.textlength(badge_text, font=f_feat)) + 24
        badge_x0 = WIDTH - badge_w - 28
        badge_y0 = HEIGHT - 46
        draw.rectangle([badge_x0, badge_y0, badge_x0 + badge_w, badge_y0 + 26], fill=(18, 16, 22, 230), outline=(fac_r, fac_g, fac_b, 230), width=1)
        draw.text((badge_x0 + badge_w // 2, badge_y0 + 13), badge_text, fill=(255, 235, 175), font=f_feat, anchor="mm")

        # 5. Render Left Side Typography
        # Title Strings
        title_en = ep_data.get("episodeTitle", f"Episode {ep_num}").strip()
        title_ko = ep_data.get("episodeTitleKo", "").strip()
        title_upper = title_en.upper()

        act_short, act_full = get_act_info(ep_num)

        # Top Badge
        draw.text((44, 48), "SNSHERO  ·  ARCANE ECHOES OFFICIAL WEBTOON", fill=(225, 205, 160), font=f_badge, anchor="lm")
        draw.text((44, 74), act_full, fill=(160, 175, 195), font=f_act, anchor="lm")

        # Episode Pill
        pill_w = 120
        draw.rectangle([44, 102, 44 + pill_w, 128], fill=(24, 26, 36, 220), outline=(225, 195, 130, 200), width=1)
        draw.text((44 + pill_w // 2, 115), f"EPISODE {ep_num:02d}", fill=(245, 220, 150), font=f_ep, anchor="mm")

        # Main Dynamic Title (English)
        title_font_size = 28 if len(title_upper) <= 24 else (23 if len(title_upper) <= 32 else 19)
        try:
            f_title_en = ImageFont.truetype(FONT_EN_BOLD, title_font_size)
        except Exception:
            f_title_en = ImageFont.truetype(FONT_MONO, title_font_size)

        draw.text((44 + 2, 168 + 2), title_upper, fill=(0, 0, 0, 230), font=f_title_en, anchor="lm")
        draw.text((44, 168), title_upper, fill=(255, 255, 255), font=f_title_en, anchor="lm")

        # Korean Subtitle (if available)
        if title_ko:
            f_title_ko = ImageFont.truetype(FONT_KO, 18, index=14)
            draw.text((44 + 1, 204 + 1), title_ko, fill=(0, 0, 0, 220), font=f_title_ko, anchor="lm")
            draw.text((44, 204), title_ko, fill=(215, 230, 255), font=f_title_ko, anchor="lm")

        # Featuring Hero Cast Bar
        char_names_ko = [chars_by_id[c]["nameKo"] for c in featured_cids[:4] if c in chars_by_id]
        if char_names_ko:
            feat_str = "주요 등장 영웅 : " + " · ".join(char_names_ko)
            draw.rectangle([44, 240, 44 + int(draw.textlength(feat_str, font=f_feat_name)) + 20, 264], fill=(20, 24, 32, 190), outline=(80, 110, 150, 140), width=1)
            draw.text((54, 252), feat_str, fill=(200, 225, 255), font=f_feat_name, anchor="lm")

        # Location Info Bar
        loc_clean_name = loc_fname.replace("LOC_", "").replace(".jpg", "").replace("_", " ")
        loc_bar = f"배경 무대 : {loc_clean_name}"
        draw.text((44, 290), loc_bar, fill=(150, 165, 185), font=f_feat_name, anchor="lm")

        # Bottom Chronicle Stamp
        draw.line([(44, 390), (450, 390)], fill=(75, 85, 105, 160), width=1)
        draw.text((44, 408), "DARK FANTASY CHRONICLE  ·  ORIGINAL NOVEL ADAPTATION", fill=(175, 205, 235), font=f_act, anchor="lm")

        # Terminal-Flat double hairline frame
        draw.rectangle([14, 14, WIDTH - 14, HEIGHT - 14], outline=(220, 195, 130, 190), width=1)
        draw.rectangle([18, 18, WIDTH - 18, HEIGHT - 18], outline=(50, 60, 80, 140), width=1)

        sz = save_webp_under_limit(canvas.convert("RGB"), out_file, limit_bytes=75000)
        all_sizes.append(sz)
        total_updated += 1

    print(f"Renamed and regenerated all {total_updated} Episode Opening Title Cards (scene_00.webp) successfully!")
    print(f"Size stats: min={min(all_sizes):,} B, avg={sum(all_sizes)//len(all_sizes):,} B, max={max(all_sizes):,} B")


def main():
    build_webtoon_covers()
    build_ending_promo_scene()
    build_all_40_scene_00_title_cards()
    print("=" * 68)
    print("ALL WEBTOON ASSETS SUCCESSFULLY RENEWED WITH 110 ANIME CHARACTERS!")


if __name__ == "__main__":
    main()
