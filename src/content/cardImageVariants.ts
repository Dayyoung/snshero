/**
 * Card Image Variants — Full card skin swap data layer for all 110 cards.
 *
 * Rendering priority (highest first):
 *   1. custom image (user-uploaded / processed)
 *   2. selected skin variant (activeSkin from useCardSkins)
 *   3. theme variant (cardSkinTheme from GameSettings, e.g. original_mecha)
 *   4. card.imageUrl (database-sourced image)
 *   5. fallback (faction-colored placeholder with emoji)
 *
 * Every card (ID 1–110) is guaranteed at least one fallback variant.
 * Seasonal localStorage keys follow the pattern `hero_card_img_variant_{season}`.
 */

import type { CharacterRarityTier } from '../types';
import type { CardSkinThemeId } from './cardSkinThemes';
import { getCardSkinThemeVisual } from './cardSkinThemes';
import type { CardSkin } from './cardSkins';
import { getAssetUrl, getCardSpriteAsset } from '../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────

export type CardImageVariantTheme = 'default' | 'original_mecha' | 'skin';

export interface CardImageFallback {
  cardId: number;
  primaryColor: string;
  accentColor: string;
  emoji: string;
  /** i18n key for a short label shown when no image is available */
  labelKey: string;
}

export interface CardImageVariant {
  cardId: number;
  variantId: string;
  theme: CardImageVariantTheme;
  rarity: CharacterRarityTier;
  /** Actual asset path — null when not yet generated */
  assetPath: string | null;
  /** Generation prompt for AI art pipeline */
  generationPrompt: string;
  fallback: CardImageFallback;
}

// ─── Storage Key ──────────────────────────────────────────────────────────

export const CARD_IMAGE_VARIANT_STORAGE_KEY = 'hero_card_img_variant';

// ─── Faction Color / Emoji Map ────────────────────────────────────────────

interface FactionVisualDef {
  primaryColor: string;
  accentColor: string;
  emoji: string;
  labelKey: string;
}

const FACTION_VISUAL: Record<string, FactionVisualDef> = {
  water:   { primaryColor: '#3b82f6', accentColor: '#1d4ed8', emoji: '💧', labelKey: 'element_water' },
  fire:    { primaryColor: '#ef4444', accentColor: '#b91c1c', emoji: '🔥', labelKey: 'element_fire' },
  wind:    { primaryColor: '#0ea5e9', accentColor: '#0369a1', emoji: '🌪️', labelKey: 'element_wind' },
  earth:   { primaryColor: '#92400e', accentColor: '#78350f', emoji: '🪨', labelKey: 'element_earth' },
  human:   { primaryColor: '#f59e0b', accentColor: '#b45309', emoji: '⚔️', labelKey: 'faction_human' },
  undead:  { primaryColor: '#7c3aed', accentColor: '#4c1d95', emoji: '💀', labelKey: 'faction_undead' },
  elf:     { primaryColor: '#22c55e', accentColor: '#166534', emoji: '🧝', labelKey: 'faction_elf' },
  dwarf:   { primaryColor: '#f97316', accentColor: '#9a3412', emoji: '⛏️', labelKey: 'faction_dwarf' },
  monster: { primaryColor: '#a855f7', accentColor: '#6b21a8', emoji: '👹', labelKey: 'faction_monster' },
  robot:   { primaryColor: '#64748b', accentColor: '#334155', emoji: '🤖', labelKey: 'faction_robot' },
  dragon:  { primaryColor: '#dc2626', accentColor: '#7f1d1d', emoji: '🐉', labelKey: 'faction_dragon' },
};

// ─── Card-to-Faction Mapping ──────────────────────────────────────────────

