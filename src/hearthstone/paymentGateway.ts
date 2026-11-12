/**
 * src/hearthstone/paymentGateway.ts
 *
 * Official Real-Payment Gateway Integration for /game.html (눈히어로 보급소).
 * - 눈히어로 카드 1팩: $1.00 USD (1,500 KRW)
 * - 눈히어로 카드 5팩 묶음: $4.00 USD (5,600 KRW, 20% SAVE)
 * - 광고 영구 제거 패키지: $2.99 USD (4,000 KRW)
 *
 * Popup Checkout Architecture:
 * - Main /game.html screen NEVER navigates away during payment.
 * - External PG (PayPal / PayApp) runs inside a dedicated popup window (`window.open`)
 *   and upon return (`?payapp_success=...`), credits packs to localStorage, notifies
 *   `window.opener` via `postMessage` + storage event, and closes the popup automatically.
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

export type CheckoutPopupMethod =
  | 'paypal'
  | 'card'
  | 'kakaopay'
  | 'naverpay'
  | 'applepay';

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
  subLabel: string;
  flag: string;
  currency: 'KRW' | 'USD';
}

export const GAME_SHOP_PACKAGES: GameShopPackage[] = [
  {
    id: 'pack_1',
    returnParam: 'hs_pack_1',
    name: '눈히어로 카드 1팩',
    badge: '1팩 기본',
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
    badge: '20% 할인 · 인기',
    packs: 5,
    priceUsd: 4.0,
    priceKrw: 5600,
    description:
      '단품 대비 20% 할인된 가격으로 눈히어로 카드 5팩(총 25장)을 수령해 3장=3배 여정 강화를 빠르게 달성합니다.',
    shortSpec: '총 25장(5팩) 소환 · 20% 할인 특가',
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
  {
    code: 'ko',
    name: '대한민국 (South Korea)',
    subLabel: '원화(KRW) · 국내 카드 / 카카오페이 / 네이버페이 / PayPal',
    flag: '🇰🇷',
    currency: 'KRW',
  },
  {
    code: 'en',
    name: '미국 · 북미 (United States)',
    subLabel: '달러(USD) · PayPal / 해외 신용카드 / Apple Pay / 암호화폐',
    flag: '🇺🇸',
    currency: 'USD',
  },
  {
    code: 'ja',
    name: '일본 (Japan)',
    subLabel: '글로벌 USD 결제 · PayPal / 해외 카드 / 암호화폐',
    flag: '🇯🇵',
    currency: 'USD',
  },
  {
    code: 'eu',
    name: '유럽 · 영국 (Europe / UK)',
    subLabel: '글로벌 USD 결제 · PayPal / 해외 카드 / 암호화폐',
    flag: '🇪🇺',
    currency: 'USD',
  },
  {
    code: 'global',
    name: '기타 국가 (Global International)',
    subLabel: '글로벌 USD 결제 · PayPal / 해외 카드 / 암호화폐',
    flag: '🌏',
    currency: 'USD',
  },
];

export const POPUP_PAYMENT_EVENT_KEY = 'hero_hs_last_popup_payment';
export const HS_AD_REMOVED_KEY = 'hero_hs_ad_removed';

export function isHsGameAdRemoved(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      localStorage.getItem(HS_AD_REMOVED_KEY) === 'true' ||
      localStorage.getItem('hero_ad_removed') === 'true'
    );
  } catch {
    return false;
  }
}

const PAYAPP_SCRIPT_ID = 'payapp-lite-script';
const PAYAPP_SCRIPT_URL = 'https://lite.payapp.kr/public/api/v2/payapp-lite.js';
const PAYAPP_USERID = 'dryudryu';
const PAYAPP_SHOPNAME = 'Applet Store';
const PAYPAL_BUSINESS = 'dryudryu@gmail.com';

export function getShopPackageById(id: string | null): GameShopPackage {
  return GAME_SHOP_PACKAGES.find((p) => p.id === id) || GAME_SHOP_PACKAGES[0];
}

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

function buildReturnUrl(returnParam: string, fromPopup = false): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('payapp_success', returnParam);
  if (fromPopup) {
    url.searchParams.set('from_popup', '1');
  }
  return url.toString();
}

export function buildPayPalCheckoutUrl(pkg: GameShopPackage, fromPopup = true): string {
  const returnUrl = encodeURIComponent(buildReturnUrl(pkg.returnParam, fromPopup));
  return (
    `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick` +
    `&business=${encodeURIComponent(PAYPAL_BUSINESS)}` +
    `&item_name=${encodeURIComponent(pkg.name)}` +
    `&amount=${pkg.priceUsd.toFixed(2)}` +
    `&currency_code=USD` +
    `&return=${returnUrl}`
  );
}

/**
 * Opens a dedicated popup window so the main `/game.html` screen NEVER navigates away!
 */
