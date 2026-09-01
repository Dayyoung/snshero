/**
 * ElementalResonanceAura.tsx
 * 3장 이상 카드 조합 시 발동하는 엘리멘탈 레조넌스 & 인연 체인 실시간 3D/2D 오라 연출
 * (구글 스프레드시트 Row 716 / ID 557 요구사항 구현)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Sparkles, Shield, Flame } from 'lucide-react';
import { SynergyBonus } from '../lib/deckSynergyCalculator';

interface ElementalResonanceAuraProps {
  synergy: SynergyBonus;
  language?: string;
  className?: string;
}

export const ElementalResonanceAura: React.FC<ElementalResonanceAuraProps> = ({
  synergy,
  language = 'ko',
  className = ''
}) => {
  const isKo = language === 'ko';

  return (
    <div className={`relative flex items-center gap-1.5 px-2.5 py-1 border rounded-none font-mono text-[10px] select-none overflow-hidden ${synergy.color} ${className}`}>
      {/* Background Animated Pulse Glow */}
      <motion.div
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-current opacity-10 pointer-events-none"
      />

      <span className="text-sm">{synergy.badge}</span>
      <div className="flex flex-col">
        <div className="flex items-center gap-1 font-bold">
          <span>{isKo ? synergy.name_ko : synergy.name_en} 레조넌스</span>
          <span className="text-[9px] bg-black/40 px-1 rounded-xs">x{synergy.count}</span>
        </div>
        <span className="text-[9px] opacity-80">
          +{synergy.bonusPower} PWR ({synergy.bonusPercent}% BUFF)
        </span>
      </div>

      <Sparkles size={12} className="text-amber-300 animate-spin ml-auto shrink-0" />
    </div>
  );
};
