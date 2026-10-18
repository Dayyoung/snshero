"""Tier 1: Feature Coverage & DESIGN.md Visual Compliance.

Category-Partition test suite covering all 22+ views and shared chrome:
- Verifies 0 banned classes (bg-gradient-to-, rounded-xl, rounded-2xl, rounded-3xl, animate-ping, animate-bounce)
- Verifies strict monospace typography (font-mono, 0 font-sans, 0 font-serif)
- Verifies 2-tier border radius (rounded-none for containers, rounded-sm max for buttons/badges)
- Verifies flat surfaces with 1px hairlines (0 heavy drop shadows shadow-md/lg/xl/2xl)
"""

import os
import re
import time
from pathlib import Path
from typing import Dict, List, Optional

from tests.e2e_design_system.helpers import (
    ALL_IN_SCOPE_FILES,
    BANNED_ANIMATION_PATTERN,
    BANNED_FONT_PATTERN,
    BANNED_GRADIENT_PATTERN,
    BANNED_RADIUS_PATTERN,
    BANNED_SHADOW_PATTERN,
    CORE_22_VIEWS,
    EXPANSION_25_VIEWS,
    ALL_47_VIEWS,
    ALL_620_COMPONENTS,
    M1_TARGETS,
    M2_TARGETS,
    M3_TARGETS,
    REPO_ROOT,
    TestResult,
    find_banned_tokens_in_file,
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


def run_tier1_tests(
    milestone_filter: Optional[str] = None,
    verbose: bool = False,
) -> List[TestResult]:
    """Runs all Tier 1 Feature Coverage tests."""
    results: List[TestResult] = []

    # Map of view basename to rel_path for core 22 views
    view_list = CORE_22_VIEWS

    for idx, view_rel in enumerate(view_list, start=1):
        view_name = Path(view_rel).stem
        view_ms = get_view_milestone(view_rel)

        if milestone_filter and milestone_filter.upper() != "ALL" and milestone_filter.upper() != view_ms:
            # Skip if milestone filter does not match
            continue

        try:
            content = read_repo_file(view_rel)
        except Exception as e:
            results.append(
                TestResult(
                    test_id=f"T1.V{idx:02d}.READ",
                    name=f"{view_name} Source Accessibility",
                    tier=1,
                    status="FAIL",
                    message=f"Failed to read file: {e}",
                    milestone=view_ms,
                )
            )
            continue

        # 1. Banned Gradients: bg-gradient-to-* == 0
        t0 = time.perf_counter()
        grad_matches = find_banned_tokens_in_file(view_rel, BANNED_GRADIENT_PATTERN)
        dt = (time.perf_counter() - t0) * 1000.0

        if len(grad_matches) == 0:
            results.append(
                TestResult(
                    test_id=f"T1.V{idx:02d}.GRAD",
                    name=f"{view_name} Zero Forbidden Gradients (bg-gradient-to-*)",
                    tier=1,
                    status="PASS",
                    message="Zero forbidden gradient classes detected",
                    duration_ms=dt,
                    milestone=view_ms,
                )
            )
        else:
            details = [f"Line {ln}: {tok} in '{snip}'" for ln, tok, snip in grad_matches[:10]]
            results.append(
                TestResult(
                    test_id=f"T1.V{idx:02d}.GRAD",
                    name=f"{view_name} Zero Forbidden Gradients (bg-gradient-to-*)",
                    tier=1,
                    status="FAIL",
                    message=f"Found {len(grad_matches)} forbidden gradient occurrences",
                    duration_ms=dt,
                    details=details,
                    milestone=view_ms,
                )
            )

        # 2. Banned Radii: rounded-xl / 2xl / 3xl == 0
        t0 = time.perf_counter()
        rad_matches = find_banned_tokens_in_file(view_rel, BANNED_RADIUS_PATTERN)
        dt = (time.perf_counter() - t0) * 1000.0

        if len(rad_matches) == 0:
            results.append(
                TestResult(
                    test_id=f"T1.V{idx:02d}.RAD",
                    name=f"{view_name} Strict 2-Tier Radius (0 rounded-xl/2xl/3xl)",
                    tier=1,
                    status="PASS",
                    message="Zero non-compliant rounded-xl/2xl/3xl classes detected",
                    duration_ms=dt,
                    milestone=view_ms,
                )
            )
        else:
            details = [f"Line {ln}: {tok} in '{snip}'" for ln, tok, snip in rad_matches[:10]]
            results.append(
                TestResult(
                    test_id=f"T1.V{idx:02d}.RAD",
                    name=f"{view_name} Strict 2-Tier Radius (0 rounded-xl/2xl/3xl)",
                    tier=1,
                    status="FAIL",
                    message=f"Found {len(rad_matches)} forbidden border radius occurrences",
                    duration_ms=dt,
                    details=details,
                    milestone=view_ms,
                )
            )

        # 3. Distraction-Free Animations: animate-ping / animate-bounce == 0
        t0 = time.perf_counter()
        anim_matches = find_banned_tokens_in_file(view_rel, BANNED_ANIMATION_PATTERN)
        dt = (time.perf_counter() - t0) * 1000.0

        if len(anim_matches) == 0:
            results.append(
                TestResult(
                    test_id=f"T1.V{idx:02d}.ANIM",
                    name=f"{view_name} Distraction-Free Animations (0 ping/bounce)",
                    tier=1,
                    status="PASS",
                    message="Zero distracting animate-ping/bounce classes detected",
                    duration_ms=dt,
                    milestone=view_ms,
                )
            )
        else:
            details = [f"Line {ln}: {tok} in '{snip}'" for ln, tok, snip in anim_matches[:10]]
            results.append(
                TestResult(
                    test_id=f"T1.V{idx:02d}.ANIM",
                    name=f"{view_name} Distraction-Free Animations (0 ping/bounce)",
                    tier=1,
                    status="FAIL",
                    message=f"Found {len(anim_matches)} forbidden animation occurrences",
                    duration_ms=dt,
                    details=details,
                    milestone=view_ms,
                )
            )

        # 4. Monospace Typography: font-mono enforced, font-sans == 0
        t0 = time.perf_counter()
        font_matches = find_banned_tokens_in_file(view_rel, BANNED_FONT_PATTERN)
        has_font_mono = "font-mono" in content or "font-berkeley" in content
        dt = (time.perf_counter() - t0) * 1000.0

        if len(font_matches) == 0 and has_font_mono:
            results.append(
                TestResult(
                    test_id=f"T1.V{idx:02d}.TYPO",
                    name=f"{view_name} Monospace Typography (font-mono enforced, 0 font-sans)",
                    tier=1,
                    status="PASS",
                    message="Monospace typography enforced; 0 font-sans/serif classes",
                    duration_ms=dt,
                    milestone=view_ms,
                )
            )
        else:
            details = []
            if not has_font_mono:
                details.append("Missing explicit 'font-mono' token in view root/components")
            for ln, tok, snip in font_matches[:10]:
                details.append(f"Line {ln}: {tok} in '{snip}'")
            results.append(
                TestResult(
                    test_id=f"T1.V{idx:02d}.TYPO",
                    name=f"{view_name} Monospace Typography (font-mono enforced, 0 font-sans)",
                    tier=1,
                    status="FAIL",
                    message=f"Found {len(font_matches)} non-mono font occurrences or missing font-mono",
                    duration_ms=dt,
                    details=details,
                    milestone=view_ms,
                )
            )

        # 5. Flat Surfaces: 0 heavy drop shadows (shadow-md/lg/xl/2xl)
        t0 = time.perf_counter()
        shadow_matches = find_banned_tokens_in_file(view_rel, BANNED_SHADOW_PATTERN)
        dt = (time.perf_counter() - t0) * 1000.0

        if len(shadow_matches) == 0:
            results.append(
                TestResult(
                    test_id=f"T1.V{idx:02d}.SHAD",
                    name=f"{view_name} Flat Surfaces (0 heavy drop shadows shadow-md/lg/xl/2xl)",
                    tier=1,
                    status="PASS",
                    message="Zero heavy drop shadow classes detected",
                    duration_ms=dt,
                    milestone=view_ms,
                )
            )
        else:
            details = [f"Line {ln}: {tok} in '{snip}'" for ln, tok, snip in shadow_matches[:10]]
            results.append(
                TestResult(
                    test_id=f"T1.V{idx:02d}.SHAD",
                    name=f"{view_name} Flat Surfaces (0 heavy drop shadows shadow-md/lg/xl/2xl)",
                    tier=1,
                    status="FAIL",
                    message=f"Found {len(shadow_matches)} heavy drop shadow occurrences",
                    duration_ms=dt,
                    details=details,
                    milestone=view_ms,
                )
            )

    # 6. Global Shared Chrome Audits: App.tsx, PageHeader.tsx, Key Battle HUDs
    shared_chrome_targets = [
        ("src/App.tsx", "App Chrome & Global Modals", "M3"),
        ("src/components/PageHeader.tsx", "PageHeader Navigation Chrome", "M1"),
        ("src/components/battle/TacticalCommandHUD.tsx", "Tactical Command HUD", "M1"),
        ("src/components/battle/StarBreathingUltimateWidget.tsx", "Star Breathing Ultimate Widget", "M1"),
        ("src/components/battle/ElementalTempestWidget.tsx", "Elemental Tempest Widget", "M1"),
        ("src/components/MinimalistMissionHUD.tsx", "Minimalist Mission HUD", "M1"),
        ("src/components/ResponsiveCleanHUD.tsx", "Responsive Clean HUD", "M1"),
        ("src/components/movie/CinematicMoviePlayer.tsx", "Cinematic Movie Player", "M2"),
    ]

    for s_idx, (s_path, s_name, s_ms) in enumerate(shared_chrome_targets, start=1):
        if milestone_filter and milestone_filter.upper() != "ALL" and milestone_filter.upper() != s_ms:
            continue

        try:
            content = read_repo_file(s_path)
        except Exception as e:
            results.append(
                TestResult(
                    test_id=f"T1.CHROME.{s_idx:02d}",
                    name=f"{s_name} Accessibility",
                    tier=1,
                    status="FAIL",
                    message=f"Failed to read file: {e}",
                    milestone=s_ms,
                )
            )
            continue

        # Check banned gradients + radii + shadows
        t0 = time.perf_counter()
        grad = find_banned_tokens_in_file(s_path, BANNED_GRADIENT_PATTERN)
        rad = find_banned_tokens_in_file(s_path, BANNED_RADIUS_PATTERN)
        shad = find_banned_tokens_in_file(s_path, BANNED_SHADOW_PATTERN)
        anim = find_banned_tokens_in_file(s_path, BANNED_ANIMATION_PATTERN)
        total_violations = len(grad) + len(rad) + len(shad) + len(anim)
        dt = (time.perf_counter() - t0) * 1000.0

        if total_violations == 0:
            results.append(
                TestResult(
                    test_id=f"T1.CHROME.{s_idx:02d}",
                    name=f"{s_name} Terminal-Flat Chrome Compliance",
                    tier=1,
                    status="PASS",
                    message="Zero prohibited classes (gradients, radii, shadows, animations) in shared chrome",
                    duration_ms=dt,
                    milestone=s_ms,
                )
            )
        else:
            details = []
            for ln, tok, snip in (grad + rad + shad + anim)[:8]:
                details.append(f"Line {ln}: {tok} in '{snip}'")
            results.append(
                TestResult(
                    test_id=f"T1.CHROME.{s_idx:02d}",
                    name=f"{s_name} Terminal-Flat Chrome Compliance",
                    tier=1,
                    status="FAIL",
                    message=f"Found {total_violations} prohibited token occurrences in shared chrome",
                    duration_ms=dt,
                    details=details,
                    milestone=s_ms,
                )
            )

    # 7. Milestone 5: Expansion 25 Views Audits (25 views x 5 categories = 125 assertions)
    for idx, view_rel in enumerate(EXPANSION_25_VIEWS, start=1):
        view_name = Path(view_rel).stem
        view_ms = "M5"

        if milestone_filter and milestone_filter.upper() != "ALL" and milestone_filter.upper() != view_ms:
            continue

        try:
            content = read_repo_file(view_rel)
        except Exception as e:
            results.append(
                TestResult(
                    test_id=f"T1.EXP_V{idx:02d}.READ",
                    name=f"{view_name} Accessibility",
                    tier=1,
                    status="FAIL",
                    message=f"Failed to read file: {e}",
                    milestone=view_ms,
                )
            )
            continue

        # 1. Gradients
        t0 = time.perf_counter()
        grad = find_banned_tokens_in_file(view_rel, BANNED_GRADIENT_PATTERN)
        dt = (time.perf_counter() - t0) * 1000.0
        results.append(
            TestResult(
                test_id=f"T1.EXP_V{idx:02d}.GRAD",
                name=f"{view_name} Terminal-Flat Solid Surfaces (0 bg-gradient-to-*)",
                tier=1,
                status="PASS" if len(grad) == 0 else "FAIL",
                message="Zero decorative gradient classes detected" if len(grad) == 0 else f"Found {len(grad)} gradient occurrences",
                duration_ms=dt,
                milestone=view_ms,
            )
        )

        # 2. Border radius
        t0 = time.perf_counter()
        rad = find_banned_tokens_in_file(view_rel, BANNED_RADIUS_PATTERN)
        dt = (time.perf_counter() - t0) * 1000.0
        results.append(
            TestResult(
                test_id=f"T1.EXP_V{idx:02d}.RAD",
                name=f"{view_name} 2-Tier Border Radius (0 rounded-xl/2xl/3xl)",
                tier=1,
                status="PASS" if len(rad) == 0 else "FAIL",
                message="Zero forbidden large rounded classes detected" if len(rad) == 0 else f"Found {len(rad)} radius occurrences",
                duration_ms=dt,
                milestone=view_ms,
            )
        )

        # 3. Animations
        t0 = time.perf_counter()
        anim = find_banned_tokens_in_file(view_rel, BANNED_ANIMATION_PATTERN)
        dt = (time.perf_counter() - t0) * 1000.0
        results.append(
            TestResult(
                test_id=f"T1.EXP_V{idx:02d}.ANIM",
                name=f"{view_name} Distraction-Free Animations (0 ping/bounce)",
                tier=1,
                status="PASS" if len(anim) == 0 else "FAIL",
                message="Zero distracting animate-ping/bounce classes detected" if len(anim) == 0 else f"Found {len(anim)} animation occurrences",
                duration_ms=dt,
                milestone=view_ms,
            )
        )

        # 4. Typography
        t0 = time.perf_counter()
        font_matches = find_banned_tokens_in_file(view_rel, BANNED_FONT_PATTERN)
        dt = (time.perf_counter() - t0) * 1000.0
        results.append(
            TestResult(
                test_id=f"T1.EXP_V{idx:02d}.TYPO",
                name=f"{view_name} Monospace Typography (0 font-sans/serif)",
                tier=1,
                status="PASS" if len(font_matches) == 0 else "FAIL",
                message="Monospace typography enforced; 0 font-sans/serif classes" if len(font_matches) == 0 else f"Found {len(font_matches)} non-mono occurrences",
                duration_ms=dt,
                milestone=view_ms,
            )
        )

        # 5. Shadows
        t0 = time.perf_counter()
        shadow_matches = find_banned_tokens_in_file(view_rel, BANNED_SHADOW_PATTERN)
        dt = (time.perf_counter() - t0) * 1000.0
        results.append(
            TestResult(
                test_id=f"T1.EXP_V{idx:02d}.SHAD",
                name=f"{view_name} Flat Surfaces (0 heavy drop shadows)",
                tier=1,
                status="PASS" if len(shadow_matches) == 0 else "FAIL",
                message="Zero heavy drop shadow classes detected" if len(shadow_matches) == 0 else f"Found {len(shadow_matches)} shadow occurrences",
                duration_ms=dt,
                milestone=view_ms,
            )
        )

    # 8. Milestone 6: All 620 Components in Repository (Cluster and Global Census)
    component_clusters = [
        ("admin", "Admin Component Cluster"),
        ("battle", "Battle & Combat Component Cluster"),
        ("bench", "Benchmark Component Cluster"),
        ("growth", "Player Growth & Progression Cluster"),
        ("media", "Novel & Media Component Cluster"),
        ("movie", "Cinematic Movie Component Cluster"),
        ("reddit", "Reddit Social Component Cluster"),
        ("retention", "Daily Retention & Quest Cluster"),
        ("rpg", "RPG Adventure Component Cluster"),
        ("viral", "Viral Sharing & Referral Cluster"),
        ("webtoon", "Webtoon Viewer Component Cluster"),
        ("root", "Root Core Components Cluster"),
    ]

    for c_idx, (cluster_key, cluster_name) in enumerate(component_clusters, start=1):
        if milestone_filter and milestone_filter.upper() != "ALL" and milestone_filter.upper() != "M6":
            continue

        if cluster_key == "root":
            cluster_files = [c for c in ALL_620_COMPONENTS if "/" not in c.replace("src/components/", "")]
        else:
            cluster_files = [c for c in ALL_620_COMPONENTS if f"src/components/{cluster_key}/" in c]

        t0 = time.perf_counter()
        violations = 0
        details = []
        for cf in cluster_files:
            g = find_banned_tokens_in_file(cf, BANNED_GRADIENT_PATTERN)
            r = find_banned_tokens_in_file(cf, BANNED_RADIUS_PATTERN)
            s = find_banned_tokens_in_file(cf, BANNED_SHADOW_PATTERN)
            a = find_banned_tokens_in_file(cf, BANNED_ANIMATION_PATTERN)
            f = find_banned_tokens_in_file(cf, BANNED_FONT_PATTERN)
            v_cnt = len(g) + len(r) + len(s) + len(a) + len(f)
            if v_cnt > 0:
                violations += v_cnt
                details.append(f"{cf}: {v_cnt} violations")

        dt = (time.perf_counter() - t0) * 1000.0
        results.append(
            TestResult(
                test_id=f"T1.COMP.{c_idx:02d}",
                name=f"{cluster_name} Terminal-Flat Visual Compliance ({len(cluster_files)} files)",
                tier=1,
                status="PASS" if violations == 0 else "FAIL",
                message=f"All {len(cluster_files)} components pass 100% terminal-flat standards" if violations == 0 else f"{violations} violations in cluster",
                duration_ms=dt,
                details=details[:5],
                milestone="M6",
            )
        )

    # 9. Milestone 6: Codebase-wide 620 Components Global Integrity
    if not milestone_filter or milestone_filter.upper() in ("ALL", "M6"):
        t0 = time.perf_counter()
        total_comp_violations = 0
        for cf in ALL_620_COMPONENTS:
            g = find_banned_tokens_in_file(cf, BANNED_GRADIENT_PATTERN)
            r = find_banned_tokens_in_file(cf, BANNED_RADIUS_PATTERN)
            s = find_banned_tokens_in_file(cf, BANNED_SHADOW_PATTERN)
            a = find_banned_tokens_in_file(cf, BANNED_ANIMATION_PATTERN)
            f = find_banned_tokens_in_file(cf, BANNED_FONT_PATTERN)
            total_comp_violations += (len(g) + len(r) + len(s) + len(a) + len(f))
        dt = (time.perf_counter() - t0) * 1000.0

        results.append(
            TestResult(
                test_id="T1.COMP.GLOBAL",
                name=f"Codebase-Wide 620 Components Visual Integrity Audit (620 files)",
                tier=1,
                status="PASS" if total_comp_violations == 0 else "FAIL",
                message=f"All 620 components verified 100% clean of gradients, large radius, shadows, animations, and non-mono fonts" if total_comp_violations == 0 else f"{total_comp_violations} violations across components",
                duration_ms=dt,
                milestone="M6",
            )
        )

    return results
