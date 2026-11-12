import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hsAudio } from '../audio';
import { HearthstoneCard, HsGoldCoinIcon } from '../components/CardVisual';
import { CardZoomModal } from '../components/CardZoomModal';
import { OpenedPackCard, hsStorage } from '../storage';
import { CardRarity } from '../types';

const HOVER_RARITY_GLOW: Record<CardRarity, string> = {
  FREE: '0 0 20px 4px rgba(248, 250, 252, 0.55)',
  COMMON: '0 0 24px 5px rgba(226, 232, 240, 0.72)',
  RARE: '0 0 32px 10px rgba(59, 130, 246, 0.95), 0 0 60px 18px rgba(37, 99, 235, 0.65)',
  EPIC: '0 0 36px 12px rgba(168, 85, 247, 0.98), 0 0 68px 22px rgba(147, 51, 234, 0.72)',
  LEGENDARY:
    '0 0 42px 15px rgba(251, 191, 36, 1), 0 0 82px 28px rgba(249, 115, 22, 0.88)',
};

const FLIP_RING_COLOR: Record<CardRarity, string> = {
  FREE: 'border-slate-200 bg-slate-200/25 shadow-[0_0_30px_rgba(255,255,255,0.8)]',
  COMMON: 'border-slate-100 bg-white/25 shadow-[0_0_34px_rgba(255,255,255,0.85)]',
  RARE: 'border-sky-300 bg-sky-400/30 shadow-[0_0_45px_rgba(56,189,248,0.98)]',
  EPIC: 'border-purple-300 bg-purple-500/35 shadow-[0_0_52px_rgba(192,132,252,1)]',
  LEGENDARY: 'border-yellow-200 bg-amber-400/45 shadow-[0_0_65px_rgba(251,191,36,1)]',
};

const RARITY_PRIORITY: Record<CardRarity, number> = {
  FREE: 0,
  COMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4,
};

const CARD_BACK_MAP: Record<string, string> = {
  classic: '/stone-assets/ui/cardback_classic.webp',
  legend: '/stone-assets/ui/cardback_legend.webp',
  frost: '/stone-assets/ui/cardback_frost.webp',
  gold: '/stone-assets/ui/cardback_gold.webp',
};

/**
 * Authentic Blizzard Hearthstone 5-Card Radial Pentagon Spread
 * Coordinates relative to the center of the Arcane Rune Altar (desktop >= 768px).
 */
const PENTAGON_SLOTS: {
  dx: number;
  dy: number;
  tilt: string;
  floatDur: string;
  floatDelay: string;
}[] = [
  { dx: -248, dy: -94, tilt: '-4deg', floatDur: '3.35s', floatDelay: '-0.2s' },
  { dx: 0, dy: -124, tilt: '0deg', floatDur: '3.75s', floatDelay: '-1.15s' },
  { dx: 248, dy: -94, tilt: '4deg', floatDur: '3.45s', floatDelay: '-2.1s' },
  { dx: -146, dy: 124, tilt: '-2.4deg', floatDur: '3.85s', floatDelay: '-0.75s' },
  { dx: 146, dy: 124, tilt: '2.4deg', floatDur: '3.55s', floatDelay: '-2.65s' },
];

/**
 * Mobile Portrait (< 768px) 5-Card Floating Constellation (2-1-2 Vertical Diamond)
 * Fits 100% inside 360px~430px portrait screens with zero clipping!
 */
const MOBILE_PENTAGON_SLOTS: {
  dx: number;
  dy: number;
  tilt: string;
  floatDur: string;
  floatDelay: string;
}[] = [
  { dx: -82, dy: -142, tilt: '-3.2deg', floatDur: '3.35s', floatDelay: '-0.2s' },
  { dx: 82, dy: -142, tilt: '3.2deg', floatDur: '3.75s', floatDelay: '-1.15s' },
  { dx: 0, dy: -2, tilt: '0deg', floatDur: '3.45s', floatDelay: '-2.1s' },
  { dx: -82, dy: 138, tilt: '-2.2deg', floatDur: '3.85s', floatDelay: '-0.75s' },
  { dx: 82, dy: 138, tilt: '2.2deg', floatDur: '3.55s', floatDelay: '-2.65s' },
];

