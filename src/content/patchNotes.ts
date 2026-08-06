import type { Language } from '../types';

/** 패치노트 카테고리 */
export type PatchNoteCategory = 'bugfix' | 'balance' | 'content' | 'knownIssue';

/** 패치노트 중요도 */
export type PatchNoteImportance = 'critical' | 'high' | 'medium' | 'low';

/** 개별 패치노트 항목 */
export interface PatchNoteEntry {
  id: string;
  category: PatchNoteCategory;
  importance: PatchNoteImportance;
  titleKey: string;
  descKey: string;
  /** 관련 카드 ID (선택) */
  relatedCardIds?: number[];
  /** 관련 시즌 (선택) */
  relatedSeason?: string;
  /** 딥링크 대상 화면 (선택) */
  deepLinkView?: string;
}

/** 주차별 패치노트 */
export interface PatchNoteWeek {
  id: string;
  weekLabel: string;
  dateRange: string;
  entries: PatchNoteEntry[];
}

/** 카테고리 메타 정보 */
export const PATCH_NOTE_CATEGORY_META: Record<PatchNoteCategory, {
  labelKo: string;
  labelEn: string;
  color: string;
  iconKey: string;
}> = {
  bugfix: {
    labelKo: '버그 수정',
    labelEn: 'Bug Fixes',
    color: 'bg-red-100 text-red-700 border-red-200',
    iconKey: '🔧',
  },
  balance: {
    labelKo: '밸런스 조정',
    labelEn: 'Balance Changes',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    iconKey: '⚖️',
  },
  content: {
    labelKo: '신규 콘텐츠',
    labelEn: 'New Content',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    iconKey: '✨',
  },
  knownIssue: {
    labelKo: '알려진 이슈',
    labelEn: 'Known Issues',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    iconKey: '⚠️',
  },
};

/** 중요도 메타 */
export const PATCH_NOTE_IMPORTANCE_META: Record<PatchNoteImportance, {
  labelKo: string;
  labelEn: string;
  dotColor: string;
}> = {
  critical: {
    labelKo: '긴급',
    labelEn: 'CRITICAL',
    dotColor: 'bg-red-500',
  },
  high: {
    labelKo: '중요',
    labelEn: 'HIGH',
    dotColor: 'bg-amber-500',
  },
  medium: {
    labelKo: '보통',
    labelEn: 'MEDIUM',
    dotColor: 'bg-blue-500',
  },
  low: {
    labelKo: '경미',
    labelEn: 'LOW',
    dotColor: 'bg-slate-400',
  },
};

