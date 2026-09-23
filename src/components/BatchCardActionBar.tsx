/**
 * BatchCardActionBar.tsx - SCR-03-20
 * 라쏘 올가미 또는 복수 선택된 카드들을 일괄 잠금/분해/보호 처리하는 48px 플로팅 액션 바
 */

import React from 'react';
import { motion } from 'motion/react';
import { Lock, Unlock, Trash2, CheckSquare, X, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface BatchCardActionBarProps {
  selectedCount: number;
  onLockAll: () => void;
  onUnlockAll: () => void;
  onDismantleAll: () => void;
  onClearSelection: () => void;
}

export const BatchCardActionBar: React.FC<BatchCardActionBarProps> = ({
  selectedCount,
  onLockAll,
  onUnlockAll,
  onDismantleAll,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border border-amber-400/80 backdrop-blur-md rounded-2xl px-4 py-2 flex items-center gap-3 shadow-2xl font-mono select-none"
    >
      <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
        <CheckSquare size={14} />
        <span>{selectedCount}장 선택됨</span>
      </div>

      <div className="h-4 w-[1px] bg-slate-700" />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            onLockAll();
          }}
          className="h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95"
          title="일괄 잠금"
        >
          <Lock size={12} className="text-amber-400" />
          <span>잠금</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            onUnlockAll();
          }}
          className="h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95"
          title="일괄 잠금 해제"
        >
          <Unlock size={12} className="text-slate-400" />
          <span>해제</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('heavy');
            onDismantleAll();
          }}
          className="h-9 px-3 rounded-xl bg-rose-950/60 border border-rose-600/70 text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95"
          title="일괄 분해"
        >
          <Trash2 size={12} />
          <span>분해</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            onClearSelection();
          }}
          className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 cursor-pointer active:scale-95"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
};
