// [SCR-12-07] Adaptive 60fps Eco-Safeguard & Device Benchmark Engine
export class AdaptivePerformanceManager {
  private static isLowEnd = false;
  private static fpsHistory: number[] = [];
  private static isBenchmarking = false;

  public static async run1SecBenchmark(): Promise<boolean> {
    if (this.isBenchmarking) return this.isLowEnd;
    this.isBenchmarking = true;

    return new Promise((resolve) => {
      let frames = 0;
      const startTime = performance.now();

      const countFrame = () => {
        frames++;
        const elapsed = performance.now() - startTime;
        if (elapsed < 1000) {
          requestAnimationFrame(countFrame);
        } else {
          const fps = Math.round((frames * 1000) / elapsed);
          this.isLowEnd = fps < 48; // Threshold for low-end devices
          this.isBenchmarking = false;
          try {
            localStorage.setItem('hero_adaptive_low_spec', this.isLowEnd ? 'true' : 'false');
          } catch {}
          resolve(this.isLowEnd);
        }
      };

      requestAnimationFrame(countFrame);
    });
  }

  public static isEcoMode(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('hero_adaptive_low_spec') === 'true';
  }
}
