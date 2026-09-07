import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, HelpCircle, Pause, Play, AlertCircle, Coins, CheckCircle, RotateCcw, LogOut } from 'lucide-react';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

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
  const rawExitHandler = onExit || onBack || onClose || (() => {});

  // Game start timestamp for progress settlement calculation
  const startTimeRef = useRef<number>(Date.now());
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [settledReceipt, setSettledReceipt] = useState<RewardReceipt | null>(null);

  const curVal = currentScore ?? score ?? currentProgress ?? 0;
  const tgtVal = targetScore ?? maxScore ?? goalScore ?? 1000;
  const uStr = scoreUnit ?? unit ?? '';

  // Calculate estimated SNS reward dynamically based on current progress
  const estimatedSns = useMemo(() => {
    const elapsed = Math.max(10, Math.min(300, Math.floor((Date.now() - startTimeRef.current) / 1000)));
    const base = Math.round((elapsed / 60) * 50);
    const ratio = tgtVal > 0 ? Math.min(2.5, curVal / tgtVal) : 1.0;
    const bonus = Math.round(base * Math.min(1.5, ratio * 0.6));
    const raw = Math.round((base + bonus) * 0.5);
    return Math.max(15, Math.min(50, raw));
  }, [curVal, tgtVal, showExitConfirm]);

  // Intercept browser back button (popstate) and global top-left back button (global-back)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Push dummy history entry so the browser back button can be trapped
    window.history.pushState({ missionInGame: true }, '');

    const handlePopState = () => {
      // Open exit confirmation modal instead of popping back to home
      setShowExitConfirm(true);
      // Re-push so future back presses remain trapped inside game
      window.history.pushState({ missionInGame: true }, '');
    };

    const handleGlobalBack = (e: Event) => {
      // Prevent App.tsx from executing onBackFromGame (which exits to home)
      e.preventDefault();
      setShowExitConfirm(true);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('global-back', handleGlobalBack);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('global-back', handleGlobalBack);
    };
  }, []);

  // Exit trigger handler
  const handleExitClick = () => {
    setShowExitConfirm(true);
  };

  // Confirm exit with settled reward
  const handleConfirmExit = () => {
    const elapsedSeconds = Math.max(10, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const isWinRatio = tgtVal > 0 && curVal >= Math.round(tgtVal * 0.5);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_mission',
      gameTitle: displayTitle,
      durationSeconds: elapsedSeconds,
      score: curVal,
      maxTargetScore: tgtVal,
      isVictory: isWinRatio,
    });

    setSettledReceipt(receipt);

    // After brief acknowledgement, transition back to mission list
    setTimeout(() => {
      setShowExitConfirm(false);
      rawExitHandler();
    }, 600);
  };

  // Build fallback telemetries if none provided
  const items: TelemetryItem[] = Array.isArray(telemetries) ? [...telemetries] : [];

  if (items.length === 0) {
    if (missionTarget) {
      items.push({
        label: isKo ? '목표' : 'TARGET',
        value: missionTarget,
        color: 'text-amber-300'
      });
    }

    if (currentScore !== undefined || score !== undefined || currentProgress !== undefined) {
      const displayVal = targetScore !== undefined || maxScore !== undefined || goalScore !== undefined
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
    <>
      <header className="absolute top-0 left-0 right-0 z-30 px-3 py-2 bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center justify-between text-white text-[11px] font-mono select-none pointer-events-auto h-11">
        {/* Left: Exit & Title */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExitClick}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 active:bg-white/30 px-2 py-1 rounded-sm border border-white/15 text-white font-bold transition-colors cursor-pointer"
            title={isKo ? '나가기 (정산)' : 'Exit (Settle)'}
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

      {/* Exit Confirmation & Progress Settlement Modal (110 Games Unified) */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[999999] bg-[#201d1d]/85 flex items-center justify-center p-4 font-mono select-none backdrop-blur-xs">
          <div className="bg-[#fdfcfc] text-[#201d1d] border-2 border-[#201d1d] w-full max-w-sm p-5 flex flex-col shadow-2xl relative rounded-none animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center gap-2 border-b border-[#201d1d]/20 pb-3 mb-3">
              <div className="w-8 h-8 rounded-sm bg-amber-500/20 border border-amber-600/40 flex items-center justify-center text-amber-800">
                <AlertCircle size={18} />
              </div>
              <div>
                <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">
                  {isKo ? '미션 종료 및 진행도 정산' : 'MISSION EXIT & SETTLEMENT'}
                </div>
                <h3 className="text-sm font-black uppercase text-[#201d1d] leading-tight">
                  {displayTitle}
                </h3>
              </div>
            </div>

            {/* Content Body */}
            <div className="text-xs text-[#201d1d]/80 leading-relaxed mb-4">
              <p className="mb-2">
                {isKo
                  ? '게임을 종료하고 미션 리스트 화면으로 이동하시겠습니까?'
                  : 'Exit the mission and return to the mission list?'}
              </p>
              <p className="text-[11px] text-[#201d1d]/60 mb-3">
                {isKo
                  ? '지금까지 플레이한 진행도에 비례하여 SNS 포인트가 즉시 정산 지급됩니다.'
                  : 'Your progress will be settled and deposited into your SNS wallet immediately.'}
              </p>

              {/* Progress Summary Card */}
              <div className="bg-[#201d1d]/5 border border-[#201d1d]/20 p-3 rounded-none space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-[#201d1d]/70">
                  <span>{isKo ? '• 현재 달성 점수' : '• Current Score'}</span>
                  <span className="font-bold text-[#201d1d]">{curVal} {uStr}</span>
                </div>
                <div className="flex justify-between items-center text-[#201d1d]/70">
                  <span>{isKo ? '• 미션 목표 점수' : '• Target Goal'}</span>
                  <span className="font-bold text-[#201d1d]">{tgtVal} {uStr}</span>
                </div>
                <div className="border-t border-[#201d1d]/15 pt-1.5 mt-1 flex justify-between items-center">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <Coins size={13} className="text-amber-600" />
                    <span>{isKo ? '정산 지급 예정' : 'Settlement Reward'}</span>
                  </span>
                  <span className="font-black text-amber-900 text-sm">
                    +{estimatedSns} SNS
                  </span>
                </div>
              </div>

              {settledReceipt && (
                <div className="mt-3 p-2 bg-emerald-500/15 border border-emerald-600/30 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                  <CheckCircle size={14} className="text-emerald-700 shrink-0" />
                  <span>
                    {isKo ? `+${settledReceipt.totalSns} SNS 지갑 입금 완료! 이동 중...` : `+${settledReceipt.totalSns} SNS Deposited! Returning...`}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                disabled={Boolean(settledReceipt)}
                onClick={() => setShowExitConfirm(false)}
                className="py-2.5 px-3 border-2 border-[#201d1d] text-[#201d1d] hover:bg-[#201d1d]/10 active:scale-98 text-xs font-bold rounded-sm cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw size={13} />
                <span>{isKo ? '계속하기' : 'Continue'}</span>
              </button>

              <button
                type="button"
                disabled={Boolean(settledReceipt)}
                onClick={handleConfirmExit}
                className="py-2.5 px-3 bg-[#201d1d] hover:bg-stone-800 active:scale-98 text-[#fdfcfc] text-xs font-bold rounded-sm cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                <LogOut size={13} />
                <span>{isKo ? '정산 후 나가기' : 'Exit & Settle'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MinimalistMissionHUD;


