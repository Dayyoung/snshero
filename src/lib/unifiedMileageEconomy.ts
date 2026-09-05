/**
 * unifiedMileageEconomy.ts
 * 일일 퀘스트, 마켓 수수료 페이백 및 스태미나 소모 연동 '통합 마일리지 SNS 포인트 환급 시스템'
 * (구글 스프레드시트 Row 974 / ID 562 요구사항 구현)
 */

export interface MileageReimbursementReceipt {
  transactionId: string;
  sourceType: 'stamina_ap' | 'marketplace_trade';
  originalAmount: number;
  cashbackSns: number; // 5% 환급
  previousBalance: number;
  newBalance: number;
  timestamp: number;
}

export interface MileageStats {
  totalApReimbursed: number;
  totalMarketplaceReimbursed: number;
  lifetimeCashbackSns: number;
}

export class UnifiedMileageEconomy {
  private static instance: UnifiedMileageEconomy;
  private readonly STORAGE_POINT = 'hero_sns_point';
  private readonly STORAGE_HISTORY = 'hero_sns_history';
  private readonly STORAGE_STATS = 'hero_mileage_reimbursement_stats';
  private readonly CASHBACK_RATE = 0.05; // 5% 페이백

  private constructor() {}

  public static getInstance(): UnifiedMileageEconomy {
    if (!UnifiedMileageEconomy.instance) {
      UnifiedMileageEconomy.instance = new UnifiedMileageEconomy();
    }
    return UnifiedMileageEconomy.instance;
  }

  public getStats(): MileageStats {
    try {
      const raw = localStorage.getItem(this.STORAGE_STATS);
      return raw ? JSON.parse(raw) : { totalApReimbursed: 0, totalMarketplaceReimbursed: 0, lifetimeCashbackSns: 0 };
    } catch {
      return { totalApReimbursed: 0, totalMarketplaceReimbursed: 0, lifetimeCashbackSns: 0 };
    }
  }

  /**
   * 스태미나(AP) 소모 시 5% 가치 SNS 포인트 자동 환급 (1 AP = 5 SNS 가치 기준)
   */
  public reimburseApSpend(apSpent: number): MileageReimbursementReceipt | null {
    if (apSpent <= 0) return null;

    const apEquivalentSns = apSpent * 5;
    const cashbackSns = Math.max(1, Math.round(apEquivalentSns * this.CASHBACK_RATE));

    return this.executeCashback({
      sourceType: 'stamina_ap',
      originalAmount: apSpent,
      cashbackSns,
      description: `[마일리지 환급] 스태미나 ${apSpent} AP 소모 5% 캐시백 (+${cashbackSns} SNS)`,
    });
  }

  /**
   * 마켓플레이스 거래 완료 시 5% 수수료 페이백 환급
   */
  public reimburseMarketplaceFee(tradeAmountSns: number): MileageReimbursementReceipt | null {
    if (tradeAmountSns <= 0) return null;

    const cashbackSns = Math.max(1, Math.round(tradeAmountSns * this.CASHBACK_RATE));

    return this.executeCashback({
      sourceType: 'marketplace_trade',
      originalAmount: tradeAmountSns,
      cashbackSns,
      description: `[마켓 페이백] 거래액 ${tradeAmountSns} SNS 5% 환급 (+${cashbackSns} SNS)`,
    });
  }

  private executeCashback(params: {
    sourceType: 'stamina_ap' | 'marketplace_trade';
    originalAmount: number;
    cashbackSns: number;
    description: string;
  }): MileageReimbursementReceipt {
    let prev = 0;
    try {
      prev = parseInt(localStorage.getItem(this.STORAGE_POINT) || '0', 10) || 0;
    } catch {
      prev = 0;
    }

    const next = prev + params.cashbackSns;
    const timestamp = Date.now();
    const transactionId = `tx_mileage_${timestamp}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      localStorage.setItem(this.STORAGE_POINT, next.toString());

      const historyRaw = localStorage.getItem(this.STORAGE_HISTORY);
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      history.unshift({
        id: transactionId,
        type: 'mileage_cashback',
        amount: params.cashbackSns,
        description: params.description,
        timestamp,
        previousBalance: prev,
        newBalance: next,
      });
      localStorage.setItem(this.STORAGE_HISTORY, JSON.stringify(history.slice(0, 100)));

      // 통계 누적
      const stats = this.getStats();
      if (params.sourceType === 'stamina_ap') {
        stats.totalApReimbursed += params.originalAmount;
      } else {
        stats.totalMarketplaceReimbursed += params.originalAmount;
      }
      stats.lifetimeCashbackSns += params.cashbackSns;
      localStorage.setItem(this.STORAGE_STATS, JSON.stringify(stats));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('hero_sns_point_changed', {
            detail: { newBalance: next, diff: params.cashbackSns, reason: 'mileage_cashback' },
          })
        );
      }
    } catch (e) {
      console.error('[UnifiedMileageEconomy] Failed to persist cashback:', e);
    }

    return {
      transactionId,
      sourceType: params.sourceType,
      originalAmount: params.originalAmount,
      cashbackSns: params.cashbackSns,
      previousBalance: prev,
      newBalance: next,
      timestamp,
    };
  }
}
