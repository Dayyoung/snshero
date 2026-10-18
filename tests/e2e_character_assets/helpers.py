"""Common helpers, fixtures, and assertions for character illustration E2E tests."""

import hashlib
import json
import math
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PUBLIC_DIR = PROJECT_ROOT / "public"
SEAT_DIR = PUBLIC_DIR / "seat"

PNG_MAGIC_BYTES = b"\x89PNG\r\n\x1a\n"
UTF8_REPLACEMENT_PREFIX = b"\xef\xbf\xbdPNG"

# Authoritative faction definitions and sprite sheet mappings
FACTION_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    "water": {
        "id_range": (1, 10),
        "name_ko": "수속성",
        "name_en": "Water",
        "sheet_filename": "character_sheet_water.png",
        "primary_color": "#0ea5e9",
        "surface_class": "bg-[#d9effc]",
        "emblem": "droplets",
        "boss_id": 10,
    },
    "fire": {
        "id_range": (11, 20),
        "name_ko": "화속성",
        "name_en": "Fire",
        "sheet_filename": "character_sheet_fire.png",
        "primary_color": "#ef4444",
        "surface_class": "bg-[#fce1ce]",
        "emblem": "flame",
        "boss_id": 20,
    },
    "wind": {
        "id_range": (21, 30),
        "name_ko": "풍속성",
        "name_en": "Wind",
        "sheet_filename": "character_sheet_wind.png",
        "primary_color": "#22d3ee",
        "surface_class": "bg-[#e1f3ef]",
        "emblem": "wind",
        "boss_id": 30,
    },
    "earth": {
        "id_range": (31, 40),
        "name_ko": "지속성",
        "name_en": "Earth",
        "sheet_filename": "character_sheet_earth.png",
        "primary_color": "#84cc16",
        "surface_class": "bg-[#ebedc8]",
        "emblem": "mountain",
        "boss_id": 40,
    },
    "human": {
        "id_range": (41, 50),
        "name_ko": "인간",
        "name_en": "Human",
        "sheet_filename": "character_sheet_human.png",
        "primary_color": "#f59e0b",
        "surface_class": "bg-[#f6edcf]",
        "emblem": "shield",
        "boss_id": 50,
    },
    "undead": {
        "id_range": (51, 60),
        "name_ko": "언데드",
        "name_en": "Undead",
        "sheet_filename": "character_sheet_undead.png",
        "primary_color": "#a855f7",
        "surface_class": "bg-[#ece0f4]",
        "emblem": "skull",
        "boss_id": 60,
    },
    "elf": {
        "id_range": (61, 70),
        "name_ko": "엘프",
        "name_en": "Elf",
        "sheet_filename": "character_sheet_elf.png",
        "primary_color": "#10b981",
        "surface_class": "bg-[#e0efd6]",
        "emblem": "sparkles",
        "boss_id": 70,
    },
    "dwarf": {
        "id_range": (71, 80),
        "name_ko": "드워프/호빗",
        "name_en": "Dwarf",
        "sheet_filename": "character_sheet_hobbit.png",  # Legacy alias
        "primary_color": "#d97706",
        "surface_class": "bg-[#efe2d1]",
        "emblem": "hammer",
        "boss_id": 80,
    },
    "monster": {
        "id_range": (81, 90),
        "name_ko": "마수",
        "name_en": "Monster",
        "sheet_filename": "character_sheet_beast.png",  # Legacy alias
        "primary_color": "#84cc16",
        "surface_class": "bg-[#e5ead4]",
        "emblem": "paw-print",
        "boss_id": 90,
    },
    "robot": {
        "id_range": (91, 100),
        "name_ko": "기계",
        "name_en": "Robot",
        "sheet_filename": "character_sheet_mecha.png",  # Legacy alias
        "primary_color": "#64748b",
        "surface_class": "bg-[#e3e9ef]",
        "emblem": "cpu",
        "boss_id": 100,
    },
    "dragon": {
        "id_range": (101, 110),
        "name_ko": "드래곤",
        "name_en": "Dragon",
        "sheet_filename": "character_sheet_dragon.png",
        "primary_color": "#ec4899",
        "surface_class": "bg-[#f1def0]",
        "emblem": "flame-kindling",
        "boss_id": 110,
    },
}

