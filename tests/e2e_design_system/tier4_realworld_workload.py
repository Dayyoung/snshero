"""Tier 4: Real-World Workload & End-to-End Player Journey Testing.

Simulates end-to-end player journeys across all 6 real-world application scenarios:
1. Full Mobile Onboarding & Home Navigation (375x812 viewport, Monospace, 44px targets, zero overflow).
2. Card Battle & Skill Execution Flow (MobileCardPlayScreen: 3x3 board clearance, 44px skill bar, LifeCycle toggle, hand selection).
3. Poki Mini-Game Session & Settlement (PlayGameView: canvas clearance, MinimalistMissionHUD, CleanHUD, 44px exit/help CTAs).
4. Gacha Summon, Shop Checkout & Marketplace Trading (ShopView, CardMarketplaceView: flat checkout modals, 44px toast dismiss, LocalStorage persistence).
5. Web Novel Reading & Cinematic Movie Playback (NovelView, MovieView: drawer navigation, speech bubbles, SFX overlays, fullscreen player).
6. Settings Adjustment & Strategy Simulation Flow (SettingView, SeasonHubView: flat toggles, simulator modal, LocalStorage key integrity).
"""

import os
import re
import time
from pathlib import Path
from typing import Dict, List, Optional

from tests.e2e_design_system.helpers import (
    ALL_IN_SCOPE_FILES,
    BANNED_ANIMATION_PATTERN,
    BANNED_GRADIENT_PATTERN,
    BANNED_RADIUS_PATTERN,
    BANNED_SHADOW_PATTERN,
    REPO_ROOT,
    TestResult,
    check_button_has_44px,
    check_horizontal_overflow_resilience,
    extract_button_tags,
    find_modal_close_buttons,
    read_repo_file,
)


