import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';
import { KADAN_RPG_EVENTS, getKadanRpgRegion, type KadanRpgTile } from '../content/kadanRpgStory';

export const KADAN_RPG_PROGRESS_STORAGE_KEY = 'hero_kadan_rpg_progress';
export const KADAN_RPG_AUTO_MODE_STORAGE_KEY = 'hero_kadan_rpg_auto_mode';
export const KADAN_RPG_ART_STYLE_STORAGE_KEY = 'hero_storybook_art_style';

export type KadanArtStyleMode = 'animation' | 'liveaction';

export const loadKadanArtStyleMode = (): KadanArtStyleMode => {
  try {
    if (typeof window === 'undefined') return 'animation';
    const raw = localStorage.getItem(KADAN_RPG_ART_STYLE_STORAGE_KEY);
    return raw === 'liveaction' ? 'liveaction' : 'animation';
  } catch {
    return 'animation';
  }
};

export const saveKadanArtStyleMode = (mode: KadanArtStyleMode): KadanArtStyleMode => {
  const safeMode: KadanArtStyleMode = mode === 'liveaction' ? 'liveaction' : 'animation';
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(KADAN_RPG_ART_STYLE_STORAGE_KEY, safeMode);
      window.dispatchEvent(
        new CustomEvent('hero_art_style_updated', { detail: { artStyleMode: safeMode } })
      );
    }
  } catch {
    // ignore storage errors
  }
  return safeMode;
};

/**
 * Converts 1:1 between Animation cuts (webtoon / storybook) and Movie Live-Action cuts (cinema / storybook_liveaction).
 */
export const resolveKadanArtStyleUrl = (
  rawUrl: string | undefined,
  mode: KadanArtStyleMode
): string => {
  if (!rawUrl) return '';
  const cleanUrl = rawUrl.split('?')[0];
  const mapped =
    mode === 'liveaction'
      ? cleanUrl
          .replace('/images/webtoon/episode_', '/images/cinema/episode_')
          .replace('/images/storybook/ep_', '/images/storybook_liveaction/ep_')
      : cleanUrl
          .replace('/images/cinema/episode_', '/images/webtoon/episode_')
          .replace('/images/storybook_liveaction/ep_', '/images/storybook/ep_');
  return `${mapped}?v=conquest2009_v6`;
};

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
  artStyleMode: KadanArtStyleMode;
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
    artStyleMode: loadKadanArtStyleMode(),
    rebirthLevel: 0,
    updatedAt: Date.now(),
  };
};

const normalizeProgress = (season: string, value: unknown): KadanRpgProgress => {
  const fallback = createDefaultProgress(season);
  if (!isRecord(value)) return fallback;

  const rawCompletedIds = stringArray(value.completedChapterIds);
  const rawCurrentChapterId = typeof value.currentChapterId === 'string'
    && KADAN_RPG_EVENTS.some((event) => event.id === value.currentChapterId)
    ? value.currentChapterId
    : fallback.currentChapterId;
  const rawLastAutoEventId = typeof value.lastAutoEventId === 'string' ? value.lastAutoEventId : undefined;

  const currentChapEvent = KADAN_RPG_EVENTS.find((event) => event.id === rawCurrentChapterId);
  const lastAutoEvent = rawLastAutoEventId
    ? KADAN_RPG_EVENTS.find((event) => event.id === rawLastAutoEventId)
    : undefined;

  const completedNums = rawCompletedIds
    .map((id) => KADAN_RPG_EVENTS.find((event) => event.id === id)?.chapterNumber ?? 0)
    .filter((num) => num > 0);

  const maxFromCompleted = completedNums.length > 0 ? Math.max(...completedNums) : 0;
  const maxFromCurrent = currentChapEvent ? Math.max(0, currentChapEvent.chapterNumber - 1) : 0;
  const maxFromLastAuto = lastAutoEvent ? lastAutoEvent.chapterNumber : 0;

  // Enforce strict 1 -> 40 sequential completion so skipped earlier chapters (e.g. Ch.31)
  // never cause the player to jump backward instead of advancing to Ch.38.
  const highestCompletedChapter = rawCompletedIds.length === 0 && maxFromCurrent === 0
    ? 0
    : Math.min(KADAN_RPG_EVENTS.length, Math.max(maxFromCompleted, maxFromCurrent, maxFromLastAuto));

  const sequentialCompletedIds = KADAN_RPG_EVENTS
    .filter((event) => event.chapterNumber <= highestCompletedChapter)
    .map((event) => event.id);

  const nextSequentialEvent = KADAN_RPG_EVENTS.find(
    (event) => !sequentialCompletedIds.includes(event.id)
  );

  const currentChapterId = nextSequentialEvent?.id
    ?? KADAN_RPG_EVENTS[KADAN_RPG_EVENTS.length - 1].id;

  const currentEvent = nextSequentialEvent
    ?? KADAN_RPG_EVENTS.find((event) => event.id === currentChapterId)
    ?? KADAN_RPG_EVENTS[0];

  const region = getKadanRpgRegion(currentEvent.regionId);
  const storedArtStyle = loadKadanArtStyleMode();
  const artStyleMode: KadanArtStyleMode =
    value.artStyleMode === 'liveaction' || value.artStyleMode === 'animation'
      ? value.artStyleMode
      : storedArtStyle;

  return {
    season,
    currentRegionId: region.id,
    currentChapterId,
    completedChapterIds: sequentialCompletedIds,
    clearedEncounterIds: stringArray(value.clearedEncounterIds),
    openedChestIds: stringArray(value.openedChestIds),
    metNpcIds: stringArray(value.metNpcIds),
    claimedRewardIds: stringArray(value.claimedRewardIds),
    lastTile: tileOrFallback(value.lastTile, region.startTile),
    autoMode: typeof value.autoMode === 'boolean' ? value.autoMode : true,
    artStyleMode,
    rebirthLevel: typeof value.rebirthLevel === 'number' && Number.isFinite(value.rebirthLevel)
      ? Math.max(0, Math.floor(value.rebirthLevel))
      : 0,
    lastAutoEventId: rawLastAutoEventId,
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
  };
};

