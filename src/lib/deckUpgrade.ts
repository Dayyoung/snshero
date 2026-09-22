import { CardData, InventoryRecord } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { getCardPower } from '../constants';

export interface UpgradedCardSlot {
  idx: number;
  imgIdx: number;
}

/**
 * Returns a unique fingerprint representing the deck and card state in inventory
 */
export function getCardStateFingerprint(
  deck: CardData[],
  inventory: Record<string | number, InventoryRecord>
): string {
  if (!deck || !Array.isArray(deck)) return '';
  return deck
    .map((card, i) => {
      if (!card) return `${i}:none`;
      const imgIdx = card.imageIndex ?? 0;
      const qty = inventory[imgIdx]?.quantity || inventory[String(imgIdx)]?.quantity || 0;
      const enhancements = inventory[imgIdx]?.enhancements || inventory[String(imgIdx)]?.enhancements || 0;
      return `${i}:${imgIdx}:${qty}:${enhancements}`;
    })
    .join('|');
}

/**
 * Recommends card upgrades for the current deck based on owned cards
 */
export function getDeckUpgradeRecommendation(
  currentDeck: CardData[],
  ownedImageIndexes: number[],
  inventory: Record<string | number, InventoryRecord>
): UpgradedCardSlot[] {
  if (!currentDeck || currentDeck.length === 0 || !ownedImageIndexes || ownedImageIndexes.length === 0) {
    return [];
  }

  const recommendations: UpgradedCardSlot[] = [];
  const deckImageIndexes = new Set(currentDeck.map((c) => c?.imageIndex).filter(Boolean));

  // Find candidate cards not in current deck
  const candidateCards = ownedImageIndexes
    .filter((idx) => !deckImageIndexes.has(idx) && CARD_DATABASE[idx])
    .map((idx) => {
      const card = CARD_DATABASE[idx];
      const power = getCardPower(card, inventory);
      return { idx, power };
    })
    .sort((a, b) => b.power - a.power);

  if (candidateCards.length === 0) return [];

  // Check each slot in current deck for potential improvement
  const candidateQueue = [...candidateCards];
  for (let slotIdx = 0; slotIdx < currentDeck.length; slotIdx++) {
    const currentCard = currentDeck[slotIdx];
    if (!currentCard) continue;

    const currentPower = getCardPower(currentCard, inventory);
    const bestCandidate = candidateQueue[0];

    if (bestCandidate && bestCandidate.power > currentPower + 50) {
      recommendations.push({
        idx: slotIdx,
        imgIdx: bestCandidate.idx,
      });
      candidateQueue.shift();
    }
  }

  return recommendations;
}
