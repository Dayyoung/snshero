/**
 * VolumeProfileCanvas.tsx - SCR-05-19
 * 가격대별 누적 거래량 매물대(Volume Profile)를 60fps로 시각화하는 캔버스 컴포넌트
 */

import React, { useRef, useEffect } from 'react';

interface VolumeProfileCanvasProps {
  buckets: Record<number, number>;
  width?: number;
  height?: number;
}

export const VolumeProfileCanvas: React.FC<VolumeProfileCanvasProps> = ({
  buckets,
  width = 120,
  height = 160,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const keys = Object.keys(buckets).map(Number).sort((a, b) => b - a);
    if (keys.length === 0) return;

    const values = Object.values(buckets) as number[];
    const maxVol = Math.max(...values, 1);
    const barHeight = Math.max(4, height / keys.length);

    keys.forEach((price, idx) => {
      const vol = buckets[price] || 0;
      const barWidth = (vol / maxVol) * (width - 20);
      const y = idx * barHeight;

      // Draw horizontal volume bar
      ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.fillRect(0, y, barWidth, barHeight - 1);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '8px monospace';
      ctx.fillText(`${price}`, barWidth + 2, y + barHeight - 2);
    });
  }, [buckets, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner"
    />
  );
};
