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
import { tr } from '../services/i18n';

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
  borderWidth: string;
  frameShadow: string;
  selectedShadow: string;
  windowBorderStyle: string;
  badgeBg: string;
  badgeStyle: string;
  badgeText: string;
  badgeLabel: string;
  starCount: number;
  statBadgeBorder: string;
  statBadgeStyle: string;
}> = {
  bronze: {
    // 동카드: 단순하고 담백한 매트 동테 (Simple Matte Bronze)
    borderHex: '#8c5230',
    borderWidth: '2px',
    frameShadow: '0 1px 3px rgba(67, 20, 7, 0.16)',
    selectedShadow: '0 8px 20px -4px rgba(124, 71, 36, 0.45), 0 0 0 2px #201d1d',
    windowBorderStyle: 'border: 1px solid rgba(124, 71, 36, 0.45);',
    badgeBg: '#6b3e23',
    badgeStyle: 'background: #6b3e23; color: #ffedd5; border: 1px solid #8c5230;',
    badgeText: '#ffedd5',
    badgeLabel: '🥉 BRONZE',
    starCount: 1,
    statBadgeBorder: '#8c5230',
    statBadgeStyle: 'border-color: #8c5230; background: #fdfcfc; color: #431407;',
  },
  silver: {
    // 은카드: 무난하고 깔끔한 메탈릭 은테 (Clean Metallic Silver Bezel)
    borderHex: '#94a3b8',
    borderWidth: '2.5px',
    frameShadow: 'inset 0 0 0 1.5px #f1f5f9, inset 0 0 0 2.5px #64748b, 0 2px 8px rgba(71, 85, 105, 0.28)',
    selectedShadow: 'inset 0 0 0 1.5px #f1f5f9, inset 0 0 0 2.5px #64748b, 0 10px 24px -4px rgba(71, 85, 105, 0.55), 0 0 0 2px #334155',
    windowBorderStyle: 'border: 1.5px solid #94a3b8; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.65);',
    badgeBg: '#475569',
    badgeStyle: 'background: linear-gradient(135deg, #334155 0%, #64748b 50%, #334155 100%); color: #f8fafc; border: 1px solid #cbd5e1;',
    badgeText: '#f8fafc',
    badgeLabel: '🥈 SILVER',
    starCount: 2,
    statBadgeBorder: '#64748b',
    statBadgeStyle: 'border-color: #64748b; background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%); color: #0f172a; box-shadow: 0 1px 4px rgba(51,65,85,0.4);',
  },
  gold: {
    // 금카드: 화려한 다중 레이어 황금 베젤 & 광채 금테 (Ornate Royal Gold Bezel & Glow)
    borderHex: '#eab308',
    borderWidth: '3px',
    frameShadow: 'inset 0 0 0 1.5px #fef08a, inset 0 0 0 3px #b45309, inset 0 0 12px rgba(250, 204, 21, 0.35), 0 0 12px rgba(234, 179, 8, 0.55), 0 4px 10px rgba(146, 64, 14, 0.3)',
    selectedShadow: 'inset 0 0 0 1.5px #fef08a, inset 0 0 0 3px #b45309, 0 0 20px rgba(234, 179, 8, 0.85), 0 10px 25px -4px rgba(146, 64, 14, 0.5)',
    windowBorderStyle: 'border: 1.5px solid #d97706; box-shadow: 0 0 8px rgba(234, 179, 8, 0.45), inset 0 0 0 1px #fef08a;',
    badgeBg: '#854d0e',
    badgeStyle: 'background: linear-gradient(135deg, #78350f 0%, #d97706 50%, #92400e 100%); color: #fef08a; border: 1px solid #fde047; box-shadow: 0 0 6px rgba(234,179,8,0.5);',
    badgeText: '#fef9c3',
    badgeLabel: '🥇 GOLD',
    starCount: 3,
    statBadgeBorder: '#d97706',
    statBadgeStyle: 'border-color: #d97706; background: linear-gradient(180deg, #fefce8 0%, #fde047 100%); color: #451a03; box-shadow: 0 0 6px rgba(234,179,8,0.65), inset 0 0 0 1px #ffffff;',
  },
};

/**
 * Render rarity-differentiated SVG frame ornament:
 * - Bronze: Simple minimal corner ticks
 * - Silver: Clean metallic double-corner brackets + subtle side lines
 * - Gold: Ornate royal double-frame filigree + 4 corner diamond gems + golden foil sheen
 */
