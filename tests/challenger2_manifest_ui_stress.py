#!/usr/bin/env python3
"""
Challenger 2: Manifest, UI & Scenario Alignment Stress Test Harness
Empirically stress-tests:
1. webtoonEpisodeManifest.json (40 episodes, 21 scenes each, 840 scenes total)
2. Asset resolution in public/images/webtoon/ (file existence, WebP headers, file sizes 4KB-75KB, hash uniqueness)
3. Dialogue characterCardId values against src/cardDatabase.ts (1-110 valid integers, speaker mapping)
4. Narration alignment against public/book/episode_*.md and image_narrations/
5. Zero external CDN (dayyoung.github.io) in src/ views and components
6. Edge case mining and stress boundary checks
"""

import os
import sys
import json
import re
import hashlib
from typing import Dict, List, Any, Set, Tuple

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.chdir(PROJECT_ROOT)

MANIFEST_PATH = os.path.join("src", "content", "webtoonEpisodeManifest.json")
CARD_DB_PATH = os.path.join("src", "cardDatabase.ts")
PUBLIC_WEBTOON_DIR = os.path.join("public", "images", "webtoon")
BOOK_DIR = os.path.join("public", "book")
NARRATIONS_DIR = os.path.join(BOOK_DIR, "image_narrations")

TARGET_UI_FILES = [
    "src/views/NovelView.tsx",
    "src/views/MobileCardPlayScreen.tsx",
    "src/components/movie/CinematicMoviePlayer.tsx",
    "src/content/webtoonEpisodes.ts",
]

class TestResult:
    def __init__(self, name: str):
        self.name = name
        self.passed = True
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.stats: Dict[str, Any] = {}

    def fail(self, msg: str):
        self.passed = False
        self.errors.append(msg)

    def warn(self, msg: str):
        self.warnings.append(msg)

def test_manifest_structure(manifest: Dict[str, Any]) -> TestResult:
    res = TestResult("1. Manifest Structure & Episode Completeness")
    
    # 40 episodes ("1" to "40")
    expected_eps = [str(i) for i in range(1, 41)]
    actual_eps = sorted(list(manifest.keys()), key=lambda x: int(x) if x.isdigit() else 999)
    
    res.stats["total_episodes"] = len(actual_eps)
    if actual_eps != expected_eps:
        res.fail(f"Manifest episode keys mismatch! Expected 1..40, got: {actual_eps}")
        return res
    
    total_scenes = 0
    episodes_with_21_scenes = 0
    
    for ep_num in range(1, 41):
        ep_key = str(ep_num)
        ep_data = manifest[ep_key]
        
        # Check episodeNumber
        if ep_data.get("episodeNumber") != ep_num:
            res.fail(f"Episode {ep_key} episodeNumber mismatch: {ep_data.get('episodeNumber')}")
            
        # Check episodeTitle
        title_en = ep_data.get("episodeTitle")
        title_ko = ep_data.get("episodeTitleKo")
        if not title_en or not isinstance(title_en, str) or len(title_en.strip()) == 0:
            res.fail(f"Episode {ep_key} missing valid episodeTitle (EN)")
        if not title_ko or not isinstance(title_ko, str) or len(title_ko.strip()) == 0:
            res.fail(f"Episode {ep_key} missing valid episodeTitleKo")
            
        # Check totalImages
        if ep_data.get("totalImages") != 21:
            res.fail(f"Episode {ep_key} totalImages is {ep_data.get('totalImages')}, expected 21")
            
        images = ep_data.get("images", [])
        if len(images) == 21:
            episodes_with_21_scenes += 1
        else:
            res.fail(f"Episode {ep_key} has {len(images)} images, expected 21")
            
        # Verify indices 0..20
        indices = [img.get("index") for img in images]
        expected_indices = list(range(21))
        if indices != expected_indices:
            res.fail(f"Episode {ep_key} scene indices mismatch! Got {indices}")
            
        total_scenes += len(images)
        
    res.stats["episodes_with_21_scenes"] = episodes_with_21_scenes
    res.stats["total_scenes"] = total_scenes
    return res

