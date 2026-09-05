/**
 * deckSynergyAuraEngine.ts
 * 카드 수집 세트 및 숨겨진 영웅 인연/진영 시너지(Hero Bond Synergy Aura) 실시간 발동 엔진
 * (구글 스프레드시트 Row 881, Row 973 / ID 553, ID 561 요구사항 구현)
 */

import { CardData } from '../types';

export interface HeroBondSynergy {
  bondId: string;
  bondNameKo: string;
  bondNameEn: string;
  matchedElements: string[];
  matchedFactions: string[];
  attackBonusPct: number;
  defenseBonusPct: number;
  speedBonusPct: number;
  neonGlowColor: string;
  fanfareBanner: string;
  auraShaderUniforms: {
    intensity: number;
    pulseSpeed: number;
    baseColorRgb: [number, number, number];
  };
}

export interface SetSynergyEffect {
  theme: string;
  themeNameKo: string;
  count: number;
  isCompleted: boolean; // 3+ matching cards
  glowClass: string;
  attackSpeedBonus: number; // +15%
  goldGainBonus: number; // +20%
  bannerFanfare: string;
  heroBond?: HeroBondSynergy | null;
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
   * 덱의 숨겨진 영웅 인연 조합(Hero Bond) 판별
   */
  public detectHeroBond(deck: (CardData | null | undefined)[]): HeroBondSynergy | null {
    const validCards = deck.filter((c): c is CardData => Boolean(c));
    const elements = new Set(validCards.map((c) => (c.element || '').toLowerCase()));
    const races = new Set(validCards.map((c) => (c.race || (c as { faction?: string }).faction || '').toLowerCase()));

    // 1. 불꽃(Fire) + 메카/기계(Mecha/Robot) = 오버드라이브 메카
    if (elements.has('fire') && (races.has('mecha') || races.has('robot'))) {
      return {
        bondId: 'bond_flame_mecha',
        bondNameKo: '[오버드라이브] 화염 메카 코어',
        bondNameEn: 'Overdrive Flame Mecha',
        matchedElements: ['fire'],
        matchedFactions: ['mecha'],
        attackBonusPct: 20,
        defenseBonusPct: 10,
        speedBonusPct: 15,
        neonGlowColor: '#f97316',
        fanfareBanner: '⚙️🔥 [인연 발동] 화염 메카 코어! 공격력 +20%, 공속 +15% 폭발!',
        auraShaderUniforms: { intensity: 1.2, pulseSpeed: 2.5, baseColorRgb: [1.0, 0.4, 0.1] },
      };
    }

    // 2. 수류(Water) + 엘프(Elf) = 조수의 정령 계약
    if (elements.has('water') && races.has('elf')) {
      return {
        bondId: 'bond_tidal_elf',
        bondNameKo: '[정령 계약] 조수의 엘프 수호',
        bondNameEn: 'Tidal Elf Spirit Covenant',
        matchedElements: ['water'],
        matchedFactions: ['elf'],
        attackBonusPct: 10,
        defenseBonusPct: 25,
        speedBonusPct: 10,
        neonGlowColor: '#06b6d4',
        fanfareBanner: '💧🧝 [인연 발동] 조수의 엘프 수호! 방어력 +25%, 회피율 상승!',
        auraShaderUniforms: { intensity: 1.0, pulseSpeed: 1.8, baseColorRgb: [0.1, 0.7, 0.9] },
      };
    }

    // 3. 드래곤(Dragon) + 암흑(Dark) = 심연의 흑룡 군세
    if ((elements.has('dark') || races.has('dragon')) && validCards.some((c) => c.rarity === 'legendary')) {
      return {
        bondId: 'bond_abyssal_dragon',
        bondNameKo: '[전설의 각성] 심연의 흑룡 군세',
        bondNameEn: 'Abyssal Dragon Legion',
        matchedElements: ['dark'],
        matchedFactions: ['dragon'],
        attackBonusPct: 30,
        defenseBonusPct: 15,
        speedBonusPct: 10,
        neonGlowColor: '#8b5cf6',
        fanfareBanner: '🐉⚡ [인연 발동] 심연의 흑룡 각성! 공격력 +30% 초월 격발!',
        auraShaderUniforms: { intensity: 1.5, pulseSpeed: 3.0, baseColorRgb: [0.55, 0.25, 0.95] },
      };
    }

    return null;
  }

  /**
   * 덱의 테마/진영 카운트를 계산하고 세트 시너지 및 인연 버프 반환
   */
  public calculateSetSynergy(deck: (CardData | null | undefined)[]): SetSynergyEffect | null {
    const validCards = deck.filter((c): c is CardData => Boolean(c));
    const heroBond = this.detectHeroBond(validCards);

    if (validCards.length < 3 && !heroBond) return null;

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

    if (!dominantTheme && !heroBond) return null;

    const chosenTheme = dominantTheme || 'hero_bond';

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
      hero_bond: {
        ko: heroBond ? heroBond.bondNameKo : '영웅의 인연 (Hero Bond)',
        glow: 'shadow-[0_0_18px_rgba(234,179,8,0.8)] ring-2 ring-amber-400 animate-pulse',
        banner: heroBond ? heroBond.fanfareBanner : '✨ [인연 완성] 영웅의 결속!',
      },
    };

    const info = THEME_INFO[chosenTheme] || {
      ko: '전사의 결속 (Warrior Bond)',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.7)] ring-2 ring-purple-500 animate-pulse',
      banner: '⚔️ [세트 완성] 전사의 결속! 공속 +15%, 골드 +20% 활성화!',
    };

    return {
      theme: chosenTheme,
      themeNameKo: info.ko,
      count: Math.max(maxCount, validCards.length),
      isCompleted: true,
      glowClass: info.glow,
      attackSpeedBonus: 15 + (heroBond ? heroBond.speedBonusPct : 0),
      goldGainBonus: 20,
      bannerFanfare: info.banner,
      heroBond,
    };
  }
}

export const deckSynergyAuraEngine = DeckSynergyAuraEngine.getInstance();
