/**
 * PortfolioValueTrackerHUD.tsx - SCR-05-17
 * 상단에 내 인벤토리 총 가치를 실시간 시세로 자동 환산하여 보여주는 포트폴리오 트래커 HUD
 */

import React from 'react';
import { TrendingUp, Coins, Sparkles, Layers } from 'lucide-react';

interface PortfolioValueTrackerHUDProps {
  totalEstimatedValueSns: number;
  dailyChangePercent: number;
  totalCardsCount: number;
  onOpenBatchListing?: () => void;
}

export const PortfolioValueTrackerHUD: React.FC<PortfolioValueTrackerHUDProps> = ({
  totalEstimatedValueSns,
  dailyChangePercent,
  totalCardsCount,
  onOpenBatchListing,
}) => {
  const isPositive = dailyChangePercent >= 0;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between font-mono select-none shadow-md">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/40 flex items-center justify-center text-amber-400">
          <Coins size={18} />
        </div>
        <div>
          <div className="text-[10px] text-slate-400">보유 덱 추정 총자산</div>
          <div className="text-sm font-black text-white flex items-center gap-1.5">
            <span>{totalEstimatedValueSns.toLocaleString()} SNS</span>
            <span
              className={`text-[10px] font-bold ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? `+${dailyChangePercent}%` : `${dailyChangePercent}%`}
            </span>
          </div>
        </div>
      </div>

      {onOpenBatchListing && (
        <button
          type="button"
          onClick={onOpenBatchListing}
          className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] rounded-xl flex items-center gap-1 cursor-pointer active:scale-95 shadow"
        >
          <Layers size={13} />
          <span>스마트 일괄 출품</span>
        </button>
      )}
    </div>
  );
};
