export interface OrderBookTick {
  price: number;
  amount: number;
  type: 'buy' | 'sell';
  timestamp: number;
}

export class MarketSocketBatcher {
  private buffer: OrderBookTick[] = [];
  private timer: any = null;
  private onFlush: (ticks: OrderBookTick[]) => void;
  private batchIntervalMs: number;

  constructor(onFlush: (ticks: OrderBookTick[]) => void, batchIntervalMs = 150) {
    this.onFlush = onFlush;
    this.batchIntervalMs = batchIntervalMs;
  }

  public pushTick(tick: OrderBookTick): void {
    this.buffer.push(tick);
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush();
      }, this.batchIntervalMs);
    }
  }

  public flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.buffer.length > 0) {
      const ticks = [...this.buffer];
      this.buffer = [];
      this.onFlush(ticks);
    }
  }

  public destroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.buffer = [];
  }
}
