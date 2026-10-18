import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
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
 const reducedMotion = useReducedMotion();
 const motionProps = lowSpecMode || reducedMotion
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
 className="pointer-events-auto w-full max-w-md max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-none border border-[var(--ui-line)] bg-[var(--ui-canvas)] text-[var(--ui-ink)] p-5 font-mono"
 role="dialog"
 aria-modal="false"
 aria-live="polite"
 aria-label={t('contextual_tutorial_badge', language)}
 >
 <div className="flex items-start gap-3">
 <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-[var(--ui-line)] bg-[var(--ui-surface)]">
 <Compass size={20} />
 </div>
 <div className="min-w-0 flex-1 space-y-3">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <span className="inline-flex items-center text-xs font-bold tracking-wide">
 {t('contextual_tutorial_badge', language)}
 </span>
 <span className="text-xs text-[var(--ui-muted)]">
 {t('contextual_tutorial_progress', language, {
 current: stepIndex + 1,
 total: totalSteps,
 })}
 </span>
 </div>
 <button
 type="button"
 onClick={onNeverShow}
 className="min-h-11 min-w-11 rounded-sm text-[var(--ui-muted)] hover:text-[var(--ui-ink)] transition-colors"
 aria-label="Close guide"
 >
 [X]
 </button>
 </div>
 <div className="space-y-1.5">
 <h3 className="text-base font-bold sm:text-lg">{title}</h3>
 <p className="text-sm leading-6 text-[var(--ui-muted)]">{body}</p>
 </div>
 </div>
 </div>

 <div className="mt-4 flex flex-wrap gap-2">
 <button
 type="button"
 onClick={onLater}
 className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-[var(--ui-line)] bg-[var(--ui-surface)] px-4 text-sm font-medium transition-colors hover:border-[var(--ui-muted)]"
 >
 <Clock3 size={16} />
 {t('contextual_tutorial_later', language)}
 </button>
 <button
 type="button"
 onClick={onNeverShow}
 className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-[var(--ui-line)] bg-[var(--ui-surface)] px-4 text-sm font-medium transition-colors hover:border-[var(--ui-muted)]"
 >
 <Ban size={16} />
 {t('contextual_tutorial_never', language)}
 </button>
 <button
 type="button"
 onClick={onNext}
 className="ml-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-[var(--ui-muted)] bg-[#201d1d] px-4 text-sm font-bold text-[#fdfcfc] transition-colors hover:bg-[#302c2c]"
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
