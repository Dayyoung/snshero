/**
 * globalEconomyPacing.ts
 * 전 플랫폼 활동 통합 표준화 SNS 포인트 일일 마일스톤 및 스태미나 페이싱 시스템
 * (구글 스프레드시트 Row 741 / ID 578 요구사항 구현)
 */

import { getSeasonItem, setSeasonItem } from './webtoonProgress';

export const ECONOMY_PACING_KEY_PREFIX = 'hero_global_economy_pacing';

export interface DailyMilestoneTier {
  tier: number;
  requiredAp: number;
  rewardSns: number;
  descriptionKo: string;
  descriptionEn: string;
}

export const DAILY_MILESTONES: DailyMilestoneTier[] = [
  { tier: 1, requiredAp: 20, rewardSns: 30, descriptionKo: '첫 걸음 보너스', descriptionEn: 'First Step Bonus' },
  { tier: 2, requiredAp: 50, rewardSns: 50, descriptionKo: '열정의 불꽃 보너스', descriptionEn: 'Passion Flame Bonus' },
  { tier: 3, requiredAp: 80, rewardSns: 80, descriptionKo: '성실한 영웅 보너스', descriptionEn: 'Diligent Hero Bonus' },
  { tier: 4, requiredAp: 120, rewardSns: 120, descriptionKo: '마스터 도전자 보너스', descriptionEn: 'Master Challenger Bonus' },
  { tier: 5, requiredAp: 160, rewardSns: 200, descriptionKo: '완벽한 하루 보너스', descriptionEn: 'Perfect Day Bonus' },
];

export interface EconomyPacingState {
  currentAp: number;
  claimedTiers: number[];
  lastDateStr: string; // YYYY-MM-DD
  stamina: number;
  maxStamina: number;
  lastStaminaUpdatedAt: number; // timestamp ms
}

const getTodayDateStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export class GlobalEconomyPacingService {
  private static readonly MAX_STAMINA = 100;
  private static readonly STAMINA_RECOVERY_INTERVAL_MS = 5 * 60 * 1000; // 5분당 1 회복

  public static getState(season: string = 'season1'): EconomyPacingState {
    const today = getTodayDateStr();
    const raw = getSeasonItem(ECONOMY_PACING_KEY_PREFIX, season);
    let state: EconomyPacingState = {
      currentAp: 0,
      claimedTiers: [],
      lastDateStr: today,
      stamina: this.MAX_STAMINA,
      maxStamina: this.MAX_STAMINA,
      lastStaminaUpdatedAt: Date.now(),
    };

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.lastDateStr === today) {
          state = {
            ...state,
            ...parsed,
          };
        } else {
          // New Day Reset (keep stamina & carry over time)
          state.stamina = parsed.stamina ?? this.MAX_STAMINA;
          state.lastStaminaUpdatedAt = parsed.lastStaminaUpdatedAt ?? Date.now();
        }
      } catch {
        // ignore parse error
      }
    }

    // Calculate natural stamina recovery
    const now = Date.now();
    const elapsed = now - state.lastStaminaUpdatedAt;
    if (elapsed > this.STAMINA_RECOVERY_INTERVAL_MS && state.stamina < state.maxStamina) {
      const recovered = Math.floor(elapsed / this.STAMINA_RECOVERY_INTERVAL_MS);
      if (recovered > 0) {
        state.stamina = Math.min(state.maxStamina, state.stamina + recovered);
        state.lastStaminaUpdatedAt = now - (elapsed % this.STAMINA_RECOVERY_INTERVAL_MS);
        this.saveState(state, season);
      }
    }

    return state;
  }

  public static saveState(state: EconomyPacingState, season: string = 'season1') {
    try {
      setSeasonItem(ECONOMY_PACING_KEY_PREFIX, season, JSON.stringify(state));
    } catch {
      // storage error safe fallback
    }
  }

  /**
   * 전 플랫폼 활동 완료 시 AP 적립
   */
  public static recordActivity(
    type: 'story' | 'mission' | 'pvp' | 'trade' | 'login',
    season: string = 'season1'
  ): { addedAp: number; state: EconomyPacingState } {
    const state = this.getState(season);
    let addedAp = 0;

    switch (type) {
      case 'story':
        addedAp = 20;
        break;
      case 'mission':
        addedAp = 15;
        break;
      case 'pvp':
        addedAp = 25;
        break;
      case 'trade':
        addedAp = 10;
        break;
      case 'login':
        addedAp = 10;
        break;
    }

    state.currentAp += addedAp;
    this.saveState(state, season);
    return { addedAp, state };
  }

  /**
   * 일일 마일스톤 티어 보상 수령
   */
  public static claimMilestoneReward(
    tierNumber: number,
    season: string = 'season1'
  ): { success: boolean; rewardSns: number; state: EconomyPacingState } {
    const state = this.getState(season);
    const target = DAILY_MILESTONES.find((m) => m.tier === tierNumber);

    if (!target) return { success: false, rewardSns: 0, state };
    if (state.currentAp < target.requiredAp) return { success: false, rewardSns: 0, state };
    if (state.claimedTiers.includes(tierNumber)) return { success: false, rewardSns: 0, state };

    state.claimedTiers.push(tierNumber);
    this.saveState(state, season);

    return {
      success: true,
      rewardSns: target.rewardSns,
      state,
    };
  }

  /**
   * 스태미나 소비
   */
  public static consumeStamina(amount: number, season: string = 'season1'): boolean {
    const state = this.getState(season);
    if (state.stamina < amount) return false;

    state.stamina -= amount;
    this.saveState(state, season);
    return true;
  }
}
