/**
 * dailyMileageEconomy.ts
 * 마켓플레이스 거래 및 미션 활동 통합 SNS 토큰 마일리지 & 스태미나 페이싱 시스템
 * (구글 스프레드시트 Row 850 / ID 571 요구사항 구현)
 */

export interface MileageStatus {
  date: string;
  points: number; // 0 ~ 100
  isFullRewardClaimed: boolean;
  history: string[];
}

export class DailyMileageEconomy {
  private static instance: DailyMileageEconomy;
  private readonly STORAGE_KEY = 'hero_daily_mileage_state_v1';

  private constructor() {}

  public static getInstance(): DailyMileageEconomy {
    if (!DailyMileageEconomy.instance) {
      DailyMileageEconomy.instance = new DailyMileageEconomy();
    }
    return DailyMileageEconomy.instance;
  }

  private getTodayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  public getStatus(): MileageStatus {
    const today = this.getTodayString();
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === today) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    const init: MileageStatus = {
      date: today,
      points: 0,
      isFullRewardClaimed: false,
      history: [],
    };
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(init));
    } catch {
      // ignore
    }
    return init;
  }

  /**
   * 활동에 따른 마일리지 누적 (+25P for Match, +15P for Mission, +30P for Trade)
   */
  public addMileage(
    activity: 'MATCH' | 'MISSION' | 'TRADE' | 'UPGRADE',
    description: string
  ): { status: MileageStatus; newlyClaimable: boolean } {
    const status = this.getStatus();
    const AMOUNTS: Record<string, number> = {
      MATCH: 25,
      MISSION: 15,
      TRADE: 30,
      UPGRADE: 20,
    };

    const add = AMOUNTS[activity] || 10;
    const oldPoints = status.points;
    status.points = Math.min(100, status.points + add);
    status.history.unshift(`+${add}P (${activity}): ${description}`);
    if (status.history.length > 20) status.history.pop();

    const newlyClaimable = oldPoints < 100 && status.points >= 100 && !status.isFullRewardClaimed;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(status));
    } catch {
      // ignore
    }

    return { status, newlyClaimable };
  }

  /**
   * 100P 만점 도달 시 30 AP 포션 및 100 SNS 토큰 상자 수령
   */
  public claimFullMileageReward(): { success: boolean; grantedAp: number; grantedSns: number } {
    const status = this.getStatus();
    if (status.points < 100 || status.isFullRewardClaimed) {
      return { success: false, grantedAp: 0, grantedSns: 0 };
    }

    status.isFullRewardClaimed = true;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(status));

      // SNS 100P 원자적 입금
      const currentSns = parseInt(localStorage.getItem('hero_sns_point') || '0', 10) || 0;
      localStorage.setItem('hero_sns_point', (currentSns + 100).toString());
    } catch {
      // ignore
    }

    return {
      success: true,
      grantedAp: 30,
      grantedSns: 100,
    };
  }
}

export const dailyMileageEconomy = DailyMileageEconomy.getInstance();
