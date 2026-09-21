/**
 * MultiStockAtlasCanvas.tsx - SCR-06-16
 * 전 종목 미니차트를 단일 드로우 콜로 고속 렌더링하는 WebGL/Canvas 하이브리드 아틀라스
 */

import React, { useRef, useEffect } from 'react';
import { StockTextureBaker, StockMiniChartData } from '../lib/StockTextureBaker';

interface MultiStockAtlasCanvasProps {
  stocks: StockMiniChartData[];
  width?: number;
  height?: number;
}

export const MultiStockAtlasCanvas: React.FC<MultiStockAtlasCanvasProps> = ({
  stocks,
  width = 360,
  height = 120,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bakerRef = useRef<StockTextureBaker | null>(null);

  if (!bakerRef.current) {
    bakerRef.current = new StockTextureBaker(512, 512);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bakerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const atlas = bakerRef.current.bakeAtlas(stocks);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(atlas, 0, 0, width, height);
  }, [stocks, width, height]);

  return (
    <div className="w-full flex flex-col gap-1 font-mono select-none">
      <div className="flex justify-between text-[10px] text-slate-400 px-1">
        <span>전 종목 단일 드로우콜 아틀라스 뷰</span>
        <span className="text-emerald-400 font-bold">1 DRAW CALL</span>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-[120px] rounded-xl border border-slate-800 bg-slate-950"
      />
    </div>
  );
};
