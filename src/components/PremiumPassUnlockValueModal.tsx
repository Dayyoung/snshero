/**
 * PremiumPassUnlockValueModal.tsx - SCR-10-27
 * 프리미엄 트랙 미구매 유저가 패스 레벨업 시 '지금 잠금 해제 시 즉시 획득 가능한 누적 프리미엄 보상 총액(다이아 환산 가치)'
 * 실시간 카운팅 팝업 노출 및 시즌 패스 전용 '반값 프리미엄 얼리버드/라스트 스퍼트 패스권' 연동.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Crown, Gift, Zap, X, Check, LockOpen } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface PremiumPassUnlockValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  unlockedRewardSummary: {
    diamonds: number;
    gold: number;
    rareGachaTickets: number;
    exclusiveSkinName: string;
  };
  onPurchasePremiumPass: () => void;
}

export const PremiumPassUnlockValueModal: React.FC<PremiumPassUnlockValueModalProps> = ({
  isOpen,
  onClose,
  currentLevel,
  unlockedRewardSummary,
  onPurchasePremiumPass,
}) => {
  const [isPurchased, setIsPurchased] = useState(() => {
    return localStorage.getItem('hero_premium_pass_unlocked') === 'true';
  });

  useEffect(() => {
    if (!isOpen) return;
    triggerHaptic('medium');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBuy = () => {
    triggerHaptic('heavy');
    localStorage.setItem('hero_premium_pass_unlocked', 'true');
    setIsPurchased(true);
    onPurchasePremiumPass();
  };

  const totalValueDiamonds =
    unlockedRewardSummary.diamonds +
    Math.floor(unlockedRewardSummary.gold / 10) +
    unlockedRewardSummary.rareGachaTickets * 300;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none overflow-hidden">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center"
      >
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 flex items-center justify-between font-black text-xs">
          <div className="flex items-center gap-1.5">
            <Crown size={16} />
            <span>[ 프리미엄 패스 누적 보상 대방출 ]</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded bg-black/20 flex items-center justify-center cursor-pointer active:scale-95"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-4xl shadow animate-bounce">
            👑
          </div>

          <div>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
              현재 달성도: Lv.{currentLevel}
            </span>
            <h3 className="text-sm font-black text-white mt-1.5">
              지금 잠금 해제 시 즉시 일괄 수령!
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5">
              지금까지 지나친 모든 프리미엄 보상이 한 번에 쏟아집니다.
            </p>
          </div>

          {/* Pending Rewards Value Grid */}
          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-left">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                💎 다이아 보상
              </span>
              <span className="font-black text-cyan-300">+{unlockedRewardSummary.diamonds}개</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                🎫 소환 티켓
              </span>
              <span className="font-black text-amber-300">+{unlockedRewardSummary.rareGachaTickets}장</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                👗 한정판 스킨
              </span>
              <span className="font-black text-rose-300 truncate max-w-[120px]">
                {unlockedRewardSummary.exclusiveSkinName}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold">환산 총 가치</span>
              <span className="font-black text-amber-400 text-sm">{totalValueDiamonds} 다이아 상당</span>
            </div>
          </div>

          {/* Early Bird Half-Price Offer Button (52px) */}
          {isPurchased ? (
            <div className="w-full p-3 bg-emerald-950/40 border border-emerald-500/60 rounded-xl text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
              <Check size={16} />
              <span>프리미엄 패스 활성화 완료!</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleBuy}
              className="h-13 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-between px-4 cursor-pointer active:scale-95 shadow-xl hover:brightness-105"
            >
              <div className="flex items-center gap-1.5 text-left">
                <LockOpen size={16} />
                <div>
                  <span className="block text-xs font-black">반값 얼리버드 패스권 해금</span>
                  <span className="block text-[9px] opacity-80">50% 할인 타임 세일</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black block">5,500원 (또는 550 SNS)</span>
                <span className="text-[9px] line-through opacity-70">11,000원</span>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl active:scale-95 cursor-pointer border border-slate-800"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
};
