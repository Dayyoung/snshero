# Milestone 4 Card Nurturing & Growth System Test Verification Strategy Report

**Agent**: `explorer_m4_9_3` (Milestone 4 Test Verification Strategy Explorer)  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m4_9_3/`  
**Date & Time**: 2026-11-02T11:38:00Z  
**Parent Conversation ID**: `21826d14-7bc9-4995-866c-cbb42a941789`  

---

## 1. Observation

### Obs 1.1: Discrepancy Between Test Oracle and Production Store
- In `tests/e2e/helpers.ts` (lines 186–320), the E2E test suites (`tier1_feature_coverage.ts`, `tier2_boundary_corner.ts`, `tier3_cross_feature.ts`, `tier4_realworld_workload.ts`) instantiate `ReferenceNurtureStore`.
- `ReferenceNurtureStore.nurtureCard()` (lines 262–266) explicitly gates nurturing:
  ```typescript
  nurtureCard(cardId: number, expGain: number = 50): { expGained: number; leveledUp: boolean; newLevel: number } {
    if (!this.isCardOwned(cardId)) {
      return { expGained: 0, leveledUp: false, newLevel: this.cards[cardId]?.level || 1 };
    }
  ```
- Conversely, production `CardNurtureStore` in `src/landing/services/cardNurtureStore.ts` (lines 226–240) completely lacks this check:
  ```typescript
  nurtureCard(cardId: number, expGain: number = 50): { expGained: number; leveledUp: boolean; newLevel: number } {
    let card = this.cards[cardId];
    if (!card) {
      this.cards[cardId] = {
        cardId,
        level: 1,
        exp: 0,
        expToNext: 100,
        statPoints: 0,
        bonusStats: { top: 0, right: 0, bottom: 0, left: 0 },
        totalBonus: 0,
      };
      card = this.cards[cardId];
    }
    if (card.level >= 100) { ... }
    card.exp += expGain;
  ```
  Result: Production `cardNurtureStore.nurtureCard(50, 500)` currently succeeds on unowned cards, granting EXP, leveling up, and giving stat points to unowned cards.

### Obs 1.2: Free EXP Cheat Buttons in Production `CardSection.tsx`
- In `src/landing/views/CardSection.tsx` (lines 257–282), the UI renders two cheat buttons granting direct free EXP:
  ```html
  <!-- Nurture Buttons -->
  <div class="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
    <button
      type="button"
      data-action="nurture-card"
      data-card-id="${selectedCard.cardId}"
      data-exp="50"
      ${selectedCard.level >= 100 ? 'disabled' : ''}
      class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer ${
        selectedCard.level >= 100 ? 'opacity-50 cursor-not-allowed' : ''
      }"
    >
      ${selectedCard.level >= 100 ? '최대 레벨 도달 (Lv.100 MAX)' : '카드 육성하기 (+50 EXP)'}
    </button>
    <button
      type="button"
      data-action="nurture-card"
      data-card-id="${selectedCard.cardId}"
      data-exp="500"
      ${selectedCard.level >= 100 ? 'disabled' : ''}
      class="px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-semibold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] flex items-center justify-center cursor-pointer ${
        selectedCard.level >= 100 ? 'opacity-50 cursor-not-allowed' : ''
      }"
    >
      10회 연속 육성 (+500 EXP)
    </button>
  </div>
  ```
- In `src/landing/index.ts` (lines 342–348), clicks on `data-action="nurture-card"` execute:
  ```typescript
  } else if (action === 'nurture-card') {
    const cardId = Number(target.getAttribute('data-card-id'));
    const expGain = Number(target.getAttribute('data-exp') || '50');
    if (cardId) {
      cardNurtureStore.nurtureCard(cardId, expGain);
      renderApp();
    }
  ```
- In `tests/e2e/tier1_feature_coverage.ts` (lines 444–452), test `T1.CARD.3` verified:
  ```typescript
  const hasFreeExpGrant = cardView.includes('무료 경험치') || cardView.includes('자유 지급');
  ```
  Because those specific Korean phrases were not in the template, `T1.CARD.3` produced a false positive `PASS`, allowing the `+50 EXP` and `+500 EXP` buttons to remain undetected in the existing test suite.

### Obs 1.3: `awardBattleVictoryExp` Missing from `CardNurtureStore` Class
- In `src/landing/services/cardNurtureStore.ts`, the `CardNurtureStore` class does NOT declare or implement `awardBattleVictoryExp`.
- Instead, in `src/landing/services/playRpgEngine.ts` (lines 57–65), `awardBattleVictoryExp` is monkey-patched onto the singleton instance:
  ```typescript
  if (typeof (cardNurtureStore as any).awardBattleVictoryExp !== 'function') {
    (cardNurtureStore as any).awardBattleVictoryExp = function (exp: number = 50) {
      const deck = (this as any).getDeckCardIds ? (this as any).getDeckCardIds() : [1, 2, 3, 4, 5];
      for (const cardId of deck) {
        this.nurtureCard(cardId, exp);
      }
      return { expAwarded: exp, deckCount: deck.length };
    };
  }
  ```
- When a new `new CardNurtureStore()` instance is created without evaluating `playRpgEngine.ts`, `awardBattleVictoryExp` is `undefined`, causing `TypeError: testStore.awardBattleVictoryExp is not a function`.

### Obs 1.4: Repeat Hunting Hook and State Persistence
- In `src/landing/services/playRpgEngine.ts`:
  - `toggleRepeatHunting()` (lines 610–616) flips `playRpgState.repeatHunting` and syncs to `localStorage.setItem('hero_repeat_hunting', ...)`.
  - In `runAutoStep()` (lines 677–683):
    ```typescript
    } else if (playRpgState.battleWinner) {
      if (playRpgState.repeatHunting) {
        initBattle();
      } else {
        advanceNextChapter();
      }
    }
    ```
  - In `src/landing/views/PlaySection.tsx` (lines 448–460), the header renders `🔁 반복 사냥 [ON]` / `[OFF]` (`data-action="play-toggle-repeat"`), and lines 845–851 render the post-battle rematch button `🔁 반복 사냥 재전투` (`data-action="play-repeat-hunting"`).

### Obs 1.5: 4-Way Directional Stat Allocation & Dynamic TP Recalculation
- In `src/landing/services/cardNurtureStore.ts` (lines 270–284):
  ```typescript
  allocateStat(cardId: number, direction: 'top' | 'right' | 'bottom' | 'left'): boolean {
    const card = this.cards[cardId];
    if (!card || card.statPoints <= 0) {
      return false;
    }
    card.statPoints -= 1;
    card.bonusStats[direction] += 1;
    card.totalBonus += 1;
    this.saveToStorage();
    this.dispatchUpdateEvent(cardId);
    return true;
  }
  ```
- Gaps identified:
  1. No check for `this.isCardOwned(cardId)`.
  2. No runtime validation that `direction` is one of `['top', 'right', 'bottom', 'left']`. Passing `'center'` sets `bonusStats['center'] = 1` and consumes a stat point.
- Dynamic TP formulas:
  - Base power: `(dbCard.top || 0) + (dbCard.right || 0) + (dbCard.bottom || 0) + (dbCard.left || 0)` (lines 76–80).
  - Deck TP: `this.activeDeckIds.reduce(...)` summing `basePower + card.totalBonus` for active 5 cards (lines 150–158).
  - Total TP: `this.ownedCardIds.reduce(...)` summing `basePower + card.totalBonus` for all owned cards (lines 163–170).

### Obs 1.6: Storage Corruption & Float Sanitization
- In `src/landing/services/cardNurtureStore.ts` (lines 427–431):
  ```typescript
  if (Array.isArray(parsed.ownedCardIds) && parsed.ownedCardIds.length > 0) {
    this.ownedCardIds = Array.from(new Set(parsed.ownedCardIds))
      .filter((id): id is number => typeof id === 'number' && id >= 1 && id <= 110)
      .sort((a, b) => a - b);
  }
  ```
- `typeof id === 'number' && id >= 1 && id <= 110` passes floats (e.g. `3.7`). Missing `Number.isInteger(id)`.

### Obs 1.7: Empirical Execution of Proposed Adversarial Harness
- We created and executed `.agents/teamwork/explorer_m4_9_3/proposed_adversarial_m4_card_nurturing.ts` via `npx tsx`.
- **Command**: `npx tsx .agents/teamwork/explorer_m4_9_3/proposed_adversarial_m4_card_nurturing.ts`
- **Result**: Exit code 1.
  - Total Assertions: 44
  - Passed: 26 (59.1%)
  - Failed: 18 (40.9%)
- **Confirmed Failures**:
  - `ADV-M4-OWN-03`: `nurtureCard(50, 500)` on unowned card returned `expGained: 500, leveledUp: true, newLevel: 3` (Expected: 0, false, 1).
  - `ADV-M4-OWN-04`: Unowned card 50 internal state mutated to Lv 3, 200 EXP, 2 pts.
  - `ADV-M4-OWN-05`: Out-of-bounds IDs (-1, 0, 111) received 100 EXP.
  - `ADV-M4-OWN-07`: `allocateStat(50, "top")` returned `true` for unowned card.
  - `ADV-M4-NOCHEAT-01` ~ `06`: `CardSection.tsx` has `+50 EXP`, `+500 EXP`, `data-action="nurture-card"`, and `data-exp=`.
  - `ADV-M4-BATTLE-01`, `02`, `04`, `05`: `awardBattleVictoryExp` missing on `CardNurtureStore` class.
  - `ADV-M4-STAT-04`: `allocateStat(1, "center")` accepted invalid direction and consumed a stat point.
  - `ADV-M4-RESIL-05`: `ownedCardIds` contained float `3.7`.

---

## 2. Logic Chain

1. **Premise 1 (`ORIGINAL_REQUEST.md` & `PROJECT.md`)**:
   - `ORIGINAL_REQUEST.md`: "Character nurturing is restricted strictly to owned characters. Nurturing requires EXP earned exclusively by winning card battles. After a match ends, enable repeat hunting (`반복 사냥`)."
   - `PROJECT.md` Feature 13: "Owned-only Nurturing Restriction: Eliminate free EXP buttons; strictly restrict leveling and stat points to owned characters."
   - `PROJECT.md` Feature 14: "Battle Victory EXP Gating: EXP earned exclusively by winning card battles; syncs battle victory EXP to `cardNurtureStore`."
2. **Finding from Obs 1.1**: Production `cardNurtureStore.ts` does not check `isCardOwned(cardId)` inside `nurtureCard()` or `allocateStat()`. Anyone or any caller can nurture unowned cards (e.g. Card 50) and level them up.
3. **Finding from Obs 1.2**: `CardSection.tsx` currently displays two manual buttons (`+50 EXP` and `+500 EXP`) bound to `data-action="nurture-card"`. This directly violates the requirement that EXP must be earned exclusively through winning battles and free EXP buttons must be eliminated.
4. **Finding from Obs 1.3**: Battle victory EXP was monkey-patched in `playRpgEngine.ts`, violating the `PROJECT.md` interface contract where `cardNurtureStore` is the authoritative class managing card EXP and active deck awards.
5. **Finding from Obs 1.5**: `allocateStat()` lacked direction validation and ownership validation, allowing points to be spent on arbitrary string properties and unowned cards.
6. **Finding from Obs 1.6**: Storage parser allowed floating point numbers in `ownedCardIds`.
7. **Finding from Obs 1.7**: Empirical execution of the proposed adversarial harness demonstrated that 18 out of 44 assertions failed against current code, confirming that existing E2E tests in `tests/e2e/` suffered from a test oracle isolation issue (`ReferenceNurtureStore` in `helpers.ts` masked production flaws).
8. **Conclusion**: A dedicated adversarial harness `tests/adversarial_m4_card_nurturing.ts` testing the actual production code imports (`CardNurtureStore`, `renderCardSection`, `playRpgState`, etc.) is required. The worker must implement the 4 specific code fixes, after which all 44 assertions will pass at 100%.

---

## 3. Caveats

- **No Caveats in Code Exploration**: All 6 verification areas, contracts, and production files were viewed and directly verified with tool execution.
- **Scope Boundary**: This investigation is read-only. We did not modify any production source files (`src/landing/services/cardNurtureStore.ts`, `src/landing/views/CardSection.tsx`, `src/landing/index.ts`).
- **File Location Note**: In this explorer directory, `proposed_adversarial_m4_card_nurturing.ts` uses relative imports `../../../src/` for standalone test execution. A copy configured with `../src/` has been prepared as `proposed_tests_adversarial_m4_card_nurturing.ts` for immediate drop-in to `tests/adversarial_m4_card_nurturing.ts`.

---

## 4. Conclusion & Required Action Plan for Worker & Challenger

### Summary Assessment
Milestone 4 requires four concrete code modifications to achieve full compliance and pass all 44 adversarial assertions:

### Required Action Items for Worker (`worker_m4_9_3`):
1. **Fix 1: In `src/landing/services/cardNurtureStore.ts`**:
   - In `nurtureCard(cardId: number, expGain: number = 50)`:
     Add validation:
     ```typescript
     if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110 || !this.isCardOwned(cardId)) {
       return { expGained: 0, leveledUp: false, newLevel: this.cards[cardId]?.level || 1 };
     }
     ```
   - In `allocateStat(cardId: number, direction: 'top' | 'right' | 'bottom' | 'left')`:
     Add ownership and direction validation:
     ```typescript
     if (!this.isCardOwned(cardId) || !['top', 'right', 'bottom', 'left'].includes(direction)) {
       return false;
     }
     ```
   - Add first-class `awardBattleVictoryExp` method to `CardNurtureStore`:
     ```typescript
     awardBattleVictoryExp(expGain: number = 50): { expAwarded: number; deckCount: number; updatedCards: number[] } {
       this.ensureValidDeck();
       const updatedCards: number[] = [];
       for (const cardId of this.activeDeckIds) {
         if (this.isCardOwned(cardId)) {
           this.nurtureCard(cardId, expGain);
           updatedCards.push(cardId);
         }
       }
       this.saveToStorage();
       return { expAwarded: expGain, deckCount: this.activeDeckIds.length, updatedCards };
     }
     ```
   - In `loadFromStorage()`:
     Ensure `Number.isInteger(id)` is checked when parsing `ownedCardIds`:
     ```typescript
     .filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id >= 1 && id <= 110)
     ```
2. **Fix 2: In `src/landing/views/CardSection.tsx`**:
   - Remove lines 257–282 containing `+50 EXP` and `+500 EXP` buttons and `data-action="nurture-card"`.
   - Replace with an informative terminal-flat battle victory notice banner:
     ```html
     <!-- Battle Victory EXP Guide Notice -->
     <div class="pt-2">
       <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-xs text-stone-600 flex items-center gap-2">
         <span class="text-emerald-700 font-bold">[EXP 획득 가이드]</span>
         <span>경험치는 카드 배틀 승리 시 덱 출격 카드 5장에 자동 지급됩니다 (+50 EXP).</span>
       </div>
     </div>
     ```
3. **Fix 3: In `src/landing/index.ts`**:
   - In line 342: Remove or guard `action === 'nurture-card'` so that arbitrary DOM injection cannot grant free EXP.
4. **Fix 4: In `tests/adversarial_m4_card_nurturing.ts`**:
   - Copy `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m4_9_3/proposed_tests_adversarial_m4_card_nurturing.ts` to `tests/adversarial_m4_card_nurturing.ts`.

---

## 5. Verification Method

### Step 1: Run the Dedicated Adversarial Test Harness
```bash
npx tsx tests/adversarial_m4_card_nurturing.ts
```
**Expected Output**:
- Total Assertions: 44
- Passed: 44 (100.0%)
- Failed: 0
- Exit Code: 0

### Step 2: Run Full 4-Tier E2E Regression Suite
```bash
npx tsx tests/e2e/run_all.ts
```
**Expected Output**:
- 76 / 76 assertions passing cleanly with exit code 0.

### Step 3: Verify TypeScript Type Checking and Production Bundle
```bash
npx tsc --noEmit
npm run build
```
**Expected Output**:
- Both exit code 0 with 0 errors.

### Invalidation Conditions:
- If `CardSection.tsx` retains any button containing `+50 EXP` or `+500 EXP`.
- If `cardNurtureStore.nurtureCard(50, 500)` returns `expGained > 0` for an unowned card.
- If `awardBattleVictoryExp(50)` fails to increment EXP for active deck cards or mutates non-deck cards.
- If `localStorage.getItem('hero_repeat_hunting')` does not reflect toggle state changes.
- If stat point allocation accepts invalid directions or unowned cards.
- If `hero_card_nurturing` JSON corruption causes a fatal crash.
