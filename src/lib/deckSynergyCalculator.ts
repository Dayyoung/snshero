/**
 * deckSynergyCalculator.ts
 * 마이덱 카드 속성 및 진영(Faction) 실시간 '엘리멘탈 레조넌스' 세트 효과 및 듀얼 원소 공명 계산기
 * (구글 스프레드시트 Row 965, Row 1033 / ID 553 요구사항 통합 구현)
 */

import { CardData, CardElement } from '../types';

export interface SynergyBonus {
  element: string;
  name_ko: string;
  name_en: string;
  count: number;
  bonusPower: number;
  bonusPercent: number;
  badge: string;
  color: string;
}

export interface SynergyBadge {
  id: string;
  nameKo: string;
  nameEn: string;
  type: 'mono' | 'rainbow' | 'faction' | 'duo';
  buffDesc: string;
  color: string;
  glowEffect: string;
}

export interface DeckSynergyCalculation {
  totalCards: number;
  monoElement: {
    element: CardElement | null;
    count: number;
    bonusAtkPct: number;
  };
  isRainbowHarmony: boolean;
  rainbowStatBonusPct: number;
  factionBonds: {
    faction: string;
    count: number;
    bonusHpPct: number;
  }[];
  activeBadges: SynergyBadge[];
  netAtkModifierPct: number;
  netHpModifierPct: number;
  netDefModifierPct: number;
  legacyBonuses: SynergyBonus[];
}

export interface DualResonanceSynergy {
  id: string;
  nameKo: string;
  nameEn: string;
  elements: [string, string];
  buffKo: string;
  buffEn: string;
  atkMultiplier: number;
  defMultiplier: number;
  specialEffectKo: string;
  specialEffectEn: string;
  auraBorderClass: string;
}

export const DUAL_RESONANCE_DEFINITIONS: DualResonanceSynergy[] = [
  {
    id: 'steam_burst',
    nameKo: '증기 폭발 (Steam Burst)',
    nameEn: 'Steam Burst',
    elements: ['water', 'fire'],
    buffKo: '공격력 +15% & 화상 연소 피해',
    buffEn: 'ATK +15% & Burn Damage',
    atkMultiplier: 1.15,
    defMultiplier: 1.0,
    specialEffectKo: '공격 시 3초간 대상 방어력 10% 감소',
    specialEffectEn: 'Target DEF -10% for 3s on hit',
    auraBorderClass: 'ring-2 ring-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.7)] animate-pulse',
  },
  {
    id: 'sandstorm_vortex',
    nameKo: '모래폭풍 와류 (Sandstorm Vortex)',
    nameEn: 'Sandstorm Vortex',
    elements: ['earth', 'wind'],
    buffKo: '방어력 +15% & 적 명중률 -15%',
    buffEn: 'DEF +15% & Enemy Accuracy -15%',
    atkMultiplier: 1.0,
    defMultiplier: 1.15,
    specialEffectKo: '전체 아군 회피율 10% 상승',
    specialEffectEn: 'All allies +10% evasion',
    auraBorderClass: 'ring-2 ring-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.7)] animate-pulse',
  },
  {
    id: 'heatwave_tempest',
    nameKo: '열풍 화염폭풍 (Heatwave Tempest)',
    nameEn: 'Heatwave Tempest',
    elements: ['fire', 'wind'],
    buffKo: '치명타율 +20% & 공격속도 +15%',
    buffEn: 'CRIT Rate +20% & ASPD +15%',
    atkMultiplier: 1.20,
    defMultiplier: 1.0,
    specialEffectKo: '치명타 적중 시 인접 적에게 50% 스플래시',
    specialEffectEn: '50% splash damage to nearby foes on crit',
    auraBorderClass: 'ring-2 ring-red-500 shadow-[0_0_14px_rgba(239,68,68,0.75)] animate-pulse',
  },
  {
    id: 'quake_mire_shield',
    nameKo: '대지 수류 철벽 (Quake Shield)',
    nameEn: 'Quake Mire Shield',
    elements: ['water', 'earth'],
    buffKo: '최대 HP 실드 +20% & 감속 둔화',
    buffEn: 'Max HP Shield +20% & Slow',
    atkMultiplier: 1.0,
    defMultiplier: 1.20,
    specialEffectKo: '피격 시 받은 피해의 15% 반사',
    specialEffectEn: 'Reflect 15% damage taken',
    auraBorderClass: 'ring-2 ring-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.7)] animate-pulse',
  },
  {
    id: 'chaos_eclipse',
    nameKo: '혼돈의 일식 (Chaos Eclipse)',
    nameEn: 'Chaos Eclipse',
    elements: ['light', 'dark'],
    buffKo: '체인 캡처 스플래시 데미지 +25%',
    buffEn: 'Chain Capture Splash DMG +25%',
    atkMultiplier: 1.25,
    defMultiplier: 1.10,
    specialEffectKo: '카드 캡처 시 연쇄 폭발 발생',
    specialEffectEn: 'Chain explosions on card capture',
    auraBorderClass: 'ring-2 ring-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-pulse',
  },
];

