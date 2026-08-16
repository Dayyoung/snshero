import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Camera, BookOpen, ChevronDown, ChevronUp, Copy, Download, Image as ImageIcon, Info, Palette, Printer, QrCode, Quote, Share2, Shirt, ShoppingBag, Sparkles, Users, X, Swords, Lock, Unlock, MapPin, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { CARD_DATABASE } from '../cardDatabase';
import { useCardLock } from '../hooks/useCardLock';
import { buildCardShareTemplate } from '../content/cardShare';
import { getCharacterArtPrompt } from '../content/characterArtPrompts';
import { getCharacterIpProfile, getFactionDef, getRelatedCharacters, getAllyIds, getRivalIds } from '../content/characterIpUtils';
import { getRecommendedIpMerchProducts } from '../content/ipProducts';
import { t } from '../lib/i18n';
import { cn, getFormattedCardName, getAssetUrl, getCardSpriteStyle, isSpriteSheet } from '../lib/utils';
import { SkinSelector } from './SkinSelector';
import { resolveCardImage } from '../content/cardImageVariants';
import { useGameSettings } from '../contexts/GameSettingsContext';
import { CardItem } from './CardItem';
import type { CardSkin } from '../content/cardSkins';
import type { DatabaseCard, Language, ViewType, CardData } from '../types';

interface WikiCardDetailModalProps {
  selectedCard: DatabaseCard;
  language: Language;
  lowSpecMode: boolean;
  initialTab?: DetailTab;
  onClose: () => void;
  onNavigate: (view: ViewType) => void;
  onSelectCard: (card: DatabaseCard) => void;
  onOpenViewer: () => void;
  onPrintCard: () => void;
  onDownloadCard: (mode: 'ally' | 'enemy') => void;
  onOpenShareTemplate?: () => void;
  /** 스킨 관련 */
  season: string;
  availableSkins: CardSkin[];
  isSkinUnlocked: (skinKey: string) => boolean;
  isSkinActive: (cardId: number, skinKey: string) => boolean;
  onApplySkin: (cardId: number, skinKey: string) => void;
  onRemoveSkin: (cardId: number) => void;
}

type DetailTab = 'art' | 'info' | 'story' | 'relations' | 'skins' | 'share';

const TAB_CONFIG: Array<{ key: DetailTab; icon: React.ComponentType<{ size?: number; className?: string }>; }> = [
  { key: 'art', icon: Palette },
  { key: 'info', icon: Info },
  { key: 'story', icon: Quote },
  { key: 'relations', icon: Users },
  { key: 'skins', icon: Shirt },
  { key: 'share', icon: Share2 },
];

