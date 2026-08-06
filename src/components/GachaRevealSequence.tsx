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
  onSkip,
  onClose,
  onDrawAgain,
  onOpenProbability,
  onShareBestCard,
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [phase, setPhase] = useState<RevealPhase>('intro');
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [cutInInfo, setCutInInfo] = useState<{ rarity: string; name: string } | null>(null);

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

  // 초기 로딩 애니메이션 흐름
  useEffect(() => {
    if (instantMode) {
      setPhase(allRevealed ? 'summary' : 'spread');
      // 저사양에서는 전체 바로 공개
      const allSet = new Set<number>();
      cards.forEach((_, idx) => allSet.add(idx));
      setRevealedIds(allSet);
      return;
    }

    if (allRevealed) {
      setPhase('summary');
      const allSet = new Set<number>();
      cards.forEach((_, idx) => allSet.add(idx));
      setRevealedIds(allSet);
    } else {
      setPhase('intro');
    }
  }, [allRevealed, cards, instantMode]);

  // Phase 자동 전이
  useEffect(() => {
    if (instantMode) return;

    if (phase === 'intro') {
      const timer = window.setTimeout(() => setPhase('sealed-pack'), 600);
      return () => window.clearTimeout(timer);
    }
  }, [instantMode, phase]);

  // 팩 개봉 클릭/진입
  const handleOpenPack = () => {
    if (instantMode) {
      handleRevealAll();
      setPhase('summary');
      return;
    }

    setPhase('tearing');
    // 팩 찢어지는 컷씬 후 스프레드로 전환
    window.setTimeout(() => {
      setPhase('spread');
    }, 1100);
  };

  // 개별 카드 뒤집기
  const handleFlipCardIndex = (index: number) => {
    if (revealedIds.has(index)) return;

    const card = cards[index];
    const newSet = new Set(revealedIds);
    newSet.add(index);
    setRevealedIds(newSet);

    // 고등급 카드일 때 컷인 스플래시 연출!
    const r = card.rarity.toLowerCase();
    if ((EXTENDED_RARITY_RANK[r] ?? 0) >= EXTENDED_RARITY_RANK['gold']) {
      const dbCard = CARD_DATABASE[card.imageIndex];
      const name = getFormattedCardName(dbCard, language);
      setCutInInfo({ rarity: card.rarity, name });
      window.setTimeout(() => {
        setCutInInfo(null);
      }, 1200);
    }

    if (newSet.size === cards.length) {
      window.setTimeout(() => {
        onSkip();
        setPhase('summary');
      }, 900);
    }
  };

  // 전체 한 번에 공개
  const handleRevealAll = () => {
    onSkip();
    const allSet = new Set<number>();
    cards.forEach((_, idx) => allSet.add(idx));
    setRevealedIds(allSet);

    // 최고 등급이 골드 이상이면 컷인 발동
    if (bestCard && (EXTENDED_RARITY_RANK[bestCard.rarity.toLowerCase()] ?? 0) >= EXTENDED_RARITY_RANK['gold'] && !instantMode) {
      setCutInInfo({ rarity: bestCard.rarity, name: topCardName ?? '' });
      window.setTimeout(() => {
        setCutInInfo(null);
        setPhase('summary');
      }, 1200);
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
      className="fixed inset-0 z-[200] overflow-y-auto bg-slate-950/98 px-3 py-4 text-white backdrop-blur-2xl select-none"
    >
      {/* 백그라운드 빛 빔 & 파티클 오라 */}
      <GachaAuraRays highestRarity={highestRarity} lowSpecMode={lowSpecMode} />

      {/* 고등급 컷인 (Cut-In) 스플래시 오버레이 */}
      <AnimatePresence>
        {cutInInfo && !instantMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[250] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md pointer-events-none overflow-hidden"
          >
            {/* 극적인 대각선 빛 줄기 */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute w-[200%] h-32 bg-gradient-to-r from-transparent via-yellow-300/40 to-transparent rotate-[-15deg]"
            />

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative z-10 text-center space-y-3"
            >
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-yellow-300/60 bg-yellow-400/20 text-yellow-300 text-xs font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                <Trophy size={16} />
                <span>{cutInInfo.rarity.toUpperCase()} PULL!</span>
              </div>
              <h2 className="text-4xl sm:text-6xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-amber-300 to-yellow-500 drop-shadow-[0_4px_25px_rgba(245,158,11,0.8)]">
                {cutInInfo.name}
              </h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-6xl flex-col">
        {/* 헤더 바 */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]', rarityBadgeClass(packRarity))}>
              {t(`rarity_${packRarity}` as const, language)} PACK
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/60">
              {currentSeason}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenProbability}
              className="flex min-h-10 items-center gap-1.5 rounded-full border border-sky-300/30 bg-sky-500/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-sky-200 transition hover:bg-sky-500/20 active:scale-95 cursor-pointer"
            >
              <Info size={14} />
              {t('shop_gacha_probability_button', language)}
            </button>
            <button
              type="button"
              onClick={handleRevealAll}
              className="flex min-h-10 items-center gap-1.5 rounded-full border border-yellow-300/40 bg-yellow-400/15 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-yellow-200 transition hover:bg-yellow-400/25 active:scale-95 cursor-pointer"
            >
              <SkipForward size={14} />
              {t('shop_gacha_skip', language)}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-10 min-w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/15 hover:text-white cursor-pointer"
              aria-label={t('close', language)}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 메인 뽑기 컨테이너 */}
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative min-h-[500px] flex flex-col justify-between rounded-[32px] border border-white/15 bg-slate-900/90 p-5 sm:p-7 shadow-2xl backdrop-blur-xl overflow-hidden">
            
            {/* 상단 팩 타이틀 정보 */}
            <div className="flex flex-wrap items-center justify-between gap-3 z-10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-300/90">
                  {t('shop_gacha_reveal_title', language)}
                </span>
                <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {t('shop_gacha_reveal_pack_name', language, {
                    pack: t(`rarity_${packRarity}` as const, language),
                  })}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-right">
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
                    {t('shop_gacha_cost_label', language)}
                  </div>
                  <div className="text-base font-black text-amber-300">{packCost.toLocaleString()} SNS</div>
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
                  className="my-auto flex flex-col items-center justify-center py-8 z-10"
                >
                  {/* 3D 팩 패키지 카드 */}
                  <motion.div
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    animate={instantMode ? undefined : { y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    onClick={handleOpenPack}
                    className="relative cursor-pointer group"
                  >
                    {/* 팩 후광 스파클 링 */}
                    <div
                      className="absolute -inset-4 rounded-[40px] blur-2xl opacity-75 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: getRarityGlowColor(highestRarity) }}
                    />

                    <div className="relative flex flex-col items-center justify-between w-56 h-80 rounded-[32px] border-2 border-amber-300/40 bg-gradient-to-b from-slate-900 via-slate-950 to-amber-950/40 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-center overflow-hidden">
                      {/* 카드팩 리본 / 엠블럼 */}
                      <div className="w-full flex items-center justify-between border-b border-white/15 pb-3">
                        <Sparkles size={18} className="text-yellow-300 animate-spin" />
                        <span className="text-[10px] font-black tracking-[0.25em] text-amber-200 uppercase">
                          SEALED PACK
                        </span>
                        <Zap size={18} className="text-yellow-300" />
                      </div>

                      <div className="my-auto space-y-3">
                        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                          <Gift size={44} className="text-slate-950" />
                        </div>
                        <h4 className="text-xl font-black text-white tracking-wide">
                          {t(`rarity_${packRarity}` as const, language)} PACK
                        </h4>
                        <p className="text-xs text-amber-200/80 font-bold">5 CARDS INSIDE</p>
                      </div>

                      {/* 하단 개봉 유도 버튼 */}
                      <button
                        type="button"
                        onClick={handleOpenPack}
                        className="w-full py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all"
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
                  className="my-auto flex flex-col items-center justify-center py-12 z-20"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 0.8], rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.9 }}
                    className="relative flex flex-col items-center justify-center"
                  >
                    <div className="w-32 h-32 rounded-full bg-yellow-300 blur-3xl opacity-90 animate-ping" />
                    <Package2 size={80} className="text-yellow-300 relative z-10 animate-bounce" />
                    <span className="mt-6 text-2xl font-black text-yellow-300 tracking-widest uppercase animate-pulse">
                      {t('shop_gacha_reveal_opening_now', language)}...
                    </span>
                  </motion.div>
                </motion.div>
              )}

              {/* PHASE 3 & 4: spread & summary (카드 5장 펼쳐짐 및 리빌) */}
              {(phase === 'spread' || phase === 'summary') && (
                <motion.div key="gacha-spread-stage" {...stageMotion} className="my-auto space-y-6 z-10 py-2">
                  {/* 카드 5장 그리드 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                    {cards.map((card, index) => {
                      const dbCard = CARD_DATABASE[card.imageIndex];
                      const isRevealed = revealedIds.has(index) || card.isRevealed;
                      const isBest = bestCard && bestCard.imageIndex === card.imageIndex && isRevealed && phase === 'summary';

                      return (
                        <div key={card.id ?? `${card.imageIndex}-${index}`} className="flex flex-col items-center gap-2">
                          <motion.div
                            initial={instantMode ? undefined : { y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.08 }}
                            className="relative w-full aspect-[3/4] group cursor-pointer"
                            onClick={() => handleFlipCardIndex(index)}
                          >
                            {/* BEST PULL 하이라이트 배지 */}
                            {isBest && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-lg animate-bounce">
                                <Trophy size={12} />
                                <span>{t('shop_gacha_best_pull', language)}</span>
                              </div>
                            )}

                            {/* 3D Flip Container */}
                            <motion.div
                              animate={{ rotateY: isRevealed ? 180 : 0 }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                              style={{ transformStyle: 'preserve-3d' }}
                              className={cn(
                                'relative w-full h-full rounded-2xl border transition-all duration-300 shadow-xl',
                                isBest ? 'border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.6)]' : 'border-white/15 hover:border-white/40',
                              )}
                            >
                              {/* 카드 뒷면 (Sealed) */}
                              <div
                                style={{ backfaceVisibility: 'hidden' }}
                                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-3 flex flex-col items-center justify-between text-center overflow-hidden border border-white/10"
                              >
                                <div className="w-full flex justify-between items-center text-[9px] text-white/40 font-mono">
                                  <span>#{index + 1}</span>
                                  <Sparkles size={12} className="text-yellow-400/60" />
                                </div>

                                <div className="my-auto flex flex-col items-center gap-2">
                                  <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center border border-white/20 bg-white/5 shadow-inner"
                                    style={{ boxShadow: `inset 0 0 15px ${getRarityGlowColor(card.rarity)}` }}
                                  >
                                    <Package2 size={24} className="text-amber-200" />
                                  </div>
                                  <span className="text-[10px] font-black tracking-widest text-white/70 uppercase">
                                    {t('shop_gacha_card_back_label', language)}
                                  </span>
                                </div>

                                <span className="text-[9px] font-bold text-amber-300/80 animate-pulse">
                                  TAP TO REVEAL
                                </span>
                              </div>

                              {/* 카드 앞면 (Revealed) */}
                              <div
                                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                className="absolute inset-0 rounded-2xl overflow-hidden bg-slate-950"
                              >
                                <CardItem
                                  card={{
                                    ...dbCard,
                                    id: `gacha-reveal-${index}`,
                                    owner: null,
                                    level: 1,
                                    imageIndex: dbCard?.index,
                                  }}
                                  className="h-full w-full"
                                  customImage={customCardImage}
                                  processedImage={dbCard?.index ? processedCardImages?.[dbCard.index - 1] : undefined}
                                  lowSpecMode={lowSpecMode}
                                />
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-2.5 pt-6">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className={cn('rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider', rarityBadgeClass(card.rarity))}>
                                      {card.rarity}
                                    </span>
                                    <span className="text-[10px] font-black text-white truncate">
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
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      {!allRevealed && (
                        <button
                          type="button"
                          onClick={handleRevealAll}
                          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                        >
                          {t('shop_gacha_reveal_all', language)}
                        </button>
                      )}

                      {phase === 'summary' && (
                        <>
                          <button
                            type="button"
                            onClick={onDrawAgain}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                          >
                            <Package2 size={16} />
                            {t('draw_again', language)} ({packCost} SNS)
                          </button>
                          {canShareBestCard && bestCard && (
                            <button
                              type="button"
                              onClick={() => onShareBestCard(bestCard.imageIndex)}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/20 text-fuchsia-200 text-xs font-black uppercase tracking-wider transition hover:bg-fuchsia-500/30 active:scale-95 cursor-pointer shadow-md"
                            >
                              <Share2 size={15} />
                              {t('shop_gacha_share_cta', language)}
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-full border border-white/20 bg-white/10 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
                    >
                      {t('close', language)}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 우측 천장 가이드 및 확률 피드 */}
          <div className="space-y-4">
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
