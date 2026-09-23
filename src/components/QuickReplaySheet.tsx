/**
 * QuickReplaySheet.tsx - SCR-10-17
 * 랭킹 항목 우측 스와이프 시 미니 플레이어가 열리는 1-Tap 리플레이 바텀시트
 */

import React from 'react';
import { motion } from 'motion/react';
import { Film, X, Trophy, Swords, Sparkles } from 'lucide-react';
import { ReplayScrubberSlider } from './ReplayScrubberSlider';

interface QuickReplaySheetProps {
  isOpen: boolean;
  onClose: () => void;
  winnerName: string;
  loserName: string;
  score: string;
}

export const QuickReplaySheet: React.FC<QuickReplaySheetProps> = ({
  isOpen,
  onClose,
  winnerName,
  loserName,
  score,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end font-mono select-none">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-slate-950 border-t-2 border-amber-400 rounded-t-3xl p-5 max-w-lg mx-auto w-full flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film size={18} className="text-amber-400" />
            <h3 className="text-sm font-black text-white">1-Tap 하이라이트 리플레이</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Match Header Info */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
          <div className="text-left">
            <span className="text-emerald-400 font-bold block">WINNER</span>
            <span className="text-white font-black">{winnerName}</span>
          </div>
          <div className="text-center font-black text-amber-400 text-sm">
            {score}
          </div>
          <div className="text-right">
            <span className="text-rose-400 font-bold block">LOSER</span>
            <span className="text-white font-black">{loserName}</span>
          </div>
        </div>

        {/* Video Canvas Placeholder */}
        <div className="w-full h-40 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-600 text-xs">
          [60fps 미니 배틀 캔버스 재생 영역]
        </div>

        {/* Replay Scrubber */}
        <ReplayScrubberSlider totalTurns={12} onTurnChange={() => {}} />
      </motion.div>
    </div>
  );
};
