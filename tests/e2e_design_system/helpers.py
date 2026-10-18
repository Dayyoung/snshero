"""Helper utilities and definitions for SNSHero E2E Design System Test Suite.
"""

import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

# Base repository root
REPO_ROOT = Path(__file__).resolve().parents[2]

# Canonical 22 Views in src/views/
CORE_22_VIEWS = [
    "src/views/HomeView.tsx",
    "src/views/MobileCardPlayScreen.tsx",
    "src/views/MyDeckView.tsx",
    "src/views/PlayGameView.tsx",
    "src/views/ShopView.tsx",
    "src/views/CardMarketplaceView.tsx",
    "src/views/NovelView.tsx",
    "src/views/MovieView.tsx",
    "src/views/RankingView.tsx",
    "src/views/GuildListView.tsx",
    "src/views/GuildDetailView.tsx",
    "src/views/CommunityView.tsx",
    "src/views/RedditCommunityView.tsx",
    "src/views/ProfileView.tsx",
    "src/views/SettingView.tsx",
    "src/views/SeasonHubView.tsx",
    "src/views/CompanionView.tsx",
    "src/views/EventView.tsx",
    "src/views/StockMarketView.tsx",
    "src/views/PredictionMarketView.tsx",
    "src/views/WikiCardView.tsx",
    "src/views/WorldCodexView.tsx",
]

# Milestone 1 Scope: Core Gameplay & Battle Views & Shared Battle HUDs
M1_TARGETS = [
    "src/views/HomeView.tsx",
    "src/views/MobileCardPlayScreen.tsx",
    "src/views/MyDeckView.tsx",
    "src/views/PlayGameView.tsx",
    "src/components/PageHeader.tsx",
    "src/components/battle/TacticalCommandHUD.tsx",
    "src/components/battle/TacticalSynergyMatrix.tsx",
    "src/components/battle/StarBreathingUltimateWidget.tsx",
    "src/components/battle/ElementalTempestWidget.tsx",
    "src/components/MinimalistMissionHUD.tsx",
    "src/components/ResponsiveCleanHUD.tsx",
    "src/components/DemoPlayHUD.tsx",
    "src/components/BattleBossHUD.tsx",
    "src/components/MissionGameCardHUD.tsx",
]

# Milestone 2 Scope: Economy, Social & Content Views
M2_TARGETS = [
    "src/views/ShopView.tsx",
    "src/views/CardMarketplaceView.tsx",
    "src/views/NovelView.tsx",
    "src/views/MovieView.tsx",
    "src/views/RankingView.tsx",
    "src/views/GuildListView.tsx",
    "src/views/GuildDetailView.tsx",
    "src/views/CommunityView.tsx",
    "src/views/RedditCommunityView.tsx",
    "src/components/movie/CinematicMoviePlayer.tsx",
]

# Milestone 3 Scope: Systems, Progression, Codex & Global App Chrome
M3_TARGETS = [
    "src/views/ProfileView.tsx",
    "src/views/SettingView.tsx",
    "src/views/SeasonHubView.tsx",
    "src/views/CompanionView.tsx",
    "src/views/EventView.tsx",
    "src/views/StockMarketView.tsx",
    "src/views/PredictionMarketView.tsx",
    "src/views/WikiCardView.tsx",
    "src/views/WorldCodexView.tsx",
    "src/App.tsx",
    "src/components/Navbar.tsx",
]

# All in-scope target files
ALL_IN_SCOPE_FILES = list(dict.fromkeys(M1_TARGETS + M2_TARGETS + M3_TARGETS))

# All 47 Views and 620 Components in Repository
ALL_47_VIEWS = sorted([
    str(p.relative_to(REPO_ROOT)) for p in (REPO_ROOT / "src/views").glob("*.tsx")
])
EXPANSION_25_VIEWS = [v for v in ALL_47_VIEWS if v not in CORE_22_VIEWS]

