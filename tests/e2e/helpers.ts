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
  HashRoute,
  LegacyRoute,
  HASH_ROUTES,
  LEGACY_ROUTES,
  LEGACY_ROUTE_MAPPING,
  IDLE_AUTO_PLAY_CONFIG,
  PackRevealCard,
  CurrencyBalanceState,
  AdSensePlacementResult,
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
 * Reference Oracle for Hash-based Single-Page Routing.
 * Mapped to PROJECT.md Features 1, 2, 4.
 */
export class ReferenceHashRouter {
  normalizeHashRoute(rawHashOrPath: string): HashRoute {
    if (!rawHashOrPath) return '#home';

    // Strip leading slash or query params
    const clean = rawHashOrPath.split('?')[0].trim();

    // Check if it's a legacy route
    if (clean in LEGACY_ROUTE_MAPPING) {
      return LEGACY_ROUTE_MAPPING[clean as LegacyRoute];
    }

    // Check with hash
    const normalizedHash = clean.startsWith('#') ? clean : `#${clean}`;
    if (HASH_ROUTES.includes(normalizedHash as HashRoute)) {
      return normalizedHash as HashRoute;
    }

    // Default fallback to #home
    return '#home';
  }

  isLegacyRoute(route: string): boolean {
    const clean = route.split('?')[0].trim();
    return LEGACY_ROUTES.includes(clean as LegacyRoute);
  }

  getLegacyRedirect(route: string): HashRoute | null {
    const clean = route.split('?')[0].trim();
    if (this.isLegacyRoute(clean)) {
      return LEGACY_ROUTE_MAPPING[clean as LegacyRoute];
    }
    return null;
  }
}

/**
 * Reference Oracle for Global 15-Second Idle Auto-Play Transition.
 * Mapped to PROJECT.md Feature 3 (R2).
 */
export class ReferenceIdleAutoPlayManager {
  private timeoutMs: number;
  private targetUrl: string;
  private currentIdleMs: number = 0;
  private isAutoPlayActive: boolean = false;
  private storage: MockLocalStorage;

  constructor(
    storage?: MockLocalStorage,
    timeoutMs: number = IDLE_AUTO_PLAY_CONFIG.timeoutMs,
    targetUrl: string = IDLE_AUTO_PLAY_CONFIG.targetUrl
  ) {
    this.storage = storage || new MockLocalStorage();
    this.timeoutMs = timeoutMs;
    this.targetUrl = targetUrl;
  }

  resetTimer(): void {
    this.currentIdleMs = 0;
  }

  handleUserInteraction(): void {
    this.currentIdleMs = 0;
  }

  tick(deltaMs: number): { redirected: boolean; targetUrl?: string; autoModeSet: boolean } {
    this.currentIdleMs += deltaMs;
    if (this.currentIdleMs >= this.timeoutMs) {
      this.isAutoPlayActive = true;
      this.storage.setItem(IDLE_AUTO_PLAY_CONFIG.autoModeStorageKey, 'true');
      return {
        redirected: true,
        targetUrl: this.targetUrl,
        autoModeSet: this.storage.getItem(IDLE_AUTO_PLAY_CONFIG.autoModeStorageKey) === 'true',
      };
    }
    return {
      redirected: false,
      autoModeSet: this.storage.getItem(IDLE_AUTO_PLAY_CONFIG.autoModeStorageKey) === 'true',
    };
  }

  getIdleTime(): number {
    return this.currentIdleMs;
  }

  isTriggered(): boolean {
    return this.isAutoPlayActive;
  }
}

/**
 * Reference Oracle for Card Nurture, Deck Editing, and Battle Victory EXP.
 * Mapped to PROJECT.md Features 7, 13, 14, 15.
 */
export class ReferenceNurtureStore implements NurtureState {
  cards: Record<number, CardNurtureData> = {};
  ownedCardIds: number[] = [1, 2, 3, 4, 5]; // Default initial 5 starter cards
  activeDeckIds: number[] = [1, 2, 3, 4, 5]; // 5 active deck slots
  storageKey = 'hero_card_nurturing';
  deckStorageKey = 'hero_deck';
  repeatHuntingKey = 'hero_repeat_hunting';
  private storage: MockLocalStorage;

