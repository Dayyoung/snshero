#!/usr/bin/env python3
"""
Builds the Complete 110-Character Animation Production Character Sheet Suite for SNSHero ('카단의 여정'):
- Does NOT modify in-game card sprites (public/seat/*.png, public/cards1.png remain 100% untouched).
- Generates:
  1. public/anime-character-sheets/cutouts/{001..110}_{Slug}.png (110 high-res transparent RGBA anime cutouts)
  2. public/anime-character-sheets/sheets/{001..110}_{Slug}_sheet.jpg (110 individual 1600x1000 HD Studio Character Model Sheets)
  3. public/anime-character-sheets/factions/{01..11}_{faction}_sheet.jpg (11 Faction 10-Character Master Sheets, 2400x1420)
  4. public/anime-character-sheets/all_110_cast_poster.jpg (Grand 110-Character Studio Overview Poster)
  5. public/anime-character-sheets/manifest.json (Full metadata + AI video generation prompts for all 110 characters)
"""

from collections import deque
import json
import math
import sys
import textwrap
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))
from generate_110_attack_motions import parse_110_cards
from anime_character_specs import ANIME_CHAR_SPECS, FACTION_META

BRAIN_DIR = Path("/Users/dayyoung/.gemini/antigravity/brain/7735ed8e-a83b-4148-9951-01121a360410")
OUT_ROOT = PROJECT_ROOT / "public" / "anime-character-sheets"
CUTOUT_DIR = OUT_ROOT / "cutouts"
SHEET_DIR = OUT_ROOT / "sheets"
FACTION_DIR = OUT_ROOT / "factions"

FONT_TTC = "/System/Library/Fonts/AppleSDGothicNeo.ttc"


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    # AppleSDGothicNeo indices: 0=Regular, 3=SemiBold, 6=Bold, 8=ExtraBold
    idx = 6 if bold else 2
    try:
        return ImageFont.truetype(FONT_TTC, size, index=idx)
    except Exception:
        return ImageFont.truetype(FONT_TTC, size, index=0)


def hex_to_rgb(hx: str) -> tuple[int, int, int]:
    hx = hx.lstrip("#")
    return (int(hx[0:2], 16), int(hx[2:4], 16), int(hx[4:6], 16))


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return f"#{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}"


