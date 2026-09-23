/**
 * QuickRetryFusionDock.tsx - SCR-08-17
 * 동일 등급 재료를 1초 만에 자동 채우는 48px 1-Tap 재시도 독
 */

import React from 'react';
import { RotateCcw, Zap, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface QuickRetryFusionDockProps {
  onQuickRefill: () => void;
  availableMaterialsCount: number;
}

export const QuickRetryFusionDock: React.FC<QuickRetryFusionDockProps> = ({
  onQuickRefill,
  availableMaterialsCount,
}) => {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between font-mono select-none shadow-md">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-400">
          <RotateCcw size={16} />
        </div>
        <div>
          <div className="text-[10px] text-slate-400">동일 등급 재료 자동 채우기</div>
          <div className="text-xs font-black text-white">
            사용 가능 재료: <span className="text-purple-400">{availableMaterialsCount}장</span>
          </div>
        </div>
      </div>

      {/* 48px Action Button */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('medium');
          onQuickRefill();
        }}
        disabled={availableMaterialsCount < 2}
        className="h-10 px-3 bg-gradient-to-r from-purple-500 to-indigo-500 disabled:opacity-40 text-white font-black text-[11px] rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 shadow"
      >
        <Zap size={14} className="text-yellow-300" />
        <span>1-Tap 재료 세팅</span>
      </button>
    </div>
  );
};
