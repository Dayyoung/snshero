export const WEB3_REFERRER_STORAGE_KEY = 'hero_web3_referrer';

export interface Web3ReferrerSnapshot {
  source: string;
  referrerUrl: string | null;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  landingPath: string;
  capturedAt: string;
}

function normalizeValue(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getReferrerHost(referrerUrl: string | null): string | null {
  if (!referrerUrl) return null;

  try {
    const referrer = new URL(referrerUrl);
    if (typeof window !== 'undefined' && referrer.host === window.location.host) {
      return null;
    }
    return referrer.host;
  } catch {
    return null;
  }
}

export function captureWeb3Referrer(): Web3ReferrerSnapshot {
  if (typeof window === 'undefined') {
    return {
      source: 'direct',
      referrerUrl: null,
      referrerHost: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      landingPath: '/web3',
      capturedAt: new Date(0).toISOString(),
    };
  }

  const params = new URLSearchParams(window.location.search);
  const referrerUrl = normalizeValue(document.referrer || null);
  const referrerHost = getReferrerHost(referrerUrl);
  const utmSource = normalizeValue(params.get('utm_source'));
  const utmMedium = normalizeValue(params.get('utm_medium'));
  const utmCampaign = normalizeValue(params.get('utm_campaign'));
  const utmContent = normalizeValue(params.get('utm_content'));
  const utmTerm = normalizeValue(params.get('utm_term'));
  const explicitSource = normalizeValue(params.get('source')) ?? normalizeValue(params.get('ref'));

  const snapshot: Web3ReferrerSnapshot = {
    source: explicitSource ?? utmSource ?? referrerHost ?? 'direct',
    referrerUrl,
    referrerHost,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    landingPath: `${window.location.pathname}${window.location.search}`,
    capturedAt: new Date().toISOString(),
  };

  const hasAttributionSignal = Boolean(
    explicitSource || referrerHost || utmSource || utmMedium || utmCampaign || utmContent || utmTerm,
  );

  const existingRaw = localStorage.getItem(WEB3_REFERRER_STORAGE_KEY);
  if (!hasAttributionSignal && existingRaw) {
    return snapshot;
  }

  localStorage.setItem(WEB3_REFERRER_STORAGE_KEY, JSON.stringify(snapshot));
  return snapshot;
}
