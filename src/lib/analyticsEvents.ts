/**
 * analyticsEvents.ts
 * Standardized client-side analytics event names and payload types.
 *
 * All event-tracking calls should be fire-and-forget — a failure in
 * analytics must never block or break the user experience.
 */

// ─── Event Names ──────────────────────────────────────────────────────

export const AnalyticsEvent = {
  // Auth
  LOGIN: 'hero_login',

  // Webtoon
  WEBTOON_CLICK: 'hero_webtoon_click',
  WEBTOON_COMPLETE: 'hero_webtoon_complete',

  // Card pack (gacha / shop)
  CARDPACK_VIEW: 'hero_cardpack_view',
  CARDPACK_PURCHASE_ATTEMPT: 'hero_cardpack_purchase_attempt',

  // Share
  SHARE: 'hero_share',

  // Season mission
  SEASON_MISSION_COMPLETE: 'hero_season_mission_complete',
} as const;

export type AnalyticsEventType = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

// ─── Payload Types ────────────────────────────────────────────────────

export interface LoginPayload {
  method: 'email' | 'google' | 'demo';
  uid: string;
}

export interface WebtoonClickPayload {
  episodeId: string;
  episodeTitle: string;
}

export interface WebtoonCompletePayload {
  episodeId: string;
  episodeTitle: string;
  durationMs: number;
}

export interface CardpackViewPayload {
  packId: string;
  packName: string;
}

export interface CardpackPurchaseAttemptPayload {
  packId: string;
  packName: string;
  priceSns: number;
  currency?: string;
}

export interface SharePayload {
  contentType: 'card' | 'deck' | 'webtoon' | 'battle_result';
  contentId: string;
  platform?: string;
}

export interface SeasonMissionCompletePayload {
  missionId: string;
  missionTitle: string;
  rewardSns: number;
}

// ─── Tracking Function ────────────────────────────────────────────────

export type AnalyticsPayload =
  | { event: typeof AnalyticsEvent.LOGIN; payload: LoginPayload }
  | { event: typeof AnalyticsEvent.WEBTOON_CLICK; payload: WebtoonClickPayload }
  | { event: typeof AnalyticsEvent.WEBTOON_COMPLETE; payload: WebtoonCompletePayload }
  | { event: typeof AnalyticsEvent.CARDPACK_VIEW; payload: CardpackViewPayload }
  | { event: typeof AnalyticsEvent.CARDPACK_PURCHASE_ATTEMPT; payload: CardpackPurchaseAttemptPayload }
  | { event: typeof AnalyticsEvent.SHARE; payload: SharePayload }
  | { event: typeof AnalyticsEvent.SEASON_MISSION_COMPLETE; payload: SeasonMissionCompletePayload };

/**
 * Fire-and-forget analytics tracking.
 * Catches all errors internally so the caller never needs try/catch.
 */
export function trackAnalytics(entry: AnalyticsPayload): void {
  try {
    // Defer to next tick so the UI thread isn't blocked
    setTimeout(() => {
      try {
        // TODO: Replace with PostHog or Firestore analytics when available.
        // For now we log to console in dev; production can ship these
        // to a provider by swapping the body of this function.
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          console.debug('[analytics]', entry.event, entry.payload);
        }

        // Send event to Google Analytics (gtag.js) if available
        if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
          (window as any).gtag('event', entry.event, entry.payload);
        }
      } catch {
        // Silently ignore — analytics must never disrupt the UX
      }
    }, 0);
  } catch {
    // Silently ignore
  }
}
