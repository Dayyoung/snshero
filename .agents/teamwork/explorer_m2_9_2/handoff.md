# Handoff Report: MyDeck Section & Slot Editing Parity (M2-9-2)

- **Agent**: explorer_m2_9_2
- **Milestone**: M2-9-2 (MyDeck Section & Slot Editing Parity)
- **Target Files**:
  - `src/landing/types.ts`
  - `src/landing/services/cardNurtureStore.ts`
  - `src/landing/views/MyDeckSection.tsx`
  - `src/landing/index.ts`
- **Status**: COMPLETE (Exploration & Implementation Plan Ready for Worker)

---

## 1. Observation

### Codebase Investigation Findings

1. **`src/landing/views/MyDeckSection.tsx` (Current State)**
   - Line 88:
     ```ts
     // Active 5 cards compose the current deck slots
     const activeDeckIds = cardNurtureStore.ownedCardIds.slice(0, 5);
     ```
     `MyDeckSection.tsx` currently hardcodes the active squad to `cardNurtureStore.ownedCardIds.slice(0, 5)`.
   - Line 210–218:
     ```ts
     <div
       role="button"
       tabindex="0"
       data-action="select-deck-card"
       data-card-id="${cardId}"
       class="..."
     >
     ```
     Clicking a slot card only triggers `select-deck-card`, which simply updates `selectedDeckCardId` for the bottom 7-head detail card. There is **no card selection drawer or modal**, no swap action trigger, and no slot index passed.
   - There is no mechanism in `MyDeckSection.tsx` to swap cards, select a slot for replacement, or prevent squad duplicates.

2. **`src/landing/services/cardNurtureStore.ts` (Current State)**
   - Line 31: `ownedCardIds: number[] = [1, 2, 3, 4, 5];`
   - Line 68–76:
     ```ts
     getDeckTP(): number {
       const activeDeckIds = this.ownedCardIds.slice(0, 5);
       return activeDeckIds.reduce((sum, id) => {
         const card = this.cards[id];
         const basePower = this.getCardBasePower(id);
         const bonus = card ? card.totalBonus : 0;
         return sum + basePower + bonus;
       }, 0);
     }
     ```
     `getDeckTP()` always computes power from `ownedCardIds.slice(0, 5)`. It does not maintain an independent active 5-card squad array.
   - Missing methods specified by `PROJECT.md` § Interface Contracts:
     - `getDeckCardIds(): number[]`
     - `getOwnedCards(): OwnedCardInfo[]`
     - `setDeckCard(slotIndex: number, cardId: number): boolean`
     - `isCardInDeck(cardId: number): boolean`
   - `saveToStorage()` only persists `cards` and `ownedCardIds` to `hero_card_nurturing`. It does not persist `deckCardIds`, nor does it dual-sync to legacy `hero_deck` or season keys (`hero_deck_${season}`, `hero_deck_guest_${season}`).
   - `loadFromStorage()` does not restore `deckCardIds` or bootstrap from legacy `hero_deck`.

3. **`src/views/MyDeckView.tsx` & `src/App.tsx` (Legacy Format Analysis)**
   - In `src/App.tsx` (Lines 1327–1356), `hero_deck` in LocalStorage is parsed as:
     ```ts
     const saved = savedGuest || savedStandard || rawStandard;
     if (saved) {
       const parsed = JSON.parse(saved);
       if (Array.isArray(parsed) && parsed.length > 0) {
         return parsed.map((c: any) => syncCardWithDatabase(c, finalInv));
       }
     }
     ```
   - In `src/constants.ts` (Line 200–210), `syncCardWithDatabase(card, inventory)` resolves card database stats using `card.imageIndex !== undefined ? Number(card.imageIndex) : undefined`.
   - In `src/views/MyDeckView.tsx` (Lines 586–593):
     ```ts
     const season = currentSeason || 'season1';
     localStorage.setItem('hero_deck', JSON.stringify(updatedDeck));
     localStorage.setItem(`hero_deck_${season}`, JSON.stringify(updatedDeck));
     localStorage.setItem(`hero_deck_guest_${season}`, JSON.stringify(updatedDeck));
     window.dispatchEvent(new Event('snshero_deck_updated'));
     ```
     Legacy views expect `hero_deck` to store an array of `CardData` objects with `imageIndex: number`, and they listen to `snshero_deck_updated`.

4. **`src/landing/index.ts` (Event Delegation Current State)**
   - Line 263–268:
     ```ts
     } else if (action === 'select-deck-card') {
       const cardIdStr = target.getAttribute('data-card-id');
       if (cardIdStr) {
         state.selectedDeckCardId = parseInt(cardIdStr, 10);
         renderApp();
       }
     }
     ```
     Lacks handlers for `open-deck-swap-drawer`, `close-deck-swap-drawer`, and `swap-deck-card`.
   - Line 320–330 (`handleGlobalKeydown`): Escape key closes modals and sidebars, but does not close the deck swap drawer if open.

---

## 2. Logic Chain

1. **State Independence**:
   The active squad comprises exactly 5 card slots (`0..4`). While starter players have `ownedCardIds = [1, 2, 3, 4, 5]`, players acquire new cards via shop packs and rewards (`addCard(id)`). Therefore, the active deck squad (`deckCardIds: number[]`) must be distinct from `ownedCardIds`.

2. **Slot Selection & Drawer Open**:
   When a user clicks a deck slot (0..4) or its explicit `[🔄 영웅 교체]` trigger button, `MyDeckSection` enters editing mode for that slot (`deckSectionState.editingSlotIndex = slotIndex`). This renders an interactive Card Selection Drawer/Modal overlay displaying all owned cards via `cardNurtureStore.getOwnedCards()`.

3. **Duplicate Prevention Guard**:
   In any competitive TCG deck, a single unique hero card cannot occupy two slots simultaneously in an active 5-man squad.
   - If Card `X` is already placed in another slot `s !== slotIndex`, the drawer marks Card `X` with a `[SLOT 0${s+1} 출격 중 (중복 불가)]` badge and disables the select button (`disabled cursor-not-allowed`).
   - At the store layer, `setDeckCard(slotIndex, cardId)` checks `const existing = this.deckCardIds.indexOf(cardId); if (existing !== -1 && existing !== slotIndex) return false;`. This enforces a dual-layer guard (UI disabled + store rejection).

4. **Swap Execution & Real-Time TP Recalculation**:
   When the user clicks `[이 영웅으로 교체 (EQUIP) →]`:
   - `cardNurtureStore.setDeckCard(slotIndex, cardId)` assigns `this.deckCardIds[slotIndex] = cardId`.
   - `saveToStorage()` persists `deckCardIds` to `hero_card_nurturing`.
   - `syncToLegacyDeck()` serializes `CardData[]` to `hero_deck`, `hero_deck_${season}`, and `hero_deck_guest_${season}`, and dispatches `snshero_deck_updated`.
   - `cardNurtureStore.getDeckTP()` dynamically sums `basePower + totalBonus` for the active 5 cards in `this.deckCardIds`.
   - `cardNurtureStore.getTotalTP()` dynamically sums `basePower + totalBonus` across all cards in `this.ownedCardIds`.
   - The drawer closes (`deckSectionState.editingSlotIndex = null`), `deckSectionState.selectedCardId = cardId`, and the UI re-renders with updated metrics.

