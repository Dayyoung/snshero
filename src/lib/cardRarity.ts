import type { CardRarity } from '../types';

const CARD_RARITY_ORDER: CardRarity[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legendary'];

const CARD_RARITY_RANK: Record<CardRarity, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
  diamond: 5,
  legendary: 6,
};

const CARD_RARITY_ALIASES: Record<string, CardRarity> = {
  common: 'bronze',
  normal: 'bronze',
  bronze: 'bronze',
  magic: 'silver',
  silver: 'silver',
  rare: 'gold',
  gold: 'gold',
  epic: 'platinum',
  social: 'platinum',
  platinum: 'platinum',
  diamond: 'diamond',
  legendary: 'legendary',
};

export const isCardRarity = (value: string): value is CardRarity => CARD_RARITY_ORDER.includes(value as CardRarity);

export const normalizeCardRarity = (value?: string | null): CardRarity | undefined => {
  if (!value) return undefined;
  return CARD_RARITY_ALIASES[value.toLowerCase()];
};

export const getCardRarityRank = (value?: string | null): number => {
  const normalized = normalizeCardRarity(value);
  return normalized ? CARD_RARITY_RANK[normalized] : 0;
};

export const isPremiumCardRarity = (value?: string | null): boolean => {
  const normalized = normalizeCardRarity(value);
  return normalized === 'platinum' || normalized === 'diamond' || normalized === 'legendary';
};
