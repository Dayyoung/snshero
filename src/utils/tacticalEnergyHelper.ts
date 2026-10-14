/**
 * Tactical Energy (AP) & Daily Minigame Retention Helper
 * Manages player AP gained from minigames and consumed in TCG Tactical Overrides.
 * Pure TypeScript, LocalStorage persistent, Zero-Emoji.
 */

const AP_STORAGE_KEY = 'hero_tactical_ap';
const MAX_AP = 100;
const DEFAULT_AP = 60;

export interface APState {
  ap: number;
  maxAp: number;
  dailyMinigameCount: number;
  overridePackClaimed: boolean;
}

/** Get formatted current date key (YYYY-MM-DD) */
export function getTodayDateKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Retrieve current AP from localStorage */
export function getTacticalAp(): number {
  try {
    const raw = localStorage.getItem(AP_STORAGE_KEY);
    if (raw === null) {
      localStorage.setItem(AP_STORAGE_KEY, String(DEFAULT_AP));
      return DEFAULT_AP;
    }
    const val = parseInt(raw, 10);
    return isNaN(val) ? DEFAULT_AP : Math.min(MAX_AP, Math.max(0, val));
  } catch {
    return DEFAULT_AP;
  }
}

/** Add AP and notify subscribers */
export function addTacticalAp(amount: number): number {
  const current = getTacticalAp();
  const next = Math.min(MAX_AP, current + amount);
  try {
    localStorage.setItem(AP_STORAGE_KEY, String(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('snshero_tactical_ap_changed', { detail: { ap: next } }));
    }
  } catch {}
  return next;
}

/** Consume AP if available */
export function consumeTacticalAp(cost: number): boolean {
  const current = getTacticalAp();
  if (current < cost) return false;
  const next = Math.max(0, current - cost);
  try {
    localStorage.setItem(AP_STORAGE_KEY, String(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('snshero_tactical_ap_changed', { detail: { ap: next } }));
    }
  } catch {}
  return true;
}

/** Get today's completed minigame count */
export function getDailyMinigameCount(): number {
  try {
    const dateKey = getTodayDateKey();
    const raw = localStorage.getItem(`hero_daily_minigame_count_${dateKey}`);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/** Record one completed minigame play and reward AP */
export function recordDailyMinigamePlay(apReward = 20): { newCount: number; newAp: number; packUnlocked: boolean } {
  const dateKey = getTodayDateKey();
  const countKey = `hero_daily_minigame_count_${dateKey}`;
  const currentCount = getDailyMinigameCount();
  const newCount = currentCount + 1;

  try {
    localStorage.setItem(countKey, String(newCount));
  } catch {}

  const newAp = addTacticalAp(apReward);
  const claimed = isDailyOverridePackClaimed();
  const packUnlocked = newCount >= 3 && !claimed;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snshero_daily_minigame_updated', {
      detail: { count: newCount, packUnlocked }
    }));
  }

  return { newCount, newAp, packUnlocked };
}

/** Check if today's Tactical Override Pack was already claimed */
export function isDailyOverridePackClaimed(): boolean {
  try {
    const dateKey = getTodayDateKey();
    return localStorage.getItem(`hero_daily_override_pack_${dateKey}`) === 'claimed';
  } catch {
    return false;
  }
}

/** Check if player can claim today's override pack */
export function canClaimDailyOverridePack(): boolean {
  return getDailyMinigameCount() >= 3 && !isDailyOverridePackClaimed();
}

/** Claim daily retention pack: 1 Ticket + Battle Booster + 40 AP */
export function claimDailyOverridePack(): { success: boolean; message: string } {
  if (!canClaimDailyOverridePack()) {
    return { success: false, message: 'REQUIREMENTS_NOT_MET' };
  }

  const dateKey = getTodayDateKey();
  try {
    localStorage.setItem(`hero_daily_override_pack_${dateKey}`, 'claimed');

    // Grant 1 Summon Ticket
    const ticketKey = 'hero_gacha_tickets';
    const currentTickets = parseInt(localStorage.getItem(ticketKey) || '0', 10);
    localStorage.setItem(ticketKey, String(currentTickets + 1));

    // Grant Battle Booster token
    const boosterKey = 'hero_tactical_booster_tokens';
    const currentBoosters = parseInt(localStorage.getItem(boosterKey) || '0', 10);
    localStorage.setItem(boosterKey, String(currentBoosters + 1));

    // Refill 40 AP
    addTacticalAp(40);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('snshero_daily_pack_claimed', { detail: { date: dateKey } }));
    }
    return { success: true, message: 'CLAIM_SUCCESS' };
  } catch {
    return { success: false, message: 'STORAGE_ERROR' };
  }
}

/** Read full AP state bundle */
export function getFullAPState(): APState {
  return {
    ap: getTacticalAp(),
    maxAp: MAX_AP,
    dailyMinigameCount: getDailyMinigameCount(),
    overridePackClaimed: isDailyOverridePackClaimed(),
  };
}
