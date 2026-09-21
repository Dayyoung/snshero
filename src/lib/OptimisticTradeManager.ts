/**
 * OptimisticTradeManager.ts - SCR-05-13
 * 낙관적 UI 체결 관리자 및 체결 실패 시 대체 매물 자동 추천 큐
 */

export interface TradeAttempt {
  listingId: string;
  cardName: string;
  price: number;
  timestamp: number;
}

export interface SubstituteListing {
  listingId: string;
  cardName: string;
  price: number;
  seller: string;
  rarity: string;
}

export class OptimisticTradeManager {
  private static pendingTrades: Map<string, TradeAttempt> = new Map();

  static startOptimisticTrade(listingId: string, cardName: string, price: number): void {
    this.pendingTrades.set(listingId, {
      listingId,
      cardName,
      price,
      timestamp: Date.now(),
    });
  }

  static confirmTrade(listingId: string): void {
    this.pendingTrades.delete(listingId);
  }

  static rollbackTrade(
    listingId: string,
    availableListings: SubstituteListing[]
  ): SubstituteListing[] {
    const attempt = this.pendingTrades.get(listingId);
    this.pendingTrades.delete(listingId);

    if (!attempt) return [];

    // 대체 매물 검색: 같은 카드 이름 혹은 근접 가격대 (±10%)
    return availableListings
      .filter((l) => l.listingId !== listingId && Math.abs(l.price - attempt.price) <= attempt.price * 0.15)
      .slice(0, 3);
  }
}
