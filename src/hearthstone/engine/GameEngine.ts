import { cardDb } from '../cardDb';
import {
  ActionHistoryItem,
  BattleMatchState,
  BoardThemeId,
  CLASSIC_HEROES,
  ChooseOnePrompt,
  GameMode,
  HandCardInstance,
  HeroClass,
  MinionInstance,
  PlayerBattleState,
  PlayerSide,
  VfxKind,
} from '../types';
import { CARD_SCRIPTS, EngineOps, TargetKind } from './cardEffects';

let uidSeq = 1;
function nextUid(prefix: string): string {
  uidSeq += 1;
  return `${prefix}_${uidSeq}_${Math.random().toString(36).slice(2, 6)}`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeEmptyPlayerState(
  side: PlayerSide,
  name: string,
  heroClass: HeroClass,
  deckCards: string[],
): PlayerBattleState {
  const hero = CLASSIC_HEROES[heroClass];
  return {
    side,
    name,
    heroClass,
    heroId: hero.heroId,
    heroNameKo: hero.nameKo,
    isJaraxxus: false,
    heroPowerId: hero.heroPowerId,
    heroPowerNameKo: hero.heroPowerNameKo,
    heroPowerTextKo: hero.heroPowerTextKo,
    heroPowerNeedsTarget: hero.heroPowerNeedsTarget,
    shadowformTier: 0,
    heroPowerUsedThisTurn: false,
    health: 30,
    maxHealth: 30,
    armor: 0,
    tempAttack: 0,
    attacksMadeThisTurn: 0,
    frozen: false,
    freezeSkipClearedAtEndTurn: false,
    immuneThisTurn: false,
    weapon: null,
    mana: 0,
    maxMana: 0,
    overloadedMana: 0,
    pendingOverload: 0,
    fatigueCounter: 0,
    cardsPlayedThisTurn: 0,
    minionsPlayedThisTurn: 0,
    nextSecretZeroThisTurn: false,
    nextSpellDiscountThisTurn: 0,
    spellsZeroThisTurn: false,
    commandingShoutThisTurn: false,
    deck: shuffleArray(deckCards),
    hand: [],
    board: [],
    secrets: [],
    graveyard: [],
  };
}

export function getMinionAttack(m: MinionInstance): number {
  if (!m.silenced && m.cardId === 'EX1_335') {
    // 빛의 정령 (Lightspawn): 공격력은 항상 현재 생명력과 같음
    return Math.max(0, m.health + m.auraHealth);
  }
  return Math.max(0, m.permAttack + m.tempAttack + m.auraAttack);
}

export function getMinionHealth(m: MinionInstance): number {
  return m.health + m.auraHealth;
}

export function getMinionMaxHealth(m: MinionInstance): number {
  return m.maxHealth + m.auraHealth;
}

export function hasMinionTaunt(m: MinionInstance): boolean {
  // Official Hearthstone rule: Taunt is suppressed while Stealthed!
  if (m.stealth) return false;
  return m.taunt || m.auraTaunt;
}

export function getHeroAttack(p: PlayerBattleState, isActiveTurn: boolean): number {
  // Weapon blades close on opponent's turn in Hearthstone!
  const weaponAtk = isActiveTurn && p.weapon ? p.weapon.attack : 0;
  return Math.max(0, p.tempAttack + weaponAtk);
}

export function createBattleMatch(opts: {
  mode: GameMode;
  playerName: string;
  playerClass: HeroClass;
  playerDeck: string[];
  opponentName: string;
  opponentClass: HeroClass;
  opponentDeck: string[];
  boardTheme?: BoardThemeId;
}): BattleMatchState {
  const themes: BoardThemeId[] = ['STORMWIND', 'ORGRIMMAR', 'PANDARIA'];
  const boardTheme = opts.boardTheme || themes[Math.floor(Math.random() * themes.length)];
  const firstPlayer: PlayerSide = opts.mode === 'TUTORIAL' ? 'PLAYER' : Math.random() < 0.5 ? 'PLAYER' : 'OPPONENT';

  const player = makeEmptyPlayerState('PLAYER', opts.playerName, opts.playerClass, opts.playerDeck);
  const opponent = makeEmptyPlayerState('OPPONENT', opts.opponentName, opts.opponentClass, opts.opponentDeck);

  // Deal initial Mulligan hands (3 for first player, 4 for second player)
  const pInitial = firstPlayer === 'PLAYER' ? 3 : 4;
  const oInitial = firstPlayer === 'OPPONENT' ? 3 : 4;
  for (let i = 0; i < pInitial; i++) {
    const cid = player.deck.shift();
    if (cid) player.hand.push({ uid: nextUid('hand'), cardId: cid, costMod: 0 });
  }
  for (let i = 0; i < oInitial; i++) {
    const cid = opponent.deck.shift();
    if (cid) opponent.hand.push({ uid: nextUid('hand'), cardId: cid, costMod: 0 });
  }

  return {
    matchId: nextUid('match'),
    mode: opts.mode,
    boardTheme,
    phase: 'MULLIGAN',
    turnNumber: 0,
    activeSide: firstPlayer,
    firstPlayer,
    playOrderSeq: 1,
    mulliganSelectedUids: [],
    player,
    opponent,
    chooseOnePrompt: null,
    trackingPrompt: null,
    winner: null,
    turnSecondsLeft: 75,
    maxTurnSeconds: 75,
    history: [],
    vfxQueue: [],
    bannerMessage: null,
    errorBanner: null,
    tutorialStep: opts.mode === 'TUTORIAL' ? 1 : 0,
  };
}

export function cloneMatchState(s: BattleMatchState): BattleMatchState {
  return structuredClone(s);
}

export function createEngine(rawState: BattleMatchState) {
  const state = cloneMatchState(rawState);

  const getPlayer = (side: PlayerSide): PlayerBattleState =>
    side === 'PLAYER' ? state.player : state.opponent;

  const getEnemySide = (side: PlayerSide): PlayerSide =>
    side === 'PLAYER' ? 'OPPONENT' : 'PLAYER';

  const pushHistory = (item: Omit<ActionHistoryItem, 'id' | 'turn'>) => {
    state.history.unshift({
      ...item,
      id: nextUid('hist'),
      turn: state.turnNumber,
    });
    if (state.history.length > 24) {
      state.history.length = 24;
    }
  };

  const pushVfx = (
    kind: VfxKind,
    targetId?: string,
    sourceId?: string,
    value?: number,
    label?: string,
  ) => {
    state.vfxQueue.push({
      id: nextUid('vfx'),
      kind,
      targetId,
      sourceId,
      value,
      label,
      createdAt: Date.now(),
    });
  };

  const findMinion = (
    uid: string,
  ): { minion: MinionInstance; side: PlayerSide; index: number } | null => {
    const pIdx = state.player.board.findIndex((m) => m.uid === uid);
    if (pIdx >= 0) return { minion: state.player.board[pIdx], side: 'PLAYER', index: pIdx };
    const oIdx = state.opponent.board.findIndex((m) => m.uid === uid);
    if (oIdx >= 0) return { minion: state.opponent.board[oIdx], side: 'OPPONENT', index: oIdx };
    return null;
  };

  const getAdjacentMinions = (uid: string): MinionInstance[] => {
    const f = findMinion(uid);
    if (!f) return [];
    const board = getPlayer(f.side).board;
    const out: MinionInstance[] = [];
    if (f.index > 0) out.push(board[f.index - 1]);
    if (f.index < board.length - 1) out.push(board[f.index + 1]);
    return out;
  };

  const getTotalSpellPower = (side: PlayerSide): number => {
    let sp = 0;
    for (const m of getPlayer(side).board) {
      if (!m.silenced) sp += m.spellDamage;
    }
    return sp;
  };

  const hasActiveVelen = (side: PlayerSide): number => {
    const count = getPlayer(side).board.filter((m) => !m.silenced && m.cardId === 'EX1_350').length;
    return Math.pow(2, count);
  };

  const hasActiveAuchenai = (side: PlayerSide): boolean =>
    getPlayer(side).board.some((m) => !m.silenced && m.cardId === 'EX1_591');

  const getSpellDamageValue = (
    side: PlayerSide,
    base: number,
    affectedBySpellPower = true,
  ): number => {
    const bonus = affectedBySpellPower ? getTotalSpellPower(side) : 0;
    return (base + bonus) * hasActiveVelen(side);
  };

  const getHealValue = (side: PlayerSide, base: number): number => {
    return base * hasActiveVelen(side);
  };

  const recalculateAuras = () => {
    // Reset aura bonuses on both sides
    for (const side of ['PLAYER', 'OPPONENT'] as PlayerSide[]) {
      const p = getPlayer(side);
      for (const m of p.board) {
        m.auraAttack = 0;
        m.auraHealth = 0;
        m.auraTaunt = false;
        m.auraCharge = false;
      }
      if (p.weapon) {
        p.weapon.attack = p.weapon.baseAttack;
      }
    }

    const allMinions = [...state.player.board, ...state.opponent.board];

    // Global Murloc Auras (Classic rule: affects ALL other Murlocs on BOTH sides!)
    for (const src of allMinions) {
      if (src.silenced) continue;
      if (src.cardId === 'EX1_508') {
        // 성난비늘 수련사 (+1/+0 other Murlocs)
        for (const m of allMinions) {
          if (m.uid !== src.uid && m.race === 'MURLOC') m.auraAttack += 1;
        }
      } else if (src.cardId === 'EX1_507') {
        // 멀록 전투대장 (+2/+1 other Murlocs)
        for (const m of allMinions) {
          if (m.uid !== src.uid && m.race === 'MURLOC') {
            m.auraAttack += 2;
            m.auraHealth += 1;
          }
        }
      } else if (src.cardId === 'EX1_062') {
        // 늙은 거먹눈 멀록 (+1 atk per other Murloc on battlefield)
        const otherMurlocs = allMinions.filter((m) => m.uid !== src.uid && m.race === 'MURLOC').length;
        src.auraAttack += otherMurlocs;
      }
    }

    // Friendly & Positional & Enrage Auras
    for (const side of ['PLAYER', 'OPPONENT'] as PlayerSide[]) {
      const p = getPlayer(side);
      for (let i = 0; i < p.board.length; i++) {
        const src = p.board[i];
        if (src.silenced) continue;

        if (src.cardId === 'CS2_122' || src.cardId === 'NEW1_033') {
          // 공격대장 / 레오크
          for (const m of p.board) {
            if (m.uid !== src.uid) m.auraAttack += 1;
          }
        } else if (src.cardId === 'CS2_222') {
          // 스톰윈드 용사
          for (const m of p.board) {
            if (m.uid !== src.uid) {
              m.auraAttack += 1;
              m.auraHealth += 1;
            }
          }
        } else if (src.cardId === 'DS1_175') {
          // 회갈색 늑대
          for (const m of p.board) {
            if (m.uid !== src.uid && m.race === 'BEAST') m.auraAttack += 1;
          }
        } else if (src.cardId === 'DS1_178') {
          // 툰드라 코뿔소
          for (const m of p.board) {
            if (m.race === 'BEAST') m.auraCharge = true;
          }
        } else if (src.cardId === 'NEW1_027') {
          // 남쪽바다 선장
          for (const m of p.board) {
            if (m.uid !== src.uid && m.race === 'PIRATE') {
              m.auraAttack += 1;
              m.auraHealth += 1;
            }
          }
        } else if (src.cardId === 'CS2_146') {
          // 남쪽바다 갑판원
          if (p.weapon) src.auraCharge = true;
        } else if (src.cardId === 'EX1_162') {
          // 광포한 늑대 우두머리 (양옆 +1 공격력)
          if (i > 0) p.board[i - 1].auraAttack += 1;
          if (i < p.board.length - 1) p.board[i + 1].auraAttack += 1;
        } else if (src.cardId === 'EX1_565') {
          // 불꽃의 토템 (양옆 +2 공격력)
          if (i > 0) p.board[i - 1].auraAttack += 2;
          if (i < p.board.length - 1) p.board[i + 1].auraAttack += 2;
        }
      }

      // Enrage check (after health auras computed)
      for (const m of p.board) {
        if (m.silenced) continue;
        const isDamaged = getMinionHealth(m) < getMinionMaxHealth(m);
        if (!isDamaged) continue;
        if (m.cardId === 'EX1_009') m.auraAttack += 5; // 화난 닭
        else if (m.cardId === 'EX1_393') m.auraAttack += 3; // 아마니 광전사
        else if (m.cardId === 'EX1_390') m.auraAttack += 3; // 타우렌 전사
        else if (m.cardId === 'EX1_412') m.auraAttack += 1; // 흉포한 늑대인간 (+ 질풍)
        else if (m.cardId === 'EX1_414') m.auraAttack += 6; // 그롬마쉬 헬스크림
        else if (m.cardId === 'CS2_221' && p.weapon) p.weapon.attack += 2; // 원한 맺힌 대장장이
      }
    }

    // Nozdormu 15s turn timer check
    const hasNozdormu = allMinions.some((m) => !m.silenced && m.cardId === 'EX1_560');
    state.maxTurnSeconds = hasNozdormu ? 15 : 75;
    if (state.turnSecondsLeft > state.maxTurnSeconds) {
      state.turnSecondsLeft = state.maxTurnSeconds;
    }
  };

  const revealSecret = (secretOwnerSide: PlayerSide, secretUid: string): boolean => {
    const p = getPlayer(secretOwnerSide);
    const idx = p.secrets.findIndex((s) => s.uid === secretUid);
    if (idx < 0) return false;
    const [sec] = p.secrets.splice(idx, 1);
    pushVfx('SECRET_REVEAL', `${secretOwnerSide}_HERO`, undefined, undefined, `비밀 발동: ${sec.name}!`);
    pushHistory({
      actorSide: secretOwnerSide,
      cardId: sec.cardId,
      title: `비밀 발동: ${sec.name}`,
      detail: `${p.heroNameKo}의 비밀 [${sec.name}] 발동!`,
      kind: 'SECRET_TRIGGER',
    });
    // Eaglehorn Bow (독수리뿔 장궁 EX1_536) gains +1 durability whenever a Secret is revealed!
    for (const side of ['PLAYER', 'OPPONENT'] as PlayerSide[]) {
      const sp = getPlayer(side);
      if (sp.weapon && sp.weapon.cardId === 'EX1_536') {
        sp.weapon.durability += 1;
        sp.weapon.maxDurability = Math.max(sp.weapon.maxDurability, sp.weapon.durability);
      }
    }
    return true;
  };

  const addArmor = (side: PlayerSide, amount: number) => {
    if (amount <= 0) return;
    getPlayer(side).armor += amount;
    pushVfx('ARMOR_POP', `${side}_HERO`, undefined, amount, `+${amount}`);
  };

  const addCardToHand = (side: PlayerSide, cardId: string, costMod = 0): boolean => {
    const p = getPlayer(side);
    if (p.hand.length >= 10) {
      const burned = cardDb.getCard(cardId)?.name || cardId;
      pushHistory({
        actorSide: side,
        cardId,
        title: `${burned} 소멸`,
        detail: `손패가 가득 차서 [${burned}] 카드가 불타 소멸했습니다!`,
        kind: 'TRIGGER',
      });
      return false;
    }
    p.hand.push({ uid: nextUid('hand'), cardId, costMod });
    return true;
  };

  const drawCards = (side: PlayerSide, count: number, costMod = 0): string[] => {
    const p = getPlayer(side);
    const drawn: string[] = [];
    for (let i = 0; i < count; i++) {
      if (p.deck.length === 0) {
        p.fatigueCounter += 1;
        const fatDmg = p.fatigueCounter;
        pushHistory({
          actorSide: side,
          cardId: 'GAME_005',
          title: `탈진 피해 ${fatDmg}`,
          detail: `덱에 카드가 없어 탈진 피해를 ${fatDmg} 입습니다!`,
          kind: 'TRIGGER',
        });
        dealDamage(`${side}_HERO`, fatDmg, side, 'EXPLOSION');
      } else {
        const cid = p.deck.shift()!;
        if (addCardToHand(side, cid, costMod)) {
          drawn.push(cid);
        }
      }
    }
    recalculateAuras();
    return drawn;
  };

  const discardRandomCards = (side: PlayerSide, count: number) => {
    const p = getPlayer(side);
    for (let i = 0; i < count; i++) {
      if (p.hand.length === 0) break;
      const idx = Math.floor(Math.random() * p.hand.length);
      const [removed] = p.hand.splice(idx, 1);
      const cname = cardDb.getCard(removed.cardId)?.name || removed.cardId;
      pushHistory({
        actorSide: side,
        cardId: removed.cardId,
        title: `${cname} 버림`,
        detail: `[${cname}] 카드를 버렸습니다.`,
        kind: 'TRIGGER',
      });
    }
  };

  const equipWeapon = (side: PlayerSide, cardId: string) => {
    const def = cardDb.mustGetCard(cardId);
    const p = getPlayer(side);
    p.weapon = {
      uid: nextUid('wpn'),
      cardId: def.id,
      name: def.name,
      baseAttack: def.attack || 1,
      attack: def.attack || 1,
      durability: def.durability || def.health || 2,
      maxDurability: def.durability || def.health || 2,
      windfury: def.mechanics.includes('WINDFURY'),
    };
    recalculateAuras();
  };

  const destroyWeapon = (side: PlayerSide): { attack: number; durability: number } | null => {
    const p = getPlayer(side);
    if (!p.weapon) return null;
    const snap = { attack: p.weapon.attack, durability: p.weapon.durability };
    p.weapon = null;
    recalculateAuras();
    return snap;
  };

  const createMinionInstance = (side: PlayerSide, cardId: string): MinionInstance => {
    const def = cardDb.mustGetCard(cardId);
    const charge = def.mechanics.includes('CHARGE');
    const poisonous =
      def.mechanics.includes('POISONOUS') || def.id === 'EX1_170' || def.id === 'EX1_522';
    const elusive = def.mechanics.includes('ELUSIVE') || def.id === 'NEW1_023' || def.id === 'DREAM_01';
    const cantAttack =
      def.mechanics.includes('CANT_ATTACK') || def.id === 'EX1_045' || def.id === 'EX1_298';
    state.playOrderSeq += 1;
    return {
      uid: nextUid('min'),
      cardId: def.id,
      name: def.name,
      owner: side,
      playOrder: state.playOrderSeq,
      baseAttack: def.attack || 0,
      baseHealth: def.health || 1,
      permAttack: def.attack || 0,
      tempAttack: 0,
      maxHealth: def.health || 1,
      health: def.health || 1,
      auraAttack: 0,
      auraHealth: 0,
      race: def.race || null,
      rarity: def.rarity,
      taunt: def.mechanics.includes('TAUNT'),
      auraTaunt: false,
      divineShield: def.mechanics.includes('DIVINE_SHIELD'),
      charge,
      auraCharge: false,
      windfury: def.mechanics.includes('WINDFURY'),
      stealth: def.mechanics.includes('STEALTH'),
      concealedUntilNextTurn: false,
      frozen: false,
      freezeSkipClearedAtEndTurn: false,
      silenced: false,
      poisonous,
      elusive,
      cantAttack,
      spellDamage: def.spellDamage || 0,
      exhausted: !charge,
      attacksMadeThisTurn: 0,
      cannotReduceBelow1ThisTurn: getPlayer(side).commandingShoutThisTurn,
      soulOfTheForestCount: 0,
      ancestralSpiritCount: 0,
      blessingOfWisdomOwners: [],
      corruptionOwner: null,
      powerOverwhelmingDieAtEndTurn: def.id === 'EX1_tk9b',
      nightmareDestroyOwnerTurn: null,
    };
  };

  const summonMinion = (
    side: PlayerSide,
    cardId: string,
    insertIndex?: number,
  ): MinionInstance | null => {
    const p = getPlayer(side);
    if (p.board.length >= 7) return null;
    const minion = createMinionInstance(side, cardId);
    const idx =
      insertIndex !== undefined
        ? Math.max(0, Math.min(p.board.length, insertIndex))
        : p.board.length;
    p.board.splice(idx, 0, minion);

    if (minion.rarity === 'LEGENDARY') {
      pushVfx('LEGENDARY_SLAM', minion.uid, undefined, undefined, minion.name);
    }

    recalculateAuras();

    // Summon triggers:
    // 1. Murloc Tidecaller (멀록 파도술사 EX1_509): whenever ANY Murloc is summoned, +1 Attack
    if (minion.race === 'MURLOC') {
      for (const m of [...state.player.board, ...state.opponent.board]) {
        if (m.uid !== minion.uid && !m.silenced && m.cardId === 'EX1_509') {
          m.permAttack += 1;
        }
      }
    }

    // 2. Starving Buzzard (굶주린 대머리수리 CS2_237): whenever you summon a Beast, draw 1
    if (minion.race === 'BEAST') {
      for (const m of p.board) {
        if (m.uid !== minion.uid && !m.silenced && m.cardId === 'CS2_237') {
          drawCards(side, 1);
        }
      }
    }

    // 3. Warsong Commander (전쟁노래 사령관 EX1_084): Classic rule — whenever you summon a minion with 3 or less Attack, give it Charge!
    if (getMinionAttack(minion) <= 3) {
      if (p.board.some((m) => m.uid !== minion.uid && !m.silenced && m.cardId === 'EX1_084')) {
        minion.charge = true;
        minion.exhausted = false;
      }
    }

    // 4. Sword of Justice (정의의 칼날 EX1_366): +1/+1 to summoned minion, -1 durability
    if (p.weapon && p.weapon.cardId === 'EX1_366') {
      minion.permAttack += 1;
      minion.maxHealth += 1;
      minion.health += 1;
      p.weapon.durability -= 1;
      if (p.weapon.durability <= 0) destroyWeapon(side);
    }

    // 5. Knife Juggler (단검 곡예사 NEW1_019): 1 damage to random enemy
    const jugglers = p.board.filter((m) => m.uid !== minion.uid && !m.silenced && m.cardId === 'NEW1_019');
    for (const j of jugglers) {
      const enemySide = getEnemySide(side);
      const livingEnemies = getPlayer(enemySide).board.filter((em) => getMinionHealth(em) > 0);
      const pool = [`${enemySide}_HERO`, ...livingEnemies.map((em) => em.uid)];
      const pick = pool[Math.floor(Math.random() * pool.length)];
      dealDamage(pick, 1, side, 'ARCANE_BOLT', j.uid);
    }

    recalculateAuras();
    return minion;
  };

  const buffMinion = (
    minionUid: string,
    atkDelta: number,
    hpDelta: number,
    opts?: {
      tempAtk?: number;
      taunt?: boolean;
      divineShield?: boolean;
      charge?: boolean;
      windfury?: boolean;
      stealth?: boolean;
      spellDamage?: number;
    },
  ) => {
    const f = findMinion(minionUid);
    if (!f) return;
    const m = f.minion;
    m.permAttack = Math.max(0, m.permAttack + atkDelta);
    if (hpDelta !== 0) {
      m.maxHealth = Math.max(1, m.maxHealth + hpDelta);
      m.health += hpDelta;
    }
    if (opts?.tempAtk) m.tempAttack += opts.tempAtk;
    if (opts?.taunt) m.taunt = true;
    if (opts?.divineShield) m.divineShield = true;
    if (opts?.charge) {
      m.charge = true;
      m.exhausted = false;
    }
    if (opts?.windfury) m.windfury = true;
    if (opts?.stealth) m.stealth = true;
    if (opts?.spellDamage) m.spellDamage += opts.spellDamage;
    recalculateAuras();
    pushVfx('BUFF_POP', m.uid);
  };

  const silenceMinion = (minionUid: string) => {
    const f = findMinion(minionUid);
    if (!f) return;
    const m = f.minion;
    m.silenced = true;
    m.permAttack = m.baseAttack;
    m.tempAttack = 0;
    if (m.health > m.baseHealth) m.health = m.baseHealth;
    m.maxHealth = m.baseHealth;
    m.taunt = false;
    m.divineShield = false;
    m.windfury = false;
    m.stealth = false;
    m.concealedUntilNextTurn = false;
    m.frozen = false;
    m.poisonous = false;
    m.elusive = false;
    m.cantAttack = false;
    m.spellDamage = 0;
    m.soulOfTheForestCount = 0;
    m.ancestralSpiritCount = 0;
    m.blessingOfWisdomOwners = [];
    m.corruptionOwner = null;
    m.powerOverwhelmingDieAtEndTurn = false;
    m.nightmareDestroyOwnerTurn = null;
    recalculateAuras();
    pushVfx('SILENCE_RING', m.uid, undefined, undefined, '침묵!');
  };

  const freezeTarget = (targetId: string) => {
    if (targetId === 'PLAYER_HERO') {
      state.player.frozen = true;
      state.player.freezeSkipClearedAtEndTurn = false;
    } else if (targetId === 'OPPONENT_HERO') {
      state.opponent.frozen = true;
      state.opponent.freezeSkipClearedAtEndTurn = false;
    } else {
      const f = findMinion(targetId);
      if (f) {
        f.minion.frozen = true;
        f.minion.freezeSkipClearedAtEndTurn = false;
      }
    }
  };

  const destroyMinion = (minionUid: string) => {
    const f = findMinion(minionUid);
    if (f) {
      f.minion.health = -999;
      f.minion.cannotReduceBelow1ThisTurn = false;
    }
  };

  const transformMinion = (minionUid: string, newCardId: string): MinionInstance | null => {
    const f = findMinion(minionUid);
    if (!f) return null;
    const replacement = createMinionInstance(f.side, newCardId);
    getPlayer(f.side).board[f.index] = replacement;
    recalculateAuras();
    pushVfx('SILENCE_RING', replacement.uid, undefined, undefined, replacement.name);
    return replacement;
  };

  const bounceMinionToHand = (minionUid: string, costMod = 0) => {
    const f = findMinion(minionUid);
    if (!f) return;
    const board = getPlayer(f.side).board;
    const [removed] = board.splice(f.index, 1);
    const ownerHand = getPlayer(f.side).hand;
    if (ownerHand.length >= 10) {
      // Overfull hand destroys bounced minion!
      pushVfx('EXPLOSION', `${f.side}_HERO`, undefined, undefined, `${removed.name} 파괴!`);
    } else {
      ownerHand.push({ uid: nextUid('hand'), cardId: removed.cardId, costMod });
    }
    recalculateAuras();
  };

  const takeControlOfMinion = (
    minionUid: string,
    newOwner: PlayerSide,
    untilEndOfTurn = false,
  ) => {
    const f = findMinion(minionUid);
    if (!f || f.side === newOwner) return;
    const newBoard = getPlayer(newOwner).board;
    if (newBoard.length >= 7) {
      destroyMinion(minionUid);
      return;
    }
    const [m] = getPlayer(f.side).board.splice(f.index, 1);
    m.owner = newOwner;
    if (untilEndOfTurn) {
      // Shadow Madness grants ability to attack immediately this turn, then returns at end of turn!
      m.exhausted = false;
      (m as MinionInstance & { returnToSideAtEndTurn?: PlayerSide }).returnToSideAtEndTurn = f.side;
    } else {
      m.exhausted = !(m.charge || m.auraCharge);
    }
    newBoard.push(m);
    recalculateAuras();
  };

  const dealDamage = (
    targetId: string,
    amount: number,
    sourceSide: PlayerSide,
    vfx?: VfxKind,
    sourceId?: string,
  ): { actualDamage: number; killed: boolean } => {
    if (amount <= 0) return { actualDamage: 0, killed: false };

    if (targetId === 'PLAYER_HERO' || targetId === 'OPPONENT_HERO') {
      const heroSide: PlayerSide = targetId === 'PLAYER_HERO' ? 'PLAYER' : 'OPPONENT';
      const hero = getPlayer(heroSide);
      if (hero.immuneThisTurn) {
        pushVfx('DIVINE_BREAK', targetId, sourceId, 0, '면역');
        return { actualDamage: 0, killed: false };
      }

      // Check Ice Block (얼음 방패 EX1_295) on opponent's turn when fatal!
      if (state.activeSide !== heroSide && amount > hero.health + hero.armor) {
        const iceBlock = hero.secrets.find((s) => s.cardId === 'EX1_295');
        if (iceBlock) {
          revealSecret(heroSide, iceBlock.uid);
          hero.immuneThisTurn = true;
          return { actualDamage: 0, killed: false };
        }
      }

      let rem = amount;
      if (hero.armor > 0) {
        const absorbed = Math.min(hero.armor, rem);
        hero.armor -= absorbed;
        rem -= absorbed;
      }
      hero.health -= rem;
      if (vfx) pushVfx(vfx, targetId, sourceId, amount);
      pushVfx('DAMAGE_POP', targetId, sourceId, amount, `-${amount}`);

      // Check Eye for an Eye (눈에는 눈 EX1_132) on opponent's turn!
      if (state.activeSide !== heroSide && amount > 0) {
        const eye = hero.secrets.find((s) => s.cardId === 'EX1_132');
        if (eye) {
          revealSecret(heroSide, eye.uid);
          const otherSide = getEnemySide(heroSide);
          dealDamage(`${otherSide}_HERO`, amount, heroSide, 'HOLY_LIGHT');
        }
      }

      return { actualDamage: amount, killed: hero.health <= 0 };
    }

    const f = findMinion(targetId);
    if (!f) return { actualDamage: 0, killed: false };
    const m = f.minion;
    if (m.divineShield) {
      m.divineShield = false;
      pushVfx('DIVINE_BREAK', m.uid, sourceId, 0, '천상의 보호막 파괴');
      return { actualDamage: 0, killed: false };
    }

    let finalDmg = amount;
    if (m.cannotReduceBelow1ThisTurn && getMinionHealth(m) - finalDmg < 1) {
      finalDmg = Math.max(0, getMinionHealth(m) - 1);
    }

    if (finalDmg <= 0) return { actualDamage: 0, killed: false };
    m.health -= finalDmg;
    if (vfx) pushVfx(vfx, m.uid, sourceId, finalDmg);
    pushVfx('DAMAGE_POP', m.uid, sourceId, finalDmg, `-${finalDmg}`);

    // Minion damaged triggers:
    // 1. Frothing Berserker (거품 무는 광전사 EX1_604) on BOTH boards: +1 Attack whenever a minion takes damage
    for (const berserker of [...state.player.board, ...state.opponent.board]) {
      if (!berserker.silenced && berserker.cardId === 'EX1_604') {
        berserker.permAttack += 1;
      }
    }
    // 2. Armorsmith (방어구 제작자 EX1_402): whenever friendly minion takes damage, +1 Armor
    for (const smith of getPlayer(f.side).board) {
      if (!smith.silenced && smith.cardId === 'EX1_402') {
        addArmor(f.side, 1);
      }
    }
    // 3. Gurubashi Berserker (구루바시 광전사 EX1_399): self +3 Attack
    if (!m.silenced && m.cardId === 'EX1_399') {
      m.permAttack += 3;
    }
    // 4. Acolyte of Pain (고통의 수행사제 EX1_007): owner draws 1
    if (!m.silenced && m.cardId === 'EX1_007') {
      drawCards(f.side, 1);
    }

    // Source minion Water Elemental / Cobra / Patient Assassin checks
    if (sourceId) {
      const srcF = findMinion(sourceId);
      if (srcF && !srcF.minion.silenced) {
        if (srcF.minion.cardId === 'CS2_033') {
          freezeTarget(m.uid);
        }
        if (srcF.minion.poisonous) {
          m.health = -999;
        }
      }
    }

    recalculateAuras();
    return { actualDamage: finalDmg, killed: getMinionHealth(m) <= 0 };
  };

  const healTarget = (targetId: string, amount: number, sourceSide: PlayerSide): number => {
    if (amount <= 0) return 0;
    // Auchenai Soulpriest (아키나이 영혼사제 EX1_591) turns healing into damage!
    if (hasActiveAuchenai(sourceSide)) {
      const res = dealDamage(targetId, amount, sourceSide, 'SHADOW_BOLT');
      return -res.actualDamage;
    }

    let restored = 0;
    let wasMinion = false;
    if (targetId === 'PLAYER_HERO' || targetId === 'OPPONENT_HERO') {
      const hSide: PlayerSide = targetId === 'PLAYER_HERO' ? 'PLAYER' : 'OPPONENT';
      const h = getPlayer(hSide);
      restored = Math.max(0, Math.min(amount, h.maxHealth - h.health));
      if (restored > 0) {
        h.health += restored;
        pushVfx('HEAL_POP', targetId, undefined, restored, `+${restored}`);
      }
    } else {
      const f = findMinion(targetId);
      if (f) {
        wasMinion = true;
        const missing = Math.max(0, f.minion.maxHealth - f.minion.health);
        restored = Math.min(amount, missing);
        if (restored > 0) {
          f.minion.health += restored;
          pushVfx('HEAL_POP', f.minion.uid, undefined, restored, `+${restored}`);
        }
      }
    }

    if (restored > 0) {
      // Lightwarden (빛의 감시자 EX1_001): +2 Attack whenever ANY character is healed!
      for (const lw of [...state.player.board, ...state.opponent.board]) {
        if (!lw.silenced && lw.cardId === 'EX1_001') lw.permAttack += 2;
      }
      // Northshire Cleric (북녘골 성직자 CS2_235): whenever a MINION is healed, draw 1!
      if (wasMinion) {
        for (const side of ['PLAYER', 'OPPONENT'] as PlayerSide[]) {
          for (const nc of getPlayer(side).board) {
            if (!nc.silenced && nc.cardId === 'CS2_235') {
              drawCards(side, 1);
            }
          }
        }
      }
      recalculateAuras();
    }
    return restored;
  };

  const checkGameOver = () => {
    const pDead = state.player.health <= 0;
    const oDead = state.opponent.health <= 0;
    if (pDead || oDead) {
      state.phase = 'GAME_OVER';
      state.winner = oDead && !pDead ? 'PLAYER' : pDead && !oDead ? 'OPPONENT' : 'PLAYER';
      pushVfx('HERO_EXPLODE', oDead ? 'OPPONENT_HERO' : 'PLAYER_HERO');
    }
  };

  const resolveDeaths = () => {
    let loopGuard = 0;
    while (loopGuard < 12) {
      loopGuard += 1;
      recalculateAuras();
      const dying: { minion: MinionInstance; side: PlayerSide; index: number }[] = [];
      for (const side of ['PLAYER', 'OPPONENT'] as PlayerSide[]) {
        const b = getPlayer(side).board;
        b.forEach((m, idx) => {
          if (getMinionHealth(m) <= 0) {
            dying.push({ minion: m, side, index: idx });
          }
        });
      }
      if (dying.length === 0) break;

      // Remove dead minions first
      for (const side of ['PLAYER', 'OPPONENT'] as PlayerSide[]) {
        const p = getPlayer(side);
        const deadHere = p.board.filter((m) => getMinionHealth(m) <= 0);
        p.board = p.board.filter((m) => getMinionHealth(m) > 0);
        for (const dm of deadHere) p.graveyard.push(dm.cardId);
      }

      // Sort dying minions in Hearthstone play order!
      dying.sort((a, b) => a.minion.playOrder - b.minion.playOrder);

      for (const { minion: dm, side: dSide, index: dIndex } of dying) {
        // 1. Flesheating Ghoul (굶주린 식인 구울 tt_004): +1 Attack whenever any minion dies
        for (const ghoul of [...state.player.board, ...state.opponent.board]) {
          if (!ghoul.silenced && ghoul.cardId === 'tt_004') ghoul.permAttack += 1;
        }
        // 2. Cult Master (이교도 지도자 EX1_595): friendly minion dies -> draw 1
        for (const cm of getPlayer(dSide).board) {
          if (!cm.silenced && cm.cardId === 'EX1_595') drawCards(dSide, 1);
        }
        // 3. Scavenging Hyena (청소부 하이에나 EX1_531): friendly Beast dies -> +2/+1
        if (dm.race === 'BEAST') {
          for (const hy of getPlayer(dSide).board) {
            if (!hy.silenced && hy.cardId === 'EX1_531') {
              hy.permAttack += 2;
              hy.maxHealth += 1;
              hy.health += 1;
            }
          }
        }
        // 4. Paladin Secret: Redemption (구원 EX1_136) when friendly minion dies on opponent's turn!
        if (state.activeSide !== dSide) {
          const red = getPlayer(dSide).secrets.find((s) => s.cardId === 'EX1_136');
          if (red && getPlayer(dSide).board.length < 7) {
            revealSecret(dSide, red.uid);
            const revived = summonMinion(dSide, dm.cardId, dIndex);
            if (revived) revived.health = 1;
          }
        }

        // 5. Deathrattles (skipped if Silenced!)
        if (!dm.silenced) {
          switch (dm.cardId) {
            case 'EX1_029': // 오염된 노움
              dealDamage(`${getEnemySide(dSide)}_HERO`, 2, dSide, 'SHADOW_BOLT');
              break;
            case 'EX1_096': // 전리품 수집가
            case 'EX1_012': // 혈법사 탈노스
              drawCards(dSide, 1);
              break;
            case 'EX1_556': // 허수아비골렘
              summonMinion(dSide, 'skele21', dIndex);
              break;
            case 'EX1_534': // 사바나 사자
              summonMinion(dSide, 'EX1_534t', dIndex);
              summonMinion(dSide, 'EX1_534t', dIndex + 1);
              break;
            case 'EX1_097': // 누더기골렘 (모든 캐릭터 피해 2!)
              for (const tid of [
                'PLAYER_HERO',
                'OPPONENT_HERO',
                ...state.player.board.map((x) => x.uid),
                ...state.opponent.board.map((x) => x.uid),
              ]) {
                dealDamage(tid, 2, dSide, 'EXPLOSION');
              }
              break;
            case 'EX1_577': // 괴수 (상대에게 3/3 핍 퀵위트 소환)
              summonMinion(getEnemySide(dSide), 'EX1_finkle');
              break;
            case 'EX1_016': { // 실바나스 윈드러너 (무작위 적 하수인 강탈!)
              const enemies = getPlayer(getEnemySide(dSide)).board;
              if (enemies.length > 0) {
                const pick = enemies[Math.floor(Math.random() * enemies.length)];
                takeControlOfMinion(pick.uid, dSide, false);
              }
              break;
            }
            case 'EX1_110': // 케른 블러드후프 -> 4/5 바인 블러드후프
              summonMinion(dSide, 'EX1_110t', dIndex);
              break;
            case 'EX1_383': // 티리온 폴드링 -> 5/3 파멸의 인도자!
              equipWeapon(dSide, 'EX1_383t');
              break;
          }

          for (let i = 0; i < dm.soulOfTheForestCount; i++) {
            summonMinion(dSide, 'EX1_tk9', dIndex);
          }
          for (let i = 0; i < dm.ancestralSpiritCount; i++) {
            summonMinion(dSide, dm.cardId, dIndex);
          }
        }
      }
    }
    recalculateAuras();
    checkGameOver();
  };

  const ops: EngineOps = {
    state,
    getPlayer,
    getEnemySide,
    getSpellDamageValue,
    getHealValue,
    dealDamage,
    healTarget,
    addArmor,
    drawCards,
    addCardToHand,
    discardRandomCards,
    summonMinion,
    equipWeapon,
    destroyWeapon,
    silenceMinion,
    freezeTarget,
    destroyMinion,
    transformMinion,
    bounceMinionToHand,
    takeControlOfMinion,
    buffMinion,
    findMinion,
    getAdjacentMinions,
    pushVfx,
    resolveDeaths,
    recalculateAuras,
  };

  const getEffectiveCardCost = (side: PlayerSide, hc: HandCardInstance): number => {
    const def = cardDb.mustGetCard(hc.cardId);
    const p = getPlayer(side);
    let cost = def.cost + hc.costMod;

    if (def.type === 'SPELL') {
      if (p.spellsZeroThisTurn) return 0;
      if (def.mechanics.includes('SECRET') && p.nextSecretZeroThisTurn) return 0;
      const apprentices = p.board.filter((m) => !m.silenced && m.cardId === 'EX1_608').length;
      cost -= apprentices;
      cost -= p.nextSpellDiscountThisTurn;
    } else if (def.type === 'MINION') {
      // Pint-Sized Summoner (자그마한 소환사 EX1_076)
      if (p.minionsPlayedThisTurn === 0) {
        const pints = p.board.filter((m) => !m.silenced && m.cardId === 'EX1_076').length;
        cost -= pints;
      }
      // Summoning Portal (소환의 문 EX1_315): -2, not less than 1
      const portals = p.board.filter((m) => !m.silenced && m.cardId === 'EX1_315').length;
      if (portals > 0 && cost > 1) {
        cost = Math.max(1, cost - portals * 2);
      }
      // Mana Wraith (마나 망령 EX1_616) on BOTH boards: +1
      const wraiths = [...state.player.board, ...state.opponent.board].filter(
        (m) => !m.silenced && m.cardId === 'EX1_616',
      ).length;
      cost += wraiths;
      // Venture Co. Mercenary (투자개발회사 용병 CS2_227): +3
      const ventures = p.board.filter((m) => !m.silenced && m.cardId === 'CS2_227').length;
      cost += ventures * 3;

      // Dynamic Giant / Pirate cost reductions:
      if (def.id === 'NEW1_022' && p.weapon) {
        cost -= p.weapon.attack;
      } else if (def.id === 'EX1_586') {
        // 바다 거인
        cost -= state.player.board.length + state.opponent.board.length;
      } else if (def.id === 'EX1_105') {
        // 산악 거인
        const otherCards = Math.max(0, p.hand.filter((x) => x.uid !== hc.uid).length);
        cost -= otherCards;
      } else if (def.id === 'EX1_620') {
        // 용암 거인
        cost -= Math.max(0, p.maxHealth - p.health);
      }
    }

    return Math.max(0, cost);
  };

  const getValidTargetsForKind = (
    side: PlayerSide,
    kind: TargetKind,
    isSpellOrHeroPower: boolean,
    excludeMinionUid?: string,
  ): string[] => {
    if (kind === 'NONE') return [];
    const enemySide = getEnemySide(side);
    const fMinions = getPlayer(side).board.filter((m) => m.uid !== excludeMinionUid);
    // Enemy stealthed minions cannot be targeted by enemy spells, hero powers, or battlecries!
    const eMinions = getPlayer(enemySide).board.filter(
      (m) => m.uid !== excludeMinionUid && !m.stealth,
    );
    const filterElusive = (list: MinionInstance[]) =>
      isSpellOrHeroPower ? list.filter((m) => !m.elusive) : list;

    const fm = filterElusive(fMinions);
    const em = filterElusive(eMinions);
    const allM = [...fm, ...em];

    switch (kind) {
      case 'ANY_CHARACTER':
        return [`${side}_HERO`, `${enemySide}_HERO`, ...allM.map((m) => m.uid)];
      case 'ENEMY_CHARACTER':
        return [`${enemySide}_HERO`, ...em.map((m) => m.uid)];
      case 'FRIENDLY_CHARACTER':
        return [`${side}_HERO`, ...fm.map((m) => m.uid)];
      case 'ANY_HERO':
        return [`${side}_HERO`, `${enemySide}_HERO`];
      case 'ANY_MINION':
      case 'OTHER_MINION':
        return allM.map((m) => m.uid);
      case 'ENEMY_MINION':
        return em.map((m) => m.uid);
      case 'FRIENDLY_MINION':
        return fm.map((m) => m.uid);
      case 'DAMAGED_MINION':
        return allM.filter((m) => getMinionHealth(m) < getMinionMaxHealth(m)).map((m) => m.uid);
      case 'UNDAMAGED_MINION':
        return allM.filter((m) => getMinionHealth(m) >= getMinionMaxHealth(m)).map((m) => m.uid);
      case 'DAMAGED_ENEMY_MINION':
        return em.filter((m) => getMinionHealth(m) < getMinionMaxHealth(m)).map((m) => m.uid);
      case 'FRIENDLY_BEAST':
        return fm.filter((m) => m.race === 'BEAST').map((m) => m.uid);
      case 'ANY_MURLOC':
        return allM.filter((m) => m.race === 'MURLOC').map((m) => m.uid);
      case 'ANY_DEMON':
        return allM.filter((m) => m.race === 'DEMON').map((m) => m.uid);
      case 'ENEMY_TAUNT_MINION':
        return em.filter((m) => hasMinionTaunt(m)).map((m) => m.uid);
      case 'ATK_7_PLUS_MINION':
        return allM.filter((m) => getMinionAttack(m) >= 7).map((m) => m.uid);
      case 'ATK_3_OR_LESS_MINION':
        return allM.filter((m) => getMinionAttack(m) <= 3).map((m) => m.uid);
      case 'ATK_5_PLUS_MINION':
        return allM.filter((m) => getMinionAttack(m) >= 5).map((m) => m.uid);
      case 'ENEMY_ATK_3_OR_LESS_MINION':
        return em.filter((m) => getMinionAttack(m) <= 3).map((m) => m.uid);
      case 'ENEMY_ATK_2_OR_LESS_MINION':
        return em.filter((m) => getMinionAttack(m) <= 2).map((m) => m.uid);
      default:
        return [];
    }
  };

  const inspectPlayability = (
    side: PlayerSide,
    hc: HandCardInstance,
  ): {
    canPlay: boolean;
    reason?: string;
    cost: number;
    needsTarget: boolean;
    validTargets: string[];
    isComboReady: boolean;
    hasChooseOne: boolean;
  } => {
    const p = getPlayer(side);
    const def = cardDb.mustGetCard(hc.cardId);
    const cost = getEffectiveCardCost(side, hc);
    const isComboReady =
      (def.mechanics.includes('COMBO') || Boolean(CARD_SCRIPTS[def.id]?.comboTargetKind)) &&
      p.cardsPlayedThisTurn > 0;
    const spec = CARD_SCRIPTS[def.id];
    const hasChooseOne = Boolean(spec?.chooseOne);

    if (state.phase !== 'PLAYING' || state.activeSide !== side) {
      return { canPlay: false, reason: '내 턴이 아닙니다.', cost, needsTarget: false, validTargets: [], isComboReady, hasChooseOne };
    }
    if (cost > p.mana) {
      return { canPlay: false, reason: '마나가 부족합니다!', cost, needsTarget: false, validTargets: [], isComboReady, hasChooseOne };
    }
    if (def.type === 'MINION' && p.board.length >= 7) {
      return { canPlay: false, reason: '하수인이 너무 많습니다!', cost, needsTarget: false, validTargets: [], isComboReady, hasChooseOne };
    }
    if (def.mechanics.includes('SECRET')) {
      if (p.secrets.length >= 5 || p.secrets.some((s) => s.cardId === def.id)) {
        return { canPlay: false, reason: '이미 같은 비밀이 활성화되어 있습니다.', cost, needsTarget: false, validTargets: [], isComboReady, hasChooseOne };
      }
      return { canPlay: true, cost, needsTarget: false, validTargets: [], isComboReady, hasChooseOne };
    }
    // Special weapon requirements (Deadly Poison / Blade Flurry require equipped weapon!)
    if ((def.id === 'CS2_074' || def.id === 'CS2_233') && !p.weapon) {
      return { canPlay: false, reason: '장착한 무기가 없습니다!', cost, needsTarget: false, validTargets: [], isComboReady, hasChooseOne };
    }
    // Cleave / Multi-Shot require >= 2 enemy minions in Classic, Forked Lightning >= 2 (we allow >= 1 for smoother UX, or check >= 1)
    if ((def.id === 'CS2_114' || def.id === 'DS1_183' || def.id === 'EX1_251' || def.id === 'EX1_617') && getPlayer(getEnemySide(side)).board.length === 0) {
      return { canPlay: false, reason: '적 하수인이 없습니다!', cost, needsTarget: false, validTargets: [], isComboReady, hasChooseOne };
    }

    if (hasChooseOne && spec?.chooseOne) {
      return { canPlay: true, cost, needsTarget: false, validTargets: [], isComboReady, hasChooseOne: true };
    }

    const activeTargetKind =
      isComboReady && spec?.comboTargetKind ? spec.comboTargetKind : spec?.targetKind || 'NONE';

    if (activeTargetKind !== 'NONE') {
      const isSpell = def.type === 'SPELL';
      const validTargets = getValidTargetsForKind(side, activeTargetKind, isSpell);
      if (isSpell && validTargets.length === 0) {
        return {
          canPlay: false,
          reason: '유효한 대상이 없습니다!',
          cost,
          needsTarget: true,
          validTargets: [],
          isComboReady,
          hasChooseOne: false,
        };
      }
      // For Minions & Weapons: if validTargets exist, requires selecting a target; if 0 validTargets, can play without target!
      return {
        canPlay: true,
        cost,
        needsTarget: validTargets.length > 0,
        validTargets,
        isComboReady,
        hasChooseOne: false,
      };
    }

    return {
      canPlay: true,
      cost,
      needsTarget: false,
      validTargets: [],
      isComboReady,
      hasChooseOne: false,
    };
  };

  const beginTurn = (side: PlayerSide) => {
    state.activeSide = side;
    state.turnNumber += 1;
    state.chooseOnePrompt = null;
    state.trackingPrompt = null;
    const p = getPlayer(side);

    // Clear Conceal stealth on start of owner's turn
    for (const m of p.board) {
      if (m.concealedUntilNextTurn) {
        m.concealedUntilNextTurn = false;
        m.stealth = false;
      }
      m.attacksMadeThisTurn = 0;
      m.exhausted = false;
      m.cannotReduceBelow1ThisTurn = false;
    }

    p.immuneThisTurn = false;
    p.heroPowerUsedThisTurn = false;
    p.attacksMadeThisTurn = 0;
    p.tempAttack = 0;
    p.cardsPlayedThisTurn = 0;
    p.minionsPlayedThisTurn = 0;
    p.nextSecretZeroThisTurn = false;
    p.nextSpellDiscountThisTurn = 0;
    p.commandingShoutThisTurn = false;

    // Gain +1 Max Mana up to 10, apply Overload from previous turn
    p.maxMana = Math.min(10, p.maxMana + 1);
    p.overloadedMana = p.pendingOverload;
    p.pendingOverload = 0;
    p.mana = Math.max(0, p.maxMana - p.overloadedMana);

    // Start-of-turn triggers!
    // 1. Corruption (부패) & Nightmare (악몽)
    for (const m of [...state.player.board, ...state.opponent.board]) {
      if (m.corruptionOwner === side || m.nightmareDestroyOwnerTurn === side) {
        destroyMinion(m.uid);
      }
    }
    // 2. Doomsayer (파멸의 예언자 NEW1_021)
    if (p.board.some((m) => !m.silenced && m.cardId === 'NEW1_021')) {
      pushVfx('EXPLOSION', `${side}_HERO`, undefined, undefined, '종말이 다가온다!!');
      for (const m of [...state.player.board, ...state.opponent.board]) {
        destroyMinion(m.uid);
      }
      resolveDeaths();
    }
    // 3. Nat Pagle (내트 페이글 EX1_557), Demolisher (파괴전차 EX1_102), Lightwell (빛샘 EX1_341), Alarm-o-Bot (EX1_006), Mekka1, Mekka4
    for (const m of [...p.board]) {
      if (m.silenced || getMinionHealth(m) <= 0) continue;
      if (m.cardId === 'EX1_557' && Math.random() < 0.5) {
        drawCards(side, 1);
      } else if (m.cardId === 'EX1_102') {
        const enemySide = getEnemySide(side);
        const pool = [`${enemySide}_HERO`, ...getPlayer(enemySide).board.map((em) => em.uid)];
        const pick = pool[Math.floor(Math.random() * pool.length)];
        dealDamage(pick, 2, side, 'FIREBALL', m.uid);
      } else if (m.cardId === 'EX1_341') {
        const damagedFriendly: string[] = [];
        if (p.health < p.maxHealth) damagedFriendly.push(`${side}_HERO`);
        for (const fm of p.board) {
          if (getMinionHealth(fm) < getMinionMaxHealth(fm)) damagedFriendly.push(fm.uid);
        }
        if (damagedFriendly.length > 0) {
          const pick = damagedFriendly[Math.floor(Math.random() * damagedFriendly.length)];
          healTarget(pick, 3, side);
        }
      } else if (m.cardId === 'EX1_006') {
        const minionHandIdxs = p.hand
          .map((hc, idx) => ({ hc, idx }))
          .filter((x) => cardDb.getCard(x.hc.cardId)?.type === 'MINION');
        if (minionHandIdxs.length > 0) {
          const picked = minionHandIdxs[Math.floor(Math.random() * minionHandIdxs.length)];
          const bIdx = p.board.findIndex((bm) => bm.uid === m.uid);
          if (bIdx >= 0) {
            p.hand.splice(picked.idx, 1);
            p.board.splice(bIdx, 1);
            p.hand.push({ uid: nextUid('hand'), cardId: m.cardId, costMod: 0 });
            summonMinion(side, picked.hc.cardId, bIdx);
          }
        }
      } else if (m.cardId === 'Mekka1') {
        destroyMinion(m.uid);
        drawCards(side, 3);
      } else if (m.cardId === 'Mekka4') {
        const allM = [...state.player.board, ...state.opponent.board];
        if (allM.length > 0) {
          const pick = allM[Math.floor(Math.random() * allM.length)];
          transformMinion(pick.uid, 'Mekka4t');
        }
      }
    }

    resolveDeaths();
    if (state.phase === 'GAME_OVER') return;

    // Normal Turn Draw
    drawCards(side, 1);
    resolveDeaths();
    recalculateAuras();
    state.turnSecondsLeft = state.maxTurnSeconds;
    state.bannerMessage = side === 'PLAYER' ? '내 턴!' : '상대 턴';
  };

  const confirmMulligan = (replaceHandUids: string[]) => {
    if (state.phase !== 'MULLIGAN') return state;
    // Player replaces selected cards
    const p = state.player;
    const newHand: HandCardInstance[] = [];
    const returnedCards: string[] = [];
    for (const hc of p.hand) {
      if (replaceHandUids.includes(hc.uid) && p.deck.length > 0) {
        const replacement = p.deck.shift()!;
        returnedCards.push(hc.cardId);
        newHand.push({ uid: nextUid('hand'), cardId: replacement, costMod: 0 });
      } else {
        newHand.push(hc);
      }
    }
    p.hand = newHand;
    p.deck = shuffleArray([...p.deck, ...returnedCards]);

    // AI smart Mulligan: replace cards costing >= 4
    const o = state.opponent;
    const oNewHand: HandCardInstance[] = [];
    const oReturned: string[] = [];
    for (const hc of o.hand) {
      const def = cardDb.mustGetCard(hc.cardId);
      if (def.cost >= 4 && o.deck.length > 0) {
        oReturned.push(hc.cardId);
        oNewHand.push({ uid: nextUid('hand'), cardId: o.deck.shift()!, costMod: 0 });
      } else {
        oNewHand.push(hc);
      }
    }
    o.hand = oNewHand;
    o.deck = shuffleArray([...o.deck, ...oReturned]);

    // Second player receives The Coin (GAME_005)!
    const secondSide: PlayerSide = state.firstPlayer === 'PLAYER' ? 'OPPONENT' : 'PLAYER';
    getPlayer(secondSide).hand.push({
      uid: nextUid('coin'),
      cardId: 'GAME_005',
      costMod: 0,
    });

    state.phase = 'PLAYING';
    state.mulliganSelectedUids = [];
    beginTurn(state.firstPlayer);
    return state;
  };

  const playCardFromHand = (
    side: PlayerSide,
    handUid: string,
    opts?: {
      targetId?: string;
      insertIndex?: number;
      chooseOptionIndex?: 0 | 1;
    },
  ): BattleMatchState => {
    const p = getPlayer(side);
    const hIdx = p.hand.findIndex((h) => h.uid === handUid);
    if (hIdx < 0) return state;
    const hc = p.hand[hIdx];
    const check = inspectPlayability(side, hc);
    if (!check.canPlay) {
      state.errorBanner = check.reason || '낼 수 없는 카드입니다.';
      return state;
    }

    const def = cardDb.mustGetCard(hc.cardId);
    const spec = CARD_SCRIPTS[def.id];

    // If Choose One and option not yet picked (for Player UI): open ChooseOnePrompt!
    if (spec?.chooseOne && opts?.chooseOptionIndex === undefined) {
      const optModels = spec.chooseOne.map((sub, idx) => {
        const validTargets = getValidTargetsForKind(
          side,
          sub.targetKind,
          def.type === 'SPELL',
        );
        return {
          index: idx as 0 | 1,
          optionCardId: sub.optionCardId,
          title: sub.title,
          description: sub.description,
          needsTarget: sub.targetKind !== 'NONE' && validTargets.length > 0,
          validTargets,
        };
      });
      state.chooseOnePrompt = {
        sourceHandUid: handUid,
        cardId: def.id,
        insertIndex: opts?.insertIndex ?? p.board.length,
        options: optModels,
      };
      return state;
    }

    // Pay mana & remove from hand
    const isCombo = p.cardsPlayedThisTurn > 0;
    p.hand.splice(hIdx, 1);
    p.mana = Math.max(0, p.mana - check.cost);
    if (def.overload > 0) {
      p.pendingOverload += def.overload;
    }
    p.cardsPlayedThisTurn += 1;
    state.chooseOnePrompt = null;
    state.errorBanner = null;

    // Trigger Whenever-Card-Played abilities BEFORE resolving effect (Questing Adventurer, Illidan, Unbound Elemental, Secretkeeper)
    for (const m of p.board) {
      if (m.silenced) continue;
      if (m.cardId === 'EX1_044') {
        buffMinion(m.uid, 1, 1);
      } else if (m.cardId === 'EX1_614') {
        summonMinion(side, 'TU4e_002t');
      } else if (m.cardId === 'EX1_258' && def.overload > 0) {
        buffMinion(m.uid, 1, 1);
      }
    }
    if (def.mechanics.includes('SECRET')) {
      p.nextSecretZeroThisTurn = false;
      for (const sk of [...state.player.board, ...state.opponent.board]) {
        if (!sk.silenced && sk.cardId === 'EX1_080') buffMinion(sk.uid, 1, 1);
      }
    }

    const enemySide = getEnemySide(side);
    const enemy = getPlayer(enemySide);
    let targetId = opts?.targetId;

    if (def.type === 'SPELL') {
      p.nextSpellDiscountThisTurn = 0;

      // Trigger Whenever-Spell-Cast BEFORE Counterspell check? In HS, Mana Wyrm / Antonidas / Auctioneer / Violet Teacher / Cho trigger on cast!
      for (const m of [...p.board]) {
        if (m.silenced) continue;
        if (m.cardId === 'NEW1_012') m.permAttack += 1;
        else if (m.cardId === 'EX1_055') m.tempAttack += 2;
        else if (m.cardId === 'EX1_095') drawCards(side, 1);
        else if (m.cardId === 'NEW1_026') summonMinion(side, 'NEW1_026t');
        else if (m.cardId === 'EX1_559') addCardToHand(side, 'CS2_029');
      }
      for (const cho of [...state.player.board, ...state.opponent.board]) {
        if (!cho.silenced && cho.cardId === 'EX1_100') {
          addCardToHand(enemySide, def.id);
        }
      }

      // Enemy Counterspell (마법 차단 EX1_287) check!
      const counter = enemy.secrets.find((s) => s.cardId === 'EX1_287');
      if (counter) {
        revealSecret(enemySide, counter.uid);
        pushHistory({
          actorSide: side,
          cardId: def.id,
          title: `${def.name} (차단됨!)`,
          detail: `상대의 [마법 차단] 비밀로 인해 [${def.name}] 주문이 무효화되었습니다!`,
          kind: 'CAST_SPELL',
        });
        recalculateAuras();
        return state;
      }

      // Enemy Spellbender (주문왜곡사 tt_010) check when targeting a minion!
      if (targetId && targetId !== 'PLAYER_HERO' && targetId !== 'OPPONENT_HERO') {
        const bender = enemy.secrets.find((s) => s.cardId === 'tt_010');
        if (bender && enemy.board.length < 7) {
          revealSecret(enemySide, bender.uid);
          const sub = summonMinion(enemySide, 'tt_010a');
          if (sub) targetId = sub.uid;
        }
      }

      if (def.mechanics.includes('SECRET')) {
        p.secrets.push({
          uid: nextUid('sec'),
          cardId: def.id,
          name: def.name,
          heroClass: p.heroClass,
        });
        pushHistory({
          actorSide: side,
          cardId: def.id,
          title: side === 'PLAYER' ? `비밀: ${def.name}` : `${p.heroNameKo}의 비밀`,
          detail: side === 'PLAYER' ? `[${def.name}] 비밀을 설치했습니다.` : '상대편이 비밀을 설치했습니다.',
          kind: 'CAST_SPELL',
        });
      } else if (spec?.chooseOne && opts?.chooseOptionIndex !== undefined) {
        const sub = spec.chooseOne[opts.chooseOptionIndex];
        sub.run(ops, side, targetId);
        pushHistory({
          actorSide: side,
          cardId: def.id,
          title: `${def.name} (${sub.title})`,
          detail: sub.description,
          kind: 'CAST_SPELL',
        });
      } else {
        spec?.onCastSpell?.(ops, side, targetId, isCombo);
        pushHistory({
          actorSide: side,
          cardId: def.id,
          title: def.name,
          detail: def.text.replace(/<[^>]+>/g, '').replace(/\[x\]/g, ''),
          kind: 'CAST_SPELL',
        });
      }

      // Wild Pyromancer (광기의 화염술사 NEW1_020): AFTER spell resolves, 1 damage to ALL minions!
      const pyros = p.board.filter((m) => !m.silenced && m.cardId === 'NEW1_020' && getMinionHealth(m) > 0);
      for (const py of pyros) {
        for (const m of [...state.player.board, ...state.opponent.board]) {
          dealDamage(m.uid, 1, side, 'WHIRLWIND', py.uid);
        }
      }
    } else if (def.type === 'WEAPON') {
      equipWeapon(side, def.id);
      spec?.onCastSpell?.(ops, side, targetId, isCombo);
      pushHistory({
        actorSide: side,
        cardId: def.id,
        title: def.name,
        detail: `${def.attack}/${def.durability} 무기를 장착했습니다.`,
        kind: 'EQUIP_WEAPON',
      });
    } else if (def.type === 'MINION') {
      p.minionsPlayedThisTurn += 1;
      const summoned = summonMinion(side, def.id, opts?.insertIndex);
      if (summoned) {
        if (spec?.chooseOne && opts?.chooseOptionIndex !== undefined) {
          spec.chooseOne[opts.chooseOptionIndex].run(ops, side, targetId, summoned);
        } else {
          spec?.onBattlecry?.(ops, side, summoned, targetId, isCombo);
        }

        // Check if minion is still on board (e.g. Jaraxxus replaces hero!)
        const stillThere = findMinion(summoned.uid);
        if (stillThere && getMinionHealth(stillThere.minion) > 0) {
          // Opponent On-Play-Minion Secrets: Mirror Entity (EX1_294), Snipe (EX1_609), Repentance (EX1_379)!
          for (const sec of [...enemy.secrets]) {
            if (getMinionHealth(stillThere.minion) <= 0) break;
            if (sec.cardId === 'EX1_294' && enemy.board.length < 7) {
              revealSecret(enemySide, sec.uid);
              const copy = summonMinion(enemySide, stillThere.minion.cardId);
              if (copy) {
                copy.permAttack = stillThere.minion.permAttack;
                copy.maxHealth = stillThere.minion.maxHealth;
                copy.health = stillThere.minion.health;
                copy.taunt = stillThere.minion.taunt;
                copy.divineShield = stillThere.minion.divineShield;
              }
            } else if (sec.cardId === 'EX1_609') {
              revealSecret(enemySide, sec.uid);
              dealDamage(stillThere.minion.uid, 4, enemySide, 'ARCANE_BOLT');
            } else if (sec.cardId === 'EX1_379') {
              revealSecret(enemySide, sec.uid);
              stillThere.minion.maxHealth = 1;
              stillThere.minion.health = 1;
            }
          }
        }

        pushHistory({
          actorSide: side,
          cardId: def.id,
          title: def.name,
          detail: `${def.name} 소환`,
          kind: 'PLAY_MINION',
        });
      }
    }

    resolveDeaths();
    return state;
  };

  const resolveTrackingChoice = (chosenCardId: string): BattleMatchState => {
    if (!state.trackingPrompt) return state;
    addCardToHand('PLAYER', chosenCardId);
    state.trackingPrompt = null;
    recalculateAuras();
    return state;
  };

  const inspectHeroPower = (
    side: PlayerSide,
  ): {
    canUse: boolean;
    reason?: string;
    needsTarget: boolean;
    validTargets: string[];
  } => {
    const p = getPlayer(side);
    if (state.phase !== 'PLAYING' || state.activeSide !== side) {
      return { canUse: false, reason: '내 턴이 아닙니다.', needsTarget: false, validTargets: [] };
    }
    if (p.heroPowerUsedThisTurn) {
      return { canUse: false, reason: '이번 턴에 이미 영웅 능력을 사용했습니다.', needsTarget: false, validTargets: [] };
    }
    if (p.mana < 2) {
      return { canUse: false, reason: '마나가 부족합니다!', needsTarget: false, validTargets: [] };
    }
    if (p.heroPowerId === 'HERO_04bp' || p.heroPowerId === 'EX1_tk33') {
      if (p.board.length >= 7) {
        return { canUse: false, reason: '하수인이 너무 많습니다!', needsTarget: false, validTargets: [] };
      }
    }
    if (p.heroPowerId === 'HERO_02bp') {
      if (p.board.length >= 7) {
        return { canUse: false, reason: '하수인이 너무 많습니다!', needsTarget: false, validTargets: [] };
      }
      const basicTotems = ['CS2_050', 'CS2_051', 'CS2_052', 'NEW1_009'];
      const missing = basicTotems.filter((tid) => !p.board.some((m) => m.cardId === tid));
      if (missing.length === 0) {
        return { canUse: false, reason: '모든 기본 토템이 이미 전장에 있습니다!', needsTarget: false, validTargets: [] };
      }
    }

    if (p.heroPowerNeedsTarget) {
      const validTargets = getValidTargetsForKind(side, 'ANY_CHARACTER', true);
      return { canUse: validTargets.length > 0, needsTarget: true, validTargets };
    }
    return { canUse: true, needsTarget: false, validTargets: [] };
  };

  const useHeroPower = (side: PlayerSide, targetId?: string): BattleMatchState => {
    const check = inspectHeroPower(side);
    if (!check.canUse) {
      state.errorBanner = check.reason || '영웅 능력을 사용할 수 없습니다.';
      return state;
    }
    const p = getPlayer(side);
    const enemySide = getEnemySide(side);
    p.mana -= 2;
    p.heroPowerUsedThisTurn = true;
    const mult = hasActiveVelen(side);

    switch (p.heroPowerId) {
      case 'HERO_08bp': // 마법사: 화염 작렬 (1 피해)
        if (targetId) dealDamage(targetId, 1 * mult, side, 'FIREBALL', `${side}_HERO`);
        break;
      case 'HERO_01bp': // 전사: 방어도 증가! (+2 방어도)
        addArmor(side, 2);
        break;
      case 'HERO_05bp': // 사냥꾼: 고정 사격 (적 영웅 2 피해)
        dealDamage(`${enemySide}_HERO`, 2 * mult, side, 'ARCANE_BOLT', `${side}_HERO`);
        break;
      case 'HERO_04bp': // 성기사: 병력 충원 (1/1 신병)
        summonMinion(side, 'CS2_101t');
        break;
      case 'HERO_09bp': // 사제: 하급 치유 (2 치유)
        if (targetId) healTarget(targetId, 2 * mult, side);
        break;
      case 'EX1_625t': // 어둠의 형상 1단계: 정신의 쐐기 (2 피해)
        if (targetId) dealDamage(targetId, 2 * mult, side, 'SHADOW_BOLT', `${side}_HERO`);
        break;
      case 'EX1_625t2': // 어둠의 형상 2단계: 정신 붕괴 (3 피해)
        if (targetId) dealDamage(targetId, 3 * mult, side, 'SHADOW_BOLT', `${side}_HERO`);
        break;
      case 'HERO_03bp': // 도적: 단검의 대가 (1/2 단검)
        equipWeapon(side, 'CS2_082');
        break;
      case 'HERO_02bp': { // 주술사: 토템 소환 (미보유 기본 토템 무작위 1종)
        const basicTotems = ['CS2_050', 'CS2_051', 'CS2_052', 'NEW1_009'];
        const missing = basicTotems.filter((tid) => !p.board.some((m) => m.cardId === tid));
        if (missing.length > 0) {
          summonMinion(side, missing[Math.floor(Math.random() * missing.length)]);
        }
        break;
      }
      case 'HERO_07bp': // 흑마법사: 생명력 전환 (내 영웅 2 피해 + 드로우 1)
        dealDamage(`${side}_HERO`, 2 * mult, side, 'SHADOW_BOLT', `${side}_HERO`);
        drawCards(side, 1);
        break;
      case 'HERO_06bp': // 드루이드: 변신 (+1 공격력, +1 방어도)
        p.tempAttack += 1;
        addArmor(side, 1);
        break;
      case 'EX1_tk33': // 군주 자락서스: 지옥불! (6/6 지옥불악마 소환!)
        summonMinion(side, 'EX1_tk34');
        break;
    }

    pushHistory({
      actorSide: side,
      cardId: p.heroPowerId,
      title: p.heroPowerNameKo,
      detail: `${p.heroNameKo} 영웅 능력 사용`,
      kind: 'HERO_POWER',
    });

    resolveDeaths();
    return state;
  };

  const canAttackerSwing = (
    side: PlayerSide,
    attackerId: string,
  ): { ok: boolean; reason?: string; errorCode?: 'exhausted' | 'attacked' | 'taunt' } => {
    if (state.phase !== 'PLAYING' || state.activeSide !== side) {
      return { ok: false, reason: '내 턴이 아닙니다.' };
    }
    const p = getPlayer(side);
    if (attackerId === `${side}_HERO`) {
      if (p.frozen) return { ok: false, reason: '빙결된 캐릭터는 공격할 수 없습니다!' };
      const atk = getHeroAttack(p, true);
      if (atk <= 0) return { ok: false, reason: '공격력이 없는 캐릭터입니다.' };
      const maxSwings = p.weapon?.windfury ? 2 : 1;
      if (p.attacksMadeThisTurn >= maxSwings) {
        return { ok: false, reason: '이미 공격했습니다!', errorCode: 'attacked' };
      }
      return { ok: true };
    }

    const f = findMinion(attackerId);
    if (!f || f.side !== side) return { ok: false, reason: '공격할 수 없는 대상입니다.' };
    const m = f.minion;
    if (m.cantAttack && !m.silenced) {
      return { ok: false, reason: '이 하수인은 공격할 수 없습니다!' };
    }
    if (m.frozen) return { ok: false, reason: '빙결된 하수인은 공격할 수 없습니다!' };
    const hasChargeNow = m.charge || m.auraCharge;
    if (m.exhausted && !hasChargeNow) {
      return {
        ok: false,
        reason: '그 하수인은 소환 후유증 때문에 다음 턴에 공격할 수 있습니다!',
        errorCode: 'exhausted',
      };
    }
    const isEnragedRagingWorgen =
      !m.silenced && m.cardId === 'EX1_412' && getMinionHealth(m) < getMinionMaxHealth(m);
    const maxSwings = m.windfury || isEnragedRagingWorgen ? 2 : 1;
    if (m.attacksMadeThisTurn >= maxSwings) {
      return { ok: false, reason: '그 하수인은 이미 공격했습니다!', errorCode: 'attacked' };
    }
    if (getMinionAttack(m) <= 0) {
      return { ok: false, reason: '공격력이 0인 하수인은 공격할 수 없습니다.' };
    }
    return { ok: true };
  };

  const getValidAttackTargets = (side: PlayerSide, attackerId: string): string[] => {
    if (!canAttackerSwing(side, attackerId).ok) return [];
    const enemySide = getEnemySide(side);
    const enemyMinions = getPlayer(enemySide).board.filter((m) => !m.stealth);
    const taunts = enemyMinions.filter((m) => hasMinionTaunt(m));
    if (taunts.length > 0) {
      return taunts.map((t) => t.uid);
    }
    return [`${enemySide}_HERO`, ...enemyMinions.map((m) => m.uid)];
  };

  const performAttack = (
    side: PlayerSide,
    attackerId: string,
    initialDefenderId: string,
  ): BattleMatchState => {
    const swingCheck = canAttackerSwing(side, attackerId);
    if (!swingCheck.ok) {
      state.errorBanner = swingCheck.reason || '공격할 수 없습니다.';
      return state;
    }

    const enemySide = getEnemySide(side);
    const enemyMinions = getPlayer(enemySide).board.filter((m) => !m.stealth);
    const taunts = enemyMinions.filter((m) => hasMinionTaunt(m));
    if (taunts.length > 0 && !taunts.some((t) => t.uid === initialDefenderId)) {
      state.errorBanner = '도발 능력이 있는 하수인이 가로막고 있습니다!';
      return state;
    }

    let defenderId = initialDefenderId;
    const attackerPlayer = getPlayer(side);
    const defenderPlayer = getPlayer(enemySide);
    const isHeroAttacker = attackerId === `${side}_HERO`;

    // Stealth breaks when attacking; Blessing of Wisdom triggers on minion attack declaration
    if (!isHeroAttacker) {
      const af = findMinion(attackerId);
      if (!af) return state;
      af.minion.stealth = false;
      af.minion.concealedUntilNextTurn = false;
      for (const bwSide of af.minion.blessingOfWisdomOwners) {
        drawCards(bwSide, 1);
      }
    } else {
      // Truesilver Champion (용사의 진은검 CS2_097) heals 2 BEFORE attack resolves!
      if (attackerPlayer.weapon?.cardId === 'CS2_097') {
        healTarget(`${side}_HERO`, 2, side);
      }
      // Gladiator's Longbow (검투사의 장궁 DS1_188) grants Immune while attacking!
      if (attackerPlayer.weapon?.cardId === 'DS1_188') {
        attackerPlayer.immuneThisTurn = true;
      }
    }

    // Check Defender's Attack-Triggered Secrets!
    for (const sec of [...defenderPlayer.secrets]) {
      // Ensure attacker still exists & alive
      if (!isHeroAttacker) {
        const afNow = findMinion(attackerId);
        if (!afNow || getMinionHealth(afNow.minion) <= 0) break;
      } else if (attackerPlayer.health <= 0) {
        break;
      }

      if (sec.cardId === 'EX1_610' && defenderId === `${enemySide}_HERO`) {
        // 폭발의 덫 (Explosive Trap): 2 dmg to all enemies
        revealSecret(enemySide, sec.uid);
        dealDamage(`${side}_HERO`, 2, enemySide, 'EXPLOSION');
        for (const m of [...attackerPlayer.board]) {
          dealDamage(m.uid, 2, enemySide, 'EXPLOSION');
        }
        resolveDeaths();
      } else if (sec.cardId === 'EX1_611' && !isHeroAttacker) {
        // 빙결의 덫 (Freezing Trap): return attacking minion to hand with +2 cost!
        revealSecret(enemySide, sec.uid);
        bounceMinionToHand(attackerId, 2);
        return state;
      } else if (sec.cardId === 'EX1_289' && defenderId === `${enemySide}_HERO`) {
        // 얼음 보호막 (Ice Barrier): +8 Armor
        revealSecret(enemySide, sec.uid);
        addArmor(enemySide, 8);
      } else if (sec.cardId === 'EX1_533' && defenderId === `${enemySide}_HERO`) {
        // 눈속임 (Misdirection): random other character becomes target!
        const candidates = [
          'PLAYER_HERO',
          'OPPONENT_HERO',
          ...state.player.board.map((m) => m.uid),
          ...state.opponent.board.map((m) => m.uid),
        ].filter((id) => id !== defenderId && id !== attackerId);
        if (candidates.length > 0) {
          revealSecret(enemySide, sec.uid);
          defenderId = candidates[Math.floor(Math.random() * candidates.length)];
        }
      } else if (sec.cardId === 'EX1_130' && defenderPlayer.board.length < 7) {
        // 고귀한 희생 (Noble Sacrifice): summon 2/1 Defender as new target!
        revealSecret(enemySide, sec.uid);
        const defMinion = summonMinion(enemySide, 'EX1_130a');
        if (defMinion) defenderId = defMinion.uid;
      } else if (sec.cardId === 'EX1_554' && defenderId !== 'PLAYER_HERO' && defenderId !== 'OPPONENT_HERO') {
        // 뱀 덫 (Snake Trap): when friendly minion attacked, summon three 1/1 Snakes
        const df = findMinion(defenderId);
        if (df && df.side === enemySide) {
          revealSecret(enemySide, sec.uid);
          for (let i = 0; i < 3; i++) summonMinion(enemySide, 'EX1_554t');
        }
      } else if (sec.cardId === 'EX1_594' && !isHeroAttacker && defenderId === `${enemySide}_HERO`) {
        // 증발시키기 (Vaporize): destroy minion attacking hero!
        revealSecret(enemySide, sec.uid);
        destroyMinion(attackerId);
        resolveDeaths();
        return state;
      }
    }

    if (state.phase === 'GAME_OVER') return state;

    // Re-verify attacker and defender still exist after Secret resolution!
    const afFinal = isHeroAttacker ? null : findMinion(attackerId);
    if (!isHeroAttacker && (!afFinal || getMinionHealth(afFinal.minion) <= 0)) {
      resolveDeaths();
      return state;
    }

    const isHeroDefender = defenderId === 'PLAYER_HERO' || defenderId === 'OPPONENT_HERO';
    const dfFinal = isHeroDefender ? null : findMinion(defenderId);
    if (!isHeroDefender && (!dfFinal || getMinionHealth(dfFinal.minion) <= 0)) {
      resolveDeaths();
      return state;
    }

    const atkDamage = isHeroAttacker
      ? getHeroAttack(attackerPlayer, true)
      : getMinionAttack(afFinal!.minion);
    const defCounterDamage = isHeroDefender
      ? 0 // Defending hero's weapon is closed on opponent's turn!
      : getMinionAttack(dfFinal!.minion);

    if (isHeroAttacker) {
      attackerPlayer.attacksMadeThisTurn += 1;
    } else {
      afFinal!.minion.attacksMadeThisTurn += 1;
    }

    // Simultaneous Combat Damage!
    dealDamage(defenderId, atkDamage, side, atkDamage >= 6 ? 'EXPLOSION' : undefined, attackerId);
    if (defCounterDamage > 0) {
      dealDamage(attackerId, defCounterDamage, enemySide, undefined, defenderId);
      // Water Elemental defending freezes hero attacker too!
      if (!isHeroDefender && dfFinal && !dfFinal.minion.silenced && dfFinal.minion.cardId === 'CS2_033') {
        freezeTarget(attackerId);
      }
    }

    // Weapon Durability / Gorehowl (피의 울음소리 EX1_411) consumption!
    if (isHeroAttacker && attackerPlayer.weapon) {
      if (attackerPlayer.weapon.cardId === 'EX1_411' && !isHeroDefender) {
        // Gorehowl loses 1 Attack instead of Durability when attacking a minion!
        attackerPlayer.weapon.baseAttack -= 1;
        attackerPlayer.weapon.attack -= 1;
        if (attackerPlayer.weapon.attack <= 0) destroyWeapon(side);
      } else {
        attackerPlayer.weapon.durability -= 1;
        if (attackerPlayer.weapon.durability <= 0) destroyWeapon(side);
      }
      if (attackerPlayer.weapon?.cardId !== 'DS1_188') {
        // restore immune flag if Gladiator's Longbow was used (only during attack!)
      }
    }
    if (isHeroAttacker && attackerPlayer.immuneThisTurn) {
      // Only clear if not Ice Block (Ice Block only triggers on opponent's turn anyway!)
      attackerPlayer.immuneThisTurn = false;
    }

    const atkTitle = isHeroAttacker ? attackerPlayer.heroNameKo : afFinal!.minion.name;
    const defTitle = isHeroDefender
      ? getPlayer(defenderId === 'PLAYER_HERO' ? 'PLAYER' : 'OPPONENT').heroNameKo
      : dfFinal!.minion.name;
    pushHistory({
      actorSide: side,
      cardId: isHeroAttacker ? attackerPlayer.heroId : afFinal!.minion.cardId,
      title: `${atkTitle} ⚔ ${defTitle}`,
      detail: `[${atkTitle}](${atkDamage}) → [${defTitle}] 공격!`,
      kind: 'ATTACK',
    });

    resolveDeaths();
    return state;
  };

  const endTurn = (): BattleMatchState => {
    if (state.phase !== 'PLAYING') return state;
    const side = state.activeSide;
    const p = getPlayer(side);
    const enemySide = getEnemySide(side);

    // 1. Freeze thaw check: if frozen character had 0 attacks made this turn, it unfreezes at end of turn!
    if (p.frozen) {
      if (p.attacksMadeThisTurn === 0) {
        p.frozen = false;
      }
    }
    for (const m of p.board) {
      const couldHaveAttacked = !m.exhausted || m.charge || m.auraCharge;
      if (m.frozen && m.attacksMadeThisTurn === 0 && couldHaveAttacked) {
        m.frozen = false;
      }
    }

    // 2. End-of-Turn Minion Triggers!
    for (const m of [...p.board]) {
      if (m.silenced || getMinionHealth(m) <= 0) continue;
      switch (m.cardId) {
        case 'EX1_004': // 젊은 여사제
        case 'CS2_059': { // 피의 임프
          const others = p.board.filter((o) => o.uid !== m.uid && getMinionHealth(o) > 0);
          if (others.length > 0) {
            const pick = others[Math.floor(Math.random() * others.length)];
            buffMinion(pick.uid, 0, 1);
          }
          break;
        }
        case 'NEW1_037': { // 검 제작의 대가
          const others = p.board.filter((o) => o.uid !== m.uid && getMinionHealth(o) > 0);
          if (others.length > 0) {
            const pick = others[Math.floor(Math.random() * others.length)];
            buffMinion(pick.uid, 1, 0);
          }
          break;
        }
        case 'EX1_597': // 임프 소환사
          dealDamage(m.uid, 1, side, 'SHADOW_BOLT', m.uid);
          summonMinion(side, 'EX1_598');
          break;
        case 'EX1_274': // 에테리얼 비전술사
          if (p.secrets.length > 0) buffMinion(m.uid, 2, 2);
          break;
        case 'EX1_575': // 마나 해일 토템
          drawCards(side, 1);
          break;
        case 'NEW1_009': // 치유 토템
          for (const fm of p.board) healTarget(fm.uid, 1, side);
          break;
        case 'NEW1_040': // 들창코 -> 2/2 도발 놀 소환
          summonMinion(side, 'NEW1_040t');
          break;
        case 'EX1_249': // 남작 게돈 -> 다른 모든 캐릭터 피해 2
          for (const tid of [
            'PLAYER_HERO',
            'OPPONENT_HERO',
            ...state.player.board.filter((x) => x.uid !== m.uid).map((x) => x.uid),
            ...state.opponent.board.map((x) => x.uid),
          ]) {
            dealDamage(tid, 2, side, 'FIREBALL', m.uid);
          }
          break;
        case 'EX1_298': { // 불의 군주 라그나로스 -> 무작위 적에게 피해 8!! ("불의 세례를 받아라!!")
          const livingEnemies = getPlayer(enemySide).board.filter((em) => getMinionHealth(em) > 0);
          const pool = [`${enemySide}_HERO`, ...livingEnemies.map((em) => em.uid)];
          const pick = pool[Math.floor(Math.random() * pool.length)];
          dealDamage(pick, 8, side, 'FIREBALL', m.uid);
          break;
        }
        case 'EX1_572': { // 이세라 -> 무작위 꿈 카드 1장 손으로!
          const dreams = ['DREAM_01', 'DREAM_02', 'DREAM_03', 'DREAM_04', 'DREAM_05'];
          addCardToHand(side, dreams[Math.floor(Math.random() * dreams.length)]);
          break;
        }
        case 'Mekka2': { // 수리로봇
          const damaged: string[] = [];
          if (state.player.health < state.player.maxHealth) damaged.push('PLAYER_HERO');
          if (state.opponent.health < state.opponent.maxHealth) damaged.push('OPPONENT_HERO');
          for (const am of [...state.player.board, ...state.opponent.board]) {
            if (getMinionHealth(am) < getMinionMaxHealth(am)) damaged.push(am.uid);
          }
          if (damaged.length > 0) {
            healTarget(damaged[Math.floor(Math.random() * damaged.length)], 6, side);
          }
          break;
        }
        case 'Mekka3': { // 강화 구슬 3000
          const allM = [...state.player.board, ...state.opponent.board];
          if (allM.length > 0) {
            const pick = allM[Math.floor(Math.random() * allM.length)];
            buffMinion(pick.uid, 1, 1);
          }
          break;
        }
      }
    }

    // Gruul (그룰 NEW1_038) triggers at the end of EACH turn on BOTH boards!
    for (const m of [...state.player.board, ...state.opponent.board]) {
      if (!m.silenced && m.cardId === 'NEW1_038' && getMinionHealth(m) > 0) {
        buffMinion(m.uid, 1, 1);
      }
    }

    // Power Overwhelming / Force of Nature Treants die at end of turn, Shadow Madness returns!
    for (const m of [...p.board]) {
      if (m.powerOverwhelmingDieAtEndTurn) {
        destroyMinion(m.uid);
      }
      const retSide = (m as MinionInstance & { returnToSideAtEndTurn?: PlayerSide }).returnToSideAtEndTurn;
      if (retSide && getMinionHealth(m) > 0) {
        delete (m as MinionInstance & { returnToSideAtEndTurn?: PlayerSide }).returnToSideAtEndTurn;
        takeControlOfMinion(m.uid, retSide, false);
      }
      m.tempAttack = 0;
      m.cannotReduceBelow1ThisTurn = false;
    }

    p.tempAttack = 0;
    p.spellsZeroThisTurn = false;
    p.commandingShoutThisTurn = false;

    resolveDeaths();
    if ((state.phase as BattleMatchState['phase']) === 'GAME_OVER') return state;

    beginTurn(enemySide);
    return state;
  };

  const concede = (side: PlayerSide): BattleMatchState => {
    state.phase = 'GAME_OVER';
    state.winner = getEnemySide(side);
    getPlayer(side).health = 0;
    pushVfx('HERO_EXPLODE', `${side}_HERO`);
    return state;
  };

  const hasAnyAvailableMove = (side: PlayerSide): boolean => {
    if (state.phase !== 'PLAYING' || state.activeSide !== side) return false;
    const p = getPlayer(side);
    for (const hc of p.hand) {
      if (inspectPlayability(side, hc).canPlay) return true;
    }
    if (inspectHeroPower(side).canUse) return true;
    if (getValidAttackTargets(side, `${side}_HERO`).length > 0) return true;
    for (const m of p.board) {
      if (getValidAttackTargets(side, m.uid).length > 0) return true;
    }
    return false;
  };

  return {
    state,
    getEffectiveCardCost,
    inspectPlayability,
    inspectHeroPower,
    canAttackerSwing,
    getValidAttackTargets,
    getTotalSpellPower,
    confirmMulligan,
    playCardFromHand,
    resolveTrackingChoice,
    useHeroPower,
    performAttack,
    endTurn,
    concede,
    hasAnyAvailableMove,
  };
}
