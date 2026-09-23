/**
 * MagneticPositionSwap.tsx - SCR-03-23
 * 전후열 슬롯 접근 시 자리바꿈 애니메이션과 햅틱을 주는 마그네틱 포지션 스왑 래퍼
 */

import React from 'react';
import { motion } from 'motion/react';
import { triggerHaptic } from '../lib/haptic';

interface MagneticPositionSwapProps {
  index: number;
  isHoveredOver: boolean;
  onSwapPositions: (targetIndex: number) => void;
  children: React.ReactNode;
}

export const MagneticPositionSwap: React.FC<MagneticPositionSwapProps> = ({
  index,
  isHoveredOver,
  onSwapPositions,
  children,
}) => {
  return (
    <motion.div
      layout
      animate={isHoveredOver ? { scale: 1.05, y: -4 } : { scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      onPointerEnter={() => {
        if (isHoveredOver) {
          triggerHaptic('selection');
        }
      }}
      onClick={() => {
        triggerHaptic('medium');
        onSwapPositions(index);
      }}
      className={`rounded-2xl transition-colors cursor-pointer ${
        isHoveredOver ? 'border-2 border-amber-400 bg-amber-950/20 shadow-lg' : ''
      }`}
    >
      {children}
    </motion.div>
  );
};
