// src/components/growth/DailyRetentionAndArcadeLoop.tsx
import React, { useState, useEffect } from 'react';
import type { GrowthRewardPayload } from './growthTypes';
import { IconClose, IconCpu, IconSpark } from './GrowthIcons';

interface DailyRetentionAndArcadeLoopProps {
  onClaimDailyReward: (reward: GrowthRewardPayload) => void;
}

export const DailyRetentionAndArcadeLoop: React.FC<DailyRetentionAndArcadeLoopProps> = ({
  onClaimDailyReward,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [arcadeEnergy, setArcadeEnergy] = useState<number>(65);
  const [dailyClaimed, setDailyClaimed] = useState<boolean>(false);
  const [tacticalStance, setTacticalStance] = useState<'BURST' | 'COUNTER' | 'BALANCE'>('BURST');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const todayKey = new Date().toISOString().slice(0, 10);
    const savedDate = localStorage.getItem('snshero_daily_claimed_date');
    if (savedDate === todayKey) {
      setDailyClaimed(true);
    }

    const savedStance = localStorage.getItem('snshero_tactical_stance') as
      | 'BURST'
      | 'COUNTER'
      | 'BALANCE'
      | null;
    if (savedStance) {
      setTacticalStance(savedStance);
    }
  }, []);

  const handleClaimDailyPack = () => {
    if (dailyClaimed) return;
    const todayKey = new Date().toISOString().slice(0, 10);
    localStorage.setItem('snshero_daily_claimed_date', todayKey);
    setDailyClaimed(true);

    onClaimDailyReward({
      snsPoints: 500,
      freeTickets: 10,
      source: 'CHALLENGE_PARTICIPATE',
    });
  };

  const handleChargeArcadeEnergy = () => {
    if (arcadeEnergy >= 100) {
      setArcadeEnergy(0);
      onClaimDailyReward({
        snsPoints: 800,
        freeTickets: 5,
        source: 'CHALLENGE_WIN',
      });
    } else {
      setArcadeEnergy((prev) => Math.min(100, prev + 35));
    }
  };

  const handleSelectStance = (stance: 'BURST' | 'COUNTER' | 'BALANCE') => {
    setTacticalStance(stance);
    localStorage.setItem('snshero_tactical_stance', stance);
  };

  return (
    <div className="fixed top-20 right-4 z-[9990] flex flex-col items-end">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2.5 rounded-lg border border-white/15 bg-[#090d16]/90 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-lg backdrop-blur-md hover:border-sky-400/50 transition cursor-pointer"
      >
        <IconCpu className="w-3.5 h-3.5 text-sky-400" />
        <span className="font-mono text-[11px] tracking-wider uppercase">COMMAND OPS</span>
        <span
          className={
            'rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ' +
            (dailyClaimed
              ? 'bg-white/10 text-slate-400'
              : 'bg-sky-400/20 text-sky-300 border border-sky-400/30')
          }
        >
          {dailyClaimed ? 'SYNCED' : 'SUPPLY READY'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 w-80 rounded-xl border border-white/15 bg-[#090d16]/95 p-4 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-sky-400">
              TACTICAL COMMAND & SUPPLY
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <IconClose className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase text-amber-300">
                DAILY VOUCHER GRANT
              </span>
              <span className="font-mono text-[10px] text-slate-500">RESET 00:00</span>
            </div>
            <button
              onClick={handleClaimDailyPack}
              disabled={dailyClaimed}
              className={
                'w-full rounded-md py-2 text-xs font-bold transition cursor-pointer ' +
                (dailyClaimed
                  ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                  : 'bg-sky-400 text-slate-950 hover:bg-sky-300')
              }
            >
              {dailyClaimed
                ? '금일 보급 수령 완료'
                : '10회 소환 티켓 + 500 SNS 수령'}
            </button>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 mb-3">
            <div className="font-mono text-[10px] uppercase text-slate-400 mb-2">
              AI AUTO-BATTLE DIRECTIVE
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'BURST', label: 'ASSAULT', desc: 'CRIT +35%' },
                  { id: 'COUNTER', label: 'COUNTER', desc: 'REFLECT +40%' },
                  { id: 'BALANCE', label: 'SYNERGY', desc: 'REPAIR +20%' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectStance(item.id)}
                  className={
                    'rounded border p-2 text-center transition cursor-pointer ' +
                    (tacticalStance === item.id
                      ? 'border-sky-400 bg-sky-400/10 text-white'
                      : 'border-white/10 bg-black/40 text-slate-400 hover:text-white')
                  }
                >
                  <div className="font-mono text-[10px] font-bold">{item.label}</div>
                  <div className="font-mono text-[9px] text-sky-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between font-mono text-[10px] mb-1.5">
              <span className="text-slate-300">ARCADE CORE SYNC</span>
              <span className="text-sky-400">{arcadeEnergy}%</span>
            </div>
            <div className="h-1.5 w-full rounded-sm bg-slate-900 overflow-hidden mb-2.5">
              <div
                className="h-full bg-sky-400 transition-all duration-300"
                style={{ width: arcadeEnergy + '%' }}
              />
            </div>
            <button
              onClick={handleChargeArcadeEnergy}
              className="w-full rounded-md border border-sky-400/30 bg-sky-400/10 py-1.5 font-mono text-[10px] font-bold text-sky-300 hover:bg-sky-400/20 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <IconSpark className="w-3 h-3" />
              <span>
                {arcadeEnergy >= 100
                  ? 'CLAIM OVERCHARGE (+800 SNS)'
                  : 'BOOST ARCADE SYNC (+35%)'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
