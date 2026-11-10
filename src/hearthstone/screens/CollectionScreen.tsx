import React, { useEffect, useMemo, useState } from 'react';
import { hsAudio } from '../audio';
import {
  CRAFTING_COST,
  DISENCHANT_VALUE,
  cardDb,
  getCardTileUrl,
  getHeroArtUrl,
} from '../cardDb';
import { HearthstoneCard, RACE_KO } from '../components/CardVisual';
import { hsStorage } from '../storage';
import {
  CLASSIC_HEROES,
  CardClass,
  ClassicCardDef,
  CustomDeck,
  HERO_CLASS_ORDER,
  HeroClass,
} from '../types';

export const CollectionScreen: React.FC<{
  onBack: () => void;
  onProfileChanged: () => void;
}> = ({ onBack, onProfileChanged }) => {
  const [collection, setCollection] = useState(() => hsStorage.getCollection());
  const [decks, setDecks] = useState<CustomDeck[]>(() => hsStorage.getDecks());
  const [profile, setProfile] = useState(() => hsStorage.getProfile());

  const [activeTab, setActiveTab] = useState<CardClass>('MAGE');
  const [manaFilter, setManaFilter] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [craftingMode, setCraftingMode] = useState(true);
  const [page, setPage] = useState(0);

  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [creatingClassPicker, setCreatingClassPicker] = useState(false);
  const [inspectCard, setInspectCard] = useState<ClassicCardDef | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    hsAudio.playBgm('collection');
  }, []);

  const syncAll = () => {
    setCollection(hsStorage.getCollection());
    setDecks(hsStorage.getDecks());
    setProfile(hsStorage.getProfile());
    onProfileChanged();
  };

  const showNotice = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2600);
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
        if (q) {
          const raceKo = c.race ? RACE_KO[c.race] || '' : '';
          const hay = `${c.name} ${c.text} ${raceKo} ${c.rarity}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name, 'ko'));
  }, [activeTab, craftingMode, collection, manaFilter, searchQuery, editingDeck]);

  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageCards = filteredCards.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const handleAddCardToDeck = (card: ClassicCardDef) => {
    if (!editingDeck) {
      setInspectCard(card);
      hsAudio.playSfx('card_hover', 0.65);
      return;
    }
    const owned = collection[card.id] || 0;
    if (owned <= 0) {
      setInspectCard(card);
      showNotice('보유하지 않은 카드입니다. 제작 창에서 가루로 제작할 수 있습니다!');
      return;
    }
    if (editingDeck.cards.length >= 30) {
      showNotice('덱이 이미 30장으로 가득 찼습니다!');
      return;
    }
    const inDeckCount = editingDeck.cards.filter((cid) => cid === card.id).length;
    const maxCopy = card.rarity === 'LEGENDARY' ? 1 : 2;
    if (inDeckCount >= maxCopy) {
      showNotice(
        card.rarity === 'LEGENDARY'
          ? '전설 카드는 덱에 1장만 넣을 수 있습니다!'
          : '같은 카드는 덱에 최대 2장까지 넣을 수 있습니다!',
      );
      return;
    }
    if (inDeckCount >= owned) {
      showNotice(`현재 이 카드를 ${owned}장만 보유하고 있습니다.`);
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
        // Prefer class cards first, then balanced mana curve (2~5 cost)
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
    showNotice(`덱이 ${current.length}/30장으로 자동 완성되었습니다!`);
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

  // Grouped cards inside editingDeck + Mana Curve
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
    <div className="relative flex h-[100dvh] w-full select-none flex-col overflow-hidden bg-gradient-to-b from-[#2b1b0f] via-[#1c1109] to-[#110a05] text-amber-100">
      {/* Top Leather Toolbar */}
      <header className="z-20 flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-[#9f7b42] bg-gradient-to-b from-[#442c18] to-[#26170c] px-4 py-2.5 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('box_close');
              hsAudio.playBgm('tavern_hub');
              onBack();
            }}
            className="rounded-xl border-2 border-[#dbb66b] bg-gradient-to-b from-[#694322] to-[#341f0e] px-3.5 py-1.5 text-xs font-extrabold text-amber-100 shadow hover:brightness-110 sm:text-sm"
          >
            ← 여관 상자로
          </button>
          <div>
            <h1 className="hs-title text-lg font-extrabold text-amber-200 sm:text-xl">
              📕 내 카드첩 (수집: {ownedUniqueCount} / 382종)
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-xl border border-sky-400/50 bg-sky-950/80 px-3 py-1 text-xs font-extrabold text-sky-200">
            🧪 신비한 가루: <span className="hs-num text-sm text-white">{profile.arcaneDust}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              const res = hsStorage.massDisenchantExtras();
              if (res.count > 0) {
                hsAudio.playSfx('purchase');
                syncAll();
                showNotice(`여분 카드 ${res.count}장을 추출하여 +${res.dustGained} 가루를 획득했습니다!`);
              } else {
                showNotice('추출할 여분(3장 이상 중복) 카드가 없습니다.');
              }
            }}
            className="rounded-xl border border-sky-400/60 bg-slate-900 px-3 py-1.5 text-xs font-bold text-sky-200 hover:bg-slate-800"
          >
            여분 일괄 추출
          </button>

          <button
            type="button"
            onClick={() => {
              hsStorage.unlockMasterCollection();
              hsAudio.playSfx('pack_legendary');
              syncAll();
              showNotice('오리지널 수집 카드 382종 전체 해금 완료!');
            }}
            className="rounded-xl border border-yellow-300 bg-gradient-to-b from-amber-500 to-amber-800 px-3 py-1.5 text-xs font-extrabold text-white shadow hover:brightness-110"
          >
            👑 382종 전체해금
          </button>
        </div>
      </header>

      {toast && (
        <div className="pointer-events-none fixed left-1/2 top-16 z-[100] -translate-x-1/2 rounded-2xl border-2 border-yellow-300 bg-stone-950/95 px-5 py-2 text-xs font-extrabold text-yellow-200 shadow-2xl">
          {toast}
        </div>
      )}

      {/* Main Split Layout: Leather Book (Left) + Deck Tray (Right) */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12">
        {/* Left 9 Columns: Open Leather Tome */}
        <section className="flex min-h-0 flex-col p-3 lg:col-span-9">
          {/* Class Bookmarks */}
          <div className="mb-2 flex flex-wrap gap-1">
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
                  className={`rounded-t-xl border-x-2 border-t-2 px-3 py-1.5 text-xs font-extrabold transition ${
                    active
                      ? 'border-[#e5c176] bg-[#e9d8b4] text-stone-950 shadow'
                      : disabled
                        ? 'cursor-not-allowed border-stone-800 bg-stone-950/40 text-stone-600'
                        : 'border-[#7c5b30] bg-[#3b2614] text-amber-200 hover:bg-[#51351d]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Parchment Tome Spread */}
          <div className="relative flex min-h-0 flex-1 flex-col justify-between rounded-b-3xl rounded-tr-3xl border-[4px] border-[#b78f49] bg-gradient-to-r from-[#e5d3ad] via-[#f2e5c7] to-[#e2cfa6] p-3 text-stone-900 shadow-[inset_0_0_40px_rgba(88,56,22,0.45)] sm:p-4">
            {/* Page Turn Left/Right Buttons */}
            {safePage > 0 && (
              <button
                type="button"
                onClick={() => {
                  hsAudio.playSfx('card_flip', 0.8);
                  setPage((p) => Math.max(0, p - 1));
                }}
                className="hs-num absolute left-1.5 top-1/2 z-30 flex h-12 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-amber-900 bg-amber-200/95 text-xl text-amber-950 shadow-xl hover:scale-110"
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
                className="hs-num absolute right-1.5 top-1/2 z-30 flex h-12 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-amber-900 bg-amber-200/95 text-xl text-amber-950 shadow-xl hover:scale-110"
              >
                ▶
              </button>
            )}

            {/* 8-Card Spread Grid (2x4) */}
            <div className="grid flex-1 grid-cols-2 place-items-center gap-y-3 overflow-y-auto px-5 py-1 sm:grid-cols-4">
              {pageCards.map((card) => {
                const owned = collection[card.id] || 0;
                return (
                  <div
                    key={card.id}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setInspectCard(card);
                    }}
                    className="flex flex-col items-center"
                  >
                    <div className={owned === 0 ? 'opacity-55 saturate-50' : ''}>
                      <HearthstoneCard
                        card={card}
                        size="SM"
                        enableTilt
                        onClick={() => handleAddCardToDeck(card)}
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          owned > 0
                            ? 'bg-amber-900 text-amber-100'
                            : 'bg-sky-900/80 text-sky-100'
                        }`}
                      >
                        {owned > 0 ? `보유 ×${owned}` : '미보유'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          hsAudio.playSfx('ui_click', 0.6);
                          setInspectCard(card);
                        }}
                        className="rounded-full border border-amber-900/50 bg-[#fdf6e4] px-2 py-0.5 text-[10px] font-bold text-amber-950 hover:bg-amber-200"
                      >
                        제작/상세
                      </button>
                    </div>
                  </div>
                );
              })}
              {pageCards.length === 0 && (
                <div className="col-span-full py-16 text-center text-sm font-bold text-stone-600">
                  조건에 일치하는 카드가 없습니다.
                </div>
              )}
            </div>

            {/* Bottom Filter Bar: Mana Crystals + Search + Crafting Toggle */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-amber-900/25 pt-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setManaFilter('ALL');
                    setPage(0);
                  }}
                  className={`rounded-lg px-2 py-1 text-xs font-extrabold ${
                    manaFilter === 'ALL'
                      ? 'bg-sky-700 text-white'
                      : 'bg-amber-900/20 text-stone-800'
                  }`}
                >
                  전체
                </button>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      hsAudio.playSfx('ui_click', 0.5);
                      setManaFilter(manaFilter === m ? 'ALL' : m);
                      setPage(0);
                    }}
                    className={`hs-num flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                      manaFilter === m
                        ? 'scale-110 border-sky-200 bg-sky-600 text-white shadow'
                        : 'border-sky-900/40 bg-sky-950/80 text-sky-200'
                    }`}
                  >
                    {m === 7 ? '7+' : m}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder="카드명 · 효과 · 종족 검색..."
                  className="w-40 rounded-xl border border-amber-900/50 bg-[#fcf6e8] px-3 py-1 text-xs font-bold text-stone-900 placeholder:text-stone-400 sm:w-52"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCraftingMode((v) => !v);
                    setPage(0);
                  }}
                  className={`rounded-xl border px-2.5 py-1 text-xs font-extrabold ${
                    craftingMode
                      ? 'border-sky-400 bg-sky-800 text-white'
                      : 'border-amber-900/50 bg-amber-900/20 text-stone-800'
                  }`}
                >
                  {craftingMode ? '전체 보기 (382종)' : '보유만 보기'}
                </button>
                <span className="text-xs font-extrabold text-stone-700">
                  {safePage + 1} / {totalPages}쪽
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Right 3 Columns: Deck List OR Active Deck Editor Tray */}
        <aside className="flex min-h-0 flex-col border-l-[3px] border-[#9f7b42] bg-gradient-to-b from-[#2f1d10] to-[#170e07] p-3 lg:col-span-3">
          {!editingDeck ? (
            <>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="hs-title text-base font-extrabold text-amber-200">
                  보유 덱 목록 ({decks.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setCreatingClassPicker((v) => !v)}
                  className="rounded-xl border border-emerald-300 bg-emerald-700 px-2.5 py-1 text-xs font-extrabold text-white hover:bg-emerald-600"
                >
                  + 새 덱 만들기
                </button>
              </div>

              {creatingClassPicker && (
                <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl border border-amber-400/50 bg-black/50 p-2">
                  {HERO_CLASS_ORDER.map((hc) => (
                    <button
                      key={hc}
                      type="button"
                      onClick={() => handleCreateDeck(hc)}
                      className="rounded-lg bg-amber-800/80 py-1.5 text-[11px] font-extrabold text-white hover:bg-amber-600"
                    >
                      {CLASSIC_HEROES[hc].classNameKo}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {decks.map((d) => {
                  const dh = CLASSIC_HEROES[d.heroClass];
                  return (
                    <div
                      key={d.id}
                      style={{ background: dh.frameGradient }}
                      className="flex items-center justify-between rounded-xl border-2 border-amber-400/50 p-2 shadow"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          hsAudio.playSfx('box_tray_out', 0.7);
                          setEditingDeckId(d.id);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      >
                        <img
                          src={getHeroArtUrl(dh.heroId)}
                          alt={dh.nameKo}
                          className="h-10 w-10 rounded-full border border-amber-200 object-cover object-top"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-xs font-extrabold text-white">
                            {d.name}
                          </div>
                          <div className="text-[10px] font-bold text-amber-200">
                            {dh.classNameKo} · {d.cards.length}/30장
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDeck(d.id)}
                        title="덱 삭제"
                        className="ml-1 rounded-lg bg-red-950/80 px-2 py-1 text-xs font-bold text-red-200 hover:bg-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Active 30-Card Deck Builder View */
            <>
              <div className="mb-2 rounded-xl border-2 border-amber-400/60 bg-black/45 p-2.5">
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
                  className="w-full bg-transparent text-sm font-extrabold text-amber-100 outline-none"
                />
                <div className="mt-0.5 flex items-center justify-between text-[11px] text-amber-300">
                  <span>{CLASSIC_HEROES[editingDeck.heroClass].classNameKo} 덱</span>
                  <span
                    className={
                      editingDeck.cards.length === 30
                        ? 'font-extrabold text-emerald-300'
                        : 'font-extrabold text-yellow-300'
                    }
                  >
                    {editingDeck.cards.length} / 30장
                  </span>
                </div>

                {/* Mana Curve Mini Histogram */}
                <div className="mt-2 flex h-12 items-end gap-1 border-t border-amber-700/40 pt-2">
                  {deckGrouped.curve.map((cnt, costBucket) => {
                    const maxBar = Math.max(6, ...deckGrouped.curve);
                    const hPct = Math.round((cnt / maxBar) * 100);
                    return (
                      <div key={costBucket} className="flex flex-1 flex-col items-center">
                        <div className="flex h-7 w-full items-end rounded-t bg-stone-900/90">
                          <div
                            style={{ height: `${hPct}%` }}
                            className="w-full rounded-t bg-sky-400"
                          />
                        </div>
                        <span className="mt-0.5 text-[9px] font-bold text-sky-200">
                          {costBucket === 7 ? '7+' : costBucket}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card Tile Bars inside Deck */}
              <div className="flex-1 space-y-1 overflow-y-auto pr-1">
                {deckGrouped.entries.map(({ card, count }) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleRemoveCardFromDeck(card.id)}
                    title="클릭하여 1장 빼기"
                    className="group relative flex w-full items-center justify-between overflow-hidden rounded-lg border border-amber-500/40 bg-stone-900 px-2 py-1 text-left shadow hover:border-red-400"
                  >
                    <img
                      src={getCardTileUrl(card.artId)}
                      alt=""
                      className="pointer-events-none absolute right-0 top-0 h-full w-28 object-cover opacity-45"
                    />
                    <div className="relative z-10 flex min-w-0 items-center gap-2">
                      <span className="hs-num flex h-5 w-5 shrink-0 items-center justify-center rounded bg-sky-600 text-xs text-white">
                        {card.cost}
                      </span>
                      <span className="truncate text-xs font-bold text-white">
                        {card.name}
                      </span>
                    </div>
                    <span className="hs-num relative z-10 ml-1 text-xs text-amber-300">
                      {card.rarity === 'LEGENDARY' ? '★' : count > 1 ? `×${count}` : ''}
                    </span>
                  </button>
                ))}
                {deckGrouped.entries.length === 0 && (
                  <div className="py-8 text-center text-xs text-amber-200/60">
                    왼쪽 카드첩에서 카드를 클릭해 30장을 채우거나 [자동 완성]을 누르세요!
                  </div>
                )}
              </div>

              <div className="mt-2 flex gap-2 pt-1">
                {editingDeck.cards.length < 30 && (
                  <button
                    type="button"
                    onClick={handleAutoCompleteDeck}
                    className="flex-1 rounded-xl border border-sky-300 bg-sky-700 py-2 text-xs font-extrabold text-white hover:bg-sky-600"
                  >
                    ✨ 자동 완성
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    hsAudio.playSfx('box_tray_in', 0.75);
                    setEditingDeckId(null);
                  }}
                  className="flex-1 rounded-xl border-2 border-amber-200 bg-gradient-to-b from-emerald-500 to-emerald-800 py-2 text-xs font-extrabold text-white shadow"
                >
                  완료 ✔
                </button>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Card Detail + Arcane Dust Crafting / Disenchanting Modal */}
      {inspectCard && (
        <div
          onClick={() => setInspectCard(null)}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-xl flex-col items-center gap-6 rounded-3xl border-[4px] border-[#d2ac62] bg-gradient-to-b from-[#392515] to-[#1a1008] p-6 sm:flex-row"
          >
            <HearthstoneCard card={inspectCard} size="LG" enableTilt />

            <div className="flex flex-1 flex-col justify-between text-amber-100">
              <div>
                <div className="text-xs font-extrabold text-sky-300">
                  등급: {inspectCard.rarity} · 보유 수량: {collection[inspectCard.id] || 0}장
                </div>
                <h3 className="hs-title mt-1 text-xl font-extrabold text-white">
                  {inspectCard.name}
                </h3>
                {inspectCard.flavor && (
                  <p className="mt-3 rounded-xl border border-amber-600/30 bg-[#f5e8c8] p-3 text-xs italic text-stone-800">
                    “{inspectCard.flavor.replace(/<[^>]+>/g, '')}”
                  </p>
                )}
              </div>

              {inspectCard.rarity !== 'FREE' ? (
                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      const res = hsStorage.craftCard(inspectCard.id);
                      if (res.ok) {
                        hsAudio.playSfx('purchase');
                        syncAll();
                        showNotice(`[${inspectCard.name}] 카드를 제작했습니다!`);
                      } else {
                        showNotice(res.reason || '제작 실패');
                      }
                    }}
                    className="w-full rounded-xl border-2 border-sky-300 bg-gradient-to-b from-sky-500 to-blue-800 py-2.5 text-xs font-extrabold text-white shadow hover:brightness-110"
                  >
                    🧪 제작하기 (-{CRAFTING_COST[inspectCard.rarity]} 가루)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const res = hsStorage.disenchantCard(inspectCard.id);
                      if (res.ok) {
                        hsAudio.playSfx('cm_remove_card');
                        syncAll();
                        showNotice(`[${inspectCard.name}] 마력 추출 완료!`);
                      } else {
                        showNotice(res.reason || '추출 실패');
                      }
                    }}
                    className="w-full rounded-xl border border-red-400/70 bg-red-950/80 py-2 text-xs font-bold text-red-200 hover:bg-red-900"
                  >
                    마력 추출 (+{DISENCHANT_VALUE[inspectCard.rarity]} 가루)
                  </button>
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-black/40 p-2.5 text-xs text-amber-200/80">
                  영웅 기본(Basic) 카드로 모든 플레이어에게 기본 2장씩 제공됩니다.
                </div>
              )}

              <button
                type="button"
                onClick={() => setInspectCard(null)}
                className="mt-3 w-full rounded-xl border border-amber-400/60 bg-stone-800 py-2 text-xs font-bold text-amber-100"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
