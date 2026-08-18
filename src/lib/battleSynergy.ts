// battleSynergy.ts - 세력 상성, 장비 조합 보너스, 전투 시너지 계산
// 순수 함수로 구현하여 전투 계산부와 UI가 동일한 결과를 보도록 보장

import { CardData, CardElement, Item, EquipmentSlot } from '../types';
import { getNormalizedElement } from '../constants';

// ─── 세력 상성 상수 ─────────────────────────────────────────────────

/** 세력 상성 매트릭스: key 세력이 value 세력에 대해 유리한 정도 (배율) */
export const FACTION_MATCHUP: Record<string, Record<string, number>> = {
  fire:   { wind: 1.15, earth: 0.85, water: 0.80 },
  water:  { fire: 1.15, earth: 0.90, wind: 0.85 },
  wind:   { earth: 1.15, fire: 0.85, water: 0.90 },
  earth:  { water: 1.15, wind: 0.80, fire: 0.85 },
  human:  { undead: 1.10, monster: 0.90 },
  undead: { human: 1.10, elf: 0.90 },
  elf:    { dwarf: 1.10, undead: 0.90 },
  dwarf:  { robot: 1.10, elf: 0.90 },
  monster:{ robot: 1.10, human: 0.90 },
  robot:  { dragon: 1.10, monster: 0.90 },
  dragon: { dwarf: 1.10, robot: 0.90 },
};

/** 기본 상성 배율 (중립) */
export const DEFAULT_FACTION_MULTIPLIER = 1.0;

/** 상성 우위 임계값 (이 값 이상이면 우위로 판정) */
export const ADVANTAGE_THRESHOLD = 1.05;
/** 상성 열세 임계값 (이 값 이하이면 열세로 판정) */
export const DISADVANTAGE_THRESHOLD = 0.95;

export type FactionAdvantage = 'advantage' | 'neutral' | 'disadvantage';

/**
 * 두 세력 간 상성 배율 반환
 * - 1.0 초과: attacker가 defender에게 유리
 * - 1.0 미만: attacker가 defender에게 불리
 * - 1.0: 중립
 */
export const getFactionMultiplier = (
  attackerElement: string | null | undefined,
  defenderElement: string | null | undefined,
): number => {
  if (!attackerElement || !defenderElement) return DEFAULT_FACTION_MULTIPLIER;
  const atk = attackerElement.toLowerCase();
  const def = defenderElement.toLowerCase();

  if (FACTION_MATCHUP[atk]?.[def]) {
    return FACTION_MATCHUP[atk][def];
  }
  return DEFAULT_FACTION_MULTIPLIER;
};

/**
 * 팩션 상성에 따른 우위/열세/중립 판정
 */
export const getFactionAdvantage = (
  attackerFaction: string | null | undefined,
  defenderFaction: string | null | undefined,
): FactionAdvantage => {
  const mult = getFactionMultiplier(attackerFaction, defenderFaction);
  if (mult >= ADVANTAGE_THRESHOLD) return 'advantage';
  if (mult <= DISADVANTAGE_THRESHOLD) return 'disadvantage';
  return 'neutral';
};

/**
 * 카드 간 세력 상성 배율 (CardData 기준)
 */
export const getCardFactionMultiplier = (
  attackerCard: CardData,
  defenderCard: CardData,
): number => {
  const atkEl = getNormalizedElement(attackerCard);
  const defEl = getNormalizedElement(defenderCard);
  return getFactionMultiplier(atkEl, defEl);
};

// ─── 장비 시너지 상수 ────────────────────────────────────────────────

/** 장비 슬롯별 장착 부위 */
export type EquipmentSynergySlot = 'necklace' | 'ring1' | 'ring2' | 'boots';

/** 장비 세트 효과 정의 */
export interface SetBonus {
  /** 필요한 동일 세트 장비 수 */
  count: number;
  /** 설명 키 (i18n) */
  descriptionKey: string;
  /** 스탯 보너스 [top, right, bottom, left] */
  statBonus: [number, number, number, number];
  /** 추가 파워 보너스 */
  powerBonus: number;
}

/** 장비 세트 이름 → 세트 효과 매핑 */
export interface EquipmentSet {
  name: string;
  nameKey: string; // i18n key
  bonuses: SetBonus[];
}

