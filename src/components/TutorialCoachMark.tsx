import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Ban, Clock3, Compass, Check } from 'lucide-react';
import { t } from '../lib/i18n';
import type { Language } from '../types';
import { cn } from '../lib/utils';
import type { ContextualTutorialPlacement } from '../content/contextualTutorials';

interface TutorialCoachMarkProps {
  open: boolean;
  language: Language;
  title: string;
  body: string;
  placement?: ContextualTutorialPlacement;
  stepIndex: number;
  totalSteps: number;
  lowSpecMode?: boolean;
  onNext: () => void;
  onLater: () => void;
  onNeverShow: () => void;
}

const placementClasses: Record<ContextualTutorialPlacement, string> = {
  'top-center': 'items-start justify-center pt-20',
  'bottom-center': 'items-end justify-center pb-28 sm:pb-24',
  'bottom-right': 'items-end justify-end pb-28 sm:pb-24 pr-4 sm:pr-6',
};

export const TutorialCoachMark: React.FC<TutorialCoachMarkProps> = ({
  open,
  language,
  title,
  body,
  placement = 'bottom-right',
  stepIndex,
  totalSteps,
  lowSpecMode = false,
  onNext,
  onLater,
  onNeverShow,
}) => {
  const isLastStep = stepIndex >= totalSteps - 1;
  const motionProps = lowSpecMode
    ? {}
    : {
        initial: { opacity: 0, y: 16, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 12, scale: 0.98 },
        transition: { duration: 0.18 },
      };

  return (
    <AnimatePresence>
      {open && (
        <div className={cn('fixed inset-0 z-[100100] pointer-events-none flex p-4 sm:p-6', placementClasses[placement])}>
          <motion.aside
            {...motionProps}
            className="pointer-events-auto w-full max-w-md rounded-[24px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.18)] backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-live="polite"
            aria-label={t('contextual_tutorial_badge', language)}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Compass size={20} />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-indigo-700">
                    {t('contextual_tutorial_badge', language)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {t('contextual_tutorial_progress', language, {
                      current: stepIndex + 1,
                      total: totalSteps,
                    })}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-slate-900 sm:text-lg">{title}</h3>
                  <p className="text-sm leading-6 text-slate-600">{body}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onLater}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 active:scale-[0.98]"
              >
                <Clock3 size={16} />
                {t('contextual_tutorial_later', language)}
              </button>
              <button
                type="button"
                onClick={onNeverShow}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 active:scale-[0.98]"
              >
                <Ban size={16} />
                {t('contextual_tutorial_never', language)}
              </button>
              <button
                type="button"
                onClick={onNext}
                className="ml-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-500 active:scale-[0.98]"
              >
                {isLastStep ? <Check size={16} /> : <ArrowRight size={16} />}
                {t(isLastStep ? 'contextual_tutorial_done' : 'contextual_tutorial_next', language)}
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
