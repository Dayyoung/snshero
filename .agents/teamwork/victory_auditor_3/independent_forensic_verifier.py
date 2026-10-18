#!/usr/bin/env python3
"""
Independent Forensic Verifier for SNSHero 40-Episode Webtoon Remake
Author: victory_auditor_3
Role: Independent Victory Auditor
"""

import os
import sys
import json
import hashlib
import subprocess
import math
from PIL import Image
import numpy as np

PROJECT_ROOT = "/Users/dayyoung/project/snshero"
PUBLIC_DIR = os.path.join(PROJECT_ROOT, "public")
WEBTOON_DIR = os.path.join(PUBLIC_DIR, "images", "webtoon")
SRC_DIR = os.path.join(PROJECT_ROOT, "src")
TMP_BG_DIR = "/tmp/webtoon_bg_plates"

MIN_SIZE = 4096
MAX_SIZE = 76800  # 75 KB
EXPECTED_DIM = (800, 450)
EXPECTED_EPISODES = 40
EXPECTED_SCENES_PER_EP = 21
EXPECTED_TOTAL_SCENES = EXPECTED_EPISODES * EXPECTED_SCENES_PER_EP  # 840

def calculate_entropy(img_arr):
    if len(img_arr.shape) == 3:
        gray = np.dot(img_arr[...,:3], [0.2989, 0.5870, 0.1140]).astype(np.uint8)
    else:
        gray = img_arr.astype(np.uint8)
    hist, _ = np.histogram(gray, bins=256, range=(0, 256))
    hist = hist[hist > 0]
    prob = hist / hist.sum()
    return float(-np.sum(prob * np.log2(prob)))

