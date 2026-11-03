# Milestone 3 Handoff Report: CardSection, cardNurtureStore & ShopSection

**Agent**: `teamwork_explorer` (`explorer_m3_3`)  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_3/`  
**Target Milestone**: Milestone 3 (`CardSection.tsx`, `cardNurtureStore.ts`, `ShopSection.tsx`)  
**Parent Conversation ID**: `7b342c7a-1d74-43d7-a388-5ffc926b3969`  
**Date**: 2026-11-02  

---

## 1. Observation

Direct observations and evidence gathered from the codebase and test harness:

1. **Test Infrastructure & Milestone Coverage**:
   - Running `npx tsx tests/e2e/run_all.ts --milestone M3 --allow-fail` reported:
     - Missing target files:
       - `T1.CARD.1`, `T1.CARD.2`: `src/landing/views/CardSection.tsx not found`
       - `T1.SHOP.1` ~ `T1.SHOP.5`: `src/landing/views/ShopSection.tsx not found`
       - `T1.DECK.1`, `T1.DECK.4`, `T1.DECK.5`: `src/landing/views/MyDeckSection.tsx not found` (assigned to peer `explorer_m3_1`)
       - `T1.PLAY.1` ~ `T1.PLAY.5`: `src/landing/views/PlaySection.tsx not found` (assigned to peer `explorer_m3_2`)
     - Existing test logic already validates:
       - `T1.CARD.3` (EXP progression & level up)
       - `T1.CARD.4` (Max Lv 100 cap enforcement)
       - `T1.CARD.5` (Stat points & red dot indicator state transitions)
       - `T1.CARD.6` (4-way stat allocation: top, right, bottom, left)
       - `T1.STORE.1` ~ `T1.STORE.4` (`hero_card_nurturing` schema and reload persistence)
       - `T2.B1.1`, `T2.B1.2`, `T2.B2.1`, `T2.B2.2`, `T2.B4.1`, `T2.B5.1` (Boundary conditions, corrupted JSON recovery, 50-concurrency accrual)
       - `T3.C1.1` (Nurture -> Stat point -> Deck TP sync)
       - `T3.C1.2` (Shop purchase -> Inventory -> Collection rate & Total TP sync)
       - `T3.C1.6` (Bulk stat allocation clears red dot)
       - `T4.W1.2` (1->100 nurture loop and persistence across reload)
       - `T4.W1.3` (Deck optimization & mathematical TP audit: base starter cards 1..5 sum = 80 TP)

2. **Interface Contracts (`PROJECT.md` lines 63–91 and `src/landing/types.ts` lines 20–48)**:
   ```typescript
   export interface BonusStats {
     top: number;
     right: number;
     bottom: number;
     left: number;
   }

   export interface CardNurtureData {
     cardId: number;        // 1..110
     level: number;         // 1..100
     exp: number;           // Current EXP
     expToNext: number;     // Level * 100
     statPoints: number;    // Unspent stat points
     bonusStats: BonusStats;
     totalBonus: number;
   }

   export interface NurtureState {
     cards: Record<number, CardNurtureData>;
     ownedCardIds: number[];
     getDeckTP: () => number;
     getTotalTP: () => number;
     nurtureCard: (cardId: number, expGain?: number) => { expGained: number; leveledUp: boolean; newLevel: number };
     allocateStat: (cardId: number, direction: 'top' | 'right' | 'bottom' | 'left') => boolean;
     hasUnspentPoints: (cardId: number) => boolean;
     saveToStorage: () => void;
     loadFromStorage: () => void;
   }
   ```

3. **Card Section Exact Assertions (`tests/e2e/tier1_feature_coverage.ts` lines 431–449)**:
   - `T1.CARD.1`: `cardView.includes('카드') && (cardView.includes('수집율') || cardView.includes('110') || cardView.includes('%'))`
   - `T1.CARD.2`: `cardView.includes('110') || cardView.includes('grid') || cardView.includes('map')`

4. **Shop Section Exact Assertions (`tests/e2e/tier1_feature_coverage.ts` lines 603–655)**:
   - Exact 8 fixed items:
     1. `'일반 카드팩'`
     2. `'매직 카드팩'`
     3. `'희귀 카드팩'`
     4. `'아이템 팩'`
     5. `'광고 제거'`
     6. `'공식 소설'`
     7. `'공식 동영상'`
     8. `'코인 충전'`
   - Prohibited clutter items strictly forbidden: `['행운의 룰렛', 'VIP 패스', '보물상자']`.

5. **Design System & Architectural Rules (`DESIGN.md`, `AGENTS.md`, `GEMINI.md`)**:
   - Monospace typography (`font-mono`) everywhere.
   - 2-tier border radius: `rounded-none` (`0px`) on containers, frames, and modals; max `rounded-sm` (`4px`) on buttons and badges.
   - Prohibited decorative classes: `bg-gradient-to-`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `animate-ping`, `animate-bounce`.
   - Minimum 44px touch targets: `min-h-[44px]` on all interactive buttons.
   - Pure static TypeScript template generator (Zero React runtime in static landing).
   - LocalStorage keys: `hero_card_nurturing` for cards, `hero_sns` for player coin balance.

---

## 2. Logic Chain

1. **Step 1: Establishing the Shared Service (`cardNurtureStore.ts`)**:
   - `ReferenceNurtureStore` in `tests/e2e/helpers.ts` proves that `cardNurtureStore.ts` must maintain:
     - `cards: Record<number, CardNurtureData>` for all 110 cards (`cardId` 1..110).
     - Starter owned cards: default `ownedCardIds = [1, 2, 3, 4, 5]`.
     - At Level `L`, `expToNext = L * 100`.
     - `nurtureCard(cardId, expGain)` increments `card.exp`, loops `while (card.exp >= card.expToNext && card.level < 100)` increasing `level += 1`, awarding `statPoints += 1`, updating `expToNext = level * 100`.
     - Caps strictly at Level 100: when `level >= 100`, `exp = expToNext`, `leveledUp = false`.
     - `allocateStat(cardId, direction)` safely validates `statPoints > 0`, decrements `statPoints -= 1`, increments `bonusStats[direction] += 1` and `totalBonus += 1`, and calls `saveToStorage()`.
     - `hasUnspentPoints(cardId)` returns `card.statPoints > 0`.
     - `getDeckTP()` calculates power for active deck cards `ownedCardIds.slice(0, 5)`: `basePower + totalBonus` using `CARD_DATABASE`.
     - `getTotalTP()` calculates power across all `ownedCardIds`.
     - `addCard(cardId)` unlocks newly acquired cards from shop card packs and updates `ownedCardIds` (fulfilling `T3.C1.2`).
     - `saveToStorage()` and `loadFromStorage()` serialize/deserialize `{ cards, ownedCardIds, updatedAt }` with graceful fallback on corrupted JSON or missing key.

2. **Step 2: Designing `CardSection.tsx`**:
   - Fulfills `R4`: Renamed from '미션' to '카드'.
   - Displays prominent collection rate metric: `수집율: ${ownedCount} / 110 (${ratePercent}%)` with a visual progress bar.
   - Renders a 110-card responsive grid (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`).
   - Each card displays its 3-tier visual asset (SD sprite / bust from `assetCatalog.ts`), faction & rarity badges, Level `Lv.X / 100`, mini EXP gauge, and **unspent points red dot indicator** (`inline-block w-2.5 h-2.5 rounded-full bg-red-600` without prohibited `animate-ping`).
   - Clicking a card opens the **Card Nurture & Stat Inspector**:
     - Large portrait display.
     - `[카드 육성하기 (+50 EXP)]` and `[10회 연속 육성 (+500 EXP)]` action buttons (`min-h-[44px]`).
     - Available stat points badge: `${card.statPoints} P`.
     - **4-way directional stat allocation**:
       - Top ($N$): base + bonus
       - Right ($E$): base + bonus
       - Bottom ($S$): base + bonus
       - Left ($W$): base + bonus
       - Dedicated `[+ 상단(N) 강화]`, `[+ 우측(E) 강화]`, `[+ 하단(S) 강화]`, `[+ 좌측(W) 강화]` buttons (`min-h-[44px]`, disabled when `statPoints === 0`).
     - Total Card Power summary and lore snippet.

