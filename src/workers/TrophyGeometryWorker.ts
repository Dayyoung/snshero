/**
 * TrophyGeometryWorker.ts - SCR-10-22
 * 우승자 3D 트로피 지오메트리 버퍼를 백그라운드에서 프리패스 계산하는 Web Worker
 */

self.onmessage = (e: MessageEvent<{ trophyType: string; segments: number }>) => {
  const { segments } = e.data;
  const positions: number[] = [];
  const normals: number[] = [];

  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta);
    const z = Math.sin(theta);
    positions.push(x, 1.0, z, x * 0.5, 0.0, z * 0.5);
    normals.push(x, 0.0, z, x, 0.0, z);
  }

  (self as any).postMessage({
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
  });
};
