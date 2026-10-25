/**
 * webtoonEpisodes.ts
 * Webtoon seasons, episodes, and release metadata
 */

import WEBTOON_MANIFEST from './webtoonEpisodeManifest.json';

export type WebtoonReleaseStatus = 'live' | 'upcoming' | 'draft';

export interface WebtoonPanel {
  id: string;
  imageUrl?: string;
  captionKey?: string;
  narrationEn?: string;
  narrationKo?: string;
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

const EPISODE_HERO_MAP: Record<number, { focusCardId: number; characterIds: number[] }> = {
  1: { focusCardId: 41, characterIds: [41, 50, 43, 49, 42, 61, 107, 11] }, // Kadan, Aleksandar, Balian, Hercul, Elwin, Lucian, Ysela, Ignis
  2: { focusCardId: 49, characterIds: [49, 50, 43, 45, 44, 46, 70, 74] }, // Hercul, Aleksandar, Balian, Gawain, Kaze, Rondol, Aila, Grimli
  3: { focusCardId: 41, characterIds: [41, 48, 13, 74, 45, 63, 89] }, // Kadan, Robinyard, Belphegor, Grimli, Gawain, Eliana, Medusa Gorgo
  4: { focusCardId: 41, characterIds: [41, 47, 50, 42, 81, 64, 13] }, // Kadan, Gilgamesh, Aleksandar, Elwin, Fenrir, Titania, Belphegor
  5: { focusCardId: 41, characterIds: [41, 45, 62, 25, 13, 74, 70] }, // Kadan, Gawain, Celia, Aeolus, Belphegor, Grimli, Aila
  6: { focusCardId: 41, characterIds: [41, 66, 74, 43, 11, 84, 64] }, // Kadan, Malfuon, Grimli, Balian, Ignis, Griffon, Titania
  7: { focusCardId: 41, characterIds: [41, 81, 87, 66, 88, 61, 64] }, // Kadan, Fenrir, Barghest, Malfuon, Ursoc, Lucian, Titania
  8: { focusCardId: 41, characterIds: [41, 62, 11, 63, 71, 90] }, // Kadan, Celia, Ignis, Eliana, Balbo, Pegasus
  9: { focusCardId: 41, characterIds: [41, 11, 62, 51, 25, 61, 107] }, // Kadan, Ignis, Celia, Walker, Aeolus, Lucian, Ysela
  10: { focusCardId: 41, characterIds: [41, 11, 43, 61, 62, 107, 51] }, // Kadan, Ignis, Balian, Lucian, Celia, Ysela, Walker
  11: { focusCardId: 41, characterIds: [41, 43, 11, 62, 13, 89, 74] }, // Kadan, Balian, Ignis, Celia, Belphegor, Medusa Gorgo, Grimli
  12: { focusCardId: 41, characterIds: [41, 43, 11, 49, 61, 99, 107] }, // Kadan, Balian, Ignis, Hercul, Lucian, Magitech Golem, Ysela
  13: { focusCardId: 41, characterIds: [41, 86, 62, 11, 25, 90] }, // Kadan, Leonar, Celia, Ignis, Aeolus, Pegasus
  14: { focusCardId: 41, characterIds: [41, 46, 11, 62, 13, 61, 89] }, // Kadan, Rondol, Ignis, Celia, Belphegor, Lucian, Medusa Gorgo
  15: { focusCardId: 41, characterIds: [41, 86, 62, 11, 38, 13, 46] }, // Kadan, Leonar, Celia, Ignis, Orihalcon, Belphegor, Rondol
  16: { focusCardId: 41, characterIds: [41, 11, 43, 62, 23, 46, 107] }, // Kadan, Ignis, Balian, Celia, Sylphid, Rondol, Ysela
  17: { focusCardId: 41, characterIds: [41, 62, 46, 11, 84, 64, 81] }, // Kadan, Celia, Rondol, Ignis, Griffon, Titania, Fenrir
  18: { focusCardId: 41, characterIds: [41, 62, 11, 69, 99, 64] }, // Kadan, Celia, Ignis, Gandar, Magitech Golem, Titania
  19: { focusCardId: 41, characterIds: [41, 25, 62, 11, 45, 13, 69] }, // Kadan, Aeolus, Celia, Ignis, Gawain, Belphegor, Gandar
  20: { focusCardId: 41, characterIds: [41, 62, 11, 69, 25, 46, 90] }, // Kadan, Celia, Ignis, Gandar, Aeolus, Rondol, Pegasus
  21: { focusCardId: 41, characterIds: [41, 11, 61, 62, 60, 86, 38] }, // Kadan, Ignis, Lucian, Celia, Death Knight Artus, Leonar, Orihalcon
  22: { focusCardId: 41, characterIds: [41, 62, 74, 11, 60, 84, 64] }, // Kadan, Celia, Grimli, Ignis, Death Knight Artus, Griffon, Titania
  23: { focusCardId: 41, characterIds: [41, 11, 62, 43, 50, 80, 86] }, // Kadan, Ignis, Celia, Balian, Aleksandar, Ironforge, Leonar
  24: { focusCardId: 41, characterIds: [41, 11, 62, 47, 60, 38] }, // Kadan, Ignis, Celia, Gilgamesh, Death Knight Artus, Orihalcon
  25: { focusCardId: 41, characterIds: [41, 61, 62, 11, 60, 80] }, // Kadan, Lucian, Celia, Ignis, Death Knight Artus, Ironforge
  26: { focusCardId: 41, characterIds: [41, 11, 62, 61, 60, 80] }, // Kadan, Ignis, Celia, Lucian, Death Knight Artus, Ironforge
  27: { focusCardId: 41, characterIds: [41, 11, 62, 47, 81, 64, 84] }, // Kadan, Ignis, Celia, Gilgamesh, Fenrir, Titania, Griffon
  28: { focusCardId: 41, characterIds: [41, 11, 61, 62, 86] }, // Kadan, Ignis, Lucian, Celia, Leonar
  29: { focusCardId: 41, characterIds: [41, 62, 11, 5, 38, 54] }, // Kadan, Celia, Ignis, Aqualord, Orihalcon, Arachne
  30: { focusCardId: 41, characterIds: [41, 62, 11, 5, 66, 65, 87] }, // Kadan, Celia, Ignis, Aqualord, Malfuon, Sylvania, Barghest
  31: { focusCardId: 41, characterIds: [41, 62, 11, 1, 2, 5, 69] }, // Kadan, Celia, Ignis, Aquaris, Naiad, Aqualord, Gandar
  32: { focusCardId: 62, characterIds: [62, 41, 23, 11, 61, 69, 1] }, // Celia, Kadan, Sylphid, Ignis, Lucian, Gandar, Aquaris
  33: { focusCardId: 41, characterIds: [41, 61, 62, 69, 60, 5] }, // Kadan, Lucian, Celia, Gandar, Death Knight Artus, Aqualord
  34: { focusCardId: 41, characterIds: [41, 62, 45, 74, 25, 60, 70] }, // Kadan, Celia, Gawain, Grimli, Aeolus, Death Knight Artus, Aila
  35: { focusCardId: 41, characterIds: [41, 62, 61, 49, 25, 74, 70] }, // Kadan, Celia, Lucian, Hercul, Aeolus, Grimli, Aila
  36: { focusCardId: 41, characterIds: [41, 62, 61, 81, 47, 60, 64] }, // Kadan, Celia, Lucian, Fenrir, Gilgamesh, Death Knight Artus, Titania
  37: { focusCardId: 41, characterIds: [41, 62, 81, 61, 47, 11, 60] }, // Kadan, Celia, Fenrir, Lucian, Gilgamesh, Ignis, Death Knight Artus
  38: { focusCardId: 41, characterIds: [41, 61, 62, 47, 80, 70, 45] }, // Kadan, Lucian, Celia, Gilgamesh, Ironforge, Aila, Gawain
  39: { focusCardId: 41, characterIds: [41, 61, 62, 11, 5, 60, 90] }, // Kadan, Lucian, Celia, Ignis, Aqualord, Death Knight Artus, Pegasus
  40: { focusCardId: 41, characterIds: [41, 62, 11, 50, 43, 47, 69, 107] }, // Kadan, Celia, Ignis, Aleksandar, Balian, Gilgamesh, Gandar, Ysela
};

const buildSeasonEpisodes = (): WebtoonEpisode[] => {
  const manifest = WEBTOON_MANIFEST as Record<string, {
    episodeNumber: number;
    episodeTitle: string;
    episodeTitleKo?: string;
    totalImages: number;
    images: Array<{
      index: number;
      fileName: string;
      imageUrl: string;
      localArtUrl?: string;
      type: string;
      narrationEn?: string;
      narrationKo?: string;
    }>;
  }>;

  return Array.from({ length: 40 }, (_, i) => {
    const epNum = i + 1;
    const pad = String(epNum).padStart(2, '0');
    const epData = manifest[String(epNum)];
    const epImages = epData?.images || [];
    const heroMeta = EPISODE_HERO_MAP[epNum] || { focusCardId: 41, characterIds: [41] };

    const panels: WebtoonPanel[] = epImages.map((img) => {
      const baseImg = img.localArtUrl || img.imageUrl || `/images/webtoon/episode_${pad}/scene_${String(img.index).padStart(2, '0')}.webp`;
      const cleanImg = baseImg.split('?')[0];
      return {
        id: `ep_${pad}_p${img.index}`,
        imageUrl: `${cleanImg}?v=conquest2009_v2`,
        captionKey: img.index === 0 ? `webtoon_ep_${pad}_title` : `webtoon_ep_${pad}_caption${img.index}`,
        narrationEn: img.narrationEn,
        narrationKo: img.narrationKo,
        focusCardId: heroMeta.focusCardId,
      };
    });

    return {
      id: `ep_${pad}`,
      episodeNumber: epNum,
      titleKey: `webtoon_ep_${pad}_title`,
      loglineKey: `webtoon_ep_${pad}_logline`,
      releaseDate: '2026-01-01',
      characterIds: heroMeta.characterIds,
      releaseStatus: 'live' as const,
      panels: panels.length > 0 ? panels : [
        {
          id: `ep_${pad}_p0`,
          imageUrl: `/images/webtoon/episode_${pad}/scene_00.webp`,
          captionKey: `webtoon_ep_${pad}_title`,
          focusCardId: heroMeta.focusCardId,
        }
      ],
    };
  });
};

export const WEBTOON_SEASONS: WebtoonSeason[] = [
  {
    id: 's1',
    titleKey: 'webtoon_season1_title',
    episodes: buildSeasonEpisodes(),
  },
  {
    id: 'season1',
    titleKey: 'webtoon_season1_title',
    episodes: buildSeasonEpisodes(),
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
