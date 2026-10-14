import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface HeroCard {
  id: string;
  code: string;
  name: string;
  pwr: number;
  heroClass: string;
  rarity: string;
  synergy: string;
  rentalDurationHours: number;
}

export interface EncounterState {
  stage: 'IDLE' | 'BANNER_SLIDEUP' | 'MODAL_CLAIMED' | 'DISMISSED';
  card: HeroCard;
  dailyCount: number;
  maxDaily: number;
}

export interface WildCardEncounterWidgetProps {
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  currentSubreddit?: string;
  articleId?: string;
  onNavigateToCombat?: (url: string) => void;
  language?: string;
}

const DEFAULT_TRIAL_CARD: HeroCard = {
  id: 'card-sh-204',
  code: 'SH-204',
  name: 'VALKYRIE-EX',
  pwr: 9420,
  heroClass: 'ASSAULT VANGUARD',
  rarity: 'SSR',
  synergy: 'PLASMA BURST // HYPERSONIC DRIVE',
  rentalDurationHours: 24,
};

const MAX_DAILY_ENCOUNTERS = 3;

// Pure inline SVG icons strictly adhering to strokeWidth="1.75" and Zero-Emoji rule
const RadarPulseIcon = ({ className = 'w-5 h-5 text-cyan-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 1 0 10 10" />
    <path d="M12 6a6 6 0 1 0 6 6" />
    <path d="M12 10a2 2 0 1 0 2 2" />
    <line x1="12" y1="12" x2="22" y2="2" />
  </svg>
);

const TacticalCrosshairIcon = ({ className = 'w-5 h-5 text-cyan-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="22" y1="12" x2="18" y2="12" />
    <line x1="6" y1="12" x2="2" y2="12" />
    <line x1="12" y1="6" x2="12" y2="2" />
    <line x1="12" y1="22" x2="12" y2="18" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const CryptoChipsetIcon = ({ className = 'w-5 h-5 text-amber-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

const VectorArrowIcon = ({ className = 'w-5 h-5 text-cyan-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const CloseIcon = ({ className = 'w-4 h-4 text-slate-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckBadgeIcon = ({ className = 'w-5 h-5 text-emerald-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

// Safe gtag dispatcher
const triggerGtagEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined') {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag === 'function') {
      try {
        gtag('event', eventName, params);
      } catch {
        // fail-safe
      }
    }
  }
};

interface WidgetTranslations {
  encounterDetected: string;
  encounterDesc: string;
  pwrLabel: string;
  classLabel: string;
  requisitionBtn: string;
  claimedHeader: string;
  claimedTitle: string;
  claimedDesc: string;
  accessTime: string;
  authCode: string;
  deployBtn: string;
  dismissText: string;
  dailyDropQuota: string;
}

const TRANSLATIONS: Record<string, WidgetTranslations> = {
  ko: {
    encounterDetected: '전술 히어로 파편 탐지',
    encounterDesc: '뉴스 기사 데이터 스트림에서 공명하는 미확인 SSR 히어로 파편이 포착되었습니다.',
    pwrLabel: '전투력',
    classLabel: '돌격 선봉',
    requisitionBtn: '24시간 대여 카드 징집하기',
    claimedHeader: '전술 징집 승인 // 카드 획득',
    claimedTitle: 'SH-204 발키리-EX (24시간 임시 배치)',
    claimedDesc: '임시 24시간 전술 인가가 부여되었습니다. 9,420 PWR 화력을 즉시 모의 전투에서 시험할 수 있습니다.',
    accessTime: '24시간 유효',
    authCode: '인가 코드: AUTH-TK-204-EX',
    deployBtn: '테스트 덱 모의 전투 출격',
    dismissText: '탐지 무시',
    dailyDropQuota: '일일 전술 드랍 잔여: ',
  },
  en: {
    encounterDetected: 'TACTICAL HERO FRAGMENT DETECTED',
    encounterDesc: 'An unidentified SSR tactical fragment was intercepted within the live article data stream.',
    pwrLabel: 'COMBAT PWR',
    classLabel: 'ASSAULT VANGUARD',
    requisitionBtn: 'REQUISITION 24H TRIAL CARD',
    claimedHeader: 'REQUISITION AUTHORIZED // CARD ACQUIRED',
    claimedTitle: 'SH-204 VALKYRIE-EX (24H TEMPORARY ACCESS)',
    claimedDesc: '24-hour tactical clearance granted. Test 9,420 PWR firepower immediately in quick combat simulations.',
    accessTime: '24:00:00 REMAINING',
    authCode: 'AUTH CODE: AUTH-TK-204-EX',
    deployBtn: 'DEPLOY TO QUICK TEST COMBAT',
    dismissText: 'Dismiss',
    dailyDropQuota: 'DAILY DROP QUOTA: ',
  },
};

const getWidgetText = (lang?: string): WidgetTranslations => {
  if (lang && lang.startsWith('en')) return TRANSLATIONS.en;
  return TRANSLATIONS.ko;
};

export const WildCardEncounterWidget: React.FC<WildCardEncounterWidgetProps> = ({
  scrollContainerRef,
  currentSubreddit,
  articleId,
  onNavigateToCombat,
  language = 'ko',
}) => {
  const [stage, setStage] = useState<EncounterState['stage']>('IDLE');
  const [dailyCount, setDailyCount] = useState<number>(0);
  const hasTriggeredRef = useRef<boolean>(false);
  const txt = getWidgetText(language);

  // Initialize daily count from sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = sessionStorage.getItem('snshero_encounter_daily_count');
      const count = stored ? parseInt(stored, 10) || 0 : 0;
      setDailyCount(count);
    } catch {
      setDailyCount(0);
    }
  }, []);

  const triggerEncounter = useCallback(() => {
    if (hasTriggeredRef.current) return;
    if (typeof window === 'undefined') return;

    try {
      const stored = sessionStorage.getItem('snshero_encounter_daily_count');
      const count = stored ? parseInt(stored, 10) || 0 : 0;
      if (count >= MAX_DAILY_ENCOUNTERS) return;

      hasTriggeredRef.current = true;
      setStage('BANNER_SLIDEUP');
      triggerGtagEvent('encounter_banner_trigger', {
        subreddit: currentSubreddit || 'news',
        articleId: articleId || 'unknown',
        dailyCount: count,
      });
    } catch {
      // safe failover
    }
  }, [currentSubreddit, articleId]);

  // Trigger 1: 5-second dwell time on page
  useEffect(() => {
    if (dailyCount >= MAX_DAILY_ENCOUNTERS) return;
    if (hasTriggeredRef.current) return;

    const timer = setTimeout(() => {
      triggerEncounter();
    }, 5000);

    return () => clearTimeout(timer);
  }, [dailyCount, triggerEncounter]);

  // Trigger 2: 50% scroll depth detection
  useEffect(() => {
    if (dailyCount >= MAX_DAILY_ENCOUNTERS) return;
    if (hasTriggeredRef.current) return;

    const handleScroll = () => {
      if (hasTriggeredRef.current) return;

      let scrollProgress = 0;
      if (scrollContainerRef && scrollContainerRef.current) {
        const el = scrollContainerRef.current;
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll > 0) {
          scrollProgress = el.scrollTop / maxScroll;
        }
      } else if (typeof window !== 'undefined') {
        const docEl = document.documentElement;
        const maxScroll = docEl.scrollHeight - window.innerHeight;
        if (maxScroll > 0) {
          scrollProgress = window.scrollY / maxScroll;
        }
      }

      if (scrollProgress >= 0.5) {
        triggerEncounter();
      }
    };

    const container = scrollContainerRef?.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    } else if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      } else if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, [dailyCount, scrollContainerRef, triggerEncounter]);

  // Action: Requisition 24H Trial Card
  const handleRequisition = () => {
    if (typeof window !== 'undefined') {
      try {
        const newCount = dailyCount + 1;
        sessionStorage.setItem('snshero_encounter_daily_count', String(newCount));
        setDailyCount(newCount);

        // Store 24H trial card in localStorage for combat verification
        const trialExpiry = Date.now() + 24 * 60 * 60 * 1000;
        localStorage.setItem('hero_active_trial_card', JSON.stringify({
          code: DEFAULT_TRIAL_CARD.code,
          name: DEFAULT_TRIAL_CARD.name,
          pwr: DEFAULT_TRIAL_CARD.pwr,
          heroClass: DEFAULT_TRIAL_CARD.heroClass,
          expireAt: trialExpiry,
        }));
        localStorage.setItem(`hero_trial_${DEFAULT_TRIAL_CARD.code.toLowerCase()}_access_until`, trialExpiry.toString());
      } catch {
        // safe storage failover
      }
    }

    triggerGtagEvent('encounter_requisition_card', {
      card_code: DEFAULT_TRIAL_CARD.code,
      unit_pwr: DEFAULT_TRIAL_CARD.pwr,
    });

    setStage('MODAL_CLAIMED');
  };

  // Action: Deploy to Combat Simulation (/play?trial=SH-204)
  const handleDeployToCombat = () => {
    const targetUrl = `/play?trial=${DEFAULT_TRIAL_CARD.code}`;

    triggerGtagEvent('encounter_deploy_combat', {
      card_code: DEFAULT_TRIAL_CARD.code,
      target_url: targetUrl,
    });

    if (onNavigateToCombat) {
      onNavigateToCombat(targetUrl);
    } else if (typeof window !== 'undefined') {
      window.location.href = targetUrl;
    }
  };

  const handleDismiss = () => {
    setStage('DISMISSED');
    triggerGtagEvent('encounter_dismissed', {
      card_code: DEFAULT_TRIAL_CARD.code,
    });
  };

  if (stage === 'IDLE' || stage === 'DISMISSED') {
    return null;
  }

  const quotaRemaining = Math.max(0, MAX_DAILY_ENCOUNTERS - dailyCount);

  return (
    <>
      {/* 1. SLIDE-UP FLOATING ENCOUNTER BANNER */}
      {stage === 'BANNER_SLIDEUP' && (
        <aside
          role="complementary"
          aria-label={txt.encounterDetected}
          className="fixed bottom-3 left-3 right-3 sm:bottom-5 sm:right-5 sm:left-auto sm:max-w-md z-50 animate-fade-in select-none"
        >
          <div className="bg-[#090d16]/95 border border-white/10 rounded-lg p-4 font-mono text-xs shadow-2xl backdrop-blur-md text-white space-y-3 relative overflow-hidden">
            {/* Top Tactical Signal Indicator & Close Button */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <RadarPulseIcon className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="font-mono tracking-wider uppercase text-[11px] font-bold text-cyan-400">
                  {txt.encounterDetected}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-mono">
                  {txt.dailyDropQuota}{quotaRemaining}/{MAX_DAILY_ENCOUNTERS}
                </span>
                <button
                  onClick={handleDismiss}
                  className="text-slate-400 hover:text-white transition-colors p-1 rounded-sm border border-transparent hover:border-white/15"
                  aria-label={txt.dismissText}
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Signal Description */}
            <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
              {txt.encounterDesc}
            </p>

            {/* Intercepted Fragment Profile */}
            <div className="p-2.5 bg-black/50 border border-cyan-500/30 rounded-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CryptoChipsetIcon className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <div className="font-mono tracking-wider font-bold text-white text-xs">
                    {DEFAULT_TRIAL_CARD.code} // {DEFAULT_TRIAL_CARD.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {DEFAULT_TRIAL_CARD.rarity} // {txt.classLabel}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[9px] uppercase text-slate-400 font-mono">{txt.pwrLabel}</div>
                <div className="font-mono tracking-wider text-amber-400 font-bold text-sm">
                  {DEFAULT_TRIAL_CARD.pwr.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Requisition Action CTA Button (min-h-[44px] as required) */}
            <button
              onClick={handleRequisition}
              className="w-full min-h-[44px] px-4 py-2.5 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 font-bold font-mono tracking-wider uppercase text-xs rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-950/40"
            >
              <TacticalCrosshairIcon className="w-4 h-4 text-cyan-400" />
              <span>{txt.requisitionBtn}</span>
            </button>
          </div>
        </aside>
      )}

      {/* 2. REQUISITION CONFIRMATION & DEPLOYMENT MODAL */}
      {stage === 'MODAL_CLAIMED' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="trial-claim-title"
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 min-h-[100dvh] max-h-[100dvh] overflow-y-auto bg-black/80 backdrop-blur-md select-none animate-fade-in"
        >
          <div className="relative w-full max-w-md bg-[#090d16]/95 border border-cyan-500/40 rounded-lg p-5 sm:p-6 text-white font-mono shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CheckBadgeIcon className="w-5 h-5 text-emerald-400" />
                <span className="font-mono tracking-wider uppercase text-xs text-emerald-400 font-bold">
                  {txt.claimedHeader}
                </span>
              </div>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-sm border border-transparent hover:border-white/15"
                aria-label={txt.dismissText}
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Tactical Card Visual Showcase */}
            <div className="border border-cyan-500/40 bg-gradient-to-b from-cyan-950/30 via-slate-900/60 to-black/80 p-4 rounded-sm space-y-3 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-1.5 py-0.5 bg-cyan-500/20 border border-cyan-500/40 font-mono tracking-wider uppercase text-[10px] text-cyan-300 font-bold mb-1">
                    {DEFAULT_TRIAL_CARD.rarity} // {DEFAULT_TRIAL_CARD.heroClass}
                  </span>
                  <h3 id="trial-claim-title" className="text-base sm:text-lg font-mono font-bold text-white tracking-wide">
                    {DEFAULT_TRIAL_CARD.code} // {DEFAULT_TRIAL_CARD.name}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="font-mono uppercase text-[10px] text-slate-400">{txt.pwrLabel}</div>
                  <div className="font-mono tracking-wider text-xl font-bold text-amber-400">
                    {DEFAULT_TRIAL_CARD.pwr.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Specs & Clearance */}
              <div className="p-2.5 bg-black/60 border border-white/10 text-xs text-slate-300 flex items-center justify-between">
                <span className="text-emerald-400 font-semibold">{txt.accessTime}</span>
                <span className="text-slate-400 text-[10px]">{txt.authCode}</span>
              </div>

              <div className="text-[11px] text-slate-300 leading-relaxed font-mono">
                {txt.claimedDesc}
              </div>
            </div>

            {/* Deploy Action CTA Button (min-h-[44px]) */}
            <button
              onClick={handleDeployToCombat}
              className="w-full min-h-[44px] px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:from-cyan-700 active:to-blue-700 text-white font-mono tracking-wider uppercase text-xs font-bold rounded-sm shadow-xl shadow-cyan-950/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <VectorArrowIcon className="w-4 h-4 text-white" />
              <span>{txt.deployBtn}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default WildCardEncounterWidget;
