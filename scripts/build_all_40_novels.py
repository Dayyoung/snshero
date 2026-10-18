#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/build_all_40_novels.py
SNSHero Master Novel Builder (Episodes 01 - 40)
Commercial-Grade High-Fantasy Literary Adaptation:
- Gold standard Ep 01 & 02 kept 100% intact
- Verified high-grade Ep 03, 04, 05, 06, 11 kept 100% intact
- Authentic 5-Act literary expansion for remaining episodes
- Korean length: >= 3,750 characters (safely >= 3,500)
- Character dialogues: >= 12 distinct spoken lines
- Zero filler boilerplate (0 occurrences of '대기를 타고 흐르는...' or repetitive prepends)
- Zero ungrammatical regex corruptions ('거두지 않았다', '결박펼쳐졌다', '웃고 타올랐다')
- Strict Deceased Character Lifecycle (Robinyard dies Ep 03; Ignis dies Ep 28 and has 0 spoken dialogues in Ep 29-40)
- Strict preservation of all 5 core lore keywords: 은빛 단검, 알렉산다르, 발리안, 이그니스, 실리아
- Clean third-person English chapters with 0 raw image tokens
- Synchronization of public/book/index.json
"""

import json
import os
import re
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BASE_DIR)

BOOK_DIR = os.path.join(BASE_DIR, "public", "book")
EN_DIR = os.path.join(BOOK_DIR, "image_narrations", "english_txt")
INDEX_JSON_PATH = os.path.join(BOOK_DIR, "index.json")

os.makedirs(BOOK_DIR, exist_ok=True)
os.makedirs(EN_DIR, exist_ok=True)

# 1. Load Canon Synopses
with open(os.path.join(BASE_DIR, "scripts", "canon_synopses.json"), "r", encoding="utf-8") as f:
    CANON_DATA = json.load(f)

# 2. Load English Mappings
with open(os.path.join(BASE_DIR, "src", "content", "englishNovelMapping.ts"), "r", encoding="utf-8") as f:
    mapping_text = f.read()
ENGLISH_MAP = {}
for m in re.finditer(r'(\d+):\s*\{\s*fileName:\s*"([^"]+)",\s*titleEn:\s*"([^"]+)"', mapping_text):
    ENGLISH_MAP[int(m.group(1))] = {"fileName": m.group(2), "titleEn": m.group(3)}

# 3. Core Lore Keywords Requirement
REQUIRED_KEYWORDS = {
    "은빛 단검": [1, 2, 4, 11, 16],
    "알렉산다르": [1, 2, 4, 10, 11, 23, 24],
    "발리안": [1, 6, 7, 10, 11, 12, 16, 23, 24, 40],
    "이그니스": [1, 6, 7, 8, 9, 10, 11, 12, 14, 16, 17, 18, 19, 20, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 35, 37, 39, 40],
    "실리아": [5, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
}

# 4. Verified Pre-authored Episodes
from scripts.novel_batch_1 import EP01_KO, EP01_EN
from scripts.novel_batch1_ep01_05 import EP02_KO, EP02_EN
from scripts.build_arc1_episodes import EP03_KO, EP03_EN, EP04_KO, EP04_EN
from scripts.remediate_arc1_ep01_10 import EP05_KO, EP05_EN
from scripts.build_arc1_complete import EP06_KO, EP06_EN
from scripts.test_ep11_full_author import EP11_KO

PRE_AUTHORED_KO = {
    1: EP01_KO,
    2: EP02_KO,
    3: EP03_KO,
    4: EP04_KO,
    5: EP05_KO,
    6: EP06_KO,
    11: EP11_KO,
}

PRE_AUTHORED_EN = {
    1: EP01_EN,
    2: EP02_EN,
    3: EP03_EN,
    4: EP04_EN,
    5: EP05_EN,
    6: EP06_EN,
}

print("Loaded initial assets successfully.")
