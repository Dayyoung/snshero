/**
 * GachaParticlePool.ts - SCR-04-28
 * 소환 연출 시 메모리 할당(Allocations)과 WebGL 텍스처 누수를 방지하기 위해
 * 500개의 황금/무지개 소환 파티클을 사전 할당하여 재활용하는 고성능 정적 오브젝트 풀.
 */

export interface GachaParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
  life: number;
  maxLife: number;
}

export class GachaParticlePool {
  private static pool: GachaParticle[] = [];
  private static readonly MAX_PARTICLES = 500;

  static init(): void {
    if (this.pool.length > 0) return;
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      this.pool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 5,
        alpha: 1,
        hue: 45,
        life: 0,
        maxLife: 1.5,
      });
    }
  }

  static spawnBurst(originX: number, originY: number, count: number, isRainbow = false): void {
    this.init();
    let spawned = 0;
    for (let i = 0; i < this.MAX_PARTICLES && spawned < count; i++) {
      const p = this.pool[i];
      if (!p.active) {
        p.active = true;
        p.x = originX;
        p.y = originY;
        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 250;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.size = 3 + Math.random() * 6;
        p.alpha = 1.0;
        p.hue = isRainbow ? Math.floor(Math.random() * 360) : 45 + Math.random() * 20;
        p.life = 0;
        p.maxLife = 1.0 + Math.random() * 0.8;
        spawned++;
      }
    }
  }

  static update(deltaSec: number): void {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (p.active) {
        p.life += deltaSec;
        if (p.life >= p.maxLife) {
          p.active = false;
          continue;
        }

        p.x += p.vx * deltaSec;
        p.y += p.vy * deltaSec;
        p.vy += 120 * deltaSec; // gravity

        const progress = p.life / p.maxLife;
        p.alpha = 1 - progress;
      }
    }
  }

  static getActiveParticles(): GachaParticle[] {
    return this.pool.filter((p) => p.active);
  }

  static reset(): void {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].active = false;
    }
  }
}
