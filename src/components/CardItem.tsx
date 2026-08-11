import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star, Zap, ChevronsDown, ChevronsUp, Shield, Mountain, Crosshair, HelpCircle,
  Waves, Flame, Wind, User, Skull, Leaf, Hammer, Ghost, Bot
} from 'lucide-react';
import type { CharacterFaction, CharacterRarityTier, CardData } from '../types';
import { cn, getAssetUrl } from '../lib/utils';
import { CARD_DATABASE } from '../cardDatabase';
import { getCardPower, getCardStatWithBonus } from '../constants';
import { t } from '../lib/i18n';
import { normalizeCardRarity } from '../lib/cardRarity';
import { getCharacterAssetManifestEntry } from '../content/characterAssetManifest';
import { getCharacterIpProfile, getFactionDef, getRarityRule } from '../content/characterIpUtils';
import type { CardSkin } from '../content/cardSkins';
import { getCardSkinByKey } from '../content/cardSkins';
import { getCardSkinThemeVisual } from '../content/cardSkinThemes';
import { resolveCardImage, getCardImageFallback, type ResolvedCardImage } from '../content/cardImageVariants';
import { useGameSettings } from '../contexts/GameSettingsContext';

interface CardItemProps {
  card: CardData;
  className?: string;
  onClick?: () => void;
  isLocked?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  hideBackground?: boolean;
  isOnBoard?: boolean;
  customImage?: string | null;
  combatHighlights?: number[];
  lowSpecMode?: boolean;
  processedImage?: string | null;
  language?: string;
  cellElement?: string | null;
  hideStats?: boolean;
  isMatgo?: boolean;
  ignoreBonuses?: boolean;
  downloadMode?: 'ally' | 'enemy' | null;
  /** 적용된 카드 스킨 */
  activeSkin?: CardSkin | null;
  /** 전투 대미지/피격 상태 여부 (쉐이크 및 레드 플래시 애니메이션) */
  isDamaged?: boolean;
}

