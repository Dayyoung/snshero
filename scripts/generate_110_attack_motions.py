#!/usr/bin/env python3
"""
Generates high-impact, dynamic Attack Motion images for all 110 SNSHero characters:
1. Individual 256x296 RGBA cutouts:
   - public/seat_attack/{Character_File}.png
   - public/characters/animations/card-001.webp .. card-110.webp
2. Full Sprite Sheets (100% compatible with getCardSpriteCoords):
   - public/cards1_attack.png (1000x1000 RGBA, 10x10 grid for Cards 1..100)
   - public/cards2_attack.png (1000x1000 RGBA, 10x10 grid for Cards 101..110)
   - public/card100_attack.png (1135x1315 RGBA, 10x11 grid for Cards 1..110)
"""

import math
import random
import re
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SEAT_DIR = PROJECT_ROOT / "public" / "seat"
SEAT_ATTACK_DIR = PROJECT_ROOT / "public" / "seat_attack"
CHAR_ANIM_DIR = PROJECT_ROOT / "public" / "characters" / "animations"

FACTION_PALETTES = {
    "water": {
        "ink": (7, 42, 68),
        "deep": (2, 132, 199),
        "mid": (56, 189, 248),
        "bright": (186, 230, 253),
        "core": (245, 252, 255),
        "motif": "droplet",
    },
    "fire": {
        "ink": (69, 16, 6),
        "deep": (220, 38, 38),
        "mid": (249, 115, 22),
        "bright": (253, 224, 71),
        "core": (255, 252, 235),
        "motif": "flame",
    },
    "wind": {
        "ink": (6, 68, 52),
        "deep": (13, 148, 136),
        "mid": (45, 212, 191),
        "bright": (167, 243, 208),
        "core": (242, 255, 252),
        "motif": "gale",
    },
    "earth": {
        "ink": (56, 38, 12),
        "deep": (180, 83, 9),
        "mid": (132, 204, 22),
        "bright": (253, 224, 71),
        "core": (254, 252, 232),
        "motif": "crystal",
    },
    "human": {
        "ink": (23, 37, 84),
        "deep": (37, 99, 235),
        "mid": (234, 179, 8),
        "bright": (254, 240, 138),
        "core": (255, 255, 255),
        "motif": "holy_cross",
    },
    "undead": {
        "ink": (35, 10, 52),
        "deep": (109, 40, 217),
        "mid": (192, 132, 252),
        "bright": (233, 213, 255),
        "core": (252, 245, 255),
        "motif": "soul_wisp",
    },
    "elf": {
        "ink": (18, 72, 38),
        "deep": (22, 163, 74),
        "mid": (74, 222, 128),
        "bright": (254, 240, 138),
        "core": (245, 255, 248),
        "motif": "star_leaf",
    },
    "dwarf": {
        "ink": (69, 24, 4),
        "deep": (180, 83, 9),
        "mid": (245, 158, 11),
        "bright": (253, 224, 71),
        "core": (255, 252, 235),
        "motif": "forge_spark",
    },
    "monster": {
        "ink": (76, 5, 25),
        "deep": (190, 18, 60),
        "mid": (244, 63, 94),
        "bright": (253, 164, 175),
        "core": (255, 242, 244),
        "motif": "fang_claw",
    },
    "robot": {
        "ink": (15, 23, 42),
        "deep": (37, 99, 235),
        "mid": (6, 182, 212),
        "bright": (165, 243, 252),
        "core": (255, 255, 255),
        "motif": "laser_hex",
    },
    "dragon": {
        "ink": (69, 10, 10),
        "deep": (185, 28, 28),
        "mid": (239, 68, 68),
        "bright": (250, 204, 21),
        "core": (255, 252, 235),
        "motif": "dragon_flare",
    },
}

ATTACK_TYPES = ["slash", "blast", "strike", "burst", "spin", "charge"]


