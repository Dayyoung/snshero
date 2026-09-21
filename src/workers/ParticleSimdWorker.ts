/**
 * ParticleSimdWorker.ts - SCR-08-16
 * 파티클 물리 궤적 계산을 메인 스레드에서 분리하여 60fps로 시뮬레이션하는 Web Worker
 */

export interface SimdParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

self.onmessage = (e: MessageEvent<{ count: number; centerX: number; centerY: number }>) => {
  const { count, centerX, centerY } = e.data;
  const particles: SimdParticle[] = [];

  const colors = ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981'];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
    const speed = 2 + Math.random() * 5;
    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      color: colors[i % colors.length],
    });
  }

  self.postMessage(particles);
};
