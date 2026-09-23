/**
 * QuestPriorityFilterBar.tsx - SCR-11-17
 * 달성 임박순(80% 이상) / 보상 가치순 원터치 44px 퀵 필터 칩 바
 */

import React from 'react';
import { Sparkles, Trophy, Clock, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export type QuestFilterType = 'all' | 'near_complete' | 'high_reward' | 'daily';

interface QuestPriorityFilterBarProps {
  activeFilter: QuestFilterType;
  onSelectFilter: (filter: QuestFilterType) => void;
}

export const QuestPriorityFilterBar: React.FC<QuestPriorityFilterBarProps> = ({
  activeFilter,
  onSelectFilter,
}) => {
  const chips: { id: QuestFilterType; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: '전체', icon: <Sparkles size={12} /> },
    { id: 'near_complete', label: '달성 임박 (80%+)', icon: <Zap size={12} /> },
    { id: 'high_reward', label: '최고 보상순', icon: <Trophy size={12} /> },
    { id: 'daily', label: '일일 미션', icon: <Clock size={12} /> },
  ];

  return (
    <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 font-mono select-none">
      {chips.map((chip) => {
        const isActive = activeFilter === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onSelectFilter(chip.id);
            }}
            className={`h-11 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold whitespace-nowrap cursor-pointer transition active:scale-95 ${
              isActive
                ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {chip.icon}
            <span>{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
};
