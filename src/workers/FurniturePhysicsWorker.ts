/**
 * FurniturePhysicsWorker.ts - SCR-09-22
 * 길드 하우스 가구 충돌 및 물리 연산을 백그라운드에서 처리하는 Web Worker
 */

import { BvhSpatialIndex } from '../lib/BvhSpatialIndex';

const bvh = new BvhSpatialIndex();

self.onmessage = (e: MessageEvent<{ type: string; furniture?: { id: string; x: number; y: number; w: number; h: number }[]; checkPoint?: { x: number; y: number } }>) => {
  const { type, furniture, checkPoint } = e.data;

  if (type === 'init' && furniture) {
    furniture.forEach((f) => {
      bvh.insert({
        id: f.id,
        minX: f.x,
        minY: f.y,
        maxX: f.x + f.w,
        maxY: f.y + f.h,
      });
    });
    (self as any).postMessage({ status: 'ready' });
  } else if (type === 'check' && checkPoint) {
    const hit = bvh.queryPoint(checkPoint.x, checkPoint.y);
    (self as any).postMessage({ hitId: hit ? hit.id : null });
  }
};
