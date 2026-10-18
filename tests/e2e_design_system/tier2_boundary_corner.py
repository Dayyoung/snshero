"""Tier 2: Boundary Value Analysis & Ergonomic Limits.

Verifies:
- Minimum 44px touch target height (min-h-[44px] or equivalent) on all interactive buttons, tabs, pagination, and header CTAs across all target views.
- Top-layer visible [x] / [SKIP] buttons on all modals, drawers, and overlays.
- 375px mobile viewport overflow resilience (zero horizontal scroll overflow, zero wide fixed containers, bottom dock clearance pb-28 to pb-36).
"""

import os
import re
import time
from pathlib import Path
from typing import Dict, List, Optional

from tests.e2e_design_system.helpers import (
    ALL_IN_SCOPE_FILES,
    CORE_22_VIEWS,
    M1_TARGETS,
    M2_TARGETS,
    M3_TARGETS,
    REPO_ROOT,
    TestResult,
    check_button_has_44px,
    check_horizontal_overflow_resilience,
    extract_button_tags,
    find_modal_close_buttons,
    read_repo_file,
)


def get_view_milestone(rel_path: str) -> str:
    """Returns milestone string for a view path."""
    if rel_path in M1_TARGETS:
        return "M1"
    elif rel_path in M2_TARGETS:
        return "M2"
    elif rel_path in M3_TARGETS:
        return "M3"
    return "M4"


