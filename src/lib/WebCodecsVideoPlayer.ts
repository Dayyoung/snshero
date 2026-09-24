/**
 * WebCodecsVideoPlayer.ts - SCR-04-22
 * 60fps 시네마틱 프레임 파이프라인 및 가상 비디오 프레임 제너레이터
 */

export class WebCodecsVideoPlayer {
  private isRunning: boolean = false;
  private animId: number | null = null;

  /**
   * Loads video/animation frames onto the provided canvas.
   * Calls renderFrame on every animation frame passing the 2D context.
   * Returns a cleanup function or Promise of cleanup function.
   */
  public loadVideoFrames(
    canvas: HTMLCanvasElement,
    renderFrame: (ctx: CanvasRenderingContext2D) => void
  ): Promise<() => void> & (() => void) {
    this.isRunning = true;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      if (!this.isRunning || !ctx) return;
      renderFrame(ctx);
      this.animId = requestAnimationFrame(loop);
    };

    if (ctx) {
      this.animId = requestAnimationFrame(loop);
    }

    const cleanup = () => {
      this.isRunning = false;
      if (this.animId !== null) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    };

    const promise = Promise.resolve(cleanup) as Promise<() => void> & (() => void);
    // Support direct execution as a function as well
    const callablePromise = Object.assign(
      (...args: unknown[]) => cleanup(),
      promise
    ) as Promise<() => void> & (() => void);

    return callablePromise;
  }

  public destroy(): void {
    this.isRunning = false;
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}

export default WebCodecsVideoPlayer;
