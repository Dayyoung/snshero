import React, { useState, useEffect, useCallback } from 'react';
import { Gift, CheckCircle2, Circle, Sparkles, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import { useSns } from '../contexts/SnsContext';
import { useGameSettings } from '../contexts/GameSettingsContext';
import {
  DailyMissionProgress,
  MissionState,
  DAILY_MISSIONS,
  loadDailyMissions,
  claimMissionReward,
  getClaimableCount,
  getClaimableRewardTotal,
  getDailyMissionRewardTotal,
} from '../lib/dailyMissions';

export const DailyMissions: React.FC = () => {
  const { language } = useGameSettings();
  const { addSns, addCompanionXp } = useSns();
  const [missionData, setMissionData] = useState<DailyMissionProgress>(loadDailyMissions);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  // Live Reset Countdown Timer (Item 63)
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));

      const hours = String(Math.floor(diff / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const seconds = String(diff % 60).padStart(2, '0');
      setTimeLeft(`${hours}:${minutes}:${seconds}`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  // 주기적으로 데이터 리프레시 (다른 탭에서 변경될 수 있음)
  useEffect(() => {
    const interval = setInterval(() => {
      setMissionData(loadDailyMissions());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = useCallback((missionId: string) => {
    if (claimingId) return;
    setClaimingId(missionId);
    const result = claimMissionReward(missionId);
    if (result) {
      addSns(result.sns, 'daily_mission', 'earned');
      addCompanionXp(result.xp);
      setMissionData(loadDailyMissions());
    }
    setTimeout(() => setClaimingId(null), 500);
  }, [claimingId, addSns, addCompanionXp]);

  // 모두 수령 완료면 간소화된 상태 표시
  const allClaimed = Object.values(missionData.missions).every((s: MissionState) => s.claimed);
  const claimableCount = getClaimableCount();
  const claimableRewardTotal = getClaimableRewardTotal();
  const totalReward = getDailyMissionRewardTotal();

  if (allClaimed) {
    return (
      <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-wider">
            {t('daily_missions_title', language)}
          </h3>
          <span className="text-[10px] font-bold text-emerald-500 ml-auto">
            {t('daily_missions_all_done', language)}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 font-medium">
          {t('daily_missions_tomorrow', language)}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <Gift size={16} className="text-indigo-500 shrink-0" />
          {claimableCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
          )}
        </div>
        <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
          {t('daily_missions_title', language)}
        </h3>

        {/* Live Countdown Badge (Item 63) */}
        {timeLeft && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <Clock size={11} className="animate-spin-slow" />
            <span>{language === 'ko' ? `초기화: ${timeLeft}` : `Resets in ${timeLeft}`}</span>
          </span>
        )}

        {claimableCount > 0 && (
          <button
            onClick={() => {
              DAILY_MISSIONS.forEach(m => {
                const st = missionData.missions[m.id];
                if (st && st.completed && !st.claimed) {
                  handleClaim(m.id);
                }
              });
            }}
            className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded-full shadow-xs cursor-pointer transition-all active:scale-95"
          >
            {language === 'ko' ? `일괄 수령 (${claimableCount})` : `Claim All (${claimableCount})`}
          </button>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-bold">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
          {t('daily_missions_reward_total', language, { amount: totalReward.toLocaleString() })}
        </span>
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-indigo-700">
          {t('daily_missions_reward_claimable', language, { amount: claimableRewardTotal.toLocaleString() })}
        </span>
      </div>

      <p className="mb-3 text-[10px] font-medium text-slate-500">
        {t('daily_missions_reset_hint', language)}
      </p>

      {/* 미션 목록 */}
      <div className="space-y-2">
        {DAILY_MISSIONS.map((mission) => {
          const state = missionData.missions[mission.id];
          if (!state) return null;

          const progress = state.progress;
          const completed = state.completed;
          const claimed = state.claimed;
          const target = mission.target;
          const title = language === 'ko' ? mission.title_ko : mission.title_en;
          const pct = Math.min(100, Math.round((progress / target) * 100));

          return (
            <motion.div
              key={mission.id}
              layout
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg transition-colors',
                claimed
                  ? 'bg-emerald-50/50'
                  : completed
                    ? 'bg-indigo-50/50 ring-1 ring-indigo-200'
                    : 'bg-slate-50'
              )}
            >
              {/* 상태 아이콘 */}
              <div className="shrink-0">
                {claimed ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : completed ? (
                  <Sparkles size={16} className="text-indigo-500 animate-pulse" />
                ) : (
                  <Circle size={16} className="text-slate-300" />
                )}
              </div>

              {/* 미션 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      'text-[11px] sm:text-xs font-bold truncate',
                      claimed
                        ? 'text-emerald-700'
                        : completed
                          ? 'text-indigo-700'
                          : 'text-slate-700'
                    )}
                  >
                    {title}
                  </span>
                  {/* 보상 표시 */}
                  <span className="text-[9px] font-bold text-amber-600 shrink-0 flex items-center gap-0.5">
                    +{mission.reward_sns}
                    <span className="text-[8px] text-amber-400">SNS</span>
                  </span>
                </div>

                {/* 진행 바 */}
                {!claimed && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 shrink-0">
                      {progress}/{target}
                    </span>
                  </div>
                )}
              </div>

              {/* 수령 버튼 */}
              {completed && !claimed && (
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => handleClaim(mission.id)}
                  disabled={claimingId === mission.id}
                  className={cn(
                    'shrink-0 px-2 py-1 bg-indigo-600 text-white text-[9px] font-bold rounded-md',
                    'hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer touch-target',
                    claimingId === mission.id && 'opacity-50'
                  )}
                >
                  {t('daily_missions_claim', language)}
                </motion.button>
              )}

              {/* 수령 완료 표시 */}
              {claimed && (
                <span className="text-[9px] font-bold text-emerald-600 shrink-0">
                  {t('daily_missions_done', language)}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