5. **Design System (DESIGN.md) & Ergonomics**:
   - Monospace typography (`font-mono`).
   - Strict 2-tier border radius: `rounded-none` (0px) on modal dialog and card frames; `rounded-sm` (4px) on buttons and badges.
   - Flat single-tone surfaces: `#fdfcfc` (Warm Cream surface), `#f8f7f7`, and `#201d1d` (Ink Dark).
   - 1px hairline borders (`border border-[#201d1d]` or `border-[rgba(15,0,0,0.12)]`).
   - Minimum 44px touch targets (`min-h-[44px] min-w-[44px]`) on all interactive buttons, including slot headers, drawer close buttons, and card swap buttons.
   - Top-layer `[✕ 닫기]` button and Escape key dismiss guard.

---

## 3. Caveats

1. **Owned Cards Count for Fresh Accounts**:
   Default accounts start with 5 owned cards (`[1, 2, 3, 4, 5]`). In this initial state, all 5 cards occupy slots 0..4. If the drawer opens on a starter account with 0 additional cards, all other 4 cards will be correctly shown as "출격 중 (중복 불가)". When the player unlocks additional cards from the Shop (`#shop`), those cards immediately appear in the drawer as available for swapping.
2. **Legacy Deck Synchronization Fallback**:
   If a user visits `#deck` having previously configured a deck in legacy `/deck` (`MyDeckView.tsx`), `cardNurtureStore.loadFromStorage()` inspects `localStorage.getItem('hero_deck')`, extracts the 5 card IDs, and automatically registers them into `deckCardIds` and `ownedCardIds`, ensuring zero data loss during the SPA migration.
3. **No Direct Production File Edits**:
   As an explorer, this agent did not modify any source code files directly. All recommendations are presented below as drop-in diffs and replacement files for Worker `worker_m2_9_2`.

---

## 4. Conclusion & Drop-In Code Recommendations

### Proposed Modifications by File

#### File 1: `src/landing/types.ts`
Expand `NurtureState` to include `deckCardIds`, `OwnedCardInfo`, `getDeckCardIds`, `getOwnedCards`, `setDeckCard`, `swapDeckCards`, and `isCardInDeck`.

```typescript
// Add OwnedCardInfo interface:
export interface OwnedCardInfo extends CardNurtureData {
  basePower: number;
  totalTP: number;
}

// Update NurtureState interface:
export interface NurtureState {
  cards: Record<number, CardNurtureData>;
  ownedCardIds: number[];
  deckCardIds: number[];
  getDeckCardIds: () => number[];
  getOwnedCards: () => OwnedCardInfo[];
  setDeckCard: (slotIndex: number, cardId: number) => boolean;
  swapDeckCards?: (slotA: number, slotB: number) => boolean;
  isCardInDeck?: (cardId: number) => boolean;
  getDeckTP: () => number;
  getTotalTP: () => number;
  nurtureCard: (cardId: number, expGain?: number) => { expGained: number; leveledUp: boolean; newLevel: number };
  allocateStat: (cardId: number, direction: 'top' | 'right' | 'bottom' | 'left') => boolean;
  hasUnspentPoints: (cardId: number) => boolean;
  saveToStorage: () => void;
  loadFromStorage: () => void;
}
```

---

#### File 2: `src/landing/services/cardNurtureStore.ts`
Full upgrade of `CardNurtureStore`:
1. Add `deckCardIds: number[] = [1, 2, 3, 4, 5];`
2. Update `CardNurtureStoragePayload` with `deckCardIds?: number[];`
3. Implement `getDeckCardIds(): number[]`
4. Implement `getOwnedCards(): OwnedCardInfo[]`
5. Implement `isCardInDeck(cardId: number): boolean`
6. Implement `setDeckCard(slotIndex: number, cardId: number): boolean` with duplicate prevention and LocalStorage persistence.
7. Update `getDeckTP(): number` to compute from `this.deckCardIds`.
8. Update `saveToStorage()` to persist `deckCardIds` and call `syncToLegacyDeck()`.
9. Implement `syncToLegacyDeck()` formatting `CardData[]` with `imageIndex` for `hero_deck`, `hero_deck_${season}`, and `hero_deck_guest_${season}`.
10. Update `loadFromStorage()` with `bootstrapDeckFromLegacy()` and `ensureValidDeck()`.

**Exact drop-in implementation for `src/landing/services/cardNurtureStore.ts`**:

