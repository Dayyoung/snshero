/**
 * SNSHero Revolution - Version Management & Cache Auto-Purge Service
 * 최신 버전을 서버 API (/version.json 또는 /api/version)로부터 1분 주기로 확인하고,
 * 버전/빌드 타임스탬프/번들 엔트리 변경 감지 시 브라우저 캐시를 초기화하고 페이지를 강제 새로고침합니다.
 */

import { resetAllCaches } from './cacheManager';
import { getAssetUrl } from './utils';

export interface AppVersionInfo {
  version: string;
  buildTime?: string;
  buildTimestamp?: number;
  service?: string;
  minRequiredVersion?: string;
  entryScript?: string;
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
export const STORAGE_BUILD_TIME_KEY = 'hero_server_build_timestamp';
export const STORAGE_ENTRY_SCRIPT_KEY = 'hero_entry_script';
export const STORAGE_LAST_CHECK_KEY = 'hero_last_version_check';

const SESSION_RELOAD_SIG_KEY = 'hero_last_version_reload_sig';
const SESSION_RELOAD_TS_KEY = 'hero_last_version_reload_ts';

let bootServerSignature: string | null = null;

function getVersionSignature(info: AppVersionInfo): string {
  return `${info.version || ''}|${info.buildTimestamp || ''}|${info.entryScript || ''}`;
}

function getLoadedEntryScript(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    for (const s of scripts) {
      const src = s.getAttribute('src') || '';
      if (src.includes('/assets/index-') && src.endsWith('.js')) {
        const idx = src.indexOf('/assets/index-');
        return src.slice(idx).split('?')[0];
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * 서버로부터 최신 버전 정보를 조회합니다.
 */
export async function fetchServerVersion(): Promise<AppVersionInfo | null> {
  const ts = Date.now();
  const endpoints = [
    `/version.json?_t=${ts}`,
    getAssetUrl(`/version.json?_t=${ts}`),
    `/api/version?_t=${ts}`
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
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
 * 버전 불일치 감지 시 캐시를 강제 갱신하고 페이지를 새로고침합니다.
 */
export async function forceReloadForNewVersion(targetSignature?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const now = Date.now();
    const lastSig = sessionStorage.getItem(SESSION_RELOAD_SIG_KEY);
    const lastTs = parseInt(sessionStorage.getItem(SESSION_RELOAD_TS_KEY) || '0', 10);

    // 동일한 타깃 버전에 대해 15초 이내 중복 리로드 루프 방지
    if (targetSignature && lastSig === targetSignature && now - lastTs < 15000) {
      return;
    }

    if (targetSignature) {
      sessionStorage.setItem(SESSION_RELOAD_SIG_KEY, targetSignature);
    }
    sessionStorage.setItem(SESSION_RELOAD_TS_KEY, String(now));
  } catch {
    // ignore sessionStorage error
  }

  try {
    resetAllCaches();
  } catch {
    // ignore
  }

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.update().catch(() => {})));
    }
  } catch {
    // ignore
  }

  try {
    // 현재 페이지 HTML에 대한 브라우저 디스크 캐시를 강제로 서버에서 새로 받아온 뒤 리로드
    await fetch(window.location.href, {
      method: 'GET',
      cache: 'reload',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }).catch(() => {});
  } catch {
    // ignore
  }

  window.location.reload();
}

/**
 * 최신 버전을 검증하고, 버전/빌드타임/엔트리 번들이 다르면 캐싱을 초기화합니다.
 * options.autoReload가 true이면 버전 불일치 감지 즉시 페이지를 강제 새로고침합니다.
 */
export async function checkAndSyncAppVersion(options?: { autoReload?: boolean }): Promise<VersionCheckResult> {
  const currentLocalVersion = getLocalAppVersion();
  const now = Date.now();

  try {
    const serverVersionInfo = await fetchServerVersion();

    if (!serverVersionInfo || !serverVersionInfo.version) {
      return {
        success: true,
        isUpdated: false,
        oldVersion: currentLocalVersion,
        newVersion: currentLocalVersion || '2.1.0',
        clearedItemsCount: 0
      };
    }

    const serverVersion = serverVersionInfo.version;
    const serverTimestamp = serverVersionInfo.buildTimestamp ? String(serverVersionInfo.buildTimestamp) : '';
    const serverEntryScript = serverVersionInfo.entryScript || '';
    const serverSig = getVersionSignature(serverVersionInfo);

    let storedBuildTs: string | null = null;
    let storedEntryScript: string | null = null;
    try {
      storedBuildTs = localStorage.getItem(STORAGE_BUILD_TIME_KEY);
      storedEntryScript = localStorage.getItem(STORAGE_ENTRY_SCRIPT_KEY);
    } catch {
      // ignore
    }

    const loadedEntryScript = getLoadedEntryScript();

    // 최초 방문 여부 (저장된 버전 정보가 전혀 없는 상태)
    const hasPriorStoredState = Boolean(currentLocalVersion || storedEntryScript);

    // 버전 불일치 조건 판별:
    // 1) 현재 탭 부팅 시점의 서버 시그니처와 달라진 경우 (1분 주기 폴링 중 신규 배포 감지)
    // 2) 현재 DOM에 로드된 index-*.js 번들 파일명과 서버 version.json의 entryScript가 다른 경우
    // 3) 기존 localStorage에 기록된 version, buildTimestamp, entryScript 중 하나라도 서버와 다른 경우
    const isBootSigChanged = bootServerSignature !== null && bootServerSignature !== serverSig;
    const isDomScriptOutdated = Boolean(
      loadedEntryScript &&
      serverEntryScript &&
      serverEntryScript !== '/assets/index.js' &&
      loadedEntryScript !== serverEntryScript
    );
    const isStoredVersionChanged = hasPriorStoredState && (
      (currentLocalVersion !== null && currentLocalVersion !== serverVersion) ||
      (storedBuildTs !== null && serverTimestamp !== '' && storedBuildTs !== serverTimestamp) ||
      (storedEntryScript !== null && serverEntryScript !== '' && storedEntryScript !== serverEntryScript)
    );

    const isVersionDifferent = isBootSigChanged || isDomScriptOutdated || isStoredVersionChanged;

    if (bootServerSignature === null) {
      bootServerSignature = serverSig;
    }

    // 최신 버전 정보를 localStorage에 동기화
    try {
      localStorage.setItem(STORAGE_VERSION_KEY, serverVersion);
      if (serverTimestamp) {
        localStorage.setItem(STORAGE_BUILD_TIME_KEY, serverTimestamp);
      }
      if (serverEntryScript) {
        localStorage.setItem(STORAGE_ENTRY_SCRIPT_KEY, serverEntryScript);
      }
      localStorage.setItem(STORAGE_LAST_CHECK_KEY, String(now));
    } catch (e) {
      console.warn('[VersionSync] LocalStorage write error:', e);
    }

    if (isVersionDifferent) {
      bootServerSignature = serverSig;
      console.log(`[VersionSync] New version detected (${currentLocalVersion ?? 'none'} -> ${serverVersion}). Purging stale caches & reloading...`);

      const resetResult = resetAllCaches();

      if (options?.autoReload) {
        void forceReloadForNewVersion(serverSig);
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
  void forceReloadForNewVersion(`manual-${Date.now()}`);
}
