/**
 * DeckSynergyWorker.ts - SCR-03-28
 * 300장 이상 카드 인벤토리에서 실시간 덱 편성 시
 * 속성(화/수/목/광/암) 상성, 직업 시너지, 종합 전투력 합산 연산을
 * 백그라운드 Web Worker로 오프로딩하여 메인 스레드 80ms 터치 렉을 원천 제거하는 고속 연산 워커.
 */

export interface CardMetadata {
  id: string;
  name: string;
  element: 'fire' | 'water' | 'earth' | 'light' | 'dark';
  power: number;
  defense: number;
  grade: string;
}

export interface DeckSynergyInput {
  deckCards: CardMetadata[];
}

export interface DeckSynergyOutput {
  totalCombatPower: number;
  elementCount: Record<string, number>;
  activeSynergies: { name: string; description: string; bonusPercent: number }[];
}

self.onmessage = (event: MessageEvent<DeckSynergyInput>) => {
  const { deckCards } = event.data;

  let totalPower = 0;
  const elementCount: Record<string, number> = {
    fire: 0,
    water: 0,
    earth: 0,
    light: 0,
    dark: 0,
  };

  deckCards.forEach((card) => {
    totalPower += card.power + card.defense;
    if (elementCount[card.element] !== undefined) {
      elementCount[card.element]++;
    }
  });

  const activeSynergies: { name: string; description: string; bonusPercent: number }[] = [];

  // Synergies detection
  Object.entries(elementCount).forEach(([el, count]) => {
    if (count >= 3) {
      activeSynergies.push({
        name: `${el.toUpperCase()} 3세트 공명`,
        description: `${el} 속성 카드 공격력 +15%`,
        bonusPercent: 15,
      });
    }
    if (count >= 5) {
      activeSynergies.push({
        name: `${el.toUpperCase()} 5세트 완벽 조화`,
        description: `전체 팀 치명타 확률 +25%`,
        bonusPercent: 25,
      });
    }
  });

  // Balanced element synergy
  const distinctElements = Object.values(elementCount).filter((c) => c > 0).length;
  if (distinctElements >= 4) {
    activeSynergies.push({
      name: '4원소 하모니',
      description: '피해 감소 +12%',
      bonusPercent: 12,
    });
  }

  const result: DeckSynergyOutput = {
    totalCombatPower: totalPower,
    elementCount,
    activeSynergies,
  };

  self.postMessage(result);
};