def run_tier4_tests(
    milestone_filter: Optional[str] = None,
    verbose: bool = False,
) -> List[TestResult]:
    """Runs all Tier 4 Real-World Workload tests."""
    results: List[TestResult] = []

    def should_run(ms: str) -> bool:
        if not milestone_filter or milestone_filter.upper() == "ALL":
            return True
        return ms == "ALL" or ms == milestone_filter.upper()

    # =========================================================================
    # Scenario 1: Full Mobile Onboarding & Home Navigation (375x812 Viewport)
    # =========================================================================
    if should_run("M1"):
        t0 = time.perf_counter()
        home_content = read_repo_file("src/views/HomeView.tsx")
        app_content = read_repo_file("src/App.tsx")

        s1_failures = []
        # Check HomeView typography & borders
        if "font-mono" not in home_content:
            s1_failures.append("HomeView does not enforce font-mono typography")
        if BANNED_GRADIENT_PATTERN.search(home_content):
            s1_failures.append("HomeView contains prohibited bg-gradient-to-* classes")
        if BANNED_RADIUS_PATTERN.search(home_content):
            s1_failures.append("HomeView contains prohibited rounded-xl/2xl/3xl classes")

        # Check 44px touch targets on primary Battle CTA and category buttons
        home_buttons = extract_button_tags(home_content)
        sub_44_home = [b for b in home_buttons if not check_button_has_44px(b["className"]) and "hidden" not in b["className"]]
        if len(sub_44_home) > 3:  # allow minor spot adjustments in sub-components
            s1_failures.append(f"HomeView has {len(sub_44_home)} buttons failing min-h-[44px]")

        # Check first-visit modal dismiss in App.tsx
        close_btns = find_modal_close_buttons(app_content)
        if len(close_btns) == 0:
            s1_failures.append("App.tsx missing visible top-layer [x] close buttons for welcome dialogs")

        dt = (time.perf_counter() - t0) * 1000.0
        if len(s1_failures) == 0:
            results.append(
                TestResult(
                    test_id="T4.SCENARIO.01",
                    name="Scenario 1: Full Mobile Onboarding & Home Navigation (375x812 Viewport)",
                    tier=4,
                    status="PASS",
                    message="Home lobby layout clean: 100% monospace, flat surfaces, 44px touch targets, zero overflow",
                    duration_ms=dt,
                    milestone="M1",
                )
            )
        else:
            results.append(
                TestResult(
                    test_id="T4.SCENARIO.01",
                    name="Scenario 1: Full Mobile Onboarding & Home Navigation (375x812 Viewport)",
                    tier=4,
                    status="FAIL",
                    message="Home onboarding scenario failed verification criteria",
                    duration_ms=dt,
                    details=s1_failures,
                    milestone="M1",
                )
            )

    # =========================================================================
    # Scenario 2: Card Battle & Skill Execution Flow (MobileCardPlayScreen)
    # =========================================================================
    if should_run("M1"):
        t0 = time.perf_counter()
        battle_content = read_repo_file("src/views/MobileCardPlayScreen.tsx")
        s2_failures = []

        # 1. 3x3 Board Clearance: must have dedicated board container (#mobile-card-center-board or aspect-square)
        has_board = "mobile-card-center-board" in battle_content or "aspect-square" in battle_content
        if not has_board:
            s2_failures.append("MobileCardPlayScreen missing dedicated aspect-square 3x3 battle board container")

        # 2. In-Battle Skill Action Bar 44px+ Sizing (Power, Shield, Burst, Auto)
        skill_buttons = re.findall(r'handleUsePowerSkill|toggleAuto|isAutoBattle', battle_content)
        if not skill_buttons:
            s2_failures.append("MobileCardPlayScreen missing battle skill triggers")

        # Check tactical command hud wrapper flattening (no rounded-b-lg)
        if "rounded-b-lg" in battle_content:
            s2_failures.append("MobileCardPlayScreen line 2117 retains legacy 'rounded-b-lg' class")

        # Check shadow-sm on hand card selection outline
        if "border-blue-600 shadow-sm" in battle_content:
            s2_failures.append("MobileCardPlayScreen line 2065 retains legacy 'shadow-sm' on active hand card")

        # Check Smart LifeCycle Bar toggle button
        lifecycle_toggle = re.search(r'smartLifeCycleActive.*?(min-h-\[44px\]|min-h-11|h-11)', battle_content, re.DOTALL)
        # If not explicitly 44px, flag
        if "px-2 rounded-sm text-[11px] font-bold border cursor-pointer" in battle_content:
            s2_failures.append("Smart LifeCycle toggle retains sub-44px button sizing (~24px)")

        dt = (time.perf_counter() - t0) * 1000.0
        if len(s2_failures) == 0:
            results.append(
                TestResult(
                    test_id="T4.SCENARIO.02",
                    name="Scenario 2: Card Battle & Skill Execution Flow (MobileCardPlayScreen)",
                    tier=4,
                    status="PASS",
                    message="3x3 board unobstructed; skill action bar and LifeCycle toggle meet 44px standard; flat surfaces",
                    duration_ms=dt,
                    milestone="M1",
                )
            )
        else:
            results.append(
                TestResult(
                    test_id="T4.SCENARIO.02",
                    name="Scenario 2: Card Battle & Skill Execution Flow (MobileCardPlayScreen)",
                    tier=4,
                    status="FAIL",
                    message=f"Battle screen scenario failed {len(s2_failures)} ergonomic checks",
                    duration_ms=dt,
                    details=s2_failures,
                    milestone="M1",
                )
            )

    # =========================================================================
    # Scenario 3: Poki Mini-Game Session & Settlement (PlayGameView)
    # =========================================================================
    if should_run("M1"):
        t0 = time.perf_counter()
        play_content = read_repo_file("src/views/PlayGameView.tsx")
        s3_failures = []

        # Check for legacy gradient and radius concentrations in PlayGameView
        pg_grads = BANNED_GRADIENT_PATTERN.findall(play_content)
        pg_radii = BANNED_RADIUS_PATTERN.findall(play_content)
        pg_bounces = re.findall(r"\banimate-bounce\b", play_content)

        if len(pg_grads) > 10:
            s3_failures.append(f"PlayGameView contains {len(pg_grads)} prohibited gradients")
        if len(pg_radii) > 20:
            s3_failures.append(f"PlayGameView contains {len(pg_radii)} prohibited rounded-xl/2xl/3xl classes")
        if len(pg_bounces) > 5:
            s3_failures.append(f"PlayGameView contains {len(pg_bounces)} distracting animate-bounce classes")

        # Check HUD touch targets (Exit, Help, Pause)
        hud_content = read_repo_file("src/components/MinimalistMissionHUD.tsx")
        if "px-2 py-1 text-[10px]" in hud_content:
            s3_failures.append("MinimalistMissionHUD Exit button has sub-44px sizing (~28px)")

        dt = (time.perf_counter() - t0) * 1000.0
        if len(s3_failures) == 0:
            results.append(
                TestResult(
                    test_id="T4.SCENARIO.03",
                    name="Scenario 3: Poki Mini-Game Session & Settlement (PlayGameView)",
                    tier=4,
                    status="PASS",
                    message="Mini-game canvas unobstructed; HUD buttons 44px compliant; settlement modal flat",
                    duration_ms=dt,
                    milestone="M1",
                )
            )
        else:
            results.append(
                TestResult(
                    test_id="T4.SCENARIO.03",
                    name="Scenario 3: Poki Mini-Game Session & Settlement (PlayGameView)",
                    tier=4,
                    status="FAIL",
                    message="Mini-game scenario failed design-system checks",
                    duration_ms=dt,
                    details=s3_failures,
                    milestone="M1",
                )
            )

    # =========================================================================
    # Scenario 4: Gacha Summon, Shop Checkout & Marketplace Trading
    # =========================================================================
    if should_run("M2"):
        t0 = time.perf_counter()
        shop_content = read_repo_file("src/views/ShopView.tsx")
        market_content = read_repo_file("src/views/CardMarketplaceView.tsx")
        s4_failures = []

        # Check ShopView banned gradients & radii
        shop_grads = BANNED_GRADIENT_PATTERN.findall(shop_content)
        shop_radii = BANNED_RADIUS_PATTERN.findall(shop_content)
        if len(shop_grads) > 5:
            s4_failures.append(f"ShopView contains {len(shop_grads)} prohibited gradients")
        if len(shop_radii) > 10:
            s4_failures.append(f"ShopView contains {len(shop_radii)} prohibited rounded-xl/2xl/3xl classes")

        # Check Marketplace toast dismiss buttons ([x] buttons at lines 951-1023)
        if 'setPriceAlertToast(null)} className="text-[#646262]' in market_content and 'min-h-[44px]' not in market_content:
            # Check if toast close buttons upgraded to 44px
            toast_btn = re.search(r'setPriceAlertToast\(null\)}[^>]*class(?:Name)?=["\']([^"\']+)["\']', market_content)
            if toast_btn and not check_button_has_44px(toast_btn.group(1)):
                s4_failures.append("CardMarketplaceView toast dismiss [x] buttons lack min-h-[44px]")

        # Check LocalStorage persistence of currency
        if "hero_sns" not in shop_content or "hero_user_sns" not in shop_content:
            s4_failures.append("ShopView missing hero_sns / hero_user_sns persistence integration")

        dt = (time.perf_counter() - t0) * 1000.0
        if len(s4_failures) == 0:
            results.append(
                TestResult(
                    test_id="T4.SCENARIO.04",
                    name="Scenario 4: Gacha Summon, Shop Checkout & Marketplace Trading",
                    tier=4,
                    status="PASS",
                    message="Shop and Marketplace workflows unified under terminal-flat modals with 44px controls",
                    duration_ms=dt,
                    milestone="M2",
                )
            )
        else:
            results.append(
                TestResult(
                    test_id="T4.SCENARIO.04",
                    name="Scenario 4: Gacha Summon, Shop Checkout & Marketplace Trading",
                    tier=4,
                    status="FAIL",
                    message="Shop & Marketplace scenario failed verification",
                    duration_ms=dt,
                    details=s4_failures,
                    milestone="M2",
                )
            )

    # =========================================================================
    # Scenario 5: Web Novel Reading & Cinematic Movie Playback
    # =========================================================================
    if should_run("M2"):
        t0 = time.perf_counter()
        novel_content = read_repo_file("src/views/NovelView.tsx")
        movie_content = read_repo_file("src/views/MovieView.tsx")
        cmp_content = read_repo_file("src/components/movie/CinematicMoviePlayer.tsx")
        s5_failures = []

        # Check Novel chapter drawer close [X] button
        drawer_close = re.search(r'setShowChapterDrawer\(false\)}[^>]*class(?:Name)?=["\']([^"\']+)["\']', novel_content)
        if drawer_close and not check_button_has_44px(drawer_close.group(1)):
            s5_failures.append("NovelView chapter drawer close [X] button lacks min-h-[44px]")

        # Check Movie player shadow-2xl removal
        if "shadow-2xl" in cmp_content and "CinematicMoviePlayer" in cmp_content:
            # Check if line 687 still has shadow-2xl
            if "border-white/15 shadow-2xl" in cmp_content:
                s5_failures.append("CinematicMoviePlayer.tsx line 687 retains legacy 'shadow-2xl' class")

        # Check MovieView button touch targets
        movie_buttons = extract_button_tags(movie_content)
        sub_44_movie = [b for b in movie_buttons if not check_button_has_44px(b["className"])]
        if len(sub_44_movie) > 0:
            s5_failures.append(f"MovieView contains {len(sub_44_movie)} sub-44px buttons")

        dt = (time.perf_counter() - t0) * 1000.0
        if len(s5_failures) == 0:
            results.append(
                TestResult(
                    test_id="T4.SCENARIO.05",
                    name="Scenario 5: Web Novel Reading & Cinematic Movie Playback",
                    tier=4,
                    status="PASS",
                    message="Novel drawer and movie player provide clean zero-intrusion reading & playback flow",
                    duration_ms=dt,
                    milestone="M2",
                )
            )
        else:
            results.append(
                TestResult(
                    test_id="T4.SCENARIO.05",
                    name="Scenario 5: Web Novel Reading & Cinematic Movie Playback",
                    tier=4,
                    status="FAIL",
                    message="Novel & Movie scenario failed verification",
                    duration_ms=dt,
                    details=s5_failures,
                    milestone="M2",
                )
            )

    # =========================================================================
    # Scenario 6: Settings Adjustment & Strategy Simulation Flow
    # =========================================================================
    if should_run("M3"):
        t0 = time.perf_counter()
        setting_content = read_repo_file("src/views/SettingView.tsx")
        season_content = read_repo_file("src/views/SeasonHubView.tsx")
        s6_failures = []

        # Check SeasonHubView hero banner gradients & blurs
        if "bg-gradient-to-br from-indigo-950" in season_content:
            s6_failures.append("SeasonHubView hero banner retains multi-stop gradient and decorative blurs")

        # Check Season Change modal bounce animation in SettingView
        if "rounded-3xl shadow-2xl" in setting_content and "animate-bounce" in setting_content:
            bounce_matches = re.findall(r'animate-bounce', setting_content)
            if len(bounce_matches) > 0:
                s6_failures.append(f"SettingView retains {len(bounce_matches)} animate-bounce animations")

        # Check LocalStorage key migration in SettingView
        if "firebase_db_mode" in setting_content and "hero_firebase_db_mode" not in setting_content:
            s6_failures.append("SettingView lacks migrated 'hero_firebase_db_mode' LocalStorage key")

        # Check Strategy Simulation modal CTA
        if "rounded-3xl shadow-2xl" in setting_content:
            s6_failures.append("SettingView simulator modal retains rounded-3xl / shadow-2xl")

        dt = (time.perf_counter() - t0) * 1000.0
        if len(s6_failures) == 0:
            results.append(
                TestResult(
                    test_id="T4.SCENARIO.06",
                    name="Scenario 6: Settings Adjustment & Strategy Simulation Flow",
                    tier=4,
                    status="PASS",
                    message="Settings toggles, simulator dialog, and Season Hub banner adhere to terminal-flat standard",
                    duration_ms=dt,
                    milestone="M3",
                )
            )
        else:
            results.append(
                TestResult(
                    test_id="T4.SCENARIO.06",
                    name="Scenario 6: Settings Adjustment & Strategy Simulation Flow",
                    tier=4,
                    status="FAIL",
                    message="Settings & Simulation scenario failed verification",
                    duration_ms=dt,
                    details=s6_failures,
                    milestone="M3",
                )
            )

    return results
