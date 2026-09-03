/**
 * platformEconomyPacingEngine.ts
 * 전 플랫폼 활동(대전/미션/거래/출석) 통합 SNS 토큰 기여도 보상 엔진 및 AP 페이싱 밸런스
 * (구글 스프레드시트 Row 825 / ID 554 요구사항 구현)
 */

export type PlatformActivityType = 'PVP_MATCH' | 'MISSION_GAME' | 'MARKET_TRADE' | 'DAILY_ATTENDANCE';

export interface ActivityRewardQuota {
  type: PlatformActivityType;
  baseRewardRate: number; // 50P/min or 10P/AP
  dailyCap: number;
  currentEarnedToday: number;
  remainingCap: number;
  apPacingCost: number;
}

export class PlatformEconomyPacingEngine {
  private static instance: PlatformEconomyPacingEngine;
  private readonly STORAGE_KEY = 'hero_platform_economy_pacing_v1';

  private constructor() {}

  public static getInstance(): PlatformEconomyPacingEngine {
    if (!PlatformEconomyPacingEngine.instance) {
      PlatformEconomyPacingEngine.instance = new PlatformEconomyPacingEngine();
    }
    return PlatformEconomyPacingEngine.instance;
  }

  private getTodayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  private getStoredState(): Record<string, { date: string; counts: Record<PlatformActivityType, number> }> {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  /**
   * 활동별 일일 상한 및 현재 적립 상태 조회
   */
  public getActivityQuota(type: PlatformActivityType): ActivityRewardQuota {
    const today = this.getTodayKey();
    const state = this.getStoredState();
    const dayData = state[today] || { date: today, counts: { PVP_MATCH: 0, MISSION_GAME: 0, MARKET_TRADE: 0, DAILY_ATTENDANCE: 0 } };

    const CAPS: Record<PlatformActivityType, number> = {
      PVP_MATCH: 400,
      MISSION_GAME: 500,
      MARKET_TRADE: 250,
      DAILY_ATTENDANCE: 100,
    };

    const RATES: Record<PlatformActivityType, number> = {
      PVP_MATCH: 60, // 60P / win
      MISSION_GAME: 50, // 50P / min
      MARKET_TRADE: 25,
      DAILY_ATTENDANCE: 50,
    };

    const AP_COSTS: Record<PlatformActivityType, number> = {
      PVP_MATCH: 5,
      MISSION_GAME: 3,
      MARKET_TRADE: 0,
      DAILY_ATTENDANCE: 0,
    };

    const earned = dayData.counts[type] || 0;
    const cap = CAPS[type];

    return {
      type,
      baseRewardRate: RATES[type],
      dailyCap: cap,
      currentEarnedToday: earned,
      remainingCap: Math.max(0, cap - earned),
      apPacingCost: AP_COSTS[type],
    };
  }

  /**
   * 활동 완료 시 정규화된 보상 산출 및 일일 상한 반영
   */
  public recordActivityReward(type: PlatformActivityType, requestedAmount: number): {
    grantedAmount: number;
    cappedOut: boolean;
  } {
    const quota = this.getActivityQuota(type);
    const grantedAmount = Math.min(requestedAmount, quota.remainingCap);

    if (grantedAmount > 0) {
      const today = this.getTodayKey();
      const state = this.getStoredState();
      if (!state[today]) {
        state[today] = { date: today, counts: { PVP_MATCH: 0, MISSION_GAME: 0, MARKET_TRADE: 0, DAILY_ATTENDANCE: 0 } };
      }
      state[today].counts[type] = (state[today].counts[type] || 0) + grantedAmount;

      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('Failed to save platform economy pacing:', e);
      }
    }

    return {
      grantedAmount,
      cappedOut: quota.remainingCap <= 0,
    };
  }
}

export const platformEconomyPacingEngine = PlatformEconomyPacingEngine.getInstance();
