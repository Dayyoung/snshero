export interface DatabaseCard {
  id: number;
  index: number;
  category: number;
  type: number;
  level: number;
  title: string;
  title_en: string;
  delete: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
  updated: string;
  power: number;
  title_dis: string;
  rarity: string;
  element?: CardElement;
  race?: string;
  stats: [number, number, number, number]; // [Top, Right, Bottom, Left]
  ability?: CardAbility;
  imageUrl?: string;
  imageIndex?: number;
  desc?: string;
  desc_dis?: string;
  desc_en?: string;
  lore_ko?: string;
  lore_en?: string;
}

export type ItemRarity = 'normal' | 'magic' | 'rare';
export type CardRarity = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legendary';

export type EquipmentSlot = 
  | 'necklace' 
  | 'ring2' 
  | 'boots' 
  | 'ring1';

export interface Item {
  id: string;
  name_en: string;
  name_ko: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  stats: [number, number, number, number]; // [North, East, South, West]
  magicChance?: number; // Bonus to drop rates (percentage)
  description_en: string;
  description_ko: string;
  equippedToId?: string | null; // ID (index in deck) of the card it's equipped to
  imageIndex?: number;
  emoji?: string;
}

export type CardElement = 'neutral' | 'fire' | 'water' | 'earth' | 'air' | 'wind' | 'land' | 'human' | 'undead' | 'elf' | 'dwarf' | 'monster' | 'robot' | 'dragon';

// ─── IP (Intellectual Property) Types ───────────────────────────────

/** 캐릭터 소속 세력 */
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

/** 희귀도 등급 */
export type CharacterRarityTier = CardRarity;

/** 아트 디렉션 — 카드별 시각 스타일 지정 */
export interface CharacterArtDirection {
  primaryColor: string;
  accentColor: string;
  backgroundKeywords: string[];
  poseKeywords: string[];
  lightingStyle: 'soft' | 'dramatic' | 'mystical' | 'fiery' | 'earthy' | 'neon';
  cameraAngle: 'eye-level' | 'low-angle' | 'high-angle' | 'close-up' | 'wide-shot';
  silhouetteStrength: 'clean' | 'moderate' | 'complex';
}

/** 캐릭터 간 관계 */
export interface CharacterRelationship {
  targetCardId: number;
  relationType: 'ally' | 'rival' | 'master' | 'student' | 'family' | 'crush' | 'nemesis';
  storyKey: string; // i18n key
}

/** 애니메이션 프로필 */
export interface CharacterAnimationProfile {
  idleAnimation: 'float' | 'bounce' | 'glow' | 'sway' | 'crackle' | 'pulse' | 'none';
  attackAnimation: 'slash' | 'blast' | 'strike' | 'burst' | 'spin' | 'charge';
  specialEffect: string;
  animationIntensity: 0 | 1 | 2 | 3; // 0 = lowSpecMode off
  frameRate: number;
}

/** 캐릭터 IP 프로필 — 세계관/스토리텔링 코어 데이터 */
export interface CharacterIpProfile {
  cardId: number;
  faction: CharacterFaction;
  rarityTier: CharacterRarityTier;
  archetype: string; // e.g. 'tank', 'assassin', 'mage', 'support', 'wild'
  personality: string; // 한 줄 성격 요약
  originStoryKey: string; // i18n: ip_card_{id}_origin
  growthArcKey: string; // i18n: ip_card_{id}_growth
  signatureLineKey: string; // i18n: ip_card_{id}_line
  relationshipIds: number[]; // related card IDs
  rivalIds: number[];
  allyIds: number[];
  webtoonHookKey: string; // i18n: ip_card_{id}_webtoon_hook
  artDirection: CharacterArtDirection;
  animationProfile: CharacterAnimationProfile;
  marketingTags: string[]; // SNS/마케팅용 태그
}

export interface CardAbility {
  type: 'POWER_BOOST' | 'WEAKEN' | 'REINFORCE' | 'SHIELD' | 'WALL' | 'PIERCE' | 'IMMUNITY' | 'COUNTER' | 'OMNIBOOST' | 'TIME_WARP';
  value: number;
  description_ko: string;
  description_en: string;
}

