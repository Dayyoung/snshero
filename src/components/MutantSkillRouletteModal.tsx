/**
 * MutantSkillRouletteModal.tsx - SCR-08-24
 * 융합 완료 시 10% 확률로 히든 패시브를 부여하는 '돌연변이 스킬 룰렛' 및 고대 연금술사의 각성 축복 앰플(1,200원)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Dna, Sparkles, X, Check, Flame } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface MutantSkillRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpinRoulette: () => void;
  onBuyBlessingAmpoule: () => void;
}

export const MutantSkillRouletteModal: React.FC<MutantSkillRouletteModalProps> = ({
  isOpen,
  onClose,
  onSpinRoulette,
  onBuyBlessingAmpoule,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-emerald-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Dna size={16} />
            <span>🧬 돌연변이 스킬 룰렛</span>
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
          <motion.div
            animate={isSpinning ? { rotate: 1800 } : {}}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="w-24 h-24 rounded-full border-4 border-emerald-400 bg-emerald-950/60 flex items-center justify-center text-4xl shadow-xl"
          >
            🌀
          </motion.div>

          <div>
            <h4 className="text-sm font-black text-white">돌연변이 히든 패시브 발동!</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              융합 진화 시 10% 확률로 전설 돌연변이 스킬(흡혈, 부활, 무적)이 추가 부여됩니다.
            </p>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            disabled={isSpinning}
            onClick={() => {
              setIsSpinning(true);
              triggerHaptic('heavy');
              setTimeout(() => {
                setIsSpinning(false);
                onSpinRoulette();
                onClose();
              }, 1500);
            }}
            className="h-12 w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Dna size={16} />
            <span>돌연변이 룰렛 회전하기</span>
          </button>

          {/* Awakening Blessing Ampoule (SCR-08-24) */}
          <div className="w-full p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-emerald-300 block">고대 연금술사의 각성 축복 앰플</span>
              <span className="text-[9px] text-slate-400">돌연변이 히든 스킬 출현율 100% 확정</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyBlessingAmpoule();
                onClose();
              }}
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (240 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
