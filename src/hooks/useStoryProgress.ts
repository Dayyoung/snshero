import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTotalStoryEpisodes, getStoryProgress, getStoryProgressState, getWeeklyWebtoon, hasClaimedStoryReward, setStoryProgressState, type StoryProgressState, type WeeklyWebtoon } from '../lib/homeIpUtils';
import { claimEpisodeReward, hasClaimedEpisodeReward, loadWebtoonProgress, markEpisodeRead, type WebtoonProgressState } from '../lib/webtoonProgress';
import { WEBTOON_SEASONS, getCurrentWebtoonEpisode, getWebtoonSeasonById } from '../content/webtoonEpisodes';

export interface UseStoryProgressOptions {
  season?: string;
}

export interface UseStoryProgressResult {
  season: string;
  storyState: StoryProgressState;
  storyProgressCount: number;
  storyProgressPercent: number;
  totalStoryEpisodes: number;
  weeklyWebtoon: WeeklyWebtoon | null;
  webtoonProgress: WebtoonProgressState;
  currentWeeklyEpisodeId: string | null;
  isWeeklyWebtoonCompleted: boolean;
  isWeeklyWebtoonRewardClaimed: boolean;
  setStoryStage: (act: number, step: number, isActive?: boolean) => void;
  completeStoryBattle: (battleId: string) => StoryProgressState;
  claimStoryBattleReward: (rewardId: string) => StoryProgressState;
  hasCompletedStoryBattle: (battleId: string) => boolean;
  hasClaimedStoryBattleReward: (rewardId: string) => boolean;
  markWebtoonEpisodeRead: (episodeId: string, panelIndex?: number) => WebtoonProgressState;
  claimWebtoonEpisodeReward: (episodeId: string) => WebtoonProgressState;
  hasReadWebtoonEpisode: (episodeId: string) => boolean;
  hasClaimedWebtoonReward: (episodeId: string) => boolean;
}

const resolveSeason = (season?: string): string => {
  if (season && season.trim().length > 0) return season;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('hero_current_season') || 'season1';
  }
  return 'season1';
};

export const useStoryProgress = (options: UseStoryProgressOptions = {}): UseStoryProgressResult => {
  const season = useMemo(() => resolveSeason(options.season), [options.season]);
  const resolvedSeason = useMemo(() => getWebtoonSeasonById(season) ?? WEBTOON_SEASONS[0], [season]);
  const [storyState, setStoryState] = useState<StoryProgressState>(() => getStoryProgressState(season));
  const [webtoonProgress, setWebtoonProgress] = useState<WebtoonProgressState>(() => loadWebtoonProgress(season));

  useEffect(() => {
    setStoryState(getStoryProgressState(season));
    setWebtoonProgress(loadWebtoonProgress(season));
  }, [season]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === `hero_story_progress_${season}` || (season === 'season1' && event.key === 'hero_story_progress')) {
        setStoryState(getStoryProgressState(season));
      }
      if (event.key === `hero_webtoon_progress_${season}`) {
        setWebtoonProgress(loadWebtoonProgress(season));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [season]);

  const persistStoryState = useCallback((updater: (previous: StoryProgressState) => StoryProgressState): StoryProgressState => {
    const previousState = getStoryProgressState(season);
    const nextState = updater(previousState);
    setStoryState(nextState);
    setStoryProgressState(season, nextState);
    return nextState;
  }, [season]);

  const setStoryStage = useCallback((act: number, step: number, isActive = true) => {
    persistStoryState((previous) => ({
      ...previous,
      act: Math.max(0, Math.floor(act)),
      step: Math.max(0, Math.floor(step)),
      isActive,
    }));
  }, [persistStoryState]);

  const completeStoryBattle = useCallback((battleId: string) => {
    return persistStoryState((previous) => {
      if (previous.completedBattleIds.includes(battleId)) return previous;
      return {
        ...previous,
        completedBattleIds: [...previous.completedBattleIds, battleId],
      };
    });
  }, [persistStoryState]);

  const claimStoryBattleReward = useCallback((rewardId: string) => {
    return persistStoryState((previous) => {
      if (previous.claimedRewardIds.includes(rewardId)) return previous;
      return {
        ...previous,
        claimedRewardIds: [...previous.claimedRewardIds, rewardId],
      };
    });
  }, [persistStoryState]);

  const markWebtoonEpisodeRead = useCallback((episodeId: string, panelIndex = 0) => {
    const nextProgress = markEpisodeRead(season, episodeId, panelIndex);
    setWebtoonProgress(nextProgress);
    return nextProgress;
  }, [season]);

  const claimWebtoonEpisodeReward = useCallback((episodeId: string) => {
    const nextProgress = claimEpisodeReward(season, episodeId);
    setWebtoonProgress(nextProgress);
    return nextProgress;
  }, [season]);

  const weeklyWebtoon = useMemo(() => getWeeklyWebtoon(season), [season]);
  const totalStoryEpisodes = useMemo(() => getTotalStoryEpisodes(season), [season]);
  const storyProgressCount = useMemo(() => getStoryProgress(season), [season, storyState]);
  const storyProgressPercent = totalStoryEpisodes > 0 ? Math.round((storyProgressCount / totalStoryEpisodes) * 100) : 0;
  const currentWeeklyEpisodeId = useMemo(() => getCurrentWebtoonEpisode(new Date(), resolvedSeason)?.id ?? null, [resolvedSeason]);

  return {
    season,
    storyState,
    storyProgressCount,
    storyProgressPercent,
    totalStoryEpisodes,
    weeklyWebtoon,
    webtoonProgress,
    currentWeeklyEpisodeId,
    isWeeklyWebtoonCompleted: currentWeeklyEpisodeId ? webtoonProgress.readEpisodeIds.includes(currentWeeklyEpisodeId) : false,
    isWeeklyWebtoonRewardClaimed: currentWeeklyEpisodeId ? hasClaimedEpisodeReward(season, currentWeeklyEpisodeId) : false,
    setStoryStage,
    completeStoryBattle,
    claimStoryBattleReward,
    hasCompletedStoryBattle: (battleId: string) => storyState.completedBattleIds.includes(battleId),
    hasClaimedStoryBattleReward: (rewardId: string) => hasClaimedStoryReward(season, rewardId),
    markWebtoonEpisodeRead,
    claimWebtoonEpisodeReward,
    hasReadWebtoonEpisode: (episodeId: string) => webtoonProgress.readEpisodeIds.includes(episodeId),
    hasClaimedWebtoonReward: (episodeId: string) => hasClaimedEpisodeReward(season, episodeId),
  };
};
