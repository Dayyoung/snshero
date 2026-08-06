import { Item, EquipmentSlot, ItemRarity } from '../types';

const SLOTS: EquipmentSlot[] = ['necklace', 'ring1', 'boots', 'ring2'];

const PREFIXES = {
  normal: ['Crude', 'Rusty', 'Old', 'Simple', 'Heavy'],
  magic: ['Shining', 'Ancient', 'Sturdy', 'Cursed', 'Ethereal'],
  rare: ['Godly', 'Legendary', 'Immortal', 'Dragon-slayer', 'Soul-eater']
};

const NAMES: Record<EquipmentSlot, string[]> = {
  boots: ['Sandals', 'Boots', 'Heavy Boots', 'War Boots'],
  ring1: ['Band', 'Loop', 'Circle', 'Signet'],
  ring2: ['Band', 'Loop', 'Circle', 'Signet'],
  necklace: ['Amulet', 'Talisman', 'Scarab', 'Beads']
};

const SUFFIXES = {
  normal: ['of the Rat', 'of Need'],
  magic: ['of the Wolf', 'of Harmony', 'of the Stars'],
  rare: ['of the Phoenix', 'of Infinity', 'of the Gods', 'of Annihilation']
};

function getRandomStat(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const generateRandomItem = (rarity?: ItemRarity): Item => {
  const r = rarity || (Math.random() > 0.9 ? 'rare' : Math.random() > 0.7 ? 'magic' : 'normal');
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  
  const prefix = PREFIXES[r][Math.floor(Math.random() * PREFIXES[r].length)];
  const baseName = NAMES[slot][Math.floor(Math.random() * NAMES[slot].length)];
  const suffix = SUFFIXES[r][Math.floor(Math.random() * SUFFIXES[r].length)];
  
  const name = `${prefix} ${baseName} ${suffix}`;
  
  let stats: [number, number, number, number] = [0, 0, 0, 0];
  
  if (r === 'normal') {
      stats[Math.floor(Math.random() * 4)] = getRandomStat(1, 2);
  } else if (r === 'magic') {
      let d1 = Math.floor(Math.random() * 4);
      let d2 = (d1 + 1 + Math.floor(Math.random() * 3)) % 4;
      stats[d1] = getRandomStat(2, 4);
      stats[d2] = getRandomStat(-1, 2);
  } else {
      for (let i = 0; i < 4; i++) {
          stats[i] = getRandomStat(-1, 5);
      }
      stats[Math.floor(Math.random() * 4)] = 6;
  }
  
  return {
    id: Math.random().toString(36).substring(2, 11),
    name_en: name,
    name_ko: name, // or translate logic if available, but it's random
    slot,
    rarity: r,
    stats,
    description_en: `A powerful ${slot} used by heroes of old.`,
    description_ko: `고대의 영웅들이 사용하던 강력한 ${slot}입니다.`,
    equippedToId: null
  };
};
