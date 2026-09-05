/**
 * crossElementalSynergy.ts
 * 5속성(수/화/지/풍/광/암) 복합 덱 구성 시 발동하는 '크로스 엘리멘탈 하모니' 하이브리드 시너지 엔진
 * (구글 스프레드시트 Row 913 / ID 561 요구사항 구현)
 */

import { CardData, CardElement } from '../types';

export interface HybridSynergyEffect {
  id: string;
  nameKo: string;
  nameEn: string;
  elements: [CardElement, CardElement] | CardElement[];
  descriptionKo: string;
  descriptionEn: string;
  statModifier: {
    attackBonusPct: number;
    defenseBonusPct: number;
    critRateBonusPct: number;
    speedBonusPct: number;
    dotDamageBonusPct: number;
  };
  vfxColor: string;
  bannerAscii: string;
}

export interface CrossHarmonyEvaluation {
  distinctElements: CardElement[];
  hybridSynergies: HybridSynergyEffect[];
  totalAttackBonusPct: number;
  totalDefenseBonusPct: number;
  totalCritBonusPct: number;
  isPrismaticRainbow: boolean; // 4종 이상 원소 혼합 마스터리
  harmonyRating: 'D' | 'C' | 'B' | 'A' | 'S' | 'EX';
}

export class CrossElementalSynergy {
  private static instance: CrossElementalSynergy;

  private constructor() {}

  public static getInstance(): CrossElementalSynergy {
    if (!CrossElementalSynergy.instance) {
      CrossElementalSynergy.instance = new CrossElementalSynergy();
    }
    return CrossElementalSynergy.instance;
  }

