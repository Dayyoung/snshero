/**
 * BettingPresetChips.tsx - SCR-07-20
 * 44px 1-Tap 커스텀 프리셋 베팅 금액 칩
 */

import React from 'react';
import { triggerHaptic } from '../lib/haptic';

interface BettingPresetChipsProps {
  presets?: number[];
  currentAmount: number;
  onSelectAmount: (amount: number) => void;
}

export const BettingPresetChips: React.FC<BettingPresetChipsProps> = ({
  presets = [50, 100, 300, 500, 1000],
  currentAmount,
  onSelectAmount,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 font-mono select-none">
      {presets.map((amt) => {
        const isSelected = currentAmount === amt;
        return (
          <button
            key={amt}
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onSelectAmount(amt);
            }}
            className={`h-11 px-3.5 rounded-xl border text-xs font-black shrink-0 flex items-center justify-center transition active:scale-95 cursor-pointer ${
              isSelected
                ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            +{amt} SNS
          </button>
        );
      })}
    </div>
  );
};