export interface ResonanceEvaluationResult {
  activeResonances: DualResonanceSynergy[];
  totalAtkMultiplier: number;
  totalDefMultiplier: number;
  elementCounts: Record<string, number>;
  primaryResonanceTitle: string;
}

export class DeckSynergyCalculator {
  private static instance: DeckSynergyCalculator;

  private constructor() {}

  public static getInstance(): DeckSynergyCalculator {
    if (!DeckSynergyCalculator.instance) {
      DeckSynergyCalculator.instance = new DeckSynergyCalculator();
    }
    return DeckSynergyCalculator.instance;
  }

  /**
   * 5장 덱의 실시간 속성/진영 시너지 세트 효과 계산 (기존 컴포넌트 호환)
   */
  public calculateSynergy(deck: (CardData | null | undefined)[]): DeckSynergyCalculation {
    const cards = deck.filter((c): c is CardData => Boolean(c));
    const elementCounts: Partial<Record<CardElement, number>> = {};
    const factionCounts: Record<string, number> = {};

    cards.forEach((c) => {
      if (c.element) {
        elementCounts[c.element] = (elementCounts[c.element] || 0) + 1;
      }
      const faction = (c.race || (c as { faction?: string }).faction || 'wanderer').toLowerCase();
      factionCounts[faction] = (factionCounts[faction] || 0) + 1;
    });

    const activeBadges: SynergyBadge[] = [];
    const legacyBonuses: SynergyBonus[] = [];
    let netAtk = 0;
    let netHp = 0;
    let netDef = 0;

    // 1. 모노 엘리멘탈 (동일 속성 집중)
    let dominantElem: CardElement | null = null;
    let maxElemCount = 0;

    Object.entries(elementCounts).forEach(([elem, count]) => {
      if (count && count > maxElemCount) {
        maxElemCount = count;
        dominantElem = elem as CardElement;
      }
    });

    let monoAtkBonus = 0;
    if (dominantElem && maxElemCount >= 3) {
      monoAtkBonus = maxElemCount >= 5 ? 25 : 10;
      netAtk += monoAtkBonus;

      activeBadges.push({
        id: `mono_${dominantElem}`,
        nameKo: `[단일원소 극대화] ${dominantElem.toUpperCase()} (${maxElemCount}장)`,
        nameEn: `Mono ${dominantElem.toUpperCase()} Surge`,
        type: 'mono',
        buffDesc: `공격력 +${monoAtkBonus}%`,
        color: this.getElementColor(dominantElem),
        glowEffect: 'shadow-[0_0_12px_rgba(239,68,68,0.5)]',
      });

      legacyBonuses.push({
        element: dominantElem,
        name_ko: dominantElem.toUpperCase(),
        name_en: dominantElem.toUpperCase(),
        count: maxElemCount,
        bonusPower: monoAtkBonus * 10,
        bonusPercent: monoAtkBonus,
        badge: '⚡',
        color: 'border-red-500 bg-red-500/10 text-red-500',
      });
    }

    // 2. 레인보우 하모니 (5종의 서로 다른 고유 원소 조합)
    const distinctElemCount = Object.keys(elementCounts).length;
    const isRainbowHarmony = cards.length >= 5 && distinctElemCount >= 5;
    let rainbowBonus = 0;

    if (isRainbowHarmony) {
      rainbowBonus = 5;
      netAtk += rainbowBonus;
      netHp += rainbowBonus;
      netDef += rainbowBonus;

      activeBadges.push({
        id: 'rainbow_harmony',
        nameKo: '[초월] 5속성 무지개 하모니',
        nameEn: '5-Element Rainbow Harmony',
        type: 'rainbow',
        buffDesc: '전체 능력치 +5% & 원소 초월 오라',
        color: '#a855f7',
        glowEffect: 'shadow-[0_0_15px_rgba(168,85,247,0.6)]',
      });

      legacyBonuses.push({
        element: 'rainbow',
        name_ko: '무지개',
        name_en: 'Rainbow',
        count: 5,
        bonusPower: 50,
        bonusPercent: 5,
        badge: '🌈',
        color: 'border-purple-500 bg-purple-500/10 text-purple-500',
      });
    }

    // 3. 팩션 본드 (진영/종족 결속)
    const factionBonds: { faction: string; count: number; bonusHpPct: number }[] = [];
    Object.entries(factionCounts).forEach(([fac, count]) => {
      if (count >= 2 && fac !== 'wanderer') {
        const hpBonus = count >= 4 ? 20 : 10;
        netHp += hpBonus;
        factionBonds.push({ faction: fac, count, bonusHpPct: hpBonus });

        activeBadges.push({
          id: `faction_${fac}`,
          nameKo: `[진영 결속] ${fac.toUpperCase()} (${count}장)`,
          nameEn: `${fac.toUpperCase()} Faction Bond`,
          type: 'faction',
          buffDesc: `생명력 +${hpBonus}%`,
          color: '#3b82f6',
          glowEffect: 'shadow-[0_0_10px_rgba(59,130,246,0.5)]',
        });
      }
    });

    return {
      totalCards: cards.length,
      monoElement: {
        element: dominantElem,
        count: maxElemCount,
        bonusAtkPct: monoAtkBonus,
      },
      isRainbowHarmony,
      rainbowStatBonusPct: rainbowBonus,
      factionBonds,
      activeBadges,
      netAtkModifierPct: netAtk,
      netHpModifierPct: netHp,
      netDefModifierPct: netDef,
      legacyBonuses,
    };
  }

