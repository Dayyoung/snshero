export type HeroClass =
  | 'MAGE'
  | 'WARRIOR'
  | 'HUNTER'
  | 'PALADIN'
  | 'PRIEST'
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
}

export interface HeroDef {
  heroClass: HeroClass;
  heroId: string;
  voKey: string;
  nameKo: string;
  titleKo: string;
  classNameKo: string;
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
  MAGE: {
    heroClass: 'MAGE',
    heroId: 'HERO_08',
    voKey: 'mage',
    nameKo: '제이나 프라우드무어',
    titleKo: '키린 토의 대마법사',
    classNameKo: '마법사',
    heroPowerId: 'HERO_08bp',
    heroPowerNameKo: '화염 작렬',
    heroPowerTextKo: '피해를 1 줍니다.',
    heroPowerNeedsTarget: true,
    accentColor: '#38bdf8',
    frameGradient: 'linear-gradient(180deg, #2b6cb0 0%, #1a365d 100%)',
    secretColor: '#f472b6',
    emotesKo: {
      greetings: '안녕하세요.',
      well_played: '훌륭해요.',
      thanks: '고마워요.',
      wow: '놀랍군요!',
      oops: '이런, 실수했네요.',
      threaten: '내 마법이 당신을 조각낼 거예요!',
      start: '당신이 자초한 일이에요!',
      concede: '이번엔 당신이 이겼어요.',
    },
  },
  WARRIOR: {
    heroClass: 'WARRIOR',
    heroId: 'HERO_01',
    voKey: 'warrior',
    nameKo: '가로쉬 헬스크림',
    titleKo: '호드의 대족장',
    classNameKo: '전사',
    heroPowerId: 'HERO_01bp',
    heroPowerNameKo: '방어도 증가!',
    heroPowerTextKo: '방어도를 +2 얻습니다.',
    heroPowerNeedsTarget: false,
    accentColor: '#ef4444',
    frameGradient: 'linear-gradient(180deg, #9b2c2c 0%, #4a1212 100%)',
    secretColor: '#ef4444',
    emotesKo: {
      greetings: '반갑다.',
      well_played: '제법이군.',
      thanks: '고맙군.',
      wow: '놀랍군!',
      oops: '실수였다.',
      threaten: '너를 박살 내주마!',
      start: '승리가 아니면 죽음을!',
      concede: '내가 졌다... 이번뿐이다!',
    },
  },
  HUNTER: {
    heroClass: 'HUNTER',
    heroId: 'HERO_05',
    voKey: 'hunter',
    nameKo: '렉사르',
    titleKo: '호드의 용사',
    classNameKo: '사냥꾼',
    heroPowerId: 'HERO_05bp',
    heroPowerNameKo: '고정 사격',
    heroPowerTextKo: '적 영웅에게 피해를 2 줍니다.',
    heroPowerNeedsTarget: false,
    accentColor: '#22c55e',
    frameGradient: 'linear-gradient(180deg, #276749 0%, #143625 100%)',
    secretColor: '#4ade80',
    emotesKo: {
      greetings: '반갑소, 여행자여.',
      well_played: '잘 싸웠소.',
      thanks: '고맙소.',
      wow: '대단하군!',
      oops: '조준이 빗나갔군.',
      threaten: '사냥을 시작하겠다!',
      start: '사냥을 시작하자!',
      concede: '잘 싸웠소. 내가 졌군.',
    },
  },
  PALADIN: {
    heroClass: 'PALADIN',
    heroId: 'HERO_04',
    voKey: 'paladin',
    nameKo: '우서 라이트브링어',
    titleKo: '은빛 성기사단의 수장',
    classNameKo: '성기사',
    heroPowerId: 'HERO_04bp',
    heroPowerNameKo: '병력 충원',
    heroPowerTextKo: '1/1 은빛 성기사단 신병을 소환합니다.',
    heroPowerNeedsTarget: false,
    accentColor: '#facc15',
    frameGradient: 'linear-gradient(180deg, #b7791f 0%, #5f3dc4 0%, #68440e 100%)',
    secretColor: '#fde047',
    emotesKo: {
      greetings: '반갑네!',
      well_played: '훌륭하군.',
      thanks: '고맙네.',
      wow: '빛이시여!',
      oops: '실수였군.',
      threaten: '정의의 심판을 받아라!',
      start: '명예를 위하여 싸우리라!',
      concede: '그대의 승리일세, 친구여.',
    },
  },
  PRIEST: {
    heroClass: 'PRIEST',
    heroId: 'HERO_09',
    voKey: 'priest',
    nameKo: '안두인 린',
    titleKo: '스톰윈드의 왕자',
    classNameKo: '사제',
    heroPowerId: 'HERO_09bp',
    heroPowerNameKo: '하급 치유',
    heroPowerTextKo: '생명력을 2 회복시킵니다.',
    heroPowerNeedsTarget: true,
    accentColor: '#f8fafc',
    frameGradient: 'linear-gradient(180deg, #cbd5e1 0%, #475569 100%)',
    secretColor: '#e2e8f0',
    emotesKo: {
      greetings: '안녕하세요.',
      well_played: '잘하셨어요.',
      thanks: '감사합니다.',
      wow: '정말 놀랍군요!',
      oops: '계획대로 되지 않았네요.',
      threaten: '빛이 당신을 태워버릴 것입니다!',
      start: '빛이 승리를 가져다줄 것입니다!',
      concede: '당신이 저를 압도했군요.',
    },
  },
  ROGUE: {
    heroClass: 'ROGUE',
    heroId: 'HERO_03',
    voKey: 'rogue',
    nameKo: '발리라 생귀나르',
    titleKo: '대자객',
    classNameKo: '도적',
    heroPowerId: 'HERO_03bp',
    heroPowerNameKo: '단검의 대가',
    heroPowerTextKo: '1/2 단검을 장착합니다.',
    heroPowerNeedsTarget: false,
    accentColor: '#94a3b8',
    frameGradient: 'linear-gradient(180deg, #334155 0%, #0f172a 100%)',
    secretColor: '#a855f7',
    emotesKo: {
      greetings: '기쁨은 제 몫이죠.',
      well_played: '훌륭하군요.',
      thanks: '고마워요.',
      wow: '믿을 수가 없군요!',
      oops: '실수가 있었네요.',
      threaten: '네 최후가 눈앞에 있다!',
      start: '등 뒤를 조심해.',
      concede: '포기하겠어요.',
    },
  },
  SHAMAN: {
    heroClass: 'SHAMAN',
    heroId: 'HERO_02',
    voKey: 'shaman',
    nameKo: '스랄',
    titleKo: '대지 고리회의 선견자',
    classNameKo: '주술사',
    heroPowerId: 'HERO_02bp',
    heroPowerNameKo: '토템 소환',
    heroPowerTextKo: '무작위 기본 토템을 소환합니다.',
    heroPowerNeedsTarget: false,
    accentColor: '#3b82f6',
    frameGradient: 'linear-gradient(180deg, #1d4ed8 0%, #172554 100%)',
    secretColor: '#60a5fa',
    emotesKo: {
      greetings: '반갑네, 친구여.',
      well_played: '잘했네.',
      thanks: '고맙네.',
      wow: '믿을 수 없군!',
      oops: '그건 실수였네.',
      threaten: '정령들이 너를 파괴할 것이다!',
      start: '둠해머를 위하여!',
      concede: '이번 판은 자네가 이겼네, 친구.',
    },
  },
  WARLOCK: {
    heroClass: 'WARLOCK',
    heroId: 'HERO_07',
    voKey: 'warlock',
    nameKo: '굴단',
    titleKo: '어둠의 화신',
    classNameKo: '흑마법사',
    heroPowerId: 'HERO_07bp',
    heroPowerNameKo: '생명력 전환',
    heroPowerTextKo: '피해를 2 입는 대신 카드를 뽑습니다.',
    heroPowerNeedsTarget: false,
    accentColor: '#a855f7',
    frameGradient: 'linear-gradient(180deg, #6b21a8 0%, #2e1065 100%)',
    secretColor: '#c084fc',
    emotesKo: {
      greetings: '반갑군.',
      well_played: '제법이군.',
      thanks: '고맙군.',
      wow: '비범하군!',
      oops: '실수였다.',
      threaten: '네 영혼은 내 것이다!',
      start: '네 영혼에 고통을 안겨주마!',
      concede: '이번엔 네가 이겼다!',
    },
  },
  DRUID: {
    heroClass: 'DRUID',
    heroId: 'HERO_06',
    voKey: 'druid',
    nameKo: '말퓨리온 스톰레이지',
    titleKo: '대드루이드',
    classNameKo: '드루이드',
    heroPowerId: 'HERO_06bp',
    heroPowerNameKo: '변신',
    heroPowerTextKo: '이번 턴에 공격력 +1, 방어도 +1을 얻습니다.',
    heroPowerNeedsTarget: false,
    accentColor: '#d97706',
    frameGradient: 'linear-gradient(180deg, #92400e 0%, #451a03 100%)',
    secretColor: '#fbbf24',
    emotesKo: {
      greetings: '반갑소.',
      well_played: '흠, 잘했군.',
      thanks: '고맙소.',
      wow: '경이롭군!',
      oops: '당연한 실수였군.',
      threaten: '대자연이 그대를 거부하리라!',
      start: '자연을 수호하리라!',
      concede: '인정하오. 그대가 이겼소.',
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
  costMod: number; // permanent cost modifier on this hand instance (e.g. Shadowstep -2, Far Sight -3, Freezing Trap +2)
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
  permAttack: number; // baseAttack + permanent buffs
  tempAttack: number; // this-turn buffs (Abusive Sergeant, Savage Roar, Bloodlust, etc.)
  maxHealth: number;
  health: number;
  auraAttack: number; // recalculated continuously
  auraHealth: number; // recalculated continuously
  race?: string | null;
  rarity: CardRarity;
  // Keyword states
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
  elusive: boolean; // Cannot be targeted by spells or hero powers
  cantAttack: boolean;
  spellDamage: number;
  // Turn / Attack tracking
  exhausted: boolean; // Summoning sickness
  attacksMadeThisTurn: number;
  cannotReduceBelow1ThisTurn: boolean;
  // Enchantments & extra Deathrattles
  soulOfTheForestCount: number; // summon 2/2 Treant on death
  ancestralSpiritCount: number; // resummon self on death
  blessingOfWisdomOwners: PlayerSide[]; // draw card for owner(s) on attack
  corruptionOwner: PlayerSide | null; // destroy at start of corruptionOwner's turn
  powerOverwhelmingDieAtEndTurn: boolean; // die at end of turn (Power Overwhelming / Force of Nature)
  nightmareDestroyOwnerTurn: PlayerSide | null; // Nightmare destroy at start of owner's turn
}

export interface PlayerBattleState {
  side: PlayerSide;
  name: string;
  heroClass: HeroClass;
  heroId: string;
  heroNameKo: string;
  isJaraxxus: boolean;
  heroPowerId: string;
  heroPowerNameKo: string;
  heroPowerTextKo: string;
  heroPowerNeedsTarget: boolean;
  shadowformTier: number; // 0 = normal, 1 = Mind Spike (2 dmg), 2 = Mind Shatter (3 dmg)
  heroPowerUsedThisTurn: boolean;
  health: number;
  maxHealth: number;
  armor: number;
  tempAttack: number; // Heroic Strike, Claw, Bite, Shapeshift, Savage Roar
  attacksMadeThisTurn: number;
  frozen: boolean;
  freezeSkipClearedAtEndTurn: boolean;
  immuneThisTurn: boolean;
  weapon: WeaponInstance | null;
  mana: number;
  maxMana: number;
  overloadedMana: number; // locked RIGHT NOW this turn
  pendingOverload: number; // locked NEXT turn
  fatigueCounter: number;
  cardsPlayedThisTurn: number;
  minionsPlayedThisTurn: number;
  nextSecretZeroThisTurn: boolean; // Kirin Tor Mage
  nextSpellDiscountThisTurn: number; // Preparation (-3)
  spellsZeroThisTurn: boolean; // Millhouse Manastorm
  commandingShoutThisTurn: boolean;
  deck: string[]; // cardIds from top [0] to bottom
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
  sourceId?: string; // 'PLAYER_HERO' | 'OPPONENT_HERO' | minion uid
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
  cards: string[]; // up to 3 top cardIds
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
}

export interface CustomDeck {
  id: string;
  name: string;
  heroClass: HeroClass;
  cards: string[]; // 30 cardIds
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

export interface PlayerProfile {
  gold: number;
  arcaneDust: number;
  packs: number;
  rank: number; // 25 down to 1, 0 = Legend
  stars: number;
  winStreak: number;
  totalWins: number;
  totalGames: number;
  classWins: Record<HeroClass, number>;
  selectedCardBack: 'classic' | 'legend' | 'frost' | 'gold';
  masterUnlocked: boolean;
  threeWinCounter: number;
}
