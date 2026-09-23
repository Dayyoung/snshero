/**
 * TimerCanvasOverlay.tsx - SCR-11-13
 * 퀘스트 카운트다운 타이머를 DOM 대신 2D Canvas 오버레이에 직접 그려 DOM 리렌더링을 제로화하는 60fps 타이머 캔버스
 */

import React, { useRef, useEffect } from 'react';

interface TimerCanvasOverlayProps {
  timers: Array<{ id: string; x: number; y: number; remainingSeconds: number }>;
}

export const TimerCanvasOverlay: React.FC<TimerCanvasOverlayProps> = ({ timers }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    timers.forEach((t) => {
      const hours = Math.floor(t.remainingSeconds / 3600);
      const mins = Math.floor((t.remainingSeconds % 3600) / 60);
      const secs = t.remainingSeconds % 60;
      const text = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      // Draw background pill
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(t.x - 70, t.y - 10, 75, 20, 4);
      ctx.fill();

      // Draw text
      ctx.fillStyle = '#fbbf24'; // Amber-400
      ctx.fillText(text, t.x, t.y);
    });
  }, [timers]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={300}
      className="pointer-events-none absolute inset-0 w-full h-full z-20"
    />
  );
};
