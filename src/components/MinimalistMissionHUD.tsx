import React from 'react';
import { ArrowLeft, HelpCircle, Pause, Play } from 'lucide-react';

export interface TelemetryItem {
  label: string;
  value: string | number;
  color?: string;
}

export interface MinimalistMissionHUDProps {
  // Title variants
  title?: string;
  gameTitle?: string;

  // Language
  language?: string;

  // Telemetries & Stats
  telemetries?: TelemetryItem[];
  currentScore?: number;
  score?: number;
  currentProgress?: number;
  targetScore?: number;
  maxScore?: number;
  goalScore?: number;
  missionTarget?: string;
  scoreUnit?: string;
  unit?: string;
  timeLeft?: number | string;
  stageInfo?: string;
  combo?: number;
  lives?: number;
  rewardSNS?: number;

  // HP Bar
  hp?: { current: number; max: number };

  // Exit / Back Handlers
  onExit?: () => void;
  onBack?: () => void;
  onClose?: () => void;

  // Optional Controls
  onHelp?: () => void;
  onPauseToggle?: () => void;
  isPaused?: boolean;
}

export const MinimalistMissionHUD: React.FC<MinimalistMissionHUDProps> = ({
  title,
  gameTitle,
  language = 'ko',
  telemetries,
  currentScore,
  score,
  currentProgress,
  targetScore,
  maxScore,
  goalScore,
  missionTarget,
  scoreUnit,
  unit,
  timeLeft,
  stageInfo,
  combo,
  lives,
  rewardSNS,
  hp,
  onExit,
  onBack,
  onClose,
  onHelp,
  onPauseToggle,
  isPaused = false
}) => {
  const isKo = language === 'ko';
  const displayTitle = title || gameTitle || 'SNSHERO MISSION';
  const handleExit = onExit || onBack || onClose || (() => {});

  // Build fallback telemetries if none provided
  const items: TelemetryItem[] = Array.isArray(telemetries) ? [...telemetries] : [];

  if (items.length === 0) {
    const curVal = currentScore ?? score ?? currentProgress;
    const tgtVal = targetScore ?? maxScore ?? goalScore;
    const uStr = scoreUnit ?? unit ?? '';

    if (missionTarget) {
      items.push({
        label: isKo ? '목표' : 'TARGET',
        value: missionTarget,
        color: 'text-amber-300'
      });
    }

    if (curVal !== undefined) {
      const displayVal = tgtVal !== undefined
        ? `${curVal}/${tgtVal}${uStr ? ` ${uStr}` : ''}`
        : `${curVal}${uStr ? ` ${uStr}` : ''}`;
      items.push({
        label: isKo ? '점수' : 'SCORE',
        value: displayVal,
        color: 'text-emerald-400'
      });
    }

    if (stageInfo) {
      items.push({
        label: isKo ? '상태' : 'INFO',
        value: stageInfo,
        color: 'text-sky-300'
      });
    }

    if (timeLeft !== undefined) {
      const numSec = typeof timeLeft === 'number' ? timeLeft : parseFloat(String(timeLeft));
      items.push({
        label: isKo ? '남은시간' : 'TIME',
        value: typeof timeLeft === 'number' ? `${timeLeft}s` : String(timeLeft),
        color: !isNaN(numSec) && numSec <= 5 ? 'text-rose-400 font-black' : 'text-slate-200'
      });
    }

    if (combo !== undefined && combo > 1) {
      items.push({
        label: 'COMBO',
        value: `${combo}x`,
        color: 'text-fuchsia-400'
      });
    }

    if (lives !== undefined) {
      items.push({
        label: isKo ? '라이프' : 'LIVES',
        value: typeof lives === 'number' && lives > 0 ? '♥'.repeat(Math.min(5, lives)) : String(lives),
        color: 'text-rose-400'
      });
    }

    if (rewardSNS !== undefined) {
      items.push({
        label: 'SNS',
        value: `+${rewardSNS}`,
        color: 'text-amber-400'
      });
    }
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-30 px-3 py-2 bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center justify-between text-white text-[11px] font-mono select-none pointer-events-auto h-11">
      {/* Left: Exit & Title */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleExit}
          className="flex items-center gap-1 bg-white/10 hover:bg-white/20 active:bg-white/30 px-2 py-1 rounded-sm border border-white/15 text-white font-bold transition-colors cursor-pointer"
          title={isKo ? '나가기' : 'Exit'}
        >
          <ArrowLeft size={13} />
          <span className="text-[10px]">{isKo ? '나가기' : 'Exit'}</span>
        </button>
        <span className="text-amber-400 font-bold hidden sm:inline-block truncate max-w-[200px]">[{displayTitle}]</span>
      </div>

      {/* Center: HP Bar or Telemetry */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
        {hp && hp.max > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-rose-400 font-bold">HP</span>
            <div className="w-16 sm:w-24 bg-black/70 border border-rose-500/40 h-2 rounded-none overflow-hidden">
              <div
                className="bg-rose-500 h-full transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, (hp.current / hp.max) * 100))}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-300 font-bold">{hp.current}</span>
          </div>
        )}

        {/* Telemetry Items */}
        <div className="flex items-center gap-2 text-[10px] shrink-0">
          {(items || []).map((t, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-black/40 px-2 py-0.5 border border-white/5 rounded-xs">
              <span className="text-slate-400">{t.label}:</span>
              <span className={`font-bold ${t.color || 'text-amber-300'}`}>{t.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Help & Pause */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onHelp && (
          <button
            onClick={onHelp}
            className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-sm border border-white/15 text-amber-300 transition-colors cursor-pointer"
            title={isKo ? '가이드/도움말' : 'Help Guide'}
          >
            <HelpCircle size={14} />
          </button>
        )}
        {onPauseToggle && (
          <button
            onClick={onPauseToggle}
            className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-sm border border-white/15 text-slate-200 transition-colors cursor-pointer"
            title={isPaused ? (isKo ? '재개' : 'Resume') : (isKo ? '일시정지' : 'Pause')}
          >
            {isPaused ? <Play size={13} className="text-emerald-400" /> : <Pause size={13} />}
          </button>
        )}
      </div>
    </header>
  );
};

export default MinimalistMissionHUD;

