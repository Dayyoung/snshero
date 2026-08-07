import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, ChevronRight, ChevronLeft, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CARD_DATABASE } from '../cardDatabase';
import { CharacterRelationshipMap } from '../components/CharacterRelationshipMap';
import { PageHeader } from '../components/PageHeader';
import { CHARACTER_IP_PROFILES } from '../content/characterIp';
import { getAllFactions, getCardsByFaction, getCharacterIpProfile, getFactionDef } from '../content/characterIpUtils';
import { t } from '../lib/i18n';
import { getCardRarityRank } from '../lib/cardRarity';
import { cn, getFormattedCardName } from '../lib/utils';
import type { Language, ViewType, CharacterFaction, DatabaseCard } from '../types';

interface WorldCodexViewProps {
  onNavigate: (view: ViewType) => void;
  language: Language;
  currentSeason: string;
  lowSpecMode: boolean;
}

interface FactionSummary {
  faction: CharacterFaction;
  cards: DatabaseCard[];
  representativeCard: DatabaseCard | null;
  totalCards: number;
}

const rarityWeight = (rarity: string): number => {
  return getCardRarityRank(rarity);
};

const compareCards = (left: DatabaseCard, right: DatabaseCard): number => {
  const rarityDelta = rarityWeight(right.rarity) - rarityWeight(left.rarity);
  if (rarityDelta !== 0) return rarityDelta;
  const relationshipDelta = (right.id ? (CHARACTER_IP_PROFILES[right.id]?.relationshipIds.length ?? 0) : 0) - (left.id ? (CHARACTER_IP_PROFILES[left.id]?.relationshipIds.length ?? 0) : 0);
  if (relationshipDelta !== 0) return relationshipDelta;
  return left.id - right.id;
};

const storySummaryClass = 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm';

