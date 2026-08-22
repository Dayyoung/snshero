import React from 'react';
import { ArrowLeft, Trophy, Timer, Heart, HelpCircle, Pause, Play, Volume2, VolumeX, Flame } from 'lucide-react';

interface ResponsiveCleanHUDProps {
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

export const ResponsiveCleanHUD: React.FC<ResponsiveCleanHUDProps> = ({
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
    <header className="absolute top-2 left-2 right-2 z-30 pointer-events-none font-mono select-none">
      <div className="bg-[#fdfcfc]/95 text-[#201d1d] border border-[#201d1d]/30 px-3 py-1.5 rounded-sm shadow-xs flex items-center justify-between gap-2 backdrop-blur-xs">
        {/* Left: Exit & Title */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExit}
            className="pointer-events-auto px-2 py-1 bg-[#201d1d] text-[#fdfcfc] hover:bg-stone-800 text-[11px] font-bold rounded-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
            title={isKo ? '나가기' : 'Exit'}
          >
            <ArrowLeft size={12} />
            <span className="hidden xs:inline">{isKo ? '나가기' : 'Exit'}</span>
          </button>

          <span className="text-[11px] sm:text-xs font-black tracking-tight uppercase truncate max-w-[90px] sm:max-w-[150px]">
            {gameTitle}
          </span>
        </div>

        {/* Center: Live Telemetry (Score, Time, HP) */}
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] font-bold">
          {/* Score */}
          <div className="flex items-center gap-1 text-amber-700 bg-amber-500/10 px-1.5 py-0.5 rounded-xs border border-amber-600/20">
            <Trophy size={11} className="shrink-0" />
            <span>{score.toLocaleString()}P</span>
          </div>

          {/* Time Left */}
          {typeof timeLeft === 'number' && (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs border ${
              timeLeft <= 10
                ? 'bg-rose-500/15 border-rose-600 text-rose-700 animate-pulse'
                : 'bg-[#201d1d]/5 border-[#201d1d]/20 text-[#201d1d]'
            }`}>
              <Timer size={11} className="shrink-0" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}

          {/* HP Bar */}
          {typeof hp === 'number' && (
            <div className="hidden xs:flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded-xs text-rose-800">
              <Heart size={11} className="fill-rose-500 shrink-0" />
              <span>{Math.max(0, Math.round(hp))}/{maxHp}</span>
            </div>
          )}

          {/* Combo Multiplier */}
          {typeof combo === 'number' && combo > 1 && (
            <div className="hidden sm:flex items-center gap-0.5 bg-orange-500/15 border border-orange-500/40 px-1.5 py-0.5 rounded-xs text-orange-800 animate-bounce">
              <Flame size={11} className="fill-orange-500 shrink-0" />
              <span>{combo}x COMBO</span>
            </div>
          )}

          {/* Custom Metric */}
          {customMetricLabel && customMetricValue !== undefined && (
            <div className="hidden md:flex items-center gap-1 bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 rounded-xs text-blue-800">
              <span>{customMetricLabel}: {customMetricValue}</span>
            </div>
          )}
        </div>

        {/* Right: Actions (Help, Pause, Audio) */}
        <div className="flex items-center gap-1 shrink-0">
          {onTogglePause && (
            <button
              type="button"
              onClick={onTogglePause}
              className="pointer-events-auto p-1 border border-[#201d1d]/30 text-[#201d1d] hover:bg-[#201d1d]/10 rounded-xs cursor-pointer active:scale-95 transition-colors"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play size={12} /> : <Pause size={12} />}
            </button>
          )}

          {onToggleMute && (
            <button
              type="button"
              onClick={onToggleMute}
              className="pointer-events-auto p-1 border border-[#201d1d]/30 text-[#201d1d] hover:bg-[#201d1d]/10 rounded-xs cursor-pointer active:scale-95 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
          )}

          {onHelp && (
            <button
              type="button"
              onClick={onHelp}
              className="pointer-events-auto px-1.5 py-1 border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] hover:bg-stone-800 text-[10px] font-bold rounded-xs cursor-pointer active:scale-95 transition-colors flex items-center gap-0.5"
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
