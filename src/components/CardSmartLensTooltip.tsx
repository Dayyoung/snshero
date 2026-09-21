/**
 * CardSmartLensTooltip.tsx - SCR-03-14
 * 1-Tap 스마트 렌즈: 스킬 및 룬 영역 탭 시 즉시 표시되는 마이크로 툴팁
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Shield, Sparkles, X } from 'lucide-react';

interface CardSmartLensTooltipProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  type?: 'skill' | 'rune' | 'passive';
  position?: { x: number; y: number };
}

export const CardSmartLensTooltip: React.FC<CardSmartLensTooltipProps> = ({
  isOpen,
  onClose,
  title,
  description,
  type = 'skill',
  position,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 font-mono select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xs bg-slate-900 border border-amber-400/80 rounded-lg p-3 text-white shadow-2xl relative"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-700">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black">
              {type === 'skill' ? <Zap size={14} className="text-amber-400" /> : <Sparkles size={14} className="text-purple-400" />}
              <span>[1-TAP LENS: {title}]</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-xs text-slate-200 mt-2 leading-relaxed">
            {description}
          </p>

          <div className="mt-2 text-[10px] text-amber-400/80 text-right">
            🔍 스마트 렌즈 분석 완료
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
