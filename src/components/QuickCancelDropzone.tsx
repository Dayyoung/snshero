/**
 * QuickCancelDropzone.tsx - SCR-02-23
 * 하단 Safe Area로 손가락을 내리면 즉시 카드를 패로 복귀시키는 48px 드롭다운 퀵 캔슬 존
 */

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface QuickCancelDropzoneProps {
  isDragging: boolean;
  onCancelDrop: () => void;
}

export const QuickCancelDropzone: React.FC<QuickCancelDropzoneProps> = ({
  isDragging,
  onCancelDrop,
}) => {
  if (!isDragging) return null;

  return (
    <div
      onPointerEnter={() => {
        triggerHaptic('selection');
        onCancelDrop();
      }}
      className="fixed bottom-0 inset-x-0 h-12 bg-rose-950/80 border-t-2 border-rose-500 flex items-center justify-center gap-2 font-mono text-xs font-black text-rose-200 z-50 animate-pulse backdrop-blur-xs select-none"
    >
      <RotateCcw size={16} />
      <span>여기로 끌어내려 소환 취소</span>
    </div>
  );
};
