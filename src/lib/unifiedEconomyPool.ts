/**
 * unifiedEconomyPool.ts
 * 거래소 수수료 일부를 일일 미션 및 PvP 보상으로 환원하는 'SNS 토큰 분배 밸런스 풀'
 * (구글 스프레드시트 Row 926 / ID 554 요구사항 구현)
 */

export interface TokenEconomyPoolState {
  totalAccumulatedFeeSns: number;   // 거래소 누적 수수료 (5%)
  burnedSns: number;                // 영구 소각된 토큰량 (40%)
  pvpRewardPoolSns: number;         // PvP 매칭 보상 배당 풀 (30%)
  missionDividendPoolSns: number;   // 미션 게임 일일 배당 풀 (30%)
  lastDistributedTimestamp: number;
}

export class UnifiedEconomyPool {
  private static instance: UnifiedEconomyPool;
  private readonly STORAGE_KEY = 'hero_token_pool_v1';

  private constructor() {}

  public static getInstance(): UnifiedEconomyPool {
    if (!UnifiedEconomyPool.instance) {
      UnifiedEconomyPool.instance = new UnifiedEconomyPool();
    }
    return UnifiedEconomyPool.instance;
  }

  public getPoolState(): TokenEconomyPoolState {
    let state: TokenEconomyPoolState = {
      totalAccumulatedFeeSns: 10000,
      burnedSns: 4000,
      pvpRewardPoolSns: 3000,
      missionDividendPoolSns: 3000,
      lastDistributedTimestamp: Date.now(),
    };

    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        state = JSON.parse(raw);
      }
    } catch {
      // fallback
    }

    return state;
  }

  /**
   * 마켓플레이스 거래 성사 시 5% 수수료 분배 반영
   */
  public ingestMarketplaceFee(tradeAmountSns: number): TokenEconomyPoolState {
    const fee = Math.round(tradeAmountSns * 0.05);
    const state = this.getPoolState();

    const burnAmount = Math.round(fee * 0.4);
    const pvpAmount = Math.round(fee * 0.3);
    const missionAmount = fee - burnAmount - pvpAmount;

    state.totalAccumulatedFeeSns += fee;
    state.burnedSns += burnAmount;
    state.pvpRewardPoolSns += pvpAmount;
    state.missionDividendPoolSns += missionAmount;

    this.saveState(state);
    return state;
  }

  /**
   * 미션 클리어 또는 PvP 승리 시 풀에서 배당 보너스 인출
   */
  public drawDividendBonus(type: 'mission' | 'pvp'): number {
    const state = this.getPoolState();
    let bonus = 0;

    if (type === 'mission' && state.missionDividendPoolSns > 10) {
      bonus = Math.min(25, Math.round(state.missionDividendPoolSns * 0.01));
      state.missionDividendPoolSns -= bonus;
    } else if (type === 'pvp' && state.pvpRewardPoolSns > 20) {
      bonus = Math.min(50, Math.round(state.pvpRewardPoolSns * 0.02));
      state.pvpRewardPoolSns -= bonus;
    }

    if (bonus > 0) {
      this.saveState(state);
    }
    return bonus;
  }

  private saveState(state: TokenEconomyPoolState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }
}
