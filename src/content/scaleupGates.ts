/** ─── 스케일업 게이트 타입 ─────────────────────────────── */

export type GateStatus = 'ready' | 'watching' | 'hold' | 'danger';
export type ExpansionTrack = 'new_faction' | 'new_chapter' | 'new_locale' | 'influencer_campaign' | 'payment_expansion';
export type ScaleupMetricGoal = 'at_least' | 'at_most';

export interface ScaleupGateMetric {
  key: string;          // i18n key
  targetValue: number;
  currentProvider: () => number; // 현재값 provider (mock 또는 실제 API)
  unit?: string;        // 예: %, 명, 건
  goal?: ScaleupMetricGoal;
}

export interface ScaleupGateTrack {
  id: ExpansionTrack;
  titleKey: string;
  descKey: string;
  prerequisiteMetrics: ScaleupGateMetric[];
  startCondition: string;  // 사람이 읽는 착수 조건 설명 (i18n key)
  riskKey: string;         // i18n key
  nextActionDocKey: string; // 다음 작업 문서 연결 (i18n key)
  nextActionDocPath?: string;
  nextActionChecklist: string[]; // 체크리스트 (i18n keys)
}

/** ─── Mock 지표 provider ──────────────────────────────── */

export function mockMetricProvider(key: string): number {
  // 28번 분석 대시보드가 없는 경우 fallback mock provider
  const mockValues: Record<string, number> = {
    // 신규 세력
    active_users_7d: 1520,
    retention_d14: 38,        // %
    faction_content_count: 45,
    faction_balance_score: 72, // 100점 만점
    // 신규 챕터
    chapter_completion_rate: 64, // %
    story_engagement_hours: 120000,
    existing_chapter_bugs: 3,
    // 신규 언어권
    locale_dau_target: 250,
    translation_coverage: 0,  // %
    locale_community_activity: 0,
    // 인플루언서 캠페인
    influencer_monthly_reach: 85000,
    conversion_rate: 2.1,     // %
    campaign_roi: 1.2,
    // 결제수단 확대
    payment_failure_rate: 4.2, // %
    new_payment_request_count: 87,
    payment_partner_ready: 0,
  };
  return mockValues[key] ?? 0;
}

/** ─── 스케일업 게이트 트랙 정의 ────────────────────────── */

