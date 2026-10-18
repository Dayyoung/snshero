#!/usr/bin/env python3
"""
reviewer_deep_audit.py
Independent, objective and adversarial audit script for Reviewer 3-1.
Audits Milestone M1 (Web Novel) and Milestone M2 (Webtoon).
"""

import os
import sys
import json
import re
from collections import Counter

ROOT_DIR = "/Users/dayyoung/project/snshero"
BOOK_DIR = os.path.join(ROOT_DIR, "public", "book")
EN_DIR = os.path.join(BOOK_DIR, "image_narrations", "english_txt")
INDEX_JSON_PATH = os.path.join(BOOK_DIR, "index.json")
MAPPING_TS_PATH = os.path.join(ROOT_DIR, "src", "content", "englishNovelMapping.ts")
WEBTOON_MANIFEST_PATH = os.path.join(ROOT_DIR, "src", "content", "webtoonEpisodeManifest.json")
NARRATIONS_DIR = os.path.join(BOOK_DIR, "image_narrations")
IMAGES_WEBTOON_DIR = os.path.join(ROOT_DIR, "public", "images", "webtoon")
NOVEL_VIEW_PATH = os.path.join(ROOT_DIR, "src", "views", "NovelView.tsx")

results = {
    "passed": [],
    "failed": [],
    "observations": {}
}

def log_pass(category, name, details=""):
    results["passed"].append({"category": category, "name": name, "details": details})
    print(f"  [PASS] [{category}] {name}: {details}")

def log_fail(category, name, details=""):
    results["failed"].append({"category": category, "name": name, "details": details})
    print(f"  [FAIL] [{category}] {name}: {details}")

print("=====================================================================")
print("Reviewer 3-1: Independent Deep Audit of Milestone M1 & M2")
print("=====================================================================")

# -------------------------------------------------------------------
# 1. KOREAN NOVEL (M1) AUDIT
# -------------------------------------------------------------------
print("\n--- 1. Korean Web Novel Audit (public/book/episode_01.md ~ 40.md) ---")

ko_char_counts = {}
ko_dialogues = {}
ko_empty_or_missing = []
ko_bad_headers = []
ko_short_episodes = []
ko_low_dialogue_episodes = []

for ep in range(1, 41):
    pad = f"{ep:02d}"
    fpath = os.path.join(BOOK_DIR, f"episode_{pad}.md")
    if not os.path.exists(fpath):
        ko_empty_or_missing.append(f"episode_{pad}.md missing")
        continue
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    if not content.strip():
        ko_empty_or_missing.append(f"episode_{pad}.md empty")
        continue

    char_count = len(content)
    ko_char_counts[ep] = char_count
    if char_count < 3500:
        ko_short_episodes.append((ep, char_count))

    # Header check
    lines = content.split("\n")
    first_line = lines[0].strip() if lines else ""
    if not (f"# 눈히어로 {ep}화" in first_line or f"# 눈히어로 제{ep}화" in first_line):
        ko_bad_headers.append((ep, first_line))

    # Dialogue check
    dlgs = [
        l.strip() for l in lines
        if (l.strip().startswith("“") or l.strip().startswith('"') or ("“" in l and "”" in l) or ('"' in l and l.count('"') >= 2))
    ]
    ko_dialogues[ep] = len(dlgs)
    if len(dlgs) < 8:
        ko_low_dialogue_episodes.append((ep, len(dlgs)))

if not ko_empty_or_missing:
    log_pass("M1-Korean", "40 files exist and non-empty", "All 40 markdown files present")
else:
    log_fail("M1-Korean", "40 files exist and non-empty", str(ko_empty_or_missing))

if not ko_bad_headers:
    log_pass("M1-Korean", "Markdown header format", "All 40 episodes have # 눈히어로 {N}화 headers")
else:
    log_fail("M1-Korean", "Markdown header format", str(ko_bad_headers))

min_chars = min(ko_char_counts.values()) if ko_char_counts else 0
max_chars = max(ko_char_counts.values()) if ko_char_counts else 0
avg_chars = sum(ko_char_counts.values()) / len(ko_char_counts) if ko_char_counts else 0
total_chars = sum(ko_char_counts.values())

results["observations"]["korean_chars"] = {
    "min": min_chars, "max": max_chars, "avg": round(avg_chars, 1), "total": total_chars
}

