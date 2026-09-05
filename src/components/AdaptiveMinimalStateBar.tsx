/**
 * AdaptiveMinimalStateBar.tsx
 * design.md 준수 상단 70% 전장 시야 확보 & 플로팅 미니멀 상태바 컴포넌트
 * (구글 스프레드시트 Row 898 / ID 554 요구사항 구현)
 */

import React, { ReactNode } from 'react';
import { Heart, Coins, Zap, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface AdaptiveMinimalStateBarProps {
  currentHp: number;
  maxHp: number;
  score: number;
  combo?: number;
  timeRemaining?: number;
  onHelpClick?: () => void;
  viewportContent: ReactNode;
  thumbZoneContent?: ReactNode;
  className?: string;
}

export const AdaptiveMinimalStateBar: React.FC<AdaptiveMinimalStateBarProps> = ({
  currentHp,
  maxHp,
  score,
  combo = 0,
  timeRemaining,
  onHelpClick,
  viewportContent,
  thumbZoneContent,
  className = '',
}) => {
  const hpPct = Math.max(0, Math.min(100, (currentHp / (maxHp || 1)) * 100));

  return (
    <div
      className={cn(
        "relative w-full h-[100dvh] flex flex-col overflow-hidden bg-[#201d1d] font-mono select-none safe-area-inset",
        className
      )}
    >
      {/* 1. Floating Ultra-Slim 1-Line Top Glass Bar (Top 5%) */}
      <div className="absolute top-0 inset-x-0 z-30 h-10 px-3 flex items-center justify-between bg-black/40 backdrop-blur-md border-b border-white/10 text-white text-xs">
        {/* HP Bar */}
        <div className="flex items-center gap-1.5 w-28">
          <Heart size={14} className="text-rose-400 fill-rose-500 shrink-0" />
          <div className="flex-1 h-2 bg-white/20 rounded-none overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-300"
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-300 font-bold">{currentHp}</span>
        </div>

        {/* Center Combo & Score */}
        <div className="flex items-center gap-2">
          {combo > 1 && (
            <span className="text-[11px] font-black text-amber-400 animate-pulse flex items-center gap-0.5">
              <Zap size={12} />
              {combo}x
            </span>
          )}
          <div className="flex items-center gap-1 font-bold text-amber-300 text-xs">
            <Coins size={13} />
            <span>{score.toLocaleString()}</span>
          </div>
        </div>

        {/* Right Timer & Help */}
        <div className="flex items-center gap-2">
          {timeRemaining !== undefined && (
            <span className="text-xs font-bold text-cyan-300">
              {timeRemaining}s
            </span>
          )}
          {onHelpClick && (
            <button
              onClick={onHelpClick}
              className="p-1 hover:bg-white/10 rounded-sm text-slate-300 hover:text-white cursor-pointer"
            >
              <HelpCircle size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Clear 70% 3D/2D Viewport (Zero Obstruction) */}
      <div className="relative flex-1 w-full h-[70%] overflow-hidden pointer-events-auto">
        {viewportContent}
      </div>

      {/* 3. Bottom 30% Thumb-Zone Touch Area */}
      {thumbZoneContent && (
        <div className="relative w-full h-[30%] max-h-56 bg-[#181616] border-t border-white/10 p-2 flex items-center justify-center pointer-events-auto touch-none z-20">
          {thumbZoneContent}
        </div>
      )}
    </div>
  );
};
