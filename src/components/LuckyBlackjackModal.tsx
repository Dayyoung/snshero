/**
 * LuckyBlackjackModal.tsx - SCR-04-24
 * 소환 즉시 3장 중 1장을 뽑아 최대 5배 환급받는 '행운의 블랙잭 미니 찬스' 및 블랙잭 조커 팩(700원)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Spade, Sparkles, X, Check, Gift } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface LuckyBlackjackModalProps {
  isOpen: boolean;
  onClose: () => void;
  refundBaseAmount: number;
  onSelectCard: (multiplier: number) => void;
  onBuyJokerPack: () => void;
}

export const LuckyBlackjackModal: React.FC<LuckyBlackjackModalProps> = ({
  isOpen,
  onClose,
  refundBaseAmount,
  onSelectCard,
  onBuyJokerPack,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const cards = [
    { label: '2배 환급', mult: 2 },
    { label: '5배 잭팟!', mult: 5 },
    { label: '1.5배 환급', mult: 1.5 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Spade size={16} />
            <span>🃏 행운의 블랙잭 미니 찬스</span>
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
          <div>
            <h4 className="text-sm font-black text-white">카드 1장을 골라 캐시백을 받으세요!</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              기본 보너스 {refundBaseAmount} 다이아를 최대 5배까지 불릴 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full">
            {cards.map((c, i) => (
              <motion.div
                key={i}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (selectedIdx !== null) return;
                  setSelectedIdx(i);
                  triggerHaptic('heavy');
                  setTimeout(() => {
                    onSelectCard(c.mult);
                    onClose();
                  }, 1200);
                }}
                className={`h-28 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition shadow-lg ${
                  selectedIdx === i
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-amber-500/50'
                }`}
              >
                <span className="text-2xl mb-1">{selectedIdx === i ? '✨' : '🂠'}</span>
                <span className="text-[11px] font-black">{selectedIdx === i ? c.label : '선택'}</span>
              </motion.div>
            ))}
          </div>

          {/* Blackjack Joker Pack (SCR-04-24) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">블랙잭 조커 팩</span>
              <span className="text-[9px] text-slate-400">결과 불만족 시 무조건 5배 역전</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyJokerPack();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (140 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
