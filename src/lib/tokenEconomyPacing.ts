/**
 * tokenEconomyPacing.ts
 * 소환 티켓 마일리지 50회 확정 천장(Pity) 및 경매장 실시간 수수료 바이백/소각 순환 경제 시스템
 * (구글 스프레드시트 Row 693 / ID 562 요구사항 구현)
 */

export interface TokenEconomyState {
  version: number;
  season: string;
  pityCount: number; // 0 to 50
  totalBurnedSns: number;
  weeklyPrizePoolSns: number;
  totalMarketplaceVolume: number;
  totalMarketplaceFeesCollected: number;
  lastUpdated: number;
}

const DEFAULT_PITY_THRESHOLD = 50;
const MARKETPLACE_FEE_RATE = 0.05; // 5% standard fee
const BURN_RATIO = 0.5; // 50% of fees are burned
const PRIZE_POOL_RATIO = 0.5; // 50% of fees go to weekly ranking prize pool

export function getStorageKey(season = 'season1'): string {
  return `hero_token_economy_${season}`;
}

export function loadTokenEconomyState(season = 'season1'): TokenEconomyState {
  if (typeof window === 'undefined') {
    return {
      version: 1,
      season,
      pityCount: 0,
      totalBurnedSns: 125400,
      weeklyPrizePoolSns: 68500,
      totalMarketplaceVolume: 2508000,
      totalMarketplaceFeesCollected: 125400,
      lastUpdated: Date.now()
    };
  }

  try {
    const raw = localStorage.getItem(getStorageKey(season));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    // fallback
  }

  const defaultState: TokenEconomyState = {
    version: 1,
    season,
    pityCount: 0,
    totalBurnedSns: 125400,
    weeklyPrizePoolSns: 68500,
    totalMarketplaceVolume: 2508000,
    totalMarketplaceFeesCollected: 125400,
    lastUpdated: Date.now()
  };

  saveTokenEconomyState(season, defaultState);
  return defaultState;
}

export function saveTokenEconomyState(season: string, state: TokenEconomyState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(season), JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save token economy state:', err);
  }
}

/**
 * Increments summon pity count (max 50). If 50 is reached or UR/Legendary is pulled, resets pity.
 */
export function recordGachaSummon(
  season = 'season1',
  pullsCount = 1,
  pulledLegendary = false
): { state: TokenEconomyState; isPityTriggered: boolean } {
  const state = loadTokenEconomyState(season);
  let isPityTriggered = false;

  if (pulledLegendary) {
    state.pityCount = 0;
  } else {
    state.pityCount += pullsCount;
    if (state.pityCount >= DEFAULT_PITY_THRESHOLD) {
      isPityTriggered = true;
      state.pityCount = 0; // Reset after guaranteed drop
    }
  }

  state.lastUpdated = Date.now();
  saveTokenEconomyState(season, state);

  // Dispatch custom event for real-time UI sync
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hero_token_economy_updated', { detail: state }));
  }

  return { state, isPityTriggered };
}

/**
 * Processes marketplace trade fee buyback:
 * Takes 5% trade fee, splits into 50% Burn and 50% Weekly Mission Prize Pool
 */
export function processMarketplaceFeeBuyback(
  tradeAmountSns: number,
  season = 'season1'
): {
  feeTotal: number;
  burnedAmount: number;
  prizePoolAmount: number;
  updatedState: TokenEconomyState;
} {
  const state = loadTokenEconomyState(season);
  const feeTotal = Math.max(10, Math.round(tradeAmountSns * MARKETPLACE_FEE_RATE));
  const burnedAmount = Math.round(feeTotal * BURN_RATIO);
  const prizePoolAmount = feeTotal - burnedAmount;

  state.totalMarketplaceVolume += tradeAmountSns;
  state.totalMarketplaceFeesCollected += feeTotal;
  state.totalBurnedSns += burnedAmount;
  state.weeklyPrizePoolSns += prizePoolAmount;
  state.lastUpdated = Date.now();

  saveTokenEconomyState(season, state);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hero_token_economy_updated', { detail: state }));
  }

  return {
    feeTotal,
    burnedAmount,
    prizePoolAmount,
    updatedState: state
  };
}
