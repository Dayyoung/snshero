/**
 * SwipeConfirmBetSheet.tsx - SCR-07-23
 * 위로 스와이프 시 합산 배당률이 즉시 계산/확정되는 원터치 제스처 바텀시트
 */

import React from 'react';
import { motion } from 'motion/react';
import { ArrowUp, X, Check, DollarSign } from 'lucide-react';
import { ParlaySelection } from './ParlayBettingSlip';
import { triggerHaptic } from '../lib/haptic';

interface SwipeConfirmBetSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selections: ParlaySelection[];
  betAmount: number;
  onConfirmBet: () => void;
}

export const SwipeConfirmBetSheet: React.FC<SwipeConfirmBetSheetProps> = ({
  isOpen,
  onClose,
  selections,
  betAmount,
  onConfirmBet,
}) => {
  if (!isOpen) return null;

  const totalOdds = selections.reduce((acc, s) => acc * s.odds, 1);
  const potentialPayout = Math.round(betAmount * totalOdds);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col justify-end font-mono select-none">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-slate-950 border-t-2 border-amber-400 rounded-t-3xl p-5 max-w-lg mx-auto w-full flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white">파를레이 조합 최종 확인</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
          {selections.map((s, idx) => (
            <div
              key={idx}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
            >
              <span className="text-white font-bold">{s.matchTitle}</span>
              <span className="text-amber-400 font-black">{s.odds.toFixed(2)}x</span>
            </div>
          ))}
        </div>

        <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block">베팅 {betAmount} G</span>
            <span className="text-xs font-black text-white">예상 적중 수익금</span>
          </div>
          <span className="text-base font-black text-amber-400">{potentialPayout.toLocaleString()} G</span>
        </div>

        <motion.button
          drag="y"
          dragConstraints={{ top: -50, bottom: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.y < -30) {
              triggerHaptic('heavy');
              onConfirmBet();
              onClose();
            }
          }}
          className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-grab active:cursor-grabbing shadow-lg"
        >
          <ArrowUp size={16} />
          <span>위로 밀어 올려 베팅 확정</span>
        </motion.button>
      </motion.div>
    </div>
  );
};
