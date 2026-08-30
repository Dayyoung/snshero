import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Gift, Info, Package2, Share2, SkipForward, Sparkles, Star, Trophy, X, Zap } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardItem } from './CardItem';
import { PityGauge } from './PityGauge';
import { GACHA_PACK_CONFIG, formatProbabilityRate, type GachaPackRarity } from '../content/gachaRates';
import { t } from '../lib/i18n';
import { cn, getFormattedCardName } from '../lib/utils';
import type { Language } from '../types';

export interface GachaRevealCard {
  id?: string;
  imageIndex: number;
  rarity: string;
  isRevealed: boolean;
}

interface GachaRevealSequenceProps {
  language: Language;
  packRarity: GachaPackRarity;
  packCost: number;
  cards: GachaRevealCard[];
  currentSeason: string;
  lowSpecMode?: boolean;
  customCardImage?: string | null;
  processedCardImages?: string[];
  pityView: {
    current: number;
    remaining: number;
    threshold: number;
    guaranteeRarity: 'silver' | 'gold';
    lastUpdatedAt: number;
  };
  autoDrawProgress?: {
    current: number;
    total: number;
  } | null;
  onSkip: () => void;
  onClose: () => void;
  onDrawAgain: () => void;
  onOpenProbability: () => void;
  onShareBestCard: (cardId: number) => void;
}

type RevealPhase = 'intro' | 'sealed-pack' | 'tearing' | 'spread' | 'summary';

const EXTENDED_RARITY_RANK: Record<string, number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
  diamond: 4,
  legendary: 5,
};

const SHAREABLE_RARITIES = new Set(['gold', 'platinum', 'diamond', 'legendary']);

const rarityBadgeClass = (rarity: string): string => {
  const normalized = rarity.toLowerCase();
  if (normalized === 'legendary') {
    return 'bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 text-white border-amber-300/80 shadow-[0_0_15px_rgba(251,191,36,0.6)] font-black animate-pulse';
  }
  if (normalized === 'diamond' || normalized === 'platinum') {
    return 'bg-gradient-to-r from-cyan-400 to-blue-600 text-white border-cyan-300/60 shadow-[0_0_12px_rgba(34,211,238,0.5)]';
  }
  if (normalized === 'gold') {
    return 'bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-600 text-amber-950 border-yellow-200/90 shadow-[0_0_10px_rgba(245,158,11,0.5)] font-black';
  }
  if (normalized === 'silver') {
    return 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900 border-slate-100/70';
  }
  return 'bg-gradient-to-r from-amber-700 to-orange-800 text-white border-amber-400/30';
};

const getRarityGlowColor = (rarity: string): string => {
  const norm = rarity.toLowerCase();
  if (norm === 'legendary') return 'rgba(236,72,153,0.8)';
  if (norm === 'diamond' || norm === 'platinum') return 'rgba(56,189,248,0.7)';
  if (norm === 'gold') return 'rgba(251,191,36,0.8)';
  if (norm === 'silver') return 'rgba(203,213,225,0.5)';
  return 'rgba(217,119,6,0.4)';
};

// 빛나는 파티클 및 광선 배경 애니메이션 컴포넌트 (모바일/데스크톱 뷰포트 전체 커버)
const GachaAuraRays: React.FC<{ highestRarity: string; lowSpecMode: boolean }> = ({ highestRarity, lowSpecMode }) => {
  if (lowSpecMode) return null;

  const color = getRarityGlowColor(highestRarity);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 w-full h-[100dvh]">
      {/* 화면 전체를 덮는 앰비언트 글로우 */}
      <div 
        className="absolute inset-0 opacity-30 mix-blend-screen"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${color} 0%, transparent 75%)`
        }}
      />
      {/* 회전하는 거대 빛 광선 */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[220vmax] h-[220vmax] opacity-25"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, ${color} 0deg, transparent 30deg, ${color} 60deg, transparent 90deg, ${color} 120deg, transparent 150deg, ${color} 180deg, transparent 210deg, ${color} 240deg, transparent 270deg, ${color} 300deg, transparent 330deg, ${color} 360deg)`,
        }}
      />
      {/* 중앙/상단 코어 광채 */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] max-w-[650px] max-h-[650px] rounded-full blur-[110px] opacity-45 animate-pulse"
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

