/**
 * VictoryCoinTossModal.tsx - SCR-02-24
 * 승리 직후 앞/뒷면을 맞춰 골드를 2~4배로 불리는 '빅토리 코인 토스 럭키 찬스' 및 연승 복리 부스터 티켓(500원)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Coins, Sparkles, X, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface VictoryCoinTossModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseGold: number;
  onDoubleOrNothing: (guess: 'heads' | 'tails') => void;
  onBuyWinStreakBooster: () => void;
}

export const VictoryCoinTossModal: React.FC<VictoryCoinTossModalProps> = ({
  isOpen,
  onClose,
  baseGold,
  onDoubleOrNothing,
  onBuyWinStreakBooster,
}) => {
  const [isFlipping, setIsFlipping] = useState(false);

  if (!isOpen) return null;

  const handleGuess = (guess: 'heads' | 'tails') => {
    setIsFlipping(true);
    triggerHaptic('medium');
    setTimeout(() => {
      setIsFlipping(false);
      onDoubleOrNothing(guess);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Coins size={16} />
            <span>🪙 빅토리 코인 토스</span>
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
            animate={isFlipping ? { rotateY: 1440, scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-full bg-amber-400 border-4 border-yellow-300 flex items-center justify-center text-slate-950 text-4xl shadow-xl font-black"
          >
            👑
          </motion.div>

          <div>
            <div className="text-[10px] text-slate-400">
              현재 획득 골드: <span className="text-amber-400 font-bold">{baseGold} G</span>
            </div>
            <h4 className="text-sm font-black text-white mt-1">앞면 or 뒷면을 맞추면 2배!</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              승리 찬스! 앞/뒷면을 선택해 승리 보상을 2배({baseGold * 2}G)로 불려보세요.
            </p>
          </div>

          {/* 48px Action Buttons */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              type="button"
              disabled={isFlipping}
              onClick={() => handleGuess('heads')}
              className="h-12 bg-slate-900 hover:bg-slate-800 border border-amber-400/80 rounded-xl text-amber-300 font-black text-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow"
            >
              <span>앞면 (👑)</span>
            </button>
            <button
              type="button"
              disabled={isFlipping}
              onClick={() => handleGuess('tails')}
              className="h-12 bg-slate-900 hover:bg-slate-800 border border-amber-400/80 rounded-xl text-amber-300 font-black text-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow"
            >
              <span>뒷면 (⚔️)</span>
            </button>
          </div>

          {/* Win Streak Booster (SCR-02-24) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">연승 복리 부스터 티켓</span>
              <span className="text-[9px] text-slate-400">연속 승리 시 골드 배당 3배</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyWinStreakBooster();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (100 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
