/**
 * TimeSeriesRingBuffer.ts - SCR-06-13
 * Float64Array 기반 순환 링 버퍼 (Zero-Allocation O(1) 틱 버퍼)
 * 틱당 [timestamp, open, high, low, close, volume] 6개 필드 관리
 */

export class TimeSeriesRingBuffer {
  private buffer: Float64Array;
  private capacity: number;
  private head: number = 0;
  private size: number = 0;
  private stride: number = 6;

  constructor(capacity: number = 500) {
    this.capacity = capacity;
    this.buffer = new Float64Array(capacity * this.stride);
  }

  public push(time: number, open: number, high: number, low: number, close: number, volume: number): void {
    const offset = this.head * this.stride;
    this.buffer[offset] = time;
    this.buffer[offset + 1] = open;
    this.buffer[offset + 2] = high;
    this.buffer[offset + 3] = low;
    this.buffer[offset + 4] = close;
    this.buffer[offset + 5] = volume;

    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }

  public getSize(): number {
    return this.size;
  }

  public getRawBuffer(): Float64Array {
    return this.buffer;
  }

  public getAt(index: number): { time: number; open: number; high: number; low: number; close: number; volume: number } | null {
    if (index < 0 || index >= this.size) return null;
    const actualIndex = (this.head - this.size + index + this.capacity) % this.capacity;
    const offset = actualIndex * this.stride;
    return {
      time: this.buffer[offset],
      open: this.buffer[offset + 1],
      high: this.buffer[offset + 2],
      low: this.buffer[offset + 3],
      close: this.buffer[offset + 4],
      volume: this.buffer[offset + 5],
    };
  }

  public getLatestClose(): number {
    if (this.size === 0) return 0;
    const lastIndex = (this.head - 1 + this.capacity) % this.capacity;
    return this.buffer[lastIndex * this.stride + 4];
  }
}
