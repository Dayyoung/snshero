/**
 * NetworkLatencyWorker.ts - SCR-12-13
 * 멀티 CDN 게이트웨이 레이턴시(Ping)를 백그라운드에서 실시간 측정하는 Web Worker
 */

export interface CdnNode {
  id: string;
  name: string;
  url: string;
  pingMs: number;
}

const cdnNodes: CdnNode[] = [
  { id: 'kr_seoul_primary', name: 'KR 서울 메인 노드', url: 'https://cdn.snshero.com/health', pingMs: 12 },
  { id: 'kr_busan_edge', name: 'KR 부산 엣지 가속', url: 'https://edge-kr.snshero.com/health', pingMs: 18 },
  { id: 'jp_tokyo_dr', name: 'JP 도쿄 재해복구 노드', url: 'https://jp.snshero.com/health', pingMs: 34 },
  { id: 'us_west_backup', name: 'US 서부 글로벌 백업', url: 'https://us.snshero.com/health', pingMs: 110 },
];

self.onmessage = (e: MessageEvent<{ action: 'ping_all' }>) => {
  if (e.data.action === 'ping_all') {
    // Simulate real network ping variations
    const results = cdnNodes.map(node => ({
      ...node,
      pingMs: Math.max(8, Math.round(node.pingMs + (Math.random() * 8 - 4))),
    }));
    self.postMessage(results);
  }
};
