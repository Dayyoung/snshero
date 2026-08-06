import type { DatabaseCard, Language } from "../types";
import { CARD_DATABASE } from "../cardDatabase";
import { getCharacterIpProfile } from "../content/characterIpUtils";
import { getCurrentWebtoonEpisode, getWebtoonSeasonById, getWebtoonSeasonEpisodeCount, type WebtoonReleaseStatus } from "../content/webtoonEpisodes";
import { t } from "./i18n";

/**
 * 오늘의 캐릭터를 날짜와 시즌 기반으로 결정론적으로 선택한다.
 * 같은 날짜 + 시즌이면 항상 같은 카드가 선택된다.
 */
export function getTodayCardId(season: string): number {
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const seed = hashString(`${dateKey}_${season}`);
  const totalCards = Object.keys(CARD_DATABASE).length; // 110
  return (seed % totalCards) + 1;
}

/** 오늘의 캐릭터 DB 데이터 조회 */
export function getTodayCard(season: string): DatabaseCard {
  const cardId = getTodayCardId(season);
  return CARD_DATABASE[cardId] || CARD_DATABASE[1];
}

/** 오늘의 캐릭터 대표 대사 (i18n) */
export function getTodayCharacterLine(cardId: number, language: Language): string {
  const profile = getCharacterIpProfile(cardId);
  if (profile?.signatureLineKey) {
    return t(profile.signatureLineKey, language);
  }
  const card = CARD_DATABASE[cardId];
  if (card?.lore_ko && language === 'ko') {
    return card.lore_ko.slice(0, 80);
  }
  if (card?.lore_en) {
    return card.lore_en.slice(0, 80);
  }
  return `"${card?.title_dis || '???'}"`;
}

/** 오늘의 캐릭터 스토리 훅 (i18n) */
export function getTodayStoryHook(cardId: number, language: Language): string {
  const profile = getCharacterIpProfile(cardId);
  if (profile?.webtoonHookKey) {
    return t(profile.webtoonHookKey, language);
  }
  const card = CARD_DATABASE[cardId];
  if (language === 'ko') {
    return `${card?.title || '???'}의 이야기가 궁금하다면?`;
  }
  return `Curious about ${card?.title_en || '???'}'s story?`;
}

/** 이번 주 웹툰 Mock 데이터 (추후 07~08에서 실제 데이터로 교체) */
export interface WeeklyWebtoon {
  id: string;
  titleKo: string;
  titleEn: string;
  episodeNumber: number;
  releaseDate: string;
  summaryKo: string;
  summaryEn: string;
  characterIds: number[];
  featuredCardId: number;
  status: WebtoonReleaseStatus;
  imageUrl?: string;
}

export function getWeeklyWebtoon(season: string): WeeklyWebtoon | null {
  const resolvedSeason = getWebtoonSeasonById(season) ?? getWebtoonSeasonById('s1');
  if (!resolvedSeason) return null;

  const episode = getCurrentWebtoonEpisode(new Date(), resolvedSeason);
  if (!episode) return null;

  return {
    id: episode.id,
    titleKo: t(episode.titleKey, 'ko'),
    titleEn: t(episode.titleKey, 'en'),
    episodeNumber: episode.episodeNumber,
    releaseDate: episode.releaseDate,
    summaryKo: t(episode.loglineKey, 'ko'),
    summaryEn: t(episode.loglineKey, 'en'),
    characterIds: episode.characterIds,
    featuredCardId: episode.panels[0]?.focusCardId ?? episode.characterIds[0] ?? 1,
    status: episode.releaseStatus ?? 'live',
    imageUrl: episode.panels[0]?.imageUrl,
  };
}

/** 시즌 스토리 진행 상태 */
export interface StoryProgressState {
  act: number;
  step: number;
  isActive: boolean;
  completedBattleIds: string[];
  claimedRewardIds: string[];
  updatedAt: number;
}

const STORY_STORAGE_KEY = 'hero_story_progress';

const defaultStoryProgressState = (): StoryProgressState => ({
  act: 0,
  step: 0,
  isActive: false,
  completedBattleIds: [],
  claimedRewardIds: [],
  updatedAt: Date.now(),
});

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
};

const normalizeNumber = (value: unknown, fallback: number): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};

