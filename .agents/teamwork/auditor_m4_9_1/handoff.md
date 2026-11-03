# Forensic Audit Report: Milestone 4 (Card Nurturing & EXP System)

**Auditor**: `auditor_m4_9_1`  
**Date**: 2026-11-02T12:03:30Z  
**Parent Conversation ID**: `21826d14-7bc9-4995-866c-cbb42a941789`  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/auditor_m4_9_1/`  
**Target Scope**: Commits `9e6742138` and `7d372f1b5`  
**Profile**: General Project (Forensic Integrity)  
**Integrity Mode**: `development` (per `ORIGINAL_REQUEST.md` line 498)  
**Verdict**: **CLEAN**

---

## 1. Observation

1. **Commit Log & Scope**:
   - Commits audited: `9e6742138` ("feat: implement Milestone 4 owned-only nurturing, battle EXP gating, and repeat hunting") and `7d372f1b5` ("docs: record Milestone 4 implementation and verification entry in WORK_LOGS.md").
   - Target files inspected:
     - `src/landing/services/cardNurtureStore.ts` (+115, -10 lines)
     - `src/landing/views/CardSection.tsx` (+311, -114 lines)
     - `src/landing/index.ts` (+2, -8 lines)
     - `src/landing/services/playRpgEngine.ts` (+27, -12 lines)
     - `src/views/MobileCardPlayScreen.tsx` (+47, -6 lines)
     - `tests/adversarial_m4_card_nurturing.ts` (+828 lines)

2. **Authentic Ownership Gating & Nurturing Restrictions**:
   - In `src/landing/services/cardNurtureStore.ts`:
     - Line 416: `isCardOwned(cardId: number): boolean { return this.ownedCardIds.includes(cardId); }` performs an authentic lookup in `this.ownedCardIds`.
     - Lines 246–248: `nurtureCard(cardId: number, expGain: number = 50)` strictly guards against unowned or out-of-range IDs:
       ```ts
       if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110 || !this.isCardOwned(cardId)) {
         return { expGained: 0, leveledUp: false, newLevel: this.cards[cardId]?.level || 1 };
       }
       ```
     - Lines 342–344: `allocateStat(cardId, direction)` verifies `if (!this.isCardOwned(cardId) || !['top', 'right', 'bottom', 'left'].includes(direction)) { return false; }`.
     - Lines 362–364: `hasUnspentPoints(cardId)` checks `if (!this.isCardOwned(cardId)) { return false; }`.
     - Lines 202–204: `setDeckCard(slotIndex, cardId)` verifies `if (!this.isCardOwned(cardId)) { return false; }`.
     - Lines 530–540 & 605–607: `loadFromStorage` and `ensureValidDeck` sanitize both `ownedCardIds` and `activeDeckIds` with `Number.isInteger(id) && id >= 1 && id <= 110 && this.isCardOwned(id)`.

3. **Complete Elimination of Cheat Buttons in `CardSection.tsx` and `index.ts`**:
   - `grep_search` for `+50 EXP`, `+500 EXP`, `nurture-card`, `data-exp` yielded 0 matches in `src/landing/views/CardSection.tsx`.
   - In `src/landing/index.ts` (lines 342–344), `action === 'nurture-card'` has been permanently neutralized:
     ```ts
     } else if (action === 'nurture-card') {
       // Prohibited: free EXP buttons completely eliminated in Milestone 4.
       // Ignored to prevent cheat injection.
     }
     ```
   - In `src/landing/views/CardSection.tsx` (lines 78–80, 218, 237–254, 386–395, 426–435, 466–475, 506–515), unowned cards display grayscale visuals (`grayscale opacity-60`), a `[미보유]` status tag, a locked guidance notice, and disabled stat upgrade buttons with caption `미보유 (강화 불가)`.
   - Zero hidden cheat buttons, zero `opacity-0`, zero `display:none` or `pointer-events-none` cheat buttons were found.

4. **Authentic Battle Victory EXP Hook & Repeat Hunting**:
   - In `src/landing/services/cardNurtureStore.ts` (lines 296–314), `awardBattleVictoryExp(expGain: number = 50)` iterates over `activeDeckIds`, verifies `this.isCardOwned(cardId)`, invokes `this.nurtureCard(cardId, expGain)`, commits state to localStorage (`hero_card_nurturing`), and dispatches `snshero_battle_exp_awarded`.
   - In `src/landing/services/playRpgEngine.ts` (lines 570–596), `finishBattleAndAwardExp()` calls `cardNurtureStore.awardBattleVictoryExp(50)` on player victory and triggers `initBattle()` after 1500ms when `playRpgState.repeatHunting` is true. In `finalizeBattle()`, loss and draw also trigger `initBattle()` after 1500ms when `repeatHunting` is true.
   - In `src/views/MobileCardPlayScreen.tsx` (lines 1145–1149), player victory invokes `cardNurtureStore.awardBattleVictoryExp(50)`. Lines 1443–1451 define the auto-rematch hook:
     ```tsx
     useEffect(() => {
       if (!gameOver || !winner || !isRepeatHunting) return;
       const timer = setTimeout(() => {
         initMatchDecks();
       }, 1500);
       return () => clearTimeout(timer);
     }, [gameOver, winner, isRepeatHunting, initMatchDecks]);
     ```
   - Lines 2557–2580 render a dedicated `[🔁 반복 사냥]` toggle button on the battle conclusion overlay meeting 44px+ touch standards.

5. **Test Integrity & Empirical Execution**:
   - In `tests/adversarial_m4_card_nurturing.ts`, all 44 assertions import and test live production classes (`CardNurtureStore`, `renderCardSection`, `playRpgEngine`). Zero `if (true) return` bypasses exist.
   - Empirical run commands and outputs:
     - `npx tsx tests/adversarial_m4_card_nurturing.ts`: 44/44 PASS (100.0%, exit code 0).
     - `npx tsx tests/e2e/run_all.ts`: 76/76 PASS (100.0%, exit code 0).
     - `npx tsx tests/adversarial_m1_build_pipeline.ts`: 64/64 PASS (100.0%, exit code 0).
     - `npx tsx tests/adversarial_m2_user_interaction.ts`: 18/18 PASS (100.0%, exit code 0).
     - `npx tsx tests/adversarial_m3_play_game_loop.ts`: 28/28 PASS (100.0%, exit code 0).
     - `npx tsx tests/challenger_m3_9_2_empirical_stress.ts`: 21/21 PASS (100.0%, exit code 0).
     - `npx tsc --noEmit`: 0 errors (exit code 0).
     - `npm run build`: Production bundle generated cleanly in 28.78s, landing bundle < 50 KB, exit code 0.

---

## 2. Logic Chain

1. **Integrity Mode Mapping**:
   - `ORIGINAL_REQUEST.md` (line 498) specifies `Integrity mode: development`. Under Development Mode, the prohibited patterns are hardcoded test results, dummy/facade implementations, and fabricated verification artifacts. Code reuse and standard libraries are permitted.
2. **Hardcoded Test Results Check**:
   - Source code search in `src/` for test assertion IDs (`ADV-M4`, `T1.CARD`) returned zero occurrences. Test assertions evaluate actual object mutations, return types, and localStorage state rather than matching hardcoded static strings. Pass.
3. **Facade Implementation Check**:
   - All audited methods (`isCardOwned`, `nurtureCard`, `allocateStat`, `awardBattleVictoryExp`, `setRepeatHunting`, `isRepeatHuntingActive`) execute genuine computational logic, perform bounds and type validation, mutate internal state, and write to LocalStorage. No placeholder or dummy returns were detected. Pass.
4. **Authentic Ownership Gating**:
   - Both unit inspection and empirical test harness confirm that calling `nurtureCard`, `allocateStat`, or `setDeckCard` on unowned card IDs (e.g. Card 50) is strictly rejected with zero state mutation or EXP leakage. Pass.
5. **Authentic Battle Victory EXP & Repeat Hunting Hook**:
   - Player victory in both landing RPG battles and React mobile card battles directly triggers `cardNurtureStore.awardBattleVictoryExp(50)`, which exclusively mutates the 5 active deck cards and saves to `hero_card_nurturing`. Repeat hunting persists to `hero_repeat_hunting` and seamlessly triggers rematches via `initBattle()` and `initMatchDecks()`. Pass.
6. **Zero Cheat Buttons**:
   - Both static code analysis and rendered DOM inspections of `CardSection.tsx` confirm 0 occurrences of free EXP buttons (`+50 EXP`, `+500 EXP`, `nurture-card`). Pass.

---

## 3. Caveats

- **No Caveats**: All 4 mandatory forensic checks were independently executed and verified empirically against live source code and production build artifacts. Zero discrepancies or defects were identified.

---

## 4. Conclusion

**Verdict: CLEAN**

Milestone 4 (commits `9e6742138` and `7d372f1b5`) authentically satisfies all requirements without facades, cheat shortcuts, dummy implementations, or test circumventions. Character nurturing is strictly gated by card ownership, free EXP cheat buttons are completely eliminated, battle victory awards +50 EXP to active deck cards, and repeat hunting is genuinely integrated into battle completion lifecycles.

---

## 5. Verification Method

To independently verify this verdict:

1. **Run Milestone 4 Adversarial Harness**:
   ```bash
   npx tsx tests/adversarial_m4_card_nurturing.ts
   ```
   *Expected*: 44 / 44 assertions PASS (100.0%), exit code 0.

2. **Run Full E2E Test Suite**:
   ```bash
   npx tsx tests/e2e/run_all.ts
   ```
   *Expected*: 76 / 76 assertions PASS (100.0%), exit code 0.

3. **Verify TypeScript & Production Build**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   *Expected*: Exit code 0, 0 compiler errors.
