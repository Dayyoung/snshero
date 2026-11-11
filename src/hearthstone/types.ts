export type HeroClass =
  | 'PRIEST'
  | 'MAGE'
  | 'WARRIOR'
  | 'HUNTER'
  | 'PALADIN'
  | 'ROGUE'
  | 'SHAMAN'
  | 'WARLOCK'
  | 'DRUID';

export type CardClass = HeroClass | 'NEUTRAL' | 'DREAM';
export type CardType = 'MINION' | 'SPELL' | 'WEAPON' | 'HERO' | 'HERO_POWER';
export type CardRarity = 'FREE' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type PlayerSide = 'PLAYER' | 'OPPONENT';

export interface ClassicCardDef {
  id: string;
  vanId: string;
  dbfId?: number;
  name: string;
  text: string;
  flavor?: string;
  cardClass: CardClass;
  type: CardType;
  rarity: CardRarity;
  cost: number;
  attack?: number | null;
  health?: number | null;
  durability?: number | null;
  armor?: number | null;
  race?: string | null;
  mechanics: string[];
  referencedTags?: string[];
  spellDamage: number;
  overload: number;
  collectible: boolean;
  artId: string;
  stoneSortOrder?: number;
  snsCharId?: number;
  snsCharCode?: string;
  snsCharName?: string;
  snsFaction?: string;
  snsFactionKo?: string;
  artUrl?: string;
  bustUrl?: string;
  chibiUrl?: string;
  propUrl?: string | null;
  palette?: string[];
}

export interface HeroDef {
  heroClass: HeroClass;
  heroId: string;
  voKey: string;
  charId: number;
  nameKo: string;
  titleKo: string;
  classNameKo: string;
  factionRealmKo: string;
  heroPortraitUrl: string;
  heroCutoutUrl: string;
  heroPowerId: string;
  heroPowerNameKo: string;
  heroPowerTextKo: string;
  heroPowerNeedsTarget: boolean;
  accentColor: string;
  frameGradient: string;
  secretColor: string;
  emotesKo: {
    greetings: string;
    well_played: string;
    thanks: string;
    wow: string;
    oops: string;
    threaten: string;
    start: string;
    concede: string;
  };
}

