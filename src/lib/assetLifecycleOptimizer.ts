/**
 * assetLifecycleOptimizer.ts
 * 모바일 웹뷰 메모리 누수 방지 'Three.js 텍스처/지오메트리 자동 디스포즈 & 동적 해상도 스케일링'
 * (구글 스프레드시트 Row 1007 / ID 555 요구사항 구현)
 */

export interface PerformanceMetrics {
  currentFps: number;
  targetDpr: number; // 동적 렌더 해상도 배율 (0.5 ~ 1.0)
  disposedObjectsCount: number;
  isThrottled: boolean;
}

export class AssetLifecycleOptimizer {
  private static instance: AssetLifecycleOptimizer;

  private disposedCount = 0;
  private currentFps = 60;
  private targetDpr = 1.0;
  private lastFrameTimestamp = 0;
  private frameCount = 0;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.startFpsMonitor();
    }
  }

  public static getInstance(): AssetLifecycleOptimizer {
    if (!AssetLifecycleOptimizer.instance) {
      AssetLifecycleOptimizer.instance = new AssetLifecycleOptimizer();
    }
    return AssetLifecycleOptimizer.instance;
  }

  /**
   * Three.js 루트 씬/오브젝트3D 재귀적 자동 리소스 해제
   */
  public recursivelyDispose(rootObject: unknown): number {
    if (!rootObject || typeof rootObject !== 'object') return 0;
    let count = 0;

    const traverse = (node: Record<string, unknown>) => {
      // 1. Geometry 해제
      if (node.geometry && typeof (node.geometry as { dispose?: () => void }).dispose === 'function') {
        (node.geometry as { dispose: () => void }).dispose();
        count += 1;
      }

      // 2. Material & Texture 해제
      if (node.material) {
        const mat = node.material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => this.disposeSingleMaterial(m));
        } else {
          this.disposeSingleMaterial(mat);
        }
        count += 1;
      }

      // 3. 자식 재귀 순회
      if (Array.isArray(node.children)) {
        node.children.forEach((child) => {
          if (child && typeof child === 'object') {
            traverse(child as Record<string, unknown>);
          }
        });
      }
    };

    traverse(rootObject as Record<string, unknown>);
    this.disposedCount += count;
    return count;
  }

  private disposeSingleMaterial(mat: unknown): void {
    if (!mat || typeof mat !== 'object') return;
    const m = mat as Record<string, unknown>;

    const textureKeys = ['map', 'alphaMap', 'roughnessMap', 'metalnessMap', 'normalMap'];
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
   * 실시간 FPS 모니터링 및 동적 렌더링 해상도 스케일링
   */
  private startFpsMonitor(): void {
    this.lastFrameTimestamp = performance.now();

    const loop = () => {
      this.frameCount += 1;
      const now = performance.now();
      const delta = now - this.lastFrameTimestamp;

      if (delta >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / delta);
        this.frameCount = 0;
        this.lastFrameTimestamp = now;

        // 35 FPS 이하로 저하 시 렌더 해상도 축소 스케일링
        if (this.currentFps < 35) {
          this.targetDpr = Math.max(0.65, this.targetDpr - 0.1);
        } else if (this.currentFps >= 55) {
          this.targetDpr = Math.min(1.0, this.targetDpr + 0.05);
        }
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  public getMetrics(): PerformanceMetrics {
    return {
      currentFps: this.currentFps,
      targetDpr: Number(this.targetDpr.toFixed(2)),
      disposedObjectsCount: this.disposedCount,
      isThrottled: this.targetDpr < 1.0,
    };
  }
}
