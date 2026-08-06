import type { CharacterFaction } from '../types';

/** 시즌 이벤트 미션 */
export interface SeasonEventMission {
  id: string;
  titleKey: string;
  descKey: string;
  targetValue: number;
  rewardSns: number;
  rewardCardShardIds: number[];
  rewardCardShardAmount: number;
  type: 'battle' | 'collection' | 'webtoon' | 'community' | 'daily';
}

/** 시즌 보상 트랙 단계 */
export interface SeasonRewardTier {
  tier: number;
  pointsRequired: number;
  rewardSns: number;
  rewardItemKeys: string[];
  rewardTitleKey: string;
  isPremium: boolean;
}

/** 시즌 설정 */
export interface SeasonConfig {
  id: string;
  titleKey: string;
  theme: string;
  primaryFaction: CharacterFaction;
  secondaryFaction: CharacterFaction;
  keyCharacters: number[];
  webtoonEpisodes: string[];
  eventMissions: SeasonEventMission[];
  rewardTiers: SeasonRewardTier[];
  startDate: string;
  endDate: string;
  storyArcKey: string;
  featuredBattleCards: number[];
  communityMissionKey: string;
  seasonBadgeKey: string;
}

/** 시즌 타임라인 위크 정보 */
export interface SeasonWeekInfo {
  weekNumber: number;
  startDate: string;
  endDate: string;
  themeKey: string;
  newEpisodes: string[];
  newMissions: string[];
  nextWeekPreviewKey: string;
}

/** 시즌 1 — 개막의 서막 */
const SEASON_1: SeasonConfig = {
  id: 'season1',
  titleKey: 'season_title_1',
  theme: 'awakening',
  primaryFaction: 'human',
  secondaryFaction: 'elf',
  keyCharacters: [1, 5, 10, 15, 22],
  webtoonEpisodes: ['s1e1', 's1e2', 's1e3', 's1e4'],
  eventMissions: [
    {
      id: 's1_mission_1',
      titleKey: 'season_mission_battle_royale',
      descKey: 'season_mission_battle_royale_desc',
      targetValue: 10,
      rewardSns: 5000,
      rewardCardShardIds: [1],
      rewardCardShardAmount: 5,
      type: 'battle',
    },
    {
      id: 's1_mission_2',
      titleKey: 'season_mission_collect_water',
      descKey: 'season_mission_collect_water_desc',
      targetValue: 5,
      rewardSns: 3000,
      rewardCardShardIds: [5],
      rewardCardShardAmount: 3,
      type: 'collection',
    },
    {
      id: 's1_mission_3',
      titleKey: 'season_mission_read_webtoon',
      descKey: 'season_mission_read_webtoon_desc',
      targetValue: 4,
      rewardSns: 4000,
      rewardCardShardIds: [],
      rewardCardShardAmount: 0,
      type: 'webtoon',
    },
    {
      id: 's1_mission_4',
      titleKey: 'season_mission_community_post',
      descKey: 'season_mission_community_post_desc',
      targetValue: 3,
      rewardSns: 2000,
      rewardCardShardIds: [10],
      rewardCardShardAmount: 2,
      type: 'community',
    },
  ],
  rewardTiers: [
    { tier: 1, pointsRequired: 100, rewardSns: 1000, rewardItemKeys: [], rewardTitleKey: 'season_reward_tier_1', isPremium: false },
    { tier: 2, pointsRequired: 300, rewardSns: 2000, rewardItemKeys: ['silver_card_pack'], rewardTitleKey: 'season_reward_tier_2', isPremium: false },
    { tier: 3, pointsRequired: 600, rewardSns: 3500, rewardItemKeys: [], rewardTitleKey: 'season_reward_tier_3', isPremium: false },
    { tier: 4, pointsRequired: 1000, rewardSns: 5000, rewardItemKeys: ['gold_card_pack'], rewardTitleKey: 'season_reward_tier_4', isPremium: true },
    { tier: 5, pointsRequired: 1500, rewardSns: 8000, rewardItemKeys: ['season1_skin'], rewardTitleKey: 'season_reward_tier_5', isPremium: true },
  ],
  startDate: '2026-01-01',
  endDate: '2026-03-31',
  storyArcKey: 'season_story_arc_1',
  featuredBattleCards: [1, 5, 15],
  communityMissionKey: 'season_community_mission_1',
  seasonBadgeKey: 'season_badge_awakening',
};

