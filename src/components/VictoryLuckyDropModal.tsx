/**
 * VictoryLuckyDropModal.tsx - SCR-02-27
 * 승리 즉시 황금 슬롯이 회전해 보상 상자를 추가 드랍하는 '승리의 럭키 드랍' 연출 및 카드 파편/골드 3배 수령 '배틀 익스프레스 패스(700원)' 연동.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Gift, Zap, X, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface VictoryLuckyDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseGold: number;
  baseCardShards: number;
  onClaimMultipliedReward: (multiplier: number) => void;
}

export const VictoryLuckyDropModal: React.FC<VictoryLuckyDropModalProps> = ({
  isOpen,
  onClose,
  baseGold,
  baseCardShards,
  onClaimMultipliedReward,
}) => {
  const [isSpinning, setIsSpinning] = useState(true);
  const [slotIndex, setSlotIndex] = useState(0);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [hasExpressPass, setHasExpressPass] = useState(() => {
    return localStorage.getItem('hero_battle_express_pass') === 'active';
  });

  const slotRewards = [
    { label: '전설 상자', icon: '🎁', multiplier: 3, color: 'text-amber-400' },
    { label: '희귀 파편 x5', icon: '💎', multiplier: 2, color: 'text-cyan-400' },
    { label: '골드 대박 x3', icon: '💰', multiplier: 3, color: 'text-yellow-300' },
    { label: '승리의 트로피', icon: '🏆', multiplier: 2.5, color: 'text-emerald-400' },
  ];

  useEffect(() => {
    if (!isOpen) {
      setIsSpinning(true);
      setHasClaimed(false);
      return;
    }

    let interval: ReturnType<typeof setInterval>;
    let count = 0;
    const totalSpins = 16;

    interval = setInterval(() => {
      setSlotIndex((prev) => (prev + 1) % slotRewards.length);
      triggerHaptic('light');
      count++;
      if (count >= totalSpins) {
        clearInterval(interval);
        setIsSpinning(false);
        triggerHaptic('heavy');
      }
    }, 90);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentReward = slotRewards[slotIndex];
  const activeMultiplier = hasExpressPass ? 3 : currentReward.multiplier;

  const handleClaim = () => {
    triggerHaptic('medium');
    setHasClaimed(true);
    onClaimMultipliedReward(activeMultiplier);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleBuyPass = () => {
    triggerHaptic('heavy');
    localStorage.setItem('hero_battle_express_pass', 'active');
    setHasExpressPass(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-950 border-2 border-amber-400 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center"
      >
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 flex items-center justify-between font-black text-xs">
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} />
            <span>[ 승리의 럭키 드랍 슬롯 ]</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded bg-black/20 flex items-center justify-center text-slate-950 active:scale-95 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col items-center gap-4">
          <div className="text-xs text-slate-300">
            승리 기념 황금 슬롯이 멈추면 보상이 증폭됩니다!
          </div>

          {/* Slot Display Box */}
          <div className="w-full bg-slate-900 border border-amber-500/50 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="text-4xl mb-2 animate-bounce">
              {currentReward.icon}
            </div>
            <div className={`text-sm font-black ${currentReward.color}`}>
              {currentReward.label}
            </div>
            <div className="text-[11px] text-amber-300 font-bold mt-1">
              {isSpinning ? '슬롯 회전 중...' : `기본 보상 x${activeMultiplier}배 확정!`}
            </div>

            {/* Sparkle background element */}
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Reward calculation breakdown */}
          <div className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 text-left text-xs space-y-1">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>획득 골드</span>
              <span className="text-amber-300 font-bold">
                {baseGold} → {Math.floor(baseGold * activeMultiplier)} Gold
              </span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>카드 파편</span>
              <span className="text-cyan-300 font-bold">
                {baseCardShards} → {Math.floor(baseCardShards * activeMultiplier)} Shards
              </span>
            </div>
          </div>

          {/* Battle Express Pass (700 KRW / 70 SNS) */}
          <div className="w-full p-2.5 bg-gradient-to-r from-amber-950/40 to-yellow-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1">
                <Zap size={13} className="text-amber-400" />
                <span className="text-xs font-black text-amber-300">배틀 익스프레스 패스</span>
              </div>
              <span className="text-[9px] text-slate-400 block">
                {hasExpressPass ? '✅ 활성화됨 (전 보상 3배 고정)' : '보상 3배 상시 수령 (700원 / 70 SNS)'}
              </span>
            </div>
            {!hasExpressPass ? (
              <button
                type="button"
                onClick={handleBuyPass}
                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded active:scale-95 cursor-pointer shadow"
              >
                패스 활성화
              </button>
            ) : (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> 적용중
              </span>
            )}
          </div>

          {/* Claim Button */}
          <button
            type="button"
            disabled={isSpinning || hasClaimed}
            onClick={handleClaim}
            className={`h-12 w-full rounded-xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg transition-all ${
              isSpinning || hasClaimed
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 hover:brightness-105'
            }`}
          >
            <Trophy size={16} />
            <span>{hasClaimed ? '수령 완료!' : `x${activeMultiplier}배 보상 수령하기`}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
