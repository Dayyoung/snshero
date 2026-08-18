/**
 * Season Storage Helper Functions
 * Provides season-scoped localStorage read/write with legacy fallbacks.
 */

export const getSeasonItem = (
  baseKey: string, 
  season: string, 
  defaultValue: string | null = null
): string | null => {
  if (typeof window === 'undefined') return defaultValue;
  const seasonKey = `${baseKey}_${season}`;
  const val = localStorage.getItem(seasonKey);
  if (val !== null) return val;
  if (season === 'season1') {
    const legacyVal = localStorage.getItem(baseKey);
    if (legacyVal !== null) {
      localStorage.setItem(seasonKey, legacyVal);
      return legacyVal;
    }
  }
  return defaultValue;
};

export const setSeasonItem = (
  baseKey: string, 
  season: string, 
  value: string
): void => {
  if (typeof window === 'undefined') return;
  const seasonKey = `${baseKey}_${season}`;
  localStorage.setItem(seasonKey, value);
};

export const removeSeasonItem = (
  baseKey: string,
  season: string
): void => {
  if (typeof window === 'undefined') return;
  const seasonKey = `${baseKey}_${season}`;
  localStorage.removeItem(seasonKey);
};