MASTER_SHEET_SPECS: Dict[str, Dict[str, Any]] = {
    "cards1": {
        "filename": "cards1.png",
        "path": PUBLIC_DIR / "cards1.png",
        "dimensions": (1000, 1000),
        "grid": (10, 10),
        "id_range": (1, 100),
        "cell_size": (100, 100),
        "budget_bytes": 819200,  # 800 KB
    },
    "cards2": {
        "filename": "cards2.png",
        "path": PUBLIC_DIR / "cards2.png",
        "dimensions": (1000, 1000),
        "grid": (10, 10),
        "id_range": (101, 110),  # Row 0
        "cell_size": (100, 100),
        "budget_bytes": 819200,  # 800 KB
    },
    "card100": {
        "filename": "card100.png",
        "path": PUBLIC_DIR / "card100.png",
        "dimensions": (1135, 1315),
        "grid": (10, 11),
        "id_range": (1, 110),
        "cell_size": (113.5, 119.54545),
        "budget_bytes": 819200,  # 800 KB
    },
    "card100_gemini": {
        "filename": "card100_gemini.png",
        "path": PUBLIC_DIR / "card100_gemini.png",
        "dimensions": (1024, 1024),
        "grid": (10, 11),
        "id_range": (1, 110),
        "cell_size": (102.4, 93.0909),
        "budget_bytes": 819200,  # 800 KB
        "require_true_rgba": True,
    },
}


class TestResult:
    """Represents the outcome of a single test assertion."""

    def __init__(
        self,
        test_id: str,
        name: str,
        tier: int,
        feature: str,
        status: str,  # "PASS", "FAIL", "WARN"
        message: str,
        details: Optional[List[str]] = None,
        duration_ms: float = 0.0,
    ):
        self.test_id = test_id
        self.name = name
        self.tier = tier
        self.feature = feature
        self.status = status
        self.message = message
        self.details = details or []
        self.duration_ms = duration_ms

    def to_dict(self) -> Dict[str, Any]:
        return {
            "test_id": self.test_id,
            "name": self.name,
            "tier": self.tier,
            "feature": self.feature,
            "status": self.status,
            "message": self.message,
            "details": self.details,
            "duration_ms": self.duration_ms,
        }


