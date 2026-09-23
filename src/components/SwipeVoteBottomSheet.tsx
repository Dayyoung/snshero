/**
 * SwipeVoteBottomSheet.tsx - SCR-09-23
 * 좌우 스와이프로 1초 만에 의사를 표명하는 틴더형 1-Tap 투표 바텀시트 (48px)
 */

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface SwipeVoteBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  agendaTitle: string;
  onVote: (agreement: boolean) => void;
}

export const SwipeVoteBottomSheet: React.FC<SwipeVoteBottomSheetProps> = ({
  isOpen,
  onClose,
  agendaTitle,
  onVote,
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 150], [-20, 20]);
  const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col justify-end font-mono select-none">
      <div className="bg-slate-950 border-t-2 border-amber-400 rounded-t-3xl p-5 max-w-lg mx-auto w-full flex flex-col gap-4 shadow-2xl items-center text-center">
        <div className="w-full flex items-center justify-between">
          <h3 className="text-sm font-black text-white">길드 안건 스와이프 투표</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <motion.div
          style={{ x, rotate, opacity }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x > 100) {
              triggerHaptic('heavy');
              onVote(true);
              onClose();
            } else if (info.offset.x < -100) {
              triggerHaptic('heavy');
              onVote(false);
              onClose();
            }
          }}
          className="w-64 h-40 bg-slate-900 border-2 border-amber-400/80 rounded-2xl p-4 flex flex-col justify-center items-center cursor-grab active:cursor-grabbing shadow-xl"
        >
          <span className="text-xs font-black text-white">{agendaTitle}</span>
          <span className="text-[10px] text-slate-400 mt-2">
            👉 오른쪽 스와이프: 찬성 | 👈 왼쪽 스와이프: 반대
          </span>
        </motion.div>

        {/* 48px Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onVote(false);
              onClose();
            }}
            className="h-12 bg-rose-950/60 border border-rose-500 rounded-xl text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <ThumbsDown size={16} />
            <span>반대</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onVote(true);
              onClose();
            }}
            className="h-12 bg-emerald-950/60 border border-emerald-500 rounded-xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <ThumbsUp size={16} />
            <span>찬성</span>
          </button>
        </div>
      </div>
    </div>
  );
};
