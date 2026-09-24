/**
 * StockTextureBaker.ts - SCR-06-16
 * 전 종목 미니차트 고속 아틀라스 텍스처 베이커
 */

export interface StockMiniChartData {
  id: string;
  symbol: string;
  prices: number[];
  changePercent?: number;
  isUp?: boolean;
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
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    if (stocks.length === 0) return this.canvas;

    const cols = 4;
    const rows = Math.ceil(stocks.length / cols);
    const cellW = w / cols;
    const cellH = h / Math.max(1, rows);

    stocks.forEach((stock, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = col * cellW;
      const y = row * cellH;

      const isUp = stock.isUp ?? ((stock.prices[stock.prices.length - 1] ?? 0) >= (stock.prices[0] ?? 0));
      const strokeColor = isUp ? '#10b981' : '#f43f5e';

      // Cell Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeRect(x, y, cellW, cellH);

      // Symbol
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(stock.symbol, x + 4, y + 14);

      // Sparkline
      const prices = stock.prices;
      if (prices && prices.length > 1) {
        const minP = Math.min(...prices);
        const maxP = Math.max(...prices);
        const range = maxP - minP || 1;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        prices.forEach((p, pIdx) => {
          const px = x + 4 + (pIdx / (prices.length - 1)) * (cellW - 8);
          const py = y + cellH - 6 - ((p - minP) / range) * (cellH - 24);
          if (pIdx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });

        ctx.stroke();
      }
    });

    return this.canvas;
  }
}

export default StockTextureBaker;