export interface CardData {
  id: string;
  title_dis: string;
  stats: [number, number, number, number]; // [Top, Right, Bottom, Left]
  owner?: 'player' | 'ai' | null;
  ownerSide?: 'p1' | 'p2';
  rarity: string;
  element?: CardElement;
  race?: string;
  power?: number;
  level: number;
  exp?: number;
  xp?: number;
  bonusPower?: number;
  imageIndex?: number;
  title?: string;
  title_en?: string;
  growth?: number; // 0-5 stages
  hunger?: number; // 0-100
  happiness?: number; // 0-100
  lastInteraction?: number;
  skills?: Skill[];
  equipment?: Partial<Record<EquipmentSlot, Item>>;
  customName?: string;
  notes?: string;
  ability?: CardAbility;
  imageUrl?: string;
  isMidBoss?: boolean;
  isFinalBoss?: boolean;
  /** 시즌 스킨 unlock 키 목록 (코스메틱 전용, 능력치 변경 없음) */
  unlockedSkinKeys?: string[];
  /** 현재 장착된 스킨 키 */
  activeSkinKey?: string;
  /** unlock된 칭호 키 목록 */
  unlockedTitleKeys?: string[];
  /** 현재 장착된 칭호 키 */
  activeTitleKey?: string;
}

export type Language = string;

/** 시즌 코스메틱 스킨 unlock 상태 */
export interface SeasonCosmeticState {
  unlockedSkins: string[];
  unlockedBadges: string[];
  unlockedTitles: string[];
  unlockedWebtoonCuts: string[];
  activeSkin?: string;
}

export type TradeStatus =
  | 'draft'
  | 'active'
  | 'pending'
  | 'requested'
  | 'escrow'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface FeePolicy {
  id: string;
  labelKey: string;
  rate: number;
  minimumFee: number;
  maximumFee: number;
  season: string;
  seasonalDiscountRate: number;
  seasonalDiscountLabelKey?: string;
}

export interface Listing {
  id: string;
  cardId: number;
  sellerId: string;
  sellerName: string;
  season: string;
  askPrice: number;
  status: TradeStatus;
  source: 'seed' | 'player';
  createdAt: string;
  updatedAt: string;
  requestedByOfferId?: string;
}