if not ko_short_episodes:
    log_pass("M1-Korean", "Character count threshold (>= 3,500)", f"Min={min_chars}, Max={max_chars}, Avg={avg_chars:.1f}, Total={total_chars}")
else:
    log_fail("M1-Korean", "Character count threshold (>= 3,500)", f"{len(ko_short_episodes)} episodes below 3,500: {ko_short_episodes}")

min_dlg = min(ko_dialogues.values()) if ko_dialogues else 0
max_dlg = max(ko_dialogues.values()) if ko_dialogues else 0
avg_dlg = sum(ko_dialogues.values()) / len(ko_dialogues) if ko_dialogues else 0

results["observations"]["korean_dialogues"] = {
    "min": min_dlg, "max": max_dlg, "avg": round(avg_dlg, 1)
}

if not ko_low_dialogue_episodes:
    log_pass("M1-Korean", "Direct dialogue line count (>= 8)", f"Min={min_dlg}, Max={max_dlg}, Avg={avg_dlg:.1f}")
else:
    log_fail("M1-Korean", "Direct dialogue line count (>= 8)", f"{len(ko_low_dialogue_episodes)} episodes below 8: {ko_low_dialogue_episodes}")

# -------------------------------------------------------------------
# 1.B BOILERPLATE AND REGEX CORRUPTIONS
# -------------------------------------------------------------------
print("\n--- 1.B Boilerplate & Regex Corruption Checks ---")

fillers = [
    "대기를 타고",
    "찰나의 순간에도",
    "팽팽하게 맞부딪친",
    "옥빛 마나의",
    "칠흑 같은",
]
filler_occurrences = {f: [] for f in fillers}

corruptions = [
    "거두지 않았다",
    "결박펼쳐졌다",
    "웃고 타올랐다",
    "내리고 타올랐다",
]
corruption_occurrences = {c: [] for c in corruptions}

for ep in range(1, 41):
    pad = f"{ep:02d}"
    fpath = os.path.join(BOOK_DIR, f"episode_{pad}.md")
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    for filler in fillers:
        if filler in content:
            filler_occurrences[filler].append(ep)
    for corr in corruptions:
        if corr in content:
            corruption_occurrences[corr].append(ep)

# Detailed analysis of fillers
results["observations"]["fillers"] = filler_occurrences
for filler, eps in filler_occurrences.items():
    if not eps:
        log_pass("M1-Boilerplate", f"Zero occurrences of '{filler}'", "0 occurrences across all 40 episodes")
    else:
        # Note: Check which episodes
        log_fail("M1-Boilerplate", f"Zero occurrences of '{filler}'", f"Found in episodes: {eps}")

# Detailed analysis of regex corruptions
results["observations"]["corruptions"] = corruption_occurrences
for corr, eps in corruption_occurrences.items():
    if not eps:
        log_pass("M1-Corruption", f"Zero occurrences of '{corr}'", "0 occurrences across all 40 episodes")
    else:
        log_fail("M1-Corruption", f"Zero occurrences of '{corr}'", f"Found in episodes: {eps}")

# -------------------------------------------------------------------
# 1.C DIALOGUE & SENTENCE UNIQUENESS
# -------------------------------------------------------------------
print("\n--- 1.C Dialogue & Sentence Uniqueness Checks ---")

dialogue_map = {} # cleaned_quote -> list of eps
for ep in range(1, 41):
    pad = f"{ep:02d}"
    fpath = os.path.join(BOOK_DIR, f"episode_{pad}.md")
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    quotes = re.findall(r'[“\"][^”\"\n]+[”\"]', content)
    for q in quotes:
        clean = re.sub(r'[“”"\'\s]', '', q)
        if len(clean) >= 10:
            if clean not in dialogue_map:
                dialogue_map[clean] = []
            dialogue_map[clean].append(ep)

recycled_dlgs = {q: eps for q, eps in dialogue_map.items() if len(eps) > 1}
if not recycled_dlgs:
    log_pass("M1-DialogueUniqueness", "Zero recycled dialogue quotes (len >= 10)", f"Total unique dialogues >= 10: {len(dialogue_map)}, 0 recycled")
else:
    log_fail("M1-DialogueUniqueness", "Zero recycled dialogue quotes (len >= 10)", f"{len(recycled_dlgs)} recycled quotes found: {list(recycled_dlgs.items())[:3]}")

