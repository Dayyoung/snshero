/**
 * RankingCanvasTransition.tsx - SCR-10-19
 * 순위 변동 트랜지션을 2D Canvas 오버레이 레이어로 60fps 무감속 렌더링하는 컴포넌트
 */

import React, { useRef, useEffect } from 'react';

interface RankDeltaParticle {
  x: number;
  y: number;
  vy: number;
  alpha: number;
  text: string;
}

export const RankingCanvasTransition: React.FC<{
  deltas: { rank: number; deltaElo: number }[];
}> = ({ deltas }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: RankDeltaParticle[] = deltas.map((d, idx) => ({
      x: 180,
      y: 40 + idx * 48,
      vy: -1.5,
      alpha: 1.0,
      text: d.deltaElo >= 0 ? `+${d.deltaElo} ELO` : `${d.deltaElo} ELO`,
    }));

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.vy;
        p.alpha -= 0.02;

        if (p.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = p.text.startsWith('+') ? '#10b981' : '#f43f5e';
          ctx.fillText(p.text, p.x, p.y);
          ctx.restore();
        }
      });

      particles = particles.filter((p) => p.alpha > 0);
      if (particles.length > 0) {
        animationId = requestAnimationFrame(render);
      }
    };

    if (particles.length > 0) {
      animationId = requestAnimationFrame(render);
    }

    return () => cancelAnimationFrame(animationId);
  }, [deltas]);

  return (
    <canvas
      ref={canvasRef}
      width={260}
      height={300}
      className="pointer-events-none absolute inset-0 z-30 w-full h-full"
    />
  );
};
