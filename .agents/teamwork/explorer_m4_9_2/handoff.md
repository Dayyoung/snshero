# Handoff Report: Milestone 4 Battle Victory EXP Gating & Repeat Hunting

**Author**: `explorer_m4_9_2`  
**Milestone**: Milestone 4 — Battle Victory EXP Gating & Repeat Hunting (`#card` Nurturing & `[🔁 반복 사냥]`)  
**Target Files**:
- `src/landing/services/cardNurtureStore.ts`
- `src/landing/services/playRpgEngine.ts`
- `src/landing/views/PlaySection.tsx`
- `src/views/MobileCardPlayScreen.tsx`
- `src/landing/views/CardSection.tsx`
- `src/landing/types.ts`

---

## 1. Observation

### Observation 1.1: `cardNurtureStore.ts` lacks `isCardOwned` guard in `nurtureCard()`
In `src/landing/services/cardNurtureStore.ts` (lines 226–246):
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

  if (card.level >= 100) {
    card.level = 100;
    card.exp = card.expToNext;
    this.saveToStorage();
    return { expGained: 0, leveledUp: false, newLevel: 100 };
  }
```
Direct call to `cardNurtureStore.nurtureCard(50, 500)` will modify unowned card 50, violating `PROJECT.md` Feature 13 contract (`cardNurtureStore.nurtureCard(cardId: number, expGain: number): { expGained: number; leveledUp: boolean; newLevel: number } (guarded by isCardOwned)`) and `tests/e2e/tier1_feature_coverage.ts` assertion `T1.CARD.2`.

### Observation 1.2: `awardBattleVictoryExp` monkey-patched in `playRpgEngine.ts`
In `src/landing/services/playRpgEngine.ts` (lines 40–66):
```typescript
// Attach awardBattleVictoryExp and getCard to cardNurtureStore if not already present
if (typeof (cardNurtureStore as any).getCard !== 'function') { ... }

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
`CardNurtureStore` class itself in `src/landing/services/cardNurtureStore.ts` does not natively declare or implement `awardBattleVictoryExp`, `getCard`, `setRepeatHunting`, or `isRepeatHuntingActive`. Furthermore, `playRpgEngine.ts` returns `{ expAwarded, deckCount }` whereas `tests/e2e/helpers.ts` lines 302–312 and `tests/e2e/types.ts` line 58 expect `{ expAwarded: number; updatedCards: number[] }`.

### Observation 1.3: `MobileCardPlayScreen.tsx` win hook does not call `awardBattleVictoryExp`
In `src/views/MobileCardPlayScreen.tsx` (lines 1126–1137):
```typescript
if (winState === 'player') {
  playSound('win');
  const earnSns = 30;
  if (!recordMatchResult && updateSns) updateSns(earnSns, 'battle_victory', 'earned');
  if (!recordMatchResult && updateStats) {
    updateStats({
      wins: (userStats?.wins || 0) + 1,
      winStreak: (userStats?.winStreak || 0) + 1
    });
  }
  if (onEarnXp) onEarnXp(50);
```
`MobileCardPlayScreen.tsx` awards in-game SNS and calls `onEarnXp(50)` (for user level XP), but never calls `cardNurtureStore.awardBattleVictoryExp(50)` to award EXP to the active deck's 5 cards in `hero_card_nurturing`.

### Observation 1.4: `MobileCardPlayScreen.tsx` match completion overlay lacks `[🔁 반복 사냥]`
In `src/views/MobileCardPlayScreen.tsx` (lines 2515–2616):
The match completion modal under `gameOver && (` provides `재대결` (Rematch), `나가기` (Exit), or 3-second ranking auto-loop, but does not provide a `[🔁 반복 사냥]` toggle button nor does it respect `hero_repeat_hunting` from `localStorage` to execute a hands-free auto-restart loop without manual clicking.

