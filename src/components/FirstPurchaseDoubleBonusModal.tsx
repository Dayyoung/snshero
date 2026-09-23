import React from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Gift, CheckCircle2, Zap } from 'lucide-react';

interface FirstPurchaseDoubleBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: () => void;
  hasUsedFirstPurchase: boolean;
}

export const FirstPurchaseDoubleBonusModal: React.FC<FirstPurchaseDoubleBonusModalProps> = ({
  isOpen,
  onClose,
  onPurchase,
  hasUsedFirstPurchase
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none font-mono">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-sm bg-[#fdfcfc] border-2 border-amber-500 p-5 rounded-none shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-2">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-amber-600" />
            <span className="text-xs font-black uppercase text-[#201d1d]">
              [첫 결제 1+1 더블 보너스]
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-[rgba(15,0,0,0.12)] bg-white hover:bg-zinc-100 rounded-sm cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="text-center py-1 space-y-1">
          <div className="text-2xl font-black text-[#201d1d]">
            1+1 DOUBLE SNS GEM
          </div>
          <p className="text-xs text-[#504a4a]">
            생애 최초 다이아/SNS 충전 시 구매 수량의 100%를 무상으로 추가 지급!
          </p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <Zap size={14} className="text-amber-600" />
            <span>1,000 SNS 결제 시 ➔ 총 2,000 SNS 지급 (1+1)</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <CheckCircle2 size={14} className="text-amber-600" />
            <span>최초 1회 한정 보너스 + SSR 확정 소환권 1매 동봉</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-zinc-100 p-3 rounded-sm">
          <span className="text-xs font-bold text-[#504a4a]">스타터 특별가:</span>
          <span className="text-base font-black text-[#201d1d]">1,200원</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-[rgba(15,0,0,0.12)] text-[#504a4a] text-xs font-bold rounded-sm cursor-pointer hover:bg-zinc-50"
          >
            닫기
          </button>
          <button
            disabled={hasUsedFirstPurchase}
            onClick={() => {
              onPurchase();
              onClose();
            }}
            className="flex-2 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-300 text-white text-xs font-black rounded-sm border border-amber-700 cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98"
          >
            <Sparkles size={14} />
            <span>{hasUsedFirstPurchase ? '이미 수령함' : '1+1 패키지 구매'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
