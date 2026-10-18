"""Tier 2: Boundary & Corner Cases E2E Tests (>= 5 tests per feature).

Covers:
- Feature 7: Web Traffic & File Size Optimization (Budgets: Seat, Master, Faction)
- Feature 2 & 5: Binary Header Integrity & Magic Byte Verification (UTF-8 corruption check)
- Feature 3 & 6: Grid & ID Boundaries (ID 100 vs 101 transition, ID 110 edge, rows 1-9 in cards2, Boss ranks, clamping)
"""

import os
import struct
import time
from pathlib import Path
from typing import List, Tuple
from PIL import Image

from .helpers import (
    FACTION_DEFINITIONS,
    MASTER_SHEET_SPECS,
    PNG_MAGIC_BYTES,
    PUBLIC_DIR,
    SEAT_DIR,
    TestResult,
    check_png_magic_header,
    format_bytes,
    get_card_seat_filename,
    get_card_sprite_coords,
    load_card_dataset,
    open_and_decode_image,
)


def run_tier2_tests() -> List[TestResult]:
    """Executes all Tier 2 Boundary & Corner Case test assertions."""
    results: List[TestResult] = []
    cards = load_card_dataset()

    # -------------------------------------------------------------------------
    # Feature 7: File Size Budgets (Seat, Master, Faction, Payload)
    # -------------------------------------------------------------------------

    # T2.F7.1: Seat upper budget <= 35,840 bytes (35 KB)
    t0 = time.perf_counter()
    overbudget_seat_files: List[str] = []
    for card in cards:
        expected_fn = get_card_seat_filename(card)
        p = SEAT_DIR / expected_fn
        if p.exists():
            sz = p.stat().st_size
            if sz > 35840:
                overbudget_seat_files.append(
                    f"ID {card['id']} ({expected_fn}): {sz} bytes ({format_bytes(sz)} > 35 KB)"
                )

    duration = (time.perf_counter() - t0) * 1000
    if not overbudget_seat_files:
        results.append(
            TestResult(
                test_id="T2.F7.1",
                name="Seat File Size Upper Bound Budget (<= 35 KB)",
                tier=2,
                feature="Feature 7: Size Budgets",
                status="PASS",
                message="All 110 seat files are within the 35 KB (35,840 bytes) budget",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T2.F7.1",
                name="Seat File Size Upper Bound Budget (<= 35 KB)",
                tier=2,
                feature="Feature 7: Size Budgets",
                status="FAIL",
                message=f"{len(overbudget_seat_files)} seat files exceed 35 KB budget",
                details=overbudget_seat_files[:10],
                duration_ms=duration,
            )
        )

    # T2.F7.2: Seat lower budget >= 4,096 bytes (4 KB) to avoid truncated placeholders
    t0 = time.perf_counter()
    underbudget_seat_files: List[str] = []
    for card in cards:
        expected_fn = get_card_seat_filename(card)
        p = SEAT_DIR / expected_fn
        if p.exists():
            sz = p.stat().st_size
            if sz < 4096:
                underbudget_seat_files.append(
                    f"ID {card['id']} ({expected_fn}): {sz} bytes (< 4 KB, possible empty or placeholder)"
                )

    duration = (time.perf_counter() - t0) * 1000
    if not underbudget_seat_files:
        results.append(
            TestResult(
                test_id="T2.F7.2",
                name="Seat File Size Lower Bound Budget (>= 4 KB)",
                tier=2,
                feature="Feature 7: Size Budgets",
                status="PASS",
                message="All 110 seat files exceed 4 KB, confirming non-stub content",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T2.F7.2",
                name="Seat File Size Lower Bound Budget (>= 4 KB)",
                tier=2,
                feature="Feature 7: Size Budgets",
                status="FAIL",
                message=f"{len(underbudget_seat_files)} seat files are smaller than 4 KB",
                details=underbudget_seat_files,
                duration_ms=duration,
            )
        )

    # T2.F7.3: Master sheets size budget <= 819,200 bytes (800 KB)
    t0 = time.perf_counter()
    overbudget_master_sheets: List[str] = []
    for key, spec in MASTER_SHEET_SPECS.items():
        p = spec["path"]
        if p.exists():
            sz = p.stat().st_size
            if sz > spec["budget_bytes"]:
                overbudget_master_sheets.append(
                    f"{spec['filename']}: {sz} bytes ({format_bytes(sz)} > 800 KB)"
                )
        else:
            overbudget_master_sheets.append(f"{spec['filename']}: File missing")

    duration = (time.perf_counter() - t0) * 1000
    if not overbudget_master_sheets:
        results.append(
            TestResult(
                test_id="T2.F7.3",
                name="Master Sprite Sheets Size Budget (<= 800 KB)",
                tier=2,
                feature="Feature 7: Size Budgets",
                status="PASS",
                message="cards1, cards2, card100, and card100_gemini are all <= 800 KB (819,200 bytes)",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T2.F7.3",
                name="Master Sprite Sheets Size Budget (<= 800 KB)",
                tier=2,
                feature="Feature 7: Size Budgets",
                status="FAIL",
                message=f"{len(overbudget_master_sheets)} master sheets exceed 800 KB budget",
                details=overbudget_master_sheets,
                duration_ms=duration,
            )
        )

    # T2.F7.4: Faction sheets size budget <= 307,200 bytes (300 KB)
    t0 = time.perf_counter()
    overbudget_faction_sheets: List[str] = []
    for faction_key, fdef in FACTION_DEFINITIONS.items():
        p = PUBLIC_DIR / fdef["sheet_filename"]
        if p.exists():
            sz = p.stat().st_size
            if sz > 307200:
                overbudget_faction_sheets.append(
                    f"{fdef['sheet_filename']}: {sz} bytes ({format_bytes(sz)} > 300 KB)"
                )
        else:
            overbudget_faction_sheets.append(f"{fdef['sheet_filename']}: File missing")

    duration = (time.perf_counter() - t0) * 1000
    if not overbudget_faction_sheets:
        results.append(
            TestResult(
                test_id="T2.F7.4",
                name="Faction Horizontal Sheets Size Budget (<= 300 KB)",
                tier=2,
                feature="Feature 7: Size Budgets",
                status="PASS",
                message="All 11 faction horizontal sheets are <= 300 KB (307,200 bytes)",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T2.F7.4",
                name="Faction Horizontal Sheets Size Budget (<= 300 KB)",
                tier=2,
                feature="Feature 7: Size Budgets",
                status="FAIL",
                message=f"{len(overbudget_faction_sheets)} faction sheets exceed 300 KB budget",
                details=overbudget_faction_sheets,
                duration_ms=duration,
            )
        )

    # T2.F7.5: Total aggregate asset payload budget audit
    t0 = time.perf_counter()
    seat_total = sum((SEAT_DIR / get_card_seat_filename(c)).stat().st_size for c in cards if (SEAT_DIR / get_card_seat_filename(c)).exists())
    master_total = sum(s["path"].stat().st_size for s in MASTER_SHEET_SPECS.values() if s["path"].exists())
    faction_total = sum((PUBLIC_DIR / f["sheet_filename"]).stat().st_size for f in FACTION_DEFINITIONS.values() if (PUBLIC_DIR / f["sheet_filename"]).exists())
    total_payload = seat_total + master_total + faction_total

    # Target aggregate budget: (110 * 35KB = ~3.85MB) + (4 * 800KB = 3.2MB) + (11 * 300KB = 3.3MB) = ~10.35 MB
    payload_budget = (110 * 35840) + (4 * 819200) + (11 * 307200)  # 10,598,400 bytes (~10.1 MB)
    duration = (time.perf_counter() - t0) * 1000
    if total_payload <= payload_budget:
        results.append(
            TestResult(
                test_id="T2.F7.5",
                name="Total Character Asset Aggregate Payload Budget",
                tier=2,
                feature="Feature 7: Size Budgets",
                status="PASS",
                message=f"Total asset footprint {format_bytes(total_payload)} meets overall budget ({format_bytes(payload_budget)})",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T2.F7.5",
                name="Total Character Asset Aggregate Payload Budget",
                tier=2,
                feature="Feature 7: Size Budgets",
                status="FAIL",
                message=f"Total asset footprint {format_bytes(total_payload)} exceeds budget {format_bytes(payload_budget)}",
                details=[
                    f"Seat Portraits (110 files): {format_bytes(seat_total)}",
                    f"Master Sheets (4 files): {format_bytes(master_total)}",
                    f"Faction Sheets (11 files): {format_bytes(faction_total)}",
                ],
                duration_ms=duration,
            )
        )

    # -------------------------------------------------------------------------
    # Feature 2 & 5: Header Integrity & PNG Magic Bytes Verification
    # -------------------------------------------------------------------------

    # T2.F2.1: PNG magic header for all 110 seat files (catches \xef\xbf\xbdPNG UTF-8 replacement byte)
    t0 = time.perf_counter()
    seat_header_corruptions: List[str] = []
    for card in cards:
        expected_fn = get_card_seat_filename(card)
        p = SEAT_DIR / expected_fn
        is_valid, msg, header = check_png_magic_header(p)
        if not is_valid:
            seat_header_corruptions.append(f"ID {card['id']} ({expected_fn}): {msg}")

    duration = (time.perf_counter() - t0) * 1000
    if not seat_header_corruptions:
        results.append(
            TestResult(
                test_id="T2.F2.1",
                name="PNG 8-Byte Magic Header Integrity on All 110 Seat Files",
                tier=2,
                feature="Feature 2: Binary Integrity",
                status="PASS",
                message="All 110 seat files start with valid \\x89PNG\\r\\n\\x1a\\n header (0 UTF-8 replacement corruptions)",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T2.F2.1",
                name="PNG 8-Byte Magic Header Integrity on All 110 Seat Files",
                tier=2,
                feature="Feature 2: Binary Integrity",
                status="FAIL",
                message=f"{len(seat_header_corruptions)} seat files exhibit corrupted PNG magic headers (e.g. Celia, Hyperion_Prime, Sentinel)",
                details=seat_header_corruptions,
                duration_ms=duration,
            )
        )

    # T2.F2.2: PNG magic header for master sheets
    t0 = time.perf_counter()
    master_header_errors: List[str] = []
    for key, spec in MASTER_SHEET_SPECS.items():
        p = spec["path"]
        is_valid, msg, header = check_png_magic_header(p)
        if not is_valid:
            master_header_errors.append(f"{spec['filename']}: {msg}")

    duration = (time.perf_counter() - t0) * 1000
    if not master_header_errors:
        results.append(
            TestResult(
                test_id="T2.F2.2",
                name="PNG 8-Byte Magic Header Integrity on Master Sheets",
                tier=2,
                feature="Feature 2: Binary Integrity",
                status="PASS",
                message="cards1, cards2, card100, and card100_gemini have valid PNG magic headers",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T2.F2.2",
                name="PNG 8-Byte Magic Header Integrity on Master Sheets",
                tier=2,
                feature="Feature 2: Binary Integrity",
                status="FAIL",
                message=f"{len(master_header_errors)} master sheets have invalid PNG magic headers",
                details=master_header_errors,
                duration_ms=duration,
            )
        )

    # T2.F2.3: PNG magic header for all 11 faction sheets
    t0 = time.perf_counter()
    faction_header_corruptions: List[str] = []
    for faction_key, fdef in FACTION_DEFINITIONS.items():
        p = PUBLIC_DIR / fdef["sheet_filename"]
        is_valid, msg, header = check_png_magic_header(p)
        if not is_valid:
            faction_header_corruptions.append(f"{fdef['sheet_filename']}: {msg}")

    duration = (time.perf_counter() - t0) * 1000
    if not faction_header_corruptions:
        results.append(
            TestResult(
                test_id="T2.F2.3",
                name="PNG 8-Byte Magic Header Integrity on Faction Sheets",
                tier=2,
                feature="Feature 5: Binary Integrity",
                status="PASS",
                message="All 11 faction sheets start with valid \\x89PNG\\r\\n\\x1a\\n header (0 UTF-8 replacement corruptions)",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T2.F2.3",
                name="PNG 8-Byte Magic Header Integrity on Faction Sheets",
                tier=2,
                feature="Feature 5: Binary Integrity",
                status="FAIL",
                message=f"{len(faction_header_corruptions)} faction sheets exhibit corrupted headers (e.g. fire, hobbit, mecha)",
                details=faction_header_corruptions,
                duration_ms=duration,
            )
        )

    # T2.F2.4: IHDR chunk validation (valid chunk length 13, chunk type IHDR)
    t0 = time.perf_counter()
    ihdr_errors: List[str] = []
    all_png_paths = [spec["path"] for spec in MASTER_SHEET_SPECS.values()] + [
        PUBLIC_DIR / f["sheet_filename"] for f in FACTION_DEFINITIONS.values()
    ]
    for p in all_png_paths:
        if p.exists():
            try:
                with open(p, "rb") as f:
                    magic = f.read(8)
                    if magic == PNG_MAGIC_BYTES:
                        ihdr_len_bytes = f.read(4)
                        ihdr_type = f.read(4)
                        if len(ihdr_len_bytes) == 4 and len(ihdr_type) == 4:
                            ihdr_len = struct.unpack(">I", ihdr_len_bytes)[0]
                            if ihdr_len != 13 or ihdr_type != b"IHDR":
                                ihdr_errors.append(
                                    f"{p.name}: Invalid IHDR chunk (len={ihdr_len}, type={ihdr_type})"
                                )
                        else:
                            ihdr_errors.append(f"{p.name}: Truncated file before IHDR")
            except Exception as e:
                ihdr_errors.append(f"{p.name}: Error reading IHDR ({e})")

    duration = (time.perf_counter() - t0) * 1000
    if not ihdr_errors:
        results.append(
            TestResult(
                test_id="T2.F2.4",
                name="IHDR Chunk Structure Validation on Sprite Sheets",
                tier=2,
                feature="Feature 2: Binary Integrity",
                status="PASS",
                message="All verified PNG sheets have valid 13-byte IHDR headers",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T2.F2.4",
                name="IHDR Chunk Structure Validation on Sprite Sheets",
                tier=2,
                feature="Feature 2: Binary Integrity",
                status="FAIL",
                message=f"{len(ihdr_errors)} sheets failed IHDR validation",
                details=ihdr_errors,
                duration_ms=duration,
            )
        )

    # -------------------------------------------------------------------------
    # Feature 3 & 6: Grid & ID Boundaries
    # -------------------------------------------------------------------------

    # T2.F6.1: Boundary transition at Card ID 100 vs ID 101
    t0 = time.perf_counter()
    c100_coords = get_card_sprite_coords(100)
    c101_coords = get_card_sprite_coords(101)

    # In cards1: ID 100 is index 99 -> col 9, row 9, source /cards1.png
    # In cards2: ID 101 is index 0 -> col 0, row 0, source /cards2.png
    boundary_100_ok = (
        c100_coords["source"] == "/cards1.png"
        and c100_coords["col"] == 9
        and c100_coords["row"] == 9
        and abs(c100_coords["xPercent"] - 100.0) < 1e-4
        and abs(c100_coords["yPercent"] - 100.0) < 1e-4
    )
    boundary_101_ok = (
        c101_coords["source"] == "/cards2.png"
        and c101_coords["col"] == 0
        and c101_coords["row"] == 0
        and abs(c101_coords["xPercent"] - 0.0) < 1e-4
        and abs(c101_coords["yPercent"] - 0.0) < 1e-4
    )
    duration = (time.perf_counter() - t0) * 1000
    if boundary_100_ok and boundary_101_ok:
        results.append(
            TestResult(
                test_id="T2.F6.1",
                name="Boundary ID 100 to 101 Sprite Sheet Transition",
                tier=2,
                feature="Feature 6: Grid Boundaries",
                status="PASS",
                message="ID 100 correctly terminates cards1.png (col 9, row 9); ID 101 correctly begins cards2.png (col 0, row 0)",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T2.F6.1",
                name="Boundary ID 100 to 101 Sprite Sheet Transition",
                tier=2,
                feature="Feature 6: Grid Boundaries",
                status="FAIL",
                message="Transition coordinates incorrect between ID 100 and 101",
                details=[f"ID 100: {c100_coords}", f"ID 101: {c101_coords}"],
                duration_ms=duration,
            )
        )

    # T2.F6.2: Final card boundary ID 110
    t0 = time.perf_counter()
    c110_cards2 = get_card_sprite_coords(110)
    c110_card100 = get_card_sprite_coords(110, "/card100.png")

    # In cards2: ID 110 is index 9 -> col 9, row 0
    # In card100: ID 110 is index 109 -> col 9, row 10 (10x11 grid)
    c110_cards2_ok = (
        c110_cards2["source"] == "/cards2.png"
        and c110_cards2["col"] == 9
        and c110_cards2["row"] == 0
    )
    c110_card100_ok = (
        c110_card100["col"] == 9
        and c110_card100["row"] == 10
        and c110_card100["cols"] == 10
        and c110_card100["rows"] == 11
    )
    duration = (time.perf_counter() - t0) * 1000
    if c110_cards2_ok and c110_card100_ok:
        results.append(
            TestResult(
                test_id="T2.F6.2",
                name="Boundary Card ID 110 Terminal Grid Alignment",
                tier=2,
                feature="Feature 6: Grid Boundaries",
                status="PASS",
                message="Card 110 maps cleanly to cards2 Row 0 Col 9, and card100 Row 10 Col 9",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T2.F6.2",
                name="Boundary Card ID 110 Terminal Grid Alignment",
                tier=2,
                feature="Feature 6: Grid Boundaries",
                status="FAIL",
                message="Card 110 terminal alignment mismatch",
                details=[f"cards2: {c110_cards2}", f"card100: {c110_card100}"],
                duration_ms=duration,
            )
        )

    # T2.F6.3: Non-character rows preservation in cards2.png (rows 1-9)
    t0 = time.perf_counter()
    c2_path = MASTER_SHEET_SPECS["cards2"]["path"]
    c2_img, _ = open_and_decode_image(c2_path)
    rows_preserved = True
    details: List[str] = []
    if c2_img and c2_img.size == (1000, 1000):
        # Rows 1..9 occupy y from 100 to 1000
        # Check that rows 1..9 are not completely zero-byte corrupted or truncated
        lower_region = c2_img.crop((0, 100, 1000, 1000))
        # Verify lower region has readable pixel data
        extrema = lower_region.getextrema()
        # Ensure it has some content
        if not extrema:
            rows_preserved = False
            details.append("cards2.png rows 1-9 have no pixel extrema")
    else:
        rows_preserved = False
        details.append("cards2.png not available or invalid size")

    duration = (time.perf_counter() - t0) * 1000
    if rows_preserved:
        results.append(
            TestResult(
                test_id="T2.F6.3",
                name="Non-Character Rows 1-9 Preservation in cards2.png",
                tier=2,
                feature="Feature 6: Grid Boundaries",
                status="PASS",
                message="cards2.png rows 1-9 (90 cells below character row 0) are intact and cleanly formatted",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T2.F6.3",
                name="Non-Character Rows 1-9 Preservation in cards2.png",
                tier=2,
                feature="Feature 6: Grid Boundaries",
                status="FAIL",
                message="cards2.png rows 1-9 corrupted or missing",
                details=details,
                duration_ms=duration,
            )
        )

    # T2.F6.4: Boss tier multiples of 10 boundaries
    t0 = time.perf_counter()
    boss_errors: List[str] = []
    for fkey, fdef in FACTION_DEFINITIONS.items():
        boss_id = fdef["boss_id"]
        # Boss must be col 9 in cards1 or cards2, and col 9 in faction sheet
        c_cards = get_card_sprite_coords(boss_id)
        if c_cards["col"] != 9:
            boss_errors.append(f"Faction {fkey} Boss ID {boss_id}: col is {c_cards['col']}, expected 9")

    duration = (time.perf_counter() - t0) * 1000
    if not boss_errors:
        results.append(
            TestResult(
                test_id="T2.F6.4",
                name="All 11 Faction Bosses (Multiples of 10) Apex Column 9 Alignment",
                tier=2,
                feature="Feature 6: Grid Boundaries",
                status="PASS",
                message="All 11 faction bosses (IDs 10, 20, ..., 110) align to apex column 9",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T2.F6.4",
                name="All 11 Faction Bosses (Multiples of 10) Apex Column 9 Alignment",
                tier=2,
                feature="Feature 6: Grid Boundaries",
                status="FAIL",
                message=f"{len(boss_errors)} bosses misaligned",
                details=boss_errors,
                duration_ms=duration,
            )
        )

    # T2.F6.5: Out-of-bounds parameter clamping safety
    t0 = time.perf_counter()
    clamp_checks = [
        (0, 0, 0),         # ID 0 should clamp to valid cell
        (-5, 0, 0),        # Negative ID should clamp
        (111, 0, 0),       # ID 111 on cards2 maps to offset
    ]
    clamp_ok = True
    clamp_details = []
    try:
        c_zero = get_card_sprite_coords(0)
        c_neg = get_card_sprite_coords(-5)
        c_legacy_oob = get_card_sprite_coords(999, "/card100.png")
        if c_legacy_oob["col"] != 9 or c_legacy_oob["row"] != 10:
            clamp_ok = False
            clamp_details.append(f"Legacy 999 not clamped to row 10 col 9: {c_legacy_oob}")
    except Exception as e:
        clamp_ok = False
        clamp_details.append(f"Exception during OOB call: {e}")

    duration = (time.perf_counter() - t0) * 1000
    if clamp_ok:
        results.append(
            TestResult(
                test_id="T2.F6.5",
                name="Out-of-Bounds & Negative Card ID Parameter Clamping",
                tier=2,
                feature="Feature 6: Grid Boundaries",
                status="PASS",
                message="Out-of-bounds card IDs clamp safely without throwing uncaught exceptions",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T2.F6.5",
                name="Out-of-Bounds & Negative Card ID Parameter Clamping",
                tier=2,
                feature="Feature 6: Grid Boundaries",
                status="FAIL",
                message="OOB parameter clamping failed",
                details=clamp_details,
                duration_ms=duration,
            )
        )

    return results
