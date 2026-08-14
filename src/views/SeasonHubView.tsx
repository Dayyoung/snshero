import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Crown,
  Download,
  Gift,
  HelpCircle,
  Share2,
  Sparkles,
  Star,
  Swords,
  Timer,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { getCharacterIpProfile, getFactionDef } from '../content/characterIpUtils';
import {
  SEASON_CONFIGS,
  getCurrentSeasonConfig,
  getSeasonDaysLeft,
  getSeasonProgress,
  getSeasonTimeline,
  getCurrentWeekInfo,
  getReachedRewardTiers,
  getNextRewardTier,
} from '../content/seasons';
import type { SeasonConfig, SeasonRewardTier, SeasonWeekInfo, SeasonEventMission } from '../content/seasons';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';
import { t } from '../lib/i18n';
import { cn, getFormattedCardName } from '../lib/utils';
import { trackAnalytics, AnalyticsEvent } from '../lib/analyticsEvents';
import type { Language, ViewType, DatabaseCard } from '../types';
import { useSeasonMissions } from '../hooks/useSeasonMissions';
import {
  MISSION_TYPE_META,
  PERIOD_LABEL_KEYS,
  STATUS_LABEL_KEYS,
  DAILY_MISSIONS,
  WEEKLY_MISSIONS,
  getSeasonMissions as getSeasonMissionsFromContent,
} from '../content/seasonMissions';
import { ShareTemplateCard } from '../components/ShareTemplateCard';
import type { ShareTemplateType } from '../lib/shareTemplates';
import type { MissionStatus, SeasonMission } from '../content/seasonMissions';
import { useCardSkins } from '../hooks/useCardSkins';
import { getCurrentWebtoonEpisode, getWebtoonSeasonById } from '../content/webtoonEpisodes';

interface SeasonHubViewProps {
  onNavigate: (view: ViewType) => void;
  language: Language;
  currentSeason: string;
  lowSpecMode: boolean;
  playSfx: (url: string) => void;
  sns: number;
  updateSns?: (amount: number, reason?: string, type?: 'earned' | 'purchased' | string) => void;
}

/** 시즌 허브 로컬 상태 키 */
const SEASON_HUB_KEY = 'hero_season_hub';

interface SeasonHubState {
  claimedRewardTiers: number[];
  completedMissionIds: string[];
  seasonPoints: number;
  interestedCharacters: number[];
}

function loadHubState(season: string): SeasonHubState {
  const raw = getSeasonItem(SEASON_HUB_KEY, season);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fall through
    }
  }
  return {
    claimedRewardTiers: [],
    completedMissionIds: [],
    seasonPoints: 0,
    interestedCharacters: [],
  };
}

function saveHubState(season: string, state: SeasonHubState): void {
  setSeasonItem(SEASON_HUB_KEY, season, JSON.stringify(state));
}

const HELP_SLIDES = [
  {
    titleKey: 'season_help_slide1_title',
    descKey: 'season_help_slide1_desc',
  },
  {
    titleKey: 'season_help_slide2_title',
    descKey: 'season_help_slide2_desc',
  },
  {
    titleKey: 'season_help_slide3_title',
    descKey: 'season_help_slide3_desc',
  },
];

