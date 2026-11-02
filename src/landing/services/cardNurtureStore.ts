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

import { CardNurtureData, NurtureState } from '../types';
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
    if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110) return false;
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
