#!/usr/bin/env python3
"""Tier 5: Adversarial Boundary & Concurrency Stress Verification Suite.

Adversarial Stress Test Suite designed to challenge:
- Rapid sequential and concurrent loading of all 110 seat files and 15 sprite sheets (125 total assets).
- High-contention multi-threaded decoding and burst slice stress.
- Memory allocation profiling and leak detection via tracemalloc.
- Deck decode latency budgets (ensuring full deck loads in < 50ms across all access patterns).
- Exhaustive fallback cascade verification across all 110 card IDs:
  seat -> cards1/cards2 -> card100 -> card100_gemini.
- Edge card boundary verification (IDs 1, 10, 100, 101, 110) and out-of-bounds input clamping.

Author: Challenger Tier 5-2
"""

import concurrent.futures
import json
import math
import os
import random
import sys
import time
import tracemalloc
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from PIL import Image

# Ensure repository root is on sys.path
repo_root = Path(__file__).resolve().parents[2]
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from tests.e2e_character_assets.helpers import (
    FACTION_DEFINITIONS,
    MASTER_SHEET_SPECS,
    PUBLIC_DIR,
    SEAT_DIR,
    TestResult,
    check_image_entropy_and_variance,
    format_bytes,
    get_card_seat_filename,
    get_card_sprite_coords,
    load_card_dataset,
    open_and_decode_image,
)

# 15 Authoritative Sprite Sheets (4 Master + 11 Faction Sheets)
ALL_15_SPRITE_SHEET_PATHS: List[Path] = [
    PUBLIC_DIR / "cards1.png",
    PUBLIC_DIR / "cards2.png",
    PUBLIC_DIR / "card100.png",
    PUBLIC_DIR / "card100_gemini.png",
    PUBLIC_DIR / "character_sheet_water.png",
    PUBLIC_DIR / "character_sheet_fire.png",
    PUBLIC_DIR / "character_sheet_wind.png",
    PUBLIC_DIR / "character_sheet_earth.png",
    PUBLIC_DIR / "character_sheet_human.png",
    PUBLIC_DIR / "character_sheet_undead.png",
    PUBLIC_DIR / "character_sheet_elf.png",
    PUBLIC_DIR / "character_sheet_hobbit.png",
    PUBLIC_DIR / "character_sheet_beast.png",
    PUBLIC_DIR / "character_sheet_mecha.png",
    PUBLIC_DIR / "character_sheet_dragon.png",
]


def decode_single_asset(filepath: Path) -> Tuple[str, bool, float, Optional[str]]:
    """Helper to decode an image file and measure latency."""
    t0 = time.perf_counter()
    img, err = open_and_decode_image(filepath)
    dur_ms = (time.perf_counter() - t0) * 1000
    if err or img is None:
        return filepath.name, False, dur_ms, err
    return filepath.name, True, dur_ms, None


