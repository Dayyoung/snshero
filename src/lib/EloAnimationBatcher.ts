/**
 * EloAnimationBatcher.ts - SCR-10-19
 * RAF 단일 배치 사이클 내에서 순위 변동과 ELO 수치를 일괄 애니메이션 처리하는 60fps 무감속 배치 매니저
 */

type AnimationCallback = (progress: number) => void;

export class EloAnimationBatcher {
  private static tasks: { callback: AnimationCallback; startTime: number; duration: number }[] = [];
  private static isRunning = false;

  public static add(callback: AnimationCallback, duration = 400) {
    this.tasks.push({
      callback,
      startTime: performance.now(),
      duration,
    });

    if (!this.isRunning) {
      this.isRunning = true;
      requestAnimationFrame(this.tick);
    }
  }

  private static tick = (currentTime: number) => {
    this.tasks = this.tasks.filter((t) => {
      const elapsed = currentTime - t.startTime;
      const progress = Math.min(1.0, elapsed / t.duration);
      t.callback(progress);
      return progress < 1.0;
    });

    if (this.tasks.length > 0) {
      requestAnimationFrame(this.tick);
    } else {
      this.isRunning = false;
    }
  };
}
