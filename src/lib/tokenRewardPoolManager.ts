/**
 * tokenRewardPoolManager.ts
 * 마켓플레이스 거래 수수료 환급 및 일일 활동 통합 SNS 토큰 마일리지 리워드 풀 연동
 * (구글 스프레드시트 Row 1014 / ID 554 요구사항 구현)
 */

export interface RewardPoolState {
  treasuryPoolSns: number;       // 거래소 수수료 50% 누적 금고
  totalDistributedSns: number;   // 지금까지 유저에게 분배된 총량
  dailyMilestones: {
    loginClaimed: boolean;
    deckShareClaimed: boolean;
    pvpMatchClaimed: boolean;
  };
  lastDate: string;
}

export class TokenRewardPoolManager {
  private static instance: TokenRewardPoolManager;
  private readonly STORAGE_KEY = 'hero_token_reward_pool_v1';
  private readonly HISTORY_KEY = 'hero_sns_history';
  private readonly POINT_KEY = 'hero_sns_point';

  private constructor() {}

  public static getInstance(): TokenRewardPoolManager {
    if (!TokenRewardPoolManager.instance) {
      TokenRewardPoolManager.instance = new TokenRewardPoolManager();
    }
    return TokenRewardPoolManager.instance;
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  public getState(): RewardPoolState {
    const today = this.getTodayKey();
    let state: RewardPoolState = {
      treasuryPoolSns: 25000,
      totalDistributedSns: 12400,
      dailyMilestones: {
        loginClaimed: false,
        deckShareClaimed: false,
        pvpMatchClaimed: false,
      },
      lastDate: today,
    };

    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.lastDate === today) {
          state = parsed;
        } else {
          // 날짜 변경 시 일일 마일스톤 리셋
          state = {
            treasuryPoolSns: parsed.treasuryPoolSns || 25000,
            totalDistributedSns: parsed.totalDistributedSns || 12400,
            dailyMilestones: { loginClaimed: false, deckShareClaimed: false, pvpMatchClaimed: false },
            lastDate: today,
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
   * 마켓플레이스 거래 완료 시 수수료 5% 중 50%를 캐시백 풀에 적립
   */
  public contributeTradingFee(feeAmountSns: number): number {
    const poolContribution = Math.round(feeAmountSns * 0.5);
    const state = this.getState();
    state.treasuryPoolSns += poolContribution;
    this.saveState(state);
    return poolContribution;
  }

  /**
   * 활동별 마일스톤 보상 수령 (로그인, 덱 공유, PvP 매칭)
   */
  public claimActivityMilestone(activity: 'login' | 'deck_share' | 'pvp_match'): { success: boolean; rewardSns: number; message: string } {
    const state = this.getState();
    const REWARDS = {
      login: 50,
      deck_share: 30,
      pvp_match: 40,
    };

    const isClaimedKey = `${activity}Claimed` as keyof typeof state.dailyMilestones;
    if (state.dailyMilestones[isClaimedKey]) {
      return { success: false, rewardSns: 0, message: '이미 오늘 수령한 마일스톤입니다.' };
    }

    const reward = REWARDS[activity];
    state.dailyMilestones[isClaimedKey] = true;
    state.treasuryPoolSns = Math.max(0, state.treasuryPoolSns - reward);
    state.totalDistributedSns += reward;
    this.saveState(state);

    // 유저 지갑에 원자적 입금
    try {
      const current = parseInt(localStorage.getItem(this.POINT_KEY) || '0', 10) || 0;
      const updated = current + reward;
      localStorage.setItem(this.POINT_KEY, updated.toString());

      const historyRaw = localStorage.getItem(this.HISTORY_KEY);
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      history.unshift({
        id: `tx_pool_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'pool_cashback_milestone',
        amount: reward,
        description: `[활동 마일스톤] ${activity === 'login' ? '일일 출석' : activity === 'deck_share' ? '덱 공유' : 'PvP 매칭'} 보상 (+${reward} SNS)`,
        timestamp: Date.now(),
        previousBalance: current,
        newBalance: updated,
      });
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history.slice(0, 100)));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('hero_sns_point_changed', {
            detail: { newBalance: updated, diff: reward, reason: 'pool_milestone' },
          })
        );
      }
    } catch {
      // ignore
    }

    return {
      success: true,
      rewardSns: reward,
      message: `${reward} SNS 보상이 지갑으로 지급되었습니다!`,
    };
  }

  private saveState(state: RewardPoolState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }
}
