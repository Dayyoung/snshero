/**
 * streakRewardBooster.ts
 * 연속 출석 및 일일 미션 달성 연동 SNS 포인트 배수 부스터 & 스트릭 콤보 게이트웨이
 * (구글 스프레드시트 Row 959, Row 999 / ID 555, ID 579 요구사항 구현)
 */

export interface StreakBoosterState {
  currentDailyClears: number;     // 오늘 클리어한 미션 수
  dailyStreakDays: number;         // 주간 연속 플레이 일수
  consecutiveClearStreak: number;  // 세션 내 연속 클리어 콤보 수
  activeMultiplier: number;        // 현재 적용 배수 (1.0x ~ 1.5x)
  isDailyBoostActive: boolean;    // 일일 3회 클리어 달성 여부 (1.2x)
  isWeeklyStreakActive: boolean;  // 주간 7일 연속 플레이 달성 여부 (1.5x)
  lastPlayedDate: string;
  flameAnimationLevel: 0 | 1 | 2 | 3; // 스트릭 플레임 애니메이션 레벨
}

export class StreakRewardBooster {
  private static instance: StreakRewardBooster;
  private readonly STORAGE_KEY = 'hero_streak_boost_v1';

  private constructor() {}

  public static getInstance(): StreakRewardBooster {
    if (!StreakRewardBooster.instance) {
      StreakRewardBooster.instance = new StreakRewardBooster();
    }
    return StreakRewardBooster.instance;
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  public getState(): StreakBoosterState {
    const today = this.getTodayKey();
    let state: StreakBoosterState = {
      currentDailyClears: 0,
      dailyStreakDays: 1,
      consecutiveClearStreak: 0,
      activeMultiplier: 1.0,
      isDailyBoostActive: false,
      isWeeklyStreakActive: false,
      lastPlayedDate: today,
      flameAnimationLevel: 0,
    };

    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.lastPlayedDate === today) {
          state = { ...state, ...parsed };
        } else {
          // 날짜 변경 시: 연속 출석 일수 계산
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          const continuedStreak = parsed.lastPlayedDate === yesterday ? (parsed.dailyStreakDays || 1) + 1 : 1;

          state = {
            currentDailyClears: 0,
            dailyStreakDays: continuedStreak,
            consecutiveClearStreak: 0,
            activeMultiplier: continuedStreak >= 7 ? 1.5 : 1.0,
            isDailyBoostActive: false,
            isWeeklyStreakActive: continuedStreak >= 7,
            lastPlayedDate: today,
            flameAnimationLevel: 0,
          };
          this.saveState(state);
        }
      }
    } catch {
      // fallback
    }

    return state;
  }

  /**
   * 미션 클리어 시 카운트 및 연속 클리어 콤보(Streak) 증가
   */
  public recordMissionClear(): StreakBoosterState {
    const state = this.getState();
    state.currentDailyClears += 1;
    state.consecutiveClearStreak += 1;

    // 연속 클리어 스트릭 콤보에 따른 추가 가산 (+10% -> +20% -> 최대 +50%)
    let comboMultiplier = 1.0;
    let flameLevel: 0 | 1 | 2 | 3 = 0;

    if (state.consecutiveClearStreak >= 5) {
      comboMultiplier = 1.5;
      flameLevel = 3;
    } else if (state.consecutiveClearStreak >= 3) {
      comboMultiplier = 1.3;
      flameLevel = 2;
    } else if (state.consecutiveClearStreak >= 2) {
      comboMultiplier = 1.15;
      flameLevel = 1;
    }

    if (state.currentDailyClears >= 3) {
      state.isDailyBoostActive = true;
    }

    // 주간 7일 달성 시 1.5x, 일일 3회 달성 시 1.2x, 콤보 배수 중 최대값 채택
    const baseMult = state.isWeeklyStreakActive ? 1.5 : state.isDailyBoostActive ? 1.2 : 1.0;
    state.activeMultiplier = Math.min(1.5, Math.max(baseMult, comboMultiplier));
    state.flameAnimationLevel = flameLevel;

    this.saveState(state);
    return state;
  }

  /**
   * 미션 실패/포기 시 연속 클리어 스트릭 리셋
   */
  public resetConsecutiveStreak(): void {
    const state = this.getState();
    state.consecutiveClearStreak = 0;
    state.flameAnimationLevel = 0;
    this.saveState(state);
  }

  /**
   * 기본 보상에 배수 부스터 적용 및 계산 결과 반환
   */
  public applyBoost(baseSns: number): { baseSns: number; boostedSns: number; multiplier: number; bonusAdded: number; flameLevel: number } {
    const state = this.getState();
    const boostedSns = Math.round(baseSns * state.activeMultiplier);
    const bonusAdded = boostedSns - baseSns;

    return {
      baseSns,
      boostedSns,
      multiplier: state.activeMultiplier,
      bonusAdded,
      flameLevel: state.flameAnimationLevel,
    };
  }

  private saveState(state: StreakBoosterState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }
}
