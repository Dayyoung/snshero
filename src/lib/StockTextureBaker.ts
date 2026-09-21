/**
 * StockTextureBaker.ts - SCR-06-16
 * 전 종목 시세(50개 이상)를 16.6ms 주기로 단일 텍스처 아틀라스로 일괄 베이킹하는 고성능 베이커
 */

export interface StockMiniChartData {
  symbol: string;
  prices: number[];
  changePercent: number;
}

export class StockTextureBaker {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;

  constructor(width = 512, height = 512) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
  }

  public bakeAtlas(stocks: StockMiniChartData[]): HTMLCanvasElement {
    if (!this.ctx) return this.canvas;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, w, h);

    const cols = 8;
    const rows = 8;
    const cellW = w / cols;
    const cellH = h / rows;

    stocks.slice(0, 64).forEach((stock, idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      const x = c * cellW;
      const y = r * cellH;

      const isUp = stock.changePercent >= 0;
      ctx.strokeStyle = isUp ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const pLen = stock.prices.length;
      if (pLen > 1) {
        const minP = Math.min(...stock.prices);
        const maxP = Math.max(...stock.prices);
        const range = maxP - minP || 1;

        stock.prices.forEach((p, pIdx) => {
          const px = x + 4 + (pIdx / (pLen - 1)) * (cellW - 8);
          const py = y + cellH - 4 - ((p - minP) / range) * (cellH - 8);
          if (pIdx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      }
    });

    return this.canvas;
  }
}