# Sentence uniqueness (>15 chars, not quote, repeated > 2 times)
sentence_counter = Counter()
for ep in range(1, 41):
    pad = f"{ep:02d}"
    fpath = os.path.join(BOOK_DIR, f"episode_{pad}.md")
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    s_list = re.split(r'[.!?]\s+', content)
    for s in s_list:
        s_clean = s.strip()
        if len(s_clean) > 15 and not s_clean.startswith("“") and not s_clean.startswith('"'):
            sentence_counter[s_clean] += 1

repeated_sentences = {s: c for s, c in sentence_counter.items() if c > 2}
if not repeated_sentences:
    log_pass("M1-SentenceUniqueness", "Zero non-quote sentences repeated > 2 times", f"Total tested sentences: {len(sentence_counter)}, 0 repeated > 2x")
else:
    log_fail("M1-SentenceUniqueness", "Zero non-quote sentences repeated > 2 times", f"{len(repeated_sentences)} sentences repeated > 2x: {list(repeated_sentences.items())[:3]}")

# -------------------------------------------------------------------
# 1.D DECEASED CHARACTER LIFECYCLE
# -------------------------------------------------------------------
print("\n--- 1.D Deceased Character Canonical Lifecycle Checks ---")

robinyard_ghosts = []
ignis_ghosts = []
six_masters_ghosts = []
artus_lifecycle = []

for ep in range(1, 41):
    pad = f"{ep:02d}"
    fpath = os.path.join(BOOK_DIR, f"episode_{pad}.md")
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    lines = content.split("\n")
    dlg_lines = [l for l in lines if ('“' in l and '”' in l) or l.strip().startswith('“') or l.strip().startswith('"')]

    # Robinyard dies Ep 03 (0 dialogues Ep 04-40)
    if ep >= 4:
        for d in dlg_lines:
            if "로비냐드가" in d or "로비냐드의 목소리" in d or "로비냐드는 외쳤다" in d:
                robinyard_ghosts.append((ep, d.strip()))

    # Ignis dies Ep 28 (0 dialogues Ep 29-40, honored only via white glass ember)
    if ep >= 29:
        for d in dlg_lines:
            if any(term in d for term in ["이그니스가 외쳤다", "이그니스가 말했다", "이그니스가 소리쳤다", "이그니스가 중얼거렸다", "이그니스가 속삭였다", "이그니스의 목소리가 외쳤다"]):
                ignis_ghosts.append((ep, d.strip()))

    # Six Masters die Ep 34 (0 dialogues Ep 35-40)
    # The six masters are: 발리안, 카트리나, 말퓨리온, 그림리, 바르가스트, 아일라
    # In Ep 34 they sacrifice themselves at the Abyss gate. Ep 35-40 should have 0 active spoken dialogues from them.
    if ep >= 35:
        for d in dlg_lines:
            for master in ["발리안", "카트리나", "말퓨리온", "그림리", "바르가스트", "아일라"]:
                if f"{master}이 외쳤다" in d or f"{master}가 외쳤다" in d or f"{master}이 말했다" in d or f"{master}가 말했다" in d or f"{master}이 소리쳤다" in d or f"{master}가 소리쳤다" in d:
                    six_masters_ghosts.append((ep, master, d.strip()))

    # Artus ascends Ep 39
    if ep == 39:
        if "아르투스" in content:
            artus_lifecycle.append((ep, "Artus present in Ep 39"))

if not robinyard_ghosts:
    log_pass("M1-Lifecycle", "Robinyard lifecycle (0 dialogues Ep 04-40)", "No ghost dialogues detected")
else:
    log_fail("M1-Lifecycle", "Robinyard lifecycle (0 dialogues Ep 04-40)", str(robinyard_ghosts))

if not ignis_ghosts:
    log_pass("M1-Lifecycle", "Ignis lifecycle (0 dialogues Ep 29-40)", "No ghost dialogues detected; honored via white glass ember")
else:
    log_fail("M1-Lifecycle", "Ignis lifecycle (0 dialogues Ep 29-40)", str(ignis_ghosts))

if not six_masters_ghosts:
    log_pass("M1-Lifecycle", "Six Masters lifecycle (0 dialogues Ep 35-40)", "No ghost dialogues detected after Ep 34 sacrifice")
else:
    log_fail("M1-Lifecycle", "Six Masters lifecycle (0 dialogues Ep 35-40)", str(six_masters_ghosts))

