import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Sparkles, Zap, Gift, Star, ChevronRight, X, TreePine, Dice5, Gamepad2, Lock, AlertCircle, Camera, BookOpen, Swords, Share2, Check, CheckCircle2, Flame, Hash, FileText, HelpCircle, ChevronLeft } from 'lucide-react';
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

type EventModal = 'none' | 'tree' | 'roulette' | 'claw' | 'ar-view-select' | 'ar-viewer' | 'patchnote';

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
  }, [activeModal]);

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
  }

  const quickLinks: QuickLink[] = [
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
    <div className="flex-1 flex flex-col w-full bg-slate-50/50 text-slate-800 font-sans overflow-y-auto pb-32">
      <div className="max-w-4xl mx-auto w-full px-4">
        <PageHeader
          title={t('event', language)}
          rightAction={
            <button
              onClick={() => { setHelpOpen(true); setHelpStep(0); }}
              className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
              aria-label="Help"
              type="button"
            >
              <HelpCircle size={14} className="text-slate-500" />
            </button>
          }
        />

        {/* SNS Balance (minimal) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-white to-purple-50 p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900">
              <Zap size={16} className="text-amber-500" />
              <span className="text-2xl font-black tracking-tight">{sns.toLocaleString()} SNS</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setView?.('season-hub');
                }}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 transition hover:bg-emerald-100 touch-target"
              >
                {t('sns_spend_go_season_hub', language)}
              </button>
              <button
                type="button"
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setView?.('community');
                }}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 transition hover:bg-indigo-100 touch-target"
              >
                {t('sns_spend_go_event', language)}
              </button>
            </div>
          </div>
        </motion.div>

        <main className="flex-1 p-4 md:p-8 w-full">
          {/* ── Quick-link list ── */}
          <div className="space-y-2 mb-6">
            {quickLinks.map((link, idx) => {
              const IconComp = link.icon;
              return (
                <motion.button
                  key={link.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    link.onClick();
                  }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm active:scale-[0.99] transition-all touch-target"
                >
                  <div className={`w-9 h-9 rounded-lg ${link.colorClass} flex items-center justify-center shrink-0`}>
                    <IconComp size={16} className="text-white" />
                  </div>
                  <span className="flex-1 text-left text-sm font-bold text-slate-800">
                    {link.label}
                  </span>
                  {link.rightExtra && (
                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                      {link.rightExtra}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-slate-300 shrink-0" />
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
          <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/90 px-6 py-5 text-white shadow-2xl">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{t('loading', language)}</span>
            </div>
          </div>
        }
      >
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
          <div className="fixed inset-0 z-[9997] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 relative font-sans my-8"
            >
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-b border-blue-700 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-200" />
                  <h2 className="text-sm font-bold uppercase tracking-wide">
                    {t('patchnote_title', language)}
                  </h2>
                </div>
                <button
                  onClick={() => setActiveModal('none')}
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
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
          <div className="fixed inset-0 z-[209] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
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
                  <ChevronLeft size={16} className="text-slate-600" />
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
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          >
            <div
              className="absolute inset-0"
              onClick={() => setCustomAlert(prev => ({ ...prev, isOpen: false }))}
            />
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white text-slate-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100 relative z-[10000] font-sans"
            >
              <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-950 text-white border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-yellow-450 fill-yellow-450" />
                  <h2 className="text-sm font-bold uppercase tracking-wide">{customAlert.title}</h2>
                </div>
                <button
                  onClick={() => setCustomAlert(prev => ({ ...prev, isOpen: false }))}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-xs font-bold text-slate-500 leading-relaxed whitespace-pre-line">{customAlert.message}</p>
              </div>
              <div className="px-6 pb-6">
                <button
                  onClick={() => setCustomAlert(prev => ({ ...prev, isOpen: false }))}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase text-xs tracking-wider rounded-2xl active:scale-98 transition-all shadow-md cursor-pointer"
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
