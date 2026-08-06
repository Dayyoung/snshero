import { CARD_DATABASE } from '../cardDatabase';

interface UpgradeMapping {
  idx: number; // Index in currentDeck (0 to 4)
  imgIdx: number; // Candidate card's imageIndex to be placed
}

// 헬퍼: 현재 카드 정보로부터 파워 계산
const getCardPower = (card: any): number => {
  if (!card) return 0;
  // If card has explicit power, use it, else fallback to database power
  if (card.power !== undefined) return card.power;
  const dbCard = CARD_DATABASE[card.imageIndex || 0];
  return dbCard ? dbCard.power : 0;
};

/**
 * 새로 획득한 카드들(newCardImageIndexes) 중 현재 카드 덱(currentDeck)에 있는 카드보다
 * 파워가 높은 카드가 있을 경우, 덱 업그레이드 매핑 배열을 반환합니다.
 */
export const getDeckUpgradeRecommendation = (
  currentDeck: (any | null)[],
  newCardImageIndexes: number[]
): UpgradeMapping[] => {
  if (!newCardImageIndexes || newCardImageIndexes.length === 0) return [];

  // 1. 현재 덱 카드 파워 수집 (빈 슬롯은 파워 0)
  const deckWithPower = currentDeck.map((card, idx) => {
    const imgIdx = card?.imageIndex || 0;
    const power = imgIdx ? getCardPower(card) : 0;
    return { idx, imgIdx, power };
  });

  // 2. 이미 덱에 포함된 카드는 제외 (중복 방지)
  const currentDeckImageIndexes = currentDeck.map(c => c?.imageIndex).filter(Boolean);
  const candidateImageIndexes = Array.from(new Set(newCardImageIndexes))
    .filter(imgIdx => !currentDeckImageIndexes.includes(imgIdx));

  if (candidateImageIndexes.length === 0) return [];

  // 후보 카드들을 기본 파워 내림차순 정렬
  const candidatesWithPower = candidateImageIndexes.map(imgIdx => {
    const dbCard = CARD_DATABASE[imgIdx];
    const power = dbCard ? dbCard.power : 0;
    return { imgIdx, power };
  }).sort((a, b) => b.power - a.power);

  // 3. 현재 덱 카드들을 파워 오름차순 정렬 (약한 것부터 교체하기 위함)
  const sortedDeck = [...deckWithPower].sort((a, b) => a.power - b.power);

  // 4. 업그레이드 시뮬레이션
  const upgradedCardsToApply: UpgradeMapping[] = [];
  const simulatedDeckPowerList = [...sortedDeck];

  for (const candidate of candidatesWithPower) {
    // 가장 약한 카드 정렬
    simulatedDeckPowerList.sort((a, b) => a.power - b.power);
    const weakest = simulatedDeckPowerList[0];

    // 후보 파워가 가장 약한 카드 파워보다 세다면 대체
    if (candidate.power > weakest.power) {
      weakest.power = candidate.power;
      weakest.imgIdx = candidate.imgIdx;
      upgradedCardsToApply.push({ idx: weakest.idx, imgIdx: candidate.imgIdx });
    }
  }

  return upgradedCardsToApply;
};
