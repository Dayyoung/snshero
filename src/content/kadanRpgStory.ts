import type { CardRarity, ItemRarity } from '../types';

export type KadanRpgNodeType = 'npc' | 'enemy' | 'chest' | 'portal' | 'story';
export type KadanRpgDifficulty = 'easy' | 'normal' | 'hard' | 'boss';

export interface KadanRpgTile {
  x: number;
  y: number;
}

export interface KadanRpgRegion {
  id: string;
  nameKey: string;
  terrain: 'snow' | 'cliff' | 'palace' | 'cave' | 'lake' | 'forest' | 'island' | 'citadel';
  width: number;
  height: number;
  startTile: KadanRpgTile;
  blockedTiles: KadanRpgTile[];
}

export interface KadanRpgReward {
  id: string;
  cardIds: number[];
  itemRarity?: ItemRarity;
  sns: number;
  titleKey: string;
}

export interface KadanRpgEncounter {
  id: string;
  opponentNameKey: string;
  opponentCardIds: number[];
  difficulty: KadanRpgDifficulty;
  firstClearRewardId: string;
  repeatRewardId?: string;
  allowLossProgress?: boolean;
}

export interface KadanRpgEvent {
  id: string;
  chapterNumber: number;
  chapterTitleKey: string;
  regionId: string;
  nodeType: KadanRpgNodeType;
  tile: KadanRpgTile;
  speakerCardId: number;
  encounterId?: string;
  rewardId?: string;
  objectiveKey: string;
  isEnding?: boolean;
}

export const KADAN_RPG_REGIONS: KadanRpgRegion[] = [
  {
    id: 'elwin-wildland',
    nameKey: 'kadan_rpg_region_elwin_wildland',
    terrain: 'snow',
    width: 10,
    height: 8,
    startTile: { x: 1, y: 5 },
    blockedTiles: [{ x: 3, y: 1 }, { x: 4, y: 1 }, { x: 7, y: 2 }, { x: 2, y: 6 }],
  },
  {
    id: 'red-cliff',
    nameKey: 'kadan_rpg_region_red_cliff',
    terrain: 'cliff',
    width: 10,
    height: 8,
    startTile: { x: 1, y: 6 },
    blockedTiles: [{ x: 5, y: 1 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 2, y: 4 }],
  },
  {
    id: 'shadow-palace',
    nameKey: 'kadan_rpg_region_shadow_palace',
    terrain: 'palace',
    width: 10,
    height: 8,
    startTile: { x: 1, y: 4 },
    blockedTiles: [{ x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 }, { x: 7, y: 5 }],
  },
  {
    id: 'mana-caves',
    nameKey: 'kadan_rpg_region_mana_caves',
    terrain: 'cave',
    width: 10,
    height: 8,
    startTile: { x: 1, y: 5 },
    blockedTiles: [{ x: 3, y: 2 }, { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 8, y: 4 }],
  },
  {
    id: 'southern-road',
    nameKey: 'kadan_rpg_region_southern_road',
    terrain: 'forest',
    width: 10,
    height: 8,
    startTile: { x: 1, y: 6 },
    blockedTiles: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 7, y: 1 }, { x: 7, y: 6 }],
  },
  {
    id: 'taiho-beastlands',
    nameKey: 'kadan_rpg_region_taiho_beastlands',
    terrain: 'lake',
    width: 10,
    height: 8,
    startTile: { x: 1, y: 5 },
    blockedTiles: [{ x: 4, y: 1 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 8, y: 5 }],
  },
  {
    id: 'wind-island',
    nameKey: 'kadan_rpg_region_wind_island',
    terrain: 'island',
    width: 10,
    height: 8,
    startTile: { x: 1, y: 5 },
    blockedTiles: [{ x: 3, y: 1 }, { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 2, y: 6 }],
  },
  {
    id: 'final-citadel',
    nameKey: 'kadan_rpg_region_final_citadel',
    terrain: 'citadel',
    width: 10,
    height: 8,
    startTile: { x: 1, y: 6 },
    blockedTiles: [{ x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 7, y: 4 }],
  },
];