export const WorldCodexView: React.FC<WorldCodexViewProps> = ({ onNavigate, language, currentSeason, lowSpecMode }) => {
  const factionOrder = useMemo(() => getAllFactions(), []);
  const factionSummaries = useMemo<FactionSummary[]>(() => {
    return factionOrder.map((faction) => {
      const cards = getCardsByFaction(faction)
        .map((id) => CARD_DATABASE[id])
        .filter((card): card is DatabaseCard => Boolean(card))
        .sort(compareCards);
      return {
        faction,
        cards,
        representativeCard: cards[0] ?? null,
        totalCards: cards.length,
      };
    });
  }, [factionOrder]);

  const [selectedFaction, setSelectedFaction] = useState<CharacterFaction>(factionOrder[0] ?? 'human');
  const [selectedCardId, setSelectedCardId] = useState<number>(() => {
    const initialFaction = factionOrder[0] ?? 'human';
    const initial = factionSummaries.find((entry) => entry.faction === initialFaction)?.representativeCard;
    return initial?.id ?? 1;
  });

  const selectedFactionSummary = factionSummaries.find((entry) => entry.faction === selectedFaction) ?? factionSummaries[0];
  const selectedCard = selectedCardId ? CARD_DATABASE[selectedCardId] : undefined;
  const selectedProfile = selectedCard ? getCharacterIpProfile(selectedCard.id) : undefined;

  // Help popup state
  const [helpOpen, setHelpOpen] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (helpOpen) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [helpOpen]);

  const [helpStep, setHelpStep] = useState(0);

  const helpSlides = useMemo(() => [
    {
      title: t('world_codex_title', language),
      body: language === 'ko'
        ? '월드 코덱스는 SNS히어로 세계관의 모든 진영과 캐릭터 관계를 한눈에 볼 수 있는 정보 허브입니다. 진영 카드를 눌러 어떤 캐릭터들이 속해있는지 확인하고, 캐릭터 관계도를 통해 인물 간 연결을 탐험하세요.'
        : 'The World Codex is an information hub where you can explore all factions and character relationships in the SNSHero universe. Tap faction cards to see which characters belong to each faction, and use the relationship map to discover character connections.',
    },
    {
      title: language === 'ko' ? '추천 캐릭터' : 'Featured Characters',
      body: language === 'ko'
        ? '추천 캐릭터 섹션에서 주요 캐릭터 카드를 빠르게 확인할 수 있습니다. 카드 열기 버튼으로 상세 정보를 보거나, 웹툰으로 이동해 스토리를 감상하세요.'
        : 'Browse featured character cards in the recommended section. Use the card button to view details, or jump to the webtoon to enjoy the story.',
    },
    {
      title: language === 'ko' ? '시즌 허브' : 'Season Hub',
      body: language === 'ko'
        ? '시즌 허브로 이동하면 현재 시즌의 미션, 보상, 진행 상황을 확인할 수 있습니다.'
        : 'Navigate to the Season Hub to check current season missions, rewards, and progress.',
    },
  ], [language]);

  const conflictPairs = useMemo(() => {
    const counts = new Map<string, { left: CharacterFaction; right: CharacterFaction; count: number }>();
    Object.values(CHARACTER_IP_PROFILES).forEach((profile) => {
      profile.rivalIds.forEach((rivalId) => {
        const rivalProfile = CHARACTER_IP_PROFILES[rivalId];
        if (!rivalProfile) return;
        const pair = [profile.faction, rivalProfile.faction].sort() as [CharacterFaction, CharacterFaction];
        const key = `${pair[0]}-${pair[1]}`;
        const current = counts.get(key);
        if (current) {
          current.count += 1;
        } else {
          counts.set(key, { left: pair[0], right: pair[1], count: 1 });
        }
      });
    });

    const fallback: Array<{ left: CharacterFaction; right: CharacterFaction; count: number }> = [
      { left: 'water', right: 'fire', count: 1 },
      { left: 'wind', right: 'earth', count: 1 },
      { left: 'human', right: 'undead', count: 1 },
      { left: 'elf', right: 'monster', count: 1 },
    ];

    const pairs = Array.from(counts.values()).sort((left, right) => right.count - left.count);
    return pairs.length > 0 ? pairs.slice(0, 4) : fallback;
  }, []);

  const featuredStories = useMemo(() => {
    return factionSummaries
      .flatMap((entry) => entry.cards.slice(0, 1))
      .filter(Boolean)
      .sort(compareCards)
      .slice(0, 3);
  }, [factionSummaries]);

  const handleSelectFaction = (faction: CharacterFaction) => {
    setSelectedFaction(faction);
    const summary = factionSummaries.find((entry) => entry.faction === faction);
    if (summary) {
      // If currently selected card belongs to this faction, keep it
      const currentInFaction = summary.cards.find((c) => c.id === selectedCardId);
      if (!currentInFaction && summary.representativeCard) {
        setSelectedCardId(summary.representativeCard.id);
      }
    }
  };

  const openWorldCard = (cardId?: number) => {
    if (cardId) {
      sessionStorage.setItem('hero_wiki_target_card_id', String(cardId));
    }
    onNavigate('wiki-card');
  };

  const openWorldWebtoon = (cardId?: number) => {
    const targetId = cardId || selectedCardId;
    if (targetId) {
      sessionStorage.setItem('hero_webtoon_target_card_id', String(targetId));
    }
    onNavigate('webtoon');
  };
  const lowSpecCardClass = lowSpecMode ? '' : 'transition-all hover:-translate-y-0.5';

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_42%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <PageHeader title={t('world_codex_title', language)} onBack={() => onNavigate('home')} />
          <button
            type="button"
            onClick={() => { setHelpOpen(true); setHelpStep(0); }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 transition shrink-0"
            aria-label={language === 'ko' ? '도움말' : 'Help'}
          >
            <HelpCircle size={16} />
          </button>
        </div>

        <section className="mt-6">
          <div className={cn(storySummaryClass, 'flex flex-col justify-between bg-slate-950 text-white')}>
            <div>
              <h3 className="text-xl font-black tracking-tight">{selectedCard ? getFormattedCardName(selectedCard, language) : t('world_codex_title', language)}</h3>
              <p className="mt-2 text-sm leading-7 text-white/70">
                {selectedProfile ? t(selectedProfile.webtoonHookKey, language) : t('world_codex_subtitle', language)}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openWorldCard}
                className={cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black uppercase tracking-[0.24em] text-slate-950 shadow-sm', lowSpecCardClass)}
              >
                <BookOpen size={14} />
                {t('world_open_card', language)}
              </button>
              <button
                type="button"
                onClick={openWorldWebtoon}
                className={cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-[0.24em] text-white', lowSpecCardClass)}
              >
                <ArrowRight size={14} />
                {t('world_open_webtoon', language)}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur-sm sm:p-5">
          <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {factionSummaries.map((summary) => {
              const factionDef = getFactionDef(summary.faction);
              const isActive = summary.faction === selectedFaction;
              return (
                <button
                  key={summary.faction}
                  type="button"
                  onClick={() => handleSelectFaction(summary.faction)}
                  className={cn(
                    'rounded-3xl border p-4 text-left shadow-sm transition-colors',
                    isActive ? 'border-indigo-300 bg-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50',
                    lowSpecCardClass,
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]', factionDef ? 'bg-white' : 'bg-slate-50')}>
                      {factionDef ? t(factionDef.nameKey, language) : summary.faction}
                    </div>
                    <ChevronRight size={14} className={cn('shrink-0', isActive ? 'text-indigo-500' : 'text-slate-300')} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {summary.cards.slice(0, 3).map((card) => (
                      <span key={card.id} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                        {getFormattedCardName(card, language)}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {conflictPairs.map((pair) => {
              const leftDef = getFactionDef(pair.left);
              const rightDef = getFactionDef(pair.right);
              return (
                <button
                  key={`${pair.left}-${pair.right}`}
                  type="button"
                  onClick={() => handleSelectFaction(pair.left)}
                  className={cn('rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left shadow-sm', lowSpecCardClass)}
                >
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-700">{leftDef ? t(leftDef.nameKey, language) : pair.left}</span>
                    <ArrowRight size={14} className="text-slate-300" />
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-700">{rightDef ? t(rightDef.nameKey, language) : pair.right}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-6">
          <CharacterRelationshipMap
            selectedCardId={selectedCardId}
            language={language}
            lowSpecMode={lowSpecMode}
            onSelectCard={(cardId) => {
              setSelectedCardId(cardId);
              const card = CARD_DATABASE[cardId];
              if (card) {
                const profile = getCharacterIpProfile(cardId);
                if (profile) {
                  setSelectedFaction(profile.faction);
                }
              }
            }}
            onOpenCard={openWorldCard}
            onOpenWebtoon={openWorldWebtoon}
          />
        </div>

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mt-2 grid gap-3 md:grid-cols-3">
            {featuredStories.map((card) => {
              const profile = getCharacterIpProfile(card.id);
              const factionDef = profile ? getFactionDef(profile.faction) : undefined;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedCardId(card.id)}
                  className={cn('rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left shadow-sm', lowSpecCardClass)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                      {factionDef ? t(factionDef.nameKey, language) : t('world_factions', language)}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{String(card.id).padStart(3, '0')}</span>
                  </div>
                  <h4 className="mt-3 text-lg font-black uppercase tracking-tight text-slate-900">
                    {getFormattedCardName(card, language)}
                  </h4>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedCardId(card.id);
                        onNavigate('wiki-card');
                      }}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-[0.24em] text-white"
                    >
                      <ChevronRight size={14} />
                      {t('world_open_card', language)}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedCardId(card.id);
                        onNavigate('webtoon');
                      }}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-[0.24em] text-slate-700"
                    >
                      {t('world_open_webtoon', language)}
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Season Hub Entry */}
        <section className="mt-6">
          <button
            type="button"
            onClick={() => onNavigate('season-hub')}
            className={cn(
              'w-full rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-5 shadow-sm flex items-center gap-4',
              lowSpecMode ? '' : 'hover:border-indigo-300 hover:shadow-md active:scale-[0.99] transition-all',
            )}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/20">
              <BookOpen size={22} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-black text-slate-800">
                {t('season_hub_entry_title', language)}
              </p>
            </div>
            <ChevronRight size={20} className="text-indigo-400 flex-shrink-0" />
          </button>
        </section>
      </div>

      {/* Help Popup */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setHelpOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 mb-4 sticky top-0 z-10 bg-white pt-2">
                <h3 className="text-lg font-black text-slate-900">{helpSlides[helpStep].title}</h3>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 transition shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4 whitespace-pre-line">{helpSlides[helpStep].body}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{helpStep + 1}/{helpSlides.length}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={helpStep === 0}
                    onClick={() => setHelpStep((s) => s - 1)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold transition',
                      helpStep === 0
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-600 hover:bg-slate-50 active:scale-95',
                    )}
                  >
                    <ChevronLeft size={14} />
                    {language === 'ko' ? '이전' : 'Prev'}
                  </button>
                  {helpStep < helpSlides.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setHelpStep((s) => s + 1)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition"
                    >
                      {language === 'ko' ? '다음' : 'Next'}
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setHelpOpen(false)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition"
                    >
                      {language === 'ko' ? '닫기' : 'Close'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
