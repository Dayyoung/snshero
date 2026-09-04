/**
 * performanceFallbackEngine.ts
 * 텍스처 아틀라스 WebP 압축 & WebGL/Canvas2D 듀얼 렌더링 저사양 자동 폴백 엔진
 * (구글 스프레드시트 Row 842 / ID 563 요구사항 구현)
 */

export interface RenderProfile {
  tier: 'HIGH' | 'MEDIUM' | 'LOW';
  useWebGL: boolean;
  particleBudgetScale: number; // 0.3 (Low) ~ 1.0 (High)
  maxTextureDimension: number; // 1024 or 2048
  enableWebPAtlas: boolean;
  targetFps: number; // 60 or 30
}

export class PerformanceFallbackEngine {
  private static instance: PerformanceFallbackEngine;
  private currentProfile: RenderProfile;

  private constructor() {
    this.currentProfile = this.detectHardwareProfile();
  }

  public static getInstance(): PerformanceFallbackEngine {
    if (!PerformanceFallbackEngine.instance) {
      PerformanceFallbackEngine.instance = new PerformanceFallbackEngine();
    }
    return PerformanceFallbackEngine.instance;
  }

  /**
   * 클라이언트 하드웨어 사양 벤치마크 및 렌더링 프로필 판정
   */
  private detectHardwareProfile(): RenderProfile {
    if (typeof window === 'undefined') {
      return {
        tier: 'MEDIUM',
        useWebGL: true,
        particleBudgetScale: 0.7,
        maxTextureDimension: 1024,
        enableWebPAtlas: true,
        targetFps: 60,
      };
    }

    const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // 저사양 판정 (메모리 2GB 이하 또는 코어 2개 이하 모바일)
    if (memory <= 2 || hardwareConcurrency <= 2 || (isMobile && memory <= 3)) {
      return {
        tier: 'LOW',
        useWebGL: false, // Fallback to optimized Canvas2D
        particleBudgetScale: 0.3, // 70% reduction
        maxTextureDimension: 1024,
        enableWebPAtlas: true,
        targetFps: 30,
      };
    }

    // 중간 사양
    if (memory <= 4 || isMobile) {
      return {
        tier: 'MEDIUM',
        useWebGL: true,
        particleBudgetScale: 0.6,
        maxTextureDimension: 1024,
        enableWebPAtlas: true,
        targetFps: 60,
      };
    }

    // 고사양 데스크탑
    return {
      tier: 'HIGH',
      useWebGL: true,
      particleBudgetScale: 1.0,
      maxTextureDimension: 2048,
      enableWebPAtlas: true,
      targetFps: 60,
    };
  }

  public getProfile(): RenderProfile {
    return this.currentProfile;
  }

  public isLowSpec(): boolean {
    return this.currentProfile.tier === 'LOW';
  }

  public getParticleScale(): number {
    return this.currentProfile.particleBudgetScale;
  }
}

export const performanceFallbackEngine = PerformanceFallbackEngine.getInstance();