3. **Step 3: Designing `ShopSection.tsx`**:
   - Fulfills `R4`: Contains **exactly the 8 specified items**:
     1. 일반 카드팩
     2. 매직 카드팩
     3. 희귀 카드팩
     4. 아이템 팩
     5. 광고 제거
     6. 공식 소설
     7. 공식 동영상
     8. 코인 충전
   - Excludes all prohibited clutter items (`행운의 룰렛`, `VIP 패스`, `보물상자`).
   - Displays player's SNS coin balance (`hero_sns`) with quick `[코인 무료 충전 (+1,000 SNS)]` simulation.
   - Purchasing card packs (일반/매직/희귀) rolls 3 cards according to rarity pool and invokes `cardNurtureStore.addCard()`, directly increasing the collection rate and Total TP (satisfying `T3.C1.2`).
   - All interactive action buttons are `min-h-[44px]` with Terminal-Flat styling.

4. **Step 4: Wiring in `src/landing/index.ts`**:
   - Imports `renderCardSection` and `renderShopSection`.
   - Dispatches `renderCardSection()` when `state.activeView === 'card'`.
   - Dispatches `renderShopSection()` when `state.activeView === 'shop'`.
   - Event delegation intercepts `data-action`:
     - `nurture-card` -> `cardNurtureStore.nurtureCard(cardId, exp)`
     - `allocate-stat` -> `cardNurtureStore.allocateStat(cardId, direction)`
     - `select-card` -> sets active card inspector
     - `close-card-inspector` -> closes inspector
     - `filter-card-element` / `filter-card-owned` -> updates filter
     - `buy-shop-item` -> executes purchase simulation
     - `free-charge-coin` -> adds 1,000 SNS

---

## 3. Caveats

1. **Pure String Templates vs DOM State**:
   - In static landing, components return HTML string templates (`renderCardSection()`). Module-level UI state (e.g. `selectedCardId`, active filter) is retained in the view module so subsequent re-renders maintain selected card context.
2. **Prohibited CSS Classes**:
   - `animate-ping` and `animate-bounce` are strictly prohibited by `DESIGN.md`. The unspent points indicator must be styled cleanly as a static flat red badge or dot (`rounded-full w-2.5 h-2.5 bg-red-600` or `rounded-sm px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold`).
3. **No Direct Production Code Writes (Read-Only Investigation)**:
   - As an explorer, no changes are committed to `src/` directly. The complete, copy-paste-ready implementation code is provided below in the Conclusion for the implementer agent (`worker_m3`).

---

## 4. Conclusion & Proposed Implementation Code

Here are the complete, production-grade source codes for all three modules plus the `index.ts` integration patch.

### 4.1. `src/landing/services/cardNurtureStore.ts`

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
 *   - Deck TP & Total TP dynamic calculations
 *   - Permanent LocalStorage auto-persistence under 'hero_card_nurturing'
 *   - Corrupted JSON recovery and clean missing key initialization
 *
 * Fully adheres to PROJECT.md § Interface Contracts and OpenCode Terminal-Flat standards.
 */

import { CardNurtureData, BonusStats, NurtureState } from '../types';
import { CARD_DATABASE } from '../../cardDatabase';

export const STORAGE_KEY = 'hero_card_nurturing';

export interface CardNurtureStoragePayload {
  cards: Record<number, CardNurtureData>;
  ownedCardIds: number[];
  updatedAt: number;
}