def parse_110_cards():
    db_text = (PROJECT_ROOT / "src" / "cardDatabase.ts").read_text(encoding="utf-8")
    ip_text = (PROJECT_ROOT / "src" / "content" / "characterIp.ts").read_text(encoding="utf-8")
    seat_files = {p.name: p for p in SEAT_DIR.glob("*.png")}

    # Fast block parsing for characterIp.ts
    ip_blocks = {}
    for block in ip_text.split("cardId:")[1:]:
        m_id = re.match(r"\s*(\d+)", block)
        if not m_id:
            continue
        cid_num = int(m_id.group(1))
        f_m = re.search(r"faction:\s*'([^']+)'", block)
        a_m = re.search(r"archetype:\s*'([^']+)'", block)
        atk_m = re.search(r"attackAnimation:\s*'([^']+)'", block)
        ip_blocks[cid_num] = (
            f_m.group(1) if f_m else None,
            a_m.group(1) if a_m else "warrior",
            atk_m.group(1) if atk_m else None,
        )

    cards = {}
    for line in db_text.splitlines():
        m = re.search(
            r"^\s*(\d+):\s*\{.*?title:\s*'([^']+)',\s*title_en:\s*'([^']+)'.*?power:\s*(\d+),\s*title_dis:\s*'([^']+)',\s*rarity:\s*'([^']+)',\s*element:\s*'([^']+)',\s*stats:\s*\[(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\]",
            line,
        )
        if not m:
            continue
        cid_s, t_ko, t_en, power, t_dis, rarity, elem, s_top, s_right, s_bot, s_left = m.groups()
        cid = int(cid_s)
        cards[cid] = {
            "id": cid,
            "title_ko": t_ko,
            "title_en": t_en,
            "title_dis": t_dis,
            "power": int(power),
            "rarity": rarity,
            "element": elem,
            "stats": [int(s_top), int(s_right), int(s_bot), int(s_left)],
        }

    # Fallback multiline parse for cards with multi-line definitions in cardDatabase.ts
    for cid in range(1, 111):
        if cid not in cards:
            chunk_start = db_text.find(f"  {cid}: {{")
            chunk = db_text[chunk_start : chunk_start + 900]
            m = re.search(
                r"title:\s*'([^']+)',\s*title_en:\s*'([^']+)'.*?power:\s*(\d+),\s*title_dis:\s*'([^']+)',\s*rarity:\s*'([^']+)',\s*element:\s*'([^']+)',\s*stats:\s*\[(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\]",
                chunk,
                re.S,
            )
            if not m:
                raise RuntimeError(f"Could not parse card {cid}")
            t_ko, t_en, power, t_dis, rarity, elem, s_top, s_right, s_bot, s_left = m.groups()
            cards[cid] = {
                "id": cid,
                "title_ko": t_ko,
                "title_en": t_en,
                "title_dis": t_dis,
                "power": int(power),
                "rarity": rarity,
                "element": elem,
                "stats": [int(s_top), int(s_right), int(s_bot), int(s_left)],
            }

        c = cards[cid]
        elem = c["element"]
        default_faction = "wind" if elem == "air" else ("earth" if elem == "land" else elem)
        ip_f, ip_arch, ip_atk = ip_blocks.get(cid, (None, "warrior", None))
        c["faction"] = ip_f or default_faction
        c["archetype"] = ip_arch or "warrior"
        c["attackAnimation"] = ip_atk or ATTACK_TYPES[(cid - 1) % len(ATTACK_TYPES)]

        fname1 = c["title_en"].replace(" ", "_") + ".png"
        fname2 = c["title_dis"].replace(" ", "_") + ".png"
        seat_path = seat_files.get(fname1) or seat_files.get(fname2)
        if not seat_path:
            raise RuntimeError(f"Missing seat PNG for card {cid}: {fname1} / {fname2}")
        c["seat_path"] = seat_path
        c["seat_filename"] = seat_path.name

    return cards


