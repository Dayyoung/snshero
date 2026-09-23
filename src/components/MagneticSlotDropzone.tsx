/**
 * MagneticSlotDropzone.tsx - SCR-02-23
 * 드래그 중인 카드가 반경 50px에 접근 시 자석처럼 끌어당기는 마그네틱 슬롯 드롭존
 */

import React from 'react';
import { triggerHaptic } from '../lib/haptic';

interface MagneticSlotDropzoneProps {
  slotIndex: number;
  isSnapped: boolean;
  onDropCard: (slotIndex: number) => void;
  children: React.ReactNode;
}

export const MagneticSlotDropzone: React.FC<MagneticSlotDropzoneProps> = ({
  slotIndex,
  isSnapped,
  onDropCard,
  children,
}) => {
  return (
    <div
      onClick={() => {
        triggerHaptic('medium');
        onDropCard(slotIndex);
      }}
      className={`relative rounded-2xl transition-all duration-150 flex items-center justify-center ${
        isSnapped
          ? 'scale-105 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] bg-amber-950/20'
          : 'border border-slate-800 bg-slate-950/60'
      }`}
    >
      {children}
    </div>
  );
};