export const PackOpeningScreen: React.FC<{
  onBack: () => void;
  onProfileChanged: () => void;
}> = ({ onBack, onProfileChanged }) => {
  const [profile, setProfile] = useState(() => hsStorage.getProfile());
  const [packBursting, setPackBursting] = useState(false);
  const [burstFlash, setBurstFlash] = useState(false);
  const [openedCards, setOpenedCards] = useState<OpenedPackCard[] | null>(null);
  const [cardsDealt, setCardsDealt] = useState(false);
  const [cardsSweepingOut, setCardsSweepingOut] = useState(false);

  const [revealed, setRevealed] = useState<boolean[]>([false, false, false, false, false]);
  const [flippingActive, setFlippingActive] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hoverTilt, setHoverTilt] = useState<{ idx: number; rx: number; ry: number } | null>(null);
  const [draggingPack, setDraggingPack] = useState(false);
  const [altarShake, setAltarShake] = useState(false);
  const [zoomedPackCard, setZoomedPackCard] = useState<OpenedPackCard | null>(null);
  const [isDesktopStage, setIsDesktopStage] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= 768,
  );

  useEffect(() => {
    const onResize = () => setIsDesktopStage(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Refs to prevent any stale-closure bugs during rapid/staggered `revealAll` flips!
  const openedCardsRef = useRef<OpenedPackCard[] | null>(null);
  const revealedRef = useRef<boolean[]>([false, false, false, false, false]);
  const timersRef = useRef<number[]>([]);

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const motes = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        left: `${10 + ((i * 41) % 80)}%`,
        size: 3 + (i % 3) * 1.5,
        delay: `${(i * 0.37).toFixed(2)}s`,
        duration: `${(4.5 + (i % 4) * 0.9).toFixed(2)}s`,
        dx: `${(i % 2 === 0 ? 1 : -1) * (12 + (i % 4) * 8)}px`,
      })),
    [],
  );

  const sync = useCallback(() => {
    setProfile(hsStorage.getProfile());
    onProfileChanged();
  }, [onProfileChanged]);

  const triggerOpenPack = useCallback(() => {
    if (packBursting || openedCardsRef.current) return;
    const currentProfile = hsStorage.getProfile();
    if (currentProfile.packs <= 0) return;

    clearAllTimers();
    hsAudio.playSfx('pack_open');
    setPackBursting(true);

    scheduleTimer(() => {
      const res = hsStorage.openOnePack();
      setPackBursting(false);
      if (res) {
        const initialRev = [false, false, false, false, false];
        openedCardsRef.current = res;
        revealedRef.current = initialRev;
        setOpenedCards(res);
        setRevealed(initialRev);
        setFlippingActive([false, false, false, false, false]);
        setCardsSweepingOut(false);
        setCardsDealt(false);
        setBurstFlash(true);
        sync();

        // Trigger radial fly-out from center of exploded pack on next animation frame!
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            setCardsDealt(true);
          });
        });

        scheduleTimer(() => setBurstFlash(false), 520);
      }
    }, 520);
  }, [packBursting, clearAllTimers, scheduleTimer, sync]);

  const revealCardAt = useCallback(
    (idx: number, opts?: { suppressVo?: boolean }) => {
      const cards = openedCardsRef.current;
      if (!cards || !cards[idx] || revealedRef.current[idx]) return;

      const item = cards[idx];
      // Synchronously update ref first so staggered timeouts NEVER overwrite each other!
      const nextRev = [...revealedRef.current];
      nextRev[idx] = true;
      revealedRef.current = nextRev;
      setRevealed(nextRev);

      setFlippingActive((prev) => prev.map((v, i) => (i === idx ? true : v)));
      scheduleTimer(() => {
        setFlippingActive((prev) => prev.map((v, i) => (i === idx ? false : v)));
      }, 680);

      hsAudio.playSfx('card_flip', 0.92);
      if (item.card.rarity === 'LEGENDARY') {
        hsAudio.playSfx('pack_legendary');
        setAltarShake(true);
        scheduleTimer(() => setAltarShake(false), 450);
        if (!opts?.suppressVo) {
          hsAudio.playInnkeeper(item.isGolden ? 'golden_legendary' : 'legendary');
        }
      } else if (item.card.rarity === 'EPIC') {
        hsAudio.playSfx('pack_epic');
        setAltarShake(true);
        scheduleTimer(() => setAltarShake(false), 320);
        if (!opts?.suppressVo) {
          hsAudio.playInnkeeper(item.isGolden ? 'golden_epic' : 'epic');
        }
      } else if (item.card.rarity === 'RARE') {
        hsAudio.playSfx('pack_rare');
        if (!opts?.suppressVo) {
          hsAudio.playInnkeeper(item.isGolden ? 'golden_rare' : 'rare');
        }
      } else if (item.isGolden) {
        hsAudio.playSfx('pack_rare', 0.8);
        if (!opts?.suppressVo) {
          hsAudio.playInnkeeper('golden_common');
        }
      }
    },
    [scheduleTimer],
  );

  const revealAll = useCallback(() => {
    const cards = openedCardsRef.current;
    if (!cards) return;

    const unrevealedIndices: number[] = [];
    for (let i = 0; i < cards.length; i++) {
      if (!revealedRef.current[i]) {
        unrevealedIndices.push(i);
      }
    }
    if (unrevealedIndices.length === 0) return;

    // Pick the single highest-rarity (with Golden tie-breaker) unrevealed card to announce cleanly
    let bestVoIdx = -1;
    let bestScore = 1;
    for (const idx of unrevealedIndices) {
      const score = RARITY_PRIORITY[cards[idx].card.rarity] * 2 + (cards[idx].isGolden ? 1 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestVoIdx = idx;
      }
    }

    unrevealedIndices.forEach((cardIdx, stepOrder) => {
      scheduleTimer(() => {
        revealCardAt(cardIdx, { suppressVo: cardIdx !== bestVoIdx });
      }, stepOrder * 165);
    });
  }, [revealCardAt, scheduleTimer]);

  const finishPackSession = useCallback(() => {
    if (!openedCardsRef.current || cardsSweepingOut) return;
    setZoomedPackCard(null);
    hsAudio.playSfx('menu_select');
    setCardsSweepingOut(true);
    scheduleTimer(() => {
      openedCardsRef.current = null;
      revealedRef.current = [false, false, false, false, false];
      setOpenedCards(null);
      setCardsDealt(false);
      setCardsSweepingOut(false);
    }, 280);
  }, [cardsSweepingOut, scheduleTimer]);

  // Authentic Blizzard Spacebar Shortcut:
  // 1) Unopened -> Open pack | 2) Cards out & unrevealed -> Flip all remaining | 3) All revealed -> Done!
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (zoomedPackCard) {
        setZoomedPackCard(null);
        return;
      }
      if (!openedCardsRef.current && profile.packs > 0) {
        triggerOpenPack();
      } else if (openedCardsRef.current && !revealedRef.current.every(Boolean)) {
        revealAll();
      } else if (openedCardsRef.current && revealedRef.current.every(Boolean)) {
        finishPackSession();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [profile.packs, triggerOpenPack, revealAll, finishPackSession, zoomedPackCard]);

  const allRevealed = Boolean(openedCards && revealed.every(Boolean));
  const backImg = CARD_BACK_MAP[profile.selectedCardBack] || CARD_BACK_MAP.classic;

  return (
    <div
      style={{ backgroundImage: 'url(/stone-assets/ui/pack_altar_bg.webp)' }}
      className="relative flex h-[100dvh] w-full select-none flex-col justify-between overflow-hidden bg-cover bg-center p-2.5 text-amber-100 sm:p-4"
    >
      <div className="pointer-events-none absolute inset-0 bg-radial from-sky-500/12 via-black/46 to-black/88" />

      {/* Top Brass Header */}
      <header className="relative z-30 mx-auto flex w-full max-w-6xl shrink-0 flex-wrap items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={() => {
            hsAudio.playSfx('box_close');
            onBack();
          }}
          className="hs-brass-btn min-h-[40px] rounded-xl px-3 py-1.5 text-xs font-extrabold text-amber-100 sm:px-4 sm:py-2 sm:text-sm"
        >
          ← <span className="hidden sm:inline">여관 </span>상자로
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <div className="flex min-h-[40px] items-center gap-1.5 rounded-xl border-2 border-[#c8a158] bg-stone-950/90 px-2.5 py-1 text-xs font-extrabold shadow-lg sm:gap-2 sm:px-3.5 sm:py-1.5">
            <HsGoldCoinIcon size={18} />
            <span className="hidden sm:inline">보유 골드</span>
            <span className="hs-num text-xs text-yellow-300 sm:text-sm">{profile.gold}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (hsStorage.buyPacksWithGold(1)) {
                hsAudio.playSfx('purchase');
                sync();
              }
            }}
            className="hs-arcane-btn flex min-h-[40px] items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold text-white sm:gap-1.5 sm:px-3.5 sm:text-xs"
          >
            <HsGoldCoinIcon size={15} />
            <span>+ 1팩 구매 (100)</span>
          </button>
        </div>
      </header>

      {/* Mobile Portrait Compact Unopened Pack Strip (`< md`) */}
      <div className="relative z-20 mx-auto mt-1.5 flex w-full max-w-6xl shrink-0 items-center justify-between rounded-2xl border-2 border-[#c8a158]/70 bg-stone-950/85 px-3 py-1.5 shadow-lg md:hidden">
        <div className="flex items-center gap-2">
          <img
            src="/stone-assets/ui/classic_pack.webp"
            alt=""
            className="h-8 w-6 object-contain drop-shadow"
          />
          <span className="text-xs font-extrabold text-amber-100">
            미개봉 오리지널 팩
          </span>
          <span className="hs-num rounded-full border border-[#e0bc72] bg-black/70 px-2.5 py-0.5 text-xs text-yellow-300">
            {profile.packs}개
          </span>
        </div>
        {!openedCards && profile.packs > 0 && (
          <button
            type="button"
            onClick={triggerOpenPack}
            className="hs-brass-btn rounded-lg px-2.5 py-1 text-[11px] font-extrabold text-sky-200"
          >
            즉시 개봉
          </button>
        )}
        {openedCards && (
          <span className="text-[11px] font-bold text-sky-300">
            뒤집힌 카드 터치 시 확대
          </span>
        )}
      </div>

      {/* Main Split: Left Pack Stack (Desktop) + Glowing Levitation Altar */}
      <main className="relative z-20 mx-auto my-1.5 flex min-h-0 w-full max-w-6xl flex-1 items-stretch gap-5 md:my-auto md:grid md:flex-none md:grid-cols-12 md:items-center">
        {/* Left: Unopened Pack Stack Tray (Desktop >= md) */}
        <aside className="hs-wood-panel hidden flex-col items-center justify-center rounded-3xl p-4 sm:p-5 md:col-span-3 md:flex">
          <div className="hs-title mb-2 text-sm font-extrabold text-amber-100">
            미개봉 오리지널 팩
          </div>
          <div className="hs-num mb-3 rounded-full border-2 border-[#e0bc72] bg-stone-950/85 px-4 py-1 text-xl text-yellow-300 shadow-inner">
            {profile.packs}개
          </div>

          {profile.packs > 0 ? (
            <div
              draggable={!openedCards}
              onDragStart={() => setDraggingPack(true)}
              onDragEnd={() => setDraggingPack(false)}
              onClick={triggerOpenPack}
              className={`relative cursor-grab transition duration-200 hover:scale-106 active:cursor-grabbing ${
                openedCards ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              {/* Stacked Pack Depth Illusion */}
              {profile.packs > 2 && (
                <img
                  src="/stone-assets/ui/classic_pack.webp"
                  alt=""
                  className="pointer-events-none absolute -left-2 top-2 h-44 w-32 -rotate-3 object-contain opacity-65 brightness-75"
                />
              )}
              {profile.packs > 1 && (
                <img
                  src="/stone-assets/ui/classic_pack.webp"
                  alt=""
                  className="pointer-events-none absolute left-1.5 top-1 h-44 w-32 rotate-2 object-contain opacity-80 brightness-90"
                />
              )}
              <img
                src="/stone-assets/ui/classic_pack.webp"
                alt="오리지널 카드 팩"
                className="relative z-10 h-44 w-32 object-contain drop-shadow-[0_16px_26px_rgba(0,0,0,0.92)]"
              />
            </div>
          ) : (
            <div className="py-10 text-center text-xs font-semibold text-amber-200/70">
              보유한 카드 팩이 없습니다.
              <br />
              상단 버튼으로 100골드에 구매하세요.
            </div>
          )}

          <p className="mt-3 text-center text-[11px] font-semibold text-amber-200/80">
            팩을 제단으로 드래그하거나
            <br />
            <b className="text-amber-100">클릭 / 스페이스바</b>로 개봉
          </p>
        </aside>

        {/* Right: Glowing Rune Altar + 5-Card Floating 3D Flip Stage */}
        <section
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDraggingPack(false);
            triggerOpenPack();
          }}
          className={`relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-[28px] border-[3px] border-[#cfa85d]/75 bg-radial from-sky-500/22 via-stone-950/72 to-stone-950/94 p-2.5 shadow-[0_24px_60px_rgba(0,0,0,0.92)] transition-transform sm:rounded-[36px] sm:border-[4px] sm:p-4 md:col-span-9 md:min-h-[540px] ${
            altarShake ? 'animate-[hsShakeHeavy_0.36s_ease-in-out]' : ''
          }`}
        >
          {/* Floating Magical Arcane Motes Rising from Altar */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {motes.map((m) => (
              <span
                key={m.id}
                style={
                  {
                    left: m.left,
                    bottom: '-10px',
                    width: `${m.size}px`,
                    height: `${m.size}px`,
                    animation: `hsEmberRise ${m.duration} ease-in ${m.delay} infinite`,
                    '--ember-dx': m.dx,
                  } as React.CSSProperties
                }
                className="absolute rounded-full bg-sky-300/85 shadow-[0_0_10px_2px_rgba(56,189,248,0.85)]"
              />
            ))}
          </div>

          {/* Ambient Rotating Arcane Rune Ring & Godrays on Altar */}
          <img
            src="/stone-assets/ui/hs_thebox_glowring.webp"
            alt=""
            className="pointer-events-none absolute h-[290px] w-[290px] animate-[hsSlowSpin_38s_linear_infinite] rounded-full object-contain opacity-45 mix-blend-screen sm:h-[440px] sm:w-[440px]"
          />
          <img
            src="/stone-assets/ui/hs_godrays1.webp"
            alt=""
            className="pointer-events-none absolute h-[310px] w-[310px] animate-[hsSlowSpin_44s_linear_infinite] object-contain opacity-28 mix-blend-screen sm:h-[460px] sm:w-[460px]"
          />

          {/* Pack Explosion Shockwave Flash */}
          {burstFlash && (
            <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
              <div className="h-52 w-52 animate-[hsFlipBurstRing_0.52s_ease-out_forwards] rounded-full border-[8px] border-amber-200 bg-sky-300/45 shadow-[0_0_120px_50px_rgba(125,211,252,0.95)] sm:h-64 sm:w-64" />
            </div>
          )}

          {!openedCards ? (
            /* Idle / Cracking Pack on Rune Socket */
            <div
              onClick={triggerOpenPack}
              className={`relative z-20 flex cursor-pointer flex-col items-center justify-center rounded-full border-[4px] p-7 transition-all sm:p-10 ${
                packBursting
                  ? 'border-yellow-200 bg-amber-300/45 shadow-[0_0_110px_42px_rgba(250,204,21,0.98)]'
                  : draggingPack
                    ? 'scale-110 border-sky-300 bg-sky-500/25 shadow-[0_0_65px_rgba(56,189,248,0.9)]'
                    : 'border-sky-400/50 bg-sky-950/40 shadow-[0_0_48px_rgba(56,189,248,0.48)] hover:scale-105'
              }`}
            >
              <div
                style={{
                  animation: packBursting
                    ? 'hsPackTremble 0.52s ease-in forwards'
                    : profile.packs > 0
                      ? 'hsAltarPackHover 3.4s ease-in-out infinite'
                      : undefined,
                }}
              >
                <img
                  src="/stone-assets/ui/classic_pack.webp"
                  alt="제단 카드 팩"
                  className={`h-36 w-26 object-contain transition sm:h-44 sm:w-32 ${
                    profile.packs > 0
                      ? 'opacity-98 drop-shadow-[0_18px_28px_rgba(0,0,0,0.92)]'
                      : 'opacity-25 grayscale'
                  } ${packBursting ? 'brightness-150 saturate-150' : ''}`}
                />
              </div>
              <span className="hs-title hs-outline-sm mt-3 text-center text-base font-extrabold text-sky-200 sm:text-lg">
                {packBursting
                  ? '비전 봉인 폭발 중!!'
                  : profile.packs > 0
                    ? '터치하여 오리지널 팩 개봉'
                    : '개봉할 카드 팩이 없습니다'}
              </span>
            </div>
          ) : (
            /* ==================== 5-CARD FLOATING PENTAGON + 3D FLIP STAGE ==================== */
            <div className="relative z-20 flex h-full w-full flex-col items-center justify-between">
              {/* Top Floating Action Control (`5장 한 번에 뒤집기` -> `확인 완료`) */}
              <div className="relative z-50 flex shrink-0 items-center gap-3">
                {!allRevealed ? (
                  <button
                    type="button"
                    onClick={revealAll}
                    className="hs-arcane-btn min-h-[42px] rounded-xl px-4 py-2 text-xs font-extrabold tracking-wide text-white shadow-[0_8px_24px_rgba(2,132,199,0.75)] sm:px-5 sm:text-sm"
                  >
                    5장 한 번에 뒤집기
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={finishPackSession}
                    className="hs-brass-btn min-h-[44px] rounded-2xl border-yellow-200 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-800 px-7 py-2 text-sm font-extrabold text-stone-950 shadow-[0_0_28px_rgba(250,204,21,0.9)] sm:px-9 sm:text-base"
                  >
                    확인 완료
                  </button>
                )}
              </div>

              {/* 5-Point Radial Floating Stage (Mobile Constellation < md, Pentagon >= md) */}
              <div className="relative my-auto flex min-h-[440px] w-full flex-1 items-center justify-center md:min-h-[470px]">
                <div className="relative h-[440px] w-full max-w-[360px] md:h-[470px] md:max-w-[760px]">
                  {openedCards.map((item, idx) => {
                    const isUp = revealed[idx];
                    const isFlippingNow = flippingActive[idx];
                    const isHovered = hoveredIdx === idx;
                    const slot = isDesktopStage
                      ? PENTAGON_SLOTS[idx] || PENTAGON_SLOTS[0]
                      : MOBILE_PENTAGON_SLOTS[idx] || MOBILE_PENTAGON_SLOTS[0];
                    const isHighTier =
                      item.card.rarity === 'LEGENDARY' || item.card.rarity === 'EPIC';
                    const activeTilt =
                      hoverTilt && hoverTilt.idx === idx
                        ? { rx: hoverTilt.rx, ry: hoverTilt.ry }
                        : { rx: 0, ry: 0 };

                    return (
                      <div
                        key={`${item.card.id}_${idx}`}
                        style={{
                          transition: `transform 0.62s cubic-bezier(0.18, 0.89, 0.32, 1.14) ${idx * 55}ms, opacity 0.28s ease`,
                          transform: cardsSweepingOut
                            ? 'translate3d(0px, -80px, 0) scale(0.25)'
                            : cardsDealt
                              ? `translate3d(${slot.dx}px, ${slot.dy}px, 0) scale(1)`
                              : 'translate3d(0px, 0px, 0) scale(0.16) rotate(-16deg)',
                          opacity: cardsSweepingOut ? 0 : 1,
                        }}
                        className={`absolute left-1/2 top-1/2 -ml-[54px] -mt-[82px] md:-ml-[82px] md:-mt-[124px] ${
                          isFlippingNow || isHovered ? 'z-40' : 'z-20'
                        }`}
                      >
                        {/* Layer A: Continuous Magical Mid-Air Levitation Wrapper ("둥둥 떠다니는 효과") */}
                        <div
                          onMouseEnter={() => {
                            setHoveredIdx(idx);
                            if (!isUp) hsAudio.playSfx('card_hover', 0.5);
                          }}
                          onMouseMove={(e) => {
                            const r = e.currentTarget.getBoundingClientRect();
                            const nx = (e.clientX - r.left) / r.width - 0.5;
                            const ny = (e.clientY - r.top) / r.height - 0.5;
                            setHoverTilt({ idx, rx: -ny * 15, ry: nx * 15 });
                          }}
                          onMouseLeave={() => {
                            setHoveredIdx(null);
                            setHoverTilt(null);
                          }}
                          onClick={() => {
                            if (!isUp) {
                              revealCardAt(idx);
                            } else {
                              hsAudio.playSfx('card_hover', 0.7);
                              setZoomedPackCard(item);
                            }
                          }}
                          style={
                            {
                              '--base-tilt': isHovered ? '0deg' : slot.tilt,
                              animation: `hsPackCardFloat ${slot.floatDur} ease-in-out ${slot.floatDelay} infinite`,
                            } as React.CSSProperties
                          }
                          className="relative h-[164px] w-[108px] cursor-pointer md:h-[248px] md:w-[164px]"
                        >
                          {/* Breathing Ground Levitation Shadow Under Card */}
                          <div
                            className={`pointer-events-none absolute -bottom-3 left-1/2 h-3.5 w-20 -translate-x-1/2 rounded-full bg-black/75 blur-md transition-all duration-300 md:-bottom-4 md:h-4 md:w-28 ${
                              isHovered ? 'scale-115 opacity-90' : 'opacity-65'
                            }`}
                          />

                          {/* Flip Moment Expanding Rarity Shockwave Ring */}
                          {isFlippingNow && (
                            <div
                              className={`pointer-events-none absolute left-1/2 top-1/2 z-50 h-28 w-28 -translate-x-1/2 -translate-y-1/2 animate-[hsFlipBurstRing_0.64s_ease-out_forwards] rounded-full border-[5px] md:h-40 md:w-40 ${
                                FLIP_RING_COLOR[item.card.rarity]
                              }`}
                            />
                          )}

                          {/* Persistent Rotating Godrays Behind Revealed Epic / Legendary Cards */}
                          {isUp && isHighTier && (
                            <img
                              src="/stone-assets/ui/hs_godrays1.webp"
                              alt=""
                              className="pointer-events-none absolute -inset-6 z-0 h-[calc(100%+48px)] w-[calc(100%+48px)] animate-[hsSlowSpin_18s_linear_infinite] object-contain opacity-75 mix-blend-screen md:-inset-8 md:h-[calc(100%+64px)] md:w-[calc(100%+64px)]"
                            />
                          )}

                          {/* Layer B: 3D Lift Arc + Perspective Stage */}
                          <div
                            style={{
                              perspective: '1150px',
                              animation: isFlippingNow
                                ? 'hsCardFlipLift 0.62s cubic-bezier(0.22, 1, 0.36, 1)'
                                : undefined,
                            }}
                            className={`relative z-10 h-full w-full transition-transform duration-200 ${
                              !isUp && isHovered ? '-translate-y-2 scale-108' : ''
                            }`}
                          >
                            {/* Layer C: Pure 3D Two-Sided Rotor (`preserve-3d` — NO filter/overflow here!) */}
                            <div
                              style={{
                                transformStyle: 'preserve-3d',
                                WebkitTransformStyle: 'preserve-3d',
                                transition: 'transform 0.58s cubic-bezier(0.20, 0.92, 0.28, 1.06)',
                                transform: `rotateY(${isUp ? 180 : 0}deg) rotateX(${activeTilt.rx}deg) rotateZ(${activeTilt.ry * 0.15}deg)`,
                              }}
                              className="relative h-full w-full"
                            >
                              {/* 1. BACK FACE (Unflipped Card Back + Rarity Anticipation Aura) */}
                              <div
                                style={{
                                  backfaceVisibility: 'hidden',
                                  WebkitBackfaceVisibility: 'hidden',
                                  transform: 'rotateY(0deg) translateZ(2px)',
                                  boxShadow: isHovered
                                    ? HOVER_RARITY_GLOW[item.card.rarity]
                                    : '0 14px 28px rgba(0,0,0,0.88)',
                                }}
                                className="absolute inset-0 overflow-hidden rounded-[12px] border-2 border-[#e2c27c]/85 bg-stone-950 transition-shadow duration-200 md:rounded-[16px]"
                              >
                                <img
                                  src={backImg}
                                  alt="카드 뒷면"
                                  draggable={false}
                                  className="h-full w-full object-cover"
                                />
                                {/* Subtle Magical Shimmer Across Floating Card Back */}
                                <div
                                  style={{
                                    background:
                                      'linear-gradient(125deg, transparent 32%, rgba(255,255,255,0.22) 50%, transparent 68%)',
                                    backgroundSize: '220% 100%',
                                    animation: 'hsGoldenFoil 4.2s linear infinite',
                                  }}
                                  className="pointer-events-none absolute inset-0 mix-blend-screen"
                                />
                              </div>

                              {/* 2. FRONT FACE (Revealed Official 1:1 koKR Sculpted Card) */}
                              <div
                                style={{
                                  backfaceVisibility: 'hidden',
                                  WebkitBackfaceVisibility: 'hidden',
                                  transform: 'rotateY(180deg) translateZ(2px)',
                                }}
                                className="absolute inset-0 flex items-center justify-center"
                              >
                                <div className="origin-center scale-[0.61] md:scale-[0.91]">
                                  <HearthstoneCard
                                    card={item.card}
                                    isGolden={item.isGolden}
                                    rarityAura={item.card.rarity}
                                    size="MD"
                                  />
                                </div>

                                {item.isNew && (
                                  <span className="hs-outline-sm pointer-events-none absolute right-0 top-0.5 z-40 rounded border border-yellow-200 bg-gradient-to-b from-amber-400 to-amber-700 px-1.5 py-0.5 text-[8.5px] font-extrabold text-white shadow-lg md:top-1 md:rounded-md md:px-2 md:text-[10px]">
                                    신규!
                                  </span>
                                )}
                                {item.isGolden && (
                                  <span className="hs-outline-sm pointer-events-none absolute -bottom-1 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded border border-yellow-200 bg-gradient-to-b from-yellow-400 to-amber-700 px-1.5 py-0.5 text-[8px] font-extrabold text-white shadow md:rounded-md md:px-2 md:text-[9.5px]">
                                    황금 카드
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="relative z-30 shrink-0 text-center text-[10.5px] font-bold text-amber-200/80 sm:text-[11px]">
        카드를 터치하면 입체 회전 개봉되며, 뒤집힌 카드를 다시 터치하면 크게 확대해 읽을 수 있습니다
      </footer>

      {/* Card Zoom Modal for Inspecting Any Flipped Pack Card */}
      {zoomedPackCard && (
        <CardZoomModal
          card={zoomedPackCard.card}
          isGolden={zoomedPackCard.isGolden}
          rarityAura={zoomedPackCard.card.rarity}
          subtitleBadge={
            zoomedPackCard.isNew
              ? '신규 획득 카드!'
              : zoomedPackCard.isGolden
                ? '황금 카드 획득!'
                : '카드 팩 개봉 획득'
          }
          showFlavor
          primaryAction={{
            label: '확인 (닫기)',
            variant: 'arcane',
            onClick: () => {
              hsAudio.playSfx('ui_click', 0.65);
              setZoomedPackCard(null);
            },
          }}
          onCancel={() => setZoomedPackCard(null)}
        />
      )}
    </div>
  );
};
