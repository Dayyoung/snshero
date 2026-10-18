#!/usr/bin/env python3
"""
Adversarial Verification of Test Oracle Sensitivity
Tests whether the E2E test suite correctly fails when given corrupted, mismatched, or out-of-budget inputs.
"""

import sys
from pathlib import Path
from PIL import Image
import numpy as np

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
sys.path.insert(0, str(PROJECT_ROOT))

from tests.e2e_character_assets.helpers import (
    check_png_magic_header,
    check_image_entropy_and_variance,
    calculate_image_similarity,
    get_card_sprite_coords,
    PNG_MAGIC_BYTES,
    UTF8_REPLACEMENT_PREFIX,
)

def test_oracle_sensitivity():
    print("=== Testing Test Oracle Sensitivity & Tamper Resistance ===")
    anomalies = []

    # 1. Header corruption detection
    test_corrupt_file = PROJECT_ROOT / ".agents/teamwork/auditor_m2_1/temp_corrupt.png"
    with open(test_corrupt_file, "wb") as f:
        f.write(b"\xef\xbf\xbdPNG\r\n\x1a\n" + b"\x00" * 100)
    
    is_valid, msg, _ = check_png_magic_header(test_corrupt_file)
    if is_valid:
        anomalies.append("check_png_magic_header accepted UTF-8 replacement byte corrupt header!")
    else:
        print(f"[PASS] Header oracle correctly rejected corrupted header: {msg}")
    
    if test_corrupt_file.exists():
        test_corrupt_file.unlink()

    # 2. Blank image rejection
    blank_white = Image.new("RGBA", (256, 296), (255, 255, 255, 255))
    is_rich, ent, std = check_image_entropy_and_variance(blank_white)
    if is_rich:
        anomalies.append("check_image_entropy_and_variance accepted solid white image as rich artwork!")
    else:
        print(f"[PASS] Blank oracle correctly rejected solid white image (std={std:.2f}, ent={ent:.2f})")

    blank_black = Image.new("RGBA", (256, 296), (0, 0, 0, 255))
    is_rich, ent, std = check_image_entropy_and_variance(blank_black)
    if is_rich:
        anomalies.append("check_image_entropy_and_variance accepted solid black image as rich artwork!")
    else:
        print(f"[PASS] Blank oracle correctly rejected solid black image (std={std:.2f}, ent={ent:.2f})")

    # 3. Image similarity sensitivity
    # Compare card 1 (water) with card 20 (fire)
    from tests.e2e_character_assets.helpers import load_card_dataset, get_card_seat_filename
    cards = load_card_dataset()
    card_1 = next(c for c in cards if c["id"] == 1)
    card_20 = next(c for c in cards if c["id"] == 20)
    seat_1 = Image.open(PROJECT_ROOT / "public/seat" / get_card_seat_filename(card_1))
    seat_20 = Image.open(PROJECT_ROOT / "public/seat" / get_card_seat_filename(card_20))
    black_img = Image.new("RGBA", (256, 296), (0, 0, 0, 255))
    sim_black = calculate_image_similarity(seat_1, black_img)
    print(f"[INFO] Similarity between Aquaris and solid black: {sim_black:.4f}")
    if sim_black >= 0.50:
        anomalies.append(f"calculate_image_similarity gave {sim_black:.4f} (>= 0.50) to solid black image!")
    else:
        print(f"[PASS] calculate_image_similarity correctly rejected solid black image (sim={sim_black:.4f})")

    # 4. Coordinate math sensitivity
    # If someone asks for ID 105 in cards1 instead of cards2
    c_105 = get_card_sprite_coords(105)
    if c_105["source"] != "/cards2.png":
        anomalies.append(f"get_card_sprite_coords(105) returned {c_105['source']}, expected /cards2.png")
    else:
        print(f"[PASS] get_card_sprite_coords(105) correctly routes to {c_105['source']}")

    assert len(anomalies) == 0, f"Oracle sensitivity anomalies found: {anomalies}"
    print("All test oracle sensitivity checks passed 100%! Tests are genuine and tamper-resistant.")

if __name__ == "__main__":
    test_oracle_sensitivity()
