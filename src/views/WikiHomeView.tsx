import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  Swords,
  Package,
  Zap,
  PlayCircle,
  Lightbulb,
  BookOpen,
  HelpCircle,
  X,
  ChevronLeft,
} from "lucide-react";
import { Language, ViewType } from "../types";
import { t } from "../lib/i18n";
import { PageHeader } from '../components/PageHeader';

interface WikiHomeViewProps {
  onNavigate: (view: ViewType) => void;
  language: Language;
}

const wikiHomeHelpSteps = (lang: Language) => [
  t('wiki_how_to_play', lang),
  t('wiki_tips', lang),
  t('wiki_card_index', lang),
  t('world_codex_title', lang),
  t('wiki_item_encyclopedia', lang),
  t('wiki_skill_system', lang),
];

export const WikiHomeView: React.FC<WikiHomeViewProps> = ({
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
  const helpSteps = wikiHomeHelpSteps(language);

  return (
    <div id="wiki-nav" className="min-h-screen app-bg text-slate-850 font-sans pb-32 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-6 mt-6">
        <PageHeader title={t('wiki_title', language)} onBack={() => onNavigate('home')} />

        {/* Title + Help Button */}
        <div className="flex items-center gap-3 mt-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-slate-900">
            {t('wiki_title', language)}
          </h1>
          <button
            onClick={() => { setShowHelp(true); setHelpStep(0); }}
            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
            aria-label="Help"
          >
            <HelpCircle size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 my-8 mb-16">
          <button
            onClick={() => {
              window.scrollTo(0, 0);
              onNavigate("wiki-howtoplay");
            }}
            className="text-left group bg-white border border-slate-200 p-5 rounded-lg hover:bg-slate-50/50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center justify-between min-h-[64px]"
          >
            <div className="flex items-center gap-3">
              <PlayCircle
                size={24}
                className="text-slate-400 group-hover:text-indigo-600 transition-colors"
              />
              <h3 className="text-sm font-bold text-slate-800 tracking-tight group-hover:text-indigo-900 transition-colors">
                {t("wiki_how_to_play", language)}
              </h3>
            </div>
            <ChevronRight
              size={16}
              className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0"
            />
          </button>

          <button
            onClick={() => {
              window.scrollTo(0, 0);
              onNavigate("wiki-tip");
            }}
            className="text-left group bg-white border border-slate-200 p-5 rounded-lg hover:bg-slate-50/50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center justify-between min-h-[64px]"
          >
            <div className="flex items-center gap-3">
              <Lightbulb
                size={24}
                className="text-slate-400 group-hover:text-indigo-600 transition-colors"
              />
              <h3 className="text-sm font-bold text-slate-800 tracking-tight group-hover:text-indigo-900 transition-colors">
                {t("wiki_tips", language)}
              </h3>
            </div>
            <ChevronRight
              size={16}
              className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0"
            />
          </button>

          <button
            onClick={() => {
              window.scrollTo(0, 0);
              onNavigate("wiki-card");
            }}
            className="text-left group bg-white border border-slate-200 p-5 rounded-lg hover:bg-slate-50/50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center justify-between min-h-[64px]"
          >
            <div className="flex items-center gap-3">
              <Swords
                size={24}
                className="text-slate-400 group-hover:text-indigo-600 transition-colors"
              />
              <h3 className="text-sm font-bold text-slate-800 tracking-tight group-hover:text-indigo-900 transition-colors">
                {t("wiki_card_index", language)}
              </h3>
            </div>
            <ChevronRight
              size={16}
              className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0"
            />
          </button>

          <button
            onClick={() => {
              window.scrollTo(0, 0);
              onNavigate("world-codex");
            }}
            className="text-left group bg-white border border-slate-200 p-5 rounded-lg hover:bg-slate-50/50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center justify-between min-h-[64px]"
          >
            <div className="flex items-center gap-3">
              <BookOpen
                size={24}
                className="text-slate-400 group-hover:text-indigo-600 transition-colors"
              />
              <h3 className="text-sm font-bold text-slate-800 tracking-tight group-hover:text-indigo-900 transition-colors">
                {t('world_codex_title', language)}
              </h3>
            </div>
            <ChevronRight
              size={16}
              className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0"
            />
          </button>

          <button
            onClick={() => {
              window.scrollTo(0, 0);
              onNavigate("wiki-item");
            }}
            className="text-left group bg-white border border-slate-200 p-5 rounded-lg hover:bg-slate-50/50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center justify-between min-h-[64px]"
          >
            <div className="flex items-center gap-3">
              <Package
                size={24}
                className="text-slate-400 group-hover:text-indigo-600 transition-colors"
              />
              <h3 className="text-sm font-bold text-slate-800 tracking-tight group-hover:text-indigo-900 transition-colors">
                {t("wiki_item_encyclopedia", language)}
              </h3>
            </div>
            <ChevronRight
              size={16}
              className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0"
            />
          </button>

          <button
            onClick={() => {
              window.scrollTo(0, 0);
              onNavigate("wiki-skill");
            }}
            className="text-left group bg-white border border-slate-200 p-5 rounded-lg hover:bg-slate-50/50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center justify-between min-h-[64px]"
          >
            <div className="flex items-center gap-3">
              <Zap
                size={24}
                className="text-slate-400 group-hover:text-indigo-600 transition-colors"
              />
              <h3 className="text-sm font-bold text-slate-800 tracking-tight group-hover:text-indigo-900 transition-colors">
                {t("wiki_skill_system", language)}
              </h3>
            </div>
            <ChevronRight
              size={16}
              className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0"
            />
          </button>
        </div>
      </div>

      {/* Help Popup */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] bg-black/50 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-white pt-2">
                <h3 className="text-lg font-bold text-slate-800">
                  {language === 'ko' ? '도움말' : 'Help'}
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={18} className="text-slate-500" />
                </button>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {helpSteps[helpStep]}
              </p>
              <div className="flex items-center justify-between">
                <button
                  disabled={helpStep === 0}
                  onClick={() => setHelpStep(helpStep - 1)}
                  className="p-1.5 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={18} className="text-slate-600" />
                </button>
                <span className="text-xs text-slate-400 font-medium">
                  {helpStep + 1} / {helpSteps.length}
                </span>
                <button
                  disabled={helpStep === helpSteps.length - 1}
                  onClick={() => setHelpStep(helpStep + 1)}
                  className="p-1.5 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={18} className="text-slate-600" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