const reward = (
  id: string,
  cardIds: number[],
  sns: number,
  itemRarity: ItemRarity | undefined,
  titleKey: string,
): KadanRpgReward => ({ id, cardIds, sns, itemRarity, titleKey });

export const KADAN_RPG_REWARDS: KadanRpgReward[] = [
  reward('reward-ch01', [1, 2], 20, 'normal', 'kadan_rpg_reward_ch01'),
  reward('reward-ch02', [41, 3], 25, 'normal', 'kadan_rpg_reward_ch02'),
  reward('reward-ch03', [47, 6], 35, 'magic', 'kadan_rpg_reward_ch03'),
  reward('reward-ch04', [11, 12], 35, 'magic', 'kadan_rpg_reward_ch04'),
  reward('reward-ch05', [64, 13], 40, 'magic', 'kadan_rpg_reward_ch05'),
  reward('reward-ch06', [63, 14], 45, 'magic', 'kadan_rpg_reward_ch06'),
  reward('reward-ch07', [52, 56], 55, 'rare', 'kadan_rpg_reward_ch07'),
  reward('reward-ch08', [49, 60], 80, 'rare', 'kadan_rpg_reward_ch08'),
  reward('reward-story', [41], 30, 'normal', 'kadan_rpg_reward_story'),
  reward('reward-ally', [47, 63, 64], 50, 'magic', 'kadan_rpg_reward_ally'),
  reward('reward-boss', [49, 50, 60, 100], 120, 'rare', 'kadan_rpg_reward_boss'),
  reward('reward-ending', [41, 47, 49, 60, 100], 300, 'rare', 'kadan_rpg_reward_ending'),
];

const encounter = (
  id: string,
  opponentNameKey: string,
  opponentCardIds: number[],
  difficulty: KadanRpgDifficulty,
  rewardId: string,
  allowLossProgress = false,
): KadanRpgEncounter => ({
  id,
  opponentNameKey,
  opponentCardIds,
  difficulty,
  firstClearRewardId: rewardId,
  repeatRewardId: difficulty === 'boss' ? undefined : 'reward-story',
  allowLossProgress,
});

