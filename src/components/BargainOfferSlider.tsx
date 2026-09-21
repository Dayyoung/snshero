/**
 * BargainOfferSlider.tsx - SCR-05-14
 * 원핸드 스마트 흥정 슬라이더 (48px 엄지 제스처 기반 즉시 오퍼)
 */

import React, { useState } from 'react';
import { Tag, Send, ArrowRight } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface BargainOfferSliderProps {
  originalPrice: number;
  onSendOffer: (offerPrice: number) => void;
  language?: string;
}

export const BargainOfferSlider: React.FC<BargainOfferSliderProps> = ({
  originalPrice,
  onSendOffer,
  language = 'ko',
}) => {
  const [discountPercent, setDiscountPercent] = useState<number>(10);

  const offerPrice = Math.round(originalPrice * (1 - discountPercent / 100));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setDiscountPercent(val);
    triggerHaptic('light');
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono select-none">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="flex items-center gap-1 text-slate-300 font-bold">
          <Tag size={12} className="text-amber-400" />
          {language === 'ko' ? '원핸드 스마트 흥정' : '1-Hand Bargain'}
        </span>
        <span className="text-amber-400 font-black">
          -{discountPercent}% ({offerPrice} SNS)
        </span>
      </div>

      {/* 48px 터치 최적화 슬라이더 트랙 */}
      <div className="h-12 flex items-center px-1">
        <input
          type="range"
          min="5"
          max="30"
          step="5"
          value={discountPercent}
          onChange={handleSliderChange}
          className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 touch-pan-x"
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 mb-3">
        <span>-5%</span>
        <span>-15%</span>
        <span>-30% (Max)</span>
      </div>

      <button
        type="button"
        onClick={() => {
          triggerHaptic('heavy');
          onSendOffer(offerPrice);
        }}
        className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
      >
        <Send size={14} />
        <span>
          {language === 'ko' ? `${offerPrice} SNS 오퍼 전송 (48px)` : `Send ${offerPrice} SNS Offer`}
        </span>
      </button>
    </div>
  );
};
