/**
 * adaptiveViewportManager.ts
 * 모바일 세로/가로 뷰포트 자동 전환 감지 및 3D 캔버스 FOV 동적 적응형 뷰포트 매니저
 * (구글 스프레드시트 Row 958 / ID 554 요구사항 구현)
 */

export interface ViewportLayoutMetrics {
  isLandscape: boolean;
  viewportWidth: number;
  viewportHeight: number;
  aspectRatio: number;
  recommendedFov: number;       // Three.js 카메라 추천 FOV (세로: 65~75도, 가로: 45~55도)
  gameplayViewportHeightPct: number; // 기본 상단 70% 시야 확보
  thumbZoneHeightPct: number;        // 기본 하단 25~30% 썸존
  safeAreaBottomPx: number;
}

export class AdaptiveViewportManager {
  private static instance: AdaptiveViewportManager;
  private listeners: Set<(metrics: ViewportLayoutMetrics) => void> = new Set();
  private currentMetrics: ViewportLayoutMetrics;

  private constructor() {
    this.currentMetrics = this.calculateMetrics();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize, { passive: true });
      if (window.screen?.orientation) {
        window.screen.orientation.addEventListener('change', this.handleResize);
      }
    }
  }

  public static getInstance(): AdaptiveViewportManager {
    if (!AdaptiveViewportManager.instance) {
      AdaptiveViewportManager.instance = new AdaptiveViewportManager();
    }
    return AdaptiveViewportManager.instance;
  }

  public getMetrics(): Readonly<ViewportLayoutMetrics> {
    return this.currentMetrics;
  }

  public subscribe(callback: (metrics: ViewportLayoutMetrics) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentMetrics);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Three.js 카메라 객체 자동 보정 헬퍼
   */
  public adaptThreeCamera(camera: unknown): void {
    if (!camera || typeof camera !== 'object') return;
    const cam = camera as { aspect?: number; fov?: number; updateProjectionMatrix?: () => void };

    cam.aspect = this.currentMetrics.aspectRatio;
    cam.fov = this.currentMetrics.recommendedFov;
    if (typeof cam.updateProjectionMatrix === 'function') {
      cam.updateProjectionMatrix();
    }
  }

  private calculateMetrics(): ViewportLayoutMetrics {
    if (typeof window === 'undefined') {
      return {
        isLandscape: false,
        viewportWidth: 390,
        viewportHeight: 844,
        aspectRatio: 390 / 844,
        recommendedFov: 70,
        gameplayViewportHeightPct: 70,
        thumbZoneHeightPct: 30,
        safeAreaBottomPx: 0,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    const aspectRatio = width / (height || 1);

    // 세로 모드일 때는 세로 시야각을 넓히고(70도), 가로 모드일 때는 과도한 왜곡 방지를 위해 50도
    const recommendedFov = isLandscape ? 50 : 70;

    // 가로 모드에서는 상단 85% 시야, 세로 모드에서는 상단 70% 전장 시야 확보
    const gameplayViewportHeightPct = isLandscape ? 85 : 70;
    const thumbZoneHeightPct = isLandscape ? 15 : 30;

    return {
      isLandscape,
      viewportWidth: width,
      viewportHeight: height,
      aspectRatio,
      recommendedFov,
      gameplayViewportHeightPct,
      thumbZoneHeightPct,
      safeAreaBottomPx: 0,
    };
  }

  private handleResize = (): void => {
    this.currentMetrics = this.calculateMetrics();
    this.listeners.forEach((fn) => fn(this.currentMetrics));
  };
}
