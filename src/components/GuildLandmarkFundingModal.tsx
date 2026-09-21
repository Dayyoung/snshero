import React from 'react';
import { motion } from 'motion/react';
import { X, Castle, Sparkles, CheckCircle2, Trophy } from 'lucide-react';

interface GuildLandmarkFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFund: (amount: number) => void;
  currentProgress: number;
}

export const GuildLandmarkFundingModal: React.FC<GuildLandmarkFundingModalProps> = ({
  isOpen,
  onClose,
  onFund,
  currentProgress
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
            <Castle size={18} className="text-amber-600" />
            <span className="text-xs font-black uppercase text-[#201d1d]">
              [길드 랜드마크 공동 펀딩]
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
          <div className="text-lg font-black text-[#201d1d]">
            천공의 비공정 성채 완공 프로젝트
          </div>
          <p className="text-xs text-[#504a4a]">
            길드원 전원 전투력 +10% 영구 버프 및 기여도 1~3위 황금 동상 건립!
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-[#201d1d]">
            <span>완공 펀딩 진행률</span>
            <span className="text-amber-600">{currentProgress}%</span>
          </div>
          <div className="w-full h-3 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, currentProgress)}%` }}
            />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-sm space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#201d1d]">
            <Trophy size={14} className="text-amber-600" />
            <span>랜드마크 후원 펀딩팩: 1,900원</span>
          </div>
          <div className="text-[10px] text-zinc-600">
            즉시 5,000 펀딩 포인트 + 길드 전용 후원자 명예 칭호 부여
          </div>
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
              onFund(5000);
              onClose();
            }}
            className="flex-2 py-2.5 bg-[#201d1d] hover:bg-zinc-800 text-white text-xs font-black rounded-sm border border-[#201d1d] cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>펀딩 참여 (1,900원)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
