import React, { useMemo } from 'react';
import { PieChart, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { Language } from '../types';

export interface PortfolioHoldingItem {
  cardId: number;
  symbol: string;
  cardTitle: string;
  quantity: number;
  currentPrice: number;
  totalValue: number;
  change24h: number;
  weightPct: number;
  color: string;
}

interface PortfolioDonutCardProps {
  holdings: PortfolioHoldingItem[];
  totalValue: number;
  totalProfitSns: number;
  totalProfitRate: number;
  language: Language;
  onSelectStock?: (cardId: number) => void;
  onOpenTpSl?: (cardId: number) => void;
}

const PALETTE = [
  '#f59e0b', '#6366f1', '#10b981', '#ec4899', '#8b5cf6',
  '#06b6d4', '#f97316', '#14b8a6', '#64748b', '#e11d48'
];

export const PortfolioDonutCard: React.FC<PortfolioDonutCardProps> = ({
  holdings,
  totalValue,
  totalProfitSns,
  totalProfitRate,
  language,
  onSelectStock,
  onOpenTpSl,
}) => {
  // Color assignment & SVG arc calculations
  const itemsWithColor = useMemo(() => {
    return holdings.map((h, i) => ({
      ...h,
      color: PALETTE[i % PALETTE.length],
    }));
  }, [holdings]);

  // SVG Donut Slices
  const donutSegments = useMemo(() => {
    let accumulated = 0;
    return itemsWithColor.map((item) => {
      const startAngle = accumulated * 360;
      const sliceAngle = (item.weightPct / 100) * 360;
      accumulated += item.weightPct / 100;
      return {
        ...item,
        startAngle,
        sliceAngle,
      };
    });
  }, [itemsWithColor]);

  // SVG Circle stroke dash math (circumference = 2 * PI * 40 = 251.32)
  const circumference = 2 * Math.PI * 40;

  return (
    <div className="w-full bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] p-4 rounded-none font-mono text-xs shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.08)] pb-2.5">
        <div className="flex items-center gap-2">
          <PieChart size={16} className="text-[#201d1d]" />
          <h3 className="font-black text-sm text-[#201d1d]">
            {language === 'ko' ? '자산 배분 포트폴리오' : 'Asset Allocation'}
          </h3>
        </div>
        <span className="px-2 py-0.5 bg-[#f8f7f7] text-[#646262] text-[10px] font-bold border border-[rgba(15,0,0,0.08)]">
          {language === 'ko' ? `${holdings.length}개 종목 분산` : `${holdings.length} Assets`}
        </span>
      </div>

      {/* Overview stats & Donut chart */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Left: Donut Chart SVG */}
        <div className="flex items-center justify-center relative w-full h-44">
          {holdings.length === 0 ? (
            <div className="text-[#8c8989] text-center text-xs">
              {language === 'ko' ? '보유 중인 주식이 없습니다' : 'No stocks in portfolio'}
            </div>
          ) : (
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgba(15,0,0,0.06)"
                  strokeWidth="14"
                />
                {/* Donut Segments */}
                {donutSegments.map((seg) => {
                  const dashLength = (seg.sliceAngle / 360) * circumference;
                  const dashOffset = -((seg.startAngle / 360) * circumference);
                  return (
                    <circle
                      key={seg.cardId}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="14"
                      strokeDasharray={`${dashLength} ${circumference}`}
                      strokeDashoffset={dashOffset}
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-[#646262] font-bold uppercase">
                  {language === 'ko' ? '총 평가' : 'Total'}
                </span>
                <span className="text-xs font-black text-[#201d1d]">
                  {totalValue > 10000 ? `${(totalValue / 1000).toFixed(1)}k` : totalValue}
                </span>
                <span className="text-[9px] text-[#8c8989]">SNS</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Summary Metrics */}
        <div className="space-y-2.5">
          <div className="p-2.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] space-y-1">
            <span className="text-[10px] text-[#646262] font-bold">
              {language === 'ko' ? '총 평가 자산 (포트폴리오)' : 'Total Asset Value'}
            </span>
            <div className="text-base font-black text-[#201d1d]">
              {totalValue.toLocaleString()} SNS
            </div>
          </div>

          <div className="p-2.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#646262] font-bold">
                {language === 'ko' ? '미실현 손익 (PnL)' : 'Unrealized PnL'}
              </span>
              <div
                className={`text-xs font-black flex items-center gap-1 ${
                  totalProfitSns >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {totalProfitSns >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>
                  {totalProfitSns >= 0 ? `+${totalProfitSns.toLocaleString()}` : totalProfitSns.toLocaleString()} SNS
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#646262] font-bold">
                {language === 'ko' ? '수익률' : 'Return'}
              </span>
              <div
                className={`text-xs font-black ${
                  totalProfitRate >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {totalProfitRate >= 0 ? `+${totalProfitRate.toFixed(2)}%` : `${totalProfitRate.toFixed(2)}%`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Breakdown List */}
      {holdings.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-[rgba(15,0,0,0.06)]">
          <span className="text-[10px] text-[#646262] font-bold">
            {language === 'ko' ? '보유 종목 상세 & 1-Tap 익절/손절' : 'Holdings & 1-Tap TP/SL'}
          </span>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {itemsWithColor.map((h) => (
              <div
                key={h.cardId}
                onClick={() => {
                  triggerHaptic('light');
                  if (onSelectStock) onSelectStock(h.cardId);
                }}
                className="flex items-center justify-between p-2 bg-white border border-[rgba(15,0,0,0.06)] hover:border-[#201d1d] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: h.color }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-[#201d1d]">{h.symbol}</span>
                      <span className="text-[10px] text-[#646262] truncate">[{h.cardTitle}]</span>
                    </div>
                    <div className="text-[10px] text-[#8c8989]">
                      {h.quantity}주 ({h.weightPct.toFixed(1)}%)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="font-black text-[#201d1d]">
                      {h.totalValue.toLocaleString()} SNS
                    </div>
                    <div
                      className={`text-[9px] font-bold ${
                        h.change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {h.change24h >= 0 ? `+${h.change24h.toFixed(2)}%` : `${h.change24h.toFixed(2)}%`}
                    </div>
                  </div>
                  {onOpenTpSl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('light');
                        onOpenTpSl(h.cardId);
                      }}
                      className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 text-[10px] font-bold rounded-xs cursor-pointer active:scale-95 transition-all"
                      title={language === 'ko' ? '익절/손절 예약 설정' : 'TP/SL Settings'}
                    >
                      TP/SL
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
