/**
 * FirstClearHallOfFameModal.tsx - SCR-08-30
 * Historical First-Clear Hall of Fame ceremony modal with exclusive emblem
 * and 60-minute limited-time "First Blood Conquest Bundle" special offer.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Clock, Sparkles, Shield, Check, X, Award } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { FirstClearOffer, firstClearSpecialOfferService } from '../services/FirstClearSpecialOfferService';

interface FirstClearHallOfFameModalProps {
  offer: FirstClearOffer;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
  playSfx?: (name: string) => void;
}

export const FirstClearHallOfFameModal: React.FC<FirstClearHallOfFameModalProps> = ({
  offer,
  onClose,
  onPurchaseSuccess,
  playSfx
}) => {
  const [remainingSec, setRemainingSec] = useState<number>(() => {
    return Math.max(0, Math.floor((offer.expiresAt - Date.now()) / 1000));
  });
  const [isPurchased, setIsPurchased] = useState(offer.isPurchased);

  useEffect(() => {
    const timer = setInterval(() => {
      const sec = Math.max(0, Math.floor((offer.expiresAt - Date.now()) / 1000));
      setRemainingSec(sec);
      if (sec <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [offer.expiresAt]);

  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handlePurchase = () => {
    triggerHaptic('heavy');
    playSfx?.('jackpot');
    const success = firstClearSpecialOfferService.purchaseOffer(() => {
      setIsPurchased(true);
      onPurchaseSuccess?.();
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm select-none font-mono">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm rounded-sm bg-stone-900 border-2 border-amber-500/80 p-4 shadow-2xl flex flex-col items-center relative overflow-hidden"
      >
        {/* Background Aura */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Historical First Clear Header */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black tracking-wider uppercase mb-3">
          <Trophy size={12} className="text-amber-400" />
          <span>HISTORICAL FIRST CLEAR</span>
        </div>

        {/* Golden Emblem */}
        <motion.div
          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-full bg-gradient-to-b from-amber-300 to-amber-600 p-1 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-2"
        >
          <div className="w-full h-full rounded-full bg-stone-950 flex flex-col items-center justify-center">
            <Award size={36} className="text-amber-400" />
          </div>
        </motion.div>

        <h2 className="text-base font-black text-amber-200 tracking-tight text-center">
          {offer.stageName} 최초 정복!
        </h2>
        <p className="text-[10px] text-stone-400 text-center mt-0.5 mb-3">
          명예의 전당에 등재되었습니다. 최초 클리어 유저 한정 번들을 확인하세요.
        </p>

        {/* Timed Deal Box */}
        <div className="w-full bg-stone-950/90 border border-amber-500/40 rounded-sm p-3 flex flex-col gap-2 mb-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
            <span className="text-[11px] font-black text-amber-300 flex items-center gap-1">
              <Sparkles size={12} />
              <span>퍼스트 블러드 정복 번들</span>
            </span>
            <span className="flex items-center gap-1 text-[10px] text-rose-400 font-bold">
              <Clock size={11} className="animate-pulse" />
              <span>{timeStr}</span>
            </span>
          </div>

          <div className="space-y-1 text-[10px] text-stone-300">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">SSR 장비 선택권</span>
              <span className="font-bold text-amber-400">1개</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">다이아몬드</span>
              <span className="font-bold text-cyan-300">+{offer.rewards.diamonds}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">SNS 보너스 코인</span>
              <span className="font-bold text-emerald-300">+{offer.rewards.snsCoin} SNS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">전용 한정 칭호</span>
              <span className="font-bold text-purple-300">{offer.rewards.title}</span>
            </div>
          </div>
        </div>

        {/* Purchase Action Button */}
        {isPurchased ? (
          <div className="w-full py-2.5 bg-emerald-900/60 border border-emerald-500/50 rounded-sm flex items-center justify-center gap-1.5 text-emerald-300 text-xs font-bold">
            <Check size={14} />
            <span>수령 및 구매 완료</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePurchase}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase rounded-sm transition-transform active:scale-95 cursor-pointer shadow-lg shadow-amber-500/30 flex items-center justify-center gap-1.5"
          >
            <Sparkles size={14} />
            <span>정복 번들 구매 ({offer.priceWon.toLocaleString()}원 / {offer.snsPrice} SNS)</span>
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-2 text-[10px] text-stone-500 hover:text-stone-400 underline cursor-pointer"
        >
          다음에 받기
        </button>
      </motion.div>
    </div>
  );
};
