/**
 * CardBitmaskEncoder.ts - SCR-03-19
 * 카드 스펙(코스트, 속성, 종족, 등급)을 64비트 BigInt 비트마스크로 인코딩하는 초고속 인코더
 */

import { CardData } from '../types';

export class CardBitmaskEncoder {
  // Bits: [0-7: Cost] [8-15: Element] [16-23: Rarity] [24-31: Attack] [32-63: Unique ID Hash]
  public static encode(card: CardData): bigint {
    const anyCard = card as unknown as { cost?: number; element?: string; rarity?: string; attack?: number };
    const computedCost = anyCard.cost ?? (card.stats ? Math.floor(card.stats.reduce((a, b) => a + b, 0) / 4) : 1);
    const cost = BigInt(Math.min(255, Math.max(0, computedCost)));
    const element = BigInt(anyCard.element ? anyCard.element.charCodeAt(0) % 256 : 0);
    const rarity = BigInt(anyCard.rarity === 'SSR' ? 4 : anyCard.rarity === 'SR' ? 3 : anyCard.rarity === 'R' ? 2 : 1);
    const attack = BigInt(Math.min(255, Math.max(0, anyCard.attack ?? (card.stats ? card.stats[0] : 0))));
    const idHash = BigInt(Math.abs(card.id ? card.id.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0) : 0));

    return (idHash << 32n) | (attack << 24n) | (rarity << 16n) | (element << 8n) | cost;
  }

  public static getCost(mask: bigint): number {
    return Number(mask & 0xffn);
  }

  public static getElement(mask: bigint): number {
    return Number((mask >> 8n) & 0xffn);
  }

  public static getRarity(mask: bigint): number {
    return Number((mask >> 16n) & 0xffn);
  }
}