def main():
    print("=" * 80)
    print("INDEPENDENT FORENSIC VERIFICATION: SNSHero 40-Episode Webtoon Remake")
    print("=" * 80)

    results = {
        "phase1_timeline": {},
        "phase2_anti_gaming": {},
        "phase3_independent_execution": {},
        "failures": []
    }

    # -------------------------------------------------------------
    # 1. 840 Webtoon Panels Verification
    # -------------------------------------------------------------
    print("\n[Step 1] Verifying all 840 webtoon panels...")
    hashes = {}
    sizes = []
    entropies = []
    std_devs = []
    missing_files = []
    corrupted_files = []
    size_violations = []
    dimension_violations = []
    format_violations = []
    blank_or_dummy_files = []

    for ep in range(1, EXPECTED_EPISODES + 1):
        ep_dir = os.path.join(WEBTOON_DIR, f"episode_{ep:02d}")
        if not os.path.isdir(ep_dir):
            missing_files.append(f"Directory missing: episode_{ep:02d}")
            continue

        for sc in range(EXPECTED_SCENES_PER_EP):
            fname = f"scene_{sc:02d}.webp"
            fpath = os.path.join(ep_dir, fname)

            if not os.path.isfile(fpath):
                missing_files.append(f"episode_{ep:02d}/{fname}")
                continue

            file_size = os.path.getsize(fpath)
            sizes.append(file_size)
            if file_size < MIN_SIZE or file_size > MAX_SIZE:
                size_violations.append((f"episode_{ep:02d}/{fname}", file_size))

            # SHA-256
            with open(fpath, "rb") as f:
                content = f.read()
                file_hash = hashlib.sha256(content).hexdigest()
                if file_hash in hashes:
                    results["failures"].append(
                        f"HASH COLLISION: episode_{ep:02d}/{fname} shares hash {file_hash} with {hashes[file_hash]}"
                    )
                else:
                    hashes[file_hash] = f"episode_{ep:02d}/{fname}"

            # Pillow image checks
            try:
                with Image.open(fpath) as img:
                    if img.format != "WEBP":
                        format_violations.append((f"episode_{ep:02d}/{fname}", img.format))
                    if img.size != EXPECTED_DIM:
                        dimension_violations.append((f"episode_{ep:02d}/{fname}", img.size))
                    
                    img_data = np.array(img.convert("RGB"))
                    std_val = float(np.std(img_data))
                    std_devs.append(std_val)
                    ent = calculate_entropy(img_data)
                    entropies.append(ent)

                    # Blank/dummy threshold
                    if std_val < 5.0 or ent < 3.0:
                        blank_or_dummy_files.append((f"episode_{ep:02d}/{fname}", std_val, ent))
            except Exception as e:
                corrupted_files.append((f"episode_{ep:02d}/{fname}", str(e)))

    total_scanned = len(sizes)
    unique_hashes = len(hashes)

    print(f"  Total scanned panels: {total_scanned} / {EXPECTED_TOTAL_SCENES}")
    print(f"  Missing files: {len(missing_files)}")
    print(f"  Corrupted files: {len(corrupted_files)}")
    print(f"  Size violations: {len(size_violations)}")
    print(f"  Dimension violations: {len(dimension_violations)}")
    print(f"  Format violations: {len(format_violations)}")
    print(f"  Unique SHA-256 hashes: {unique_hashes} / {total_scanned}")
    print(f"  Blank/dummy files: {len(blank_or_dummy_files)}")
    if sizes:
        print(f"  File size range: [{min(sizes)} B, {max(sizes)} B] (avg: {sum(sizes)/len(sizes):.1f} B)")
        print(f"  Total library size: {sum(sizes) / (1024*1024):.2f} MB")
        print(f"  Entropy range: [{min(entropies):.2f}, {max(entropies):.2f}] (avg: {sum(entropies)/len(entropies):.2f})")
        print(f"  StdDev range: [{min(std_devs):.2f}, {max(std_devs):.2f}] (avg: {sum(std_devs)/len(std_devs):.2f})")

    p3_panels_pass = (
        total_scanned == EXPECTED_TOTAL_SCENES
        and len(missing_files) == 0
        and len(corrupted_files) == 0
        and len(size_violations) == 0
        and len(dimension_violations) == 0
        and len(format_violations) == 0
        and unique_hashes == EXPECTED_TOTAL_SCENES
        and len(blank_or_dummy_files) == 0
    )

    if not p3_panels_pass:
        results["failures"].append("Panel validation failed")

    results["phase3_independent_execution"]["panels"] = {
        "pass": p3_panels_pass,
        "total_scanned": total_scanned,
        "unique_hashes": unique_hashes,
        "min_size": min(sizes) if sizes else 0,
        "max_size": max(sizes) if sizes else 0,
        "avg_size_kb": (sum(sizes) / len(sizes) / 1024) if sizes else 0,
        "total_size_mb": (sum(sizes) / (1024*1024)) if sizes else 0,
        "min_entropy": min(entropies) if entropies else 0,
        "max_entropy": max(entropies) if entropies else 0,
        "min_stddev": min(std_devs) if std_devs else 0
    }

    # -------------------------------------------------------------
    # 2. Climax Images Verification
    # -------------------------------------------------------------
    print("\n[Step 2] Verifying climax hero images...")
    climax_files = [
        "ep01_blizzard_vow.webp",
        "ep08_crimson_mane.webp",
        "ep15_shadow_duel.webp",
        "ep25_assassin_ambush.webp",
        "ep40_eternal_shield.webp"
    ]
    climax_results = []
    climax_pass = True
    for cf in climax_files:
        cpath = os.path.join(WEBTOON_DIR, cf)
        if not os.path.isfile(cpath):
            climax_pass = False
            results["failures"].append(f"Climax file missing: {cf}")
            continue
        csize = os.path.getsize(cpath)
        if csize > MAX_SIZE:
            climax_pass = False
            results["failures"].append(f"Climax file size exceeded: {cf} ({csize} B)")
        with Image.open(cpath) as img:
            climax_results.append((cf, csize, img.size, img.format))
    print(f"  Climax files verified: {len(climax_results)} / {len(climax_files)} (Pass: {climax_pass})")
    results["phase3_independent_execution"]["climax"] = {
        "pass": climax_pass,
        "files": climax_results
    }

    # -------------------------------------------------------------
    # 3. Gemini Background Plates
    # -------------------------------------------------------------
    print("\n[Step 3] Verifying 16 Gemini background plates in /tmp/webtoon_bg_plates/...")
    bg_plates_pass = True
    bg_plates = []
    for i in range(1, 17):
        bg_fname = f"bg_{i:02d}.jpg"
        bg_path = os.path.join(TMP_BG_DIR, bg_fname)
        if not os.path.isfile(bg_path):
            bg_plates_pass = False
            results["failures"].append(f"Missing Gemini background plate: {bg_path}")
            continue
        with Image.open(bg_path) as img:
            if img.size != EXPECTED_DIM:
                bg_plates_pass = False
                results["failures"].append(f"Plate {bg_fname} size {img.size} != {EXPECTED_DIM}")
            bg_plates.append((bg_fname, img.size, os.path.getsize(bg_path)))
    print(f"  Gemini background plates: {len(bg_plates)} / 16 (Pass: {bg_plates_pass})")
    results["phase3_independent_execution"]["bg_plates"] = {
        "pass": bg_plates_pass,
        "count": len(bg_plates)
    }

    # -------------------------------------------------------------
    # 4. Manifest & Scenario Synchronization
    # -------------------------------------------------------------
    print("\n[Step 4] Verifying webtoonEpisodeManifest.json and novel alignment...")
    manifest_path = os.path.join(SRC_DIR, "content", "webtoonEpisodeManifest.json")
    manifest_pass = True
    manifest_stats = {}

    if not os.path.isfile(manifest_path):
        manifest_pass = False
        results["failures"].append(f"Manifest missing: {manifest_path}")
    else:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        missing_scenes_manifest = []
        unresolved_local_images = []
        dialogue_count = 0
        dialogues_with_card_id = 0

        for ep_num in range(1, EXPECTED_EPISODES + 1):
            ep_key = str(ep_num)
            if ep_key not in manifest:
                manifest_pass = False
                results["failures"].append(f"Episode {ep_key} missing from manifest")
                continue

            ep_data = manifest[ep_key]
            images = ep_data.get("images", [])
            if len(images) != EXPECTED_SCENES_PER_EP:
                manifest_pass = False
                results["failures"].append(f"Episode {ep_key} scene count {len(images)} != 21")

            for scene in images:
                local_art = scene.get("localArtUrl", "")
                image_url = scene.get("imageUrl", "")
                
                # Check resolved disk file
                clean_path = local_art.lstrip("/")
                disk_path = os.path.join(PUBLIC_DIR, clean_path)
                if not os.path.isfile(disk_path):
                    unresolved_local_images.append(local_art)

                # Check dialogues
                for d in scene.get("dialogues", []):
                    dialogue_count += 1
                    if "characterCardId" in d and d["characterCardId"] is not None:
                        dialogues_with_card_id += 1

        print(f"  Manifest episodes: {len(manifest)} / {EXPECTED_EPISODES}")
        print(f"  Unresolved local image paths: {len(unresolved_local_images)}")
        print(f"  Total dialogues: {dialogue_count}, with characterCardId: {dialogues_with_card_id}")
        if len(unresolved_local_images) > 0:
            manifest_pass = False
            results["failures"].append(f"Manifest has {len(unresolved_local_images)} unresolved localArtUrls")

        manifest_stats = {
            "pass": manifest_pass,
            "episodes": len(manifest),
            "unresolved_images": len(unresolved_local_images),
            "dialogue_count": dialogue_count,
            "dialogues_with_card_id": dialogues_with_card_id
        }

    results["phase3_independent_execution"]["manifest"] = manifest_stats

    # -------------------------------------------------------------
    # 5. External CDN Elimination Check
    # -------------------------------------------------------------
    print("\n[Step 5] Checking for elimination of external CDN (dayyoung.github.io) in src/... ")
    cdn_hits = []
    for root, _, files in os.walk(SRC_DIR):
        for fname in files:
            if fname.endswith((".ts", ".tsx", ".js", ".jsx", ".json", ".css")):
                fpath = os.path.join(root, fname)
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    for lno, line in enumerate(f, 1):
                        if "dayyoung.github.io" in line:
                            cdn_hits.append((f"{os.path.relpath(fpath, PROJECT_ROOT)}:{lno}", line.strip()))

    cdn_pass = (len(cdn_hits) == 0)
    print(f"  External CDN references in src/: {len(cdn_hits)} (Pass: {cdn_pass})")
    if not cdn_pass:
        results["failures"].append(f"Found {len(cdn_hits)} CDN occurrences in src/")
        for hit in cdn_hits[:5]:
            print(f"    - {hit[0]}: {hit[1]}")

    results["phase3_independent_execution"]["cdn_elimination"] = {
        "pass": cdn_pass,
        "occurrences": len(cdn_hits),
        "hits": cdn_hits
    }

    # -------------------------------------------------------------
    # 6. Character Asset Non-Regression Check vs 3f64397a
    # -------------------------------------------------------------
    print("\n[Step 6] Verifying 100% preservation of character assets vs commit 3f64397a...")
    git_diff_cmd = [
        "git", "diff", "--name-only", "3f64397a", "--",
        "public/seat/",
        "public/cards1.png",
        "public/cards2.png",
        "public/card100.png",
        "public/card100_gemini.png",
        "public/character_sheet_water.png",
        "public/character_sheet_fire.png",
        "public/character_sheet_wind.png",
        "public/character_sheet_earth.png",
        "public/character_sheet_human.png",
        "public/character_sheet_undead.png",
        "public/character_sheet_elf.png",
        "public/character_sheet_hobbit.png",
        "public/character_sheet_beast.png",
        "public/character_sheet_mecha.png",
        "public/character_sheet_dragon.png"
    ]
    diff_proc = subprocess.run(git_diff_cmd, cwd=PROJECT_ROOT, capture_output=True, text=True)
    diff_output = diff_proc.stdout.strip()
    character_asset_pass = (len(diff_output) == 0 and diff_proc.returncode == 0)

    seat_files = [f for f in os.listdir(os.path.join(PUBLIC_DIR, "seat")) if f.endswith(".png")]
    print(f"  Character seat files count: {len(seat_files)} (all matching commit 3f64397a)")
    print(f"  git diff vs 3f64397a diff files: '{diff_output}'")
    print(f"  Character asset non-regression: Pass = {character_asset_pass}")

    if not character_asset_pass:
        results["failures"].append(f"Character assets regressed vs 3f64397a: {diff_output}")

    results["phase3_independent_execution"]["character_non_regression"] = {
        "pass": character_asset_pass,
        "diff_files": diff_output.splitlines() if diff_output else [],
        "seat_count": len(seat_files)
    }

    # -------------------------------------------------------------
    # 7. Build and Lint Verification
    # -------------------------------------------------------------
    print("\n[Step 7] Running npm run lint (tsc --noEmit) and npm run build...")
    
    print("  Running: npx tsc --noEmit")
    tsc_proc = subprocess.run(["npx", "tsc", "--noEmit"], cwd=PROJECT_ROOT, capture_output=True, text=True)
    tsc_pass = (tsc_proc.returncode == 0)
    print(f"  TypeScript check exit code: {tsc_proc.returncode} (Pass: {tsc_pass})")
    if not tsc_pass:
        results["failures"].append("npx tsc --noEmit failed")

    print("  Running: npm run build")
    build_proc = subprocess.run(["npm", "run", "build"], cwd=PROJECT_ROOT, capture_output=True, text=True)
    build_pass = (build_proc.returncode == 0)
    print(f"  Build exit code: {build_proc.returncode} (Pass: {build_pass})")
    if not build_pass:
        results["failures"].append("npm run build failed")

    results["phase3_independent_execution"]["build_and_lint"] = {
        "tsc_pass": tsc_pass,
        "tsc_code": tsc_proc.returncode,
        "build_pass": build_pass,
        "build_code": build_proc.returncode
    }

    # -------------------------------------------------------------
    # 8. Git Commit, Push Status & Reporting Verification
    # -------------------------------------------------------------
    print("\n[Step 8] Verifying Git commit status and reporting...")
    git_head_cmd = ["git", "rev-parse", "HEAD"]
    head_proc = subprocess.run(git_head_cmd, cwd=PROJECT_ROOT, capture_output=True, text=True)
    head_commit = head_proc.stdout.strip()
    
    git_status_proc = subprocess.run(["git", "status", "-b", "--porcelain"], cwd=PROJECT_ROOT, capture_output=True, text=True)
    git_status_str = git_status_proc.stdout

    work_logs_path = os.path.join(PROJECT_ROOT, "WORK_LOGS.md")
    work_logs_has_entry = False
    if os.path.isfile(work_logs_path):
        with open(work_logs_path, "r", encoding="utf-8") as f:
            wcontent = f.read(5000)
            if "40부작 웹툰 전편 840개 씬" in wcontent and "2026-10-18 14:00" in wcontent:
                work_logs_has_entry = True

    git_push_absent = ("ahead" in git_status_str)
    git_pass = (head_commit.startswith("12f3e508") and git_push_absent and work_logs_has_entry)

    print(f"  HEAD commit: {head_commit}")
    print(f"  Git ahead of origin (no push): {git_push_absent}")
    print(f"  WORK_LOGS.md logged: {work_logs_has_entry}")
    print(f"  Git & hygiene pass: {git_pass}")

    if not git_pass:
        results["failures"].append(f"Git or logging check failed: HEAD={head_commit}, ahead={git_push_absent}, logged={work_logs_has_entry}")

    results["phase3_independent_execution"]["git_and_hygiene"] = {
        "pass": git_pass,
        "head_commit": head_commit,
        "ahead_of_origin": git_push_absent,
        "work_logs_updated": work_logs_has_entry
    }

    # -------------------------------------------------------------
    # Summary Verdict
    # -------------------------------------------------------------
    all_passed = (
        p3_panels_pass
        and climax_pass
        and bg_plates_pass
        and manifest_pass
        and cdn_pass
        and character_asset_pass
        and tsc_pass
        and build_pass
        and git_pass
    )

    verdict = "VICTORY CONFIRMED" if all_passed else "VICTORY REJECTED"
    print("\n" + "=" * 80)
    print(f"FINAL AUDIT VERDICT: {verdict}")
    print("=" * 80)
    if results["failures"]:
        print("FAILURES DETECTED:")
        for fail in results["failures"]:
            print(f"  - {fail}")
    else:
        print("All forensic, integrity, and behavioral checks PASSED with 0 discrepancies!")

    out_path = os.path.join(os.path.dirname(__file__), "independent_forensic_results.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Detailed forensic results saved to: {out_path}")

    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