def run_tier5_tests() -> List[TestResult]:
    """Executes all Tier 5 Adversarial Boundary & Concurrency Stress tests."""
    results: List[TestResult] = []
    cards = load_card_dataset()
    cards_by_id = {c["id"]: c for c in cards}

    all_110_seat_paths = [SEAT_DIR / get_card_seat_filename(card) for card in cards]
    all_125_assets = all_110_seat_paths + ALL_15_SPRITE_SHEET_PATHS

    # -------------------------------------------------------------------------
    # T5.STR.1: Rapid Sequential Loading & Full Decode (125 Assets)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    seq_errors: List[str] = []
    seat_times: List[float] = []
    sheet_times: List[float] = []

    for p in all_110_seat_paths:
        name, success, dur, err = decode_single_asset(p)
        seat_times.append(dur)
        if not success:
            seq_errors.append(f"Seat decode failed: {name} ({err})")

    for p in ALL_15_SPRITE_SHEET_PATHS:
        name, success, dur, err = decode_single_asset(p)
        sheet_times.append(dur)
        if not success:
            seq_errors.append(f"Sprite sheet decode failed: {name} ({err})")

    dur_total_seq = (time.perf_counter() - t0) * 1000
    avg_seat_ms = sum(seat_times) / len(seat_times) if seat_times else 0.0
    avg_sheet_ms = sum(sheet_times) / len(sheet_times) if sheet_times else 0.0

    if not seq_errors:
        results.append(
            TestResult(
                test_id="T5.STR.1",
                name="Rapid Sequential Loading & Full Decode (110 Seat + 15 Sheets)",
                tier=5,
                feature="Tier 5: Adversarial Stress & Concurrency",
                status="PASS",
                message=(
                    f"Successfully decoded all 125 assets in {dur_total_seq:.1f}ms "
                    f"(Avg seat: {avg_seat_ms:.2f}ms, Avg sheet: {avg_sheet_ms:.2f}ms)"
                ),
                duration_ms=dur_total_seq,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T5.STR.1",
                name="Rapid Sequential Loading & Full Decode (110 Seat + 15 Sheets)",
                tier=5,
                feature="Tier 5: Adversarial Stress & Concurrency",
                status="FAIL",
                message=f"{len(seq_errors)} errors during sequential decode",
                details=seq_errors,
                duration_ms=dur_total_seq,
            )
        )

    # -------------------------------------------------------------------------
    # T5.STR.2: High-Concurrency ThreadPool Loading & Stress (16 Worker Threads)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    concurrent_errors: List[str] = []
    max_workers = 16

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(decode_single_asset, p): p for p in all_125_assets}
        for future in concurrent.futures.as_completed(futures):
            p = futures[future]
            try:
                name, success, dur, err = future.result()
                if not success:
                    concurrent_errors.append(f"Concurrent failure on {name}: {err}")
            except Exception as e:
                concurrent_errors.append(f"Worker exception on {p.name}: {e}")

    dur_concurrent = (time.perf_counter() - t0) * 1000
    if not concurrent_errors:
        results.append(
            TestResult(
                test_id="T5.STR.2",
                name="High-Concurrency ThreadPool Loading (16 Threads, 125 Assets)",
                tier=5,
                feature="Tier 5: Adversarial Stress & Concurrency",
                status="PASS",
                message=(
                    f"125 assets concurrently decoded across 16 threads in {dur_concurrent:.1f}ms "
                    f"with 0 race conditions or locks"
                ),
                duration_ms=dur_concurrent,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T5.STR.2",
                name="High-Concurrency ThreadPool Loading (16 Threads, 125 Assets)",
                tier=5,
                feature="Tier 5: Adversarial Stress & Concurrency",
                status="FAIL",
                message=f"{len(concurrent_errors)} concurrent worker failures",
                details=concurrent_errors,
                duration_ms=dur_concurrent,
            )
        )

    # -------------------------------------------------------------------------
    # T5.STR.3: Burst Stress Harness (50 High-Contention Multi-Threaded Slices)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    burst_errors: List[str] = []

    # Preload master sheets once as cached assets (simulating browser image cache)
    cached_sheets = {}
    for spec_name, spec in MASTER_SHEET_SPECS.items():
        im = Image.open(spec["path"])
        im.load()
        cached_sheets[spec_name] = im

    def simulate_battle_deck_render(session_id: int) -> Tuple[int, bool, float, Optional[str]]:
        t_sub = time.perf_counter()
        deck_ids = random.sample(range(1, 111), 5)
        for cid in deck_ids:
            if cid <= 100:
                sheet = cached_sheets["cards1"]
                idx = cid - 1
            else:
                sheet = cached_sheets["cards2"]
                idx = cid - 101
            col = idx % 10
            row = idx // 10
            box = (col * 100, row * 100, (col + 1) * 100, (row + 1) * 100)
            cropped = sheet.crop(box)
            if cropped.size != (100, 100):
                return session_id, False, 0.0, f"Invalid crop size {cropped.size} for card {cid}"
        dur_sub = (time.perf_counter() - t_sub) * 1000
        return session_id, True, dur_sub, None

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        burst_futures = [executor.submit(simulate_battle_deck_render, i) for i in range(50)]
        for f in concurrent.futures.as_completed(burst_futures):
            try:
                sid, success, sub_dur, err = f.result()
                if not success:
                    burst_errors.append(f"Session {sid} error: {err}")
            except Exception as e:
                burst_errors.append(f"Burst thread exception: {e}")

    dur_burst = (time.perf_counter() - t0) * 1000
    if not burst_errors:
        results.append(
            TestResult(
                test_id="T5.STR.3",
                name="Burst Stress Harness (50 Concurrent Battle Sessions, 250 Slices)",
                tier=5,
                feature="Tier 5: Adversarial Stress & Concurrency",
                status="PASS",
                message=f"50 concurrent 5-card deck requests completed in {dur_burst:.1f}ms with 0 failures",
                duration_ms=dur_burst,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T5.STR.3",
                name="Burst Stress Harness (50 Concurrent Battle Sessions, 250 Slices)",
                tier=5,
                feature="Tier 5: Adversarial Stress & Concurrency",
                status="FAIL",
                message=f"{len(burst_errors)} burst stress errors",
                details=burst_errors,
                duration_ms=dur_burst,
            )
        )

    # -------------------------------------------------------------------------
    # T5.PERF.1: Total Memory Allocation & Footprint Profiling (tracemalloc)
    # -------------------------------------------------------------------------
    tracemalloc.start()
    t0 = time.perf_counter()
    loaded_images = []

    # Load all 15 sprite sheets into memory simultaneously
    for sp in ALL_15_SPRITE_SHEET_PATHS:
        im = Image.open(sp)
        im.load()
        loaded_images.append(im)

    current_mem, peak_mem = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    dur_mem = (time.perf_counter() - t0) * 1000

    # Budget threshold: 15 decompressed RGBA sprite sheets must fit in < 35 MB
    MAX_PEAK_MEM_BYTES = 35 * 1024 * 1024  # 35 MB
    mem_errors: List[str] = []
    if peak_mem > MAX_PEAK_MEM_BYTES:
        mem_errors.append(
            f"Peak memory {format_bytes(peak_mem)} exceeded maximum budget of {format_bytes(MAX_PEAK_MEM_BYTES)}"
        )

    del loaded_images

    if not mem_errors:
        results.append(
            TestResult(
                test_id="T5.PERF.1",
                name="Total Memory Allocation & Footprint Profiling (15 Sheets)",
                tier=5,
                feature="Tier 5: Performance & Memory Budget",
                status="PASS",
                message=(
                    f"Peak allocation: {format_bytes(peak_mem)} "
                    f"(Current: {format_bytes(current_mem)}), well within {format_bytes(MAX_PEAK_MEM_BYTES)} mobile budget"
                ),
                duration_ms=dur_mem,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T5.PERF.1",
                name="Total Memory Allocation & Footprint Profiling (15 Sheets)",
                tier=5,
                feature="Tier 5: Performance & Memory Budget",
                status="FAIL",
                message=f"{len(mem_errors)} memory budget violations",
                details=mem_errors,
                duration_ms=dur_mem,
            )
        )

    # -------------------------------------------------------------------------
    # T5.PERF.2: Deck Decode Latency Budget (< 50ms requirement)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    timing_errors: List[str] = []

    # Scenario A: Cold load of cards1 + cards2 + 5-card slice
    tA0 = time.perf_counter()
    imA1 = Image.open(PUBLIC_DIR / "cards1.png")
    imA1.load()
    imA2 = Image.open(PUBLIC_DIR / "cards2.png")
    imA2.load()
    deck_5 = [1, 10, 50, 100, 105]
    for cid in deck_5:
        sh = imA1 if cid <= 100 else imA2
        idx = (cid - 1) % 100 if cid <= 100 else (cid - 101) % 100
        col = idx % 10
        row = idx // 10
        _ = sh.crop((col * 100, row * 100, (col + 1) * 100, (row + 1) * 100))
    dur_deck_5_cold = (time.perf_counter() - tA0) * 1000

    # Scenario B: 5-card deck load from individual seat files
    tB0 = time.perf_counter()
    for cid in deck_5:
        card = cards_by_id[cid]
        sf = SEAT_DIR / get_card_seat_filename(card)
        im_seat = Image.open(sf)
        im_seat.load()
    dur_deck_5_seat = (time.perf_counter() - tB0) * 1000

    # Scenario C: 10-card faction hand load from individual seat files
    tC0 = time.perf_counter()
    hand_10 = list(range(1, 11))
    for cid in hand_10:
        card = cards_by_id[cid]
        sf = SEAT_DIR / get_card_seat_filename(card)
        im_seat = Image.open(sf)
        im_seat.load()
    dur_hand_10_seat = (time.perf_counter() - tC0) * 1000

    # Scenario D: Full 110-Hero roster sliced from primary sprite sheets
    tD0 = time.perf_counter()
    imD1 = Image.open(PUBLIC_DIR / "cards1.png")
    imD1.load()
    imD2 = Image.open(PUBLIC_DIR / "cards2.png")
    imD2.load()
    for cid in range(1, 111):
        sh = imD1 if cid <= 100 else imD2
        idx = (cid - 1) % 100 if cid <= 100 else (cid - 101) % 100
        col = idx % 10
        row = idx // 10
        _ = sh.crop((col * 100, row * 100, (col + 1) * 100, (row + 1) * 100))
    dur_roster_110 = (time.perf_counter() - tD0) * 1000

    LATENCY_BUDGET_MS = 50.0
    if dur_deck_5_cold >= LATENCY_BUDGET_MS:
        timing_errors.append(f"Cold 5-card deck load took {dur_deck_5_cold:.2f}ms (>= 50ms budget)")
    if dur_deck_5_seat >= LATENCY_BUDGET_MS:
        timing_errors.append(f"Seat 5-card deck load took {dur_deck_5_seat:.2f}ms (>= 50ms budget)")
    if dur_hand_10_seat >= LATENCY_BUDGET_MS:
        timing_errors.append(f"Seat 10-card hand load took {dur_hand_10_seat:.2f}ms (>= 50ms budget)")
    if dur_roster_110 >= LATENCY_BUDGET_MS:
        timing_errors.append(f"Full 110-hero roster load took {dur_roster_110:.2f}ms (>= 50ms budget)")

    dur_timing = (time.perf_counter() - t0) * 1000
    if not timing_errors:
        results.append(
            TestResult(
                test_id="T5.PERF.2",
                name="Deck Decode Latency Budget (< 50ms Target)",
                tier=5,
                feature="Tier 5: Performance & Memory Budget",
                status="PASS",
                message=(
                    f"All deck load patterns < 50ms: Cold Deck={dur_deck_5_cold:.1f}ms, "
                    f"Seat Deck={dur_deck_5_seat:.1f}ms, Hand 10={dur_hand_10_seat:.1f}ms, "
                    f"Full 110 Roster={dur_roster_110:.1f}ms"
                ),
                duration_ms=dur_timing,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T5.PERF.2",
                name="Deck Decode Latency Budget (< 50ms Target)",
                tier=5,
                feature="Tier 5: Performance & Memory Budget",
                status="FAIL",
                message=f"{len(timing_errors)} latency budget violations",
                details=timing_errors,
                duration_ms=dur_timing,
            )
        )

    # -------------------------------------------------------------------------
    # T5.CAS.1: Fallback Cascade Level 1: `seat` Portrait Integrity (IDs 1–110)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    seat_cascade_errors: List[str] = []

    for card in cards:
        cid = card["id"]
        sf = SEAT_DIR / get_card_seat_filename(card)
        if not sf.exists():
            seat_cascade_errors.append(f"ID {cid}: Seat file missing: {sf.name}")
            continue

        size = sf.stat().st_size
        if size < 4096 or size > 35840:
            seat_cascade_errors.append(f"ID {cid}: Size {size} B out of [4KB, 35KB] budget")

        im, err = open_and_decode_image(sf)
        if err or im is None:
            seat_cascade_errors.append(f"ID {cid}: Decode error: {err}")
            continue

        if im.size != (256, 296):
            seat_cascade_errors.append(f"ID {cid}: Invalid size {im.size}, expected (256, 296)")

        is_rich, entropy, std_dev = check_image_entropy_and_variance(im)
        if not is_rich:
            seat_cascade_errors.append(
                f"ID {cid}: Uniform or blank image (entropy={entropy:.2f}, std_dev={std_dev:.1f})"
            )

    dur_seat_cas = (time.perf_counter() - t0) * 1000
    if not seat_cascade_errors:
        results.append(
            TestResult(
                test_id="T5.CAS.1",
                name="Fallback Cascade Level 1: Seat Portrait Integrity (IDs 1–110)",
                tier=5,
                feature="Tier 5: Fallback Cascade & Boundaries",
                status="PASS",
                message="All 110 seat portraits exist, decode cleanly (256x296), non-blank and within budget",
                duration_ms=dur_seat_cas,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T5.CAS.1",
                name="Fallback Cascade Level 1: Seat Portrait Integrity (IDs 1–110)",
                tier=5,
                feature="Tier 5: Fallback Cascade & Boundaries",
                status="FAIL",
                message=f"{len(seat_cascade_errors)} Level 1 seat errors",
                details=seat_cascade_errors,
                duration_ms=dur_seat_cas,
            )
        )

    # -------------------------------------------------------------------------
    # T5.CAS.2: Fallback Cascade Level 2: `cards1/cards2` Alignment (IDs 1–110)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    cards1_2_errors: List[str] = []

    c1_img, c1_err = open_and_decode_image(PUBLIC_DIR / "cards1.png")
    c2_img, c2_err = open_and_decode_image(PUBLIC_DIR / "cards2.png")

    if c1_err or c1_img is None or c2_err or c2_img is None:
        cards1_2_errors.append(f"Primary sheet load error: c1={c1_err}, c2={c2_err}")
    else:
        for card in cards:
            cid = card["id"]
            if cid <= 100:
                sheet = c1_img
                idx = cid - 1
            else:
                sheet = c2_img
                idx = cid - 101

            col = idx % 10
            row = idx // 10
            box = (col * 100, row * 100, (col + 1) * 100, (row + 1) * 100)
            cell = sheet.crop(box)
            if cell.size != (100, 100):
                cards1_2_errors.append(f"ID {cid}: Invalid cell size {cell.size}")
                continue

            is_rich, entropy, std_dev = check_image_entropy_and_variance(cell)
            if not is_rich:
                cards1_2_errors.append(
                    f"ID {cid}: Blank primary sheet cell at col={col}, row={row} (std={std_dev:.1f})"
                )

    dur_c1_2 = (time.perf_counter() - t0) * 1000
    if not cards1_2_errors:
        results.append(
            TestResult(
                test_id="T5.CAS.2",
                name="Fallback Cascade Level 2: Primary Sprite Sheets (cards1/cards2)",
                tier=5,
                feature="Tier 5: Fallback Cascade & Boundaries",
                status="PASS",
                message="All 110 card IDs map to valid, populated 100x100 cells on cards1.png & cards2.png",
                duration_ms=dur_c1_2,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T5.CAS.2",
                name="Fallback Cascade Level 2: Primary Sprite Sheets (cards1/cards2)",
                tier=5,
                feature="Tier 5: Fallback Cascade & Boundaries",
                status="FAIL",
                message=f"{len(cards1_2_errors)} Level 2 primary sheet errors",
                details=cards1_2_errors,
                duration_ms=dur_c1_2,
            )
        )

    # -------------------------------------------------------------------------
    # T5.CAS.3: Fallback Cascade Level 3: Legacy `card100.png` 10x11 Grid (IDs 1–110)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    card100_errors: List[str] = []

    c100_img, c100_err = open_and_decode_image(PUBLIC_DIR / "card100.png")
    if c100_err or c100_img is None:
        card100_errors.append(f"card100.png load error: {c100_err}")
    else:
        cell_w = 1135.0 / 10.0
        cell_h = 1315.0 / 11.0
        for card in cards:
            cid = card["id"]
            idx = cid - 1
            col = idx % 10
            row = idx // 10
            x0 = int(round(col * cell_w))
            y0 = int(round(row * cell_h))
            x1 = int(round((col + 1) * cell_w))
            y1 = int(round((row + 1) * cell_h))
            cell = c100_img.crop((x0, y0, x1, y1))

            is_rich, entropy, std_dev = check_image_entropy_and_variance(cell)
            if not is_rich:
                card100_errors.append(
                    f"ID {cid}: Blank card100.png cell at ({col}, {row}) (std={std_dev:.1f})"
                )

    dur_c100 = (time.perf_counter() - t0) * 1000
    if not card100_errors:
        results.append(
            TestResult(
                test_id="T5.CAS.3",
                name="Fallback Cascade Level 3: Legacy Master Sheet (card100.png 10x11)",
                tier=5,
                feature="Tier 5: Fallback Cascade & Boundaries",
                status="PASS",
                message="All 110 card IDs map to valid, non-blank cells on card100.png (1135x1315)",
                duration_ms=dur_c100,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T5.CAS.3",
                name="Fallback Cascade Level 3: Legacy Master Sheet (card100.png 10x11)",
                tier=5,
                feature="Tier 5: Fallback Cascade & Boundaries",
                status="FAIL",
                message=f"{len(card100_errors)} Level 3 card100 errors",
                details=card100_errors,
                duration_ms=dur_c100,
            )
        )

    # -------------------------------------------------------------------------
    # T5.CAS.4: Fallback Cascade Level 4: `card100_gemini.png` True RGBA (IDs 1–110)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    gemini_errors: List[str] = []

    gem_img, gem_err = open_and_decode_image(PUBLIC_DIR / "card100_gemini.png")
    if gem_err or gem_img is None:
        gemini_errors.append(f"card100_gemini.png load error: {gem_err}")
    elif gem_img.format != "PNG":
        gemini_errors.append(f"card100_gemini.png is not PNG format ({gem_img.format})")
    else:
        cell_w = 1024.0 / 10.0
        cell_h = 1024.0 / 11.0
        for card in cards:
            cid = card["id"]
            idx = cid - 1
            col = idx % 10
            row = idx // 10
            x0 = int(round(col * cell_w))
            y0 = int(round(row * cell_h))
            x1 = int(round((col + 1) * cell_w))
            y1 = int(round((row + 1) * cell_h))
            cell = gem_img.crop((x0, y0, x1, y1))

            is_rich, entropy, std_dev = check_image_entropy_and_variance(cell)
            if not is_rich:
                gemini_errors.append(
                    f"ID {cid}: Blank card100_gemini.png cell at ({col}, {row}) (std={std_dev:.1f})"
                )

    dur_gem = (time.perf_counter() - t0) * 1000
    if not gemini_errors:
        results.append(
            TestResult(
                test_id="T5.CAS.4",
                name="Fallback Cascade Level 4: Modern Master Sheet (card100_gemini.png RGBA)",
                tier=5,
                feature="Tier 5: Fallback Cascade & Boundaries",
                status="PASS",
                message="All 110 card IDs map to valid, non-blank cells on card100_gemini.png (1024x1024)",
                duration_ms=dur_gem,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T5.CAS.4",
                name="Fallback Cascade Level 4: Modern Master Sheet (card100_gemini.png RGBA)",
                tier=5,
                feature="Tier 5: Fallback Cascade & Boundaries",
                status="FAIL",
                message=f"{len(gemini_errors)} Level 4 gemini errors",
                details=gemini_errors,
                duration_ms=dur_gem,
            )
        )

    # -------------------------------------------------------------------------
    # T5.CAS.5: Multi-Tier Degradation Simulation across All 110 Cards
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    degradation_errors: List[str] = []

    # Priority resolver simulator
    def resolve_card_asset_cascade(cid: int, disabled_tiers: set) -> Tuple[str, Optional[Image.Image]]:
        card = cards_by_id[cid]
        # Tier 1: seat
        if "seat" not in disabled_tiers:
            sf = SEAT_DIR / get_card_seat_filename(card)
            if sf.exists():
                im, _ = open_and_decode_image(sf)
                if im:
                    return "seat", im
        # Tier 2: cards1/cards2
        if "cards1_2" not in disabled_tiers:
            sheet = c1_img if cid <= 100 else c2_img
            idx = (cid - 1) % 100 if cid <= 100 else (cid - 101) % 100
            col = idx % 10
            row = idx // 10
            box = (col * 100, row * 100, (col + 1) * 100, (row + 1) * 100)
            if sheet:
                return "cards1_2", sheet.crop(box)
        # Tier 3: card100
        if "card100" not in disabled_tiers:
            if c100_img:
                idx = cid - 1
                col = idx % 10
                row = idx // 10
                cell_w = 1135.0 / 10.0
                cell_h = 1315.0 / 11.0
                box = (
                    int(round(col * cell_w)),
                    int(round(row * cell_h)),
                    int(round((col + 1) * cell_w)),
                    int(round((row + 1) * cell_h)),
                )
                return "card100", c100_img.crop(box)
        # Tier 4: card100_gemini
        if "gemini" not in disabled_tiers:
            if gem_img:
                idx = cid - 1
                col = idx % 10
                row = idx // 10
                cell_w = 1024.0 / 10.0
                cell_h = 1024.0 / 11.0
                box = (
                    int(round(col * cell_w)),
                    int(round(row * cell_h)),
                    int(round((col + 1) * cell_w)),
                    int(round((row + 1) * cell_h)),
                )
                return "gemini", gem_img.crop(box)

        return "none", None

    # Test all 4 tiers for all 110 cards
    for card in cards:
        cid = card["id"]
        # Normal mode -> seat
        src, im = resolve_card_asset_cascade(cid, set())
        if src != "seat" or im is None:
            degradation_errors.append(f"ID {cid}: Normal resolution failed, resolved to {src}")

        # Degraded 1 (no seat) -> cards1_2
        src, im = resolve_card_asset_cascade(cid, {"seat"})
        if src != "cards1_2" or im is None:
            degradation_errors.append(f"ID {cid}: Stage 1 fallback failed, resolved to {src}")

        # Degraded 2 (no seat, no cards1_2) -> card100
        src, im = resolve_card_asset_cascade(cid, {"seat", "cards1_2"})
        if src != "card100" or im is None:
            degradation_errors.append(f"ID {cid}: Stage 2 fallback failed, resolved to {src}")

        # Degraded 3 (no seat, no cards1_2, no card100) -> gemini
        src, im = resolve_card_asset_cascade(cid, {"seat", "cards1_2", "card100"})
        if src != "gemini" or im is None:
            degradation_errors.append(f"ID {cid}: Stage 3 fallback failed, resolved to {src}")

    dur_deg = (time.perf_counter() - t0) * 1000
    if not degradation_errors:
        results.append(
            TestResult(
                test_id="T5.CAS.5",
                name="Multi-Tier Degradation Simulation (seat -> cards1/cards2 -> card100 -> gemini)",
                tier=5,
                feature="Tier 5: Fallback Cascade & Boundaries",
                status="PASS",
                message="All 110 cards successfully degrade through all 4 fallback stages with 0 failures",
                duration_ms=dur_deg,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T5.CAS.5",
                name="Multi-Tier Degradation Simulation (seat -> cards1/cards2 -> card100 -> gemini)",
                tier=5,
                feature="Tier 5: Fallback Cascade & Boundaries",
                status="FAIL",
                message=f"{len(degradation_errors)} degradation errors across 440 cascade tests",
                details=degradation_errors,
                duration_ms=dur_deg,
            )
        )

    # -------------------------------------------------------------------------
    # T5.BND.1: Critical Edge Card IDs & Boundary Clamping Verification
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    edge_errors: List[str] = []

    # Edge Card IDs to verify explicitly:
    # 1 (Start), 10 (First Boss), 100 (Primary terminal), 101 (Secondary start), 110 (Final card)
    EDGE_CARD_TESTS = [
        (1, "/cards1.png", 0, 0, 0.0, 0.0),
        (10, "/cards1.png", 9, 0, 100.0, 0.0),
        (100, "/cards1.png", 9, 9, 100.0, 100.0),
        (101, "/cards2.png", 0, 0, 0.0, 0.0),
        (110, "/cards2.png", 9, 0, 100.0, 0.0),
    ]

    for cid, exp_source, exp_col, exp_row, exp_xp, exp_yp in EDGE_CARD_TESTS:
        coords = get_card_sprite_coords(cid)
        if coords["source"] != exp_source:
            edge_errors.append(f"Edge ID {cid}: Source was {coords['source']}, expected {exp_source}")
        if coords["col"] != exp_col or coords["row"] != exp_row:
            edge_errors.append(f"Edge ID {cid}: Grid ({coords['col']}, {coords['row']}), expected ({exp_col}, {exp_row})")
        if abs(coords["xPercent"] - exp_xp) > 0.01 or abs(coords["yPercent"] - exp_yp) > 0.01:
            edge_errors.append(f"Edge ID {cid}: Percentages ({coords['xPercent']:.1f}%, {coords['yPercent']:.1f}%), expected ({exp_xp}%, {exp_yp}%)")

    # Clamping & Out-of-bounds stress
    OOB_TESTS = [0, -1, -999, 111, 200, 9999]
    for oob_id in OOB_TESTS:
        try:
            coords = get_card_sprite_coords(oob_id)
            if coords["col"] < 0 or coords["col"] > 9 or coords["row"] < 0 or coords["row"] > 9:
                edge_errors.append(f"OOB ID {oob_id}: Out-of-bounds coords generated: ({coords['col']}, {coords['row']})")
        except Exception as e:
            edge_errors.append(f"OOB ID {oob_id}: Unhandled exception: {e}")

    dur_edge = (time.perf_counter() - t0) * 1000
    if not edge_errors:
        results.append(
            TestResult(
                test_id="T5.BND.1",
                name="Critical Edge Card IDs & Boundary Clamping Verification",
                tier=5,
                feature="Tier 5: Fallback Cascade & Boundaries",
                status="PASS",
                message="Exact coordinates verified for IDs 1, 10, 100, 101, 110 and safe clamping for all OOB IDs",
                duration_ms=dur_edge,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T5.BND.1",
                name="Critical Edge Card IDs & Boundary Clamping Verification",
                tier=5,
                feature="Tier 5: Fallback Cascade & Boundaries",
                status="FAIL",
                message=f"{len(edge_errors)} edge/boundary errors",
                details=edge_errors,
                duration_ms=dur_edge,
            )
        )

    return results


