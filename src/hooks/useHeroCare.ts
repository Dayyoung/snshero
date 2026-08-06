import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CardData } from '../types';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';

const STORAGE_BASE_KEY = 'hero_hero_growth';
const MAX_STAT = 100;
const MAX_PASSIVE_HOURS = 72;

type HeroCareAction = 'feed' | 'train' | 'play' | 'rest';

interface HeroCareActionCounts {
  feed: number;
  train: number;
  play: number;
  rest: number;
}

export interface HeroCareMemoryEntry {
  action: HeroCareAction;
  createdAt: number;
}

interface HeroCareMilestoneReward {
  milestone: number;
  affinityRequired: number;
  snsReward: number;
  cosmeticKey: string;
}

export interface HeroCareRecord {
  cardKey: string;
  cardName: string;
  hunger: number;
  mood: number;
  training: number;
  energy: number;
  affinity: number;
  lastAction: HeroCareAction | null;
  lastInteractionAt: number;
  actionCounts: HeroCareActionCounts;
  memoryEntries: HeroCareMemoryEntry[];
  rewardClaimedMilestones: number[];
  unlockedCosmetics: string[];
}

interface HeroCareStorage {
  records: Record<string, HeroCareRecord>;
  updatedAt: number;
}

export interface HeroCareRewardStatus {
  ready: boolean;
  current: HeroCareMilestoneReward | null;
  next: HeroCareMilestoneReward | null;
}

interface UseHeroCareOptions {
  season: string;
  onGrantSns?: (amount: number) => void;
}

interface UseHeroCareResult {
  getCareState: (card: CardData | null | undefined) => HeroCareRecord | null;
  getRewardStatus: (card: CardData | null | undefined) => HeroCareRewardStatus;
  performAction: (card: CardData | null | undefined, action: HeroCareAction) => HeroCareRecord | null;
  claimReward: (card: CardData | null | undefined) => HeroCareMilestoneReward | null;
}

const REWARDS: HeroCareMilestoneReward[] = [
  { milestone: 1, affinityRequired: 20, snsReward: 30, cosmeticKey: 'bond-ribbon-1' },
  { milestone: 2, affinityRequired: 45, snsReward: 50, cosmeticKey: 'bond-ribbon-2' },
  { milestone: 3, affinityRequired: 75, snsReward: 80, cosmeticKey: 'bond-ribbon-3' },
  { milestone: 4, affinityRequired: 110, snsReward: 120, cosmeticKey: 'bond-ribbon-4' },
];

const MEMORY_LIMIT = 6;

const clamp = (value: number, min = 0, max = MAX_STAT): number => Math.min(max, Math.max(min, Math.round(value)));

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const normalizeStringArray = (value: unknown): string[] => (
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []
);

const normalizeNumberArray = (value: unknown): number[] => (
  Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item)) : []
);

const normalizeActionCounts = (value: unknown): HeroCareActionCounts => {
  if (!isRecord(value)) {
    return { feed: 0, train: 0, play: 0, rest: 0 };
  }

  return {
    feed: Math.max(0, Math.round(typeof value.feed === 'number' ? value.feed : 0)),
    train: Math.max(0, Math.round(typeof value.train === 'number' ? value.train : 0)),
    play: Math.max(0, Math.round(typeof value.play === 'number' ? value.play : 0)),
    rest: Math.max(0, Math.round(typeof value.rest === 'number' ? value.rest : 0)),
  };
};

const normalizeMemoryEntries = (value: unknown): HeroCareMemoryEntry[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item): HeroCareMemoryEntry => {
      const action: HeroCareAction = item.action === 'feed' || item.action === 'train' || item.action === 'play' || item.action === 'rest'
        ? item.action
        : 'play';

      return {
        action,
        createdAt: typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MEMORY_LIMIT);
};

const getCardKey = (card: CardData): string => {
  const imageIndex = card.imageIndex ?? 'unknown';
  return `card:${imageIndex}:${card.id}`;
};

const getCardName = (card: CardData): string => (
  card.customName || card.title_dis || card.title || card.title_en || `Card ${card.imageIndex ?? ''}`.trim()
);

const createDefaultRecord = (card: CardData, now: number): HeroCareRecord => ({
  cardKey: getCardKey(card),
  cardName: getCardName(card),
  hunger: 72,
  mood: 70,
  training: 8,
  energy: 74,
  affinity: 0,
  lastAction: null,
  lastInteractionAt: now,
  actionCounts: { feed: 0, train: 0, play: 0, rest: 0 },
  memoryEntries: [],
  rewardClaimedMilestones: [],
  unlockedCosmetics: [],
});

