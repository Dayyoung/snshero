// ─── Extreme Crush Effect Manager ───────────────────────────────────────────
import { CombatCameraSystem } from './CombatCameraSystem';
import { triggerHaptic } from '../lib/haptic';

export interface ShatterShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface CrushEventCallback {
  (details: {
    x: number;
    y: number;
    damage: number;
    element?: string;
    isWeakness: boolean;
    isCrit: boolean;
  }): void;
}

export class ExtremeCrushEffectManager {
  private isBlackout: boolean = false;
  private blackoutTimer: number = 0;
  private shards: ShatterShard[] = [];
  private listeners: CrushEventCallback[] = [];

  /**
   * Subscribe to crush event activations
   */
  public onCrush(cb: CrushEventCallback): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== cb);
    };
  }

  /**
   * Trigger the full Extreme Crush dopamine pipeline
   */
  public triggerCrush(
    x: number,
    y: number,
    damage: number,
    camera: CombatCameraSystem,
    options: {
      element?: string;
      isWeakness?: boolean;
      isCrit?: boolean;
      playSfx?: (url: string) => void;
    } = {}
  ): void {
    // 1. 0.05s Momentary Blackout
    this.isBlackout = true;
    this.blackoutTimer = 0.05; // 50ms

    // 2. 3-stage pulse haptic vibration [40ms, 30ms pause, 80ms, 30ms pause, 150ms heavy punch]
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 30, 80, 30, 150]);
      } catch {
        triggerHaptic('special');
      }
    } else {
      triggerHaptic('special');
    }

    // 3. High-intensity camera trauma injection
    camera.triggerCrushShock();

    // 4. Sound FX
    if (options.playSfx) {
      try {
        // High impact audio feedback
        options.playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      } catch {}
    }

    // 5. Generate radial screen shatter shards
    this.spawnShatter(x, y, options.element);

    // 6. Notify subscribers
    for (const listener of this.listeners) {
      try {
        listener({
          x,
          y,
          damage,
          element: options.element,
          isWeakness: Boolean(options.isWeakness),
          isCrit: Boolean(options.isCrit)
        });
      } catch (err) {
        console.error('[ExtremeCrushEffectManager] Listener error:', err);
      }
    }
  }

  /**
   * Spawn radial screen fracture fragments
   */
  private spawnShatter(centerX: number, centerY: number, element?: string): void {
    const shardCount = 28;
    const colors = [
      '#ffffff',
      '#f43f5e', // Rose / Crit
      '#38bdf8', // Ice / Weakness
      '#fbbf24', // Lightning / Gold
      '#c084fc'  // Arcane / Purple
    ];

    for (let i = 0; i < shardCount; i++) {
      const angle = (i / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 250 + Math.random() * 350;

      this.shards.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 12,
        size: 8 + Math.random() * 20,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.25,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  /**
   * Update blackout and shatter physics
   * @param dt Delta time in seconds
   */
  public update(dt: number): void {
    if (this.blackoutTimer > 0) {
      this.blackoutTimer -= dt;
      if (this.blackoutTimer <= 0) {
        this.isBlackout = false;
      }
    }

    for (let i = this.shards.length - 1; i >= 0; i--) {
      const shard = this.shards[i];
      shard.life += dt;
      if (shard.life >= shard.maxLife) {
        this.shards.splice(i, 1);
        continue;
      }

      shard.x += shard.vx * dt;
      shard.y += shard.vy * dt;
      shard.rotation += shard.vRot * dt;
      shard.vx *= 0.94; // air friction
      shard.vy *= 0.94;
    }
  }

  /**
   * Render screen shatter overlay on Canvas
   */
  public renderOverlay(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // 1. Blackout flash
    if (this.isBlackout) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 2. Shatter shards
    if (this.shards.length > 0) {
      ctx.save();
      for (const s of this.shards) {
        const progress = s.life / s.maxLife;
        const alpha = Math.max(0, 1.0 - progress);

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.strokeStyle = '#050505';
        ctx.lineWidth = 1.5;

        // Draw triangular glass shard
        ctx.beginPath();
        ctx.moveTo(0, -s.size);
        ctx.lineTo(s.size * 0.6, s.size * 0.7);
        ctx.lineTo(-s.size * 0.6, s.size * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }
      ctx.restore();
    }
  }

  public getIsBlackout(): boolean {
    return this.isBlackout;
  }

  public clear(): void {
    this.isBlackout = false;
    this.blackoutTimer = 0;
    this.shards = [];
  }
}
