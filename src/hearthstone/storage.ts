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
  HERO_CLASS_ORDER,
  HeroClass,
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

const CURRENT_LORE_VERSION = 'snshero_v1';

export type CollectionMap = Record<string, number>;

export interface OpenedPackCard {
  card: ClassicCardDef;
  isGolden: boolean;
  isNew: boolean;
}

function emitStateChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snshero:state-changed'));
  }
}

function defaultProfile(): PlayerProfile {
  const classWins = {} as Record<HeroClass, number>;
  for (const c of HERO_CLASS_ORDER) classWins[c] = 0;
  return {
    gold: 1000,
    arcaneDust: 400,
    packs: 15,
    rank: 25,
    stars: 0,
    winStreak: 0,
    totalWins: 0,
    totalGames: 0,
    classWins,
    selectedCardBack: 'classic',
    masterUnlocked: false,
    threeWinCounter: 0,
  };
}

function defaultQuests(): DailyQuest[] {
  return [
    {
      id: 'q_win_3',
      title: '취선루의 승부사',
      description: '아무 종족으로 대전 또는 수련에서 2승 달성',
      progress: 0,
      goal: 2,
      rewardGold: 60,
      completed: false,
    },
    {
      id: 'q_play_minions',
      title: '성흔 전단 소집',
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

    // Migrate legacy Hearthstone preset deck names & quest texts to SNSHero lore without losing progress
    if (localStorage.getItem(KEYS.LORE_VER) !== CURRENT_LORE_VERSION) {
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
      if (raw) return { ...defaultProfile(), ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return defaultProfile();
  }

  saveProfile(p: PlayerProfile) {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(p));
    emitStateChanged();
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
    const cost = count * 100;
    const p = this.getProfile();
    if (p.gold < cost || count <= 0) return false;
    p.gold -= cost;
    p.packs += count;
    this.saveProfile(p);
    return true;
  }

  openOnePack(): OpenedPackCard[] | null {
    const p = this.getProfile();
    if (p.packs <= 0) return null;
    p.packs -= 1;
    this.saveProfile(p);

    const col = this.getCollection();
    const packPool = cardDb.getAllCollectible().filter((c) => c.rarity !== 'FREE');
    const byRarity: Record<CardRarity, ClassicCardDef[]> = {
      FREE: [],
      COMMON: packPool.filter((c) => c.rarity === 'COMMON'),
      RARE: packPool.filter((c) => c.rarity === 'RARE'),
      EPIC: packPool.filter((c) => c.rarity === 'EPIC'),
      LEGENDARY: packPool.filter((c) => c.rarity === 'LEGENDARY'),
    };

    let pity = Number(localStorage.getItem(KEYS.PITY) || '0') + 1;
    const rollRarity = (forceRareOrBetter: boolean): CardRarity => {
      const r = Math.random();
      if (pity >= 15 || r < 0.032) {
        pity = 0;
        return 'LEGENDARY';
      }
      if (r < 0.11) return 'EPIC';
      if (forceRareOrBetter || r < 0.34) return 'RARE';
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

    const results: OpenedPackCard[] = rarities.map((rar) => {
      const pool = byRarity[rar].length > 0 ? byRarity[rar] : byRarity.COMMON;
      const picked = pool[Math.floor(Math.random() * pool.length)];
      const prevCount = col[picked.id] || 0;
      col[picked.id] = prevCount + 1;
      return {
        card: picked,
        isGolden: Math.random() < 0.08,
        isNew: prevCount === 0,
      };
    });

    this.saveCollection(col);
    return results;
  }

  craftCard(cardId: string): { ok: boolean; reason?: string } {
    const def = cardDb.getCard(cardId);
    if (!def || def.rarity === 'FREE') {
      return { ok: false, reason: '기본 카드는 제작할 수 없습니다.' };
    }
    const cost = CRAFTING_COST[def.rarity] || 40;
    const p = this.getProfile();
    if (p.arcaneDust < cost) {
      return { ok: false, reason: `성흔 가루가 부족합니다. (필요: ${cost})` };
    }
    const col = this.getCollection();
    const maxUseful = def.rarity === 'LEGENDARY' ? 1 : 2;
    if ((col[cardId] || 0) >= maxUseful) {
      return { ok: false, reason: '덱에 넣을 수 있는 최대 수량을 이미 보유하고 있습니다.' };
    }
    p.arcaneDust -= cost;
    col[cardId] = (col[cardId] || 0) + 1;
    this.saveProfile(p);
    this.saveCollection(col);
    return { ok: true };
  }

  disenchantCard(cardId: string): { ok: boolean; reason?: string } {
    const def = cardDb.getCard(cardId);
    if (!def || def.rarity === 'FREE') {
      return { ok: false, reason: '기본 카드는 마력을 추출할 수 없습니다.' };
    }
    const col = this.getCollection();
    if ((col[cardId] || 0) <= 0) {
      return { ok: false, reason: '보유한 카드가 없습니다.' };
    }
    const val = DISENCHANT_VALUE[def.rarity] || 5;
    col[cardId] -= 1;
    if (col[cardId] <= 0) delete col[cardId];
    const p = this.getProfile();
    p.arcaneDust += val;
    this.saveProfile(p);
    this.saveCollection(col);
    return { ok: true };
  }

  massDisenchantExtras(): { count: number; dustGained: number } {
    const col = this.getCollection();
    let count = 0;
    let dustGained = 0;
    for (const c of cardDb.getAllCollectible()) {
      if (c.rarity === 'FREE') continue;
      const limit = c.rarity === 'LEGENDARY' ? 1 : 2;
      const owned = col[c.id] || 0;
      if (owned > limit) {
        const extra = owned - limit;
        count += extra;
        dustGained += extra * (DISENCHANT_VALUE[c.rarity] || 5);
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

  unlockMasterCollection(): void {
    const col = this.getCollection();
    for (const c of cardDb.getAllCollectible()) {
      const target = c.rarity === 'LEGENDARY' ? 1 : 2;
      col[c.id] = Math.max(col[c.id] || 0, target);
    }
    const p = this.getProfile();
    p.masterUnlocked = true;
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
    localStorage.removeItem(KEYS.LORE_VER);
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
    isRanked: boolean,
  ): {
    goldEarned: number;
    prevRank: number;
    newRank: number;
    newStars: number;
    streakBonus: boolean;
  } {
    const p = this.getProfile();
    const prevRank = p.rank;
    p.totalGames += 1;
    let goldEarned = 0;
    let streakBonus = false;

    if (didWin) {
      p.totalWins += 1;
      p.classWins[heroClass] = (p.classWins[heroClass] || 0) + 1;
      p.winStreak += 1;
      p.threeWinCounter += 1;
      if (p.threeWinCounter >= 3) {
        p.threeWinCounter = 0;
        p.gold += 10;
        goldEarned += 10;
      } else {
        p.gold += 15;
        goldEarned += 15;
      }

      if (isRanked && p.rank > 0) {
        const bonus = p.winStreak >= 3 && p.rank > 5 ? 2 : 1;
        streakBonus = bonus === 2;
        p.stars += bonus;
        while (p.rank > 0 && p.stars >= getStarsNeededForRank(p.rank)) {
          p.stars -= getStarsNeededForRank(p.rank);
          p.rank -= 1;
          if (p.rank === 0) {
            p.stars = 1;
            break;
          }
        }
      }
    } else {
      p.winStreak = 0;
      if (isRanked && p.rank > 0 && p.rank <= 20) {
        if (p.stars > 0) {
          p.stars -= 1;
        } else if (p.rank < 20) {
          p.rank += 1;
          p.stars = getStarsNeededForRank(p.rank) - 1;
        }
      }
    }

    this.saveProfile(p);
    const questGold = didWin ? this.recordQuestProgress('WIN', 1) : 0;
    return {
      goldEarned: goldEarned + questGold,
      prevRank,
      newRank: p.rank,
      newStars: p.stars,
      streakBonus,
    };
  }
}

export const hsStorage = new HearthstoneStorage();
