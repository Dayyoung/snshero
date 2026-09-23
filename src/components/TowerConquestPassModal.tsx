import React from 'react';
import { motion } from 'motion/react';
import { X, Crown, Sparkles, CheckCircle2, Gift } from 'lucide-react';

interface TowerConquestPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: () => void;
  isPurchased: boolean;
}

export const TowerConquestPassModal: React.FC<TowerConquestPassModalProps> = ({
  isOpen,
  onClose,
  onPurchase,
  isPurchased
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
            <Crown size={18} className="text-amber-500" />
            <span className="text-xs font-black uppercase text-[#201d1d]">
              [시련의 탑 정복 패스]
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
            TOWER CONQUEST PASS
          </div>
          <p className="text-xs text-[#504a4a]">
            10층 단위 돌파 시마다 프리미엄 추가 보상 2배 및 즉시 1,500 SNS 지급!
          </p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <Gift size={14} className="text-amber-600" />
            <span>구매 즉시 1,500 SNS + 전설 소환권 1매</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <CheckCircle2 size={14} className="text-amber-600" />
            <span>10층마다 골드/재화 보상 200% 증폭</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <CheckCircle2 size={14} className="text-amber-600" />
            <span>보스전 패배 시 1회 무상 부활 버프</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-zinc-100 p-3 rounded-sm">
          <span className="text-xs font-bold text-[#504a4a]">정가 4,900원 ➔ 특별가:</span>
          <span className="text-base font-black text-[#201d1d]">1,900원 (한정)</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-[rgba(15,0,0,0.12)] text-[#504a4a] text-xs font-bold rounded-sm cursor-pointer hover:bg-zinc-50"
          >
            닫기
          </button>
          <button
            disabled={isPurchased}
            onClick={() => {
              onPurchase();
              onClose();
            }}
            className="flex-2 py-2.5 bg-[#201d1d] hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-xs font-black rounded-sm border border-[#201d1d] cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>{isPurchased ? '이미 활성화됨' : '정복 패스 활성화'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