export const SeasonHubView: React.FC<SeasonHubViewProps> = ({
  onNavigate,
  language,
  currentSeason,
  lowSpecMode,
  playSfx,
  sns,
  updateSns,
}) => {
  const hubStateSeasonRef = useRef(currentSeason);
  const config = useMemo(() => getCurrentSeasonConfig(currentSeason), [currentSeason]);
  const daysLeft = useMemo(() => getSeasonDaysLeft(currentSeason), [currentSeason]);
  const progress = useMemo(() => Math.min(100, Math.max(0, getSeasonProgress(currentSeason))), [currentSeason]);
  const timeline = useMemo(() => getSeasonTimeline(currentSeason), [currentSeason]);
  const currentWeek = useMemo(() => getCurrentWeekInfo(currentSeason), [currentSeason]);

  // ── Season Missions Hook ──────────────────────────
  const {
    dailyMissions,
    weeklyMissions,
    seasonMissions,
    missionStates,
    completedCount: missionCompletedCount,
    claimedCount: missionClaimedCount,
    updateProgress,
    claimReward: claimMissionReward,
    getMissionState,
  } = useSeasonMissions(currentSeason);

  const cardSkins = useCardSkins(currentSeason);
  const [hubState, setHubState] = useState<SeasonHubState>(() => loadHubState(currentSeason));
  const [activeTab, setActiveTab] = useState<'overview' | 'missions' | 'rewards'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('mission')) {
      return 'missions';
    }
    return 'overview';
  });
  const [showSeasonShareTemplate, setShowSeasonShareTemplate] = useState(false);
  const [claimingIds, setClaimingIds] = useState<string[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (helpOpen) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [helpOpen]);

  const [helpStep, setHelpStep] = useState(0);

  useEffect(() => {
    if (hubStateSeasonRef.current === currentSeason) return;
    hubStateSeasonRef.current = currentSeason;
    setHubState(loadHubState(currentSeason));
  }, [currentSeason]);

  // Save state when it changes
  useEffect(() => {
    if (hubStateSeasonRef.current !== currentSeason) return;
    saveHubState(currentSeason, hubState);
  }, [hubState, currentSeason]);

  const reachedTiers = useMemo(
    () => getReachedRewardTiers(currentSeason, hubState.seasonPoints),
    [currentSeason, hubState.seasonPoints],
  );
  const nextTier = useMemo(
    () => getNextRewardTier(currentSeason, hubState.seasonPoints),
    [currentSeason, hubState.seasonPoints],
  );

  // Character data for key characters
  const keyCharacterCards = useMemo(() => {
    return config.keyCharacters
      .map((id) => CARD_DATABASE[id])
      .filter(Boolean) as DatabaseCard[];
  }, [config.keyCharacters]);

  const primaryFactionDef = useMemo(
    () => getFactionDef(config.primaryFaction),
    [config.primaryFaction],
  );
  const secondaryFactionDef = useMemo(
    () => getFactionDef(config.secondaryFaction),
    [config.secondaryFaction],
  );
  const currentWebtoonEpisode = useMemo(() => {
    const webtoonSeason = getWebtoonSeasonById(currentSeason) ?? getWebtoonSeasonById('s1');
    return webtoonSeason ? getCurrentWebtoonEpisode(new Date(), webtoonSeason) : null;
  }, [currentSeason]);
  const currentWebtoonSpotlightCard = useMemo(() => {
    const spotlightCardId = currentWebtoonEpisode?.panels[0]?.focusCardId;
    return spotlightCardId ? CARD_DATABASE[spotlightCardId] : undefined;
  }, [currentWebtoonEpisode]);

  // Completed missions count
  const completedMissionCount = useMemo(
    () => config.eventMissions.filter((m) => hubState.completedMissionIds.includes(m.id)).length,
    [config.eventMissions, hubState.completedMissionIds],
  );

  // Toggle character interest
  const toggleCharacterInterest = useCallback(
    (cardId: number) => {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      setHubState((prev) => {
        const interested = prev.interestedCharacters.includes(cardId)
          ? prev.interestedCharacters.filter((id) => id !== cardId)
          : [...prev.interestedCharacters, cardId];
        return { ...prev, interestedCharacters: interested };
      });
    },
    [playSfx],
  );

  // Claim reward tier
  const claimRewardTier = useCallback(
    (tier: SeasonRewardTier) => {
      const idKey = `tier_${tier.tier}`;
      if (claimingIds.includes(idKey)) return;
      if (hubState.claimedRewardTiers.includes(tier.tier)) return;
      if (tier.pointsRequired > hubState.seasonPoints) return;

      setClaimingIds((prev) => [...prev, idKey]);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      setHubState((prev) => ({
        ...prev,
        claimedRewardTiers: [...prev.claimedRewardTiers, tier.tier],
      }));
      if (updateSns) {
        updateSns(tier.rewardSns, t('season_reward_claimed', language));
      }
      setTimeout(() => {
        setClaimingIds((prev) => prev.filter((id) => id !== idKey));
      }, 500);
    },
    [claimingIds, hubState.claimedRewardTiers, hubState.seasonPoints, playSfx, updateSns, language],
  );

  // Mark mission as completed
  const completeMission = useCallback(
    (mission: SeasonEventMission) => {
      const idKey = `mission_${mission.id}`;
      if (claimingIds.includes(idKey)) return;
      if (hubState.completedMissionIds.includes(mission.id)) return;

      setClaimingIds((prev) => [...prev, idKey]);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      setHubState((prev) => ({
        ...prev,
        completedMissionIds: [...prev.completedMissionIds, mission.id],
        seasonPoints: prev.seasonPoints + 50, // Points per mission complete
      }));
      if (updateSns) {
        updateSns(mission.rewardSns, t('season_mission_complete', language));
      }
      trackAnalytics({ event: AnalyticsEvent.SEASON_MISSION_COMPLETE, payload: { missionId: mission.id, missionTitle: t(mission.titleKey, language), rewardSns: mission.rewardSns } });
      setTimeout(() => {
        setClaimingIds((prev) => prev.filter((id) => id !== idKey));
      }, 500);
    },
    [claimingIds, hubState.completedMissionIds, playSfx, updateSns, language],
  );

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return today >= dateStr;
  };

  // ─── Render helpers ────────────────────────────────────

  const renderSeasonBanner = () => (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-5 sm:p-6 mb-4 border border-indigo-500/20 shadow-lg">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-xl" />

      <div className="relative z-10">
        {/* Season title & badge */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Crown size={20} className="text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {t(config.titleKey, language)}
            </h1>
            <button
              onClick={() => { setHelpOpen(true); setHelpStep(0); }}
              className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Help"
              type="button"
            >
              <HelpCircle size={14} className="text-white/70" />
            </button>
          </div>
        </div>

        {/* Key info row */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Days left */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
            <Timer size={14} className="text-red-400" />
            <span className="text-xs font-bold text-red-400">
              {t('season_days_left', language).replace('{days}', String(daysLeft))}
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex-1 min-w-[120px] max-w-[200px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-indigo-400 font-bold">{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  lowSpecMode ? 'bg-indigo-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500',
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>


        </div>
      </div>
    </div>
  );

  const renderKeyCharacters = () => (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            updateProgress('visit_world');
            onNavigate('world-codex');
          }}
          className="text-[11px] text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1 ml-auto"
        >
          {t('season_view_all', language)}
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {keyCharacterCards.map((card) => {
          const profile = getCharacterIpProfile(card.id);
          const isInterested = hubState.interestedCharacters.includes(card.id);
          return (
            <motion.button
              key={card.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              animate={isInterested ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.2 }}
              onClick={() => toggleCharacterInterest(card.id)}
              className={cn(
                'relative group rounded-xl border p-3 flex flex-col items-center gap-2 transition-all duration-200 touch-target cursor-pointer',
                isInterested
                  ? 'border-indigo-400 bg-indigo-50 shadow-sm shadow-indigo-200/30'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              {/* Rarity glow */}
              <div
                className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center',
                  card.rarity === 'legendary'
                    ? 'bg-gradient-to-br from-amber-400 to-yellow-600'
                    : card.rarity === 'gold'
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-600'
                      : 'bg-gradient-to-br from-slate-300 to-slate-400',
                )}
              >
                <span className="text-lg font-black text-white">
                  {getFormattedCardName(card, language).charAt(0)}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-700 text-center leading-tight line-clamp-2">
                {getFormattedCardName(card, language)}
              </span>
              {/* Interest indicator */}
              <div className={cn(
                'absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                isInterested
                  ? 'border-indigo-500 bg-indigo-500 text-white'
                  : 'border-slate-300 bg-white',
              )}>
                {isInterested && <CheckCircle2 size={12} />}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  const renderWeekTimeline = () => (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        {currentWeek && (
          <span className="text-[10px] text-slate-500 font-semibold">
            {t('season_week_label', language).replace('{week}', String(currentWeek.weekNumber))}
          </span>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {timeline.slice(Math.max(0, (currentWeek?.weekNumber ?? 1) - 2), (currentWeek?.weekNumber ?? 1) + 3).map((week) => {
          const isActive = currentWeek?.weekNumber === week.weekNumber;
          const isPast = week.endDate < new Date().toISOString().split('T')[0];
          return (
            <div
              key={week.weekNumber}
              className={cn(
                'flex-shrink-0 w-40 rounded-xl border p-3 transition-all',
                isActive
                  ? 'border-indigo-400 bg-indigo-50 shadow-sm shadow-indigo-200/20'
                  : isPast
                    ? 'border-slate-200 bg-slate-50/50'
                    : 'border-slate-200 bg-white opacity-70',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  'text-[10px] font-black uppercase',
                  isActive ? 'text-indigo-600' : 'text-slate-500',
                )}>
                  {t('season_week_label', language).replace('{week}', String(week.weekNumber))}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                )}
              </div>
              {week.newEpisodes.length > 0 && (
                <div className="mb-1.5">
                  <span className="text-[9px] font-semibold text-amber-600 uppercase">
                    {t('season_new_episodes', language)} ({week.newEpisodes.length})
                  </span>
                </div>
              )}
              {week.newMissions.length > 0 && (
                <div>
                  <span className="text-[9px] font-semibold text-emerald-600 uppercase">
                    {t('season_new_missions', language)} ({week.newMissions.length})
                  </span>
                </div>
              )}
              {/* Next week preview */}
              {!isPast && week.nextWeekPreviewKey && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <span className="text-[9px] text-slate-400 italic">
                    {t('season_next_week', language)}: {t(week.nextWeekPreviewKey, language)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWeeklySpotlight = () => {
    if (!currentWebtoonEpisode || !currentWebtoonSpotlightCard) return null;

    return (
      <div className="mb-5 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              {getFormattedCardName(currentWebtoonSpotlightCard, language)}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {t(currentWebtoonEpisode.titleKey, language)}
            </p>
          </div>
          <div className="rounded-full border border-white bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-700 shadow-sm">
            {currentWebtoonEpisode.releaseDate}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('webtoon')}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white transition-all hover:bg-indigo-500 active:scale-95"
          >
            <BookOpen size={14} />
            {t('home_webtoon_read', language)}
          </button>
          <button
            onClick={() => onNavigate('wiki-card')}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-700 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95"
          >
            <Sparkles size={14} />
            {t('world_open_card', language)}
          </button>
          <button
            onClick={() => onNavigate('mydeck')}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95"
          >
            <Crown size={14} />
            {t('mydeck', language)}
          </button>
        </div>
      </div>
    );
  };

  const renderEventMissions = () => (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-indigo-600 font-bold">
          {completedMissionCount}/{config.eventMissions.length}
        </span>
      </div>
      <div className="space-y-2">
        {config.eventMissions.map((mission) => {
          const isCompleted = hubState.completedMissionIds.includes(mission.id);
          return (
            <div
              key={mission.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-all',
                isCompleted
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              {/* Mission icon */}
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                mission.type === 'battle' && 'bg-red-100 text-red-600',
                mission.type === 'collection' && 'bg-blue-100 text-blue-600',
                mission.type === 'webtoon' && 'bg-amber-100 text-amber-600',
                mission.type === 'community' && 'bg-purple-100 text-purple-600',
                mission.type === 'daily' && 'bg-emerald-100 text-emerald-600',
              )}>
                {mission.type === 'battle' && <Swords size={16} />}
                {mission.type === 'collection' && <Star size={16} />}
                {mission.type === 'webtoon' && <BookOpen size={16} />}
                {mission.type === 'community' && <Users size={16} />}
                {mission.type === 'daily' && <CalendarDays size={16} />}
              </div>

              {/* Mission info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {t(mission.titleKey, language)}
                </p>
              </div>

              {/* Reward */}
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1">
                  <Zap size={12} className="text-yellow-500" />
                  <span className="text-[10px] font-bold text-yellow-600">
                    +{mission.rewardSns.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Complete button */}
              {!isCompleted && (
                <button
                  onClick={() => completeMission(mission)}
                  className="flex-shrink-0 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all touch-target"
                >
                  {t('season_mission_do', language)}
                </button>
              )}
              {isCompleted && (
                <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Hook-based Mission List ──────────────────────
  const renderSeasonMissionList = (missions: SeasonMission[], periodLabelKey: string) => {
    if (missions.length === 0) return null;
    return (
      <div className="mb-3">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 px-1">
          {t(periodLabelKey, language)}
        </h3>
        <div className="space-y-1.5">
          {missions.map((mission) => {
            const state = getMissionState(mission.id);
            const status = state?.status ?? 'in_progress';
            const progress = state?.progress ?? 0;
            const meta = MISSION_TYPE_META[mission.type];
            return (
              <div
                key={mission.id}
                className={cn(
                  'flex items-center gap-2.5 p-2.5 rounded-lg border transition-all',
                  status === 'claimed'
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : status === 'completed'
                      ? 'border-indigo-200 bg-indigo-50/40'
                      : 'border-slate-150 bg-white',
                )}
              >
                {/* Type icon */}
                <span className="text-base flex-shrink-0">{meta.iconKey}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-800 truncate">
                    {t(mission.titleKey, language)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden max-w-[80px]">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          status === 'claimed'
                            ? 'bg-emerald-400'
                            : 'bg-indigo-400',
                        )}
                        style={{ width: `${Math.min(100, (progress / mission.targetValue) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {progress}/{mission.targetValue}
                    </span>
                  </div>
                </div>

                {/* Status / Claim button */}
                <div className="flex-shrink-0">
                  {status === 'claimed' ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : status === 'completed' ? (
                    <button
                      disabled={claimingIds.includes(mission.id)}
                      onClick={() => {
                        if (claimingIds.includes(mission.id)) return;
                        setClaimingIds((prev) => [...prev, mission.id]);
                        const result = claimMissionReward(mission.id);
                        if (result) {
                          if (result.skinUnlockKey) {
                            cardSkins.unlockSkin(result.skinUnlockKey);
                          }
                          if (updateSns) {
                            playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                            updateSns(result.sns, t('season_mission_complete', language));
                            trackAnalytics({ event: AnalyticsEvent.SEASON_MISSION_COMPLETE, payload: { missionId: mission.id, missionTitle: t(mission.titleKey, language), rewardSns: result.sns } });
                          }
                        }
                        setTimeout(() => {
                          setClaimingIds((prev) => prev.filter((id) => id !== mission.id));
                        }, 500);
                      }}
                      className="px-2.5 py-1 bg-indigo-600 text-white text-[9px] font-bold rounded-md hover:bg-indigo-700 active:scale-95 transition-all touch-target disabled:opacity-50"
                    >
                      {t('claim_reward', language)}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRewardTrack = () => (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-slate-500 font-semibold">
          {hubState.seasonPoints}
        </span>
      </div>

      {/* Points progress to next tier */}
      {nextTier && (
        <div className="mb-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-indigo-600 font-bold uppercase">
              {t('season_next_reward', language)}
            </span>
            <span className="text-[10px] text-indigo-500 font-semibold">
              {hubState.seasonPoints} / {nextTier.pointsRequired} pts
            </span>
          </div>
          <div className="h-1.5 bg-indigo-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (hubState.seasonPoints / nextTier.pointsRequired) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-indigo-500 mt-1.5">
            {t(nextTier.rewardTitleKey, language)} — {nextTier.rewardSns.toLocaleString()} SNS
            {nextTier.isPremium && ` (${t('season_premium_badge', language)})`}
          </p>
        </div>
      )}

      {/* Reward tiers */}
      <div className="space-y-2">
        {config.rewardTiers.map((tier) => {
          const isClaimed = hubState.claimedRewardTiers.includes(tier.tier);
          const isReachable = hubState.seasonPoints >= tier.pointsRequired;
          return (
            <div
              key={tier.tier}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-all',
                isClaimed
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : isReachable
                    ? 'border-indigo-300 bg-indigo-50/30 hover:border-indigo-400'
                    : 'border-slate-200 bg-white opacity-60',
              )}
            >
              {/* Tier badge */}
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-xs',
                tier.isPremium
                  ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-600',
              )}>
                {tier.tier}
              </div>

              {/* Tier info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-800">
                    {t(tier.rewardTitleKey, language)}
                  </p>
                  {tier.isPremium && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      ★
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-500">{tier.pointsRequired} pts</span>
                  <span className="text-[10px] text-yellow-600 font-bold">+{tier.rewardSns.toLocaleString()} SNS</span>
                </div>
              </div>

              {/* Claim button */}
              {isClaimed ? (
                <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
              ) : isReachable ? (
                <button
                  onClick={() => claimRewardTier(tier)}
                  className="flex-shrink-0 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold rounded-lg hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition-all touch-target shadow-sm"
                >
                  <Gift size={14} />
                </button>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] text-slate-400">🔒</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCommunityMissions = () => (
    <div className="mb-5">
      <button
        onClick={() => {
          updateProgress('join_community');
          onNavigate('community');
        }}
        className="w-full p-4 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 active:scale-[0.99] transition-all flex items-center gap-3 touch-target"
      >
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
          <Users size={20} className="text-purple-600" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-xs font-bold text-slate-800">
            {t(config.communityMissionKey, language)}
          </p>
        </div>
        <ChevronRight size={18} className="text-purple-400 flex-shrink-0" />
      </button>
    </div>
  );

  const renderQuickActions = () => (
    <div className="grid grid-cols-2 gap-2 mb-6">
      <button
        onClick={() => {
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          updateProgress('read_webtoon');
          onNavigate('webtoon');
        }}
        className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 active:scale-[0.98] transition-all touch-target"
      >
        <BookOpen size={18} className="text-amber-600 flex-shrink-0" />
        <span className="text-xs font-bold text-amber-800">
          {t('season_weekly_webtoon', language)}
        </span>
        <ChevronRight size={14} className="text-amber-400 ml-auto flex-shrink-0" />
      </button>

      <button
        onClick={() => {
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          onNavigate('main');
        }}
        className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 active:scale-[0.98] transition-all touch-target"
      >
        <Swords size={18} className="text-red-600 flex-shrink-0" />
        <span className="text-xs font-bold text-red-800">
          {t('season_featured_battle', language)}
        </span>
        <ChevronRight size={14} className="text-red-400 ml-auto flex-shrink-0" />
      </button>

      <button
        onClick={() => {
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          onNavigate('event');
        }}
        className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 active:scale-[0.98] transition-all touch-target"
      >
        <Gift size={18} className="text-emerald-600 flex-shrink-0" />
        <span className="text-xs font-bold text-emerald-800">
          {t('season_special_events', language)}
        </span>
        <ChevronRight size={14} className="text-emerald-400 ml-auto flex-shrink-0" />
      </button>

      <button
        onClick={() => {
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          updateProgress('share_card');
          onNavigate('share');
        }}
        className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 active:scale-[0.98] transition-all touch-target"
      >
        <Share2 size={18} className="text-blue-600 flex-shrink-0" />
        <span className="text-xs font-bold text-blue-800">
          {t('season_share_mission', language)}
        </span>
        <ChevronRight size={14} className="text-blue-400 ml-auto flex-shrink-0" />
      </button>

      <button
        onClick={() => {
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          updateProgress('share_card');
          setShowSeasonShareTemplate(true);
        }}
        className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 active:scale-[0.98] transition-all touch-target"
      >
        <Download size={18} className="text-purple-600 flex-shrink-0" />
        <span className="text-xs font-bold text-purple-800">
          {t('share_image_template_title', language)}
        </span>
        <ChevronRight size={14} className="text-purple-400 ml-auto flex-shrink-0" />
      </button>
    </div>
  );

  const helpTitle = t(HELP_SLIDES[helpStep]?.titleKey ?? 'season_help_slide1_title', language);
  const helpDesc = t(HELP_SLIDES[helpStep]?.descKey ?? 'season_help_slide1_desc', language);

  // ─── Main render ───────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30">
      {/* Back button header */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:scale-95 transition-all touch-target"
        >
          <ArrowLeft size={14} />
          {t('back', language)}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-36">
        {/* Season banner */}
        {renderSeasonBanner()}

        {/* Quick actions */}
        {renderQuickActions()}

        {/* Tab switcher */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
          {(['overview', 'missions', 'rewards'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 text-xs font-bold rounded-lg transition-all touch-target',
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {tab === 'overview' && t('season_tab_overview', language)}
              {tab === 'missions' && t('season_tab_missions', language)}
              {tab === 'rewards' && t('season_tab_rewards', language)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <>
            {renderKeyCharacters()}
            {renderWeeklySpotlight()}
            {renderWeekTimeline()}
            {renderCommunityMissions()}
          </>
        )}

        {activeTab === 'missions' && (
          <>
            {renderSeasonMissionList(dailyMissions, PERIOD_LABEL_KEYS.daily)}
            {renderSeasonMissionList(weeklyMissions, PERIOD_LABEL_KEYS.weekly)}
            {renderSeasonMissionList(seasonMissions, PERIOD_LABEL_KEYS.season)}
            {renderEventMissions()}
            {renderCommunityMissions()}
          </>
        )}

        {activeTab === 'rewards' && (
          <>
            {renderRewardTrack()}
            {/* Featured battle cards */}
            <div className="mb-5">
              <div className="grid grid-cols-3 gap-2">
                {config.featuredBattleCards.map((cardId) => {
                  const card = CARD_DATABASE[cardId];
                  if (!card) return null;
                  return (
                    <div
                      key={cardId}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-center"
                    >
                      <div
                        className={cn(
                          'w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-1',
                          card.rarity === 'legendary'
                            ? 'bg-gradient-to-br from-amber-400 to-yellow-600'
                            : 'bg-slate-200',
                        )}
                      >
                        <span className="text-xs font-black text-white">
                          {getFormattedCardName(card, language).charAt(0)}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-700 truncate">
                        {getFormattedCardName(card, language)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Help popup */}
      <AnimatePresence>
        {helpOpen && (
          <div className="fixed inset-0 z-[209] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <HelpCircle size={18} className="text-indigo-500" />
                  <h3 className="text-sm font-black text-slate-800">{helpTitle}</h3>
                </div>
                <button
                  onClick={() => setHelpOpen(false)}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                  type="button"
                >
                  <X size={14} className="text-slate-500" />
                </button>
              </div>
              <div className="p-5 min-h-[100px]">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{helpDesc}</p>
              </div>
              <div className="flex items-center justify-between px-4 pb-4">
                <button
                  onClick={() => setHelpStep((s) => Math.max(0, s - 1))}
                  disabled={helpStep === 0}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50 transition-colors"
                  type="button"
                >
                  <ChevronRight size={16} className="text-slate-600 rotate-180" />
                </button>
                <span className="text-[10px] font-bold text-slate-400">
                  {helpStep + 1} / {HELP_SLIDES.length}
                </span>
                <button
                  onClick={() => setHelpStep((s) => Math.min(HELP_SLIDES.length - 1, s + 1))}
                  disabled={helpStep === HELP_SLIDES.length - 1}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50 transition-colors"
                  type="button"
                >
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Template Modal */}
      <AnimatePresence>
        {showSeasonShareTemplate && config && (
          <ShareTemplateCard
            templateType="season"
            language={language}
            seasonTitle={t(config.titleKey, language)}
            seasonSubtitle={t(config.storyArcKey, language)}
            seasonId={currentSeason}
            lowSpecMode={lowSpecMode}
            onClose={() => setShowSeasonShareTemplate(false)}
            showToast={(msg) => console.log(msg)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SeasonHubView;