### Observation 1.5: `playRpgEngine.ts` repeat hunting does not auto-restart
In `src/landing/services/playRpgEngine.ts` (lines 562–573):
```typescript
export function finishBattleAndAwardExp(): { expAwarded: number; deckCount: number } {
  const result = (cardNurtureStore as any).awardBattleVictoryExp(50);

  // If autoMode is active, automatically advance to next chapter
  if (playRpgState.autoMode) {
    setTimeout(() => {
      advanceNextChapter();
    }, 1500);
  }

  return result;
}
```
When `playRpgState.repeatHunting` is true, battle finish does NOT auto-restart `initBattle()`. It only checks `autoMode` to advance chapters. Defeats or draws also do not trigger repeat restart when `repeatHunting` is active.

### Observation 1.6: Free EXP buttons present in `CardSection.tsx`
In `src/landing/views/CardSection.tsx` (lines 257–283):
```html
<!-- Nurture Buttons -->
<div class="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
  <button
    type="button"
    data-action="nurture-card"
    data-card-id="${selectedCard.cardId}"
    data-exp="50"
    ...
  >
    ${selectedCard.level >= 100 ? '최대 레벨 도달 (Lv.100 MAX)' : '카드 육성하기 (+50 EXP)'}
  </button>
  <button
    type="button"
    data-action="nurture-card"
    data-card-id="${selectedCard.cardId}"
    data-exp="500"
    ...
  >
    10회 연속 육성 (+500 EXP)
  </button>
</div>
```
These buttons allow direct free EXP granting from `#card` without card battles, violating Feature 13 & Feature 14: "Character nurturing is restricted strictly to owned characters. Nurturing requires EXP earned exclusively by winning card battles."

---

## 2. Logic Chain

1. **Owned-Only Nurturing & Victory EXP Gating (Feature 13 & 14)**:
   - Premise: `PROJECT.md` specifies that character nurturing is strictly gated by card ownership and card battle victory EXP. Free EXP buttons must be eliminated.
   - Deduction:
     a) `cardNurtureStore.ts` must guard `nurtureCard(cardId, expGain)` with `if (!this.isCardOwned(cardId)) return { expGained: 0, leveledUp: false, newLevel: this.cards[cardId]?.level || 1 };`.
     b) `CardNurtureStore` must natively implement `awardBattleVictoryExp(expGain: number = 50)`: iterating over `this.activeDeckIds`, ensuring card ownership, calling `this.nurtureCard(cardId, expGain)`, persisting to `hero_card_nurturing`, and returning `{ expAwarded: expGain, updatedCards, deckCount: updatedCards.length }`.
     c) `CardSection.tsx` must remove `data-action="nurture-card"` free EXP buttons, replacing them with a battle victory EXP gating information box and a link to `#play` (`<a href="#play">⚔️ 배틀 전장으로 이동 (EXP 획득)</a>`).
2. **Battle Engine Integration**:
   - Both `playRpgEngine.ts` (Landing 3x3 flip battle) and `MobileCardPlayScreen.tsx` (React 3x3 tactical battle) represent battle completion pathways.
   - When a battle concludes with player victory in either engine, `cardNurtureStore.awardBattleVictoryExp(50)` must be called.
   - In `cardNurtureStore.ts`, the EXP formula `expToNext = level * 100` increments `card.level` by 1 and grants `card.statPoints += 1` per level up up to Level 100.
3. **Repeat Hunting (`[🔁 반복 사냥]`) Loop (Feature 15)**:
   - Premise: When Repeat Hunting is enabled (persisted in `localStorage.getItem('hero_repeat_hunting') === 'true'`), battles should automatically repeat hands-free upon victory or completion without requiring user clicks.
   - In `playRpgEngine.ts`: In `finishBattleAndAwardExp()` and `finalizeBattle()`, if `playRpgState.repeatHunting` is true, schedule `setTimeout(() => initBattle(), 1500)`.
   - In `PlaySection.tsx`: On match completion overlay, show `[🔁 반복 사냥 진행 중 (1.5초 후 자동 재시작)]` and keep `[🔁 반복 사냥 재전투]` button active.
   - In `MobileCardPlayScreen.tsx`: Add `isRepeatHunting` state backed by `hero_repeat_hunting`, provide a `[🔁 반복 사냥]` toggle button on the `gameOver` result dialog, and when active, auto-restart `initMatchDecks()` after 1.5s countdown.

---

## 3. Caveats