```typescript
/**
 * src/landing/services/cardNurtureStore.ts
 *
 * Card Nurturing & Stat Enhancement Engine for SNSHero Landing.
 *
 * Features:
 *   - 1~100Lv EXP progression curve (expToNext = level * 100)
 *   - Stat point grant on level-up (1 point per level gained)
 *   - 4-way directional stat allocation (Top, Right, Bottom, Left)
 *   - Red dot indicator check (hasUnspentPoints)
 *   - Active 5-card deck squad tracking (deckCardIds: slots 0..4)
 *   - Real-time Deck TP (5 active cards sum) & Total TP (all owned cards sum)
 *   - Full My Deck slot editing & card swap parity with duplicate prevention
 *   - Dual-sync with legacy hero_deck and season keys (CardData[] format)
 *   - Permanent LocalStorage auto-persistence under 'hero_card_nurturing'
 *   - Corrupted JSON recovery and clean missing key initialization
 *
 * Fully adheres to PROJECT.md § Interface Contracts and OpenCode Terminal-Flat standards.
 */

import { CardNurtureData, NurtureState, BonusStats } from '../types';
import { CARD_DATABASE } from '../../cardDatabase';
import { INITIAL_SKILLS } from '../../constants';

export const STORAGE_KEY = 'hero_card_nurturing';

export interface OwnedCardInfo extends CardNurtureData {
  basePower: number;
  totalTP: number;
}

export interface CardNurtureStoragePayload {
  cards: Record<number, CardNurtureData>;
  ownedCardIds: number[];
  deckCardIds?: number[];
  updatedAt: number;
}

export class CardNurtureStore implements NurtureState {
  cards: Record<number, CardNurtureData> = {};
  ownedCardIds: number[] = [1, 2, 3, 4, 5]; // Default 5 starter cards
  deckCardIds: number[] = [1, 2, 3, 4, 5];  // Active 5 cards in squad (slots 0..4)
  storageKey = STORAGE_KEY;

  constructor() {
    this.initDefaultCards();
    this.loadFromStorage();
  }

  /**
   * Initialize clean baseline state for all 110 cards (Level 1, 0 EXP, 0 bonus stats)
   */
  initDefaultCards(): void {
    for (let id = 1; id <= 110; id++) {
      this.cards[id] = {
        cardId: id,
        level: 1,
        exp: 0,
        expToNext: 100, // Level * 100
        statPoints: 0,
        bonusStats: { top: 0, right: 0, bottom: 0, left: 0 },
        totalBonus: 0,
      };
    }
  }

  /**
   * Helper to retrieve card's base power from CARD_DATABASE (top + right + bottom + left)
   */
  getCardBasePower(cardId: number): number {
    const dbCard = CARD_DATABASE[cardId];
    if (!dbCard) return 8;
    return (dbCard.top || 0) + (dbCard.right || 0) + (dbCard.bottom || 0) + (dbCard.left || 0);
  }

  /**
   * Returns a copy of the active 5-card deck squad IDs
   */
  getDeckCardIds(): number[] {
    this.ensureValidDeck();
    return [...this.deckCardIds];
  }

  /**
   * Returns rich data for all owned cards in inventory (for drawer/modal selection)
   */
  getOwnedCards(): OwnedCardInfo[] {
    return this.ownedCardIds.map(id => {
      const card = this.cards[id] || {
        cardId: id,
        level: 1,
        exp: 0,
        expToNext: 100,
        statPoints: 0,
        bonusStats: { top: 0, right: 0, bottom: 0, left: 0 },
        totalBonus: 0,
      };
      const basePower = this.getCardBasePower(id);
      return {
        ...card,
        basePower,
        totalTP: basePower + card.totalBonus,
      };
    });
  }

  /**
   * Check if a card is currently assigned to any slot in the active deck
   */
  isCardInDeck(cardId: number): boolean {
    return this.deckCardIds.includes(cardId);
  }

  /**
   * Active 5-card deck TP formula: sum of (basePower + totalBonus) for the 5 active deck cards
   */
  getDeckTP(): number {
    this.ensureValidDeck();
    return this.deckCardIds.reduce((sum, id) => {
      const card = this.cards[id];
      const basePower = this.getCardBasePower(id);
      const bonus = card ? card.totalBonus : 0;
      return sum + basePower + bonus;
    }, 0);
  }

  /**
   * Total TP formula: sum of (basePower + totalBonus) across all owned cards in inventory
   */
  getTotalTP(): number {
    return this.ownedCardIds.reduce((sum, id) => {
      const card = this.cards[id];
      const basePower = this.getCardBasePower(id);
      const bonus = card ? card.totalBonus : 0;
      return sum + basePower + bonus;
    }, 0);
  }

  /**
   * Swap/assign an owned card into a specific deck slot (0..4).
   * Validates slot index, card ID, ownership, and duplicate prevention.
   */
  setDeckCard(slotIndex: number, cardId: number): boolean {
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= 5) {
      console.warn(`[cardNurtureStore] Invalid slot index: ${slotIndex}`);
      return false;
    }
    if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110) {
      console.warn(`[cardNurtureStore] Invalid card ID: ${cardId}`);
      return false;
    }
    if (!this.isCardOwned(cardId)) {
      console.warn(`[cardNurtureStore] Cannot equip unowned card ID: ${cardId}`);
      return false;
    }

    // Duplicate Prevention: Cannot select a card already equipped in another slot
    const existingSlot = this.deckCardIds.indexOf(cardId);
    if (existingSlot !== -1 && existingSlot !== slotIndex) {
      console.warn(`[cardNurtureStore] Duplicate card prevention: Card ${cardId} is already in slot ${existingSlot}`);
      return false;
    }

    this.ensureValidDeck();
    this.deckCardIds[slotIndex] = cardId;
    this.saveToStorage();
    this.dispatchUpdateEvent(cardId);
    return true;
  }

  /**
   * Swap two deck slots
   */
  swapDeckCards(slotA: number, slotB: number): boolean {
    if (slotA < 0 || slotA >= 5 || slotB < 0 || slotB >= 5) return false;
    this.ensureValidDeck();
    const temp = this.deckCardIds[slotA];
    this.deckCardIds[slotA] = this.deckCardIds[slotB];
    this.deckCardIds[slotB] = temp;
    this.saveToStorage();
    this.dispatchUpdateEvent();
    return true;
  }

  /**
   * Nurture card: grants EXP, triggers level-up with stat points, enforces max level 100 cap
   */
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

    card.exp += expGain;
    let leveledUp = false;

    while (card.exp >= card.expToNext && card.level < 100) {
      card.exp -= card.expToNext;
      card.level += 1;
      card.statPoints += 1;
      card.expToNext = card.level * 100;
      leveledUp = true;
    }

    if (card.level >= 100) {
      card.level = 100;
      card.exp = card.expToNext;
    }

    this.saveToStorage();
    this.dispatchUpdateEvent(cardId);
    return { expGained: expGain, leveledUp, newLevel: card.level };
  }

  /**
   * Allocate 1 stat point to specified direction ('top' | 'right' | 'bottom' | 'left')
   */
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

  /**
   * Check if a card has unspent stat points (triggers red dot indicator)
   */
  hasUnspentPoints(cardId: number): boolean {
    const card = this.cards[cardId];
    return !!card && card.statPoints > 0;
  }

  /**
   * Add a new card to owned inventory (e.g. from shop or rewards)
   */
  addCard(cardId: number): boolean {
    if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110) return false;
    if (!this.ownedCardIds.includes(cardId)) {
      this.ownedCardIds.push(cardId);
      this.ownedCardIds.sort((a, b) => a - b);
      this.ensureValidDeck();
      this.saveToStorage();
      this.dispatchUpdateEvent(cardId);
      return true;
    }
    return false;
  }

  /**
   * Check if card is owned
   */
  isCardOwned(cardId: number): boolean {
    return this.ownedCardIds.includes(cardId);
  }

  /**
   * Get collection rate information: { ownedCount, totalCount: 110, percentage }
   */
  getCollectionRate(): { ownedCount: number; totalCount: number; percentage: string } {
    const ownedCount = this.ownedCardIds.length;
    const totalCount = 110;
    const percentage = ((ownedCount / totalCount) * 100).toFixed(1);
    return { ownedCount, totalCount, percentage };
  }

  /**
   * Save state to localStorage (hero_card_nurturing) and dual-sync to legacy hero_deck
   */
  saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      this.ensureValidDeck();
      const payload: CardNurtureStoragePayload = {
        cards: this.cards,
        ownedCardIds: this.ownedCardIds,
        deckCardIds: this.deckCardIds,
        updatedAt: Date.now(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
      this.syncToLegacyDeck();
    } catch (e) {
      console.warn('Failed to save hero_card_nurturing to localStorage:', e);
    }
  }

  /**
   * Dual-sync with legacy DeckView / hero_deck LocalStorage format.
   * Produces CardData[] items expected by App.tsx, MobileCardPlayScreen, and legacy DeckView.
   */
  syncToLegacyDeck(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const legacyDeck = this.deckCardIds.map((cardId, slotIndex) => {
        const dbCard = CARD_DATABASE[cardId];
        const nurture = this.cards[cardId];
        const bonus = nurture?.bonusStats || { top: 0, right: 0, bottom: 0, left: 0 };
        const top = (dbCard?.top || 2) + (bonus.top || 0);
        const right = (dbCard?.right || 2) + (bonus.right || 0);
        const bottom = (dbCard?.bottom || 2) + (bonus.bottom || 0);
        const left = (dbCard?.left || 2) + (bonus.left || 0);

        return {
          id: `deck-slot-${slotIndex}-${cardId}`,
          title: dbCard?.title || `Hero ${cardId}`,
          title_dis: dbCard?.title_dis || `[${cardId}]`,
          title_en: dbCard?.title_en || `Hero ${cardId}`,
          stats: [top, right, bottom, left] as [number, number, number, number],
          rarity: dbCard?.rarity || 'bronze',
          owner: 'player' as const,
          ownerSide: 'p1' as const,
          level: nurture?.level || 1,
          exp: nurture?.exp || 0,
          imageIndex: cardId,
          power: top + right + bottom + left,
          skills: [...INITIAL_SKILLS.map(s => ({ ...s }))],
        };
      });

      const serialized = JSON.stringify(legacyDeck);
      localStorage.setItem('hero_deck', serialized);
      localStorage.setItem(`hero_deck_${season}`, serialized);
      localStorage.setItem(`hero_deck_guest_${season}`, serialized);
      window.dispatchEvent(new Event('snshero_deck_updated'));
    } catch (e) {
      console.warn('Failed to sync to legacy hero_deck:', e);
    }
  }

  /**
   * Load state from localStorage with safe fallback for corrupted/missing data
   */
  loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(this.storageKey);

    if (!raw) {
      this.bootstrapDeckFromLegacy();
      this.ensureValidDeck();
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.cards && typeof parsed.cards === 'object') {
          for (let id = 1; id <= 110; id++) {
            const loaded = parsed.cards[id];
            if (loaded && typeof loaded.level === 'number') {
              this.cards[id] = {
                cardId: id,
                level: Math.min(100, Math.max(1, loaded.level)),
                exp: Math.max(0, loaded.exp || 0),
                expToNext: Math.min(100, Math.max(1, loaded.level)) * 100,
                statPoints: Math.max(0, loaded.statPoints || 0),
                bonusStats: {
                  top: Math.max(0, loaded.bonusStats?.top || 0),
                  right: Math.max(0, loaded.bonusStats?.right || 0),
                  bottom: Math.max(0, loaded.bonusStats?.bottom || 0),
                  left: Math.max(0, loaded.bonusStats?.left || 0),
                },
                totalBonus: Math.max(0, loaded.totalBonus || 0),
              };
            }
          }
        }
        if (Array.isArray(parsed.ownedCardIds) && parsed.ownedCardIds.length > 0) {
          this.ownedCardIds = Array.from(new Set(parsed.ownedCardIds))
            .filter((id): id is number => typeof id === 'number' && id >= 1 && id <= 110)
            .sort((a, b) => a - b);
        }
        if (Array.isArray(parsed.deckCardIds) && parsed.deckCardIds.length === 5) {
          this.deckCardIds = parsed.deckCardIds
            .filter((id): id is number => typeof id === 'number' && id >= 1 && id <= 110);
        }
      }
    } catch {
      this.initDefaultCards();
      this.ownedCardIds = [1, 2, 3, 4, 5];
      this.deckCardIds = [1, 2, 3, 4, 5];
    }

    if (!this.deckCardIds || this.deckCardIds.length !== 5) {
      this.bootstrapDeckFromLegacy();
    }

    this.ensureValidDeck();
  }

  /**
   * Bootstrap active deck from legacy hero_deck if available
   */
  private bootstrapDeckFromLegacy(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const rawLegacy = localStorage.getItem(`hero_deck_${season}`) || localStorage.getItem('hero_deck');
      if (rawLegacy) {
        const parsedLegacy = JSON.parse(rawLegacy);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          const extracted: number[] = [];
          for (const item of parsedLegacy) {
            const id = typeof item === 'number'
              ? item
              : Number(item?.imageIndex ?? item?.cardIndex ?? item?.id);
            if (Number.isInteger(id) && id >= 1 && id <= 110 && !extracted.includes(id)) {
              extracted.push(id);
              if (!this.ownedCardIds.includes(id)) {
                this.ownedCardIds.push(id);
              }
            }
          }
          if (extracted.length >= 5) {
            this.deckCardIds = extracted.slice(0, 5);
            return;
          }
        }
      }
    } catch {}
    this.deckCardIds = this.ownedCardIds.slice(0, 5);
  }

  /**
   * Guarantee that deckCardIds contains exactly 5 distinct, owned card IDs
   */
  private ensureValidDeck(): void {
    const valid: number[] = [];
    for (const id of this.deckCardIds) {
      if (Number.isInteger(id) && id >= 1 && id <= 110 && this.isCardOwned(id) && !valid.includes(id)) {
        valid.push(id);
      }
    }
    // Fill from ownedCardIds
    for (const ownedId of this.ownedCardIds) {
      if (valid.length >= 5) break;
      if (!valid.includes(ownedId)) {
        valid.push(ownedId);
      }
    }
    // Fallback to 1..5
    for (let id = 1; id <= 5; id++) {
      if (valid.length >= 5) break;
      if (!valid.includes(id)) {
        valid.push(id);
        if (!this.ownedCardIds.includes(id)) {
          this.ownedCardIds.push(id);
        }
      }
    }
    this.deckCardIds = valid.slice(0, 5);
  }

  private dispatchUpdateEvent(cardId?: number): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('snshero_card_nurture_updated', { detail: { cardId } }));
    }
  }
}

export const cardNurtureStore = new CardNurtureStore();
```

