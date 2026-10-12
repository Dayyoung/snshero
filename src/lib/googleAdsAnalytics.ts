/**
 * googleAdsAnalytics.ts
 * Google Ads 및 GA4 전환 추적(Conversion Tracking) 표준 모듈
 * 
 * 구글 애즈의 스마트 비딩(tCPA, 전환수 극대화) 알고리즘이
 * 진성 플레이어 및 유료 결제자를 정확하게 머신러닝 학습할 수 있도록 이벤트를 전송합니다.
 */

export type GoogleAdsConversionType =
  | 'battle_victory'
  | 'rewarded_ad_watched'
  | 'starter_pack_purchased'
  | 'ad_removal_purchased'
  | 'pass_purchased'
  | 'gacha_summon'
  | 'campaign_guest_start';

export const GOOGLE_ADS_CONVERSION_ID = 'AW-980426001';

export interface ConversionPayload {
  value?: number;
  currency?: string;
  transaction_id?: string;
  send_to?: string;
  [key: string]: unknown;
}

/**
 * 구글 애즈 및 GA4 전환 이벤트 전송
 */
export function trackGoogleAdsConversion(
  eventName: GoogleAdsConversionType,
  payload: ConversionPayload = {}
): void {
  if (typeof window === 'undefined') return;

  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;

  const eventData: Record<string, unknown> = {
    send_to: payload.send_to || GOOGLE_ADS_CONVERSION_ID,
    ...payload,
  };

  // 기본 통화 설정
  if (payload.value !== undefined && !payload.currency) {
    eventData.currency = 'KRW';
  }

  // 1. Google Ads / GA4 gtag 호출
  if (typeof gtag === 'function') {
    try {
      gtag('event', eventName, eventData);
    } catch (err) {
      console.warn('[GoogleAds] Failed to track gtag event:', err);
    }
  }

  // 2. dataLayer 직접 푸시 (GTM 연동 시 대비)
  const dataLayer = (window as unknown as { dataLayer?: Array<unknown> }).dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push({
      event: eventName,
      ...eventData,
      timestamp: Date.now(),
    });
  }

  // 3. 로컬 분석 트래킹용 이벤트 디스패치
  window.dispatchEvent(
    new CustomEvent('snshero_conversion_tracked', {
      detail: { eventName, eventData },
    })
  );
}

/**
 * 광고 유입 UTM 파라미터 감지 및 로컬스토리지 보존
 */
export function initCampaignAttribution(): { isCampaignTraffic: boolean; utmSource?: string; utmCampaign?: string } {
  if (typeof window === 'undefined') return { isCampaignTraffic: false };

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source') || urlParams.get('gclid') ? 'google_ads' : undefined;
    const utmCampaign = urlParams.get('utm_campaign') || undefined;

    if (utmSource) {
      localStorage.setItem('hero_campaign_source', utmSource);
      if (utmCampaign) localStorage.setItem('hero_campaign_name', utmCampaign);
      localStorage.setItem('hero_campaign_first_visit', new Date().toISOString());

      // 캠페인 유입 최초 전환 이벤트 발화
      trackGoogleAdsConversion('campaign_guest_start', {
        utm_source: utmSource,
        utm_campaign: utmCampaign,
      });

      return { isCampaignTraffic: true, utmSource, utmCampaign };
    }
  } catch (err) {
    console.error('Failed to parse campaign attribution:', err);
  }

  const savedSource = localStorage.getItem('hero_campaign_source');
  return {
    isCampaignTraffic: Boolean(savedSource),
    utmSource: savedSource || undefined,
  };
}
