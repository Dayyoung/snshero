import os
import sys
sys.path.insert(0, ".")
import glob
import re
import json
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageEnhance

WIDTH = 768
HEIGHT = 432
BRAIN_ROOT = "/Users/dayyoung/.gemini/antigravity/brain"


def _dilate_bool(mask: np.ndarray, radius: int = 1) -> np.ndarray:
    if radius <= 0:
        return mask.copy()
    h, w = mask.shape
    padded = np.pad(mask, radius, mode="constant", constant_values=False)
    out = np.zeros_like(mask, dtype=bool)
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            if dy * dy + dx * dx <= (radius + 0.5) ** 2:
                out |= padded[radius + dy : radius + dy + h, radius + dx : radius + dx + w]
    return out


def _get_connected_component(mask: np.ndarray, seed_y: int, seed_x: int) -> np.ndarray:
    h, w = mask.shape
    comp = np.zeros((h, w), dtype=bool)
    sy, sx = max(0, min(h - 1, seed_y)), max(0, min(w - 1, seed_x))
    if not mask[sy, sx]:
        found = False
        for r in range(1, 12):
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    ny, nx = sy + dy, sx + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx]:
                        sy, sx = ny, nx
                        found = True
                        break
                if found:
                    break
            if found:
                break
        if not found:
            return comp
    q = deque([(sy, sx)])
    comp[sy, sx] = True
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not comp[ny, nx]:
                comp[ny, nx] = True
                q.append((ny, nx))
    return comp


