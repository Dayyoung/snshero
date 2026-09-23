/**
 * NotificationQueueWorker.ts - SCR-11-22
 * 다중 알림 팝업 요청을 우선순위 큐로 정렬/디큐하는 Web Worker
 */

export interface NotificationItem {
  id: string;
  title: string;
  priority: number; // 0: High, 1: Normal, 2: Low
  reward: string;
}

const queue: NotificationItem[] = [];

self.onmessage = (e: MessageEvent<{ action: 'push' | 'pop'; item?: NotificationItem }>) => {
  const { action, item } = e.data;

  if (action === 'push' && item) {
    queue.push(item);
    queue.sort((a, b) => a.priority - b.priority);
    (self as any).postMessage({ queueLength: queue.length });
  } else if (action === 'pop') {
    const next = queue.shift() || null;
    (self as any).postMessage({ nextItem: next });
  }
};
