/**
 * perkSystem.ts
 * Tactical Passive Perks System for SNSHero Core TCG Heroes
 * Linked with 110 Minigame Milestones & Achievements
 */

export interface TacticalPerk {
  id: string;
  nameKey: string;
  descKey: string;
  category: 'CRIT' | 'COOLDOWN' | 'SHIELD' | 'POWER' | 'DRAIN';
  modifier: {
    critChance?: number;       // e.g. +8%
    cooldownReduction?: number;// e.g. -10%
    shieldBonus?: number;      // e.g. +12%
    powerBonus?: number;       // e.g. +10%
    vampRate?: number;         // e.g. +6%
  };
  minigameSource: string;
  accentColor: string;
}

export const TACTICAL_PERKS_CATALOG: TacticalPerk[] = [
  {
    id: 'perk_precision_core',
    nameKey: 'perkCritName',
    descKey: 'perkCritDesc',
    category: 'CRIT',
    modifier: { critChance: 8 },
    minigameSource: 'CARD RUSH // POKI #01',
    accentColor: 'text-amber-400 border-amber-500/40 bg-amber-950/30'
  },
  {
    id: 'perk_quantum_accel',
    nameKey: 'perkCdName',
    descKey: 'perkCdDesc',
    category: 'COOLDOWN',
    modifier: { cooldownReduction: 10 },
    minigameSource: 'CARD HEIST // POKI #02',
    accentColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/30'
  },
  {
    id: 'perk_barrier_matrix',
    nameKey: 'perkShieldName',
    descKey: 'perkShieldDesc',
    category: 'SHIELD',
    modifier: { shieldBonus: 12 },
    minigameSource: 'CARD TAP // POKI #03',
    accentColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30'
  },
  {
    id: 'perk_overclock_strike',
    nameKey: 'perkPowerName',
    descKey: 'perkPowerDesc',
    category: 'POWER',
    modifier: { powerBonus: 10 },
    minigameSource: 'CARD SORCERY // POKI #05',
    accentColor: 'text-rose-400 border-rose-500/40 bg-rose-950/30'
  },
  {
    id: 'perk_nanite_drain',
    nameKey: 'perkDrainName',
    descKey: 'perkDrainDesc',
    category: 'DRAIN',
    modifier: { vampRate: 6 },
    minigameSource: 'CARD JUMPER // POKI #08',
    accentColor: 'text-violet-400 border-violet-500/40 bg-violet-950/30'
  }
];

export function getUnlockedPerks(): string[] {
  if (typeof window === 'undefined') return TACTICAL_PERKS_CATALOG.map(p => p.id);
  try {
    const saved = localStorage.getItem('hero_unlocked_perks');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Default unlock top 3 starter perks from minigames
    const defaults = ['perk_precision_core', 'perk_quantum_accel', 'perk_barrier_matrix'];
    localStorage.setItem('hero_unlocked_perks', JSON.stringify(defaults));
    return defaults;
  } catch {
    return ['perk_precision_core', 'perk_quantum_accel', 'perk_barrier_matrix'];
  }
}

export function getHeroEquippedPerks(heroId: string | number): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`hero_equipped_perks_${heroId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, 3);
    }
    return [];
  } catch {
    return [];
  }
}

export function equipPerkToHero(heroId: string | number, perkId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const current = getHeroEquippedPerks(heroId);
    if (current.includes(perkId)) return true;
    if (current.length >= 3) return false; // Max 3 sockets
    const updated = [...current, perkId];
    localStorage.setItem(`hero_equipped_perks_${heroId}`, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

export function unequipPerkFromHero(heroId: string | number, perkId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const current = getHeroEquippedPerks(heroId);
    const updated = current.filter(id => id !== perkId);
    localStorage.setItem(`hero_equipped_perks_${heroId}`, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

export function calculateHeroPerkModifiers(heroId: string | number) {
  const equippedIds = getHeroEquippedPerks(heroId);
  const total = {
    critChance: 0,
    cooldownReduction: 0,
    shieldBonus: 0,
    powerBonus: 0,
    vampRate: 0,
  };

  equippedIds.forEach(id => {
    const perk = TACTICAL_PERKS_CATALOG.find(p => p.id === id);
    if (perk) {
      if (perk.modifier.critChance) total.critChance += perk.modifier.critChance;
      if (perk.modifier.cooldownReduction) total.cooldownReduction += perk.modifier.cooldownReduction;
      if (perk.modifier.shieldBonus) total.shieldBonus += perk.modifier.shieldBonus;
      if (perk.modifier.powerBonus) total.powerBonus += perk.modifier.powerBonus;
      if (perk.modifier.vampRate) total.vampRate += perk.modifier.vampRate;
    }
  });

  return total;
}
