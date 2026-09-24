/**
 * BitmapFontBaker.ts - SCR-02-22
 * 데미지 숫자 사전 래스터화 비트맵 아틀라스 생성기
 */

export interface GlyphMetric {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class BitmapFontBaker {
  private static cachedAtlas: {
    canvas: HTMLCanvasElement;
    glyphs: Map<string, GlyphMetric>;
  } | null = null;

  public static getAtlas(): {
    canvas: HTMLCanvasElement;
    glyphs: Map<string, GlyphMetric>;
  } {
    if (this.cachedAtlas) {
      return this.cachedAtlas;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const glyphs = new Map<string, GlyphMetric>();
    const chars = '0123456789+-CRIT!MISSxK% ';

    if (ctx) {
      ctx.font = 'bold 24px monospace';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';

      let currentX = 4;
      const currentY = 4;

      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        const measure = ctx.measureText(ch);
        const w = Math.ceil(measure.width) + 6;
        const h = 32;

        // Draw shadow / stroke
        ctx.fillStyle = '#000000';
        ctx.fillText(ch, currentX + 2, currentY + 2);

        // Draw text
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(ch, currentX, currentY);

        glyphs.set(ch, {
          x: currentX,
          y: currentY,
          w,
          h,
        });

        currentX += w + 2;
      }
    }

    this.cachedAtlas = { canvas, glyphs };
    return this.cachedAtlas;
  }
}

export default BitmapFontBaker;
