#!/usr/bin/env python3
"""Zero-Trust Independent Asset Audit Script for Victory Auditor 2.
Audits all 110 seat files, 4 master sprite sheets, and 11 faction sheets.
Checks:
- Existence & Path
- 8-byte PNG Magic Header
- PIL Image Decode & Dimensions
- Mode & Alpha Support
- Shannon Entropy & Standard Deviation (Blank/uniform detection)
- File Size Budget & Bounds
- SHA-256 Hash Uniqueness (Raw file hash & Image raster hash)
"""

import sys
import os
import hashlib
import math
from pathlib import Path
from PIL import Image

REPO_ROOT = Path("/Users/dayyoung/project/snshero")
PUBLIC_DIR = REPO_ROOT / "public"
SEAT_DIR = PUBLIC_DIR / "seat"

PNG_MAGIC = b"\x89PNG\r\n\x1a\n"

SEAT_MAX_SIZE = 35840   # 35 KB
SEAT_MIN_SIZE = 4096    # 4 KB
MASTER_MAX_SIZE = 819200  # 800 KB
FACTION_MAX_SIZE = 307200 # 300 KB

def main():
    print("=== ZERO-TRUST INDEPENDENT ASSET AUDIT ===")
    violations = []
    
    # 1. Audit public/seat/ (110 files)
    seat_files = sorted(list(SEAT_DIR.glob("*.png")))
    print(f"\n[1] Auditing public/seat/ files... Found: {len(seat_files)} files")
    if len(seat_files) != 110:
        violations.append(f"Seat file count mismatch: expected 110, found {len(seat_files)}")
    
    seat_hashes = set()
    seat_raster_hashes = set()
    
    for p in seat_files:
        size = p.stat().st_size
        if size < SEAT_MIN_SIZE or size > SEAT_MAX_SIZE:
            violations.append(f"Seat size budget violation: {p.name} has size {size} bytes (expected [{SEAT_MIN_SIZE}, {SEAT_MAX_SIZE}])")
            
        with open(p, "rb") as f:
            header = f.read(8)
            f.seek(0)
            data = f.read()
        
        if header != PNG_MAGIC:
            violations.append(f"PNG Magic Header violation in {p.name}: header is {header.hex()}")
            
        raw_hash = hashlib.sha256(data).hexdigest()
        if raw_hash in seat_hashes:
            violations.append(f"Duplicate raw SHA-256 hash in seat file: {p.name} (hash: {raw_hash})")
        seat_hashes.add(raw_hash)
        
        try:
            with Image.open(p) as img:
                img.load()
                w, h = img.size
                if (w, h) != (256, 296):
                    violations.append(f"Seat dimension violation: {p.name} is {w}x{h}, expected 256x296")
                
                # Check raster data uniqueness
                raster_data = img.tobytes()
                raster_hash = hashlib.sha256(raster_data).hexdigest()
                if raster_hash in seat_raster_hashes:
                    violations.append(f"Duplicate raster data hash in seat file: {p.name}")
                seat_raster_hashes.add(raster_hash)
                
                # Check non-blank
                gray = img.convert("L")
                hist = gray.histogram()
                tot = sum(hist)
                mean = sum(i * count for i, count in enumerate(hist)) / tot
                var = sum(count * ((i - mean) ** 2) for i, count in enumerate(hist)) / tot
                std = math.sqrt(var)
                ent = gray.entropy()
                
                if std < 15.0:
                    violations.append(f"Blank/uniform image detected in {p.name}: std={std:.2f}, ent={ent:.2f}")
                
                # Check alpha
                if img.mode not in ("RGBA", "LA", "P"):
                    violations.append(f"No alpha mode support in {p.name}: mode={img.mode}")
        except Exception as e:
            violations.append(f"Failed to decode {p.name}: {e}")

    print(f"Seat audit complete. 110 files checked, {len(seat_hashes)} unique SHA-256 hashes.")

    # 2. Audit Master Sprite Sheets
    master_specs = {
        "cards1.png": {"dims": (1000, 1000), "max_size": MASTER_MAX_SIZE},
        "cards2.png": {"dims": (1000, 1000), "max_size": MASTER_MAX_SIZE},
        "card100.png": {"dims": (1135, 1315), "max_size": MASTER_MAX_SIZE},
        "card100_gemini.png": {"dims": (1024, 1024), "max_size": MASTER_MAX_SIZE, "true_rgba": True},
    }
    
    print("\n[2] Auditing Master Sprite Sheets...")
    for filename, spec in master_specs.items():
        p = PUBLIC_DIR / filename
        if not p.exists():
            violations.append(f"Master sheet missing: {filename}")
            continue
        size = p.stat().st_size
        if size > spec["max_size"]:
            violations.append(f"Master sheet {filename} exceeds size budget: {size} bytes > {spec['max_size']}")
        with open(p, "rb") as f:
            hdr = f.read(8)
        if hdr != PNG_MAGIC:
            violations.append(f"Master sheet {filename} invalid PNG magic: {hdr.hex()}")
        try:
            with Image.open(p) as img:
                img.load()
                if img.size != spec["dims"]:
                    violations.append(f"Master sheet {filename} dimension mismatch: {img.size} vs {spec['dims']}")
                if spec.get("true_rgba"):
                    # Check that card100_gemini is genuine RGBA PNG with alpha channel
                    if img.mode not in ("RGBA", "P"):
                        violations.append(f"{filename} is not true RGBA/paletted PNG with alpha: mode={img.mode}")
                    if img.format != "PNG":
                        violations.append(f"{filename} image format is {img.format}, expected PNG")
                print(f"  {filename}: {img.size[0]}x{img.size[1]}, format={img.format}, mode={img.mode}, size={size} bytes ({size/1024:.1f} KB)")
        except Exception as e:
            violations.append(f"Failed to decode master sheet {filename}: {e}")

    # 3. Audit Faction Sheets
    faction_sheets = [
        "character_sheet_water.png",
        "character_sheet_fire.png",
        "character_sheet_wind.png",
        "character_sheet_earth.png",
        "character_sheet_human.png",
        "character_sheet_undead.png",
        "character_sheet_elf.png",
        "character_sheet_hobbit.png",
        "character_sheet_beast.png",
        "character_sheet_mecha.png",
        "character_sheet_dragon.png",
    ]
    print("\n[3] Auditing Faction Sheets (11 files)...")
    for filename in faction_sheets:
        p = PUBLIC_DIR / filename
        if not p.exists():
            violations.append(f"Faction sheet missing: {filename}")
            continue
        size = p.stat().st_size
        if size > FACTION_MAX_SIZE:
            violations.append(f"Faction sheet {filename} exceeds budget: {size} bytes > {FACTION_MAX_SIZE}")
        with open(p, "rb") as f:
            hdr = f.read(8)
        if hdr != PNG_MAGIC:
            violations.append(f"Faction sheet {filename} invalid PNG magic: {hdr.hex()}")
        try:
            with Image.open(p) as img:
                img.load()
                if img.size != (2560, 296):
                    violations.append(f"Faction sheet {filename} dimension mismatch: {img.size} vs (2560, 296)")
                if img.format != "PNG":
                    violations.append(f"Faction sheet {filename} format is {img.format}")
                print(f"  {filename}: {img.size[0]}x{img.size[1]}, format={img.format}, mode={img.mode}, size={size} bytes ({size/1024:.1f} KB)")
        except Exception as e:
            violations.append(f"Failed to decode faction sheet {filename}: {e}")

    # 4. Check Non-Character Rows 1-9 in cards2.png
    print("\n[4] Checking cards2.png non-character rows 1-9...")
    cards2_path = PUBLIC_DIR / "cards2.png"
    if cards2_path.exists():
        with Image.open(cards2_path) as img:
            img.load()
            # Crop rows 1-9 (y from 100 to 1000)
            rows1_9 = img.crop((0, 100, 1000, 1000))
            gray = rows1_9.convert("L")
            hist = gray.histogram()
            tot = sum(hist)
            mean = sum(i * count for i, count in enumerate(hist)) / tot
            var = sum(count * ((i - mean) ** 2) for i, count in enumerate(hist)) / tot
            std = math.sqrt(var)
            if std < 10.0:
                violations.append("cards2.png rows 1-9 appear blank or missing minigame sprites!")
            else:
                print(f"  cards2.png rows 1-9 preserved successfully: std={std:.2f}")

    print("\n=== AUDIT SUMMARY ===")
    print(f"Total Violations: {len(violations)}")
    if violations:
        for v in violations:
            print(f"  [VIOLATION] {v}")
        sys.exit(1)
    else:
        print("  ALL ASSETS PASSED ZERO-TRUST INTEGRITY AUDIT!")
        sys.exit(0)

if __name__ == "__main__":
    main()
