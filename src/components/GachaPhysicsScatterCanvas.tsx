/**
 * GachaPhysicsScatterCanvas.tsx - SCR-04-16
 * 10연속 카드 소환 시 폭발적으로 비산하는 카드들을 60fps로 렌더링하는 물리 캔버스
 */

import React, { useRef, useEffect } from 'react';
import { PhysicsCardPoint } from '../workers/CardPhysicsVerletWorker';

interface GachaPhysicsScatterCanvasProps {
  cards: PhysicsCardPoint[];
  width?: number;
  height?: number;
}

export const GachaPhysicsScatterCanvas: React.FC<GachaPhysicsScatterCanvasProps> = ({
  cards,
  width = 400,
  height = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    cards.forEach((c) => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);

      // Card shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(-22, -32, 44, 64);

      // Card Body
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-20, -30, 40, 60, 4);
      ctx.fill();
      ctx.stroke();

      // Holographic star
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }, [cards]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pointer-events-none absolute inset-0 w-full h-full z-20"
    />
  );
};