export const CLASSIC_HEROES: Record<HeroClass, HeroDef> = {
  PRIEST: {
    heroClass: 'PRIEST',
    heroId: 'HERO_09',
    voKey: 'priest',
    charId: 41,
    nameKo: '카단',
    titleKo: '엘윈마을 설원의 눈히어로',
    classNameKo: '인간종족',
    factionRealmKo: '라이트헤븐',
    heroPortraitUrl: '/anime-character-sheets/busts/041_bust.jpg',
    heroCutoutUrl: '/anime-character-sheets/cutouts/041_Kadan.png',
    heroPowerId: 'HERO_09bp',
    heroPowerNameKo: '설원의 치유',
    heroPowerTextKo: '생명력을 2 회복시킵니다.',
    heroPowerNeedsTarget: true,
    accentColor: '#60a5fa',
    frameGradient: 'linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)',
    secretColor: '#e2e8f0',
    emotesKo: {
      greetings: '엘윈마을의 이름으로 인사드립니다!',
      well_played: '정말 훌륭한 한 수였어요!',
      thanks: '고맙습니다, 동료여.',
      wow: '은빛 단검이 공명할 만큼 놀랍군요!',
      oops: '앗, 성급한 판단이었네요.',
      threaten: '눈꽃 방패에 건 맹세로 당신을 넘어서겠습니다!',
      start: '엘윈마을의 별빛이여, 길을 밝혀라!',
      concede: '완패입니다. 당신의 기개를 인정합니다.',
    },
  },
  MAGE: {
    heroClass: 'MAGE',
    heroId: 'HERO_08',
    voKey: 'mage',
    charId: 10,
    nameKo: '포세이돈',
    titleKo: '심연 해역의 바다신',
    classNameKo: '물종족',
    factionRealmKo: '심연 해역',
    heroPortraitUrl: '/anime-character-sheets/busts/010_bust.jpg',
    heroCutoutUrl: '/anime-character-sheets/cutouts/010_Poseidon.png',
    heroPowerId: 'HERO_08bp',
    heroPowerNameKo: '심해 수압탄',
    heroPowerTextKo: '피해를 1 줍니다.',
    heroPowerNeedsTarget: true,
    accentColor: '#38bdf8',
    frameGradient: 'linear-gradient(180deg, #0284c7 0%, #0c4a6e 100%)',
    secretColor: '#38bdf8',
    emotesKo: {
      greetings: '태초의 해류가 그대를 맞이한다.',
      well_played: '심연처럼 깊은 지략이로군.',
      thanks: '바다의 이름으로 감사하마.',
      wow: '거대한 해일 같은 일격이군!',
      oops: '조류가 잠시 어긋났군.',
      threaten: '심연 해구의 수압으로 산산이 부숴주마!',
      start: '모든 물의 정령들이여, 내 삼지창에 답하라!',
      concede: '해류가 물러난다... 이번 승리는 그대의 것이다.',
    },
  },
  WARRIOR: {
    heroClass: 'WARRIOR',
    heroId: 'HERO_01',
    voKey: 'warrior',
    charId: 20,
    nameKo: '이그니시우스',
    titleKo: '불꽃 궁정의 태양황제',
    classNameKo: '불종족',
    factionRealmKo: '불꽃 궁정',
    heroPortraitUrl: '/anime-character-sheets/busts/020_bust.jpg',
    heroCutoutUrl: '/anime-character-sheets/cutouts/020_Ignisius.png',
    heroPowerId: 'HERO_01bp',
    heroPowerNameKo: '태양 갑주!',
    heroPowerTextKo: '방어도를 +2 얻습니다.',
    heroPowerNeedsTarget: false,
    accentColor: '#ef4444',
    frameGradient: 'linear-gradient(180deg, #dc2626 0%, #450a0a 100%)',
    secretColor: '#ef4444',
    emotesKo: {
      greetings: '불꽃 궁정의 열기를 견딜 수 있겠느냐.',
      well_played: '제법 뜨거운 투지로군.',
      thanks: '황제의 이름으로 치하하마.',
      wow: '초신성 같은 위력이군!',
      oops: '불길이 잠시 빗나갔다.',
      threaten: '태양신 대검으로 재조차 남기지 않겠다!',
      start: '최초의 불꽃이여, 전장을 불살라라!',
      concede: '내 불꽃이 사그라들다니... 기억해 두마!',
    },
  },
  HUNTER: {
    heroClass: 'HUNTER',
    heroId: 'HERO_05',
    voKey: 'hunter',
    charId: 30,
    nameKo: '바람신 토람',
    titleKo: '폭풍 바람섬의 천공신',
    classNameKo: '바람종족',
    factionRealmKo: '폭풍 바람섬',
    heroPortraitUrl: '/anime-character-sheets/busts/030_bust.jpg',
    heroCutoutUrl: '/anime-character-sheets/cutouts/030_Wind_God_Toram.png',
    heroPowerId: 'HERO_05bp',
    heroPowerNameKo: '폭풍 저격',
    heroPowerTextKo: '적 영웅에게 피해를 2 줍니다.',
    heroPowerNeedsTarget: false,
    accentColor: '#14b8a6',
    frameGradient: 'linear-gradient(180deg, #0d9488 0%, #134e4a 100%)',
    secretColor: '#2dd4bf',
    emotesKo: {
      greetings: '바람섬의 순풍이 함께하길.',
      well_played: '바람보다 날렵한 수였소.',
      thanks: '고맙소, 바람의 벗이여.',
      wow: '천공을 가르는 번개 같군!',
      oops: '난기류에 휩쓸렸군.',
      threaten: '쌍둥이 태풍이 네 숨통을 꿰뚫을 것이다!',
      start: '천공의 모든 폭풍이여, 사냥을 시작하자!',
      concede: '바람이 멎었군. 그대의 완승이오.',
    },
  },
  PALADIN: {
    heroClass: 'PALADIN',
    heroId: 'HERO_04',
    voKey: 'paladin',
    charId: 40,
    nameKo: '콜로서스',
    titleKo: '대지 성채의 태고거신',
    classNameKo: '땅종족',
    factionRealmKo: '대지 성채',
    heroPortraitUrl: '/anime-character-sheets/busts/040_bust.jpg',
    heroCutoutUrl: '/anime-character-sheets/cutouts/040_Colossus.png',
    heroPowerId: 'HERO_04bp',
    heroPowerNameKo: '성채 수호병 소집',
    heroPowerTextKo: '1/1 대지 성채 수호병을 소환합니다.',
    heroPowerNeedsTarget: false,
    accentColor: '#eab308',
    frameGradient: 'linear-gradient(180deg, #65a30d 0%, #365314 100%)',
    secretColor: '#fde047',
    emotesKo: {
      greetings: '대지 성채의 이름으로 문안하노라.',
      well_played: '반석처럼 단단한 전술이군.',
      thanks: '대지의 축복이 깃들기를.',
      wow: '산맥이 울릴 만한 기적이로군!',
      oops: '지반이 잠시 흔들렸군.',
      threaten: '대지 심장부의 분노로 심판하리라!',
      start: '성채의 결계를 펼쳐라, 한 걸음도 물러서지 않는다!',
      concede: '거신이 무릎을 꿇는다. 경이로운 승리다.',
    },
  },
  ROGUE: {
    heroClass: 'ROGUE',
    heroId: 'HERO_03',
    voKey: 'rogue',
    charId: 60,
    nameKo: '아르투스',
    titleKo: '섀도우렐름의 데스나이트 섭정',
    classNameKo: '언데드종족',
    factionRealmKo: '섀도우렐름',
    heroPortraitUrl: '/anime-character-sheets/busts/060_bust.jpg',
    heroCutoutUrl: '/anime-character-sheets/cutouts/060_Death_Knight_Artus.png',
    heroPowerId: 'HERO_03bp',
    heroPowerNameKo: '섀도우 단검술',
    heroPowerTextKo: '1/2 단검을 장착합니다.',
    heroPowerNeedsTarget: false,
    accentColor: '#a855f7',
    frameGradient: 'linear-gradient(180deg, #7c3aed 0%, #2e1065 100%)',
    secretColor: '#c084fc',
    emotesKo: {
      greetings: '붉은 유리 궁정의 밤안개에 온 걸 환영하지.',
      well_played: '꽤나 예리한 찌르기였군.',
      thanks: '기꺼이 받아두지.',
      wow: '서리 마검조차 떨릴 만한 위력이군!',
      oops: '그림자가 잠시 흔들렸군.',
      threaten: '네 영혼마저 얼어붙은 어둠 속에 가둬주마!',
      start: '섀도우렐름의 어둠이 모든 빛을 삼키리라.',
      concede: '이번 국면은 물러나지... 끝이라고 생각 마라.',
    },
  },
  SHAMAN: {
    heroClass: 'SHAMAN',
    heroId: 'HERO_02',
    voKey: 'shaman',
    charId: 70,
    nameKo: '에일라',
    titleKo: '달빛 실반의 초승달 대마도사',
    classNameKo: '엘프종족',
    factionRealmKo: '달빛 실반',
    heroPortraitUrl: '/anime-character-sheets/busts/070_bust.jpg',
    heroCutoutUrl: '/anime-character-sheets/cutouts/070_Aila.png',
    heroPowerId: 'HERO_02bp',
    heroPowerNameKo: '정령석 소환',
    heroPowerTextKo: '무작위 기본 정령석을 소환합니다.',
    heroPowerNeedsTarget: false,
    accentColor: '#22c55e',
    frameGradient: 'linear-gradient(180deg, #16a34a 0%, #14532d 100%)',
    secretColor: '#4ade80',
    emotesKo: {
      greetings: '달빛 실반의 은총이 그대를 비추기를.',
      well_played: '고대 룬의 이치를 꿰뚫으셨군요.',
      thanks: '실반의 이름으로 감사드려요.',
      wow: '별빛이 춤출 만큼 경이로운 마력이네요!',
      oops: '룬 배열이 한 획 어긋났군요.',
      threaten: '초승달의 마검과 정령석이 당신을 심판할 거예요!',
      start: '고대 문자의 비전이여, 실반의 숲을 수호하라!',
      concede: '아름다운 지략이었어요. 당신의 승리입니다.',
    },
  },
  WARLOCK: {
    heroClass: 'WARLOCK',
    heroId: 'HERO_07',
    voKey: 'warlock',
    charId: 80,
    nameKo: '아이언포지',
    titleKo: '딥포지 공방의 황금 거신병',
    classNameKo: '드워프종족',
    factionRealmKo: '딥포지 공방',
    heroPortraitUrl: '/anime-character-sheets/busts/080_bust.jpg',
    heroCutoutUrl: '/anime-character-sheets/cutouts/080_Ironforge.png',
    heroPowerId: 'HERO_07bp',
    heroPowerNameKo: '용광로 마력 전환',
    heroPowerTextKo: '피해를 2 입는 대신 카드를 뽑습니다.',
    heroPowerNeedsTarget: false,
    accentColor: '#f59e0b',
    frameGradient: 'linear-gradient(180deg, #b45309 0%, #451a03 100%)',
    secretColor: '#fbbf24',
    emotesKo: {
      greetings: '딥포지 왕국의 대장간 불꽃은 꺼지지 않는다!',
      well_played: '명장의 망치질처럼 정확한 수로군.',
      thanks: '고맙다, 강철의 전우여.',
      wow: '오리하르콘도 꿰뚫을 일격이군!',
      oops: '용광로 압력이 너무 높았군.',
      threaten: '별자리 룬 대방패 아래 가루로 빻아주마!',
      start: '딥포지의 용광로를 최대 출력으로 가동하라!',
      concede: '장갑이 한계에 달했군... 훌륭한 대결이었다!',
    },
  },
  DRUID: {
    heroClass: 'DRUID',
    heroId: 'HERO_06',
    voKey: 'druid',
    charId: 81,
    nameKo: '펜릴',
    titleKo: '야성 설원의 빙결늑대왕',
    classNameKo: '동물종족',
    factionRealmKo: '야성의 대지',
    heroPortraitUrl: '/anime-character-sheets/busts/081_bust.jpg',
    heroCutoutUrl: '/anime-character-sheets/cutouts/081_Fenrir.png',
    heroPowerId: 'HERO_06bp',
    heroPowerNameKo: '영수 각성',
    heroPowerTextKo: '이번 턴에 공격력 +1, 방어도 +1을 얻습니다.',
    heroPowerNeedsTarget: false,
    accentColor: '#f43f5e',
    frameGradient: 'linear-gradient(180deg, #be123c 0%, #4c0519 100%)',
    secretColor: '#fb7185',
    emotesKo: {
      greetings: '만년설 황야의 기개를 보여보아라.',
      well_played: '영수의 왕도 인정할 만한 발톱이군.',
      thanks: '기억해 두마, 인간의 벗이여.',
      wow: '대지를 가르는 포효로군!',
      oops: '사냥감의 발자국을 놓쳤군.',
      threaten: '서리 룬 발톱으로 네 목줄을 물어뜯어 주마!',
      start: '야성의 대지여, 늑대왕의 부름에 깨어나라!',
      concede: '강한 자가 승리하는 것이 야성의 법칙... 네 승리다.',
    },
  },
};

