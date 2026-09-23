/**
 * PinnedTargetRankBar.tsx - SCR-10-20
 * 목표 랭커를 상단에 고정해 점수차를 실시간 추적하는 48px 1-Tap 타겟 핀 바
 */

import React from 'react';
import { Pin, X, Target, Trophy } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface PinnedTargetRankBarProps {
  targetRank: number;
  targetName: string;
  targetElo: number;
  myElo: number;
  onUnpin: () => void;
}

export const PinnedTargetRankBar: React.FC<PinnedTargetRankBarProps> = ({
  targetRank,
  targetName,
  targetElo,
  myElo,
  onUnpin,
}) => {
  const eloDiff = targetElo - myElo;

  return (
    <div className="w-full bg-slate-900/90 border border-amber-400/60 backdrop-blur-md rounded-2xl p-2.5 flex items-center justify-between font-mono select-none text-xs shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
          <Target size={14} />
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-bold text-white">
            <span className="text-amber-400">#{targetRank}</span>
            <span>{targetName}</span>
          </div>
          <span className="text-[10px] text-slate-400">
            목표 격차: <span className="text-amber-300 font-bold">+{eloDiff} ELO</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          triggerHaptic('selection');
          onUnpin();
        }}
        className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center text-slate-400 cursor-pointer active:scale-95"
      >
        <X size={14} />
      </button>
    </div>
  );
};
