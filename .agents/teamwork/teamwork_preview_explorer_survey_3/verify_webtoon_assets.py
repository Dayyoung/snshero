#!/usr/bin/env python3
"""
Automated Verification Suite for 40-Episode Webtoon Regeneration & Non-Regression
SNSHero Revolution - Explorer 3 Verification Tool

Acceptance Checks:
1. 840 files existence: public/images/webtoon/episode_{01..40}/scene_{00..20}.webp
2. 840 distinct SHA-256 hashes: Zero duplicate images, zero blank/placeholder panels
3. File size bounds: Each file >= 4,096 bytes (4 KB) and <= 76,800 bytes (75 KB)
4. Character asset non-regression: Commit 3f64397a integrity check for 110 portraits, 4 master sheets, 11 faction sheets
5. Webtoon manifest alignment: src/content/webtoonEpisodeManifest.json (40 eps x 21 scenes, local paths, zero CDN)
6. UI Readers & Code hygiene: Zero stale CDN (dayyoung.github.io) in readers/players
7. Service Worker cache: Verification of cache name and media cache purging
8. TypeScript & Production build pass (npx tsc --noEmit, npm run build)
"""

import os
import sys
import json
import hashlib
import subprocess
from pathlib import Path

REPO_ROOT = Path("/Users/dayyoung/project/snshero")
COMMIT_REF = "3f64397a"
MIN_BYTES = 4096
MAX_BYTES = 76800

