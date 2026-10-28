#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SNSHero 'Kadan's Journey' — 6-Second Anime Cutscene Prompt Generator (/script-anime)
- Character Sheet Reference: 7-head-tall (7등신) full-body cutout PNGs (`public/anime-character-sheets/cutouts/XXX_Name.png`)
- Location Reference: Canonical Location Art & Sheet (`public/anime-character-sheets/locations/art/LOC_XXX_*.jpg`)
- Prop Reference: Canonical Prop Art & Sheet (`public/anime-character-sheets/props/art/PROP_XXX_*.jpg`)

Usage:
  python3 skills/script-anime/scripts/generate_episode_cutscene_prompts.py 1회
  python3 skills/script-anime/scripts/generate_episode_cutscene_prompts.py 1
  python3 skills/script-anime/scripts/generate_episode_cutscene_prompts.py --all
"""

import os
import re
import sys
import glob
import json
from typing import List, Dict, Any, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
MANIFEST_PATH = os.path.join(ROOT_DIR, "public/anime-character-sheets/manifest.json")
ENGLISH_TXT_DIR = os.path.join(ROOT_DIR, "public/book/image_narrations/english_txt")
KOREAN_BOOK_DIR = os.path.join(ROOT_DIR, "public/book")
NARRATION_JSON_DIR = os.path.join(ROOT_DIR, "public/book/image_narrations")
OUTPUT_DIR = os.path.join(ROOT_DIR, "public/anime-character-sheets/cutscene-prompts")

# Map novel character names (English/Korean) to canonical 110 character sheet IDs in manifest.json
CHARACTER_ALIASES: List[Tuple[List[str], int, str, str, str]] = [
    # (keywords_en_and_ko, sheet_id, canonical_en_name, canonical_ko_name, default_weapon_en)
    (["Aleksandar", "알렉산다르"], 50, "Aleksandar", "알렉산다르", "7-head-tall muscular northern warrior wielding masterwork twin arcane longswords"),
    (["Balian", "발리안"], 43, "Balian", "발리안", "7-head-tall veteran spearman wielding a glowing cyan-runed Arcane Spear and heavy iron cross-shield"),
    (["Hercul", "헤르쿨"], 49, "Hercul", "헤르쿨", "7-head-tall towering Holy Knight paladin in tattered pilgrim vestments with cracked golden Holy Knights seal at his belt and radiant mana gauntlets"),
    (["Elwin", "엘윈"], 42, "Elwin", "엘윈", "7-head-tall graceful northern swordswoman and mother in a warm frontier wool cloak over a linen dress (heavily pregnant in EP01)"),
    (["Ysela", "이셀라"], 107, "Ysela", "이셀라", "7-head-tall noble starlight dragon-priestess in a starlight-embroidered northern tunic and shawl (heavily pregnant in EP01)"),
    (["Lucian", "루시안"], 61, "Lucian", "루시안", "7-head-tall ambitious nobleman of the Red Glass Court wearing an ermine cloak with serpentine crest and wielding an emerald arcane bow/sword"),
    (["Death Knight Artus", "Regent Death Knight Artus", "Artus", "데스나이트 아르투스", "아르투스"], 60, "Death Knight Artus", "데스나이트 아르투스", "7-head-tall Regent Death Knight in ebony skull-engraved dread plate armor wielding a frost-cursed greatsword"),
    (["Kadan", "카단"], 41, "Kadan", "카단", "7-head-tall young northern hero in dark frontier tunic and red scarf, carrying the Snow-Emblem Shield on his back and the Silver Dagger"),
    (["Ignis", "이그니스"], 11, "Ignis", "이그니스", "7-head-tall crimson-and-black Flame Court warrior with magma-runed gauntlets and twin flame blades"),
    (["Silia", "Celia", "실리아"], 62, "Silia (Celia)", "실리아", "7-head-tall noble heroine of Whispering Wind Island in flowing teal-and-white robes holding the emerald Jade Staff"),
    (["Grendal", "Malfuon", "그렌달", "말퓨온"], 66, "Grendal (Malfuon)", "그렌달(말퓨온)", "7-head-tall astral hermit master with long silver beard in weathered star-robes wielding the Star-Breathing astral staff"),
    (["Brianna", "브리안나"], 28, "Brianna (Zeusphere)", "브리안나", "7-head-tall silver-blue valkyrie knight commander carrying the Dragon Breaker Shield and arcane chains"),
    (["Aria", "아리아"], 23, "Aria (Sylphid)", "아리아", "7-head-tall wind-isle sorceress in translucent wind-spirit silk robes holding an emerald jade flute"),
    (["Alisa", "Leonar", "알리사", "레오나르"], 86, "Alisa / Leonar", "알리사(레오나르)", "7-head-tall wandering guild master in white-lion mantle wielding the emerald dragon-headed Jade Staff"),
    (["Lise", "Pyro", "리세"], 14, "Lise (Pyro)", "리세", "7-head-tall Red Glass Palace alchemist in crimson vestments holding the White Glass Ember lantern"),
    (["Gorgo", "Medusa Gorgo", "고르고", "메두사 고르고"], 89, "Gorgo (Medusa Gorgo)", "고르고", "7-head-tall Four Gates poison assassin in serpent-scale cloak with venom bow and purple serpent venom vials"),
    (["Lazar", "Aeolus", "라자르", "에올루스"], 25, "Lazar (Aeolus)", "라자르(에올루스)", "7-head-tall dark wind-sorcerer in black-and-jade robes wielding a green-lightning storm staff"),
    (["Kaze", "카제"], 44, "Kaze", "카제", "7-head-tall agile shadow shinobi in dark stealth garb wielding twin purple-shadow daggers"),
    (["Gawain", "가웨인"], 45, "Gawain", "가웨인", "7-head-tall leader of the Seven Pursuers in silver-gold paladin plate wielding a massive solar cross greatsword"),
    (["Rondol", "론돌"], 46, "Rondol", "론돌", "7-head-tall heavy shield-knight in fortress plate carrying an oversized golden tower shield"),
    (["Gilgamesh", "길가메시"], 47, "Gilgamesh", "길가메시", "7-head-tall northern nomad Khan in fur mantle wielding a flame-runed great scimitar"),
    (["Robinyard", "로비냐드"], 48, "Robinyard", "로비냐드", "7-head-tall master archer in crimson ranger hood wielding an ornate golden recurve greatbow"),
    (["Eliana", "엘리아나"], 63, "Eliana", "엘리아나", "7-head-tall forest healer spirit-mage with golden antidote elixir vial and blossom wand"),
    (["Titania", "티타니아"], 64, "Titania", "티타니아", "7-head-tall northern nomad princess in fur-trimmed cape wielding a golden horn bow"),
    (["Gandar", "간다르"], 69, "Gandar", "간다르", "7-head-tall Lord of Whispering Wind Island in emerald-and-silver robes wielding a dragon-wood greatbow"),
    (["Aila", "에일라"], 70, "Aila", "에일라", "7-head-tall elven rune-mage in silver-blue robes wielding crescent rune wands"),
    (["Balbo", "발보"], 71, "Balbo", "발보", "muscular dwarven iron vanguard with power gauntlets and battleaxe"),
    (["Grimli", "그림리"], 74, "Grimli", "그림리", "muscular dwarven master blacksmith wielding a massive runic warhammer"),
    (["Ironforge", "아이언포지"], 80, "Ironforge", "아이언포지", "colossal golden runic guardian carrying twin constellation great-shields"),
    (["Fenrir", "펜릴"], 81, "Fenrir", "펜릴", "giant frost-wolf king with ice-crystal shoulder armor and glowing blue fangs"),
    (["Pegasus", "페가수스"], 90, "Pegasus", "페가수스", "winged celestial warhorse with iridescent feathers and silver-bridled tack"),
    (["Magitech Golem", "마기테크 골렘"], 99, "Magitech Golem", "마기테크 골렘", "ancient black-stone and brass colossus with glowing purple arcane core"),
]


def load_manifest() -> Dict[str, Any]:
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def parse_episode_arg(raw_arg: str) -> int:
    m = re.search(r"(\d+)", raw_arg)
    if not m:
        raise ValueError(f"Could not parse episode number from argument: {raw_arg}")
    ep = int(m.group(1))
    if not (1 <= ep <= 40):
        raise ValueError(f"Episode number must be between 1 and 40 (got {ep}).")
    return ep


def find_english_novel_path(ep: int) -> str:
    pattern = os.path.join(ENGLISH_TXT_DIR, f"SNSHero_Novel_Episode_{ep:02d}_*_EN.txt")
    matches = sorted(glob.glob(pattern))
    if not matches:
        raise FileNotFoundError(f"English novel file not found for Episode {ep:02d}: {pattern}")
    return matches[0]


def load_episode_texts(ep: int) -> Tuple[str, str, List[str], List[str], Dict[str, Any]]:
    en_path = find_english_novel_path(ep)
    with open(en_path, "r", encoding="utf-8") as f:
        en_raw = f.read().strip()

    en_blocks = [b.strip() for b in re.split(r"\n\s*\n", en_raw) if b.strip()]
    header_lines = en_blocks[0].splitlines()
    title_en = f"Episode {ep:02d}"
    for line in header_lines:
        if line.lower().startswith("episode"):
            title_en = re.sub(r"^Episode\s+\d+\s*:\s*", "", line, flags=re.IGNORECASE).strip()
    en_paras = en_blocks[1:]

    ko_path = os.path.join(KOREAN_BOOK_DIR, f"episode_{ep:02d}.md")
    title_ko = f"제{ep}화"
    ko_paras: List[str] = []
    if os.path.exists(ko_path):
        with open(ko_path, "r", encoding="utf-8") as f:
            ko_raw = f.read().strip()
        for line in ko_raw.splitlines():
            if line.startswith("# ") or line.startswith("## "):
                cleaned = re.sub(r"^#+\s*", "", line).strip()
                cleaned = re.sub(r"^제?\s*\d+\s*[화회]\s*[:.·-]?\s*", "", cleaned).strip()
                if cleaned:
                    title_ko = cleaned
                break
        ko_paras = [
            b.strip()
            for b in re.split(r"\n\s*\n", ko_raw)
            if b.strip() and not b.strip().startswith("#") and not b.strip().startswith(">") and b.strip() != "---"
        ]

    nar_path = os.path.join(NARRATION_JSON_DIR, f"episode_{ep:02d}_narrations.json")
    nar_json: Dict[str, Any] = {}
    if os.path.exists(nar_path):
        with open(nar_path, "r", encoding="utf-8") as f:
            nar_json = json.load(f)
            if nar_json.get("episodeTitleKo"):
                title_ko = nar_json["episodeTitleKo"]
            if nar_json.get("episodeTitleEn"):
                title_en = nar_json["episodeTitleEn"]

    return title_en, title_ko, en_paras, ko_paras, nar_json


def has_dialogue(text: str) -> bool:
    return bool(re.search(r'["“][^"”]+["”]', text))


def is_pure_quote_paragraph(text: str) -> bool:
    stripped = text.strip()
    return stripped.startswith('"') or stripped.startswith("“")


def align_korean_text_from_narrations(beat_en: str, nar_json: Dict[str, Any], fallback_ko: str) -> str:
    """
    Matches the English cutscene beat sentences against `episode_XX_narrations.json` scenes
    to retrieve the exact 1:1 aligned Korean novel sentences and dialogues.
    """
    scenes = nar_json.get("scenes", [])
    if not scenes:
        return fallback_ko

    matched_ko: List[str] = []
    beat_norm = re.sub(r"\s+", " ", beat_en).strip().lower()
    for s in scenes:
        s_en = re.sub(r"\s+", " ", s.get("narrationEn", "")).strip().lower()
        if not s_en:
            continue
        # Check if snippet of scene is in beat_en or vice versa
        probe = s_en[:36]
        if probe and probe in beat_norm:
            s_ko = s.get("narrationKo", "").strip()
            if s_ko and s_ko not in matched_ko:
                matched_ko.append(s_ko)

    return " ".join(matched_ko) if matched_ko else fallback_ko


def segment_into_6s_cutscene_beats(
    en_paras: List[str],
    ko_paras: List[str],
    nar_json: Dict[str, Any],
) -> List[Dict[str, Any]]:
    beats: List[Dict[str, Any]] = []
    i = 0
    n = len(en_paras)
    while i < n:
        curr_en = en_paras[i]
        curr_indices = [i]

        if (
            not has_dialogue(curr_en)
            and len(curr_en) < 165
            and (i + 1) < n
            and is_pure_quote_paragraph(en_paras[i + 1])
        ):
            curr_en = curr_en + " " + en_paras[i + 1]
            curr_indices.append(i + 1)
            i += 2
        elif (
            not has_dialogue(curr_en)
            and (i + 1) < n
            and is_pure_quote_paragraph(en_paras[i + 1])
            and len(en_paras[i + 1]) < 95
        ):
            curr_en = curr_en + " " + en_paras[i + 1]
            curr_indices.append(i + 1)
            i += 2
        else:
            i += 1

        ko_fallback = []
        if ko_paras:
            for idx in curr_indices:
                ko_idx = min(int(round(idx * len(ko_paras) / max(1, n))), len(ko_paras) - 1)
                if ko_paras[ko_idx] not in ko_fallback:
                    ko_fallback.append(ko_paras[ko_idx])

        aligned_ko = align_korean_text_from_narrations(curr_en, nar_json, " ".join(ko_fallback))

        beats.append({
            "paragraphIndices": [idx + 1 for idx in curr_indices],
            "textEn": curr_en,
            "textKo": aligned_ko,
        })

    return beats


def build_episode_story_summary(ep: int, title_en: str, title_ko: str, en_paras: List[str], ko_paras: List[str]) -> Tuple[str, str]:
    first_en = en_paras[0].split(".")[0].strip() + "." if en_paras else ""
    mid_en = en_paras[len(en_paras) // 2].split(".")[0].strip() + "." if len(en_paras) > 2 else ""
    last_en = en_paras[-1].split(".")[0].strip() + "." if en_paras else ""

    summary_en = (
        f"Episode {ep:02d} ('{title_en}'): {first_en} "
        f"As the conflict escalates ({mid_en}), the episode culminates when {last_en[0].lower() + last_en[1:] if len(last_en) > 1 else last_en}"
    )

    first_ko = ko_paras[0].split(".")[0].strip() + "." if ko_paras else ""
    mid_ko = ko_paras[len(ko_paras) // 2].split(".")[0].strip() + "." if len(ko_paras) > 2 else ""
    last_ko = ko_paras[-1].split(".")[0].strip() + "." if ko_paras else ""
    summary_ko = (
        f"제{ep}화 『{title_ko}』({title_en}): {first_ko} "
        f"중반부 {mid_ko} 이어 결말에서는 {last_ko}"
    )
    return summary_en, summary_ko


def match_location_for_beat(ep: int, beat_text_en: str, locations: List[Dict[str, Any]], prev_loc: Optional[Dict[str, Any]]) -> Tuple[Dict[str, Any], str, str]:
    text_lower = beat_text_en.lower()

    # Whole-word regex patterns per location to prevent false substring matches (e.g. 'sea' inside 'seal')
    loc_keywords: Dict[str, List[str]] = {
        "LOC-001": ["elwin", "village", "tavern", "smithy", "wooden bridge", "stockades", "watchtowers", "tundra", "thatch", "hamlet", "rear alleys", "floorboards", "oak table"],
        "LOC-002": ["drunken bell", "bell tower", "bronze bell", "lakeside inn"],
        "LOC-003": ["mistfall", "mist cliff", "mist-shrouded chasm", "precipice", "cliff", "raging river rapids"],
        "LOC-004": ["wildlands", "great plains", "steppe", "nomad", "yurt", "wastes", "traitor's camp"],
        "LOC-005": ["pegasus valley", "crimson mane", "border gate", "red grass"],
        "LOC-006": ["inner forum", "arena", "dueling courtyard", "lighthaven square"],
        "LOC-007": ["red glass", "flame court", "imperial palace", "court at lighthaven", "gluttonous banquets"],
        "LOC-008": ["labor camp", "subterranean", "seventh subterranean", "underground mine"],
        "LOC-009": ["cloud return", "mist lake", "lotus pavilion", "manor"],
        "LOC-010": ["whispering wind", "wind isle", "wind island", "peach blossom"],
        "LOC-011": ["black temple", "jade barrier spire", "obsidian temple"],
        "LOC-012": ["sky altar", "cloud peak", "three trials"],
        "LOC-013": ["flower ship", "siren strait", "galleon", "whirlpool"],
        "LOC-014": ["dragonhorn", "dragon grotto", "sea cave", "fourth peak"],
        "LOC-015": ["sealed chamber", "adamantium door", "triple lock"],
        "LOC-016": ["jade council", "council hall", "imperial throne"],
        "LOC-017": ["four gates", "citadel of the four", "serpent fortress"],
        "LOC-018": ["quicksand river", "black marsh", "poison swamp"],
        "LOC-019": ["black citadel", "starlight archive", "constellation dome"],
        "LOC-020": ["altar of ruin", "two graves", "abyssal rift", "snowdrop"],
    }

    best_loc = None
    best_score = -1

    for loc in locations:
        code = loc["code"]
        score = 0
        in_ep = ep in loc.get("episodes", [])
        if in_ep:
            score += 6
        kw_hits = 0
        for kw in loc_keywords.get(code, []):
            if re.search(rf"\b{re.escape(kw)}\b", text_lower):
                kw_hits += 1
                score += (10 if in_ep else 4)
        # Keep continuity with prev_loc if no explicit new location keyword is triggered
        if prev_loc and prev_loc["code"] == code and kw_hits == 0:
            score += 4
        if score > best_score:
            best_score = score
            best_loc = loc

    if not best_loc:
        best_loc = prev_loc or locations[0]

    sub_en = best_loc["promptEn"]
    sub_ko = f"{best_loc['nameKo']} ({best_loc['nameEn']}) — {best_loc.get('architectureKo', '')} / {best_loc.get('atmosphereKo', '')}"

    if any(k in text_lower for k in [
        "tavern", "floorboards", "oak table", "earthenware", "raising cups",
        "before stepping back into the blizzard", "gripped the hilt", "companion blade",
        "spearhead reflecting", "opened both empty palms", "southern basin"
    ]):
        sub_en = (
            f"Interior of the weathered log tavern hidden behind the village smithy in {best_loc['nameEn']} (Location Art: {best_loc['artUrl']}), "
            "rough oak tables, glowing red charcoal brazier, earthenware flasks on timber shelves, frost seeping through heavy pine door hinges, "
            "outside howling blue-white blizzard."
        )
        sub_ko = f"{best_loc['nameKo']} ({best_loc['nameEn']}) 대장간 뒤편 통나무 선술집 내부 — 참숯 화로 불빛과 거친 참나무 식탁, 문틈으로 스며드는 눈보라"
    elif any(k in text_lower for k in ["bridge", "mooring cables", "deflected blows", "surrender your steel"]):
        sub_en = (
            f"Solitary wooden suspension bridge over an icy torrent in burning {best_loc['nameEn']} (Location Art: {best_loc['artUrl']}), "
            "straw-thatched roofs ablaze with orange fire against a blinding dawn blizzard, heavy mooring cables over a freezing gorge."
        )
        sub_ko = f"불타는 {best_loc['nameKo']} ({best_loc['nameEn']})의 외나무 현수교 위 — 타오르는 초가지붕의 붉은 화염과 거센 눈보라, 아래로 흐르는 얼음 급류"
    elif any(k in text_lower for k in ["wheat seeds", "pillars of smoke", "turned north into the gale", "never bow your head", "bake bread"]):
        sub_en = (
            f"Frozen northern tundra ridge overlooking the distant burning ruins and black smoke pillars of {best_loc['nameEn']} (Location Art: {best_loc['artUrl']}), "
            "vast windswept snowfield under a pale stormy sky, exposed patches of frozen dark loam."
        )
        sub_ko = f"{best_loc['nameKo']} ({best_loc['nameEn']}) 너머 북방 설원 언덕 — 멀리 피어오르는 검은 연기 기둥과 칼바람이 몰아치는 설원"

    return best_loc, sub_en, sub_ko


def match_characters_for_beat(
    beat_text_en: str,
    char_map_by_id: Dict[int, Dict[str, Any]],
    recent_chars: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Detects appearing characters in the current cutscene beat and resolves them to their
    7-head-tall (7등신) cutout PNG files (`public/anime-character-sheets/cutouts/XXX_Name.png`).
    """
    # Strip place names like "village of Elwin" or "Elwin Village" before matching character "Elwin"
    cleaned_for_char = re.sub(r"\b(?:village\s+of\s+Elwin|Elwin\s+Village)\b", "frontier_village", beat_text_en, flags=re.IGNORECASE)
    # Strip indirect possessive mentions ("Aleksandar's demise", "Aleksandar's wife", "Balian's wife")
    cleaned_for_char = re.sub(r"\b(?:Aleksandar|Balian)'s\s+(?:demise|wife|death|memory)\b", "husband_ref", cleaned_for_char, flags=re.IGNORECASE)
    # Also strip unborn baby naming ("name him Kadan", "named Ignis") when they are not physically standing as 7-head-tall adults in EP01 tavern
    cleaned_for_char = re.sub(r"\bname(?:d)?\s+(?:him\s+)?(?:Kadan|Ignis)\b", "named_child", cleaned_for_char, flags=re.IGNORECASE)

    matched: List[Dict[str, Any]] = []
    seen_ids = set()

    def add_char_by_id(cid: int, canon_en: str, canon_ko: str, default_weapon: str):
        if cid not in seen_ids and cid in char_map_by_id:
            c_sheet = char_map_by_id[cid]
            cutout_url = c_sheet.get("cutoutUrl", f"/anime-character-sheets/cutouts/{cid:03d}_{c_sheet['nameEn']}.png")
            matched.append({
                "id": cid,
                "code": c_sheet["code"],
                "nameEn": canon_en,
                "nameKo": canon_ko,
                "cutoutUrl": cutout_url,
                "cutoutFilePath": f"public{cutout_url}",
                "sheetUrl": c_sheet["sheetUrl"],
                "defaultWeaponEn": default_weapon,
                "sheetPromptEn": c_sheet.get("videoPromptEn", ""),
                "hairDesignKo": c_sheet.get("hairDesignKo", ""),
                "signatureItemKo": c_sheet.get("signatureItemKo", ""),
            })
            seen_ids.add(cid)

    for keywords, cid, canon_en, canon_ko, default_weapon in CHARACTER_ALIASES:
        for kw in keywords:
            if re.search(rf"\b{re.escape(kw)}\b", cleaned_for_char, flags=re.IGNORECASE) if kw.isascii() else (kw in cleaned_for_char):
                add_char_by_id(cid, canon_en, canon_ko, default_weapon)
                break

    lower = cleaned_for_char.lower()
    # Contextual co-presence rules (e.g. "intruder", "stranger", "brothers", "three warriors" in the tavern scene)
    if any(k in lower for k in ["intruder", "stranger's grim eyes", "stand down, brothers", "place these silver daggers", "three warriors"]):
        for keywords, cid, canon_en, canon_ko, default_weapon in CHARACTER_ALIASES:
            if cid in (50, 43, 49):  # Aleksandar, Balian, Hercul
                add_char_by_id(cid, canon_en, canon_ko, default_weapon)

    if not matched and recent_chars:
        if any(p in lower for p in ["he ", "she ", "his ", "her ", "they ", "their ", "brothers", "three warriors"]):
            matched = recent_chars[:3]

    return matched


