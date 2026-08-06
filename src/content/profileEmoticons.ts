import type { UserStats } from '../types';

export const PROFILE_EMOTICON_STORAGE_KEY = 'hero_user_emoticon';
export const PROFILE_BADGE_STORAGE_KEY = 'hero_user_badge';
export const PROFILE_TITLE_STORAGE_KEY = 'hero_user_title';

export const DEFAULT_PROFILE_EMOTICON_KEY = 'spark';
export const DEFAULT_PROFILE_BADGE_KEY = 'rookie';
export const DEFAULT_PROFILE_TITLE_KEY = 'new_hunter';

export type ProfileUnlockRule =
  | { type: 'default' }
  | { type: 'wins'; value: number }
  | { type: 'collection'; value: number }
  | { type: 'season'; value: string };

export interface ProfileEmoticonOption {
  key: string;
  symbol: string;
  labelKey: string;
  descriptionKey: string;
  unlock: ProfileUnlockRule;
}

export interface ProfileBadgeOption {
  key: string;
  symbol: string;
  labelKey: string;
  descriptionKey: string;
  unlock: ProfileUnlockRule;
}

export interface ProfileTitleOption {
  key: string;
  labelKey: string;
  descriptionKey: string;
  unlock: ProfileUnlockRule;
}

export interface ProfileUnlockContext {
  stats: UserStats;
  uniqueCardCount: number;
  currentSeason: string;
}

export const PROFILE_EMOTICONS: ProfileEmoticonOption[] = [
  {
    key: 'spark',
    symbol: '✨',
    labelKey: 'profile_emoticon_spark_label',
    descriptionKey: 'profile_emoticon_spark_desc',
    unlock: { type: 'default' },
  },
  {
    key: 'smile',
    symbol: '😊',
    labelKey: 'profile_emoticon_smile_label',
    descriptionKey: 'profile_emoticon_smile_desc',
    unlock: { type: 'default' },
  },
  {
    key: 'flame',
    symbol: '🔥',
    labelKey: 'profile_emoticon_flame_label',
    descriptionKey: 'profile_emoticon_flame_desc',
    unlock: { type: 'wins', value: 10 },
  },
  {
    key: 'storm',
    symbol: '⚡',
    labelKey: 'profile_emoticon_storm_label',
    descriptionKey: 'profile_emoticon_storm_desc',
    unlock: { type: 'collection', value: 20 },
  },
  {
    key: 'cosmos',
    symbol: '🌌',
    labelKey: 'profile_emoticon_cosmos_label',
    descriptionKey: 'profile_emoticon_cosmos_desc',
    unlock: { type: 'season', value: 'season3' },
  },
];

export const PROFILE_BADGES: ProfileBadgeOption[] = [
  {
    key: 'rookie',
    symbol: '🛡️',
    labelKey: 'profile_badge_rookie_label',
    descriptionKey: 'profile_badge_rookie_desc',
    unlock: { type: 'default' },
  },
  {
    key: 'supporter',
    symbol: '🤝',
    labelKey: 'profile_badge_supporter_label',
    descriptionKey: 'profile_badge_supporter_desc',
    unlock: { type: 'collection', value: 10 },
  },
  {
    key: 'streak',
    symbol: '🏆',
    labelKey: 'profile_badge_streak_label',
    descriptionKey: 'profile_badge_streak_desc',
    unlock: { type: 'wins', value: 25 },
  },
  {
    key: 'season3',
    symbol: '🌠',
    labelKey: 'profile_badge_season3_label',
    descriptionKey: 'profile_badge_season3_desc',
    unlock: { type: 'season', value: 'season3' },
  },
];

export const PROFILE_TITLES: ProfileTitleOption[] = [
  {
    key: 'new_hunter',
    labelKey: 'profile_title_new_hunter_label',
    descriptionKey: 'profile_title_new_hunter_desc',
    unlock: { type: 'default' },
  },
  {
    key: 'deck_stylist',
    labelKey: 'profile_title_deck_stylist_label',
    descriptionKey: 'profile_title_deck_stylist_desc',
    unlock: { type: 'collection', value: 15 },
  },
  {
    key: 'arena_runner',
    labelKey: 'profile_title_arena_runner_label',
    descriptionKey: 'profile_title_arena_runner_desc',
    unlock: { type: 'wins', value: 15 },
  },
  {
    key: 'season_signal',
    labelKey: 'profile_title_season_signal_label',
    descriptionKey: 'profile_title_season_signal_desc',
    unlock: { type: 'season', value: 'season3' },
  },
];

export const getProfileEmoticonByKey = (key?: string | null) =>
  PROFILE_EMOTICONS.find((option) => option.key === key) ?? PROFILE_EMOTICONS[0];

export const getProfileBadgeByKey = (key?: string | null) =>
  PROFILE_BADGES.find((option) => option.key === key) ?? PROFILE_BADGES[0];

export const getProfileTitleByKey = (key?: string | null) =>
  PROFILE_TITLES.find((option) => option.key === key) ?? PROFILE_TITLES[0];

export const isProfileUnlockSatisfied = (
  unlock: ProfileUnlockRule,
  context: ProfileUnlockContext,
) => {
  switch (unlock.type) {
    case 'default':
      return true;
    case 'wins':
      return (context.stats.wins || 0) >= unlock.value;
    case 'collection':
      return context.uniqueCardCount >= unlock.value;
    case 'season':
      return context.currentSeason === unlock.value;
    default:
      return false;
  }
};

export const getUnlockRequirementKey = (unlock: ProfileUnlockRule) => {
  switch (unlock.type) {
    case 'wins':
      return 'profile_unlock_requirement_wins';
    case 'collection':
      return 'profile_unlock_requirement_collection';
    case 'season':
      return 'profile_unlock_requirement_season';
    default:
      return 'profile_unlock_requirement_default';
  }
};

export const getSafeProfileSelection = <T extends { key: string; unlock: ProfileUnlockRule }>(
  options: T[],
  selectedKey: string | null | undefined,
  context: ProfileUnlockContext,
) => {
  const selected = options.find((option) => option.key === selectedKey);
  if (selected && isProfileUnlockSatisfied(selected.unlock, context)) {
    return selected.key;
  }

  return options.find((option) => isProfileUnlockSatisfied(option.unlock, context))?.key ?? options[0]?.key ?? '';
};
