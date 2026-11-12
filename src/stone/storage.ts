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
  PROFILE: 'stone_hs_profile',
  COLLECTION: 'stone_hs_collection',
  DECKS: 'stone_hs_decks',
  QUESTS: 'stone_hs_quests',
  PITY: 'stone_hs_pack_pity',
};

export interface PackPityState {
  totalPacksOpened: number;
  firstTenLegendaryClaimed: boolean;
  packsSinceLegendary: number;
  packsSinceEpic: number;
  packsSinceGoldenCommon: number;
  packsSinceGoldenRare: number;
  packsSinceGoldenEpic: number;
  packsSinceGoldenLegendary: number;
  everObtainedMaxCopies: Record<string, number>;
}

export const PACK_DROP_RATES_SPEC = {
  cardsPerPack: 5,
  guaranteedMinRarity: 'RARE' as const,
  firstLegendaryGuaranteePacks: 10,
  legendaryPityPacks: 40,
  epicPityPacks: 10,
  goldenCommonPityPacks: 25,
  goldenRarePityPacks: 29,
  goldenEpicPityPacks: 142,
  goldenLegendaryPityPacks: 361,
  packNormalLegendaryPct: 5.0,
  packNormalEpicPct: 21.0,
  packGoldenCommonPct: 8.1,
  packGoldenRarePct: 7.1,
  packGoldenEpicPct: 1.4,
  packGoldenLegendaryPct: 0.6,
};

export type CollectionMap = Record<string, number>;

