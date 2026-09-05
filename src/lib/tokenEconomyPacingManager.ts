/**
 * tokenEconomyPacingManager.ts
 * 마켓플레이스 거래 수수료 5% 토큰 소각(Token Burn) 및 일일 퀘스트 스태미나 AP 페이싱 밸런스 매니저
 * (구글 스프레드시트 Row 882 / ID 554 요구사항 구현)
 */

export interface TokenBurnReport {
  burnedSns: number;
  remainingSellerSns: number;
  totalCumulativeBurned: number;
  timestamp: number;
}

export interface DailyQuestRewardStep {
  step: number;
  requiredQuestCount: number;
  rewardSns: number;
  staminaPotionCount: number;
  isClaimed: boolean;
}

export class TokenEconomyPacingManager {
  private static instance: TokenEconomyPacingManager;
  private readonly BURN_STORAGE_KEY = 'hero_total_burned_sns_v1';
  private readonly QUEST_PACING_KEY = 'hero_daily_quest_pacing_v1';
  private readonly BURN_RATE = 0.05; // 5% fee burn

  private constructor() {}

  public static getInstance(): TokenEconomyPacingManager {
    if (!TokenEconomyPacingManager.instance) {
      TokenEconomyPacingManager.instance = new TokenEconomyPacingManager();
    }
    return TokenEconomyPacingManager.instance;
  }

  /**
   * 거래 체결 시 5% 수수료 자동 소각 처리
   */
  public executeMarketTokenBurn(totalAmount: number): TokenBurnReport {
    const burnedSns = Math.max(1, Math.round(totalAmount * this.BURN_RATE));
    const remainingSellerSns = totalAmount - burnedSns;

    let cumulative = 0;
    try {
      cumulative = parseInt(localStorage.getItem(this.BURN_STORAGE_KEY) || '0', 10) || 0;
      cumulative += burnedSns;
      localStorage.setItem(this.BURN_STORAGE_KEY, cumulative.toString());
    } catch {
      cumulative = burnedSns;
    }

    return {
      burnedSns,
      remainingSellerSns,
      totalCumulativeBurned: cumulative,
      timestamp: Date.now(),
    };
  }

  public getCumulativeBurned(): number {
    try {
      return parseInt(localStorage.getItem(this.BURN_STORAGE_KEY) || '0', 10) || 0;
    } catch {
      return 0;
    }
  }

  /**
   * 일일 퀘스트 단계별 AP 포션 & SNS 포인트 보상 단계 조회
   */
  public getDailyQuestSteps(completedQuests: number): DailyQuestRewardStep[] {
    const today = new Date().toISOString().split('T')[0];
    let claimedSteps: number[] = [];

    try {
      const raw = localStorage.getItem(`${this.QUEST_PACING_KEY}_${today}`);
      if (raw) claimedSteps = JSON.parse(raw);
    } catch {
      // ignore
    }

    return [
      {
        step: 1,
        requiredQuestCount: 1,
        rewardSns: 30,
        staminaPotionCount: 1, // +20 AP
        isClaimed: claimedSteps.includes(1),
      },
      {
        step: 2,
        requiredQuestCount: 3,
        rewardSns: 60,
        staminaPotionCount: 1, // +20 AP
        isClaimed: claimedSteps.includes(2),
      },
      {
        step: 3,
        requiredQuestCount: 5,
        rewardSns: 120,
        staminaPotionCount: 2, // +40 AP
        isClaimed: claimedSteps.includes(3),
      },
    ];
  }

  /**
   * 일일 퀘스트 단계 보상 수령
   */
  public claimQuestStepReward(step: number, completedQuests: number): { success: boolean; grantedSns: number; grantedAp: number } {
    const steps = this.getDailyQuestSteps(completedQuests);
    const target = steps.find((s) => s.step === step);

    if (!target || target.isClaimed || completedQuests < target.requiredQuestCount) {
      return { success: false, grantedSns: 0, grantedAp: 0 };
    }

    const today = new Date().toISOString().split('T')[0];
    let claimedSteps: number[] = [];
    try {
      const raw = localStorage.getItem(`${this.QUEST_PACING_KEY}_${today}`);
      if (raw) claimedSteps = JSON.parse(raw);
      claimedSteps.push(step);
      localStorage.setItem(`${this.QUEST_PACING_KEY}_${today}`, JSON.stringify(claimedSteps));

      // SNS 포인트 입금
      const currentSns = parseInt(localStorage.getItem('hero_sns_point') || '0', 10) || 0;
      localStorage.setItem('hero_sns_point', (currentSns + target.rewardSns).toString());
    } catch (e) {
      console.error('Failed to claim quest step reward:', e);
    }

    return {
      success: true,
      grantedSns: target.rewardSns,
      grantedAp: target.staminaPotionCount * 20,
    };
  }
}

export const tokenEconomyPacingManager = TokenEconomyPacingManager.getInstance();