export const SCALEUP_GATE_TRACKS: ScaleupGateTrack[] = [
  {
    id: 'new_faction',
    titleKey: 'scaleup_gate_track_new_faction',
    descKey: 'scaleup_gate_track_new_faction_desc',
    prerequisiteMetrics: [
      {
        key: 'scaleup_gate_metric_active_users_7d',
        targetValue: 2000,
        currentProvider: () => mockMetricProvider('active_users_7d'),
        unit: '명',
      },
      {
        key: 'scaleup_gate_metric_retention_d14',
        targetValue: 40,
        currentProvider: () => mockMetricProvider('retention_d14'),
        unit: '%',
      },
      {
        key: 'scaleup_gate_metric_faction_content_count',
        targetValue: 60,
        currentProvider: () => mockMetricProvider('faction_content_count'),
        unit: '건',
      },
      {
        key: 'scaleup_gate_metric_faction_balance_score',
        targetValue: 80,
        currentProvider: () => mockMetricProvider('faction_balance_score'),
        unit: '/100',
      },
    ],
    startCondition: 'scaleup_gate_condition_new_faction',
    riskKey: 'scaleup_gate_risk_new_faction',
    nextActionDocKey: 'scaleup_gate_next_new_faction',
    nextActionDocPath: '/doc/44_ai_character_design_upgrade.md',
    nextActionChecklist: [
      'scaleup_gate_checklist_faction_lore',
      'scaleup_gate_checklist_faction_cards',
      'scaleup_gate_checklist_faction_balance_test',
      'scaleup_gate_checklist_faction_art_assets',
    ],
  },
  {
    id: 'new_chapter',
    titleKey: 'scaleup_gate_track_new_chapter',
    descKey: 'scaleup_gate_track_new_chapter_desc',
    prerequisiteMetrics: [
      {
        key: 'scaleup_gate_metric_chapter_completion',
        targetValue: 70,
        currentProvider: () => mockMetricProvider('chapter_completion_rate'),
        unit: '%',
      },
      {
        key: 'scaleup_gate_metric_story_engagement',
        targetValue: 150000,
        currentProvider: () => mockMetricProvider('story_engagement_hours'),
        unit: '시간',
      },
      {
        key: 'scaleup_gate_metric_existing_bugs',
        targetValue: 0,
        currentProvider: () => mockMetricProvider('existing_chapter_bugs'),
        unit: '건',
        goal: 'at_most',
      },
    ],
    startCondition: 'scaleup_gate_condition_new_chapter',
    riskKey: 'scaleup_gate_risk_new_chapter',
    nextActionDocKey: 'scaleup_gate_next_new_chapter',
    nextActionDocPath: '/doc/46_weekly_character_webtoon_release.md',
    nextActionChecklist: [
      'scaleup_gate_checklist_chapter_script',
      'scaleup_gate_checklist_chapter_webtoon',
      'scaleup_gate_checklist_chapter_rewards',
      'scaleup_gate_checklist_chapter_qa',
    ],
  },
  {
    id: 'new_locale',
    titleKey: 'scaleup_gate_track_new_locale',
    descKey: 'scaleup_gate_track_new_locale_desc',
    prerequisiteMetrics: [
      {
        key: 'scaleup_gate_metric_locale_dau',
        targetValue: 500,
        currentProvider: () => mockMetricProvider('locale_dau_target'),
        unit: 'DAU',
      },
      {
        key: 'scaleup_gate_metric_translation_coverage',
        targetValue: 95,
        currentProvider: () => mockMetricProvider('translation_coverage'),
        unit: '%',
      },
      {
        key: 'scaleup_gate_metric_locale_community',
        targetValue: 100,
        currentProvider: () => mockMetricProvider('locale_community_activity'),
        unit: '활동',
      },
    ],
    startCondition: 'scaleup_gate_condition_new_locale',
    riskKey: 'scaleup_gate_risk_new_locale',
    nextActionDocKey: 'scaleup_gate_next_new_locale',
    nextActionDocPath: '/doc/17_i18n_accessibility_polish.md',
    nextActionChecklist: [
      'scaleup_gate_checklist_locale_translation',
      'scaleup_gate_checklist_locale_cs',
      'scaleup_gate_checklist_locale_payment',
      'scaleup_gate_checklist_locale_legal',
    ],
  },
  {
    id: 'influencer_campaign',
    titleKey: 'scaleup_gate_track_influencer',
    descKey: 'scaleup_gate_track_influencer_desc',
    prerequisiteMetrics: [
      {
        key: 'scaleup_gate_metric_influencer_reach',
        targetValue: 100000,
        currentProvider: () => mockMetricProvider('influencer_monthly_reach'),
        unit: '도달',
      },
      {
        key: 'scaleup_gate_metric_conversion_rate',
        targetValue: 3,
        currentProvider: () => mockMetricProvider('conversion_rate'),
        unit: '%',
      },
      {
        key: 'scaleup_gate_metric_campaign_roi',
        targetValue: 1.5,
        currentProvider: () => mockMetricProvider('campaign_roi'),
        unit: 'ROI',
      },
    ],
    startCondition: 'scaleup_gate_condition_influencer',
    riskKey: 'scaleup_gate_risk_influencer',
    nextActionDocKey: 'scaleup_gate_next_influencer',
    nextActionDocPath: '/doc/31_creator_landing_influencer_tracking.md',
    nextActionChecklist: [
      'scaleup_gate_checklist_influencer_target',
      'scaleup_gate_checklist_influencer_contract',
      'scaleup_gate_checklist_influencer_creative',
      'scaleup_gate_checklist_influencer_tracking',
    ],
  },
  {
    id: 'payment_expansion',
    titleKey: 'scaleup_gate_track_payment',
    descKey: 'scaleup_gate_track_payment_desc',
    prerequisiteMetrics: [
      {
        key: 'scaleup_gate_metric_payment_failure',
        targetValue: 2,
        currentProvider: () => mockMetricProvider('payment_failure_rate'),
        unit: '%',
        goal: 'at_most',
      },
      {
        key: 'scaleup_gate_metric_payment_request',
        targetValue: 100,
        currentProvider: () => mockMetricProvider('new_payment_request_count'),
        unit: '건',
      },
      {
        key: 'scaleup_gate_metric_partner_ready',
        targetValue: 1,
        currentProvider: () => mockMetricProvider('payment_partner_ready'),
        unit: '완료',
      },
    ],
    startCondition: 'scaleup_gate_condition_payment',
    riskKey: 'scaleup_gate_risk_payment',
    nextActionDocKey: 'scaleup_gate_next_payment',
    nextActionDocPath: '/doc/25_payment_gateway_compliance.md',
    nextActionChecklist: [
      'scaleup_gate_checklist_payment_partner',
      'scaleup_gate_checklist_payment_integration',
      'scaleup_gate_checklist_payment_test',
      'scaleup_gate_checklist_payment_compliance',
    ],
  },
];

/** ─── 게이트 상태 판별 함수 ───────────────────────────── */

export interface ScaleupMetricEvaluation {
  current: number;
  target: number;
  progress: number;
  met: boolean;
  atRisk: boolean;
}

export function evaluateScaleupMetric(metric: ScaleupGateMetric): ScaleupMetricEvaluation {
  const current = metric.currentProvider();
  const target = metric.targetValue;
  const goal = metric.goal ?? 'at_least';

  if (goal === 'at_most') {
    const normalizedTarget = target <= 0 ? 1 : target;
    const riskBoundary = target <= 0 ? 1 : target * 1.5;
    return {
      current,
      target,
      progress: current <= 0 ? 1 : Math.min(normalizedTarget / current, 1),
      met: current <= target,
      atRisk: current > riskBoundary,
    };
  }

  const normalizedTarget = target <= 0 ? 1 : target;
  const progress = Math.min(current / normalizedTarget, 1);
  return {
    current,
    target,
    progress,
    met: current >= target,
    atRisk: progress < 0.5,
  };
}

export function computeGateStatus(track: ScaleupGateTrack): GateStatus {
  const metrics = track.prerequisiteMetrics;
  const total = metrics.length;
  if (total === 0) return 'hold';

  let met = 0;
  let atRisk = 0;

  for (const metric of metrics) {
    const evaluation = evaluateScaleupMetric(metric);

    if (evaluation.met) {
      met++;
    } else if (evaluation.atRisk) {
      atRisk++;
    }
  }

  if (met === total) return 'ready';
  if (atRisk > 0) return 'danger';
  if (met >= total * 0.5) return 'watching';
  return 'hold';
}
