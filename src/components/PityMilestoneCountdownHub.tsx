/**
 * PityMilestoneCountdownHub.tsx - SCR-04-23
 * 다음 천장(Pity)까지 남은 소환 횟수를 시각화하는 천장 마일스톤 카운트다운 허브
 */

import React from 'react';
import { Target, Sparkles } from 'lucide-react';

interface PityMilestoneCountdownHubProps {
  currentPullCount: number;
  maxPity: number;
}

export const PityMilestoneCountdownHub: React.FC<PityMilestoneCountdownHubProps> = ({
  currentPullCount,
  maxPity = 50,
}) => {
  const remaining = Math.max(0, maxPity - currentPullCount);
  const progressPercent = Math.min(100, (currentPullCount / maxPity) * 100);

  return (
    <div className="w-full bg-slate-950/80 border border-amber-500/40 rounded-2xl p-2.5 font-mono select-none">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <Target size={14} />
          <span>SSR 확정 천장 카운트다운</span>
        </div>
        <span className="text-[11px] font-black text-white">
          {remaining > 0 ? `${remaining}회 남음` : '확정 소환 가능!'}
        </span>
      </div>

      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
