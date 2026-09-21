/**
 * LeverageTokenTradeModal.tsx - SCR-06-18
 * 상승/하락에 3배 베팅하는 3X 불(Bull) & 베어(Bear) 토큰 가상 파생상품 및 마진콜 프로텍션 실드(1,500원)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Shield, AlertTriangle, X, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface LeverageTokenTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockSymbol: string;
  onTradeLeverage: (position: 'BULL' | 'BEAR', amount: number) => void;
  onBuyMarginProtection: () => void;
}

export const LeverageTokenTradeModal: React.FC<LeverageTokenTradeModalProps> = ({
  isOpen,
  onClose,
  stockSymbol,
  onTradeLeverage,
  onBuyMarginProtection,
}) => {
  const [position, setPosition] = useState<'BULL' | 'BEAR'>('BULL');
  const [amount, setAmount] = useState(100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-indigo-500 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Zap size={16} className="text-yellow-300" />
            <span>⚡ 3X 레버리지 토큰 거래소</span>
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
          <div>
            <h4 className="text-sm font-black text-white">{stockSymbol} 3X 파생상품</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              기초자산의 변동률을 3배로 증폭하여 고수익을 노릴 수 있는 고위험 가상 파생상품입니다.
            </p>
          </div>

          {/* Position Selector */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setPosition('BULL');
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1 cursor-pointer transition ${
                position === 'BULL'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 font-black'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <TrendingUp size={20} />
              <span className="text-xs">3X BULL (상승)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setPosition('BEAR');
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1 cursor-pointer transition ${
                position === 'BEAR'
                  ? 'bg-rose-500/20 border-rose-400 text-rose-400 font-black'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <TrendingDown size={20} />
              <span className="text-xs">3X BEAR (하락)</span>
            </button>
          </div>

          {/* Amount Stepper */}
          <div className="w-full flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 pl-2">투자금 (SNS)</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAmount((p) => Math.max(50, p - 50))}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-black text-xs"
              >
                -
              </button>
              <span className="text-sm font-black text-white">{amount}</span>
              <button
                type="button"
                onClick={() => setAmount((p) => p + 50)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-black text-xs"
              >
                +
              </button>
            </div>
          </div>

          {/* 48px Trade Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onTradeLeverage(position, amount);
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Zap size={16} className="text-yellow-300" />
            <span>3X {position} 포지션 진입</span>
          </button>

          {/* Margin Call Protection Shield (SCR-06-18) */}
          <div className="w-full p-2.5 bg-indigo-950/40 border border-indigo-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-indigo-300 block">마진콜 프로텍션 실드</span>
              <span className="text-[9px] text-slate-400">청산 위기 시 24시간 포지션 강제 동결</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyMarginProtection();
                onClose();
              }}
              className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-bold rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (300 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
