/**
 * OrderBookHybridCanvas.tsx - SCR-05-16
 * 초당 수백 건의 호가 변동 및 체결 틱을 60fps로 매끄럽게 렌더링하는 고성능 2D Canvas 호가창
 */

import React, { useRef, useEffect } from 'react';
import { OrderTick } from '../lib/SharedArrayBufferQueue';

interface OrderBookHybridCanvasProps {
  ticks: OrderTick[];
  width?: number;
  height?: number;
}

export const OrderBookHybridCanvas: React.FC<OrderBookHybridCanvasProps> = ({
  ticks,
  width = 360,
  height = 160,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 20; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Render Order Lines
    ctx.font = '10px monospace';
    ticks.slice(-8).forEach((tick, idx) => {
      const y = 20 + idx * 16;
      const isBuy = tick.type === 'buy';

      // Bar width representation
      const barW = Math.min(width * 0.4, tick.amount * 5);
      ctx.fillStyle = isBuy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';
      ctx.fillRect(isBuy ? 0 : width - barW, y - 10, barW, 14);

      // Price & Amount text
      ctx.fillStyle = isBuy ? '#34d399' : '#fb7185';
      ctx.textAlign = 'left';
      ctx.fillText(`${tick.price} SNS`, 10, y);

      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'right';
      ctx.fillText(`x${tick.amount}`, width - 10, y);
    });
  }, [ticks, width, height]);

  return (
    <div className="w-full flex flex-col gap-1 font-mono select-none">
      <div className="flex justify-between text-[10px] text-slate-400 px-1">
        <span>실시간 호가 체결 엔진 (60fps)</span>
        <span className="text-emerald-400 font-bold">LIVE</span>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-[160px] rounded-xl border border-slate-800 bg-slate-950 shadow-inner"
      />
    </div>
  );
};
