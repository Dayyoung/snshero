import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  ChevronRight,
  Coins,
  HelpCircle,
  Lightbulb,
  Search,
  Shield,
  Sparkles,
  Swords,
  X,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';
import { Language, ViewType } from '../types';
import { t } from '../lib/i18n';
import { PageHeader } from '../components/PageHeader';
import { CARD_DATABASE } from '../cardDatabase';

interface WikiTipViewProps {
  onNavigate: (view: ViewType) => void;
  language: Language;
}

interface StrategyLink {
  labelKey: string;
  type: 'card' | 'view';
  cardId?: number;
  view?: ViewType;
}

interface StrategyChapter {
  id: string;
  icon: LucideIcon;
  titleKey: string;
  summaryKey: string;
  bulletKeys: [string, string, string];
  links: StrategyLink[];
}

const STRATEGY_CHAPTERS: StrategyChapter[] = [
  {
    id: 'quickstart',
    icon: Lightbulb,
    titleKey: 'wiki_strategy_chapter_quickstart_title',
    summaryKey: 'wiki_strategy_chapter_quickstart_summary',
    bulletKeys: [
      'wiki_strategy_chapter_quickstart_point_1',
      'wiki_strategy_chapter_quickstart_point_2',
      'wiki_strategy_chapter_quickstart_point_3',
    ],
    links: [
      { labelKey: 'wiki_strategy_link_open_deck', type: 'view', view: 'mydeck' },
      { labelKey: 'wiki_strategy_link_open_battle', type: 'view', view: 'play' },
      { labelKey: 'wiki_strategy_link_open_card_poseidon', type: 'card', cardId: 10 },
    ],
  },
  {
    id: 'deck',
    icon: BookOpen,
    titleKey: 'wiki_strategy_chapter_deck_title',
    summaryKey: 'wiki_strategy_chapter_deck_summary',
    bulletKeys: [
      'wiki_strategy_chapter_deck_point_1',
      'wiki_strategy_chapter_deck_point_2',
      'wiki_strategy_chapter_deck_point_3',
    ],
    links: [
      { labelKey: 'wiki_strategy_link_open_deck', type: 'view', view: 'mydeck' },
      { labelKey: 'wiki_strategy_link_open_card_phoenix', type: 'card', cardId: 19 },
      { labelKey: 'wiki_strategy_link_open_card_gale', type: 'card', cardId: 27 },
    ],
  },
  {
    id: 'matchups',
    icon: Shield,
    titleKey: 'wiki_strategy_chapter_matchup_title',
    summaryKey: 'wiki_strategy_chapter_matchup_summary',
    bulletKeys: [
      'wiki_strategy_chapter_matchup_point_1',
      'wiki_strategy_chapter_matchup_point_2',
      'wiki_strategy_chapter_matchup_point_3',
    ],
    links: [
      { labelKey: 'wiki_strategy_link_open_world_codex', type: 'view', view: 'world-codex' },
      { labelKey: 'wiki_strategy_link_open_card_poseidon', type: 'card', cardId: 10 },
      { labelKey: 'wiki_strategy_link_open_card_phoenix', type: 'card', cardId: 19 },
    ],
  },
  {
    id: 'battle',
    icon: Swords,
    titleKey: 'wiki_strategy_chapter_battle_title',
    summaryKey: 'wiki_strategy_chapter_battle_summary',
    bulletKeys: [
      'wiki_strategy_chapter_battle_point_1',
      'wiki_strategy_chapter_battle_point_2',
      'wiki_strategy_chapter_battle_point_3',
    ],
    links: [
      { labelKey: 'wiki_strategy_link_open_battle', type: 'view', view: 'play' },
      { labelKey: 'wiki_strategy_link_open_card_octopus', type: 'card', cardId: 9 },
      { labelKey: 'wiki_strategy_link_open_card_ignisius', type: 'card', cardId: 20 },
    ],
  },
  {
    id: 'economy',
    icon: Coins,
    titleKey: 'wiki_strategy_chapter_economy_title',
    summaryKey: 'wiki_strategy_chapter_economy_summary',
    bulletKeys: [
      'wiki_strategy_chapter_economy_point_1',
      'wiki_strategy_chapter_economy_point_2',
      'wiki_strategy_chapter_economy_point_3',
    ],
    links: [
      { labelKey: 'wiki_strategy_link_open_season_hub', type: 'view', view: 'season-hub' },
      { labelKey: 'wiki_strategy_link_open_event', type: 'view', view: 'event' },
      { labelKey: 'wiki_strategy_link_open_shop', type: 'view', view: 'shop' },
    ],
  },
  {
    id: 'webtoon',
    icon: Sparkles,
    titleKey: 'wiki_strategy_chapter_webtoon_title',
    summaryKey: 'wiki_strategy_chapter_webtoon_summary',
    bulletKeys: [
      'wiki_strategy_chapter_webtoon_point_1',
      'wiki_strategy_chapter_webtoon_point_2',
      'wiki_strategy_chapter_webtoon_point_3',
    ],
    links: [
      { labelKey: 'wiki_strategy_link_open_webtoon', type: 'view', view: 'webtoon' },
      { labelKey: 'wiki_strategy_link_open_season_hub', type: 'view', view: 'season-hub' },
      { labelKey: 'wiki_strategy_link_open_card_library', type: 'view', view: 'wiki-card' },
    ],
  },
];

