#!/usr/bin/env python3
"""
generate_webtoon_scenes.py
Automated high-performance generation pipeline for 840 webtoon scenes across 40 episodes.
Synthesizes Gemini Nano Banana backgrounds + Remastered V2 hero portraits into WebP panels.
"""

import os
import sys
import json
import hashlib
import time
import random
import re
from pathlib import Path
from multiprocessing import Pool, cpu_count
from PIL import Image, ImageFilter, ImageDraw, ImageFont

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MANIFEST_PATH = PROJECT_ROOT / "src/content/webtoonEpisodeManifest.json"
CARD_DB_PATH = PROJECT_ROOT / "src/cardDatabase.ts"
BG_DIR = Path("/tmp/webtoon_bg_plates")
SEAT_DIR = PROJECT_ROOT / "public/seat"
OUT_BASE = PROJECT_ROOT / "public/images/webtoon"

# Target dimensions
WIDTH = 800
HEIGHT = 450

# Fonts
FONT_KO_TITLE = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
FONT_MONO = "/System/Library/Fonts/Menlo.ttc"

# Faction elemental aura colors (RGBA)
ELEMENT_AURAS = {
    "water": (60, 160, 255, 130),
    "fire": (255, 95, 40, 140),
    "wind": (110, 240, 175, 125),
    "earth": (215, 175, 95, 130),
    "human": (110, 150, 220, 125),
    "undead": (165, 85, 230, 140),
    "elf": (85, 225, 125, 130),
    "hobbit": (235, 195, 105, 125),
    "beast": (225, 125, 65, 135),
    "monster": (230, 70, 70, 140),
    "mecha": (105, 215, 245, 135),
    "dragon": (245, 85, 85, 150),
    "default": (180, 190, 205, 120),
}

# Pre-indexed character file lookup
SEAT_FILES = {f.name: f for f in SEAT_DIR.glob("*.png")}

# Load element mapping from cardDatabase.ts
def load_element_map():
    elem_map = {}
    if not CARD_DB_PATH.exists():
        return elem_map
    with open(CARD_DB_PATH, "r", encoding="utf-8") as f:
        txt = f.read()
    blocks = re.findall(r'\{[^{}]*title_en:[^{}]*\}', txt, re.DOTALL)
    for b in blocks:
        m_en = re.search(r'title_en:\s*[\'\"]([^\'\"]+)[\'\"]', b)
        m_dis = re.search(r'title_dis:\s*[\'\"]([^\'\"]+)[\'\"]', b)
        m_el = re.search(r'element:\s*[\'\"]([^\'\"]+)[\'\"]', b)
        if m_el:
            el = m_el.group(1).lower()
            if m_en: elem_map[m_en.group(1).lower()] = el
            if m_dis: elem_map[m_dis.group(1).lower()] = el
    return elem_map

ELEMENT_MAP = load_element_map()

def get_character_aura(name: str) -> tuple:
    norm = name.lower()
    el = ELEMENT_MAP.get(norm)
    if not el:
        first = norm.split()[0]
        el = ELEMENT_MAP.get(first, "default")
    return ELEMENT_AURAS.get(el, ELEMENT_AURAS["default"])


from collections import deque

HERO_CACHE = {}