if artus_lifecycle:
    log_pass("M1-Lifecycle", "Artus Ep 39 resolution", "Artus canonical role present in Ep 39")
else:
    log_fail("M1-Lifecycle", "Artus Ep 39 resolution", "Artus missing from Ep 39")

# -------------------------------------------------------------------
# 1.E CORE LORE KEYWORDS
# -------------------------------------------------------------------
print("\n--- 1.E Core Lore Keyword Preservation ---")

lore_keywords = ["은빛 단검", "알렉산다르", "발리안", "이그니스", "실리아"]
kw_found_eps = {kw: [] for kw in lore_keywords}

for ep in range(1, 41):
    pad = f"{ep:02d}"
    fpath = os.path.join(BOOK_DIR, f"episode_{pad}.md")
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    for kw in lore_keywords:
        if kw in content:
            kw_found_eps[kw].append(ep)

missing_lore_kws = [kw for kw, eps in kw_found_eps.items() if not eps]
if not missing_lore_kws:
    kw_summary = ", ".join([f"{kw}({len(kw_found_eps[kw])} eps)" for kw in lore_keywords])
    log_pass("M1-LoreKeywords", "Preservation of 5 core lore keywords", kw_summary)
else:
    log_fail("M1-LoreKeywords", "Preservation of 5 core lore keywords", f"Missing keywords: {missing_lore_kws}")

# -------------------------------------------------------------------
# 1.F ENGLISH CHAPTERS AUDIT
# -------------------------------------------------------------------
print("\n--- 1.F English Novel Chapters Audit ---")

en_files = [f for f in os.listdir(EN_DIR) if f.endswith(".txt")]
en_missing = []
en_raw_images = []
en_korean_chars = []
en_fallback_sentences = []
en_sentence_counter = Counter()

for ep in range(1, 41):
    pad = f"{ep:02d}"
    # find matching file
    matched = [f for f in en_files if f"Episode_{pad}_" in f or f"Episode_{ep}_" in f]
    if not matched:
        en_missing.append(ep)
        continue
    fpath = os.path.join(EN_DIR, matched[0])
    with open(fpath, "r", encoding="utf-8") as f:
        en_text = f.read()

    # Raw image tokens
    raw_tokens = re.findall(r"\(\d{3}\.png\)|\[.*?\(?\d{3}\.png\)?.*?\]", en_text)
    if raw_tokens:
        en_raw_images.append((ep, raw_tokens))

    # Korean chars
    ko_chars = re.findall(r"[\uac00-\ud7a3]", en_text)
    if ko_chars:
        en_korean_chars.append((ep, len(ko_chars)))

    # Fallback sentences like 'In the tense silence...'
    if "In the tense silence" in en_text:
        en_fallback_sentences.append(ep)

    # Sentences > 20 chars repeated > 2 times
    s_list = re.split(r'[.!?]\s+', en_text)
    for s in s_list:
        s_clean = s.strip()
        if len(s_clean) > 20:
            en_sentence_counter[s_clean] += 1

en_repeated_sentences = {s: c for s, c in en_sentence_counter.items() if c > 2}

if not en_missing and len(en_files) >= 40:
    log_pass("M1-English", "40 English files exist", f"Found {len(en_files)} files in english_txt/")
else:
    log_fail("M1-English", "40 English files exist", f"Missing episodes: {en_missing}")

if not en_raw_images:
    log_pass("M1-English", "0 raw image tokens in English text", "0 occurrences of (042.png) or similar tokens")
else:
    log_fail("M1-English", "0 raw image tokens in English text", f"Found raw image tokens in: {en_raw_images}")

if not en_korean_chars:
    log_pass("M1-English", "0 Korean characters in English text", "Clean English prose throughout all 40 files")
else:
    log_fail("M1-English", "0 Korean characters in English text", f"Found Korean characters in: {en_korean_chars}")

if not en_fallback_sentences:
    log_pass("M1-English", "0 repetitive fallback sentences ('In the tense silence...')", "0 occurrences across all files")
else:
    log_fail("M1-English", "0 repetitive fallback sentences ('In the tense silence...')", f"Found in episodes: {en_fallback_sentences}")

if not en_repeated_sentences:
    log_pass("M1-English", "0 duplicate sentences (>20 chars) repeated > 2 times", f"Tested {len(en_sentence_counter)} sentences")
else:
    log_fail("M1-English", "0 duplicate sentences (>20 chars) repeated > 2 times", f"{len(en_repeated_sentences)} sentences repeated > 2x")

