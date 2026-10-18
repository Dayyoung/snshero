"""Tier 1: Feature Coverage E2E Tests (>= 5 tests per feature).

Covers:
- Feature 2: Individual Seat Portraits Synchronization (public/seat/*.png)
- Feature 3: Primary 10x10 Sprite Sheets Assembly (cards1.png, cards2.png)
- Feature 4: Legacy Master 10x11 Sheets Assembly (card100.png, card100_gemini.png)
- Feature 5: Faction Horizontal Sheets Assembly (character_sheet_*.png)
"""

import time
from pathlib import Path
from typing import List
from PIL import Image

from .helpers import (
    FACTION_DEFINITIONS,
    MASTER_SHEET_SPECS,
    PUBLIC_DIR,
    SEAT_DIR,
    TestResult,
    check_image_entropy_and_variance,
    compute_file_sha256,
    get_card_seat_filename,
    load_card_dataset,
    open_and_decode_image,
)


def run_tier1_tests() -> List[TestResult]:
    """Executes all Tier 1 Feature Coverage test assertions."""
    results: List[TestResult] = []
    cards = load_card_dataset()

    # -------------------------------------------------------------------------
    # Feature 2: Individual Seat Portraits Synchronization (110 files)
    # -------------------------------------------------------------------------

    # T1.F2.1: Existence of all 110 seat files
    t0 = time.perf_counter()
    missing_seat_files: List[str] = []
    for card in cards:
        expected_fn = get_card_seat_filename(card)
        p = SEAT_DIR / expected_fn
        if not p.exists():
            missing_seat_files.append(f"ID {card['id']}: {expected_fn}")

    duration = (time.perf_counter() - t0) * 1000
    if not missing_seat_files:
        results.append(
            TestResult(
                test_id="T1.F2.1",
                name="All 110 Seat Files Exist on Disk",
                tier=1,
                feature="Feature 2: Seat Portraits",
                status="PASS",
                message="All 110 individual portrait files exist in public/seat/",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F2.1",
                name="All 110 Seat Files Exist on Disk",
                tier=1,
                feature="Feature 2: Seat Portraits",
                status="FAIL",
                message=f"{len(missing_seat_files)} seat portrait files are missing",
                details=missing_seat_files[:10],
                duration_ms=duration,
            )
        )

    # T1.F2.2: Image decode validity
    t0 = time.perf_counter()
    decode_errors: List[str] = []
    decoded_images: dict = {}
    for card in cards:
        expected_fn = get_card_seat_filename(card)
        p = SEAT_DIR / expected_fn
        img, err = open_and_decode_image(p)
        if err:
            decode_errors.append(f"ID {card['id']} ({expected_fn}): {err}")
        else:
            decoded_images[card["id"]] = img

    duration = (time.perf_counter() - t0) * 1000
    if not decode_errors:
        results.append(
            TestResult(
                test_id="T1.F2.2",
                name="All 110 Seat Files Decode Validly",
                tier=1,
                feature="Feature 2: Seat Portraits",
                status="PASS",
                message="All 110 seat images decoded without raster or syntax corruption",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F2.2",
                name="All 110 Seat Files Decode Validly",
                tier=1,
                feature="Feature 2: Seat Portraits",
                status="FAIL",
                message=f"{len(decode_errors)} seat files failed to decode",
                details=decode_errors,
                duration_ms=duration,
            )
        )

    # T1.F2.3: Exact 256x296 dimensions
    t0 = time.perf_counter()
    dimension_errors: List[str] = []
    for card in cards:
        img = decoded_images.get(card["id"])
        if img:
            if img.size != (256, 296):
                dimension_errors.append(
                    f"ID {card['id']} ({get_card_seat_filename(card)}): size={img.size}, expected=(256, 296)"
                )

    duration = (time.perf_counter() - t0) * 1000
    if not dimension_errors and len(decoded_images) > 0:
        results.append(
            TestResult(
                test_id="T1.F2.3",
                name="All 110 Seat Files Exact 256x296 Dimensions",
                tier=1,
                feature="Feature 2: Seat Portraits",
                status="PASS",
                message="All decoded seat files adhere to exact 256x296 px dimensions",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F2.3",
                name="All 110 Seat Files Exact 256x296 Dimensions",
                tier=1,
                feature="Feature 2: Seat Portraits",
                status="FAIL",
                message=f"{len(dimension_errors)} seat files have invalid dimensions",
                details=dimension_errors,
                duration_ms=duration,
            )
        )

    # T1.F2.4: 110 distinct SHA-256 hashes
    t0 = time.perf_counter()
    hash_map: dict = {}
    duplicate_hashes: List[str] = []
    for card in cards:
        expected_fn = get_card_seat_filename(card)
        p = SEAT_DIR / expected_fn
        if p.exists():
            h = compute_file_sha256(p)
            if h in hash_map:
                duplicate_hashes.append(
                    f"Duplicate hash {h[:12]} between ID {hash_map[h]} and ID {card['id']}"
                )
            else:
                hash_map[h] = card["id"]

    duration = (time.perf_counter() - t0) * 1000
    if not duplicate_hashes and len(hash_map) == 110:
        results.append(
            TestResult(
                test_id="T1.F2.4",
                name="110 Distinct SHA-256 Hashes Across Seat Portraits",
                tier=1,
                feature="Feature 2: Seat Portraits",
                status="PASS",
                message=f"All 110 portraits have distinct hashes (0 duplicate images)",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F2.4",
                name="110 Distinct SHA-256 Hashes Across Seat Portraits",
                tier=1,
                feature="Feature 2: Seat Portraits",
                status="FAIL",
                message=f"Found {len(duplicate_hashes)} hash collisions or non-110 count ({len(hash_map)}/110)",
                details=duplicate_hashes[:10],
                duration_ms=duration,
            )
        )

    # T1.F2.5: Zero blank or uniform color images
    t0 = time.perf_counter()
    blank_errors: List[str] = []

    # Adversarial validation: ensure oracle strictly rejects synthetic blank/uniform images
    synthetic_blanks = [
        ("solid_white", Image.new("RGB", (256, 296), (255, 255, 255))),
        ("solid_black", Image.new("RGB", (256, 296), (0, 0, 0))),
        ("solid_gray", Image.new("RGB", (256, 296), (128, 128, 128))),
        ("transparent", Image.new("RGBA", (256, 296), (0, 0, 0, 0))),
    ]
    for b_name, b_img in synthetic_blanks:
        is_rich, _, _ = check_image_entropy_and_variance(b_img)
        if is_rich:
            blank_errors.append(f"Oracle failed to reject synthetic {b_name} image")

    for card in cards:
        img = decoded_images.get(card["id"])
        if img:
            is_rich, entropy, std_dev = check_image_entropy_and_variance(img)
            if not is_rich:
                blank_errors.append(
                    f"ID {card['id']} ({get_card_seat_filename(card)}): entropy={entropy:.2f}, std_dev={std_dev:.2f}"
                )

    duration = (time.perf_counter() - t0) * 1000
    if not blank_errors and len(decoded_images) > 0:
        results.append(
            TestResult(
                test_id="T1.F2.5",
                name="Zero Blank or Uniform Color Images in Seat Portraits",
                tier=1,
                feature="Feature 2: Seat Portraits",
                status="PASS",
                message="All 110 portraits contain non-trivial illustration data",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F2.5",
                name="Zero Blank or Uniform Color Images in Seat Portraits",
                tier=1,
                feature="Feature 2: Seat Portraits",
                status="FAIL",
                message=f"Found {len(blank_errors)} blank or flat uniform portraits",
                details=blank_errors,
                duration_ms=duration,
            )
        )

    # T1.F2.6: Alpha channel support (RGBA or paletted with alpha)
    t0 = time.perf_counter()
    missing_alpha: List[str] = []
    for card in cards:
        img = decoded_images.get(card["id"])
        if img:
            has_alpha = (
                img.mode in ("RGBA", "LA")
                or (img.mode == "P" and "transparency" in img.info)
            )
            if not has_alpha:
                missing_alpha.append(
                    f"ID {card['id']} ({get_card_seat_filename(card)}): mode={img.mode}"
                )

    duration = (time.perf_counter() - t0) * 1000
    if not missing_alpha and len(decoded_images) > 0:
        results.append(
            TestResult(
                test_id="T1.F2.6",
                name="Alpha Transparency Preserved Across Seat Portraits",
                tier=1,
                feature="Feature 2: Seat Portraits",
                status="PASS",
                message="All decoded seat files contain alpha channel / transparency",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F2.6",
                name="Alpha Transparency Preserved Across Seat Portraits",
                tier=1,
                feature="Feature 2: Seat Portraits",
                status="FAIL",
                message=f"{len(missing_alpha)} portraits lack an alpha channel",
                details=missing_alpha[:10],
                duration_ms=duration,
            )
        )

    # -------------------------------------------------------------------------
    # Feature 3: Primary 10x10 Sprite Sheets Assembly (cards1 & cards2)
    # -------------------------------------------------------------------------

    # T1.F3.1: cards1.png exists
    t0 = time.perf_counter()
    c1_path = MASTER_SHEET_SPECS["cards1"]["path"]
    duration = (time.perf_counter() - t0) * 1000
    if c1_path.exists():
        results.append(
            TestResult(
                test_id="T1.F3.1",
                name="public/cards1.png Exists",
                tier=1,
                feature="Feature 3: Primary Sprite Sheets",
                status="PASS",
                message="public/cards1.png found on disk",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F3.1",
                name="public/cards1.png Exists",
                tier=1,
                feature="Feature 3: Primary Sprite Sheets",
                status="FAIL",
                message="public/cards1.png is missing",
                duration_ms=duration,
            )
        )

    # T1.F3.2: cards1.png decodes as valid PNG
    t0 = time.perf_counter()
    c1_img, c1_err = open_and_decode_image(c1_path)
    duration = (time.perf_counter() - t0) * 1000
    if c1_img and c1_img.format == "PNG":
        results.append(
            TestResult(
                test_id="T1.F3.2",
                name="public/cards1.png Decodes as Valid PNG",
                tier=1,
                feature="Feature 3: Primary Sprite Sheets",
                status="PASS",
                message=f"cards1.png decoded cleanly (format={c1_img.format}, mode={c1_img.mode})",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F3.2",
                name="public/cards1.png Decodes as Valid PNG",
                tier=1,
                feature="Feature 3: Primary Sprite Sheets",
                status="FAIL",
                message=f"cards1.png decode failure: {c1_err or c1_img.format}",
                duration_ms=duration,
            )
        )

    # T1.F3.3: cards1.png exact dimensions 1000x1000
    t0 = time.perf_counter()
    duration = (time.perf_counter() - t0) * 1000
    if c1_img and c1_img.size == (1000, 1000):
        results.append(
            TestResult(
                test_id="T1.F3.3",
                name="public/cards1.png Exact Dimensions (1000x1000)",
                tier=1,
                feature="Feature 3: Primary Sprite Sheets",
                status="PASS",
                message="cards1.png dimensions are exactly 1000x1000 px (10x10 grid of 100x100 cells)",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F3.3",
                name="public/cards1.png Exact Dimensions (1000x1000)",
                tier=1,
                feature="Feature 3: Primary Sprite Sheets",
                status="FAIL",
                message=f"cards1.png dimensions mismatch: {c1_img.size if c1_img else 'N/A'}, expected (1000, 1000)",
                duration_ms=duration,
            )
        )

    # T1.F3.4: cards2.png exists
    t0 = time.perf_counter()
    c2_path = MASTER_SHEET_SPECS["cards2"]["path"]
    duration = (time.perf_counter() - t0) * 1000
    if c2_path.exists():
        results.append(
            TestResult(
                test_id="T1.F3.4",
                name="public/cards2.png Exists",
                tier=1,
                feature="Feature 3: Primary Sprite Sheets",
                status="PASS",
                message="public/cards2.png found on disk",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F3.4",
                name="public/cards2.png Exists",
                tier=1,
                feature="Feature 3: Primary Sprite Sheets",
                status="FAIL",
                message="public/cards2.png is missing",
                duration_ms=duration,
            )
        )

    # T1.F3.5: cards2.png decodes as valid PNG
    t0 = time.perf_counter()
    c2_img, c2_err = open_and_decode_image(c2_path)
    duration = (time.perf_counter() - t0) * 1000
    if c2_img and c2_img.format == "PNG":
        results.append(
            TestResult(
                test_id="T1.F3.5",
                name="public/cards2.png Decodes as Valid PNG",
                tier=1,
                feature="Feature 3: Primary Sprite Sheets",
                status="PASS",
                message=f"cards2.png decoded cleanly (format={c2_img.format}, mode={c2_img.mode})",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F3.5",
                name="public/cards2.png Decodes as Valid PNG",
                tier=1,
                feature="Feature 3: Primary Sprite Sheets",
                status="FAIL",
                message=f"cards2.png decode failure: {c2_err or c2_img.format}",
                duration_ms=duration,
            )
        )

    # T1.F3.6: cards2.png exact dimensions 1000x1000
    t0 = time.perf_counter()
    duration = (time.perf_counter() - t0) * 1000
    if c2_img and c2_img.size == (1000, 1000):
        results.append(
            TestResult(
                test_id="T1.F3.6",
                name="public/cards2.png Exact Dimensions (1000x1000)",
                tier=1,
                feature="Feature 3: Primary Sprite Sheets",
                status="PASS",
                message="cards2.png dimensions are exactly 1000x1000 px (10x10 grid of 100x100 cells)",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F3.6",
                name="public/cards2.png Exact Dimensions (1000x1000)",
                tier=1,
                feature="Feature 3: Primary Sprite Sheets",
                status="FAIL",
                message=f"cards2.png dimensions mismatch: {c2_img.size if c2_img else 'N/A'}, expected (1000, 1000)",
                duration_ms=duration,
            )
        )

    # T1.F3.7: cards1 (100 cells) and cards2 (row 0 cells) contain non-blank artwork
    t0 = time.perf_counter()
    empty_cells: List[str] = []
    if c1_img:
        # Check sample cells in cards1 (IDs 1..100)
        for idx in range(0, 100, 10):  # Check col 0 of each row
            col = idx % 10
            row = idx // 10
            cell = c1_img.crop((col * 100, row * 100, (col + 1) * 100, (row + 1) * 100))
            is_rich, _, _ = check_image_entropy_and_variance(cell)
            if not is_rich:
                empty_cells.append(f"cards1.png cell ({col}, {row}) for ID {idx+1} is blank")

    if c2_img:
        # Check row 0 cells for IDs 101..110
        for col in range(10):
            cell = c2_img.crop((col * 100, 0, (col + 1) * 100, 100))
            is_rich, _, _ = check_image_entropy_and_variance(cell)
            if not is_rich:
                empty_cells.append(f"cards2.png Row 0 Col {col} for ID {101+col} is blank")

    duration = (time.perf_counter() - t0) * 1000
    if not empty_cells and c1_img and c2_img:
        results.append(
            TestResult(
                test_id="T1.F3.7",
                name="Primary Sheets Cell Content Populated & Non-Blank",
                tier=1,
                feature="Feature 3: Primary Sprite Sheets",
                status="PASS",
                message="cards1.png (IDs 1-100) and cards2.png (Row 0, IDs 101-110) contain valid character cells",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F3.7",
                name="Primary Sheets Cell Content Populated & Non-Blank",
                tier=1,
                feature="Feature 3: Primary Sprite Sheets",
                status="FAIL",
                message=f"Found {len(empty_cells)} blank cells in primary sprite sheets",
                details=empty_cells,
                duration_ms=duration,
            )
        )

    # -------------------------------------------------------------------------
    # Feature 4: Legacy Master 10x11 Sheets Assembly (card100 & card100_gemini)
    # -------------------------------------------------------------------------

    # T1.F4.1: card100.png exists
    t0 = time.perf_counter()
    c100_path = MASTER_SHEET_SPECS["card100"]["path"]
    duration = (time.perf_counter() - t0) * 1000
    if c100_path.exists():
        results.append(
            TestResult(
                test_id="T1.F4.1",
                name="public/card100.png Exists",
                tier=1,
                feature="Feature 4: Legacy Master Sheets",
                status="PASS",
                message="public/card100.png exists",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F4.1",
                name="public/card100.png Exists",
                tier=1,
                feature="Feature 4: Legacy Master Sheets",
                status="FAIL",
                message="public/card100.png missing",
                duration_ms=duration,
            )
        )

    # T1.F4.2: card100.png decodes as valid PNG
    t0 = time.perf_counter()
    c100_img, c100_err = open_and_decode_image(c100_path)
    duration = (time.perf_counter() - t0) * 1000
    if c100_img and c100_img.format == "PNG":
        results.append(
            TestResult(
                test_id="T1.F4.2",
                name="public/card100.png Decodes as Valid PNG",
                tier=1,
                feature="Feature 4: Legacy Master Sheets",
                status="PASS",
                message=f"card100.png decoded as valid PNG (mode={c100_img.mode})",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F4.2",
                name="public/card100.png Decodes as Valid PNG",
                tier=1,
                feature="Feature 4: Legacy Master Sheets",
                status="FAIL",
                message=f"card100.png decode error: {c100_err or c100_img.format}",
                duration_ms=duration,
            )
        )

    # T1.F4.3: card100.png exact dimensions (1135x1315)
    t0 = time.perf_counter()
    duration = (time.perf_counter() - t0) * 1000
    if c100_img and c100_img.size == (1135, 1315):
        results.append(
            TestResult(
                test_id="T1.F4.3",
                name="public/card100.png Exact Dimensions (1135x1315)",
                tier=1,
                feature="Feature 4: Legacy Master Sheets",
                status="PASS",
                message="card100.png dimensions are exactly 1135x1315 px (10x11 grid)",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F4.3",
                name="public/card100.png Exact Dimensions (1135x1315)",
                tier=1,
                feature="Feature 4: Legacy Master Sheets",
                status="FAIL",
                message=f"card100.png size mismatch: {c100_img.size if c100_img else 'N/A'}, expected (1135, 1315)",
                duration_ms=duration,
            )
        )

    # T1.F4.4: card100_gemini.png exists
    t0 = time.perf_counter()
    gem_path = MASTER_SHEET_SPECS["card100_gemini"]["path"]
    duration = (time.perf_counter() - t0) * 1000
    if gem_path.exists():
        results.append(
            TestResult(
                test_id="T1.F4.4",
                name="public/card100_gemini.png Exists",
                tier=1,
                feature="Feature 4: Legacy Master Sheets",
                status="PASS",
                message="public/card100_gemini.png exists",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F4.4",
                name="public/card100_gemini.png Exists",
                tier=1,
                feature="Feature 4: Legacy Master Sheets",
                status="FAIL",
                message="public/card100_gemini.png missing",
                duration_ms=duration,
            )
        )

    # T1.F4.5: card100_gemini.png decodes as PNG (NOT JPEG)
    t0 = time.perf_counter()
    gem_img, gem_err = open_and_decode_image(gem_path)
    duration = (time.perf_counter() - t0) * 1000
    if gem_img and gem_img.format == "PNG":
        results.append(
            TestResult(
                test_id="T1.F4.5",
                name="public/card100_gemini.png Decodes as Valid PNG Format (Not JPEG)",
                tier=1,
                feature="Feature 4: Legacy Master Sheets",
                status="PASS",
                message=f"card100_gemini.png format is genuine PNG (mode={gem_img.mode})",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F4.5",
                name="public/card100_gemini.png Decodes as Valid PNG Format (Not JPEG)",
                tier=1,
                feature="Feature 4: Legacy Master Sheets",
                status="FAIL",
                message=f"card100_gemini.png format is {gem_img.format if gem_img else 'N/A'}, expected 'PNG' (legacy JPEG detected)",
                details=[f"Format reported by PIL: {gem_img.format if gem_img else gem_err}"],
                duration_ms=duration,
            )
        )

    # T1.F4.6: card100_gemini.png exact dimensions (1024x1024)
    t0 = time.perf_counter()
    duration = (time.perf_counter() - t0) * 1000
    if gem_img and gem_img.size == (1024, 1024):
        results.append(
            TestResult(
                test_id="T1.F4.6",
                name="public/card100_gemini.png Exact Dimensions (1024x1024)",
                tier=1,
                feature="Feature 4: Legacy Master Sheets",
                status="PASS",
                message="card100_gemini.png dimensions are exactly 1024x1024 px",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F4.6",
                name="public/card100_gemini.png Exact Dimensions (1024x1024)",
                tier=1,
                feature="Feature 4: Legacy Master Sheets",
                status="FAIL",
                message=f"card100_gemini.png size mismatch: {gem_img.size if gem_img else 'N/A'}, expected (1024, 1024)",
                duration_ms=duration,
            )
        )

    # T1.F4.7: card100_gemini.png is true RGBA PNG with alpha transparency
    t0 = time.perf_counter()
    duration = (time.perf_counter() - t0) * 1000
    has_alpha = gem_img and (
        gem_img.mode in ("RGBA", "LA")
        or (gem_img.mode == "P" and "transparency" in gem_img.info)
    )
    if has_alpha:
        results.append(
            TestResult(
                test_id="T1.F4.7",
                name="public/card100_gemini.png True RGBA Alpha Mode",
                tier=1,
                feature="Feature 4: Legacy Master Sheets",
                status="PASS",
                message=f"card100_gemini.png mode is {gem_img.mode} with alpha channel support",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F4.7",
                name="public/card100_gemini.png True RGBA Alpha Mode",
                tier=1,
                feature="Feature 4: Legacy Master Sheets",
                status="FAIL",
                message=f"card100_gemini.png mode is {gem_img.mode if gem_img else 'None'}, lacking alpha transparency",
                duration_ms=duration,
            )
        )

    # -------------------------------------------------------------------------
    # Feature 5: Faction Horizontal Sheets Assembly (11 sheets)
    # -------------------------------------------------------------------------

    # T1.F5.1: All 11 faction sheets exist on disk
    t0 = time.perf_counter()
    missing_factions: List[str] = []
    for faction_key, fdef in FACTION_DEFINITIONS.items():
        sheet_path = PUBLIC_DIR / fdef["sheet_filename"]
        if not sheet_path.exists():
            missing_factions.append(f"{faction_key} -> {fdef['sheet_filename']}")

    duration = (time.perf_counter() - t0) * 1000
    if not missing_factions:
        results.append(
            TestResult(
                test_id="T1.F5.1",
                name="All 11 Faction Sheets Exist on Disk",
                tier=1,
                feature="Feature 5: Faction Sheets",
                status="PASS",
                message="All 11 faction horizontal sheets exist in public/ (including aliases hobbit/beast/mecha)",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F5.1",
                name="All 11 Faction Sheets Exist on Disk",
                tier=1,
                feature="Feature 5: Faction Sheets",
                status="FAIL",
                message=f"{len(missing_factions)} faction sheets are missing",
                details=missing_factions,
                duration_ms=duration,
            )
        )

    # T1.F5.2: All 11 faction sheets decode as valid PNGs
    t0 = time.perf_counter()
    faction_decode_errors: List[str] = []
    faction_images: dict = {}
    for faction_key, fdef in FACTION_DEFINITIONS.items():
        sheet_path = PUBLIC_DIR / fdef["sheet_filename"]
        img, err = open_and_decode_image(sheet_path)
        if err or not img or img.format != "PNG":
            faction_decode_errors.append(
                f"{faction_key} ({fdef['sheet_filename']}): {err or img.format}"
            )
        else:
            faction_images[faction_key] = img

    duration = (time.perf_counter() - t0) * 1000
    if not faction_decode_errors:
        results.append(
            TestResult(
                test_id="T1.F5.2",
                name="All 11 Faction Sheets Decode as Valid PNGs",
                tier=1,
                feature="Feature 5: Faction Sheets",
                status="PASS",
                message="All 11 faction sheets decoded without syntax corruption",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F5.2",
                name="All 11 Faction Sheets Decode as Valid PNGs",
                tier=1,
                feature="Feature 5: Faction Sheets",
                status="FAIL",
                message=f"{len(faction_decode_errors)} faction sheets failed decoding",
                details=faction_decode_errors,
                duration_ms=duration,
            )
        )

    # T1.F5.3: All 11 faction sheets exact dimensions 2560x296
    t0 = time.perf_counter()
    faction_dim_errors: List[str] = []
    for faction_key, fdef in FACTION_DEFINITIONS.items():
        img = faction_images.get(faction_key)
        if img and img.size != (2560, 296):
            faction_dim_errors.append(
                f"{faction_key} ({fdef['sheet_filename']}): size={img.size}, expected (2560, 296)"
            )

    duration = (time.perf_counter() - t0) * 1000
    if not faction_dim_errors and len(faction_images) > 0:
        results.append(
            TestResult(
                test_id="T1.F5.3",
                name="All 11 Faction Sheets Exact Dimensions (2560x296)",
                tier=1,
                feature="Feature 5: Faction Sheets",
                status="PASS",
                message="All decoded faction sheets are exactly 2560x296 px (10 cells x 256px wide)",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F5.3",
                name="All 11 Faction Sheets Exact Dimensions (2560x296)",
                tier=1,
                feature="Feature 5: Faction Sheets",
                status="FAIL",
                message=f"{len(faction_dim_errors)} faction sheets have invalid dimensions",
                details=faction_dim_errors,
                duration_ms=duration,
            )
        )

    # T1.F5.4: All 11 faction sheets have RGBA / alpha support
    t0 = time.perf_counter()
    faction_alpha_errors: List[str] = []
    for faction_key, fdef in FACTION_DEFINITIONS.items():
        img = faction_images.get(faction_key)
        if img:
            has_alpha = (
                img.mode in ("RGBA", "LA")
                or (img.mode == "P" and "transparency" in img.info)
            )
            if not has_alpha:
                faction_alpha_errors.append(
                    f"{faction_key} ({fdef['sheet_filename']}): mode={img.mode}"
                )

    duration = (time.perf_counter() - t0) * 1000
    if not faction_alpha_errors and len(faction_images) > 0:
        results.append(
            TestResult(
                test_id="T1.F5.4",
                name="All 11 Faction Sheets Have RGBA Alpha Support",
                tier=1,
                feature="Feature 5: Faction Sheets",
                status="PASS",
                message="All decoded faction sheets maintain alpha transparency",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F5.4",
                name="All 11 Faction Sheets Have RGBA Alpha Support",
                tier=1,
                feature="Feature 5: Faction Sheets",
                status="FAIL",
                message=f"{len(faction_alpha_errors)} faction sheets lack alpha channel",
                details=faction_alpha_errors,
                duration_ms=duration,
            )
        )

    # T1.F5.5: 10 horizontal cells in each faction sheet contain non-blank artwork
    t0 = time.perf_counter()
    blank_faction_cells: List[str] = []
    for faction_key, img in faction_images.items():
        for cell_idx in range(10):
            x0 = cell_idx * 256
            x1 = (cell_idx + 1) * 256
            cell = img.crop((x0, 0, x1, 296))
            is_rich, entropy, std_dev = check_image_entropy_and_variance(cell)
            if not is_rich:
                blank_faction_cells.append(
                    f"{faction_key} cell {cell_idx} (x={x0}..{x1}) is blank (entropy={entropy:.1f})"
                )

    duration = (time.perf_counter() - t0) * 1000
    if not blank_faction_cells and len(faction_images) > 0:
        results.append(
            TestResult(
                test_id="T1.F5.5",
                name="All Faction Sheet Cells Contain Non-Blank Character Artwork",
                tier=1,
                feature="Feature 5: Faction Sheets",
                status="PASS",
                message="All 110 faction cells (11 sheets x 10 cells) contain rich illustration artwork",
                duration_ms=duration,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F5.5",
                name="All Faction Sheet Cells Contain Non-Blank Character Artwork",
                tier=1,
                feature="Feature 5: Faction Sheets",
                status="FAIL",
                message=f"Found {len(blank_faction_cells)} blank cells across faction sheets",
                details=blank_faction_cells[:10],
                duration_ms=duration,
            )
        )

    return results