// 세트 보너스 상수 — 작은 배율로 시작
export const EQUIPMENT_SETS: Record<string, EquipmentSet> = {
  beginner: {
    name: 'Beginner',
    nameKey: 'synergy_set_beginner',
    bonuses: [
      { count: 2, descriptionKey: 'synergy_set_beginner_2', statBonus: [1, 1, 1, 1], powerBonus: 2 },
      { count: 3, descriptionKey: 'synergy_set_beginner_3', statBonus: [2, 2, 2, 2], powerBonus: 5 },
      { count: 4, descriptionKey: 'synergy_set_beginner_4', statBonus: [4, 4, 4, 4], powerBonus: 10 },
    ],
  },
  elemental: {
    name: 'Elemental',
    nameKey: 'synergy_set_elemental',
    bonuses: [
      { count: 2, descriptionKey: 'synergy_set_elemental_2', statBonus: [3, 3, 3, 3], powerBonus: 8 },
      { count: 3, descriptionKey: 'synergy_set_elemental_3', statBonus: [6, 6, 6, 6], powerBonus: 16 },
      { count: 4, descriptionKey: 'synergy_set_elemental_4', statBonus: [10, 10, 10, 10], powerBonus: 25 },
    ],
  },
  guardian: {
    name: 'Guardian',
    nameKey: 'synergy_set_guardian',
    bonuses: [
      { count: 2, descriptionKey: 'synergy_set_guardian_2', statBonus: [5, 0, 5, 0], powerBonus: 10 },
      { count: 3, descriptionKey: 'synergy_set_guardian_3', statBonus: [8, 0, 8, 0], powerBonus: 20 },
      { count: 4, descriptionKey: 'synergy_set_guardian_4', statBonus: [12, 0, 12, 0], powerBonus: 30 },
    ],
  },
};

/** 장비 아이템이 속한 세트를 결정 (현재는 rarity 기반으로 단순 분류) */
export const getEquipmentSetName = (item: Item): string | null => {
  if (!item.rarity) return null;
  switch (item.rarity) {
    case 'normal':
      return 'beginner';
    case 'magic':
      return 'elemental';
    case 'rare':
      return 'guardian';
    default:
      return null;
  }
};

/**
 * 장착된 장비들의 세트 보너스를 계산
 */
export const getEquipmentSetBonus = (
  equipment: Partial<Record<EquipmentSlot, Item>>,
): { setName: string | null; bonusCount: number; statBonus: [number, number, number, number]; powerBonus: number } => {
  const equipped = Object.values(equipment).filter((item): item is Item => !!item);
  if (equipped.length === 0) {
    return { setName: null, bonusCount: 0, statBonus: [0, 0, 0, 0], powerBonus: 0 };
  }

  // 세트별 장착 수 집계
  const setCounts: Record<string, number> = {};
  equipped.forEach(item => {
    const setName = getEquipmentSetName(item);
    if (setName) {
      setCounts[setName] = (setCounts[setName] || 0) + 1;
    }
  });

  // 가장 높은 세트 보너스 찾기
  let bestBonus: { setName: string | null; bonusCount: number; statBonus: [number, number, number, number]; powerBonus: number } = {
    setName: null,
    bonusCount: 0,
    statBonus: [0, 0, 0, 0],
    powerBonus: 0,
  };

  Object.entries(setCounts).forEach(([setName, count]) => {
    const setDef = EQUIPMENT_SETS[setName];
    if (!setDef) return;

    // 가장 높은 적용 가능한 보너스 찾기
    let activeBonus: SetBonus | null = null;
    for (const bonus of setDef.bonuses) {
      if (count >= bonus.count) {
        activeBonus = bonus;
      }
    }
    if (activeBonus && activeBonus.powerBonus > bestBonus.powerBonus) {
      bestBonus = {
        setName,
        bonusCount: activeBonus.count,
        statBonus: [...activeBonus.statBonus] as [number, number, number, number],
        powerBonus: activeBonus.powerBonus,
      };
    }
  });

  return bestBonus;
};

// ─── 전투 시너지 종합 계산 ──────────────────────────────────────────

