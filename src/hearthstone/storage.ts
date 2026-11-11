import {
  CLASSIC_PRESET_DECKS,
  CRAFTING_COST,
  DISENCHANT_VALUE,
  cardDb,
  getStarsNeededForRank,
} from './cardDb';
import {
  CardRarity,
  ClassicCardDef,
  CustomDeck,
  DailyQuest,
  GameMode,
  HERO_CLASS_ORDER,
  HeroClass,
  MatchRewardBreakdown,
  PlayerProfile,
} from './types';

const KEYS = {
  PROFILE: 'hero_hs_profile',
  COLLECTION: 'hero_hs_collection',
  DECKS: 'hero_hs_decks',
  QUESTS: 'hero_hs_quests',
  PITY: 'hero_hs_pack_pity',
  LORE_VER: 'hero_hs_lore_version',
};

const CURRENT_LORE_VERSION = 'snshero_v3';

export type CollectionMap = Record<string, number>;

export interface OpenedPackCard {
  card: ClassicCardDef;
  isGolden: boolean;
  isNew: boolean;
  newOwnedCount: number;
  newJourneyMultiplier: number;
}

export interface GoldPackBundleDef {
  id: string;
  packs: number;
  costGold: number;
  label: string;
  badge?: string;
}

export const GOLD_PACK_BUNDLES: GoldPackBundleDef[] = [
  {
    id: 'gold_pack_1',
    packs: 1,
    costGold: 100,
    label: '눈히어로 1팩',
  },
  {
    id: 'gold_pack_5',
    packs: 5,
    costGold: 450,
    label: '눈히어로 5팩 묶음',
    badge: '10% 할인 (-50G)',
  },
  {
    id: 'gold_pack_10',
    packs: 10,
    costGold: 850,
    label: '눈히어로 10팩 상자',
    badge: '15% 할인 (-150G)',
  },
];

export interface ModeRewardGuide {
  mode: GameMode;
  modeNameKo: string;
  playStyleBadge: string;
  baseWinRewardText: string;
  specialBonusText: string;
  summaryOneLine: string;
}

export const MODE_REWARD_GUIDES: Record<GameMode, ModeRewardGuide> = {
  TUTORIAL: {
    mode: 'TUTORIAL',
    modeNameKo: '카단의 여정 (스토리 RPG)',
    playStyleBadge: '자동 플레이 기본 · 3장=3배 강화 적용',
    baseWinRewardText: '승리 시 45G~240G+ (회차·환생 비례 증가)',
    specialBonusText: '최초 돌파 +30G · 5화마다 보스 팩 +1개 · 40화 완주 시 +300G & 팩 +3개 + 환생 개방',
    summaryOneLine: '회차 돌파 골드 + 5화 단위 눈히어로 팩 + 40화 완주 시 3팩 & 환생 보너스',
  },
  RANKED: {
    mode: 'RANKED',
    modeNameKo: '대전 · 등급전',
    playStyleBadge: '수동 플레이 기본 · 정통 1배 룰',
    baseWinRewardText: '1승당 +25 골드 + 등급 별 ★+1 획득',
    specialBonusText: '3승 달성마다 +30G 추가 · 3연승 시 별 ★+2 상승 · 전설 등급 도전',
    summaryOneLine: '승리 시 +25G · 3승마다 +30G 보너스 · 등급 별(★) 승급',
  },
  CASUAL: {
    mode: 'CASUAL',
    modeNameKo: '대전 · 일반전',
    playStyleBadge: '수동 플레이 기본 · 정통 1배 룰',
    baseWinRewardText: '1승당 +15 골드 (패배 시 등급 하락 없음)',
    specialBonusText: '3승 달성마다 +20G 추가 · 일일 의뢰 안전한 달성',
    summaryOneLine: '승리 시 +15G · 3승마다 +20G 보너스 · 등급 하락 없음',
  },
  PRACTICE_NORMAL: {
    mode: 'PRACTICE_NORMAL',
    modeNameKo: '엘윈마을 수련 · 일반',
    playStyleBadge: '수동 플레이 기본 · 정통 1배 룰',
    baseWinRewardText: '1승당 +10 골드',
    specialBonusText: '9개 종족별 최초 제압 시 각 +25G 보너스 (총 +225G)',
    summaryOneLine: '승리 시 +10G · 종족 최초 제압 +25G 보너스',
  },
  PRACTICE_EXPERT: {
    mode: 'PRACTICE_EXPERT',
    modeNameKo: '엘윈마을 수련 · 숙련가',
    playStyleBadge: '수동 플레이 기본 · 정통 1배 룰',
    baseWinRewardText: '1승당 +20 골드',
    specialBonusText: '종족별 최초 제압 +50G · 9종족 숙련가 올클리어 시 눈히어로 팩 +2개 지급',
    summaryOneLine: '승리 시 +20G · 최초 제압 +50G · 9종족 올클리어 +2팩',
  },
};

