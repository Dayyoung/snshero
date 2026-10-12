import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Star, Zap, Shield, Mountain, Waves, Flame, Wind, User, Skull, Leaf, Hammer, Ghost, Bot, Lock,
} from 'lucide-react';
import type { CharacterFaction, CharacterRarityTier, CardData } from '../types';
import { cn, getAssetUrl, getCardSpriteAsset, getCardSpriteStyle } from '../lib/utils';
import { CARD_DATABASE } from '../cardDatabase';
import { getCardPower, getCardStatWithBonus, getNormalizedElement } from '../constants';
import { t } from '../lib/i18n';
import { normalizeCardRarity } from '../lib/cardRarity';
import { getCharacterAssetManifestEntry } from '../content/characterAssetManifest';
import { getCharacterIpProfile, getFactionDef } from '../content/characterIpUtils';
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
  /** Applied cosmetic skin. */
  activeSkin?: CardSkin | null;
  /** Brief damage feedback, without shaking the board. */
  isDamaged?: boolean;
}

const areNumberArraysEqual = (left?: number[], right?: number[]) => {
  if (left === right) return true;
  if (!left || !right || left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
};

const isSpriteSheet = (source?: string | null): boolean => {
  if (!source) return false;
  return (
    source.includes('cards1') || source.includes('card2') || source.includes('cards2') ||
    source.includes('card100') || source.includes('110card')
  );
};

const getSpritePosition = (cardIndex: number, spriteSource: string): React.CSSProperties => {
  if (!cardIndex) return {};
  return getCardSpriteStyle(cardIndex, spriteSource);
};

const areCardsVisuallyEqual = (left: CardData, right: CardData) => {
  if (left === right) return true;
  return (
    left.id === right.id && left.owner === right.owner && left.level === right.level &&
    left.power === right.power && left.bonusPower === right.bonusPower &&
    left.rarity === right.rarity && left.element === right.element && left.race === right.race &&
    left.imageIndex === right.imageIndex && left.imageUrl === right.imageUrl &&
    left.title === right.title && left.title_en === right.title_en && left.title_dis === right.title_dis &&
    left.growth === right.growth && left.activeSkinKey === right.activeSkinKey &&
    left.isMidBoss === right.isMidBoss && left.isFinalBoss === right.isFinalBoss &&
    left.ability?.type === right.ability?.type &&
    left.ability?.description_ko === right.ability?.description_ko &&
    left.ability?.description_en === right.ability?.description_en &&
    areNumberArraysEqual(left.stats, right.stats) &&
    left.skills === right.skills && left.equipment === right.equipment
  );
};

const isCharacterRarityTier = (value: string): value is CharacterRarityTier =>
  value === 'bronze' || value === 'silver' || value === 'gold' || value === 'platinum' || value === 'diamond' || value === 'legendary';

const getDisplayCardName = (card: CardData, language: string): string => {
  if (language === 'ko') return card.title || card.title_dis || card.title_en || '';
  return card.title_en || card.title_dis || card.title || '';
};

const getVisualCardId = (card: CardData): number | undefined => {
  if (typeof card.imageIndex === 'number' && Number.isFinite(card.imageIndex)) return card.imageIndex;
  const parsedId = Number(card.id);
  return Number.isFinite(parsedId) ? parsedId : undefined;
};

const getFactionIcon = (faction?: CharacterFaction | string) => {
  switch (faction) {
    case 'water': return Waves;
    case 'fire': return Flame;
    case 'wind': return Wind;
    case 'earth': return Mountain;
    case 'human': return User;
    case 'undead': return Skull;
    case 'elf': return Leaf;
    case 'dwarf': return Hammer;
    case 'monster': return Ghost;
    case 'robot': return Bot;
    case 'dragon': return Zap;
    default: return Shield;
  }
};

export const CardItem = React.memo(({ card, className, onClick, isLocked, isSelected, isDragging, hideBackground, isOnBoard, customImage, combatHighlights, lowSpecMode, processedImage, language = 'en', cellElement, hideStats, isMatgo, ignoreBonuses, downloadMode, activeSkin, isDamaged }: CardItemProps) => {
  const { cardSkinTheme, lowSpecMode: settingsLowSpecMode } = useGameSettings();
  const reducedMotion = useReducedMotion();
  // Keep live battle stats; do not replace the card with its database record.
  const activeCard = card;
  const isIOSDevice = useMemo(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);
  const performanceMode = lowSpecMode || settingsLowSpecMode || isOnBoard || isIOSDevice || reducedMotion;
  const shouldHideBg = hideBackground || !!downloadMode;
  const [isFlipping, setIsFlipping] = useState(false);
  const [damageFeedback, setDamageFeedback] = useState(false);
  const prevOwnerRef = useRef(activeCard.owner);

  useEffect(() => {
    const previousOwner = prevOwnerRef.current;
    // Update before scheduling so repeated captures and recaptures are detected.
    prevOwnerRef.current = activeCard.owner;
    if (previousOwner != null && previousOwner !== activeCard.owner) {
      setIsFlipping(true);
      const timer = setTimeout(() => setIsFlipping(false), 220);
      return () => clearTimeout(timer);
    }
    setIsFlipping(false);
  }, [activeCard.owner]);

  useEffect(() => {
    setDamageFeedback(!!isDamaged);
    if (!isDamaged) return;
    const timer = setTimeout(() => setDamageFeedback(false), 220);
    return () => clearTimeout(timer);
  }, [isDamaged]);

  const visualCardId = useMemo(() => getVisualCardId(activeCard), [activeCard]);
  const ipProfile = useMemo(() => visualCardId ? getCharacterIpProfile(visualCardId) : undefined, [visualCardId]);
  const rarityTier = useMemo(() => {
    if (ipProfile?.rarityTier) return ipProfile.rarityTier;
    return isCharacterRarityTier(activeCard.rarity) ? activeCard.rarity : 'bronze';
  }, [activeCard.rarity, ipProfile]);
  const normalizedCardRarity = useMemo(() => normalizeCardRarity(activeCard.rarity) ?? rarityTier, [activeCard.rarity, rarityTier]);
  const factionDef = useMemo(() => ipProfile ? getFactionDef(ipProfile.faction) : undefined, [ipProfile]);
  const assetManifestEntry = useMemo(() => visualCardId ? getCharacterAssetManifestEntry(visualCardId) : undefined, [visualCardId]);
  const displayCardName = useMemo(() => getDisplayCardName(activeCard, language), [activeCard, language]);
  const themeVisual = useMemo(() => visualCardId ? getCardSkinThemeVisual(cardSkinTheme, visualCardId) : null, [cardSkinTheme, visualCardId]);
  const isOriginalMechaTheme = themeVisual?.themeId === 'original_mecha';
  const race = getNormalizedElement(activeCard);
  const FactionIcon = getFactionIcon(ipProfile?.faction || (race === 'land' ? 'earth' : race) || undefined);
  const originalPower = activeCard.imageIndex !== undefined ? CARD_DATABASE[activeCard.imageIndex]?.power || 0 : activeCard.power;
  const powerScore = ignoreBonuses ? originalPower : getCardPower(activeCard);

  const resolvedSkin: CardSkin | undefined = useMemo(() => {
    if (activeSkin) return activeSkin;
    if (activeCard.activeSkinKey) return getCardSkinByKey(activeCard.activeSkinKey);
    return undefined;
  }, [activeSkin, activeCard.activeSkinKey]);
  const resolvedImage: ResolvedCardImage = useMemo(() => resolveCardImage(visualCardId ?? (Number(activeCard.id) || 0), {
    customImage, processedImage, activeSkin: resolvedSkin ?? null, cardSkinTheme, imageUrl: activeCard.imageUrl,
  }), [visualCardId, activeCard.id, customImage, processedImage, resolvedSkin, cardSkinTheme, activeCard.imageUrl]);
  const imageFallback = useMemo(() => visualCardId ? getCardImageFallback(visualCardId) : resolvedImage.fallback, [visualCardId, resolvedImage.fallback]);
  const imageSources = useMemo(() => {
    const defaultSprite = visualCardId ? getCardSpriteAsset(visualCardId) : '/cards1.png';
    const orderedSources = [
      processedImage, customImage, resolvedImage.source, activeCard.imageUrl, defaultSprite,
      assetManifestEntry?.targetAssetPath, assetManifestEntry?.frontAssetPath,
      assetManifestEntry?.legacySpritePath, assetManifestEntry?.fallbackAssetPath,
      assetManifestEntry?.lowSpecFallbackAssetPath,
    ];
    return Array.from(new Set(orderedSources.filter((source): source is string => Boolean(source)).map(src => getAssetUrl(src))));
  }, [activeCard.imageUrl, assetManifestEntry, customImage, processedImage, resolvedImage.source, visualCardId]);
  const [imageSourceIndex, setImageSourceIndex] = useState(0);
  useEffect(() => { setImageSourceIndex(0); }, [imageSources]);
  const currentImageSource = imageSources[imageSourceIndex];

  const statChanges = useMemo(() => activeCard.stats.map((baseVal, i) => {
    const total = ignoreBonuses ? baseVal : getCardStatWithBonus(activeCard, i, cellElement);
    let skillBonus = 0;
    if (!ignoreBonuses && activeCard.skills) {
      skillBonus = activeCard.skills.filter(s => s.effect.type === `stat_${i}`)
        .reduce((sum, s) => sum + Math.floor(s.level / 5) * s.effect.value, 0);
    }
    return { total, skillBonus, equipBonus: ignoreBonuses ? 0 : total - baseVal - skillBonus, base: baseVal };
  }), [activeCard, cellElement, ignoreBonuses]);
  const hasPowerBonus = !ignoreBonuses && (card.skills?.find(skill => skill.id === 'power_boost')?.level || 0) > 0;
  const rarityGroup = useMemo((): 'bronze' | 'silver' | 'gold' | 'special' => {
    const norm = (normalizedCardRarity || rarityTier || '').toLowerCase();
    if (norm === 'silver' || norm === 'magic') return 'silver';
    if (norm === 'gold' || norm === 'rare') return 'gold';
    if (norm === 'platinum' || norm === 'diamond' || norm === 'legendary' || norm === 'epic' || norm === 'social') {
      return 'special';
    }
    return 'bronze';
  }, [normalizedCardRarity, rarityTier]);

  const pokemonTheme = useMemo(() => {
    switch (rarityGroup) {
      case 'silver':
        return {
          groupName: 'SILVER',
          symbol: '🥈',
          outerBorder: 'border-[#94a3b8] ring-1 ring-[#64748b]/50',
          outerBg: 'bg-[#cbd5e1]',
          surfaceBg: 'bg-gradient-to-b from-[#ffffff] via-[#f1f5f9] to-[#e2e8f0]',
          innerBorder: 'border-[#64748b]/40',
          windowBorder: 'border-[#94a3b8]/60 shadow-[inset_0_0_6px_rgba(148,163,184,0.3)]',
          badgeClass: 'bg-gradient-to-r from-[#64748b] to-[#475569] text-white border border-[#334155] shadow-xs',
          badgeLabel: 'SILVER',
          statBadge: 'border-[#94a3b8]/60 bg-[#f8fafc] text-[#201d1d] shadow-[0_1px_4px_rgba(148,163,184,0.35)]',
          accentColor: '#64748b',
          tagLabel: 'SNSHERO SILVER',
          glowShadow: 'shadow-[0_2px_10px_rgba(148,163,184,0.35)]',
          isHolo: false,
          isGold: false,
        };
      case 'gold':
        return {
          groupName: 'GOLD',
          symbol: '👑',
          outerBorder: 'border-[#eab308] ring-1 ring-[#ca8a04]/70',
          outerBg: 'bg-[#facc15]',
          surfaceBg: 'bg-gradient-to-b from-[#fffef0] via-[#fef9c3] to-[#fde047]',
          innerBorder: 'border-[#ca8a04]/50',
          windowBorder: 'border-[#eab308] shadow-[inset_0_0_8px_rgba(234,179,8,0.3)]',
          badgeClass: 'bg-gradient-to-r from-[#d97706] via-[#eab308] to-[#f59e0b] text-zinc-950 font-black border border-[#b45309] shadow-sm',
          badgeLabel: 'GOLD',
          statBadge: 'border-[#ca8a04]/70 bg-[#fffbeb] text-[#201d1d] shadow-[0_1px_5px_rgba(202,138,4,0.35)]',
          accentColor: '#d97706',
          tagLabel: 'SNSHERO ★ GOLD',
          glowShadow: 'shadow-[0_0_14px_rgba(234,179,8,0.4)]',
          isHolo: false,
          isGold: true,
        };
      case 'special': {
        const specialLabel = normalizedCardRarity === 'legendary'
          ? '★ LEGEND'
          : normalizedCardRarity === 'diamond'
            ? '💎 DIAMOND'
            : '✨ SPECIAL';
        return {
          groupName: 'SPECIAL',
          symbol: '✨',
          outerBorder: 'border-fuchsia-400 ring-1 ring-cyan-400',
          outerBg: 'bg-gradient-to-br from-rose-400 via-purple-500 to-cyan-400',
          surfaceBg: 'bg-gradient-to-b from-[#fdf2f8] via-[#f5f3ff] to-[#e0f2fe]',
          innerBorder: 'border-purple-300/60',
          windowBorder: 'border-purple-400/80 shadow-[0_0_8px_rgba(168,85,247,0.35)]',
          badgeClass: 'bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-500 text-white font-black border border-white/60 shadow-[0_0_8px_rgba(236,72,153,0.5)]',
          badgeLabel: specialLabel,
          statBadge: 'border-purple-400/70 bg-[#faf5ff] text-[#201d1d] shadow-[0_1px_6px_rgba(168,85,247,0.35)]',
          accentColor: '#9333ea',
          tagLabel: 'SNSHERO ★ ULTRA',
          glowShadow: 'shadow-[0_0_16px_rgba(217,70,239,0.45)]',
          isHolo: true,
          isGold: false,
        };
      }
      case 'bronze':
      default:
        return {
          groupName: 'BRONZE',
          symbol: '🥉',
          outerBorder: 'border-[#8c5936] ring-1 ring-[#5c3a21]/50',
          outerBg: 'bg-[#b87d54]',
          surfaceBg: 'bg-gradient-to-b from-[#fcf7f1] via-[#f7ebe0] to-[#ebd7c2]',
          innerBorder: 'border-[#713f1f]/35',
          windowBorder: 'border-[#8c5936]/40 shadow-[inset_0_0_4px_rgba(140,89,54,0.2)]',
          badgeClass: 'bg-gradient-to-r from-[#784421] to-[#5c3319] text-[#fff7ed] border border-[#3e210f] shadow-xs',
          badgeLabel: 'BRONZE',
          statBadge: 'border-[#8c5936]/50 bg-[#fffdfa] text-[#201d1d] shadow-[0_1px_4px_rgba(140,89,54,0.25)]',
          accentColor: '#8c5936',
          tagLabel: 'SNSHERO BRONZE',
          glowShadow: 'shadow-[0_2px_8px_rgba(140,89,54,0.25)]',
          isHolo: false,
          isGold: false,
        };
    }
  }, [rarityGroup, normalizedCardRarity]);

  const statDirections = ['N', 'E', 'S', 'W'];
  const rarityAccent = pokemonTheme.accentColor;
  const owner = downloadMode ? (downloadMode === 'ally' ? 'player' : 'ai') : activeCard.owner;
  const ownerLabel = owner === 'player' ? t('you', language) : owner === 'ai' ? t('opponent_deck', language) : '';
  const ownerAccent = owner === 'player' ? '#2563eb' : '#dc2626';
  const showOwnership = isOnBoard && !isMatgo && !!owner;
  const typeSurface = pokemonTheme.surfaceBg;
  const abilityDescription = language === 'ko'
    ? activeCard.ability?.description_ko || activeCard.ability?.description_en
    : activeCard.ability?.description_en;
  const feedbackActive = damageFeedback || isFlipping;

  const renderStatBadge = (index: number, positionClass: string) => {
    const stat = statChanges[index];
    const delta = stat.total - stat.base;
    const highlighted = combatHighlights?.includes(index);
    const direction = statDirections[index];

    return (
      <div
        className={cn(
          'z-30 flex items-center justify-center border font-mono leading-none tabular-nums select-none backdrop-blur-[0.5px]',
          isOnBoard
            ? 'absolute h-[16cqw] min-w-[22cqw] rounded-sm px-[1.2cqw] gap-[1cqw]'
            : 'absolute h-[14cqw] min-w-[20cqw] rounded-sm px-[1cqw] gap-[0.8cqw]',
          highlighted
            ? 'border-red-500 bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.9)] scale-110 z-40'
            : pokemonTheme.statBadge,
          positionClass,
        )}
        title={`${direction} ${stat.total}${delta ? ` (${stat.base}${delta > 0 ? '+' : ''}${delta})` : ''}`}
      >
        <span className={cn(
          'text-[5.5cqw] font-black tracking-tighter',
          highlighted ? 'text-white' : 'text-[#646262]'
        )}>
          {index === 0 && `▲${direction}`}
          {index === 1 && `${direction}▶`}
          {index === 2 && `▼${direction}`}
          {index === 3 && `◀${direction}`}
        </span>
        <span className={cn(
          'text-[11cqw] font-bold tracking-tight',
          !highlighted && delta > 0 && 'text-[#16a34a]',
          !highlighted && delta < 0 && 'text-[#dc2626]',
        )}>
          {stat.total}
        </span>
        {(delta !== 0 || stat.skillBonus > 0 || stat.equipBonus !== 0) && (
          <span className="absolute -top-[1.5cqw] -right-[1.5cqw] flex h-[5.5cqw] min-w-[5.5cqw] items-center justify-center rounded-full bg-slate-900 px-[0.5cqw] text-[4cqw] font-bold text-white shadow-xs">
            {delta < 0 ? '-' : '+'}
          </span>
        )}
      </div>
    );
  };

  return (
    <motion.div
      animate={!performanceMode && isFlipping ? { scale: [1, 1.015, 1] } : { scale: 1 }}
      transition={{ duration: performanceMode ? 0 : 0.22 }}
      whileTap={onClick && !isLocked && !performanceMode ? { scale: 0.985 } : undefined}
      className={cn(
        'group/card group @container relative isolate flex flex-col select-none text-[#201d1d]',
        !className?.includes('w-') && !className?.includes('h-') && 'h-28 w-20 sm:h-32 sm:w-24 md:h-44 md:w-32',
        onClick && 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#201d1d]',
        className,
        'rounded-sm font-mono shadow-none',
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={displayCardName}
      aria-pressed={onClick ? !!isSelected : undefined}
      data-card-layout={isOnBoard ? 'board' : 'tcg'}
      data-owner={owner || undefined}
      onKeyDown={onClick ? event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {/* Outer pokemon border frame */}
      <div className={cn(
        'pointer-events-none absolute inset-0 z-0 rounded-sm border',
        !shouldHideBg && !showOwnership && cn(pokemonTheme.outerBorder, pokemonTheme.outerBg, pokemonTheme.glowShadow),
        showOwnership && owner === 'player' && 'border-[#2563eb] bg-[#2563eb]',
        showOwnership && owner === 'ai' && 'border-[#dc2626] bg-[#dc2626]',
        shouldHideBg && !showOwnership && 'border-transparent',
      )} />

      {/* Inner surface texture */}
      {!shouldHideBg && (
        <div className={cn(
          'pointer-events-none absolute inset-[3cqw] z-0 rounded-sm border',
          showOwnership ? (owner === 'player' ? 'bg-[#dbeafe] border-[#2563eb]/40' : 'bg-[#fee2e2] border-[#dc2626]/40') : cn(typeSurface, pokemonTheme.innerBorder),
        )} />
      )}

      {/* Special Holographic Foil Rainbow Sheen */}
      {pokemonTheme.isHolo && !performanceMode && !shouldHideBg && (
        <div
          className="pointer-events-none absolute inset-0 z-15 overflow-hidden rounded-[inherit] mix-blend-color-dodge opacity-50"
          style={{
            background: 'linear-gradient(115deg, transparent 20%, rgba(244,63,94,0.3) 35%, rgba(168,85,247,0.3) 50%, rgba(6,182,212,0.3) 65%, transparent 80%)',
          }}
        />
      )}

      {/* Gold Foil Metallic Sheen */}
      {pokemonTheme.isGold && !performanceMode && !shouldHideBg && (
        <div
          className="pointer-events-none absolute inset-0 z-15 overflow-hidden rounded-[inherit] mix-blend-overlay opacity-40"
          style={{
            background: 'linear-gradient(135deg, transparent 30%, rgba(254,240,138,0.6) 50%, transparent 70%)',
          }}
        />
      )}

      {/* Top Header - Pokemon TCG format */}
      {!isOnBoard && (
        <div className="absolute inset-x-[5cqw] top-[4.5cqw] z-20 flex h-[16cqw] flex-col justify-between leading-none">
          <div className="flex items-center justify-between gap-[1.5cqw]">
            <div className="flex min-w-0 items-center gap-[1cqw]">
              <span className={cn('truncate rounded-xs px-[1.5cqw] py-[0.5cqw] text-[4.8cqw] font-black uppercase tracking-wider', pokemonTheme.badgeClass)}>
                {pokemonTheme.symbol} {pokemonTheme.badgeLabel}
              </span>
              <span className="shrink-0 text-[4.8cqw] font-bold text-[#646262] tabular-nums">
                Lv.{activeCard.level}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-[1cqw]" title={t('wiki_power', language)}>
              <span className="text-[5cqw] font-black text-[#ca8a04]">⚡</span>
              <span className="text-[8.5cqw] font-black tabular-nums">{powerScore}{hasPowerBonus && '+'}</span>
              <FactionIcon className="h-[6.5cqw] w-[6.5cqw] rounded-full border border-[#201d1d]/30 bg-[#fdfcfc]/80 p-[0.8cqw]" />
            </div>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-[1cqw] border-t border-[#201d1d]/15 pt-[1cqw]">
            <span className="min-w-0 truncate text-[7.5cqw] font-black tracking-tight" title={displayCardName}>
              {displayCardName}
            </span>
            <span className="shrink-0 text-[4.2cqw] font-bold uppercase text-[#646262]">
              {t(`rarity_${rarityTier}`, language)}
            </span>
          </div>
        </div>
      )}

      {/* Illustration window */}
      <div className={cn(
        'pointer-events-none absolute z-10 overflow-hidden border [container-type:size]',
        isOnBoard ? 'inset-x-[4cqw] bottom-[17cqw] top-[4cqw]' : 'inset-x-[5.5cqw] bottom-[26cqw] top-[22.5cqw]',
        !shouldHideBg && (showOwnership ? owner === 'player' ? 'bg-[#eff6ff]' : 'bg-[#fff1f2]' : 'bg-[#fff9e9]'),
        pokemonTheme.windowBorder,
      )}>
        {currentImageSource ? (
          isSpriteSheet(currentImageSource) && visualCardId ? (
            <>
              <img key={currentImageSource} src={currentImageSource} alt="" className="hidden" aria-hidden="true" referrerPolicy="no-referrer" onError={() => setImageSourceIndex(currentIndex => currentIndex + 1)} />
              <div
                role="img"
                aria-label={displayCardName}
                className="absolute left-1/2 top-1/2 w-[min(92cqw,87cqh)] -translate-x-1/2 -translate-y-1/2"
                style={{ ...getSpritePosition(visualCardId, currentImageSource), aspectRatio: '19 / 20' }}
              />
            </>
          ) : (
            <img
              key={currentImageSource}
              src={currentImageSource}
              alt={displayCardName}
              className="h-full w-full object-contain"
              referrerPolicy="no-referrer"
              onError={() => setImageSourceIndex(currentIndex => currentIndex + 1)}
            />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-[3cqw] px-[8cqw] text-center">
            {isOriginalMechaTheme && themeVisual ? (
              <>
                <FactionIcon className="h-[30cqw] w-[30cqw]" style={{ color: shouldHideBg ? undefined : themeVisual.fallbackPrimaryColor }} />
                <span className="text-[6cqw]">{t('card_skin_theme_mecha_badge', language)}</span>
                <span className="text-[5cqw] text-[#646262]">{themeVisual.serialCode}</span>
              </>
            ) : (
              <>
                <span className="text-[30cqw] leading-none">{resolvedSkin?.fallbackEmoji || imageFallback.emoji}</span>
                <span className="text-[6cqw] text-[#646262]">{t(resolvedSkin?.nameKey || imageFallback.labelKey, language)}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Board view top-left power indicator */}
      {isOnBoard && <div className={cn(
        'absolute left-[3cqw] z-30 flex items-center gap-[1cqw] border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] px-[2cqw] py-[1.5cqw] leading-none',
        'top-[3cqw]',
      )} title={t('wiki_power', language)}>
        <Zap className="h-[6cqw] w-[6cqw]" strokeWidth={1.5} />
        <span className="text-[8cqw] font-bold tabular-nums">{powerScore}</span>
        {hasPowerBonus && <span className="text-[5cqw] font-bold">+</span>}
      </div>}

      {/* Direction stats: Always displayed in North / East / South / West layout (Cross Diamond HUD) */}
      {!hideStats && (
        <>
          {renderStatBadge(0, isOnBoard ? 'top-[2.5cqw] left-1/2 -translate-x-1/2' : 'top-[20cqw] left-1/2 -translate-x-1/2')}
          {renderStatBadge(1, 'right-[2cqw] top-[46%] -translate-y-1/2')}
          {renderStatBadge(2, isOnBoard ? 'bottom-[16cqw] left-1/2 -translate-x-1/2' : 'bottom-[23.5cqw] left-1/2 -translate-x-1/2')}
          {renderStatBadge(3, 'left-[2cqw] top-[46%] -translate-y-1/2')}
        </>
      )}

      {/* Bottom Info Footer - Pokemon TCG attack move / ability style */}
      <div className={cn(
        'absolute z-20 flex flex-col justify-center',
        isOnBoard ? 'inset-x-[4cqw] bottom-[4cqw] h-[13cqw] px-[2cqw]' : 'inset-x-[5.5cqw] bottom-[3.5cqw] h-[21cqw] gap-[1cqw]',
        showOwnership && 'text-white',
        showOwnership && (owner === 'player' ? 'bg-[#2563eb]' : 'bg-[#dc2626]'),
      )}>
        {!isOnBoard && abilityDescription && (
          <div className="flex items-center gap-[1.5cqw] border-b border-[#201d1d]/15 pb-[1cqw]">
            <span className="shrink-0 text-[4.8cqw] font-black text-[#ca8a04]">
              {activeCard.ability?.type === 'POWER_BOOST' && '[⚡BOOST]'}
              {activeCard.ability?.type === 'WEAKEN' && '[🔻WEAK]'}
              {activeCard.ability?.type === 'REINFORCE' && '[🛡️GUARD]'}
              {activeCard.ability?.type === 'SHIELD' && '[🛡️SHIELD]'}
              {activeCard.ability?.type === 'WALL' && '[🧱WALL]'}
              {activeCard.ability?.type === 'PIERCE' && '[🎯PIERCE]'}
              {activeCard.ability?.type === 'COUNTER' && '[⚔️COUNTER]'}
              {activeCard.ability?.type === 'IMMUNITY' && '[✨IMMUNE]'}
              {activeCard.ability?.type === 'TIME_WARP' && '[⏳WARP]'}
              {activeCard.ability?.type === 'OMNIBOOST' && '[⭐OMNI]'}
            </span>
            <p className="truncate text-[4.8cqw] font-medium leading-[1.3] text-[#201d1d]" title={abilityDescription}>
              {abilityDescription}
            </p>
          </div>
        )}
        <div className="flex min-w-0 items-center justify-between gap-[2cqw] text-[5.5cqw] leading-none">
          <div className="flex min-w-0 items-center gap-[1.5cqw]">
            {isSelected && <span className="font-bold text-[#b45309]" title={t('pg_selected', language)}>[x]</span>}
            {isLocked && <Lock className="h-[6cqw] w-[6cqw] shrink-0 text-[#ca8a04]" aria-label={t('profile_locked_label', language)} />}
            {owner ? (
              <span className="flex min-w-0 items-center gap-[1cqw] font-bold" title={ownerLabel}>
                {owner === 'player' ? <User className="h-[5.5cqw] w-[5.5cqw] shrink-0" /> : <Bot className="h-[5.5cqw] w-[5.5cqw] shrink-0" />}
                <span className="truncate">{ownerLabel}</span>
              </span>
            ) : !isOnBoard && factionDef ? (
              <span className="flex min-w-0 items-center gap-[1cqw]" title={t(factionDef.nameKey, language)}>
                <FactionIcon className="h-[5.5cqw] w-[5.5cqw] shrink-0 text-[#646262]" />
                <span className="truncate text-[#646262]">{t(factionDef.nameKey, language)}</span>
              </span>
            ) : !isOnBoard && race ? <FactionIcon className="h-[5.5cqw] w-[5.5cqw] shrink-0 text-[#646262]" /> : null}
          </div>
          {!isOnBoard && !abilityDescription && (
            <span className="shrink-0 text-[4.5cqw] text-[#646262] font-semibold">
              {t('type_normal', language) || 'BASIC CARD'}
            </span>
          )}
        </div>
        {!isOnBoard && (
          <div className="flex items-center justify-between gap-[2cqw] border-t border-[#201d1d]/15 pt-[1cqw] text-[4.5cqw] leading-none">
            <span className="truncate tabular-nums text-[#646262]">#{String(visualCardId ?? activeCard.id).padStart(3, '0')}</span>
            <span className="flex items-center gap-[1cqw] font-bold" style={{ color: rarityAccent }}>
              <Star className="h-[4.5cqw] w-[4.5cqw]" fill={rarityAccent} />
              {pokemonTheme.tagLabel}
            </span>
          </div>
        )}
      </div>

      {!isOnBoard && resolvedSkin && !downloadMode && (
        <div className="absolute right-[9cqw] top-[28cqw] z-30 flex max-w-[32cqw] items-center gap-[1cqw] border border-[#201d1d]/25 bg-[#fff9e9] px-[1.5cqw] py-[1cqw] text-[5cqw] leading-none" title={t(resolvedSkin.nameKey, language)}>
          <span>{resolvedSkin.fallbackEmoji}</span>
          <span className="truncate">{t(resolvedSkin.nameKey, language)}</span>
        </div>
      )}
      {!isOnBoard && !resolvedSkin && isOriginalMechaTheme && themeVisual && (
        <span className="absolute right-[9cqw] top-[28cqw] z-30 max-w-[30cqw] truncate border border-[#201d1d]/25 bg-[#fff9e9] px-[1.5cqw] py-[1cqw] text-[5cqw]" title={t('card_skin_theme_mecha_badge', language)}>{themeVisual.serialCode}</span>
      )}
      {(activeCard.growth || 0) > 0 && !isOnBoard && (
        <div className="absolute bottom-[51cqw] left-1/2 z-20 flex -translate-x-1/2 gap-[0.5cqw] border border-[#201d1d]/25 bg-[#fff9e9] px-[1cqw] py-[0.5cqw]">
          {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-[5cqw] w-[5cqw]" fill={i < (activeCard.growth || 0) ? '#201d1d' : 'none'} strokeWidth={1.5} />)}
        </div>
      )}
      {(activeCard.isMidBoss || activeCard.isFinalBoss) && (
        <div className="absolute -top-[10cqw] left-0 z-40 max-w-full truncate border border-[#201d1d] bg-[#201d1d] px-[2cqw] py-[1cqw] text-[6cqw] font-bold leading-none text-[#fdfcfc]">
          {activeCard.isFinalBoss ? t('final_boss', language) : t('mid_boss', language)}
        </div>
      )}
      {(isSelected || isDragging) && (
        <div className={cn('pointer-events-none absolute inset-0 z-40 border-2 border-[#201d1d]', isDragging && 'border-dashed')} />
      )}
      {feedbackActive && (
        <motion.div
          key={damageFeedback ? 'damage' : `capture-${activeCard.owner}`}
          initial={{ opacity: 1 }}
          animate={{ opacity: performanceMode ? 1 : 0 }}
          transition={{ duration: performanceMode ? 0 : 0.22 }}
          className="pointer-events-none absolute inset-0 z-40 border-2"
          style={{ borderColor: damageFeedback ? '#9a392e' : ownerAccent }}
        />
      )}
    </motion.div>
  );
}, (prev, next) => (
  prev.isDamaged === next.isDamaged &&
  areCardsVisuallyEqual(prev.card, next.card) &&
  prev.onClick === next.onClick &&
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
  prev.activeSkin === next.activeSkin &&
  areNumberArraysEqual(prev.combatHighlights, next.combatHighlights)
));
