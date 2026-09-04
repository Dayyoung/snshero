/**
 * dailyMissionRewardBonus.ts
 * 전 미션 게임 클리어 시 100% 확정 SNS 포인트 + '일일 3회 완주 보너스(+100P)' 자동 정산 모듈
 * (구글 스프레드시트 Row 863 / ID 555 요구사항 구현)
 */

export interface DailyMissionStreakStatus {
  date: string;
  completedCount: number;
  bonusClaimed: boolean;
  bonusAmount: number; // 100
}

export class DailyMissionRewardBonus {
  private static instance: DailyMissionRewardBonus;
  private readonly STORAGE_KEY = 'hero_daily_mission_streak_v1';
  private readonly TARGET_STREAK = 3;
  private readonly BONUS_SNS = 100;

  private constructor() {}

  public static getInstance(): DailyMissionRewardBonus {
    if (!DailyMissionRewardBonus.instance) {
      DailyMissionRewardBonus.instance = new DailyMissionRewardBonus();
    }
    return DailyMissionRewardBonus.instance;
  }

  private getTodayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  public getStatus(): DailyMissionStreakStatus {
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

    const init: DailyMissionStreakStatus = {
      date: today,
      completedCount: 0,
      bonusClaimed: false,
      bonusAmount: this.BONUS_SNS,
    };
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(init));
    } catch {
      // ignore
    }
    return init;
  }

  /**
   * 미션 클리어 시 카운트 증가 및 3회 달성 시 +100 SNS 포인트 자동 지갑 입금
   */
  public recordMissionClear(): { status: DailyMissionStreakStatus; bonusAwarded: boolean } {
    const status = this.getStatus();
    status.completedCount += 1;
    let bonusAwarded = false;

    if (status.completedCount >= this.TARGET_STREAK && !status.bonusClaimed) {
      status.bonusClaimed = true;
      bonusAwarded = true;

      try {
        // 유저 지갑에 100 SNS 원자적 입금
        const currentSns = parseInt(localStorage.getItem('hero_sns_point') || '0', 10) || 0;
        const newBalance = currentSns + this.BONUS_SNS;
        localStorage.setItem('hero_sns_point', newBalance.toString());

        // 히스토리 기록
        const historyRaw = localStorage.getItem('hero_sns_history');
        const history = historyRaw ? JSON.parse(historyRaw) : [];
        history.unshift({
          id: `tx_daily_streak_${Date.now()}`,
          type: 'MISSION_CLAIM',
          title: '🏆 [일일 완주 3회 보너스] 추가 확정 지급',
          amount: this.BONUS_SNS,
          timestamp: Date.now(),
          details: '하루 3회 미션 성공 보너스 100 SNS 포인트 지급',
        });
        if (history.length > 50) history.pop();
        localStorage.setItem('hero_sns_history', JSON.stringify(history));

        // 실시간 UI 동기화 이벤트
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('hero_sns_updated', {
              detail: { balance: newBalance, added: this.BONUS_SNS, reason: 'DAILY_MISSION_STREAK' },
            })
          );
        }
      } catch (e) {
        console.error('Failed to award daily mission streak bonus:', e);
      }
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(status));
    } catch {
      // ignore
    }

    return { status, bonusAwarded };
  }
}

export const dailyMissionRewardBonus = DailyMissionRewardBonus.getInstance();