export function hasCombatStatsForJourney(card: ClassicCardDef): boolean {
  return card.type === 'MINION' || card.type === 'WEAPON';
}

/**
 * 카단의 여정 전용 중복 카드 배수 법칙:
 * - 공격력/체력(또는 내구도)이 있는 하수인·무기 카드가 3장 이상 보유된 경우 보유 장수만큼 배수 증가 (3장=3배, 4장=4배, N장=N배)
 * - 전설(LEGENDARY) 카드는 기본 제한이 1장이므로 2장 보유 시 2배, 3장 이상 보유 시 N배 적용
 */
export function getJourneyCardMultiplier(card: ClassicCardDef, ownedCount: number): number {
  if (!hasCombatStatsForJourney(card)) return 1;
  if (ownedCount >= 3) return ownedCount;
  if (card.rarity === 'LEGENDARY' && ownedCount >= 2) return ownedCount;
  return 1;
}

function emitStateChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snshero:state-changed'));
  }
}

function normalizeCardBack(raw: unknown): PlayerProfile['selectedCardBack'] {
  if (raw === 'silver' || raw === 'frost') return 'silver';
  if (raw === 'bronze') return 'bronze';
  return 'gold';
}

function defaultProfile(): PlayerProfile {
  const classWins = {} as Record<HeroClass, number>;
  for (const c of HERO_CLASS_ORDER) classWins[c] = 0;
  return {
    gold: 250,
    arcaneDust: 160,
    packs: 3,
    rank: 25,
    stars: 0,
    winStreak: 0,
    totalWins: 0,
    totalGames: 0,
    classWins,
    selectedCardBack: 'gold',
    masterUnlocked: false,
    threeWinCounter: 0,
    journeyGuideDone: false,
    journeyEpisode: 1,
    journeyReincarnation: 0,
    journeyMaxStageCleared: 0,
    practiceNormalCleared: [],
    practiceExpertCleared: [],
  };
}

function defaultQuests(): DailyQuest[] {
  return [
    {
      id: 'q_win_3',
      title: '엘윈마을의 승부사',
      description: '여정·대전·수련 중 아무 모드에서 2승 달성',
      progress: 0,
      goal: 2,
      rewardGold: 60,
      completed: false,
    },
    {
      id: 'q_play_minions',
      title: '눈히어로 동료 소집',
      description: '영웅 동료(하수인) 15명 소환하기',
      progress: 0,
      goal: 15,
      rewardGold: 40,
      completed: false,
    },
    {
      id: 'q_cast_spells',
      title: '별빛의 호흡 비전 수련',
      description: '비전 주문 10회 시전하기',
      progress: 0,
      goal: 10,
      rewardGold: 50,
      completed: false,
    },
  ];
}

export interface MassDisenchantPreview {
  extraCardCount: number;
  affectedUniqueCards: number;
  dustGained: number;
  sampleAffectedCards: { id: string; name: string; owned: number; afterCount: number }[];
}

