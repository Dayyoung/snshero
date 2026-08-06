import type { ShareTemplateType } from '../lib/shareTemplates';
import { getSeasonTimeline } from './seasons';

export type CalendarShareTemplateType = Exclude<ShareTemplateType, 'referral'>;

/** ─── 콘텐츠 캘린더 타입 ─────────────────────────────── */

export type ContentStatus = 'ready' | 'scheduled' | 'published' | 'review';
export type ContentChannel = 'game' | 'webtoon' | 'sns' | 'community';

export interface QAChecklistItem {
  labelKey: string; // i18n key (공통 번역팩 사용)
  passed: boolean;
}

export interface PublishChecklist {
  art: boolean;
  translation: boolean;
  rewards: boolean;
  shareImage: boolean;
  qa: boolean;
}

export interface CalendarEntry {
  id: string;
  week: number; // 1-12
  day: number;  // 1-7 (월=1, 일=7)
  contentType: 'webtoon' | 'character' | 'sns_post' | 'fan_event' | 'season_mission';
  titleKey: string;   // i18n key
  descKey: string;    // i18n key
  relatedCardIds: number[];
  relatedEpisodeId?: string;
  relatedShareTemplateId?: CalendarShareTemplateType;
  channels: ContentChannel[];
  status: ContentStatus;
  scheduledDate: string; // ISO date string
  publishChecklist: PublishChecklist;
  qaChecklist: QAChecklistItem[];
}

/** 주간 그룹 정보 */
export interface WeekGroup {
  week: number;
  label: string; // e.g. '1주차'
  startDate: string;
  endDate: string;
  themeKey: string; // i18n
}

const addDays = (isoDate: string, days: number): string => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
};

/** ─── 12주 캘린더 데이터 ─────────────────────────────── */

export const WEEK_GROUPS: WeekGroup[] = [
  { week: 1, label: '1주차', startDate: '2026-07-06', endDate: '2026-07-12', themeKey: 'cal_theme_week1' },
  { week: 2, label: '2주차', startDate: '2026-07-13', endDate: '2026-07-19', themeKey: 'cal_theme_week2' },
  { week: 3, label: '3주차', startDate: '2026-07-20', endDate: '2026-07-26', themeKey: 'cal_theme_week3' },
  { week: 4, label: '4주차', startDate: '2026-07-27', endDate: '2026-08-02', themeKey: 'cal_theme_week4' },
  { week: 5, label: '5주차', startDate: '2026-08-03', endDate: '2026-08-09', themeKey: 'cal_theme_week5' },
  { week: 6, label: '6주차', startDate: '2026-08-10', endDate: '2026-08-16', themeKey: 'cal_theme_week6' },
  { week: 7, label: '7주차', startDate: '2026-08-17', endDate: '2026-08-23', themeKey: 'cal_theme_week7' },
  { week: 8, label: '8주차', startDate: '2026-08-24', endDate: '2026-08-30', themeKey: 'cal_theme_week8' },
  { week: 9, label: '9주차', startDate: '2026-08-31', endDate: '2026-09-06', themeKey: 'cal_theme_week9' },
  { week: 10, label: '10주차', startDate: '2026-09-07', endDate: '2026-09-13', themeKey: 'cal_theme_week10' },
  { week: 11, label: '11주차', startDate: '2026-09-14', endDate: '2026-09-20', themeKey: 'cal_theme_week11' },
  { week: 12, label: '12주차', startDate: '2026-09-21', endDate: '2026-09-27', themeKey: 'cal_theme_week12' },
];

const defaultChecklist = (): PublishChecklist => ({
  art: false,
  translation: false,
  rewards: false,
  shareImage: false,
  qa: false,
});

const defaultQA = (): QAChecklistItem[] => [
  { labelKey: 'cal_qa_art_complete', passed: false },
  { labelKey: 'cal_qa_translation_complete', passed: false },
  { labelKey: 'cal_qa_reward_configured', passed: false },
  { labelKey: 'cal_qa_share_image_ready', passed: false },
  { labelKey: 'cal_qa_release_verified', passed: false },
];

