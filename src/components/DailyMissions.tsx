import React, { useState, useEffect, useCallback } from 'react';
import { Gift, CheckCircle2, Circle, Sparkles, Clock, History, Award, Coins, Zap, Trash2, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  loadDailyMissionHistory,
  clearDailyMissionHistory,
  getMissionHistoryStats,
  DailyMissionHistoryEntry,
} from '../lib/dailyMissions';

export const DailyMissions: React.FC = () => {
  const { language } = useGameSettings();
  const { addSns, addCompanionXp } = useSns();
  const [missionData, setMissionData] = useState<DailyMissionProgress>(loadDailyMissions);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Tab & History Modal State
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState<DailyMissionHistoryEntry[]>(loadDailyMissionHistory);
  const [historyStats, setHistoryStats] = useState(getMissionHistoryStats);

  const refreshHistory = useCallback(() => {
    setHistoryList(loadDailyMissionHistory());
    setHistoryStats(getMissionHistoryStats());
  }, []);

  useEffect(() => {
    refreshHistory();
    window.addEventListener('hero_daily_missions_history_updated', refreshHistory);
    window.addEventListener('storage', refreshHistory);
    return () => {
      window.removeEventListener('hero_daily_missions_history_updated', refreshHistory);
      window.removeEventListener('storage', refreshHistory);
    };
  }, [refreshHistory]);

  // 미션 100% 달성 시 완료 알림 수신
  useEffect(() => {
    const handleMissionCompleted = (e: Event) => {
      const customEv = e as CustomEvent<{ title_ko: string; title_en: string; reward_sns: number }>;
      if (customEv.detail) {
        const title = language === 'ko' ? customEv.detail.title_ko : customEv.detail.title_en;
        const msg = language === 'ko'
          ? `🎉 [${title}] 미션 100% 달성! '보상 받기' 버튼을 눌러 보상을 수령하세요.`
          : `🎉 [${title}] Mission Completed (100%)! Click 'Claim Reward' to collect your reward.`;
        setNotificationMsg(msg);
      }
    };
    window.addEventListener('hero_daily_mission_completed', handleMissionCompleted);
    return () => window.removeEventListener('hero_daily_mission_completed', handleMissionCompleted);
  }, [language]);

  // Live Reset Countdown Timer
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

  // 주기적으로 데이터 리프레시 및 이벤트 수신
  useEffect(() => {
    const handleUpdate = () => setMissionData(loadDailyMissions());
    window.addEventListener('hero_daily_missions_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(handleUpdate, 3000);
    return () => {
      window.removeEventListener('hero_daily_missions_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleClaim = useCallback((missionId: string) => {
    if (claimingId) return;
    setClaimingId(missionId);
    const result = claimMissionReward(missionId);
    if (result) {
      addSns(result.sns, 'daily_mission', 'earned');
      addCompanionXp(result.xp);
      setMissionData(loadDailyMissions());
      refreshHistory();

      const title = language === 'ko' ? result.title_ko : result.title_en;
      const msg = language === 'ko'
        ? `🎁 [${title}] 보상이 지급되었습니다! (+${result.sns} SNS)`
        : `🎁 [${title}] Reward claimed! (+${result.sns} SNS)`;
      setNotificationMsg(msg);
    }
    setTimeout(() => setClaimingId(null), 500);
  }, [claimingId, addSns, addCompanionXp, language, refreshHistory]);

  const handleClearHistory = () => {
    clearDailyMissionHistory();
    refreshHistory();
  };

  const handleDownloadCSV = () => {
    if (historyList.length === 0) return;

    const headers = ['Date', 'Time', 'Mission Title (KO)', 'Mission Title (EN)', 'Reward SNS', 'Reward XP'];
    const rows = historyList.map((entry) => {
      const timeStr = entry.claimedAt
        ? new Date(entry.claimedAt).toLocaleTimeString('en-US', { hour12: false })
        : '';
      const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      return [
        escapeCsv(entry.date || ''),
        escapeCsv(timeStr),
        escapeCsv(entry.title_ko || ''),
        escapeCsv(entry.title_en || ''),
        entry.reward_sns || 0,
        entry.reward_xp || 0,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `snshero_mission_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const claimableCount = getClaimableCount();
  const claimableRewardTotal = getClaimableRewardTotal();
  const totalReward = getDailyMissionRewardTotal();
  const allClaimed = Object.values(missionData.missions).every((s: MissionState) => s.claimed);

  const renderHistoryView = () => (
    <div className="space-y-3 font-mono text-[#201d1d]">
      {/* 통계 요약 카드 */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm">
          <div className="text-[10px] text-[#646262] font-bold uppercase mb-0.5 flex items-center justify-center gap-1">
            <Coins size={12} className="text-amber-600" />
            <span className="truncate">{t('daily_missions_total_sns', language)}</span>
          </div>
          <div className="text-xs sm:text-sm font-black text-amber-700">
            +{historyStats.totalSns.toLocaleString()}
          </div>
        </div>
        <div className="p-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm">
          <div className="text-[10px] text-[#646262] font-bold uppercase mb-0.5 flex items-center justify-center gap-1">
            <Zap size={12} className="text-indigo-600" />
            <span className="truncate">{t('daily_missions_total_xp', language)}</span>
          </div>
          <div className="text-xs sm:text-sm font-black text-indigo-700">
            +{historyStats.totalXp.toLocaleString()}
          </div>
        </div>
        <div className="p-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm">
          <div className="text-[10px] text-[#646262] font-bold uppercase mb-0.5 flex items-center justify-center gap-1">
            <Award size={12} className="text-emerald-600" />
            <span className="truncate">{t('daily_missions_total_completed', language)}</span>
          </div>
          <div className="text-xs sm:text-sm font-black text-emerald-700">
            {historyStats.totalCompleted}
          </div>
        </div>
      </div>

      {/* 기록 관리 버튼 (CSV 다운로드 / 기록 삭제) */}
      {historyList.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleDownloadCSV}
            className="text-[10px] text-[#201d1d] hover:bg-[#e2e0e0] font-bold flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm"
          >
            <Download size={11} />
            <span>[{t('daily_missions_download_csv', language)}]</span>
          </button>
          <button
            onClick={handleClearHistory}
            className="text-[10px] text-[#646262] hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 size={11} />
            <span>[{t('daily_missions_clear_history', language)}]</span>
          </button>
        </div>
      )}

      {/* 히스토리 목록 */}
      {historyList.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] text-[#646262] text-xs">
          {t('daily_missions_no_history', language)}
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {historyList.map((entry) => {
            const title = language === 'ko' ? entry.title_ko : entry.title_en;
            const timeStr = entry.claimedAt
              ? new Date(entry.claimedAt).toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <div
                key={entry.id}
                className="p-2.5 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-sm flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#646262] mb-0.5">
                    <span className="bg-[#e2e0e0] text-[#201d1d] px-1.5 py-0.2 rounded-xs font-bold">
                      [{entry.date || 'LOG'}]
                    </span>
                    <span>{timeStr}</span>
                  </div>
                  <div className="font-bold text-[#201d1d] truncate">{title}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-amber-700">+{entry.reward_sns} SNS</div>
                  <div className="text-[10px] font-bold text-indigo-700">+{entry.reward_xp} XP</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] p-4 rounded-none font-mono text-[#201d1d]">
      {/* 탭 & 모달 상단 헤더 툴바 */}
      <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-2.5 mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              'px-2.5 py-1 text-xs font-bold rounded-sm border transition-all cursor-pointer',
              activeTab === 'active'
                ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                : 'bg-[#fdfcfc] text-[#646262] border-[rgba(15,0,0,0.12)] hover:bg-[#f8f7f7]'
            )}
          >
            [{t('daily_missions_tab_active', language)}]
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'px-2.5 py-1 text-xs font-bold rounded-sm border transition-all cursor-pointer flex items-center gap-1',
              activeTab === 'history'
                ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                : 'bg-[#fdfcfc] text-[#646262] border-[rgba(15,0,0,0.12)] hover:bg-[#f8f7f7]'
            )}
          >
            <History size={12} />
            <span>[{t('daily_missions_tab_history', language)}] ({historyStats.totalCompleted})</span>
          </button>
        </div>

        <button
          onClick={() => setShowHistoryModal(true)}
          className="text-[10px] font-bold text-[#201d1d] hover:bg-[#f8f7f7] px-2 py-1 border border-[rgba(15,0,0,0.12)] rounded-sm flex items-center gap-1 cursor-pointer transition-colors"
        >
          <History size={12} />
          <span>{t('daily_missions_open_history_modal', language)}</span>
        </button>
      </div>

      {/* History 탭 활성화 상태 */}
      {activeTab === 'history' ? (
        renderHistoryView()
      ) : allClaimed ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-tight text-[#201d1d]">
              {t('daily_missions_title', language)}
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 ml-auto bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
              {t('daily_missions_all_done', language)}
            </span>
          </div>
          <p className="text-[11px] text-[#646262]">
            {t('daily_missions_tomorrow', language)}
          </p>
        </div>
      ) : (
        <div>
          {/* 헤더 */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="relative flex items-center gap-1.5">
              <Gift size={16} className="text-[#201d1d] shrink-0" />
              {claimableCount > 0 && (
                <span className="w-2 h-2 bg-rose-600 rounded-full animate-pulse" />
              )}
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-[#201d1d]">
                {t('daily_missions_title', language)}
              </h3>
            </div>
          </div>

          {/* Consolidated Compact Header Pill (ID 246) */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 p-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm text-[10px] font-bold">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[#201d1d]">
                <Clock size={11} className="text-amber-600" />
                <span>[{language === 'ko' ? `초기화: ${timeLeft}` : `Resets: ${timeLeft}`}]</span>
              </span>
              <span className="text-[#646262]">|</span>
              <span className="text-[#201d1d]">
                {t('daily_missions_reward_total', language, { amount: totalReward.toLocaleString() })}
              </span>
              {claimableRewardTotal > 0 && (
                <span className="text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-xs">
                  🎁 {t('daily_missions_reward_claimable', language, { amount: claimableRewardTotal.toLocaleString() })}
                </span>
              )}
            </div>

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
                className="text-[10px] font-bold bg-[#201d1d] text-[#fdfcfc] hover:bg-[#333030] px-2.5 py-0.5 rounded-sm cursor-pointer transition-all active:scale-95 border border-[rgba(15,0,0,0.12)]"
              >
                {language === 'ko' ? `일괄 수령 (${claimableCount})` : `Claim All (${claimableCount})`}
              </button>
            )}
          </div>

          <p className="mb-3 text-[10px] font-medium text-[#646262]">
            {t('daily_missions_reset_hint', language)}
          </p>

          {/* 완료/수령 알림 배너 */}
          <AnimatePresence>
            {notificationMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-3 p-2.5 bg-indigo-50 border border-indigo-300 rounded-sm flex items-center justify-between text-xs font-bold text-indigo-950 font-mono"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-600 shrink-0 animate-pulse" />
                  <span>{notificationMsg}</span>
                </div>
                <button
                  onClick={() => setNotificationMsg(null)}
                  className="text-indigo-700 hover:text-indigo-900 font-bold ml-2 cursor-pointer text-xs"
                >
                  [✕]
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 미션 목록 */}
          <div className="space-y-2">
            {DAILY_MISSIONS.map((mission) => {
              const state = missionData.missions[mission.id];
              if (!state) return null;

              const progress = state.progress;
              const target = mission.target;
              const completed = state.completed || progress >= target;
              const claimed = state.claimed;
              const title = language === 'ko' ? mission.title_ko : mission.title_en;
              const pct = Math.min(100, Math.round((progress / target) * 100));

              return (
                <motion.div
                  key={mission.id}
                  layout
                  className={cn(
                    'flex items-center gap-2.5 p-2.5 rounded-sm border transition-colors',
                    claimed
                      ? 'bg-[#f8f7f7] border-[rgba(15,0,0,0.08)] opacity-75'
                      : completed
                        ? 'bg-indigo-50/80 border-indigo-300'
                        : 'bg-[#fdfcfc] border-[rgba(15,0,0,0.12)]'
                  )}
                >
                  {/* 상태 아이콘 */}
                  <div className="shrink-0">
                    {claimed ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : completed ? (
                      <Sparkles size={16} className="text-indigo-600 animate-pulse" />
                    ) : (
                      <Circle size={16} className="text-[#646262]" />
                    )}
                  </div>

                  {/* 미션 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          'text-[11px] sm:text-xs font-bold truncate',
                          claimed
                            ? 'text-[#646262] line-through'
                            : completed
                              ? 'text-indigo-900 font-extrabold'
                              : 'text-[#201d1d]'
                        )}
                      >
                        {title}
                      </span>
                      {/* 보상 표시 (Compact Quest Reward Pill Badge - ID 295) */}
                      <span className="text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-sm shrink-0 flex items-center gap-1 shadow-2xs">
                        <span>🎁</span>
                        <span>+{mission.reward_sns} SNS</span>
                      </span>
                    </div>

                    {/* 진행 바 */}
                    {!claimed && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#e2e0e0] rounded-sm overflow-hidden border border-[rgba(15,0,0,0.08)]">
                          <motion.div
                            className="h-full bg-[#201d1d]"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#646262] shrink-0 font-mono">
                          [{progress}/{target}]
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 수령 버튼 */}
                  {completed && !claimed && (
                    <motion.button
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={() => handleClaim(mission.id)}
                      disabled={claimingId === mission.id}
                      className={cn(
                        'shrink-0 px-3 py-1 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm border border-[rgba(15,0,0,0.12)]',
                        'hover:bg-[#333030] active:scale-95 transition-all cursor-pointer touch-target',
                        claimingId === mission.id && 'opacity-50'
                      )}
                    >
                      {t('daily_missions_claim', language)}
                    </motion.button>
                  )}

                  {/* 수령 완료 표시 */}
                  {claimed && (
                    <span className="text-[10px] font-bold text-emerald-600 shrink-0">
                      [{t('daily_missions_done', language)}]
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 미션 히스토리 상세 팝업 모달 */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#fdfcfc] border-2 border-[#201d1d] w-full max-w-lg p-5 font-mono text-[#201d1d] shadow-2xl relative rounded-none max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-[#201d1d]" />
                  <h2 className="text-sm sm:text-base font-black uppercase tracking-tight">
                    {t('daily_missions_history_title', language)}
                  </h2>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1 hover:bg-[#e2e0e0] border border-[rgba(15,0,0,0.12)] rounded-sm cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {renderHistoryView()}

              <div className="mt-4 pt-3 border-t border-[rgba(15,0,0,0.12)] flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-1.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#333030] cursor-pointer"
                >
                  [CLOSE]
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
