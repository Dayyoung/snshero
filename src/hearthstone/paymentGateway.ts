/**
 * src/hearthstone/paymentGateway.ts
 *
 * Official Real-Payment Gateway Integration for /game.html (눈히어로 보급소).
 * Mirrors http://localhost:3000/#shop (ShopSection.tsx & paymentService.ts) 100%:
 * - 눈히어로 카드 1팩: $1.00 USD (1,500 KRW)
 * - 눈히어로 카드 5팩 묶음: $4.00 USD (5,600 KRW, 20% SAVE)
 * - 광고 영구 제거 패키지: $2.99 USD (4,000 KRW)
 *
 * Payment Methods:
 * - PayPal Express Checkout (USD)
 * - PayApp Lite: 신용/체크카드, 카카오페이, 네이버페이, Apple Pay
 * - Web3 Crypto Checkout: USDT, BTC, ETH, SOL, USDC, TRX, DOGE, XRP (QR + Address Copy)
 */

import {
  CRYPTO_COINS_CATALOG,
  CRYPTO_QUICK_CHIPS,
  CryptoCoinOption,
  CryptoDepositDetails,
  resolveCryptoDepositDetails,
} from '../landing/services/qrCodeSvg';
import { hsStorage } from './storage';

export { CRYPTO_COINS_CATALOG, CRYPTO_QUICK_CHIPS, resolveCryptoDepositDetails };
export type { CryptoCoinOption, CryptoDepositDetails };

export interface GameShopPackage {
  id: 'pack_1' | 'pack_5' | 'ad_removal';
  returnParam: 'hs_pack_1' | 'hs_pack_5' | 'ad_removal';
  name: string;
  badge: string;
  packs: number;
  priceUsd: number;
  priceKrw: number;
  description: string;
  shortSpec: string;
  isAdRemoval?: boolean;
}

export interface CheckoutCountryOption {
  code: string;
  name: string;
  flag: string;
  currency: string;
}

export const GAME_SHOP_PACKAGES: GameShopPackage[] = [
  {
    id: 'pack_1',
    returnParam: 'hs_pack_1',
    name: '눈히어로 카드 1팩',
    badge: 'STANDARD',
    packs: 1,
    priceUsd: 1.0,
    priceKrw: 1500,
    description:
      '눈히어로 『카단의 여정』 카드 5장을 소환합니다. 희귀 등급 이상 영웅·주문이 최소 1장 확정 포함됩니다.',
    shortSpec: '카드 5장 구성 · 희귀 등급 이상 1장 100% 보장',
  },
  {
    id: 'pack_5',
    returnParam: 'hs_pack_5',
    name: '눈히어로 카드 5팩 묶음',
    badge: '20% SAVE · BEST',
    packs: 5,
    priceUsd: 4.0,
    priceKrw: 5600,
    description:
      '단품 대비 20% 할인된 가격으로 눈히어로 카드 5팩(총 25장)을 일괄 수령합니다.',
    shortSpec: '총 25장(5팩) 소환 · 각 팩 희귀 이상 1장 확정',
  },
  {
    id: 'ad_removal',
    returnParam: 'ad_removal',
    name: '광고 영구 제거 패키지',
    badge: 'VIP 영구 특전',
    packs: 0,
    priceUsd: 2.99,
    priceKrw: 4000,
    description:
      'PC 좌우 배너 및 태블릿·스마트폰 상단 배너 광고를 계정에서 영구적으로 제거합니다.',
    shortSpec: '전체 화면 광고 영구 제거 · 즉시 적용',
    isAdRemoval: true,
  },
];

export const CHECKOUT_COUNTRIES: CheckoutCountryOption[] = [
  { code: 'ko', name: '대한민국 (KRW)', flag: '🇰🇷', currency: 'KRW' },
  { code: 'en', name: 'United States (USD)', flag: '🇺🇸', currency: 'USD' },
  { code: 'ja', name: '日本 (JPY)', flag: '🇯🇵', currency: 'USD' },
  { code: 'zh', name: '中国 (CNY)', flag: '🇨🇳', currency: 'USD' },
  { code: 'gb', name: 'United Kingdom (GBP)', flag: '🇬🇧', currency: 'USD' },
  { code: 'eu', name: 'Europe (EUR)', flag: '🇪🇺', currency: 'USD' },
];

const PAYAPP_SCRIPT_ID = 'payapp-lite-script';
const PAYAPP_SCRIPT_URL = 'https://lite.payapp.kr/public/api/v2/payapp-lite.js';
const PAYAPP_USERID = 'dryudryu';
const PAYAPP_SHOPNAME = 'Applet Store';
const PAYPAL_BUSINESS = 'dryudryu@gmail.com';