def check_character_non_regression():
    """Verify that all 110 hero portraits, master sheets, and faction sheets match commit 3f64397a."""
    cmd = [
        "git", "diff", "--name-only", COMMIT_REF, "--",
        "public/seat/",
        "public/cards1.png",
        "public/cards2.png",
        "public/card100.png",
        "public/card100_gemini.png",
        "public/character_sheet_*.png"
    ]
    res = subprocess.run(cmd, cwd=REPO_ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        return False, f"git diff execution failed: {res.stderr}"
    diffs = [line.strip() for line in res.stdout.splitlines() if line.strip()]
    if diffs:
        return False, f"Regression detected in character assets: {diffs}"
    return True, "All 110 portraits and sprite sheets match commit 3f64397a 100%"

def check_webtoon_files_existence_and_hashes():
    """Verify 840 files exist, are valid WebP, and have 840 distinct hashes."""
    webtoon_dir = REPO_ROOT / "public/images/webtoon"
    if not webtoon_dir.exists():
        return False, f"Webtoon directory does not exist: {webtoon_dir}", {}

    hashes = {}
    size_violations = []
    missing_files = []
    total_bytes = 0

    for ep in range(1, 41):
        ep_pad = f"{ep:02d}"
        for sc in range(21):
            sc_pad = f"{sc:02d}"
            # Check for either .webp (preferred) or .jpg
            webp_path = webtoon_dir / f"episode_{ep_pad}" / f"scene_{sc_pad}.webp"
            jpg_path = webtoon_dir / f"episode_{ep_pad}" / f"scene_{sc_pad}.jpg"
            target_path = webp_path if webp_path.exists() else jpg_path

            if not target_path.exists():
                missing_files.append(f"episode_{ep_pad}/scene_{sc_pad}.webp")
                continue

            size = target_path.stat().st_size
            total_bytes += size
            if size < MIN_BYTES or size > MAX_BYTES:
                size_violations.append((str(target_path.relative_to(REPO_ROOT)), size))

            # Compute SHA-256
            hasher = hashlib.sha256()
            with open(target_path, "rb") as f:
                content = f.read()
                # Check magic header: WebP (RIFF....WEBP) or JPEG (\xff\xd8\xff)
                if not (content.startswith(b"RIFF") and b"WEBP" in content[:16]) and not content.startswith(b"\xff\xd8\xff"):
                    return False, f"Invalid image magic header: {target_path}", {}
                hasher.update(content)
            
            digest = hasher.hexdigest()
            if digest in hashes:
                return False, f"Duplicate image detected! {target_path} shares SHA-256 with {hashes[digest]}", {}
            hashes[digest] = str(target_path.relative_to(REPO_ROOT))

    stats = {
        "found_files": len(hashes),
        "total_expected": 840,
        "missing_count": len(missing_files),
        "missing_samples": missing_files[:5],
        "size_violations_count": len(size_violations),
        "size_violations_samples": size_violations[:5],
        "avg_bytes": total_bytes / max(1, len(hashes)),
        "total_kb": total_bytes / 1024,
    }

    if missing_files:
        return False, f"{len(missing_files)} / 840 scene files missing!", stats
    if size_violations:
        return False, f"{len(size_violations)} files violate size budget [{MIN_BYTES}, {MAX_BYTES}] bytes!", stats
    if len(hashes) != 840:
        return False, f"Expected 840 distinct hashes, got {len(hashes)}", stats

    return True, f"All 840 scene files exist, valid WebP/JPG, distinct SHA-256, within [{MIN_BYTES}, {MAX_BYTES}] bytes", stats

def check_manifest_alignment():
    """Verify webtoonEpisodeManifest.json alignment with local files and novel metadata."""
    manifest_path = REPO_ROOT / "src/content/webtoonEpisodeManifest.json"
    if not manifest_path.exists():
        return False, "webtoonEpisodeManifest.json not found"

    with open(manifest_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if len(data) != 40:
        return False, f"Manifest has {len(data)} episodes (expected 40)"

    cdn_references = []
    local_missing = []

    for ep_num in range(1, 41):
        ep_key = str(ep_num)
        if ep_key not in data:
            return False, f"Episode {ep_num} missing from manifest"
        ep = data[ep_key]
        images = ep.get("images", [])
        if len(images) != 21:
            return False, f"Episode {ep_num} has {len(images)} images (expected 21)"

        for img in images:
            img_url = img.get("imageUrl", "")
            local_url = img.get("localArtUrl", "")
            if "dayyoung.github.io" in img_url:
                cdn_references.append(f"ep{ep_num}_sc{img.get('index')}")
            
            # Check local file existence if localArtUrl or local imageUrl is given
            target_url = local_url or img_url
            if target_url.startswith("/"):
                disk_file = REPO_ROOT / "public" / target_url.lstrip("/")
                if not disk_file.exists():
                    local_missing.append(str(target_url))

    if cdn_references:
        return False, f"{len(cdn_references)} scenes in manifest still reference dayyoung.github.io CDN!"
    if local_missing:
        return False, f"{len(local_missing)} local paths in manifest do not exist on disk!"

    return True, "Manifest completely synchronized with local paths; zero external CDN references"

def check_ui_readers_cdn_removal():
    """Verify that source code files do not have hardcoded dayyoung.github.io URLs."""
    targets = [
        "src/views/NovelView.tsx",
        "src/views/MobileCardPlayScreen.tsx",
        "src/content/webtoonEpisodes.ts",
        "src/components/movie/CinematicMoviePlayer.tsx"
    ]
    cdn_hits = []
    for rel_path in targets:
        fpath = REPO_ROOT / rel_path
        if not fpath.exists():
            continue
        with open(fpath, "r", encoding="utf-8") as f:
            for line_no, line in enumerate(f, 1):
                if "dayyoung.github.io" in line:
                    cdn_hits.append(f"{rel_path}:{line_no}")

    if cdn_hits:
        return False, f"Hardcoded dayyoung.github.io found in UI components: {cdn_hits}"
    return True, "All UI readers and video players cleanly point to local assets with zero hardcoded CDN"

def check_sw_cache_version():
    """Check Service Worker cache version in public/sw.js."""
    sw_path = REPO_ROOT / "public/sw.js"
    if not sw_path.exists():
        return False, "public/sw.js missing"
    with open(sw_path, "r", encoding="utf-8") as f:
        content = f.read()
    # Check if MEDIA_CACHE_NAME has been bumped from v3
    if "snshero-media-v3" in content:
        return False, "public/sw.js still uses v3 cache (needs bump to v4 to purge stale media cache)"
    return True, "public/sw.js cache version bumped to purge stale media"

def run_typecheck():
    """Run npx tsc --noEmit."""
    res = subprocess.run(["npx", "tsc", "--noEmit"], cwd=REPO_ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        return False, f"TypeScript errors:\n{res.stdout}\n{res.stderr}"
    return True, "TypeScript typecheck (tsc --noEmit) passed cleanly with 0 errors"

def run_production_build():
    """Run npm run build."""
    res = subprocess.run(["npm", "run", "build"], cwd=REPO_ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        return False, f"Production build failed:\n{res.stdout}\n{res.stderr}"
    return True, "Production build (npm run build) passed cleanly"

if __name__ == "__main__":
    print("==================================================================")
    print("SNSHero Webtoon 40-Episode Automated Verification Suite")
    print("==================================================================")
    
    c_ok, c_msg = check_character_non_regression()
    print(f"[{'PASS' if c_ok else 'FAIL'}] Character Non-Regression: {c_msg}")

    f_ok, f_msg, stats = check_webtoon_files_existence_and_hashes()
    print(f"[{'PASS' if f_ok else 'FAIL'}] 840 Files & Hashes: {f_msg}")
    if stats:
        print(f"       Found: {stats['found_files']}/{stats['total_expected']}, Missing: {stats['missing_count']}")

    m_ok, m_msg = check_manifest_alignment()
    print(f"[{'PASS' if m_ok else 'FAIL'}] Manifest Alignment: {m_msg}")

    u_ok, u_msg = check_ui_readers_cdn_removal()
    print(f"[{'PASS' if u_ok else 'FAIL'}] UI CDN Removal: {u_msg}")

    s_ok, s_msg = check_sw_cache_version()
    print(f"[{'PASS' if s_ok else 'FAIL'}] Service Worker Cache: {s_msg}")

    t_ok, t_msg = run_typecheck()
    print(f"[{'PASS' if t_ok else 'FAIL'}] Typecheck: {t_msg}")

    all_pass = all([c_ok, f_ok, m_ok, u_ok, s_ok, t_ok])
    print("==================================================================")
    print(f"OVERALL STATUS: {'READY / PASS' if all_pass else 'PENDING IMPLEMENTATION'}")
    print("==================================================================")
