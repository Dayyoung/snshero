/**
 * perkSystem.ts
 * 눈히어로 카단 연대기 영웅 영혼 각인 시스템 (Kadan Hero Passive Perks)
 * 110종 미니게임 수련 업적과 연동된 영구 패시브 각인
 */

export interface TacticalPerk {
  id: string;
  name: string;
  description: string;
  tier: string;
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
    name: '[카단의 서리 참격]',
    description: '카단의 냉기 검술: 급소를 꿰뚫어 치명타 확률을 8% 상승시킵니다.',
    tier: 'I',
    nameKey: 'perkCritName',
    descKey: 'perkCritDesc',
    category: 'CRIT',
    modifier: { critChance: 8 },
    minigameSource: 'CARD RUSH // 수련 #01',
    accentColor: 'text-amber-400 border-amber-500/40 bg-amber-950/30'
  },
  {
    id: 'perk_quantum_accel',
    name: '[페가수스의 신속 돌파]',
    description: '천마 페가수스의 속도: 스킬 쿨다운 주기를 10% 단축합니다.',
    tier: 'I',
    nameKey: 'perkCdName',
    descKey: 'perkCdDesc',
    category: 'COOLDOWN',
    modifier: { cooldownReduction: 10 },
    minigameSource: 'CARD HEIST // 수련 #02',
    accentColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/30'
  },
  {
    id: 'perk_barrier_matrix',
    name: '[알렉산다르의 수호 방패]',
    description: '성기사 알렉산다르의 맹세: 전투 개시 시 최대 HP의 12% 보호막을 전개합니다.',
    tier: 'II',
    nameKey: 'perkShieldName',
    descKey: 'perkShieldDesc',
    category: 'SHIELD',
    modifier: { shieldBonus: 12 },
    minigameSource: 'CARD TAP // 수련 #03',
    accentColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30'
  },
  {
    id: 'perk_overclock_strike',
    name: '[이그니스의 정령 화염]',
    description: '꺼지지 않는 불꽃의 힘: 기본 공격력을 10% 증폭시킵니다.',
    tier: 'II',
    nameKey: 'perkPowerName',
    descKey: 'perkPowerDesc',
    category: 'POWER',
    modifier: { powerBonus: 10 },
    minigameSource: 'CARD SORCERY // 수련 #05',
    accentColor: 'text-rose-400 border-rose-500/40 bg-rose-950/30'
  },
  {
    id: 'perk_nanite_drain',
    name: '[실리아의 생명 정화]',
    description: '상냥한 치유사의 축복: 타격 시 피해량의 6%를 체력으로 회복합니다.',
    tier: 'III',
    nameKey: 'perkDrainName',
    descKey: 'perkDrainDesc',
    category: 'DRAIN',
    modifier: { vampRate: 6 },
    minigameSource: 'CARD JUMPER // 수련 #08',
    accentColor: 'text-violet-400 border-violet-500/40 bg-violet-950/30'
  }
];

export function getUnlockedPerkIds(): string[] {
  if (typeof window === 'undefined') return TACTICAL_PERKS_CATALOG.map(p => p.id);
  try {
    const saved = localStorage.getItem('hero_unlocked_perks');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const defaults = ['perk_precision_core', 'perk_quantum_accel', 'perk_barrier_matrix'];
    localStorage.setItem('hero_unlocked_perks', JSON.stringify(defaults));
    return defaults;
  } catch {
    return ['perk_precision_core', 'perk_quantum_accel', 'perk_barrier_matrix'];
  }
}

export function getUnlockedPerks(): TacticalPerk[] {
  const ids = getUnlockedPerkIds();
  return TACTICAL_PERKS_CATALOG.filter(p => ids.includes(p.id));
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

export function equipPerkToHero(heroId: string | number, perkId: string): { success: boolean; message?: string } {
  if (typeof window === 'undefined') return { success: false };
  try {
    const current = getHeroEquippedPerks(heroId);
    if (current.includes(perkId)) return { success: true };
    if (current.length >= 3) return { success: false, message: 'Max 3 sockets' };
    const updated = [...current, perkId];
    localStorage.setItem(`hero_equipped_perks_${heroId}`, JSON.stringify(updated));
    return { success: true };
  } catch {
    return { success: false };
  }
}

export function unequipPerkFromHero(heroId: string | number, perkId: string): { success: boolean } {
  if (typeof window === 'undefined') return { success: false };
  try {
    const current = getHeroEquippedPerks(heroId);
    const updated = current.filter(id => id !== perkId);
    localStorage.setItem(`hero_equipped_perks_${heroId}`, JSON.stringify(updated));
    return { success: true };
  } catch {
    return { success: false };
  }
}

export function calculateHeroPerkModifiers(heroId: string | number): {
  atkMultiplier: number;
  critBonus: number;
  shieldBonus: number;
  cdReduction: number;
  vampRate: number;
} {
  const equipped = getHeroEquippedPerks(heroId);
  let atkMultiplier = 1.0;
  let critBonus = 0;
  let shieldBonus = 0;
  let cdReduction = 0;
  let vampRate = 0;

  equipped.forEach(id => {
    const perk = TACTICAL_PERKS_CATALOG.find(p => p.id === id);
    if (!perk) return;
    if (perk.modifier.powerBonus) atkMultiplier += perk.modifier.powerBonus / 100;
    if (perk.modifier.critChance) critBonus += perk.modifier.critChance / 100;
    if (perk.modifier.shieldBonus) shieldBonus += perk.modifier.shieldBonus / 100;
    if (perk.modifier.cooldownReduction) cdReduction += perk.modifier.cooldownReduction / 100;
    if (perk.modifier.vampRate) vampRate += perk.modifier.vampRate / 100;
  });

  return {
    atkMultiplier,
    critBonus,
    shieldBonus,
    cdReduction,
    vampRate
  };
}