---

#### File 3: `src/landing/views/MyDeckSection.tsx`
Full upgrade of `MyDeckSection.tsx`:
1. Export `deckSectionState`: `editingSlotIndex: number | null` and `selectedCardId: number`.
2. Export `setEditingSlotIndex(slot: number | null)` and `getEditingSlotIndex()`.
3. Export `setSelectedDeckCardId(cardId: number)` and `getSelectedDeckCardId()`.
4. In Section 2, render each slot with:
   - Slot number (`SLOT 01`..`05`)
   - Bust image, name, level, N/E/S/W stats, TP
   - Red dot indicator if unspent stat points exist
   - `[🔄 영웅 교체]` button with `data-action="open-deck-swap-drawer" data-slot-index="${index}"` (`min-h-[44px]`).
   - Slot container with `data-action="select-deck-card"` to inspect details.
5. In Section 3, render deep inspection for the selected card, plus a quick swap action button: `[이 슬롯 카드 교체하기 (SWAP) →]`.
6. Implement `renderDeckSwapDrawer(editingSlot: number, activeDeckIds: number[])`:
   - Interactive modal drawer showing `cardNurtureStore.getOwnedCards()`.
   - Clear visual status for each card:
     - Currently in this slot: `[현재 장착 중]` (disabled)
     - In another slot: `[SLOT 0${slot+1} 출격 중 (중복 불가)]` (disabled, opacity-50, cursor-not-allowed)
     - Available: `[이 영웅으로 교체 (EQUIP) →]` (`data-action="swap-deck-card" data-slot-index="${editingSlot}" data-card-id="${card.cardId}"`)
   - 44px+ touch targets and 1px hairline borders.
   - Close button `[✕ 닫기]` (`data-action="close-deck-swap-drawer"`).
   - Dismiss button `[취소 (CANCEL)]`.

**Exact drop-in implementation for `src/landing/views/MyDeckSection.tsx`**:

