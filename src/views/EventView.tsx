import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Sparkles, Zap, Gift, Star, ChevronRight, X, TreePine, Dice5, Gamepad2, Lock, AlertCircle, Camera, BookOpen, Swords, Share2, Check, CheckCircle2, Flame, Hash, FileText, HelpCircle, ChevronLeft, Search, Trophy } from 'lucide-react';
import { ChallengeEventSection } from '../components/ChallengeEventSection';
import { SAMPLE_PATCH_NOTES } from '../content/patchNotes';
import { Language, CardData, Item, ItemRarity, InventoryRecord, CardRarity } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import { PageHeader } from '../components/PageHeader';
import { db, analytics, logEvent } from '../lib/firebase';
import { collection, addDoc } from '../lib/firebaseMock';
import { getUserCollectionName } from '../lib/utils';
import { useStoryProgress } from '../hooks/useStoryProgress';
import { useSeasonMissions } from '../hooks/useSeasonMissions';
import { DAILY_MISSIONS, MISSION_TYPE_META } from '../content/seasonMissions';
import { getSpendShortfall, SNS_ECONOMY_COSTS, SNS_ECONOMY_EARNINGS } from '../content/snsEconomy';

import { LuckyRoulette } from '../components/LuckyRoulette';
import { ClawMachine } from '../components/ClawMachine';
import { QrReward } from '../components/QrReward';
import { ArReward } from '../components/ArReward';
import { ArCardViewer } from '../components/ArCardViewer';
import { PatchNoteList } from '../components/PatchNoteList';
import { HeroNineSlotModal } from '../components/HeroNineSlotModal';
import { DailyHiddenHeroModal } from '../components/DailyHiddenHeroModal';

interface EventViewProps {
  language: Language;
  sns: number;
  updateSns: (amount: number, reason?: string) => void;
  playSfx: (url: string) => void;
  user?: any;
  userStats?: any;
  syncUserData?: (data: any) => Promise<void>;
  currentSeason?: string;
  addCard?: (rarity: CardRarity, indexOverride?: number, isSilent?: boolean) => void;
  addItem?: (rarity?: ItemRarity) => Item;
  onClawReward?: (card: CardData) => void;
  onClawPlay?: () => void;
  setView?: (view: string) => void;
  ownedCards?: CardData[];
  inventory?: Record<number, InventoryRecord>;
}

type EventModal = 'none' | 'tree' | 'roulette' | 'claw' | 'ar-view-select' | 'ar-viewer' | 'patchnote' | 'nine-slot' | 'daily-hidden';

interface EventCardBadge {
  label: string;
  className: string;
}

interface EventCardItem {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  desc: string;
  color: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  badge: string;
  badgeColor: string;
  onClick: () => void;
  detailBadges?: EventCardBadge[];
}

// ── Help slides (replaces removed descriptions) ──
const HELP_SLIDES = [
  {
    titleKey: 'event_help_slide1_title',
    descKey: 'event_help_slide1_desc',
  },
  {
    titleKey: 'event_help_slide2_title',
    descKey: 'event_help_slide2_desc',
  },
  {
    titleKey: 'event_help_slide3_title',
    descKey: 'event_help_slide3_desc',
  },
];