def remove_white_bg_clean(
    rgb_img: Image.Image,
    ground_line_y: tuple[int, int] | None = None,
) -> Image.Image:
    """
    Cleanly removes solid/near-white background using border + large-hole flood fill,
    preserving interior white eyes, teeth, pearls, and specular armor highlights.
    """
    arr = np.array(rgb_img, dtype=np.float32)
    h, w, _ = arr.shape

    if ground_line_y is not None:
        y_lo, y_hi = ground_line_y
        y_lo = max(0, min(h - 1, y_lo))
        y_hi = max(0, min(h, y_hi))
        probe_y0 = max(0, y_lo - 20)
        probe_y1 = max(0, y_lo - 5)
        dist_probe = np.sqrt(np.sum((255.0 - arr[probe_y0:probe_y1, :, :]) ** 2, axis=2))
        has_body_above = (dist_probe > 42.0).mean(axis=0) > 0.55
        foot_mask = np.convolve(has_body_above.astype(np.float32), np.ones(3) / 3.0, mode="same") > 0.65
        for y in range(y_lo, y_hi):
            if y_hi - y_lo > 12:
                if y >= y_lo + 6:
                    arr[y, :, :] = 255.0
                else:
                    arr[y, ~foot_mask, :] = 255.0
            else:
                arr[y, ~foot_mask, :] = 255.0

    dist = np.sqrt(np.sum((255.0 - arr) ** 2, axis=2))
    sat = np.max(arr, axis=2) - np.min(arr, axis=2)
    bg_cand = (dist < 36.0) & (sat < 24.0)

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

    # Seed unambiguous pure-white interior gaps (between legs/arms/weapons) >= 5x5 px
    pure_white = (dist < 7.5) & (sat < 5.5)
    pw_img = Image.fromarray((pure_white * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5))
    pw_seeds = np.array(pw_img) > 128
    sy_arr, sx_arr = np.where(pw_seeds & (~visited))
    for sy, sx in zip(sy_arr, sx_arr):
        visited[sy, sx] = True
        q.append((sy, sx))

    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and bg_cand[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    alpha = np.ones((h, w), dtype=np.float32) * 255.0
    ramp = np.clip((dist - 14.0) / 22.0, 0.0, 1.0) * 255.0
    alpha[visited] = ramp[visited]

    # Defringe 1px white halo
    edge_zone = (alpha > 10.0) & (alpha < 245.0)
    if np.any(edge_zone):
        for c_i in range(3):
            cv = arr[:, :, c_i]
            arr[:, :, c_i] = np.where(edge_zone, np.clip((cv - 255.0 * 0.25) / 0.75, 0.0, 255.0), cv)

    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = np.clip(arr, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    return Image.fromarray(rgba)


def compute_dp_seam(rgba_arr: np.ndarray, x_left: int, x_right: int) -> np.ndarray:
    """
    Finds the minimum-cost vertical seam y=0..H-1 within [x_left, x_right]:
    - Glides effortlessly through white/transparent space around diagonal weapons, shields, bows & wings.
    - When two characters touch (opaque overlap), snaps cleanly onto dark anime ink contour lines
      and strong color boundaries with smooth quadratic step regularization (zero sawtooth notches!).
    """
    h, w, _ = rgba_arr.shape
    x_left = max(0, min(w - 2, x_left))
    x_right = max(x_left + 2, min(w, x_right))
    bw = x_right - x_left
    mid = bw * 0.5

    band = rgba_arr[:, x_left:x_right].astype(np.float32)
    rgb = band[:, :, :3]
    band_alpha = band[:, :, 3] / 255.0

    # Luminance & horizontal color gradient inside the band
    lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    grad_x = np.zeros((h, bw), dtype=np.float32)
    if bw > 2:
        diff = np.sqrt(np.sum((rgb[:, 2:, :] - rgb[:, :-2, :]) ** 2, axis=2)) * 0.5
        grad_x[:, 1:-1] = diff
        grad_x[:, 0] = diff[:, 0]
        grad_x[:, -1] = diff[:, -1]

    xs = np.arange(bw, dtype=np.float32)[None, :]
    is_fg = band_alpha > 0.08

    # Dark ink line (lum < 62) has much lower cost (~85..175) than flat bright fill (~580),
    # so seams through touching characters trace the exact black anime outline!
    ink_cost = 80.0 + lum * 1.55
    fill_cost = 590.0 - np.clip(grad_x * 1.65, 0.0, 190.0)
    fg_pixel_cost = np.where(lum < 64.0, ink_cost, np.minimum(fill_cost, 260.0 + lum * 1.35))

    cost_grid = np.where(
        is_fg,
        fg_pixel_cost * band_alpha + 0.02 * np.abs(xs - mid),
        0.006 * np.abs(xs - mid),
    )

    dp = np.zeros((h, bw), dtype=np.float32)
    back = np.zeros((h, bw), dtype=np.int32)
    dp[0] = cost_grid[0]

    # Allow dx in [-6..+6] in empty space (to sweep around wide shields/bows),
    # while quadratic foreground penalty keeps overlapping contours ultra-smooth!
    shifts = range(-6, 7)
    for y in range(1, h):
        prev = dp[y - 1]
        fg_row = is_fg[y]
        best_prev = np.full(bw, 1e12, dtype=np.float32)
        best_idx = np.arange(bw, dtype=np.int32)
        for s in shifts:
            s2 = float(s * s)
            if s == 0:
                cand = prev
                idx_cand = np.arange(bw, dtype=np.int32)
            elif s < 0:
                cand = np.full(bw, 1e12, dtype=np.float32)
                step_pen = np.where(fg_row[-s:], 2.6 * s2, 0.025 * s2)
                cand[-s:] = prev[: bw + s] + step_pen
                idx_cand = np.clip(np.arange(bw) + s, 0, bw - 1)
            else:
                cand = np.full(bw, 1e12, dtype=np.float32)
                step_pen = np.where(fg_row[: bw - s], 2.6 * s2, 0.025 * s2)
                cand[: bw - s] = prev[s:] + step_pen
                idx_cand = np.clip(np.arange(bw) + s, 0, bw - 1)
            mask = cand < best_prev
            best_prev = np.where(mask, cand, best_prev)
            best_idx = np.where(mask, idx_cand, best_idx)
        dp[y] = cost_grid[y] + best_prev
        back[y] = best_idx

    seam = np.zeros(h, dtype=np.int32)
    curr = int(np.argmin(dp[h - 1]))
    seam[h - 1] = x_left + curr
    for y in range(h - 1, 0, -1):
        curr = int(back[y, curr])
        seam[y - 1] = x_left + curr
    return seam


def split_row_by_dp_seams(
    rgba_row: Image.Image,
    num_chars: int,
    approx_centers: list[int] | None = None,
    seam_windows: list[tuple[int, int] | None] | None = None,
) -> list[Image.Image]:
    """
    Splits a single horizontal lineup of `num_chars` characters into `num_chars` pristine RGBA cutouts
    using ink-aware DP seam carving + speck cleanup.
    """
    arr = np.array(rgba_row)
    h, w, _ = arr.shape
    alpha = arr[:, :, 3]

    if approx_centers is None:
        # Estimate centers near (i + 0.5) * w / num_chars, nudged toward torso mass (y=25%..70%)
        torso_a = alpha[int(h * 0.25) : int(h * 0.72), :].astype(np.float32).mean(axis=0)
        ker = np.ones(35, dtype=np.float32) / 35.0
        smooth = np.convolve(torso_a, ker, mode="same")
        centers = []
        step = w / float(num_chars)
        for i in range(num_chars):
            nom = int((i + 0.5) * step)
            lo = max(20, int(nom - step * 0.26))
            hi = min(w - 20, int(nom + step * 0.26))
            pk = lo + int(np.argmax(smooth[lo:hi]))
            centers.append(pk)
    else:
        centers = approx_centers

    seams = []
    margin = max(18, int((w / num_chars) * 0.12))
    for i in range(num_chars - 1):
        if seam_windows is not None and i < len(seam_windows) and seam_windows[i] is not None:
            xl, xr = seam_windows[i]  # type: ignore[misc]
        else:
            xl = centers[i] + margin
            xr = centers[i + 1] - margin
            if xr <= xl + 6:
                mid = (centers[i] + centers[i + 1]) // 2
                xl, xr = mid - 16, mid + 16
        seams.append(compute_dp_seam(arr, xl, xr))

    cutouts: list[Image.Image] = []
    xx = np.arange(w)[None, :]
    for i in range(num_chars):
        mask = np.ones((h, w), dtype=bool)
        if i > 0:
            mask &= xx >= seams[i - 1][:, None]
        if i < num_chars - 1:
            mask &= xx < seams[i][:, None]

        ys, xs = np.where(mask & (alpha > 18))
        if len(xs) == 0:
            # Fallback nominal box
            x0 = int(i * w / num_chars)
            x1 = int((i + 1) * w / num_chars)
            cutouts.append(rgba_row.crop((x0, 0, x1, h)))
            continue

        x0, x1 = max(0, int(xs.min()) - 4), min(w, int(xs.max()) + 5)
        y0, y1 = max(0, int(ys.min()) - 4), min(h, int(ys.max()) + 5)

        sub = arr[y0:y1, x0:x1].copy()
        sub_mask = mask[y0:y1, x0:x1]
        sub[~sub_mask, 3] = 0
        cleaned = clean_cutout_specks(Image.fromarray(sub))
        cutouts.append(cleaned)

    return cutouts


def clean_cutout_specks(crop_rgba: Image.Image, keep_only_main: bool = False) -> Image.Image:
    """
    Removes tiny floating specks or stray edge remnants while preserving floating orbs/drums/runes.
    """
    arr = np.array(crop_rgba)
    h, w, _ = arr.shape
    fg = arr[:, :, 3] > 22
    labels = np.zeros((h, w), dtype=np.int32)
    sizes = {}
    bboxes = {}
    lbl = 0
    for y in range(h):
        for x in range(w):
            if fg[y, x] and labels[y, x] == 0:
                lbl += 1
                q = deque([(y, x)])
                labels[y, x] = lbl
                sz = 0
                x0, y0, x1, y1 = x, y, x, y
                while q:
                    cy, cx = q.popleft()
                    sz += 1
                    if cx < x0: x0 = cx
                    if cx > x1: x1 = cx
                    if cy < y0: y0 = cy
                    if cy > y1: y1 = cy
                    for ny in (cy - 1, cy, cy + 1):
                        for nx in (cx - 1, cx, cx + 1):
                            if 0 <= ny < h and 0 <= nx < w and fg[ny, nx] and labels[ny, nx] == 0:
                                labels[ny, nx] = lbl
                                q.append((ny, nx))
                sizes[lbl] = sz
                bboxes[lbl] = (x0, y0, x1, y1)

    if not sizes:
        return crop_rgba

    main_lbl = max(sizes, key=lambda k: sizes[k])
    main_sz = sizes[main_lbl]

    for k, sz in sizes.items():
        if k == main_lbl:
            continue
        if keep_only_main:
            arr[labels == k, 3] = 0
            continue
        x0, y0, x1, y1 = bboxes[k]
        touches_side = (x0 <= 1) or (x1 >= w - 2)
        if sz < 55:
            arr[labels == k, 3] = 0
        elif touches_side and sz < main_sz * 0.16:
            arr[labels == k, 3] = 0
        elif y0 > h * 0.84 and sz < main_sz * 0.05:
            arr[labels == k, 3] = 0

    # Tight re-crop with 8px padding
    ys, xs = np.where(arr[:, :, 3] > 18)
    if len(xs) == 0:
        return Image.fromarray(arr)
    tx0, tx1 = max(0, int(xs.min()) - 4), min(w, int(xs.max()) + 5)
    ty0, ty1 = max(0, int(ys.min()) - 4), min(h, int(ys.max()) + 5)
    return Image.fromarray(arr[ty0:ty1, tx0:tx1])


def cel_remaster_highres_unit(orig_rgba: Image.Image, faction: str) -> Image.Image:
    """
    Upscales a 256x296 Mecha (96..100) or Dragon (101..106, 108..110) sprite to crisp ~680px
    cel-shaded anime art: removes grainy pixel noise via multi-pass median smoothing, boosts
    cel-contrast, reinforces clean anime ink contours, and adds luminous rim highlights.
    """
    arr = np.array(orig_rgba.convert("RGBA"))
    ys, xs = np.where(arr[:, :, 3] > 20)
    tight = orig_rgba.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    tw, th = tight.size

    scale_x = 2.85
    scale_y = 3.15 if faction == "robot" else 3.00
    up_w = int(round(tw * scale_x))
    up_h = int(round(th * scale_y))
    up = tight.resize((up_w, up_h), Image.Resampling.LANCZOS)

    u_arr = np.array(up)
    rgb = Image.fromarray(u_arr[:, :, :3])
    alpha = Image.fromarray(u_arr[:, :, 3]).filter(ImageFilter.GaussianBlur(0.8))

    # Smooth grainy dithering into clean cel-shaded surfaces
    rgb_smooth = rgb.filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.SMOOTH_MORE)
    # Posterize subtly & blend 55% with smooth for crisp anime cel bands
    rgb_quant = rgb_smooth.quantize(colors=36, method=Image.Quantize.MEDIANCUT).convert("RGB")
    cel_rgb = Image.blend(rgb_smooth, rgb_quant, 0.38)
    cel_rgb = ImageEnhance.Color(cel_rgb).enhance(1.18)
    cel_rgb = ImageEnhance.Contrast(cel_rgb).enhance(1.16)
    cel_rgb = ImageEnhance.Sharpness(cel_rgb).enhance(1.55)

    # Reinforce crisp anime ink lines inside the silhouette
    edges = cel_rgb.convert("L").filter(ImageFilter.FIND_EDGES)
    e_arr = np.array(edges, dtype=np.float32) / 255.0
    c_arr = np.array(cel_rgb, dtype=np.float32)
    a_arr = np.array(alpha, dtype=np.float32)
    inner = np.array(alpha.filter(ImageFilter.MinFilter(5)), dtype=np.float32) / 255.0

    ink = np.clip((e_arr - 0.16) * 0.65, 0.0, 0.42) * inner
    for i in range(3):
        c_arr[:, :, i] *= (1.0 - ink)

    out = np.zeros((up_h, up_w, 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(c_arr, 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip((a_arr - 28.0) * 1.15, 0, 255).astype(np.uint8)
    return clean_cutout_specks(Image.fromarray(out))


def build_ysela_starlight_dragon_queen(cascade_cutout: Image.Image, orig_ysela_dragon: Image.Image) -> Image.Image:
    """
    Constructs a pristine, high-resolution glamorous anime Starlight Dragon-Queen Ysela (#107):
    - Preserves crisp white anime eyes & warm skin untouched
    - Smoothly feathers gown silk into deep Starlight Sapphire-Blue & Royal Gold (zero edge speckles!)
    - Warms upper ring into a luminous Starlight Astral Halo + 4x-supersampled curved golden dragon horns
    - Mirrors ONLY the clean full-height right starry wing of Ysela.png so zero dragon head/snout appears!
    """
    queen_only = clean_cutout_specks(cascade_cutout, keep_only_main=True)
    qw, qh = queen_only.size

    q_arr = np.array(queen_only, dtype=np.float32)
    r, g, b, a = q_arr[:, :, 0], q_arr[:, :, 1], q_arr[:, :, 2], q_arr[:, :, 3]
    yy_q, xx_q = np.meshgrid(np.arange(qh, dtype=np.float32), np.arange(qw, dtype=np.float32), indexing="ij")

    # 1. Warm-tint the pale-cyan circular halo ring above y < qh * 0.165 into a golden astral starlight halo
    #    (while keeping deep sapphire-blue hair bun untouched!)
    halo_zone = (yy_q < qh * 0.165) & (a > 20)
    pale_cyan = np.clip((np.minimum(r, g) - 140.0) / 75.0, 0.0, 1.0) * np.clip((b - r + 40.0) / 80.0, 0.0, 1.0)
    halo_w = np.where(halo_zone, pale_cyan, 0.0)
    if np.any(halo_w > 0.01):
        lum_h = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
        gold_r = np.clip(215.0 + lum_h * 40.0, 0, 255)
        gold_g = np.clip(168.0 + lum_h * 68.0, 0, 255)
        gold_b = np.clip(58.0 + lum_h * 55.0, 0, 255)
        q_arr[:, :, 0] = r * (1.0 - halo_w) + gold_r * halo_w
        q_arr[:, :, 1] = g * (1.0 - halo_w) + gold_g * halo_w
        q_arr[:, :, 2] = b * (1.0 - halo_w) + gold_b * halo_w
        r, g, b = q_arr[:, :, 0], q_arr[:, :, 1], q_arr[:, :, 2]

    # 2. Smooth, feathered sapphire-indigo recolor ONLY below collarbone (y > qh * 0.285 -> face/eyes 100% untouched!)
    gown_y_ramp = np.clip((yy_q - qh * 0.285) / (qh * 0.035), 0.0, 1.0)
    skin_w = np.clip(((r - b) - 9.0) / 13.0, 0.0, 1.0) * np.clip(((r - g) - 3.0) / 10.0, 0.0, 1.0) * np.clip((r - 140.0) / 30.0, 0.0, 1.0)
    gold_w = np.clip(((r - b) - 42.0) / 26.0, 0.0, 1.0) * np.clip((g - 115.0) / 35.0, 0.0, 1.0)
    min_rgb = np.minimum(np.minimum(r, g), b)
    whiteness = np.clip((min_rgb - 125.0) / 55.0, 0.0, 1.0)
    dress_w_raw = gown_y_ramp * whiteness * (1.0 - np.maximum(skin_w, gold_w)) * np.clip((a - 15.0) / 40.0, 0.0, 1.0)

    # Slight 0.7px feather so anti-aliased transitions to dark ink & gold trim have ZERO white pixel speckles
    dress_w_img = Image.fromarray(np.clip(dress_w_raw * 255.0, 0, 255).astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(0.65)
    )
    dress_w = (np.array(dress_w_img, dtype=np.float32) / 255.0) * gown_y_ramp

    lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
    sap_r = np.clip(18.0 + lum * 46.0, 0, 255)
    sap_g = np.clip(44.0 + lum * 88.0, 0, 255)
    sap_b = np.clip(118.0 + lum * 130.0, 0, 255)
    q_arr[:, :, 0] = r * (1.0 - dress_w) + sap_r * dress_w
    q_arr[:, :, 1] = g * (1.0 - dress_w) + sap_g * dress_w
    q_arr[:, :, 2] = b * (1.0 - dress_w) + sap_b * dress_w

    # Subtle tiny starlight glints strictly deep inside the sapphire gown fabric
    rng = np.random.default_rng(107)
    deep_fabric = dress_w > 0.86
    dys, dxs = np.where(deep_fabric)
    if len(dxs) > 90:
        pick = rng.choice(len(dxs), size=42, replace=False)
        for idx in pick:
            py, px = int(dys[idx]), int(dxs[idx])
            q_arr[py, px, :3] = [245, 250, 255]
            for ny, nx in ((py - 1, px), (py + 1, px), (py, px - 1), (py, px + 1)):
                if 0 <= ny < qh and 0 <= nx < qw:
                    q_arr[ny, nx, :3] = q_arr[ny, nx, :3] * 0.45 + np.array([210.0, 230.0, 255.0]) * 0.55

    queen_recolored = Image.fromarray(np.clip(q_arr, 0, 255).astype(np.uint8))

    # 3. Build symmetrical cosmic starry golden dragon wings from ONLY the clean right wing of Ysela.png!
    dragon_hi = cel_remaster_highres_unit(orig_ysela_dragon, "dragon")
    dw, dh = dragon_hi.size
    # Right half x = 0.54*dw .. dw has the complete golden-rimmed starry wing with ZERO dragon snout/head!
    rx0 = int(dw * 0.54)
    right_src = dragon_hi.crop((rx0, int(dh * 0.04), dw, int(dh * 0.94)))
    rsw, rsh = right_src.size
    rs_arr = np.array(right_src, dtype=np.float32)
    ryy, rxx = np.meshgrid(np.arange(rsh, dtype=np.float32), np.arange(rsw, dtype=np.float32), indexing="ij")
    # Smoothly fade inner attachment edge & mask out small lower-inner dragon foot/tail near (x < 0.34*rsw, y > 0.68*rsh)
    inner_fade = np.clip(rxx / (rsw * 0.14), 0.0, 1.0)
    foot_mask = 1.0 - (
        np.clip((0.36 * rsw - rxx) / (0.10 * rsw), 0.0, 1.0)
        * np.clip((ryy - 0.66 * rsh) / (0.08 * rsh), 0.0, 1.0)
    )
    rs_arr[:, :, 3] *= inner_fade * foot_mask
    single_wing_w = int(qw * 0.88)
    single_wing_h = int(qh * 0.58)
    right_wing = Image.fromarray(np.clip(rs_arr, 0, 255).astype(np.uint8)).resize(
        (single_wing_w, single_wing_h), Image.Resampling.LANCZOS
    )
    left_wing = right_wing.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

    wing_span = single_wing_w * 2 + int(qw * 0.04)
    cw = max(qw + 40, wing_span + 20)
    ch = qh + 44
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    wy = int(qh * 0.15) + 32
    mid_cx = cw // 2
    canvas.alpha_composite(left_wing, (mid_cx - int(qw * 0.02) - single_wing_w, wy))
    canvas.alpha_composite(right_wing, (mid_cx + int(qw * 0.02), wy))

    qx = (cw - qw) // 2
    qy = 34
    canvas.alpha_composite(queen_recolored, (qx, qy))

    # 4. 4x-supersampled anti-aliased curved golden dragon horns with highlight ridge & crisp dark ink outline
    ss = 4
    horn_hi = Image.new("RGBA", (cw * ss, ch * ss), (0, 0, 0, 0))
    hd = ImageDraw.Draw(horn_hi)
    hcx = (qx + int(qw * 0.50)) * ss
    hty = (qy + int(qh * 0.068)) * ss
    for sign in (-1, 1):
        outer_pts = [
            (hcx + sign * 16 * ss, hty + 15 * ss),
            (hcx + sign * 30 * ss, hty - 2 * ss),
            (hcx + sign * 44 * ss, hty - 22 * ss),
            (hcx + sign * 52 * ss, hty - 42 * ss),
            (hcx + sign * 39 * ss, hty - 25 * ss),
            (hcx + sign * 25 * ss, hty - 8 * ss),
            (hcx + sign * 9 * ss, hty + 9 * ss),
        ]
        inner_hi = [
            (hcx + sign * 14 * ss, hty + 11 * ss),
            (hcx + sign * 31 * ss, hty - 9 * ss),
            (hcx + sign * 47 * ss, hty - 35 * ss),
            (hcx + sign * 26 * ss, hty - 8 * ss),
        ]
        hd.polygon(outer_pts, fill=(238, 184, 58, 255))
        hd.polygon(inner_hi, fill=(255, 228, 128, 255))
        hd.line(outer_pts + [outer_pts[0]], fill=(36, 22, 12, 255), width=max(2, int(2.2 * ss)), joint="curve")
    horn_layer = horn_hi.resize((cw, ch), Image.Resampling.LANCZOS)
    canvas.alpha_composite(horn_layer)
    return clean_cutout_specks(canvas)


def extract_palette_swatches(rgba_img: Image.Image, n_colors: int = 5) -> list[tuple[int, int, int]]:
    """
    Extracts `n_colors` vibrant, distinct representative RGB swatches from a transparent character cutout.
    """
    small = rgba_img.resize((96, 96), Image.Resampling.BILINEAR)
    arr = np.array(small)
    vis = arr[arr[:, :, 3] > 180][:, :3]
    if len(vis) < 20:
        return [(40, 60, 90), (90, 130, 190), (210, 175, 90), (235, 225, 215), (30, 30, 35)]

    # Filter out near-black outline ink so swatches show actual character fill colors
    lum = 0.299 * vis[:, 0] + 0.587 * vis[:, 1] + 0.114 * vis[:, 2]
    fill_px = vis[lum > 28]
    if len(fill_px) < 20:
        fill_px = vis

    pal_im = Image.fromarray(fill_px.reshape(-1, 1, 3).astype(np.uint8)).quantize(
        colors=12, method=Image.Quantize.MEDIANCUT
    )
    pal = pal_im.getpalette()[: 12 * 3]
    counts = pal_im.histogram()[:12]
    ranked = sorted(
        [(counts[i], (pal[i * 3], pal[i * 3 + 1], pal[i * 3 + 2])) for i in range(12) if counts[i] > 0],
        reverse=True,
    )

    chosen: list[tuple[int, int, int]] = []
    for _, col in ranked:
        if all(sum((col[c] - ex[c]) ** 2 for c in range(3)) ** 0.5 > 36.0 for ex in chosen):
            chosen.append(col)
        if len(chosen) == n_colors:
            break
    while len(chosen) < n_colors:
        chosen.append(ranked[min(len(chosen), len(ranked) - 1)][1])
    return chosen


def paste_centered(
    canvas: Image.Image,
    sprite: Image.Image,
    box: tuple[int, int, int, int],
    align_bottom: bool = False,
) -> None:
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    sw, sh = sprite.size
    scale = min(bw / float(sw), bh / float(sh))
    nw = max(1, int(round(sw * scale)))
    nh = max(1, int(round(sh * scale)))
    resized = sprite.resize((nw, nh), Image.Resampling.LANCZOS)
    px = x0 + (bw - nw) // 2
    py = (y1 - nh - 4) if align_bottom else (y0 + (bh - nh) // 2)
    canvas.paste(resized, (px, py), resized)


def draw_wrapped_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    x: int,
    y: int,
    max_chars: int,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
    line_gap: int = 6,
) -> int:
    lines = textwrap.wrap(text, width=max_chars, break_long_words=False)
    cy = y
    for ln in lines:
        draw.text((x, cy), ln, font=font, fill=fill)
        bbox = draw.textbbox((x, cy), ln, font=font)
        cy += (bbox[3] - bbox[1]) + line_gap
    return cy


def render_individual_studio_sheet(
    cid: int,
    card: dict,
    anime_cutout: Image.Image,
    chibi_idle: Image.Image,
    chibi_attack: Image.Image,
    fonts: dict,
) -> tuple[Image.Image, list[str]]:
    """
    Renders a 1600x1000 HD Official Studio Animation Character Model Sheet (애니메이션 캐릭터 설정화).
    """
    W, H = 1600, 1000
    faction = card["faction"]
    fac_label, fac_hex, acc_hex = FACTION_META[faction]
    fac_rgb = hex_to_rgb(fac_hex)
    acc_rgb = hex_to_rgb(acc_hex)

    gender_type, novel_role, hair_desc, body_desc, item_desc = ANIME_CHAR_SPECS[cid]
    type_badge = {
        "female": "GLAMOUR S-LINE & UNIQUE HAIRSTYLE",
        "male": "MUSCULAR PHYSIQUE & SIGNATURE WEAPON",
        "monster": "SAVAGE MUSCLE & ICONIC CREATURE TRAIT",
        "mecha": "MAGITECH ARMOR & HEAVY WEAPON SYSTEM",
        "dragon": "DRACONIC MAJESTY & ELEMENTAL WINGS",
    }[gender_type]

    sheet = Image.new("RGBA", (W, H), (250, 249, 246, 255))
    draw = ImageDraw.Draw(sheet)

    # Subtle architectural dot/grid lines across background
    for gx in range(0, W, 40):
        draw.line([(gx, 86), (gx, H)], fill=(238, 235, 229, 255), width=1)
    for gy in range(86, H, 40):
        draw.line([(0, gy), (W, gy)], fill=(238, 235, 229, 255), width=1)

    # Top Studio Header Bar (0..84)
    draw.rectangle([0, 0, W, 84], fill=(24, 23, 28, 255))
    draw.rectangle([0, 80, W, 84], fill=fac_rgb + (255,))

    # Number badge
    draw.rectangle([28, 16, 148, 66], fill=fac_rgb + (255,))
    draw.text((44, 25), f"NO.{cid:03d}", font=fonts["h_num"], fill=(255, 255, 255))

    # Character Name Ko + En
    title_str = f"{card['title_ko']}  ({card['title_en'].upper()})"
    draw.text((168, 18), title_str, font=fonts["h_title"], fill=(252, 251, 249))

    # Faction & Archetype Pill
    pill_text = f"{fac_label}  |  {card['archetype'].upper()} · {card['rarity'].upper()}"
    draw.text((170, 53), pill_text, font=fonts["small_b"], fill=acc_rgb)

    # Studio Right Stamp
    draw.text(
        (W - 515, 22),
        "SNSHERO ANIMATION PRODUCTION SHEET",
        font=fonts["label_b"],
        fill=(228, 226, 221),
    )
    draw.text(
        (W - 515, 48),
        "원작 소설 『카단의 여정 (KADAN'S JOURNEY)』 공식 캐릭터 설정화",
        font=fonts["small"],
        fill=(168, 164, 158),
    )

    # ─── PANEL 1: MAIN ANIME FULL-BODY DESIGN (x=28..616, y=104..968) ───
    p1 = [28, 104, 616, 968]
    draw.rectangle(p1, fill=(255, 255, 255, 255), outline=(40, 38, 42, 255), width=2)
    draw.rectangle([28, 104, 616, 142], fill=(34, 33, 38, 255))
    draw.text((42, 113), "01  ANIME FULL-BODY DESIGN · 애니메이션 전신 원화", font=fonts["panel_h"], fill=(255, 255, 255))

    # Height guide lines (Settei head-ratio lines)
    for pct, lbl_txt in [(0.0, "TOP 100%"), (0.25, "75%"), (0.50, "MID 50%"), (0.75, "25%"), (1.0, "BASE 0%")]:
        gy = int(176 + pct * (934 - 176))
        draw.line([(44, gy), (600, gy)], fill=(230, 234, 240, 255), width=1)
        draw.text((48, gy - 16), lbl_txt, font=fonts["tiny"], fill=(165, 170, 180))

    # Design Focus Ribbon inside Panel 1
    draw.rectangle([42, 938, 602, 960], fill=(244, 243, 240, 255))
    draw.text((54, 941), f"STYLE FOCUS : {type_badge}", font=fonts["tiny_b"], fill=fac_rgb)

    paste_centered(sheet, anime_cutout, (48, 162, 596, 932), align_bottom=True)

    # ─── PANEL 2: FACE, HAIRSTYLE & UPPER DETAIL ZOOM (x=634..1034, y=104..522) ───
    p2 = [634, 104, 1034, 522]
    draw.rectangle(p2, fill=(255, 255, 255, 255), outline=(40, 38, 42, 255), width=2)
    draw.rectangle([634, 104, 1034, 142], fill=(34, 33, 38, 255))
    draw.text((648, 113), "02  HEAD, HAIR & EXPRESSION · 표정·헤어 디테일", font=fonts["panel_h"], fill=(255, 255, 255))

    # Crop upper 46% of anime_cutout for close-up bust/head/hair showcase
    aw, ah = anime_cutout.size
    bust_crop = anime_cutout.crop((0, 0, aw, max(1, int(ah * 0.48))))
    paste_centered(sheet, bust_crop, (648, 154, 1020, 510), align_bottom=False)

    # ─── PANEL 3: 3-HEAD CUTE SD / CHIBI ORIGIN & ACTION (x=634..1034, y=540..968) ───
    p3 = [634, 540, 1034, 968]
    draw.rectangle(p3, fill=(252, 250, 245, 255), outline=(40, 38, 42, 255), width=2)
    draw.rectangle([634, 540, 1034, 578], fill=fac_rgb + (255,))
    draw.text((648, 549), "03  3등신 CUTE SD & ACTION · 귀여움 원형 계승", font=fonts["panel_h"], fill=(255, 255, 255))

    # Sub-boxes for Idle Chibi & Attack Chibi
    draw.rectangle([648, 592, 826, 898], fill=(255, 255, 255, 255), outline=(218, 214, 206, 255), width=1)
    draw.rectangle([842, 592, 1020, 898], fill=(255, 255, 255, 255), outline=(218, 214, 206, 255), width=1)
    draw.text((682, 600), "[3등신 기본 큐트 원형]", font=fonts["tiny_b"], fill=(95, 92, 88))
    draw.text((876, 600), "[3등신 액션 연출 포즈]", font=fonts["tiny_b"], fill=fac_rgb)

    paste_centered(sheet, chibi_idle, (654, 624, 820, 888), align_bottom=False)
    paste_centered(sheet, chibi_attack, (848, 624, 1014, 888), align_bottom=False)

    draw.text(
        (648, 910),
        "• 메인 애니메이션의 큰 눈망울·표정 매력의 원천 레퍼런스",
        font=fonts["tiny"],
        fill=(75, 72, 68),
    )
    draw.text(
        (648, 934),
        "• 애니메이션 내 코믹/일상/감정 강조 데포르메(SD) 컷 겸용",
        font=fonts["tiny"],
        fill=(75, 72, 68),
    )

    # ─── PANEL 4: NOVEL LORE, DESIGN CALLOUTS & COLOR PALETTE (x=1052..1572, y=104..968) ───
    p4 = [1052, 104, 1572, 968]
    draw.rectangle(p4, fill=(255, 255, 255, 255), outline=(40, 38, 42, 255), width=2)
    draw.rectangle([1052, 104, 1572, 142], fill=(34, 33, 38, 255))
    draw.text((1066, 113), "04  CHARACTER SPEC & PALETTE · 작화 지침서", font=fonts["panel_h"], fill=(255, 255, 255))

    cy = 160
    sections = [
        ("■ 소설 『카단의 여정』 역할 & 캐릭터성", novel_role, False),
        ("■ 헤어스타일 & 두부 조형 포인트", hair_desc, False),
        ("■ 체형 실루엣 & 3등신 귀여움 조화", body_desc, False),
        ("■ 시그니처 무기 · 갑주 · 핵심 아이템 강조", item_desc, True),
    ]

    for sec_title, sec_body, highlight in sections:
        if highlight:
            draw.rectangle([1068, cy - 4, 1556, cy + 122], fill=(250, 246, 238, 255), outline=fac_rgb + (255,), width=2)
            tx = 1080
            cy += 8
        else:
            tx = 1070

        draw.text((tx, cy), sec_title, font=fonts["sec_h"], fill=fac_rgb if highlight else (28, 27, 32))
        cy += 28
        cy = draw_wrapped_text(
            draw,
            sec_body,
            tx + 4,
            cy,
            max_chars=27 if highlight else 28,
            font=fonts["body"],
            fill=(48, 46, 52),
            line_gap=6,
        )
        cy += 22 if not highlight else 26

    # Color Swatches Section at bottom of Panel 4
    swatch_y0 = 816
    draw.line([(1068, swatch_y0 - 12), (1556, swatch_y0 - 12)], fill=(224, 220, 214, 255), width=1)
    draw.text((1070, swatch_y0), "■ 공식 작화 지정 컬러칩 (KEY COLOR PALETTE)", font=fonts["sec_h"], fill=(28, 27, 32))

    swatches = extract_palette_swatches(anime_cutout, 5)
    hex_list = [rgb_to_hex(c) for c in swatches]
    sw_w = 86
    sw_gap = 11
    for i, (rgb_c, hx) in enumerate(zip(swatches, hex_list)):
        sx = 1070 + i * (sw_w + sw_gap)
        sy = swatch_y0 + 34
        draw.rectangle([sx, sy, sx + sw_w, sy + 64], fill=rgb_c + (255,), outline=(45, 45, 50, 255), width=1)
        draw.text((sx + 8, sy + 72), hx, font=fonts["tiny_b"], fill=(55, 53, 58))

    return sheet.convert("RGB"), hex_list


def render_faction_master_sheet(
    faction_idx: int,
    faction_key: str,
    cid_list: list[int],
    cards: dict,
    anime_cutouts: dict[int, Image.Image],
    chibi_idles: dict[int, Image.Image],
    fonts: dict,
) -> Image.Image:
    """
    Renders a 2400x1420 HD 10-Character Faction Master Sheet (2 rows x 5 columns),
    pairing each character's new Anime Full-Body Art with their cute 3-Head Chibi badge & key item callout!
    """
    W, H = 2400, 1420
    fac_label, fac_hex, acc_hex = FACTION_META[faction_key]
    fac_rgb = hex_to_rgb(fac_hex)
    acc_rgb = hex_to_rgb(acc_hex)

    canvas = Image.new("RGBA", (W, H), (248, 247, 243, 255))
    draw = ImageDraw.Draw(canvas)

    # Top Banner
    draw.rectangle([0, 0, W, 96], fill=(22, 22, 27, 255))
    draw.rectangle([0, 90, W, 96], fill=fac_rgb + (255,))
    draw.rectangle([32, 18, 220, 74], fill=fac_rgb + (255,))
    draw.text((52, 29), f"SHEET {faction_idx:02d} / 11", font=fonts["h_num"], fill=(255, 255, 255))
    draw.text(
        (244, 20),
        f"{fac_label} — 10인 애니메이션 캐릭터 마스터 시트 (IDS {cid_list[0]:03d}–{cid_list[-1]:03d})",
        font=fonts["fac_title"],
        fill=(255, 255, 255),
    )
    draw.text(
        (246, 58),
        "소설 『카단의 여정』 기반 | 여성: 글래머 체형 & 유니크 헤어 | 남성·몬스터: 근육질 & 시그니처 무기 강조 | 우측 하단: 3등신 큐트 SD 계승",
        font=fonts["small"],
        fill=acc_rgb,
    )

    margin_x, margin_y = 28, 114
    gap_x, gap_y = 20, 22
    cell_w = (W - margin_x * 2 - gap_x * 4) // 5  # 452px
    cell_h = (H - margin_y - 24 - gap_y) // 2      # 630px

    for idx, cid in enumerate(cid_list):
        col = idx % 5
        row = idx // 5
        cx0 = margin_x + col * (cell_w + gap_x)
        cy0 = margin_y + row * (cell_h + gap_y)
        cx1 = cx0 + cell_w
        cy1 = cy0 + cell_h

        card = cards[cid]
        gender_type, novel_role, hair_desc, _, item_desc = ANIME_CHAR_SPECS[cid]

        draw.rectangle([cx0, cy0, cx1, cy1], fill=(255, 255, 255, 255), outline=(42, 40, 46, 255), width=2)
        draw.rectangle([cx0, cy0, cx1, cy0 + 44], fill=(32, 31, 36, 255))
        draw.rectangle([cx0, cy0, cx0 + 68, cy0 + 44], fill=fac_rgb + (255,))
        draw.text((cx0 + 11, cy0 + 11), f"#{cid:03d}", font=fonts["panel_h"], fill=(255, 255, 255))
        draw.text(
            (cx0 + 78, cy0 + 10),
            f"{card['title_ko']} ({card['title_en']})",
            font=fonts["sec_h"],
            fill=(252, 251, 248),
        )

        # Main Anime Full-Body Sprite
        paste_centered(canvas, anime_cutouts[cid], (cx0 + 12, cy0 + 54, cx1 - 88, cy1 - 92), align_bottom=True)

        # Cute 3-Head Chibi Inset Badge at bottom-right of portrait area!
        sd_box = [cx1 - 118, cy1 - 216, cx1 - 10, cy1 - 96]
        draw.rectangle(sd_box, fill=(252, 250, 244, 245), outline=fac_rgb + (255,), width=2)
        draw.rectangle([sd_box[0], sd_box[1], sd_box[2], sd_box[1] + 20], fill=fac_rgb + (255,))
        draw.text((sd_box[0] + 14, sd_box[1] + 2), "3등신 SD", font=fonts["tiny_b"], fill=(255, 255, 255))
        paste_centered(canvas, chibi_idles[cid], (sd_box[0] + 6, sd_box[1] + 22, sd_box[2] - 6, sd_box[3] - 4))

        # Bottom Spec Strip inside cell
        draw.rectangle([cx0 + 2, cy1 - 88, cx1 - 2, cy1 - 2], fill=(246, 244, 239, 255))
        draw.line([(cx0 + 2, cy1 - 88), (cx1 - 2, cy1 - 88)], fill=(215, 211, 204, 255), width=1)

        tag_label = "여성·글래머·유니크헤어" if gender_type == "female" else "근육·무기·개성강조"
        short_hair = hair_desc[:26] + ("…" if len(hair_desc) > 26 else "")
        short_item = item_desc[:28] + ("…" if len(item_desc) > 28 else "")
        draw.text((cx0 + 12, cy1 - 80), f"[{tag_label}] {short_hair}", font=fonts["tiny_b"], fill=fac_rgb)
        draw.text((cx0 + 12, cy1 - 54), f"무기/특징: {short_item}", font=fonts["tiny"], fill=(45, 43, 48))
        short_role = novel_role[:31] + ("…" if len(novel_role) > 31 else "")
        draw.text((cx0 + 12, cy1 - 28), f"설정: {short_role}", font=fonts["tiny"], fill=(102, 98, 94))

    return canvas.convert("RGB")


def main() -> None:
    CUTOUT_DIR.mkdir(parents=True, exist_ok=True)
    SHEET_DIR.mkdir(parents=True, exist_ok=True)
    FACTION_DIR.mkdir(parents=True, exist_ok=True)

    cards = parse_110_cards()

    fonts = {
        "h_num": load_font(26, bold=True),
        "h_title": load_font(28, bold=True),
        "fac_title": load_font(29, bold=True),
        "panel_h": load_font(17, bold=True),
        "sec_h": load_font(18, bold=True),
        "body": load_font(16, bold=False),
        "label_b": load_font(17, bold=True),
        "small_b": load_font(15, bold=True),
        "small": load_font(15, bold=False),
        "tiny_b": load_font(13, bold=True),
        "tiny": load_font(13, bold=False),
    }

    anime_cutouts: dict[int, Image.Image] = {}

    # 1. Extract all 5-character new high-res sheets via DP seam carving!
    five_char_batches = [
        ("anime_01a_water_1793137794792.jpg", 1, 768),
        ("anime_01b_water_1793137814797.jpg", 6, 768),
        ("anime_02a_fire_1793137834796.jpg", 11, 696),   # strip bottom text labels cleanly
        ("anime_03a_wind_1793137800297.jpg", 21, 768),
        ("anime_03b_wind_1793137822066.jpg", 26, 768),
        ("anime_05a_human_clean_1793137812223.jpg", 41, 768),
        ("anime_05b_human_1793137831091.jpg", 46, 704),  # strip bottom text labels cleanly
        ("anime_07a_elf_1793137801713.jpg", 61, 768),
        ("anime_07b_elf_1793137821573.jpg", 66, 768),
        ("anime_09a_monster_1793137798455.jpg", 81, 768),
        ("anime_09b_monster_1793137818251.jpg", 86, 768),
        ("anime_10a_mecha_1793137836093.jpg", 91, 768),
    ]

    for fname, start_cid, ymax in five_char_batches:
        raw = Image.open(BRAIN_DIR / fname).convert("RGB").crop((0, 0, 1376, ymax))
        rgba = remove_white_bg_clean(raw)
        sw = [(288, 376), None, None, None] if start_cid == 46 else None
        cuts = split_row_by_dp_seams(rgba, num_chars=5, seam_windows=sw)
        for i, cut in enumerate(cuts):
            anime_cutouts[start_cid + i] = cut
        print(f"Segmented {fname} -> IDs {start_cid:03d}..{start_cid+4:03d}")

    # 2. Fire B (IDs 16..20) from sheet_02_fire_fixed_1793100244611.jpg (10-char sheet -> take indices 5..9)
    fire10_rgb = Image.open(BRAIN_DIR / "sheet_02_fire_fixed_1793100244611.jpg").convert("RGB")
    fire10_rgba = remove_white_bg_clean(fire10_rgb)
    fire10_cuts = split_row_by_dp_seams(
        fire10_rgba,
        num_chars=10,
        approx_centers=[88, 222, 368, 505, 628, 760, 902, 1045, 1175, 1300],
        seam_windows=[
            None,
            None,
            None,
            None,
            (668, 725),
            (798, 868),
            (942, 1018),
            (1082, 1158),
            (1198, 1258),
        ],
    )
    for i in range(5, 10):
        cid_f = 11 + i
        anime_cutouts[cid_f] = clean_cutout_specks(fire10_cuts[i], keep_only_main=(cid_f in (18, 19)))
    print("Segmented Fire B -> IDs 016..020")

    # 3. Earth (IDs 31..40) from sheet_04_earth_1793100291507.jpg
    earth10_rgb = Image.open(BRAIN_DIR / "sheet_04_earth_1793100291507.jpg").convert("RGB")
    earth10_rgba = remove_white_bg_clean(earth10_rgb)
    earth10_cuts = split_row_by_dp_seams(
        earth10_rgba,
        num_chars=10,
        approx_centers=[92, 232, 368, 502, 612, 742, 855, 995, 1125, 1285],
        seam_windows=[
            (118, 184),
            (278, 336),
            (422, 468),
            (542, 584),
            (648, 696),
            (780, 836),
            (882, 990),
            (1010, 1088),
            (1145, 1232),
        ],
    )
    for i in range(10):
        cid_e = 31 + i
        anime_cutouts[cid_e] = clean_cutout_specks(earth10_cuts[i], keep_only_main=(cid_e in (32, 36)))
    print("Segmented Earth -> IDs 031..040")

    # 4. Undead (IDs 51..60) from 2-row high-res sheet_06_undead_1793100207910.jpg!
    undead_rgb = Image.open(BRAIN_DIR / "sheet_06_undead_1793100207910.jpg").convert("RGB")
    undead_rgba = remove_white_bg_clean(undead_rgb)
    # Row 1 (y=0..386) has 6 figures: Walker(51), Ghoul(52), Carrion(53), Arachne(54), Patchwork(55), extra(skip)
    u_top = undead_rgba.crop((0, 0, 1376, 386))
    u_top_cuts = split_row_by_dp_seams(
        u_top, num_chars=6, approx_centers=[115, 330, 545, 735, 985, 1245]
    )
    for i in range(5):
        anime_cutouts[51 + i] = u_top_cuts[i]

    # Row 2 (y=386..768) has 5 figures with wide white gaps: Sidragosa(58), Stone Gargoyle(57), Cardis(56), Keltus(59), Artus(60)
    u_bot = undead_rgba.crop((0, 386, 1376, 768))
    u_bot_cuts = split_row_by_dp_seams(
        u_bot, num_chars=5, approx_centers=[175, 515, 760, 985, 1255]
    )
    anime_cutouts[58] = u_bot_cuts[0]
    anime_cutouts[57] = u_bot_cuts[1]
    anime_cutouts[56] = u_bot_cuts[2]
    anime_cutouts[59] = u_bot_cuts[3]
    anime_cutouts[60] = u_bot_cuts[4]
    print("Segmented 2-row Undead -> IDs 051..060")

    # 5. Dwarf (IDs 71..80) from sheet_08_dwarf_1793100309173.jpg (strip stone plinth cleanly!)
    dwarf10_rgb = Image.open(BRAIN_DIR / "sheet_08_dwarf_1793100309173.jpg").convert("RGB")
    dwarf10_rgba = remove_white_bg_clean(dwarf10_rgb, ground_line_y=(488, 528))
    dwarf10_cuts = split_row_by_dp_seams(
        dwarf10_rgba,
        num_chars=10,
        approx_centers=[92, 248, 378, 515, 646, 760, 885, 1005, 1125, 1268],
        seam_windows=[
            None,
            None,
            None,
            None,
            None,
            None,
            (918, 966),
            (1038, 1086),
            (1135, 1218),
        ],
    )
    # Trim Ironforge's dark tower-shield top behind Berryforge's bright golden sun-halo (#079)
    bf_arr = np.array(dwarf10_cuts[8])
    bf_h, bf_w, _ = bf_arr.shape
    bf_lum = 0.299 * bf_arr[:, :, 0] + 0.587 * bf_arr[:, :, 1] + 0.114 * bf_arr[:, :, 2]
    bf_yy, bf_xx = np.meshgrid(np.arange(bf_h), np.arange(bf_w), indexing="ij")
    dark_shield_behind_halo = (bf_yy < int(bf_h * 0.36)) & (bf_xx > int(bf_w * 0.42)) & (bf_lum < 142.0) & (
        (bf_arr[:, :, 0].astype(np.int32) - bf_arr[:, :, 2].astype(np.int32)) < 75
    )
    bf_arr[dark_shield_behind_halo, 3] = 0
    dwarf10_cuts[8] = clean_cutout_specks(Image.fromarray(bf_arr), keep_only_main=True)

    for i in range(10):
        anime_cutouts[71 + i] = dwarf10_cuts[i]
    print("Segmented Dwarf -> IDs 071..080")

    # 6. Mecha B (IDs 96..100) + Dragons & Starlight Dragon-Queen Ysela (IDs 101..110)
    for cid in range(96, 101):
        orig_p = PROJECT_ROOT / "public" / "seat" / cards[cid]["seat_filename"]
        anime_cutouts[cid] = cel_remaster_highres_unit(Image.open(orig_p), "robot")

    for cid in range(101, 111):
        orig_p = PROJECT_ROOT / "public" / "seat" / cards[cid]["seat_filename"]
        orig_im = Image.open(orig_p)
        if cid == 107:
            anime_cutouts[cid] = build_ysela_starlight_dragon_queen(anime_cutouts[8], orig_im)
        else:
            anime_cutouts[cid] = cel_remaster_highres_unit(orig_im, "dragon")
    print("Built Mecha B (096..100) and Dragons + Starlight Dragon-Queen Ysela (101..110)")

    # Load all 110 original 3-head chibi idle & attack sprites (read-only!)
    cards1_atlas = Image.open(PROJECT_ROOT / "public" / "cards1.png").convert("RGBA")
    chibi_idles: dict[int, Image.Image] = {}
    chibi_attacks: dict[int, Image.Image] = {}
    for cid in range(1, 111):
        sf = cards[cid]["seat_filename"]
        if cid == 70:
            # #070 Aila: read her canonical starry-blue 3-head chibi tile from public/cards1.png (row 7, col 10)
            aila_tile = cards1_atlas.crop((900, 600, 1000, 700)).resize((240, 240), Image.Resampling.LANCZOS)
            idle_70 = Image.new("RGBA", (256, 296), (0, 0, 0, 0))
            idle_70.paste(aila_tile, (8, 28), aila_tile)
            chibi_idles[70] = idle_70
            # Dynamic starry-glow action pose for Panel 3 without touching public/seat*
            atk_70 = Image.new("RGBA", (256, 296), (0, 0, 0, 0))
            glow = aila_tile.filter(ImageFilter.GaussianBlur(6))
            g_arr = np.array(glow, dtype=np.float32)
            g_arr[:, :, :3] = [80.0, 195.0, 255.0]
            g_arr[:, :, 3] = np.clip(g_arr[:, :, 3] * 0.85, 0, 255)
            glow_im = Image.fromarray(g_arr.astype(np.uint8)).rotate(-7, resample=Image.Resampling.BICUBIC, expand=False)
            rot_aila = aila_tile.rotate(-7, resample=Image.Resampling.BICUBIC, expand=False)
            atk_70.alpha_composite(glow_im, (10, 22))
            atk_70.alpha_composite(rot_aila, (12, 20))
            chibi_attacks[70] = atk_70
        else:
            chibi_idles[cid] = Image.open(PROJECT_ROOT / "public" / "seat" / sf).convert("RGBA")
            chibi_attacks[cid] = Image.open(PROJECT_ROOT / "public" / "seat_attack" / sf).convert("RGBA")

    # 7. Save all 110 high-res cutouts & 110 individual 1600x1000 Studio Character Sheets + manifest
    manifest_entries = []
    sheet_thumbs_for_poster: list[Image.Image] = []

    for cid in range(1, 111):
        card = cards[cid]
        slug = card["seat_filename"].replace(".png", "")
        cutout_rel = f"/anime-character-sheets/cutouts/{cid:03d}_{slug}.png"
        sheet_rel = f"/anime-character-sheets/sheets/{cid:03d}_{slug}_sheet.jpg"

        anime_cutouts[cid].save(CUTOUT_DIR / f"{cid:03d}_{slug}.png", "PNG")

        sheet_rgb, hex_swatches = render_individual_studio_sheet(
            cid,
            card,
            anime_cutouts[cid],
            chibi_idles[cid],
            chibi_attacks[cid],
            fonts,
        )
        sheet_rgb.save(SHEET_DIR / f"{cid:03d}_{slug}_sheet.jpg", "JPEG", quality=92, optimize=True)
        sheet_thumbs_for_poster.append(sheet_rgb.resize((240, 150), Image.Resampling.LANCZOS))

        gender_type, novel_role, hair_desc, body_desc, item_desc = ANIME_CHAR_SPECS[cid]
        fac_label, fac_hex, _ = FACTION_META[card["faction"]]

        # Ready-to-use English AI Video Animation Prompt
        style_tag = (
            "glamorous curvy hourglass anime heroine, expressive big sparkling anime eyes, form-fitting outfit"
            if gender_type == "female"
            else "powerful muscular fantasy anime warrior/creature, charismatic expressive eyes, bold oversized signature weapon"
        )
        video_prompt = (
            f"2D Japanese-Korean fantasy animation scene from 'Kadan's Journey', featuring {card['title_en']} ({card['title_ko']}), "
            f"{style_tag}, distinctive features: {hair_desc} and {item_desc}, crisp cel-shaded anime linework, "
            f"smooth sakuga keyframe animation, dynamic wind and elemental aura particles, color palette {', '.join(hex_swatches[:3])}."
        )

        manifest_entries.append(
            {
                "id": cid,
                "code": f"NO.{cid:03d}",
                "nameKo": card["title_ko"],
                "nameEn": card["title_en"],
                "faction": card["faction"],
                "factionLabel": fac_label,
                "factionColor": fac_hex,
                "rarity": card["rarity"],
                "archetype": card["archetype"],
                "category": gender_type,
                "novelRoleKo": novel_role,
                "hairDesignKo": hair_desc,
                "bodyCharmKo": body_desc,
                "signatureItemKo": item_desc,
                "palette": hex_swatches,
                "sheetUrl": sheet_rel,
                "cutoutUrl": cutout_rel,
                "chibiIdleUrl": f"/seat/{card['seat_filename']}",
                "chibiAttackUrl": f"/seat_attack/{card['seat_filename']}",
                "videoPromptEn": video_prompt,
            }
        )
        if cid % 20 == 0 or cid == 110:
            print(f"Rendered {cid}/110 individual 1600x1000 Studio Character Sheets...")

    # 8. Render 11 Faction Master Character Sheets (2400x1420)
    faction_keys = ["water", "fire", "wind", "earth", "human", "undead", "elf", "dwarf", "monster", "robot", "dragon"]
    faction_sheet_meta = []
    for f_idx, f_key in enumerate(faction_keys, start=1):
        cids = list(range((f_idx - 1) * 10 + 1, f_idx * 10 + 1))
        f_sheet = render_faction_master_sheet(
            f_idx, f_key, cids, cards, anime_cutouts, chibi_idles, fonts
        )
        f_fname = f"{f_idx:02d}_{f_key}_master_sheet.jpg"
        f_sheet.save(FACTION_DIR / f_fname, "JPEG", quality=92, optimize=True)
        fac_label, fac_hex, _ = FACTION_META[f_key]
        faction_sheet_meta.append(
            {
                "index": f_idx,
                "faction": f_key,
                "label": fac_label,
                "color": fac_hex,
                "startId": cids[0],
                "endId": cids[-1],
                "sheetUrl": f"/anime-character-sheets/factions/{f_fname}",
            }
        )
    print("Rendered all 11 Faction 10-Character Master Sheets (2400x1420)!")

    # 9. Render Grand 110-Character Studio Overview Poster (10 cols x 11 rows of sheets)
    poster_w = 10 * 244 + 36
    poster_h = 11 * 154 + 110
    poster = Image.new("RGB", (poster_w, poster_h), (20, 20, 25))
    p_draw = ImageDraw.Draw(poster)
    p_draw.text(
        (28, 24),
        "SNSHERO ANIMATION PROJECT — 『카단의 여정』 110인 전체 캐릭터 설정 시트 총람 (NO.001 – NO.110)",
        font=fonts["fac_title"],
        fill=(255, 255, 255),
    )
    p_draw.text(
        (30, 64),
        "11 Factions × 10 Characters = 110 Official Studio Character Model Sheets (Main Anime Design + 3등신 Cute SD Reference)",
        font=fonts["small"],
        fill=(185, 190, 205),
    )
    for idx, thumb in enumerate(sheet_thumbs_for_poster):
        c = idx % 10
        r = idx // 10
        poster.paste(thumb, (20 + c * 244, 100 + r * 154))
    poster.save(OUT_ROOT / "all_110_cast_poster.jpg", "JPEG", quality=90, optimize=True)
    print("Saved all_110_cast_poster.jpg!")

    # 10. Save manifest.json
    manifest_data = {
        "project": "SNSHero — Kadan's Journey (카단의 여정) 110 Animation Character Sheets",
        "totalCharacters": 110,
        "totalFactions": 11,
        "overviewPosterUrl": "/anime-character-sheets/all_110_cast_poster.jpg",
        "factions": faction_sheet_meta,
        "characters": manifest_entries,
    }
    (OUT_ROOT / "manifest.json").write_text(
        json.dumps(manifest_data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("Saved public/anime-character-sheets/manifest.json successfully!")


if __name__ == "__main__":
    main()
