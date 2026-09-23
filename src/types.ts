export type CardGrade = 'N' | 'R' | 'SR' | 'SSR' | 'UR';

export type CardElement = 'Water' | 'Fire' | 'Earth' | 'Wind' | 'Light' | 'Dark';

export interface CardSkill {
  id: string;
  name: string;
  description: string;
  cooldown: number; // turns
  powerMultiplier: number;
  effectType: 'damage' | 'heal' | 'buff' | 'shield';
}

export interface CardItem {
  id: string;
  no: number;
  name: string;
  nameKo: string;
  title: string;
  element: CardElement;
  grade: CardGrade;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  critRate: number; // 0 to 100%
  description: string;
  skill: CardSkill;
  avatarIcon: string;
  colorAccent: string;
}

export interface OwnedCard {
  instanceId: string;
  cardId: string;
  level: number;
  exp: number;
  skillLevel: number;
  stars: number;
  obtainedAt: number;
}

export interface PlayerProfile {
  id: string;
  username: string;
  level: number;
  exp: number;
  points: number; // SNS Points
  gachaTickets: number; // Max 100 free pulls pool
  cryptoBalances: {
    btc: number;
    eth: number;
    usdc: number;
  };
  battleRating: number;
  wins: number;
  losses: number;
  deckCardIds: string[]; // up to 5 card instanceIds
  ownedCards: OwnedCard[];
  dailyRewardClaimedDate: string;
  soundEnabled: boolean;
  sfxVolume: number;
  bgmVolume: number;
  language: 'ko' | 'en' | 'ja' | 'zh-CN';
}

export interface BattleFighter {
  instanceId: string;
  card: CardItem;
  currentHp: number;
  maxHp: number;
  currentAtk: number;
  currentDef: number;
  currentSpd: number;
  skillCooldownCurrent: number;
  isAlive: boolean;
  side: 'player' | 'enemy';
  position: number;
}

export interface BattleActionLog {
  turn: number;
  actorName: string;
  actorSide: 'player' | 'enemy';
  targetName: string;
  actionType: 'normal' | 'skill' | 'heal' | 'critical';
  damage: number;
  skillName?: string;
  message: string;
  timestamp: number;
}

export interface BattleResult {
  winner: 'player' | 'enemy';
  turns: number;
  expGained: number;
  pointsGained: number;
  ratingChange: number;
}

export type Language = 'ko' | 'en' | 'ja' | 'zh-CN' | 'zh-TW' | 'de' | 'es' | 'fr' | 'id' | 'ru' | 'th' | 'vi' | 'gb';

export type ViewType =
  | 'home'
  | 'play'
  | 'ranking'
  | 'guild'
  | 'shop'
  | 'deck'
  | 'setting'
  | 'settings'
  | 'event'
  | 'admin'
  | 'landing'
  | 'profile'
  | 'skill'
  | 'companion'
  | 'marketplace'
  | 'prediction'
  | 'wiki'
  | 'codex'
  | 'season_hub'
  | 'season-hub'
  | 'referral'
  | 'creator'
  | 'policy'
  | 'policy-center'
  | 'novel'
  | 'anime'
  | 'movie'
  | 'modoo'
  | 'grid'
  | 'pacpik'
  | 'fusion'
  | 'leaderboard'
  | 'quest'
  | 'share'
  | 'status'
  | 'stock'
  | 'community'
  | 'boost'
  | 'web3-landing'
  | 'mall'
  | string;

export type CharacterFaction =
  | 'water'
  | 'fire'
  | 'wind'
  | 'earth'
  | 'human'
  | 'undead'
  | 'elf'
  | 'dwarf'
  | 'monster'
  | 'robot'
  | 'dragon';

export type CharacterRarityTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'legendary';

export type CardRarity = CharacterRarityTier;
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface CharacterIpProfile {
  cardId: number;
  faction: CharacterFaction;
  rarityTier: CharacterRarityTier;
  archetype: string;
  personality: string;
  artDirection: {
    poseKeywords: string[];
    lightingStyle: string;
    cameraAngle: string;
  };
  animationProfile: {
    animationIntensity: number;
  };
  marketingTags: string[];
  rivalIds?: number[];
  allyIds?: number[];
  relationshipIds?: number[];
}

export interface DatabaseCard {
  id: number;
  title: string;
  title_en?: string;
  power?: number;
  hp?: number;
  atk?: number;
  def?: number;
  spd?: number;
  critRate?: number;
  element?: string;
  rarity?: string;
  tier?: string;
  faction?: CharacterFaction;
  description?: string;
  description_en?: string;
  image_url?: string;
  [key: string]: any;
}

export interface UserProfile {
  uid?: string;
  name?: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  photoURL?: string;
  guildLevel?: number;
  [key: string]: any;
}

export type CardData = DatabaseCard | CardItem;
