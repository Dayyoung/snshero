/**
 * ParticleObjectPool.ts - SCR-07-25
 * GC 스파이크를 원천 방지하는 사전 할당 파티클 오브젝트 풀(Object Pooling).
 */

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  rotation: number;
  vr: number; // Angular velocity
  color: [number, number, number, number]; // RGBA
  life: number;
  maxLife: number;
}

export class ParticleObjectPool {
  private pool: Particle[];
  private capacity: number;

  constructor(capacity: number = 300) {
    this.capacity = capacity;
    this.pool = new Array(capacity);
    for (let i = 0; i < capacity; i++) {
      this.pool[i] = {
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        scale: 10,
        rotation: 0,
        vr: 0,
        color: [1, 1, 1, 1],
        life: 0,
        maxLife: 1,
      };
    }
  }

  spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    scale: number,
    color: [number, number, number, number],
    durationSeconds: number
  ): Particle | null {
    for (let i = 0; i < this.capacity; i++) {
      const p = this.pool[i];
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.scale = scale;
        p.rotation = Math.random() * Math.PI * 2;
        p.vr = (Math.random() - 0.5) * 4;
        p.color = color;
        p.life = 0;
        p.maxLife = durationSeconds;
        return p;
      }
    }
    return null;
  }

  update(deltaSec: number): void {
    for (let i = 0; i < this.capacity; i++) {
      const p = this.pool[i];
      if (p.active) {
        p.life += deltaSec;
        if (p.life >= p.maxLife) {
          p.active = false;
          continue;
        }

        p.x += p.vx * deltaSec;
        p.y += p.vy * deltaSec;
        p.rotation += p.vr * deltaSec;

        // Fade out alpha
        const progress = p.life / p.maxLife;
        p.color[3] = 1 - progress;
      }
    }
  }

  getActiveParticles(): Particle[] {
    return this.pool.filter((p) => p.active);
  }

  clear(): void {
    for (let i = 0; i < this.capacity; i++) {
      this.pool[i].active = false;
    }
  }
}
