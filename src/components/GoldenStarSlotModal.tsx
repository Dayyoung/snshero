/**
 * GoldenStarSlotModal.tsx - SCR-11-24
 * 주간 100% 달성 시 레버를 당겨 최대 777배 다이아를 노리는 '골든 스타 슬롯머신' 및 주간 럭키 올패스 부스터(1,200원)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, Sparkles, X, Check, Award } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface GoldenStarSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpinSlot: () => void;
  onBuyLuckyBooster: () => void;
}

export const GoldenStarSlotModal: React.FC<GoldenStarSlotModalProps> = ({
  isOpen,
  onClose,
  onSpinSlot,
  onBuyLuckyBooster,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [slotSymbols, setSlotSymbols] = useState(['⭐', '7️⃣', '💎']);

  if (!isOpen) return null;

  const pullLever = () => {
    setIsSpinning(true);
    triggerHaptic('heavy');
    setTimeout(() => {
      setSlotSymbols(['7️⃣', '7️⃣', '7️⃣']);
      setIsSpinning(false);
      onSpinSlot();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Star size={16} />
            <span>🎰 골든 스타 슬롯머신</span>
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
          <div className="flex items-center justify-center gap-2 w-full">
            {slotSymbols.map((sym, idx) => (
              <motion.div
                key={idx}
                animate={isSpinning ? { y: [-20, 20, -20] } : {}}
                transition={{ repeat: Infinity, duration: 0.2 }}
                className="w-16 h-20 bg-slate-900 border-2 border-amber-400 rounded-2xl flex items-center justify-center text-3xl shadow-inner"
              >
                {sym}
              </motion.div>
            ))}
          </div>

          <div>
            <h4 className="text-sm font-black text-white">주간 100% 올클리어 축하 슬롯</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              777 잭팟 달성 시 기본 다이아의 777배 대박 보상이 즉시 터집니다!
            </p>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            disabled={isSpinning}
            onClick={pullLever}
            className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Star size={16} />
            <span>슬롯 레버 당기기!</span>
          </button>

          {/* Lucky Booster (SCR-11-24) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">주간 럭키 올패스 부스터</span>
              <span className="text-[9px] text-slate-400">777 잭팟 당첨 확률 3배 보정</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyLuckyBooster();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (240 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