function renderRarityFrameSvg(rarity: string): string {
  if (rarity === 'gold') {
    return `
      <!-- Gold Card Foil Sheen Overlay -->
      <div
        class="pointer-events-none absolute inset-0 z-[5]"
        style="background: linear-gradient(135deg, rgba(254,240,138,0.32) 0%, transparent 32%, rgba(250,204,21,0.16) 50%, transparent 68%, rgba(254,240,138,0.28) 100%);"
        aria-hidden="true"
      ></div>
      <!-- Ornate Royal Gold Filigree SVG Frame -->
      <svg
        viewBox="0 0 100 140"
        preserveAspectRatio="none"
        class="pointer-events-none absolute inset-0 z-10 h-full w-full"
        aria-hidden="true"
      >
        <!-- Outer & Inner Golden Rim Lines -->
        <rect x="1.5" y="1.5" width="97" height="137" fill="none" stroke="#f59e0b" stroke-width="1.4" />
        <rect x="3.5" y="3.5" width="93" height="133" fill="none" stroke="#fef08a" stroke-width="0.7" stroke-opacity="0.9" />
        <!-- Ornate Double Corner Brackets -->
        <g stroke="#b45309" stroke-width="2.2" fill="none">
          <path d="M 1.5,16 L 1.5,1.5 L 16,1.5" />
          <path d="M 84,1.5 L 98.5,1.5 L 98.5,16" />
          <path d="M 1.5,124 L 1.5,138.5 L 16,138.5" />
          <path d="M 84,138.5 L 98.5,138.5 L 98.5,124" />
        </g>
        <g stroke="#fef08a" stroke-width="1.1" fill="none">
          <path d="M 4.5,13 L 4.5,4.5 L 13,4.5" />
          <path d="M 87,4.5 L 95.5,4.5 L 95.5,13" />
          <path d="M 4.5,127 L 4.5,135.5 L 13,135.5" />
          <path d="M 87,135.5 L 95.5,135.5 L 95.5,127" />
        </g>
        <!-- 4 Corner Royal Gold Diamond Gems -->
        <g fill="#f59e0b" stroke="#fef08a" stroke-width="0.7">
          <polygon points="5.5,2.5 8.5,5.5 5.5,8.5 2.5,5.5" />
          <polygon points="94.5,2.5 97.5,5.5 94.5,8.5 91.5,5.5" />
          <polygon points="5.5,131.5 8.5,134.5 5.5,137.5 2.5,134.5" />
          <polygon points="94.5,131.5 97.5,134.5 94.5,137.5 91.5,134.5" />
        </g>
      </svg>
    `;
  }

  if (rarity === 'silver') {
    return `
      <!-- Clean Metallic Silver Frame SVG -->
      <svg
        viewBox="0 0 100 140"
        preserveAspectRatio="none"
        class="pointer-events-none absolute inset-0 z-10 h-full w-full"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="96" height="136" fill="none" stroke="#cbd5e1" stroke-width="0.9" />
        <g stroke="#475569" stroke-width="1.8" fill="none">
          <path d="M 2,12 L 2,2 L 12,2" />
          <path d="M 88,2 L 98,2 L 98,12" />
          <path d="M 2,128 L 2,138 L 12,138" />
          <path d="M 88,138 L 98,138 L 98,128" />
        </g>
        <g stroke="#f8fafc" stroke-width="0.9" fill="none">
          <path d="M 4,10 L 4,4 L 10,4" />
          <path d="M 90,4 L 96,4 L 96,10" />
          <path d="M 4,130 L 4,136 L 10,136" />
          <path d="M 90,136 L 96,136 L 96,130" />
        </g>
      </svg>
    `;
  }

  // Bronze: Simple understated single-line corner ticks
  return `
    <svg
      viewBox="0 0 100 140"
      preserveAspectRatio="none"
      class="pointer-events-none absolute inset-0 z-10 h-full w-full"
      aria-hidden="true"
    >
      <g stroke="#7c4724" stroke-width="1.2" stroke-opacity="0.65" fill="none">
        <path d="M 2.5,8 L 2.5,2.5 L 8,2.5" />
        <path d="M 92,2.5 L 97.5,2.5 L 97.5,8" />
        <path d="M 2.5,132 L 2.5,137.5 L 8,137.5" />
        <path d="M 92,137.5 L 97.5,137.5 L 97.5,132" />
      </g>
    </svg>
  `;
}

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
    : tr('[기본]', '[BASE]', '[基本]');

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
      data-rarity="${rarity}"
      class="group/orig-card relative flex flex-col justify-between font-mono select-none rounded-sm ${customClass} ${
        isSelected ? 'ring-2 ring-black scale-[1.02]' : ''
      } ${isOwned ? '' : 'opacity-85'} transition-all cursor-pointer overflow-hidden ${cardPadClass}"
      style="
        background-color: ${factionTheme.bg};
        border-style: solid;
        border-width: ${rarityTheme.borderWidth};
        border-color: ${rarityTheme.borderHex};
        box-shadow: ${isSelected ? rarityTheme.selectedShadow : rarityTheme.frameShadow};
      "
      aria-label="${asset.nameKo} ${tr('원본 카드', 'Card', 'カード')}"
    >
      ${renderRarityFrameSvg(rarity)}

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
          class="absolute top-0.5 sm:top-1 left-1/2 -translate-x-1/2 z-30 ${statCircleClass} rounded-full flex items-center justify-center font-black shadow-[0_1px_3px_rgba(0,0,0,0.35)] select-none"
          style="${rarityTheme.statBadgeStyle}"
          title="${tr('북(N)', 'North(N)', '北(N)')}: ${top}"
        >
          ${top}
        </div>

        <!-- South (Bottom Edge of Card) -->
        <div
          class="absolute bottom-0.5 sm:bottom-1 left-1/2 -translate-x-1/2 z-30 ${statCircleClass} rounded-full flex items-center justify-center font-black shadow-[0_1px_3px_rgba(0,0,0,0.35)] select-none"
          style="${rarityTheme.statBadgeStyle}"
          title="${tr('남(S)', 'South(S)', '南(S)')}: ${bottom}"
        >
          ${bottom}
        </div>

        <!-- West (Left Edge of Card) -->
        <div
          class="absolute left-0.5 sm:left-1 top-1/2 -translate-y-1/2 z-30 ${statCircleClass} rounded-full flex items-center justify-center font-black shadow-[0_1px_3px_rgba(0,0,0,0.35)] select-none"
          style="${rarityTheme.statBadgeStyle}"
          title="${tr('서(W)', 'West(W)', '西(W)')}: ${left}"
        >
          ${left}
        </div>

        <!-- East (Right Edge of Card) -->
        <div
          class="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 z-30 ${statCircleClass} rounded-full flex items-center justify-center font-black shadow-[0_1px_3px_rgba(0,0,0,0.35)] select-none"
          style="${rarityTheme.statBadgeStyle}"
          title="${tr('동(E)', 'East(E)', '東(E)')}: ${right}"
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
            style="${rarityTheme.badgeStyle}"
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
        class="relative z-10 w-full flex-1 my-0.5 sm:my-1 overflow-hidden rounded-xs flex items-center justify-center"
        style="background-color: ${factionTheme.windowBg}; ${rarityTheme.windowBorderStyle}"
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

