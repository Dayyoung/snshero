/**
 * LruTexturePool.ts - SCR-04-13
 * 뷰포트 외 상점 텍스처 즉각 회수 및 LRU 메모리 캐시 풀 매니저
 */

export class LruTexturePool {
  private cache: Map<string, HTMLImageElement> = new Map();
  private maxEntries: number;

  constructor(maxEntries = 30) {
    this.maxEntries = maxEntries;
  }

  public get(key: string): HTMLImageElement | undefined {
    const item = this.cache.get(key);
    if (item) {
      // Refresh key for LRU
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  public set(key: string, img: HTMLImageElement): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxEntries) {
      // Evict oldest
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        const evicted = this.cache.get(oldestKey);
        if (evicted) {
          evicted.src = ''; // Clean memory reference
        }
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, img);
  }

  public clear(): void {
    this.cache.forEach((img) => {
      img.src = '';
    });
    this.cache.clear();
  }
}

export const globalTexturePool = new LruTexturePool(25);
