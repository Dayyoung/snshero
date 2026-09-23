import React from 'react';
import { Bot, Play, Pause } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface AutoBattleHapticToggleProps {
  isAuto: boolean;
  onToggle: () => void;
  compact?: boolean;
  className?: string;
  id?: string;
}

export const AutoBattleHapticToggle: React.FC<AutoBattleHapticToggleProps> = ({
  isAuto,
  onToggle,
  compact = false,
  className = '',
  id = 'auto-battle-haptic-toggle-btn'
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(isAuto ? 'tap' : 'medium');
    onToggle();
  };

  if (compact) {
    return (
      <button
        id={id}
        type="button"
        onClick={handleClick}
        className={`relative inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-2 py-1.5 font-mono text-xs border rounded-sm transition-all active:scale-95 select-none ${
          isAuto
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
            : 'bg-black/60 text-slate-400 border-white/10 hover:text-slate-200'
        } ${className}`}
        aria-label={isAuto ? '오토 전투 끄기' : '오토 전투 켜기'}
      >
        <Bot className={`w-3.5 h-3.5 mr-1 ${isAuto ? 'animate-bounce text-amber-400' : 'text-slate-400'}`} />
        <span className="font-bold tracking-tight">{isAuto ? 'AUTO' : 'MANUAL'}</span>
        {isAuto && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
        )}
      </button>
    );
  }

  return (
    <button
      id={id}
      type="button"
      onClick={handleClick}
      className={`relative flex items-center justify-between min-h-[44px] px-3 py-2 font-mono text-xs border rounded-sm transition-all active:scale-95 select-none ${
        isAuto
          ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
          : 'bg-black/50 border-white/15 text-slate-300 hover:border-white/30'
      } ${className}`}
      aria-label={isAuto ? '오토 전투 켜짐 (클릭시 해제)' : '오토 전투 꺼짐 (클릭시 활성화)'}
    >
      <div className="flex items-center gap-1.5">
        <Bot className={`w-4 h-4 ${isAuto ? 'text-amber-400' : 'text-slate-400'}`} />
        <span className="font-semibold tracking-wide">
          {isAuto ? '[AUTO ON]' : '[AUTO OFF]'}
        </span>
      </div>

      <div className="flex items-center gap-1 ml-2">
        {isAuto ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded-sm border border-amber-500/30">
            <Play className="w-2.5 h-2.5 fill-current" />
            RUN
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded-sm border border-white/10">
            <Pause className="w-2.5 h-2.5" />
            STANDBY
          </span>
        )}
      </div>

      {isAuto && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
        </span>
      )}
    </button>
  );
};
