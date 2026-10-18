## 2026-10-18T20:12:28Z
You are the Test Writer for the E2E Testing Track of the SNSHero RPG mode overhaul.
Your working directory is:
/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_test_writer_e2e_1/

MANDATORY: Read the original user request first:
/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md

Reference files to read:
- /Users/dayyoung/project/snshero/PROJECT.md

File ownership:
You EXCLUSIVELY own:
1. `tests/e2e_rpg/` (all test files and runners inside this folder)
2. `TEST_INFRA.md` at project root
3. `TEST_READY.md` at project root
Do NOT modify application source code in `src/`.

Your mission:
Design and build a comprehensive, requirement-driven, opaque-box E2E test suite for the 40-chapter RPG mode:
1. Methodology: Follow the 4-tier approach specified in `PROJECT.md`:
   - Tier 1: Feature Coverage (≥5 tests per feature: F1 Storyline sync, F2 Scripts, F3 Choices data, F4 Choices UI, F5 Countdown Timer, F8 Random Encounters, F12 Auto-Play)
   - Tier 2: Boundary & Corner Cases (Chapter 1 initialization, Chapter 40 epilogue/reincarnation, timer expiry auto-select, safe loss on ambush, 0 buff battle state, negative/overflow inputs)
   - Tier 3: Cross-Feature Combinations (Pairwise interactions: Auto-play + Ambush encounter + Dialogue choice auto-pick + Boss victory; Buff acquisition in dialogue + Battle power increase)
   - Tier 4: Real-World Workload Scenarios (Full 40-chapter playthrough simulation under auto-play mode, verifying zero stalls, 100% hands-free completion)
2. Build test runner: `tests/e2e_rpg/run_rpg_e2e_tests.py` that can be run via:
   `python3 tests/e2e_rpg/run_rpg_e2e_tests.py`
   It should return exit code 0 when all tests pass and print a structured summary table.
3. Create `TEST_INFRA.md` at project root following the standard template in `PROJECT.md`.
4. When the test suite and runner are verified and ready, create `TEST_READY.md` at project root.
5. Write your handoff to:
   /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_test_writer_e2e_1/handoff.md

Send a completion message back to orchestrator_6 when finished.
