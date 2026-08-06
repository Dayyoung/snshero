import { CARD_DATABASE } from '../cardDatabase';
import type { DatabaseCard } from '../types';

export type GachaPackRarity = 'bronze' | 'silver' | 'gold';
export type GachaOutcomeRarity = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface GachaRateRow {
  rarity: GachaOutcomeRarity;
  rate: number;
}

export interface GachaPackConfig {
  rarity: GachaPackRarity;
  updatedAt: string;
  pityThreshold: number;
  pityGuaranteeRarity: Exclude<GachaOutcomeRarity, 'bronze'>;
  rates: GachaRateRow[];
}

export const GACHA_UPDATED_AT = '2026-07-02';

export const GACHA_PACK_CONFIG: Record<GachaPackRarity, GachaPackConfig> = {
  bronze: {
    rarity: 'bronze',
    updatedAt: GACHA_UPDATED_AT,
    pityThreshold: 30,
    pityGuaranteeRarity: 'silver',
    rates: [
      { rarity: 'bronze', rate: 99.899 },
      { rarity: 'silver', rate: 0.1 },
      { rarity: 'gold', rate: 0.001 },
      { rarity: 'platinum', rate: 0 },
      { rarity: 'diamond', rate: 0 },
    ],
  },
  silver: {
    rarity: 'silver',
    updatedAt: GACHA_UPDATED_AT,
    pityThreshold: 20,
    pityGuaranteeRarity: 'gold',
    rates: [
      { rarity: 'bronze', rate: 97.98 },
      { rarity: 'silver', rate: 2.0 },
      { rarity: 'gold', rate: 0.02 },
      { rarity: 'platinum', rate: 0 },
      { rarity: 'diamond', rate: 0 },
    ],
  },
  gold: {
    rarity: 'gold',
    updatedAt: GACHA_UPDATED_AT,
    pityThreshold: 10,
    pityGuaranteeRarity: 'gold',
    rates: [
      { rarity: 'bronze', rate: 84.5 },
      { rarity: 'silver', rate: 15.0 },
      { rarity: 'gold', rate: 0.5 },
      { rarity: 'platinum', rate: 0 },
      { rarity: 'diamond', rate: 0 },
    ],
  },
};

export interface GachaCardPoolGroup {
  rarity: GachaOutcomeRarity;
  cards: DatabaseCard[];
}

export const GACHA_RARITY_LABELS: Record<GachaOutcomeRarity, string> = {
  bronze: 'bronze',
  silver: 'silver',
  gold: 'gold',
  platinum: 'platinum',
  diamond: 'diamond',
};

export const determineGachaOutcomeRarity = (
  packRarity: GachaPackRarity,
  randomValue: number = Math.random() * 100,
): GachaOutcomeRarity => {
  const config = GACHA_PACK_CONFIG[packRarity];
  let cumulative = 0;

  for (const row of config.rates) {
    cumulative += row.rate;
    if (randomValue <= cumulative) {
      return row.rarity;
    }
  }

  return config.rates[config.rates.length - 1]?.rarity ?? 'bronze';
};

export const getGachaCardPoolGroups = (): GachaCardPoolGroup[] => {
  const cards = Object.values(CARD_DATABASE);

  return (['bronze', 'silver', 'gold', 'platinum', 'diamond'] as GachaOutcomeRarity[]).map((rarity): GachaCardPoolGroup => ({
    rarity,
    cards: cards.filter((card) => card.rarity === rarity),
  }));
};

export const isGuaranteedPityHit = (packRarity: GachaPackRarity, outcomeRarity: GachaOutcomeRarity): boolean => {
  if (packRarity === 'bronze') {
    return outcomeRarity !== 'bronze';
  }

  return outcomeRarity === 'gold' || outcomeRarity === 'platinum' || outcomeRarity === 'diamond';
};

export const formatProbabilityRate = (rate: number): string => {
  if (rate >= 1) {
    return rate.toFixed(1);
  }

  return rate.toFixed(rate < 0.01 ? 3 : 2);
};
