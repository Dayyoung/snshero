/**
 * SuperBowlJackpotModal.tsx - SCR-07-21
 * 실패 베팅 코인의 5%가 누적되는 '골든 슈퍼볼 메가 잭팟 풀' 및 역배 적중 상금 3배 '언더독 미라클 부스터(990원)'
 */

import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Flame, Sparkles, X, Check, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface SuperBowlJackpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  accumulatedJackpot: number;
  onParticipateJackpot: () => void;
  onBuyUnderdogBooster: () => void;
}

export const SuperBowlJackpotModal: React.FC<SuperBowlJackpotModalProps> = ({
  isOpen,
  onClose,
  accumulatedJackpot,
  onParticipateJackpot,
  onBuyUnderdogBooster,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-yellow-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Trophy size={16} />
            <span>🏆 골든 슈퍼볼 메가 잭팟</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-slate-950 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center text-yellow-400 text-3xl shadow-lg">
            👑
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-bold">현재 총 누적 메가 잭팟 풀</span>
            <h4 className="text-xl font-black text-yellow-400 mt-0.5">
              {accumulatedJackpot.toLocaleString()} SNS
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">
              전체 실패 베팅 코인의 5%가 실시간으로 적립되며, 결승전 단일 예측 1위에게 전액 지급됩니다!
            </p>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onParticipateJackpot();
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Sparkles size={16} />
            <span>잭팟 풀 추첨 응모하기</span>
          </button>

          {/* Underdog Booster (SCR-07-21) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">언더독 미라클 부스터</span>
              <span className="text-[9px] text-slate-400">역배(5배 이상) 적중 시 보상 300% 지급</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyUnderdogBooster();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (200 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
