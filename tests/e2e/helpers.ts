import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import {
  CardNurtureData,
  BonusStats,
  NurtureState,
  TestResult,
  TestStatus,
  MilestoneType,
  TOP_NAV_ITEMS,
  SIDE_NAV_ITEMS,
  SHOP_8_ITEMS,
  EXTERNAL_LINKS,
} from './types';
import { CARD_DATABASE } from '../../src/cardDatabase';

// Resolve project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '../../');

/**
 * Read file relative to project root. Returns null if file does not exist.
 */
export function readProjectFile(relPath: string): string | null {
  const fullPath = path.resolve(REPO_ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Check if file or directory exists relative to project root.
 */
export function projectPathExists(relPath: string): boolean {
  const fullPath = path.resolve(REPO_ROOT, relPath);
  return fs.existsSync(fullPath);
}

/**
 * Parse HTML string into Cheerio DOM root.
 */
export function parseHtml(htmlContent: string) {
  return cheerio.load(htmlContent);
}

/**
 * In-memory Mock LocalStorage Engine conforming to Web Storage API.
 */
export class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }
}

/**
 * Reference Oracle for Card Nurturing & TP Calculation
 * Strictly derived from PROJECT.md § Interface Contracts.
 */
export class ReferenceNurtureStore implements NurtureState {
  cards: Record<number, CardNurtureData> = {};
  ownedCardIds: number[] = [1, 2, 3, 4, 5]; // Default initial 5 starter cards
  storageKey = 'hero_card_nurturing';
  private storage: MockLocalStorage;

  constructor(storage?: MockLocalStorage) {
    this.storage = storage || new MockLocalStorage();
    this.initDefaultCards();
  }

  private initDefaultCards() {
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

  private getCardBasePower(cardId: number): number {
    const dbCard = CARD_DATABASE[cardId];
    if (!dbCard) return 10;
    return (dbCard.top || 0) + (dbCard.right || 0) + (dbCard.bottom || 0) + (dbCard.left || 0);
  }

  getDeckTP(): number {
    // Top 5 active deck cards (default starter IDs: 1, 2, 3, 4, 5)
    const activeDeckIds = this.ownedCardIds.slice(0, 5);
    return activeDeckIds.reduce((sum, id) => {
      const card = this.cards[id];
      const basePower = this.getCardBasePower(id);
      const bonus = card ? card.totalBonus : 0;
      return sum + basePower + bonus;
    }, 0);
  }

  getTotalTP(): number {
    // Total TP for all owned cards
    return this.ownedCardIds.reduce((sum, id) => {
      const card = this.cards[id];
      const basePower = this.getCardBasePower(id);
      const bonus = card ? card.totalBonus : 0;
      return sum + basePower + bonus;
    }, 0);
  }

  nurtureCard(cardId: number, expGain: number = 50): { expGained: number; leveledUp: boolean; newLevel: number } {
    const card = this.cards[cardId];
    if (!card) {
      throw new Error(`Card ${cardId} does not exist`);
    }

    if (card.level >= 100) {
      card.level = 100;
      card.exp = card.expToNext;
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
    return { expGained: expGain, leveledUp, newLevel: card.level };
  }

  allocateStat(cardId: number, direction: 'top' | 'right' | 'bottom' | 'left'): boolean {
    const card = this.cards[cardId];
    if (!card || card.statPoints <= 0) {
      return false;
    }

    card.statPoints -= 1;
    card.bonusStats[direction] += 1;
    card.totalBonus += 1;
    this.saveToStorage();
    return true;
  }

  hasUnspentPoints(cardId: number): boolean {
    const card = this.cards[cardId];
    return !!card && card.statPoints > 0;
  }

  saveToStorage(): void {
    const payload = {
      cards: this.cards,
      ownedCardIds: this.ownedCardIds,
      updatedAt: Date.now(),
    };
    this.storage.setItem(this.storageKey, JSON.stringify(payload));
  }

  loadFromStorage(): void {
    const raw = this.storage.getItem(this.storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.cards) this.cards = parsed.cards;
        if (Array.isArray(parsed.ownedCardIds)) this.ownedCardIds = parsed.ownedCardIds;
      }
    } catch {
      // Graceful fallback to default state
      this.initDefaultCards();
    }
  }
}

/**
 * Execute an assertion test and format into TestResult.
 */
export async function runTestAssertion(
  testId: string,
  tier: number,
  feature: string,
  milestone: MilestoneType,
  name: string,
  testFn: () => Promise<{ pass: boolean; message: string; details?: string[] } | boolean>
): Promise<TestResult> {
  const start = performance.now();
  try {
    const res = await testFn();
    const durationMs = performance.now() - start;
    if (typeof res === 'boolean') {
      return {
        testId,
        tier,
        feature,
        milestone,
        name,
        status: res ? 'PASS' : 'FAIL',
        message: res ? 'Verification passed' : 'Assertion check failed',
        durationMs,
      };
    }
    return {
      testId,
      tier,
      feature,
      milestone,
      name,
      status: res.pass ? 'PASS' : 'FAIL',
      message: res.message,
      details: res.details,
      durationMs,
    };
  } catch (err: any) {
    const durationMs = performance.now() - start;
    return {
      testId,
      tier,
      feature,
      milestone,
      name,
      status: 'FAIL',
      message: `Exception during test: ${err?.message || String(err)}`,
      details: err?.stack ? [err.stack] : undefined,
      durationMs,
    };
  }
}
