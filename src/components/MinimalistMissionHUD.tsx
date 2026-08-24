import React from 'react';
import { ArrowLeft, HelpCircle, Pause, Play } from 'lucide-react';

interface TelemetryItem {
  label: string;
  value: string | number;
  color?: string;
}

interface MinimalistMissionHUDProps {
  title: string;
  language: string;
  telemetries: TelemetryItem[];
  hp?: { current: number; max: number };
  onExit: () => void;
  onHelp?: () => void;
  onPauseToggle?: () => void;
  isPaused?: boolean;
}

export const MinimalistMissionHUD: React.FC<MinimalistMissionHUDProps> = ({
  title,
  language = 'ko',
  telemetries,
  hp,
  onExit,
  onHelp,
  onPauseToggle,
  isPaused = false
}) => {
  const isKo = language === 'ko';

  return (
    <header className="absolute top-0 left-0 right-0 z-30 px-3 py-2 bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center justify-between text-white text-[11px] font-mono select-none pointer-events-auto h-11">
      {/* Left: Exit & Title */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExit}
          className="flex items-center gap-1 bg-white/10 hover:bg-white/20 active:bg-white/30 px-2 py-1 rounded-sm border border-white/15 text-white font-bold transition-colors"
          title={isKo ? '나가기' : 'Exit'}
        >
          <ArrowLeft size={13} />
          <span className="text-[10px]">{isKo ? '나가기' : 'Exit'}</span>
        </button>
        <span className="text-amber-400 font-bold hidden sm:inline-block">[{title}]</span>
      </div>

      {/* Center: HP Bar or Main Telemetry */}
      <div className="flex items-center gap-3">
        {hp && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-rose-400 font-bold">HP</span>
            <div className="w-20 sm:w-28 bg-black/70 border border-rose-500/40 h-2 rounded-none overflow-hidden">
              <div
                className="bg-rose-500 h-full transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, (hp.current / hp.max) * 100))}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-300 font-bold">{hp.current}</span>
          </div>
        )}

        {/* Telemetry Items */}
        <div className="flex items-center gap-2 text-[10px]">
          {telemetries.map((t, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-black/40 px-2 py-0.5 border border-white/5 rounded-xs">
              <span className="text-slate-400">{t.label}:</span>
              <span className={`font-bold ${t.color || 'text-amber-300'}`}>{t.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Help & Pause */}
      <div className="flex items-center gap-1.5">
        {onHelp && (
          <button
            onClick={onHelp}
            className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-sm border border-white/15 text-amber-300 transition-colors"
            title={isKo ? '가이드/도움말' : 'Help Guide'}
          >
            <HelpCircle size={14} />
          </button>
        )}
        {onPauseToggle && (
          <button
            onClick={onPauseToggle}
            className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-sm border border-white/15 text-slate-200 transition-colors"
            title={isPaused ? (isKo ? '재개' : 'Resume') : (isKo ? '일시정지' : 'Pause')}
          >
            {isPaused ? <Play size={13} className="text-emerald-400" /> : <Pause size={13} />}
          </button>
        )}
      </div>
    </header>
  );
};