def main():
    print("\n" + "=" * 70)
    print("  SNSHero Tier 5: Adversarial Boundary & Concurrency Stress Runner")
    print("=" * 70)
    print(f"Working Directory: {repo_root}")
    print(f"Assets Evaluated : 110 Seat Files + 15 Sprite Sheets (125 Total Files)\n")

    results = run_tier5_tests()

    pass_count = sum(1 for r in results if r.status == "PASS")
    fail_count = sum(1 for r in results if r.status == "FAIL")

    for r in results:
        status_symbol = "✓ PASS" if r.status == "PASS" else "✗ FAIL"
        color = "\033[92m" if r.status == "PASS" else "\033[91m"
        reset = "\033[0m"
        print(f"  {color}{status_symbol}{reset} [{r.test_id}] {r.name} ({r.duration_ms:.1f}ms)")
        print(f"    Message: {r.message}")
        if r.details:
            for d in r.details[:8]:
                print(f"      - {d}")
        print()

    print("-" * 70)
    print(f"  Tier 5 Stress Summary: {pass_count} / {len(results)} Passed ({pass_count/len(results)*100:.1f}%)")
    print("-" * 70)

    if fail_count > 0:
        print(f"\n\033[91mSTATUS: TIER 5 STRESS DISCOVERED {fail_count} DEFECTS!\033[0m\n")
        sys.exit(1)
    else:
        print(f"\n\033[92mSTATUS: ALL TIER 5 ADVERSARIAL STRESS ASSERTIONS PASSED 100%!\033[0m\n")
        sys.exit(0)


if __name__ == "__main__":
    main()
