import React, { useEffect, useMemo, useState } from 'react';
import { Language } from '../../types';
import { t } from '../../lib/i18n';
import { CARD_DATABASE } from '../../cardDatabase';
import { getCharacterIpProfile } from '../../content/characterIpUtils';
import {
  CalendarEntry,
  ContentStatus,
  CONTENT_TYPE_LABELS,
  STATUS_LABELS,
  CHANNEL_LABELS,
  SHARE_TEMPLATE_LABELS,
  getCalendarEntriesForSeason,
  getWeekGroupsForSeason,
} from '../../content/contentCalendar';
import { getCurrentSeasonConfig } from '../../content/seasons';
import { getEpisodeById } from '../../content/webtoonEpisodes';
import {
  Calendar, CheckCircle2, AlertTriangle, FileText, Image,
  MessageSquare, Users, Award, ChevronDown, ChevronUp,
  Clock, BookOpen, Star,
} from 'lucide-react';

interface ContentCalendarPanelProps {
  language: Language;
  currentSeason: string;
  lowSpecMode: boolean;
}

const TYPE_ICONS: Record<CalendarEntry['contentType'], React.ReactNode> = {
  webtoon: <BookOpen size={14} />,
  character: <Star size={14} />,
  sns_post: <MessageSquare size={14} />,
  fan_event: <Users size={14} />,
  season_mission: <Award size={14} />,
};

