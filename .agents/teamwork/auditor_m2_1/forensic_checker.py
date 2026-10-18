#!/usr/bin/env python3
"""
Forensic Integrity Audit Script for Milestone 2 & 3
SNSHero 110-Hero Character Illustration Remaster

Auditor: auditor_m2_1
Target: Commit a159f7a8, Worker M2 scripts, binary sprite sheets, test suite integrity
"""

import os
import sys
import json
import struct
import hashlib
from pathlib import Path
from PIL import Image
import numpy as np

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
PUBLIC_DIR = PROJECT_ROOT / "public"
SEAT_DIR = PUBLIC_DIR / "seat"
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"

FACTION_DEFINITIONS = {
    "water": {"id_range": (1, 10), "sheet_filename": "character_sheet_water.png"},
    "fire": {"id_range": (11, 20), "sheet_filename": "character_sheet_fire.png"},
    "wind": {"id_range": (21, 30), "sheet_filename": "character_sheet_wind.png"},
    "earth": {"id_range": (31, 40), "sheet_filename": "character_sheet_earth.png"},
    "human": {"id_range": (41, 50), "sheet_filename": "character_sheet_human.png"},
    "undead": {"id_range": (51, 60), "sheet_filename": "character_sheet_undead.png"},
    "elf": {"id_range": (61, 70), "sheet_filename": "character_sheet_elf.png"},
    "hobbit": {"id_range": (71, 80), "sheet_filename": "character_sheet_hobbit.png"},
    "beast": {"id_range": (81, 90), "sheet_filename": "character_sheet_beast.png"},
    "mecha": {"id_range": (91, 100), "sheet_filename": "character_sheet_mecha.png"},
    "dragon": {"id_range": (101, 110), "sheet_filename": "character_sheet_dragon.png"},
}


def load_card_dataset():
    dataset_path = PROJECT_ROOT / ".agents/teamwork/explorer_survey_1/cards_dataset.json"
    if not dataset_path.exists():
        raise FileNotFoundError(f"cards_dataset.json missing at {dataset_path}")
    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    cards = data.get("cards", [])
    return sorted(cards, key=lambda c: c["id"])


