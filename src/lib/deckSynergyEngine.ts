/**
 * Deck Synergy Engine (deckSynergyEngine.ts)
 * 5종 속성(Water, Fire, Air, Earth, Holy/Undead) 및 종족 세트 보너스 계산 및 1탭 최적 시너지 덱 추천 알고리즘
 */

import { CardData } from '../types';
import { CARD_DATABASE } from '../cardDatabase';

export interface SynergyBonus {
  element: string;
  nameKo: string;
  nameEn: string;
  count: number;
  tier: 1 | 2 | 3; // 2세트, 3세트, 4세트+
  bonusPower: number;
  bonusHp: number;
  descriptionKo: string;
  descriptionEn: string;
  color: string;
  badgeStyle: string;
}

export interface DeckSynergyAnalysis {
  activeSynergies: SynergyBonus[];
  totalBonusPower: number;
  totalBonusHp: number;
  elementCounts: Record<string, number>;
  synergyScore: number;
}

export const ELEMENT_SYNERGY_INFO: Record<string, { nameKo: string; nameEn: string; color: string; badgeStyle: string }> = {
  water: {
    nameKo: '수류(Water) 결속',
    nameEn: 'Tidal Flow',
    color: '#06b6d4',
    badgeStyle: 'bg-cyan-950/80 border-cyan-500 text-cyan-300',
  },
  fire: {
    nameKo: '화염(Fire) 분노',
    nameEn: 'Blazing Fury',
    color: '#f43f5e',
    badgeStyle: 'bg-rose-950/80 border-rose-500 text-rose-300',
  },
  air: {
    nameKo: '질풍(Wind/Air) 가속',
    nameEn: 'Gale Swiftness',
    color: '#38bdf8',
    badgeStyle: 'bg-sky-950/80 border-sky-500 text-sky-300',
  },
  wind: {
    nameKo: '질풍(Wind) 가속',
    nameEn: 'Gale Swiftness',
    color: '#38bdf8',
    badgeStyle: 'bg-sky-950/80 border-sky-500 text-sky-300',
  },
  earth: {
    nameKo: '대지(Earth) 수호',
    nameEn: 'Earthen Bastion',
    color: '#f59e0b',
    badgeStyle: 'bg-amber-950/80 border-amber-500 text-amber-300',
  },
  land: {
    nameKo: '대지(Land) 수호',
    nameEn: 'Earthen Bastion',
    color: '#f59e0b',
    badgeStyle: 'bg-amber-950/80 border-amber-500 text-amber-300',
  },
  holy: {
    nameKo: '성휘(Holy/Dragon) 축복',
    nameEn: 'Divine Blessing',
    color: '#eab308',
    badgeStyle: 'bg-yellow-950/80 border-yellow-500 text-yellow-300',
  },
  dragon: {
    nameKo: '용혈(Dragon) 각성',
    nameEn: 'Draconic Surge',
    color: '#eab308',
    badgeStyle: 'bg-yellow-950/80 border-yellow-500 text-yellow-300',
  },
  undead: {
    nameKo: '암영(Undead/Shadow) 강령',
    nameEn: 'Shadow Dominion',
    color: '#a855f7',
    badgeStyle: 'bg-purple-950/80 border-purple-500 text-purple-300',
  },
  monster: {
    nameKo: '마수(Monster) 야성',
    nameEn: 'Beast Ferocity',
    color: '#a855f7',
    badgeStyle: 'bg-purple-950/80 border-purple-500 text-purple-300',
  },
};

/**
 * 덱에 편성된 카드들의 속성/종족 시너지 세트 보너스 정밀 분석
 */
