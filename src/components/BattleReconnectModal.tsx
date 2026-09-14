import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, RefreshCw, Trophy, AlertTriangle } from 'lucide-react';
import { Language } from '../types';

interface BattleReconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  onForfeitWin?: () => void;
  isOpponentDisconnected?: boolean;
  initialSeconds?: number;
  language: Language;
}

export const BattleReconnectModal: React.FC<BattleReconnectModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  onForfeitWin,
  isOpponentDisconnected = false,
  initialSeconds = 30,
  language,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isRetrying, setIsRetrying] = useState(false);
  const [forfeitWon, setForfeitWon] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setRemainingSeconds(initialSeconds);
      setIsRetrying(false);
      setForfeitWon(false);
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (isOpponentDisconnected) {
            setForfeitWon(true);
            if (onForfeitWin) onForfeitWin();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, initialSeconds, isOpponentDisconnected, onForfeitWin]);

  const handleManualRetry = () => {
    setIsRetrying(true);
    if (onRetry) onRetry();
    setTimeout(() => {
      setIsRetrying(false);
    }, 1000);
  };

  if (!isOpen) return null;

  const progressPercent = (remainingSeconds / initialSeconds) * 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="relative w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 p-6 shadow-2xl text-center space-y-5"
        >
          {/* Status Icon */}
          <div className="flex justify-center">
            <div className={`p-4 rounded-full border ${
              forfeitWon
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : isOpponentDisconnected
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 animate-pulse'
            }`}>
              {forfeitWon ? (
                <Trophy size={36} />
              ) : isOpponentDisconnected ? (
                <WifiOff size={36} />
              ) : (
                <Wifi size={36} />
              )}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5">
            <h3 className="text-base font-bold tracking-tight text-white">
              {forfeitWon
                ? (language === 'ko' ? '상대방 연결 종료 (몰수승)' : 'Opponent Forfeit Win!')
                : isOpponentDisconnected
                ? (language === 'ko' ? '상대방 재접속 대기 중' : 'Waiting for Opponent Reconnect')
                : (language === 'ko' ? '대전 서버 재연결 중' : 'Reconnecting to Match')}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {forfeitWon
                ? (language === 'ko'
                    ? '상대방이 제한 시간 내에 복귀하지 않아 몰수승 처리되었습니다.'
                    : 'Opponent failed to reconnect within grace period. You win by forfeit!')
                : isOpponentDisconnected
                ? (language === 'ko'
                    ? '상대 플레이어의 네트워크가 불안정합니다. 30초 내 미접속 시 몰수승 처리됩니다.'
                    : 'Opponent network dropped. If they do not return in 30s, you win by forfeit.')
                : (language === 'ko'
                    ? '실시간 대전 네트워크가 일시 단절되었습니다. 소켓 재연결을 시도합니다.'
                    : 'Live battle connection dropped. Attempting automated socket recovery.')}
            </p>
          </div>

          {/* Countdown Ring */}
          {!forfeitWon && (
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="stroke-zinc-800"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className={`transition-all duration-1000 ${
                      remainingSeconds <= 5 ? 'stroke-rose-500' : 'stroke-indigo-500'
                    }`}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={213.6}
                    strokeDashoffset={213.6 - (213.6 * progressPercent) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-white">{remainingSeconds}s</span>
                  <span className="text-[9px] text-zinc-500 uppercase">Remain</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-center gap-2">
            {forfeitWon ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                {language === 'ko' ? '승리 보상 수령' : 'Claim Victory Reward'}
              </button>
            ) : isOpponentDisconnected ? (
              <div className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-center gap-2">
                <AlertTriangle size={14} className="text-amber-400" />
                <span>{language === 'ko' ? '자동 판정 진행 중...' : 'Grace timer in progress...'}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleManualRetry}
                disabled={isRetrying}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
                <span>
                  {isRetrying
                    ? (language === 'ko' ? '재접속 시도 중...' : 'Retrying...')
                    : (language === 'ko' ? '지금 즉시 재연결' : 'Retry Reconnection')}
                </span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
