import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, HelpCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getFormattedCardName } from "../lib/utils";
import { Language, CardData, InventoryRecord, DatabaseCard, ViewType } from "../types";
import { CARD_DATABASE } from "../cardDatabase";
import { CardItem } from "../components/CardItem";
import { t } from "../lib/i18n";
import { getCardRarityRank } from "../lib/cardRarity";
import { PageHeader } from '../components/PageHeader';
import { ArCardViewer } from "../components/ArCardViewer";
import { toPng } from "html-to-image";
import { useGameSettings } from "../contexts/GameSettingsContext";
import { WikiCardDetailModal } from "../components/WikiCardDetailModal";
import { getCharacterIpProfile, getFactionDef, getAllFactions } from "../content/characterIpUtils";
import { ShareTemplateCard } from "../components/ShareTemplateCard";
import type { CharacterFaction, CharacterRarityTier } from "../types";
import { useCardSkins } from "../hooks/useCardSkins";
import { getSkinsForCard } from "../content/cardSkins";

interface WikiCardViewProps {
  onNavigate: (view: ViewType) => void;
  language: Language;
  ownedCards?: CardData[];
  inventory?: Record<number, InventoryRecord>;
}

const wikiCardHelpSteps = (lang: Language) => [
  t('wiki_how_to_play_1', lang),
  t('wiki_how_to_play_2', lang),
  t('wiki_how_to_play_3', lang),
];

