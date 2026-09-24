/**
 * ParticleSimdWorker.ts - SCR-08-16
 * 융합 룬 마법진 스파크 파티클 SIMD/멀티스레드 연산 인터페이스 및 타입 정의
 */

export interface SimdParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class ParticleSimdWorker {
  public static updateBatch(particles: SimdParticle[]): SimdParticle[] {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
    }
    return particles.filter(p => p.life > 0);
  }
}

export default ParticleSimdWorker;
