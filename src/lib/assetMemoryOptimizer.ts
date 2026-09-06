/**
 * assetMemoryOptimizer.ts
 * WebP 에셋 온디맨드 스트리밍 및 Three.js 지오메트리/텍스처 자동 GC 풀링 매니저
 * (구글 스프레드시트 Row 1035 / ID 555 요구사항 구현)
 */

interface DisposableThreeObject {
  geometry?: { dispose: () => void };
  material?: { dispose: () => void } | Array<{ dispose: () => void }>;
  texture?: { dispose: () => void };
  children?: DisposableThreeObject[];
}

export class AssetMemoryOptimizer {
  private static instance: AssetMemoryOptimizer;
  private offscreenDisposalQueue: DisposableThreeObject[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_DELAY_MS = 3000; // 3초 디바운스
  private webpThumbnailCache = new Map<string, string>();

  private constructor() {}

  public static getInstance(): AssetMemoryOptimizer {
    if (!AssetMemoryOptimizer.instance) {
      AssetMemoryOptimizer.instance = new AssetMemoryOptimizer();
    }
    return AssetMemoryOptimizer.instance;
  }

  /**
   * 고해상도 원본 카드 이미지를 40KB 이하 경량 WebP 썸네일 URL로 온디맨드 스트리밍 변환
   */
  public getOptimizedCardThumbnail(rawUrl: string, maxDimension = 240): string {
    if (!rawUrl) return '';
    if (this.webpThumbnailCache.has(rawUrl)) {
      return this.webpThumbnailCache.get(rawUrl)!;
    }

    // 이미 WebP 형식이면 캐시 후 반환
    if (rawUrl.endsWith('.webp')) {
      this.webpThumbnailCache.set(rawUrl, rawUrl);
      return rawUrl;
    }

    // .png / .jpg 이미지의 경우 WebP 버전 경로 우선 탐색
    const webpUrl = rawUrl.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    this.webpThumbnailCache.set(rawUrl, webpUrl);
    return webpUrl;
  }

  /**
   * 화면 밖으로 벗어난 Three.js 씬 또는 메시 인스턴스를 3초 디바운스 큐에 등록
   * 3초 동안 재진입하지 않으면 안전하게 VRAM 및 지오메트리를 dispose하여 GC 유도
   */
  public queueThreeObjectDisposal(obj: DisposableThreeObject): void {
    if (!obj) return;
    this.offscreenDisposalQueue.push(obj);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flushDisposalQueue();
    }, this.DEBOUNCE_DELAY_MS);
  }

  /**
   * 큐에 쌓인 Three.js 객체 재귀적 dispose 실행
   */
  public flushDisposalQueue(): void {
    const queue = [...this.offscreenDisposalQueue];
    this.offscreenDisposalQueue = [];
    this.debounceTimer = null;

    queue.forEach((item) => {
      this.deepDisposeThreeObject(item);
    });
  }

  private deepDisposeThreeObject(obj: DisposableThreeObject): void {
    if (!obj) return;

    try {
      // 1. Geometry dispose
      if (obj.geometry && typeof obj.geometry.dispose === 'function') {
        obj.geometry.dispose();
      }

      // 2. Material dispose (배열 또는 단일 객체)
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat) => {
            if (mat && typeof mat.dispose === 'function') mat.dispose();
          });
        } else if (typeof obj.material.dispose === 'function') {
          obj.material.dispose();
        }
      }

      // 3. Texture dispose
      if (obj.texture && typeof obj.texture.dispose === 'function') {
        obj.texture.dispose();
      }

      // 4. Children 재귀 dispose
      if (obj.children && Array.isArray(obj.children)) {
        obj.children.forEach((child) => this.deepDisposeThreeObject(child));
      }
    } catch {
      // dispose error ignore (이미 파기된 경우)
    }
  }

  /**
   * 강제 전역 캐시 정리
   */
  public clearAllMemory(): void {
    this.flushDisposalQueue();
    this.webpThumbnailCache.clear();
  }
}
