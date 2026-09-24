/**
 * rankingOpponents.ts
 * 랭킹 대전 및 라이벌 매칭 가상 상대 풀 및 추천 알고리즘
 */

export interface RankOpponentInfo {
  id: string;
  name: string;
  totalPower: number;
  tier: string;
  avatar: string;
  winRate: number;
  deckCount?: number;
}

const OPPONENT_POOL: RankOpponentInfo[] = [
  { id: 'opp-1', name: '질풍의_아케인', totalPower: 4250, tier: 'Diamond II', avatar: '🌪️', winRate: 68.4, deckCount: 5 },
  { id: 'opp-2', name: '심연의_리바이어', totalPower: 3980, tier: 'Platinum I', avatar: '🌊', winRate: 62.1, deckCount: 5 },
  { id: 'opp-3', name: '염화의_드래고니안', totalPower: 4520, tier: 'Diamond I', avatar: '🔥', winRate: 71.5, deckCount: 5 },
  { id: 'opp-4', name: '영혼파쇄자_카단', totalPower: 4100, tier: 'Platinum I', avatar: '⚔️', winRate: 64.8, deckCount: 5 },
  { id: 'opp-5', name: '성스러운_발키리', totalPower: 4380, tier: 'Diamond II', avatar: '✨', winRate: 69.2, deckCount: 5 },
  { id: 'opp-6', name: '어둠의_쉐도우팽', totalPower: 3850, tier: 'Gold I', avatar: '🌑', winRate: 58.7, deckCount: 5 },
  { id: 'opp-7', name: '대지진의_타이탄', totalPower: 4460, tier: 'Diamond I', avatar: '⛰️', winRate: 70.0, deckCount: 5 },
  { id: 'opp-8', name: '비전마도사_루나', totalPower: 4020, tier: 'Platinum II', avatar: '🔮', winRate: 63.3, deckCount: 5 },
];

export function pickNewRankOpponent(previousOpponentName?: string | null): RankOpponentInfo {
  const filtered = previousOpponentName
    ? OPPONENT_POOL.filter(o => o.name !== previousOpponentName)
    : OPPONENT_POOL;

  const candidates = filtered.length > 0 ? filtered : OPPONENT_POOL;
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  return picked;
}

export function getAllOpponents(): RankOpponentInfo[] {
  return OPPONENT_POOL;
}

export default pickNewRankOpponent;
