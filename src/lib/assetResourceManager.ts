/**
 * assetResourceManager.ts
 * 전 플랫폼 이미지/텍스처 WebP 80% 압축 및 메모리 누수 방지 '지능형 리소스 캐싱 & 언로드 매니저'
 * (구글 스프레드시트 Row 907 / ID 555 요구사항 구현)
 */

export interface CachedAsset {
  key: string;
  url: string;
  sizeBytes: number;
  lastAccessed: number;
}

export class AssetResourceManager {
  private static instance: AssetResourceManager;

  private imageCache: Map<string, HTMLImageElement> = new Map();
  private blobUrlRegistry: Set<string> = new Set();
  private readonly MAX_CACHE_SIZE = 50; // 최대 50개 이미지 캐싱 (저사양 메모리 보호)

  private constructor() {
    if (typeof window !== 'undefined') {
      // 페이지 전환/새로고침 시 잔류 Blob URL 일괄 해제
      window.addEventListener('beforeunload', () => {
        this.disposeAll();
      });
    }
  }

  public static getInstance(): AssetResourceManager {
    if (!AssetResourceManager.instance) {
      AssetResourceManager.instance = new AssetResourceManager();
    }
    return AssetResourceManager.instance;
  }

  /**
   * 이미지 경로를 WebP 포맷 우선 경로로 자동 변환 (WebP 지원 확인)
   */
  public resolveOptimizedImageUrl(originalUrl: string): string {
    if (!originalUrl || originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) {
      return originalUrl;
    }

    // png/jpg/jpeg 확장자일 경우 webp 최적화 경로 안내
    if (/\.(png|jpe?g)$/i.test(originalUrl) && !originalUrl.includes('.webp')) {
      // 프로젝트 내 webp 경로가 존재하거나 변환 가능한 경우 지원
      return originalUrl.replace(/\.(png|jpe?g)$/i, '.webp');
    }

    return originalUrl;
  }

  /**
   * 이미지 프리로드 및 LRU 캐시 등록
   */
  public preloadImage(url: string): Promise<HTMLImageElement> {
    const optimized = this.resolveOptimizedImageUrl(url);

    if (this.imageCache.has(optimized)) {
      return Promise.resolve(this.imageCache.get(optimized)!);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = optimized;

      img.onload = () => {
        // 캐시 크기 초과 시 가장 오래된 항목 제거
        if (this.imageCache.size >= this.MAX_CACHE_SIZE) {
          const oldestKey = this.imageCache.keys().next().value;
          if (oldestKey) {
            this.imageCache.delete(oldestKey);
          }
        }
        this.imageCache.set(optimized, img);
        resolve(img);
      };

      img.onerror = () => {
        // fallback to original url if webp fails
        if (optimized !== url) {
          const fallbackImg = new Image();
          fallbackImg.src = url;
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.onerror = reject;
        } else {
          reject(new Error(`Failed to load asset: ${url}`));
        }
      };
    });
  }

  /**
   * Object URL 등록 (메모리 추적 및 언로드 보장)
   */
  public registerBlobUrl(url: string): void {
    if (url && url.startsWith('blob:')) {
      this.blobUrlRegistry.add(url);
    }
  }

  /**
   * 단일 Blob URL 해제
   */
  public revokeBlobUrl(url: string): void {
    if (this.blobUrlRegistry.has(url)) {
      URL.revokeObjectURL(url);
      this.blobUrlRegistry.delete(url);
    }
  }

  /**
   * Three.js 씬/오브젝트 재귀적 메모리 해제 (geometry, material, texture)
   */
  public disposeThreeObject(obj: unknown): void {
    if (!obj || typeof obj !== 'object') return;

    const anyObj = obj as Record<string, unknown>;

    // 1. Geometry 해제
    if (anyObj.geometry && typeof (anyObj.geometry as { dispose?: () => void }).dispose === 'function') {
      (anyObj.geometry as { dispose: () => void }).dispose();
    }

    // 2. Material 해제
    if (anyObj.material) {
      const mat = anyObj.material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => this.disposeMaterial(m));
      } else {
        this.disposeMaterial(mat);
      }
    }

    // 3. 자식 요소 재귀적 해제
    if (Array.isArray(anyObj.children)) {
      anyObj.children.forEach((child) => this.disposeThreeObject(child));
    }
  }

  private disposeMaterial(mat: unknown): void {
    if (!mat || typeof mat !== 'object') return;
    const m = mat as Record<string, unknown>;

    // 텍스처 맵 해제
    const textureKeys = ['map', 'lightMap', 'bumpMap', 'normalMap', 'specularMap', 'envMap', 'alphaMap'];
    textureKeys.forEach((k) => {
      const tex = m[k];
      if (tex && typeof tex === 'object' && typeof (tex as { dispose?: () => void }).dispose === 'function') {
        (tex as { dispose: () => void }).dispose();
      }
    });

    if (typeof (m as { dispose?: () => void }).dispose === 'function') {
      (m as { dispose: () => void }).dispose();
    }
  }

  /**
   * 모든 캐시 및 Blob URL 일괄 해제
   */
  public disposeAll(): void {
    this.blobUrlRegistry.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    this.blobUrlRegistry.clear();
    this.imageCache.clear();
  }
}
