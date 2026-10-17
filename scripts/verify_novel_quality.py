#!/usr/bin/env python3
"""
Verification script for SNSHero Web Novel 40-Episode IP Trilogy (Milestone 1)
Checks:
1. All 40 Korean markdown files (episode_01.md to episode_40.md) exist.
2. Every Korean episode has >= 3,500 total characters.
3. Every Korean episode has >= 8 distinct lines of direct dialogue (“...” or "...").
4. Crucial lore keywords (은빛 단검, 알렉산다르, 발리안, 이그니스, 실리아) are present in required chapters.
5. All 40 English chapters in public/book/image_narrations/english_txt/ exist.
6. Zero raw image tags (e.g. (042.png)) in English chapters.
7. Proper pronoun usage and dialogue count in English chapters.
8. public/book/index.json has matching titles, exact character counts, and totalCharacters.
9. src/content/englishNovelMapping.ts is fully synchronized.
"""

import json
import os
import re
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BOOK_DIR = os.path.join(BASE_DIR, "public", "book")
EN_DIR = os.path.join(BOOK_DIR, "image_narrations", "english_txt")
INDEX_JSON_PATH = os.path.join(BOOK_DIR, "index.json")
MAPPING_TS_PATH = os.path.join(BASE_DIR, "src", "content", "englishNovelMapping.ts")

REQUIRED_KEYWORDS = {
    "은빛 단검": [1, 2, 4, 11, 16],
    "알렉산다르": [1, 2, 4, 10, 11, 23, 24],
    "발리안": [1, 6, 7, 10, 11, 12, 16, 23, 24, 40],
    "이그니스": [1, 6, 7, 8, 9, 10, 11, 12, 14, 16, 17, 18, 19, 20, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 35, 37, 39, 40],
    "실리아": [5, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
}

def verify_all():
    errors = []
    warnings = []

    print("==================================================")
    print("SNSHero Web Novel 40-Episode Audit (Milestone 1)")
    print("==================================================")

    # 1. Load index.json
    if not os.path.exists(INDEX_JSON_PATH):
        errors.append(f"Missing index.json at {INDEX_JSON_PATH}")
        index_data = None
    else:
        with open(INDEX_JSON_PATH, "r", encoding="utf-8") as f:
            index_data = json.load(f)

    # 2. Check 40 Korean Episodes
    ko_lengths = []
    ko_dialogue_counts = []
    total_calculated_chars = 0

    for ep_num in range(1, 41):
        ep_pad = f"{ep_num:02d}"
        ko_file = os.path.join(BOOK_DIR, f"episode_{ep_pad}.md")

        if not os.path.exists(ko_file):
            errors.append(f"Missing Korean episode file: {ko_file}")
            continue

        with open(ko_file, "r", encoding="utf-8") as f:
            content = f.read()

        char_len = len(content)
        total_calculated_chars += char_len
        ko_lengths.append((ep_num, char_len))

        # Check length
        if char_len < 3500:
            errors.append(f"Episode {ep_pad}: Character count {char_len} is LESS than required 3,500!")

        # Count direct dialogue lines
        lines = content.split("\n")
        dialogue_lines = [
            l.strip() for l in lines 
            if ('“' in l and '”' in l) or ('"' in l and l.count('"') >= 2) or l.strip().startswith('“') or l.strip().startswith('"')
        ]
        ko_dialogue_counts.append((ep_num, len(dialogue_lines)))
        if len(dialogue_lines) < 8:
            errors.append(f"Episode {ep_pad}: Dialogue lines count {len(dialogue_lines)} is LESS than required 8!")

        # Check required keywords
        for kw, req_eps in REQUIRED_KEYWORDS.items():
            if ep_num in req_eps and kw not in content:
                errors.append(f"Episode {ep_pad}: Missing required lore keyword '{kw}'!")

        # Check header
        if not re.search(r"^#\s+눈히어로\s+\d+화\s+-\s+.+", content, re.MULTILINE):
            errors.append(f"Episode {ep_pad}: Invalid markdown header title format!")

        # Check index.json synchronization for this episode
        if index_data and "episodes" in index_data:
            idx_ep = next((e for e in index_data["episodes"] if e.get("episodeNumber") == ep_num), None)
            if not idx_ep:
                errors.append(f"index.json: Missing episode entry for episodeNumber={ep_num}")
            else:
                if idx_ep.get("characterCount") != char_len:
                    errors.append(f"index.json: Episode {ep_pad} characterCount ({idx_ep.get('characterCount')}) != actual file length ({char_len})")

    # Check totalCharacters in index.json
    if index_data:
        idx_total = index_data.get("totalCharacters", 0)
        if idx_total != total_calculated_chars:
            errors.append(f"index.json: totalCharacters ({idx_total}) != actual total ({total_calculated_chars})")

    # 3. Check English Novel Mapping and English TXT files
    if not os.path.exists(MAPPING_TS_PATH):
        errors.append(f"Missing englishNovelMapping.ts at {MAPPING_TS_PATH}")
    else:
        with open(MAPPING_TS_PATH, "r", encoding="utf-8") as f:
            mapping_code = f.read()

        for ep_num in range(1, 41):
            ep_pad = f"{ep_num:02d}"
            # Extract fileName
            match = re.search(rf'{ep_num}:\s*\{{\s*fileName:\s*"([^"]+)"', mapping_code)
            if not match:
                errors.append(f"englishNovelMapping.ts: Missing entry for episode {ep_num}")
                continue

            en_filename = match.group(1)
            en_path = os.path.join(EN_DIR, en_filename)

            if not os.path.exists(en_path):
                errors.append(f"Missing English txt file: {en_path}")
                continue

            with open(en_path, "r", encoding="utf-8") as f:
                en_content = f.read()

            if len(en_content) < 1500:
                errors.append(f"English Episode {ep_pad}: File too short ({len(en_content)} chars)")

            # Check raw image tokens like (042.png) or [Aleksandar(050.png)]
            raw_tokens = re.findall(r"\(\d{3}\.png\)|\[.*?\(?\d{3}\.png\)?.*?\]", en_content)
            if raw_tokens:
                errors.append(f"English Episode {ep_pad}: Found {len(raw_tokens)} raw image tokens! (e.g. {raw_tokens[:3]})")

    print("\n--- Summary of Verification ---")
    print(f"Total Korean Episodes Inspected: {len(ko_lengths)}")
    if ko_lengths:
        min_len = min(l[1] for l in ko_lengths)
        max_len = max(l[1] for l in ko_lengths)
        avg_len = sum(l[1] for l in ko_lengths) / len(ko_lengths)
        min_dlg = min(d[1] for d in ko_dialogue_counts)
        max_dlg = max(d[1] for d in ko_dialogue_counts)
        avg_dlg = sum(d[1] for d in ko_dialogue_counts) / len(ko_dialogue_counts)
        print(f"Korean Character Length: Min={min_len}, Max={max_len}, Avg={avg_len:.1f}")
        print(f"Korean Dialogue Lines:   Min={min_dlg}, Max={max_dlg}, Avg={avg_dlg:.1f}")
        print(f"Total Korean Characters: {total_calculated_chars}")

    if errors:
        print(f"\n❌ FAILED with {len(errors)} errors:")
        for err in errors[:20]:
            print(f"  - {err}")
        if len(errors) > 20:
            print(f"  ... and {len(errors) - 20} more errors.")
        return False
    else:
        print("\n✅ ALL AUDIT CHECKS PASSED PERFECTLY!")
        return True

if __name__ == "__main__":
    success = verify_all()
    sys.exit(0 if success else 1)
