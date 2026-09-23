/**
 * WarpTransitionOverlay.tsx - SCR-11-14
 * 퀘스트 바로가기 실행 시 화면이 우주선 워프처럼 목표 콘텐츠로 줌인되는 60fps 워프 트랜지션
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface WarpTransitionOverlayProps {
  isActive: boolean;
  onFinished: () => void;
}

export const WarpTransitionOverlay: React.FC<WarpTransitionOverlayProps> = ({
  isActive,
  onFinished,
}) => {
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(onFinished, 450);
      return () => clearTimeout(timer);
    }
  }, [isActive, onFinished]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1.5 }}
      exit={{ opacity: 0, scale: 2 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-radial from-transparent via-cyan-500/20 to-black/80"
    >
      <div className="w-96 h-96 rounded-full border-4 border-cyan-400/80 animate-ping" />
    </motion.div>
  );
};
