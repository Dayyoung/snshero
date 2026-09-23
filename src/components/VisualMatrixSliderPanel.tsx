/**
 * VisualMatrixSliderPanel.tsx - SCR-12-23
 * 파티클/텍스처/포일/블룸 4개 그래픽 옵션을 5단계로 조절하는 48px 비주얼 매트릭스 슬라이더 패널
 */

import React from 'react';
import { Sliders, Sparkles, Layers, Eye } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface VisualSettings {
  particles: number; // 1-5
  textures: number;  // 1-5
  foil: number;      // 1-5
  bloom: number;     // 1-5
}

interface VisualMatrixSliderPanelProps {
  settings: VisualSettings;
  onChange: (newSettings: VisualSettings) => void;
}

export const VisualMatrixSliderPanel: React.FC<VisualMatrixSliderPanelProps> = ({
  settings,
  onChange,
}) => {
  const items: { key: keyof VisualSettings; label: string; icon: React.ReactNode }[] = [
    { key: 'particles', label: '파티클 밀도', icon: <Sparkles size={14} /> },
    { key: 'textures', label: '텍스처 해상도', icon: <Layers size={14} /> },
    { key: 'foil', label: '홀로포일 반사', icon: <Eye size={14} /> },
    { key: 'bloom', label: '블룸 광원 효과', icon: <Sliders size={14} /> },
  ];

  const handleStep = (key: keyof VisualSettings, val: number) => {
    triggerHaptic('selection');
    onChange({ ...settings, [key]: val });
  };

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col gap-3 font-mono select-none">
      <div className="text-xs font-black text-white flex items-center gap-1.5">
        <Sliders size={14} className="text-amber-400" />
        <span>비주얼 매트릭스 정밀 조절</span>
      </div>

      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.key} className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-slate-300">
              {it.icon}
              <span>{it.label}</span>
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleStep(it.key, lvl)}
                  className={`w-7 h-7 rounded-lg text-[10px] font-black cursor-pointer transition ${
                    settings[it.key] === lvl
                      ? 'bg-amber-400 text-slate-950 shadow'
                      : 'bg-slate-900 text-slate-500 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