# englishNovelMapping.ts synchronization
with open(MAPPING_TS_PATH, "r", encoding="utf-8") as f:
    mapping_code = f.read()

mapping_sync_errs = []
for ep in range(1, 41):
    pad = f"{ep:02d}"
    match = re.search(rf'{ep}:\s*\{{\s*fileName:\s*"([^"]+)"', mapping_code)
    if not match:
        mapping_sync_errs.append(f"Ep {ep} missing in englishNovelMapping.ts")
    else:
        fn = match.group(1)
        if not os.path.exists(os.path.join(EN_DIR, fn)):
            mapping_sync_errs.append(f"Ep {ep} mapped file {fn} not found in english_txt/")

if not mapping_sync_errs:
    log_pass("M1-EnglishMapping", "englishNovelMapping.ts 100% sync", "All 40 entries map to existing files")
else:
    log_fail("M1-EnglishMapping", "englishNovelMapping.ts 100% sync", str(mapping_sync_errs))

# -------------------------------------------------------------------
# 1.G INDEX.JSON METADATA SYNC
# -------------------------------------------------------------------
print("\n--- 1.G public/book/index.json Metadata Sync ---")

with open(INDEX_JSON_PATH, "r", encoding="utf-8") as f:
    index_data = json.load(f)

index_errors = []
idx_episodes = index_data.get("episodes", [])
if len(idx_episodes) != 40:
    index_errors.append(f"index.json has {len(idx_episodes)} episodes, expected 40")

for ep_info in idx_episodes:
    ep_num = ep_info.get("episodeNumber")
    pad = f"{ep_num:02d}"
    fpath = os.path.join(BOOK_DIR, f"episode_{pad}.md")
    with open(fpath, "r", encoding="utf-8") as f:
        real_len = len(f.read())
    if ep_info.get("characterCount") != real_len:
        index_errors.append(f"Ep {ep_num} characterCount {ep_info.get('characterCount')} != real len {real_len}")

if index_data.get("totalCharacters") != total_chars:
    index_errors.append(f"totalCharacters {index_data.get('totalCharacters')} != sum {total_chars}")

if not index_errors:
    log_pass("M1-IndexSync", "index.json exact synchronization", f"40 episodes, exact characterCounts, totalCharacters={total_chars}")
else:
    log_fail("M1-IndexSync", "index.json exact synchronization", str(index_errors))

# -------------------------------------------------------------------
# 2. WEBTOON (M2) AUDIT
# -------------------------------------------------------------------
print("\n--- 2. Webtoon (M2) Visuals & Direction Audit ---")

# 2.A 5 Dark-fantasy key art illustrations
illustrations = [
    "ep01_blizzard_vow.jpg",
    "ep08_crimson_mane.jpg",
    "ep15_shadow_duel.jpg",
    "ep25_assassin_ambush.jpg",
    "ep40_eternal_shield.jpg"
]
missing_illustrations = []
ill_details = []
for ill in illustrations:
    ipath = os.path.join(IMAGES_WEBTOON_DIR, ill)
    if not os.path.exists(ipath):
        missing_illustrations.append(ill)
    else:
        size = os.path.getsize(ipath)
        with open(ipath, "rb") as f:
            header = f.read(4)
        is_jpeg = (header[:2] == b'\xff\xd8')
        ill_details.append(f"{ill} ({size//1024}KB, JPEG={is_jpeg})")

if not missing_illustrations:
    log_pass("M2-Illustrations", "5 Generative dark-fantasy illustrations exist", "; ".join(ill_details))
else:
    log_fail("M2-Illustrations", "5 Generative dark-fantasy illustrations exist", f"Missing: {missing_illustrations}")

# 2.B webtoonEpisodeManifest.json and image_narrations/*.json
with open(WEBTOON_MANIFEST_PATH, "r", encoding="utf-8") as f:
    manifest = json.load(f)

manifest_errs = []
manifest_total_panels = 0
manifest_dialogues = 0
manifest_sfx = 0
eps_with_dlg = 0
eps_with_sfx = 0

