/**
 * ReplayScrubberSlider.tsx - SCR-10-17
 * 역전 순간을 슬로우모션으로 돌려보는 48px 인터랙티브 리플레이 스크러버
 */

import React, { useState } from 'react';
import { Play, Pause, RotateCcw, FastForward, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface ReplayScrubberSliderProps {
  totalTurns: number;
  onTurnChange: (turn: number) => void;
}

export const ReplayScrubberSlider: React.FC<ReplayScrubberSliderProps> = ({
  totalTurns,
  onTurnChange,
}) => {
  const [currentTurn, setCurrentTurn] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 font-mono select-none">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-400">턴 진행도</span>
        <span className="text-amber-400 font-bold">{currentTurn} / {totalTurns} 턴</span>
      </div>

      <input
        type="range"
        min={1}
        max={totalTurns}
        value={currentTurn}
        onChange={(e) => {
          const val = Number(e.target.value);
          setCurrentTurn(val);
          triggerHaptic('selection');
          onTurnChange(val);
        }}
        className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
      />

      <div className="flex items-center justify-center gap-3 mt-1">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            setCurrentTurn(1);
            onTurnChange(1);
          }}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 active:scale-95 cursor-pointer"
        >
          <RotateCcw size={14} />
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('heavy');
            setIsPlaying((p) => !p);
          }}
          className="h-9 px-4 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 active:scale-95 cursor-pointer shadow"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span>{isPlaying ? '일시정지' : '재생'}</span>
        </button>
      </div>
    </div>
  );
};
