import React, { useState, useEffect } from 'react';
import { X, Flame, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { triggerHaptic } from '../lib/haptic';

interface FlashSalePopupProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onBuy: () => void;
  playSfx?: (url: string) => void;
}

export const FlashSalePopup: React.FC<FlashSalePopupProps> = ({
  isOpen,
  onClose,
  language,
  onBuy,
  playSfx,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15분 = 900초

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || timeLeft <= 0) return null;

  const isKo = language === 'ko';
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handlePurchase = () => {
    triggerHaptic('victory');
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    onBuy();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#201d1d]/80 backdrop-blur-xs font-mono select-none">
      <div className="relative w-full max-w-sm bg-[#fdfcfc] text-[#201d1d] border-2 border-rose-600 rounded-none shadow-2xl p-5 text-left overflow-hidden">
        {/* 상단 뱃지 & 타이머 */}
        <div className="flex justify-between items-center border-b border-[#201d1d]/15 pb-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-black text-rose-600 uppercase">
            <Flame size={14} className="fill-rose-600" />
            <span>{isKo ? '[15분 한정 시크릿 게릴라 세일]' : '[15-MIN FLASH SALE]'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#201d1d]/10 rounded-xs cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#201d1d]">
              {isKo ? '시크릿 게릴라 스페셜 팩' : 'Secret Guerilla Pack'}
            </h3>
            <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-xs">
              70% OFF
            </span>
          </div>

          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xs space-y-1 text-xs text-[#201d1d]/80">
            <div>• {isKo ? 'SSR 확률 3배 카드 소환팩 x1' : '3x SSR Rate Card Pack x1'}</div>
            <div>• {isKo ? 'SNS 보너스 코인 +1,000 SNS' : 'SNS Bonus Coins +1,000'}</div>
            <div>• {isKo ? '당일 뽑기 마일리지 +20P 즉시 지급' : '+20 Mileage Bonus'}</div>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-rose-700 font-bold justify-center pt-1">
            <Clock size={12} />
            <span>
              {isKo ? '남은 시간' : 'Time Remaining'}: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </span>
          </div>
        </div>

        {/* 결제 버튼 */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={handlePurchase}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
          >
            <span>{isKo ? '500원 즉시 구매 (50 SNS)' : 'Buy Now ($0.49 / 50 SNS)'}</span>
            <ArrowRight size={13} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-[11px] text-[#201d1d]/50 hover:text-[#201d1d] py-1 cursor-pointer"
          >
            {isKo ? '기회 놓치고 닫기' : 'Decline Offer'}
          </button>
        </div>
      </div>
    </div>
  );
};
