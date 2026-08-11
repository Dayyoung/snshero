/**
 * SNSHero Revolution - Cache Manager
 * 429 Too Many Requests 방지 및 로컬 캐싱 관리 모듈
 */

export const CACHE_KEYS = {
  APP_CACHE_VERSION: 'hero_cache_version_timestamp',
  MODOO_STATUS: 'hero_modoo_status_cache',
  META_SETTINGS: 'hero_meta_cache',
  WEBTOON_PROGRESS: 'hero_webtoon_cache',
  ANALYTICS_QUEUE: 'hero_analytics_cache',
  RESOURCE_MANIFEST: 'hero_app_resource_cache_v1'
};

/**
 * 모든 로컬 캐시 데이터를 초기화합니다.
 */
export function resetAllCaches(): { success: boolean; clearedCount: number } {
  let clearedCount = 0;
  try {
    // 1. 특정 캐시 키들 제거
    Object.values(CACHE_KEYS).forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });

    // 2. hero_cache_ 또는 hero_xxx_cache 관련 키 모두 탐색하여 제거
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('_cache') || key.includes('_temp_'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((k) => {
      localStorage.removeItem(k);
      clearedCount++;
    });

    // 3. 새로운 캐시 타임스탬프 등록 (새로운 캐시 버스터로 활용)
    localStorage.setItem(CACHE_KEYS.APP_CACHE_VERSION, Date.now().toString());

    // 4. 서비스 워커 / Browser Cache API 지원 시 캐시 스토리지 삭제
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }

    return { success: true, clearedCount };
  } catch (error) {
    console.error('Failed to reset caches:', error);
    return { success: false, clearedCount: 0 };
  }
}

/**
 * 현재 캐시 타임스탬프 버전을 조회합니다.
 */
export function getCacheVersionTimestamp(): string {
  let ts = localStorage.getItem(CACHE_KEYS.APP_CACHE_VERSION);
  if (!ts) {
    ts = Date.now().toString();
    localStorage.setItem(CACHE_KEYS.APP_CACHE_VERSION, ts);
  }
  return ts;
}

/**
 * 특정 데이터를 로컬 캐시에 저장합니다.
 */
export function setLocalCache<T>(key: string, data: T): void {
  try {
    const payload = {
      timestamp: Date.now(),
      version: getCacheVersionTimestamp(),
      data
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    console.warn(`[CacheManager] Failed to write cache for ${key}:`, e);
  }
}

/**
 * 특정 데이터를 로컬 캐시에서 불러옵니다.
 */
export function getLocalCache<T>(key: string, maxAgeMs = 3600000): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    
    // 타임스탬프 유효성 검사 (maxAgeMs 경과 시 null 반환)
    if (parsed && parsed.timestamp && Date.now() - parsed.timestamp < maxAgeMs) {
      return parsed.data as T;
    }
    return null;
  } catch (e) {
    console.warn(`[CacheManager] Failed to read cache for ${key}:`, e);
    return null;
  }
}
