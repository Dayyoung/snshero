# -*- coding: utf-8 -*-
"""
scripts/deploy_all_novels.py
Deploys all 40 episodes of the authentic Korean and English web novel.
- Ep 01, 02, 03, 04, 05, 06, 11 Korean files are NEVER OVERWRITTEN (intact).
- Ep 01, 02, 03, 04, 05, 06 English files are NEVER OVERWRITTEN (intact).
- Ep 07-10, 12-40 Korean files deployed to public/book/episode_XX.md.
- Ep 07-40 English files deployed to public/book/image_narrations/english_txt/.
- Updates public/book/index.json with exact character counts and totalCharacters.
"""
import os, sys, json, re

sys.path.insert(0, ".")

import scripts.novel_data.arc1_batch1 as b1
import scripts.novel_data.arc1_batch2 as b2
import scripts.novel_data.arc2_batch3 as b3
import scripts.novel_data.arc3_batch4 as b4
import scripts.novel_data.arc3_batch5 as b5
import scripts.novel_data.arc4_batch6 as b6
import scripts.novel_data.arc4_batch7 as b7
import scripts.novel_data.ep11_en as e11
from scripts.src_content_map import get_en_filename

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BOOK_DIR = os.path.join(BASE_DIR, "public", "book")
EN_DIR = os.path.join(BOOK_DIR, "image_narrations", "english_txt")
INDEX_JSON_PATH = os.path.join(BOOK_DIR, "index.json")

GOLD_STANDARD_KO = [1, 2, 3, 4, 5, 6, 11]
GOLD_STANDARD_EN = [1, 2, 3, 4, 5, 6]

# Build mapping of Korean content
ko_sources = {}
for ep in range(1, 41):
    if ep in GOLD_STANDARD_KO:
        ko_sources[ep] = None # DO NOT TOUCH
    elif 7 <= ep <= 10:
        ko_sources[ep] = getattr(b1, f"EP{ep:02d}_KO")
    elif 12 <= ep <= 16:
        ko_sources[ep] = getattr(b2, f"EP{ep:02d}_KO")
    elif 17 <= ep <= 20:
        ko_sources[ep] = getattr(b3, f"EP{ep:02d}_KO")
    elif 21 <= ep <= 25:
        ko_sources[ep] = getattr(b4, f"EP{ep:02d}_KO")
    elif 26 <= ep <= 30:
        ko_sources[ep] = getattr(b5, f"EP{ep:02d}_KO")
    elif 31 <= ep <= 35:
        ko_sources[ep] = getattr(b6, f"EP{ep:02d}_KO")
    elif 36 <= ep <= 40:
        ko_sources[ep] = b7.DATA[ep]["ko"]

# Build mapping of English content
en_sources = {}
for ep in range(1, 41):
    if ep in GOLD_STANDARD_EN:
        en_sources[ep] = None # DO NOT TOUCH
    elif ep == 11:
        en_sources[ep] = e11.EP11_EN
    elif 7 <= ep <= 10:
        en_sources[ep] = getattr(b1, f"EP{ep:02d}_EN")
    elif 12 <= ep <= 16:
        en_sources[ep] = getattr(b2, f"EP{ep:02d}_EN")
    elif 17 <= ep <= 20:
        en_sources[ep] = getattr(b3, f"EP{ep:02d}_EN")
    elif 21 <= ep <= 25:
        en_sources[ep] = getattr(b4, f"EP{ep:02d}_EN")
    elif 26 <= ep <= 30:
        en_sources[ep] = getattr(b5, f"EP{ep:02d}_EN")
    elif 31 <= ep <= 35:
        en_sources[ep] = getattr(b6, f"EP{ep:02d}_EN")
    elif 36 <= ep <= 40:
        en_sources[ep] = b7.DATA[ep]["en"]

def deploy():
    print("==================================================")
    print("Deploying 40-Episode Authentic Web Novel Remake")
    print("==================================================")

    # 1. Deploy Korean Chapters
    ko_written = 0
    for ep in range(1, 41):
        if ep in GOLD_STANDARD_KO:
            print(f"[KO] Episode {ep:02d} is GOLD STANDARD -> Preserving 100% untouched.")
            continue
        
        content = ko_sources[ep]
        assert content is not None, f"Missing content for KO Ep {ep}"
        out_path = os.path.join(BOOK_DIR, f"episode_{ep:02d}.md")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(content)
        ko_written += 1
        print(f"[KO] Episode {ep:02d} written -> {len(content)} characters.")

    print(f"Total Korean Chapters Written: {ko_written} (7 gold standards preserved).")

    # 2. Deploy English Chapters
    en_written = 0
    for ep in range(1, 41):
        fname = get_en_filename(ep)
        out_path = os.path.join(EN_DIR, fname)
        if ep in GOLD_STANDARD_EN:
            print(f"[EN] Episode {ep:02d} is GOLD STANDARD -> Preserving 100% untouched ({fname}).")
            continue
        
        content = en_sources[ep]
        assert content is not None, f"Missing content for EN Ep {ep}"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(content)
        en_written += 1
        print(f"[EN] Episode {ep:02d} written -> {len(content)} characters ({fname}).")

    print(f"Total English Chapters Written: {en_written} (6 gold standards preserved).")

    # 3. Synchronize public/book/index.json
    with open(INDEX_JSON_PATH, "r", encoding="utf-8") as f:
        index_data = json.load(f)

    total_chars = 0
    for ep_entry in index_data["episodes"]:
        ep_num = ep_entry["episodeNumber"]
        ko_file = os.path.join(BOOK_DIR, f"episode_{ep_num:02d}.md")
        with open(ko_file, "r", encoding="utf-8") as f:
            content = f.read()
        c_len = len(content)
        ep_entry["characterCount"] = c_len
        total_chars += c_len

    index_data["totalCharacters"] = total_chars

    with open(INDEX_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print(f"\n[Metadata] index.json synchronized! Total Characters: {total_chars}")
    print("==================================================")
    print("Deployment completed successfully!")
    print("==================================================")

if __name__ == "__main__":
    deploy()
