import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  KADAN_RPG_EVENTS, 
  KADAN_RPG_REGIONS, 
  type KadanRpgEvent, 
  type KadanRpgTile 
} from '../content/kadanRpgStory';

export interface KadanRpgProgress {
  currentChapter: number;
  currentRegionId: string;
  completedEventIds: string[];
  openedChestIds: string[];
  clearedEncounterIds: string[];
  metNpcIds: string[];
  claimedRewardIds: string[];
  rebirthLevel: number;
  lastTile: KadanRpgTile;
  isAutoMode: boolean;
}

const DEFAULT_START_TILE: KadanRpgTile = { x: 1, y: 5 };

const getDefaultProgress = (): KadanRpgProgress => ({
  currentChapter: 1,
  currentRegionId: KADAN_RPG_REGIONS[0]?.id || 'elwin-wildland',
  completedEventIds: [],
  openedChestIds: [],
  clearedEncounterIds: [],
  metNpcIds: [],
  claimedRewardIds: [],
  rebirthLevel: 0,
  lastTile: DEFAULT_START_TILE,
  isAutoMode: false,
});

export function getKadanRpgProgressStorageKey(season: string = 'season1'): string {
  return `hero_kadan_rpg_progress_${season}`;
}

export function getRebirthLevel(season: string = 'season1'): number {
  try {
    const raw = localStorage.getItem(getKadanRpgProgressStorageKey(season));
    if (raw) {
      const data = JSON.parse(raw);
      return typeof data.rebirthLevel === 'number' ? data.rebirthLevel : 0;
    }
  } catch {}
  return 0;
}

export function loadKadanRpgProgress(season: string = 'season1'): KadanRpgProgress {
  try {
    const raw = localStorage.getItem(getKadanRpgProgressStorageKey(season));
    if (raw) {
      return { ...getDefaultProgress(), ...JSON.parse(raw) };
    }
  } catch {}
  return getDefaultProgress();
}

export function saveKadanRpgProgress(season: string, progress: KadanRpgProgress): void {
  try {
    localStorage.setItem(getKadanRpgProgressStorageKey(season), JSON.stringify(progress));
  } catch {}
}

export function useKadanRpgProgress(season: string = 'season1') {
  const [progress, setProgress] = useState<KadanRpgProgress>(() => loadKadanRpgProgress(season));

  useEffect(() => {
    setProgress(loadKadanRpgProgress(season));
  }, [season]);

  const updateProgress = useCallback((updater: (prev: KadanRpgProgress) => KadanRpgProgress) => {
    setProgress((prev) => {
      const next = updater(prev);
      saveKadanRpgProgress(season, next);
      return next;
    });
  }, [season]);

  const nextEvent = useMemo<KadanRpgEvent | null>(() => {
    const uncompleted = KADAN_RPG_EVENTS.find((e) => !progress.completedEventIds.includes(e.id));
    return uncompleted ?? null;
  }, [progress.completedEventIds]);

  const setAutoMode = useCallback((enabled: boolean) => {
    updateProgress((prev) => ({ ...prev, isAutoMode: enabled }));
  }, [updateProgress]);

  const setLastTile = useCallback((tile: KadanRpgTile) => {
    updateProgress((prev) => ({ ...prev, lastTile: tile }));
  }, [updateProgress]);

  const markNpcMet = useCallback((npcId: string) => {
    updateProgress((prev) => ({
      ...prev,
      metNpcIds: prev.metNpcIds.includes(npcId) ? prev.metNpcIds : [...prev.metNpcIds, npcId],
    }));
  }, [updateProgress]);

  const markChestOpened = useCallback((chestId: string) => {
    updateProgress((prev) => ({
      ...prev,
      openedChestIds: prev.openedChestIds.includes(chestId) ? prev.openedChestIds : [...prev.openedChestIds, chestId],
    }));
  }, [updateProgress]);

  const markEncounterCleared = useCallback((encId: string) => {
    updateProgress((prev) => ({
      ...prev,
      clearedEncounterIds: prev.clearedEncounterIds.includes(encId)
        ? prev.clearedEncounterIds
        : [...prev.clearedEncounterIds, encId],
    }));
  }, [updateProgress]);

  const markRewardClaimed = useCallback((rewardId: string) => {
    updateProgress((prev) => ({
      ...prev,
      claimedRewardIds: prev.claimedRewardIds.includes(rewardId)
        ? prev.claimedRewardIds
        : [...prev.claimedRewardIds, rewardId],
    }));
  }, [updateProgress]);

  const completeEvent = useCallback((eventId: string) => {
    updateProgress((prev) => {
      if (prev.completedEventIds.includes(eventId)) return prev;
      const completedEventIds = [...prev.completedEventIds, eventId];
      const event = KADAN_RPG_EVENTS.find((e) => e.id === eventId);
      const nextChapter = event ? Math.max(prev.currentChapter, event.chapterNumber + 1) : prev.currentChapter;
      return {
        ...prev,
        completedEventIds,
        currentChapter: nextChapter,
      };
    });
  }, [updateProgress]);

  const resetProgress = useCallback(() => {
    const reset = getDefaultProgress();
    setProgress(reset);
    saveKadanRpgProgress(season, reset);
  }, [season]);

  const reincarnateProgress = useCallback(() => {
    updateProgress((prev) => ({
      ...getDefaultProgress(),
      rebirthLevel: prev.rebirthLevel + 1,
    }));
  }, [updateProgress]);

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
}

export default useKadanRpgProgress;
