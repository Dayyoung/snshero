/**
 * GA4 & Analytics Micro-Event Funnel Tracking Module
 * Safely wraps window.gtag and custom telemetry without crashing under AdBlock or offline.
 * Pure TypeScript, Zero-Emoji.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export type FunnelStepName =
  | 'daily_supply_view'
  | 'daily_gacha_trigger'
  | 'daily_gacha_complete'
  | 'deck_equip_quick'
  | 'ftue_pack_open'
  | 'ftue_overdrive_engage'
  | 'ftue_reward_claim'
  | 'challenge_view'
  | 'challenge_battle_engage'
  | 'challenge_reward_claim'
  | 'tactical_override_used'
  | 'secret_artifact_decrypt'
  | 'revenge_match_start'
  | 'synergy_burst_trigger'
  | 'streak_day_claimed'
  | 'streak_recovery_used'
  | 'guest_callsign_assigned'
  | 'quick_strike_tap'
  | 'first_combat_cleared'
  | 'lore_annotation_click'
  | 'lore_clue_collected'
  | 'lore_hero_recruited'
  | 'lore_battle_deploy_click'
  | 'season_pass_view'
  | 'season_pass_tier_claim'
  | 'season_pass_upgrade_click'
  | 'return_catchup_triggered';

/**
 * Safely tracks a funnel step event to GA4 and internal analytics
 */
export function trackFunnelStep(step: FunnelStepName, params?: Record<string, any>): void {
  try {
    const payload = {
      event_category: 'RSI_Funnel',
      event_label: step,
      timestamp: Date.now(),
      ...params,
    };

    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', step, payload);
    }

    // Broadcast internal event for debug or in-game observers
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('snshero_funnel_event', {
          detail: { step, params: payload },
        })
      );
    }
  } catch (err) {
    // Graceful no-op under strict privacy browsers or adblock
  }
}

/**
 * General micro-event tracking wrapper
 */
export function trackMicroEvent(eventName: string, params?: Record<string, any>): void {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        timestamp: Date.now(),
        ...params,
      });
    }
  } catch {}
}
