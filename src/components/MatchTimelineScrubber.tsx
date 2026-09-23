/**
 * MatchTimelineScrubber.tsx - SCR-07-17
 * 엄지 드래그로 경기 주요 사건과 승률 변화를 탐색하는 인터랙티브 타임라인 스크러버
 */

import React, { useState } from 'react';
import { Play, RotateCcw, Activity } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface MatchEvent {
  minute: number;
  event: string;
  winRateTeamA: number;
}

interface MatchTimelineScrubberProps {
  events: MatchEvent[];
  onSelectMinute?: (minute: number) => void;
}

export const MatchTimelineScrubber: React.FC<MatchTimelineScrubberProps> = ({
  events,
  onSelectMinute,
}) => {
  const [currentMinute, setCurrentMinute] = useState(0);

  const activeEvent = events.find((e) => e.minute === currentMinute) || events[0];

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 font-mono select-none">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Activity size={14} className="text-amber-400" />
          <span className="font-bold">경기 승률 타임라인</span>
        </div>
        <span className="text-amber-400 font-black">{currentMinute}분 시점</span>
      </div>

      {/* Event Callout */}
      {activeEvent && (
        <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-300">{activeEvent.event}</span>
          <span className="text-emerald-400 font-bold">승률: {activeEvent.winRateTeamA}%</span>
        </div>
      )}

      {/* Scrubber Slider */}
      <input
        type="range"
        min={0}
        max={Math.max(1, ...events.map((e) => e.minute))}
        value={currentMinute}
        onChange={(e) => {
          const val = Number(e.target.value);
          setCurrentMinute(val);
          triggerHaptic('selection');
          onSelectMinute?.(val);
        }}
        className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
      />
    </div>
  );
};
