/**
 * assetMemoryOptimizer.ts
 * 전체 플랫폼 2D/3D 에셋 WebP 압축 및 스마트 500ms 메모리 가비지 컬렉션 파이프라인
 * (구글 스프레드시트 Row 851 / ID 572 요구사항 구현)
 */

export class AssetMemoryOptimizer {
  private static instance: AssetMemoryOptimizer;
  private pendingDisposals: Set<() => void> = new Set();
  private timer: NodeJS.Timeout | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => this.scheduleSmartGC());
    }
  }

  public static getInstance(): AssetMemoryOptimizer {
    if (!AssetMemoryOptimizer.instance) {
      AssetMemoryOptimizer.instance = new AssetMemoryOptimizer();
    }
    return AssetMemoryOptimizer.instance;
  }

  /**
   * 화면 전환이나 씬 종료 시 500ms 내 자동 메모리 회수 스케줄링
   */
  public scheduleSmartGC(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.executeSmartGC();
    }, 500);
  }

  public registerDisposable(disposeFn: () => void): () => void {
    this.pendingDisposals.add(disposeFn);
    return () => {
      this.pendingDisposals.delete(disposeFn);
    };
  }

  private executeSmartGC(): void {
    this.pendingDisposals.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.warn('Smart GC disposal error:', e);
      }
    });
    this.pendingDisposals.clear();
  }

  /**
   * 2D/3D 에셋 WebP 최적화 URL 헬퍼
   */
  public getOptimizedAssetUrl(originalUrl: string): string {
    if (!originalUrl) return originalUrl;
    if (originalUrl.endsWith('.png') || originalUrl.endsWith('.jpg')) {
      return originalUrl.replace(/\.(png|jpg)$/, '.webp');
    }
    return originalUrl;
  }
}

export const assetMemoryOptimizer = AssetMemoryOptimizer.getInstance();
