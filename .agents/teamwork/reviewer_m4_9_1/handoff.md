# Milestone 4 Independent Review & Adversarial Audit Report

**Reviewer**: `reviewer_m4_9_1` (Code & Behavioral Reviewer)  
**Date**: 2026-11-02T12:00:30Z  
**Parent Conversation ID**: `21826d14-7bc9-4995-866c-cbb42a941789`  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/reviewer_m4_9_1/`  
**Verdict**: **APPROVE**

---

## 1. Observation

Direct code inspections and empirical command executions yielded the following verified facts:

1. **Owned-Only Gating in `src/landing/services/cardNurtureStore.ts`**:
   - `nurtureCard` (lines 245–248):
     ```ts
     if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110 || !this.isCardOwned(cardId)) {
       return { expGained: 0, leveledUp: false, newLevel: this.cards[cardId]?.level || 1 };
     }
     ```
     Strictly guards progression: unowned cards, floating IDs (e.g. `2.5`), strings, or out-of-range IDs (`< 1 || > 110`) return 0 EXP and zero mutation.
   - `allocateStat` (lines 341–344):
     ```ts
     if (!this.isCardOwned(cardId) || !['top', 'right', 'bottom', 'left'].includes(direction)) {
       return false;
     }
     ```
   - `hasUnspentPoints` (lines 361–364):
     ```ts
     if (!this.isCardOwned(cardId)) {
       return false;
     }
     ```
   - `loadFromStorage` (lines 532–534):
     ```ts
     this.ownedCardIds = Array.from(new Set(parsed.ownedCardIds))
       .filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id >= 1 && id <= 110)
       .sort((a, b) => a - b);
     ```

2. **Complete Elimination of Free EXP Cheat Buttons in `src/landing/views/CardSection.tsx`**:
   - Grep search for `+50 EXP`, `+500 EXP`, `data-action="nurture-card"`, and `data-exp=` in `src/landing/views/CardSection.tsx` yielded 0 matches.
   - Lines 274–280 display an informative terminal-flat battle EXP notice instead:
     ```html
     <!-- Battle Victory EXP Guide Notice -->
     <div class="pt-2">
       <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-xs text-stone-600 flex items-center gap-2">
         <span class="text-emerald-700 font-bold">[EXP 획득 가이드]</span>
         <span>경험치는 카드 배틀 승리 시 덱 출격 카드 5장에 자동 지급됩니다 (회당 50 경험치).</span>
         <a href="#play" class="ml-auto px-2.5 py-1 bg-[#201d1d] text-[#fdfcfc] text-[11px] font-bold rounded-sm hover:opacity-90 transition-opacity">배틀하러 가기</a>
       </div>
     </div>
     ```
   - For unowned cards, lines 283–300 render a locked notice with `#shop` link, lines 218 render `grayscale opacity-60` portraits, lines 242 render `[미보유]` badge, and lines 388–393 render disabled stat buttons with `미보유 (강화 불가)`.

3. **Neutralization of Cheat Handlers in `src/landing/index.ts`**:
   - Lines 342–344 in `src/landing/index.ts`:
     ```ts
     } else if (action === 'nurture-card') {
       // Prohibited: free EXP buttons completely eliminated in Milestone 4.
       // Ignored to prevent cheat injection.
     }
     ```
   - Lines 348–351 add a secondary check: `if (cardId && direction && cardNurtureStore.isCardOwned(cardId))` before invoking `allocateStat`.

4. **Battle Victory EXP Gating and Repeat Hunting Wiring**:
   - `src/landing/services/cardNurtureStore.ts` (lines 296–314): `awardBattleVictoryExp(expGain: number = 50)` validates active deck squad and iterates `for (const cardId of this.activeDeckIds) { if (this.isCardOwned(cardId)) { this.nurtureCard(cardId, expGain); updatedCards.push(cardId); } }`.
   - `src/landing/services/playRpgEngine.ts` (lines 570–588): `finishBattleAndAwardExp()` executes `cardNurtureStore.awardBattleVictoryExp(50)`. When `playRpgState.repeatHunting` is true, it schedules `initBattle()` after 1500ms.
   - `src/views/MobileCardPlayScreen.tsx` (lines 1144–1149): executes `cardNurtureStore.awardBattleVictoryExp(50)` on `winState === 'player'`.
   - `src/views/MobileCardPlayScreen.tsx` (lines 1445–1451, 2557–2580): implements `[🔁 반복 사냥]` toggle button and auto-rematch hook calling `initMatchDecks()` after 1500ms when `isRepeatHunting` is true.

