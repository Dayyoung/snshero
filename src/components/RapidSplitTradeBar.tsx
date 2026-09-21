/**
 * RapidSplitTradeBar.tsx - SCR-06-14
 * 100dvh 하단 Thumb Zone 래피드 스플릿 4분할 매매 바 (48px 노-컨펌)
 */

import React from 'react';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface RapidSplitTradeBarProps {
  currentPrice: number;
  availableSns: number;
  holdingShares: number;
  onExecuteTrade: (type: 'buy' | 'sell', portion: number, shares: number) => void;
  language?: string;
}

export const RapidSplitTradeBar: React.FC<RapidSplitTradeBarProps> = ({
  currentPrice,
  availableSns,
  holdingShares,
  onExecuteTrade,
  language = 'ko',
}) => {
  const portions = [25, 50, 75, 100];

  const handleBuy = (portion: number) => {
    triggerHaptic('heavy');
    const budget = (availableSns * portion) / 100;
    const shares = Math.max(1, Math.floor(budget / currentPrice));
    if (shares > 0) {
      onExecuteTrade('buy', portion, shares);
    }
  };

  const handleSell = (portion: number) => {
    triggerHaptic('heavy');
    const shares = Math.max(1, Math.floor((holdingShares * portion) / 100));
    if (shares > 0 && holdingShares > 0) {
      onExecuteTrade('sell', portion, shares);
    }
  };

  return (
    <div className="w-full bg-slate-950/95 border-2 border-slate-800 rounded-xl p-2.5 font-mono select-none shadow-xl my-2">
      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 px-1">
        <span className="flex items-center gap-1 text-amber-400 font-bold">
          <Zap size={12} />
          {language === 'ko' ? '⚡ 래피드 스플릿 4분할 즉시 체결 (노-컨펌)' : '⚡ Rapid Split 4-Step Instant Trade'}
        </span>
        <span>보유: {holdingShares}주 / {availableSns.toLocaleString()} SNS</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* 매수 4분할 버튼 그룹 (좌측 엄지 영역) */}
        <div className="space-y-1">
          <span className="text-[10px] text-rose-400 font-bold block text-center">
            {language === 'ko' ? '분할 매수 (+25%~100%)' : 'Split Buy'}
          </span>
          <div className="grid grid-cols-4 gap-1">
            {portions.map((p) => (
              <button
                key={`buy-${p}`}
                type="button"
                onClick={() => handleBuy(p)}
                className="h-12 bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-300 font-black text-xs rounded flex flex-col items-center justify-center active:scale-90 transition-transform cursor-pointer"
              >
                <span>{p}%</span>
                <span className="text-[8px] text-rose-400">매수</span>
              </button>
            ))}
          </div>
        </div>

        {/* 매도 4분할 버튼 그룹 (우측 엄지 영역) */}
        <div className="space-y-1">
          <span className="text-[10px] text-blue-400 font-bold block text-center">
            {language === 'ko' ? '분할 매도 (-25%~100%)' : 'Split Sell'}
          </span>
          <div className="grid grid-cols-4 gap-1">
            {portions.map((p) => (
              <button
                key={`sell-${p}`}
                type="button"
                disabled={holdingShares <= 0}
                onClick={() => handleSell(p)}
                className="h-12 bg-blue-950/80 hover:bg-blue-900 border border-blue-600 text-blue-300 font-black text-xs rounded flex flex-col items-center justify-center active:scale-90 transition-transform cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                <span>{p}%</span>
                <span className="text-[8px] text-blue-400">매도</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
