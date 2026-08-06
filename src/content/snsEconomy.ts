import { ViewType } from '../types';

export const SNS_ECONOMY_COSTS = {
  cardPack: {
    bronze: 10,
    silver: 100,
    gold: 1000,
  },
  itemPack: 50,
  adRemoval: 5000,
  event: {
    roulette: 20,
    claw: 5,
  },
  companion: {
    feed: 10,
    play: 15,
  },
  skill: {
    reset: 100,
    baseUpgrade: 50,
    growthMultiplier: 1.5,
  },
  goods: {
    mugUsd: 10,
    tshirtUsd: 35,
    snsPerUsd: 1000,
  },
} as const;

export const SNS_ECONOMY_EARNINGS = {
  loginBonus: 200,
  repeatable: {
    treeOfTime: {
      reward: 1000,
      cooldownHours: 10,
    },
    treeOfDiligence: {
      reward: 1000,
      cooldownHours: 10,
    },
    qrReward: {
      reward: 500,
      cooldownHours: 10,
    },
    arReward: {
      reward: 1000,
      cooldownHours: 10,
    },
  },
} as const;

export type GoodsSpendType = 'mug' | 'tshirt';

export interface SpendRecoveryRoute {
  view: ViewType;
  labelKey: string;
}

export const SPEND_RECOVERY_ROUTES: SpendRecoveryRoute[] = [
  { view: 'season-hub', labelKey: 'sns_spend_go_season_hub' },
  { view: 'event', labelKey: 'sns_spend_go_event' },
  { view: 'shop', labelKey: 'sns_spend_go_shop' },
];

export const getSkillUpgradeCost = (level: number): number => {
  return Math.floor(
    SNS_ECONOMY_COSTS.skill.baseUpgrade * Math.pow(SNS_ECONOMY_COSTS.skill.growthMultiplier, level),
  );
};

export const getSkillResetCost = (): number => SNS_ECONOMY_COSTS.skill.reset;

export const getGoodsUnitUsdPrice = (goodsType: GoodsSpendType): number => {
  return goodsType === 'mug'
    ? SNS_ECONOMY_COSTS.goods.mugUsd
    : SNS_ECONOMY_COSTS.goods.tshirtUsd;
};

export const getGoodsSnsCost = (goodsType: GoodsSpendType, quantity: number): number => {
  return getGoodsUnitUsdPrice(goodsType) * SNS_ECONOMY_COSTS.goods.snsPerUsd * quantity;
};

export const getSpendShortfall = (balance: number, cost: number): number => {
  return Math.max(0, cost - balance);
};
