#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI Webtoon Scene Generator using Gemini Image Generation Model
- Uses character sheets, locations (LOC-001..020), and props (PROP-001..020)
- Builds cinematic 16:9 dark-fantasy anime prompts
- Post-processes with comic speech bubbles ('...') for speaking characters
- Saves directly to public/images/webtoon/episode_XX/scene_YY.webp
"""

import os
import sys
import json
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scripts.build_all_40_webtoons_with_110_anime import draw_comic_speech_bubble, save_webp_under_limit

MANIFEST_PATH = ROOT / "src" / "content" / "webtoonEpisodeManifest.json"
ANIME_DIR = ROOT / "public" / "anime-character-sheets"
WEBTOON_DIR = ROOT / "public" / "images" / "webtoon"

EP_LOC_MAP = {
    1: "LOC_001_Elwin_Village.jpg", 2: "LOC_001_Elwin_Village.jpg",
    3: "LOC_002_Frostpeak_Camp.jpg", 4: "LOC_003_Whispering_Woods.jpg",
    5: "LOC_004_Black_Fortress.jpg", 6: "LOC_005_Sky_Altar.jpg",
    7: "LOC_006_Sunken_Sanctuary.jpg", 8: "LOC_007_Dragonhorn_Peak.jpg",
    9: "LOC_008_Sealed_Hollow.jpg", 10: "LOC_009_Emerald_Council.jpg",
    11: "LOC_010_Citadel_Four.jpg", 12: "LOC_011_Quicksand_Ruins.jpg",
    13: "LOC_012_Black_Citadel.jpg", 14: "LOC_013_Altar_of_Ruin.jpg",
    15: "LOC_014_Highland_Stronghold.jpg", 16: "LOC_015_Crystal_Caverns.jpg",
    17: "LOC_016_Forgotten_Graveyard.jpg", 18: "LOC_017_Molten_Foundry.jpg",
    19: "LOC_018_Astral_Observatory.jpg", 20: "LOC_005_Sky_Altar.jpg",
    21: "LOC_009_Emerald_Council.jpg", 22: "LOC_010_Citadel_Four.jpg",
    23: "LOC_019_Iron_Keep.jpg", 24: "LOC_020_Verdant_Sanctuary.jpg",
    25: "LOC_001_Elwin_Village.jpg", 26: "LOC_002_Frostpeak_Camp.jpg",
    27: "LOC_003_Whispering_Woods.jpg", 28: "LOC_004_Black_Fortress.jpg",
    29: "LOC_007_Dragonhorn_Peak.jpg", 30: "LOC_008_Sealed_Hollow.jpg",
    31: "LOC_011_Quicksand_Ruins.jpg", 32: "LOC_012_Black_Citadel.jpg",
    33: "LOC_013_Altar_of_Ruin.jpg", 34: "LOC_015_Crystal_Caverns.jpg",
    35: "LOC_017_Molten_Foundry.jpg", 36: "LOC_018_Astral_Observatory.jpg",
    37: "LOC_019_Iron_Keep.jpg", 38: "LOC_006_Sunken_Sanctuary.jpg",
    39: "LOC_013_Altar_of_Ruin.jpg", 40: "LOC_005_Sky_Altar.jpg",
}


def load_character_descriptions() -> dict[int, dict]:
    with open(ANIME_DIR / "manifest.json", "r", encoding="utf-8") as f:
        mf = json.load(f)
    return {c["id"]: c for c in mf["characters"]}


def build_scene_prompt(
    ep_num: int,
    sc_idx: int,
    img_meta: dict,
    chars_by_id: dict,
    name_to_id: dict,
) -> tuple[str, list[int], list[dict]]:
    raw_chars = img_meta.get("characters", [])
    dialogues = img_meta.get("dialogues", [])
    narration_ko = img_meta.get("narrationKo", "")
    narration_en = img_meta.get("narrationEn", "")
    bg_desc = img_meta.get("background", "")

    # Match characters
    cids = []
    for d in dialogues:
        cid_d = d.get("characterCardId")
        if cid_d and cid_d in chars_by_id and cid_d not in cids:
            cids.append(cid_d)

    for rc in raw_chars:
        cid = name_to_id.get(rc.lower())
        if not cid:
            for k, v in name_to_id.items():
                if k in rc.lower() or rc.lower() in k:
                    cid = v
                    break
        if cid and cid in chars_by_id and cid not in cids:
            cids.append(cid)

    # Fallback hero
    if not cids:
        cids = [41] # Kadan

    # Char descriptions
    char_lines = []
    for cid in cids[:3]:
        c = chars_by_id.get(cid, {})
        name_en = c.get("nameEn", f"Hero_{cid}")
        name_ko = c.get("nameKo", "")
        novel_role = c.get("novelRoleKo", "")
        hair = c.get("hairDesignKo", "")
        body = c.get("bodyCharmKo", "")
        sig_item = c.get("signatureItemKo", "")
        char_lines.append(
            f"- {name_en} ({name_ko}): {novel_role}. Distinctive appearance: {hair}, {body}. Signature gear: {sig_item}."
        )

    chars_desc = "\n".join(char_lines)
    loc_name = EP_LOC_MAP.get(ep_num, "LOC_001_Elwin_Village.jpg").replace(".jpg", "").replace("_", " ")

    prompt = f"""Generate a cinematic 16:9 theatrical dark-fantasy anime webtoon illustration (1280x720) for Episode {ep_num} Scene {sc_idx} of SNSHero.

Setting & Environment:
Location: {loc_name}. Specific scenery: {bg_desc or 'Snowbound mountain village under dramatic skies'}.
Atmosphere: Deep cinematic lighting, atmospheric particles, rich perspective.

Featured Characters:
{chars_desc}

Scene Context & Dramatic Moment:
{narration_en or narration_ko}

Visual Aesthetic:
- High-end theatrical anime key visual (like Ufotable, Demon Slayer, Fate/Stay Night, Castlevania).
- Characters naturally integrated with ground contact, dynamic silhouettes, and cast shadows.
- Distinct character separation without excessive clutter.
- Absolutely NO text, NO speech bubbles, NO subtitles, NO watermarks, NO UI elements.
"""
    return prompt.strip(), cids, dialogues


def main():
    parser = argparse.ArgumentParser(description="AI Webtoon Scene Generator")
    parser.add_argument("--ep", type=int, default=1, help="Episode number (1..40)")
    parser.add_argument("--scene", type=int, default=None, help="Specific scene index")
    parser.add_argument("--dry-run", action="store_true", help="Print prompts without generating")
    args = parser.parse_args()

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    chars_by_id = load_character_descriptions()
    name_to_id = {}
    for c in chars_by_id.values():
        name_to_id[c["nameEn"].lower()] = c["id"]
        name_to_id[c["nameKo"].lower()] = c["id"]

    ep_data = manifest.get(str(args.ep), {})
    images = ep_data.get("images", [])

    print(f"Loaded Episode {args.ep}: {len(images)} scenes.")
    for img in images:
        idx = img.get("index", 0)
        if idx == 0:
            continue
        if args.scene is not None and idx != args.scene:
            continue

        prompt, cids, dlgs = build_scene_prompt(args.ep, idx, img, chars_by_id, name_to_id)
        has_char_speech = any(d.get("speakerKo") and d.get("speakerKo") not in ("내레이션", "Narration", "") for d in dlgs)
        print(f"\n[Scene {idx:02d}] CIDs: {cids} | Spoken Dialogue: {has_char_speech}")
        if args.dry_run:
            print("Prompt preview:\n" + prompt[:200] + "...")


if __name__ == "__main__":
    main()
