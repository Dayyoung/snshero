/**
 * matchStreakAuraEngine.ts
 * 대전 매치메이킹 및 승리 연승 시 실시간 콤보 티어 오라 및 도파민 연승 배지 시스템
 * (구글 스프레드시트 Row 849 / ID 570 요구사항 구현)
 */

export type StreakTier = 'NONE' | 'BLAZE' | 'INFERNO' | 'GODLIKE';

export interface StreakAuraProfile {
  streakCount: number;
  tier: StreakTier;
  auraCss: string;
  badgeTitle: string;
  bannerText: string;
  bonusPointsMultiplier: number;
}

export class MatchStreakAuraEngine {
  private static instance: MatchStreakAuraEngine;
  private readonly STORAGE_KEY = 'hero_pvp_win_streak_v1';

  private constructor() {}

  public static getInstance(): MatchStreakAuraEngine {
    if (!MatchStreakAuraEngine.instance) {
      MatchStreakAuraEngine.instance = new MatchStreakAuraEngine();
    }
    return MatchStreakAuraEngine.instance;
  }

  public getStreakCount(): number {
    try {
      return parseInt(localStorage.getItem(this.STORAGE_KEY) || '0', 10) || 0;
    } catch {
      return 0;
    }
  }

  public recordMatchResult(isVictory: boolean): StreakAuraProfile {
    let count = this.getStreakCount();
    if (isVictory) {
      count += 1;
    } else {
      count = 0;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, count.toString());
    } catch {
      // ignore
    }

    return this.getAuraProfile(count);
  }

  public getAuraProfile(streakCount?: number): StreakAuraProfile {
    const count = streakCount !== undefined ? streakCount : this.getStreakCount();

    if (count >= 10) {
      return {
        streakCount: count,
        tier: 'GODLIKE',
        auraCss: 'ring-4 ring-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.8)] animate-pulse',
        badgeTitle: '👑 신화적 불패 (Godlike)',
        bannerText: `⚡ ${count}연승 신화 강림! 절대 도미네이터`,
        bonusPointsMultiplier: 2.0,
      };
    }

    if (count >= 5) {
      return {
        streakCount: count,
        tier: 'INFERNO',
        auraCss: 'ring-3 ring-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.7)] animate-pulse',
        badgeTitle: '🔥 지옥의 연승 (Inferno)',
        bannerText: `💥 ${count}연승 불패 행진! 인페르노 버스트`,
        bonusPointsMultiplier: 1.5,
      };
    }

    if (count >= 3) {
      return {
        streakCount: count,
        tier: 'BLAZE',
        auraCss: 'ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]',
        badgeTitle: '⚡ 연승 도미네이터 (Blaze)',
        bannerText: `🔥 ${count}연승 돌파! 승리의 가속도`,
        bonusPointsMultiplier: 1.2,
      };
    }

    return {
      streakCount: count,
      tier: 'NONE',
      auraCss: '',
      badgeTitle: '',
      bannerText: '',
      bonusPointsMultiplier: 1.0,
    };
  }
}

export const matchStreakAuraEngine = MatchStreakAuraEngine.getInstance();
