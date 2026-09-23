/**
 * HallOfFame3DShowcase.tsx - SCR-10-22
 * 역대 우승자 3D 트로피 룸 60fps 쇼케이스 캔버스
 */

import React, { useRef, useEffect } from 'react';

interface HallOfFame3DShowcaseProps {
  trophyTitle: string;
  seasonName: string;
  winnerNickname: string;
}

export const HallOfFame3DShowcase: React.FC<HallOfFame3DShowcaseProps> = ({
  trophyTitle,
  seasonName,
  winnerNickname,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    let animId: number;

    const render = () => {
      angle += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw metallic trophy cup with rotating reflection
      ctx.save();
      ctx.translate(cx, cy);

      const grad = ctx.createLinearGradient(
        Math.cos(angle) * 50,
        Math.sin(angle) * 50,
        -Math.cos(angle) * 50,
        -Math.sin(angle) * 50
      );
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#f59e0b');
      grad.addColorStop(1, '#b45309');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-40, -50);
      ctx.bezierCurveTo(-40, 20, -15, 30, -10, 45);
      ctx.lineTo(10, 45);
      ctx.bezierCurveTo(15, 30, 40, 20, 40, -50);
      ctx.closePath();
      ctx.fill();

      // Base
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-30, 45, 60, 20);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="w-full bg-slate-950 border border-amber-500/40 rounded-2xl p-4 flex flex-col items-center font-mono select-none text-center">
      <canvas ref={canvasRef} width={240} height={160} className="w-60 h-40" />
      <div className="mt-2">
        <span className="text-[10px] text-amber-400 font-bold block">{seasonName}</span>
        <h4 className="text-sm font-black text-white">{trophyTitle}</h4>
        <span className="text-xs text-slate-400">우승자: 👑 {winnerNickname}</span>
      </div>
    </div>
  );
};
