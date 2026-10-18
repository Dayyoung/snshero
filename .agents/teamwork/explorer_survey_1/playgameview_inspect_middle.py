#!/usr/bin/env python3
import re

path = "src/views/PlayGameView.tsx"
with open(path, "r", encoding="utf-8", errors="replace") as f:
    lines = f.readlines()

violation_pat = re.compile(r'\b(bg-gradient-to-[a-z0-9-]+|rounded-(?:lg|xl|2xl|3xl)|shadow-(?:xl|2xl|lg|md)|animate-(?:ping|bounce))\b')

print("=== Violations between 9000 and 15000 in PlayGameView.tsx ===")
chunks = []
current_subheading = None
for idx in range(8999, 15000):
    line = lines[idx]
    # Check for JSX comments or headings or component names
    comment_m = re.search(r'\{?/\*+\s*([^*]+)\s*\*+/?\}?', line)
    if comment_m:
        current_subheading = comment_m.group(1).strip()
    m = violation_pat.findall(line)
    if m:
        chunks.append((idx + 1, current_subheading, m, line.strip()[:100]))

print(f"Total matching lines in 9000-15000: {len(chunks)}")
# Group by subheading
by_heading = {}
for line_no, heading, matches, text in chunks:
    h = heading or "Unknown Section"
    if h not in by_heading:
        by_heading[h] = []
    by_heading[h].append((line_no, matches, text))

for h, items in by_heading.items():
    print(f"\n--- Section: [{h}] ({len(items)} violations) ---")
    for item in items[:4]:
        print(f"  Line {item[0]}: {item[1]} -> {item[2]}")
