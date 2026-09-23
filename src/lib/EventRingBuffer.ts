/**
 * EventRingBuffer.ts - SCR-07-22
 * 실시간 경기 이벤트 데이터를 고속으로 큐잉하고 메모리 할당 없이 재활용하는 비동기 링 버퍼
 */

export interface MatchEventData {
  id: string;
  type: 'goal' | 'kill' | 'turn_pass' | 'critical';
  teamId: string;
  probShift: number; // e.g. +0.15
  timestamp: number;
}

export class EventRingBuffer {
  private buffer: (MatchEventData | null)[];
  private head = 0;
  private tail = 0;
  private count = 0;
  private capacity: number;

  constructor(capacity = 64) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
  }

  public push(event: MatchEventData): boolean {
    if (this.count >= this.capacity) {
      // Overwrite oldest
      this.tail = (this.tail + 1) % this.capacity;
      this.count--;
    }

    this.buffer[this.head] = event;
    this.head = (this.head + 1) % this.capacity;
    this.count++;
    return true;
  }

  public pop(): MatchEventData | null {
    if (this.count === 0) return null;
    const item = this.buffer[this.tail];
    this.buffer[this.tail] = null;
    this.tail = (this.tail + 1) % this.capacity;
    this.count--;
    return item;
  }

  public getLength(): number {
    return this.count;
  }
}
