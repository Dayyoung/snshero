/**
 * DragAlertPriceSetter.tsx - SCR-06-17
 * 십자선 핀을 위아래로 끌어다 놓아 즉시 알림/주문을 등록하는 48px 드래그-앤-셋 컨트롤
 */

import React, { useState } from 'react';
import { Bell, ArrowUpDown, Check, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface DragAlertPriceSetterProps {
  currentPrice: number;
  onSetAlertPrice: (targetPrice: number) => void;
}

export const DragAlertPriceSetter: React.FC<DragAlertPriceSetterProps> = ({
  currentPrice,
  onSetAlertPrice,
}) => {
  const [targetPrice, setTargetPrice] = useState(currentPrice);

  const adjustPrice = (delta: number) => {
    triggerHaptic('selection');
    setTargetPrice((prev) => Math.max(1, prev + delta));
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between font-mono select-none">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
          <Bell size={16} />
        </div>
        <div>
          <div className="text-[10px] text-slate-400">목표가 도달 알림 핀</div>
          <div className="text-xs font-black text-amber-400">{targetPrice} SNS</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => adjustPrice(-10)}
          className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 font-black text-xs flex items-center justify-center active:scale-95 cursor-pointer"
        >
          -10
        </button>
        <button
          type="button"
          onClick={() => adjustPrice(+10)}
          className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 font-black text-xs flex items-center justify-center active:scale-95 cursor-pointer"
        >
          +10
        </button>
        {/* 48px Set Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('success');
            onSetAlertPrice(targetPrice);
          }}
          className="h-10 px-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] rounded-xl flex items-center gap-1 cursor-pointer active:scale-95 shadow"
        >
          <Check size={14} />
          <span>핀 등록</span>
        </button>
      </div>
    </div>
  );
};
