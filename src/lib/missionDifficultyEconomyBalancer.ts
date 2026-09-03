/**
 * missionDifficultyEconomyBalancer.ts
 * 미션 플레이 시간별(1분/3분/5분) 기대 수익 밸런싱 및 티어별 SNS 포인트 가산 엔진
 * (구글 스프레드시트 Row 810 / ID 563 요구사항 구현)
 */

export type MissionDurationTier = 'BLITZ_1MIN' | 'STANDARD_3MIN' | 'ENDURANCE_5MIN';

export interface BalancedPayoutMetric {
  tier: MissionDurationTier;
  expectedDurationSec: number;
  baseRatePerMin: number; // 50~65P baseline
  targetPayout: number;
  masteryBonus: number;
  totalEstimatedPayout: number;
  efficiencyRating: 'STANDARD' | 'EXCELLENT' | 'LEGENDARY';
}

export class MissionDifficultyEconomyBalancer {
  private static instance: MissionDifficultyEconomyBalancer;

  private constructor() {}

  public static getInstance(): MissionDifficultyEconomyBalancer {
    if (!MissionDifficultyEconomyBalancer.instance) {
      MissionDifficultyEconomyBalancer.instance = new MissionDifficultyEconomyBalancer();
    }
    return MissionDifficultyEconomyBalancer.instance;
  }

  /**
   * 지속 시간에 따른 지속 시간 티어 판별
   */
  public getDurationTier(durationSeconds: number): MissionDurationTier {
    if (durationSeconds <= 90) return 'BLITZ_1MIN';
    if (durationSeconds <= 210) return 'STANDARD_3MIN';
    return 'ENDURANCE_5MIN';
  }

  /**
   * 지속 시간과 완료 성과(score, combo)에 따른 정밀 밸런싱 보상 산출
   */
  public calculateBalancedPayout(
    durationSeconds: number,
    isVictory: boolean = true,
    score: number = 0,
    maxCombo: number = 0
  ): BalancedPayoutMetric {
    const tier = this.getDurationTier(durationSeconds);

    let baseRatePerMin = 50;
    let durationMultiplier = durationSeconds / 60;

    switch (tier) {
      case 'BLITZ_1MIN':
        baseRatePerMin = 55; // 빠른 회전율 보장
        break;
      case 'STANDARD_3MIN':
        baseRatePerMin = 58;
        break;
      case 'ENDURANCE_5MIN':
        baseRatePerMin = 65; // 장기전 피로도 보상 가산
        break;
    }

    const rawBase = Math.round(durationMultiplier * baseRatePerMin);
    const targetPayout = isVictory ? Math.max(25, rawBase) : Math.max(15, Math.round(rawBase * 0.3));

    // 장기전 완주 마스터리 보너스 & 콤보 가산
    let masteryBonus = 0;
    if (isVictory) {
      if (tier === 'ENDURANCE_5MIN') {
        masteryBonus += 35; // 지구력 완주 팡파레 보너스
      } else if (tier === 'STANDARD_3MIN') {
        masteryBonus += 15;
      }
      if (maxCombo >= 15) {
        masteryBonus += Math.min(25, Math.floor(maxCombo * 1.5));
      }
    }

    const totalEstimatedPayout = targetPayout + masteryBonus;

    let efficiencyRating: 'STANDARD' | 'EXCELLENT' | 'LEGENDARY' = 'STANDARD';
    if (totalEstimatedPayout >= 180) {
      efficiencyRating = 'LEGENDARY';
    } else if (totalEstimatedPayout >= 90) {
      efficiencyRating = 'EXCELLENT';
    }

    return {
      tier,
      expectedDurationSec: durationSeconds,
      baseRatePerMin,
      targetPayout,
      masteryBonus,
      totalEstimatedPayout,
      efficiencyRating,
    };
  }
}

export const missionDifficultyEconomyBalancer = MissionDifficultyEconomyBalancer.getInstance();
