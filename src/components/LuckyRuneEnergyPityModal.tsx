/**
 * LuckyRuneEnergyPityModal.tsx - SCR-04-30
 * 30연차 이상 SSR 미등장 시 발동하는 '행운의 룬 에너지' 충전 게이지 시스템 도입(SR 2장 확정 및 마일리지 1.5배 적립),
 * 픽업 종료 24시간 전 '천장 직행 라스트 찬스 패키지(3,300원 타임딜)' 스마트 연동.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, Sparkles, Clock, Gift, X, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface LuckyRuneEnergyPityModalProps {
  isOpen: boolean;
  onClose: () => void;
  consecutiveNonSSRCount: number; // e.g. 30
  maxPityCount: number; // e.g. 50
  hoursRemainingPickup: number; // e.g. 18
  onBuyLastChancePackage: () => void;
}

export const LuckyRuneEnergyPityModal: React.FC<LuckyRuneEnergyPityModalProps> = ({
  isOpen,
  onClose,
  consecutiveNonSSRCount,
  maxPityCount,
  hoursRemainingPickup,
  onBuyLastChancePackage,
}) => {
  const [hasBoughtLastChance, setHasBoughtLastChance] = useState(() => {
    return localStorage.getItem('hero_pity_last_chance_pack') === 'purchased';
  });

  useEffect(() => {
    if (!isOpen) return;
    triggerHaptic('heavy');
  }, [isOpen]);

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.floor((consecutiveNonSSRCount / maxPityCount) * 100));
  const isRuneEnergyActive = consecutiveNonSSRCount >= 30;

  const handleBuy = () => {
    triggerHaptic('heavy');
    localStorage.setItem('hero_pity_last_chance_pack', 'purchased');
    setHasBoughtLastChance(true);
    onBuyLastChancePackage();
  };

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
            <Zap size={16} />
            <span>[ 행운의 룬 에너지 & 천장 시스템 ]</span>
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
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(245,158,11,0.5)]">
            ⚡
          </div>

          <div>
            <h3 className="text-sm font-black text-white">
              {isRuneEnergyActive ? '행운의 룬 에너지가 충전되었습니다!' : '소환 마일리지 진행 현황'}
            </h3>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              연속 미등장 {consecutiveNonSSRCount}회 누적 ({maxPityCount}회 도달 시 SSR 100% 확정)
              <br />
              <strong className="text-amber-300">현재 혜택: SR 2장 보장 + 마일리지 1.5배</strong>
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full space-y-1 text-left">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>룬 에너지 충전률</span>
              <span className="text-amber-400 font-black">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Last Chance Package (3,300 KRW / 330 SNS) if < 24 hrs */}
          {hoursRemainingPickup <= 24 && (
            <div className="w-full p-3 bg-gradient-to-b from-rose-950/40 to-slate-900 border border-rose-500/40 rounded-xl text-left space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-300 flex items-center gap-1">
                  <Clock size={13} /> 천장 직행 라스트 찬스 패키지
                </span>
                <span className="text-[9px] text-rose-400 bg-rose-950 px-1.5 py-0.2 rounded border border-rose-500/30 font-bold">
                  종료 {hoursRemainingPickup}시간 전
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                소환권 15장 + 픽업 마일리지 20P 즉시 지급 (3,300원 / 330 SNS)
              </p>
              <div className="flex justify-end pt-1">
                {hasBoughtLastChance ? (
                  <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <Check size={14} /> 구매 완료
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleBuy}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-lg active:scale-95 cursor-pointer shadow"
                  >
                    구매하기
                  </button>
                )}
              </div>
            </div>
          )}

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