const STATUS_COLORS: Record<ContentStatus, string> = {
  ready: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  scheduled: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  published: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  review: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

/** 콘텐츠 QA 진단 데이터 */
interface QADiagnostic {
  type:
    | 'missing_art'
    | 'missing_profile'
    | 'missing_translation'
    | 'missing_image'
    | 'past_due_unpublished'
    | 'missing_reward'
    | 'missing_episode'
    | 'missing_template';
  severity: 'error' | 'warning' | 'info';
  messageKey: string;
  count: number;
  cardIds?: number[];
  episodeIds?: string[];
  templateIds?: string[];
}

const hasTranslation = (key: string, language: Language): boolean => t(key, language) !== key;

/** 진단 데이터 계산 */
function computeQADiagnostics(entries: CalendarEntry[]): QADiagnostic[] {
  const diagnostics: QADiagnostic[] = [];
  let missingArt = 0;
  let missingTranslationChecklist = 0;
  let missingImageChecklist = 0;
  let missingReward = 0;
  const pastDueIds = new Set<string>();
  const missingProfileIds = new Set<number>();
  const missingTranslationIds = new Set<string>();
  const missingImageIds = new Set<number>();
  const missingEpisodeIds = new Set<string>();
  const missingTemplateIds = new Set<string>();

  const now = new Date();
  for (const entry of entries) {
    if (!entry.publishChecklist.art) missingArt++;
    if (!entry.publishChecklist.translation) missingTranslationChecklist++;
    if (!entry.publishChecklist.shareImage) missingImageChecklist++;
    if (!entry.publishChecklist.rewards) missingReward++;

    if (!hasTranslation(entry.titleKey, 'ko') || !hasTranslation(entry.titleKey, 'en') || !hasTranslation(entry.descKey, 'ko') || !hasTranslation(entry.descKey, 'en')) {
      missingTranslationIds.add(entry.id);
    }

    const entryDate = new Date(`${entry.scheduledDate}T00:00:00Z`);
    if (entryDate < now && entry.status !== 'published') {
      pastDueIds.add(entry.relatedEpisodeId ?? entry.id);
    }

    if (entry.relatedEpisodeId && !getEpisodeById(entry.relatedEpisodeId)) {
      missingEpisodeIds.add(entry.relatedEpisodeId);
    }

    if (entry.relatedShareTemplateId && !SHARE_TEMPLATE_LABELS[entry.relatedShareTemplateId]) {
      missingTemplateIds.add(entry.relatedShareTemplateId);
    }

    for (const cardId of entry.relatedCardIds) {
      const card = CARD_DATABASE[cardId];
      if (!card || !getCharacterIpProfile(cardId)) {
        missingProfileIds.add(cardId);
      }
      if (!card?.imageUrl) {
        missingImageIds.add(cardId);
      }
    }
  }

  if (missingArt > 0) {
    diagnostics.push({
      type: 'missing_art',
      severity: 'error',
      messageKey: 'cal_qa_diag_missing_art',
      count: missingArt,
      cardIds: entries.filter((entry) => !entry.publishChecklist.art).flatMap((entry) => entry.relatedCardIds),
    });
  }
  if (missingProfileIds.size > 0) {
    diagnostics.push({
      type: 'missing_profile',
      severity: 'error',
      messageKey: 'cal_qa_diag_missing_profile',
      count: missingProfileIds.size,
      cardIds: Array.from(missingProfileIds),
    });
  }
  if (missingTranslationChecklist > 0 || missingTranslationIds.size > 0) {
    diagnostics.push({
      type: 'missing_translation',
      severity: 'warning',
      messageKey: 'cal_qa_diag_missing_translation',
      count: missingTranslationChecklist + missingTranslationIds.size,
      episodeIds: Array.from(missingTranslationIds),
    });
  }
  if (missingImageChecklist > 0 || missingImageIds.size > 0) {
    diagnostics.push({
      type: 'missing_image',
      severity: 'error',
      messageKey: 'cal_qa_diag_missing_image',
      count: missingImageChecklist + missingImageIds.size,
      cardIds: Array.from(missingImageIds),
    });
  }
  if (missingReward > 0) {
    diagnostics.push({
      type: 'missing_reward',
      severity: 'warning',
      messageKey: 'cal_qa_diag_missing_reward',
      count: missingReward,
      cardIds: entries.filter((entry) => !entry.publishChecklist.rewards).flatMap((entry) => entry.relatedCardIds),
    });
  }
  if (missingEpisodeIds.size > 0) {
    diagnostics.push({
      type: 'missing_episode',
      severity: 'error',
      messageKey: 'cal_qa_diag_missing_episode',
      count: missingEpisodeIds.size,
      episodeIds: Array.from(missingEpisodeIds),
    });
  }
  if (missingTemplateIds.size > 0) {
    diagnostics.push({
      type: 'missing_template',
      severity: 'warning',
      messageKey: 'cal_qa_diag_missing_template',
      count: missingTemplateIds.size,
      templateIds: Array.from(missingTemplateIds),
    });
  }
  if (pastDueIds.size > 0) {
    diagnostics.push({
      type: 'past_due_unpublished',
      severity: 'error',
      messageKey: 'cal_qa_diag_past_due',
      count: pastDueIds.size,
      episodeIds: Array.from(pastDueIds),
    });
  }

  return diagnostics;
}

/** 발행 체크리스트 뱃지 */
const ChecklistBadge: React.FC<{ passed: boolean; label: string }> = ({ passed, label }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors ${
    passed
      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
      : 'bg-slate-800 border-slate-700 text-slate-500'
  }`}>
    {passed ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
    {label}
  </span>
);

export const ContentCalendarPanel: React.FC<ContentCalendarPanelProps> = ({ language, currentSeason, lowSpecMode }) => {
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'qa'>('calendar');

  const seasonConfig = useMemo(() => getCurrentSeasonConfig(currentSeason), [currentSeason]);
  const weekGroups = useMemo(() => getWeekGroupsForSeason(currentSeason), [currentSeason]);
  const seasonEntries = useMemo(() => getCalendarEntriesForSeason(currentSeason), [currentSeason]);
  const defaultWeek = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return weekGroups.find((week) => week.startDate <= today && week.endDate >= today)?.week ?? 1;
  }, [weekGroups]);
  const weekEntries = useMemo(
    () => seasonEntries.filter((entry) => entry.week === activeWeek),
    [activeWeek, seasonEntries],
  );
  const qaDiagnostics = useMemo(() => computeQADiagnostics(seasonEntries), [seasonEntries]);

  useEffect(() => {
    setActiveWeek(defaultWeek);
    setExpandedEntryId(null);
  }, [currentSeason, defaultWeek]);

  const totalQAWarnings = qaDiagnostics.filter((diagnostic) => diagnostic.severity !== 'info').length;
  const currentWeekGroup = weekGroups.find((week) => week.week === activeWeek);

  const toggleEntry = (id: string) => {
    setExpandedEntryId((prev) => prev === id ? null : id);
  };

  return (
    <div className={`flex-1 bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl flex flex-col min-h-0 text-white overflow-hidden ${lowSpecMode ? '' : 'backdrop-blur-sm shadow-md'}`}>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-4 mb-4 gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight uppercase flex items-center gap-2">
            <Calendar size={18} className="text-indigo-400" />
            {t('admin_calendar_title', language)}
          </h2>
          <p className="text-[9px] text-slate-450 font-mono tracking-wider mt-1">
            CONTENT CALENDAR — {t(seasonConfig.titleKey, language)} · {currentSeason.toUpperCase()}
          </p>
          <p className="text-[9px] text-slate-550 font-mono tracking-wider mt-1">
            {seasonConfig.startDate} → {seasonConfig.endDate}
          </p>
          {/* 보안 경고: 클라이언트 인증은 MVP 보조 도구이며, 실제 서비스 배포 전 Firestore Rules 검증 필요 */}
          <p className="text-[8px] text-amber-500/70 mt-1 italic">
            ⚠ {t('cal_security_notice', language)}
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex gap-1.5 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('cal_view_calendar', language)}
          </button>
          <button
            onClick={() => setViewMode('qa')}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer relative ${
              viewMode === 'qa'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('cal_view_qa', language)}
            {totalQAWarnings > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[8px] font-bold flex items-center justify-center">
                {totalQAWarnings}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── QA Diagnostics View ── */}
      {viewMode === 'qa' && (
        <div className="flex-1 overflow-auto custom-scrollbar space-y-4">
          {/* 진단 요약 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {qaDiagnostics.map((diag, i) => (
              <div
                key={i}
                className={`p-3 rounded-2xl border ${
                  diag.severity === 'error'
                    ? 'bg-red-500/5 border-red-500/20'
                    : diag.severity === 'warning'
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-blue-500/5 border-blue-500/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} className={
                    diag.severity === 'error' ? 'text-red-400' :
                    diag.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'
                  } />
                  <span className="text-[10px] font-bold text-white/80">{t(diag.messageKey, language)}</span>
                </div>
                <span className={`text-2xl font-extrabold ${
                  diag.severity === 'error' ? 'text-red-400' :
                  diag.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'
                }`}>
                  {diag.count}
                </span>
                {(diag.cardIds && diag.cardIds.length > 0) && (
                  <p className="mt-2 text-[9px] text-slate-500 font-mono truncate">
                    {diag.cardIds.slice(0, 4).map((cardId) => `#${cardId}`).join(', ')}
                  </p>
                )}
                {(diag.episodeIds && diag.episodeIds.length > 0) && (
                  <p className="mt-2 text-[9px] text-slate-500 font-mono truncate">
                    {diag.episodeIds.slice(0, 3).join(', ')}
                  </p>
                )}
                {(diag.templateIds && diag.templateIds.length > 0) && (
                  <p className="mt-2 text-[9px] text-slate-500 font-mono truncate">
                    {diag.templateIds.slice(0, 3).join(', ')}
                  </p>
                )}
              </div>
            ))}
            {qaDiagnostics.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500">
                <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-500/50" />
                <p className="text-sm font-bold">{t('cal_qa_all_clear', language)}</p>
                <p className="text-[10px] mt-1">{t('cal_qa_all_clear_desc', language)}</p>
              </div>
            )}
          </div>

          {/* 체크리스트 미완료 항목 상세 */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {t('cal_qa_checklist_detail', language)}
            </h3>
            <div className="space-y-2 max-h-64 overflow-auto custom-scrollbar">
              {seasonEntries.filter((entry) => {
                const checklist = entry.publishChecklist;
                return !checklist.art || !checklist.translation || !checklist.rewards || !checklist.shareImage || !checklist.qa;
              }).slice(0, 20).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{t(entry.titleKey, language)}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      W{entry.week} · {entry.scheduledDate}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0 ml-3">
                    <ChecklistBadge passed={entry.publishChecklist.art} label={t('cal_check_art', language)} />
                    <ChecklistBadge passed={entry.publishChecklist.translation} label={t('cal_check_trans', language)} />
                    <ChecklistBadge passed={entry.publishChecklist.rewards} label={t('cal_check_reward', language)} />
                    <ChecklistBadge passed={entry.publishChecklist.shareImage} label={t('cal_check_share', language)} />
                    <ChecklistBadge passed={entry.publishChecklist.qa} label={t('cal_check_qa', language)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Calendar View ── */}
      {viewMode === 'calendar' && (
        <>
          {/* Week selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 custom-scrollbar shrink-0">
            {weekGroups.map(w => (
              <button
                key={w.week}
                onClick={() => { setActiveWeek(w.week); setExpandedEntryId(null); }}
                className={`px-3 py-2 text-[10px] font-bold rounded-xl border transition-all shrink-0 cursor-pointer ${
                  activeWeek === w.week
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 shadow-[0_0_10px_rgba(79,70,229,0.15)]'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                }`}
              >
                W{w.week}
              </button>
            ))}
          </div>

          {/* Week info header */}
          {currentWeekGroup && (
            <div className="flex items-center justify-between mt-3 mb-2 px-1">
              <div>
                <span className="text-xs font-bold text-indigo-400">{t(currentWeekGroup.themeKey, language)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <Clock size={12} />
                <span>{currentWeekGroup.startDate} → {currentWeekGroup.endDate}</span>
              </div>
            </div>
          )}

          {/* Entry list */}
          <div className="flex-1 overflow-auto custom-scrollbar space-y-2 mt-2">
            {weekEntries.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Calendar size={28} className="mx-auto mb-3 text-slate-600" />
                <p className="text-xs font-bold">{t('cal_no_entries', language)}</p>
                <p className="text-[10px] mt-1">{t('cal_no_entries_desc', language)}</p>
              </div>
            ) : (
              weekEntries.map(entry => (
                <div
                  key={entry.id}
                  className={`bg-slate-950/30 border rounded-2xl overflow-hidden transition-all ${
                    expandedEntryId === entry.id
                      ? 'border-indigo-500/40 shadow-[0_0_15px_rgba(79,70,229,0.1)]'
                      : 'border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  {/* Entry header (clickable) */}
                  <button
                    onClick={() => toggleEntry(entry.id)}
                    className="w-full flex items-center gap-3 p-3 text-left cursor-pointer"
                  >
                    {/* Type icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      entry.contentType === 'webtoon' ? 'bg-purple-500/10 text-purple-400' :
                      entry.contentType === 'character' ? 'bg-amber-500/10 text-amber-400' :
                      entry.contentType === 'sns_post' ? 'bg-blue-500/10 text-blue-400' :
                      entry.contentType === 'fan_event' ? 'bg-pink-500/10 text-pink-400' :
                      'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {TYPE_ICONS[entry.contentType]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {t(entry.titleKey, language)}
                        </span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-bold uppercase ${STATUS_COLORS[entry.status]}`}>
                          {t(STATUS_LABELS[entry.status], language)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-slate-500 font-mono">
                          {t(CONTENT_TYPE_LABELS[entry.contentType], language)}
                        </span>
                        <span className="text-slate-700">·</span>
                        <span className="text-[9px] text-slate-600">{entry.scheduledDate}</span>
                      </div>
                    </div>

                    {/* Channel badges */}
                    <div className="flex gap-1 shrink-0">
                      {entry.channels.map(ch => (
                        <span key={ch} className="text-[8px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold uppercase">
                          {t(CHANNEL_LABELS[ch], language)}
                        </span>
                      ))}
                    </div>

                    {/* Expand toggle */}
                    {expandedEntryId === entry.id
                      ? <ChevronUp size={14} className="text-slate-500 shrink-0" />
                      : <ChevronDown size={14} className="text-slate-500 shrink-0" />
                    }
                  </button>

                  {/* Expanded detail */}
                  {expandedEntryId === entry.id && (
                    <div className="border-t border-slate-800/60 p-4 space-y-3 bg-slate-950/20">
                      {/* Description */}
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {t(entry.descKey, language)}
                      </p>

                      {/* Related cards */}
                      {entry.relatedCardIds.length > 0 && (
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                            {t('cal_related_cards', language)}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {entry.relatedCardIds.map(id => (
                              <span key={id} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[9px] font-bold text-indigo-400">
                                #{id}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Publish checklist */}
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                          {t('cal_publish_checklist', language)}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <ChecklistBadge passed={entry.publishChecklist.art} label={t('cal_check_art', language)} />
                          <ChecklistBadge passed={entry.publishChecklist.translation} label={t('cal_check_trans', language)} />
                          <ChecklistBadge passed={entry.publishChecklist.rewards} label={t('cal_check_reward', language)} />
                          <ChecklistBadge passed={entry.publishChecklist.shareImage} label={t('cal_check_share', language)} />
                          <ChecklistBadge passed={entry.publishChecklist.qa} label={t('cal_check_qa', language)} />
                        </div>
                      </div>

                      {/* QA sub-checklist */}
                      {entry.qaChecklist.length > 0 && (
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                            {t('cal_qa_items', language)}
                          </span>
                          <div className="space-y-1">
                            {entry.qaChecklist.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 text-[10px]">
                                {item.passed
                                  ? <CheckCircle2 size={12} className="text-emerald-500" />
                                  : <AlertTriangle size={12} className="text-slate-600" />
                                }
                                <span className={item.passed ? 'text-slate-400' : 'text-slate-600'}>
                                  {t(item.labelKey, language)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Related episode / template */}
                      {(entry.relatedEpisodeId || entry.relatedShareTemplateId) && (
                        <div className="flex gap-3 text-[10px] text-slate-500">
                          {entry.relatedEpisodeId && (
                            <span className="flex items-center gap-1">
                              <FileText size={11} />
                              {entry.relatedEpisodeId}
                            </span>
                          )}
                          {entry.relatedShareTemplateId && (
                            <span className="flex items-center gap-1">
                              <Image size={11} />
                              {t(SHARE_TEMPLATE_LABELS[entry.relatedShareTemplateId], language)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