1. **Dual Storage Keys**: `hero_repeat_hunting` is stored as a string `'true'` or `'false'`. Any reader must parse with `=== 'true'`.
2. **Auto-Mode vs Repeat Hunting Priority**: If both `autoMode` and `repeatHunting` are enabled in `playRpgEngine.ts`, `repeatHunting` takes priority during battle completion to repeatedly battle the current node/encounter for EXP farming, while `autoMode` advances chapters only when repeat hunting is disabled.
3. **Backward Compatibility**: `awardBattleVictoryExp` returns `{ expAwarded, updatedCards, deckCount }` to satisfy both `types.ts` (`updatedCards`) and `playRpgEngine.ts` (`deckCount`).

---

## 4. Conclusion & Concrete Blueprint

### Concrete Blueprint: File-by-File Line Diffs

#### Target File 1: `src/landing/types.ts`
```diff
--- a/src/landing/types.ts
+++ b/src/landing/types.ts
@@ -69,6 +69,10 @@ export interface NurtureState {
   getTotalTP: () => number;
   nurtureCard: (cardId: number, expGain?: number) => { expGained: number; leveledUp: boolean; newLevel: number };
+  awardBattleVictoryExp?: (expGain?: number) => { expAwarded: number; updatedCards: number[]; deckCount: number };
+  getCard?: (cardId: number) => CardNurtureData;
+  setRepeatHunting?: (enabled: boolean) => void;
+  isRepeatHuntingActive?: () => boolean;
   allocateStat: (cardId: number, direction: 'top' | 'right' | 'bottom' | 'left') => boolean;
   hasUnspentPoints: (cardId: number) => boolean;
   saveToStorage: () => void;
```

---

#### Target File 2: `src/landing/services/cardNurtureStore.ts`
```diff
--- a/src/landing/services/cardNurtureStore.ts
+++ b/src/landing/services/cardNurtureStore.ts
@@ -27,6 +27,7 @@ export const DECK_STORAGE_KEY = 'hero_deck';
+export const REPEAT_HUNTING_KEY = 'hero_repeat_hunting';
 
 export interface CardNurtureStoragePayload {
@@ -41,6 +42,7 @@ export class CardNurtureStore implements NurtureState {
   storageKey = STORAGE_KEY;
   deckStorageKey = DECK_STORAGE_KEY;
+  repeatHuntingKey = REPEAT_HUNTING_KEY;
 
   // Alias for contract compatibility
@@ -82,6 +84,18 @@ export class CardNurtureStore implements NurtureState {
     return (dbCard.top || 0) + (dbCard.right || 0) + (dbCard.bottom || 0) + (dbCard.left || 0);
   }
 
+  getCard(cardId: number): CardNurtureData {
+    return (
+      this.cards[cardId] || {
+        cardId,
+        level: 1,
+        exp: 0,
+        expToNext: 100,
+        statPoints: 0,
+        bonusStats: { top: 0, right: 0, bottom: 0, left: 0 },
+        totalBonus: 0,
+      }
+    );
+  }
+
   /**
    * Returns a copy of the active 5-card deck squad IDs
@@ -226,6 +240,11 @@ export class CardNurtureStore implements NurtureState {
   nurtureCard(cardId: number, expGain: number = 50): { expGained: number; leveledUp: boolean; newLevel: number } {
+    if (!this.isCardOwned(cardId)) {
+      return { expGained: 0, leveledUp: false, newLevel: this.cards[cardId]?.level || 1 };
+    }
+
     let card = this.cards[cardId];
     if (!card) {
@@ -268,6 +287,41 @@ export class CardNurtureStore implements NurtureState {
   }
 
+  /**
+   * Award 50 EXP to all cards in active deck squad (slots 0..4) upon card battle victory
+   */
+  awardBattleVictoryExp(expGain: number = 50): { expAwarded: number; updatedCards: number[]; deckCount: number } {
+    this.ensureValidDeck();
+    const updatedCards: number[] = [];
+    for (const cardId of this.activeDeckIds) {
+      if (this.isCardOwned(cardId)) {
+        this.nurtureCard(cardId, expGain);
+        updatedCards.push(cardId);
+      }
+    }
+    this.saveToStorage();
+    if (typeof window !== 'undefined') {
+      window.dispatchEvent(
+        new CustomEvent('snshero_battle_exp_awarded', {
+          detail: { expAwarded: expGain, updatedCards },
+        })
+      );
+    }
+    return { expAwarded: expGain, updatedCards, deckCount: updatedCards.length };
+  }
+
+  setRepeatHunting(enabled: boolean): void {
+    if (typeof localStorage === 'undefined') return;
+    try {
+      localStorage.setItem(this.repeatHuntingKey, enabled ? 'true' : 'false');
+    } catch {}
+    if (typeof window !== 'undefined') {
+      window.dispatchEvent(new CustomEvent('snshero_repeat_hunting_changed', { detail: { enabled } }));
+    }
+  }
+
+  isRepeatHuntingActive(): boolean {
+    if (typeof localStorage === 'undefined') return false;
+    try {
+      return localStorage.getItem(this.repeatHuntingKey) === 'true';
+    } catch {
+      return false;
+    }
+  }
```

