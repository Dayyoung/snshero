/**
 * UnifiedTimerWorker.ts - SCR-11-13
 * 수십 개 퀘스트의 개별 setInterval을 단일 1초 틱 워커로 통합하여 불필요한 메인스레드 DOM 리렌더링을 차단하는 Web Worker
 */

export interface TimerTarget {
  id: string;
  remainingSeconds: number;
}

let targets: Map<string, number> = new Map();
let timerInterval: any = null;

self.onmessage = (e: MessageEvent<{ action: 'register' | 'unregister' | 'reset'; data?: TimerTarget[] }>) => {
  const { action, data } = e.data;

  if (action === 'register' && data) {
    data.forEach(item => {
      targets.set(item.id, item.remainingSeconds);
    });

    if (!timerInterval) {
      timerInterval = setInterval(() => {
        const payload: { id: string; remaining: number }[] = [];
        targets.forEach((rem, id) => {
          const next = Math.max(0, rem - 1);
          targets.set(id, next);
          payload.push({ id, remaining: next });
        });
        self.postMessage(payload);
      }, 1000);
    }
  } else if (action === 'unregister') {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    targets.clear();
  }
};
