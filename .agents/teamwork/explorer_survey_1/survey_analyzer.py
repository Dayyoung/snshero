#!/usr/bin/env python3
"""
Comprehensive Static Audit Script for Survey Explorer 1
Targets:
- src/views/HomeView.tsx
- src/views/MobileCardPlayScreen.tsx
- src/views/MyDeckView.tsx
- src/views/PlayGameView.tsx
- src/components/PageHeader.tsx
- Battle HUDs & Overlays:
  - src/components/battle/TacticalCommandHUD.tsx
  - src/components/battle/TacticalSynergyMatrix.tsx
  - src/components/battle/StarBreathingUltimateWidget.tsx
  - src/components/battle/ElementalTempestWidget.tsx
  - src/components/battle/TacticalPassivePerksModal.tsx
  - src/components/BattleBossHUD.tsx
  - src/components/MinimalistMissionHUD.tsx
  - src/components/MissionGameCardHUD.tsx
  - src/components/OpponentThreatHUD.tsx
  - src/components/OpponentHandElementHUD.tsx
  - src/components/DemoPlayHUD.tsx
  - src/components/ResponsiveCleanHUD.tsx
"""

import os
import re
import json

TARGET_FILES = [
    "src/views/HomeView.tsx",
    "src/views/MobileCardPlayScreen.tsx",
    "src/views/MyDeckView.tsx",
    "src/views/PlayGameView.tsx",
    "src/components/PageHeader.tsx",
    "src/components/battle/TacticalCommandHUD.tsx",
    "src/components/battle/TacticalSynergyMatrix.tsx",
    "src/components/battle/StarBreathingUltimateWidget.tsx",
    "src/components/battle/ElementalTempestWidget.tsx",
    "src/components/battle/TacticalPassivePerksModal.tsx",
    "src/components/BattleBossHUD.tsx",
    "src/components/MinimalistMissionHUD.tsx",
    "src/components/MissionGameCardHUD.tsx",
    "src/components/OpponentThreatHUD.tsx",
    "src/components/OpponentHandElementHUD.tsx",
    "src/components/DemoPlayHUD.tsx",
    "src/components/ResponsiveCleanHUD.tsx",
]

BASE_DIR = "/Users/dayyoung/project/snshero"

# Patterns to audit
PATTERNS = {
    "gradient": re.compile(r'\bbg-gradient-to-[a-z0-9-]+\b'),
    "rounded_lg": re.compile(r'\brounded-lg\b'),
    "rounded_xl": re.compile(r'\brounded-xl\b'),
    "rounded_2xl": re.compile(r'\brounded-2xl\b'),
    "rounded_3xl": re.compile(r'\brounded-3xl\b'),
    "rounded_full": re.compile(r'\brounded-full\b'),
    "shadow_xl": re.compile(r'\bshadow-xl\b'),
    "shadow_2xl": re.compile(r'\bshadow-2xl\b'),
    "shadow_lg": re.compile(r'\bshadow-lg\b'),
    "shadow_md": re.compile(r'\bshadow-md\b'),
    "shadow_card": re.compile(r'\bshadow-(?:sm|inner)\b'),
    "animate_ping": re.compile(r'\banimate-ping\b'),
    "animate_bounce": re.compile(r'\banimate-bounce\b'),
    "animate_pulse": re.compile(r'\banimate-pulse\b'),
    "non_mono_font": re.compile(r'\bfont-(?:sans|serif)\b'),
    "sub_44_touch": re.compile(r'\b(?:h-[1-9]|h-10|min-h-\[(?:[1-3][0-9]|4[0-3])px\]|h-\[(?:[1-3][0-9]|4[0-3])px\])\b'),
}

def analyze_file(filepath):
    abs_path = os.path.join(BASE_DIR, filepath)
    if not os.path.exists(abs_path):
        return None
    
    with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
        lines = f.readlines()
        
    findings = {k: [] for k in PATTERNS}
    total_lines = len(lines)
    button_matches = []
    local_storage_keys = set()
    
    ls_pattern = re.compile(r'localStorage\.(?:getItem|setItem|removeItem)\s*\(\s*[\'"`]([^\'"`]+)[\'"`]')
    
    for idx, line in enumerate(lines, 1):
        for key, pat in PATTERNS.items():
            matches = pat.findall(line)
            if matches:
                findings[key].append({
                    "line": idx,
                    "matches": list(set(matches)),
                    "snippet": line.strip()[:140]
                })
        
        # Check localStorage keys
        for ls_match in ls_pattern.findall(line):
            local_storage_keys.add(ls_match)
            
        # Check buttons without min-h-[44px] or 44px class
        if "<button" in line:
            button_matches.append({
                "line": idx,
                "snippet": line.strip()[:140],
                "has_44": bool(re.search(r'min-h-(?:11|12|\[44px\])|h-11|h-12|h-\[44px\]', line)),
                "has_rounded_sm": "rounded-sm" in line,
                "has_rounded_none": "rounded-none" in line,
                "has_font_mono": "font-mono" in line,
            })
            
    return {
        "file": filepath,
        "total_lines": total_lines,
        "findings": findings,
        "buttons_detected": len(button_matches),
        "button_samples": button_matches[:10],
        "local_storage_keys": sorted(list(local_storage_keys))
    }

def main():
    results = {}
    for tf in TARGET_FILES:
        res = analyze_file(tf)
        if res:
            results[tf] = res
            
    out_path = os.path.join(os.path.dirname(__file__), "survey_results.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
        
    print(f"Audit completed. Target files analyzed: {len(results)}")
    for tf, data in results.items():
        counts = {k: len(v) for k, v in data["findings"].items() if len(v) > 0}
        print(f"[{tf}] ({data['total_lines']} lines): {counts}")

if __name__ == "__main__":
    main()
