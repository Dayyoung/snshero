import { useState, useCallback, useMemo } from 'react';
import { KADAN_RPG_EVENTS, KadanRpgEvent, KadanRpgTile } from '../content/kadanRpgStory';

export interface KadanRpgProgressState {
  currentRegionId: string;
  completedEventIds: string[];
  clearedEncounterIds: string[];
  openedChestIds: string[];
  claimedRewardIds: string[];
  metNpcIds: string[];
  lastTile: KadanRpgTile;
  rebirthLevel: number;
  autoMode: boolean;
}

const DEFAULT_PROGRESS: KadanRpgProgressState = {
  currentRegionId: 'elwin-wildland',
  completedEventIds: [],
  clearedEncounterIds: [],
  openedChestIds: [],
  claimedRewardIds: [],
  metNpcIds: [],
  lastTile: { x: 1, y: 5 },
  rebirthLevel: 0,
  autoMode: false,
};

export function getRebirthLevel(season: string = 'season1'): number {
  try {
    const raw = localStorage.getItem(`hero_kadan_rpg_progress_${season}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Number(parsed.rebirthLevel) || 0;
    }
  } catch {
    // Ignore localStorage access issues
  }
  return 0;
}

export const useKadanRpgProgress = (currentSeason: string = 'season1') => {
  const storageKey = `hero_kadan_rpg_progress_${currentSeason}`;

  const [progress, setProgress] = useState<KadanRpgProgressState>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
      }
    } catch {
      // Ignore localStorage access issues
    }
    return DEFAULT_PROGRESS;
  });

  const saveProgress = useCallback((newProgress: KadanRpgProgressState) => {
    setProgress(newProgress);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newProgress));
    } catch {
      // Ignore localStorage access issues
    }
  }, [storageKey]);

  const nextEvent = useMemo<KadanRpgEvent | null>(() => {
    return (
      KADAN_RPG_EVENTS.find((event) => !progress.completedEventIds.includes(event.id)) || null
    );
  }, [progress.completedEventIds]);

  const setAutoMode = useCallback((auto: boolean) => {
    saveProgress({ ...progress, autoMode: auto });
  }, [progress, saveProgress]);

  const setLastTile = useCallback((tile: KadanRpgTile) => {
    saveProgress({ ...progress, lastTile: tile });
  }, [progress, saveProgress]);

  const markNpcMet = useCallback((id: string) => {
    if (!progress.metNpcIds.includes(id)) {
      saveProgress({ ...progress, metNpcIds: [...progress.metNpcIds, id] });
    }
  }, [progress, saveProgress]);

  const markChestOpened = useCallback((id: string) => {
    if (!progress.openedChestIds.includes(id)) {
      saveProgress({ ...progress, openedChestIds: [...progress.openedChestIds, id] });
    }
  }, [progress, saveProgress]);

  const markEncounterCleared = useCallback((id: string) => {
    if (!progress.clearedEncounterIds.includes(id)) {
      saveProgress({ ...progress, clearedEncounterIds: [...progress.clearedEncounterIds, id] });
    }
  }, [progress, saveProgress]);

  const markRewardClaimed = useCallback((id: string) => {
    if (!progress.claimedRewardIds.includes(id)) {
      saveProgress({ ...progress, claimedRewardIds: [...progress.claimedRewardIds, id] });
    }
  }, [progress, saveProgress]);

  const completeEvent = useCallback((event: KadanRpgEvent) => {
    if (!progress.completedEventIds.includes(event.id)) {
      const nextCompleted = [...progress.completedEventIds, event.id];
      saveProgress({
        ...progress,
        completedEventIds: nextCompleted,
        lastTile: event.tile,
      });
    }
  }, [progress, saveProgress]);

  const resetProgress = useCallback(() => {
    saveProgress(DEFAULT_PROGRESS);
  }, [saveProgress]);

  const reincarnateProgress = useCallback(() => {
    const nextRebirth = (progress.rebirthLevel || 0) + 1;
    saveProgress({
      ...DEFAULT_PROGRESS,
      rebirthLevel: nextRebirth,
    });
    window.dispatchEvent(new CustomEvent('hero_reincarnation_updated'));
  }, [progress, saveProgress]);

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

export default useKadanRpgProgress;
