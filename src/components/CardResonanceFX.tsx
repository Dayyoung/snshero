/**
 * CardResonanceFX.tsx
 * 대전 진입 시 3카드 속성 공명 시너지 팡파레 연출 컴포넌트
 * (구글 스프레드시트 Row 840 / ID 561 요구사항 구현)
 */

import React, { useEffect, useState } from 'react';
import { ResonanceBuff } from '../lib/deckResonanceEngine';
import { Sparkles, Shield, Zap } from 'lucide-react';

interface CardResonanceFXProps {
  buff: ResonanceBuff | null;
  onAnimationEnd?: () => void;
}

export const CardResonanceFX: React.FC<CardResonanceFXProps> = ({
  buff,
  onAnimationEnd,
}) => {
  const [visible, setVisible] = useState(Boolean(buff));

  useEffect(() => {
    if (!buff) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onAnimationEnd?.();
    }, 1800);
    return () => clearTimeout(timer);
  }, [buff, onAnimationEnd]);

  if (!visible || !buff) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4 font-mono select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#201d1d]/90 text-[#fdfcfc] border border-amber-400/40 p-4 max-w-sm w-full shadow-2xl backdrop-blur-md rounded-none text-center space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs uppercase font-bold tracking-widest">
          <Sparkles size={14} className="animate-spin" />
          <span>ELEMENTAL RESONANCE</span>
        </div>

        <h3 className="text-base font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]">
          {buff.title}
        </h3>

        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold rounded-sm flex items-center gap-1">
            <Zap size={11} />
            {buff.badge}
          </span>
          {buff.shieldBonus > 0 && (
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[11px] font-bold rounded-sm flex items-center gap-1">
              <Shield size={11} />
              +{buff.shieldBonus} SHIELD
            </span>
          )}
        </div>

        <p className="text-[10px] text-[#aaa] leading-tight">
          {buff.description}
        </p>
      </div>
    </div>
  );
};
