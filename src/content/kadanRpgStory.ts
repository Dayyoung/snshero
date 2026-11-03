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

export interface KadanRpgChapterTitle {
  chapter: number;
  titleKo: string;
  titleEn: string;
}

export const chapterTitles: KadanRpgChapterTitle[] = [
  { chapter: 1, titleKo: '눈보라 아래 두 서약', titleEn: 'Two Vows Beneath the Blizzard' },
  { chapter: 2, titleKo: '일곱 추적자의 맹세', titleEn: 'Oath of the Seven Pursuers' },
  { chapter: 3, titleKo: '안개 절벽의 피', titleEn: 'Blood on the Mist Cliff' },
  { chapter: 4, titleKo: '황야에서 자란 아이', titleEn: 'The Child Raised in the Wastes' },
  { chapter: 5, titleKo: '폭우 속의 유령', titleEn: 'Phantom in the Downpour' },
  { chapter: 6, titleKo: '별을 호흡하는 법', titleEn: 'The Art of Breathing Stars' },
  { chapter: 7, titleKo: '배신자들의 천막', titleEn: 'The Traitors Camp' },
  { chapter: 8, titleKo: '붉은 갈기의 기수', titleEn: 'Rider of the Crimson Mane' },
  { chapter: 9, titleKo: '거지 옷의 바람', titleEn: 'Wind in Beggars Clothes' },
  { chapter: 10, titleKo: '불꽃 궁정의 포로', titleEn: 'Prisoner of the Flame Court' },
  { chapter: 11, titleKo: '기억을 깨우는 단검', titleEn: 'The Dagger That Wakes Memory' },
  { chapter: 12, titleKo: '두 무덤 사이의 봄', titleEn: 'Spring Between Two Graves' },
  { chapter: 13, titleKo: '녹옥 지팡이의 주인', titleEn: 'Master of the Jade Staff' },
  { chapter: 14, titleKo: '안개 호수의 손님들', titleEn: 'Guests of the Mist Lake' },
  { chapter: 15, titleKo: '독사와 사자의 밤', titleEn: 'Night of Serpent and Lion' },
  { chapter: 16, titleKo: '폐허 앞의 형제', titleEn: 'Brothers Before the Ruins' },
  { chapter: 17, titleKo: '바람섬의 초대장', titleEn: 'Invitation to the Wind Isle' },
  { chapter: 18, titleKo: '검은 성전의 비밀', titleEn: 'Secret of the Black Sanctum' },
  { chapter: 19, titleKo: '세 가지 시험', titleEn: 'Three Trials' },
  { chapter: 20, titleKo: '꽃배를 삼킨 파도', titleEn: 'The Wave That Swallowed the Flower Ship' },
  { chapter: 21, titleKo: '불타는 배의 배신', titleEn: 'Betrayal Aboard the Burning Ship' },
  { chapter: 22, titleKo: '무인도의 네 사람', titleEn: 'Four on a Deserted Island' },
  { chapter: 23, titleKo: '동굴 속 잠든 기록', titleEn: 'The Record Sleeping in the Cave' },
  { chapter: 24, titleKo: '봉인실의 일곱 밤', titleEn: 'Seven Nights in the Sealed Chamber' },
  { chapter: 25, titleKo: '거짓 혼례의 밤', titleEn: 'Night of the False Wedding' },
  { chapter: 26, titleKo: '열린 문, 닫힌 마음', titleEn: 'Open Door, Closed Heart' },
  { chapter: 27, titleKo: '두 약속 사이', titleEn: 'Between Two Promises' },
  { chapter: 28, titleKo: '녹옥 의회의 반란', titleEn: 'Revolt of the Jade Council' },
  { chapter: 29, titleKo: '바람의 여왕', titleEn: 'Queen of the Wind' },
  { chapter: 30, titleKo: '네 관문의 독', titleEn: 'Poison at the Four Gates' },
  { chapter: 31, titleKo: '모든 것을 건 손', titleEn: 'The Hand That Wagered Everything' },
  { chapter: 32, titleKo: '첫사랑의 잔향', titleEn: 'Echo of First Love' },
  { chapter: 33, titleKo: '검은 늪의 원한', titleEn: 'Grudge of the Black Marsh' },
  { chapter: 34, titleKo: '무너진 바람섬', titleEn: 'The Fallen Wind Isle' },
  { chapter: 35, titleKo: '안개 속의 오인', titleEn: 'Mistaken in the Fog' },
  { chapter: 36, titleKo: '십자 성흔의 지도', titleEn: 'Map of the Cross-Shaped Scar' },
  { chapter: 37, titleKo: '정복왕의 전쟁', titleEn: 'War of the Conqueror King' },
  { chapter: 38, titleKo: '세 개의 비단 봉인', titleEn: 'Three Silk Seals' },
  { chapter: 39, titleKo: '지켜야 할 세계', titleEn: 'The World Worth Protecting' },
  { chapter: 40, titleKo: '영웅이라 불리지 않는 자', titleEn: 'One Who Is Not Called a Hero' },
];

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
    id: 'shadow-palace',
    nameKey: 'kadan_rpg_region_shadow_palace',
    terrain: 'palace',
    width: 10,
    height: 8,
    startTile: { x: 1, y: 4 },
    blockedTiles: [{ x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 }, { x: 7, y: 5 }],
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
  encounter('enc-ch01', 'kadan_rpg_opp_ch01', [50, 42, 43, 107, 49], 'easy', 'reward-ch01', false),
  encounter('enc-ch02', 'kadan_rpg_opp_ch02', [49, 50, 42, 45, 46], 'easy', 'reward-ch02', false),
  encounter('enc-ch03', 'kadan_rpg_opp_ch03', [63, 45, 46, 44, 74], 'easy', 'reward-ch03', false),
  encounter('enc-ch04', 'kadan_rpg_opp_ch04', [50, 42, 47, 81, 45], 'easy', 'reward-ch04', false),
  encounter('enc-ch05', 'kadan_rpg_opp_ch05', [70, 63, 48, 89, 50], 'normal', 'reward-ch05', false),
  encounter('enc-ch06', 'kadan_rpg_opp_ch06', [45, 46, 74, 44, 70], 'normal', 'reward-ch06', false),
  encounter('enc-ch07', 'kadan_rpg_opp_ch07', [66, 25, 89, 81, 61], 'normal', 'reward-ch07', false),
  encounter('enc-ch08', 'kadan_rpg_opp_ch08', [50, 66, 90, 62, 11], 'boss', 'reward-ch08', false),
  encounter('enc-ch09', 'kadan_rpg_opp_ch09', [11, 50, 62, 89, 51], 'normal', 'reward-story', false),
  encounter('enc-ch10', 'kadan_rpg_opp_ch10', [62, 43, 61, 11, 50], 'normal', 'reward-ally', false),
  encounter('enc-ch11', 'kadan_rpg_opp_ch11', [62, 43, 50, 11, 42], 'normal', 'reward-story', false),
  encounter('enc-ch12', 'kadan_rpg_opp_ch12', [43, 89, 11, 107, 49], 'hard', 'reward-ally', false),
  encounter('enc-ch13', 'kadan_rpg_opp_ch13', [62, 61, 86, 50, 11], 'normal', 'reward-story', false),
  encounter('enc-ch14', 'kadan_rpg_opp_ch14', [62, 86, 46, 23, 50], 'normal', 'reward-story', false),
  encounter('enc-ch15', 'kadan_rpg_opp_ch15', [62, 61, 86, 89, 50], 'hard', 'reward-ally', false),
  encounter('enc-ch16', 'kadan_rpg_opp_ch16', [11, 50, 43, 62, 61], 'boss', 'reward-boss', false),
  encounter('enc-ch17', 'kadan_rpg_opp_ch17', [46, 84, 62, 11, 64], 'hard', 'reward-story', false),
  encounter('enc-ch18', 'kadan_rpg_opp_ch18', [62, 25, 11, 50, 23], 'hard', 'reward-story', false),
  encounter('enc-ch19', 'kadan_rpg_opp_ch19', [62, 25, 23, 11, 50], 'hard', 'reward-ally', false),
  encounter('enc-ch20', 'kadan_rpg_opp_ch20', [11, 25, 62, 23, 46], 'hard', 'reward-story', false),
  encounter('enc-ch21', 'kadan_rpg_opp_ch21', [46, 62, 61, 50, 43], 'hard', 'reward-story', false),
  encounter('enc-ch22', 'kadan_rpg_opp_ch22', [61, 46, 62, 11, 74], 'hard', 'reward-ally', false),
  encounter('enc-ch23', 'kadan_rpg_opp_ch23', [50, 43, 46, 62, 11], 'hard', 'reward-story', false),
  encounter('enc-ch24', 'kadan_rpg_opp_ch24', [62, 50, 43, 23, 11], 'boss', 'reward-boss', false),
  encounter('enc-ch25', 'kadan_rpg_opp_ch25', [62, 61, 11, 89, 60], 'hard', 'reward-story', false),
  encounter('enc-ch26', 'kadan_rpg_opp_ch26', [61, 62, 11, 89, 13], 'hard', 'reward-story', false),
  encounter('enc-ch27', 'kadan_rpg_opp_ch27', [62, 11, 50, 43, 61], 'hard', 'reward-story', false),
  encounter('enc-ch28', 'kadan_rpg_opp_ch28', [61, 13, 89, 62, 60], 'hard', 'reward-ally', false),
  encounter('enc-ch29', 'kadan_rpg_opp_ch29', [62, 11, 23, 61, 46], 'boss', 'reward-story', false),
  encounter('enc-ch30', 'kadan_rpg_opp_ch30', [62, 11, 74, 89, 45], 'boss', 'reward-story', false),
  encounter('enc-ch31', 'kadan_rpg_opp_ch31', [61, 46, 74, 62, 11], 'boss', 'reward-story', false),
  encounter('enc-ch32', 'kadan_rpg_opp_ch32', [62, 11, 25, 13, 23], 'boss', 'reward-boss', false),
  encounter('enc-ch33', 'kadan_rpg_opp_ch33', [61, 99, 62, 46, 74], 'boss', 'reward-boss', false),
  encounter('enc-ch34', 'kadan_rpg_opp_ch34', [62, 61, 45, 46, 74], 'boss', 'reward-story', false),
  encounter('enc-ch35', 'kadan_rpg_opp_ch35', [62, 11, 45, 74, 13], 'boss', 'reward-ally', false),
  encounter('enc-ch36', 'kadan_rpg_opp_ch36', [62, 42, 61, 50, 43], 'boss', 'reward-story', false),
  encounter('enc-ch37', 'kadan_rpg_opp_ch37', [50, 62, 61, 81, 89], 'boss', 'reward-story', false),
  encounter('enc-ch38', 'kadan_rpg_opp_ch38', [61, 13, 89, 62, 50], 'boss', 'reward-boss', false),
  encounter('enc-ch39', 'kadan_rpg_opp_ch39', [60, 61, 62, 43, 89], 'boss', 'reward-boss', false),
  encounter('enc-ch40', 'kadan_rpg_opp_ch40', [62, 50, 11, 46, 81], 'boss', 'reward-ending', false),
  // Legacy aliases for backwards compatibility
  encounter('enc-mid', 'kadan_rpg_opp_shadow_court', [56, 58, 60, 91, 100], 'hard', 'reward-ally'),
  encounter('enc-boss', 'kadan_rpg_opp_arcane_boss', [60, 99, 100, 50, 109], 'boss', 'reward-boss', true),
  encounter('enc-ending', 'kadan_rpg_opp_final_echo', [60, 100, 109, 110, 50], 'boss', 'reward-ending', true),
];