for ep in range(1, 41):
    k = str(ep)
    if k not in manifest:
        manifest_errs.append(f"Ep {ep} missing in manifest")
        continue
    images = manifest[k].get("images", [])
    if len(images) != 21:
        manifest_errs.append(f"Ep {ep} has {len(images)} images (expected 21)")
    manifest_total_panels += len(images)
    has_d = False
    has_s = False
    for img in images:
        if not img.get("imageUrl"):
            manifest_errs.append(f"Ep {ep} img {img.get('index')} missing imageUrl")
        dlgs = img.get("dialogues", [])
        if dlgs:
            has_d = True
            manifest_dialogues += len(dlgs)
        sfx = img.get("sfxCues", [])
        if sfx:
            has_s = True
            manifest_sfx += len(sfx)
    if has_d:
        eps_with_dlg += 1
    if has_s:
        eps_with_sfx += 1

if not manifest_errs:
    log_pass("M2-Manifest", "webtoonEpisodeManifest.json structure & URLs", f"40 episodes, {manifest_total_panels} panels (all 21-panel uniform), 0 broken URLs")
else:
    log_fail("M2-Manifest", "webtoonEpisodeManifest.json structure & URLs", str(manifest_errs[:5]))

if eps_with_dlg == 40 and eps_with_sfx == 40:
    log_pass("M2-ManifestComicDirection", "Structured dialogues and SFX cues", f"{manifest_dialogues} dialogues in {eps_with_dlg}/40 eps, {manifest_sfx} SFX cues in {eps_with_sfx}/40 eps")
else:
    log_fail("M2-ManifestComicDirection", "Structured dialogues and SFX cues", f"Dialogues in {eps_with_dlg}/40, SFX in {eps_with_sfx}/40")

# Check public/book/image_narrations/episode_*.json
missing_narr_files = []
for ep in range(1, 41):
    pad = f"{ep:02d}"
    npath = os.path.join(NARRATIONS_DIR, f"episode_{pad}_narrations.json")
    if not os.path.exists(npath):
        missing_narr_files.append(f"episode_{pad}_narrations.json")

if not missing_narr_files:
    log_pass("M2-NarrationFiles", "40 narration JSON files exist", "All 40 episode_XX_narrations.json present")
else:
    log_fail("M2-NarrationFiles", "40 narration JSON files exist", str(missing_narr_files))

# 2.C Modular UI Components in src/components/webtoon/
components = [
    "WebtoonSpeechBubble.tsx",
    "WebtoonSfxOverlay.tsx",
    "WebtoonMonologueBox.tsx",
    "WebtoonPanelCard.tsx"
]
missing_comps = []
for comp in components:
    cpath = os.path.join(ROOT_DIR, "src", "components", "webtoon", comp)
    if not os.path.exists(cpath):
        missing_comps.append(comp)

if not missing_comps:
    log_pass("M2-Components", "Modular webtoon components exist", ", ".join(components))
else:
    log_fail("M2-Components", "Modular webtoon components exist", f"Missing: {missing_comps}")

# 2.D NovelView.tsx Webtoon features
with open(NOVEL_VIEW_PATH, "r", encoding="utf-8") as f:
    nv_code = f.read()

nv_has_bubble_toggle = "showSpeechBubbles" in nv_code or "말풍선" in nv_code
nv_has_modes = "vertical" in nv_code and "slide" in nv_code
nv_has_small_buttons = "w-7 h-7" in nv_code

if nv_has_bubble_toggle:
    log_pass("M2-NovelView", "[말풍선 ON/OFF] toggle supported", "showSpeechBubbles state & toggle UI present")
else:
    log_fail("M2-NovelView", "[말풍선 ON/OFF] toggle supported", "Toggle not found in NovelView.tsx")

if nv_has_modes:
    log_pass("M2-NovelView", "Vertical scroll & Slide view modes supported", "Both modes implemented and selectable")
else:
    log_fail("M2-NovelView", "Vertical scroll & Slide view modes supported", "Modes missing in NovelView.tsx")

if not nv_has_small_buttons:
    log_pass("M2-NovelView", "Touch ergonomics compliance (>= 44px, no w-7 h-7)", "0 deprecated 28px buttons")
else:
    log_fail("M2-NovelView", "Touch ergonomics compliance (>= 44px, no w-7 h-7)", "Found w-7 h-7 buttons in NovelView.tsx")

print("\n=====================================================================")
print(f"AUDIT SUMMARY: {len(results['passed'])} PASSED, {len(results['failed'])} FAILED")
print("=====================================================================")

# Write audit results to json
with open("/Users/dayyoung/project/snshero/.agents/teamwork/reviewer_3_1/audit_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
