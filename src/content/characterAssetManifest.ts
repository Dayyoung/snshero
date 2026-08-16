import type { CharacterFaction, CharacterRarityTier } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { CHARACTER_IP_PROFILES } from './characterIp';
import { getAssetUrl, getCardSpriteAsset } from '../lib/utils';

export interface CharacterAssetManifestEntry {
  cardId: number;
  cardNameKo: string;
  cardNameEn: string;
  faction: CharacterFaction;
  rarityTier: CharacterRarityTier;
  /** Primary premium artwork target used by CardItem and share/print surfaces. */
  targetAssetPath: string;
  frontAssetPath: string;
  backAssetPath: string;
  thumbnailAssetPath: string;
  webtoonAssetPath: string;
  animationAssetPath: string;
  fallbackAssetPath: string;
  lowSpecFallbackAssetPath: string;
  legacySpritePath: string;
}

const ASSET_ROOT = getAssetUrl('/characters');
const LEGACY_CARD_SPRITE = getAssetUrl('/card100.png');
const LEGACY_PIXEL_ART = getAssetUrl('/card100_pixelart.png');
const LEGACY_NEON = getAssetUrl('/card100_neon.png');
const LEGACY_GEMINI = getAssetUrl('/card100_gemini.png');
const LEGACY_GEMINI_ALT = getAssetUrl('/card100_gemini.png');
const LEGACY_MASTER_SHEET = getAssetUrl('/card100.png');
const SHARED_BACK_ASSET = getAssetUrl('/card100.png');

const RARITY_FALLBACK_ASSETS: Record<CharacterRarityTier, string> = {
  bronze: LEGACY_PIXEL_ART,
  silver: LEGACY_CARD_SPRITE,
  gold: LEGACY_GEMINI,
  platinum: LEGACY_GEMINI_ALT,
  diamond: LEGACY_MASTER_SHEET,
  legendary: LEGACY_MASTER_SHEET,
};

const RARITY_LOW_SPEC_ASSETS: Record<CharacterRarityTier, string> = {
  bronze: LEGACY_PIXEL_ART,
  silver: LEGACY_CARD_SPRITE,
  gold: LEGACY_NEON,
  platinum: LEGACY_GEMINI_ALT,
  diamond: LEGACY_GEMINI,
  legendary: LEGACY_GEMINI_ALT,
};

function isCharacterRarityTier(value: string): value is CharacterRarityTier {
  return value === 'bronze' || value === 'silver' || value === 'gold' || value === 'platinum' || value === 'diamond' || value === 'legendary';
}

function formatCardId(cardId: number): string {
  const validId = Math.max(1, Math.min(110, cardId || 1));
  return String(validId).padStart(3, '0');
}

function getCardNameKo(cardId: number): string {
  return CARD_DATABASE[cardId]?.title ?? `카드 ${formatCardId(cardId)}`;
}

function getCardNameEn(cardId: number): string {
  return CARD_DATABASE[cardId]?.title_dis ?? `Card ${formatCardId(cardId)}`;
}

export function getCharacterAssetManifestEntry(cardId: number): CharacterAssetManifestEntry {
  const card = CARD_DATABASE[cardId];
  const profile = CHARACTER_IP_PROFILES[cardId];
  const rarityTier = card && isCharacterRarityTier(card.rarity) ? card.rarity : 'bronze';
  const paddedId = formatCardId(cardId);
  const cardSprite = getAssetUrl(getCardSpriteAsset(cardId));

  return {
    cardId,
    cardNameKo: getCardNameKo(cardId),
    cardNameEn: getCardNameEn(cardId),
    faction: profile?.faction ?? 'human',
    rarityTier,
    targetAssetPath: cardSprite,
    frontAssetPath: cardSprite,
    backAssetPath: SHARED_BACK_ASSET,
    thumbnailAssetPath: cardSprite,
    webtoonAssetPath: `${ASSET_ROOT}/webtoon/card-${paddedId}-cover.webp`,
    animationAssetPath: `${ASSET_ROOT}/animations/card-${paddedId}.webp`,
    fallbackAssetPath: cardSprite,
    lowSpecFallbackAssetPath: cardSprite,
    legacySpritePath: cardSprite,
  };
}

export const CHARACTER_ASSET_MANIFEST: Record<number, CharacterAssetManifestEntry> = Object.fromEntries(
  Array.from({ length: 110 }, (_, index) => {
    const cardId = index + 1;
    return [cardId, getCharacterAssetManifestEntry(cardId)];
  }),
) as Record<number, CharacterAssetManifestEntry>;
