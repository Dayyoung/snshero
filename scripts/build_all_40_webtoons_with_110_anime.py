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

    if len(cids) == 1:
        # ─── 1 CHARACTER: FOCUSED DRAMATIC ACTING SHOT ───
        cid = cids[0]
        if is_dramatic_close and cid in busts_cache:
            # Use 1:1 Standardized Bust for powerful emotional close-up
            bust = busts_cache[cid]
            b_h = int(HEIGHT * 0.96)
            b_w = int(bust.width * (b_h / float(bust.height)))
            s_char = bust.resize((b_w, b_h), Image.Resampling.LANCZOS)
            place_right = (sc_idx % 2 == 0)
            if place_right:
                s_char = s_char.transpose(Image.FLIP_LEFT_RIGHT)
                px = WIDTH - b_w - 30
            else:
                px = 30
            py = HEIGHT - b_h
        else:
            # Use 7-head Full-body Cutout
            cut = cutouts_cache.get(cid) or busts_cache.get(cid)
            if cut:
                target_h = int(HEIGHT * 0.90)
                target_w = int(cut.width * (target_h / float(cut.height)))
                s_char = cut.resize((target_w, target_h), Image.Resampling.LANCZOS)
                place_right = (sc_idx % 2 == 0)
                if place_right:
                    s_char = s_char.transpose(Image.FLIP_LEFT_RIGHT)
                    px = WIDTH - target_w - 50
                else:
                    px = 50
                py = HEIGHT - target_h + 10
            else:
                s_char = None

        if s_char:
            # Soft ambient backlight glow
            glow = Image.new("RGBA", s_char.size, tint + (80,))
            glow.putalpha(s_char.split()[3])
            canvas.alpha_composite(glow.filter(ImageFilter.GaussianBlur(16)), (px, py))
            canvas.alpha_composite(s_char, (px, py))

    elif len(cids) >= 2:
        # ─── 2+ CHARACTERS: DYNAMIC TWO-SHOT DIALOGUE OR BATTLE ───
        cid1, cid2 = cids[0], cids[1]
        cut1 = cutouts_cache.get(cid1)
        cut2 = cutouts_cache.get(cid2)

        target_h = int(HEIGHT * 0.86)

        # Character 1: Left Actor (Facing Right)
        if cut1:
            w1 = int(cut1.width * (target_h / float(cut1.height)))
            s1 = cut1.resize((w1, target_h), Image.Resampling.LANCZOS)
            x1 = 25
            y1 = HEIGHT - target_h + 12
            glow1 = Image.new("RGBA", s1.size, tint + (70,))
            glow1.putalpha(s1.split()[3])
            canvas.alpha_composite(glow1.filter(ImageFilter.GaussianBlur(12)), (x1, y1))
            canvas.alpha_composite(s1, (x1, y1))

        # Character 2: Right Actor (Facing Left towards Actor 1)
        if cut2:
            w2 = int(cut2.width * (target_h / float(cut2.height)))
            s2 = cut2.resize((w2, target_h), Image.Resampling.LANCZOS).transpose(Image.FLIP_LEFT_RIGHT)
            x2 = WIDTH - w2 - 25
            y2 = HEIGHT - target_h + 12
            glow2 = Image.new("RGBA", s2.size, tint + (70,))
            glow2.putalpha(s2.split()[3])
            canvas.alpha_composite(glow2.filter(ImageFilter.GaussianBlur(12)), (x2, y2))
            canvas.alpha_composite(s2, (x2, y2))

        # If 3rd character exists, place slightly in the background
        if len(cids) >= 3:
            cid3 = cids[2]
            cut3 = cutouts_cache.get(cid3)
            if cut3:
                h3 = int(HEIGHT * 0.68) # 3D depth perspective
                w3 = int(cut3.width * (h3 / float(cut3.height)))
                s3 = cut3.resize((w3, h3), Image.Resampling.LANCZOS)
                x3 = (WIDTH - w3) // 2
                y3 = HEIGHT - h3 - 20
                # Darken background actor slightly for depth
                s3_arr = s3.split()
                s3_rgb = ImageEnhance.Brightness(s3.convert("RGB")).enhance(0.85).convert("RGBA")
                s3_rgb.putalpha(s3_arr[3])
                canvas.alpha_composite(s3_rgb, (x3, y3))

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
