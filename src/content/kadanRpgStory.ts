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
  encounter('enc-ch01', 'kadan_rpg_opp_ch01', [51, 52, 61, 60, 43], 'easy', 'reward-ch01', true),
  encounter('enc-ch02', 'kadan_rpg_opp_ch02', [44, 45, 46, 70, 74], 'easy', 'reward-ch02', false),
  encounter('enc-ch03', 'kadan_rpg_opp_ch03', [13, 89, 54, 55, 48], 'easy', 'reward-ch03', false),
  encounter('enc-ch04', 'kadan_rpg_opp_ch04', [81, 82, 83, 87, 47], 'easy', 'reward-ch04', true),
  encounter('enc-ch05', 'kadan_rpg_opp_ch05', [13, 25, 51, 74, 70], 'normal', 'reward-ch05', false),
  encounter('enc-ch06', 'kadan_rpg_opp_ch06', [66, 74, 84, 64, 43], 'normal', 'reward-ch06', false),
  encounter('enc-ch07', 'kadan_rpg_opp_ch07', [87, 88, 61, 81, 52], 'normal', 'reward-ch07', false),
  encounter('enc-ch08', 'kadan_rpg_opp_ch08', [90, 71, 11, 60, 49], 'boss', 'reward-ch08', true),
  encounter('enc-ch09', 'kadan_rpg_opp_ch09', [51, 61, 25, 107, 41], 'normal', 'reward-story', false),
  encounter('enc-ch10', 'kadan_rpg_opp_ch10', [61, 107, 51, 11, 43], 'normal', 'reward-ally', false),
  encounter('enc-ch11', 'kadan_rpg_opp_ch11', [11, 13, 89, 74, 43], 'normal', 'reward-story', false),
  encounter('enc-ch12', 'kadan_rpg_opp_ch12', [99, 49, 61, 107, 43], 'hard', 'reward-ally', false),
  encounter('enc-ch13', 'kadan_rpg_opp_ch13', [86, 25, 90, 62, 11], 'normal', 'reward-story', false),
  encounter('enc-ch14', 'kadan_rpg_opp_ch14', [46, 13, 89, 61, 52], 'normal', 'reward-story', false),
  encounter('enc-ch15', 'kadan_rpg_opp_ch15', [13, 38, 86, 46, 54], 'hard', 'reward-ally', false),
  encounter('enc-ch16', 'kadan_rpg_opp_ch16', [60, 43, 61, 23, 107], 'boss', 'reward-boss', true),
  encounter('enc-ch17', 'kadan_rpg_opp_ch17', [84, 64, 81, 46, 11], 'hard', 'reward-story', false),
  encounter('enc-ch18', 'kadan_rpg_opp_ch18', [69, 99, 64, 62, 11], 'hard', 'reward-story', false),
  encounter('enc-ch19', 'kadan_rpg_opp_ch19', [25, 45, 13, 69, 62], 'hard', 'reward-ally', false),
  encounter('enc-ch20', 'kadan_rpg_opp_ch20', [69, 25, 46, 90, 62], 'hard', 'reward-story', false),
  encounter('enc-ch21', 'kadan_rpg_opp_ch21', [61, 60, 86, 38, 11], 'hard', 'reward-story', false),
  encounter('enc-ch22', 'kadan_rpg_opp_ch22', [74, 84, 64, 60, 11], 'hard', 'reward-ally', false),
  encounter('enc-ch23', 'kadan_rpg_opp_ch23', [50, 80, 86, 43, 11], 'hard', 'reward-story', false),
  encounter('enc-ch24', 'kadan_rpg_opp_ch24', [60, 47, 38, 11, 62], 'boss', 'reward-boss', true),
  encounter('enc-ch25', 'kadan_rpg_opp_ch25', [61, 60, 80, 11, 41], 'hard', 'reward-story', false),
  encounter('enc-ch26', 'kadan_rpg_opp_ch26', [61, 60, 80, 41, 11], 'hard', 'reward-story', false),
  encounter('enc-ch27', 'kadan_rpg_opp_ch27', [47, 81, 64, 84, 11], 'hard', 'reward-story', false),
  encounter('enc-ch28', 'kadan_rpg_opp_ch28', [61, 86, 11, 62, 41], 'hard', 'reward-ally', false),
  encounter('enc-ch29', 'kadan_rpg_opp_ch29', [5, 38, 54, 62, 11], 'boss', 'reward-story', false),
  encounter('enc-ch30', 'kadan_rpg_opp_ch30', [66, 65, 87, 5, 11], 'boss', 'reward-story', false),
  encounter('enc-ch31', 'kadan_rpg_opp_ch31', [1, 2, 5, 69, 11], 'boss', 'reward-story', false),
  encounter('enc-ch32', 'kadan_rpg_opp_ch32', [23, 61, 69, 1, 11], 'boss', 'reward-boss', true),
  encounter('enc-ch33', 'kadan_rpg_opp_ch33', [60, 61, 69, 5, 62], 'boss', 'reward-boss', true),
  encounter('enc-ch34', 'kadan_rpg_opp_ch34', [25, 45, 74, 60, 70], 'boss', 'reward-story', false),
  encounter('enc-ch35', 'kadan_rpg_opp_ch35', [49, 25, 74, 70, 61], 'boss', 'reward-ally', false),
  encounter('enc-ch36', 'kadan_rpg_opp_ch36', [47, 81, 60, 64, 61], 'boss', 'reward-story', false),
  encounter('enc-ch37', 'kadan_rpg_opp_ch37', [47, 81, 61, 11, 60], 'boss', 'reward-story', false),
  encounter('enc-ch38', 'kadan_rpg_opp_ch38', [61, 47, 80, 70, 45], 'boss', 'reward-boss', true),
  encounter('enc-ch39', 'kadan_rpg_opp_ch39', [60, 5, 11, 90, 61], 'boss', 'reward-boss', true),
  encounter('enc-ch40', 'kadan_rpg_opp_ch40', [41, 50, 43, 47, 11], 'boss', 'reward-ending', true),
  // Legacy aliases for backwards compatibility
  encounter('enc-mid', 'kadan_rpg_opp_shadow_court', [56, 58, 60, 91, 100], 'hard', 'reward-ally'),
  encounter('enc-boss', 'kadan_rpg_opp_arcane_boss', [60, 99, 100, 50, 109], 'boss', 'reward-boss', true),
  encounter('enc-ending', 'kadan_rpg_opp_final_echo', [60, 100, 109, 110, 50], 'boss', 'reward-ending', true),
];

const eventTiles: KadanRpgTile[] = [
  { x: 2, y: 5 }, { x: 4, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 3 },
  { x: 2, y: 3 }, { x: 5, y: 4 }, { x: 8, y: 5 }, { x: 8, y: 2 },
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
