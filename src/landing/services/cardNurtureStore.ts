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
              .filter((id): id is number => typeof id === 'number' && id >= 1 && id <= 110)
              .sort((a, b) => a - b);
          }
          const savedDeck = parsed.activeDeckIds || parsed.deckCardIds;
          if (Array.isArray(savedDeck) && savedDeck.length === 5) {
            this.activeDeckIds = savedDeck.filter(
              (id): id is number => typeof id === 'number' && id >= 1 && id <= 110
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
