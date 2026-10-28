import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
 Star, Zap, Shield, Mountain, Waves, Flame, Wind, User, Skull, Leaf, Hammer, Ghost, Bot, Lock,
} from 'lucide-react';
import type { CharacterFaction, CharacterRarityTier, CardData } from '../types';
import { cn, getAssetUrl, getCardSpriteAsset, getCardAttackSpriteAsset, getCardSpriteCoords, getCardCharacterBackdropTheme } from '../lib/utils';
import { getCharacterAttackMotionMeta } from '../lib/attackMotionEngine';
import { SlotAttackMotionBurst, getCharacterAttackLungeAnimation } from './battle/CardAttackMotionEffect';
import { CARD_DATABASE } from '../cardDatabase';
import { getCardPower, getCardStatWithBonus, getNormalizedElement } from '../constants';
import { t } from '../lib/i18n';
import { normalizeCardRarity } from '../lib/cardRarity';
import { getCharacterAssetManifestEntry } from '../content/characterAssetManifest';
import { getCharacterIpProfile, getFactionDef } from '../content/characterIpUtils';
import type { CardSkin } from '../content/cardSkins';
import { getCardSkinByKey } from '../content/cardSkins';
import { getCardSkinThemeVisual } from '../content/cardSkinThemes';
import { resolveCardImage, getCardImageFallback, getCardDisplayModeImageCandidates, type ResolvedCardImage } from '../content/cardImageVariants';
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
 /** Explicitly render the character's Attack Motion image & effect (auto-enabled when isOnBoard is true). */
 showAttackMotion?: boolean;
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
 const coords = getCardSpriteCoords(cardIndex, spriteSource);
 return {
  backgroundImage: `url('${coords.assetUrl}')`,
  backgroundSize: `${coords.cols * 100}% ${coords.rows * 100}%`,
  backgroundPosition: `${coords.xPercent}% ${coords.yPercent}%`,
  backgroundRepeat: 'no-repeat',
  backgroundColor: 'transparent',
 };
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

