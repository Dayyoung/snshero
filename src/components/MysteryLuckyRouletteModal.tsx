/**
 * MysteryLuckyRouletteModal.tsx - SCR-08-27
 * 승리 시 최대 3배 보상 부스팅 찬스를 제공하는 '행운의 미스터리 럭키 룰렛' 연출 및 연승 버프 연동,
 * 패배 시 패배 원인 분석 덱 케어 가이드와 '원기회복 리벤지 부스터 팩(1,100원 타임딜)' 제안 시스템.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Trophy, ShieldAlert, Zap, X, Clock, Check, HeartCrack } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface MysteryLuckyRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVictory: boolean;
  baseRewardGold: number;
  onApplyMultiplier: (multiplier: number) => void;
  onBuyRevengeBooster: () => void;
}

export const MysteryLuckyRouletteModal: React.FC<MysteryLuckyRouletteModalProps> = ({
  isOpen,
  onClose,
  isVictory,
  baseRewardGold,
  onApplyMultiplier,
  onBuyRevengeBooster,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMultiplier, setSelectedMultiplier] = useState<number | null>(null);
  const [hasBoughtRevenge, setHasBoughtRevenge] = useState(() => {
    return localStorage.getItem('hero_revenge_recovery_pack') === 'purchased';
  });

  const multipliers = [1.5, 2.0, 3.0, 1.2, 2.5];

  useEffect(() => {
    if (!isOpen) {
      setIsSpinning(false);
      setSelectedMultiplier(null);
      return;
    }
    triggerHaptic('medium');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning || selectedMultiplier !== null) return;
    setIsSpinning(true);
    triggerHaptic('heavy');

    setTimeout(() => {
      const outcome = multipliers[Math.floor(Math.random() * multipliers.length)];
      setSelectedMultiplier(outcome);
      setIsSpinning(false);
      triggerHaptic('heavy');
      onApplyMultiplier(outcome);
    }, 1200);
  };

  const handleBuyRevenge = () => {
    triggerHaptic('heavy');
    localStorage.setItem('hero_revenge_recovery_pack', 'purchased');
    setHasBoughtRevenge(true);
    onBuyRevengeBooster();
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
        <div
          className={`p-3.5 flex items-center justify-between font-black text-xs ${
            isVictory
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950'
              : 'bg-gradient-to-r from-rose-700 to-amber-600 text-white'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {isVictory ? <Sparkles size={16} /> : <ShieldAlert size={16} />}
            <span>
              {isVictory ? '[ 행운의 미스터리 럭키 룰렛 ]' : '[ 패배 극복 덱 케어 리벤지 팩 ]'}
            </span>
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
          {isVictory ? (
            /* Victory: Mystery Lucky Roulette (Up to 3x) */
            <>
              <div className="text-4xl animate-bounce">🎰</div>
              <div>
                <h3 className="text-sm font-black text-white">최대 3배 보상 부스팅 찬스!</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  룰렛을 회전시켜 획득 골드를 즉시 증폭하세요.
                </p>
              </div>

              {/* Multiplier result or wheel visual */}
              <div className="w-full bg-slate-900 border border-amber-500/50 rounded-2xl p-4 flex flex-col items-center justify-center">
                <div className="text-2xl font-black text-amber-400">
                  {isSpinning
                    ? '룰렛 회전 중...'
                    : selectedMultiplier
                    ? `x${selectedMultiplier}배 당첨!`
                    : '준비 완료'}
                </div>
                {selectedMultiplier && (
                  <div className="text-xs text-emerald-400 font-bold mt-1">
                    골드: {baseRewardGold} → {Math.floor(baseRewardGold * selectedMultiplier)} Gold
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={isSpinning || selectedMultiplier !== null}
                onClick={handleSpin}
                className={`h-12 w-full rounded-xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg ${
                  isSpinning || selectedMultiplier !== null
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-105'
                }`}
              >
                <Zap size={16} />
                <span>
                  {selectedMultiplier ? '부스팅 적용 완료' : '미스터리 룰렛 돌리기'}
                </span>
              </button>
            </>
          ) : (
            /* Defeat: Care Guide & Revenge Booster Pack */
            <>
              <div className="text-4xl">❤️‍🩹</div>
              <div>
                <h3 className="text-sm font-black text-white">아쉬운 패배를 역전의 발판으로!</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  상대방의 상성 카운터에 취약했습니다.
                  <br />
                  속성 밸런스 점검 및 원기회복 버프로 재도전하세요.
                </p>
              </div>

              {/* Revenge Booster Pack (1,100 KRW / 110 SNS) */}
              <div className="w-full p-3.5 bg-gradient-to-b from-amber-950/40 to-slate-900 border border-amber-500/50 rounded-2xl text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                    <Zap size={14} />
                    원기회복 리벤지 부스터 팩
                  </span>
                  <span className="text-[9px] text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                    패배 직후 한정 타임딜
                  </span>
                </div>

                <p className="text-[10px] text-slate-300 leading-tight">
                  다음 3판 동안 전 스탯 +20% 상승 버프 + 패배 시 랭크 보호권 1매 증정.
                </p>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs font-black text-amber-400 block">1,100원 (또는 110 SNS)</span>
                    <span className="text-[9px] text-slate-500 line-through">정가 4,000원</span>
                  </div>

                  {hasBoughtRevenge ? (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <Check size={14} /> 적용 완료
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBuyRevenge}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black rounded-xl active:scale-95 cursor-pointer shadow"
                    >
                      구매하기
                    </button>
                  )}
                </div>
              </div>
            </>
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
