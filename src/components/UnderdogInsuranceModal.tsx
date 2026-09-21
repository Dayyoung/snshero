import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface UnderdogInsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: () => void;
}

export const UnderdogInsuranceModal: React.FC<UnderdogInsuranceModalProps> = ({
  isOpen,
  onClose,
  onPurchase
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none font-mono">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-sm bg-[#fdfcfc] border-2 border-[#201d1d] p-5 rounded-none shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-amber-600" />
            <span className="text-xs font-black uppercase text-[#201d1d]">
              [역배당 페이백 보험권]
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-[rgba(15,0,0,0.12)] bg-white hover:bg-zinc-100 rounded-sm cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="text-center py-2 space-y-1">
          <div className="text-2xl font-black text-[#201d1d]">
            50% PAYBACK SHIELD
          </div>
          <p className="text-xs text-[#504a4a]">
            고배당 역배팅 실패 시에도 베팅 코인의 50%를 즉시 복구해 드립니다!
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <CheckCircle2 size={14} className="text-amber-600" />
            <span>역배당(x2.0 이상) 경기 적용 가능</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <CheckCircle2 size={14} className="text-amber-600" />
            <span>미적중 시 50% 즉시 로컬 지갑 반환</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <CheckCircle2 size={14} className="text-amber-600" />
            <span>적중 시 고배당 당첨금 100% 정상 수령</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-zinc-100 p-3 rounded-sm">
          <span className="text-xs font-bold text-[#504a4a]">특별 한정 할인가:</span>
          <span className="text-base font-black text-[#201d1d]">800원 / 3장 번들</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-[rgba(15,0,0,0.12)] text-[#504a4a] text-xs font-bold rounded-sm cursor-pointer hover:bg-zinc-50"
          >
            닫기
          </button>
          <button
            onClick={() => {
              onPurchase();
              onClose();
            }}
            className="flex-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-sm border border-amber-700 cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98"
          >
            <Sparkles size={14} />
            <span>즉시 구매 (800원)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
