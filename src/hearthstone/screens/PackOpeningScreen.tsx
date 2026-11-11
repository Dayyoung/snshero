import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hsAudio } from '../audio';
import { HearthstoneCard, HsGoldCoinIcon } from '../components/CardVisual';
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
  classic: '/hs-assets/ui/cardback_classic.webp',
  legend: '/hs-assets/ui/cardback_legend.webp',
  frost: '/hs-assets/ui/cardback_frost.webp',
  gold: '/hs-assets/ui/cardback_gold.webp',
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
          hsAudio.playInnkeeper('epic');
        }
      } else if (item.card.rarity === 'RARE') {
        hsAudio.playSfx('pack_rare');
        if (!opts?.suppressVo) {
          hsAudio.playInnkeeper('rare');
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

    // Pick the single highest-rarity unrevealed card to announce via Innkeeper VO cleanly
    let bestVoIdx = -1;
    let bestScore = 1; // Only Rare (2), Epic (3), Legendary (4) have Innkeeper callouts
    for (const idx of unrevealedIndices) {
      const score = RARITY_PRIORITY[cards[idx].card.rarity];
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
  }, [profile.packs, triggerOpenPack, revealAll, finishPackSession]);

  const allRevealed = Boolean(openedCards && revealed.every(Boolean));
  const backImg = CARD_BACK_MAP[profile.selectedCardBack] || CARD_BACK_MAP.classic;

  return (
    <div
      style={{ backgroundImage: 'url(/hs-assets/ui/pack_altar_bg.webp)' }}
      className="relative flex h-[100dvh] w-full select-none flex-col justify-between overflow-hidden bg-cover bg-center p-3 text-amber-100 sm:p-4"
    >
      <div className="pointer-events-none absolute inset-0 bg-radial from-sky-500/12 via-black/46 to-black/88" />

      {/* Top Brass Header */}
      <header className="relative z-30 mx-auto flex w-full max-w-6xl items-center justify-between">
        <button
          type="button"
          onClick={() => {
            hsAudio.playSfx('box_close');
            onBack();
          }}
          className="hs-brass-btn rounded-xl px-4 py-2 text-xs font-extrabold text-amber-100 sm:text-sm"
        >
          ← 여관 상자로 돌아가기
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border-2 border-[#c8a158] bg-stone-950/90 px-3.5 py-1.5 text-xs font-extrabold shadow-lg">
            <HsGoldCoinIcon size={20} />
            <span>보유 골드</span>
            <span className="hs-num text-sm text-yellow-300">{profile.gold}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (hsStorage.buyPacksWithGold(1)) {
                hsAudio.playSfx('purchase');
                sync();
              }
            }}
            className="hs-arcane-btn flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-extrabold text-white"
          >
            <HsGoldCoinIcon size={16} />
            <span>+ 1팩 즉시 구매 (100)</span>
          </button>
        </div>
      </header>

      {/* Main Split: Left Pack Stack + Right Arcane Levitation Altar */}
      <main className="relative z-20 mx-auto my-auto grid w-full max-w-6xl grid-cols-1 items-center gap-5 md:grid-cols-12">
        {/* Left: Unopened Pack Stack Tray */}
        <aside className="hs-wood-panel flex flex-col items-center justify-center rounded-3xl p-4 sm:p-5 md:col-span-3">
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
                  src="/hs-assets/ui/classic_pack.webp"
                  alt=""
                  className="pointer-events-none absolute -left-2 top-2 h-44 w-32 -rotate-3 object-contain opacity-65 brightness-75"
                />
              )}
              {profile.packs > 1 && (
                <img
                  src="/hs-assets/ui/classic_pack.webp"
                  alt=""
                  className="pointer-events-none absolute left-1.5 top-1 h-44 w-32 rotate-2 object-contain opacity-80 brightness-90"
                />
              )}
              <img
                src="/hs-assets/ui/classic_pack.webp"
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
          className={`relative flex min-h-[540px] flex-col items-center justify-center overflow-hidden rounded-[36px] border-[4px] border-[#cfa85d]/75 bg-radial from-sky-500/22 via-stone-950/72 to-stone-950/94 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.92)] transition-transform md:col-span-9 ${
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
            src="/hs-assets/ui/hs_thebox_glowring.webp"
            alt=""
            className="pointer-events-none absolute h-[440px] w-[440px] animate-[hsSlowSpin_38s_linear_infinite] rounded-full object-contain opacity-45 mix-blend-screen"
          />
          <img
            src="/hs-assets/ui/hs_godrays1.webp"
            alt=""
            className="pointer-events-none absolute h-[460px] w-[460px] animate-[hsSlowSpin_44s_linear_infinite] object-contain opacity-28 mix-blend-screen"
          />

          {/* Pack Explosion Shockwave Flash */}
          {burstFlash && (
            <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
              <div className="h-64 w-64 animate-[hsFlipBurstRing_0.52s_ease-out_forwards] rounded-full border-[8px] border-amber-200 bg-sky-300/45 shadow-[0_0_120px_50px_rgba(125,211,252,0.95)]" />
            </div>
          )}

          {!openedCards ? (
            /* Idle / Cracking Pack on Rune Socket */
            <div
              onClick={triggerOpenPack}
              className={`relative z-20 flex cursor-pointer flex-col items-center justify-center rounded-full border-[4px] p-10 transition-all ${
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
                  src="/hs-assets/ui/classic_pack.webp"
                  alt="제단 카드 팩"
                  className={`h-44 w-32 object-contain transition ${
                    profile.packs > 0
                      ? 'opacity-98 drop-shadow-[0_18px_28px_rgba(0,0,0,0.92)]'
                      : 'opacity-25 grayscale'
                  } ${packBursting ? 'brightness-150 saturate-150' : ''}`}
                />
              </div>
              <span className="hs-title hs-outline-sm mt-3 text-lg font-extrabold text-sky-200">
                {packBursting
                  ? '비전 봉인 폭발 중!!'
                  : profile.packs > 0
                    ? '클릭하여 오리지널 팩 개봉'
                    : '개봉할 카드 팩이 없습니다'}
              </span>
            </div>
          ) : (
            /* ==================== 5-CARD FLOATING PENTAGON + 3D FLIP STAGE ==================== */
            <div className="relative z-20 flex h-full w-full flex-col items-center justify-between">
              {/* Top Floating Action Control (`5장 한 번에 뒤집기` -> `확인 완료`) */}
              <div className="relative z-50 flex items-center gap-3">
                {!allRevealed ? (
                  <button
                    type="button"
                    onClick={revealAll}
                    className="hs-arcane-btn rounded-xl px-5 py-2 text-xs font-extrabold tracking-wide text-white shadow-[0_8px_24px_rgba(2,132,199,0.75)] sm:text-sm"
                  >
                    5장 한 번에 뒤집기 (스페이스바)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={finishPackSession}
                    className="hs-brass-btn rounded-2xl border-yellow-200 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-800 px-9 py-2 text-base font-black text-stone-950 shadow-[0_0_28px_rgba(250,204,21,0.9)]"
                  >
                    확인 완료 (스페이스바)
                  </button>
                )}
              </div>

              {/* Desktop 5-Point Pentagon Radial Stage + Mobile Responsive Fallback */}
              <div className="relative my-auto flex min-h-[470px] w-full items-center justify-center">
                <div className="flex flex-wrap items-center justify-center gap-4 md:block md:h-[470px] md:w-[760px]">
                  {openedCards.map((item, idx) => {
                    const isUp = revealed[idx];
                    const isFlippingNow = flippingActive[idx];
                    const isHovered = hoveredIdx === idx;
                    const slot = PENTAGON_SLOTS[idx] || PENTAGON_SLOTS[0];
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
                              ? `translate3d(${isDesktopStage ? slot.dx : 0}px, ${isDesktopStage ? slot.dy : 0}px, 0) scale(1)`
                              : 'translate3d(0px, 0px, 0) scale(0.16) rotate(-16deg)',
                          opacity: cardsSweepingOut ? 0 : 1,
                        }}
                        className={`relative md:absolute md:left-1/2 md:top-1/2 md:-ml-[82px] md:-mt-[124px] ${
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
                          onClick={() => revealCardAt(idx)}
                          style={
                            {
                              '--base-tilt': isHovered ? '0deg' : slot.tilt,
                              animation: `hsPackCardFloat ${slot.floatDur} ease-in-out ${slot.floatDelay} infinite`,
                            } as React.CSSProperties
                          }
                          className={`relative h-[248px] w-[164px] ${
                            !isUp ? 'cursor-pointer' : 'cursor-default'
                          }`}
                        >
                          {/* Breathing Ground Levitation Shadow Under Card */}
                          <div
                            className={`pointer-events-none absolute -bottom-4 left-1/2 h-4 w-28 -translate-x-1/2 rounded-full bg-black/75 blur-md transition-all duration-300 ${
                              isHovered ? 'scale-115 opacity-90' : 'opacity-65'
                            }`}
                          />

                          {/* Flip Moment Expanding Rarity Shockwave Ring */}
                          {isFlippingNow && (
                            <div
                              className={`pointer-events-none absolute left-1/2 top-1/2 z-50 h-40 w-40 -translate-x-1/2 -translate-y-1/2 animate-[hsFlipBurstRing_0.64s_ease-out_forwards] rounded-full border-[5px] ${
                                FLIP_RING_COLOR[item.card.rarity]
                              }`}
                            />
                          )}

                          {/* Persistent Rotating Godrays Behind Revealed Epic / Legendary Cards */}
                          {isUp && isHighTier && (
                            <img
                              src="/hs-assets/ui/hs_godrays1.webp"
                              alt=""
                              className="pointer-events-none absolute -inset-8 z-0 h-[calc(100%+64px)] w-[calc(100%+64px)] animate-[hsSlowSpin_18s_linear_infinite] object-contain opacity-75 mix-blend-screen"
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
                              !isUp && isHovered ? '-translate-y-2.5 scale-108' : ''
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
                                className="absolute inset-0 overflow-hidden rounded-[16px] border-2 border-[#e2c27c]/85 bg-stone-950 transition-shadow duration-200"
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
                                <div className="origin-center scale-[0.91]">
                                  <HearthstoneCard
                                    card={item.card}
                                    isGolden={item.isGolden}
                                    rarityAura={item.card.rarity}
                                    size="MD"
                                  />
                                </div>

                                {item.isNew && (
                                  <span className="hs-outline-sm pointer-events-none absolute right-0 top-1 z-40 rounded-md border border-yellow-200 bg-gradient-to-b from-amber-400 to-amber-700 px-2 py-0.5 text-[10px] font-black text-white shadow-lg">
                                    신규!
                                  </span>
                                )}
                                {item.isGolden && (
                                  <span className="hs-outline-sm pointer-events-none absolute -bottom-1 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md border border-yellow-200 bg-gradient-to-b from-yellow-400 to-amber-700 px-2 py-0.5 text-[9.5px] font-black text-white shadow">
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

      <footer className="relative z-30 text-center text-[11px] font-semibold text-amber-200/75">
        공중에 떠 있는 카드에 마우스를 올리면 등급별 광채(희귀: 사파이어 · 특급: 자수정 · 전설: 태양빛)가 깨어나며, 클릭 또는 스페이스바로 입체 회전 개봉됩니다
      </footer>
    </div>
  );
};
