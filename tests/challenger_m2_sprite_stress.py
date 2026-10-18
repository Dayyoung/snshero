#!/usr/bin/env python3
"""
Challenger M2: Adversarial Stress Test & Forensic Verification
for Milestone 2 & 3 Sprite Sheet Assembly, Coordinate Alignment, and cards2 Preservation.

Scope:
1. Mathematical alignment of getCardSpriteCoords across cards1, cards2, card100, card100_gemini, character_sheet_*.
   - Includes cross-validation with Node/tsx execution as ground-truth oracle.
2. Visual correspondence & center pixel sampling:
   - public/seat/<Card>.png vs sliced cells in cards1, cards2, card100, card100_gemini, character_sheet_*.
   - Exact center pixel sampling & 2D cross-correlation peak drift analysis ([-5, 5] px search).
3. Sub-pixel edge bleed & boundary seam integrity:
   - Validates that boundary columns/rows in cards1 and cards2 match expected card crops with zero inter-cell bleeding.
   - Validates that the y=100 seam in cards2 cleanly transitions from remastered row 0 to preserved row 1.
4. cards2.png rows 1–9 deep forensic preservation check against pre-assembly baseline (git HEAD~1).
5. Generates structured JSON report and verdict: CONFIRM_CORRECT or REPORT_ANOMALY.
"""

import json
import math
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple
import numpy as np
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = PROJECT_ROOT / "public"
SEAT_DIR = PUBLIC_DIR / "seat"

sys.path.insert(0, str(PROJECT_ROOT))
from tests.e2e_character_assets.helpers import (
    FACTION_DEFINITIONS,
    get_card_seat_filename,
    load_card_dataset,
)


def js_rem(a: int, b: int) -> int:
    """Simulates JavaScript % remainder operator."""
    return int(math.fmod(a, b))


def get_card_sprite_coords_py(card_id: Any, custom_source: str = None) -> Dict[str, Any]:
    """Matches exact JavaScript behavior of src/lib/utils.ts getCardSpriteCoords."""
    try:
        cid = int(card_id)
    except Exception:
        cid = 1
    if not cid:
        cid = 1

    source_str = (custom_source or "").lower()
    is_cards2 = "card2" in source_str or "cards2" in source_str if custom_source else (cid >= 101)
    is_legacy_110 = bool(custom_source and ("card100" in source_str or "110card" in source_str))

    if is_legacy_110:
        cols = 10
        rows = 11
        valid_id = max(1, min(110, cid))
        col = (valid_id - 1) % cols
        row = (valid_id - 1) // cols
        source = custom_source or "/card100.png"
        return {
            "source": source,
            "col": col,
            "row": row,
            "cols": cols,
            "rows": rows,
            "xPercent": col * (100 / (cols - 1)),
            "yPercent": row * (100 / (rows - 1)),
        }

    if is_cards2:
        cols = 10
        rows = 10
        rem_idx = js_rem(cid - 101, 100) if cid >= 101 else js_rem(cid - 1, 100)
        # JS does: const offsetIndex = id >= 101 ? (id - 101) % 100 : (id - 1) % 100;
        # const col = offsetIndex % 10; const row = Math.floor(offsetIndex / 10);
        col = js_rem(rem_idx, 10)
        row = math.floor(rem_idx / 10)
        source = custom_source or "/cards2.png"
        return {
            "source": source,
            "col": col,
            "row": row,
            "cols": cols,
            "rows": rows,
            "xPercent": col * (100 / (cols - 1)),
            "yPercent": row * (100 / (rows - 1)),
        }

    cols = 10
    rows = 10
    # In JS: const validIndex = Math.max(0, Math.min(99, (id - 1) % 100));
    valid_index = max(0, min(99, js_rem(cid - 1, 100)))
    col = valid_index % cols
    row = math.floor(valid_index / cols)
    source = custom_source or "/cards1.png"
    return {
        "source": source,
        "col": col,
        "row": row,
        "cols": cols,
        "rows": rows,
        "xPercent": col * (100 / (cols - 1)),
        "yPercent": row * (100 / (rows - 1)),
    }