/** 12주 콘텐츠 캘린더 (샘플 운영 데이터) */
export const CONTENT_CALENDAR: CalendarEntry[] = [
  // ── Week 1 ──
  {
    id: 'w1-mon-webtoon', week: 1, day: 1, contentType: 'webtoon',
    titleKey: 'cal_w1_mon_title', descKey: 'cal_w1_mon_desc',
    relatedCardIds: [10, 2, 5, 9], relatedEpisodeId: 's1-e01',
    channels: ['webtoon'], status: 'ready', scheduledDate: '2026-07-06',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w1-tue-character', week: 1, day: 2, contentType: 'character',
    titleKey: 'cal_w1_tue_title', descKey: 'cal_w1_tue_desc',
    relatedCardIds: [1], relatedShareTemplateId: 'character',
    channels: ['sns', 'community'], status: 'ready', scheduledDate: '2026-07-07',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w1-thu-sns', week: 1, day: 4, contentType: 'sns_post',
    titleKey: 'cal_w1_thu_title', descKey: 'cal_w1_thu_desc',
    relatedCardIds: [1, 3], relatedShareTemplateId: 'webtoon',
    channels: ['sns'], status: 'ready', scheduledDate: '2026-07-09',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w1-sat-event', week: 1, day: 6, contentType: 'fan_event',
    titleKey: 'cal_w1_sat_title', descKey: 'cal_w1_sat_desc',
    relatedCardIds: [1, 2, 3, 4, 5], channels: ['community', 'sns'],
    status: 'ready', scheduledDate: '2026-07-11',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w1-sun-mission', week: 1, day: 7, contentType: 'season_mission',
    titleKey: 'cal_w1_sun_title', descKey: 'cal_w1_sun_desc',
    relatedCardIds: [1, 2], channels: ['game'],
    status: 'ready', scheduledDate: '2026-07-12',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },

  // ── Week 2 ──
  {
    id: 'w2-mon-webtoon', week: 2, day: 1, contentType: 'webtoon',
    titleKey: 'cal_w2_mon_title', descKey: 'cal_w2_mon_desc',
    relatedCardIds: [20, 12, 15, 19], relatedEpisodeId: 's1-e02',
    channels: ['webtoon'], status: 'ready', scheduledDate: '2026-07-13',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w2-wed-character', week: 2, day: 3, contentType: 'character',
    titleKey: 'cal_w2_wed_title', descKey: 'cal_w2_wed_desc',
    relatedCardIds: [5], relatedShareTemplateId: 'character',
    channels: ['sns', 'community'], status: 'ready', scheduledDate: '2026-07-15',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w2-fri-sns', week: 2, day: 5, contentType: 'sns_post',
    titleKey: 'cal_w2_fri_title', descKey: 'cal_w2_fri_desc',
    relatedCardIds: [4], relatedShareTemplateId: 'deck',
    channels: ['sns'], status: 'ready', scheduledDate: '2026-07-17',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w2-sat-event', week: 2, day: 6, contentType: 'fan_event',
    titleKey: 'cal_w2_sat_title', descKey: 'cal_w2_sat_desc',
    relatedCardIds: [4, 5, 6], channels: ['community', 'sns'],
    status: 'ready', scheduledDate: '2026-07-18',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w2-sun-mission', week: 2, day: 7, contentType: 'season_mission',
    titleKey: 'cal_w2_sun_title', descKey: 'cal_w2_sun_desc',
    relatedCardIds: [4, 6], channels: ['game'],
    status: 'ready', scheduledDate: '2026-07-19',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },

  // ── Week 3 ──
  {
    id: 'w3-mon-webtoon', week: 3, day: 1, contentType: 'webtoon',
    titleKey: 'cal_w3_mon_title', descKey: 'cal_w3_mon_desc',
    relatedCardIds: [30, 22, 25, 29], relatedEpisodeId: 's1-e03',
    channels: ['webtoon'], status: 'scheduled', scheduledDate: '2026-07-20',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w3-tue-character', week: 3, day: 2, contentType: 'character',
    titleKey: 'cal_w3_tue_title', descKey: 'cal_w3_tue_desc',
    relatedCardIds: [7], relatedShareTemplateId: 'character',
    channels: ['sns', 'community'], status: 'scheduled', scheduledDate: '2026-07-21',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w3-fri-sns', week: 3, day: 5, contentType: 'sns_post',
    titleKey: 'cal_w3_fri_title', descKey: 'cal_w3_fri_desc',
    relatedCardIds: [7, 9], relatedShareTemplateId: 'season',
    channels: ['sns'], status: 'scheduled', scheduledDate: '2026-07-24',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w3-sun-mission', week: 3, day: 7, contentType: 'season_mission',
    titleKey: 'cal_w3_sun_title', descKey: 'cal_w3_sun_desc',
    relatedCardIds: [7, 8, 9], channels: ['game'],
    status: 'scheduled', scheduledDate: '2026-07-26',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },

  // ── Week 4 ──
  {
    id: 'w4-mon-webtoon', week: 4, day: 1, contentType: 'webtoon',
    titleKey: 'cal_w4_mon_title', descKey: 'cal_w4_mon_desc',
    relatedCardIds: [40, 32, 35, 39], relatedEpisodeId: 's1-e04',
    channels: ['webtoon'], status: 'scheduled', scheduledDate: '2026-07-27',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w4-thu-character', week: 4, day: 4, contentType: 'character',
    titleKey: 'cal_w4_thu_title', descKey: 'cal_w4_thu_desc',
    relatedCardIds: [10], relatedShareTemplateId: 'character',
    channels: ['sns', 'community'], status: 'scheduled', scheduledDate: '2026-07-30',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w4-sat-event', week: 4, day: 6, contentType: 'fan_event',
    titleKey: 'cal_w4_sat_title', descKey: 'cal_w4_sat_desc',
    relatedCardIds: [10, 11, 12], channels: ['community', 'sns'],
    status: 'scheduled', scheduledDate: '2026-08-01',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w4-sun-mission', week: 4, day: 7, contentType: 'season_mission',
    titleKey: 'cal_w4_sun_title', descKey: 'cal_w4_sun_desc',
    relatedCardIds: [10, 12], channels: ['game'],
    status: 'scheduled', scheduledDate: '2026-08-02',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },

  // ── Week 5 ──
  {
    id: 'w5-mon-webtoon', week: 5, day: 1, contentType: 'webtoon',
    titleKey: 'cal_w5_mon_title', descKey: 'cal_w5_mon_desc',
    relatedCardIds: [50, 42, 45, 49], relatedEpisodeId: 's1-e05',
    channels: ['webtoon'], status: 'scheduled', scheduledDate: '2026-08-03',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w5-wed-character', week: 5, day: 3, contentType: 'character',
    titleKey: 'cal_w5_wed_title', descKey: 'cal_w5_wed_desc',
    relatedCardIds: [13], relatedShareTemplateId: 'character',
    channels: ['sns', 'community'], status: 'scheduled', scheduledDate: '2026-08-05',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w5-fri-sns', week: 5, day: 5, contentType: 'sns_post',
    titleKey: 'cal_w5_fri_title', descKey: 'cal_w5_fri_desc',
    relatedCardIds: [14], relatedShareTemplateId: 'battle-result',
    channels: ['sns'], status: 'scheduled', scheduledDate: '2026-08-07',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w5-sun-mission', week: 5, day: 7, contentType: 'season_mission',
    titleKey: 'cal_w5_sun_title', descKey: 'cal_w5_sun_desc',
    relatedCardIds: [13, 14, 15], channels: ['game'],
    status: 'scheduled', scheduledDate: '2026-08-09',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },

  // ── Week 6 ──
  {
    id: 'w6-mon-webtoon', week: 6, day: 1, contentType: 'webtoon',
    titleKey: 'cal_w6_mon_title', descKey: 'cal_w6_mon_desc',
    relatedCardIds: [60, 52, 55, 59], relatedEpisodeId: 's1-e06',
    channels: ['webtoon'], status: 'scheduled', scheduledDate: '2026-08-10',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w6-tue-character', week: 6, day: 2, contentType: 'character',
    titleKey: 'cal_w6_tue_title', descKey: 'cal_w6_tue_desc',
    relatedCardIds: [16], relatedShareTemplateId: 'character',
    channels: ['sns', 'community'], status: 'scheduled', scheduledDate: '2026-08-11',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w6-sat-event', week: 6, day: 6, contentType: 'fan_event',
    titleKey: 'cal_w6_sat_title', descKey: 'cal_w6_sat_desc',
    relatedCardIds: [16, 17, 18], channels: ['community', 'sns'],
    status: 'scheduled', scheduledDate: '2026-08-15',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w6-sun-mission', week: 6, day: 7, contentType: 'season_mission',
    titleKey: 'cal_w6_sun_title', descKey: 'cal_w6_sun_desc',
    relatedCardIds: [16, 18], channels: ['game'],
    status: 'scheduled', scheduledDate: '2026-08-16',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },

  // ── Week 7 ──
  {
    id: 'w7-mon-webtoon', week: 7, day: 1, contentType: 'webtoon',
    titleKey: 'cal_w7_mon_title', descKey: 'cal_w7_mon_desc',
    relatedCardIds: [70, 62, 65, 69], relatedEpisodeId: 's1-e07',
    channels: ['webtoon'], status: 'ready', scheduledDate: '2026-08-17',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w7-thu-character', week: 7, day: 4, contentType: 'character',
    titleKey: 'cal_w7_thu_title', descKey: 'cal_w7_thu_desc',
    relatedCardIds: [19], relatedShareTemplateId: 'character',
    channels: ['sns', 'community'], status: 'ready', scheduledDate: '2026-08-20',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w7-fri-sns', week: 7, day: 5, contentType: 'sns_post',
    titleKey: 'cal_w7_fri_title', descKey: 'cal_w7_fri_desc',
    relatedCardIds: [20], relatedShareTemplateId: 'webtoon',
    channels: ['sns'], status: 'ready', scheduledDate: '2026-08-21',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w7-sun-mission', week: 7, day: 7, contentType: 'season_mission',
    titleKey: 'cal_w7_sun_title', descKey: 'cal_w7_sun_desc',
    relatedCardIds: [19, 20, 21], channels: ['game'],
    status: 'ready', scheduledDate: '2026-08-23',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },

  // ── Week 8 ──
  {
    id: 'w8-mon-webtoon', week: 8, day: 1, contentType: 'webtoon',
    titleKey: 'cal_w8_mon_title', descKey: 'cal_w8_mon_desc',
    relatedCardIds: [80, 72, 75, 79], relatedEpisodeId: 's1-e08',
    channels: ['webtoon'], status: 'ready', scheduledDate: '2026-08-24',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w8-wed-character', week: 8, day: 3, contentType: 'character',
    titleKey: 'cal_w8_wed_title', descKey: 'cal_w8_wed_desc',
    relatedCardIds: [22], relatedShareTemplateId: 'character',
    channels: ['sns', 'community'], status: 'ready', scheduledDate: '2026-08-26',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w8-sat-event', week: 8, day: 6, contentType: 'fan_event',
    titleKey: 'cal_w8_sat_title', descKey: 'cal_w8_sat_desc',
    relatedCardIds: [22, 23, 24], channels: ['community', 'sns'],
    status: 'ready', scheduledDate: '2026-08-29',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w8-sun-mission', week: 8, day: 7, contentType: 'season_mission',
    titleKey: 'cal_w8_sun_title', descKey: 'cal_w8_sun_desc',
    relatedCardIds: [22, 24], channels: ['game'],
    status: 'ready', scheduledDate: '2026-08-30',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },

  // ── Week 9 ──
  {
    id: 'w9-mon-webtoon', week: 9, day: 1, contentType: 'webtoon',
    titleKey: 'cal_w9_mon_title', descKey: 'cal_w9_mon_desc',
    relatedCardIds: [90, 82, 85, 89], relatedEpisodeId: 's1-e09',
    channels: ['webtoon'], status: 'ready', scheduledDate: '2026-08-31',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w9-tue-character', week: 9, day: 2, contentType: 'character',
    titleKey: 'cal_w9_tue_title', descKey: 'cal_w9_tue_desc',
    relatedCardIds: [25], relatedShareTemplateId: 'character',
    channels: ['sns', 'community'], status: 'ready', scheduledDate: '2026-09-01',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w9-fri-sns', week: 9, day: 5, contentType: 'sns_post',
    titleKey: 'cal_w9_fri_title', descKey: 'cal_w9_fri_desc',
    relatedCardIds: [26], relatedShareTemplateId: 'deck',
    channels: ['sns'], status: 'ready', scheduledDate: '2026-09-04',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w9-sun-mission', week: 9, day: 7, contentType: 'season_mission',
    titleKey: 'cal_w9_sun_title', descKey: 'cal_w9_sun_desc',
    relatedCardIds: [25, 26, 27], channels: ['game'],
    status: 'ready', scheduledDate: '2026-09-06',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },

  // ── Week 10 ──
  {
    id: 'w10-mon-webtoon', week: 10, day: 1, contentType: 'webtoon',
    titleKey: 'cal_w10_mon_title', descKey: 'cal_w10_mon_desc',
    relatedCardIds: [100, 92, 95, 99], relatedEpisodeId: 's1-e10',
    channels: ['webtoon'], status: 'scheduled', scheduledDate: '2026-09-07',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w10-thu-character', week: 10, day: 4, contentType: 'character',
    titleKey: 'cal_w10_thu_title', descKey: 'cal_w10_thu_desc',
    relatedCardIds: [28], relatedShareTemplateId: 'character',
    channels: ['sns', 'community'], status: 'scheduled', scheduledDate: '2026-09-10',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w10-sat-event', week: 10, day: 6, contentType: 'fan_event',
    titleKey: 'cal_w10_sat_title', descKey: 'cal_w10_sat_desc',
    relatedCardIds: [28, 29, 30], channels: ['community', 'sns'],
    status: 'scheduled', scheduledDate: '2026-09-12',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w10-sun-mission', week: 10, day: 7, contentType: 'season_mission',
    titleKey: 'cal_w10_sun_title', descKey: 'cal_w10_sun_desc',
    relatedCardIds: [28, 30], channels: ['game'],
    status: 'scheduled', scheduledDate: '2026-09-13',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },

  // ── Week 11 ──
  {
    id: 'w11-mon-webtoon', week: 11, day: 1, contentType: 'webtoon',
    titleKey: 'cal_w11_mon_title', descKey: 'cal_w11_mon_desc',
    relatedCardIds: [110, 102, 105, 109], relatedEpisodeId: 's1-e11',
    channels: ['webtoon'], status: 'scheduled', scheduledDate: '2026-09-14',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w11-wed-character', week: 11, day: 3, contentType: 'character',
    titleKey: 'cal_w11_wed_title', descKey: 'cal_w11_wed_desc',
    relatedCardIds: [31], relatedShareTemplateId: 'character',
    channels: ['sns', 'community'], status: 'scheduled', scheduledDate: '2026-09-16',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w11-fri-sns', week: 11, day: 5, contentType: 'sns_post',
    titleKey: 'cal_w11_fri_title', descKey: 'cal_w11_fri_desc',
    relatedCardIds: [32], relatedShareTemplateId: 'season',
    channels: ['sns'], status: 'scheduled', scheduledDate: '2026-09-18',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w11-sun-mission', week: 11, day: 7, contentType: 'season_mission',
    titleKey: 'cal_w11_sun_title', descKey: 'cal_w11_sun_desc',
    relatedCardIds: [31, 32, 33], channels: ['game'],
    status: 'scheduled', scheduledDate: '2026-09-20',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },

  // ── Week 12 ──
  {
    id: 'w12-mon-webtoon', week: 12, day: 1, contentType: 'webtoon',
    titleKey: 'cal_w12_mon_title', descKey: 'cal_w12_mon_desc',
    relatedCardIds: [10, 50, 90, 110], relatedEpisodeId: 's1-e12',
    channels: ['webtoon'], status: 'scheduled', scheduledDate: '2026-09-21',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w12-tue-character', week: 12, day: 2, contentType: 'character',
    titleKey: 'cal_w12_tue_title', descKey: 'cal_w12_tue_desc',
    relatedCardIds: [34], relatedShareTemplateId: 'character',
    channels: ['sns', 'community'], status: 'scheduled', scheduledDate: '2026-09-22',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w12-sat-event', week: 12, day: 6, contentType: 'fan_event',
    titleKey: 'cal_w12_sat_title', descKey: 'cal_w12_sat_desc',
    relatedCardIds: [34, 35, 36], channels: ['community', 'sns'],
    status: 'scheduled', scheduledDate: '2026-09-26',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
  {
    id: 'w12-sun-mission', week: 12, day: 7, contentType: 'season_mission',
    titleKey: 'cal_w12_sun_title', descKey: 'cal_w12_sun_desc',
    relatedCardIds: [34, 36], channels: ['game'],
    status: 'scheduled', scheduledDate: '2026-09-27',
    publishChecklist: defaultChecklist(), qaChecklist: defaultQA(),
  },
];

/** ─── 유틸리티 함수 ─────────────────────────────────── */

const DAY_NAMES = ['', 'cal_day_mon', 'cal_day_tue', 'cal_day_wed', 'cal_day_thu', 'cal_day_fri', 'cal_day_sat', 'cal_day_sun'];

export function getDayKey(day: number): string {
  return DAY_NAMES[day] || '';
}

export function getWeekEntries(week: number): CalendarEntry[] {
  return CONTENT_CALENDAR.filter(e => e.week === week);
}

export function getWeekGroupsForSeason(currentSeason: string): WeekGroup[] {
  const seasonTimeline = getSeasonTimeline(currentSeason).slice(0, WEEK_GROUPS.length);

  return WEEK_GROUPS.map((group, index) => {
    const seasonWeek = seasonTimeline[index];
    if (!seasonWeek) {
      return group;
    }

    return {
      ...group,
      startDate: seasonWeek.startDate,
      endDate: seasonWeek.endDate,
      themeKey: seasonWeek.themeKey || group.themeKey,
    };
  });
}

export function getCalendarEntriesForSeason(currentSeason: string): CalendarEntry[] {
  const seasonWeeks = getWeekGroupsForSeason(currentSeason);

  return CONTENT_CALENDAR.map((entry) => {
    const weekGroup = seasonWeeks.find((week) => week.week === entry.week);
    if (!weekGroup) {
      return entry;
    }

    return {
      ...entry,
      scheduledDate: addDays(weekGroup.startDate, Math.max(0, entry.day - 1)),
    };
  });
}

export function getEntriesByStatus(status: ContentStatus): CalendarEntry[] {
  return CONTENT_CALENDAR.filter(e => e.status === status);
}

export const CONTENT_TYPE_LABELS: Record<CalendarEntry['contentType'], string> = {
  webtoon: 'cal_type_webtoon',
  character: 'cal_type_character',
  sns_post: 'cal_type_sns_post',
  fan_event: 'cal_type_fan_event',
  season_mission: 'cal_type_season_mission',
};

export const STATUS_LABELS: Record<ContentStatus, string> = {
  ready: 'cal_status_ready',
  scheduled: 'cal_status_scheduled',
  published: 'cal_status_published',
  review: 'cal_status_review',
};

export const CHANNEL_LABELS: Record<ContentChannel, string> = {
  game: 'cal_channel_game',
  webtoon: 'cal_channel_webtoon',
  sns: 'cal_channel_sns',
  community: 'cal_channel_community',
};

export const SHARE_TEMPLATE_LABELS: Record<CalendarShareTemplateType, string> = {
  character: 'share_template_character',
  webtoon: 'share_template_webtoon',
  season: 'share_template_season',
  deck: 'share_template_deck',
  'battle-result': 'share_template_battle_result',
};
