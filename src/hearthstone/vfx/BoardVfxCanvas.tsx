import React, { useEffect, useRef } from 'react';
import { hsAudio } from '../audio';
import { VfxEvent } from '../types';

interface BoardVfxCanvasProps {
  events: VfxEvent[];
  onScreenShake?: (intensity: 'LIGHT' | 'HEAVY') => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
  shape?: 'CIRCLE' | 'SHARD' | 'RING' | 'STAR';
}

interface Projectile {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t: number;
  speed: number;
  colorCore: string;
  colorGlow: string;
  radius: number;
  kind: VfxEvent['kind'];
  onImpactDone?: boolean;
}

interface FloatingBadge {
  x: number;
  y: number;
  vy: number;
  text: string;
  subKind: 'DAMAGE' | 'HEAL' | 'ARMOR' | 'BUFF' | 'BANNER';
  life: number;
  maxLife: number;
}

function getEntityCenter(entityId?: string): { x: number; y: number } {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (!entityId) return { x: w * 0.5, y: h * 0.46 };
  const el = document.querySelector(`[data-hs-entity="${entityId}"]`);
  if (el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  if (entityId === 'PLAYER_HERO') return { x: w * 0.5, y: h * 0.77 };
  if (entityId === 'OPPONENT_HERO') return { x: w * 0.5, y: h * 0.17 };
  return { x: w * 0.5, y: h * 0.46 };
}

export const BoardVfxCanvas: React.FC<BoardVfxCanvasProps> = ({ events, onScreenShake }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const particlesRef = useRef<Particle[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const badgesRef = useRef<FloatingBadge[]>([]);
  const shakeCbRef = useRef(onScreenShake);
  shakeCbRef.current = onScreenShake;

  const spawnBurst = (
    x: number,
    y: number,
    count: number,
    colors: string[],
    speedMax = 7,
    sizeMax = 9,
    shape: Particle['shape'] = 'CIRCLE',
    gravity = 0.08,
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.2 + Math.random() * speedMax;
      const maxLife = 24 + Math.random() * 28;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * sizeMax,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife,
        gravity,
        shape,
      });
    }
  };

  const spawnRing = (x: number, y: number, color: string, maxSize = 110) => {
    particlesRef.current.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: maxSize,
      color,
      alpha: 1,
      life: 0,
      maxLife: 26,
      shape: 'RING',
    });
  };

  useEffect(() => {
    for (const ev of events) {
      if (seenIdsRef.current.has(ev.id)) continue;
      seenIdsRef.current.add(ev.id);
      if (seenIdsRef.current.size > 400) {
        const arr = Array.from(seenIdsRef.current).slice(-200);
        seenIdsRef.current = new Set(arr);
      }

      const targetPos = getEntityCenter(ev.targetId);
      const sourcePos = ev.sourceId
        ? getEntityCenter(ev.sourceId)
        : { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };

      switch (ev.kind) {
        case 'FIREBALL':
          hsAudio.playProceduralVfxSound('FIRE');
          projectilesRef.current.push({
            x0: sourcePos.x,
            y0: sourcePos.y,
            x1: targetPos.x,
            y1: targetPos.y,
            t: 0,
            speed: 0.065,
            colorCore: '#fef08a',
            colorGlow: '#f97316',
            radius: 17,
            kind: 'FIREBALL',
          });
          break;

        case 'FROSTBOLT':
          hsAudio.playProceduralVfxSound('FROST');
          projectilesRef.current.push({
            x0: sourcePos.x,
            y0: sourcePos.y,
            x1: targetPos.x,
            y1: targetPos.y,
            t: 0,
            speed: 0.072,
            colorCore: '#e0f2fe',
            colorGlow: '#38bdf8',
            radius: 14,
            kind: 'FROSTBOLT',
          });
          break;

        case 'ARCANE_BOLT':
          projectilesRef.current.push({
            x0: sourcePos.x,
            y0: sourcePos.y,
            x1: targetPos.x,
            y1: targetPos.y,
            t: 0,
            speed: 0.085,
            colorCore: '#f5d0fe',
            colorGlow: '#c084fc',
            radius: 11,
            kind: 'ARCANE_BOLT',
          });
          break;

        case 'LIGHTNING':
          hsAudio.playProceduralVfxSound('LIGHTNING');
          spawnBurst(targetPos.x, targetPos.y, 26, ['#e0f2fe', '#60a5fa', '#facc15'], 9, 8, 'SHARD', 0.05);
          spawnRing(targetPos.x, targetPos.y, '#60a5fa', 95);
          break;

        case 'SHADOW_BOLT':
          hsAudio.playProceduralVfxSound('SHADOW');
          projectilesRef.current.push({
            x0: sourcePos.x,
            y0: sourcePos.y,
            x1: targetPos.x,
            y1: targetPos.y,
            t: 0,
            speed: 0.068,
            colorCore: '#e9d5ff',
            colorGlow: '#7e22ce',
            radius: 15,
            kind: 'SHADOW_BOLT',
          });
          break;

        case 'NATURE_WRATH':
          projectilesRef.current.push({
            x0: sourcePos.x,
            y0: sourcePos.y,
            x1: targetPos.x,
            y1: targetPos.y,
            t: 0,
            speed: 0.075,
            colorCore: '#dcfce7',
            colorGlow: '#22c55e',
            radius: 14,
            kind: 'NATURE_WRATH',
          });
          break;

        case 'HOLY_LIGHT':
          hsAudio.playProceduralVfxSound('HOLY');
          spawnBurst(targetPos.x, targetPos.y, 28, ['#fef9c3', '#fde047', '#ffffff'], 5.5, 9, 'STAR', -0.05);
          spawnRing(targetPos.x, targetPos.y, '#fde047', 110);
          break;

        case 'HOLY_NOVA':
          hsAudio.playProceduralVfxSound('HOLY');
          spawnRing(window.innerWidth * 0.5, window.innerHeight * 0.45, '#fde047', 420);
          spawnBurst(
            window.innerWidth * 0.5,
            window.innerHeight * 0.45,
            45,
            ['#fef08a', '#facc15', '#ffffff'],
            11,
            9,
            'STAR',
            0,
          );
          break;

        case 'FLAMESTRIKE': {
          hsAudio.playProceduralVfxSound('FIRE');
          hsAudio.playSfx('big_attack', 0.85);
          shakeCbRef.current?.('HEAVY');
          const yBand = ev.targetId === 'PLAYER_HERO' ? window.innerHeight * 0.56 : window.innerHeight * 0.34;
          for (let i = 0; i < 5; i++) {
            const px = window.innerWidth * (0.26 + i * 0.12);
            spawnBurst(px, yBand, 28, ['#fef08a', '#fb923c', '#ef4444'], 9, 12, 'CIRCLE', -0.12);
            spawnRing(px, yBand, '#f97316', 120);
          }
          break;
        }

        case 'BLIZZARD': {
          hsAudio.playProceduralVfxSound('FROST');
          const yBand = ev.targetId === 'PLAYER_HERO' ? window.innerHeight * 0.56 : window.innerHeight * 0.34;
          for (let i = 0; i < 55; i++) {
            particlesRef.current.push({
              x: window.innerWidth * (0.18 + Math.random() * 0.64),
              y: yBand - 120 + Math.random() * 60,
              vx: -3.5 + Math.random() * 1.5,
              vy: 4.5 + Math.random() * 4,
              size: 5 + Math.random() * 7,
              color: i % 2 === 0 ? '#bae6fd' : '#ffffff',
              alpha: 1,
              life: 0,
              maxLife: 34,
              shape: 'SHARD',
            });
          }
          break;
        }

        case 'CONSECRATION': {
          hsAudio.playProceduralVfxSound('HOLY');
          shakeCbRef.current?.('LIGHT');
          const yBand = ev.targetId === 'PLAYER_HERO' ? window.innerHeight * 0.58 : window.innerHeight * 0.34;
          for (let i = 0; i < 6; i++) {
            const px = window.innerWidth * (0.24 + i * 0.105);
            spawnBurst(px, yBand, 18, ['#fef08a', '#f59e0b', '#ffffff'], 6.5, 9, 'STAR', -0.08);
          }
          spawnRing(window.innerWidth * 0.5, yBand, '#fbbf24', 360);
          break;
        }

        case 'WHIRLWIND':
          hsAudio.playSfx('whoosh', 0.9);
          spawnRing(window.innerWidth * 0.5, window.innerHeight * 0.45, '#cbd5e1', 340);
          spawnBurst(window.innerWidth * 0.5, window.innerHeight * 0.45, 32, ['#f8fafc', '#94a3b8'], 12, 6, 'SHARD', 0);
          break;

        case 'EXPLOSION':
          hsAudio.playSfx('big_attack', 0.9);
          shakeCbRef.current?.('HEAVY');
          spawnBurst(targetPos.x, targetPos.y, 34, ['#fde047', '#f97316', '#dc2626'], 9.5, 11, 'CIRCLE', 0.08);
          spawnRing(targetPos.x, targetPos.y, '#ef4444', 135);
          if (ev.label) {
            badgesRef.current.push({
              x: targetPos.x,
              y: targetPos.y - 28,
              vy: -1.1,
              text: ev.label,
              subKind: 'BANNER',
              life: 0,
              maxLife: 62,
            });
          }
          break;

        case 'DIVINE_BREAK':
          hsAudio.playProceduralVfxSound('DIVINE_BREAK');
          spawnBurst(targetPos.x, targetPos.y, 24, ['#fef08a', '#facc15', '#ffffff'], 7.5, 9, 'SHARD', 0.14);
          spawnRing(targetPos.x, targetPos.y, '#facc15', 85);
          break;

        case 'SILENCE_RING':
          hsAudio.playProceduralVfxSound('SILENCE');
          spawnRing(targetPos.x, targetPos.y, '#c084fc', 90);
          spawnBurst(targetPos.x, targetPos.y, 16, ['#e9d5ff', '#a855f7'], 4, 6, 'CIRCLE', 0);
          break;

        case 'SECRET_REVEAL':
          hsAudio.playProceduralVfxSound('SECRET_TRIGGER');
          spawnRing(targetPos.x, targetPos.y, '#f472b6', 160);
          spawnBurst(targetPos.x, targetPos.y, 28, ['#fbcfe8', '#f472b6', '#fde047'], 7, 8, 'STAR', 0);
          if (ev.label) {
            badgesRef.current.push({
              x: window.innerWidth * 0.5,
              y: window.innerHeight * 0.3,
              vy: -0.6,
              text: `비밀 발동! [${ev.label}]`,
              subKind: 'BANNER',
              life: 0,
              maxLife: 75,
            });
          }
          break;

        case 'LEGENDARY_SLAM':
          hsAudio.playSfx('big_attack', 0.95);
          shakeCbRef.current?.('HEAVY');
          spawnRing(targetPos.x, targetPos.y, '#fbbf24', 180);
          spawnBurst(targetPos.x, targetPos.y, 38, ['#fef08a', '#f59e0b', '#fbbf24'], 9, 10, 'STAR', 0.05);
          break;

        case 'HERO_EXPLODE':
          hsAudio.playSfx('big_attack', 1.0);
          hsAudio.playSfx('victory', 0.95);
          shakeCbRef.current?.('HEAVY');
          spawnRing(targetPos.x, targetPos.y, '#f97316', 290);
          spawnBurst(
            targetPos.x,
            targetPos.y,
            85,
            ['#fef08a', '#f97316', '#ef4444', '#ffffff', '#fbbf24'],
            13,
            14,
            'SHARD',
            0.12,
          );
          break;

        case 'DAMAGE_POP':
          if ((ev.value || 0) >= 5) {
            hsAudio.playSfx('big_attack', 0.8);
            shakeCbRef.current?.('LIGHT');
          } else {
            hsAudio.playSfx('attack', 0.68);
          }
          spawnBurst(targetPos.x, targetPos.y, 12, ['#ef4444', '#fca5a5', '#fde047'], 5.2, 6, 'SHARD', 0.12);
          badgesRef.current.push({
            x: targetPos.x + (Math.random() * 14 - 7),
            y: targetPos.y - 6,
            vy: -1.15,
            text: ev.label || `-${ev.value || 1}`,
            subKind: 'DAMAGE',
            life: 0,
            maxLife: 52,
          });
          break;

        case 'HEAL_POP':
          hsAudio.playProceduralVfxSound('HOLY');
          spawnBurst(targetPos.x, targetPos.y, 14, ['#86efac', '#4ade80', '#fef08a'], 4.2, 6, 'STAR', -0.06);
          badgesRef.current.push({
            x: targetPos.x,
            y: targetPos.y - 10,
            vy: -1.1,
            text: `+${ev.value || 1}`,
            subKind: 'HEAL',
            life: 0,
            maxLife: 50,
          });
          break;

        case 'ARMOR_POP':
          hsAudio.playProceduralVfxSound('ARMOR');
          badgesRef.current.push({
            x: targetPos.x + 22,
            y: targetPos.y - 12,
            vy: -1.0,
            text: `+${ev.value || 1} 방어도`,
            subKind: 'ARMOR',
            life: 0,
            maxLife: 48,
          });
          break;

        case 'BUFF_POP':
          spawnBurst(targetPos.x, targetPos.y, 14, ['#fde047', '#fef9c3'], 4.5, 6, 'STAR', -0.05);
          if (ev.label) {
            badgesRef.current.push({
              x: targetPos.x,
              y: targetPos.y - 18,
              vy: -1.1,
              text: ev.label,
              subKind: 'BUFF',
              life: 0,
              maxLife: 46,
            });
          }
          break;
      }
    }
  }, [events]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const syncSize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    syncSize();
    window.addEventListener('resize', syncSize);

    let rafId = 0;
    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // 1. Update & Draw Projectiles
      const nextProj: Projectile[] = [];
      for (const pr of projectilesRef.current) {
        pr.t = Math.min(1, pr.t + pr.speed);
        // Parabolic arc
        const arc = Math.sin(pr.t * Math.PI) * -48;
        const cx = pr.x0 + (pr.x1 - pr.x0) * pr.t;
        const cy = pr.y0 + (pr.y1 - pr.y0) * pr.t + arc;

        // Spawn trail particle
        particlesRef.current.push({
          x: cx + (Math.random() * 8 - 4),
          y: cy + (Math.random() * 8 - 4),
          vx: (Math.random() - 0.5) * 1.6,
          vy: (Math.random() - 0.5) * 1.6,
          size: pr.radius * 0.65,
          color: pr.colorGlow,
          alpha: 0.85,
          life: 0,
          maxLife: 14,
          shape: 'CIRCLE',
        });

        ctx.save();
        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, pr.radius * 2.1);
        grad.addColorStop(0, pr.colorCore);
        grad.addColorStop(0.45, pr.colorGlow);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, pr.radius * 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (pr.t >= 1) {
          spawnBurst(pr.x1, pr.y1, 24, [pr.colorCore, pr.colorGlow, '#ffffff'], 7.5, 9, 'SHARD', 0.08);
          spawnRing(pr.x1, pr.y1, pr.colorGlow, 95);
        } else {
          nextProj.push(pr);
        }
      }
      projectilesRef.current = nextProj;

      // 2. Update & Draw Particles
      const nextParts: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life += 1;
        if (p.life >= p.maxLife) continue;
        p.x += p.vx;
        p.y += p.vy;
        if (p.gravity) p.vy += p.gravity;
        const prog = p.life / p.maxLife;
        p.alpha = 1 - prog;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        if (p.shape === 'RING') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1.5, (1 - prog) * 6);
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(4, p.size * prog), 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.shape === 'SHARD') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.life * 0.22);
          ctx.fillStyle = p.color;
          const s = p.size * (1 - prog * 0.4);
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.65, 0);
          ctx.lineTo(0, s);
          ctx.lineTo(-s * 0.65, 0);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'STAR') {
          ctx.translate(p.x, p.y);
          ctx.fillStyle = p.color;
          const s = p.size * (1 - prog * 0.35);
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.3, -s * 0.3);
          ctx.lineTo(s, 0);
          ctx.lineTo(s * 0.3, s * 0.3);
          ctx.lineTo(0, s);
          ctx.lineTo(-s * 0.3, s * 0.3);
          ctx.lineTo(-s, 0);
          ctx.lineTo(-s * 0.3, -s * 0.3);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, p.size * (1 - prog * 0.5)), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        nextParts.push(p);
      }
      particlesRef.current = nextParts;

      // 3. Update & Draw Hearthstone Damage Splat / Heal / Buff Badges
      const nextBadges: FloatingBadge[] = [];
      for (const b of badgesRef.current) {
        b.life += 1;
        if (b.life >= b.maxLife) continue;
        b.y += b.vy;
        b.vy *= 0.96;
        const prog = b.life / b.maxLife;
        const scale = b.life < 8 ? 0.6 + (b.life / 8) * 0.65 : 1.25 - prog * 0.2;
        const alpha = prog > 0.72 ? (1 - prog) / 0.28 : 1;

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.translate(b.x, b.y);
        ctx.scale(scale, scale);

        if (b.subKind === 'DAMAGE') {
          // Authentic Hearthstone jagged red blood splat!
          ctx.fillStyle = '#b91c1c';
          ctx.strokeStyle = '#450a0a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          const spikes = 10;
          for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? 28 : 17;
            const a = (i * Math.PI) / spikes;
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.font = 'bold 24px BelweBold, "Black Han Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 5;
          ctx.strokeStyle = '#09090b';
          ctx.strokeText(b.text, 0, 1);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(b.text, 0, 1);
        } else if (b.subKind === 'HEAL') {
          ctx.font = 'bold 25px BelweBold, "Black Han Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 5;
          ctx.strokeStyle = '#052e16';
          ctx.strokeText(b.text, 0, 0);
          ctx.fillStyle = '#4ade80';
          ctx.fillText(b.text, 0, 0);
        } else if (b.subKind === 'ARMOR') {
          ctx.font = 'bold 20px BelweBold, "Noto Sans KR", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#0f172a';
          ctx.strokeText(b.text, 0, 0);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(b.text, 0, 0);
        } else {
          ctx.font = 'bold 22px BelweBold, "Noto Sans KR", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 5;
          ctx.strokeStyle = '#1c1917';
          ctx.strokeText(b.text, 0, 0);
          ctx.fillStyle = '#fde047';
          ctx.fillText(b.text, 0, 0);
        }

        ctx.restore();
        nextBadges.push(b);
      }
      badgesRef.current = nextBadges;

      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', syncSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[70] h-full w-full"
    />
  );
};
