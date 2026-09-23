import React from 'react';
import { motion } from 'motion/react';
import { X, ShieldAlert, Zap, Sparkles, HeartPulse } from 'lucide-react';

interface ComebackClutchPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: () => void;
}

export const ComebackClutchPackageModal: React.FC<ComebackClutchPackageModalProps> = ({
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
        className="w-full max-w-sm bg-[#fdfcfc] border-2 border-rose-600 p-5 rounded-none shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-2">
          <div className="flex items-center gap-2">
            <HeartPulse size={18} className="text-rose-600 animate-pulse" />
            <span className="text-xs font-black uppercase text-rose-600">
              [절체절명 역전 클러치 패키지]
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
          <div className="text-xl font-black text-[#201d1d]">
            CLUTCH REVERSAL 1-TURN
          </div>
          <p className="text-xs text-[#504a4a]">
            체력 15% 이하 위기 발생! 추가 1턴 및 실드 버프로 판세를 뒤집으세요!
          </p>
        </div>

        <div className="bg-rose-50 border border-rose-200 p-3 rounded-sm space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <Zap size={14} className="text-rose-600" />
            <span>즉시 추가 1턴 부여 (즉각 공격 가능)</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <ShieldAlert size={14} className="text-rose-600" />
            <span>1턴간 피해 무효 쉴드 배리어 발동</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <Sparkles size={14} className="text-rose-600" />
            <span>모든 아군 카드 공격력 +30% 증폭</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-zinc-100 p-3 rounded-sm">
          <span className="text-xs font-bold text-[#504a4a]">긴급 지원가:</span>
          <span className="text-base font-black text-rose-600">500원</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-[rgba(15,0,0,0.12)] text-[#504a4a] text-xs font-bold rounded-sm cursor-pointer hover:bg-zinc-50"
          >
            포기하기
          </button>
          <button
            onClick={() => {
              onPurchase();
              onClose();
            }}
            className="flex-2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-sm border border-rose-700 cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98"
          >
            <Zap size={14} />
            <span>역전 찬스 발동 (500원)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
