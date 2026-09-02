/**
 * cardSynergyBurstEngine.ts
 * 전 플랫폼 카드 시너지 도감 연동 및 대전 중 '연쇄 시너지 버스트(Synergy Burst)' 연출 & 전용 아우라 이펙트
 * (구글 스프레드시트 Row 776 / ID 565 요구사항 구현)
 */

import { CardData } from '../types';
import { getNormalizedElement } from '../constants';

export interface SynergyBurstState {
  isActive: boolean;
  element: string;
  count: number;
  burstTitleKo: string;
  burstTitleEn: string;
  bonusCapturePower: number;
  auraCss: string;
  glowColor: string;
  activatedTimestamp: number;
}

export const ELEMENT_BURST_CONFIG: Record<
  string,
  {
    nameKo: string;
    nameEn: string;
    auraCss: string;
    glowColor: string;
    bonusPower: number;
  }
> = {
  water: {
    nameKo: '💧 해일 연쇄 버스트 (Tidal Surge)',
    nameEn: '💧 Tidal Surge Burst',
    auraCss: 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)] bg-cyan-950/40',
    glowColor: '#06b6d4',
    bonusPower: 30,
  },
  fire: {
    nameKo: '🔥 화염 폭발 버스트 (Blazing Eruption)',
    nameEn: '🔥 Blazing Eruption Burst',
    auraCss: 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.8)] bg-rose-950/40',
    glowColor: '#f43f5e',
    bonusPower: 35,
  },
  wind: {
    nameKo: '🌪️ 폭풍 가속 버스트 (Gale Tempest)',
    nameEn: '🌪️ Gale Tempest Burst',
    auraCss: 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.8)] bg-emerald-950/40',
    glowColor: '#10b981',
    bonusPower: 25,
  },
  air: {
    nameKo: '🌪️ 폭풍 가속 버스트 (Gale Tempest)',
    nameEn: '🌪️ Gale Tempest Burst',
    auraCss: 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.8)] bg-emerald-950/40',
    glowColor: '#10b981',
    bonusPower: 25,
  },
  earth: {
    nameKo: '⛰️ 대지 분쇄 버스트 (Tectonic Quake)',
    nameEn: '⛰️ Tectonic Quake Burst',
    auraCss: 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.8)] bg-amber-950/40',
    glowColor: '#f59e0b',
    bonusPower: 28,
  },
  holy: {
    nameKo: '✦ 성광 축복 버스트 (Celestial Ray)',
    nameEn: '✦ Celestial Ray Burst',
    auraCss: 'border-yellow-300 shadow-[0_0_25px_rgba(253,224,71,0.9)] bg-yellow-950/40',
    glowColor: '#fde047',
    bonusPower: 40,
  },
  dragon: {
    nameKo: '🐲 용혈 각성 버스트 (Draconic Roar)',
    nameEn: '🐲 Draconic Roar Burst',
    auraCss: 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.9)] bg-amber-950/40',
    glowColor: '#fbbf24',
    bonusPower: 45,
  },
  undead: {
    nameKo: '💀 암영 강령 버스트 (Nether Dominion)',
    nameEn: '💀 Nether Dominion Burst',
    auraCss: 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)] bg-purple-950/40',
    glowColor: '#a855f7',
    bonusPower: 35,
  },
  monster: {
    nameKo: '🐾 야성 폭주 버스트 (Primal Frenzy)',
    nameEn: '🐾 Primal Frenzy Burst',
    auraCss: 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.8)] bg-orange-950/40',
    glowColor: '#f97316',
    bonusPower: 32,
  },
};

/**
 * 3x3 배틀 필드 또는 덱에서 동일 원소 3장 이상 배치 시 연쇄 시너지 버스트 감지
 */
export function detectSynergyBurst(cards: CardData[]): SynergyBurstState | null {
  if (!cards || cards.length < 3) return null;

  const counts: Record<string, number> = {};
  cards.forEach((card) => {
    const elem = getNormalizedElement(card).toLowerCase();
    if (elem && elem !== 'neutral') {
      counts[elem] = (counts[elem] || 0) + 1;
    }
  });

  // 3장 이상 가장 많은 원소 탐색
  let highestElem = '';
  let maxCount = 0;
  Object.entries(counts).forEach(([elem, cnt]) => {
    if (cnt >= 3 && cnt > maxCount) {
      maxCount = cnt;
      highestElem = elem;
    }
  });

  if (!highestElem || maxCount < 3) {
    return null;
  }

  const config = ELEMENT_BURST_CONFIG[highestElem] || {
    nameKo: `⚡ ${highestElem.toUpperCase()} 연쇄 버스트`,
    nameEn: `⚡ ${highestElem.toUpperCase()} Chain Burst`,
    auraCss: 'border-slate-300 shadow-[0_0_15px_rgba(255,255,255,0.7)] bg-slate-900/40',
    glowColor: '#ffffff',
    bonusPower: 20,
  };

  return {
    isActive: true,
    element: highestElem,
    count: maxCount,
    burstTitleKo: config.nameKo,
    burstTitleEn: config.nameEn,
    bonusCapturePower: config.bonusPower + (maxCount - 3) * 10,
    auraCss: config.auraCss,
    glowColor: config.glowColor,
    activatedTimestamp: Date.now(),
  };
}