/** 시즌 2 — 혼돈의 폭풍 */
const SEASON_2: SeasonConfig = {
  id: 'season2',
  titleKey: 'season_title_2',
  theme: 'chaos',
  primaryFaction: 'fire',
  secondaryFaction: 'wind',
  keyCharacters: [8, 12, 18, 25, 30],
  webtoonEpisodes: ['s2e1', 's2e2', 's2e3', 's2e4', 's2e5'],
  eventMissions: [
    {
      id: 's2_mission_1',
      titleKey: 'season_mission_fire_storm',
      descKey: 'season_mission_fire_storm_desc',
      targetValue: 15,
      rewardSns: 6000,
      rewardCardShardIds: [8],
      rewardCardShardAmount: 5,
      type: 'battle',
    },
    {
      id: 's2_mission_2',
      titleKey: 'season_mission_collect_fire',
      descKey: 'season_mission_collect_fire_desc',
      targetValue: 7,
      rewardSns: 4000,
      rewardCardShardIds: [12],
      rewardCardShardAmount: 3,
      type: 'collection',
    },
    {
      id: 's2_mission_3',
      titleKey: 'season_mission_read_webtoon_s2',
      descKey: 'season_mission_read_webtoon_s2_desc',
      targetValue: 5,
      rewardSns: 5000,
      rewardCardShardIds: [],
      rewardCardShardAmount: 0,
      type: 'webtoon',
    },
  ],
  rewardTiers: [
    { tier: 1, pointsRequired: 150, rewardSns: 1500, rewardItemKeys: [], rewardTitleKey: 'season_reward_tier_1', isPremium: false },
    { tier: 2, pointsRequired: 400, rewardSns: 3000, rewardItemKeys: ['silver_card_pack'], rewardTitleKey: 'season_reward_tier_2', isPremium: false },
    { tier: 3, pointsRequired: 800, rewardSns: 4500, rewardItemKeys: [], rewardTitleKey: 'season_reward_tier_3', isPremium: false },
    { tier: 4, pointsRequired: 1300, rewardSns: 6000, rewardItemKeys: ['gold_card_pack'], rewardTitleKey: 'season_reward_tier_4', isPremium: true },
    { tier: 5, pointsRequired: 2000, rewardSns: 10000, rewardItemKeys: ['season2_skin'], rewardTitleKey: 'season_reward_tier_5', isPremium: true },
  ],
  startDate: '2026-04-01',
  endDate: '2026-06-30',
  storyArcKey: 'season_story_arc_2',
  featuredBattleCards: [8, 12, 25],
  communityMissionKey: 'season_community_mission_2',
  seasonBadgeKey: 'season_badge_chaos',
};

/** 시즌 3 — 그림자 군주의 귀환 */
const SEASON_3: SeasonConfig = {
  id: 'season3',
  titleKey: 'season_title_3',
  theme: 'shadow',
  primaryFaction: 'undead',
  secondaryFaction: 'monster',
  keyCharacters: [20, 28, 35, 42, 50],
  webtoonEpisodes: ['s3e1', 's3e2', 's3e3', 's3e4', 's3e5', 's3e6'],
  eventMissions: [
    {
      id: 's3_mission_1',
      titleKey: 'season_mission_shadow_war',
      descKey: 'season_mission_shadow_war_desc',
      targetValue: 20,
      rewardSns: 7000,
      rewardCardShardIds: [20],
      rewardCardShardAmount: 7,
      type: 'battle',
    },
    {
      id: 's3_mission_2',
      titleKey: 'season_mission_collect_undead',
      descKey: 'season_mission_collect_undead_desc',
      targetValue: 8,
      rewardSns: 5000,
      rewardCardShardIds: [28],
      rewardCardShardAmount: 3,
      type: 'collection',
    },
    {
      id: 's3_mission_3',
      titleKey: 'season_mission_daily_checkin',
      descKey: 'season_mission_daily_checkin_desc',
      targetValue: 14,
      rewardSns: 3500,
      rewardCardShardIds: [],
      rewardCardShardAmount: 0,
      type: 'daily',
    },
  ],
  rewardTiers: [
    { tier: 1, pointsRequired: 200, rewardSns: 2000, rewardItemKeys: [], rewardTitleKey: 'season_reward_tier_1', isPremium: false },
    { tier: 2, pointsRequired: 500, rewardSns: 4000, rewardItemKeys: ['silver_card_pack'], rewardTitleKey: 'season_reward_tier_2', isPremium: false },
    { tier: 3, pointsRequired: 1000, rewardSns: 6000, rewardItemKeys: [], rewardTitleKey: 'season_reward_tier_3', isPremium: false },
    { tier: 4, pointsRequired: 1600, rewardSns: 8000, rewardItemKeys: ['gold_card_pack', 'shadow_essence'], rewardTitleKey: 'season_reward_tier_4', isPremium: true },
    { tier: 5, pointsRequired: 2400, rewardSns: 12000, rewardItemKeys: ['season3_skin'], rewardTitleKey: 'season_reward_tier_5', isPremium: true },
  ],
  startDate: '2026-07-01',
  endDate: '2026-09-30',
  storyArcKey: 'season_story_arc_3',
  featuredBattleCards: [20, 28, 50],
  communityMissionKey: 'season_community_mission_3',
  seasonBadgeKey: 'season_badge_shadow',
};

