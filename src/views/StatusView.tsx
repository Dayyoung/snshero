import React, { useState, useEffect } from 'react';
import { ViewType, Language } from '../types';
import { Users, Activity, TrendingUp, Gamepad2, Trophy, BarChart3, Zap, RefreshCw, Loader2, HelpCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { t } from '../lib/i18n';
import { PageHeader } from '../components/PageHeader';
import { useAdminStats } from '../hooks/useAdminStats';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface StatusViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  currentSeason: string;
  lowSpecMode: boolean;
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  value: string | number;
  colorClass: string;
  lowSpecMode: boolean;
}> = ({ icon, value, colorClass, lowSpecMode }) => {
  return (
    <div
      className={cn(
        "border border-slate-100 p-4 rounded-2xl bg-white shadow-sm flex items-center gap-4",
        !lowSpecMode && "transition-transform hover:-translate-y-0.5 duration-200"
      )}
    >
      <div className={cn("w-10 h-10 rounded-xl border border-slate-100/55 flex items-center justify-center shrink-0 shadow-xs", colorClass)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-lg font-bold text-slate-800 truncate">{value}</div>
      </div>
    </div>
  );
};

export const StatusView: React.FC<StatusViewProps> = ({ language, onNavigate, currentSeason, lowSpecMode }) => {
  const {
    totalUsers,
    recentUsers24h,
    recentUsers7d,
    returningUsers,
    totalGames,
    avgWinRate,
    avgPower,
    newUsersToday,
    topCards,
    languageDist,
    loading,
    error,
    refetch,
  } = useAdminStats(currentSeason);

  const [showHelp, setShowHelp] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (showHelp) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [showHelp]);

  const [helpSlide, setHelpSlide] = useState(0);

  const maxCardCount = topCards[0]?.count || 1;
  const maxLangCount = languageDist[0]?.count || 1;

  const helpSlides = [
    language === 'ko'
      ? 'SNSHero 전체 사용자 통계 대시보드입니다. 총 사용자 수, 최근 활동, 게임 수, 승률, 평균 전투력 등을 한눈에 확인할 수 있습니다.'
      : 'Overview dashboard for all SNSHero user statistics. View total users, recent activity, game counts, win rates, and average power at a glance.',
    language === 'ko'
      ? '인기 카드 순위와 언어별 분포를 막대 그래프로 확인할 수 있습니다. Firestore 실시간 데이터를 기반으로 집계됩니다.'
      : 'Check top card rankings and language distribution via bar charts, aggregated from real-time Firestore data.',
    language === 'ko'
      ? '새로고침 버튼을 눌러 최신 데이터를 불러올 수 있습니다. 데이터 로딩 중에는 스피너가 표시됩니다.'
      : 'Press the refresh button to load the latest data. A spinner appears while data is loading.'
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 font-sans">
      <div className="p-4 space-y-6 max-w-4xl mx-auto w-full">
        <PageHeader
          title={t('status_title', language)}
          onBack={() => onNavigate('home')}
          rightAction={
            <button
              onClick={() => { setShowHelp(true); setHelpSlide(0); }}
              className="min-h-9 min-w-9 rounded-full border border-slate-300 bg-white/80 text-slate-600 flex items-center justify-center transition-all hover:border-slate-400 hover:bg-white hover:text-slate-800 active:scale-95 cursor-pointer"
              aria-label="Help"
            >
              <HelpCircle size={16} />
            </button>
          }
        />

        {/* Refresh button */}
        <div className="flex justify-end">
          <button
            onClick={refetch}
            className="flex items-center justify-center w-9 h-9 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            aria-label="Refresh"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            icon={<Users size={18} />}
            value={totalUsers.toLocaleString()}
            colorClass="bg-blue-50 text-blue-600"
            lowSpecMode={lowSpecMode}
          />
          <StatCard
            icon={<Activity size={18} />}
            value={recentUsers24h.toLocaleString()}
            colorClass="bg-green-50 text-green-600"
            lowSpecMode={lowSpecMode}
          />
          <StatCard
            icon={<TrendingUp size={18} />}
            value={recentUsers7d.toLocaleString()}
            colorClass="bg-purple-50 text-purple-600"
            lowSpecMode={lowSpecMode}
          />
          <StatCard
            icon={<Users size={18} />}
            value={returningUsers.toLocaleString()}
            colorClass="bg-orange-50 text-orange-600"
            lowSpecMode={lowSpecMode}
          />
          <StatCard
            icon={<Gamepad2 size={18} />}
            value={totalGames.toLocaleString()}
            colorClass="bg-pink-50 text-pink-600"
            lowSpecMode={lowSpecMode}
          />
          <StatCard
            icon={<Trophy size={18} />}
            value={`${avgWinRate}%`}
            colorClass="bg-yellow-50 text-yellow-600"
            lowSpecMode={lowSpecMode}
          />
          <StatCard
            icon={<Zap size={18} />}
            value={avgPower.toLocaleString()}
            colorClass="bg-red-50 text-red-600"
            lowSpecMode={lowSpecMode}
          />
          <StatCard
            icon={<BarChart3 size={18} />}
            value={newUsersToday.toLocaleString()}
            colorClass="bg-cyan-50 text-cyan-600"
            lowSpecMode={lowSpecMode}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="border border-red-200 bg-red-50/50 p-4 rounded-xl text-red-600 font-bold text-center">
            {error}
          </div>
        )}

        {/* Top Cards */}
        <div className="border border-slate-100 bg-white rounded-2xl shadow-sm p-5">
          {topCards.length === 0 ? (
            <div className="text-center text-slate-400 font-semibold text-sm py-8">{t('no_data', language)}</div>
          ) : (
            <div className="space-y-3">
              {topCards.map((card) => (
                <div key={card.index} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-700 truncate mb-1">{card.name}</div>
                    <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                        style={{ width: `${(card.count / maxCardCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-500 shrink-0 min-w-[32px] text-right">{card.count.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Language Distribution */}
        <div className="border border-slate-100 bg-white rounded-2xl shadow-sm p-5">
          {languageDist.length === 0 ? (
            <div className="text-center text-slate-400 font-semibold text-sm py-8">{t('no_data', language)}</div>
          ) : (
            <div className="space-y-3">
              {languageDist.map((lang) => (
                <div key={lang.language} className="flex items-center gap-3">
                  <div className="w-10 text-xs font-bold text-slate-600 uppercase shrink-0">{lang.language}</div>
                  <div className="flex-1">
                    <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                        style={{ width: `${(lang.count / maxLangCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-500 shrink-0 w-8 text-right">{lang.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Help Popup */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative"
            >
              <button
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle size={20} className="text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-800">{t('status_title', language)}</h3>
              </div>
              <div className="min-h-[80px] flex flex-col justify-center text-sm text-slate-600 leading-relaxed mb-4">
                <p>{helpSlides[helpSlide]}</p>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setHelpSlide((s) => Math.max(0, s - 1))}
                  disabled={helpSlide === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[10px] font-bold text-slate-400">{helpSlide + 1} / {helpSlides.length}</span>
                <button
                  onClick={() => setHelpSlide((s) => Math.min(helpSlides.length - 1, s + 1))}
                  disabled={helpSlide === helpSlides.length - 1}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
