/**
 * BattleFinisherCutin.tsx - SCR-02-15
 * 배틀 피니시 컷인 & 승리 2배 보상 더블업 티켓 팝업
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Flame, Clock, Zap, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface BattleFinisherCutinProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
  baseRewardSns: number;
  onDoubleRewardClaimed: (totalSns: number) => void;
}

export const BattleFinisherCutin: React.FC<BattleFinisherCutinProps> = ({
  isOpen,
  onClose,
  language = 'ko',
  baseRewardSns,
  onDoubleRewardClaimed,
}) => {
  const [timeLeft, setTimeLeft] = useState(60); // 1분 타이머
  const [isClaimed, setIsClaimed] = useState(false);

  useEffect(() => {
    if (!isOpen || isClaimed) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isClaimed]);

  if (!isOpen) return null;

  const handleDoubleUp = () => {
    setIsClaimed(true);
    triggerHaptic('heavy');
    onDoubleRewardClaimed(baseRewardSns * 2);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 border-2 border-amber-400 rounded-lg p-5 text-white shadow-2xl relative text-center"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X size={20} />
          </button>

          {/* 피니시 컷인 헤더 */}
          <div className="relative inline-block mb-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="p-3 bg-amber-500/20 rounded-full text-amber-300 border border-amber-400/50"
            >
              <Trophy size={36} />
            </motion.div>
            <span className="absolute -bottom-1 -right-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase animate-pulse">
              FINISH
            </span>
          </div>

          <h2 className="text-xl font-black text-amber-300 tracking-tight">
            💥 {language === 'ko' ? '초토화 피니시 이펙트!' : 'DESTRUCTIVE FINISH!'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 mb-4">
            {language === 'ko'
              ? '상대 카드를 산산조각 내며 완벽한 승리를 거두었습니다!'
              : 'Opponent card shattered into pieces! Absolute Victory!'}
          </p>

          <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded mb-4 text-center">
            <div className="text-[10px] text-slate-400 uppercase">
              {language === 'ko' ? '기본 획득 보상' : 'Base Victory Reward'}
            </div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              +{baseRewardSns} SNS
            </div>
          </div>

          {/* 1분 한정 더블업 타임딜 */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-400/60 rounded text-left mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-1 text-xs font-black text-amber-300">
                <Flame size={14} className="text-rose-400 animate-pulse" />
                {language === 'ko' ? '빅토리 더블업 티켓 (400원)' : 'Victory Double-Up ($0.35)'}
              </span>
              <span className="text-[11px] text-rose-300 font-bold flex items-center gap-0.5">
                <Clock size={12} /> {timeLeft}s
              </span>
            </div>
            <p className="text-[10px] text-slate-300 mb-2">
              {language === 'ko'
                ? '지금 즉시 승리 보상을 2배로 수령하세요!'
                : 'Double your victory reward instantly!'}
            </p>

            <button
              type="button"
              disabled={timeLeft === 0 || isClaimed}
              onClick={handleDoubleUp}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs rounded active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-40"
            >
              {isClaimed
                ? (language === 'ko' ? '✨ 2배 보상 적용 완료!' : '✨ 2x Reward Applied!')
                : (language === 'ko' ? `⚡ 2배 보상 받기 (+${baseRewardSns * 2} SNS)` : `⚡ Claim 2x (+${baseRewardSns * 2} SNS)`)}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded cursor-pointer"
          >
            {language === 'ko' ? '일반 보상만 받고 닫기' : 'Claim Base Reward Only'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
