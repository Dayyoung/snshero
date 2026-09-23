/**
 * NextDayQuestPreviewSheet.tsx - SCR-11-20
 * 내일의 주요 퀘스트/보상을 미리 엿보는 익일 프리뷰 바텀시트
 */

import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Gift, X, Sparkles, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface NextDayQuestPreviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  nextDayMissions: { title: string; reward: string; difficulty: string }[];
}

export const NextDayQuestPreviewSheet: React.FC<NextDayQuestPreviewSheetProps> = ({
  isOpen,
  onClose,
  nextDayMissions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col justify-end font-mono select-none">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-slate-950 border-t-2 border-amber-400 rounded-t-3xl p-5 max-w-lg mx-auto w-full flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-amber-400" />
            <h3 className="text-sm font-black text-white">내일의 일일 퀘스트 미리보기</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          매일 자정(00:00) 초기화되는 내일의 주요 일일 임무 목록입니다.
        </p>

        <div className="flex flex-col gap-2">
          {nextDayMissions.map((m, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-white block">{m.title}</span>
                <span className="text-[10px] text-slate-400">난이도: {m.difficulty}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-black text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-500/30">
                <Gift size={12} />
                <span>{m.reward}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
