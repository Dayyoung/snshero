/**
 * deckSynergyAuraEngine.ts
 * 카드 수집 세트 완성 시 실시간 발광 오라 및 '덱 시너지 버프' 인게임 이펙트 강화 엔진
 * (구글 스프레드시트 Row 881 / ID 553 요구사항 구현)
 */

import { CardData } from '../types';

export interface SetSynergyEffect {
  theme: string;
  themeNameKo: string;
  count: number;
  isCompleted: boolean; // 3+ matching cards
  glowClass: string;
  attackSpeedBonus: number; // +15%
  goldGainBonus: number; // +20%
  bannerFanfare: string;
}

export class DeckSynergyAuraEngine {
  private static instance: DeckSynergyAuraEngine;

  private constructor() {}

  public static getInstance(): DeckSynergyAuraEngine {
    if (!DeckSynergyAuraEngine.instance) {
      DeckSynergyAuraEngine.instance = new DeckSynergyAuraEngine();
    }
    return DeckSynergyAuraEngine.instance;
  }

  /**
   * 덱의 테마/진영 카운트를 계산하고 세트 시너지 버프 반환
   */
  public calculateSetSynergy(deck: (CardData | null | undefined)[]): SetSynergyEffect | null {
    const validCards = deck.filter((c): c is CardData => Boolean(c));
    if (validCards.length < 3) return null;

    const themeCounts: Record<string, number> = {};

    validCards.forEach((c) => {
      const theme = c.element?.toLowerCase() || 'warrior';
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    });

    let dominantTheme: string | null = null;
    let maxCount = 0;

    for (const [theme, count] of Object.entries(themeCounts)) {
      if (count >= 3 && count > maxCount) {
        maxCount = count;
        dominantTheme = theme;
      }
    }

    if (!dominantTheme) return null;

    const THEME_INFO: Record<string, { ko: string; glow: string; banner: string }> = {
      fire: {
        ko: '불꽃의 결속 (Flame Legion)',
        glow: 'shadow-[0_0_15px_rgba(244,63,94,0.7)] ring-2 ring-rose-500 animate-pulse',
        banner: '🔥 [세트 완성] 불꽃의 결속! 공속 +15%, 골드 +20% 폭발!',
      },
      water: {
        ko: '조수의 수호 (Tidal Ward)',
        glow: 'shadow-[0_0_15px_rgba(6,182,212,0.7)] ring-2 ring-cyan-500 animate-pulse',
        banner: '💧 [세트 완성] 조수의 수호! 공속 +15%, 골드 +20% 획득!',
      },
      earth: {
        ko: '대지의 거벽 (Terra Bulwark)',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.7)] ring-2 ring-emerald-500 animate-pulse',
        banner: '🌿 [세트 완성] 대지의 거벽! 공속 +15%, 골드 +20% 가산!',
      },
      wind: {
        ko: '질풍의 폭풍우 (Tempest Fury)',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.7)] ring-2 ring-amber-500 animate-pulse',
        banner: '⚡ [세트 완성] 질풍의 폭풍우! 공속 +15%, 골드 +20% 가속!',
      },
    };

    const info = THEME_INFO[dominantTheme] || {
      ko: '전사의 결속 (Warrior Bond)',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.7)] ring-2 ring-purple-500 animate-pulse',
      banner: '⚔️ [세트 완성] 전사의 결속! 공속 +15%, 골드 +20% 활성화!',
    };

    return {
      theme: dominantTheme,
      themeNameKo: info.ko,
      count: maxCount,
      isCompleted: true,
      glowClass: info.glow,
      attackSpeedBonus: 15,
      goldGainBonus: 20,
      bannerFanfare: info.banner,
    };
  }
}

export const deckSynergyAuraEngine = DeckSynergyAuraEngine.getInstance();
