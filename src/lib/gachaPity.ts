import { GACHA_PACK_CONFIG, type GachaPackRarity, type GachaOutcomeRarity, isGuaranteedPityHit } from '../content/gachaRates';

const PITY_STORAGE_VERSION = 1 as const;

export interface GachaPityPackState {
  count: number;
  lastUpdatedAt: number;
  lastGuaranteedAt: number | null;
}

export interface GachaPityState {
  version: number;
  packs: Record<GachaPackRarity, GachaPityPackState>;
}

const createPackState = (): GachaPityPackState => ({
  count: 0,
  lastUpdatedAt: Date.now(),
  lastGuaranteedAt: null,
});

export const createDefaultGachaPityState = (): GachaPityState => ({
  version: PITY_STORAGE_VERSION,
  packs: {
    bronze: createPackState(),
    silver: createPackState(),
    gold: createPackState(),
  },
});

const normalizeCount = (value: unknown): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? Math.floor(numeric) : 0;
};

const normalizeTimestamp = (value: unknown): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : Date.now();
};

const normalizePackState = (value: unknown): GachaPityPackState => {
  if (!value || typeof value !== 'object') {
    return createPackState();
  }

  const record = value as Partial<GachaPityPackState>;
  return {
    count: normalizeCount(record.count),
    lastUpdatedAt: normalizeTimestamp(record.lastUpdatedAt),
    lastGuaranteedAt: record.lastGuaranteedAt === null || record.lastGuaranteedAt === undefined
      ? null
      : normalizeTimestamp(record.lastGuaranteedAt),
  };
};

export const loadGachaPityState = (season: string): GachaPityState => {
  if (typeof window === 'undefined') {
    return createDefaultGachaPityState();
  }

  const raw = window.localStorage.getItem(`hero_gacha_pity_${season}`);
  if (!raw) {
    return createDefaultGachaPityState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GachaPityState>;
    const packs = (parsed.packs ?? {}) as Partial<Record<GachaPackRarity, Partial<GachaPityPackState>>>;

    return {
      version: typeof parsed.version === 'number' ? parsed.version : PITY_STORAGE_VERSION,
      packs: {
        bronze: normalizePackState(packs.bronze),
        silver: normalizePackState(packs.silver),
        gold: normalizePackState(packs.gold),
      },
    };
  } catch {
    return createDefaultGachaPityState();
  }
};

export const saveGachaPityState = (season: string, state: GachaPityState): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(`hero_gacha_pity_${season}`, JSON.stringify(state));
};

export const advanceGachaPityState = (
  state: GachaPityState,
  packRarity: GachaPackRarity,
  drawnRarities: GachaOutcomeRarity[],
): GachaPityState => {
  const config = GACHA_PACK_CONFIG[packRarity];
  const currentPack = state.packs[packRarity];
  const hasGuaranteedHit = drawnRarities.some((rarity) => isGuaranteedPityHit(packRarity, rarity));
  const nextCount = hasGuaranteedHit ? 0 : Math.min(currentPack.count + 1, config.pityThreshold);
  const now = Date.now();

  return {
    ...state,
    packs: {
      ...state.packs,
      [packRarity]: {
        count: nextCount,
        lastUpdatedAt: now,
        lastGuaranteedAt: hasGuaranteedHit ? now : currentPack.lastGuaranteedAt,
      },
    },
  };
};

export const getGachaPityView = (state: GachaPityState, packRarity: GachaPackRarity) => {
  const config = GACHA_PACK_CONFIG[packRarity];
  const current = Math.min(state.packs[packRarity].count, config.pityThreshold);
  const remaining = Math.max(config.pityThreshold - current, 0);

  return {
    current,
    remaining,
    threshold: config.pityThreshold,
    guaranteeRarity: config.pityGuaranteeRarity,
    lastUpdatedAt: state.packs[packRarity].lastUpdatedAt,
    lastGuaranteedAt: state.packs[packRarity].lastGuaranteedAt,
  };
};
