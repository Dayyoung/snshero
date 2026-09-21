import React from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Wand2, CheckCircle2, Zap } from 'lucide-react';

interface MutantFusionEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseCatalyst: (step: number) => void;
}

export const MutantFusionEventModal: React.FC<MutantFusionEventModalProps> = ({
  isOpen,
  onClose,
  onPurchaseCatalyst
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none font-mono">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-sm bg-[#fdfcfc] border-2 border-purple-600 p-5 rounded-none shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-2">
          <div className="flex items-center gap-2">
            <Wand2 size={18} className="text-purple-600" />
            <span className="text-xs font-black uppercase text-purple-600">
              [샤이니 돌연변이 카드 연성 이벤트]
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
            SHINY MUTANT SYNTHESIS
          </div>
          <p className="text-xs text-[#504a4a]">
            합성 시 1% 확률로 고유 히든 패시브를 지닌 돌연변이 전설 카드가 탄생합니다!
          </p>
        </div>

        <div className="space-y-2">
          <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-sm flex items-center justify-between">
            <div className="text-xs">
              <div className="font-bold text-[#201d1d]">1단계: 은빛 연금술 촉매</div>
              <div className="text-[10px] text-zinc-600">돌연변이 확률 +5% 상승</div>
            </div>
            <button
              onClick={() => {
                onPurchaseCatalyst(1);
                onClose();
              }}
              className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold rounded-xs cursor-pointer"
            >
              500원
            </button>
          </div>

          <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-sm flex items-center justify-between">
            <div className="text-xs">
              <div className="font-bold text-[#201d1d]">2단계: 황금 비전 촉매</div>
              <div className="text-[10px] text-zinc-600">돌연변이 확률 +15% 상승</div>
            </div>
            <button
              onClick={() => {
                onPurchaseCatalyst(2);
                onClose();
              }}
              className="px-2.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-[10px] font-bold rounded-xs cursor-pointer"
            >
              1,200원
            </button>
          </div>

          <div className="p-2.5 bg-purple-100/60 border border-purple-300 rounded-sm flex items-center justify-between">
            <div className="text-xs">
              <div className="font-bold text-[#201d1d]">3단계: 오리하르콘 절대 촉매</div>
              <div className="text-[10px] text-zinc-600">돌연변이 확정(100%) 탄생</div>
            </div>
            <button
              onClick={() => {
                onPurchaseCatalyst(3);
                onClose();
              }}
              className="px-2.5 py-1.5 bg-purple-900 hover:bg-black text-white text-[10px] font-bold rounded-xs cursor-pointer"
            >
              2,500원
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-white border border-[rgba(15,0,0,0.12)] text-[#504a4a] text-xs font-bold rounded-sm cursor-pointer hover:bg-zinc-50"
        >
          닫기
        </button>
      </motion.div>
    </div>
  );
};
