/**
 * AutoRepeatToggleSwitch.tsx - SCR-08-29
 * 48px ergonomic thumb-zone toggle switch for continuous auto-repeat farming.
 * Persisted in localStorage (`hero_auto_repeat_battle`).
 */

import React, { useState, useEffect } from 'react';
import { RotateCw, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { cn } from '../lib/utils';

interface AutoRepeatToggleSwitchProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  countdown?: number | null;
  repeatCount?: number;
  className?: string;
}

export const AutoRepeatToggleSwitch: React.FC<AutoRepeatToggleSwitchProps> = ({
  enabled,
  onToggle,
  countdown = null,
  repeatCount = 0,
  className
}) => {
  const handleToggle = () => {
    triggerHaptic('medium');
    onToggle(!enabled);
  };

  return (
    <button
      type="button"
      id="auto-repeat-toggle-switch-btn"
      onClick={handleToggle}
      className={cn(
        "h-12 px-3.5 rounded-sm border flex items-center justify-between gap-3 font-mono transition-all active:scale-95 select-none cursor-pointer",
        enabled
          ? "bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/20"
          : "bg-stone-900/90 border-stone-700 text-stone-400 hover:bg-stone-800",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <RotateCw
          size={16}
          className={cn(
            "transition-transform",
            enabled ? "text-emerald-400 animate-spin" : "text-stone-500"
          )}
          style={{ animationDuration: '3s' }}
        />
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-black leading-tight tracking-tight">
            {enabled ? '자동 재도전 ON' : '자동 재도전 OFF'}
          </span>
          <span className="text-[8px] text-stone-400 leading-none mt-0.5">
            {enabled
              ? countdown !== null
                ? `${countdown}초 후 자동 시작 (${repeatCount}회 파밍)`
                : `연속 파밍 중 (${repeatCount}회)`
              : '터치하여 연속 파밍 시작'}
          </span>
        </div>
      </div>

      {/* Switch Track & Knob */}
      <div
        className={cn(
          "w-10 h-6 rounded-full p-0.5 transition-colors relative flex items-center",
          enabled ? "bg-emerald-500" : "bg-stone-700"
        )}
      >
        <div
          className={cn(
            "w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform",
            enabled ? "translate-x-4 text-emerald-600" : "translate-x-0 text-stone-500"
          )}
        >
          {enabled && <Check size={10} strokeWidth={3} />}
        </div>
      </div>
    </button>
  );
};
