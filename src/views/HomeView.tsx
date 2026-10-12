import React, { useState, useEffect } from 'react';
import { LogOut, Trophy, User, BookOpen, Play, ArrowRight, X, ChevronLeft, ChevronRight, Tv, Zap, Clock, Layers, Image, Film, Github, Youtube } from "lucide-react";
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
import { StarterPackModal } from "../components/StarterPackModal";
import { PwaEventModal } from "../components/PwaEventModal";
import { PwaRewardService } from "../lib/pwaRewardService";
import { LobbyInteractiveCard } from "../components/LobbyInteractiveCard";
import { PingIndicator } from "../components/PingIndicator";
import { triggerHaptic } from "../lib/haptic";
import { useSns } from "../contexts/SnsContext";
import { DAILY_MISSIONS, loadDailyMissions, getClaimableCount, DailyMissionProgress } from "../lib/dailyMissions";
import { HomeQuickHub } from "../components/HomeQuickHub";
import { AfkHarvestBox } from "../components/AfkHarvestBox";
import { LifecycleEngine } from "../lib/LifecycleEngine";
import { Flame } from "lucide-react";
import { createHomeWebMcpTools, useWebMcpTools } from "../lib/webMcp/index";

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
  const [isNoticeClosed, setIsNoticeClosed] = useState(false);
  // ID 600: Grand Strategist Milestone 600 Celebration
  const [isMilestone600Open, setIsMilestone600Open] = useState(() => localStorage.getItem('hero_milestone_600_claimed') !== 'true');
  // SCR-01-02: Starter Pack state
  const [isStarterPackOpen, setIsStarterPackOpen] = useState(false);
  const [isStarterPackPurchased, setIsStarterPackPurchased] = useState(() => localStorage.getItem('hero_starter_pack_purchased') === 'true');
  const [dailyMissionProgress, setDailyMissionProgress] = useState<DailyMissionProgress>(() => loadDailyMissions());
  // PWA 설치 & 알림 등록 이벤트 모달 상태
  const [isPwaEventOpen, setIsPwaEventOpen] = useState(false);

  // WebMCP (Chrome 149+ AI Model Context Protocol) Home Tools Registration
  const homeMcpTools = React.useMemo(() => {
    return createHomeWebMcpTools({
      onNavigate,
      updateSns: addSns,
      playSfx
    });
  }, [onNavigate, addSns, playSfx]);
  useWebMcpTools(homeMcpTools, [homeMcpTools]);

  // PWA 설치 & 알림 등록 이벤트 모달 자동 오픈 (오늘 하루 보지 않기 미적용 & 미수령 보상 존재 & 공지 닫힘 & Milestone 닫힘)
  useEffect(() => {
    if (isNoticeClosed && !isMilestone600Open) {
      const isDismissed = PwaRewardService.isEventDismissedToday();
      const allClaimed = PwaRewardService.areAllRewardsClaimed();
      if (!isDismissed && !allClaimed) {
        const timer = setTimeout(() => {
          setIsPwaEventOpen(true);
        }, 350);
        return () => clearTimeout(timer);
      }
    }
  }, [isNoticeClosed, isMilestone600Open]);

  useEffect(() => {
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

  const buttonMotionProps = lowSpecMode || perf.reducedMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };


  return (
    <div className="flex flex-col gap-6 sm:gap-8 p-4 sm:p-6 md:p-8 pb-32 max-w-6xl mx-auto min-h-screen bg-[#fdfcfc] justify-start text-[#201d1d] font-mono">
      {/* ── Header: Card Display + Title ── */}
      <header className="grid grid-cols-1 gap-4 sm:gap-6 items-stretch w-full pt-2">
        {/* SCR-01-02: Top First Purchase Limited Deal Banner */}
        <div className={cn('w-full order-2', !isLobbyDrawerOpen && 'hidden')}>
          {!isStarterPackPurchased ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                playSfx('click');
                setIsStarterPackOpen(true);
              }}
              className="w-full min-h-14 cursor-pointer rounded-sm border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] p-4 text-left hover:bg-[#302c2c] select-none font-mono"
            >
              <div className="relative flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="px-2 py-1 border border-[#fdfcfc]/30 text-sm font-bold shrink-0 rounded-none">
                    {language === 'ko' ? '[첫 충전 93% OFF]' : '[1ST BUY 93% OFF]'}
                  </span>
                  <span className="text-sm font-bold">
                    {language === 'ko'
                      ? '⚡ 1,000원 스타터팩: SSR 확정팩 + 3,000 SNS + AP 물약 5개!'
                      : '⚡ ₩1,000 Starter Pack: Guaranteed SSR + 3,000 SNS + AP Potions!'}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1 shrink-0 px-2.5 py-1 text-sm font-bold border border-white/20 rounded-none">
                  <span>₩1,000</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            </button>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] text-[#201d1d] text-sm select-none rounded-none">
              <span className="font-bold flex items-center gap-1.5">
                {language === 'ko' ? '[첫 구매 혜택 완료] SSR 영웅 & 3,000 SNS 적용됨' : '[First Purchase Active] SSR Hero & 3,000 SNS Applied'}
              </span>
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="min-h-11 text-sm font-bold text-[#201d1d] border border-[rgba(15,0,0,0.12)] px-3 py-2 hover:bg-[#201d1d] hover:text-[#fdfcfc] cursor-pointer rounded-sm"
              >
                {language === 'ko' ? '[상점 가기 →]' : '[GO TO SHOP →]'}
              </button>
            </div>
          )}
        </div>

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
                    {totalPower > 0 ? totalPower : 1420} CP
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

            {/* Collectible dossier: full artwork on desktop, swipeable cards on mobile. */}
            <div className="flex w-full gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-2 pt-1 sm:grid sm:grid-cols-5 lg:grid-cols-[1.35fr_repeat(4,minmax(0,1fr))] sm:items-end sm:gap-3 sm:overflow-visible select-none" role="group" aria-label={language === 'ko' ? '덱 미리보기' : 'Deck Preview'}>
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
                  <div key={displayCard.id} className="w-[min(52vw,220px)] shrink-0 snap-start sm:w-auto sm:min-w-0">
                  <LobbyInteractiveCard
                    key={displayCard.id}
                    card={displayCard}
                    index={index}
                    totalCards={deckPreview.length}
                    lowSpecMode={lowSpecMode || perf.reducedMotion}
                    language={language}
                    onCardClick={() => {
                      onNavigate('mydeck');
                    }}
                  />
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-4">
              <motion.button
                type="button"
                {...buttonMotionProps}
                onClick={() => {
                  triggerHaptic('light');
                  playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                  if (onStartPlayNow) onStartPlayNow();
                  else onNavigate('main');
                }}
                className="w-full min-h-16 px-5 py-4 bg-[#201d1d] text-[#fdfcfc] font-bold text-lg border border-[#201d1d] hover:bg-[#302c2c] cursor-pointer flex items-center justify-between gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                <Play size={22} className="shrink-0" />
                <span>{language === 'ko' ? '[⚔️ 지금 플레이]' : '[⚔️ Play Now]'}</span>
                <ArrowRight size={22} className="shrink-0" />
              </motion.button>
              <div className={cn(
                'w-full flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-[rgba(15,0,0,0.12)] pt-4 text-sm gap-3',
                autoStartCountdown <= 5 && !isAutoStartPaused ? 'bg-rose-50 text-rose-950' : 'text-[#201d1d]',
              )}>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Clock size={16} className="shrink-0" />
                  <span>{language === 'ko' ? '[⚡ 30초 대기 랭킹대전 자동 시작]:' : '[⚡ Auto Rank Battle in]:'}</span>
                  <span className={cn('font-bold px-2 py-1 text-sm text-[#fdfcfc] tabular-nums', autoStartCountdown <= 5 && !isAutoStartPaused ? 'bg-rose-600' : 'bg-[#201d1d]')}>{autoStartCountdown}s</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoStartPaused(!isAutoStartPaused);
                      triggerHaptic('light');
                      playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    }}
                    className="min-h-11 px-3 py-2 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] text-sm font-bold cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {isAutoStartPaused ? (language === 'ko' ? '[▶ 재개]' : '[▶ Resume]') : (language === 'ko' ? '[⏸️ 일시정지]' : '[⏸️ Pause]')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('battle_start');
                      playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                      onNavigate('ranking');
                    }}
                    className="min-h-12 px-4 py-3 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] text-sm font-bold cursor-pointer flex items-center gap-2 border border-[#201d1d] rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <Play size={16} />
                    <span>{language === 'ko' ? '[ 1초 즉시 대전 시작 ]' : '[ QUICK BATTLE ]'}</span>
                  </button>
                </div>
              </div>

              {/* SCR-01-05: Streamlined Quick Action Toolbar with HomeQuickHub */}
              <div className="grid grid-cols-1 gap-3 font-mono">
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

              <details className="group border border-[rgba(15,0,0,0.12)] rounded-none">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2">
                  <span>
                    {language === 'ko' ? '오늘의 일일 미션:' : 'Today\'s Daily Missions:'}
                    {getClaimableCount() > 0 && <span className="block pt-1 text-[#646262] font-normal">{language === 'ko' ? `${getClaimableCount()}개 수령 가능` : `${getClaimableCount()} Claimable`}</span>}
                  </span>
                  <span className="shrink-0 tabular-nums">{DAILY_MISSIONS.filter(m => dailyMissionProgress.missions[m.id]?.completed).length}/{DAILY_MISSIONS.length} <span className="group-open:hidden">[+]</span><span className="hidden group-open:inline">[-]</span></span>
                </summary>
                <div className="space-y-3 border-t border-[rgba(15,0,0,0.12)] p-3">
              {/* ID 79: Mini Daily Mission Progress Banner */}
              {(() => {
                const totalMissions = DAILY_MISSIONS.length;
                const completedMissions = DAILY_MISSIONS.filter(m => dailyMissionProgress.missions[m.id]?.completed).length;
                const claimableCount = getClaimableCount();
                const percent = Math.min(100, Math.round((completedMissions / Math.max(1, totalMissions)) * 100));

                return (
                   <button
                     type="button"
                    onClick={() => {
                      playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                      const el = document.getElementById('daily-missions-section');
                      if (el) {
                         el.scrollIntoView({ behavior: lowSpecMode || perf.reducedMotion ? 'instant' : 'smooth' });
                      } else {
                        onNavigate('season_hub');
                      }
                    }}
                     className="w-full min-h-12 flex flex-wrap items-center justify-between gap-3 bg-[#201d1d] border border-[#201d1d] text-[#fdfcfc] rounded-sm px-3 py-3 text-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                       <Trophy size={16} />
                       <span className="font-bold text-sm group-hover:underline">
                        {language === 'ko' ? '오늘의 일일 미션:' : 'Today\'s Daily Missions:'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-16 sm:w-24 bg-[#646262] h-2 rounded-none overflow-hidden">
                        <div 
                           className="bg-[#fdfcfc] h-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                       <span className="text-sm font-bold tabular-nums">
                        {completedMissions}/{totalMissions}
                      </span>
                      {claimableCount > 0 && (
                         <span className="bg-[#fdfcfc] text-[#201d1d] font-bold text-sm px-2 py-1 rounded-sm">
                          {language === 'ko' ? `${claimableCount}개 수령 가능` : `${claimableCount} Claimable`}
                        </span>
                      )}
                      <ChevronRight size={16} />
                    </div>
                   </button>
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
                </div>
              </details>

              <details className="group border border-[rgba(15,0,0,0.12)] rounded-none">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2">
                  <span>{t('official_channels_purpose_media', language)}</span><span className="group-open:hidden">[+]</span><span className="hidden group-open:inline">[-]</span>
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-[rgba(15,0,0,0.12)] p-3">

                {/* 소설 읽기 */}
                <motion.button
                  {...buttonMotionProps}
                  onClick={() => {
                    triggerHaptic('light');
                    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    onNavigate("novel");
                  }}
                  className="w-full min-h-12 px-3 py-3 bg-[#fdfcfc] text-[#201d1d] font-bold text-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee] cursor-pointer flex items-center justify-start gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <BookOpen size={18} className="shrink-0" />
                  <span>{language === 'ko' ? '[📖 소설 읽기]' : '[📖 Novel]'}</span>
                </motion.button>

                {/* 카툰 보기 */}
                <motion.button
                  {...buttonMotionProps}
                  onClick={() => {
                    triggerHaptic('light');
                    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    onNavigate("webtoon");
                  }}
                  className="w-full min-h-12 px-3 py-3 bg-[#fdfcfc] text-[#201d1d] font-bold text-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee] cursor-pointer flex items-center justify-start gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <Image size={18} className="shrink-0" />
                  <span>{language === 'ko' ? '[🎨 카툰 보기]' : '[🎨 Toon]'}</span>
                </motion.button>

                {/* 애니메이션 보기 */}
                <motion.button
                  {...buttonMotionProps}
                  onClick={() => {
                    triggerHaptic('light');
                    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    onNavigate("anime");
                  }}
                  className="w-full min-h-12 px-3 py-3 bg-[#fdfcfc] text-[#201d1d] font-bold text-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee] cursor-pointer flex items-center justify-start gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <Tv size={18} className="shrink-0" />
                  <span>{language === 'ko' ? '[🎬 애니메이션]' : '[🎬 Anime]'}</span>
                </motion.button>

                {/* 영화 보기 */}
                <motion.button
                  {...buttonMotionProps}
                  onClick={() => {
                    triggerHaptic('light');
                    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                    onNavigate("movie");
                  }}
                  className="w-full min-h-12 px-3 py-3 bg-[#fdfcfc] text-[#201d1d] font-bold text-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee] cursor-pointer flex items-center justify-start gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <Film size={18} className="shrink-0" />
                  <span>{language === 'ko' ? '[🎥 영화 보기]' : '[🎥 Movie]'}</span>
                </motion.button>
                </div>
              </details>
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
                  className="p-2.5 hover:bg-[#f8f7f7] text-[#646262] hover:text-[#201d1d] transition-colors border border-[rgba(15,0,0,0.12)] rounded-sm shrink-0 touch-target cursor-pointer"
                  aria-label="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── External Link Buttons: Source Code & Dev Playlist ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-1">
          <a
            href="https://github.com/Dayyoung/snshero"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3")}
            className="w-full min-h-11 p-3.5 sm:p-4 bg-[#fdfcfc] hover:bg-[#f8f7f7] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-sm flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3 font-mono">
              <Github size={20} className="text-[#201d1d] shrink-0" />
              <div className="text-left">
                <div className="text-sm font-bold uppercase tracking-tight">
                  {language === 'ko' ? '소스코드' : 'Source Code'}
                </div>
                <div className="text-xs text-[#646262] font-mono">GitHub Repository</div>
              </div>
            </div>
            <span className="text-xs font-mono text-[#646262] group-hover:text-[#201d1d] font-bold">
              [↗]
            </span>
          </a>

          <a
            href="https://www.youtube.com/playlist?list=PLV8H2-pD9vH0"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3")}
            className="w-full min-h-11 p-3.5 sm:p-4 bg-[#fdfcfc] hover:bg-[#f8f7f7] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-sm flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3 font-mono">
              <Youtube size={20} className="text-[#201d1d] shrink-0" />
              <div className="text-left">
                <div className="text-sm font-bold uppercase tracking-tight">
                  {language === 'ko' ? '개발동영상' : 'Dev Videos'}
                </div>
                <div className="text-xs text-[#646262] font-mono">YouTube Playlist</div>
              </div>
            </div>
            <span className="text-xs font-mono text-[#646262] group-hover:text-[#201d1d] font-bold">
              [↗]
            </span>
          </a>
        </div>
      </section>

      {/* ── Footer: Build Version & Last Build Time & ModooSoft Copyright ── */}
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
        <div className="text-center text-xs text-[#646262] font-mono pt-1">
          © ModooSoft. All rights reserved.
        </div>
      </footer>

      {showPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#201d1d]/80 p-0 md:p-6">
          <div className="relative w-full h-full md:max-w-6xl md:max-h-[92vh] bg-[#fdfcfc] rounded-none overflow-hidden border border-[rgba(15,0,0,0.12)]">
            {/* iframe */}
            <iframe
              src={language === 'ko' ? "/snshero_part1_ko.pdf" : "/snshero_part1.pdf"}
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
              <div className="flex items-center justify-between shrink-0 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400">{helpStep + 1}/{helpSlides.length}</span>
                <div className="flex gap-2">
                  <button
                    disabled={helpStep === 0}
                    onClick={() => setHelpStep(s => s - 1)}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-1 rounded-sm border border-[rgba(15,0,0,0.12)] px-3 py-2 text-sm font-bold",
                      helpStep === 0
                        ? "text-slate-300 cursor-not-allowed"
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

      {/* PWA 설치 & 알림 등록 이벤트 모달 */}
      <PwaEventModal
        isOpen={isPwaEventOpen}
        onClose={() => setIsPwaEventOpen(false)}
        language={language}
        playSfx={playSfx}
        userDisplayName={user?.displayName}
      />

      {/* SCR-01-01: Mobile Thumb-Zone Floating '3-Second Instant Battle' FAB */}
      <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 select-none sm:hidden">
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
          className="flex min-h-12 items-center gap-2 px-3 py-3 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] font-mono font-bold text-sm whitespace-nowrap rounded-sm border border-[#fdfcfc] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4"
          title={language === 'ko' ? '3초 즉시 배틀 시작' : 'Play Now (3s Instant Match)'}
        >
          <span className="relative flex items-center gap-2">
            <Zap size={18} />
            <span className="tracking-tight">
              {language === 'ko' ? '[ 3초 즉시 배틀 ]' : '[ PLAY NOW ]'}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};
