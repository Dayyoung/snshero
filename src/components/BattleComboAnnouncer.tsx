import React from 'react';

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
        return 'DOUBLE FLIP!';
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
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col items-center justify-center animate-fade-in">
      {/* Item 406: Z-Lightning Surge FX */}
      {comboType === 'Z_LIGHTNING' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
          <div className="w-72 h-72 border-4 border-yellow-400/80 -rotate-45 scale-125 animate-ping opacity-75 rounded-none" />
          <div className="absolute top-1/3 text-yellow-300 text-sm font-mono font-black animate-bounce tracking-widest">
            [⚡ 5-TILE ZIGZAG OVERCHARGE ⚡]
          </div>
        </div>
      )}

      {/* Item 410: Elemental L-Storm FX */}
      {comboType === 'L_STORM' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
          <div className="w-72 h-72 border-4 border-cyan-400/80 rotate-45 scale-125 animate-spin opacity-75 rounded-none duration-1000" />
          <div className="absolute bottom-1/3 text-cyan-300 text-sm font-mono font-black animate-pulse tracking-widest">
            [🌀 5-TILE CORNER VORTEX 🌀]
          </div>
        </div>
      )}

      {/* Critical Glass Shatter Particles (Item 402) */}
      {isCriticalShatter && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="w-64 h-64 border-2 border-red-500/40 rotate-12 scale-110 animate-ping opacity-60 rounded-none pointer-events-none" />
          <div className="absolute top-1/4 left-1/4 text-red-500 text-xs font-mono font-bold animate-bounce">
            [CRITICAL +{maxPowerDiff}]
          </div>
          <div className="absolute bottom-1/4 right-1/4 text-amber-500 text-xs font-mono font-bold animate-bounce delay-75">
            [SHATTER BREAK]
          </div>
        </div>
      )}

      {/* Arcade Combo Announcer Banner (Item 394) */}
      <div className={`px-5 py-2.5 bg-[#201d1d] text-[#fdfcfc] border-2 font-mono font-black text-sm md:text-base tracking-wider uppercase shadow-none rounded-sm flex items-center gap-2 transform animate-pulse ${
        comboType === 'Z_LIGHTNING' ? 'border-yellow-400 text-yellow-300' : comboType === 'L_STORM' ? 'border-cyan-400 text-cyan-300' : 'border-amber-400'
      }`}>
        <span className="text-amber-400">⚡</span>
        <span>{bannerText}</span>
        <span className="text-amber-400">⚡</span>
      </div>

      {comboCount >= 2 && (
        <div className="mt-1.5 px-2.5 py-0.5 bg-amber-400/90 text-[#201d1d] font-mono text-[11px] font-bold tracking-tight rounded-sm">
          [+{comboCount * 100} BATTLE PTS & CHAIN BONUS]
        </div>
      )}
    </div>
  );
};
