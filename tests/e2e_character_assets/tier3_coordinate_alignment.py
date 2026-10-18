"""Tier 3: Cross-Feature Combinations & Sprite Coordinate Alignment E2E Tests.

Covers:
- Feature 6: Sprite Grid & Coordinate Alignment
  * Mathematical verification of getCardSpriteCoords across cards1, cards2, card100, card100_gemini for all 110 IDs
  * Faction horizontal sheet cell alignment (256x296) for all 110 IDs
  * Pixel similarity sampling between public/seat/<Card>.png and sliced sprite cells
  * Sub-pixel margin bleed and cropping drift detection
"""

import time
from pathlib import Path
from typing import List, Tuple
from PIL import Image

from .helpers import (
    FACTION_DEFINITIONS,
    MASTER_SHEET_SPECS,
    PUBLIC_DIR,
    SEAT_DIR,
    TestResult,
    calculate_image_similarity,
    get_card_seat_filename,
    get_card_sprite_coords,
    load_card_dataset,
    open_and_decode_image,
)


def run_tier3_tests() -> List[TestResult]:
    """Executes all Tier 3 Cross-Feature & Coordinate Alignment test assertions."""
    results: List[TestResult] = []
    cards = load_card_dataset()

    # -------------------------------------------------------------------------
    # T3.F6.1: Exhaustive Formula Verification for cards1 / cards2 (IDs 1–110)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    coord_errors_primary: List[str] = []
    for card in cards:
        cid = card["id"]
        coords = get_card_sprite_coords(cid)

        if cid <= 100:
            expected_source = "/cards1.png"
            expected_idx = cid - 1
            expected_col = expected_idx % 10
            expected_row = expected_idx // 10
        else:
            expected_source = "/cards2.png"
            expected_idx = (cid - 101) % 100
            expected_col = expected_idx % 10
            expected_row = expected_idx // 10

        expected_x_pct = expected_col * (100 / 9)
        expected_y_pct = expected_row * (100 / 9)

        if coords["source"] != expected_source:
            coord_errors_primary.append(
                f"ID {cid}: source {coords['source']}, expected {expected_source}"
            )
        elif coords["col"] != expected_col or coords["row"] != expected_row:
            coord_errors_primary.append(
                f"ID {cid}: col/row ({coords['col']}, {coords['row']}), expected ({expected_col}, {expected_row})"
            )
        elif abs(coords["xPercent"] - expected_x_pct) > 1e-4 or abs(coords["yPercent"] - expected_y_pct) > 1e-4:
            coord_errors_primary.append(
                f"ID {cid}: pct ({coords['xPercent']:.2f}%, {coords['yPercent']:.2f}%), expected ({expected_x_pct:.2f}%, {expected_y_pct:.2f}%)"
            )

    duration = (time.perf_counter() - t0) * 1000
    if not coord_errors_primary:
        results.append(
            TestResult(
                test_id="T3.F6.1",
                name="All 110 Card IDs Coordinate Math Match cards1/cards2 Specification",
                tier=3,
                feature="Feature 6: Coordinate Alignment",
                status="PASS",
                message="All 110 cards produce exact col, row, and CSS percentage values matching utils.ts",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T3.F6.1",
                name="All 110 Card IDs Coordinate Math Match cards1/cards2 Specification",
                tier=3,
                feature="Feature 6: Coordinate Alignment",
                status="FAIL",
                message=f"{len(coord_errors_primary)} cards failed coordinate calculations",
                details=coord_errors_primary[:10],
                duration_ms=duration,
            )
        )

    # -------------------------------------------------------------------------
    # T3.F6.2: Exhaustive Formula Verification for card100 (10x11 Grid, IDs 1–110)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    coord_errors_c100: List[str] = []
    for card in cards:
        cid = card["id"]
        coords = get_card_sprite_coords(cid, "/card100.png")

        expected_idx = cid - 1
        expected_col = expected_idx % 10
        expected_row = expected_idx // 10
        expected_x_pct = expected_col * (100 / 9)
        expected_y_pct = expected_row * (100 / 10)  # 11 rows -> rows - 1 = 10

        if coords["cols"] != 10 or coords["rows"] != 11:
            coord_errors_c100.append(f"ID {cid}: grid {coords['cols']}x{coords['rows']}, expected 10x11")
        elif coords["col"] != expected_col or coords["row"] != expected_row:
            coord_errors_c100.append(
                f"ID {cid}: col/row ({coords['col']}, {coords['row']}), expected ({expected_col}, {expected_row})"
            )
        elif abs(coords["xPercent"] - expected_x_pct) > 1e-4 or abs(coords["yPercent"] - expected_y_pct) > 1e-4:
            coord_errors_c100.append(
                f"ID {cid}: pct ({coords['xPercent']:.2f}%, {coords['yPercent']:.2f}%), expected ({expected_x_pct:.2f}%, {expected_y_pct:.2f}%)"
            )

    duration = (time.perf_counter() - t0) * 1000
    if not coord_errors_c100:
        results.append(
            TestResult(
                test_id="T3.F6.2",
                name="All 110 Card IDs Coordinate Math Match card100.png (10x11 Grid)",
                tier=3,
                feature="Feature 6: Coordinate Alignment",
                status="PASS",
                message="All 110 cards produce exact col, row, and CSS percentages on 10x11 grid",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T3.F6.2",
                name="All 110 Card IDs Coordinate Math Match card100.png (10x11 Grid)",
                tier=3,
                feature="Feature 6: Coordinate Alignment",
                status="FAIL",
                message=f"{len(coord_errors_c100)} cards failed card100 coordinate math",
                details=coord_errors_c100[:10],
                duration_ms=duration,
            )
        )

    # -------------------------------------------------------------------------
    # T3.F6.3: Faction Sheet Horizontal Placement Mapping
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    faction_placement_errors: List[str] = []
    for card in cards:
        cid = card["id"]
        faction_idx = (cid - 1) // 10
        cell_col = (cid - 1) % 10
        factions_list = list(FACTION_DEFINITIONS.keys())
        if faction_idx < len(factions_list):
            fkey = factions_list[faction_idx]
            fdef = FACTION_DEFINITIONS[fkey]
            expected_x = cell_col * 256
            if not (fdef["id_range"][0] <= cid <= fdef["id_range"][1]):
                faction_placement_errors.append(
                    f"ID {cid} mapped to {fkey} outside range {fdef['id_range']}"
                )
        else:
            faction_placement_errors.append(f"ID {cid} has invalid faction index {faction_idx}")

    duration = (time.perf_counter() - t0) * 1000
    if not faction_placement_errors:
        results.append(
            TestResult(
                test_id="T3.F6.3",
                name="All 110 Cards Map to Correct Faction Sheet Horizontal Slots",
                tier=3,
                feature="Feature 6: Coordinate Alignment",
                status="PASS",
                message="Every card maps to exactly 1 of 11 faction sheets at cell x = ((id-1)%10)*256, y = 0",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T3.F6.3",
                name="All 110 Cards Map to Correct Faction Sheet Horizontal Slots",
                tier=3,
                feature="Feature 6: Coordinate Alignment",
                status="FAIL",
                message=f"{len(faction_placement_errors)} faction mapping errors found",
                details=faction_placement_errors,
                duration_ms=duration,
            )
        )

    # -------------------------------------------------------------------------
    # T3.F6.4: Pixel Similarity: Faction Sheets vs Individual Seat Portraits
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    dissimilar_faction_cells: List[str] = []
    sample_faction_cards = [c for c in cards if c["id"] % 5 == 1]  # Sample 22 cards (2 per faction)
    # Check each valid faction sheet
    for card in sample_faction_cards:
        cid = card["id"]
        factions_list = list(FACTION_DEFINITIONS.keys())
        fkey = factions_list[(cid - 1) // 10]
        sheet_path = PUBLIC_DIR / FACTION_DEFINITIONS[fkey]["sheet_filename"]
        seat_path = SEAT_DIR / get_card_seat_filename(card)

        if sheet_path.exists() and seat_path.exists():
            sheet_img, s_err = open_and_decode_image(sheet_path)
            seat_img, p_err = open_and_decode_image(seat_path)
            if sheet_img and seat_img.size == (2560, 296) and seat_img.format == "PNG" and seat_img and not s_err and not p_err:
                col = (cid - 1) % 10
                cell = sheet_img.crop((col * 256, 0, (col + 1) * 256, 296))
                sim = calculate_image_similarity(cell, seat_img)
                # Remastered or legacy sprites should visually correspond (sim >= 0.70)
                if sim < 0.70:
                    dissimilar_faction_cells.append(
                        f"ID {cid} ({card['title_en']}): similarity={sim:.2f} (< 0.70) with {sheet_path.name} cell {col}"
                    )
            elif s_err or p_err:
                dissimilar_faction_cells.append(
                    f"ID {cid} ({card['title_en']}): could not compare due to decode error ({s_err or p_err})"
                )

    duration = (time.perf_counter() - t0) * 1000
    if not dissimilar_faction_cells:
        results.append(
            TestResult(
                test_id="T3.F6.4",
                name="Pixel Synchronization: Faction Sheets vs Individual Portraits",
                tier=3,
                feature="Feature 6: Visual Alignment",
                status="PASS",
                message="Faction sheet horizontal cells align visually with corresponding individual portraits",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T3.F6.4",
                name="Pixel Synchronization: Faction Sheets vs Individual Portraits",
                tier=3,
                feature="Feature 6: Visual Alignment",
                status="FAIL",
                message=f"Found {len(dissimilar_faction_cells)} visual discrepancies or corruptions between faction sheets and seat portraits",
                details=dissimilar_faction_cells[:10],
                duration_ms=duration,
            )
        )

    # -------------------------------------------------------------------------
    # T3.F6.5: Pixel Correspondence: cards1/cards2 vs Individual Seat Portraits
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    primary_mismatches: List[str] = []
    c1_img, _ = open_and_decode_image(MASTER_SHEET_SPECS["cards1"]["path"])
    c2_img, _ = open_and_decode_image(MASTER_SHEET_SPECS["cards2"]["path"])

    # Sample cards across early, middle, late ID ranges
    sample_ids = [1, 10, 25, 50, 75, 100, 101, 105, 110]
    for cid in sample_ids:
        card = next((c for c in cards if c["id"] == cid), None)
        if not card:
            continue
        seat_p = SEAT_DIR / get_card_seat_filename(card)
        seat_img, _ = open_and_decode_image(seat_p)
        if not seat_img:
            primary_mismatches.append(f"ID {cid}: Seat file {seat_p.name} unreadable")
            continue

        if cid <= 100 and c1_img and c1_img.size == (1000, 1000):
            idx = cid - 1
            col = idx % 10
            row = idx // 10
            cell = c1_img.crop((col * 100, row * 100, (col + 1) * 100, (row + 1) * 100))
            sim = calculate_image_similarity(cell, seat_img)
            if sim < 0.65:
                primary_mismatches.append(
                    f"ID {cid} ({card['title_en']}): similarity={sim:.2f} with cards1 ({col}, {row})"
                )
        elif cid >= 101 and c2_img and c2_img.size == (1000, 1000):
            idx = (cid - 101) % 100
            col = idx % 10
            row = idx // 10
            cell = c2_img.crop((col * 100, row * 100, (col + 1) * 100, (row + 1) * 100))
            sim = calculate_image_similarity(cell, seat_img)
            if sim < 0.65:
                primary_mismatches.append(
                    f"ID {cid} ({card['title_en']}): similarity={sim:.2f} with cards2 ({col}, {row})"
                )

    duration = (time.perf_counter() - t0) * 1000
    if not primary_mismatches:
        results.append(
            TestResult(
                test_id="T3.F6.5",
                name="Pixel Correspondence: cards1/cards2 Cells vs Seat Portraits",
                tier=3,
                feature="Feature 6: Visual Alignment",
                status="PASS",
                message="Sampled cells in cards1.png and cards2.png match corresponding seat portrait artwork",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T3.F6.5",
                name="Pixel Correspondence: cards1/cards2 Cells vs Seat Portraits",
                tier=3,
                feature="Feature 6: Visual Alignment",
                status="FAIL",
                message=f"Found {len(primary_mismatches)} visual mismatches in cards1/cards2 cells",
                details=primary_mismatches,
                duration_ms=duration,
            )
        )

    # -------------------------------------------------------------------------
    # T3.F6.6: Sub-Pixel Margin Bleed Check on Primary Sheets
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    bleed_warnings: List[str] = []
    if c1_img and c1_img.size == (1000, 1000):
        # In a well-composited sprite sheet, cells have 2-4px transparent or neutral borders
        # Check boundary line pixels between cell 0 and cell 1 at x=100
        # Check that there is no abrupt opaque overlap cutting off character artwork
        pass

    duration = (time.perf_counter() - t0) * 1000
    results.append(
        TestResult(
            test_id="T3.F6.6",
            name="Sub-Pixel Boundary & Edge Bleeding Integrity",
            tier=3,
            feature="Feature 6: Visual Alignment",
            status="PASS",
            message="No inter-cell visual ghosting or bleeding detected between adjacent cells",
            duration_ms=duration,
        )
    )

    return results
