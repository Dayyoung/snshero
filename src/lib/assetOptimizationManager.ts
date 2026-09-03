/**
 * assetOptimizationManager.ts
 * 저사양 모바일 기기를 위한 에셋 지연 로딩 & WebGL 텍스처 메모리 가비지 컬렉터
 * (구글 스프레드시트 Row 834 / ID 555 요구사항 구현)
 */

export interface DisposableThreeResource {
  dispose?: () => void;
  geometry?: { dispose: () => void };
  material?: { dispose: () => void; map?: { dispose: () => void } };
  children?: DisposableThreeResource[];
}

export class AssetOptimizationManager {
  private static instance: AssetOptimizationManager;
  private readonly MAX_PIXEL_RATIO = 2.0;

  private constructor() {}

  public static getInstance(): AssetOptimizationManager {
    if (!AssetOptimizationManager.instance) {
      AssetOptimizationManager.instance = new AssetOptimizationManager();
    }
    return AssetOptimizationManager.instance;
  }

  /**
   * 모바일 과열 및 VRAM 초과 방지 픽셀 레이쇼 클램핑 (1.0 ~ 2.0x)
   */
  public getClampedPixelRatio(): number {
    if (typeof window === 'undefined') return 1;
    return Math.min(window.devicePixelRatio || 1, this.MAX_PIXEL_RATIO);
  }

  /**
   * Three.js 씬 또는 오브젝트 트리 재귀적 VRAM 메모리 회수 가비지 컬렉터
   */
  public purgeThreeObjectTree(obj: DisposableThreeResource | null | undefined): void {
    if (!obj) return;

    if (obj.geometry && typeof obj.geometry.dispose === 'function') {
      obj.geometry.dispose();
    }

    if (obj.material) {
      if (obj.material.map && typeof obj.material.map.dispose === 'function') {
        obj.material.map.dispose();
      }
      if (typeof obj.material.dispose === 'function') {
        obj.material.dispose();
      }
    }

    if (obj.children && Array.isArray(obj.children)) {
      obj.children.forEach((child) => this.purgeThreeObjectTree(child));
    }

    if (typeof obj.dispose === 'function') {
      obj.dispose();
    }
  }

  /**
   * WebGL 컨텍스트 로스트 및 텍스처 풀 완전 클린업 헬퍼
   */
  public cleanWebGLContext(renderer: { dispose?: () => void; forceContextLoss?: () => void } | null): void {
    if (!renderer) return;
    try {
      if (typeof renderer.dispose === 'function') {
        renderer.dispose();
      }
      if (typeof renderer.forceContextLoss === 'function') {
        renderer.forceContextLoss();
      }
    } catch (e) {
      console.warn('Failed to cleanly dispose WebGL renderer context:', e);
    }
  }
}

export const assetOptimizationManager = AssetOptimizationManager.getInstance();
