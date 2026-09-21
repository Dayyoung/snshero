// [SCR-09-07] 60fps HTML5 2D Canvas Optimizer for Poki 110 Games
export class MissionCanvasOptimizer {
  private static dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  public static setupCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true }) as CanvasRenderingContext2D;
    canvas.width = Math.floor(width * this.dpr);
    canvas.height = Math.floor(height * this.dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(this.dpr, this.dpr);
    ctx.imageSmoothingEnabled = false; // Pixel-crisp 60fps
    return ctx;
  }

  public static createRAFThrottle(callback: (delta: number) => void) {
    let lastTime = performance.now();
    let frameId: number | null = null;

    const tick = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      callback(delta);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }
}
