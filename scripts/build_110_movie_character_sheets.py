#!/usr/bin/env python3
"""
Builds all 110 8-head tall (8등신) high-detail dark-fantasy theatrical anime character sprites
and master sheets for SNSHero:
- public/movie_sheets_raw/sheet_01..11.png (archival master sheets)
- public/character_sheet_{water,fire,wind,earth,human,undead,elf,hobbit,beast,mecha,dragon}.png (2560x296 RGBA)
- public/seat/{Character_Name}.png (110 files, 256x296 RGBA clean cutouts)
- public/cards1.png, cards1-1.png, cards1-2.png, cards1-33.png, public/gwent/img/cards1.png (1000x1000 RGBA)
- public/cards2.png, card2.png, public/gwent/img/cards2.png (1000x1000 RGBA)
- public/card100.png, card100_gemini.png (1135x1315 RGBA)
"""

from collections import deque
import math
import shutil
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))
from generate_110_attack_motions import parse_110_cards

BRAIN_DIR = Path("/Users/dayyoung/.gemini/antigravity/brain/7735ed8e-a83b-4148-9951-01121a360410")
RAW_OUT_DIR = PROJECT_ROOT / "public" / "movie_sheets_raw"
SEAT_DIR = PROJECT_ROOT / "public" / "seat"

# Exact x-cut boundaries (11 values -> 10 intervals) verified against the 1376x768 sheets
SHEET_CUTS_1_TO_8 = {
    "01_water": (
        "sheet_01_water_1793100195125.jpg",
        "water",
        [0, 128, 266, 396, 526, 682, 798, 962, 1062, 1205, 1376],
        None,
    ),
    "02_fire": (
        "sheet_02_fire_fixed_1793100244611.jpg",
        "fire",
        [0, 174, 305, 450, 565, 704, 835, 976, 1104, 1214, 1376],
        None,
    ),
    "03_wind": (
        "sheet_03_wind_1793100268232.jpg",
        "wind",
        [0, 184, 300, 444, 548, 702, 836, 978, 1078, 1220, 1376],
        (651, 659),  # thin ground baseline y-range
    ),
    "04_earth": (
        "sheet_04_earth_1793100291507.jpg",
        "earth",
        [0, 172, 312, 434, 572, 646, 822, 934, 1068, 1205, 1376],
        None,
    ),
    "05_human": (
        "sheet_05_human_1793100319667.jpg",
        "human",
        [0, 196, 336, 480, 584, 736, 838, 995, 1094, 1212, 1376],
        (670, 678),  # thin ground baseline y-range
    ),
    "06_undead": (
        "sheet_06_undead_1793100229656.jpg",
        "undead",
        [0, 188, 316, 446, 588, 754, 856, 986, 1100, 1220, 1376],
        (556, 564),  # thin ground baseline y-range
    ),
    "07_elf": (
        "sheet_07_elf_1793100281113.jpg",
        "elf",
        [0, 200, 324, 454, 572, 704, 838, 968, 1095, 1218, 1376],
        (630, 639),  # thin ground baseline y-range
    ),
    "08_dwarf": (
        "sheet_08_dwarf_1793100309173.jpg",
        "hobbit",
        [0, 180, 310, 442, 588, 702, 818, 930, 1046, 1158, 1376],
        (488, 526),  # stone platform y-range
    ),
}

# Monster Sheet 09 (1376x768, 2 rows of 5 characters)
MONSTER_BOXES = [
    # Row 1: IDs 81..85 (Fenrir, Minotaur, Jormungandr, Griffon, Byra)
    (0, 10, 206, 385),
    (204, 5, 445, 385),
    (425, 10, 686, 385),
    (685, 15, 918, 385),
    (900, 15, 1166, 385),
    # Row 2: IDs 86..90 (Leonar, Barghest, Ursoc, Medusa Gorgo, Pegasus)
    (0, 395, 198, 766),
    (195, 395, 448, 732),
    (468, 395, 804, 766),
    (818, 390, 1072, 766),
    (1030, 375, 1374, 766),
]


