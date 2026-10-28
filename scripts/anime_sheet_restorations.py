from __future__ import annotations

import math
from pathlib import Path
from typing import Callable

import numpy as np
from PIL import Image, ImageDraw


def inpaint_symmetric_gaps(
    arr: np.ndarray,
    cx: int,
    y_min: int = 0,
    y_max: int | None = None,
    side: str = "both",
    min_dist: int = 0,
) -> np.ndarray:
    """
    Fills ONLY transparent (erased/occluded) pixels from the mirrored coordinate (2*cx - x),
    leaving 100% of existing opaque character pixels untouched (zero vertical seam!).
    """
    h, w, _ = arr.shape
    if y_max is None:
        y_max = h
    out = arr.copy()
    for y in range(max(0, y_min), min(h, y_max)):
        for x in range(w):
            if abs(x - cx) < min_dist:
                continue
            if side == "left" and x >= cx:
                continue
            if side == "right" and x <= cx:
                continue
            if out[y, x, 3] < 35:
                mx = 2 * cx - x
                if 0 <= mx < w and arr[y, mx, 3] > 80:
                    out[y, x] = arr[y, mx]
    return out


def build_kadan_with_back_eye_shield(kadan_cutout: Image.Image) -> Image.Image:
    """
    Renders Kadan (#041) with the canonical Snow-Emblem Shield ('눈[SNOW] 문양의 방패')
    slung diagonally on his upper back so the frost-rimmed shield and the glowing
    ice-cyan & snow-white 6-pointed Snowflake Crest (설원 눈 결정 문양) are 100% visible
    beside his left shoulder/deltoid.
    """
    kw, kh = kadan_cutout.size
    pad_l, pad_r, pad_t = 28, 114, 16
    cw = kw + pad_l + pad_r
    ch = kh + pad_t

    ss = 4
    sh_hi = Image.new("RGBA", (cw * ss, ch * ss), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sh_hi)

    cx = (pad_l + int(kw * 0.74)) * ss
    cy = (pad_t + int(kh * 0.275)) * ss
    rx = int(134 * ss)
    ry = int(154 * ss)
    ang = math.radians(20.0)
    ca, sa = math.cos(ang), math.sin(ang)

    def rot_pt(px: float, py: float) -> tuple[float, float]:
        return (cx + px * ca - py * sa, cy + px * sa + py * ca)

    def shield_poly(scale_x: float, scale_y: float, n_pts: int = 80) -> list[tuple[float, float]]:
        pts = []
        for i in range(n_pts):
            t = i / float(n_pts)
            theta = t * 2.0 * math.pi
            lx = math.sin(theta) * rx * scale_x
            ly = -math.cos(theta) * ry * scale_y
            if math.cos(theta) < 0:
                taper = 1.0 - 0.32 * ((-math.cos(theta)) ** 1.6)
                lx *= taper
            else:
                ly *= 0.88
            pts.append(rot_pt(lx, ly))
        return pts

    outer_rim = shield_poly(1.00, 1.00)
    hi_rim = shield_poly(0.96, 0.96)
    mid_rim = shield_poly(0.89, 0.89)
    inner_plate = shield_poly(0.82, 0.82)

    # Frost-silver outer rim + ice-blue metallic bevel + deep glacial navy plate
    draw.polygon(outer_rim, fill=(164, 186, 214, 255))
    draw.polygon(hi_rim, fill=(224, 240, 252, 255))
    draw.polygon(mid_rim, fill=(96, 138, 184, 255))
    draw.polygon(inner_plate, fill=(28, 44, 70, 255))

    # Diagonal glacial ice sheen across shield face
    sheen_pts = [
        rot_pt(-rx * 0.35, -ry * 0.72),
        rot_pt(rx * 0.35, -ry * 0.72),
        rot_pt(rx * 0.70, -ry * 0.05),
        rot_pt(0.0, ry * 0.38),
    ]
    draw.polygon(sheen_pts, fill=(42, 66, 102, 255))

    sheen_hi = [
        rot_pt(rx * 0.05, -ry * 0.68),
        rot_pt(rx * 0.28, -ry * 0.68),
        rot_pt(rx * 0.66, -ry * 0.14),
        rot_pt(rx * 0.44, ry * 0.04),
    ]
    draw.polygon(sheen_hi, fill=(56, 88, 132, 255))

    # Frost-crystal studs around the rim
    for deg in range(0, 360, 30):
        th = math.radians(deg)
        lx = math.sin(th) * rx * 0.925
        ly = -math.cos(th) * ry * 0.925
        if math.cos(th) < 0:
            lx *= 1.0 - 0.32 * ((-math.cos(th)) ** 1.6)
        else:
            ly *= 0.88
        rpx, rpy = rot_pt(lx, ly)
        rr = 3.8 * ss
        stud_pts = [
            (rpx, rpy - rr),
            (rpx + rr * 0.85, rpy),
            (rpx, rpy + rr),
            (rpx - rr * 0.85, rpy),
        ]
        draw.polygon(
            stud_pts,
            fill=(210, 244, 255, 255),
            outline=(22, 32, 48, 255),
            width=max(1, ss // 2),
        )

    # Center of the visible Snowflake Crest ('눈[SNOW] 결정 문양') on the shield face
    scx, scy = rot_pt(rx * 0.35, -ry * 0.13)
    sr = rx * 0.39  # Radius of the 6-pointed snowflake emblem

    def rot_snow(sx: float, sy: float) -> tuple[float, float]:
        return (scx + sx * ca - sy * sa, scy + sx * sa + sy * ca)

    # 1) Soft frost-aura halo behind the snowflake crest
    for halo_scale, halo_col in [
        (1.06, (48, 92, 138, 255)),
        (0.86, (62, 118, 172, 255)),
    ]:
        halo_pts = []
        for i in range(12):
            ang_i = math.radians(i * 30.0 - 90.0)
            rad_i = sr * halo_scale * (1.0 if i % 2 == 0 else 0.56)
            halo_pts.append(rot_snow(math.cos(ang_i) * rad_i, math.sin(ang_i) * rad_i))
        draw.polygon(halo_pts, fill=halo_col)

    # 2) Inner hexagonal ice-crystal ring connecting the 6 arms
    for ring_r, ring_w, ring_fill, ring_out in [
        (sr * 0.44, max(2, int(2.2 * ss)), (74, 158, 218, 255), (18, 30, 48, 255)),
        (sr * 0.34, max(2, int(1.6 * ss)), (34, 58, 92, 255), (180, 236, 255, 255)),
    ]:
        hex_pts = []
        for i in range(6):
            a6 = math.radians(i * 60.0 - 90.0)
            hex_pts.append(rot_snow(math.cos(a6) * ring_r, math.sin(a6) * ring_r))
        draw.polygon(hex_pts, fill=ring_fill, outline=ring_out, width=ring_w)

    # 3) 6 Intermediate secondary frost spikes (at 30, 90, 150, 210, 270, 330 deg)
    for i in range(6):
        a_sec = math.radians(i * 60.0 - 60.0)
        ux, uy = math.cos(a_sec), math.sin(a_sec)
        px, py = -uy, ux
        sec_len = sr * 0.62
        sec_w = sr * 0.075
        sec_pts = [
            rot_snow(ux * sr * 0.20 + px * sec_w, uy * sr * 0.20 + py * sec_w),
            rot_snow(ux * sec_len, uy * sec_len),
            rot_snow(ux * sr * 0.20 - px * sec_w, uy * sr * 0.20 - py * sec_w),
        ]
        draw.polygon(
            sec_pts,
            fill=(152, 224, 252, 255),
            outline=(18, 28, 46, 255),
            width=max(2, int(1.4 * ss)),
        )

    # 4) 6 Primary Snowflake Arms + Dendritic V-Branches + Diamond Crystal Tips
    for i in range(6):
        a_main = math.radians(i * 60.0 - 90.0)
        ux, uy = math.cos(a_main), math.sin(a_main)
        px, py = -uy, ux

        # Two pairs of dendritic V-branches (barbs) along each main arm
        for b_pos, b_len, b_w in [
            (0.46, 0.30, 0.058),
            (0.70, 0.22, 0.050),
        ]:
            base_d = sr * b_pos
            for sign in (-1.0, 1.0):
                b_ang = a_main + sign * math.radians(52.0)
                bx, by = math.cos(b_ang), math.sin(b_ang)
                bpx, bpy = -by, bx
                bw = sr * b_w
                bl = sr * b_len
                ox, oy = ux * base_d, uy * base_d
                barb_pts = [
                    rot_snow(ox - bpx * bw * 0.7, oy - bpy * bw * 0.7),
                    rot_snow(ox + bx * bl * 0.72 + bpx * bw * 0.95, oy + by * bl * 0.72 + bpy * bw * 0.95),
                    rot_snow(ox + bx * bl, oy + by * bl),
                    rot_snow(ox + bx * bl * 0.72 - bpx * bw * 0.95, oy + by * bl * 0.72 - bpy * bw * 0.95),
                    rot_snow(ox + bpx * bw * 0.7, oy + bpy * bw * 0.7),
                ]
                draw.polygon(
                    barb_pts,
                    fill=(218, 246, 255, 255),
                    outline=(18, 28, 46, 255),
                    width=max(2, int(1.4 * ss)),
                )

        # Main crystalline shaft + spearhead diamond tip
        shaft_w = sr * 0.072
        tip_w = sr * 0.135
        arm_pts = [
            rot_snow(px * shaft_w, py * shaft_w),
            rot_snow(ux * sr * 0.74 + px * shaft_w, uy * sr * 0.74 + py * shaft_w),
            rot_snow(ux * sr * 0.83 + px * tip_w, uy * sr * 0.83 + py * tip_w),
            rot_snow(ux * sr * 1.02, uy * sr * 1.02),
            rot_snow(ux * sr * 0.83 - px * tip_w, uy * sr * 0.83 - py * tip_w),
            rot_snow(ux * sr * 0.74 - px * shaft_w, uy * sr * 0.74 - py * shaft_w),
            rot_snow(-px * shaft_w, -py * shaft_w),
        ]
        draw.polygon(
            arm_pts,
            fill=(238, 252, 255, 255),
            outline=(18, 28, 46, 255),
            width=max(2, int(1.7 * ss)),
        )

        # Inner cyan facet highlight along each main arm
        in_w = sr * 0.030
        in_pts = [
            rot_snow(ux * sr * 0.12 + px * in_w, uy * sr * 0.12 + py * in_w),
            rot_snow(ux * sr * 0.88, uy * sr * 0.88),
            rot_snow(ux * sr * 0.12 - px * in_w, uy * sr * 0.12 - py * in_w),
        ]
        draw.polygon(in_pts, fill=(110, 214, 255, 255))

    # 5) Central 6-pointed snow star & pure white ice core
    core_outer = []
    core_inner = []
    for i in range(12):
        a_c = math.radians(i * 30.0 - 90.0)
        r_out = sr * (0.25 if i % 2 == 0 else 0.12)
        r_in = sr * (0.14 if i % 2 == 0 else 0.07)
        core_outer.append(rot_snow(math.cos(a_c) * r_out, math.sin(a_c) * r_out))
        core_inner.append(rot_snow(math.cos(a_c) * r_in, math.sin(a_c) * r_in))
    draw.polygon(core_outer, fill=(88, 198, 250, 255), outline=(18, 28, 46, 255), width=max(2, int(1.5 * ss)))
    draw.polygon(core_inner, fill=(255, 255, 255, 255))

    # 6) Small floating snow crystal sparkles around the main snowflake
    for sx_off, sy_off, sp_r in [
        (0.08, -0.52, 6.5 * ss),
        (0.56, 0.22, 6.0 * ss),
        (0.32, 0.46, 5.2 * ss),
    ]:
        spx, spy = rot_pt(rx * sx_off, ry * sy_off)
        sp_pts = []
        for k in range(8):
            ak = math.radians(k * 45.0)
            rk = sp_r * (1.0 if k % 2 == 0 else 0.32)
            sp_pts.append((spx + math.cos(ak) * rk, spy + math.sin(ak) * rk))
        draw.polygon(sp_pts, fill=(230, 250, 255, 255), outline=(20, 34, 54, 255), width=max(1, ss // 2))

    draw.line(outer_rim + [outer_rim[0]], fill=(20, 26, 38, 255), width=max(2, int(2.4 * ss)), joint="curve")
    draw.line(mid_rim + [mid_rim[0]], fill=(22, 30, 44, 255), width=max(2, int(1.6 * ss)), joint="curve")
    draw.line(inner_plate + [inner_plate[0]], fill=(20, 26, 38, 255), width=max(2, int(1.8 * ss)), joint="curve")

    shield_layer = sh_hi.resize((cw, ch), Image.Resampling.LANCZOS)

    out = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    out.alpha_composite(shield_layer, (0, 0))
    out.alpha_composite(kadan_cutout, (pad_l, pad_t))
    return out


def apply_all_surgical_restorations(
    anime_cutouts: dict[int, Image.Image],
    brain_dir: Path,
    remove_white_bg_clean: Callable[..., Image.Image],
    clean_cutout_specks: Callable[..., Image.Image],
    split_row_by_dp_seams: Callable[..., list[Image.Image]],
) -> None:
    """
    Applies surgical bounding-box extraction, foreign-overlap color/contour stripping,
    and erased-pixel-only symmetry completion across all overlapping characters so zero
    body parts (arms, legs, tails, wings, torsos) or equipped weapons/shields are clipped.
    """
    # ==========================================================
    # 1. WATER A: #004 Kelpie & #005 Aqualord
    # ==========================================================
    w_raw = Image.open(brain_dir / "anime_01a_water_1793137794792.jpg").convert("RGB")
    w_rgba = np.array(remove_white_bg_clean(w_raw))

    kelp = w_rgba[:, 805:1145].copy()
    kh, kw, _ = kelp.shape
    for y in range(kh):
        scx = int(round(1072.0 + (y - 200.0) * (41.0 / 500.0))) - 805
        if y < 235:
            for x in range(max(0, 185), kw):
                r, g, b, a = [int(v) for v in kelp[y, x]]
                if a > 15 and (b - r < 35):
                    kelp[y, x, 3] = 0
        elif y < 342:
            kelp[y, max(0, scx - 18) :, 3] = 0
        elif y <= 555:
            tasset_x = int(round(1134 - max(0, y - 410) * 0.12)) - 805
            kelp[y, max(0, tasset_x) :, 3] = 0
            for dx in range(-7, 8):
                tx = scx + dx
                sx = min(kw - 1, scx + 11 + abs(dx) // 2)
                if 0 <= tx < kw and kelp[y, sx, 3] > 120:
                    kelp[y, tx] = kelp[y, sx]
        else:
            kelp[y, max(0, scx - 6) :, 3] = 0
            for x in range(max(0, scx - 28), min(kw, scx)):
                r, g, b, a = [int(v) for v in kelp[y, x]]
                if a > 15 and (r > b):
                    kelp[y, x, 3] = 0
    anime_cutouts[4] = clean_cutout_specks(Image.fromarray(kelp), keep_only_main=True)

    aqua = w_rgba[:, 990:1376].copy()
    ah, aw, _ = aqua.shape
    for y in range(ah):
        scx = int(round(1072.0 + (y - 200.0) * (41.0 / 500.0))) - 990
        if y < 235:
            for x in range(min(aw, 125)):
                r, g, b, a = [int(v) for v in aqua[y, x]]
                if a > 15 and (b - r > 35):
                    aqua[y, x, 3] = 0
        else:
            hand_pad = 22 if 235 <= y <= 352 else 6
            aqua[y, : max(0, scx - hand_pad), 3] = 0
            if 315 <= y < 352:
                for x in range(max(0, scx - hand_pad), max(0, scx - 6)):
                    r, g, b, a = [int(v) for v in aqua[y, x]]
                    if a > 15 and (b > r + 15):
                        aqua[y, x, 3] = 0
            if 352 <= y <= 650:
                body_x = None
                search_start = max(scx + 16, 132 if y < 495 else 150)
                for x in range(search_start, min(aw, 210)):
                    r, g, b, a = [int(v) for v in aqua[y, x]]
                    lum = 0.299 * r + 0.587 * g + 0.114 * b
                    if a > 180 and (lum < 62 or (r > b + 15)):
                        body_x = x
                        break
                if body_x is not None:
                    aqua[y, max(0, scx + 6) : body_x, 3] = 0
            if 535 <= y <= 625:
                aqua[y, 1222 - 990 : 1252 - 990, 3] = 0
    anime_cutouts[5] = clean_cutout_specks(Image.fromarray(aqua), keep_only_main=True)

    # ==========================================================
    # 2. FIRE A: #011 Ignis, #012 Salamander, #014 Pyro, #015 Balrog
    # ==========================================================
    f_raw = Image.open(brain_dir / "anime_02a_fire_1793137834796.jpg").convert("RGB").crop((0, 0, 1376, 696))
    f_rgba = np.array(remove_white_bg_clean(f_raw))

    ignis = f_rgba[:, 0:286].copy()
    for y in range(696):
        if y < 245:
            ignis[y, 238:, 3] = 0
        elif y < 356:
            cut_x = 244 if y < 312 else 266
            ignis[y, cut_x:, 3] = 0
        elif y < 442:
            cut_x = 285 if y < 422 else int(round(285 - (y - 422) * (22.0 / 20.0)))
            ignis[y, cut_x:, 3] = 0
        else:
            cut_x = max(210, int(round(263 - (y - 442) * (51.0 / 118.0))))
            ignis[y, cut_x:, 3] = 0
    anime_cutouts[11] = clean_cutout_specks(Image.fromarray(ignis), keep_only_main=True)

    salam = f_rgba[:, 228:538].copy()
    sh, sw, _ = salam.shape
    for y in range(sh):
        if 250 <= y < 365:
            cut_gx = 245 if y < 314 else 268
            salam[y, : max(0, cut_gx - 228), 3] = 0
        elif 365 <= y < 418:
            cut_gx = int(round(314.0 - (y - 365.0) * (38.0 / 53.0)))
            salam[y, : max(0, cut_gx - 228), 3] = 0
        elif 418 <= y < 495:
            t = (y - 418.0) / (495.0 - 418.0)
            outer_gx = int(round(240.0 + 36.0 * ((1.0 - min(1.0, t)) ** 1.55)))
            olx = max(0, outer_gx - 228)
            salam[y, :olx, 3] = 0
            if olx + 34 < sw:
                salam[y, olx : olx + 3] = [36, 15, 11, 255]
                for dx in range(3, 28):
                    w_orig = max(0.0, (dx - 20.0) / 8.0)
                    src_px = salam[498 + ((y + dx) % 8), (244 - 228) + dx].astype(float)
                    src_px[3] = 255.0
                    cur_px = salam[y, olx + dx].astype(float)
                    if cur_px[3] < 180 or cur_px[0] < 110:
                        w_orig = 0.0
                    salam[y, olx + dx] = np.clip((1.0 - w_orig) * src_px + w_orig * cur_px, 0, 255).astype(np.uint8)
        elif y >= 495:
            salam[y, : (240 - 228), 3] = 0
    anime_cutouts[12] = clean_cutout_specks(Image.fromarray(salam), keep_only_main=True)

    pyro = f_rgba[:, 838:1105].copy()
    ph, pw, _ = pyro.shape
    for y in range(ph):
        for x in range(0, 886 - 838):
            r, g, b, a = [int(v) for v in pyro[y, x]]
            if a <= 15:
                continue
            gx = x + 838
            if y < 245:
                continue
            if y < 370 and gx < 882:
                pyro[y, x, 3] = 0
            elif 370 <= y <= 455:
                is_hand_or_sleeve = (b > 85 and r > 155) or (gx > 866 and y < 418)
                if not is_hand_or_sleeve and gx < 878:
                    pyro[y, x, 3] = 0
            elif y > 455 and gx < 885:
                pyro[y, x, 3] = 0
        staff_cx = 1052.0 - (y - 240.0) * (60.0 / 445.0)
        if y < 150:
            pyro[y, 1005 - 838 :, 3] = 0
        elif y < 252:
            for x in range(1020 - 838, pw):
                r, g, b, a = [int(v) for v in pyro[y, x]]
                gx = x + 838
                if a > 15 and gx > 1025 and (g < 125 and (r < 220 or gx > 1080)):
                    pyro[y, x, 3] = 0
        else:
            pad = 15 if y < 368 else 8
            r_lim = int(round(staff_cx + pad)) - 838
            if 0 <= r_lim < pw:
                pyro[y, r_lim:, 3] = 0
    anime_cutouts[14] = clean_cutout_specks(Image.fromarray(pyro), keep_only_main=True)

    balrog = f_rgba[:, 995:1376].copy()
    bh, bw, _ = balrog.shape
    bal_cx = 1185 - 995
    for y in range(bh):
        staff_cx = 1052.0 - (y - 240.0) * (60.0 / 445.0)
        if y < 252:
            for x in range(0, 1098 - 995):
                r, g, b, a = [int(v) for v in balrog[y, x]]
                if a > 15 and (g > 115 or x + 995 < 1028):
                    balrog[y, x, 3] = 0
        else:
            s_lim = int(round(staff_cx + (15 if y < 370 else 9))) - 995
            if s_lim > 0:
                balrog[y, : min(bw, s_lim), 3] = 0
    balrog = inpaint_symmetric_gaps(balrog, cx=bal_cx, y_min=0, y_max=450, side="left", min_dist=45)
    anime_cutouts[15] = clean_cutout_specks(Image.fromarray(balrog), keep_only_main=True)

    # ==========================================================
    # 3. FIRE B: #016 Muspel, #017 Ivar, #018 Ashel, #019 Phoenix, #020 Ignisius
    # ==========================================================
    f1_rgba = np.array(remove_white_bg_clean(Image.open(brain_dir / "sheet_02_fire_1793100220470.jpg").convert("RGB")))
    raw_f2 = np.array(Image.open(brain_dir / "sheet_02_fire_fixed_1793100244611.jpg").convert("RGB"))
    f2_rgba = np.array(remove_white_bg_clean(Image.fromarray(raw_f2)))

    for y in range(260, 352):
        for gx in list(range(798, 856)) + list(range(952, 1008)):
            r, g, b = [int(v) for v in raw_f2[y, gx]]
            if r > 215 and g > 100 and (b < 232 or (r - b) > 16):
                f2_rgba[y, gx, :3] = [r, g, b]
                f2_rgba[y, gx, 3] = 255

    # #016 Muspel
    arm_f1 = f1_rgba[195:342, 712:752].copy()
    ah_m, aw_m, _ = arm_f1.shape
    for ay in range(ah_m):
        for ax in range(aw_m):
            r, g, b, a = [int(v) for v in arm_f1[ay, ax]]
            if a == 0:
                continue
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            if lum > 140 or (ax < 18 and r > 88 and (r - b) > 32 and g < 92):
                arm_f1[ay, ax, 3] = 0
                continue
            if ay < 45:
                min_ax = int(round(16 - ay * (11.0 / 45.0)))
                if ax < min_ax or ax > 34:
                    arm_f1[ay, ax, 3] = 0
            elif ay < 74:
                if ax < 5 or ax > 32:
                    arm_f1[ay, ax, 3] = 0
            elif ay < 98:
                min_ax = int(round(5 + (ay - 74) * (8.0 / 24.0)))
                max_ax = int(round(31 - (ay - 74) * (7.0 / 24.0)))
                if ax < min_ax or ax > max_ax:
                    arm_f1[ay, ax, 3] = 0
            else:
                if ax < 13 or ax > 21 or lum > 110:
                    arm_f1[ay, ax, 3] = 0

    c16 = f2_rgba[:, 682:877].copy()
    mcx = 779 - 682
    for y in range(768):
        if y < 195:
            max_dx = 31
        elif y <= 258:
            max_dx = 64
        elif y < 292:
            max_dx = int(round(64 - (y - 258) * (13.0 / 34.0)))
        elif y < 378:
            max_dx = int(round(51 - (y - 292) * (6.0 / 86.0)))
        elif y < 468:
            max_dx = int(round(47 + (y - 378) * (19.0 / 90.0)))
        elif y < 515:
            max_dx = 67
        elif y < 640:
            max_dx = 81
        else:
            max_dx = 94
        for x in range(c16.shape[1]):
            if abs(x - mcx) > max_dx:
                c16[y, x, 3] = 0
        for dx in range(1, mcx + 1):
            if mcx + dx < c16.shape[1]:
                c16[y, mcx + dx] = c16[y, mcx - dx]

    arm_l_im = clean_cutout_specks(Image.fromarray(arm_f1), keep_only_main=True).resize((50, 215), Image.Resampling.LANCZOS)
    arm_r_im = arm_l_im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    musp_im = Image.new("RGBA", (c16.shape[1], 768), (0, 0, 0, 0))
    musp_im.alpha_composite(arm_l_im, (mcx - 36 - 46, 232))
    musp_im.alpha_composite(arm_r_im, (mcx + 36 - 4, 232))
    musp_im.alpha_composite(Image.fromarray(c16), (0, 0))
    anime_cutouts[16] = clean_cutout_specks(musp_im, keep_only_main=True)

    # #017 Ivar
    c17 = f2_rgba[:, 794:1021].copy()
    icx = 907 - 794
    for y in range(768):
        if y < 262:
            c17[y, (970 - 794) :, 3] = 0
            for dx in range(1, icx + 1):
                if icx + dx < c17.shape[1]:
                    c17[y, icx - dx] = c17[y, icx + dx]
        elif y < 352:
            for dx in range(0, icx + 1):
                lx = icx - dx
                gx = lx + 794
                r, g, b, a = [int(v) for v in c17[y, lx]]
                in_sh = dx <= 56
                in_fb = (798 <= gx <= 854) and (262 <= y <= 350) and (r > 180 and g > 75 and (r - b > 16 or g > 180))
                if not (in_sh or in_fb):
                    c17[y, lx, 3] = 0
                elif 52 <= dx <= 64 and (r < 175 or g < 85):
                    c17[y, lx, 3] = 0
                if dx >= 45 and icx + dx < c17.shape[1]:
                    c17[y, icx + dx] = c17[y, lx]
        elif y < 402:
            for dx in range(0, icx + 1):
                lx = icx - dx
                r, g, b, a = [int(v) for v in c17[y, lx]]
                if dx > 110 or (dx > 50 and (r < 135 or (r - b < 40 and g < 85))):
                    c17[y, lx, 3] = 0
                if dx >= 45 and icx + dx < c17.shape[1]:
                    c17[y, icx + dx] = c17[y, lx]
        elif y < 448:
            for dx in range(0, icx + 1):
                rx = icx + dx
                if rx < c17.shape[1]:
                    r, g, b, a = [int(v) for v in c17[y, rx]]
                    in_waist = dx <= 46
                    in_tip = (y <= 432) and (54 <= dx <= 66) and (r > 65 and r - g > 18)
                    if not (in_waist or in_tip):
                        c17[y, rx, 3] = 0
                    if dx >= 25:
                        c17[y, icx - dx] = c17[y, rx]
        else:
            if y <= 595:
                max_dx = int(round(46 + (y - 448) * (39.0 / 147.0)))
            elif y <= 632:
                max_dx = int(round(85 - (y - 595) * (34.0 / 37.0)))
            elif y <= 685:
                max_dx = 50
            else:
                max_dx = int(round(50 + (y - 685) * (15.0 / 45.0)))
            for dx in range(0, icx + 1):
                rx = icx + dx
                if rx < c17.shape[1]:
                    if dx > max_dx:
                        c17[y, rx, 3] = 0
                    if dx >= 18:
                        c17[y, icx - dx] = c17[y, rx]
    anime_cutouts[17] = clean_cutout_specks(Image.fromarray(c17), keep_only_main=False)

    # #018 Ashel the Immortal
    c18 = f2_rgba[:, 954:1142].copy()
    acx = 1028 - 954
    for y in range(768):
        if y < 225:
            c18[y, : (982 - 954), 3] = 0
            c18[y, (1074 - 954) :, 3] = 0
        elif y < 302:
            sh_lim_r = int(round(1060 + (y - 225) * (35.0 / 65.0)))
            c18[y, max(0, sh_lim_r - 954) :, 3] = 0
            for gx in range(1055, min(1142, sh_lim_r + 1)):
                r, g, b, a = [int(v) for v in c18[y, gx - 954]]
                if r > 215 and g > 95 and b < 50 and r - b > 140:
                    c18[y, gx - 954, 3] = 0
            for dx in range(1, acx + 1):
                if acx + dx < c18.shape[1]:
                    c18[y, acx - dx] = c18[y, acx + dx]
        elif y < 398:
            c18[y, : (968 - 954), 3] = 0
            for gx in range(968, 1006):
                if y < 350:
                    sy = 301 - (y - 302)
                    c18[y, gx - 954] = c18[sy, min(acx, (gx - 954) + 3)]
                else:
                    sy = 398 + (398 - y)
                    c18[y, gx - 954] = f2_rgba[sy, max(972, min(1002, gx + 2))]
            sh_r = int(round(1084 + (y - 298) * (50.0 / 77.0))) if y <= 375 else int(round(1134 - (y - 375) * (50.0 / 180.0)))
            c18[y, max(0, sh_r - 954) :, 3] = 0
            if y >= 315:
                for gx in range(1086, min(1142, sh_r)):
                    dx = gx - 1085
                    src_gx = 1085 - dx
                    src_y = int(round(y - dx * 0.52))
                    if 300 <= src_y < 555 and 1038 <= src_gx <= 1085:
                        c18[y, gx - 954] = c18[src_y, src_gx - 954]
        elif y <= 555:
            sh_r = int(round(1134 - (y - 375) * (50.0 / 180.0)))
            c18[y, max(0, sh_r - 954) :, 3] = 0
            for gx in range(1086, min(1142, sh_r)):
                dx = gx - 1085
                src_gx = 1085 - dx
                src_y = int(round(y - dx * 0.52))
                if 300 <= src_y < 555 and 1038 <= src_gx <= 1085:
                    c18[y, gx - 954] = c18[src_y, src_gx - 954]
            if y < 458:
                c18[y, : (966 - 954), 3] = 0
                for gx in range(966, 980):
                    r, g, b, a = [int(v) for v in c18[y, gx - 954]]
                    if (r - g > 26 and g < 58) or (y > 430 and gx < 968 and r < 120):
                        c18[y, gx - 954, 3] = 0
            else:
                for gx in range(954, 984):
                    r, g, b, a = [int(v) for v in c18[y, gx - 954]]
                    if not (r > 150 and g > 55 and r - b > 80):
                        c18[y, gx - 954, 3] = 0
        else:
            c18[y, (1090 - 954) :, 3] = 0
            for gx in range(954, 984):
                r, g, b, a = [int(v) for v in c18[y, gx - 954]]
                is_sword = (y < 660) and (r > 150 and g > 55 and r - b > 80)
                is_boot = (y >= 625) and (gx >= 970)
                if not (is_sword or is_boot):
                    c18[y, gx - 954, 3] = 0
    anime_cutouts[18] = clean_cutout_specks(Image.fromarray(c18), keep_only_main=True)

    # #019 Phoenix
    c19 = f2_rgba[:, 1055:1256].copy()
    pcx = 1155 - 1055
    for y in range(768):
        if y < 295:
            ash_lim = (
                1055
                if y < 180
                else (
                    int(round(1055 + (y - 180) * (12.0 / 45.0)))
                    if y < 225
                    else int(round(1067 + (y - 225) * (25.0 / 70.0)))
                )
            )
            c19[y, : max(0, ash_lim - 1055), 3] = 0
            for gx in range(ash_lim, 1110):
                r, g, b, a = [int(v) for v in c19[y, gx - 1055]]
                if r < 185 or g < 70 or (r - b < 95):
                    c19[y, gx - 1055, 3] = 0
            for dx in range(28, 100):
                c19[y, pcx + dx] = c19[y, pcx - dx]
        elif y < 462:
            ig_lim = 1212 if y < 345 else int(round(1209 - max(0, (y - 390) * (6.0 / 72.0))))
            c19[y, max(0, ig_lim - 1055) :, 3] = 0
            for dx in range(24, 100):
                c19[y, pcx - dx] = c19[y, pcx + dx]
        else:
            for gx in range(1055, 1122):
                r, g, b, a = [int(v) for v in c19[y, gx - 1055]]
                if gx < 1096 or y >= 645 or not (r > 190 and g > 75 and r - b > 100):
                    c19[y, gx - 1055, 3] = 0
            for dx in range(32, 100):
                c19[y, pcx + dx] = c19[y, pcx - dx]
    anime_cutouts[19] = clean_cutout_specks(Image.fromarray(c19), keep_only_main=True)

    # #020 Ignisius
    c20 = f2_rgba[:, 1170:1376].copy()
    for y in range(768):
        if y < 185:
            lim_gx = 1218
        elif y < 225:
            lim_gx = int(round(1218 + (y - 185) * (24.0 / 40.0)))
        elif y < 285:
            lim_gx = int(round(1242 - (y - 225) * (20.0 / 60.0)))
        elif y < 485:
            lim_gx = 1222
        elif y < 535:
            lim_gx = int(round(1216 + (y - 455) * (8.0 / 80.0)))
        elif y < 592:
            lim_gx = 1224
        else:
            lim_gx = 1170
        c20[y, : max(0, lim_gx - 1170), 3] = 0
        if 240 <= y < 592:
            for gx in range(lim_gx, min(1240, lim_gx + 14)):
                r, g, b, a = [int(v) for v in c20[y, gx - 1170]]
                if r > 205 and g < 135 and b < 45 and (r - g) > 75:
                    c20[y, gx - 1170, 3] = 0
    anime_cutouts[20] = clean_cutout_specks(Image.fromarray(c20), keep_only_main=True)

    # ==========================================================
    # 4. WIND A: #024 Harpy & #025 Aeolus
    # ==========================================================
    wi_raw = Image.open(brain_dir / "anime_03a_wind_1793137800297.jpg").convert("RGB")
    wi_rgba = np.array(remove_white_bg_clean(wi_raw))

    harpy = wi_rgba[:, 804:1128].copy()
    hh, hw, _ = harpy.shape
    harpy_cx = 965 - 804
    for y in range(hh):
        if y <= 168:
            harpy[y, harpy_cx + 52 :, 3] = 0
        else:
            for x in range(harpy_cx + 50, hw):
                r, g, b, a = [int(v) for v in harpy[y, x]]
                gx = x + 804
                if a > 15 and ((g > r + 5) or (gx > 1075)):
                    harpy[y, x, 3] = 0
    harpy = inpaint_symmetric_gaps(harpy, cx=harpy_cx, y_min=168, y_max=560, side="right", min_dist=50)
    anime_cutouts[24] = clean_cutout_specks(Image.fromarray(harpy), keep_only_main=True)

    aeolus = wi_rgba[:, 1010:1376].copy()
    aeh, aew, _ = aeolus.shape
    for y in range(aeh):
        scx = 1108.0 + (y - 250.0) * (34.0 / 430.0)
        for x in range(0, min(aew, 1148 - 1010)):
            r, g, b, a = [int(v) for v in aeolus[y, x]]
            if a <= 15:
                continue
            gx = x + 1010
            is_hand = (246 <= y <= 312) and (1080 <= gx <= 1138)
            if not is_hand and y > 180 and gx < 1122:
                if g - r <= 12 and gx < scx - 10:
                    aeolus[y, x, 3] = 0
    anime_cutouts[25] = clean_cutout_specks(Image.fromarray(aeolus), keep_only_main=True)

    # ==========================================================
    # 5. EARTH: #031 Gaia .. #040 Colossus
    # ==========================================================
    raw_e = np.array(Image.open(brain_dir / "sheet_04_earth_1793100291507.jpg").convert("RGB"))
    e_rgba = np.array(remove_white_bg_clean(Image.fromarray(raw_e)))
    for y in range(245, 355):
        for gx in range(548, 586):
            r, g, b = [int(v) for v in raw_e[y, gx]]
            if g > 170 and b > 140 and (g - r > 14 or b - r > 14):
                e_rgba[y, gx, :3] = [r, g, b]
                e_rgba[y, gx, 3] = 255

    # #031 Gaia (cx = 99)
    c31 = e_rgba[:, 0:198].copy()
    for y in range(768):
        if 345 <= y < 415:
            c31[y, 160:, 3] = 0
        elif y >= 415:
            for dx in range(36, 99):
                c31[y, 99 + dx] = c31[y, 99 - dx]
    anime_cutouts[31] = clean_cutout_specks(Image.fromarray(c31), keep_only_main=True)

    # #032 Gnome (cx = 255, crystal shield + golden pickaxe)
    c32 = e_rgba[:, 122:358].copy()
    for y in range(768):
        if y < 328:
            c32[y, :, 3] = 0
            continue
        for x in range(c32.shape[1]):
            gx = x + 122
            r, g, b, a = [int(v) for v in c32[y, x]]
            if a == 0:
                continue
            if y < 410 and gx < 192 and (y < 352 or gx < 168):
                c32[y, x, 3] = 0
            elif y < 368 and gx > 300:
                c32[y, x, 3] = 0
            elif gx < 198 and ((g > b + 6 and g > r + 8) or (y < 430 and gx < 145 and b < r)):
                c32[y, x, 3] = 0
            elif gx > 318:
                if y < 495 and gx > 344:
                    c32[y, x, 3] = 0
                elif g > r + 6 and g > b + 6:
                    c32[y, x, 3] = 0
                elif y >= 495 and gx > 335 and (b > 92 and (r - b) < 64 and r > 145):
                    c32[y, x, 3] = 0
                elif y >= 645:
                    c32[y, x, 3] = 0
    anime_cutouts[32] = clean_cutout_specks(Image.fromarray(c32), keep_only_main=True)

    # #033 Terra (cx = 371)
    c33 = e_rgba[:, 280:462].copy()
    tcx = 371 - 280
    for y in range(768):
        if y < 340:
            c33[y, (428 - 280) :, 3] = 0
        elif y < 505:
            lim_r = 415 if (372 <= y <= 445) else 434
            c33[y, (lim_r - 280) :, 3] = 0
            for dx in range(14, tcx + 1):
                if tcx + dx < c33.shape[1]:
                    c33[y, tcx - dx] = c33[y, tcx + dx]
        else:
            lim_r = int(round(418 + (y - 505) * (44.0 / 185.0)))
            c33[y, min(c33.shape[1], lim_r - 280) :, 3] = 0
            for dx in range(14, tcx + 1):
                if tcx + dx < c33.shape[1]:
                    c33[y, tcx - dx] = c33[y, tcx + dx]
            if 495 <= y <= 655:
                t = (y - 495.0) / (655.0 - 495.0)
                for gx in range(345, 383):
                    lx = gx - 280
                    r, g, b, a = [int(v) for v in c33[y, lx]]
                    if (r - b > 58 and b < 95) or (r < 95 and g < 85 and 350 <= gx <= 378 and 515 <= y <= 645):
                        top_px = c33[492, lx]
                        bot_px = c33[658, max(0, lx - 3)]
                        if top_px[3] > 128 and bot_px[3] > 128:
                            c33[y, lx] = [int(round((1 - t) * top_px[c] + t * bot_px[c])) for c in range(4)]
                        else:
                            c33[y, lx] = c33[y, tcx + abs(gx - 371)]
    anime_cutouts[33] = clean_cutout_specks(Image.fromarray(c33), keep_only_main=True)

    # #034 Medusa (cx = 494)
    c34 = e_rgba[:, 414:588].copy()
    for y in range(768):
        gx_s = 567.0 - (y - 350.0) * (19.0 / 360.0)
        for x in range(c34.shape[1]):
            gx = x + 414
            r, g, b, a = [int(v) for v in c34[y, x]]
            if a == 0:
                continue
            if gx < 452:
                if y < 365 and gx < 442:
                    c34[y, x, 3] = 0
                elif 455 <= y <= 635 and gx < 445:
                    c34[y, x, 3] = 0
                elif y > 450 and (g > r + 6 and g > b + 8):
                    c34[y, x, 3] = 0
            if gx > 522:
                in_staff = (245 <= y <= 368 and 548 <= gx <= 586 and (g > r + 5 or b > r + 5)) or (
                    y >= 340 and abs(gx - gx_s) <= 6.5
                )
                in_arm = (
                    (340 <= y <= 442)
                    and (gx <= 574)
                    and not (y < 385 and gx > 540 and r < 120 and g < 110)
                    and not (y > 410 and gx > 548 and abs(gx - gx_s) > 6.5 and r < 120)
                )
                in_skirt = (y >= 620) and (gx <= 548 + (y - 620) * 0.45) and not (y < 645 and gx > 555)
                if not (in_staff or in_arm or in_skirt):
                    c34[y, x, 3] = 0
    anime_cutouts[34] = clean_cutout_specks(Image.fromarray(c34), keep_only_main=True)

    # #035 Obelisk (cx = 620)
    c35 = e_rgba[:, 535:706].copy()
    ocx = 620 - 535
    for y in range(660):
        gx_s = 567.0 - (y - 350.0) * (19.0 / 360.0)
        for dx in range(1, ocx + 1):
            lx = ocx - dx
            gx = lx + 535
            r, g, b, a = [int(v) for v in c35[y, lx]]
            if (
                (y > 245 and gx < 562 and not (y < 315 and r < 115 and g < 105))
                or (g > r + 10 and b > 75)
                or (y > 335 and abs(gx - gx_s) <= 8.5)
            ):
                c35[y, lx, 3] = 0
            if ocx + dx < c35.shape[1]:
                c35[y, ocx + dx] = c35[y, lx]
    c35[660:, :, 3] = 0
    anime_cutouts[35] = clean_cutout_specks(Image.fromarray(c35), keep_only_main=False)

    # #036 Grandrock (cx = 744)
    c36 = e_rgba[:, 626:862].copy()
    gcx = 744 - 626
    for y in range(768):
        if y < 260:
            c36[y, :, 3] = 0
            continue
        if y < 375:
            c36[y, : (685 - 626), 3] = 0
        elif 552 <= y < 642:
            c36[y, : (668 - 626), 3] = 0
        for dx in range(1, gcx + 1):
            if gcx + dx < c36.shape[1]:
                c36[y, gcx + dx] = c36[y, gcx - dx]
    anime_cutouts[36] = clean_cutout_specks(Image.fromarray(c36), keep_only_main=True)

    # #037 Rokta (cx = 856)
    c37 = e_rgba[:, 750:985].copy()
    rcx = 856 - 750
    for y in range(768):
        if y < 310:
            c37[y, (905 - 750) :, 3] = 0
            for x in range(c37.shape[1]):
                r, g, b, a = [int(v) for v in c37[y, x]]
                if b > r + 15 and b > 120:
                    c37[y, x, 3] = 0
        else:
            for dx in range(1, rcx + 1):
                rx = rcx + dx
                if rx < c37.shape[1]:
                    r, g, b, a = [int(v) for v in c37[y, rx]]
                    if dx > 58 or (b >= r - 4 and b > 45):
                        c37[y, rx, 3] = 0
                    c37[y, rcx - dx] = c37[y, rx]
            c37[y, (rcx + 59) :, 3] = 0
    anime_cutouts[37] = clean_cutout_specks(Image.fromarray(c37), keep_only_main=True)

    # #038 Orihalcon (cx = 1031)
    c38 = e_rgba[:, 885:1177].copy()
    orcx = 1031 - 885
    for y in range(768):
        if y < 215:
            c38[y, :, 3] = 0
            continue
        for dx in range(0, orcx + 1):
            lx = orcx - dx
            r, g, b, a = [int(v) for v in c38[y, lx]]
            if a > 0 and (r > b + 6 or (g > b + 8 and b < 120)):
                if 345 <= y <= 440 and dx < 36:
                    # Fill Atlas levitating rock overlap on Orihalcon's chest from Orihalcon's dark slate chest above it!
                    c38[y, lx] = c38[max(325, y - 35), lx]
                else:
                    c38[y, lx, 3] = 0
            if dx >= 1 and orcx + dx < c38.shape[1]:
                c38[y, orcx + dx] = c38[y, lx]
    anime_cutouts[38] = clean_cutout_specks(Image.fromarray(c38), keep_only_main=True)

    # #039 Atlas (cx = 1135)
    c39 = e_rgba[:, 995:1275].copy()
    atcx = 1135 - 995
    for y in range(768):
        if y < 215:
            c39[y, :, 3] = 0
            continue
        if y < 335:
            c39[y, : (1088 - 995), 3] = 0
            for dx in range(1, atcx + 1):
                if atcx + dx < c39.shape[1]:
                    c39[y, atcx + dx] = c39[y, atcx - dx]
        elif y < 462:
            for dx in range(0, atcx + 1):
                lx = atcx - dx
                r, g, b, a = [int(v) for v in c39[y, lx]]
                if b > r + 4 and (y < 438 or dx > 48):
                    c39[y, lx, 3] = 0
                if dx >= 1 and atcx + dx < c39.shape[1]:
                    c39[y, atcx + dx] = c39[y, lx]
        else:
            for dx in range(0, atcx + 1):
                lx = atcx - dx
                r, g, b, a = [int(v) for v in c39[y, lx]]
                max_dx = 60
                if dx > max_dx or (b >= r - 2 and (y > 492 or dx > 48)):
                    c39[y, lx, 3] = 0
                if dx >= 1 and atcx + dx < c39.shape[1]:
                    c39[y, atcx + dx] = c39[y, lx]
    anime_cutouts[39] = clean_cutout_specks(Image.fromarray(c39), keep_only_main=False)

    # #040 Colossus (cx = 1226)
    c40 = e_rgba[:, 1076:1376].copy()
    cocx = 1226 - 1076
    for y in range(768):
        if 355 <= y <= 465:
            for dx in range(0, 32):
                sy = 310 + (y - 355) * 40 // 110
                c40[y, cocx + dx] = c40[sy, cocx + min(42, dx + 8)]
        for dx in range(1, cocx + 1):
            if cocx + dx < c40.shape[1]:
                c40[y, cocx - dx] = c40[y, cocx + dx]
    anime_cutouts[40] = clean_cutout_specks(Image.fromarray(c40), keep_only_main=True)

    # ==========================================================
    # 6. HUMAN A & B: #041 Kadan (Back Eye-Emblem Shield), #042 Elwin, #043 Balian, #046..#049
    # ==========================================================
    anime_cutouts[41] = build_kadan_with_back_eye_shield(anime_cutouts[41])

    h5a_raw = Image.open(brain_dir / "anime_05a_human_clean_1793137812223.jpg").convert("RGB")
    h5a_rgba = np.array(remove_white_bg_clean(h5a_raw))

    elwin = h5a_rgba[:, 285:618].copy()
    eh, ew, _ = elwin.shape
    for y in range(eh):
        if y < 368:
            arm_edge = int(round(486.0 + max(0, y - 250) * 0.44)) - 285
            elwin[y, max(0, arm_edge) :, 3] = 0
        else:
            sw_cx = 505.0 + (y - 380.0) * (107.0 / 208.0) - 285.0
            for x in range(max(0, 520 - 285), ew):
                r, g, b, a = [int(v) for v in elwin[y, x]]
                if a <= 15:
                    continue
                if y > 590 or abs(x - sw_cx) > 15.0 or (r > b + 15):
                    elwin[y, x, 3] = 0
    anime_cutouts[42] = clean_cutout_specks(Image.fromarray(elwin), keep_only_main=True)

    balian = h5a_rgba[:, 485:842].copy()
    bah, baw, _ = balian.shape
    for y in range(bah):
        spear_cx = 495.0 + (y - 245.0) * 0.7046 - 485.0
        if y < 235:
            balian[y, : (555 - 485), 3] = 0
        elif 235 <= y <= 405:
            for x in range(0, min(baw, 558 - 485)):
                if abs(x - spear_cx) > 15.0:
                    balian[y, x, 3] = 0
            if 348 <= y <= 390:
                sc = int(round(spear_cx))
                for dx in range(-5, 6):
                    px = sc + dx
                    if 0 <= px < baw:
                        if abs(dx) >= 4:
                            balian[y, px] = [24, 38, 52, 255]
                        elif abs(dx) == 3:
                            balian[y, px] = [55, 195, 235, 255]
                        else:
                            balian[y, px] = [165, 248, 255, 255]
        else:
            sw_cx = 505.0 + (y - 380.0) * (107.0 / 208.0) - 485.0
            for x in range(0, min(baw, 616 - 485)):
                gx = x + 485
                if gx < 544:
                    balian[y, x, 3] = 0
                elif y <= 592 and abs(x - sw_cx) <= 15.0 and abs(x - spear_cx) > 16.0:
                    if gx < 606 and y > 435:
                        balian[y, x] = balian[y - 24, min(baw - 1, x + 18)]
                    else:
                        balian[y, x, 3] = 0
        for x in range(max(0, 795 - 485), baw):
            r, g, b, a = [int(v) for v in balian[y, x]]
            if a > 15 and y < 530 and (b > g + 22 and r > g + 12):
                balian[y, x, 3] = 0
    anime_cutouts[43] = clean_cutout_specks(Image.fromarray(balian), keep_only_main=True)

    h5b_raw = Image.open(brain_dir / "anime_05b_human_1793137831091.jpg").convert("RGB").crop((0, 0, 1376, 704))
    h5b_rgba = np.array(remove_white_bg_clean(h5b_raw))

    c46 = h5b_rgba[:, 0:348].copy()
    sh_cx = 259
    for y in range(704):
        if y < 175:
            c46[y, 302:, 3] = 0
        elif y <= 556:
            if y < 330:
                sh_left = 173
            else:
                t = (y - 330.0) / (556.0 - 330.0)
                sh_left = int(round(173.0 + (259.0 - 173.0) * (t ** 1.35)))
            sh_right = min(347, 2 * sh_cx - sh_left)
            for x in range(sh_cx, sh_right + 1):
                mx = 2 * sh_cx - x
                if 0 <= mx < 348:
                    c46[y, x] = c46[y, mx]
            c46[y, sh_right + 1 :, 3] = 0
        else:
            c46[y, 305:, 3] = 0
    anime_cutouts[46] = clean_cutout_specks(Image.fromarray(c46), keep_only_main=True)

    c47 = h5b_rgba[:, 282:635].copy()
    for y in range(704):
        for x in range(0, 355 - 282):
            r, g, b, a = [int(v) for v in c47[y, x]]
            if a <= 15:
                continue
            gx = x + 282
            if y < 135:
                c47[y, x, 3] = 0
            elif y < 235:
                if gx < 308 or (r < 95 and g < 95):
                    c47[y, x, 3] = 0
            elif y < 338:
                if gx < 305 or (r < 82 and g < 82 and b < 82 and gx < 330):
                    c47[y, x, 3] = 0
            elif y < 405:
                is_hilt_or_hand = (r > 105 and (r > b + 20)) or gx > 322
                if not is_hilt_or_hand and (r < 95 or gx < 318):
                    c47[y, x, 3] = 0
            else:
                if gx < 338 and (y < 495 or gx < 328):
                    c47[y, x, 3] = 0
        for x in range(552 - 282, c47.shape[1]):
            r, g, b, a = [int(v) for v in c47[y, x]]
            if a <= 15:
                continue
            gx = x + 282
            if (gx > 575 and g > r + 8) or (290 <= y <= 365 and gx > 588) or (440 <= y <= 520 and gx > 562):
                c47[y, x, 3] = 0
    anime_cutouts[47] = clean_cutout_specks(Image.fromarray(c47), keep_only_main=True)

    c48 = h5b_rgba[:, 548:862].copy()
    for y in range(704):
        for x in range(0, 628 - 548):
            r, g, b, a = [int(v) for v in c48[y, x]]
            if a <= 15:
                continue
            gx = x + 548
            if y < 292 and gx < 625:
                c48[y, x, 3] = 0
            elif 292 <= y < 448:
                is_quiver_or_ribbon = (g > r - 2) or (332 <= y <= 372 and gx >= 596)
                if not is_quiver_or_ribbon and gx < 612:
                    c48[y, x, 3] = 0
            elif 448 <= y <= 518:
                if y < 472 and gx < 592 and (g < r - 18):
                    c48[y, x, 3] = 0
            else:
                if gx < 582 or (r > g + 12 and gx < 626):
                    c48[y, x, 3] = 0
        for x in range(772 - 548, c48.shape[1]):
            r, g, b, a = [int(v) for v in c48[y, x]]
            if a <= 15:
                continue
            gx = x + 548
            if y < 140 and gx > 785:
                c48[y, x, 3] = 0
            elif 140 <= y <= 232:
                if not (g > r + 8) and gx > 782:
                    c48[y, x, 3] = 0
            elif 232 < y <= 432:
                u = (y - 235.0) / (425.0 - 235.0)
                bow_cx = 850.0 - 16.0 * u - 64.0 * (u ** 2.6)
                is_bow = abs(gx - bow_cx) <= 15.0
                is_green_ribbon = g > r + 8
                is_left_hand = (365 <= y <= 425) and (gx <= 795)
                if not (is_bow or is_green_ribbon or is_left_hand):
                    c48[y, x, 3] = 0
            else:
                if not (g > r + 5 and gx < 825) and gx > 775:
                    c48[y, x, 3] = 0
    anime_cutouts[48] = clean_cutout_specks(Image.fromarray(c48), keep_only_main=True)

    c49 = h5b_rgba[:, 775:1128].copy()
    herc_cx = 948 - 775
    for y in range(704):
        if 215 <= y <= 415:
            for x in range(0, 862 - 775):
                mx = 2 * herc_cx - x
                if 0 <= mx < c49.shape[1]:
                    c49[y, x] = c49[y, mx]
        else:
            for x in range(0, 828 - 775):
                r, g, b, a = [int(v) for v in c49[y, x]]
                if a > 15 and ((g > r + 5) or (y > 415 and x + 775 < 818)):
                    c49[y, x, 3] = 0
        for x in range(1060 - 775, c49.shape[1]):
            gx = x + 775
            if y < 618 and gx > 1062:
                c49[y, x, 3] = 0
    anime_cutouts[49] = clean_cutout_specks(Image.fromarray(c49), keep_only_main=True)

    # ==========================================================
    # 6B. UNDEAD V2 HIGH-RES (#051..#060) & ELF B (#068..#070)
    # ==========================================================
    u6a_im = remove_white_bg_clean(Image.open(brain_dir / "anime_06a_undead_v2_fix_1793150217689.jpg").convert("RGB"))
    cuts_u6a = split_row_by_dp_seams(u6a_im, num_chars=5)
    for i in range(5):
        anime_cutouts[51 + i] = clean_cutout_specks(cuts_u6a[i], keep_only_main=True)

    u6b_im = remove_white_bg_clean(Image.open(brain_dir / "anime_06b_undead_v2_fix_1793150318717.jpg").convert("RGB"))
    cuts_u6b = split_row_by_dp_seams(u6b_im, num_chars=5)
    for i in range(5):
        anime_cutouts[56 + i] = clean_cutout_specks(cuts_u6b[i], keep_only_main=False)

    # Elf B (#068 Kaeltor, #069 Gandar, #070 Aila)
    e7b = np.array(remove_white_bg_clean(Image.open(brain_dir / "anime_07b_elf_1793137821573.jpg").convert("RGB")))
    c68 = e7b[:, 580:865].copy()
    for y in range(768):
        if y < 515:
            c68[y, (802 - 580) :, 3] = 0
        else:
            for gx in range(802, 865):
                r, g, b, a = [int(v) for v in c68[y, gx - 580]]
                if a > 0 and (r > b + 12 or g > b + 10):
                    c68[y, gx - 580, 3] = 0
    anime_cutouts[68] = clean_cutout_specks(Image.fromarray(c68), keep_only_main=True)

    c69 = e7b[:, 800:1138].copy()
    for y in range(768):
        for gx in range(800, 866):
            r, g, b, a = [int(v) for v in c69[y, gx - 800]]
            if a > 0 and (b > r + 10 or y > 515):
                c69[y, gx - 800, 3] = 0
        for gx in range(1070, 1138):
            r, g, b, a = [int(v) for v in c69[y, gx - 800]]
            if a > 0 and (y > 415 or b > r + 5):
                c69[y, gx - 800, 3] = 0
    anime_cutouts[69] = clean_cutout_specks(Image.fromarray(c69), keep_only_main=True)

    c70 = e7b[:, 1072:1372].copy()
    for y in range(768):
        if y < 420:
            for gx in range(1072, 1140):
                r, g, b, a = [int(v) for v in c70[y, gx - 1072]]
                if a > 0 and (r > b + 12):
                    c70[y, gx - 1072, 3] = 0
    anime_cutouts[70] = clean_cutout_specks(Image.fromarray(c70), keep_only_main=True)

    # ==========================================================
    # 7. DWARF: #071 .. #080 (ground_line_y=(511, 530) -> zero cut boots + complete #080 Ironforge!)
    # ==========================================================
    dw_raw = Image.open(brain_dir / "sheet_08_dwarf_1793100309173.jpg").convert("RGB")
    dw_rgba_im = remove_white_bg_clean(dw_raw, ground_line_y=(511, 530))
    dw_rgba = np.array(dw_rgba_im)
    dw_cuts = split_row_by_dp_seams(
        dw_rgba_im,
        num_chars=10,
        approx_centers=[92, 248, 378, 515, 646, 760, 885, 1005, 1125, 1268],
        seam_windows=[None, None, None, None, None, None, (918, 966), (1038, 1086), (1135, 1218)],
    )
    for i in range(5):
        anime_cutouts[71 + i] = clean_cutout_specks(dw_cuts[i], keep_only_main=True)

    # #076 Brandy (preserve blue plasma rifle muzzle & strip Muradi's right brown boot at gx > 795, y > 410)
    c76 = dw_rgba[:, 695:845].copy()
    for y in range(768):
        if y < 372:
            c76[y, (790 - 695) :, 3] = 0
        elif y <= 410:
            for gx in range(790, 845):
                r, g, b, a = [int(v) for v in c76[y, gx - 695]]
                if a > 0 and (gx > 833 or b < r + 10):
                    c76[y, gx - 695, 3] = 0
        else:
            c76[y, (796 - 695) :, 3] = 0
    anime_cutouts[76] = clean_cutout_specks(Image.fromarray(c76), keep_only_main=True)

    # #077 Muradi
    c77 = dw_rgba[:, 790:945].copy()
    for y in range(768):
        for x in range(c77.shape[1]):
            gx = x + 790
            r, g, b, a = [int(v) for v in c77[y, x]]
            if a == 0:
                continue
            if gx < 842 and ((355 <= y <= 435 and (b > r + 8 or g > r + 8)) or (y > 410 and gx < 796)):
                c77[y, x, 3] = 0
            if y >= 295 and gx > 912 and (gx > 932 or b > r + 4 or (y < 445 and gx > 922)):
                c77[y, x, 3] = 0
    anime_cutouts[77] = clean_cutout_specks(Image.fromarray(c77), keep_only_main=True)

    # #078 Thorgrim
    c78 = dw_rgba[:, 908:1048].copy()
    for y in range(768):
        if y < 275:
            c78[y, :, 3] = 0
            continue
        for x in range(c78.shape[1]):
            gx = x + 908
            r, g, b, a = [int(v) for v in c78[y, x]]
            if gx < 932 and y < 430 and (r > b + 25 and g < 100):
                c78[y, x, 3] = 0
            if gx > 1020 and not (290 <= y <= 360 and gx <= 1046):
                if (y < 415 and gx > 1032) or (r > 185 and g > 130 and b < 95 and gx > 1026):
                    c78[y, x, 3] = 0
    anime_cutouts[78] = clean_cutout_specks(Image.fromarray(c78), keep_only_main=True)

    # #079 Berryforge (cx = 1109)
    c79 = dw_rgba[:, 1042:1182].copy()
    bfcx = 1109 - 1042
    for y in range(768):
        if y < 258:
            c79[y, :, 3] = 0
            continue
        if y < 345:
            for dx in range(1, bfcx + 1):
                if bfcx + dx < c79.shape[1]:
                    c79[y, bfcx + dx] = c79[y, bfcx - dx]
        else:
            for x in range(c79.shape[1]):
                gx = x + 1042
                r, g, b, a = [int(v) for v in c79[y, x]]
                if a == 0:
                    continue
                if gx < 1052 and (b >= r or y < 400):
                    c79[y, x, 3] = 0
                if gx > 1152 and y < 380:
                    c79[y, x, 3] = 0
                elif gx > 1145 and (r < 125 and g < 100):
                    c79[y, x, 3] = 0
    anime_cutouts[79] = clean_cutout_specks(Image.fromarray(c79), keep_only_main=True)

    # #080 Ironforge (cx = 1225 -> complete Twin Star-Rune Tower Shields + both golden legs!)
    c80 = dw_rgba[:, 1074:1376].copy()
    c80[:, -6:, 3] = 0
    ifcx = 1225 - 1074
    for y in range(768):
        for dx in range(1, ifcx + 1):
            if ifcx + dx < c80.shape[1]:
                c80[y, ifcx - dx] = c80[y, ifcx + dx]
    anime_cutouts[80] = clean_cutout_specks(Image.fromarray(c80), keep_only_main=True)

    # ==========================================================
    # 8. MONSTER A & B: #081..#085, #087..#090
    # ==========================================================
    m9a = np.array(remove_white_bg_clean(Image.open(brain_dir / "anime_09a_monster_1793137798455.jpg").convert("RGB")))

    c81 = m9a[:, 0:312].copy()
    for y in range(768):
        for x in range(235, 312):
            r, g, b, a = [int(v) for v in c81[y, x]]
            if a > 15 and (b - r < 8):
                c81[y, x, 3] = 0
    anime_cutouts[81] = clean_cutout_specks(Image.fromarray(c81), keep_only_main=True)

    c82 = m9a[:, 240:595].copy()
    for y in range(768):
        for x in range(0, 315 - 240):
            r, g, b, a = [int(v) for v in c82[y, x]]
            if a > 15 and (y < 350 or (b > r + 8)):
                c82[y, x, 3] = 0
        for x in range(545 - 240, c82.shape[1]):
            r, g, b, a = [int(v) for v in c82[y, x]]
            if a > 15 and (g > r + 10):
                c82[y, x, 3] = 0
    anime_cutouts[82] = clean_cutout_specks(Image.fromarray(c82), keep_only_main=True)

    c83 = m9a[:, 530:860].copy()
    for y in range(768):
        for x in range(c83.shape[1]):
            r, g, b, a = [int(v) for v in c83[y, x]]
            gx = x + 530
            if a <= 15:
                continue
            if (gx < 605 or gx > 765) and (r > g + 12 or r > b + 22):
                c83[y, x, 3] = 0
            if gx > 785 and y < 440:
                c83[y, x, 3] = 0
    anime_cutouts[83] = clean_cutout_specks(Image.fromarray(c83), keep_only_main=True)

    c84 = m9a[:, 768:1148].copy()
    grif_cx = 958 - 768
    for y in range(768):
        # 1. On left side (gx < 862), identify Jormungandr's cyan/teal dorsal fins & replace with Griffon's right-side golden wing
        for x in range(0, 862 - 768):
            r, g, b, a = [int(v) for v in c84[y, x]]
            gx = x + 768
            is_cyan_fin = (g > r + 6 and b > r + 2) or (gx < 838 and b > g - 12 and r < 105)
            if a > 15 and is_cyan_fin:
                c84[y, x, 3] = 0
                mx = 2 * grif_cx - x
                if 0 <= mx < c84.shape[1]:
                    mr, mg, mb, ma = [int(v) for v in c84[y, mx]]
                    # Copy right wing pixel if it is golden feather (not Byra's red fire)
                    if ma > 80 and not (mr - mg > 68 or (mr < 145 and mg < 65)):
                        c84[y, x] = c84[y, mx]
        # 2. On right side (gx >= 1065), strip Byra's red/dark-brown fire & replace with Griffon's clean left-side golden wing
        for x in range(1065 - 768, c84.shape[1]):
            r, g, b, a = [int(v) for v in c84[y, x]]
            gx = x + 768
            if a > 15 and ((r - g > 68) or (r < 145 and g < 65) or (y > 490 and gx > 1082)):
                c84[y, x, 3] = 0
                if y < 490 and (x - grif_cx) >= 92:
                    mx = 2 * grif_cx - x
                    if 0 <= mx < c84.shape[1] and c84[y, mx, 3] > 80:
                        c84[y, x] = c84[y, mx]
    anime_cutouts[84] = clean_cutout_specks(Image.fromarray(c84), keep_only_main=True)

    c85 = m9a[:, 1072:1376].copy()
    byra_cx = 1236 - 1072
    for y in range(768):
        for x in range(0, 1148 - 1072):
            r, g, b, a = [int(v) for v in c85[y, x]]
            gx = x + 1072
            if gx < 1126 and y < 495:
                c85[y, x, 3] = 0
                continue
            is_griffon_wing = (y < 515) and (g > 92 and b > 28 and (r - g < 70))
            if a > 15 and is_griffon_wing:
                c85[y, x, 3] = 0
                mx = 2 * byra_cx - x
                if 0 <= mx < c85.shape[1] and c85[y, mx, 3] > 80:
                    c85[y, x] = c85[y, mx]
    anime_cutouts[85] = clean_cutout_specks(Image.fromarray(c85), keep_only_main=True)

    m9b = np.array(remove_white_bg_clean(Image.open(brain_dir / "anime_09b_monster_1793137818251.jpg").convert("RGB")))

    c87 = m9b[:, 280:565].copy()
    for y in range(768):
        for x in range(512 - 280, c87.shape[1]):
            r, g, b, a = [int(v) for v in c87[y, x]]
            if a > 15 and (r > b + 5):
                c87[y, x, 3] = 0
    anime_cutouts[87] = clean_cutout_specks(Image.fromarray(c87), keep_only_main=True)

    c88 = m9b[:, 512:898].copy()
    for y in range(768):
        for x in range(0, 562 - 512):
            r, g, b, a = [int(v) for v in c88[y, x]]
            if a > 15 and ((b > r + 10) or (r < 62 and b > g)):
                c88[y, x, 3] = 0
    anime_cutouts[88] = clean_cutout_specks(Image.fromarray(c88), keep_only_main=True)

    c89 = m9b[:, 865:1138].copy()
    for y in range(768):
        for x in range(1062 - 865, c89.shape[1]):
            r, g, b, a = [int(v) for v in c89[y, x]]
            gx = x + 865
            if a <= 15:
                continue
            bow_cx = 1065.0 + (450.0 - y) * (58.0 / 190.0)
            is_purple_bow = (252 <= y <= 465) and (abs(gx - bow_cx) <= 15.0) and ((b - g > 18) or (r < 95 and g < 85))
            if not is_purple_bow and gx > 1068:
                c89[y, x, 3] = 0
    anime_cutouts[89] = clean_cutout_specks(Image.fromarray(c89), keep_only_main=True)

    c90 = m9b[:, 1065:1376].copy()
    peg_cx = 1236 - 1065
    for y in range(768):
        bow_cx = 1065.0 + (450.0 - y) * (58.0 / 190.0)
        for x in range(0, 1138 - 1065):
            r, g, b, a = [int(v) for v in c90[y, x]]
            gx = x + 1065
            is_bow_or_medusa = (252 <= y <= 475) and (
                (abs(gx - bow_cx) <= 15.0 and (b - g > 18 or g < 120)) or (gx < 1095 and y > 395)
            )
            if a > 15 and is_bow_or_medusa:
                mx = 2 * peg_cx - x
                if 0 <= mx < c90.shape[1] and c90[y, mx, 3] > 80:
                    c90[y, x] = c90[y, mx]
                else:
                    c90[y, x, 3] = 0
    anime_cutouts[90] = clean_cutout_specks(Image.fromarray(c90), keep_only_main=True)

    # ==========================================================
    # 9. MECHA A: #091 Spiderbot .. #095 Goliath
    # ==========================================================
    m_raw = Image.open(brain_dir / "anime_10a_mecha_1793137836093.jpg").convert("RGB")
    m_rgba = np.array(remove_white_bg_clean(m_raw))

    c91 = np.zeros((768, 358, 4), dtype=np.uint8)
    c91[:, :308] = m_rgba[:, 0:308]
    scx = 179
    for y in range(768):
        if y < 305:
            c91[y, :, 3] = 0
            continue
        for dx in range(1, scx + 1):
            if scx + dx < 358 and scx - dx >= 0:
                c91[y, scx + dx] = c91[y, scx - dx]
    anime_cutouts[91] = clean_cutout_specks(Image.fromarray(c91), keep_only_main=True)

    c92 = m_rgba[:, 265:584].copy()
    c92[462:, : (308 - 265), 3] = 0
    for y in range(768):
        for x in range(560 - 265, 584 - 265):
            r, g, b, a = [int(v) for v in c92[y, x]]
            if a > 15 and (b - r > 28 and g - r > 28):
                c92[y, x, 3] = 0
    anime_cutouts[92] = clean_cutout_specks(Image.fromarray(c92), keep_only_main=True)

    c93 = m_rgba[:, 568:768].copy()
    for y in range(768):
        for x in range(0, 610 - 568):
            r, g, b, a = [int(v) for v in c93[y, x]]
            gx = x + 568
            if a > 15 and (180 <= y <= 485) and ((r > b - 10) or gx < 592):
                c93[y, x, 3] = 0
        for x in range(752 - 568, 768 - 568):
            r, g, b, a = [int(v) for v in c93[y, x]]
            if a > 15 and (b - r < 22):
                c93[y, x, 3] = 0
    anime_cutouts[93] = clean_cutout_specks(Image.fromarray(c93), keep_only_main=True)

    c94 = m_rgba[:, 754:1076].copy()
    for y in range(768):
        for x in range(0, 772 - 754):
            r, g, b, a = [int(v) for v in c94[y, x]]
            if a > 15 and (b - r > 22):
                c94[y, x, 3] = 0
        if y >= 472:
            c94[y, (1050 - 754) :, 3] = 0
        else:
            c94[y, (1071 - 754) :, 3] = 0
    anime_cutouts[94] = clean_cutout_specks(Image.fromarray(c94), keep_only_main=True)

    c95 = m_rgba[:, 1048:1376].copy()
    c95[:472, : (1071 - 1048), 3] = 0
    gol_cx = 1221 - 1048
    for y in range(240, 472):
        for x in range(0, 1086 - 1048):
            mx = 2 * gol_cx - x
            if 0 <= mx < c95.shape[1] and c95[y, mx, 3] > 80:
                c95[y, x] = c95[y, mx]
    anime_cutouts[95] = clean_cutout_specks(Image.fromarray(c95), keep_only_main=True)

    # ==========================================================
    # 10. V2 HIGH-RES FULL REGENERATION FOR FIRE, EARTH, DWARF, MECHA & DRAGON
    # ==========================================================
    # 10.1 FIRE V2 (#011..#020)
    f2a_im = remove_white_bg_clean(Image.open(brain_dir / "anime_02a_fire_v2_1793146752301.jpg").convert("RGB"))
    f2a = np.array(f2a_im)
    f2a_mod = f2a.copy()
    for y in range(280, 412):
        if y <= 328:
            xs = 1049
        else:
            xs = int(round(1049 + (y - 328) * (23.0 / 82.0)))
        f2a_mod[y, xs : xs + 3, 3] = 0
    cuts_f2a = split_row_by_dp_seams(
        Image.fromarray(f2a_mod), num_chars=5, seam_windows=[None, (535, 576), None, (1042, 1096)]
    )
    anime_cutouts[11] = clean_cutout_specks(cuts_f2a[0], keep_only_main=True)

    # #012 Salamander (strip #013 Belphegor's hanging dark chain at x >= 543, y <= 535)
    c12_arr = f2a[:, 285:576].copy()
    for y in range(768):
        if y <= 490:
            c12_arr[y, (543 - 285) :, 3] = 0
        elif y <= 536:
            for gx in range(543, 576):
                r, g, b, a = [int(v) for v in c12_arr[y, gx - 285]]
                if a > 0 and (r < 145 or (r - b < 35)):
                    c12_arr[y, gx - 285, 3] = 0
    anime_cutouts[12] = clean_cutout_specks(Image.fromarray(c12_arr), keep_only_main=True)

    # #013 Belphegor (keep his hanging right chain at x >= 544, y <= 535; strip Salamander's orange tail at y >= 488, x <= 576)
    c13_arr = f2a[:, 543:882].copy()
    for y in range(488, 768):
        for gx in range(543, 577):
            r, g, b, a = [int(v) for v in c13_arr[y, gx - 543]]
            if a > 0 and (y >= 538 or (r > 140 and (r - b > 35))):
                c13_arr[y, gx - 543, 3] = 0
    anime_cutouts[13] = clean_cutout_specks(Image.fromarray(c13_arr), keep_only_main=True)

    # #014 Pyro & #015 Balrog separated along exact sleeve outer contour
    c14_arr = f2a[:, 865:1092].copy()
    for y in range(768):
        if y < 280:
            x_lim = 1049
        elif y <= 328:
            x_lim = 1049
        elif y <= 410:
            x_lim = int(round(1049 + (y - 328) * (23.0 / 82.0))) + 1
        else:
            x_lim = 1091
        if x_lim - 865 < c14_arr.shape[1]:
            c14_arr[y, max(0, x_lim - 865) :, 3] = 0
    anime_cutouts[14] = clean_cutout_specks(Image.fromarray(c14_arr), keep_only_main=True)

    c15_arr = f2a[:, 1048:1376].copy()
    for y in range(768):
        if y <= 328:
            x_min = 1050
        elif y <= 410:
            x_min = int(round(1049 + (y - 328) * (23.0 / 82.0))) + 1
        elif y <= 470:
            x_min = 1091
        else:
            x_min = 1048
        c15_arr[y, : max(0, x_min - 1048), 3] = 0
    anime_cutouts[15] = clean_cutout_specks(Image.fromarray(c15_arr), keep_only_main=True)

    f2b_im = remove_white_bg_clean(Image.open(brain_dir / "anime_02b_fire_v2_1793146800423.jpg").convert("RGB"))
    cuts_f2b = split_row_by_dp_seams(f2b_im, num_chars=5)
    for i in range(4):
        anime_cutouts[16 + i] = clean_cutout_specks(cuts_f2b[i], keep_only_main=True)

    # #020 Ignisius: extend Solar Greatsword tip cleanly past right canvas border
    c20_raw = np.array(clean_cutout_specks(cuts_f2b[4], keep_only_main=True))
    h20, w20, _ = c20_raw.shape
    ext_w = 46
    c20_ext = np.zeros((h20, w20 + ext_w, 4), dtype=np.uint8)
    c20_ext[:, :w20] = c20_raw
    sword_ys = [y for y in range(h20) if c20_raw[y, w20 - 2, 3] > 100]
    if sword_ys:
        y_top0, y_bot0 = min(sword_ys), max(sword_ys)
        half_h0 = (y_bot0 - y_top0) / 2.0
        yc0 = (y_top0 + y_bot0) / 2.0
        slope = 0.455
        for dx in range(1, ext_w):
            t = 1.0 - (dx / float(ext_w - 2))
            if t <= 0:
                continue
            yc = yc0 + dx * slope
            hh = max(0.8, half_h0 * t)
            y0 = max(0, int(np.floor(yc - hh)))
            y1 = min(h20 - 1, int(np.ceil(yc + hh)))
            for y in range(y0, y1 + 1):
                rel = (y - yc) / max(1.0, hh)
                src_y = int(np.clip(round(yc0 + rel * half_h0), y_top0, y_bot0))
                c20_ext[y, w20 - 1 + dx] = c20_raw[src_y, w20 - 4]
    anime_cutouts[20] = Image.fromarray(c20_ext)

    # 10.2 EARTH V2 (#031..#040)
    for fname, start_id in [
        ("anime_04a_earth_v2_1793147012368.jpg", 31),
        ("anime_04b_earth_v2_1793147055383.jpg", 36),
    ]:
        e_im = remove_white_bg_clean(Image.open(brain_dir / fname).convert("RGB"))
        e_cuts = split_row_by_dp_seams(e_im, num_chars=5)
        for i, c in enumerate(e_cuts):
            cid = start_id + i
            anime_cutouts[cid] = clean_cutout_specks(c, keep_only_main=(cid != 35))

    # 10.3 DWARF V2 (#071..#080)
    d8a_im = remove_white_bg_clean(Image.open(brain_dir / "anime_08a_dwarf_v2_1793146779135.jpg").convert("RGB"))
    cuts_d8a = split_row_by_dp_seams(d8a_im, num_chars=5)
    for i in range(5):
        anime_cutouts[71 + i] = clean_cutout_specks(cuts_d8a[i], keep_only_main=True)

    d8b_im = remove_white_bg_clean(Image.open(brain_dir / "anime_08b_dwarf_v2_1793146882447.jpg").convert("RGB"))
    d8b = np.array(d8b_im)
    cuts_d8b = split_row_by_dp_seams(d8b_im, num_chars=5)
    for i in range(3):
        anime_cutouts[76 + i] = clean_cutout_specks(cuts_d8b[i], keep_only_main=True)

    # #079 Berryforge (round solar shield boundary) & #080 Ironforge (symmetric twin shields)
    c79_arr = d8b[:, 795:1136].copy()
    for y in range(768):
        if 320 <= y <= 515:
            dy = (y - 417.0) / 98.5
            if abs(dy) <= 1.0:
                x_lim = int(round(1052.0 + 79.5 * np.sqrt(max(0.0, 1.0 - dy * dy)))) + 1
            else:
                x_lim = 1076
        else:
            x_lim = 1076
        if x_lim - 795 < c79_arr.shape[1]:
            c79_arr[y, max(0, x_lim - 795) :, 3] = 0
    anime_cutouts[79] = clean_cutout_specks(Image.fromarray(c79_arr), keep_only_main=True)

    c80_arr = d8b[:, 1090:1376].copy()
    if_cx = 1233.5 - 1090.0
    for y in range(768):
        for x in range(int(if_cx) + 1):
            mx = int(round(2 * if_cx - x))
            if 0 <= mx < c80_arr.shape[1]:
                c80_arr[y, x] = c80_arr[y, mx]
    anime_cutouts[80] = clean_cutout_specks(Image.fromarray(c80_arr), keep_only_main=True)

    # 10.4 MECHA V2 (#091..#100)
    m10a_im = remove_white_bg_clean(Image.open(brain_dir / "anime_10a_mecha_v2_1793146756466.jpg").convert("RGB"))
    cuts_m10a = split_row_by_dp_seams(m10a_im, num_chars=5)
    for i in range(5):
        anime_cutouts[91 + i] = clean_cutout_specks(cuts_m10a[i], keep_only_main=True)

    m10b = np.array(remove_white_bg_clean(Image.open(brain_dir / "anime_10b_mecha_v2_1793146778631.jpg").convert("RGB")))
    # #096 Siege Engine
    c96_arr = m10b[:, 0:346].copy()
    for y in range(768):
        for x in range(290, 346):
            r, g, b, a = [int(v) for v in c96_arr[y, x]]
            if a > 0 and (b > r + 15 and g > r + 10):
                c96_arr[y, x, 3] = 0
        if y < 225 or y > 475:
            c96_arr[y, 298:, 3] = 0
    anime_cutouts[96] = clean_cutout_specks(Image.fromarray(c96_arr), keep_only_main=True)

    # #097 Hyperion Prime
    c97_arr = m10b[:, 295:642].copy()
    for y in range(768):
        for x in range(c97_arr.shape[1]):
            gx = x + 295
            r, g, b, a = [int(v) for v in c97_arr[y, x]]
            if a == 0:
                continue
            if gx < 358 or gx > 576:
                if not (g > 165 and b > 180 and b > r + 40):
                    c97_arr[y, x, 3] = 0
            elif 300 <= y <= 450 and (gx < 366 or gx > 568):
                if r < 140 and g < 150 and b < 160:
                    c97_arr[y, x, 3] = 0
    anime_cutouts[97] = clean_cutout_specks(Image.fromarray(c97_arr), keep_only_main=True)

    # #098 Ironclad
    c98_arr = m10b[:, 592:848].copy()
    ic_cx = 719 - 592
    for y in range(768):
        for dx in range(1, ic_cx + 1):
            if ic_cx + dx < c98_arr.shape[1]:
                c98_arr[y, ic_cx - dx] = c98_arr[y, ic_cx + dx]
    anime_cutouts[98] = clean_cutout_specks(Image.fromarray(c98_arr), keep_only_main=True)

    # #099 Magitech Golem
    c99_arr = m10b[:, 850:1142].copy()
    mg_cx = 996 - 850
    for y in range(768):
        for dx in range(1, mg_cx + 1):
            if mg_cx + dx < c99_arr.shape[1]:
                c99_arr[y, mg_cx + dx] = c99_arr[y, mg_cx - dx]
    anime_cutouts[99] = clean_cutout_specks(Image.fromarray(c99_arr), keep_only_main=True)

    # #100 Omega Weapon
    c100_arr = m10b[:, 1102:1376].copy()
    om_cx = 1243 - 1102
    for y in range(768):
        for dx in range(1, om_cx + 1):
            if om_cx + dx < c100_arr.shape[1]:
                c100_arr[y, om_cx - dx] = c100_arr[y, om_cx + dx]
    anime_cutouts[100] = clean_cutout_specks(Image.fromarray(c100_arr), keep_only_main=True)

    # 10.5 DRAGON V2 (#101..#110)
    for fname, start_id in [
        ("anime_11a_dragon_v2_1793146754296.jpg", 101),
        ("anime_11b_dragon_v2_1793146796876.jpg", 106),
    ]:
        dr_im = remove_white_bg_clean(Image.open(brain_dir / fname).convert("RGB"))
        dr_cuts = split_row_by_dp_seams(dr_im, num_chars=5)
        for i, c in enumerate(dr_cuts):
            cid = start_id + i
            anime_cutouts[cid] = clean_cutout_specks(c, keep_only_main=(cid != 110))