def compute_sha256(filepath):
    with open(filepath, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def calculate_ncc(img1, img2):
    """Calculates Normalized Cross-Correlation similarity on grayscale resized images."""
    im1 = img1.convert("L").resize((64, 64))
    im2 = img2.convert("L").resize((64, 64))
    arr1 = np.asarray(im1, dtype=np.float32)
    arr2 = np.asarray(im2, dtype=np.float32)

    norm1 = np.linalg.norm(arr1)
    norm2 = np.linalg.norm(arr2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.sum(arr1 * arr2) / (norm1 * norm2))


def parse_png_ihdr(filepath):
    with open(filepath, "rb") as f:
        magic = f.read(8)
        if magic != PNG_MAGIC:
            return None, f"Invalid magic: {magic[:4]}"
        length_bytes = f.read(4)
        length = struct.unpack(">I", length_bytes)[0]
        chunk_type = f.read(4)
        if chunk_type != b"IHDR":
            return None, f"First chunk is {chunk_type}, expected IHDR"
        data = f.read(length)
        w, h, bit_depth, color_type, comp, filt, interlace = struct.unpack(">IIBBBBB", data[:13])
        return {
            "width": w,
            "height": h,
            "bit_depth": bit_depth,
            "color_type": color_type,
            "compression": comp,
            "filter": filt,
            "interlace": interlace,
        }, None


def run_audit():
    findings = []
    cards = load_card_dataset()
    card_map = {c["id"]: c for c in cards}

    print("=================================================================")
    print(" FORENSIC INTEGRITY AUDIT: Milestone 2 & 3 Work Product")
    print("=================================================================")

    # -------------------------------------------------------------
    # 1. Master Sprite Sheets Binary & Budget Inspection
    # -------------------------------------------------------------
    master_targets = [
        ("cards1.png", 1000, 1000, 819200),
        ("cards2.png", 1000, 1000, 819200),
        ("card100.png", 1135, 1315, 819200),
        ("card100_gemini.png", 1024, 1024, 819200),
    ]

    master_results = {}
    for fn, exp_w, exp_h, max_sz in master_targets:
        p = PUBLIC_DIR / fn
        sz = p.stat().st_size
        ihdr, err = parse_png_ihdr(p)
        with Image.open(p) as img:
            format_name = img.format
            mode = img.mode
            real_size = img.size

        pass_magic = (ihdr is not None)
        pass_dim = (real_size == (exp_w, exp_h))
        pass_sz = (sz <= max_sz)
        pass_fmt = (format_name == "PNG")

        master_results[fn] = {
            "size": sz,
            "max_size": max_sz,
            "size_pass": pass_sz,
            "dimensions": real_size,
            "expected_dimensions": (exp_w, exp_h),
            "dim_pass": pass_dim,
            "format": format_name,
            "mode": mode,
            "ihdr": ihdr,
            "pass_all": pass_magic and pass_dim and pass_sz and pass_fmt,
        }

        status_str = "PASS" if master_results[fn]["pass_all"] else "FAIL"
        print(f"[{status_str}] Master Sheet {fn:18s}: {sz:,} B (budget <= {max_sz:,} B), size {real_size}, format {format_name}, mode {mode}")
        if not master_results[fn]["pass_all"]:
            findings.append(f"Master Sheet failure on {fn}: {master_results[fn]}")

    # -------------------------------------------------------------
    # 2. Faction Horizontal Sheets Binary & Budget Inspection
    # -------------------------------------------------------------
    faction_results = {}
    for fkey, fdef in FACTION_DEFINITIONS.items():
        fn = fdef["sheet_filename"]
        p = PUBLIC_DIR / fn
        sz = p.stat().st_size
        max_sz = 307200
        ihdr, err = parse_png_ihdr(p)
        with Image.open(p) as img:
            format_name = img.format
            mode = img.mode
            real_size = img.size

        pass_magic = (ihdr is not None)
        pass_dim = (real_size == (2560, 296))
        pass_sz = (sz <= max_sz)
        pass_fmt = (format_name == "PNG")

        faction_results[fn] = {
            "size": sz,
            "max_size": max_sz,
            "size_pass": pass_sz,
            "dimensions": real_size,
            "format": format_name,
            "mode": mode,
            "pass_all": pass_magic and pass_dim and pass_sz and pass_fmt,
        }
        status_str = "PASS" if faction_results[fn]["pass_all"] else "FAIL"
        print(f"[{status_str}] Faction Sheet {fn:28s}: {sz:,} B (budget <= {max_sz:,} B), size {real_size}, format {format_name}, mode {mode}")
        if not faction_results[fn]["pass_all"]:
            findings.append(f"Faction Sheet failure on {fn}: {faction_results[fn]}")

    # -------------------------------------------------------------
    # 3. Exhaustive Pixel Parity & Cross-Asset Alignment (All 110 Cards)
    # -------------------------------------------------------------
    print("\n--- Exhaustive Cross-Asset Pixel Alignment (110 Cards) ---")
    seat_imgs = {}
    for cid in range(1, 111):
        card = card_map[cid]
        safe_name = card["title_en"].replace(" ", "_")
        seat_p = SEAT_DIR / f"{safe_name}.png"
        assert seat_p.exists(), f"Seat image {seat_p} missing!"
        seat_imgs[cid] = Image.open(seat_p).convert("RGBA")

    # Open master sheets
    c1_img = Image.open(PUBLIC_DIR / "cards1.png").convert("RGBA")
    c2_img = Image.open(PUBLIC_DIR / "cards2.png").convert("RGBA")
    c100_img = Image.open(PUBLIC_DIR / "card100.png").convert("RGBA")
    cgem_img = Image.open(PUBLIC_DIR / "card100_gemini.png").convert("RGBA")

    # Open all faction sheets
    faction_imgs = {
        fkey: Image.open(PUBLIC_DIR / fdef["sheet_filename"]).convert("RGBA")
        for fkey, fdef in FACTION_DEFINITIONS.items()
    }

    alignment_scores = []
    failed_alignments = []

    for cid in range(1, 111):
        seat_im = seat_imgs[cid]
        faction_idx = (cid - 1) // 10
        fkey = list(FACTION_DEFINITIONS.keys())[faction_idx]
        f_sheet = faction_imgs[fkey]

        # 1. Faction sheet cell
        f_col = (cid - 1) % 10
        f_cell = f_sheet.crop((f_col * 256, 0, (f_col + 1) * 256, 296))
        sim_faction = calculate_ncc(seat_im, f_cell)

        # 2. cards1 / cards2 cell
        if cid <= 100:
            idx = cid - 1
            col = idx % 10
            row = idx // 10
            c_cell = c1_img.crop((col * 100, row * 100, (col + 1) * 100, (row + 1) * 100))
            sim_primary = calculate_ncc(seat_im, c_cell)
        else:
            col = (cid - 101) % 10
            c_cell = c2_img.crop((col * 100, 0, (col + 1) * 100, 100))
            sim_primary = calculate_ncc(seat_im, c_cell)

        # 3. card100 cell
        idx = cid - 1
        col = idx % 10
        row = idx // 10
        x0 = int(round(col * 113.5))
        x1 = int(round((col + 1) * 113.5))
        y0 = int(round(row * (1315 / 11)))
        y1 = int(round((row + 1) * (1315 / 11)))
        c100_cell = c100_img.crop((x0, y0, x1, y1))
        sim_c100 = calculate_ncc(seat_im, c100_cell)

        # 4. card100_gemini cell
        gx0 = int(round(col * 102.4))
        gx1 = int(round((col + 1) * 102.4))
        gy0 = int(round(row * (1024 / 11)))
        gy1 = int(round((row + 1) * (1024 / 11)))
        cgem_cell = cgem_img.crop((gx0, gy0, gx1, gy1))
        sim_cgem = calculate_ncc(seat_im, cgem_cell)

        # Criteria:
        # Faction similarity: exact 1:1 placement should be > 0.95
        # Primary similarity: aspect-fill cropped should be > 0.90
        # card100 / gemini: aspect-fill cropped should be > 0.90
        if sim_faction < 0.95 or sim_primary < 0.90 or sim_c100 < 0.90 or sim_cgem < 0.90:
            failed_alignments.append({
                "id": cid,
                "name": card_map[cid]["title_en"],
                "sim_faction": sim_faction,
                "sim_primary": sim_primary,
                "sim_c100": sim_c100,
                "sim_cgem": sim_cgem,
            })
        alignment_scores.append((cid, sim_faction, sim_primary, sim_c100, sim_cgem))

    min_faction = min(s[1] for s in alignment_scores)
    avg_faction = sum(s[1] for s in alignment_scores) / len(alignment_scores)
    min_primary = min(s[2] for s in alignment_scores)
    avg_primary = sum(s[2] for s in alignment_scores) / len(alignment_scores)
    min_c100 = min(s[3] for s in alignment_scores)
    avg_c100 = sum(s[3] for s in alignment_scores) / len(alignment_scores)
    min_cgem = min(s[4] for s in alignment_scores)
    avg_cgem = sum(s[4] for s in alignment_scores) / len(alignment_scores)

    print(f"Faction Cell Similarity (110 cards) : Min = {min_faction:.4f}, Avg = {avg_faction:.4f}")
    print(f"Primary Cell Similarity (110 cards) : Min = {min_primary:.4f}, Avg = {avg_primary:.4f}")
    print(f"card100 Cell Similarity (110 cards) : Min = {min_c100:.4f}, Avg = {avg_c100:.4f}")
    print(f"Gemini Cell Similarity (110 cards)  : Min = {min_cgem:.4f}, Avg = {avg_cgem:.4f}")

    if failed_alignments:
        print(f"FAILED Alignments count: {len(failed_alignments)}")
        findings.append(f"Card alignment below threshold: {failed_alignments[:5]}")
    else:
        print("All 110 cards across all 4 surfaces demonstrated exceptional pixel correspondence (> 0.90)!")

    # -------------------------------------------------------------
    # 4. cards2.png Legacy Minigame Sprite Preservation (Rows 1–9)
    # -------------------------------------------------------------
    print("\n--- cards2.png Rows 1–9 Legacy Preservation Check ---")
    # Verify rows 1-9 (y=100 to y=1000)
    lower_c2 = c2_img.crop((0, 100, 1000, 1000))
    arr_c2 = np.asarray(lower_c2)
    # Check non-blankness and variance across rows 1-9
    c2_std = np.std(arr_c2)
    unique_colors = len(np.unique(arr_c2.reshape(-1, arr_c2.shape[-1]), axis=0))
    print(f"cards2 Rows 1-9 Pixel Std Dev: {c2_std:.2f}, Unique colors in 90 cells: {unique_colors}")
    if c2_std < 20.0 or unique_colors < 50:
        findings.append(f"cards2.png Rows 1-9 appear blank or flat! Std={c2_std}, unique={unique_colors}")
    else:
        print("cards2.png Rows 1-9 contain rich legacy minigame sprites (PASS)!")

    # -------------------------------------------------------------
    # 5. Header Corruption Repair Verification
    # -------------------------------------------------------------
    print("\n--- Header Corruption Repair Check ---")
    for f_target in ["character_sheet_fire.png", "character_sheet_hobbit.png", "character_sheet_mecha.png", "card100_gemini.png"]:
        p = PUBLIC_DIR / f_target
        with open(p, "rb") as f:
            header8 = f.read(8)
        assert header8 == PNG_MAGIC, f"{f_target} still has corrupted header: {header8}"
        print(f"Verified pristine header for previously corrupted/disguised {f_target}: {header8}")

    # -------------------------------------------------------------
    # Summary & Output JSON
    # -------------------------------------------------------------
    out_report = {
        "master_results": master_results,
        "faction_results": faction_results,
        "alignment_summary": {
            "min_faction": min_faction,
            "avg_faction": avg_faction,
            "min_primary": min_primary,
            "avg_primary": avg_primary,
            "min_c100": min_c100,
            "avg_c100": avg_c100,
            "min_cgem": min_cgem,
            "avg_cgem": avg_cgem,
        },
        "findings": findings,
        "verdict": "CLEAN" if len(findings) == 0 else "INTEGRITY VIOLATION",
    }

    report_path = PROJECT_ROOT / ".agents/teamwork/auditor_m2_1/forensic_data.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(out_report, f, indent=2)
    print(f"\nAudit complete. Verdict: {out_report['verdict']}. Output written to {report_path}")
    return out_report


if __name__ == "__main__":
    run_audit()
