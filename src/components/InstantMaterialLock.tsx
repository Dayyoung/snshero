/**
 * InstantMaterialLock.tsx - SCR-08-23
 * 재료 롱터치 시 햅틱과 함께 황금 자물쇠가 잠기는 인스턴트 락(Lock) 토글
 */

import React, { useRef } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface InstantMaterialLockProps {
  cardId: string;
  isLocked: boolean;
  onToggleLock: (cardId: string) => void;
  children: React.ReactNode;
}

export const InstantMaterialLock: React.FC<InstantMaterialLockProps> = ({
  cardId,
  isLocked,
  onToggleLock,
  children,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPress = () => {
    timerRef.current = setTimeout(() => {
      triggerHaptic('heavy');
      onToggleLock(cardId);
    }, 500);
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  return (
    <div
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      className="relative select-none"
    >
      {children}
      {isLocked && (
        <div className="absolute top-1 right-1 bg-amber-400 text-slate-950 p-1 rounded-full shadow-md z-20">
          <Lock size={12} />
        </div>
      )}
    </div>
  );
};