export const EventView: React.FC<EventViewProps> = ({
  language,
  sns,
  updateSns,
  playSfx,
  user,
  userStats,
  syncUserData,
  currentSeason,
  addCard,
  addItem,
  onClawReward,
  onClawPlay,
  setView,
  ownedCards = [],
  inventory = {},
}) => {
  // 날짜 기반 고정 카드 ID 산출 (1~110)
  const getTodayArCardId = () => {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = todayStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const cardId = Math.abs(hash % 110) + 1; // 1~110
    return cardId;
  };
  const todayArCardId = getTodayArCardId();

  const getTodayQrCardId = (arCardId: number) => {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let hash = 0;
    const saltStr = todayStr + "_qr_salt";
    for (let i = 0; i < saltStr.length; i++) {
      hash = saltStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    let cardId = Math.abs(hash % 110) + 1;
    if (cardId === arCardId) {
      cardId = (cardId % 110) + 1; // avoid overlap
    }
    return cardId;
  };
  const todayQrCardId = getTodayQrCardId(todayArCardId);
  const isAdmin = user && (
    user.email === 'dryudryu@gmail.com' || 
    user.displayName === 'dryudryu' || 
    (user.displayName && user.displayName.toLowerCase().includes('dryudryu'))
  );
  const cooldownPeriod = SNS_ECONOMY_EARNINGS.repeatable.treeOfTime.cooldownHours * 60 * 60 * 1000;
  const lastFreeCharge = userStats?.lastFreeChargeTime || 0;
  const [treeTimeLeft, setTreeTimeLeft] = useState<number>(0);
  
  // 부지런의 나무 관련 상태 (로컬스토리지에서 획득 시각 조회)
  const [diligenceTimeLeft, setDiligenceTimeLeft] = useState<number>(0);
  const [lastDiligenceTime, setLastDiligenceTime] = useState<number>(0);

  // QR / AR 10시간 쿨다운 타이머 상태
  const [qrTimeLeft, setQrTimeLeft] = useState<number>(0);
  const [arTimeLeft, setArTimeLeft] = useState<number>(0);
  const [lastQrClaim, setLastQrClaim] = useState<number>(0);
  const [lastArClaim, setLastArClaim] = useState<number>(0);

  // 일일 숨은그림 찾기 완료 여부
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [dailyHiddenCleared, setDailyHiddenCleared] = useState<boolean>(false);

  const storyProgress = useStoryProgress({ season: currentSeason });
  const weeklyWebtoon = storyProgress.weeklyWebtoon;
  const storyProgressLabel = `${storyProgress.storyProgressCount}/${storyProgress.totalStoryEpisodes}`;

  // ── Season Missions ───────────────────────────────────
  const {
    dailyMissions,
    missionStates: dailyMissionStates,
    completedCount: dailyCompleted,
    claimedCount: dailyClaimed,
  } = useSeasonMissions(currentSeason ?? 'season1');

  const [activeModal, setActiveModal] = useState<EventModal>('none');
  const [customAlert, setCustomAlert] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false, title: '', message: ''
  });

  // ── Help popup state ──
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

  // Load last claim timestamps
  useEffect(() => {
    const storedDiligence = localStorage.getItem('hero_last_diligence_time');
    if (storedDiligence) {
      setLastDiligenceTime(parseInt(storedDiligence) || 0);
    }
    const storedQr = localStorage.getItem('hero_qr_reward_last_claim');
    if (storedQr) {
      setLastQrClaim(parseInt(storedQr) || 0);
    }
    const storedAr = localStorage.getItem('hero_ar_reward_last_claim');
    if (storedAr) {
      setLastArClaim(parseInt(storedAr) || 0);
    }
    // 숨은그림 찾기 완료 여부 확인
    const isHiddenCleared = localStorage.getItem(`hero_daily_hidden_cleared_${todayDateStr}`) === 'true';
    setDailyHiddenCleared(isHiddenCleared);
  }, [activeModal, todayDateStr]);

  // Tree timer
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const diff = now - lastFreeCharge;
      setTreeTimeLeft(diff < cooldownPeriod ? cooldownPeriod - diff : 0);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastFreeCharge]);

  // Diligence tree timer
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const diff = now - lastDiligenceTime;
      setDiligenceTimeLeft(diff < cooldownPeriod ? cooldownPeriod - diff : 0);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastDiligenceTime]);

  // QR cooldown timer
  useEffect(() => {
    const updateTimer = () => {
      if (isAdmin) {
        setQrTimeLeft(0);
        return;
      }
      const now = Date.now();
      const diff = now - lastQrClaim;
      setQrTimeLeft(diff < cooldownPeriod ? cooldownPeriod - diff : 0);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastQrClaim, isAdmin]);

  // AR cooldown timer
  useEffect(() => {
    const updateTimer = () => {
      if (isAdmin) {
        setArTimeLeft(0);
        return;
      }
      const now = Date.now();
      const diff = now - lastArClaim;
      setArTimeLeft(diff < cooldownPeriod ? cooldownPeriod - diff : 0);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastArClaim, isAdmin]);

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      String(hrs).padStart(2, '0'),
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].join(':');
  };

  const handleFreeCharge = async () => {
    if (!user || user.uid === 'guest-id') {
      setCustomAlert({ isOpen: true, title: language === 'ko' ? '로그인 필요' : 'LOGIN REQUIRED', message: t('not_logged_in', language) });
      return;
    }
    if (treeTimeLeft > 0) {
      setCustomAlert({ isOpen: true, title: language === 'ko' ? '대기 시간' : 'COOLDOWN ACTIVE', message: t('tree_of_time_cooldown_msg', language) });
      return;
    }
    playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
    try {
      const now = Date.now();
      const newSns = sns + SNS_ECONOMY_EARNINGS.repeatable.treeOfTime.reward;
      const updatedStats = { ...(userStats || {}), lastFreeChargeTime: now };
      if (syncUserData) {
        await syncUserData({ sns: newSns, stats: updatedStats });
      }
      if (user?.uid) {
        const historyRef = collection(db, getUserCollectionName(currentSeason), user.uid, 'snsHistory');
        await addDoc(historyRef, { reason: t('tree_of_time', language), amount: SNS_ECONOMY_EARNINGS.repeatable.treeOfTime.reward, timestamp: now });
      }
      updateSns(SNS_ECONOMY_EARNINGS.repeatable.treeOfTime.reward, t('tree_of_time', language));
      setCustomAlert({ isOpen: true, title: language === 'ko' ? '충전 완료!' : 'CHARGE COMPLETE!', message: language === 'ko' ? '1,000 SNS를 획득했습니다!' : '1,000 SNS acquired!' });
    } catch (e) {
      console.error('Free charge error:', e);
    }
  };

  const treeReady = treeTimeLeft === 0;
  const diligenceReady = diligenceTimeLeft === 0;
  const latestPatchNote = SAMPLE_PATCH_NOTES[SAMPLE_PATCH_NOTES.length - 1] ?? null;
  const latestPatchSeason = latestPatchNote?.entries.find((entry) => entry.relatedSeason)?.relatedSeason;
  const latestPatchSeasonLabel = latestPatchSeason
    ? latestPatchSeason.replace(/^season/i, 'S').toUpperCase()
    : null;
  const hasStoryLinkedPatch = latestPatchNote?.entries.some(
    (entry) => entry.deepLinkView === 'webtoon' || entry.relatedSeason !== undefined,
  ) ?? false;

  // ── Quick-action link items (minimal: icon + label + chevron) ──
  interface QuickLink {
    id: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    colorClass: string;
    onClick: () => void;
    rightExtra?: string;
    isNew?: boolean;
  }

  const quickLinks: QuickLink[] = [
    {
      id: 'nine-slot',
      icon: Dice5,
      label: language === 'ko' ? '9구 히어로 슬롯머신' : 'Hero 9-Reel Slot',
      colorClass: 'bg-amber-500',
      onClick: () => setActiveModal('nine-slot'),
      rightExtra: language === 'ko' ? '1회 100 SNS' : '100 SNS / Spin',
      isNew: true,
    },
    {
      id: 'daily-hidden',
      icon: Search,
      label: language === 'ko' ? '일일 숨은그림 찾기' : 'Daily Hidden Hero',
      colorClass: 'bg-cyan-500',
      onClick: () => setActiveModal('daily-hidden'),
      rightExtra: dailyHiddenCleared
        ? (language === 'ko' ? '완료 ✓' : 'Done ✓')
        : (language === 'ko' ? '+1,500 SNS' : '+1,500 SNS'),
      isNew: true,
    },
    {
      id: 'story-hub',
      icon: Sparkles,
      label: t('story_title', language),
      colorClass: 'bg-indigo-500',
      onClick: () => { if (setView) setView('webtoon'); },
    },
    {
      id: 'tree',
      icon: TreePine,
      label: t('tree_of_time', language),
      colorClass: 'bg-emerald-400',
      onClick: handleFreeCharge,
      rightExtra: treeReady ? (language === 'ko' ? '충전 가능' : 'READY') : formatTime(treeTimeLeft),
    },
    {
      id: 'diligence',
      icon: TreePine,
      label: t('tree_of_diligence', language),
      colorClass: 'bg-indigo-400',
      onClick: () => {
        if (!user || user.uid === 'guest-id') {
          setCustomAlert({ isOpen: true, title: language === 'ko' ? '로그인 필요' : 'LOGIN REQUIRED', message: t('not_logged_in', language) });
          return;
        }
        if (setView) setView('community');
      },
      rightExtra: diligenceReady ? (language === 'ko' ? '참여 가능' : 'READY') : formatTime(diligenceTimeLeft),
    },
    {
      id: 'roulette',
      icon: Dice5,
      label: t('roulette_title', language),
      colorClass: 'bg-purple-500',
      onClick: () => setActiveModal('roulette'),
      rightExtra: `${SNS_ECONOMY_COSTS.event.roulette} SNS`,
    },
    {
      id: 'claw',
      icon: Gamepad2,
      label: t('claw_machine', language),
      colorClass: 'bg-rose-400',
      onClick: () => setActiveModal('claw'),
      rightExtra: `${SNS_ECONOMY_COSTS.event.claw} SNS`,
    },
    {
      id: 'qr-reward',
      icon: Sparkles,
      label: t('qr_reward', language),
      colorClass: 'bg-yellow-400',
      onClick: () => {
        if (qrTimeLeft > 0) {
          setCustomAlert({
            isOpen: true,
            title: language === 'ko' ? '대기 시간' : 'COOLDOWN ACTIVE',
            message: language === 'ko' 
              ? `보상은 10시간에 1번만 획득 가능합니다. 남은 시간: ${formatTime(qrTimeLeft)}` 
              : `Rewards can be claimed once every 10 hours. Time left: ${formatTime(qrTimeLeft)}`
          });
          return;
        }
        setActiveModal('qr-reward' as any);
      },
      rightExtra: qrTimeLeft > 0 ? formatTime(qrTimeLeft) : `+${SNS_ECONOMY_EARNINGS.repeatable.qrReward.reward} SNS`,
    },
    {
      id: 'ar-reward',
      icon: Gamepad2,
      label: t('ar_reward', language),
      colorClass: 'bg-purple-400',
      onClick: () => {
        if (arTimeLeft > 0) {
          setCustomAlert({
            isOpen: true,
            title: language === 'ko' ? '대기 시간' : 'COOLDOWN ACTIVE',
            message: language === 'ko' 
              ? `보상은 10시간에 1번만 획득 가능합니다. 남은 시간: ${formatTime(arTimeLeft)}` 
              : `Rewards can be claimed once every 10 hours. Time left: ${formatTime(arTimeLeft)}`
          });
          return;
        }
        setActiveModal('ar-reward' as any);
      },
      rightExtra: arTimeLeft > 0 ? formatTime(arTimeLeft) : `+${SNS_ECONOMY_EARNINGS.repeatable.arReward.reward.toLocaleString()} SNS`,
    },
    {
      id: 'ar-card',
      icon: Gamepad2,
      label: language === 'ko' ? 'AR 히어로 카드' : 'AR Hero Card',
      colorClass: 'bg-slate-500',
      onClick: () => { setActiveModal('ar-view-select'); },
    },
    {
      id: 'patchnote',
      icon: FileText,
      label: t('patchnote_title', language),
      colorClass: 'bg-blue-500',
      onClick: () => setActiveModal('patchnote'),
    },
  ];

  const helpTitle = t(HELP_SLIDES[helpStep]?.titleKey ?? 'event_help_slide1_title', language);
  const helpDesc = t(HELP_SLIDES[helpStep]?.descKey ?? 'event_help_slide1_desc', language);

  return (
    <div className="flex-1 flex flex-col w-full bg-[#fdfcfc] text-[#201d1d] font-mono overflow-y-auto pb-32">
      <div className="max-w-4xl mx-auto w-full px-4">
        <PageHeader
          title={t('event', language)}
          rightAction={
            <button
              onClick={() => { setHelpOpen(true); setHelpStep(0); }}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] flex items-center justify-center hover:bg-[#f8f7f7] transition-colors"
              aria-label="Help"
              type="button"
            >
              <HelpCircle size={16} className="text-[#201d1d]" />
            </button>
          }
        />

        {/* SNS Balance (minimal) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-none border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-4 text-[#201d1d]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-600" />
              <span className="text-2xl font-black tracking-tight">{sns.toLocaleString()} SNS</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setView?.('season-hub');
                }}
                className="min-h-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#201d1d] transition hover:bg-[#f8f7f7]"
              >
                {t('sns_spend_go_season_hub', language)}
              </button>
              <button
                type="button"
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setView?.('community');
                }}
                className="min-h-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#201d1d] transition hover:bg-[#f8f7f7]"
              >
                {t('sns_spend_go_event', language)}
              </button>
            </div>
          </div>
        </motion.div>

        <main className="flex-1 p-4 md:p-8 w-full">
          {/* ── 최상위 NEW 피처드 상업용 이벤트 배너 (베가스 9구 슬롯 & 월리를 찾아라 디오라마 수색) ── */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 배너 1: HERO VEGAS 9구 슬롯머신 */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                setActiveModal('nine-slot');
              }}
              className="group relative p-4 rounded-none border border-[rgba(15,0,0,0.12)] bg-[#201d1d] text-[#fdfcfc] overflow-hidden flex flex-col justify-between cursor-pointer transition-all"
            >
              <img
                src="/minigame_cardslot.png"
                alt="slot background"
                className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-500 pointer-events-none"
              />
              <div className="absolute inset-0 bg-[#201d1d]/80 pointer-events-none" />

              <div className="relative z-10 flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-none overflow-hidden border border-[rgba(15,0,0,0.12)] shrink-0 bg-[#fdfcfc]">
                    <img src="/seat/Kadan.png" alt="Kadan Wild" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-[#fdfcfc] text-[#201d1d] text-[8px] font-black text-center leading-tight">
                      WILD x150
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-[#fdfcfc] tracking-tight">
                        {language === 'ko' ? 'HERO VEGAS 9구 슬롯' : 'HERO VEGAS 9-SLOT'}
                      </h4>
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold bg-[#fdfcfc] text-[#201d1d] rounded-sm">
                        NEW
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-300 mt-0.5 font-medium line-clamp-1">
                      {language === 'ko'
                        ? '8라인 레이저·와일드 조커·피버 2배 무료스핀·최대 150배 잭팟!'
                        : '8 Paylines · Wild Joker · 2x Fever Spins · 150x Jackpot!'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-3.5 pt-2.5 border-t border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-300">
                  <Zap size={13} className="text-amber-400" />
                  <span>{language === 'ko' ? '1회 100 SNS · 피버 무료스핀' : '100 SNS · Fever Free Spins'}</span>
                </div>
                <span className="min-h-[44px] px-3.5 py-2 rounded-sm bg-[#fdfcfc] text-[#201d1d] font-bold text-xs flex items-center gap-1">
                  <span>{language === 'ko' ? '슬롯 입장' : 'PLAY SLOT'}</span>
                  <ChevronRight size={14} />
                </span>
              </div>
            </motion.div>

            {/* 배너 2: 월리를 찾아라 디오라마 숨은 히어로 대수색 */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                setActiveModal('daily-hidden');
              }}
              className="group relative p-4 rounded-none border border-[rgba(15,0,0,0.12)] bg-[#201d1d] text-[#fdfcfc] overflow-hidden flex flex-col justify-between cursor-pointer transition-all"
            >
              <img
                src="/banner/010.png"
                alt="hidden hero world"
                className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-500 pointer-events-none"
              />
              <div className="absolute inset-0 bg-[#201d1d]/80 pointer-events-none" />

              <div className="relative z-10 flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-none overflow-hidden border border-[rgba(15,0,0,0.12)] shrink-0 bg-[#fdfcfc]">
                    <img src="/seat/Poseidon.png" alt="Hidden Hero" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-[#fdfcfc] text-[#201d1d] text-[8px] font-black text-center leading-tight">
                      5 TARGETS
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-[#fdfcfc] tracking-tight">
                        {language === 'ko' ? '월리를 찾아라: 히어로 대수색' : "WHERE'S HERO? : WORLD HUNT"}
                      </h4>
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold bg-[#fdfcfc] text-[#201d1d] rounded-sm">
                        NEW
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-300 mt-0.5 font-medium line-clamp-1">
                      {language === 'ko'
                        ? '상자·수풀 들춰보기 & 광학 스코프로 군중 속 영웅 5명 색출!'
                        : 'Peek behind props & use optical scope to spot 5 heroes!'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-3.5 pt-2.5 border-t border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-300">
                  <Gift size={13} className="text-stone-300" />
                  <span>
                    {dailyHiddenCleared
                      ? (language === 'ko' ? '오늘 보상 완료 ✓ (자유 투어)' : 'Claimed ✓ (Free Tour)')
                      : '+1,500 SNS 일일 보상'}
                  </span>
                </div>
                <span className="min-h-[44px] px-3.5 py-2 rounded-sm bg-[#fdfcfc] text-[#201d1d] font-bold text-xs flex items-center gap-1">
                  <span>{language === 'ko' ? '월드 수색' : 'START HUNT'}</span>
                  <ChevronRight size={14} />
                </span>
              </div>
            </motion.div>
          </div>

          {/* ── Quick-link list ── */}
          <div className="space-y-2 mb-6">
            {quickLinks.map((link, idx) => {
              const IconComp = link.icon;
              return (
                <motion.button
                  key={link.id}
                  className="min-h-[44px] w-full flex items-center gap-3 p-3.5 rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f8f7f7] active:scale-[0.99] transition-all"
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    link.onClick();
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <div className="w-9 h-9 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#201d1d] text-[#fdfcfc] flex items-center justify-center shrink-0">
                    <IconComp size={16} />
                  </div>
                  <div className="flex-1 flex items-center gap-2 text-left">
                    <span className="text-sm font-bold text-[#201d1d]">
                      {link.label}
                    </span>
                    {link.isNew && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#201d1d] text-[#fdfcfc] rounded-sm">
                        NEW
                      </span>
                    )}
                  </div>
                  {link.rightExtra && (
                    <span className="text-[10px] font-semibold text-stone-500 shrink-0">
                      {link.rightExtra}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-stone-400 shrink-0" />
                </motion.button>
              );
            })}
          </div>

          {/* ── 외부 SNS 챌린지 이벤트 ── */}
          <ChallengeEventSection
            language={language}
            currentSeason={currentSeason}
            playSfx={playSfx}
            setView={setView}
          />
        </main>
      </div>

      <Suspense
        fallback={
          <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4 font-mono">
            <div className="flex flex-col items-center gap-3 rounded-none border border-[#201d1d] bg-[#201d1d] px-6 py-5 text-[#fdfcfc]">
              <div className="h-8 w-8 animate-spin rounded-none border-2 border-stone-700 border-t-white" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{t('loading', language)}</span>
            </div>
          </div>
        }
      >
        {/* Hero 9-Reel Slot Modal */}
        {activeModal === 'nine-slot' && (
          <HeroNineSlotModal
            isOpen={activeModal === 'nine-slot'}
            onClose={() => setActiveModal('none')}
            sns={sns}
            updateSns={updateSns}
            playSfx={playSfx}
            language={language}
            addCard={addCard}
            addItem={addItem}
          />
        )}

        {/* Daily Hidden Hero Hunt Modal */}
        {activeModal === 'daily-hidden' && (
          <DailyHiddenHeroModal
            isOpen={activeModal === 'daily-hidden'}
            onClose={() => setActiveModal('none')}
            updateSns={updateSns}
            playSfx={playSfx}
            language={language}
          />
        )}

        {/* Lucky Roulette Modal */}
        {activeModal === 'roulette' && (
          <LuckyRoulette
            isOpen={activeModal === 'roulette'}
            onClose={() => setActiveModal('none')}
            sns={sns}
            updateSns={updateSns}
            addCard={addCard || (() => {})}
            addItem={() => addItem?.()}
            playSfx={playSfx}
            language={language}
          />
        )}

        {/* Claw Machine Modal */}
        {activeModal === 'claw' && (
          <ClawMachine
            isOpen={activeModal === 'claw'}
            onClose={() => setActiveModal('none')}
            userStats={{ ...userStats, sns }}
            onReward={(card) => {
              if (onClawReward) {
                onClawReward(card);
              }
            }}
            onPlay={onClawPlay}
            language={language}
            t={(key) => t(key, language)}
          />
        )}

        {activeModal === ('qr-reward' as any) && (
          <QrReward
            isOpen={activeModal === ('qr-reward' as any)}
            onClose={() => setActiveModal('none')}
            language={language}
            todayArCardId={todayArCardId}
            todayQrCardId={todayQrCardId}
            onSuccess={(scannedText) => {
              if (scannedText) {
                const prefix = 'snshero_card_';
                if (scannedText.startsWith(prefix)) {
                  const cardId = parseInt(scannedText.substring(prefix.length), 10);
                  if (cardId !== todayQrCardId) {
                    setCustomAlert({
                      isOpen: true,
                      title: language === 'ko' ? '인식 실패' : 'SCAN FAILED',
                      message: language === 'ko'
                        ? '오늘의 타겟 QR 대상 카드가 아닙니다! 오늘의 타겟 QR 카드를 카드도감에서 촬영해주세요.'
                        : 'This is not todays target QR card! Please scan the designated target QR card in the Encyclopedia.'
                    });
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                    return;
                  }
                }
                localStorage.setItem('hero_qr_reward_last_claim', Date.now().toString());
                setLastQrClaim(Date.now());
                updateSns(SNS_ECONOMY_EARNINGS.repeatable.qrReward.reward, t('qr_reward', language));
                setActiveModal('none');
                setCustomAlert({
                  isOpen: true,
                  title: language === 'ko' ? '지급 완료!' : 'REWARD CLAIMED!',
                  message: t('qr_code_scanned_success', language)
                });
                playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
              }
            }}
          />
        )}

        {/* AR Card Reward Modal */}
        {activeModal === ('ar-reward' as any) && (
          <ArReward
            isOpen={activeModal === ('ar-reward' as any)}
            onClose={() => setActiveModal('none')}
            language={language}
            todayArCardId={todayArCardId}
            onSuccess={() => {
              localStorage.setItem('hero_ar_reward_last_claim', Date.now().toString());
              setLastArClaim(Date.now());
              updateSns(SNS_ECONOMY_EARNINGS.repeatable.arReward.reward, t('ar_reward', language));
              setActiveModal('none');
              setCustomAlert({
                isOpen: true,
                title: language === 'ko' ? '지급 완료!' : 'REWARD CLAIMED!',
                message: t('ar_card_detected_success', language)
              });
              playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            }}
          />
        )}

        {/* AR Card 3D Viewer Showcase Modal */}
        {activeModal === 'ar-view-select' && (
          <ArCardViewer
            isOpen={activeModal === 'ar-view-select'}
            onClose={() => setActiveModal('none')}
            language={language}
            ownedCards={ownedCards}
            inventory={inventory}
            showCameraPreview={true}
          />
        )}

        {/* Patch Note Modal */}
        {activeModal === 'patchnote' && (
          <div className="fixed inset-0 z-[9997] flex items-center justify-center p-4 bg-black/50 overflow-y-auto font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-[#fdfcfc] text-[#201d1d] w-full max-w-lg rounded-none overflow-hidden border border-[#201d1d] relative my-8"
            >
              {/* Modal Header */}
              <div className="p-4 bg-[#201d1d] text-[#fdfcfc] border-b border-[#201d1d] flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-stone-300" />
                  <h2 className="text-sm font-bold uppercase tracking-wide">
                    {t('patchnote_title', language)}
                  </h2>
                </div>
                <button
                  onClick={() => setActiveModal('none')}
                  className="min-w-[44px] min-h-[44px] rounded-sm text-stone-300 hover:text-white flex items-center justify-center cursor-pointer"
                  aria-label="Close"
                ><X size={20} /></button>
              </div>
              {/* Modal Body */}
              <div className="p-5 max-h-[70vh] overflow-y-auto">
                <PatchNoteList
                  language={language}
                  patchNotes={SAMPLE_PATCH_NOTES}
                  playSfx={playSfx}
                  setView={setView}
                />
              </div>
            </motion.div>
            {/* Backdrop */}
            <div
              className="absolute inset-0 z-[-1]"
              onClick={() => setActiveModal('none')}
            />
          </div>
        )}
      </Suspense>

      {/* ── Help popup ── */}
      <AnimatePresence>
        {helpOpen && (
          <div className="fixed inset-0 z-[209] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-[#fdfcfc] rounded-none border border-[#201d1d] w-full max-w-sm overflow-hidden text-[#201d1d]"
            >
              <div className="flex items-center justify-between p-4 border-b border-[rgba(15,0,0,0.12)]">
                <div className="flex items-center gap-2">
                  <HelpCircle size={18} className="text-[#201d1d]" />
                  <h3 className="text-sm font-black text-[#201d1d]">{helpTitle}</h3>
                </div>
                <button
                  onClick={() => setHelpOpen(false)}
                  className="min-w-[44px] min-h-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] flex items-center justify-center hover:bg-[#f8f7f7] transition-colors cursor-pointer"
                  type="button"
                  aria-label="Close"
                ><X size={14} className="text-stone-700" /></button>
              </div>
              <div className="p-5 min-h-[100px]">
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{helpDesc}</p>
              </div>
              <div className="flex items-center justify-between px-4 pb-4">
                <button
                  onClick={() => setHelpStep((s) => Math.max(0, s - 1))}
                  disabled={helpStep === 0}
                  className="min-w-[44px] min-h-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] flex items-center justify-center disabled:opacity-30 hover:bg-[#f8f7f7] transition-colors"
                  type="button"
                >
                  <ChevronLeft size={16} className="text-stone-700" />
                </button>
                <span className="text-[10px] font-bold text-stone-500">
                  {helpStep + 1} / {HELP_SLIDES.length}
                </span>
                <button
                  onClick={() => setHelpStep((s) => Math.min(HELP_SLIDES.length - 1, s + 1))}
                  disabled={helpStep === HELP_SLIDES.length - 1}
                  className="min-w-[44px] min-h-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] flex items-center justify-center disabled:opacity-30 hover:bg-[#f8f7f7] transition-colors"
                  type="button"
                >
                  <ChevronRight size={16} className="text-stone-700" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Alert Modal */}
      <AnimatePresence>
        {customAlert.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 font-mono"
          >
            <div
              className="absolute inset-0"
              onClick={() => setCustomAlert(prev => ({ ...prev, isOpen: false }))}
            />
            <motion.div
              initial={{ scale: 0.98, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-[#fdfcfc] text-[#201d1d] w-full max-w-sm rounded-none overflow-hidden border border-[#201d1d] relative z-[10000]"
            >
              <div className="p-4 bg-[#201d1d] text-[#fdfcfc] border-b border-[#201d1d] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-amber-400 fill-amber-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wide">{customAlert.title}</h2>
                </div>
                <button
                  onClick={() => setCustomAlert(prev => ({ ...prev, isOpen: false }))}
                  className="min-w-[44px] min-h-[44px] rounded-sm text-stone-300 hover:text-white flex items-center justify-center cursor-pointer"
                  aria-label="Close"
                ><X size={20} /></button>
              </div>
              <div className="p-6">
                <p className="text-xs font-bold text-stone-700 leading-relaxed whitespace-pre-line">{customAlert.message}</p>
              </div>
              <div className="px-6 pb-6">
                <button
                  onClick={() => setCustomAlert(prev => ({ ...prev, isOpen: false }))}
                  className="w-full min-h-[44px] py-3 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] font-bold uppercase text-xs tracking-wider rounded-sm active:scale-98 transition-all cursor-pointer"
                >
                  {language === 'ko' ? '확인' : 'OK'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
