/**
 * SwipeToConfirmBar.tsx - SCR-04-23
 * 오터치 방지를 위한 스와이프 투 컨펌(Swipe to Confirm) 결제 슬라이더 바 (48px)
 */

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { ChevronRight, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface SwipeToConfirmBarProps {
  onConfirm: () => void;
  priceText: string;
}

export const SwipeToConfirmBar: React.FC<SwipeToConfirmBarProps> = ({
  onConfirm,
  priceText,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 180], [1, 0]);

  return (
    <div className="relative h-12 w-full max-w-xs bg-slate-900 border border-slate-700 rounded-full overflow-hidden p-1 flex items-center select-none font-mono">
      <motion.span
        style={{ opacity }}
        className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-400 pointer-events-none"
      >
        밀어서 결제 확정 ({priceText})
      </motion.span>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 200 }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 150) {
            triggerHaptic('heavy');
            setConfirmed(true);
            onConfirm();
          } else {
            x.set(0);
          }
        }}
        className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black cursor-grab active:cursor-grabbing shadow-lg"
      >
        {confirmed ? <Check size={18} /> : <ChevronRight size={18} />}
      </motion.div>
    </div>
  );
};
