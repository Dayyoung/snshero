import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../lib/haptic';

interface HapticVibrationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type HapticStrength = 'weak' | 'normal' | 'strong';

/**
 * ID 415: 모바일 햅틱 진동 On/Off 및 강도(약/중/강) 커스텀 설정 모달
 */
export const HapticVibrationSettingsModal: React.FC<HapticVibrationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [enabled, setEnabled] = useState<boolean>(() => {
    return localStorage.getItem('hero_haptic_enabled') !== 'false';
  });

  const [strength, setStrength] = useState<HapticStrength>(() => {
    const s = localStorage.getItem('hero_haptic_strength');
    return (s as HapticStrength) || 'normal';
  });

  useEffect(() => {
    localStorage.setItem('hero_haptic_enabled', enabled ? 'true' : 'false');
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem('hero_haptic_strength', strength);
  }, [strength]);

  if (!isOpen) return null;

  const handleTestVibration = (lvl: HapticStrength) => {
    if (!enabled) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (lvl === 'weak') {
        navigator.vibrate(15);
      } else if (lvl === 'normal') {
        navigator.vibrate(35);
      } else {
        navigator.vibrate([60, 40, 60]);
      }
    } else {
      triggerHaptic('light');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-mono select-none">
      <div className="bg-[#fdfcfc] dark:bg-[#1a1717] border border-[#201d1d]/20 dark:border-white/20 p-5 max-w-sm w-full shadow-2xl rounded-none flex flex-col gap-4">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-[#201d1d]/10 dark:border-white/10 pb-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#201d1d]/60 dark:text-white/60">
              [HAPTIC VIBRATION PREFERENCES]
            </span>
            <h3 className="text-sm font-black text-[#201d1d] dark:text-white">
              모바일 햅틱 진동 설정
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 border border-[#201d1d]/20 dark:border-white/20 hover:bg-black/5"
          >
            [X]
          </button>
        </div>

        {/* Toggle On/Off */}
        <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-3">
          <span className="text-xs font-bold text-[#201d1d] dark:text-white">
            터치 햅틱 피드백 사용
          </span>
          <button
            onClick={() => {
              const next = !enabled;
              setEnabled(next);
              if (next) triggerHaptic('victory');
            }}
            className={`px-3 py-1 text-xs font-bold transition-all ${
              enabled
                ? 'bg-emerald-600 text-white'
                : 'bg-black/20 dark:bg-white/20 text-[#201d1d]/60 dark:text-white/60'
            }`}
          >
            {enabled ? '[ ON ]' : '[ OFF ]'}
          </button>
        </div>

        {/* Strength Options */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground font-bold">진동 강도 조절</div>
          <div className="grid grid-cols-3 gap-2">
            {(['weak', 'normal', 'strong'] as const).map(lvl => (
              <button
                key={lvl}
                disabled={!enabled}
                onClick={() => {
                  setStrength(lvl);
                  handleTestVibration(lvl);
                }}
                className={`py-2 px-1 text-xs font-bold text-center border transition-all ${
                  strength === lvl
                    ? 'border-[#201d1d] dark:border-white bg-[#201d1d] text-white dark:bg-white dark:text-[#201d1d]'
                    : 'border-[#201d1d]/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5'
                } ${!enabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
              >
                {lvl === 'weak' ? '약하게' : lvl === 'normal' ? '보통' : '강하게'}
              </button>
            ))}
          </div>
        </div>

        {/* Test Button */}
        <button
          disabled={!enabled}
          onClick={() => handleTestVibration(strength)}
          className="w-full py-2 border border-dashed border-[#201d1d]/30 dark:border-white/30 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40"
        >
          [!] 현재 진동 강도 테스트
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full py-2 bg-[#201d1d] text-white dark:bg-white dark:text-[#201d1d] text-xs font-bold uppercase tracking-wider"
        >
          설정 완료 및 닫기
        </button>
      </div>
    </div>
  );
};