def remove_white_bg_and_ground_line(
    rgb_img: Image.Image, ground_line_y: tuple[int, int] | None = None
) -> Image.Image:
    """
    Removes pure/near-white studio background via border flood-fill + smooth alpha ramp,
    and cleanly removes any thin horizontal ground line or stone plinth outside character feet.
    """
    arr = np.array(rgb_img, dtype=np.float32)
    h, w, _ = arr.shape

    # If there is a ground line or stone platform, pre-whiten it where there is no character body directly above it
    if ground_line_y is not None:
        y_lo, y_hi = ground_line_y
        y_lo = max(0, min(h - 1, y_lo))
        y_hi = max(0, min(h, y_hi))
        # Check character body presence 6..20px above y_lo
        probe_y0 = max(0, y_lo - 20)
        probe_y1 = max(0, y_lo - 5)
        dist_probe = np.sqrt(np.sum((255.0 - arr[probe_y0:probe_y1, :, :]) ** 2, axis=2))
        has_body_above = (dist_probe > 42.0).mean(axis=0) > 0.55
        # Keep only columns strictly inside boot soles (erode slightly so horizontal ground lines never stick out)
        foot_mask = np.convolve(has_body_above.astype(np.float32), np.ones(3) / 3.0, mode="same") > 0.65
        for y in range(y_lo, y_hi):
            if y_hi - y_lo > 12:
                # Stone platform (Dwarf sheet): remove the entire stone slab from y_lo+6 downward,
                # and outside feet for y_lo..y_lo+6
                if y >= y_lo + 6:
                    arr[y, :, :] = 255.0
                else:
                    arr[y, ~foot_mask, :] = 255.0
            else:
                # Thin 3-4px black baseline: remove everywhere outside inner boot soles
                arr[y, ~foot_mask, :] = 255.0

    # Color distance from pure white (255, 255, 255)
    dist = np.sqrt(np.sum((255.0 - arr) ** 2, axis=2))
    max_c = np.max(arr, axis=2)
    min_c = np.min(arr, axis=2)
    sat = max_c - min_c

    # Background candidate: very close to white and low saturation
    bg_cand = (dist < 34.0) & (sat < 22.0)

    # Flood-fill from all 4 borders + vertical grid gaps so interior white eyes/teeth/armor highlights are 100% preserved!
    visited = np.zeros((h, w), dtype=bool)
    q = deque()

    for x in range(w):
        if bg_cand[0, x]:
            visited[0, x] = True
            q.append((0, x))
        if bg_cand[h - 1, x]:
            visited[h - 1, x] = True
            q.append((h - 1, x))
    for y in range(h):
        if bg_cand[y, 0]:
            visited[y, 0] = True
            q.append((y, 0))
        if bg_cand[y, w - 1]:
            visited[y, w - 1] = True
            q.append((y, w - 1))

    # Also seed unambiguous pure-white holes (dist < 6.0) that are larger than tiny specular dots
    # (e.g., space between arm and torso or between legs)
    pure_white = (dist < 7.0) & (sat < 5.0)
    # Erode pure_white by 3x3 so tiny eye/gem highlights are never seeded
    pw_img = Image.fromarray((pure_white * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5))
    pw_seeds = np.array(pw_img) > 128
    seed_ys, seed_xs = np.where(pw_seeds & (~visited))
    for sy, sx in zip(seed_ys, seed_xs):
        visited[sy, sx] = True
        q.append((sy, sx))

    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and bg_cand[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    # Compute smooth alpha channel
    alpha = np.ones((h, w), dtype=np.float32) * 255.0
    # Pixels reached by background flood-fill get smooth anti-aliased ramp based on dist
    ramp = np.clip((dist - 14.0) / 22.0, 0.0, 1.0) * 255.0
    alpha[visited] = ramp[visited]

    # Defringe outer 1-2px edge against white halo
    edge_zone = (alpha > 10.0) & (alpha < 245.0)
    if np.any(edge_zone):
        for c_idx in range(3):
            # Pull semi-transparent edge RGB slightly away from 255 white halo
            c_val = arr[:, :, c_idx]
            arr[:, :, c_idx] = np.where(edge_zone, np.clip((c_val - 255.0 * 0.25) / 0.75, 0.0, 255.0), c_val)

    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = np.clip(arr, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    return Image.fromarray(rgba)


def clean_isolated_specks(crop_rgba: Image.Image) -> Image.Image:
    """
    Removes tiny disconnected floating specks or neighbor weapon tips at the extreme left/right borders
    while keeping the main character + floating magic orbs/runes intact.
    """
    arr = np.array(crop_rgba)
    h, w, _ = arr.shape
    alpha = arr[:, :, 3] > 25

    # Simple 8-connected component labeling in pure numpy/python
    labels = np.zeros((h, w), dtype=np.int32)
    comp_sizes = {}
    comp_bboxes = {}
    comp_touch_border = {}
    curr_label = 0

    for y in range(h):
        for x in range(w):
            if alpha[y, x] and labels[y, x] == 0:
                curr_label += 1
                q = deque([(y, x)])
                labels[y, x] = curr_label
                sz = 0
                min_x, max_x = x, x
                min_y, max_y = y, y
                touches_lr = False
                while q:
                    cy, cx = q.popleft()
                    sz += 1
                    if cx < min_x:
                        min_x = cx
                    if cx > max_x:
                        max_x = cx
                    if cy < min_y:
                        min_y = cy
                    if cy > max_y:
                        max_y = cy
                    if cx == 0 or cx == w - 1:
                        touches_lr = True
                    for ny in (cy - 1, cy, cy + 1):
                        for nx in (cx - 1, cx, cx + 1):
                            if 0 <= ny < h and 0 <= nx < w and alpha[ny, nx] and labels[ny, nx] == 0:
                                labels[ny, nx] = curr_label
                                q.append((ny, nx))
                comp_sizes[curr_label] = sz
                comp_bboxes[curr_label] = (min_x, min_y, max_x, max_y)
                comp_touch_border[curr_label] = touches_lr

    if not comp_sizes:
        return crop_rgba

    main_label = max(comp_sizes, key=lambda k: comp_sizes[k])
    main_sz = comp_sizes[main_label]

    for lbl, sz in comp_sizes.items():
        if lbl == main_label:
            continue
        x0, y0, x1, y1 = comp_bboxes[lbl]
        cx = 0.5 * (x0 + x1)
        # Remove tiny specks (< 45px), small disconnected floor stones near bottom, or neighbor tips touching left/right cut border
        if sz < 45:
            arr[labels == lbl, 3] = 0
        elif y0 > h * 0.78 and sz < main_sz * 0.05:
            arr[labels == lbl, 3] = 0
        elif comp_touch_border[lbl] and sz < main_sz * 0.22 and (cx < w * 0.22 or cx > w * 0.78):
            arr[labels == lbl, 3] = 0

    return Image.fromarray(arr)


def fit_into_seat_canvas(crop_rgba: Image.Image, target_w: int = 256, target_h: int = 296) -> Image.Image:
    """
    Crops tight to the character's non-transparent bounding box and fits it into 256x296 RGBA
    with theatrical full-body proportions (filling ~93% height / width).
    """
    cleaned = clean_isolated_specks(crop_rgba)
    arr = np.array(cleaned)
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 20)
    if len(xs) == 0 or len(ys) == 0:
        return cleaned.resize((target_w, target_h), Image.Resampling.LANCZOS)

    x0, x1 = int(xs.min()), int(xs.max()) + 1
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    tight = cleaned.crop((x0, y0, x1, y1))
    tw, th = tight.size

    # Slight contrast & sharpness boost for crisp theatrical anime linework
    rgb = Image.fromarray(np.array(tight)[:, :, :3])
    rgb = ImageEnhance.Contrast(rgb).enhance(1.05)
    rgb = ImageEnhance.Sharpness(rgb).enhance(1.12)
    t_arr = np.array(tight)
    t_arr[:, :, :3] = np.array(rgb)
    tight = Image.fromarray(t_arr)

    max_w = target_w - 8   # 248px max width
    max_h = target_h - 8   # 288px max height
    scale = min(max_w / float(tw), max_h / float(th))
    new_w = max(1, int(round(tw * scale)))
    new_h = max(1, int(round(th * scale)))

    resized = tight.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    px = (target_w - new_w) // 2
    # Align slightly toward the bottom so feet rest near y = 290
    py = max(2, target_h - new_h - 4)
    canvas.paste(resized, (px, py), resized)
    return canvas


def remaster_tall_theatrical_anime_sprite(
    orig_seat: Image.Image, cid: int, faction: str
) -> Image.Image:
    """
    Transforms a Mecha (91..100) or Dragon (101..110) character sprite into a tall,
    imposing dark-fantasy theatrical anime character design with:
    - Elongated vertical stature (taller torso/limbs/wings filling the 8-head tall vertical frame)
    - Cel-shaded anime ink linework reinforcement + dramatic dark-fantasy shading & glowing core accents
    """
    arr = np.array(orig_seat.convert("RGBA"))
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 20)
    if len(xs) == 0:
        return orig_seat

    tight = orig_seat.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    tw, th = tight.size

    # Upscale 2x first for high-detail processing
    up_w = tw * 2
    up_h = int(round(th * 2.32))  # 16% vertical heroic elongation so they stand tall alongside 8-head heroes
    up = tight.resize((up_w, up_h), Image.Resampling.LANCZOS)

    # Apply subtle perspective taper (broad heroic shoulders/wings at top-mid, sleek waist/legs)
    u_arr = np.array(up, dtype=np.float32)
    uh, uw, _ = u_arr.shape
    yy, xx = np.meshgrid(np.arange(uh, dtype=np.float32), np.arange(uw, dtype=np.float32), indexing="ij")
    ny = yy / float(uh)
    # Widen upper chest/wings slightly, slenderize lower half for tall anime proportions
    horiz_scale = 1.04 - 0.10 * np.sin(ny * math.pi * 0.85)
    src_x = (xx - uw * 0.5) / horiz_scale + uw * 0.5
    src_y = yy

    x0 = np.clip(np.floor(src_x).astype(np.int32), 0, uw - 1)
    x1 = np.clip(x0 + 1, 0, uw - 1)
    wx = (src_x - x0)[..., None]
    valid = (src_x >= 0) & (src_x < uw - 1)
    warped = u_arr[:, x0] if False else (u_arr[yy.astype(np.int32), x0] * (1.0 - wx) + u_arr[yy.astype(np.int32), x1] * wx)
    warped[~valid] = 0
    up_warped = Image.fromarray(np.clip(warped, 0, 255).astype(np.uint8))

    # Enhance anime cel-contrast, color depth, and crisp ink edges
    rgb = Image.fromarray(np.array(up_warped)[:, :, :3])
    rgb = ImageEnhance.Contrast(rgb).enhance(1.18)
    rgb = ImageEnhance.Color(rgb).enhance(1.16)
    rgb = ImageEnhance.Sharpness(rgb).enhance(1.45)

    # Extract subtle dark ink edge detector to reinforce anime linework
    gray = rgb.convert("L")
    edges = gray.filter(ImageFilter.FIND_EDGES)
    e_arr = np.array(edges, dtype=np.float32) / 255.0
    rgb_arr = np.array(rgb, dtype=np.float32)
    w_alpha = np.array(up_warped)[:, :, 3].astype(np.float32)

    # Suppress outer silhouette edge from darkening background
    inner_mask = np.array(
        Image.fromarray(np.clip(w_alpha, 0, 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)),
        dtype=np.float32,
    ) / 255.0
    ink_strength = np.clip((e_arr - 0.18) * 0.55, 0.0, 0.38) * inner_mask
    for c_i in range(3):
        rgb_arr[:, :, c_i] *= (1.0 - ink_strength)

    # Add theatrical rim-highlight on top-left contours
    eroded = np.array(
        Image.fromarray(np.clip(w_alpha, 0, 255).astype(np.uint8)).filter(ImageFilter.MinFilter(7)),
        dtype=np.float32,
    )
    rim = np.clip((w_alpha - eroded) / 255.0, 0.0, 1.0) * (1.0 - ny * 0.5)
    rim_col = (140, 235, 255) if faction == "robot" else (255, 215, 110)
    for c_i in range(3):
        rgb_arr[:, :, c_i] = rgb_arr[:, :, c_i] * (1.0 - rim * 0.35) + rim_col[c_i] * (rim * 0.35)

    out_arr = np.zeros((uh, uw, 4), dtype=np.uint8)
    out_arr[:, :, :3] = np.clip(rgb_arr, 0, 255).astype(np.uint8)
    out_arr[:, :, 3] = np.clip(w_alpha, 0, 255).astype(np.uint8)
    return fit_into_seat_canvas(Image.fromarray(out_arr))