export function analyzeDeckSynergy(deck: CardData[]): DeckSynergyAnalysis {
  const elementCounts: Record<string, number> = {};

  deck.forEach((card) => {
    const elem = (card.element || (card as any).species || 'neutral').toLowerCase();
    elementCounts[elem] = (elementCounts[elem] || 0) + 1;
  });

  const activeSynergies: SynergyBonus[] = [];
  let totalBonusPower = 0;
  let totalBonusHp = 0;

  Object.entries(elementCounts).forEach(([elem, count]) => {
    if (count >= 2 && elem !== 'neutral') {
      const info = ELEMENT_SYNERGY_INFO[elem] || {
        nameKo: `${elem.toUpperCase()} 결속`,
        nameEn: `${elem.toUpperCase()} Bond`,
        color: '#64748b',
        badgeStyle: 'bg-slate-900 border-slate-500 text-slate-300',
      };

      const tier: 1 | 2 | 3 = count >= 4 ? 3 : count === 3 ? 2 : 1;
      const bonusPower = tier === 3 ? 35 : tier === 2 ? 20 : 10;
      const bonusHp = tier === 3 ? 60 : tier === 2 ? 35 : 15;

      totalBonusPower += bonusPower;
      totalBonusHp += bonusHp;

      activeSynergies.push({
        element: elem,
        nameKo: info.nameKo,
        nameEn: info.nameEn,
        count,
        tier,
        bonusPower,
        bonusHp,
        descriptionKo: `${count}세트 활성화: 전장 공격력 +${bonusPower}, 체력 +${bonusHp}`,
        descriptionEn: `${count}-Set Active: Attack +${bonusPower}, HP +${bonusHp}`,
        color: info.color,
        badgeStyle: info.badgeStyle,
      });
    }
  });

  const synergyScore = totalBonusPower * 2 + totalBonusHp + activeSynergies.length * 15;

  return {
    activeSynergies,
    totalBonusPower,
    totalBonusHp,
    elementCounts,
    synergyScore,
  };
}

/**
 * 보유 카드 인벤토리로부터 1탭 최적 시너지 덱 자동 완성 알고리즘
 */
export function buildOptimalSynergyDeck(inventory: CardData[], targetSize: number = 8): CardData[] {
  if (!inventory || inventory.length === 0) return [];
  if (inventory.length <= targetSize) return [...inventory];

  // 속성별 카드 그룹화
  const groups: Record<string, CardData[]> = {};
  inventory.forEach((card) => {
    const elem = (card.element || 'neutral').toLowerCase();
    if (!groups[elem]) groups[elem] = [];
    groups[elem].push(card);
  });

  // 각 그룹 내에서 전투력 높은 순 정렬
  Object.values(groups).forEach((list) => {
    list.sort((a, b) => ((b as any).power || (b as any).totalPower || 0) - ((a as any).power || (a as any).totalPower || 0));
  });

  // 가장 카드가 많고 강한 주력 1~2개 속성 선정
  const sortedElems = Object.keys(groups).sort((a, b) => {
    const lenA = groups[a].length;
    const lenB = groups[b].length;
    if (lenA !== lenB) return lenB - lenA;
    const sumPowerA = groups[a].reduce((acc, c) => acc + ((c as any).power || 0), 0);
    const sumPowerB = groups[b].reduce((acc, c) => acc + ((c as any).power || 0), 0);
    return sumPowerB - sumPowerA;
  });

  const optimalDeck: CardData[] = [];
  const pickedIds = new Set<string>();

  // 1순위: 주력 속성 상위 카드 채우기
  for (const elem of sortedElems) {
    for (const card of groups[elem]) {
      if (optimalDeck.length < targetSize && !pickedIds.has(card.id)) {
        optimalDeck.push(card);
        pickedIds.add(card.id);
      }
    }
    if (optimalDeck.length >= targetSize) break;
  }

  // 부족분은 전체 인벤토리 중 최고 전투력 카드 순으로 채움
  if (optimalDeck.length < targetSize) {
    const sortedAll = [...inventory].sort((a, b) => ((b as any).power || 0) - ((a as any).power || 0));
    for (const card of sortedAll) {
      if (optimalDeck.length < targetSize && !pickedIds.has(card.id)) {
        optimalDeck.push(card);
        pickedIds.add(card.id);
      }
    }
  }

  return optimalDeck;
}
