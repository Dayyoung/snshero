import { CardData, Skill } from './types';
import { CARD_DATABASE } from './cardDatabase';

export const ADMINS = ['dryudryu@gmail.com'];

export const INITIAL_SKILLS: Skill[] = [
  {
    id: 'power_boost',
    name: 'Power Boost',
    name_en: 'Power Boost',
    description: '카드가 덱에 있을 때 현재 파워에 N% 증가된 데미지 상승 (후광 효과)',
    description_en: 'Increases damage by N% when in deck. (Halo effect)',
    icon: 'Zap',
    level: 0,
    maxLevel: 5,
    requiredLevel: 0,
    effect: { type: 'power', value: 0.05 }
  },
  {
    id: 'atk_up',
    name: 'ATTACK UP',
    name_en: 'ATTACK UP',
    description: '카드 북쪽 포인트를 N 증가 (덱 위에 있을 때 북쪽 포인트 후광 효과)',
    description_en: 'Increases North point by N. (Halo effect on North border)',
    icon: 'ArrowUp',
    level: 0,
    maxLevel: 5,
    requiredLevel: 5,
    effect: { type: 'stat_0', value: 1 }
  },
  {
    id: 'atk_down',
    name: 'ATTACK DOWN',
    name_en: 'ATTACK DOWN',
    description: '카드 남쪽 포인트를 N 증가 (덱 위에 있을 때 남쪽 포인트 후광 효과)',
    description_en: 'Increases South point by N. (Halo effect on South border)',
    icon: 'ArrowDown',
    level: 0,
    maxLevel: 5,
    requiredLevel: 5,
    effect: { type: 'stat_2', value: 1 }
  },
  {
    id: 'def_up',
    name: 'DEFENSE LEFT',
    name_en: 'DEFENSE LEFT',
    description: '카드 좌측 포인트를 N 증가 (덱 위에 있을 때 좌측 포인트 후광 효과)',
    description_en: 'Increases Left point by N. (Halo effect on Left border)',
    icon: 'ArrowLeft',
    level: 0,
    maxLevel: 5,
    requiredLevel: 5,
    effect: { type: 'stat_3', value: 1 }
  },
  {
    id: 'def_down',
    name: 'DEFENSE RIGHT',
    name_en: 'DEFENSE RIGHT',
    description: '카드 우측 포인트를 N 증가 (덱 위에 있을 때 우측 포인트 후광 효과)',
    description_en: 'Increases Right point by N. (Halo effect on Right border)',
    icon: 'ArrowRight',
    level: 0,
    maxLevel: 5,
    requiredLevel: 5,
    effect: { type: 'stat_1', value: 1 }
  },
  {
    id: 'lucky_draw',
    name: 'LUCKY DRAW',
    name_en: 'LUCKY DRAW',
    description: '전투 승리 시 아이템 획득 확률 N% 증가 (매직찬스 증가량 표시)',
    description_en: 'Increases item drop chance by N% on victory.',
    icon: 'Gift',
    level: 0,
    maxLevel: 5,
    requiredLevel: 10,
    effect: { type: 'special', value: 0.05 }
  }
];

export const getSkillTier = (totalLevel: number) => {
  const tier = Math.floor(totalLevel / 6) + 1;
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return romans[tier - 1] || tier.toString();
};

export const getRequiredLevelForSkill = (skillId: string, currentTotalLevel: number) => {
  const baseSkill = INITIAL_SKILLS.find(s => s.id === skillId);
  if (!baseSkill) return 0;
  
  const currentTier = Math.floor(currentTotalLevel / 6) + 1;
  // Level requirement doubles per tier shift
  return baseSkill.requiredLevel * Math.pow(2, currentTier - 1);
};

export const getSkillPointBonus = (card: CardData): number => {
  if (!card.skills) return 0;
  const bonus = card.skills.reduce((sum, skill) => {
    if (skill.level > 0) {
      if (skill.effect.type.startsWith('stat_')) {
        return sum + (Math.floor(skill.level / 5) * skill.effect.value);
      }
      // If there are other flat power bonuses (non-percentage), we could add them here.
      // But for now, we follow the user's lead.
    }
    return sum;
  }, 0);
  return Math.round(bonus);
};

