import type { CharacterRarityTier } from '../types';

/** 스킨 획득 조건 유형 */
export type SkinUnlockType =
  | 'default'       // 기본 제공 (시작 시 보유)
  | 'season-pass'   // 시즌 패스 보상
  | 'achievement'   // 업적 달성
  | 'shop'          // 상점 구매
  | 'event'         // 이벤트 보상
  | 'mission'       // 미션 달성
  | 'secret';       // 히든 조건

/** 개별 카드 스킨 정의 */
export interface CardSkin {
  /** 고유 스킨 키 (예: "skin_s1_01_firelord") */
  skinKey: string;
  /** 적용 대상 카드 ID (DatabaseCard.id) */
  cardId: number;
  /** 스킨이 속한 시즌 */
  season: string;
  /** 스킨 이름 i18n 키 */
  nameKey: string;
  /** 스킨 설명 i18n 키 */
  descKey: string;
  /** 스킨 획득 조건 설명 i18n 키 */
  unlockConditionKey: string;
  /** 스킨 획득 조건 유형 */
  unlockType: SkinUnlockType;
  /** 스킨 희귀도 */
  rarityTier: CharacterRarityTier;
  /** 이미지 생성 프롬프트 (AI 아트 생성용) */
  previewPrompt: string;
  /** 폴백 색상 (이미지 없을 때 표시용 배경색) */
  fallbackPrimaryColor: string;
  fallbackAccentColor: string;
  /** 폴백 이모지 */
  fallbackEmoji: string;
}

const COLLECTOR_SKIN_DESC_KEY = 'ip_shop_product_skin_desc';

const SEASON_COLLECTOR_SKINS: CardSkin[] = [
  {
    skinKey: 'skin_s1_collector',
    cardId: 80,
    season: 'season1',
    nameKey: 'skin_s1_collector',
    descKey: COLLECTOR_SKIN_DESC_KEY,
    unlockConditionKey: 'mission_season_collect_15_desc',
    unlockType: 'mission',
    rarityTier: 'gold',
    previewPrompt: 'Season 1 collector skin: a commemorative forge-master look celebrating players who collected 15 cards this season, premium mission reward, indigo-gold accents',
    fallbackPrimaryColor: '#f59e0b',
    fallbackAccentColor: '#7c3aed',
    fallbackEmoji: '🏆',
  },
  {
    skinKey: 'skin_s2_collector',
    cardId: 90,
    season: 'season2',
    nameKey: 'skin_s2_collector',
    descKey: COLLECTOR_SKIN_DESC_KEY,
    unlockConditionKey: 'mission_season_collect_20_desc',
    unlockType: 'mission',
    rarityTier: 'gold',
    previewPrompt: 'Season 2 collector skin: a neon cyber commemorative reward for collecting 20 cards during the season, sleek mission-exclusive cosmetic',
    fallbackPrimaryColor: '#06b6d4',
    fallbackAccentColor: '#8b5cf6',
    fallbackEmoji: '🛰️',
  },
  {
    skinKey: 'skin_s3_collector',
    cardId: 101,
    season: 'season3',
    nameKey: 'skin_s3_collector',
    descKey: COLLECTOR_SKIN_DESC_KEY,
    unlockConditionKey: 'mission_season_collect_25_desc',
    unlockType: 'mission',
    rarityTier: 'legendary',
    previewPrompt: 'Season 3 collector skin: a celestial dragon cosmetic for players who collected 25 cards in the season, radiant premium reward',
    fallbackPrimaryColor: '#a855f7',
    fallbackAccentColor: '#0f172a',
    fallbackEmoji: '🌌',
  },
];

// ─── 시즌 1 스킨 (10종) ──────────────────────────────────────────

