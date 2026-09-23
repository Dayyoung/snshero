/**
 * RivalMatchupCard.tsx - SCR-10-14
 * 내 순위 기준 직전/직후 라이벌 3인을 대조하여 승패 전적 및 전투력을 비교하는 카드 컴포넌트
 */

import React from 'react';
import { Swords, Flame, Trophy, TrendingUp, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface RivalUser {
  rank: number;
  name: string;
  totalPower: number;
  points: number;
  winRate: number;
  isMe?: boolean;
}

interface RivalMatchupCardProps {
  myRank: number;
  rivals: RivalUser[];
  onSelectRival: (rival: RivalUser) => void;
}

export const RivalMatchupCard: React.FC<RivalMatchupCardProps> = ({
  myRank,
  rivals,
  onSelectRival,
}) => {
  return (
    <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 font-mono shadow-xl select-none">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
          <Flame size={15} className="text-amber-500 fill-amber-500" />
          <span>내 리그 라이벌 매치업 (TOP 3 대조)</span>
        </div>
        <span className="text-[10px] text-slate-400">내 현재 순위: #{myRank}</span>
      </div>

      <div className="flex flex-col gap-2">
        {rivals.map((rival) => {
          const isMe = rival.isMe;
          return (
            <div
              key={rival.name}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                isMe
                  ? 'bg-amber-500/15 border-amber-400/60 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                    rival.rank === 1
                      ? 'bg-amber-400 text-slate-950'
                      : rival.rank === 2
                      ? 'bg-slate-300 text-slate-900'
                      : rival.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  #{rival.rank}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      {rival.name} {isMe && '(나)'}
                    </span>
                    <span className="text-[10px] text-emerald-400">승률 {rival.winRate}%</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    전투력: <span className="text-amber-300 font-bold">{rival.totalPower.toLocaleString()}</span> | 포인트: {rival.points.toLocaleString()}pt
                  </div>
                </div>
              </div>

              {!isMe && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('heavy');
                    onSelectRival(rival);
                  }}
                  className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-[11px] rounded-lg flex items-center gap-1 active:scale-95 cursor-pointer shadow-md"
                >
                  <Swords size={12} />
                  <span>도전</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
