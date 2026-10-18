#!/usr/bin/env python3
"""
Empirical Verification Oracle: Webtoon Assets & Character Non-Regression Stress Test
Challenger 1 (Asset & File Budget Stress Tester) - critic, specialist

Rigorous automated verification covering:
1. Inventory & Topology: 40 directories (episode_01..episode_40), exactly 21 scenes each (scene_00.webp..scene_20.webp) = 840 scenes.
2. Format & Mode: Pillow decoding asserting format == WEBP, size == (800, 450), mode == RGB.
3. Byte Budget: Assert 4,096 <= sz <= 76,800 bytes for every single file.
4. Cryptographic Uniqueness: Assert exactly 840 distinct SHA-256 hashes across all scenes.
5. Image Entropy & Variance: Compute Shannon entropy, grayscale std dev, per-channel std dev, Laplacian sharpness.
   Assert no solid black, solid white, uniform color, or low-variance blank/placeholder images.
6. Climax Hero WebP Assets: Verify 5 climax hero WebP images under public/images/webtoon/.
7. Character Non-Regression: Verify SHA-256 of all 110 hero portraits in public/seat/*.png and all master sprite sheets match git commit 3f64397a 100%.
"""

import os
import sys
import json
import glob
import hashlib
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple, Any

import numpy as np
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
WEBTOON_DIR = PROJECT_ROOT / "public" / "images" / "webtoon"
SEAT_DIR = PROJECT_ROOT / "public" / "seat"
RESULTS_JSON = PROJECT_ROOT / "tests" / "challenger_webtoon_oracle_results.json"
BASELINE_COMMIT = "3f64397a"

CLIMAX_HERO_FILES = [
    "ep01_blizzard_vow.webp",
    "ep08_crimson_mane.webp",
    "ep15_shadow_duel.webp",
    "ep25_assassin_ambush.webp",
    "ep40_eternal_shield.webp",
]

MASTER_SPRITE_SHEETS = [
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
    "public/character_sheet_dragon.png",
]


def sha256_of_bytes(data: bytes) -> str:
    h = hashlib.sha256()
    h.update(data)
    return h.hexdigest()


def sha256_of_file(filepath: Path) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def compute_shannon_entropy(arr: np.ndarray) -> float:
    """Compute Shannon entropy in bits for an 8-bit integer array."""
    flat = arr.flatten()
    hist, _ = np.histogram(flat, bins=256, range=(0, 256))
    prob = hist / hist.sum()
    prob = prob[prob > 0]
    return float(-np.sum(prob * np.log2(prob)))


def compute_laplacian_variance(gray: np.ndarray) -> float:
    """Compute discrete Laplacian variance on a 2D float32 image."""
    g = gray.astype(np.float32)
    lap = (
        g[2:, 1:-1]
        + g[:-2, 1:-1]
        + g[1:-1, 2:]
        + g[1:-1, :-2]
        - 4.0 * g[1:-1, 1:-1]
    )
    return float(np.var(lap))


def get_git_blob_bytes(commit: str, path: str) -> bytes:
    """Retrieve raw blob bytes from git commit."""
    cmd = ["git", "show", f"{commit}:{path}"]
    res = subprocess.run(cmd, cwd=PROJECT_ROOT, capture_output=True)
    if res.returncode != 0:
        raise RuntimeError(f"Git failed to show {commit}:{path}: {res.stderr.decode('utf-8', errors='replace')}")
    return res.stdout