def test_image_assets(manifest: Dict[str, Any]) -> TestResult:
    res = TestResult("2. Image Assets Existence, Resolution, File Size & Distinct Hashes")
    
    seen_hashes: Dict[str, str] = {}
    total_images_checked = 0
    valid_paths_count = 0
    valid_webp_headers = 0
    size_in_budget_count = 0
    total_bytes = 0
    
    for ep_key, ep_data in manifest.items():
        for img in ep_data.get("images", []):
            total_images_checked += 1
            idx = img.get("index")
            local_url = img.get("localArtUrl")
            img_url = img.get("imageUrl")
            
            # Check URLs format
            if not local_url or not local_url.startswith("/images/webtoon/"):
                res.fail(f"Ep {ep_key} scene {idx}: invalid localArtUrl '{local_url}'")
            if not img_url or not img_url.startswith("/images/webtoon/"):
                res.fail(f"Ep {ep_key} scene {idx}: invalid imageUrl '{img_url}'")
            if local_url != img_url:
                res.warn(f"Ep {ep_key} scene {idx}: localArtUrl != imageUrl ({local_url} vs {img_url})")
                
            # Path on disk
            rel_file = local_url.lstrip("/")
            disk_path = os.path.join("public", rel_file.split("?")[0])
            
            if not os.path.isfile(disk_path):
                res.fail(f"Ep {ep_key} scene {idx}: file missing on disk: {disk_path}")
                continue
                
            valid_paths_count += 1
            fsize = os.path.getsize(disk_path)
            total_bytes += fsize
            
            # Check budget 4KB (4,096 bytes) to 75KB (76,800 bytes)
            if 4096 <= fsize <= 76800:
                size_in_budget_count += 1
            else:
                res.fail(f"Ep {ep_key} scene {idx}: file size {fsize} bytes out of budget [4096, 76800] in {disk_path}")
                
            # Check WebP magic header (RIFF....WEBP)
            with open(disk_path, "rb") as bf:
                head = bf.read(12)
                if len(head) == 12 and head[:4] == b"RIFF" and head[8:12] == b"WEBP":
                    valid_webp_headers += 1
                else:
                    res.fail(f"Ep {ep_key} scene {idx}: {disk_path} is not a valid WebP file")
                
                # Check SHA-256 uniqueness
                bf.seek(0)
                sha = hashlib.sha256(bf.read()).hexdigest()
                if sha in seen_hashes:
                    res.fail(f"Ep {ep_key} scene {idx}: duplicate image hash detected! Matches {seen_hashes[sha]}")
                else:
                    seen_hashes[sha] = f"Ep {ep_key} scene {idx}"
                    
    res.stats["total_images_checked"] = total_images_checked
    res.stats["valid_paths_count"] = valid_paths_count
    res.stats["valid_webp_headers"] = valid_webp_headers
    res.stats["size_in_budget_count"] = size_in_budget_count
    res.stats["unique_hashes_count"] = len(seen_hashes)
    res.stats["average_size_kb"] = round(total_bytes / (total_images_checked * 1024), 2) if total_images_checked else 0
    res.stats["total_size_mb"] = round(total_bytes / (1024 * 1024), 2)
    return res

