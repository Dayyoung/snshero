import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';
import { KADAN_RPG_EVENTS, getKadanRpgRegion, type KadanRpgTile } from '../content/kadanRpgStory';

export const KADAN_RPG_PROGRESS_STORAGE_KEY = 'hero_kadan_rpg_progress';
export const KADAN_RPG_AUTO_MODE_STORAGE_KEY = 'hero_kadan_rpg_auto_mode';

export interface KadanRpgProgress {
  season: string;
  currentRegionId: string;
  currentChapterId: string;
  completedChapterIds: string[];
  clearedEncounterIds: string[];
  openedChestIds: string[];
  metNpcIds: string[];
  claimedRewardIds: string[];
  lastTile: KadanRpgTile;
  autoMode: boolean;
  rebirthLevel: number;
  lastAutoEventId?: string;
  updatedAt: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const stringArray = (value: unknown): string[] => (
  Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)))
    : []
);

const tileOrFallback = (value: unknown, fallback: KadanRpgTile): KadanRpgTile => {
  if (!isRecord(value)) return fallback;
  const x = typeof value.x === 'number' && Number.isFinite(value.x) ? value.x : fallback.x;
  const y = typeof value.y === 'number' && Number.isFinite(value.y) ? value.y : fallback.y;
  return { x, y };
};

const createDefaultProgress = (season: string): KadanRpgProgress => {
  const firstEvent = KADAN_RPG_EVENTS[0];
  const firstRegion = getKadanRpgRegion(firstEvent.regionId);

  return {
    season,
    currentRegionId: firstRegion.id,
    currentChapterId: firstEvent.id,
    completedChapterIds: [],
    clearedEncounterIds: [],
    openedChestIds: [],
    metNpcIds: [],
    claimedRewardIds: [],
    lastTile: firstRegion.startTile,
    autoMode: true,
    rebirthLevel: 0,
    updatedAt: Date.now(),
  };
};

const normalizeProgress = (season: string, value: unknown): KadanRpgProgress => {
  const fallback = createDefaultProgress(season);
  if (!isRecord(value)) return fallback;

  const currentChapterId = typeof value.currentChapterId === 'string'
    && KADAN_RPG_EVENTS.some((event) => event.id === value.currentChapterId)
    ? value.currentChapterId
    : fallback.currentChapterId;

  const currentEvent = KADAN_RPG_EVENTS.find((event) => event.id === currentChapterId) ?? KADAN_RPG_EVENTS[0];
  const region = getKadanRpgRegion(
    typeof value.currentRegionId === 'string' ? value.currentRegionId : currentEvent.regionId,
  );

  return {
    season,
    currentRegionId: region.id,
    currentChapterId,
    completedChapterIds: stringArray(value.completedChapterIds),
    clearedEncounterIds: stringArray(value.clearedEncounterIds),
    openedChestIds: stringArray(value.openedChestIds),
    metNpcIds: stringArray(value.metNpcIds),
    claimedRewardIds: stringArray(value.claimedRewardIds),
    lastTile: tileOrFallback(value.lastTile, region.startTile),
    autoMode: typeof value.autoMode === 'boolean' ? value.autoMode : true,
    rebirthLevel: typeof value.rebirthLevel === 'number' && Number.isFinite(value.rebirthLevel)
      ? Math.max(0, Math.floor(value.rebirthLevel))
      : 0,
    lastAutoEventId: typeof value.lastAutoEventId === 'string' ? value.lastAutoEventId : undefined,
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
  };
};

export const loadKadanRpgProgress = (season: string): KadanRpgProgress => {
  const raw = getSeasonItem(KADAN_RPG_PROGRESS_STORAGE_KEY, season);
  const autoModeRaw = getSeasonItem(KADAN_RPG_AUTO_MODE_STORAGE_KEY, season);

  if (!raw) {
    const base = createDefaultProgress(season);
    return {
      ...base,
      autoMode: autoModeRaw === null ? base.autoMode : autoModeRaw === 'true',
    };
  }

  try {
    const parsed = normalizeProgress(season, JSON.parse(raw) as unknown);
    return {
      ...parsed,
      autoMode: autoModeRaw === null ? parsed.autoMode : autoModeRaw === 'true',
    };
  } catch {
    return createDefaultProgress(season);
  }
};

