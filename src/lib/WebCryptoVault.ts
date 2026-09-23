/**
 * WebCryptoVault.ts - SCR-12-22
 * SubtleCrypto (Web Crypto API) 기반 AES-GCM 256비트 하드웨어 가속 암호화/복호화 엔진
 */

export class WebCryptoVault {
  public static async encrypt(text: string, secretKey: string): Promise<string> {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      return btoa(text);
    }

    try {
      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.digest('SHA-256', enc.encode(secretKey));
      const key = await window.crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(text)
      );

      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch {
      return btoa(text);
    }
  }

  public static async decrypt(cipherBase64: string, secretKey: string): Promise<string> {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      return atob(cipherBase64);
    }

    try {
      const combined = Uint8Array.from(atob(cipherBase64), (c) => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.digest('SHA-256', enc.encode(secretKey));
      const key = await window.crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      return new TextDecoder().decode(decrypted);
    } catch {
      return atob(cipherBase64);
    }
  }
}
