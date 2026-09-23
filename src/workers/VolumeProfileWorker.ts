/**
 * VolumeProfileWorker.ts - SCR-05-19
 * 수만 건의 틱 거래량 데이터를 Web Worker 백그라운드 스레드에서 가격대별 볼륨 프로파일 히스토그램으로 집계
 */

interface TradeTick {
  price: number;
  volume: number;
}

self.onmessage = (e: MessageEvent<{ ticks: TradeTick[]; bucketSize: number }>) => {
  const { ticks, bucketSize } = e.data;
  const buckets: Record<number, number> = {};

  for (let i = 0; i < ticks.length; i++) {
    const t = ticks[i];
    const bucketKey = Math.floor(t.price / bucketSize) * bucketSize;
    buckets[bucketKey] = (buckets[bucketKey] || 0) + t.volume;
  }

  self.postMessage({ buckets });
};
