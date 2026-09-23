import { ITEM_DATABASE } from '../constants/itemDatabase';

export function generateRandomItem(): any {
  if (ITEM_DATABASE && ITEM_DATABASE.length > 0) {
    const idx = Math.floor(Math.random() * ITEM_DATABASE.length);
    return { ...ITEM_DATABASE[idx], uniqueId: Date.now() + Math.random().toString(36).substring(2) };
  }
  return {
    id: 'potion_hp',
    name: '체력 물약',
    description: '체력을 50 회복합니다.',
    type: 'consumable',
    rarity: 'common',
    uniqueId: Date.now().toString(),
  };
}

export default { generateRandomItem };
