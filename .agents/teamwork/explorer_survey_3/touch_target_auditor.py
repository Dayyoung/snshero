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

print("=== DETAILED TOUCH TARGET AUDIT (BUTTONS & INTERACTIVE ELEMENTS) ===")

for t in targets:
    with open(t, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    small_buttons = []
    
    # We look for <button or onClick or role="button"
    in_button = False
    btn_start = 0
    btn_buffer = []

    for idx, line in enumerate(lines, 1):
        if '<button' in line or 'onClick' in line:
            # check the line and next 3 lines for class names
            chunk = "".join(lines[idx-1:min(len(lines), idx+4)])
            
            # check if there is an explicit small size
            # e.g., w-6, w-7, w-8, w-9, w-10, h-6, h-7, h-8, h-9, h-10, p-1, p-1.5, min-h-10, etc.
            # and lack of min-h-[44px] or min-h-11 or h-11 or h-12
            has_explicit_small = re.findall(r'\b([wh]-(?:[4-9]|10)|min-[wh]-10)\b', chunk)
            has_44 = bool(re.search(r'\b(min-h-\[44px\]|min-w-\[44px\]|min-h-11|h-11|h-12|h-14|py-3|py-3\.5|py-4)\b', chunk))
            
            if has_explicit_small and not has_44:
                small_buttons.append((idx, has_explicit_small, line.strip()[:90]))

    print(f"\n{t} - Sub-44px interactive elements found: {len(small_buttons)}")
    for s in small_buttons[:8]:
        print(f"  Line {s[0]} [{', '.join(s[1])}]: {s[2]}")

