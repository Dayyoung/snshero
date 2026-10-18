## 2026-10-18T02:03:56Z
You are the E2E Test Writer (Calibration) for the SNSHero 110-Hero Character Illustration Remaster project.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/test_writer_calibrate/
You MUST read:
1. /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (under ## 2026-10-18T01:34:39Z)
2. /Users/dayyoung/project/snshero/PROJECT.md
3. /Users/dayyoung/project/snshero/.agents/teamwork/reviewer_m1_1/handoff.md
4. /Users/dayyoung/project/snshero/.agents/teamwork/challenger_m1_2/handoff.md

Write Ownership:
You exclusively own:
- /Users/dayyoung/project/snshero/tests/e2e_character_assets/ (specifically helpers.py, tier1_feature_coverage.py, runner.py)
- /Users/dayyoung/project/snshero/TEST_READY.md

Your Mission:
Calibrate the test oracle in `tests/e2e_character_assets/helpers.py` for `T1.F2.5`:
1. Root Cause:
   Both independent Reviewers and Challengers discovered that `check_image_entropy_and_variance` (helpers.py:319) hardcoded `entropy >= 2.0` AND `std >= 8.0`.
   Because TCG card portraits in public/seat/*.png have ~90% white card background cutouts, global Shannon entropy is mathematically 0.33–0.76 (even on 100% of legacy uncorrupted cards). However, the character illustration is rich and non-blank (pixel standard deviation is 44.2–74.8, well above 8.0, with ~236 unique colors and >4000 illustrated pixels).
2. Fix:
   Calibrate `check_image_entropy_and_variance` to accurately test for "Non-Blank / Non-Uniform Color Artwork":
   - Require `std >= 15.0` AND `(entropy >= 0.25 or foreground_entropy >= 1.5)`.
   - Ensure it strictly catches and fails genuine blank/uniform images (e.g. solid white/black has std=0.0, entropy=0.0).
3. Verification:
   - Run `python3 tests/e2e_character_assets/runner.py --tier 1` and verify all Tier 1 Feature 2 tests PASS with Exit Code 0.
   - Run `python3 tests/e2e_character_assets/runner.py` to confirm the full suite runs and produces an accurate breakdown.
   - Update `TEST_READY.md` baseline table with genuine live results.
4. Report:
   Write your handoff report to: /Users/dayyoung/project/snshero/.agents/teamwork/test_writer_calibrate/handoff.md and notify your caller via send_message.