export function loadPayAppSdk(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as unknown as { PayApp?: unknown }).PayApp) return Promise.resolve(true);

  return new Promise((resolve) => {
    let script = document.getElementById(PAYAPP_SCRIPT_ID) as HTMLScriptElement | null;
    if (script) {
      if ((window as unknown as { PayApp?: unknown }).PayApp) {
        resolve(true);
      } else {
        script.addEventListener('load', () => resolve(true), { once: true });
        script.addEventListener('error', () => resolve(false), { once: true });
      }
      return;
    }

    script = document.createElement('script');
    script.id = PAYAPP_SCRIPT_ID;
    script.src = PAYAPP_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function buildReturnUrl(returnParam: string): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('payapp_success', returnParam);
  return url.toString();
}

export function launchPayPalCheckout(pkg: GameShopPackage): void {
  if (typeof window === 'undefined') return;
  const returnUrl = encodeURIComponent(buildReturnUrl(pkg.returnParam));
  const paypalUrl =
    `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick` +
    `&business=${encodeURIComponent(PAYPAL_BUSINESS)}` +
    `&item_name=${encodeURIComponent(pkg.name)}` +
    `&amount=${pkg.priceUsd.toFixed(2)}` +
    `&currency_code=USD` +
    `&return=${returnUrl}`;
  window.location.href = paypalUrl;
}

export async function launchPayAppCheckout(
  pkg: GameShopPackage,
  method: 'card' | 'kakaopay' | 'naverpay' | 'applepay',
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  await loadPayAppSdk();
  const win = window as unknown as {
    PayApp?: {
      setDefault: (k: string, v: string) => void;
      setParam: (k: string, v: string) => void;
      payrequest: () => void;
    };
  };

  if (!win.PayApp) {
    alert('결제 모듈(PayApp)을 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.');
    return false;
  }

  const returnUrl = buildReturnUrl(pkg.returnParam);

  try {
    win.PayApp.setDefault('userid', PAYAPP_USERID);
    win.PayApp.setDefault('shopname', PAYAPP_SHOPNAME);
    win.PayApp.setParam('goodname', pkg.name);
    win.PayApp.setParam('price', String(Math.max(100, Math.round(pkg.priceKrw))));
    win.PayApp.setParam('recvphone', '01000000000');
    win.PayApp.setParam('smsuse', 'n');
    win.PayApp.setParam('redirectpay', '1');
    win.PayApp.setParam('skip_agree', 'y');
    win.PayApp.setParam('skip_cstpage', 'y');
    win.PayApp.setParam('cashier', '1');
    win.PayApp.setParam('method', method);
    win.PayApp.setParam('returnurl', returnUrl);
    win.PayApp.payrequest();
    return true;
  } catch (err) {
    alert('결제창 호출 중 오류가 발생했습니다: ' + String(err));
    return false;
  }
}

export interface GamePaymentReturnResult {
  handled: boolean;
  packsGranted?: number;
  isAdRemoval?: boolean;
  label?: string;
}

export function checkAndProcessGamePaymentReturn(): GamePaymentReturnResult {
  if (typeof window === 'undefined') return { handled: false };

  const searchParams = new URLSearchParams(window.location.search);
  let successVal = searchParams.get('payapp_success');

  if (!successVal && window.location.hash.includes('payapp_success=')) {
    const qIdx = window.location.hash.indexOf('?');
    if (qIdx !== -1) {
      const hashParams = new URLSearchParams(window.location.hash.slice(qIdx + 1));
      successVal = hashParams.get('payapp_success');
    }
  }

  if (!successVal) return { handled: false };

  let result: GamePaymentReturnResult = { handled: false };

  if (successVal === 'hs_pack_1') {
    hsStorage.grantPacks(1);
    result = {
      handled: true,
      packsGranted: 1,
      label: '눈히어로 카드 1팩 ($1.00)',
    };
  } else if (successVal === 'hs_pack_5') {
    hsStorage.grantPacks(5);
    result = {
      handled: true,
      packsGranted: 5,
      label: '눈히어로 카드 5팩 묶음 ($4.00)',
    };
  } else if (successVal === 'ad_removal') {
    localStorage.setItem('hero_ad_removed', 'true');
    window.dispatchEvent(new Event('snshero_ad_removed_updated'));
    result = {
      handled: true,
      isAdRemoval: true,
      label: '광고 영구 제거 패키지 ($2.99)',
    };
  }

  if (result.handled) {
    try {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('payapp_success');
      if (cleanUrl.hash.includes('payapp_success=')) {
        cleanUrl.hash = cleanUrl.hash.split('?')[0];
      }
      window.history.replaceState({}, '', cleanUrl.toString());
    } catch {
      // ignore URL cleanup error
    }
  }

  return result;
}
