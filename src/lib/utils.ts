import type { CSSProperties } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CARD_DATABASE } from '../cardDatabase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Recursively removes undefined values from an object/array and replaces them with null.
 * Also ensures that nested objects are plain objects for Firestore.
 */
export function sanitizeForFirestore(data: any): any {
  if (data === undefined) return null;
  if (data === null) return null;
  if (Array.isArray(data)) return data.map(sanitizeForFirestore);
  if (typeof data === 'object') {
    // Skip special Firestore objects (FieldValue, Timestamp, etc.)
    if (data.constructor && (
      data.constructor.name === 'FieldValue' || 
      data.constructor.name === 'Timestamp' ||
      data.constructor.name === 'GeoPoint'
    )) {
      return data;
    }

    // Heuristic for Firestore FieldValue if name is mangled
    if (data._methodName) {
      return data;
    }

    const cleaned: any = {};
    for (const key in data) {
      const value = sanitizeForFirestore(data[key]);
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
  return data;
}

/**
 * Simple checksum for data integrity.
 * Note: This is not cryptographic security, but prevents simple console manipulation.
 */
export function generateCheckSum(data: any): string {
  const salt = "snshero-rev-v1-secret-salt";
  const str = JSON.stringify(data) + salt;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Obfuscates a string using Base64
 */
export function obfuscate(val: string): string {
  try {
    return btoa(val);
  } catch (e) {
    return val;
  }
}

/**
 * De-obfuscates a string from Base64
 */
export function deobfuscate(val: string): string {
  try {
    return atob(val);
  } catch (e) {
    return val;
  }
}
/**
 * Returns the card name prefixed with its ID.
 * Format: {id}.{name}
 */
export function getFormattedCardName(card: any, language: string = 'en'): string {
  if (!card) return '';
  const id = card.imageIndex !== undefined ? card.imageIndex : (typeof card.id === 'number' ? card.id : null);
  
  // Use title_dis as the "English Title" if title_en is just a code like Water1
  const title = language === 'ko' ? (card.title || card.title_dis) : (card.title_dis || card.title_en);
  
  if (id !== null) {
    return `${id}.${title}`;
  }
  return title || '';
}

/**
 * Returns the Firestore user collection name based on the season.
 */
export function getUserCollectionName(season: string): string {
  if (season === 'season1') return 'users';
  return `users_${season}`;
}

/**
 * Resolves a public asset path to properly support subpath hosting (e.g. GitHub Pages /snshero/).
 */
const CHARACTER_ASSET_CACHE_TAG = 'v=banana2026';
const CHARACTER_ASSET_REGEX = /^(cards1|cards2|card2|card100|character_sheet_|seat\/)/i;

export function getAssetUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  const baseUrl = import.meta?.env?.BASE_URL;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const resolved = (baseUrl && baseUrl !== './')
    ? `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}${cleanPath}`
    : `/${cleanPath}`;
  if (!resolved.includes('?') && CHARACTER_ASSET_REGEX.test(cleanPath)) {
    return `${resolved}?${CHARACTER_ASSET_CACHE_TAG}`;
  }
  return resolved;
}

/**
 * Checks if an image source URL or path corresponds to a card sprite sheet.
 */
export function isSpriteSheet(source?: string | null): boolean {
  if (!source) return false;
  return (
    source.includes('cards1') ||
    source.includes('card2') ||
    source.includes('cards2') ||
    source.includes('card100') ||
    source.includes('110card')
  );
}

/**
 * Returns the sprite sheet asset URL for a given card ID.
 * - ID 1 ~ 100: /cards1.png (10x10 sheet)
 * - ID 101+: /cards2.png (10x10 sheet)
 */
export function getCardSpriteAsset(cardId: number): string {
  const id = Number(cardId) || 1;
  return id >= 101 ? '/cards2.png' : '/cards1.png';
}

export interface CardSpriteCoords {
  assetUrl: string;
  source: string;
  col: number;
  row: number;
  cols: number;
  rows: number;
  xPercent: number;
  yPercent: number;
}

export function getCardSpriteCoords(cardId: number, customSource?: string | null): CardSpriteCoords {
  const id = Number(cardId) || 1;
  const isCards2 = customSource 
    ? (customSource.includes('card2') || customSource.includes('cards2')) 
    : (id >= 101);
  const isLegacy110 = customSource && (customSource.includes('card100') || customSource.includes('110card'));

  if (isLegacy110) {
    const cols = 10;
    const rows = 11;
    const validId = Math.max(1, Math.min(110, id));
    const col = (validId - 1) % cols;
    const row = Math.floor((validId - 1) / cols);
    const source = customSource || '/card100.png';
    return {
      assetUrl: getAssetUrl(source),
      source,
      col,
      row,
      cols,
      rows,
      xPercent: col * (100 / (cols - 1)),
      yPercent: row * (100 / (rows - 1)),
    };
  }

  if (isCards2) {
    const cols = 10;
    const rows = 10;
    // cards2 / card2: 100 slots in 10x10 grid. Cards 101~110 in row 0, 111~120 in row 1, etc.
    const offsetIndex = id >= 101 ? (id - 101) % 100 : (id - 1) % 100;
    const col = offsetIndex % 10;
    const row = Math.floor(offsetIndex / 10);
    const source = customSource || '/cards2.png';
    return {
      assetUrl: getAssetUrl(source),
      source,
      col,
      row,
      cols,
      rows,
      xPercent: col * (100 / (cols - 1)),
      yPercent: row * (100 / (rows - 1)),
    };
  }

  // Default: cards1 (10x10, cards 1..100)
  const cols = 10;
  const rows = 10;
  const validIndex = Math.max(0, Math.min(99, (id - 1) % 100));
  const col = validIndex % cols;
  const row = Math.floor(validIndex / cols);
  const source = customSource || '/cards1.png';
  return {
    assetUrl: getAssetUrl(source),
    source,
    col,
    row,
    cols,
    rows,
    xPercent: col * (100 / (cols - 1)),
    yPercent: row * (100 / (rows - 1)),
  };
}

export interface CardCharacterBackdropTheme {
  faction: 'water' | 'fire' | 'wind' | 'earth' | 'human' | 'undead' | 'elf' | 'dwarf' | 'monster' | 'robot' | 'dragon';
  factionKey: 'water' | 'fire' | 'wind' | 'earth' | 'human' | 'undead' | 'elf' | 'dwarf' | 'monster' | 'robot' | 'dragon';
  factionLabelKo: string;
  factionLabelEn: string;
  factionEmoji: string;
  bgLight: string;
  bgMid: string;
  bgDeep: string;
  accentHex: string;
  glowRgba: string;
  rayRgba: string;
  rarityGroup: 'bronze' | 'silver' | 'gold' | 'special';
  rarityLabel: string;
  raritySymbol: string;
  rarityRingHex: string;
  rarityBorderHex: string;
  rarityGlowRgba: string;
  /** Metallic multi-stop bezel gradient for Bronze / Silver / Gold / Special */
  frameGradient: string;
  frameOuterBorderHex: string;
  frameInnerRimHex: string;
  frameBoxShadow: string;
  windowBoxShadow: string;
  thumbnailBoxShadow: string;
  prestigeStarCount: number;
  isHighPrestige: boolean;
  powerScore: number;
  powerTier: 1 | 2 | 3 | 4 | 5;
  powerTierLabel: string;
  powerTierColor: string;
  /** CSS background string for the character illustration window */
  windowCssBackground: string;
}

const FACTION_BACKDROP_PALETTE: Record<
  CardCharacterBackdropTheme['factionKey'],
  {
    ko: string;
    en: string;
    emoji: string;
    bgLight: string;
    bgMid: string;
    bgDeep: string;
    accentHex: string;
    glowRgba: string;
    rayRgba: string;
  }
> = {
  water: {
    ko: '물',
    en: 'WATER',
    emoji: '💧',
    bgLight: '#e0f2fe',
    bgMid: '#7dd3fc',
    bgDeep: '#0284c7',
    accentHex: '#0369a1',
    glowRgba: 'rgba(14, 165, 233, 0.45)',
    rayRgba: 'rgba(56, 189, 248, 0.36)',
  },
  fire: {
    ko: '불',
    en: 'FIRE',
    emoji: '🔥',
    bgLight: '#ffedd5',
    bgMid: '#fdba74',
    bgDeep: '#ea580c',
    accentHex: '#c2410c',
    glowRgba: 'rgba(249, 115, 22, 0.48)',
    rayRgba: 'rgba(251, 146, 60, 0.40)',
  },
  wind: {
    ko: '바람',
    en: 'WIND',
    emoji: '🌪️',
    bgLight: '#ccfbf1',
    bgMid: '#5eead4',
    bgDeep: '#0d9488',
    accentHex: '#0f766e',
    glowRgba: 'rgba(20, 184, 166, 0.45)',
    rayRgba: 'rgba(45, 212, 191, 0.36)',
  },
  earth: {
    ko: '대지',
    en: 'EARTH',
    emoji: '🪨',
    bgLight: '#ecfccb',
    bgMid: '#bef264',
    bgDeep: '#65a30d',
    accentHex: '#4d7c0f',
    glowRgba: 'rgba(132, 204, 22, 0.45)',
    rayRgba: 'rgba(163, 230, 53, 0.36)',
  },
  human: {
    ko: '인간',
    en: 'HUMAN',
    emoji: '⚔️',
    bgLight: '#fef9c3',
    bgMid: '#fde047',
    bgDeep: '#ca8a04',
    accentHex: '#a16207',
    glowRgba: 'rgba(234, 179, 8, 0.45)',
    rayRgba: 'rgba(250, 204, 21, 0.38)',
  },
  undead: {
    ko: '언데드',
    en: 'UNDEAD',
    emoji: '💀',
    bgLight: '#f3e8ff',
    bgMid: '#d8b4fe',
    bgDeep: '#9333ea',
    accentHex: '#6b21a8',
    glowRgba: 'rgba(168, 85, 247, 0.45)',
    rayRgba: 'rgba(192, 132, 252, 0.38)',
  },
  elf: {
    ko: '엘프',
    en: 'ELF',
    emoji: '🧝',
    bgLight: '#dcfce7',
    bgMid: '#86efac',
    bgDeep: '#16a34a',
    accentHex: '#15803d',
    glowRgba: 'rgba(34, 197, 94, 0.45)',
    rayRgba: 'rgba(74, 222, 128, 0.36)',
  },
  dwarf: {
    ko: '드워프',
    en: 'DWARF',
    emoji: '⛏️',
    bgLight: '#fef3c7',
    bgMid: '#fcd34d',
    bgDeep: '#d97706',
    accentHex: '#92400e',
    glowRgba: 'rgba(217, 119, 6, 0.46)',
    rayRgba: 'rgba(245, 158, 11, 0.38)',
  },
  monster: {
    ko: '몬스터',
    en: 'MONSTER',
    emoji: '👹',
    bgLight: '#ffe4e6',
    bgMid: '#fda4af',
    bgDeep: '#e11d48',
    accentHex: '#9f1239',
    glowRgba: 'rgba(225, 29, 72, 0.45)',
    rayRgba: 'rgba(251, 113, 133, 0.36)',
  },
  robot: {
    ko: '로봇',
    en: 'ROBOT',
    emoji: '🤖',
    bgLight: '#e0e7ff',
    bgMid: '#93c5fd',
    bgDeep: '#2563eb',
    accentHex: '#1e40af',
    glowRgba: 'rgba(59, 130, 246, 0.45)',
    rayRgba: 'rgba(96, 165, 250, 0.36)',
  },
  dragon: {
    ko: '드래곤',
    en: 'DRAGON',
    emoji: '🐉',
    bgLight: '#fef2f2',
    bgMid: '#fca5a5',
    bgDeep: '#dc2626',
    accentHex: '#991b1b',
    glowRgba: 'rgba(220, 38, 38, 0.50)',
    rayRgba: 'rgba(250, 204, 21, 0.45)',
  },
};

function resolveFactionKey(cardId: number, rawFaction?: string | null): CardCharacterBackdropTheme['factionKey'] {
  const norm = (rawFaction || '').toLowerCase().trim();
  if (norm === 'water') return 'water';
  if (norm === 'fire') return 'fire';
  if (norm === 'wind' || norm === 'air') return 'wind';
  if (norm === 'earth' || norm === 'land') return 'earth';
  if (norm === 'human') return 'human';
  if (norm === 'undead') return 'undead';
  if (norm === 'elf') return 'elf';
  if (norm === 'dwarf') return 'dwarf';
  if (norm === 'monster') return 'monster';
  if (norm === 'robot') return 'robot';
  if (norm === 'dragon') return 'dragon';

  const id = Math.max(1, Math.min(110, Number(cardId) || 1));
  if (id <= 10) return 'water';
  if (id <= 20) return 'fire';
  if (id <= 30) return 'wind';
  if (id <= 40) return 'earth';
  if (id <= 50) return 'human';
  if (id <= 60) return 'undead';
  if (id <= 70) return 'elf';
  if (id <= 80) return 'dwarf';
  if (id <= 90) return 'monster';
  if (id <= 100) return 'robot';
  return 'dragon';
}

export function getCardCharacterBackdropTheme(
  cardId: number,
  overrides?: {
    faction?: string | null;
    rarity?: string | null;
    power?: number | null;
  }
): CardCharacterBackdropTheme {
  const dbCard = CARD_DATABASE[Number(cardId) || 1];
  const factionKey = resolveFactionKey(cardId, overrides?.faction ?? dbCard?.element);
  const pal = FACTION_BACKDROP_PALETTE[factionKey];

  const rawRarity = (overrides?.rarity ?? dbCard?.rarity ?? 'bronze').toLowerCase();
  let rarityGroup: CardCharacterBackdropTheme['rarityGroup'] = 'bronze';
  if (rawRarity === 'silver' || rawRarity === 'magic' || rawRarity === 'r') {
    rarityGroup = 'silver';
  } else if (rawRarity === 'gold' || rawRarity === 'rare' || rawRarity === 'sr') {
    rarityGroup = 'gold';
  } else if (
    rawRarity === 'platinum' ||
    rawRarity === 'diamond' ||
    rawRarity === 'legendary' ||
    rawRarity === 'epic' ||
    rawRarity === 'social' ||
    rawRarity === 'ssr' ||
    rawRarity === 'ur'
  ) {
    rarityGroup = 'special';
  }

  const powerScore = Number(overrides?.power ?? dbCard?.power ?? 15);
  let powerTier: 1 | 2 | 3 | 4 | 5 = 1;
  let powerTierLabel = 'P1';
  let powerTierColor = '#64748b';
  if (powerScore >= 27) {
    powerTier = 5;
    powerTierLabel = 'P5·MAX';
    powerTierColor = '#dc2626';
  } else if (powerScore >= 24) {
    powerTier = 4;
    powerTierLabel = 'P4';
    powerTierColor = '#d97706';
  } else if (powerScore >= 20) {
    powerTier = 3;
    powerTierLabel = 'P3';
    powerTierColor = '#16a34a';
  } else if (powerScore >= 15) {
    powerTier = 2;
    powerTierLabel = 'P2';
    powerTierColor = '#0284c7';
  }

  const isHighPrestige = rarityGroup === 'gold' || rarityGroup === 'special' || powerTier >= 4;
  const prestigeStarCount =
    rarityGroup === 'special' || powerTier === 5
      ? 5
      : rarityGroup === 'gold' || powerTier === 4
      ? 4
      : rarityGroup === 'silver' || powerTier === 3
      ? 3
      : powerTier === 2
      ? 2
      : 1;

  const rarityConfig = {
    bronze: {
      label: 'BRZ',
      symbol: '🥉',
      ringHex: '#9a5b32',
      glowRgba: 'rgba(154, 91, 50, 0.35)',
      frameGradient:
        'linear-gradient(135deg, #4a2810 0%, #c8824e 22%, #7c4724 48%, #e2ab7f 74%, #5c3419 100%)',
      frameOuterBorderHex: '#4a2810',
      frameInnerRimHex: '#c8824e',
      frameBoxShadow:
        'inset 0 0 0 1.5px rgba(255,224,194,0.65), inset 0 0 0 3px #5c3419, 0 2px 6px rgba(74,40,16,0.32)',
      windowBoxShadow:
        'inset 0 0 0 1.5px rgba(200,130,78,0.75), inset 0 0 8px rgba(92,52,25,0.28)',
      thumbnailBoxShadow:
        'inset 0 0 0 2px #6b3e20, inset 0 0 0 3.5px #d99b6c',
    },
    silver: {
      label: 'SLV',
      symbol: '🥈',
      ringHex: '#475569',
      glowRgba: 'rgba(100, 116, 139, 0.48)',
      frameGradient:
        'linear-gradient(135deg, #1e293b 0%, #f8fafc 20%, #94a3b8 44%, #ffffff 66%, #64748b 84%, #1e293b 100%)',
      frameOuterBorderHex: '#1e293b',
      frameInnerRimHex: '#f8fafc',
      frameBoxShadow:
        'inset 0 0 0 1.5px #ffffff, inset 0 0 0 3px #475569, 0 3px 10px rgba(51,65,85,0.40)',
      windowBoxShadow:
        'inset 0 0 0 1.5px #f8fafc, inset 0 0 10px rgba(100,116,139,0.35), 0 0 6px rgba(148,163,184,0.45)',
      thumbnailBoxShadow:
        'inset 0 0 0 2px #334155, inset 0 0 0 3.5px #f1f5f9, inset 0 0 6px rgba(148,163,184,0.45)',
    },
    gold: {
      label: 'GLD',
      symbol: '👑',
      ringHex: '#ca8a04',
      glowRgba: 'rgba(234, 179, 8, 0.65)',
      frameGradient:
        'linear-gradient(135deg, #78350f 0%, #fef08a 18%, #d97706 36%, #fffbeb 52%, #ca8a04 70%, #fde047 86%, #78350f 100%)',
      frameOuterBorderHex: '#78350f',
      frameInnerRimHex: '#fef08a',
      frameBoxShadow:
        'inset 0 0 0 1.5px #fef9c3, inset 0 0 0 3.2px #b45309, 0 0 16px rgba(234,179,8,0.62), 0 3px 10px rgba(120,53,15,0.42)',
      windowBoxShadow:
        'inset 0 0 0 1.5px #fef08a, inset 0 0 12px rgba(234,179,8,0.48), 0 0 10px rgba(234,179,8,0.55)',
      thumbnailBoxShadow:
        'inset 0 0 0 2.5px #92400e, inset 0 0 0 4.5px #fde047, inset 0 0 10px rgba(234,179,8,0.58)',
    },
    special: {
      label: 'ULT',
      symbol: '✨',
      ringHex: '#9333ea',
      glowRgba: 'rgba(168, 85, 247, 0.72)',
      frameGradient:
        'linear-gradient(135deg, #4c1d95 0%, #f43f5e 16%, #fde047 34%, #ffffff 50%, #a855f7 68%, #22d3ee 84%, #fde047 100%)',
      frameOuterBorderHex: '#581c87',
      frameInnerRimHex: '#fde047',
      frameBoxShadow:
        'inset 0 0 0 1.5px #ffffff, inset 0 0 0 3.2px #facc15, 0 0 20px rgba(168,85,247,0.68), 0 0 10px rgba(250,204,21,0.68)',
      windowBoxShadow:
        'inset 0 0 0 1.5px #fde047, inset 0 0 14px rgba(168,85,247,0.52), 0 0 12px rgba(234,179,8,0.62)',
      thumbnailBoxShadow:
        'inset 0 0 0 2.5px #6b21a8, inset 0 0 0 4.5px #fde047, inset 0 0 12px rgba(168,85,247,0.65)',
    },
  }[rarityGroup];

  // Build CSS background layers combining:
  // 1) Power Tier sunburst / energy aura
  // 2) Rarity halo ring
  // 3) Faction / Race color atmosphere
  const rayStepDeg = powerTier === 5 ? 7.5 : powerTier === 4 ? 10 : powerTier === 3 ? 15 : 30;
  const powerBurstLayer =
    powerTier >= 3
      ? `repeating-conic-gradient(from 0deg at 50% 52%, ${pal.rayRgba} 0deg ${rayStepDeg}deg, transparent ${rayStepDeg}deg ${rayStepDeg * 2}deg)`
      : `repeating-linear-gradient(135deg, rgba(255,255,255,0.28) 0px 6px, transparent 6px 14px)`;

  const rarityHaloLayer =
    rarityGroup === 'special'
      ? `radial-gradient(circle at 50% 52%, rgba(255,255,255,0.94) 0%, rgba(250,204,21,0.38) 32%, rgba(244,114,182,0.36) 52%, ${pal.glowRgba} 76%, transparent 92%)`
      : rarityGroup === 'gold'
      ? `radial-gradient(circle at 50% 52%, rgba(255,254,240,0.96) 0%, rgba(250,204,21,0.48) 42%, ${pal.glowRgba} 72%, transparent 90%)`
      : rarityGroup === 'silver'
      ? `radial-gradient(circle at 50% 52%, rgba(255,255,255,0.93) 0%, ${pal.glowRgba} 55%, rgba(148,163,184,0.38) 78%, transparent 92%)`
      : `radial-gradient(circle at 50% 52%, rgba(255,255,255,0.88) 0%, ${pal.glowRgba} 58%, transparent 88%)`;

  const factionBaseLayer =
    powerTier >= 4
      ? `linear-gradient(165deg, ${pal.bgLight} 0%, ${pal.bgMid} 52%, ${pal.bgDeep} 100%)`
      : powerTier === 3
      ? `linear-gradient(165deg, ${pal.bgLight} 0%, ${pal.bgMid} 68%, ${pal.bgDeep} 100%)`
      : `linear-gradient(165deg, #fdfcfc 0%, ${pal.bgLight} 45%, ${pal.bgMid} 100%)`;

  const windowCssBackground = `${rarityHaloLayer}, ${powerBurstLayer}, ${factionBaseLayer}`;

  return {
    faction: factionKey,
    factionKey,
    factionLabelKo: pal.ko,
    factionLabelEn: pal.en,
    factionEmoji: pal.emoji,
    bgLight: pal.bgLight,
    bgMid: pal.bgMid,
    bgDeep: pal.bgDeep,
    accentHex: pal.accentHex,
    glowRgba: pal.glowRgba,
    rayRgba: pal.rayRgba,
    rarityGroup,
    rarityLabel: rarityConfig.label,
    raritySymbol: rarityConfig.symbol,
    rarityRingHex: rarityConfig.ringHex,
    rarityBorderHex: rarityConfig.ringHex,
    rarityGlowRgba: rarityConfig.glowRgba,
    frameGradient: rarityConfig.frameGradient,
    frameOuterBorderHex: rarityConfig.frameOuterBorderHex,
    frameInnerRimHex: rarityConfig.frameInnerRimHex,
    frameBoxShadow: rarityConfig.frameBoxShadow,
    windowBoxShadow: rarityConfig.windowBoxShadow,
    thumbnailBoxShadow: rarityConfig.thumbnailBoxShadow,
    prestigeStarCount,
    isHighPrestige,
    powerScore,
    powerTier,
    powerTierLabel,
    powerTierColor,
    windowCssBackground,
  };
}

/**
 * Generates CSS background styling for card sprites with a built-in
 * 3-axis (Power Tier x Rarity Grade x Race/Faction) backdrop and metallic Bronze/Silver/Gold/Special frame.
 * - ID 1 ~ 100 -> cards1.png (10x10)
 * - ID 101+ -> cards2.png (10x10)
 */
export function getCardSpriteStyle(cardId: number, customSource?: string | null): CSSProperties {
  const coords = getCardSpriteCoords(cardId, customSource);
  const backdrop = getCardCharacterBackdropTheme(cardId);
  return {
    backgroundColor: backdrop.bgLight,
    backgroundImage: `url('${coords.assetUrl}'), ${backdrop.windowCssBackground}`,
    backgroundSize: `${coords.cols * 100}% ${coords.rows * 100}%, 100% 100%, 100% 100%, 100% 100%`,
    backgroundPosition: `${coords.xPercent}% ${coords.yPercent}%, center center, center center, center center`,
    backgroundRepeat: 'no-repeat, no-repeat, no-repeat, no-repeat',
    boxShadow: backdrop.thumbnailBoxShadow,
    imageRendering: 'auto' as const,
  };
}