export const KADAN_RPG_ENCOUNTERS: KadanRpgEncounter[] = [
  encounter('enc-ch01', 'kadan_rpg_opp_ch01', [51, 52, 1, 2, 43], 'easy', 'reward-ch01', true),
  encounter('enc-ch02', 'kadan_rpg_opp_ch02', [81, 82, 3, 4, 41], 'easy', 'reward-ch02', false),
  encounter('enc-ch03', 'kadan_rpg_opp_ch03', [54, 55, 6, 7, 47], 'easy', 'reward-ch03', false),
  encounter('enc-ch04', 'kadan_rpg_opp_ch04', [11, 12, 13, 91, 100], 'normal', 'reward-ch04', true),
  encounter('enc-ch05', 'kadan_rpg_opp_ch05', [12, 13, 43, 64, 45], 'normal', 'reward-ch05', false),
  encounter('enc-ch06', 'kadan_rpg_opp_ch06', [14, 15, 63, 3, 5], 'normal', 'reward-ch06', false),
  encounter('enc-ch07', 'kadan_rpg_opp_ch07', [52, 53, 54, 56, 57], 'normal', 'reward-ch07', false),
  encounter('enc-ch08', 'kadan_rpg_opp_ch08', [57, 58, 59, 60, 49], 'boss', 'reward-ch08', true),
  encounter('enc-ch09', 'kadan_rpg_opp_ch09', [41, 1, 2, 11, 47], 'normal', 'reward-story', false),
  encounter('enc-ch10', 'kadan_rpg_opp_ch10', [63, 14, 15, 64, 46], 'normal', 'reward-ally', false),
  encounter('enc-ch11', 'kadan_rpg_opp_ch11', [47, 6, 7, 54, 55], 'normal', 'reward-story', false),
  encounter('enc-ch12', 'kadan_rpg_opp_ch12', [49, 58, 59, 60, 91], 'hard', 'reward-ally', false),
  encounter('enc-ch13', 'kadan_rpg_opp_ch13', [63, 15, 16, 64, 43], 'normal', 'reward-story', false),
  encounter('enc-ch14', 'kadan_rpg_opp_ch14', [43, 12, 13, 52, 53], 'normal', 'reward-story', false),
  encounter('enc-ch15', 'kadan_rpg_opp_ch15', [52, 53, 54, 55, 56], 'hard', 'reward-ally', false),
  encounter('enc-ch16', 'kadan_rpg_opp_ch16', [43, 56, 58, 60, 91], 'boss', 'reward-boss', true),
  encounter('enc-ch17', 'kadan_rpg_opp_ch17', [46, 81, 82, 83, 84], 'hard', 'reward-story', false),
  encounter('enc-ch18', 'kadan_rpg_opp_ch18', [96, 85, 86, 87, 88], 'hard', 'reward-story', false),
  encounter('enc-ch19', 'kadan_rpg_opp_ch19', [86, 87, 88, 89, 90], 'hard', 'reward-ally', false),
  encounter('enc-ch20', 'kadan_rpg_opp_ch20', [86, 89, 90, 91, 92], 'hard', 'reward-story', false),
  encounter('enc-ch21', 'kadan_rpg_opp_ch21', [25, 26, 27, 28, 29], 'hard', 'reward-story', false),
  encounter('enc-ch22', 'kadan_rpg_opp_ch22', [69, 70, 71, 72, 73], 'hard', 'reward-ally', false),
  encounter('enc-ch23', 'kadan_rpg_opp_ch23', [63, 64, 65, 66, 67], 'hard', 'reward-story', false),
  encounter('enc-ch24', 'kadan_rpg_opp_ch24', [11, 47, 63, 91, 100], 'boss', 'reward-boss', true),
  encounter('enc-ch25', 'kadan_rpg_opp_ch25', [102, 103, 104, 105, 106], 'hard', 'reward-story', false),
  encounter('enc-ch26', 'kadan_rpg_opp_ch26', [89, 90, 91, 92, 93], 'hard', 'reward-story', false),
  encounter('enc-ch27', 'kadan_rpg_opp_ch27', [103, 104, 105, 106, 107], 'hard', 'reward-story', false),
  encounter('enc-ch28', 'kadan_rpg_opp_ch28', [11, 12, 13, 14, 15], 'hard', 'reward-ally', false),
  encounter('enc-ch29', 'kadan_rpg_opp_ch29', [107, 108, 109, 110, 50], 'boss', 'reward-story', false),
  encounter('enc-ch30', 'kadan_rpg_opp_ch30', [50, 51, 52, 53, 54], 'boss', 'reward-story', false),
  encounter('enc-ch31', 'kadan_rpg_opp_ch31', [100, 91, 92, 93, 94], 'boss', 'reward-story', false),
  encounter('enc-ch32', 'kadan_rpg_opp_ch32', [47, 48, 49, 50, 60], 'boss', 'reward-boss', true),
  encounter('enc-ch33', 'kadan_rpg_opp_ch33', [63, 64, 60, 99, 100], 'boss', 'reward-boss', true),
  encounter('enc-ch34', 'kadan_rpg_opp_ch34', [5, 6, 7, 8, 9], 'boss', 'reward-story', false),
  encounter('enc-ch35', 'kadan_rpg_opp_ch35', [5, 15, 25, 35, 45], 'boss', 'reward-ally', false),
  encounter('enc-ch36', 'kadan_rpg_opp_ch36', [11, 21, 31, 41, 51], 'boss', 'reward-story', false),
  encounter('enc-ch37', 'kadan_rpg_opp_ch37', [60, 70, 80, 90, 100], 'boss', 'reward-story', false),
  encounter('enc-ch38', 'kadan_rpg_opp_ch38', [11, 49, 60, 99, 100], 'boss', 'reward-boss', true),
  encounter('enc-ch39', 'kadan_rpg_opp_ch39', [100, 50, 60, 109, 110], 'boss', 'reward-boss', true),
  encounter('enc-ch40', 'kadan_rpg_opp_ch40', [41, 47, 49, 60, 100], 'boss', 'reward-ending', true),
  // Legacy aliases for backwards compatibility
  encounter('enc-mid', 'kadan_rpg_opp_shadow_court', [56, 58, 60, 91, 100], 'hard', 'reward-ally'),
  encounter('enc-boss', 'kadan_rpg_opp_arcane_boss', [60, 99, 100, 50, 109], 'boss', 'reward-boss', true),
  encounter('enc-ending', 'kadan_rpg_opp_final_echo', [60, 100, 109, 110, 50], 'boss', 'reward-ending', true),
];

