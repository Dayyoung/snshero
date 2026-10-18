import os
import re

targets = [
    'src/views/ProfileView.tsx',
    'src/views/SettingView.tsx',
    'src/views/SeasonHubView.tsx',
    'src/views/CompanionView.tsx',
    'src/views/EventView.tsx',
    'src/views/StockMarketView.tsx',
    'src/views/PredictionMarketView.tsx',
    'src/views/WikiCardView.tsx',
    'src/views/WorldCodexView.tsx',
    'src/App.tsx'
]

def analyze_target(filepath):
    if not os.path.exists(filepath):
        print(f"Target not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    total_lines = len(lines)
    print("=" * 80)
    print(f"TARGET: {filepath} ({total_lines} lines)")
    print("=" * 80)

    gradients = []
    rounded_violations = []
    shadows = []
    animations = []
    non_mono_fonts = []
    touch_issues = []
    ls_keys = set()
    modals = []
    bottom_clearance = []

    for i, line in enumerate(lines, 1):
        line_str = line.strip()

        # Gradients
        for m in re.finditer(r'\bbg-gradient-to-[a-z]+\b', line):
            gradients.append((i, m.group(0), line_str))

        # Non-compliant rounded
        for m in re.finditer(r'\brounded-(lg|xl|2xl|3xl|full)\b', line):
            rounded_violations.append((i, m.group(0), line_str))

        # Shadows
        for m in re.finditer(r'\bshadow(-[a-z0-9]+)?\b', line):
            shadows.append((i, m.group(0), line_str))

        # Animations
        for m in re.finditer(r'\banimate-(ping|bounce)\b', line):
            animations.append((i, m.group(0), line_str))

        # Fonts
        for m in re.finditer(r'\bfont-(sans|serif)\b', line):
            non_mono_fonts.append((i, m.group(0), line_str))

        # Touch targets
        if ('<button' in line or 'onClick' in line or 'role="button"' in line or 'tabIndex' in line) and ('min-h-[44px]' not in line and 'h-11' not in line and 'h-12' not in line):
            for h_m in re.finditer(r'\b(h-[4-9]|h-10|h-8\.5|h-7\.5)\b', line):
                touch_issues.append((i, h_m.group(0), line_str))

        # LocalStorage
        for ls_m in re.finditer(r'localStorage\.(getItem|setItem|removeItem)\([\'\"`]([^\'\"`$]+)[\'\"`]', line):
            ls_keys.add(ls_m.group(2))

        # Modals / fixed overlays
        if 'fixed inset-0' in line or 'absolute inset-0' in line:
            modals.append((i, line_str))

        # Bottom dock clearance (pb-20, pb-24, pb-28, pb-32, etc.)
        for pb_m in re.finditer(r'\bpb-(1[6-9]|2[0-9]|3[0-6])\b', line):
            bottom_clearance.append((i, pb_m.group(0), line_str))

    print(f"1. Gradients count: {len(gradients)}")
    for g in gradients[:8]:
        print(f"   L{g[0]}: {g[1]} -> {g[2][:80]}")

    print(f"2. Rounded violations count: {len(rounded_violations)}")
    for r in rounded_violations[:8]:
        print(f"   L{r[0]}: {r[1]} -> {r[2][:80]}")

    print(f"3. Shadows count: {len(shadows)}")
    for s in shadows[:8]:
        print(f"   L{s[0]}: {s[1]} -> {s[2][:80]}")

    print(f"4. Prohibited animations: {len(animations)}")
    for a in animations[:8]:
        print(f"   L{a[0]}: {a[1]} -> {a[2][:80]}")

    print(f"5. Non-mono fonts: {len(non_mono_fonts)}")
    for f in non_mono_fonts[:8]:
        print(f"   L{f[0]}: {f[1]} -> {f[2][:80]}")

    print(f"6. Potential Touch Target issues (<44px height): {len(touch_issues)}")
    for t in touch_issues[:8]:
        print(f"   L{t[0]}: {t[1]} -> {t[2][:80]}")

    print(f"7. LocalStorage keys ({len(ls_keys)}):")
    for k in sorted(ls_keys):
        prefix_ok = k.startswith("hero_") or k.startswith("theme") or k.startswith("lang")
        print(f"   - {k} (Prefix compliant: {'YES' if prefix_ok else 'NO: ' + k})")

    print(f"8. Modal / Overlay containers ({len(modals)}):")
    for m in modals[:5]:
        print(f"   L{m[0]}: {m[1][:80]}")

    print(f"9. Bottom dock clearance classes ({len(bottom_clearance)}):")
    for b in bottom_clearance[:3]:
        print(f"   L{b[0]}: {b[1]} -> {b[2][:80]}")
    print("\n")

for target in targets:
    analyze_target(target)
