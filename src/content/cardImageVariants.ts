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

const ANIME_CUTOUT_FILENAME_BY_ID: Record<number, string> = {
  1: '001_Aquaris.png',
  2: '002_Naiad.png',
  3: '003_Undine.png',
  4: '004_Kelpie.png',
  5: '005_Aqualord.png',
  6: '006_Leviathan.png',
  7: '007_Gargantia.png',
  8: '008_Cascade.png',
  9: '009_Kraken.png',
  10: '010_Poseidon.png',
  11: '011_Ignis.png',
  12: '012_Salamander.png',
  13: '013_Belphegor.png',
  14: '014_Pyro.png',
  15: '015_Balrog.png',
  16: '016_Muspel.png',
  17: '017_Ivar.png',
  18: '018_Ashel_the_Immortal.png',
  19: '019_Phoenix.png',
  20: '020_Ignisius.png',
  21: '021_Zephyros.png',
  22: '022_Sylph.png',
  23: '023_Sylphid.png',
  24: '024_Harpy.png',
  25: '025_Aeolus.png',
  26: '026_Tempest.png',
  27: '027_Cyclone.png',
  28: '028_Zeusphere.png',
  29: '029_Raijin.png',
  30: '030_Wind_God_Toram.png',
  31: '031_Gaia.png',
  32: '032_Gnome.png',
  33: '033_Terra.png',
  34: '034_Gorgon.png',
  35: '035_Obelisk.png',
  36: '036_Grandrock.png',
  37: '037_Rokta.png',
  38: '038_Orihalcon.png',
  39: '039_Atlas.png',
  40: '040_Colossus.png',
  41: '041_Kadan.png',
  42: '042_Elwin.png',
  43: '043_Balian.png',
  44: '044_Kaze.png',
  45: '045_Gawain.png',
  46: '046_Rondol.png',
  47: '047_Gilgamesh.png',
  48: '048_Robinyard.png',
  49: '049_Hercul.png',
  50: '050_Aleksandar.png',
  51: '051_Walker.png',
  52: '052_Ghoul.png',
  53: '053_Carrion.png',
  54: '054_Arachne.png',
  55: '055_Patchwork.png',
  56: '056_Cardis.png',
  57: '057_Stone_Gargoyle.png',
  58: '058_Sidragosa.png',
  59: '059_Keltus.png',
  60: '060_Death_Knight_Artus.png',
  61: '061_Lucian.png',
  62: '062_Celia.png',
  63: '063_Eliana.png',
  64: '064_Titania.png',
  65: '065_Sylvania.png',
  66: '066_Malfuon.png',
  67: '067_Vezax.png',
  68: '068_Kaeltor.png',
  69: '069_Gandar.png',
  70: '070_Aila.png',
  71: '071_Balbo.png',
  72: '072_Fredo.png',
  73: '073_Samwy.png',
  74: '074_Grimli.png',
  75: '075_Magnis.png',
  76: '076_Brandy.png',
  77: '077_Muradi.png',
  78: '078_Thorgrim.png',
  79: '079_Berryforge.png',
  80: '080_Ironforge.png',
  81: '081_Fenrir.png',
  82: '082_Minotaur.png',
  83: '083_Jormungandr.png',
  84: '084_Griffon.png',
  85: '085_Byra.png',
  86: '086_Leonar.png',
  87: '087_Barghest.png',
  88: '088_Ursoc.png',
  89: '089_Medusa_Gorgo.png',
  90: '090_Pegasus.png',
  91: '091_Spiderbot.png',
  92: '092_Chronos.png',
  93: '093_Sentinel.png',
  94: '094_Devastator.png',
  95: '095_Goliath.png',
  96: '096_Siege_Engine.png',
  97: '097_Hyperion_Prime.png',
  98: '098_Ironclad.png',
  99: '099_Magitech_Golem.png',
  100: '100_Omega_Weapon.png',
  101: '101_Drake.png',
  102: '102_Wyverny.png',
  103: '103_Netherdragon.png',
  104: '104_Bahamut.png',
  105: '105_Spikedragon.png',
  106: '106_Earth_Dragon_Terra.png',
  107: '107_Ysela.png',
  108: '108_Alexstra.png',
  109: '109_Malygon.png',
  110: '110_Dreadwing.png',
};

/**
 * 카드 표시 모드(7등신 / 상반신 / 3등신)에 따른 우선 이미지 경로 후보를 반환합니다.
 * - 'full7': 7등신 전신 애니메이션 캐릭터 투명 컷아웃 PNG
 * - 'bust': 상반신(HEAD & HAIR) 투명 PNG 및 JPG
 * - 'chibi3': 빈 배열 반환 (기본 3등신 SD 스프라이트/개별 시트 및 3등신 공격 모션 사용)
 */
export function getCardDisplayModeImageCandidates(
  cardId: number,
  mode: 'full7' | 'bust' | 'chibi3',
): string[] {
  if (!Number.isFinite(cardId) || cardId < 1 || cardId > 110) {
    return [];
  }
  const pad3 = String(cardId).padStart(3, '0');
  const cutoutFile = ANIME_CUTOUT_FILENAME_BY_ID[cardId];

  if (mode === 'full7') {
    return cutoutFile ? [`/anime-character-sheets/cutouts/${cutoutFile}`] : [];
  }

  if (mode === 'bust') {
    const candidates = [
      `/anime-character-sheets/busts/${pad3}_bust.png`,
      `/anime-character-sheets/busts/${pad3}_bust.jpg`,
    ];
    if (cutoutFile) {
      candidates.push(`/anime-character-sheets/cutouts/${cutoutFile}`);
    }
    return candidates;
  }

  return [];
}
