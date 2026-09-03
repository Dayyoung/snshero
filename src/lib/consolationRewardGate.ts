/**
 * consolationRewardGate.ts
 * 미션 실패/패배 시에도 시간 비례 위로 보상(기본 30%) 100% 확정 지급 게이트웨이
 * (구글 스프레드시트 Row 818 / ID 555 요구사항 구현)
 */

export interface ConsolationPayoutReceipt {
  transactionId: string;
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
  consolationSns: number;
  ratePerMin: number; // 15P / min
  previousBalance: number;
  newBalance: number;
  timestamp: number;
}

export class ConsolationRewardGate {
  private static instance: ConsolationRewardGate;
  private readonly STORAGE_KEY = 'hero_sns_point';
  private readonly HISTORY_KEY = 'hero_sns_history';
  private readonly CONSOLATION_RATE_PER_MIN = 15; // 30% of normalized 50P

  private constructor() {}

  public static getInstance(): ConsolationRewardGate {
    if (!ConsolationRewardGate.instance) {
      ConsolationRewardGate.instance = new ConsolationRewardGate();
    }
    return ConsolationRewardGate.instance;
  }

  /**
   * 패배/게임오버 시 위로 SNS 포인트 계산 및 원자적 입금
   */
  public settleConsolationReward(
    gameId: string,
    gameTitle: string,
    durationSeconds: number
  ): ConsolationPayoutReceipt {
    const clampedDuration = Math.max(10, Math.min(300, durationSeconds));
    const durationMin = clampedDuration / 60;

    // 30% 위로 보상 계산 (최소 10P ~ 최대 75P)
    const rawSns = Math.round(durationMin * this.CONSOLATION_RATE_PER_MIN);
    const consolationSns = Math.max(10, Math.min(75, rawSns));

    let previousBalance = 0;
    try {
      previousBalance = parseInt(localStorage.getItem(this.STORAGE_KEY) || '0', 10);
      if (isNaN(previousBalance)) previousBalance = 0;
    } catch {
      previousBalance = 0;
    }

    const newBalance = previousBalance + consolationSns;
    const timestamp = Date.now();
    const transactionId = `tx_loss_${timestamp}_${Math.random().toString(36).substring(2, 6)}`;

    // 원자적 지갑 업데이트
    try {
      localStorage.setItem(this.STORAGE_KEY, newBalance.toString());

      // 히스토리 기록
      const historyRaw = localStorage.getItem(this.HISTORY_KEY);
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      history.unshift({
        id: transactionId,
        type: 'GAME_REWARD',
        title: `[위로보상] ${gameTitle}`,
        amount: consolationSns,
        timestamp,
        details: `플레이 ${Math.round(durationSeconds)}초 위로 보상 100% 확정 입금`,
      });
      if (history.length > 50) history.pop();
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));

      // UI 반응형 동기화 이벤트
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('hero_sns_updated', {
            detail: { balance: newBalance, added: consolationSns, reason: 'CONSOLATION' },
          })
        );
      }
    } catch (e) {
      console.error('Failed to settle consolation reward:', e);
    }

    return {
      transactionId,
      gameId,
      gameTitle,
      durationSeconds,
      consolationSns,
      ratePerMin: this.CONSOLATION_RATE_PER_MIN,
      previousBalance,
      newBalance,
      timestamp,
    };
  }
}

export const consolationRewardGate = ConsolationRewardGate.getInstance();