export interface BattleSynergyResult {
  factionMultiplier: number;
  factionAdvantage: FactionAdvantage;
  equipmentSetName: string | null;
  equipmentStatBonus: [number, number, number, number];
  equipmentPowerBonus: number;
  totalMultiplier: number;
  /** 각 보너스의 설명용 로그 항목 */
  logEntries: string[];
}

/**
 * 종합 전투 시너지 계산
 * - attacker/defender 카드 간 세력 상성 적용
 * - attacker의 장비 세트 보너스 적용
 */
export const calculateBattleSynergy = (
  attackerCard: CardData,
  defenderCard: CardData,
  attackerEquipment?: Partial<Record<EquipmentSlot, Item>>,
): BattleSynergyResult => {
  const logEntries: string[] = [];

  // 1. 세력 상성
  const factionMultiplier = getCardFactionMultiplier(attackerCard, defenderCard);
  const factionAdvantage = getFactionAdvantage(
    getNormalizedElement(attackerCard),
    getNormalizedElement(defenderCard),
  );

  if (factionMultiplier > DEFAULT_FACTION_MULTIPLIER) {
    logEntries.push(`Faction advantage: x${factionMultiplier.toFixed(2)}`);
  } else if (factionMultiplier < DEFAULT_FACTION_MULTIPLIER) {
    logEntries.push(`Faction disadvantage: x${factionMultiplier.toFixed(2)}`);
  }

  // 2. 장비 세트 보너스
  const equipment = attackerEquipment || attackerCard.equipment || {};
  const equipBonus = getEquipmentSetBonus(equipment);

  if (equipBonus.setName) {
    logEntries.push(`Equipment set [${equipBonus.setName}]: +${equipBonus.powerBonus} power, stat bonus applied`);
  }

  // 3. 종합 배율 (상성 x 장비는 별도로 적용, 여기서는 참고값)
  // 실제 데미지 계산 시 factionMultiplier를 기본 스탯에 곱하고, equipmentStatBonus를 더함
  const totalMultiplier = factionMultiplier; // 장비 보너스는 additive이므로 multiplier에는 미포함

  return {
    factionMultiplier,
    factionAdvantage,
    equipmentSetName: equipBonus.setName,
    equipmentStatBonus: equipBonus.statBonus,
    equipmentPowerBonus: equipBonus.powerBonus,
    totalMultiplier,
    logEntries,
  };
};

// ─── 유틸리티 ───────────────────────────────────────────────────────

/** 세력 우위 아이콘 매핑 */
export const FACTION_ADVANTAGE_ICONS: Record<FactionAdvantage, string> = {
  advantage: '▲',
  neutral: '─',
  disadvantage: '▼',
};

/** 세력 우위 컬러 클래스 매핑 */
export const FACTION_ADVANTAGE_COLORS: Record<FactionAdvantage, string> = {
  advantage: 'text-green-400',
  neutral: 'text-gray-400',
  disadvantage: 'text-red-400',
};

/** 장비 세트 아이콘 */
export const EQUIPMENT_SET_ICONS: Record<string, string> = {
  beginner: '🛡️',
  elemental: '🔥',
  guardian: '🏰',
};

/** testMode에서만 로그 출력 */
export const testLog = (...args: unknown[]): void => {
  try {
    if (typeof window !== 'undefined' && (window as any).__HERMES_TEST_MODE__) {
      console.log('[BattleSynergy]', ...args);
    }
  } catch {
    // silent
  }
};

/**
 * 상대 덱 정보를 분석하여 가장 유리한 상성/스탯을 갖는 추천 카운터 덱(5장 카드 ID)을 자동 산출합니다. (Item 354)
 */
