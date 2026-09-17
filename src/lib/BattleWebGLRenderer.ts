/**
 * SNSHero Revolution - Battle WebGL & Canvas FX Renderer
 * SCR-02-07: 대량 연쇄 뒤집기 및 충격파 파티클 렌더링을 가벼운 Canvas 2D/GPU 레이어로 분리하여
 * DOM 리플로우를 배제하고 60fps 무지연 플립 애니메이션 보장
 */

export interface FlipParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class BattleWebGLRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: FlipParticle[] = [];
  private animId: number | null = null;

  public init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.resize();
  }

  public resize(): void {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.clientWidth || 360;
    this.canvas.height = this.canvas.clientHeight || 360;
  }

  public triggerFlipShockwave(centerX: number, centerY: number, count = 16): void {
    if (!this.ctx) return;

    const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.2);
      const speed = Math.random() * 4 + 2;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 20 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3 + 2,
      });
    }

    if (!this.animId) {
      this.loop();
    }
  }

  private loop = (): void => {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      const progress = p.life / p.maxLife;
      if (progress >= 1) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = 1 - progress;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * (1 - progress * 0.5), 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(this.loop);
    } else {
      this.animId = null;
    }
  };

  public destroy(): void {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.particles = [];
  }
}