export const getPowerMultiplier = (card: CardData): number => {
  if (!card.skills) return 1;
  const multiplierBonus = card.skills.reduce((acc, skill) => {
    if (skill.level > 0 && skill.id === 'power_boost') {
      const effectValue = skill.effect.value; // e.g., 0.05 (5%)
      return acc + (Math.floor(skill.level / 5) * effectValue);
    }
    return acc;
  }, 0);
  return 1 + multiplierBonus;
};

export const getCardPower = (card: CardData): number => {
  const n = getCardStatWithBonus(card, 0);
  const e = getCardStatWithBonus(card, 1);
  const s = getCardStatWithBonus(card, 2);
  const w = getCardStatWithBonus(card, 3);
  return n + e + s + w;
};

export const getNormalizedElement = (card: CardData): string | null => {
  let el = card.element || card.race;
  if (!el && card.title_en) {
    const titleEn = card.title_en;
    if (titleEn.startsWith('Water')) return 'water';
    if (titleEn.startsWith('Fire')) return 'fire';
    if (titleEn.startsWith('Wind')) return 'wind';
    if (titleEn.startsWith('Land')) return 'land';
    if (titleEn.startsWith('Human')) return 'human';
    if (titleEn.startsWith('Undead')) return 'undead';
    if (titleEn.startsWith('Elf')) return 'elf';
    if (titleEn.startsWith('Dwarf')) return 'dwarf';
    if (titleEn.startsWith('Monster')) return 'monster';
    if (titleEn.startsWith('Robot')) return 'robot';
    if (titleEn.startsWith('Dragon')) return 'dragon';
  }
  if (!el) return null;
  el = el.toLowerCase();
  if (el === 'air') return 'wind';
  if (el === 'earth') return 'land';
  return el;
};

export const getCardStatWithBonus = (card: CardData, statIndex: number, cellElement?: string | null): number => {
  let baseStat = card.stats[statIndex];
  
  // Guild Stat Bonus (1 to 10)
  if (typeof window !== 'undefined') {
    const savedLevelStr = localStorage.getItem('hero_user_guild_level');
    if (savedLevelStr) {
      const gLevel = parseInt(savedLevelStr, 10);
      if (!isNaN(gLevel) && gLevel >= 1 && gLevel <= 10) {
        baseStat += gLevel;
      }
    }
  }
  
  // Elemental Tile Bonus (+1 if matches, -1 if different)
  if (cellElement) {
    const cardEl = getNormalizedElement(card);
    if (cardEl) {
      const normalizedCell = cellElement === 'air' ? 'wind' : cellElement === 'earth' ? 'land' : cellElement;
      if (cardEl === normalizedCell) {
        baseStat += 1;
      } else {
        baseStat = Math.max(1, baseStat - 1);
      }
    }
  }

    // Equipment Bonus
  if (card.equipment) {
    Object.values(card.equipment).forEach(item => {
      if (item && item.stats && typeof item.stats[statIndex] === 'number') {
        baseStat += item.stats[statIndex];
      }
    });
  }

  if (!card.skills) return baseStat;
  
  const skillType = `stat_${statIndex}`;
  const skillBonus = card.skills
    .filter(s => s.effect.type === skillType)
    .reduce((sum, s) => sum + (Math.floor(s.level / 5) * s.effect.value), 0);
    
  return baseStat + skillBonus;
};

export const syncCardWithDatabase = (card: CardData, inventory?: Record<number, any>): CardData => {
  const lookupKey = card.imageIndex !== undefined ? Number(card.imageIndex) : undefined;
  if (lookupKey === undefined || !CARD_DATABASE[lookupKey]) return card;
  
  const dbData = CARD_DATABASE[lookupKey];
  const invData = inventory ? inventory[lookupKey] : null;

  return {
    ...card,
    imageIndex: lookupKey,
    title: dbData.title,
    title_dis: dbData.title_dis,
    title_en: dbData.title_en,
    stats: [...dbData.stats],
    rarity: dbData.rarity,
    ability: dbData.ability,
    imageUrl: dbData.imageUrl,
    level: invData?.level !== undefined ? invData.level : (card.level !== undefined ? card.level : 1),
    exp: card.exp !== undefined ? card.exp : 0,
    skills: (() => {
      const existingSkills = invData?.skills || card.skills || [];
      return INITIAL_SKILLS.map(initSkill => {
        const found = existingSkills.find((es: any) => es.id === initSkill.id);
        return found ? { ...initSkill, level: found.level } : { ...initSkill };
      });
    })(),
    equipment: invData?.equipment || card.equipment || {},
    power: getCardPower({
      ...card,
      skills: invData?.skills || card.skills,
      equipment: invData?.equipment || card.equipment
    })
  };
};