export const generateCounterDeck = (
  opponentDeck: (CardData | { id: string | number; element?: string; stats?: any; [key: string]: any })[],
  cardDatabase: Record<number, any>,
  inventory?: Record<number, any>,
): number[] => {
  if (!opponentDeck || opponentDeck.length === 0) {
    return [1, 11, 21, 31, 101];
  }

  // 1. 상대 덱의 주력 세력/속성 집계
  const oppFactionCounts: Record<string, number> = {};
  opponentDeck.forEach(card => {
    const el = card ? (card.element || getNormalizedElement(card as CardData)) : null;
    if (el) {
      oppFactionCounts[el] = (oppFactionCounts[el] || 0) + 1;
    }
  });

  // 2. 가용한 카드 풀 (인벤토리 보유 카드 또는 전체 DB)
  const availableCardIds = inventory && Object.keys(inventory).length >= 5
    ? Object.keys(inventory).map(Number).filter(id => cardDatabase[id])
    : Object.keys(cardDatabase).map(Number);

  // 3. 각 가용 카드별 카운터 점수 계산 (상대 카드들에 대한 세력 상성 우위 + 스탯 파워)
  const scoredCards = availableCardIds.map(id => {
    const cardData = cardDatabase[id];
    const myEl = cardData ? (cardData.element || getNormalizedElement(cardData as CardData)) : null;
    let counterScore = 0;

    opponentDeck.forEach(oppCard => {
      const oppEl = oppCard ? (oppCard.element || getNormalizedElement(oppCard as CardData)) : null;
      const mult = getFactionMultiplier(myEl, oppEl);
      if (mult > DEFAULT_FACTION_MULTIPLIER) {
        counterScore += 25; // 상성 우위 가산점
      } else if (mult < DEFAULT_FACTION_MULTIPLIER) {
        counterScore -= 15; // 상성 열세 감점
      }
    });

    const statSum = (cardData.stats || [1, 1, 1, 1]).reduce((a: number, b: number) => a + b, 0);
    const power = cardData.power || statSum * 10;
    const finalScore = counterScore + (power * 0.1);

    return { id, score: finalScore };
  });

  // 점수 내림차순 정렬 후 상위 5장 추출 (중복 제거)
  scoredCards.sort((a, b) => b.score - a.score);
  const selectedDeck: number[] = [];
  for (const item of scoredCards) {
    if (!selectedDeck.includes(item.id)) {
      selectedDeck.push(item.id);
    }
    if (selectedDeck.length >= 5) break;
  }

  // 만약 5장이 안 되면 기본 카드 보충
  while (selectedDeck.length < 5) {
    const fallback = [1, 11, 21, 31, 101][selectedDeck.length] || 1;
    if (!selectedDeck.includes(fallback)) selectedDeck.push(fallback);
    else selectedDeck.push(fallback + selectedDeck.length);
  }

  return selectedDeck.slice(0, 5);
};

/**
 * 인접한 동일/상성 속성 카드 간의 원소 콤보(Elemental Synergy Combo) 보너스 계산 (Item 356)
 * - 동일 속성 인접: +1 공명 보너스
 * - 상성 우위 속성 인접: +2 증폭 콤보 보너스
 */
export const calculateElementalComboBonus = (
  placedCard: CardData,
  neighborCard: CardData,
  isAlly: boolean,
): { bonus: number; comboType: 'resonance' | 'amplification' | null; logTextKo?: string; logTextEn?: string } => {
  const pEl = getNormalizedElement(placedCard);
  const nEl = getNormalizedElement(neighborCard);

  if (!pEl || !nEl) return { bonus: 0, comboType: null };

  if (isAlly) {
    // 아군 카드끼리 속성이 일치하면 원소 공명(Resonance) 발생
    if (pEl === nEl) {
      return {
        bonus: 1,
        comboType: 'resonance',
        logTextKo: `⚡ [원소 공명] 동일 ${pEl.toUpperCase()} 속성 아군 연계! 스탯 +1 공명 강화!`,
        logTextEn: `⚡ [ELEMENTAL RESONANCE] Matching ${pEl.toUpperCase()} ally resonance! +1 Stat Boost!`,
      };
    }
  }

  // 상성 우위 관계인 경우 원소 증폭(Amplification) 발생
  const mult = getFactionMultiplier(pEl, nEl);
  if (mult >= ADVANTAGE_THRESHOLD) {
    return {
      bonus: 2,
      comboType: 'amplification',
      logTextKo: `🔥 [원소 콤보] ${pEl.toUpperCase()} 속성이 ${nEl.toUpperCase()} 속성을 압도하여 +2 증폭 타격!`,
      logTextEn: `🔥 [ELEMENTAL COMBO] ${pEl.toUpperCase()} dominates ${nEl.toUpperCase()} with +2 Amplified Strike!`,
    };
  }

  return { bonus: 0, comboType: null };
};

