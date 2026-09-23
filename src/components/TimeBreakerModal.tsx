/**
 * TimeBreakerModal.tsx - SCR-07-24
 * 마감 30초 전 베팅을 긴급 번복/수정하는 '골든 타임 브레이커 연장권(500원)' 및 올인 세이프티 번들(1,500원)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Hourglass, Shield, AlertTriangle, X, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface TimeBreakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingSeconds: number;
  onBuyTimeBreaker: () => void;
  onBuySafetyBundle: () => void;
}

export const TimeBreakerModal: React.FC<TimeBreakerModalProps> = ({
  isOpen,
  onClose,
  remainingSeconds,
  onBuyTimeBreaker,
  onBuySafetyBundle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Hourglass size={16} />
            <span>⏳ 골든 타임 브레이커</span>
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
            ⏱️
          </div>

          <div>
            <div className="text-[10px] text-rose-400 font-bold animate-pulse">
              마감 임박 잔여 시간: {remainingSeconds}초!
            </div>
            <h4 className="text-sm font-black text-white mt-1">베팅 수정 마감 연장 기회</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              타임 브레이커를 사용해 마감 시간을 30초 연장하고 베팅 픽을 즉시 수정하세요.
            </p>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onBuyTimeBreaker();
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Hourglass size={16} />
            <span>타임 브레이커 연장권 (100 SNS)</span>
          </button>

          {/* All-in Safety Bundle (SCR-07-24) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">올인 세이프티 번들</span>
              <span className="text-[9px] text-slate-400">올인 실패 시 50% 즉시 환급 보장</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuySafetyBundle();
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
