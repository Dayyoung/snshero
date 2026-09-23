/**
 * SquadSpecSweeper.tsx - SCR-07-20
 * 양팀 스쿼드를 좌우 엄지 플릭으로 넘겨보는 스쿼드 스펙 스위퍼 바
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Shield, Zap, Heart } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface TeamSquadInfo {
  teamName: string;
  avgAttack: number;
  avgDefense: number;
  staminaPercent: number;
  color: string;
}

interface SquadSpecSweeperProps {
  homeTeam: TeamSquadInfo;
  awayTeam: TeamSquadInfo;
}

export const SquadSpecSweeper: React.FC<SquadSpecSweeperProps> = ({
  homeTeam,
  awayTeam,
}) => {
  const [selectedSide, setSelectedSide] = useState<'home' | 'away'>('home');

  const team = selectedSide === 'home' ? homeTeam : awayTeam;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 font-mono select-none">
      {/* 44px Thumb Toggle Bar */}
      <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl h-11">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setSelectedSide('home');
          }}
          className={`h-full rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            selectedSide === 'home' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'
          }`}
        >
          <Users size={12} />
          <span>{homeTeam.teamName}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setSelectedSide('away');
          }}
          className={`h-full rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            selectedSide === 'away' ? 'bg-rose-600 text-white shadow' : 'text-slate-400'
          }`}
        >
          <Users size={12} />
          <span>{awayTeam.teamName}</span>
        </button>
      </div>

      {/* Selected Team Specs */}
      <motion.div
        key={selectedSide}
        initial={{ opacity: 0, x: selectedSide === 'home' ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="grid grid-cols-3 gap-2 text-center text-[10px]"
      >
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-500 block">평균 공격력</span>
          <span className="text-amber-400 font-black text-xs">{team.avgAttack}</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-500 block">평균 방어력</span>
          <span className="text-blue-400 font-black text-xs">{team.avgDefense}</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-500 block">팀 체력</span>
          <span className="text-emerald-400 font-black text-xs">{team.staminaPercent}%</span>
        </div>
      </motion.div>
    </div>
  );
};