export function openGameCheckoutPopup(
  pkg: GameShopPackage,
  method: CheckoutPopupMethod,
): Window | null {
  if (typeof window === 'undefined') return null;

  const w = 540;
  const h = 740;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - w) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - h) / 2));
  const features = `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes`;

  if (method === 'paypal') {
    const paypalUrl = buildPayPalCheckoutUrl(pkg, true);
    return window.open(paypalUrl, 'snshero_checkout_popup', features);
  }

  const bridgeUrl = new URL(window.location.origin + window.location.pathname);
  bridgeUrl.searchParams.set('pay_popup_bridge', '1');
  bridgeUrl.searchParams.set('pkg', pkg.id);
  bridgeUrl.searchParams.set('method', method);
  return window.open(bridgeUrl.toString(), 'snshero_checkout_popup', features);
}

export function getPaymentPopupBridgeParams(): {
  isBridge: boolean;
  pkg: GameShopPackage;
  method: CheckoutPopupMethod;
} {
  if (typeof window === 'undefined') {
    return { isBridge: false, pkg: GAME_SHOP_PACKAGES[0], method: 'card' };
  }
  const sp = new URLSearchParams(window.location.search);
  const isBridge = sp.get('pay_popup_bridge') === '1';
  const pkg = getShopPackageById(sp.get('pkg'));
  const rawMethod = sp.get('method') as CheckoutPopupMethod | null;
  const validMethods: CheckoutPopupMethod[] = [
    'paypal',
    'card',
    'kakaopay',
    'naverpay',
    'applepay',
  ];
  const method: CheckoutPopupMethod =
    rawMethod && validMethods.includes(rawMethod) ? rawMethod : 'card';
  return { isBridge, pkg, method };
}

/**
 * Called ONLY inside the popup window (`?pay_popup_bridge=1`) to invoke PayApp or PayPal.
 */
export async function launchPayAppCheckoutInCurrentWindow(
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
    return false;
  }

  const returnUrl = buildReturnUrl(pkg.returnParam, true);

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
  } catch {
    return false;
  }
}

export interface GamePaymentReturnResult {
  handled: boolean;
  closedPopup?: boolean;
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
    localStorage.setItem(HS_AD_REMOVED_KEY, 'true');
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
      cleanUrl.searchParams.delete('from_popup');
      if (cleanUrl.hash.includes('payapp_success=')) {
        cleanUrl.hash = cleanUrl.hash.split('?')[0];
      }
      window.history.replaceState({}, '', cleanUrl.toString());
    } catch {
      // ignore URL cleanup error
    }

    // If this return happened inside the payment popup window, notify main opener & close popup!
    const hasOpener = Boolean(window.opener && !window.opener.closed);
    if (hasOpener) {
      try {
        localStorage.setItem(
          POPUP_PAYMENT_EVENT_KEY,
          JSON.stringify({ ...result, ts: Date.now() }),
        );
      } catch {
        // ignore storage error
      }
      try {
        window.opener.postMessage(
          { type: 'SNSHERO_GAME_PAYMENT_COMPLETE', result },
          window.location.origin,
        );
      } catch {
        // ignore postMessage error
      }
      result.closedPopup = true;
      window.setTimeout(() => {
        try {
          window.close();
        } catch {
          // ignore
        }
      }, 300);
    }
  }

  return result;
}