export const saveKadanRpgProgress = (season: string, progress: KadanRpgProgress): KadanRpgProgress => {
  const normalized = normalizeProgress(season, {
    ...progress,
    season,
    updatedAt: Date.now(),
  });

  setSeasonItem(KADAN_RPG_PROGRESS_STORAGE_KEY, season, JSON.stringify(normalized));
  setSeasonItem(KADAN_RPG_AUTO_MODE_STORAGE_KEY, season, normalized.autoMode ? 'true' : 'false');
  return normalized;
};

export const getNextKadanRpgEvent = (progress: KadanRpgProgress) => (
  KADAN_RPG_EVENTS.find((event) => !progress.completedChapterIds.includes(event.id)) ?? null
);

export const useKadanRpgProgress = (season: string) => {
  const [progress, setProgress] = useState<KadanRpgProgress>(() => loadKadanRpgProgress(season));

  useEffect(() => {
    setProgress(loadKadanRpgProgress(season));
  }, [season]);

  const persist = useCallback((updater: (previous: KadanRpgProgress) => KadanRpgProgress) => {
    setProgress((previous) => {
      const next = saveKadanRpgProgress(season, updater(previous));
      return next;
    });
  }, [season]);

  const nextEvent = useMemo(() => getNextKadanRpgEvent(progress), [progress]);

  const setAutoMode = useCallback((autoMode: boolean) => {
    persist((previous) => ({ ...previous, autoMode }));
  }, [persist]);

  const setLastTile = useCallback((lastTile: KadanRpgTile) => {
    persist((previous) => ({ ...previous, lastTile }));
  }, [persist]);

  const markNpcMet = useCallback((eventId: string) => {
    persist((previous) => ({
      ...previous,
      metNpcIds: previous.metNpcIds.includes(eventId) ? previous.metNpcIds : [...previous.metNpcIds, eventId],
    }));
  }, [persist]);

  const markChestOpened = useCallback((eventId: string) => {
    persist((previous) => ({
      ...previous,
      openedChestIds: previous.openedChestIds.includes(eventId) ? previous.openedChestIds : [...previous.openedChestIds, eventId],
    }));
  }, [persist]);

  const markEncounterCleared = useCallback((encounterId: string) => {
    persist((previous) => ({
      ...previous,
      clearedEncounterIds: previous.clearedEncounterIds.includes(encounterId)
        ? previous.clearedEncounterIds
        : [...previous.clearedEncounterIds, encounterId],
    }));
  }, [persist]);

  const markRewardClaimed = useCallback((rewardId: string) => {
    persist((previous) => ({
      ...previous,
      claimedRewardIds: previous.claimedRewardIds.includes(rewardId)
        ? previous.claimedRewardIds
        : [...previous.claimedRewardIds, rewardId],
    }));
  }, [persist]);

  const completeEvent = useCallback((eventId: string, tile: KadanRpgTile) => {
    persist((previous) => {
      const completedChapterIds = previous.completedChapterIds.includes(eventId)
        ? previous.completedChapterIds
        : [...previous.completedChapterIds, eventId];
      const nextEvent = KADAN_RPG_EVENTS.find((event) => !completedChapterIds.includes(event.id));

      return {
        ...previous,
        completedChapterIds,
        currentChapterId: nextEvent?.id ?? eventId,
        currentRegionId: nextEvent?.regionId ?? previous.currentRegionId,
        lastTile: tile,
        lastAutoEventId: eventId,
      };
    });
  }, [persist]);

  const resetProgress = useCallback(() => {
    const next = saveKadanRpgProgress(season, createDefaultProgress(season));
    setProgress(next);
  }, [season]);

  const reincarnateProgress = useCallback(() => {
    setProgress((previous) => {
      const base = createDefaultProgress(season);
      const next = saveKadanRpgProgress(season, {
        ...base,
        rebirthLevel: previous.rebirthLevel + 1,
        autoMode: previous.autoMode,
      });
      return next;
    });
  }, [season]);

  return {
    progress,
    nextEvent,
    setAutoMode,
    setLastTile,
    markNpcMet,
    markChestOpened,
    markEncounterCleared,
    markRewardClaimed,
    completeEvent,
    resetProgress,
    reincarnateProgress,
  };
};