export const INITIAL_CARDS: CardData[] = [1, 11, 21, 31, 41].map((idx, i) => {
  const dbCard = CARD_DATABASE[idx];
  return {
    id: `init-${idx}-${i}-${Math.random().toString(36).substring(2, 5)}`,
    title: dbCard.title,
    title_dis: dbCard.title_dis,
    title_en: dbCard.title_en,
    stats: [...dbCard.stats],
    rarity: dbCard.rarity,
    owner: null,
    level: 1,
    imageIndex: idx,
    skills: [...INITIAL_SKILLS.map(s => ({ ...s }))]
  };
});

export const generateCard = (rarity?: CardData['rarity']): CardData => {
  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  let selectedIdx: number;

  if (rarity) {
    const possibleIndices = Object.keys(CARD_DATABASE)
      .map(Number)
      .filter(idx => CARD_DATABASE[idx].rarity === rarity);
    
    selectedIdx = possibleIndices.length > 0 
      ? possibleIndices[Math.floor(Math.random() * possibleIndices.length)]
      : Math.floor(Math.random() * 110) + 1;
  } else {
    const allIndices = Object.keys(CARD_DATABASE).map(Number);
    selectedIdx = allIndices[Math.floor(Math.random() * allIndices.length)];
  }

  const dbCard = CARD_DATABASE[selectedIdx];
  return {
    id,
    title: dbCard.title,
    title_dis: dbCard.title_dis,
    title_en: dbCard.title_en,
    stats: [...dbCard.stats],
    rarity: dbCard.rarity,
    owner: null,
    level: 1,
    imageIndex: selectedIdx,
    ability: dbCard.ability,
    element: dbCard.element,
    skills: [...INITIAL_SKILLS.map(s => ({ ...s }))]
  };
};

export const generateUniqueDeck = (count: number = 5): CardData[] => {
  const safeCount = Math.min(Math.max(1, count > 50 ? 5 : count), 10);
  const allIndices = Object.keys(CARD_DATABASE).map(Number);
  const deck: CardData[] = [];
  const selectedIndices = new Set<number>();

  while (deck.length < safeCount && selectedIndices.size < allIndices.length) {
    const idx = allIndices[Math.floor(Math.random() * allIndices.length)];
    if (!selectedIndices.has(idx)) {
      selectedIndices.add(idx);
      const card = generateCard();
      card.imageIndex = idx;
      // Re-sync with DB to ensure stats match the new index
      const dbCard = CARD_DATABASE[idx];
      card.title_dis = dbCard.title_dis;
      card.title_en = dbCard.title_en;
      card.stats = [...dbCard.stats];
      card.rarity = dbCard.rarity;
      card.ability = dbCard.ability;
      card.element = dbCard.element;
      card.level = 1;
      deck.push(card);
    }
  }
  return deck;
};

/**
 * 상대편/AI 덱에서 동일한 카드(imageIndex/id)가 중복되지 않도록 100% 보장하는 헬퍼 함수.
 * 중복된 카드가 있거나 카드가 부족한 경우, 아직 덱에 없는 다른 고유한 카드로 자동 교체합니다.
 */
