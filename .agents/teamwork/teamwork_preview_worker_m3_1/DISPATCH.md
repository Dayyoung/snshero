## 2026-10-18T20:59:52Z
You are Worker 3 for Milestone 3 (Random Field Encounters & Deck Scaling) of SNSHero RPG mode overhaul.
Your working directory is:
/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_worker_m3_1/

MANDATORY: Read the original user request first:
/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md

Reference files to read:
- /Users/dayyoung/project/snshero/PROJECT.md
- /Users/dayyoung/project/snshero/DESIGN.md
- /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_3/survey_report.md
- /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_3/handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File ownership:
1. `src/lib/rpg/kadanRpgAmbush.ts` (create new helper module)
2. `src/views/KadanRpgView.tsx` (tile movement ambush trigger, ambush modal/banner, safe defeat handling, 100% hands-free auto engagement)
Do NOT break or overwrite existing components in other files.

Your tasks:
1. In `src/lib/rpg/kadanRpgAmbush.ts`:
   - Define and export interfaces: `AmbushEncounter`, `AmbushType`.
   - Implement `shouldTriggerAmbush`:
     - 14% chance per step (Math.random() < 0.14).
     - Guard: At most 1 ambush per chapter leg (track last chapter ID or boolean flag).
     - Guard: Minimum 3 steps cooldown between ambushes.
     - Guard: Never trigger on destination tile or starting tile.
   - Implement `generateAmbushEncounter(chapterNumber, rebirthCount, regionId)`:
     - 50% chance Bandit Deck (황야 산적단 / Wasteland Bandits): Minotaur (82), Fenrir (81), Obelisk (35), Balrog (15), Byra (85) or thematic beast/earth cards.
     - 50% chance Thief Deck (그림자 도둑단 / Shadow Rogues): Arachne (54), Walker (51), Celia (62), Carrion (53), Stone Gargoyle (57) or shadow/speed cards.
     - Scale card stats and power based on chapterNumber and rebirthCount.
     - Calculate spoils: (15 + Math.floor(chapterNumber * 1.2)) * (1 + rebirthCount * 0.25) SNS coins.

2. In `src/views/KadanRpgView.tsx`:
   - In `stepToward` (movement loop), check `shouldTriggerAmbush`.
   - When ambush triggers:
     - Pause tile movement and render terminal-flat Ambush Alert modal/banner (`font-mono`, `rounded-none` container, `rounded-sm` buttons, 1px border, min 44px touch target).
     - In autoMode, automatically engage battle after a 1.0s countdown bar.
     - Mount `MobileCardPlayScreen` with the Ambush deck.
     - On victory: award spoils (SNS coins + toast notification) and continue tile movement.
     - On defeat: SAFE RETREAT. Player safely retreats with zero penalty (loss NEVER blocks story progression or chapter advance, `allowLossProgress = true`).
     - Combat buff application: apply active buff from `hero_kadan_active_buff` to playerDeck power if present.
     - Hands-free auto-play: ensure `initialAutoBattle={true}` and `autoCloseOnComplete={true}` so battle finishes and returns hands-free in autoMode.

3. Verification:
   - `python3 tests/e2e_rpg/run_rpg_e2e_tests.py` (All 51 assertions must pass)
   - `python3 tests/e2e_design_system/run_all_e2e_tests.py` (Must pass 377/377)
   - `npx tsc --noEmit` (Exit code 0)
   - `npm run build` (Exit code 0)

Write your handoff to:
/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_worker_m3_1/handoff.md
Send a completion message back to orchestrator_6 when finished.
