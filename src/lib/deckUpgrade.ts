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
  newCardImageIndexes: number[],
  inventory?: Record<number, any>
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
    let power = dbCard ? dbCard.power : 0;
    if (inventory && (inventory[imgIdx] || inventory[String(imgIdx)])) {
      const invRecord = inventory[imgIdx] || inventory[String(imgIdx)];
      const level = invRecord.level || 1;
      const levelBonus = (level - 1) * 2;
      power = (dbCard ? dbCard.power : 0) + levelBonus;
    }
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

/**
 * 현재 덱 구성과 인벤토리 상태의 고유 핑거프린트(지문)를 생성합니다.
 * 카드 획득/소모/덱 변경 시 핑거프린트가 변경되어 "카드 변경 시까지 다시 보지 않기"를 감지합니다.
 */
export const getCardStateFingerprint = (
  currentDeck: (any | null)[],
  inventory: Record<number, any> = {}
): string => {
  // 1. 덱 구성 서명 (0~4번 슬롯의 카드 ID 및 레벨)
  const deckPart = (currentDeck || [])
    .map((c, idx) => `${idx}:${c?.imageIndex || 0}:${c?.level || 1}`)
    .join(',');

  // 2. 인벤토리 상태 서명 (총 보유 수량, 고유 카드 수, 최신 획득 타임스탬프)
  let totalQty = 0;
  let uniqueCount = 0;
  let latestAcquiredAt = 0;

  for (const key of Object.keys(inventory)) {
    const rec = inventory[Number(key)] || inventory[key];
    if (rec && (rec.quantity || 0) > 0) {
      uniqueCount++;
      totalQty += rec.quantity || 0;
      if (rec.acquiredAt && rec.acquiredAt > latestAcquiredAt) {
        latestAcquiredAt = rec.acquiredAt;
      }
    }
  }

  return `deck:[${deckPart}]_inv:[${uniqueCount}-${totalQty}-${latestAcquiredAt}]`;
};
