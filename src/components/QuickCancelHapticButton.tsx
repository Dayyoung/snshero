/**
 * QuickCancelHapticButton.tsx - SCR-05-20
 * 미체결 주문 번호를 0.1초 롱터치 시 즉시 취소하는 햅틱 액션 버튼
 */

import React, { useRef } from 'react';
import { triggerHaptic } from '../lib/haptic';
import { X } from 'lucide-react';

interface QuickCancelHapticButtonProps {
  orderId: string;
  onCancel: (orderId: string) => void;
}

export const QuickCancelHapticButton: React.FC<QuickCancelHapticButtonProps> = ({
  orderId,
  onCancel,
}) => {
  const timerRef = useRef<number | null>(null);

  const handleTouchStart = () => {
    timerRef.current = window.setTimeout(() => {
      triggerHaptic('heavy');
      onCancel(orderId);
    }, 100); // 0.1s long press
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <button
      type="button"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      className="h-8 px-2.5 rounded-lg bg-rose-950/60 border border-rose-600/70 text-rose-300 text-[10px] font-bold flex items-center gap-1 active:scale-95 cursor-pointer select-none"
    >
      <X size={12} />
      <span>롱터치 취소</span>
    </button>
  );
};