export const GachaRevealSequence: React.FC<GachaRevealSequenceProps> = ({
  language,
  packRarity,
  packCost,
  cards,
  currentSeason,
  lowSpecMode = false,
  customCardImage,
  processedCardImages,
  pityView,
  autoDrawProgress,
  onSkip,
  onClose,
  onDrawAgain,
  onOpenProbability,
  onShareBestCard,
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [phase, setPhase] = useState<RevealPhase>('intro');
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [isReSummoning, setIsReSummoning] = useState<boolean>(false);
  const [reDrawCount, setReDrawCount] = useState<number>(0);
  const [cutInInfo, setCutInInfo] = useState<{
    rarity: string;
    name: string;
    isGoldSpecial: boolean;
    imageIndex: number;
    power?: number;
  } | null>(null);

  const prevSignatureRef = React.useRef<string>('');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPrefersReducedMotion(media.matches);
    sync();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', sync);
      return () => {
        media.removeEventListener('change', sync);
        document.body.style.overflow = originalOverflow;
      };
    }

    media.addListener(sync);
    return () => {
      media.removeListener(sync);
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const instantMode = lowSpecMode || prefersReducedMotion;
  const packConfig = GACHA_PACK_CONFIG[packRarity];
  const allRevealed = cards.length > 0 && (cards.every((card) => card.isRevealed) || revealedIds.size === cards.length);

  // 카드 목록 고유 시그니처 계산
  const cardsSignature = useMemo(() => {
    return cards.map((c) => `${c.id ?? ''}-${c.imageIndex}-${c.rarity}-${c.isRevealed ? 1 : 0}`).join('|');
  }, [cards]);

  // 뽑은 5장 중 최상위 등급 계산
  const highestRarity = useMemo(() => {
    if (!cards.length) return packRarity;
    let highest = 'bronze';
    cards.forEach((c) => {
      const r = c.rarity.toLowerCase();
      if ((EXTENDED_RARITY_RANK[r] ?? 0) > (EXTENDED_RARITY_RANK[highest] ?? 0)) {
        highest = r;
      }
    });
    return highest;
  }, [cards, packRarity]);

  const bestCard = useMemo(() => {
    return [...cards]
      .sort((left, right) => {
        const rarityDiff = (EXTENDED_RARITY_RANK[right.rarity.toLowerCase()] ?? -1) - (EXTENDED_RARITY_RANK[left.rarity.toLowerCase()] ?? -1);
        if (rarityDiff !== 0) {
          return rarityDiff;
        }

        return (CARD_DATABASE[right.imageIndex]?.power ?? 0) - (CARD_DATABASE[left.imageIndex]?.power ?? 0);
      })[0] ?? null;
  }, [cards]);

  const canShareBestCard = Boolean(bestCard && SHAREABLE_RARITIES.has(bestCard.rarity.toLowerCase()));
  const summaryTitle = autoDrawProgress
    ? t('shop_gacha_summary_auto_title', language, { current: autoDrawProgress.current, total: autoDrawProgress.total })
    : t('shop_gacha_summary_title', language);
  const topCardName = bestCard ? getFormattedCardName(CARD_DATABASE[bestCard.imageIndex], language) : null;
  const stageMotion = instantMode ? {} : { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.04 } };

  // 카드 목록 변경(다시 뽑기 포함) 시 리빌 상태 초기화 및 시퀀스 재시작
  useEffect(() => {
    if (prevSignatureRef.current === cardsSignature) return;
    prevSignatureRef.current = cardsSignature;

    const hasUnrevealed = cards.some((c) => !c.isRevealed);

    if (instantMode) {
      const allSet = new Set<number>();
      cards.forEach((_, idx) => allSet.add(idx));
      setRevealedIds(allSet);
      setPhase(hasUnrevealed ? 'spread' : 'summary');
      return;
    }

    if (hasUnrevealed) {
      // 새 팩 소환(다시 뽑기 포함) 시 상태를 초기화하고 팩 봉인 상태로 진입
      setRevealedIds(new Set());
      setCutInInfo(null);
      setPhase('sealed-pack');
    } else {
      const allSet = new Set<number>();
      cards.forEach((_, idx) => allSet.add(idx));
      setRevealedIds(allSet);
      setPhase('summary');
    }
  }, [cards, cardsSignature, instantMode]);

  // Phase 자동 전이 (intro 상태일 경우 sealed-pack으로 전환)
  useEffect(() => {
    if (instantMode) return;

    if (phase === 'intro') {
      const timer = window.setTimeout(() => setPhase('sealed-pack'), 600);
      return () => window.clearTimeout(timer);
    }
  }, [instantMode, phase]);

  // 팩 개봉 클릭/진입 -> 즉시 모든 카드를 공개 상태로 전환
  const handleOpenPack = () => {
    onSkip();
    const allSet = new Set<number>();
    cards.forEach((_, idx) => allSet.add(idx));
    setRevealedIds(allSet);

    if (instantMode) {
      setPhase('summary');
      return;
    }

    setPhase('tearing');

    // 팩 찢어지는 연출 후 바로 전체 공개 화면(summary)으로 전환 (최상위 카드 컷인 연출 포함)
    window.setTimeout(() => {
      if (bestCard) {
        const r = bestCard.rarity.toLowerCase();
        const isGoldCondition = (EXTENDED_RARITY_RANK[r] ?? 0) >= EXTENDED_RARITY_RANK['gold'];
        const dbCard = CARD_DATABASE[bestCard.imageIndex];
        setCutInInfo({
          rarity: bestCard.rarity,
          name: topCardName ?? '',
          isGoldSpecial: isGoldCondition,
          imageIndex: bestCard.imageIndex,
          power: dbCard?.power,
        });
        window.setTimeout(() => {
          setCutInInfo(null);
          setPhase('summary');
        }, isGoldCondition ? 1400 : 900);
      } else {
        setPhase('summary');
      }
    }, 800);
  };

  // 다시 뽑기 핸들러 (특수 소환 마법진 & 버스트 연출)
  const handleDrawAgainClick = () => {
    if (isReSummoning) return;
    setIsReSummoning(true);
    setReDrawCount((prev) => prev + 1);

    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3');
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch {}

    window.setTimeout(() => {
      onDrawAgain();
      setIsReSummoning(false);
    }, instantMode ? 300 : 800);
  };

  // 개별 카드 뒤집기
  const handleFlipCardIndex = (index: number) => {
    if (revealedIds.has(index)) return;

    const card = cards[index];
    const newSet = new Set(revealedIds);
    newSet.add(index);
    setRevealedIds(newSet);

    // 카드 종류에 상관없이 매번 특수 연출 발동!
    // 기존 특수효과 조건(골드 이상)을 만족하면 금빛 테두리로 더 화려한 연출
    const r = card.rarity.toLowerCase();
    const isGoldCondition = (EXTENDED_RARITY_RANK[r] ?? 0) >= EXTENDED_RARITY_RANK['gold'];
    const dbCard = CARD_DATABASE[card.imageIndex];
    const name = getFormattedCardName(dbCard, language);

    if (!instantMode) {
      setCutInInfo({
        rarity: card.rarity,
        name,
        isGoldSpecial: isGoldCondition,
        imageIndex: card.imageIndex,
        power: dbCard?.power,
      });
      window.setTimeout(() => {
        setCutInInfo(null);
      }, isGoldCondition ? 1500 : 1000);
    }

    if (newSet.size === cards.length) {
      window.setTimeout(() => {
        onSkip();
        setPhase('summary');
      }, isGoldCondition ? 1200 : 800);
    }
  };

  // 전체 한 번에 공개
  const handleRevealAll = () => {
    onSkip();
    const allSet = new Set<number>();
    cards.forEach((_, idx) => allSet.add(idx));
    setRevealedIds(allSet);

    // 카드 종류에 상관없이 최상위 카드로 매번 컷인 연출 발동!
    if (bestCard && !instantMode) {
      const r = bestCard.rarity.toLowerCase();
      const isGoldCondition = (EXTENDED_RARITY_RANK[r] ?? 0) >= EXTENDED_RARITY_RANK['gold'];
      const dbCard = CARD_DATABASE[bestCard.imageIndex];
      setCutInInfo({
        rarity: bestCard.rarity,
        name: topCardName ?? '',
        isGoldSpecial: isGoldCondition,
        imageIndex: bestCard.imageIndex,
        power: dbCard?.power,
      });
      window.setTimeout(() => {
        setCutInInfo(null);
        setPhase('summary');
      }, isGoldCondition ? 1600 : 1100);
    } else {
      setPhase('summary');
    }
  };

  return (
    <motion.div
      key="shop-gacha-reveal-sequence"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-950/98 px-2.5 sm:px-4 py-2 sm:py-3 text-white backdrop-blur-2xl select-none flex flex-col justify-between items-center"
    >
      {/* 백그라운드 빛 빔 & 파티클 오라 */}
      <GachaAuraRays highestRarity={highestRarity} lowSpecMode={lowSpecMode} />

      {/* 다시 뽑기 전용 초화려 마법진 소환 특수 연출 (Re-Summoning Ritual Overlay) */}
      <AnimatePresence>
        {isReSummoning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[280] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-2xl pointer-events-auto overflow-hidden p-4"
          >
            {/* 1. 배경 회전 다채색 광선 & 오라 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute w-[600px] h-[600px] rounded-full opacity-40 blur-2xl"
              style={{
                background: `conic-gradient(from 0deg, rgba(251,191,36,0.8), rgba(244,63,94,0.6), rgba(59,130,246,0.7), rgba(168,85,247,0.8), rgba(251,191,36,0.8))`,
              }}
            />

            {/* 2. 외곽 대형 마법진 링 */}
            <motion.div
              animate={{ rotate: 360, scale: [0.95, 1.05, 0.95] }}
              transition={{ rotate: { duration: 12, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
              className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full border-2 border-dashed border-amber-300/60 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.5)]"
            >
              <div className="absolute inset-4 rounded-full border border-yellow-200/40" />
              <div className="absolute inset-8 rounded-full border border-dashed border-amber-400/30" />
            </motion.div>

            {/* 3. 내측 반대방향 회전 소환진 및 룬 문자 교차선 */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-yellow-300/80 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.7)]"
            >
              <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
              <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-amber-300 to-transparent" />
              <div className="absolute w-full h-[1px] rotate-45 bg-gradient-to-r from-transparent via-yellow-200 to-transparent" />
              <div className="absolute w-full h-[1px] -rotate-45 bg-gradient-to-r from-transparent via-yellow-200 to-transparent" />
            </motion.div>

            {/* 4. 폭발하는 동심원 충격파 링 */}
            <motion.div
              initial={{ scale: 0.3, opacity: 1 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
              className="absolute w-48 h-48 rounded-full border-4 border-amber-300 blur-[1px]"
            />
            <motion.div
              initial={{ scale: 0.1, opacity: 0.9 }}
              animate={{ scale: 1.9, opacity: 0 }}
              transition={{ duration: 1.0, delay: 0.3, repeat: Infinity, ease: 'easeOut' }}
              className="absolute w-56 h-56 rounded-full border-2 border-yellow-200 blur-[2px]"
            />

            {/* 5. 중앙 코어 소환 심볼 */}
            <motion.div
              animate={{ scale: [1, 1.25, 1], rotate: [0, 8, -8, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10 flex flex-col items-center justify-center gap-3"
            >
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-200 shadow-[0_0_60px_rgba(250,204,21,1)] text-slate-950">
                <Sparkles size={48} className="animate-spin" />
                <Zap size={28} className="absolute -top-1 -right-1 text-white animate-bounce" />
              </div>

              {/* 안내 텍스트 배너 */}
              <div className="flex flex-col items-center gap-2 mt-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-amber-300/70 bg-amber-400/20 text-amber-200 text-[11px] font-mono font-black tracking-[0.25em] uppercase shadow-[0_0_15px_rgba(245,158,11,0.6)]">
                  <Sparkles size={12} className="animate-spin text-yellow-300" />
                  <span>[ RE-DRAW SUMMONING ]</span>
                  <Sparkles size={12} className="animate-spin text-yellow-300" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-amber-300 to-yellow-500 tracking-wider animate-pulse drop-shadow-[0_2px_20px_rgba(250,204,21,0.8)]">
                  {language === 'ko' ? '다시 뽑기 마력 집중 중...' : 'Re-Summoning In Progress...'}
                </h3>
                <p className="text-xs font-mono text-white/70 tracking-widest uppercase">
                  {language === 'ko' ? '새로운 운명의 카드를 소환합니다' : 'Summoning new destiny cards'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 컷인 (Cut-In) 스플래시 오버레이 - 모든 카드 매번 발동, 골드 조건 시 금빛 테두리로 화려한 연출 */}
      <AnimatePresence>
        {cutInInfo && !instantMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[250] flex flex-col items-center justify-center bg-slate-950/92 backdrop-blur-lg pointer-events-none overflow-hidden p-4"
          >
            {/* 극적인 대각선 광선 슬래시 */}
            <motion.div
              initial={{ x: '-120%' }}
              animate={{ x: '120%' }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className={cn(
                'absolute w-[220%] h-40 rotate-[-15deg]',
                cutInInfo.isGoldSpecial
                  ? 'bg-gradient-to-r from-transparent via-amber-300/50 to-transparent blur-sm'
                  : cutInInfo.rarity.toLowerCase() === 'silver'
                  ? 'bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-amber-500/35 to-transparent'
              )}
            />

            {/* 골드 특수 연출 시 확장하는 금빛 충격파 링 */}
            {cutInInfo.isGoldSpecial && (
              <>
                <motion.div
                  initial={{ scale: 0.5, opacity: 1 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute w-72 h-72 rounded-full border-4 border-amber-300/80 blur-[2px]"
                />
                <motion.div
                  initial={{ scale: 0.2, opacity: 0.9 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 0.9, delay: 0.2, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-amber-400/20 via-yellow-300/30 to-transparent blur-xl"
                />
              </>
            )}

            {/* 메인 컷인 카드 박스 - 골드 조건 시 화려한 금빛 테두리 적용 */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08, type: 'spring', damping: 18 }}
              className={cn(
                'relative z-10 flex flex-col items-center gap-4 text-center max-w-lg w-full rounded-3xl p-6 sm:p-8 backdrop-blur-md transition-all',
                cutInInfo.isGoldSpecial
                  ? 'border-4 border-amber-300 shadow-[0_0_80px_rgba(251,191,36,0.95),inset_0_0_40px_rgba(251,191,36,0.45)] ring-4 ring-amber-400/60 ring-offset-4 ring-offset-slate-950 bg-radial from-amber-500/20 via-slate-950/95 to-black/95'
                  : cutInInfo.rarity.toLowerCase() === 'silver'
                  ? 'border-2 border-slate-200 shadow-[0_0_40px_rgba(203,213,225,0.7)] ring-2 ring-slate-300/40 bg-slate-950/90'
                  : 'border-2 border-amber-600 shadow-[0_0_35px_rgba(217,119,6,0.6)] ring-2 ring-amber-700/40 bg-slate-950/90'
              )}
            >
              {/* 상단 텍스트 및 ASCII 마커 */}
              {cutInInfo.isGoldSpecial ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="text-[10px] font-mono font-black tracking-[0.3em] text-amber-300 animate-pulse">
                    [ ★★★ GOLD SPECIAL JACKPOT ★★★ ]
                  </div>
                  <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border-2 border-amber-200 bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-500 text-amber-950 text-xs font-black uppercase tracking-[0.3em] shadow-[0_0_25px_rgba(250,204,21,0.9)] animate-bounce">
                    <Sparkles size={16} className="animate-spin" />
                    <span>{cutInInfo.rarity.toUpperCase()} SPECIAL PULL!</span>
                    <Sparkles size={16} className="animate-spin" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="text-[9px] font-mono font-semibold tracking-[0.25em] text-white/60">
                    {cutInInfo.rarity.toLowerCase() === 'silver' ? '[ ✦ SILVER CARD REVEAL ✦ ]' : '[ ❖ BRONZE CARD REVEAL ❖ ]'}
                  </div>
                  <div className={cn('inline-flex items-center gap-2 px-5 py-1.5 rounded-full border text-xs font-black uppercase tracking-[0.24em] shadow-md', rarityBadgeClass(cutInInfo.rarity))}>
                    <Trophy size={14} />
                    <span>{cutInInfo.rarity.toUpperCase()} PULL</span>
                  </div>
                </div>
              )}

              {/* 영웅 명칭 */}
              <h2
                className={cn(
                  'text-3xl sm:text-5xl font-black italic tracking-wide max-w-full truncate px-2',
                  cutInInfo.isGoldSpecial
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-amber-300 to-yellow-500 drop-shadow-[0_4px_30px_rgba(245,158,11,0.95)]'
                    : 'text-white drop-shadow-[0_2px_15px_rgba(255,255,255,0.4)]'
                )}
              >
                {cutInInfo.name}
              </h2>

              {/* 파워 등급 / 속성 힌트 */}
              {cutInInfo.power !== undefined && (
                <div className="flex items-center gap-3 text-xs font-mono font-bold text-white/80">
                  <span className="text-amber-300">POWER: {cutInInfo.power}</span>
                  {cutInInfo.isGoldSpecial && (
                    <span className="text-yellow-400 animate-pulse font-black">★ HIGH TIER ★</span>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-between min-h-0">
        {/* 헤더 바 */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10 shrink-0">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <span className={cn('rounded-full border px-2.5 sm:px-3 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]', rarityBadgeClass(packRarity))}>
              {t(`rarity_${packRarity}` as const, language)} PACK
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
              {currentSeason}
            </span>
            <div className="hidden xs:flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-300 text-[9px] font-mono font-bold">
              <Sparkles size={11} className="text-yellow-400" />
              <span>PITY: {pityView.current}/{pityView.threshold} ({pityView.remaining} LEFT)</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onOpenProbability}
              className="flex min-h-8 sm:min-h-9 items-center gap-1 rounded-full border border-sky-300/30 bg-sky-500/10 px-2.5 sm:px-3.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.18em] text-sky-200 transition hover:bg-sky-500/20 active:scale-95 cursor-pointer"
            >
              <Info size={13} />
              <span>{t('shop_gacha_probability_button', language)}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-8 min-w-8 sm:min-h-9 sm:min-w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/15 hover:text-white cursor-pointer"
              aria-label={t('close', language)}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 메인 뽑기 컨테이너 (완전한 화면 중앙 정렬 & 스크롤 방지) */}
        <div className="my-auto flex-1 flex flex-col items-center justify-center w-full min-h-0 py-1 sm:py-2">
          <div className="relative w-full max-h-[calc(100dvh-64px)] flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-white/15 bg-slate-900/95 p-3 sm:p-5 shadow-2xl backdrop-blur-xl overflow-hidden">
            
            {/* 상단 팩 타이틀 정보 */}
            <div className="flex items-center justify-between gap-2 z-10 pb-1 shrink-0">
              <div>
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-yellow-300/90 block">
                  {t('shop_gacha_reveal_title', language)}
                </span>
                <h3 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                  {t('shop_gacha_reveal_pack_name', language, {
                    pack: t(`rarity_${packRarity}` as const, language),
                  })}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-1 text-right">
                  <div className="text-[8px] font-black uppercase tracking-[0.15em] text-white/50">
                    {t('shop_gacha_cost_label', language)}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-amber-300">{packCost.toLocaleString()} SNS</div>
                </div>
              </div>
            </div>

            {/* 스테이지별 메인 뷰 */}
            <AnimatePresence mode="wait">
              {/* PHASE 1: sealed-pack (팩 봉인 해제 대기) */}
              {(phase === 'intro' || phase === 'sealed-pack') && (
                <motion.div
                  key="gacha-sealed-stage"
                  {...stageMotion}
                  className="my-auto flex flex-col items-center justify-center py-4 sm:py-8 z-10 min-h-0"
                >
                  {/* 다시 뽑기 시 표시되는 특별 소환 배지 */}
                  {reDrawCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="mb-2.5 sm:mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-300/60 bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-amber-500/30 text-amber-200 text-[10px] sm:text-xs font-mono font-black uppercase tracking-[0.18em] shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                    >
                      <Sparkles size={12} className="text-yellow-300 animate-spin" />
                      <span>[ RE-DRAW SUMMON #{reDrawCount + 1} ]</span>
                      <Zap size={12} className="text-yellow-300 animate-pulse" />
                    </motion.div>
                  )}

                  {/* 3D 팩 패키지 카드 */}
                  <motion.div
                    whileHover={{ scale: 1.04, rotateY: 4 }}
                    animate={instantMode ? undefined : { y: [0, -6, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    onClick={handleOpenPack}
                    className="relative cursor-pointer group"
                  >
                    {/* 팩 후광 스파클 링 */}
                    <div
                      className="absolute -inset-3 rounded-[36px] blur-xl opacity-75 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: getRarityGlowColor(highestRarity) }}
                    />

                    <div className="relative flex flex-col items-center justify-between w-48 h-68 sm:w-56 sm:h-76 rounded-2xl sm:rounded-3xl border-2 border-amber-300/40 bg-gradient-to-b from-slate-900 via-slate-950 to-amber-950/40 p-4 sm:p-5 shadow-[0_15px_50px_rgba(0,0,0,0.8)] text-center overflow-hidden">
                      {/* 카드팩 리본 / 엠블럼 */}
                      <div className="w-full flex items-center justify-between border-b border-white/15 pb-2">
                        <Sparkles size={15} className="text-yellow-300 animate-spin" />
                        <span className="text-[9px] font-black tracking-[0.2em] text-amber-200 uppercase">
                          SEALED PACK
                        </span>
                        <Zap size={15} className="text-yellow-300" />
                      </div>

                      <div className="my-auto space-y-2">
                        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
                          <Gift size={36} className="text-slate-950 sm:w-11 sm:h-11" />
                        </div>
                        <h4 className="text-lg sm:text-xl font-black text-white tracking-wide">
                          {t(`rarity_${packRarity}` as const, language)} PACK
                        </h4>
                        <p className="text-[10px] sm:text-xs text-amber-200/80 font-bold">5 CARDS INSIDE</p>
                      </div>

                      {/* 하단 개봉 유도 버튼 */}
                      <button
                        type="button"
                        onClick={handleOpenPack}
                        className="w-full py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                      >
                        {t('shop_gacha_tap_pack_to_open', language)}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* PHASE 2: tearing (팩 개봉 폭발 컷씬) */}
              {phase === 'tearing' && (
                <motion.div
                  key="gacha-tearing-stage"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="my-auto flex flex-col items-center justify-center py-8 z-20 min-h-0"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 0.8], rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.9 }}
                    className="relative flex flex-col items-center justify-center"
                  >
                    <div className="w-28 h-28 rounded-full bg-yellow-300 blur-3xl opacity-90 animate-ping" />
                    <Package2 size={70} className="text-yellow-300 relative z-10 animate-bounce" />
                    <span className="mt-4 text-xl sm:text-2xl font-black text-yellow-300 tracking-widest uppercase animate-pulse">
                      {t('shop_gacha_reveal_opening_now', language)}...
                    </span>
                  </motion.div>
                </motion.div>
              )}

              {/* PHASE 3 & 4: spread & summary (카드 5장 펼쳐짐 및 리빌) */}
              {(phase === 'spread' || phase === 'summary') && (
                <motion.div key="gacha-spread-stage" {...stageMotion} className="my-auto space-y-2 sm:space-y-4 z-10 py-1 min-h-0 flex flex-col justify-center">
                  {/* 카드 5장 레이아웃: 모바일 3개 상단 / 2개 하단 중앙 정렬, 데스크톱 5개 1줄 */}
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-4xl mx-auto w-full">
                    {cards.map((card, index) => {
                      const dbCard = CARD_DATABASE[card.imageIndex];
                      const isRevealed = revealedIds.has(index) || card.isRevealed;
                      const isBest = bestCard && bestCard.imageIndex === card.imageIndex && isRevealed && phase === 'summary';
                      const isCardGoldCondition = (EXTENDED_RARITY_RANK[card.rarity.toLowerCase()] ?? 0) >= EXTENDED_RARITY_RANK['gold'];

                      return (
                        <div key={card.id ?? `${card.imageIndex}-${index}`} className="w-[28%] max-w-[100px] sm:w-[17%] sm:max-w-[130px] aspect-[3/4] relative flex flex-col items-center">
                          <motion.div
                            initial={instantMode ? undefined : { y: 15, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.07 }}
                            className="relative w-full h-full group cursor-pointer"
                            onClick={() => handleFlipCardIndex(index)}
                          >
                            {/* BEST PULL 하이라이트 배지 */}
                            {isBest && (
                              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[8px] sm:text-[9px] font-black uppercase tracking-wider shadow-lg animate-bounce whitespace-nowrap">
                                <Trophy size={10} />
                                <span>{t('shop_gacha_best_pull', language)}</span>
                              </div>
                            )}

                            {/* 골드 조건 만족 시 금빛 배지 */}
                            {isRevealed && isCardGoldCondition && !isBest && (
                              <div className="absolute -top-2 right-1 z-30 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-500 text-amber-950 text-[8px] font-black uppercase tracking-wider shadow-md border border-yellow-200 animate-pulse whitespace-nowrap">
                                <Sparkles size={9} />
                                <span>GOLD+</span>
                              </div>
                            )}

                            {/* 3D Flip Container */}
                            <motion.div
                              animate={{ rotateY: isRevealed ? 180 : 0 }}
                              transition={{ duration: 0.45, ease: 'easeOut' }}
                              style={{ transformStyle: 'preserve-3d' }}
                              className={cn(
                                'relative w-full h-full rounded-xl sm:rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden',
                                isRevealed && isCardGoldCondition
                                  ? 'border-2 sm:border-3 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.85)] ring-2 ring-amber-400/80'
                                  : isBest
                                  ? 'border-2 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                                  : isRevealed && card.rarity.toLowerCase() === 'silver'
                                  ? 'border-2 border-slate-300 shadow-[0_0_12px_rgba(203,213,225,0.4)]'
                                  : 'border-white/15 hover:border-white/40',
                              )}
                            >
                              {/* 카드 뒷면 (Sealed) */}
                              <div
                                style={{ backfaceVisibility: 'hidden' }}
                                className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-2 sm:p-2.5 flex flex-col items-center justify-between text-center overflow-hidden border border-white/10"
                              >
                                <div className="w-full flex justify-between items-center text-[8px] text-white/40 font-mono">
                                  <span>#{index + 1}</span>
                                  <Sparkles size={10} className="text-yellow-400/60" />
                                </div>

                                <div className="my-auto flex flex-col items-center gap-1">
                                  <div
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-white/20 bg-white/5 shadow-inner"
                                    style={{ boxShadow: `inset 0 0 12px ${getRarityGlowColor(card.rarity)}` }}
                                  >
                                    <Package2 size={18} className="text-amber-200 sm:w-5 sm:h-5" />
                                  </div>
                                  <span className="text-[8px] sm:text-[9px] font-black tracking-wider text-white/70 uppercase">
                                    {t('shop_gacha_card_back_label', language)}
                                  </span>
                                </div>

                                <span className="text-[8px] font-bold text-amber-300/80 animate-pulse">
                                  TAP
                                </span>
                              </div>

                              {/* 카드 앞면 (Revealed) */}
                              <div
                                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                className="absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950"
                              >
                                <CardItem
                                  card={{
                                    ...dbCard,
                                    id: `gacha-reveal-${index}`,
                                    owner: null,
                                    level: 1,
                                    imageIndex: card.imageIndex,
                                  }}
                                  className="h-full w-full"
                                  customImage={customCardImage}
                                  processedImage={card.imageIndex ? processedCardImages?.[card.imageIndex - 1] : undefined}
                                  lowSpecMode={lowSpecMode}
                                />
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-1 sm:p-1.5 pt-4">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className={cn('rounded-full border px-1.5 py-0.2 text-[7px] font-black uppercase tracking-wider', rarityBadgeClass(card.rarity))}>
                                      {card.rarity}
                                    </span>
                                    <span className="text-[8px] sm:text-[9px] font-black text-white truncate max-w-[65px] sm:max-w-[80px]">
                                      {getFormattedCardName(dbCard, language)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 하단 컨트롤 및 요약 바 */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isReSummoning}
                        onClick={handleDrawAgainClick}
                        className="flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Package2 size={14} className={isReSummoning ? 'animate-spin' : ''} />
                        {t('draw_again', language)} ({packCost} SNS)
                      </button>
                      {canShareBestCard && bestCard && (
                        <button
                          type="button"
                          onClick={() => onShareBestCard(bestCard.imageIndex)}
                          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/20 text-fuchsia-200 text-[11px] sm:text-xs font-black uppercase tracking-wider transition hover:bg-fuchsia-500/30 active:scale-95 cursor-pointer shadow-md"
                        >
                          <Share2 size={13} />
                          {t('shop_gacha_share_cta', language)}
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 sm:px-5 py-2 rounded-full border border-white/20 bg-white/10 text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
                    >
                      {t('close', language)}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
