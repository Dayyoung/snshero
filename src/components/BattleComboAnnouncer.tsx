import React, { useEffect } from 'react';
import { playDopamineChime, triggerHapticFeedback } from '../lib/combatDopamineEngine';
import { motion } from 'motion/react';
import { usePerformanceMode } from '../hooks/usePerformanceMode';

interface BattleComboAnnouncerProps {
  comboType: 'NORMAL' | 'DOUBLE' | 'TRIPLE' | 'MEGA' | 'SAME' | 'PLUS' | 'DOMINO' | 'Z_LIGHTNING' | 'L_STORM' | null;
  comboCount: number;
  isCriticalShatter: boolean;
  maxPowerDiff: number;
}

export const BattleComboAnnouncer: React.FC<BattleComboAnnouncerProps> = ({
  comboType,
  comboCount,
  isCriticalShatter,
  maxPowerDiff,
}) => {
  const { reducedMotion } = usePerformanceMode();
  useEffect(() => {
    if (!comboType) return;
    if (comboCount >= 2 || isCriticalShatter || comboType === 'Z_LIGHTNING' || comboType === 'L_STORM' || comboType === 'SAME' || comboType === 'PLUS') {
      playDopamineChime(comboCount, isCriticalShatter);
      if (comboType === 'Z_LIGHTNING' || comboType === 'L_STORM') {
        triggerHapticFeedback([40, 30, 80, 30, 100]);
      } else if (comboCount >= 3 || isCriticalShatter) {
        triggerHapticFeedback([30, 25, 45]);
      } else {
        triggerHapticFeedback([25, 20, 25]);
      }
    }
  }, [comboType, comboCount, isCriticalShatter]);

  if (!comboType || (comboCount <= 1 && !isCriticalShatter && comboType !== 'SAME' && comboType !== 'PLUS' && comboType !== 'Z_LIGHTNING' && comboType !== 'L_STORM')) {
    return null;
  }

  const getBannerText = () => {
    switch (comboType) {
      case 'Z_LIGHTNING':
        return '⚡ Z-LIGHTNING SURGE! ⚡';
      case 'L_STORM':
        return '🌀 ELEMENTAL L-STORM! 🌀';
      case 'MEGA':
        return 'MEGA FLIP x' + comboCount + '!';
      case 'TRIPLE':
        return 'TRIPLE FLIP!';
      case 'DOUBLE':
        return 'Doble Flip!';
      case 'SAME':
        return 'SAME RULE MATCH!';
      case 'PLUS':
        return 'PLUS SUM COMBO!';
      case 'DOMINO':
        return 'DOMINO CASCADE!';
      default:
        return isCriticalShatter ? 'CRITICAL SHATTER!' : null;
    }
  };

  const bannerText = getBannerText();
  if (!bannerText) return null;

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.18 }}
      className="absolute inset-0 pointer-events-none z-30 flex flex-col items-center justify-center px-4 font-mono"
    >
      {/* Item 406: Z-Lightning Surge FX */}
      {comboType === 'Z_LIGHTNING' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 bg-[#fdfcfc] border border-[#0f0000]/12 px-2 py-1 text-[#201d1d] text-[11px] font-medium text-center">
            [⚡ 5-TILE ZIGZAG OVERCHARGE ⚡]
          </div>
        </div>
      )}

      {/* Item 410: Elemental L-Storm FX */}
      {comboType === 'L_STORM' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
          <div className="absolute bottom-1/3 bg-[#fdfcfc] border border-[#0f0000]/12 px-2 py-1 text-[#201d1d] text-[11px] font-medium text-center">
            [🌀 5-TILE CORNER VORTEX 🌀]
          </div>
        </div>
      )}

      {/* Critical Glass Shatter Particles (Item 402) */}
      {isCriticalShatter && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="absolute top-1/4 bg-[#201d1d] px-2 py-1 text-[#efb1a3] text-xs font-bold">
            [CRITICAL +{maxPowerDiff}]
          </div>
          <div className="absolute bottom-1/4 bg-[#fdfcfc] px-2 py-1 border border-[#0f0000]/12 text-[#201d1d] text-[11px] font-medium">
            [SHATTER BREAK]
          </div>
        </div>
      )}

      {/* Arcade Combo Announcer Banner (Item 394) */}
      <div className={`max-w-full px-4 py-3 bg-[#201d1d] text-[#fdfcfc] border border-l-2 font-bold text-sm md:text-base leading-5 uppercase rounded-none text-center ${
        comboType === 'Z_LIGHTNING' ? 'border-[#dfcba4]' : comboType === 'L_STORM' ? 'border-[#add4e3]' : 'border-[#fdfcfc]/30'
      }`}>
        <span>{bannerText}</span>
      </div>

      {comboCount >= 2 && (
        <div className="mt-1 px-3 py-1 bg-[#fdfcfc] border border-[#0f0000]/12 text-[#201d1d] text-[11px] font-medium text-center rounded-none">
          [+{comboCount * 100} BATTLE PTS & CHAIN BONUS]
        </div>
      )}
    </motion.div>
  );
};