export const loadKadanRpgProgress = (season: string): KadanRpgProgress => {
  const raw = getSeasonItem(KADAN_RPG_PROGRESS_STORAGE_KEY, season);
  const autoModeRaw = getSeasonItem(KADAN_RPG_AUTO_MODE_STORAGE_KEY, season);
  const globalArtStyleRaw =
    typeof window !== 'undefined' ? localStorage.getItem(KADAN_RPG_ART_STYLE_STORAGE_KEY) : null;

  if (!raw) {
    const base = createDefaultProgress(season);
    return {
      ...base,
      autoMode: autoModeRaw === null ? base.autoMode : autoModeRaw === 'true',
      artStyleMode: globalArtStyleRaw === 'liveaction' ? 'liveaction' : base.artStyleMode,
    };
  }

  try {
    const parsed = normalizeProgress(season, JSON.parse(raw) as unknown);
    const resolvedArtStyle: KadanArtStyleMode =
      globalArtStyleRaw === 'liveaction' || globalArtStyleRaw === 'animation'
        ? globalArtStyleRaw
        : parsed.artStyleMode;
    return {
      ...parsed,
      autoMode: autoModeRaw === null ? parsed.autoMode : autoModeRaw === 'true',
      artStyleMode: resolvedArtStyle,
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
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(KADAN_RPG_ART_STYLE_STORAGE_KEY, normalized.artStyleMode);
    }
  } catch {
    // ignore storage errors
  }
  return normalized;
};

export const getRebirthLevel = (season?: string): number => {
  try {
    if (typeof window === 'undefined') return 0;
    const currentSeason = season || localStorage.getItem('hero_current_season') || 'season1';
    const progress = loadKadanRpgProgress(currentSeason);
    return progress?.rebirthLevel ?? 0;
  } catch {
    return 0;
  }
};

export const getNextKadanRpgEvent = (progress: KadanRpgProgress) => (
  KADAN_RPG_EVENTS.find((event) => !progress.completedChapterIds.includes(event.id)) ?? null
);

