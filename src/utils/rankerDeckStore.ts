/**
 * rankerDeckStore.ts
 * 모험가 명예의 전당 랭커 덱 1클릭 복제 시뮬레이션 및 바이럴 공유 관리 스토어 (RSI-023)
 */

import { CardData } from '../types';
import { CARD_DATABASE } from '../cardDatabase';

export interface MirroredRankerDeck {
  rankerName: string;
  rank: number;
  totalPower: number;
  winRate: number;
  deck: CardData[];
  copiedAt: number;
  expiresAt: number; // 24시간 가상 체험
}

const STORAGE_KEY = 'hero_mirrored_ranker_deck';

export function getMirroredDeck(): MirroredRankerDeck | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: MirroredRankerDeck = JSON.parse(raw);
    if (Date.now() > data.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function saveMirroredDeck(
  rankerName: string,
  rank: number,
  totalPower: number,
  winRate: number,
  deck: CardData[]
): MirroredRankerDeck {
  const now = Date.now();
  const mirrored: MirroredRankerDeck = {
    rankerName,
    rank,
    totalPower,
    winRate,
    deck,
    copiedAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000 // 24시간
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mirrored));
  return mirrored;
}

export function clearMirroredDeck(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 랭커 덱 카드 ID 목록을 URL 파라미터로 인코딩
 */
export function generateDuelMirrorUrl(rankerName: string, rank: number, deck: CardData[]): string {
  const cardIds = deck.map(c => c.id).join(',');
  const encodedName = encodeURIComponent(rankerName);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://snshero.com';
  return `${baseUrl}?duel_mirror=1&ranker=${encodedName}&rank=${rank}&cards=${cardIds}`;
}

/**
 * URL 파라미터에서 duel_mirror 정보 파싱
 */
export function parseDuelMirrorParams(): { rankerName: string; rank: number; cards: CardData[] } | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (!params.get('duel_mirror')) return null;

  const rankerName = decodeURIComponent(params.get('ranker') || 'TopRanker');
  const rank = parseInt(params.get('rank') || '1', 10);
  const cardIdsStr = params.get('cards') || '';
  const cardIds = cardIdsStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));

  const cards: CardData[] = cardIds.map(id => {
    return (CARD_DATABASE[id] as unknown as CardData) || ({
      id: String(id),
      name: `Hero #${id}`,
      power: 8,
      element: 'FIRE'
    } as unknown as CardData);
  });

  if (cards.length === 0) return null;
  return { rankerName, rank, cards };
}
