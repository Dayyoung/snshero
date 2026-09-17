import React, { useState, useEffect } from 'react';
import { LogOut, Trophy, User, HelpCircle, BookOpen, Play, Newspaper, ArrowRight, X, ChevronLeft, ChevronRight, Tv, Mail, Bell, Volume2, VolumeX, Zap, Clock, Pause, PanelLeftClose, PanelLeftOpen, Layers, Image, Film, Github, Youtube, Gift, Swords } from "lucide-react";
import { NotificationCenterModal } from "../components/NotificationCenterModal";
import { getUnreadCount } from "../lib/notificationHelper";
import { motion, AnimatePresence } from "motion/react";
import { t } from "../lib/i18n";
import { cn, getCardSpriteStyle } from "../lib/utils";
import { CardData, Language, ViewType, EquipmentSlot } from "../types";
import { CARD_DATABASE } from "../cardDatabase";
import { CardItem } from "../components/CardItem";
import { INITIAL_SKILLS } from "../constants";
import { useGameSettings } from "../contexts/GameSettingsContext";
import { usePerformanceMode } from "../hooks/usePerformanceMode";
import { MainLobbyBannerCarousel } from "../components/MainLobbyBannerCarousel";
import { MailboxModal, getMailboxItems } from "../components/MailboxModal";
import { BeginnerRoadmap } from "../components/BeginnerRoadmap";
import { NoticeModal } from "../components/NoticeModal";
import { AfkPatrolModal } from "../components/AfkPatrolModal";
import { Milestone600CelebrationModal } from "../components/Milestone600CelebrationModal";
import { StarterPackModal } from "../components/StarterPackModal";
import { LobbyInteractiveCard } from "../components/LobbyInteractiveCard";
import { PingIndicator } from "../components/PingIndicator";
import { triggerHaptic } from "../lib/haptic";
import { useSns } from "../contexts/SnsContext";
import { DailyMissions } from "../components/DailyMissions";
import { DAILY_MISSIONS, loadDailyMissions, getClaimableCount, DailyMissionProgress } from "../lib/dailyMissions";
import { HomeQuickHub } from "../components/HomeQuickHub";
import { AfkHarvestBox } from "../components/AfkHarvestBox";
import { LifecycleEngine } from "../lib/LifecycleEngine";
import { Flame, Settings } from "lucide-react";
import { HomeCategoryHubModal, HubCategoryType } from "../components/HomeCategoryHubModal";
import { ResourcePriorityPreloader } from "../lib/ResourcePreloader";
import { LobbyParticleCanvas } from "../components/LobbyParticleCanvas";
import { GrowthPassWidget } from "../components/GrowthPassWidget";

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
  handleLogin: (email?: string) => Promise<void>;
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
  const [showPdf, setShowPdf] = useState(false);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [unreadMailCount, setUnreadMailCount] = useState(0);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isLobbyDrawerOpen, setIsLobbyDrawerOpen] = useState(false);
  const [activeHubCategory, setActiveHubCategory] = useState<HubCategoryType | null>(null);
  const [isNoticeClosed, setIsNoticeClosed] = useState(false);
  // ID 600: Grand Strategist Milestone 600 Celebration
  const [isMilestone600Open, setIsMilestone600Open] = useState(() => localStorage.getItem('hero_milestone_600_claimed') !== 'true');
  // SCR-01-02: Starter Pack state
  const [isStarterPackOpen, setIsStarterPackOpen] = useState(false);
  const [isStarterPackPurchased, setIsStarterPackPurchased] = useState(() => localStorage.getItem('hero_starter_pack_purchased') === 'true');
  const [dailyMissionProgress, setDailyMissionProgress] = useState<DailyMissionProgress>(() => loadDailyMissions());

  useEffect(() => {
    // SCR-01-07: 우선순위 기반 리소스 청크 프리로드
    ResourcePriorityPreloader.preloadCriticalAssets();

    const handleStarterPackUpdate = () => {
      setIsStarterPackPurchased(localStorage.getItem('hero_starter_pack_purchased') === 'true');
    };
    window.addEventListener('hero_starter_pack_purchased_event', handleStarterPackUpdate);
    window.addEventListener('storage', handleStarterPackUpdate);
    return () => {
      window.removeEventListener('hero_starter_pack_purchased_event', handleStarterPackUpdate);
      window.removeEventListener('storage', handleStarterPackUpdate);
    };
  }, []);

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
    return 3; // 기본값 3연승
  });

  // SCR-01-06: Zero Background Overhead via LifecycleEngine
  useEffect(() => {
    const unsubscribe = LifecycleEngine.subscribe((isVisible, hiddenDurationMs) => {
      if (!isVisible) {
        // 비활성 탭 진입 시 즉각 백그라운드 타이머 정지 (배터리/메모리 절감)
        setIsAutoStartPaused(true);
      } else {
        // 포그라운드 복귀 시 장시간 경과된 경우 타이머 리셋
        if (hiddenDurationMs > 3000) {
          setAutoStartCountdown(30);
        }
      }
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
    if (helpOpen) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [helpOpen]);

  const [helpStep, setHelpStep] = useState(0);

  // 30-Second Idle Auto-Start Ranking Battle Timer
  const [autoStartCountdown, setAutoStartCountdown] = useState<number>(30);
  const [isAutoStartPaused, setIsAutoStartPaused] = useState<boolean>(false);

  // User activity resets the 30s timer
  useEffect(() => {
    const handleUserActivity = () => {
      setAutoStartCountdown(30);
    };

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('scroll', handleUserActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, []);

  // Interval timer for 30s countdown
  useEffect(() => {
    if (isAutoStartPaused || helpOpen || isMailboxOpen || isNotifModalOpen || isLoggingIn || isMilestone600Open) {
      return;
    }

    const timer = setInterval(() => {
      setAutoStartCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoStartPaused, helpOpen, isMailboxOpen, isNotifModalOpen, isLoggingIn, isMilestone600Open]);

  useEffect(() => {
    if (autoStartCountdown === 0 && !isAutoStartPaused && !helpOpen && !isMailboxOpen && !isNotifModalOpen && !isLoggingIn && !isMilestone600Open) {
      playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
      onNavigate('ranking');
    }
  }, [autoStartCountdown, isAutoStartPaused, helpOpen, isMailboxOpen, isNotifModalOpen, isLoggingIn, isMilestone600Open, onNavigate, playSfx]);

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

  const clickCountRef = React.useRef(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const onLoginClick = () => {
    if (isLoggingIn) return;
    
    playSfx(
      "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
    );
    
    clickCountRef.current += 1;
    
    if (!timerRef.current) {
      timerRef.current = setTimeout(async () => {
        const finalCount = clickCountRef.current;
        clickCountRef.current = 0;
        timerRef.current = null;
        
        setIsLoggingIn(true);
        try {
          let email: string | undefined = undefined;
          if (finalCount === 2) email = 'dryudryu2@gmail.com';
          else if (finalCount >= 3) email = 'dryudryu3@gmail.com';
          
          await handleLogin(email);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoggingIn(false);
        }
      }, 1000);
    }
  };

  const sectionMotionProps = perf.reducedMotion
    ? {}
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
  const buttonMotionProps = perf.reducedMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };


  return (
    <div className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-6 md:p-8 pb-32 max-w-6xl mx-auto min-h-screen app-bg justify-start text-slate-800 font-sans">
      {/* ── Header: Card Display + Title ── */}
      <header className="grid grid-cols-1 gap-4 sm:gap-6 items-stretch w-full pt-2">
        {/* SCR-01-02: Top First Purchase Limited Deal Banner */}
        <div className="w-full">
          {!isStarterPackPurchased ? (
            <div
              onClick={() => {
                triggerHaptic('heavy');
                playSfx('click');
                setIsStarterPackOpen(true);
              }}
              className="relative overflow-hidden cursor-pointer group rounded-none border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] p-2.5 sm:p-3 hover:bg-[#201d1d]/90 active:scale-[0.99] transition-all select-none font-mono"
            >
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 bg-amber-400 text-[#201d1d] text-[10px] font-black tracking-wider uppercase shrink-0 rounded-none">
                    {language === 'ko' ? '[첫 충전 93% OFF]' : '[1ST BUY 93% OFF]'}
                  </span>
                  <span className="text-xs sm:text-sm font-bold truncate">
                    {language === 'ko'
                      ? '⚡ 1,000원 스타터팩: SSR 확정팩 + 3,000 SNS + AP 물약 5개!'
                      : '⚡ ₩1,000 Starter Pack: Guaranteed SSR + 3,000 SNS + AP Potions!'}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-amber-300 border border-white/20 rounded-none">
                  <span>₩1,000</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 py-2 bg-white border border-[#201d1d]/15 text-[#201d1d] text-[11px] font-mono select-none rounded-none">
              <span className="font-bold flex items-center gap-1.5">
                <span className="text-amber-500">👑</span>
                {language === 'ko' ? '[첫 구매 혜택 완료] SSR 영웅 & 3,000 SNS 적용됨' : '[First Purchase Active] SSR Hero & 3,000 SNS Applied'}
              </span>
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="text-[10px] font-bold text-[#201d1d] border border-[#201d1d]/20 px-2 py-0.5 hover:bg-[#201d1d] hover:text-white transition-all cursor-pointer rounded-none"
              >
                {language === 'ko' ? '[상점 가기 →]' : '[GO TO SHOP →]'}
              </button>
            </div>
          )}
        </div>

        {/* SCR-01-09: 7일 신규 영웅 성장 배틀패스 위젯 */}
        <div className="w-full mb-3">
          <GrowthPassWidget
            language={language}
            onNavigateShop={() => onNavigate('shop')}
            playSfx={playSfx}
          />
        </div>

        <div className="relative min-h-[310px] sm:min-h-[360px] overflow-hidden rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc]">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#201d1d]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(15,0,0,0.02)_1px,transparent_1px)] bg-[size:28px_28px]" />
          {/* SCR-01-07: 로비 배경 지연 파티클 캔버스 */}
          <LobbyParticleCanvas lowSpecMode={lowSpecMode} />
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 py-6 sm:p-8">
            {/* SCR-01: 대표 덱 종합 전투력(CP) 및 연승 불꽃 뱃지 HUD */}
            <div className="w-full max-w-md flex items-center justify-between border-b border-[#201d1d]/10 pb-2 mb-3 font-mono text-xs select-none">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onNavigate('mydeck');
                  }}
                  className="font-bold text-[#201d1d] flex items-center gap-1.5 hover:underline cursor-pointer"
                  title={language === 'ko' ? '마이덱 편집 바로가기' : 'Edit My Deck'}
                >
                  <span className="text-rose-600 font-black">⚔️</span>
                  <span>{language === 'ko' ? '덱 전투력' : 'DECK CP'}:</span>
                  <span className="text-sm font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 border border-indigo-200">
                    {totalPower > 0 ? totalPower : 1420} CP
                  </span>
                </button>
                {winStreak > 0 && (
                  <div 
                    className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-amber-900 font-bold text-[10px] animate-pulse"
                    title={language === 'ko' ? `현재 ${winStreak}연승 질주 중!` : `${winStreak} Winning Streak!`}
                  >
                    <Flame size={12} className="text-amber-600 fill-amber-500" />
                    <span>{winStreak}{language === 'ko' ? '연승' : ' WINS'}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#201d1d]/60 border border-[#201d1d]/15 px-1.5 py-0.5 bg-white">
                  {language === 'ko' ? '티어: BRONZE I' : 'TIER: BRONZE I'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onNavigate('mydeck');
                  }}
                  className="text-[10px] font-bold text-indigo-600 border border-indigo-200 bg-indigo-50/70 px-1.5 py-0.5 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                >
                  {language === 'ko' ? '[덱 편집]' : '[EDIT]'}
                </button>
              </div>
            </div>

            {/* SCR-01-03: Interactive 3D Faction Cards Display */}
            <div className="relative h-36 sm:h-52 md:h-60 w-full flex items-center justify-center overflow-visible select-none">
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
                    lowSpecMode={lowSpecMode}
                    onCardClick={() => {
                      onNavigate('mydeck');
                    }}
                  />
                );
              })}
            </div>

            <div className="text-center overflow-visible px-2 flex flex-col items-center gap-3">
              {/* Main Logo Title */}
              <h1 id="main-logo" className="text-3xl sm:text-4xl md:text-5xl font-extrabold italic tracking-tight flex items-baseline justify-center select-none font-sans whitespace-nowrap">
                <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent pr-1">
                  S&amp;SHERO
                </span>
                <span className="text-slate-900 text-base sm:text-xl not-italic">.com</span>
              </h1>

              {/* SCR-01-05: Streamlined Quick Action Toolbar with HomeQuickHub */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap bg-white border border-[#201d1d]/15 p-1.5 font-mono text-xs select-none relative z-30">
                {/* SCR-01-05: Smart Quick Hub Trigger & Dropdown */}
                <HomeQuickHub
                  language={language}
                  unreadMailCount={unreadMailCount}
                  unreadNotifCount={unreadNotifCount}
                  isAudioMuted={isAudioMuted}
                  deckCount={deckPreview.length}
                  isLobbyDrawerOpen={isLobbyDrawerOpen}
                  onOpenMailbox={() => setIsMailboxOpen(true)}
                  onOpenNotifModal={() => setIsNotifModalOpen(true)}
                  onToggleAudioMute={toggleQuickMute}
                  onNavigateDeck={() => onNavigate('mydeck')}
                  onToggleDrawer={() => setIsLobbyDrawerOpen(!isLobbyDrawerOpen)}
                  onOpenHelp={() => { setHelpOpen(true); setHelpStep(0); }}
                  onNavigateShop={() => onNavigate('shop')}
                  playSfx={playSfx}
                  triggerHaptic={triggerHaptic}
                />

                {/* ID SCR-01: Hot Deal / Free Pack Starter Badge */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    onNavigate('shop');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-400 border border-amber-600 text-[#201d1d] font-bold text-xs cursor-pointer hover:bg-amber-300 active:scale-95 transition-all"
                  title={language === 'ko' ? '일일 무료 카드팩 & 80% 할인 스타터팩' : 'Daily Free Pack & 80% Off Starter Pack'}
                >
                  <Gift size={13} className="text-[#201d1d] shrink-0" />
                  <span className="text-[11px] font-black tracking-tight">{language === 'ko' ? '[🎁 무료팩/특가]' : '[🎁 Free/Deals]'}</span>
                </button>

                {/* 시스템 더보기 & 설정 팝업 트리거 버튼 */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    setActiveHubCategory('system');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#201d1d]/20 text-[#201d1d] hover:border-[#201d1d] hover:bg-stone-50 font-bold text-xs cursor-pointer active:scale-95 transition-all"
                  title={language === 'ko' ? '시스템 설정, 우편함, 사운드, 튜토리얼' : 'System Settings, Mail, Sound & Guides'}
                >
                  <Settings size={13} className="text-[#201d1d] shrink-0" />
                  <span className="text-[11px] font-bold">{language === 'ko' ? '[⚙️ 더보기]' : '[⚙️ More]'}</span>
                  {(unreadMailCount > 0 || unreadNotifCount > 0) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>

                {/* Ping Indicator */}
                <PingIndicator language={language} className="shrink-0" />
              </div>

              {/* ID 79: Mini Daily Mission Progress Banner */}
              {(() => {
                const totalMissions = DAILY_MISSIONS.length;
                const completedMissions = DAILY_MISSIONS.filter(m => dailyMissionProgress.missions[m.id]?.completed).length;
                const claimableCount = getClaimableCount();
                const percent = Math.min(100, Math.round((completedMissions / Math.max(1, totalMissions)) * 100));

                return (
                  <div 
                    onClick={() => {
                      playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                      const el = document.getElementById('daily-missions-section');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        onNavigate('season_hub');
                      }
                    }}
                    className="w-full flex items-center justify-between bg-[#201d1d] border border-[rgba(15,0,0,0.12)] text-[#fdfcfc] rounded-sm px-3 py-1.5 text-xs font-mono cursor-pointer hover:border-amber-400 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-2">
                      <Trophy size={14} className={cn("text-amber-400", claimableCount > 0 ? "animate-bounce" : "")} />
                      <span className="font-bold text-[11px] text-amber-300 group-hover:underline">
                        {language === 'ko' ? '오늘의 일일 미션:' : 'Today\'s Daily Missions:'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 sm:w-24 bg-slate-800 h-2 rounded-none overflow-hidden border border-white/10">
                        <div 
                          className="bg-gradient-to-r from-amber-400 to-amber-500 h-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-black text-amber-400">
                        {completedMissions}/{totalMissions}
                      </span>
                      {claimableCount > 0 && (
                        <span className="bg-amber-500 text-[#201d1d] font-bold text-[10px] px-1.5 py-0.5 rounded-sm animate-pulse">
                          {language === 'ko' ? `${claimableCount}개 수령 가능` : `${claimableCount} Claimable`}
                        </span>
                      )}
                      <ChevronRight size={14} className="text-slate-400 group-hover:text-amber-300 transition-colors" />
                    </div>
                  </div>
                );
              })()}

              {/* SCR-01-04: 24시간 오프라인 방치 순찰 수확 상자 (Zero Background Overhead & Instant Claim) */}
              <AfkHarvestBox
                language={language}
                onClaimSns={(amount) => {
                  addSns(amount, 'afk_patrol_harvest', 'earned');
                }}
                playSfx={playSfx}
              />

              {/* ── Auto-Start Ranking Battle Countdown Bar ── */}
              <div className={cn(
                "w-full flex flex-col sm:flex-row items-center justify-between border px-3 py-2 text-xs font-mono transition-all duration-300 gap-2 rounded-none",
                autoStartCountdown <= 5 && !isAutoStartPaused
                  ? "bg-rose-50 border-rose-500 text-rose-950"
                  : "bg-white border-[#201d1d]/15 text-[#201d1d]"
              )}>
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Zap size={15} className={cn("shrink-0", autoStartCountdown <= 5 && !isAutoStartPaused ? "text-rose-600 animate-bounce" : "text-amber-500 animate-pulse")} />
                  <span>
                    {language === 'ko'
                      ? '[⚡ 30초 대기 랭킹대전 자동 시작]:'
                      : '[⚡ Auto Rank Battle in]:'}
                  </span>
                  <span className={cn(
                    "font-mono font-black px-2 py-0.5 text-xs text-white",
                    autoStartCountdown <= 5 && !isAutoStartPaused
                      ? "bg-rose-600 animate-pulse"
                      : "bg-[#201d1d]"
                  )}>
                    {autoStartCountdown}s
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoStartPaused(!isAutoStartPaused);
                      triggerHaptic('light');
                      playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    }}
                    className="min-h-[40px] px-3 py-1 bg-white border border-[#201d1d]/20 hover:border-[#201d1d] text-xs font-bold text-[#201d1d] cursor-pointer transition active:scale-95 rounded-none"
                  >
                    {isAutoStartPaused
                      ? (language === 'ko' ? '[▶ 재개]' : '[▶ Resume]')
                      : (language === 'ko' ? '[⏸️ 일시정지]' : '[⏸️ Pause]')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('battle_start');
                      playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                      onNavigate('ranking');
                    }}
                    className="min-h-[40px] px-4 py-1.5 bg-[#201d1d] hover:bg-[#201d1d]/90 text-[#fdfcfc] text-xs font-black cursor-pointer transition active:scale-95 flex items-center gap-1.5 border border-[#201d1d] rounded-none"
                  >
                    <span className="text-amber-300">⚔️</span>
                    <span>{language === 'ko' ? '[ 1초 즉시 대전 시작 ]' : '[ QUICK BATTLE ]'}</span>
                  </button>
                </div>
              </div>

              {/* ── 3대 마스터 카테고리 허브 (상위/하위 계층 팝업 모달 허브 구조) ── */}
              <div className="w-full space-y-2 mt-2 mb-2 font-mono select-none">
                {/* 1. 게임 & 배틀 아레나 허브 */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    setActiveHubCategory('game');
                  }}
                  className="w-full p-3 bg-white hover:bg-stone-50 border border-[#201d1d]/20 hover:border-[#201d1d] text-left transition-all active:scale-[0.99] flex items-center justify-between cursor-pointer rounded-none group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 flex items-center justify-center bg-amber-500 text-slate-950 font-black shrink-0 rounded-xs">
                      <Swords size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-[#201d1d] uppercase tracking-tight">
                          {language === 'ko' ? '[🎮 게임 & 배틀 아레나]' : '[🎮 Game & Battle Arena]'}
                        </span>
                        <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 font-black rounded-xs">
                          {language === 'ko' ? '5개 모드' : '5 Modes'}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#646262] truncate mt-0.5">
                        {language === 'ko' ? '메인 3x3 배틀 • Poki 110선 • 시련의 탑 • 예측시장 • 덱 편성' : '3x3 Battle • Poki 110 Arcade • Tower • Prediction • Decks'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#646262] group-hover:text-[#201d1d] group-hover:translate-x-0.5 transition-transform shrink-0">
                    [펼치기 ➔]
                  </span>
                </button>

                {/* 2. IP 미디어 라운지 허브 */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    setActiveHubCategory('media');
                  }}
                  className="w-full p-3 bg-white hover:bg-stone-50 border border-[#201d1d]/20 hover:border-[#201d1d] text-left transition-all active:scale-[0.99] flex items-center justify-between cursor-pointer rounded-none group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 flex items-center justify-center bg-indigo-600 text-white font-black shrink-0 rounded-xs">
                      <BookOpen size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-[#201d1d] uppercase tracking-tight">
                          {language === 'ko' ? '[📚 IP 미디어 라운지]' : '[📚 IP Media Lounge]'}
                        </span>
                        <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 font-black rounded-xs">
                          {language === 'ko' ? '콘텐츠 허브' : 'Media Hub'}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#646262] truncate mt-0.5">
                        {language === 'ko' ? '오리지널 웹소설 • 풀컬러 웹툰 • 애니메이션 • 영화관 • 세계관 도감' : 'Web Novel • Webtoon • Anime • Full Movie • World Codex'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#646262] group-hover:text-[#201d1d] group-hover:translate-x-0.5 transition-transform shrink-0">
                    [펼치기 ➔]
                  </span>
                </button>

                {/* 3. 거래소 & 소셜 길드 허브 */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    setActiveHubCategory('market');
                  }}
                  className="w-full p-3 bg-white hover:bg-stone-50 border border-[#201d1d]/20 hover:border-[#201d1d] text-left transition-all active:scale-[0.99] flex items-center justify-between cursor-pointer rounded-none group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 flex items-center justify-center bg-emerald-600 text-white font-black shrink-0 rounded-xs">
                      <Gift size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-[#201d1d] uppercase tracking-tight">
                          {language === 'ko' ? '[💼 거래소 & 소셜 길드]' : '[💼 Market, Stock & Guild]'}
                        </span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 font-black rounded-xs">
                          {language === 'ko' ? '경제/소셜' : 'Economy'}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#646262] truncate mt-0.5">
                        {language === 'ko' ? '상점/가챠 • 카드 P2P 거래소 • 가상 주식 • 길드전 • 커뮤니티' : 'Shop Packs • Card P2P • Stock Exchange • Guilds • Community'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#646262] group-hover:text-[#201d1d] group-hover:translate-x-0.5 transition-transform shrink-0">
                    [펼치기 ➔]
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── ID 86: Collapsible Sub-Widgets Drawer (Event Banners & Roadmap) ── */}
        <AnimatePresence>
          {isLobbyDrawerOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-mono text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Layers size={14} />
                    {language === 'ko' ? '서브 서랍: 이벤트 배너 & 초보자 가이드' : 'Lobby Sub-Drawer Widgets'}
                  </span>
                  <button
                    onClick={() => setIsLobbyDrawerOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-white"
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
                  "w-full h-14 sm:h-16 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] p-3 sm:p-4 flex items-center justify-center gap-3 sm:gap-4 active:scale-[0.98] transition-all group touch-target rounded-sm cursor-pointer",
                  isLoggingIn && "opacity-50 cursor-not-allowed"
                )}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform shrink-0">
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
                className="w-full bg-[#201d1d] text-[#fdfcfc] p-4.5 flex items-center justify-between active:scale-[0.98] transition-all border border-[rgba(15,0,0,0.12)] group touch-target rounded-sm cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Trophy size={20} className="text-amber-400 shrink-0" />
                  <div className="text-left font-mono">
                    <p className="text-xs sm:text-sm font-bold uppercase">
                      {language === "ko"
                        ? "업적 및 프로필"
                        : "Achievements & Profile"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400">
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
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-sm p-1 text-left transition-all group touch-target hover:bg-[#f8f7f7] active:scale-[0.99]"
                  onClick={() => {
                    playSfx(
                      "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
                    );
                    onNavigate("profile");
                  }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-white/10 bg-slate-800 flex-shrink-0">
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
                      <p className="text-xs sm:text-sm font-bold truncate">
                        {user.displayName || user.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between pr-2 font-mono">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="text-xs sm:text-sm font-bold tracking-tight text-amber-400 truncate"
                        title={totalPower.toLocaleString()}
                      >
                        {totalPower.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2.5 hover:bg-[#f8f7f7] text-[#646262] hover:text-[#201d1d] transition-colors border border-[rgba(15,0,0,0.12)] rounded-sm shrink-0 touch-target cursor-pointer"
                  aria-label="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

      </section>

      {/* ── Footer: Build Version & Last Build Time & ModooSoft Copyright ── */}
      <footer className="w-full mt-4 pt-4 border-t border-[rgba(15,0,0,0.12)] flex flex-col items-center justify-between text-[11px] font-mono text-[#646262] gap-2 select-none">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-[#201d1d]">SNSHero Revolution</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="bg-[#201d1d] text-[#fdfcfc] px-2 py-0.5 rounded-sm text-[10px] font-bold font-mono">
              {BUILD_VERSION}
            </span>
            <span className="text-[#646262] text-[10px] font-mono">
              ({language === 'ko' ? '마지막 빌드 시각: ' : 'Build Time: '}{LAST_BUILD_TIME})
            </span>
          </div>
        </div>
        <div className="text-center text-[10px] text-[#646262] font-mono pt-1">
          © ModooSoft. All rights reserved.
        </div>
      </footer>

      {showPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-0 md:p-6 animate-in fade-in duration-200">
          <div className="relative w-full h-full md:max-w-6xl md:max-h-[92vh] bg-slate-950 md:rounded-2xl overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            {/* iframe */}
            <iframe
              src="/snshero_part1.pdf"
              title="SNSHero Part 1 PDF"
              className="w-full h-full border-none"
            />
            
            {/* 우측 상단 닫기 버튼 */}
            <button
              onClick={() => {
                playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                setShowPdf(false);
              }}
              aria-label={language === 'ko' ? "닫기" : "Close"}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 shadow-lg cursor-pointer transition-all active:scale-95 backdrop-blur-sm"
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
                className="px-5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg border border-slate-700 cursor-pointer transition-all active:scale-95 touch-target flex items-center gap-1.5 backdrop-blur-sm"
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm"
            onClick={() => setHelpOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setHelpOpen(false)}
                aria-label="닫기"
                className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 transition shrink-0"
              >
                <X size={18} />
              </button>
              <div className="flex items-start gap-3 mb-3 pr-8 shrink-0">
                <h3 className="text-lg font-black text-slate-900">{helpSlides[helpStep].title}</h3>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto mb-4 pr-1">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{helpSlides[helpStep].body}</p>
              </div>
              <div className="flex items-center justify-between shrink-0 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400">{helpStep + 1}/{helpSlides.length}</span>
                <div className="flex gap-2">
                  <button
                    disabled={helpStep === 0}
                    onClick={() => setHelpStep(s => s - 1)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold transition",
                      helpStep === 0
                        ? "text-slate-300 cursor-not-allowed"
                        : "text-slate-600 hover:bg-slate-50 active:scale-95"
                    )}
                  >
                    <ChevronLeft size={14} />
                    {language === 'ko' ? '이전' : 'Prev'}
                  </button>
                  {helpStep < helpSlides.length - 1 ? (
                    <button
                      onClick={() => setHelpStep(s => s + 1)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition"
                    >
                      {language === 'ko' ? '다음' : 'Next'}
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setHelpOpen(false)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition"
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
      <NoticeModal
        language={language}
        onNavigate={onNavigate}
        onClose={() => setIsNoticeClosed(true)}
      />

      {/* Milestone 600 Celebration Modal (Item 600) - Sequenced after Notice */}
      <Milestone600CelebrationModal
        isOpen={isNoticeClosed && isMilestone600Open}
        onClose={() => setIsMilestone600Open(false)}
        language={language}
      />

      {/* AFK Patrol Rewards Modal (Item 64) - Sequenced after Milestone */}
      <AfkPatrolModal
        language={language}
        canShow={isNoticeClosed && !isMilestone600Open}
        onClaim={(gold, sns) => {
          if (sns > 0) {
            addSns(sns, 'afk_patrol_reward', 'earned');
          }
        }}
      />

      {/* Progressive Disclosure: Category Hub Modal (ID: Minimal First View) */}
      <HomeCategoryHubModal
        isOpen={activeHubCategory !== null}
        onClose={() => setActiveHubCategory(null)}
        category={activeHubCategory}
        language={language}
        onNavigate={onNavigate}
        playSfx={playSfx}
        isAudioMuted={isAudioMuted}
        onToggleAudioMute={toggleQuickMute}
        unreadMailCount={unreadMailCount}
        unreadNotifCount={unreadNotifCount}
        onOpenMailbox={() => setIsMailboxOpen(true)}
        onOpenNotifModal={() => setIsNotifModalOpen(true)}
        onOpenHelp={() => { setHelpOpen(true); setHelpStep(0); }}
        onOpenRoadmap={() => setIsLobbyDrawerOpen(true)}
        onPlayNow={onStartPlayNow}
      />

      {/* Notification Center Modal (Item 71) */}
      <NotificationCenterModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        language={language}
      />

      {/* SCR-01-02: Starter Pack Modal */}
      <StarterPackModal
        isOpen={isStarterPackOpen}
        onClose={() => setIsStarterPackOpen(false)}
        language={language}
        onPurchased={() => {
          setIsStarterPackPurchased(true);
        }}
      />

      {/* SCR-01-01: Mobile Thumb-Zone Floating '3-Second Instant Battle' FAB */}
      <div className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 z-40 select-none">
        <button
          onClick={() => {
            triggerHaptic('heavy');
            playSfx('click');
            if (onStartPlayNow) {
              onStartPlayNow();
            } else {
              onNavigate('game');
            }
          }}
          className="relative group flex items-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 bg-[#201d1d] hover:bg-slate-800 text-white font-mono font-black text-xs sm:text-sm rounded-full shadow-2xl border-2 border-indigo-500 active:scale-95 transition-all cursor-pointer"
          title={language === 'ko' ? '3초 즉시 배틀 시작' : 'Play Now (3s Instant Match)'}
        >
          {/* Animated Glow / Ping Wave */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-500 opacity-60 blur-xs group-hover:opacity-100 transition-opacity animate-pulse pointer-events-none" />
          
          <span className="relative flex items-center gap-2">
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-white shadow-xs">
              <Zap size={15} className="fill-white" />
            </span>
            <span className="tracking-tight">
              {language === 'ko' ? '[ 3초 즉시 배틀 ]' : '[ PLAY NOW ]'}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};
