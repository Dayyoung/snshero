/**
 * HandSortFilterChips.tsx - SCR-02-20
 * 손패 좌측 마나순/공격력순 원터치 자동 정렬 44px 칩
 */

import React from 'react';
import { ArrowDownUp, Zap, Swords } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export type HandSortType = 'mana' | 'attack' | 'rarity';

interface HandSortFilterChipsProps {
  onSort: (type: HandSortType) => void;
}

export const HandSortFilterChips: React.FC<HandSortFilterChipsProps> = ({ onSort }) => {
  return (
    <div className="flex items-center gap-1.5 font-mono select-none">
      <button
        type="button"
        onClick={() => {
          triggerHaptic('selection');
          onSort('mana');
        }}
        className="h-11 px-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 shadow"
      >
        <Zap size={12} className="text-amber-400" />
        <span>마나순</span>
      </button>

      <button
        type="button"
        onClick={() => {
          triggerHaptic('selection');
          onSort('attack');
        }}
        className="h-11 px-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 shadow"
      >
        <Swords size={12} className="text-rose-400" />
        <span>공격력순</span>
      </button>
    </div>
  );
};
