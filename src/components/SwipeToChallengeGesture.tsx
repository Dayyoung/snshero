/**
 * SwipeToChallengeGesture.tsx - SCR-10-14
 * 라이벌 카드를 위로 스와이프 시 햅틱 진동과 함께 즉시 대전 매칭으로 직행하는 원터치 제스처 컴포넌트
 */

import React, { useState, useRef } from 'react';
import { motion, PanInfo } from 'motion/react';
import { Swords, ArrowUp, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface SwipeToChallengeGestureProps {
  rivalName: string;
  onChallenge: () => void;
  children: React.ReactNode;
}

export const SwipeToChallengeGesture: React.FC<SwipeToChallengeGestureProps> = ({
  rivalName,
  onChallenge,
  children,
}) => {
  const [dragOffset, setDragOffset] = useState(0);
  const isTriggeredRef = useRef(false);

  const handleDrag = (_: any, info: PanInfo) => {
    // Only track upward drag (negative Y)
    if (info.offset.y < 0) {
      setDragOffset(info.offset.y);
      if (info.offset.y < -70 && !isTriggeredRef.current) {
        triggerHaptic('heavy');
      }
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y < -80 && !isTriggeredRef.current) {
      isTriggeredRef.current = true;
      triggerHaptic('heavy');
      onChallenge();
    }
    setDragOffset(0);
    setTimeout(() => {
      isTriggeredRef.current = false;
    }, 500);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl select-none">
      {/* Upward Swipe Guide Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-rose-950/40 to-rose-600/60 flex flex-col items-center justify-start pt-2 pointer-events-none text-rose-300 font-mono text-[10px] font-bold">
        <ArrowUp size={16} className="animate-bounce" />
        <span>위로 스와이프하여 {rivalName}에게 즉시 결투 신청!</span>
      </div>

      <motion.div
        drag="y"
        dragConstraints={{ top: -100, bottom: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="relative z-10 bg-slate-900 touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
};
