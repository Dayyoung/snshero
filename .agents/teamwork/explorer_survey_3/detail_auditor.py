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

output_lines = []

for t in targets:
    output_lines.append(f"\n=======================================================")
    output_lines.append(f"AUDIT TARGET: {t}")
    output_lines.append(f"=======================================================")
    with open(t, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    output_lines.append(f"Total lines: {len(lines)}")

    grad_lines = []
    rnd_lines = []
    shd_lines = []
    anim_lines = []
    font_lines = []
    touch_lines = []
    ls_keys = set()
    modals = []
    clearance_lines = []

    for idx, raw_line in enumerate(lines, 1):
        line = raw_line.strip()

        # Gradients
        if re.search(r'\bbg-gradient-to-[a-z]+', line):
            grad_lines.append((idx, line))

        # Rounded violations
        if re.search(r'\brounded-(lg|xl|2xl|3xl|full)\b', line):
            rnd_lines.append((idx, line))

        # Shadows
        if re.search(r'\bshadow(-[a-z0-9]+)?\b', line):
            shd_lines.append((idx, line))

        # Animations
        if re.search(r'\banimate-(ping|bounce)\b', line):
            anim_lines.append((idx, line))

        # Font non-mono
        if re.search(r'\bfont-(sans|serif)\b', line):
            font_lines.append((idx, line))

        # Touch targets < 44px
        if ('<button' in line or 'onClick' in line or 'role="button"' in line):
            # check if button has small height or lack of min-h-[44px]
            has_h = re.search(r'\b(h-[1-9]|h-10|py-1|py-0\.5|py-1\.5|p-1|p-1\.5|p-2)\b', line)
            if has_h and 'min-h-[44px]' not in line and 'h-11' not in line and 'h-12' not in line and 'h-14' not in line:
                touch_lines.append((idx, has_h.group(0), line))

        # LocalStorage
        for m in re.finditer(r'localStorage\.[a-zA-Z]+\([\'\"`]([^\'\"`$]+)[\'\"`]', line):
            ls_keys.add(m.group(1))

        # Modals / overlays
        if 'fixed inset-0' in line or 'absolute inset-0' in line:
            modals.append((idx, line))

        # Bottom clearance
        if re.search(r'\bpb-(1[6-9]|2[0-9]|3[0-6]|40)\b', line):
            clearance_lines.append((idx, line))

    output_lines.append(f"--- 1. Gradients ({len(grad_lines)}) ---")
    for l_no, text in grad_lines:
        output_lines.append(f"  Line {l_no}: {text}")

    output_lines.append(f"\n--- 2. Rounded Violations ({len(rnd_lines)}) ---")
    for l_no, text in rnd_lines[:20]:
        output_lines.append(f"  Line {l_no}: {text}")
    if len(rnd_lines) > 20:
        output_lines.append(f"  ... and {len(rnd_lines) - 20} more lines")

    output_lines.append(f"\n--- 3. Shadows ({len(shd_lines)}) ---")
    for l_no, text in shd_lines[:20]:
        output_lines.append(f"  Line {l_no}: {text}")
    if len(shd_lines) > 20:
        output_lines.append(f"  ... and {len(shd_lines) - 20} more lines")

    output_lines.append(f"\n--- 4. Prohibited Animations ({len(anim_lines)}) ---")
    for l_no, text in anim_lines:
        output_lines.append(f"  Line {l_no}: {text}")

    output_lines.append(f"\n--- 5. Non-Mono Fonts ({len(font_lines)}) ---")
    for l_no, text in font_lines:
        output_lines.append(f"  Line {l_no}: {text}")

    output_lines.append(f"\n--- 6. Touch Target Concerns ({len(touch_lines)}) ---")
    for l_no, h_tag, text in touch_lines[:15]:
        output_lines.append(f"  Line {l_no} [{h_tag}]: {text}")
    if len(touch_lines) > 15:
        output_lines.append(f"  ... and {len(touch_lines) - 15} more lines")

    output_lines.append(f"\n--- 7. LocalStorage Keys ({len(ls_keys)}) ---")
    for k in sorted(ls_keys):
        valid = "VALID" if k.startswith("hero_") or k.startswith("theme") or k.startswith("lang") else "INVALID"
        output_lines.append(f"  [{valid}] {k}")

    output_lines.append(f"\n--- 8. Modal & Overlay Containers ({len(modals)}) ---")
    for l_no, text in modals:
        output_lines.append(f"  Line {l_no}: {text}")

    output_lines.append(f"\n--- 9. Bottom Clearance Padding ({len(clearance_lines)}) ---")
    for l_no, text in clearance_lines:
        output_lines.append(f"  Line {l_no}: {text}")

with open('/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/audit_raw_results.txt', 'w', encoding='utf-8') as out_f:
    out_f.write('\n'.join(output_lines))

print("Audit raw results generated successfully.")