const eventTiles: KadanRpgTile[] = [
  { x: 2, y: 5 }, { x: 4, y: 5 }, { x: 6, y: 5 }, { x: 8, y: 3 },
  { x: 2, y: 3 }, { x: 5, y: 4 }, { x: 8, y: 6 }, { x: 8, y: 2 },
  { x: 3, y: 6 }, { x: 6, y: 6 }, { x: 9, y: 4 }, { x: 9, y: 1 },
];

export const chapterRegionIds: string[] = [
  'elwin-wildland', 'elwin-wildland',
  'red-cliff', 'red-cliff', 'red-cliff',
  'mana-caves', 'mana-caves', 'mana-caves',
  'southern-road', 'southern-road', 'southern-road', 'southern-road',
  'taiho-beastlands', 'taiho-beastlands', 'taiho-beastlands', 'taiho-beastlands',
  'shadow-palace', 'shadow-palace', 'shadow-palace', 'shadow-palace',
  'wind-island', 'wind-island', 'wind-island', 'wind-island',
  'wind-island', 'wind-island', 'wind-island', 'wind-island',
  'final-citadel', 'final-citadel', 'final-citadel', 'final-citadel',
  'final-citadel', 'final-citadel', 'final-citadel', 'final-citadel',
  'final-citadel', 'final-citadel', 'final-citadel', 'final-citadel',
];

export const speakerCardIds: number[] = [
  49, 49, 48, 47, 45, 66, 81, 90, 62, 11,
  11, 43, 86, 46, 86, 43, 62, 69, 25, 69,
  61, 74, 50, 47, 61, 61, 47, 86, 23, 66,
  1, 62, 60, 25, 49, 47, 47, 61, 60, 41,
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

  const cards = baseEncounter?.opponentCardIds
    ? [...baseEncounter.opponentCardIds.slice(0, 5)]
    : [event.speakerCardId || 50, 42, 43, 107, 49];

  return {
    id: encId,
    opponentNameKey: baseEncounter?.opponentNameKey || `kadan_rpg_opp_ch${String(chapter).padStart(2, '0')}`,
    opponentCardIds: cards,
    difficulty: scaledDifficulty,
    firstClearRewardId: baseEncounter?.firstClearRewardId || event.rewardId || 'reward-story',
    repeatRewardId: scaledDifficulty === 'boss' ? undefined : 'reward-story',
    allowLossProgress: false,
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
