/**
 * src/landing/types.ts
 *
 * Core types, interface contracts, and constants for SNSHero Static Landing.
 */

export type ViewKey = 'home' | 'deck' | 'play' | 'card' | 'shop';
export type ModalKey = 'mall' | 'community' | 'login' | null;

export const TOP_NAV_ITEMS = ['홈', '마이덱', '플레이', '미션', '상점', '쇼핑몰'] as const;
export const SIDE_NAV_ITEMS = ['로그인', '홈', '마이덱', '플레이', '미션', '상점', '쇼핑몰', '커뮤니티'] as const;

export const EXTERNAL_LINKS = {
  naverNovel: 'http://novel.naver.com/challenge/list?novelId=1250635',
  naverWebtoon: 'https://comic.naver.com/challenge/list?titleId=856677',
  munpiaNovel: 'https://nlink.munpia.com/link/munpia/novel/616551',
  badgeText: '절찬 연재중',
} as const;

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
