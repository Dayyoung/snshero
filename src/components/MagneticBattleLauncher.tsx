/**
 * MagneticBattleLauncher.tsx - SCR-01-29
 * 상단 시스템 바를 슬림 글래스모피즘(36px)으로 축소하고,
 * 우측 하단 엄지 반경에 '자석형 펄스 배틀 런처(64px 대형 터치 타깃)' 구축 및 좌우 스와이프 퀵 드로어 도입.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Play, Shield, Compass, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface MagneticBattleLauncherProps {
  currentStageName: string;
  onLaunchBattle: () => void;
  onOpenQuickDrawer: () => void;
  userEnergy: number;
  maxEnergy: number;
}

export const MagneticBattleLauncher: React.FC<MagneticBattleLauncherProps> = ({
  currentStageName,
  onLaunchBattle,
  onOpenQuickDrawer,
  userEnergy,
  maxEnergy,
}) => {
  return (
    <>
      {/* 1. Slim Glassmorphism Top System Bar (36px) */}
      <div className="fixed top-1 inset-x-3 z-30 h-9 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-full px-3 flex items-center justify-between font-mono select-none shadow">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
          <Sparkles size={13} className="text-amber-400" />
          <span>SNSHero Revolution</span>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-300">
          <span className="font-bold text-cyan-400">
            ⚡ {userEnergy}/{maxEnergy}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span className="text-emerald-400 font-bold">ONLINE</span>
        </div>
      </div>

      {/* 2. Right Bottom Thumb Zone: Magnetic Pulse Battle Launcher (64px Target) */}
      <div className="fixed bottom-20 right-4 z-40 font-mono select-none flex items-center gap-2">
        {/* Left Quick Drawer Toggle Trigger */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onOpenQuickDrawer();
          }}
          className="h-10 px-2.5 rounded-full bg-slate-950/90 border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-bold flex items-center gap-1 active:scale-95 cursor-pointer shadow-lg backdrop-blur-sm"
        >
          <Compass size={14} />
          <span>메뉴</span>
        </button>

        {/* 64px Circular Magnetic Battle Launcher Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            triggerHaptic('heavy');
            onLaunchBattle();
          }}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 via-amber-500 to-yellow-400 text-slate-950 font-black flex flex-col items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6)] border-2 border-white cursor-pointer relative"
        >
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-60 pointer-events-none" />

          <Swords size={22} className="shrink-0" />
          <span className="text-[10px] leading-tight font-black mt-0.5">출격</span>
        </motion.button>
      </div>
    </>
  );
};
