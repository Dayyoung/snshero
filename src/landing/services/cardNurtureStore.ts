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
 *   - Active 5-card deck squad tracking (activeDeckIds / deckCardIds: slots 0..4)
 *   - Real-time Deck TP (5 active cards sum) & Total TP (all owned cards sum)
 *   - Full My Deck slot editing & card swap parity with duplicate prevention / slot swapping
 *   - Dual-sync with LocalStorage 'hero_deck' and season keys
 *   - Permanent LocalStorage auto-persistence under 'hero_card_nurturing'
 *   - Corrupted JSON recovery and dual-format legacy load support (number[] & object[])
 *
 * Fully adheres to PROJECT.md § Interface Contracts and OpenCode Terminal-Flat standards.
 */

import { CardNurtureData, NurtureState, OwnedCardInfo } from '../types';
import { CARD_DATABASE } from '../../cardDatabase';
import { INITIAL_SKILLS } from '../../constants';

export const STORAGE_KEY = 'hero_card_nurturing';
export const DECK_STORAGE_KEY = 'hero_deck';
export const REPEAT_HUNTING_KEY = 'hero_repeat_hunting';
export const EXP_ELIXIR_STORAGE_KEY = 'hero_exp_elixirs';

export interface CardNurtureStoragePayload {
  cards: Record<number, CardNurtureData>;
  ownedCardIds: number[];
  deckCardIds?: number[];
  activeDeckIds?: number[];
  updatedAt: number;
}

export class CardNurtureStore implements NurtureState {
  cards: Record<number, CardNurtureData> = {};
  ownedCardIds: number[] = [1, 2, 3, 4, 5]; // Default 5 starter cards
  activeDeckIds: number[] = [1, 2, 3, 4, 5]; // Active 5 cards in squad (slots 0..4)
  storageKey = STORAGE_KEY;
  deckStorageKey = DECK_STORAGE_KEY;
  repeatHuntingKey = REPEAT_HUNTING_KEY;

  // Alias for contract compatibility
  get deckCardIds(): number[] {
    return this.activeDeckIds;
  }
  set deckCardIds(ids: number[]) {
    this.activeDeckIds = ids;
  }

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
   * Safe getter for card nurture data
   */
  getCard(cardId: number): CardNurtureData {
    return (
      this.cards[cardId] || {
        cardId,
        level: 1,
        exp: 0,
        expToNext: 100,
        statPoints: 0,
        bonusStats: { top: 0, right: 0, bottom: 0, left: 0 },
        totalBonus: 0,
      }
    );
  }

  /**
   * Returns a copy of the active 5-card deck squad IDs
   */
  getDeckCardIds(): number[] {
    this.ensureValidDeck();
    return [...this.activeDeckIds];
  }