/** 모든 시즌 설정 */
export const SEASON_CONFIGS: Record<string, SeasonConfig> = {
  season1: SEASON_1,
  season2: SEASON_2,
  season3: SEASON_3,
};

/** 현재 시즌 설정 가져오기 */
export function getCurrentSeasonConfig(currentSeason: string): SeasonConfig {
  return SEASON_CONFIGS[currentSeason] ?? SEASON_1;
}

/** 시즌 타임라인 (주차별 정보) 가져오기 */
export function getSeasonTimeline(currentSeason: string): SeasonWeekInfo[] {
  const config = getCurrentSeasonConfig(currentSeason);
  const start = new Date(config.startDate);
  const end = new Date(config.endDate);
  const weeks: SeasonWeekInfo[] = [];

  let weekNum = 1;
  let cursor = new Date(start);
  while (cursor < end) {
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);
    if (weekEnd > end) weekEnd.setTime(end.getTime());

    // Assign episodes: distribute evenly across weeks
    const episodeCount = config.webtoonEpisodes.length;
    const weeksTotal = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const epsPerWeek = Math.max(1, Math.ceil(episodeCount / weeksTotal));
    const startIdx = (weekNum - 1) * epsPerWeek;
    const newEpisodes = config.webtoonEpisodes.slice(startIdx, startIdx + epsPerWeek);

    // Assign missions: spread across first half of season
    const missionHalfWeeks = Math.ceil(weeksTotal / 2);
    const missionsPerWeek = Math.max(1, Math.ceil(config.eventMissions.length / missionHalfWeeks));
    const mStartIdx = (weekNum - 1) * missionsPerWeek;
    const newMissions = weekNum <= missionHalfWeeks
      ? config.eventMissions.slice(mStartIdx, mStartIdx + missionsPerWeek).map(m => m.id)
      : [];

    weeks.push({
      weekNumber: weekNum,
      startDate: cursor.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      themeKey: config.storyArcKey,
      newEpisodes,
      newMissions,
      nextWeekPreviewKey: weekNum < weeksTotal ? `season_week_preview_${weekNum + 1}` : 'season_week_finale',
    });

    cursor.setDate(cursor.getDate() + 7);
    weekNum++;
  }

  return weeks;
}

/** 시즌 남은 일수 계산 */
export function getSeasonDaysLeft(currentSeason: string): number {
  const config = getCurrentSeasonConfig(currentSeason);
  const now = new Date();
  const end = new Date(config.endDate);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/** 시즌 진행률 (0-100) 계산 */
export function getSeasonProgress(currentSeason: string): number {
  const config = getCurrentSeasonConfig(currentSeason);
  const now = new Date();
  const start = new Date(config.startDate);
  const end = new Date(config.endDate);
  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = now.getTime() - start.getTime();
  return Math.max(0, Math.min(100, Math.round((elapsedMs / totalMs) * 100)));
}

/** 현재 주차 정보 가져오기 */
export function getCurrentWeekInfo(currentSeason: string): SeasonWeekInfo | null {
  const timeline = getSeasonTimeline(currentSeason);
  const now = new Date().toISOString().split('T')[0];
  for (const week of timeline) {
    if (now >= week.startDate && now <= week.endDate) {
      return week;
    }
  }
  // Return the first upcoming week if no active week found
  return timeline.find(w => w.startDate > now) ?? timeline[timeline.length - 1] ?? null;
}

/** 시즌 보상 트랙에서 현재 진척도 기반 획득 가능한 티어 계산 */
export function getReachedRewardTiers(currentSeason: string, seasonPoints: number): SeasonRewardTier[] {
  const config = getCurrentSeasonConfig(currentSeason);
  return config.rewardTiers.filter(t => seasonPoints >= t.pointsRequired);
}

/** 다음 보상 티어 정보 */
export function getNextRewardTier(currentSeason: string, seasonPoints: number): SeasonRewardTier | null {
  const config = getCurrentSeasonConfig(currentSeason);
  return config.rewardTiers.find(t => seasonPoints < t.pointsRequired) ?? null;
}