def clean_hero_cutout(hp: Path) -> Image.Image:
    if hp in HERO_CACHE:
        return HERO_CACHE[hp].copy()
    im = Image.open(hp).convert("RGBA")
    w, h = im.size
    px = im.load()
    
    # 1. Remove enclosed near-white background pockets (e.g. between hair strands, arm/sword gaps)
    # Protect central face/eye region: x in [w*0.30, w*0.70], y in [h*0.18, h*0.52]
    visited = [[False]*h for _ in range(w)]
    for sx in range(w):
        for sy in range(h):
            if visited[sx][sy]:
                continue
            r, g, b, a = px[sx, sy]
            if a > 0 and r >= 240 and g >= 240 and b >= 240 and (max(r, g, b) - min(r, g, b)) <= 14:
                # BFS this white component
                q = deque([(sx, sy)])
                visited[sx][sy] = True
                comp_pts = [(sx, sy)]
                touches_transparent = False
                in_face_box = True
                while q:
                    cx, cy = q.popleft()
                    if not (w * 0.30 <= cx <= w * 0.70 and h * 0.18 <= cy <= h * 0.52):
                        in_face_box = False
                    for nx, ny in ((cx-1, cy), (cx+1, cy), (cx, cy-1), (cx, cy+1)):
                        if 0 <= nx < w and 0 <= ny < h:
                            nr, ng, nb, na = px[nx, ny]
                            if na < 30:
                                touches_transparent = True
                            elif not visited[nx][ny] and nr >= 232 and ng >= 232 and nb >= 232 and (max(nr, ng, nb) - min(nr, ng, nb)) <= 20:
                                visited[nx][ny] = True
                                q.append((nx, ny))
                                comp_pts.append((nx, ny))
                        else:
                            touches_transparent = True
                # If it touches transparent edge OR is outside the central face box (e.g., hair/weapon/limb gap)
                if touches_transparent or (not in_face_box and len(comp_pts) >= 12):
                    for cx, cy in comp_pts:
                        px[cx, cy] = (0, 0, 0, 0)

    # 2. Defringe 1-2px bright white halo around transparent boundary
    for _pass in range(2):
        to_clear = []
        to_darken = []
        for x in range(w):
            for y in range(h):
                r, g, b, a = px[x, y]
                if a == 0:
                    continue
                adj_trans = False
                for nx, ny in ((x-1, y), (x+1, y), (x, y-1), (x, y+1)):
                    if not (0 <= nx < w and 0 <= ny < h) or px[nx, ny][3] < 40:
                        adj_trans = True
                        break
                if adj_trans:
                    lum = (r + g + b) / 3.0
                    sat = max(r, g, b) - min(r, g, b)
                    if lum >= 225 and sat <= 24:
                        to_clear.append((x, y))
                    elif lum >= 195 and sat <= 30:
                        to_darken.append((x, y, int(r*0.35), int(g*0.35), int(b*0.35), int(a*0.6)))
        for x, y in to_clear:
            px[x, y] = (0, 0, 0, 0)
        for x, y, nr, ng, nb, na in to_darken:
            px[x, y] = (nr, ng, nb, na)

    HERO_CACHE[hp] = im
    return im.copy()

def resolve_hero_path(name: str) -> Path:
    exact = f"{name.replace(' ', '_')}.png"
    if exact in SEAT_FILES:
        return SEAT_FILES[exact]
    first = f"{name.split()[0]}.png"
    if first in SEAT_FILES:
        return SEAT_FILES[first]
    return None

def create_glow(char_img: Image.Image, color: tuple, radius: int = 8) -> Image.Image:
    alpha = char_img.split()[3]
    glow_col = Image.new("RGBA", char_img.size, color)
    glow = Image.new("RGBA", char_img.size, (0, 0, 0, 0))
    glow.paste(glow_col, (0, 0), mask=alpha)
    return glow.filter(ImageFilter.GaussianBlur(radius=radius))

