import React from 'react';
import { ArrowLeft, Trophy, Timer, Heart, HelpCircle, Pause, Play, Volume2, VolumeX, Flame } from 'lucide-react';

export interface MobileSafeAreaHUDProps {
  gameTitle: string;
  score: number;
  timeLeft?: number;
  hp?: number;
  maxHp?: number;
  combo?: number;
  customMetricLabel?: string;
  customMetricValue?: string | number;
  isPaused?: boolean;
  isMuted?: boolean;
  language: string;
  onExit: () => void;
  onHelp?: () => void;
  onTogglePause?: () => void;
  onToggleMute?: () => void;
}

/**
 * MobileSafeAreaHUD.tsx
 * Safe-Area Aware Minimal 1-Line HUD per DESIGN.md
 * - Automatically pads for mobile notches and safe areas (env(safe-area-inset-*))
 * - Clears upper 70% game viewport for unobstructed visibility
 * - Flat 1px hairline border, warm cream (#fdfcfc) / ink (#201d1d) palette
 */
export const MobileSafeAreaHUD: React.FC<MobileSafeAreaHUDProps> = ({
  gameTitle,
  score,
  timeLeft,
  hp,
  maxHp = 100,
  combo,
  customMetricLabel,
  customMetricValue,
  isPaused = false,
  isMuted = false,
  language,
  onExit,
  onHelp,
  onTogglePause,
  onToggleMute
}) => {
  const isKo = language === 'ko';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header
      className="absolute top-0 left-0 right-0 z-40 pointer-events-none font-mono select-none"
      style={{
        paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
        paddingLeft: 'max(8px, env(safe-area-inset-left, 8px))',
        paddingRight: 'max(8px, env(safe-area-inset-right, 8px))'
      }}
    >
      <div className="bg-[#fdfcfc]/95 text-[#201d1d] border border-[#201d1d]/30 px-2.5 py-1.5 rounded-none shadow-xs flex items-center justify-between gap-1.5 sm:gap-2 backdrop-blur-xs w-full max-w-4xl mx-auto">
        {/* Left: Exit CTA & Game Title */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onExit}
            className="pointer-events-auto px-2 py-1 bg-[#201d1d] text-[#fdfcfc] hover:bg-stone-800 text-[11px] font-bold rounded-sm flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
            title={isKo ? '나가기' : 'Exit'}
          >
            <ArrowLeft size={12} />
            <span className="hidden xs:inline">{isKo ? '나가기' : 'Exit'}</span>
          </button>

          <span className="text-[11px] sm:text-xs font-black tracking-tight uppercase truncate max-w-[85px] xs:max-w-[120px] sm:max-w-[200px]">
            {gameTitle}
          </span>
        </div>

        {/* Center: Essential Live Telemetry */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 text-[11px] font-bold">
          {/* Live Score */}
          <div className="flex items-center gap-1 text-amber-800 bg-amber-500/15 px-1.5 py-0.5 rounded-sm border border-amber-600/20">
            <Trophy size={11} className="shrink-0 text-amber-700" />
            <span>{score.toLocaleString()}P</span>
          </div>

          {/* Time Remaining */}
          {typeof timeLeft === 'number' && (
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-sm border ${
                timeLeft <= 10
                  ? 'bg-rose-500/20 border-rose-600 text-rose-800 animate-pulse font-black'
                  : 'bg-[#201d1d]/5 border-[#201d1d]/20 text-[#201d1d]'
              }`}
            >
              <Timer size={11} className="shrink-0" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}

          {/* HP / Lives */}
          {typeof hp === 'number' && (
            <div className="hidden xs:flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded-sm text-rose-800">
              <Heart size={11} className="fill-rose-500 shrink-0" />
              <span>{Math.max(0, Math.round(hp))}/{maxHp}</span>
            </div>
          )}

          {/* Combo Multiplier */}
          {typeof combo === 'number' && combo > 1 && (
            <div className="hidden sm:flex items-center gap-0.5 bg-orange-500/15 border border-orange-500/40 px-1.5 py-0.5 rounded-sm text-orange-900 animate-bounce">
              <Flame size={11} className="fill-orange-500 shrink-0" />
              <span>{combo}x</span>
            </div>
          )}

          {/* Custom Metric (Floors, Distance, Ammo, etc.) */}
          {customMetricLabel && customMetricValue !== undefined && (
            <div className="hidden md:flex items-center gap-1 bg-sky-500/10 border border-sky-500/30 px-1.5 py-0.5 rounded-sm text-sky-900">
              <span>{customMetricLabel}: {customMetricValue}</span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {onTogglePause && (
            <button
              type="button"
              onClick={onTogglePause}
              className="pointer-events-auto p-1 border border-[#201d1d]/30 text-[#201d1d] hover:bg-[#201d1d]/10 rounded-sm cursor-pointer active:scale-95 transition-colors"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play size={12} /> : <Pause size={12} />}
            </button>
          )}

          {onToggleMute && (
            <button
              type="button"
              onClick={onToggleMute}
              className="pointer-events-auto p-1 border border-[#201d1d]/30 text-[#201d1d] hover:bg-[#201d1d]/10 rounded-sm cursor-pointer active:scale-95 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
          )}

          {onHelp && (
            <button
              type="button"
              onClick={onHelp}
              className="pointer-events-auto px-1.5 py-1 border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] hover:bg-stone-800 text-[10px] font-bold rounded-sm cursor-pointer active:scale-95 transition-colors flex items-center gap-0.5"
              title={isKo ? '도움말 가이드' : 'Help Guide'}
            >
              <HelpCircle size={11} />
              <span>?</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
