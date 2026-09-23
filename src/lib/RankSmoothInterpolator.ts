/**
 * RankSmoothInterpolator.ts - SCR-10-13
 * 랭킹 포인트 및 순위 변동 시 120ms 프리징/점핑 방지 베지어 곡선 부드러운 60fps 보간기
 */

export class RankSmoothInterpolator {
  private startValue: number;
  private targetValue: number;
  private startTime: number;
  private durationMs: number;

  constructor(initialValue: number, durationMs = 400) {
    this.startValue = initialValue;
    this.targetValue = initialValue;
    this.startTime = performance.now();
    this.durationMs = durationMs;
  }

  public setTarget(newTarget: number, durationMs = 400) {
    this.startValue = this.getCurrentValue();
    this.targetValue = newTarget;
    this.startTime = performance.now();
    this.durationMs = durationMs;
  }

  // Cubic bezier easing (ease-out-cubic: 1 - (1-t)^3)
  public getCurrentValue(): number {
    const elapsed = performance.now() - this.startTime;
    if (elapsed >= this.durationMs) {
      return this.targetValue;
    }
    const t = Math.min(1, Math.max(0, elapsed / this.durationMs));
    const easeOutCubic = 1 - Math.pow(1 - t, 3);
    return this.startValue + (this.targetValue - this.startValue) * easeOutCubic;
  }

  public isFinished(): boolean {
    return performance.now() - this.startTime >= this.durationMs;
  }
}
