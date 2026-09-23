/**
 * GachaRateBottomSheet.tsx - SCR-04-20
 * 44px 칩 탭 시 확률과 천장을 보여주는 하프 바텀시트
 */

import React from 'react';
import { motion } from 'motion/react';
import { Percent, X, Shield, Sparkles, Trophy } from 'lucide-react';

interface GachaRateBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pityCount: number;
  maxPity: number;
}

export const GachaRateBottomSheet: React.FC<GachaRateBottomSheetProps> = ({
  isOpen,
  onClose,
  pityCount,
  maxPity,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col justify-end font-mono select-none">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-slate-950 border-t-2 border-amber-400 rounded-t-3xl p-5 max-w-lg mx-auto w-full flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent size={18} className="text-amber-400" />
            <h3 className="text-sm font-black text-white">소환 확률 및 천장 보장</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Pity Progress */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-amber-400" />
            <span className="text-slate-300 font-bold">SSR 천장 보장</span>
          </div>
          <span className="text-amber-400 font-black">
            {pityCount} / {maxPity} 회 (잔여 {Math.max(0, maxPity - pityCount)}회)
          </span>
        </div>

        {/* Rates Table */}
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex justify-between p-2 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 font-bold">
            <span>✨ SSR (최고 등급)</span>
            <span>3.00%</span>
          </div>
          <div className="flex justify-between p-2 rounded-xl bg-purple-950/20 border border-purple-500/30 text-purple-300 font-bold">
            <span>🔮 SR (특수 등급)</span>
            <span>15.00%</span>
          </div>
          <div className="flex justify-between p-2 rounded-xl bg-blue-950/20 border border-blue-500/30 text-blue-300 font-bold">
            <span>🔷 R (희귀 등급)</span>
            <span>42.00%</span>
          </div>
          <div className="flex justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
            <span>⚪ N (일반 등급)</span>
            <span>40.00%</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