export class CardNurtureStore implements NurtureState {
  cards: Record<number, CardNurtureData> = {};
  ownedCardIds: number[] = [1, 2, 3, 4, 5]; // Default 5 starter cards
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
    if (!dbCard) return 10;
    return (dbCard.top || 0) + (dbCard.right || 0) + (dbCard.bottom || 0) + (dbCard.left || 0);
  }

  /**
   * Active 5-card deck TP formula: sum of (basePower + totalBonus) for top 5 owned cards
   */
  getDeckTP(): number {
    const activeDeckIds = this.ownedCardIds.slice(0, 5);
    return activeDeckIds.reduce((sum, id) => {
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
    if (cardId < 1 || cardId > 110) return false;
    if (!this.ownedCardIds.includes(cardId)) {
      this.ownedCardIds.push(cardId);
      this.ownedCardIds.sort((a, b) => a - b);
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
   * Save state to localStorage
   */
  saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const payload: CardNurtureStoragePayload = {
        cards: this.cards,
        ownedCardIds: this.ownedCardIds,
        updatedAt: Date.now(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save hero_card_nurturing to localStorage:', e);
    }
  }

  /**
   * Load state from localStorage with safe fallback for corrupted/missing data
   */
  loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return;

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
      }
    } catch {
      // Graceful fallback to default state on corrupted JSON
      this.initDefaultCards();
      this.ownedCardIds = [1, 2, 3, 4, 5];
    }
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

### 4.2. `src/landing/views/CardSection.tsx`

```tsx
/**
 * src/landing/views/CardSection.tsx
 *
 * Card Collection & 1~100Lv Nurturing System View for SNSHero Static Landing.
 *
 * Requirements:
 *   - Section naming: '카드' (renamed from '미션')
 *   - Collection rate indicator display: 수집율: XX / 110 (XX.X%)
 *   - 110-card comprehensive grid with 3-tier visual assets
 *   - 1~100Lv EXP progression and level-up controls
 *   - Unspent stat points indicator (red dot)
 *   - 4-way stat allocation controls (Top, Right, Bottom, Left)
 *   - Terminal-Flat design, 44px+ touch targets, 0px/4px radii
 */

import { cardNurtureStore } from '../services/cardNurtureStore';
import { getCharacterAsset, FACTION_PALETTES } from '../services/assetCatalog';
import { CARD_DATABASE } from '../../cardDatabase';

interface CardSectionState {
  selectedCardId: number | null;
  elementFilter: string; // 'all' or faction name
  ownedFilter: 'all' | 'owned' | 'unowned';
}

const localState: CardSectionState = {
  selectedCardId: null,
  elementFilter: 'all',
  ownedFilter: 'all',
};

export function setSelectedCardId(id: number | null): void {
  localState.selectedCardId = id;
}

export function setElementFilter(filter: string): void {
  localState.elementFilter = filter;
}

export function setOwnedFilter(filter: 'all' | 'owned' | 'unowned'): void {
  localState.ownedFilter = filter;
}

export function renderCardSection(): string {
  const collection = cardNurtureStore.getCollectionRate();
  const deckTP = cardNurtureStore.getDeckTP();
  const totalTP = cardNurtureStore.getTotalTP();

  // All 110 card IDs
  const allCardIds = Array.from({ length: 110 }, (_, i) => i + 1);

  // Filtered card IDs
  const filteredCardIds = allCardIds.filter((id) => {
    const asset = getCharacterAsset(id);
    const isOwned = cardNurtureStore.isCardOwned(id);

    if (localState.ownedFilter === 'owned' && !isOwned) return false;
    if (localState.ownedFilter === 'unowned' && isOwned) return false;
    if (localState.elementFilter !== 'all' && asset.faction !== localState.elementFilter) return false;

    return true;
  });

  const selectedCard = localState.selectedCardId
    ? cardNurtureStore.cards[localState.selectedCardId]
    : null;
  const selectedAsset = localState.selectedCardId
    ? getCharacterAsset(localState.selectedCardId)
    : null;
  const selectedDbCard = localState.selectedCardId
    ? CARD_DATABASE[localState.selectedCardId]
    : null;

  return `
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 font-mono text-[#201d1d] select-none">
      <!-- Section Header -->
      <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 sm:p-8 rounded-none shadow-none space-y-6 mb-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[rgba(15,0,0,0.08)] gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase mb-2">
              <span>카드 도감 및 육성</span>
              <span class="text-stone-400">·</span>
              <span>110종 영웅 컬렉션</span>
            </div>
            <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-[#201d1d] m-0">
              카드 (Card Collection &amp; Nurture)
            </h1>
            <p class="text-xs sm:text-sm text-stone-600 mt-1 m-0">
              110종의 영웅 카드를 수집하고 최대 100레벨까지 육성하세요. 레벨업 시 획득한 스탯 포인트로 4방향 파워를 강화할 수 있습니다.
            </p>
          </div>

          <!-- Collection Rate & TP Summary Box -->
          <div class="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-right min-w-[130px]">
              <div class="text-[10px] text-stone-500 uppercase tracking-wider">카드 수집율</div>
              <div class="text-sm sm:text-base font-bold text-[#201d1d]">
                수집율: ${collection.ownedCount} / 110 (${collection.percentage}%)
              </div>
            </div>
            <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-right min-w-[100px]">
              <div class="text-[10px] text-stone-500 uppercase tracking-wider">덱 파워 (Deck TP)</div>
              <div class="text-sm sm:text-base font-bold text-[#201d1d]">${deckTP} TP</div>
            </div>
            <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-right min-w-[100px]">
              <div class="text-[10px] text-stone-500 uppercase tracking-wider">총 파워 (Total TP)</div>
              <div class="text-sm sm:text-base font-bold text-[#201d1d]">${totalTP} TP</div>
            </div>
          </div>
        </div>

        <!-- Collection Progress Bar -->
        <div class="space-y-1">
          <div class="flex justify-between text-[11px] text-stone-500">
            <span>컬렉션 달성도 (${collection.ownedCount} / 110장 보유)</span>
            <span>${collection.percentage}%</span>
          </div>
          <div class="w-full bg-[#f1eeee] h-2 rounded-sm overflow-hidden">
            <div class="bg-[#201d1d] h-full transition-all duration-300" style="width: ${collection.percentage}%"></div>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
          <!-- Ownership Filter -->
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-xs text-stone-500 mr-1">분류:</span>
            <button
              type="button"
              data-action="filter-card-owned"
              data-filter="all"
              class="px-3 py-1.5 text-xs rounded-sm border min-h-[44px] flex items-center justify-center ${
                localState.ownedFilter === 'all'
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#f8f7f7] text-stone-700 border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee]'
              }"
            >
              전체 (110)
            </button>
            <button
              type="button"
              data-action="filter-card-owned"
              data-filter="owned"
              class="px-3 py-1.5 text-xs rounded-sm border min-h-[44px] flex items-center justify-center ${
                localState.ownedFilter === 'owned'
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#f8f7f7] text-stone-700 border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee]'
              }"
            >
              보유 중 (${collection.ownedCount})
            </button>
            <button
              type="button"
              data-action="filter-card-owned"
              data-filter="unowned"
              class="px-3 py-1.5 text-xs rounded-sm border min-h-[44px] flex items-center justify-center ${
                localState.ownedFilter === 'unowned'
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#f8f7f7] text-stone-700 border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee]'
              }"
            >
              미보유 (${110 - collection.ownedCount})
            </button>
          </div>

          <!-- Element Faction Filter -->
          <div class="flex flex-wrap items-center gap-1">
            <span class="text-xs text-stone-500 mr-1">속성:</span>
            ${[
              { key: 'all', name: '전체' },
              { key: 'water', name: '물' },
              { key: 'fire', name: '불' },
              { key: 'wind', name: '바람' },
              { key: 'earth', name: '땅' },
              { key: 'human', name: '휴먼' },
              { key: 'undead', name: '언데드' },
              { key: 'elf', name: '엘프' },
              { key: 'dwarf', name: '드워프' },
              { key: 'monster', name: '마수' },
              { key: 'robot', name: '로봇' },
              { key: 'dragon', name: '드래곤' },
            ].map((f) => `
              <button
                type="button"
                data-action="filter-card-element"
                data-element="${f.key}"
                class="px-2 py-1 text-[11px] rounded-sm border min-h-[44px] flex items-center justify-center ${
                  localState.elementFilter === f.key
                    ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                    : 'bg-[#f8f7f7] text-stone-600 border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee]'
                }"
              >
                ${f.name}
              </button>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Selected Card Nurture & Stat Allocation Panel (if selected) -->
      ${selectedCard && selectedAsset ? `
        <section class="border-2 border-[#201d1d] bg-[#fdfcfc] p-6 sm:p-8 rounded-none shadow-none space-y-6 mb-8">
          <div class="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 pb-6 border-b border-[rgba(15,0,0,0.12)]">
            <div class="flex flex-col sm:flex-row items-center gap-6">
              <!-- Card Portrait -->
              <div class="relative w-36 h-48 sm:w-44 sm:h-56 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] flex items-center justify-center overflow-hidden">
                <img
                  src="${selectedAsset.bustPngUrl}"
                  alt="${selectedAsset.nameKo}"
                  class="max-w-full max-h-full object-contain"
                  onerror="this.src='${selectedAsset.seatUrl}'; this.onerror=null;"
                />
                ${cardNurtureStore.hasUnspentPoints(selectedCard.cardId) ? `
                  <span class="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-sm shadow-none">
                    스탯 UP!
                  </span>
                ` : ''}
              </div>

              <!-- Card Details & EXP Progression -->
              <div class="space-y-3 text-center sm:text-left">
                <div class="inline-flex items-center gap-2">
                  <span class="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm">
                    ${selectedAsset.code}
                  </span>
                  <span class="px-2 py-0.5 bg-[#f1eeee] text-[#201d1d] text-[10px] font-bold rounded-sm uppercase">
                    ${selectedAsset.faction} · ${selectedAsset.rarity}
                  </span>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-[#201d1d] m-0">
                  ${selectedAsset.nameKo} (${selectedAsset.nameEn})
                </h2>
                <div class="text-xs text-stone-600">
                  현재 레벨: <strong class="text-sm text-[#201d1d]">Lv.${selectedCard.level} / 100</strong>
                </div>

                <!-- EXP Progress Bar -->
                <div class="w-full sm:w-64 space-y-1">
                  <div class="flex justify-between text-[10px] text-stone-500">
                    <span>경험치 (EXP)</span>
                    <span>${selectedCard.exp} / ${selectedCard.expToNext}</span>
                  </div>
                  <div class="w-full bg-[#f1eeee] h-2 rounded-sm overflow-hidden">
                    <div
                      class="bg-emerald-600 h-full transition-all duration-300"
                      style="width: ${selectedCard.level >= 100 ? 100 : Math.min(100, Math.floor((selectedCard.exp / selectedCard.expToNext) * 100))}%"
                    ></div>
                  </div>
                </div>

                <!-- Nurture Buttons -->
                <div class="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    data-action="nurture-card"
                    data-card-id="${selectedCard.cardId}"
                    data-exp="50"
                    ${selectedCard.level >= 100 ? 'disabled' : ''}
                    class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center ${
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
                    class="px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-semibold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] flex items-center justify-center ${
                      selectedCard.level >= 100 ? 'opacity-50 cursor-not-allowed' : ''
                    }"
                  >
                    10회 연속 육성 (+500 EXP)
                  </button>
                </div>
              </div>
            </div>

            <!-- Close Inspector Button -->
            <button
              type="button"
              data-action="close-card-inspector"
              class="p-2 text-stone-500 hover:text-[#201d1d] min-h-[44px] min-w-[44px] flex items-center justify-center text-sm font-bold border border-[rgba(15,0,0,0.12)] rounded-sm"
              aria-label="인스펙터 닫기"
            >
              [X] 닫기
            </button>
          </div>

          <!-- 4-Way Directional Stat Enhancement Matrix -->
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[rgba(15,0,0,0.08)]">
              <div>
                <span class="text-[11px] text-stone-500 uppercase tracking-wider">4방향 스탯 인핸스먼트</span>
                <h3 class="text-base font-bold text-[#201d1d] m-0">방향별 능력치 배분</h3>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-stone-600">미분배 스탯 포인트:</span>
                <span class="px-2.5 py-1 ${
                  selectedCard.statPoints > 0 ? 'bg-red-600 text-white' : 'bg-[#f1eeee] text-[#201d1d]'
                } text-xs font-bold rounded-sm">
                  ${selectedCard.statPoints} P
                </span>
              </div>
            </div>

            ${selectedCard.statPoints > 0 ? `
              <div class="p-3 bg-[#fff7ed] border border-amber-300 rounded-none text-xs text-amber-800">
                [!] 보유 중인 스탯 포인트(${selectedCard.statPoints}P)가 있습니다. 원하는 방향의 [+] 버튼을 눌러 스탯을 강화하세요.
              </div>
            ` : ''}

            <!-- 4-Way D-Pad / Cross Layout -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Top (N) Stat -->
              <div class="p-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">상단 (Top / N)</span>
                  <span class="text-xs font-semibold text-emerald-700">+${selectedCard.bonusStats.top} 보너스</span>
                </div>
                <div class="text-xl font-bold text-[#201d1d]">
                  ${(selectedDbCard?.top || 0) + selectedCard.bonusStats.top}
                  <span class="text-xs text-stone-500 font-normal">(기본 ${selectedDbCard?.top || 0})</span>
                </div>
                <button
                  type="button"
                  data-action="allocate-stat"
                  data-card-id="${selectedCard.cardId}"
                  data-direction="top"
                  ${selectedCard.statPoints <= 0 ? 'disabled' : ''}
                  class="w-full py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center ${
                    selectedCard.statPoints <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                  }"
                >
                  + 상단(N) 강화
                </button>
              </div>

              <!-- Right (E) Stat -->
              <div class="p-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">우측 (Right / E)</span>
                  <span class="text-xs font-semibold text-emerald-700">+${selectedCard.bonusStats.right} 보너스</span>
                </div>
                <div class="text-xl font-bold text-[#201d1d]">
                  ${(selectedDbCard?.right || 0) + selectedCard.bonusStats.right}
                  <span class="text-xs text-stone-500 font-normal">(기본 ${selectedDbCard?.right || 0})</span>
                </div>
                <button
                  type="button"
                  data-action="allocate-stat"
                  data-card-id="${selectedCard.cardId}"
                  data-direction="right"
                  ${selectedCard.statPoints <= 0 ? 'disabled' : ''}
                  class="w-full py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center ${
                    selectedCard.statPoints <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                  }"
                >
                  + 우측(E) 강화
                </button>
              </div>

              <!-- Bottom (S) Stat -->
              <div class="p-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">하단 (Bottom / S)</span>
                  <span class="text-xs font-semibold text-emerald-700">+${selectedCard.bonusStats.bottom} 보너스</span>
                </div>
                <div class="text-xl font-bold text-[#201d1d]">
                  ${(selectedDbCard?.bottom || 0) + selectedCard.bonusStats.bottom}
                  <span class="text-xs text-stone-500 font-normal">(기본 ${selectedDbCard?.bottom || 0})</span>
                </div>
                <button
                  type="button"
                  data-action="allocate-stat"
                  data-card-id="${selectedCard.cardId}"
                  data-direction="bottom"
                  ${selectedCard.statPoints <= 0 ? 'disabled' : ''}
                  class="w-full py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center ${
                    selectedCard.statPoints <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                  }"
                >
                  + 하단(S) 강화
                </button>
              </div>

              <!-- Left (W) Stat -->
              <div class="p-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">좌측 (Left / W)</span>
                  <span class="text-xs font-semibold text-emerald-700">+${selectedCard.bonusStats.left} 보너스</span>
                </div>
                <div class="text-xl font-bold text-[#201d1d]">
                  ${(selectedDbCard?.left || 0) + selectedCard.bonusStats.left}
                  <span class="text-xs text-stone-500 font-normal">(기본 ${selectedDbCard?.left || 0})</span>
                </div>
                <button
                  type="button"
                  data-action="allocate-stat"
                  data-card-id="${selectedCard.cardId}"
                  data-direction="left"
                  ${selectedCard.statPoints <= 0 ? 'disabled' : ''}
                  class="w-full py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center ${
                    selectedCard.statPoints <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                  }"
                >
                  + 좌측(W) 강화
                </button>
              </div>
            </div>
          </div>
        </section>
      ` : ''}

      <!-- 110 Card Comprehensive Grid -->
      <section class="space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-[rgba(15,0,0,0.08)]">
          <span class="text-xs font-bold text-[#201d1d] uppercase">
            전체 카드 목록 (${filteredCardIds.length} / 110)
          </span>
          <span class="text-xs text-stone-500">
            카드를 클릭하여 상세 정보 확인 및 육성을 진행하세요.
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          ${filteredCardIds.map((id) => {
            const asset = getCharacterAsset(id);
            const cardData = cardNurtureStore.cards[id] || {
              cardId: id,
              level: 1,
              exp: 0,
              expToNext: 100,
              statPoints: 0,
              bonusStats: { top: 0, right: 0, bottom: 0, left: 0 },
              totalBonus: 0,
            };
            const isOwned = cardNurtureStore.isCardOwned(id);
            const hasPoints = cardNurtureStore.hasUnspentPoints(id);
            const isSelected = localState.selectedCardId === id;

            return `
              <div
                data-action="select-card"
                data-card-id="${id}"
                class="group relative border ${
                  isSelected
                    ? 'border-2 border-[#201d1d] bg-[#f8f7f7]'
                    : isOwned
                    ? 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:border-[#201d1d]'
                    : 'border-dashed border-stone-300 bg-[#faf9f9] opacity-70 hover:opacity-90'
                } p-3 rounded-none flex flex-col justify-between space-y-2 cursor-pointer transition-colors"
                role="button"
                tabindex="0"
                aria-label="${asset.nameKo} 카드 선택"
              >
                <!-- Top Row: Card ID, Faction Badge & Red Dot Indicator -->
                <div class="flex items-center justify-between text-[10px]">
                  <span class="font-bold text-stone-500">${asset.code}</span>
                  <div class="flex items-center gap-1.5">
                    ${hasPoints ? `
                      <span
                        class="inline-block w-2.5 h-2.5 rounded-full bg-red-600"
                        title="미분배 스탯 포인트 있음"
                      ></span>
                    ` : ''}
                    <span class="px-1.5 py-0.5 ${isOwned ? 'bg-[#201d1d] text-[#fdfcfc]' : 'bg-stone-300 text-stone-700'} font-semibold rounded-sm">
                      ${isOwned ? `Lv.${cardData.level}` : '미보유'}
                    </span>
                  </div>
                </div>

                <!-- Card Thumbnail Image -->
                <div class="w-full h-28 sm:h-32 bg-[#f1eeee] flex items-center justify-center overflow-hidden rounded-none p-1">
                  <img
                    src="${asset.sdUrl}"
                    alt="${asset.nameKo}"
                    class="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                    onerror="this.src='${asset.seatUrl}'; this.onerror=null;"
                  />
                </div>

                <!-- Card Info -->
                <div class="space-y-1">
                  <div class="text-xs font-bold text-[#201d1d] truncate" title="${asset.nameKo} (${asset.nameEn})">
                    ${asset.nameKo}
                  </div>
                  <div class="flex items-center justify-between text-[10px] text-stone-500">
                    <span class="capitalize">${asset.faction}</span>
                    <span class="uppercase">${asset.rarity}</span>
                  </div>
                </div>

                <!-- Mini EXP bar (if owned) -->
                ${isOwned ? `
                  <div class="w-full bg-[#f1eeee] h-1.5 rounded-sm overflow-hidden">
                    <div
                      class="bg-emerald-600 h-full"
                      style="width: ${cardData.level >= 100 ? 100 : Math.min(100, Math.floor((cardData.exp / cardData.expToNext) * 100))}%"
                    ></div>
                  </div>
                ` : `
                  <div class="text-[10px] text-stone-400 text-center py-0.5">
                    상점 획득 가능
                  </div>
                `}
              </div>
            `;
          }).join('')}
        </div>
      </section>
    </div>
  `;
}
```

---

### 4.3. `src/landing/views/ShopSection.tsx`

```tsx
/**
 * src/landing/views/ShopSection.tsx
 *
 * Streamlined Shop Section for SNSHero Static Landing.
 *
 * Requirements:
 *   - Exactly 8 fixed items:
 *     1. 일반 카드팩
 *     2. 매직 카드팩
 *     3. 희귀 카드팩
 *     4. 아이템 팩
 *     5. 광고 제거
 *     6. 공식 소설
 *     7. 공식 동영상
 *     8. 코인 충전
 *   - Strictly ZERO prohibited clutter items (행운의 룰렛, VIP 패스, 보물상자 등).
 *   - Card packs unlock cards into cardNurtureStore inventory (syncing collection rate and Total TP).
 *   - LocalStorage coin balance simulation ('hero_sns').
 *   - OpenCode Terminal-Flat design, 44px+ touch targets, font-mono, 0px/4px radii.
 */

