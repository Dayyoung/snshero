## 2026-10-18T02:18:57Z
You are Worker M2 for the SNSHero 110-Hero Character Illustration Remaster project.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m2/
You MUST read:
1. /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (under ## 2026-10-18T01:34:39Z)
2. /Users/dayyoung/project/snshero/PROJECT.md
3. /Users/dayyoung/project/snshero/TEST_READY.md
4. /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_2/handoff.md (contains exact grid coordinates, cell dimensions, and slice math)
5. /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/handoff.md (contains proven Python Pillow FASTOCTREE quantization script)
6. /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1/handoff.md

Write Ownership:
You exclusively own:
- /Users/dayyoung/project/snshero/public/cards1.png
- /Users/dayyoung/project/snshero/public/cards2.png
- /Users/dayyoung/project/snshero/public/card100.png
- /Users/dayyoung/project/snshero/public/card100_gemini.png
- /Users/dayyoung/project/snshero/public/character_sheet_*.png (all 11 faction horizontal sheets)
- Scratch scripts and tools in your working directory /Users/dayyoung/project/snshero/.agents/teamwork/worker_m2/
You MUST NOT modify source files in src/ or tests in tests/.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Mission (Milestone 2 & 3: Sprite Sheet Assembly & Palette Optimization):
1. Assemble Primary 10x10 Sprite Sheets:
   - `public/cards1.png` (1000x1000 px, 10x10 grid for IDs 1–100, cells 100x100 px). Composite the remastered 256x296 portraits from public/seat/*.png resized to 100x100 with aspect-fill/center-crop, matching getCardSpriteCoords formula: col = (id - 1) % 10, row = (id - 1) // 10.
   - `public/cards2.png` (1000x1000 px, 10x10 grid). Place IDs 101–110 in Row 0 (col = id - 101, row = 0). CRITICAL: preserve existing non-character rows 1–9 from original cards2.png without corruption or alteration!
2. Assemble Legacy Master 10x11 Sheets:
   - `public/card100.png` (1135x1315 px, 10x11 grid for IDs 1–110, cells 113.5 x 119.545 px).
   - `public/card100_gemini.png` (1024x1024 px, 10x11 grid for IDs 1–110, cells 102.4 x 93.091 px). CRITICAL: Ensure this is output as a true, valid RGBA PNG (replacing the legacy JPEG-in-PNG file).
3. Assemble All 11 Faction Horizontal Sheets:
   - `public/character_sheet_*.png` (2560x296 px, 10 horizontal cells of 256x296 px each):
     * character_sheet_water.png (IDs 1–10)
     * character_sheet_fire.png (IDs 11–20)
     * character_sheet_wind.png (IDs 21–30)
     * character_sheet_earth.png (IDs 31–40)
     * character_sheet_human.png (IDs 41–50)
     * character_sheet_undead.png (IDs 51–60)
     * character_sheet_elf.png (IDs 61–70)
     * character_sheet_hobbit.png (IDs 71–80, Dwarf/Hobbit faction)
     * character_sheet_beast.png (IDs 81–90, Monster/Beast faction)
     * character_sheet_mecha.png (IDs 91–100, Robot/Mecha faction)
     * character_sheet_dragon.png (IDs 101–110, Dragon faction)
   - Repair any legacy header corruptions (e.g. fire, hobbit, mecha) with pristine PNG headers (\x89PNG\r\n\x1a\n).
4. Apply Pillow FASTOCTREE Palette Quantization:
   - All 4 master sheets (`cards1.png`, `cards2.png`, `card100.png`, `card100_gemini.png`) MUST be <= 819,200 bytes (800 KB).
   - All 11 faction sheets MUST be <= 307,200 bytes (300 KB).
5. Comprehensive Verification:
   - Run `python3 tests/e2e_character_assets/runner.py` and verify all 50 assertions pass (100.0%, Exit Code 0).
   - Run `npx tsc --noEmit` (0 errors).
   - Run `npm run build` (0 errors).
6. Log work in `WORK_LOGS.md`, commit locally (`git commit` without push), and submit the Google Form report via `python3 skills/report-ex/scripts/submit_report.py`.
7. Write your full handoff report to `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m2/handoff.md` and notify caller via send_message.
