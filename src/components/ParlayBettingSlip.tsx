/**
 * ParlayBettingSlip.tsx - SCR-07-23
 * 경기를 탭할 때마다 카드가 쌓이는 플로팅 멀티 파를레이 베팅 슬립 (48px)
 */

import React from 'react';
import { Layers, ChevronUp, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface ParlaySelection {
  matchId: string;
  matchTitle: string;
  predictedTeam: string;
  odds: number;
}

interface ParlayBettingSlipProps {
  selections: ParlaySelection[];
  onOpenSheet: () => void;
  onRemoveSelection: (matchId: string) => void;
}

export const ParlayBettingSlip: React.FC<ParlayBettingSlipProps> = ({
  selections,
  onOpenSheet,
  onRemoveSelection,
}) => {
  if (selections.length === 0) return null;

  const totalOdds = selections.reduce((acc, s) => acc * s.odds, 1).toFixed(2);

  return (
    <div className="fixed bottom-16 inset-x-4 z-40 bg-slate-950/95 border-2 border-amber-400 rounded-2xl p-2.5 flex items-center justify-between shadow-2xl font-mono select-none backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
          {selections.length}
        </div>
        <div>
          <span className="text-xs font-black text-white block">멀티 파를레이 슬립</span>
          <span className="text-[10px] text-amber-400 font-bold">합산 배당률 {totalOdds}x</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          triggerHaptic('medium');
          onOpenSheet();
        }}
        className="h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs flex items-center gap-1 active:scale-95 cursor-pointer shadow"
      >
        <span>베팅 확정</span>
        <ChevronUp size={14} />
      </button>
    </div>
  );
};
