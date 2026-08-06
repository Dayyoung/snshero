import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Language } from "../types";
import { t } from "../lib/i18n";
import { PageHeader } from '../components/PageHeader';

interface WikiHowToPlayViewProps {
  onNavigate: (view: any) => void;
  language: Language;
}

const howToPlayHelpSteps = (lang: Language) => [
  t("wiki_how_to_play_1", lang),
  t("wiki_how_to_play_2", lang),
  t("wiki_how_to_play_3", lang),
];

export const WikiHowToPlayView: React.FC<WikiHowToPlayViewProps> = ({
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
  const helpSteps = howToPlayHelpSteps(language);

  return (
    <div className="min-h-screen app-bg text-slate-800 font-sans pb-32 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-6">
        <PageHeader title={t('wiki_howtoplay_title', language)} onBack={() => onNavigate('home')} />

        {/* Title + Help Button */}
        <div className="flex items-center gap-3 mt-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-slate-900">
            {t("wiki_how_to_play", language)}
          </h1>
          <button
            onClick={() => { setShowHelp(true); setHelpStep(0); }}
            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
            aria-label="Help"
          >
            <HelpCircle size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Minimal sections - just headers */}
        <div className="space-y-4 mt-8">
          <section className="bg-white border border-slate-100 p-5 rounded-lg shadow-sm">
            <h2 className="text-base font-bold text-indigo-600 mb-3">
              {language === "ko" ? "기본 규칙" : "Basic Rules"}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("wiki_how_to_play_1", language)}
            </p>
          </section>

          <section className="bg-white border border-slate-100 p-5 rounded-lg shadow-sm">
            <h2 className="text-base font-bold text-indigo-600 mb-3">
              {language === "ko" ? "스탯 & 캡처 규칙" : "Stats & Capture Rule"}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("wiki_how_to_play_2", language)}
            </p>
          </section>

          <section className="bg-white border border-slate-100 p-5 rounded-lg shadow-sm">
            <h2 className="text-base font-bold text-indigo-600 mb-3">
              {language === "ko" ? "승리 조건" : "Victory Condition"}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("wiki_how_to_play_3", language)}
            </p>
          </section>
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
                  {language === 'ko' ? '게임 방법' : 'How to Play'}
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