export const SEASON1_CARD_SKINS: CardSkin[] = [
  // 1. Water Dragon Lord - 얼음 군주 스킨
  {
    skinKey: 'skin_s1_10_frost_lord',
    cardId: 10,
    season: 'season1',
    nameKey: 'skin_s1_10_frost_lord_name',
    descKey: 'skin_s1_10_frost_lord_desc',
    unlockConditionKey: 'skin_s1_unlock_season_pass_lv20',
    unlockType: 'season-pass',
    rarityTier: 'gold',
    previewPrompt: 'Water Dragon Lord transformed into Frost Lord: ice crystal armor, frozen crown, blizzard aura, blue-white color palette, dramatic low-angle shot',
    fallbackPrimaryColor: '#67e8f9',
    fallbackAccentColor: '#0ea5e9',
    fallbackEmoji: '❄️',
  },
  // 2. Fire General - 마그마 군주 스킨
  {
    skinKey: 'skin_s1_20_magma_lord',
    cardId: 20,
    season: 'season1',
    nameKey: 'skin_s1_20_magma_lord_name',
    descKey: 'skin_s1_20_magma_lord_desc',
    unlockConditionKey: 'skin_s1_unlock_achievement_fire_master',
    unlockType: 'achievement',
    rarityTier: 'gold',
    previewPrompt: 'Fire General transformed into Magma Lord: obsidian armor with flowing lava veins, volcanic crown, fire storm aura, red-orange-black palette, dramatic low-angle shot',
    fallbackPrimaryColor: '#f97316',
    fallbackAccentColor: '#dc2626',
    fallbackEmoji: '🌋',
  },
  // 3. Wind Thunder Bird - 번개 폭풍 스킨
  {
    skinKey: 'skin_s1_30_storm_fury',
    cardId: 30,
    season: 'season1',
    nameKey: 'skin_s1_30_storm_fury_name',
    descKey: 'skin_s1_30_storm_fury_desc',
    unlockConditionKey: 'skin_s1_unlock_season_pass_lv40',
    unlockType: 'season-pass',
    rarityTier: 'legendary',
    previewPrompt: 'Wind Thunder Bird in Storm Fury form: crackling lightning wings, storm cloud armor, golden electric eyes, yellow-white-blue palette, wide-shot dramatic sky',
    fallbackPrimaryColor: '#fbbf24',
    fallbackAccentColor: '#3b82f6',
    fallbackEmoji: '⚡',
  },
  // 4. Earth Giant - 숲의 수호자 스킨
  {
    skinKey: 'skin_s1_40_forest_guardian',
    cardId: 40,
    season: 'season1',
    nameKey: 'skin_s1_40_forest_guardian_name',
    descKey: 'skin_s1_40_forest_guardian_desc',
    unlockConditionKey: 'skin_s1_unlock_event_spring',
    unlockType: 'event',
    rarityTier: 'silver',
    previewPrompt: 'Earth Giant as Forest Guardian: moss-covered stone body, flowering vines, wooden crown, butterfly companions, green-brown palette, soft lighting eye-level shot',
    fallbackPrimaryColor: '#4ade80',
    fallbackAccentColor: '#166534',
    fallbackEmoji: '🌿',
  },
  // 5. Human Conqueror - 황금 기사 스킨
  {
    skinKey: 'skin_s1_50_golden_knight',
    cardId: 50,
    season: 'season1',
    nameKey: 'skin_s1_50_golden_knight_name',
    descKey: 'skin_s1_50_golden_knight_desc',
    unlockConditionKey: 'skin_s1_unlock_shop_5000sns',
    unlockType: 'shop',
    rarityTier: 'gold',
    previewPrompt: 'Human Conqueror as Golden Knight: shining golden plate armor, majestic cape, holy sword of light, divine aura, gold-white palette, low-angle heroic shot',
    fallbackPrimaryColor: '#fbbf24',
    fallbackAccentColor: '#f59e0b',
    fallbackEmoji: '🛡️',
  },
  // 6. Undead Death Knight - 망령 기사 스킨
  {
    skinKey: 'skin_s1_60_spectral_knight',
    cardId: 60,
    season: 'season1',
    nameKey: 'skin_s1_60_spectral_knight_name',
    descKey: 'skin_s1_60_spectral_knight_desc',
    unlockConditionKey: 'skin_s1_unlock_season_pass_lv60',
    unlockType: 'season-pass',
    rarityTier: 'legendary',
    previewPrompt: 'Undead Death Knight as Spectral Knight: translucent ghostly armor, ethereal blue flames, floating phantom swords, misty graveyard background, mystical lighting close-up',
    fallbackPrimaryColor: '#818cf8',
    fallbackAccentColor: '#312e81',
    fallbackEmoji: '👻',
  },
  // 7. Elf Hunter - 달빛 정찰대 스킨
  {
    skinKey: 'skin_s1_70_moonlight_scout',
    cardId: 70,
    season: 'season1',
    nameKey: 'skin_s1_70_moonlight_scout_name',
    descKey: 'skin_s1_70_moonlight_scout_desc',
    unlockConditionKey: 'skin_s1_unlock_default',
    unlockType: 'default',
    rarityTier: 'silver',
    previewPrompt: 'Elf Hunter in Moonlight Scout outfit: silver-threaded cloak, crescent moon bow, night vision goggles, wolf companion, silver-green palette, high-angle forest night',
    fallbackPrimaryColor: '#c0ca33',
    fallbackAccentColor: '#4d7c0f',
    fallbackEmoji: '🌙',
  },
  // 8. Dwarf Smith - 화염 대장장이 스킨
  {
    skinKey: 'skin_s1_80_forge_master',
    cardId: 80,
    season: 'season1',
    nameKey: 'skin_s1_80_forge_master_name',
    descKey: 'skin_s1_80_forge_master_desc',
    unlockConditionKey: 'skin_s1_unlock_mission_craft',
    unlockType: 'mission',
    rarityTier: 'silver',
    previewPrompt: 'Dwarf Smith as Forge Master: molten metal apron, legendary hammer, floating anvils, forge fire backdrop, fiery lighting eye-level shot',
    fallbackPrimaryColor: '#fb923c',
    fallbackAccentColor: '#9a3412',
    fallbackEmoji: '🔨',
  },
  // 9. Robot - 네온 사이버 스킨
  {
    skinKey: 'skin_s1_90_neon_cyber',
    cardId: 90,
    season: 'season1',
    nameKey: 'skin_s1_90_neon_cyber_name',
    descKey: 'skin_s1_90_neon_cyber_desc',
    unlockConditionKey: 'skin_s1_unlock_season_pass_lv80',
    unlockType: 'season-pass',
    rarityTier: 'gold',
    previewPrompt: 'Robot in Neon Cyber form: glowing neon circuits, holographic wings, chrome-plated chassis, futuristic city background, neon lighting wide-shot',
    fallbackPrimaryColor: '#ec4899',
    fallbackAccentColor: '#06b6d4',
    fallbackEmoji: '🤖',
  },
  // 10. Dragon Boss - 천상의 용 스킨
  {
    skinKey: 'skin_s1_101_celestial_dragon',
    cardId: 101,
    season: 'season1',
    nameKey: 'skin_s1_101_celestial_dragon_name',
    descKey: 'skin_s1_101_celestial_dragon_desc',
    unlockConditionKey: 'skin_s1_unlock_secret',
    unlockType: 'secret',
    rarityTier: 'legendary',
    previewPrompt: 'Dragon in Celestial form: crystalline scales, constellation-patterned wings, galaxy breath weapon, star-filled void background, dramatic low-angle with cosmic lighting',
    fallbackPrimaryColor: '#a78bfa',
    fallbackAccentColor: '#1e1b4b',
    fallbackEmoji: '🐉',
  },
];

