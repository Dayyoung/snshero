/**
 * deckSynergyLinkEngine.ts
 * 덱 빌딩 시 카드 5종 속성/진영 조합에 따른 '실시간 시너지 링크(Synergy Link) 및 전장 오라 연출' 엔진
 * (구글 스프레드시트 Row 905 / ID 553 요구사항 구현)
 */

import { CardData } from '../types';

export interface ConstellationLink {
  sourceIndex: number;
  targetIndex: number;
  sourceCardId: string;
  targetCardId: string;
  synergyType: 'element' | 'faction' | 'cross';
  synergyName: string;
  color: string;
  glowIntensity: number; // 0.1 ~ 1.0
}

export interface FactionResonance {
  faction: string;
  nameKo: string;
  count: number;
  buffDescription: string;
  statBonus: {
    attackBonusPct: number;
    hpBonusPct: number;
    critBonusPct: number;
  };
}

export interface DeckSynergyEvaluation {
  elementCounts: Record<string, number>;
  factionCounts: Record<string, number>;
  activeResonances: FactionResonance[];
  constellationLinks: ConstellationLink[];
  totalSynergyScore: number;
  battlefieldAura: {
    auraName: string;
    auraColor: string;
    description: string;
    particleCount: number;
  } | null;
}

export class DeckSynergyLinkEngine {
  private static instance: DeckSynergyLinkEngine;

  private constructor() {}

  public static getInstance(): DeckSynergyLinkEngine {
    if (!DeckSynergyLinkEngine.instance) {
      DeckSynergyLinkEngine.instance = new DeckSynergyLinkEngine();
    }
    return DeckSynergyLinkEngine.instance;
  }