ALL_620_COMPONENTS = sorted([
    str(p.relative_to(REPO_ROOT)) for p in (REPO_ROOT / "src/components").glob("**/*.tsx")
])

ALL_CODEBASE_FILES = ALL_47_VIEWS + ALL_620_COMPONENTS + ["src/App.tsx"]



@dataclass
class TestResult:
    test_id: str
    name: str
    tier: int
    status: str  # "PASS", "FAIL", "WARN", "SKIP"
    message: str = ""
    duration_ms: float = 0.0
    details: List[str] = field(default_factory=list)
    milestone: str = "ALL"  # "M1", "M2", "M3", "M4", "ALL"


# Prohibited CSS Pattern Definitions
BANNED_GRADIENT_PATTERN = re.compile(r"\bbg-gradient-to-[a-z]+\b")
BANNED_RADIUS_PATTERN = re.compile(r"\brounded-(?:xl|2xl|3xl)\b")
BANNED_LG_RADIUS_PATTERN = re.compile(r"\brounded-lg\b")
BANNED_ANIMATION_PATTERN = re.compile(r"\banimate-(?:ping|bounce)\b")
BANNED_FONT_PATTERN = re.compile(r"\bfont-(?:sans|serif)\b")
BANNED_SHADOW_PATTERN = re.compile(r"\bshadow-(?:md|lg|xl|2xl)\b")

# Touch Target Qualifying Tokens (indicating height >= 44px)
TOUCH_44PX_TOKENS = (
    "min-h-[44px]",
    "min-h-[46px]",
    "min-h-[48px]",
    "min-h-[50px]",
    "min-h-[52px]",
    "min-h-[56px]",
    "min-h-[60px]",
    "min-h-[64px]",
    "min-h-[70px]",
    "min-h-[80px]",
    "min-h-11",
    "min-h-12",
    "min-h-14",
    "min-h-16",
    "min-h-20",
    "min-h-24",
    "min-h-28",
    "min-h-32",
    "min-h-36",
    "h-11",
    "h-12",
    "h-14",
    "h-16",
    "h-20",
    "h-24",
    "h-[44px]",
    "h-[48px]",
    "h-[50px]",
    "h-[56px]",
    "h-[64px]",
    "py-3",
    "py-3.5",
    "py-4",
    "py-5",
    "py-6",
    "p-3",
    "p-3.5",
    "p-4",
    "p-5",
)


def read_repo_file(rel_path: str) -> str:
    """Reads a file relative to REPO_ROOT in UTF-8."""
    full_path = REPO_ROOT / rel_path
    if not full_path.exists():
        raise FileNotFoundError(f"File not found: {full_path}")
    return full_path.read_text(encoding="utf-8")


def get_file_lines(rel_path: str) -> List[Tuple[int, str]]:
    """Returns a list of (line_number, line_content) for a relative file path."""
    content = read_repo_file(rel_path)
    lines = content.splitlines()
    return [(i + 1, line) for i, line in enumerate(lines)]


