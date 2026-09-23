/**
 * BitmapFontBaker.ts - SCR-02-22
 * 데미지 숫자(0-9, critical, miss)를 2D Canvas 아틀라스로 사전 래스터화하는 베이커
 */

export class BitmapFontBaker {
  private static atlasCanvas: HTMLCanvasElement | null = null;
  private static glyphCoords: Map<string, { x: number; y: number; w: number; h: number }> = new Map();

  public static getAtlas(): { canvas: HTMLCanvasElement; glyphs: Map<string, { x: number; y: number; w: number; h: number }> } {
    if (this.atlasCanvas) {
      return { canvas: this.atlasCanvas, glyphs: this.glyphCoords };
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.font = 'bold 24px monospace';
      ctx.textBaseline = 'top';

      const chars = '0123456789CRIT-';
      let currentX = 0;

      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        const w = Math.ceil(ctx.measureText(ch).width) + 4;
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(ch, currentX + 2, 4);
        ctx.fillText(ch, currentX + 2, 4);

        this.glyphCoords.set(ch, { x: currentX, y: 0, w, h: 32 });
        currentX += w;
      }
    }

    this.atlasCanvas = canvas;
    return { canvas, glyphs: this.glyphCoords };
  }
}
