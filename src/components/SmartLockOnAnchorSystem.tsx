/**
 * SmartLockOnAnchorSystem.tsx - SCR-07-26
 * 카드 터치 시 유효 대상 위에 48px 스마트 록온 앵커(Lock-on Anchor) 자동 활성화 및 1-Tap 원터치 지정 모드 지원,
 * 손가락 가림에 의한 오타겟팅을 원천 해결하는 스마트 타겟팅 보조 시스템.
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crosshair, Target, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface CombatUnitTarget {
  id: string;
  name: string;
  isEnemy: boolean;
  hpPercent: number;
  xPercent: number; // 0 to 100 on screen
  yPercent: number; // 0 to 100 on screen
  isRecommendedTarget?: boolean;
}

interface SmartLockOnAnchorSystemProps {
  isTargetingActive: boolean;
  selectedSkillName?: string;
  targets: CombatUnitTarget[];
  activeTargetId: string | null;
  onSelectTarget: (targetId: string) => void;
}

export const SmartLockOnAnchorSystem: React.FC<SmartLockOnAnchorSystemProps> = ({
  isTargetingActive,
  selectedSkillName,
  targets,
  activeTargetId,
  onSelectTarget,
}) => {
  if (!isTargetingActive) return null;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none font-mono select-none">
      {/* Top Banner Guide */}
      <div className="absolute top-14 inset-x-4 flex justify-center pointer-events-auto">
        <div className="bg-slate-950/90 border border-amber-400/80 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-xl backdrop-blur-md animate-pulse">
          <Crosshair size={14} className="text-amber-400" />
          <span className="text-xs font-black text-amber-300">
            [스마트 록온] 대상을 1-Tap 터치하여 {selectedSkillName || '스킬'} 시전
          </span>
        </div>
      </div>

      {/* 48px Lock-on Anchors over Target Units */}
      {targets.map((target) => {
        const isSelected = activeTargetId === target.id;
        const isRecommended = target.isRecommendedTarget;

        return (
          <div
            key={target.id}
            style={{
              left: `${target.xPercent}%`,
              top: `${target.yPercent}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
          >
            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                onSelectTarget(target.id);
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 scale-125 shadow-[0_0_20px_rgba(245,158,11,1)] border-2 border-white z-40'
                  : isRecommended
                  ? 'bg-rose-600/90 text-white animate-bounce shadow-[0_0_15px_rgba(225,29,72,0.8)] border-2 border-rose-400 z-30'
                  : 'bg-slate-950/80 text-amber-400 border border-amber-400/60 hover:bg-slate-900 z-20'
              }`}
            >
              {isSelected ? (
                <Target size={22} className="animate-spin" />
              ) : isRecommended ? (
                <Zap size={20} className="fill-current" />
              ) : (
                <Crosshair size={20} />
              )}
            </button>

            {/* Target Label */}
            <div className="absolute top-13 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-black/80 border border-slate-700 text-[10px] text-slate-200 font-bold pointer-events-none">
              {target.name} ({target.hpPercent}%)
            </div>
          </div>
        );
      })}
    </div>
  );
};
