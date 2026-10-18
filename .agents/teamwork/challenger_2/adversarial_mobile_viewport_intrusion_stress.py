"""Adversarial Mobile Viewport & Canvas Intrusion Stress Test Harness

Challenger 2: Mobile Viewport & Canvas Intrusion Stress Testing for SNSHero Revolution.
Evaluates:
1. 375x812 iPhone SE/mini viewport ergonomics (horizontal bleed, hardcoded widths > 375px, min-width violations).
2. Canvas & playfield zero-intrusion (3x3 card battle board, player card hand, Poki mini-game canvas, webtoon panels, movie stage).
3. Progressive disclosure & modal popup storms (concurrent/sequential unprompted popups on mount).
4. Fixed/sticky toolbar overlaps & bottom dock Navbar clearance.
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any

REPO_ROOT = Path("/Users/dayyoung/project/snshero")
sys.path.insert(0, str(REPO_ROOT))

from tests.e2e_design_system.helpers import CORE_22_VIEWS, read_repo_file, extract_button_tags, check_button_has_44px

def audit_375px_horizontal_bleed():
    print("\n" + "=" * 80)
    print("STRESS TEST 1: 375x812 VIEWPORT HORIZONTAL BLEED & FIXED WIDTH VIOLATIONS")
    print("=" * 80)
    
    findings = []
    
    for view_rel in CORE_22_VIEWS:
        content = read_repo_file(view_rel)
        lines = content.splitlines()
        
        # 1. Check for fixed Tailwind widths w-[XXXpx] or min-w-[XXXpx] without responsive breakpoint prefix
        fixed_w_pattern = re.compile(r'(?<!max-)(?<!min-)(?<!sm:)(?<!md:)(?<!lg:)(?<!xl:)(?<!2xl:)\bw-\[(\d+)px\]')
        min_w_pattern = re.compile(r'(?<!sm:)(?<!md:)(?<!lg:)(?<!xl:)(?<!2xl:)\bmin-w-\[(\d+)px\]')
        inline_w_pattern = re.compile(r'style\s*=\s*\{\{[^}]*width\s*:\s*[\'"`]?(\d+)px[\'"`]?', re.IGNORECASE)
        
        view_violations = []
        
        for idx, line in enumerate(lines, start=1):
            # Check fixed w-[...]
            for m in fixed_w_pattern.finditer(line):
                w_val = int(m.group(1))
                if w_val > 375:
                    view_violations.append((idx, f"w-[{w_val}px]", line.strip()[:90]))
            # Check min-w-[...]
            for m in min_w_pattern.finditer(line):
                w_val = int(m.group(1))
                if w_val > 375:
                    view_violations.append((idx, f"min-w-[{w_val}px]", line.strip()[:90]))
            # Check inline style width: XXXpx
            for m in inline_w_pattern.finditer(line):
                w_val = int(m.group(1))
                if w_val > 375:
                    view_violations.append((idx, f"inline-style width: {w_val}px", line.strip()[:90]))
                    
        # Check if root has overflow-x containment
        has_overflow_x_guard = bool(re.search(r'overflow-x-(?:hidden|clip)|overflow-hidden', content))
        
        status = "PASS" if len(view_violations) == 0 else "FAIL"
        print(f"[{status}] {view_rel} (overflow-x guard: {has_overflow_x_guard}): {len(view_violations)} violations")
        for line_no, tok, snippet in view_violations[:5]:
            print(f"      Line {line_no}: {tok} -> {snippet}")
            
        findings.append({
            "view": view_rel,
            "violations_count": len(view_violations),
            "violations": view_violations,
            "has_overflow_x_guard": has_overflow_x_guard
        })
        
    return findings

def audit_zero_viewport_intrusion():
    print("\n" + "=" * 80)
    print("STRESS TEST 2: ZERO VIEWPORT INTRUSION (BATTLE BOARD, HAND, CANVAS, ARTWORK)")
    print("=" * 80)
    
    # 2.1 Battle Board & Hand (MobileCardPlayScreen.tsx)
    print("\n--- 2.1 MobileCardPlayScreen: 3x3 Board & Player Hand Clearance ---")
    mc_content = read_repo_file("src/views/MobileCardPlayScreen.tsx")
    
    # Check board grid isolation and z-index layers
    has_isolated_board = "aspect-square" in mc_content or "grid-cols-3" in mc_content
    has_floating_over_board = bool(re.search(r'absolute.*inset-0.*(?:z-20|z-30|z-40|z-50)', mc_content))
    # TacticalCommandHUD positioning in MobileCardPlayScreen
    has_tactical_hud = "TacticalCommandHUD" in mc_content
    
    print(f"3x3 Grid present: {has_isolated_board}")
    print(f"TacticalCommandHUD included: {has_tactical_hud}")
    
    # Check TacticalCommandHUD.tsx directly
    hud_content = read_repo_file("src/components/battle/TacticalCommandHUD.tsx")
    # Does TacticalCommandHUD have collapse toggle?
    has_collapse_toggle = bool(re.search(r'isCollapsed|setIsCollapsed|chevron|toggle|최소화', hud_content, re.IGNORECASE))
    hud_positioning = re.findall(r'(?:fixed|absolute)\s+[^"\'`>]+', hud_content)
    print(f"TacticalCommandHUD collapse toggle: {has_collapse_toggle}")
    print(f"TacticalCommandHUD layout positioning: {hud_positioning[:2]}")
    
    # 2.2 Poki Mini-Game Canvas (PlayGameView.tsx)
    print("\n--- 2.2 PlayGameView: Mini-Game Canvas & Floating Overlays ---")
    pg_content = read_repo_file("src/views/PlayGameView.tsx")
    
    # Look for floating buttons that could intrude into game canvas
    floating_elements = re.findall(r'<div[^>]*className=["\'][^"\']*(?:fixed|absolute)[^"\']*(?:bottom-|top-|inset-)[^"\']*["\']', pg_content)
    print(f"PlayGameView floating/absolute containers: {len(floating_elements)}")
    
    # Check if canvas container has dedicated touch-none or isolated bounds
    has_canvas_isolation = "canvas" in pg_content.lower() and ("touch-none" in pg_content or "select-none" in pg_content)
    print(f"PlayGameView canvas isolation: {has_canvas_isolation}")
    
    # Check auto-battle floating robot button
    auto_battle_floating = re.findall(r'autoBattle.*fixed|fixed.*autoBattle', pg_content, re.IGNORECASE)
    print(f"Auto battle floating overlay instances: {len(auto_battle_floating)}")
    
    # 2.3 Novel & Webtoon (NovelView.tsx)
    print("\n--- 2.3 NovelView: Webtoon Artwork & Speech Bubble Overlay Clearance ---")
    nv_content = read_repo_file("src/views/NovelView.tsx")
    # Check speech bubbles positioning and toggle
    speech_bubble_controls = re.findall(r'speechBubble|speech|bubble|showDialogue|showBubbles', nv_content, re.IGNORECASE)
    print(f"Webtoon dialogue/speech bubble controls: {len(speech_bubble_controls)}")
    # Check sticky header
    sticky_header = re.findall(r'sticky\s+top-0[^"\'`>]*', nv_content)
    print(f"NovelView sticky header classes: {sticky_header}")
    
    # 2.4 Movie Theater (MovieView.tsx & CinematicMoviePlayer.tsx)
    print("\n--- 2.4 MovieView & CinematicMoviePlayer: Stage Canvas & Subtitle Overlay ---")
    cmp_content = read_repo_file("src/components/movie/CinematicMoviePlayer.tsx")
    # Subtitle ON/OFF toggle
    has_subtitle_toggle = "subtitleMode" in cmp_content or "showSubtitle" in cmp_content or "CC" in cmp_content
    # Scrubber and HUD layout
    has_floating_hud = bool(re.search(r'absolute.*bottom-0', cmp_content))
    print(f"CinematicMoviePlayer subtitle toggle present: {has_subtitle_toggle}")
    print(f"CinematicMoviePlayer bottom HUD present: {has_floating_hud}")
    
    return {
        "tactical_hud_collapsible": has_collapse_toggle,
        "canvas_isolation": has_canvas_isolation,
        "movie_subtitle_toggle": has_subtitle_toggle
    }

def audit_progressive_disclosure_popup_storms():
    print("\n" + "=" * 80)
    print("STRESS TEST 3: PROGRESSIVE DISCLOSURE & MODAL POPUP STORMS ON MOUNT")
    print("=" * 80)
    
    storm_risks = []
    
    # Check App.tsx and HomeView.tsx for multiple set*Modal(true) in useEffect on mount
    targets = [
        "src/App.tsx",
        "src/views/HomeView.tsx",
        "src/views/MobileCardPlayScreen.tsx",
        "src/views/ShopView.tsx",
        "src/views/SettingView.tsx",
    ]
    
    for t_rel in targets:
        content = read_repo_file(t_rel)
        lines = content.splitlines()
        
        # Look for useEffect blocks with empty or mount-only deps []
        mount_effects = []
        in_effect = False
        effect_buffer = []
        effect_start = 0
        
        for idx, line in enumerate(lines, start=1):
            if "useEffect(" in line:
                in_effect = True
                effect_start = idx
                effect_buffer = [line]
                continue
            if in_effect:
                effect_buffer.append(line)
                if re.search(r'\},\s*\[\s*\]\s*\)', line):
                    # Found a mount effect!
                    full_effect = "\n".join(effect_buffer)
                    # Check how many modal openers are in this effect
                    modal_opens = re.findall(r'(?:set\w*(?:Modal|Popup|Dialog|Alert|Drawer|Notification|Banner|Tour|Tutorial)\w*\(\s*true\b)', full_effect)
                    if modal_opens:
                        mount_effects.append((effect_start, idx, modal_opens, full_effect))
                    in_effect = False
                    effect_buffer = []
                elif len(effect_buffer) > 100: # safety limit
                    in_effect = False
                    effect_buffer = []
                    
        print(f"\n{t_rel}: Found {len(mount_effects)} mount effects triggering modals/popups")
        for start_l, end_l, opens, code in mount_effects:
            print(f"  Lines {start_l}-{end_l}: Triggers {len(opens)} modals on mount: {opens}")
            if len(opens) > 1:
                print(f"  [POTENTIAL POPUP STORM] Multiple modal state setters triggered on mount without user action!")
                storm_risks.append((t_rel, start_l, opens))
                
        # Also check for sequential un-deferred chained popups
        chained_popups = re.findall(r'setShow\w+\(true\);\s*setShow\w+\(true\);', content)
        if chained_popups:
            print(f"  [CHAINED POPUPS]: {chained_popups}")
            storm_risks.append((t_rel, 0, chained_popups))
            
    return storm_risks

def audit_bottom_dock_clearance():
    print("\n" + "=" * 80)
    print("STRESS TEST 4: BOTTOM DOCK CLEARANCE (NAVBAR OCCLUSION AUDIT)")
    print("=" * 80)
    
    app_content = read_repo_file("src/App.tsx")
    # Identify which views display Navbar
    # Line 6407: showNavbar = (view !== 'reddit' && view !== 'bench' && view !== 'gwent' && view !== 'admin' && view !== 'landing' && view !== 'cartoonBook' && view !== 'novel' && view !== 'webtoon' && view !== 'anime' && view !== 'movie' && view !== 'card-play' && !isPlayingBattle) && !isGlobalPopupOpen;
    # Line 6942: showNavbar ? "pb-[calc(5rem+env(safe-area-inset-bottom,0px))]" : "pb-0"
    
    print("App.tsx root wrapper dock clearance:")
    app_dock_padding = re.findall(r'showNavbar\s*\?\s*["\']([^"\']+)["\']\s*:\s*["\']([^"\']+)["\']', app_content)
    print(f"  Ternary padding: {app_dock_padding}")
    
    # Now check whether each view adds its own internal bottom clearance
    view_clearances = {}
    for v_rel in CORE_22_VIEWS:
        content = read_repo_file(v_rel)
        pb_tokens = re.findall(r'\bpb-(?:\[[^\]]+\]|\d+(?:\.\d+)?|safe)', content)
        view_clearances[v_rel] = list(set(pb_tokens))
        print(f"  {v_rel}: {len(pb_tokens)} bottom padding tokens: {set(pb_tokens)}")
        
    return view_clearances

if __name__ == "__main__":
    b1 = audit_375px_horizontal_bleed()
    b2 = audit_zero_viewport_intrusion()
    b3 = audit_progressive_disclosure_popup_storms()
    b4 = audit_bottom_dock_clearance()
