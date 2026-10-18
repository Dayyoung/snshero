import { CARD_DATABASE } from '../../cardDatabase';
import type { CardData, CardElement } from '../../types';

export type AmbushType = 'bandit' | 'thief';

export interface AmbushEncounter {
  type: AmbushType;
  name: string;
  nameEn: string;
  deck: CardData[];
  powerLevel: number;
  spoilsCoins: number;
  allowLossProgress: boolean;
  leaderCardId: number;
  dialogQuoteKo: string;
  dialogQuoteEn: string;
  difficulty?: 'normal' | 'hard';
}

export const AMBUSH_STEP_PROBABILITY = 0.14; // 14% chance per step (within 12–15% spec)
export const AMBUSH_MIN_STEP_COOLDOWN = 3;  // Minimum 3 steps cooldown between ambushes
export const AMBUSH_MAX_PER_LEG = 1;        // At most 1 ambush per chapter leg

export const BANDIT_DECK_PRESET = [82, 81, 35, 15, 85]; // Minotaur, Fenrir, Obelisk, Balrog, Byra
export const THIEF_DECK_PRESET = [54, 51, 62, 53, 57];   // Arachne, Walker, Celia, Carrion, Stone Gargoyle

/**
 * Determines whether an ambush should trigger upon taking a step.
 * 
 * Guards:
 * 1. Never trigger on destination tile (isDestinationTile === true).
 * 2. Never trigger on starting tile (isStartingTile === true).
 * 3. At most 1 ambush per chapter leg (ambushTriggeredInChapter === true).
 * 4. Minimum 3 steps cooldown between ambushes ((currentStep - lastAmbushStep) < 3).
 * 5. 14% chance per eligible step (Math.random() < 0.14 or rollVal < 0.14).
 */
export function shouldTriggerAmbush(
  currentStep: number,
  lastAmbushStep: number,
  ambushTriggeredInChapter: boolean,
  isDestinationTile: boolean,
  rollVal?: number,
  isStartingTile: boolean = false
): boolean {
  if (isDestinationTile || isStartingTile) {
    return false;
  }
  if (ambushTriggeredInChapter) {
    return false;
  }
  if (currentStep - lastAmbushStep < AMBUSH_MIN_STEP_COOLDOWN) {
    return false;
  }

  const roll = rollVal !== undefined ? rollVal : Math.random();
  return roll < AMBUSH_STEP_PROBABILITY;
}

/**
 * Generates a scaled Bandit or Thief encounter for Kadan RPG field movement.
 * 
 * @param chapterNumber Current chapter number (1 to 40)
 * @param rebirthCount Number of reincarnations/rebirths (0+)
 * @param regionId Current geographical region ID
 * @param forcedType Optional type override ('bandit' | 'thief') for testing
 */
export function generateAmbushEncounter(
  chapterNumber: number,
  rebirthCount: number = 0,
  regionId: string = 'elwin-wildland',
  forcedType?: AmbushType
): AmbushEncounter {
  const encType: AmbushType = forcedType || (Math.random() < 0.5 ? 'bandit' : 'thief');

  const cardIds = encType === 'bandit' ? BANDIT_DECK_PRESET : THIEF_DECK_PRESET;
  const leaderCardId = encType === 'bandit' ? 82 : 54;

  const nameKo = encType === 'bandit' ? '황야 산적단' : '그림자 도둑단';
  const nameEn = encType === 'bandit' ? 'Wasteland Bandits' : 'Shadow Rogues';

  const dialogQuoteKo = encType === 'bandit'
    ? '황야 산적단의 기습! "지갑과 소지품을 전부 두고 가면 목숨만은 살려주마!"'
    : '그림자 도둑단의 기습! "어둠 속에서 반짝이는 보물은 이미 우리 것이다!"';

  const dialogQuoteEn = encType === 'bandit'
    ? 'Wildland Bandit Ambush! "Hand over your pouch and gear if you value your skin!"'
    : 'Shadow Rogue Ambush! "Whatever glitters in the dark is already ours!"';

  // Power Level scaling: (100 + chapter * 12) * (1 + rebirth * 0.35)
  const basePower = 100 + chapterNumber * 12;
  const powerLevel = Math.floor(basePower * (1.0 + rebirthCount * 0.35));

  // Spoils Coins scaling: (15 + floor(chapter * 1.2)) * (1 + rebirth * 0.25)
  const baseSpoils = 15 + Math.floor(chapterNumber * 1.2);
  const spoilsCoins = Math.floor(baseSpoils * (1.0 + rebirthCount * 0.25));

  // Stat scaling: Delta = (C <= 10 ? 0 : C <= 25 ? 1 : 2) + min(3, rebirth)
  const statBonus = (chapterNumber <= 10 ? 0 : chapterNumber <= 25 ? 1 : 2) + Math.min(3, Math.max(0, Math.floor(rebirthCount)));
  const boostStat = (stat: number) => Math.max(1, Math.min(10, (stat || 1) + statBonus));

  const scaledDeck: CardData[] = cardIds.map((cardId, idx) => {
    const base = CARD_DATABASE[cardId];
    if (!base) {
      return {
        id: `ambush-fallback-${cardId}-${idx}`,
        title: 'Unknown Marauder',
        title_dis: 'Unknown Marauder',
        stats: [5, 5, 5, 5],
        rarity: 'bronze',
        power: Math.round(powerLevel / 5),
        level: 1,
        element: 'neutral' as CardElement,
      };
    }

    const scaledLevel = Math.min(10, Math.max(1, base.level + Math.floor(rebirthCount) + (chapterNumber >= 20 ? 1 : 0)));
    const scaledCardPower = Math.round(((base.power || 100) + statBonus * 22 + chapterNumber * 2) * (1 + rebirthCount * 0.2));

    const rarity = (chapterNumber >= 26 || rebirthCount >= 1)
      ? (idx === 0 ? 'gold' : 'silver')
      : (chapterNumber >= 11 ? (idx === 0 ? 'silver' : 'bronze') : 'bronze');

    return {
      id: `ambush-card-${cardId}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      title: base.title,
      title_en: base.title_en,
      title_dis: base.title,
      stats: [boostStat(base.top), boostStat(base.right), boostStat(base.bottom), boostStat(base.left)],
      element: (base.element || 'fire') as CardElement,
      rarity,
      power: scaledCardPower,
      imageIndex: base.id,
      level: scaledLevel,
    };
  });

  return {
    type: encType,
    name: nameKo,
    nameEn,
    deck: scaledDeck,
    powerLevel,
    spoilsCoins,
    allowLossProgress: true, // Safe loss guarantee
    leaderCardId,
    dialogQuoteKo,
    dialogQuoteEn,
    difficulty: chapterNumber > 25 ? 'hard' : 'normal',
  };
}
