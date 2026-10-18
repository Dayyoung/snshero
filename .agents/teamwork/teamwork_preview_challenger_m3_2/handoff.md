# Handoff Report — Challenger 2 (Milestone 3 Empirical Challenge)

**Agent**: Challenger 2 (`teamwork_preview_challenger_m3_2`)  
**Mission**: Milestone 3 — Random Field Encounters (Bandit & Thief Decks) & Auto-Play Integration Adversarial Challenge  
**Date**: 2026-10-18T21:18:00Z  
**Type**: Hard Handoff (Task Complete)  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

1. **Bug Found in Card Elements (`src/lib/rpg/kadanRpgAmbush.ts`)**:
   - Lines 27–39 implement a mapping from category number to element:
     ```typescript
     const categoryToElement = (cat: number): CardElement => {
       switch (cat) {
         case 1: return 'water';
         case 2: return 'fire';
         case 3: return 'air';
         case 4: return 'earth';
         case 5: return 'human';
         case 6: return 'undead';
         case 7: return 'elf';
         case 8: return 'dragon';
         default: return 'fire';
       }
     };
     ```
   - Line 142 assigns the generated card element via:
     ```typescript
     element: categoryToElement(base.category),
     ```
   - In `src/cardDatabase.ts`, `base.category` represents the card star/tier rank (strictly values `[1, 2, 3, 4, 5]`), while `base.element` is already the canonical element string (`'water' | 'fire' | 'air' | 'earth' | 'human' | 'undead' | 'elf' | 'dwarf' | 'monster' | 'robot' | 'dragon'`).
   - For the 5 Bandit cards (`[82, 81, 35, 15, 85]`):
     - ID 82 (`미노타우로스 / Minotaur`): `base.category = 1`, `base.element = 'monster'` $\rightarrow$ assigned `'water'` (INCORRECT)
     - ID 81 (`펜릴 / Fenrir`): `base.category = 1`, `base.element = 'monster'` $\rightarrow$ assigned `'water'` (INCORRECT)
     - ID 35 (`오벨리스크 / Obelisk`): `base.category = 2`, `base.element = 'earth'` $\rightarrow$ assigned `'fire'` (INCORRECT)
     - ID 15 (`발록 / Balrog`): `base.category = 2`, `base.element = 'fire'` $\rightarrow$ assigned `'fire'` (matched accidentally)
     - ID 85 (`바이라 / Byra`): `base.category = 2`, `base.element = 'monster'` $\rightarrow$ assigned `'fire'` (INCORRECT)
   - For the 5 Thief cards (`[54, 51, 62, 53, 57]`):
     - ID 54 (`아라크네 / Arachne`): `base.category = 1`, `base.element = 'undead'` $\rightarrow$ assigned `'water'` (INCORRECT)
     - ID 51 (`워커 / Walker`): `base.category = 1`, `base.element = 'undead'` $\rightarrow$ assigned `'water'` (INCORRECT)
     - ID 62 (`실리아 / Celia`): `base.category = 1`, `base.element = 'elf'` $\rightarrow$ assigned `'water'` (INCORRECT)
     - ID 53 (`캐리언 / Carrion`): `base.category = 1`, `base.element = 'undead'` $\rightarrow$ assigned `'water'` (INCORRECT)
     - ID 57 (`스톤가고일 / Stone Gargoyle`): `base.category = 3`, `base.element = 'undead'` $\rightarrow$ assigned `'air'` (INCORRECT)
   - 9 out of 10 cards (90%) in every ambush encounter across all 40 chapters and rebirth levels receive the wrong element.

2. **Empirical Test Suite Execution (`tests/adversarial_challenger_m3_empirical.ts`)**:
   - Command: `npx tsx tests/adversarial_challenger_m3_empirical.ts`
   - Output verbatim:
     ```
     [CRITICAL ELEMENT CHECK] Total element mismatches detected: 1800
     Sample element mismatches:
       - Ch 1 Reb 0 Card 82 (미노타우로스): expected base.element 'monster' (cat 1), got card.element 'water'
       - Ch 1 Reb 0 Card 81 (펜릴): expected base.element 'monster' (cat 1), got card.element 'water'
       - Ch 1 Reb 0 Card 35 (오벨리스크): expected base.element 'earth' (cat 2), got card.element 'fire'
       - Ch 1 Reb 0 Card 85 (바이라): expected base.element 'monster' (cat 2), got card.element 'fire'
       - Ch 1 Reb 0 Card 54 (아라크네): expected base.element 'undead' (cat 1), got card.element 'water'
       - Ch 1 Reb 0 Card 51 (워커): expected base.element 'undead' (cat 1), got card.element 'water'
       - Ch 1 Reb 0 Card 62 (실리아): expected base.element 'elf' (cat 1), got card.element 'water'
       - Ch 1 Reb 0 Card 53 (캐리언): expected base.element 'undead' (cat 1), got card.element 'water'
       - Ch 1 Reb 0 Card 57 (스톤가고일): expected base.element 'undead' (cat 3), got card.element 'air'
       - Ch 2 Reb 0 Card 82 (미노타우로스): expected base.element 'monster' (cat 1), got card.element 'water'
     [FAIL] [Card Elements] Card elements match canonical CARD_DATABASE element: Found 1800 element mismatches between base.element and card.element!
     ...
     TOTAL ASSERTIONS: 44
     PASSED: 43
     FAILED: 1
     ```