export const HERO_CLASS_ORDER: HeroClass[] = [
  'MAGE',
  'WARRIOR',
  'HUNTER',
  'PALADIN',
  'PRIEST',
  'ROGUE',
  'SHAMAN',
  'WARLOCK',
  'DRUID',
];

export type GameMode = 'RANKED' | 'CASUAL' | 'PRACTICE_NORMAL' | 'PRACTICE_EXPERT' | 'TUTORIAL';

export type ScreenName =
  | 'TAVERN_INTRO'
  | 'BOX_HUB'
  | 'HERO_SELECT'
  | 'COLLECTION'
  | 'PACK_OPENING'
  | 'BATTLE';

export type BoardThemeId = 'STORMWIND' | 'ORGRIMMAR' | 'PANDARIA';

export interface HandCardInstance {
  uid: string;
  cardId: string;
  costMod: number;
  createdBy?: string;
}

export interface WeaponInstance {
  uid: string;
  cardId: string;
  name: string;
  baseAttack: number;
  attack: number;
  durability: number;
  maxDurability: number;
  windfury: boolean;
}

export interface SecretInstance {
  uid: string;
  cardId: string;
  name: string;
  heroClass: HeroClass;
}

export interface MinionInstance {
  uid: string;
  cardId: string;
  name: string;
  owner: PlayerSide;
  playOrder: number;
  baseAttack: number;
  baseHealth: number;
  permAttack: number;
  tempAttack: number;
  maxHealth: number;
  health: number;
  auraAttack: number;
  auraHealth: number;
  race?: string | null;
  rarity: CardRarity;
  taunt: boolean;
  auraTaunt: boolean;
  divineShield: boolean;
  charge: boolean;
  auraCharge: boolean;
  windfury: boolean;
  stealth: boolean;
  concealedUntilNextTurn: boolean;
  frozen: boolean;
  freezeSkipClearedAtEndTurn: boolean;
  silenced: boolean;
  poisonous: boolean;
  elusive: boolean;
  cantAttack: boolean;
  spellDamage: number;
  exhausted: boolean;
  attacksMadeThisTurn: number;
  cannotReduceBelow1ThisTurn: boolean;
  soulOfTheForestCount: number;
  ancestralSpiritCount: number;
  blessingOfWisdomOwners: PlayerSide[];
  corruptionOwner: PlayerSide | null;
  powerOverwhelmingDieAtEndTurn: boolean;
  nightmareDestroyOwnerTurn: PlayerSide | null;
}

