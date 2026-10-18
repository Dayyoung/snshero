"""Adversarial Stress Testing Scanner - Challenger 1
Focus: Class Token Hygiene, Hidden/Dynamic Concatenations, and Button Touch Target Measurements.
"""

import os
import re
import glob
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
import sys
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from tests.e2e_design_system.helpers import ALL_47_VIEWS, ALL_620_COMPONENTS

CORE_22_VIEWS = ALL_47_VIEWS

SHARED_COMPONENTS = ["src/App.tsx"] + ALL_620_COMPONENTS


TOUCH_44PX_TOKENS = (
    "min-h-[44px]", "min-h-[46px]", "min-h-[48px]", "min-h-[50px]", "min-h-[52px]",
    "min-h-[56px]", "min-h-[60px]", "min-h-[64px]", "min-h-[70px]", "min-h-[80px]",
    "min-h-11", "min-h-12", "min-h-14", "min-h-16", "min-h-20", "min-h-24", "min-h-28",
    "min-h-32", "min-h-36", "h-11", "h-12", "h-14", "h-16", "h-20", "h-24",
    "h-[44px]", "h-[48px]", "h-[50px]", "h-[56px]", "h-[64px]",
    "py-3", "py-3.5", "py-4", "py-5", "py-6", "p-3", "p-3.5", "p-4", "p-5",
)

SUB_44PX_HINTS = (
    "h-6", "h-7", "h-8", "h-9", "h-10",
    "min-h-[28px]", "min-h-[30px]", "min-h-[32px]", "min-h-[36px]", "min-h-[38px]", "min-h-[40px]",
    "py-1", "py-1.5", "py-2", "py-2.5", "p-1", "p-1.5", "p-2", "p-2.5",
)

PROHIBITED_PATTERNS = {
    "gradient": re.compile(r"\bbg-gradient-to-[a-z]+\b"),
    "banned_radius_xl_3xl": re.compile(r"\brounded-(?:xl|2xl|3xl)\b"),
    "banned_radius_lg": re.compile(r"\brounded-lg\b"),
    "banned_animation": re.compile(r"\banimate-(?:ping|bounce)\b"),
    "banned_font": re.compile(r"\bfont-(?:sans|serif)\b"),
    "heavy_shadow": re.compile(r"\bshadow-(?:md|lg|xl|2xl)\b"),
}

DYNAMIC_CONCAT_PATTERNS = [
    re.compile(r"['\"`]bg-gradient-['\"`]\s*\+"),
    re.compile(r"['\"`]rounded-['\"`]\s*\+"),
    re.compile(r"['\"`]animate-['\"`]\s*\+"),
    re.compile(r"['\"`]font-['\"`]\s*\+"),
    re.compile(r"`[^`]*\$\{[^}]+\}(?:xl|2xl|3xl)[^`]*`"),
    re.compile(r"`[^`]*bg-gradient-\$\{[^}]+\}[^`]*`"),
    re.compile(r"`[^`]*rounded-\$\{[^}]+\}[^`]*`"),
    re.compile(r"`[^`]*animate-\$\{[^}]+\}[^`]*`"),
]


def extract_all_buttons(content: str):
    """Accurately parses all JSX <button> elements in content with full opening tag extraction."""
    results = []
    pattern = re.compile(r"<button\b")
    pos = 0

    while True:
        m = pattern.search(content, pos)
        if not m:
            break
        start_idx = m.start()
        i = m.end()
        brace_depth = 0
        in_str = None
        escaped = False

        while i < len(content):
            ch = content[i]
            if in_str:
                if ch == "\\" and not escaped:
                    escaped = True
                elif ch == in_str and not escaped:
                    in_str = None
                else:
                    escaped = False
            else:
                if ch in ('"', "'", "`"):
                    in_str = ch
                elif ch == "{":
                    brace_depth += 1
                elif ch == "}":
                    if brace_depth > 0:
                        brace_depth -= 1
                elif ch == ">" and brace_depth == 0:
                    break
            i += 1

        tag_full = content[start_idx : i + 1]
        line_num = content[:start_idx].count("\n") + 1

        # Check for qualifying 44px+ height token
        is_44px = any(tok in tag_full for tok in TOUCH_44PX_TOKENS)

        # Detect sub-44px markers if present
        sub_markers = [s for s in SUB_44PX_HINTS if s in tag_full]

        results.append({
            "line": line_num,
            "tag": tag_full,
            "is_44px": is_44px,
            "sub_markers": sub_markers,
        })
        pos = i + 1

    return results


