/**
 * GoldbackPaybackModal.tsx - SCR-05-21
 * 일일 거래액 달성 럭키 룰렛권 및 7일간 수수료 0% + 1% 다이아 페이백 'VIP 트레이더 무제한 프리 패스(2,500원)'
 */

import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Sparkles, Percent, X, Check, Gem, Disc } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface GoldbackPaybackModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyTradedAmount: number;
  onSpinRoulette: () => void;
  onBuyVipTraderPass: () => void;
}

export const GoldbackPaybackModal: React.FC<GoldbackPaybackModalProps> = ({
  isOpen,
  onClose,
  dailyTradedAmount,
  onSpinRoulette,
  onBuyVipTraderPass,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Trophy size={16} />
            <span>💎 VIP 트레이더 페이백 센터</span>
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
            🎰
          </div>

          <div>
            <h4 className="text-sm font-black text-white">일일 거래액 {dailyTradedAmount.toLocaleString()} SNS 달성!</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              목표 거래액 달성으로 무료 럭키 페이백 룰렛권이 지급되었습니다.
            </p>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onSpinRoulette();
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Disc size={16} />
            <span>럭키 페이백 룰렛 돌리기</span>
          </button>

          {/* VIP Trader Pass (SCR-05-21) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">VIP 트레이더 무제한 프리 패스</span>
              <span className="text-[9px] text-slate-400">7일간 수수료 0% + 거래액 1% 페이백</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyVipTraderPass();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (400 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
