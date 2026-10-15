export interface StarBreathingState {
  stage: number; // 1 to 7 Star
  starShards: number;
  totalShardsGathered: number;
  astralResonance: number; // 0 to 100%
  ultimatesCastCount: number;
}

const STORAGE_KEY = 'snshero_star_breathing';

const DEFAULT_STATE: StarBreathingState = {
  stage: 1,
  starShards: 0,
  totalShardsGathered: 0,
  astralResonance: 0,
  ultimatesCastCount: 0,
};

// Shards required to ascend to next stage (Stage 1 -> 2: 10, Stage 2 -> 3: 25, etc.)
export const STAGE_REQUIREMENTS: Record<number, number> = {
  1: 10,
  2: 25,
  3: 50,
  4: 100,
  5: 200,
  6: 400,
  7: 800,
};

export const STAGE_TITLES: Record<number, { nameKo: string; nameEn: string; perkKo: string }> = {
  1: { nameKo: '1성 초보자식 (일광의 숨결)', nameEn: '1-Star Solar Breather', perkKo: '배틀 시작 시 마나 +15%' },
  2: { nameKo: '2성 유수식 (성간의 유동)', nameEn: '2-Star Astral Flow', perkKo: '미니게임 파편 획득량 +20%' },
  3: { nameKo: '3성 응축식 (은하의 고리)', nameEn: '3-Star Galactic Ring', perkKo: '카드 캡처 시 오의 게이지 +10%' },
  4: { nameKo: '4성 개화식 (성좌의 맥동)', nameEn: '4-Star Constellation Pulse', perkKo: '오의 정화 타일 반경 확장' },
  5: { nameKo: '5성 붕괴식 (초신성의 파동)', nameEn: '5-Star Supernova Surge', perkKo: '오의 발동 시 인접 적 공격력 -2' },
  6: { nameKo: '6성 열반식 (성천의 서약)', nameEn: '6-Star Celestial Oath', perkKo: '매 턴 오의 게이지 +5% 자동 회복' },
  7: { nameKo: '7성 완전식 (성진의 화신)', nameEn: '7-Star Avatar of Stars', perkKo: '오의 시전 시 모든 아군 카드 파워 +2' },
};

export const getStarBreathingState = (): StarBreathingState => {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
};

export const saveStarBreathingState = (state: StarBreathingState): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('snshero_star_breathing_updated', { detail: state }));
  } catch {
    // ignore
  }
};

export const addStarShards = (amount: number): { state: StarBreathingState; leveledUp: boolean } => {
  const current = getStarBreathingState();
  let shards = current.starShards + amount;
  const total = current.totalShardsGathered + amount;
  let stage = current.stage;
  let leveledUp = false;

  while (stage < 7) {
    const required = STAGE_REQUIREMENTS[stage];
    if (shards >= required) {
      shards -= required;
      stage += 1;
      leveledUp = true;
    } else {
      break;
    }
  }

  const updated: StarBreathingState = {
    ...current,
    stage,
    starShards: shards,
    totalShardsGathered: total,
    astralResonance: Math.min(100, current.astralResonance + 10),
  };

  saveStarBreathingState(updated);
  return { state: updated, leveledUp };
};

export const chargeAstralResonance = (percent: number): StarBreathingState => {
  const current = getStarBreathingState();
  const updated: StarBreathingState = {
    ...current,
    astralResonance: Math.min(100, Math.max(0, current.astralResonance + percent)),
  };
  saveStarBreathingState(updated);
  return updated;
};

export const consumeAstralUltimate = (): boolean => {
  const current = getStarBreathingState();
  if (current.astralResonance < 100) return false;

  const updated: StarBreathingState = {
    ...current,
    astralResonance: 0,
    ultimatesCastCount: current.ultimatesCastCount + 1,
  };
  saveStarBreathingState(updated);
  return true;
};