def match_props_and_holders_for_beat(
    ep: int,
    beat_text_en: str,
    appearing_chars: List[Dict[str, Any]],
    props_list: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    text_lower = beat_text_en.lower()
    prop_by_code = {p["code"]: p for p in props_list}
    results: List[Dict[str, Any]] = []

    char_names_en = [c["nameEn"] for c in appearing_chars]

    def pick_holder(preferred: List[str], fallback: str = "Appearing character") -> str:
        for pref in preferred:
            for cname in char_names_en:
                if pref.lower() in cname.lower():
                    return cname
        for pref in preferred:
            if pref.lower() in text_lower:
                return pref
        return char_names_en[0] if char_names_en else fallback

    # 1. Silver Dagger (PROP-001)
    if any(k in text_lower for k in ["silver dagger", "companion blade", "gripped the hilt", "slender silver", "twin silver daggers"]):
        p = prop_by_code["PROP-001"]
        if "hercul" in text_lower and ("produced" in text_lower or "hands" in text_lower):
            holder_en = "Hercul (7-head-tall cutout: /anime-character-sheets/cutouts/049_Hercul.png) holds the two Silver Daggers (PROP-001) wrapped in oiled doe-skin and hands them to Aleksandar and Balian"
            holder_ko = "헤르쿨(7등신 컷아웃: 049_Hercul.png)이 기름 먹인 사슴 가죽에 감싼 은빛 단검(PROP-001) 두 자루를 꺼내 알렉산다르와 발리안에게 건넴"
        elif "aleksandar" in text_lower and "hilt" in text_lower:
            holder_en = "Aleksandar (7-head-tall cutout: /anime-character-sheets/cutouts/050_Aleksandar.png) firmly grips the hilt of the Silver Dagger (PROP-001) in his right hand"
            holder_ko = "알렉산다르(7등신 컷아웃: 050_Aleksandar.png)가 은빛 단검(PROP-001)의 자루를 오른손으로 굳게 쥠"
        elif "balian" in text_lower and ("companion blade" in text_lower or "chest" in text_lower):
            holder_en = "Balian (7-head-tall cutout: /anime-character-sheets/cutouts/043_Balian.png) holds the companion Silver Dagger (PROP-001) pressed against his chest"
            holder_ko = "발리안(7등신 컷아웃: 043_Balian.png)이 한 쌍의 은빛 단검(PROP-001)을 받아 가슴에 품음"
        elif "elwin" in text_lower or "bodice" in text_lower or "womb" in text_lower:
            holder_en = "Elwin (7-head-tall cutout: /anime-character-sheets/cutouts/042_Elwin.png) carries the glowing Silver Dagger (PROP-001) and Aleksandar's broken sword-sheath tucked against her bodice"
            holder_ko = "엘윈(7등신 컷아웃: 042_Elwin.png)이 품속에 은빛 단검(PROP-001)과 남편 알렉산다르의 부러진 검집을 소중히 품고 있음"
        else:
            h = pick_holder(["Kadan", "Aleksandar", "Elwin", "Hercul", "Balian"])
            holder_en = f"{h} holds and wields the Silver Dagger (PROP-001)"
            holder_ko = f"{h}이(가) 은빛 단검(PROP-001)을 소지 및 사용"
        results.append({
            "code": p["code"],
            "nameEn": p["nameEn"],
            "nameKo": p["nameKo"],
            "artUrl": p["artUrl"],
            "sheetUrl": p["sheetUrl"],
            "holderEn": holder_en,
            "holderKo": holder_ko,
            "promptEn": p["promptEn"],
        })

    # 2. Arcane Spear / Salt-Crystal Spear (PROP-020)
    if any(k in text_lower for k in ["arcane spear", "spearhead", "spear haft", "salt-crystal spear", "arcane chains"]):
        p = prop_by_code["PROP-020"]
        h = pick_holder(["Balian", "Grendal", "Brianna"], "Balian")
        if "snapping" in text_lower:
            holder_en = f"{h} (7-head-tall cutout: /anime-character-sheets/cutouts/043_Balian.png) wields and snaps the shaft of his glowing cyan Arcane Spear (PROP-020) to drag enemy cavalry over the cliff"
            holder_ko = f"{h}(7등신 컷아웃: 043_Balian.png)이 푸른 마력이 깃든 아케인 창(PROP-020)을 휘두르며 창대를 부러뜨려 적 기병들을 절벽 아래로 끌고 감"
        else:
            holder_en = f"{h} (7-head-tall cutout: /anime-character-sheets/cutouts/043_Balian.png) wields the azure-sparking Arcane Spear (PROP-020) in combat stance"
            holder_ko = f"{h}(7등신 컷아웃: 043_Balian.png)이 푸른 스파크가 튀는 아케인 창(PROP-020)을 손에 쥐고 겨눔"
        results.append({
            "code": p["code"],
            "nameEn": p["nameEn"],
            "nameKo": p["nameKo"],
            "artUrl": p["artUrl"],
            "sheetUrl": p["sheetUrl"],
            "holderEn": holder_en,
            "holderKo": holder_ko,
            "promptEn": p["promptEn"],
        })

    # 3. Other Canonical Props (PROP-002 .. PROP-019)
    prop_triggers = [
        ("PROP-002", ["dragon breaker", "enduring shield"], ["Brianna", "Kadan", "Aleksandar"]),
        ("PROP-003", ["iron shield", "weathered shield"], ["Aleksandar", "Balian", "Kadan"]),
        ("PROP-004", ["nine shadows", "codex", "grimoire"], ["Silia (Celia)", "Kadan", "Ironforge"]),
        ("PROP-005", ["jade staff", "emerald staff"], ["Silia (Celia)", "Alisa / Leonar"]),
        ("PROP-006", ["white glass ember", "white flame"], ["Lise (Pyro)", "Kadan", "Silia (Celia)"]),
        ("PROP-007", ["snowdrop", "white flower"], ["Elwin", "Kadan", "Silia (Celia)"]),
        ("PROP-008", ["moonlit herb", "barley broth", "medicinal herb"], ["Elwin", "Eliana", "Aria (Sylphid)"]),
        ("PROP-009", ["silk seal", "three seals"], ["Silia (Celia)", "Kadan"]),
        ("PROP-010", ["cross-shaped scar", "star map", "map of the"], ["Kadan", "Silia (Celia)"]),
        ("PROP-011", ["abyssal core", "dark orb"], ["Lucian", "Death Knight Artus"]),
        ("PROP-012", ["throne seal", "serpentine crest", "cracked golden seal", "shattered breastplate insignia"], ["Hercul", "Lucian"]),
        ("PROP-013", ["tripartite seal", "jade key"], ["Kadan", "Silia (Celia)"]),
        ("PROP-014", ["obsidian greatsword", "twin blades", "dual swords", "twin swords"], ["Aleksandar", "Death Knight Artus", "Lucian"]),
        ("PROP-015", ["serpent venom", "poison vial"], ["Gorgo (Medusa Gorgo)"]),
        ("PROP-016", ["star-breathing", "astral scroll", "breathing stars"], ["Grendal (Malfuon)", "Kadan"]),
        ("PROP-017", ["jade flute", "wind isle invitation"], ["Aria (Sylphid)", "Silia (Celia)"]),
        ("PROP-018", ["crimson mane", "warhorse", "saddle", "reins"], ["Lucian", "Kadan", "Silia (Celia)"]),
        ("PROP-019", ["bronze bell", "great-bell"], ["Grendal (Malfuon)", "Lazar (Aeolus)"]),
    ]

    existing_codes = {r["code"] for r in results}
    for code, kws, pref_holders in prop_triggers:
        if code in existing_codes:
            continue
        if any(k in text_lower for k in kws):
            p = prop_by_code[code]
            h = pick_holder(pref_holders)
            if code == "PROP-014" and "Aleksandar" in h:
                holder_en = f"Aleksandar (7-head-tall cutout: /anime-character-sheets/cutouts/050_Aleksandar.png) wields his forged twin arcane longswords in both hands (referencing {p['code']} blade craft)"
                holder_ko = f"알렉산다르(7등신 컷아웃: 050_Aleksandar.png)가 양손에 벼린 아케인 쌍검({p['code']} 계열 도검)을 쥐고 전투를 펼침"
            elif code == "PROP-012" and "Hercul" in h:
                holder_en = f"Hercul (7-head-tall cutout: /anime-character-sheets/cutouts/049_Hercul.png) carries the cracked golden Holy Knights seal at his belt and places the shattered Grand Master insignia on the oak table ({p['code']})"
                holder_ko = f"헤르쿨(7등신 컷아웃: 049_Hercul.png)이 허리춤에 금이 간 성기사단 황금 인장({p['code']})을 차고 부서진 대단장의 흉갑 문장을 식탁 위에 내려놓음"
            else:
                holder_en = f"{h} holds/carries {p['nameEn']} ({p['code']})"
                holder_ko = f"{h}이(가) {p['nameKo']}({p['code']})을(를) 소지 및 사용"
            results.append({
                "code": p["code"],
                "nameEn": p["nameEn"],
                "nameKo": p["nameKo"],
                "artUrl": p["artUrl"],
                "sheetUrl": p["sheetUrl"],
                "holderEn": holder_en,
                "holderKo": holder_ko,
                "promptEn": p["promptEn"],
            })
            existing_codes.add(code)

    # 4. Scene-specific narrative props
    if "melted snowfall" in text_lower or "raising cups" in text_lower:
        results.append({
            "code": "PROP-001",
            "nameEn": "Earthenware Cups of Melted Snowfall & Twin Silver Daggers",
            "nameKo": "눈 녹인 물을 채운 질그릇 잔 & 은빛 단검 두 자루",
            "artUrl": "/anime-character-sheets/props/art/PROP_001_Silver_Dagger.jpg",
            "sheetUrl": "/anime-character-sheets/props/sheets/PROP_001_Silver_Dagger_sheet.jpg",
            "holderEn": "Aleksandar (050_Aleksandar.png), Balian (043_Balian.png), and Hercul (049_Hercul.png) each hold an earthenware cup of melted snowfall raised in a solemn toast while the two Silver Daggers (PROP-001) rest on the oak table",
            "holderKo": "알렉산다르(050_Aleksandar.png), 발리안(043_Balian.png), 헤르쿨(049_Hercul.png) 세 전사가 각자 눈 녹인 물이 담긴 질그릇 잔을 높이 들어 맹세를 나누며 식탁 위에는 은빛 단검(PROP-001) 두 자루가 놓여 있음",
            "promptEn": "Three rustic earthenware cups raised together over a rough oak tavern table beside two glowing silver daggers.",
        })
    elif "wheat seeds" in text_lower:
        results.append({
            "code": "PROP-001",
            "nameEn": "Silver Dagger & Fistful of Golden Wheat Seeds",
            "nameKo": "은빛 단검 & 황금빛 밀알 한 줌",
            "artUrl": "/anime-character-sheets/props/art/PROP_001_Silver_Dagger.jpg",
            "sheetUrl": "/anime-character-sheets/props/sheets/PROP_001_Silver_Dagger_sheet.jpg",
            "holderEn": "Elwin (7-head-tall cutout: /anime-character-sheets/cutouts/042_Elwin.png) clutches Aleksandar's broken sword-sheath and the glowing Silver Dagger (PROP-001) against her breast with one hand while burying a fistful of golden wheat seeds into the frozen snow-covered loam with her bare fingers",
            "holderKo": "엘윈(7등신 컷아웃: 042_Elwin.png)이 한 손으로 남편의 부러진 검집과 은빛 단검(PROP-001)을 가슴에 품고, 다른 맨손으로 얼어붙은 흙 속에 황금빛 밀알 한 줌을 심음",
            "promptEn": "A glowing silver runic dagger and a broken sword-sheath clutched to a wool cloak while bare fingers press golden wheat seeds into snowy earth.",
        })

    if not results and appearing_chars:
        c0 = appearing_chars[0]
        results.append({
            "code": "CHAR-EQUIP",
            "nameEn": f"{c0['nameEn']}'s Signature Gear",
            "nameKo": f"{c0['nameKo']}의 기본 무장/소지품",
            "artUrl": c0["cutoutUrl"],
            "sheetUrl": c0["cutoutUrl"],
            "holderEn": f"{c0['nameEn']} (7-head-tall cutout: {c0['cutoutUrl']}) carries their signature equipment ({c0['defaultWeaponEn']})",
            "holderKo": f"{c0['nameKo']}(7등신 컷아웃: {c0['cutoutUrl']})이(가) 고유 무장({c0['signatureItemKo']})을 착용/소지함",
            "promptEn": c0["defaultWeaponEn"],
        })

    return results


def extract_and_summarize_6s_dialogue(
    beat_text_en: str,
    beat_text_ko: str,
    appearing_chars: List[Dict[str, Any]],
) -> Dict[str, Any]:
    quotes_en = [q.strip() for q in re.findall(r'["“]([^"”]+)["”]', beat_text_en) if q.strip()]
    quotes_ko = [q.strip() for q in re.findall(r'["“]([^"”]+)["”]', beat_text_ko) if q.strip()]

    if not quotes_en:
        return {
            "hasDialogue": False,
            "speakerEn": "None (Silent Cutscene)",
            "speakerKo": "없음 (무언 연출 컷신)",
            "originalLineEn": "",
            "summarized6sLineEn": "",
            "summarized6sLineKo": "",
            "dialoguePromptEn": (
                "NO SPOKEN DIALOGUE: All appearing characters in this 6-second cutscene MUST remain completely silent "
                "and MUST NOT speak a single word (mouths closed, zero lip movement, pure visual acting and atmosphere only)."
            ),
            "dialoguePromptKo": (
                "대사 없음 (전원 침묵 규칙): 이 6초 컷신에 등장하는 모든 인물은 아무 말도 해서는 안 되며, "
                "입을 다문 채 표정과 동작으로만 연기해야 합니다."
            ),
        }

    combined_en = " ".join(quotes_en)
    combined_ko = " ".join(quotes_ko) if quotes_ko else ""

    lower = beat_text_en.lower()
    speaker_en = "Speaking Character"
    speaker_ko = "등장인물"

    speaker_patterns = [
        (r"balian\s+(?:growled|pressed|charged|shouts|said|cried)", "Balian", "발리안"),
        (r"hercul\s+(?:whispered|urged|did not reach|said|opened)", "Hercul", "헤르쿨"),
        (r"aleksandar\s+(?:gripped|deflected|said|roared|cried)", "Aleksandar", "알렉산다르"),
        (r"lucian\s+(?:sneered|said|laughed|shouted)", "Lucian", "루시안"),
        (r"ysela\s+(?:crawled|hurled|cried|screamed)", "Ysela", "이셀라"),
        (r"she\s+hurled.*monster", "Ysela", "이셀라"),
        (r"lay no hand upon me", "Ysela", "이셀라"),
        (r"live,\s*ysela", "Balian", "발리안"),
        (r"elwin\s+(?:turned|whispered|dropped|said)", "Elwin", "엘윈"),
        (r"even if we never return", "Elwin", "엘윈"),
        (r"my child,\s*you were not born", "Elwin", "엘윈"),
    ]

    matched_speaker = False
    for pat, s_en, s_ko in speaker_patterns:
        if re.search(pat, lower):
            speaker_en = s_en
            speaker_ko = s_ko
            matched_speaker = True
            break

    if not matched_speaker and appearing_chars:
        speaker_en = appearing_chars[0]["nameEn"]
        speaker_ko = appearing_chars[0]["nameKo"]

    curated_6s = [
        (
            "if you are a hound dispatched",
            "If you are a hound of the Shadow Realm, speak your name and die!",
            "섀도우렐름이 보낸 사냥개라면, 이름을 입에 올리는 순간 숨통이 끊어질 줄 알아라!",
        ),
        (
            "stand down, brothers",
            "Stand down, brothers. I bear wolf blood, yet I do not hunt for the pack.",
            "거두게, 형제들이여. 내 망토에 이리의 피가 묻었으나 무리를 위해 사냥하지는 않는다.",
        ),
        (
            "the shadow reaches even into this southern basin",
            "The shadow reaches this basin. Royal inquisitors will strike before the new moon.",
            "그림자의 마수가 이 남쪽 분지까지 뻗쳤네. 초승달이 뜨기 전에 이단심문관들이 들이닥칠 걸세.",
        ),
        (
            "when your sons draw their first breath",
            "Place these silver daggers in your sons' hands to discern brother from foe.",
            "아이들이 태어나거든 이 은빛 단검을 쥐여 주어, 누가 형제이고 원수인지 분별하게 하라.",
        ),
        (
            "if my son enters this world",
            "If my son is born, I shall name him Kadan—the unbreakable shield.",
            "내 아들이 태어난다면 그 이름을 카단이라 부르겠소. 결코 부서지지 않는 방패라는 뜻이오.",
        ),
        (
            "and mine shall be named ignis",
            "And mine shall be named Ignis, whose spirit will never lose its way.",
            "내 아이의 이름은 이그니스라 짓겠소. 고난의 화덕 속에서도 길을 잃지 않을 불꽃이 될 것이오.",
        ),
        (
            "surrender your steel, aleksandar",
            "Surrender your steel, Aleksandar, and I may spare your wretched woman's life!",
            "검을 버려라, 알렉산다르! 반역죄를 자백하면 네 계집의 천한 목숨만은 살려주마!",
        ),
        (
            "my wife's life is not a favor",
            "My wife's life is not a favor to barter from a traitor's tongue!",
            "내 아내의 목숨은 반역자의 혀끝에서 흥정할 하사품이 아니다!",
        ),
        (
            "lay no hand upon me, monster",
            "Lay no hand upon me, monster!",
            "내 몸에 손대지 마라, 이 괴물 같은 자야!",
        ),
        (
            "live, ysela",
            "Live, Ysela! You must live!",
            "살아야 한다, 이셀라! 기어이 살아남아라!",
        ),
        (
            "even if we never return",
            "Even if we never return, someone must live to bake bread here again.",
            "비록 우리가 돌아오지 못하더라도, 언젠가 이 땅에서 다시 빵을 구울 이는 살아남아야 하니까요.",
        ),
        (
            "my child, you were not born",
            "My child, reject vengeance—only promise never to bow your head before a lie.",
            "아가야, 너는 복수를 위해 태어난 아이가 아니란다. 오직 거짓 앞에 고개 숙이지 않겠다고만 약속해 다오.",
        ),
    ]

    short_en = ""
    short_ko = ""
    for trigger, c_en, c_ko in curated_6s:
        if trigger in combined_en.lower():
            short_en = c_en
            short_ko = c_ko
            break

    if not short_en:
        words = combined_en.split()
        if len(words) <= 15:
            short_en = combined_en
        else:
            first_sent = re.split(r"[.!?]", combined_en)[0].strip()
            w_first = first_sent.split()
            short_en = (" ".join(w_first[:14]) + "...") if len(w_first) > 14 else (first_sent + ".")

    if not short_ko:
        if combined_ko:
            ko_words = combined_ko.split()
            short_ko = combined_ko if len(ko_words) <= 13 else (" ".join(ko_words[:12]) + "...")
        else:
            short_ko = short_en

    return {
        "hasDialogue": True,
        "speakerEn": speaker_en,
        "speakerKo": speaker_ko,
        "originalLineEn": combined_en,
        "summarized6sLineEn": short_en,
        "summarized6sLineKo": short_ko,
        "dialoguePromptEn": (
            f"6-SECOND SPOKEN DIALOGUE RULE: {speaker_en} MUST speak the following summarized line concisely within 6 seconds "
            f"with expressive anime lip-sync: \"{short_en}\" — All other characters in the scene must remain silent."
        ),
        "dialoguePromptKo": (
            f"6초 이내 대사 요약 지침: [{speaker_ko}({speaker_en})] 캐릭터가 6초 이내로 다음 요약 대사를 발화해야 함: "
            f"\"{short_ko}\" (영문 6s 대사: \"{short_en}\") — 그 외 등장인물은 모두 입을 다물고 침묵 유지."
        ),
    }


def generate_episode_cutscenes(ep: int) -> Tuple[Dict[str, Any], str, str]:
    manifest = load_manifest()
    char_map_by_id = {c["id"]: c for c in manifest.get("characters", [])}
    locations = manifest.get("locations", [])
    props_list = manifest.get("props", [])

    title_en, title_ko, en_paras, ko_paras, nar_json = load_episode_texts(ep)
    ep_summary_en, ep_summary_ko = build_episode_story_summary(ep, title_en, title_ko, en_paras, ko_paras)
    beats = segment_into_6s_cutscene_beats(en_paras, ko_paras, nar_json)

    cutscenes: List[Dict[str, Any]] = []
    prev_loc: Optional[Dict[str, Any]] = None
    recent_chars: List[Dict[str, Any]] = []

    for idx, beat in enumerate(beats, start=1):
        beat_en = beat["textEn"]
        beat_ko = beat["textKo"]

        # 1. Location
        loc, loc_desc_en, loc_desc_ko = match_location_for_beat(ep, beat_en, locations, prev_loc)
        prev_loc = loc

        # 2. Appearing Characters (7-head-tall cutouts!)
        chars = match_characters_for_beat(beat_en, char_map_by_id, recent_chars)
        if chars:
            recent_chars = chars

        # 3. Props & Prop Holders
        props = match_props_and_holders_for_beat(ep, beat_en, chars, props_list)

        # 4. 6-Second Dialogue or Silence Rule
        diag = extract_and_summarize_6s_dialogue(beat_en, beat_ko, chars)

        # Build Character Prompt Block referencing 7-head-tall cutouts (`cutoutUrl`)
        if chars:
            char_lines_en = []
            char_lines_ko = []
            for c in chars:
                char_lines_en.append(
                    f"{c['nameEn']} (7-Head-Tall Cutout Reference: {c['cutoutUrl']}) — {c['defaultWeaponEn']}"
                )
                char_lines_ko.append(
                    f"{c['nameKo']}({c['nameEn']}, 7등신 컷아웃: `{c['cutoutUrl']}`) — {c['signatureItemKo']}"
                )
            char_block_en = " ; ".join(char_lines_en)
            char_block_ko = " / ".join(char_lines_ko)
        else:
            char_block_en = "No named hero in foreground (Atmospheric environment shot or distant silhouettes of villagers only)."
            char_block_ko = "주요 등장인물 클로즈업 없음 (배경 중심 시네마틱 롱샷 또는 원경 마을 주민 실루엣)"

        # Build Prop & Holder Block
        if props:
            prop_block_en = " ; ".join(
                f"[{p['code']} {p['nameEn']} (Prop Reference: {p['artUrl']})]: {p['holderEn']}" for p in props
            )
            prop_block_ko = " / ".join(
                f"[{p['code']} {p['nameKo']} ({p['nameEn']}, 소품 원화: `{p['artUrl']}`)]: {p['holderKo']}" for p in props
            )
        else:
            prop_block_en = "No special relic prop in this shot."
            prop_block_ko = "특수 소품 없음"

        # 5. Strict No-Text Constraint
        no_text_en = (
            "STRICT NO-TEXT RULE: Do NOT render any text, subtitles, captions, speech bubbles, letters, numbers, "
            "watermarks, signage, or UI overlays anywhere in the 6-second video."
        )
        no_text_ko = "글자 포함 절대 금지: 영상 내 자막, 말풍선, 텍스트, 알파벳, 한자, 숫자, 워터마크, UI 등 어떠한 글자도 절대 포함되어서는 안 됨."

        # 6. Unified Copy-Ready 6-Second Video Prompt (English)
        start_sec = (idx - 1) * 6
        end_sec = idx * 6
        timecode = f"{start_sec // 60:02d}:{start_sec % 60:02d}–{end_sec // 60:02d}:{end_sec % 60:02d}"

        unified_prompt_en = (
            f"[6-SECOND ANIME CUTSCENE VIDEO PROMPT | EP{ep:02d}-CUT{idx:02d} ({timecode})] "
            f"1) EPISODE STORY CONTEXT: {ep_summary_en} "
            f"2) CURRENT CUTSCENE ACTION (6s): {beat_en} "
            f"3) BACKGROUND LOCATION SHEET & PROMPT: [{loc['code']} {loc['nameEn']} | Location Image: {loc['artUrl']} | Sheet: {loc['sheetUrl']}] {loc_desc_en} "
            f"4) APPEARING CHARACTERS (7-HEAD-TALL CUTOUTS): {char_block_en} "
            f"5) PROPS & PROP HOLDER SPECIFICATION: {prop_block_en} "
            f"6) {diag['dialoguePromptEn']} "
            f"7) {no_text_en} "
            f"8) STYLE: Masterpiece 7-head-tall 2D fantasy anime cinema (ufotable & Makoto Shinkai quality), 16:9 widescreen, 24fps, smooth 6-second continuous camera motion."
        )

        attached_cutout_files = [
            {
                "code": c["code"],
                "nameEn": c["nameEn"],
                "nameKo": c["nameKo"],
                "cutoutUrl": c["cutoutUrl"],
                "localPath": f"{ROOT_DIR}/public{c['cutoutUrl']}",
            }
            for c in chars
        ]

        cutscenes.append({
            "cutNumber": idx,
            "cutCode": f"EP{ep:02d}-CUT{idx:02d}",
            "durationSeconds": 6,
            "timecode": timecode,
            "sourceParagraphs": beat["paragraphIndices"],
            "novelTextEn": beat_en,
            "novelTextKo": beat_ko,
            "episodeSummaryEn": ep_summary_en,
            "episodeSummaryKo": ep_summary_ko,
            "location": {
                "code": loc["code"],
                "nameEn": loc["nameEn"],
                "nameKo": loc["nameKo"],
                "artUrl": loc["artUrl"],
                "sheetUrl": loc["sheetUrl"],
                "descriptionEn": loc_desc_en,
                "descriptionKo": loc_desc_ko,
            },
            "characters": chars,
            "attachedCutouts": attached_cutout_files,
            "characterPromptEn": char_block_en,
            "characterPromptKo": char_block_ko,
            "props": props,
            "propHolderPromptEn": prop_block_en,
            "propHolderPromptKo": prop_block_ko,
            "dialogue": diag,
            "noTextRuleEn": no_text_en,
            "noTextRuleKo": no_text_ko,
            "unifiedVideoPromptEn": unified_prompt_en,
        })

    payload = {
        "episodeNumber": ep,
        "episodeTitleEn": title_en,
        "episodeTitleKo": title_ko,
        "cutsceneDurationSeconds": 6,
        "totalCutscenes": len(cutscenes),
        "totalDurationSeconds": len(cutscenes) * 6,
        "episodeSummaryEn": ep_summary_en,
        "episodeSummaryKo": ep_summary_ko,
        "cutscenes": cutscenes,
    }

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    json_out = os.path.join(OUTPUT_DIR, f"episode_{ep:02d}_cutscene_prompts.json")
    md_out = os.path.join(OUTPUT_DIR, f"episode_{ep:02d}_cutscene_prompts.md")

    with open(json_out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    # Render Markdown Document
    md_lines = [
        f"# [/script-anime {ep}회] 제{ep}화 『{title_ko}』 ({title_en}) — 6초 애니메이션 컷신 프롬프트 리스트",
        "",
        f"- **회차 번호**: 제{ep}화 (`Episode {ep:02d}: {title_en}`)",
        f"- **컷신 규격**: 1컷당 **6초 동영상 (`6-Second Video Cutscene`)** × 총 **{len(cutscenes)}컷** (총 러닝타임 약 `{len(cutscenes) * 6 // 60}분 {len(cutscenes) * 6 % 60:02d}초`)",
        f"- **첨부 캐릭터 시트 기준**: **7등신 전신 컷아웃 (`public/anime-character-sheets/cutouts/XXX_Name.png`)**",
        f"- **현재 회차 전체 스토리 요약 (Story Consistency Summary)**:",
        f"  - **KR**: {ep_summary_ko}",
        f"  - **EN**: `{ep_summary_en}`",
        "- **필수 준수 규칙**:",
        "  1. 모든 컷신 프롬프트에는 **현재 회차 전체 스토리 요약**이 포함되어 컷 간 스토리 일관성을 유지합니다.",
        "  2. **배경장소 시트(`LOC-001`~`LOC-020`)**, **7등신 캐릭터 컷아웃(`cutouts/001..110_*.png`)**, **소품 시트(`PROP-001`~`PROP-020`) 및 소품 소지 캐릭터**가 명시됩니다.",
        "  3. 대사가 있는 컷은 **해당 캐릭터가 6초 이내로 요약 대사를 발화**하도록 지정하며, 대사가 없는 컷은 **모든 등장인물이 아무 말도 하지 않도록(입을 다물고 침묵)** 강제합니다.",
        "  4. 모든 컷신 영상에는 **어떠한 글자(자막, 말풍선, 텍스트, 워터마크, UI)도 절대 포함되지 않습니다.**",
        "",
        "---",
        "",
    ]

    for c in cutscenes:
        diag = c["dialogue"]
        loc = c["location"]
        cutout_links = ", ".join(
            f"[`{ch['code']} {ch['nameKo']} ({ch['nameEn']}) 7등신 Cutout`](file://{ch['localPath']})"
            for ch in c["attachedCutouts"]
        ) if c["attachedCutouts"] else "등장인물 없음 (배경 단독 컷)"

        md_lines.extend([
            f"## {c['cutCode']} ({c['timecode']} · 6초 동영상)",
            "",
            f"- **원문 소설 구간 (EN)**: {c['novelTextEn']}",
            f"- **원문 소설 구간 (KR)**: {c['novelTextKo']}",
            f"- **1. 현재 회차 전체 스토리 요약 (Episode Story Context)**:",
            f"  - {c['episodeSummaryKo']}",
            f"  - `EN`: {c['episodeSummaryEn']}",
            f"- **2. 배경장소 시트 및 배경 묘사 (Background / Location Sheet)**:",
            f"  - **첨부 배경 이미지**: `{loc['code']}` **{loc['nameEn']}** ({loc['nameKo']}) — [배경 원화(`{loc['artUrl']}`)](file://{ROOT_DIR}/public{loc['artUrl']}) | [설정 시트(`{loc['sheetUrl']}`)](file://{ROOT_DIR}/public{loc['sheetUrl']})",
            f"  - **배경 묘사**: {loc['descriptionKo']}",
            f"  - `EN`: {loc['descriptionEn']}",
            f"- **3. 등장 캐릭터 7등신 Cutout 첨부 및 외형 묘사 (7-Head-Tall Character Cutouts)**:",
            f"  - **첨부 7등신 Cutout 파일**: {cutout_links}",
            f"  - **캐릭터 외형 묘사**: {c['characterPromptKo']}",
            f"  - `EN`: {c['characterPromptEn']}",
            f"- **4. 등장 소품 시트 및 소품 소지 캐릭터 (Props & Prop Holder)**:",
            f"  - **소품 및 소지자**: {c['propHolderPromptKo']}",
            f"  - `EN`: {c['propHolderPromptEn']}",
            f"- **5. 대사 6초 요약 또는 전원 침묵 지침 (6-Second Dialogue / Silence Rule)**:",
            f"  - {diag['dialoguePromptKo']}",
            f"  - `EN`: {diag['dialoguePromptEn']}",
            f"- **6. 글자 포함 금지 지침 (Strict No-Text Rule)**:",
            f"  - {c['noTextRuleKo']}",
            f"  - `EN`: {c['noTextRuleEn']}",
            "",
            "### [복사용 6초 동영상 통합 프롬프트 (Copy-Ready 6s Video Prompt)]",
            "```text",
            c["unifiedVideoPromptEn"],
            "```",
            "",
            "---",
            "",
        ])

    with open(md_out, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    return payload, md_out, json_out


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 skills/script-anime/scripts/generate_episode_cutscene_prompts.py <1회|1|--all>")
        sys.exit(1)

    arg = sys.argv[1].strip()
    if arg == "--all":
        for ep in range(1, 41):
            payload, md_out, _ = generate_episode_cutscenes(ep)
            print(f"[EP{ep:02d}] Generated {payload['totalCutscenes']} 6s cutscenes -> {md_out}")
    else:
        ep = parse_episode_arg(arg)
        payload, md_out, json_out = generate_episode_cutscenes(ep)
        print(f"Generated Episode {ep:02d} ('{payload['episodeTitleKo']}' / '{payload['episodeTitleEn']}'):")
        print(f"  - Total 6-Second Cutscenes: {payload['totalCutscenes']} cuts ({payload['totalDurationSeconds']}s)")
        print(f"  - Markdown Output: {md_out}")
        print(f"  - JSON Output:     {json_out}")


if __name__ == "__main__":
    main()
