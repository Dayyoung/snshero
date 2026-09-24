import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Swords, Edit2, Search, X, Plus, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { CardData, Language } from "../types";
import { CARD_DATABASE } from "../cardDatabase";
import { CardItem } from "../components/CardItem";
import { PageHeader } from "../components/PageHeader";
import { t } from "../lib/i18n";
import { getCardRarityRank } from "../lib/cardRarity";

interface PlaygroundViewProps {
  currentDeck: CardData[];
  onPlay: (playgroundDeck: CardData[]) => void;
  language: Language;
  onBack: () => void;
  playSfx: (url: string) => void;
}

const playgroundHelpSteps = (lang: Language) => [
  lang === "ko"
    ? "플레이그라운드는 가상 덱으로 AI 상대와 대결하는 연습 모드입니다. 실제 전적에 영향을 주지 않습니다."
    : "Playground is a practice mode where you battle AI opponents with a virtual deck. It does not affect your record.",
  lang === "ko"
    ? "덱 편집 버튼을 눌러 카드 슬롯을 선택한 후, 아래 카드 목록에서 원하는 카드를 골라 덱을 구성하세요."
    : "Press Edit Deck, select a slot, then pick a card from the list below to build your deck.",
  lang === "ko"
    ? "덱이 완성되면 PLAY 버튼을 눌러 대결을 시작하세요. 5장 모두 채워야 플레이할 수 있습니다."
    : "Once your deck is complete, press PLAY to start. All 5 slots must be filled.",
];

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  currentDeck,
  onPlay,
  language,
  onBack,
  playSfx,
}) => {
  const [playgroundDeck, setPlaygroundDeck] = useState<CardData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"id" | "name" | "power" | "rarity">("id");
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
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
  const helpSteps = playgroundHelpSteps(language);

  // Load playground deck from local storage or clone main deck
  useEffect(() => {
    const saved = localStorage.getItem("hero_playground_deck");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5) {
          setPlaygroundDeck(parsed);
          return;
        }
      } catch (e) {
        console.error("Failed to parse playground deck from local storage", e);
      }
    }

    // Default: copy actual deck (pad with empty CardData if currentDeck has less than 5 cards)
    const cloned = currentDeck.map((c) => ({ ...c }));
    while (cloned.length < 5) {
      cloned.push({
        id: `empty-${Date.now()}-${cloned.length}`,
        title_dis: "Empty Slot",
        title: "빈 슬롯",
        stats: [0, 0, 0, 0],
        owner: null,
        rarity: "normal",
        level: 1,
      });
    }
    // Limit to 5 cards
    const initialDeck = cloned.slice(0, 5);
    setPlaygroundDeck(initialDeck);
    localStorage.setItem("hero_playground_deck", JSON.stringify(initialDeck));
  }, [currentDeck]);

  const saveDeckToLocalStorage = (deck: CardData[]) => {
    setPlaygroundDeck(deck);
    localStorage.setItem("hero_playground_deck", JSON.stringify(deck));
  };

  const handleSelectCard = (dbCardId: number) => {
    const dbCard = CARD_DATABASE[dbCardId];
    if (!dbCard) return;

    playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");

    // Format display card data matching CardData definition
    const displayCard: CardData = {
      id: `playground_${dbCard.id}_${Date.now()}`,
      power: dbCard.power,
      imageIndex: Number(dbCard.id),
      title: dbCard.title,
      title_dis: dbCard.title_dis,
      title_en: dbCard.title_en,
      stats: dbCard.stats,
      level: 1,
      exp: 0,
      rarity: dbCard.rarity || "normal",
      imageUrl: dbCard.imageUrl,
      ability: dbCard.ability,
      owner: null,
    };

    let targetIdx = selectedSlotIndex;

    // If no slot is explicitly selected, find the first empty slot or default to 0
    if (targetIdx === null) {
      targetIdx = playgroundDeck.findIndex((c) => !c.imageIndex || c.imageIndex === 0);
      if (targetIdx === -1) {
        targetIdx = 0; // Replace first card if deck is full
      }
    }

    const newDeck = [...playgroundDeck];
    newDeck[targetIdx] = displayCard;
    saveDeckToLocalStorage(newDeck);

    // Auto move selection to next slot
    if (selectedSlotIndex !== null && selectedSlotIndex < 4) {
      setSelectedSlotIndex(selectedSlotIndex + 1);
    } else {
      setSelectedSlotIndex(null);
    }
  };

  const handleRemoveCard = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    playSfx("https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3");

    const newDeck = [...playgroundDeck];
    newDeck[index] = {
      id: `empty-${Date.now()}-${index}`,
      title_dis: "Empty Slot",
      title: "빈 슬롯",
      stats: [0, 0, 0, 0],
      owner: null,
      rarity: "normal",
      level: 1,
    };
    saveDeckToLocalStorage(newDeck);
  };

  const handlePlay = () => {
    const isDeckValid = playgroundDeck.every((c) => c.imageIndex && c.imageIndex > 0);
    if (!isDeckValid) {
      playSfx("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3");
      return;
    }
    playSfx("https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3");
    onPlay(playgroundDeck);
  };

  const allCards = Object.values(CARD_DATABASE);
  const filteredCards = allCards.filter(
    (c) =>
      c.title_dis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (language === "ko" && c.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === "name") {
      const nameA = language === "en" ? a.title_en : a.title;
      const nameB = language === "en" ? b.title_en : b.title;
      return nameA.localeCompare(nameB);
    }
    if (sortBy === "power") {
      return (b.power || 0) - (a.power || 0);
    }
    if (sortBy === "rarity") {
      const rankA = getCardRarityRank(a.rarity);
      const rankB = getCardRarityRank(b.rarity);
      if (rankA !== rankB) return rankB - rankA;
      return (b.power || 0) - (a.power || 0);
    }
    return a.id - b.id;
  });

  const isPlayable = playgroundDeck.length === 5 && playgroundDeck.every((c) => c.imageIndex && c.imageIndex > 0);

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-32 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <PageHeader
          title={t("playground", language)}
          onBack={onBack}
          rightAction={
            <button
              onClick={() => { setShowHelp(true); setHelpStep(0); }}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
              aria-label="Help"
            >
              <HelpCircle size={14} className="text-slate-500" />
            </button>
          }
        />

        {/* Playground Deck Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => {
                playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                setIsEditing(!isEditing);
                setSelectedSlotIndex(null);
              }}
              className={cn(
                "px-3.5 py-2 border rounded-lg font-bold text-xs uppercase flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95",
                isEditing
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10 hover:bg-indigo-700"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              )}
            >
              <Edit2 size={13} />
              {t("playground_edit_deck", language)}
            </button>
            {/* Sort selector - always visible for minimal access */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-[11px] font-bold text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-colors cursor-pointer"
            >
              <option value="id">Index</option>
              <option value="name">Name</option>
              <option value="power">CP</option>
              <option value="rarity">Rarity</option>
            </select>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {playgroundDeck.map((card, idx) => {
              const isEmpty = !card.imageIndex || card.imageIndex === 0;
              const isSelected = selectedSlotIndex === idx;

              return (
                <div
                  key={card.id || idx}
                  onClick={() => {
                    if (isEditing) {
                      playSfx("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
                      setSelectedSlotIndex(isSelected ? null : idx);
                    }
                  }}
                  className={cn(
                    "aspect-[5/7] rounded-lg relative border transition-all duration-300 flex flex-col items-center justify-center overflow-hidden",
                    isEmpty ? "border-dashed border-slate-200 bg-slate-50/50" : "border-slate-100 bg-white shadow-xs",
                    isEditing ? "cursor-pointer hover:scale-[1.03] hover:shadow-sm" : "",
                    isSelected ? "ring-2 ring-indigo-600/20 border-indigo-600 scale-[1.03]" : "border-slate-100"
                  )}
                >
                  {isEmpty ? (
                    <Plus size={18} className="opacity-20 text-slate-400" />
                  ) : (
                    <>
                      <CardItem
                        card={card}
                        className="w-full h-full"
                        isLocked={false}
                      />
                      {isEditing && (
                        <button
                          onClick={(e) => handleRemoveCard(idx, e)}
                          className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-md border border-white hover:bg-red-600 transition-colors z-30 shadow-md cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Play Action Button */}
        <div className="mb-6">
          <button
            onClick={handlePlay}
            disabled={!isPlayable}
            className={cn(
              "w-full py-4 rounded-lg font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-3 transition-all",
              isPlayable
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-orange-500/10 cursor-pointer active:scale-[0.99]"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
            )}
          >
            <Swords size={22} />
            {t("playground_play", language)}
          </button>
        </div>

        {/* Deck Customization Panel (Rendered only when editing is true) */}
        {isEditing && (
          <div className="border border-slate-100 rounded-lg bg-white p-5 shadow-sm animate-in slide-in-from-bottom duration-300">
            {/* Search Input */}
            <div className="relative mb-5">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t("wiki_search_cards", language)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold placeholder:opacity-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
              />
            </div>

            {/* Grid of All Cards */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto pr-2 border-t border-slate-100 pt-4">
              {sortedCards.map((card) => {
                const displayCard = {
                  id: `db_${card.id}`,
                  power: card.power,
                  imageIndex: Number(card.id),
                  title: card.title,
                  title_dis: card.title_dis,
                  title_en: card.title_en,
                  stats: card.stats,
                  level: 1,
                  exp: 0,
                  rarity: card.rarity || "normal",
                  imageUrl: card.imageUrl,
                  ability: card.ability,
                  owner: null,
                };

                const isAlreadyInDeck = playgroundDeck.some((c) => c.imageIndex === card.id);

                return (
                  <div
                    key={card.id}
                    onClick={() => handleSelectCard(card.id)}
                    className={cn(
                      "aspect-[5/7] rounded-xl border border-slate-100 bg-white overflow-hidden cursor-pointer transition-all hover:scale-[1.03] relative shadow-xs hover:shadow-sm",
                      isAlreadyInDeck ? "ring-2 ring-yellow-400 border-yellow-400 opacity-70" : ""
                    )}
                  >
                    <CardItem
                      card={displayCard}
                      className="w-full h-full"
                      isLocked={false}
                    />
                  </div>
                );
              })}

              {sortedCards.length === 0 && (
                <div className="col-span-full py-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {t("wiki_no_cards_match", language)}
                </div>
              )}
            </div>
          </div>
        )}
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
                  {t("playground", language)}
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

export default PlaygroundView;
