# BRIEFING — 2026-10-18T21:11:00Z

## Mission
Implement Milestone 3 (Random Field Encounters & Deck Scaling) for SNSHero RPG mode overhaul: `kadanRpgAmbush.ts` and ambush integration into `KadanRpgView.tsx` with hands-free auto engagement and safe defeat handling.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_worker_m3_1/
- Original parent: 0841dceb-1ed6-4895-a369-d9b2f167a28c
- Milestone: Milestone 3 (Random Field Encounters & Deck Scaling)

## 🔒 Key Constraints
- DO NOT CHEAT. All implementations must be genuine.
- DO NOT hardcode test results or create dummy/facade implementations.
- File ownership:
  1. `src/lib/rpg/kadanRpgAmbush.ts` (create new helper module)
  2. `src/views/KadanRpgView.tsx` (tile movement ambush trigger, ambush modal/banner, safe defeat handling, 100% hands-free auto engagement)
- Do NOT break or overwrite existing components in other files.
- Terminal-flat aesthetics: `font-mono`, `rounded-none` containers, `rounded-sm` buttons, 1px border, 44px+ touch targets.
- 51/51 RPG E2E tests, 377/377 Design System E2E tests, tsc and build must pass.

## Current Parent
- Conversation ID: 0841dceb-1ed6-4895-a369-d9b2f167a28c
- Updated: 2026-10-18T21:11:00Z

## Task Summary
- **What to build**:
  - `src/lib/rpg/kadanRpgAmbush.ts`: Interfaces `AmbushEncounter`, `AmbushType`, `shouldTriggerAmbush` (14% roll, chapter leg limit, 3-step cooldown, start/destination tile immunity), `generateAmbushEncounter` (Bandit deck [82, 81, 35, 15, 85], Thief deck [54, 51, 62, 53, 57], procedural power/stat scaling, spoils coins formula, `allowLossProgress = true`).
  - `src/views/KadanRpgView.tsx`: In `stepToward` tile stepping loop, evaluate `shouldTriggerAmbush`. When triggered, pause movement, render terminal-flat Ambush Alert modal with 1.0s auto-engagement bar in autoMode, mount `MobileCardPlayScreen` with ambush deck, award spoils on victory and continue, safe retreat on defeat (0 penalty, loss never blocks story), apply `hero_kadan_active_buff` via `getBuffedPlayerDeck`.
- **Success criteria**:
  - `run_rpg_e2e_tests.py`: 51/51 passed (100%).
  - `run_all_e2e_tests.py`: 377/377 passed (100%).
  - `npx tsc --noEmit`: 0 errors.
  - `npm run build`: built in 18s, 0 errors.

## Key Decisions Made
- Created `getBuffedPlayerDeck` helper to consistently apply `hero_kadan_active_buff` with `1.0 + (buffVal / 100.0)` multiplier across both story boss battles and ambush battles.
- Tracked `heroStepCount` and `lastAmbushStep` persistently across chapter leg transitions while resetting `ambushedInLeg` per chapter, ensuring the 3-step cooldown rule is honored cross-chapter.
- Added top-layer `[x]` dismiss control with `min-h-[44px] min-w-[44px]` on the Ambush Alert modal to strictly fulfill `DESIGN.md` and `T2.MODAL` standards.
- Designed 1.0s countdown auto-engagement timer in autoMode with visual progress bar, ensuring 100% hands-free continuity.

## Artifact Index
- `.agents/teamwork/teamwork_preview_worker_m3_1/DISPATCH.md` — Dispatch instruction
- `.agents/teamwork/teamwork_preview_worker_m3_1/BRIEFING.md` — Situational awareness
- `.agents/teamwork/teamwork_preview_worker_m3_1/progress.md` — Progress heartbeat
- `.agents/teamwork/teamwork_preview_worker_m3_1/handoff.md` — 5-component handoff report
- `src/lib/rpg/kadanRpgAmbush.ts` — Random field encounter engine
- `src/views/KadanRpgView.tsx` — Tile movement ambush integration & alert UI

## Change Tracker
- **Files modified**:
  - `src/lib/rpg/kadanRpgAmbush.ts`: New helper module with interfaces and encounter generator.
  - `src/views/KadanRpgView.tsx`: Integrated ambush roll in tile stepping loop, alert banner, auto-countdown, safe defeat, buffed deck.
- **Build status**: All tests pass (51/51 RPG E2E, 377/377 Design System E2E, tsc exit 0, npm run build exit 0).
- **Pending issues**: None.

## Quality Status
- **Build/test result**: PASS (51/51 RPG tests, 377/377 Design System tests).
- **Lint status**: 0 errors (`npx tsc --noEmit` exit 0).
- **Tests added/modified**: Verified against all 4 tiers of `tests/e2e_rpg/run_rpg_e2e_tests.py` and `tests/e2e_design_system/run_all_e2e_tests.py`.

## Loaded Skills
- None
