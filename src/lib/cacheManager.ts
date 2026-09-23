/**
 * SNSHero Revolution - Cache Manager
 * 게임 핵심 데이터(카드, 덱, 재화)는 철저히 보존하고,
 * 오래된 뷰/세션/임시 캐시만 안전하게 정리합니다.
 */

export const CACHE_KEYS = [
  'hero_temp_view_cache',
  'hero_api_cache',
  'hero_image_prefetch_cache',
  'hero_match_prefetch',
  'hero_ranking_temp_cache',
] as const;

export const CACHE_VERSION_TIMESTAMP_KEY = 'hero_cache_version_ts';

export function getCacheVersionTimestamp(): number {
  try {
    const raw = localStorage.getItem(CACHE_VERSION_TIMESTAMP_KEY);
    return raw ? parseInt(raw, 10) : Date.now();
  } catch {
    return Date.now();
  }
}

export function resetAllCaches(): { clearedCount: number; clearedKeys: string[] } {
  let clearedCount = 0;
  const clearedKeys: string[] = [];

  try {
    for (const key of CACHE_KEYS) {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        clearedCount++;
        clearedKeys.push(key);
      }
    }

    // Clean session caches
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch {}

    // Update timestamp
    localStorage.setItem(CACHE_VERSION_TIMESTAMP_KEY, String(Date.now()));
  } catch (e) {
    console.warn('[CacheManager] Error clearing cache:', e);
  }

  return { clearedCount, clearedKeys };
}

export default { resetAllCaches, getCacheVersionTimestamp, CACHE_KEYS };
