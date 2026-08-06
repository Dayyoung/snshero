import React, { useState, useEffect } from 'react';
import { Shield, FileText, RotateCcw, Dices, HelpCircle, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import { PageHeader } from '../components/PageHeader';
import type { Language, ViewType } from '../types';
import {
  POLICY_SECTIONS,
  getPolicyBody,
  type PolicySection,
} from '../content/policies';

interface PolicyCenterViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  lowSpecMode?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Dices,
  RotateCcw,
  Shield,
  FileText,
};

const HELP_STEPS = (language: Language) => [
  {
    title: language === 'ko' ? '정책 문서' : 'Policy Documents',
    body: language === 'ko'
      ? 'SNSHero의 모든 운영 정책을 한눈에 확인할 수 있습니다.\n각 항목을 클릭하면 상세 내용을 펼쳐볼 수 있습니다.'
      : 'View all SNSHero operational policies at a glance.\nClick any item to expand its detailed content.',
  },
  {
    title: language === 'ko' ? '검토 상태' : 'Review Status',
    body: language === 'ko'
      ? '각 정책은 검토 상태(검토 중, 승인됨, 업데이트 필요)를 가집니다.\n상태는 분기별로 갱신되며, 최신 정책을 반영합니다.'
      : 'Each policy has a review status (In Review, Approved, Needs Update).\nStatuses are updated quarterly to reflect the latest policies.',
  },
];

const PolicyAccordionItem: React.FC<{
  section: PolicySection;
  language: Language;
  isOpen: boolean;
  onToggle: () => void;
  lowSpecMode: boolean;
}> = ({
  section,
  language,
  isOpen,
  onToggle,
  lowSpecMode,
}) => {
  const IconComponent = ICON_MAP[section.icon] || FileText;
  const bodyText = getPolicyBody(section.id, language);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50/70 cursor-pointer sm:p-5"
      >
        <div className="shrink-0 rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
          <IconComponent size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-slate-800">
            {t(section.titleKey, language)}
          </h3>
        </div>
        <div
          className={cn(
            'shrink-0 pt-1 text-slate-400 transition-transform duration-200',
            isOpen && 'rotate-90',
          )}
        >
          <ChevronRight size={18} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={lowSpecMode ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-4 pb-5 sm:px-5">
              <div className="pt-4">
                <pre className="max-w-prose whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-slate-700">
                  {bodyText}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const PolicyCenterView: React.FC<PolicyCenterViewProps> = ({
  language,
  onNavigate,
  lowSpecMode = false,
}) => {
  const [openSectionId, setOpenSectionId] = useState<string | null>(POLICY_SECTIONS[0]?.id ?? null);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (showHelpPopup) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [showHelpPopup]);

  const [helpStep, setHelpStep] = useState(0);

  const handleToggle = (id: string) => {
    setOpenSectionId((prev) => (prev === id ? null : id));
  };

  const handleQuickSelect = (id: string) => {
    setOpenSectionId(id);
  };

  const helpSteps = HELP_STEPS(language);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      {/* Minimal header: PageHeader + ? help button */}
      <div className="flex items-center gap-2 pr-4">
        <div className="flex-1">
          <PageHeader
            title={t('policy_center_title', language)}
            onBack={() => onNavigate('setting')}
          />
        </div>
        <button
          type="button"
          onClick={() => { setShowHelpPopup(true); setHelpStep(0); }}
          className="min-h-11 min-w-11 flex items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:border-slate-900 hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all touch-target cursor-pointer shrink-0"
          aria-label={language === 'ko' ? '도움말' : 'Help'}
        >
          <HelpCircle size={18} />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        {/* Quick-select grid — minimal: just titles */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {POLICY_SECTIONS.map((section) => {
            const isActive = openSectionId === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleQuickSelect(section.id)}
                className={cn(
                  'rounded-2xl border bg-white p-4 text-left shadow-sm transition-all cursor-pointer active:scale-[0.98]',
                  isActive
                    ? 'border-slate-900 shadow-md ring-1 ring-slate-900/5'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
                )}
              >
                <p className="text-sm font-bold tracking-tight text-slate-800">
                  {t(section.titleKey, language)}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex-1 space-y-3">
          {POLICY_SECTIONS.map((section) => (
            <div key={section.id}>
              <PolicyAccordionItem
                section={section}
                language={language}
                isOpen={openSectionId === section.id}
                onToggle={() => handleToggle(section.id)}
                lowSpecMode={lowSpecMode}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Help Popup */}
      <AnimatePresence>
        {showHelpPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setShowHelpPopup(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 sticky top-0 z-10 bg-white pt-2">
                <div className="space-y-2">
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    {t('policy_center_title', language)}
                  </span>
                  <h3 className="text-lg font-black tracking-tight text-slate-900">
                    {helpSteps[helpStep].title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelpPopup(false)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 touch-target"
                  aria-label={language === 'ko' ? '닫기' : 'Close'}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                <p className="text-sm font-semibold leading-relaxed whitespace-pre-line text-slate-700">
                  {helpSteps[helpStep].body}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                <span>{helpStep + 1} / {helpSteps.length}</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setHelpStep((prev) => Math.max(prev - 1, 0))}
                  disabled={helpStep === 0}
                  className={cn(
                    'min-h-11 rounded-2xl border px-3 py-2 text-sm font-bold transition touch-target',
                    helpStep === 0
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:scale-95'
                  )}
                >
                  <ChevronLeft size={16} className="mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowHelpPopup(false)}
                  className="min-h-11 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 touch-target"
                >
                  {language === 'ko' ? '닫기' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (helpStep === helpSteps.length - 1) {
                      setShowHelpPopup(false);
                      return;
                    }
                    setHelpStep((prev) => Math.min(prev + 1, helpSteps.length - 1));
                  }}
                  className="min-h-11 rounded-2xl border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95 touch-target"
                >
                  {helpStep === helpSteps.length - 1
                    ? (language === 'ko' ? '완료' : 'Done')
                    : <ChevronRight size={16} className="mx-auto" />}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
