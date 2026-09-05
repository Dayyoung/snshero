/**
 * deckSynergyCalculator.ts
 * 마이덱 카드 속성 및 진영(Faction) 실시간 '엘리멘탈 레조넌스' 세트 효과 계산기
 * (구글 스프레드시트 Row 965 / ID 553 요구사항 구현)
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
   * 5장 덱의 실시간 속성/진영 시너지 세트 효과 계산
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
