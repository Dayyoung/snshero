import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, FileText, AlertTriangle } from 'lucide-react';
import { Language } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import type {
  PatchNoteWeek,
  PatchNoteCategory,
} from '../content/patchNotes';
import {
  PATCH_NOTE_CATEGORY_META,
  PATCH_NOTE_IMPORTANCE_META,
} from '../content/patchNotes';
import { PatchNoteDetail } from './PatchNoteDetail';

interface PatchNoteListProps {
  language: Language;
  patchNotes: PatchNoteWeek[];
  playSfx: (url: string) => void;
  setView?: (view: string) => void;
}

export const PatchNoteList: React.FC<PatchNoteListProps> = ({
  language,
  patchNotes,
  playSfx,
  setView,
}) => {
  const [selectedWeek, setSelectedWeek] = useState<PatchNoteWeek | null>(null);

  if (selectedWeek) {
    return (
      <PatchNoteDetail
        language={language}
        week={selectedWeek}
        onBack={() => setSelectedWeek(null)}
        playSfx={playSfx}
        setView={setView}
      />
    );
  }

  // 최신순 정렬 (id 기준 역순)
  const sorted = [...patchNotes].reverse();

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15">
          <FileText size={16} className="text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">
            {t('patchnote_title', language)}
          </h3>
          <p className="text-[10px] font-semibold text-slate-500">
            {t('patchnote_subtitle', language)}
          </p>
        </div>
      </div>

      {/* 최신 패치노트 - 강조 카드 */}
      {sorted.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-blue-300/60 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 p-5 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
          onClick={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            setSelectedWeek(sorted[0]);
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="rounded-full bg-blue-500 px-3 py-1 text-[9px] font-black text-white uppercase tracking-wider">
              {t('patchnote_latest', language)}
            </span>
            <ChevronRight size={16} className="text-blue-400" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            {sorted[0].weekLabel}
          </h4>
          <p className="text-[10px] font-semibold text-slate-500 mt-1">
            {sorted[0].dateRange}
          </p>

          {/* 카테고리 칩 요약 */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(['bugfix', 'balance', 'content', 'knownIssue'] as PatchNoteCategory[]).map((cat) => {
              const count = sorted[0].entries.filter((e) => e.category === cat).length;
              if (count === 0) return null;
              const meta = PATCH_NOTE_CATEGORY_META[cat];
              return (
                <span
                  key={cat}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-bold',
                    meta.color,
                  )}
                >
                  <span>{meta.iconKey}</span>
                  <span>
                    {language === 'ko' ? meta.labelKo : meta.labelEn}
                  </span>
                  <span className="opacity-60">×{count}</span>
                </span>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 지난 패치노트 목록 */}
      {sorted.length > 1 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
            {t('patchnote_previous', language)}
          </h4>
          <div className="flex flex-col gap-2">
            {sorted.slice(1).map((week, idx) => (
              <motion.button
                key={week.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setSelectedWeek(week);
                }}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-blue-300 hover:shadow-sm active:scale-[0.99] transition-all touch-target"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {week.weekLabel}
                  </p>
                  <p className="text-[9px] font-semibold text-slate-450 mt-0.5">
                    {week.dateRange}
                  </p>
                  <div className="flex gap-1 mt-1.5">
                    {(['bugfix', 'balance', 'content'] as PatchNoteCategory[]).map((cat) => {
                      const count = week.entries.filter((e) => e.category === cat).length;
                      if (count === 0) return null;
                      const meta = PATCH_NOTE_CATEGORY_META[cat];
                      return (
                        <span
                          key={cat}
                          className={cn(
                            'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[7px] font-bold',
                            meta.color,
                          )}
                        >
                          {meta.iconKey}{count}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 shrink-0 ml-3" />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* 패치노트가 없는 경우 */}
      {patchNotes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
          <AlertTriangle size={32} className="opacity-40" />
          <p className="text-[10px] font-bold uppercase tracking-wider">
            {t('patchnote_empty', language)}
          </p>
        </div>
      )}
    </div>
  );
};
