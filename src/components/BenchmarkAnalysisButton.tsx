/**
 * BenchmarkAnalysisButton.tsx - SCR-10-23
 * 랭커 탭 시 즉시 전력 대조를 실행하는 48px 원터치 벤치마킹 버튼
 */

import React from 'react';
import { Crosshair } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface BenchmarkAnalysisButtonProps {
  onAnalyze: () => void;
}

export const BenchmarkAnalysisButton: React.FC<BenchmarkAnalysisButtonProps> = ({
  onAnalyze,
}) => {
  return (
    <button
      type="button"
      onClick={() => {
        triggerHaptic('medium');
        onAnalyze();
      }}
      className="h-12 w-full bg-slate-900 border border-amber-400 text-amber-300 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow font-mono select-none"
    >
      <Crosshair size={16} />
      <span>내 덱과 1:1 전력 벤치마킹 비교</span>
    </button>
  );
};