const eventTiles: KadanRpgTile[] = [
  { x: 2, y: 5 }, { x: 4, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 3 },
  { x: 2, y: 3 }, { x: 5, y: 4 }, { x: 8, y: 5 }, { x: 8, y: 2 },
];

const chapterRegionIds = [
  'elwin-wildland', 'elwin-wildland', 'red-cliff', 'shadow-palace',
  'elwin-wildland', 'mana-caves', 'mana-caves', 'mana-caves',
  'southern-road', 'southern-road', 'southern-road', 'southern-road',
  'southern-road', 'southern-road', 'southern-road', 'southern-road',
  'taiho-beastlands', 'taiho-beastlands', 'taiho-beastlands', 'taiho-beastlands',
  'wind-island', 'wind-island', 'wind-island', 'wind-island',
  'wind-island', 'wind-island', 'wind-island', 'wind-island',
  'final-citadel', 'final-citadel', 'final-citadel', 'final-citadel',
  'final-citadel', 'final-citadel', 'final-citadel', 'final-citadel',
  'final-citadel', 'final-citadel', 'final-citadel', 'final-citadel',
];

const speakerCardIds = [
  49, 41, 47, 11, 64, 63, 52, 49, 41, 63,
  47, 49, 63, 43, 52, 43, 46, 96, 86, 86,
  25, 69, 63, 11, 102, 89, 103, 11, 107, 50,
  100, 47, 63, 5, 5, 11, 60, 11, 100, 41,
];

const nodeTypes: KadanRpgNodeType[] = [
  'enemy', 'chest', 'enemy', 'enemy', 'npc', 'npc', 'enemy', 'enemy',
  'story', 'npc', 'enemy', 'enemy', 'chest', 'enemy', 'npc', 'enemy',
  'chest', 'enemy', 'npc', 'npc', 'story', 'npc', 'npc', 'enemy',
  'chest', 'enemy', 'story', 'npc', 'chest', 'enemy', 'enemy', 'enemy',
  'enemy', 'enemy', 'npc', 'enemy', 'story', 'enemy', 'enemy', 'portal',
];

const encounterForChapter = (chapter: number): string => {
  return `enc-ch${String(chapter).padStart(2, '0')}`;
};

const rewardForChapter = (chapter: number): string | undefined => {
  if (chapter <= 8) return `reward-ch${String(chapter).padStart(2, '0')}`;
  if (chapter === 40) return 'reward-ending';
  if ([16, 24, 32, 33, 38, 39].includes(chapter)) return 'reward-boss';
  if (nodeTypes[chapter - 1] === 'npc') return 'reward-ally';
  if (nodeTypes[chapter - 1] === 'chest') return 'reward-story';
  return 'reward-story';
};

