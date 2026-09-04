/**
 * deckResonanceEngine.ts
 * 3카드 편성 6종 속성 공명(불/물/바람/땅/빛/어둠) 시너지 버프 연산 엔진
 * (구글 스프레드시트 Row 840 / ID 561 요구사항 구현)
 */

import { CardData } from '../types';

export type ResonanceType = 'FIRE' | 'WATER' | 'WIND' | 'EARTH' | 'LIGHT' | 'DARK';

export interface ResonanceBuff {
  type: ResonanceType;
  title: string;
  badge: string;
  atkBonus: number;
  shieldBonus: number;
  comboMultiplier: number;
  description: string;
}

export class DeckResonanceEngine {
  private static instance: DeckResonanceEngine;

  private constructor() {}

  public static getInstance(): DeckResonanceEngine {
    if (!DeckResonanceEngine.instance) {
      DeckResonanceEngine.instance = new DeckResonanceEngine();
    }
    return DeckResonanceEngine.instance;
  }

  /**
   * 덱의 3장 이상 일치하는 속성 공명 버프 계산
   */
  public calculateResonance(deck: CardData[]): ResonanceBuff | null {
    if (!deck || deck.length < 3) return null;

    const counts: Record<string, number> = {
      fire: 0,
      water: 0,
      wind: 0,
      earth: 0,
      light: 0,
      dark: 0,
    };

    deck.forEach((card) => {
      const el = (card.element?.toLowerCase() || 'fire');
      if (counts[el] !== undefined) {
        counts[el]++;
      } else {
        counts.fire++;
      }
    });

    let dominant: ResonanceType | null = null;
    let max = 0;

    for (const [k, v] of Object.entries(counts)) {
      if (v >= 3 && v > max) {
        max = v;
        dominant = k.toUpperCase() as ResonanceType;
      }
    }

    if (!dominant) return null;

    switch (dominant) {
      case 'FIRE':
        return {
          type: 'FIRE',
          title: '🔥 화염 폭풍의 맹공 (Blaze Assault)',
          badge: '공격력 +3',
          atkBonus: 3,
          shieldBonus: 0,
          comboMultiplier: 1.2,
          description: '화염 속성 3카드 공명으로 공격력 +3 증가 및 콤보 1.2배 증폭',
        };
      case 'WATER':
        return {
          type: 'WATER',
          title: '💧 심해의 보호막 (Abyssal Barrier)',
          badge: '방어막 +30',
          atkBonus: 1,
          shieldBonus: 30,
          comboMultiplier: 1.1,
          description: '수속성 3카드 공명으로 30HP 방어막 생성 및 공격력 +1 보너스',
        };
      case 'WIND':
        return {
          type: 'WIND',
          title: '⚡ 질풍의 연쇄타 (Tempest Flurry)',
          badge: '콤보 1.4배',
          atkBonus: 2,
          shieldBonus: 0,
          comboMultiplier: 1.4,
          description: '바람 속성 3카드 공명으로 연쇄 뒤집기 콤보 배율 1.4배 증폭',
        };
      case 'EARTH':
        return {
          type: 'EARTH',
          title: '🌿 불굴의 요새 (Terra Bastion)',
          badge: '피해 감소 -2',
          atkBonus: 1,
          shieldBonus: 20,
          comboMultiplier: 1.0,
          description: '땅 속성 3카드 공명으로 받는 데미지 2 감소 및 방어막 20 부여',
        };
      case 'LIGHT':
        return {
          type: 'LIGHT',
          title: '✨ 성스러운 축복 (Holy Radiance)',
          badge: '모든 스탯 +2',
          atkBonus: 2,
          shieldBonus: 15,
          comboMultiplier: 1.2,
          description: '빛 속성 3카드 공명으로 전 능력치 강화 및 치유력 부여',
        };
      case 'DARK':
        return {
          type: 'DARK',
          title: '🌑 암흑의 포식 (Shadow Drain)',
          badge: '치명타율 +20%',
          atkBonus: 3,
          shieldBonus: 0,
          comboMultiplier: 1.3,
          description: '어둠 속성 3카드 공명으로 적 처치 시 체력 흡수 및 크리티컬 발동',
        };
    }
  }
}

export const deckResonanceEngine = DeckResonanceEngine.getInstance();