export const useKadanRpgProgress = (season: string) => {
  const [progress, setProgress] = useState<KadanRpgProgress>(() => loadKadanRpgProgress(season));

  useEffect(() => {
    setProgress(loadKadanRpgProgress(season));
  }, [season]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleArtStyleUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ artStyleMode?: KadanArtStyleMode }>;
      const nextStyle =
        customEvent.detail?.artStyleMode === 'liveaction'
          ? 'liveaction'
          : customEvent.detail?.artStyleMode === 'animation'
          ? 'animation'
          : loadKadanArtStyleMode();
      setProgress((previous) => {
        if (previous.artStyleMode === nextStyle) return previous;
        return saveKadanRpgProgress(season, { ...previous, artStyleMode: nextStyle });
      });
    };
    const handleGameDataReset = () => {
      setProgress(createDefaultProgress(season));
    };
    const handleAutoModeUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ autoMode?: boolean }>;
      const nextAuto = typeof customEvent.detail?.autoMode === 'boolean' ? customEvent.detail.autoMode : true;
      setProgress((previous) => {
        if (previous.autoMode === nextAuto) return previous;
        return saveKadanRpgProgress(season, { ...previous, autoMode: nextAuto });
      });
    };
    window.addEventListener('hero_art_style_updated', handleArtStyleUpdated);
    window.addEventListener('snshero_game_data_reset', handleGameDataReset);
    window.addEventListener('hero_kadan_rpg_auto_mode_updated', handleAutoModeUpdated);
    return () => {
      window.removeEventListener('hero_art_style_updated', handleArtStyleUpdated);
      window.removeEventListener('snshero_game_data_reset', handleGameDataReset);
      window.removeEventListener('hero_kadan_rpg_auto_mode_updated', handleAutoModeUpdated);
    };
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

  const setArtStyleMode = useCallback((artStyleMode: KadanArtStyleMode) => {
    const safeMode = saveKadanArtStyleMode(artStyleMode);
    persist((previous) => ({ ...previous, artStyleMode: safeMode }));
  }, [persist]);

  const toggleArtStyleMode = useCallback(() => {
    setProgress((previous) => {
      const nextMode: KadanArtStyleMode =
        previous.artStyleMode === 'liveaction' ? 'animation' : 'liveaction';
      saveKadanArtStyleMode(nextMode);
      return saveKadanRpgProgress(season, { ...previous, artStyleMode: nextMode });
    });
  }, [season]);

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
      const completedEvent = KADAN_RPG_EVENTS.find((event) => event.id === eventId);
      const completedChapterNum = completedEvent?.chapterNumber ?? 0;

      // Guarantee sequential 1 -> completedChapterNum completion so progression never jumps backward
      const sequentialUpToNow = KADAN_RPG_EVENTS
        .filter((event) => event.chapterNumber <= completedChapterNum)
        .map((event) => event.id);

      const completedChapterIds = Array.from(
        new Set([...previous.completedChapterIds, eventId, ...sequentialUpToNow])
      );

      const nextEvent =
        KADAN_RPG_EVENTS.find(
          (event) => event.chapterNumber === completedChapterNum + 1 && !completedChapterIds.includes(event.id)
        ) ??
        KADAN_RPG_EVENTS.find((event) => !completedChapterIds.includes(event.id));

      const nextRegionId = nextEvent?.regionId ?? previous.currentRegionId;
      const nextLastTile =
        nextEvent && nextEvent.regionId !== previous.currentRegionId
          ? getKadanRpgRegion(nextEvent.regionId).startTile
          : tile;

      return {
        ...previous,
        completedChapterIds,
        currentChapterId: nextEvent?.id ?? eventId,
        currentRegionId: nextRegionId,
        lastTile: nextLastTile,
        lastAutoEventId: eventId,
      };
    });
  }, [persist]);

  const resetProgress = useCallback(() => {
    setProgress((previous) => {
      const base = createDefaultProgress(season);
      return saveKadanRpgProgress(season, {
        ...base,
        artStyleMode: previous.artStyleMode,
      });
    });
  }, [season]);

  const reincarnateProgress = useCallback(() => {
    setProgress((previous) => {
      const base = createDefaultProgress(season);
      // 40화 완주(환생)할 때마다 애니메이션('animation') <-> 실사('liveaction') 모드를 자동으로 교차 토글
      const toggledArtStyle: KadanArtStyleMode =
        previous.artStyleMode === 'liveaction' ? 'animation' : 'liveaction';
      saveKadanArtStyleMode(toggledArtStyle);
      const next = saveKadanRpgProgress(season, {
        ...base,
        rebirthLevel: previous.rebirthLevel + 1,
        autoMode: true,
        artStyleMode: toggledArtStyle,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hero_reincarnation_updated', {
          detail: { rebirthLevel: next.rebirthLevel, artStyleMode: toggledArtStyle }
        }));
      }
      return next;
    });
  }, [season]);

  return {
    progress,
    nextEvent,
    setAutoMode,
    artStyleMode: progress.artStyleMode,
    setArtStyleMode,
    toggleArtStyleMode,
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
