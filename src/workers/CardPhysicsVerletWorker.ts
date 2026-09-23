/**
 * CardPhysicsVerletWorker.ts - SCR-04-16
 * 10연차 카드 분산 시 각 카드의 충돌 및 3D 회전을 Verlet 적분으로 초당 60fps 무감속 계산하는 물리 Web Worker
 */

export interface PhysicsCardPoint {
  id: number;
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  angle: number;
  angleVel: number;
}

let cards: PhysicsCardPoint[] = [];
let animInterval: any = null;

self.onmessage = (e: MessageEvent<{ action: 'init' | 'step' | 'stop'; count?: number }>) => {
  const { action, count = 10 } = e.data;

  if (action === 'init') {
    cards = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const speed = 8 + Math.random() * 6;
      const x = 200;
      const y = 300;
      return {
        id: i,
        x,
        y,
        oldX: x - Math.cos(angle) * speed,
        oldY: y - Math.sin(angle) * speed,
        angle: Math.random() * Math.PI,
        angleVel: (Math.random() - 0.5) * 0.2,
      };
    });

    if (animInterval) clearInterval(animInterval);
    animInterval = setInterval(() => {
      // Verlet integration step with damping
      cards.forEach(c => {
        const vx = (c.x - c.oldX) * 0.95;
        const vy = (c.y - c.oldY) * 0.95 + 0.3; // Gravity
        c.oldX = c.x;
        c.oldY = c.y;
        c.x += vx;
        c.y += vy;
        c.angle += c.angleVel;
        c.angleVel *= 0.98;
      });
      self.postMessage(cards);
    }, 16);
  } else if (action === 'stop') {
    if (animInterval) {
      clearInterval(animInterval);
      animInterval = null;
    }
  }
};
