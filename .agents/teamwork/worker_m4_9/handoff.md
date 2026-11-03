# Milestone 4 Handoff Report: Character Nurturing Ownership Gating, Removal of Free EXP, Battle Victory EXP Hook, and Repeat Hunting

**Author**: `worker_m4_9`  
**Date**: 2026-11-02T11:54:00Z  
**Parent Conversation ID**: `21826d14-7bc9-4995-866c-cbb42a941789`  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m4_9/`  

---

## 1. Observation

1. **Initial Code Inspection**:
   - `src/landing/views/CardSection.tsx` (lines 257–282) contained cheat buttons `카드 육성하기 (+50 EXP)` and `10회 연속 육성 (+500 EXP)` with `data-action="nurture-card"` and `data-exp="50" / "500"`.
   - `src/landing/services/cardNurtureStore.ts` lacked `isCardOwned(cardId)` verification in `nurtureCard`, `allocateStat`, and `hasUnspentPoints`. Calling `nurtureCard(50, 500)` mutated unowned Card 50 to Level 3 with 2 stat points.
   - `awardBattleVictoryExp` was absent from `CardNurtureStore` class definition and was monkey-patched in `playRpgEngine.ts`.
   - `MobileCardPlayScreen.tsx` did not call `cardNurtureStore.awardBattleVictoryExp(50)` on player victory and did not provide a `[🔁 반복 사냥]` auto-rematch loop toggle.
   - `loadFromStorage()` in `cardNurtureStore.ts` accepted floating point values like `3.7` in `ownedCardIds` without checking `Number.isInteger(id)`.

2. **Empirical Baseline Adversarial Execution**:
   - Executing `tests/adversarial_m4_card_nurturing.ts` prior to changes yielded exit code 1 with 18 failures out of 44 assertions (59.1% pass rate).

3. **Post-Implementation Execution**:
   - `npx tsx tests/adversarial_m4_card_nurturing.ts`: 44/44 PASS (100.0%).
   - `npx tsx tests/e2e/run_all.ts`: 76/76 PASS across Tiers 1–4 (100.0%).
   - `npx tsx tests/adversarial_m1_build_pipeline.ts`: 64/64 PASS (100.0%).
   - `npx tsx tests/adversarial_m2_user_interaction.ts`: 18/18 PASS (100.0%).
   - `npx tsx tests/adversarial_m3_play_game_loop.ts`: 28/28 PASS (100.0%).
   - `npx tsx tests/challenger_m3_9_2_empirical_stress.ts`: 21/21 PASS (100.0%).
   - `npx tsc --noEmit`: 0 TypeScript errors (code 0).
   - `npm run build`: Static production bundle generated cleanly, bundle size < 50 KB, zero React runtime on landing.

---

## 2. Logic Chain

1. **Owned-Only Nurturing Gating (Feature 13)**:
   - Premise: `PROJECT.md` Feature 13 and `ORIGINAL_REQUEST.md` mandate that character nurturing is strictly gated by card ownership.
   - Implementation: In `cardNurtureStore.ts`, `nurtureCard` validates `if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110 || !this.isCardOwned(cardId))` returning `{ expGained: 0, leveledUp: false, newLevel: this.cards[cardId]?.level || 1 }`. `allocateStat` and `hasUnspentPoints` enforce `if (!this.isCardOwned(cardId)) return false;`. In `CardSection.tsx`, `isSelectedCardOwned` gates the inspector: unowned cards show grayscale portraits (`grayscale opacity-60`), `[미보유]` badge, locked guidance notice with link to `#shop`, and disabled 4-way stat buttons with label `미보유 (강화 불가)`.

2. **Elimination of Free EXP Cheat Buttons (Feature 13)**:
   - Premise: Free EXP buttons circumvent authentic progression and violate specification.
   - Implementation: `data-action="nurture-card"`, `+50 EXP`, and `+500 EXP` were completely removed from `CardSection.tsx` and replaced with an informative terminal-flat battle victory EXP notice (`[EXP 획득 가이드] 경험치는 카드 배틀 승리 시 덱 출격 카드 5장에 자동 지급됩니다 (회당 50 경험치).`). In `src/landing/index.ts`, `action === 'nurture-card'` was neutralized to prevent DOM-injected cheats.

