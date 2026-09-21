/**
 * InPlayQuickBetModal.tsx - SCR-07-15
 * 라이브 인플레이 5분 퀵 예측 및 조기 정산(Cash-Out) 패스 모달
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Zap, ShieldAlert, ArrowDownLeft, X, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface InPlayQuickBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchTitle: string;
  currentScore: string;
  activeBetAmount: number;
  onQuickBet: (option: string, amount: number) => void;
  onCashOut: (cashOutAmount: number) => void;
  language?: string;
}

export const InPlayQuickBetModal: React.FC<InPlayQuickBetModalProps> = ({
  isOpen,
  onClose,
  matchTitle,
  currentScore,
  activeBetAmount,
  onQuickBet,
  onCashOut,
  language = 'ko',
}) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5분 = 300초
  const [selectedQuickBet, setSelectedQuickBet] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft(t => (t > 0 ? t - 1 : 300));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const cashOutRate = 0.65; // 패배 위기 시 65% 원금 즉시 회수
  const cashOutValue = Math.round(activeBetAmount * cashOutRate);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-rose-500 rounded-2xl p-5 text-white shadow-2xl relative"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-rose-600/30 text-rose-400 rounded-lg border border-rose-500/50 animate-pulse">
              <Timer size={18} />
            </span>
            <div>
              <span className="text-[10px] text-rose-400 font-bold block">
                🔴 LIVE IN-PLAY ({formatTime(timeLeft)})
              </span>
              <h2 className="text-sm font-black text-white uppercase">
                {language === 'ko' ? '초단기 5분 퀵 승부 예측' : 'Live In-Play 5-Min Bet'}
              </h2>
            </div>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 my-3 text-xs">
            <div className="text-slate-300 font-bold truncate mb-1">{matchTitle}</div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">현재 스코어</span>
              <span className="text-amber-400 font-black text-sm">{currentScore}</span>
            </div>
          </div>

          {/* 5분 퀵 예측 선택 */}
          <div className="space-y-1.5 mb-4">
            <span className="text-[11px] text-slate-300 font-bold block">다음 5분 내 골/점수 발생 여부</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  onQuickBet('골 발생', 50);
                }}
                className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold text-xs flex flex-col items-center justify-center hover:bg-emerald-900 cursor-pointer active:scale-95"
              >
                <span>득점 발생</span>
                <span className="text-[10px] text-emerald-400 mt-0.5">2.40x (50 SNS)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  onQuickBet('무득점', 50);
                }}
                className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs flex flex-col items-center justify-center hover:bg-slate-800 cursor-pointer active:scale-95"
              >
                <span>득점 없음</span>
                <span className="text-[10px] text-slate-400 mt-0.5">1.55x (50 SNS)</span>
              </button>
            </div>
          </div>

          {/* 조기 정산 (Cash-Out) 패스 */}
          <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs text-rose-300 font-bold">
                <ArrowDownLeft size={16} />
                <span>{language === 'ko' ? '패배 위기 조기 정산 (Cash-Out)' : 'Emergency Cash-Out'}</span>
              </div>
              <span className="text-[10px] text-rose-400 font-black">65% 보존</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-2">
              패색이 짙어질 때 베팅금 {activeBetAmount} SNS 중 {cashOutValue} SNS를 즉시 회수합니다.
            </p>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                onCashOut(cashOutValue);
                onClose();
              }}
              className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg active:scale-95 cursor-pointer shadow-md"
            >
              {cashOutValue} SNS 즉시 회수 확정
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
