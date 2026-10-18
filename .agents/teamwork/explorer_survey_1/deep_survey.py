#!/usr/bin/env python3
import os
import re
import json

BASE_DIR = "/Users/dayyoung/project/snshero"

def analyze_target(filepath):
    abs_path = os.path.join(BASE_DIR, filepath)
    with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()
        lines = content.splitlines()

    print(f"\n==========================================")
    print(f"ANALYZING: {filepath} ({len(lines)} lines)")
    print(f"==========================================")

    # 1. Non-compliant Tailwind classes
    rules = {
        "gradient": re.compile(r'\bbg-gradient-to-[a-z0-9-]+\b'),
        "rounded_forbidden": re.compile(r'\brounded-(?:lg|xl|2xl|3xl)\b'),
        "rounded_full": re.compile(r'\brounded-full\b'),
        "heavy_shadow": re.compile(r'\bshadow-(?:xl|2xl|lg|md)\b'),
        "annoying_animations": re.compile(r'\banimate-(?:ping|bounce)\b'),
        "animate_pulse": re.compile(r'\banimate-pulse\b'),
        "non_mono_font": re.compile(r'\bfont-(?:sans|serif)\b'),
    }

    violation_counts = {}
    sample_violations = {}
    for name, pat in rules.items():
        matches = []
        for idx, line in enumerate(lines, 1):
            m = pat.findall(line)
            if m:
                for match_val in m:
                    matches.append((idx, match_val, line.strip()))
        violation_counts[name] = len(matches)
        sample_violations[name] = matches[:8]

    print("Violation Counts:")
    for k, v in violation_counts.items():
        print(f"  - {k}: {v}")

    # 2. Touch targets on buttons
    button_blocks = []
    # Find all <button ... > tags (can span multiple lines)
    btn_regex = re.compile(r'<button\b([^>]*?)>', re.DOTALL)
    for m in btn_regex.finditer(content):
        start_char = m.start()
        line_num = content.count('\n', 0, start_char) + 1
        tag_content = m.group(1)
        # Check height attributes
        has_min_44 = bool(re.search(r'\b(min-h-(?:11|12|\[44px\])|h-11|h-12|h-\[44px\])\b', tag_content))
        has_sub_44 = bool(re.search(r'\b(h-[1-9]|h-10|h-\[(?:[1-3][0-9]|4[0-3])px\]|min-h-\[(?:[1-3][0-9]|4[0-3])px\])\b', tag_content))
        classes = ""
        c_match = re.search(r'className=["\'`{]([^"\'`}]*)', tag_content)
        if c_match:
            classes = c_match.group(1)
        
        button_blocks.append({
            "line": line_num,
            "has_min_44": has_min_44,
            "has_sub_44": has_sub_44,
            "tag": tag_content.strip()[:100],
            "classes": classes
        })

    sub_44_buttons = [b for b in button_blocks if b["has_sub_44"] or (not b["has_min_44"] and not "hidden" in b["classes"])]
    print(f"Total <button> elements: {len(button_blocks)}")
    print(f"Buttons lacking 44px+ height: {len(sub_44_buttons)}")
    if sub_44_buttons:
        print("Sample sub-44px buttons:")
        for b in sub_44_buttons[:5]:
            print(f"  Line {b['line']}: {b['tag']}")

    # 3. Floating overlays / obstruction risks
    fixed_elements = []
    for idx, line in enumerate(lines, 1):
        if re.search(r'\b(fixed|absolute)\b', line) and re.search(r'\b(z-[345][0-9]|z-50|inset-0|bottom-0|top-0)\b', line):
            fixed_elements.append((idx, line.strip()))
    print(f"Fixed/absolute high-z overlays: {len(fixed_elements)}")

    # 4. Modals and close buttons
    modals = []
    modal_tags = re.findall(r'<([A-Z][a-zA-Z0-9]*Modal)\b', content)
    print(f"Modal components used: {set(modal_tags)}")

    # 5. LocalStorage keys
    ls_keys = set(re.findall(r'localStorage\.(?:getItem|setItem|removeItem)\s*\(\s*[\'"`]([^\'"`]+)[\'"`]', content))
    print(f"LocalStorage keys found: {sorted(list(ls_keys))}")

    # 6. Hardcoded strings check (simple heuristic for Korean text in JSX)
    ko_lines = []
    for idx, line in enumerate(lines, 1):
        if re.search(r'[\uac00-\ud7a3]', line) and not line.strip().startswith("//") and not line.strip().startswith("/*"):
            # Check if inside t() or translateText
            if "t(" not in line and "translateText" not in line and "t`" not in line:
                ko_lines.append((idx, line.strip()[:80]))
    print(f"Hardcoded Korean string lines (non-i18n): {len(ko_lines)}")

    return {
        "filepath": filepath,
        "line_count": len(lines),
        "violation_counts": violation_counts,
        "sample_violations": sample_violations,
        "total_buttons": len(button_blocks),
        "sub_44_buttons_count": len(sub_44_buttons),
        "sub_44_samples": sub_44_buttons[:10],
        "fixed_overlays_count": len(fixed_elements),
        "fixed_overlays_samples": fixed_elements[:8],
        "modals": sorted(list(set(modal_tags))),
        "local_storage_keys": sorted(list(ls_keys)),
        "hardcoded_ko_count": len(ko_lines),
        "hardcoded_ko_samples": ko_lines[:10],
    }

def main():
    targets = [
        "src/views/HomeView.tsx",
        "src/views/MobileCardPlayScreen.tsx",
        "src/views/MyDeckView.tsx",
        "src/views/PlayGameView.tsx",
        "src/components/PageHeader.tsx",
        "src/components/battle/TacticalCommandHUD.tsx",
        "src/components/battle/TacticalSynergyMatrix.tsx",
        "src/components/battle/StarBreathingUltimateWidget.tsx",
        "src/components/battle/ElementalTempestWidget.tsx",
    ]
    all_data = {}
    for t in targets:
        all_data[t] = analyze_target(t)

    out_file = "/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/deep_survey_output.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(all_data, f, indent=2, ensure_ascii=False)
    print(f"\nSaved full report to {out_file}")

if __name__ == "__main__":
    main()
