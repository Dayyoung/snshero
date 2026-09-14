/**
 * MarketSparkline.tsx
 * ID 408: 마켓플레이스 시세 변동 추이 7일 미니 스파크라인 차트 HUD
 */

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketSparklineProps {
  cardId: number;
  currentPrice: number;
  width?: number;
  height?: number;
  className?: string;
}

export const MarketSparkline: React.FC<MarketSparklineProps> = ({
  cardId,
  currentPrice,
  width = 64,
  height = 24,
  className = '',
}) => {
  // 카드 ID 기반 고유한 7일 가격 추이 생성
  const { points, pctChange, isUp } = useMemo(() => {
    const seed = (cardId * 9301 + 49297) % 233280;
    const history: number[] = [];
    let p = currentPrice * (0.85 + (seed % 30) / 100);

    for (let i = 0; i < 6; i++) {
      history.push(Math.round(p));
      const deltaFactor = 0.94 + (((seed * (i + 1)) % 13) / 100);
      p = p * deltaFactor;
    }
    history.push(currentPrice);

    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;

    const coords = history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * (width - 4) + 2;
      const y = height - 2 - ((val - min) / range) * (height - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const first = history[0];
    const last = history[history.length - 1];
    const pct = (((last - first) / first) * 100).toFixed(1);
    const up = last >= first;

    return { points: coords, pctChange: pct, isUp: up };
  }, [cardId, currentPrice, width, height]);

  return (
    <div className={`inline-flex items-center gap-1 font-mono text-[9px] ${className}`} title={`7일 시세 변동: ${pctChange}%`}>
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={isUp ? '#10b981' : '#f43f5e'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
      <span className={`font-bold flex items-center ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isUp ? '+' : ''}{pctChange}%
      </span>
    </div>
  );
};
