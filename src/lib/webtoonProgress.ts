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

export function setSeasonItem(key: string, arg2: string, arg3?: string): void {
  if (typeof window === 'undefined') return;
  let season = 'season1';
  let value = '';

  if (arg3 === undefined) {
    value = arg2 ?? '';
  } else if (typeof arg3 === 'string' && (arg3.startsWith('season') || arg3 === 'default')) {
    // Caller passed (key, value, season)
    value = arg2;
    season = arg3;
  } else if (typeof arg2 === 'string' && (arg2.startsWith('season') || arg2 === 'default')) {
    // Caller passed (key, season, value)
    season = arg2;
    value = arg3;
  } else {
    // Heuristic fallback
    const isValLike = (s: string) =>
      s.startsWith('{') ||
      s.startsWith('[') ||
      /^-?\d+$/.test(s) ||
      s === 'true' ||
      s === 'false' ||
      s.length > 30;

    if (isValLike(arg2) && !isValLike(arg3)) {
      value = arg2;
      season = arg3;
    } else if (isValLike(arg3) && !isValLike(arg2)) {
      season = arg2;
      value = arg3;
    } else {
      // Default standard order fallback: (key, season, value)
      season = arg2;
      value = arg3;
    }
  }

  const seasonKey = `${key}_${season}`;
  localStorage.setItem(seasonKey, value);
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

export interface EpisodeScrollData {
  scrollY: number;
  progressPct: number;
  updatedAt: number;
}

export function saveEpisodeScrollState(
  season: string,
  episodeNum: number,
  scrollY: number,
  progressPct: number,
  tab: 'cartoon' | 'novel' | 'prompt' = 'cartoon'
): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `hero_scroll_state_${season}_${tab}_ep${episodeNum}`;
    const data: EpisodeScrollData = {
      scrollY: Math.max(0, Math.round(scrollY)),
      progressPct: Math.min(100, Math.max(0, Math.round(progressPct))),
      updatedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));

    // Also update max reached reading percentage
    const maxKey = `hero_max_read_pct_${season}_ep${episodeNum}`;
    const prevMax = parseInt(localStorage.getItem(maxKey) || '0', 10);
    if (data.progressPct > prevMax) {
      localStorage.setItem(maxKey, String(data.progressPct));
    }

    // Auto mark as read if reached >= 85%
    if (data.progressPct >= 85) {
      const epId = `ep_${String(episodeNum).padStart(2, '0')}`;
      markEpisodeRead(season, epId);
    }
  } catch {
    // ignore
  }
}

export function loadEpisodeScrollState(
  season: string,
  episodeNum: number,
  tab: 'cartoon' | 'novel' | 'prompt' = 'cartoon'
): EpisodeScrollData | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = `hero_scroll_state_${season}_${tab}_ep${episodeNum}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      typeof parsed.scrollY === 'number' &&
      typeof parsed.progressPct === 'number' &&
      !isNaN(parsed.scrollY) &&
      !isNaN(parsed.progressPct)
    ) {
      return {
        scrollY: Math.max(0, parsed.scrollY),
        progressPct: Math.min(100, Math.max(0, parsed.progressPct)),
        updatedAt: typeof parsed.updatedAt === 'number' && !isNaN(parsed.updatedAt) ? parsed.updatedAt : Date.now(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function getEpisodeMaxReadPct(season: string, episodeNum: number): number {
  if (typeof window === 'undefined') return 0;
  try {
    const maxKey = `hero_max_read_pct_${season}_ep${episodeNum}`;
    const val = parseInt(localStorage.getItem(maxKey) || '0', 10);
    return isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
  } catch {
    return 0;
  }
}

