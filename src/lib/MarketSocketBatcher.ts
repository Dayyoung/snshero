/**
 * SNSHero Revolution - Market Socket Batcher
 * SCR-05-07: 초당 수십 건의 호가/체결 웹소켓 틱을 150ms RAF 배치 윈도우로 버퍼링하여
 * DOM 리렌더링 폭풍을 차단하고 60fps를 방어하는 배치 스케줄러
 */

export interface OrderBookTick {
  price: number;
  amount: number;
  type: 'buy' | 'sell';
  timestamp: number;
}

export class MarketSocketBatcher {
  private buffer: OrderBookTick[] = [];
  private rafId: number | null = null;
  private lastFlushTime = 0;
  private flushCallback: ((ticks: OrderBookTick[]) => void) | null = null;

  constructor(flushCallback: (ticks: OrderBookTick[]) => void) {
    this.flushCallback = flushCallback;
  }

  public pushTick(tick: OrderBookTick): void {
    this.buffer.push(tick);

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.checkFlush);
    }
  }

  private checkFlush = (timestamp: number): void => {
    if (timestamp - this.lastFlushTime >= 150) {
      if (this.buffer.length > 0 && this.flushCallback) {
        this.flushCallback([...this.buffer]);
        this.buffer = [];
      }
      this.lastFlushTime = timestamp;
    }

    if (this.buffer.length > 0) {
      this.rafId = requestAnimationFrame(this.checkFlush);
    } else {
      this.rafId = null;
    }
  };

  public destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.buffer = [];
    this.flushCallback = null;
  }
}
