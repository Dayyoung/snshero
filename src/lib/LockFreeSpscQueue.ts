/**
 * LockFreeSpscQueue.ts - SCR-07-19
 * SharedArrayBuffer 기반 단일 생산자-단일 소비자(SPSC) 락-프리 원형 큐
 */

export class LockFreeSpscQueue {
  private buffer: SharedArrayBuffer | ArrayBuffer;
  private header: Int32Array; // [0]: writeIndex, [1]: readIndex
  private data: Float64Array;
  private capacity: number;

  constructor(capacity = 256) {
    this.capacity = capacity;
    const isSabAvailable = typeof SharedArrayBuffer !== 'undefined';
    const totalBytes = 8 + capacity * 8; // 2 * Int32 + capacity * Float64
    this.buffer = isSabAvailable ? new SharedArrayBuffer(totalBytes) : new ArrayBuffer(totalBytes);
    this.header = new Int32Array(this.buffer, 0, 2);
    this.data = new Float64Array(this.buffer, 8, capacity);
  }

  public enqueue(val: number): boolean {
    const w = Atomics.load(this.header, 0);
    const r = Atomics.load(this.header, 1);
    const nextW = (w + 1) % this.capacity;

    if (nextW === r) {
      return false; // Queue full
    }

    this.data[w] = val;
    Atomics.store(this.header, 0, nextW);
    return true;
  }

  public dequeue(): number | null {
    const w = Atomics.load(this.header, 0);
    const r = Atomics.load(this.header, 1);

    if (r === w) {
      return null; // Empty
    }

    const val = this.data[r];
    const nextR = (r + 1) % this.capacity;
    Atomics.store(this.header, 1, nextR);
    return val;
  }
}
