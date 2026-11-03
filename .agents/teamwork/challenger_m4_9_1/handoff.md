# Milestone 4 Challenger 1 Handoff Report: Empirical Growth Invariants & Battle Hook

**Author**: `challenger_m4_9_1` (Empirical Challenger)  
**Date**: 2026-11-02T12:03:00Z  
**Parent Conversation ID**: `21826d14-7bc9-4995-866c-cbb42a941789`  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m4_9_1/`  
**Verdict**: **APPROVE**

---

## 1. Observation

1. **Independent Empirical Test Harness Execution (`tests/challenger_m4_9_1_empirical_invariants.ts`)**:
   - Command: `npx tsx tests/challenger_m4_9_1_empirical_invariants.ts`
   - Total Assertions: **253**
   - Passed: **253**
   - Failed: **0**
   - Pass Rate: **100.0%**
   - Result:
     ```
     ============================================================
     TOTAL ASSERTIONS: 253
     PASSED: 253
     FAILED: 0
     ============================================================

     >>> ALL EMPIRICAL CHALLENGE ASSERTIONS PASSED (100.0%) <<<
     ```

2. **Gated Nurturing Invariants (Unowned Cards)**:
   - In `src/landing/services/cardNurtureStore.ts`:
     - Line 246: `if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110 || !this.isCardOwned(cardId)) { return { expGained: 0, leveledUp: false, newLevel: this.cards[cardId]?.level || 1 }; }`
   - Unowned Card 50 called with `nurtureCard(50, 50)` returned `{ expGained: 0, leveledUp: false, newLevel: 1 }`.
   - Massive EXP injection `nurtureCard(50, 100000)` was completely rejected: Card 50 `exp` remained 0, `level` remained 1, `statPoints` remained 0.
   - 20 randomly sampled unowned cards from IDs `[6..110]` were all rejected with 100,000 EXP.
   - Invalid and out-of-bounds inputs (`-1`, `0`, `111`, `999`, `NaN`, `3.14`, `5.9`, `Infinity`, `-Infinity`, strings) were rejected with `expGained: 0, leveledUp: false`.
   - `allocateStat(50, 'top' | 'right' | 'bottom' | 'left')` returned `false`.
   - `hasUnspentPoints(50)` returned `false`. Even when Card 50's internal `statPoints` was artificially set to `10`, `hasUnspentPoints(50)` returned `false` due to the `!this.isCardOwned(cardId)` guard on line 362.
   - `setDeckCard(0, 50)` returned `false`, rejecting unowned cards from entering the active deck squad.

3. **Directional Stat Allocation Invariants & TP Math**:
   - In `src/landing/services/cardNurtureStore.ts`:
     - Line 342: `if (!this.isCardOwned(cardId) || !['top', 'right', 'bottom', 'left'].includes(direction)) { return false; }`
   - Adversarial direction strings tested on owned Card 1:
     - `'center'`, `'front'`, `'diagonal'`, `'back'`, `'middle'`, `'up'`, `'down'`, `'north'`, `'south'`
     - Prototype vectors: `'__proto__'`, `'constructor'`, `'prototype'`, `'toString'`, `'valueOf'`
     - Whitespace & casing: `''`, `' '`, `'top '`, `' top'`, `'TOP'`, `'Top'`, `'BOTTOM'`, `'left\0'`, `'right\n'`
     - Non-strings: `null`, `undefined`, `123`, `{}`
   - Result: All returned `false`. Stat points were not consumed. Zero extraneous own properties were added to `bonusStats`. `Object.prototype` remained clean.
   - Valid directions `'top'`, `'right'`, `'bottom'`, `'left'` on cards with `statPoints > 0` successfully incremented the specific stat, decremented `statPoints`, and incremented `totalBonus` by 1.
   - Dynamic TP Conservation:
     - Allocating 1 point to active Card 1 increased `getDeckTP()` by exactly 1 and `getTotalTP()` by exactly 1.
     - Allocating 1 point to reserve Card 6 (owned, but not in active deck) left `getDeckTP()` strictly unchanged (`delta === 0`), while `getTotalTP()` increased by exactly 1 (`delta === 1`).
     - Swapping Card 6 into slot 0 dynamically updated `getDeckTP()` to match the exact mathematical formula `sum(basePower + totalBonus for active squad)`.

4. **Battle Victory EXP Invariants**:
   - In `src/landing/services/cardNurtureStore.ts` (lines 296–315):
     - `awardBattleVictoryExp(expGain: number = 50)` iterates through `this.activeDeckIds` after `ensureValidDeck()`.
   - Calling `awardBattleVictoryExp(50)` on baseline squad `[1, 2, 3, 4, 5]`:
     - Exactly 50 EXP awarded to each of the 5 cards in active deck.
     - Reserve owned cards (e.g. Card 10) received 0 EXP.
     - Unowned cards received 0 EXP.
   - Second battle victory (+50 EXP, total 100 EXP):
     - All 5 deck cards crossed the Level 1 -> 2 threshold (100 EXP).
     - Leveled up to Level 2.
     - Remainder EXP reset to 0 (`100 - 100`).
     - `expToNext` updated to `200` (`level * 100`).
     - Issued +1 stat point (`statPoints === 1`).
     - `hasUnspentPoints(cardId)` transitioned to `true` (triggering red dot indicator).
   - Injected unowned Card 99 into `activeDeckIds`:
     - `ensureValidDeck()` automatically purged Card 99 from active squad and filled slot with a valid owned card.
     - Injected Card 99 received 0 EXP and remained at Level 1.
   - Repeat Hunting State:
     - `isRepeatHuntingActive()` toggles between `false` and `true`, synchronously persisting to `hero_repeat_hunting` in LocalStorage.
   - Level 100 Cap:
     - Multi-level nurturing to Level 100 accumulated exactly 99 stat points across 99 level-ups.
     - At Level 100, further EXP awards were capped: `expGained: 0, leveledUp: false, newLevel: 100`, with zero level overflow (never 101) and zero surplus stat points.

5. **Cross-Suite Build & Integration Verification**:
   - `npx tsx tests/adversarial_m4_card_nurturing.ts`: **44 / 44 PASS (100.0%)**
   - `npx tsx tests/e2e/run_all.ts`: **76 / 76 PASS (100.0%)** across Tiers 1–4
   - `npx tsc --noEmit`: **0 errors** (exit code 0)
   - `npm run build`: **0 errors** (exit code 0, 4,347 modules transformed, production bundles generated)

---

## 2. Logic Chain

1. **Ownership Gating Verification**:
   - *Observation*: Calling `nurtureCard()` with 100,000 EXP on Card 50 and 20 sample unowned cards produced `{ expGained: 0, leveledUp: false }` with zero mutation of card records. Artificially setting `statPoints = 10` on unowned Card 50 was neutralized by `isCardOwned` checks in `hasUnspentPoints` and `allocateStat`.
   - *Deduction*: Unowned cards are completely isolated from EXP gains, level progression, stat point allocation, and UI indicators. No backdoor exists to nurture unowned characters.

2. **Adversarial Directional Stat Allocation**:
   - *Observation*: 27 adversarial strings (prototype pollution, non-cardinal directions, control characters, null/undefined) were submitted to `allocateStat()`. All 27 were rejected with `false`, 0 points were consumed, and 0 extraneous properties were added to `bonusStats`.
   - *Deduction*: Only exact enum matches `['top', 'right', 'bottom', 'left']` are executable. The allocation engine is immune to prototype pollution and arbitrary property injection.

3. **Dynamic TP Math Conservation**:
   - *Observation*: `getDeckTP()` evaluates exclusively to the active 5 squad members. Enhancing a reserve card does not alter `getDeckTP()` (`delta = 0`), while enhancing an active card increments `getDeckTP()` by exactly the allocated point (`delta = +1`). Both increment `getTotalTP()` by exactly 1.
   - *Deduction*: Deck Combat Power and Total Combat Power calculations are strictly conserved and reflect live active squad assignments without ghost power inflation.

4. **Battle Victory EXP Exclusivity**:
   - *Observation*: `awardBattleVictoryExp(50)` awarded strictly 50 EXP to the 5 active deck cards. Bench cards and unowned cards remained at 0 EXP. Corrupted/unowned deck injection was automatically sanitized by `ensureValidDeck()`. Consecutive wins triggered accurate level-up transitions and stat point grants.
   - *Deduction*: The battle hook satisfies all requirements for authentic gameplay progression with zero EXP leakage.

---

## 3. Caveats

- **No Caveats**: All 253 independent empirical challenge assertions and all 44 worker adversarial assertions passed with 100.0% success. TypeScript compilation and production build succeed cleanly with zero warnings or regressions.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 4 implementation in `src/landing/services/cardNurtureStore.ts`, `src/landing/views/CardSection.tsx`, `src/views/MobileCardPlayScreen.tsx`, and `src/landing/services/playRpgEngine.ts` fully satisfies all functional requirements, interface contracts, and adversarial invariants:
- Unowned cards cannot gain EXP, level up, allocate stats, or trigger red dot indicators.
- 4-way stat allocation strictly rejects invalid directions and preserves dynamic Deck TP and Total TP math.
- Battle victory hook correctly awards +50 EXP exclusively to active owned squad members and handles level-up thresholds and stat points.
- Repeat hunting loop toggles and persists cleanly via `hero_repeat_hunting`.

---

## 5. Verification Method

To independently verify this evaluation:

1. **Execute Independent Empirical Challenge Test Suite**:
   ```bash
   npx tsx tests/challenger_m4_9_1_empirical_invariants.ts
   ```
   *Expected*: 253 / 253 assertions PASS (100.0%), exit code 0.

2. **Execute Worker Adversarial Suite**:
   ```bash
   npx tsx tests/adversarial_m4_card_nurturing.ts
   ```
   *Expected*: 44 / 44 assertions PASS (100.0%), exit code 0.

3. **Execute Master E2E Suite**:
   ```bash
   npx tsx tests/e2e/run_all.ts
   ```
   *Expected*: 76 / 76 assertions PASS (100.0%), exit code 0.

4. **Verify TypeScript & Production Build**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   *Expected*: 0 type errors, exit code 0.
