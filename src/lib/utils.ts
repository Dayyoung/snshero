import type { CSSProperties } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
export function getAssetUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  const baseUrl = import.meta.env.BASE_URL || './';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}${cleanPath}`;
}

/**
 * Returns the sprite sheet asset URL for a given card ID.
 * - ID 1 ~ 100: /cards1.png (10x10 sheet)
 * - ID 101+: /card2.png (or /cards2.png 10x10 sheet)
 */
export function getCardSpriteAsset(cardId: number): string {
  const id = Number(cardId) || 1;
  return id >= 101 ? '/card2.png' : '/cards1.png';
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
    // card2 / cards2: 100 slots in 10x10 grid. Cards 101~110 in row 0, 111~120 in row 1, etc.
    const offsetIndex = id >= 101 ? (id - 101) % 100 : (id - 1) % 100;
    const col = offsetIndex % 10;
    const row = Math.floor(offsetIndex / 10);
    const source = customSource || (id >= 101 ? '/card2.png' : '/cards2.png');
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

/**
 * Generates CSS background styling for card sprites.
 * - ID 1 ~ 100 -> cards1.png (10x10)
 * - ID 101+ -> card2.png (10x10)
 */
export function getCardSpriteStyle(cardId: number, customSource?: string | null): CSSProperties {
  const coords = getCardSpriteCoords(cardId, customSource);
  return {
    backgroundImage: `url('${coords.assetUrl}')`,
    backgroundSize: `${coords.cols * 100}% ${coords.rows * 100}%`,
    backgroundPosition: `${coords.xPercent}% ${coords.yPercent}%`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated' as const,
  };
}




