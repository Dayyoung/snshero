/**
 * SNSHero Revolution - Version Management & Cache Auto-Purge Service
 * 최신 버전을 서버 API (/api/version 또는 /version.json)로부터 확인하고,
 * 버전 변경 감지 시 브라우저 캐시 및 로컬 임시 데이터를 안전하게 초기화합니다.
 */

import { resetAllCaches, getCacheVersionTimestamp, CACHE_KEYS } from './cacheManager';
import { getAssetUrl } from './utils';

export interface AppVersionInfo {
  version: string;
  buildTime?: string;
  buildTimestamp?: number;
  service?: string;
  minRequiredVersion?: string;
}

export interface VersionCheckResult {
  success: boolean;
  isUpdated: boolean;
  oldVersion: string | null;
  newVersion: string;
  clearedItemsCount: number;
  serverInfo?: AppVersionInfo;
  error?: string;
}

export const STORAGE_VERSION_KEY = 'hero_app_version';
export const STORAGE_BUILD_TIME_KEY = 'hero_build_version';
export const STORAGE_LAST_CHECK_KEY = 'hero_last_version_check';

/**
 * 서버로부터 최신 버전 정보를 조회합니다.
 */
export async function fetchServerVersion(): Promise<AppVersionInfo | null> {
  const endpoints = [
    getAssetUrl(`/version.json?_t=${Date.now()}`),
    `/version.json?_t=${Date.now()}`,
    `/api/version?_t=${Date.now()}`
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.version === 'string') {
          return data as AppVersionInfo;
        }
      }
    } catch {
      // 다음 엔드포인트로 fallback 시도
      continue;
    }
  }

  return null;
}

/**
 * 현재 로컬에 기록된 앱 버전을 가져옵니다.
 */
export function getLocalAppVersion(): string | null {
  try {
    return localStorage.getItem(STORAGE_VERSION_KEY);
  } catch {
    return null;
  }
}

/**
 * 시작 로딩 시 최신 버전을 검증하고, 버전이 다르면 캐싱을 전면 초기화합니다.
 */
export async function checkAndSyncAppVersion(): Promise<VersionCheckResult> {
  const currentLocalVersion = getLocalAppVersion();
  const now = Date.now();

  try {
    const serverVersionInfo = await fetchServerVersion();

    if (!serverVersionInfo || !serverVersionInfo.version) {
      // 서버 응답이 없으면 (오프라인 등) 기존 로컬 버전 유지하고 성공으로 간주
      return {
        success: true,
        isUpdated: false,
        oldVersion: currentLocalVersion,
        newVersion: currentLocalVersion || '2.1.0',
        clearedItemsCount: 0
      };
    }

    const serverVersion = serverVersionInfo.version;
    const serverTimestamp = serverVersionInfo.buildTimestamp || now;

    // 로컬 버전과 서버 버전 비교
    const isVersionDifferent = !currentLocalVersion || currentLocalVersion !== serverVersion;

    if (isVersionDifferent) {
      console.log(`[VersionSync] New version detected: ${currentLocalVersion ?? 'none'} -> ${serverVersion}. Resetting stale caches...`);

      // 1. 캐시 전면 초기화
      const resetResult = resetAllCaches();

      // 2. 새 버전 정보 저장
      try {
        localStorage.setItem(STORAGE_VERSION_KEY, serverVersion);
        localStorage.setItem(STORAGE_BUILD_TIME_KEY, String(serverTimestamp));
        localStorage.setItem(STORAGE_LAST_CHECK_KEY, String(now));
      } catch (e) {
        console.warn('[VersionSync] LocalStorage write error:', e);
      }

      return {
        success: true,
        isUpdated: true,
        oldVersion: currentLocalVersion,
        newVersion: serverVersion,
        clearedItemsCount: resetResult.clearedCount,
        serverInfo: serverVersionInfo
      };
    }

    // 버전이 같은 경우 정상 통과
    try {
      localStorage.setItem(STORAGE_LAST_CHECK_KEY, String(now));
    } catch {
      // ignore
    }

    return {
      success: true,
      isUpdated: false,
      oldVersion: currentLocalVersion,
      newVersion: serverVersion,
      clearedItemsCount: 0,
      serverInfo: serverVersionInfo
    };
  } catch (error) {
    console.warn('[VersionSync] Failed to verify version with server:', error);
    return {
      success: false,
      isUpdated: false,
      oldVersion: currentLocalVersion,
      newVersion: currentLocalVersion || '2.1.0',
      clearedItemsCount: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 수동 캐시 초기화 및 최신 버전 재적용
 */
export function forcePurgeAndReload(): void {
  try {
    resetAllCaches();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  } catch (e) {
    console.error('Force purge failed:', e);
  }
}
