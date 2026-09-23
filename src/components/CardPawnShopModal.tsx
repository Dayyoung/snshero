/**
 * CardPawnShopModal.tsx - SCR-05-18
 * SSR 카드를 담보로 시세의 70%를 즉시 대출받는 카드 폰샵(전당포) 및 긴급 담보 보호 리파이낸싱 패키지(990원)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Landmark, Shield, Coins, AlertTriangle, X, Check, ArrowRight, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface CardPawnShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  cardMarketPrice: number;
  onTakeLoan: (loanAmount: number) => void;
  onBuyProtectionPack: () => void;
}

export const CardPawnShopModal: React.FC<CardPawnShopModalProps> = ({
  isOpen,
  onClose,
  cardName,
  cardMarketPrice,
  onTakeLoan,
  onBuyProtectionPack,
}) => {
  const loanAmount = Math.floor(cardMarketPrice * 0.7);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Landmark size={16} />
            <span>🏦 카드 폰샵 (전당포 즉시대출)</span>
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
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400 flex items-center justify-center text-amber-400 text-2xl">
            💳
          </div>

          <div>
            <h4 className="text-sm font-black text-white">{cardName} 담보 대출</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              카드를 영구 매각하지 않고, 시세의 70%를 24시간 동안 즉시 현금화(SNS)하여 융통할 수 있습니다.
            </p>
          </div>

          {/* Loan Details Box */}
          <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 text-left">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">담보 카드 시세</span>
              <span className="text-white font-bold">{cardMarketPrice.toLocaleString()} SNS</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">즉시 대출 가능액 (70%)</span>
              <span className="text-emerald-400 font-bold">+{loanAmount.toLocaleString()} SNS</span>
            </div>
            <div className="flex justify-between text-xs border-t border-slate-800 pt-1.5">
              <span className="text-slate-400">만기 및 이자율</span>
              <span className="text-amber-400 font-bold">24시간 (수수료 3%)</span>
            </div>
          </div>

          {/* Action Loan Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onTakeLoan(loanAmount);
              onClose();
            }}
            className="h-11 w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Coins size={15} />
            <span>즉시 대출금 수령 (+{loanAmount} SNS)</span>
          </button>

          {/* Emergency Refinancing Protection Pack (SCR-05-18) */}
          <div className="w-full p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-rose-300 block">긴급 담보 보호 팩 (990원)</span>
              <span className="text-[9px] text-slate-400">상환 기한 72시간 연장 & 몰수 방지</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyProtectionPack();
                onClose();
              }}
              className="px-2.5 py-1 bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-bold rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (200 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