export const KADAN_RPG_EVENTS: KadanRpgEvent[] = Array.from({ length: 40 }, (_, index) => {
  const chapter = index + 1;
  return {
    id: `chapter-${String(chapter).padStart(2, '0')}`,
    chapterNumber: chapter,
    chapterTitleKey: `kadan_rpg_chapter_${String(chapter).padStart(2, '0')}`,
    regionId: chapterRegionIds[index],
    nodeType: nodeTypes[index],
    tile: eventTiles[index % eventTiles.length],
    speakerCardId: speakerCardIds[index],
    encounterId: encounterForChapter(chapter),
    rewardId: rewardForChapter(chapter),
    objectiveKey: chapter === 40 ? 'kadan_rpg_objective_ending' : 'kadan_rpg_objective_next_echo',
    isEnding: chapter === 40,
  };
});

export const getKadanRpgRegion = (regionId: string): KadanRpgRegion => (
  KADAN_RPG_REGIONS.find((region) => region.id === regionId) ?? KADAN_RPG_REGIONS[0]
);

export const getKadanRpgEvent = (eventId: string): KadanRpgEvent | undefined => (
  KADAN_RPG_EVENTS.find((event) => event.id === eventId)
);

export const getKadanRpgEncounter = (encounterId: string): KadanRpgEncounter | undefined => (
  KADAN_RPG_ENCOUNTERS.find((encounter) => encounter.id === encounterId)
);

export const getDynamicKadanEncounter = (
  event: KadanRpgEvent,
  rebirthLevel = 0,
): KadanRpgEncounter => {
  const encId = event.encounterId || `enc-ch${String(event.chapterNumber).padStart(2, '0')}`;
  const baseEncounter = getKadanRpgEncounter(encId);
  const chapter = event.chapterNumber;

  let baseDifficulty: KadanRpgDifficulty = 'normal';
  if ([8, 16, 24, 32, 33, 38, 39, 40].includes(chapter)) {
    baseDifficulty = 'boss';
  } else if (chapter <= 4) {
    baseDifficulty = 'easy';
  } else if (chapter <= 15) {
    baseDifficulty = 'normal';
  } else if (chapter <= 28) {
    baseDifficulty = 'hard';
  } else {
    baseDifficulty = 'boss';
  }

  // Rebirth Scaling
  let scaledDifficulty: KadanRpgDifficulty = baseDifficulty;
  if (rebirthLevel === 1) {
    if (baseDifficulty === 'easy') scaledDifficulty = 'normal';
    else if (baseDifficulty === 'normal') scaledDifficulty = 'hard';
    else scaledDifficulty = 'boss';
  } else if (rebirthLevel >= 2) {
    if (baseDifficulty === 'easy' || baseDifficulty === 'normal') scaledDifficulty = 'hard';
    else scaledDifficulty = 'boss';
  }

  let cards = baseEncounter?.opponentCardIds || [event.speakerCardId || 41, 1, 2, 3, 4];
  if (rebirthLevel >= 1) {
    cards = cards.map((cid, idx) => {
      if (idx === 0) return cid;
      if (rebirthLevel >= 2 && idx === 1) return 100;
      if (rebirthLevel >= 1 && idx === 2 && cid < 40) return 60;
      return cid;
    });
  }

  return {
    id: encId,
    opponentNameKey: baseEncounter?.opponentNameKey || `kadan_rpg_opp_ch${String(chapter).padStart(2, '0')}`,
    opponentCardIds: cards,
    difficulty: scaledDifficulty,
    firstClearRewardId: baseEncounter?.firstClearRewardId || event.rewardId || 'reward-story',
    repeatRewardId: scaledDifficulty === 'boss' ? undefined : 'reward-story',
    allowLossProgress: chapter <= 4 || [1, 4, 8, 16, 40].includes(chapter),
  };
};

export const getKadanRpgReward = (rewardId: string): KadanRpgReward | undefined => (
  KADAN_RPG_REWARDS.find((reward) => reward.id === rewardId)
);

export const getKadanRewardRarity = (cardId: number): CardRarity => {
  if (cardId >= 100 || [49, 50, 60, 89].includes(cardId)) return 'gold';
  if (cardId >= 46 || cardId === 6 || cardId === 7) return 'silver';
  return 'bronze';
};