  /**
   * 덱 5장의 원소/진영 시너지 링크 및 공명 버프 실시간 계산
   */
  public evaluateDeckSynergy(deck: (CardData | null | undefined)[]): DeckSynergyEvaluation {
    const validCards: { card: CardData; index: number }[] = [];
    deck.forEach((card, idx) => {
      if (card) {
        validCards.push({ card, index: idx });
      }
    });

    const elementCounts: Record<string, number> = {};
    const factionCounts: Record<string, number> = {};
    const links: ConstellationLink[] = [];

    // 1. 개별 카드 메타 카운팅
    validCards.forEach(({ card }) => {
      const elem = (card.element || 'neutral').toLowerCase();
      elementCounts[elem] = (elementCounts[elem] || 0) + 1;

      // 종족(race) 또는 메타 속성을 진영(Faction)으로 매핑
      const faction = (card.race || (card as { faction?: string }).faction || 'wanderer').toLowerCase();
      factionCounts[faction] = (factionCounts[faction] || 0) + 1;
    });

    // 2. 카드 쌍 간의 별자리 링크(Constellation Links) 구성
    for (let i = 0; i < validCards.length; i++) {
      for (let j = i + 1; j < validCards.length; j++) {
        const a = validCards[i];
        const b = validCards[j];

        const elemA = (a.card.element || '').toLowerCase();
        const elemB = (b.card.element || '').toLowerCase();
        const facA = (a.card.race || (a.card as { faction?: string }).faction || '').toLowerCase();
        const facB = (b.card.race || (b.card as { faction?: string }).faction || '').toLowerCase();

        const matchElem = elemA && elemA === elemB;
        const matchFac = facA && facA === facB;

        if (matchElem && matchFac) {
          links.push({
            sourceIndex: a.index,
            targetIndex: b.index,
            sourceCardId: a.card.id,
            targetCardId: b.card.id,
            synergyType: 'cross',
            synergyName: `[원소+진영 완전결속] ${elemA.toUpperCase()}`,
            color: '#a855f7', // Purple
            glowIntensity: 1.0,
          });
        } else if (matchElem) {
          links.push({
            sourceIndex: a.index,
            targetIndex: b.index,
            sourceCardId: a.card.id,
            targetCardId: b.card.id,
            synergyType: 'element',
            synergyName: `[원소 공명] ${elemA.toUpperCase()}`,
            color: this.getElementColor(elemA),
            glowIntensity: 0.75,
          });
        } else if (matchFac) {
          links.push({
            sourceIndex: a.index,
            targetIndex: b.index,
            sourceCardId: a.card.id,
            targetCardId: b.card.id,
            synergyType: 'faction',
            synergyName: `[진영 결속] ${facA.toUpperCase()}`,
            color: '#3b82f6', // Blue
            glowIntensity: 0.8,
          });
        }
      }
    }

    // 3. 활성 공명(Active Resonances) 계산 (2장 이상 일치 시 활성)
    const activeResonances: FactionResonance[] = [];

    Object.entries(elementCounts).forEach(([elem, count]) => {
      if (count >= 2) {
        const bonusMultiplier = count >= 4 ? 2.5 : count >= 3 ? 1.8 : 1.0;
        activeResonances.push({
          faction: `elem_${elem}`,
          nameKo: `${this.getElementNameKo(elem)} 공명 (${count}세트)`,
          count,
          buffDescription: `전체 공격력 +${Math.round(8 * bonusMultiplier)}%, 치명타 +${Math.round(4 * bonusMultiplier)}%`,
          statBonus: {
            attackBonusPct: Math.round(8 * bonusMultiplier),
            hpBonusPct: Math.round(5 * bonusMultiplier),
            critBonusPct: Math.round(4 * bonusMultiplier),
          },
        });
      }
    });

    Object.entries(factionCounts).forEach(([fac, count]) => {
      if (count >= 2 && fac !== 'wanderer') {
        const bonusMultiplier = count >= 4 ? 2.5 : count >= 3 ? 1.8 : 1.0;
        activeResonances.push({
          faction: `fac_${fac}`,
          nameKo: `${this.getFactionNameKo(fac)} 연대 (${count}세트)`,
          count,
          buffDescription: `전체 생명력 +${Math.round(12 * bonusMultiplier)}%, 방어력 상승`,
          statBonus: {
            attackBonusPct: Math.round(5 * bonusMultiplier),
            hpBonusPct: Math.round(12 * bonusMultiplier),
            critBonusPct: Math.round(3 * bonusMultiplier),
          },
        });
      }
    });

    // 4. 전장 오라(Battlefield Aura) 도출
    let battlefieldAura = null;
    if (activeResonances.length > 0) {
      const topResonance = [...activeResonances].sort((a, b) => b.count - a.count)[0];
      battlefieldAura = {
        auraName: `${topResonance.nameKo} 전장 아우라`,
        auraColor: links.length > 0 ? links[0].color : '#10b981',
        description: topResonance.buffDescription,
        particleCount: Math.min(60, validCards.length * 10 + links.length * 5),
      };
    }

    const totalSynergyScore = activeResonances.reduce(
      (acc, r) => acc + r.statBonus.attackBonusPct + r.statBonus.hpBonusPct,
      links.length * 10
    );

    return {
      elementCounts,
      factionCounts,
      activeResonances,
      constellationLinks: links,
      totalSynergyScore,
      battlefieldAura,
    };
  }

  private getElementColor(elem: string): string {
    switch (elem) {
      case 'fire':
        return '#ef4444';
      case 'water':
        return '#3b82f6';
      case 'earth':
        return '#10b981';
      case 'wind':
        return '#06b6d4';
      case 'light':
        return '#f59e0b';
      case 'dark':
        return '#8b5cf6';
      default:
        return '#64748b';
    }
  }

  private getElementNameKo(elem: string): string {
    const map: Record<string, string> = {
      fire: '화염(Fire)',
      water: '수류(Water)',
      earth: '대지(Earth)',
      wind: '바람(Wind)',
      light: '광휘(Light)',
      dark: '암흑(Dark)',
    };
    return map[elem] || elem.toUpperCase();
  }

  private getFactionNameKo(fac: string): string {
    const map: Record<string, string> = {
      human: '인간 연합',
      elf: '엘프 왕국',
      dragon: '용족 혈맹',
      mecha: '메카 군단',
      undead: '언데드 군세',
      beast: '야수 무리',
    };
    return map[fac] || fac.toUpperCase();
  }
}
