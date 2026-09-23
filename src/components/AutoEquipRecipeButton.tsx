/**
 * AutoEquipRecipeButton.tsx - SCR-08-14
 * 보유 재료를 1초 만에 융합 슬롯으로 자동 배치하는 48px 원탭 버튼
 */

import React from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface AutoEquipRecipeButtonProps {
  onAutoEquip: () => void;
  disabled?: boolean;
  language?: string;
}

export const AutoEquipRecipeButton: React.FC<AutoEquipRecipeButtonProps> = ({
  onAutoEquip,
  disabled = false,
  language = 'ko',
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        triggerHaptic('heavy');
        onAutoEquip();
      }}
      className="h-12 w-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer font-mono select-none border border-amber-300"
    >
      <Zap size={18} className="fill-slate-950 text-slate-950" />
      <span>{language === 'ko' ? '⚡ [1-Tap] 보유 재료 자동 최적 배치' : '⚡ [1-Tap] Auto-Equip Materials'}</span>
    </button>
  );
};
