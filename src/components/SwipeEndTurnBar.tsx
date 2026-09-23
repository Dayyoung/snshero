/**
 * SwipeEndTurnBar.tsx - SCR-02-17
 * 모바일 하단 엄지 도달 범위(Thumb Zone)에 위치하여 우측 스와이프로 턴을 종료하는 원핸드 제스처 바 (48px)
 */

import React, { useState } from 'react';
import { motion, PanInfo } from 'motion/react';
import { ChevronRight, ChevronsRight, Shield, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface SwipeEndTurnBarProps {
  onEndTurn: () => void;
  disabled?: boolean;
}

export const SwipeEndTurnBar: React.FC<SwipeEndTurnBarProps> = ({
  onEndTurn,
  disabled = false,
}) => {
  const [dragProgress, setDragProgress] = useState(0);

  const handleDrag = (_: any, info: PanInfo) => {
    if (disabled) return;
    const progress = Math.max(0, Math.min(1, info.offset.x / 140));
    setDragProgress(progress);
    if (progress > 0.8) {
      triggerHaptic('medium');
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (disabled) return;
    if (info.offset.x >= 120) {
      triggerHaptic('heavy');
      onEndTurn();
    }
    setDragProgress(0);
  };

  return (
    <div className="w-full h-12 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1 relative flex items-center overflow-hidden font-mono select-none shadow-lg">
      {/* Background hint text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-bold gap-1">
        <span>우측으로 밀어서 턴 종료</span>
        <ChevronsRight size={15} className="animate-pulse text-amber-400" />
      </div>

      {/* Draggable thumb slider */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 140 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="h-10 w-16 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-xl flex items-center justify-center text-slate-950 font-black cursor-grab active:cursor-grabbing shadow-md z-10"
      >
        <ChevronRight size={20} />
      </motion.div>
    </div>
  );
};
