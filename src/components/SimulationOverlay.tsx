import React from 'react';
import { X, Play, Square, Activity } from 'lucide-react';
import { Language, ViewType } from '../types';

export interface SimulationOverlayProps {
  language: Language;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  isAutoLoop: boolean;
  setIsAutoLoop: (loop: boolean) => void;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  setIsAutoBattle: (auto: boolean) => void;
  isAutoBattle: boolean;
  sns: number;
  onError?: (error: any) => void;
  onComplete?: (report: any) => void;
}

export const SimulationOverlay: React.FC<SimulationOverlayProps> = ({
  language,
  isActive,
  setIsActive,
  isAutoLoop,
  setIsAutoLoop,
  currentView,
  onNavigate,
  setIsAutoBattle,
  isAutoBattle,
  sns,
}) => {
  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-3 bg-[#0f0000]/95 text-white border border-white/20 rounded-sm shadow-xl flex flex-col gap-2 font-mono text-xs max-w-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold flex items-center gap-1.5 text-amber-400">
          <Activity size={14} className="animate-pulse" />
          <span>SIMULATION RUNNER</span>
        </span>
        <button
          onClick={() => setIsActive(false)}
          className="text-white/60 hover:text-white cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      <div className="text-[11px] text-white/70">
        <div>View: {currentView}</div>
        <div>AutoBattle: {isAutoBattle ? 'ON' : 'OFF'}</div>
        <div>Loop: {isAutoLoop ? 'ON' : 'OFF'}</div>
      </div>

      <div className="flex gap-2 pt-1 border-t border-white/10">
        <button
          onClick={() => setIsAutoBattle(!isAutoBattle)}
          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-sm cursor-pointer"
        >
          Toggle Battle
        </button>
        <button
          onClick={() => setIsAutoLoop(!isAutoLoop)}
          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-sm cursor-pointer"
        >
          Toggle Loop
        </button>
      </div>
    </div>
  );
};

export default SimulationOverlay;
