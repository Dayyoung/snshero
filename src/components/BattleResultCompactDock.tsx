/**
 * BattleResultCompactDock.tsx - SCR-08-26
 * 100dvh 최적화 콤팩트 카드형 레이아웃: 상단 핵심 보상/MVP 하이라이트 요약 뷰 및
 * 하단 Thumb Zone에 고정된 '원탭 재도전 / 다음 스테이지 / 로비' 3버튼 플로팅 독(52px) 구축 및 스킵 제스처 통합.
 */

import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Play, Home, Trophy, Award, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface BattleResultCompactDockProps {
  isVictory: boolean;
  mvpCardName: string;
  totalGold: number;
  totalExp: number;
  onRetry: () => void;
  onNextStage: () => void;
  onGoHome: () => void;
  onSkipAnimation?: () => void;
}

export const BattleResultCompactDock: React.FC<BattleResultCompactDockProps> = ({
  isVictory,
  mvpCardName,
  totalGold,
  totalExp,
  onRetry,
  onNextStage,
  onGoHome,
  onSkipAnimation,
}) => {
  return (
    <div
      onClick={onSkipAnimation}
      className="w-full flex flex-col justify-between font-mono select-none"
    >
      {/* 1. Top Compact MVP & Summary Card */}
      <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-xl mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-2xl shadow">
            {isVictory ? '👑' : '🛡️'}
          </div>
          <div className="text-left">
            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
              <Award size={12} /> MVP 히어로
            </span>
            <span className="text-xs font-black text-white block">{mvpCardName}</span>
          </div>
        </div>

        <div className="text-right text-xs">
          <div className="text-amber-300 font-black flex items-center justify-end gap-1">
            <span>+{totalGold} Gold</span>
          </div>
          <div className="text-cyan-300 font-black flex items-center justify-end gap-1 mt-0.5">
            <span>+{totalExp} EXP</span>
          </div>
        </div>
      </div>

      {/* 2. Fixed Bottom Thumb Zone 3-Button Floating Dock (52px) */}
      <div className="w-full grid grid-cols-3 gap-2">
        {/* Lobby Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('light');
            onGoHome();
          }}
          className="h-13 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-black text-xs rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer shadow"
        >
          <Home size={16} />
          <span>로비</span>
        </button>

        {/* Retry Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('medium');
            onRetry();
          }}
          className="h-13 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-black text-xs rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer shadow"
        >
          <RotateCcw size={16} />
          <span>원탭 재도전</span>
        </button>

        {/* Next Stage Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('heavy');
            onNextStage();
          }}
          className={`h-13 font-black text-xs rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-lg ${
            isVictory
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-105'
              : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}
        >
          <Play size={16} />
          <span>다음 단계</span>
        </button>
      </div>
    </div>
  );
};
