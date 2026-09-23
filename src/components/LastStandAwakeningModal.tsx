/**
 * LastStandAwakeningModal.tsx - SCR-07-27
 * 체력 30% 이하 위기 시 1회 발동하는 '라스트 스탠드: 히어로 각성(Last Stand Awakening)' 연출(슬로우 모션 및 BGM 가속) 도입,
 * 궁극기 게이지 즉시 충전 및 역전 성공 시 전용 각성 코스튬 패키지 연동.
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, ShieldAlert, Zap, Sparkles, X, Heart } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface LastStandAwakeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  heroName: string;
  onActivateLastStand: () => void;
  onBuyAwakeningCostumePack: () => void;
}

export const LastStandAwakeningModal: React.FC<LastStandAwakeningModalProps> = ({
  isOpen,
  onClose,
  heroName,
  onActivateLastStand,
  onBuyAwakeningCostumePack,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    triggerHaptic('heavy');
    // Dual haptic pulse for heartbeat effect
    const timer = setTimeout(() => triggerHaptic('heavy'), 200);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none overflow-hidden">
      {/* Red vignette pulse border */}
      <div className="absolute inset-0 pointer-events-none border-4 border-rose-600/70 animate-pulse shadow-[inset_0_0_60px_rgba(225,29,72,0.6)]" />

      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="bg-slate-950 border-2 border-rose-500 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center relative z-10"
      >
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 text-slate-950 flex items-center justify-between font-black text-xs">
          <div className="flex items-center gap-1.5">
            <Flame size={16} />
            <span>[ LAST STAND: 히어로 각성 ]</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded bg-black/20 flex items-center justify-center text-slate-950 active:scale-95 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border-2 border-rose-500 flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse">
            ❤️‍🔥
          </div>

          <div>
            <h3 className="text-sm font-black text-white">체력 30% 이하 위기 돌파!</h3>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              히어로의 궁극적 투지가 폭발합니다.
              <br />
              즉시 <strong className="text-amber-400">궁극기 게이지 100% 충전</strong> 및 1턴 무적 쉴드가 발동됩니다.
            </p>
          </div>

          {/* Awakening Action Button (48px) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onActivateLastStand();
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg hover:brightness-105"
          >
            <Zap size={16} />
            <span>각성 궁극기 즉시 격발 (ULTIMATE CHARGE)</span>
          </button>

          {/* Limited Awakening Costume Pack (SCR-07-27) */}
          <div className="w-full p-3 bg-gradient-to-b from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1 text-xs font-black text-amber-300">
                <Sparkles size={13} />
                <span>각성 신화 코스튬 패키지</span>
              </div>
              <span className="text-[9px] text-slate-400 block">
                역전 승리 기념 한정판 이펙트 스킨 (1,200원)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyAwakeningCostumePack();
                onClose();
              }}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded active:scale-95 cursor-pointer shadow"
            >
              구매 (120 SNS)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
