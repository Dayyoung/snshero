/**
 * platformEconomyPacing.ts
 * 플랫폼 전역 활동 SNS 포인트 획득량 표준 밸런싱 및 스태미나 자연 충전 가속 매니저
 * (구글 스프레드시트 Row 966 / ID 554 요구사항 구현)
 */

export interface ActivityPacingConfig {
  activity: 'pvp' | 'story' | 'mission';
  durationMin: number;
  isWin: boolean;
  streakCount: number;
}

export interface PacingRewardResult {
  baseSns: number;
  streakBonusSns: number;
  totalSns: number;
  apRefilled: number; // 3연승 달성 시 +10 AP
  currentStreak: number;
  isStreakThresholdReached: boolean;
}

export class PlatformEconomyPacing {
  private static instance: PlatformEconomyPacing;
  private readonly STREAK_STORAGE_KEY = 'hero_pacing_win_streak';
  private readonly AP_STORAGE_KEY = 'hero_stamina_ap';
  private readonly BASELINE_SNS_PER_MIN = 50;

  private constructor() {}

  public static getInstance(): PlatformEconomyPacing {
    if (!PlatformEconomyPacing.instance) {
      PlatformEconomyPacing.instance = new PlatformEconomyPacing();
    }
    return PlatformEconomyPacing.instance;
  }

  public getCurrentStreak(): number {
    try {
      const raw = localStorage.getItem(this.STREAK_STORAGE_KEY);
      return raw ? parseInt(raw, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  /**
   * 활동 종료 후 정산 및 연승 보너스 AP 리필 처리
   */
  public settleActivity(config: ActivityPacingConfig): PacingRewardResult {
    let streak = this.getCurrentStreak();

    if (config.isWin) {
      streak += 1;
    } else {
      streak = 0;
    }

    try {
      localStorage.setItem(this.STREAK_STORAGE_KEY, streak.toString());
    } catch {
      // ignore
    }

    // 기본 분당 50P 공식
    const baseSns = Math.max(10, Math.round(config.durationMin * this.BASELINE_SNS_PER_MIN));
    // 연승당 5% 추가 보너스 (최대 +50%)
    const streakBonusMultiplier = Math.min(0.5, streak * 0.05);
    const streakBonusSns = config.isWin ? Math.round(baseSns * streakBonusMultiplier) : 0;
    const totalSns = baseSns + streakBonusSns;

    // 3연승 단위마다 +10 AP 즉시 보너스 충전
    let apRefilled = 0;
    const isStreakThresholdReached = config.isWin && streak > 0 && streak % 3 === 0;

    if (isStreakThresholdReached) {
      apRefilled = 10;
      this.addStaminaAp(apRefilled);
    }

    // SNS 포인트 원자적 입금
    try {
      const currentPoint = parseInt(localStorage.getItem('hero_sns_point') || '0', 10) || 0;
      const newPoint = currentPoint + totalSns;
      localStorage.setItem('hero_sns_point', newPoint.toString());

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('hero_sns_point_changed', {
            detail: { newBalance: newPoint, diff: totalSns, reason: 'economy_pacing' },
          })
        );
      }
    } catch {
      // ignore
    }

    return {
      baseSns,
      streakBonusSns,
      totalSns,
      apRefilled,
      currentStreak: streak,
      isStreakThresholdReached,
    };
  }

  private addStaminaAp(amount: number): void {
    try {
      const raw = localStorage.getItem(this.AP_STORAGE_KEY);
      let apState = raw ? JSON.parse(raw) : { currentAp: 100, maxAp: 120, lastRegenTimestamp: Date.now() };
      apState.currentAp = Math.min(apState.maxAp, (apState.currentAp || 0) + amount);
      localStorage.setItem(this.AP_STORAGE_KEY, JSON.stringify(apState));
    } catch {
      // ignore
    }
  }
}