export const WikiCardView: React.FC<WikiCardViewProps> = ({
  onNavigate,
  language,
  ownedCards = [],
  inventory = {},
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"id" | "name" | "power" | "rarity">("id");
  const [rarityFilter, setRarityFilter] = useState<CharacterRarityTier | "all">("all");
  const [factionFilter, setFactionFilter] = useState<CharacterFaction | "all">("all");
  const [selectedCard, setSelectedCard] = useState<DatabaseCard | null>(null);
  const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);
  const [downloadMode, setDownloadMode] = useState<'ally' | 'enemy' | null>(null);
  const printableCardRef = useRef<HTMLDivElement>(null);
  const [shareTemplateCardId, setShareTemplateCardId] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (showHelp) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [showHelp]);

  const [helpStep, setHelpStep] = useState(0);

  const { lowSpecMode } = useGameSettings();
  
  const currentSeason = typeof window !== 'undefined' 
    ? (localStorage.getItem('hero_current_season') || 'season1') 
    : 'season1';
  
  const cardSkins = useCardSkins(currentSeason);

  const helpSteps = wikiCardHelpSteps(language);

  const openCardDetail = (card: DatabaseCard) => {
    if (typeof window !== 'undefined') {
      const url = new URL('/wiki/card', window.location.origin);
      url.searchParams.set('cardId', String(card.id));
      window.history.pushState({}, '', `${url.pathname}${url.search}`);
      window.dispatchEvent(new Event('snshero:meta-refresh'));
    }

    setSelectedCard(card);
  };

  const closeCardDetail = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('cardId');
      window.history.replaceState({}, '', `${url.pathname}${url.search}`);
      window.dispatchEvent(new Event('snshero:meta-refresh'));
    }

    setSelectedCard(null);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let parsedCardId: number | null = null;
    const cardIdParam = new URLSearchParams(window.location.search).get('cardId');
    if (cardIdParam) {
      parsedCardId = Number(cardIdParam);
    } else {
      const storedId = sessionStorage.getItem('hero_wiki_target_card_id');
      if (storedId) {
        parsedCardId = Number(storedId);
        sessionStorage.removeItem('hero_wiki_target_card_id');
      }
    }

    if (parsedCardId && Number.isFinite(parsedCardId)) {
      const targetCard = CARD_DATABASE[parsedCardId];
      if (targetCard) {
        setSelectedCard(targetCard);
      }
    }
  }, []);

  const allCards = Object.values(CARD_DATABASE);
  const filteredCards = allCards.filter(
    (c) => {
      const matchesSearch =
        c.title_dis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (language === 'ko' && c.title.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRarity = rarityFilter === "all" || c.rarity === rarityFilter;
      const profile = getCharacterIpProfile(c.id);
      const matchesFaction = factionFilter === "all" || profile?.faction === factionFilter;
      return matchesSearch && matchesRarity && matchesFaction;
    },
  );

  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === "name") {
      const nameA = language === 'en' ? a.title_en : a.title;
      const nameB = language === 'en' ? b.title_en : b.title;
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

  const getWikiCardData = (card: DatabaseCard): CardData => ({
    id: `wiki-print-${card.id}`,
    power: card.power,
    imageIndex: Number(card.id),
    title: card.title,
    title_dis: card.title_dis,
    title_en: card.title_en,
    stats: card.stats,
    level: 1,
    rarity: card.rarity || "bronze",
    imageUrl: card.imageUrl,
    ability: card.ability,
    owner: null,
  });

  const escapeHtml = (value: string) => (
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  );

  const handlePrintCard = (mode?: 'ally' | 'enemy') => {
    if (!selectedCard || !printableCardRef.current) return;

    const printWindow = window.open("", "_blank", "width=720,height=960");
    if (!printWindow) return;

    const cardName = escapeHtml(getFormattedCardName(selectedCard, language));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((node) => node.outerHTML)
      .join("\n");
    const cardMarkup = printableCardRef.current.innerHTML;

    let overlayHtml = "";
    let overlayCss = "";
    if (mode === 'ally') {
      overlayHtml = `<div class="print-overlay-ally"></div>`;
      overlayCss = `
        .print-overlay-ally {
          position: absolute;
          inset: 0;
          background-color: rgba(59, 130, 246, 0.25);
          pointer-events: none;
          mix-blend-mode: multiply;
          border-radius: 12px;
          z-index: 50;
        }
      `;
    } else if (mode === 'enemy') {
      overlayHtml = `<div class="print-overlay-enemy"></div>`;
      overlayCss = `
        .print-overlay-enemy {
          position: absolute;
          inset: 0;
          background-color: rgba(239, 68, 68, 0.25);
          pointer-events: none;
          mix-blend-mode: multiply;
          border-radius: 12px;
          z-index: 50;
        }
      `;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${cardName}</title>
          ${styles}
          <style>
            @page { size: A4 portrait; margin: 14mm; }
            html, body {
              margin: 0;
              min-height: 100%;
              background: #ffffff;
              color: #0f172a;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }
            .print-card-sheet {
              width: 100%;
              min-height: calc(100vh - 28mm);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 20px;
            }
            .print-card-frame {
              width: 320px;
              aspect-ratio: 5 / 7;
              break-inside: avoid;
              page-break-inside: avoid;
              position: relative;
            }
            ${overlayCss}
            .print-footer-container {
              display: flex;
              flex-direction: row !important;
              align-items: center;
              justify-content: center;
              gap: 20px;
              margin-top: 20px;
              background-color: #ffffff !important;
              border: 1px solid #e2e8f0 !important;
              padding: 12px 24px;
              border-radius: 12px;
              min-width: 340px;
            }
            .logo-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .logo-text-gradient {
              background: linear-gradient(135deg, #4f46e5 0%, #d946ef 50%, #f43f5e 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              font-family: sans-serif;
              font-size: 26px;
              font-weight: 900;
              font-style: italic;
              letter-spacing: -0.05em;
              padding-right: 4px;
            }
            .logo-subtext {
              color: #0f172a;
              font-family: sans-serif;
              font-size: 14px;
              font-style: normal;
              font-weight: bold;
            }
            .qr-wrapper {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-image {
              width: 80px !important;
              height: 80px !important;
              display: block !important;
              border: 1px solid #e2e8f0;
              padding: 4px;
              background-color: #ffffff;
              border-radius: 6px;
            }
            .vertical-divider {
              width: 1px;
              height: 40px;
              background-color: #cbd5e1;
            }
          </style>
        </head>
        <body>
          <main class="print-card-sheet">
            <div class="print-card-frame">
              ${cardMarkup}
              ${overlayHtml}
            </div>
            ${mode === undefined ? `
            <div class="print-footer-container">
              <div class="logo-wrapper">
                <div style="display: flex; align-items: baseline; justify-content: center; gap: 2px;">
                  <span class="logo-text-gradient">S&SHERO</span>
                  <span class="logo-subtext">.com</span>
                </div>
              </div>
              <div class="vertical-divider"></div>
              <div class="qr-wrapper">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https%3A%2F%2Fsnshero.com" alt="Reward QR Code" class="qr-image" />
              </div>
            </div>
            ` : ''}
          </main>
          <script>
            const waitForImages = Promise.all(
              Array.from(document.images).map((img) => {
                if (img.complete && img.naturalWidth > 0) return Promise.resolve();
                return new Promise((resolve) => {
                  img.onload = resolve;
                  img.onerror = resolve;
                  setTimeout(resolve, 1200);
                });
              })
            );
            waitForImages.then(() => {
              setTimeout(() => {
                window.focus();
                window.print();
              }, 1500);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadCard = async (mode: 'ally' | 'enemy') => {
    if (!selectedCard || !printableCardRef.current) return;

    (window as any).downloadStatus = 'pending';
    (window as any).downloadError = null;

    setDownloadMode(mode);

    const targetEl = printableCardRef.current;
    
    const parentEl = targetEl.parentElement;
    const originalOpacity = parentEl ? parentEl.style.opacity : '';
    const originalLeft = parentEl ? parentEl.style.left : '';
    const originalZIndex = parentEl ? parentEl.style.zIndex : '';

    if (parentEl) {
      parentEl.style.opacity = '1';
      parentEl.style.left = '0px';
      parentEl.style.zIndex = '-9999';
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await Promise.race([
        toPng(targetEl, {
          cacheBust: false,
          skipFonts: true,
          pixelRatio: 2,
          backgroundColor: '#0f172a',
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }
        }),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('html-to-image render timeout')), 10000)
        )
      ]);

      const link = document.createElement('a');
      const cardName = getFormattedCardName(selectedCard, language);
      const isKo = language === 'ko';
      const suffix = mode === 'ally' 
        ? (isKo ? '앞면' : 'front') 
        : (isKo ? '뒷면' : 'back');
      link.download = `${cardName}_${suffix}.png`;
      link.href = dataUrl;
      link.click();

      (window as any).downloadStatus = 'success';
    } catch (error: any) {
      console.error('Error generating card image:', error);
      (window as any).downloadStatus = 'error';
      (window as any).downloadError = error?.message || String(error);
    } finally {
      setDownloadMode(null);

      if (parentEl) {
        parentEl.style.opacity = originalOpacity;
        parentEl.style.left = originalLeft;
        parentEl.style.zIndex = originalZIndex;
      }
    }
  };

  return (
    <div className="min-h-screen app-bg text-slate-800 font-sans pb-32 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-6">
        <PageHeader title={t('wiki_card_title', language)} onBack={() => onNavigate('home')} />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-slate-900">
              {t('wiki_card_index', language)}
            </h1>
            <button
              onClick={() => { setShowHelp(true); setHelpStep(0); }}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Help"
            >
              <HelpCircle size={16} className="text-slate-500" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-b border-slate-350 text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:border-slate-800 transition-colors py-0.5 text-slate-700 cursor-pointer"
            >
              <option value="id">{t('wiki_sort_index', language)}</option>
              <option value="name">{t('wiki_sort_name', language)}</option>
              <option value="power">{t('wiki_sort_power', language)}</option>
              <option value="rarity">{t('wiki_sort_rarity', language)}</option>
            </select>
            <div className="relative w-48 md:w-56">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder={t('wiki_search_cards', language)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200/85 rounded-lg text-xs font-medium placeholder:opacity-50 focus:outline-none focus:border-indigo-500 shadow-sm focus:shadow-md transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value as CharacterRarityTier | "all")}
            className="bg-white border border-slate-200/85 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500 shadow-sm cursor-pointer text-slate-700"
          >
            <option value="all">{t('wiki_filter_all', language)}</option>
            <option value="bronze">{t('rarity_bronze', language)}</option>
            <option value="silver">{t('rarity_silver', language)}</option>
            <option value="gold">{t('rarity_gold', language)}</option>
            <option value="platinum">{t('rarity_platinum', language)}</option>
            <option value="diamond">{t('rarity_diamond', language)}</option>
            <option value="legendary">{t('rarity_legendary', language)}</option>
          </select>
          <select
            value={factionFilter}
            onChange={(e) => setFactionFilter(e.target.value as CharacterFaction | "all")}
            className="bg-white border border-slate-200/85 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500 shadow-sm cursor-pointer text-slate-700"
          >
            <option value="all">{t('wiki_filter_all', language)}</option>
            {getAllFactions().map((f) => {
              const def = getFactionDef(f);
              return (
                <option key={f} value={f}>
                  {def ? t(def.nameKey, language) : f}
                </option>
              );
            })}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedCards.map((card) => {
            const displayCard = {
              id: `wiki_${card.id}`,
              power: card.power,
              imageIndex: Number(card.id),
              title: card.title,
              title_dis: card.title_dis,
              title_en: card.title_en,
              stats: card.stats,
              level: 1,
              exp: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              hp: 100,
              rarity: card.rarity || "normal",
              imageUrl: card.imageUrl,
              ability: card.ability,
            };

            return (
              <div 
                key={card.id} 
                onClick={() => openCardDetail(card)}
                className="group relative flex gap-4 p-4 rounded-lg border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-slate-200/85 transition-all duration-300 overflow-hidden cursor-pointer active:scale-98"
              >
                <div className="w-20 sm:w-24 shrink-0 relative z-10">
                  <CardItem
                    card={displayCard}
                    className="w-full aspect-[5/7] shadow-lg"
                    isLocked={false}
                    lowSpecMode={true}
                    ignoreBonuses={true}
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10">
                  <h3 className="text-base font-bold text-slate-800 tracking-tight uppercase leading-tight mb-2 truncate">
                    {getFormattedCardName(card, language)}
                  </h3>

                  <div className="flex gap-1.5">
                    {['N', 'E', 'S', 'W'].map((dir, i) => (
                      <div key={dir} className="flex flex-col items-center">
                        <span className="text-[7px] font-bold text-slate-400 leading-none mb-0.5">{dir}</span>
                        <span className="text-[11px] font-semibold bg-slate-50 border border-slate-100 rounded-lg w-6.5 h-6.5 flex items-center justify-center text-slate-800">
                          {card.stats[i]}
                        </span>
                      </div>
                    ))}
                    <div className="flex flex-col items-center ml-1">
                      <span className="text-[7px] font-bold text-indigo-500 leading-none mb-0.5">CP</span>
                      <span className="text-[11px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg w-9 h-6.5 flex items-center justify-center shadow-xs">
                        {card.power}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {sortedCards.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm font-semibold opacity-50 uppercase tracking-widest text-slate-500">
              {t('wiki_no_cards_match', language)}
            </div>
          )}
        </div>
      </div>

      {selectedCard && (
        <WikiCardDetailModal
          selectedCard={selectedCard}
          language={language}
          lowSpecMode={lowSpecMode}
          initialTab="art"
          onClose={closeCardDetail}
          onNavigate={onNavigate}
          onSelectCard={openCardDetail}
          onOpenViewer={() => setIs3DViewerOpen(true)}
          onPrintCard={handlePrintCard}
          onDownloadCard={handleDownloadCard}
          onOpenShareTemplate={selectedCard ? () => setShareTemplateCardId(selectedCard.id) : undefined}
          season={currentSeason}
          availableSkins={getSkinsForCard(selectedCard.id, currentSeason)}
          isSkinUnlocked={cardSkins.isSkinUnlocked}
          isSkinActive={cardSkins.isSkinActive}
          onApplySkin={cardSkins.applySkin}
          onRemoveSkin={cardSkins.removeSkin}
        />
      )}

      {selectedCard && (
        <div className="fixed -left-[9999px] top-0 w-[280px] aspect-[5/7] pointer-events-none opacity-0" aria-hidden="true">
          <div ref={printableCardRef} className="w-full h-full">
            <CardItem
              card={getWikiCardData(selectedCard)}
              className="w-full h-full"
              isLocked={true}
              lowSpecMode={false}
              ignoreBonuses={true}
              downloadMode={downloadMode}
            />
          </div>
        </div>
      )}

      {/* 3D VR Card Viewer Modal */}
      {is3DViewerOpen && selectedCard && (
        <ArCardViewer
          isOpen={is3DViewerOpen}
          onClose={() => setIs3DViewerOpen(false)}
          language={language}
          ownedCards={ownedCards}
          inventory={inventory}
          showCameraPreview={false}
          initialCard={{
            id: selectedCard.id,
            power: selectedCard.power,
            imageIndex: selectedCard.id,
            title: selectedCard.title,
            title_dis: selectedCard.title_dis,
            title_en: selectedCard.title_en,
            stats: selectedCard.stats,
            level: 1,
            hp: 100,
            rarity: selectedCard.rarity || 'bronze',
            imageUrl: selectedCard.imageUrl
          }}
        />
      )}

      {/* Share Template Modal */}
      <AnimatePresence>
        {shareTemplateCardId !== null && (
          <ShareTemplateCard
            templateType="character"
            language={language}
            cardId={shareTemplateCardId}
            lowSpecMode={lowSpecMode}
            onClose={() => setShareTemplateCardId(null)}
            showToast={(msg) => {
              console.log(msg);
            }}
          />
        )}
      </AnimatePresence>

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
                  {language === 'ko' ? '카드 도감 도움말' : 'Card Wiki Help'}
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
