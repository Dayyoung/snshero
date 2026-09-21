/**
 * SwipeToBetCard.tsx - SCR-07-14
 * 좌우 스와이프 제스처로 1초 만에 승/패를 선택하는 스마트 픽 카드
 */

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { Check, X, ShieldAlert, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface SwipeToBetCardProps {
  id: string;
  title: string;
  category: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  awayOdds: number;
  onBet: (choice: 'home' | 'away') => void;
  language?: string;
}

export const SwipeToBetCard: React.FC<SwipeToBetCardProps> = ({
  id,
  title,
  category,
  homeTeam,
  awayTeam,
  homeOdds,
  awayOdds,
  onBet,
  language = 'ko',
}) => {
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-150, 0, 150],
    ['rgba(225, 29, 72, 0.25)', 'rgba(30, 41, 59, 0.95)', 'rgba(16, 185, 129, 0.25)']
  );
  const [swiped, setSwiped] = useState<'home' | 'away' | null>(null);

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (info.offset.x > 100) {
      triggerHaptic('heavy');
      setSwiped('home');
      onBet('home');
    } else if (info.offset.x < -100) {
      triggerHaptic('heavy');
      setSwiped('away');
      onBet('away');
    }
  };

  return (
    <motion.div
      style={{ background }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      className="relative w-full rounded-2xl border-2 border-slate-700 p-4 font-mono text-white shadow-xl cursor-grab active:cursor-grabbing select-none"
    >
      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
        <span className="px-2 py-0.5 bg-indigo-900/60 text-indigo-300 rounded font-bold">
          {category}
        </span>
        <span className="flex items-center gap-1 text-amber-400 font-bold">
          <Zap size={12} />
          {language === 'ko' ? '👈 패배 | 승리 👉 스와이프' : '👈 NO | YES 👉 Swipe'}
        </span>
      </div>

      <h3 className="text-sm font-black mb-3 text-slate-100">{title}</h3>

      <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
        <div className="text-left">
          <span className="text-[10px] text-emerald-400 font-bold block">HOME / YES</span>
          <span className="text-xs font-black text-white">{homeTeam}</span>
          <span className="text-[11px] text-emerald-400 block font-bold mt-0.5">{homeOdds.toFixed(2)}x</span>
        </div>
        <div className="text-right border-l border-slate-800 pl-2">
          <span className="text-[10px] text-rose-400 font-bold block">AWAY / NO</span>
          <span className="text-xs font-black text-white">{awayTeam}</span>
          <span className="text-[11px] text-rose-400 block font-bold mt-0.5">{awayOdds.toFixed(2)}x</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 text-[10px] text-slate-400">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('heavy');
            setSwiped('away');
            onBet('away');
          }}
          className="px-3 py-1 bg-rose-950/80 border border-rose-600 text-rose-300 rounded font-bold cursor-pointer"
        >
          ← {awayTeam} 선택
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('heavy');
            setSwiped('home');
            onBet('home');
          }}
          className="px-3 py-1 bg-emerald-950/80 border border-emerald-600 text-emerald-300 rounded font-bold cursor-pointer"
        >
          {homeTeam} 선택 →
        </button>
      </div>
    </motion.div>
  );
};
