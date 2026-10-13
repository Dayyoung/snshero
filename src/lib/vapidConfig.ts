/**
 * vapidConfig.ts
 * W3C Web Push 표준 VAPID 키페어 및 유틸리티
 */

export const VAPID_PUBLIC_KEY = 'BFUG6fAO5-EKlseliym2q-sUqwpu7n05AIoTtn3HF5Vm6fapi7li7ttsqkeblALTsh-YASIYyf4rDOrUHydJ6js';
export const VAPID_SUBJECT = 'mailto:admin@snshero.com';

/**
 * Base64 URL 인코딩 문자열을 Uint8Array로 변환 (PushManager.subscribe 파라미터 규격)
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  if (typeof window === 'undefined') {
    return new Uint8Array(0);
  }

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
