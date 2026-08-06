import type { Language } from '../types';

/** 팬 이벤트 유형 */
export type FanEventType = 'vote' | 'fanart' | 'webtoon' | 'deck_showcase' | 'season';

/** 팬 이벤트 정의 */
export interface FanEvent {
  id: string;
  type: FanEventType;
  titleKey: string;
  descKey: string;
  seasonId: string;
  startDate: string;
  endDate: string;
  /** 연결된 해시태그 */
  hashtag: string;
  /** 참여 방법 키 */
  howToKey: string;
  /** 보상 SNS */
  rewardSns: number;
  /** 관련 카드 ID 목록 (투표용) */
  relatedCardIds?: number[];
  /** 관련 웹툰 에피소드 ID */
  relatedEpisodeId?: string;
  /** 카테고리 연결 */
  categoryType: 'fanart' | 'vote' | 'webtoon' | 'season';
  /** 투표 옵션 (투표 이벤트 전용) */
  voteOptions?: FanEventVoteOption[];
}

/** 투표 옵션 */
export interface FanEventVoteOption {
  id: string;
  labelKey: string;
  cardId?: number;
  emoji?: string;
}

/** 유저의 팬 이벤트 투표 상태 (localStorage) */
export interface FanEventVotesState {
  [eventId: string]: string; // eventId -> selected optionId
}

// ─── 시즌 3 팬 이벤트 ──────────────────────────────────

export const FAN_EVENTS_SEASON3: FanEvent[] = [
  {
    id: 's3_fan_vote_favorite',
    type: 'vote',
    titleKey: 'fan_event_vote_title',
    descKey: 'fan_event_vote_desc',
    seasonId: 'season3',
    startDate: '2026-07-01',
    endDate: '2026-07-14',
    hashtag: '#SNSHero최애캐릭터',
    howToKey: 'fan_event_vote_howto',
    rewardSns: 500,
    relatedCardIds: [20, 28, 35],
    categoryType: 'vote',
    voteOptions: [
      { id: 'vote_s3_char_20', labelKey: 'fan_vote_option_20', cardId: 20, emoji: '💀' },
      { id: 'vote_s3_char_28', labelKey: 'fan_vote_option_28', cardId: 28, emoji: '👻' },
      { id: 'vote_s3_char_35', labelKey: 'fan_vote_option_35', cardId: 35, emoji: '🦇' },
    ],
  },
  {
    id: 's3_fan_webtoon_reaction',
    type: 'webtoon',
    titleKey: 'fan_event_webtoon_title',
    descKey: 'fan_event_webtoon_desc',
    seasonId: 'season3',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    hashtag: '#SNSHero웹툰반응',
    howToKey: 'fan_event_webtoon_howto',
    rewardSns: 800,
    relatedEpisodeId: 's3e1',
    categoryType: 'webtoon',
  },
  {
    id: 's3_fan_deck_showcase',
    type: 'deck_showcase',
    titleKey: 'fan_event_deck_title',
    descKey: 'fan_event_deck_desc',
    seasonId: 'season3',
    startDate: '2026-07-08',
    endDate: '2026-07-22',
    hashtag: '#SNSHero덱자랑',
    howToKey: 'fan_event_deck_howto',
    rewardSns: 1000,
    categoryType: 'season',
  },
  {
    id: 's3_fan_fanart',
    type: 'fanart',
    titleKey: 'fan_event_fanart_title',
    descKey: 'fan_event_fanart_desc',
    seasonId: 'season3',
    startDate: '2026-07-15',
    endDate: '2026-08-15',
    hashtag: '#SNSHero팬아트',
    howToKey: 'fan_event_fanart_howto',
    rewardSns: 1500,
    relatedCardIds: [20, 28, 35, 42, 50],
    categoryType: 'fanart',
  },
];

/** 시즌별 팬 이벤트 맵 */
export const FAN_EVENTS_MAP: Record<string, FanEvent[]> = {
  season1: [],
  season2: [],
  season3: FAN_EVENTS_SEASON3,
};

/** 현재 시즌에 활성화된 팬 이벤트 목록 반환 */
export function getActiveFanEvents(seasonId: string): FanEvent[] {
  const events = FAN_EVENTS_MAP[seasonId] ?? [];
  const now = new Date().toISOString().split('T')[0];
  return events.filter(e => now >= e.startDate && now <= e.endDate);
}

/** 팬 이벤트 유형별 표시 메타 */
export const FAN_EVENT_TYPE_META: Record<FanEventType, {
  iconKey: string;
  colorClass: string;
  bgClass: string;
}> = {
  vote: { iconKey: '🗳️', colorClass: 'text-rose-600', bgClass: 'bg-rose-100' },
  fanart: { iconKey: '🎨', colorClass: 'text-purple-600', bgClass: 'bg-purple-100' },
  webtoon: { iconKey: '📖', colorClass: 'text-amber-600', bgClass: 'bg-amber-100' },
  deck_showcase: { iconKey: '⚔️', colorClass: 'text-indigo-600', bgClass: 'bg-indigo-100' },
  season: { iconKey: '🏆', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-100' },
};
