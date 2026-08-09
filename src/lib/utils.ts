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




