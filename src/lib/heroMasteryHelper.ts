import { HeroMasteryRecord } from '../types';

const MASTERY_STORAGE_PREFIX = 'hero_mastery_record_';

export const getHeroMastery = (cardId: number): HeroMasteryRecord => {
  try {
    const raw = localStorage.getItem(`${MASTERY_STORAGE_PREFIX}${cardId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load hero mastery:', e);
  }
  return {
    cardId,
    battleCount: 0,
    winCount: 0,
    goldenMasteryUnlocked: false,
    commanderVoiceUnlocked: false,
  };
};

export const recordHeroBattleResult = (
  cardIds: number[],
  isVictory: boolean
): { newlyUnlockedGolden: number[]; newlyUnlockedCommander: number[] } => {
  const newlyUnlockedGolden: number[] = [];
  const newlyUnlockedCommander: number[] = [];

  cardIds.forEach(id => {
    const record = getHeroMastery(id);
    record.battleCount += 1;
    if (isVictory) {
      record.winCount += 1;
    }

    // 50 Wins -> Golden Mastery Skin
    if (record.winCount >= 50 && !record.goldenMasteryUnlocked) {
      record.goldenMasteryUnlocked = true;
      newlyUnlockedGolden.push(id);
    }

    // 100 Battles -> Commander Voice & Badge
    if (record.battleCount >= 100 && !record.commanderVoiceUnlocked) {
      record.commanderVoiceUnlocked = true;
      newlyUnlockedCommander.push(id);
    }

    try {
      localStorage.setItem(`${MASTERY_STORAGE_PREFIX}${id}`, JSON.stringify(record));
    } catch (e) {
      console.error('Failed to save hero mastery:', e);
    }
  });

  return { newlyUnlockedGolden, newlyUnlockedCommander };
};
