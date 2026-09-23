/**
 * LandmarkFocusTrigger.tsx - SCR-01-23
 * 배경 속 경기장/상점 등 랜드마크 탭 시 카메라 줌인 및 48px 즉시 이동 트리거
 */

import React from 'react';
import { Compass, ExternalLink } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface LandmarkFocusTriggerProps {
  name: string;
  category: string;
  icon: string;
  onNavigate: () => void;
}

export const LandmarkFocusTrigger: React.FC<LandmarkFocusTriggerProps> = ({
  name,
  category,
  icon,
  onNavigate,
}) => {
  return (
    <button
      type="button"
      onClick={() => {
        triggerHaptic('medium');
        onNavigate();
      }}
      className="h-12 px-3.5 rounded-2xl bg-slate-950/80 border border-amber-400/80 backdrop-blur-md flex items-center gap-2 font-mono text-xs cursor-pointer shadow-lg active:scale-95 text-white"
    >
      <span className="text-base">{icon}</span>
      <div className="text-left">
        <span className="text-[9px] text-amber-400 block font-bold">{category}</span>
        <span className="text-xs font-black">{name}</span>
      </div>
      <ExternalLink size={12} className="text-slate-400 ml-1" />
    </button>
  );
};
