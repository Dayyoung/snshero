/**
 * FastForwardCatchup.ts - SCR-02-16
 * 백그라운드 전환 복귀 시 지연된 배틀 틱 이벤트를 0ms 내에 쾌속 압축 재생(Fast-Forward)하는 60fps 무지연 복구 엔진
 */

export interface QueuedBattleEvent {
  id: string;
  type: 'card_play' | 'damage' | 'heal' | 'turn_end';
  payload: any;
  timestamp: number;
}

export class FastForwardCatchup {
  private queue: QueuedBattleEvent[] = [];
  private isProcessing = false;

  public enqueue(event: QueuedBattleEvent) {
    this.queue.push(event);
  }

  public fastForwardAll(applyEvent: (event: QueuedBattleEvent) => void, onComplete: () => void) {
    if (this.queue.length === 0) {
      onComplete();
      return;
    }

    this.isProcessing = true;
    // Process all pending events in a rapid compressed batch
    while (this.queue.length > 0) {
      const ev = this.queue.shift();
      if (ev) {
        applyEvent(ev);
      }
    }
    this.isProcessing = false;
    onComplete();
  }

  public getPendingCount(): number {
    return this.queue.length;
  }
}