class HearthstoneStorage {
  ensureInitialized() {
    if (!localStorage.getItem(KEYS.PROFILE)) {
      this.saveProfile(defaultProfile());
    }
    if (!localStorage.getItem(KEYS.COLLECTION)) {
      const col: CollectionMap = {};
      for (const c of cardDb.getAllCollectible()) {
        if (c.rarity === 'FREE') {
          col[c.id] = 2;
        }
      }
      for (const deck of CLASSIC_PRESET_DECKS) {
        const counts: Record<string, number> = {};
        for (const cid of deck.cards) {
          counts[cid] = (counts[cid] || 0) + 1;
        }
        for (const [cid, cnt] of Object.entries(counts)) {
          col[cid] = Math.max(col[cid] || 0, cnt);
        }
      }
      this.saveCollection(col);
    }
    if (!localStorage.getItem(KEYS.DECKS)) {
      this.saveDecks(CLASSIC_PRESET_DECKS.map((d) => ({ ...d, cards: [...d.cards] })));
    }
    if (!localStorage.getItem(KEYS.QUESTS)) {
      this.saveQuests(defaultQuests());
    }

    if (localStorage.getItem(KEYS.LORE_VER) !== CURRENT_LORE_VERSION) {
      const p = this.getProfile();
      // If untouched legacy starter profile had 15 packs and 0 games, normalize to 3 starter packs
      if (p.totalGames === 0 && p.packs === 15) {
        p.packs = 3;
        p.gold = 250;
        p.journeyGuideDone = false;
      }
      this.saveProfile(p);

      const presetById = new Map(CLASSIC_PRESET_DECKS.map((d) => [d.id, d]));
      const existingDecks = this.getDecks();
      const customOnly = existingDecks.filter((d) => !d.isPreset && !presetById.has(d.id));
      const migratedPresets = CLASSIC_PRESET_DECKS.map((preset) => {
        const prev = existingDecks.find((d) => d.id === preset.id);
        return {
          ...preset,
          cards: prev && prev.cards.length === 30 ? [...prev.cards] : [...preset.cards],
        };
      });
      this.saveDecks([...migratedPresets, ...customOnly]);

      const freshQuests = defaultQuests();
      const prevQuests = this.getQuests();
      const migratedQuests = freshQuests.map((fq) => {
        const old = prevQuests.find((pq) => pq.id === fq.id);
        return old
          ? {
              ...fq,
              progress: Math.min(fq.goal, old.progress || 0),
              completed: Boolean(old.completed),
            }
          : fq;
      });
      this.saveQuests(migratedQuests);
      localStorage.setItem(KEYS.LORE_VER, CURRENT_LORE_VERSION);
    }
  }

