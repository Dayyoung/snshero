/**
 * assetLoader.ts
 * 모바일 웹뷰 에셋 압축(WebP/AVIF) 및 저사양 메모리 최적화 로더
 * (구글 스프레드시트 Row 1023 / ID 563 요구사항 구현)
 */

interface AssetCacheEntry {
  url: string;
  blob?: Blob;
  loadedAt: number;
}

export class AssetLoader {
  private static instance: AssetLoader;
  private supportsWebP = false;
  private supportsAVIF = false;
  private cache = new Map<string, AssetCacheEntry>();
  private isLowSpec = false;

  private constructor() {
    this.detectCapabilities();
  }

  public static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  private detectCapabilities(): void {
    if (typeof window === 'undefined') return;

    // 저사양 모바일 감지: CPU 코어 4개 이하 또는 메모리 4GB 미만
    const nav = navigator as Navigator & { deviceMemory?: number };
    const cores = navigator.hardwareConcurrency || 4;
    const memory = nav.deviceMemory || 4;
    this.isLowSpec = cores <= 4 || memory <= 4;

    // WebP 지원 여부 판별
    const elem = document.createElement('canvas');
    if (elem.getContext && elem.getContext('2d')) {
      this.supportsWebP = elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    // AVIF 지원 비동기 테스트
    const avifImage = new Image();
    avifImage.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtc2YxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAacGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAqaWluZgAAAAAAAAABAAAAIZluZmIAAAABAAARYXZjMQAAAAABAAAAAA==';
    avifImage.onload = () => {
      this.supportsAVIF = true;
    };
  }

  /**
   * 카드 이미지 URL을 기기 지원에 맞춰 최적화된 포맷 경로로 반환
   */
  public resolveOptimalImageUrl(originalPath: string): string {
    if (!originalPath || originalPath.startsWith('data:')) return originalPath;

    // 저사양 기기일 경우 WebP 또는 AVIF 우선 변환
    if (this.supportsAVIF && originalPath.endsWith('.png')) {
      return originalPath.replace(/\.png$/, '.avif');
    }
    if (this.supportsWebP && originalPath.endsWith('.png')) {
      return originalPath.replace(/\.png$/, '.webp');
    }
    return originalPath;
  }

  public isLowSpecDevice(): boolean {
    return this.isLowSpec;
  }

  /**
   * 이미지 사전 로드 및 캐시 등록
   */
  public async preloadImage(url: string): Promise<HTMLImageElement> {
    const optimalUrl = this.resolveOptimalImageUrl(url);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.cache.set(optimalUrl, {
          url: optimalUrl,
          loadedAt: Date.now(),
        });
        resolve(img);
      };
      img.onerror = () => {
        // Fallback to original
        const fallback = new Image();
        fallback.onload = () => resolve(fallback);
        fallback.onerror = reject;
        fallback.src = url;
      };
      img.src = optimalUrl;
    });
  }

  /**
   * 메모리 정리를 위해 캐시 비우기
   */
  public clearMemoryCache(): void {
    this.cache.clear();
  }
}