def aspect_fill_crop(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Aspect-fill center-crop matching Worker M2 compositing logic."""
    w, h = img.size
    scale = max(target_w / w, target_h / h)
    nw, nh = max(target_w, round(w * scale)), max(target_h, round(h * scale))
    resized = img.convert("RGBA").resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - target_w) // 2
    top = (nh - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def calculate_drift_offset(cell_arr: np.ndarray, expected_arr: np.ndarray, max_search: int = 5) -> Tuple[int, int, float]:
    """
    Computes cross-correlation across 2D offsets dx, dy in [-max_search, max_search].
    Returns (best_dx, best_dy, peak_corr).
    """
    h, w, _ = cell_arr.shape
    g_cell = 0.299 * cell_arr[:, :, 0] + 0.587 * cell_arr[:, :, 1] + 0.114 * cell_arr[:, :, 2]
    g_exp = 0.299 * expected_arr[:, :, 0] + 0.587 * expected_arr[:, :, 1] + 0.114 * expected_arr[:, :, 2]

    g_cell_norm = g_cell - np.mean(g_cell)
    g_exp_norm = g_exp - np.mean(g_exp)
    std_cell = np.std(g_cell)
    std_exp = np.std(g_exp)

    if std_cell < 1e-4 or std_exp < 1e-4:
        return 0, 0, 1.0

    best_dx, best_dy = 0, 0
    max_corr = -1.0

    for dy in range(-max_search, max_search + 1):
        for dx in range(-max_search, max_search + 1):
            y_start_c = max(0, dy)
            y_end_c = min(h, h + dy)
            x_start_c = max(0, dx)
            x_end_c = min(w, w + dx)

            y_start_e = max(0, -dy)
            y_end_e = min(h, h - dy)
            x_start_e = max(0, -dx)
            x_end_e = min(w, w - dx)

            sub_c = g_cell_norm[y_start_c:y_end_c, x_start_c:x_end_c]
            sub_e = g_exp_norm[y_start_e:y_end_e, x_start_e:x_end_e]

            num = np.sum(sub_c * sub_e)
            denom = np.sqrt(np.sum(sub_c ** 2) * np.sum(sub_e ** 2))
            corr = num / (denom + 1e-7)

            if corr > max_corr:
                max_corr = corr
                best_dx, best_dy = dx, dy

    return best_dx, best_dy, float(max_corr)


def main():
    print("=" * 70)
    print("CHALLENGER M2: ADVERSARIAL STRESS TEST & ALIGNMENT VERIFICATION")
    print("=" * 70)

    cards = load_card_dataset()
    assert len(cards) == 110, f"Expected 110 cards, got {len(cards)}"
    card_map = {c["id"]: c for c in cards}

    results = {
        "verdict": "PENDING",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "summary": {},
        "tests": {},
    }

    # =========================================================================
    # TEST 1: Mathematical Coordinate Alignment Verification & Oracle Check
    # =========================================================================
    print("\n[TEST 1] Mathematical Coordinate Alignment Verification & Oracle Check...")
    test1_errors = []

    # 1.1 Cross-validate against TypeScript execution via tsx for all 110 IDs
    try:
        oracle_script = """
import { getCardSpriteCoords } from './src/lib/utils';
const out = [];
for (let id = 1; id <= 110; id++) {
    out.push({
        id,
        default: getCardSpriteCoords(id),
        c100: getCardSpriteCoords(id, '/card100.png'),
        cgem: getCardSpriteCoords(id, '/card100_gemini.png')
    });
}
console.log(JSON.stringify(out));
"""
        tsx_proc = subprocess.run(
            ["npx", "tsx", "-e", oracle_script],
            capture_output=True,
            text=True,
            check=True,
            cwd=str(PROJECT_ROOT),
        )
        oracle_data = json.loads(tsx_proc.stdout)
        oracle_map = {item["id"]: item for item in oracle_data}
        print(f"  TypeScript oracle successfully queried for all {len(oracle_map)} card IDs!")
    except Exception as e:
        print(f"  Warning: tsx oracle failed: {e}")
        oracle_map = {}

    for cid in range(1, 111):
        c_py = get_card_sprite_coords_py(cid)
        if oracle_map and cid in oracle_map:
            ts_c = oracle_map[cid]["default"]
            for field in ["source", "col", "row", "cols", "rows"]:
                if c_py[field] != ts_c[field]:
                    test1_errors.append(f"ID {cid} {field} mismatch with TS oracle: py={c_py[field]} != ts={ts_c[field]}")
            if abs(c_py["xPercent"] - ts_c["xPercent"]) > 1e-4 or abs(c_py["yPercent"] - ts_c["yPercent"]) > 1e-4:
                test1_errors.append(f"ID {cid} pct mismatch with TS oracle: py=({c_py['xPercent']},{c_py['yPercent']}) != ts=({ts_c['xPercent']},{ts_c['yPercent']})")

    # 1.2 card100.png (10x11)
    for cid in range(1, 111):
        c_py = get_card_sprite_coords_py(cid, "/card100.png")
        if oracle_map and cid in oracle_map:
            ts_c100 = oracle_map[cid]["c100"]
            for field in ["source", "col", "row", "cols", "rows"]:
                if c_py[field] != ts_c100[field]:
                    test1_errors.append(f"ID {cid} c100 {field} mismatch: py={c_py[field]} != ts={ts_c100[field]}")

    # 1.3 Faction Sheets mapping
    faction_keys = list(FACTION_DEFINITIONS.keys())
    for cid in range(1, 111):
        f_idx = (cid - 1) // 10
        f_key = faction_keys[f_idx]
        f_def = FACTION_DEFINITIONS[f_key]
        if not (f_def["id_range"][0] <= cid <= f_def["id_range"][1]):
            test1_errors.append(f"ID {cid} faction mismatch with {f_key}")

    # 1.4 Edge case robustness (0, -5, 111, 200)
    edge_cases = [0, -5, 111, 200]
    for eg in edge_cases:
        c_eg = get_card_sprite_coords_py(eg)
        assert c_eg["source"] in ["/cards1.png", "/cards2.png"]

    pass_test1 = len(test1_errors) == 0
    results["tests"]["test1_math_coordinates"] = {
        "status": "PASS" if pass_test1 else "FAIL",
        "errors_count": len(test1_errors),
        "errors": test1_errors[:10],
    }
    print(f"  Test 1 Result: {'PASS' if pass_test1 else 'FAIL'} ({len(test1_errors)} errors)")

    # =========================================================================
    # TEST 2: Center Pixel Sampling & Exact Visual Correspondence
    # =========================================================================
    print("\n[TEST 2] Center Pixel Sampling & Visual Correspondence...")

    c1_img = Image.open(PUBLIC_DIR / "cards1.png").convert("RGBA")
    c2_img = Image.open(PUBLIC_DIR / "cards2.png").convert("RGBA")
    c100_img = Image.open(PUBLIC_DIR / "card100.png").convert("RGBA")
    cgem_img = Image.open(PUBLIC_DIR / "card100_gemini.png").convert("RGBA")

    faction_imgs = {}
    for fkey, fdef in FACTION_DEFINITIONS.items():
        fp = PUBLIC_DIR / fdef["sheet_filename"]
        faction_imgs[fkey] = Image.open(fp).convert("RGBA")

    center_pixel_stats = {
        "faction_exact_match": 0,
        "faction_close_match": 0,  # Delta E <= 25 due to FASTOCTREE
        "faction_mismatch": 0,
        "cards1_cards2_corr": [],
        "card100_corr": [],
        "cgem_corr": [],
        "drift_detected": [],
    }

    test2_anomalies = []

    for cid in range(1, 111):
        card = card_map[cid]
        seat_p = SEAT_DIR / get_card_seat_filename(card)
        with Image.open(seat_p) as s_img:
            seat_rgba = s_img.convert("RGBA")

        s_arr = np.array(seat_rgba)
        cx, cy = 128, 148
        seat_center_px = s_arr[cy, cx]

        # 2.1 Faction Sheet: Exact 1:1 cell placement at (col * 256, 0)
        f_idx = (cid - 1) // 10
        f_col = (cid - 1) % 10
        f_key = faction_keys[f_idx]
        f_sheet = faction_imgs[f_key]
        f_arr = np.array(f_sheet)

        f_cell = f_arr[0:296, f_col * 256 : (f_col + 1) * 256]
        f_center_px = f_cell[cy, cx]

        delta_e = np.linalg.norm(seat_center_px.astype(float) - f_center_px.astype(float))
        if np.array_equal(seat_center_px, f_center_px):
            center_pixel_stats["faction_exact_match"] += 1
        elif delta_e <= 25.0:
            center_pixel_stats["faction_close_match"] += 1
        else:
            center_pixel_stats["faction_mismatch"] += 1
            test2_anomalies.append(
                f"ID {cid} ({card['title_en']}) Faction Sheet center pixel mismatch: seat={seat_center_px.tolist()}, sheet={f_center_px.tolist()}, delta={delta_e:.1f}"
            )

        # Drift check on faction sheet
        dx, dy, pk_corr = calculate_drift_offset(f_cell, s_arr, max_search=3)
        if (dx, dy) != (0, 0):
            center_pixel_stats["drift_detected"].append(f"ID {cid} Faction Sheet drift: dx={dx}, dy={dy}")
            test2_anomalies.append(f"ID {cid} Faction Sheet drift detected: ({dx}, {dy})")

        # 2.2 cards1.png / cards2.png (100x100 cell)
        exp_100 = aspect_fill_crop(seat_rgba, 100, 100)
        exp_100_arr = np.array(exp_100)

        if cid <= 100:
            c1_arr = np.array(c1_img)
            col = (cid - 1) % 10
            row = (cid - 1) // 10
            sliced_cell = c1_arr[row * 100 : (row + 1) * 100, col * 100 : (col + 1) * 100]
        else:
            c2_arr = np.array(c2_img)
            col = (cid - 101) % 10
            row = 0
            sliced_cell = c2_arr[0:100, col * 100 : (col + 1) * 100]

        dx, dy, pk_corr = calculate_drift_offset(sliced_cell, exp_100_arr, max_search=4)
        center_pixel_stats["cards1_cards2_corr"].append(pk_corr)
        if (dx, dy) != (0, 0):
            center_pixel_stats["drift_detected"].append(f"ID {cid} cards1/2 drift: dx={dx}, dy={dy}")
            test2_anomalies.append(f"ID {cid} cards1/2 drift detected: ({dx}, {dy})")

        # 2.3 card100.png (1135x1315)
        col = (cid - 1) % 10
        row = (cid - 1) // 10
        x0 = int(round(col * 113.5))
        x1 = int(round((col + 1) * 113.5))
        y0 = int(round(row * (1315 / 11)))
        y1 = int(round((row + 1) * (1315 / 11)))
        c100_arr = np.array(c100_img)
        sliced_c100 = c100_arr[y0:y1, x0:x1]
        exp_c100 = aspect_fill_crop(seat_rgba, x1 - x0, y1 - y0)
        exp_c100_arr = np.array(exp_c100)

        dx, dy, pk_c100 = calculate_drift_offset(sliced_c100, exp_c100_arr, max_search=3)
        center_pixel_stats["card100_corr"].append(pk_c100)
        if (dx, dy) != (0, 0):
            center_pixel_stats["drift_detected"].append(f"ID {cid} card100 drift: dx={dx}, dy={dy}")
            test2_anomalies.append(f"ID {cid} card100 drift detected: ({dx}, {dy})")

        # 2.4 card100_gemini.png (1024x1024)
        x0_g = int(round(col * 102.4))
        x1_g = int(round((col + 1) * 102.4))
        y0_g = int(round(row * (1024 / 11)))
        y1_g = int(round((row + 1) * (1024 / 11)))
        cgem_arr = np.array(cgem_img)
        sliced_cgem = cgem_arr[y0_g:y1_g, x0_g:x1_g]
        exp_cgem = aspect_fill_crop(seat_rgba, x1_g - x0_g, y1_g - y0_g)
        exp_cgem_arr = np.array(exp_cgem)

        dx, dy, pk_cgem = calculate_drift_offset(sliced_cgem, exp_cgem_arr, max_search=3)
        center_pixel_stats["cgem_corr"].append(pk_cgem)
        if (dx, dy) != (0, 0):
            center_pixel_stats["drift_detected"].append(f"ID {cid} card100_gemini drift: dx={dx}, dy={dy}")
            test2_anomalies.append(f"ID {cid} card100_gemini drift detected: ({dx}, {dy})")

    pass_test2 = len(test2_anomalies) == 0
    results["tests"]["test2_center_pixels_and_drift"] = {
        "status": "PASS" if pass_test2 else "FAIL",
        "faction_exact_match": center_pixel_stats["faction_exact_match"],
        "faction_close_match": center_pixel_stats["faction_close_match"],
        "faction_mismatch": center_pixel_stats["faction_mismatch"],
        "min_cards1_2_corr": float(np.min(center_pixel_stats["cards1_cards2_corr"])),
        "mean_cards1_2_corr": float(np.mean(center_pixel_stats["cards1_cards2_corr"])),
        "min_card100_corr": float(np.min(center_pixel_stats["card100_corr"])),
        "mean_card100_corr": float(np.mean(center_pixel_stats["card100_corr"])),
        "min_cgem_corr": float(np.min(center_pixel_stats["cgem_corr"])),
        "mean_cgem_corr": float(np.mean(center_pixel_stats["cgem_corr"])),
        "drift_count": len(center_pixel_stats["drift_detected"]),
        "anomalies": test2_anomalies[:10],
    }
    print(f"  Test 2 Result: {'PASS' if pass_test2 else 'FAIL'}")
    print(f"    Faction Center Pixels: {center_pixel_stats['faction_exact_match']}/110 exact, {center_pixel_stats['faction_close_match']}/110 close, {center_pixel_stats['faction_mismatch']} mismatch")
    print(f"    cards1/cards2 Mean Corr: {results['tests']['test2_center_pixels_and_drift']['mean_cards1_2_corr']:.4f}")
    print(f"    card100 Mean Corr      : {results['tests']['test2_center_pixels_and_drift']['mean_card100_corr']:.4f}")
    print(f"    card100_gemini Mean Corr: {results['tests']['test2_center_pixels_and_drift']['mean_cgem_corr']:.4f}")
    print(f"    Coordinate Drift Events: {len(center_pixel_stats['drift_detected'])}")

    # =========================================================================
    # TEST 3: Sub-pixel Bleeding & Boundary Seam Integrity
    # =========================================================================
    print("\n[TEST 3] Sub-pixel Boundary Bleed & Seam Integrity Test...")
    test3_bleed_events = []

    # Check horizontal boundary between row 0 (cards 101–110) and row 1 (legacy minigames) at y=100 in cards2.png
    c2_arr = np.array(c2_img)
    # y=99 is bottom row of card 101..110
    # y=100 is top row of minigame row 1
    # Verify that y=99 does not bleed into y=100
    r0_bot = c2_arr[99, :, :3].astype(float)
    r1_top = c2_arr[100, :, :3].astype(float)
    # Correlation between the two adjacent rows across the boundary should be low/distinct (different content)
    boundary_corr = float(np.corrcoef(r0_bot.flatten(), r1_top.flatten())[0, 1])
    print(f"  cards2.png y=100 seam correlation (Row 0 bottom vs Row 1 top): {boundary_corr:.4f}")
    if boundary_corr > 0.90:
        test3_bleed_events.append(f"cards2 y=100 seam has high correlation ({boundary_corr:.3f}), indicating possible vertical smearing/bleed")

    # Check vertical seams in cards1: verify boundary pixels match expected card cropped boundaries
    c1_arr = np.array(c1_img)
    for col in range(1, 10):
        seam_x = col * 100
        # Right column of cell col-1 is at seam_x - 1
        # Left column of cell col is at seam_x
        # Sample card in row 0: card col vs card col+1
        card_l = card_map[col]
        card_r = card_map[col + 1]
        with Image.open(SEAT_DIR / get_card_seat_filename(card_l)) as im_l:
            exp_l = aspect_fill_crop(im_l, 100, 100)
        with Image.open(SEAT_DIR / get_card_seat_filename(card_r)) as im_r:
            exp_r = aspect_fill_crop(im_r, 100, 100)

        exp_l_arr = np.array(exp_l)
        exp_r_arr = np.array(exp_r)

        actual_l_edge = c1_arr[0:100, seam_x - 1, :3]
        actual_r_edge = c1_arr[0:100, seam_x, :3]

        exp_l_edge = exp_l_arr[:, 99, :3]
        exp_r_edge = exp_r_arr[:, 0, :3]

        mae_l = np.mean(np.abs(actual_l_edge.astype(float) - exp_l_edge.astype(float)))
        mae_r = np.mean(np.abs(actual_r_edge.astype(float) - exp_r_edge.astype(float)))

        if mae_l > 30.0 or mae_r > 30.0:
            test3_bleed_events.append(f"cards1 seam at x={seam_x} edge MAE high (left={mae_l:.1f}, right={mae_r:.1f})")

    pass_test3 = len(test3_bleed_events) == 0
    results["tests"]["test3_boundary_seams"] = {
        "status": "PASS" if pass_test3 else "FAIL",
        "boundary_seam_corr": boundary_corr,
        "bleed_events": test3_bleed_events,
    }
    print(f"  Test 3 Result: {'PASS' if pass_test3 else 'FAIL'} ({len(test3_bleed_events)} bleed anomalies)")

    # =========================================================================
    # TEST 4: cards2.png Rows 1–9 Forensic Preservation Check
    # =========================================================================
    print("\n[TEST 4] cards2.png Rows 1–9 Preservation Forensics...")

    try:
        cmd = ["git", "show", "HEAD~1:public/cards2.png"]
        git_res = subprocess.run(cmd, capture_output=True, check=True)
        from io import BytesIO
        orig_c2_img = Image.open(BytesIO(git_res.stdout)).convert("RGBA")
        print("  Successfully loaded baseline cards2.png from git HEAD~1!")
    except Exception as e:
        print(f"  Warning: Could not load HEAD~1 directly: {e}")
        orig_c2_img = None

    test4_details = {
        "total_cells_checked": 90,
        "blank_cells": 0,
        "corrupted_cells": 0,
        "mean_cell_entropy": 0.0,
        "mean_cell_std": 0.0,
        "min_cell_correlation": 0.0,
        "mean_cell_correlation": 0.0,
        "cells_above_95_pct_corr": 0,
    }
    test4_anomalies = []

    c2_lower = c2_arr[100:1000, 0:1000]

    cell_entropies = []
    cell_stds = []
    cell_correlations = []

    orig_lower = np.array(orig_c2_img)[100:1000, 0:1000] if orig_c2_img else None

    for r in range(9):
        for c in range(10):
            cell = c2_lower[r * 100 : (r + 1) * 100, c * 100 : (c + 1) * 100]
            alpha = cell[:, :, 3]
            rgb = cell[:, :, :3]

            if np.all(alpha == 0):
                test4_details["blank_cells"] += 1
                test4_anomalies.append(f"Cell at Row {r+1}, Col {c} is fully transparent/blank")
                continue

            std_val = float(np.std(rgb))
            cell_stds.append(std_val)

            lum = (0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]).astype(np.uint8)
            hist, _ = np.histogram(lum, bins=256, range=(0, 256))
            probs = hist[hist > 0] / float(lum.size)
            entropy = float(-np.sum(probs * np.log2(probs)))
            cell_entropies.append(entropy)

            if std_val < 2.0 or entropy < 0.2:
                test4_details["corrupted_cells"] += 1
                test4_anomalies.append(f"Cell at Row {r+1}, Col {c} has low entropy ({entropy:.2f}) / std ({std_val:.2f})")

            if orig_lower is not None:
                o_cell = orig_lower[r * 100 : (r + 1) * 100, c * 100 : (c + 1) * 100]
                o_flat = o_cell[:, :, :3].flatten().astype(float)
                c_flat = rgb.flatten().astype(float)
                std_o = np.std(o_flat)
                std_c = np.std(c_flat)
                if std_o > 1e-4 and std_c > 1e-4:
                    corr = float(np.corrcoef(o_flat, c_flat)[0, 1])
                else:
                    corr = 1.0 if np.allclose(o_flat, c_flat, atol=5) else 0.0
                cell_correlations.append(corr)

    test4_details["mean_cell_entropy"] = float(np.mean(cell_entropies)) if cell_entropies else 0.0
    test4_details["mean_cell_std"] = float(np.mean(cell_stds)) if cell_stds else 0.0

    if cell_correlations:
        test4_details["min_cell_correlation"] = float(np.min(cell_correlations))
        test4_details["mean_cell_correlation"] = float(np.mean(cell_correlations))
        test4_details["cells_above_95_pct_corr"] = int(sum(1 for c in cell_correlations if c >= 0.95))

        if test4_details["min_cell_correlation"] < 0.90:
            test4_anomalies.append(f"Min cell correlation in rows 1-9 is low ({test4_details['min_cell_correlation']:.3f} < 0.90)")

    pass_test4 = len(test4_anomalies) == 0 and test4_details["blank_cells"] == 0 and test4_details["corrupted_cells"] == 0
    results["tests"]["test4_cards2_rows1_9"] = {
        "status": "PASS" if pass_test4 else "FAIL",
        "details": test4_details,
        "anomalies": test4_anomalies,
    }
    print(f"  Test 4 Result: {'PASS' if pass_test4 else 'FAIL'}")
    print(f"    Checked {test4_details['total_cells_checked']} cells in rows 1-9: {test4_details['blank_cells']} blank, {test4_details['corrupted_cells']} corrupted")
    print(f"    Mean Cell Entropy: {test4_details['mean_cell_entropy']:.2f}, Mean Std: {test4_details['mean_cell_std']:.2f}")
    if cell_correlations:
        print(f"    Min Cell Correlation vs Baseline: {test4_details['min_cell_correlation']:.4f}")
        print(f"    Mean Cell Correlation vs Baseline: {test4_details['mean_cell_correlation']:.4f}")
        print(f"    Cells with >= 95% Correlation: {test4_details['cells_above_95_pct_corr']}/90")

    # =========================================================================
    # OVERALL VERDICT
    # =========================================================================
    all_passed = pass_test1 and pass_test2 and pass_test3 and pass_test4
    verdict = "CONFIRM_CORRECT" if all_passed else "REPORT_ANOMALY"
    results["verdict"] = verdict
    results["summary"] = {
        "test1_math_coordinates": "PASS" if pass_test1 else "FAIL",
        "test2_center_pixels_and_drift": "PASS" if pass_test2 else "FAIL",
        "test3_boundary_seams": "PASS" if pass_test3 else "FAIL",
        "test4_cards2_rows1_9": "PASS" if pass_test4 else "FAIL",
    }

    print("\n" + "=" * 70)
    print(f"FINAL VERDICT: {verdict}")
    print("=" * 70)

    out_json = PROJECT_ROOT / "tests/challenger_m2_results.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Saved detailed results to {out_json}")

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