export interface CustomBattleHeroSpec {
  heroNameKo: string;
  titleKo: string;
  factionLabelKo: string;
  portraitUrl: string;
  heroPowerNameKo: string;
  heroPowerTextKo: string;
  heroPowerIconUrl?: string;
  accentColor: string;
  frameGradient: string;
  skyTop?: string;
  skyMid?: string;
  skyBot?: string;
  halo?: string;
  emotesKo: {
    greetings: string;
    well_played: string;
    thanks: string;
    wow: string;
    oops: string;
    threaten: string;
    start: string;
    concede: string;
  };
}

export interface PlayerBattleState {
  side: PlayerSide;
  name: string;
  heroClass: HeroClass;
  heroId: string;
  heroNameKo: string;
  customHero?: CustomBattleHeroSpec;
  isJaraxxus: boolean;
  heroPowerId: string;
  heroPowerNameKo: string;
  heroPowerTextKo: string;
  heroPowerNeedsTarget: boolean;
  shadowformTier: number;
  heroPowerUsedThisTurn: boolean;
  health: number;
  maxHealth: number;
  armor: number;
  tempAttack: number;
  attacksMadeThisTurn: number;
  frozen: boolean;
  freezeSkipClearedAtEndTurn: boolean;
  immuneThisTurn: boolean;
  weapon: WeaponInstance | null;
  mana: number;
  maxMana: number;
  overloadedMana: number;
  pendingOverload: number;
  fatigueCounter: number;
  cardsPlayedThisTurn: number;
  minionsPlayedThisTurn: number;
  nextSecretZeroThisTurn: boolean;
  nextSpellDiscountThisTurn: number;
  spellsZeroThisTurn: boolean;
  commandingShoutThisTurn: boolean;
  deck: string[];
  hand: HandCardInstance[];
  board: MinionInstance[];
  secrets: SecretInstance[];
  graveyard: string[];
}

