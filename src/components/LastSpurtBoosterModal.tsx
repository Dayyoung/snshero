import React from 'react';
import { motion } from 'motion/react';
import { X, Zap, Sparkles, CheckCircle2, Timer } from 'lucide-react';

interface LastSpurtBoosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: () => void;
}

export const LastSpurtBoosterModal: React.FC<LastSpurtBoosterModalProps> = ({
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
            <Zap size={18} className="text-amber-500" />
            <span className="text-xs font-black uppercase text-[#201d1d]">
              [막판 스퍼트 골든 부스터]
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
            LAST SPURT 3X BOOST
          </div>
          <p className="text-xs text-[#504a4a]">
            퀘스트 마감 직전 남은 미완료 미션 경험치 & 보상 3배 즉시 증폭!
          </p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <Timer size={14} className="text-amber-600" />
            <span>오늘 자정 전까지 전 퀘스트 경험치 300% (3배)</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <CheckCircle2 size={14} className="text-amber-600" />
            <span>올클리어 실패 시 미완성 구제 럭키박스 지급</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <CheckCircle2 size={14} className="text-amber-600" />
            <span>즉시 +300 SNS 보너스 캐시백</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-zinc-100 p-3 rounded-sm">
          <span className="text-xs font-bold text-[#504a4a]">긴급 타임어택 할인가:</span>
          <span className="text-base font-black text-[#201d1d]">500원 (한정)</span>
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
            <span>부스터 발동 (500원)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
