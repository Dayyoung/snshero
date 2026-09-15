/**
 * MarketSparkline.tsx
 * ID 408 & ID 428: 마켓플레이스 7일 및 30일 시세 변동 스파크라인 차트 & 거래량 바 HUD
 */

import React, { useMemo } from 'react';

interface MarketSparklineProps {
  cardId: number;
  currentPrice: number;
  days?: 7 | 30;
  width?: number;
  height?: number;
  showVolume?: boolean;
  className?: string;
}

export const MarketSparkline: React.FC<MarketSparklineProps> = ({
  cardId,
  currentPrice,
  days = 7,
  width = 72,
  height = 24,
  showVolume = false,
  className = '',
}) => {
  // 카드 ID 기반 고유한 시세 추이 생성
  const { points, pctChange, isUp, volumes } = useMemo(() => {
    const seed = (cardId * 9301 + 49297) % 233280;
    const history: number[] = [];
    const vols: number[] = [];
    let p = currentPrice * (0.85 + (seed % 30) / 100);

    const steps = days === 30 ? 15 : 6;
    for (let i = 0; i < steps; i++) {
      history.push(Math.round(p));
      vols.push(10 + (((seed * (i + 3)) % 40)));
      const deltaFactor = 0.95 + (((seed * (i + 1)) % 11) / 100);
      p = p * deltaFactor;
    }
    history.push(currentPrice);
    vols.push(30);

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

    return { points: coords, pctChange: pct, isUp: up, volumes: vols };
  }, [cardId, currentPrice, days, width, height]);

  return (
    <div className={`inline-flex items-center gap-1 font-mono text-[9px] ${className}`} title={`${days}일 시세 변동: ${pctChange}%`}>
      <svg width={width} height={height} className="overflow-visible">
        {showVolume && volumes.map((v, i) => {
          const barW = Math.max(2, (width / volumes.length) - 1.5);
          const barX = (i / (volumes.length - 1)) * (width - barW);
          const barH = (v / 50) * (height / 3);
          return (
            <rect
              key={i}
              x={barX}
              y={height - barH}
              width={barW}
              height={barH}
              fill="rgba(148, 163, 184, 0.3)"
            />
          );
        })}
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
