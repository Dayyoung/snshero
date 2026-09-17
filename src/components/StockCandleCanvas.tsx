import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ChartGestureEngine, ChartGestureState } from '../lib/ChartGestureEngine';
import { triggerHaptic } from '../lib/haptic';
import { Language } from '../types';

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockCandleCanvasProps {
  symbol: string;
  cardTitle: string;
  currentPrice: number;
  change24h: number;
  language: Language;
  onClose?: () => void;
}

// 캔들 Mock 시계열 생성 (현재가 및 변동률 기반)
function generateMockCandles(basePrice: number, change24h: number, count = 40): CandleData[] {
  const candles: CandleData[] = [];
  let price = Math.max(1, Math.round(basePrice * (1 - change24h / 200)));
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const timeStr = new Date(now - (count - i) * 15 * 60 * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const volatility = price * 0.015;
    const delta = (Math.random() - 0.48) * volatility;
    const open = price;
    const close = Math.max(1, Math.round(open + delta));
    const high = Math.round(Math.max(open, close) + Math.random() * volatility * 0.8);
    const low = Math.round(Math.max(1, Math.min(open, close) - Math.random() * volatility * 0.8));
    const volume = Math.round(50 + Math.random() * 450);

    candles.push({ time: timeStr, open, high, low, close, volume });
    price = close;
  }

  // 마지막 캔들 종가를 현재가와 일치
  if (candles.length > 0) {
    candles[candles.length - 1].close = basePrice;
    candles[candles.length - 1].high = Math.max(candles[candles.length - 1].high, basePrice);
    candles[candles.length - 1].low = Math.min(candles[candles.length - 1].low, basePrice);
  }

  return candles;
}

