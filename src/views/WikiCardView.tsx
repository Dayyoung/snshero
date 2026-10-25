import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, HelpCircle, X, ChevronLeft, ChevronRight, Trophy, Watch } from "lucide-react";
import { getFormattedCardName, cn } from "../lib/utils";
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
import { WatchFaceModal } from "../components/WatchFaceModal";
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
  // ID 437: Top Stat Leaderboard Filter
  const [topStatFilter, setTopStatFilter] = useState<'all' | 'fire_atk' | 'water_def' | 'wind_spd' | 'earth_hp'>('all');
  // ID 444: Virtual Window Limit
  const [visibleLimit, setVisibleLimit] = useState<number>(24);
  const [selectedCard, setSelectedCard] = useState<DatabaseCard | null>(null);

  const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);
  const [downloadMode, setDownloadMode] = useState<'ally' | 'enemy' | null>(null);
  const printableCardRef = useRef<HTMLDivElement>(null);
  const [shareTemplateCardId, setShareTemplateCardId] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isWatchFaceOpen, setIsWatchFaceOpen] = useState(false);
  const [watchFaceInitialCard, setWatchFaceInitialCard] = useState<DatabaseCard | null>(null);

  // ID 528: 카드 수집 도감 테마 세트 완성 트랙
  const [claimedSets, setClaimedSets] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('hero_claimed_theme_sets_v1') || '[]');
    } catch {
      return [];
    }
  });

  const themeSets = React.useMemo(() => {
    const sets = [
      { id: 'water', nameKo: '수류 수호자', nameEn: 'Water Guardians', range: [1, 10], reward: 500, icon: '💧' },
      { id: 'fire', nameKo: '화염 파괴자', nameEn: 'Fire Destroyers', range: [11, 20], reward: 500, icon: '🔥' },
      { id: 'wind', nameKo: '질풍 추적자', nameEn: 'Wind Trackers', range: [21, 30], reward: 500, icon: '💨' },
      { id: 'earth', nameKo: '대지 방패병', nameEn: 'Earth Wardens', range: [31, 40], reward: 500, icon: '🌿' },
      { id: 'human', nameKo: '인류 연합', nameEn: 'Human Alliance', range: [41, 50], reward: 500, icon: '⚔️' },
      { id: 'undead', nameKo: '언데드 군단', nameEn: 'Undead Legion', range: [51, 60], reward: 500, icon: '💀' },
      { id: 'elf', nameKo: '엘프 엘더', nameEn: 'Elf Elders', range: [61, 70], reward: 500, icon: '🏹' },
      { id: 'dwarf', nameKo: '드워프 장인', nameEn: 'Dwarf Craftsmen', range: [71, 80], reward: 500, icon: '🔨' },
      { id: 'monster', nameKo: '마수 포식자', nameEn: 'Monster Beasts', range: [81, 90], reward: 500, icon: '🐾' },
      { id: 'robot', nameKo: '메카닉 군세', nameEn: 'Mechanic Forces', range: [91, 100], reward: 500, icon: '🤖' },
      { id: 'dragon', nameKo: '드래곤 로드', nameEn: 'Dragon Lords', range: [101, 110], reward: 500, icon: '🐉' },
    ];

    return sets.map(s => {
      let count = 0;
      for (let i = s.range[0]; i <= s.range[1]; i++) {
        if (inventory[i] && inventory[i].quantity > 0) {
          count++;
        }
      }
      return {
        ...s,
        collected: count,
        total: s.range[1] - s.range[0] + 1,
        isCompleted: count >= (s.range[1] - s.range[0] + 1),
      };
    });
  }, [inventory]);

  const handleClaimThemeSet = (setId: string, reward: number) => {
    if (claimedSets.includes(setId)) return;
    const next = [...claimedSets, setId];
    setClaimedSets(next);
    localStorage.setItem('hero_claimed_theme_sets_v1', JSON.stringify(next));

    const currentSns = parseInt(localStorage.getItem('hero_sns') || '0', 10);
    localStorage.setItem('hero_sns', String(currentSns + reward));
    window.dispatchEvent(new Event('snshero_sns_updated'));
  };

  const handleOpenWatchFace = (card?: DatabaseCard | null) => {
    setWatchFaceInitialCard(card || selectedCard || CARD_DATABASE[1] || null);
    setIsWatchFaceOpen(true);
  };

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

  // ID 437: Top Stat Leaderboard Filter computation
  const finalCards = React.useMemo(() => {
    if (topStatFilter === 'fire_atk') {
      return allCards.filter(c => c.element === 'fire').sort((a, b) => (b.power || 0) - (a.power || 0)).slice(0, 5);
    } else if (topStatFilter === 'water_def') {
      return allCards.filter(c => c.element === 'water').sort((a, b) => (b.power || 0) - (a.power || 0)).slice(0, 5);
    } else if (topStatFilter === 'wind_spd') {
      return allCards.filter(c => c.element === 'wind' || c.element === 'air').sort((a, b) => (b.power || 0) - (a.power || 0)).slice(0, 5);
    } else if (topStatFilter === 'earth_hp') {
      return allCards.filter(c => c.element === 'earth' || c.element === 'land').sort((a, b) => (b.power || 0) - (a.power || 0)).slice(0, 5);
    }
    return sortedCards;
  }, [topStatFilter, allCards, sortedCards]);


  // Collection Progress Calculation (Item 62, 69)
  const totalDatabaseCards = Object.keys(CARD_DATABASE).length || 110;
  const ownedCount = Object.keys(inventory).length > 0 ? Object.keys(inventory).length : ownedCards.length;
  const collectionPercent = Math.min(100, Math.round((ownedCount / totalDatabaseCards) * 100));

  const elementStats = React.useMemo(() => {
    const stats: Record<string, number> = { WATER: 0, FIRE: 0, EARTH: 0, WIND: 0, HOLY: 0, DARK: 0 };
    Object.values(inventory).forEach((inv: any) => {
      const card = CARD_DATABASE[inv?.cardId as number];
      if (card) {
        const el = String(card.element || 'WATER').toUpperCase();
        if (stats[el] !== undefined) stats[el]++;
      }
    });
    return stats;
  }, [inventory]);

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
                <a href="/" style="display: flex; align-items: center; justify-content: center; gap: 4px; background: transparent; text-decoration: none;">
                  <img src="${language === 'ko' ? '/logo-ko.png' : '/logo-en.png'}" alt="${language === 'ko' ? '눈히어로.com' : 'S&SHero.com'}" style="height: 28px; width: auto; object-fit: contain; background: transparent;" />
                </a>
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
    <div className="min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono pb-32 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-6">
        <PageHeader title={t('wiki_card_title', language)} onBack={() => onNavigate('home')} />

        {/* ── Item 62 / 69: Card Collection Progress Bar & Element Breakdown ── */}
        <div className="mt-4 mb-6 p-4 rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#201d1d] uppercase tracking-wider flex items-center gap-1.5">
              <Trophy size={16} className="text-amber-500" />
              {language === 'ko' ? '도감 수집 진행률' : 'Codex Collection Progress'}
            </span>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleOpenWatchFace(null)}
                className="min-h-[44px] inline-flex items-center gap-1 px-3 py-1 bg-[#201d1d] hover:bg-stone-800 border border-[#201d1d] text-[#fdfcfc] rounded-sm text-[11px] font-bold transition-colors cursor-pointer"
              >
                <Watch size={13} className="text-[#fdfcfc]" />
                <span>{language === 'ko' ? '와치페이스' : 'Watch Face'}</span>
              </button>
              <span className="text-[#201d1d] font-bold text-sm">
                {ownedCount} / {totalDatabaseCards} ({collectionPercent}%)
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-[rgba(15,0,0,0.06)] rounded-none overflow-hidden border border-[rgba(15,0,0,0.12)] p-0.5">
            <div
              className="h-full bg-[#201d1d] rounded-none transition-all duration-500"
              style={{ width: `${collectionPercent}%` }}
            />
          </div>

          {/* Element Badges */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1 text-[10px] font-mono font-bold">
            <div className="p-1.5 rounded-none bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-[#201d1d] text-center">
              💧 {language === 'ko' ? '수' : 'Water'}: {elementStats.WATER}
            </div>
            <div className="p-1.5 rounded-none bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-[#201d1d] text-center">
              🔥 {language === 'ko' ? '화' : 'Fire'}: {elementStats.FIRE}
            </div>
            <div className="p-1.5 rounded-none bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-[#201d1d] text-center">
              ⛰️ {language === 'ko' ? '지' : 'Earth'}: {elementStats.EARTH}
            </div>
            <div className="p-1.5 rounded-none bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-[#201d1d] text-center">
              🌪️ {language === 'ko' ? '풍' : 'Wind'}: {elementStats.WIND}
            </div>
            <div className="p-1.5 rounded-none bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-[#201d1d] text-center">
              ✨ {language === 'ko' ? '신' : 'Holy'}: {elementStats.HOLY}
            </div>
            <div className="p-1.5 rounded-none bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-[#201d1d] text-center">
              🌑 {language === 'ko' ? '암' : 'Dark'}: {elementStats.DARK}
            </div>
          </div>

          {/* ID 528: 카드 수집 도감 테마 세트 완성 트랙 */}
          <div className="border-t border-[rgba(15,0,0,0.08)] pt-3 font-mono space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#201d1d]">
              <span className="flex items-center gap-1.5">
                <span>🏆</span>
                <span>{language === 'ko' ? '테마 세트 수집 보상 트랙 (세트당 500 SNS)' : 'Theme Set Completion Track (500 SNS/Set)'}</span>
              </span>
              <span className="text-[10px] text-stone-500">
                {claimedSets.length} / {themeSets.length} {language === 'ko' ? '수령 완료' : 'Claimed'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[10px]">
              {themeSets.map(set => {
                const isClaimed = claimedSets.includes(set.id);
                const canClaim = set.isCompleted && !isClaimed;
                return (
                  <div
                    key={set.id}
                    className={cn(
                      "p-2 border rounded-none flex flex-col justify-between transition-colors",
                      isClaimed
                        ? "bg-[#f8f7f7] border-[rgba(15,0,0,0.08)] opacity-70"
                        : canClaim
                          ? "bg-amber-500/10 border-amber-400"
                          : "bg-[#fdfcfc] border-[rgba(15,0,0,0.12)]"
                    )}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="truncate">{set.icon} {language === 'ko' ? set.nameKo : set.nameEn}</span>
                      <span className={cn(
                        "text-[9px] px-1",
                        set.isCompleted ? "text-emerald-700 font-bold" : "text-stone-500"
                      )}>
                        [{set.collected}/{set.total}]
                      </span>
                    </div>

                    {isClaimed ? (
                      <span className="text-[9px] text-emerald-700 font-bold text-center">
                        ✅ {language === 'ko' ? '수령 완료' : 'Claimed'}
                      </span>
                    ) : canClaim ? (
                      <button
                        type="button"
                        onClick={() => handleClaimThemeSet(set.id, set.reward)}
                        className="w-full min-h-[44px] py-1 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] font-bold text-[10px] rounded-sm cursor-pointer border border-[#201d1d] transition-colors flex items-center justify-center"
                      >
                        [🎁 500 SNS 수령]
                      </button>
                    ) : (
                      <span className="text-[9px] text-stone-400 text-center">
                        {set.total - set.collected}{language === 'ko' ? '장 부족' : ' more'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-6">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-[#201d1d]">
              {t('wiki_card_index', language)}
            </h1>
            <button
              onClick={() => { setShowHelp(true); setHelpStep(0); }}
              className="min-h-[44px] min-w-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] flex items-center justify-center hover:bg-[rgba(15,0,0,0.05)] transition-colors shrink-0 text-[#201d1d] cursor-pointer"
              aria-label="Help"
            >
              <HelpCircle size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleOpenWatchFace(null)}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer border border-[#201d1d]"
            >
              <Watch size={14} />
              <span>{language === 'ko' ? '와치페이스' : 'Watch Face'}</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="min-h-[44px] bg-transparent border-b border-[rgba(15,0,0,0.2)] text-[11px] font-bold uppercase tracking-wider focus:outline-none focus:border-[#201d1d] transition-colors py-1 text-[#201d1d] cursor-pointer font-mono"
            >
              <option value="id">{t('wiki_sort_index', language)}</option>
              <option value="name">{t('wiki_sort_name', language)}</option>
              <option value="power">{t('wiki_sort_power', language)}</option>
              <option value="rarity">{t('wiki_sort_rarity', language)}</option>
            </select>
            <div className="relative w-48 md:w-56">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                placeholder={t('wiki_search_cards', language)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-h-[44px] w-full pl-10 pr-11 py-2 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-sm text-xs font-mono placeholder:opacity-50 focus:outline-none focus:border-[#201d1d] transition-colors text-[#201d1d]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="min-h-[44px] min-w-[44px] absolute right-0 top-1/2 -translate-y-1/2 text-stone-500 hover:text-[#201d1d] flex items-center justify-center cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar & ID 437: Top 5 Stat Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-6 font-mono">
          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value as CharacterRarityTier | "all")}
            className="min-h-[44px] bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-sm px-3 py-2 text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:border-[#201d1d] cursor-pointer text-[#201d1d]"
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
            className="min-h-[44px] bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-sm px-3 py-2 text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:border-[#201d1d] cursor-pointer text-[#201d1d]"
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

          {/* ID 437: Quick Top Stat Leaderboard Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              type="button"
              onClick={() => setTopStatFilter('all')}
              className={cn(
                "min-h-[44px] px-3 py-2 text-[10px] font-bold rounded-sm border cursor-pointer transition-colors flex items-center justify-center shrink-0",
                topStatFilter === 'all'
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#fdfcfc] text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-[#f8f7f7]'
              )}
            >
              [전체]
            </button>
            <button
              type="button"
              onClick={() => setTopStatFilter(topStatFilter === 'fire_atk' ? 'all' : 'fire_atk')}
              className={cn(
                "min-h-[44px] px-3 py-2 text-[10px] font-bold rounded-sm border cursor-pointer transition-colors flex items-center justify-center shrink-0",
                topStatFilter === 'fire_atk'
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#fdfcfc] text-rose-700 border-rose-300 hover:bg-rose-50'
              )}
            >
              🔥 Top Fire ATK
            </button>
            <button
              type="button"
              onClick={() => setTopStatFilter(topStatFilter === 'water_def' ? 'all' : 'water_def')}
              className={cn(
                "min-h-[44px] px-3 py-2 text-[10px] font-bold rounded-sm border cursor-pointer transition-colors flex items-center justify-center shrink-0",
                topStatFilter === 'water_def'
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#fdfcfc] text-sky-700 border-sky-300 hover:bg-sky-50'
              )}
            >
              💧 Top Water DEF
            </button>
            <button
              type="button"
              onClick={() => setTopStatFilter(topStatFilter === 'wind_spd' ? 'all' : 'wind_spd')}
              className={cn(
                "min-h-[44px] px-3 py-2 text-[10px] font-bold rounded-sm border cursor-pointer transition-colors flex items-center justify-center shrink-0",
                topStatFilter === 'wind_spd'
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#fdfcfc] text-emerald-700 border-emerald-300 hover:bg-emerald-50'
              )}
            >
              🌪️ Top Wind SPD
            </button>
            <button
              type="button"
              onClick={() => setTopStatFilter(topStatFilter === 'earth_hp' ? 'all' : 'earth_hp')}
              className={cn(
                "min-h-[44px] px-3 py-2 text-[10px] font-bold rounded-sm border cursor-pointer transition-colors flex items-center justify-center shrink-0",
                topStatFilter === 'earth_hp'
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#fdfcfc] text-amber-700 border-amber-300 hover:bg-amber-50'
              )}
            >
              ⛰️ Top Earth HP
            </button>
          </div>
        </div>

        {/* ID 444: Virtual Window Scrolling - Sliced render */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {finalCards.slice(0, visibleLimit).map((card) => {
            const isOwned = Boolean(inventory[card.id] || ownedCards.some(c => c.imageIndex === card.id));
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
                className={cn(
                  "group relative flex gap-4 p-4 rounded-none border transition-colors overflow-hidden cursor-pointer",
                  isOwned ? "bg-[#fdfcfc] border-[rgba(15,0,0,0.12)] hover:bg-[#f8f7f7]" : "border-[rgba(15,0,0,0.12)] bg-[#f8f7f7]/60"
                )}
              >
                <div className={`w-20 sm:w-24 shrink-0 relative z-10 ${!isOwned ? 'filter grayscale opacity-60' : ''}`}>
                  <CardItem
                    card={displayCard}
                    className="w-full aspect-[5/7]"
                    isLocked={!isOwned}
                    lowSpecMode={true}
                    ignoreBonuses={true}
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h3 className="text-base font-bold text-[#201d1d] tracking-tight uppercase leading-tight truncate">
                      {getFormattedCardName(card, language)}
                    </h3>
                    <span className={cn(
                      "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm border",
                      isOwned ? "bg-emerald-500/10 text-emerald-800 border-emerald-400/40" : "bg-[#f8f7f7] text-stone-500 border-[rgba(15,0,0,0.12)]"
                    )}>
                      {isOwned ? (language === 'ko' ? '보유중' : 'OWNED') : (language === 'ko' ? '미획득' : 'LOCKED')}
                    </span>
                  </div>

                  {/* Acquisition source for locked cards (Item 62, 69) */}
                  {!isOwned && (
                    <p className="text-[9px] font-mono text-[#201d1d] font-bold mb-1.5">
                      💡 {language === 'ko' ? '획득처: 카드 소환 / 스토리 탐색' : 'Source: Gacha / Story'}
                    </p>
                  )}

                  <div className="flex gap-1.5">
                    {['N', 'E', 'S', 'W'].map((dir, i) => (
                      <div key={dir} className="flex flex-col items-center">
                        <span className="text-[7px] font-bold text-stone-400 leading-none mb-0.5">{dir}</span>
                        <span className="text-[11px] font-bold bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm w-7 h-7 flex items-center justify-center text-[#201d1d]">
                          {card.stats[i]}
                        </span>
                      </div>
                    ))}
                    <div className="flex flex-col items-center ml-1">
                      <span className="text-[7px] font-bold text-[#201d1d] leading-none mb-0.5">CP</span>
                      <span className="text-[11px] font-bold bg-[#201d1d] border border-[#201d1d] text-[#fdfcfc] rounded-sm w-9 h-7 flex items-center justify-center">
                        {card.power}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {sortedCards.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm font-bold opacity-50 uppercase tracking-widest text-stone-500">
              {t('wiki_no_cards_match', language)}
            </div>
          )}
        </div>

        {/* ID 444: Load More Button for Virtual Window */}
        {finalCards.length > visibleLimit && (
          <div className="text-center py-6">
            <button
              type="button"
              onClick={() => setVisibleLimit(prev => prev + 24)}
              className="min-h-[44px] px-6 py-2.5 bg-[#201d1d] text-[#fdfcfc] font-mono text-xs font-bold uppercase tracking-wider rounded-sm hover:opacity-90 transition-colors border border-[#201d1d] cursor-pointer inline-flex items-center justify-center"
            >
              [+ {language === 'ko' ? `카드 더보기 (${visibleLimit}/${finalCards.length})` : `Load More Cards (${visibleLimit}/${finalCards.length})`}]
            </button>
          </div>
        )}
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
          onOpenWatchFace={() => handleOpenWatchFace(selectedCard)}
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
            className="fixed inset-0 z-[209] bg-black/50 flex items-center justify-center p-4 font-mono select-none"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-none p-6 max-w-sm w-full relative text-[#201d1d]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-[#fdfcfc] pt-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#201d1d]">
                  {language === 'ko' ? '카드 도감 도움말' : 'Card Wiki Help'}
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm hover:bg-[rgba(15,0,0,0.05)] border border-[rgba(15,0,0,0.12)] transition-colors cursor-pointer text-[#201d1d]"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="bg-[rgba(15,0,0,0.02)] border border-[rgba(15,0,0,0.06)] p-3 min-h-[90px] flex items-center mb-6">
                <p className="text-xs text-stone-700 leading-relaxed">
                  {helpSteps[helpStep]}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[rgba(15,0,0,0.08)]">
                <button
                  disabled={helpStep === 0}
                  onClick={() => setHelpStep(helpStep - 1)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm hover:bg-[rgba(15,0,0,0.05)] border border-[rgba(15,0,0,0.12)] disabled:opacity-30 transition-colors cursor-pointer text-[#201d1d]"
                  aria-label="Previous"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[10px] text-stone-500 font-bold">
                  {helpStep + 1} / {helpSteps.length}
                </span>
                <button
                  disabled={helpStep === helpSteps.length - 1}
                  onClick={() => setHelpStep(helpStep + 1)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm hover:bg-[rgba(15,0,0,0.05)] border border-[rgba(15,0,0,0.12)] disabled:opacity-30 transition-colors cursor-pointer text-[#201d1d]"
                  aria-label="Next"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watch Face Generator Modal */}
      <WatchFaceModal
        isOpen={isWatchFaceOpen}
        onClose={() => setIsWatchFaceOpen(false)}
        initialCard={watchFaceInitialCard}
        language={language}
      />
    </div>
  );
};
