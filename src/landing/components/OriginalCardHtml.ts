/**
 * src/landing/components/OriginalCardHtml.ts
 *
 * Reusable HTML template generator for the authentic SNSHero Original TCG Card design
 * (100% fidelity to https://snshero.com/play & src/components/CardItem.tsx).
 *
 * Features:
 * - Metallic Bezel Frame & Corner Brackets (Bronze / Silver / Gold)
 * - TCG Top Header: Rarity Badge, Level, Power Score (⚡ TP), Stars (★)
 * - Central Illustration Window with Faction Background, Geometric Rune Circle SVG,
 *   Character Art & 5-Step Power Gauge Bar
 * - Authentic 4-Way Compass Diamond HUD (N, E, S, W floating circular badges)
 * - TCG Bottom Footer: Ability Badge ([⚡BOOST], [🛡️GUARD]), Character Name & Code
 * - Zero React runtime, 100% pure TypeScript template string.
 */

import { getCharacterAsset } from '../services/assetCatalog';
import { CARD_DATABASE } from '../../cardDatabase';
import { cardNurtureStore } from '../services/cardNurtureStore';

export interface OriginalCardRenderOptions {
  className?: string;
  isSelected?: boolean;
  isOwned?: boolean;
  level?: number;
  bonusStats?: { top: number; right: number; bottom: number; left: number };
  hideStats?: boolean;
  action?: string;
  showRedDot?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'responsive';
  visualTier?: '7head' | 'bust';
}

const FACTION_SURFACES: Record<string, { bg: string; windowBg: string; accent: string; darkText: string }> = {
  water:   { bg: '#d9effc', windowBg: '#e0f2fe', accent: '#0284c7', darkText: '#0369a1' },
  fire:    { bg: '#fce1ce', windowBg: '#ffedd5', accent: '#dc2626', darkText: '#b91c1c' },
  wind:    { bg: '#e1f3ef', windowBg: '#ccfbf1', accent: '#0d9488', darkText: '#0f766e' },
  earth:   { bg: '#ebedc8', windowBg: '#f7fee7', accent: '#65a30d', darkText: '#4d7c0f' },
  human:   { bg: '#f6edcf', windowBg: '#fef3c7', accent: '#2563eb', darkText: '#1d4ed8' },
  undead:  { bg: '#ece0f4', windowBg: '#f3e8ff', accent: '#7c3aed', darkText: '#6d28d9' },
  elf:     { bg: '#e0efd6', windowBg: '#dcfce7', accent: '#16a34a', darkText: '#15803d' },
  dwarf:   { bg: '#efe2d1', windowBg: '#fef3c7', accent: '#b45309', darkText: '#92400e' },
  monster: { bg: '#e5ead4', windowBg: '#ecfccb', accent: '#be123c', darkText: '#9f1239' },
  robot:   { bg: '#e3e9ef', windowBg: '#e2e8f0', accent: '#0369a1', darkText: '#075985' },
  dragon:  { bg: '#f1def0', windowBg: '#fae8ff', accent: '#991b1b', darkText: '#7f1d1d' },
};

const RARITY_THEMES: Record<string, {
  borderHex: string;
  badgeBg: string;
  badgeText: string;
  badgeLabel: string;
  starCount: number;
  statBadgeBorder: string;
}> = {
  bronze: {
    borderHex: '#7c4724',
    badgeBg: '#5c3419',
    badgeText: '#ffedd5',
    badgeLabel: '🥉 BRONZE',
    starCount: 1,
    statBadgeBorder: '#7c4724',
  },
  silver: {
    borderHex: '#475569',
    badgeBg: '#334155',
    badgeText: '#f8fafc',
    badgeLabel: '🥈 SILVER',
    starCount: 2,
    statBadgeBorder: '#475569',
  },
  gold: {
    borderHex: '#ca8a04',
    badgeBg: '#854d0e',
    badgeText: '#fef9c3',
    badgeLabel: '🥇 GOLD',
    starCount: 3,
    statBadgeBorder: '#ca8a04',
  },
};

