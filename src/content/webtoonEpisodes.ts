/**
 * webtoonEpisodes.ts
 * Webtoon seasons, episodes, and release metadata
 */

import { getAssetUrl } from '../lib/utils';

export type WebtoonReleaseStatus = 'live' | 'upcoming' | 'draft';

export interface WebtoonPanel {
  id: string;
  imageUrl?: string;
  captionKey?: string;
  focusCardId?: number;
}

export interface WebtoonEpisode {
  id: string;
  episodeNumber: number;
  titleKey: string;
  loglineKey: string;
  releaseDate: string;
  characterIds: number[];
  releaseStatus?: WebtoonReleaseStatus;
  panels: WebtoonPanel[];
}

export interface WebtoonSeason {
  id: string;
  titleKey: string;
  episodes: WebtoonEpisode[];
}

export const WEBTOON_SEASONS: WebtoonSeason[] = [
  {
    id: 's1',
    titleKey: 'webtoon_season1_title',
    episodes: Array.from({ length: 40 }, (_, i) => {
      const epNum = i + 1;
      const pad = String(epNum).padStart(2, '0');
      return {
        id: `ep_${pad}`,
        episodeNumber: epNum,
        titleKey: `webtoon_ep_${pad}_title`,
        loglineKey: `webtoon_ep_${pad}_logline`,
        releaseDate: '2026-01-01',
        characterIds: [(epNum % 110) || 1],
        releaseStatus: 'live',
        panels: [
          {
            id: `ep_${pad}_p1`,
            imageUrl: getAssetUrl('/banner/010.png'),
            captionKey: `webtoon_ep_${pad}_caption1`,
            focusCardId: (epNum % 110) || 1,
          },
        ],
      };
    }),
  },
  {
    id: 'season1',
    titleKey: 'webtoon_season1_title',
    episodes: Array.from({ length: 40 }, (_, i) => {
      const epNum = i + 1;
      const pad = String(epNum).padStart(2, '0');
      return {
        id: `ep_${pad}`,
        episodeNumber: epNum,
        titleKey: `webtoon_ep_${pad}_title`,
        loglineKey: `webtoon_ep_${pad}_logline`,
        releaseDate: '2026-01-01',
        characterIds: [(epNum % 110) || 1],
        releaseStatus: 'live',
        panels: [
          {
            id: `ep_${pad}_p1`,
            imageUrl: getAssetUrl('/banner/010.png'),
            captionKey: `webtoon_ep_${pad}_caption1`,
            focusCardId: (epNum % 110) || 1,
          },
        ],
      };
    }),
  },
];

export function getWebtoonSeasonById(id: string): WebtoonSeason | undefined {
  if (!id) return WEBTOON_SEASONS[0];
  const normalized = id.toLowerCase();
  return (
    WEBTOON_SEASONS.find((s) => s.id.toLowerCase() === normalized) ||
    WEBTOON_SEASONS[0]
  );
}

export function getCurrentWebtoonEpisode(
  date: Date,
  seasonInput: WebtoonSeason | string,
): WebtoonEpisode | undefined {
  const season = typeof seasonInput === 'string' ? getWebtoonSeasonById(seasonInput) : seasonInput;
  if (!season || !season.episodes.length) return undefined;
  return season.episodes[0];
}

export function getEpisodeById(id: string): WebtoonEpisode | undefined {
  for (const s of WEBTOON_SEASONS) {
    const ep = s.episodes.find((e) => e.id === id);
    if (ep) return ep;
  }
  return undefined;
}

export function getWebtoonSeasonEpisodeCount(seasonId: string): number {
  const season = getWebtoonSeasonById(seasonId);
  return season ? season.episodes.length : 40;
}

export function getWebtoonEpisodesForSeason(
  arg1: WebtoonSeason | string | Date,
  arg2?: WebtoonSeason | string,
): WebtoonEpisode[] {
  let targetSeason: WebtoonSeason | undefined;
  if (arg2) {
    targetSeason = typeof arg2 === 'string' ? getWebtoonSeasonById(arg2) : arg2;
  } else {
    targetSeason = typeof arg1 === 'string' ? getWebtoonSeasonById(arg1) : (arg1 as WebtoonSeason);
  }
  return targetSeason ? targetSeason.episodes : WEBTOON_SEASONS[0].episodes;
}
