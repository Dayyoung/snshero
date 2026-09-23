/**
 * HandednessLayoutSwitcher.tsx - SCR-02-14
 * 왼손/오른손잡이 원터치 레이아웃 미러링 토글 (44px 터치 타깃)
 */

import React from 'react';
import { triggerHaptic } from '../lib/haptic';

interface HandednessLayoutSwitcherProps {
  isLeftHanded: boolean;
  onToggle: () => void;
  language?: string;
}

export const HandednessLayoutSwitcher: React.FC<HandednessLayoutSwitcherProps> = ({
  isLeftHanded,
  onToggle,
  language = 'ko',
}) => {
  return (
    <button
      type="button"
      onClick={() => {
        triggerHaptic('light');
        onToggle();
      }}
      className="h-11 px-3 bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-slate-700 rounded-sm font-mono text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all select-none cursor-pointer"
      title={language === 'ko' ? '왼손/오른손 모드 전환' : 'Toggle Left/Right Handed Layout'}
    >
      <span className="text-sm">{isLeftHanded ? '👈' : '👉'}</span>
      <span className="font-bold">
        {isLeftHanded
          ? (language === 'ko' ? '왼손 모드' : 'Left-hand')
          : (language === 'ko' ? '오른손 모드' : 'Right-hand')}
      </span>
    </button>
  );
};
