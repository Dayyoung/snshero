import React, { useMemo } from 'react';
import { ArrowRight, BadgeInfo, ChevronRight, Users, Swords } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { getAllyIds, getRelatedCharacters, getRivalIds, getCharacterIpProfile, getFactionDef } from '../content/characterIpUtils';
import { t } from '../lib/i18n';
import { cn, getFormattedCardName } from '../lib/utils';
import type { DatabaseCard, Language } from '../types';

interface CharacterRelationshipMapProps {
  selectedCardId: number;
  language: Language;
  lowSpecMode: boolean;
  onSelectCard: (cardId: number) => void;
  onOpenCard: (cardId: number) => void;
  onOpenWebtoon: (cardId: number) => void;
}

interface MiniCardProps {
  card: DatabaseCard;
  relationLabel: string;
  language: Language;
  lowSpecMode: boolean;
  onClick: (cardId: number) => void;
}

const rarityBadgeClass = (rarity: string): string => {
  const normalized = rarity.toLowerCase();
  if (normalized === 'legendary') return 'bg-fuchsia-500 text-white border-fuchsia-300';
  if (normalized === 'gold') return 'bg-amber-400 text-amber-950 border-amber-200';
  if (normalized === 'silver' || normalized === 'magic') return 'bg-slate-300 text-slate-900 border-slate-200';
  return 'bg-orange-200 text-orange-950 border-orange-100';
};

const factionBadgeClass = (faction: string): string => {
  const normalized = faction.toLowerCase();
  const classes: Record<string, string> = {
    water: 'bg-sky-50 text-sky-700 border-sky-200',
    fire: 'bg-red-50 text-red-700 border-red-200',
    wind: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    earth: 'bg-lime-50 text-lime-700 border-lime-200',
    human: 'bg-amber-50 text-amber-700 border-amber-200',
    undead: 'bg-violet-50 text-violet-700 border-violet-200',
    elf: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dwarf: 'bg-orange-50 text-orange-700 border-orange-200',
    monster: 'bg-green-50 text-green-700 border-green-200',
    robot: 'bg-slate-50 text-slate-700 border-slate-200',
    dragon: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return classes[normalized] ?? 'bg-slate-50 text-slate-700 border-slate-200';
};

const MiniCard: React.FC<MiniCardProps> = ({ card, relationLabel, language, lowSpecMode, onClick }) => {
  const profile = getCharacterIpProfile(card.id);
  const cardName = getFormattedCardName(card, language);
  const relationHover = lowSpecMode ? '' : 'transition-transform hover:-translate-y-0.5';

  return (
    <button
      type="button"
      onClick={() => onClick(card.id)}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors hover:border-indigo-300 hover:shadow-md active:scale-[0.99]',
        relationHover,
      )}
    >
      <div className={cn('flex h-14 w-12 shrink-0 items-center justify-center rounded-xl border text-[9px] font-black uppercase tracking-[0.28em]', rarityBadgeClass(card.rarity))}>
        {String(card.id).padStart(3, '0')}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs font-extrabold uppercase tracking-tight text-slate-900">{cardName}</span>
          <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.24em]', factionBadgeClass(profile?.faction ?? 'human'))}>
            {relationLabel}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-slate-500">
          {profile ? t(profile.signatureLineKey, language) : ''}
        </p>
      </div>
    </button>
  );
};

