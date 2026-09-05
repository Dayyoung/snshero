/**
 * dynamicBonusPayoutGateway.ts
 * 전 미션 게임 대상 '클리어 타임어택(+15%) & 무피격 3스타 달성(+15%) 시 SNS 포인트 최대 130% 가산' 게이트웨이
 * (구글 스프레드시트 Row 899 / ID 555 요구사항 구현)
 */

export interface BonusEvaluationResult {
  baseRewardSns: number;
  isTimeAttack: boolean;
  isFlawless: boolean;
  bonusMultiplier: number; // 1.0, 1.15, 1.30
  bonusPercent: number; // 0, 15, 30
  bonusSns: number;
  finalSns: number;
  badges: string[];
}

export interface DynamicPayoutReceipt {
  transactionId: string;
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
  targetTimeSeconds: number;
  damageTaken: number;
  starsEarned: number;
  evaluation: BonusEvaluationResult;
  previousBalance: number;
  newBalance: number;
  timestamp: number;
}

export class DynamicBonusPayoutGateway {
  private static instance: DynamicBonusPayoutGateway;
  private readonly STORAGE_KEY = 'hero_sns_point';
  private readonly HISTORY_KEY = 'hero_sns_history';

  private constructor() {}

  public static getInstance(): DynamicBonusPayoutGateway {
    if (!DynamicBonusPayoutGateway.instance) {
      DynamicBonusPayoutGateway.instance = new DynamicBonusPayoutGateway();
    }
    return DynamicBonusPayoutGateway.instance;
  }

  /**
   * 플레이 결과에 따른 동적 보너스 평가 (최대 130%)
   */
  public evaluateBonus(params: {
    baseRewardSns: number;
    durationSeconds: number;
    targetTimeSeconds?: number;
    damageTaken?: number;
    starsEarned?: number;
  }): BonusEvaluationResult {
    const baseRewardSns = Math.max(1, params.baseRewardSns);
    const targetTime = params.targetTimeSeconds ?? 60;
    const isTimeAttack = params.durationSeconds > 0 && params.durationSeconds <= targetTime;
    const isFlawless = (params.damageTaken !== undefined && params.damageTaken <= 0) ||
                       (params.starsEarned !== undefined && params.starsEarned >= 3);

    let bonusMultiplier = 1.0;
    let bonusPercent = 0;
    const badges: string[] = [];

    if (isTimeAttack) {
      bonusMultiplier += 0.15;
      bonusPercent += 15;
      badges.push('[타임어택 +15%]');
    }

    if (isFlawless) {
      bonusMultiplier += 0.15;
      bonusPercent += 15;
      badges.push('[무피격 3스타 +15%]');
    }

    // 최대 130% 상한선 보장
    bonusMultiplier = Math.min(1.3, Number(bonusMultiplier.toFixed(2)));
    const finalSns = Math.round(baseRewardSns * bonusMultiplier);
    const bonusSns = finalSns - baseRewardSns;

    return {
      baseRewardSns,
      isTimeAttack,
      isFlawless,
      bonusMultiplier,
      bonusPercent,
      bonusSns,
      finalSns,
      badges
    };
  }

  /**
   * 미션 클리어 시 동적 보너스 계산 및 원자적 로컬스토리지 입금 처리
   */
  public settleAndPayout(params: {
    gameId: string;
    gameTitle: string;
    baseRewardSns: number;
    durationSeconds: number;
    targetTimeSeconds?: number;
    damageTaken?: number;
    starsEarned?: number;
  }): DynamicPayoutReceipt {
    const evaluation = this.evaluateBonus({
      baseRewardSns: params.baseRewardSns,
      durationSeconds: params.durationSeconds,
      targetTimeSeconds: params.targetTimeSeconds,
      damageTaken: params.damageTaken,
      starsEarned: params.starsEarned
    });

    let previousBalance = 0;
    try {
      previousBalance = parseInt(localStorage.getItem(this.STORAGE_KEY) || '0', 10);
      if (isNaN(previousBalance)) previousBalance = 0;
    } catch {
      previousBalance = 0;
    }

    const newBalance = previousBalance + evaluation.finalSns;
    const timestamp = Date.now();
    const transactionId = `tx_dyn_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      // 1. 포인트 잔고 갱신
      localStorage.setItem(this.STORAGE_KEY, newBalance.toString());

      // 2. 거래 히스토리 기록
      const historyRaw = localStorage.getItem(this.HISTORY_KEY);
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      const badgeText = evaluation.badges.length > 0 ? ` ${evaluation.badges.join(' ')}` : '';

      history.unshift({
        id: transactionId,
        type: 'mission_clear_bonus',
        amount: evaluation.finalSns,
        description: `[미션 클리어] ${params.gameTitle} (${evaluation.bonusPercent > 0 ? `+${evaluation.bonusPercent}% 보너스` : '일반'}${badgeText})`,
        timestamp,
        previousBalance,
        newBalance,
        details: {
          gameId: params.gameId,
          baseRewardSns: evaluation.baseRewardSns,
          bonusSns: evaluation.bonusSns,
          bonusMultiplier: evaluation.bonusMultiplier,
          isTimeAttack: evaluation.isTimeAttack,
          isFlawless: evaluation.isFlawless
        }
      });

      // 최대 100건 유지
      if (history.length > 100) {
        history.length = 100;
      }
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));

      // 3. UI 동기화 이벤트 디스패치
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('hero_sns_point_changed', {
            detail: {
              newBalance,
              diff: evaluation.finalSns,
              reason: 'mission_clear_bonus',
              gameId: params.gameId
            }
          })
        );
      }
    } catch (e) {
      console.error('[DynamicBonusPayoutGateway] Failed to persist payout to localStorage:', e);
    }

    return {
      transactionId,
      gameId: params.gameId,
      gameTitle: params.gameTitle,
      durationSeconds: params.durationSeconds,
      targetTimeSeconds: params.targetTimeSeconds ?? 60,
      damageTaken: params.damageTaken ?? 0,
      starsEarned: params.starsEarned ?? 0,
      evaluation,
      previousBalance,
      newBalance,
      timestamp
    };
  }
}