const HELP_SLIDES = [
  {
    title: "Strategy Tips",
    text: "Master SNSHero with proven tactics — corner placement, baiting, deck building, and matchup knowledge.",
  },
  {
    title: "Corner Placement",
    text: "Place cards with strong stats facing inward. Corners protect 2 sides — use this to hide weak stats against the board edge.",
  },
  {
    title: "Bait & Counter",
    text: "Leave a medium-stat card exposed to bait the opponent's capture, then use a stronger card to recapture both on the next turn.",
  },
];

export const WikiTipView: React.FC<WikiTipViewProps> = ({ onNavigate, language }) => {
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredChapters = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return STRATEGY_CHAPTERS;

    return STRATEGY_CHAPTERS.filter((chapter) => {
      const chapterText = [
        t(chapter.titleKey, language),
        t(chapter.summaryKey, language),
        ...chapter.bulletKeys.map((key) => t(key, language)),
      ]
        .join(' ')
        .toLowerCase();

      return chapterText.includes(normalizedSearch);
    });
  }, [language, searchTerm]);

  const openCardDeepLink = (cardId: number) => {
    if (typeof window !== 'undefined') {
      const url = new URL('/wiki/card', window.location.origin);
      url.searchParams.set('cardId', String(cardId));
      window.history.pushState({}, '', `${url.pathname}${url.search}`);
      window.dispatchEvent(new Event('snshero:meta-refresh'));
    }

    window.scrollTo(0, 0);
    onNavigate('wiki-card');
  };

  const handleOpenLink = (link: StrategyLink) => {
    if (link.type === 'card' && typeof link.cardId === 'number') {
      openCardDeepLink(link.cardId);
      return;
    }

    if (link.type === 'view' && link.view) {
      window.scrollTo(0, 0);
      onNavigate(link.view);
    }
  };

  return (
    <div className="min-h-screen app-bg text-slate-800 font-sans pb-32 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-6">
        <PageHeader title={t('wiki_tip_title', language)} onBack={() => onNavigate('home')} />

        <div className="flex flex-wrap items-center gap-3 mt-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-slate-900">
            {t('wiki_strategy_title', language)}
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
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t('wiki_strategy_search_placeholder', language)}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-indigo-300"
            />
          </div>
        </div>

        <div className="space-y-6">
          {filteredChapters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <p className="text-base font-bold text-slate-800">{t('wiki_strategy_no_results_title', language)}</p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                {t('wiki_strategy_no_results_desc', language)}
              </p>
            </div>
          ) : (
            filteredChapters.map((chapter) => {
              const Icon = chapter.icon;

              return (
                <section
                  key={chapter.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Icon size={20} className="text-indigo-600 shrink-0" />
                    <h2 className="text-base font-bold uppercase tracking-tight text-slate-800">
                      {t(chapter.titleKey, language)}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-5">
                    {chapter.bulletKeys.map((key) => (
                      <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-medium leading-relaxed text-slate-700">{t(key, language)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {chapter.links.map((link) => {
                      const cardName =
                        link.type === 'card' && typeof link.cardId === 'number'
                          ? language === 'ko'
                            ? CARD_DATABASE[link.cardId]?.title || `#${link.cardId}`
                            : CARD_DATABASE[link.cardId]?.title_dis || CARD_DATABASE[link.cardId]?.title_en || `#${link.cardId}`
                          : null;

                      return (
                        <button
                          key={`${chapter.id}-${link.labelKey}`}
                          type="button"
                          onClick={() => handleOpenLink(link)}
                          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95"
                        >
                          <span>
                            {link.type === 'card' && cardName
                              ? t(link.labelKey, language, { cardName })
                              : t(link.labelKey, language)}
                          </span>
                          <ChevronRight size={14} />
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })
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
