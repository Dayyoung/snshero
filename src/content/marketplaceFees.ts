import type { FeePolicy } from '../types';

interface SeasonalDiscountRule {
  season: string;
  discountRate: number;
  labelKey: string;
}

const BASE_FEE_POLICY = {
  id: 'card-marketplace-mvp',
  rate: 0.08,
  minimumFee: 25,
  maximumFee: 2500,
  labelKey: 'marketplace_fee_policy_label',
} as const;

const SEASONAL_DISCOUNTS: SeasonalDiscountRule[] = [
  {
    season: 'season1',
    discountRate: 0.02,
    labelKey: 'marketplace_fee_discount_founder',
  },
];

export const getMarketplaceFeePolicy = (season: string): FeePolicy => {
  const seasonalDiscount = SEASONAL_DISCOUNTS.find((rule) => rule.season === season);

  return {
    ...BASE_FEE_POLICY,
    season,
    seasonalDiscountRate: seasonalDiscount?.discountRate ?? 0,
    seasonalDiscountLabelKey: seasonalDiscount?.labelKey,
  };
};

export interface MarketplaceSettlement {
  basePrice: number;
  feeRate: number;
  discountRate: number;
  fee: number;
  buyerTotal: number;
  sellerReceives: number;
}

export const calculateMarketplaceSettlement = (
  price: number,
  season: string,
): MarketplaceSettlement => {
  const policy = getMarketplaceFeePolicy(season);
  const discountedRate = Math.max(0, policy.rate - policy.seasonalDiscountRate);
  const unclampedFee = Math.round(price * discountedRate);
  const fee = Math.min(policy.maximumFee, Math.max(policy.minimumFee, unclampedFee));

  return {
    basePrice: price,
    feeRate: policy.rate,
    discountRate: policy.seasonalDiscountRate,
    fee,
    buyerTotal: price + fee,
    sellerReceives: price,
  };
};
