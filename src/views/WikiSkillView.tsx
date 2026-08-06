import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight,
  Gift,
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Language } from "../types";
import { INITIAL_SKILLS } from "../constants";
import { t } from "../lib/i18n";
import { PageHeader } from '../components/PageHeader';

interface WikiSkillViewProps {
  onNavigate: (view: any) => void;
  language: Language;
}

const iconMap: Record<string, any> = {
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft: ArrowLeftIcon,
  ArrowRight,
  Gift,
};

const HELP_SLIDES = [
  {
    title: "Skill System",
    text: "Spend earned EXP to unlock permanent passive bonuses that affect your entire active deck.",
  },
  {
    title: "Leveling Up",
    text: "Each skill can be leveled multiple times up to its Max Level. Higher-tier skills require reaching certain Global Player Levels.",
  },
  {
    title: "Effects",
    text: "Skills provide power boosts, directional stat increases, or utility bonuses like increased item drop rates.",
  },
];

export const WikiSkillView: React.FC<WikiSkillViewProps> = ({
  onNavigate,
  language,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (showHelp) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [showHelp]);

  const [helpStep, setHelpStep] = useState(0);

  return (
    <div className="min-h-screen app-bg text-slate-800 font-sans pb-32 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-6">
        <PageHeader title={t('wiki_skill_title', language)} onBack={() => onNavigate('home')} />

        <div className="flex items-center gap-3 mt-6 mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-slate-900">
            {t('wiki_skill_system', language)}
          </h1>
          <button
            type="button"
            onClick={() => { setShowHelp(true); setHelpStep(0); }}
            className="rounded-full border border-slate-300 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Help"
          >
            <HelpCircle size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INITIAL_SKILLS.map((skill) => {
            const Icon = iconMap[skill.icon] || Zap;

            const effectLabel = skill.effect.type.startsWith("stat")
              ? `+${skill.effect.value} ${t('wiki_to_stat', language)}`
              : skill.effect.type === "power"
                ? `+${(skill.effect.value * 100).toFixed(0)}% ${t('wiki_power', language)}`
                : `+${(skill.effect.value * 100).toFixed(0)}% ${t('wiki_chance', language)}`;

            return (
              <div
                key={skill.id}
                className="bg-white border border-slate-100 p-4 sm:p-5 rounded-lg shadow-sm flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0">
                  <Icon size={22} className="text-slate-700" />
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-tight text-slate-800 truncate">
                    {language === "ko" ? skill.name : skill.name_en}
                  </h3>
                  <span className="text-xs font-bold text-indigo-650 shrink-0">
                    {effectLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <AnimatePresence>
          {showHelp && (
            <motion.div
              className="fixed inset-0 z-[209] bg-black/50 backdrop-blur-sm flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-white pt-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {HELP_SLIDES[helpStep].title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowHelp(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Close help"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {HELP_SLIDES[helpStep].text}
                </p>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    disabled={helpStep === 0}
                    onClick={() => setHelpStep(helpStep - 1)}
                    className="p-2 rounded-full border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                    aria-label="Previous"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-medium text-slate-400">
                    {helpStep + 1} / {HELP_SLIDES.length}
                  </span>
                  {helpStep < HELP_SLIDES.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setHelpStep(helpStep + 1)}
                      className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
                      aria-label="Next"
                    >
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowHelp(false)}
                      className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                    >
                      Done
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
