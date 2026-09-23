/**
 * ShortSellingTradeModal.tsx - SCR-06-21
 * 주가 하락 시 수익을 내는 '가상 공매도(Short) 대주 거래' 및 숏스퀴즈 이벤트, 쇼트 트레이더 패스(1,500원)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingDown, Flame, Zap, X, Check, ArrowDown } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface ShortSellingTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockName: string;
  currentPrice: number;
  onExecuteShort: (shares: number) => void;
  onBuyShortPass: () => void;
}

export const ShortSellingTradeModal: React.FC<ShortSellingTradeModalProps> = ({
  isOpen,
  onClose,
  stockName,
  currentPrice,
  onExecuteShort,
  onBuyShortPass,
}) => {
  const [shares, setShares] = useState(10);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-rose-500 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-600 to-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <TrendingDown size={16} />
            <span>📉 가상 공매도(Short) 대주 거래</span>
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
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 text-3xl shadow-lg">
            🔻
          </div>

          <div>
            <h4 className="text-sm font-black text-white">{stockName} 하락 포지션</h4>
            <div className="text-[11px] text-slate-400 mt-1">
              현재가: <span className="text-rose-400 font-bold">{currentPrice.toLocaleString()} SNS</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              주식을 먼저 대여해 매도하고, 가격 하락 시 재매수하여 차익을 거두는 공매도 포지션입니다. (숏스퀴즈 폭등 위험 주의!)
            </p>
          </div>

          {/* Shares Counter */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setShares((p) => Math.max(1, p - 5));
              }}
              className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-white font-black active:scale-95 cursor-pointer"
            >
              -
            </button>
            <span className="text-sm font-black text-amber-400">{shares} 주</span>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setShares((p) => p + 5);
              }}
              className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-white font-black active:scale-95 cursor-pointer"
            >
              +
            </button>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onExecuteShort(shares);
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-rose-600 to-red-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <ArrowDown size={16} />
            <span>{(shares * currentPrice).toLocaleString()} SNS 공매도 진입</span>
          </button>

          {/* Short Trader Pass (SCR-06-21) */}
          <div className="w-full p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-rose-300 block">쇼트 트레이더 마스터 패스</span>
              <span className="text-[9px] text-slate-400">대주 이자율 0% & 숏스퀴즈 강제 청산 방지</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyShortPass();
                onClose();
              }}
              className="px-2.5 py-1 bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-bold rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (300 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
