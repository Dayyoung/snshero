/**
 * marketplaceEconomyService.ts
 * 마켓플레이스 및 상점 스태미나 AP 페이싱 & P2P 카드 거래 수수료 밸런스 엔진
 * (구글 스프레드시트 Row 705 / ID 554 요구사항 구현)
 */

export interface StaminaState {
  currentAp: number;
  maxAp: number;
  lastUpdated: number; // ms timestamp
}

const AP_STORAGE_KEY = 'hero_stamina_ap_v1';
const MAX_AP = 100;
const RECOVERY_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes per 1 AP

export function getStaminaState(): StaminaState {
  try {
    const raw = localStorage.getItem(AP_STORAGE_KEY);
    if (raw) {
      const parsed: StaminaState = JSON.parse(raw);
      const now = Date.now();
      const elapsed = Math.max(0, now - parsed.lastUpdated);
      const recovered = Math.floor(elapsed / RECOVERY_INTERVAL_MS);

      if (recovered > 0 && parsed.currentAp < parsed.maxAp) {
        const newAp = Math.min(parsed.maxAp, parsed.currentAp + recovered);
        const newState: StaminaState = {
          currentAp: newAp,
          maxAp: parsed.maxAp,
          lastUpdated: now - (elapsed % RECOVERY_INTERVAL_MS)
        };
        localStorage.setItem(AP_STORAGE_KEY, JSON.stringify(newState));
        return newState;
      }
      return parsed;
    }
  } catch {
    // fallback
  }

  const initial: StaminaState = {
    currentAp: 100,
    maxAp: MAX_AP,
    lastUpdated: Date.now()
  };
  try {
    localStorage.setItem(AP_STORAGE_KEY, JSON.stringify(initial));
  } catch {
    // ignore
  }
  return initial;
}

export function consumeStamina(amount: number): boolean {
  const current = getStaminaState();
  if (current.currentAp < amount) return false;

  const updated: StaminaState = {
    currentAp: current.currentAp - amount,
    maxAp: current.maxAp,
    lastUpdated: Date.now()
  };
  try {
    localStorage.setItem(AP_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return true;
}

export interface PriceRangeGuideline {
  min: number;
  max: number;
  recommended: number;
}

export const RARITY_PRICE_RANGES: Record<string, PriceRangeGuideline> = {
  common: { min: 30, max: 200, recommended: 80 },
  rare: { min: 150, max: 800, recommended: 350 },
  epic: { min: 600, max: 3000, recommended: 1200 },
  legendary: { min: 2500, max: 15000, recommended: 5000 },
  mythic: { min: 10000, max: 80000, recommended: 25000 }
};

export function getPriceRangeForCard(rarity: string = 'common'): PriceRangeGuideline {
  const norm = rarity.toLowerCase();
  return RARITY_PRICE_RANGES[norm] || RARITY_PRICE_RANGES.common;
}

export interface TradeFeeSettlement {
  listingPrice: number;
  feePercent: number; // 5%
  totalFee: number;
  sellerReceives: number;
  burnedAmount: number;     // 50% of fee (2.5%)
  seasonPoolAmount: number; // 50% of fee (2.5%)
}

export function calculateTradeFee(price: number): TradeFeeSettlement {
  const feePercent = 5;
  const totalFee = Math.round(price * 0.05);
  const sellerReceives = Math.max(0, price - totalFee);
  const burnedAmount = Math.floor(totalFee * 0.5);
  const seasonPoolAmount = totalFee - burnedAmount;

  return {
    listingPrice: price,
    feePercent,
    totalFee,
    sellerReceives,
    burnedAmount,
    seasonPoolAmount
  };
}
