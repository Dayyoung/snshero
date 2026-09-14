import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowDownUp, AlertTriangle, Check, Info, Sliders, ShieldCheck } from 'lucide-react';
import { Language } from '../types';

interface TokenExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentSnsBalance?: number;
  onSwapSuccess?: (fromAmount: number, toAmount: number, tokenType: string) => void;
}

export const TokenExchangeModal: React.FC<TokenExchangeModalProps> = ({
  isOpen,
  onClose,
  language,
  currentSnsBalance = 1000,
  onSwapSuccess,
}) => {
  const [swapDirection, setSwapDirection] = useState<'SNS_TO_SUI' | 'SUI_TO_SNS'>('SNS_TO_SUI');
  const [inputAmount, setInputAmount] = useState<string>('100');
  const [slippage, setSlippage] = useState<'0.5' | '1.0' | 'custom'>('0.5');
  const [customSlippage, setCustomSlippage] = useState<string>('2.0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [swapDone, setSwapDone] = useState(false);

  // 환율: 100 SNS = 1 SUI
  const exchangeRate = 0.01;

  const numInput = parseFloat(inputAmount) || 0;

  const effectiveSlippagePercent = useMemo(() => {
    if (slippage === '0.5') return 0.5;
    if (slippage === '1.0') return 1.0;
    return Math.max(0.1, Math.min(20, parseFloat(customSlippage) || 1.0));
  }, [slippage, customSlippage]);

  // 견적 계산
  const { expectedOutput, priceImpact, minimumReceived, isImpactTooHigh } = useMemo(() => {
    let expected = 0;
    if (swapDirection === 'SNS_TO_SUI') {
      expected = numInput * exchangeRate;
    } else {
      expected = numInput / exchangeRate;
    }

    // 유동성 풀 가격 영향도 시뮬레이션: 거래량이 클수록 증가
    const impact = Math.min(10, (numInput / 5000) * 1.5);
    const minRec = expected * (1 - effectiveSlippagePercent / 100);

    return {
      expectedOutput: expected.toFixed(swapDirection === 'SNS_TO_SUI' ? 4 : 0),
      priceImpact: impact.toFixed(2),
      minimumReceived: minRec.toFixed(swapDirection === 'SNS_TO_SUI' ? 4 : 0),
      isImpactTooHigh: impact >= 5.0,
    };
  }, [numInput, swapDirection, effectiveSlippagePercent]);

  const handleSwap = () => {
    if (numInput <= 0 || isImpactTooHigh || isProcessing) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSwapDone(true);
      if (onSwapSuccess) {
        onSwapSuccess(numInput, parseFloat(expectedOutput), swapDirection === 'SNS_TO_SUI' ? 'SUI' : 'SNS');
      }
      setTimeout(() => {
        setSwapDone(false);
        onClose();
      }, 1500);
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 p-5 shadow-2xl space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <ArrowDownUp size={16} />
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {language === 'ko' ? '토큰 환전소 (Swap Exchange)' : 'Token Swap Exchange'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* From Input */}
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
            <div className="flex justify-between text-[11px] text-zinc-400 font-bold">
              <span>{language === 'ko' ? '지불 수량' : 'You Pay'}</span>
              <span>{language === 'ko' ? '보유' : 'Balance'}: {currentSnsBalance} SNS</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <input
                type="number"
                min="1"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-lg font-black text-white focus:outline-none placeholder:text-zinc-600"
              />
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-extrabold text-xs shrink-0">
                {swapDirection === 'SNS_TO_SUI' ? 'SNS' : 'SUI'}
              </span>
            </div>
          </div>

          {/* Swap Toggle Icon */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={() => setSwapDirection((prev) => (prev === 'SNS_TO_SUI' ? 'SUI_TO_SNS' : 'SNS_TO_SUI'))}
              className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-indigo-400 transition-all cursor-pointer active:scale-90 shadow-md"
            >
              <ArrowDownUp size={14} />
            </button>
          </div>

          {/* To Output */}
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
            <div className="flex justify-between text-[11px] text-zinc-400 font-bold">
              <span>{language === 'ko' ? '예상 수령액' : 'You Receive'}</span>
              <span className="text-[10px] text-indigo-400">100 SNS = 1.0 SUI</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-black text-white">{expectedOutput}</div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs shrink-0">
                {swapDirection === 'SNS_TO_SUI' ? 'SUI' : 'SNS'}
              </span>
            </div>
          </div>

          {/* Slippage Tolerance Control (Row 1050 / ID 313) */}
          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-bold">
              <span className="flex items-center gap-1">
                <Sliders size={12} className="text-indigo-400" />
                {language === 'ko' ? '슬리피지 허용 범위 (Slippage Tolerance)' : 'Slippage Tolerance'}
              </span>
              <span className="text-indigo-300 font-black">{effectiveSlippagePercent}%</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['0.5', '1.0', 'custom'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSlippage(opt)}
                  className={`py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    slippage === opt
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {opt === 'custom' ? (language === 'ko' ? '직접 입력' : 'Custom') : `${opt}%`}
                </button>
              ))}
            </div>
            {slippage === 'custom' && (
              <div className="pt-1 flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={customSlippage}
                  onChange={(e) => setCustomSlippage(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="2.0"
                />
                <span className="text-xs text-zinc-400">%</span>
              </div>
            )}
          </div>

          {/* Itemized Preview Row */}
          <div className="p-3 rounded-xl bg-black/40 border border-zinc-800/80 text-[11px] space-y-1.5 text-zinc-400">
            <div className="flex justify-between">
              <span>{language === 'ko' ? '예상 수령액' : 'Expected Output'}</span>
              <span className="text-zinc-200 font-bold">{expectedOutput}</span>
            </div>
            <div className="flex justify-between">
              <span>{language === 'ko' ? '가격 영향도' : 'Price Impact'}</span>
              <span className={`font-bold ${isImpactTooHigh ? 'text-rose-400' : 'text-emerald-400'}`}>
                {priceImpact}%
              </span>
            </div>
            <div className="flex justify-between border-t border-zinc-800 pt-1 text-zinc-300 font-bold">
              <span>{language === 'ko' ? '최소 보장 수령액 (슬리피지 반영)' : 'Minimum Received'}</span>
              <span className="text-white">{minimumReceived}</span>
            </div>
          </div>

          {/* Warnings */}
          {isImpactTooHigh && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>
                {language === 'ko'
                  ? '가격 영향도가 5%를 초과하여 거래가 비활성화되었습니다.'
                  : 'Price impact exceeds 5%. Swap temporarily disabled.'}
              </span>
            </div>
          )}

          {/* Swap Button */}
          <button
            type="button"
            onClick={handleSwap}
            disabled={numInput <= 0 || isImpactTooHigh || isProcessing}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 ${
              swapDone
                ? 'bg-emerald-600 text-white'
                : isImpactTooHigh || numInput <= 0
                ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
            }`}
          >
            {swapDone ? (
              <>
                <Check size={16} />
                <span>{language === 'ko' ? '환전 완료!' : 'Swap Complete!'}</span>
              </>
            ) : isProcessing ? (
              <span>{language === 'ko' ? '스왑 처리 중...' : 'Processing Swap...'}</span>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>{language === 'ko' ? '토큰 즉시 환전' : 'Instant Token Swap'}</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
