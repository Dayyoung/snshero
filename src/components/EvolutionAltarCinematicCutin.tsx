/**
 * EvolutionAltarCinematicCutin.tsx - SCR-03-27
 * 진화 성공 시 전용 오라가 폭발하는 '진화의 제단 풀스크린 시네마틱 컷인' 연출 및
 * 진화 직후 30분 한정 '신화 각성 축하 점핑 팩(1,500원)' 플래시 세일 연동.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Flame, Clock, Award, Shield, X, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface EvolutionAltarCinematicCutinProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  cardImage?: string;
  prevStats: { hp: number; atk: number };
  newStats: { hp: number; atk: number };
  onBuyJumpingPack: () => void;
}

export const EvolutionAltarCinematicCutin: React.FC<EvolutionAltarCinematicCutinProps> = ({
  isOpen,
  onClose,
  cardName,
  cardImage,
  prevStats,
  newStats,
  onBuyJumpingPack,
}) => {
  const [phase, setPhase] = useState<'cinematic' | 'offer'>('cinematic');
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins = 1800s
  const [hasBought, setHasBought] = useState(() => {
    return localStorage.getItem(`hero_evolution_jumping_pack_${cardName}`) === 'purchased';
  });

  useEffect(() => {
    if (!isOpen) {
      setPhase('cinematic');
      return;
    }

    triggerHaptic('heavy');

    // 2.2초 후 시네마틱에서 오퍼 화면으로 자동 전환
    const timer = setTimeout(() => {
      setPhase('offer');
      triggerHaptic('medium');
    }, 2200);

    return () => clearTimeout(timer);
  }, [isOpen, cardName]);

  // 30분 카운트다운
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handlePurchase = () => {
    triggerHaptic('heavy');
    localStorage.setItem(`hero_evolution_jumping_pack_${cardName}`, 'purchased');
    setHasBought(true);
    onBuyJumpingPack();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 font-mono select-none overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'cinematic' ? (
          /* Phase 1: Fullscreen Aura Explosion Cinematic */
          <motion.div
            key="cinematic"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.15, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center text-center relative"
          >
            {/* Pulsing Aura Rings */}
            <div className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-yellow-400 blur-2xl opacity-40 animate-ping" />
            <div className="relative w-36 h-36 rounded-3xl bg-slate-950 border-4 border-amber-400 flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(251,191,36,0.6)]">
              {cardImage ? (
                <img
                  src={cardImage}
                  alt={cardName}
                  className="w-full h-full object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                '⚡'
              )}
            </div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 tracking-wider"
            >
              MYTHIC AWAKENED!
            </motion.h2>
            <p className="text-xs text-amber-300/80 font-bold mt-1">
              [ {cardName} ] 신화 각성 완료!
            </p>
          </motion.div>
        ) : (
          /* Phase 2: Evolution Stats + Flash Jumping Pack */
          <motion.div
            key="offer"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center"
          >
            {/* Header */}
            <div className="p-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 flex items-center justify-between font-black text-xs">
              <div className="flex items-center gap-1.5">
                <Flame size={16} />
                <span>[ 진화의 제단: 신화 각성 성공 ]</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded bg-black/20 flex items-center justify-center text-slate-950 active:scale-95 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Stat Boost Breakdown */}
            <div className="p-5 flex flex-col items-center gap-4">
              <div className="text-xs text-slate-300 font-bold">
                축하합니다! 카드의 잠재 스탯이 비약적으로 개화되었습니다.
              </div>

              <div className="w-full grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400">생명력 (HP)</div>
                  <div className="text-sm font-black text-emerald-400 mt-1">
                    {prevStats.hp} → <span className="text-white">{newStats.hp}</span>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-bold">
                    (+{newStats.hp - prevStats.hp})
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400">공격력 (ATK)</div>
                  <div className="text-sm font-black text-rose-400 mt-1">
                    {prevStats.atk} → <span className="text-white">{newStats.atk}</span>
                  </div>
                  <span className="text-[9px] text-rose-400 font-bold">
                    (+{newStats.atk - prevStats.atk})
                  </span>
                </div>
              </div>

              {/* 30-min Flash Jumping Pack Offer */}
              <div className="w-full bg-gradient-to-b from-amber-950/40 to-slate-900 border border-amber-500/50 rounded-2xl p-3.5 text-left relative overflow-hidden">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1 text-amber-300 font-black text-xs">
                    <Sparkles size={14} />
                    <span>신화 각성 축하 점핑 팩</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-rose-400 font-bold bg-rose-950/50 px-2 py-0.5 rounded border border-rose-500/30">
                    <Clock size={11} />
                    <span>{timeFormatted} 남음</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-300 leading-relaxed mb-3">
                  진화 직후 30분 한정 특가! 신화 룬 10개 + 다이아 500개 + 즉시 만렙 한계돌파석이 포함된 스타터 번들.
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-amber-400 block">1,500원 (또는 150 SNS)</span>
                    <span className="text-[9px] text-slate-400 line-through">정가 7,500원 (80% OFF)</span>
                  </div>

                  {hasBought ? (
                    <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black rounded-lg flex items-center gap-1">
                      <Check size={14} />
                      <span>구매 완료</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePurchase}
                      className="px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-105 text-slate-950 text-xs font-black rounded-xl active:scale-95 cursor-pointer shadow-md"
                    >
                      즉시 구매하기
                    </button>
                  )}
                </div>
              </div>

              {/* Close / Confirm button */}
              <button
                type="button"
                onClick={onClose}
                className="h-11 w-full bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs rounded-xl active:scale-95 cursor-pointer border border-slate-800"
              >
                닫기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
