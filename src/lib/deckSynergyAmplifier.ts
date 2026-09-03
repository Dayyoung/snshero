/**
 * deckSynergyAmplifier.ts
 * 속성 시너지 오라 & 콤보 어나운서 배너 실시간 타격 연출 증폭 엔진
 * (구글 스프레드시트 Row 824 / ID 553 요구사항 구현)
 */

import { CardData } from '../types';

export interface SynergyAuraEffect {
  element: 'fire' | 'water' | 'earth' | 'wind';
  count: number;
  bonusPower: number;
  auraCss: string;
  glowColor: string;
  title: string;
}

export class DeckSynergyAmplifier {
  private static instance: DeckSynergyAmplifier;

  private constructor() {}

  public static getInstance(): DeckSynergyAmplifier {
    if (!DeckSynergyAmplifier.instance) {
      DeckSynergyAmplifier.instance = new DeckSynergyAmplifier();
    }
    return DeckSynergyAmplifier.instance;
  }

  /**
   * 덱의 속성 시너지를 계산하고 시각적 오라 효과 반환
   */
  public calculateActiveSynergy(cards: (CardData | null | undefined)[]): SynergyAuraEffect | null {
    const validCards = cards.filter((c): c is CardData => Boolean(c));
    if (validCards.length < 3) return null;

    const counts: Record<'fire' | 'water' | 'earth' | 'wind', number> = {
      fire: 0,
      water: 0,
      earth: 0,
      wind: 0,
    };

    for (const card of validCards) {
      const el = (card.element?.toLowerCase() || 'fire') as 'fire' | 'water' | 'earth' | 'wind';
      if (counts[el] !== undefined) {
        counts[el] += 1;
      }
    }

    let dominantElement: 'fire' | 'water' | 'earth' | 'wind' | null = null;
    let maxCount = 0;

    for (const [el, count] of Object.entries(counts)) {
      if (count >= 3 && count > maxCount) {
        dominantElement = el as 'fire' | 'water' | 'earth' | 'wind';
        maxCount = count;
      }
    }

    if (!dominantElement) return null;

    const isFullMonopoly = maxCount >= 5;
    const bonusPower = isFullMonopoly ? 4 : 2;

    switch (dominantElement) {
      case 'fire':
        return {
          element: 'fire',
          count: maxCount,
          bonusPower,
          auraCss: 'animate-pulse ring-2 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]',
          glowColor: '#f43f5e',
          title: isFullMonopoly ? '🔥 전설의 화염 지배 (Flame Monopoly +4)' : '🔥 화염 공명 오라 (Flame Aura +2)',
        };
      case 'water':
        return {
          element: 'water',
          count: maxCount,
          bonusPower,
          auraCss: 'animate-pulse ring-2 ring-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]',
          glowColor: '#06b6d4',
          title: isFullMonopoly ? '💧 심해의 조화 (Tidal Monopoly +4)' : '💧 빙결 공명 오라 (Tidal Aura +2)',
        };
      case 'earth':
        return {
          element: 'earth',
          count: maxCount,
          bonusPower,
          auraCss: 'animate-pulse ring-2 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]',
          glowColor: '#10b981',
          title: isFullMonopoly ? '🌿 대지의 수호 (Earth Monopoly +4)' : '🌿 암석 공명 오라 (Earth Aura +2)',
        };
      case 'wind':
        return {
          element: 'wind',
          count: maxCount,
          bonusPower,
          auraCss: 'animate-pulse ring-2 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]',
          glowColor: '#f59e0b',
          title: isFullMonopoly ? '⚡ 질풍의 맹습 (Gale Monopoly +4)' : '⚡ 폭풍 공명 오라 (Gale Aura +2)',
        };
    }
  }
}

export const deckSynergyAmplifier = DeckSynergyAmplifier.getInstance();
