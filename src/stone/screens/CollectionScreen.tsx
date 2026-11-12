import React, { useEffect, useMemo, useState } from 'react';
import { hsAudio } from '../audio';
import {
  CLASS_CREST_URL,
  CRAFTING_COST,
  DISENCHANT_VALUE,
  cardDb,
  decodeDeckShareCode,
  encodeDeckShareCode,
  getCardTileUrl,
  getHeroArtUrl,
} from '../cardDb';
import {
  HearthstoneCard,
  HsArcaneDustVialIcon,
  HsManaGem,
  RACE_KO,
} from '../components/CardVisual';
import { CardZoomAction, CardZoomModal } from '../components/CardZoomModal';
import { hsStorage } from '../storage';
import {
  CLASSIC_HEROES,
  CardClass,
  CardRarity,
  ClassicCardDef,
  CustomDeck,
  HERO_CLASS_ORDER,
  HeroClass,
} from '../types';

const RARITY_KO: Record<CardRarity, string> = {
  FREE: '기본',
  COMMON: '일반',
  RARE: '희귀',
  EPIC: '특급',
  LEGENDARY: '전설',
};

const RARITY_FILTER_OPTIONS: { id: 'ALL' | CardRarity; label: string; dotColor: string }[] = [
  { id: 'ALL', label: '전체 등급', dotColor: '#e2e8f0' },
  { id: 'FREE', label: '기본', dotColor: '#94a3b8' },
  { id: 'COMMON', label: '일반', dotColor: '#f8fafc' },
  { id: 'RARE', label: '희귀', dotColor: '#3b82f6' },
  { id: 'EPIC', label: '특급', dotColor: '#a855f7' },
  { id: 'LEGENDARY', label: '전설', dotColor: '#f59e0b' },
];

