/**
 * PriceChartWidget.tsx
 * 카드 거래소 실시간 호가 시세 스파크라인 차트 및 하단 썸존 원클릭 즉시 구매 위젯
 * (구글 스프레드시트 Row 832 / ID 553 요구사항 구현)
 */

import React from 'react';
import { TrendingUp, ShoppingBag, ShieldCheck } from 'lucide-react';
import { Language } from '../types';

interface PriceChartWidgetProps {
  cardName: string;
  currentPrice: number;
  recentPrices: number[];
  language: Language;
  onInstantBuy: () => void;
  canAfford: boolean;
}

export const PriceChartWidget: React.FC<PriceChartWidgetProps> = ({
  cardName,
  currentPrice,
  recentPrices = [120, 130, 125, 140, 150, 145, 160],
  language,
  onInstantBuy,
  canAfford,
}) => {
  const isKo = language === 'ko';

  // Generate SVG Sparkline Points
  const minP = Math.min(...recentPrices);
  const maxP = Math.max(...recentPrices);
  const range = maxP - minP || 1;

  const w = 180;
  const h = 36;
  const step = w / (recentPrices.length - 1 || 1);

  const points = recentPrices
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - minP) / range) * (h - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  const priceDiff = recentPrices[recentPrices.length - 1] - recentPrices[0];
  const isUp = priceDiff >= 0;

  return (
    <div className="w-full bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] p-3 font-mono select-none space-y-2">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#6e6e73] uppercase tracking-wider block">
            {isKo ? '실시간 호가 시세' : 'LIVE MARKET PRICE'}
          </span>
          <span className="font-black text-sm text-[#201d1d]">{cardName}</span>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end text-xs font-bold text-amber-600">
            <TrendingUp size={13} className={isUp ? 'text-rose-500' : 'text-cyan-600 rotate-180'} />
            <span>{currentPrice.toLocaleString()} SNS</span>
          </div>
          <span className={`text-[9px] font-semibold ${isUp ? 'text-rose-500' : 'text-cyan-600'}`}>
            {isUp ? `+${priceDiff}` : priceDiff} SNS (24H)
          </span>
        </div>
      </div>

      {/* Sparkline Trendline */}
      <div className="w-full h-9 bg-[#f4f2ee] flex items-center justify-center relative overflow-hidden px-1">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full stroke-cyan-700 fill-none" preserveAspectRatio="none">
          <polyline strokeWidth="1.8" points={points} />
        </svg>
      </div>

      {/* Bottom One-Touch Purchase Action Bar */}
      <div className="pt-1 flex items-center gap-2">
        <div className="flex-1 text-[10px] text-[#6e6e73] flex items-center gap-1">
          <ShieldCheck size={12} className="text-emerald-600" />
          <span>{isKo ? '에스크로 안전 즉시 정산' : 'Instant Escrow Protected'}</span>
        </div>
        <button
          onClick={onInstantBuy}
          disabled={!canAfford}
          className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border transition-colors flex items-center gap-1 cursor-pointer ${
            canAfford
              ? 'bg-[#201d1d] hover:bg-black text-[#fdfcfc] border-[#201d1d]'
              : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
          }`}
        >
          <ShoppingBag size={12} />
          <span>{isKo ? '원클릭 즉시 구매' : 'Instant Buy'}</span>
        </button>
      </div>
    </div>
  );
};
