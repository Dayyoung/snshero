/**
 * Types and interfaces for SNSHero Hash-Based SPA Migration & Full Feature Parity E2E Test Suite.
 *
 * Mapped to PROJECT.md 24 Features and 6 Milestones (M1..M6).
 */

export type TestStatus = 'PASS' | 'FAIL' | 'WARN';
export type MilestoneType = 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6' | 'ALL';

export interface TestResult {
  testId: string;
  tier: number;
  feature: string;
  milestone: MilestoneType;
  name: string;
  status: TestStatus;
  message: string;
  details?: string[];
  durationMs: number;
}

export interface RunOptions {
  tier?: number;
  milestone?: MilestoneType;
  verbose?: boolean;
  json?: boolean;
  allowFail?: boolean;
}

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
  activeDeckIds: number[];
  getDeckTP: () => number;
  getTotalTP: () => number;
  isCardOwned: (cardId: number) => boolean;
  nurtureCard: (cardId: number, expGain?: number) => { expGained: number; leveledUp: boolean; newLevel: number };
  allocateStat: (cardId: number, direction: 'top' | 'right' | 'bottom' | 'left') => boolean;
  hasUnspentPoints: (cardId: number) => boolean;
  setDeckCard: (slotIndex: number, cardId: number) => boolean;
  awardBattleVictoryExp: (expGain?: number) => { expAwarded: number; updatedCards: number[] };
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

export type ViewKey = 'home' | 'deck' | 'play' | 'card' | 'shop';
export type HashRoute = '#home' | '#deck' | '#play' | '#card' | '#shop';
export type LegacyRoute = '/home' | '/deck' | '/play' | '/main' | '/shop' | '/card';
export type ModalKey = 'mall' | 'community' | 'login' | 'goldExchange' | 'packReveal' | null;

export const HASH_ROUTES: HashRoute[] = ['#home', '#deck', '#play', '#card', '#shop'];
export const LEGACY_ROUTES: LegacyRoute[] = ['/home', '/deck', '/play', '/main', '/shop', '/card'];

export const LEGACY_ROUTE_MAPPING: Record<LegacyRoute, HashRoute> = {
  '/home': '#home',
  '/deck': '#deck',
  '/play': '#play',
  '/main': '#play',
  '/shop': '#shop',
  '/card': '#card',
};

export const IDLE_AUTO_PLAY_CONFIG = {
  timeoutMs: 15000,
  targetUrl: 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play',
  autoModeStorageKey: 'hero_kadan_rpg_auto_mode',
} as const;

export const TOP_NAV_ITEMS = ['홈', '마이덱', '플레이', '미션', '상점', '쇼핑몰'] as const;
export const SIDE_NAV_ITEMS = ['로그인', '홈', '마이덱', '플레이', '미션', '상점', '쇼핑몰', '커뮤니티'] as const;

export const SHOP_8_ITEMS = [
  '일반 카드팩',
  '매직 카드팩',
  '희귀 카드팩',
  '아이템 팩',
  '광고 제거',
  '공식 소설',
  '공식 동영상',
  '코인 충전',
] as const;

export const EXTERNAL_LINKS = {
  naverNovel: 'http://novel.naver.com/challenge/list?novelId=1250635',
  naverWebtoon: 'https://comic.naver.com/challenge/list?titleId=856677',
  munpiaNovel: 'https://nlink.munpia.com/link/munpia/novel/616551',
  badgeText: '절찬 연재중',
} as const;

export interface PackRevealCard {
  cardId: number;
  nameKo: string;
  nameEn: string;
  rarity: 'Bronze' | 'Silver' | 'Gold' | 'Boss';
  faction: string;
  power: number;
}

export interface CurrencyBalanceState {
  sns: number;          // hero_sns
  earnedSns: number;    // hero_earned_sns
  purchasedSns: number; // hero_purchased_sns
  gold: number;         // hero_gold
}

export interface AdSensePlacementResult {
  desktopLeft: boolean;
  desktopRight: boolean;
  mobileTop: boolean;
  suppressedByVip: boolean;
}