export interface ActionHistoryItem {
  id: string;
  turn: number;
  actorSide: PlayerSide;
  cardId: string;
  title: string;
  detail: string;
  kind: 'PLAY_MINION' | 'CAST_SPELL' | 'EQUIP_WEAPON' | 'HERO_POWER' | 'ATTACK' | 'SECRET_TRIGGER' | 'TRIGGER';
  targetName?: string;
}

export type VfxKind =
  | 'FIREBALL'
  | 'FROSTBOLT'
  | 'ARCANE_BOLT'
  | 'LIGHTNING'
  | 'HOLY_LIGHT'
  | 'HOLY_NOVA'
  | 'FLAMESTRIKE'
  | 'BLIZZARD'
  | 'CONSECRATION'
  | 'SHADOW_BOLT'
  | 'NATURE_WRATH'
  | 'WHIRLWIND'
  | 'EXPLOSION'
  | 'DIVINE_BREAK'
  | 'SILENCE_RING'
  | 'SECRET_REVEAL'
  | 'DAMAGE_POP'
  | 'HEAL_POP'
  | 'ARMOR_POP'
  | 'BUFF_POP'
  | 'LEGENDARY_SLAM'
  | 'HERO_EXPLODE';

export interface VfxEvent {
  id: string;
  kind: VfxKind;
  sourceId?: string;
  targetId?: string;
  value?: number;
  label?: string;
  heroClass?: HeroClass;
  cardId?: string;
  createdAt: number;
}