def get_background_plate(ep_idx: int, bg_desc: str) -> str:
    desc = bg_desc.lower()
    if "blizzard" in desc or "snowbound" in desc or "ice cliff" in desc:
        return "bg_01.jpg"
    if "tavern" in desc or "fire and rune" in desc or "hearth" in desc:
        return "bg_02.jpg"
    if "mountain ridge" in desc or "clouds" in desc or "mist canyon" in desc:
        return "bg_03.jpg"
    if "cavern" in desc or "bell hall" in desc or "ancient chains" in desc or "damp stone" in desc:
        return "bg_04.jpg"
    if "battlefield" in desc or "crimson plain" in desc or "nomad" in desc or "war-torn" in desc:
        return "bg_05.jpg"
    if "enchanted forest" in desc or "moonlight" in desc or "elf sanctuary" in desc or "sylvania" in desc:
        return "bg_06.jpg"
    if "shadow" in desc or "fortified" in desc or "iron gates" in desc or "midnight fortress" in desc:
        return "bg_07.jpg"
    if "coast" in desc or "river valley" in desc or "ocean" in desc or "dark waves" in desc:
        return "bg_08.jpg"
    if "volcanic" in desc or "magma" in desc or "flame chamber" in desc or "molten" in desc:
        return "bg_09.jpg"
    if "memorial" in desc or "graveyard" in desc or "crypt" in desc or "necropolis" in desc:
        return "bg_10.jpg"
    if "colosseum" in desc or "sky" in desc or "wind island" in desc or "aerial" in desc:
        return "bg_11.jpg"
    if "foundry" in desc or "steam forge" in desc or "clockwork" in desc or "settlement" in desc:
        return "bg_12.jpg"
    if "dragon" in desc or "crags" in desc or "precipice" in desc:
        return "bg_13.jpg"
    if "palace court" in desc or "towering arches" in desc or "throne room" in desc or "council" in desc:
        return "bg_14.jpg"
    if "abyss" in desc or "void" in desc or "dimensional tear" in desc:
        return "bg_15.jpg"
    if "dawn" in desc or "morning" in desc or "restoration" in desc:
        return "bg_16.jpg"

    # Narrative arc defaults
    if ep_idx <= 2: return "bg_01.jpg"
    if ep_idx <= 4: return "bg_02.jpg"
    if ep_idx <= 6: return "bg_03.jpg"
    if ep_idx <= 8: return "bg_05.jpg"
    if ep_idx <= 10: return "bg_04.jpg"
    if ep_idx <= 13: return "bg_06.jpg"
    if ep_idx <= 16: return "bg_07.jpg"
    if ep_idx <= 18: return "bg_11.jpg"
    if ep_idx <= 20: return "bg_14.jpg"
    if ep_idx <= 23: return "bg_09.jpg"
    if ep_idx <= 26: return "bg_08.jpg"
    if ep_idx <= 28: return "bg_12.jpg"
    if ep_idx <= 30: return "bg_10.jpg"
    if ep_idx <= 33: return "bg_13.jpg"
    if ep_idx <= 36: return "bg_05.jpg"
    if ep_idx <= 38: return "bg_15.jpg"
    if ep_idx == 39: return "bg_03.jpg"
    return "bg_16.jpg"

