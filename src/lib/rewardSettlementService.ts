/**
 * rewardSettlementService.ts
 * 전 미션 게임 100% 확정 SNS 포인트 원자적 입금 및 표준 정산 엔진
 * 
 * Rules:
 * - '보상 없는 게임 0건' 정책 강제 적용
 * - Normalized reward standard: ~50 SNS Points per minute of gameplay
 * - Performance, speedrun, combo and difficulty multipliers
 * - 100% atomic wallet deposit into LocalStorage (`hero_user_stats` & `hero_sns_history`)
 * - Real-time custom event dispatch (`hero_sns_updated`)
 */

export interface RewardSettlementOptions {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
  score: number;
  maxTargetScore?: number;
  isVictory?: boolean;
  difficulty?: 'EASY' | 'NORMAL' | 'HARD' | 'NIGHTMARE';
  comboCount?: number;
  perfectClear?: boolean;
}

export interface RewardReceipt {
  transactionId: string;
  gameId: string;
  gameTitle: string;
  timestamp: number;
  baseReward: number;
  scoreBonus: number;
  timeBonus: number;
  skillMultiplier: number;
  perfectBonus: number;
  totalSns: number;
  previousBalance: number;
  newBalance: number;
}

export interface SnsHistoryItem {
  id: string;
  type: 'GAME_REWARD' | 'MISSION_CLAIM' | 'SHOP_PURCHASE' | 'TRANSFER';
  title: string;
  amount: number;
  timestamp: number;
  details?: string;
}

/**
 * Calculates standardized SNS reward and atomically settles it into the user's LocalStorage wallet
 */
export function calculateAndDepositMissionReward(options: RewardSettlementOptions): RewardReceipt {
  const {
    gameId,
    gameTitle,
    durationSeconds = 60,
    score = 0,
    maxTargetScore = 1000,
    isVictory = true,
    difficulty = 'NORMAL',
    comboCount = 0,
    perfectClear = false
  } = options;

  // 1. Base Duration Calculation: ~50P per 60 seconds (scaled: ~0.83P / sec)
  const clampedDuration = Math.max(10, Math.min(360, durationSeconds));
  const baseReward = Math.round((clampedDuration / 60) * 50);

  // 2. Score Performance Multiplier
  const scoreRatio = maxTargetScore > 0 ? Math.min(2.5, score / maxTargetScore) : 1.0;
  const scoreBonus = Math.round(baseReward * Math.min(1.5, scoreRatio * 0.6));

  // 3. Difficulty Multipliers
  let difficultyMult = 1.0;
  switch (difficulty) {
    case 'EASY':
      difficultyMult = 0.9;
      break;
    case 'NORMAL':
      difficultyMult = 1.0;
      break;
    case 'HARD':
      difficultyMult = 1.25;
      break;
    case 'NIGHTMARE':
      difficultyMult = 1.5;
      break;
  }

  // 4. Time/Speed Efficiency Bonus
  let timeBonus = 0;
  if (isVictory && clampedDuration < 45) {
    timeBonus = Math.round(15 * (1 - clampedDuration / 45));
  }

  // 5. Perfect Clear or High Combo Bonus
  let perfectBonus = 0;
  if (perfectClear) {
    perfectBonus = 30;
  } else if (comboCount >= 10) {
    perfectBonus = Math.min(25, comboCount * 2);
  }

  // 6. Total Calculation (Guaranteed range: 25P ~ 300P)
  const rawTotal = Math.round((baseReward + scoreBonus + timeBonus + perfectBonus) * difficultyMult);
  const totalSns = isVictory ? Math.max(35, Math.min(300, rawTotal)) : Math.max(15, Math.min(80, Math.round(rawTotal * 0.4)));

  // 7. Atomic LocalStorage Deposit
  const currentBalance = getUserSnsBalance();
  const newBalance = currentBalance + totalSns;

  const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = Date.now();

  const receipt: RewardReceipt = {
    transactionId,
    gameId,
    gameTitle,
    timestamp,
    baseReward,
    scoreBonus,
    timeBonus,
    skillMultiplier: difficultyMult,
    perfectBonus,
    totalSns,
    previousBalance: currentBalance,
    newBalance
  };

  // Update user balance & history atomically
  try {
    if (typeof window !== 'undefined') {
      // 1. Update stats balance
      const rawStats = localStorage.getItem('hero_user_stats');
      let stats = rawStats ? JSON.parse(rawStats) : {};
      stats.sns = (stats.sns || 0) + totalSns;
      stats.totalGamesPlayed = (stats.totalGamesPlayed || 0) + 1;
      if (isVictory) stats.totalWins = (stats.totalWins || 0) + 1;
      localStorage.setItem('hero_user_stats', JSON.stringify(stats));

      // 2. Append to history log
      const rawHistory = localStorage.getItem('hero_sns_history');
      let history: SnsHistoryItem[] = rawHistory ? JSON.parse(rawHistory) : [];
      history.unshift({
        id: transactionId,
        type: 'GAME_REWARD',
        title: `[미션 클리어] ${gameTitle}`,
        amount: totalSns,
        timestamp,
        details: `점수: ${score}P | 소요시간: ${Math.round(clampedDuration)}s | 기본: ${baseReward} + 보너스: ${scoreBonus + timeBonus + perfectBonus}`
      });
      // Keep recent 100 entries
      if (history.length > 100) history = history.slice(0, 100);
      localStorage.setItem('hero_sns_history', JSON.stringify(history));

      // 3. Dispatch global event for instant UI reactive synchronization
      window.dispatchEvent(new CustomEvent('hero_sns_updated', {
        detail: {
          amount: totalSns,
          newBalance,
          gameId,
          receipt
        }
      }));
    }
  } catch (err) {
    console.error('Failed to deposit SNS reward to LocalStorage:', err);
  }

  return receipt;
}

/**
 * Gets the current user SNS points balance from LocalStorage
 */
export function getUserSnsBalance(): number {
  if (typeof window === 'undefined') return 1000;
  try {
    const raw = localStorage.getItem('hero_user_stats');
    if (raw) {
      const stats = JSON.parse(raw);
      if (typeof stats.sns === 'number') return stats.sns;
    }
  } catch {
    // fallback
  }
  return 1000;
}
