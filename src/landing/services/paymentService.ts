/**
 * src/landing/services/paymentService.ts
 *
 * Real Payment Gateway Integration for SNSHero.
 * Powers PayApp Lite (Credit Card, KakaoPay, NaverPay, ApplePay, WeChatPay, Phone Billing),
 * PayPal Checkout, and Crypto Payments.
 *
 * Matches official https://snshero.com/shop and https://snshero.com/mall behavior.
 */

import { creditUserCoins } from '../views/ShopSection';

export interface PayAppPaymentParams {
  goodname: string;
  priceKrw: number;
  method: 'card' | 'kakaopay' | 'naverpay' | 'applepay' | 'phone' | 'payco' | 'wechatpay' | string;
  returnParam: string; // '1000' | '3000' | '10000' | '50000' | 'ad_removal' | 'goods'
  recvphone?: string;
  targetHash?: string; // '#shop' or '#mall'
  pendingOrder?: any;
}

export interface PaymentProcessResult {
  handled: boolean;
  type?: 'coin' | 'ad_removal' | 'goods';
  amount?: number;
  label?: string;
  order?: any;
}

const PAYAPP_SCRIPT_ID = 'payapp-lite-script';
const PAYAPP_SCRIPT_URL = 'https://lite.payapp.kr/public/api/v2/payapp-lite.js';
const PAYAPP_USERID = 'dryudryu';
const PAYAPP_SHOPNAME = 'Applet Store';

/**
 * Ensures PayApp Lite SDK script is loaded into the document head/body.
 */
export function loadPayAppSdk(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).PayApp) return Promise.resolve(true);

  return new Promise((resolve) => {
    let script = document.getElementById(PAYAPP_SCRIPT_ID) as HTMLScriptElement | null;
    if (script) {
      if ((window as any).PayApp) {
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
    script.onload = () => {
      console.log('[PaymentService] PayApp Lite SDK successfully loaded');
      resolve(true);
    };
    script.onerror = (e) => {
      console.warn('[PaymentService] Failed to load PayApp Lite SDK:', e);
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Triggers the actual PayApp Lite payment gateway (credit card, kakao, naver, applepay, etc).
 */
export async function requestPayAppPayment(params: PayAppPaymentParams): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  await loadPayAppSdk();
  const PayApp = (window as any).PayApp;

  if (!PayApp) {
    alert('결제 모듈(PayApp)을 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.');
    return false;
  }

  // If pending goods order, persist to localStorage so return handler can finalize
  if (params.pendingOrder) {
    try {
      localStorage.setItem('hero_goods_pending_order', JSON.stringify(params.pendingOrder));
    } catch (e) {
      console.warn('Failed to save pending order to localStorage', e);
    }
  }

  const hashTarget = params.targetHash || window.location.hash || '#shop';
  const cleanHash = hashTarget.split('?')[0];

  const returnUrl = new URL(window.location.origin + window.location.pathname);
  returnUrl.searchParams.set('payapp_success', params.returnParam);
  // Store target hash in return URL
  returnUrl.hash = cleanHash;

  try {
    PayApp.setDefault('userid', PAYAPP_USERID);
    PayApp.setDefault('shopname', PAYAPP_SHOPNAME);
    PayApp.setParam('goodname', params.goodname);
    PayApp.setParam('price', String(Math.max(100, Math.round(params.priceKrw))));
    PayApp.setParam('recvphone', params.recvphone || '01000000000');
    PayApp.setParam('smsuse', 'n');
    PayApp.setParam('redirectpay', '1');
    PayApp.setParam('skip_agree', 'y');
    PayApp.setParam('skip_cstpage', 'y');
    PayApp.setParam('cashier', '1');
    PayApp.setParam('method', params.method);
    PayApp.setParam('returnurl', returnUrl.toString());

    console.log('[PaymentService] Launching PayApp payrequest:', {
      goodname: params.goodname,
      priceKrw: params.priceKrw,
      method: params.method,
      returnurl: returnUrl.toString(),
    });

    PayApp.payrequest();
    return true;
  } catch (err) {
    console.error('[PaymentService] PayApp payrequest failed:', err);
    alert('결제창 호출 중 오류가 발생했습니다: ' + String(err));
    return false;
  }
}

/**
 * Checks for return query parameters after completing payment via PayApp.
 * Finalizes coin addition, ad removal, or physical goods purchase.
 */
export function checkAndProcessPayAppSuccess(): PaymentProcessResult {
  if (typeof window === 'undefined') return { handled: false };

  // Parse search params from window.location.search or window.location.hash
  let searchParams = new URLSearchParams(window.location.search);
  let successValue = searchParams.get('payapp_success');

  // Fallback: check hash if search query was transferred into hash
  if (!successValue && window.location.hash.includes('payapp_success=')) {
    const hashQueryIndex = window.location.hash.indexOf('?');
    if (hashQueryIndex !== -1) {
      const hashParams = new URLSearchParams(window.location.hash.substring(hashQueryIndex + 1));
      successValue = hashParams.get('payapp_success');
    }
  }

  if (!successValue) {
    return { handled: false };
  }

  console.log('[PaymentService] Detected payapp_success parameter:', successValue);

  let result: PaymentProcessResult = { handled: true };

  if (successValue === 'ad_removal') {
    localStorage.setItem('hero_ad_removed', 'true');
    result = {
      handled: true,
      type: 'ad_removal',
      label: '광고 영구 제거 패키지',
    };
  } else if (successValue === 'goods') {
    const pendingOrderStr = localStorage.getItem('hero_goods_pending_order');
    if (pendingOrderStr) {
      try {
        const orderData = JSON.parse(pendingOrderStr);
        orderData.status = 'paid';
        orderData.orderedAt = Date.now();

        // Save into hero_goods_orders
        const rawExisting = localStorage.getItem('hero_goods_orders') || '[]';
        const existing = JSON.parse(rawExisting);
        existing.unshift(orderData);
        localStorage.setItem('hero_goods_orders', JSON.stringify(existing));
        localStorage.removeItem('hero_goods_pending_order');

        result = {
          handled: true,
          type: 'goods',
          label: orderData.title || '공식 실물 굿즈',
          order: orderData,
        };
      } catch (err) {
        console.error('Failed to parse pending goods order', err);
      }
    }
  } else {
    // Numeric coin recharge (1000, 3000, 10000, 50000, etc.)
    const amount = parseInt(successValue, 10);
    if (!isNaN(amount) && amount > 0) {
      creditUserCoins(amount, 'purchased');
      result = {
        handled: true,
        type: 'coin',
        amount,
        label: `${amount.toLocaleString()} SNS 코인`,
      };
    }
  }

  // Clean URL parameters without reloading
  try {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('payapp_success');
    if (cleanUrl.hash.includes('payapp_success=')) {
      const hashParts = cleanUrl.hash.split('?');
      cleanUrl.hash = hashParts[0];
    }
    window.history.replaceState({}, '', cleanUrl.toString());
  } catch (e) {
    console.warn('Failed to clean URL parameters:', e);
  }

  // Dispatch payment success event
  window.dispatchEvent(
    new CustomEvent('snshero_payapp_processed', {
      detail: result,
    })
  );

  return result;
}

/**
 * Crypto payment wallet address presets
 */
export const CRYPTO_PAYMENT_INFO = {
  usdtTrc20: 'TXY9b6Wz7mKjW4j42kUaT8q1PzF6N9mQ1a',
  solana: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  ethereum: '0x71C8360f38bB1936573CebA46210fA61a4c9bDb2',
};
