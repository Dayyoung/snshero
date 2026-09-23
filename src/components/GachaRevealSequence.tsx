import React, { useEffect, useMemo, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Gift, Info, Package2, Share2, SkipForward, Sparkles, Star, Trophy, X, Zap, Layers, Check } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardItem } from './CardItem';
import { PityGauge } from './PityGauge';
import { GACHA_PACK_CONFIG, formatProbabilityRate, type GachaPackRarity } from '../content/gachaRates';
import { t } from '../lib/i18n';
import { cn, getFormattedCardName } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import { isSfxMutedGlobal } from '../lib/sound';
import { triggerRainbowFlipFX } from '../lib/rainbowFlipFX';
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
  ownedCards?: Array<{ id?: string; imageIndex?: number }>;
  onEquipCardToDeck?: (cardId: number) => void;
  onSkip: () => void;
  onClose: () => void;
  onDrawAgain: () => void;
  onOpenProbability: () => void;
  onShareBestCard: (cardId: number) => void;
  onGoToDeck?: () => void;
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

// 빛나는 파티클 및 광선 배경 애니메이션 컴포넌트
const GachaAuraRays: React.FC<{ highestRarity: string; lowSpecMode: boolean }> = ({ highestRarity, lowSpecMode }) => {
  if (lowSpecMode) return null;

  const color = getRarityGlowColor(highestRarity);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {/* 회전하는 빛 광선 */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-20"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, ${color} 0deg, transparent 30deg, ${color} 60deg, transparent 90deg, ${color} 120deg, transparent 150deg, ${color} 180deg, transparent 210deg, ${color} 240deg, transparent 270deg, ${color} 300deg, transparent 330deg, ${color} 360deg)`,
        }}
      />
      {/* 중앙 서클 광채 */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full blur-[100px] opacity-40 animate-pulse"
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
  ownedCards = [],
  onEquipCardToDeck,
  onSkip,
  onClose,
  onDrawAgain,
  onOpenProbability,
  onShareBestCard,
  onGoToDeck,
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

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPrefersReducedMotion(media.matches);
    sync();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', sync);
      return () => media.removeEventListener('change', sync);
    }

    media.addListener(sync);
    return () => media.removeListener(sync);
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
  const hasUnrevealed = revealedIds.size < cards.length || cards.some((c) => !c.isRevealed);

  // 카드 목록 변경(다시 뽑기 포함) 시 리빌 상태 초기화 및 시퀀스 재시작
  useEffect(() => {
    if (prevSignatureRef.current === cardsSignature) return;
    prevSignatureRef.current = cardsSignature;

    const cardsHaveUnrevealed = cards.some((c) => !c.isRevealed);

    if (instantMode) {
      const allSet = new Set<number>();
      cards.forEach((_, idx) => allSet.add(idx));
      setRevealedIds(allSet);
      setPhase(cardsHaveUnrevealed ? 'spread' : 'summary');
      return;
    }

    if (cardsHaveUnrevealed) {
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

  // 0ms 레이턴시 원터치 '전체 즉시 스킵(Fast Skip)' 핸들러
  const handleFastSkip = () => {
    onSkip();
    const allSet = new Set<number>();
    cards.forEach((_, idx) => allSet.add(idx));
    setRevealedIds(allSet);
    setCutInInfo(null);
    setPhase('summary');
    triggerHaptic('light');
  };

  // 팩 스와이프/탭 개봉 인터랙션 + 등급별(SR 보라, SSR 무지개) 빛 예고 + 햅틱
  const handleOpenPack = () => {
    const isInstantOpenPref = typeof window !== 'undefined' && localStorage.getItem('hero_instant_pack_open') === 'true';

    // 등급별 햅틱 진동 및 빛 번쩍임 예고
    const rRank = EXTENDED_RARITY_RANK[highestRarity.toLowerCase()] ?? 0;
    if (rRank >= EXTENDED_RARITY_RANK['diamond']) {
      triggerHaptic('victory'); // SSR 무지개 등급
    } else if (rRank >= EXTENDED_RARITY_RANK['gold']) {
      triggerHaptic('heavy'); // SR 보라/골드 등급
    } else {
      triggerHaptic('light');
    }

    if (instantMode || isInstantOpenPref) {
      handleFastSkip();
      return;
    }

    // 팩 찢어지는 연출 진입
    setPhase('tearing');

    // 팩 개봉 후 카드가 덮인 spread 단계로 진입하여 1장씩 스와이프/탭 오픈(Flip to Reveal) 손맛 제공
    window.setTimeout(() => {
      setPhase('spread');
    }, 700);
  };

  // 다시 뽑기 핸들러 (특수 소환 마법진 & 버스트 연출)
  const handleDrawAgainClick = () => {
    if (isReSummoning) return;
    setIsReSummoning(true);
    setReDrawCount((prev) => prev + 1);

    // 미공개 카드가 남아있는 상태에서 다시 뽑기를 누를 경우에도 확실하게 공개 동기화
    if (revealedIds.size < cards.length || cards.some((c) => !c.isRevealed)) {
      onSkip();
      const allSet = new Set<number>();
      cards.forEach((_, idx) => allSet.add(idx));
      setRevealedIds(allSet);
    }

    if (!isSfxMutedGlobal()) {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3');
        audio.volume = 0.6;
        audio.play().catch(() => {});
      } catch {}
    }

    window.setTimeout(() => {
      onDrawAgain();
      setIsReSummoning(false);
    }, instantMode ? 300 : 800);
  };

  // 개별 카드 뒤집기 (Flip to Reveal + 햅틱)
  const handleFlipCardIndex = (index: number) => {
    if (revealedIds.has(index)) return;

    triggerHaptic('light');

    // 🌈 ID Rainbow-Flip: 카드 개별 뒤집기 시 Flip! 텍스트 및 무지개 파티클 연출
    try {
      const el = document.getElementById(`gacha-reveal-card-${index}`);
      triggerRainbowFlipFX({
        targetEl: el,
        count: 1,
      });
    } catch (err) {
      console.warn('Rainbow Flip FX error:', err);
    }

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
      }, isGoldCondition ? 1300 : 800);
    }

    // 모든 카드가 뒤집히면 완료 상태(summary)로 자동 전환
    if (newSet.size === cards.length) {
      window.setTimeout(() => {
        onSkip();
        setPhase('summary');
      }, isGoldCondition ? 1000 : 600);
    }
  };

  // 전체 한 번에 공개 (스킵)
  const handleRevealAll = () => {
    const unrevealed = cards.length - revealedIds.size;
    if (unrevealed > 1) {
      triggerRainbowFlipFX({ count: unrevealed });
    }
    handleFastSkip();
  };

  const lastTapRef = useRef<number>(0);
  const handleContainerTap = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't trigger if clicking interactive buttons
    if (target.closest('button') || target.closest('a') || target.closest('input')) return;
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      handleFastSkip();
      triggerHaptic('heavy');
    }
    lastTapRef.current = now;
  };

  return (
    <motion.div
      key="shop-gacha-reveal-sequence"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleContainerTap}
      onDoubleClick={handleFastSkip}
      className="fixed inset-0 z-[500] w-full h-[100dvh] min-h-[100dvh] overflow-y-auto bg-slate-950/98 px-2 py-2.5 sm:px-4 sm:py-4 text-white backdrop-blur-2xl select-none flex flex-col justify-between"
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

      <div className="relative z-10 mx-auto flex flex-1 min-h-0 w-full max-w-6xl flex-col justify-between">
        {/* 헤더 바 */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 pb-2.5 sm:pb-3 border-b border-white/10 shrink-0">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <span className={cn('rounded-full border px-2.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.24em]', rarityBadgeClass(packRarity))}>
              {t(`rarity_${packRarity}` as const, language)} PACK
            </span>
            {/* 컴팩트 천장 진행도 칩 (모바일/PC 공통 상시 노출) */}
            <div className="flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-300">
              <Sparkles size={11} className="text-amber-400 shrink-0" />
              <span>{t('shop_gacha_pity_title', language)} {pityView.current}/{pityView.threshold} ({pityView.remaining} left)</span>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.24em] text-white/60 hidden sm:inline-block">
              {currentSeason}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 0ms 레이턴시 원터치 '전체 즉시 스킵(Fast Skip)' 버튼 */}
            <button
              type="button"
              onClick={handleFastSkip}
              className="flex min-h-9 sm:min-h-10 items-center gap-1 sm:gap-1.5 rounded-full border border-amber-400/80 bg-amber-400/20 px-3 py-1 sm:px-4 sm:py-1.5 text-[9px] sm:text-[11px] font-mono font-black uppercase tracking-wider text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] transition hover:bg-amber-400/30 hover:brightness-125 active:scale-95 cursor-pointer animate-pulse"
              title={language === 'ko' ? '0ms 레이턴시 전체 즉시 스킵' : '0ms Fast Skip All'}
            >
              <Zap size={13} className="text-yellow-300 fill-yellow-300" />
              <span>{language === 'ko' ? '⚡ 전체 즉시 스킵' : '⚡ FAST SKIP'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenProbability}
              className="flex min-h-9 sm:min-h-10 items-center gap-1 sm:gap-1.5 rounded-full border border-sky-300/30 bg-sky-500/10 px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-sky-200 transition hover:bg-sky-500/20 active:scale-95 cursor-pointer"
            >
              <Info size={13} />
              {t('shop_gacha_probability_button', language)}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-9 min-w-9 sm:min-h-10 sm:min-w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/15 hover:text-white cursor-pointer"
              aria-label={t('close', language)}
            >
              <X size={16} />
            </button>
          </div>
        </div>

            {/* 메인 뽑기 컨테이너 */}
        <div className="mt-2 sm:mt-4 grid gap-3 sm:gap-6 flex-1 min-h-0 lg:grid-cols-[minmax(0,1fr)_320px] overflow-y-auto">
          <div className="relative flex-1 min-h-[380px] sm:min-h-[500px] flex flex-col justify-between rounded-2xl sm:rounded-[32px] border border-white/15 bg-slate-900/90 p-2.5 sm:p-7 shadow-2xl backdrop-blur-xl overflow-hidden">
            
            {/* 상단 팩 타이틀 정보 */}
            <div className="flex items-center justify-between gap-2 z-10 shrink-0 pb-1">
              <div>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-yellow-300/90">
                  {t('shop_gacha_reveal_title', language)}
                </span>
                <h3 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                  {t('shop_gacha_reveal_pack_name', language, {
                    pack: t(`rarity_${packRarity}` as const, language),
                  })}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-slate-950/80 px-2.5 sm:px-4 py-1 sm:py-2 text-right">
                  <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
                    {t('shop_gacha_cost_label', language)}
                  </div>
                  <div className="text-xs sm:text-base font-black text-amber-300">{packCost.toLocaleString()} SNS</div>
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
                  className="my-auto flex flex-col items-center justify-center py-6 sm:py-8 z-10"
                >
                  {/* 다시 뽑기 시 표시되는 특별 소환 배지 */}
                  {reDrawCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-300/60 bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-amber-500/30 text-amber-200 text-xs font-mono font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                    >
                      <Sparkles size={14} className="text-yellow-300 animate-spin" />
                      <span>[ RE-DRAW SUMMON #{reDrawCount + 1} ]</span>
                      <Zap size={14} className="text-yellow-300 animate-pulse" />
                    </motion.div>
                  )}

                  {/* 3D 팩 패키지 카드 - 탭 또는 상하 스와이프로 개봉 */}
                  <motion.div
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    animate={instantMode ? undefined : { y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.4}
                    onDragEnd={(_, info) => {
                      if (Math.abs(info.offset.y) > 35 || Math.abs(info.velocity.y) > 80) {
                        handleOpenPack();
                      }
                    }}
                    onClick={handleOpenPack}
                    className="relative cursor-pointer group select-none touch-pan-y"
                  >
                    {/* 팩 후광 스파클 링 */}
                    <div
                      className={cn(
                        "absolute -inset-4 rounded-[40px] blur-2xl opacity-75 group-hover:opacity-100 transition-opacity",
                        (EXTENDED_RARITY_RANK[highestRarity.toLowerCase()] ?? 0) >= EXTENDED_RARITY_RANK['diamond']
                          ? "bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 animate-pulse shadow-[0_0_50px_rgba(236,72,153,0.8)]"
                          : (EXTENDED_RARITY_RANK[highestRarity.toLowerCase()] ?? 0) >= EXTENDED_RARITY_RANK['gold']
                          ? "bg-gradient-to-r from-purple-500 via-amber-400 to-amber-600 animate-pulse shadow-[0_0_40px_rgba(245,158,11,0.8)]"
                          : ""
                      )}
                      style={{ backgroundColor: getRarityGlowColor(highestRarity) }}
                    />

                    {/* 등급별(SR 보라, SSR 무지개) 팩 림 & 빛 번쩍임 예고 연출 */}
                    <div
                      className={cn(
                        "relative flex flex-col items-center justify-between w-48 sm:w-56 h-72 sm:h-80 rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 text-center overflow-hidden transition-all",
                        (EXTENDED_RARITY_RANK[highestRarity.toLowerCase()] ?? 0) >= EXTENDED_RARITY_RANK['diamond']
                          ? "border-4 border-rose-400 ring-4 ring-purple-500 shadow-[0_0_70px_rgba(236,72,153,0.95)] animate-pulse bg-gradient-to-b from-purple-950/80 via-slate-950 to-rose-950/70"
                          : (EXTENDED_RARITY_RANK[highestRarity.toLowerCase()] ?? 0) >= EXTENDED_RARITY_RANK['gold']
                          ? "border-4 border-amber-300 ring-4 ring-yellow-400 shadow-[0_0_60px_rgba(251,191,36,0.95)] animate-pulse bg-gradient-to-b from-purple-950/70 via-slate-950 to-amber-900/60"
                          : "border-2 border-amber-300/40 bg-gradient-to-b from-slate-900 via-slate-950 to-amber-950/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                      )}
                    >
                      {/* SSR 무지개 / SR 보라 등급 예고 엠블럼 */}
                      {(EXTENDED_RARITY_RANK[highestRarity.toLowerCase()] ?? 0) >= EXTENDED_RARITY_RANK['diamond'] ? (
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 text-white text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1 animate-bounce z-20 whitespace-nowrap">
                          <Sparkles size={10} className="animate-spin" />
                          <span>🌈 SSR 무지개빛 대박 예고!</span>
                          <Sparkles size={10} className="animate-spin" />
                        </div>
                      ) : (EXTENDED_RARITY_RANK[highestRarity.toLowerCase()] ?? 0) >= EXTENDED_RARITY_RANK['gold'] ? (
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 via-amber-400 to-yellow-400 text-slate-950 text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1 animate-bounce z-20 whitespace-nowrap">
                          <Sparkles size={10} />
                          <span>💜 SR 보라빛 출현 예고!</span>
                          <Sparkles size={10} />
                        </div>
                      ) : null}

                      {/* 카드팩 리본 / 엠블럼 */}
                      <div className="w-full flex items-center justify-between border-b border-white/15 pb-2.5 sm:pb-3">
                        <Sparkles size={16} className="text-yellow-300 animate-spin" />
                        <span className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] text-amber-200 uppercase">
                          SEALED PACK
                        </span>
                        <Zap size={16} className="text-yellow-300" />
                      </div>

                      <div className="my-auto space-y-2 sm:space-y-3">
                        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                          <Gift size={36} className="text-slate-950 sm:w-11 sm:h-11" />
                        </div>
                        <h4 className="text-lg sm:text-xl font-black text-white tracking-wide">
                          {t(`rarity_${packRarity}` as const, language)} PACK
                        </h4>
                        <p className="text-[11px] sm:text-xs text-amber-200/80 font-bold">5 CARDS INSIDE</p>
                        <p className="text-[9px] text-white/50 font-mono tracking-wider animate-pulse">
                          {language === 'ko' ? '탭 또는 위로 스와이프하여 개봉' : 'Tap or Swipe Up to Open'}
                        </p>
                      </div>

                      {/* 하단 개봉 유도 버튼 */}
                      <button
                        type="button"
                        onClick={handleOpenPack}
                        className="w-full py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer font-mono"
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
                  className="my-auto flex flex-col items-center justify-center py-8 sm:py-12 z-20"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 0.8], rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.9 }}
                    className="relative flex flex-col items-center justify-center"
                  >
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-yellow-300 blur-3xl opacity-90 animate-ping" />
                    <Package2 size={64} className="text-yellow-300 relative z-10 animate-bounce sm:w-20 sm:h-20" />
                    <span className="mt-4 sm:mt-6 text-xl sm:text-2xl font-black text-yellow-300 tracking-widest uppercase animate-pulse">
                      {t('shop_gacha_reveal_opening_now', language)}...
                    </span>
                  </motion.div>
                </motion.div>
              )}

              {/* PHASE 3 & 4: spread & summary (카드 5장 펼쳐짐 및 리빌) */}
              {(phase === 'spread' || phase === 'summary') && (
                <motion.div key="gacha-spread-stage" {...stageMotion} className="flex-1 min-h-0 flex flex-col justify-between z-10 py-1 sm:py-2">
                  {/* Flip to Reveal 안내 바 (spread 단계) */}
                  {phase === 'spread' && (
                    <div className="flex items-center justify-between gap-2 px-3 py-1.5 sm:px-4 sm:py-2 mb-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs sm:text-sm font-mono shrink-0 shadow-md">
                      <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                        <Sparkles size={16} className="text-yellow-300 animate-spin shrink-0" />
                        <span className="truncate font-bold text-[11px] sm:text-xs">
                          {language === 'ko'
                            ? `👆 카드를 탭하여 뒤집으세요! (${revealedIds.size}/${cards.length} 공개)`
                            : `👆 Tap cards to reveal! (${revealedIds.size}/${cards.length})`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleFastSkip}
                        className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-xs sm:text-sm uppercase hover:brightness-110 active:scale-95 cursor-pointer shadow-md whitespace-nowrap shrink-0 min-h-[36px] flex items-center gap-1.5"
                      >
                        <Sparkles size={14} className="shrink-0 text-slate-950" />
                        <span>{language === 'ko' ? '전체 공개' : 'Reveal All'}</span>
                      </button>
                    </div>
                  )}

                  {/* 카드 5장 그리드 (모바일 3장+2장 또는 5열 컴팩트 레이아웃) */}
                  <div className="flex-1 min-h-0 overflow-y-auto py-1 sm:py-2 scrollbar-thin">
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-3 xl:gap-4 items-center justify-center max-w-full">
                    {cards.map((card, index) => {
                      const dbCard = CARD_DATABASE[card.imageIndex];
                      const isRevealed = revealedIds.has(index) || card.isRevealed;
                      const isBest = bestCard && bestCard.imageIndex === card.imageIndex && isRevealed && phase === 'summary';
                      const isCardGoldCondition = (EXTENDED_RARITY_RANK[card.rarity.toLowerCase()] ?? 0) >= EXTENDED_RARITY_RANK['gold'];
                      const isOwnedBefore = ownedCards.some(
                        (oc) => oc.imageIndex === card.imageIndex || (oc.id && String(oc.id) === String(card.imageIndex))
                      );

                      return (
                        <div key={card.id ?? `${card.imageIndex}-${index}`} className="flex flex-col items-center gap-1 sm:gap-2">
                          <motion.div
                            id={`gacha-reveal-card-${index}`}
                            initial={instantMode ? undefined : { y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.08 }}
                            className="relative w-full max-w-[120px] sm:max-w-none aspect-[5/7] group cursor-pointer"
                            onClick={() => handleFlipCardIndex(index)}
                          >
                            {/* BEST PULL 하이라이트 배지 */}
                            {isBest && (
                              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[8px] sm:text-[9px] font-black uppercase tracking-wider shadow-lg animate-bounce whitespace-nowrap">
                                <Trophy size={10} />
                                <span>{t('shop_gacha_best_pull', language)}</span>
                              </div>
                            )}

                            {/* ID 418: 신규 획득(NEW) vs 기존 보유(OWNED) 구별 태그 강조 */}
                            {isRevealed && (
                              <div className="absolute top-1 left-1 z-30">
                                {!isOwnedBefore ? (
                                  <span className="px-1.5 py-0.2 rounded-xs bg-rose-600 text-white text-[8px] font-black uppercase tracking-wider animate-pulse shadow-md border border-rose-400">
                                    NEW!
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded-xs bg-slate-800/90 text-slate-300 text-[8px] font-bold border border-slate-600">
                                    OWNED
                                  </span>
                                )}
                              </div>
                            )}

                            {/* 골드 조건 만족 시 금빛 배지 */}
                            {isRevealed && isCardGoldCondition && !isBest && (
                              <div className="absolute -top-2 right-1 z-30 flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-500 text-amber-950 text-[8px] font-black uppercase tracking-wider shadow-md border border-yellow-200 animate-pulse">
                                <Sparkles size={9} />
                                <span>GOLD+</span>
                              </div>
                            )}

                            {/* ID 348: 중복 획득 시 조각 변환(+10) 및 승급 알림 배지 */}
                            {isRevealed && isOwnedBefore && (
                              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 rounded-full bg-indigo-950/95 border border-indigo-400 text-indigo-200 text-[8px] font-black flex items-center gap-0.5 shadow-lg whitespace-nowrap animate-bounce">
                                <Sparkles size={8} className="text-indigo-400 animate-spin" />
                                <span>+10 {language === 'ko' ? '파편 변환' : 'Shards'}</span>
                              </div>
                            )}

                            {/* 3D Flip Container - 골드 조건 시 금빛 테두리 적용 */}
                            <motion.div
                              animate={{ rotateY: isRevealed ? 180 : 0 }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                              style={{ transformStyle: 'preserve-3d' }}
                              className={cn(
                                'relative w-full h-full rounded-xl sm:rounded-2xl border transition-all duration-300 shadow-xl',
                                isRevealed && isCardGoldCondition
                                  ? 'border-2 sm:border-4 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.9),inset_0_0_10px_rgba(251,191,36,0.3)] ring-1 sm:ring-2 ring-amber-400/80'
                                  : isBest
                                  ? 'border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                                  : isRevealed && card.rarity.toLowerCase() === 'silver'
                                  ? 'border-2 border-slate-300 shadow-[0_0_12px_rgba(203,213,225,0.4)]'
                                  : 'border-white/15 hover:border-white/40',
                              )}
                            >
                              {/* 카드 뒷면 (Sealed) */}
                              <div
                                style={{ backfaceVisibility: 'hidden' }}
                                className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-2 sm:p-3 flex flex-col items-center justify-between text-center overflow-hidden border border-white/10"
                              >
                                <div className="w-full flex justify-between items-center text-[8px] sm:text-[9px] text-white/40 font-mono">
                                  <span>#{index + 1}</span>
                                  <Sparkles size={10} className="text-yellow-400/60" />
                                </div>

                                <div className="my-auto flex flex-col items-center gap-1 sm:gap-2">
                                  <div
                                    className="w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border border-white/20 bg-white/5 shadow-inner"
                                    style={{ boxShadow: `inset 0 0 12px ${getRarityGlowColor(card.rarity)}` }}
                                  >
                                    <Package2 size={16} className="text-amber-200 sm:w-6 sm:h-6" />
                                  </div>
                                  <span className="text-[8px] sm:text-[10px] font-black tracking-wider text-white/70 uppercase">
                                    {t('shop_gacha_card_back_label', language)}
                                  </span>
                                </div>

                                <span className="text-[8px] sm:text-[9px] font-bold text-amber-300/80 animate-pulse">
                                  TAP TO REVEAL
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
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-1.5 sm:p-2.5 pt-4">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className={cn('rounded-full border px-1.5 py-0.2 text-[7px] sm:text-[8px] font-black uppercase tracking-wider', rarityBadgeClass(card.rarity))}>
                                      {card.rarity}
                                    </span>
                                    <span className="text-[8px] sm:text-[10px] font-black text-white truncate max-w-[65%]">
                                      {getFormattedCardName(dbCard, language)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>

                          {/* ID 358: SSR/SR 획득 시 현재 덱에 즉시 교체/장착 원클릭 버튼 */}
                          {isRevealed && isCardGoldCondition && onEquipCardToDeck && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEquipCardToDeck(card.imageIndex);
                              }}
                              className="px-2 py-0.5 rounded-sm bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[8px] font-black uppercase flex items-center gap-1 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                              title={language === 'ko' ? '전투 덱 1번 슬롯에 즉시 장착' : 'Equip card directly to battle deck'}
                            >
                              <Layers size={9} />
                              <span>{language === 'ko' ? '덱 즉시 장착' : 'Equip Deck'}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>

                  {/* 하단 컨트롤 및 요약 바 (모바일에서도 항상 화면 하단에 선명하게 고정) */}
                  <div className="pt-2 sm:pt-3 pb-1 flex items-center justify-between gap-2 border-t border-white/15 sticky bottom-0 bg-slate-950/95 backdrop-blur-md z-30 shrink-0 mt-auto">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial">
                      <button
                        type="button"
                        disabled={isReSummoning}
                        onClick={handleDrawAgainClick}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed touch-target"
                      >
                        <Package2 size={16} className={isReSummoning ? 'animate-spin' : 'shrink-0'} />
                        <span className="whitespace-nowrap">{t('draw_again', language)} ({packCost} SNS)</span>
                      </button>
                      {canShareBestCard && bestCard && (
                        <button
                          type="button"
                          onClick={() => onShareBestCard(bestCard.imageIndex)}
                          className="flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 sm:py-3 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/20 text-fuchsia-200 text-xs font-black uppercase tracking-wider transition hover:bg-fuchsia-500/30 active:scale-95 cursor-pointer shadow-md touch-target"
                        >
                          <Share2 size={15} />
                          <span className="hidden sm:inline">{t('shop_gacha_share_cta', language)}</span>
                        </button>
                      )}
                    </div>

                    {/* 기존 마이덱 버튼을 제거하고, 시원하고 눈에 띄는 대형 [전체 공개] 버튼으로 교체 */}
                    {hasUnrevealed ? (
                      <button
                        type="button"
                        onClick={handleFastSkip}
                        className="flex items-center justify-center gap-1.5 sm:gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 text-slate-950 text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_0_18px_rgba(251,191,36,0.6)] hover:brightness-110 active:scale-95 transition-all cursor-pointer animate-pulse shrink-0 touch-target border border-amber-300 min-h-[44px]"
                        title={language === 'ko' ? '모든 카드를 한 번에 공개합니다' : 'Reveal all cards at once'}
                      >
                        <Sparkles size={16} className="text-slate-950 animate-spin shrink-0" />
                        <span className="whitespace-nowrap">{language === 'ko' ? '⚡ 전체 공개' : '⚡ REVEAL ALL'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border border-slate-700 bg-slate-900/80 text-slate-400 text-xs sm:text-sm font-bold uppercase tracking-wider shrink-0 cursor-default opacity-70 min-h-[44px]"
                      >
                        <Check size={16} className="text-emerald-400 shrink-0" />
                        <span className="whitespace-nowrap">{language === 'ko' ? '✓ 전체 공개됨' : '✓ ALL REVEALED'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-white/30 bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-black uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-md shrink-0 touch-target"
                    >
                      {t('close', language)}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 우측 천장 가이드 및 확률 피드 (데스크톱 전용 — 모바일에서는 카드 결과와 조작 버튼을 가리지 않도록 분리) */}
          <div className="hidden lg:block space-y-4 shrink-0">
            <PityGauge
              packRarity={packRarity}
              language={language}
              variant="dark"
              current={pityView.current}
              remaining={pityView.remaining}
              threshold={pityView.threshold}
              guaranteeRarity={pityView.guaranteeRarity}
              updatedAt={pityView.lastUpdatedAt ? new Date(pityView.lastUpdatedAt).toISOString().slice(0, 10) : packConfig.updatedAt}
              seasonLabel={currentSeason}
              lowSpecMode={lowSpecMode}
            />

            {/* 확률 안내 모듈 */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 text-sm text-white/70 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-amber-300/80">
                {t('shop_gacha_result_odds_label', language)}
              </p>
              <div className="mt-3 space-y-2">
                {packConfig.rates.map((rate) => (
                  <div key={`${packRarity}-${rate.rarity}`} className="flex items-center justify-between rounded-xl border border-white/8 bg-slate-950/60 px-3 py-2 text-xs">
                    <span className={cn('px-2 py-0.5 rounded text-[9px] font-black uppercase', rarityBadgeClass(rate.rarity))}>
                      {t(`rarity_${rate.rarity}` as const, language)}
                    </span>
                    <span className="font-black text-amber-200">{formatProbabilityRate(rate.rate)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
