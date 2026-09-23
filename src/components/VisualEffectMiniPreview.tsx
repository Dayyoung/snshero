/**
 * VisualEffectMiniPreview.tsx - SCR-12-23
 * 비주얼 옵션 조절 시 실시간 프레임 및 이펙트 변화를 보여주는 미니 프리뷰 캔버스
 */

import React, { useRef, useEffect } from 'react';
import { VisualSettings } from './VisualMatrixSliderPanel';

export const VisualEffectMiniPreview: React.FC<{ settings: VisualSettings }> = ({ settings }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;
    let animId: number;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw card
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = settings.textures;
      ctx.strokeRect(cx - 30, cy - 45, 60, 90);
      ctx.fillRect(cx - 30, cy - 45, 60, 90);

      // Bloom
      if (settings.bloom > 1) {
        ctx.save();
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = settings.bloom * 4;
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(cx - 10, cy - 10, 20, 20);
        ctx.restore();
      }

      // Particles
      const particleCount = settings.particles * 4;
      ctx.fillStyle = '#38bdf8';
      for (let i = 0; i < particleCount; i++) {
        const px = cx + Math.sin(tick * 0.05 + i) * 40;
        const py = cy + Math.cos(tick * 0.05 + i) * 40;
        ctx.fillRect(px, py, 2, 2);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [settings]);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-2 flex flex-col items-center select-none font-mono">
      <span className="text-[10px] text-slate-400 mb-1">실시간 비주얼 프리뷰 (예상 60 FPS)</span>
      <canvas ref={canvasRef} width={200} height={120} className="w-48 h-28 rounded-lg bg-slate-950" />
    </div>
  );
};
