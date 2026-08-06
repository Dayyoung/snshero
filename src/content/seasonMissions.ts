import type { Language } from '../types';

/** 미션 유형 */
export type MissionType =
  | 'read_webtoon'
  | 'win_battle'
  | 'collect_card'
  | 'share_card'
  | 'visit_world'
  | 'join_community';

/** 미션 주기 */
export type MissionPeriod = 'daily' | 'weekly' | 'season';

/** 미션 상태 */
export type MissionStatus = 'locked' | 'in_progress' | 'completed' | 'claimed';

/** 미션 보상 */
export interface MissionReward {
  sns: number;
  badgeKey?: string;
  skinUnlockKey?: string;
  webtoonCutUnlock?: string;
  titleKey?: string;
}

/** 개별 미션 정의 */
export interface SeasonMission {
  id: string;
  type: MissionType;
  period: MissionPeriod;
  titleKey: string;
  descKey: string;
  targetValue: number;
  reward: MissionReward;
  /** 해당 미션이 속한 시즌 (시즌 미션에만 적용) */
  seasonId?: string;
  /** 이 미션의 선행 미션 ID */
  prerequisiteMissionId?: string;
}

/** 유저의 미션별 진행 상태 (localStorage 저장용) */
export interface UserMissionState {
  missionId: string;
  progress: number;
  status: MissionStatus;
  claimedAt?: number;
  /** 데일리/위클리 초기화 기준일 */
  resetDate?: string;
}

/** 유저의 전체 시즌 미션 저장 데이터 */
export interface SeasonMissionsSaveData {
  missions: UserMissionState[];
  lastDailyReset: string;
  lastWeeklyReset: string;
}

// ─── 데일리 미션 (매일 초기화) ──────────────────────

export const DAILY_MISSIONS: SeasonMission[] = [
  {
    id: 'daily_battle_3',
    type: 'win_battle',
    period: 'daily',
    titleKey: 'mission_daily_battle_3',
    descKey: 'mission_daily_battle_3_desc',
    targetValue: 3,
    reward: { sns: 500 },
  },
  {
    id: 'daily_webtoon_1',
    type: 'read_webtoon',
    period: 'daily',
    titleKey: 'mission_daily_webtoon_1',
    descKey: 'mission_daily_webtoon_1_desc',
    targetValue: 1,
    reward: { sns: 300 },
  },
  {
    id: 'daily_collect_2',
    type: 'collect_card',
    period: 'daily',
    titleKey: 'mission_daily_collect_2',
    descKey: 'mission_daily_collect_2_desc',
    targetValue: 2,
    reward: { sns: 400 },
  },
  {
    id: 'daily_visit_1',
    type: 'visit_world',
    period: 'daily',
    titleKey: 'mission_daily_visit_1',
    descKey: 'mission_daily_visit_1_desc',
    targetValue: 1,
    reward: { sns: 200 },
  },
];

// ─── 주간 미션 (매주 월요일 초기화) ──────────────────

export const WEEKLY_MISSIONS: SeasonMission[] = [
  {
    id: 'weekly_battle_10',
    type: 'win_battle',
    period: 'weekly',
    titleKey: 'mission_weekly_battle_10',
    descKey: 'mission_weekly_battle_10_desc',
    targetValue: 10,
    reward: { sns: 2000, badgeKey: 'badge_weekly_warrior' },
  },
  {
    id: 'weekly_share_3',
    type: 'share_card',
    period: 'weekly',
    titleKey: 'mission_weekly_share_3',
    descKey: 'mission_weekly_share_3_desc',
    targetValue: 3,
    reward: { sns: 1500 },
  },
  {
    id: 'weekly_collect_5',
    type: 'collect_card',
    period: 'weekly',
    titleKey: 'mission_weekly_collect_5',
    descKey: 'mission_weekly_collect_5_desc',
    targetValue: 5,
    reward: { sns: 1800, badgeKey: 'badge_weekly_collector' },
  },
  {
    id: 'weekly_webtoon_3',
    type: 'read_webtoon',
    period: 'weekly',
    titleKey: 'mission_weekly_webtoon_3',
    descKey: 'mission_weekly_webtoon_3_desc',
    targetValue: 3,
    reward: { sns: 1200 },
  },
  {
    id: 'weekly_community_1',
    type: 'join_community',
    period: 'weekly',
    titleKey: 'mission_weekly_community_1',
    descKey: 'mission_weekly_community_1_desc',
    targetValue: 1,
    reward: { sns: 1000 },
  },
];

// ─── 시즌 미션 (시즌 동안 지속) ──────────────────────

const SEASON_MISSIONS_SEASON1: SeasonMission[] = [
  {
    id: 's1_season_battle_30',
    type: 'win_battle',
    period: 'season',
    titleKey: 'mission_season_battle_30',
    descKey: 'mission_season_battle_30_desc',
    targetValue: 30,
    reward: { sns: 5000, badgeKey: 'badge_s1_battle_master' },
    seasonId: 'season1',
  },
  {
    id: 's1_season_collect_15',
    type: 'collect_card',
    period: 'season',
    titleKey: 'mission_season_collect_15',
    descKey: 'mission_season_collect_15_desc',
    targetValue: 15,
    reward: { sns: 4000, skinUnlockKey: 'skin_s1_collector' },
    seasonId: 'season1',
  },
  {
    id: 's1_season_webtoon_all',
    type: 'read_webtoon',
    period: 'season',
    titleKey: 'mission_season_webtoon_all',
    descKey: 'mission_season_webtoon_all_desc',
    targetValue: 4,
    reward: { sns: 3000, webtoonCutUnlock: 's1_cut_special' },
    seasonId: 'season1',
  },
  {
    id: 's1_season_share_5',
    type: 'share_card',
    period: 'season',
    titleKey: 'mission_season_share_5',
    descKey: 'mission_season_share_5_desc',
    targetValue: 5,
    reward: { sns: 2500 },
    seasonId: 'season1',
  },
];

