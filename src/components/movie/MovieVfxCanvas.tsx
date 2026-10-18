/**
 * MovieVfxCanvas.tsx
 * Lightweight HTML5 2D Canvas particle VFX overlay for Cinematic Movie Player.
 * Supports: snow (blizzard), embers (fire sparks), runes (arcane glyphs),
 * slash (combat blade cuts), and fog (rolling mist).
 */

import React, { useEffect, useRef } from 'react';

export type MovieVfxType = 'snow' | 'embers' | 'runes' | 'slash' | 'fog' | 'none';

interface MovieVfxCanvasProps {
  vfxType: MovieVfxType;
  intensity?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  color: string;
  char?: string;
  rotation?: number;
  vRot?: number;
  life?: number;
  maxLife?: number;
}

interface SlashEffect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  color: string;
  width: number;
}

const RUNIC_CHARS = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛋ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛟ', '✦', '✧', '◈', '◇'];

export const MovieVfxCanvas: React.FC<MovieVfxCanvasProps> = ({
  vfxType,
  intensity = 1.0,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || vfxType === 'none') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle pool
    const particles: Particle[] = [];
    const slashes: SlashEffect[] = [];

    // Initialize particles based on vfxType
    const count = Math.floor(
      (vfxType === 'snow'
        ? 80
        : vfxType === 'embers'
        ? 50
        : vfxType === 'runes'
        ? 22
        : vfxType === 'fog'
        ? 15
        : 10) * intensity
    );

    for (let i = 0; i < count; i++) {
      if (vfxType === 'snow') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.2) * 1.5,
          vy: Math.random() * 2.2 + 0.8,
          size: Math.random() * 2.8 + 1.2,
          alpha: Math.random() * 0.7 + 0.3,
          maxAlpha: 0.8,
          color: 'rgba(255, 255, 255,',
        });
      } else if (vfxType === 'embers') {
        const colors = ['#f59e0b', '#ef4444', '#fbbf24', '#f97316'];
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -(Math.random() * 1.8 + 0.8),
          size: Math.random() * 2.5 + 1.5,
          alpha: Math.random() * 0.8 + 0.2,
          maxAlpha: 0.9,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      } else if (vfxType === 'runes') {
        const colors = ['#38bdf8', '#818cf8', '#fbbf24', '#34d399'];
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -(Math.random() * 0.5 + 0.2),
          size: Math.random() * 14 + 12,
          alpha: Math.random() * 0.6 + 0.2,
          maxAlpha: 0.75,
          color: colors[Math.floor(Math.random() * colors.length)],
          char: RUNIC_CHARS[Math.floor(Math.random() * RUNIC_CHARS.length)],
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.02,
        });
      } else if (vfxType === 'fog') {
        particles.push({
          x: Math.random() * width,
          y: height - Math.random() * (height * 0.4),
          vx: Math.random() * 0.6 + 0.2,
          vy: (Math.random() - 0.5) * 0.1,
          size: Math.random() * 180 + 120,
          alpha: Math.random() * 0.12 + 0.04,
          maxAlpha: 0.18,
          color: 'rgba(220, 230, 242,',
        });
      }
    }

    let lastSlashTime = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // --- RENDER PARTICLES ---
      if (vfxType === 'snow') {
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y > height) {
            p.y = -5;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          ctx.fillStyle = `${p.color}${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (vfxType === 'embers') {
        for (const p of particles) {
          p.x += p.vx + (Math.random() - 0.5) * 0.4;
          p.y += p.vy;
          p.alpha -= 0.003;
          if (p.alpha <= 0 || p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
            p.alpha = Math.random() * 0.8 + 0.2;
          }

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else if (vfxType === 'runes') {
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.rotation !== undefined && p.vRot !== undefined) {
            p.rotation += p.vRot;
          }
          if (p.y < -30) {
            p.y = height + 20;
            p.x = Math.random() * width;
          }

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          if (p.rotation !== undefined) ctx.rotate(p.rotation);
          ctx.font = `600 ${p.size}px monospace`;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fillText(p.char || '✧', -p.size / 2, p.size / 2);
          ctx.restore();
        }
      } else if (vfxType === 'fog') {
        for (const p of particles) {
          p.x += p.vx;
          if (p.x - p.size > width) {
            p.x = -p.size;
          }

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, `${p.color}${p.alpha})`);
          grad.addColorStop(1, `${p.color}0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (vfxType === 'slash') {
        // Spawn periodic combat slash
        const now = Date.now();
        if (now - lastSlashTime > 1600 && slashes.length < 2) {
          lastSlashTime = now;
          const isLeft = Math.random() > 0.5;
          const startX = isLeft ? Math.random() * (width * 0.4) : width * 0.6 + Math.random() * (width * 0.4);
          const startY = Math.random() * (height * 0.4);
          const length = Math.random() * 280 + 220;
          const angle = isLeft ? Math.PI / 4 + (Math.random() - 0.5) * 0.3 : (Math.PI * 3) / 4 + (Math.random() - 0.5) * 0.3;

          slashes.push({
            x1: startX,
            y1: startY,
            x2: startX + Math.cos(angle) * length,
            y2: startY + Math.sin(angle) * length,
            alpha: 1.0,
            color: Math.random() > 0.4 ? '#38bdf8' : '#f59e0b',
            width: Math.random() * 3 + 2,
          });
        }

        // Render and update slashes
        for (let i = slashes.length - 1; i >= 0; i--) {
          const s = slashes[i];
          s.alpha -= 0.06;
          if (s.alpha <= 0) {
            slashes.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = s.alpha;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.width;
          ctx.shadowBlur = 12;
          ctx.shadowColor = s.color;

          ctx.beginPath();
          ctx.moveTo(s.x1, s.y1);
          ctx.lineTo(s.x2, s.y2);
          ctx.stroke();

          // Spark particle along the cut
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(s.x2, s.y2, s.width * 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [vfxType, intensity]);

  if (vfxType === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-10 h-full w-full ${className}`}
    />
  );
};
