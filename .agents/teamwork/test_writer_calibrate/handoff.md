# Handoff Report — Test Oracle Calibration (T1.F2.5 & Feature 2 Verification)

**Agent**: Test Writer (Calibration) (`test_writer`, `specialist`, `qa`)  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/test_writer_calibrate/`  
**Milestone**: Milestone 1 Test Oracle Calibration  
**Parent Orchestrator ID**: `f84aca46-e09f-4967-b5d1-281f855a924e`  
**Date**: 2026-10-18T02:18:00Z  

---

## 1. Observation

### 1.1 Root Cause & Mathematical Characteristics of TCG Card Portraits
1. **Oracle Definition in `tests/e2e_character_assets/helpers.py:319` (Legacy)**:
   ```python
   is_rich = entropy >= 2.0 and std_dev >= 8.0
   ```
2. **Mathematical Analysis of `public/seat/*.png` Portraits**:
   - Total pixels per card: $256 \times 296 = 75,776$ pixels.
   - White / light background pixels: $> 90\%$ (over 68,000 pixels at bin 255).
   - Global grayscale Shannon entropy across all 110 cards:
     * Minimum: `0.3278` bits
     * Maximum: `0.7614` bits
     * Legacy unremastered baseline cards (commit `94a5ac5b`): 1.34 to 1.63 bits (also failed `entropy >= 2.0`).
   - Character artwork texture standard deviation across all 110 cards:
     * Minimum: `44.24`
     * Maximum: `74.82`
     * Well above the `std_dev >= 8.0` threshold, reflecting rich non-blank illustration content.
   - Foreground entropy (excluding dominant white background bin):
     * Minimum: `0.7843`
     * Maximum: `3.7543`
   - Due to the rigid global `entropy >= 2.0` requirement, all 110 valid, remastered, non-blank cards were falsely categorized as "blank or flat uniform portraits".

### 1.2 Verification Command Executions

1. **Feature 2 Isolated E2E Verification**:
   ```bash
   python3 tests/e2e_character_assets/runner.py --tier 1 --feature 2
   ```
   - **Exit Code**: `0` (ALL PASS)
   - **Verbatim Output**:
     ```
     === [TIER 1] Feature Coverage & Asset Integrity (public/seat, master, faction sheets) ===
       ✓ PASS [T1.F2.1] All 110 Seat Files Exist on Disk (1.0ms)
       ✓ PASS [T1.F2.2] All 110 Seat Files Decode Validly (54.9ms)
       ✓ PASS [T1.F2.3] All 110 Seat Files Exact 256x296 Dimensions (0.0ms)
       ✓ PASS [T1.F2.4] 110 Distinct SHA-256 Hashes Across Seat Portraits (3.5ms)
       ✓ PASS [T1.F2.5] Zero Blank or Uniform Color Images in Seat Portraits (70.2ms)
       ✓ PASS [T1.F2.6] Alpha Transparency Preserved Across Seat Portraits (0.1ms)

     ----------------------------------------------------------------------
       E2E Test Execution Summary (0.35s)
     ----------------------------------------------------------------------
       Total Assertions   : 6
       Passed Assertions  : 6
       Failed Assertions  : 0
       Warnings           : 0
       Pass Rate          : 100.0%

     STATUS: ALL E2E REQUIREMENTS VERIFIED 100% SATISFIED!
     ```

2. **Full Tier 1 Verification**:
   ```bash
   python3 tests/e2e_character_assets/runner.py --tier 1
   ```
   - **Exit Code**: `1` (3 remaining failures accurately isolating pending Milestone 2 deliverables).
   - **Verbatim Output**:
     - All 6 Feature 2 assertions PASS (6/6).
     - All 7 Feature 3 assertions PASS (7/7).
     - Feature 4: `T1.F4.5` (JPEG detection) & `T1.F4.7` (lacks alpha) fail (scoped for Milestone M2).
     - Feature 5: `T1.F5.2` (3 corrupted faction sheets) fails (scoped for Milestone M2).
     - Feature 5: `T1.F5.5` (Non-blank artwork across faction cells) PASSES (calibrated check validates all decoded cells).
     - Total: 22 / 25 Passing (88.0% pass rate).

3. **Full 50-Assertion Baseline Suite**:
   ```bash
   python3 tests/e2e_character_assets/runner.py --allow-fail
   ```
   - **Summary**: 39 Passed, 11 Failed (0 unhandled crashes, 78.0% pass rate).
   - The 11 failing assertions accurately track remaining deliverables:
     * 7 for Milestone M2 (sprite sheet assembly, JPEG-to-PNG conversion, corrupted header recovery)
     * 4 for Milestone M3 (FASTOCTREE palette quantization, payload budgets)

4. **TypeScript Type Safety**:
   ```bash
   npx tsc --noEmit
   ```
   - **Exit Code**: `0` (0 errors).

5. **Mandatory Google Form Submission**:
   - Script `python3 skills/report-ex/scripts/submit_report.py` executed successfully.

---

## 2. Logic Chain

1. **Identification of False Failure**:
   The TCG portraits in `public/seat/*.png` feature characters rendered on white backdrops. In Shannon information theory, when $p_{\text{white}} \ge 0.90$, entropy $-\sum p_i \log_2 p_i$ is suppressed regardless of the textural richness of the remaining pixels. Requiring `entropy >= 2.0` on whole-image grayscale forced a 100% false-positive rate on authentic cards (Observation 1.1).

2. **Formulation of Calibrated Test Oracle**:
   To faithfully test for "Non-Blank / Non-Uniform Color Artwork" without false positives:
   - Evaluated `std_dev >= 15.0`: Any flat or uniform color (pure white, pure black, solid gray, solid red, or uniform transparent) yields `std_dev = 0.0 < 15.0`, failing immediately.
   - Evaluated `(entropy >= 0.25 or fg_entropy >= 1.5)`: Authentic TCG portraits yield $H \ge 0.33$ and $\text{std} \ge 44.24$, correctly passing.
   - Computed `fg_entropy` by isolating non-background bins when a single bin comprises $>50\%$ of pixels.

3. **Adversarial Hardening**:
   Directly inside `T1.F2.5` (`tier1_feature_coverage.py:197`), added synthetic validation:
   - Synthetic solid white `(255, 255, 255)`
   - Synthetic solid black `(0, 0, 0)`
   - Synthetic solid gray `(128, 128, 128)`
   - Synthetic full transparency `(0, 0, 0, 0)`
   All synthetic uniform images are strictly rejected by the oracle, verifying test integrity.

4. **Progressive Testability in Test Runner (`runner.py`)**:
   In adherence to the Progressive Testability principle, added `--feature` (`-f`) and `--milestone` (`-m`) options to `runner.py`. This allows workers and reviewers to execute only the assertions scoped to Milestone 1 (`--tier 1 --feature 2`), achieving a clean exit code 0 when M1 requirements are fulfilled, while preserving full baseline auditing across future milestones.

---

## 3. Caveats

- **Scope Boundary**: This calibration strictly addresses the test harness oracle and runner. Implementation files for Milestone 2 (`cards1.png`, `cards2.png`, `card100.png`, `card100_gemini.png`, and 11 faction horizontal sheets) and Milestone 3 (palette quantization) were NOT modified and remain the responsibility of `worker_m2` and `worker_m3`.
- **Warning Suppression**: Pillow raises a minor benign warning (`Palette images with Transparency expressed in bytes should be converted to RGBA images`) when decoding paletted PNGs with alpha chunks; this does not affect decoding or image analysis.

---

## 4. Conclusion

1. **Milestone 1 Test Oracle Calibrated**:
   `tests/e2e_character_assets/helpers.py:293` is calibrated with `std_dev >= 15.0 and (entropy >= 0.25 or fg_entropy >= 1.5)`.
2. **Milestone 1 Feature 2 Verified 100% PASS**:
   All 110 portraits in `public/seat/*.png` pass all 6 Feature 2 assertions (`T1.F2.1` to `T1.F2.6`).
   Running `python3 tests/e2e_character_assets/runner.py --tier 1 --feature 2` exits with code `0`.
3. **Adversarial Validation Clean**:
   Synthetic blank images (white, black, gray, transparent) are strictly rejected.
4. **Project Baseline Updated in `TEST_READY.md`**:
   Baseline passed assertions updated from 37 to 39 (78.0% pass rate), with remaining 11 failing assertions accurately mapped to Milestone 2 (7) and Milestone 3 (4).
5. **Project Hygiene**:
   `npx tsc --noEmit` clean (0 errors), `WORK_LOGS.md` logged, and Google Form report submitted.

---

## 5. Verification Method

To independently reproduce and verify this calibration:

```bash
# 1. Run Tier 1 Feature 2 E2E tests (observe 6/6 PASS and Exit Code 0):
python3 tests/e2e_character_assets/runner.py --tier 1 --feature 2

# 2. Run Tier 1 full suite (observe 22/25 PASS, with remaining 3 failures isolated to M2):
python3 tests/e2e_character_assets/runner.py --tier 1

# 3. Run full baseline audit (observe 39/50 PASS, 78.0% pass rate):
python3 tests/e2e_character_assets/runner.py --allow-fail

# 4. Verify TypeScript compilation:
npx tsc --noEmit

# 5. Verify adversarial rejection of blank/uniform images:
python3 -c "
from PIL import Image
from tests.e2e_character_assets.helpers import check_image_entropy_and_variance

for name, img in [
    ('white', Image.new('RGB', (256, 296), (255, 255, 255))),
    ('black', Image.new('RGB', (256, 296), (0, 0, 0))),
    ('gray', Image.new('RGB', (256, 296), (128, 128, 128))),
    ('trans', Image.new('RGBA', (256, 296), (0, 0, 0, 0))),
]:
    rich, ent, std = check_image_entropy_and_variance(img)
    assert not rich, f'{name} must be rejected'
print('Adversarial blank rejection verified 100%!')
"
```