const SEASON_MISSIONS_SEASON2: SeasonMission[] = [
  {
    id: 's2_season_battle_40',
    type: 'win_battle',
    period: 'season',
    titleKey: 'mission_season_battle_40',
    descKey: 'mission_season_battle_40_desc',
    targetValue: 40,
    reward: { sns: 7000, badgeKey: 'badge_s2_battle_master' },
    seasonId: 'season2',
  },
  {
    id: 's2_season_collect_20',
    type: 'collect_card',
    period: 'season',
    titleKey: 'mission_season_collect_20',
    descKey: 'mission_season_collect_20_desc',
    targetValue: 20,
    reward: { sns: 5000, skinUnlockKey: 'skin_s2_collector' },
    seasonId: 'season2',
  },
  {
    id: 's2_season_webtoon_all',
    type: 'read_webtoon',
    period: 'season',
    titleKey: 'mission_season_webtoon_all',
    descKey: 'mission_season_webtoon_all_desc',
    targetValue: 5,
    reward: { sns: 4000, webtoonCutUnlock: 's2_cut_special' },
    seasonId: 'season2',
  },
  {
    id: 's2_season_visit',
    type: 'visit_world',
    period: 'season',
    titleKey: 'mission_season_visit_world',
    descKey: 'mission_season_visit_world_desc',
    targetValue: 10,
    reward: { sns: 3000 },
    seasonId: 'season2',
  },
];

const SEASON_MISSIONS_SEASON3: SeasonMission[] = [
  {
    id: 's3_season_battle_50',
    type: 'win_battle',
    period: 'season',
    titleKey: 'mission_season_battle_50',
    descKey: 'mission_season_battle_50_desc',
    targetValue: 50,
    reward: { sns: 10000, badgeKey: 'badge_s3_battle_master' },
    seasonId: 'season3',
  },
  {
    id: 's3_season_collect_25',
    type: 'collect_card',
    period: 'season',
    titleKey: 'mission_season_collect_25',
    descKey: 'mission_season_collect_25_desc',
    targetValue: 25,
    reward: { sns: 7000, skinUnlockKey: 'skin_s3_collector' },
    seasonId: 'season3',
  },
  {
    id: 's3_season_webtoon_all',
    type: 'read_webtoon',
    period: 'season',
    titleKey: 'mission_season_webtoon_all',
    descKey: 'mission_season_webtoon_all_desc',
    targetValue: 6,
    reward: { sns: 5000, webtoonCutUnlock: 's3_cut_special' },
    seasonId: 'season3',
  },
  {
    id: 's3_season_community_5',
    type: 'join_community',
    period: 'season',
    titleKey: 'mission_season_community_5',
    descKey: 'mission_season_community_5_desc',
    targetValue: 5,
    reward: { sns: 3500, badgeKey: 'badge_s3_community' },
    seasonId: 'season3',
  },
];

/** 시즌별 시즌 미션 맵 */
export const SEASON_MISSIONS_MAP: Record<string, SeasonMission[]> = {
  season1: SEASON_MISSIONS_SEASON1,
  season2: SEASON_MISSIONS_SEASON2,
  season3: SEASON_MISSIONS_SEASON3,
};

/** 현재 시즌에 대한 시즌 미션 가져오기 */
export function getSeasonMissions(seasonId: string): SeasonMission[] {
  return SEASON_MISSIONS_MAP[seasonId] ?? SEASON_MISSIONS_SEASON1;
}

/** 데일리 + 위클리 + 시즌 미션 취합 */
export function getAllMissions(seasonId: string): SeasonMission[] {
  return [
    ...DAILY_MISSIONS,
    ...WEEKLY_MISSIONS,
    ...getSeasonMissions(seasonId),
  ];
}

/** 오늘 날짜 스트링 (YYYY-MM-DD) */
export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/** 이번 주 월요일 (ISO 기준, 월요일 시작) */
export function getMondayStr(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일로
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/** 데일리 리셋이 필요한지 확인 */
export function needsDailyReset(lastReset: string): boolean {
  return lastReset !== getTodayStr();
}

/** 위클리 리셋이 필요한지 확인 */
export function needsWeeklyReset(lastReset: string): boolean {
  return lastReset !== getMondayStr();
}

/** 미션 타입별 표시용 메타데이터 */
export const MISSION_TYPE_META: Record<MissionType, {
  iconKey: string;
  colorClass: string;
}> = {
  read_webtoon: { iconKey: '📖', colorClass: 'bg-amber-100 text-amber-600' },
  win_battle: { iconKey: '⚔️', colorClass: 'bg-red-100 text-red-600' },
  collect_card: { iconKey: '✨', colorClass: 'bg-blue-100 text-blue-600' },
  share_card: { iconKey: '🔗', colorClass: 'bg-purple-100 text-purple-600' },
  visit_world: { iconKey: '🌍', colorClass: 'bg-emerald-100 text-emerald-600' },
  join_community: { iconKey: '👥', colorClass: 'bg-pink-100 text-pink-600' },
};

/** 주기별 표시 라벨 키 */
export const PERIOD_LABEL_KEYS: Record<MissionPeriod, string> = {
  daily: 'mission_period_daily',
  weekly: 'mission_period_weekly',
  season: 'mission_period_season',
};

/** 상태별 표시 라벨 키 */
export const STATUS_LABEL_KEYS: Record<MissionStatus, string> = {
  locked: 'mission_status_locked',
  in_progress: 'mission_status_in_progress',
  completed: 'mission_status_completed',
  claimed: 'mission_status_claimed',
};