5. **Empirical Test & Build Results**:
   - `npx tsx tests/adversarial_m4_card_nurturing.ts`: 44/44 PASS (100.0%, exit code 0).
   - `npx tsx tests/e2e/run_all.ts`: 76/76 PASS (100.0%, exit code 0).
   - `npx tsx tests/adversarial_m3_play_game_loop.ts`: 28/28 PASS (100.0%, exit code 0).
   - `npx tsc --noEmit`: 0 errors (exit code 0).
   - `npm run build`: Production bundle generated cleanly (exit code 0), landing asset bundle `dist/assets/index-B1F75yY4.js` is 33.72 kB (well under the 50 kB ceiling).

---

## 2. Logic Chain

1. **Authentic Ownership Protection (Feature 13)**:
   - Premise: `PROJECT.md` Feature 13 requires that nurturing is strictly gated by card ownership.
   - Observation 1 demonstrates that `nurtureCard`, `allocateStat`, and `hasUnspentPoints` are explicitly protected by `this.isCardOwned(cardId)` and `Number.isInteger(cardId)` checks.
   - In adversarial testing (`tests/adversarial_m4_card_nurturing.ts` Suite 1), unowned cards (e.g. Card 50) and out-of-bounds IDs (-1, 0, 111) were confirmed to reject progression with 0 EXP leakage.

2. **Complete Elimination of Cheat Exploits (Feature 13)**:
   - Premise: Free EXP buttons (`+50 EXP`, `+500 EXP`) must be purged to maintain gameplay integrity.
   - Observation 2 & 3 confirm that all cheat button HTML has been excised from `CardSection.tsx` and replaced with an informative guide. Any DOM-injected `nurture-card` events are neutralized in `index.ts`.
   - Tests in Suite 2 confirm 0 occurrences in source and rendered DOM.

3. **Authentic Battle Progression Hook (Feature 14)**:
   - Premise: EXP must be earned exclusively through winning card battles.
   - Observation 4 confirms `awardBattleVictoryExp(50)` is implemented natively in `cardNurtureStore.ts` and triggered upon victory in both `playRpgEngine.ts` (landing adventure) and `MobileCardPlayScreen.tsx` (React card screen).
   - Tests in Suite 3 confirm only owned cards in the active 5-card squad receive +50 EXP, while bench cards and unowned cards receive 0.

4. **Repeat Hunting Auto-Loop Parity (Feature 15)**:
   - Premise: Enabling repeat hunting (`반복 사냥`) must automatically trigger a rematch upon battle completion.
   - Observation 4 confirms `setRepeatHunting` / `isRepeatHuntingActive` is synchronized with `hero_repeat_hunting` across `cardNurtureStore.ts`, `playRpgEngine.ts`, and `MobileCardPlayScreen.tsx`.
   - Tests in Suite 4 confirm persistence and automatic rematch loop execution.

5. **Integrity & Non-Regression**:
   - Zero hardcoded test mocks, facades, or shortcuts detected.
   - All regression suites (M1–M3, E2E Tiers 1–4, and production build) pass with 100% success rate.

---

## 3. Caveats

- **No Caveats**: All 44 adversarial assertions pass. All 76 E2E assertions pass. Build and typecheck pass cleanly with 0 errors.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 4 is fully implemented with high architectural integrity, zero cheating exploits, robust boundary clamping, and verified end-to-end functionality across all specified requirements.

---

## 5. Verification Method

To independently verify this evaluation:

1. **Execute Dedicated Milestone 4 Adversarial Test Suite**:
   ```bash
   npx tsx tests/adversarial_m4_card_nurturing.ts
   ```
   *Expected Output*: 44 / 44 PASS (100.0%), exit code 0.

2. **Execute Full E2E Test Suite**:
   ```bash
   npx tsx tests/e2e/run_all.ts
   ```
   *Expected Output*: 76 / 76 PASS (100.0%), exit code 0.

3. **Verify Type Safety & Production Build**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   *Expected Output*: 0 TypeScript errors, exit code 0.