3. **Battle Victory EXP Gating Hook (Feature 14)**:
   - Premise: Winning card battles must be the exclusive source of character EXP.
   - Implementation: `awardBattleVictoryExp(expGain: number = 50)` was natively implemented on `CardNurtureStore`. It validates the active deck squad, awards `50` EXP to each owned card in the active 5-card deck, saves to LocalStorage (`hero_card_nurturing`), dispatches `snshero_battle_exp_awarded`, and returns `{ expAwarded, deckCount, updatedCards }`. Both `playRpgEngine.ts` (`finishBattleAndAwardExp`) and `MobileCardPlayScreen.tsx` (on `winState === 'player'`) call `cardNurtureStore.awardBattleVictoryExp(50)`.

4. **Repeat Hunting Auto-Loop (Feature 15)**:
   - Premise: When Repeat Hunting is active, match completion must automatically initiate a rematch without manual clicking.
   - Implementation: `setRepeatHunting(enabled: boolean)` and `isRepeatHuntingActive(): boolean` were implemented in `cardNurtureStore.ts`, backed by `hero_repeat_hunting`. `playRpgEngine.ts` schedules `initBattle()` after 1500ms when `playRpgState.repeatHunting` is true. `MobileCardPlayScreen.tsx` integrates `isRepeatHunting` state, presents a `[🔁 반복 사냥]` toggle button on the battle result overlay, and auto-schedules `initMatchDecks()` after 1500ms when enabled.

5. **Storage Resilience & Inventory Dual-Write (Feature 17)**:
   - Premise: Float corruption and desynchronization between stores must be prevented.
   - Implementation: `loadFromStorage()` enforces `Number.isInteger(id)` on `ownedCardIds` and `activeDeckIds`. `addCard(cardId)` dual-writes acquired cards to `hero_inventory` via `syncCardToHeroInventory`.

---

## 3. Caveats

- **No Caveats**: All 44 adversarial assertions pass. All 76 E2E assertions pass. Legacy views, build pipeline, and design system contracts remain 100% compliant. No regressions were observed.

---

## 4. Conclusion

Milestone 4 is 100% implemented and verified:
- Character nurturing is strictly gated by card ownership; unowned cards cannot gain EXP, level up, or allocate stat points.
- All free EXP cheat buttons have been permanently eliminated from `CardSection.tsx` and event listeners in `index.ts`.
- `awardBattleVictoryExp(50)` is natively implemented and wired to both landing RPG battles and React mobile card battles.
- Repeat hunting auto-rematch loop (`[🔁 반복 사냥]`) is fully integrated and synchronized via `hero_repeat_hunting`.
- Zero compiler or bundler warnings; production bundle size is well under 50 KB ceiling with zero React runtime on landing.

---

## 5. Verification Method

To independently verify this milestone:

1. **Run Dedicated Adversarial Test Suite**:
   ```bash
   npx tsx tests/adversarial_m4_card_nurturing.ts
   ```
   *Expected*: 44 / 44 assertions PASS (100.0%), exit code 0.

2. **Run Comprehensive E2E Regression Suite**:
   ```bash
   npx tsx tests/e2e/run_all.ts
   ```
   *Expected*: 76 / 76 assertions PASS (100.0%), exit code 0.

3. **Run M1–M3 Regression Suites**:
   ```bash
   npx tsx tests/adversarial_m1_build_pipeline.ts
   npx tsx tests/adversarial_m2_user_interaction.ts
   npx tsx tests/adversarial_m3_play_game_loop.ts
   npx tsx tests/challenger_m3_9_2_empirical_stress.ts
   ```
   *Expected*: All exit code 0 with 0 failures.

4. **Verify TypeScript & Production Build**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   *Expected*: 0 type errors, exit code 0, bundle size < 50 KB.