export const ensureUniqueDeck = (deck: CardData[] = [], targetCount: number = 5): CardData[] => {
  const allIndices = Object.keys(CARD_DATABASE).map(Number);
  const usedIndices = new Set<number>();
  const uniqueDeck: CardData[] = [];

  // 1. First pass: keep unique, valid cards
  for (const card of deck) {
    if (!card) continue;
    const idx = card.imageIndex !== undefined ? card.imageIndex : (typeof card.id === 'number' ? card.id : null);
    
    if (idx !== null && !usedIndices.has(idx) && CARD_DATABASE[idx]) {
      usedIndices.add(idx);
      uniqueDeck.push({ ...card, imageIndex: idx });
    }
    if (uniqueDeck.length >= targetCount) break;
  }

  // 2. Second pass: shuffle remaining available indices to fill missing slots
  const availableIndices = allIndices.filter(i => !usedIndices.has(i));
  for (let i = availableIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
  }

  while (uniqueDeck.length < targetCount && availableIndices.length > 0) {
    const newIdx = availableIndices.pop()!;
    usedIndices.add(newIdx);
    const dbCard = CARD_DATABASE[newIdx];
    const newCard: CardData = syncCardWithDatabase({
      id: `unique-opp-card-${newIdx}-${Date.now()}-${uniqueDeck.length}-${Math.random().toString(36).substring(2, 5)}`,
      imageIndex: newIdx,
      title: dbCard.title,
      title_dis: dbCard.title_dis,
      title_en: dbCard.title_en,
      power: dbCard.power,
      rarity: dbCard.rarity || 'bronze',
      owner: 'ai',
      stats: [...dbCard.stats],
      ability: dbCard.ability,
      element: dbCard.element,
      skills: INITIAL_SKILLS.map(s => ({ ...s, level: 0 })),
      equipment: {},
      bonusPower: 0,
      exp: 0,
      level: 1
    });
    uniqueDeck.push(newCard);
  }

  return uniqueDeck.slice(0, targetCount);
};

export const AI_NAMES = {
  prefixes: [
    'Alpha', 'Beta', 'Gamma', 'Delta', 'Zero', 'Null', 'Neo', 'Cyber', 'Bio', 'Nano', 
    'Void', 'Star', 'Zen', 'Iron', 'Steel', 'Titan', 'Apex', 'Core', 'Link', 'Flux',
    'Quantum', 'Aether', 'Vector', 'Prime', 'Omni', 'Macro', 'Micro', 'Ultra', 'Giga', 'Tera'
  ],
  suffixes: [
    'One', 'Prime', 'Core', 'Unit', 'Bot', 'Drone', 'Mech', 'Cypher', 'Node', 'Void',
    'Link', 'Grid', 'Gate', 'Path', 'Shift', 'Pulse', 'Scan', 'Sync', 'Ray', 'Spark',
    'Helix', 'Matrix', 'Engine', 'System', 'Protocol', 'Drive', 'Shell', 'Kernel', 'Daemon', 'Ghost'
  ],
  categories: {
    military: ['T-800', 'Sentinel', 'Vanguard', 'Enforcer', 'Goliath', 'Interceptor', 'Slayer', 'Wraith', 'Warmonger', 'Aegis', 'Phalanx', 'Oni', 'Reaper', 'Specter'],
    cyberpunk: ['Case', 'Molly', 'Deckard', 'Batty', 'Pris', 'Major', 'Batou', 'LaughingMan', 'Armitage', 'Wintermute', 'Neuromancer', 'Hiro', 'Raven', 'Arisaka'],
    classic: ['HAL-9000', 'Gort', 'Maria', 'R2-D2', 'C-3PO', 'Data', 'Ash', 'Bishop', 'Robby', 'Optimus', 'Megatron', 'Wall-E', 'Eve', 'Marvin'],
    abstract: ['Oracle', 'Architect', 'Prophet', 'Siren', 'Echo', 'Mnemosyne', 'Lethe', 'Tartarus', 'Chimera', 'Hydra', 'Phoenix', 'Icarus', 'Daedalus', 'Styx']
  }
};

export const generateAiName = (seed?: string): string => {
  const random = seed ? 
    seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 
    Math.floor(Math.random() * 1000000);
  
  const type = random % 5;
  
  if (type === 0) {
    // Prefix + Suffix
    const p = AI_NAMES.prefixes[random % AI_NAMES.prefixes.length];
    const s = AI_NAMES.suffixes[(random + 7) % AI_NAMES.suffixes.length];
    return `${p}-${s}`;
  } else if (type === 1) {
    // Model style
    const p = AI_NAMES.prefixes[random % AI_NAMES.prefixes.length];
    const num = (random % 900) + 100;
    return `${p.toUpperCase()}_${num}`;
  } else if (type === 2) {
    // Hex style
    const hex = (random % 65535).toString(16).toUpperCase().padStart(4, '0');
    const p = AI_NAMES.prefixes[random % AI_NAMES.prefixes.length];
    return `${p}_0x${hex}`;
  } else {
    // Category style
    const cats = Object.values(AI_NAMES.categories);
    const cat = cats[random % cats.length];
    const name = cat[(random + 13) % cat.length];
    return name;
  }
};

