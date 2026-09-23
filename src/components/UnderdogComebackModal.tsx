/**
 * UnderdogComebackModal.tsx - SCR-02-27
 * 3연패 탈락 위기 시 히어로 각성으로 역전 공격력을 폭발시키는 '언더독 라스트 찬스' 및 불사조 토템 팩(1,500원)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Flame, Shield, X, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface UnderdogComebackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateAwakening: () => void;
  onBuyPhoenixTotem: () => void;
}

export const UnderdogComebackModal: React.FC<UnderdogComebackModalProps> = ({
  isOpen,
  onClose,
  onActivateAwakening,
  onBuyPhoenixTotem,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-600 to-amber-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Flame size={16} />
            <span>🔥 언더독 라스트 찬스 각성</span>
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
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 text-3xl shadow-lg">
            🦅
          </div>

          <div>
            <h4 className="text-sm font-black text-white">불굴의 역전 각성 발동 가능!</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              연패의 위기를 기회로! 즉시 히어로의 잠재력을 폭발시켜 이번 매치 전체 공격력을 +30% 상승시킵니다.
            </p>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onActivateAwakening();
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Zap size={16} />
            <span>언더독 분노 각성 활성화 (+30% ATK)</span>
          </button>

          {/* Phoenix Totem Pack (SCR-02-27) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">불굴의 불사조 토템 팩</span>
              <span className="text-[9px] text-slate-400">패배 시 랭크 점수/연승 보호권 5회분</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyPhoenixTotem();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (300 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
