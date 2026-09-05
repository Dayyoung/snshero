/**
 * platformEconomyNormalizer.ts
 * 전 플랫폼 활동(스토리/미션/PVP/주식/마켓) 통합 '분당 50 SNS 포인트 표준 밸런싱 & AP 페이싱' 매니저
 * (구글 스프레드시트 Row 906 / ID 554 요구사항 구현)
 */

export type PlatformActivityType = 'mission' | 'pvp' | 'story' | 'market' | 'stock';

export interface StaminaState {
  currentAp: number;
  maxAp: number;
  lastRegenTimestamp: number;
  regenIntervalSec: number; // 30초당 1 AP
}

export interface ActivityRewardNorm {
  activityType: PlatformActivityType;
  durationSeconds: number;
  basePoints: number;
  multiplier: number;
  finalPoints: number;
  apConsumed: number;
  isDailyCapped: boolean;
}

export class PlatformEconomyNormalizer {
  private static instance: PlatformEconomyNormalizer;

  private readonly AP_STORAGE_KEY = 'hero_stamina_ap';
  private readonly CAP_STORAGE_KEY = 'hero_daily_economy_cap';
  private readonly BASELINE_SNS_PER_MIN = 50; // 분당 50P 기준
  private readonly MAX_AP = 120;
  private readonly REGEN_SEC_PER_AP = 30; // 30초당 1 AP
  private readonly DAILY_MAX_SNS_CAP = 3000; // 일일 소프트 상한 3000 SNS

  private constructor() {}

  public static getInstance(): PlatformEconomyNormalizer {
    if (!PlatformEconomyNormalizer.instance) {
      PlatformEconomyNormalizer.instance = new PlatformEconomyNormalizer();
    }
    return PlatformEconomyNormalizer.instance;
  }

  /**
   * 스태미나(AP) 현재 상태 조회 및 경과 시간 비례 자동 재생 반영
   */
  public getStaminaState(): StaminaState {
    const now = Date.now();
    let state: StaminaState = {
      currentAp: this.MAX_AP,
      maxAp: this.MAX_AP,
      lastRegenTimestamp: now,
      regenIntervalSec: this.REGEN_SEC_PER_AP,
    };

    try {
      const raw = localStorage.getItem(this.AP_STORAGE_KEY);
      if (raw) {
        state = JSON.parse(raw);
      }
    } catch {
      // fallback to default
    }

    // 시간 경과에 따른 AP 자동 재생 계산
    const elapsedSec = Math.floor((now - state.lastRegenTimestamp) / 1000);
    if (elapsedSec >= this.REGEN_SEC_PER_AP && state.currentAp < this.MAX_AP) {
      const regeneratedAp = Math.floor(elapsedSec / this.REGEN_SEC_PER_AP);
      const newAp = Math.min(this.MAX_AP, state.currentAp + regeneratedAp);
      const updatedTimestamp = state.lastRegenTimestamp + regeneratedAp * this.REGEN_SEC_PER_AP * 1000;

      state.currentAp = newAp;
      state.lastRegenTimestamp = updatedTimestamp;
      this.saveStaminaState(state);
    }

    return state;
  }

  /**
   * AP 소모 처리
   */
  public consumeAp(amount: number): boolean {
    const current = this.getStaminaState();
    if (current.currentAp < amount) {
      return false; // AP 부족
    }

    current.currentAp -= amount;
    this.saveStaminaState(current);
    return true;
  }

  /**
   * 전 플랫폼 활동의 정규화된 SNS 포인트 계산 (분당 50P 표준)
   */
  public normalizeReward(
    activityType: PlatformActivityType,
    durationSeconds: number,
    performanceScoreMultiplier = 1.0
  ): ActivityRewardNorm {
    const clampedDuration = Math.max(10, Math.min(600, durationSeconds));
    const durationMin = clampedDuration / 60;

    // 활동별 가중치 계수
    const ACTIVITY_WEIGHTS: Record<PlatformActivityType, { weight: number; apCost: number }> = {
      mission: { weight: 1.0, apCost: 5 },
      pvp: { weight: 1.25, apCost: 10 },
      story: { weight: 0.9, apCost: 3 },
      market: { weight: 0.7, apCost: 0 },
      stock: { weight: 0.8, apCost: 2 },
    };

    const config = ACTIVITY_WEIGHTS[activityType] || { weight: 1.0, apCost: 5 };
    const rawPoints = Math.round(durationMin * this.BASELINE_SNS_PER_MIN * config.weight * performanceScoreMultiplier);

    // 일일 한도 체크
    const dailyEarned = this.getTodayEarnedSns();
    const isDailyCapped = dailyEarned >= this.DAILY_MAX_SNS_CAP;
    const finalPoints = isDailyCapped ? Math.max(5, Math.round(rawPoints * 0.2)) : Math.max(10, rawPoints);

    return {
      activityType,
      durationSeconds: clampedDuration,
      basePoints: Math.round(durationMin * this.BASELINE_SNS_PER_MIN),
      multiplier: Number((config.weight * performanceScoreMultiplier).toFixed(2)),
      finalPoints,
      apConsumed: config.apCost,
      isDailyCapped,
    };
  }

  /**
   * 보상 적립 후 일일 한도 누적 기록
   */
  public recordEarnedPoints(points: number): void {
    const today = new Date().toISOString().slice(0, 10);
    const key = `${this.CAP_STORAGE_KEY}_${today}`;
    try {
      const current = parseInt(localStorage.getItem(key) || '0', 10) || 0;
      localStorage.setItem(key, (current + points).toString());
    } catch {
      // ignore
    }
  }

  private getTodayEarnedSns(): number {
    const today = new Date().toISOString().slice(0, 10);
    const key = `${this.CAP_STORAGE_KEY}_${today}`;
    try {
      return parseInt(localStorage.getItem(key) || '0', 10) || 0;
    } catch {
      return 0;
    }
  }

  private saveStaminaState(state: StaminaState): void {
    try {
      localStorage.setItem(this.AP_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }
}
