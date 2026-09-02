/**
 * adaptiveViewportScaler.ts
 * 모바일 세로/가로 뷰포트 전환 시 UI 왜곡 방지 및 3D 캔버스 해상도 반응형 자동 스케일러
 * (구글 스프레드시트 Row 785 / ID 554 요구사항 구현)
 */

export interface ViewportScaleMetrics {
  width: number;
  height: number;
  aspectRatio: number;
  isPortrait: boolean;
  pixelRatio: number;
  safeAreaTop: number;
  safeAreaBottom: number;
}

export type ViewportResizeListener = (metrics: ViewportScaleMetrics) => void;

class AdaptiveViewportScaler {
  private static instance: AdaptiveViewportScaler;
  private listeners: Set<ViewportResizeListener> = new Set();
  private currentMetrics: ViewportScaleMetrics;

  private constructor() {
    this.currentMetrics = this.calculateMetrics();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize, { passive: true });
      window.addEventListener('orientationchange', this.handleResize, { passive: true });
    }
  }

  public static getInstance(): AdaptiveViewportScaler {
    if (!AdaptiveViewportScaler.instance) {
      AdaptiveViewportScaler.instance = new AdaptiveViewportScaler();
    }
    return AdaptiveViewportScaler.instance;
  }

  private calculateMetrics(): ViewportScaleMetrics {
    if (typeof window === 'undefined') {
      return {
        width: 390,
        height: 844,
        aspectRatio: 390 / 844,
        isPortrait: true,
        pixelRatio: 1,
        safeAreaTop: 0,
        safeAreaBottom: 0,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height >= width;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2); // 배터리 및 GPU 부하 방지를 위해 최대 2x 제한

    return {
      width,
      height,
      aspectRatio: width / (height || 1),
      isPortrait,
      pixelRatio,
      safeAreaTop: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0', 10),
      safeAreaBottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0', 10),
    };
  }

  private handleResize = () => {
    this.currentMetrics = this.calculateMetrics();
    this.listeners.forEach((fn) => fn(this.currentMetrics));
  };

  public getMetrics(): ViewportScaleMetrics {
    return this.currentMetrics;
  }

  public subscribe(listener: ViewportResizeListener): () => void {
    this.listeners.add(listener);
    listener(this.currentMetrics);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Three.js PerspectiveCamera & WebGLRenderer 자동 보정 헬퍼
   */
  public adaptThreeCameraAndRenderer(
    camera: { aspect: number; updateProjectionMatrix: () => void } | null,
    renderer: { setSize: (w: number, h: number, updateStyle?: boolean) => void; setPixelRatio: (pr: number) => void } | null,
    containerElement?: HTMLElement | null
  ): void {
    if (!camera || !renderer) return;
    const w = containerElement ? containerElement.clientWidth : this.currentMetrics.width;
    const h = containerElement ? containerElement.clientHeight : this.currentMetrics.height;

    camera.aspect = w / (h || 1);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(this.currentMetrics.pixelRatio);
    renderer.setSize(w, h, false);
  }
}

export const adaptiveViewportScaler = AdaptiveViewportScaler.getInstance();