export interface BattleBoardSlotCardOptions {
  cardId: number;
  stats: [number, number, number, number]; // [top, right, bottom, left]
  owner: 'player' | 'opponent';
  isJustPlaced?: boolean;
  isFlipped?: boolean;
  className?: string;
}

/**
 * Render an authentic 3x3 Battle Board Card with exact aspect-[5/7] ratio,
 * matching original TCG card visuals (faction surfaces, rarity borders, metallic brackets, compass HUD).
 */
export function renderBattleBoardCardHtml(options: BattleBoardSlotCardOptions): string {
  const { cardId, stats, owner, isJustPlaced, isFlipped, className } = options;
  const asset = getCharacterAsset(cardId);
  const [top, right, bottom, left] = stats;
  const totalTP = top + right + bottom + left;

  const faction = (asset.faction || 'human').toLowerCase();
  const factionTheme = FACTION_SURFACES[faction] || FACTION_SURFACES.human;
  const rarity = (asset.rarity || 'bronze').toLowerCase();
  const rarityTheme = RARITY_THEMES[rarity] || RARITY_THEMES.bronze;

  const isPlayer = owner === 'player';
  const ownerRingClass = isPlayer
    ? 'ring-2 ring-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
    : 'ring-2 ring-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]';

  const animClass = isFlipped
    ? 'animate-card-flip ring-4 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,1)]'
    : isJustPlaced
    ? 'animate-card-place ring-2 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.9)]'
    : '';

  const statCircleClass = 'h-4 w-4 sm:h-5 sm:w-5 text-[8px] sm:text-[10px] border sm:border-2 font-black';

  return `
    <div
      data-rarity="${rarity}"
      class="group/slot-card relative flex flex-col justify-between font-mono select-none rounded-xs w-full aspect-[5/7] p-1 sm:p-1.5 overflow-hidden transition-all ${ownerRingClass} ${animClass} ${className || ''}"
      style="
        background-color: ${factionTheme.bg};
        border-style: solid;
        border-width: ${rarityTheme.borderWidth};
        border-color: ${rarityTheme.borderHex};
        box-shadow: ${rarityTheme.frameShadow};
      "
      aria-label="${asset.nameKo} (${isPlayer ? 'P1' : 'AI'})"
    >
      ${renderRarityFrameSvg(rarity)}

      <!-- Central Flip! Flash Impact Overlay -->
      ${
        isFlipped
          ? `
            <div class="absolute inset-0 z-50 flex items-center justify-center pointer-events-none select-none">
              <div class="px-2 py-0.5 bg-cyan-400 text-stone-950 border-2 border-white text-[10px] sm:text-xs font-black rounded-xs shadow-[0_0_20px_rgba(34,211,238,1)] animate-bounce tracking-wider uppercase rotate-[-6deg] whitespace-nowrap">
                ⚡ Flip!
              </div>
            </div>
          `
          : isJustPlaced
          ? `<span class="absolute top-0.5 left-1/2 -translate-x-1/2 z-40 px-1 py-0.2 bg-amber-400 text-stone-950 text-[7px] sm:text-[8px] font-black rounded-xs shadow-sm whitespace-nowrap border border-stone-900">PLACE</span>`
          : ''
      }

      <!-- 4-Way Compass Diamond HUD (N, S, E, W) -->
      <!-- North -->
      <div
        class="absolute top-0.5 sm:top-1 left-1/2 -translate-x-1/2 z-30 ${statCircleClass} rounded-full bg-[#fdfcfc] flex items-center justify-center text-[#201d1d] shadow-[0_1px_3px_rgba(0,0,0,0.35)] select-none"
        style="border-color: ${rarityTheme.statBadgeBorder};"
        title="North: ${top}"
      >
        ${top}
      </div>

      <!-- South -->
      <div
        class="absolute bottom-0.5 sm:bottom-1 left-1/2 -translate-x-1/2 z-30 ${statCircleClass} rounded-full bg-[#fdfcfc] flex items-center justify-center text-[#201d1d] shadow-[0_1px_3px_rgba(0,0,0,0.35)] select-none"
        style="border-color: ${rarityTheme.statBadgeBorder};"
        title="South: ${bottom}"
      >
        ${bottom}
      </div>

      <!-- West -->
      <div
        class="absolute left-0.5 sm:left-1 top-1/2 -translate-y-1/2 z-30 ${statCircleClass} rounded-full bg-[#fdfcfc] flex items-center justify-center text-[#201d1d] shadow-[0_1px_3px_rgba(0,0,0,0.35)] select-none"
        style="border-color: ${rarityTheme.statBadgeBorder};"
        title="West: ${left}"
      >
        ${left}
      </div>

      <!-- East -->
      <div
        class="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 z-30 ${statCircleClass} rounded-full bg-[#fdfcfc] flex items-center justify-center text-[#201d1d] shadow-[0_1px_3px_rgba(0,0,0,0.35)] select-none"
        style="border-color: ${rarityTheme.statBadgeBorder};"
        title="East: ${right}"
      >
        ${right}
      </div>

      <!-- 1. Header Bar: Owner Badge & Rarity -->
      <div class="relative z-20 flex items-center justify-between w-full pb-0.5 border-b border-black/15 text-[8px] sm:text-[9px] leading-none gap-0.5">
        <span class="px-1 py-0.2 rounded-xs font-black uppercase tracking-tight ${
          isPlayer ? 'bg-sky-500 text-slate-950' : 'bg-rose-500 text-white'
        }">
          ${isPlayer ? 'P1' : 'AI'}
        </span>
        <!-- Spacer for North Stat Badge -->
        <div class="w-4 shrink-0 pointer-events-none"></div>
        <span
          class="px-1 py-0.2 rounded-xs font-black uppercase text-[7px] sm:text-[8px] tracking-tight"
          style="background-color: ${rarityTheme.badgeBg}; color: ${rarityTheme.badgeText};"
        >
          ${rarity.slice(0, 1).toUpperCase()}
        </span>
      </div>

      <!-- 2. Central Illustration Window -->
      <div
        class="relative z-10 w-full flex-1 my-0.5 overflow-hidden border border-black/20 rounded-xs flex items-center justify-center"
        style="background-color: ${factionTheme.windowBg};"
      >
        <img
          src="${asset.bustPngUrl}?v=20261103v4"
          alt="${asset.nameKo}"
          class="max-w-full max-h-full object-contain filter drop-shadow-none"
          loading="eager"
          onerror="this.src='${asset.seatUrl}'; this.onerror=null;"
        />
      </div>

      <!-- 3. Footer Bar: Character Name -->
      <div class="relative z-20 w-full pt-0.5 border-t border-black/15 flex items-center justify-between text-[8px] sm:text-[9px] leading-tight">
        <span class="font-black text-[#201d1d] truncate" title="${asset.nameKo}">${asset.nameKo}</span>
        <!-- Spacer for South Stat Badge -->
        <div class="w-4 shrink-0 pointer-events-none"></div>
        <span class="font-bold text-amber-700 text-[8px]">⚡${totalTP}</span>
      </div>
    </div>
  `;
}
