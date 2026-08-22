/**
 * DynamicRewardCalibrator.ts
 * Dynamic SNS Point Reward Calibrator & Standardized Settlement Gateway
 * 
 * Rules:
 * - Scaled to ~50 SNS Points per minute played
 * - Duration Modes:
 *   • Quick Session (1m): ~50P - 100P
 *   • Standard Session (3m): ~150P - 250P
 *   • Extended/Endless Session (5m+): ~250P - 350P
 * - Difficulty Multipliers:
 *   • EASY: 0.8x
 *   • NORMAL: 1.0x
 *   • HARD: 1.3x
 *   • NIGHTMARE: 1.6x
 * - Calibrated Range Guarantee: Minimum 150P up to 350P for completed milestone missions
 * - Atomic LocalStorage persistence into `hero_user_stats` and `hero_sns_history`
 * - Real-time `hero_sns_updated` event notification
 */

import { RewardReceipt, calculateAndDepositMissionReward } from './standardizedRewardGateway';

export type MissionDifficulty = 'EASY' | 'NORMAL' | 'HARD' | 'NIGHTMARE';

export interface DynamicRewardOptions {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
  score: number;
  maxTargetScore?: number;
  isVictory?: boolean;
  difficulty?: MissionDifficulty;
  comboCount?: number;
  perfectClear?: boolean;
  enforceMilestoneTier?: boolean; // When true, guarantees 150P - 350P range for milestone games
}

export const DIFFICULTY_MULTIPLIERS: Record<MissionDifficulty, number> = {
  EASY: 0.8,
  NORMAL: 1.0,
  HARD: 1.3,
  NIGHTMARE: 1.6
};

/**
 * Calibrates and settles dynamic mission reward
 */
export function calibrateAndDepositReward(options: DynamicRewardOptions): RewardReceipt {
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
    enforceMilestoneTier = false
  } = options;

  const diffMult = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;

  // 1. Duration-based calculation (~50P / 60 seconds)
  const clampedDuration = Math.max(15, Math.min(600, durationSeconds));
  const durationMinutes = clampedDuration / 60;
  const baseReward = Math.round(durationMinutes * 50);

  // 2. Score Performance Ratio
  const scoreRatio = maxTargetScore > 0 ? Math.min(2.5, score / maxTargetScore) : 1.0;
  const scoreBonus = Math.round(baseReward * Math.min(1.6, scoreRatio * 0.7));

  // 3. Efficiency / Speed Bonus
  let speedBonus = 0;
  if (isVictory && clampedDuration <= 90) {
    speedBonus = Math.round(25 * (1 - clampedDuration / 90));
  }

  // 4. Combo / Perfect Multiplier
  let skillBonus = 0;
  if (perfectClear) {
    skillBonus += 40;
  }
  if (comboCount > 5) {
    skillBonus += Math.min(35, Math.round(comboCount * 2.5));
  }

  // 5. Total Raw Calculation
  const subtotal = baseReward + scoreBonus + speedBonus + skillBonus;
  let totalSns = Math.round(subtotal * diffMult);

  if (isVictory) {
    if (enforceMilestoneTier) {
      // Guaranteed 150P ~ 350P range for milestone tier
      totalSns = Math.max(150, Math.min(350, totalSns));
    } else {
      totalSns = Math.max(35, Math.min(350, totalSns));
    }
  } else {
    totalSns = Math.max(15, Math.min(90, Math.round(totalSns * 0.35)));
  }

  // Settle atomically via standardized gateway
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

  // If milestone tier adjustment differs, ensure accuracy
  if (receipt.totalSns !== totalSns && isVictory && enforceMilestoneTier) {
    receipt.totalSns = totalSns;
  }

  return receipt;
}