export const CardItem = React.memo(({ card, className, onClick, isLocked, isSelected, isDragging, hideBackground, isOnBoard, customImage, combatHighlights, lowSpecMode, processedImage, language = 'en', cellElement, hideStats, isMatgo, ignoreBonuses, downloadMode, activeSkin, isDamaged, showAttackMotion }: CardItemProps) => {
 const { cardSkinTheme, cardDisplayMode, lowSpecMode: settingsLowSpecMode } = useGameSettings();
 const reducedMotion = useReducedMotion();
 // Keep live battle stats; do not replace the card with its database record.
 const activeCard = card;
 const performanceMode = Boolean(lowSpecMode || settingsLowSpecMode || reducedMotion);
 const isActionMotionSupported = cardDisplayMode === 'chibi3';
 const shouldHideBg = hideBackground || !!downloadMode;
 const [isFlipping, setIsFlipping] = useState(false);
 const [damageFeedback, setDamageFeedback] = useState(false);
 const [attackBurstCounter, setAttackBurstCounter] = useState<number>(() => (isOnBoard ? 1 : 0));
 const [isAttackBurstActive, setIsAttackBurstActive] = useState<boolean>(() => Boolean(isOnBoard && !performanceMode && isActionMotionSupported));
 const prevOwnerRef = useRef(activeCard.owner);

 useEffect(() => {
 if (!isOnBoard || performanceMode || !isActionMotionSupported) {
  setIsAttackBurstActive(false);
  return;
 }
 setIsAttackBurstActive(true);
 const timer = setTimeout(() => setIsAttackBurstActive(false), 860);
 return () => clearTimeout(timer);
 }, [isOnBoard, attackBurstCounter, performanceMode, isActionMotionSupported]);

 useEffect(() => {
 const previousOwner = prevOwnerRef.current;
 // Update before scheduling so repeated captures and recaptures are detected.
 prevOwnerRef.current = activeCard.owner;
 if (previousOwner != null && previousOwner !== activeCard.owner) {
 setIsFlipping(true);
 if (isOnBoard && isActionMotionSupported) {
  setAttackBurstCounter(c => c + 1);
 }
 const timer = setTimeout(() => setIsFlipping(false), 220);
 return () => clearTimeout(timer);
 }
 setIsFlipping(false);
 }, [activeCard.owner, isOnBoard, isActionMotionSupported]);

 useEffect(() => {
 setDamageFeedback(!!isDamaged);
 if (!isDamaged) return;
 const timer = setTimeout(() => setDamageFeedback(false), 220);
 return () => clearTimeout(timer);
 }, [isDamaged]);

 const visualCardId = useMemo(() => getVisualCardId(activeCard), [activeCard]);
 const useAttackMotionArt = isActionMotionSupported && Boolean(isOnBoard || showAttackMotion);
 const attackMotionMeta = useMemo(() => visualCardId ? getCharacterAttackMotionMeta(visualCardId) : undefined, [visualCardId]);
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
 const attackSprite = visualCardId ? getCardAttackSpriteAsset(visualCardId) : '/cards1_attack.png';
 const displayModeSources = visualCardId ? getCardDisplayModeImageCandidates(visualCardId, cardDisplayMode) : [];
 const orderedSources = useAttackMotionArt
  ? [
     processedImage,
     customImage,
     attackMotionMeta?.cutoutAttackUrl,
     attackMotionMeta?.webpAttackUrl,
     attackSprite,
     resolvedImage.source,
     activeCard.imageUrl,
     defaultSprite,
    ]
  : [
     processedImage,
     customImage,
     ...displayModeSources,
     resolvedImage.source,
     activeCard.imageUrl,
     defaultSprite,
     assetManifestEntry?.targetAssetPath,
     assetManifestEntry?.frontAssetPath,
     assetManifestEntry?.legacySpritePath,
     assetManifestEntry?.fallbackAssetPath,
     assetManifestEntry?.lowSpecFallbackAssetPath,
    ];
 return Array.from(new Set(orderedSources.filter((source): source is string => Boolean(source)).map(src => getAssetUrl(src))));
 }, [activeCard.imageUrl, assetManifestEntry, attackMotionMeta, cardDisplayMode, customImage, processedImage, resolvedImage.source, useAttackMotionArt, visualCardId]);
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
 outerBorder: 'border-2 border-[#1e293b]',
 outerBg: 'bg-[#cbd5e1]',
 surfaceBg: 'bg-[#f8fafc]',
 innerBorder: 'border-2 border-[#475569]',
 windowBorder: 'border-2 border-[#475569]',
 windowBg: 'bg-[#f8fafc]',
 badgeClass: 'bg-[#334155] text-[#f8fafc] border border-[#94a3b8]',
 badgeLabel: 'SILVER',
 statBadge: 'border-2 border-[#475569] bg-[#f8fafc] text-[#0f172a]',
 statBadgeShadow: 'inset 0 0 0 1px #ffffff, 0 2px 5px rgba(51,65,85,0.38)',
 accentColor: '#475569',
 tagLabel: '★★ SILVER PRESTIGE',
 glowShadow: 'shadow-none',
 isHolo: false,
 isGold: false,
 };
 case 'gold':
 return {
 groupName: 'GOLD',
 symbol: '👑',
 outerBorder: 'border-2 border-[#78350f]',
 outerBg: 'bg-[#facc15]',
 surfaceBg: 'bg-[#fffef0]',
 innerBorder: 'border-2 border-[#b45309]',
 windowBorder: 'border-2 border-[#b45309]',
 windowBg: 'bg-[#fffef0]',
 badgeClass: 'bg-[#b45309] text-[#fef9c3] font-black border border-[#fde047]',
 badgeLabel: 'ROYAL GOLD',
 statBadge: 'border-2 border-[#b45309] bg-[#fffbeb] text-[#201d1d]',
 statBadgeShadow: 'inset 0 0 0 1.5px #fde047, 0 2px 6px rgba(180,83,9,0.45)',
 accentColor: '#b45309',
 tagLabel: '★★★ ROYAL GOLD',
 glowShadow: 'shadow-none',
 isHolo: false,
 isGold: true,
 };
 case 'special': {
 const specialLabel = normalizedCardRarity === 'legendary'
 ? '👑 LEGEND'
 : normalizedCardRarity === 'diamond'
 ? '💎 DIAMOND'
 : '✨ SOVEREIGN';
 const specialWindowBg = normalizedCardRarity === 'diamond'
 ? 'bg-[#f0f9ff]'
 : normalizedCardRarity === 'legendary'
 ? 'bg-[#fdf4ff]'
 : 'bg-[#fdf2f8]';
 return {
 groupName: 'SPECIAL',
 symbol: '✨',
 outerBorder: 'border-2 border-[#581c87]',
 outerBg: 'bg-[#f5f3ff]',
 surfaceBg: 'bg-[#fdf2f8]',
 innerBorder: 'border-2 border-[#eab308]',
 windowBorder: 'border-2 border-[#eab308]',
 windowBg: specialWindowBg,
 badgeClass: 'bg-[#581c87] text-[#fef08a] font-black border border-[#facc15]',
 badgeLabel: specialLabel,
 statBadge: 'border-2 border-[#7e22ce] bg-[#faf5ff] text-[#201d1d]',
 statBadgeShadow: 'inset 0 0 0 1.5px #fde047, 0 2px 8px rgba(126,34,206,0.5)',
 accentColor: '#7e22ce',
 tagLabel: '★★★★★ SOVEREIGN ULTRA',
 glowShadow: 'shadow-none',
 isHolo: true,
 isGold: true,
 };
 }
 case 'bronze':
 default:
 return {
 groupName: 'BRONZE',
 symbol: '🥉',
 outerBorder: 'border-2 border-[#4a2810]',
 outerBg: 'bg-[#b87d54]',
 surfaceBg: 'bg-[#fcf7f1]',
 innerBorder: 'border-2 border-[#7c4724]',
 windowBorder: 'border-2 border-[#7c4724]',
 windowBg: 'bg-[#fcf7f1]',
 badgeClass: 'bg-[#5c3419] text-[#ffedd5] border border-[#c8824e]',
 badgeLabel: 'BRONZE',
 statBadge: 'border-2 border-[#7c4724] bg-[#fffdfa] text-[#201d1d]',
 statBadgeShadow: 'inset 0 0 0 1px #fed7aa, 0 1.5px 4px rgba(92,52,25,0.32)',
 accentColor: '#7c4724',
 tagLabel: '★ BRONZE',
 glowShadow: 'shadow-none',
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
 const typeSurface = ({
 water: 'bg-[#d9effc]', fire: 'bg-[#fce1ce]', wind: 'bg-[#e1f3ef]',
 earth: 'bg-[#ebedc8]', land: 'bg-[#ebedc8]', human: 'bg-[#f6edcf]',
 undead: 'bg-[#ece0f4]', elf: 'bg-[#e0efd6]', dwarf: 'bg-[#efe2d1]',
 monster: 'bg-[#e5ead4]', robot: 'bg-[#e3e9ef]', dragon: 'bg-[#f1def0]',
 } as Record<string, string>)[ipProfile?.faction || race || ''] || 'bg-[#f6edcf]';
 const charBackdrop = useMemo(() => getCardCharacterBackdropTheme(visualCardId ?? (Number(activeCard.id) || 1), {
  faction: ipProfile?.faction || (race === 'land' ? 'earth' : race),
  rarity: normalizedCardRarity || rarityTier,
  power: powerScore,
 }), [visualCardId, activeCard.id, ipProfile?.faction, race, normalizedCardRarity, rarityTier, powerScore]);
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
 'z-30 flex items-center justify-center font-mono leading-none tabular-nums select-none backdrop-blur-[0.5px]',
 isOnBoard
 ? 'absolute h-[clamp(16px,20cqw,26px)] min-w-[clamp(16px,20cqw,26px)] rounded-xs px-[clamp(2px,1cqw,4px)]'
 : 'absolute h-[clamp(15px,19cqw,24px)] min-w-[clamp(15px,19cqw,24px)] rounded-xs px-[clamp(1.5px,0.8cqw,3px)]',
 highlighted
 ? 'border-2 border-red-500 bg-red-600 text-white scale-110 z-40'
 : pokemonTheme.statBadge,
 positionClass,
 )}
 style={{
  boxShadow: highlighted ? '0 0 12px rgba(239,68,68,0.9)' : pokemonTheme.statBadgeShadow,
 }}
 title={`${direction} ${stat.total}${delta ? ` (${stat.base}${delta > 0 ? '+' : ''}${delta})` : ''}`}
 >
 <span className={cn(
 isOnBoard
 ? 'text-[clamp(11px,15cqw,22px)] font-black tracking-tight leading-none text-center'
 : 'text-[clamp(10px,15cqw,20px)] font-black tracking-tight leading-none text-center',
 !highlighted && delta > 0 && 'text-[#16a34a]',
 !highlighted && delta < 0 && 'text-[#dc2626]',
 )}>
 {stat.total}
 </span>
 {(delta !== 0 || stat.skillBonus > 0 || stat.equipBonus !== 0) && (
 <span className="absolute -top-[3px] -right-[3px] flex h-[clamp(9px,6cqw,13px)] min-w-[clamp(9px,6cqw,13px)] items-center justify-center rounded-full bg-slate-900 px-[1px] text-[clamp(6.5px,4.5cqw,9px)] font-black text-white shadow-xs">
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
 data-card-rarity={rarityGroup}
 data-card-prestige={charBackdrop.isHighPrestige ? 'high' : 'standard'}
 onKeyDown={onClick ? event => {
 if (event.key === 'Enter' || event.key === ' ') {
 event.preventDefault();
 onClick();
 }
 } : undefined}
 >
 {/* Outer Metallic Bezel Frame (Bronze / Silver / Gold / Special) */}
 <div
  className={cn(
   'pointer-events-none absolute inset-0 z-0 rounded-sm',
   !shouldHideBg && !showOwnership && pokemonTheme.outerBorder,
   showOwnership && owner === 'player' && 'border-2 border-[#2563eb] bg-[#2563eb]',
   showOwnership && owner === 'ai' && 'border-2 border-[#dc2626] bg-[#dc2626]',
   shouldHideBg && !showOwnership && 'border border-transparent',
  )}
  style={
   !shouldHideBg && !showOwnership
    ? {
       background: charBackdrop.frameGradient,
       borderColor: charBackdrop.frameOuterBorderHex,
       boxShadow: charBackdrop.frameBoxShadow,
      }
    : undefined
  }
 />

 {/* Inner Card Body Surface with Double Metallic Bevel Rim */}
 {!shouldHideBg && (
  <div
   className={cn(
    'pointer-events-none absolute inset-[4.6cqw] z-0 rounded-xs',
    showOwnership
     ? owner === 'player'
      ? 'bg-[#dbeafe] border-2 border-[#2563eb]/50'
      : 'bg-[#fee2e2] border-2 border-[#dc2626]/50'
     : cn(typeSurface, pokemonTheme.innerBorder),
   )}
   style={
    !showOwnership
     ? {
        boxShadow:
         rarityGroup === 'gold' || rarityGroup === 'special'
          ? 'inset 0 0 0 1px #fef08a, 0 0 0 1px rgba(254,240,138,0.85)'
          : rarityGroup === 'silver'
          ? 'inset 0 0 0 1px #ffffff, 0 0 0 1px rgba(248,250,252,0.8)'
          : 'inset 0 0 0 1px rgba(254,215,170,0.55)',
       }
     : undefined
   }
  />
 )}

 {/* Metallic Corner Filigree & Royal Prestige Ornaments SVG */}
 {!shouldHideBg && !showOwnership && (
  <svg
   viewBox="0 0 100 140"
   preserveAspectRatio="none"
   className="pointer-events-none absolute inset-0 z-16 h-full w-full"
   aria-hidden="true"
  >
   {/* 4 Corner Metallic Brackets (Bronze: Copper Rivets, Silver: Double Chrome Chevrons, Gold/Special: Royal Filigree + Diamond Studs) */}
   <g
    stroke={
     rarityGroup === 'special'
      ? '#fef08a'
      : rarityGroup === 'gold'
      ? '#78350f'
      : rarityGroup === 'silver'
      ? '#1e293b'
      : '#4a2810'
    }
    fill={
     rarityGroup === 'special' || rarityGroup === 'gold'
      ? '#fde047'
      : rarityGroup === 'silver'
      ? '#f8fafc'
      : '#d99b6c'
    }
    strokeWidth="1.2"
   >
    {/* Top-Left Corner */}
    <path d="M 2,14 L 2,2 L 14,2" fill="none" strokeWidth="1.8" />
    {/* Top-Right Corner */}
    <path d="M 86,2 L 98,2 L 98,14" fill="none" strokeWidth="1.8" />
    {/* Bottom-Left Corner */}
    <path d="M 2,126 L 2,138 L 14,138" fill="none" strokeWidth="1.8" />
    {/* Bottom-Right Corner */}
    <path d="M 86,138 L 98,138 L 98,126" fill="none" strokeWidth="1.8" />

    {/* High-Prestige Filigree Diamonds & Inner Scrollwork for Silver / Gold / Special / High-Power */}
    {(rarityGroup !== 'bronze' || charBackdrop.isHighPrestige) && (
     <>
      <polygon points="5.5,2.5 8,5.5 5.5,8.5 3,5.5" />
      <polygon points="94.5,2.5 97,5.5 94.5,8.5 92,5.5" />
      <polygon points="5.5,131.5 8,134.5 5.5,137.5 3,134.5" />
      <polygon points="94.5,131.5 97,134.5 94.5,137.5 92,134.5" />
     </>
    )}

    {/* Royal Gold & Sovereign Special Extra Inner Corner Filigree Lines & Crown Gems */}
    {(rarityGroup === 'gold' || rarityGroup === 'special') && (
     <>
      <path d="M 5,18 L 5,5 L 18,5" fill="none" stroke="#fef08a" strokeWidth="1.1" />
      <path d="M 82,5 L 95,5 L 95,18" fill="none" stroke="#fef08a" strokeWidth="1.1" />
      <path d="M 5,122 L 5,135 L 18,135" fill="none" stroke="#fef08a" strokeWidth="1.1" />
      <path d="M 82,135 L 95,135 L 95,122" fill="none" stroke="#fef08a" strokeWidth="1.1" />
     </>
    )}
   </g>
  </svg>
 )}

 {/* Special Holographic Foil Rainbow Sheen */}
 {pokemonTheme.isHolo && !performanceMode && !isOnBoard && !shouldHideBg && (
 <div
 className="pointer-events-none absolute inset-0 z-15 overflow-hidden rounded-[inherit] mix-blend-color-dodge opacity-55"
 style={{
 background: 'linear-gradient(115deg, transparent 15%, rgba(244,63,94,0.32) 32%, rgba(250,204,21,0.34) 48%, rgba(168,85,247,0.32) 64%, rgba(6,182,212,0.32) 80%, transparent 92%)',
 }}
 />
 )}

 {/* Gold Foil Metallic Sheen */}
 {pokemonTheme.isGold && !performanceMode && !isOnBoard && !shouldHideBg && (
 <div
 className="pointer-events-none absolute inset-0 z-15 overflow-hidden rounded-[inherit] mix-blend-overlay opacity-45"
 style={{
 background: 'linear-gradient(135deg, transparent 22%, rgba(254,240,138,0.72) 48%, rgba(250,204,21,0.35) 58%, transparent 78%)',
 }}
 />
 )}

 {/* Top Header - Pokemon TCG format with Prestige Ribbon */}
 {!isOnBoard && (
 <div
  className="absolute inset-x-[6cqw] top-[5.2cqw] z-20 flex h-[16cqw] flex-col justify-between leading-none"
 >
 <div className="flex items-center justify-between gap-[1.2cqw]">
 <div className="flex min-w-0 items-center gap-[1cqw]">
 <span
  className={cn('truncate rounded-xs px-[1.6cqw] py-[0.5cqw] text-[4.6cqw] font-black uppercase tracking-wider', pokemonTheme.badgeClass)}
  style={
   rarityGroup === 'gold'
    ? { background: 'linear-gradient(135deg, #92400e 0%, #eab308 50%, #78350f 100%)', color: '#fef9c3' }
    : rarityGroup === 'special'
    ? { background: 'linear-gradient(135deg, #581c87 0%, #9333ea 50%, #ca8a04 100%)', color: '#fef08a' }
    : rarityGroup === 'silver'
    ? { background: 'linear-gradient(135deg, #1e293b 0%, #475569 50%, #334155 100%)', color: '#f8fafc' }
    : undefined
  }
 >
 {pokemonTheme.symbol} {pokemonTheme.badgeLabel}
 </span>
 <span className="shrink-0 text-[4.6cqw] font-bold text-[#201d1d] tabular-nums">
 Lv.{activeCard.level}
 </span>
 </div>
 <div
  className="flex shrink-0 items-center gap-[0.8cqw] rounded-xs px-[1.2cqw] py-[0.3cqw]"
  style={
   charBackdrop.isHighPrestige
    ? {
       background: 'linear-gradient(135deg, rgba(254,249,195,0.92) 0%, rgba(253,224,71,0.85) 100%)',
       border: '1px solid #b45309',
      }
    : undefined
  }
  title={t('wiki_power', language)}
 >
 <span className="text-[4.8cqw] font-black text-[#b45309]">⚡</span>
 <span className="text-[8cqw] font-black tabular-nums text-[#201d1d]">{powerScore}{hasPowerBonus && '+'}</span>
 <FactionIcon className="h-[6cqw] w-[6cqw] rounded-full border border-[#201d1d]/30 bg-[#fdfcfc]/90 p-[0.7cqw]" />
 </div>
 </div>
 <div
  className="flex min-w-0 items-center justify-between gap-[1cqw] border-t border-[#201d1d]/20 pt-[0.9cqw] px-[1cqw]"
  style={
   charBackdrop.isHighPrestige
    ? {
       background: 'linear-gradient(90deg, rgba(254,240,138,0.45) 0%, rgba(255,255,255,0.75) 50%, rgba(254,240,138,0.45) 100%)',
      }
    : undefined
  }
 >
 <span className="min-w-0 truncate text-[7.2cqw] font-black tracking-tight text-[#201d1d]" title={displayCardName}>
 {displayCardName}
 </span>
 <span
  className="shrink-0 text-[4cqw] font-black tracking-tighter"
  style={{
   color:
    rarityGroup === 'special'
     ? '#7e22ce'
     : rarityGroup === 'gold'
     ? '#b45309'
     : rarityGroup === 'silver'
     ? '#334155'
     : '#7c4724',
  }}
 >
 {'★'.repeat(charBackdrop.prestigeStarCount)}
 </span>
 </div>
 </div>
 )}

 {/* Illustration window: 3-axis backdrop (Race/Faction × Rarity/Grade × Power Tier) with Metallic Double Rim */}
 <div
  className={cn(
   'pointer-events-none absolute z-10 overflow-hidden [container-type:size]',
   isOnBoard ? 'inset-[4.6cqw]' : 'inset-x-[6.2cqw] bottom-[26cqw] top-[22.5cqw]',
   showOwnership
    ? cn(pokemonTheme.windowBg, owner === 'player' ? 'ring-1 ring-[#2563eb]/50' : 'ring-1 ring-[#dc2626]/50')
    : pokemonTheme.windowBg,
   pokemonTheme.windowBorder,
  )}
  style={{
   background: charBackdrop.windowCssBackground,
   backgroundColor: charBackdrop.bgLight,
   boxShadow: charBackdrop.windowBoxShadow,
  }}
  data-backdrop-faction={charBackdrop.faction}
  data-backdrop-rarity={charBackdrop.rarityGroup}
  data-backdrop-power-tier={charBackdrop.powerTier}
 >
  {/* Layer 1: Geometric Rarity Magic Circle & Power Aura SVG behind character */}
  <svg
   viewBox="0 0 100 100"
   className="pointer-events-none absolute inset-0 z-0 h-full w-full"
   aria-hidden="true"
  >
   {/* Power Tier concentric energy rings (Tier 1..5) */}
   <circle
    cx="50"
    cy="47"
    r={charBackdrop.powerTier >= 4 ? 42 : 38}
    fill="none"
    stroke={charBackdrop.accentHex}
    strokeWidth={charBackdrop.powerTier >= 4 ? '1.3' : '0.8'}
    strokeOpacity={0.22 + charBackdrop.powerTier * 0.06}
    strokeDasharray={charBackdrop.powerTier >= 3 ? '3 2' : '5 4'}
   />
   {charBackdrop.powerTier >= 2 && (
    <circle
     cx="50"
     cy="47"
     r="31"
     fill="none"
     stroke={charBackdrop.rarityBorderHex}
     strokeWidth="1"
     strokeOpacity={0.28 + charBackdrop.powerTier * 0.05}
    />
   )}
   {charBackdrop.powerTier >= 4 && (
    <circle
     cx="50"
     cy="47"
     r="23"
     fill="none"
     stroke={charBackdrop.accentHex}
     strokeWidth="1.2"
     strokeOpacity="0.45"
     strokeDasharray="2 1.5"
    />
   )}

   {/* Rarity Grade Emblem Frame (Bronze: Ring, Silver: Diamond/Dual Ring, Gold: 8-Point Star Octagram, Special: 12-Point Astral Seal) */}
   {charBackdrop.rarityGroup === 'bronze' && (
    <circle
     cx="50"
     cy="47"
     r="34"
     fill="none"
     stroke="#9a5b32"
     strokeWidth="1.1"
     strokeOpacity="0.32"
    />
   )}
   {charBackdrop.rarityGroup === 'silver' && (
    <g stroke="#475569" strokeOpacity="0.38" fill="none">
     <polygon points="50,11 86,47 50,83 14,47" strokeWidth="1.1" />
     <circle cx="50" cy="47" r="34" strokeWidth="1" strokeDasharray="4 2" />
    </g>
   )}
   {charBackdrop.rarityGroup === 'gold' && (
    <g stroke="#ca8a04" strokeOpacity="0.46" fill="none">
     <polygon points="50,10 87,47 50,84 13,47" strokeWidth="1.3" />
     <rect x="24" y="21" width="52" height="52" strokeWidth="1.1" />
     <circle cx="50" cy="47" r="36" strokeWidth="1.2" />
    </g>
   )}
   {charBackdrop.rarityGroup === 'special' && (
    <g stroke="#9333ea" strokeOpacity="0.52" fill="none">
     <polygon points="50,8 89,47 50,86 11,47" strokeWidth="1.4" />
     <rect x="22" y="19" width="56" height="56" strokeWidth="1.2" />
     <polygon points="50,14 79,64 21,64" strokeWidth="1" stroke="#06b6d4" strokeOpacity="0.45" />
     <polygon points="50,80 79,30 21,30" strokeWidth="1" stroke="#ec4899" strokeOpacity="0.45" />
     <circle cx="50" cy="47" r="39" strokeWidth="1.4" strokeDasharray="2 1.5" />
    </g>
   )}
  </svg>

  {/* Layer 2: Subtle Faction/Race Emblem Watermark behind character */}
  <div className="pointer-events-none absolute inset-0 z-1 flex items-center justify-center">
   <FactionIcon
    className="h-[58cqw] w-[58cqw] opacity-[0.14]"
    style={{ color: charBackdrop.accentHex }}
    strokeWidth={1.5}
   />
  </div>

  {/* Layer 3: Dynamic Attack Motion Aura Burst BEHIND the character (z-[5], never covers the character!) */}
  {isAttackBurstActive && visualCardId && (
   <SlotAttackMotionBurst
    cardId={visualCardId}
    isPlayer={owner !== 'ai'}
    language={language}
    lowSpecMode={performanceMode}
    triggerKey={attackBurstCounter}
   />
  )}

  {/* Layer 4: Foreground Character Sprite / Image (exact 256:296 aspect ratio, z-10 in front of all effects) */}
  {currentImageSource ? (
   isSpriteSheet(currentImageSource) && visualCardId ? (
    <>
     <img key={currentImageSource} src={currentImageSource} alt="" className="hidden" aria-hidden="true" referrerPolicy="no-referrer" onError={() => setImageSourceIndex(currentIndex => currentIndex + 1)} />
     <motion.div
      key={`sprite-${visualCardId}-${attackBurstCounter}`}
      role="img"
      aria-label={displayCardName}
      animate={
       isAttackBurstActive && !performanceMode && attackMotionMeta
        ? getCharacterAttackLungeAnimation(attackMotionMeta.attackAnimation)
        : { scale: useAttackMotionArt ? 1.05 : 1, x: 0, y: 0, rotate: 0 }
      }
      transition={{ duration: performanceMode ? 0 : 0.42, ease: 'easeOut' }}
      className={cn(
       'absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2',
       isOnBoard ? 'w-[min(92cqw,92cqh)]' : 'w-[min(88cqw,88cqh)]'
      )}
      style={{ ...getSpritePosition(visualCardId, currentImageSource), aspectRatio: '256 / 296' }}
     />
    </>
   ) : (
    <motion.img
     key={`${currentImageSource}-${attackBurstCounter}`}
     src={currentImageSource}
     alt={displayCardName}
     animate={
      isAttackBurstActive && !performanceMode && attackMotionMeta
       ? getCharacterAttackLungeAnimation(attackMotionMeta.attackAnimation)
       : { scale: useAttackMotionArt ? 1.05 : 1, x: 0, y: 0, rotate: 0 }
     }
     transition={{ duration: performanceMode ? 0 : 0.42, ease: 'easeOut' }}
     className="relative z-10 h-full w-full object-contain"
     referrerPolicy="no-referrer"
     onError={() => setImageSourceIndex(currentIndex => currentIndex + 1)}
    />
   )
  ) : (
   <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-[3cqw] px-[8cqw] text-center">
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

  {/* Layer 5: Bottom 5-Step Power Tier Gauge Bar inside Character Window */}
  <div className="pointer-events-none absolute inset-x-[3cqw] bottom-[1.4cqw] z-20 flex items-center gap-[1cqw]">
   {[1, 2, 3, 4, 5].map(step => {
    const active = step <= charBackdrop.powerTier;
    return (
     <span
      key={step}
      className="h-[1.6cqw] flex-1 border border-[#201d1d]/30"
      style={{
       backgroundColor: active ? charBackdrop.accentHex : 'rgba(253,252,252,0.55)',
       boxShadow: active && charBackdrop.powerTier >= 4 ? `0 0 4px ${charBackdrop.glowRgba}` : undefined,
      }}
     />
    );
   })}
  </div>
 </div>

 {/* Board view compact top-left power indicator */}
 {isOnBoard && <div className={cn(
 'absolute left-[2cqw] top-[2cqw] z-30 flex items-center gap-[0.8cqw] border border-[rgba(15,0,0,0.2)] bg-[#fdfcfc]/95 px-[1.5cqw] py-[1cqw] leading-none rounded-xs',
 )} title={t('wiki_power', language)}>
 <Zap className="h-[5cqw] w-[5cqw] text-[#b45309]" strokeWidth={2} />
 <span className="text-[7cqw] font-black tabular-nums">{powerScore}</span>
 {hasPowerBonus && <span className="text-[4.5cqw] font-bold">+</span>}
 </div>}

 {/* Direction stats: Always displayed in North / East / South / West layout (Cross Diamond HUD) */}
 {!hideStats && (
 <>
 {renderStatBadge(0, isOnBoard ? 'top-[0.5cqw] left-1/2 -translate-x-1/2' : 'top-[1cqw] left-1/2 -translate-x-1/2')}
 {renderStatBadge(1, isOnBoard ? 'right-[0.5cqw] top-1/2 -translate-y-1/2' : 'right-[1cqw] top-1/2 -translate-y-1/2')}
 {renderStatBadge(2, isOnBoard ? 'bottom-[0.5cqw] left-1/2 -translate-x-1/2' : 'bottom-[1.5cqw] left-1/2 -translate-x-1/2')}
 {renderStatBadge(3, isOnBoard ? 'left-[0.5cqw] top-1/2 -translate-y-1/2' : 'left-[1cqw] top-1/2 -translate-y-1/2')}
 </>
 )}

 {/* Bottom Info Footer - Pokemon TCG attack move / ability style (only on full TCG card, hidden on 3x3 board so South stat & character stay unobstructed) */}
 {!isOnBoard && (
 <div className="absolute z-20 flex flex-col justify-center inset-x-[5.5cqw] bottom-[3.5cqw] h-[21cqw] gap-[1cqw]">
 {abilityDescription && (
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
 {isLocked && <Lock className="h-[6cqw] w-[6cqw] shrink-0 text-[#ca8a04]" aria-label={t('profile_locked_label', language)} />}
 {owner ? (
 <span className="flex min-w-0 items-center gap-[1cqw] font-bold" title={ownerLabel}>
 {owner === 'player' ? <User className="h-[5.5cqw] w-[5.5cqw] shrink-0" /> : <Bot className="h-[5.5cqw] w-[5.5cqw] shrink-0" />}
 <span className="truncate">{ownerLabel}</span>
 {(factionDef || race) && (
 <FactionIcon className="h-[4.8cqw] w-[4.8cqw] shrink-0 opacity-80" />
 )}
 </span>
 ) : factionDef ? (
 <span className="flex min-w-0 items-center gap-[1cqw]" title={t(factionDef.nameKey, language)}>
 <FactionIcon className="h-[5.5cqw] w-[5.5cqw] shrink-0 text-[#646262]" />
 <span className="truncate text-[#646262]">{t(factionDef.nameKey, language)}</span>
 </span>
 ) : race ? <FactionIcon className="h-[5.5cqw] w-[5.5cqw] shrink-0 text-[#646262]" /> : null}
 </div>
 {!abilityDescription && (
 <span className="shrink-0 text-[4.5cqw] text-[#646262] font-semibold">
 {t('type_normal', language) || 'BASIC CARD'}
 </span>
 )}
 </div>
 <div className="flex items-center justify-between gap-[2cqw] border-t border-[#201d1d]/15 pt-[1cqw] text-[4.5cqw] leading-none">
 <span className="truncate tabular-nums text-[#646262]">#{String(visualCardId ?? activeCard.id).padStart(3, '0')}</span>
 <span className="flex items-center gap-[1cqw] font-bold" style={{ color: rarityAccent }}>
 <Star className="h-[4.5cqw] w-[4.5cqw]" fill={rarityAccent} />
 {pokemonTheme.tagLabel}
 </span>
 </div>
 </div>
 )}

 {!isOnBoard && resolvedSkin && !downloadMode && (
 <div className="absolute right-[9cqw] top-[28cqw] z-30 flex max-w-[32cqw] items-center gap-[1cqw] border border-[#201d1d]/25 bg-[#fff9e9] px-[1.5cqw] py-[1cqw] text-[5cqw] leading-none" title={t(resolvedSkin.nameKey, language)}>
 <span>{resolvedSkin.fallbackEmoji}</span>
 <span className="truncate">{t(resolvedSkin.nameKey, language)}</span>
 </div>
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
 prev.showAttackMotion === next.showAttackMotion &&
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
