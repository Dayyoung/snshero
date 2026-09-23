/**
 * JackpotGoldenRainModal.tsx - SCR-04-27
 * SSR 2장 이상 초대박 소환 시 전 서버에 10분간 황금비가 내리며 무료 다이아 복주머니를 선물하는 소셜 이벤트 도입 및
 * 당첨자 전용 '잭팟 기념 슈퍼 리치 팩(2,200원)' 연동.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Gift, Crown, Clock, Check, X, Coins } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface JackpotGoldenRainModalProps {
  isOpen: boolean;
  onClose: () => void;
  ssrCards: { name: string; grade: string }[];
  onClaimLuckyPouch: () => void;
  onBuySuperRichPack: () => void;
}

export const JackpotGoldenRainModal: React.FC<JackpotGoldenRainModalProps> = ({
  isOpen,
  onClose,
  ssrCards,
  onClaimLuckyPouch,
  onBuySuperRichPack,
}) => {
  const [hasClaimedPouch, setHasClaimedPouch] = useState(false);
  const [hasBoughtPack, setHasBoughtPack] = useState(() => {
    return localStorage.getItem('hero_jackpot_super_rich_pack') === 'purchased';
  });
  const [secondsRemaining, setSecondsRemaining] = useState(600); // 10 mins = 600s

  useEffect(() => {
    if (!isOpen) return;
    triggerHaptic('heavy');

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timerStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const handleClaim = () => {
    triggerHaptic('medium');
    setHasClaimedPouch(true);
    onClaimLuckyPouch();
  };

  const handleBuy = () => {
    triggerHaptic('heavy');
    localStorage.setItem('hero_jackpot_super_rich_pack', 'purchased');
    setHasBoughtPack(true);
    onBuySuperRichPack();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none overflow-hidden">
      {/* Golden Rain Falling particles simulation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-yellow-300 text-lg animate-bounce"
            style={{
              left: `${(i * 5) % 100}%`,
              top: `${(i * 7) % 80}%`,
              animationDuration: `${1 + (i % 3) * 0.5}s`,
            }}
          >
            ✨
          </div>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-950 border-2 border-yellow-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center relative z-10"
      >
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 flex items-center justify-between font-black text-xs">
          <div className="flex items-center gap-1.5">
            <Crown size={16} />
            <span>[ 전 서버 잭팟! 황금비 페스티벌 ]</span>
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
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border-2 border-yellow-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(250,204,21,0.5)] animate-pulse">
            🎉
          </div>

          <div>
            <h3 className="text-sm font-black text-white">
              더블 SSR 이상 잭팟 소환 달성!
            </h3>
            <p className="text-[11px] text-amber-300 mt-1">
              {ssrCards.map((c) => c.name).join(', ')} 획득!
              <br />
              전 서버에 10분간 황금비가 쏟아집니다.
            </p>
          </div>

          {/* Free Diamond Lucky Pouch */}
          <div className="w-full p-3 bg-slate-900 border border-yellow-500/40 rounded-xl flex items-center justify-between text-left">
            <div>
              <div className="flex items-center gap-1 text-xs font-black text-yellow-300">
                <Gift size={13} />
                <span>무료 다이아 복주머니</span>
              </div>
              <span className="text-[10px] text-slate-400">축하 보너스 +100 다이아 즉시 수령</span>
            </div>
            {hasClaimedPouch ? (
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <Check size={14} /> 수령됨
              </span>
            ) : (
              <button
                type="button"
                onClick={handleClaim}
                className="px-2.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-[10px] font-black rounded active:scale-95 cursor-pointer shadow"
              >
                받기
              </button>
            )}
          </div>

          {/* Super Rich Pack (2,200 KRW / 220 SNS) */}
          <div className="w-full p-3.5 bg-gradient-to-b from-amber-950/40 to-slate-900 border border-amber-500/60 rounded-2xl text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                <Coins size={14} />
                잭팟 기념 슈퍼 리치 팩
              </span>
              <div className="flex items-center gap-1 text-[9px] text-rose-400 font-bold bg-rose-950/50 px-2 py-0.5 rounded border border-rose-500/30">
                <Clock size={10} />
                <span>{timerStr}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-300 leading-tight">
              SSR 한계돌파석 2개 + 10연차 소환권 2매 + 골드 10만 개가 담긴 파격 85% 할인 팩.
            </p>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-black text-amber-400 block">2,200원 (또는 220 SNS)</span>
                <span className="text-[9px] text-slate-500 line-through">정가 14,000원</span>
              </div>

              {hasBoughtPack ? (
                <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black rounded-lg flex items-center gap-1">
                  <Check size={14} />
                  <span>구매 완료</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleBuy}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-105 text-slate-950 text-xs font-black rounded-xl active:scale-95 cursor-pointer shadow-md"
                >
                  구매하기
                </button>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl active:scale-95 cursor-pointer border border-slate-800"
          >
            확인
          </button>
        </div>
      </motion.div>
    </div>
  );
};
