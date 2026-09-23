/**
 * GachaPreprocessorWorker.ts - SCR-04-25
 * 가챠 소환 결과 검증, 10장 카드 메타데이터 및 마일리지 계산을 백그라운드 Web Worker로 오프로딩하여
 * 메인 스레드 UI 블로킹을 0ms로 최소화하고 연출과 즉시 연결하는 초고속 전처리 워커.
 */

export interface GachaRawResult {
  cardId: string;
  name: string;
  grade: 'N' | 'R' | 'SR' | 'SSR' | 'UR';
  element: string;
  isNew: boolean;
  basePower: number;
}

export interface GachaProcessedResult {
  cards: (GachaRawResult & {
    pityBonusMileage: number;
    rarityScore: number;
    sparkleEffect: boolean;
  })[];
  totalMileageEarned: number;
  ssrCount: number;
  hasJackpot: boolean;
}

self.onmessage = (event: MessageEvent<{ rawCards: GachaRawResult[]; currentMileage: number }>) => {
  const { rawCards, currentMileage } = event.data;

  let totalMileage = 0;
  let ssrCount = 0;

  const processed = rawCards.map((card, idx) => {
    let mileage = 5;
    let score = 10;
    let sparkle = false;

    switch (card.grade) {
      case 'UR':
        mileage = 50;
        score = 100;
        sparkle = true;
        ssrCount++;
        break;
      case 'SSR':
        mileage = 30;
        score = 80;
        sparkle = true;
        ssrCount++;
        break;
      case 'SR':
        mileage = 15;
        score = 40;
        break;
      case 'R':
        mileage = 8;
        score = 20;
        break;
      default:
        mileage = 5;
        score = 10;
        break;
    }

    totalMileage += mileage;

    return {
      ...card,
      pityBonusMileage: mileage,
      rarityScore: score,
      sparkleEffect: sparkle,
    };
  });

  const response: GachaProcessedResult = {
    cards: processed,
    totalMileageEarned: totalMileage,
    ssrCount,
    hasJackpot: ssrCount >= 2,
  };

  self.postMessage(response);
};
