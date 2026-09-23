/**
 * StaggeredHomeHydrator.ts - SCR-01-28
 * 홈 화면 렌더링 파이프라인 단계적 스케줄링 (Staggered Hydration) 매니저.
 * 1단계: 핵심 UI 뼈대 즉시 렌더링 (TBT 0ms)
 * 2단계: 캐릭터 텍스처/스프라이트 비동기 디코딩 및 바인딩 (microtask / setTimeout 0)
 * 3단계: 배경 파티클 및 3D 캔버스 requestIdleCallback 지연 초기화
 */

export type HydrationStage = 1 | 2 | 3;

export class StaggeredHomeHydrator {
  private static stage: HydrationStage = 1;
  private static listeners = new Set<(stage: HydrationStage) => void>();
  private static isScheduled = false;

  static getStage(): HydrationStage {
    return this.stage;
  }

  static scheduleHydration(): void {
    if (this.isScheduled) return;
    this.isScheduled = true;
    this.setStage(1);

    // 2단계 스케줄링 (50ms 후 비동기 디코딩)
    setTimeout(() => {
      this.setStage(2);

      // 3단계 스케줄링 (requestIdleCallback 또는 150ms 후)
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(
          () => {
            this.setStage(3);
          },
          { timeout: 300 }
        );
      } else {
        setTimeout(() => {
          this.setStage(3);
        }, 150);
      }
    }, 50);
  }

  private static setStage(newStage: HydrationStage): void {
    this.stage = newStage;
    for (const listener of this.listeners) {
      try {
        listener(newStage);
      } catch (e) {
        console.error('StaggeredHomeHydrator listener error:', e);
      }
    }
  }

  static subscribe(callback: (stage: HydrationStage) => void): () => void {
    this.listeners.add(callback);
    callback(this.stage);
    return () => this.listeners.delete(callback);
  }

  static reset(): void {
    this.stage = 1;
    this.isScheduled = false;
  }
}
