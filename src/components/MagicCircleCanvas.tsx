/**
 * MagicCircleCanvas.tsx - SCR-08-16
 * 융합 룬 문자 및 스파크 파티클을 60fps 무감속으로 렌더링하는 WebGL/Canvas 마법진
 */

import React, { useRef, useEffect } from 'react';
import { SimdParticle } from '../workers/ParticleSimdWorker';

interface MagicCircleCanvasProps {
  isFusing: boolean;
  width?: number;
  height?: number;
}

export const MagicCircleCanvas: React.FC<MagicCircleCanvasProps> = ({
  isFusing,
  width = 280,
  height = 280,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let rotation = 0;
    const particles: SimdParticle[] = [];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Draw Rotating Magic Circle
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      // Outer Ring
      ctx.strokeStyle = isFusing ? 'rgba(245, 158, 11, 0.9)' : 'rgba(139, 92, 246, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, width * 0.42, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Star/Polygon
      ctx.beginPath();
      const points = 6;
      const radius = width * 0.35;
      for (let i = 0; i < points; i++) {
        const a = (Math.PI * 2 * i) / points;
        const px = Math.cos(a) * radius;
        const py = Math.sin(a) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.restore();

      // Emit fusing sparks
      if (isFusing) {
        rotation += 0.05;
        if (particles.length < 50) {
          const a = Math.random() * Math.PI * 2;
          const spd = 2 + Math.random() * 4;
          particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(a) * spd,
            vy: Math.sin(a) * spd,
            life: 1.0,
            color: '#fbbf24',
          });
        }
      } else {
        rotation += 0.01;
      }

      // Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isFusing, width, height]);

  return (
    <div className="relative flex items-center justify-center pointer-events-none select-none">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-full shadow-2xl"
      />
    </div>
  );
};