export const CollectionScreen: React.FC<{
  onBack: () => void;
  onProfileChanged: () => void;
}> = ({ onBack, onProfileChanged }) => {
  const [collection, setCollection] = useState(() => hsStorage.getCollection());
  const [decks, setDecks] = useState<CustomDeck[]>(() => hsStorage.getDecks());
  const [profile, setProfile] = useState(() => hsStorage.getProfile());

  const [activeTab, setActiveTab] = useState<CardClass>('MAGE');
  const [manaFilter, setManaFilter] = useState<number | 'ALL'>('ALL');
  const [rarityFilter, setRarityFilter] = useState<'ALL' | CardRarity>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [craftingMode, setCraftingMode] = useState(true);
  const [page, setPage] = useState(0);

  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'TOME' | 'DECKS'>('TOME');
  const [isCompactMobile, setIsCompactMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640,
  );
  const [creatingClassPicker, setCreatingClassPicker] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importCodeText, setImportCodeText] = useState('');
  const [hoveredTileCard, setHoveredTileCard] = useState<ClassicCardDef | null>(null);
  const [inspectCard, setInspectCard] = useState<ClassicCardDef | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    hsAudio.playBgm('collection');
    const onResize = () => setIsCompactMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const syncAll = () => {
    setCollection(hsStorage.getCollection());
    setDecks(hsStorage.getDecks());
    setProfile(hsStorage.getProfile());
    onProfileChanged();
  };

  const showNotice = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2700);
  };

  const editingDeck = useMemo(
    () => decks.find((d) => d.id === editingDeckId) || null,
    [decks, editingDeckId],
  );

  // Keep tab aligned when opening a deck to edit
  useEffect(() => {
    if (editingDeck && activeTab !== editingDeck.heroClass && activeTab !== 'NEUTRAL') {
      setActiveTab(editingDeck.heroClass);
      setPage(0);
    }
  }, [editingDeck, activeTab]);

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cardDb
      .getAllCollectible()
      .filter((c) => {
        if (editingDeck) {
          if (c.cardClass !== editingDeck.heroClass && c.cardClass !== 'NEUTRAL') return false;
        }
        if (c.cardClass !== activeTab) return false;
        if (!craftingMode && (collection[c.id] || 0) <= 0) return false;
        if (manaFilter !== 'ALL') {
          if (manaFilter === 7 ? c.cost < 7 : c.cost !== manaFilter) return false;
        }
        if (rarityFilter !== 'ALL' && c.rarity !== rarityFilter) return false;
        if (q) {
          const raceKo = c.race ? RACE_KO[c.race] || '' : '';
          const rarityKo = RARITY_KO[c.rarity] || '';
          const hay = `${c.name} ${c.text} ${raceKo} ${rarityKo} ${c.rarity}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name, 'ko'));
  }, [activeTab, craftingMode, collection, manaFilter, rarityFilter, searchQuery, editingDeck]);

  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageCards = filteredCards.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (inspectCard) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (safePage > 0) {
          hsAudio.playSfx('card_hover', 0.55);
          setPage((p) => Math.max(0, p - 1));
        }
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (safePage < totalPages - 1) {
          hsAudio.playSfx('card_hover', 0.55);
          setPage((p) => Math.min(totalPages - 1, p + 1));
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inspectCard, safePage, totalPages]);

  const handleAddCardToDeck = (card: ClassicCardDef) => {
    if (!editingDeck) {
      setInspectCard(card);
      hsAudio.playSfx('card_hover', 0.65);
      return;
    }
    const owned = collection[card.id] || 0;
    if (owned <= 0) {
      setInspectCard(card);
      showNotice('미보유 카드입니다. 상세 창에서 신비한 가루로 즉시 제작할 수 있습니다.');
      return;
    }
    if (editingDeck.cards.length >= 30) {
      showNotice('덱이 이미 30장으로 가득 찼습니다.');
      return;
    }
    const inDeckCount = editingDeck.cards.filter((cid) => cid === card.id).length;
    const maxCopy = card.rarity === 'LEGENDARY' ? 1 : 2;
    if (inDeckCount >= maxCopy) {
      showNotice(
        card.rarity === 'LEGENDARY'
          ? '전설 카드는 덱에 1장만 편성할 수 있습니다.'
          : '동일 카드는 덱에 최대 2장까지 편성할 수 있습니다.',
      );
      return;
    }
    if (inDeckCount >= owned) {
      showNotice(`현재 이 카드를 ${owned}장 보유 중입니다.`);
      return;
    }

    const updated = decks.map((d) =>
      d.id === editingDeck.id ? { ...d, cards: [...d.cards, card.id] } : d,
    );
    hsStorage.saveDecks(updated);
    setDecks(updated);
    hsAudio.playSfx('card_place', 0.75);
  };

  const handleRemoveCardFromDeck = (cardId: string) => {
    if (!editingDeck) return;
    const idx = editingDeck.cards.indexOf(cardId);
    if (idx < 0) return;
    const nextCards = [...editingDeck.cards];
    nextCards.splice(idx, 1);
    const updated = decks.map((d) =>
      d.id === editingDeck.id ? { ...d, cards: nextCards } : d,
    );
    hsStorage.saveDecks(updated);
    setDecks(updated);
    hsAudio.playSfx('cm_remove_card', 0.8);
  };

  const handleAutoCompleteDeck = () => {
    if (!editingDeck) return;
    const current = [...editingDeck.cards];
    const candidates = cardDb
      .getAllCollectible()
      .filter(
        (c) =>
          (c.cardClass === editingDeck.heroClass || c.cardClass === 'NEUTRAL') &&
          (collection[c.id] || 0) > 0,
      )
      .sort((a, b) => {
        const aClassScore = a.cardClass === editingDeck.heroClass ? 0 : 1;
        const bClassScore = b.cardClass === editingDeck.heroClass ? 0 : 1;
        if (aClassScore !== bClassScore) return aClassScore - bClassScore;
        return Math.abs(a.cost - 3.5) - Math.abs(b.cost - 3.5);
      });

    for (const c of candidates) {
      if (current.length >= 30) break;
      const owned = collection[c.id] || 0;
      const maxAllowed = Math.min(owned, c.rarity === 'LEGENDARY' ? 1 : 2);
      while (current.length < 30 && current.filter((x) => x === c.id).length < maxAllowed) {
        current.push(c.id);
      }
    }

    const updated = decks.map((d) =>
      d.id === editingDeck.id ? { ...d, cards: current } : d,
    );
    hsStorage.saveDecks(updated);
    setDecks(updated);
    hsAudio.playSfx('menu_select');
    showNotice(`덱이 ${current.length}/30장으로 자동 완성되었습니다.`);
  };

  const handleCopyDeckCode = async (deck: CustomDeck) => {
    const code = encodeDeckShareCode(deck);
    try {
      await navigator.clipboard.writeText(code);
      hsAudio.playSfx('menu_select', 0.8);
      showNotice('클립보드에 하스스톤 덱 공유 코드가 복사되었습니다!');
    } catch {
      window.prompt('아래 덱 공유 코드를 복사하세요:', code);
    }
  };

  const handleImportDeckCode = () => {
    const parsed = decodeDeckShareCode(importCodeText);
    if (!parsed) {
      showNotice('유효하지 않은 덱 코드입니다. HSCLASSIC1:... 형식을 확인하세요.');
      return;
    }
    const validCards: string[] = [];
    for (const cid of parsed.cards) {
      const def = cardDb.getCard(cid);
      if (
        def &&
        (def.cardClass === parsed.heroClass || def.cardClass === 'NEUTRAL') &&
        validCards.length < 30
      ) {
        const owned = collection[def.id] || 0;
        const cap = Math.min(owned, def.rarity === 'LEGENDARY' ? 1 : 2);
        if (validCards.filter((x) => x === def.id).length < cap) {
          validCards.push(def.id);
        }
      }
    }
    const newDeck: CustomDeck = {
      id: `deck_${Date.now()}`,
      name: parsed.name || `불러온 ${CLASSIC_HEROES[parsed.heroClass].classNameKo} 덱`,
      heroClass: parsed.heroClass,
      cards: validCards,
    };
    const updated = [newDeck, ...decks];
    hsStorage.saveDecks(updated);
    setDecks(updated);
    setImportModalOpen(false);
    setImportCodeText('');
    setEditingDeckId(newDeck.id);
    setActiveTab(newDeck.heroClass);
    hsAudio.playSfx('cm_select_hero');
    showNotice(`[${newDeck.name}] (${validCards.length}/30장) 덱을 불러왔습니다!`);
  };

  const handleCreateDeck = (heroClass: HeroClass) => {
    const className = CLASSIC_HEROES[heroClass].classNameKo;
    const customNum = decks.filter((d) => d.heroClass === heroClass).length + 1;
    const newDeck: CustomDeck = {
      id: `deck_${Date.now()}`,
      name: `나만의 ${className} #${customNum}`,
      heroClass,
      cards: [],
    };
    const updated = [newDeck, ...decks];
    hsStorage.saveDecks(updated);
    setDecks(updated);
    setCreatingClassPicker(false);
    setEditingDeckId(newDeck.id);
    setActiveTab(heroClass);
    hsAudio.playSfx('cm_select_hero');
  };

  const handleDeleteDeck = (deckId: string) => {
    if (decks.length <= 1) {
      showNotice('최소 1개의 덱은 남겨두어야 합니다.');
      return;
    }
    const updated = decks.filter((d) => d.id !== deckId);
    hsStorage.saveDecks(updated);
    setDecks(updated);
    if (editingDeckId === deckId) setEditingDeckId(null);
    hsAudio.playSfx('cm_remove_card');
  };

  const deckGrouped = useMemo(() => {
    if (!editingDeck) return { entries: [], curve: [0, 0, 0, 0, 0, 0, 0, 0] };
    const counts = new Map<string, number>();
    const curve = [0, 0, 0, 0, 0, 0, 0, 0];
    for (const cid of editingDeck.cards) {
      counts.set(cid, (counts.get(cid) || 0) + 1);
      const d = cardDb.mustGetCard(cid);
      curve[Math.min(7, d.cost)] += 1;
    }
    const entries = Array.from(counts.entries())
      .map(([cid, count]) => ({ card: cardDb.mustGetCard(cid), count }))
      .sort((a, b) => a.card.cost - b.card.cost || a.card.name.localeCompare(b.card.name, 'ko'));
    return { entries, curve };
  }, [editingDeck]);

  const ownedUniqueCount = useMemo(
    () => cardDb.getAllCollectible().filter((c) => (collection[c.id] || 0) > 0).length,
    [collection],
  );

  return (
    <div
      style={{ backgroundImage: 'url(/stone-assets/ui/box_table_bg.webp)' }}
      className="relative flex h-[100dvh] w-full select-none flex-col overflow-hidden bg-cover bg-center text-amber-100"
    >
      <div className="pointer-events-none absolute inset-0 bg-black/68" />

      {/* Top Brass & Leather Header Bar */}
      <header className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-1.5 border-b-[3px] border-[#b7914d] bg-gradient-to-b from-[#432b17] via-[#2b1a0d] to-[#190f07] px-2.5 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.85)] sm:gap-2 sm:px-4 sm:py-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('box_close');
              hsAudio.playBgm('tavern_hub');
              onBack();
            }}
            className="hs-brass-btn min-h-[38px] rounded-xl px-2.5 py-1 text-xs font-extrabold text-amber-100 sm:px-3.5 sm:py-1.5 sm:text-sm"
          >
            ← <span className="hidden sm:inline">여관 </span>상자로
          </button>

          <div className="flex items-center gap-2">
            <img
              src={CLASS_CREST_URL[activeTab]}
              alt=""
              className="h-7 w-7 rounded-full border border-amber-300/60 object-cover shadow sm:h-8 sm:w-8"
            />
            <div>
              <h1 className="hs-title text-sm font-extrabold tracking-wide text-amber-100 sm:text-xl">
                내 카드첩 · 덱 빌더
              </h1>
              <div className="text-[10px] font-bold text-amber-300/85 sm:text-[10.5px]">
                수집 현황: {ownedUniqueCount} / 382종
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-sky-400/50 bg-slate-950/85 px-2.5 py-1 text-[11px] font-extrabold text-sky-200 shadow-inner sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs">
            <HsArcaneDustVialIcon size={16} />
            <span className="hidden sm:inline">신비한 가루</span>
            <span className="hs-num ml-0.5 text-xs text-white sm:text-sm">{profile.arcaneDust}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              const res = hsStorage.massDisenchantExtras();
              if (res.count > 0) {
                hsAudio.playSfx('purchase');
                syncAll();
                showNotice(
                  `여분 카드 ${res.count}장을 추출하여 +${res.dustGained} 신비한 가루를 획득했습니다!`,
                );
              } else {
                showNotice('추출할 여분(3장 이상 중복) 카드가 없습니다.');
              }
            }}
            className="hs-brass-btn min-h-[36px] rounded-xl px-2.5 py-1 text-[11px] font-extrabold text-sky-200 sm:px-3 sm:py-1.5 sm:text-xs"
          >
            여분 추출
          </button>

          <button
            type="button"
            onClick={() => {
              hsStorage.unlockMasterCollection();
              hsAudio.playSfx('pack_legendary');
              syncAll();
              showNotice('오리지널 수집 카드 382종 전체 해금이 완료되었습니다!');
            }}
            className="hs-arcane-btn min-h-[36px] rounded-xl px-2.5 py-1 text-[11px] font-extrabold text-white sm:px-3 sm:py-1.5 sm:text-xs"
          >
            전체해금
          </button>
        </div>
      </header>

      {/* Mobile Portrait Panel Switcher (`< lg`) so Tome & Deckbuilder Each Get 100% Height */}
      <div className="relative z-20 flex shrink-0 gap-1.5 border-b border-amber-500/30 bg-stone-950/90 px-2.5 py-1.5 lg:hidden">
        <button
          type="button"
          onClick={() => {
            hsAudio.playSfx('ui_click', 0.6);
            setMobilePanel('TOME');
          }}
          className={`flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-xl border text-xs font-extrabold transition ${
            mobilePanel === 'TOME'
              ? 'border-amber-200 bg-gradient-to-b from-amber-500 to-amber-800 text-white shadow'
              : 'border-amber-500/35 bg-stone-900 text-amber-200/80'
          }`}
        >
          <span>카드첩 보기 ({ownedUniqueCount}/382)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            hsAudio.playSfx('ui_click', 0.6);
            setMobilePanel('DECKS');
          }}
          className={`flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-xl border text-xs font-extrabold transition ${
            mobilePanel === 'DECKS'
              ? 'border-sky-200 bg-gradient-to-b from-sky-500 to-blue-900 text-white shadow'
              : 'border-amber-500/35 bg-stone-900 text-amber-200/80'
          }`}
        >
          <span>
            {editingDeck
              ? `편집 중: ${editingDeck.name} (${editingDeck.cards.length}/30)`
              : `내 덱 목록 (${decks.length}개)`}
          </span>
        </button>
      </div>

      {toast && (
        <div className="pointer-events-none fixed left-1/2 top-16 z-[140] w-[90vw] max-w-md -translate-x-1/2 rounded-2xl border-2 border-amber-300 bg-stone-950/95 px-4 py-2 text-center text-xs font-extrabold text-amber-100 shadow-2xl">
          {toast}
        </div>
      )}

      {/* Floating Deck-Tile Hover Card Preview (Desktop >= lg) */}
      {hoveredTileCard && !inspectCard && (
        <div className="pointer-events-none fixed right-[26.5%] top-1/2 z-[90] hidden -translate-y-1/2 lg:block">
          <HearthstoneCard card={hoveredTileCard} size="MD" />
        </div>
      )}

      {/* Main Split Layout: Leather Tome (Left 9 Cols) + Official Deckbuilder Tray (Right 3 Cols) */}
      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12">
        {/* Left 9 Columns: Open Leather Collection Tome */}
        <section
          className={`${
            mobilePanel === 'TOME' ? 'flex' : 'hidden'
          } min-h-0 flex-col px-2 pb-2 pt-1.5 sm:px-3 sm:pb-3 sm:pt-2 lg:col-span-9 lg:flex`}
        >
          {/* Stitched Class Bookmark Tabs with Official Class Crests (Scrollable on Mobile Portrait!) */}
          <div className="hs-no-scrollbar flex shrink-0 gap-1 overflow-x-auto pl-1 lg:flex-wrap lg:overflow-visible">
            {([...HERO_CLASS_ORDER, 'NEUTRAL'] as CardClass[]).map((cls) => {
              const disabled =
                Boolean(editingDeck) && cls !== editingDeck!.heroClass && cls !== 'NEUTRAL';
              const label =
                cls === 'NEUTRAL' ? '중립' : CLASSIC_HEROES[cls as HeroClass].classNameKo;
              const active = activeTab === cls;
              return (
                <button
                  key={cls}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    hsAudio.playSfx('card_flip', 0.65);
                    setActiveTab(cls);
                    setPage(0);
                  }}
                  className={`flex shrink-0 items-center gap-1 rounded-t-xl border-x-2 border-t-2 px-2 py-1 text-[11px] font-extrabold transition sm:gap-1.5 sm:px-2.5 sm:text-xs ${
                    active
                      ? 'z-10 -mb-[2px] border-[#cfa85d] bg-[#ead9b7] pb-1.5 text-[#2b190b] shadow'
                      : disabled
                        ? 'cursor-not-allowed border-stone-800 bg-stone-950/50 text-stone-600 opacity-45'
                        : 'border-[#7c5b30] bg-gradient-to-b from-[#49301a] to-[#2b1a0d] text-amber-200 hover:brightness-115'
                  }`}
                >
                  <img
                    src={CLASS_CREST_URL[cls]}
                    alt=""
                    className="h-4 w-4 rounded-full object-cover sm:h-5 sm:w-5"
                  />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Open Parchment Tome Spread (`page_parchment_classic.webp`) */}
          <div
            style={{
              backgroundImage:
                'linear-gradient(90deg, rgba(226,207,168,0.88) 0%, rgba(244,232,204,0.84) 48%, rgba(168,136,88,0.45) 50%, rgba(244,232,204,0.84) 52%, rgba(224,204,164,0.88) 100%), url(/stone-assets/ui/page_parchment_classic.webp)',
            }}
            className="relative flex min-h-0 flex-1 flex-col justify-between rounded-b-2xl rounded-tr-2xl border-[3px] border-[#c49d56] bg-cover bg-center px-2 pb-2 pt-1.5 text-stone-900 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_0_38px_rgba(82,50,18,0.42)] sm:rounded-b-3xl sm:rounded-tr-3xl sm:border-[4px] sm:px-4 sm:pb-2.5 sm:pt-2"
          >
            {/* Tactile Brass Page Turn Arrows */}
            {safePage > 0 && (
              <button
                type="button"
                onClick={() => {
                  hsAudio.playSfx('card_flip', 0.8);
                  setPage((p) => Math.max(0, p - 1));
                }}
                title="이전 페이지"
                className="hs-brass-btn absolute left-1 top-1/2 z-30 flex h-12 w-8 -translate-y-1/2 items-center justify-center rounded-full text-base font-extrabold text-amber-100 sm:left-1.5 sm:h-14 sm:w-9 sm:text-lg"
              >
                ◀
              </button>
            )}
            {safePage < totalPages - 1 && (
              <button
                type="button"
                onClick={() => {
                  hsAudio.playSfx('card_flip', 0.8);
                  setPage((p) => Math.min(totalPages - 1, p + 1));
                }}
                title="다음 페이지"
                className="hs-brass-btn absolute right-1 top-1/2 z-30 flex h-12 w-8 -translate-y-1/2 items-center justify-center rounded-full text-base font-extrabold text-amber-100 sm:right-1.5 sm:h-14 sm:w-9 sm:text-lg"
              >
                ▶
              </button>
            )}

            {/* 8-Card Spread Grid (Tapping ANY Card Selects & Enlarges via CardZoomModal!) */}
            <div className="grid min-h-0 flex-1 grid-cols-2 place-items-center gap-x-1.5 gap-y-1 overflow-y-auto px-7 py-0.5 sm:grid-cols-4 sm:gap-x-2 sm:gap-y-1.5">
              {pageCards.map((card) => {
                const owned = collection[card.id] || 0;
                const inDeck = editingDeck
                  ? editingDeck.cards.filter((cid) => cid === card.id).length
                  : 0;
                return (
                  <div
                    key={card.id}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setInspectCard(card);
                    }}
                    className="flex flex-col items-center"
                  >
                    <div
                      className={`relative transition ${
                        owned === 0 ? 'opacity-55 saturate-[0.35]' : ''
                      }`}
                    >
                      <HearthstoneCard
                        card={card}
                        size={isCompactMobile ? 'XS' : 'SM'}
                        enableTilt
                        onClick={() => {
                          hsAudio.playSfx('card_hover', 0.7);
                          setInspectCard(card);
                        }}
                        className="cursor-pointer"
                      />
                      {editingDeck && inDeck > 0 && (
                        <span className="hs-num pointer-events-none absolute right-1.5 top-2 z-30 rounded-full border border-emerald-200 bg-emerald-700 px-1.5 py-0.5 text-[9.5px] text-white shadow sm:right-2 sm:top-3 sm:px-2 sm:text-[10px]">
                          덱 {inDeck}
                        </span>
                      )}
                    </div>

                    {/* Clean Parchment Ownership Ribbon */}
                    <div className="-mt-1 flex items-center gap-1">
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[9.5px] font-extrabold shadow-sm sm:px-2 sm:text-[10px] ${
                          owned > 0
                            ? 'border-[#8a6432] bg-[#432913] text-amber-100'
                            : 'border-sky-800/60 bg-sky-950/85 text-sky-200'
                        }`}
                      >
                        {owned > 0 ? `보유 ×${owned}` : '미보유'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          hsAudio.playSfx('card_hover', 0.65);
                          setInspectCard(card);
                        }}
                        className="rounded-md border border-[#96703c] bg-[#fbf3df] px-1.5 py-0.5 text-[9.5px] font-extrabold text-[#3d2511] shadow-sm hover:bg-[#f2dfb7] sm:px-2 sm:text-[10px]"
                      >
                        확대
                      </button>
                    </div>
                  </div>
                );
              })}

              {pageCards.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm font-extrabold text-[#5c3d1e]">
                  검색 및 마나/등급 필터와 일치하는 카드가 없습니다.
                </div>
              )}
            </div>

            {/* Bottom Official Deckbuilder Filter Bar: Sapphire Mana Gems + Rarity (Visible on Mobile Too!) + Search */}
            <div className="mt-1 flex shrink-0 flex-col gap-1.5 border-t-2 border-[#8c6633]/35 pt-1.5 sm:mt-1.5 sm:pt-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                {/* Sapphire Mana Crystal Filter Row */}
                <div className="hs-no-scrollbar flex items-center gap-1 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setManaFilter('ALL');
                      setPage(0);
                    }}
                    className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10.5px] font-extrabold transition sm:px-2.5 sm:py-1 sm:text-[11px] ${
                      manaFilter === 'ALL'
                        ? 'border-sky-300 bg-sky-800 text-white shadow'
                        : 'border-[#8f6a38]/50 bg-[#efe0be] text-[#3a2310] hover:bg-[#e5d0a3]'
                    }`}
                  >
                    전체
                  </button>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((m) => {
                    const active = manaFilter === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          hsAudio.playSfx('ui_click', 0.5);
                          setManaFilter(active ? 'ALL' : m);
                          setPage(0);
                        }}
                        className={`shrink-0 transition ${
                          active
                            ? 'scale-112 brightness-115'
                            : 'opacity-80 hover:scale-108 hover:opacity-100'
                        }`}
                      >
                        <HsManaGem value={m === 7 ? '7+' : m} size={25} active={active} />
                      </button>
                    );
                  })}
                </div>

                {/* Rarity Gem Filter (Now Visible on Mobile Portrait AND Desktop!) */}
                <div className="hs-no-scrollbar flex items-center gap-1 overflow-x-auto rounded-xl border border-[#8f6a38]/45 bg-[#efe1c0] px-1.5 py-0.5">
                  {RARITY_FILTER_OPTIONS.map((rf) => (
                    <button
                      key={rf.id}
                      type="button"
                      onClick={() => {
                        setRarityFilter(rf.id);
                        setPage(0);
                      }}
                      className={`flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] font-extrabold transition sm:px-2 sm:text-[10.5px] ${
                        rarityFilter === rf.id
                          ? 'bg-[#3e2612] text-amber-100 shadow'
                          : 'text-[#4a2e16] hover:bg-[#e2cfa4]'
                      }`}
                    >
                      <span
                        style={{ backgroundColor: rf.dotColor }}
                        className="h-2 w-2 rounded-full border border-black/40"
                      />
                      <span>{rf.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search + Ownership Toggle + Page Counter */}
              <div className="flex items-center justify-between gap-1.5">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder="카드명 · 효과 · 종족 검색..."
                  className="min-w-0 flex-1 rounded-xl border border-[#8a6534] bg-[#fdf8ed] px-2.5 py-1 text-xs font-bold text-stone-900 shadow-inner placeholder:text-stone-400 focus:border-sky-600 focus:outline-none sm:max-w-xs sm:px-3"
                />

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCraftingMode((v) => !v);
                      setPage(0);
                    }}
                    className={`rounded-xl border px-2 py-1 text-[10.5px] font-extrabold transition sm:px-2.5 sm:text-[11px] ${
                      craftingMode
                        ? 'border-sky-300 bg-sky-800 text-white shadow'
                        : 'border-[#8a6534] bg-[#efe1c0] text-[#3a2310]'
                    }`}
                  >
                    {craftingMode ? '전체 382종' : '보유만'}
                  </button>

                  <span className="hs-num rounded-lg bg-[#422813] px-2 py-1 text-[11px] text-amber-100 sm:px-2.5 sm:text-xs">
                    {safePage + 1} / {totalPages}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right 3 Columns: Official Blizzard Oak & Iron Deckbuilder Tray */}
        <aside
          className={`hs-wood-panel ${
            mobilePanel === 'DECKS' ? 'flex' : 'hidden'
          } min-h-0 flex-col border-l-[3px] border-[#b7914d] p-3 lg:col-span-3 lg:flex`}
        >
          {!editingDeck ? (
            <>
              <div className="mb-2.5 flex items-center justify-between gap-1">
                <h2 className="hs-title text-base font-extrabold text-amber-100">
                  보유 덱 ({decks.length})
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setImportModalOpen((v) => !v)}
                    className="hs-brass-btn rounded-lg px-2 py-1 text-[11px] font-extrabold text-sky-200"
                  >
                    코드 입력
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatingClassPicker((v) => !v)}
                    className="hs-arcane-btn rounded-lg px-2.5 py-1 text-[11px] font-extrabold text-white"
                  >
                    + 새 덱
                  </button>
                </div>
              </div>

              {importModalOpen && (
                <div className="mb-2.5 rounded-xl border border-sky-400/50 bg-slate-950/90 p-2.5">
                  <div className="mb-1 text-[11px] font-extrabold text-sky-200">
                    하스스톤 클래식 덱 코드 불러오기
                  </div>
                  <input
                    type="text"
                    value={importCodeText}
                    onChange={(e) => setImportCodeText(e.target.value)}
                    placeholder="HSCLASSIC1:... 붙여넣기"
                    className="w-full rounded-lg border border-sky-500/40 bg-black/70 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                  <div className="mt-1.5 flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleImportDeckCode}
                      className="hs-arcane-btn flex-1 rounded-lg py-1 text-[11px] font-extrabold text-white"
                    >
                      덱 생성
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportModalOpen(false)}
                      className="hs-brass-btn rounded-lg px-2.5 py-1 text-[11px] font-bold text-amber-200"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              )}

              {creatingClassPicker && (
                <div className="mb-2.5 grid grid-cols-3 gap-1.5 rounded-xl border border-[#cfa85d]/50 bg-black/55 p-2">
                  {HERO_CLASS_ORDER.map((hc) => (
                    <button
                      key={hc}
                      type="button"
                      onClick={() => handleCreateDeck(hc)}
                      className="hs-brass-btn flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] font-extrabold text-amber-100"
                    >
                      <img
                        src={CLASS_CREST_URL[hc]}
                        alt=""
                        className="h-4 w-4 rounded-full object-cover"
                      />
                      <span className="truncate">{CLASSIC_HEROES[hc].classNameKo}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {decks.map((d) => {
                  const dh = CLASSIC_HEROES[d.heroClass];
                  const complete = d.cards.length === 30;
                  return (
                    <div
                      key={d.id}
                      className="group relative flex items-center justify-between overflow-hidden rounded-xl border-2 border-[#c8a158]/75 bg-stone-950 p-2 shadow-lg transition hover:border-amber-200"
                    >
                      <img
                        src={getHeroArtUrl(dh.heroId)}
                        alt=""
                        className="pointer-events-none absolute right-0 top-0 h-full w-28 object-cover object-top opacity-35 transition group-hover:opacity-50"
                      />
                      <div
                        style={{
                          background:
                            'linear-gradient(90deg, rgba(22,13,7,0.96) 0%, rgba(22,13,7,0.82) 58%, rgba(22,13,7,0.2) 100%)',
                        }}
                        className="pointer-events-none absolute inset-0"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          hsAudio.playSfx('box_tray_out', 0.7);
                          setEditingDeckId(d.id);
                        }}
                        className="relative z-10 flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      >
                        <img
                          src={CLASS_CREST_URL[d.heroClass]}
                          alt={dh.classNameKo}
                          className="h-9 w-9 shrink-0 rounded-full border border-amber-200/80 object-cover shadow"
                        />
                        <div className="min-w-0">
                          <div className="hs-outline-sm truncate text-xs font-extrabold text-white">
                            {d.name}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] font-bold">
                            <span style={{ color: dh.accentColor }}>{dh.classNameKo}</span>
                            <span className="text-stone-500">·</span>
                            <span className={complete ? 'text-emerald-300' : 'text-amber-300'}>
                              {d.cards.length}/30장
                            </span>
                          </div>
                        </div>
                      </button>

                      <div className="relative z-10 ml-1 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyDeckCode(d)}
                          title="덱 코드 복사"
                          className="rounded-lg border border-sky-400/40 bg-slate-900/90 px-1.5 py-1 text-[10px] font-bold text-sky-200 hover:bg-sky-900"
                        >
                          복사
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDeck(d.id)}
                          title="덱 삭제"
                          className="rounded-lg border border-red-400/40 bg-red-950/85 px-1.5 py-1 text-[10px] font-bold text-red-200 hover:bg-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Active 30-Card Official Deckbuilder View */
            <>
              {/* Hero Banner Header */}
              <div className="relative mb-2 overflow-hidden rounded-xl border-2 border-[#d8b36a] bg-stone-950 p-2.5 shadow-lg">
                <img
                  src={getHeroArtUrl(CLASSIC_HEROES[editingDeck.heroClass].heroId)}
                  alt=""
                  className="pointer-events-none absolute right-0 top-0 h-full w-32 object-cover object-top opacity-45"
                />
                <div
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(16,10,5,0.96) 0%, rgba(16,10,5,0.82) 60%, rgba(16,10,5,0.25) 100%)',
                  }}
                  className="pointer-events-none absolute inset-0"
                />

                <div className="relative z-10 flex items-center gap-2">
                  <img
                    src={CLASS_CREST_URL[editingDeck.heroClass]}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full border border-amber-200 object-cover shadow"
                  />
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={editingDeck.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = decks.map((d) =>
                          d.id === editingDeck.id ? { ...d, name: val } : d,
                        );
                        hsStorage.saveDecks(updated);
                        setDecks(updated);
                      }}
                      className="hs-outline-sm w-full bg-transparent text-sm font-extrabold text-amber-100 outline-none focus:border-b focus:border-amber-300"
                    />
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span style={{ color: CLASSIC_HEROES[editingDeck.heroClass].accentColor }}>
                        {CLASSIC_HEROES[editingDeck.heroClass].classNameKo} 덱
                      </span>
                      <span
                        className={`hs-num text-xs ${
                          editingDeck.cards.length === 30 ? 'text-emerald-300' : 'text-yellow-300'
                        }`}
                      >
                        {editingDeck.cards.length} / 30
                      </span>
                    </div>
                  </div>
                </div>

                {/* Official Mana Curve Histogram (0 ~ 7+) */}
                <div className="relative z-10 mt-2.5 flex h-14 items-end gap-1 border-t border-amber-600/30 pt-3">
                  {deckGrouped.curve.map((cnt, costBucket) => {
                    const maxBar = Math.max(6, ...deckGrouped.curve);
                    const hPct = Math.round((cnt / maxBar) * 100);
                    return (
                      <div key={costBucket} className="flex flex-1 flex-col items-center">
                        <span className="mb-0.5 h-3 text-[9px] font-extrabold text-amber-200">
                          {cnt > 0 ? cnt : ''}
                        </span>
                        <div className="flex h-7 w-full items-end overflow-hidden rounded-t border border-amber-500/25 bg-stone-900/95">
                          <div
                            style={{ height: `${hPct}%` }}
                            className="w-full rounded-t bg-gradient-to-t from-blue-700 via-sky-500 to-sky-200 transition-all"
                          />
                        </div>
                        <span className="hs-num mt-0.5 text-[9.5px] text-sky-200">
                          {costBucket === 7 ? '7+' : costBucket}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Official Hearthstone Card Tile Bars (Tapping Any Tile Enlarges Card!) */}
              <button
                type="button"
                onClick={() => setMobilePanel('TOME')}
                className="hs-arcane-btn mb-2 w-full rounded-xl py-1.5 text-xs font-extrabold text-white lg:hidden"
              >
                + 카드첩에서 카드 선택·추가하기
              </button>

              <div className="flex-1 space-y-1 overflow-y-auto pr-1">
                {deckGrouped.entries.map(({ card, count }) => (
                  <button
                    key={card.id}
                    type="button"
                    onMouseEnter={() => setHoveredTileCard(card)}
                    onMouseLeave={() => setHoveredTileCard(null)}
                    onClick={() => {
                      hsAudio.playSfx('card_hover', 0.65);
                      setInspectCard(card);
                    }}
                    title="클릭하여 카드 확대 및 덱 편집"
                    className="group relative flex h-8 w-full items-center justify-between overflow-hidden rounded-md border border-[#b58e4c]/70 bg-[#18110b] pl-1 pr-1.5 text-left shadow transition hover:border-amber-300"
                  >
                    {/* Right-Side Cropped Card Art Tile */}
                    <img
                      src={getCardTileUrl(card.artId)}
                      alt=""
                      className="pointer-events-none absolute right-0 top-0 h-full w-32 object-cover opacity-75 transition group-hover:scale-105"
                    />
                    {/* Smooth Dark Fade Mask from Left */}
                    <div
                      style={{
                        background:
                          'linear-gradient(90deg, #16100a 0%, #16100a 48%, rgba(22,16,10,0.45) 78%, rgba(22,16,10,0.12) 100%)',
                      }}
                      className="pointer-events-none absolute inset-0"
                    />

                    <div className="relative z-10 flex min-w-0 items-center gap-1.5">
                      <HsManaGem value={card.cost} size={23} />
                      <span className="hs-outline-sm truncate text-xs font-extrabold text-white">
                        {card.name}
                      </span>
                    </div>

                    {(card.rarity === 'LEGENDARY' || count > 1) && (
                      <span className="hs-num relative z-10 ml-1 flex h-5 min-w-5 items-center justify-center rounded border border-amber-300/70 bg-[#2a1a0c]/95 px-1 text-[11px] text-amber-300 shadow">
                        {card.rarity === 'LEGENDARY' ? '★' : count}
                      </span>
                    )}
                  </button>
                ))}

                {deckGrouped.entries.length === 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-black/35 px-3 py-8 text-center text-xs font-semibold text-amber-200/70">
                    카드첩에서 카드를 클릭해 확대한 뒤 [덱에 넣기]를 누르거나 아래 [자동 완성]을 누르세요.
                  </div>
                )}
              </div>

              {/* Deckbuilder Footer Controls */}
              <div className="mt-2 space-y-1.5 border-t border-amber-500/25 pt-2">
                <div className="flex gap-1.5">
                  {editingDeck.cards.length < 30 && (
                    <button
                      type="button"
                      onClick={handleAutoCompleteDeck}
                      className="hs-arcane-btn flex-1 rounded-xl py-1.5 text-xs font-extrabold text-white"
                    >
                      자동 완성
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopyDeckCode(editingDeck)}
                    className="hs-brass-btn flex-1 rounded-xl py-1.5 text-xs font-extrabold text-sky-200"
                  >
                    덱 코드 복사
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setHoveredTileCard(null);
                    hsAudio.playSfx('box_tray_in', 0.75);
                    setEditingDeckId(null);
                  }}
                  className="hs-brass-btn w-full rounded-xl border-emerald-300/80 bg-gradient-to-b from-emerald-600 to-emerald-900 py-2 text-xs font-extrabold text-white"
                >
                  덱 편성 완료
                </button>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Unified Card Zoom + Deck Add/Remove + Crafting Modal (Outer Tap Cancels!) */}
      {inspectCard &&
        (() => {
          const owned = collection[inspectCard.id] || 0;
          const maxCopy = inspectCard.rarity === 'LEGENDARY' ? 1 : 2;
          const inDeck = editingDeck
            ? editingDeck.cards.filter((cid) => cid === inspectCard.id).length
            : 0;
          const canAddNow =
            Boolean(editingDeck) &&
            owned > 0 &&
            editingDeck!.cards.length < 30 &&
            inDeck < maxCopy &&
            inDeck < owned &&
            (inspectCard.cardClass === editingDeck!.heroClass ||
              inspectCard.cardClass === 'NEUTRAL');

          let primaryAction: CardZoomAction | undefined;
          const secondaryActions: CardZoomAction[] = [];

          if (editingDeck) {
            if (canAddNow) {
              primaryAction = {
                label: `덱에 카드 넣기 (${editingDeck.cards.length + 1}/30)`,
                variant: 'emerald',
                onClick: () => {
                  handleAddCardToDeck(inspectCard);
                  showNotice(
                    `[${inspectCard.name}] 카드를 덱에 넣었습니다 (${editingDeck.cards.length + 1}/30)`,
                  );
                  setInspectCard(null);
                },
              };
            } else if (owned === 0 && inspectCard.rarity !== 'FREE') {
              primaryAction = {
                label: `카드 제작 후 보유 (-${CRAFTING_COST[inspectCard.rarity]} 가루)`,
                variant: 'arcane',
                onClick: () => {
                  const res = hsStorage.craftCard(inspectCard.id);
                  if (res.ok) {
                    hsAudio.playSfx('purchase');
                    syncAll();
                    showNotice(`[${inspectCard.name}] 카드를 제작했습니다!`);
                  } else {
                    showNotice(res.reason || '신비한 가루가 부족합니다.');
                  }
                },
              };
            } else if (inDeck > 0) {
              primaryAction = {
                label: `덱에서 1장 빼기 (현재 ${inDeck}장 편성)`,
                variant: 'crimson',
                onClick: () => {
                  handleRemoveCardFromDeck(inspectCard.id);
                  showNotice(`[${inspectCard.name}] 카드를 덱에서 1장 뺐습니다.`);
                  setInspectCard(null);
                },
              };
            } else {
              primaryAction = {
                label:
                  editingDeck.cards.length >= 30
                    ? '덱이 30장으로 가득 찼습니다'
                    : inDeck >= maxCopy
                      ? `편성 한도 도달 (${inDeck}/${maxCopy}장)`
                      : `보유 수량 모두 편성됨 (${owned}장)`,
                disabled: true,
                onClick: () => {},
              };
            }

            if (canAddNow && inDeck > 0) {
              secondaryActions.push({
                label: `덱에서 1장 빼기 (${inDeck}/${maxCopy})`,
                variant: 'crimson',
                onClick: () => {
                  handleRemoveCardFromDeck(inspectCard.id);
                  showNotice(`[${inspectCard.name}] 카드를 덱에서 1장 뺐습니다.`);
                  setInspectCard(null);
                },
              });
            }
          } else if (inspectCard.rarity !== 'FREE') {
            primaryAction = {
              label: `카드 제작 (-${CRAFTING_COST[inspectCard.rarity]} 가루)`,
              variant: 'arcane',
              onClick: () => {
                const res = hsStorage.craftCard(inspectCard.id);
                if (res.ok) {
                  hsAudio.playSfx('purchase');
                  syncAll();
                  showNotice(`[${inspectCard.name}] 카드를 제작했습니다!`);
                } else {
                  showNotice(res.reason || '제작할 수 없습니다.');
                }
              },
            };
          } else {
            primaryAction = {
              label: '확인 (닫기)',
              variant: 'brass',
              onClick: () => setInspectCard(null),
            };
          }

          if (inspectCard.rarity !== 'FREE') {
            if (editingDeck && owned > 0) {
              secondaryActions.push({
                label: `추가 제작 (-${CRAFTING_COST[inspectCard.rarity]})`,
                variant: 'arcane',
                onClick: () => {
                  const res = hsStorage.craftCard(inspectCard.id);
                  if (res.ok) {
                    hsAudio.playSfx('purchase');
                    syncAll();
                    showNotice(`[${inspectCard.name}] 카드를 제작했습니다!`);
                  } else {
                    showNotice(res.reason || '제작 실패');
                  }
                },
              });
            }
            if (owned > 0) {
              secondaryActions.push({
                label: `마력 추출 (+${DISENCHANT_VALUE[inspectCard.rarity]} 가루)`,
                variant: 'brass',
                onClick: () => {
                  const res = hsStorage.disenchantCard(inspectCard.id);
                  if (res.ok) {
                    hsAudio.playSfx('cm_remove_card');
                    syncAll();
                    showNotice(`[${inspectCard.name}] 마력 추출 완료!`);
                  } else {
                    showNotice(res.reason || '추출 실패');
                  }
                },
              });
            }
          }

          return (
            <CardZoomModal
              card={inspectCard}
              rarityAura={inspectCard.rarity}
              subtitleBadge={
                editingDeck
                  ? `보유 ×${owned}장 · 덱 편성 ${inDeck}/${maxCopy}장`
                  : `보유 수량: ${owned}장`
              }
              showFlavor
              primaryAction={primaryAction}
              secondaryActions={secondaryActions}
              onCancel={() => setInspectCard(null)}
            />
          );
        })()}
    </div>
  );
};
