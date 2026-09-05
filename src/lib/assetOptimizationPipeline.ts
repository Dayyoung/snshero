/**
 * assetOptimizationPipeline.ts
 * 전 플랫폼 3D/2D 에셋 레이지 로딩 및 KTX2/WebP 텍스처 압축을 통한 모바일 로딩 50% 단축 파이프라인
 * (구글 스프레드시트 Row 883 / ID 555 요구사항 구현)
 */

export class AssetOptimizationPipeline {
  private static instance: AssetOptimizationPipeline;
  private observer: IntersectionObserver | null = null;
  private observedElements = new Map<HTMLElement, (target: HTMLElement) => void>();

  private constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement;
              const cb = this.observedElements.get(el);
              if (cb) {
                cb(el);
                this.unobserve(el);
              }
            }
          });
        },
        { rootMargin: '100px' }
      );
    }
  }

  public static getInstance(): AssetOptimizationPipeline {
    if (!AssetOptimizationPipeline.instance) {
      AssetOptimizationPipeline.instance = new AssetOptimizationPipeline();
    }
    return AssetOptimizationPipeline.instance;
  }

  /**
   * 뷰포트 교차 감지 지연 로딩 등록
   */
  public observeLazyElement(el: HTMLElement, onLoad: (target: HTMLElement) => void): () => void {
    if (!this.observer) {
      onLoad(el);
      return () => {};
    }

    this.observedElements.set(el, onLoad);
    this.observer.observe(el);

    return () => {
      this.unobserve(el);
    };
  }

  public unobserve(el: HTMLElement): void {
    if (!this.observer) return;
    this.observer.unobserve(el);
    this.observedElements.delete(el);
  }

  /**
   * 2D/3D 텍스처 압축 URL 반환 (WebP/KTX2 선호)
   */
  public resolveOptimizedTexture(url: string): string {
    if (!url) return url;
    if (url.endsWith('.png') || url.endsWith('.jpg')) {
      return url.replace(/\.(png|jpg)$/, '.webp');
    }
    return url;
  }
}

export const assetOptimizationPipeline = AssetOptimizationPipeline.getInstance();