/**
 * Maps card IDs 1–110 to their faction for visual fallback assignment.
 * Derived from the card database structure:
 *   IDs   1–10  → water
 *   IDs  11–20  → fire
 *   IDs  21–30  → wind (air)
 *   IDs  31–40  → earth
 *   IDs  41–50  → human
 *   IDs  51–60  → undead
 *   IDs  61–70  → elf
 *   IDs  71–80  → dwarf
 *   IDs  81–90  → monster
 *   IDs  91–100 → robot
 *   IDs 101–110 → dragon
 */
function getCardFaction(cardId: number): string {
  if (cardId >= 1 && cardId <= 10) return 'water';
  if (cardId >= 11 && cardId <= 20) return 'fire';
  if (cardId >= 21 && cardId <= 30) return 'wind';
  if (cardId >= 31 && cardId <= 40) return 'earth';
  if (cardId >= 41 && cardId <= 50) return 'human';
  if (cardId >= 51 && cardId <= 60) return 'undead';
  if (cardId >= 61 && cardId <= 70) return 'elf';
  if (cardId >= 71 && cardId <= 80) return 'dwarf';
  if (cardId >= 81 && cardId <= 90) return 'monster';
  if (cardId >= 91 && cardId <= 100) return 'robot';
  if (cardId >= 101 && cardId <= 110) return 'dragon';
  return 'human'; // fallback
}

/** Boss cards (IDs 10, 20, 30, 40, 50, 60, 70, 80, 90, 100) get a slightly elevated visual */
function isBossCard(cardId: number): boolean {
  return cardId % 10 === 0;
}

// ─── Fallback Builders ────────────────────────────────────────────────────

function buildCardImageFallback(cardId: number): CardImageFallback {
  const faction = getCardFaction(cardId);
  const visual = FACTION_VISUAL[faction] ?? FACTION_VISUAL['human'];
  const boss = isBossCard(cardId);
  return {
    cardId,
    primaryColor: visual.primaryColor,
    accentColor: boss ? visual.accentColor : visual.primaryColor,
    emoji: boss ? '👑' : visual.emoji,
    labelKey: visual.labelKey,
  };
}

/** Default variant generation prompt for any card */
function buildDefaultGenerationPrompt(cardId: number): string {
  const faction = getCardFaction(cardId);
  const boss = isBossCard(cardId);
  const tier = boss ? 'boss-tier' : 'standard';
  return [
    `SNSHero TCG card art for Card #${cardId}`,
    `faction: ${faction}`,
    `tier: ${tier}`,
    'dynamic pose, clean silhouette, stat-legibility-friendly composition',
    'no existing IP references, no trademarked designs',
  ].join(' | ');
}

// ─── All 110 Card Default Variants ────────────────────────────────────────

const ALL_CARD_DEFAULT_VARIANTS: CardImageVariant[] = Array.from(
  { length: 110 },
  (_, i) => {
    const cardId = i + 1;
    const fallback = buildCardImageFallback(cardId);
    return {
      cardId,
      variantId: `img_default_${String(cardId).padStart(3, '0')}`,
      theme: 'default' as const,
      rarity: isBossCard(cardId) ? 'gold' as const : 'bronze' as const,
      assetPath: null,
      generationPrompt: buildDefaultGenerationPrompt(cardId),
      fallback,
    };
  },
);

// ─── Lookup Maps ──────────────────────────────────────────────────────────

const DEFAULT_VARIANT_BY_CARD_ID: Map<number, CardImageVariant> = new Map(
  ALL_CARD_DEFAULT_VARIANTS.map((v) => [v.cardId, v]),
);

// ─── Public API ───────────────────────────────────────────────────────────

/** Get the default image variant for any card ID (guaranteed fallback for all 110 cards). */
export function getDefaultCardImageVariant(cardId: number): CardImageVariant | undefined {
  return DEFAULT_VARIANT_BY_CARD_ID.get(cardId);
}

/** Get the image fallback data for any card ID. */
export function getCardImageFallback(cardId: number): CardImageFallback {
  return (
    DEFAULT_VARIANT_BY_CARD_ID.get(cardId)?.fallback ??
    buildCardImageFallback(cardId)
  );
}

