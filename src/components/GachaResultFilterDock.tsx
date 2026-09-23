/**
 * GachaResultFilterDock.tsx - SCR-04-26
 * 10장 가챠 결과 화면에서 'SSR만 보기 / 신규만 보기' 펄스 필터 칩(44px)으로 비대상 카드 딤 처리 및
 * 하단 Thumb Zone에 0.1초 만에 다음 10연차를 실행하는 '1-Tap 리롤 앵커 독(48px)' 구축.
 */

import React from 'react';
import { Sparkles, Star, Zap, RefreshCw, Layers } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export type GachaFilterMode = 'all' | 'ssr_only' | 'new_only';

interface GachaResultFilterDockProps {
  currentFilter: GachaFilterMode;
  onFilterChange: (filter: GachaFilterMode) => void;
  ssrCount: number;
  newCount: number;
  onRollAgain10x: () => void;
  costSns: number;
  userSns: number;
  isRolling?: boolean;
}

export const GachaResultFilterDock: React.FC<GachaResultFilterDockProps> = ({
  currentFilter,
  onFilterChange,
  ssrCount,
  newCount,
  onRollAgain10x,
  costSns,
  userSns,
  isRolling = false,
}) => {
  const canAfford = userSns >= costSns;

  return (
    <div className="w-full bg-slate-950/95 border-t border-slate-800 p-3 flex flex-col gap-2.5 font-mono select-none backdrop-blur-md">
      {/* 44px+ Filter Chips Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {/* All */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onFilterChange('all');
            }}
            className={`h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
              currentFilter === 'all'
                ? 'bg-slate-700 text-white border border-slate-500'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers size={13} />
            <span>전체 (10)</span>
          </button>

          {/* SSR Only */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onFilterChange('ssr_only');
            }}
            className={`h-9 px-3 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
              currentFilter === 'ssr_only'
                ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'bg-amber-950/30 text-amber-400 border border-amber-500/40 hover:bg-amber-950/50'
            }`}
          >
            <Star size={13} className="fill-current" />
            <span>SSR/UR만 보기 ({ssrCount})</span>
          </button>

          {/* New Only */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onFilterChange('new_only');
            }}
            className={`h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
              currentFilter === 'new_only'
                ? 'bg-cyan-500 text-slate-950 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                : 'bg-cyan-950/30 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-950/50'
            }`}
          >
            <Sparkles size={13} />
            <span>신규만 보기 ({newCount})</span>
          </button>
        </div>
      </div>

      {/* 48px 1-Tap Reroll Anchor Dock */}
      <button
        type="button"
        disabled={isRolling || !canAfford}
        onClick={() => {
          triggerHaptic('heavy');
          onRollAgain10x();
        }}
        className={`h-12 w-full rounded-xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg ${
          !canAfford
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            : isRolling
            ? 'bg-slate-700 text-slate-300 cursor-wait'
            : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-105'
        }`}
      >
        <RefreshCw size={16} className={isRolling ? 'animate-spin' : ''} />
        <span>
          {isRolling
            ? '소환 진행 중...'
            : !canAfford
            ? `SNS 잔액 부족 (${costSns} SNS 필요)`
            : `1-Tap 연속 10연차 소환 (${costSns} SNS)`}
        </span>
      </button>
    </div>
  );
};