def run_adversarial_stress_audit():
    print("======================================================================")
    print("  ADVERSARIAL STRESS AUDIT: CHALLENGER 1 (OpenCode Terminal-Flat)     ")
    print("======================================================================\n")

    all_files = list(dict.fromkeys(CORE_22_VIEWS + SHARED_COMPONENTS))
    
    # 1. Class token scanning
    print("--- PART 1: ADVERSARIAL PROHIBITED CLASS SCAN ---")
    class_violations = {}
    dynamic_violations = {}
    
    for rel_path in all_files:
        full_path = REPO_ROOT / rel_path
        if not full_path.exists():
            print(f"[MISSING FILE] {rel_path}")
            continue
        content = full_path.read_text(encoding="utf-8")
        lines = content.splitlines()

        for cat, pat in PROHIBITED_PATTERNS.items():
            for line_idx, line in enumerate(lines):
                line_str = line.strip()
                if line_str.startswith("//") or line_str.startswith("/*") or line_str.startswith("*"):
                    continue
                matches = pat.findall(line)
                if matches:
                    if rel_path not in class_violations:
                        class_violations[rel_path] = []
                    for m in matches:
                        class_violations[rel_path].append((line_idx + 1, cat, m, line_str[:120]))

        for dyn_pat in DYNAMIC_CONCAT_PATTERNS:
            for line_idx, line in enumerate(lines):
                if dyn_pat.search(line):
                    if rel_path not in dynamic_violations:
                        dynamic_violations[rel_path] = []
                    dynamic_violations[rel_path].append((line_idx + 1, dyn_pat.pattern, line.strip()[:120]))

    if not class_violations and not dynamic_violations:
        print(">> Class Token Scan: 0 violations found across all 22 views and shared components! (100% CLEAN)")
    else:
        print(f">> Class Token Violations: Detected in {len(class_violations)} files!")
        for file_path, viols in class_violations.items():
            print(f"  FILE: {file_path} ({len(viols)} violations)")
            for line_no, cat, token, snippet in viols[:5]:
                print(f"    - Line {line_no} [{cat}]: '{token}' -> {snippet}")
            if len(viols) > 5:
                print(f"    ... and {len(viols) - 5} more")

    if dynamic_violations:
        print(f">> Dynamic Concatenation Violations: Detected in {len(dynamic_violations)} files!")
        for file_path, viols in dynamic_violations.items():
            print(f"  FILE: {file_path}")
            for line_no, pat, snippet in viols:
                print(f"    - Line {line_no}: pattern '{pat}' -> {snippet}")

    # 2. Button Measurement Census
    print("\n--- PART 2: INTERACTIVE <button> TOUCH TARGET CENSUS ---")
    total_buttons_all = 0
    total_44px_all = 0
    total_sub44px_all = 0
    view_button_failures = {}

    for rel_path in CORE_22_VIEWS:
        full_path = REPO_ROOT / rel_path
        if not full_path.exists():
            continue
        content = full_path.read_text(encoding="utf-8")
        buttons = extract_all_buttons(content)
        
        btn_count = len(buttons)
        btn_44px = sum(1 for b in buttons if b["is_44px"])
        btn_sub = btn_count - btn_44px

        total_buttons_all += btn_count
        total_44px_all += btn_44px
        total_sub44px_all += btn_sub

        status_str = "PASS" if btn_sub == 0 else f"FAIL ({btn_sub} sub-44px)"
        print(f"[{status_str:18}] {rel_path:<36} Total: {btn_count:>3} | >=44px: {btn_44px:>3} | Sub-44px: {btn_sub:>2}")

        if btn_sub > 0:
            view_button_failures[rel_path] = [b for b in buttons if not b["is_44px"]]

    print(f"\n>> OVERALL BUTTON CENSUS:")
    print(f"   Total Interactive Buttons : {total_buttons_all}")
    print(f"   Compliant (>= 44px)       : {total_44px_all} ({total_44px_all/total_buttons_all*100:.1f}%)")
    print(f"   Non-Compliant (Sub-44px)  : {total_sub44px_all} ({total_sub44px_all/total_buttons_all*100:.1f}%)")

    if view_button_failures:
        print("\n--- DETAILED FAILURE EVIDENCE: NON-COMPLIANT BUTTONS ---")
        for rel_path, failed_btns in view_button_failures.items():
            print(f"\n[FAIL] {rel_path} ({len(failed_btns)} non-compliant buttons):")
            for b in failed_btns:
                clean_tag = " ".join(b["tag"].replace("\n", " ").split())
                print(f"  Line {b['line']:<5}: sub-markers={b['sub_markers']} | Tag: {clean_tag[:130]}")

    # 3. Viewport and Modal Dismiss Audit
    print("\n--- PART 3: VIEWPORT & MODAL DISMISS CONTROLS AUDIT ---")
    viewport_failures = []
    for rel_path in CORE_22_VIEWS:
        full_path = REPO_ROOT / rel_path
        content = full_path.read_text(encoding="utf-8")
        has_clearance = bool(re.search(r"pb-(?:24|28|32|36|40|44|48|safe)", content))
        if not has_clearance:
            viewport_failures.append(rel_path)

    print(f"Views missing navigation dock bottom padding (pb-24/28/32/36/40/safe): {len(viewport_failures)}")
    for vf in viewport_failures:
        print(f"  - {vf}")

    print("\n======================================================================")
    print("  EMPIRICAL CHALLENGER VERDICT                                        ")
    print("======================================================================")
    if total_sub44px_all > 0 or class_violations or viewport_failures:
        print(">> VERDICT: REJECT")
        print(f">> Reason: Codebase fails strict 44px+ touch ergonomics ({total_sub44px_all} failing buttons in {len(view_button_failures)} views)")
        if viewport_failures:
            print(f">> Reason: {len(viewport_failures)} views lack bottom dock clearance padding")
        if class_violations:
            print(f">> Reason: {len(class_violations)} files contain prohibited classes")
    else:
        print(">> VERDICT: CONFIRM CORRECTNESS (APPROVE)")
    print("======================================================================\n")


if __name__ == "__main__":
    run_adversarial_stress_audit()
