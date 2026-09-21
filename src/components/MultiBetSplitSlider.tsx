/**
 * MultiBetSplitSlider.tsx - SCR-07-17
 * 복수 베팅 항목(승리, 첫 킬 등)에 금액을 한 번에 배분하는 1-Tap 멀티 베팅 스플릿 슬라이더(48px)
 */

import React, { useState } from 'react';
import { Sliders, Check, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface BetOption {
  id: string;
  name: string;
  odds: number;
}

interface MultiBetSplitSliderProps {
  totalBudget: number;
  options: BetOption[];
  onConfirmBets: (allocations: Record<string, number>) => void;
}

export const MultiBetSplitSlider: React.FC<MultiBetSplitSliderProps> = ({
  totalBudget,
  options,
  onConfirmBets,
}) => {
  const [splitPercent, setSplitPercent] = useState(50); // Split between first 2 options

  const betA = Math.floor(totalBudget * (splitPercent / 100));
  const betB = totalBudget - betA;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 font-mono select-none">
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-bold">
          <Sliders size={15} className="text-amber-400" />
          <span>멀티 베팅 스플릿 (총 {totalBudget} SNS)</span>
        </div>
        <span className="text-slate-400 text-[10px]">{splitPercent}% / {100 - splitPercent}%</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px]">{options[0]?.name || '승리 배팅'}</span>
          <span className="text-amber-400 font-black">{betA} SNS</span>
        </div>
        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px]">{options[1]?.name || '첫 킬 배팅'}</span>
          <span className="text-amber-400 font-black">{betB} SNS</span>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={100}
        value={splitPercent}
        onChange={(e) => {
          setSplitPercent(Number(e.target.value));
          triggerHaptic('selection');
        }}
        className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
      />

      {/* 48px Action Button */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('heavy');
          onConfirmBets({
            [options[0]?.id || 'opt1']: betA,
            [options[1]?.id || 'opt2']: betB,
          });
        }}
        className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
      >
        <Check size={16} />
        <span>멀티 배팅 일괄 승인 ({totalBudget} SNS)</span>
      </button>
    </div>
  );
};