  constructor(storage?: MockLocalStorage) {
    this.storage = storage || new MockLocalStorage();
    this.initDefaultCards();
    this.loadFromStorage();
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

  isCardOwned(cardId: number): boolean {
    return this.ownedCardIds.includes(cardId);
  }

  getDeckTP(): number {
    return this.activeDeckIds.reduce((sum, id) => {
      const card = this.cards[id];
      const basePower = this.getCardBasePower(id);
      const bonus = card ? card.totalBonus : 0;
      return sum + basePower + bonus;
    }, 0);
  }

  getTotalTP(): number {
    return this.ownedCardIds.reduce((sum, id) => {
      const card = this.cards[id];
      const basePower = this.getCardBasePower(id);
      const bonus = card ? card.totalBonus : 0;
      return sum + basePower + bonus;
    }, 0);
  }

  setDeckCard(slotIndex: number, cardId: number): boolean {
    if (slotIndex < 0 || slotIndex >= 5) return false;
    if (!this.isCardOwned(cardId)) return false;

    // Prevent duplicate cards in active deck
    const existingIndex = this.activeDeckIds.indexOf(cardId);
    if (existingIndex !== -1 && existingIndex !== slotIndex) {
      // Swap slots
      this.activeDeckIds[existingIndex] = this.activeDeckIds[slotIndex];
    }
    this.activeDeckIds[slotIndex] = cardId;
    this.saveToStorage();
    return true;
  }

  /**
   * Owned-only Nurturing Restriction (Feature 13):
   * Strictly rejects nurturing if card is NOT owned.
   */
  nurtureCard(cardId: number, expGain: number = 50): { expGained: number; leveledUp: boolean; newLevel: number } {
    if (!this.isCardOwned(cardId)) {
      return { expGained: 0, leveledUp: false, newLevel: this.cards[cardId]?.level || 1 };
    }

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

  /**
   * Battle Victory EXP Gating Hook (Feature 14):
   * On player victory, awards EXP (default 50) exclusively to active 5-card deck.
   */
  awardBattleVictoryExp(expGain: number = 50): { expAwarded: number; updatedCards: number[] } {
    const updatedCards: number[] = [];
    for (const cardId of this.activeDeckIds) {
      if (this.isCardOwned(cardId)) {
        this.nurtureCard(cardId, expGain);
        updatedCards.push(cardId);
      }
    }
    this.saveToStorage();
    return { expAwarded: expGain, updatedCards };
  }

  /**
   * Repeat Hunting Loop (Feature 15):
   */
  setRepeatHunting(enabled: boolean): void {
    this.storage.setItem(this.repeatHuntingKey, enabled ? 'true' : 'false');
  }

  isRepeatHuntingActive(): boolean {
    return this.storage.getItem(this.repeatHuntingKey) === 'true';
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

  addCard(cardId: number): boolean {
    if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110) return false;
    if (!this.ownedCardIds.includes(cardId)) {
      this.ownedCardIds.push(cardId);
      this.ownedCardIds.sort((a, b) => a - b);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  saveToStorage(): void {
    const payload = {
      cards: this.cards,
      ownedCardIds: this.ownedCardIds,
      updatedAt: Date.now(),
    };
    this.storage.setItem(this.storageKey, JSON.stringify(payload));
    this.storage.setItem(this.deckStorageKey, JSON.stringify(this.activeDeckIds));
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
      this.initDefaultCards();
    }

    const rawDeck = this.storage.getItem(this.deckStorageKey);
    if (rawDeck) {
      try {
        const parsedDeck = JSON.parse(rawDeck);
        if (Array.isArray(parsedDeck) && parsedDeck.length === 5) {
          this.activeDeckIds = parsedDeck;
        }
      } catch {}
    }
  }
}

/**
 * Reference Oracle for Shop Restoration, Dual-Write, and Non-Free Gold Replenishment.
 * Mapped to PROJECT.md Features 16, 17, 18, 19.
 */
export class ReferenceShopManager {
  private storage: MockLocalStorage;
  private nurtureStore: ReferenceNurtureStore;

  constructor(nurtureStore: ReferenceNurtureStore, storage?: MockLocalStorage) {
    this.nurtureStore = nurtureStore;
    this.storage = storage || new MockLocalStorage();
    this.initDefaultBalances();
  }

  private initDefaultBalances(): void {
    if (this.storage.getItem('hero_sns') === null) {
      this.storage.setItem('hero_sns', '1000');
    }
    if (this.storage.getItem('hero_gold') === null) {
      this.storage.setItem('hero_gold', '10000');
    }
    if (this.storage.getItem('hero_earned_sns') === null) {
      this.storage.setItem('hero_earned_sns', '0');
    }
    if (this.storage.getItem('hero_purchased_sns') === null) {
      this.storage.setItem('hero_purchased_sns', '0');
    }
  }

  getBalances(): CurrencyBalanceState {
    return {
      sns: parseInt(this.storage.getItem('hero_sns') || '0', 10),
      earnedSns: parseInt(this.storage.getItem('hero_earned_sns') || '0', 10),
      purchasedSns: parseInt(this.storage.getItem('hero_purchased_sns') || '0', 10),
      gold: parseInt(this.storage.getItem('hero_gold') || '0', 10),
    };
  }

  /**
   * Card Pack Purchase & Reveal Modal (Feature 16) + Dual-Write (Feature 17):
   * Deducts SNS, yields 3 cards, dual-writes to cardNurtureStore and hero_inventory.
   */
  purchaseCardPack(packTier: 'normal' | 'magic' | 'rare'): {
    success: boolean;
    revealedCards: PackRevealCard[];
    deductedSns: number;
    error?: string;
  } {
    const prices: Record<string, number> = { normal: 300, magic: 800, rare: 1500 };
    const price = prices[packTier] || 300;

    const currentSns = parseInt(this.storage.getItem('hero_sns') || '0', 10);
    if (currentSns < price) {
      return { success: false, revealedCards: [], deductedSns: 0, error: '잔여 SNS 코인이 부족합니다.' };
    }

    // Debit SNS
    this.storage.setItem('hero_sns', String(currentSns - price));

    // Roll 3 distinct cards
    const candidateIds = Array.from({ length: 110 }, (_, i) => i + 1);
    const rolledIds: number[] = [];
    while (rolledIds.length < 3) {
      const randId = candidateIds[Math.floor(Math.random() * candidateIds.length)];
      if (!rolledIds.includes(randId)) {
        rolledIds.push(randId);
      }
    }

    const revealedCards: PackRevealCard[] = [];
    for (const cardId of rolledIds) {
      // Dual-write 1: cardNurtureStore
      this.nurtureStore.addCard(cardId);

      // Dual-write 2: hero_inventory in LocalStorage
      this.syncToHeroInventory(cardId);

      const dbCard = CARD_DATABASE[cardId];
      revealedCards.push({
        cardId,
        nameKo: dbCard?.nameKo || `영웅 #${cardId}`,
        nameEn: dbCard?.nameEn || `Hero #${cardId}`,
        rarity: (dbCard?.rarity as any) || 'Silver',
        faction: dbCard?.faction || 'Neutral',
        power: (dbCard?.top || 0) + (dbCard?.right || 0) + (dbCard?.bottom || 0) + (dbCard?.left || 0),
      });
    }

    return { success: true, revealedCards, deductedSns: price };
  }

  private syncToHeroInventory(cardId: number): void {
    const rawInv = this.storage.getItem('hero_inventory');
    let inventory: number[] = [];
    if (rawInv) {
      try {
        const parsed = JSON.parse(rawInv);
        if (Array.isArray(parsed)) inventory = parsed;
      } catch {}
    }
    if (!inventory.includes(cardId)) {
      inventory.push(cardId);
      inventory.sort((a, b) => a - b);
      this.storage.setItem('hero_inventory', JSON.stringify(inventory));
    }
  }

  /**
   * Non-Free Currency Replenishment (Feature 19):
   * Consumes in-game LocalStorage currency (hero_gold) to replenish hero_sns.
   * e.g., 5,000 Gold -> 1,000 SNS. Free zero-cost button is prohibited.
   */
  exchangeGoldForSns(goldAmount: number = 5000): {
    success: boolean;
    snsGranted: number;
    error?: string;
  } {
    if (goldAmount <= 0) {
      return { success: false, snsGranted: 0, error: '유효하지 않은 교환 골드 수량입니다.' };
    }

    const currentGold = parseInt(this.storage.getItem('hero_gold') || '0', 10);
    if (currentGold < goldAmount) {
      return { success: false, snsGranted: 0, error: '보유 골드가 부족합니다.' };
    }

    // Exchange rate: 5 Gold = 1 SNS
    const snsGranted = Math.floor(goldAmount / 5);

    // Debit Gold
    this.storage.setItem('hero_gold', String(currentGold - goldAmount));

    // Credit SNS
    const currentSns = parseInt(this.storage.getItem('hero_sns') || '0', 10);
    this.storage.setItem('hero_sns', String(currentSns + snsGranted));

    const currentEarned = parseInt(this.storage.getItem('hero_earned_sns') || '0', 10);
    this.storage.setItem('hero_earned_sns', String(currentEarned + snsGranted));

    return { success: true, snsGranted };
  }
}

/**
 * Reference Oracle for Responsive Google AdSense Placements.
 * Mapped to PROJECT.md Features 20, 21, 22 (R3).
 */
export class ReferenceAdSenseManager {
  private storage: MockLocalStorage;

  constructor(storage?: MockLocalStorage) {
    this.storage = storage || new MockLocalStorage();
  }

  isAdRemoved(): boolean {
    return this.storage.getItem('hero_ad_removed') === 'true';
  }

  getPlacements(viewportWidth: number): AdSensePlacementResult {
    // VIP Ad-Removal Guard (Feature 22)
    if (this.isAdRemoved()) {
      return {
        desktopLeft: false,
        desktopRight: false,
        mobileTop: false,
        suppressedByVip: true,
      };
    }

    // Desktop: >= 1024px
    if (viewportWidth >= 1024) {
      return {
        desktopLeft: true,
        desktopRight: true,
        mobileTop: false,
        suppressedByVip: false,
      };
    }

    // Tablet & Mobile: < 1024px
    return {
      desktopLeft: false,
      desktopRight: false,
      mobileTop: true,
      suppressedByVip: false,
    };
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
