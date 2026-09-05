/**
 * streakRewardBooster.ts
 * 연속 출석 및 일일 미션 달성 연동 SNS 포인트 배수 부스터 게이트웨이
 * (구글 스프레드시트 Row 959 / ID 555 요구사항 구현)
 */

export interface StreakBoosterState {
  currentDailyClears: number;     // 오늘 클리어한 미션 수
  dailyStreakDays: number;         // 주간 연속 플레이 일수
  activeMultiplier: number;        // 현재 적용 배수 (1.0x, 1.2x, 1.5x)
  isDailyBoostActive: boolean;    // 일일 3회 클리어 달성 여부 (1.2x)
  isWeeklyStreakActive: boolean;  // 주간 7일 연속 플레이 달성 여부 (1.5x)
  lastPlayedDate: string;
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
      activeMultiplier: 1.0,
      isDailyBoostActive: false,
      isWeeklyStreakActive: false,
      lastPlayedDate: today,
    };

    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.lastPlayedDate === today) {
          state = parsed;
        } else {
          // 날짜가 바뀐 경우: 연속 출석 계산
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          const continuedStreak = parsed.lastPlayedDate === yesterday ? parsed.dailyStreakDays + 1 : 1;

          state = {
            currentDailyClears: 0,
            dailyStreakDays: continuedStreak,
            activeMultiplier: continuedStreak >= 7 ? 1.5 : 1.0,
            isDailyBoostActive: false,
            isWeeklyStreakActive: continuedStreak >= 7,
            lastPlayedDate: today,
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
   * 미션 클리어 시 카운트 증가 및 배수 갱신
   */
  public recordMissionClear(): StreakBoosterState {
    const state = this.getState();
    state.currentDailyClears += 1;

    if (state.currentDailyClears >= 3) {
      state.isDailyBoostActive = true;
    }

    // 주간 7일 달성 시 1.5x, 일일 3회 달성 시 1.2x, 기본 1.0x
    if (state.isWeeklyStreakActive) {
      state.activeMultiplier = 1.5;
    } else if (state.isDailyBoostActive) {
      state.activeMultiplier = 1.2;
    } else {
      state.activeMultiplier = 1.0;
    }

    this.saveState(state);
    return state;
  }

  /**
   * 기본 보상에 배수 부스터 적용 및 계산 결과 반환
   */
  public applyBoost(baseSns: number): { baseSns: number; boostedSns: number; multiplier: number; bonusAdded: number } {
    const state = this.getState();
    const boostedSns = Math.round(baseSns * state.activeMultiplier);
    const bonusAdded = boostedSns - baseSns;

    return {
      baseSns,
      boostedSns,
      multiplier: state.activeMultiplier,
      bonusAdded,
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
