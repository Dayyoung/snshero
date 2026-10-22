import React, { useState, useEffect } from 'react';
import { LogOut, Trophy, User, BookOpen, Image, Film, Camera, Play, ArrowRight, X, ChevronLeft, ChevronRight, ShoppingBag, Flame, Layers, Github, Youtube } from "lucide-react";
import { NotificationCenterModal } from "../components/NotificationCenterModal";
import { getUnreadCount } from "../lib/notificationHelper";
import { motion, AnimatePresence } from "motion/react";
import { t } from "../lib/i18n";
import { cn, getCardSpriteStyle } from "../lib/utils";
import { CardData, Language, ViewType } from "../types";
import { CARD_DATABASE } from "../cardDatabase";
import { useGameSettings } from "../contexts/GameSettingsContext";
import { usePerformanceMode } from "../hooks/usePerformanceMode";
import { MainLobbyBannerCarousel } from "../components/MainLobbyBannerCarousel";
import { MailboxModal, getMailboxItems } from "../components/MailboxModal";
import { BeginnerRoadmap } from "../components/BeginnerRoadmap";
import { NoticeModal } from "../components/NoticeModal";
import { AfkPatrolModal } from "../components/AfkPatrolModal";
import { Milestone600CelebrationModal } from "../components/Milestone600CelebrationModal";
import { PwaEventModal } from "../components/PwaEventModal";
import { LobbyInteractiveCard } from "../components/LobbyInteractiveCard";
import { CardLongPressPreviewModal } from "../components/CardLongPressPreviewModal";
import { HomeCategoryHubModal } from "../components/HomeCategoryHubModal";
import { PingIndicator } from "../components/PingIndicator";
import { triggerHaptic } from "../lib/haptic";
import { useSns } from "../contexts/SnsContext";
import { DAILY_MISSIONS, loadDailyMissions, getClaimableCount, DailyMissionProgress } from "../lib/dailyMissions";
import { HomeQuickHub } from "../components/HomeQuickHub";
import { AfkHarvestBox } from "../components/AfkHarvestBox";
import { LifecycleEngine } from "../lib/LifecycleEngine";
import { createHomeWebMcpTools, useWebMcpTools } from "../lib/webMcp/index";
import { startDemoPlay } from "../lib/demoPlayService";

const getCardAvatarStyle = (avatar: string): React.CSSProperties => {
  const cardId = Number(avatar.split(':')[1]) || 1;
  const idx = CARD_DATABASE[cardId] ? cardId : 1;
  return getCardSpriteStyle(idx);
};

const BUILD_VERSION = "v2026.08.09-13:51";
const LAST_BUILD_TIME = "2026.08.09 13:51:00";

