/**
 * QuickDeckCloneButton.tsx - SCR-03-17
 * 상대방 덱 또는 메타 추천 덱 구성을 1초 만에 내 빈 슬롯으로 복사하는 퀵 클론 버튼
 */

import React from 'react';
import { Copy, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface QuickDeckCloneButtonProps {
  onClone: () => void;
  label?: string;
}

export const QuickDeckCloneButton: React.FC<QuickDeckCloneButtonProps> = ({
  onClone,
  label = '덱 복사',
}) => {
  return (
    <button
      type="button"
      onClick={() => {
        triggerHaptic('medium');
        onClone();
      }}
      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer shadow font-mono"
    >
      <Copy size={13} className="text-amber-400" />
      <span>{label}</span>
    </button>
  );
};