/** 샘플 패치노트: 3주 분량 */
export const SAMPLE_PATCH_NOTES: PatchNoteWeek[] = [
  // ── Week 1: 런칭 주차 ──
  {
    id: 'patch-week-1',
    weekLabel: 'Week 1 (2026-07-06 ~ 2026-07-12)',
    dateRange: '2026-07-06 ~ 2026-07-12',
    entries: [
      {
        id: 'w1-001',
        category: 'content',
        importance: 'high',
        titleKey: 'patch_w1_content_events_title',
        descKey: 'patch_w1_content_events_desc',
        relatedSeason: 'season1',
        deepLinkView: 'event',
      },
      {
        id: 'w1-002',
        category: 'bugfix',
        importance: 'critical',
        titleKey: 'patch_w1_bugfix_login_title',
        descKey: 'patch_w1_bugfix_login_desc',
      },
      {
        id: 'w1-003',
        category: 'bugfix',
        importance: 'high',
        titleKey: 'patch_w1_bugfix_webtoon_title',
        descKey: 'patch_w1_bugfix_webtoon_desc',
        deepLinkView: 'webtoon',
      },
      {
        id: 'w1-004',
        category: 'balance',
        importance: 'medium',
        titleKey: 'patch_w1_balance_sns_title',
        descKey: 'patch_w1_balance_sns_desc',
      },
      {
        id: 'w1-005',
        category: 'knownIssue',
        importance: 'low',
        titleKey: 'patch_w1_known_ar_title',
        descKey: 'patch_w1_known_ar_desc',
      },
    ],
  },
  // ── Week 2: 밸런스 및 버그 집중 ──
  {
    id: 'patch-week-2',
    weekLabel: 'Week 2 (2026-07-13 ~ 2026-07-19)',
    dateRange: '2026-07-13 ~ 2026-07-19',
    entries: [
      {
        id: 'w2-001',
        category: 'bugfix',
        importance: 'critical',
        titleKey: 'patch_w2_bugfix_multiplayer_title',
        descKey: 'patch_w2_bugfix_multiplayer_desc',
        deepLinkView: 'play',
      },
      {
        id: 'w2-002',
        category: 'balance',
        importance: 'high',
        titleKey: 'patch_w2_balance_cards_title',
        descKey: 'patch_w2_balance_cards_desc',
        relatedCardIds: [1, 5, 12, 23],
      },
      {
        id: 'w2-003',
        category: 'balance',
        importance: 'medium',
        titleKey: 'patch_w2_balance_gacha_title',
        descKey: 'patch_w2_balance_gacha_desc',
        deepLinkView: 'shop',
      },
      {
        id: 'w2-004',
        category: 'content',
        importance: 'medium',
        titleKey: 'patch_w2_content_story_title',
        descKey: 'patch_w2_content_story_desc',
        relatedSeason: 'season1',
        deepLinkView: 'webtoon',
      },
      {
        id: 'w2-005',
        category: 'content',
        importance: 'high',
        titleKey: 'patch_w2_content_seasonhub_title',
        descKey: 'patch_w2_content_seasonhub_desc',
        deepLinkView: 'season-hub',
      },
      {
        id: 'w2-006',
        category: 'knownIssue',
        importance: 'medium',
        titleKey: 'patch_w2_known_ios_title',
        descKey: 'patch_w2_known_ios_desc',
      },
    ],
  },
  // ── Week 3: 콘텐츠 업데이트 ──
  {
    id: 'patch-week-3',
    weekLabel: 'Week 3 (2026-07-20 ~ 2026-07-26)',
    dateRange: '2026-07-20 ~ 2026-07-26',
    entries: [
      {
        id: 'w3-001',
        category: 'content',
        importance: 'high',
        titleKey: 'patch_w3_content_cardpack_title',
        descKey: 'patch_w3_content_cardpack_desc',
        relatedSeason: 'season1',
        deepLinkView: 'shop',
      },
      {
        id: 'w3-002',
        category: 'content',
        importance: 'high',
        titleKey: 'patch_w3_content_guildraid_title',
        descKey: 'patch_w3_content_guildraid_desc',
        deepLinkView: 'community',
      },
      {
        id: 'w3-003',
        category: 'balance',
        importance: 'high',
        titleKey: 'patch_w3_balance_ranked_title',
        descKey: 'patch_w3_balance_ranked_desc',
        deepLinkView: 'play',
      },
      {
        id: 'w3-004',
        category: 'bugfix',
        importance: 'medium',
        titleKey: 'patch_w3_bugfix_ui_title',
        descKey: 'patch_w3_bugfix_ui_desc',
      },
      {
        id: 'w3-005',
        category: 'bugfix',
        importance: 'low',
        titleKey: 'patch_w3_bugfix_sound_title',
        descKey: 'patch_w3_bugfix_sound_desc',
      },
      {
        id: 'w3-006',
        category: 'knownIssue',
        importance: 'low',
        titleKey: 'patch_w3_known_lowend_title',
        descKey: 'patch_w3_known_lowend_desc',
      },
    ],
  },
];

/** 패치노트 주차별 제목 라벨 가져오기 */
export function getPatchNoteWeekLabel(
  week: PatchNoteWeek,
  language: Language,
): string {
  return week.weekLabel;
}

/** 카테고리별로 그룹화된 엔트리 반환 */
export function groupEntriesByCategory(
  entries: PatchNoteEntry[],
): Record<PatchNoteCategory, PatchNoteEntry[]> {
  const grouped: Record<PatchNoteCategory, PatchNoteEntry[]> = {
    bugfix: [],
    balance: [],
    content: [],
    knownIssue: [],
  };
  for (const entry of entries) {
    grouped[entry.category].push(entry);
  }
  return grouped;
}
