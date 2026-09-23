/**
 * DataEncryptionWorker.ts - SCR-12-22
 * 로컬 저장 데이터 암호화를 백그라운드에서 비동기 처리하는 Web Worker
 */

import { WebCryptoVault } from '../lib/WebCryptoVault';

self.onmessage = async (e: MessageEvent<{ action: 'encrypt' | 'decrypt'; data: string; key: string }>) => {
  const { action, data, key } = e.data;
  if (action === 'encrypt') {
    const result = await WebCryptoVault.encrypt(data, key);
    (self as any).postMessage({ result });
  } else if (action === 'decrypt') {
    const result = await WebCryptoVault.decrypt(data, key);
    (self as any).postMessage({ result });
  }
};
