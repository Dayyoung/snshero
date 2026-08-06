/**
 * Payment Gateway abstraction layer.
 *
 * 실제 PG 계약/배포 전에 국내 신용카드 및 간편결제 확장을 준비합니다.
 * 미연동 수단은 disabled / coming_soon 상태로 두어 실제 결제를 시도하지 않습니다.
 *
 * 클라이언트는 화면 표시만 담당하며, 민감한 결제 검증은 서버(Firestore Rules / Cloud Functions)에서 수행합니다.
 */

export type PaymentGatewayType = 'crypto' | 'paypal' | 'card' | 'simplePay' | 'googleplay';

export type PaymentGatewayStatus = 'active' | 'coming_soon' | 'disabled';

export type PaymentMethod = 'crypto' | 'paypal' | 'card' | 'simplePay' | 'googleplay' | 'sns_coin';

export interface AppEnvironmentInfo {
  isApp: boolean;
  isWebView: boolean;
  isTWA: boolean;
}

/**
 * 접속 환경(웹 브라우저 vs. 안드로이드 WebView/TWA 앱)을 감지합니다.
 * 구글 플레이 인앱 결제 정책에 의거하여 앱 환경 진입 시 외인 결제(PayPal 등) 수단을 숨깁니다.
 */
export async function detectAppEnvironment(): Promise<AppEnvironmentInfo> {
  if (typeof window === 'undefined') {
    return { isApp: false, isWebView: false, isTWA: false };
  }

  const userAgent = navigator.userAgent || '';

  // 1. WebView 감지 (User-Agent 또는 JavascriptBridge)
  const isWebView =
    typeof (window as any).AndroidBridge !== 'undefined' ||
    userAgent.includes('SNSHeroApp');

  // 2. TWA 감지 (Referrer, Digital Goods API, 또는 URL 파라미터)
  const isTWAByReferrer = document.referrer.startsWith('android-app://');
  const isTWAByParam =
    new URLSearchParams(window.location.search).get('app') === 'twa';

  let isTWAByAPI = false;
  if ('getDigitalGoodsService' in window) {
    try {
      const service = await (window as any).getDigitalGoodsService(
        'https://play.google.com/billing'
      );
      isTWAByAPI = service !== null;
    } catch {
      isTWAByAPI = false;
    }
  }

  const isTWA = isTWAByReferrer || isTWAByParam || isTWAByAPI;

  return {
    isApp: isWebView || isTWA,
    isWebView,
    isTWA,
  };
}

export interface PaymentGateway {
  /** 고유 식별자 (예: 'paypal', 'crypto-okx', 'card-kg-inicis') */
  id: string;
  type: PaymentGatewayType;
  nameKey: string;
  descriptionKey: string;
  status: PaymentGatewayStatus;
  /** 결제 수수료 (퍼센트, 예: 3.5 → 3.5%) */
  feePercent: number;
  /** 결제 고정 수수료 (USD 기준) */
  feeFlat: number;
  processingTimeKey: string;
  noticeKeys: string[];
  /** lucide-react 아이콘 이름 (프레젠테이션용) */
  icon: string;
}

export interface PaymentIntentDraft {
  gatewayId: string;
  amount: number;
  currency: string;
  itemLabel: string;
  isGoods?: boolean;
  isAdRemoval?: boolean;
  snsAmount?: number;
}

export interface ComplianceNotice {
  key: string;
  titleKey: string;
  bodyKey: string;
  linkKey?: string;
  linkUrl?: string;
}

// ─── Gateway Registry ────────────────────────────────────────────────

