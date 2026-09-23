// [SCR-07-07] Web Worker / Low-latency Odds & Win-rate Calculator
export interface OddsCalculationRequest {
  deckACombatPower: number;
  deckBCombatPower: number;
  recentWinRateA: number;
  recentWinRateB: number;
  fameModifierA: number;
  fameModifierB: number;
}

export interface OddsCalculationResult {
  winProbabilityA: number; // 0 ~ 100
  winProbabilityB: number; // 0 ~ 100
  oddsA: number; // e.g. 1.85
  oddsB: number; // e.g. 2.10
  calculatedAt: number;
}

/**
 * Fast off-main-thread / RAF-aligned calculator for sports match odds.
 */
export function calculateLiveOdds(req: OddsCalculationRequest): OddsCalculationResult {
  const powerA = Math.max(1, req.deckACombatPower) * (0.85 + req.recentWinRateA * 0.3) * req.fameModifierA;
  const powerB = Math.max(1, req.deckBCombatPower) * (0.85 + req.recentWinRateB * 0.3) * req.fameModifierB;

  const total = powerA + powerB;
  const probA = Math.round((powerA / total) * 1000) / 10;
  const probB = Math.round((100 - probA) * 10) / 10;

  // Margin deduction 5%
  const payoutPool = 0.95;
  const rawOddsA = (payoutPool / (probA / 100));
  const rawOddsB = (payoutPool / (probB / 100));

  const oddsA = Math.min(10.0, Math.max(1.10, Math.round(rawOddsA * 100) / 100));
  const oddsB = Math.min(10.0, Math.max(1.10, Math.round(rawOddsB * 100) / 100));

  return {
    winProbabilityA: probA,
    winProbabilityB: probB,
    oddsA,
    oddsB,
    calculatedAt: Date.now()
  };
}
