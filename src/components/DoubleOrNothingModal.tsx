/**
 * DoubleOrNothingModal.tsx - SCR-08-18
 * 융합 성공 직후 결과 카드를 걸고 50% 확률로 상위 등급으로 진화시키는 '더블 오어 낫싱' 룰렛 및 안심 보험 젬(800원)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Flame, Shield, ArrowUpRight, Sparkles, X, Check, RotateCw } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface DoubleOrNothingModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultCardName: string;
  onDoubleOrNothing: () => void;
  onBuyInsuranceGem: () => void;
}

export const DoubleOrNothingModal: React.FC<DoubleOrNothingModalProps> = ({
  isOpen,
  onClose,
  resultCardName,
  onDoubleOrNothing,
  onBuyInsuranceGem,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-rose-500 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Flame size={16} className="text-yellow-300" />
            <span>🔥 더블 오어 낫싱 (50% 초월 진화)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div>
            <h4 className="text-sm font-black text-white">{resultCardName} 베팅</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              50% 확률로 한 단계 상위 등급(UR/신화)으로 초월 도약! 실패 시 카드가 소멸됩니다.
            </p>
          </div>

          {/* Wheel Simulation */}
          <div className="w-24 h-24 rounded-full border-4 border-dashed border-rose-500 flex items-center justify-center bg-slate-900 shadow-inner">
            <motion.div
              animate={{ rotate: isSpinning ? 1440 : 0 }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              className="text-2xl"
            >
              🎲
            </motion.div>
          </div>

          {/* 48px Gamble Action Button */}
          <button
            type="button"
            disabled={isSpinning}
            onClick={() => {
              triggerHaptic('heavy');
              setIsSpinning(true);
              setTimeout(() => {
                setIsSpinning(false);
                onDoubleOrNothing();
                onClose();
              }, 2000);
            }}
            className="h-12 w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <ArrowUpRight size={16} />
            <span>50% 초월 베팅 도전!</span>
          </button>

          {/* Insurance Gem (SCR-08-18) */}
          <div className="w-full p-2.5 bg-purple-950/40 border border-purple-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-purple-300 block">안심 보험 젬 (800원)</span>
              <span className="text-[9px] text-slate-400">실패 시에도 원래 카드를 100% 보존</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyInsuranceGem();
                onClose();
              }}
              className="px-2.5 py-1 bg-purple-500 hover:bg-purple-400 text-white text-[10px] font-bold rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (160 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
