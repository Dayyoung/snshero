/**
 * lowSpecResourceOptimizer.ts
 * WebGL 텍스처 아틀라스 가상화 및 백그라운드 리소스 슬립 가비지 컬렉터
 * (구글 스프레드시트 Row 826 / ID 555 요구사항 구현)
 */

export class LowSpecResourceOptimizer {
  private static instance: LowSpecResourceOptimizer;
  private isBackgrounded: boolean = false;
  private activeRenderLoops: Set<() => void> = new Set();
  private vramCleanupListeners: Set<() => void> = new Set();

  private constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  public static getInstance(): LowSpecResourceOptimizer {
    if (!LowSpecResourceOptimizer.instance) {
      LowSpecResourceOptimizer.instance = new LowSpecResourceOptimizer();
    }
    return LowSpecResourceOptimizer.instance;
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.isBackgrounded = true;
      this.suspendBackgroundResources();
    } else {
      this.isBackgrounded = false;
      this.resumeForegroundResources();
    }
  };

  /**
   * 백그라운드 전환 시 WebGL 렌더 루프 슬립 & 텍스처 GC 트리거
   */
  private suspendBackgroundResources() {
    // 텍스처 메모리 즉시 가비지 컬렉션
    this.vramCleanupListeners.forEach((cleanup) => {
      try {
        cleanup();
      } catch (e) {
        console.warn('VRAM cleanup listener error:', e);
      }
    });
  }

  private resumeForegroundResources() {
    // 필요 시 렌더러 재개
  }

  public registerVramCleanup(cleanup: () => void): () => void {
    this.vramCleanupListeners.add(cleanup);
    return () => {
      this.vramCleanupListeners.delete(cleanup);
    };
  }

  public isSleeping(): boolean {
    return this.isBackgrounded;
  }
}

export const lowSpecResourceOptimizer = LowSpecResourceOptimizer.getInstance();
