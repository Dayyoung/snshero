/**
 * QuestToastCanvasHUD.tsx - SCR-11-22
 * 상단 경량 2D Canvas 오버레이 HUD로 단일 드로우 콜 내에 슬라이딩하는 60fps 퀘스트 알림 엔진
 */

import React, { useRef, useEffect } from 'react';

interface QuestToastCanvasHUDProps {
  toast: { title: string; reward: string } | null;
}

export const QuestToastCanvasHUD: React.FC<QuestToastCanvasHUDProps> = ({ toast }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!toast) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let progress = 0; // 0 to 1
    let animId: number;

    const render = () => {
      progress += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const slideY = Math.sin(Math.min(1, progress) * Math.PI * 0.5) * 44 - 44;

      ctx.save();
      ctx.translate(canvas.width / 2, slideY + 50);

      // Toast Box
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-140, -20, 280, 40, 12);
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(toast.title, -120, -2);

      ctx.font = '10px monospace';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`보상: ${toast.reward}`, -120, 12);

      ctx.restore();

      if (progress < 2.5) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [toast]);

  if (!toast) return null;

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={100}
      className="fixed top-0 inset-x-0 mx-auto pointer-events-none z-50 w-full max-w-sm h-24"
    />
  );
};