---

#### Target File 3: `src/landing/services/playRpgEngine.ts`
```diff
--- a/src/landing/services/playRpgEngine.ts
+++ b/src/landing/services/playRpgEngine.ts
@@ -546,14 +546,24 @@ export function finalizeBattle(): void {
   if (pScore > oScore) {
     playRpgState.battleWinner = 'player';
     playRpgState.battleMessage = `🎉 승리! (스코어 ${pScore} : ${oScore}) +50 EXP가 활성 덱 전원에 지급되었습니다.`;
     finishBattleAndAwardExp();
   } else if (pScore < oScore) {
     playRpgState.battleWinner = 'opponent';
     playRpgState.battleMessage = `패배 (스코어 ${pScore} : ${oScore}). 재도전하거나 덱을 보강하세요.`;
+    if (playRpgState.repeatHunting) {
+      setTimeout(() => {
+        initBattle();
+      }, 1500);
+    }
   } else {
     playRpgState.battleWinner = 'draw';
     playRpgState.battleMessage = `무승부 (스코어 ${pScore} : ${oScore}).`;
+    if (playRpgState.repeatHunting) {
+      setTimeout(() => {
+        initBattle();
+      }, 1500);
+    }
   }
 }
 
 /**
  * Award 50 EXP upon victory and persist progress
  */
-export function finishBattleAndAwardExp(): { expAwarded: number; deckCount: number } {
-  const result = (cardNurtureStore as any).awardBattleVictoryExp(50);
-
-  // If autoMode is active, automatically advance to next chapter
-  if (playRpgState.autoMode) {
+export function finishBattleAndAwardExp(): { expAwarded: number; deckCount: number; updatedCards?: number[] } {
+  const result = cardNurtureStore.awardBattleVictoryExp
+    ? cardNurtureStore.awardBattleVictoryExp(50)
+    : (cardNurtureStore as any).awardBattleVictoryExp(50);
+
+  // If repeat hunting is active, immediately repeat battle
+  if (playRpgState.repeatHunting) {
+    setTimeout(() => {
+      initBattle();
+    }, 1500);
+  } else if (playRpgState.autoMode) {
+    // If autoMode is active without repeat hunting, advance to next chapter
     setTimeout(() => {
       advanceNextChapter();
     }, 1500);
   }
 
   return result;
 }
@@ -609,8 +619,12 @@ export function toggleAutoMode(): boolean {
 export function toggleRepeatHunting(): boolean {
   playRpgState.repeatHunting = !playRpgState.repeatHunting;
-  try {
-    localStorage.setItem('hero_repeat_hunting', String(playRpgState.repeatHunting));
-  } catch {}
+  if (cardNurtureStore.setRepeatHunting) {
+    cardNurtureStore.setRepeatHunting(playRpgState.repeatHunting);
+  } else {
+    try {
+      localStorage.setItem('hero_repeat_hunting', String(playRpgState.repeatHunting));
+    } catch {}
+  }
   return playRpgState.repeatHunting;
 }
```

---

