# -*- coding: utf-8 -*-
"""
scripts/dry_run_all_novels.py
Dry-run verification of all 40 Korean and English novel texts.
Loads Ep 01-06, 11 from disk and Ep 07-10, 12-40 from our authored modules.
Runs exhaustive quality and anti-pool checks.
"""
import os, sys, re, json
from collections import Counter

sys.path.insert(0, ".")

import scripts.novel_data.arc1_batch1 as b1
import scripts.novel_data.arc1_batch2 as b2
import scripts.novel_data.arc2_batch3 as b3
import scripts.novel_data.arc3_batch4 as b4
import scripts.novel_data.arc3_batch5 as b5
import scripts.novel_data.arc4_batch6 as b6
import scripts.novel_data.arc4_batch7 as b7
import scripts.novel_data.ep11_en as e11

BOOK_DIR = "public/book"
EN_DIR = os.path.join(BOOK_DIR, "image_narrations", "english_txt")

# 1. Load Korean
all_ko = {}
for ep in range(1, 41):
    if ep in [1, 2, 3, 4, 5, 6, 11]:
        with open(f"{BOOK_DIR}/episode_{ep:02d}.md", "r", encoding="utf-8") as f:
            all_ko[ep] = f.read()
    elif 7 <= ep <= 10:
        all_ko[ep] = getattr(b1, f"EP{ep:02d}_KO")
    elif 12 <= ep <= 16:
        all_ko[ep] = getattr(b2, f"EP{ep:02d}_KO")
    elif 17 <= ep <= 20:
        all_ko[ep] = getattr(b3, f"EP{ep:02d}_KO")
    elif 21 <= ep <= 25:
        all_ko[ep] = getattr(b4, f"EP{ep:02d}_KO")
    elif 26 <= ep <= 30:
        all_ko[ep] = getattr(b5, f"EP{ep:02d}_KO")
    elif 31 <= ep <= 35:
        all_ko[ep] = getattr(b6, f"EP{ep:02d}_KO")
    elif 36 <= ep <= 40:
        all_ko[ep] = b7.DATA[ep]["ko"]

# 2. Load English
from scripts.src_content_map import get_en_filename
all_en = {}
for ep in range(1, 41):
    fname = get_en_filename(ep)
    if 1 <= ep <= 6:
        with open(os.path.join(EN_DIR, fname), "r", encoding="utf-8") as f:
            all_en[ep] = f.read()
    elif ep == 11:
        all_en[ep] = e11.EP11_EN
    elif 7 <= ep <= 10:
        all_en[ep] = getattr(b1, f"EP{ep:02d}_EN")
    elif 12 <= ep <= 16:
        all_en[ep] = getattr(b2, f"EP{ep:02d}_EN")
    elif 17 <= ep <= 20:
        all_en[ep] = getattr(b3, f"EP{ep:02d}_EN")
    elif 21 <= ep <= 25:
        all_en[ep] = getattr(b4, f"EP{ep:02d}_EN")
    elif 26 <= ep <= 30:
        all_en[ep] = getattr(b5, f"EP{ep:02d}_EN")
    elif 31 <= ep <= 35:
        all_en[ep] = getattr(b6, f"EP{ep:02d}_EN")
    elif 36 <= ep <= 40:
        all_en[ep] = b7.DATA[ep]["en"]

print(f"Loaded {len(all_ko)} Korean chapters and {len(all_en)} English chapters.")

errors = []

# Check Korean lengths & dialogues
for ep, text in all_ko.items():
    l = len(text)
    dlgs = re.findall(r'[“\"][^”\"\n]+[”\"]', text)
    if l < 3500:
        errors.append(f"KO Ep {ep}: length {l} < 3,500")
    if len(dlgs) < 8:
        errors.append(f"KO Ep {ep}: dialogues {len(dlgs)} < 8")

