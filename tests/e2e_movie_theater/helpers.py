"""Helper utilities for SNSHero Movie Theater E2E Test Suite.

Provides:
- TestResult dataclass and status reporting
- ffprobe video/audio probe execution and stream inspection
- Manifest and movie episode loading
- Card database and character portrait resolution
- Static source code AST / token inspection for React/TS components
"""

import json
import os
import re
import shutil
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

REPO_ROOT = Path(__file__).resolve().parents[2]


@dataclass
class TestResult:
    test_id: str
    tier: int
    feature: str
    name: str
    status: str  # "PASS", "FAIL", "WARN"
    message: str = ""
    details: List[str] = field(default_factory=list)
    duration_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "test_id": self.test_id,
            "tier": self.tier,
            "feature": self.feature,
            "name": self.name,
            "status": self.status,
            "message": self.message,
            "details": self.details,
            "duration_ms": round(self.duration_ms, 2),
        }


def get_ffprobe_path() -> Optional[str]:
    """Finds available ffprobe executable."""
    candidates = [
        "/opt/homebrew/bin/ffprobe",
        "/usr/local/bin/ffprobe",
        "/usr/bin/ffprobe",
        shutil.which("ffprobe"),
    ]
    for c in candidates:
        if c and os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    return None


def run_ffprobe(video_path: Path) -> Dict[str, Any]:
    """Executes ffprobe on an MP4 video file and returns parsed JSON format & streams.

    Raises FileNotFoundError if ffprobe or the video file is not found.
    Raises RuntimeError on ffprobe failure.
    """
    ffprobe_bin = get_ffprobe_path()
    if not ffprobe_bin:
        raise FileNotFoundError("ffprobe binary not found in system paths")
    if not video_path.is_file():
        raise FileNotFoundError(f"Video file not found: {video_path}")

    cmd = [
        ffprobe_bin,
        "-v",
        "error",
        "-show_format",
        "-show_streams",
        "-print_format",
        "json",
        str(video_path),
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"ffprobe failed ({proc.returncode}): {proc.stderr}")

    return json.loads(proc.stdout)


def check_faststart(video_path: Path) -> bool:
    """Checks whether the MP4 file has faststart (+faststart) enabled by verifying

    that the 'moov' atom appears before the 'mdat' atom in the binary container.
    """
    if not video_path.is_file() or video_path.stat().st_size < 16:
        return False
    try:
        with open(video_path, "rb") as f:
            # Read first 1MB where moov should reside for faststart files
            chunk = f.read(1024 * 1024)
            pos_moov = chunk.find(b"moov")
            pos_mdat = chunk.find(b"mdat")
            if pos_moov != -1 and pos_mdat != -1:
                return pos_moov < pos_mdat
            # If moov is found in the first chunk and mdat isn't, moov came first
            if pos_moov != -1 and pos_mdat == -1:
                return True
            return False
    except Exception:
        return False


def load_webtoon_manifest() -> Dict[str, Any]:
    """Loads and returns src/content/webtoonEpisodeManifest.json."""
    manifest_path = REPO_ROOT / "src" / "content" / "webtoonEpisodeManifest.json"
    if not manifest_path.is_file():
        raise FileNotFoundError(f"Manifest not found: {manifest_path}")
    with open(manifest_path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_movie_episodes_meta() -> Dict[int, Dict[str, Any]]:
    """Parses src/content/movieEpisodeMapping.ts using regular expressions to extract

    MOVIE_EPISODES metadata dictionary without requiring Node/TS execution.
    """
    mapping_path = REPO_ROOT / "src" / "content" / "movieEpisodeMapping.ts"
    if not mapping_path.is_file():
        raise FileNotFoundError(f"Movie episode mapping not found: {mapping_path}")

    content = mapping_path.read_text(encoding="utf-8")
    episodes: Dict[int, Dict[str, Any]] = {}

    # Match blocks like: 1: { episodeNumber: 1, titleKo: "...", ... }
    # Simple regex extraction for key fields per episode
    ep_blocks = re.findall(r"(\d+):\s*\{([^}]+)\}", content)
    for ep_num_str, body in ep_blocks:
        try:
            ep_num = int(ep_num_str)
            title_ko = re.search(r'titleKo:\s*["\']([^"\']+)["\']', body)
            title_en = re.search(r'titleEn:\s*["\']([^"\']+)["\']', body)
            title_ja = re.search(r'titleJa:\s*["\']([^"\']+)["\']', body)
            bgm_theme = re.search(r'bgmTheme:\s*["\']([^"\']+)["\']', body)
            default_vfx = re.search(r'defaultVfx:\s*["\']([^"\']+)["\']', body)
            episodes[ep_num] = {
                "episodeNumber": ep_num,
                "titleKo": title_ko.group(1) if title_ko else f"제 {ep_num}화",
                "titleEn": title_en.group(1) if title_en else f"Episode {ep_num}",
                "titleJa": title_ja.group(1) if title_ja else "",
                "bgmTheme": bgm_theme.group(1) if bgm_theme else "arcane-mystery",
                "defaultVfx": default_vfx.group(1) if default_vfx else "snow",
            }
        except Exception:
            continue

    return episodes


def load_card_database() -> Dict[int, Dict[str, Any]]:
    """Parses src/cardDatabase.ts to extract card IDs, title_en, title, and portrait file."""
    card_path = REPO_ROOT / "src" / "cardDatabase.ts"
    if not card_path.is_file():
        raise FileNotFoundError(f"Card database not found: {card_path}")

    content = card_path.read_text(encoding="utf-8")
    cards: Dict[int, Dict[str, Any]] = {}

    # Find id: <num>, ... title: '...', title_en: '...'
    pattern = re.compile(
        r"id:\s*(\d+)[^}]+?title:\s*['\"]([^'\"]+)['\"],[^}]+?title_en:\s*['\"]([^'\"]+)['\"]"
    )
    for match in pattern.finditer(content):
        cid = int(match.group(1))
        t_ko = match.group(2)
        t_en = match.group(3)
        cards[cid] = {
            "id": cid,
            "title_ko": t_ko,
            "title_en": t_en,
            "portrait_file": f"{t_en.replace(' ', '_')}.png",
        }

    return cards


def read_source_file(rel_path: str) -> str:
    """Reads a source file relative to the repo root."""
    target = REPO_ROOT / rel_path
    if not target.is_file():
        raise FileNotFoundError(f"File not found: {target}")
    return target.read_text(encoding="utf-8")