#### Target File 4: `src/landing/views/PlaySection.tsx`
```diff
--- a/src/landing/views/PlaySection.tsx
+++ b/src/landing/views/PlaySection.tsx
@@ -837,6 +837,11 @@ function renderAdventureView(): string {
                         ${
                           playRpgState.battleWinner === 'player'
                             ? '🎉 전투 승리! 50 EXP 획득 완료.'
                             : '패배. 다시 도전하세요.'
                         }
+                        ${
+                          playRpgState.repeatHunting
+                            ? ' <span class="text-amber-300 font-normal">[🔁 반복 사냥 1.5초 후 재시작]</span>'
+                            : ''
+                        }
                       </div>
 
                       <div class="flex items-center gap-2">
                         <button
                           type="button"
                           data-action="play-repeat-hunting"
                           class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-sm min-h-[44px] cursor-pointer"
                         >
                           🔁 반복 사냥 재전투
                         </button>
```

---

#### Target File 5: `src/views/MobileCardPlayScreen.tsx`
```diff
--- a/src/views/MobileCardPlayScreen.tsx
+++ b/src/views/MobileCardPlayScreen.tsx
@@ -35,6 +35,7 @@ import {
   type DemoPlayStep
 } from '../lib/demoPlayService';
+import { cardNurtureStore } from '../landing/services/cardNurtureStore';
 
@@ -300,6 +301,13 @@ export const MobileCardPlayScreen: React.FC<MobileCardPlayScreenProps> = ({
   const [playerHand, setPlayerHand] = useState<CardData[]>([]);
   const [opponentHand, setOpponentHand] = useState<CardData[]>([]);
+  const [isRepeatHunting, setIsRepeatHunting] = useState<boolean>(() => {
+    try {
+      return localStorage.getItem('hero_repeat_hunting') === 'true';
+    } catch {
+      return false;
+    }
+  });
 
@@ -1136,6 +1144,11 @@ export const MobileCardPlayScreen: React.FC<MobileCardPlayScreenProps> = ({
           if (onEarnXp) onEarnXp(50);
+          try {
+            cardNurtureStore.awardBattleVictoryExp(50);
+          } catch (err) {
+            console.warn('[MobileCardPlayScreen] cardNurtureStore.awardBattleVictoryExp error:', err);
+          }
 
@@ -1421,7 +1434,7 @@ export const MobileCardPlayScreen: React.FC<MobileCardPlayScreenProps> = ({
   useEffect(() => {
     if (!gameOver || !winner) return;
-    if (autoCloseOnComplete) {
+    if (autoCloseOnComplete && !isRepeatHunting) {
       const timer = setTimeout(() => {
         handleExitGame();
       }, 1600);
       return () => clearTimeout(timer);
     }
-  }, [gameOver, winner, autoCloseOnComplete, handleExitGame]);
+  }, [gameOver, winner, autoCloseOnComplete, isRepeatHunting, handleExitGame]);
 
@@ -1475,7 +1488,7 @@ export const MobileCardPlayScreen: React.FC<MobileCardPlayScreenProps> = ({
     // 3) RPG 자동완료 모드인 경우
-    if (autoCloseOnComplete) {
+    if (autoCloseOnComplete && !isRepeatHunting) {
       setRematchCountdown(null);
       setTutorialShopCountdown(null);
       return;
     }
@@ -2533,6 +2546,26 @@ export const MobileCardPlayScreen: React.FC<MobileCardPlayScreenProps> = ({
               )}
 
+              {/* Repeat Hunting Toggle Option */}
+              <div className="w-full my-2">
+                <button
+                  type="button"
+                  onClick={() => {
+                    const nextState = !isRepeatHunting;
+                    setIsRepeatHunting(nextState);
+                    try {
+                      localStorage.setItem('hero_repeat_hunting', String(nextState));
+                    } catch {}
+                  }}
+                  className={cn(
+                    "w-full min-h-[44px] py-2 px-3 text-xs font-bold rounded-sm cursor-pointer flex items-center justify-center gap-1.5 transition-colors",
+                    isRepeatHunting
+                      ? "bg-emerald-800 text-white border border-emerald-600"
+                      : "bg-[#f1eeee] text-[#201d1d] border border-[#0f0000]/12 hover:bg-[#e8e5e5]"
+                  )}
+                >
+                  <span>🔁</span>
+                  <span>{language === 'ko' ? `반복 사냥 [ ${isRepeatHunting ? 'ON' : 'OFF'} ]` : `Repeat Hunting [ ${isRepeatHunting ? 'ON' : 'OFF'} ]`}</span>
+                </button>
+              </div>
```

