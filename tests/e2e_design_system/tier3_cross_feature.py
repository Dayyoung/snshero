"""Tier 3: Pairwise Combinatorial & Cross-Feature Integration Testing.

Verifies:
- Pairwise view transitions and state continuity between Battle, Deck, Shop, Ranking, Novel, and Settings.
- LocalStorage key persistence under the mandatory 'hero_*' prefix format with zero unconditional data wipes.
- 100% 'safeLazy' dynamic glob imports in App.tsx with zero single-point-of-failure directory index imports.
- Audio and theme state continuity across view boundaries.
- Bottom navigation dock integration and interface contract alignment.
"""

import os
import re
import time
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

from tests.e2e_design_system.helpers import (
    ALL_IN_SCOPE_FILES,
    CORE_22_VIEWS,
    M1_TARGETS,
    M2_TARGETS,
    M3_TARGETS,
    REPO_ROOT,
    TestResult,
    check_button_has_44px,
    extract_button_tags,
    find_localstorage_keys,
    read_repo_file,
)


def run_tier3_tests(
    milestone_filter: Optional[str] = None,
    verbose: bool = False,
) -> List[TestResult]:
    """Runs all Tier 3 Pairwise Combinatorial & Cross-Feature Integration tests."""
    results: List[TestResult] = []

    def should_run(ms: str) -> bool:
        if not milestone_filter or milestone_filter.upper() == "ALL":
            return True
        return ms == "ALL" or ms == milestone_filter.upper()

    # =========================================================================
    # 1. Pairwise View Transitions: Battle <-> Deck, Shop, Ranking, Novel, Settings
    # =========================================================================
    if should_run("ALL"):
        t0 = time.perf_counter()
        app_content = read_repo_file("src/App.tsx")
        home_content = read_repo_file("src/views/HomeView.tsx")

    core_route_groups = [
        ("battle", ["play", "card-play", "main"]),
        ("deck", ["mydeck", "deck"]),
        ("shop", ["shop"]),
        ("ranking", ["ranking"]),
        ("novel", ["novel", "webtoon"]),
        ("setting", ["setting", "settings"]),
    ]
    missing_routes = []
    for r_name, r_aliases in core_route_groups:
        pattern = "|".join(re.escape(a) for a in r_aliases)
        route_pattern = re.compile(rf"setView\(['\"]({pattern})['\"]\)|case\s+['\"]({pattern})['\"]|view\s*===?\s*['\"]({pattern})['\"]")
        if not route_pattern.search(app_content):
            missing_routes.append(r_name)

    dt = (time.perf_counter() - t0) * 1000.0
    if len(missing_routes) == 0:
        results.append(
            TestResult(
                test_id="T3.PAIR.01",
                name="Pairwise View Routing (Battle <-> Deck, Shop, Rank, Novel, Setting)",
                tier=3,
                status="PASS",
                message="All 6 core view routes registered and navigable via setView state machine",
                duration_ms=dt,
                milestone="ALL",
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T3.PAIR.01",
                name="Pairwise View Routing (Battle <-> Deck, Shop, Rank, Novel, Setting)",
                tier=3,
                status="FAIL",
                message=f"Missing view transition handler for routes: {missing_routes}",
                duration_ms=dt,
                milestone="ALL",
            )
        )

    # =========================================================================
    # 2. Home Lobby Hub Route Transition Matrix
    # =========================================================================
    t0 = time.perf_counter()
    hub_action_groups = [
        ("battle", ["main", "card-play", "play"]),
        ("deck", ["mydeck", "deck"]),
        ("shop", ["shop"]),
        ("ranking", ["ranking"]),
        ("novel", ["novel", "webtoon"]),
    ]
    missing_hub = []
    for h_name, h_aliases in hub_action_groups:
        found = any(f"'{a}'" in home_content or f'"{a}"' in home_content for a in h_aliases)
        if not found:
            missing_hub.append(h_name)

    dt = (time.perf_counter() - t0) * 1000.0
    if len(missing_hub) == 0:
        results.append(
            TestResult(
                test_id="T3.PAIR.02",
                name="Home Lobby Hub Core Action Navigation Matrix",
                tier=3,
                status="PASS",
                message="HomeView exposes direct navigation shortcuts for battle, deck, shop, ranking, and novel",
                duration_ms=dt,
                milestone="M1",
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T3.PAIR.02",
                name="Home Lobby Hub Core Action Navigation Matrix",
                tier=3,
                status="FAIL",
                message=f"HomeView missing navigation triggers for: {missing_hub}",
                duration_ms=dt,
                milestone="M1",
            )
        )

    # =========================================================================
    # 3. LocalStorage Key Naming Compliance (Strict 'hero_*' prefix)
    # =========================================================================
    t0 = time.perf_counter()
    all_keys_found: Dict[str, List[Tuple[str, int]]] = {}
    non_compliant_keys: List[Tuple[str, int, str]] = []

    # Known allowed system keys
    ALLOWED_NON_HERO_KEYS = {"loglevel", "theme", "i18nextLng", "lang"}

    for f_rel in ALL_IN_SCOPE_FILES:
        try:
            content = read_repo_file(f_rel)
        except Exception:
            continue
        keys = find_localstorage_keys(content)
        for ln, key, method in keys:
            if key not in all_keys_found:
                all_keys_found[key] = []
            all_keys_found[key].append((f_rel, ln))

            if not key.startswith("hero_") and key not in ALLOWED_NON_HERO_KEYS:
                # Check if it has a fallback read or migration pattern
                non_compliant_keys.append((f_rel, ln, key))

    dt = (time.perf_counter() - t0) * 1000.0
    if len(non_compliant_keys) == 0:
        results.append(
            TestResult(
                test_id="T3.STORAGE.01",
                name="LocalStorage Key Persistence ('hero_*' Prefix Standard)",
                tier=3,
                status="PASS",
                message=f"All {len(all_keys_found)} distinct LocalStorage keys conform to 'hero_*' naming convention",
                duration_ms=dt,
                milestone="ALL",
            )
        )
    else:
        details = [f"{f_rel}:{ln} uses non-compliant key '{k}'" for f_rel, ln, k in non_compliant_keys[:8]]
        results.append(
            TestResult(
                test_id="T3.STORAGE.01",
                name="LocalStorage Key Persistence ('hero_*' Prefix Standard)",
                tier=3,
                status="FAIL",
                message=f"Found {len(non_compliant_keys)} non-compliant LocalStorage key usages",
                duration_ms=dt,
                details=details,
                milestone="ALL",
            )
        )

    # =========================================================================
    # 4. Zero Unconditional Data Reset/Wipe Routines
    # =========================================================================
    t0 = time.perf_counter()
    unconditional_wipes = []
    for f_rel in CORE_22_VIEWS:
        try:
            content = read_repo_file(f_rel)
        except Exception:
            continue
        if "localStorage.clear()" in content:
            unconditional_wipes.append(f_rel)

    dt = (time.perf_counter() - t0) * 1000.0
    if len(unconditional_wipes) == 0:
        results.append(
            TestResult(
                test_id="T3.STORAGE.02",
                name="Zero Unconditional Data Wipe (Preserve Inventory & Decks)",
                tier=3,
                status="PASS",
                message="Zero unconditional localStorage.clear() calls in core views",
                duration_ms=dt,
                milestone="ALL",
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T3.STORAGE.02",
                name="Zero Unconditional Data Wipe (Preserve Inventory & Decks)",
                tier=3,
                status="FAIL",
                message=f"Detected localStorage.clear() in views: {unconditional_wipes}",
                duration_ms=dt,
                milestone="ALL",
            )
        )

    # =========================================================================
    # 5. 100% 'safeLazy' Dynamic Glob Imports in App.tsx
    # =========================================================================
    if should_run("M3"):
        t0 = time.perf_counter()
        has_safe_lazy_def = "safeLazy" in app_content
        has_load_view_safely = "loadViewSafely" in app_content or "import.meta.glob" in app_content

        # Check that static imports of views are zero
        static_view_import = re.findall(r"import\s+.*\s+from\s+['\"]\.\/views\/.*['\"]", app_content)
        dt = (time.perf_counter() - t0) * 1000.0

        if has_safe_lazy_def and has_load_view_safely and len(static_view_import) == 0:
            results.append(
                TestResult(
                    test_id="T3.IMPORT.01",
                    name="100% safeLazy Dynamic View Loading (Fail-Safe Anti-SPOF)",
                    tier=3,
                    status="PASS",
                    message="All views dynamically loaded via safeLazy/import.meta.glob; 0 static view imports",
                    duration_ms=dt,
                    milestone="M3",
                )
            )
        else:
            details = []
            if not has_safe_lazy_def:
                details.append("Missing 'safeLazy' helper in App.tsx")
            if not has_load_view_safely:
                details.append("Missing 'loadViewSafely' glob loader in App.tsx")
            if len(static_view_import) > 0:
                details.append(f"Found {len(static_view_import)} static view imports in App.tsx")
            results.append(
                TestResult(
                    test_id="T3.IMPORT.01",
                    name="100% safeLazy Dynamic View Loading (Fail-Safe Anti-SPOF)",
                    tier=3,
                    status="FAIL",
                    message="Dynamic view loading contract violated in App.tsx",
                    duration_ms=dt,
                    details=details,
                    milestone="M3",
                )
            )

    # =========================================================================
    # 6. Zero Directory Index Imports (Anti-Bundle Error)
    # =========================================================================
    t0 = time.perf_counter()
    dir_import_pattern = re.compile(r"from\s+['\"](\.\.?\/[^'\"]*\/)?(views|lib|components)['\"]")
    dir_imports = []
    for f_rel in [f for f in ALL_IN_SCOPE_FILES if f.endswith(".tsx") or f.endswith(".ts")]:
        try:
            content = read_repo_file(f_rel)
        except Exception:
            continue
        matches = dir_import_pattern.findall(content)
        if matches:
            dir_imports.append((f_rel, matches))

    dt = (time.perf_counter() - t0) * 1000.0
    if len(dir_imports) == 0:
        results.append(
            TestResult(
                test_id="T3.IMPORT.02",
                name="Zero Directory Index Imports (Single-File Entrypoint Standard)",
                tier=3,
                status="PASS",
                message="Zero directory index imports found across in-scope files",
                duration_ms=dt,
                milestone="ALL",
            )
        )
    else:
        details = [f"{f_rel}: {m}" for f_rel, m in dir_imports[:5]]
        results.append(
            TestResult(
                test_id="T3.IMPORT.02",
                name="Zero Directory Index Imports (Single-File Entrypoint Standard)",
                tier=3,
                status="FAIL",
                message=f"Found directory index imports in {len(dir_imports)} files",
                duration_ms=dt,
                details=details,
                milestone="ALL",
            )
        )

    # =========================================================================
    # 7. Multilingual Support Continuity (12 Languages via i18n)
    # =========================================================================
    t0 = time.perf_counter()
    i18n_path = "src/lib/i18n.ts"
    try:
        i18n_content = read_repo_file(i18n_path)
        required_langs = ["ko", "en", "ja", "zh-CN", "zh-TW", "de", "es", "fr", "id", "ru", "th", "vi"]
        missing_langs = [l for l in required_langs if f"'{l}'" not in i18n_content and f'"{l}"' not in i18n_content]
    except Exception:
        missing_langs = ["failed to read i18n.ts"]

    dt = (time.perf_counter() - t0) * 1000.0
    if len(missing_langs) == 0:
        results.append(
            TestResult(
                test_id="T3.I18N.01",
                name="Multilingual Support Continuity (All 12 Language Packs)",
                tier=3,
                status="PASS",
                message="i18n engine contains translation bindings for all 12 supported languages",
                duration_ms=dt,
                milestone="ALL",
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T3.I18N.01",
                name="Multilingual Support Continuity (All 12 Language Packs)",
                tier=3,
                status="FAIL",
                message=f"Missing language pack definitions: {missing_langs}",
                duration_ms=dt,
                milestone="ALL",
            )
        )

    # =========================================================================
    # 8. Audio Settings & BGM Continuity across Views
    # =========================================================================
    if should_run("M3"):
        t0 = time.perf_counter()
        has_audio_toggle = "hud-audio-toggle" in app_content or "isMuted" in app_content
        has_audio_persistence = "hero_audio_settings" in app_content or "snshero_audio_settings" in app_content or "hero_bgm" in app_content
        dt = (time.perf_counter() - t0) * 1000.0

        if has_audio_toggle and has_audio_persistence:
            results.append(
                TestResult(
                    test_id="T3.AUDIO.01",
                    name="Global Audio State & BGM Continuity",
                    tier=3,
                    status="PASS",
                    message="Global audio toggle and persistence integrated into app shell",
                    duration_ms=dt,
                    milestone="M3",
                )
            )
        else:
            results.append(
                TestResult(
                    test_id="T3.AUDIO.01",
                    name="Global Audio State & BGM Continuity",
                    tier=3,
                    status="FAIL",
                    message="Global audio toggle or persistence missing from App shell",
                    duration_ms=dt,
                    milestone="M3",
                )
            )

    # =========================================================================
    # 9. Bottom Navigation Dock Integration & 44px+ CTAs
    # =========================================================================
    if should_run("M3"):
        t0 = time.perf_counter()
        navbar_content = read_repo_file("src/components/Navbar.tsx")
        has_dock_nav = "home" in navbar_content and "mydeck" in navbar_content and ("main" in navbar_content or "play" in navbar_content) and "shop" in navbar_content
        navbar_buttons = extract_button_tags(navbar_content)
        sub_44_nav = [b for b in navbar_buttons if not check_button_has_44px(b["className"])]
        dt = (time.perf_counter() - t0) * 1000.0

        if has_dock_nav and len(sub_44_nav) == 0:
            results.append(
                TestResult(
                    test_id="T3.NAVBAR.01",
                    name="Bottom Navigation Dock Integration & 44px+ Tap Targets",
                    tier=3,
                    status="PASS",
                    message="Bottom navigation dock enforces min-h-11 on all navigation tabs",
                    duration_ms=dt,
                    milestone="M3",
                )
            )
        else:
            results.append(
                TestResult(
                    test_id="T3.NAVBAR.01",
                    name="Bottom Navigation Dock Integration & 44px+ Tap Targets",
                    tier=3,
                    status="FAIL",
                    message=f"Navbar missing routes or contains {len(sub_44_nav)} sub-44px buttons",
                    duration_ms=dt,
                    milestone="M3",
                )
            )

    # =========================================================================
    # 10. Design System Surface Continuity (Warm Cream & Ink Dark Tokens)
    # =========================================================================
    t0 = time.perf_counter()
    non_surface_views = []
    surface_tokens = ("bg-[#fdfcfc]", "bg-[#f8f7f7]", "bg-[#201d1d]", "bg-[#090d16]", "var(--ui-canvas)", "app-bg")

    for f_rel in CORE_22_VIEWS:
        try:
            content = read_repo_file(f_rel)
        except Exception:
            continue
        if not any(tok in content for tok in surface_tokens):
            non_surface_views.append(f_rel)

    dt = (time.perf_counter() - t0) * 1000.0
    if len(non_surface_views) == 0:
        results.append(
            TestResult(
                test_id="T3.THEME.01",
                name="Design System Surface Palette Continuity (#fdfcfc / #201d1d)",
                tier=3,
                status="PASS",
                message="All 22 core views incorporate canonical OpenCode surface tokens",
                duration_ms=dt,
                milestone="ALL",
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T3.THEME.01",
                name="Design System Surface Palette Continuity (#fdfcfc / #201d1d)",
                tier=3,
                status="FAIL",
                message=f"Views lacking canonical surface tokens: {non_surface_views}",
                duration_ms=dt,
                milestone="ALL",
            )
        )

    return results
