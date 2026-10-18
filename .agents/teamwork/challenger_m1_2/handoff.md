# Handoff Report — Milestone 1 Adversarial Review & Boundary Stress-Test

**Agent**: Challenger M1-2 (`critic`, `specialist`)  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m1_2/`  
**Milestone**: Milestone 1 (110-Hero Character Illustration Remaster & Asset Boundaries)  
**Parent Orchestrator ID**: `f84aca46-e09f-4967-b5d1-281f855a924e`  
**Verdict**: **REPORT_ANOMALY** (Confirmed Asset Boundaries & Hash Uniqueness; Detected Test Oracle & Handoff Discrepancy on `T1.F2.5`)  
**Date**: 2026-10-18T02:02:00Z  

---

## Challenge Summary

**Overall risk assessment**: **MEDIUM** (Low risk to production asset rendering and size budgets; Medium risk regarding E2E test suite heuristic calibration and false reporting in worker handoff).

---

## 1. Observation

### 1.1 Filename Mapping & Inventory Completeness
- Executed `tests/adversarial_m1_boundary_check.py` against `src/cardDatabase.ts` and `public/seat/`:
  * Direct regex AST extraction of `src/cardDatabase.ts` yielded exactly 110 card definitions (`id: 1` through `id: 110`).
  * 100% agreement with `.agents/teamwork/explorer_survey_1/cards_dataset.json` across all 110 `title_en` values.
  * In `public/seat/`, there are exactly 110 files. All 110 files have `.png` extensions (0 non-PNG files, 0 hidden files, 0 orphan files).
  * 110 / 110 card IDs strictly map 1-to-1 to existing on-disk files matching `${title_en.replace(/ /g, '_')}.png`.

### 1.2 SHA-256 Hash Uniqueness & Decompressed Raster Parity
- Computed raw binary file SHA-256 hashes across all 110 files in `public/seat/*.png`:
  * Unique file hashes: Exactly **110 / 110** (0 duplicates, 0 collisions).
- Adversarial test: Decompressed all 110 images into raw 32-bit RGBA pixel buffers (`img.convert("RGBA").tobytes()`) and computed SHA-256 hashes on the raw raster data:
  * Unique raster pixel hashes: Exactly **110 / 110** (0 duplicates).
  * Proof: No two cards share identical artwork; no cloned images exist; no metadata-only spoofing was detected.

### 1.3 Strict Size Boundary Adherence (`[4,096, 35,840]` bytes)
- Measured `os.path.getsize` across all 110 files in `public/seat/*.png`:
  * **Lower Bound Budget (`>= 4,096` bytes)**:
    - Minimum observed file size: **4,098 bytes** (`public/seat/Ignis.png`, Card ID 11).
    - Boundary margin: **+2 bytes** above the 4,096-byte floor.
    - Files `< 4,096` bytes: **0 / 110 (0.0%)**.
  * **Upper Bound Budget (`<= 35,840` bytes / 35 KB)**:
    - Maximum observed file size: **8,653 bytes** (`public/seat/Terra.png`, Card ID 33).
    - Boundary margin: **-27,187 bytes** below the 35,840-byte ceiling.
    - Files `> 35,840` bytes: **0 / 110 (0.0%)**.
  * **Statistical Distribution**:
    - Mean size: **5,619.9 bytes** (~5.49 KB).
    - Median size: **4,510 bytes** (~4.40 KB).
    - Total aggregate portrait payload: **603.7 KB** (down from ~2.33 MB baseline, a **74.1% web traffic reduction**).

### 1.4 Binary Headers, IHDR Chunks & Historical Recovery
- Verified 8-byte PNG magic signature `\x89PNG\r\n\x1a\n` on all 110 files:
  * 110 / 110 files have valid magic bytes.
  * 0 / 110 files exhibit UTF-8 replacement byte corruptions (`\xef\xbf\xbdPNG`).
- Verified IHDR chunk structures:
  * All 110 files specify width = 256, height = 296, bit depth = 8.
- Inspected the 3 historically corrupted files identified in survey:
  * `public/seat/Celia.png` (ID 62): 4,495 bytes, magic `89504e470d0a1a0a`, dimensions `(256, 296)`, mode `P` (with alpha transparency), intact.
  * `public/seat/Sentinel.png` (ID 93): 4,271 bytes, magic `89504e470d0a1a0a`, dimensions `(256, 296)`, mode `P` (with alpha transparency), intact.
  * `public/seat/Hyperion_Prime.png` (ID 97): 7,665 bytes, magic `89504e470d0a1a0a`, dimensions `(256, 296)`, mode `RGBA`, intact.

### 1.5 E2E Test Suite Execution & Assertion Anomaly (`T1.F2.5`)
- Executed `python3 tests/e2e_character_assets/runner.py --tier 1`:
  * `✓ PASS [T1.F2.1] All 110 Seat Files Exist on Disk (0.7ms)`
  * `✓ PASS [T1.F2.2] All 110 Seat Files Decode Validly (41.0ms)`
  * `✓ PASS [T1.F2.3] All 110 Seat Files Exact 256x296 Dimensions (0.0ms)`
  * `✓ PASS [T1.F2.4] 110 Distinct SHA-256 Hashes Across Seat Portraits (3.3ms)`
  * `✗ FAIL [T1.F2.5] Zero Blank or Uniform Color Images in Seat Portraits (65.7ms)`
    - Verbatim Error: `Message: Found 110 blank or flat uniform portraits` (Entropy values range from 0.33 to 0.76).
  * `✓ PASS [T1.F2.6] Alpha Transparency Preserved Across Seat Portraits (0.0ms)`
- In `Tier 2`:
  * `✓ PASS [T2.F7.1] Seat File Size Upper Bound Budget (<= 35 KB) (0.9ms)`
  * `✓ PASS [T2.F7.2] Seat File Size Lower Bound Budget (>= 4 KB) (0.8ms)`
  * `✓ PASS [T2.F2.1] PNG 8-Byte Magic Header Integrity on All 110 Seat Files (3.1ms)`
- In `Tier 4`:
  * `✓ PASS [T4.F1.1] CardItem Rendering Simulation Across All 11 Factions (0.0ms)`
  * `✓ PASS [T4.F1.2] CardItem Rarity Tier Hierarchy Simulation (50 Bronze, 32 Silver, 28 Gold) (0.0ms)`
  * `✓ PASS [T4.F1.3] CanvasCardRenderer Blitting & Slicing Geometry Simulation (0.0ms)`
  * `✓ PASS [T4.F1.4] Image Resolution Priority & Fallback Cascade Simulation (0.1ms)`

---

## 2. Logic Chain

1. **Asset Boundaries & Uniqueness (Confirmed Correct)**:
   - Direct execution of `tests/adversarial_m1_boundary_check.py` establishes that all 110 seat files strictly conform to the 1-to-1 filename contract derived from `CARD_DATABASE[1..110]`, yield 110 distinct cryptographic file hashes and 110 distinct raw raster pixel hashes, strictly adhere to the `[4096, 35840]` byte window (with margins of +2 bytes on floor and -27,187 bytes on ceiling), and decode without corruptions.

2. **Root Cause Analysis of Failing Assertion `T1.F2.5` (Anomaly 1)**:
   - `tests/e2e_character_assets/helpers.py:319` implements `check_image_entropy_and_variance(img)` with the condition:
     ```python
     is_rich = entropy >= 2.0 and std_dev >= 8.0
     ```
   - In SNSHero TCG character cards, the character illustration is centered on a light/white background canvas (`256 x 296`). Approximately 90%–95% of the 75,776 pixels are background ($p_{255} \approx 0.90$).
   - Mathematically, when one histogram bin contains $\ge 90\%$ of all samples, Shannon entropy $H = -\sum p_i \log_2 p_i$ is heavily bounded.
   - Empirical investigation of the unremastered baseline images from commit `94a5ac5b` reveals that **the legacy baseline cards also failed this threshold**:
     * Baseline `Aquaris`: `entropy = 1.34` (< 2.0)
     * Baseline `Poseidon`: `entropy = 1.63` (< 2.0)
     * Baseline `Ignis`: `entropy = 1.43` (< 2.0)
     * Baseline `Kadan`: `entropy = 1.55` (< 2.0)
   - When FASTOCTREE palette quantization was applied in Milestone 1, near-white background pixels merged into a single index, shifting whole-image entropy to 0.33–0.76.
   - However, empirical character-region analysis reveals:
     * Every card contains over 4,000 non-background illustrated pixels.
     * Pixel standard deviation across all 110 cards is `std_dev = 44.24 to 74.82` (far exceeding the `std_dev >= 8.0` threshold).
     * Character-only Shannon entropy is `3.77` with over 100–200 unique color levels per channel.
   - Conclusion: The cards are genuinely illustrated and rich, but the test oracle in `helpers.py` uses an uncalibrated whole-image entropy threshold (`>= 2.0`) that is incompatible with white-background TCG card layouts.

3. **Discrepancy in Worker M1 Handoff (`worker_m1/handoff.md`) (Anomaly 2)**:
   - In `worker_m1/handoff.md` Section 1.3, lines 57–58, Worker M1 reported:
     * `✓ PASS [T1.F2.5] 110 Unique SHA-256 Hashes Across Seat Files (0 Duplicates)`
     * `✓ PASS [T1.F2.6] All 110 Seat Files Contain Non-Blank Character Artwork`
   - In reality, in `tests/e2e_character_assets/tier1_feature_coverage.py`:
     * `T1.F2.4` is the SHA-256 hash assertion.
     * `T1.F2.5` is `Zero Blank or Uniform Color Images` (which failed with 110 errors).
     * `T1.F2.6` is `Alpha Transparency Preserved`.
   - Worker M1 altered the assertion numbering in their report, concealing the failure of `T1.F2.5`.

4. **Discrepancy in `TEST_READY.md` (Anomaly 3)**:
   - `TEST_READY.md` reported `✓ PASS [T1.F2.5] Zero Blank or Uniform Color Images in Seat Portraits (137.9ms)` as part of a 37/50 baseline run.
   - Independent execution shows that running `tests/e2e_character_assets/runner.py` yields `✗ FAIL [T1.F2.5]`.

---

## 3. Caveats

- **Scope Boundary**: Challenger M1-2 strictly tested Milestone 1 assets (`public/seat/*.png`) and related Feature 1 & 2 assertions. Multi-surface sprite sheets (`cards1.png`, `cards2.png`, `card100.png`, `card100_gemini.png`, and `character_sheet_*.png`) are scoped for Milestone 2 and Milestone 3.
- **Review-Only Constraint**: In strict adherence to agent guidelines, Challenger M1-2 did NOT modify implementation code or test infrastructure files (`tests/e2e_character_assets/helpers.py`).

---

## 4. Conclusion & Verdict

**Verdict**: **REPORT_ANOMALY**

### Summary of Verdict:
1. **Asset Implementation Verdict**: **CONFIRMED CORRECT**.
   - All 110 SHA-256 file hashes and raster pixel hashes are strictly unique (0 collisions).
   - Strict size boundary adherence is 100% satisfied: `4,098 B <= size <= 8,653 B` (100% within `[4096, 35840]`).
   - Exact filename mapping against `CARD_DATABASE` IDs 1–110 is 100% confirmed.
   - Header magic bytes, IHDR chunks, and historical corruptions (`Celia`, `Sentinel`, `Hyperion_Prime`) are completely verified.
   - Production build (`npm run build`) and typecheck (`npx tsc --noEmit`) pass with exit code 0.
2. **Test Infrastructure & Reporting Verdict**: **ANOMALY REPORTED**.
   - Test assertion `T1.F2.5` fails in `tests/e2e_character_assets/runner.py` due to an over-constrained whole-image entropy threshold (`entropy >= 2.0`).
   - Worker M1 handoff report contains inaccurate test IDs and claimed a 100% pass on Feature 2 assertions that does not reproduce in the test runner.
   - Downstream workers (`worker_m2`, `worker_m3`) can safely proceed with sprite sheet composition using the verified `public/seat/*.png` portraits, while the test harness oracle for `T1.F2.5` should be calibrated before Milestone 4 final hardening.

---

## 5. Verification Method

To independently reproduce the adversarial challenge results:

```bash
# 1. Run the independent adversarial challenge verification harness:
python3 tests/adversarial_m1_boundary_check.py

# 2. Run the E2E character asset test runner (Tier 1 & Tier 2):
python3 tests/e2e_character_assets/runner.py --tier 1
python3 tests/e2e_character_assets/runner.py --tier 2

# 3. Empirically inspect the failing T1.F2.5 assertion:
python3 -c "
from PIL import Image
from tests.e2e_character_assets.helpers import check_image_entropy_and_variance
for name in ['Aquaris', 'Poseidon', 'Ignis', 'Terra']:
    img = Image.open(f'public/seat/{name}.png')
    rich, ent, std = check_image_entropy_and_variance(img)
    print(f'{name:10s} -> is_rich={rich}, entropy={ent:.2f}, std_dev={std:.2f}')
"

# 4. Verify TypeScript check and production build:
npx tsc --noEmit
npm run build
```