import { cardNurtureStore } from '../services/cardNurtureStore';
import { SHOP_8_ITEMS } from '../types';

export interface ShopItemData {
  id: string;
  name: (typeof SHOP_8_ITEMS)[number];
  category: '카드팩' | '아이템' | '영구혜택' | '콘텐츠' | '재화';
  priceText: string;
  priceCoins: number;
  badge: string;
  description: string;
  actionText: string;
}

export const SHOP_ITEMS: ShopItemData[] = [
  {
    id: 'pack_normal',
    name: '일반 카드팩',
    category: '카드팩',
    priceText: '300 SNS',
    priceCoins: 300,
    badge: '브론즈~실버 확정',
    description: '기초 원소 영웅 3장을 획득합니다. 도감 수집율을 빠르게 높일 수 있는 기본 팩.',
    actionText: '구매하기 (300 SNS)',
  },
  {
    id: 'pack_magic',
    name: '매직 카드팩',
    category: '카드팩',
    priceText: '800 SNS',
    priceCoins: 800,
    badge: '실버~골드 확정',
    description: '상급 영웅 카드 3장을 획득합니다. 실버 등급 이상 확정 지급.',
    actionText: '구매하기 (800 SNS)',
  },
  {
    id: 'pack_rare',
    name: '희귀 카드팩',
    category: '카드팩',
    priceText: '1,500 SNS',
    priceCoins: 1500,
    badge: '골드 이상 확정',
    description: '최고 등급 전설 영웅 3장을 획득합니다. 덱 TP와 Total TP를 비약적으로 상승시킵니다.',
    actionText: '구매하기 (1,500 SNS)',
  },
  {
    id: 'item_pack',
    name: '아이템 팩',
    category: '아이템',
    priceText: '500 SNS',
    priceCoins: 500,
    badge: '육성 부스터',
    description: '카드 육성에 사용하는 마력의 EXP 영약 5개 세트. 카드 1장에 즉시 대량의 EXP를 공급합니다.',
    actionText: '구매하기 (500 SNS)',
  },
  {
    id: 'ad_remove',
    name: '광고 제거',
    category: '영구혜택',
    priceText: '1,000 SNS',
    priceCoins: 1000,
    badge: '영구 혜택',
    description: '인게임 및 배틀 중 발생하는 모든 배너/전면 광고를 영구적으로 제거합니다.',
    actionText: '영구 해금 (1,000 SNS)',
  },
  {
    id: 'official_novel',
    name: '공식 소설',
    category: '콘텐츠',
    priceText: '100 SNS',
    priceCoins: 100,
    badge: '40부작 전편',
    description: '카단과 아케인 대륙 11개 종족의 공식 대서사 웹소설 40화 전편 무제한 열람권.',
    actionText: '소장하기 (100 SNS)',
  },
  {
    id: 'official_movie',
    name: '공식 동영상',
    category: '콘텐츠',
    priceText: '200 SNS',
    priceCoins: 200,
    badge: '시네마 풀영상',
    description: '40부작 전편 고화질 실사 및 애니메이션 시네마 영상과 공식 오리지널 사운드트랙 소장권.',
    actionText: '시청권 구매 (200 SNS)',
  },
  {
    id: 'coin_charge',
    name: '코인 충전',
    category: '재화',
    priceText: '충전소',
    priceCoins: 0,
    badge: '즉시 지급',
    description: '상점 아이템 및 카드팩 구매에 사용하는 SNS 코인을 즉시 충전합니다.',
    actionText: '1,000 SNS 충전하기',
  },
];

