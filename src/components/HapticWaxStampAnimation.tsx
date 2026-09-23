/**
 * HapticWaxStampAnimation.tsx - SCR-11-20
 * 일일 퀘스트 올클리어 시 황금 COMPLETED 실링 왁스 스탬프가 쾅 찍히는 햅틱 임팩트 연출
 */

import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Award } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface HapticWaxStampAnimationProps {
  onAnimationEnd?: () => void;
}

export const HapticWaxStampAnimation: React.FC<HapticWaxStampAnimationProps> = ({
  onAnimationEnd,
}) => {
  useEffect(() => {
    // Heavy haptic when stamp impacts
    const t = setTimeout(() => {
      triggerHaptic('heavy');
      if (onAnimationEnd) onAnimationEnd();
    }, 300);
    return () => clearTimeout(t);
  }, [onAnimationEnd]);

  return (
    <motion.div
      initial={{ scale: 3, opacity: 0, rotate: -25 }}
      animate={{ scale: 1, opacity: 1, rotate: -12 }}
      transition={{ type: 'spring', damping: 14, stiffness: 200 }}
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center font-mono select-none"
    >
      <div className="border-4 border-amber-400 bg-amber-500/90 text-slate-950 font-black px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 transform -rotate-12 backdrop-blur-xs">
        <Award size={28} className="text-slate-950" />
        <span className="text-xl tracking-wider">ALL COMPLETED!</span>
      </div>
    </motion.div>
  );
};
