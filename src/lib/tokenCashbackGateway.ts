/**
 * tokenCashbackGateway.ts
 * 마켓플레이스 거래 수수료 커뮤니티 환원 & 일일 무료 스태미나(AP) 3회 충전 게이트웨이
 * (구글 스프레드시트 Row 841 / ID 562 요구사항 구현)
 */

export interface DailyApState {
  date: string;
  refillsUsed: number;
  maxRefills: number; // 3
  currentAp: number;
  maxAp: number; // 100
}

export class TokenCashbackGateway {
  private static instance: TokenCashbackGateway;
  private readonly POOL_KEY = 'hero_community_reward_pool';
  private readonly AP_KEY = 'hero_daily_free_ap_v1';

  private constructor() {}

  public static getInstance(): TokenCashbackGateway {
    if (!TokenCashbackGateway.instance) {
      TokenCashbackGateway.instance = new TokenCashbackGateway();
    }
    return TokenCashbackGateway.instance;
  }

  private getTodayDate(): string {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  /**
   * 마켓플레이스 거래 수수료의 50%를 커뮤니티 보상 풀로 적립
   */
  public poolTransactionFee(feeAmount: number): number {
    const pooled = Math.round(feeAmount * 0.5);
    try {
      const current = parseInt(localStorage.getItem(this.POOL_KEY) || '0', 10) || 0;
      const next = current + pooled;
      localStorage.setItem(this.POOL_KEY, next.toString());
      return next;
    } catch {
      return pooled;
    }
  }

  /**
   * 현재 커뮤니티 누적 환원 보상 풀 잔액 조회
   */
  public getCommunityPoolBalance(): number {
    try {
      return parseInt(localStorage.getItem(this.POOL_KEY) || '5000', 10) || 5000;
    } catch {
      return 5000;
    }
  }

  /**
   * 일일 무료 스태미나(AP) 상태 조회
   */
  public getDailyApState(): DailyApState {
    const today = this.getTodayDate();
    try {
      const raw = localStorage.getItem(this.AP_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === today) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    const initial: DailyApState = {
      date: today,
      refillsUsed: 0,
      maxRefills: 3,
      currentAp: 100,
      maxAp: 100,
    };
    try {
      localStorage.setItem(this.AP_KEY, JSON.stringify(initial));
    } catch {
      // ignore
    }
    return initial;
  }

  /**
   * 매일 3회 무료 스태미나 충전 (+50 AP)
   */
  public claimFreeApRefill(): { success: boolean; newAp: number; remainingRefills: number } {
    const state = this.getDailyApState();
    if (state.refillsUsed >= state.maxRefills) {
      return { success: false, newAp: state.currentAp, remainingRefills: 0 };
    }

    state.refillsUsed += 1;
    state.currentAp = Math.min(state.maxAp, state.currentAp + 50);

    try {
      localStorage.setItem(this.AP_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }

    return {
      success: true,
      newAp: state.currentAp,
      remainingRefills: state.maxRefills - state.refillsUsed,
    };
  }
}

export const tokenCashbackGateway = TokenCashbackGateway.getInstance();
