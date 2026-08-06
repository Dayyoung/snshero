import type { Language } from '../types';

/** 외부 SNS 인증 챌린지 정의 */
export interface SnsChallenge {
  id: string;
  titleKey: string;
  descKey: string;
  seasonId: string;
  startDate: string;
  endDate: string;
  /** 복사용 해시태그 */
  hashtag: string;
  /** 참여 방법 키 */
  howToKey: string;
  /** 보상 SNS */
  rewardSns: number;
  /** 관련 카드 ID 목록 */
  relatedCardIds?: number[];
  /** 공유 템플릿 키 */
  shareTemplateKey: string;
}

/** 제출 상태 */
export type SubmissionStatus = 'pendingReview' | 'approved' | 'rejected';

/** 개별 챌린지 제출 정보 */
export interface SnsChallengeSubmission {
  challengeId: string;
  snsLink: string;
  screenshotUrl: string;
  status: SubmissionStatus;
  submittedAt: number;
}

/** 유저의 챌린지 제출 상태 (localStorage) */
export interface SnsChallengeSubmissionsState {
  [challengeId: string]: SnsChallengeSubmission;
}

/** 갤러리 참여작 (MVP mock) */
export interface ChallengeGalleryEntry {
  id: string;
  challengeId: string;
  userName: string;
  imageUrl: string;
  snsLink: string;
  approvedAt: string;
}

// ─── 시즌 3 외부 SNS 챌린지 ──────────────────────────────────

export const SNS_CHALLENGES_SEASON3: SnsChallenge[] = [
  {
    id: 's3_sns_instagram_share',
    titleKey: 'sns_challenge_ig_title',
    descKey: 'sns_challenge_ig_desc',
    seasonId: 'season3',
    startDate: '2026-07-01',
    endDate: '2026-07-14',
    hashtag: '#SNSHero #SNSHero챌린지 #카드배틀',
    howToKey: 'sns_challenge_ig_howto',
    rewardSns: 1000,
    relatedCardIds: [20, 28, 35],
    shareTemplateKey: 'sns_challenge_ig_template',
  },
  {
    id: 's3_sns_tiktok_challenge',
    titleKey: 'sns_challenge_tt_title',
    descKey: 'sns_challenge_tt_desc',
    seasonId: 'season3',
    startDate: '2026-07-08',
    endDate: '2026-07-22',
    hashtag: '#SNSHero #SNSHero댄스 #카드챌린지',
    howToKey: 'sns_challenge_tt_howto',
    rewardSns: 1500,
    relatedCardIds: [20, 28, 35, 42],
    shareTemplateKey: 'sns_challenge_tt_template',
  },
  {
    id: 's3_sns_deck_share',
    titleKey: 'sns_challenge_deck_title',
    descKey: 'sns_challenge_deck_desc',
    seasonId: 'season3',
    startDate: '2026-07-15',
    endDate: '2026-08-15',
    hashtag: '#SNSHero덱 #SNSHero #내최애덱',
    howToKey: 'sns_challenge_deck_howto',
    rewardSns: 2000,
    relatedCardIds: [20, 28, 35, 42, 50],
    shareTemplateKey: 'sns_challenge_deck_template',
  },
];

/** 시즌별 SNS 챌린지 맵 */
export const SNS_CHALLENGES_MAP: Record<string, SnsChallenge[]> = {
  season1: [],
  season2: [],
  season3: SNS_CHALLENGES_SEASON3,
};

/** 현재 활성화된 SNS 챌린지 목록 반환 */
export function getActiveSnsChallenges(seasonId: string): SnsChallenge[] {
  const challenges = SNS_CHALLENGES_MAP[seasonId] ?? [];
  const now = new Date().toISOString().split('T')[0];
  return challenges.filter(c => now >= c.startDate && now <= c.endDate);
}

/** 갤러리 mock 데이터 */
export const MOCK_CHALLENGE_GALLERY: ChallengeGalleryEntry[] = [
  {
    id: 'gallery_01',
    challengeId: 's3_sns_instagram_share',
    userName: 'HeroFan_Kim',
    imageUrl: 'https://picsum.photos/seed/snshero1/400/400',
    snsLink: 'https://www.instagram.com/p/example1/',
    approvedAt: '2026-07-03',
  },
  {
    id: 'gallery_02',
    challengeId: 's3_sns_instagram_share',
    userName: 'DarkKnight_Lee',
    imageUrl: 'https://picsum.photos/seed/snshero2/400/400',
    snsLink: 'https://www.instagram.com/p/example2/',
    approvedAt: '2026-07-04',
  },
  {
    id: 'gallery_03',
    challengeId: 's3_sns_tiktok_challenge',
    userName: 'BattleQueen_Park',
    imageUrl: 'https://picsum.photos/seed/snshero3/400/400',
    snsLink: 'https://www.tiktok.com/@user/video/example3',
    approvedAt: '2026-07-10',
  },
  {
    id: 'gallery_04',
    challengeId: 's3_sns_instagram_share',
    userName: 'ShadowWalker_Choi',
    imageUrl: 'https://picsum.photos/seed/snshero4/400/400',
    snsLink: 'https://www.instagram.com/p/example4/',
    approvedAt: '2026-07-05',
  },
  {
    id: 'gallery_05',
    challengeId: 's3_sns_deck_share',
    userName: 'DeckMaster_Jung',
    imageUrl: 'https://picsum.photos/seed/snshero5/400/400',
    snsLink: 'https://www.instagram.com/p/example5/',
    approvedAt: '2026-07-16',
  },
  {
    id: 'gallery_06',
    challengeId: 's3_sns_tiktok_challenge',
    userName: 'FlameWizard_Kang',
    imageUrl: 'https://picsum.photos/seed/snshero6/400/400',
    snsLink: 'https://www.tiktok.com/@user/video/example6',
    approvedAt: '2026-07-11',
  },
];