const SectionTitle: React.FC<{ label: string; icon: React.ReactNode; subtitle?: string }> = ({ label, icon, subtitle }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-400">{label}</p>
      {subtitle && <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500">{subtitle}</p>}
    </div>
  </div>
);

export const CharacterRelationshipMap: React.FC<CharacterRelationshipMapProps> = ({
  selectedCardId,
  language,
  lowSpecMode,
  onSelectCard,
  onOpenCard,
  onOpenWebtoon,
}) => {
  const selectedCard = CARD_DATABASE[selectedCardId];
  const profile = getCharacterIpProfile(selectedCardId);
  const factionDef = profile ? getFactionDef(profile.faction) : undefined;
  const allyCards = useMemo(
    () => getAllyIds(selectedCardId).map((id) => CARD_DATABASE[id]).filter((card): card is DatabaseCard => Boolean(card)),
    [selectedCardId],
  );
  const rivalCards = useMemo(
    () => getRivalIds(selectedCardId).map((id) => CARD_DATABASE[id]).filter((card): card is DatabaseCard => Boolean(card)),
    [selectedCardId],
  );
  const relatedCards = useMemo(
    () => getRelatedCharacters(selectedCardId).map((id) => CARD_DATABASE[id]).filter((card): card is DatabaseCard => Boolean(card)),
    [selectedCardId],
  );
  const selectedName = selectedCard ? getFormattedCardName(selectedCard, language) : `Card ${selectedCardId}`;
  const relationCount = allyCards.length + rivalCards.length + relatedCards.length;

  const sideCardClass = lowSpecMode ? 'transition-none' : 'transition-all hover:-translate-y-0.5';

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle
          label={t('world_relationships', language)}
          icon={<Users size={18} />}
          subtitle={profile ? t(profile.signatureLineKey, language) : undefined}
        />
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          <BadgeInfo size={14} />
          <span>{relationCount} {t('world_links', language)}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
            <Swords size={14} />
            <span>{t('wiki_card_detail_relationship_ally', language)}</span>
          </div>
          {allyCards.length > 0 ? (
            allyCards.map((card) => (
              <MiniCard
                key={`ally-${card.id}`}
                card={card}
                relationLabel={t('wiki_card_detail_relationship_ally', language)}
                language={language}
                lowSpecMode={lowSpecMode}
                onClick={onSelectCard}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">
              {t('no_data', language)}
            </div>
          )}
        </div>

        <div className={cn('rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 p-4 text-white shadow-xl', sideCardClass)}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em]', rarityBadgeClass(selectedCard?.rarity ?? 'bronze'))}>
              {selectedCard ? t(`rarity_${selectedCard.rarity}`, language) : '—'}
            </span>
            {factionDef && (
              <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em]', factionBadgeClass(profile?.faction ?? 'human'))}>
                {t(factionDef.nameKey, language)}
              </span>
            )}
          </div>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/50">{t('world_codex_title', language)}</p>
              <h3 className="mt-2 truncate text-2xl font-black uppercase tracking-tight sm:text-3xl">{selectedName}</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-white/70">
                {profile ? t(profile.webtoonHookKey, language) : t('world_codex_subtitle', language)}
              </p>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-xs font-black uppercase tracking-[0.3em] text-white/70">
              {String(selectedCardId).padStart(3, '0')}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/45">{t('wiki_card_detail_faction', language)}</p>
              <p className="mt-2 text-sm font-bold text-white">{factionDef ? t(factionDef.nameKey, language) : '—'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/45">{t('wiki_card_detail_signature_line', language)}</p>
              <p className="mt-2 line-clamp-2 text-sm font-bold text-white/90">{profile ? t(profile.signatureLineKey, language) : '—'}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onOpenCard(selectedCardId)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black uppercase tracking-[0.24em] text-slate-950 transition-all hover:bg-slate-100 active:scale-95"
            >
              <ChevronRight size={14} />
              {t('world_open_card', language)}
            </button>
            <button
              type="button"
              onClick={() => onOpenWebtoon(selectedCardId)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-[0.24em] text-white transition-all hover:bg-white/15 active:scale-95"
            >
              <ArrowRight size={14} />
              {t('world_open_webtoon', language)}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
            <Swords size={14} />
            <span>{t('wiki_card_detail_relationship_rival', language)}</span>
          </div>
          {rivalCards.length > 0 ? (
            rivalCards.map((card) => (
              <MiniCard
                key={`rival-${card.id}`}
                card={card}
                relationLabel={t('wiki_card_detail_relationship_rival', language)}
                language={language}
                lowSpecMode={lowSpecMode}
                onClick={onSelectCard}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">
              {t('no_data', language)}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
          <ChevronRight size={14} />
          <span>{t('wiki_card_detail_relationship_related', language)}</span>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {relatedCards.map((card) => (
            <MiniCard
              key={`related-${card.id}`}
              card={card}
              relationLabel={t('wiki_card_detail_relationship_related', language)}
              language={language}
              lowSpecMode={lowSpecMode}
              onClick={onSelectCard}
            />
          ))}
          {relatedCards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">
              {t('no_data', language)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