def render_title_card(ep_idx: int, ep_data: dict, out_file: Path) -> int:
    bg_plate = "bg_16.jpg" if ep_idx == 40 else f"bg_{(ep_idx % 15) + 1:02d}.jpg"
    bg = Image.open(BG_DIR / bg_plate).convert("RGBA")
    bg = bg.filter(ImageFilter.GaussianBlur(radius=1.2))

    # Dark ink veil
    veil = Image.new("RGBA", (WIDTH, HEIGHT), (16, 14, 14, 192))
    card = Image.alpha_composite(bg, veil)

    draw = ImageDraw.Draw(card)
    # Double hairline decorative borders (Terminal Flat design)
    draw.rectangle([20, 20, WIDTH - 20, HEIGHT - 20], outline=(190, 175, 140, 180), width=1)
    draw.rectangle([24, 24, WIDTH - 24, HEIGHT - 24], outline=(100, 95, 80, 100), width=1)

    # Arc calculation
    if ep_idx <= 10:
        act_str = "ACT I · VOWS IN THE BLIZZARD & BIRTH OF FATE"
    elif ep_idx <= 20:
        act_str = "ACT II · BREATHING THE STARS & JADE SECRETS"
    elif ep_idx <= 30:
        act_str = "ACT III · THE BURNING SEA & VEILS OF DECEIT"
    else:
        act_str = "ACT IV · THE CROSS-SHAPED SCAR & WORLD DEFENSE"

    # Fonts
    font_badge = ImageFont.truetype(FONT_MONO, 13)
    font_ko = ImageFont.truetype(FONT_KO_TITLE, 32)
    font_en = ImageFont.truetype(FONT_MONO, 15)
    font_act = ImageFont.truetype(FONT_MONO, 11)
    font_sub = ImageFont.truetype(FONT_MONO, 11)

    title_ko = ep_data.get("episodeTitleKo", f"제{ep_idx:02d}화")
    title_en = ep_data.get("episodeTitle", f"Episode {ep_idx:02d}")

    # Typography layout
    draw.text((WIDTH // 2, 95), "SNSHERO · ARCANE ECHOES IP TRILOGY", fill=(210, 190, 150), font=font_badge, anchor="mm")
    draw.text((WIDTH // 2, 130), f"— {act_str} —", fill=(150, 140, 125), font=font_act, anchor="mm")
    draw.text((WIDTH // 2, 205), f"제{ep_idx:02d}화 : {title_ko}", fill=(255, 255, 255), font=font_ko, anchor="mm")
    draw.text((WIDTH // 2, 265), title_en, fill=(185, 215, 245), font=font_en, anchor="mm")
    draw.text((WIDTH // 2, 355), "— OFFICIAL GENERATIVE WEBTOON REMAKE —", fill=(140, 135, 125), font=font_sub, anchor="mm")

    # Corner ornaments
    draw.line([(24, 34), (34, 34)], fill=(210, 190, 150), width=1)
    draw.line([(34, 24), (34, 34)], fill=(210, 190, 150), width=1)
    draw.line([(WIDTH - 34, 34), (WIDTH - 24, 34)], fill=(210, 190, 150), width=1)
    draw.line([(WIDTH - 34, 24), (WIDTH - 34, 34)], fill=(210, 190, 150), width=1)
    draw.line([(24, HEIGHT - 34), (34, HEIGHT - 34)], fill=(210, 190, 150), width=1)
    draw.line([(34, HEIGHT - 34), (34, HEIGHT - 24)], fill=(210, 190, 150), width=1)
    draw.line([(WIDTH - 34, HEIGHT - 34), (WIDTH - 24, HEIGHT - 34)], fill=(210, 190, 150), width=1)
    draw.line([(WIDTH - 34, HEIGHT - 34), (WIDTH - 34, HEIGHT - 24)], fill=(210, 190, 150), width=1)

    final_rgb = card.convert("RGB")
    final_rgb.save(out_file, "WEBP", quality=82, method=5)
    return out_file.stat().st_size

def render_story_scene(ep_idx: int, img_data: dict, out_file: Path) -> int:
    idx = img_data["index"]
    bg_desc = img_data.get("background") or ""
    plate = get_background_plate(ep_idx, bg_desc)

    bg = Image.open(BG_DIR / plate).convert("RGBA")
    comp = bg.filter(ImageFilter.GaussianBlur(radius=0.7))

    # Resolve characters
    chars = img_data.get("characters", [])
    valid_heroes = []
    for c in chars:
        hp = resolve_hero_path(c)
        if hp:
            valid_heroes.append((c, hp))

    # Stage characters based on count
    n_heroes = len(valid_heroes)
    if n_heroes == 1:
        c_name, hp = valid_heroes[0]
        h_img = clean_hero_cutout(hp)
        t_h = 370
        t_w = int(256 * t_h / 296)
        h_scaled = h_img.resize((t_w, t_h), Image.Resampling.LANCZOS)
        aura_color = get_character_aura(c_name)
        glow = create_glow(h_scaled, aura_color, radius=8)
        # Alternate position for visual rhythm
        pos_x = (WIDTH - t_w - 70) if (idx % 2 == 1) else 70
        pos = (pos_x, HEIGHT - t_h + 15)
        comp.paste(glow, pos, mask=glow)
        comp.paste(h_scaled, pos, mask=h_scaled)

    elif n_heroes == 2:
        # Duo: Midground right, Foreground left
        c2_name, hp2 = valid_heroes[1]
        h2_img = clean_hero_cutout(hp2)
        t2_h = 330
        t2_w = int(256 * t2_h / 296)
        h2_scaled = h2_img.resize((t2_w, t2_h), Image.Resampling.LANCZOS)
        glow2 = create_glow(h2_scaled, get_character_aura(c2_name), radius=6)
        pos2 = (WIDTH - t2_w - 65, HEIGHT - t2_h + 12)
        comp.paste(glow2, pos2, mask=glow2)
        comp.paste(h2_scaled, pos2, mask=h2_scaled)

        c1_name, hp1 = valid_heroes[0]
        h1_img = clean_hero_cutout(hp1)
        t1_h = 370
        t1_w = int(256 * t1_h / 296)
        h1_scaled = h1_img.resize((t1_w, t1_h), Image.Resampling.LANCZOS)
        glow1 = create_glow(h1_scaled, get_character_aura(c1_name), radius=9)
        pos1 = (65, HEIGHT - t1_h + 15)
        comp.paste(glow1, pos1, mask=glow1)
        comp.paste(h1_scaled, pos1, mask=h1_scaled)

    elif n_heroes == 3:
        # Trio: Left flank, Right flank, Center foreground
        # Left
        cl_name, hpl = valid_heroes[1]
        hl_img = clean_hero_cutout(hpl)
        tl_h = 310
        tl_w = int(256 * tl_h / 296)
        hl_scaled = hl_img.resize((tl_w, tl_h), Image.Resampling.LANCZOS)
        glowl = create_glow(hl_scaled, get_character_aura(cl_name), radius=6)
        comp.paste(glowl, (40, HEIGHT - tl_h + 10), mask=glowl)
        comp.paste(hl_scaled, (40, HEIGHT - tl_h + 10), mask=hl_scaled)

        # Right
        cr_name, hpr = valid_heroes[2]
        hr_img = clean_hero_cutout(hpr)
        tr_h = 310
        tr_w = int(256 * tr_h / 296)
        hr_scaled = hr_img.resize((tr_w, tr_h), Image.Resampling.LANCZOS)
        glowr = create_glow(hr_scaled, get_character_aura(cr_name), radius=6)
        comp.paste(glowr, (WIDTH - tr_w - 40, HEIGHT - tr_h + 10), mask=glowr)
        comp.paste(hr_scaled, (WIDTH - tr_w - 40, HEIGHT - tr_h + 10), mask=hr_scaled)

        # Center Foreground
        cc_name, hpc = valid_heroes[0]
        hc_img = clean_hero_cutout(hpc)
        tc_h = 360
        tc_w = int(256 * tc_h / 296)
        hc_scaled = hc_img.resize((tc_w, tc_h), Image.Resampling.LANCZOS)
        glowc = create_glow(hc_scaled, get_character_aura(cc_name), radius=9)
        pos_c = (WIDTH // 2 - tc_w // 2, HEIGHT - tc_h + 15)
        comp.paste(glowc, pos_c, mask=glowc)
        comp.paste(hc_scaled, pos_c, mask=hc_scaled)

    elif n_heroes >= 4:
        # 4+ Heroes: Multi-plane ensemble
        # Deep midground
        c4_name, hp4 = valid_heroes[3]
        h4_img = clean_hero_cutout(hp4)
        t4_h = 280
        t4_w = int(256 * t4_h / 296)
        h4_scaled = h4_img.resize((t4_w, t4_h), Image.Resampling.LANCZOS)
        comp.paste(h4_scaled, (390, HEIGHT - t4_h + 5), mask=h4_scaled)

        # Left flank
        c2_name, hp2 = valid_heroes[1]
        h2_img = clean_hero_cutout(hp2)
        t2_h = 310
        t2_w = int(256 * t2_h / 296)
        h2_scaled = h2_img.resize((t2_w, t2_h), Image.Resampling.LANCZOS)
        comp.paste(h2_scaled, (30, HEIGHT - t2_h + 10), mask=h2_scaled)

        # Right flank
        c3_name, hp3 = valid_heroes[2]
        h3_img = clean_hero_cutout(hp3)
        t3_h = 310
        t3_w = int(256 * t3_h / 296)
        h3_scaled = h3_img.resize((t3_w, t3_h), Image.Resampling.LANCZOS)
        comp.paste(h3_scaled, (WIDTH - t3_w - 30, HEIGHT - t3_h + 10), mask=h3_scaled)

        # Foreground
        c1_name, hp1 = valid_heroes[0]
        h1_img = clean_hero_cutout(hp1)
        t1_h = 360
        t1_w = int(256 * t1_h / 296)
        h1_scaled = h1_img.resize((t1_w, t1_h), Image.Resampling.LANCZOS)
        glow1 = create_glow(h1_scaled, get_character_aura(c1_name), radius=8)
        pos1 = (210, HEIGHT - t1_h + 15)
        comp.paste(glow1, pos1, mask=glow1)
        comp.paste(h1_scaled, pos1, mask=h1_scaled)

    # Narrative Atmospheric Particle VFX (seeded per scene)
    rng = random.Random(ep_idx * 1000 + idx)
    vfx = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    vfx_draw = ImageDraw.Draw(vfx)

    # Arc particles
    if ep_idx <= 10:
        # Arc 1: Blizzard snowflakes and frost motes
        for _ in range(rng.randint(18, 28)):
            px = rng.randint(10, WIDTH - 10)
            py = rng.randint(25, HEIGHT - 25)
            pr = rng.uniform(1.0, 2.5)
            alpha = rng.randint(110, 200)
            vfx_draw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=(225, 240, 255, alpha))
    elif ep_idx <= 20:
        # Arc 2: Star breathing arcane specks & leaves
        for _ in range(rng.randint(16, 26)):
            px = rng.randint(10, WIDTH - 10)
            py = rng.randint(25, HEIGHT - 25)
            pr = rng.uniform(1.0, 2.2)
            alpha = rng.randint(100, 190)
            vfx_draw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=(130, 245, 190, alpha))
    elif ep_idx <= 30:
        # Arc 3: Dark ember embers and violet shadow motes
        for _ in range(rng.randint(18, 28)):
            px = rng.randint(10, WIDTH - 10)
            py = rng.randint(25, HEIGHT - 25)
            pr = rng.uniform(1.0, 2.5)
            alpha = rng.randint(120, 210)
            col = (255, 120, 50, alpha) if rng.random() > 0.5 else (180, 110, 255, alpha)
            vfx_draw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=col)
    else:
        # Arc 4: Golden dawn celestial spark and holy light
        for _ in range(rng.randint(20, 30)):
            px = rng.randint(10, WIDTH - 10)
            py = rng.randint(25, HEIGHT - 25)
            pr = rng.uniform(1.0, 2.8)
            alpha = rng.randint(130, 220)
            vfx_draw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=(255, 225, 140, alpha))

    comp = Image.alpha_composite(comp, vfx)

    # Cinematic Vignette, Letterbox, and Border
    vignette = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)

    # Soft bottom ground gradient for footing
    for i in range(50):
        alpha_val = int((i / 50.0) ** 1.5 * 140)
        vdraw.line([(0, HEIGHT - 50 + i), (WIDTH, HEIGHT - 50 + i)], fill=(12, 10, 10, alpha_val))

    # Top & bottom cinematic letterbox bars
    vdraw.rectangle([0, 0, WIDTH, 22], fill=(10, 9, 9, 160))
    vdraw.rectangle([0, HEIGHT - 22, WIDTH, HEIGHT], fill=(10, 9, 9, 180))

    # 1px hairline dark fantasy border
    vdraw.rectangle([0, 0, WIDTH - 1, HEIGHT - 1], outline=(55, 52, 50, 200), width=1)

    # Typographic monospace watermark badge
    font_mono = ImageFont.truetype(FONT_MONO, 11)
    vdraw.text((WIDTH - 15, 11), f"EP.{ep_idx:02d} · SCENE {idx:02d}", fill=(185, 180, 170, 180), font=font_mono, anchor="rm")
    vdraw.text((15, 11), "SNSHERO REVOLUTION", fill=(160, 150, 130, 160), font=font_mono, anchor="lm")

    comp = Image.alpha_composite(comp, vignette)
    final_rgb = comp.convert("RGB")

    # Adaptive WebP compression loop (<= 75,000 bytes)
    for q in [82, 78, 74, 70, 65, 60, 55]:
        final_rgb.save(out_file, "WEBP", quality=q, method=5)
        sz = out_file.stat().st_size
        if sz <= 75000:
            return sz
    return out_file.stat().st_size

def process_single_scene(args):
    ep_idx, img_data, ep_data = args
    idx = img_data["index"]
    ep_dir = OUT_BASE / f"episode_{ep_idx:02d}"
    ep_dir.mkdir(parents=True, exist_ok=True)
    out_file = ep_dir / f"scene_{idx:02d}.webp"

    if idx == 0:
        sz = render_title_card(ep_idx, ep_data, out_file)
    else:
        sz = render_story_scene(ep_idx, img_data, out_file)

    with open(out_file, "rb") as f:
        sha256 = hashlib.sha256(f.read()).hexdigest()

    return ep_idx, idx, sz, sha256

def optimize_climax_images():
    """Update climax images under public/images/webtoon/ (both .webp and .jpg <= 75 KB)."""
    climax_names = [
        "ep01_blizzard_vow",
        "ep08_crimson_mane",
        "ep15_shadow_duel",
        "ep25_assassin_ambush",
        "ep40_eternal_shield"
    ]
    results = {}
    for name in climax_names:
        jpg_src = OUT_BASE / f"{name}.jpg"
        webp_out = OUT_BASE / f"{name}.webp"
        if not jpg_src.exists():
            continue

        im = Image.open(jpg_src).convert("RGB")
        im_resized = im.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)

        # 1. Save optimized WebP
        for q in [82, 78, 75, 72, 68, 65, 60, 55, 50]:
            im_resized.save(webp_out, "WEBP", quality=q, method=5)
            sz_w = webp_out.stat().st_size
            if sz_w <= 75000:
                break

        # 2. Also re-save JPG optimized <= 75 KB so no oversized JPG remains
        for q in [82, 78, 75, 70, 65, 60, 55, 50]:
            im_resized.save(jpg_src, "JPEG", quality=q, optimize=True)
            sz_j = jpg_src.stat().st_size
            if sz_j <= 75000:
                break

        results[name] = {"webp_size": webp_out.stat().st_size, "jpg_size": jpg_src.stat().st_size}
    return results

def main():
    t0 = time.time()
    OUT_BASE.mkdir(parents=True, exist_ok=True)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    tasks = []
    for ep_idx in range(1, 41):
        ep_data = manifest[str(ep_idx)]
        for img in ep_data.get("images", []):
            tasks.append((ep_idx, img, ep_data))

    print(f"Starting parallel generation of {len(tasks)} scenes with {cpu_count()} cores...")
    with Pool(cpu_count()) as pool:
        results = pool.map(process_single_scene, tasks)

    print("Generating and optimizing climax hero WebP assets...")
    climax_res = optimize_climax_images()
    for name, sz_info in climax_res.items():
        print(f"  {name}: WebP={sz_info['webp_size']:,} B, JPG={sz_info['jpg_size']:,} B")

    # Complete Audit
    total_bytes = sum(r[2] for r in results)
    hashes = set(r[3] for r in results)
    sizes = [r[2] for r in results]

    print("\n========================================================")
    print(f"Generation Complete in {time.time() - t0:.2f}s!")
    print(f"Total Scenes: {len(results)}")
    print(f"Distinct SHA-256 Hashes: {len(hashes)} / {len(results)}")
    print(f"Min Size: {min(sizes):,} B | Max Size: {max(sizes):,} B | Avg Size: {total_bytes/len(sizes):,.0f} B")
    print(f"Total Library Size: {total_bytes / (1024*1024):.2f} MB")
    print("========================================================")

    assert len(results) == len(tasks), f"Expected {len(tasks)} scenes, got {len(results)}"
    assert len(hashes) == len(tasks), f"Duplicate detected! {len(hashes)} unique hashes"
    assert all(4096 <= s <= 76800 for s in sizes), "Size constraint violated!"

if __name__ == "__main__":
    main()
