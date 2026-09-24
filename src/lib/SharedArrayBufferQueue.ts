/**
 * SharedArrayBufferQueue.ts - SCR-05-16
 * 고빈도 호가 체결 틱 큐 및 타입 정의
 */

export interface OrderTick {
  id?: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  timestamp?: number;
}

export class SharedArrayBufferQueue {
  private queue: OrderTick[] = [];
  private maxCapacity: number;

  constructor(maxCapacity = 100) {
    this.maxCapacity = maxCapacity;
  }

  public enqueue(tick: OrderTick): void {
    this.queue.push(tick);
    if (this.queue.length > this.maxCapacity) {
      this.queue.shift();
    }
  }

  public getSnapshot(): OrderTick[] {
    return [...this.queue];
  }

  public clear(): void {
    this.queue = [];
  }
}

export default SharedArrayBufferQueue;