interface HomeViewProps {
  playSfx: (url: string) => void;
  bgmStarted: boolean;
  startAudio: () => void;
  totalPower: number;
  currentDeck: CardData[];
  currentSeason?: string;
  onNavigate: (view: ViewType) => void;
  language: Language;
  user: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  handleLogin: (email?: string | any) => Promise<void>;
  handleLogout: () => Promise<void>;
  showRulesBtn?: boolean;
  onStartTutorial?: () => void;
  isTutorialCompleted?: boolean;
  onStartPlayNow?: () => void;
  isTutorialMode?: boolean;
  tutorialStep?: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  playSfx,
  totalPower,
  currentDeck,
  onNavigate,
  language,
  user,
  handleLogin,
  handleLogout,
  onStartPlayNow,
  isTutorialMode,
  tutorialStep,
}) => {
  const { addSns } = useSns();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAfkRewardOpen, setIsAfkRewardOpen] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [isMobilePdfMode, setIsMobilePdfMode] = useState<boolean>(() =>
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent))
  );
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [unreadMailCount, setUnreadMailCount] = useState(0);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isLobbyDrawerOpen, setIsLobbyDrawerOpen] = useState(false);
  // ID 600: Grand Strategist Milestone 600 Celebration
  const [isMilestone600Open, setIsMilestone600Open] = useState(false);
  const [dailyMissionProgress, setDailyMissionProgress] = useState<DailyMissionProgress>(() => loadDailyMissions());
  // PWA 설치 & 알림 등록 이벤트 모달 상태
  const [isPwaEventOpen, setIsPwaEventOpen] = useState(false);
  // 카드 터치 시 상세 정보를 팝업으로 표시할 상태 (마이덱 강제 이동 버그 해결)
  const [selectedPreviewCard, setSelectedPreviewCard] = useState<CardData | null>(null);
  // 미디어 라운지 카테고리 허브 모달 상태
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // WebMCP (Chrome 149+ AI Model Context Protocol) Home Tools Registration
  const homeMcpTools = React.useMemo(() => {
    return createHomeWebMcpTools({
      onNavigate,
      updateSns: addSns,
      playSfx
    });
  }, [onNavigate, addSns, playSfx]);
  useWebMcpTools(homeMcpTools, [homeMcpTools]);

  useEffect(() => {
    const updateUnread = () => {
      const items = getMailboxItems();
      setUnreadMailCount(items.filter(m => !m.isRead).length);
      setUnreadNotifCount(getUnreadCount());
    };
    updateUnread();
    window.addEventListener('hero_mailbox_changed', updateUnread);
    return () => window.removeEventListener('hero_mailbox_changed', updateUnread);
  }, [isNotifModalOpen]);

  useEffect(() => {
    const updateDailyMissions = () => {
      setDailyMissionProgress(loadDailyMissions());
    };
    updateDailyMissions();
    window.addEventListener('hero_daily_missions_updated', updateDailyMissions);
    window.addEventListener('storage', updateDailyMissions);
    return () => {
      window.removeEventListener('hero_daily_missions_updated', updateDailyMissions);
      window.removeEventListener('storage', updateDailyMissions);
    };
  }, []);

  // SCR-01-04: N연승 불꽃 뱃지 상태 (최근 전적 연계)
  const [winStreak, setWinStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hero_win_streak');
      if (saved) return parseInt(saved, 10) || 0;
      const historyStr = localStorage.getItem('hero_match_history');
      if (historyStr) {
        const history = JSON.parse(historyStr);
        let streak = 0;
        for (const match of history) {
          if (match.result === 'win' || match.isWin) {
            streak++;
          } else {
            break;
          }
        }
        return streak;
      }
    } catch {}
    return 0;
  });

  // SCR-01-06: Zero Background Overhead via LifecycleEngine
  useEffect(() => {
    const unsubscribe = LifecycleEngine.subscribe(() => {
      // Background memory optimization
    });
    return () => unsubscribe();
  }, []);

  const { lowSpecMode } = useGameSettings();
  const perf = usePerformanceMode();

  // Quick mute toggle state (Item 47)
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('hero_sfx') === 'false' : false;
  });

  const toggleQuickMute = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hero_sfx', next ? 'false' : 'true');
      localStorage.setItem('hero_bgm', next ? 'false' : 'true');
      window.dispatchEvent(new Event('audio_mute_toggle'));
    }
    if (!next) {
      playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
    }
  };

  // Help popup state
  const [helpOpen, setHelpOpen] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (helpOpen || isAfkRewardOpen || isMilestone600Open || isPwaEventOpen || isMailboxOpen || isNotifModalOpen) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
    return () => {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    };
  }, [helpOpen, isAfkRewardOpen, isMilestone600Open, isPwaEventOpen, isMailboxOpen, isNotifModalOpen]);

  const [helpStep, setHelpStep] = useState(0);



  const helpSlides = React.useMemo(() => [
    {
      title: language === 'ko' ? '덱 미리보기' : 'Deck Preview',
      body: language === 'ko'
        ? '현재 선택된 5장의 대표 카드가 중앙에 표시됩니다. 각 카드의 N/E/S/W 스탯, 장비 장착 여부(목걸이·반지·신발), 보유 스킬을 작은 아이콘으로 확인할 수 있습니다.'
        : 'Your 5 representative cards are displayed in the center. Check each card\'s N/E/S/W stats, equipment status (necklace, rings, boots), and owned skills via small icons.',
    },
    {
      title: language === 'ko' ? '공식 웹소설' : 'Official Web Novel',
      body: language === 'ko'
        ? '눈히어로: 카단과 아케인의 메아리 — 평범하고 우직한 청년 카단이 아케인 대륙의 11개 종족을 모험하며 힘을 일깨우고 위대한 영웅으로 거듭나는 정통 모험 판타지입니다. 매주 새로운 회차가 연재됩니다.'
        : 'SNSHero: Kadan & Arcane Echoes — a classic adventure fantasy following the simple yet determined youth Kadan as he explores 11 races across the Arcane continent, awakening his power to become a legendary hero. New chapters weekly.',
    },
    {
      title: language === 'ko' ? '신원 확인 및 로그인' : 'Identity & Login',
      body: language === 'ko'
        ? 'Google 계정으로 로그인하면 데이터가 클라우드에 안전하게 백업됩니다. 게스트 모드로도 업적과 프로필을 확인할 수 있으며, 로그인 후에는 프로필 편집과 기기 간 데이터 동기화가 가능합니다.'
        : 'Sign in with Google to safely back up your data to the cloud. You can also browse achievements and profile in guest mode. After logging in, you can edit your profile and sync data across devices.',
    },
  ], [language]);

  const deckPreview = currentDeck.length > 0 ? currentDeck : [1, 11, 31, 51, 101];

  const onLoginClick = async () => {
    if (isLoggingIn) return;
    
    playSfx(
      "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
    );
    
    setIsLoggingIn(true);
    try {
      await handleLogin();
    } catch (e) {
      console.error("Login attempt failed:", e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const buttonMotionProps = lowSpecMode || perf.reducedMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };


  return (
    <div className="flex flex-col gap-6 sm:gap-8 p-4 sm:p-6 md:p-8 pb-32 max-w-6xl mx-auto min-h-screen bg-[#fdfcfc] justify-start text-[#201d1d] font-mono">
      {/* ── Header: Card Display + Title ── */}
      <header className="grid grid-cols-1 gap-4 sm:gap-6 items-stretch w-full pt-12 lg:pt-2">
        <div className="rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc]">
          <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[rgba(15,0,0,0.12)] pb-5">
              <div>
                <p className="mb-2 text-sm text-[#646262]">SNSHero Revolution / {language === 'ko' ? '덱 미리보기' : 'Deck Preview'}</p>
                <h1 id="main-logo" className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight">S&amp;SHERO<span className="text-base sm:text-xl font-normal text-[#646262]">.com</span></h1>
              </div>
              <span className="text-sm text-[#646262]">{language === 'ko' ? '티어: BRONZE I' : 'TIER: BRONZE I'}</span>
            </div>
            {/* SCR-01: 대표 덱 종합 전투력(CP) 및 연승 불꽃 뱃지 HUD */}
            <div className="w-full flex items-start sm:items-center justify-between gap-3 font-mono select-none">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onNavigate('mydeck');
                  }}
                   className="min-h-11 rounded-sm text-[#201d1d] flex items-baseline gap-2 hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4"
                  title={language === 'ko' ? '마이덱 편집 바로가기' : 'Edit My Deck'}
                >
                   <span className="text-sm text-[#646262]">{language === 'ko' ? '덱 전투력' : 'DECK CP'}</span>
                   <span className="text-2xl sm:text-3xl font-bold tabular-nums">
                    {totalPower} CP
                  </span>
                </button>
                {winStreak > 0 && (
                  <div 
                     className="inline-flex items-center gap-1 border border-[rgba(15,0,0,0.12)] px-2 py-1 text-[#646262] text-sm"
                    title={language === 'ko' ? `현재 ${winStreak}연승 질주 중!` : `${winStreak} Winning Streak!`}
                  >
                     <Flame size={14} />
                    <span>{winStreak}{language === 'ko' ? '연승' : ' WINS'}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onNavigate('mydeck');
                  }}
                   className="min-h-11 rounded-sm text-sm font-bold text-[#201d1d] border border-[rgba(15,0,0,0.12)] px-3 py-2 hover:bg-[#f1eeee] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {language === 'ko' ? '[덱 편집]' : '[EDIT]'}
                </button>
              </div>
            </div>

            {/* 5장 겹침 부채꼴 카드 덱 쇼케이스 (게임의 고유 아이덴티티) */}
            <div className="relative h-48 sm:h-56 md:h-64 w-full flex items-center justify-center overflow-visible select-none my-2 sm:my-3" role="group" aria-label={language === 'ko' ? '덱 미리보기' : 'Deck Preview'}>
              {deckPreview.map((item, index) => {
                const isDatabaseId = typeof item === 'number';
                const id = isDatabaseId ? item : (item as CardData).imageIndex;
                const cardData = isDatabaseId ? CARD_DATABASE[id] : item;
                if (!cardData) return null;

                const displayCard: CardData = isDatabaseId ? {
                  id: `home-card-${id}`,
                  title_dis: (cardData as any).title_dis,
                  stats: (cardData as any).stats,
                  imageIndex: id,
                  rarity: (cardData as any).rarity,
                  level: (cardData as any).level,
                  owner: null,
                } : item as CardData;

                return (
                  <LobbyInteractiveCard
                    key={displayCard.id}
                    card={displayCard}
                    index={index}
                    totalCards={deckPreview.length}
                    lowSpecMode={lowSpecMode || perf.reducedMotion}
                    language={language}
                    onCardClick={() => {
                      triggerHaptic('light');
                      playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                      setSelectedPreviewCard(displayCard);
                    }}
                  />
                );
              })}
            </div>

            {/* ── Minimalist Core Action Hub ── */}
            <div className="flex flex-col gap-2.5 font-mono">
              <motion.button
                type="button"
                {...buttonMotionProps}
                onClick={() => {
                  triggerHaptic('medium');
                  playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                  if (onStartPlayNow) onStartPlayNow();
                  else onNavigate('main');
                }}
                className="w-full min-h-[52px] px-6 py-3 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#333] font-bold text-base border border-[#201d1d] cursor-pointer flex items-center justify-center gap-3 rounded-sm transition-colors active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Play size={20} className="shrink-0" />
                <span>{language === 'ko' ? '[⚔️ 배틀 시작]' : '[⚔️ START BATTLE]'}</span>
                <ArrowRight size={18} className="shrink-0 opacity-70" />
              </motion.button>

              {/* ── Core Secondary Actions (3개 필수 기능만 정돈된 3열 그리드) ── */}
              <div className="grid grid-cols-3 gap-2">
                {/* 1. 마이덱 */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    onNavigate('mydeck');
                  }}
                  className="min-h-[44px] px-2 py-2 bg-[#fdfcfc] text-[#201d1d] font-bold text-xs sm:text-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#201d1d] hover:text-[#fdfcfc] transition-colors cursor-pointer flex items-center justify-center gap-1.5 rounded-sm"
                >
                  <Layers size={16} className="shrink-0" />
                  <span className="truncate">{language === 'ko' ? '덱 편성' : 'Deck'}</span>
                </button>

                {/* 2. 상점 */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    onNavigate('shop');
                  }}
                  className="min-h-[44px] px-2 py-2 bg-[#fdfcfc] text-[#201d1d] font-bold text-xs sm:text-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#201d1d] hover:text-[#fdfcfc] transition-colors cursor-pointer flex items-center justify-center gap-1.5 rounded-sm"
                >
                  <ShoppingBag size={16} className="shrink-0" />
                  <span className="truncate">{language === 'ko' ? '상점' : 'Shop'}</span>
                </button>

                {/* 3. 랭킹 아레나 */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    onNavigate('ranking');
                  }}
                  className="min-h-[44px] px-2 py-2 bg-[#fdfcfc] text-[#201d1d] font-bold text-xs sm:text-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#201d1d] hover:text-[#fdfcfc] transition-colors cursor-pointer flex items-center justify-center gap-1.5 rounded-sm"
                >
                  <Trophy size={16} className="shrink-0" />
                  <span className="truncate">{language === 'ko' ? '랭킹' : 'Rank'}</span>
                </button>
              </div>

              {/* ── Core IP Media Shortcuts (웹소설, 웹툰, 애니메이션, 실사 시네마 바로가기 4열 그리드) ── */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {/* 1. 웹소설 */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    onNavigate('novel');
                  }}
                  className="min-h-[44px] px-1.5 sm:px-2 py-2 bg-[#fdfcfc] text-[#201d1d] font-bold text-xs sm:text-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#201d1d] hover:text-[#fdfcfc] transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 rounded-sm"
                >
                  <BookOpen size={15} className="shrink-0" />
                  <span className="truncate">{t('home_shortcut_novel', language)}</span>
                </button>

                {/* 2. 웹툰 */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    onNavigate('webtoon');
                  }}
                  className="min-h-[44px] px-1.5 sm:px-2 py-2 bg-[#fdfcfc] text-[#201d1d] font-bold text-xs sm:text-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#201d1d] hover:text-[#fdfcfc] transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 rounded-sm"
                >
                  <Image size={15} className="shrink-0" />
                  <span className="truncate">{t('home_shortcut_webtoon', language)}</span>
                </button>

                {/* 3. 애니메이션 (YouTube + HIT! 강조) */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    onNavigate('movie');
                  }}
                  className="relative min-h-[44px] px-1.5 sm:px-2 py-2 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs sm:text-sm border border-red-600/80 hover:bg-stone-800 transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 rounded-sm"
                  title="SNSHero 공식 애니메이션 (40화) - YouTube 스트리밍"
                >
                  <span className="absolute -top-2 right-1 px-1 py-[1px] bg-red-600 text-[#fdfcfc] text-[9px] font-mono font-black leading-none tracking-tight border border-[#fdfcfc] rounded-sm">
                    HIT!
                  </span>
                  <Youtube size={16} className="shrink-0 text-red-500" />
                  <span className="truncate">{t('home_shortcut_movie', language) || (language === 'ko' ? '애니메이션' : 'Animation')}</span>
                </button>

                {/* 4. 무비 (YouTube + HIT! 강조) */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    onNavigate('cinema');
                  }}
                  className="relative min-h-[44px] px-1.5 sm:px-2 py-2 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs sm:text-sm border border-red-600/80 hover:bg-stone-800 transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 rounded-sm"
                  title="SNSHero 공식 무비 (40화) - YouTube 스트리밍"
                >
                  <span className="absolute -top-2 right-1 px-1 py-[1px] bg-red-600 text-[#fdfcfc] text-[9px] font-mono font-black leading-none tracking-tight border border-[#fdfcfc] rounded-sm">
                    HIT!
                  </span>
                  <Youtube size={16} className="shrink-0 text-red-500" />
                  <span className="truncate">{language === 'ko' ? '무비' : (t('home_shortcut_cinema', language) || 'Movie')}</span>
                </button>
              </div>

              {/* 4. 스마트 퀵 허브 (우편함, 알림, 사운드, 가이드 등 모달 허브) */}
              <HomeQuickHub
                language={language}
                unreadMailCount={unreadMailCount}
                unreadNotifCount={unreadNotifCount}
                isAudioMuted={isAudioMuted}
                deckCount={deckPreview.length}
                isLobbyDrawerOpen={isLobbyDrawerOpen}
                onOpenMailbox={() => setIsMailboxOpen(true)}
                onOpenNotifModal={() => setIsNotifModalOpen(true)}
                onToggleMute={toggleQuickMute}
                onNavigate={(view) => {
                  playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                  onNavigate(view);
                }}
                onToggleDrawer={() => setIsLobbyDrawerOpen(!isLobbyDrawerOpen)}
                onOpenHelp={() => { setHelpOpen(true); setHelpStep(0); }}
                onOpenPwa={() => {
                  triggerHaptic('selection');
                  playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                  setIsPwaEventOpen(true);
                }}
              />
            </div>
          </div>
        </div>

        {/* ── ID 86: Collapsible Sub-Widgets Drawer (Event Banners & Roadmap) ── */}
        <AnimatePresence>
          {isLobbyDrawerOpen && (
            <motion.div
              initial={lowSpecMode || perf.reducedMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={lowSpecMode || perf.reducedMotion ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: lowSpecMode || perf.reducedMotion ? 0 : 0.2 }}
              className="order-3 space-y-4 overflow-hidden"
            >
              <div className="p-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(15,0,0,0.12)] pb-3">
                  <span className="font-mono text-sm font-bold flex items-center gap-2">
                    <Layers size={14} />
                    {language === 'ko' ? '서브 서랍: 이벤트 배너 & 초보자 가이드' : 'Lobby Sub-Drawer Widgets'}
                  </span>
                  <button
                    onClick={() => setIsLobbyDrawerOpen(false)}
                    aria-label={language === 'ko' ? '닫기' : 'Close'}
                    className="min-h-11 min-w-11 flex items-center justify-center rounded-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee]"
                  >
                    <X size={14} />
                  </button>
                </div>
                {/* ── Main Lobby Event Banner Carousel (Item 33) ── */}
                <MainLobbyBannerCarousel
                  language={language}
                  onNavigate={onNavigate}
                  playSfx={playSfx}
                />

                {/* ── Beginner Onboarding Quest Roadmap Widget (Item 49) ── */}
                <BeginnerRoadmap
                  language={language}
                  onNavigate={onNavigate}
                  updateSns={(amt, reason) => {
                    if (amt > 0) {
                      addSns(amt, reason || 'beginner_roadmap_reward', 'earned');
                    }
                  }}
                  playSfx={playSfx}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {(!user || user.uid === 'guest-id') ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Google Login Button */}
              <button
                onClick={onLoginClick}
                disabled={isLoggingIn}
                className={cn(
                  "w-full h-14 sm:h-16 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-3 sm:p-4 flex items-center justify-center gap-3 sm:gap-4 touch-target rounded-sm cursor-pointer",
                  isLoggingIn && "opacity-50 cursor-not-allowed"
                )}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
                  <path
                    fill="#EA4335"
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.36-2.12 4.36-1.12.88-2.6 1.48-5.72 1.48-4.8 0-8.72-3.88-8.72-8.72s3.92-8.72 8.72-8.72c2.6 0 4.56 1.04 5.96 2.32l2.32-2.32c-2.12-2.04-4.92-3.2-8.28-3.2C5.36 0 0 5.36 0 12s5.36 12 12 12c3.56 0 6.24-1.16 8.36-3.32 2.12-2.12 2.84-5.2 2.84-7.76 0-.56-.04-1.12-.12-1.64h-10.6z"
                  />
                </svg>
                <span className="font-bold text-[#201d1d] text-base sm:text-lg uppercase tracking-tight font-mono">
                  {language === 'ko' ? 'Google 로그인' : 'Google Login'}
                </span>
              </button>

              <button
                onClick={() => {
                  playSfx(
                    "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
                  );
                  onNavigate("profile");
                }}
                className="w-full bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] p-4.5 flex items-center justify-between border border-[rgba(15,0,0,0.12)] touch-target rounded-sm cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Trophy size={20} className="shrink-0" />
                  <div className="text-left font-mono">
                    <p className="text-sm font-bold uppercase">
                      {language === "ko"
                        ? "업적 및 프로필"
                        : "Achievements & Profile"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tabular-nums">
                    {totalPower.toLocaleString()} P
                  </span>
                  <span className="text-lg sm:text-xl opacity-60">➔</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="!p-4 border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] flex items-center justify-between gap-3 rounded-none">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-sm p-1 text-left touch-target hover:bg-[#f8f7f7]"
                  onClick={() => {
                    playSfx(
                      "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
                    );
                    onNavigate("profile");
                  }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="w-11 h-11 rounded-none overflow-hidden border border-[rgba(15,0,0,0.12)] bg-[#f1eeee] flex-shrink-0">
                      {user.photoURL?.startsWith('card:') ? (
                        <div className="w-full h-full scale-125" style={getCardAvatarStyle(user.photoURL)} />
                      ) : user.photoURL?.startsWith('preset:') ? (
                        <img 
                          src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Hero-${user.photoURL.split(':')[1]}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                          alt="User"
                          className="w-full h-full object-cover"
                        />
                      ) : user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="User"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-30">
                          <User size={16} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 font-mono">
                      <p className="text-sm font-bold truncate">
                        {user.displayName || user.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between pr-2 font-mono">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="text-sm font-bold tracking-tight text-[#201d1d] truncate"
                        title={totalPower.toLocaleString()}
                      >
                        {totalPower.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 hover:bg-[#f8f7f7] text-[#646262] hover:text-[#201d1d] transition-colors border border-[rgba(15,0,0,0.12)] rounded-sm shrink-0 touch-target cursor-pointer"
                  aria-label="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

      </section>



      {/* ── Footer: Build Version & Last Build Time & ModooSoft Copyright & Links ── */}
      <footer className="w-full mt-4 pt-4 border-t border-[rgba(15,0,0,0.12)] flex flex-col items-center justify-between text-xs font-mono text-[#646262] gap-3 select-none">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#201d1d]">SNSHero Revolution</span>
            <PingIndicator language={language} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="bg-[#201d1d] text-[#fdfcfc] px-2 py-1 rounded-none text-xs font-bold font-mono">
              {BUILD_VERSION}
            </span>
            <span className="text-[#646262] text-xs font-mono">
              ({language === 'ko' ? '마지막 빌드 시각: ' : 'Build Time: '}{LAST_BUILD_TIME})
            </span>
          </div>
        </div>

        <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[rgba(15,0,0,0.06)] text-xs text-[#646262]">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <a
              href="https://github.com/Dayyoung/snshero"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3")}
              className="hover:text-[#201d1d] flex items-center gap-1 cursor-pointer transition-colors"
              title="SNSHero GitHub 소스파일"
            >
              <Github size={13} />
              <span>GitHub</span>
            </a>
            <span>•</span>
            <a
              href="https://www.youtube.com/playlist?list=PLV8H2-pD9vH0"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3")}
              className="hover:text-[#201d1d] flex items-center gap-1 cursor-pointer transition-colors"
              title="바이브코딩 웹게임 개발 강의 (AI Studio)"
            >
              <Youtube size={13} />
              <span>바이브코딩 강의</span>
            </a>
            <span>•</span>
            <a
              href="https://www.youtube.com/@snshero"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3")}
              className="hover:text-[#201d1d] flex items-center gap-1 cursor-pointer transition-colors"
              title="SNSHero 공식 유튜브 채널"
            >
              <Youtube size={13} />
              <span>공식 유튜브</span>
            </a>
            <span>•</span>
            <a
              href="https://ai.studio/apps/636a37c3-97ce-4c80-be46-8c9a6f793f2d"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3")}
              className="hover:text-[#201d1d] flex items-center gap-1 cursor-pointer transition-colors"
              title="SNSHero AI Studio 앱 프로젝트"
            >
              <span>AI Studio</span>
            </a>
            <span>•</span>
            <a
              href="/snshero.md"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3")}
              className="hover:text-[#201d1d] flex items-center gap-1 cursor-pointer transition-colors"
              title="SNSHero 개발 프롬프트 명세서"
            >
              <span>개발 프롬프트</span>
            </a>
          </div>
          <div>© ModooSoft. All rights reserved.</div>
        </div>
      </footer>

      {showPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#201d1d]/80 p-0 md:p-6">
          <div className="relative w-full h-full md:max-w-6xl md:max-h-[92vh] bg-[#fdfcfc] rounded-none overflow-hidden border border-[rgba(15,0,0,0.12)]">
            {/* iframe */}
            <iframe
              src={
                isMobilePdfMode
                  ? (language === 'ko' ? "/snshero_part1_ko_mobile.pdf?v=20261020_mob" : "/snshero_part1_mobile.pdf?v=20261020_mob")
                  : (language === 'ko' ? "/snshero_part1_ko.pdf?v=20261020_mob" : "/snshero_part1.pdf?v=20261020_mob")
              }
              title="SNSHero Part 1 PDF"
              className="w-full h-full border-none"
            />

            {/* 좌측 상단 모바일 큰글자판 / PC 표준판 전환 버튼 */}
            <button
              onClick={() => {
                playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                setIsMobilePdfMode(prev => !prev);
              }}
              className="absolute top-4 left-4 z-20 min-h-11 px-3 py-2 rounded-sm bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] text-xs font-mono font-bold flex items-center gap-1.5 border border-[#201d1d] cursor-pointer"
            >
              <span>
                {isMobilePdfMode
                  ? (language === 'ko' ? '모바일 큰글자판 (PC 표준판 전환)' : 'Mobile Large-Print (Switch to PC)')
                  : (language === 'ko' ? 'PC 표준판 (모바일 큰글자 전환)' : 'PC Standard (Switch to Mobile Large)')}
              </span>
            </button>
            
            {/* 우측 상단 닫기 버튼 */}
            <button
              onClick={() => {
                playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                setShowPdf(false);
              }}
              aria-label={language === 'ko' ? "닫기" : "Close"}
              className="absolute top-4 right-4 z-20 min-w-11 min-h-11 rounded-sm bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] flex items-center justify-center border border-[#201d1d] cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* 우측 하단 닫기 버튼 */}
            <div className="absolute bottom-6 right-6 z-10">
              <button
                onClick={() => {
                  playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                  setShowPdf(false);
                }}
                className="min-h-11 px-5 py-3 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] font-bold text-sm rounded-sm border border-[#201d1d] cursor-pointer flex items-center gap-2"
              >
                ✕ {language === 'ko' ? "닫기" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Popup */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={lowSpecMode || perf.reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={lowSpecMode || perf.reducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: lowSpecMode || perf.reducedMotion ? 0 : 0.15 }}
            className="fixed inset-0 z-[209] flex items-center justify-center bg-[#201d1d]/50 p-3 sm:p-4"
            onClick={() => setHelpOpen(false)}
          >
            <motion.div
              initial={lowSpecMode || perf.reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={lowSpecMode || perf.reducedMotion ? undefined : { opacity: 0, y: 12 }}
              transition={{ duration: lowSpecMode || perf.reducedMotion ? 0 : 0.15 }}
              className="relative w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 sm:p-5"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setHelpOpen(false)}
                aria-label={language === 'ko' ? '닫기' : 'Close'}
                className="absolute top-4 right-4 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#646262] hover:text-[#201d1d] shrink-0"
              >
                <X size={18} />
              </button>
              <div className="flex min-h-11 items-center gap-3 mb-3 pr-14 shrink-0">
                <h3 className="text-lg font-bold text-[#201d1d]">{helpSlides[helpStep].title}</h3>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto mb-4 pr-1">
                <p className="text-sm text-[#646262] leading-relaxed whitespace-pre-line">{helpSlides[helpStep].body}</p>
              </div>
              <div className="flex items-center justify-between shrink-0 pt-2 border-t border-[rgba(15,0,0,0.12)]">
                <span className="text-xs text-[#646262]">{helpStep + 1}/{helpSlides.length}</span>
                <div className="flex gap-2">
                  <button
                    disabled={helpStep === 0}
                    onClick={() => setHelpStep(s => s - 1)}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-1 rounded-sm border border-[rgba(15,0,0,0.12)] px-3 py-2 text-sm font-bold",
                      helpStep === 0
                        ? "text-[#9a9898] bg-[#f1eeee] cursor-not-allowed"
                        : "text-[#646262] hover:bg-[#f1eeee]"
                    )}
                  >
                    <ChevronLeft size={14} />
                    {language === 'ko' ? '이전' : 'Prev'}
                  </button>
                  {helpStep < helpSlides.length - 1 ? (
                    <button
                      onClick={() => setHelpStep(s => s + 1)}
                      className="inline-flex min-h-11 items-center gap-1 rounded-sm bg-[#201d1d] px-3 py-2 text-sm font-bold text-[#fdfcfc] hover:bg-[#302c2c]"
                    >
                      {language === 'ko' ? '다음' : 'Next'}
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setHelpOpen(false)}
                      className="inline-flex min-h-11 items-center gap-1 rounded-sm bg-[#201d1d] px-3 py-2 text-sm font-bold text-[#fdfcfc] hover:bg-[#302c2c]"
                    >
                      {language === 'ko' ? '닫기' : 'Close'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mailbox Modal (Item 29) */}
      <MailboxModal
        isOpen={isMailboxOpen}
        onClose={() => setIsMailboxOpen(false)}
        language={language}
        onClaimReward={(snsAmount) => {
          if (snsAmount > 0) {
            addSns(snsAmount, 'mailbox_reward', 'earned');
          }
        }}
        playSfx={playSfx}
      />

      {/* Notice Modal (Item 55) */}
      {!(isTutorialMode && tutorialStep > 0) && <NoticeModal
        language={language}
        onNavigate={onNavigate}
      />}

      {/* Optional rewards open only when selected in the daily hub. */}
      <Milestone600CelebrationModal
        isOpen={isMilestone600Open}
        onClose={() => setIsMilestone600Open(false)}
        language={language}
      />

      {/* AFK Patrol Rewards Modal (Item 64) */}
      <AfkPatrolModal
        language={language}
        canShow={isAfkRewardOpen}
        onClose={() => setIsAfkRewardOpen(false)}
        onClaim={(gold, sns) => {
          if (sns > 0) {
            addSns(sns, 'afk_patrol_reward', 'earned');
          }
        }}
      />

      {/* Notification Center Modal (Item 71) */}
      <NotificationCenterModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        language={language}
      />

      {/* PWA 설치 & 알림 등록 이벤트 모달 */}
      <PwaEventModal
        isOpen={isPwaEventOpen}
        onClose={() => setIsPwaEventOpen(false)}
        language={language}
        playSfx={playSfx}
        userDisplayName={user?.displayName}
      />

      {/* 미디어 라운지 카테고리 허브 모달 (웹소설, 웹툰, 애니, 영화, 바이브코딩 강의 등) */}
      <HomeCategoryHubModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        category="media"
        language={language}
        onNavigate={onNavigate}
        playSfx={playSfx}
      />

      {/* 카드 터치 미리보기 모달 */}
      <CardLongPressPreviewModal
        card={selectedPreviewCard}
        isOpen={Boolean(selectedPreviewCard)}
        onClose={() => setSelectedPreviewCard(null)}
        language={language}
      />
    </div>
  );
};
