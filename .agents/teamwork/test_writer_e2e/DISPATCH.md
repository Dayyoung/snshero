## 2026-10-18T01:45:05Z
You are the E2E Test Writer for the SNSHero 110-Hero Character Illustration Remaster project.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/test_writer_e2e/
You MUST read:
1. /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (under ## 2026-10-18T01:34:39Z)
2. /Users/dayyoung/project/snshero/PROJECT.md
3. /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/cards_dataset.json
4. /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_2/handoff.md

Write Ownership:
You exclusively own:
- /Users/dayyoung/project/snshero/TEST_INFRA.md
- /Users/dayyoung/project/snshero/TEST_READY.md
- /Users/dayyoung/project/snshero/tests/e2e_character_assets/ (and all test suites/scripts within)
You MUST NOT modify source files in src/ or asset files in public/.

Your Mission:
Design and implement a comprehensive, requirement-driven, opaque-box E2E test harness for the character illustration remaster:
1. Create TEST_INFRA.md at the project root documenting test architecture, methodology, and coverage thresholds per the template in PROJECT.md.
2. Build an automated E2E test runner in tests/e2e_character_assets/runner.py (or .ts/sh) covering 4 systematic tiers:
   - Tier 1: Feature Coverage (>=5 tests per feature):
     * Verify all 110 public/seat/*.png files exist, decode validly, exact 256x296 dimensions, 110 distinct SHA-256 hashes, 0 blank/uniform images.
     * Verify public/cards1.png (1000x1000) and public/cards2.png (1000x1000) exist and decode.
     * Verify public/card100.png (1135x1315) and public/card100_gemini.png (1024x1024 true RGBA) exist and decode.
     * Verify all 11 public/character_sheet_*.png exist, decode, and have exact dimensions 2560x296.
   - Tier 2: Boundary & Corner Cases (>=5 tests per feature):
     * File size budget checks: every public/seat/*.png must be >= 4,096 bytes and <= 35,840 bytes (35 KB).
     * Master sheets size budget: cards1, cards2, card100, card100_gemini must each be <= 819,200 bytes (800 KB).
     * Faction sheets size budget: every character_sheet_*.png must be <= 307,200 bytes (300 KB).
     * Non-character row preservation: verify rows 1–9 of cards2.png are preserved or cleanly formatted without corruption.
     * Boundary card ID transition: ID 100 in cards1 vs ID 101 in cards2 row 0 col 0; ID 110 in cards2 row 0 col 9.
     * PNG Magic header bytes check: verify first 8 bytes of all PNG assets match \x89PNG\r\n\x1a\n (catches UTF-8 replacement byte corruptions).
   - Tier 3: Cross-Feature Combinations & Sprite Coordinate Alignment (pairwise coverage):
     * Test each card ID 1–110: verify cell coordinates in cards1/cards2/card100/card100_gemini and character_sheet_* match getCardSpriteCoords formulas from src/lib/utils.ts.
     * Sample pixel similarity between public/seat/<Card>.png and the sliced cell from the sprite sheets to confirm exact visual synchronization without cropping drift or sub-pixel bleeding.
   - Tier 4: Real-World Scenarios:
     * Simulate card rendering in CardItem and CanvasCardRenderer across all 11 factions and 4 rarity tiers.
     * Total asset payload audit: calculate total web transfer size and verify it is dramatically reduced.
3. Execute the test runner, verify it accurately fails current unmet requirements and passes met ones.
4. When the test suite and runner are complete and ready, generate TEST_READY.md at project root with test invocation commands, coverage breakdown, and feature checklist.
5. Write your handoff report to /Users/dayyoung/project/snshero/.agents/teamwork/test_writer_e2e/handoff.md and notify your caller with send_message.