3. **Spoils Calculation Verification**:
   - Evaluated `(15 + Math.floor(chapter * 1.2)) * (1 + rebirth * 0.25)` across all 40 chapters and rebirth levels 0..10.
   - Chapter 1, Rebirth 0 = 16 SNS coins.
   - Chapter 40, Rebirth 0 = 63 SNS coins.
   - Chapter 40, Rebirth 10 = 220 SNS coins.
   - Strictly positive and strictly monotonic across all chapters and rebirths.

4. **1.0s Countdown Timer & Auto Engagement**:
   - In `src/views/KadanRpgView.tsx` (lines 476–492), interval ticks every 100ms.
   - When `next <= 0.05` (~1000ms / 10 ticks), triggers `handleEngageAmbush()`.
   - Engages battle without stalling.
   - Minor code hygiene note: `handleEngageAmbush()` is called within the `setAmbushCountdown` updater callback, and cleanup calls `window.clearTimeout(timer)` instead of `window.clearInterval(timer)`.

5. **Combat Buff Application**:
   - `src/views/KadanRpgView.tsx` line 791 mounts `MobileCardPlayScreen` with `playerDeck={getBuffedPlayerDeck(currentDeck)}`.
   - Verified that active dialogue buff (`hero_kadan_active_buff`) properly multiplies card power by `1.0 + buffVal / 100.0`.
   - Line 499 cleans up buff upon ambush battle completion (`localStorage.removeItem('hero_kadan_active_buff')`).

---

## 2. Logic Chain

1. **Dispatch Criterion 1**:
   - Mission requires: *"1. Verify Bandit Deck and Thief Deck across all 40 chapters and rebirth levels: all 5 cards have valid IDs in `[1..110]`, proper elements, scaled stats."*
2. **Observation to Bug Link**:
   - `src/lib/rpg/kadanRpgAmbush.ts` line 142 assigns `element: categoryToElement(base.category)`.
   - `category` in `CARD_DATABASE` is star/tier rank (1..5), not element index.
   - As a result, Minotaur and Fenrir (monsters) become Water cards, Obelisk (earth) becomes Fire, Arachne, Walker, Carrion, and Stone Gargoyle (undead) become Water and Air cards, and Celia (elf) becomes Water.
   - In 3x3 card battle, elements determine elemental placement bonuses on board cells and top-right faction emblems. Displaying Undead/Monster cards as Water alters gameplay mechanics and violates card lore.
3. **Verdict Justification**:
   - Because Criterion 1 explicitly demands *"proper elements"*, and 90% of ambush cards fail this criterion with 1,800 empirical mismatches, this requires a code modification by Worker 3.
   - Under Challenger review-only constraints, Challenger reports the exact empirical findings and provides the required fix.
   - Verdict: **REQUEST_CHANGES**.

---

## 3. Caveats

- All other Milestone 3 specifications (card IDs in `[1..110]`, stat bounds `[1..10]`, spoils formula, 1.0s countdown auto-engagement, safe loss on retreat/defeat, anti-spam guards with 0 cooldown violations across 10,000 steps) passed all empirical checks with 100% compliance.
- No other caveats.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

### Required Action for Worker M3
In `src/lib/rpg/kadanRpgAmbush.ts`:
1. Change line 142 from:
   ```typescript
   element: categoryToElement(base.category),
   ```
   to:
   ```typescript
   element: (base.element || 'fire') as CardElement,
   ```
2. Remove or comment out the unused `categoryToElement` helper function (lines 27–39).
3. Optionally clean up `window.clearTimeout(timer)` to `window.clearInterval(timer)` in `src/views/KadanRpgView.tsx` line 491.

---

## 5. Verification Method

To independently reproduce the empirical failure and verify the fix:

```bash
# 1. Run Challenger 2 empirical challenge harness (reproduces 1,800 element mismatches)
npx tsx tests/adversarial_challenger_m3_empirical.ts

# 2. Verify with standalone one-liner
npx tsx -e "
import { CARD_DATABASE } from './src/cardDatabase';
import { generateAmbushEncounter } from './src/lib/rpg/kadanRpgAmbush';
const enc = generateAmbushEncounter(1, 0, 'test', 'bandit');
console.log('Minotaur expected:', CARD_DATABASE[82].element, 'actual:', enc.deck[0].element);
"
# Current output: Minotaur expected: monster actual: water (FAIL)
# Expected post-fix: Minotaur expected: monster actual: monster (PASS)

# 3. Run full RPG E2E test suite
python3 tests/e2e_rpg/run_rpg_e2e_tests.py

# 4. Run TypeScript check
npx tsc --noEmit
```
