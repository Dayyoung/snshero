/**
 * TierPromotionJackpotModal.tsx - SCR-10-15
 * 상위 티어 승급 즉시 100% 당첨 골든 티어 승급 잭팟 룰렛 & 티어 세이프가드 패스 모달
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Crown, Sparkles, ShieldCheck, X, Zap, Gift } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface TierPromotionJackpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  tierName: string;
  onClaimReward: (rewardSns: number) => void;
  onBuySafeguardPass: () => void;
}

export const TierPromotionJackpotModal: React.FC<TierPromotionJackpotModalProps> = ({
  isOpen,
  onClose,
  tierName,
  onClaimReward,
  onBuySafeguardPass,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSpin = () => {
    setIsSpinning(true);
    triggerHaptic('heavy');

    const rewards = [300, 500, 1000, 2000];
    const picked = rewards[Math.floor(Math.random() * rewards.length)];

    setTimeout(() => {
      setIsSpinning(false);
      setSpinResult(picked);
      triggerHaptic('heavy');
      onClaimReward(picked);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-sm">
            <Trophy size={18} />
            <span>🎉 [{tierName}] 승급 달성!</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-white"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl">
            👑
          </div>

          <div>
            <h3 className="text-base font-black text-white">골든 티어 승급 잭팟 룰렛</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              상위 티어 진입 축하 선물! 100% 당첨 잭팟 룰렛을 돌려 최대 2,000 SNS를 획득하세요.
            </p>
          </div>

          {spinResult === null ? (
            <button
              type="button"
              disabled={isSpinning}
              onClick={handleSpin}
              className="h-12 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg"
            >
              <Sparkles size={16} />
              <span>{isSpinning ? '황금 룰렛 회전 중...' : '100% 당첨 룰렛 돌리기 (무료)'}</span>
            </button>
          ) : (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-xs font-black text-emerald-300 animate-bounce">
              ✨ 축하합니다! {spinResult.toLocaleString()} SNS 잭팟 보너스 획득 완료! ✨
            </div>
          )}

          {/* Tier Safeguard Pass (SCR-10-15) */}
          <div className="p-3 bg-slate-900 border border-slate-700 rounded-2xl text-left flex items-start gap-2.5">
            <ShieldCheck size={24} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-xs font-black text-white block">티어 세이프가드 패스 (1,200원)</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                시즌 종료까지 연패로 인한 티어 강등을 3회 완벽 방어!
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('heavy');
                  onBuySafeguardPass();
                }}
                className="mt-2 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black rounded-lg cursor-pointer active:scale-95"
              >
                패스 활성화 (300 SNS)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
