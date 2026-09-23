/**
 * FormationPresetDock.tsx - SCR-03-23
 * 하단에 진형을 0.1초 만에 바꾸는 48px 포메이션 프리셋 독
 */

import React from 'react';
import { Shield, Swords, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export type FormationType = 'balanced' | 'aggressive' | 'defensive';

interface FormationPresetDockProps {
  currentFormation: FormationType;
  onChangeFormation: (f: FormationType) => void;
}

export const FormationPresetDock: React.FC<FormationPresetDockProps> = ({
  currentFormation,
  onChangeFormation,
}) => {
  const presets: { id: FormationType; label: string; icon: React.ReactNode }[] = [
    { id: 'balanced', label: '밸런스 (2-1-2)', icon: <Zap size={14} /> },
    { id: 'aggressive', label: '돌격공격 (3-2)', icon: <Swords size={14} /> },
    { id: 'defensive', label: '철벽방어 (1-2-2)', icon: <Shield size={14} /> },
  ];

  return (
    <div className="h-12 w-full bg-slate-950/90 border-t border-slate-800 flex items-center justify-around px-2 font-mono select-none">
      {presets.map((p) => {
        const isSelected = currentFormation === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onChangeFormation(p.id);
            }}
            className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
              isSelected
                ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {p.icon}
            <span>{p.label}</span>
          </button>
        );
      })}
    </div>
  );
};
