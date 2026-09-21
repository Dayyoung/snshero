/**
 * CardSmashGestureTrigger.tsx - SCR-08-17
 * 양손 엄지로 재료 카드를 중앙으로 밀어 충돌시키는 스매시(Smash) 제스처 융합 트리거
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface CardSmashGestureTriggerProps {
  onSmashComplete: () => void;
}

export const CardSmashGestureTrigger: React.FC<CardSmashGestureTriggerProps> = ({
  onSmashComplete,
}) => {
  const [distance, setDistance] = useState(100);

  const handleSimulatedSmash = () => {
    triggerHaptic('heavy');
    setDistance(0);
    setTimeout(() => {
      onSmashComplete();
      setDistance(100);
    }, 400);
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 font-mono select-none my-2">
      <div className="text-[11px] text-slate-400 flex items-center gap-1">
        <span>양손 엄지 스매시 융합 제스처</span>
        <Sparkles size={13} className="text-amber-400" />
      </div>

      <div className="relative w-64 h-24 flex items-center justify-between px-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Left Card Material */}
        <motion.div
          animate={{ x: distance === 0 ? 70 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-14 h-20 bg-amber-500/20 border-2 border-amber-400 rounded-xl flex flex-col items-center justify-center text-amber-400 text-xs font-bold"
        >
          <span>재료 1</span>
          <ArrowRight size={14} className="mt-1" />
        </motion.div>

        {/* Center Smash Target */}
        <button
          type="button"
          onClick={handleSimulatedSmash}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-xs cursor-pointer shadow-lg active:scale-90"
        >
          SMASH
        </button>

        {/* Right Card Material */}
        <motion.div
          animate={{ x: distance === 0 ? -70 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-14 h-20 bg-purple-500/20 border-2 border-purple-400 rounded-xl flex flex-col items-center justify-center text-purple-400 text-xs font-bold"
        >
          <span>재료 2</span>
          <ArrowLeft size={14} className="mt-1" />
        </motion.div>
      </div>
    </div>
  );
};