export interface OpenedPackCard {
  card: ClassicCardDef;
  isGolden: boolean;
  isNew: boolean;
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
      title: '여관의 승부사',
      description: '아무 직업으로 대전 또는 연습에서 2승 달성',
      progress: 0,
      goal: 2,
      rewardGold: 60,
      completed: false,
    },
    {
      id: 'q_play_minions',
      title: '전장의 함성',
      description: '하수인 15마리 소환하기',
      progress: 0,
      goal: 15,
      rewardGold: 40,
      completed: false,
    },
    {
      id: 'q_cast_spells',
      title: '비전 마법의 대가',
      description: '주문 10회 시전하기',
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
      // Ensure starter preset deck cards are also owned so all 9 preset decks are 100% playable immediately
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

  private getPackPityState(): PackPityState {
    const col = this.getCollection();
    const fallbackEver: Record<string, number> = {};
    for (const [cid, cnt] of Object.entries(col)) {
      if (cnt > 0) fallbackEver[cid] = cnt;
    }
    const defaults: PackPityState = {
      totalPacksOpened: 0,
      firstTenLegendaryClaimed: false,
      packsSinceLegendary: 0,
      packsSinceEpic: 0,
      packsSinceGoldenCommon: 0,
      packsSinceGoldenRare: 0,
      packsSinceGoldenEpic: 0,
      packsSinceGoldenLegendary: 0,
      everObtainedMaxCopies: fallbackEver,
    };
    try {
      const raw = localStorage.getItem(KEYS.PITY);
      if (!raw) return defaults;
      const trimmed = raw.trim();
      if (/^\d+$/.test(trimmed)) {
        const legacyNum = Math.max(0, Number(trimmed) || 0);
        return {
          ...defaults,
          packsSinceLegendary: Math.min(39, legacyNum),
        };
      }
      const parsed = JSON.parse(trimmed) as Partial<PackPityState>;
      const mergedEver: Record<string, number> = {
        ...fallbackEver,
        ...(parsed.everObtainedMaxCopies || {}),
      };
      for (const [cid, cnt] of Object.entries(fallbackEver)) {
        mergedEver[cid] = Math.max(mergedEver[cid] || 0, cnt);
      }
      return {
        totalPacksOpened: Math.max(0, Number(parsed.totalPacksOpened) || 0),
        firstTenLegendaryClaimed: Boolean(parsed.firstTenLegendaryClaimed),
        packsSinceLegendary: Math.max(0, Number(parsed.packsSinceLegendary) || 0),
        packsSinceEpic: Math.max(0, Number(parsed.packsSinceEpic) || 0),
        packsSinceGoldenCommon: Math.max(0, Number(parsed.packsSinceGoldenCommon) || 0),
        packsSinceGoldenRare: Math.max(0, Number(parsed.packsSinceGoldenRare) || 0),
        packsSinceGoldenEpic: Math.max(0, Number(parsed.packsSinceGoldenEpic) || 0),
        packsSinceGoldenLegendary: Math.max(0, Number(parsed.packsSinceGoldenLegendary) || 0),
        everObtainedMaxCopies: mergedEver,
      };
    } catch {
      return defaults;
    }
  }

  private savePackPityState(state: PackPityState) {
    localStorage.setItem(KEYS.PITY, JSON.stringify(state));
  }

  openOnePack(): OpenedPackCard[] | null {
    const p = this.getProfile();
    if (p.packs <= 0) return null;
    p.packs -= 1;
    this.saveProfile(p);

    const col = this.getCollection();
    const pity = this.getPackPityState();
    const packPool = cardDb.getAllCollectible().filter((c) => c.rarity !== 'FREE');
    const byRarity: Record<Exclude<CardRarity, 'FREE'>, ClassicCardDef[]> = {
      COMMON: packPool.filter((c) => c.rarity === 'COMMON'),
      RARE: packPool.filter((c) => c.rarity === 'RARE'),
      EPIC: packPool.filter((c) => c.rarity === 'EPIC'),
      LEGENDARY: packPool.filter((c) => c.rarity === 'LEGENDARY'),
    };

    type PackSlotTier =
      | 'GOLDEN_LEGENDARY'
      | 'GOLDEN_EPIC'
      | 'GOLDEN_RARE'
      | 'GOLDEN_COMMON'
      | 'NORMAL_LEGENDARY'
      | 'NORMAL_EPIC'
      | 'NORMAL_RARE'
      | 'NORMAL_COMMON';

    const nextNormalLeg = pity.packsSinceLegendary + 1;
    const nextNormalEpic = pity.packsSinceEpic + 1;
    const nextGoldLeg = pity.packsSinceGoldenLegendary + 1;
    const nextGoldEpic = pity.packsSinceGoldenEpic + 1;
    const nextGoldRare = pity.packsSinceGoldenRare + 1;
    const nextGoldCommon = pity.packsSinceGoldenCommon + 1;

    const normalLegCap = pity.firstTenLegendaryClaimed
      ? PACK_DROP_RATES_SPEC.legendaryPityPacks
      : PACK_DROP_RATES_SPEC.firstLegendaryGuaranteePacks;

    const pGoldLeg = 0.00102;
    const pGoldEpic = 0.00224;
    const pGoldRare = 0.01208;
    const pGoldCommon = 0.01358;
    const pNormalLeg = !pity.firstTenLegendaryClaimed ? 0.022 : 0.00818;
    const pNormalEpic = 0.0391;
    const pNormalRare = 0.214;

    const slotTiers: PackSlotTier[] = Array.from({ length: 5 }, () => {
      const r = Math.random();
      let acc = 0;
      if (r < (acc += pGoldLeg)) return 'GOLDEN_LEGENDARY';
      if (r < (acc += pGoldEpic)) return 'GOLDEN_EPIC';
      if (r < (acc += pGoldRare)) return 'GOLDEN_RARE';
      if (r < (acc += pGoldCommon)) return 'GOLDEN_COMMON';
      if (r < (acc += pNormalLeg)) return 'NORMAL_LEGENDARY';
      if (r < (acc += pNormalEpic)) return 'NORMAL_EPIC';
      if (r < (acc += pNormalRare)) return 'NORMAL_RARE';
      return 'NORMAL_COMMON';
    });

    const injectPityTier = (target: PackSlotTier, protectedTiers: Set<PackSlotTier>) => {
      const commonIdxs = slotTiers
        .map((t, i) => (t === 'NORMAL_COMMON' ? i : -1))
        .filter((i) => i >= 0);
      if (commonIdxs.length > 0) {
        slotTiers[commonIdxs[Math.floor(Math.random() * commonIdxs.length)]] = target;
        return;
      }
      const availIdxs = slotTiers
        .map((t, i) => (!protectedTiers.has(t) ? i : -1))
        .filter((i) => i >= 0);
      if (availIdxs.length > 0) {
        slotTiers[availIdxs[0]] = target;
      }
    };

    if (
      nextGoldLeg >= PACK_DROP_RATES_SPEC.goldenLegendaryPityPacks &&
      !slotTiers.includes('GOLDEN_LEGENDARY')
    ) {
      injectPityTier('GOLDEN_LEGENDARY', new Set(['GOLDEN_LEGENDARY']));
    }
    if (
      nextGoldEpic >= PACK_DROP_RATES_SPEC.goldenEpicPityPacks &&
      !slotTiers.includes('GOLDEN_EPIC')
    ) {
      injectPityTier('GOLDEN_EPIC', new Set(['GOLDEN_LEGENDARY', 'GOLDEN_EPIC']));
    }
    if (nextNormalLeg >= normalLegCap && !slotTiers.includes('NORMAL_LEGENDARY')) {
      injectPityTier(
        'NORMAL_LEGENDARY',
        new Set(['GOLDEN_LEGENDARY', 'GOLDEN_EPIC', 'NORMAL_LEGENDARY']),
      );
    }
    if (
      nextNormalEpic >= PACK_DROP_RATES_SPEC.epicPityPacks &&
      !slotTiers.includes('NORMAL_EPIC')
    ) {
      injectPityTier(
        'NORMAL_EPIC',
        new Set(['GOLDEN_LEGENDARY', 'GOLDEN_EPIC', 'NORMAL_LEGENDARY', 'NORMAL_EPIC']),
      );
    }
    if (
      nextGoldRare >= PACK_DROP_RATES_SPEC.goldenRarePityPacks &&
      !slotTiers.includes('GOLDEN_RARE')
    ) {
      injectPityTier(
        'GOLDEN_RARE',
        new Set([
          'GOLDEN_LEGENDARY',
          'GOLDEN_EPIC',
          'NORMAL_LEGENDARY',
          'NORMAL_EPIC',
          'GOLDEN_RARE',
        ]),
      );
    }
    if (
      nextGoldCommon >= PACK_DROP_RATES_SPEC.goldenCommonPityPacks &&
      !slotTiers.includes('GOLDEN_COMMON')
    ) {
      injectPityTier(
        'GOLDEN_COMMON',
        new Set([
          'GOLDEN_LEGENDARY',
          'GOLDEN_EPIC',
          'NORMAL_LEGENDARY',
          'NORMAL_EPIC',
          'GOLDEN_RARE',
          'GOLDEN_COMMON',
        ]),
      );
    }

    const hasRareOrBetter = slotTiers.some(
      (t) => t !== 'NORMAL_COMMON' && t !== 'GOLDEN_COMMON',
    );
    if (!hasRareOrBetter) {
      const ncIdx = slotTiers.indexOf('NORMAL_COMMON');
      slotTiers[ncIdx >= 0 ? ncIdx : 0] = 'NORMAL_RARE';
    }

    pity.totalPacksOpened += 1;
    if (slotTiers.includes('NORMAL_LEGENDARY') || slotTiers.includes('GOLDEN_LEGENDARY')) {
      pity.firstTenLegendaryClaimed = true;
    }
    pity.packsSinceLegendary = slotTiers.includes('NORMAL_LEGENDARY') ? 0 : nextNormalLeg;
    pity.packsSinceEpic = slotTiers.includes('NORMAL_EPIC') ? 0 : nextNormalEpic;
    pity.packsSinceGoldenLegendary = slotTiers.includes('GOLDEN_LEGENDARY') ? 0 : nextGoldLeg;
    pity.packsSinceGoldenEpic = slotTiers.includes('GOLDEN_EPIC') ? 0 : nextGoldEpic;
    pity.packsSinceGoldenRare = slotTiers.includes('GOLDEN_RARE') ? 0 : nextGoldRare;
    pity.packsSinceGoldenCommon = slotTiers.includes('GOLDEN_COMMON') ? 0 : nextGoldCommon;

    const rarities: Exclude<CardRarity, 'FREE'>[] = slotTiers.map((t) => {
      if (t === 'GOLDEN_LEGENDARY' || t === 'NORMAL_LEGENDARY') return 'LEGENDARY';
      if (t === 'GOLDEN_EPIC' || t === 'NORMAL_EPIC') return 'EPIC';
      if (t === 'GOLDEN_RARE' || t === 'NORMAL_RARE') return 'RARE';
      return 'COMMON';
    });
    const goldenFlags: boolean[] = slotTiers.map((t) => t.startsWith('GOLDEN_'));

    const inPackCounts: Record<string, number> = {};
    const results: OpenedPackCard[] = rarities.map((rar, slotIdx) => {
      const pool = byRarity[rar].length > 0 ? byRarity[rar] : byRarity.COMMON;
      const deckCopyCap = rar === 'LEGENDARY' ? 1 : 2;
      const packLegalPool = pool.filter((c) => (inPackCounts[c.id] || 0) < deckCopyCap);
      const baseCandidates = packLegalPool.length > 0 ? packLegalPool : pool;

      const uncollectedPool = baseCandidates.filter((c) => {
        const lifetimeCopies = Math.max(pity.everObtainedMaxCopies[c.id] || 0, col[c.id] || 0);
        return lifetimeCopies < deckCopyCap;
      });
      const activePool = uncollectedPool.length > 0 ? uncollectedPool : baseCandidates;

      const picked = activePool[Math.floor(Math.random() * activePool.length)];
      inPackCounts[picked.id] = (inPackCounts[picked.id] || 0) + 1;
      const prevCount = col[picked.id] || 0;
      const nextCount = prevCount + 1;
      col[picked.id] = nextCount;
      pity.everObtainedMaxCopies[picked.id] = Math.max(
        pity.everObtainedMaxCopies[picked.id] || 0,
        nextCount,
      );
      return {
        card: picked,
        isGolden: goldenFlags[slotIdx],
        isNew: prevCount === 0,
      };
    });

    this.saveCollection(col);
    this.savePackPityState(pity);
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
      return { ok: false, reason: `신비한 가루가 부족합니다. (필요: ${cost})` };
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
    if (didWin) {
      goldEarned += this.recordQuestProgress('WIN', 1);
    }
    return {
      goldEarned,
      prevRank,
      newRank: p.rank,
      newStars: p.stars,
      streakBonus,
    };
  }

  /**
   * /stone.html 전용 (stone_hs_* 네임스페이스) 세이브 데이터 백업 JSON 생성
   */
  exportStoneBackupData(): { keyCount: number; jsonString: string } {
    const payload: Record<string, string> = {};
    let count = 0;
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('stone_hs_')) continue;
        const val = localStorage.getItem(key);
        if (val !== null && val !== '') {
          payload[key] = val;
          count += 1;
        }
      }
    } catch {
      // ignore storage read error
    }

    const exportObj = {
      app: 'Classic Hearthstone (/stone.html)',
      namespace: 'stone_hs_*',
      exportTimestamp: Date.now(),
      exportIsoDate: new Date().toISOString(),
      keyCount: count,
      data: payload,
    };

    return {
      keyCount: count,
      jsonString: JSON.stringify(exportObj, null, 2),
    };
  }

  downloadStoneBackupFile(): boolean {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    const { jsonString } = this.exportStoneBackupData();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    const fileName = `stone_hs_backup_${dateStr}.json`;

    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }

  restoreStoneBackupJson(jsonText: string): {
    success: boolean;
    restoredCount: number;
    message: string;
  } {
    try {
      const parsed = JSON.parse(jsonText);
      const dataObj = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;
      if (!dataObj || typeof dataObj !== 'object') {
        return {
          success: false,
          restoredCount: 0,
          message: '유효한 백업 JSON 형식이 아닙니다.',
        };
      }

      let count = 0;
      for (const [key, val] of Object.entries(dataObj)) {
        if (typeof key === 'string' && key.startsWith('stone_hs_') && typeof val === 'string') {
          localStorage.setItem(key, val);
          count += 1;
        }
      }

      if (count === 0) {
        return {
          success: false,
          restoredCount: 0,
          message: '복원 가능한 하스스톤(stone_hs_*) 데이터가 없습니다.',
        };
      }

      return {
        success: true,
        restoredCount: count,
        message: `하스스톤 데이터 ${count}개 항목을 성공적으로 복원했습니다.`,
      };
    } catch {
      return {
        success: false,
        restoredCount: 0,
        message: '백업 코드 또는 JSON 파일 형식이 올바르지 않습니다.',
      };
    }
  }

  resetStoneDataOnly(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith('stone_hs_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore storage error
    }
    this.ensureInitialized();
  }
}

export const hsStorage = new HearthstoneStorage();