const GATEWAYS: PaymentGateway[] = [
  {
    id: 'google-play',
    type: 'googleplay',
    nameKey: 'pg_googleplay_name',
    descriptionKey: 'pg_googleplay_desc',
    status: 'active',
    feePercent: 15.0,
    feeFlat: 0,
    processingTimeKey: 'pg_processing_instant',
    noticeKeys: ['pg_notice_currency_krw'],
    icon: 'Smartphone',
  },
  {
    id: 'paypal',
    type: 'paypal',
    nameKey: 'pg_paypal_name',
    descriptionKey: 'pg_paypal_desc',
    status: 'active',
    feePercent: 3.49,
    feeFlat: 0.49,
    processingTimeKey: 'pg_processing_instant',
    noticeKeys: ['pg_notice_currency_usd'],
    icon: 'DollarSign',
  },
  {
    id: 'crypto-okx',
    type: 'crypto',
    nameKey: 'pg_crypto_name',
    descriptionKey: 'pg_crypto_desc',
    status: 'active',
    feePercent: 0.5,
    feeFlat: 0,
    processingTimeKey: 'pg_processing_variable',
    noticeKeys: ['pg_notice_volatility', 'pg_notice_network_fee'],
    icon: 'Bitcoin',
  },
  {
    id: 'card-kg-inicis',
    type: 'card',
    nameKey: 'pg_card_name',
    descriptionKey: 'pg_card_desc',
    status: 'coming_soon',
    feePercent: 3.2,
    feeFlat: 0.3,
    processingTimeKey: 'pg_processing_instant',
    noticeKeys: ['pg_notice_card_issuer', 'pg_notice_currency_krw'],
    icon: 'CreditCard',
  },
  {
    id: 'simplepay-kakao',
    type: 'simplePay',
    nameKey: 'pg_kakaopay_name',
    descriptionKey: 'pg_kakaopay_desc',
    status: 'coming_soon',
    feePercent: 2.9,
    feeFlat: 0.25,
    processingTimeKey: 'pg_processing_instant',
    noticeKeys: ['pg_notice_currency_krw'],
    icon: 'Smartphone',
  },
  {
    id: 'simplepay-naver',
    type: 'simplePay',
    nameKey: 'pg_naverpay_name',
    descriptionKey: 'pg_naverpay_desc',
    status: 'coming_soon',
    feePercent: 2.9,
    feeFlat: 0.25,
    processingTimeKey: 'pg_processing_instant',
    noticeKeys: ['pg_notice_currency_krw'],
    icon: 'Smartphone',
  },
];

// ─── Compliance Notices ──────────────────────────────────────────────

const COMPLIANCE_NOTICES: ComplianceNotice[] = [
  {
    key: 'random_items',
    titleKey: 'pg_notice_random_items_title',
    bodyKey: 'pg_notice_random_items_body',
    linkKey: 'pg_notice_read_policy',
    linkUrl: '/shop?section=gacha-policy',
  },
  {
    key: 'refund_policy',
    titleKey: 'pg_notice_refund_title',
    bodyKey: 'pg_notice_refund_body',
    linkKey: 'pg_notice_read_policy',
    linkUrl: '/shop?section=refund-policy',
  },
  {
    key: 'crypto_volatility',
    titleKey: 'pg_notice_volatility_title',
    bodyKey: 'pg_notice_volatility_body',
    linkKey: 'pg_notice_read_policy',
    linkUrl: '/shop?section=crypto-policy',
  },
  {
    key: 'payment_security',
    titleKey: 'pg_notice_security_title',
    bodyKey: 'pg_notice_security_body',
    linkKey: 'pg_notice_read_policy',
    linkUrl: '/shop?section=security-policy',
  },
];

// ─── Public API ──────────────────────────────────────────────────────

/** 등록된 모든 결제 게이트웨이를 반환합니다. */
export function getPaymentGateways(): PaymentGateway[] {
  return GATEWAYS;
}

/** 특정 status 이상의 게이트웨이만 필터링합니다. */
export function getGatewaysByStatus(status: PaymentGatewayStatus): PaymentGateway[] {
  return GATEWAYS.filter((g) => g.status === status);
}

/** type별 게이트웨이를 그룹화합니다. */
export function getGatewaysByType(): Record<PaymentGatewayType, PaymentGateway[]> {
  const grouped: Record<PaymentGatewayType, PaymentGateway[]> = {
    googleplay: [],
    crypto: [],
    paypal: [],
    card: [],
    simplePay: [],
  };
  for (const gw of GATEWAYS) {
    grouped[gw.type].push(gw);
  }
  return grouped;
}

/** 게이트웨이로 실제 결제가 가능한지 여부를 반환합니다. */
export function isGatewayUsable(gatewayId: string): boolean {
  const gw = GATEWAYS.find((g) => g.id === gatewayId);
  return gw?.status === 'active';
}

/** 모든 결제 고지사항을 반환합니다. */
export function getComplianceNotices(): ComplianceNotice[] {
  return COMPLIANCE_NOTICES;
}

/** 특정 게이트웨이의 수수료 정보를 사람이 읽을 수 있는 문자열로 포맷합니다. */
export function formatGatewayFee(gateway: PaymentGateway): { percent: string; flat: string; total: string } {
  const pct = gateway.feePercent.toFixed(1);
  const flat = `$${gateway.feeFlat.toFixed(2)}`;
  const total = `${pct}% + ${flat}`;
  return { percent: `${pct}%`, flat, total };
}