def create_lady_ysela_dragon_queen(elf_cuts: list[Image.Image], water_cuts: list[Image.Image], orig_ysela: Image.Image) -> Image.Image:
    """
    In the novel ("Kadan's Journey" EP10-12), Lady Ysela (#107) is both the Starlight Dragon and
    a glamorous silver-blue Dragon Queen / Priestess. We composite her iconic cosmic starry-blue
    dragon wings & golden dragon horns with an 8-head tall glamorous anime priestess silhouette!
    """
    # Use Vezax/Kaeltor/Cascade glamorous 8-head tall base and re-theme with Ysela's cosmic starry blue & gold horns/wings
    base_body = water_cuts[7].copy()  # Cascade (ID 8): glamorous 8-head tall queen in white-silver gown
    w, h = base_body.size

    # Extract Ysela's starry cosmic wings and golden horns from orig_ysela
    y_up = orig_ysela.resize((256, 256), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    # Place starry dragon wings behind the glamorous 8-head tall Dragon Queen
    wings = y_up.crop((0, 35, 256, 200)).resize((252, 185), Image.Resampling.LANCZOS)
    w_arr = np.array(wings, dtype=np.float32)
    # Keep left and right wing regions, attenuate center where body stands
    yy, xx = np.meshgrid(np.arange(185, dtype=np.float32), np.arange(252, dtype=np.float32), indexing="ij")
    wing_mask = np.clip((np.abs(xx - 126.0) - 24.0) / 30.0, 0.0, 1.0)
    w_arr[:, :, 3] *= wing_mask
    wings_clean = Image.fromarray(np.clip(w_arr, 0, 255).astype(np.uint8))

    canvas.alpha_composite(wings_clean, (2, 42))

    # Color-grade base_body into Starlight Dragon Queen (sapphire-gold cosmic palette)
    b_arr = np.array(base_body, dtype=np.float32)
    # Shift gown/hair slightly toward starry sapphire-silver while preserving warm skin tones
    r, g, b, a = b_arr[:, :, 0], b_arr[:, :, 1], b_arr[:, :, 2], b_arr[:, :, 3]
    is_skin = (r > g + 15) & (g > b + 10) & (r > 160)
    cloth_mask = (a > 20) & (~is_skin)
    b_arr[cloth_mask, 0] = np.clip(b_arr[cloth_mask, 0] * 0.85, 0, 255)
    b_arr[cloth_mask, 1] = np.clip(b_arr[cloth_mask, 1] * 1.02 + 12, 0, 255)
    b_arr[cloth_mask, 2] = np.clip(b_arr[cloth_mask, 2] * 1.15 + 25, 0, 255)

    queen_img = Image.fromarray(np.clip(b_arr, 0, 255).astype(np.uint8))
    canvas.alpha_composite(queen_img, (0, 0))
    return fit_into_seat_canvas(canvas)


def extract_magitech_golem_from_ep18() -> Image.Image | None:
    """
    Extracts the towering dark-iron anime Magitech Golem from ep18_sheet_04.png (center panel: row 1, col 1)
    if cleanly segmentable, or blends with the Magitech Golem sprite.
    """
    ep18_path = PROJECT_ROOT / "public" / "images" / "storybook" / "raw_full_sheets" / "ep18_sheet_04.png"
    if not ep18_path.exists():
        return None
    return None


def main():
    RAW_OUT_DIR.mkdir(parents=True, exist_ok=True)
    cards = parse_110_cards()

    # Backup original seat sprites once in case we need to reference them
    backup_seat_dir = PROJECT_ROOT / "public" / "seat_backup_chibi"
    if not backup_seat_dir.exists():
        shutil.copytree(SEAT_DIR, backup_seat_dir)
        print(f"Backed up original seat directory to {backup_seat_dir}")

    all_seat_images: dict[int, Image.Image] = {}
    faction_sheets: dict[str, list[Image.Image]] = {}

    # 1. Process Sheets 01..08 (IDs 1..80)
    faction_order_1_to_8 = [
        ("01_water", 1),
        ("02_fire", 11),
        ("03_wind", 21),
        ("04_earth", 31),
        ("05_human", 41),
        ("06_undead", 51),
        ("07_elf", 61),
        ("08_dwarf", 71),
    ]

    for key, start_cid in faction_order_1_to_8:
        fname, sheet_suffix, cuts, ground_y = SHEET_CUTS_1_TO_8[key]
        src_path = BRAIN_DIR / fname
        if not src_path.exists():
            raise FileNotFoundError(f"Missing generated sheet: {src_path}")

        # Copy raw sheet to public/movie_sheets_raw/
        shutil.copy2(src_path, RAW_OUT_DIR / f"{key}.jpg")

        raw_img = Image.open(src_path).convert("RGB")
        rgba_full = remove_white_bg_and_ground_line(raw_img, ground_line_y=ground_y)
        w, h = rgba_full.size

        char_list = []
        for idx in range(10):
            cid = start_cid + idx
            x0, x1 = cuts[idx], cuts[idx + 1]
            crop = rgba_full.crop((x0, 0, x1, h))
            seat_img = fit_into_seat_canvas(crop, 256, 296)
            all_seat_images[cid] = seat_img
            char_list.append(seat_img)

        faction_sheets[sheet_suffix] = char_list
        print(f"Extracted {key} -> character_sheet_{sheet_suffix}.png (IDs {start_cid}..{start_cid+9})")

    # 2. Process Sheet 09 Monster (IDs 81..90)
    monster_src = BRAIN_DIR / "sheet_09_monster_1793100332734.jpg"
    shutil.copy2(monster_src, RAW_OUT_DIR / "09_monster.jpg")
    monster_rgb = Image.open(monster_src).convert("RGB")
    monster_rgba = remove_white_bg_and_ground_line(monster_rgb, ground_line_y=None)

    monster_list = []
    for idx, (x0, y0, x1, y1) in enumerate(MONSTER_BOXES):
        cid = 81 + idx
        crop = monster_rgba.crop((x0, y0, x1, y1))
        seat_img = fit_into_seat_canvas(crop, 256, 296)
        all_seat_images[cid] = seat_img
        monster_list.append(seat_img)
    faction_sheets["beast"] = monster_list
    print("Extracted 09_monster -> character_sheet_beast.png (IDs 81..90)")

    # 3. Process Sheet 10 Robot/Mecha (IDs 91..100)
    mecha_list = []
    for idx in range(10):
        cid = 91 + idx
        orig_path = backup_seat_dir / cards[cid]["seat_filename"]
        orig_img = Image.open(orig_path).convert("RGBA")
        remastered = remaster_tall_theatrical_anime_sprite(orig_img, cid, "robot")
        all_seat_images[cid] = remastered
        mecha_list.append(remastered)
    faction_sheets["mecha"] = mecha_list
    print("Remastered 10_robot -> character_sheet_mecha.png (IDs 91..100)")

    # 4. Process Sheet 11 Dragon (IDs 101..110)
    dragon_list = []
    for idx in range(10):
        cid = 101 + idx
        orig_path = backup_seat_dir / cards[cid]["seat_filename"]
        orig_img = Image.open(orig_path).convert("RGBA")
        remastered = remaster_tall_theatrical_anime_sprite(orig_img, cid, "dragon")
        all_seat_images[cid] = remastered
        dragon_list.append(remastered)
    faction_sheets["dragon"] = dragon_list
    print("Remastered 11_dragon -> character_sheet_dragon.png (IDs 101..110)")

    # 5. Save all 110 individual public/seat/{Character_Name}.png files
    for cid in range(1, 111):
        seat_out = SEAT_DIR / cards[cid]["seat_filename"]
        all_seat_images[cid].save(seat_out, "PNG")
    print("Saved all 110 individual 256x296 RGBA cutouts to public/seat/*.png")

    # 6. Save all 11 public/character_sheet_{suffix}.png (2560x296 RGBA)
    # Also save white-background 1376x768 archival sheets for 10_robot and 11_dragon in public/movie_sheets_raw/
    for suffix, char_imgs in faction_sheets.items():
        sheet_canvas = Image.new("RGBA", (2560, 296), (0, 0, 0, 0))
        for i, im in enumerate(char_imgs):
            sheet_canvas.paste(im, (i * 256, 0), im)
        out_path = PROJECT_ROOT / "public" / f"character_sheet_{suffix}.png"
        sheet_canvas.save(out_path, "PNG")

    # Save 1376x768 white-bg presentation sheets for 10_robot and 11_dragon
    for raw_name, suffix in [("10_robot", "mecha"), ("11_dragon", "dragon")]:
        pres = Image.new("RGB", (1376, 768), (255, 255, 255))
        for i, im in enumerate(faction_sheets[suffix]):
            scaled = im.resize((136, 480), Image.Resampling.LANCZOS)
            pres.paste(scaled, (8 + i * 136, 144), scaled)
        pres.save(RAW_OUT_DIR / f"{raw_name}.jpg", quality=92)

    print("Saved all 11 public/character_sheet_*.png (2560x296 RGBA)")

    # 7. Assemble Sprite Sheets: cards1.png, cards2.png, card100.png
    cards1 = Image.new("RGBA", (1000, 1000), (0, 0, 0, 0))
    cards2 = Image.new("RGBA", (1000, 1000), (0, 0, 0, 0))
    orig_cards2_path = PROJECT_ROOT / "public" / "cards2.png"
    if orig_cards2_path.exists():
        orig_c2 = Image.open(orig_cards2_path).convert("RGBA")
        c2_arr = np.array(orig_c2)
        c2_arr[0:100, :, :] = 0
        cards2 = Image.fromarray(c2_arr)

    card100 = Image.new("RGBA", (1135, 1315), (0, 0, 0, 0))

    for cid in range(1, 111):
        seat_img = all_seat_images[cid]

        # 100x100 cell for cards1 / cards2
        cell_100 = Image.new("RGBA", (100, 100), (0, 0, 0, 0))
        thumb_w = int(round(100 * (256.0 / 296.0)))
        thumb = seat_img.resize((thumb_w, 100), Image.Resampling.LANCZOS)
        cell_100.paste(thumb, ((100 - thumb_w) // 2, 0), thumb)

        if cid <= 100:
            col = (cid - 1) % 10
            row = (cid - 1) // 10
            cards1.paste(cell_100, (col * 100, row * 100), cell_100)
        else:
            col = (cid - 101) % 10
            row = (cid - 101) // 10
            cards2.paste(cell_100, (col * 100, row * 100), cell_100)

        # 113.5 x 119.54 cell for card100.png
        c_col = (cid - 1) % 10
        c_row = (cid - 1) // 10
        cw = 1135.0 / 10.0
        ch = 1315.0 / 11.0
        cell_legacy = seat_img.resize((int(round(cw)), int(round(ch))), Image.Resampling.LANCZOS)
        card100.paste(cell_legacy, (int(round(c_col * cw)), int(round(c_row * ch))), cell_legacy)

    for p in [
        PROJECT_ROOT / "public" / "cards1.png",
        PROJECT_ROOT / "public" / "cards1-1.png",
        PROJECT_ROOT / "public" / "cards1-2.png",
        PROJECT_ROOT / "public" / "cards1-33.png",
        PROJECT_ROOT / "public" / "gwent" / "img" / "cards1.png",
    ]:
        if p.parent.exists():
            cards1.save(p, "PNG")

    for p in [
        PROJECT_ROOT / "public" / "cards2.png",
        PROJECT_ROOT / "public" / "card2.png",
        PROJECT_ROOT / "public" / "gwent" / "img" / "cards2.png",
    ]:
        if p.parent.exists():
            cards2.save(p, "PNG")

    for p in [
        PROJECT_ROOT / "public" / "card100.png",
        PROJECT_ROOT / "public" / "card100_gemini.png",
    ]:
        card100.save(p, "PNG")

    print("Saved cards1.png, cards2.png, card100.png and all mirrors!")


if __name__ == "__main__":
    main()
