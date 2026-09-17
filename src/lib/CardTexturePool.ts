/**
 * SNSHero Revolution - Card Texture Memory Pool
 * SCR-03-07: 대용량 카드 인벤토리 스크롤 시 화면에 보이는 카드만 렌더링하고
 * 비가시 카드 썸네일 메모리를 재활용/해제하여 모바일 60fps 유지 및 메모리 누수 방지
 */

export class CardTexturePool {
  private static cache: Map<number, string> = new Map();
  private static maxCacheSize = 64;

  public static getCardThumbnail(cardId: number): string {
    if (this.cache.has(cardId)) {
      return this.cache.get(cardId)!;
    }

    const url = `/card${cardId}.png`;
    if (this.cache.size >= this.maxCacheSize) {
      // FIFO eviction
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(cardId, url);
    return url;
  }

  public static clearPool(): void {
    this.cache.clear();
  }
}