export function getUserCoins(): number {
  if (typeof localStorage === 'undefined') return 1000;
  const raw = localStorage.getItem('hero_sns');
  if (!raw) {
    localStorage.setItem('hero_sns', '1000');
    return 1000;
  }
  const val = parseInt(raw, 10);
  return isNaN(val) ? 1000 : val;
}

export function setUserCoins(amount: number): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('hero_sns', String(Math.max(0, amount)));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('snshero_sns_updated'));
  }
}

export function executeShopPurchase(itemId: string): { success: boolean; message: string } {
  const item = SHOP_ITEMS.find((it) => it.id === itemId);
  if (!item) return { success: false, message: '아이템을 찾을 수 없습니다.' };

  const currentCoins = getUserCoins();

  if (itemId === 'coin_charge') {
    setUserCoins(currentCoins + 1000);
    return { success: true, message: '1,000 SNS 코인이 즉시 충전되었습니다!' };
  }

  if (currentCoins < item.priceCoins) {
    return {
      success: false,
      message: `SNS 코인이 부족합니다. (현재: ${currentCoins} SNS / 필요: ${item.priceCoins} SNS)`,
    };
  }

  // Deduct coins
  setUserCoins(currentCoins - item.priceCoins);

  // Card pack roll simulation
  if (itemId === 'pack_normal' || itemId === 'pack_magic' || itemId === 'pack_rare') {
    // Candidate card IDs based on rarity
    const unlockedIds: number[] = [];
    const minId = itemId === 'pack_normal' ? 1 : itemId === 'pack_magic' ? 20 : 60;
    const maxId = itemId === 'pack_normal' ? 50 : itemId === 'pack_magic' ? 90 : 110;

    for (let i = 0; i < 3; i++) {
      const randId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
      cardNurtureStore.addCard(randId);
      unlockedIds.push(randId);
    }

    return {
      success: true,
      message: `${item.name}을 구매하여 영웅 카드 3장(ID: ${unlockedIds.join(', ')})을 획득하였습니다!`,
    };
  }

  if (itemId === 'item_pack') {
    // Award 250 EXP to starter cards
    for (let id = 1; id <= 5; id++) {
      cardNurtureStore.nurtureCard(id, 250);
    }
    return {
      success: true,
      message: '아이템 팩을 구매하여 보유 덱 영웅들에게 +250 EXP가 공급되었습니다!',
    };
  }

  if (itemId === 'ad_remove') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hero_ad_removed', 'true');
    }
    return { success: true, message: '광고 제거 혜택이 영구 적용되었습니다!' };
  }

  return { success: true, message: `${item.name}이 성공적으로 적용되었습니다.` };
}