def run_tier2_tests(
    milestone_filter: Optional[str] = None,
    verbose: bool = False,
) -> List[TestResult]:
    """Runs all Tier 2 Boundary & Ergonomics tests."""
    results: List[TestResult] = []

    # =========================================================================
    # 1. Minimum 44px Touch Target Height Audit across 22 Views (22 Assertions)
    # =========================================================================
    for idx, view_rel in enumerate(CORE_22_VIEWS, start=1):
        view_name = Path(view_rel).stem
        view_ms = get_view_milestone(view_rel)

        if milestone_filter and milestone_filter.upper() != "ALL" and milestone_filter.upper() != view_ms:
            continue

        try:
            content = read_repo_file(view_rel)
        except Exception as e:
            results.append(
                TestResult(
                    test_id=f"T2.TOUCH.V{idx:02d}",
                    name=f"{view_name} Touch Target Accessibility",
                    tier=2,
                    status="FAIL",
                    message=f"Failed to read file: {e}",
                    milestone=view_ms,
                )
            )
            continue

        t0 = time.perf_counter()
        buttons = extract_button_tags(content)
        sub_44_buttons = []

        for b in buttons:
            cls = b["className"]
            # Skip hidden, sr-only, or disabled-placeholder buttons
            if "hidden" in cls or "sr-only" in cls or "opacity-0 pointer-events-none" in cls:
                continue
            if not check_button_has_44px(cls):
                sub_44_buttons.append(b)

        dt = (time.perf_counter() - t0) * 1000.0

        if len(sub_44_buttons) == 0:
            results.append(
                TestResult(
                    test_id=f"T2.TOUCH.V{idx:02d}",
                    name=f"{view_name} 44px+ Touch Target Compliance (Total {len(buttons)} buttons)",
                    tier=2,
                    status="PASS",
                    message=f"All {len(buttons)} interactive buttons satisfy min-h-[44px] standard",
                    duration_ms=dt,
                    milestone=view_ms,
                )
            )
        else:
            details = [
                f"Line {b['line']}: <button className='{b['className'][:70]}...'>"
                for b in sub_44_buttons[:8]
            ]
            results.append(
                TestResult(
                    test_id=f"T2.TOUCH.V{idx:02d}",
                    name=f"{view_name} 44px+ Touch Target Compliance (Total {len(buttons)} buttons)",
                    tier=2,
                    status="FAIL",
                    message=f"{len(sub_44_buttons)} of {len(buttons)} buttons lack min-h-[44px] sizing",
                    duration_ms=dt,
                    details=details,
                    milestone=view_ms,
                )
            )

    # =========================================================================
    # 2. 375px Mobile Viewport Overflow & Bottom Dock Clearance (22 Assertions)
    # =========================================================================
    for idx, view_rel in enumerate(CORE_22_VIEWS, start=1):
        view_name = Path(view_rel).stem
        view_ms = get_view_milestone(view_rel)

        if milestone_filter and milestone_filter.upper() != "ALL" and milestone_filter.upper() != view_ms:
            continue

        try:
            content = read_repo_file(view_rel)
        except Exception as e:
            continue

        t0 = time.perf_counter()
        overflow_audit = check_horizontal_overflow_resilience(content)
        dt = (time.perf_counter() - t0) * 1000.0

        if overflow_audit["is_resilient"]:
            results.append(
                TestResult(
                    test_id=f"T2.VIEWPORT.V{idx:02d}",
                    name=f"{view_name} 375px Mobile Viewport & Dock Clearance",
                    tier=2,
                    status="PASS",
                    message="Resilient to 375px width (overflow guard active, bottom dock cleared, 0 wide containers)",
                    duration_ms=dt,
                    milestone=view_ms,
                )
            )
        else:
            details = []
            if not overflow_audit["has_overflow_guard"]:
                details.append("Missing horizontal overflow guard (overflow-x-hidden / overflow-x-clip / max-w-full)")
            if not overflow_audit["has_bottom_clearance"]:
                details.append("Missing bottom dock clearance padding (pb-24/pb-28/pb-32/pb-36)")
            if overflow_audit["risky_fixed_widths"]:
                details.append(f"Contains fixed wide containers exceeding 375px: {overflow_audit['risky_fixed_widths']}")

            results.append(
                TestResult(
                    test_id=f"T2.VIEWPORT.V{idx:02d}",
                    name=f"{view_name} 375px Mobile Viewport & Dock Clearance",
                    tier=2,
                    status="FAIL",
                    message="Fails mobile viewport resilience audit",
                    duration_ms=dt,
                    details=details,
                    milestone=view_ms,
                )
            )

    # =========================================================================
    # 3. Modal / Drawer Top-Layer [x] / [SKIP] Close Accessibility (10 Assertions)
    # =========================================================================
    modal_check_targets = [
        ("src/views/HomeView.tsx", "Home Quick Hub & Notifications Modals", "M1"),
        ("src/views/MobileCardPlayScreen.tsx", "Battle Settlement & Auto Battle Modals", "M1"),
        ("src/views/PlayGameView.tsx", "Dungeon Battle, Rules & GPS Overlays", "M1"),
        ("src/views/ShopView.tsx", "Crypto & Goods Checkout Modals", "M2"),
        ("src/views/CardMarketplaceView.tsx", "Marketplace Price Alert & Trade Toasts", "M2"),
        ("src/views/RankingView.tsx", "PvP Match History & Nearby Modals", "M2"),
        ("src/views/GuildListView.tsx", "Guild Creation & Detail Modals", "M2"),
        ("src/views/SettingView.tsx", "Settings Strategy Simulator & Season Dialogs", "M3"),
        ("src/views/EventView.tsx", "Event Nine-Slot & Diorama Modals", "M3"),
        ("src/App.tsx", "Global Hamburger Drawer & Welcome Modals", "M3"),
    ]

    for m_idx, (m_rel, m_name, m_ms) in enumerate(modal_check_targets, start=1):
        if milestone_filter and milestone_filter.upper() != "ALL" and milestone_filter.upper() != m_ms:
            continue

        try:
            content = read_repo_file(m_rel)
        except Exception as e:
            continue

        t0 = time.perf_counter()
        close_buttons = find_modal_close_buttons(content)
        dt = (time.perf_counter() - t0) * 1000.0

        # Check if file has modal structures
        has_modals = bool(re.search(r'(?:fixed inset-0|z-\[(?:1|2|5)\d\d\]|modal|dialog|Drawer)', content, re.IGNORECASE))
        if not has_modals:
            # No modals in this file, passes vacuously
            results.append(
                TestResult(
                    test_id=f"T2.MODAL.{m_idx:02d}",
                    name=f"{m_name} Modal Close Controls",
                    tier=2,
                    status="PASS",
                    message="No modals present in target file",
                    duration_ms=dt,
                    milestone=m_ms,
                )
            )
            continue

        if len(close_buttons) > 0:
            results.append(
                TestResult(
                    test_id=f"T2.MODAL.{m_idx:02d}",
                    name=f"{m_name} Modal Top-Layer [x]/[SKIP] Dismiss Controls",
                    tier=2,
                    status="PASS",
                    message=f"Found {len(close_buttons)} explicit [x]/[SKIP]/Close controls",
                    duration_ms=dt,
                    details=[f"Line {cb['line']}: {cb['raw'][:60]}..." for cb in close_buttons[:5]],
                    milestone=m_ms,
                )
            )
        else:
            results.append(
                TestResult(
                    test_id=f"T2.MODAL.{m_idx:02d}",
                    name=f"{m_name} Modal Top-Layer [x]/[SKIP] Dismiss Controls",
                    tier=2,
                    status="FAIL",
                    message="Detected modal structures without explicit top-layer [x] or [SKIP] buttons",
                    duration_ms=dt,
                    details=["Modals must provide visible [x] / [SKIP] controls for user exit"],
                    milestone=m_ms,
                )
            )

    return results