  /**
   * Returns rich data for all owned cards in inventory (for drawer/modal selection)
   */
  getOwnedCards(): OwnedCardInfo[] {
    return this.ownedCardIds.map((id) => {
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
    return this.activeDeckIds.includes(cardId);
  }

  /**
   * Retrieves player's consecutive win streak from LocalStorage
   */
  getWinStreak(): number {
    if (typeof localStorage === 'undefined') return 0;
    try {
      const saved = localStorage.getItem('hero_win_streak');
      if (saved) return parseInt(saved, 10) || 0;
      const historyStr = localStorage.getItem('hero_match_history');
      if (historyStr) {
        const history = JSON.parse(historyStr);
        if (Array.isArray(history)) {
          let streak = 0;
          for (const match of history) {
            if (match.result === 'win' || match.isWin) {
              streak++;
            } else {
              break;
            }
          }
          return streak;
        }
      }
    } catch {}
    return 0;
  }

  /**
   * Active 5-card deck TP formula: sum of (basePower + totalBonus) for active 5 cards
   */
  getDeckTP(): number {
    this.ensureValidDeck();
    return this.activeDeckIds.reduce((sum, id) => {
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
   * Validates slot index, card ID, ownership, and handles deduplication via slot swapping.
   */
  setDeckCard(slotIndex: number, cardId: number): boolean {
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= 5) {
      return false;
    }
    if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110) {
      return false;
    }
    if (!this.isCardOwned(cardId)) {
      return false;
    }

    this.ensureValidDeck();
    const currentDeck = [...this.activeDeckIds];

    // Deduplication / Slot-swapping: if card already occupies another slot, swap slots
    const existingIndex = currentDeck.indexOf(cardId);
    if (existingIndex !== -1 && existingIndex !== slotIndex) {
      currentDeck[existingIndex] = currentDeck[slotIndex];
    }
    currentDeck[slotIndex] = cardId;
    this.activeDeckIds = currentDeck;

    this.saveToStorage();
    this.dispatchUpdateEvent(cardId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snshero_deck_updated'));
    }
    return true;
  }

  /**
   * Alias for setDeckCard to guarantee backwards and cross-call compatibility.
   */
  setDeckSlot(slotIndex: number, cardId: number): boolean {
    return this.setDeckCard(slotIndex, cardId);
  }

  /**
   * Swap two deck slots
   */
  swapDeckCards(slotA: number, slotB: number): boolean {
    if (slotA < 0 || slotA >= 5 || slotB < 0 || slotB >= 5) return false;
    this.ensureValidDeck();
    const temp = this.activeDeckIds[slotA];
    this.activeDeckIds[slotA] = this.activeDeckIds[slotB];
    this.activeDeckIds[slotB] = temp;
    this.saveToStorage();
    this.dispatchUpdateEvent();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snshero_deck_updated'));
    }
    return true;
  }

  /**
   * Automatically compose the 5-card active deck with the strongest owned cards
   * sorted by totalTP DESC -> level DESC -> rarity rank DESC -> cardId ASC.
   */
  autoOptimizeDeck(): {
    previousDeckIds: number[];
    newDeckIds: number[];
    previousTP: number;
    newTP: number;
    changed: boolean;
  } {
    this.ensureValidDeck();
    const previousDeckIds = [...this.activeDeckIds];
    const previousTP = this.getDeckTP();

    const rarityRank: Record<string, number> = {
      gold: 3,
      silver: 2,
      bronze: 1,
    };

    const ownedCards = this.getOwnedCards();
    const sorted = [...ownedCards].sort((a, b) => {
      if (b.totalTP !== a.totalTP) return b.totalTP - a.totalTP;
      if (b.level !== a.level) return b.level - a.level;
      const rA = rarityRank[(CARD_DATABASE[a.cardId]?.rarity || 'bronze').toLowerCase()] || 1;
      const rB = rarityRank[(CARD_DATABASE[b.cardId]?.rarity || 'bronze').toLowerCase()] || 1;
      if (rB !== rA) return rB - rA;
      return a.cardId - b.cardId;
    });

    const top5Ids: number[] = [];
    for (const item of sorted) {
      if (!top5Ids.includes(item.cardId)) {
        top5Ids.push(item.cardId);
      }
      if (top5Ids.length === 5) break;
    }

    // Fallback if fewer than 5 owned cards
    for (let id = 1; id <= 110 && top5Ids.length < 5; id++) {
      if (!top5Ids.includes(id)) {
        top5Ids.push(id);
      }
    }

    const changed = previousDeckIds.some((id, idx) => id !== top5Ids[idx]);
    this.activeDeckIds = top5Ids;
    this.saveToStorage();
    this.dispatchUpdateEvent(top5Ids[0]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snshero_deck_updated'));
    }

    const newTP = this.getDeckTP();
    return {
      previousDeckIds,
      newDeckIds: [...this.activeDeckIds],
      previousTP,
      newTP,
      changed,
    };
  }

  /**
   * Nurture card: grants EXP, triggers level-up with stat points, enforces max level 100 cap
   */
  nurtureCard(cardId: number, expGain: number = 50): { expGained: number; leveledUp: boolean; newLevel: number } {
    if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110 || !this.isCardOwned(cardId)) {
      return { expGained: 0, leveledUp: false, newLevel: this.cards[cardId]?.level || 1 };
    }

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
   * Add EXP to a card (alias for nurtureCard for shop and milestone parity)
   */
  addExp(cardId: number, expGain: number = 50): { expGained: number; leveledUp: boolean; newLevel: number } {
    return this.nurtureCard(cardId, expGain);
  }

  /**
   * Get current owned EXP Elixir bottle count from LocalStorage
   */
  getExpElixirCount(): number {
    if (typeof localStorage === 'undefined') return 0;
    try {
      const raw = localStorage.getItem(EXP_ELIXIR_STORAGE_KEY);
      const parsed = raw ? parseInt(raw, 10) : 0;
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Add EXP Elixir bottles to inventory (e.g., +10 bottles on purchasing item_exp_pack)
   */
  addExpElixirs(bottles: number = 10): number {
    const current = this.getExpElixirCount();
    const next = Math.max(0, current + bottles);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(EXP_ELIXIR_STORAGE_KEY, String(next));
      } catch {}
    }
    this.dispatchUpdateEvent();
    return next;
  }

  /**
   * Consume 1 EXP Elixir bottle (+500 EXP) on a specific owned hero card
   */
  useExpElixir(cardId: number): {
    success: boolean;
    remainingElixirs: number;
    expGained: number;
    leveledUp: boolean;
    newLevel: number;
  } {
    const current = this.getExpElixirCount();
    if (current <= 0 || !this.isCardOwned(cardId)) {
      return {
        success: false,
        remainingElixirs: current,
        expGained: 0,
        leveledUp: false,
        newLevel: this.cards[cardId]?.level || 1,
      };
    }
    const card = this.cards[cardId];
    if (card && card.level >= 100) {
      return {
        success: false,
        remainingElixirs: current,
        expGained: 0,
        leveledUp: false,
        newLevel: 100,
      };
    }

    const next = current - 1;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(EXP_ELIXIR_STORAGE_KEY, String(next));
      } catch {}
    }
    const res = this.nurtureCard(cardId, 500);
    return {
      success: true,
      remainingElixirs: next,
      expGained: res.expGained,
      leveledUp: res.leveledUp,
      newLevel: res.newLevel,
    };
  }