const normalizeStoredRecord = (card: CardData, raw: unknown, now: number): HeroCareRecord => {
  const fallback = createDefaultRecord(card, now);
  if (!isRecord(raw)) return fallback;

  const lastInteractionAt = typeof raw.lastInteractionAt === 'number' && Number.isFinite(raw.lastInteractionAt)
    ? raw.lastInteractionAt
    : fallback.lastInteractionAt;

  return {
    cardKey: typeof raw.cardKey === 'string' && raw.cardKey.trim().length > 0 ? raw.cardKey : fallback.cardKey,
    cardName: typeof raw.cardName === 'string' && raw.cardName.trim().length > 0 ? raw.cardName : fallback.cardName,
    hunger: clamp(typeof raw.hunger === 'number' ? raw.hunger : fallback.hunger),
    mood: clamp(typeof raw.mood === 'number' ? raw.mood : fallback.mood),
    training: clamp(typeof raw.training === 'number' ? raw.training : fallback.training),
    energy: clamp(typeof raw.energy === 'number' ? raw.energy : fallback.energy),
    affinity: Math.max(0, Math.round(typeof raw.affinity === 'number' ? raw.affinity : fallback.affinity)),
    lastAction: raw.lastAction === 'feed' || raw.lastAction === 'train' || raw.lastAction === 'play' || raw.lastAction === 'rest'
      ? raw.lastAction
      : null,
    lastInteractionAt,
    actionCounts: normalizeActionCounts(raw.actionCounts),
    memoryEntries: normalizeMemoryEntries(raw.memoryEntries),
    rewardClaimedMilestones: Array.from(new Set(normalizeNumberArray(raw.rewardClaimedMilestones).map((item) => Math.max(0, Math.round(item))))),
    unlockedCosmetics: Array.from(new Set(normalizeStringArray(raw.unlockedCosmetics))),
  };
};

const applyPassiveDecay = (record: HeroCareRecord, now: number): HeroCareRecord => {
  const elapsedMs = Math.max(0, now - record.lastInteractionAt);
  const elapsedHours = Math.min(MAX_PASSIVE_HOURS, elapsedMs / (1000 * 60 * 60));
  if (elapsedHours <= 0) {
    return record;
  }

  return {
    ...record,
    hunger: clamp(record.hunger - elapsedHours * 3),
    mood: clamp(record.mood - elapsedHours * 2),
    training: clamp(record.training - elapsedHours * 0.8),
    energy: clamp(record.energy - elapsedHours * 2.5),
  };
};

const loadStorage = (season: string): HeroCareStorage => {
  const raw = getSeasonItem(STORAGE_BASE_KEY, season);
  if (!raw) {
    return { records: {}, updatedAt: Date.now() };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.records)) {
      return { records: {}, updatedAt: Date.now() };
    }

    const records = Object.entries(parsed.records).reduce<Record<string, HeroCareRecord>>((acc, [key, value]) => {
      if (isRecord(value)) {
        acc[key] = {
          cardKey: typeof value.cardKey === 'string' ? value.cardKey : key,
          cardName: typeof value.cardName === 'string' ? value.cardName : key,
          hunger: clamp(typeof value.hunger === 'number' ? value.hunger : 72),
          mood: clamp(typeof value.mood === 'number' ? value.mood : 70),
          training: clamp(typeof value.training === 'number' ? value.training : 8),
          energy: clamp(typeof value.energy === 'number' ? value.energy : 74),
          affinity: Math.max(0, Math.round(typeof value.affinity === 'number' ? value.affinity : 0)),
          lastAction: value.lastAction === 'feed' || value.lastAction === 'train' || value.lastAction === 'play' || value.lastAction === 'rest'
            ? value.lastAction
            : null,
          lastInteractionAt: typeof value.lastInteractionAt === 'number' && Number.isFinite(value.lastInteractionAt)
            ? value.lastInteractionAt
            : Date.now(),
          actionCounts: normalizeActionCounts(value.actionCounts),
          memoryEntries: normalizeMemoryEntries(value.memoryEntries),
          rewardClaimedMilestones: Array.from(new Set(normalizeNumberArray(value.rewardClaimedMilestones).map((item) => Math.max(0, Math.round(item))))),
          unlockedCosmetics: Array.from(new Set(normalizeStringArray(value.unlockedCosmetics))),
        };
      }
      return acc;
    }, {});

    return {
      records,
      updatedAt: typeof parsed.updatedAt === 'number' && Number.isFinite(parsed.updatedAt) ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return { records: {}, updatedAt: Date.now() };
  }
};

const saveStorage = (season: string, storage: HeroCareStorage): void => {
  setSeasonItem(STORAGE_BASE_KEY, season, JSON.stringify(storage));
};

