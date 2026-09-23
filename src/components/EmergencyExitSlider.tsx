/**
 * EmergencyExitSlider.tsx - SCR-06-20
 * 하단 Thumb Zone 48px 원터치 시장가 전량 긴급 청산(Panic Exit) 슬라이더
 */

import React, { useState } from 'react';
import { AlertTriangle, ChevronsRight, ShieldAlert } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface EmergencyExitSliderProps {
  onConfirmExit: () => void;
}

export const EmergencyExitSlider: React.FC<EmergencyExitSliderProps> = ({
  onConfirmExit,
}) => {
  const [sliderValue, setSliderValue] = useState(0);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderValue(val);
    triggerHaptic('selection');

    if (val >= 95) {
      triggerHaptic('heavy');
      onConfirmExit();
      setSliderValue(0);
    }
  };

  const handleSliderEnd = () => {
    if (sliderValue < 95) {
      setSliderValue(0);
    }
  };

  return (
    <div className="w-full bg-rose-950/40 border border-rose-600/70 rounded-2xl p-2.5 flex flex-col gap-1.5 font-mono select-none">
      <div className="flex justify-between items-center text-[10px] text-rose-300 font-bold px-1">
        <div className="flex items-center gap-1">
          <AlertTriangle size={12} className="text-rose-400" />
          <span>긴급 시장가 전량 청산 (슬라이드)</span>
        </div>
        <span>{sliderValue}%</span>
      </div>

      <div className="relative w-full h-11 bg-slate-900 rounded-xl overflow-hidden flex items-center px-2">
        <div
          className="absolute inset-y-0 left-0 bg-rose-600/60 transition-all pointer-events-none"
          style={{ width: `${sliderValue}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-rose-200 pointer-events-none gap-1">
          <ChevronsRight size={14} className="animate-pulse" />
          <span>우측으로 밀어 즉시 청산</span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={sliderValue}
          onChange={handleSliderChange}
          onMouseUp={handleSliderEnd}
          onTouchEnd={handleSliderEnd}
          className="w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>
    </div>
  );
};
