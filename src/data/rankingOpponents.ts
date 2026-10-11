/**
 * rankingOpponents.ts
 * 랭킹 대전 및 라이벌 매칭 가상 상대 풀 및 전적 기반 추천 알고리즘
 */

import { getDynamicDifficultyProfile, DynamicDifficultyProfile } from '../lib/dynamicDifficulty';

export interface RankOpponentInfo {
  id: string;
  name: string;
  totalPower: number;
  tier: string;
  avatar: string;
  winRate: number;
  deckCount?: number;
  difficultyBadge?: string;
  difficultyLabel?: string;
}

// 브론즈부터 다이아몬드까지 세분화된 상대 풀 (초보자 ~ 랭커 대응)
const OPPONENT_POOL: RankOpponentInfo[] = [
  // ─── Bronze 티어 (초보자 & 연패 구제용: 600 ~ 1350) ───
  { id: 'opp-b1', name: '초심자_슬라임냥', totalPower: 680, tier: 'Bronze III', avatar: '🌱', winRate: 34.2, deckCount: 5 },
  { id: 'opp-b2', name: '견습카드러너', totalPower: 850, tier: 'Bronze III', avatar: '🐣', winRate: 38.5, deckCount: 5 },
  { id: 'opp-b3', name: '방랑자_고블린', totalPower: 1050, tier: 'Bronze II', avatar: '🍂', winRate: 42.1, deckCount: 5 },
  { id: 'opp-b4', name: '모험의_첫걸음', totalPower: 1220, tier: 'Bronze I', avatar: '🐾', winRate: 45.0, deckCount: 5 },

  // ─── Silver 티어 (입문 안정 매칭용: 1400 ~ 2600) ───
  { id: 'opp-s1', name: '수습마법사_로키', totalPower: 1480, tier: 'Silver III', avatar: '🪄', winRate: 48.2, deckCount: 5 },
  { id: 'opp-s2', name: '바람숲_궁수', totalPower: 1750, tier: 'Silver II', avatar: '🏹', winRate: 50.4, deckCount: 5 },
  { id: 'opp-s3', name: '강철방패_가디언', totalPower: 2100, tier: 'Silver II', avatar: '🛡️', winRate: 51.9, deckCount: 5 },
  { id: 'opp-s4', name: '청동의_기사단', totalPower: 2450, tier: 'Silver I', avatar: '🗡️', winRate: 53.7, deckCount: 5 },

  // ─── Gold 티어 (중급 라이벌: 2700 ~ 3700) ───
  { id: 'opp-g1', name: '화염술사_이그니스', totalPower: 2850, tier: 'Gold III', avatar: '🔥', winRate: 55.3, deckCount: 5 },
  { id: 'opp-g2', name: '빙결의_엘프', totalPower: 3200, tier: 'Gold II', avatar: '❄️', winRate: 56.8, deckCount: 5 },
  { id: 'opp-g3', name: '어둠의_쉐도우팽', totalPower: 3550, tier: 'Gold I', avatar: '🌑', winRate: 58.7, deckCount: 5 },

  // ─── Platinum 티어 (상급 라이벌: 3800 ~ 4300) ───
  { id: 'opp-p1', name: '심연의_리바이어', totalPower: 3880, tier: 'Platinum II', avatar: '🌊', winRate: 61.2, deckCount: 5 },
  { id: 'opp-p2', name: '비전마도사_루나', totalPower: 4020, tier: 'Platinum II', avatar: '🔮', winRate: 63.3, deckCount: 5 },
  { id: 'opp-p3', name: '영혼파쇄자_카단', totalPower: 4180, tier: 'Platinum I', avatar: '⚔️', winRate: 64.8, deckCount: 5 },

  // ─── Diamond 티어 (최상위권 강적: 4400 ~ 5200) ───
  { id: 'opp-d1', name: '질풍의_아케인', totalPower: 4450, tier: 'Diamond II', avatar: '🌪️', winRate: 67.4, deckCount: 5 },
  { id: 'opp-d2', name: '성스러운_발키리', totalPower: 4680, tier: 'Diamond II', avatar: '✨', winRate: 69.2, deckCount: 5 },
  { id: 'opp-d3', name: '대지진의_타이탄', totalPower: 4890, tier: 'Diamond I', avatar: '⛰️', winRate: 70.0, deckCount: 5 },
  { id: 'opp-d4', name: '염화의_드래고니안', totalPower: 5120, tier: 'Diamond I', avatar: '🐲', winRate: 72.5, deckCount: 5 },
];

/**
 * 유저 전적(DDA)과 총 전투력을 반영하여 최적의 상대를 추천/선택
 */
export function pickNewRankOpponent(
  previousOpponentName?: string | null,
  playerPower?: number,
  customProfile?: DynamicDifficultyProfile
): RankOpponentInfo {
  const profile = customProfile || getDynamicDifficultyProfile(playerPower);
  const basePower = playerPower && playerPower > 0 ? playerPower : 1500;

  // 1. DDA 난이도 프로필에 따른 목표 전투력 산출
  const mult = profile.powerMultiplierMin + Math.random() * (profile.powerMultiplierMax - profile.powerMultiplierMin);
  const targetPower = Math.round(basePower * mult);

  // 2. 직전 상대를 제외한 후보군
  const pool = previousOpponentName
    ? OPPONENT_POOL.filter(o => o.name !== previousOpponentName)
    : OPPONENT_POOL;
  const candidates = pool.length > 0 ? pool : OPPONENT_POOL;

  // 3. 목표 전투력과의 차이가 가장 적은 상위 3명 중 무작위 1명 선택 (다양성 확보)
  const sorted = [...candidates].sort((a, b) => {
    const diffA = Math.abs(a.totalPower - targetPower);
    const diffB = Math.abs(b.totalPower - targetPower);
    return diffA - diffB;
  });

  const bestCandidates = sorted.slice(0, Math.min(3, sorted.length));
  const picked = bestCandidates[Math.floor(Math.random() * bestCandidates.length)];

  // 4. 유저의 전적(DDA)에 맞게 상대의 실제 총 전투력도 목표 전투력 범위로 자연스럽게 동기화
  const finalPower = Math.max(500, Math.round(targetPower * (0.96 + Math.random() * 0.08)));

  return {
    ...picked,
    totalPower: finalPower,
    difficultyBadge: profile.badgeColor,
    difficultyLabel: profile.labelKo,
  };
}

export function getAllOpponents(): RankOpponentInfo[] {
  return OPPONENT_POOL;
}

export default pickNewRankOpponent;