const normalizeStoryProgressState = (value: unknown): StoryProgressState => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const completedBattleIds = Array.from({ length: Math.max(0, Math.floor(value)) }, (_, index) => `legacy-battle-${index + 1}`);
    return {
      ...defaultStoryProgressState(),
      completedBattleIds,
      isActive: value > 0,
    };
  }

  if (!isRecord(value)) {
    return defaultStoryProgressState();
  }

  return {
    act: normalizeNumber(value.act, 0),
    step: normalizeNumber(value.step, 0),
    isActive: typeof value.isActive === 'boolean' ? value.isActive : false,
    completedBattleIds: normalizeStringArray(value.completedBattleIds),
    claimedRewardIds: normalizeStringArray(value.claimedRewardIds),
    updatedAt: normalizeNumber(value.updatedAt, Date.now()),
  };
};

const readStoryProgressRaw = (season: string): unknown => {
  if (typeof window === 'undefined') return null;

  const seasonKey = `${STORY_STORAGE_KEY}_${season}`;
  const seasonValue = localStorage.getItem(seasonKey);
  if (seasonValue !== null) return seasonValue;

  if (season === 'season1') {
    const legacyValue = localStorage.getItem(STORY_STORAGE_KEY);
    if (legacyValue !== null) {
      localStorage.setItem(seasonKey, legacyValue);
      return legacyValue;
    }
  }

  return null;
};

export function getStoryProgressState(season: string): StoryProgressState {
  if (typeof window === 'undefined') return defaultStoryProgressState();

  const raw = readStoryProgressRaw(season);
  if (raw === null) return defaultStoryProgressState();

  try {
    if (typeof raw === 'string') {
      return normalizeStoryProgressState(JSON.parse(raw) as unknown);
    }
    return normalizeStoryProgressState(raw);
  } catch {
    return defaultStoryProgressState();
  }
}

export function setStoryProgressState(season: string, progress: StoryProgressState): void {
  if (typeof window === 'undefined') return;

  const normalized: StoryProgressState = {
    act: Math.max(0, Math.floor(progress.act)),
    step: Math.max(0, Math.floor(progress.step)),
    isActive: progress.isActive,
    completedBattleIds: Array.from(new Set(progress.completedBattleIds.filter((id) => id.trim().length > 0))),
    claimedRewardIds: Array.from(new Set(progress.claimedRewardIds.filter((id) => id.trim().length > 0))),
    updatedAt: Date.now(),
  };

  const serialized = JSON.stringify(normalized);
  localStorage.setItem(`${STORY_STORAGE_KEY}_${season}`, serialized);
  if (season === 'season1') {
    localStorage.setItem(STORY_STORAGE_KEY, serialized);
  }
}

export function markStoryBattleComplete(season: string, battleId: string): StoryProgressState {
  const progress = getStoryProgressState(season);
  if (progress.completedBattleIds.includes(battleId)) return progress;

  const nextProgress: StoryProgressState = {
    ...progress,
    completedBattleIds: [...progress.completedBattleIds, battleId],
  };
  setStoryProgressState(season, nextProgress);
  return nextProgress;
}

export function claimStoryReward(season: string, rewardId: string): StoryProgressState {
  const progress = getStoryProgressState(season);
  if (progress.claimedRewardIds.includes(rewardId)) return progress;

  const nextProgress: StoryProgressState = {
    ...progress,
    claimedRewardIds: [...progress.claimedRewardIds, rewardId],
  };
  setStoryProgressState(season, nextProgress);
  return nextProgress;
}

export function hasClaimedStoryReward(season: string, rewardId: string): boolean {
  return getStoryProgressState(season).claimedRewardIds.includes(rewardId);
}

/** 시즌 스토리 진행도 저장 */
export function getStoryProgress(season: string): number {
  const progress = getStoryProgressState(season);
  return Math.max(progress.completedBattleIds.length, progress.act * 2 + progress.step);
}

export function setStoryProgress(season: string, progress: number): void {
  if (typeof window === 'undefined') return;

  const safeProgress = Math.max(0, Math.floor(progress));
  setStoryProgressState(season, {
    ...getStoryProgressState(season),
    act: Math.floor(safeProgress / 2),
    step: safeProgress % 2,
    isActive: safeProgress > 0,
  });
}

/** 시즌 스토리의 총 에피소드 수 */
export function getTotalStoryEpisodes(season: string): number {
  return getWebtoonSeasonEpisodeCount(season) || getWebtoonSeasonEpisodeCount('s1');
}

/** 간단한 문자열 해시 (시드 생성용) */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
