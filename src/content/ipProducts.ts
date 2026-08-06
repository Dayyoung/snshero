import { CARD_DATABASE } from '../cardDatabase';
import { getCurrentSeasonConfig } from './seasons';
import { getCharacterIpProfile } from './characterIpUtils';
import type { CharacterFaction, CharacterRarityTier, ViewType } from '../types';
import { getAssetUrl } from '../lib/utils';

export type IpMerchSection = 'character' | 'season';
export type IpMerchType = 'character-art-card' | 'webtoon-poster' | 'season-badge' | 'digital-skin' | 'goods-bundle';
export type IpMerchPurchaseMode = 'goods' | 'coming-soon';
export type IpMerchShareType = 'character' | 'webtoon' | 'season';

export interface IpMerchPrice {
  amount: number;
  currency: 'USD' | 'SNS';
}

export interface IpMerchProduct {
  id: string;
  section: IpMerchSection;
  type: IpMerchType;
  titleKey: string;
  descKey: string;
  purchaseNoteKey: string;
  cardIds: number[];
  featuredCardId: number;
  seasonKey: string;
  rarity: CharacterRarityTier;
  faction: CharacterFaction | null;
  imageFallback: string;
  price: IpMerchPrice;
  purchaseMode: IpMerchPurchaseMode;
  shareType: IpMerchShareType;
  relatedCharacterIds: number[];
  merchandisingTags: string[];
  personalityTags: string[];
  linkedViews: ViewType[];
  seasonLimited?: boolean;
  skinUnlockKey?: string;
}

const normalizeKeyword = (value: string): string => value.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, '');

const hasOverlap = (source: string[], candidates: string[]): boolean => {
  const sourceSet = new Set(source.map(normalizeKeyword).filter(Boolean));
  return candidates.some(candidate => sourceSet.has(normalizeKeyword(candidate)));
};

const resolveFaction = (cardId: number): CharacterFaction | null => {
  const profile = getCharacterIpProfile(cardId);
  return profile?.faction ?? null;
};

const resolveRarity = (cardId: number): CharacterRarityTier => {
  return CARD_DATABASE[cardId]?.rarity as CharacterRarityTier || 'bronze';
};

const fallbackImage = (rarity: CharacterRarityTier): string => {
  if (rarity === 'diamond' || rarity === 'legendary') return getAssetUrl('/background-gold.png');
  if (rarity === 'platinum' || rarity === 'silver') return getAssetUrl('/background-silver.png');
  if (rarity === 'gold') return getAssetUrl('/background-gold.png');
  return getAssetUrl('/background-bronze.png');
};

const getRelatedCharacterIds = (cardIds: number[], featuredCardId: number): number[] => {
  return Array.from(new Set([...cardIds, featuredCardId]));
};

