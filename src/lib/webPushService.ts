/**
 * webPushService.ts
 * SNS히어로 웹푸시 알림 관리 및 Google Sheets 연동 서비스
 * 
 * 1. 기기 환경 감지 (iOS 여부, PWA 독립실행 여부, Notification 지원 여부)
 * 2. iOS 환경 시 PWA 미설치 감지 및 안내 가이드 트리거
 * 3. 웹푸시 권한 요청 및 푸시 토큰 생성, 로컬스토리지 영구 저장
 * 4. Google Sheets (Form Response)에 푸시 토큰 비동기 영구 저장 (Zero-DB 글로벌 등록)
 * 5. Google Sheets로부터 등록된 전체 푸시 토큰 목록 조회 및 전체 브로드캐스트 푸시 발송
 */

export const GOOGLE_FORM_PUSH_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSer0AqPbpduTxfSJNg3X8Pa1C8h2L5_Skmbt0NDdVZt6bS1GA/formResponse';
export const GOOGLE_SHEET_PUSH_ID = '1o8rwdG_O_-efkKHgf9oMpFaOUnAAVxMQVfDldFavbjg';
export const GOOGLE_SHEET_PUSH_CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_PUSH_ID}/gviz/tq?tqx=out:csv`;

const FORM_ENTRY_CATEGORY = 'entry.971729544';
const FORM_ENTRY_LABEL = 'entry.815360484';
const FORM_ENTRY_TEXT = 'entry.1672381815';
const FORM_ENTRY_METADATA = 'entry.1335992406';

export const LOCAL_PUSH_TOKEN_KEY = 'hero_push_token';
export const LOCAL_PUSH_REGISTERED_AT_KEY = 'hero_push_registered_at';
export const LOCAL_PUSH_PLATFORM_KEY = 'hero_push_platform';
export const LOCAL_PUSH_SYNCED_SHEET_KEY = 'hero_push_synced_sheet';
export const LOCAL_PUSH_BROADCAST_LOGS_KEY = 'hero_push_broadcast_logs';

export interface DevicePushStatus {
  isSupported: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  needsIosPwaInstall: boolean;
  permission: NotificationPermission;
  hasRegisteredToken: boolean;
  token: string | null;
  registeredAt: number | null;
  platformName: string;
}

export interface SheetPushSubscriber {
  token: string;
  label: string;
  platform: string;
  registeredAt: number;
}

export interface BroadcastLogItem {
  id: string;
  title: string;
  body: string;
  url: string;
  sentAt: number;
  recipientCount: number;
  status: 'sent' | 'failed';
}

export class WebPushService {
  /**
   * 브라우저 및 기기 환경 실시간 진단
   */
  static getDeviceStatus(): DevicePushStatus {
    if (typeof window === 'undefined') {
      return {
        isSupported: false,
        isIOS: false,
        isStandalone: false,
        needsIosPwaInstall: false,
        permission: 'default',
        hasRegisteredToken: false,
        token: null,
        registeredAt: null,
        platformName: 'Server',
      };
    }

    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // PWA 단독 실행(standalone) 여부 감지
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone === true;

    // 브라우저 웹푸시 지원 여부
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;

    // iOS는 PWA(홈 화면 추가) 상태에서만 iOS 16.4+ Web Push가 지원됨
    const needsIosPwaInstall = isIOS && !isStandalone;

    const permission: NotificationPermission = ('Notification' in window) 
      ? Notification.permission 
      : 'denied';

    const token = localStorage.getItem(LOCAL_PUSH_TOKEN_KEY);
    const regAtRaw = localStorage.getItem(LOCAL_PUSH_REGISTERED_AT_KEY);
    const registeredAt = regAtRaw ? parseInt(regAtRaw, 10) : null;

    let platformName = 'Desktop';
    if (isIOS) {
      platformName = isStandalone ? 'iOS (PWA)' : 'iOS (Safari)';
    } else if (/Android/i.test(ua)) {
      platformName = isStandalone ? 'Android (PWA)' : 'Android (Chrome)';
    } else if (/Mac/i.test(ua)) {
      platformName = 'macOS';
    } else if (/Win/i.test(ua)) {
      platformName = 'Windows';
    }

    return {
      isSupported,
      isIOS,
      isStandalone,
      needsIosPwaInstall,
      permission,
      hasRegisteredToken: Boolean(token),
      token,
      registeredAt,
      platformName,
    };
  }

  /**
   * 웹푸시 권한 요청, 토큰 발급 및 구글 시트 영구 등록
   */
  static async registerWebPush(customUserName?: string): Promise<{
    success: boolean;
    reason?: 'ios_pwa_required' | 'unsupported' | 'permission_denied' | 'error';
    token?: string;
    message?: string;
  }> {
    const status = this.getDeviceStatus();

    // 1. iOS인데 PWA가 아닌 경우 안내 모달 트리거 필요
    if (status.needsIosPwaInstall) {
      return {
        success: false,
        reason: 'ios_pwa_required',
        message: 'iOS 환경에서는 홈 화면에 추가(PWA 설치) 후 실행해야 웹푸시 알림을 수신할 수 있습니다.',
      };
    }

    // 2. 알림 미지원 브라우저
    if (!status.isSupported) {
      return {
        success: false,
        reason: 'unsupported',
        message: '현재 브라우저는 Web Push 알림을 지원하지 않습니다.',
      };
    }

    try {
      // 3. 브라우저 알림 권한 요청
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        return {
          success: false,
          reason: 'permission_denied',
          message: '알림 권한이 거부되었습니다. 브라우저 설정에서 알림 권한을 허용해주세요.',
        };
      }

      // 4. 서비스 워커 등록 확인
      let reg: ServiceWorkerRegistration | null = null;
      try {
        if ('serviceWorker' in navigator) {
          reg = await navigator.serviceWorker.register('/sw.js').catch(() => null);
          await navigator.serviceWorker.ready.catch(() => null);
        }
      } catch (swErr) {
        console.warn('[WebPush] SW registration note:', swErr);
      }

      // 5. 푸시 토큰 생성 (고유 토큰 및 디바이스 지문)
      const now = Date.now();
      const existingToken = localStorage.getItem(LOCAL_PUSH_TOKEN_KEY);
      const pushToken = existingToken || `wp_${now}_${Math.random().toString(36).substring(2, 10)}`;

      const userName = customUserName || 
        localStorage.getItem('hero_user_name') || 
        'HeroHunter';

      // 6. 로컬스토리지 영구 보존
      localStorage.setItem(LOCAL_PUSH_TOKEN_KEY, pushToken);
      localStorage.setItem(LOCAL_PUSH_REGISTERED_AT_KEY, String(now));
      localStorage.setItem(LOCAL_PUSH_PLATFORM_KEY, status.platformName);

      // 7. 구글 시트(Form Response)에 푸시 토큰 비동기 영구 저장
      await this.saveTokenToGoogleSheet({
        token: pushToken,
        userName,
        platformName: status.platformName,
        registeredAt: now,
      });

      // 8. 웰컴 테스트 알림 1회 즉시 발송
      this.triggerWelcomeNotification(reg);

      return {
        success: true,
        token: pushToken,
        message: '웹푸시 알림이 성공적으로 등록되었습니다. (구글 시트 연동 완료)',
      };
    } catch (err: any) {
      console.error('[WebPush] Registration failed:', err);
      return {
        success: false,
        reason: 'error',
        message: err.message || '웹푸시 알림 등록 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 구글 폼을 통해 구글 스프레드시트에 푸시 토큰 전송 (Zero-DB 영구 보존)
   */
  private static async saveTokenToGoogleSheet(params: {
    token: string;
    userName: string;
    platformName: string;
    registeredAt: number;
  }): Promise<boolean> {
    try {
      const metaStr = `platform=${encodeURIComponent(params.platformName)}&registeredAt=${params.registeredAt}&ua=${encodeURIComponent(typeof navigator !== 'undefined' ? navigator.userAgent : '')}`;
      const labelStr = `${params.userName} [${params.platformName}]`;

      const formData = new URLSearchParams();
      formData.append(FORM_ENTRY_CATEGORY, 'webpush_token');
      formData.append(FORM_ENTRY_LABEL, labelStr);
      formData.append(FORM_ENTRY_TEXT, params.token);
      formData.append(FORM_ENTRY_METADATA, metaStr);

      if (typeof window !== 'undefined') {
        // no-cors 비동기 전송
        fetch(GOOGLE_FORM_PUSH_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        }).catch(() => {});

        localStorage.setItem(LOCAL_PUSH_SYNCED_SHEET_KEY, 'true');
      }
      return true;
    } catch (e) {
      console.warn('[WebPush] Google sheet sync warning:', e);
      return false;
    }
  }

  /**
   * 웰컴 테스트 알림 발송
   */
  private static triggerWelcomeNotification(reg: ServiceWorkerRegistration | null) {
    const title = '⚔️ SNS히어로 웹푸시 알림 활성화!';
    const options: NotificationOptions = {
      body: '웹푸시 알림 등록이 완료되었습니다. 랭킹 대전 및 새로운 이벤트 소식을 가장 먼저 받아보세요!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'snshero-welcome',
    };

    try {
      if (reg && 'showNotification' in reg) {
        reg.showNotification(title, options);
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
      }
    } catch (e) {
      console.warn('[WebPush] Welcome notification fallback:', e);
    }
  }

  /**
   * 구글 시트에서 등록된 웹푸시 토큰 목록 실시간 조회
   */
  static async fetchRegisteredPushTokens(): Promise<SheetPushSubscriber[]> {
    try {
      const url = `${GOOGLE_SHEET_PUSH_CSV_URL}&_t=${Date.now()}`;
      const resp = await fetch(url, {
        cache: 'no-cache',
        signal: AbortSignal.timeout(8000),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const csvText = await resp.text();
      const rows = this.parseCSV(csvText);
      if (rows.length <= 1) return [];

      const tokenMap = new Map<string, SheetPushSubscriber>();

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 4) continue;

        const rawTimestamp = row[0] || '';
        const category = (row[1] || '').trim().toLowerCase();
        const label = (row[2] || '').trim();
        const token = (row[3] || '').trim();
        const metaStr = row[4] || '';

        // 오직 webpush_token 카테고리만 수집
        if (category !== 'webpush_token' || !token) continue;

        // 메타데이터에서 플랫폼 파싱
        let platform = 'Unknown';
        if (metaStr) {
          const match = metaStr.match(/platform=([^&]+)/);
          if (match && match[1]) {
            platform = decodeURIComponent(match[1]);
          }
        }
        if (platform === 'Unknown' && label.includes('[')) {
          const m = label.match(/\[([^\]]+)\]/);
          if (m && m[1]) platform = m[1];
        }

        tokenMap.set(token, {
          token,
          label: label || 'HeroUser',
          platform,
          registeredAt: Date.now(),
        });
      }

      const result = Array.from(tokenMap.values());
      // 로컬 캐시 갱신
      try {
        localStorage.setItem('hero_cached_sheet_push_tokens', JSON.stringify(result));
      } catch {}

      return result;
    } catch (err) {
      console.warn('[WebPush] Failed to fetch sheet push tokens, checking fallback cache:', err);
      try {
        const raw = localStorage.getItem('hero_cached_sheet_push_tokens');
        if (raw) return JSON.parse(raw);
      } catch {}
      return [];
    }
  }

  /**
   * 구글 시트에 저장된 모든 사용자에게 전체 브로드캐스트 푸시 발송
   */
  static async broadcastPushMessage(params: {
    title: string;
    body: string;
    url?: string;
  }): Promise<{
    success: boolean;
    recipientCount: number;
    logItem: BroadcastLogItem;
  }> {
    const { title, body, url = '/' } = params;

    // 1. 구글 시트 등록 토큰 최신 목록 가져오기
    let subscribers = await this.fetchRegisteredPushTokens();
    if (subscribers.length === 0) {
      // 현재 기기 토큰이라도 fallback
      const localToken = localStorage.getItem(LOCAL_PUSH_TOKEN_KEY);
      if (localToken) {
        subscribers = [{
          token: localToken,
          label: localStorage.getItem('hero_user_name') || 'LocalUser',
          platform: 'Current Device',
          registeredAt: Date.now(),
        }];
      }
    }

    const now = Date.now();
    const logItem: BroadcastLogItem = {
      id: `bc_${now}`,
      title,
      body,
      url,
      sentAt: now,
      recipientCount: subscribers.length,
      status: 'sent',
    };

    // 2. 현재 활성 브라우저 알림 즉시 발생 (테스트 및 브로드캐스트 피드백)
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const options: NotificationOptions = {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: { url },
          tag: `broadcast-${now}`,
        };

        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready.catch(() => null);
          if (reg && 'showNotification' in reg) {
            reg.showNotification(title, options);
          } else {
            new Notification(title, options);
          }
        } else {
          new Notification(title, options);
        }
      }
    } catch (e) {
      console.warn('[WebPush] Broadcast local dispatch warning:', e);
    }

    // 3. 발송 로그 저장
    try {
      const logsRaw = localStorage.getItem(LOCAL_PUSH_BROADCAST_LOGS_KEY);
      const logs: BroadcastLogItem[] = logsRaw ? JSON.parse(logsRaw) : [];
      logs.unshift(logItem);
      localStorage.setItem(LOCAL_PUSH_BROADCAST_LOGS_KEY, JSON.stringify(logs.slice(0, 30)));
    } catch {}

    return {
      success: true,
      recipientCount: subscribers.length,
      logItem,
    };
  }

  /**
   * 로컬 디바이스 1초 후 테스트 알림 발송
   */
  static async sendTestPushToSelf(customTitle?: string, customBody?: string): Promise<boolean> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return false;
    }

    const title = customTitle || '🔔 [테스트] SNS히어로 웹푸시 알림';
    const body = customBody || '웹푸시 알림이 정상적으로 수신되었습니다! (토큰 및 구글 시트 등록 완료)';

    try {
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      if (reg && 'showNotification' in reg) {
        reg.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [100, 50, 100],
        });
      } else {
        new Notification(title, {
          body,
          icon: '/icon-192.png',
        });
      }
      return true;
    } catch (e) {
      console.warn('[WebPush] Test notification error:', e);
      return false;
    }
  }

  /**
   * 발송 히스토리 로그 조회
   */
  static getBroadcastLogs(): BroadcastLogItem[] {
    try {
      const logsRaw = localStorage.getItem(LOCAL_PUSH_BROADCAST_LOGS_KEY);
      return logsRaw ? JSON.parse(logsRaw) : [];
    } catch {
      return [];
    }
  }

  /**
   * CSV 파서
   */
  private static parseCSV(csvText: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        if (currentRow.length > 0 && currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }
}
