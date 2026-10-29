#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_all_40_webtoons_with_110_anime.py
Regenerates ALL 2,049 webtoon episode narrative scenes (episode_01..40/scene_01..XX.webp)
using the 110 newly remastered 7-head anime character cutouts & standardized 1:1 busts,
and 20 official anime location art sheets (LOC_001..LOC_020).
"""

import json
import math
import os
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
WEBTOON_DIR = PROJECT_ROOT / "public/images/webtoon"
ANIME_DIR = PROJECT_ROOT / "public/anime-character-sheets"
MANIFEST_PATH = PROJECT_ROOT / "src/content/webtoonEpisodeManifest.json"

WIDTH, HEIGHT = 800, 450

# 40 Episode to Official Location Arts Mapping
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

# Ambient light color tints based on location theme
LOC_TINTS = {
    "Elwin_Village": (210, 230, 255),
    "Drunken_Bell": (255, 235, 205),
    "Mistfall": (200, 220, 235),
    "Great_Plains": (255, 240, 215),
    "Pegasus_Valley": (255, 225, 200),
    "Lighthaven": (255, 245, 225),
    "Red_Glass": (255, 205, 195),
    "Labor_Camp": (205, 195, 215),
    "Cloud_Return": (200, 235, 245),
    "Whispering_Wind": (215, 245, 235),
    "Black_Temple": (210, 205, 230),
    "Sky_Altar": (225, 235, 255),
    "Flower_Ship": (230, 215, 245),
    "Mount_Dragonhorn": (245, 210, 195),
    "The_Sealed": (195, 205, 225),
    "Jade_Council": (215, 240, 225),
    "Citadel_Four": (225, 220, 210),
    "Quicksand": (205, 220, 210),
    "Black_Citadel": (210, 225, 255),
    "Altar_of_Ruin": (255, 215, 200),
}


def load_character_maps():
    with open(ANIME_DIR / "manifest.json", "r", encoding="utf-8") as f:
        mf = json.load(f)

    chars_by_id = {c["id"]: c for c in mf["characters"]}
    name_to_id = {}
    for c in mf["characters"]:
        name_to_id[c["nameEn"].lower()] = c["id"]
        name_to_id[c["nameKo"].lower()] = c["id"]

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
    for q in [84, 80, 76, 72, 68, 64, 60, 56, 52]:
        img.save(out_file, "WEBP", quality=q, method=4)
        sz = out_file.stat().st_size
        if sz <= limit_bytes:
            return sz
    return out_file.stat().st_size


def get_ambient_tint(loc_fname: str) -> tuple[int, int, int]:
    for k, tint in LOC_TINTS.items():
        if k in loc_fname:
            return tint
    return (220, 230, 245)


def draw_comic_speech_bubble(
    canvas: Image.Image,
    cx: int,
    cy: int,
    tail_tip: tuple[int, int],
    is_left_speaker: bool = True,
):
    """
    Renders a crisp comic-style speech bubble with '...' inside.
    If is_left_speaker is True, tail points downward toward left/center (character on left).
    If False, tail points downward toward right/center (character on right).
    """
    bw, bh = 72, 36
    r = 10
    scale = 3
    L_W, L_H = canvas.width * scale, canvas.height * scale

    shape_img = Image.new("L", (L_W, L_H), 0)
    sdraw = ImageDraw.Draw(shape_img)

    lcx, lcy = cx * scale, cy * scale
    lbw, lbh = bw * scale, bh * scale
    lr = r * scale

    bx1 = lcx - lbw // 2
    by1 = lcy - lbh // 2
    bx2 = bx1 + lbw
    by2 = by1 + lbh

    ltx, lty = tail_tip[0] * scale, tail_tip[1] * scale

    if is_left_speaker:
        p1 = (bx1 + int(lbw * 0.40), by2)
        p2 = (bx1 + int(lbw * 0.70), by2)
    else:
        p1 = (bx2 - int(lbw * 0.70), by2)
        p2 = (bx2 - int(lbw * 0.40), by2)
    p3 = (ltx, lty)

    # 1. Solid body + tail
    sdraw.rounded_rectangle([bx1, by1, bx2, by2], radius=lr, fill=255)
    sdraw.polygon([p1, p2, p3], fill=255)

    # 2. Border via dilation
    stroke_radius = int(2.0 * scale)
    outer_mask = shape_img.filter(ImageFilter.MaxFilter(stroke_radius * 2 + 1))
    inner_mask = shape_img

    bubble_layer = Image.new("RGBA", (L_W, L_H), (0, 0, 0, 0))

    # Outer border in dark charcoal
    border_img = Image.new("RGBA", (L_W, L_H), (24, 28, 36, 255))
    bubble_layer.paste(border_img, (0, 0), outer_mask)

    # Inner fill in clean white
    fill_img = Image.new("RGBA", (L_W, L_H), (255, 255, 255, 255))
    bubble_layer.paste(fill_img, (0, 0), inner_mask)

    # 3. Three dots (...) inside bubble
    bdraw = ImageDraw.Draw(bubble_layer)
    dot_r = int(2.6 * scale)
    dot_gap = int(10 * scale)
    dot_color = (24, 28, 36, 255)
    for dx in [-dot_gap, 0, dot_gap]:
        bdraw.ellipse([lcx + dx - dot_r, lcy - dot_r, lcx + dx + dot_r, lcy + dot_r], fill=dot_color)

    # Soft subtle shadow for strong contrast against any background
    shadow = Image.new("RGBA", (L_W, L_H), (0, 0, 0, 0))
    shadow_fill = Image.new("RGBA", (L_W, L_H), (0, 0, 0, 90))
    shadow.paste(shadow_fill, (0, 0), outer_mask)
    shadow = shadow.filter(ImageFilter.GaussianBlur(int(2.5 * scale)))

    down_shadow = shadow.resize((canvas.width, canvas.height), Image.Resampling.LANCZOS)
    down_bubble = bubble_layer.resize((canvas.width, canvas.height), Image.Resampling.LANCZOS)

    s_offset = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    s_offset.paste(down_shadow, (0, 2))

    canvas.alpha_composite(s_offset)
    canvas.alpha_composite(down_bubble)


def render_scene(
    bg_img: Image.Image,
    loc_fname: str,
    ep_num: int,
    sc_idx: int,
    img_meta: dict,
    chars_by_id: dict,
    name_to_id: dict,
    cutouts_cache: dict[int, Image.Image],
    busts_cache: dict[int, Image.Image],
    out_file: Path,
) -> int:
    # 1. Background Camera Crop & Perspective Variation
    bw, bh = bg_img.size
    t_ratio = WIDTH / float(HEIGHT)
    shot_mode = sc_idx % 7

    if shot_mode == 0:
        # Full Wide Establishing Landscape
        crop_w = bw
        crop_h = int(bw / t_ratio)
        bg_crop = bg_img.crop((0, 0, crop_w, min(bh, crop_h))).resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    elif shot_mode in (1, 4):
        # Left-Side Dolly Zoom
        crop_w = int(bw * 0.78)
        crop_h = int(crop_w / t_ratio)
        bg_crop = bg_img.crop((0, int(bh * 0.05), crop_w, int(bh * 0.05) + crop_h)).resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    elif shot_mode in (2, 5):
        # Right-Side Dolly Zoom
        crop_w = int(bw * 0.78)
        crop_h = int(crop_w / t_ratio)
        bg_crop = bg_img.crop((int(bw * 0.22), int(bh * 0.05), bw, int(bh * 0.05) + crop_h)).resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    else:
        # Center Medium Dramatic Zoom
        crop_w = int(bw * 0.72)
        crop_h = int(crop_w / t_ratio)
        ox = (bw - crop_w) // 2
        oy = int(bh * 0.08)
        bg_crop = bg_img.crop((ox, oy, ox + crop_w, oy + crop_h)).resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)

    # Cinematic contrast & lighting grade
    bg_crop = ImageEnhance.Contrast(bg_crop).enhance(1.06)
    canvas = bg_crop.convert("RGBA")

    # 2. Ambient Color Grading & Vignette
    veil = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(veil)
    tint = get_ambient_tint(loc_fname)
    for y in range(HEIGHT):
        dist = abs(y - HEIGHT * 0.5) / (HEIGHT * 0.5)
        a = int(22 + 40 * dist ** 1.3)
        vdraw.line([(0, y), (WIDTH, y)], fill=(12, 16, 24, a))
    canvas = Image.alpha_composite(canvas, veil)

    # 3. Resolve Characters for this scene
    raw_chars = img_meta.get("characters", [])
    dialogues = img_meta.get("dialogues", [])

    cids = []
    # If speaker has characterCardId, place it first
    for d in dialogues:
        cid_d = d.get("characterCardId")
        if cid_d and cid_d in chars_by_id and cid_d not in cids:
            cids.append(cid_d)

    for rc in raw_chars:
        cid = name_to_id.get(rc.lower())
        if not cid:
            for k, v in name_to_id.items():
                if k in rc.lower() or rc.lower() in k:
                    cid = v
                    break
        if cid and cid in chars_by_id and cid not in cids:
            cids.append(cid)

    # If no characters listed but episode has key hero, include hero on certain action/drama beats
    if not cids:
        if sc_idx % 3 != 0:
            # Subtle landscape scene with no foreground actor
            draw = ImageDraw.Draw(canvas)
            draw.rectangle([0, 0, WIDTH - 1, HEIGHT - 1], outline=(35, 42, 54, 180), width=1)
            return save_webp_under_limit(canvas.convert("RGB"), out_file)
        else:
            cids = [41] # Kadan fallback

    # 4. Cinematic Character Composition
    # Determine shot scale (Close-up vs Medium vs Full-body)
    is_dramatic_close = (sc_idx % 5 == 3) or (len(dialogues) > 0 and len(dialogues[0].get("textKo", "")) > 45)
    actor_heads = [] # List of tuples: (head_x, head_y, is_right_facing_left, cid)

    if len(cids) == 1:
        # ─── 1 CHARACTER: FOCUSED DRAMATIC ACTING SHOT ───
        cid = cids[0]
        cut = cutouts_cache.get(cid)
        if cut:
            if is_dramatic_close:
                # Cinematic Close-up using full cutout enlarged (avoids square avatar half-cut issue)
                target_h = int(HEIGHT * 1.15)
                target_w = int(cut.width * (target_h / float(cut.height)))
                s_char = cut.resize((target_w, target_h), Image.Resampling.LANCZOS)
                place_right = (sc_idx % 2 == 0)
                if place_right:
                    s_char = s_char.transpose(Image.FLIP_LEFT_RIGHT)
                    px = WIDTH - target_w - 30
                else:
                    px = 30
                py = HEIGHT - int(target_h * 0.78) # Waist/chest line at bottom of canvas
                actor_heads.append((px + target_w * (0.45 if place_right else 0.55), py + target_h * 0.16, place_right, cid))
            else:
                # Dynamic Full-body Shot
                target_h = int(HEIGHT * 0.88)
                target_w = int(cut.width * (target_h / float(cut.height)))
                s_char = cut.resize((target_w, target_h), Image.Resampling.LANCZOS)
                place_right = (sc_idx % 2 == 0)
                if place_right:
                    s_char = s_char.transpose(Image.FLIP_LEFT_RIGHT)
                    px = WIDTH - target_w - 45
                else:
                    px = 45
                py = HEIGHT - target_h + 10
                actor_heads.append((px + target_w * (0.45 if place_right else 0.55), py + target_h * 0.16, place_right, cid))

            # Soft ambient backlight glow
            glow = Image.new("RGBA", s_char.size, tint + (80,))
            glow.putalpha(s_char.split()[3])
            canvas.alpha_composite(glow.filter(ImageFilter.GaussianBlur(16)), (px, py))
            canvas.alpha_composite(s_char, (px, py))

    elif len(cids) == 2:
        # ─── 2 CHARACTERS: BALANCED TWO-SHOT DIALOGUE OR BATTLE ───
        cid1, cid2 = cids[0], cids[1]
        cut1 = cutouts_cache.get(cid1)
        cut2 = cutouts_cache.get(cid2)

        target_h = int(HEIGHT * 0.78)
        w1 = int(cut1.width * (target_h / float(cut1.height))) if cut1 else 100
        w2 = int(cut2.width * (target_h / float(cut2.height))) if cut2 else 100

        # Scale down slightly if total character widths overlap too much
        if w1 + w2 > WIDTH - 60:
            scale_ratio = (WIDTH - 60) / float(w1 + w2)
            target_h = int(target_h * scale_ratio)
            w1 = int(cut1.width * (target_h / float(cut1.height))) if cut1 else 100
            w2 = int(cut2.width * (target_h / float(cut2.height))) if cut2 else 100

        # Character 1: Left Actor (Facing Right)
        if cut1:
            s1 = cut1.resize((w1, target_h), Image.Resampling.LANCZOS)
            x1 = 25
            y1 = HEIGHT - target_h + 10
            glow1 = Image.new("RGBA", s1.size, tint + (70,))
            glow1.putalpha(s1.split()[3])
            canvas.alpha_composite(glow1.filter(ImageFilter.GaussianBlur(12)), (x1, y1))
            canvas.alpha_composite(s1, (x1, y1))
            actor_heads.append((x1 + w1 * 0.55, y1 + target_h * 0.16, False, cid1))

        # Character 2: Right Actor (Facing Left towards Actor 1)
        if cut2:
            s2 = cut2.resize((w2, target_h), Image.Resampling.LANCZOS).transpose(Image.FLIP_LEFT_RIGHT)
            x2 = WIDTH - w2 - 25
            y2 = HEIGHT - target_h + 10
            glow2 = Image.new("RGBA", s2.size, tint + (70,))
            glow2.putalpha(s2.split()[3])
            canvas.alpha_composite(glow2.filter(ImageFilter.GaussianBlur(12)), (x2, y2))
            canvas.alpha_composite(s2, (x2, y2))
            actor_heads.append((x2 + w2 * 0.45, y2 + target_h * 0.16, True, cid2))

    elif len(cids) >= 3:
        # ─── 3+ CHARACTERS: PROPORTIONALLY SCALED MULTI-HERO GROUP SHOT ───
        # When 3+ heroes appear, scale height down so all characters remain clearly visible without clutter
        base_h = int(HEIGHT * 0.58) if len(cids) == 3 else int(HEIGHT * 0.50)
        
        valid_cuts = []
        for c in cids[:3]:
            ct = cutouts_cache.get(c)
            if ct:
                valid_cuts.append((c, ct))

        if valid_cuts:
            # Auto-fit width calculation
            raw_widths = [int(ct.width * (base_h / float(ct.height))) for _, ct in valid_cuts]
            total_w = sum(raw_widths)
            if total_w > int(WIDTH * 0.88):
                ratio = (WIDTH * 0.88) / float(total_w)
                target_h = max(int(HEIGHT * 0.45), int(base_h * ratio))
                widths = [int(ct.width * (target_h / float(ct.height))) for _, ct in valid_cuts]
            else:
                target_h = base_h
                widths = raw_widths

            y_base = HEIGHT - target_h + 10

            if len(valid_cuts) == 3:
                # 3 Characters: Left, Center, Right balanced layout
                c1_id, cut1 = valid_cuts[0]
                c2_id, cut2 = valid_cuts[1]
                c3_id, cut3 = valid_cuts[2]
                w1, w2, w3 = widths[0], widths[1], widths[2]

                s1 = cut1.resize((w1, target_h), Image.Resampling.LANCZOS)
                s2 = cut2.resize((w2, target_h), Image.Resampling.LANCZOS).transpose(Image.FLIP_LEFT_RIGHT)
                s3 = cut3.resize((w3, target_h), Image.Resampling.LANCZOS)

                x1 = 20
                x2 = WIDTH - w2 - 20
                x3 = (WIDTH - w3) // 2

                # Render center actor first (middle layer), then left & right actors
                for s, x, cid, is_r, head_ratio in [
                    (s3, x3, c3_id, False, 0.50),
                    (s1, x1, c1_id, False, 0.55),
                    (s2, x2, c2_id, True, 0.45),
                ]:
                    glow = Image.new("RGBA", s.size, tint + (65,))
                    glow.putalpha(s.split()[3])
                    canvas.alpha_composite(glow.filter(ImageFilter.GaussianBlur(10)), (x, y_base))
                    canvas.alpha_composite(s, (x, y_base))
                    actor_heads.append((x + s.width * head_ratio, y_base + target_h * 0.16, is_r, cid))

            else:
                # 2 valid from the list fallback
                for i, (cid, cut) in enumerate(valid_cuts):
                    w = widths[i]
                    s = cut.resize((w, target_h), Image.Resampling.LANCZOS)
                    x = 30 if i == 0 else WIDTH - w - 30
                    glow = Image.new("RGBA", s.size, tint + (70,))
                    glow.putalpha(s.split()[3])
                    canvas.alpha_composite(glow.filter(ImageFilter.GaussianBlur(10)), (x, y_base))
                    canvas.alpha_composite(s, (x, y_base))
                    actor_heads.append((x + w * 0.5, y_base + target_h * 0.16, (i != 0), cid))

    # 4.5. Speech Bubble ("...") on Speaking Character (Omit if silence/narration)
    char_dialogues = [
        d for d in dialogues
        if d.get("speakerKo") and d.get("speakerKo") not in ("내레이션", "Narration", "")
        and d.get("speakerEn") not in ("Narration", "Narrator", "")
    ]
    if char_dialogues and actor_heads:
        first_d = char_dialogues[0]
        spk_cid = first_d.get("characterCardId")
        if not spk_cid:
            spk_name = first_d.get("speakerKo", "").strip().lower()
            spk_cid = name_to_id.get(spk_name)
            if not spk_cid:
                spk_name_en = first_d.get("speakerEn", "").strip().lower()
                spk_cid = name_to_id.get(spk_name_en)

        # Match with on-screen actors
        target_actor = None
        if spk_cid:
            for ah in actor_heads:
                if ah[3] == spk_cid:
                    target_actor = ah
                    break
        if not target_actor:
            target_actor = actor_heads[0]

        hx, hy, is_right, _ = target_actor
        if is_right:
            # Actor on Right: bubble placed above/left of head, tail pointing down-right toward head
            bcx = int(hx - 20)
            bcy = max(34, int(hy - 48))
            tail = (int(hx - 5), int(hy - 8))
            is_left = False
        else:
            # Actor on Left: bubble placed above/right of head, tail pointing down-left toward head
            bcx = int(hx + 20)
            bcy = max(34, int(hy - 48))
            tail = (int(hx + 5), int(hy - 8))
            is_left = True

        # Clamp safely within canvas
        bcx = max(45, min(WIDTH - 45, bcx))
        bcy = max(26, min(HEIGHT - 35, bcy))

        draw_comic_speech_bubble(canvas, cx=bcx, cy=bcy, tail_tip=tail, is_left_speaker=is_left)

    # 5. Crisp Terminal-Flat Frame Border
    draw = ImageDraw.Draw(canvas)
    draw.rectangle([0, 0, WIDTH - 1, HEIGHT - 1], outline=(32, 38, 50, 160), width=1)

    return save_webp_under_limit(canvas.convert("RGB"), out_file)


def process_single_episode(ep_num: int) -> tuple[int, int]:
    chars_by_id, name_to_id = load_character_maps()

    # Pre-cache cutouts and busts needed
    cutouts_cache = {}
    busts_cache = {}
    for cid in range(1, 111):
        info = chars_by_id.get(cid)
        if info:
            slug = info["cutoutUrl"].split("/")[-1]
            c_p = ANIME_DIR / "cutouts" / slug
            b_p = ANIME_DIR / "busts" / f"{cid:03d}_bust.png"
            if c_p.exists():
                cutouts_cache[cid] = Image.open(c_p).convert("RGBA")
            if b_p.exists():
                busts_cache[cid] = Image.open(b_p).convert("RGBA")

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    ep_data = manifest.get(str(ep_num), {})
    images_list = ep_data.get("images", [])
    ep_dir = WEBTOON_DIR / f"episode_{ep_num:02d}"
    ep_dir.mkdir(parents=True, exist_ok=True)

    loc_fname = EP_LOC_MAP.get(ep_num, "LOC_001_Elwin_Village.jpg")
    loc_path = ANIME_DIR / "locations/art" / loc_fname
    if loc_path.exists():
        bg_img = Image.open(loc_path).convert("RGB")
    else:
        bg_img = Image.new("RGB", (WIDTH, HEIGHT), (24, 28, 36))

    cnt = 0
    total_bytes = 0

    # Regenerate scenes 01 .. total (scene_00 was already renewed)
    for img in images_list:
        sc_idx = img.get("index", 0)
        if sc_idx == 0:
            continue
        out_file = ep_dir / f"scene_{sc_idx:02d}.webp"
        sz = render_scene(
            bg_img,
            loc_fname,
            ep_num,
            sc_idx,
            img,
            chars_by_id,
            name_to_id,
            cutouts_cache,
            busts_cache,
            out_file,
        )
        cnt += 1
        total_bytes += sz

    return ep_num, cnt


def main():
    print("=" * 72)
    print("REGENERATING ALL 2,049 WEBTOON SCENES WITH 110 NEW ANIME CHARACTERS")
    print("=" * 72)

    total_scenes_rendered = 0
    episodes = list(range(1, 41))

    # Parallel processing across all Mac CPU cores
    max_workers = min(8, os.cpu_count() or 4)
    print(f"Launching parallel rendering engine with {max_workers} worker processes...")

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(process_single_episode, ep): ep for ep in episodes}
        for future in as_completed(futures):
            ep_num = futures[future]
            try:
                ep_id, cnt = future.result()
                total_scenes_rendered += cnt
                print(f"[EP {ep_id:02d}] Finished regenerating {cnt} bespoke anime webtoon scenes!")
            except Exception as e:
                print(f"[EP {ep_num:02d}] ERROR: {e}")

    print("=" * 72)
    print(f"COMPLETED! Successfully regenerated all {total_scenes_rendered} webtoon narrative scenes!")
    print("=" * 72)


if __name__ == "__main__":
    main()
