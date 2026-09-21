import React from 'react';
import { motion } from 'motion/react';
import { X, Award, Sparkles, CheckCircle2, Heart } from 'lucide-react';

interface SupporterBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: () => void;
  isSupporter: boolean;
}

export const SupporterBadgeModal: React.FC<SupporterBadgeModalProps> = ({
  isOpen,
  onClose,
  onPurchase,
  isSupporter
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
            <Award size={18} className="text-amber-500" />
            <span className="text-xs font-black uppercase text-[#201d1d]">
              [FOUNDERS SUPPORTER PACK]
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
            파운더스 공식 후원자
          </div>
          <p className="text-xs text-[#504a4a]">
            영구 골드 명예 배지 + 엔딩 크레딧 등재 + 5,000 SNS 후원 감사 보너스!
          </p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <Award size={14} className="text-amber-600" />
            <span>닉네임 옆 영구 황금 파운더스 배지 부여</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <Heart size={14} className="text-rose-500" />
            <span>게임 엔딩 크레딧 & 명예의 전당 등재</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <CheckCircle2 size={14} className="text-amber-600" />
            <span>즉시 +5,000 SNS + 전용 골든 카드 프레임</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-zinc-100 p-3 rounded-sm">
          <span className="text-xs font-bold text-[#504a4a]">1회 한정 영구 멤버십:</span>
          <span className="text-base font-black text-[#201d1d]">4,900원</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-[rgba(15,0,0,0.12)] text-[#504a4a] text-xs font-bold rounded-sm cursor-pointer hover:bg-zinc-50"
          >
            닫기
          </button>
          <button
            disabled={isSupporter}
            onClick={() => {
              onPurchase();
              onClose();
            }}
            className="flex-2 py-2.5 bg-[#201d1d] hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-xs font-black rounded-sm border border-[#201d1d] cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>{isSupporter ? '후원 완료됨' : '후원 멤버십 등록'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
