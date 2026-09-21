/**
 * SharedArrayBufferQueue.ts - SCR-05-16
 * 호가 변동 및 체결 틱을 고속 처리하는 링 버퍼 기반 제로 카피 큐
 */

export interface OrderTick {
  id: number;
  price: number;
  amount: number;
  type: 'buy' | 'sell';
  timestamp: number;
}

export class SharedArrayBufferQueue {
  private buffer: OrderTick[] = [];
  private maxSize: number;

  constructor(maxSize = 200) {
    this.maxSize = maxSize;
  }

  public enqueue(tick: OrderTick) {
    if (this.buffer.length >= this.maxSize) {
      this.buffer.shift();
    }
    this.buffer.push(tick);
  }

  public drain(): OrderTick[] {
    const copy = [...this.buffer];
    this.buffer = [];
    return copy;
  }

  public peek(): OrderTick[] {
    return this.buffer;
  }
}
