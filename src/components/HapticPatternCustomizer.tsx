/**
 * HapticPatternCustomizer.tsx - SCR-12-20
 * 진동 리듬과 진폭을 직접 선택하는 햅틱 리듬 커스터마이저
 */

import React from 'react';
import { Smartphone, Zap, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export type HapticRhythm = 'crisp' | 'double_pulse' | 'heavy_rumble' | 'soft_tick';

interface HapticPatternCustomizerProps {
  currentPattern: HapticRhythm;
  onSelectPattern: (pattern: HapticRhythm) => void;
}

export const HapticPatternCustomizer: React.FC<HapticPatternCustomizerProps> = ({
  currentPattern,
  onSelectPattern,
}) => {
  const patterns: { id: HapticRhythm; label: string; desc: string }[] = [
    { id: 'crisp', label: '단타 크리스프', desc: '짧고 명확한 기계식 클릭' },
    { id: 'double_pulse', label: '더블 펄스', desc: '경쾌한 연속 2회 탭' },
    { id: 'heavy_rumble', label: '묵직한 진동', desc: '타격감 중심 강한 럼블' },
    { id: 'soft_tick', label: '소프트 틱', desc: '배터리 절약 미세 진동' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 font-mono select-none">
      {patterns.map((p) => {
        const isSelected = currentPattern === p.id;
        return (
          <div
            key={p.id}
            onClick={() => {
              if (p.id === 'crisp') triggerHaptic('selection');
              else if (p.id === 'double_pulse') {
                triggerHaptic('medium');
                setTimeout(() => triggerHaptic('medium'), 80);
              } else if (p.id === 'heavy_rumble') triggerHaptic('heavy');
              else triggerHaptic('selection');

              onSelectPattern(p.id);
            }}
            className={`p-3 rounded-2xl border text-left cursor-pointer transition active:scale-95 ${
              isSelected
                ? 'bg-amber-950/40 border-amber-400 text-amber-300 shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="text-xs font-black block text-white">{p.label}</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{p.desc}</span>
          </div>
        );
      })}
    </div>
  );
};