  getProfile(): PlayerProfile {
    try {
      const raw = localStorage.getItem(KEYS.PROFILE);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...defaultProfile(),
          ...parsed,
          selectedCardBack: normalizeCardBack(parsed?.selectedCardBack),
          journeyEpisode: Math.max(1, Math.min(40, Number(parsed?.journeyEpisode) || 1)),
          journeyReincarnation: Math.max(0, Number(parsed?.journeyReincarnation) || 0),
          journeyMaxStageCleared: Math.max(0, Number(parsed?.journeyMaxStageCleared) || 0),
          practiceNormalCleared: Array.isArray(parsed?.practiceNormalCleared)
            ? parsed.practiceNormalCleared
            : [],
          practiceExpertCleared: Array.isArray(parsed?.practiceExpertCleared)
            ? parsed.practiceExpertCleared
            : [],
        };
      }
    } catch {
      // ignore
    }
    return defaultProfile();
  }

  saveProfile(p: PlayerProfile) {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(p));
    emitStateChanged();
  }

  markJourneyGuideDone() {
    const p = this.getProfile();
    if (!p.journeyGuideDone) {
      p.journeyGuideDone = true;
      this.saveProfile(p);
    }
  }

  getCollection(): CollectionMap {
    try {
      const raw = localStorage.getItem(KEYS.COLLECTION);
      if (raw) return JSON.parse(raw) as CollectionMap;
    } catch {
      // ignore
    }
    return {};
  }

  saveCollection(col: CollectionMap) {
    localStorage.setItem(KEYS.COLLECTION, JSON.stringify(col));
    emitStateChanged();
  }

  getDecks(): CustomDeck[] {
    try {
      const raw = localStorage.getItem(KEYS.DECKS);
      if (raw) {
        const parsed = JSON.parse(raw) as CustomDeck[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return CLASSIC_PRESET_DECKS;
  }

  saveDecks(decks: CustomDeck[]) {
    localStorage.setItem(KEYS.DECKS, JSON.stringify(decks));
    emitStateChanged();
  }

  getQuests(): DailyQuest[] {
    try {
      const raw = localStorage.getItem(KEYS.QUESTS);
      if (raw) return JSON.parse(raw) as DailyQuest[];
    } catch {
      // ignore
    }
    return defaultQuests();
  }

  saveQuests(quests: DailyQuest[]) {
    localStorage.setItem(KEYS.QUESTS, JSON.stringify(quests));
    emitStateChanged();
  }

  buyPacksWithGold(count: number): boolean {
    return this.buyPackBundleWithGold(count, count * 100);
  }

  buyPackBundleWithGold(packs: number, costGold: number): boolean {
    const p = this.getProfile();
    if (packs <= 0 || costGold <= 0 || p.gold < costGold) return false;
    p.gold -= costGold;
    p.packs += packs;
    this.saveProfile(p);
    return true;
  }

  openOnePack(): OpenedPackCard[] | null {
    const p = this.getProfile();
    if (p.packs <= 0) return null;
    p.packs -= 1;
    this.saveProfile(p);

    const col = this.getCollection();
    const allCollectible = cardDb.getAllCollectible();
    const byRarity: Record<CardRarity, ClassicCardDef[]> = {
      FREE: allCollectible.filter((c) => c.rarity === 'FREE'),
      COMMON: allCollectible.filter((c) => c.rarity === 'COMMON' || c.rarity === 'FREE'),
      RARE: allCollectible.filter((c) => c.rarity === 'RARE'),
      EPIC: allCollectible.filter((c) => c.rarity === 'EPIC'),
      LEGENDARY: allCollectible.filter((c) => c.rarity === 'LEGENDARY'),
    };

    let pity = Number(localStorage.getItem(KEYS.PITY) || '0') + 1;
    const rollRarity = (forceRareOrBetter: boolean): CardRarity => {
      const r = Math.random();
      if (pity >= 15 || r < 0.035) {
        pity = 0;
        return 'LEGENDARY';
      }
      if (r < 0.12) return 'EPIC';
      if (forceRareOrBetter || r < 0.35) return 'RARE';
      return 'COMMON';
    };

    const rarities: CardRarity[] = [
      rollRarity(false),
      rollRarity(false),
      rollRarity(false),
      rollRarity(false),
      rollRarity(false),
    ];
    if (!rarities.some((rar) => rar !== 'COMMON')) {
      rarities[Math.floor(Math.random() * 5)] = rollRarity(true);
    }
    localStorage.setItem(KEYS.PITY, String(pity));

    const results: OpenedPackCard[] = rarities.map((rar, slotIdx) => {
      const pool = byRarity[rar].length > 0 ? byRarity[rar] : byRarity.COMMON;
      let picked = pool[Math.floor(Math.random() * pool.length)];

      // Gentle progression aid on slot 0: help owned combat cards reach 3+ stack for Journey mode
      if (slotIdx === 0 && rar === 'COMMON' && Math.random() < 0.42) {
        const upgradeCandidates = pool.filter(
          (c) => hasCombatStatsForJourney(c) && (col[c.id] || 0) >= 2 && (col[c.id] || 0) < 5,
        );
        if (upgradeCandidates.length > 0) {
          picked = upgradeCandidates[Math.floor(Math.random() * upgradeCandidates.length)];
        }
      }

      const prevCount = col[picked.id] || 0;
      const nextCount = prevCount + 1;
      col[picked.id] = nextCount;
      return {
        card: picked,
        isGolden: Math.random() < 0.08,
        isNew: prevCount === 0,
        newOwnedCount: nextCount,
        newJourneyMultiplier: getJourneyCardMultiplier(picked, nextCount),
      };
    });

    this.saveCollection(col);
    return results;
  }

  craftCard(cardId: string): { ok: boolean; reason?: string } {
    const def = cardDb.getCard(cardId);
    if (!def) {
      return { ok: false, reason: '존재하지 않는 카드입니다.' };
    }
    const cost = def.rarity === 'FREE' ? 40 : CRAFTING_COST[def.rarity] || 40;
    const p = this.getProfile();
    if (p.arcaneDust < cost) {
      return { ok: false, reason: `영웅 가루가 부족합니다. (필요: ${cost})` };
    }
    const col = this.getCollection();
    if ((col[cardId] || 0) >= 99) {
      return { ok: false, reason: '최대 보유 한도(99장)에 도달했습니다.' };
    }
    p.arcaneDust -= cost;
    col[cardId] = (col[cardId] || 0) + 1;
    this.saveProfile(p);
    this.saveCollection(col);
    return { ok: true };
  }

  disenchantCard(cardId: string): { ok: boolean; reason?: string } {
    const def = cardDb.getCard(cardId);
    if (!def) {
      return { ok: false, reason: '존재하지 않는 카드입니다.' };
    }
    if (def.rarity === 'FREE' && (this.getCollection()[cardId] || 0) <= 2) {
      return { ok: false, reason: '기본 카드 최소 수량(2장)은 마력을 추출할 수 없습니다.' };
    }
    const col = this.getCollection();
    if ((col[cardId] || 0) <= 0) {
      return { ok: false, reason: '보유한 카드가 없습니다.' };
    }
    const val = def.rarity === 'FREE' ? 5 : DISENCHANT_VALUE[def.rarity] || 5;
    col[cardId] -= 1;
    if (col[cardId] <= 0) delete col[cardId];
    const p = this.getProfile();
    p.arcaneDust += val;
    this.saveProfile(p);
    this.saveCollection(col);
    return { ok: true };
  }

  previewMassDisenchant(): MassDisenchantPreview {
    const col = this.getCollection();
    let extraCardCount = 0;
    let affectedUniqueCards = 0;
    let dustGained = 0;
    const sampleAffectedCards: MassDisenchantPreview['sampleAffectedCards'] = [];

    for (const c of cardDb.getAllCollectible()) {
      const limit = c.rarity === 'LEGENDARY' ? 1 : 2;
      const owned = col[c.id] || 0;
      if (owned > limit) {
        const extra = owned - limit;
        const unitDust = c.rarity === 'FREE' ? 5 : DISENCHANT_VALUE[c.rarity] || 5;
        extraCardCount += extra;
        affectedUniqueCards += 1;
        dustGained += extra * unitDust;
        if (sampleAffectedCards.length < 6) {
          sampleAffectedCards.push({
            id: c.id,
            name: c.name,
            owned,
            afterCount: limit,
          });
        }
      }
    }

    return {
      extraCardCount,
      affectedUniqueCards,
      dustGained,
      sampleAffectedCards,
    };
  }

  massDisenchantExtras(): { count: number; dustGained: number } {
    const col = this.getCollection();
    let count = 0;
    let dustGained = 0;
    for (const c of cardDb.getAllCollectible()) {
      const limit = c.rarity === 'LEGENDARY' ? 1 : 2;
      const owned = col[c.id] || 0;
      if (owned > limit) {
        const extra = owned - limit;
        const unitDust = c.rarity === 'FREE' ? 5 : DISENCHANT_VALUE[c.rarity] || 5;
        count += extra;
        dustGained += extra * unitDust;
        col[c.id] = limit;
      }
    }
    if (count > 0) {
      const p = this.getProfile();
      p.arcaneDust += dustGained;
      this.saveProfile(p);
      this.saveCollection(col);
    }
    return { count, dustGained };
  }

  grantPacks(count: number): void {
    const safeCount = Math.max(0, Math.floor(count));
    if (safeCount <= 0) return;
    const p = this.getProfile();
    p.packs += safeCount;
    this.saveProfile(p);
  }

  setJourneyProgress(episode: number, reincarnation = 0): void {
    const p = this.getProfile();
    p.journeyEpisode = Math.max(1, Math.min(40, Math.floor(episode)));
    p.journeyReincarnation = Math.max(0, Math.floor(reincarnation));
    p.journeyGuideDone = true;
    this.saveProfile(p);
  }

  addCardCopies(cardId: string, copies = 1): void {
    const def = cardDb.getCard(cardId);
    if (!def || copies <= 0) return;
    const col = this.getCollection();
    col[cardId] = Math.max(0, (col[cardId] || 0) + Math.floor(copies));
    this.saveCollection(col);
  }

  unlockMasterCollection(): void {
    const col = this.getCollection();
    for (const c of cardDb.getAllCollectible()) {
      const target = 3;
      col[c.id] = Math.max(col[c.id] || 0, target);
    }
    const p = this.getProfile();
    p.masterUnlocked = true;
    p.journeyGuideDone = true;
    p.gold += 1000;
    p.arcaneDust += 1600;
    p.packs += 10;
    this.saveCollection(col);
    this.saveProfile(p);
  }

  resetAllData(): void {
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.removeItem(KEYS.COLLECTION);
    localStorage.removeItem(KEYS.DECKS);
    localStorage.removeItem(KEYS.QUESTS);
    localStorage.removeItem(KEYS.PITY);
    localStorage.setItem(KEYS.LORE_VER, CURRENT_LORE_VERSION);
    this.ensureInitialized();
    emitStateChanged();
  }

  recordQuestProgress(kind: 'WIN' | 'MINION' | 'SPELL', amount = 1): number {
    const quests = this.getQuests();
    let goldEarned = 0;
    const mapId = kind === 'WIN' ? 'q_win_3' : kind === 'MINION' ? 'q_play_minions' : 'q_cast_spells';
    for (const q of quests) {
      if (q.id === mapId && !q.completed) {
        q.progress = Math.min(q.goal, q.progress + amount);
        if (q.progress >= q.goal) {
          q.completed = true;
          goldEarned += q.rewardGold;
        }
      }
    }
    this.saveQuests(quests);
    if (goldEarned > 0) {
      const p = this.getProfile();
      p.gold += goldEarned;
      this.saveProfile(p);
    }
    return goldEarned;
  }

  recordMatchOutcome(
    heroClass: HeroClass,
    didWin: boolean,
    mode: GameMode,
    opponentClass?: HeroClass,
  ): MatchRewardBreakdown {
    const p = this.getProfile();
    const prevRank = p.rank;
    p.totalGames += 1;

    let baseWinGold = 0;
    let bonusGold = 0;
    let bonusLabel: string | null = null;
    let packsEarned = 0;
    let packReason: string | null = null;
    let streakBonus = false;
    let clearedEpisode: number | undefined;
    let nextEpisode: number | undefined;
    let nextReincarnation: number | undefined;
    let reincarnatedNow = false;

    if (didWin) {
      p.totalWins += 1;
      p.classWins[heroClass] = (p.classWins[heroClass] || 0) + 1;
      p.winStreak += 1;

      if (mode === 'TUTORIAL') {
        const curEp = p.journeyEpisode || 1;
        const curReinc = p.journeyReincarnation || 0;
        const stageIndex = curReinc * 40 + curEp;
        const isFirstClearOfStage = stageIndex > (p.journeyMaxStageCleared || 0);

        clearedEpisode = curEp;
        baseWinGold = 40 + curEp * 5 + curReinc * 35;

        if (isFirstClearOfStage) {
          p.journeyMaxStageCleared = stageIndex;
          bonusGold += 30;
          bonusLabel = '최초 회차 돌파 보너스';
          if (curEp === 40) {
            bonusGold += 300;
            bonusLabel = '40화 대단원 완주 & 환생 개방 특전';
            packsEarned += 3;
            packReason = `제${curReinc + 1}차 여정 완주 보상 (눈히어로 팩 +3)`;
          } else if (curEp % 5 === 0) {
            packsEarned += 1;
            packReason = `제${curEp}화 챕터 보스 최초 토벌 보상 (눈히어로 팩 +1)`;
          }
        }

        if (curEp >= 40) {
          p.journeyReincarnation = curReinc + 1;
          p.journeyEpisode = 1;
          reincarnatedNow = true;
        } else {
          p.journeyEpisode = curEp + 1;
        }
        nextEpisode = p.journeyEpisode;
        nextReincarnation = p.journeyReincarnation;
      } else if (mode === 'RANKED') {
        baseWinGold = 25;
        p.threeWinCounter += 1;
        if (p.threeWinCounter >= 3) {
          p.threeWinCounter = 0;
          bonusGold = 30;
          bonusLabel = '등급전 3승 달성 보너스';
        }
        if (p.rank > 0) {
          const starGain = p.winStreak >= 3 && p.rank > 5 ? 2 : 1;
          streakBonus = starGain === 2;
          p.stars += starGain;
          while (p.rank > 0 && p.stars >= getStarsNeededForRank(p.rank)) {
            p.stars -= getStarsNeededForRank(p.rank);
            p.rank -= 1;
            if (p.rank === 0) {
              p.stars = 1;
              break;
            }
          }
        }
      } else if (mode === 'CASUAL') {
        baseWinGold = 15;
        p.threeWinCounter += 1;
        if (p.threeWinCounter >= 3) {
          p.threeWinCounter = 0;
          bonusGold = 20;
          bonusLabel = '일반전 3승 달성 보너스';
        }
      } else if (mode === 'PRACTICE_NORMAL') {
        baseWinGold = 10;
        if (opponentClass && !p.practiceNormalCleared.includes(opponentClass)) {
          p.practiceNormalCleared = [...p.practiceNormalCleared, opponentClass];
          bonusGold = 25;
          bonusLabel = '수련(일반) 종족 최초 제압 보너스';
        }
      } else if (mode === 'PRACTICE_EXPERT') {
        baseWinGold = 20;
        if (opponentClass && !p.practiceExpertCleared.includes(opponentClass)) {
          p.practiceExpertCleared = [...p.practiceExpertCleared, opponentClass];
          bonusGold = 50;
          bonusLabel = '수련(숙련가) 종족 최초 제압 보너스';
          if (p.practiceExpertCleared.length === HERO_CLASS_ORDER.length) {
            packsEarned += 2;
            packReason = '엘윈마을 9종족 숙련가 전원 제압 마스터 보상 (눈히어로 팩 +2)';
          }
        }
      }

      p.gold += baseWinGold + bonusGold;
      p.packs += packsEarned;
    } else {
      p.winStreak = 0;
      if (mode === 'RANKED' && p.rank > 0 && p.rank <= 20) {
        if (p.stars > 0) {
          p.stars -= 1;
        } else if (p.rank < 20) {
          p.rank += 1;
          p.stars = getStarsNeededForRank(p.rank) - 1;
        }
      }
      if (mode === 'TUTORIAL') {
        nextEpisode = p.journeyEpisode;
        nextReincarnation = p.journeyReincarnation;
      }
    }

    this.saveProfile(p);
    const questGold = didWin ? this.recordQuestProgress('WIN', 1) : 0;

    return {
      mode,
      didWin,
      goldEarned: baseWinGold + bonusGold + questGold,
      baseWinGold,
      bonusGold,
      bonusLabel,
      questGold,
      packsEarned,
      packReason,
      prevRank,
      newRank: p.rank,
      newStars: p.stars,
      streakBonus,
      threeWinProgress: p.threeWinCounter,
      clearedEpisode,
      nextEpisode,
      nextReincarnation,
      reincarnatedNow,
    };
  }
}

export const hsStorage = new HearthstoneStorage();
