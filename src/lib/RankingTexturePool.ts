/**
 * RankingTexturePool.ts - SCR-10-16
 * 상하 20개 항목을 메모리에 상주시키는 LRU 텍스처 프리로딩 풀
 */

export class RankingTexturePool {
  private cache = new Map<string, ImageBitmap>();
  private maxItems = 40;

  public get(id: string): ImageBitmap | undefined {
    const item = this.cache.get(id);
    if (item) {
      // Refresh LRU
      this.cache.delete(id);
      this.cache.set(id, item);
    }
    return item;
  }

  public set(id: string, bitmap: ImageBitmap) {
    if (this.cache.size >= this.maxItems) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        const oldBmp = this.cache.get(oldestKey);
        oldBmp?.close();
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(id, bitmap);
  }

  public clear() {
    this.cache.forEach((bmp) => bmp.close());
    this.cache.clear();
  }
}