def warp_character_attack_pose(img: Image.Image, atk_type: str, cid: int) -> Image.Image:
    """
    Applies a strong, unmistakable articulated 2D action pose deformation:
    - Forward combat tilt (-10 to -13 deg) or upward awakening surge
    - Weapon-arm / front-side perspective enlargement (18-22%) and downward swing arc
    - Grounded or leaping lower-body counter-balance
    """
    arr = np.array(img, dtype=np.float32)
    h, w, _ = arr.shape
    yy, xx = np.meshgrid(np.arange(h, dtype=np.float32), np.arange(w, dtype=np.float32), indexing="ij")

    nx = (xx - w * 0.5) / (w * 0.5)
    ny = (yy - h * 0.5) / (h * 0.5)

    # Smooth anatomical masks
    upper_w = np.clip((0.88 - ny) / 1.6, 0.0, 1.0)
    weapon_side_w = np.clip((0.28 - nx) / 1.15, 0.0, 1.0)  # Left side = weapon hand

    if atk_type in ("slash", "charge"):
        # Aggressive forward-left lunge + weapon arm swings down and looms 18% larger
        tilt_rad = math.radians(-10.5 if atk_type == "slash" else -12.5)
        cos_t, sin_t = math.cos(tilt_rad), math.sin(tilt_rad)
        local_scale = 1.04 + 0.14 * weapon_side_w
        dx = (xx - w * 0.52) / local_scale
        dy = (yy - h * 0.54) / local_scale
        rx = cos_t * dx - sin_t * dy
        ry = sin_t * dx + cos_t * dy
        src_x = rx + w * 0.52 + upper_w * 12.0
        src_y = ry + h * 0.54 - weapon_side_w * 16.0
    elif atk_type == "strike":
        # Heavy overhead crush: weapon & upper body surge forward and slam downward
        tilt_rad = math.radians(-8.5)
        cos_t, sin_t = math.cos(tilt_rad), math.sin(tilt_rad)
        local_scale = 1.06 + 0.14 * (weapon_side_w * 0.7 + upper_w * 0.3)
        dx = (xx - w * 0.50) / local_scale
        dy = (yy - h * 0.52) / local_scale
        rx = cos_t * dx - sin_t * dy
        ry = sin_t * dx + cos_t * dy
        src_x = rx + w * 0.50 + upper_w * 10.0
        src_y = ry + h * 0.52 - weapon_side_w * 18.0 + (1.0 - weapon_side_w) * 6.0
    elif atk_type == "blast":
        # Dynamic casting/breath projection: chest & weapon thrust forward
        tilt_rad = math.radians(-7.0)
        cos_t, sin_t = math.cos(tilt_rad), math.sin(tilt_rad)
        center_boost = np.exp(-(nx * nx + (ny + 0.08) ** 2) * 1.6)
        local_scale = 1.05 + 0.12 * center_boost + 0.08 * weapon_side_w
        dx = (xx - w * 0.50) / local_scale
        dy = (yy - h * 0.52) / local_scale
        src_x = cos_t * dx - sin_t * dy + w * 0.50 + upper_w * 8.0
        src_y = sin_t * dx + cos_t * dy + h * 0.52 - weapon_side_w * 10.0
    elif atk_type == "spin":
        # Dynamic whirling slash twist
        twist_angle = -0.18 + 0.12 * ny
        cos_t = np.cos(twist_angle)
        sin_t = np.sin(twist_angle)
        local_scale = 1.06 + 0.10 * weapon_side_w
        dx = (xx - w * 0.50) / local_scale
        dy = (yy - h * 0.52) / local_scale
        src_x = cos_t * dx - sin_t * dy + w * 0.50 + 8.0
        src_y = sin_t * dx + cos_t * dy + h * 0.52 - weapon_side_w * 12.0
    else:  # burst
        # Awakened upward levitation + chest/weapon expansion
        tilt_rad = math.radians(-6.5)
        cos_t, sin_t = math.cos(tilt_rad), math.sin(tilt_rad)
        local_scale = 1.07 + 0.10 * upper_w + 0.06 * weapon_side_w
        dx = (xx - w * 0.50) / local_scale
        dy = (yy - h * 0.48) / local_scale
        src_x = cos_t * dx - sin_t * dy + w * 0.50 + upper_w * 6.0
        src_y = sin_t * dx + cos_t * dy + h * 0.52 + 8.0 - weapon_side_w * 10.0

    x0 = np.floor(src_x).astype(np.int32)
    y0 = np.floor(src_y).astype(np.int32)
    x1 = x0 + 1
    y1 = y0 + 1
    wx = src_x - x0
    wy = src_y - y0

    valid = (x0 >= 0) & (x1 < w) & (y0 >= 0) & (y1 < h)
    x0_c = np.clip(x0, 0, w - 1)
    x1_c = np.clip(x1, 0, w - 1)
    y0_c = np.clip(y0, 0, h - 1)
    y1_c = np.clip(y1, 0, h - 1)

    out = (
        arr[y0_c, x0_c] * ((1 - wx) * (1 - wy))[..., None]
        + arr[y0_c, x1_c] * (wx * (1 - wy))[..., None]
        + arr[y1_c, x0_c] * ((1 - wx) * wy)[..., None]
        + arr[y1_c, x1_c] * (wx * wy)[..., None]
    )
    out[~valid] = 0
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def build_character_with_motion_echo(warped_char: Image.Image, pal: dict, atk_type: str) -> Image.Image:
    """
    Composites:
    1. Kinetic motion-blur afterimage trail behind the lunging character
    2. Outer elemental rim-light silhouette aura (without tinting the character's face/beard!)
    3. Sharp contrast-boosted character cutout
    """
    w, h = warped_char.size
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    arr = np.array(warped_char, dtype=np.float32)
    alpha = arr[:, :, 3]
    alpha_img = Image.fromarray(np.clip(alpha, 0, 255).astype(np.uint8))

    # Morphological closing mask of the character body: prevents aura/ghost from bleeding into interior holes
    closed_body = np.array(
        alpha_img.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.MinFilter(15)),
        dtype=np.float32,
    )
    exterior_only = 1.0 - np.clip((closed_body - alpha) / 120.0, 0.0, 1.0)

    # 1. Motion afterimage echoes shifted behind the lunge direction
    ghost = np.zeros_like(arr)
    ghost[:, :, 0] = arr[:, :, 0] * 0.30 + pal["mid"][0] * 0.70
    ghost[:, :, 1] = arr[:, :, 1] * 0.30 + pal["mid"][1] * 0.70
    ghost[:, :, 2] = arr[:, :, 2] * 0.30 + pal["mid"][2] * 0.70

    g1 = ghost.copy()
    g1[:, :, 3] = alpha * 0.26
    g1_img = Image.fromarray(np.clip(g1, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.5))

    g2 = ghost.copy()
    g2[:, :, 3] = alpha * 0.45
    g2_img = Image.fromarray(np.clip(g2, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))

    ox, oy = (24, -10) if atk_type in ("slash", "charge", "strike") else ((16, 12) if atk_type == "burst" else (18, -6))
    canvas.alpha_composite(g1_img, (ox, oy))
    canvas.alpha_composite(g2_img, (ox // 2, oy // 2))

    # 2. Outer elemental rim-glow behind character silhouette (masked out from interior holes)
    dilated = alpha_img.filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.GaussianBlur(5.0))
    aura_arr = np.zeros((h, w, 4), dtype=np.uint8)
    aura_arr[:, :, 0] = pal["mid"][0]
    aura_arr[:, :, 1] = pal["mid"][1]
    aura_arr[:, :, 2] = pal["mid"][2]
    aura_arr[:, :, 3] = np.clip(np.array(dilated, dtype=np.float32) * 0.80 * exterior_only, 0, 255).astype(np.uint8)
    canvas.alpha_composite(Image.fromarray(aura_arr))

    # Mask any ghost trail pixels that fell inside interior holes of the character
    canvas_arr = np.array(canvas, dtype=np.float32)
    canvas_arr[:, :, 3] *= exterior_only
    canvas = Image.fromarray(np.clip(canvas_arr, 0, 255).astype(np.uint8))

    # 3. Crisp silhouette edge rim-light ONLY on outer boundary
    eroded = np.array(alpha_img.filter(ImageFilter.MinFilter(5)), dtype=np.float32)
    outer_rim = np.clip((alpha - eroded) / 255.0, 0.0, 1.0) * (alpha / 255.0) * exterior_only

    rgb_img = Image.fromarray(np.clip(arr[:, :, :3], 0, 255).astype(np.uint8))
    rgb_img = ImageEnhance.Contrast(rgb_img).enhance(1.08)
    rgb_img = ImageEnhance.Color(rgb_img).enhance(1.14)
    enh_arr = np.array(rgb_img, dtype=np.float32)

    for c_idx in range(3):
        enh_arr[:, :, c_idx] = enh_arr[:, :, c_idx] * (1.0 - outer_rim * 0.65) + pal["bright"][c_idx] * (
            outer_rim * 0.65
        )

    final_char = np.zeros((h, w, 4), dtype=np.uint8)
    final_char[:, :, :3] = np.clip(enh_arr, 0, 255).astype(np.uint8)
    final_char[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    canvas.alpha_composite(Image.fromarray(final_char))
    return canvas


def draw_bezier_slash_ribbon(
    draw: ImageDraw.ImageDraw,
    p0: tuple[float, float],
    p1: tuple[float, float],
    p2: tuple[float, float],
    p3: tuple[float, float],
    max_width: float,
    pal: dict,
):
    """
    Draws a smooth cubic-bezier crescent blade wave with cel-shaded dark ink rim,
    saturated elemental body, neon inner blade, and razor-white hot core.
    """
    steps = 60
    ts = np.linspace(0.0, 1.0, steps)

    pts = []
    normals = []
    for t in ts:
        mt = 1.0 - t
        x = (
            (mt**3) * p0[0]
            + 3 * (mt**2) * t * p1[0]
            + 3 * mt * (t**2) * p2[0]
            + (t**3) * p3[0]
        )
        y = (
            (mt**3) * p0[1]
            + 3 * (mt**2) * t * p1[1]
            + 3 * mt * (t**2) * p2[1]
            + (t**3) * p3[1]
        )
        # Derivative for tangent & normal
        dx = (
            3 * (mt**2) * (p1[0] - p0[0])
            + 6 * mt * t * (p2[0] - p1[0])
            + 3 * (t**2) * (p3[0] - p2[0])
        )
        dy = (
            3 * (mt**2) * (p1[1] - p0[1])
            + 6 * mt * t * (p2[1] - p1[1])
            + 3 * (t**2) * (p3[1] - p2[1])
        )
        length = math.hypot(dx, dy) + 1e-6
        pts.append((x, y))
        normals.append((-dy / length, dx / length))

    layers = [
        (1.24, (*pal["ink"], 230)),
        (1.00, (*pal["deep"], 245)),
        (0.72, (*pal["mid"], 255)),
        (0.45, (*pal["bright"], 255)),
        (0.20, (*pal["core"], 255)),
    ]

    for w_mult, col in layers:
        left_side = []
        right_side = []
        for i, t in enumerate(ts):
            # Smooth crescent thickness profile peaking at t ~ 0.62 (toward leading blade tip)
            profile = (math.sin(t * math.pi) ** 1.3) * (0.65 + 0.65 * t)
            hw = max_width * w_mult * profile * 0.5
            x, y = pts[i]
            nx, ny = normals[i]
            left_side.append((x + nx * hw, y + ny * hw))
            right_side.append((x - nx * (hw * 0.68), y - ny * (hw * 0.68)))
        draw.polygon(left_side + right_side[::-1], fill=col)


def draw_impact_star(
    draw: ImageDraw.ImageDraw,
    cx: float,
    cy: float,
    outer_r: float,
    inner_r: float,
    points: int,
    rot_deg: float,
    pal: dict,
):
    for scale, col in [
        (1.18, (*pal["ink"], 225)),
        (1.00, (*pal["deep"], 245)),
        (0.76, (*pal["mid"], 255)),
        (0.50, (*pal["bright"], 255)),
        (0.26, (*pal["core"], 255)),
    ]:
        pts = []
        for i in range(points * 2):
            ang = math.radians(rot_deg + i * (180.0 / points))
            r = (outer_r if i % 2 == 0 else inner_r) * scale
            pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
        draw.polygon(pts, fill=col)


def draw_perimeter_particles(
    draw: ImageDraw.ImageDraw,
    W: int,
    H: int,
    pal: dict,
    rng: random.Random,
    count: int = 14,
):
    motif = pal["motif"]
    for i in range(count):
        # Keep particles in outer perimeter ring so character face stays 100% clean
        angle = (i / count) * 2 * math.pi + rng.uniform(-0.18, 0.18)
        dist = rng.uniform(175, 248)
        px = W * 0.48 + math.cos(angle) * dist * 0.92
        py = H * 0.54 + math.sin(angle) * dist
        sz = rng.uniform(8.0, 16.0)

        if motif == "droplet":
            dx = math.cos(angle) * sz * 1.4
            dy = math.sin(angle) * sz * 1.4
            pts = [
                (px + dx, py + dy),
                (px - dy * 0.45, py + dx * 0.45),
                (px - dx * 0.5, py - dy * 0.5),
                (px + dy * 0.45, py - dx * 0.45),
            ]
            draw.polygon(pts, fill=(*pal["ink"], 220))
            inner = [(px + (x - px) * 0.72, py + (y - py) * 0.72) for x, y in pts]
            draw.polygon(inner, fill=(*pal["bright"], 250))
        elif motif in ("flame", "dragon_flare", "forge_spark"):
            pts = [
                (px, py - sz * 1.35),
                (px + sz * 0.78, py),
                (px, py + sz * 1.35),
                (px - sz * 0.78, py),
            ]
            draw.polygon(pts, fill=(*pal["deep"], 235))
            inner = [(px + (x - px) * 0.58, py + (y - py) * 0.58) for x, y in pts]
            draw.polygon(inner, fill=(*pal["core"], 255))
        else:
            draw_impact_star(draw, px, py, sz * 1.25, sz * 0.34, 4, math.degrees(angle), pal)


def apply_face_protection_mask(fg_layer: Image.Image) -> Image.Image:
    """
    Softly attenuates any foreground VFX directly over the character's eyes/face region
    (center-upper window: x ~ 0.48W, y ~ 0.35H) while keeping 100% opacity on weapon & lower/outer arcs.
    """
    arr = np.array(fg_layer, dtype=np.float32)
    h, w, _ = arr.shape
    yy, xx = np.meshgrid(np.arange(h, dtype=np.float32), np.arange(w, dtype=np.float32), indexing="ij")
    dx = (xx - w * 0.52) / (w * 0.16)
    dy = (yy - h * 0.34) / (h * 0.13)
    dist2 = dx * dx + dy * dy
    # Smooth attenuation inside the face oval
    keep = np.clip((dist2 - 0.35) / 0.85, 0.0, 1.0)
    arr[:, :, 3] *= keep
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def render_character_attack_image(card: dict) -> Image.Image:
    cid = card["id"]
    faction = card["faction"]
    atk_type = card["attackAnimation"]
    power = card["power"]
    rarity = card["rarity"]
    pal = FACTION_PALETTES.get(faction, FACTION_PALETTES["human"])
    rng = random.Random(cid * 7919 + 37)

    W, H = 512, 592
    raw_seat = Image.open(card["seat_path"]).convert("RGBA")
    raw_arr = np.array(raw_seat, dtype=np.uint8)
    rh, rw, _ = raw_arr.shape
    # Heal any accidental background-removal hole strictly inside the central beard/chest region (e.g. Poseidon)
    bx0, bx1 = int(rw * 0.40), int(rw * 0.62)
    by0, by1 = int(rh * 0.40), int(rh * 0.56)
    center_patch = raw_arr[by0:by1, bx0:bx1]
    hole_mask = center_patch[:, :, 3] < 220
    if np.any(hole_mask) and np.mean(center_patch[:, :, 3] > 200) > 0.45:
        center_patch[hole_mask] = (242, 245, 250, 255)
        raw_arr[by0:by1, bx0:bx1] = center_patch
    base_seat = Image.fromarray(raw_arr).resize((W, H), Image.Resampling.LANCZOS)

    # 1. Background Layer: Clean luminous aura & radial speed accents BEHIND the character (never cluttering the character!)
    bg_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg_layer)
    cx, cy = W * 0.50, H * 0.50
    is_high = rarity in ("gold", "platinum", "diamond", "legendary") or power >= 24

    num_rays = 14 if is_high else 10
    for i in range(num_rays):
        ang = (i / num_rays) * 2 * math.pi + rng.uniform(-0.05, 0.05)
        r_in = rng.uniform(135, 165)
        r_out = rng.uniform(228, 252)
        da = rng.uniform(0.018, 0.036)
        p1 = (cx + r_in * math.cos(ang - da), cy + r_in * math.sin(ang - da))
        p2 = (cx + r_out * math.cos(ang), cy + r_out * math.sin(ang))
        p3 = (cx + r_in * math.cos(ang + da), cy + r_in * math.sin(ang + da))
        col = (*pal["bright"], 155) if i % 2 == 0 else (*pal["core"], 175)
        bg_draw.polygon([p1, p2, p3], fill=col)

    bg_layer = bg_layer.filter(ImageFilter.GaussianBlur(radius=1.5))

    # 2. Character Layer: Articulated Attack Pose Warp + Motion Echoes + Crisp Rim Light
    warped_char = warp_character_attack_pose(base_seat, atk_type, cid)
    char_layer = build_character_with_motion_echo(warped_char, pal, atk_type)

    # Mask bg_layer from showing through any small interior transparent holes (e.g., Poseidon's white beard)
    w_alpha = np.array(warped_char, dtype=np.float32)[:, :, 3]
    w_closed = np.array(
        Image.fromarray(np.clip(w_alpha, 0, 255).astype(np.uint8))
        .filter(ImageFilter.MaxFilter(25))
        .filter(ImageFilter.MinFilter(25)),
        dtype=np.float32,
    )
    hole_fill = np.clip((w_closed - w_alpha) / 100.0, 0.0, 1.0)
    if hole_fill.max() > 0.1:
        bg_arr = np.array(bg_layer, dtype=np.float32)
        bg_arr[:, :, 3] *= 1.0 - hole_fill
        bg_layer = Image.fromarray(np.clip(bg_arr, 0, 255).astype(np.uint8))

    # 3. Foreground Attack Motion VFX Layer (Sweeping across weapon & lower-front, keeping face clear!)
    fg_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fg_draw = ImageDraw.Draw(fg_layer)

    jitter_y = rng.uniform(-18.0, 18.0)

    if atk_type == "slash":
        # Massive sweeping crescent sword/claw wave from top-left weapon tip down across lower-front to right
        draw_bezier_slash_ribbon(
            fg_draw,
            (W * 0.14, H * 0.14 + jitter_y),
            (W * 0.02, H * 0.68),
            (W * 0.48, H * 0.94),
            (W * 0.94, H * 0.56 - jitter_y),
            max_width=54,
            pal=pal,
        )
        # Secondary counter-slash ribbon across lower-left
        draw_bezier_slash_ribbon(
            fg_draw,
            (W * 0.86, H * 0.78),
            (W * 0.46, H * 0.92),
            (W * 0.14, H * 0.72),
            (W * 0.06, H * 0.36),
            max_width=30,
            pal=pal,
        )
        draw_impact_star(fg_draw, W * 0.16, H * 0.68, 72, 18, 4, 18, pal)

    elif atk_type == "strike":
        # Heavy overhead-to-ground smash arc + ground shatter wave at lower-left front
        draw_bezier_slash_ribbon(
            fg_draw,
            (W * 0.42, H * 0.08),
            (W * 0.06, H * 0.28),
            (W * 0.08, H * 0.64),
            (W * 0.34, H * 0.84),
            max_width=52,
            pal=pal,
        )
        # Ground shockwave ellipse at strike impact zone
        ix, iy = W * 0.28, H * 0.78
        for rx, ry, lw in [(140, 48, 10), (92, 32, 6)]:
            fg_draw.ellipse([ix - rx, iy - ry, ix + rx, iy + ry], outline=(*pal["ink"], 225), width=lw + 4)
            fg_draw.ellipse([ix - rx, iy - ry, ix + rx, iy + ry], outline=(*pal["bright"], 250), width=lw)
        draw_impact_star(fg_draw, ix, iy - 10, 96, 26, 8, 12, pal)

    elif atk_type == "blast":
        # Elemental cannon / breath wave firing from weapon-side (left-front) with spiraling wave rings
        draw_bezier_slash_ribbon(
            fg_draw,
            (W * 0.56, H * 0.64),
            (W * 0.34, H * 0.76),
            (W * 0.16, H * 0.66),
            (W * 0.04, H * 0.44),
            max_width=50,
            pal=pal,
        )
        bx, by = W * 0.18, H * 0.58
        for r_scale in [1.0, 0.68]:
            rx, ry = 56 * r_scale, 92 * r_scale
            fg_draw.ellipse([bx - rx, by - ry, bx + rx, by + ry], outline=(*pal["ink"], 225), width=10)
            fg_draw.ellipse([bx - rx, by - ry, bx + rx, by + ry], outline=(*pal["core"], 255), width=4)
        draw_impact_star(fg_draw, bx - 12, by - 6, 86, 22, 6, -15, pal)

    elif atk_type == "burst":
        # Awakened elemental surge: twin rising flank pillars + lower-front power wave (face 100% unobstructed!)
        # Left flank rising dragon/elemental wave
        draw_bezier_slash_ribbon(
            fg_draw,
            (W * 0.36, H * 0.90),
            (W * 0.06, H * 0.76),
            (W * 0.04, H * 0.38),
            (W * 0.22, H * 0.10),
            max_width=44,
            pal=pal,
        )
        # Right flank rising wave
        draw_bezier_slash_ribbon(
            fg_draw,
            (W * 0.64, H * 0.90),
            (W * 0.94, H * 0.76),
            (W * 0.96, H * 0.38),
            (W * 0.78, H * 0.10),
            max_width=42,
            pal=pal,
        )
        # Lower front awakening crest
        draw_impact_star(fg_draw, W * 0.20, H * 0.74, 68, 18, 4, 15, pal)
        draw_impact_star(fg_draw, W * 0.80, H * 0.74, 62, 16, 4, -15, pal)

    elif atk_type == "spin":
        # Front half of the 3D whirling cyclone blade sweeping across the lower torso
        draw_bezier_slash_ribbon(
            fg_draw,
            (W * 0.06, H * 0.48),
            (W * 0.24, H * 0.88),
            (W * 0.76, H * 0.88),
            (W * 0.94, H * 0.48),
            max_width=52,
            pal=pal,
        )
        draw_bezier_slash_ribbon(
            fg_draw,
            (W * 0.90, H * 0.64),
            (W * 0.55, H * 0.95),
            (W * 0.20, H * 0.82),
            (W * 0.08, H * 0.34),
            max_width=32,
            pal=pal,
        )
        draw_impact_star(fg_draw, W * 0.16, H * 0.60, 64, 16, 4, 24, pal)
        draw_impact_star(fg_draw, W * 0.84, H * 0.60, 64, 16, 4, -24, pal)

    else:  # charge
        # Sonic spearhead cone in front-left + dynamic lower-front dash wave + speed streaks
        draw_bezier_slash_ribbon(
            fg_draw,
            (W * 0.28, H * 0.18),
            (W * 0.02, H * 0.48),
            (W * 0.08, H * 0.78),
            (W * 0.78, H * 0.86),
            max_width=50,
            pal=pal,
        )
        for sy_pct, slen in [(0.70, 210), (0.80, 250), (0.88, 180)]:
            sy = H * sy_pct
            sx = W * 0.12
            fg_draw.polygon(
                [(sx, sy), (sx + slen, sy - 7), (sx + slen * 0.85, sy), (sx + slen, sy + 7)],
                fill=(*pal["core"], 245),
            )
        draw_impact_star(fg_draw, W * 0.14, H * 0.58, 78, 20, 6, 10, pal)

    draw_perimeter_particles(fg_draw, W, H, pal, rng, count=10 if is_high else 7)
    fg_layer = apply_face_protection_mask(fg_layer)

    # Keep the character 100% hero-focused and unobstructed:
    # Mask out interior character body from fg_layer so attack arcs wrap BEHIND and AROUND the outer edge/weapon tip,
    # never burying or obscuring the character art!
    eroded_body = np.array(
        Image.fromarray(np.clip(w_alpha, 0, 255).astype(np.uint8)).filter(ImageFilter.MinFilter(9)),
        dtype=np.float32,
    ) / 255.0
    fg_arr = np.array(fg_layer, dtype=np.float32)
    # Full intensity outside character + on weapon/silhouette rim, strongly attenuated (12% max) inside character body
    fg_arr[:, :, 3] *= (1.0 - eroded_body * 0.88)
    fg_rim_only = Image.fromarray(np.clip(fg_arr, 0, 255).astype(np.uint8))

    # Full attack arcs also placed BEHIND the character so the silhouette bursts out in front of the slash wave!
    bg_slash = fg_layer.copy()
    if hole_fill.max() > 0.1:
        bgs_arr = np.array(bg_slash, dtype=np.float32)
        bgs_arr[:, :, 3] *= 1.0 - hole_fill
        bg_slash = Image.fromarray(np.clip(bgs_arr, 0, 255).astype(np.uint8))

    comp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    comp.alpha_composite(bg_layer)
    comp.alpha_composite(bg_slash)
    comp.alpha_composite(char_layer)
    comp.alpha_composite(fg_rim_only)

    return comp.resize((256, 296), Image.Resampling.LANCZOS)


def main():
    SEAT_ATTACK_DIR.mkdir(parents=True, exist_ok=True)
    CHAR_ANIM_DIR.mkdir(parents=True, exist_ok=True)

    cards = parse_110_cards()
    print(f"Parsed {len(cards)} cards. Rendering 110 attack motion images...")

    cards1_attack = Image.new("RGBA", (1000, 1000), (0, 0, 0, 0))
    cards2_attack = Image.new("RGBA", (1000, 1000), (0, 0, 0, 0))
    orig_cards2_path = PROJECT_ROOT / "public" / "cards2.png"
    if orig_cards2_path.exists():
        orig_c2 = Image.open(orig_cards2_path).convert("RGBA")
        c2_arr = np.array(orig_c2)
        c2_arr[0:100, :, :] = 0
        cards2_attack = Image.fromarray(c2_arr)

    card100_attack = Image.new("RGBA", (1135, 1315), (0, 0, 0, 0))

    for cid in range(1, 111):
        card = cards[cid]
        atk_img = render_character_attack_image(card)

        # Save PNG & WebP
        seat_out = SEAT_ATTACK_DIR / card["seat_filename"]
        atk_img.save(seat_out, "PNG")

        padded = f"{cid:03d}"
        webp_out = CHAR_ANIM_DIR / f"card-{padded}.webp"
        atk_img.save(webp_out, "WEBP", quality=90)

        # Paste into 100x100 cell
        cell_100 = Image.new("RGBA", (100, 100), (0, 0, 0, 0))
        thumb_w = int(round(100 * (256.0 / 296.0)))
        thumb = atk_img.resize((thumb_w, 100), Image.Resampling.LANCZOS)
        cell_100.paste(thumb, ((100 - thumb_w) // 2, 0), thumb)

        if cid <= 100:
            col = (cid - 1) % 10
            row = (cid - 1) // 10
            cards1_attack.paste(cell_100, (col * 100, row * 100), cell_100)
        else:
            col = (cid - 101) % 10
            row = (cid - 101) // 10
            cards2_attack.paste(cell_100, (col * 100, row * 100), cell_100)

        c_col = (cid - 1) % 10
        c_row = (cid - 1) // 10
        cw = 1135.0 / 10.0
        ch = 1315.0 / 11.0
        cell_legacy = atk_img.resize((int(round(cw)), int(round(ch))), Image.Resampling.LANCZOS)
        card100_attack.paste(cell_legacy, (int(round(c_col * cw)), int(round(c_row * ch))), cell_legacy)

        if cid % 25 == 0 or cid == 110:
            print(f"  Completed {cid}/110 ({card['title_ko']} - {card['attackAnimation']})")

    cards1_attack.save(PROJECT_ROOT / "public" / "cards1_attack.png", "PNG")
    cards2_attack.save(PROJECT_ROOT / "public" / "cards2_attack.png", "PNG")
    card100_attack.save(PROJECT_ROOT / "public" / "card100_attack.png", "PNG")
    print("All 110 character attack motion images and sprite sheets generated successfully!")


if __name__ == "__main__":
    main()
