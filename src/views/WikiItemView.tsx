import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Language } from "../types";
import { ITEM_DATABASE } from "../constants/itemDatabase";
import { ItemIcon } from "../components/ItemIcon";
import { t } from "../lib/i18n";
import { PageHeader } from '../components/PageHeader';

interface WikiItemViewProps {
  onNavigate: (view: any) => void;
  language: Language;
}

const HELP_SLIDES = [
  {
    title: "Item Encyclopedia",
    text: "Browse all 110 equippable items. Use the search bar to filter by name, rarity, or slot type.",
  },
  {
    title: "Obtaining Items",
    text: "Items drop randomly after battles. Rarer items have lower drop rates but stronger stat bonuses.",
  },
  {
    title: "Equipping Items",
    text: "Head to your Deck and assign items to hero cards to boost their directional stats in battle.",
  },
];

export const WikiItemView: React.FC<WikiItemViewProps> = ({
  onNavigate,
  language,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredItems = ITEM_DATABASE.filter(
    (i) =>
      (language === 'ko' ? i.name_ko : i.name_en).toLowerCase().includes(searchTerm.toLowerCase()) ||
      t(`rarity_${i.rarity}` as any, language).toLowerCase().includes(searchTerm.toLowerCase()) ||
      t(`slot_${i.slot}` as any, language).toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen app-bg text-slate-800 font-sans pb-32 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-6">
        <PageHeader title={t('wiki_item_title', language)} onBack={() => onNavigate('home')} />

        <div className="flex flex-wrap items-center gap-3 mt-6 mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-slate-900">
            {t('wiki_item_encyclopedia', language)}
          </h1>
          <button
            type="button"
            onClick={() => { setShowHelp(true); setHelpStep(0); }}
            className="rounded-full border border-slate-300 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Help"
          >
            <HelpCircle size={18} />
          </button>
          <div className="relative w-full md:w-64 md:ml-auto">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder={t('wiki_search_items', language)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/85 rounded-lg text-xs font-medium placeholder:opacity-50 focus:outline-none focus:border-indigo-500 shadow-sm focus:shadow-md transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-slate-100 bg-white shadow-sm flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
                <ItemIcon
                  imageIndex={item.imageIndex}
                  size={36}
                />
              </div>
              <h5 className="text-sm font-bold truncate leading-tight text-slate-800">
                {language === 'ko' ? item.name_ko : item.name_en}
              </h5>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm font-semibold opacity-50 uppercase tracking-widest text-slate-500">
              {t('wiki_no_items_match', language)}
            </div>
          )}
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
