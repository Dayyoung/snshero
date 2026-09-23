/**
 * EqualizerPresetChips.tsx - SCR-12-20
 * 베이스 부스트 / 보컬 명료도 / 야간 모드 등을 전환하는 1-Tap 스마트 오디오 EQ 칩
 */

import React from 'react';
import { Headphones, Volume2, Moon, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export type EqMode = 'flat' | 'bass' | 'vocal' | 'night';

interface EqualizerPresetChipsProps {
  currentMode: EqMode;
  onChangeMode: (mode: EqMode) => void;
}

export const EqualizerPresetChips: React.FC<EqualizerPresetChipsProps> = ({
  currentMode,
  onChangeMode,
}) => {
  const modes: { id: EqMode; label: string; icon: React.ReactNode }[] = [
    { id: 'flat', label: '표준(Flat)', icon: <Volume2 size={12} /> },
    { id: 'bass', label: '베이스 부스트', icon: <Headphones size={12} /> },
    { id: 'vocal', label: '보컬 명료도', icon: <Sparkles size={12} /> },
    { id: 'night', label: '야간 저음제어', icon: <Moon size={12} /> },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 font-mono select-none">
      {modes.map((m) => {
        const isSelected = currentMode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onChangeMode(m.id);
            }}
            className={`h-10 px-3 rounded-xl border text-xs font-bold shrink-0 flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
              isSelected
                ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            {m.icon}
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
};
