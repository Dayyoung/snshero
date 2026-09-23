/**
 * TreemapLayoutWorker.ts - SCR-06-22
 * 스쿼리파이드(Squarified) 트리맵 분할 알고리즘을 백그라운드에서 계산하는 Web Worker
 */

export interface TreemapNode {
  id: string;
  name: string;
  value: number;
  change: number; // percentage
}

export interface ComputedRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: [number, number, number];
}

self.onmessage = (e: MessageEvent<{ nodes: TreemapNode[]; width: number; height: number }>) => {
  const { nodes, width, height } = e.data;
  const total = nodes.reduce((sum, n) => sum + n.value, 0) || 1;

  let currentY = 0;
  const rects: ComputedRect[] = [];

  nodes.forEach((node) => {
    const nodeHeight = (node.value / total) * height;
    const isUp = node.change >= 0;
    const intensity = Math.min(1, Math.abs(node.change) / 10);

    const color: [number, number, number] = isUp
      ? [0.1, 0.4 + intensity * 0.4, 0.2]
      : [0.5 + intensity * 0.4, 0.1, 0.1];

    rects.push({
      id: node.id,
      x: 0,
      y: currentY,
      w: width,
      h: Math.max(4, nodeHeight),
      color,
    });
    currentY += nodeHeight;
  });

  (self as any).postMessage({ rects });
};
