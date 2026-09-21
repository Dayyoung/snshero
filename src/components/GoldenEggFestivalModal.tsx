/**
 * GoldenEggFestivalModal.tsx - SCR-04-18
 * 전 서버 소환 누적 시 차오르는 '황금 알 게이지' 100% 충전 시 무료 소환 & 확률 2배 피버 타임 발동 및 황금 알 폭발 특가팩(1,500원) 연동
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Egg, Flame, Zap, X, Gift } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface GoldenEggFestivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  eggGauge: number; // 0 to 100
  isFeverActive: boolean;
  feverTimeRemaining: number; // in seconds
  onBuyFeverPack: () => void;
}

export const GoldenEggFestivalModal: React.FC<GoldenEggFestivalModalProps> = ({
  isOpen,
  onClose,
  eggGauge,
  isFeverActive,
  feverTimeRemaining,
  onBuyFeverPack,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Egg size={16} />
            <span>🥚 전 서버 황금 알 페스티벌</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          {/* Egg Icon / Animation */}
          <motion.div
            animate={
              isFeverActive
                ? { scale: [1, 1.15, 1], rotate: [-5, 5, -5] }
                : { y: [0, -4, 0] }
            }
            transition={{ repeat: Infinity, duration: isFeverActive ? 1 : 2 }}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl ${
              isFeverActive
                ? 'bg-amber-400/20 border-4 border-amber-400 text-amber-300 animate-pulse'
                : 'bg-slate-900 border-2 border-slate-700 text-amber-400'
            }`}
          >
            🥚
          </motion.div>

          {/* Status & Progress */}
          <div>
            <h4 className="text-sm font-black text-white">
              {isFeverActive ? '🔥 피버 타임 가동 중! (소환 확률 2배)' : '황금 알 게이지 충전 중'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">
              {isFeverActive
                ? `남은 피버 시간: ${Math.floor(feverTimeRemaining / 60)}분 ${feverTimeRemaining % 60}초`
                : '전 서버 유저들의 소환이 모여 100% 충전 시 1시간 무료 소환 피버가 폭발합니다!'}
            </p>
          </div>

          {/* Gauge Bar */}
          <div className="w-full flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>서버 누적 게이지</span>
              <span className="text-amber-400">{eggGauge}%</span>
            </div>
            <div className="w-full h-3 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-300"
                style={{ width: `${Math.min(100, eggGauge)}%` }}
              />
            </div>
          </div>

          {/* Golden Egg Fever Pack Upsell (SCR-04-18) */}
          <div className="w-full p-3 bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/50 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">황금 알 폭발 특가팩 (1,500원)</span>
              <span className="text-[10px] text-slate-400">SSR 확정권 + 500 SNS 즉시 지급</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                onBuyFeverPack();
                onClose();
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (350 SNS)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