const areNumberArraysEqual = (left?: number[], right?: number[]) => {
  if (left === right) return true;
  if (!left || !right || left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
};

const isSpriteSheet = (source?: string | null): boolean => {
  if (!source) return false;
  return source.includes('card100') || source.includes('110card');
};

const getSpritePosition = (cardIndex: number, spriteSource: string): React.CSSProperties => {
  if (!cardIndex) return {};
  const rows = 11;
  const cols = 10;
  const x = ((cardIndex - 1) % cols) * (100 / (cols - 1));
  const y = Math.floor((cardIndex - 1) / cols) * (100 / (rows - 1));
  return {
    backgroundImage: `url('${getAssetUrl(spriteSource)}')`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated' as const,
  };
};

const areCardsVisuallyEqual = (left: CardData, right: CardData) => {
  if (left === right) return true;
  return (
    left.id === right.id &&
    left.owner === right.owner &&
    left.level === right.level &&
    left.power === right.power &&
    left.rarity === right.rarity &&
    left.element === right.element &&
    left.imageIndex === right.imageIndex &&
    left.imageUrl === right.imageUrl &&
    left.title === right.title &&
    left.title_en === right.title_en &&
    left.title_dis === right.title_dis &&
    left.isMidBoss === right.isMidBoss &&
    left.isFinalBoss === right.isFinalBoss &&
    left.ability?.type === right.ability?.type &&
    areNumberArraysEqual(left.stats, right.stats) &&
    left.skills === right.skills &&
    left.equipment === right.equipment
  );
};

const isCharacterRarityTier = (value: string): value is CharacterRarityTier =>
  value === 'bronze' || value === 'silver' || value === 'gold' || value === 'platinum' || value === 'diamond' || value === 'legendary';

const getDisplayCardName = (card: CardData, language: string): string => {
  if (language === 'ko') {
    return card.title || card.title_dis || card.title_en || '';
  }

  return card.title_en || card.title_dis || card.title || '';
};

const getVisualCardId = (card: CardData): number | undefined => {
  if (typeof card.imageIndex === 'number' && Number.isFinite(card.imageIndex)) {
    return card.imageIndex;
  }

  const parsedId = Number(card.id);
  return Number.isFinite(parsedId) ? parsedId : undefined;
};

const getFactionIcon = (faction?: CharacterFaction) => {
  switch (faction) {
    case 'water':
      return Waves;
    case 'fire':
      return Flame;
    case 'wind':
      return Wind;
    case 'earth':
      return Mountain;
    case 'human':
      return User;
    case 'undead':
      return Skull;
    case 'elf':
      return Leaf;
    case 'dwarf':
      return Hammer;
    case 'monster':
      return Ghost;
    case 'robot':
      return Bot;
    case 'dragon':
      return Zap;
    default:
      return Shield;
  }
};

export const CardItem = React.memo(({ card, className, onClick, isLocked, isSelected, isDragging, hideBackground, isOnBoard, customImage, combatHighlights, lowSpecMode, processedImage, language = 'en',cellElement, hideStats, isMatgo, ignoreBonuses, downloadMode, activeSkin, isDamaged }: CardItemProps) => {
  const { cardSkinTheme } = useGameSettings();
  // Use the card directly so we don't overwrite in-game state modifications (like WEAKEN/REINFORCE)
  const activeCard = card;
  const isIOSDevice = useMemo(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);

  const performanceMode = lowSpecMode || isOnBoard || isIOSDevice;
  const shouldHideBg = hideBackground || !!downloadMode;
  
  const [isFlipping, setIsFlipping] = useState(false);
  const prevOwnerRef = useRef(activeCard.owner);

  useEffect(() => {
    if (prevOwnerRef.current !== undefined && prevOwnerRef.current !== null && prevOwnerRef.current !== activeCard.owner) {
      setIsFlipping(true);
      const timer = setTimeout(() => setIsFlipping(false), 500);
      return () => clearTimeout(timer);
    }
    prevOwnerRef.current = activeCard.owner;
  }, [activeCard.owner]);

  const visualCardId = useMemo(() => getVisualCardId(activeCard), [activeCard]);
  const ipProfile = useMemo(() => (
    visualCardId ? getCharacterIpProfile(visualCardId) : undefined
  ), [visualCardId]);
  const rarityTier = useMemo(() => {
    if (ipProfile?.rarityTier) return ipProfile.rarityTier;
    return isCharacterRarityTier(activeCard.rarity) ? activeCard.rarity : 'bronze';
  }, [activeCard.rarity, ipProfile]);
  const normalizedCardRarity = useMemo(() => normalizeCardRarity(activeCard.rarity) ?? rarityTier, [activeCard.rarity, rarityTier]);
  const rarityRule = useMemo(() => getRarityRule(rarityTier), [rarityTier]);
  const factionDef = useMemo(() => (
    ipProfile ? getFactionDef(ipProfile.faction) : undefined
  ), [ipProfile]);
  const assetManifestEntry = useMemo(() => (
    visualCardId ? getCharacterAssetManifestEntry(visualCardId) : undefined
  ), [visualCardId]);
  const displayCardName = useMemo(
    () => getDisplayCardName(activeCard, language),
    [activeCard, language]
  );
  const themeVisual = useMemo(
    () => (visualCardId ? getCardSkinThemeVisual(cardSkinTheme, visualCardId) : null),
    [cardSkinTheme, visualCardId]
  );
  const isOriginalMechaTheme = themeVisual?.themeId === 'original_mecha';
  const factionIcon = useMemo(() => getFactionIcon(ipProfile?.faction), [ipProfile?.faction]);
  const FactionIcon = factionIcon;
  const hasPremiumMotion = !performanceMode && (ipProfile?.animationProfile.animationIntensity ?? 0) > 0;
  const originalPower = activeCard.imageIndex !== undefined ? CARD_DATABASE[activeCard.imageIndex]?.power || 0 : activeCard.power;
  const powerScore = ignoreBonuses ? originalPower : getCardPower(activeCard);

  const imageSources = useMemo(() => {
    const orderedSources = [
      processedImage,
      customImage,
      activeCard.imageUrl,
      assetManifestEntry?.targetAssetPath,
      assetManifestEntry?.legacySpritePath,
      assetManifestEntry?.fallbackAssetPath,
      assetManifestEntry?.lowSpecFallbackAssetPath,
    ];

    return Array.from(new Set(orderedSources.filter((source): source is string => Boolean(source)).map((src) => getAssetUrl(src))));
  }, [activeCard.imageUrl, assetManifestEntry, customImage, processedImage]);
  const [imageSourceIndex, setImageSourceIndex] = useState(0);

  useEffect(() => {
    setImageSourceIndex(0);
  }, [imageSources]);

  const currentImageSource = imageSources[imageSourceIndex];

  // Resolve active skin: explicit prop takes priority, fall back to card.activeSkinKey
  const resolvedSkin: CardSkin | undefined = useMemo(() => {
    if (activeSkin) return activeSkin;
    if (activeCard.activeSkinKey) return getCardSkinByKey(activeCard.activeSkinKey);
    return undefined;
  }, [activeSkin, activeCard.activeSkinKey]);

  // ── Card Image Variant Resolution (priority: custom > variant > theme > default) ──
  const resolvedImage: ResolvedCardImage = useMemo(
    () =>
      resolveCardImage(visualCardId ?? (Number(activeCard.id) || 0), {
        customImage,
        processedImage,
        activeSkin: resolvedSkin ?? null,
        cardSkinTheme,
        imageUrl: activeCard.imageUrl,
      }),
    [visualCardId, activeCard.id, customImage, processedImage, resolvedSkin, cardSkinTheme, activeCard.imageUrl],
  );

  // Variant-aware image fallback for the no-image placeholder state
  const imageFallback = useMemo(
    () => (visualCardId ? getCardImageFallback(visualCardId) : resolvedImage.fallback),
    [visualCardId, resolvedImage.fallback],
  );

  const statChanges = useMemo(() => {
    return activeCard.stats.map((baseVal, i) => {
      const total = ignoreBonuses ? baseVal : getCardStatWithBonus(activeCard, i, cellElement);
      let skillBonus = 0;
      if (!ignoreBonuses && activeCard.skills) {
        const skillType = `stat_${i}`;
        skillBonus = activeCard.skills
          .filter((s) => s.effect.type === skillType)
          .reduce((sum, s) => sum + Math.floor(s.level / 5) * s.effect.value, 0);
      }

      const equipBonus = ignoreBonuses ? 0 : total - baseVal - skillBonus;

      return {
        total,
        skillBonus,
        equipBonus,
        base: baseVal,
        isModified: !ignoreBonuses && total !== baseVal,
      };
    });
  }, [activeCard, cellElement, ignoreBonuses]);

  const race = useMemo(() => {
    if (activeCard.race) return activeCard.race.toLowerCase();
    const titleEn = activeCard.title_en || '';
    if (titleEn.startsWith('Water')) return 'water';
    if (titleEn.startsWith('Fire')) return 'fire';
    if (titleEn.startsWith('Wind')) return 'wind';
    if (titleEn.startsWith('Land')) return 'land';
    if (titleEn.startsWith('Human')) return 'human';
    if (titleEn.startsWith('Undead')) return 'undead';
    if (titleEn.startsWith('Elf')) return 'elf';
    if (titleEn.startsWith('Dwarf')) return 'dwarf';
    if (titleEn.startsWith('Monster')) return 'monster';
    if (titleEn.startsWith('Robot')) return 'robot';
    if (titleEn.startsWith('Dragon')) return 'dragon';
    return null;
  }, [activeCard.race, activeCard.title_en]);

  const cardBgStyle = useMemo(() => {
    if (isOnBoard && !isMatgo) {
      const isPlayer = activeCard.owner === 'player';
      return { 
        background: isPlayer 
          ? 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)'
          : 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)'
      };
    }
    
    if (powerScore <= 0) return { background: '#ffffff' };

    // Updated Race to Color Mapping
    const raceColors: Record<string, string> = {
      water: '#3b82f6',   // Blue
      fire: '#ef4444',    // Red
      wind: '#0ea5e9',    // Sky Blue
      land: '#92400e',    // Earth/Brown
      human: '#ffcc99',   // Skin Tone (Peach)
      undead: '#111827',  // Black/Dark Gray
      elf: '#4ade80',     // Light Green
      dwarf: '#1e3a8a',   // Navy (Blue-900)
      monster: '#a855f7', // Purple
      robot: '#9ca3af',   // Light Gray
      dragon: '#eab308',  // Yellow
    };

    const baseColor = raceColors[race || ''] || '#cbd5e1'; // Fallback to Slate
    
    // Solid color mixing (removing transparency)
    const mixWithWhite = (hex: string, weight: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const nr = Math.floor(r * weight + 255 * (1 - weight));
      const ng = Math.floor(g * weight + 255 * (1 - weight));
      const nb = Math.floor(b * weight + 255 * (1 - weight));
      return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
    };

    const rarityFloor = rarityRule?.backgroundDensity === 'epic'
      ? 0.50
      : rarityRule?.backgroundDensity === 'rich'
        ? 0.45
        : rarityRule?.backgroundDensity === 'moderate'
          ? 0.40
          : 0.35;
    const endIntensity = Math.min(0.65, Math.max(rarityFloor, powerScore / 35));
    const startIntensity = Math.max(rarityFloor - 0.1, endIntensity - 0.1); // Only 10% difference for subtle effect
    
    const startColor = mixWithWhite(baseColor, startIntensity);
    const endColor = mixWithWhite(baseColor, endIntensity);
    
    return { 
      background: `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`
    };
  }, [powerScore, race, activeCard.owner, isOnBoard, rarityRule?.backgroundDensity]);

  const diamondStyle = useMemo(() => {
    if (isOnBoard && !isMatgo) {
      const isPlayer = activeCard.owner === 'player';
      return {
        background: isPlayer ? '#3b82f6' : '#ef4444',
        borderColor: isPlayer ? '#2563eb' : '#dc2626',
        borderWidth: '2px',
        shadow: 'none',
      };
    }

    switch (rarityTier) {
      case 'diamond':
        return {
          background: 'linear-gradient(135deg, rgba(224,231,255,0.96) 0%, rgba(125,211,252,0.92) 35%, rgba(244,114,182,0.88) 100%)',
          borderColor: 'rgba(255,255,255,0.92)',
          borderWidth: '3px',
          shadow: '0 0 20px rgba(125,211,252,0.45)',
        };
      case 'platinum':
        return {
          background: 'linear-gradient(135deg, rgba(226,232,240,0.97) 0%, rgba(148,163,184,0.94) 55%, rgba(14,165,233,0.88) 100%)',
          borderColor: 'rgba(226,232,240,0.95)',
          borderWidth: '3px',
          shadow: '0 0 16px rgba(148,163,184,0.4)',
        };
      case 'silver':
        return {
          background: 'linear-gradient(135deg, rgba(241,245,249,0.96) 0%, rgba(100,116,139,0.92) 100%)',
          borderColor: 'rgba(226,232,240,0.9)',
          borderWidth: '2px',
          shadow: '0 0 10px rgba(226,232,240,0.35)',
        };
      case 'gold':
        return {
          background: 'linear-gradient(135deg, rgba(253,224,71,0.98) 0%, rgba(180,83,9,0.95) 100%)',
          borderColor: 'rgba(251,191,36,0.95)',
          borderWidth: '3px',
          shadow: '0 0 14px rgba(251,191,36,0.45)',
        };
      case 'legendary':
        return {
          background: 'linear-gradient(135deg, rgba(67,56,202,0.95) 0%, rgba(168,85,247,0.9) 50%, rgba(15,23,42,0.96) 100%)',
          borderColor: 'rgba(255,255,255,0.6)',
          borderWidth: '3px',
          shadow: '0 0 18px rgba(168,85,247,0.4)',
        };
      case 'bronze':
      default:
        return {
          background: 'linear-gradient(135deg, rgba(194,122,58,0.95) 0%, rgba(92,51,22,0.96) 100%)',
          borderColor: 'rgba(255,237,213,0.5)',
          borderWidth: '2px',
          shadow: '0 0 8px rgba(194,122,58,0.3)',
        };
    }
  }, [activeCard.owner, isMatgo, isOnBoard, rarityTier]);

  const statHalos = [
    !ignoreBonuses && statChanges[0].skillBonus > 0,
    !ignoreBonuses && statChanges[1].skillBonus > 0,
    !ignoreBonuses && statChanges[2].skillBonus > 0,
    !ignoreBonuses && statChanges[3].skillBonus > 0,
  ];

  const hasPowerHalo = !ignoreBonuses && (card.skills?.find(skill => skill.id === 'power_boost')?.level || 0) > 0;
  const modifiedStats = statChanges.map(s => s.total);
  const statDirections = ['N', 'E', 'S', 'W'];

  const getStatTextClass = (index: number) => {
    if (cellElement && activeCard.element === cellElement) return "text-emerald-700";
    if (cellElement && activeCard.element && activeCard.element !== cellElement) return "text-rose-700";
    if (statChanges[index].equipBonus > 0) return "text-blue-700";
    if (statChanges[index].equipBonus < 0) return "text-rose-700";
    if (statHalos[index] && !isOnBoard) return "text-yellow-950";
    return "text-slate-950";
  };

  const renderStatBadge = (index: number, positionClass: string) => (
    <div
      className={cn(
        "absolute z-40 flex h-[20cqw] w-[20cqw] items-center justify-center rounded-lg border-[0.7cqw] border-slate-950/70 bg-white/95 font-sans shadow-[0_2px_8px_rgba(0,0,0,0.25)] ring-[0.8cqw] ring-slate-950/20",
        !performanceMode && "transition-all duration-300",
        positionClass,
        isOnBoard && "bg-white/85 ring-slate-950/25 shadow-[0_1px_5px_rgba(0,0,0,0.25)]",
        statHalos[index] && !isOnBoard && "border-yellow-500/80 bg-gradient-to-br from-yellow-300/90 to-yellow-500/90 ring-yellow-100/70 shadow-[0_0_12px_rgba(250,204,21,0.5)]",
        combatHighlights?.includes(index) && "scale-[1.55] border-red-500 bg-amber-400 text-red-700 ring-red-300/80 shadow-[0_0_16px_rgba(239,68,68,0.7)] z-[100]"
      )}
      title={`${statDirections[index]} ${statChanges[index].total}`}
    >
      <span className={cn(
        "absolute left-[2.2cqw] top-[1.8cqw] text-[4.5cqw] font-black leading-none tracking-normal",
        statHalos[index] && !isOnBoard ? "text-yellow-900/60" : "text-slate-500/60",
        combatHighlights?.includes(index) && "text-red-800/70"
      )}>
        {statDirections[index]}
      </span>
      <span className={cn(
        "relative z-10 text-[12cqw] font-mono font-black leading-none tabular-nums tracking-tight subpixel-antialiased drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]",
        getStatTextClass(index),
        combatHighlights?.includes(index) && "text-red-700"
      )}>
        {statChanges[index].total}
      </span>
    </div>
  );

  return (
    <motion.div
      animate={isFlipping ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={(!isLocked && !performanceMode) ? { scale: 1.03 } : {}}
      whileTap={(!isLocked && !performanceMode) ? { scale: 0.97 } : {}}
      className={cn(
        "group/card group @container relative flex flex-col items-center justify-center font-sans select-none",
        (isDamaged || isFlipping) && "animate-damage-shake",
        !className?.includes('w-') && !className?.includes('h-') && "w-20 h-28 sm:w-24 sm:h-32 md:w-32 md:h-44",
        !className?.includes('rounded-') && "rounded-xl",
        (!isLocked || onClick) && "cursor-pointer hover:ring-1 hover:ring-indigo-500/50",
        className
      )}
      onClick={onClick}
    >
      {/* Base Background Layer - Placed here to be above the halo (z-[-1]) but below other content */}
      <div 
        className="absolute inset-0 z-0 rounded-[inherit] transition-colors duration-300"
        style={!shouldHideBg ? cardBgStyle : { background: '#ffffff' }}
      />

      {/* Rainbow colors for Age - Disabled on board for readability */}
      {(activeCard.power || 0) >= 8 && !performanceMode && !shouldHideBg && (
        <div
          className="absolute inset-0 z-[25] pointer-events-none bg-[linear-gradient(135deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0)_100%)] mix-blend-overlay rounded-[inherit]"
        />
      )}
      <div 
        style={{ 
          borderColor: diamondStyle.borderColor, 
          borderWidth: diamondStyle.borderWidth,
          boxShadow: diamondStyle.shadow
        }}
        className={cn(
          "absolute inset-0 z-20 pointer-events-none rounded-[inherit] overflow-hidden border-solid",
          !performanceMode && "transition-all duration-300",
          isOnBoard && "border-white/50 border-[2px] shadow-none"
        )}
      >
        {!shouldHideBg && !isOnBoard && (() => {
          if (normalizedCardRarity === 'diamond') {
            return (
              <div className="absolute inset-0 mix-blend-overlay bg-gradient-to-tr from-cyan-300/35 via-white/20 to-fuchsia-300/35" />
            );
          }
          if (normalizedCardRarity === 'platinum' || normalizedCardRarity === 'legendary') {
            return (
              <div className="absolute inset-0 mix-blend-overlay bg-gradient-to-tr from-pink-500/30 via-purple-400/20 to-indigo-500/30" />
            );
          }
          if (normalizedCardRarity === 'gold') {
            return (
              <div className="absolute inset-0 mix-blend-overlay bg-gradient-to-tr from-yellow-300/30 via-amber-200/20 to-orange-300/30" />
            );
          }
          if (normalizedCardRarity === 'silver') {
            return (
              <div className="absolute inset-0 mix-blend-overlay bg-gradient-to-tr from-slate-300/25 via-slate-400/15 to-blue-400/25" />
            );
          }
          return (
            <div className="absolute inset-0 mix-blend-overlay bg-gradient-to-tr from-amber-500/20 via-orange-600/15 to-amber-800/20" />
          );
        })()}
      </div>

      {/* Halo effects restored for skills */}
      {hasPowerHalo && !isOnBoard && (
        <div 
          className="absolute inset-[-10%] z-[-1] bg-yellow-400/40 rounded-[20%] pointer-events-none"
        />
      )}
      
      <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-[22]">
        {statHalos[0] && !isOnBoard && (
          <div 
            className="absolute top-0 left-0 right-0 h-[4cqw] bg-yellow-400/60" 
          />
        )}
        {statHalos[1] && !isOnBoard && (
          <div 
            className="absolute top-0 bottom-0 right-0 w-[4cqw] bg-yellow-400/60" 
          />
        )}
        {statHalos[2] && !isOnBoard && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-[4cqw] bg-yellow-400/60" 
          />
        )}
        {statHalos[3] && !isOnBoard && (
          <div 
            className="absolute top-0 bottom-0 left-0 w-[4cqw] bg-yellow-400/60" 
          />
        )}
      </div>

      {/* Grid Pattern Overlay - Disabled on board for clean solid colors */}
      {!performanceMode && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-multiply z-10 rounded-[inherit] overflow-hidden" />
      )}
      
      {/* Power Score (Top-Left, Diamond) */}
      <div className="absolute top-[4cqw] left-[4cqw] z-30 w-[24cqw] h-[24cqw] flex items-center justify-center">
        <div 
          style={diamondStyle}
          className={cn(
            "absolute inset-0 rotate-45 rounded-[2cqw] border-[0.8cqw] shadow-xl transition-all duration-500",
            isOnBoard && "shadow-none border-white/50"
          )} 
        />
        <span className="relative text-white font-black text-[14cqw] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] z-10 leading-none">
          {powerScore}
        </span>
      </div>
      
      {!isOnBoard && (
        <div className="absolute bottom-[10cqw] left-1/2 z-30 flex max-w-[62%] -translate-x-1/2 flex-col items-center gap-[0.9cqw]">
          <div className="w-full text-center rounded-full border border-white/20 bg-slate-950/90 px-[2.8cqw] py-[0.9cqw] text-[7.1cqw] font-black leading-none tracking-tight text-white shadow-md">
            {displayCardName}
          </div>
          {factionDef && (
            <div
              className={cn(
                "flex items-center justify-center gap-[1cqw] w-full rounded-full border px-[2.1cqw] py-[0.7cqw] text-[4.9cqw] font-black uppercase tracking-[0.18em] shadow-md",
                !performanceMode && "transition-all duration-300",
                rarityTier === 'diamond' && "border-cyan-100/50 bg-slate-950/90 text-cyan-50",
                rarityTier === 'platinum' && "border-sky-100/45 bg-slate-950/90 text-slate-50",
                rarityTier === 'legendary' && "border-violet-200/40 bg-violet-950/90 text-violet-50",
                rarityTier === 'gold' && "border-amber-200/40 bg-amber-950/90 text-amber-50",
                rarityTier === 'silver' && "border-slate-200/50 bg-slate-950/90 text-slate-50",
                rarityTier === 'bronze' && "border-orange-200/30 bg-orange-950/90 text-orange-50",
              )}
              aria-label={`${t(factionDef.nameKey, language)} ${t(`rarity_${rarityTier}`, language)}`}
            >
              <FactionIcon size={8} className="h-[6.5cqw] w-[6.5cqw]" />
              <span className="truncate">{t(factionDef.nameKey, language)}</span>
            </div>
          )}
        </div>
      )}

      <div className="absolute top-[3cqw] right-[3cqw] z-30 flex flex-col items-end gap-1.5">
        {!isOnBoard && factionDef ? (
          <div
            className={cn(
              "flex items-center gap-[1.1cqw] rounded-full border px-[2.2cqw] py-[1.1cqw] shadow-md",
              !performanceMode && "transition-all duration-300",
              rarityTier === 'diamond' && "border-cyan-100/50 bg-slate-950/90 text-cyan-50",
              rarityTier === 'platinum' && "border-sky-100/45 bg-slate-950/90 text-slate-50",
              rarityTier === 'legendary' && "border-violet-200/40 bg-violet-950/90 text-violet-50",
              rarityTier === 'gold' && "border-amber-200/40 bg-amber-950/90 text-amber-50",
              rarityTier === 'silver' && "border-slate-200/50 bg-slate-950/90 text-slate-50",
              rarityTier === 'bronze' && "border-orange-200/30 bg-orange-950/90 text-orange-50",
            )}
            aria-label={t(`rarity_${rarityTier}`, language)}
          >
            <FactionIcon size={8} className="h-[6.2cqw] w-[6.2cqw]" />
            <span className="text-[5.9cqw] font-black uppercase tracking-[0.22em]">{t(`rarity_${rarityTier}`, language)}</span>
          </div>
        ) : race && !isOnBoard && (
          <div className={cn(
            "p-[1.5cqw] rounded-lg border-[0.5cqw] shadow-lg flex items-center justify-center",
            !performanceMode && "transition-all",
            race === 'water' && "bg-blue-500/90 border-blue-200 text-white shadow-blue-500/40",
            race === 'fire' && "bg-red-500/90 border-red-200 text-white shadow-red-500/40",
            race === 'wind' && "bg-emerald-500/90 border-emerald-200 text-white shadow-emerald-500/40",
            race === 'land' && "bg-amber-700/90 border-amber-400 text-white shadow-amber-900/40",
            race === 'human' && "bg-sky-400/90 border-sky-100 text-white shadow-sky-400/40",
            race === 'undead' && "bg-purple-900/90 border-purple-400 text-white shadow-black/60",
            race === 'elf' && "bg-green-600/90 border-green-300 text-white shadow-green-600/40",
            race === 'dwarf' && "bg-zinc-700/90 border-zinc-400 text-white shadow-zinc-800/40",
            race === 'monster' && "bg-orange-600/90 border-orange-300 text-white shadow-orange-600/40",
            race === 'robot' && "bg-slate-500/90 border-slate-300 text-white shadow-slate-600/40",
            race === 'dragon' && "bg-rose-700/90 border-rose-400 text-white shadow-rose-900/40"
          )}>
            {race === 'water' && <Waves size={10} className="w-[10cqw] h-[10cqw]" />}
            {race === 'fire' && <Flame size={10} className="w-[10cqw] h-[10cqw]" />}
            {race === 'wind' && <Wind size={10} className="w-[10cqw] h-[10cqw]" />}
            {race === 'land' && <Mountain size={10} className="w-[10cqw] h-[10cqw]" />}
            {race === 'human' && <User size={10} className="w-[10cqw] h-[10cqw]" />}
            {race === 'undead' && <Skull size={10} className="w-[10cqw] h-[10cqw]" />}
            {race === 'elf' && <Leaf size={10} className="w-[10cqw] h-[10cqw]" />}
            {race === 'dwarf' && <Hammer size={10} className="w-[10cqw] h-[10cqw]" />}
            {race === 'monster' && <Ghost size={10} className="w-[10cqw] h-[10cqw]" />}
            {race === 'robot' && <Bot size={10} className="w-[10cqw] h-[10cqw]" />}
            {race === 'dragon' && <Zap size={10} className="w-[10cqw] h-[10cqw]" />}
          </div>
        )}
      </div>

      <div className="absolute inset-0 z-[26] flex items-center justify-center pointer-events-none rounded-[inherit] overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 rounded-[inherit]",
            !shouldHideBg && !isOnBoard && rarityTier === 'diamond' && "bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.14),transparent_42%),linear-gradient(145deg,rgba(34,211,238,0.22),rgba(59,130,246,0.20),rgba(236,72,153,0.18))]",
            !shouldHideBg && !isOnBoard && rarityTier === 'platinum' && "bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.12),transparent_42%),linear-gradient(145deg,rgba(226,232,240,0.18),rgba(148,163,184,0.18),rgba(14,165,233,0.16))]",
            !shouldHideBg && !isOnBoard && rarityTier === 'legendary' && "bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.10),transparent_42%),linear-gradient(145deg,rgba(79,70,229,0.20),rgba(17,24,39,0.35))]",
            !shouldHideBg && !isOnBoard && rarityTier === 'gold' && "bg-[radial-gradient(circle_at_50%_18%,rgba(255,251,191,0.10),transparent_42%),linear-gradient(145deg,rgba(161,98,7,0.18),rgba(69,26,3,0.35))]",
            !shouldHideBg && !isOnBoard && rarityTier === 'silver' && "bg-[radial-gradient(circle_at_50%_18%,rgba(248,250,252,0.10),transparent_42%),linear-gradient(145deg,rgba(148,163,184,0.15),rgba(15,23,42,0.30))]",
            !shouldHideBg && !isOnBoard && rarityTier === 'bronze' && "bg-[radial-gradient(circle_at_50%_18%,rgba(255,247,237,0.10),transparent_40%),linear-gradient(145deg,rgba(154,83,20,0.15),rgba(69,26,3,0.30))]",
            shouldHideBg && "bg-slate-950/80",
          )}
