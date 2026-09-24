/**
 * CardPhysicsVerletWorker.ts - SCR-04-16
 * 10연속 카드 소환 60fps 베를레 물리 시뮬레이션 인터페이스 및 타입 정의
 */

export interface PhysicsCardPoint {
  x: number;
  y: number;
  angle: number;
  vx?: number;
  vy?: number;
  angularVelocity?: number;
  id?: string | number;
}

export class CardPhysicsVerletWorker {
  public static simulateStep(points: PhysicsCardPoint[], bounds = { width: 400, height: 600 }): PhysicsCardPoint[] {
    return points.map(p => {
      const vx = (p.vx ?? 0) * 0.96;
      const vy = (p.vy ?? 0) * 0.96 + 0.3; // gravity
      const angle = p.angle + (p.angularVelocity ?? 0.02);

      let newX = p.x + vx;
      let newY = p.y + vy;

      if (newX < 30 || newX > bounds.width - 30) {
        newX = Math.max(30, Math.min(bounds.width - 30, newX));
      }

      return {
        ...p,
        x: newX,
        y: newY,
        vx,
        vy,
        angle,
      };
    });
  }
}

export default CardPhysicsVerletWorker;
