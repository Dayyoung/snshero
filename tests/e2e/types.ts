/**
 * Types and interfaces for SNSHero Independent Static Landing & /home Decoupling E2E Test Suite.
 */

export type TestStatus = 'PASS' | 'FAIL' | 'WARN';
export type MilestoneType = 'M1' | 'M2' | 'M3' | 'M4' | 'ALL';

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
  getDeckTP: () => number;
  getTotalTP: () => number;
  nurtureCard: (cardId: number) => { expGained: number; leveledUp: boolean; newLevel: number };
  allocateStat: (cardId: number, direction: 'top' | 'right' | 'bottom' | 'left') => boolean;
  hasUnspentPoints: (cardId: number) => boolean;
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

export type ViewKey = 'home' | 'deck' | 'play' | 'card' | 'shop';
export type ModalKey = 'mall' | 'community' | 'login' | null;

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