>
          {!shouldHideBg && !isOnBoard && hasPremiumMotion && (
            <motion.div
              className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.18)_45%,transparent_60%)]"
              animate={{ x: ['-18%', '18%'] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {!shouldHideBg && !isOnBoard && factionDef && (
            <div
              className="absolute inset-0 opacity-25"
              style={{
                background: `radial-gradient(circle at 50% 40%, ${factionDef.primaryColor} 0%, transparent 60%), radial-gradient(circle at 50% 68%, ${factionDef.accentColor} 0%, transparent 52%)`,
              }}
            />
          )}
          {(currentImageSource || resolvedImage.source) ? (
            <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
              {isOriginalMechaTheme && themeVisual && (
                <>
                  {/* Super Robot Wars Cyber Grid & Reactor Glow Background */}
                  <div
                    className="pointer-events-none absolute inset-[5%] rounded-xl border border-cyan-400/40 opacity-90 z-0"
                    style={{
                      background: `radial-gradient(circle at 50% 45%, ${themeVisual.fallbackAccentColor}66 0%, transparent 68%), linear-gradient(160deg, ${themeVisual.fallbackPrimaryColor}44 0%, rgba(15,23,42,0.92) 85%)`,
                      boxShadow: `inset 0 0 24px ${themeVisual.fallbackAccentColor}44, 0 0 28px ${themeVisual.fallbackPrimaryColor}33`,
                    }}
                  />
                  {/* Tactical HUD Corner Markers */}
                  <div className="pointer-events-none absolute top-2 left-2 text-[8cqw] font-mono text-cyan-400/90 font-bold z-20 drop-shadow-sm">
                    [SRW-UNIT]
                  </div>
                  <div className="pointer-events-none absolute top-2 right-2 text-[8cqw] font-mono text-amber-400/90 font-bold z-20 drop-shadow-sm">
                    {themeVisual.serialCode}
                  </div>
                  <div className="pointer-events-none absolute bottom-2 left-2 text-[7cqw] font-mono text-emerald-400/90 font-bold z-20 drop-shadow-sm">
                    MECHA CORE
                  </div>
                  {/* Target Reticle HUD Ring */}
                  {!performanceMode && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0 opacity-40">
                      <div className="w-[70%] h-[70%] rounded-full border border-dashed border-cyan-300 animate-spin" style={{ animationDuration: '25s' }} />
                    </div>
                  )}
                </>
              )}
              {!isSpriteSheet(currentImageSource || resolvedImage.source || '') ? (
                <img
                  src={(currentImageSource || resolvedImage.source) as string}
                  alt={displayCardName}
                  className={cn(
                    "relative z-10 h-full w-full object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.55)] scale-[1.3]",
                    !performanceMode && !isOnBoard && "transition-transform duration-500",
                    !performanceMode && !isOnBoard && "group-hover/card:scale-[1.38]",
                    isOriginalMechaTheme && "filter drop-shadow-[0_0_10px_rgba(56,189,248,0.6)]"
                  )}
                  referrerPolicy="no-referrer"
                  onError={() => {
                    setImageSourceIndex((currentIndex) => {
                      const lastIndex = Math.max(imageSources.length - 1, 0);
                      return currentIndex < lastIndex ? currentIndex + 1 : currentIndex;
                    });
                  }}
                />
              ) : null}
            </div>
          ) : isOriginalMechaTheme && themeVisual ? (
            <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-[1.8cqw] overflow-hidden px-[6cqw] text-center">
              <div
                className="pointer-events-none absolute inset-[9%] rounded-[24%] border border-white/20 opacity-90"
                style={{
                  background: `radial-gradient(circle at 50% 38%, ${themeVisual.fallbackAccentColor}66 0%, transparent 48%), linear-gradient(160deg, ${themeVisual.fallbackPrimaryColor}66 0%, rgba(15,23,42,0.92) 72%)`,
                  boxShadow: `inset 0 0 24px ${themeVisual.fallbackAccentColor}33, 0 0 20px ${themeVisual.fallbackPrimaryColor}22`,
                }}
              />
              {!performanceMode && (
                <motion.div
                  className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(120deg,transparent_25%,rgba(255,255,255,0.18)_45%,transparent_65%)] mix-blend-screen"
                  animate={{ x: ['-30%', '30%'] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <div className="pointer-events-none absolute inset-0 opacity-40" style={{
                backgroundImage: `linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.12) 20%, rgba(15,23,42,0.28) 100%), linear-gradient(0deg, transparent 0%, rgba(255,255,255,0.08) 1px, transparent 1px)`,
                backgroundSize: '100% 100%, 100% 8px',
              }} />
              <div
                className="relative flex aspect-square w-[46%] items-center justify-center rounded-full border border-white/25 text-white shadow-[0_10px_28px_rgba(15,23,42,0.35)]"
                style={{
                  background: `linear-gradient(145deg, ${themeVisual.fallbackPrimaryColor} 0%, ${themeVisual.fallbackAccentColor} 100%)`,
                }}
              >
                <FactionIcon size={32} className="h-[18cqw] w-[18cqw]" />
              </div>
              <div className="relative flex flex-col items-center gap-[0.9cqw]">
                <div className="rounded-full border border-white/20 bg-slate-950/70 px-[2.2cqw] py-[0.7cqw] text-[4.6cqw] font-black uppercase tracking-[0.18em] text-white/90">
                  {t('card_skin_theme_mecha_badge', language)}
                </div>
                <div className="max-w-full truncate text-[7.2cqw] font-black tracking-tight text-white">
                  {displayCardName}
                </div>
                <div className="rounded-full border border-white/15 bg-black/35 px-[2.2cqw] py-[0.7cqw] text-[4.6cqw] font-bold uppercase tracking-[0.22em] text-white/75">
                  {themeVisual.serialCode}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-[1.8cqw] overflow-hidden px-[6cqw] text-center">
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-15"
                style={{ background: `radial-gradient(circle, ${imageFallback.primaryColor}44 0%, transparent 70%)` }}
              >
                <span className="text-[52cqw] leading-none select-none">{imageFallback.emoji}</span>
              </div>
              <div
                className={cn(
                  "relative flex aspect-square w-[46%] items-center justify-center rounded-full border border-white/20 text-white/85 shadow-[0_8px_24px_rgba(0,0,0,0.28)] bg-slate-900/80",
                  !performanceMode && "transition-transform duration-300",
                )}
                style={{
                  background: `linear-gradient(135deg, ${imageFallback.primaryColor}99 0%, ${imageFallback.accentColor}cc 100%)`,
                  boxShadow: `0 0 18px ${imageFallback.primaryColor}55`,
                }}
              >
                <span className="text-[22cqw] leading-none">{imageFallback.emoji}</span>
              </div>
              <div className="relative flex flex-col items-center gap-[0.9cqw]">
                <div className="max-w-full truncate text-[7.2cqw] font-black tracking-tight text-white">
                  {displayCardName}
                </div>
                {resolvedImage.priority === 'skin' && resolvedSkin && (
                  <div
                    className="rounded-full border border-white/15 px-[2.2cqw] py-[0.7cqw] text-[4.6cqw] font-bold uppercase tracking-[0.18em] text-white/90"
                    style={{ background: `linear-gradient(135deg, ${resolvedSkin.fallbackPrimaryColor}88, ${resolvedSkin.fallbackAccentColor}88)` }}
                  >
                    {resolvedSkin.fallbackEmoji} {t(resolvedSkin.nameKey, language)}
                  </div>
                )}
                {resolvedImage.priority === 'theme' && themeVisual && (
                  <div className="rounded-full border border-white/15 bg-black/35 px-[2.2cqw] py-[0.7cqw] text-[4.6cqw] font-bold uppercase tracking-[0.18em] text-white/80">
                    {t('card_skin_theme_mecha_badge', language)}
                  </div>
                )}
                {resolvedImage.priority === 'fallback' && factionDef && (
                  <div className="rounded-full border border-white/15 bg-black/35 px-[2.2cqw] py-[0.7cqw] text-[4.6cqw] font-bold uppercase tracking-[0.18em] text-white/80">
                    {t(factionDef.summaryKey, language)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sprite sheet — covers entire card, positioned behind stats */}
      {currentImageSource && isSpriteSheet(currentImageSource) && visualCardId && (
        <div
          className={cn(
            "absolute z-[27] pointer-events-none rounded-[inherit] overflow-hidden scale-[1.3]",
            !performanceMode && !isOnBoard && "transition-transform duration-500 group-hover/card:scale-[1.38]",
          )}
          style={{
            ...getSpritePosition(visualCardId, currentImageSource),
            width: '76%',
            aspectRatio: '19 / 20',
            position: 'absolute',
            left: '50%',
            top: '50%',
            marginLeft: '-38%',
            marginTop: '-40%',
          }}
        />
      )}

      {/* Direction stats. High-contrast badges keep N/E/S/W readable over card art and board colors. */}
      {!hideStats && (
        <>
          {renderStatBadge(0, "top-[3cqw] left-1/2 -translate-x-1/2")}
          {renderStatBadge(1, "right-[3cqw] top-1/2 -translate-y-1/2")}
          {renderStatBadge(2, "bottom-[3cqw] left-1/2 -translate-x-1/2")}
          {renderStatBadge(3, "left-[3cqw] top-1/2 -translate-y-1/2")}
        </>
      )}

      {/* Growth Stars - Hidden on board */}
      {(activeCard.growth || 0) > 0 && !isOnBoard && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-0 z-30">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              size={8} 
              fill={i < (activeCard.growth || 0) ? "#FFD700" : "none"}
              color={i < (activeCard.growth || 0) ? "#FFD700" : "rgba(255,255,255,0.3)"}
              className={cn(i < (activeCard.growth || 0) && "drop-shadow-[0_0_2px_rgba(255,215,0,0.8)]")}
            />
          ))}
        </div>
      )}

      {/* Ability Icon & Tooltip - Hidden on board */}
      {activeCard.ability && !isOnBoard && (
        <div className="absolute bottom-[3cqw] right-[3cqw] z-50 group/ability">
          <div
            className="w-[12cqw] h-[12cqw] bg-black/95 rounded-full border-[1px] border-white/50 flex items-center justify-center text-white p-[2cqw] shadow-[0_2px_5px_rgba(0,0,0,0.5)] relative"
            role="img"
            aria-label={activeCard.ability ? `${activeCard.ability.type} ${language === 'ko' ? activeCard.ability.description_ko : activeCard.ability.description_en}` : undefined}
            title={activeCard.ability ? (language === 'ko' ? activeCard.ability.description_ko : activeCard.ability.description_en) : undefined}
          >
            {activeCard.ability.type === 'POWER_BOOST' && <Zap className="w-full h-full text-yellow-400" />}
            {activeCard.ability.type === 'WEAKEN' && <ChevronsDown className="w-full h-full text-red-400" />}
            {activeCard.ability.type === 'REINFORCE' && <ChevronsUp className="w-full h-full text-green-400" />}
            {activeCard.ability.type === 'SHIELD' && <Shield className="w-full h-full text-blue-400" />}
            {activeCard.ability.type === 'WALL' && <Mountain className="w-full h-full text-slate-400" />}
            {activeCard.ability.type === 'PIERCE' && <Crosshair className="w-full h-full text-orange-400" />}
            
            {/* Tooltip */}
            {!(isSelected || isDragging) && (
              <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover/ability:opacity-100 transition-opacity duration-200 pointer-events-none w-[40cqw] min-w-[120px] max-w-[180px] bg-black/95 text-white p-2 rounded-lg border border-white/20 shadow-xl z-[150] origin-bottom-right transform scale-95 group-hover/ability:scale-100">
                <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1 flex items-center gap-1">
                  <HelpCircle size={10} className="shrink-0" />
                  <span className="truncate">{activeCard.ability.type.replace('_', ' ')}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[8px] sm:text-[10px] leading-tight font-sans font-medium text-white/90">
                    {activeCard.ability.description_en}
                  </p>
                  {activeCard.ability.description_ko && (
                    <p className="text-[7px] sm:text-[9px] leading-tight font-sans text-white/50">
                      {activeCard.ability.description_ko}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hover Stats Tooltip - Hidden on board */}
      {!(isSelected || isDragging) && !isOnBoard && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none z-[150] shadow-2xl scale-95 group-hover/card:scale-100 transform origin-bottom">
          <div className="bg-black/95 p-1.5 rounded-lg border border-white/20 relative w-14 h-14 flex items-center justify-center">
            {/* Top Stat */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-black leading-none text-white">{modifiedStats[0]}</div>
            {/* Right Stat */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black leading-none text-white">{modifiedStats[1]}</div>
            {/* Bottom Stat */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-black leading-none text-white">{modifiedStats[2]}</div>
            {/* Left Stat */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black leading-none text-white">{modifiedStats[3]}</div>
            {/* Center dot/cross */}
            <div className="w-1 h-1 bg-white/30 rounded-full" />
          </div>
        </div>
      )}

      {/* Boss Badges */}
      {(activeCard.isMidBoss || activeCard.isFinalBoss) && (
        <div className={cn(
          "absolute -top-[4cqw] left-1/2 -translate-x-1/2 z-[60] px-[3cqw] py-[0.8cqw] border border-white/20 rounded-full font-bold text-[7cqw] uppercase tracking-wider shadow-sm select-none whitespace-nowrap font-sans bg-gradient-to-r",
          activeCard.isFinalBoss 
            ? "from-red-500 to-rose-600 text-white shadow-red-500/20 animate-pulse" 
            : "from-amber-400 to-yellow-500 text-slate-900 shadow-amber-400/20"
        )}>
          {activeCard.isFinalBoss ? t('final_boss', language) : t('mid_boss', language)}
        </div>
      )}

      {/* Skin Indicator - Non-board views only */}
      {resolvedSkin && !isOnBoard && !downloadMode && (
        <div 
          className="absolute top-[3cqw] left-1/2 -translate-x-1/2 z-[55] px-[2.5cqw] py-[0.6cqw] rounded-full border font-bold text-[5.5cqw] uppercase tracking-wider shadow-sm select-none whitespace-nowrap font-sans flex items-center gap-[1cqw]"
          style={{
            background: `linear-gradient(135deg, ${resolvedSkin.fallbackPrimaryColor} 0%, ${resolvedSkin.fallbackAccentColor} 100%)`,
            borderColor: resolvedSkin.fallbackAccentColor,
            color: '#fff',
          }}
        >
          <span>{resolvedSkin.fallbackEmoji}</span>
          <span className="truncate max-w-[30cqw]">{t(resolvedSkin.nameKey, language)}</span>
        </div>
      )}

      {downloadMode && (
        <div 
          className={cn(
            "absolute inset-0 z-50 pointer-events-none rounded-[inherit]",
            downloadMode === 'ally' ? "bg-blue-600/25 mix-blend-multiply" : "bg-red-600/25 mix-blend-multiply"
          )} 
        />
      )}

      {/* Damage Shake & Red Flash Overlay */}
      {(isDamaged || isFlipping) && (
        <div className="absolute inset-0 z-[120] pointer-events-none rounded-[inherit] overflow-hidden animate-red-flash border-2 border-red-500/90 flex items-center justify-center">
          <div className="absolute inset-0 bg-red-600/40 mix-blend-overlay" />
        </div>
      )}

    </motion.div>
  );
}, (prev, next) => (
  prev.isDamaged === next.isDamaged &&
  areCardsVisuallyEqual(prev.card, next.card) &&
  prev.className === next.className &&
  prev.isLocked === next.isLocked &&
  prev.isSelected === next.isSelected &&
  prev.isDragging === next.isDragging &&
  prev.hideBackground === next.hideBackground &&
  prev.isOnBoard === next.isOnBoard &&
  prev.customImage === next.customImage &&
  prev.lowSpecMode === next.lowSpecMode &&
  prev.processedImage === next.processedImage &&
  prev.language === next.language &&
  prev.cellElement === next.cellElement &&
  prev.hideStats === next.hideStats &&
  prev.isMatgo === next.isMatgo &&
  prev.ignoreBonuses === next.ignoreBonuses &&
  prev.downloadMode === next.downloadMode &&
  prev.activeSkin?.skinKey === next.activeSkin?.skinKey &&
  areNumberArraysEqual(prev.combatHighlights, next.combatHighlights)
));