def find_banned_tokens_in_file(
    rel_path: str,
    pattern: re.Pattern,
    exclude_comments: bool = True,
) -> List[Tuple[int, str, str]]:
    """Scans a file for a regex pattern.

    Returns list of (line_number, matched_token, line_snippet).
    """
    results = []
    for line_num, line in get_file_lines(rel_path):
        stripped = line.strip()
        if exclude_comments and (stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*")):
            continue
        matches = pattern.findall(line)
        for m in matches:
            results.append((line_num, m, stripped[:100]))
    return results


def extract_button_tags(content: str) -> List[Dict[str, str]]:
    """Extracts JSX `<button ...>` tags and their class attributes using JSX brace-aware parsing."""
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

        # Extract className attribute content (including string literals and cn(...) expressions)
        class_val = ""
        # 1. className={cn(...)} or className={`...`}
        cn_match = re.search(r"className=\s*\{\s*cn\(([\s\S]*?)\)\s*\}", tag_full)
        if cn_match:
            class_val = cn_match.group(1)
        else:
            template_match = re.search(r"className=\s*\{\s*`([\s\S]*?)`\s*\}", tag_full)
            if template_match:
                class_val = template_match.group(1)
            else:
                str_match = re.search(r"className=\s*[\"']([^\"']*)[\"']", tag_full)
                if str_match:
                    class_val = str_match.group(1)
                else:
                    # fallback to any className={...}
                    fallback_match = re.search(r"className=\s*\{([\s\S]*?)\}", tag_full)
                    if fallback_match:
                        class_val = fallback_match.group(1)

        results.append({
            "line": line_num,
            "raw": tag_full[:120],
            "attrs": tag_full[7:-1],
            "className": class_val,
        })
        pos = i + 1

    return results


def check_button_has_44px(class_str: str) -> bool:
    """Checks if a button className contains a qualifying >=44px height token."""
    return any(tok in class_str for tok in TOUCH_44PX_TOKENS)


def find_localstorage_keys(content: str) -> List[Tuple[int, str, str]]:
    """Finds all localStorage.getItem / setItem / removeItem calls.

    Returns list of (line_num, key_name, method).
    """
    results = []
    lines = content.splitlines()
    ls_pattern = re.compile(r"localStorage\.(getItem|setItem|removeItem)\(\s*['\"`]([^'\"`$]+)['\"`]")
    for i, line in enumerate(lines):
        line_num = i + 1
        for match in ls_pattern.finditer(line):
            method = match.group(1)
            key = match.group(2)
            results.append((line_num, key, method))
    return results


def check_horizontal_overflow_resilience(content: str) -> Dict[str, bool]:
    """Analyzes a view file for mobile viewport (375px) overflow resilience.

    Checks:
    - Root has overflow guard (overflow-(x-)?hidden/clip, max-w-*, w-full, w-screen).
    - No raw fixed wide containers like `w-[400px]`, `w-[500px]` without responsive prefixes.
    - Has bottom padding `pb-24` or `pb-28` or `pb-32` or `pb-36` to clear navigation dock.
    """
    has_overflow_guard = bool(re.search(r"overflow-(?:x-)?(?:hidden|clip)|max-w-(?:full|[0-9a-z]+)|w-screen|w-full", content))
    has_bottom_clearance = bool(re.search(r"pb-(?:24|28|32|36|40|44|48|safe)", content))

    # Check for hardcoded fixed pixel widths > 375px without responsive prefixes (ignore max-w-[...] and min-w-[...])
    raw_fixed_widths = re.findall(r'(?<!max-)(?<!min-)(?<!sm:)(?<!md:)(?<!lg:)(?<!xl:)(?<!2xl:)\bw-\[(\d+)px\]', content)
    risky_fixed_widths = [int(w) for w in raw_fixed_widths if int(w) > 375]

    return {
        "has_overflow_guard": has_overflow_guard,
        "has_bottom_clearance": has_bottom_clearance,
        "risky_fixed_widths": risky_fixed_widths,
        "is_resilient": has_overflow_guard and has_bottom_clearance and (len(risky_fixed_widths) == 0),
    }


def find_modal_close_buttons(content: str) -> List[Dict[str, str]]:
    """Finds modal headers, close buttons, and SKIP buttons in a view."""
    # Look for [x], [X], [SKIP], or X/Close icons in buttons
    close_pattern = re.compile(
        r'<button\b[^>]*>(?:[^<]*\[[xX]\]|[^<]*\[SKIP\]|[^<]*Close|[^<]*닫기|[^<]*건너뛰기|<[Xx]\b|<XMark\b)',
        re.IGNORECASE
    )
    matches = []
    for m in close_pattern.finditer(content):
        start_pos = m.start()
        line_num = content[:start_pos].count("\n") + 1
        matches.append({
            "line": line_num,
            "raw": m.group(0),
        })
    return matches
