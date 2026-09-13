/**
 * DeckBondSynergyEngine.ts
 * 마이덱(My Deck) 편성 시 영웅 카드 간 숨겨진 인연(Bond) 및 속성 연계 실시간 버프 시각화 파이프라인
 * (구글 스프레드시트 Row 1045 / ID 553 & Row 1037 / ID 549 요구사항 구현)
 */

import { CardData } from '../types';

export interface HeroBondDefinition {
  id: string;
  titleKo: string;
  titleEn: string;
  descKo: string;
  descEn: string;
  badge: string;
  // 속성 조합 또는 카드 ID 조합
  requiredElements?: string[]; // e.g. ['fire', 'wind']
  requiredCardIds?: number[];  // e.g. [1, 2]
  atkMultiplier: number;       // e.g. 1.15
  hpMultiplier: number;        // e.g. 1.10
  critBonusRate: number;       // e.g. 0.15
  auraGlowColor: string;       // Hex or CSS color
}

export interface ActiveBondSynergy {
  bond: HeroBondDefinition;
  connectedCardIndices: number[]; // 덱 내 해당 인연에 참여하는 카드 인덱스들
  totalAtkBonus: number;
  totalHpBonus: number;
  totalCritBonus: number;
}

export const HERO_BOND_DEFINITIONS: HeroBondDefinition[] = [
  {
    id: 'bond_twilight_pact',
    titleKo: '황혼의 맹약 (Twilight Pact)',
    titleEn: 'Twilight Pact',
    descKo: '빛과 어둠의 원소가 융합하여 치명적인 혼돈 에너지를 방출합니다.',
    descEn: 'Light and Dark elements fuse to unleash chaotic energy.',
    badge: '공격 +20% / 치명타 +15%',
    requiredElements: ['light', 'dark'],
    atkMultiplier: 1.20,
    hpMultiplier: 1.05,
    critBonusRate: 0.15,
    auraGlowColor: '#a855f7', // Purple/Violet
  },
  {
    id: 'bond_blazing_storm',
    titleKo: '겁화의 폭풍 (Blazing Tempest)',
    titleEn: 'Blazing Tempest',
    descKo: '화염이 거센 바람을 만나 폭발적인 광역 연소 피해를 발생시킵니다.',
    descEn: 'Fire meets raging wind to ignite explosive burn damage.',
    badge: '공격 +15% / 콤보 증폭',
    requiredElements: ['fire', 'wind'],
    atkMultiplier: 1.15,
    hpMultiplier: 1.0,
    critBonusRate: 0.10,
    auraGlowColor: '#f97316', // Orange
  },
  {
    id: 'bond_abyssal_fortress',
    titleKo: '심해의 요새 (Abyssal Fortress)',
    titleEn: 'Abyssal Fortress',
    descKo: '수속성과 대지 원소가 결합하여 파괴되지 않는 절대 방벽을 형성합니다.',
    descEn: 'Water and Earth combine to forge an impenetrable bastion.',
    badge: '체력 +25% / 방어벽',
    requiredElements: ['water', 'land'],
    atkMultiplier: 1.05,
    hpMultiplier: 1.25,
    critBonusRate: 0.05,
    auraGlowColor: '#0ea5e9', // Sky Blue
  },
  {
    id: 'bond_cyborg_alliance',
    titleKo: '사이보그 연합 (Cyborg Alliance)',
    titleEn: 'Cyborg Alliance',
    descKo: '인간의 전략과 로봇의 연산력이 결합하여 전술적 오버클럭을 가동합니다.',
    descEn: 'Human strategy combines with Robot computing for tactical overclock.',
    badge: '전체 스탯 +12%',
    requiredElements: ['human', 'robot'],
    atkMultiplier: 1.12,
    hpMultiplier: 1.12,
    critBonusRate: 0.12,
    auraGlowColor: '#10b981', // Emerald
  },
  {
    id: 'bond_dragon_elf_oath',
    titleKo: '고대룡의 서약 (Ancient Dragon Oath)',
    titleEn: 'Ancient Dragon Oath',
    descKo: '엘프의 정령술과 드래곤의 시원 에너지가 공명하여 신성한 힘을 각성합니다.',
    descEn: 'Elven spiritcraft resonates with primordial Dragon power.',
    badge: '공격 +25% / 치명타 +20%',
    requiredElements: ['dragon', 'elf'],
    atkMultiplier: 1.25,
    hpMultiplier: 1.10,
    critBonusRate: 0.20,
    auraGlowColor: '#eab308', // Gold
  },
];

export class DeckBondSynergyEngine {
  private static instance: DeckBondSynergyEngine;

  private constructor() {}

  public static getInstance(): DeckBondSynergyEngine {
    if (!DeckBondSynergyEngine.instance) {
      DeckBondSynergyEngine.instance = new DeckBondSynergyEngine();
    }
    return DeckBondSynergyEngine.instance;
  }

  /**
   * 덱 5장 내에서 활성화된 모든 숨겨진 영웅 인연(Bond)과 연결선 데이터 계산
   */
  public evaluateDeckBonds(deck: CardData[]): ActiveBondSynergy[] {
    if (!deck || deck.length < 2) return [];

    const activeBonds: ActiveBondSynergy[] = [];

    // 속성 매핑 (카드별 element 소문자화)
    const cardElements = deck.map((c) => (c.element?.toLowerCase() || 'fire'));

    HERO_BOND_DEFINITIONS.forEach((bondDef) => {
      let isBondFulfilled = false;
      const connectedIndices: number[] = [];

      if (bondDef.requiredElements && bondDef.requiredElements.length > 0) {
        // 모든 필수 속성이 덱 내에 존재하는지 확인
        const matched = bondDef.requiredElements.every((reqEl) => {
          const idx = cardElements.indexOf(reqEl);
          if (idx !== -1) {
            if (!connectedIndices.includes(idx)) connectedIndices.push(idx);
            return true;
          }
          return false;
        });
        isBondFulfilled = matched;
      }

      if (isBondFulfilled) {
        activeBonds.push({
          bond: bondDef,
          connectedCardIndices: connectedIndices,
          totalAtkBonus: Math.round((bondDef.atkMultiplier - 1) * 100),
          totalHpBonus: Math.round((bondDef.hpMultiplier - 1) * 100),
          totalCritBonus: Math.round(bondDef.critBonusRate * 100),
        });
      }
    });

    return activeBonds;
  }

  /**
   * 특정 카드가 속한 인연 오라 발광 테두리 스타일 반환
   */
  public getCardBondGlow(cardIndex: number, activeBonds: ActiveBondSynergy[]): string | null {
    const matchedBond = activeBonds.find((b) => b.connectedCardIndices.includes(cardIndex));
    return matchedBond ? matchedBond.bond.auraGlowColor : null;
  }
}