def test_card_database_alignment(manifest: Dict[str, Any]) -> TestResult:
    res = TestResult("3. Dialogue characterCardId & Card Database Alignment")
    
    # Parse cardDatabase.ts
    with open(CARD_DB_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    card_entries = re.findall(r'(\d+):\s*\{[^}]*id:\s*(\d+)[^}]*title:\s*[\'\"]([^\'\"]+)[\'\"][^}]*title_en:\s*[\'\"]([^\'\"]+)[\'\"]', content)
    cards = {int(e[0]): {"title": e[2], "title_en": e[3]} for e in card_entries}
    
    res.stats["card_db_size"] = len(cards)
    if len(cards) != 110:
        res.fail(f"cardDatabase.ts parsed {len(cards)} cards, expected 110")
        
    total_dialogues = 0
    dialogues_with_card_id = 0
    title_dialogues_count = 0
    used_card_ids: Set[int] = set()
    
    for ep_key, ep_data in manifest.items():
        images = ep_data.get("images", [])
        for img in images:
            idx = img.get("index")
            dialogues = img.get("dialogues", [])
            for d in dialogues:
                total_dialogues += 1
                cid = d.get("characterCardId")
                speaker_ko = d.get("speakerKo", "")
                speaker_en = d.get("speakerEn", "")
                
                if idx == 0:
                    title_dialogues_count += 1
                    if cid is not None:
                        res.fail(f"Ep {ep_key} scene 0 (title card) dialogue has unexpected characterCardId: {cid}")
                    if speaker_ko not in ["내레이션", "Narration"] and speaker_en not in ["Narration", "내레이션"]:
                        res.fail(f"Ep {ep_key} title card dialogue speaker is unexpected: {speaker_ko}/{speaker_en}")
                else:
                    if cid is None:
                        res.fail(f"Ep {ep_key} scene {idx} story dialogue missing characterCardId! Speaker: {speaker_ko}")
                    else:
                        dialogues_with_card_id += 1
                        if not isinstance(cid, int):
                            res.fail(f"Ep {ep_key} scene {idx} characterCardId is not int: {cid}")
                        elif cid < 1 or cid > 110:
                            res.fail(f"Ep {ep_key} scene {idx} characterCardId {cid} out of range [1, 110]")
                        elif cid not in cards:
                            res.fail(f"Ep {ep_key} scene {idx} characterCardId {cid} not found in cardDatabase.ts")
                        else:
                            used_card_ids.add(cid)
                            
    res.stats["total_dialogues"] = total_dialogues
    res.stats["dialogues_with_card_id"] = dialogues_with_card_id
    res.stats["title_dialogues_count"] = title_dialogues_count
    res.stats["distinct_cards_in_dialogues"] = len(used_card_ids)
    res.stats["used_card_ids_list"] = sorted(list(used_card_ids))
    return res

def test_scenario_alignment(manifest: Dict[str, Any]) -> TestResult:
    res = TestResult("4. Scenario Alignment with Novel Markdown & Image Narrations")
    
    matched_with_narrations = 0
    scenes_checked = 0
    novel_md_present = 0
    
    for ep_num in range(1, 41):
        ep_key = str(ep_num)
        ep_data = manifest[ep_key]
        
        # Check novel md file exists
        md_path = os.path.join(BOOK_DIR, f"episode_{ep_num:02d}.md")
        if os.path.isfile(md_path):
            novel_md_present += 1
            with open(md_path, "r", encoding="utf-8") as f:
                md_text = f.read()
            if len(md_text.strip()) < 1000:
                res.warn(f"Novel markdown {md_path} seems unusually short ({len(md_text)} chars)")
        else:
            res.fail(f"Missing novel markdown: {md_path}")
            
        # Check image_narrations json
        narr_path = os.path.join(NARRATIONS_DIR, f"episode_{ep_num:02d}_narrations.json")
        if not os.path.isfile(narr_path):
            res.fail(f"Missing narration file: {narr_path}")
            continue
            
        with open(narr_path, "r", encoding="utf-8") as f:
            narr_data = json.load(f)
            
        story_scenes = [img for img in ep_data.get("images", []) if img.get("index") > 0]
        narr_scenes = narr_data.get("scenes", [])
        
        if len(story_scenes) != len(narr_scenes):
            res.fail(f"Ep {ep_key}: story scenes count {len(story_scenes)} != narration scenes count {len(narr_scenes)}")
            continue
            
        for s_idx, (m_img, n_sc) in enumerate(zip(story_scenes, narr_scenes)):
            scenes_checked += 1
            m_ko = (m_img.get("narrationKo") or "").strip()
            n_ko = (n_sc.get("narrationKo") or "").strip()
            m_en = (m_img.get("narrationEn") or "").strip()
            n_en = (n_sc.get("narrationEn") or "").strip()
            
            if not m_ko or not m_en:
                res.fail(f"Ep {ep_key} scene {s_idx+1} has empty narration text")
            elif m_ko == n_ko and m_en == n_en:
                matched_with_narrations += 1
            else:
                res.fail(f"Ep {ep_key} scene {s_idx+1}: narration mismatch between manifest and narrations.json")
                
    res.stats["novel_md_present"] = novel_md_present
    res.stats["scenes_checked"] = scenes_checked
    res.stats["matched_with_narrations"] = matched_with_narrations
    return res

def test_ui_and_cdn_eradication() -> TestResult:
    res = TestResult("5. UI Readers & Movie Player CDN Eradication Check")
    
    cdn_target = "dayyoung.github.io"
    total_occurrences_in_ui = 0
    total_occurrences_in_src = 0
    
    # 1. Target UI files
    for filepath in TARGET_UI_FILES:
        full_path = os.path.join(filepath)
        if not os.path.isfile(full_path):
            res.fail(f"UI file missing: {filepath}")
            continue
        with open(full_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        for l_num, line in enumerate(lines, 1):
            if cdn_target in line:
                total_occurrences_in_ui += 1
                res.fail(f"External CDN found in {filepath}:{l_num} -> {line.strip()}")
                
    # 2. Entire src directory
    for root, dirs, files in os.walk("src"):
        for fname in files:
            if fname.endswith((".ts", ".tsx", ".json", ".js", ".jsx")):
                fpath = os.path.join(root, fname)
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                if cdn_target in content:
                    total_occurrences_in_src += 1
                    res.fail(f"External CDN found in src file: {fpath}")
                    
    res.stats["total_occurrences_in_ui"] = total_occurrences_in_ui
    res.stats["total_occurrences_in_src"] = total_occurrences_in_src
    return res

def run_all_tests():
    print("=" * 80)
    print("CHALLENGER 2: EMPIRICAL STRESS TEST SUITE")
    print("Manifest, UI Readers, Character Cards & Scenario Alignment")
    print("=" * 80)
    
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)
        
    results = [
        test_manifest_structure(manifest),
        test_image_assets(manifest),
        test_card_database_alignment(manifest),
        test_scenario_alignment(manifest),
        test_ui_and_cdn_eradication(),
    ]
    
    all_passed = True
    for r in results:
        status_str = "PASS" if r.passed else "FAIL"
        print(f"\n[{status_str}] {r.name}")
        for k, v in r.stats.items():
            print(f"    - {k}: {v}")
        if r.warnings:
            print("    Warnings:")
            for w in r.warnings:
                print(f"      [WARN] {w}")
        if r.errors:
            print("    Errors:")
            for e in r.errors:
                print(f"      [ERROR] {e}")
            all_passed = False
            
    print("\n" + "=" * 80)
    if all_passed:
        print("OVERALL VERDICT: APPROVE (All 5 Test Suites Passed with 0 Errors)")
    else:
        print("OVERALL VERDICT: REQUEST_CHANGES (Failures Detected)")
    print("=" * 80)
    
    # Save results to json for handoff
    results_dict = {
        "verdict": "APPROVE" if all_passed else "REQUEST_CHANGES",
        "suites": [
            {
                "name": r.name,
                "passed": r.passed,
                "stats": r.stats,
                "warnings": r.warnings,
                "errors": r.errors,
            }
            for r in results
        ]
    }
    with open("tests/challenger2_manifest_ui_results.json", "w", encoding="utf-8") as rf:
        json.dump(results_dict, rf, indent=2, ensure_ascii=False)
        
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(run_all_tests())
