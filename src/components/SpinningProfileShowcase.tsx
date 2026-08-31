import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Swords,
  RotateCw,
  Play,
  Pause,
  ArrowLeftRight,
  Sparkles,
  Zap,
  Shield,
  Heart,
  Flame,
  Shuffle,
  Award,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { calculateBattleSynergy } from '../lib/battleSynergy';
import type { CardData, Language } from '../types';

interface SpinningProfileShowcaseProps {
  playerCard: CardData | null;
  opponentCard: CardData | null;
  playerName?: string;
  opponentName?: string;
  playerAvatarUrl?: string;
  opponentAvatarUrl?: string;
  playerDeck: CardData[];
  onReorderDeck: (newDeck: CardData[]) => void;
  language: Language;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  className?: string;
}

const FACTION_ICONS: Record<string, string> = {
  fire: '🔥',
  water: '💧',
  wind: '🌪️',
  earth: '⛰️',
  human: '👤',
  undead: '💀',
  elf: '🧝',
  dwarf: '🔨',
  monster: '👹',
  robot: '🤖',
  dragon: '🐉',
};

const RARITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  legendary: { bg: 'bg-fuchsia-950/40', text: 'text-fuchsia-300', border: 'border-fuchsia-500/40' },
  gold: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-500/40' },
  silver: { bg: 'bg-slate-900/60', text: 'text-slate-200', border: 'border-slate-400/40' },
  magic: { bg: 'bg-indigo-950/40', text: 'text-indigo-300', border: 'border-indigo-500/40' },
  bronze: { bg: 'bg-stone-900/60', text: 'text-stone-300', border: 'border-stone-500/30' },
};

