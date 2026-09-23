/**
 * BattleComboFeverOverlay.tsx - SCR-02-18
 * 카드 연속 사용 시 화면 테두리가 불타오르고 배수가 증폭되는 배틀 피버 콤보 오버레이 & 마나 과충전 콤보 젬 연동
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Sparkles, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface BattleComboFeverOverlayProps {
  comboCount: number;
  hasOverchargeGem?: boolean;
  onBuyOverchargeGem?: () => void;
}

export const BattleComboFeverOverlay: React.FC<BattleComboFeverOverlayProps> = ({
  comboCount,
  hasOverchargeGem = false,
  onBuyOverchargeGem,
}) => {
  if (comboCount < 2) return null;

  const multiplier = (1 + (comboCount - 1) * 0.2).toFixed(1);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 font-mono select-none flex flex-col items-center justify-start pt-16">
      {/* Burning Edge Border */}
      <div
        className={`absolute inset-0 border-4 transition-all duration-300 pointer-events-none ${
          comboCount >= 5
            ? 'border-amber-400 shadow-[inset_0_0_40px_rgba(245,158,11,0.5)] animate-pulse'
            : comboCount >= 3
            ? 'border-orange-500 shadow-[inset_0_0_20px_rgba(249,115,22,0.3)]'
            : 'border-rose-500/50'
        }`}
      />

      {/* Combo Floating Badge */}
      <motion.div
        initial={{ scale: 0.5, y: -20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-slate-950/90 border-2 border-amber-400 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl backdrop-blur-md pointer-events-auto"
      >
        <Flame className="text-amber-400 fill-amber-400 animate-bounce" size={24} />
        <div>
          <div className="text-sm font-black text-amber-300">
            {comboCount} COMBO FEVER!
          </div>
          <div className="text-[11px] text-slate-300">
            공격력 배수: <span className="text-emerald-400 font-bold">{multiplier}x</span>
            {comboCount >= 5 && hasOverchargeGem && (
              <span className="text-yellow-300 font-bold ml-1">(과충전 2배 추가!)</span>
            )}
          </div>
        </div>

        {/* Overcharge Gem Upsell (SCR-02-18) */}
        {!hasOverchargeGem && comboCount >= 4 && onBuyOverchargeGem && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onBuyOverchargeGem();
            }}
            className="ml-2 px-2.5 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
          >
            과충전 젬 (100 SNS)
          </button>
        )}
      </motion.div>
    </div>
  );
};
