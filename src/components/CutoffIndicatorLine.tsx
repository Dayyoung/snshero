/**
 * CutoffIndicatorLine.tsx - SCR-10-20
 * 승급선/강등선을 네온 라인으로 상시 표기하는 컷오프 인디케이터
 */

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CutoffIndicatorLineProps {
  type: 'promotion' | 'demotion';
  tierName: string;
  cutoffScore: number;
}

export const CutoffIndicatorLine: React.FC<CutoffIndicatorLineProps> = ({
  type,
  tierName,
  cutoffScore,
}) => {
  const isPromo = type === 'promotion';

  return (
    <div className="w-full py-1.5 flex items-center gap-2 font-mono select-none text-[10px]">
      <div
        className={`flex-1 h-[1px] ${
          isPromo ? 'bg-gradient-to-r from-transparent via-amber-400 to-amber-400' : 'bg-gradient-to-r from-transparent via-rose-500 to-rose-500'
        }`}
      />
      <div
        className={`px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold ${
          isPromo
            ? 'bg-amber-950/40 border-amber-400 text-amber-300'
            : 'bg-rose-950/40 border-rose-500 text-rose-300'
        }`}
      >
        {isPromo ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        <span>{tierName} {isPromo ? '승급선' : '강등선'} ({cutoffScore} ELO)</span>
      </div>
      <div
        className={`flex-1 h-[1px] ${
          isPromo ? 'bg-gradient-to-l from-transparent via-amber-400 to-amber-400' : 'bg-gradient-to-l from-transparent via-rose-500 to-rose-500'
        }`}
      />
    </div>
  );
};