export const StockCandleCanvas: React.FC<StockCandleCanvasProps> = ({
  symbol,
  cardTitle,
  currentPrice,
  change24h,
  language,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gestureState, setGestureState] = useState<ChartGestureState>({
    scale: 1,
    offsetX: 0,
    isDragging: false,
    crosshair: null,
  });
  const [timeframe, setTimeframe] = useState<'15m' | '1h' | '1d'>('15m');
  const engineRef = useRef<ChartGestureEngine | null>(null);

  const candles = useMemo(() => {
    const count = timeframe === '15m' ? 36 : timeframe === '1h' ? 48 : 30;
    return generateMockCandles(currentPrice, change24h, count);
  }, [currentPrice, change24h, timeframe]);

  // Canvas Setup & Engine Attach
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const engine = new ChartGestureEngine({
      onStateChange: (state) => setGestureState({ ...state }),
    });
    engineRef.current = engine;

    const updateBounds = () => {
      const rect = container.getBoundingClientRect();
      const contentWidth = candles.length * 16;
      engine.updateBounds(contentWidth, rect.width);
    };

    updateBounds();
    engine.attach(container, candles.length * 16, container.clientWidth);

    return () => {
      engine.detach();
    };
  }, [candles]);

  // 60fps Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(15,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let y = 30; y < height - 25; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Min / Max Price
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    candles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    });
    const priceRange = Math.max(1, maxPrice - minPrice);
    const chartHeight = height - 55; // reserve bottom for volume & time
    const volumeHeight = 25;

    const baseCandleWidth = 10 * gestureState.scale;
    const spacing = 6 * gestureState.scale;
    const totalStep = baseCandleWidth + spacing;

    const startX = gestureState.offsetX + 20;

    let hoveredCandle: CandleData | null = null;
    let hoveredX = 0;

    // Calculate MA5 and MA20
    const ma5Points: { x: number; y: number }[] = [];
    const ma20Points: { x: number; y: number }[] = [];

    // Render Candles & Volume
    candles.forEach((candle, idx) => {
      const cx = startX + idx * totalStep;
      if (cx < -totalStep || cx > width + totalStep) return;

      const isUp = candle.close >= candle.open;
      const color = isUp ? '#10b981' : '#f43f5e';

      // Price to Y
      const openY = 30 + (1 - (candle.open - minPrice) / priceRange) * (chartHeight - 30);
      const closeY = 30 + (1 - (candle.close - minPrice) / priceRange) * (chartHeight - 30);
      const highY = 30 + (1 - (candle.high - minPrice) / priceRange) * (chartHeight - 30);
      const lowY = 30 + (1 - (candle.low - minPrice) / priceRange) * (chartHeight - 30);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, 1.2 * gestureState.scale);
      ctx.beginPath();
      ctx.moveTo(cx + baseCandleWidth / 2, highY);
      ctx.lineTo(cx + baseCandleWidth / 2, lowY);
      ctx.stroke();

      // Body
      ctx.fillStyle = color;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(cx, bodyTop, baseCandleWidth, bodyHeight);

      // Volume bar
      const maxVol = 600;
      const volBarH = (candle.volume / maxVol) * volumeHeight;
      ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)';
      ctx.fillRect(cx, height - 20 - volBarH, baseCandleWidth, volBarH);

      // MA points
      if (idx >= 4) {
        const sum5 = candles.slice(idx - 4, idx + 1).reduce((acc, cur) => acc + cur.close, 0);
        const ma5Y = 30 + (1 - (sum5 / 5 - minPrice) / priceRange) * (chartHeight - 30);
        ma5Points.push({ x: cx + baseCandleWidth / 2, y: ma5Y });
      }
      if (idx >= 19) {
        const sum20 = candles.slice(idx - 19, idx + 1).reduce((acc, cur) => acc + cur.close, 0);
        const ma20Y = 30 + (1 - (sum20 / 20 - minPrice) / priceRange) * (chartHeight - 30);
        ma20Points.push({ x: cx + baseCandleWidth / 2, y: ma20Y });
      }

      // Check crosshair hover
      if (
        gestureState.crosshair &&
        Math.abs(gestureState.crosshair.x - (cx + baseCandleWidth / 2)) < totalStep / 2
      ) {
        hoveredCandle = candle;
        hoveredX = cx + baseCandleWidth / 2;
      }
    });

    // Draw MA5 Line (Orange)
    if (ma5Points.length > 1) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ma5Points[0].x, ma5Points[0].y);
      for (let i = 1; i < ma5Points.length; i++) {
        ctx.lineTo(ma5Points[i].x, ma5Points[i].y);
      }
      ctx.stroke();
    }

    // Draw MA20 Line (Indigo)
    if (ma20Points.length > 1) {
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ma20Points[0].x, ma20Points[0].y);
      for (let i = 1; i < ma20Points.length; i++) {
        ctx.lineTo(ma20Points[i].x, ma20Points[i].y);
      }
      ctx.stroke();
    }

    // Crosshair rendering
    if (gestureState.crosshair && hoveredCandle) {
      const cy = gestureState.crosshair.y;

      // Vertical line
      ctx.strokeStyle = '#201d1d';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hoveredX, 0);
      ctx.lineTo(hoveredX, height - 20);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tooltip box
      const candle: CandleData = hoveredCandle;
      const tooltipW = 140;
      const tooltipH = 50;
      const tooltipX = hoveredX > width / 2 ? hoveredX - tooltipW - 10 : hoveredX + 10;
      const tooltipY = Math.min(height - tooltipH - 25, Math.max(10, cy - 25));

      ctx.fillStyle = 'rgba(32, 29, 29, 0.95)';
      ctx.fillRect(tooltipX, tooltipY, tooltipW, tooltipH);

      ctx.fillStyle = '#fdfcfc';
      ctx.font = '10px monospace';
      ctx.fillText(`${candle.time}`, tooltipX + 6, tooltipY + 12);
      ctx.fillText(
        `O: ${candle.open} H: ${candle.high}`,
        tooltipX + 6,
        tooltipY + 24
      );
      ctx.fillText(
        `L: ${candle.low} C: ${candle.close}`,
        tooltipX + 6,
        tooltipY + 36
      );
      ctx.fillStyle = candle.close >= candle.open ? '#10b981' : '#f43f5e';
      ctx.fillText(`Vol: ${candle.volume}`, tooltipX + 6, tooltipY + 46);
    }

    ctx.restore();
  }, [candles, gestureState]);

  return (
    <div className="w-full bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] p-3 rounded-none font-mono text-xs select-none">
      {/* Chart Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[rgba(15,0,0,0.08)]">
        <div className="flex items-center gap-2">
          <span className="font-black text-sm text-[#201d1d]">{symbol}</span>
          <span className="text-[11px] text-[#646262]">[{cardTitle}]</span>
          <span className="font-bold text-xs text-indigo-700">
            {currentPrice.toLocaleString()} SNS
          </span>
          <span
            className={`text-[10px] font-bold ${
              change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {change24h >= 0 ? `+${change24h.toFixed(2)}%` : `${change24h.toFixed(2)}%`}
          </span>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1">
          {(['15m', '1h', '1d'] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setTimeframe(tf);
              }}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-none border transition-colors cursor-pointer ${
                timeframe === tf
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-white text-[#646262] border-[rgba(15,0,0,0.12)] hover:bg-[#f8f7f7]'
              }`}
            >
              {tf}
            </button>
          ))}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-1.5 py-0.5 text-[#646262] hover:text-[#201d1d] font-bold text-xs cursor-pointer ml-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Interactive Chart Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative w-full h-56 mt-2 touch-none overflow-hidden cursor-crosshair bg-white border border-[rgba(15,0,0,0.06)]"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Legend */}
        <div className="absolute top-2 left-2 flex items-center gap-3 text-[9px] pointer-events-none bg-white/85 px-1.5 py-0.5 border border-[rgba(15,0,0,0.08)]">
          <span className="flex items-center gap-1 text-[#f59e0b] font-bold">
            <span className="w-2 h-0.5 bg-[#f59e0b] inline-block" /> MA5
          </span>
          <span className="flex items-center gap-1 text-[#6366f1] font-bold">
            <span className="w-2 h-0.5 bg-[#6366f1] inline-block" /> MA20
          </span>
          <span className="text-[#646262]">
            {language === 'ko' ? '롱프레스: 십자선 | 핀치: 줌' : 'Long-press: Crosshair | Pinch: Zoom'}
          </span>
        </div>
      </div>
    </div>
  );
};
