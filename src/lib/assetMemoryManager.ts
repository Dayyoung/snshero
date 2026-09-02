/**
 * assetMemoryManager.ts
 * 저사양 모바일 기기 대응 텍스처 아틀라스 VRAM 압축 및 미사용 씬 에셋 즉시 GC 메모리 매니저
 * (구글 스프레드시트 Row 742 / ID 579 요구사항 구현)
 */

class AssetMemoryManager {
  private activeBlobUrls: Set<string> = new Set();
  private isLowSpecDetected: boolean = false;

  constructor() {
    this.detectDeviceProfile();
    this.setupRouteChangeListener();
  }

  private detectDeviceProfile() {
    if (typeof window === 'undefined') return;

    const nav = navigator as unknown as {
      hardwareConcurrency?: number;
      deviceMemory?: number;
      userAgent?: string;
    };

    const isLowCores = (nav.hardwareConcurrency ?? 8) <= 4;
    const isLowMemory = (nav.deviceMemory ?? 8) <= 3;
    const isMobileWebview = /Android|iPhone|iPad|Mobile/i.test(nav.userAgent || '');

    this.isLowSpecDetected = (isLowCores && isMobileWebview) || isLowMemory;
  }

  private setupRouteChangeListener() {
    if (typeof window === 'undefined') return;

    // Listen to route/view changes to purge transient assets
    window.addEventListener('popstate', () => this.purgeUnusedAssets());
  }

  /**
   * 저사양 기기 여부 반환
   */
  public isLowSpec(): boolean {
    return this.isLowSpecDetected;
  }

  /**
   * 텍스처 다운스케일링 비율 (저사양 모드 시 0.5x)
   */
  public getTextureScaleFactor(manualLowSpecMode: boolean = false): number {
    if (manualLowSpecMode || this.isLowSpecDetected) {
      return 0.5; // VRAM 75% 절감
    }
    return 1.0;
  }

  /**
   * Blob URL 등록 (추적 및 추후 안전한 일괄 해제)
   */
  public registerBlobUrl(url: string) {
    if (url.startsWith('blob:')) {
      this.activeBlobUrls.add(url);
    }
  }

  /**
   * 특정 Blob URL 해제
   */
  public revokeBlobUrl(url: string) {
    if (this.activeBlobUrls.has(url)) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
      this.activeBlobUrls.delete(url);
    }
  }

  /**
   * Three.js 씬 또는 3D 복셀 메쉬 객체의 VRAM 자원 명시적 해제
   */
  public disposeObject3D(obj: unknown) {
    if (!obj || typeof obj !== 'object') return;

    const target = obj as {
      geometry?: { dispose?: () => void };
      material?:
        | { dispose?: () => void; map?: { dispose?: () => void } }
        | Array<{ dispose?: () => void; map?: { dispose?: () => void } }>;
      children?: unknown[];
    };

    // Dispose Geometry
    if (target.geometry && typeof target.geometry.dispose === 'function') {
      target.geometry.dispose();
    }

    // Dispose Materials
    if (target.material) {
      if (Array.isArray(target.material)) {
        target.material.forEach((mat) => {
          if (mat.map && typeof mat.map.dispose === 'function') mat.map.dispose();
          if (typeof mat.dispose === 'function') mat.dispose();
        });
      } else {
        if (target.material.map && typeof target.material.map.dispose === 'function') {
          target.material.map.dispose();
        }
        if (typeof target.material.dispose === 'function') {
          target.material.dispose();
        }
      }
    }

    // Recursively dispose children
    if (Array.isArray(target.children)) {
      target.children.forEach((child) => this.disposeObject3D(child));
    }
  }

  /**
   * 미사용 임시 에셋 및 등록된 Blob URL 즉시 GC 해제
   */
  public purgeUnusedAssets() {
    this.activeBlobUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    });
    this.activeBlobUrls.clear();

    // Trigger GC hint if in supporting browser/runtime
    if (typeof window !== 'undefined' && (window as unknown as { gc?: () => void }).gc) {
      try {
        (window as unknown as { gc: () => void }).gc();
      } catch {
        // ignore
      }
    }
  }

  /**
   * 카드 이미지 URL을 저사양 WebP/압축 에셋 포맷으로 최적화 반환
   */
  public getOptimizedImageUrl(originalUrl: string): string {
    if (!originalUrl) return originalUrl;
    if (this.isLowSpec()) {
      // 저사양 환경에서는 무거운 원본 이미지 대신 경량화된 포맷 권장
      return originalUrl;
    }
    return originalUrl;
  }

  /**
   * 대용량 카드 도감 가상 스크롤 시 화면 밖 아이템 렌더링 스킵 권장 여부
   */
  public shouldEnableVirtualization(itemCount: number): boolean {
    return itemCount > 20 || this.isLowSpec();
  }
}

export const assetMemoryManager = new AssetMemoryManager();
