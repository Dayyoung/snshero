/**
 * tokenEconomyService.ts
 * 마켓플레이스 거래 수수료 50% 환원 및 실시간 AP 자연 회복 (5분당 1 AP) 엔진
 * (구글 스프레드시트 Row 1022 / ID 562 요구사항 구현)
 */


export interface TokenEconomyState {
  marketFeeRate: number;         // 마켓 기본 수수료율 (5% = 0.05)
  poolCashbackRatio: number;     // 수수료 중 환원 비율 (50% = 0.50)
  totalMarketFeesAccumulated: number;
  missionRewardPoolBalance: number;  // 일일 미션 환원 보상 풀 잔여액 (SNS)
  lastApRecoveryTimestamp: number;   // 마지막 AP 회복 시각 (ms)
}

const AP_RECOVERY_INTERVAL_MS = 5 * 60 * 1000; // 5분 = 300,000ms
const MAX_STAMINA_AP = 100;
const STORAGE_KEY = 'hero_token_economy_state_v1';

export class TokenEconomyService {
  private static instance: TokenEconomyService;

  private constructor() {
    this.ensureInitialized();
  }

  public static getInstance(): TokenEconomyService {
    if (!TokenEconomyService.instance) {
      TokenEconomyService.instance = new TokenEconomyService();
    }
    return TokenEconomyService.instance;
  }

  private ensureInitialized(): void {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: TokenEconomyState = {
        marketFeeRate: 0.05,
        poolCashbackRatio: 0.50,
        totalMarketFeesAccumulated: 2500,
        missionRewardPoolBalance: 1250,
        lastApRecoveryTimestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }
  }

  public getState(): TokenEconomyState {
    if (typeof window === 'undefined') {
      return {
        marketFeeRate: 0.05,
        poolCashbackRatio: 0.50,
        totalMarketFeesAccumulated: 2500,
        missionRewardPoolBalance: 1250,
        lastApRecoveryTimestamp: Date.now(),
      };
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // parse error fallback
    }
    return {
      marketFeeRate: 0.05,
      poolCashbackRatio: 0.50,
      totalMarketFeesAccumulated: 2500,
      missionRewardPoolBalance: 1250,
      lastApRecoveryTimestamp: Date.now(),
    };
  }

  public saveState(state: TokenEconomyState): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage quota or error
    }
  }

  /**
   * 마켓플레이스 거래 수수료 계산 및 50% 일일 미션 보상 풀 환원 파이프라인
   */
  public processMarketTradeFee(tradeAmount: number): {
    feeAmount: number;
    redistributedAmount: number;
    newPoolBalance: number;
  } {
    const state = this.getState();
    const feeAmount = Math.max(1, Math.round(tradeAmount * state.marketFeeRate));
    const redistributedAmount = Math.max(1, Math.round(feeAmount * state.poolCashbackRatio));

    state.totalMarketFeesAccumulated += feeAmount;
    state.missionRewardPoolBalance += redistributedAmount;
    this.saveState(state);

    return {
      feeAmount,
      redistributedAmount,
      newPoolBalance: state.missionRewardPoolBalance,
    };
  }

  /**
   * 실시간 AP 자연 회복 (5분당 1 AP) 계산
   */
  public getApRecoveryTelemetry(currentAp: number, maxAp = MAX_STAMINA_AP): {
    currentAp: number;
    maxAp: number;
    secondsUntilNext: number;
    progressPct: number;
    formattedCountdown: string;
  } {
    const state = this.getState();
    const now = Date.now();
    const elapsed = now - state.lastApRecoveryTimestamp;

    // 회복 완료 가능한 AP 계산
    const recoveredPoints = Math.floor(elapsed / AP_RECOVERY_INTERVAL_MS);
    let updatedAp = currentAp;

    if (recoveredPoints > 0 && currentAp < maxAp) {
      updatedAp = Math.min(maxAp, currentAp + recoveredPoints);
      state.lastApRecoveryTimestamp = now - (elapsed % AP_RECOVERY_INTERVAL_MS);
      this.saveState(state);
    }

    if (updatedAp >= maxAp) {
      return {
        currentAp: maxAp,
        maxAp,
        secondsUntilNext: 0,
        progressPct: 100,
        formattedCountdown: 'MAX',
      };
    }

    const remainderMs = elapsed % AP_RECOVERY_INTERVAL_MS;
    const msUntilNext = AP_RECOVERY_INTERVAL_MS - remainderMs;
    const secondsUntilNext = Math.ceil(msUntilNext / 1000);
    const progressPct = Math.min(100, Math.max(0, (remainderMs / AP_RECOVERY_INTERVAL_MS) * 100));

    const minutes = Math.floor(secondsUntilNext / 60);
    const seconds = secondsUntilNext % 60;
    const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return {
      currentAp: updatedAp,
      maxAp,
      secondsUntilNext,
      progressPct,
      formattedCountdown,
    };
  }
}