/** 시즌별 전체 스킨 맵 */
export const ALL_CARD_SKINS: Record<string, CardSkin[]> = {
  season1: [...SEASON_COLLECTOR_SKINS.filter((skin) => skin.season === 'season1'), ...SEASON1_CARD_SKINS],
  season2: SEASON_COLLECTOR_SKINS.filter((skin) => skin.season === 'season2'),
  season3: SEASON_COLLECTOR_SKINS.filter((skin) => skin.season === 'season3'),
};

/** skinKey로 스킨 조회 */
export function getCardSkinByKey(skinKey: string): CardSkin | undefined {
  for (const skins of Object.values(ALL_CARD_SKINS)) {
    const found = skins.find((s) => s.skinKey === skinKey);
    if (found) return found;
  }
  return undefined;
}

/** 특정 카드 ID로 사용 가능한 모든 스킨 조회 */
export function getSkinsForCard(cardId: number, season: string): CardSkin[] {
  const seasonSkins = ALL_CARD_SKINS[season] ?? [];
  return seasonSkins.filter((s) => s.cardId === cardId);
}

/** unlock 유형별 표시용 라벨 i18n 키 */
export function getUnlockTypeLabelKey(unlockType: SkinUnlockType): string {
  const map: Record<SkinUnlockType, string> = {
    'default': 'skin_unlock_type_default',
    'season-pass': 'skin_unlock_type_season_pass',
    'achievement': 'skin_unlock_type_achievement',
    'shop': 'skin_unlock_type_shop',
    'event': 'skin_unlock_type_event',
    'mission': 'skin_unlock_type_mission',
    'secret': 'skin_unlock_type_secret',
  };
  return map[unlockType];
}