const rarityBadgeClass = (rarity: string): string => {
  const normalized = rarity.toLowerCase();
  if (normalized === 'legendary') return 'bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white border-fuchsia-300';
  if (normalized === 'gold') return 'bg-gradient-to-r from-yellow-500 to-amber-600 text-yellow-950 border-yellow-300';
  if (normalized === 'silver' || normalized === 'magic') return 'bg-gradient-to-r from-slate-400 to-slate-600 text-white border-slate-200';
  return 'bg-gradient-to-r from-amber-600 to-amber-800 text-white border-amber-400';
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

const relationTitleKey = (relation: 'ally' | 'rival' | 'related', language: Language): string => {
  if (relation === 'ally') return t('wiki_card_detail_relationship_ally', language);
  if (relation === 'rival') return t('wiki_card_detail_relationship_rival', language);
  return t('wiki_card_detail_relationship_related', language);
};

const formatElementLabel = (card: DatabaseCard): string => {
  if (!card.element) return '—';
  return card.element.toUpperCase();
};

const buildPreviewImageStyle = (card: DatabaseCard): React.CSSProperties | undefined => {
  if (card.imageUrl) return undefined;
  return getCardSpriteStyle(Number(card.id));
};

export const WikiCardDetailModal: React.FC<WikiCardDetailModalProps> = ({
  selectedCard,
  language,
  lowSpecMode,
  initialTab = 'art',
  onClose,
  onNavigate,
  onSelectCard,
  onOpenViewer,
  onPrintCard,
  onDownloadCard,
  onOpenShareTemplate,
  season,
  availableSkins,
  isSkinUnlocked,
  isSkinActive,
  onApplySkin,
  onRemoveSkin,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>(initialTab);
  const [storyExpanded, setStoryExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { cardSkinTheme } = useGameSettings();
  const resolvedImg = useMemo(
    () => resolveCardImage(selectedCard.id, { imageUrl: selectedCard.imageUrl, cardSkinTheme }),
    [selectedCard.id, selectedCard.imageUrl, cardSkinTheme],
  );

  const profile = getCharacterIpProfile(selectedCard.id);
  const factionDef = profile ? getFactionDef(profile.faction) : undefined;
  const shareTemplate = useMemo(() => buildCardShareTemplate(selectedCard.id, language), [language, selectedCard.id]);
  const artPrompt = useMemo(() => getCharacterArtPrompt(selectedCard.id), [selectedCard.id]);

  const relatedIds = useMemo(() => {
    const baseIds = profile ? [
      ...getRelatedCharacters(selectedCard.id),
      ...getAllyIds(selectedCard.id),
      ...getRivalIds(selectedCard.id),
    ] : [];
    return Array.from(new Set(baseIds)).filter((id) => id !== selectedCard.id);
  }, [profile, selectedCard.id]);

  const relatedCards = useMemo(
    () => relatedIds.map((id) => CARD_DATABASE[id]).filter((card): card is DatabaseCard => Boolean(card)),
    [relatedIds],
  );
  const { isLocked, toggleLock } = useCardLock();
  const locked = isLocked(selectedCard.id);

  const merchRecommendations = useMemo(
    () => getRecommendedIpMerchProducts(selectedCard.id, season).slice(0, 3),
    [season, selectedCard.id],
  );

  useEffect(() => {
    setActiveTab(initialTab);
    setStoryExpanded(false);
    setToastMessage(null);
  }, [initialTab, selectedCard.id]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToastMessage(t('wiki_card_detail_copy_success', language));
    } catch {
      setToastMessage(t('wiki_card_detail_copy_failed', language));
    }
  };

  const handleOpenRecommendedMerch = (productId: string, cardId: number) => {
    if (typeof window !== 'undefined') {
      const url = new URL('/shop', window.location.origin);
      url.searchParams.set('merchProductId', productId);
      url.searchParams.set('merchCardId', String(cardId));
      window.history.pushState({}, '', `${url.pathname}${url.search}`);
    }

    onNavigate('shop');
  };

  const cardName = getFormattedCardName(selectedCard, language);
  const factionLabel = profile ? factionDef ? t(factionDef.nameKey, language) : profile.faction : '—';
  const rarityLabel = t(`rarity_${selectedCard.rarity}`, language);
  const showCopyButtons = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost'
    || localStorage.getItem('hero_test_mode') === 'true'
    || localStorage.getItem('hero_admin_authenticated') === 'true'
  );
  const modalMotion = lowSpecMode
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
    : { initial: { opacity: 0, scale: 0.96, y: 12 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.96, y: 12 }, transition: { duration: 0.18 } };

  const renderMiniCard = (card: DatabaseCard, relation: 'ally' | 'rival' | 'related') => {
    const relatedProfile = getCharacterIpProfile(card.id);
    return (
      <button
        key={`${relation}-${card.id}`}
        type="button"
        onClick={() => onSelectCard(card)}
        className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md active:scale-[0.99] cursor-pointer"
      >
        <div className={cn('flex h-14 w-12 shrink-0 items-center justify-center rounded-xl border text-[9px] font-black uppercase tracking-[0.28em]', rarityBadgeClass(card.rarity))}>
          {String(card.id).padStart(3, '0')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-xs font-extrabold uppercase tracking-tight text-slate-900">
              {getFormattedCardName(card, language)}
            </span>
            <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.24em] text-slate-500">
              {relationTitleKey(relation, language)}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-slate-500">
            {relatedProfile ? t(relatedProfile.signatureLineKey, language) : ''}
          </p>
        </div>
      </button>
    );
  };

  return (
    <motion.div
      {...modalMotion}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-md sm:p-4"
      onClick={onClose}
    >
      <motion.div
        {...modalMotion}
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-5 py-4 text-white sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em]', rarityBadgeClass(selectedCard.rarity))}>
                {rarityLabel}
              </span>
              {factionDef && (
                <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em]', factionBadgeClass(profile?.faction ?? 'human'))}>
                  {factionLabel}
                </span>
              )}
            </div>
            <h2 className="mt-2 truncate text-2xl font-black uppercase tracking-tight sm:text-3xl">
              {cardName}
            </h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/65">
              ID_{String(selectedCard.id).padStart(3, '0')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nowLocked = toggleLock(selectedCard.id);
                setToastMessage(nowLocked 
                  ? (language === 'ko' ? '카드 잠금 설정 완료! (분해/재료 보호)' : 'Card Locked! (Protected from disassemble)')
                  : (language === 'ko' ? '카드 잠금 해제' : 'Card Unlocked')
                );
              }}
              className={cn(
                "inline-flex h-11 px-3.5 items-center justify-center gap-1.5 rounded-full border text-xs font-black uppercase tracking-wider transition-all active:scale-95",
                locked 
                  ? "border-amber-400 bg-amber-400/20 text-amber-300 shadow-sm"
                  : "border-white/15 bg-white/10 text-white/70 hover:bg-white/15"
              )}
              title={locked ? "Unlock Card" : "Lock Card"}
            >
              {locked ? <Lock size={15} className="text-amber-300" /> : <Unlock size={15} />}
              <span>{locked ? (language === 'ko' ? '잠김' : 'LOCKED') : (language === 'ko' ? '잠금' : 'LOCK')}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('webtoon')}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-xs font-black uppercase tracking-[0.24em] text-white transition-colors hover:bg-white/15 active:scale-95"
            >
              <BookOpen size={14} />
              {t('world_open_webtoon', language)}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/15 active:scale-95"
              aria-label={t('close', language)}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-white px-2 sm:px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
            {TAB_CONFIG.map(({ key: tabKey, icon: TabIcon }) => {
              const label = t(
                tabKey === 'info'
                  ? 'wiki_card_detail_tab_info'
                  : tabKey === 'story'
                    ? 'wiki_card_detail_tab_story'
                    : tabKey === 'relations'
                      ? 'wiki_card_detail_tab_relations'
                      : tabKey === 'art'
                        ? 'wiki_card_detail_tab_art'
                        : tabKey === 'skins'
                          ? 'wiki_card_detail_tab_skins'
                          : 'wiki_card_detail_tab_share',
                language,
              );
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setActiveTab(tabKey)}
                  className={cn(
                    'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.24em] transition-all active:scale-95',
                    isActive
                      ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-white',
                  )}
                >
                  <TabIcon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 sm:px-6">
          {activeTab === 'info' && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h3 className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                      {t('wiki_overview', language)}
                    </h3>
                    <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]', rarityBadgeClass(selectedCard.rarity))}>
                      {rarityLabel}
                    </span>
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                      {/* 카드 실물 아트 비주얼 */}
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <div className="w-44 sm:w-48 aspect-[3/4] drop-shadow-lg transition-transform hover:scale-105">
                          <CardItem
                            card={selectedCard as unknown as CardData}
                            language={language}
                            lowSpecMode={lowSpecMode}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={onOpenViewer}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm mt-1"
                        >
                          <Camera size={12} />
                          {t('wiki_card_detail_3d_view', language)}
                        </button>
                      </div>

                      <div className="flex-1 min-w-0 space-y-4 w-full">
                        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-3 text-white shadow-md">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.24em] text-white/60">
                            <span>{t('wiki_card_detail_signature_line', language)}</span>
                            <span>ID_{String(selectedCard.id).padStart(3, '0')}</span>
                          </div>
                          <p className="mt-2 text-sm font-bold leading-relaxed text-white">
                            {profile ? t(profile.signatureLineKey, language) : '—'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <StatChip label="N" value={selectedCard.stats[0]} />
                          <StatChip label="E" value={selectedCard.stats[1]} />
                          <StatChip label="S" value={selectedCard.stats[2]} />
                          <StatChip label="W" value={selectedCard.stats[3]} />
                        </div>

                        <div className="space-y-2">
                          <DetailRow label={t('wiki_card_detail_faction', language)} value={factionLabel} badgeClass={profile ? factionBadgeClass(profile.faction) : undefined} />
                          <DetailRow label={t('wiki_card_detail_personality', language)} value={profile?.personality ?? '—'} />
                          <DetailRow label={t('wiki_card_detail_role', language)} value={profile?.archetype ?? '—'} />
                          <DetailRow label={t('wiki_card_detail_element', language)} value={formatElementLabel(selectedCard)} />
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                              <Sparkles size={12} />
                              <span>{t('ability_types', language)}</span>
                            </div>
                            <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-700">
                              {selectedCard.ability
                                ? (language === 'ko' ? selectedCard.ability.description_ko : selectedCard.ability.description_en)
                                : '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Item 77: Acquisition Source Guide & Go Now Button */}
                <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white shadow-sm p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-indigo-600" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900">
                        {language === 'ko' ? '📍 카드 획득처 정보' : '📍 Acquisition Source'}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Story Stage Location */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                      <div>
                        <span className="font-bold text-slate-800 block">
                          {language === 'ko' ? `스토리 모드 Act 0${(selectedCard.id % 3) + 1} Step 0${(selectedCard.id % 5) + 1}` : `Story Mode Act 0${(selectedCard.id % 3) + 1} Step 0${(selectedCard.id % 5) + 1}`}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {language === 'ko' ? '클리어 시 일정 확률로 드랍' : 'Random drop upon stage clear'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigate('play');
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-[10px] rounded-xl flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                      >
                        <span>{language === 'ko' ? '스토리 바로가기' : 'Go to Story'}</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>

                    {/* Shop Pack Location */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                      <div>
                        <span className="font-bold text-slate-800 block">
                          {selectedCard.rarity === 'legendary' || selectedCard.rarity === 'gold'
                            ? (language === 'ko' ? '상점 > 프리미엄 스페셜 카드팩' : 'Shop > Premium Card Pack')
                            : (language === 'ko' ? '상점 > 스탠다드 카드 소환' : 'Shop > Standard Card Summon')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {language === 'ko' ? '가차 소환 풀에 포함' : 'Included in Gacha summon pool'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigate('shop');
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-mono font-black text-[10px] rounded-xl flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                      >
                        <span>{language === 'ko' ? '상점 바로가기' : 'Go to Shop'}</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <h3 className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                      {t('wiki_card_detail_recommended_tags', language)}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2 p-4">
                    {(profile?.marketingTags ?? []).map((tag) => (
                      <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {merchRecommendations.length > 0 && (
                  <div className="overflow-hidden rounded-3xl border border-fuchsia-100 bg-white shadow-sm">
                    <div className="border-b border-fuchsia-100 px-4 py-3">
                      <h3 className="text-xs font-black uppercase tracking-[0.28em] text-fuchsia-600">
                        {t('wiki_card_detail_merch_title', language)}
                      </h3>
                    </div>
                    <div className="space-y-3 p-4">
                      <p className="text-sm font-semibold leading-relaxed text-slate-600">
                        {t('wiki_card_detail_merch_desc', language)}
                      </p>
                      <div className="grid gap-3">
                        {merchRecommendations.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleOpenRecommendedMerch(product.id, selectedCard.id)}
                            className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-fuchsia-100 bg-fuchsia-50/80 px-4 py-3 text-left transition-all hover:border-fuchsia-200 hover:bg-fuchsia-50 active:scale-[0.99] cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-extrabold tracking-tight text-slate-800">
                                {t(product.titleKey, language)}
                              </div>
                              <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
                                {product.seasonLimited ? t('ip_shop_season_limited', language) : t('ip_shop_character_goods', language)}
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-600">
                              <ShoppingBag size={12} />
                              {t('wiki_card_detail_merch_cta', language)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <h3 className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                      {t('wiki_card_detail_relationship_related', language)}
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="grid gap-3">
                      {relatedCards.slice(0, 3).map((card) => renderMiniCard(card, 'related'))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'story' && profile && (
            <div className="space-y-4">
              {[
                { title: t('wiki_card_detail_story_origin', language), content: t(profile.originStoryKey, language) },
                { title: t('wiki_card_detail_story_growth', language), content: t(profile.growthArcKey, language) },
                { title: t('wiki_card_detail_story_webtoon', language), content: t(profile.webtoonHookKey, language) },
              ].map((entry) => (
                <div key={entry.title} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                    <Quote size={12} />
                    <span>{entry.title}</span>
                  </div>
                  <p className={cn('mt-3 whitespace-pre-line text-sm leading-7 text-slate-700', storyExpanded ? '' : 'line-clamp-3')}>
                    {entry.content}
                  </p>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setStoryExpanded((value) => !value)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-slate-600 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 active:scale-95"
              >
                {storyExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {storyExpanded ? t('wiki_card_detail_show_less', language) : t('wiki_card_detail_show_more', language)}
              </button>

              {/* ── 스토리 연결 CTA 버튼 ── */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('main')}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-indigo-300 bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-500 active:scale-95"
                >
                  <Swords size={14} />
                  {t('story_card_battle_cta', language)}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('webtoon')}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 active:scale-95"
                >
                  <BookOpen size={14} />
                  {t('story_card_webtoon_cta', language)}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'relations' && profile && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  <Users size={12} />
                  <span>{t('wiki_card_detail_relationship_ally', language)}</span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {getAllyIds(selectedCard.id).map((id) => CARD_DATABASE[id]).filter((card): card is DatabaseCard => Boolean(card)).map((card) => renderMiniCard(card, 'ally'))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  <Sparkles size={12} />
                  <span>{t('wiki_card_detail_relationship_rival', language)}</span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {getRivalIds(selectedCard.id).map((id) => CARD_DATABASE[id]).filter((card): card is DatabaseCard => Boolean(card)).map((card) => renderMiniCard(card, 'rival'))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  <Info size={12} />
                  <span>{t('wiki_card_detail_relationship_related', language)}</span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {relatedCards.map((card) => renderMiniCard(card, 'related'))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'art' && (
            <div className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/55">{t('wiki_card_detail_tab_art', language)}</p>
                      <h3 className="mt-1 text-lg font-black uppercase tracking-tight">{cardName}</h3>
                    </div>
                    <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]', rarityBadgeClass(selectedCard.rarity))}>
                      {rarityLabel}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col md:flex-row items-center justify-center gap-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-4 min-h-[260px]">
                    {/* 카드 실물 패키지 뷰 */}
                    <div className="w-44 sm:w-52 aspect-[3/4] shrink-0 drop-shadow-2xl transition-transform hover:scale-105">
                      <CardItem
                        card={selectedCard as unknown as CardData}
                        language={language}
                        lowSpecMode={lowSpecMode}
                      />
                    </div>

                    {/* 일러스트 원본 이미지 뷰 */}
                    <div className="flex-1 min-w-0 flex flex-col items-center justify-center w-full max-w-xs">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2">
                        {language === 'ko' ? '일러스트 원본 아트' : 'Full Illustration Art'}
                      </div>
                      <div className="w-full aspect-square rounded-xl bg-slate-950/80 border border-white/10 overflow-hidden flex items-center justify-center p-2">
                        {resolvedImg.source && !isSpriteSheet(resolvedImg.source) ? (
                          <img
                            src={resolvedImg.source}
                            alt={cardName}
                            className="h-full w-full object-contain drop-shadow-md rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div
                            className="w-full h-full rounded-lg"
                            style={getCardSpriteStyle(Number(selectedCard.id), resolvedImg.source)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <button type="button" onClick={onOpenViewer} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-white transition-all hover:bg-emerald-400 active:scale-95">
                      <Camera size={14} />
                      {t('wiki_card_detail_3d_view', language)}
                    </button>
                    <button type="button" onClick={onPrintCard} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-900 transition-all hover:bg-slate-100 active:scale-95">
                      <Printer size={14} />
                      {t('wiki_print_card_button', language)}
                    </button>
                    <button type="button" onClick={() => onDownloadCard('ally')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-white transition-all hover:bg-blue-500 active:scale-95">
                      <Download size={14} />
                      {t('wiki_download_ally_card', language)}
                    </button>
                    <button type="button" onClick={() => onDownloadCard('enemy')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-white transition-all hover:bg-red-500 active:scale-95 sm:col-span-2">
                      <Download size={14} />
                      {t('wiki_download_enemy_card', language)}
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                      <QrCode size={12} />
                      <span>{t('wiki_card_detail_ar_qr', language)}</span>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700">
                      {t('wiki_card_detail_target', language)}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col items-center gap-4">
                    <div className="rounded-2xl border-4 border-emerald-500 bg-white p-4 shadow-lg">
                      <QRCodeSVG
                        value={`snshero_card_${selectedCard.id}`}
                        size={180}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-center text-[11px] font-semibold leading-relaxed text-slate-500">
                      {t('qr_reward_desc', language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-3">
                <PromptCard
                  title={t('wiki_card_detail_positive_prompt', language)}
                  value={language === 'ko' ? artPrompt.positivePromptKo : artPrompt.positivePromptEn}
                  canCopy={showCopyButtons}
                  onCopy={() => copyText(language === 'ko' ? artPrompt.positivePromptKo : artPrompt.positivePromptEn)}
                  language={language}
                />
                <PromptCard
                  title={t('wiki_card_detail_thumbnail_prompt', language)}
                  value={artPrompt.thumbnailPrompt}
                  canCopy={showCopyButtons}
                  onCopy={() => copyText(artPrompt.thumbnailPrompt)}
                  language={language}
                />
                <PromptCard
                  title={t('wiki_card_detail_webtoon_prompt', language)}
                  value={artPrompt.webtoonPanelPrompt}
                  canCopy={showCopyButtons}
                  onCopy={() => copyText(artPrompt.webtoonPanelPrompt)}
                  language={language}
                />
              </div>
            </div>
          )}

          {activeTab === 'share' && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                    <Share2 size={12} />
                    <span>{t('wiki_card_detail_tab_share', language)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(shareTemplate.caption)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white transition-all hover:bg-slate-800 active:scale-95"
                  >
                    <Copy size={14} />
                    {t('wiki_card_detail_copy', language)}
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-lg font-black uppercase tracking-tight text-slate-900">
                    {shareTemplate.intro}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {profile ? t(profile.signatureLineKey, language) : ''}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {shareTemplate.hashtags.map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>

                {onOpenShareTemplate && (
                  <button
                    type="button"
                    onClick={onOpenShareTemplate}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-white transition-all hover:from-indigo-700 hover:to-violet-700 active:scale-95 shadow-md"
                  >
                    <Download size={14} />
                    {t('wiki_card_detail_share_template_cta', language)}
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'skins' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500 mb-4">
                <Shirt size={12} />
                <span>{t('wiki_card_detail_tab_skins', language)}</span>
              </div>

              {/* Rendering priority indicator */}
              <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Palette size={12} className="text-indigo-500" />
                  <span className="text-[9px] font-black uppercase tracking-[0.22em] text-indigo-600">
                    {t('card_skin_theme', language)}
                  </span>
                  {cardSkinTheme !== 'default' && (
                    <span className="rounded-full border border-indigo-200 bg-indigo-100 px-2 py-0.5 text-[8px] font-bold uppercase text-indigo-700">
                      {cardSkinTheme === 'original_mecha' ? t('card_skin_theme_mecha_badge', language) : cardSkinTheme}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-slate-600 leading-snug">
                  {t('card_skin_theme_live_preview', language)}
                </p>
                {/* Priority chain visualization */}
                <div className="mt-2.5 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                  <span className={resolvedImg.priority === 'custom' ? 'text-indigo-600 font-black' : ''}>
                    {t('card_render_priority_custom', language)}
                  </span>
                  <span className="text-slate-300">&gt;</span>
                  <span className={resolvedImg.priority === 'skin' ? 'text-indigo-600 font-black' : ''}>
                    {t('card_render_priority_skin', language)}
                  </span>
                  <span className="text-slate-300">&gt;</span>
                  <span className={resolvedImg.priority === 'theme' ? 'text-indigo-600 font-black' : ''}>
                    {t('card_render_priority_theme', language)}
                  </span>
                  <span className="text-slate-300">&gt;</span>
                  <span className={resolvedImg.priority === 'imageUrl' || resolvedImg.priority === 'fallback' ? 'text-indigo-600 font-black' : ''}>
                    {t('card_render_priority_default', language)}
                  </span>
                </div>
              </div>

              <SkinSelector
                cardId={selectedCard.id}
                season={season}
                language={language}
                lowSpecMode={lowSpecMode}
                availableSkins={availableSkins}
                isSkinUnlocked={isSkinUnlocked}
                isSkinActive={isSkinActive}
                onApplySkin={onApplySkin}
                onRemoveSkin={onRemoveSkin}
              />
            </div>
          )}

          {toastMessage && (
            <div className="pointer-events-none fixed bottom-6 left-1/2 z-[1020] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-white shadow-2xl">
              {toastMessage}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-semibold text-slate-500">
              {selectedCard.ability ? (language === 'ko' ? selectedCard.ability.description_ko : selectedCard.ability.description_en) : cardName}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('world-codex')}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-black uppercase tracking-[0.22em] text-indigo-700 transition-all hover:bg-indigo-100 active:scale-95"
              >
                <Users size={14} />
                <span className="ml-2">{t('wiki_card_detail_tab_relations', language)}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('main')}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-amber-200 bg-amber-500 px-4 py-2.5 text-xs font-black uppercase tracking-[0.22em] text-slate-950 transition-all hover:bg-amber-400 active:scale-95"
              >
                <Sparkles size={14} />
                <span className="ml-2">{t('play', language)}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-xs font-black uppercase tracking-[0.22em] text-white transition-all hover:bg-slate-800 active:scale-95"
              >
                {t('close', language)}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface StatChipProps {
  label: string;
  value: number;
}

const StatChip: React.FC<StatChipProps> = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center shadow-sm">
    <p className="text-[9px] font-black uppercase tracking-[0.28em] text-slate-400">{label}</p>
    <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
  </div>
);

interface DetailRowProps {
  label: string;
  value: string;
  badgeClass?: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, badgeClass }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{label}</p>
    <div className="mt-2 flex items-center gap-2">
      <span className={cn('rounded-full border px-3 py-1 text-sm font-bold', badgeClass ?? 'border-slate-200 bg-white text-slate-700')}>
        {value}
      </span>
    </div>
  </div>
);

interface PromptCardProps {
  title: string;
  value: string;
  canCopy: boolean;
  onCopy: () => void;
  language: Language;
}

const PromptCard: React.FC<PromptCardProps> = ({ title, value, canCopy, onCopy, language }) => (
  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">{title}</p>
      </div>
      {canCopy && (
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white transition-all hover:bg-slate-800 active:scale-95"
        >
          <Copy size={12} />
          {t('wiki_card_detail_copy', language)}
        </button>
      )}
    </div>
    <div className="max-h-60 overflow-y-auto p-4">
      <p className="whitespace-pre-wrap text-[12px] leading-6 text-slate-700">{value}</p>
    </div>
  </div>
);
