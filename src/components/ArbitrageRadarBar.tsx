/**
 * ArbitrageRadarBar.tsx - SCR-05-23
 * 평균가 대비 15% 이상 저렴한 급매물을 실시간으로 알리는 차익 레이더 바
 */

import React from 'react';
import { TrendingDown, Zap, ArrowUpRight } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface ArbitrageOpportunity {
  cardId: string;
  name: string;
  currentPrice: number;
  marketAverage: number;
  discountPercent: number;
}

interface ArbitrageRadarBarProps {
  opportunities: ArbitrageOpportunity[];
  onSelect: (item: ArbitrageOpportunity) => void;
}

export const ArbitrageRadarBar: React.FC<ArbitrageRadarBarProps> = ({
  opportunities,
  onSelect,
}) => {
  if (opportunities.length === 0) return null;

  return (
    <div className="w-full bg-amber-950/40 border-y border-amber-500/40 px-3 py-2 flex items-center gap-2 overflow-x-auto font-mono select-none">
      <div className="flex items-center gap-1 text-[11px] font-black text-amber-400 shrink-0">
        <Zap size={13} />
        <span>차익 레이더:</span>
      </div>

      {opportunities.map((opp) => (
        <button
          key={opp.cardId}
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            onSelect(opp);
          }}
          className="h-8 px-2.5 rounded-lg bg-slate-900/90 border border-amber-400/60 shrink-0 flex items-center gap-1.5 text-xs text-white hover:border-amber-400 active:scale-95 cursor-pointer"
        >
          <span className="font-bold">{opp.name}</span>
          <span className="text-emerald-400 font-black">-{opp.discountPercent}%</span>
          <span className="text-[10px] text-slate-400">({opp.currentPrice}G)</span>
          <ArrowUpRight size={11} className="text-amber-400" />
        </button>
      ))}
    </div>
  );
};