export interface Offer {
  id: string;
  listingId: string;
  cardId: number;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  offeredPrice: number;
  fee: number;
  buyerTotal: number;
  sellerReceives: number;
  season: string;
  status: TradeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TradeAuditLog {
  id: string;
  entity: 'listing' | 'offer';
  tradeId: string;
  relatedListingId?: string;
  relatedOfferId?: string;
  cardId: number;
  actorId: string;
  actorName: string;
  event:
    | 'listing_created'
    | 'listing_cancelled'
    | 'offer_requested'
    | 'offer_cancelled'
    | 'escrow_started';
  status: TradeStatus;
  createdAt: string;
}

export type GoodsType = 'mug' | 'tshirt' | 'deck' | 'table';

export type GoodsPaymentMethod =
  | 'dollar'
  | 'coin'
  | 'paypal'
  | 'crypto'
  | 'test'
  | 'payoneer'
  | 'applepay'
  | 'card'
  | 'simplePay';

export interface GoodsOrder {
  orderId: string;
  buyerName: string;
  shippingAddress: string;
  country: string;
  itemName: string;
  goodsType: GoodsType;
  quantity: number;
  goodsSize?: 'S' | 'M' | 'L';
  price: string;
  paymentMethod: GoodsPaymentMethod;
  cardId: number;
  cardName: string;
  email: string;
  uid: string;
  timestamp: number;
  season: string;
  currency: 'USD' | 'SNS';
  amountUsd: number;
  amountSns?: number;
}

export type RefundRequestStatus = 'requested' | 'reviewing' | 'approved' | 'rejected' | 'processed';

export type RefundRequestReason = 'accidental_purchase' | 'wrong_item' | 'delivery_issue' | 'other';

export interface RefundRequest {
  orderId: string;
  amountUsd: number;
  reason: RefundRequestReason;
  status: RefundRequestStatus;
  createdAt: number;
  expectedBusinessDays: string;
  details?: string;
}

export type ViewType = 'game' | 'home' | 'main' | 'mydeck' | 'play' | 'shop' | 'event' | 'setting' | 'ranking' | 'admin' | 'status' | 'companion' | 'profile' | 'skill' | 'wiki' | 'world-codex' | 'wiki-card' | 'wiki-item' | 'wiki-skill' | 'wiki-howtoplay' | 'wiki-tip' | 'god' | 'guild-list' | 'guild-detail' | 'community' | 'playground' | 'stock-market' | 'card-marketplace' | 'reward-qr' | 'reward-ar' | 'share' | 'prediction-market' | 'boost' | 'season-hub' | 'policy-center' | 'web3-landing' | 'referral' | 'creator' | 'webtoon' | 'novel' | 'anime' | 'movie' | 'modoo' | 'tool-grid' | 'tool-makegrid' | 'tool-checkgrid' | 'mall';

export interface Skill {
  id: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  icon: string;
  level: number;
  maxLevel: number;
  requiredLevel: number;
  effect: {
    type: 'attack' | 'defense' | 'power' | 'special' | 'stat_0' | 'stat_1' | 'stat_2' | 'stat_3';
    value: number;
  };
  dependencies?: string[]; // IDs of skills required to unlock this one
}

export type AiStrategy = 'balanced' | 'aggressive' | 'defensive' | 'random' | 'auto';
export type AiDifficulty = 'easy' | 'medium' | 'hard';
export type BotRole = 'helpful' | 'aggressive' | 'sarcastic' | 'mysterious';

export interface Achievement {
  id: string;
  category: 'battle' | 'collection' | 'growth' | 'special' | 'social';
  title: Record<string, string>;
  description: Record<string, string>;
  targetValue: number;
  rewardType: 'coins' | 'points';
  rewardAmount: number;
}

export interface PlayerPatterns {
  placements: number[]; // Frequency of moves in each index (0-8)
  aggressionScore: number; // Ratio of flips to total moves
  totalMovesTracked: number;
  lastTenResults: ('win' | 'loss' | 'draw')[];
}

export interface UserStats {
  wins: number;
  losses: number;
  draws: number;
  skillPoints?: number;
  patterns?: PlayerPatterns;
  winStreak: number;
  lossStreak: number;
  unlockedAchievements?: string[];
  claimedAchievements?: string[];
  achievementProgress?: Record<string, number>;
  lastFreeChargeTime?: number;
}

export interface InventoryRecord {
  cardIndex: number;
  quantity: number;
  rarity: string;
  growth?: number;
  hunger?: number;
  happiness?: number;
  lastInteraction?: number;
  level?: number;
  stats?: [number, number, number, number];
  skills?: Skill[];
  equipment?: Partial<Record<EquipmentSlot, Item>>;
}

export interface GameState {
  view: ViewType;
  sns: number;
  ownedCards: CardData[];
  currentDeck: CardData[];
  inventory: Record<number, InventoryRecord>;
  totalPower: number;
  itemInventory: Item[];
  unlockedAchievements?: string[];
  achievementProgress?: Record<string, number>;
  gameResult?: 'win' | 'loss' | 'draw';
  impersonatedUser?: unknown | null;
}

export interface Guild {
  id: string;
  name: string;
  mark: string; // Emoji
  language: string; // Lang code (e.g. ko, en)
  level: number; // 1 to 10
  exp: number; // Accumulated donation points
  leaderId: string;
  leaderName: string;
  members: GuildMember[];
}

export interface GuildMember {
  uid: string;
  displayName: string;
  photoURL?: string;
  joinedAt: number;
  role: 'leader' | 'member';
}

export type CommunityCategory =
  | 'news'
  | 'free'
  | 'qa'
  | 'tip'
  | 'boast'
  | 'running'
  | 'guild'
  | 'pvp'
  | 'fanart'
  | 'vote'
  | 'webtoon'
  | 'season';

export type CommunityWritableCategory = Exclude<CommunityCategory, 'news'>;

/** Post-level sub-category flair (Reddit-inspired) */
export type PostFlair =
  | 'general' | 'casual' | 'greeting' | 'suggestion'
  | 'question' | 'answered' | 'build-help'
  | 'guide' | 'strategy' | 'meta' | 'beginner'
  | 'deck-showcase' | 'pull-flex' | 'achievement'
  | 'challenge' | 'battle-report' | 'lf-duel'
  | 'drawing' | 'digital-art' | 'cosplay' | 'music'
  | 'episode-discuss' | 'theory' | 'fan-fiction'
  | 'poll' | 'character-pick'
  | 'event-info' | 'rewards' | 'feedback';

/** Sort mode for community post listing */
export type CommunitySortMode = 'hot' | 'new' | 'top' | 'comments';

/** Post report entry */
export interface PostReport {
  userId: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'other';
  timestamp: number;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userEmoticonKey?: string;
  userBadgeKey?: string;
  userTitleKey?: string;
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  content: string;
  createdAt: number;
  likes: string[]; // User UIDs
  comments: CommunityComment[];
  category?: CommunityCategory;
  deckData?: CardData[];
  /** Reddit-style post flair / sub-category tag */
  flair?: PostFlair;
  /** Pinned (stickied) post — always appears on top */
  isPinned?: boolean;
  /** Auto-generated weekly discussion thread marker */
  isWeeklyThread?: boolean;
  /** ISO date string for the week this thread belongs to */
  weeklyThreadDate?: string;
  /** User UIDs who have hidden this post from their personal view */
  hiddenBy?: string[];
  /** Reports filed against this post */
  reports?: PostReport[];
}

export interface CommunityComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userEmoticonKey?: string;
  userBadgeKey?: string;
  userTitleKey?: string;
  content: string;
  createdAt: number;
  replies?: CommunityComment[];
}

