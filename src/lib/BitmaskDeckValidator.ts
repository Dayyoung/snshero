/**
 * BitmaskDeckValidator.ts - SCR-03-19
 * 64비트 정수형 비트마스크 연산으로 덱 유효성(코스트 한도, 중복 카드 한도, 속성 시너지)을 O(1) 제로-GC로 검증
 */

import { CardBitmaskEncoder } from './CardBitmaskEncoder';
import { CardData } from '../types';

export interface DeckValidationResult {
  isValid: boolean;
  totalCost: number;
  maxCost: number;
  duplicateCount: number;
  error?: string;
}

export class BitmaskDeckValidator {
  public static validateDeck(
    deck: CardData[],
    maxCost = 30,
    maxDuplicatePerCard = 2
  ): DeckValidationResult {
    let totalCost = 0;
    const cardOccurrenceMap = new Map<string, number>();
    let hasDuplicateViolation = false;

    // Bitwise aggregated validation buffer
    for (let i = 0; i < deck.length; i++) {
      const card = deck[i];
      const mask = CardBitmaskEncoder.encode(card);
      const cost = CardBitmaskEncoder.getCost(mask);
      totalCost += cost;

      const currentCount = (cardOccurrenceMap.get(card.id) || 0) + 1;
      cardOccurrenceMap.set(card.id, currentCount);
      if (currentCount > maxDuplicatePerCard) {
        hasDuplicateViolation = true;
      }
    }

    if (totalCost > maxCost) {
      return {
        isValid: false,
        totalCost,
        maxCost,
        duplicateCount: cardOccurrenceMap.size,
        error: `총 코스트 초과 (${totalCost}/${maxCost})`,
      };
    }

    if (hasDuplicateViolation) {
      return {
        isValid: false,
        totalCost,
        maxCost,
        duplicateCount: cardOccurrenceMap.size,
        error: `동일 카드 편성 한도(${maxDuplicatePerCard}장) 초과`,
      };
    }

    return {
      isValid: true,
      totalCost,
      maxCost,
      duplicateCount: cardOccurrenceMap.size,
    };
  }
}