```typescript
/**
 * src/landing/views/MyDeckSection.tsx
 *
 * Minimalist MyDeck section for SNSHero Static Landing.
 * Features:
 * - Active 5-card deck composition display (5 slots)
 * - Interactive slot selection & card swapping from owned inventory
 * - Interactive Card Selection Drawer/Modal (cardNurtureStore.getOwnedCards())
 * - Duplicate prevention in active squad (cards in other slots disabled)
 * - Real-time Deck TP calculation (N+E+S+W stats sum for active 5 cards)
 * - Real-time Total TP calculation (sum across all owned cards in inventory)
 * - 3-tier character visual assets integration (bust / 3-head SD / 7-head cutout)
 * - Interactive card slot inspection with detailed stats & ability breakdown
 * - Quick action links to Card Nurturing (data-nav="card") and game start (/home)
 * - Conforms strictly to OpenCode Terminal-Flat design system:
 *   font-mono, 0px container radius, 4px button radius, 1px hairlines, 44px+ touch targets.
 * - Zero intrusive battle HUDs, zero virtual joysticks.
 * Pure TypeScript template string generator (Zero React runtime).
 */

import { cardNurtureStore } from '../services/cardNurtureStore';
import { getCharacterAsset, FACTION_PALETTES } from '../services/assetCatalog';
import { CARD_DATABASE } from '../../cardDatabase';

export interface MyDeckSectionState {
  editingSlotIndex: number | null; // 0..4 when drawer is open, null when closed
  selectedCardId: number;          // card currently shown in bottom detail preview
}

export const deckSectionState: MyDeckSectionState = {
  editingSlotIndex: null,
  selectedCardId: 1,
};

export function setEditingSlotIndex(slotIndex: number | null): void {
  deckSectionState.editingSlotIndex = slotIndex;
}

export function getEditingSlotIndex(): number | null {
  return deckSectionState.editingSlotIndex;
}

export function setSelectedDeckCardId(cardId: number): void {
  deckSectionState.selectedCardId = cardId;
}

export function getSelectedDeckCardId(): number {
  return deckSectionState.selectedCardId;
}

/**
 * Get base stats (N, E, S, W) from CARD_DATABASE.
 */
function getCardBaseStats(cardId: number): { top: number; right: number; bottom: number; left: number; total: number } {
  const db = CARD_DATABASE[cardId];
  if (!db) {
    return { top: 2, right: 2, bottom: 2, left: 2, total: 8 };
  }
  const top = db.top || 0;
  const right = db.right || 0;
  const bottom = db.bottom || 0;
  const left = db.left || 0;
  return { top, right, bottom, left, total: top + right + bottom + left };
}

/**
 * Calculate total card power (base N+E+S+W + allocated bonus stats).
 */
export function getCardEffectiveStats(cardId: number): {
  top: number;
  right: number;
  bottom: number;
  left: number;
  baseTotal: number;
  bonusTotal: number;
  totalTP: number;
  statPoints: number;
  level: number;
  exp: number;
  expToNext: number;
} {
  const base = getCardBaseStats(cardId);
  const nurture = cardNurtureStore.cards[cardId] || {
    cardId,
    level: 1,
    exp: 0,
    expToNext: 100,
    statPoints: 0,
    bonusStats: { top: 0, right: 0, bottom: 0, left: 0 },
    totalBonus: 0,
  };

  const bonus = nurture.bonusStats || { top: 0, right: 0, bottom: 0, left: 0 };
  const top = base.top + (bonus.top || 0);
  const right = base.right + (bonus.right || 0);
  const bottom = base.bottom + (bonus.bottom || 0);
  const left = base.left + (bonus.left || 0);
  const bonusTotal = (bonus.top || 0) + (bonus.right || 0) + (bonus.bottom || 0) + (bonus.left || 0);

  return {
    top,
    right,
    bottom,
    left,
    baseTotal: base.total,
    bonusTotal,
    totalTP: top + right + bottom + left,
    statPoints: nurture.statPoints || 0,
    level: nurture.level || 1,
    exp: nurture.exp || 0,
    expToNext: nurture.expToNext || nurture.level * 100,
  };
}

/**
 * Renders the interactive Card Selection Drawer / Modal for swapping a deck slot.
 */
function renderDeckSwapDrawer(editingSlot: number, activeDeckIds: number[]): string {
  const currentSlotCardId = activeDeckIds[editingSlot] || 1;
  const currentAsset = getCharacterAsset(currentSlotCardId);
  const currentStats = getCardEffectiveStats(currentSlotCardId);
  const ownedCards = cardNurtureStore.getOwnedCards();

  return `
    <div
      id="deck-swap-drawer-backdrop"
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deck-swap-drawer-title"
    >
      <div class="relative w-full max-w-4xl bg-[#fdfcfc] border border-[#201d1d] shadow-2xl rounded-none flex flex-col max-h-[90dvh] overflow-hidden">
        <!-- Drawer Header -->
        <div class="flex items-center justify-between p-4 sm:p-5 border-b border-[rgba(15,0,0,0.12)] bg-[#f8f7f7]">
          <div>
            <div class="inline-flex items-center gap-2 px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase mb-1">
              <span>SLOT 0${editingSlot + 1} SQUAD EDIT</span>
              <span class="text-stone-400">·</span>
              <span>PARITY DRAWER</span>
            </div>
            <h3 id="deck-swap-drawer-title" class="text-base sm:text-lg font-black text-[#201d1d] m-0">
              출격 영웅 카드 교체 (SLOT 0${editingSlot + 1})
            </h3>
            <p class="text-xs text-stone-500 m-0 mt-0.5">
              현재 배치: [${currentAsset.code}] ${currentAsset.nameKo} (Lv.${currentStats.level} · ${currentStats.totalTP} TP)
            </p>
          </div>
          <button
            type="button"
            data-action="close-deck-swap-drawer"
            class="px-3 py-2 bg-[#201d1d] text-[#fdfcfc] hover:opacity-90 text-xs font-bold rounded-sm min-h-[44px] min-w-[44px] inline-flex items-center justify-center cursor-pointer"
            aria-label="닫기"
          >
            ✕ 닫기
          </button>
        </div>

        <!-- Squad Guidance Notice (Duplicate Prevention) -->
        <div class="px-4 sm:px-6 py-2.5 bg-[#f1eeee] border-b border-[rgba(15,0,0,0.08)] text-[11px] text-stone-600 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span>💡 <strong>중복 편성 방지:</strong> 이미 다른 슬롯에 출격 중인 카드는 중복 배치할 수 없습니다.</span>
          <span class="font-bold text-[#201d1d]">보유 카드: ${ownedCards.length}종</span>
        </div>

        <!-- Owned Cards Grid -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          ${ownedCards.map(card => {
            const asset = getCharacterAsset(card.cardId);
            const stats = getCardEffectiveStats(card.cardId);
            const isCurrentSlot = card.cardId === currentSlotCardId;
            const otherSlotIdx = activeDeckIds.indexOf(card.cardId);
            const isAlreadyInOtherSlot = otherSlotIdx !== -1 && otherSlotIdx !== editingSlot;

            return `
              <div class="border ${isCurrentSlot ? 'border-[#201d1d] bg-[#f8f7f7]' : isAlreadyInOtherSlot ? 'border-stone-200 bg-stone-50 opacity-60' : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:border-[#201d1d]'} p-4 rounded-none flex flex-col justify-between space-y-3">
                <!-- Card Top Row -->
                <div class="flex items-center justify-between w-full">
                  <span class="text-[10px] font-bold px-1.5 py-0.5 ${isCurrentSlot ? 'bg-[#201d1d] text-white' : isAlreadyInOtherSlot ? 'bg-stone-300 text-stone-700' : 'bg-[#f1eeee] text-[#646262]'} rounded-sm truncate max-w-[140px]">
                    [${asset.code}] ${asset.nameKo}
                  </span>
                  <span class="text-[10px] font-bold text-stone-500 uppercase">
                    Lv.${stats.level} · ${asset.faction}
                  </span>
                </div>

                <!-- Bust Image -->
                <div class="w-full h-28 bg-[#f1eeee] flex items-center justify-center p-2 overflow-hidden border border-[rgba(15,0,0,0.06)] rounded-none">
                  <img
                    src="${asset.bustPngUrl}"
                    alt="${asset.nameKo}"
                    class="max-h-full max-w-full object-contain"
                    loading="lazy"
                    onerror="this.src='${asset.seatUrl}'; this.onerror=null;"
                  />
                </div>

                <!-- 4-Way Stats & TP -->
                <div class="w-full bg-[#f1eeee] border border-[rgba(15,0,0,0.08)] p-1.5 rounded-sm text-center text-[10px] text-stone-600 space-y-0.5">
                  <div>N: <strong class="text-[#201d1d]">${stats.top}</strong> | S: <strong class="text-[#201d1d]">${stats.bottom}</strong> | W: <strong class="text-[#201d1d]">${stats.left}</strong> | E: <strong class="text-[#201d1d]">${stats.right}</strong></div>
                  <div class="font-bold text-[#201d1d]">전투력: ${stats.totalTP} TP</div>
                </div>

                <!-- Action / Status Button (min-h-[44px]) -->
                <div class="w-full pt-1">
                  ${isCurrentSlot ? `
                    <button
                      type="button"
                      disabled
                      class="w-full py-2.5 bg-stone-200 text-stone-600 text-xs font-bold rounded-sm min-h-[44px] cursor-default"
                    >
                      현재 슬롯 장착 중
                    </button>
                  ` : isAlreadyInOtherSlot ? `
                    <button
                      type="button"
                      disabled
                      class="w-full py-2.5 bg-stone-200 text-stone-400 text-xs font-bold rounded-sm min-h-[44px] cursor-not-allowed"
                      title="다른 슬롯에 출격 중인 영웅은 중복 선택할 수 없습니다"
                    >
                      SLOT 0${otherSlotIdx + 1} 출격 중 (중복 불가)
                    </button>
                  ` : `
                    <button
                      type="button"
                      data-action="swap-deck-card"
                      data-slot-index="${editingSlot}"
                      data-card-id="${card.cardId}"
                      class="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] hover:opacity-90 text-xs font-bold rounded-sm min-h-[44px] cursor-pointer transition-opacity"
                    >
                      이 영웅으로 교체 (EQUIP) →
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Drawer Footer -->
        <div class="p-4 border-t border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] flex items-center justify-between">
          <div class="text-[11px] text-stone-500">
            선택 즉시 출격 덱이 갱신되며 덱 전투력(Deck TP)이 자동 재계산됩니다.
          </div>
          <button
            type="button"
            data-action="close-deck-swap-drawer"
            class="px-5 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] min-h-[44px] cursor-pointer"
          >
            취소 (CANCEL)
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderMyDeckSection(selectedCardId?: number): string {
  // Update internal selected card if provided
  if (selectedCardId !== undefined && selectedCardId > 0) {
    deckSectionState.selectedCardId = selectedCardId;
  }

  // Active 5 cards compose the current deck slots
  const activeDeckIds = cardNurtureStore.getDeckCardIds();

  // Deck TP: Sum of N+E+S+W of the 5 active deck cards
  const deckTP = cardNurtureStore.getDeckTP();

  // Total TP: Sum across all owned cards in inventory
  const totalTP = cardNurtureStore.getTotalTP();

  // Detail target card
  const currentSelectedId = activeDeckIds.includes(deckSectionState.selectedCardId)
    ? deckSectionState.selectedCardId
    : activeDeckIds[0] || 1;

  const selectedAsset = getCharacterAsset(currentSelectedId);
  const selectedStats = getCardEffectiveStats(currentSelectedId);
  const selectedDb = CARD_DATABASE[currentSelectedId] || {};
  const selectedFactionStyle = FACTION_PALETTES[selectedAsset.faction] || { bg: '#201d1d', text: '#ffffff', border: '#302c2c' };

  const currentSlotOfSelected = activeDeckIds.indexOf(currentSelectedId);
  const editingSlot = deckSectionState.editingSlotIndex;

  return `
    <div class="w-full flex flex-col font-mono text-[#201d1d] select-none">
      <!-- 1. Header & TP Metric Overview -->
      <section class="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] py-8 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(15,0,0,0.12)]">
            <div>
              <div class="inline-flex items-center gap-2 px-2.5 py-1 bg-[#201d1d] text-[#fdfcfc] text-[11px] font-bold rounded-sm tracking-wider uppercase mb-2">
                <span>[DECK MANAGEMENT]</span>
                <span class="text-stone-400">·</span>
                <span>5-CARD SQUAD</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-[#201d1d] m-0">마이덱 (My Deck)</h1>
              <p class="text-xs sm:text-sm text-stone-600 m-0 mt-1">
                현재 출격 배치된 5장의 영웅 덱 구성과 전술 전투력(Tactical Power) 실시간 합산
              </p>
            </div>

            <!-- Quick Action: Go to Nurture or Play -->
            <div class="flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-nav="card"
                class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center cursor-pointer"
              >
                카드 육성 및 스탯 분배 (Lv.1~100) →
              </button>
              <a
                href="#play"
                data-nav="play"
                class="px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center no-underline"
              >
                웹게임 출격 →
              </a>
            </div>
          </div>

          <!-- 3-Tier Metric Dashboard: Deck TP, Total TP, Squad Capacity -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Metric 1: Deck TP -->
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-5 rounded-none flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
                <span>덱 전투력 (DECK TP)</span>
                <span class="px-2 py-0.5 bg-[#201d1d] text-white text-[10px] rounded-sm">5 CARDS SUM</span>
              </div>
              <div class="text-3xl sm:text-4xl font-black text-[#201d1d] tracking-tight">
                ${deckTP} <span class="text-xs font-normal text-stone-500">TP</span>
              </div>
              <div class="text-[11px] text-stone-500">
                현재 출격 5개 슬롯 영웅들의 N+E+S+W 스탯 총합
              </div>
            </div>

            <!-- Metric 2: Total TP -->
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-5 rounded-none flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
                <span>전체 전투력 (TOTAL TP)</span>
                <span class="px-2 py-0.5 bg-stone-700 text-white text-[10px] rounded-sm">ALL OWNED</span>
              </div>
              <div class="text-3xl sm:text-4xl font-black text-[#201d1d] tracking-tight">
                ${totalTP} <span class="text-xs font-normal text-stone-500">TP</span>
              </div>
              <div class="text-[11px] text-stone-500">
                인벤토리에 보유 중인 전체 영웅 카드(${cardNurtureStore.ownedCardIds.length}종)의 누적 전투력 합산
              </div>
            </div>

            <!-- Metric 3: Active Deck Slots -->
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-5 rounded-none flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
                <span>덱 슬롯 상태 (SLOTS)</span>
                <span class="px-2 py-0.5 bg-emerald-700 text-white text-[10px] rounded-sm">READY</span>
              </div>
              <div class="text-3xl sm:text-4xl font-black text-[#201d1d] tracking-tight">
                ${activeDeckIds.length} <span class="text-xs font-normal text-stone-500">/ 5 SLOTS</span>
              </div>
              <div class="text-[11px] text-stone-500">
                수집율: ${cardNurtureStore.ownedCardIds.length} / 110 (${((cardNurtureStore.ownedCardIds.length / 110) * 100).toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Active 5 Card Deck Slots Grid -->
      <section class="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] py-10 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <span class="text-[11px] text-[#646262] font-bold uppercase tracking-wider">현재 출격 슬롯</span>
              <h2 class="text-lg sm:text-xl font-bold tracking-tight text-[#201d1d] m-0">
                활성 5개 덱 슬롯 (ACTIVE 5 DECK SLOTS)
              </h2>
            </div>
            <div class="text-xs text-stone-500 font-mono">
              슬롯의 [영웅 교체]를 클릭하여 보유 영웅으로 교체 편성
            </div>
          </div>

          <!-- 5 Card Slots Responsive Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            ${activeDeckIds.map((cardId, index) => {
              const asset = getCharacterAsset(cardId);
              const stats = getCardEffectiveStats(cardId);
              const isSelected = cardId === currentSelectedId;
              const hasRedDot = stats.statPoints > 0;

              return `
                <div
                  class="relative border ${isSelected ? 'border-[#201d1d] bg-[#f8f7f7] shadow-sm' : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc]'} p-4 rounded-none flex flex-col justify-between space-y-3 hover:border-[#201d1d] transition-all min-h-[340px]"
                >
                  <!-- Top Row: Slot Number & Red Dot / Unspent Points -->
                  <div class="flex items-center justify-between w-full">
                    <span class="text-[10px] font-bold px-1.5 py-0.5 ${isSelected ? 'bg-[#201d1d] text-[#fdfcfc]' : 'bg-[#f1eeee] text-[#646262]'} rounded-sm">
                      SLOT 0${index + 1}
                    </span>
                    ${hasRedDot ? `
                      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-sm" title="미사용 스탯 포인트">
                        +${stats.statPoints} pt
                      </span>
                    ` : `
                      <span class="text-[10px] text-stone-400 font-bold uppercase">${asset.rarity}</span>
                    `}
                  </div>

                  <!-- Character Bust Portrait (Click to inspect) -->
                  <div
                    role="button"
                    tabindex="0"
                    data-action="select-deck-card"
                    data-card-id="${cardId}"
                    class="w-full h-32 bg-[#f1eeee] flex items-center justify-center p-2 overflow-hidden border border-[rgba(15,0,0,0.06)] rounded-none cursor-pointer"
                    title="클릭하여 상세 정보 보기"
                  >
                    <img
                      src="${asset.bustPngUrl}"
                      alt="${asset.nameKo}"
                      class="max-h-full max-w-full object-contain filter drop-shadow-none"
                      loading="lazy"
                      onerror="this.src='${asset.seatUrl}'; this.onerror=null;"
                    />
                  </div>

                  <!-- Card Identification & Level -->
                  <div
                    role="button"
                    tabindex="0"
                    data-action="select-deck-card"
                    data-card-id="${cardId}"
                    class="w-full space-y-1 cursor-pointer"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-black text-[#201d1d] truncate">[${asset.code}] ${asset.nameKo}</span>
                      <span class="text-[11px] font-bold text-stone-700">Lv.${stats.level}</span>
                    </div>
                    <div class="text-[10px] text-stone-500 uppercase tracking-wider">${asset.faction} · ${asset.nameEn}</div>
                  </div>

                  <!-- 4-Way Compass Stats (N, E, S, W) & Total TP -->
                  <div class="w-full bg-[#f1eeee] border border-[rgba(15,0,0,0.08)] p-2 rounded-sm space-y-1 text-center">
                    <div class="text-[10px] font-bold text-stone-600">북(N): <span class="text-[#201d1d]">${stats.top}</span></div>
                    <div class="flex items-center justify-between text-[10px] font-bold text-stone-600 px-1">
                      <span>서(W): <span class="text-[#201d1d]">${stats.left}</span></span>
                      <span>동(E): <span class="text-[#201d1d]">${stats.right}</span></span>
                    </div>
                    <div class="text-[10px] font-bold text-stone-600">남(S): <span class="text-[#201d1d]">${stats.bottom}</span></div>
                  </div>

                  <!-- Bottom Slot Action: Card Swap Button (44px+ touch target) -->
                  <div class="w-full pt-1 space-y-2">
                    <div class="flex items-center justify-between text-[11px] border-t border-[rgba(15,0,0,0.08)] pt-1">
                      <span class="text-stone-500 font-semibold">전투력</span>
                      <span class="font-black text-[#201d1d]">${stats.totalTP} TP</span>
                    </div>
                    <button
                      type="button"
                      data-action="open-deck-swap-drawer"
                      data-slot-index="${index}"
                      class="w-full py-2 px-3 bg-[#201d1d] text-[#fdfcfc] hover:opacity-90 text-xs font-bold rounded-sm min-h-[44px] inline-flex items-center justify-center gap-1.5 cursor-pointer transition-opacity"
                    >
                      <span>🔄</span>
                      <span>영웅 교체</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </section>

      <!-- 3. Selected Card Deep Inspection & 7-Head Cutout Showcase -->
      <section class="w-full bg-[#f8f7f7] py-12 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(15,0,0,0.12)]">
            <div>
              <span class="text-[11px] text-[#646262] font-bold uppercase tracking-wider">영웅 상세 분석</span>
              <h2 class="text-lg sm:text-xl font-bold tracking-tight text-[#201d1d] m-0">
                선택된 영웅 카드 상세 (SELECTED CARD DETAIL: ${selectedAsset.nameKo})
              </h2>
            </div>
            <div class="text-xs text-stone-500 font-mono">
              [NO.${selectedAsset.code}] ${selectedAsset.nameEn}
            </div>
          </div>

          <!-- 2-Column Responsive Detail Card -->
          <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 sm:p-8 rounded-none grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <!-- Left: 7-Head Full-Body Cutout Preview (Tier 1 Asset) -->
            <div class="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-4">
              <div class="relative w-full h-72 sm:h-80 flex items-center justify-center overflow-hidden">
                <img
                  src="${selectedAsset.cutoutUrl}"
                  alt="${selectedAsset.nameKo} 7등신 풀바디"
                  class="max-w-full max-h-full object-contain filter drop-shadow-none"
                  loading="eager"
                  onerror="this.src='${selectedAsset.bustPngUrl}'; this.onerror=null;"
                />
              </div>
              <div class="w-full text-center space-y-1">
                <span class="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-sm" style="background-color: ${selectedFactionStyle.bg}; color: ${selectedFactionStyle.text};">
                  ${selectedAsset.faction} · ${selectedAsset.rarity}
                </span>
                <div class="text-xs text-stone-500">
                  공식 7등신 풀바디 투명 컷아웃 (Visual Tier 1)
                </div>
              </div>
            </div>

            <!-- Right: Detailed Stats, Level, EXP, Ability, and Actions -->
            <div class="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <h3 class="text-xl sm:text-2xl font-black text-[#201d1d] m-0">
                    [${selectedAsset.code}] ${selectedAsset.nameKo}
                  </h3>
                  <span class="text-sm text-stone-500 font-normal">(${selectedAsset.nameEn})</span>
                </div>

                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  ${(selectedDb as any).lore_ko || `${selectedAsset.faction} 속성의 강력한 정령 영웅. 3x3 보드에서 전술적 플립과 결계를 주도합니다.`}
                </p>
              </div>

              <!-- Level, EXP Bar & Stat Points Notification -->
              <div class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-4 rounded-none space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-[#201d1d]">성장 레벨: Lv.${selectedStats.level} / 100</span>
                  <span class="text-stone-500">EXP: ${selectedStats.exp} / ${selectedStats.expToNext}</span>
                </div>
                <div class="w-full h-2 bg-stone-200 rounded-sm overflow-hidden">
                  <div
                    class="h-full bg-[#201d1d]"
                    style="width: ${Math.min(100, Math.round((selectedStats.exp / (selectedStats.expToNext || 100)) * 100))}%"
                  ></div>
                </div>
                <div class="flex items-center justify-between text-[11px] pt-1">
                  <span class="text-stone-600">
                    미사용 스탯 포인트: <strong class="${selectedStats.statPoints > 0 ? 'text-red-600' : 'text-[#201d1d]'}">${selectedStats.statPoints} pt</strong>
                  </span>
                  ${selectedStats.statPoints > 0 ? `
                    <span class="text-[10px] text-red-600 font-bold">카드 육성 메뉴에서 스탯을 배분하세요!</span>
                  ` : `
                    <span class="text-[10px] text-stone-400">모든 스탯 포인트 배분 완료</span>
                  `}
                </div>
              </div>

              <!-- 4-Way Compass Stats Breakdown Grid -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div class="border border-[rgba(15,0,0,0.12)] bg-white p-3 rounded-none">
                  <div class="text-[10px] text-stone-500 font-bold uppercase">북 (NORTH)</div>
                  <div class="text-lg font-black text-[#201d1d] mt-1">${selectedStats.top}</div>
                  <div class="text-[10px] text-stone-400">기본 ${getCardBaseStats(currentSelectedId).top} + 보너스 ${selectedStats.top - getCardBaseStats(currentSelectedId).top}</div>
                </div>
                <div class="border border-[rgba(15,0,0,0.12)] bg-white p-3 rounded-none">
                  <div class="text-[10px] text-stone-500 font-bold uppercase">동 (EAST)</div>
                  <div class="text-lg font-black text-[#201d1d] mt-1">${selectedStats.right}</div>
                  <div class="text-[10px] text-stone-400">기본 ${getCardBaseStats(currentSelectedId).right} + 보너스 ${selectedStats.right - getCardBaseStats(currentSelectedId).right}</div>
                </div>
                <div class="border border-[rgba(15,0,0,0.12)] bg-white p-3 rounded-none">
                  <div class="text-[10px] text-stone-500 font-bold uppercase">남 (SOUTH)</div>
                  <div class="text-lg font-black text-[#201d1d] mt-1">${selectedStats.bottom}</div>
                  <div class="text-[10px] text-stone-400">기본 ${getCardBaseStats(currentSelectedId).bottom} + 보너스 ${selectedStats.bottom - getCardBaseStats(currentSelectedId).bottom}</div>
                </div>
                <div class="border border-[rgba(15,0,0,0.12)] bg-white p-3 rounded-none">
                  <div class="text-[10px] text-stone-500 font-bold uppercase">서 (WEST)</div>
                  <div class="text-lg font-black text-[#201d1d] mt-1">${selectedStats.left}</div>
                  <div class="text-[10px] text-stone-400">기본 ${getCardBaseStats(currentSelectedId).left} + 보너스 ${selectedStats.left - getCardBaseStats(currentSelectedId).left}</div>
                </div>
              </div>

              <!-- Special Ability & TP Total -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] rounded-none">
                <div class="space-y-0.5">
                  <span class="text-[10px] text-stone-500 font-bold uppercase">고유 스킬 (SPECIAL ABILITY)</span>
                  <div class="text-xs font-bold text-[#201d1d]">
                    ${(selectedDb as any).ability?.description_ko || '기본 전술 능력: 표준 전장 배치'}
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-stone-500 font-bold uppercase">영웅 총전투력</span>
                  <div class="text-xl font-black text-[#201d1d]">${selectedStats.totalTP} TP</div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-wrap items-center gap-3 pt-2">
                ${currentSlotOfSelected !== -1 ? `
                  <button
                    type="button"
                    data-action="open-deck-swap-drawer"
                    data-slot-index="${currentSlotOfSelected}"
                    class="px-5 py-3 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center cursor-pointer gap-1.5"
                  >
                    <span>🔄</span>
                    <span>이 슬롯 영웅 교체하기 (SLOT 0${currentSlotOfSelected + 1}) →</span>
                  </button>
                ` : ''}
                <button
                  type="button"
                  data-nav="card"
                  class="flex-1 px-5 py-3 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center cursor-pointer"
                >
                  이 카드 육성하기 (EXP &amp; 스탯 배분) →
                </button>
                <a
                  href="#play"
                  data-nav="play"
                  class="px-5 py-3 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center no-underline"
                >
                  실전 배틀 출격 →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. Interactive Card Selection Drawer / Modal (Parity with DeckView) -->
      ${editingSlot !== null ? renderDeckSwapDrawer(editingSlot, activeDeckIds) : ''}
    </div>
  `;
}
```

---

#### File 4: `src/landing/index.ts`
Add imports and action handling in `handleEventDelegation` and `handleGlobalKeydown`:

```typescript
// 1. Update import from ./views/MyDeckSection:
import {
  renderMyDeckSection,
  setEditingSlotIndex,
  getEditingSlotIndex,
  setSelectedDeckCardId,
} from './views/MyDeckSection';

// 2. In renderActiveViewContent:
if (view === 'deck') return renderMyDeckSection();

// 3. In handleEventDelegation:
  } else if (action === 'open-deck-swap-drawer') {
    const slotStr = target.getAttribute('data-slot-index');
    if (slotStr !== null) {
      setEditingSlotIndex(parseInt(slotStr, 10));
      renderApp();
    }
  } else if (action === 'close-deck-swap-drawer') {
    setEditingSlotIndex(null);
    renderApp();
  } else if (action === 'swap-deck-card') {
    const slotStr = target.getAttribute('data-slot-index');
    const cardIdStr = target.getAttribute('data-card-id');
    if (slotStr !== null && cardIdStr) {
      const slotIndex = parseInt(slotStr, 10);
      const cardId = parseInt(cardIdStr, 10);
      const success = cardNurtureStore.setDeckCard(slotIndex, cardId);
      if (success) {
        setSelectedDeckCardId(cardId);
        setEditingSlotIndex(null);
      }
      renderApp();
    }
  } else if (action === 'select-deck-card') {
    const cardIdStr = target.getAttribute('data-card-id');
    if (cardIdStr) {
      setSelectedDeckCardId(parseInt(cardIdStr, 10));
      renderApp();
    }
  }

// 4. In handleGlobalKeydown:
  if (event.key === 'Escape') {
    if (getEditingSlotIndex() !== null) {
      setEditingSlotIndex(null);
      renderApp();
    } else if (state.activeModal) {
      state.activeModal = null;
      renderApp();
    } else if (state.isSidebarOpen) {
      state.isSidebarOpen = false;
      renderApp();
    } else if (state.activeView === 'play') {
      stopPlayTts();
    }
  }
```

---

## 5. Verification Method

### Automated Test Plan (`tests/test_m2_deck_parity.ts`)

A dedicated verification test script should be executed via `npx tsx tests/test_m2_deck_parity.ts` (or equivalent) confirming:

1. **Active Deck Squad Initialization & Default Cards**:
   - `cardNurtureStore.getDeckCardIds()` yields `[1, 2, 3, 4, 5]` on fresh state.
   - `cardNurtureStore.getDeckCardIds().length === 5`.

2. **Owned Cards Retrieval**:
   - `cardNurtureStore.getOwnedCards()` returns an array containing all owned cards, with valid `cardId`, `level`, `statPoints`, `basePower`, and `totalTP`.

3. **Deck Card Swapping**:
   - Given an unlocked owned card (e.g. Card 19 added via `cardNurtureStore.addCard(19)`):
   - Calling `cardNurtureStore.setDeckCard(0, 19)` returns `true`.
   - `cardNurtureStore.getDeckCardIds()[0] === 19`.

4. **Duplicate Prevention Guard**:
   - With Card 2 in slot 1:
   - Calling `cardNurtureStore.setDeckCard(0, 2)` must return `false`.
   - `cardNurtureStore.getDeckCardIds()[0]` remains unchanged (Card 19).

5. **Bounds & Ownership Guard**:
   - Calling `cardNurtureStore.setDeckCard(-1, 1)` returns `false`.
   - Calling `cardNurtureStore.setDeckCard(5, 1)` returns `false`.
   - Calling `cardNurtureStore.setDeckCard(0, 999)` returns `false`.
   - Calling `cardNurtureStore.setDeckCard(0, unownedCardId)` returns `false`.

6. **Real-time Deck TP & Total TP Recalculation**:
   - Recalculates `deckTP` as the exact sum of the active 5 cards in `deckCardIds`.
   - Swapping a stronger card into slot 0 immediately increases `cardNurtureStore.getDeckTP()`.
   - `cardNurtureStore.getTotalTP()` matches the sum across all `ownedCardIds`.

7. **Dual-Sync LocalStorage Format**:
   - `localStorage.getItem('hero_deck')` contains a valid JSON array of `CardData` objects.
   - Each item in `hero_deck` has `imageIndex` matching the respective card in `deckCardIds`.
   - `localStorage.getItem('hero_card_nurturing')` contains `deckCardIds: [...]`.
   - `hero_deck_season1` and `hero_deck_guest_season1` are synced.

8. **UI HTML Rendering & DESIGN.md Audit**:
   - `renderMyDeckSection()` renders 5 slots with `data-action="open-deck-swap-drawer"`.
   - When `setEditingSlotIndex(0)` is invoked, `renderMyDeckSection()` includes `id="deck-swap-drawer-backdrop"`.
   - In the drawer, duplicate cards contain `disabled` attributes and text `중복 불가`.
   - Available cards contain `data-action="swap-deck-card" data-slot-index="0" data-card-id="..."`.
   - All interactive controls enforce `min-h-[44px]`.

9. **Build & Type Checking**:
   - `npx tsc --noEmit` exits with 0 errors.
   - `npm run build` exits with 0 errors.
