import React, { useState, useEffect } from 'react';
import { type GrowthRewardPayload } from './growthTypes';

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
    <div className="fixed top-20 right-4 z-40 flex flex-col items-end">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 rounded-full border border-cyan-400/50 bg-slate-900/95 px-3.5 py-2 text-xs font-extrabold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:border-cyan-300 transition cursor-pointer"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        <span>🎁 오늘의 무료 10연차 & 전술 지휘</span>
        <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-300">
          {dailyClaimed ? '완료' : 'NEW'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 w-80 rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <span className="text-xs font-black text-cyan-400">
              ⚡ AI 전술 지휘실 & 일일 보급품
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              닫기 ✕
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-300">
                🎟️ 일일 무료 뽑기 보급품
              </span>
              <span className="text-[10px] text-slate-400">매일 00시 초기화</span>
            </div>
            <button
              onClick={handleClaimDailyPack}
              disabled={dailyClaimed}
              className={`w-full rounded-lg py-2 text-xs font-extrabold transition cursor-pointer ${
                dailyClaimed
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500'
              }`}
            >
              {dailyClaimed
                ? '✅ 오늘 보급품 수령 완료 (내일 다시 오세요!)'
                : '🎁 무료 10연차 티켓 + 500 SNS 즉시 받기'}
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 mb-3">
            <div className="text-xs font-bold text-fuchsia-300 mb-1.5">
              ⚔️ AI 자동배틀 실시간 전술 지시
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'BURST', label: '🔥 극공격', desc: '치명타 +35%' },
                  { id: 'COUNTER', label: '⚡ 카운터', desc: '반사 +40%' },
                  { id: 'BALANCE', label: '👑 시너지', desc: '회복 +20%' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectStance(item.id)}
                  className={`rounded-lg border p-2 text-center transition cursor-pointer ${
                    tacticalStance === item.id
                      ? 'border-cyan-400 bg-cyan-950/50 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-[11px] font-extrabold">{item.label}</div>
                  <div className="text-[9px] text-cyan-300 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-emerald-300">🕹️ 미니게임 각성 에너지</span>
              <span className="text-emerald-400">{arcadeEnergy}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300"
                style={{ width: `${arcadeEnergy}%` }}
              />
            </div>
            <button
              onClick={handleChargeArcadeEnergy}
              className="w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
            >
              {arcadeEnergy >= 100
                ? '🎉 100% 달성! 클릭하여 +800 SNS & 티켓 5장 수령!'
                : '⚡ 미니게임 시너지 충전 (+35% 게이지 부스트)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
