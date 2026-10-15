/**
 * elementalTempestStore.ts
 * 미니게임 보스 전리품 연계 3x3 전장 원소 폭풍(Elemental Tempest) 연쇄 스펠 스토어 (RSI-024)
 * 로컬스토리지 기반 원소 핵(Flame/Water/Earth/Wind) 수집 및 스펠 발동 영속화
 */

export interface ElementalCoreInventory {
  flameCores: number;
  waterCores: number;
  earthCores: number;
  windCores: number;
  lastUsedAt?: number;
}

const STORAGE_KEY = 'hero_elemental_cores';

const DEFAULT_CORES: ElementalCoreInventory = {
  flameCores: 3,
  waterCores: 2,
  earthCores: 2,
  windCores: 3
};

export function getElementalCores(): ElementalCoreInventory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveElementalCores(DEFAULT_CORES);
      return DEFAULT_CORES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CORES;
  }
}

export function saveElementalCores(cores: ElementalCoreInventory): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cores));
  } catch {}
}

export function addElementalCore(element: 'FIRE' | 'WATER' | 'EARTH' | 'WIND', count: number = 1): ElementalCoreInventory {
  const current = getElementalCores();
  if (element === 'FIRE') current.flameCores += count;
  else if (element === 'WATER') current.waterCores += count;
  else if (element === 'EARTH') current.earthCores += count;
  else if (element === 'WIND') current.windCores += count;
  saveElementalCores(current);
  return current;
}

export type TempestSpellType = 'INFERNO_BLAST' | 'TIDAL_SANCTUARY' | 'TERRA_FORTRESS' | 'GALE_OVERDRIVE';

export interface TempestSpellInfo {
  type: TempestSpellType;
  nameKo: string;
  nameEn: string;
  costElement: 'FIRE' | 'WATER' | 'EARTH' | 'WIND';
  costAmount: number;
  effectKo: string;
  effectEn: string;
}

export const TEMPEST_SPELLS: TempestSpellInfo[] = [
  {
    type: 'INFERNO_BLAST',
    nameKo: '겁화의 폭풍 (Inferno Blast)',
    nameEn: 'Inferno Blast',
    costElement: 'FIRE',
    costAmount: 1,
    effectKo: '적 전장 전체 방어력 -30% & 화염 폭풍 타격',
    effectEn: 'Enemy Field DEF -30% & Inferno Strike'
  },
  {
    type: 'TIDAL_SANCTUARY',
    nameKo: '수류의 성역 (Tidal Sanctuary)',
    nameEn: 'Tidal Sanctuary',
    costElement: 'WATER',
    costAmount: 1,
    effectKo: '아군 카드 전원 HP/위력 +2 회복 & 결계 부여',
    effectEn: 'All Friendly Cards +2 Power & Barrier'
  },
  {
    type: 'TERRA_FORTRESS',
    nameKo: '대지의 방벽 (Terra Fortress)',
    nameEn: 'Terra Fortress',
    costElement: 'EARTH',
    costAmount: 1,
    effectKo: '3x3 그리드 중앙 슬롯 아군 점유율 영구 고정',
    effectEn: 'Permanent Center Slot Reinforcement'
  },
  {
    type: 'GALE_OVERDRIVE',
    nameKo: '질풍의 가속 (Gale Overdrive)',
    nameEn: 'Gale Overdrive',
    costElement: 'WIND',
    costAmount: 1,
    effectKo: '다음 턴 카드 2장 연속 배치 오버드라이브',
    effectEn: 'Deploy 2 Cards Next Turn Overdrive'
  }
];

export function canCastTempestSpell(spell: TempestSpellInfo): boolean {
  const cores = getElementalCores();
  if (spell.costElement === 'FIRE') return cores.flameCores >= spell.costAmount;
  if (spell.costElement === 'WATER') return cores.waterCores >= spell.costAmount;
  if (spell.costElement === 'EARTH') return cores.earthCores >= spell.costAmount;
  if (spell.costElement === 'WIND') return cores.windCores >= spell.costAmount;
  return false;
}

export function castTempestSpell(spell: TempestSpellInfo): boolean {
  if (!canCastTempestSpell(spell)) return false;
  const cores = getElementalCores();
  if (spell.costElement === 'FIRE') cores.flameCores -= spell.costAmount;
  else if (spell.costElement === 'WATER') cores.waterCores -= spell.costAmount;
  else if (spell.costElement === 'EARTH') cores.earthCores -= spell.costAmount;
  else if (spell.costElement === 'WIND') cores.windCores -= spell.costAmount;
  cores.lastUsedAt = Date.now();
  saveElementalCores(cores);
  return true;
}