  /**
   * 덱의 카드들을 분석하여 복합 원소 시너지(Cross-Elemental Harmony) 도출
   */
  public evaluateHarmony(deck: (CardData | null | undefined)[]): CrossHarmonyEvaluation {
    const validCards = deck.filter((c): c is CardData => Boolean(c));
    const elementSet = new Set<CardElement>();

    validCards.forEach((c) => {
      if (c.element) {
        elementSet.add(c.element);
      }
    });

    const distinctElements = Array.from(elementSet);
    const hybridSynergies: HybridSynergyEffect[] = [];

    const has = (elem: CardElement) => elementSet.has(elem);

    // 1. 화염(Fire) + 바람(Wind / Air) = 인페르노 번
    if (has('fire') && (has('wind') || has('air'))) {
      hybridSynergies.push({
        id: 'inferno_burn',
        nameKo: '[인페르노 번] 화염 연소 폭풍',
        nameEn: 'Inferno Burn Vortex',
        elements: ['fire', 'wind'],
        descriptionKo: '화염과 돌풍이 결속하여 공격속도 +20% 및 지속 화염 피해를 부여합니다.',
        descriptionEn: 'Fire and gale blend to grant +20% attack speed and continuous flame burn damage.',
        statModifier: { attackBonusPct: 15, defenseBonusPct: 0, critRateBonusPct: 5, speedBonusPct: 20, dotDamageBonusPct: 25 },
        vfxColor: '#f97316',
        bannerAscii: '[[ FIRE + WIND: INFERNO BURST ]]',
      });
    }

    // 2. 수류(Water) + 대지(Earth / Land) = 머드 슬로우다운
    if (has('water') && (has('earth') || has('land'))) {
      hybridSynergies.push({
        id: 'mud_slowdown',
        nameKo: '[머드 퀘이크] 수류 진흙 구속',
        nameEn: 'Mud Quake Sludge',
        elements: ['water', 'earth'],
        descriptionKo: '수류와 대지가 결합하여 방어력 +25% 및 적 이동속도 저하를 유발합니다.',
        descriptionEn: 'Water and earth merge to provide +25% defense and inflict slowdown on enemies.',
        statModifier: { attackBonusPct: 0, defenseBonusPct: 25, critRateBonusPct: 0, speedBonusPct: -5, dotDamageBonusPct: 0 },
        vfxColor: '#10b981',
        bannerAscii: '[[ WATER + EARTH: QUAKE SHIELD ]]',
      });
    }

    // 3. 화염(Fire) + 수류(Water) = 스팀 익스플로전
    if (has('fire') && has('water')) {
      hybridSynergies.push({
        id: 'steam_explosion',
        nameKo: '[증기 과부하] 스팀 익스플로전',
        nameEn: 'Steam Explosion Vapor',
        elements: ['fire', 'water'],
        descriptionKo: '상극인 불과 물이 만나 치명타율 +15% 및 광역 스팀 압력 폭발을 일으킵니다.',
        descriptionEn: 'Conflicting fire and water spark +15% crit rate and pressurized steam shockwaves.',
        statModifier: { attackBonusPct: 12, defenseBonusPct: 0, critRateBonusPct: 15, speedBonusPct: 5, dotDamageBonusPct: 10 },
        vfxColor: '#06b6d4',
        bannerAscii: '[[ FIRE + WATER: STEAM BLAST ]]',
      });
    }

    // 4. 대지(Earth / Land) + 바람(Wind / Air) = 샌드스톰 블라인드
    if ((has('earth') || has('land')) && (has('wind') || has('air'))) {
      hybridSynergies.push({
        id: 'sandstorm_blind',
        nameKo: '[모래 폭풍] 샌드스톰 블라인드',
        nameEn: 'Sandstorm Blindness',
        elements: ['earth', 'wind'],
        descriptionKo: '대지와 바람의 소용돌이가 치명타율 +10% 및 회피율을 상승시킵니다.',
        descriptionEn: 'Swirling sand grants +10% crit rate and heightened team evasion.',
        statModifier: { attackBonusPct: 8, defenseBonusPct: 12, critRateBonusPct: 10, speedBonusPct: 10, dotDamageBonusPct: 0 },
        vfxColor: '#eab308',
        bannerAscii: '[[ EARTH + WIND: SANDSTORM AURA ]]',
      });
    }

    // 5. 무지개 하모니 (4종 이상의 독자적 원소 보유)
    const isPrismaticRainbow = distinctElements.length >= 4;
    if (isPrismaticRainbow) {
      hybridSynergies.push({
        id: 'prismatic_rainbow',
        nameKo: '[프리즈마틱] 5원소 무지개 하모니',
        nameEn: 'Prismatic Rainbow Harmony',
        elements: distinctElements,
        descriptionKo: '다양한 원소가 완벽한 균형을 이루어 전 스탯 +15% 및 전술적 우위를 획득합니다.',
        descriptionEn: '4+ unique elements form transcendent equilibrium, boosting all stats by +15%.',
        statModifier: { attackBonusPct: 15, defenseBonusPct: 15, critRateBonusPct: 10, speedBonusPct: 15, dotDamageBonusPct: 15 },
        vfxColor: '#ec4899',
        bannerAscii: '[[ ★ PRISMATIC RAINBOW RESONANCE ★ ]]',
      });
    }

    // 누적 버프 계산
    let totalAttackBonusPct = 0;
    let totalDefenseBonusPct = 0;
    let totalCritBonusPct = 0;

    hybridSynergies.forEach((s) => {
      totalAttackBonusPct += s.statModifier.attackBonusPct;
      totalDefenseBonusPct += s.statModifier.defenseBonusPct;
      totalCritBonusPct += s.statModifier.critRateBonusPct;
    });

    // 하모니 랭크 결정
    let harmonyRating: 'D' | 'C' | 'B' | 'A' | 'S' | 'EX' = 'D';
    const score = hybridSynergies.length * 20 + (isPrismaticRainbow ? 30 : 0);
    if (score >= 60) harmonyRating = 'EX';
    else if (score >= 45) harmonyRating = 'S';
    else if (score >= 30) harmonyRating = 'A';
    else if (score >= 20) harmonyRating = 'B';
    else if (score >= 10) harmonyRating = 'C';

    return {
      distinctElements,
      hybridSynergies,
      totalAttackBonusPct,
      totalDefenseBonusPct,
      totalCritBonusPct,
      isPrismaticRainbow,
      harmonyRating,
    };
  }
}