export const SpinningProfileShowcase: React.FC<SpinningProfileShowcaseProps> = ({
  playerCard,
  opponentCard,
  playerName = 'HERO',
  opponentName = 'OPPONENT',
  playerAvatarUrl,
  opponentAvatarUrl,
  playerDeck,
  onReorderDeck,
  language,
  lowSpecMode = false,
  playSfx,
  className,
}) => {
  const isKo = language === 'ko';

  // Rotation State (Angle in radians)
  const [angle, setAngle] = useState(0);
  const [isRotating, setIsRotating] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(1); // 0.5x, 1x, 2x
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showSynergyDetail, setShowSynergyDetail] = useState(false);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const lastTouchXRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Continuous 3D Orbital Spin Loop
  useEffect(() => {
    if (!isRotating || lowSpecMode) return;

    let lastTime = performance.now();
    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Rotate ~45 degrees per second at 1x speed
      const deltaAngle = (Math.PI / 4) * rotationSpeed * delta;
      setAngle((prev) => (prev + deltaAngle) % (2 * Math.PI));

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRotating, rotationSpeed, lowSpecMode]);

  // Touch / Mouse Drag handlers for manual 3D orbit rotation
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isDraggingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    lastTouchXRef.current = clientX;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diffX = clientX - lastTouchXRef.current;
    lastTouchXRef.current = clientX;

    // Convert pixel drag to angle change
    const deltaAngle = (diffX / 150) * Math.PI;
    setAngle((prev) => (prev + deltaAngle) % (2 * Math.PI));
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // 3D Orbital Positions Calculation
  // Player Card: at angle
  // Opponent Card: at angle + PI (180 deg opposite)
  const orbitRadius = 115; // px horizontal spread

  const playerZ = Math.sin(angle); // -1 (back) to +1 (front)
  const playerX = Math.cos(angle) * orbitRadius;
  const playerScale = 0.86 + 0.22 * ((playerZ + 1) / 2); // 0.86 ~ 1.08
  const playerOpacity = 0.72 + 0.28 * ((playerZ + 1) / 2);
  const playerZIndex = Math.round(50 + playerZ * 40);

  const oppAngle = angle + Math.PI;
  const oppZ = Math.sin(oppAngle);
  const oppX = Math.cos(oppAngle) * orbitRadius;
  const oppScale = 0.86 + 0.22 * ((oppZ + 1) / 2);
  const oppOpacity = 0.72 + 0.28 * ((oppZ + 1) / 2);
  const oppZIndex = Math.round(50 + oppZ * 40);

  // Synergy & Faction Advantage Calculation
  const synergyInfo = useMemo(() => {
    if (!playerCard || !opponentCard) return null;
    return calculateBattleSynergy(playerCard, opponentCard, playerCard.equipment);
  }, [playerCard, opponentCard]);

  // Card Reordering Operations
  const handleSlotClick = (index: number) => {
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    if (selectedSlot === null) {
      setSelectedSlot(index);
    } else if (selectedSlot === index) {
      setSelectedSlot(null);
    } else {
      // Swap selectedSlot with index
      const newDeck = [...playerDeck];
      const temp = newDeck[selectedSlot];
      newDeck[selectedSlot] = newDeck[index];
      newDeck[index] = temp;
      onReorderDeck(newDeck);
      setSelectedSlot(null);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  const handleShiftCard = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= playerDeck.length) return;
    const newDeck = [...playerDeck];
    const temp = newDeck[fromIndex];
    newDeck[fromIndex] = newDeck[toIndex];
    newDeck[toIndex] = temp;
    onReorderDeck(newDeck);
    setSelectedSlot(toIndex);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  const handleSetAsLeader = (index: number) => {
    if (index === 0) return;
    const newDeck = [...playerDeck];
    const targetCard = newDeck.splice(index, 1)[0];
    newDeck.unshift(targetCard);
    onReorderDeck(newDeck);
    setSelectedSlot(0);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handleAutoOptimizeCounter = () => {
    if (!opponentCard || playerDeck.length <= 1) return;
    const oppElement = (opponentCard.element || 'fire').toLowerCase();

    // Advantage map: Countering elements
    const counterMap: Record<string, string[]> = {
      fire: ['water', 'earth'],
      water: ['wind', 'earth'],
      wind: ['fire', 'undead'],
      earth: ['fire', 'wind'],
      human: ['undead', 'monster'],
      undead: ['human', 'robot'],
      elf: ['dragon', 'undead'],
      dwarf: ['robot', 'elf'],
      monster: ['human', 'elf'],
      robot: ['dragon', 'dwarf'],
      dragon: ['water', 'fire'],
    };

    const preferredElements = counterMap[oppElement] || [];

    const sortedDeck = [...playerDeck].sort((a, b) => {
      const aEl = (a.element || '').toLowerCase();
      const bEl = (b.element || '').toLowerCase();
      const aIsCounter = preferredElements.includes(aEl) ? 1 : 0;
      const bIsCounter = preferredElements.includes(bEl) ? 1 : 0;
      if (aIsCounter !== bIsCounter) return bIsCounter - aIsCounter;

      const aPower = (a.atk || 0) + (a.def || 0) + (a.hp || 0) / 5;
      const bPower = (b.atk || 0) + (b.def || 0) + (b.hp || 0) / 5;
      return bPower - aPower;
    });

    onReorderDeck(sortedDeck);
    setSelectedSlot(0);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handleShuffleDeck = () => {
    const shuffled = [...playerDeck].sort(() => Math.random() - 0.5);
    onReorderDeck(shuffled);
    setSelectedSlot(null);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  const activeRarity = ((playerCard?.rarity || 'gold').toLowerCase() as keyof typeof RARITY_COLORS) || 'gold';
  const oppRarity = ((opponentCard?.rarity || 'gold').toLowerCase() as keyof typeof RARITY_COLORS) || 'gold';

  const playerRarityStyle = RARITY_COLORS[activeRarity] || RARITY_COLORS.gold;
  const oppRarityStyle = RARITY_COLORS[oppRarity] || RARITY_COLORS.gold;

  return (
    <div className={cn('w-full max-w-lg flex flex-col items-center gap-4 select-none font-mono', className)}>
      {/* 1. Header & Orbit Control Bar */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-black/60 border border-white/10 rounded-sm text-xs backdrop-blur-md">
        <div className="flex items-center gap-2 text-cyan-400">
          <RotateCw size={14} className={cn(isRotating && !lowSpecMode && 'animate-spin')} />
          <span className="font-black tracking-wider uppercase text-[11px]">
            {isKo ? '3D 프로필 카드 회전 궤도' : '3D DUAL PROFILE ORBIT'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px]">
          {/* Speed Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextSpeed = rotationSpeed === 1 ? 1.5 : rotationSpeed === 1.5 ? 0.6 : 1;
              setRotationSpeed(nextSpeed);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            }}
            className="px-2 py-0.5 border border-white/20 bg-white/5 hover:bg-white/15 text-slate-300 rounded-sm cursor-pointer"
          >
            {rotationSpeed === 1.5 ? '2.0x' : rotationSpeed === 0.6 ? '0.5x' : '1.0x'}
          </button>

          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsRotating(!isRotating);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            }}
            className={cn(
              'px-2 py-0.5 border rounded-sm flex items-center gap-1 cursor-pointer transition-colors',
              isRotating
                ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25'
                : 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
            )}
          >
            {isRotating ? (
              <>
                <Pause size={10} />
                <span>{isKo ? '정지' : 'PAUSE'}</span>
              </>
            ) : (
              <>
                <Play size={10} />
                <span>{isKo ? '회전' : 'SPIN'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Main 3D Revolving Orbital Arena Stage */}
      <div
        className="w-full relative h-72 sm:h-80 flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 border border-white/10 rounded-sm overflow-hidden touch-pan-y perspective-[1000px] cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        {/* Holographic Orbital Rings */}
        <div
          className="absolute w-64 sm:w-72 h-28 border-2 border-dashed border-cyan-500/30 rounded-[100%] pointer-events-none transform -rotate-x-60 -translate-y-2 animate-pulse"
          style={{
            boxShadow: '0 0 35px rgba(6, 182, 212, 0.15), inset 0 0 25px rgba(6, 182, 212, 0.1)',
          }}
        />
        <div className="absolute w-52 h-20 border border-dotted border-rose-500/30 rounded-[100%] pointer-events-none transform -rotate-x-60 -translate-y-2" />

        {/* Center VS Clash Hologram */}
        <div className="absolute z-40 flex flex-col items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 border border-amber-300 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)] transform animate-pulse">
            <Swords size={20} className="text-white drop-shadow" />
          </div>
          <span className="text-[10px] font-black text-amber-300 tracking-widest mt-1 uppercase italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            VS
          </span>
        </div>

        {/* --- 2.A: PLAYER REPRESENTATIVE PROFILE CARD (Orbiting) --- */}
        <div
          className="absolute flex flex-col items-center transition-transform duration-75"
          style={{
            transform: `translate3d(${playerX}px, 0, ${playerZ * 60}px) scale(${playerScale}) rotateY(${Math.cos(angle) * 12}deg)`,
            opacity: playerOpacity,
            zIndex: playerZIndex,
          }}
        >
          {/* Card Label & Name Badge */}
          <div className="mb-1 flex items-center gap-1 bg-cyan-950/80 border border-cyan-500/50 px-2 py-0.5 rounded-sm shadow-md">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[9px] font-black text-cyan-300 uppercase truncate max-w-[90px]">
              {playerName || (isKo ? '내 영웅' : 'MY HERO')}
            </span>
          </div>

          {/* Profile Card Container */}
          <div
            className={cn(
              'w-36 sm:w-40 h-52 sm:h-56 p-2 rounded-sm border-2 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all',
              playerZ > 0
                ? 'border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400/50'
                : 'border-cyan-800/60 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
            )}
          >
            {/* Top Bar: Rarity & Element */}
            <div className="flex justify-between items-center text-[9px] font-bold border-b border-white/10 pb-1">
              <span className={cn('px-1 py-0.2 rounded-sm border uppercase font-black', playerRarityStyle.border, playerRarityStyle.text, playerRarityStyle.bg)}>
                {playerCard?.rarity || 'SSR'}
              </span>
              <span className="flex items-center gap-0.5 text-cyan-300">
                {FACTION_ICONS[(playerCard?.element || 'fire').toLowerCase()] || '⚡'}
                <span className="uppercase">{playerCard?.element || 'FIRE'}</span>
              </span>
            </div>

            {/* Character Sprite Center Stage */}
            <div className="w-full flex-1 my-1 bg-slate-950/70 border border-white/10 rounded-sm relative overflow-hidden flex items-center justify-center group">
              {playerCard ? (
                <div
                  className="w-20 h-20 bg-contain bg-no-repeat bg-center transform transition-transform group-hover:scale-110"
                  style={getCardSpriteStyle(playerCard.imageIndex ?? Number(playerCard.id) ?? 0)}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400">
                  <Zap size={24} />
                </div>
              )}

              {/* Slot #1 Leader Indicator */}
              <div className="absolute top-1 left-1 bg-cyan-500 text-slate-950 font-black text-[8px] px-1 py-0.2 rounded-sm">
                #1 {isKo ? '선발' : 'LEADER'}
              </div>
            </div>

            {/* Bottom: Card Name & Stats */}
            <div className="space-y-1">
              <div className="text-[10px] font-black text-white truncate text-center">
                {playerCard?.name || (isKo ? '출전 카드' : 'Deploy Card')}
              </div>
              <div className="grid grid-cols-3 gap-0.5 text-[8px] font-bold text-center bg-black/50 p-1 border border-white/10 rounded-sm">
                <div className="text-rose-300">
                  <span className="opacity-60 text-[7px]">ATK</span> {playerCard?.atk || playerCard?.power || 120}
                </div>
                <div className="text-blue-300">
                  <span className="opacity-60 text-[7px]">DEF</span> {playerCard?.def || 90}
                </div>
                <div className="text-emerald-300">
                  <span className="opacity-60 text-[7px]">HP</span> {playerCard?.hp || 450}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- 2.B: OPPONENT REPRESENTATIVE PROFILE CARD (Orbiting) --- */}
        <div
          className="absolute flex flex-col items-center transition-transform duration-75"
          style={{
            transform: `translate3d(${oppX}px, 0, ${oppZ * 60}px) scale(${oppScale}) rotateY(${Math.cos(oppAngle) * 12}deg)`,
            opacity: oppOpacity,
            zIndex: oppZIndex,
          }}
        >
          {/* Card Label & Name Badge */}
          <div className="mb-1 flex items-center gap-1 bg-rose-950/80 border border-rose-500/50 px-2 py-0.5 rounded-sm shadow-md">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            <span className="text-[9px] font-black text-rose-300 uppercase truncate max-w-[90px]">
              {opponentName || (isKo ? '상대' : 'OPPONENT')}
            </span>
          </div>

          {/* Profile Card Container */}
          <div
            className={cn(
              'w-36 sm:w-40 h-52 sm:h-56 p-2 rounded-sm border-2 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all',
              oppZ > 0
                ? 'border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.4)] ring-1 ring-rose-500/50'
                : 'border-rose-900/60 shadow-[0_0_10px_rgba(244,63,94,0.15)]'
            )}
          >
            {/* Top Bar: Rarity & Element */}
            <div className="flex justify-between items-center text-[9px] font-bold border-b border-white/10 pb-1">
              <span className={cn('px-1 py-0.2 rounded-sm border uppercase font-black', oppRarityStyle.border, oppRarityStyle.text, oppRarityStyle.bg)}>
                {opponentCard?.rarity || 'SSR'}
              </span>
              <span className="flex items-center gap-0.5 text-rose-300">
                {FACTION_ICONS[(opponentCard?.element || 'fire').toLowerCase()] || '⚡'}
                <span className="uppercase">{opponentCard?.element || 'FIRE'}</span>
              </span>
            </div>

            {/* Character Sprite Center Stage */}
            <div className="w-full flex-1 my-1 bg-slate-950/70 border border-white/10 rounded-sm relative overflow-hidden flex items-center justify-center group">
              {opponentCard ? (
                <div
                  className="w-20 h-20 bg-contain bg-no-repeat bg-center transform transition-transform group-hover:scale-110"
                  style={getCardSpriteStyle(opponentCard.imageIndex ?? Number(opponentCard.id) ?? 22)}
                />
              ) : opponentAvatarUrl ? (
                <img
                  src={opponentAvatarUrl}
                  alt="Opponent"
                  className="w-18 h-18 object-cover pixelated rounded-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-rose-900/30 flex items-center justify-center text-rose-400">
                  <Shield size={24} />
                </div>
              )}

              {/* Slot #1 Opponent Target Indicator */}
              <div className="absolute top-1 right-1 bg-rose-600 text-white font-black text-[8px] px-1 py-0.2 rounded-sm">
                #1 {isKo ? '상대선발' : 'TARGET'}
              </div>
            </div>

            {/* Bottom: Card Name & Stats */}
            <div className="space-y-1">
              <div className="text-[10px] font-black text-white truncate text-center">
                {opponentCard?.name || opponentName || (isKo ? '상대 카드' : 'Opponent Card')}
              </div>
              <div className="grid grid-cols-3 gap-0.5 text-[8px] font-bold text-center bg-black/50 p-1 border border-white/10 rounded-sm">
                <div className="text-rose-300">
                  <span className="opacity-60 text-[7px]">ATK</span> {opponentCard?.atk || opponentCard?.power || 115}
                </div>
                <div className="text-blue-300">
                  <span className="opacity-60 text-[7px]">DEF</span> {opponentCard?.def || 85}
                </div>
                <div className="text-emerald-300">
                  <span className="opacity-60 text-[7px]">HP</span> {opponentCard?.hp || 420}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drag Interaction Hint Overlay */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] text-white/50 tracking-tight font-semibold bg-black/60 px-2.5 py-0.5 rounded-full border border-white/5 pointer-events-none whitespace-nowrap">
          {isKo ? '↔ 좌우로 드래그하여 3D 궤도를 수동으로 회전할 수 있습니다' : '↔ Drag to rotate 3D orbital perspective'}
        </div>
      </div>

      {/* 3. Live Faction Advantage & Synergy Badge */}
      {synergyInfo && (
        <div
          onClick={() => setShowSynergyDetail(!showSynergyDetail)}
          className={cn(
            'w-full p-2.5 rounded-sm border flex items-center justify-between text-xs cursor-pointer transition-colors',
            synergyInfo.factionAdvantage === 'advantage'
              ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/40'
              : synergyInfo.factionAdvantage === 'disadvantage'
              ? 'border-rose-500/40 bg-rose-950/30 text-rose-300 hover:bg-rose-950/40'
              : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-900/70'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {synergyInfo.factionAdvantage === 'advantage'
                ? '⚡'
                : synergyInfo.factionAdvantage === 'disadvantage'
                ? '⚠️'
                : '⚖️'}
            </span>
            <div className="flex flex-col text-left">
              <div className="font-black text-[11px] uppercase">
                {isKo ? '선발 대표 상성 예측' : 'Leader Matchup Synergies'}:{' '}
                {synergyInfo.factionAdvantage === 'advantage'
                  ? isKo
                    ? '유리한 상성 (Advantage)'
                    : 'Advantage'
                  : synergyInfo.factionAdvantage === 'disadvantage'
                  ? isKo
                    ? '불리한 상성 (Disadvantage)'
                    : 'Disadvantage'
                  : isKo
                  ? '동등한 상성 (Neutral)'
                  : 'Neutral'}
              </div>
              <div className="text-[9px] opacity-80">
                {isKo
                  ? `데미지 배율 x${synergyInfo.factionMultiplier.toFixed(2)}배 적용`
                  : `Damage multiplier x${synergyInfo.factionMultiplier.toFixed(2)}`}
              </div>
            </div>
          </div>

          <span className="text-[10px] underline opacity-70">
            {showSynergyDetail ? (isKo ? '간략히' : 'Hide') : isKo ? '상세' : 'Details'}
          </span>
        </div>
      )}

      {/* 4. Interactive 5-Slot Card Order Deployment Strip (1~5번 출전 순서 배치 바) */}
      <div className="w-full flex flex-col gap-2 p-3 bg-black/70 border border-white/10 rounded-sm">
        <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-black uppercase tracking-wider">
            <ArrowLeftRight size={13} />
            <span>{isKo ? '출전 순서 배치 (1~5번 슬롯)' : 'DEPLOYMENT CARD ORDER (1-5)'}</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Auto Optimize Button */}
            <button
              type="button"
              onClick={handleAutoOptimizeCounter}
              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-sm text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <Zap size={11} className="text-amber-400" />
              <span>{isKo ? '상성 최적 정렬' : 'Auto-Counter'}</span>
            </button>

            {/* Shuffle Button */}
            <button
              type="button"
              onClick={handleShuffleDeck}
              className="p-1 bg-white/5 hover:bg-white/15 border border-white/20 text-slate-300 rounded-sm cursor-pointer"
              title={isKo ? '순서 셔플' : 'Shuffle'}
            >
              <Shuffle size={12} />
            </button>
          </div>
        </div>

        {/* Instruction subtext */}
        <p className="text-[10px] text-slate-400 text-left">
          {selectedSlot !== null
            ? isKo
              ? `선택된 #${selectedSlot + 1}번 카드를 다른 슬롯과 맞바꾸거나 대표로 지정하세요.`
              : `Swap #${selectedSlot + 1} with another card or set as leader.`
            : isKo
            ? '카드를 탭하여 순서를 맞바꾸면 1번 카드가 3D 회전 프로필 카드로 자동 지정됩니다.'
            : 'Tap cards to swap order. Slot #1 is your orbiting 3D profile leader.'}
        </p>

        {/* 5-Slot Horizontal Card Grid */}
        <div className="grid grid-cols-5 gap-1.5 w-full pt-1">
          {playerDeck.slice(0, 5).map((card, idx) => {
            const isSelected = selectedSlot === idx;
            const isLeader = idx === 0;

            return (
              <div
                key={card.id || idx}
                onClick={() => handleSlotClick(idx)}
                className={cn(
                  'flex flex-col items-center justify-between p-1.5 border rounded-sm cursor-pointer transition-all relative select-none',
                  isSelected
                    ? 'border-amber-400 bg-amber-500/20 scale-105 shadow-[0_0_12px_rgba(245,158,11,0.5)] z-10'
                    : isLeader
                    ? 'border-cyan-400/80 bg-cyan-950/40 hover:bg-cyan-900/40'
                    : 'border-white/15 bg-slate-900/60 hover:bg-slate-800/80 hover:border-white/30'
                )}
              >
                {/* Slot Number Badge */}
                <div
                  className={cn(
                    'w-full flex items-center justify-between text-[8px] font-black px-1 py-0.2 rounded-xs border mb-1',
                    isLeader
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'bg-black/50 text-slate-300 border-white/10'
                  )}
                >
                  <span>#{idx + 1}</span>
                  {isLeader && <span>⭐</span>}
                </div>

                {/* Card Sprite */}
                <div className="w-11 h-11 bg-slate-950 border border-white/10 rounded-xs flex items-center justify-center overflow-hidden my-0.5">
                  <div
                    className="w-10 h-10 bg-contain bg-no-repeat bg-center"
                    style={getCardSpriteStyle(card.imageIndex ?? Number(card.id) ?? 0)}
                  />
                </div>

                {/* Card Name */}
                <div className="w-full text-center text-[8px] font-bold truncate text-slate-200 mt-0.5">
                  {card.name}
                </div>

                {/* Power / ATK */}
                <div className="text-[7px] font-semibold text-amber-300/90 mt-0.5">
                  {card.atk || card.power || 100}⚡
                </div>

                {/* Shift arrow mini controls on selected card */}
                {isSelected && (
                  <div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/90 border border-amber-400/80 px-1 py-0.5 rounded-sm shadow-xl z-30 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleShiftCard(idx, 'left')}
                      className="p-1 text-amber-300 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    {!isLeader && (
                      <button
                        type="button"
                        onClick={() => handleSetAsLeader(idx)}
                        className="px-1 py-0.2 bg-cyan-500/30 border border-cyan-400 text-cyan-200 text-[8px] font-bold rounded-xs cursor-pointer hover:bg-cyan-500/50"
                      >
                        {isKo ? '선발지정' : 'Set #1'}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={idx === 4}
                      onClick={() => handleShiftCard(idx, 'right')}
                      className="p-1 text-amber-300 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
