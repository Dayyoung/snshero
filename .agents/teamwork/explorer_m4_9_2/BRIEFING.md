# BRIEFING — 2026-11-02T11:35:00Z

## Mission
Investigate battle victory EXP gating and Repeat Hunting ([🔁 반복 사냥]) loop integration across PlaySection, MobileCardPlayScreen, playRpgEngine, and cardNurtureStore, and produce a detailed worker blueprint with exact line diffs.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, analyzer, synthesizer
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m4_9_2
- Original parent: 21826d14-7bc9-4995-866c-cbb42a941789
- Milestone: Milestone 4 (Battle Victory EXP Gating & Repeat Hunting)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement directly in source code.
- Provide concrete blueprints with exact line diffs for worker agent.
- Output reports in /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m4_9_2/
- Always communicate with parent agent via send_message.
- Korean response format when answering user.

## Current Parent
- Conversation ID: 21826d14-7bc9-4995-866c-cbb42a941789
- Updated: 2026-11-02T11:27:13Z

## Investigation State
- **Explored paths**:
  - `src/landing/services/cardNurtureStore.ts`
  - `src/landing/services/playRpgEngine.ts`
  - `src/landing/views/PlaySection.tsx`
  - `src/views/MobileCardPlayScreen.tsx`
  - `src/landing/views/CardSection.tsx`
  - `src/landing/types.ts`
  - `tests/e2e/helpers.ts`, `tier1_feature_coverage.ts`, `tier3_cross_feature.ts`, `tier4_realworld_workload.ts`
- **Key findings**:
  1. `cardNurtureStore.ts` currently lacks the `isCardOwned` guard in `nurtureCard`, allowing unowned cards to level up if called directly.
  2. `awardBattleVictoryExp(50)` was monkey-patched in `playRpgEngine.ts` onto `cardNurtureStore as any`; it must be a native method on `CardNurtureStore` returning `{ expAwarded, updatedCards, deckCount }`.
  3. `cardNurtureStore.ts` is missing `setRepeatHunting(enabled: boolean)` and `isRepeatHuntingActive(): boolean`.
  4. `MobileCardPlayScreen.tsx` does NOT call `cardNurtureStore.awardBattleVictoryExp(50)` on `winState === 'player'` and lacks the `[🔁 반복 사냥]` toggle on the match completion overlay.
  5. `playRpgEngine.ts` has `toggleRepeatHunting()`, but `finalizeBattle()` / `finishBattleAndAwardExp()` only handles `autoMode` and does not automatically re-trigger `initBattle()` when `repeatHunting` is ON.
  6. `CardSection.tsx` still has free EXP buttons (`+50 EXP`, `+500 EXP`) that violate Requirement Feature 13 (battle victory EXP gating).
- **Unexplored areas**: None. Complete blueprint prepared.

## Key Decisions Made
- Fully specified concrete code changes and line diffs for `cardNurtureStore.ts`, `playRpgEngine.ts`, `PlaySection.tsx`, `MobileCardPlayScreen.tsx`, and `CardSection.tsx`.

## Artifact Index
- DISPATCH.md — Received dispatch message
- BRIEFING.md — Persistent context & situational awareness
- progress.md — Liveness & progress tracker
- handoff.md — Final 5-component handoff report with exact line diffs
