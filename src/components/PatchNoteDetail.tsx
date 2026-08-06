import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Language } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import type {
  PatchNoteWeek,
  PatchNoteEntry,
  PatchNoteCategory,
} from '../content/patchNotes';
import {
  PATCH_NOTE_CATEGORY_META,
  PATCH_NOTE_IMPORTANCE_META,
  groupEntriesByCategory,
} from '../content/patchNotes';

interface PatchNoteDetailProps {
  language: Language;
  week: PatchNoteWeek;
  onBack: () => void;
  playSfx: (url: string) => void;
  setView?: (view: string) => void;
}

/** 섹션별 아이콘 매핑 */
const SECTION_ICONS: Record<PatchNoteCategory, React.ReactNode> = {
  bugfix: '🔧',
  balance: '⚖️',
  content: '✨',
  knownIssue: '⚠️',
};

const SECTION_ORDER: PatchNoteCategory[] = [
  'bugfix',
  'balance',
  'content',
  'knownIssue',
];

export const PatchNoteDetail: React.FC<PatchNoteDetailProps> = ({
  language,
  week,
  onBack,
  playSfx,
  setView,
}) => {
  const grouped = groupEntriesByCategory(week.entries);
  // 기본: 모든 섹션 열기
  const [collapsedSections, setCollapsedSections] = useState<
    Set<PatchNoteCategory>
  >(new Set());

  const toggleSection = (cat: PatchNoteCategory) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 뒤로가기 + 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            onBack();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all touch-target shrink-0"
        >
          <ArrowLeft size={16} className="text-slate-600" />
        </button>
        <div className="min-w-0">
          <h3 className="text-sm font-black text-slate-800 truncate">
            {t('patchnote_detail_title', language)}
          </h3>
          <p className="text-[10px] font-semibold text-slate-500">
            {week.dateRange}
          </p>
        </div>
      </div>

      {/* 위크 라벨 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white shadow-md"
      >
        <h4 className="text-base font-black">{week.weekLabel}</h4>
        <p className="text-[10px] font-semibold text-blue-100 mt-1">
          {t('patchnote_entries_count', language, {
            count: String(week.entries.length),
          })}
        </p>
      </motion.div>

      {/* 카테고리별 아코디언 섹션 */}
      <div className="flex flex-col gap-3">
        {SECTION_ORDER.map((cat) => {
          const entries = grouped[cat];
          if (entries.length === 0) return null;

          const meta = PATCH_NOTE_CATEGORY_META[cat];
          const isCollapsed = collapsedSections.has(cat);

          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
            >
              {/* 섹션 헤더 (클릭 시 접기/펴기) */}
              <button
                onClick={() => toggleSection(cat)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors touch-target"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{SECTION_ICONS[cat]}</span>
                  <div className="text-left">
                    <span
                      className={cn(
                        'inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase',
                        meta.color,
                      )}
                    >
                      {language === 'ko' ? meta.labelKo : meta.labelEn}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 ml-1.5">
                      {entries.length}
                    </span>
                  </div>
                </div>
                {isCollapsed ? (
                  <ChevronDown size={16} className="text-slate-400" />
                ) : (
                  <ChevronUp size={16} className="text-slate-400" />
                )}
              </button>

              {/* 섹션 본문 */}
              {!isCollapsed && (
                <div className="px-4 pb-4 flex flex-col gap-3">
                  {entries.map((entry) => (
                    <PatchEntryItem
                      key={entry.id}
                      language={language}
                      entry={entry}
                      setView={setView}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

/** 개별 패치노트 항목 */
const PatchEntryItem: React.FC<{
  language: Language;
  entry: PatchNoteEntry;
  setView?: (view: string) => void;
}> = ({ language, entry, setView }) => {
  const impMeta = PATCH_NOTE_IMPORTANCE_META[entry.importance];

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
      <div className="flex items-start justify-between gap-2">
        {/* 중요도 도트 + 제목 */}
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <span
            className={cn(
              'mt-1 h-2 w-2 rounded-full shrink-0',
              impMeta.dotColor,
            )}
            title={language === 'ko' ? impMeta.labelKo : impMeta.labelEn}
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800">
              {t(entry.titleKey, language)}
            </p>
            <p className="text-[10px] font-semibold text-slate-500 leading-relaxed mt-0.5">
              {t(entry.descKey, language)}
            </p>
          </div>
        </div>

        {/* 중요도 뱃지 */}
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-wider',
            entry.importance === 'critical'
              ? 'bg-red-100 text-red-600'
              : entry.importance === 'high'
                ? 'bg-amber-100 text-amber-600'
                : entry.importance === 'medium'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-slate-100 text-slate-500',
          )}
        >
          {language === 'ko' ? impMeta.labelKo : impMeta.labelEn}
        </span>
      </div>

      {/* 딥링크 버튼 */}
      {entry.deepLinkView && setView && (
        <button
          onClick={() => setView(entry.deepLinkView!)}
          className="mt-2 inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[9px] font-bold text-blue-600 hover:bg-blue-100 active:scale-95 transition-all touch-target"
        >
          <ExternalLink size={10} />
          <span>{t('patchnote_go_to_view', language)}</span>
        </button>
      )}

      {/* 관련 카드 ID 표시 */}
      {entry.relatedCardIds && entry.relatedCardIds.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          <AlertCircle size={10} className="text-slate-400" />
          <span className="text-[8px] font-semibold text-slate-400">
            {t('patchnote_related_cards', language)}:{' '}
            {entry.relatedCardIds.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};
