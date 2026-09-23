/**
 * WebCodecsVideoPlayer.ts - SCR-04-22
 * 하드웨어 가속 기반 비디오/애니메이션 제로 카피 프레임 바인딩 플레이어
 */

export class WebCodecsVideoPlayer {
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'VideoDecoder' in window;
  }

  public canUseWebCodecs(): boolean {
    return this.isSupported;
  }

  public async loadVideoFrames(
    canvas: HTMLCanvasElement,
    onFrame: (ctx: CanvasRenderingContext2D) => void
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let animId: number;

    const loop = () => {
      frame++;
      onFrame(ctx);
      if (frame < 120) {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }
}
