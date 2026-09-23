/**
 * AutoReinvestmentToggle.tsx - SCR-06-23
 * 1-Tap 스마트 복리 저금통 (배당금 자동 재투자 토글)
 */

import React from 'react';
import { PiggyBank } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface AutoReinvestmentToggleProps {
  enabled: boolean;
  onToggle: (nextState: boolean) => void;
}

export const AutoReinvestmentToggle: React.FC<AutoReinvestmentToggleProps> = ({
  enabled,
  onToggle,
}) => {
  return (
    <button
      type="button"
      onClick={() => {
        triggerHaptic('selection');
        onToggle(!enabled);
      }}
      className={`h-9 px-3 rounded-xl border flex items-center gap-1.5 font-mono text-xs cursor-pointer transition active:scale-95 select-none ${
        enabled
          ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 shadow-md'
          : 'bg-slate-900 border-slate-800 text-slate-400'
      }`}
    >
      <PiggyBank size={14} className={enabled ? 'text-emerald-400' : 'text-slate-500'} />
      <span>스마트 복리: {enabled ? 'ON' : 'OFF'}</span>
    </button>
  );
};