/** 기본 사용자 정보 (Firebase Auth user의 공통 필드) */
export interface UserInfo {
  uid: string;
  displayName?: string | null;
  photoURL?: string | null;
  email?: string | null;
  activeEmoticonKey?: string | null;
  activeBadgeKey?: string | null;
  activeTitleKey?: string | null;
}

// ─── Guild Raid Types ────────────────────────────────────────────────

/** 시즌별 레이드 보스 정의 */
export interface GuildRaidBoss {
  id: string;
  nameKey: string; // i18n key
  descriptionKey: string;
  element: CardElement;
  maxHp: number;
  imageIndex: number;
  season: string;
  /** 보스가 활성화되는 기간 (Unix ms) */
  activeFrom: number;
  activeUntil: number;
  /** 보스 처치 시 길드 전체 보상 */
  defeatReward: GuildRaidReward;
  /** 개인 기여도별 보상 티어 */
  contributionRewards: GuildRaidContributionTier[];
}

/** 레이드 보상 */
export interface GuildRaidReward {
  sns: number;
  guildExp: number;
  /** 코스메틱/소액 아이템 키 (서버 검증 불필요) */
  cosmeticItemKeys: string[];
}

/** 개인 기여도 티어 보상 */
export interface GuildRaidContributionTier {
  minDamage: number;
  reward: GuildRaidReward;
  tierNameKey: string;
}

/** 길드원별 레이드 기여도 */
export interface GuildRaidMemberContribution {
  uid: string;
  displayName: string;
  damage: number;
  attackCount: number;
  lastAttackAt: number;
  rewardsClaimed: boolean;
}

/** 길드 레이드 상태 (전체) */
export interface GuildRaidState {
  guildId: string;
  bossId: string;
  season: string;
  cumulativeDamage: number;
  bossHp: number;
  bossMaxHp: number;
  isDefeated: boolean;
  defeatedAt: number | null;
  contributions: GuildRaidMemberContribution[];
  createdAt: number;
  updatedAt: number;
}

/** 레이드 참여 결과 */
export interface RaidParticipationResult {
  damageDealt: number;
  cumulativeDamage: number;
  bossHpRemaining: number;
  isDefeated: boolean;
  personalContribution: GuildRaidMemberContribution;
}

/** 보상 수령 결과 */
export interface RaidRewardClaimResult {
  claimed: boolean;
  reward: GuildRaidReward | null;
  tierNameKey: string | null;
  reason?: string;
}

// ─── Battle Tactics & Gambit System Types (Items 393, 401) ───────────

export type TacticalStance = 'attack' | 'defense' | 'balanced';

export type GambitPriorityType = 
  | 'COUNTER_ELEMENT'   // 속성 상성 우위 타겟 우선 캡처
  | 'SECURE_CORNERS'     // 방어 취약 방지용 모서리 우선 선점
  | 'PRESERVE_ACE'       // 에이스(전설/고파워) 카드 후반 보존
  | 'SNIPE_HIGH_VALUE'   // 적 고가치 카드 저격 우선
  | 'INTERCEPT_SYNERGY'; // 적 연계/버프 타일 차단

export interface GambitConfig {
  slots: [GambitPriorityType, GambitPriorityType, GambitPriorityType];
  activeStance: TacticalStance;
  autoDisassembleNR: boolean; // Item 405: N/R 자동분해
}

// ─── Secret Achievement Stamp Book Types (Item 397) ─────────────────

export interface SecretStamp {
  id: string;
  titleKo: string;
  titleEn: string;
  descKo: string;
  descEn: string;
  icon: string;
  rewardType: 'gems' | 'sns' | 'title';
  rewardAmount: number;
  rewardTitle?: string;
  isUnlocked: boolean;
  unlockedAt?: number;
}

// ─── Hero Mastery & Evolution Types (Items 395, 403) ────────────────

export interface HeroMasteryRecord {
  cardId: number;
  battleCount: number;
  winCount: number;
  goldenMasteryUnlocked: boolean; // 50-win skin
  commanderVoiceUnlocked: boolean; // 100-battle voice & badge
}


/** 친구 대전 요청 */
export interface FriendBattleRequest {
  id: string;
  fromUid: string;
  fromName: string;
  toUid: string;
  toName: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'completed';
  createdAt: number;
  expiresAt: number;
  battleResult?: FriendBattleResult;
}

/** 친구 대전 결과 */
export interface FriendBattleResult {
  winnerId: string;
  loserId: string;
  battleLog: string[];
  rewardsClaimed: boolean;
}

/** 친구 목록 아이템 */
export interface FriendEntry {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  /** 마지막 대전 시간 */
  lastBattleAt: number | null;
  /** 함께한 대전 횟수 */
  battleCount: number;
  /** 현재 온라인 추정 */
  isOnline: boolean;
  /** 마지막 접속 시각 (Item 69) */
  lastActiveAt?: number | null;
}