---

#### Target File 6: `src/landing/views/CardSection.tsx`
```diff
--- a/src/landing/views/CardSection.tsx
+++ b/src/landing/views/CardSection.tsx
@@ -256,29 +256,17 @@ export function renderCardSection(): string {
-                <!-- Nurture Buttons -->
-                <div class="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
-                  <button
-                    type="button"
-                    data-action="nurture-card"
-                    data-card-id="${selectedCard.cardId}"
-                    data-exp="50"
-                    ${selectedCard.level >= 100 ? 'disabled' : ''}
-                    class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer ${
-                      selectedCard.level >= 100 ? 'opacity-50 cursor-not-allowed' : ''
-                    }"
-                  >
-                    ${selectedCard.level >= 100 ? '최대 레벨 도달 (Lv.100 MAX)' : '카드 육성하기 (+50 EXP)'}
-                  </button>
-                  <button
-                    type="button"
-                    data-action="nurture-card"
-                    data-card-id="${selectedCard.cardId}"
-                    data-exp="500"
-                    ${selectedCard.level >= 100 ? 'disabled' : ''}
-                    class="px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-semibold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] flex items-center justify-center cursor-pointer ${
-                      selectedCard.level >= 100 ? 'opacity-50 cursor-not-allowed' : ''
-                    }"
-                  >
-                    10회 연속 육성 (+500 EXP)
-                  </button>
-                </div>
+                <!-- Battle Victory EXP Gating Info & Navigation -->
+                <div class="pt-2 flex flex-col sm:flex-row items-center gap-2">
+                  <div class="p-2.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-xs text-stone-700 flex items-center gap-2">
+                    <span>⚔️</span>
+                    <span>경험치는 카드 배틀 승리 시에만 획득됩니다 (+50 EXP / 승리).</span>
+                  </div>
+                  <a
+                    href="#play"
+                    class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer no-underline"
+                  >
+                    ⚔️ 배틀 전장으로 이동 (EXP 획득)
+                  </a>
+                </div>
```

---

## 5. Verification Method

### 1. Automated E2E Test Suite Execution
Run the full 4-tier E2E test runner:
```bash
npx tsx tests/e2e/run_all.ts
```
Expected output:
- `[T1.CARD.2] [M4] Strict Owned-Only Nurturing Restriction (isCardOwned Guard)`: PASS
- `[T1.CARD.3] [M4] Complete Elimination of Free EXP Buttons in Nurturing Interface`: PASS
- `[T1.CARD.4] [M4] Battle Victory EXP Gating Hook (50 EXP per Victory)`: PASS
- `[T1.CARD.5] [M4] Repeat Hunting (반복 사냥) Auto-Loop Match Completion Flag`: PASS
- `[T1.CARD.6] [M4] 1~100Lv EXP Curve & 4-Way Stat Point Allocation`: PASS
- `[T3.C1.2] [M3] Battle Victory EXP Hook -> Level Up -> Stat Point -> Deck TP Dynamic Sync`: PASS
- `[T3.C1.5] [M4] Repeat Hunting Loop Executes Consecutive Battles and Accrues EXP`: PASS
- `[T4.W1.3] [M3] Core RPG Gameplay Loop: Tile Movement -> Battle Victory EXP -> Repeat Hunting`: PASS
- `[T4.W1.4] [M4] Deck Strategy & Owned Card Nurturing Loop`: PASS
- Total pass rate: 100.0% (76/76 passing).

### 2. Type Checking & Production Build Validation
```bash
npx tsc --noEmit
npm run build
```
Expected output:
- `tsc --noEmit` exits with code 0 (zero type errors).
- `vite build` completes successfully with code 0.

### 3. Invalidation Conditions
- Any occurrence of free EXP grant buttons in `src/landing/views/CardSection.tsx`.
- Unowned card IDs gaining EXP or leveling up when calling `nurtureCard`.
- `hero_repeat_hunting` not toggling or not restarting battles automatically on match completion.