// ─── Rendering Priority Resolver ──────────────────────────────────────────

export interface ResolvedCardImage {
  /** The highest-priority image source (URL or null) */
  source: string | null;
  /** If no image source, this fallback provides colors/emoji for placeholder rendering */
  fallback: CardImageFallback;
  /** Which level of the priority chain produced the source */
  priority: 'custom' | 'skin' | 'theme' | 'imageUrl' | 'fallback';
  /** Active skin, if one is applied */
  activeSkin?: CardSkin;
  /** Theme variant visual, if theme is active */
  themeVisual?: ReturnType<typeof getCardSkinThemeVisual>;
}

/**
 * Resolve card image following the rendering priority:
 *   custom > selected variant > theme variant > imageUrl > fallback
 */
export function resolveCardImage(
  cardId: number,
  options: {
    customImage?: string | null;
    processedImage?: string | null;
    activeSkin?: CardSkin | null;
    cardSkinTheme?: CardSkinThemeId;
    imageUrl?: string;
  } = {},
): ResolvedCardImage {
  const {
    customImage,
    processedImage,
    activeSkin,
    cardSkinTheme = 'default',
    imageUrl,
  } = options;

  const fallback = getCardImageFallback(cardId);

  // Priority 1: Processed image (AI-generated, pre-rendered)
  if (processedImage) {
    return { source: processedImage, fallback, priority: 'custom', activeSkin: activeSkin ?? undefined };
  }

  // Priority 1b: Custom image (user-uploaded)
  if (customImage) {
    return { source: customImage, fallback, priority: 'custom', activeSkin: activeSkin ?? undefined };
  }

  // Priority 2: Selected skin variant
  if (activeSkin) {
    // Skins don't currently have assetPaths — they're cosmetic overlays
    // The skin's fallback colors are used for the indicator badge on CardItem
    // If the skin had an assetPath, it would be used here
    if (imageUrl) {
      return { source: imageUrl, fallback, priority: 'skin', activeSkin };
    }
    return { source: null, fallback, priority: 'skin', activeSkin };
  }

  // Priority 3: Theme variant (e.g., original_mecha)
  const themeVisual = getCardSkinThemeVisual(cardSkinTheme, cardId);
  if (themeVisual && themeVisual.assetPath) {
    return { source: themeVisual.assetPath, fallback, priority: 'theme', themeVisual };
  }
  // Theme visual exists but has no asset — still mark as theme priority
  // so CardItem can render the mecha overlay instead of an image
  if (themeVisual) {
    const defaultSprite = getCardSpriteAsset(cardId);
    const resolvedUrl = imageUrl ? getAssetUrl(imageUrl) : getAssetUrl(defaultSprite);
    return { source: resolvedUrl, fallback, priority: 'theme', themeVisual };
  }

  // Priority 4: Database image URL
  const defaultSprite = getCardSpriteAsset(cardId);
  const resolvedUrl = imageUrl ? getAssetUrl(imageUrl) : getAssetUrl(defaultSprite);
  return { source: resolvedUrl, fallback, priority: 'imageUrl' };

  // Priority 5: Fallback (faction-colored placeholder)
  return { source: null, fallback, priority: 'fallback' };
}

/**
 * Get all available image variant IDs for a given card.
 * Currently returns the default variant ID — can be extended with skin-based variants.
 */
export function getCardImageVariants(cardId: number): CardImageVariant[] {
  const variants: CardImageVariant[] = [];
  const defaultVariant = DEFAULT_VARIANT_BY_CARD_ID.get(cardId);
  if (defaultVariant) {
    variants.push(defaultVariant);
  }
  return variants;
}

/** Check if a card has at least one real image source beyond the fallback. */
export function hasCardImageSource(cardId: number, imageUrl?: string): boolean {
  return Boolean(imageUrl);
}