const getRewardStatusForRecord = (record: HeroCareRecord): HeroCareRewardStatus => {
  const current = REWARDS.find((reward) => reward.affinityRequired <= record.affinity && !record.rewardClaimedMilestones.includes(reward.milestone)) ?? null;
  const next = REWARDS.find((reward) => reward.affinityRequired > record.affinity) ?? null;

  return {
    ready: current !== null,
    current,
    next,
  };
};

const applyAction = (record: HeroCareRecord, action: HeroCareAction, now: number): HeroCareRecord => {
  const base = applyPassiveDecay(record, now);

  const next = {
    ...base,
    lastAction: action,
    lastInteractionAt: now,
    actionCounts: {
      ...base.actionCounts,
      [action]: base.actionCounts[action] + 1,
    },
    memoryEntries: [
      { action, createdAt: now },
      ...base.memoryEntries,
    ].slice(0, MEMORY_LIMIT),
  };

  switch (action) {
    case 'feed':
      next.hunger = clamp(base.hunger + 24);
      next.energy = clamp(base.energy + 4);
      next.mood = clamp(base.mood + 6);
      next.affinity = base.affinity + 3;
      break;
    case 'train':
      next.training = clamp(base.training + 14);
      next.energy = clamp(base.energy - 18);
      next.hunger = clamp(base.hunger - 14);
      next.mood = clamp(base.mood - 6);
      next.affinity = base.affinity + 4;
      break;
    case 'play':
      next.mood = clamp(base.mood + 18);
      next.hunger = clamp(base.hunger - 8);
      next.energy = clamp(base.energy - 10);
      next.training = clamp(base.training + 4);
      next.affinity = base.affinity + 5;
      break;
    case 'rest':
      next.energy = clamp(base.energy + 28);
      next.hunger = clamp(base.hunger - 6);
      next.mood = clamp(base.mood + 4);
      next.affinity = base.affinity + 2;
      break;
  }

  return next;
};

export const useHeroCare = ({ season, onGrantSns }: UseHeroCareOptions): UseHeroCareResult => {
  const [storage, setStorage] = useState<HeroCareStorage>(() => loadStorage(season));

  useEffect(() => {
    setStorage(loadStorage(season));
  }, [season]);

  const upsertRecord = useCallback((card: CardData, updater: (record: HeroCareRecord, now: number) => HeroCareRecord): HeroCareRecord => {
    const now = Date.now();
    const cardKey = getCardKey(card);
    const currentRaw = storage.records[cardKey];
    const current = normalizeStoredRecord(card, currentRaw, now);
    const nextRecord = updater(current, now);
    const nextStorage: HeroCareStorage = {
      records: {
        ...storage.records,
        [cardKey]: {
          ...nextRecord,
          cardKey,
          cardName: getCardName(card),
        },
      },
      updatedAt: now,
    };
    setStorage(nextStorage);
    saveStorage(season, nextStorage);
    return nextStorage.records[cardKey];
  }, [season, storage]);

  const getCareState = useCallback((card: CardData | null | undefined): HeroCareRecord | null => {
    if (!card) return null;
    const now = Date.now();
    const cardKey = getCardKey(card);
    return applyPassiveDecay(normalizeStoredRecord(card, storage.records[cardKey], now), now);
  }, [storage.records]);

  const getRewardStatus = useCallback((card: CardData | null | undefined): HeroCareRewardStatus => {
    const record = getCareState(card);
    if (!record) {
      return { ready: false, current: null, next: REWARDS[0] ?? null };
    }
    return getRewardStatusForRecord(record);
  }, [getCareState]);

  const performAction = useCallback((card: CardData | null | undefined, action: HeroCareAction): HeroCareRecord | null => {
    if (!card) return null;
    return upsertRecord(card, (record, now) => applyAction(record, action, now));
  }, [upsertRecord]);

  const claimReward = useCallback((card: CardData | null | undefined): HeroCareMilestoneReward | null => {
    if (!card) return null;

    let grantedReward: HeroCareMilestoneReward | null = null;
    upsertRecord(card, (record) => {
      const rewardStatus = getRewardStatusForRecord(record);
      if (!rewardStatus.current) {
        return record;
      }
      grantedReward = rewardStatus.current;
      return {
        ...record,
        rewardClaimedMilestones: [...record.rewardClaimedMilestones, rewardStatus.current.milestone],
        unlockedCosmetics: Array.from(new Set([...record.unlockedCosmetics, rewardStatus.current.cosmeticKey])),
      };
    });

    if (grantedReward && onGrantSns) {
      onGrantSns(grantedReward.snsReward);
    }

    return grantedReward;
  }, [onGrantSns, upsertRecord]);

  return useMemo(() => ({
    getCareState,
    getRewardStatus,
    performAction,
    claimReward,
  }), [claimReward, getCareState, getRewardStatus, performAction]);
};

export type { HeroCareAction, HeroCareMilestoneReward };