  /**
   * 5장 덱 내 원소 분포 분석 및 발동 중인 듀얼 공명 시너지 계산 (Row 1033 / ID 553 신규)
   */
  public evaluateDeckResonance(deck: (CardData | null | undefined)[]): ResonanceEvaluationResult {
    const validCards = deck.filter((c): c is CardData => !!c);
    const elementCounts: Record<string, number> = {};

    validCards.forEach((c) => {
      const el = (c.element || 'neutral').toLowerCase();
      elementCounts[el] = (elementCounts[el] || 0) + 1;
    });

    const activeResonances: DualResonanceSynergy[] = [];
    let totalAtk = 1.0;
    let totalDef = 1.0;

    DUAL_RESONANCE_DEFINITIONS.forEach((syn) => {
      const [el1, el2] = syn.elements;
      const count1 = elementCounts[el1] || 0;
      const count2 = elementCounts[el2] || 0;

      // 두 원소가 각각 1장 이상 존재하면 듀얼 공명 발동
      if (count1 >= 1 && count2 >= 1) {
        activeResonances.push(syn);
        totalAtk *= syn.atkMultiplier;
        totalDef *= syn.defMultiplier;
      }
    });

    const primaryTitle = activeResonances.length > 0
      ? activeResonances.map(r => r.nameKo).join(' + ')
      : '일반 공명 (균형형)';

    return {
      activeResonances,
      totalAtkMultiplier: Math.round(totalAtk * 100) / 100,
      totalDefMultiplier: Math.round(totalDef * 100) / 100,
      elementCounts,
      primaryResonanceTitle: primaryTitle,
    };
  }

  /**
   * 특정 카드에 적용할 발광 원소 오라 테두리 클래스 반환
   */
  public getCardAuraClass(
    card: CardData | null | undefined,
    deck: (CardData | null | undefined)[]
  ): string {
    if (!card || !card.element) return '';
    const el = card.element.toLowerCase();
    const { activeResonances } = this.evaluateDeckResonance(deck);

    for (const res of activeResonances) {
      if (res.elements.includes(el)) {
        return res.auraBorderClass;
      }
    }
    return '';
  }

  private getElementColor(elem: CardElement): string {
    switch (elem) {
      case 'fire':
        return '#ef4444';
      case 'water':
        return '#3b82f6';
      case 'earth':
      case 'land':
        return '#10b981';
      case 'wind':
      case 'air':
        return '#06b6d4';
      case 'dragon':
        return '#8b5cf6';
      case 'robot':
        return '#64748b';
      default:
        return '#f59e0b';
    }
  }
}