  /**
   * Battle Victory EXP Hook (Milestone 4):
   * On player victory, awards EXP (default 50) exclusively to active deck cards that are owned.
   */
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('snshero_battle_exp_awarded', {
          detail: { expAwarded: expGain, updatedCards },
        })
      );
    }
    return { expAwarded: expGain, deckCount: this.activeDeckIds.length, updatedCards };
  }

  /**
   * Repeat Hunting Loop (Milestone 4)
   */
  setRepeatHunting(enabled: boolean): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.repeatHuntingKey, enabled ? 'true' : 'false');
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('snshero_repeat_hunting_changed', { detail: { enabled } }));
    }
  }

  isRepeatHuntingActive(): boolean {
    if (typeof localStorage === 'undefined') return false;
    try {
      return localStorage.getItem(this.repeatHuntingKey) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Allocate 1 stat point to specified direction ('top' | 'right' | 'bottom' | 'left')
   */
  allocateStat(cardId: number, direction: 'top' | 'right' | 'bottom' | 'left'): boolean {
    if (!this.isCardOwned(cardId) || !['top', 'right', 'bottom', 'left'].includes(direction)) {
      return false;
    }
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
    if (!this.isCardOwned(cardId)) {
      return false;
    }
    const card = this.cards[cardId];
    return !!card && card.statPoints > 0;
  }

  /**
   * Add a new card to owned inventory (e.g. from shop or rewards)
   */
  addCard(cardId: number): boolean {
    if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110) return false;
    let added = false;
    if (!this.ownedCardIds.includes(cardId)) {
      this.ownedCardIds.push(cardId);
      this.ownedCardIds.sort((a, b) => a - b);
      this.ensureValidDeck();
      added = true;
    }
    this.syncCardToHeroInventory(cardId);
    this.saveToStorage();
    this.dispatchUpdateEvent(cardId);
    return added;
  }

  syncCardToHeroInventory(cardId: number): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const rawInv = localStorage.getItem('hero_inventory');
      const inv: Record<string, any> = rawInv ? JSON.parse(rawInv) : {};
      const key = String(cardId);
      if (!inv[key]) {
        inv[key] = {
          cardIndex: cardId,
          id: cardId,
          quantity: 1,
          rarity: CARD_DATABASE[cardId]?.rarity || 'bronze',
        };
      } else {
        inv[key].quantity = (inv[key].quantity || 0) + 1;
      }
      const serialized = JSON.stringify(inv);
      localStorage.setItem('hero_inventory', serialized);
      localStorage.setItem(`hero_inventory_${season}`, serialized);
      localStorage.setItem(`hero_inventory_guest_${season}`, serialized);
      localStorage.setItem('hero_inventory_s1', serialized);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('snshero_inventory_updated', {
            detail: { cardId, quantity: inv[key].quantity, inventory: inv },
          })
        );
      }
    } catch (e) {
      console.warn('Failed to sync to hero_inventory:', e);
    }
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
   * Save state to localStorage ('hero_card_nurturing') and dual-sync to 'hero_deck'
   */
  saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      this.ensureValidDeck();
      const payload: CardNurtureStoragePayload = {
        cards: this.cards,
        ownedCardIds: this.ownedCardIds,
        deckCardIds: this.activeDeckIds,
        activeDeckIds: this.activeDeckIds,
        updatedAt: Date.now(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
      localStorage.setItem(this.deckStorageKey, JSON.stringify(this.activeDeckIds));
      this.syncToLegacyDeck();
    } catch (e) {
      console.warn('Failed to save hero_card_nurturing to localStorage:', e);
    }
  }

  /**
   * Dual-sync with legacy DeckView / season keys in LocalStorage format
   */
  syncToLegacyDeck(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const legacyDeck = this.activeDeckIds.map((cardId, slotIndex) => {
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
          skills: [...INITIAL_SKILLS.map((s) => ({ ...s }))],
        };
      });

      const serialized = JSON.stringify(legacyDeck);
      localStorage.setItem(`hero_deck_${season}`, serialized);
      localStorage.setItem(`hero_deck_guest_${season}`, serialized);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('snshero_deck_updated'));
      }
    } catch (e) {
      console.warn('Failed to sync to legacy hero_deck:', e);
    }
  }

  /**
   * Load state from localStorage with safe fallback for corrupted/missing data.
   * Supports both raw integer array [1, 2, 3, 4, 5] and legacy object array [{id: 1}, ...]
   */
  loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    // 1. Load hero_card_nurturing payload
    const rawNurture = localStorage.getItem(this.storageKey);
    if (rawNurture) {
      try {
        const parsed = JSON.parse(rawNurture);
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
              .filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id >= 1 && id <= 110)
              .sort((a, b) => a - b);
          }
          const savedDeck = parsed.activeDeckIds || parsed.deckCardIds;
          if (Array.isArray(savedDeck) && savedDeck.length === 5) {
            this.activeDeckIds = savedDeck.filter(
              (id): id is number => typeof id === 'number' && Number.isInteger(id) && id >= 1 && id <= 110
            );
          }
        }
      } catch {
        this.initDefaultCards();
        this.ownedCardIds = [1, 2, 3, 4, 5];
        this.activeDeckIds = [1, 2, 3, 4, 5];
      }
    }

    // 2. Load / override from hero_deck if available (supports dual formats: number[] and object[])
    this.bootstrapDeckFromLegacy();
    this.ensureValidDeck();
  }

  /**
   * Bootstrap active deck from hero_deck / legacy hero_deck keys if present
   */
  private bootstrapDeckFromLegacy(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const rawDeck =
        localStorage.getItem(this.deckStorageKey) ||
        localStorage.getItem(`hero_deck_${season}`) ||
        localStorage.getItem(`hero_deck_guest_${season}`);

      if (rawDeck) {
        const parsed = JSON.parse(rawDeck);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const extracted: number[] = [];
          for (const item of parsed) {
            let id: number | null = null;
            if (typeof item === 'number') {
              id = item;
            } else if (typeof item === 'string') {
              const num = parseInt(item, 10);
              if (!isNaN(num)) id = num;
            } else if (item && typeof item === 'object') {
              id = Number(item.imageIndex ?? item.cardIndex ?? item.id ?? item.cardId);
            }
            if (id !== null && Number.isInteger(id) && id >= 1 && id <= 110 && !extracted.includes(id)) {
              extracted.push(id);
              if (!this.ownedCardIds.includes(id)) {
                this.ownedCardIds.push(id);
              }
            }
          }
          if (extracted.length >= 5) {
            this.activeDeckIds = extracted.slice(0, 5);
            return;
          }
        }
      }
    } catch {}

    if (!this.activeDeckIds || this.activeDeckIds.length !== 5) {
      this.activeDeckIds = this.ownedCardIds.slice(0, 5);
    }
  }

  /**
   * Guarantee that activeDeckIds contains exactly 5 distinct, owned card IDs
   */
  private ensureValidDeck(): void {
    const valid: number[] = [];
    for (const id of this.activeDeckIds) {
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
    this.activeDeckIds = valid.slice(0, 5);
  }

  private dispatchUpdateEvent(cardId?: number): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('snshero_card_nurture_updated', { detail: { cardId } }));
    }
  }
}

export const cardNurtureStore = new CardNurtureStore();