def run_oracle() -> Tuple[bool, Dict[str, Any]]:
    print("=" * 80)
    print("EMPIRICAL ORACLE: WEBTOON ASSETS & CHARACTER NON-REGRESSION STRESS TEST")
    print("Challenger 1 (critic, specialist)")
    print(f"Project Root: {PROJECT_ROOT}")
    print(f"Target Commit: {BASELINE_COMMIT}")
    print("=" * 80)

    report: Dict[str, Any] = {
        "summary": {},
        "suites": {},
        "violations": [],
        "verdict": "PENDING"
    }
    all_passed = True

    # =========================================================================
    # SUITE 1: 40 Episodes Scene Asset Inventory & Directory Topology
    # =========================================================================
    print("\n[SUITE 1] Checking 40 Episodes Directory Topology and Scene Files Existence...")
    s1_violations = []
    total_expected_scenes = 40 * 21  # 840
    found_scenes: List[Path] = []
    unexpected_files: List[str] = []

    for ep in range(1, 41):
        ep_dir = WEBTOON_DIR / f"episode_{ep:02d}"
        if not ep_dir.is_dir():
            s1_violations.append(f"Missing episode directory: {ep_dir.relative_to(PROJECT_ROOT)}")
            continue

        dir_entries = list(ep_dir.iterdir())
        expected_names = {f"scene_{sc:02d}.webp" for sc in range(21)}
        actual_names = {e.name for e in dir_entries if e.is_file()}

        missing = expected_names - actual_names
        for m in sorted(missing):
            s1_violations.append(f"Missing scene file: episode_{ep:02d}/{m}")

        extra = actual_names - expected_names
        for ex in sorted(extra):
            unexpected_files.append(f"Unexpected file in episode_{ep:02d}: {ex}")

        for sc in range(21):
            sc_path = ep_dir / f"scene_{sc:02d}.webp"
            if sc_path.exists():
                found_scenes.append(sc_path)

    s1_passed = (len(s1_violations) == 0 and len(unexpected_files) == 0 and len(found_scenes) == total_expected_scenes)
    if not s1_passed:
        all_passed = False
    report["suites"]["suite_1_inventory"] = {
        "passed": s1_passed,
        "total_expected": total_expected_scenes,
        "total_found": len(found_scenes),
        "missing_count": len(s1_violations),
        "unexpected_count": len(unexpected_files),
        "violations": s1_violations + unexpected_files,
    }
    print(f"  Found Scenes: {len(found_scenes)} / {total_expected_scenes}")
    print(f"  Missing Scenes: {len(s1_violations)}")
    print(f"  Unexpected Files in Episode Dirs: {len(unexpected_files)}")
    print(f"  Suite 1 Verdict: {'PASS' if s1_passed else 'FAIL'}")

    # =========================================================================
    # SUITE 2 & 3 & 4 & 5: Decoding, Dimension, Mode, Byte Budget, Hash, Entropy
    # =========================================================================
    print("\n[SUITE 2-5] Decoding Images with Pillow, Checking Dimensions, Modes, Byte Budgets, Hashes & Entropy...")
    s2_violations = []
    s3_violations = []
    scene_hashes: Dict[str, List[str]] = {}
    file_sizes: List[int] = []
    entropies: List[float] = []
    luminance_stds: List[float] = []
    laplacian_vars: List[float] = []
    scene_metrics: List[Dict[str, Any]] = []

    for sc_path in found_scenes:
        rel_path = str(sc_path.relative_to(PROJECT_ROOT))
        sz = sc_path.stat().st_size
        file_sizes.append(sz)

        # Byte budget check: 4096 <= sz <= 76800
        if not (4096 <= sz <= 76800):
            s3_violations.append(f"Size budget violation: {rel_path} has {sz} bytes (allowed [4096, 76800])")

        # Cryptographic Hash
        h = sha256_of_file(sc_path)
        scene_hashes.setdefault(h, []).append(rel_path)

        # Pillow Decoding & Mode/Dimension check
        try:
            with Image.open(sc_path) as img:
                fmt = img.format
                dim = img.size
                mode = img.mode

                if fmt != "WEBP":
                    s2_violations.append(f"Format violation: {rel_path} format={fmt} (expected WEBP)")
                if dim != (800, 450):
                    s2_violations.append(f"Dimension violation: {rel_path} dim={dim} (expected (800, 450))")
                if mode != "RGB":
                    s2_violations.append(f"Mode violation: {rel_path} mode={mode} (expected RGB)")

                # Empirical Entropy & Variance analysis
                rgb_arr = np.array(img.convert("RGB"), dtype=np.uint8)
                # Grayscale luminance: Y = 0.299 R + 0.587 G + 0.114 B
                gray = 0.299 * rgb_arr[:, :, 0] + 0.587 * rgb_arr[:, :, 1] + 0.114 * rgb_arr[:, :, 2]
                lum_std = float(np.std(gray))
                lum_mean = float(np.mean(gray))
                shannon_ent = compute_shannon_entropy(gray.astype(np.uint8))
                lap_var = compute_laplacian_variance(gray)

                luminance_stds.append(lum_std)
                entropies.append(shannon_ent)
                laplacian_vars.append(lap_var)

                # Adversarial Checks: Blank, solid color, or extreme uniform
                # Standard webtoon scene should have std > 10.0 and entropy > 4.5
                if lum_std < 8.0:
                    s2_violations.append(f"Low luminance variance (blank/solid risk): {rel_path} lum_std={lum_std:.2f}")
                if shannon_ent < 4.0:
                    s2_violations.append(f"Low Shannon entropy (uniform placeholder risk): {rel_path} entropy={shannon_ent:.2f}")
                if lum_mean < 5.0:
                    s2_violations.append(f"Extreme dark / solid black image: {rel_path} lum_mean={lum_mean:.2f}")
                if lum_mean > 250.0:
                    s2_violations.append(f"Extreme bright / solid white image: {rel_path} lum_mean={lum_mean:.2f}")

                scene_metrics.append({
                    "path": rel_path,
                    "size": sz,
                    "sha256": h,
                    "dim": list(dim),
                    "format": fmt,
                    "mode": mode,
                    "lum_mean": round(lum_mean, 2),
                    "lum_std": round(lum_std, 2),
                    "entropy": round(shannon_ent, 3),
                    "laplacian_var": round(lap_var, 2),
                })
        except Exception as e:
            s2_violations.append(f"Decoding failure on {rel_path}: {e}")

    # Duplicate hash check
    duplicate_hash_groups = {h: paths for h, paths in scene_hashes.items() if len(paths) > 1}
    s4_violations = []
    if duplicate_hash_groups:
        for h, paths in duplicate_hash_groups.items():
            s4_violations.append(f"Duplicate SHA-256 {h}: {paths}")

    # Metrics summary
    min_sz = min(file_sizes) if file_sizes else 0
    max_sz = max(file_sizes) if file_sizes else 0
    avg_sz = float(np.mean(file_sizes)) if file_sizes else 0
    total_sz_mb = sum(file_sizes) / (1024 * 1024) if file_sizes else 0

    min_ent = min(entropies) if entropies else 0
    max_ent = max(entropies) if entropies else 0
    avg_ent = float(np.mean(entropies)) if entropies else 0

    min_std = min(luminance_stds) if luminance_stds else 0
    max_std = max(luminance_stds) if luminance_stds else 0
    avg_std = float(np.mean(luminance_stds)) if luminance_stds else 0

    min_lap = min(laplacian_vars) if laplacian_vars else 0
    max_lap = max(laplacian_vars) if laplacian_vars else 0
    avg_lap = float(np.mean(laplacian_vars)) if laplacian_vars else 0

    s2_passed = (len(s2_violations) == 0)
    s3_passed = (len(s3_violations) == 0)
    s4_passed = (len(s4_violations) == 0 and len(scene_hashes) == total_expected_scenes)

    if not (s2_passed and s3_passed and s4_passed):
        all_passed = False

    report["suites"]["suite_2_decoding_and_entropy"] = {
        "passed": s2_passed,
        "violations": s2_violations,
        "entropy_stats": {
            "min": round(min_ent, 3),
            "max": round(max_ent, 3),
            "mean": round(avg_ent, 3),
        },
        "variance_stats": {
            "min_lum_std": round(min_std, 2),
            "max_lum_std": round(max_std, 2),
            "mean_lum_std": round(avg_std, 2),
            "min_laplacian_var": round(min_lap, 2),
            "max_laplacian_var": round(max_lap, 2),
            "mean_laplacian_var": round(avg_lap, 2),
        }
    }
    report["suites"]["suite_3_file_size_budget"] = {
        "passed": s3_passed,
        "min_bytes": min_sz,
        "max_bytes": max_sz,
        "mean_bytes": round(avg_sz, 1),
        "total_mb": round(total_sz_mb, 2),
        "violations": s3_violations,
    }
    report["suites"]["suite_4_sha256_uniqueness"] = {
        "passed": s4_passed,
        "unique_hashes_count": len(scene_hashes),
        "expected_unique_count": total_expected_scenes,
        "duplicates": s4_violations,
    }

    print(f"  Decoded: {len(found_scenes)} scenes | Decoding Violations: {len(s2_violations)}")
    print(f"  File Size Range: [{min_sz:,} B, {max_sz:,} B] (Avg: {avg_sz:,.1f} B, Total: {total_sz_mb:.2f} MB)")
    print(f"  File Size Budget Violations (outside [4096, 76800]): {len(s3_violations)}")
    print(f"  Distinct SHA-256 Hashes: {len(scene_hashes)} / {total_expected_scenes} (Collisions: {len(s4_violations)})")
    print(f"  Entropy Range: [{min_ent:.3f}, {max_ent:.3f}] bits (Mean: {avg_ent:.3f} bits)")
    print(f"  Luminance Std Range: [{min_std:.2f}, {max_std:.2f}] (Mean: {avg_std:.2f})")
    print(f"  Laplacian Sharpness Variance: [{min_lap:.1f}, {max_lap:.1f}] (Mean: {avg_lap:.1f})")

    # Display 3 lowest entropy / variance scenes
    sorted_by_ent = sorted(scene_metrics, key=lambda x: x["entropy"])
    print("  Lowest 3 Entropy Scenes (Closest to uniform):")
    for sm in sorted_by_ent[:3]:
        print(f"    - {sm['path']}: entropy={sm['entropy']} bits, lum_std={sm['lum_std']}, sz={sm['size']} B")

    # =========================================================================
    # SUITE 6: Climax Hero WebP Assets
    # =========================================================================
    print("\n[SUITE 6] Verifying 5 Climax Hero WebP Files under public/images/webtoon/...")
    s6_violations = []
    climax_results = []
    climax_hashes = set()

    for cf in CLIMAX_HERO_FILES:
        cf_path = WEBTOON_DIR / cf
        if not cf_path.exists():
            s6_violations.append(f"Missing climax hero WebP: {cf}")
            continue

        sz = cf_path.stat().st_size
        h = sha256_of_file(cf_path)
        climax_hashes.add(h)

        if not (4096 <= sz <= 76800):
            s6_violations.append(f"Climax size violation: {cf} has {sz} B (allowed [4096, 76800])")

        try:
            with Image.open(cf_path) as img:
                fmt = img.format
                dim = img.size
                mode = img.mode

                if fmt != "WEBP":
                    s6_violations.append(f"Climax format violation: {cf} format={fmt}")
                if dim != (800, 450):
                    s6_violations.append(f"Climax dimension violation: {cf} dim={dim}")
                if mode != "RGB":
                    s6_violations.append(f"Climax mode violation: {cf} mode={mode}")

                rgb_arr = np.array(img.convert("RGB"), dtype=np.uint8)
                gray = 0.299 * rgb_arr[:, :, 0] + 0.587 * rgb_arr[:, :, 1] + 0.114 * rgb_arr[:, :, 2]
                lum_std = float(np.std(gray))
                ent = compute_shannon_entropy(gray.astype(np.uint8))

                if lum_std < 8.0 or ent < 4.0:
                    s6_violations.append(f"Climax low variance: {cf} std={lum_std:.2f}, ent={ent:.2f}")

                climax_results.append({
                    "file": cf,
                    "size": sz,
                    "sha256": h,
                    "dim": list(dim),
                    "format": fmt,
                    "mode": mode,
                    "lum_std": round(lum_std, 2),
                    "entropy": round(ent, 3)
                })
                print(f"  [PASS] {cf}: size={sz:,} B, dim={dim}, format={fmt}, mode={mode}, entropy={ent:.3f}")
        except Exception as e:
            s6_violations.append(f"Failed to decode climax {cf}: {e}")

    s6_passed = (len(s6_violations) == 0 and len(climax_results) == 5 and len(climax_hashes) == 5)
    if not s6_passed:
        all_passed = False
    report["suites"]["suite_6_climax_heroes"] = {
        "passed": s6_passed,
        "climax_results": climax_results,
        "violations": s6_violations,
    }
    print(f"  Suite 6 Verdict: {'PASS' if s6_passed else 'FAIL'}")

    # =========================================================================
    # SUITE 7: Character Asset Non-Regression vs Commit 3f64397a
    # =========================================================================
    print(f"\n[SUITE 7] Verifying Character Assets Non-Regression vs Baseline Commit {BASELINE_COMMIT}...")
    s7_violations = []

    # 1. Check all 110 hero portraits in public/seat/*.png
    seat_files_on_disk = sorted(SEAT_DIR.glob("*.png"))
    print(f"  Checking {len(seat_files_on_disk)} seat PNG files in public/seat/ against git commit {BASELINE_COMMIT}...")

    # Get git ls-tree for public/seat/ at commit 3f64397a
    cmd = ["git", "ls-tree", "-r", BASELINE_COMMIT, "public/seat/"]
    res = subprocess.run(cmd, cwd=PROJECT_ROOT, capture_output=True, text=True)
    if res.returncode != 0:
        s7_violations.append(f"Failed to get git ls-tree for public/seat/: {res.stderr}")
    else:
        git_seat_files: Dict[str, str] = {}
        for line in res.stdout.strip().split("\n"):
            if not line:
                continue
            parts = line.split()
            # 100644 blob <sha> <path>
            blob_sha = parts[2]
            path_str = parts[3]
            git_seat_files[path_str] = blob_sha

        # Compare disk vs git
        for sf in seat_files_on_disk:
            rel = str(sf.relative_to(PROJECT_ROOT))
            if rel not in git_seat_files:
                s7_violations.append(f"Seat file not in commit {BASELINE_COMMIT}: {rel}")
                continue

            # Compare SHA-256 of file on disk vs raw blob from git
            disk_sha256 = sha256_of_file(sf)
            git_blob_bytes = get_git_blob_bytes(BASELINE_COMMIT, rel)
            git_sha256 = sha256_of_bytes(git_blob_bytes)

            if disk_sha256 != git_sha256:
                s7_violations.append(f"Seat file hash mismatch on {rel}: disk={disk_sha256} vs git={git_sha256}")

        # Check for any deleted seat files
        for git_path in git_seat_files:
            if not (PROJECT_ROOT / git_path).exists():
                s7_violations.append(f"Seat file deleted from disk: {git_path}")

    # 2. Check all 15 master sprite sheets
    print(f"  Checking {len(MASTER_SPRITE_SHEETS)} master sprite sheets against git commit {BASELINE_COMMIT}...")
    for ms in MASTER_SPRITE_SHEETS:
        ms_path = PROJECT_ROOT / ms
        if not ms_path.exists():
            s7_violations.append(f"Master sprite sheet missing from disk: {ms}")
            continue

        disk_sha256 = sha256_of_file(ms_path)
        try:
            git_blob_bytes = get_git_blob_bytes(BASELINE_COMMIT, ms)
            git_sha256 = sha256_of_bytes(git_blob_bytes)

            if disk_sha256 != git_sha256:
                s7_violations.append(f"Sprite sheet mismatch on {ms}: disk={disk_sha256} vs git={git_sha256}")
            else:
                sz = ms_path.stat().st_size
                print(f"    [PASS] {ms}: {sz:,} B (Matches commit {BASELINE_COMMIT} 100%)")
        except Exception as e:
            s7_violations.append(f"Error checking git blob for {ms}: {e}")

    s7_passed = (len(s7_violations) == 0)
    if not s7_passed:
        all_passed = False
    report["suites"]["suite_7_character_non_regression"] = {
        "passed": s7_passed,
        "seat_files_checked": len(seat_files_on_disk),
        "sprite_sheets_checked": len(MASTER_SPRITE_SHEETS),
        "violations": s7_violations,
    }
    print(f"  Character Non-Regression Violations: {len(s7_violations)}")
    print(f"  Suite 7 Verdict: {'PASS' if s7_passed else 'FAIL'}")

    # =========================================================================
    # OVERALL VERDICT
    # =========================================================================
    all_violations = s1_violations + unexpected_files + s2_violations + s3_violations + s4_violations + s6_violations + s7_violations
    report["violations"] = all_violations
    verdict = "APPROVE" if all_passed else "REQUEST_CHANGES"
    report["verdict"] = verdict

    report["summary"] = {
        "all_passed": all_passed,
        "verdict": verdict,
        "total_violations": len(all_violations),
        "total_webtoon_scenes": len(found_scenes),
        "unique_scene_hashes": len(scene_hashes),
        "climax_heroes_verified": len(climax_results),
        "seat_portraits_verified": len(seat_files_on_disk),
        "sprite_sheets_verified": len(MASTER_SPRITE_SHEETS),
        "average_scene_size_bytes": round(avg_sz, 1),
        "total_webtoon_library_mb": round(total_sz_mb, 2),
        "mean_entropy_bits": round(avg_ent, 3),
        "mean_luminance_std": round(avg_std, 2),
    }

    print("\n" + "=" * 80)
    print(f"FINAL ORACLE VERDICT: {verdict}")
    print(f"Total Violations: {len(all_violations)}")
    print("=" * 80)

    with open(RESULTS_JSON, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"Wrote structured oracle results to: {RESULTS_JSON}")

    return all_passed, report


if __name__ == "__main__":
    success, rep = run_oracle()
    sys.exit(0 if success else 1)
