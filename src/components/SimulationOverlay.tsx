import React from 'react';
import { X, PlayCircle } from 'lucide-react';
import { Language } from '../types';

interface SimulationOverlayProps {
  language: Language;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  isAutoLoop?: boolean;
  setIsAutoLoop?: (loop: boolean) => void;
  currentView?: string;
  onNavigate?: (view: any) => void;
  setIsAutoBattle?: (auto: boolean) => void;
  isAutoBattle?: boolean;
  sns?: number;
  onError?: (err: any) => void;
}

export const SimulationOverlay: React.FC<SimulationOverlayProps> = ({
  language,
  isActive,
  setIsActive
}) => {
  if (!isActive) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-[#201d1d] text-white p-3 rounded-sm font-mono text-xs shadow-lg flex items-center gap-3 border border-white/20">
      <div className="flex items-center gap-1.5">
        <PlayCircle size={15} className="text-emerald-400 animate-pulse" />
        <span className="font-bold">{language === 'ko' ? '시뮬레이션 모드 가동 중' : 'Simulation Active'}</span>
      </div>
      <button
        type="button"
        onClick={() => setIsActive(false)}
        className="p-1 hover:bg-white/10 rounded cursor-pointer"
        title="Stop"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default SimulationOverlay;
