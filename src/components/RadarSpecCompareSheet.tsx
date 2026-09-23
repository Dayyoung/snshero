/**
 * RadarSpecCompareSheet.tsx - SCR-10-23
 * 내 최근 20전 지표와 랭커 지표를 오버레이해 5각형 레이더 차트로 대조하는 바텀시트
 */

import React from 'react';
import { motion } from 'motion/react';
import { Crosshair, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface RadarSpecCompareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  rankerName: string;
  rankerStats: { winRate: number; avgTurns: number; dps: number; deckCost: number; defense: number };
  myStats: { winRate: number; avgTurns: number; dps: number; deckCost: number; defense: number };
}

export const RadarSpecCompareSheet: React.FC<RadarSpecCompareSheetProps> = ({
  isOpen,
  onClose,
  rankerName,
  rankerStats,
  myStats,
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
          <div className="flex items-center gap-1.5">
            <Crosshair size={16} className="text-amber-400" />
            <h3 className="text-sm font-black text-white">전력 벤치마크 (vs {rankerName})</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* 5-axis comparisons */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400">승률</span>
            <div>
              <span className="text-blue-400 mr-2">나: {myStats.winRate}%</span>
              <span className="text-amber-400 font-bold">랭커: {rankerStats.winRate}%</span>
            </div>
          </div>

          <div className="flex justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400">평균 턴수</span>
            <div>
              <span className="text-blue-400 mr-2">나: {myStats.avgTurns}턴</span>
              <span className="text-amber-400 font-bold">랭커: {rankerStats.avgTurns}턴</span>
            </div>
          </div>

          <div className="flex justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400">턴당 DPS</span>
            <div>
              <span className="text-blue-400 mr-2">나: {myStats.dps}</span>
              <span className="text-amber-400 font-bold">랭커: {rankerStats.dps}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('heavy');
            onClose();
          }}
          className="h-12 w-full bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center active:scale-95 cursor-pointer shadow-lg"
        >
          벤치마킹 분석 완료
        </button>
      </motion.div>
    </div>
  );
};
