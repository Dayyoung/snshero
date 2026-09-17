import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, ShieldAlert, CheckCircle2, X, TrendingUp, TrendingDown } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { Language } from '../types';

export interface TpSlConfig {
  cardId: number;
  symbol: string;
  cardTitle: string;
  currentPrice: number;
  takeProfitPrice: number | null;
  stopLossPrice: number | null;
  enabled: boolean;
}

interface StockTpSlSheetProps {
  cardId: number;
  symbol: string;
  cardTitle: string;
  currentPrice: number;
  language: Language;
  currentConfig?: TpSlConfig | null;
  onSave: (config: TpSlConfig) => void;
  onClose: () => void;
}

export const StockTpSlSheet: React.FC<StockTpSlSheetProps> = ({
  cardId,
  symbol,
  cardTitle,
  currentPrice,
  language,
  currentConfig,
  onSave,
  onClose,
}) => {
  const [tpPct, setTpPct] = useState<number | null>(() => {
    if (currentConfig?.takeProfitPrice) {
      return Math.round(((currentConfig.takeProfitPrice - currentPrice) / currentPrice) * 100);
    }
    return 10;
  });

  const [slPct, setSlPct] = useState<number | null>(() => {
    if (currentConfig?.stopLossPrice) {
      return Math.round(((currentPrice - currentConfig.stopLossPrice) / currentPrice) * 100);
    }
    return 5;
  });

  const calculatedTpPrice = tpPct !== null ? Math.round(currentPrice * (1 + tpPct / 100)) : null;
  const calculatedSlPrice = slPct !== null ? Math.round(currentPrice * (1 - slPct / 100)) : null;

  const handleApply = () => {
    triggerHaptic('success');
    onSave({
      cardId,
      symbol,
      cardTitle,
      currentPrice,
      takeProfitPrice: calculatedTpPrice,
      stopLossPrice: calculatedSlPrice,
      enabled: true,
    });
    onClose();
  };

  const handleClear = () => {
    triggerHaptic('medium');
    onSave({
      cardId,
      symbol,
      cardTitle,
      currentPrice,
      takeProfitPrice: null,
      stopLossPrice: null,
      enabled: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-lg bg-[#fdfcfc] border-t-2 border-[#201d1d] p-5 font-mono text-xs shadow-2xl animate-in slide-in-from-bottom-5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-[#201d1d]" />
            <h3 className="font-black text-sm text-[#201d1d]">
              {language === 'ko' ? '1-Tap 익절 / 손절 자동 감시' : '1-Tap TP / SL Watch'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#646262] hover:text-[#201d1d] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="py-3 space-y-4">
          {/* Target Info */}
          <div className="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] flex items-center justify-between">
            <div>
              <span className="text-sm font-black text-[#201d1d]">{symbol}</span>
              <span className="text-[11px] text-[#646262] ml-1.5">[{cardTitle}]</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#646262] block">
                {language === 'ko' ? '현재가' : 'Current Price'}
              </span>
              <span className="font-black text-xs text-indigo-700">
                {currentPrice.toLocaleString()} SNS
              </span>
            </div>
          </div>

          {/* Take Profit (익절) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1 text-emerald-700">
                <TrendingUp size={13} />
                {language === 'ko' ? '목표 익절가 (Take Profit)' : 'Take Profit (TP)'}
              </span>
              {calculatedTpPrice && (
                <span className="font-black text-emerald-700">
                  {calculatedTpPrice.toLocaleString()} SNS (+{tpPct}%)
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[5, 10, 20, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setTpPct(pct);
                  }}
                  className={`py-2 text-[11px] font-bold border transition-colors cursor-pointer ${
                    tpPct === pct
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  +{pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Stop Loss (손절) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1 text-rose-700">
                <ShieldAlert size={13} />
                {language === 'ko' ? '방어 손절가 (Stop Loss)' : 'Stop Loss (SL)'}
              </span>
              {calculatedSlPrice && (
                <span className="font-black text-rose-700">
                  {calculatedSlPrice.toLocaleString()} SNS (-{slPct}%)
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[3, 5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSlPct(pct);
                  }}
                  className={`py-2 text-[11px] font-bold border transition-colors cursor-pointer ${
                    slPct === pct
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
                  }`}
                >
                  -{pct}%
                </button>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-[#8c8989] leading-relaxed">
            {language === 'ko'
              ? '💡 설정된 익절가 또는 손절가 도달 시 자동으로 알림 및 1-Tap 즉시 매도 슬립을 제공합니다.'
              : '💡 When TP/SL target is reached, automatic price alert and 1-tap fast sell slip trigger.'}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-[rgba(15,0,0,0.08)]">
            {currentConfig?.enabled && (
              <button
                type="button"
                onClick={handleClear}
                className="py-3 px-4 bg-white border border-rose-400 text-rose-700 hover:bg-rose-50 font-black text-xs cursor-pointer active:scale-95 transition-all"
              >
                {language === 'ko' ? '감시 해제' : 'Disable'}
              </button>
            )}
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 py-3 bg-[#201d1d] hover:bg-[#343030] text-[#fdfcfc] font-black text-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 size={14} />
              <span>{language === 'ko' ? 'TP/SL 감시 설정 저장' : 'Save TP/SL Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