export interface ChooseOnePrompt {
  sourceHandUid: string;
  cardId: string;
  insertIndex: number;
  options: {
    index: 0 | 1;
    optionCardId: string;
    title: string;
    description: string;
    needsTarget: boolean;
    validTargets: string[];
  }[];
}

export interface TrackingPrompt {
  cards: string[];
}

export interface JourneyBattleMeta {
  episode: number;
  reincarnation: number;
  episodeTitle: string;
  actTitle: string;
  opponentTitle: string;
  enemyHeroHealth: number;
  enemyStatScale: number;
  playerCardMultipliers: Record<string, number>;
}

export interface BattleMatchState {
  matchId: string;
  mode: GameMode;
  boardTheme: BoardThemeId;
  phase: 'MULLIGAN' | 'PLAYING' | 'GAME_OVER';
  turnNumber: number;
  activeSide: PlayerSide;
  firstPlayer: PlayerSide;
  playOrderSeq: number;
  mulliganSelectedUids: string[];
  player: PlayerBattleState;
  opponent: PlayerBattleState;
  chooseOnePrompt: ChooseOnePrompt | null;
  trackingPrompt: TrackingPrompt | null;
  winner: PlayerSide | null;
  turnSecondsLeft: number;
  maxTurnSeconds: number;
  history: ActionHistoryItem[];
  vfxQueue: VfxEvent[];
  bannerMessage: string | null;
  errorBanner: string | null;
  tutorialStep: number;
  journeyMeta?: JourneyBattleMeta;
}

export interface CustomDeck {
  id: string;
  name: string;
  heroClass: HeroClass;
  cards: string[];
  isPreset?: boolean;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  rewardGold: number;
  heroClass?: HeroClass;
  completed: boolean;
}

export type SnsCardBackId = 'gold' | 'silver' | 'bronze';

export interface MatchRewardBreakdown {
  mode: GameMode;
  didWin: boolean;
  goldEarned: number;
  baseWinGold: number;
  bonusGold: number;
  bonusLabel: string | null;
  questGold: number;
  packsEarned: number;
  packReason: string | null;
  prevRank: number;
  newRank: number;
  newStars: number;
  streakBonus: boolean;
  threeWinProgress: number;
  clearedEpisode?: number;
  nextEpisode?: number;
  nextReincarnation?: number;
  reincarnatedNow?: boolean;
}

export interface PlayerProfile {
  gold: number;
  arcaneDust: number;
  packs: number;
  rank: number;
  stars: number;
  winStreak: number;
  totalWins: number;
  totalGames: number;
  classWins: Record<HeroClass, number>;
  selectedCardBack: SnsCardBackId;
  masterUnlocked: boolean;
  threeWinCounter: number;
  journeyGuideDone: boolean;
  journeyEpisode: number;
  journeyReincarnation: number;
  journeyMaxStageCleared: number;
  practiceNormalCleared: HeroClass[];
  practiceExpertCleared: HeroClass[];
}