def _get_eye_clusters(mask: np.ndarray, min_size: int = 3, max_size: int = 600):
    h, w = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    clusters = []
    ys, xs = np.where(mask)
    for sy, sx in zip(ys, xs):
        if visited[sy, sx]:
            continue
        q = deque([(sy, sx)])
        visited[sy, sx] = True
        cy, cx = [sy], [sx]
        while q:
            y, x = q.popleft()
            for ny in range(max(0, y - 2), min(h, y + 3)):
                for nx in range(max(0, x - 3), min(w, x + 4)):
                    if mask[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        q.append((ny, nx))
                        cy.append(ny)
                        cx.append(nx)
        if min_size <= len(cy) <= max_size:
            cy_a, cx_a = np.array(cy), np.array(cx)
            if (cx_a.max() - cx_a.min()) <= 55 and (cy_a.max() - cy_a.min()) <= 45:
                clusters.append((cy_a, cx_a))
    return clusters


def remove_kadan_forehead_scar_pil(im: Image.Image) -> tuple[Image.Image, int]:
    """
    Detects Kadan's face via his signature cyan-sapphire eyes, warm peach-ivory face skin,
    and dark/chestnut hair crown, and seamlessly removes any reddish-maroon forehead scar
    while preserving eyebrows and hairline outlines.
    """
    orig_mode = im.mode
    rgb = im.convert("RGB")
    im_arr = np.array(rgb, dtype=np.float32)
    h, w, _ = im_arr.shape
    R, G, B = im_arr[:, :, 0], im_arr[:, :, 1], im_arr[:, :, 2]

    skin = (R > 195) & (G > 140) & (B > 90) & (R > G) & (G > B) & ((R - G) < 65) & ((G - B) > 20)
    blood_dark_scar = (R > 42) & (G <= 6) & (B <= 3) & ((R - G) >= 38)
    dark = (R < 70) & (G < 60) & (B < 65) & (~blood_dark_scar)
    cyan_raw = (B > R + 20) & (G > R + 10) & (B > 100)
    cyan = cyan_raw & _dilate_bool(skin, 5) & _dilate_bool(dark, 3)
    if cyan.sum() < 5:
        return im, 0

    clusters = _get_eye_clusters(cyan, min_size=3, max_size=600)
    candidates = []
    n = len(clusters)
    for i in range(n):
        for j in range(i + 1, n):
            cy1, cx1 = clusters[i]
            cy2, cx2 = clusters[j]
            x1, y1 = float(np.median(cx1)), float(np.median(cy1))
            x2, y2 = float(np.median(cx2)), float(np.median(cy2))
            if x1 > x2:
                x1, y1, x2, y2 = x2, y2, x1, y1
                cy1, cx1, cy2, cx2 = cy2, cx2, cy1, cx1
            ed = x2 - x1
            if not (13.5 <= ed <= 90.0):
                continue
            if abs(y1 - y2) > 0.32 * ed:
                continue
            ratio = len(cy1) / max(1.0, float(len(cy2)))
            if not (0.15 <= ratio <= 6.5):
                continue

            xm = int(round(0.5 * (x1 + x2)))
            ym = int(round(0.5 * (y1 + y2)))
            if ym > int(0.72 * h) or ym < int(0.08 * h):
                continue
            # Tight vertical band (0.22 * ed) so cyan-tinted eyebrows above the eyes are excluded
            all_eye_mask = (
                (np.abs(np.arange(h)[:, None] - ym) <= max(6.0, 0.22 * ed))
                & (np.abs(np.arange(w)[None, :] - xm) <= 0.85 * ed)
                & cyan
            )
            ay, ax = np.where(all_eye_mask)
            l_m = ax < xm
            r_m = ax >= xm
            if l_m.sum() < 3 or r_m.sum() < 3:
                continue
            xL = float(np.median(ax[l_m]))
            yL = float(np.median(ay[l_m]))
            xR = float(np.median(ax[r_m]))
            yR = float(np.median(ay[r_m]))
            ed = xR - xL
            if ed < 13.5:
                continue
            xm = int(round(0.5 * (xL + xR)))
            ym = int(round(0.5 * (yL + yR)))
            etL = float(np.percentile(ay[l_m], 10))
            etR = float(np.percentile(ay[r_m], 10))
            e_outer_L = float(np.percentile(ax[l_m], 2))
            e_outer_R = float(np.percentile(ax[r_m], 98))
            all_eye_px = int(all_eye_mask.sum())
            et_mid = 0.5 * (etL + etR)

            ck_y0 = min(h, int(round(ym + 0.12 * ed)))
            ck_y1 = min(h, int(round(ym + 0.75 * ed)))
            ck_x0 = max(0, int(round(xL - 0.10 * ed)))
            ck_x1 = min(w, int(round(xR + 0.10 * ed)))
            if ck_y1 <= ck_y0 + 3 or ck_x1 <= ck_x0 + 4:
                continue
            if skin[ck_y0:ck_y1, ck_x0:ck_x1].mean() < 0.30:
                continue
            nb_y0 = max(0, ym - int(round(0.15 * ed)))
            nb_y1 = min(h, ym + int(round(0.25 * ed)))
            nb_x0 = max(0, int(round(xL + 0.28 * ed)))
            nb_x1 = min(w, max(nb_x0 + 2, int(round(xR - 0.28 * ed))))
            if skin[nb_y0:nb_y1, nb_x0:nb_x1].mean() < 0.34:
                continue

            fh_y0 = max(0, int(round(et_mid - 1.15 * ed)))
            fh_y1 = max(fh_y0 + 4, int(round(min(etL, etR) - 0.26 * ed)))
            fh_x0 = max(0, int(round(e_outer_L - 0.25 * ed)))
            fh_x1 = min(w, int(round(e_outer_R + 0.25 * ed)))
            f_skin = skin[fh_y0:fh_y1, fh_x0:fh_x1]
            if f_skin.mean() < 0.18 or f_skin.sum() < 25:
                continue
            if cyan_raw[fh_y0:fh_y1, fh_x0:fh_x1].mean() > 0.06 and cyan_raw[ck_y0:ck_y1, ck_x0:ck_x1].mean() > 0.08:
                continue

            sy, sx = np.where(f_skin)
            fh_top_abs = fh_y0 + int(np.percentile(sy, 3))
            cr_y0 = max(0, int(round(fh_top_abs - 0.65 * ed)))
            cr_y1 = max(cr_y0 + 3, fh_top_abs + 2)
            hair_mask = (
                (R[cr_y0:cr_y1, fh_x0:fh_x1] < 160)
                & (G[cr_y0:cr_y1, fh_x0:fh_x1] < 80)
                & (B[cr_y0:cr_y1, fh_x0:fh_x1] < 80)
            )
            if hair_mask.mean() < 0.28:
                continue

            fR = R[fh_y0:fh_y1, fh_x0:fh_x1]
            fG = G[fh_y0:fh_y1, fh_x0:fh_x1]
            fB = B[fh_y0:fh_y1, fh_x0:fh_x1]
            f_dark = (fR < 65) & (fG < 52) & (fB < 55) & ((fR - fG) < 30)
            maroon = (fR > 75) & ((fR - fG) > 45) & (fG < 80)
            s1_det = _dilate_bool(f_skin, 1) & (~f_dark)
            s2_det = _dilate_bool(s1_det, 1) & (~f_dark)
            m_mask = maroon & s2_det
            top_rel = int(np.percentile(sy, 5)) + 2
            m_mask[:top_rel, :] = False
            mid_rel = max(1, min(fh_x1 - fh_x0 - 1, xm - fh_x0))
            f_left_skin = int(f_skin[:, :mid_rel].sum())
            f_right_skin = int(f_skin[:, mid_rel:].sum())
            if min(f_left_skin, f_right_skin) < 12 or min(f_left_skin, f_right_skin) < 0.12 * max(f_left_skin, f_right_skin):
                continue
            m_left = int(m_mask[:, :mid_rel].sum())
            m_right = int(m_mask[:, mid_rel:].sum())
            maroon_touch = m_left + m_right
            # Forehead scar is strongly asymmetric (on one side of the forehead)
            asym_ratio = max(m_left, m_right) / max(1.0, float(min(m_left, m_right)))
            if maroon_touch >= 14 and (maroon_touch / max(10.0, ed)) >= 0.68 and asym_ratio >= 2.8:
                score = int(maroon_touch) * 10 + int(all_eye_px) + min(len(cy1), len(cy2)) * 6
                candidates.append((score, xL, yL, xR, yR, ed, etL, etR, e_outer_L, e_outer_R, m_right >= m_left))

    candidates.sort(key=lambda x: -x[0])
    processed_centers = []
    total_repaired = 0

    for score, xL, yL, xR, yR, eye_dist, eye_top_L, eye_top_R, eye_outer_L, eye_outer_R, clean_is_left in candidates:
        xm_int = int(round(0.5 * (xL + xR)))
        ym_int = int(round(0.5 * (yL + yR)))
        if any(abs(xm_int - px) < eye_dist * 1.2 and abs(ym_int - py) < eye_dist * 1.2 for px, py in processed_centers):
            continue
        processed_centers.append((xm_int, ym_int))

        eye_top_mid = 0.5 * (eye_top_L + eye_top_R)
        fh_y0 = max(0, int(round(eye_top_mid - max(54.0, 1.18 * eye_dist))))
        fh_y1 = max(fh_y0 + 4, int(round(max(eye_top_L, eye_top_R) - 0.14 * eye_dist)))
        fh_x0 = max(0, int(round(eye_outer_L - 0.42 * eye_dist)))
        fh_x1 = min(w, int(round(eye_outer_R + 0.48 * eye_dist)))

        strict_skin = (R > 200) & (G > 148) & (B > 95) & (R > G) & (G > B) & ((R - G) < 62) & ((G - B) > 24)
        face_comp = _get_connected_component(strict_skin & (~dark), int(round(eye_top_mid - 0.25 * eye_dist)), xm_int)
        if face_comp.sum() < 40:
            face_comp = strict_skin

        left_skin_cnt = face_comp[fh_y0:fh_y1, fh_x0:xm_int].sum()
        right_skin_cnt = face_comp[fh_y0:fh_y1, xm_int:fh_x1].sum()
        if min(left_skin_cnt, right_skin_cnt) < 12:
            continue

        if clean_is_left:
            clean_patch = face_comp[fh_y0:fh_y1, fh_x0:xm_int]
            clean_rgb_vals = im_arr[fh_y0:fh_y1, fh_x0:xm_int][clean_patch]
        else:
            clean_patch = face_comp[fh_y0:fh_y1, xm_int:fh_x1]
            clean_rgb_vals = im_arr[fh_y0:fh_y1, xm_int:fh_x1][clean_patch]
        if len(clean_rgb_vals) < 15:
            continue

        med_R, med_G, med_B = np.median(clean_rgb_vals, axis=0)
        med_RG = med_R - med_G
        is_near_med = (
            (np.abs(R - med_R) < 25)
            & (np.abs(G - med_G) < 23)
            & (np.abs(B - med_B) < 28)
            & (np.abs((R - G) - med_RG) < 16)
        )
        is_lit_skin = (
            (R >= med_R - 6)
            & (G >= med_G - 6)
            & (B >= med_B - 6)
            & ((R - G) <= med_RG + 12)
            & ((R - G) >= 12)
        )
        true_fh_skin = face_comp & (is_near_med | is_lit_skin)

        cs_y, cs_x = np.where(clean_patch)
        fh_fc_y, fh_fc_x = np.where(face_comp[fh_y0:fh_y1, fh_x0:fh_x1])
        fc_top_y = (fh_y0 + int(np.percentile(fh_fc_y, 2))) if len(fh_fc_y) > 10 else (fh_y0 + int(np.percentile(cs_y, 2)))
        fh_top_abs = fc_top_y
        scar_top_limit = max(0, fc_top_y - int(round(0.32 * eye_dist)))

        if clean_is_left:
            fc_max_x = (fh_x0 + int(np.percentile(fh_fc_x, 99))) if len(fh_fc_x) > 10 else int(round(eye_outer_R))
            scar_side_limit = max(fc_max_x, int(round(eye_outer_R + 0.42 * eye_dist)))
        else:
            fc_min_x = (fh_x0 + int(np.percentile(fh_fc_x, 1))) if len(fh_fc_x) > 10 else int(round(eye_outer_L))
            scar_side_limit = min(fc_min_x, int(round(eye_outer_L - 0.42 * eye_dist)))

        scar_color_main = (
            ((R > 65) & ((R - G) > 34) & (G < 130) & (R > G * 1.5))
            | ((R > 145) & ((R - G) > 48) & (G < 195) & (np.abs(G - B) < 36))
        )
        scar_color = scar_color_main | blood_dark_scar
        fh_box_mask = np.zeros((h, w), dtype=bool)
        seed_box_mask = np.zeros((h, w), dtype=bool)
        seed_y1 = max(fh_top_abs + 4, int(round(min(eye_top_L, eye_top_R) - 0.38 * eye_dist)))
        upper_split_y = max(fh_top_abs + 4, int(round(min(eye_top_L, eye_top_R) - 0.52 * eye_dist)))
        cross_pad_upper = max(6, int(round(0.32 * eye_dist)))
        cross_pad_lower = 4
        if clean_is_left:
            fh_box_mask[scar_top_limit:upper_split_y, max(0, xm_int - cross_pad_upper) : min(w, scar_side_limit + 4)] = True
            fh_box_mask[upper_split_y:fh_y1, max(0, xm_int - cross_pad_lower) : min(w, scar_side_limit + 4)] = True
            seed_box_mask[fh_top_abs:upper_split_y, max(0, xm_int - cross_pad_upper) : min(w, scar_side_limit + 4)] = True
            seed_box_mask[upper_split_y:seed_y1, max(0, xm_int - cross_pad_lower) : min(w, scar_side_limit + 4)] = True
        else:
            fh_box_mask[scar_top_limit:upper_split_y, max(0, scar_side_limit - 3) : min(w, xm_int + cross_pad_upper + 1)] = True
            fh_box_mask[upper_split_y:fh_y1, max(0, scar_side_limit - 3) : min(w, xm_int + cross_pad_lower + 1)] = True
            seed_box_mask[fh_top_abs:upper_split_y, max(0, scar_side_limit - 3) : min(w, xm_int + cross_pad_upper + 1)] = True
            seed_box_mask[upper_split_y:seed_y1, max(0, scar_side_limit - 3) : min(w, xm_int + cross_pad_lower + 1)] = True

        sky_or_bg = (B > R + 15) | ((G > R + 10) & (B > 120))
        outer_hairline = _dilate_bool(sky_or_bg, 3) & dark

        step1_skin = _dilate_bool(face_comp, 1) & (~dark)
        step2_skin = _dilate_bool(step1_skin, 1) & (~dark)
        scar_seeds = scar_color & seed_box_mask & step2_skin & (~_dilate_bool(sky_or_bg, 2))
        if scar_seeds.sum() < 5:
            scar_seeds = scar_color & seed_box_mask & _dilate_bool(face_comp, 3) & (~_dilate_bool(sky_or_bg, 2))
        above_fc_mask = np.arange(h)[:, None] < fc_top_y
        above_hairline_mask = np.zeros((h, w), dtype=bool)
        min_clean_col_px = max(15, int(round(0.45 * max(10, fh_y1 - fc_top_y))))
        for cx in range(fh_x0, fh_x1):
            col_skin_ys = np.where(true_fh_skin[fh_y0:fh_y1, cx])[0] + fh_y0
            if len(col_skin_ys) >= min_clean_col_px:
                y_st = int(col_skin_ys.min())
                if dark[max(0, y_st - 4) : min(h, y_st + 2), cx].any():
                    above_hairline_mask[: y_st + 1, cx] = True

        scar_traversable = (
            (scar_color & (~(above_fc_mask & (R < 78))))
            & fh_box_mask
            & (~dark)
            & (~above_hairline_mask)
            & (~_dilate_bool(sky_or_bg, 2))
            & _dilate_bool(face_comp, int(max(18, 0.85 * eye_dist)))
        )
        scar_comp = scar_seeds.copy()
        for _ in range(48):
            scar_comp = (_dilate_bool(scar_comp, 1) & scar_traversable) | scar_comp
        if scar_comp.any():
            fh_top_abs = max(scar_top_limit, min(fc_top_y, int(np.where(scar_comp)[0].min()) - 1))
        inner_scar_outline = (
            (dark | _dilate_bool(scar_comp, 3))
            & _dilate_bool(scar_comp, 3)
            & _dilate_bool(face_comp, 2)
            & (~outer_hairline)
            & fh_box_mask
        )
        scar_with_border = (
            (_dilate_bool(scar_comp, 2) & fh_box_mask & (~outer_hairline) & (~sky_or_bg))
            | inner_scar_outline
            | scar_comp
        )

        fh_h = max(8.0, float(fh_y1 - fh_top_abs))
        orig_arr = im_arr.copy()
        repaired_mask = np.zeros((h, w), dtype=bool)

        for y in range(fh_top_abs, fh_y1):
            ny = (y - fh_top_abs) / fh_h
            arch_factor = min(1.0, 0.85 + 0.35 * (ny ** 0.55))
            if clean_is_left:
                row_scar_xs = np.where(scar_with_border[y, fh_x0:fh_x1])[0] + fh_x0
                clean_limit_x = int(row_scar_xs.min()) if len(row_scar_xs) > 0 else (xm_int + 8)
                row_clean = true_fh_skin[y, fh_x0 : max(fh_x0 + 4, clean_limit_x)]
                if row_clean.sum() < 2:
                    row_clean_rgb = np.array([med_R, med_G, med_B])
                    x_outer_clean = xm_int - int(0.4 * eye_dist)
                else:
                    sx_idxs = np.where(row_clean)[0] + fh_x0
                    x_outer_clean = int(np.percentile(sx_idxs, 3))
                    adj_idxs = sx_idxs[-min(14, len(sx_idxs)) :]
                    row_clean_rgb = orig_arr[y, adj_idxs].mean(axis=0)
                max_dx = int(round((scar_side_limit - xm_int) * arch_factor)) + 4
            else:
                row_scar_xs = np.where(scar_with_border[y, fh_x0:fh_x1])[0] + fh_x0
                clean_limit_x = (int(row_scar_xs.max()) + 1) if len(row_scar_xs) > 0 else (xm_int - 7)
                row_clean = true_fh_skin[y, min(fh_x1 - 4, clean_limit_x) : fh_x1]
                if row_clean.sum() < 2:
                    row_clean_rgb = np.array([med_R, med_G, med_B])
                    x_outer_clean = xm_int + int(0.4 * eye_dist)
                else:
                    sx_idxs = np.where(row_clean)[0] + min(fh_x1 - 4, clean_limit_x)
                    x_outer_clean = int(np.percentile(sx_idxs, 97))
                    adj_idxs = sx_idxs[: min(14, len(sx_idxs))]
                    row_clean_rgb = orig_arr[y, adj_idxs].mean(axis=0)
                max_dx = int(round((xm_int - scar_side_limit) * arch_factor)) + 4

            if max_dx < 3:
                continue

            start_dx = -cross_pad_upper if y < upper_split_y else -cross_pad_lower
            for dx in range(start_dx, max_dx + 1):
                tx = (xm_int + dx) if clean_is_left else (xm_int - dx)
                ty = y
                if not (0 <= tx < w and 0 <= ty < h):
                    continue
                if true_fh_skin[ty, tx]:
                    continue
                if not scar_with_border[ty, tx]:
                    # Only fill a tiny enclosed gap (<= 5px) INSIDE the scar itself
                    step_dir = 1 if clean_is_left else -1
                    has_scar_left = any(
                        0 <= tx - step_dir * k_l < w and scar_with_border[ty, tx - step_dir * k_l]
                        for k_l in range(1, 5)
                    )
                    has_scar_right = any(
                        0 <= tx + step_dir * k_r < w and scar_with_border[ty, tx + step_dir * k_r]
                        for k_r in range(1, 6)
                    )
                    if not (has_scar_left and has_scar_right):
                        continue

                tR, tG, tB = R[ty, tx], G[ty, tx], B[ty, tx]
                eye_top_at_tx = eye_top_L + (eye_top_R - eye_top_L) * ((tx - xL) / max(1.0, eye_dist))
                dist_above_eye = eye_top_at_tx - ty
                if dist_above_eye < 2.0:
                    continue
                if dist_above_eye < max(6.5, 0.34 * eye_dist):
                    is_maroon_scar = (tR > 75) and ((tR - tG) > 38) and (tG < 110)
                    if not is_maroon_scar:
                        continue

                frac = max(0.0, min(1.0, abs(dx) / max(1.0, float(max_dx))))
                sx_m = (
                    int(round(xm_int - frac * (xm_int - x_outer_clean)))
                    if clean_is_left
                    else int(round(xm_int + frac * (x_outer_clean - xm_int)))
                )
                sx_m = max(0, min(w - 1, sx_m))
                mirror_rgb = orig_arr[y, sx_m] if true_fh_skin[y, sx_m] else row_clean_rgb
                im_arr[ty, tx] = 0.25 * mirror_rgb + 0.75 * row_clean_rgb
                repaired_mask[ty, tx] = True
                total_repaired += 1

        sy_rem, sx_rem = np.where(scar_with_border & (~repaired_mask))
        for ty, tx in zip(sy_rem, sx_rem):
            eye_top_at_tx = eye_top_L + (eye_top_R - eye_top_L) * ((tx - xL) / max(1.0, eye_dist))
            if (eye_top_at_tx - ty) >= max(4.5, 0.22 * eye_dist):
                im_arr[ty, tx] = np.array([med_R, med_G, med_B])
                repaired_mask[ty, tx] = True
                total_repaired += 1

        good_fh = true_fh_skin | repaired_mask
        near_repaired = _dilate_bool(repaired_mask, 1)
        for _ in range(3):
            for yy in range(fh_top_abs + 1, fh_y1 - 1):
                for xx in range(fh_x0 + 1, fh_x1 - 1):
                    if not good_fh[yy, xx] and near_repaired[yy, xx]:
                        nb_good = good_fh[yy - 1 : yy + 2, xx - 1 : xx + 2]
                        if nb_good.sum() >= 5:
                            im_arr[yy, xx] = im_arr[yy - 1 : yy + 2, xx - 1 : xx + 2][nb_good].mean(axis=0)
                            good_fh[yy, xx] = True
                            total_repaired += 1

    if total_repaired > 0:
        out_rgb = Image.fromarray(np.clip(im_arr, 0, 255).astype(np.uint8))
        return out_rgb.convert(orig_mode), total_repaired
    return im, 0

def auto_crop_letterbox(im: Image.Image) -> Image.Image:
    """Removes solid black top/bottom letterbox bars if present."""
    rgb = im.convert("RGB")
    arr = np.asarray(rgb, dtype=np.float32)
    row_max = arr.max(axis=(1, 2))
    non_black = np.where(row_max > 16.0)[0]
    if len(non_black) > int(im.height * 0.75):
        top = int(non_black[0])
        bot = int(non_black[-1]) + 1
        if top > 4 or (im.height - bot) > 4:
            return im.crop((0, top, im.width, bot))
    return im

def apply_demon_slayer_vibrant_color_grade(im: Image.Image) -> Image.Image:
    """
    Authentic Demon Slayer: Kimetsu no Yaiba (ufotable & Koyoharu Gotouge original art) vivid color grading:
    1. Auto-crops any top/bottom black letterbox bars.
    2. Zero milky grey fog: f(0) = 0 (black sumi-e ink outlines and true blacks stay deep black).
    3. Lifts dark midtones & shadows smoothly while infusing rich Demon Slayer color saturation
       (vibrant turquoise/indigo, warm golden-amber, rich crimson, luminous emerald) so dark scenes
       become vivid and clearly visible without washing out black ink lines.
    """
    im = auto_crop_letterbox(im)
    rgb = im.convert("RGB")
    arr = np.asarray(rgb, dtype=np.float32) / 255.0
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    mean_lum = float(lum.mean()) * 255.0

    if mean_lum < 105.0:
        target_norm = 98.0 / 255.0
        cur_norm = max(0.12, mean_lum / 255.0)
        gamma = float(np.clip(np.log(target_norm) / np.log(cur_norm), 0.48, 0.85))

        # Pure gamma curve (0 stays 0) + black-toe anchor so ink lines (< 0.07) remain deep black
        lifted = np.power(np.clip(arr, 0.0, 1.0), gamma)
        toe_weight = np.clip((lum - 0.025) / 0.075, 0.0, 1.0)[:, :, None]
        arr = arr * (1.0 - toe_weight) + lifted * toe_weight

        # Infuse Demon Slayer rich color warmth in midtones and vibrant indigo-turquoise depth
        mid_mask = (4.0 * lum * (1.0 - lum))[:, :, None]
        arr[:, :, 0] = np.clip(arr[:, :, 0] + 0.035 * mid_mask[:, :, 0], 0.0, 1.0)
        arr[:, :, 1] = np.clip(arr[:, :, 1] + 0.020 * mid_mask[:, :, 0], 0.0, 1.0)
        arr[:, :, 2] = np.clip(arr[:, :, 2] + 0.030 * mid_mask[:, :, 0], 0.0, 1.0)

    out_im = Image.fromarray((np.clip(arr, 0.0, 1.0) * 255.0).astype(np.uint8))
    sat_factor = 1.48 if mean_lum < 60.0 else (1.34 if mean_lum < 90.0 else 1.18)
    out_im = ImageEnhance.Color(out_im).enhance(sat_factor)
    out_im = ImageEnhance.Contrast(out_im).enhance(1.12)
    return out_im.convert(im.mode)

def embed_hidden_bottom_ai_marker(image: Image.Image, card_id: int, scene_idx: int):
    """
    Encodes a human-invisible, AI-only steganographic marker along a 4x1 pixel strip
    at the very bottom-right edge of the image (x = WIDTH-4..WIDTH-1, y = HEIGHT-1).
    - Blends at 2% opacity and encodes speaker presence + card_id in the least significant
      color delta so it is 100% invisible to human viewers while machine/AI-readable.
    """
    pixels = image.load()
    if pixels is None:
        return (WIDTH - 2, HEIGHT - 1)

    y = HEIGHT - 1  # Bottom-most row (y = 431)
    # 4-pixel micro-strip at bottom-right corner: x = 764, 765, 766, 767
    marker_x_start = WIDTH - 4
    safe_card_id = max(0, min(255, int(card_id or 0)))

    for offset in range(4):
        x = marker_x_start + offset
        r, g, b, a = pixels[x, y]
        # Subtle +2 red nudge blended into existing pixel (imperceptible to human eye, <0.8% delta)
        r_new = min(255, max(0, (r & 0xFE) | 0x01))
        if offset == 0:
            # Encode low bit of card_id in green/blue LSBs
            g_new = (g & 0xFE) | ((safe_card_id >> 1) & 0x01)
            b_new = (b & 0xFE) | (safe_card_id & 0x01)
        elif offset == 1:
            g_new = (g & 0xFE) | ((safe_card_id >> 3) & 0x01)
            b_new = (b & 0xFE) | ((safe_card_id >> 2) & 0x01)
        else:
            g_new = g
            b_new = b
        pixels[x, y] = (r_new, g_new, b_new, a)

    return (marker_x_start, y)

def get_manifest_dialogues(ep_num: int):
    manifest_path = "src/content/webtoonEpisodeManifest.json"
    if not os.path.exists(manifest_path):
        return {}
    with open(manifest_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    ep_data = data.get(str(ep_num))
    if not ep_data:
        return {}

    dialogue_map = {}
    for img in ep_data.get("images", []):
        idx = img["index"]
        dlgs = [d for d in img.get("dialogues", []) if d.get("speakerKo") not in ("내레이션", "Narration", None, "")]
        if dlgs:
            dialogue_map[idx] = {
                "speaker": dlgs[0]["speakerKo"],
                "speakerEn": dlgs[0].get("speakerEn", ""),
                "cardId": dlgs[0].get("characterCardId", 0),
                "text": dlgs[0]["textKo"]
            }
    return dialogue_map

def find_generated_scene_images(ep_num: int):
    # Search across all conversation brain directories for ep{ep:02d}_scene_{idx}_*.jpg
    pattern = os.path.join(BRAIN_ROOT, "*", f"ep{ep_num:02d}_scene_*.jpg")
    files = glob.glob(pattern)
    scene_map = {}
    for f in files:
        fname = os.path.basename(f)
        m = re.match(rf"ep{ep_num:02d}_scene_(\d+)", fname)
        if m:
            s_idx = int(m.group(1))
            mtime = os.path.getmtime(f)
            if s_idx not in scene_map or mtime > scene_map[s_idx][1]:
                scene_map[s_idx] = (f, mtime)
    return scene_map

def process_episode_images(ep_num: int, force: bool = False):
    out_dir = f"public/images/webtoon/episode_{ep_num:02d}"
    os.makedirs(out_dir, exist_ok=True)

    dialogue_map = get_manifest_dialogues(ep_num)
    scene_map = find_generated_scene_images(ep_num)

    print(f"--- EPISODE {ep_num:02d} ---")
    print(f"Found generated images for {len(scene_map)} scenes. (Dialogue scenes with hidden bottom AI marker: {len(dialogue_map)})")

    processed = 0
    for s_idx, (src_path, _) in sorted(scene_map.items()):
        dst_path = os.path.join(out_dir, f"scene_{s_idx:02d}.webp")

        # Skip if already exists and newer (unless force=True)
        if not force and os.path.exists(dst_path) and os.path.getmtime(dst_path) >= os.path.getmtime(src_path):
            continue

        im = Image.open(src_path).convert("RGBA")
        if ep_num >= 20:
            im = apply_demon_slayer_vibrant_color_grade(im)
        im_resized = im.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
        if ep_num >= 20:
            im_resized, cleaned_px = remove_kadan_forehead_scar_pil(im_resized)
            if cleaned_px > 0:
                print(f"[EP{ep_num:02d}] Scene {s_idx:02d}: Removed Kadan forehead scar ({cleaned_px} px restored)")

        metadata_comment = {
            "episode": ep_num,
            "scene": f"scene_{s_idx:02d}",
            "isDialogue": s_idx in dialogue_map
        }

        if s_idx in dialogue_map:
            dlg = dialogue_map[s_idx]
            mx, my = embed_hidden_bottom_ai_marker(im_resized, dlg.get("cardId", 0), s_idx)

            metadata_comment.update({
                "speaker": dlg["speaker"],
                "speakerEn": dlg.get("speakerEn", ""),
                "cardId": dlg.get("cardId", 0),
                "dialogue": dlg["text"],
                "aiMarker": {
                    "type": "hidden_bottom_stego_strip",
                    "visibleToHuman": False,
                    "x": mx,
                    "y": my,
                    "width": 4,
                    "height": 1
                }
            })
            print(f"[EP{ep_num:02d}] Scene {s_idx:02d} ({dlg['speaker']}): Embedded hidden bottom AI marker at ({mx}, {my})")
        else:
            print(f"[EP{ep_num:02d}] Scene {s_idx:02d}: Narration/Ensemble (0 markers)")

        final_rgb = im_resized.convert("RGB")
        # Save as high-performance WebP with embedded JSON metadata in EXIF/XMP comment
        exif = final_rgb.getexif()
        # 0x9286 is UserComment / 0x010E is ImageDescription for AI metadata readers
        exif[0x010E] = json.dumps(metadata_comment, ensure_ascii=False)
        final_rgb.save(
            dst_path,
            "WEBP",
            quality=82,
            method=6,
            exif=exif.tobytes()
        )
        processed += 1

    print(f"[EP{ep_num:02d}] Processed and updated: {processed} scenes.")
    return processed

if __name__ == "__main__":
    force_run = "--force" in sys.argv
    args = [a for a in sys.argv[1:] if a != "--force"]

    if len(args) > 0:
        if args[0] == "all":
            total = sum(process_episode_images(ep, force=force_run) for ep in range(1, 41))
            print(f"Total processed across all episodes: {total}")
        else:
            ep = int(args[0])
            process_episode_images(ep, force=force_run)
    else:
        process_episode_images(3, force=force_run)
