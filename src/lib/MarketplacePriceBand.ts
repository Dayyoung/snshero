/**
 * MarketplacePriceBand.ts
 * 마켓플레이스 P2P 카드 거래 수수료 표준화 및 비정상 시세 덤핑 방지 동적 가격 밴드 시스템
 * (구글 스프레드시트 Row 1046 / ID 554 요구사항 구현)
 */

import { CARD_DATABASE } from '../cardDatabase';

export interface PriceBandResult {
  cardId: number;
  referencePrice: number;     // 최근 기준가 (평균 체결가 or 카드 기본 가치)
  minAllowedPrice: number;    // -30% 하한선 (덤핑 방지)
  maxAllowedPrice: number;    // +30% 상한선 (폭리 방지)
  isValidPrice: boolean;
  recommendedPrice: number;
  violationReason?: 'BELOW_MIN_DUMPING' | 'ABOVE_MAX_GOUGING';
}

export class MarketplacePriceBand {
  private static instance: MarketplacePriceBand;
  private readonly PRICE_BAND_RATIO = 0.30; // ±30% 동적 가격 밴드
  private readonly STORAGE_KEY = 'hero_market_price_history';

  private constructor() {}

  public static getInstance(): MarketplacePriceBand {
    if (!MarketplacePriceBand.instance) {
      MarketplacePriceBand.instance = new MarketplacePriceBand();
    }
    return MarketplacePriceBand.instance;
  }

  /**
   * 카드의 기본 기준가 산정 (파워, 등급, 레벨 기반 기본가)
   */
  public getCardBaseValue(cardId: number): number {
    const card = CARD_DATABASE[cardId];
    if (!card) return 100;

    const power = card.power || 10;
    let rarityMult = 1.0;
    switch (card.rarity) {
      case 'gold':
      case 'legendary':
        rarityMult = 3.5;
        break;
      case 'silver':
      case 'diamond':
        rarityMult = 2.0;
        break;
      default:
        rarityMult = 1.0;
    }

    return Math.round(power * 15 * rarityMult);
  }

  /**
   * 최근 체결 가격 목록 불러오기
   */
  private getRecentTradePrices(cardId: number): number[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const history: Record<number, number[]> = JSON.parse(raw);
        return history[cardId] || [];
      }
    } catch {
      // Ignore parse error
    }
    return [];
  }

  /**
   * 최근 평균 체결가(Moving Average) 산출
   */
  public getMovingAveragePrice(cardId: number): number {
    const recent = this.getRecentTradePrices(cardId);
    if (recent.length === 0) {
      return this.getCardBaseValue(cardId);
    }
    const sum = recent.reduce((a, b) => a + b, 0);
    return Math.round(sum / recent.length);
  }

  /**
   * 등록 희망 가격에 대한 동적 가격 밴드(±30%) 유효성 검증
   */
  public evaluatePriceBand(cardId: number, requestedPrice: number): PriceBandResult {
    const refPrice = this.getMovingAveragePrice(cardId);
    const minAllowed = Math.max(10, Math.round(refPrice * (1 - this.PRICE_BAND_RATIO)));
    const maxAllowed = Math.max(minAllowed + 10, Math.round(refPrice * (1 + this.PRICE_BAND_RATIO)));

    let isValid = true;
    let reason: 'BELOW_MIN_DUMPING' | 'ABOVE_MAX_GOUGING' | undefined;

    if (requestedPrice < minAllowed) {
      isValid = false;
      reason = 'BELOW_MIN_DUMPING';
    } else if (requestedPrice > maxAllowed) {
      isValid = false;
      reason = 'ABOVE_MAX_GOUGING';
    }

    return {
      cardId,
      referencePrice: refPrice,
      minAllowedPrice: minAllowed,
      maxAllowedPrice: maxAllowed,
      isValidPrice: isValid,
      recommendedPrice: refPrice,
      violationReason: reason,
    };
  }

  /**
   * 거래 체결 완료 시 새 가격 이력 기록 (최근 10건 유지)
   */
  public recordTradeSettlement(cardId: number, settledPrice: number): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const history: Record<number, number[]> = raw ? JSON.parse(raw) : {};
      const list = history[cardId] || [];
      list.push(settledPrice);
      if (list.length > 10) list.shift();
      history[cardId] = list;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Storage error ignore
    }
  }
}
