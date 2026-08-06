/**
 * webtoonProgress.ts
 * Manage webtoon reading progress and episode rewards in localStorage
 */

export interface WebtoonProgressState {
  readEpisodeIds: string[];
  claimedRewardEpisodeIds: string[];
  lastEpisodeId?: string;
  lastPanelIndex?: number;
  lastReadPanelIndex?: Record<string, number>;
  updatedAt: number;
}

const STORAGE_KEY = 'hero_webtoon_progress';

export function getSeasonItem(key: string, season: string, defaultValue: string | null = null): string | null {
  if (typeof window === 'undefined') return defaultValue;
  const val = localStorage.getItem(`${key}_${season}`);
  if (val !== null) return val;
  if (season === 'season1') {
    const s1Val = localStorage.getItem(key);
    if (s1Val !== null) return s1Val;
  }
  return defaultValue;
}

export function setSeasonItem(key: string, season: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${key}_${season}`, value);
  if (season === 'season1') {
    localStorage.setItem(key, value);
  }
}

const defaultWebtoonProgress = (): WebtoonProgressState => ({
  readEpisodeIds: [],
  claimedRewardEpisodeIds: [],
  lastReadPanelIndex: {},
  updatedAt: Date.now(),
});

export function loadWebtoonProgress(season: string): WebtoonProgressState {
  if (typeof window === 'undefined') return defaultWebtoonProgress();
  try {
    const raw = getSeasonItem(STORAGE_KEY, season);
    if (!raw) return defaultWebtoonProgress();
    const parsed = JSON.parse(raw);
    return {
      readEpisodeIds: Array.isArray(parsed.readEpisodeIds) ? parsed.readEpisodeIds : [],
      claimedRewardEpisodeIds: Array.isArray(parsed.claimedRewardEpisodeIds) ? parsed.claimedRewardEpisodeIds : [],
      lastEpisodeId: typeof parsed.lastEpisodeId === 'string' ? parsed.lastEpisodeId : undefined,
      lastPanelIndex: typeof parsed.lastPanelIndex === 'number' ? parsed.lastPanelIndex : undefined,
      lastReadPanelIndex: typeof parsed.lastReadPanelIndex === 'object' ? parsed.lastReadPanelIndex : {},
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return defaultWebtoonProgress();
  }
}

export function saveWebtoonProgress(season: string, progress: WebtoonProgressState): void {
  setSeasonItem(STORAGE_KEY, season, JSON.stringify(progress));
}

export function markEpisodeRead(season: string, episodeId: string, panelIndex: number = 0): WebtoonProgressState {
  const current = loadWebtoonProgress(season);
  const readEpisodeIds = current.readEpisodeIds.includes(episodeId)
    ? current.readEpisodeIds
    : [...current.readEpisodeIds, episodeId];
  const lastReadPanelIndex = { ...current.lastReadPanelIndex, [episodeId]: panelIndex };
  const updated: WebtoonProgressState = {
    ...current,
    readEpisodeIds,
    lastEpisodeId: episodeId,
    lastPanelIndex: panelIndex,
    lastReadPanelIndex,
    updatedAt: Date.now(),
  };
  saveWebtoonProgress(season, updated);
  return updated;
}

export function claimEpisodeReward(season: string, episodeId: string): WebtoonProgressState {
  const current = loadWebtoonProgress(season);
  if (current.claimedRewardEpisodeIds.includes(episodeId)) return current;
  const updated: WebtoonProgressState = {
    ...current,
    claimedRewardEpisodeIds: [...current.claimedRewardEpisodeIds, episodeId],
    updatedAt: Date.now(),
  };
  saveWebtoonProgress(season, updated);
  return updated;
}

export function hasClaimedEpisodeReward(season: string, episodeId: string): boolean {
  const current = loadWebtoonProgress(season);
  return current.claimedRewardEpisodeIds.includes(episodeId);
}
