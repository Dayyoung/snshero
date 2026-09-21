import React from 'react';
import { motion } from 'motion/react';
import { X, Swords, Shield, Sparkles, AlertTriangle } from 'lucide-react';
import type { LeaderboardRanker } from './LeaderboardVirtualList';

interface RivalRevengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRanker: LeaderboardRanker | null;
  onStartRevenge: () => void;
  onBuySafeShield: () => void;
}

export const RivalRevengeModal: React.FC<RivalRevengeModalProps> = ({
  isOpen,
  onClose,
  targetRanker,
  onStartRevenge,
  onBuySafeShield
}) => {
  if (!isOpen || !targetRanker) return null;

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
            <Swords size={18} className="text-rose-600" />
            <span className="text-xs font-black uppercase text-[#201d1d]">
              [라이벌 복수 챌린지]
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
          <div className="text-base font-black text-[#201d1d]">
            {targetRanker.userName} 님과의 대전
          </div>
          <p className="text-xs text-[#504a4a]">
            승리 시 랭킹 포인트(LP) 2배 획득! 순위를 즉시 탈환하세요.
          </p>
        </div>

        <div className="bg-rose-50/60 border border-rose-200 p-3 rounded-sm space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#504a4a]">상대 방어 덱 전투력:</span>
            <span className="font-bold text-[#201d1d]">{targetRanker.defenseDeckPower.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#504a4a]">상대 현재 랭킹:</span>
            <span className="font-bold text-rose-600">{targetRanker.rank}위 ({targetRanker.rating} LP)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#504a4a]">승리 특별 보너스:</span>
            <span className="font-black text-emerald-600">+LP 200% (2배)</span>
          </div>
        </div>

        {/* Rank Safe Shield Purchase (SCR-10-09) */}
        <div className="p-2.5 bg-zinc-100 border border-[rgba(15,0,0,0.12)] rounded-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Shield size={16} className="text-blue-600" />
            <div>
              <div className="font-bold text-[#201d1d]">랭크 세이프 쉴드</div>
              <div className="text-[9px] text-[#504a4a]">패배 시 점수 하락 1회 무효화</div>
            </div>
          </div>
          <button
            onClick={onBuySafeShield}
            className="px-2 py-1 bg-white border border-blue-400 text-blue-700 text-[10px] font-bold rounded-sm hover:bg-blue-50 cursor-pointer"
          >
            구매 (800원)
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-[rgba(15,0,0,0.12)] text-[#504a4a] text-xs font-bold rounded-sm cursor-pointer hover:bg-zinc-50"
          >
            취소
          </button>
          <button
            onClick={() => {
              onStartRevenge();
              onClose();
            }}
            className="flex-2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-sm border border-rose-700 cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98"
          >
            <Swords size={14} />
            <span>도전장 제출 (결투)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
