/**
 * ShadowmapBaker.ts - SCR-09-19
 * 정적 배경 섀도우맵을 OffscreenCanvas에 캐싱하고 이동 아바타 그림자만 동적 합성하는 60fps 앰비언트 라이팅 베이커
 */

export class ShadowmapBaker {
  private static cachedBgCanvas: HTMLCanvasElement | null = null;

  public static bakeStaticBackground(width: number, height: number): HTMLCanvasElement {
    if (this.cachedBgCanvas && this.cachedBgCanvas.width === width && this.cachedBgCanvas.height === height) {
      return this.cachedBgCanvas;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Soft ambient background shadow vignette
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.1,
        width / 2,
        height / 2,
        width * 0.7
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    this.cachedBgCanvas = canvas;
    return canvas;
  }
}
