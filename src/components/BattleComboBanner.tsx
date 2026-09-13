/**
 * BattleComboBanner.tsx
 * 인게임 아케이드 콤보 어나운서 배너 연출 (DOUBLE FLIP, TRIPLE FLIP, MEGA FLIP, DOMINATION)
 * (구글 스프레드시트 Row 1037 / ID 549 요구사항 구현)
 * design.md 준수: 고도파민 플랫 폰트, 햅틱 피드백, 1px 보더
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playDopamineChime, triggerHapticFeedback } from '../lib/combatDopamineEngine';

export type ComboGrade = 'DOUBLE' | 'TRIPLE' | 'MEGA' | 'DOMINATION' | 'CRITICAL' | null;

export interface BattleComboBannerProps {
  comboGrade: ComboGrade;
  comboCount?: number;
  onComplete?: () => void;
}

export const BattleComboBanner: React.FC<BattleComboBannerProps> = ({
  comboGrade,
  comboCount = 2,
  onComplete,
}) => {
  useEffect(() => {
    if (!comboGrade) return;

    // 햅틱 진동 및 도파민 사운드 재생
    if (comboGrade === 'DOMINATION') {
      playDopamineChime(5, true);
      triggerHapticFeedback([50, 40, 100, 40, 150]);
    } else if (comboGrade === 'MEGA' || comboGrade === 'TRIPLE') {
      playDopamineChime(comboCount, true);
      triggerHapticFeedback([40, 30, 80]);
    } else {
      playDopamineChime(comboCount, false);
      triggerHapticFeedback([30, 20, 30]);
    }

    const timer = setTimeout(() => {
      onComplete?.();
    }, 1600);

    return () => clearTimeout(timer);
  }, [comboGrade, comboCount, onComplete]);

  if (!comboGrade) return null;

  const getComboConfig = () => {
    switch (comboGrade) {
      case 'DOMINATION':
        return {
          title: '🔥 DOMINATION! 🔥',
          subtitle: '전장 완전 장악 & 올킬 달성',
          bgColor: 'bg-rose-950/95 border-rose-500 text-rose-200',
          textColor: 'text-rose-400',
        };
      case 'MEGA':
        return {
          title: `⚡ MEGA FLIP x${comboCount}! ⚡`,
          subtitle: '폭발적 다중 카드 전환!',
          bgColor: 'bg-amber-950/95 border-amber-500 text-amber-200',
          textColor: 'text-amber-400',
        };
      case 'TRIPLE':
        return {
          title: '✨ TRIPLE FLIP! ✨',
          subtitle: '3단 카드 연속 탈환!',
          bgColor: 'bg-purple-950/95 border-purple-500 text-purple-200',
          textColor: 'text-purple-300',
        };
      case 'CRITICAL':
        return {
          title: '💥 CRITICAL SHATTER! 💥',
          subtitle: '방어벽 분쇄 & 치명타 적중!',
          bgColor: 'bg-red-950/95 border-red-500 text-red-200',
          textColor: 'text-red-400',
        };
      default:
        return {
          title: '⚔️ DOUBLE FLIP! ⚔️',
          subtitle: '연속 카드 탈환 성공!',
          bgColor: 'bg-indigo-950/95 border-indigo-500 text-indigo-200',
          textColor: 'text-indigo-300',
        };
    }
  };

  const config = getComboConfig();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4 font-mono select-none">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 1.2, opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          className={`py-3 px-6 rounded-none border-2 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center text-center ${config.bgColor}`}
        >
          <span className={`text-lg sm:text-2xl font-black tracking-wider uppercase ${config.textColor}`}>
            {config.title}
          </span>
          <span className="text-[11px] sm:text-xs font-bold opacity-90 mt-0.5">
            {config.subtitle}
          </span>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
