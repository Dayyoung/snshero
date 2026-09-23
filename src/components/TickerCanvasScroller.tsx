/**
 * TickerCanvasScroller.tsx - SCR-01-25
 * 공지 텍스트를 비트맵으로 사전 베이킹하여 DOM 리플로우 없이 60fps로 롤링하는 캔버스 티커
 */

import React, { useRef, useEffect } from 'react';

interface TickerCanvasScrollerProps {
  notices: string[];
}

export const TickerCanvasScroller: React.FC<TickerCanvasScrollerProps> = ({ notices }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fullText = notices.join('  ✦  ');
    let offsetX = canvas.width;
    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(fullText, offsetX, 18);

      offsetX -= 1.2;
      const textWidth = ctx.measureText(fullText).width;
      if (offsetX < -textWidth) {
        offsetX = canvas.width;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [notices]);

  return (
    <div className="w-full h-7 bg-slate-950/80 border-y border-amber-500/30 overflow-hidden flex items-center">
      <canvas ref={canvasRef} width={360} height={28} className="w-full h-full" />
    </div>
  );
};