export function renderShopSection(): string {
  const coins = getUserCoins();

  return `
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 font-mono text-[#201d1d] select-none">
      <!-- Section Header -->
      <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 sm:p-8 rounded-none shadow-none space-y-6 mb-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[rgba(15,0,0,0.08)] gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase mb-2">
              <span>눈히어로 공식 상점</span>
              <span class="text-stone-400">·</span>
              <span>카드팩 &amp; 디지털 콘텐츠</span>
            </div>
            <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-[#201d1d] m-0">
              상점 (Card Shop &amp; Contents)
            </h1>
            <p class="text-xs sm:text-sm text-stone-600 mt-1 m-0">
              다양한 카드팩과 육성 부스터, 공식 40부작 웹소설 및 시네마 소장권을 구매할 수 있습니다.
            </p>
          </div>

          <!-- Currency & Recharge Bar -->
          <div class="flex items-center gap-3 p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none">
            <div class="text-right">
              <div class="text-[10px] text-stone-500 uppercase tracking-wider">보유 코인</div>
              <div class="text-base sm:text-lg font-black text-[#201d1d]">
                ${coins.toLocaleString()} SNS
              </div>
            </div>
            <button
              type="button"
              data-action="free-charge-coin"
              class="px-3 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center whitespace-nowrap"
            >
              + 코인 무료 충전
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs text-stone-500">
          <span>공식 등록 8종 필수 상품</span>
          <span>서버 로그인 없이 브라우저 로컬스토리지에 영구 보존됩니다.</span>
        </div>
      </section>

      <!-- Exact 8 Items Grid -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        ${SHOP_ITEMS.map((item) => `
          <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-5 sm:p-6 rounded-none flex flex-col justify-between space-y-4 hover:border-[#201d1d] transition-colors">
            <!-- Header: Category & Badge -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-stone-500 uppercase font-bold tracking-wider">
                  ${item.category}
                </span>
                <span class="px-2 py-0.5 bg-[#f1eeee] text-[#201d1d] text-[10px] font-bold rounded-sm">
                  ${item.badge}
                </span>
              </div>

              <!-- Item Name -->
              <h3 class="text-base sm:text-lg font-bold text-[#201d1d] m-0">
                ${item.name}
              </h3>

              <!-- Description -->
              <p class="text-xs text-stone-600 leading-relaxed m-0">
                ${item.description}
              </p>
            </div>

            <!-- Price & Purchase Action -->
            <div class="pt-4 border-t border-[rgba(15,0,0,0.08)] space-y-3">
              <div class="flex items-baseline justify-between">
                <span class="text-xs text-stone-500">판매 가격:</span>
                <span class="text-base font-black text-[#201d1d]">
                  ${item.priceText}
                </span>
              </div>

              <button
                type="button"
                data-action="buy-shop-item"
                data-item-id="${item.id}"
                data-item-name="${item.name}"
                class="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center shadow-none"
              >
                ${item.actionText}
              </button>
            </div>
          </div>
        `).join('')}
      </section>
    </div>
  `;
}
```

---

### 4.4. Integration Wiring in `src/landing/index.ts`

```typescript
// Add imports:
import { renderCardSection, setSelectedCardId, setElementFilter, setOwnedFilter } from './views/CardSection';
import { renderShopSection, executeShopPurchase, setUserCoins, getUserCoins } from './views/ShopSection';
import { cardNurtureStore } from './services/cardNurtureStore';

// In renderActiveViewContent(view: ViewKey):
function renderActiveViewContent(view: ViewKey): string {
  if (view === 'home') {
    return renderHomeSection();
  }
  if (view === 'card') {
    return renderCardSection();
  }
  if (view === 'shop') {
    return renderShopSection();
  }
  ...
}

// In handleEventDelegation(event: Event):
function handleEventDelegation(event: Event): void {
  const target = (event.target as HTMLElement).closest('[data-nav], [data-modal], [data-action]');
  if (!target) return;

  const nav = target.getAttribute('data-nav') as ViewKey | null;
  const modal = target.getAttribute('data-modal') as ModalKey | null;
  const action = target.getAttribute('data-action');

  if (nav) {
    state.activeView = nav;
    state.isSidebarOpen = false;
    window.location.hash = nav;
    renderApp();
  } else if (modal) {
    state.activeModal = modal;
    state.isSidebarOpen = false;
    renderApp();
  } else if (action === 'toggle-sidebar') {
    state.isSidebarOpen = !state.isSidebarOpen;
    renderApp();
  } else if (action === 'close-sidebar') {
    state.isSidebarOpen = false;
    renderApp();
  } else if (action === 'close-modal') {
    state.activeModal = null;
    renderApp();
  } else if (action === 'select-card') {
    const cardId = Number(target.getAttribute('data-card-id'));
    if (cardId) {
      setSelectedCardId(cardId);
      renderApp();
    }
  } else if (action === 'close-card-inspector') {
    setSelectedCardId(null);
    renderApp();
  } else if (action === 'nurture-card') {
    const cardId = Number(target.getAttribute('data-card-id'));
    const expGain = Number(target.getAttribute('data-exp') || '50');
    if (cardId) {
      cardNurtureStore.nurtureCard(cardId, expGain);
      renderApp();
    }
  } else if (action === 'allocate-stat') {
    const cardId = Number(target.getAttribute('data-card-id'));
    const direction = target.getAttribute('data-direction') as 'top' | 'right' | 'bottom' | 'left';
    if (cardId && direction) {
      cardNurtureStore.allocateStat(cardId, direction);
      renderApp();
    }
  } else if (action === 'filter-card-element') {
    const el = target.getAttribute('data-element') || 'all';
    setElementFilter(el);
    renderApp();
  } else if (action === 'filter-card-owned') {
    const owned = target.getAttribute('data-filter') as 'all' | 'owned' | 'unowned';
    setOwnedFilter(owned || 'all');
    renderApp();
  } else if (action === 'buy-shop-item') {
    const itemId = target.getAttribute('data-item-id');
    if (itemId) {
      executeShopPurchase(itemId);
      renderApp();
    }
  } else if (action === 'free-charge-coin') {
    const cur = getUserCoins();
    setUserCoins(cur + 1000);
    renderApp();
  }
}
```

---

## 5. Verification Method

1. **Static Type Checking**:
   ```bash
   npx tsc --noEmit
   ```
   - Target: Exits with code 0 (zero type errors across all files).

2. **Milestone 3 Automated Test Harness**:
   ```bash
   npx tsx tests/e2e/run_all.ts --milestone M3 --allow-fail
   ```
   - Expected Results upon implementation:
     - `T1.CARD.1` ~ `T1.CARD.6` all **✓ PASS**
     - `T1.STORE.1` ~ `T1.STORE.4` all **✓ PASS**
     - `T1.SHOP.1` ~ `T1.SHOP.5` all **✓ PASS**
     - `T2.B1.1`, `T2.B1.2`, `T2.B2.1`, `T2.B2.2`, `T2.B4.1`, `T2.B5.1` all **✓ PASS**
     - `T3.C1.1`, `T3.C1.2`, `T3.C1.6` all **✓ PASS**
     - `T4.W1.2`, `T4.W1.3` all **✓ PASS**

3. **Production Static Bundling**:
   ```bash
   npm run build
   ```
   - Target: Clean Vite multi-page build producing `dist/index.html` and `dist/home.html` with zero missing module or bundling errors.

4. **Invalidation Conditions**:
   - Any prohibited CSS classes (`bg-gradient-to-`, `rounded-xl`, `animate-ping`, `animate-bounce`) appearing in `CardSection.tsx` or `ShopSection.tsx`.
   - Modifying or dropping any of the exact 8 fixed items in `ShopSection.tsx` or adding legacy items (`행운의 룰렛`, `VIP 패스`, `보물상자`).
   - Any regression in max level 100 capping, stat points grant, or `hero_card_nurturing` LocalStorage schema.
