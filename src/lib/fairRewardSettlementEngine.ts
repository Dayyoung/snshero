/**
 * FairRewardSettlementEngine.ts
 * Standardized Fair SNS Point Reward Settlement Engine for all Mission Games
 * 
 * Rules:
 * - Normalized reward standard (~50 SNS Points / minute played)
 * - Duration Modes:
 *   • Quick Session (1m): ~50P - 100P
 *   • Standard Session (3m): ~150P - 250P
 *   • Extended/Endless Session (5m+): ~250P - 350P
 * - Difficulty Multipliers:
 *   • EASY: 0.8x
 *   • NORMAL: 1.0x
 *   • HARD: 1.3x
 *   • NIGHTMARE: 1.6x
 * - Atomic LocalStorage persistence into `hero_user_stats` and `hero_sns_history`
 * - Real-time `hero_sns_updated` custom event dispatch for instant UI updates
 */

import { RewardReceipt, calculateAndDepositMissionReward } from './standardizedRewardGateway';

export type FairDifficulty = 'EASY' | 'NORMAL' | 'HARD' | 'NIGHTMARE';

export interface FairSettlementOptions {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
  score: number;
  maxTargetScore?: number;
  isVictory?: boolean;
  difficulty?: FairDifficulty;
  comboCount?: number;
  perfectClear?: boolean;
  milestoneTierBonus?: boolean;
}

export const FAIR_DIFFICULTY_FACTORS: Record<FairDifficulty, number> = {
  EASY: 0.8,
  NORMAL: 1.0,
  HARD: 1.3,
  NIGHTMARE: 1.6
};

/**
 * Executes standardized atomic wallet settlement for any mission game
 */
export function settleFairMissionReward(options: FairSettlementOptions): RewardReceipt {
  const {
    gameId,
    gameTitle,
    durationSeconds = 60,
    score = 0,
    maxTargetScore = 1000,
    isVictory = true,
    difficulty = 'NORMAL',
    comboCount = 0,
    perfectClear = false,
    milestoneTierBonus = false
  } = options;

  const clampedDuration = Math.max(15, Math.min(600, durationSeconds));
  const diffFactor = FAIR_DIFFICULTY_FACTORS[difficulty] || 1.0;

  // Base Duration Rate (~50P per 60s)
  const baseReward = Math.round((clampedDuration / 60) * 50);

  // Score Bonus
  const scoreRatio = maxTargetScore > 0 ? Math.min(2.5, score / maxTargetScore) : 1.0;
  const scoreBonus = Math.round(baseReward * Math.min(1.5, scoreRatio * 0.6));

  // Time / Speedrun Bonus
  let timeBonus = 0;
  if (isVictory && clampedDuration <= 90) {
    timeBonus = Math.round(20 * (1 - clampedDuration / 90));
  }

  // Perfect / Combo Bonus
  let perfectBonus = 0;
  if (perfectClear) {
    perfectBonus = 35;
  } else if (comboCount > 5) {
    perfectBonus = Math.min(30, Math.round(comboCount * 2));
  }

  // Calculate Subtotal & Multipliers
  let totalSns = Math.round((baseReward + scoreBonus + timeBonus + perfectBonus) * diffFactor);

  if (isVictory) {
    if (milestoneTierBonus) {
      totalSns = Math.max(150, Math.min(350, totalSns));
    } else {
      totalSns = Math.max(35, Math.min(350, totalSns));
    }
  } else {
    totalSns = Math.max(15, Math.min(80, Math.round(totalSns * 0.35)));
  }

  // Deposit atomically via standardized gateway
  const receipt = calculateAndDepositMissionReward({
    gameId,
    gameTitle,
    durationSeconds: clampedDuration,
    score,
    maxTargetScore,
    isVictory,
    difficulty,
    comboCount,
    perfectClear
  });

  if (receipt.totalSns !== totalSns && isVictory && milestoneTierBonus) {
    receipt.totalSns = totalSns;
  }

  return receipt;
}