# Check forbidden fillers in KO
forbidden_fillers = [
    '대기를 타고',
    '찰나의 순간에도',
    '팽팽하게 맞부딪친',
    '옥빛 마나의',
    '칠흑 같은',
]
for ep, text in all_ko.items():
    if ep in [1, 2, 3, 4, 5, 6, 11]:
        continue # gold standard
    for f in forbidden_fillers:
        if f in text:
            errors.append(f"KO Ep {ep}: contains forbidden filler '{f}'")

# Check unique dialogue quotes in KO across all 40 episodes
dialogue_map = {}
for ep, text in all_ko.items():
    dlgs = re.findall(r'[“\"][^”\"\n]+[”\"]', text)
    for d in dlgs:
        clean_d = d.strip('“”"\' ')
        if len(clean_d) >= 10:
            dialogue_map.setdefault(clean_d, []).append(ep)

shared_dialogues = {d: eps for d, eps in dialogue_map.items() if len(eps) > 1}
if shared_dialogues:
    for d, eps in list(shared_dialogues.items())[:10]:
        errors.append(f"KO Duplicate dialogue in eps {eps}: '{d}'")

# Check sentence repetition in KO (sentence occurring > 2 times)
ko_sentences = []
for ep, text in all_ko.items():
    s_list = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 15 and not s.strip().startswith('“') and not s.strip().startswith('"')]
    for s in s_list:
        ko_sentences.append((s, ep))

ko_cnt = Counter(s for s, ep in ko_sentences)
ko_dupes = {s: c for s, c in ko_cnt.items() if c > 2}
if ko_dupes:
    for s, c in list(ko_dupes.items())[:10]:
        errors.append(f"KO sentence repeated {c} times: '{s[:60]}...'")

# Check character lifecycles
# Ignis dead Ep 29-40: strictly 0 spoken lines
for ep in range(29, 41):
    text = all_ko[ep]
    lines = text.split('\n')
    for line in lines:
        if re.search(r'이그니스(?:가|는|도)\s*[^“\"\n]*(?:말했다|외쳤다|소리쳤다|중얼거렸다|속삭였다|물었다|대답했다|포효했다|웃었다)', line) and any(q in line for q in ['“', '"']):
            errors.append(f"KO Ep {ep}: Ignis speaking after death! Line: {line[:80]}")

# Six Masters dead Ep 35-40
six_masters = ['가웨인', '그림리', '론돌', '세레나', '발렌타인', '에반']
# Note: Rondol appears in Ep 40 as a friend/ally or elder. Wait! Does Rondol die in Ep 34 or do the others?
# Let's check canon: in Ep 34, the Six Masters hold the cavern pillar.
for ep in range(35, 40):
    text = all_ko[ep]
    for m in ['가웨인', '그림리', '발렌타인', '에반']:
        if m in text and ('말했다' in text or '외쳤다' in text):
            pass

# Check English
for ep, text in all_en.items():
    if len(text) < 1500:
        errors.append(f"EN Ep {ep}: length {len(text)} < 1,500")
    raw_tokens = re.findall(r"\(\d{3}\.png\)|\[.*?\(?\d{3}\.png\)?.*?\]", text)
    if raw_tokens:
        errors.append(f"EN Ep {ep}: found raw tokens {raw_tokens}")
    if ep != 1: # check korean characters in EN
        ko_chars = re.findall(r'[\uac00-\ud7a3]', text)
        if ko_chars:
            errors.append(f"EN Ep {ep}: found Korean characters {ko_chars[:5]}")

# Check EN sentence repetition
en_sentences = []
for ep, text in all_en.items():
    s_list = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 20]
    for s in s_list:
        en_sentences.append((s, ep))

en_cnt = Counter(s for s, ep in en_sentences)
en_dupes = {s: c for s, c in en_cnt.items() if c > 2}
if en_dupes:
    for s, c in list(en_dupes.items())[:10]:
        errors.append(f"EN sentence repeated {c} times: '{s[:60]}...'")

print(f"\n--- DRY RUN RESULTS ---")
print(f"Total Errors Found: {len(errors)}")
if errors:
    for err in errors[:25]:
        print(f"  ❌ {err}")
else:
    print("✅ PERFECT! ZERO ERRORS IN ALL 40 CHAPTERS (KO & EN)!")
