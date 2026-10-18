import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path("/Users/dayyoung/project/snshero")
sys.path.insert(0, str(REPO_ROOT))

from tests.e2e_design_system.helpers import (
    CORE_22_VIEWS,
    read_repo_file,
    check_horizontal_overflow_resilience,
    find_modal_close_buttons,
    extract_button_tags,
    check_button_has_44px,
)

print("=" * 70)
print("1. DETAILED VIEWPORT RESILIENCE AUDIT (check_horizontal_overflow_resilience)")
print("=" * 70)

for idx, view_rel in enumerate(CORE_22_VIEWS, start=1):
    content = read_repo_file(view_rel)
    res = check_horizontal_overflow_resilience(content)
    if not res["is_resilient"]:
        print(f"\n[FAIL] {view_rel}:")
        print(f"  has_overflow_guard: {res['has_overflow_guard']}")
        print(f"  has_bottom_clearance: {res['has_bottom_clearance']}")
        print(f"  risky_fixed_widths (>375px): {res['risky_fixed_widths']}")

print("\n" + "=" * 70)
print("2. MODAL DISMISS CONTROLS AUDIT")
print("=" * 70)
modal_files = [
    "src/views/MobileCardPlayScreen.tsx",
    "src/views/RankingView.tsx",
]
for mf in modal_files:
    content = read_repo_file(mf)
    cbs = find_modal_close_buttons(content)
    print(f"\nFile: {mf}")
    print(f"  Close buttons found: {len(cbs)}")
    # Find modal structures:
    modals = re.findall(r'(?:fixed inset-0|z-\[(?:1|2|5)\d\d\]|modal|dialog|Drawer)', content, re.IGNORECASE)
    print(f"  Modal mentions: {len(modals)}")

print("\n" + "=" * 70)
print("3. T3.THEME.01 SURFACE PALETTE AUDIT (RedditCommunityView)")
print("=" * 70)
reddit_content = read_repo_file("src/views/RedditCommunityView.tsx")
has_fdfcfc = "#fdfcfc" in reddit_content
has_201d1d = "#201d1d" in reddit_content
print(f"RedditCommunityView has #fdfcfc: {has_fdfcfc}")
print(f"RedditCommunityView has #201d1d: {has_201d1d}")
