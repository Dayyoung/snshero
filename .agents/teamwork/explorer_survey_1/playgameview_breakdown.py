#!/usr/bin/env python3
"""
Inspect sections of PlayGameView.tsx
"""
import re

path = "src/views/PlayGameView.tsx"
with open(path, "r", encoding="utf-8", errors="replace") as f:
    lines = f.readlines()

print(f"Total lines in PlayGameView.tsx: {len(lines)}")

# Let's see what components/subsections or sub-functions exist in PlayGameView.tsx
sections = []
for idx, line in enumerate(lines, 1):
    # Detect major sub-components or render functions
    if re.match(r'^(?:export\s+)?(?:const|function)\s+([A-Za-z0-9_]+)', line):
        sections.append((idx, line.strip()))
    elif "return (" in line and idx < 18600 and idx > 1000:
        # check if top-level return
        if line.startswith("  return (") or line.startswith("return ("):
            sections.append((idx, line.strip()))

print(f"Found {len(sections)} major function/return markers:")
for s in sections[:25]:
    print(f"  Line {s[0]}: {s[1]}")

# Let's inspect where gradients, rounded_2xl, etc. cluster in PlayGameView.tsx
clusters = {"0-3000": 0, "3000-6000": 0, "6000-9000": 0, "9000-12000": 0, "12000-15000": 0, "15000-18648": 0}
violation_pat = re.compile(r'\b(bg-gradient-to-[a-z0-9-]+|rounded-(?:lg|xl|2xl|3xl)|shadow-(?:xl|2xl|lg|md)|animate-(?:ping|bounce))\b')

line_violations = []
for idx, line in enumerate(lines, 1):
    matches = violation_pat.findall(line)
    if matches:
        line_violations.append((idx, matches, line.strip()[:100]))
        bucket = f"{(idx // 3000) * 3000}-{min(len(lines), ((idx // 3000) + 1) * 3000)}"
        if bucket in clusters:
            clusters[bucket] += len(matches)

print("\nViolation distribution across file chunks:")
for b, count in clusters.items():
    print(f"  Lines {b}: {count} violations")

print("\nSample violations across PlayGameView.tsx:")
for lv in line_violations[:15]:
    print(f"  Line {lv[0]}: {lv[1]} -> {lv[2]}")

