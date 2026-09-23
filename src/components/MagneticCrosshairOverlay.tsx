/**
 * MagneticCrosshairOverlay.tsx - SCR-06-17
 * 캔들 피크에 십자선이 자석처럼 붙는 마그네틱 스냅 크로스헤어 오버레이
 */

import React, { useState } from 'react';
import { Crosshair } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface CandlePoint {
  x: number;
  y: number;
  price: number;
  time: string;
}

interface MagneticCrosshairOverlayProps {
  candles: CandlePoint[];
  width: number;
  height: number;
  onSelectPrice?: (price: number) => void;
}

export const MagneticCrosshairOverlay: React.FC<MagneticCrosshairOverlayProps> = ({
  candles,
  width,
  height,
  onSelectPrice,
}) => {
  const [activePoint, setActivePoint] = useState<CandlePoint | null>(null);

  const handleTouch = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    // Find closest candle within snap radius
    let closest: CandlePoint | null = null;
    let minD = 40; // 40px snap threshold

    candles.forEach((c) => {
      const d = Math.hypot(c.x - relX, c.y - relY);
      if (d < minD) {
        minD = d;
        closest = c;
      }
    });

    if (closest && closest !== activePoint) {
      triggerHaptic('selection');
      setActivePoint(closest);
      onSelectPrice?.(closest.price);
    }
  };

  return (
    <div
      className="absolute inset-0 z-20 touch-none cursor-crosshair font-mono"
      onTouchMove={handleTouch}
      onMouseMove={handleTouch}
      onTouchEnd={() => setActivePoint(null)}
      onMouseLeave={() => setActivePoint(null)}
    >
      {activePoint && (
        <>
          {/* Vertical line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-amber-400/80 pointer-events-none"
            style={{ left: activePoint.x }}
          />
          {/* Horizontal line */}
          <div
            className="absolute left-0 right-0 h-px bg-amber-400/80 pointer-events-none"
            style={{ top: activePoint.y }}
          />
          {/* Magnetic Pin Dot */}
          <div
            className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-amber-400 border-2 border-slate-950 pointer-events-none shadow-lg animate-pulse"
            style={{ left: activePoint.x, top: activePoint.y }}
          />
          {/* Price Tooltip */}
          <div
            className="absolute px-2 py-1 bg-slate-950/90 border border-amber-400 text-amber-400 text-[10px] font-bold rounded shadow-md pointer-events-none"
            style={{
              left: Math.min(width - 70, Math.max(10, activePoint.x - 30)),
              top: Math.max(10, activePoint.y - 25),
            }}
          >
            {activePoint.price} SNS
          </div>
        </>
      )}
    </div>
  );
};
