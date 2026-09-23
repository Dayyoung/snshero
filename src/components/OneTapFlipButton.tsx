/**
 * OneTapFlipButton.tsx - SCR-05-23
 * 매수 즉시 추천 시장가로 자동 재출품(Flip)되는 48px 1-Tap 플립 버튼
 */

import React from 'react';
import { RefreshCw, ArrowRightLeft } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface OneTapFlipButtonProps {
  recommendedFlipPrice: number;
  onFlip: () => void;
}

export const OneTapFlipButton: React.FC<OneTapFlipButtonProps> = ({
  recommendedFlipPrice,
  onFlip,
}) => {
  return (
    <button
      type="button"
      onClick={() => {
        triggerHaptic('heavy');
        onFlip();
      }}
      className="h-12 w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg font-mono select-none"
    >
      <ArrowRightLeft size={16} />
      <span>즉시 매수 후 재출품 (플립가: {recommendedFlipPrice} G)</span>
    </button>
  );
};