export const getIpMerchProducts = (currentSeason: string): IpMerchProduct[] => {
  const seasonConfig = getCurrentSeasonConfig(currentSeason);

  return [
    {
      id: 'character-art-card',
      section: 'character',
      type: 'character-art-card',
      titleKey: 'ip_shop_product_art_title',
      descKey: 'ip_shop_product_art_desc',
      purchaseNoteKey: 'ip_shop_purchase_note',
      cardIds: [10, 20, 30],
      featuredCardId: 10,
      seasonKey: seasonConfig.titleKey,
      rarity: resolveRarity(10),
      faction: resolveFaction(10),
      imageFallback: fallbackImage(resolveRarity(10)),
      price: { amount: 24, currency: 'USD' },
      purchaseMode: 'goods',
      shareType: 'character',
      relatedCharacterIds: getRelatedCharacterIds([10, 20, 30], 10),
      merchandisingTags: ['cardbook', 'acrylic-stand', 'poster'],
      personalityTags: ['leader', 'heroic', 'charismatic'],
      linkedViews: ['wiki-card', 'webtoon', 'shop'],
    },
    {
      id: 'webtoon-poster',
      section: 'character',
      type: 'webtoon-poster',
      titleKey: 'ip_shop_product_poster_title',
      descKey: 'ip_shop_product_poster_desc',
      purchaseNoteKey: 'ip_shop_purchase_note',
      cardIds: [1, 5, 10],
      featuredCardId: 5,
      seasonKey: seasonConfig.titleKey,
      rarity: resolveRarity(5),
      faction: resolveFaction(5),
      imageFallback: fallbackImage(resolveRarity(5)),
      price: { amount: 18, currency: 'USD' },
      purchaseMode: 'goods',
      shareType: 'webtoon',
      relatedCharacterIds: getRelatedCharacterIds([1, 5, 10], 5),
      merchandisingTags: ['poster', 'sticker', 'mug'],
      personalityTags: ['dramatic', 'curious', 'adventurous'],
      linkedViews: ['webtoon', 'wiki-card', 'shop'],
    },
    {
      id: 'season-badge',
      section: 'season',
      type: 'season-badge',
      titleKey: 'ip_shop_product_badge_title',
      descKey: 'ip_shop_product_badge_desc',
      purchaseNoteKey: 'ip_shop_purchase_note',
      cardIds: [15, 22, 30],
      featuredCardId: 22,
      seasonKey: seasonConfig.titleKey,
      rarity: resolveRarity(22),
      faction: resolveFaction(22),
      imageFallback: fallbackImage(resolveRarity(22)),
      price: { amount: 9, currency: 'USD' },
      purchaseMode: 'goods',
      shareType: 'season',
      relatedCharacterIds: getRelatedCharacterIds([15, 22, 30], 22),
      merchandisingTags: ['sticker', 'badge', 'digital-skin'],
      personalityTags: ['loyal', 'competitive', 'collector'],
      linkedViews: ['season-hub', 'wiki-card', 'shop'],
      seasonLimited: true,
    },
    {
      id: 'season-skin',
      section: 'season',
      type: 'digital-skin',
      titleKey: 'ip_shop_product_skin_title',
      descKey: 'ip_shop_product_skin_desc',
      purchaseNoteKey: 'ip_shop_skin_unlock_note',
      cardIds: [50, 80, 90],
      featuredCardId: 50,
      seasonKey: seasonConfig.titleKey,
      rarity: resolveRarity(50),
      faction: resolveFaction(50),
      imageFallback: fallbackImage(resolveRarity(50)),
      price: { amount: 5000, currency: 'SNS' },
      purchaseMode: 'coming-soon',
      shareType: 'character',
      relatedCharacterIds: getRelatedCharacterIds([50, 80, 90], 50),
      merchandisingTags: ['digital-skin', 'cardbook', 'tshirt'],
      personalityTags: ['legendary', 'elite', 'mystic'],
      linkedViews: ['wiki-card', 'season-hub', 'shop'],
      seasonLimited: true,
      skinUnlockKey: 'skin_s1_50_golden_knight',
    },
    {
      id: 'goods-bundle',
      section: 'season',
      type: 'goods-bundle',
      titleKey: 'ip_shop_product_bundle_title',
      descKey: 'ip_shop_product_bundle_desc',
      purchaseNoteKey: 'ip_shop_purchase_note',
      cardIds: [10, 20, 28],
      featuredCardId: 28,
      seasonKey: seasonConfig.titleKey,
      rarity: resolveRarity(28),
      faction: resolveFaction(28),
      imageFallback: fallbackImage(resolveRarity(28)),
      price: { amount: 49, currency: 'USD' },
      purchaseMode: 'goods',
      shareType: 'season',
      relatedCharacterIds: getRelatedCharacterIds([10, 20, 28], 28),
      merchandisingTags: ['tshirt', 'poster', 'mug'],
      personalityTags: ['collector', 'fanfavorite', 'festive'],
      linkedViews: ['shop', 'webtoon', 'season-hub'],
      seasonLimited: true,
    },
  ];
};

export const getRecommendedIpMerchProducts = (cardId: number, currentSeason: string): IpMerchProduct[] => {
  const profile = getCharacterIpProfile(cardId);
  const rarity = resolveRarity(cardId);
  const marketingTags = profile?.marketingTags ?? [];
  const personalityTokens = profile?.personality
    ? profile.personality.split(/[\s,/|·]+/).map(token => token.trim()).filter(Boolean)
    : [];

  return getIpMerchProducts(currentSeason)
    .map(product => {
      let score = 0;

      if (product.featuredCardId === cardId) score += 6;
      if (product.relatedCharacterIds.includes(cardId)) score += 4;
      if (product.faction && profile?.faction === product.faction) score += 2;
      if (product.rarity === rarity) score += 1;
      if (hasOverlap(product.merchandisingTags, marketingTags)) score += 2;
      if (hasOverlap(product.personalityTags, personalityTokens)) score += 1;

      return { product, score };
    })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.product.price.amount - b.product.price.amount)
    .map(entry => entry.product);
};

export const findBestIpMerchProductForCardId = (cardId: number, currentSeason: string): IpMerchProduct | null => {
  return getRecommendedIpMerchProducts(cardId, currentSeason)[0] ?? null;
};
