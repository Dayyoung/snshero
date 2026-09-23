/**
 * EntityInterpolationEngine.ts - SCR-09-13
 * 멀티플레이어 위치 텔레포트/러버밴딩 방지 60fps 스무스 보간 엔진
 */

interface PositionSample {
  x: number;
  y: number;
  time: number;
}

export class EntityInterpolationEngine {
  private buffer: Map<string, PositionSample[]> = new Map();
  private interpolationDelayMs = 100; // 100ms render buffer delay

  public pushSample(entityId: string, x: number, y: number, time = Date.now()) {
    let samples = this.buffer.get(entityId);
    if (!samples) {
      samples = [];
      this.buffer.set(entityId, samples);
    }
    samples.push({ x, y, time });
    // Keep only recent 10 samples
    if (samples.length > 10) {
      samples.shift();
    }
  }

  public getInterpolatedPosition(entityId: string, now = Date.now()): { x: number; y: number } | null {
    const samples = this.buffer.get(entityId);
    if (!samples || samples.length === 0) return null;
    if (samples.length === 1) return { x: samples[0].x, y: samples[0].y };

    const renderTime = now - this.interpolationDelayMs;

    // Find two samples surrounding renderTime
    for (let i = samples.length - 1; i > 0; i--) {
      const p1 = samples[i - 1];
      const p2 = samples[i];
      if (p1.time <= renderTime && renderTime <= p2.time) {
        const span = p2.time - p1.time;
        if (span <= 0) return { x: p2.x, y: p2.y };
        const factor = (renderTime - p1.time) / span;
        return {
          x: p1.x + (p2.x - p1.x) * factor,
          y: p1.y + (p2.y - p1.y) * factor,
        };
      }
    }

    // Default to newest sample
    const latest = samples[samples.length - 1];
    return { x: latest.x, y: latest.y };
  }
}
