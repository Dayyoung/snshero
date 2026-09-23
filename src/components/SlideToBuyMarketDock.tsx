/**
 * SlideToBuyMarketDock.tsx - SCR-05-29
 * 모바일 100dvh 하단 고정형 '1-Step 슬라이드 구매 독(Slide-to-Buy Dock)' UX:
 * 최근 7일 평균 시세 대비 현재가를 콤팩트 표시하고 엄지 슬라이드 한 번으로 체결되는 햅틱 인터랙션.
 */

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, ChevronRight, TrendingUp, TrendingDown, Check, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface SlideToBuyMarketDockProps {
  selectedCard: {
    id: string;
    name: string;
    grade: string;
    currentPrice: number;
    avg7dPrice: number;
  } | null;
  onConfirmPurchase: (cardId: string) => void;
  onCancelSelection: () => void;
}

export const SlideToBuyMarketDock: React.FC<SlideToBuyMarketDockProps> = ({
  selectedCard,
  onConfirmPurchase,
  onCancelSelection,
}) => {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isPurchased, setIsPurchased] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!selectedCard) return null;

  const priceDiff = selectedCard.currentPrice - selectedCard.avg7dPrice;
  const priceDiffPercent = Math.round((priceDiff / selectedCard.avg7dPrice) * 100);

  const handleDrag = (_: any, info: any) => {
    const width = containerRef.current?.clientWidth || 240;
    const maxDrag = width - 56;
    if (info.offset.x >= maxDrag * 0.85 && !isPurchased) {
      triggerHaptic('heavy');
      setIsPurchased(true);
      onConfirmPurchase(selectedCard.id);
    }
  };

  return (
    <div className="fixed bottom-3 inset-x-3 z-40 font-mono select-none">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="w-full bg-slate-950/95 border border-amber-400/80 rounded-3xl p-3 shadow-2xl backdrop-blur-md flex flex-col gap-2.5"
      >
        {/* Card & Market Price Comparison Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px]">
              {selectedCard.grade}
            </span>
            <span className="text-xs font-black text-white truncate max-w-[130px]">
              {selectedCard.name}
            </span>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div>
              <span className="text-xs font-black text-amber-400 block">
                {selectedCard.currentPrice} SNS
              </span>
              <span
                className={`text-[9px] font-bold flex items-center justify-end gap-0.5 ${
                  priceDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {priceDiff <= 0 ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                7일 시세 {priceDiff <= 0 ? `${priceDiffPercent}% 저렴` : `+${priceDiffPercent}%`}
              </span>
            </div>

            <button
              type="button"
              onClick={onCancelSelection}
              className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer active:scale-95"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Slide to Buy Track */}
        <div
          ref={containerRef}
          className="relative w-full h-12 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex items-center px-1"
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[11px] font-black text-slate-500 tracking-wider">
            {isPurchased ? '체결 완료!' : '우측으로 밀어서 즉시 구매 >>>'}
          </div>

          {!isPurchased ? (
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 240 }}
              dragElastic={0.1}
              onDrag={handleDrag}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-md cursor-grab active:cursor-grabbing z-10"
            >
              <ChevronRight size={18} className="animate-pulse" />
            </motion.div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-emerald-600 text-slate-950 font-black text-xs gap-1.5 rounded-xl z-10">
              <Check size={16} />
              <span>구매가 성공적으로 완료되었습니다!</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