/**
 * Render the authentic SNSHero Original TCG Card HTML
 */
export function renderOriginalCardHtml(cardId: number, options: OriginalCardRenderOptions = {}): string {
  const asset = getCharacterAsset(cardId);
  const db = CARD_DATABASE[cardId] || { top: 2, right: 2, bottom: 2, left: 2 };
  const nurture = cardNurtureStore.cards[cardId];
  const isOwned = options.isOwned ?? cardNurtureStore.isCardOwned(cardId);
  const level = options.level ?? nurture?.level ?? 1;
  const bonus = options.bonusStats ?? nurture?.bonusStats ?? { top: 0, right: 0, bottom: 0, left: 0 };

  const top = (db.top || 0) + (bonus.top || 0);
  const right = (db.right || 0) + (bonus.right || 0);
  const bottom = (db.bottom || 0) + (bonus.bottom || 0);
  const left = (db.left || 0) + (bonus.left || 0);
  const totalTP = top + right + bottom + left;

  const faction = (asset.faction || 'human').toLowerCase();
  const factionTheme = FACTION_SURFACES[faction] || FACTION_SURFACES.human;
  const rarity = (asset.rarity || 'bronze').toLowerCase();
  const rarityTheme = RARITY_THEMES[rarity] || RARITY_THEMES.bronze;

  const ability = (db as any).ability;
  const abilityTag = ability?.type === 'POWER_BOOST' ? '[⚡BOOST]'
    : ability?.type === 'SHIELD' ? '[🛡️SHIELD]'
    : ability?.type === 'PIERCE' ? '[🎯PIERCE]'
    : ability?.type === 'COUNTER' ? '[⚔️COUNTER]'
    : '[기본]';

  const isSelected = options.isSelected || false;
  const showRedDot = options.showRedDot ?? (isOwned && cardNurtureStore.hasUnspentPoints(cardId));
  const hideStats = options.hideStats || false;
  const visualTier = options.visualTier || 'bust';
  const isResponsiveHand = options.size === 'responsive' || options.size === 'sm';
  const bustUrlWithVer = `${asset.bustPngUrl}?v=20261103v4`;
  const primaryImgUrl = visualTier === '7head' ? asset.cutoutUrl : bustUrlWithVer;
  const fallbackImgUrl = visualTier === '7head' ? bustUrlWithVer : asset.seatUrl;

  // Custom size or default container-adaptive styling
  const customClass = options.className || 'w-full aspect-[5/7] min-h-[220px]';
  const actionAttr = options.action ? `data-action="${options.action}" data-card-id="${cardId}"` : '';

  const cardPadClass = isResponsiveHand ? 'p-1 sm:p-2' : 'p-1.5 sm:p-2';
  const statCircleClass = isResponsiveHand
    ? 'h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[8px] sm:text-[9px] md:text-xs border sm:border-2'
    : 'h-5 w-5 sm:h-6 sm:w-6 text-[10px] sm:text-xs border-2';

  return `
    <div
      ${actionAttr}
      class="group/orig-card relative flex flex-col justify-between font-mono select-none rounded-sm border-2 ${customClass} ${
        isSelected ? 'ring-2 ring-black shadow-lg scale-[1.02]' : ''
      } ${isOwned ? '' : 'opacity-85'} transition-all cursor-pointer overflow-hidden ${cardPadClass}"
      style="
        background-color: ${factionTheme.bg};
        border-color: ${rarityTheme.borderHex};
        box-shadow: ${isSelected ? '0 10px 25px -5px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.1)'};
      "
      aria-label="${asset.nameKo} 원본 카드"
    >
      <!-- Metallic Corner Bracket SVG (Authentic TCG Ornament) -->
      <svg
        viewBox="0 0 100 140"
        preserveAspectRatio="none"
        class="pointer-events-none absolute inset-0 z-10 h-full w-full"
        aria-hidden="true"
      >
        <g stroke="${rarityTheme.borderHex}" stroke-width="1.8" fill="none">
          <path d="M 2,12 L 2,2 L 12,2" />
          <path d="M 88,2 L 98,2 L 98,12" />
          <path d="M 2,128 L 2,138 L 12,138" />
          <path d="M 88,138 L 98,138 L 98,128" />
        </g>
      </svg>

      <!-- Red Dot Notification for Unspent Stat Points -->
      ${showRedDot ? `
        <span class="absolute top-1.5 right-1.5 z-40 flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-red-600 border border-white"></span>
        </span>
      ` : ''}

      <!-- 4-Way Compass Diamond HUD (Placed at Card Outer Edges: North, South, East, West - Not over Bust Art) -->
      ${!hideStats ? `
        <!-- North (Top Edge of Card) -->
        <div
          class="absolute top-0.5 sm:top-1 left-1/2 -translate-x-1/2 z-30 ${statCircleClass} rounded-full bg-[#fdfcfc] flex items-center justify-center font-black text-[#201d1d] shadow-[0_1px_3px_rgba(0,0,0,0.35)] select-none"
          style="border-color: ${rarityTheme.statBadgeBorder};"
          title="북(N): ${top}"
        >
          ${top}
        </div>

        <!-- South (Bottom Edge of Card) -->
        <div
          class="absolute bottom-0.5 sm:bottom-1 left-1/2 -translate-x-1/2 z-30 ${statCircleClass} rounded-full bg-[#fdfcfc] flex items-center justify-center font-black text-[#201d1d] shadow-[0_1px_3px_rgba(0,0,0,0.35)] select-none"
          style="border-color: ${rarityTheme.statBadgeBorder};"
          title="남(S): ${bottom}"
        >
          ${bottom}
        </div>

        <!-- West (Left Edge of Card) -->
        <div
          class="absolute left-0.5 sm:left-1 top-1/2 -translate-y-1/2 z-30 ${statCircleClass} rounded-full bg-[#fdfcfc] flex items-center justify-center font-black text-[#201d1d] shadow-[0_1px_3px_rgba(0,0,0,0.35)] select-none"
          style="border-color: ${rarityTheme.statBadgeBorder};"
          title="서(W): ${left}"
        >
          ${left}
        </div>

        <!-- East (Right Edge of Card) -->
        <div
          class="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 z-30 ${statCircleClass} rounded-full bg-[#fdfcfc] flex items-center justify-center font-black text-[#201d1d] shadow-[0_1px_3px_rgba(0,0,0,0.35)] select-none"
          style="border-color: ${rarityTheme.statBadgeBorder};"
          title="동(E): ${right}"
        >
          ${right}
        </div>
      ` : ''}

      <!-- 1. TCG Header Bar: Rarity Badge, Level, Power & Stars -->
      <div class="relative z-20 flex items-center justify-between w-full pb-0.5 sm:pb-1 border-b border-black/15 ${
        isResponsiveHand ? 'text-[8px] sm:text-[10px]' : 'text-[10px]'
      } leading-none gap-0.5">
        <div class="flex items-center gap-0.5 sm:gap-1 min-w-0 truncate">
          <span
            class="${
              isResponsiveHand
                ? 'px-1 sm:px-1.5 py-0.5 rounded-xs font-black uppercase text-[7px] sm:text-[9px] tracking-tight shrink-0'
                : 'px-1.5 py-0.5 rounded-xs font-black uppercase text-[9px] tracking-tight'
            }"
            style="background-color: ${rarityTheme.badgeBg}; color: ${rarityTheme.badgeText};"
          >
            ${
              isResponsiveHand
                ? `<span class="sm:hidden">${rarity.slice(0, 1).toUpperCase()}</span><span class="hidden sm:inline">${rarityTheme.badgeLabel}</span>`
                : rarityTheme.badgeLabel
            }
          </span>
          <span class="font-bold text-[#201d1d] truncate">Lv.${level}</span>
        </div>
        <!-- Spacer for North Stat Badge at Top Edge -->
        <div class="w-4 sm:w-6 shrink-0 pointer-events-none"></div>
        <div class="flex items-center gap-0.5 sm:gap-1 font-bold shrink-0">
          <span class="text-amber-700">⚡${totalTP}</span>
          <span class="${isResponsiveHand ? 'hidden sm:inline' : ''} text-amber-600 text-[10px]">${'★'.repeat(rarityTheme.starCount)}</span>
        </div>
      </div>

      <!-- 2. Central Illustration Window (Clear View of Hero Art) -->
      <div
        class="relative z-10 w-full flex-1 my-0.5 sm:my-1 overflow-hidden border border-black/20 rounded-xs flex items-center justify-center"
        style="background-color: ${factionTheme.windowBg};"
      >
        <!-- Background Geometric Magic Circle SVG -->
        <svg
          viewBox="0 0 100 100"
          class="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-20"
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="38" fill="none" stroke="${factionTheme.accent}" stroke-width="1.2" stroke-dasharray="3 2" />
          <circle cx="50" cy="50" r="28" fill="none" stroke="${rarityTheme.borderHex}" stroke-width="1" />
          <polygon points="50,14 81,68 19,68" fill="none" stroke="${factionTheme.accent}" stroke-width="0.8" />
        </svg>

        <!-- Character Art (7-Head Cutout or Bust) -->
        <div class="relative z-10 w-full h-full flex items-center justify-center ${
          isResponsiveHand ? 'p-0.5 sm:p-1.5' : 'p-1.5'
        } overflow-hidden">
          <img
            src="${primaryImgUrl}"
            alt="${asset.nameKo}"
            class="max-w-full max-h-full object-contain filter drop-shadow-none ${isOwned ? '' : 'grayscale opacity-70'} group-hover/orig-card:scale-105 transition-transform duration-200"
            loading="lazy"
            onerror="this.src='${fallbackImgUrl}'; this.onerror=null;"
          />
        </div>

        <!-- 5-Step Power Gauge Bar (bottom of illustration) -->
        <div class="pointer-events-none absolute inset-x-1 sm:inset-x-2 bottom-0.5 sm:bottom-1 z-20 flex items-center gap-0.5">
          ${[1, 2, 3, 4, 5].map(step => {
            const active = step <= Math.min(5, Math.ceil(totalTP / 6));
            return `
              <span
                class="h-1 flex-1 border border-black/30 rounded-xs"
                style="background-color: ${active ? factionTheme.accent : 'rgba(255,255,255,0.4)'};"
              ></span>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 3. TCG Footer Bar: Ability Badge, Character Name & Code -->
      <div class="relative z-20 w-full pt-0.5 sm:pt-1 border-t border-black/15 flex items-center justify-between ${
        isResponsiveHand ? 'text-[8px] sm:text-[10px]' : 'text-[10px]'
      } leading-tight">
        <div class="flex items-center gap-0.5 sm:gap-1 truncate min-w-0 ${
          isResponsiveHand ? 'justify-start' : ''
        }">
          <span class="${isResponsiveHand ? 'hidden sm:inline' : ''} text-amber-800 font-bold shrink-0">${abilityTag}</span>
          <span class="font-black text-[#201d1d] truncate" title="${asset.nameKo}">${asset.nameKo}</span>
        </div>
        <!-- Spacer for South Stat Badge at Bottom Edge -->
        <div class="w-4 sm:w-6 shrink-0 pointer-events-none"></div>
        <span class="${isResponsiveHand ? 'hidden sm:inline' : ''} font-bold text-stone-500 shrink-0 uppercase text-[9px]">${asset.code}</span>
      </div>
    </div>
  `;
}
