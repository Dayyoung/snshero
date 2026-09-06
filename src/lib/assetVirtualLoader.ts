/**
 * assetVirtualLoader.ts
 * 로비/카드 컬렉션 WebGL 텍스처 가상 스크롤 및 저사양 모바일 WebP 지연 로딩 최적화
 * (구글 스프레드시트 Row 1015 / ID 555 요구사항 구현)
 */

export class AssetVirtualLoader {
  private static instance: AssetVirtualLoader;
  private loadedTextures: Map<string, HTMLImageElement> = new Map();
  private maxCacheSize = 30; // 저사양 기기 VRAM 보호 (최대 30개 활성 텍스처)

  private constructor() {}

  public static getInstance(): AssetVirtualLoader {
    if (!AssetVirtualLoader.instance) {
      AssetVirtualLoader.instance = new AssetVirtualLoader();
    }
    return AssetVirtualLoader.instance;
  }

  /**
   * 뷰포트 내 가시 카드 텍스처 프로그레시브 프리페치
   */
  public loadVisibleTexture(url: string): Promise<string> {
    const webpUrl = url.replace(/\.(png|jpe?g)$/i, '.webp');

    if (this.loadedTextures.has(webpUrl)) {
      return Promise.resolve(webpUrl);
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = webpUrl;

      img.onload = () => {
        if (this.loadedTextures.size >= this.maxCacheSize) {
          const oldestKey = this.loadedTextures.keys().next().value;
          if (oldestKey) {
            this.loadedTextures.delete(oldestKey);
          }
        }
        this.loadedTextures.set(webpUrl, img);
        resolve(webpUrl);
      };

      img.onerror = () => {
        // WebP 로드 실패 시 원본 경로로 fallback
        resolve(url);
      };
    });
  }

  public purgeOutOfViewTextures(visibleUrls: string[]): void {
    const visibleSet = new Set(visibleUrls);
    this.loadedTextures.forEach((_, key) => {
      if (!visibleSet.has(key)) {
        this.loadedTextures.delete(key);
      }
    });
  }
}
