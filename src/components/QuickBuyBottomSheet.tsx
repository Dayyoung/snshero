import React from 'react';
import { X, ShoppingCart, ShieldCheck, ArrowRight } from 'lucide-react';
import { CardData, Language } from '../types';
import { getCardSpriteStyle } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';

interface QuickBuyBottomSheetProps {
  card: CardData | null;
  price: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBuy: () => void;
  language: Language;
}

export const QuickBuyBottomSheet: React.FC<QuickBuyBottomSheetProps> = ({
  card,
  price,
  isOpen,
  onClose,
  onConfirmBuy,
  language,
}) => {
  if (!isOpen || !card) return null;

  const isKo = language === 'ko';
  const spriteStyle = getCardSpriteStyle(card.imageIndex || 1);

  const handleBuy = () => {
    triggerHaptic('victory');
    onConfirmBuy();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#201d1d]/60 backdrop-blur-xs font-mono select-none">
      <div className="w-full max-w-md bg-[#fdfcfc] text-[#201d1d] border-t-2 border-[#201d1d] rounded-t-sm p-5 shadow-2xl animate-slideUp">
        <div className="w-10 h-1 bg-[#201d1d]/30 rounded-full mx-auto mb-3" />
        <div className="flex justify-between items-center border-b border-[#201d1d]/15 pb-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <ShoppingCart size={14} className="text-emerald-600" />
            <span>{isKo ? '[1-TAP 쾌속 매수 확인]' : '[QUICK BUY CONFIRMATION]'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#201d1d]/10 rounded-xs cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* 매물 카드 요약 */}
        <div className="p-3 bg-[#201d1d]/5 border border-[#201d1d]/15 rounded-xs flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xs border border-[#201d1d]/20 shrink-0"
              style={spriteStyle}
            />
            <div>
              <div className="text-xs font-black text-[#201d1d]">{card.title_dis || 'HERO'}</div>
              <div className="text-[10px] text-emerald-700 font-bold">
                {isKo ? `거래 확정가: ${price} SNS` : `Price: ${price} SNS`}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-stone-500 flex items-center gap-0.5">
            <ShieldCheck size={12} className="text-emerald-600" />
            <span>{isKo ? '에스크로 보호' : 'Escrow'}</span>
          </div>
        </div>

        {/* 48px 대형 쾌속 매수 버튼 */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleBuy}
            className="w-full min-h-[48px] py-3 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
          >
            <span>{isKo ? `[ ${price} SNS 즉시 결제 및 카드 획득 ]` : `[ Confirm Quick Buy (${price} SNS) ]`}</span>
            <ArrowRight size={14} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-1 text-center text-[11px] text-[#201d1d]/50 hover:text-[#201d1d] cursor-pointer"
          >
            {isKo ? '취소' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};
