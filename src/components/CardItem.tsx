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
  const statDirections = ['N', 'E', 'S', 'W'];
  const rarityAccent = ({
    bronze: '#956746', silver: '#646262', gold: '#987322', platinum: '#557477',
    diamond: '#426c87', legendary: '#705579',
  } as Record<string, string>)[normalizedCardRarity] || '#956746';
  const owner = downloadMode ? (downloadMode === 'ally' ? 'player' : 'ai') : activeCard.owner;
  const ownerLabel = owner === 'player' ? t('you', language) : owner === 'ai' ? t('opponent_deck', language) : '';
  const ownerAccent = owner === 'player' ? '#426c87' : '#9a5148';
  const abilityDescription = language === 'ko'
    ? activeCard.ability?.description_ko || activeCard.ability?.description_en
    : activeCard.ability?.description_en;
  const feedbackActive = damageFeedback || isFlipping;

  const renderStatBadge = (index: number, positionClass: string) => {
    const stat = statChanges[index];
    const delta = stat.total - stat.base;
    const highlighted = combatHighlights?.includes(index);
    return (
      <div
        className={cn(
          'absolute z-30 flex h-[18cqw] min-w-[26cqw] items-center justify-center gap-[1.5cqw] rounded-none border border-[#646262] bg-[#fdfcfc] px-[2cqw] font-mono leading-none tabular-nums',
          highlighted && 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]',
          positionClass,
        )}
        title={`${statDirections[index]} ${stat.total}${delta ? ` (${stat.base}${delta > 0 ? '+' : ''}${delta})` : ''}`}
      >
        <span className={cn('text-[6cqw] font-medium', highlighted ? 'text-[#fdfcfc]' : 'text-[#646262]')}>{statDirections[index]}</span>
        <span className={cn(
          'text-[11cqw] font-bold tracking-tight',
          !highlighted && delta > 0 && 'text-[#245e47]',
          !highlighted && delta < 0 && 'text-[#9a392e]',
        )}>{stat.total}</span>
        {(delta !== 0 || stat.skillBonus > 0 || stat.equipBonus !== 0) && (
          <span className="absolute right-[1cqw] top-[0.5cqw] text-[5cqw] font-bold">{delta < 0 ? '-' : '+'}</span>
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
        'rounded-none font-mono shadow-none',
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={displayCardName}
      aria-pressed={onClick ? !!isSelected : undefined}
      onKeyDown={onClick ? event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="pointer-events-none absolute inset-0 z-0 border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc]" />
      {!shouldHideBg && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[2px]" style={{ backgroundColor: isOnBoard && !isMatgo && owner ? ownerAccent : rarityAccent }} />
      )}

      {!isOnBoard && (
        <div className="absolute inset-x-px top-px z-20 flex h-[12cqw] items-center justify-between gap-[2cqw] border-b border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] px-[4cqw] text-[5.5cqw] leading-none">
          <span className="shrink-0 tabular-nums text-[#646262]">#{String(visualCardId ?? activeCard.id).padStart(3, '0')}</span>
          <span className="truncate font-bold uppercase" title={t(`rarity_${rarityTier}`, language)}>{t(`rarity_${rarityTier}`, language)}</span>
        </div>
      )}

      <div className={cn(
        'pointer-events-none absolute inset-x-px z-10 overflow-hidden',
        isOnBoard ? 'bottom-[13cqw] top-px' : 'bottom-[30cqw] top-[12cqw]',
        !shouldHideBg && 'bg-[#f8f7f7]',
      )}>
        {currentImageSource ? (
          isSpriteSheet(currentImageSource) && visualCardId ? (
            <>
              <img key={currentImageSource} src={currentImageSource} alt="" className="hidden" aria-hidden="true" referrerPolicy="no-referrer" onError={() => setImageSourceIndex(currentIndex => currentIndex + 1)} />
              <div
                role="img"
                aria-label={displayCardName}
                className="absolute left-1/2 top-1/2 w-[92%] -translate-x-1/2 -translate-y-1/2"
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

      <div className={cn(
        'absolute left-[3cqw] z-30 flex items-center gap-[1cqw] border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] px-[2cqw] py-[1.5cqw] leading-none',
        isOnBoard ? 'top-[3cqw]' : 'top-[15cqw]',
      )} title={t('wiki_power', language)}>
        <Zap className="h-[6cqw] w-[6cqw]" strokeWidth={1.5} />
        <span className="text-[8cqw] font-bold tabular-nums">{powerScore}</span>
        {hasPowerBonus && <span className="text-[5cqw] font-bold">+</span>}
      </div>

      {!hideStats && (
        <>
          {renderStatBadge(0, isOnBoard ? 'top-[3cqw] left-1/2 -translate-x-1/2' : 'top-[15cqw] left-1/2 -translate-x-1/2')}
          {renderStatBadge(1, 'right-[3cqw] top-[46%] -translate-y-1/2')}
          {renderStatBadge(2, isOnBoard ? 'bottom-[16cqw] left-1/2 -translate-x-1/2' : 'bottom-[33cqw] left-1/2 -translate-x-1/2')}
          {renderStatBadge(3, 'left-[3cqw] top-[46%] -translate-y-1/2')}
        </>
      )}

      <div className={cn(
        'absolute inset-x-px bottom-px z-20 flex flex-col justify-center border-t border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] px-[4cqw]',
        isOnBoard ? 'h-[13cqw]' : 'h-[30cqw] gap-[2cqw]',
      )}>
        {!isOnBoard && <div className="truncate text-[8cqw] font-bold leading-tight" title={displayCardName}>{displayCardName}</div>}
        <div className="flex min-w-0 items-center justify-between gap-[2cqw] text-[6cqw] leading-none">
          <div className="flex min-w-0 items-center gap-[1.5cqw]">
            {isSelected && <span className="font-bold" title={t('pg_selected', language)}>[x]</span>}
            {isLocked && <Lock className="h-[7cqw] w-[7cqw] shrink-0" aria-label={t('profile_locked_label', language)} />}
            {owner ? (
              <span className="flex min-w-0 items-center gap-[1cqw] font-bold" title={ownerLabel}>
                {owner === 'player' ? <User className="h-[6cqw] w-[6cqw] shrink-0" /> : <Bot className="h-[6cqw] w-[6cqw] shrink-0" />}
                <span className="truncate">{ownerLabel}</span>
              </span>
            ) : !isOnBoard && factionDef ? (
              <span className="flex min-w-0 items-center gap-[1cqw] text-[#646262]" title={t(factionDef.nameKey, language)}>
                <FactionIcon className="h-[6cqw] w-[6cqw] shrink-0" />
                <span className="truncate">{t(factionDef.nameKey, language)}</span>
              </span>
            ) : !isOnBoard && race ? <FactionIcon className="h-[6cqw] w-[6cqw] shrink-0" /> : null}
          </div>
          {!isOnBoard && activeCard.ability && (
            <span className="shrink-0 text-[5cqw]" title={abilityDescription} aria-label={`${activeCard.ability.type} ${abilityDescription || ''}`}>
              {activeCard.ability.type === 'POWER_BOOST' && '[⚡+1]'}
              {activeCard.ability.type === 'WEAKEN' && '[🔻-1]'}
              {activeCard.ability.type === 'REINFORCE' && '[🛡️+1]'}
              {activeCard.ability.type === 'SHIELD' && '[🛡️SHD]'}
              {activeCard.ability.type === 'WALL' && '[🧱WAL]'}
              {activeCard.ability.type === 'PIERCE' && '[🎯PRC]'}
              {activeCard.ability.type === 'COUNTER' && '[⚔️CTR]'}
              {activeCard.ability.type === 'IMMUNITY' && '[✨IMM]'}
              {activeCard.ability.type === 'TIME_WARP' && '[⏳TRN]'}
              {activeCard.ability.type === 'OMNIBOOST' && '[⭐BST]'}
            </span>
          )}
        </div>
      </div>

      {!isOnBoard && resolvedSkin && !downloadMode && (
        <div className="absolute right-[3cqw] top-[15cqw] z-30 flex max-w-[32cqw] items-center gap-[1cqw] border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] px-[1.5cqw] py-[1cqw] text-[5cqw] leading-none" title={t(resolvedSkin.nameKey, language)}>
          <span>{resolvedSkin.fallbackEmoji}</span>
          <span className="truncate">{t(resolvedSkin.nameKey, language)}</span>
        </div>
      )}
      {!isOnBoard && !resolvedSkin && isOriginalMechaTheme && themeVisual && (
        <span className="absolute right-[3cqw] top-[15cqw] z-30 max-w-[30cqw] truncate border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] px-[1.5cqw] py-[1cqw] text-[5cqw]" title={t('card_skin_theme_mecha_badge', language)}>{themeVisual.serialCode}</span>
      )}
      {(activeCard.growth || 0) > 0 && !isOnBoard && (
        <div className="absolute bottom-[57cqw] left-1/2 z-20 flex -translate-x-1/2 gap-[0.5cqw] border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] px-[1cqw] py-[0.5cqw]">
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
