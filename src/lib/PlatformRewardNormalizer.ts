/**
 * PlatformRewardNormalizer.ts
 * 전 플랫폼 활동 대상 '분당 50P 표준 SNS 포인트 정규화 및 원자적 입금 게이트웨이'
 * (구글 스프레드시트 Row 1038 / ID 550 & Row 1043 / ID 551 요구사항 구현)
 */

import { getUserSnsBalance, SnsHistoryItem } from './rewardSettlementService';
import { PlatformActivityType } from './platformEconomyNormalizer';

export interface RewardBreakdown {
  activity: string;
  durationSeconds: number;
  baseReward: number;
  difficultyBonus: number;
  skillMultiplierBonus: number;
  totalAwarded: number;
  newBalance: number;
  timestamp: number;
}

export class PlatformRewardNormalizer {
  private static instance: PlatformRewardNormalizer;
  private readonly BASE_RATE_PER_MINUTE = 50; // 분당 50 SNS 포인트 기본

  private constructor() {}

  public static getInstance(): PlatformRewardNormalizer {
    if (!PlatformRewardNormalizer.instance) {
      PlatformRewardNormalizer.instance = new PlatformRewardNormalizer();
    }
    return PlatformRewardNormalizer.instance;
  }

  /**
   * 활동 시간, 난이도, 스킬 콤보에 기반하여 분당 50P 기준 정규화된 보상 산출 및 원자적 입금
   */
  public settleActivityReward(
    activityType: PlatformActivityType,
    durationSeconds: number,
    options: {
      difficultyMultiplier?: number;
      skillBonusMultiplier?: number;
      activityName?: string;
    } = {}
  ): RewardBreakdown {
    const diffMult = options.difficultyMultiplier ?? 1.0;
    const skillMult = options.skillBonusMultiplier ?? 1.0;
    const activityName = options.activityName || activityType;

    // 분당 50P 계산 (최소 10초 보장)
    const effectiveSec = Math.max(10, durationSeconds);
    const rawMinutes = effectiveSec / 60;
    const baseReward = Math.max(5, Math.round(rawMinutes * this.BASE_RATE_PER_MINUTE));

    // 난이도 및 스킬 가산점 계산
    const difficultyBonus = Math.round(baseReward * (diffMult - 1));
    const skillMultiplierBonus = Math.round(baseReward * (skillMult - 1));
    const totalAwarded = Math.max(5, baseReward + difficultyBonus + skillMultiplierBonus);

    // 원자적 지갑 입금
    let newBalance = getUserSnsBalance() + totalAwarded;
    try {
      if (typeof window !== 'undefined') {
        const rawStats = localStorage.getItem('hero_user_stats');
        const stats = rawStats ? JSON.parse(rawStats) : {};
        stats.sns = (stats.sns || 0) + totalAwarded;
        newBalance = stats.sns;
        localStorage.setItem('hero_user_stats', JSON.stringify(stats));

        const rawHistory = localStorage.getItem('hero_sns_history');
        let history: SnsHistoryItem[] = rawHistory ? JSON.parse(rawHistory) : [];
        history.unshift({
          id: `norm-rw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: 'GAME_REWARD',
          title: `[표준 정규화 보상] ${activityName}`,
          amount: totalAwarded,
          timestamp: Date.now(),
          details: `소요시간: ${Math.round(effectiveSec)}s | 기본: ${baseReward}P + 난이도: ${difficultyBonus}P + 스킬: ${skillMultiplierBonus}P`,
        });
        if (history.length > 100) history = history.slice(0, 100);
        localStorage.setItem('hero_sns_history', JSON.stringify(history));

        window.dispatchEvent(
          new CustomEvent('hero_sns_updated', {
            detail: {
              amount: totalAwarded,
              newBalance,
              activity: activityName,
            },
          })
        );
      }
    } catch (err) {
      console.error('Failed atomic reward deposit:', err);
    }

    return {
      activity: activityName,
      durationSeconds: effectiveSec,
      baseReward,
      difficultyBonus,
      skillMultiplierBonus,
      totalAwarded,
      newBalance,
      timestamp: Date.now(),
    };
  }

  /**
   * 현재 지갑 잔액 조회
   */
  public getBalance(): number {
    return getUserSnsBalance();
  }
}