def load_card_dataset() -> List[Dict[str, Any]]:
    """Loads authoritative card records from cards_dataset.json."""
    dataset_path = PROJECT_ROOT / ".agents/teamwork/explorer_survey_1/cards_dataset.json"
    if dataset_path.exists():
        with open(dataset_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            cards = data.get("cards", [])
            if cards and len(cards) == 110:
                return sorted(cards, key=lambda c: c["id"])

    # Fallback to loading cards from cards_dataset in survey dir
    raise RuntimeError(f"Authoritative cards dataset missing at {dataset_path}")


def get_card_seat_filename(card: Dict[str, Any]) -> str:
    """Returns expected filename in public/seat/ for a given card."""
    title_en = card.get("title_en", "")
    return f"{title_en.replace(' ', '_')}.png"


def check_png_magic_header(filepath: Path) -> Tuple[bool, str, bytes]:
    """
    Checks the first 8 bytes of a file.
    Validates against standard PNG magic bytes b'\\x89PNG\\r\\n\\x1a\\n'.
    Detects UTF-8 replacement char corruption (b'\\xef\\xbf\\xbdPNG').
    """
    if not filepath.exists():
        return False, f"File does not exist: {filepath}", b""

    try:
        with open(filepath, "rb") as f:
            header = f.read(8)
    except Exception as e:
        return False, f"Could not read header: {e}", b""

    if header == PNG_MAGIC_BYTES:
        return True, "Valid PNG magic header (89 50 4E 47 0D 0A 1A 0A)", header
    elif header.startswith(UTF8_REPLACEMENT_PREFIX):
        return (
            False,
            f"CORRUPT HEADER: UTF-8 replacement character byte EF BF BD detected in {filepath.name}",
            header,
        )
    else:
        hex_header = header.hex()
        return (
            False,
            f"INVALID HEADER: Expected 89504e470d0a1a0a, found {hex_header}",
            header,
        )


def compute_file_sha256(filepath: Path) -> str:
    """Computes SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def format_bytes(num_bytes: int) -> str:
    """Formats bytes to human-readable string (KB/MB)."""
    if num_bytes < 1024:
        return f"{num_bytes} B"
    elif num_bytes < 1024 * 1024:
        return f"{num_bytes / 1024:.1f} KB"
    else:
        return f"{num_bytes / (1024 * 1024):.2f} MB"


def open_and_decode_image(filepath: Path) -> Tuple[Optional[Image.Image], Optional[str]]:
    """Safely opens and fully decodes an image file."""
    if not filepath.exists():
        return None, f"File not found: {filepath}"
    try:
        img = Image.open(filepath)
        img.load()  # Force decode full raster data
        return img, None
    except Exception as e:
        return None, str(e)


def check_image_entropy_and_variance(img: Image.Image) -> Tuple[bool, float, float]:
    """
    Analyzes an image to detect blank or uniform color images.
    Returns (is_rich, entropy, std_dev).

    Calibrated Oracle for TCG Card Portraits & Sheet Cells:
    - Rejects pure or near-pure blank/uniform color images (std_dev < 15.0).
    - Requires std_dev >= 15.0 AND (entropy >= 0.25 or foreground_entropy >= 1.5).
    - Correctly handles card portraits on high-percentage white/flat backdrops
      where global Shannon entropy is bounded (0.33–0.76) despite rich character textures.
    """
    try:
        rgba = img.convert("RGBA")
        # Check alpha: must have some non-transparent pixels
        alpha = rgba.split()[3]
        alpha_extrema = alpha.getextrema()
        if alpha_extrema == (0, 0):
            return False, 0.0, 0.0  # Fully transparent

        # Convert RGB channels to grayscale to compute entropy & stddev
        gray = img.convert("L")
        entropy = gray.entropy()
        hist = gray.histogram()
        total_pixels = sum(hist)
        if total_pixels == 0:
            return False, 0.0, 0.0

        mean = sum(i * count for i, count in enumerate(hist)) / total_pixels
        variance = sum(count * ((i - mean) ** 2) for i, count in enumerate(hist)) / total_pixels
        std_dev = math.sqrt(variance)

        # Compute foreground entropy (excluding dominant background if > 50% of pixels)
        dominant_bin = max(range(256), key=lambda i: hist[i])
        if hist[dominant_bin] > 0.5 * total_pixels:
            fg_counts = [count for i, count in enumerate(hist) if i != dominant_bin]
            fg_total = sum(fg_counts)
            if fg_total > 0:
                fg_entropy = -sum((c / fg_total) * math.log2(c / fg_total) for c in fg_counts if c > 0)
            else:
                fg_entropy = 0.0
        else:
            fg_entropy = entropy

        # Standard check: must have significant pixel variation (std >= 15.0)
        # AND sufficient information content in either the whole image or the foreground
        is_rich = std_dev >= 15.0 and (entropy >= 0.25 or fg_entropy >= 1.5)
        return is_rich, entropy, std_dev
    except Exception:
        return False, 0.0, 0.0


def get_card_sprite_coords(card_id: int, custom_source: Optional[str] = None) -> Dict[str, Any]:
    """
    Matches the exact coordinate formula from src/lib/utils.ts getCardSpriteCoords.
    """
    cid = int(card_id) if card_id else 1
    source_str = (custom_source or "").lower()

    is_cards2 = "card2" in source_str or "cards2" in source_str if custom_source else (cid >= 101)
    is_legacy_110 = bool(custom_source and ("card100" in source_str or "110card" in source_str))

    if is_legacy_110:
        cols = 10
        rows = 11
        valid_id = max(1, min(110, cid))
        col = (valid_id - 1) % cols
        row = (valid_id - 1) // cols
        source = custom_source or "/card100.png"
        return {
            "source": source,
            "col": col,
            "row": row,
            "cols": cols,
            "rows": rows,
            "xPercent": col * (100 / (cols - 1)),
            "yPercent": row * (100 / (rows - 1)),
        }

    if is_cards2:
        cols = 10
        rows = 10
        offset_index = (cid - 101) % 100 if cid >= 101 else (cid - 1) % 100
        col = offset_index % 10
        row = offset_index // 10
        source = custom_source or "/cards2.png"
        return {
            "source": source,
            "col": col,
            "row": row,
            "cols": cols,
            "rows": rows,
            "xPercent": col * (100 / (cols - 1)),
            "yPercent": row * (100 / (rows - 1)),
        }

    # Default cards1 (10x10, IDs 1..100)
    cols = 10
    rows = 10
    valid_index = max(0, min(99, (cid - 1) % 100))
    col = valid_index % cols
    row = valid_index // cols
    source = custom_source or "/cards1.png"
    return {
        "source": source,
        "col": col,
        "row": row,
        "cols": cols,
        "rows": rows,
        "xPercent": col * (100 / (cols - 1)),
        "yPercent": row * (100 / (rows - 1)),
    }


def calculate_image_similarity(img1: Image.Image, img2: Image.Image, target_size: Tuple[int, int] = (64, 64)) -> float:
    """
    Computes normalized similarity between two images (0.0 to 1.0).
    Uses downscaled normalized RGB channel correlation / distance.
    """
    try:
        i1 = img1.convert("RGBA").resize(target_size, Image.Resampling.BILINEAR)
        i2 = img2.convert("RGBA").resize(target_size, Image.Resampling.BILINEAR)

        p1 = list(i1.getdata())
        p2 = list(i2.getdata())

        total_diff = 0
        max_diff = len(p1) * 255 * 3  # RGB diff
        for (r1, g1, b1, a1), (r2, g2, b2, a2) in zip(p1, p2):
            # Weight diff by alpha
            diff = (abs(r1 - r2) + abs(g1 - g2) + abs(b1 - b2))
            total_diff += diff

        similarity = 1.0 - (total_diff / max_diff)
        return max(0.0, min(1.0, similarity))
    except Exception:
        return 0.0
