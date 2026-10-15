/**
 * seasonPassStore.ts
 * 30-Day Tactical Season Pass Engine & Return Catchup Booster
 */

import { useState, useEffect, useCallback } from 'react';

export interface PassTier {
  tier: number;
  expRequired: number;
  freeReward: { title: string; credits: number; itemKey?: string };
  blackOpsReward: { title: string; credits: number; itemKey?: string; isHighlight?: boolean };
}

export interface SeasonPassState {
  seasonId: string;
  currentExp: number;
  isBlackOpsUnlocked: boolean;
  claimedFreeTiers: number[];
  claimedBlackOpsTiers: number[];
  catchupBoosterExpiry: number | null;
  lastLoginTime: number;
}

const STORAGE_KEY = 'snshero_season_pass_v1';
export const EXP_PER_TIER = 500;
export const TOTAL_TIERS = 30;

// 30 Tiers Catalog
export const SEASON_TIERS: PassTier[] = Array.from({ length: TOTAL_TIERS }, (_, i) => {
  const tier = i + 1;
  const isMilestone = tier % 5 === 0;
  const isFinal = tier === 30;

  return {
    tier,
    expRequired: tier * EXP_PER_TIER,
    freeReward: {
      title: isFinal ? 'SSR SOVEREIGN KEY' : isMilestone ? 'ELITE TOKEN x1' : `CREDITS +${100 + tier * 20}`,
      credits: 100 + tier * 20,
      itemKey: isFinal ? 'item_ssr_key' : isMilestone ? 'item_elite_token' : undefined
    },
    blackOpsReward: {
      title: isFinal ? 'LEGENDARY BLACKOPS CHIP' : isMilestone ? 'BLACKOPS COGNITION CORE' : `BOPS CREDITS +${250 + tier * 30}`,
      credits: 250 + tier * 30,
      itemKey: isFinal ? 'item_blackops_core' : isMilestone ? 'item_bops_chip' : undefined,
      isHighlight: isMilestone || isFinal
    }
  };
});

function getDefaultState(): SeasonPassState {
  return {
    seasonId: 'season_01',
    currentExp: 2600, // Starts at Tier 5
    isBlackOpsUnlocked: false,
    claimedFreeTiers: [1, 2],
    claimedBlackOpsTiers: [],
    catchupBoosterExpiry: null,
    lastLoginTime: Date.now(),
  };
}

export function loadSeasonPassState(): SeasonPassState {
  if (typeof window === 'undefined') return getDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();
    if (!raw) {
      const def = getDefaultState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
      return def;
    }
    const state: SeasonPassState = JSON.parse(raw);

    // Check for 7+ days absence (7 * 24 * 3600 * 1000 = 604800000 ms)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (state.lastLoginTime && (now - state.lastLoginTime > sevenDaysMs)) {
      // Trigger Return Protocol 2X EXP Catch-up Booster for 48 hours
      state.catchupBoosterExpiry = now + 48 * 60 * 60 * 1000;
      if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
        (window as unknown as { gtag: Function }).gtag('event', 'return_catchup_triggered', {
          season: state.seasonId,
          days_absent: Math.floor((now - state.lastLoginTime) / (24 * 3600 * 1000))
        });
      }
    }
    state.lastLoginTime = now;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  } catch {
    return getDefaultState();
  }
}

export function saveSeasonPassState(state: SeasonPassState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function useSeasonPass() {
  const [passState, setPassState] = useState<SeasonPassState>(loadSeasonPassState);

  useEffect(() => {
    setPassState(loadSeasonPassState());
  }, []);

  const currentTier = Math.min(TOTAL_TIERS, Math.floor(passState.currentExp / EXP_PER_TIER));
  const isBoosterActive = passState.catchupBoosterExpiry !== null && passState.catchupBoosterExpiry > Date.now();

  const addExp = useCallback((amount: number) => {
    setPassState(prev => {
      const multiplier = (prev.catchupBoosterExpiry && prev.catchupBoosterExpiry > Date.now()) ? 2 : 1;
      const added = amount * multiplier;
      const nextExp = Math.min(TOTAL_TIERS * EXP_PER_TIER, prev.currentExp + added);
      const updated = { ...prev, currentExp: nextExp };
      saveSeasonPassState(updated);
      return updated;
    });
  }, []);

  const claimTier = useCallback((tier: number, track: 'free' | 'blackOps') => {
    setPassState(prev => {
      const freeList = [...prev.claimedFreeTiers];
      const bopsList = [...prev.claimedBlackOpsTiers];

      if (track === 'free' && !freeList.includes(tier)) {
        freeList.push(tier);
      } else if (track === 'blackOps' && !bopsList.includes(tier) && prev.isBlackOpsUnlocked) {
        bopsList.push(tier);
      }

      // Grant credits to wallet
      const target = SEASON_TIERS.find(t => t.tier === tier);
      if (target) {
        const reward = track === 'free' ? target.freeReward : target.blackOpsReward;
        try {
          const curCredits = parseInt(localStorage.getItem('hero_user_credits') || '0', 10);
          localStorage.setItem('hero_user_credits', (curCredits + reward.credits).toString());
        } catch {}
      }

      const updated = {
        ...prev,
        claimedFreeTiers: freeList,
        claimedBlackOpsTiers: bopsList
      };
      saveSeasonPassState(updated);

      if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
        (window as unknown as { gtag: Function }).gtag('event', 'season_pass_tier_claim', {
          tier,
          track
        });
      }

      return updated;
    });
  }, []);

  const claimAllAvailable = useCallback(() => {
    setPassState(prev => {
      const curT = Math.min(TOTAL_TIERS, Math.floor(prev.currentExp / EXP_PER_TIER));
      const freeList = [...prev.claimedFreeTiers];
      const bopsList = [...prev.claimedBlackOpsTiers];
      let creditsToAdd = 0;

      for (let t = 1; t <= curT; t++) {
        if (!freeList.includes(t)) {
          freeList.push(t);
          const item = SEASON_TIERS.find(x => x.tier === t);
          if (item) creditsToAdd += item.freeReward.credits;
        }
        if (prev.isBlackOpsUnlocked && !bopsList.includes(t)) {
          bopsList.push(t);
          const item = SEASON_TIERS.find(x => x.tier === t);
          if (item) creditsToAdd += item.blackOpsReward.credits;
        }
      }

      try {
        const curCredits = parseInt(localStorage.getItem('hero_user_credits') || '0', 10);
        localStorage.setItem('hero_user_credits', (curCredits + creditsToAdd).toString());
      } catch {}

      const updated = {
        ...prev,
        claimedFreeTiers: freeList,
        claimedBlackOpsTiers: bopsList
      };
      saveSeasonPassState(updated);
      return updated;
    });
  }, []);

  const unlockBlackOps = useCallback(() => {
    setPassState(prev => {
      const updated = { ...prev, isBlackOpsUnlocked: true };
      saveSeasonPassState(updated);
      if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
        (window as unknown as { gtag: Function }).gtag('event', 'season_pass_upgrade_click', {
          season: prev.seasonId
        });
      }
      return updated;
    });
  }, []);

  return {
    passState,
    currentTier,
    isBoosterActive,
    addExp,
    claimTier,
    claimAllAvailable,
    unlockBlackOps
  };
}
