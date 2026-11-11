import { cardDb } from '../cardDb';
import {
  BattleMatchState,
  ClassicCardDef,
  MinionInstance,
  PlayerBattleState,
  PlayerSide,
  VfxKind,
} from '../types';

export type TargetKind =
  | 'NONE'
  | 'ANY_CHARACTER'
  | 'ENEMY_CHARACTER'
  | 'FRIENDLY_CHARACTER'
  | 'ANY_MINION'
  | 'ENEMY_MINION'
  | 'FRIENDLY_MINION'
  | 'DAMAGED_MINION'
  | 'UNDAMAGED_MINION'
  | 'DAMAGED_ENEMY_MINION'
  | 'FRIENDLY_BEAST'
  | 'ANY_MURLOC'
  | 'ANY_DEMON'
  | 'ENEMY_TAUNT_MINION'
  | 'ATK_7_PLUS_MINION'
  | 'ATK_3_OR_LESS_MINION'
  | 'ATK_5_PLUS_MINION'
  | 'ENEMY_ATK_3_OR_LESS_MINION'
  | 'ENEMY_ATK_2_OR_LESS_MINION'
  | 'ANY_HERO'
  | 'OTHER_MINION';

export interface ChooseOneSubOption {
  optionCardId: string;
  title: string;
  description: string;
  targetKind: TargetKind;
  run: (ops: EngineOps, side: PlayerSide, targetId?: string, selfMinion?: MinionInstance) => void;
}

export interface CardScriptSpec {
  targetKind?: TargetKind;
  comboTargetKind?: TargetKind;
  chooseOne?: [ChooseOneSubOption, ChooseOneSubOption];
  vfx?: VfxKind;
  onCastSpell?: (ops: EngineOps, side: PlayerSide, targetId?: string, isCombo?: boolean) => void;
  onBattlecry?: (
    ops: EngineOps,
    side: PlayerSide,
    self: MinionInstance,
    targetId?: string,
    isCombo?: boolean,
  ) => void;
}

export interface EngineOps {
  state: BattleMatchState;
  getPlayer: (side: PlayerSide) => PlayerBattleState;
  getEnemySide: (side: PlayerSide) => PlayerSide;
  getSpellDamageValue: (side: PlayerSide, base: number, affectedBySpellPower?: boolean) => number;
  getHealValue: (side: PlayerSide, base: number) => number;
  dealDamage: (
    targetId: string,
    amount: number,
    sourceSide: PlayerSide,
    vfx?: VfxKind,
    sourceId?: string,
  ) => { actualDamage: number; killed: boolean };
  healTarget: (targetId: string, amount: number, sourceSide: PlayerSide) => number;
  addArmor: (side: PlayerSide, amount: number) => void;
  drawCards: (side: PlayerSide, count: number, costMod?: number) => string[];
  addCardToHand: (side: PlayerSide, cardId: string, costMod?: number) => boolean;
  discardRandomCards: (side: PlayerSide, count: number) => void;
  summonMinion: (
    side: PlayerSide,
    cardId: string,
    insertIndex?: number,
  ) => MinionInstance | null;
  equipWeapon: (side: PlayerSide, cardId: string) => void;
  destroyWeapon: (side: PlayerSide) => { attack: number; durability: number } | null;
  silenceMinion: (minionUid: string) => void;
  freezeTarget: (targetId: string) => void;
  destroyMinion: (minionUid: string) => void;
  transformMinion: (minionUid: string, newCardId: string) => MinionInstance | null;
  bounceMinionToHand: (minionUid: string, costMod?: number) => void;
  takeControlOfMinion: (minionUid: string, newOwner: PlayerSide, untilEndOfTurn?: boolean) => void;
  buffMinion: (
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
  ) => void;
  findMinion: (uid: string) => { minion: MinionInstance; side: PlayerSide; index: number } | null;
  getAdjacentMinions: (uid: string) => MinionInstance[];
  pushVfx: (kind: VfxKind, targetId?: string, sourceId?: string, value?: number, label?: string) => void;
  resolveDeaths: () => void;
  recalculateAuras: () => void;
}

export const CARD_SCRIPTS: Record<string, CardScriptSpec> = {
  // ==================== NEUTRAL & SPECIAL TOKENS ====================
  GAME_005: {
    // 동전 한 닢
    onCastSpell: (ops, side) => {
      const p = ops.getPlayer(side);
      p.mana = Math.min(10, p.mana + 1);
      ops.pushVfx('HOLY_LIGHT', `${side}_HERO`, undefined, 1, '+1 마나');
    },
  },
  CS2_013t: {
    // 넘치는 마나
    onCastSpell: (ops, side) => {
      ops.drawCards(side, 1);
    },
  },
  EX1_014t: {
    // 바나나 (+1/+1)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.buffMinion(targetId, 1, 1);
    },
  },
  DREAM_02: {
    // 깨어난 이세라 (이세라 제외 모든 캐릭터 피해 5)
    vfx: 'NATURE_WRATH',
    onCastSpell: (ops, side) => {
      const dmg = ops.getSpellDamageValue(side, 5);
      const targets: string[] = ['PLAYER_HERO', 'OPPONENT_HERO'];
      for (const m of [...ops.state.player.board, ...ops.state.opponent.board]) {
        if (m.cardId !== 'EX1_572') targets.push(m.uid);
      }
      for (const tid of targets) {
        ops.dealDamage(tid, dmg, side, 'NATURE_WRATH');
      }
    },
  },
  DREAM_04: {
    // 꿈 (하수인을 주인의 손으로)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.bounceMinionToHand(targetId, 0);
    },
  },
  DREAM_05: {
    // 악몽 (+5/+5, 다음 내 턴 시작 시 처치)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      ops.buffMinion(targetId, 5, 5);
      const found = ops.findMinion(targetId);
      if (found) found.minion.nightmareDestroyOwnerTurn = side;
    },
  },
  PRO_001a: {
    // 나는야 멀록 (1/1 멀록 3~5마리 소환)
    onCastSpell: (ops, side) => {
      const n = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) ops.summonMinion(side, 'EX1_506a');
    },
  },
  PRO_001b: {
    // 도적은 뒤를 치지... (피해 4 + 드로우 1)
    targetKind: 'ANY_CHARACTER',
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 4), side, 'SHADOW_BOLT');
      ops.drawCards(side, 1);
    },
  },
  PRO_001c: {
    // 호드의 힘 (무작위 호드 전사 소환)
    onCastSpell: (ops, side) => {
      const horde = ['CS2_121', 'EX1_390', 'CS2_179', 'NEW1_011', 'EX1_021', 'EX1_110'];
      ops.summonMinion(side, horde[Math.floor(Math.random() * horde.length)]);
    },
  },

  // ==================== DRUID (25) ====================
  CS2_008: {
    // 달빛섬광
    targetKind: 'ANY_CHARACTER',
    vfx: 'ARCANE_BOLT',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 1), side, 'ARCANE_BOLT');
    },
  },
  EX1_169: {
    // 정신 자극 (+2 마나)
    onCastSpell: (ops, side) => {
      const p = ops.getPlayer(side);
      p.mana = Math.min(10, p.mana + 2);
      ops.pushVfx('NATURE_WRATH', `${side}_HERO`, undefined, 2, '+2 마나');
    },
  },
  EX1_578: {
    // 야생성 (하수인에게 내 영웅 공격력만큼 피해)
    targetKind: 'ANY_MINION',
    vfx: 'NATURE_WRATH',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      const p = ops.getPlayer(side);
      const heroAtk = p.tempAttack + (p.weapon ? p.weapon.attack : 0);
      ops.dealDamage(targetId, ops.getSpellDamageValue(side, heroAtk), side, 'NATURE_WRATH');
    },
  },
  EX1_161: {
    // 자연화
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.destroyMinion(targetId);
      ops.drawCards(ops.getEnemySide(side), 2);
    },
  },
  CS2_005: {
    // 할퀴기 (+2 방어도, 이번 턴 영웅 공격력 +2)
    onCastSpell: (ops, side) => {
      const p = ops.getPlayer(side);
      p.tempAttack += 2;
      ops.addArmor(side, 2);
    },
  },
  CS2_013: {
    // 급속 성장 (빈 마나 수정 +1; 10마나면 넘치는 마나 획득)
    onCastSpell: (ops, side) => {
      const p = ops.getPlayer(side);
      if (p.maxMana >= 10) {
        ops.addCardToHand(side, 'CS2_013t');
      } else {
        p.maxMana += 1;
      }
    },
  },
  CS2_009: {
    // 야생의 징표 (+2/+2 & 도발)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.buffMinion(targetId, 2, 2, { taunt: true });
    },
  },
  EX1_160: {
    // 야생의 힘 (선택: 아군 하수인 +1/+1 또는 3/2 표범)
    chooseOne: [
      {
        optionCardId: 'EX1_160b',
        title: '무리의 우두머리',
        description: '내 하수인들에게 +1/+1을 부여합니다.',
        targetKind: 'NONE',
        run: (ops, side) => {
          for (const m of ops.getPlayer(side).board) {
            ops.buffMinion(m.uid, 1, 1);
          }
        },
      },
      {
        optionCardId: 'EX1_160a',
        title: '표범 소환',
        description: '3/2 표범을 소환합니다.',
        targetKind: 'NONE',
        run: (ops, side) => {
          ops.summonMinion(side, 'EX1_160t');
        },
      },
    ],
  },
  EX1_154: {
    // 천벌 (선택: 하수인 피해 3 또는 피해 1 + 드로우)
    chooseOne: [
      {
        optionCardId: 'EX1_154a',
        title: '태양의 격노',
        description: '하수인에게 피해를 3 줍니다.',
        targetKind: 'ANY_MINION',
        run: (ops, side, targetId) => {
          if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 3), side, 'NATURE_WRATH');
        },
      },
      {
        optionCardId: 'EX1_154b',
        title: '자연의 격노',
        description: '하수인에게 피해를 1 주고 카드를 뽑습니다.',
        targetKind: 'ANY_MINION',
        run: (ops, side, targetId) => {
          if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 1), side, 'NATURE_WRATH');
          ops.drawCards(side, 1);
        },
      },
    ],
  },
  CS2_011: {
    // 야생의 포효 (이번 턴 내 모든 캐릭터 공격력 +2)
    onCastSpell: (ops, side) => {
      const p = ops.getPlayer(side);
      p.tempAttack += 2;
      for (const m of p.board) {
        ops.buffMinion(m.uid, 0, 0, { tempAtk: 2 });
      }
      ops.pushVfx('NATURE_WRATH', `${side}_HERO`, undefined, 2, '야생의 포효!');
    },
  },
  EX1_155: {
    // 자연의 징표 (선택: +4 공격력 또는 +4 생명력 & 도발)
    chooseOne: [
      {
        optionCardId: 'EX1_155a',
        title: '호랑이의 분노',
        description: '하수인에게 공격력을 +4 부여합니다.',
        targetKind: 'ANY_MINION',
        run: (ops, _side, targetId) => {
          if (targetId) ops.buffMinion(targetId, 4, 0);
        },
      },
      {
        optionCardId: 'EX1_155b',
        title: '두터운 가죽',
        description: '하수인에게 생명력 +4와 도발을 부여합니다.',
        targetKind: 'ANY_MINION',
        run: (ops, _side, targetId) => {
          if (targetId) ops.buffMinion(targetId, 0, 4, { taunt: true });
        },
      },
    ],
  },
  CS2_007: {
    // 치유의 손길 (생명력 8 회복)
    targetKind: 'ANY_CHARACTER',
    vfx: 'HOLY_LIGHT',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.healTarget(targetId, ops.getHealValue(side, 8), side);
    },
  },
  EX1_570: {
    // 물기 (+4 방어도, 이번 턴 영웅 공격력 +4)
    onCastSpell: (ops, side) => {
      const p = ops.getPlayer(side);
      p.tempAttack += 4;
      ops.addArmor(side, 4);
    },
  },
  EX1_166: {
    // 숲의 수호자 (선택: 피해 2 또는 하수인 침묵)
    chooseOne: [
      {
        optionCardId: 'EX1_166a',
        title: '달빛섬광',
        description: '피해를 2 줍니다.',
        targetKind: 'ANY_CHARACTER',
        run: (ops, side, targetId) => {
          if (targetId) ops.dealDamage(targetId, 2, side, 'NATURE_WRATH');
        },
      },
      {
        optionCardId: 'EX1_166b',
        title: '무효화',
        description: '하수인을 침묵시킵니다.',
        targetKind: 'ANY_MINION',
        run: (ops, _side, targetId) => {
          if (targetId) ops.silenceMinion(targetId);
        },
      },
    ],
  },
  EX1_158: {
    // 숲의 영혼 (아군 하수인들에게 죽메: 2/2 나무정령 소환 부여)
    onCastSpell: (ops, side) => {
      for (const m of ops.getPlayer(side).board) {
        m.soulOfTheForestCount += 1;
        ops.pushVfx('BUFF_POP', m.uid, undefined, undefined, '숲의 영혼');
      }
    },
  },
  CS2_012: {
    // 휘둘러치기 (선택한 적에게 피해 4, 다른 모든 적에게 피해 1)
    targetKind: 'ENEMY_CHARACTER',
    vfx: 'NATURE_WRATH',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      const enemySide = ops.getEnemySide(side);
      const primary = ops.getSpellDamageValue(side, 4);
      const splash = ops.getSpellDamageValue(side, 1);
      const allEnemies = [`${enemySide}_HERO`, ...ops.getPlayer(enemySide).board.map((m) => m.uid)];
      ops.dealDamage(targetId, primary, side, 'NATURE_WRATH');
      for (const eid of allEnemies) {
        if (eid !== targetId) {
          ops.dealDamage(eid, splash, side, 'WHIRLWIND');
        }
      }
    },
  },
  EX1_165: {
    // 발톱의 드루이드 (선택: 4/4 돌진 또는 4/6 도발)
    chooseOne: [
      {
        optionCardId: 'EX1_165a',
        title: '표범 변신',
        description: '4/4 돌진 하수인으로 변신합니다.',
        targetKind: 'NONE',
        run: (ops, _side, _targetId, selfMinion) => {
          if (selfMinion) ops.transformMinion(selfMinion.uid, 'EX1_165t1');
        },
      },
      {
        optionCardId: 'EX1_165b',
        title: '곰 변신',
        description: '4/6 도발 하수인으로 변신합니다.',
        targetKind: 'NONE',
        run: (ops, _side, _targetId, selfMinion) => {
          if (selfMinion) ops.transformMinion(selfMinion.uid, 'EX1_165t2');
        },
      },
    ],
  },
  NEW1_007: {
    // 별똥별 (선택: 하수인 피해 5 또는 모든 적 하수인 피해 2)
    chooseOne: [
      {
        optionCardId: 'NEW1_007b',
        title: '별의 군주',
        description: '하수인에게 피해를 5 줍니다.',
        targetKind: 'ANY_MINION',
        run: (ops, side, targetId) => {
          if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 5), side, 'ARCANE_BOLT');
        },
      },
      {
        optionCardId: 'NEW1_007a',
        title: '항성 이동',
        description: '모든 적 하수인에게 피해를 2 줍니다.',
        targetKind: 'NONE',
        run: (ops, side) => {
          const enemySide = ops.getEnemySide(side);
          const dmg = ops.getSpellDamageValue(side, 2);
          for (const m of [...ops.getPlayer(enemySide).board]) {
            ops.dealDamage(m.uid, dmg, side, 'ARCANE_BOLT');
          }
        },
      },
    ],
  },
  EX1_164: {
    // 육성 (선택: 마나 수정 2개 획득 또는 카드 3장 뽑기)
    chooseOne: [
      {
        optionCardId: 'EX1_164a',
        title: '무성한 성장',
        description: '마나 수정을 2개 얻습니다.',
        targetKind: 'NONE',
        run: (ops, side) => {
          const p = ops.getPlayer(side);
          const gain = Math.min(2, 10 - p.maxMana);
          p.maxMana = Math.min(10, p.maxMana + 2);
          p.mana = Math.min(10, p.mana + Math.max(gain, 0));
        },
      },
      {
        optionCardId: 'EX1_164b',
        title: '풍요로움',
        description: '카드를 3장 뽑습니다.',
        targetKind: 'NONE',
        run: (ops, side) => {
          ops.drawCards(side, 3);
        },
      },
    ],
  },
  EX1_173: {
    // 별빛섬광 (피해 5 + 드로우 1)
    targetKind: 'ANY_CHARACTER',
    vfx: 'ARCANE_BOLT',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 5), side, 'ARCANE_BOLT');
      ops.drawCards(side, 1);
    },
  },
  EX1_571: {
    // 자연의 군대 (2/2 돌진 나무정령 3마리 소환, 턴 종료 시 죽음 — 정통 클래식 자군!)
    onCastSpell: (ops, side) => {
      for (let i = 0; i < 3; i++) {
        const m = ops.summonMinion(side, 'EX1_tk9b');
        if (m) {
          m.charge = true;
          m.exhausted = false;
          m.powerOverwhelmingDieAtEndTurn = true;
        }
      }
    },
  },
  EX1_178: {
    // 전쟁의 고대정령 (선택: +5 공격력 또는 +5 생명력 & 도발)
    chooseOne: [
      {
        optionCardId: 'EX1_178a',
        title: '뿌리 내리기',
        description: '생명력 +5와 도발을 얻습니다. (5/10 도발)',
        targetKind: 'NONE',
        run: (ops, _side, _targetId, selfMinion) => {
          if (selfMinion) ops.buffMinion(selfMinion.uid, 0, 5, { taunt: true });
        },
      },
      {
        optionCardId: 'EX1_178b',
        title: '뿌리 들기',
        description: '공격력을 +5 얻습니다. (10/5)',
        targetKind: 'NONE',
        run: (ops, _side, _targetId, selfMinion) => {
          if (selfMinion) ops.buffMinion(selfMinion.uid, 5, 0);
        },
      },
    ],
  },
  NEW1_008: {
    // 지식의 고대정령 (정통 클래식: 카드 2장 드로우!! 또는 생명력 5 회복)
    chooseOne: [
      {
        optionCardId: 'NEW1_008a',
        title: '고대의 지식',
        description: '카드를 2장 뽑습니다.',
        targetKind: 'NONE',
        run: (ops, side) => {
          ops.drawCards(side, 2);
        },
      },
      {
        optionCardId: 'NEW1_008b',
        title: '고대의 비밀',
        description: '생명력을 5 회복시킵니다.',
        targetKind: 'ANY_CHARACTER',
        run: (ops, side, targetId) => {
          if (targetId) ops.healTarget(targetId, 5, side);
        },
      },
    ],
  },
  EX1_573: {
    // 세나리우스 (선택: 다른 아군 하수인 +2/+2 또는 2/2 도발 나무정령 둘 소환)
    chooseOne: [
      {
        optionCardId: 'EX1_573a',
        title: '반신의 총애',
        description: '내 다른 하수인들에게 +2/+2를 부여합니다.',
        targetKind: 'NONE',
        run: (ops, side, _targetId, selfMinion) => {
          for (const m of ops.getPlayer(side).board) {
            if (!selfMinion || m.uid !== selfMinion.uid) {
              ops.buffMinion(m.uid, 2, 2);
            }
          }
        },
      },
      {
        optionCardId: 'EX1_573b',
        title: '샨도의 가르침',
        description: '도발 능력이 있는 2/2 나무정령을 둘 소환합니다.',
        targetKind: 'NONE',
        run: (ops, side) => {
          for (let i = 0; i < 2; i++) {
            const t = ops.summonMinion(side, 'EX1_tk9');
            if (t) t.taunt = true;
          }
        },
      },
    ],
  },

  // ==================== HUNTER (25) ====================
  CS2_084: {
    // 사냥꾼의 징표 (생명력을 1로 변경)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      const f = targetId ? ops.findMinion(targetId) : null;
      if (f) {
        f.minion.maxHealth = 1;
        f.minion.health = 1;
        ops.pushVfx('DAMAGE_POP', f.minion.uid, undefined, undefined, 'HP → 1');
      }
    },
  },
  EX1_544: {
    // 섬광 (모든 하수인 은신 제거 + 적 비밀 모두 파괴 + 드로우 1)
    onCastSpell: (ops, side) => {
      for (const m of [...ops.state.player.board, ...ops.state.opponent.board]) {
        m.stealth = false;
        m.concealedUntilNextTurn = false;
      }
      const enemy = ops.getPlayer(ops.getEnemySide(side));
      enemy.secrets = [];
      ops.drawCards(side, 1);
      ops.pushVfx('HOLY_NOVA', `${ops.getEnemySide(side)}_HERO`, undefined, undefined, '섬광!');
    },
  },
  DS1_185: {
    // 신비한 사격
    targetKind: 'ANY_CHARACTER',
    vfx: 'ARCANE_BOLT',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 2), side, 'ARCANE_BOLT');
    },
  },
  EX1_549: {
    // 야수의 격노 (야수에게 이번 턴 공격력 +2 및 피해 방지)
    targetKind: 'FRIENDLY_BEAST',
    onCastSpell: (ops, _side, targetId) => {
      if (!targetId) return;
      ops.buffMinion(targetId, 0, 0, { tempAtk: 2, divineShield: true });
      const f = ops.findMinion(targetId);
      if (f) f.minion.cannotReduceBelow1ThisTurn = true;
    },
  },
  DS1_184: {
    // 추적 (덱 맨 위 3장 확인 후 1장 선택, 나머지 버림)
    onCastSpell: (ops, side) => {
      const p = ops.getPlayer(side);
      const top3 = p.deck.splice(0, 3);
      if (top3.length === 0) return;
      if (side === 'PLAYER' && top3.length > 1) {
        ops.state.trackingPrompt = { cards: top3 };
      } else {
        ops.addCardToHand(side, top3[0]);
      }
    },
  },
  EX1_538: {
    // 개들을 풀어라 (적 하수인 수만큼 1/1 돌진 사냥개 소환)
    onCastSpell: (ops, side) => {
      const count = ops.getPlayer(ops.getEnemySide(side)).board.length;
      for (let i = 0; i < count; i++) {
        ops.summonMinion(side, 'EX1_538t');
      }
    },
  },
  EX1_539: {
    // 살상 명령 (피해 3, 야수 있으면 피해 5)
    targetKind: 'ANY_CHARACTER',
    vfx: 'FIREBALL',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      const hasBeast = ops.getPlayer(side).board.some((m) => m.race === 'BEAST');
      const base = hasBeast ? 5 : 3;
      ops.dealDamage(targetId, ops.getSpellDamageValue(side, base), side, 'FIREBALL');
    },
  },
  NEW1_031: {
    // 야생의 벗 (미샤 / 레오크 / 킁킁이 무작위 소환)
    onCastSpell: (ops, side) => {
      const companions = ['NEW1_032', 'NEW1_033', 'NEW1_034'];
      ops.summonMinion(side, companions[Math.floor(Math.random() * companions.length)]);
    },
  },
  EX1_617: {
    // 치명적인 사격 (무작위 적 하수인 처치)
    onCastSpell: (ops, side) => {
      const enemies = ops.getPlayer(ops.getEnemySide(side)).board;
      if (enemies.length > 0) {
        const pick = enemies[Math.floor(Math.random() * enemies.length)];
        ops.destroyMinion(pick.uid);
      }
    },
  },
  DS1_070: {
    // 사냥개조련사 (아군 야수 +2/+2 & 도발)
    targetKind: 'FRIENDLY_BEAST',
    onBattlecry: (ops, _side, _self, targetId) => {
      if (targetId) ops.buffMinion(targetId, 2, 2, { taunt: true });
    },
  },
  DS1_183: {
    // 일제 사격 (무작위 적 하수인 둘에게 피해 3)
    vfx: 'ARCANE_BOLT',
    onCastSpell: (ops, side) => {
      const enemies = [...ops.getPlayer(ops.getEnemySide(side)).board];
      const shuffled = enemies.sort(() => Math.random() - 0.5).slice(0, 2);
      const dmg = ops.getSpellDamageValue(side, 3);
      for (const m of shuffled) {
        ops.dealDamage(m.uid, dmg, side, 'ARCANE_BOLT');
      }
    },
  },
  EX1_537: {
    // 폭발 사격 (대상 하수인 피해 5, 양옆 하수인 피해 2)
    targetKind: 'ANY_MINION',
    vfx: 'EXPLOSION',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      const adj = ops.getAdjacentMinions(targetId);
      ops.dealDamage(targetId, ops.getSpellDamageValue(side, 5), side, 'EXPLOSION');
      const splash = ops.getSpellDamageValue(side, 2);
      for (const a of adj) {
        ops.dealDamage(a.uid, splash, side, 'FIREBALL');
      }
    },
  },

  // ==================== MAGE (25) ====================
  EX1_277: {
    // 신비한 화살 (무작위 적에게 3 + 주문공격력 회 1 피해)
    vfx: 'ARCANE_BOLT',
    onCastSpell: (ops, side) => {
      const missiles = ops.getSpellDamageValue(side, 3);
      const enemySide = ops.getEnemySide(side);
      for (let i = 0; i < missiles; i++) {
        const livingMinions = ops.getPlayer(enemySide).board.filter((m) => m.health > 0);
        const pool = [`${enemySide}_HERO`, ...livingMinions.map((m) => m.uid)];
        const pick = pool[Math.floor(Math.random() * pool.length)];
        ops.dealDamage(pick, 1, side, 'ARCANE_BOLT');
      }
    },
  },
  CS2_031: {
    // 얼음창 (빙결 부여, 이미 빙결이면 피해 4)
    targetKind: 'ANY_CHARACTER',
    vfx: 'FROSTBOLT',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      const isAlreadyFrozen =
        targetId === 'PLAYER_HERO'
          ? ops.state.player.frozen
          : targetId === 'OPPONENT_HERO'
            ? ops.state.opponent.frozen
            : Boolean(ops.findMinion(targetId)?.minion.frozen);
      if (isAlreadyFrozen) {
        ops.dealDamage(targetId, ops.getSpellDamageValue(side, 4), side, 'FROSTBOLT');
      } else {
        ops.freezeTarget(targetId);
      }
    },
  },
  CS2_027: {
    // 환영 복제 (0/2 도발 둘 소환)
    onCastSpell: (ops, side) => {
      ops.summonMinion(side, 'CS2_mirror');
      ops.summonMinion(side, 'CS2_mirror');
    },
  },
  CS2_025: {
    // 신비한 폭발 (모든 적 하수인 피해 1)
    vfx: 'ARCANE_BOLT',
    onCastSpell: (ops, side) => {
      const dmg = ops.getSpellDamageValue(side, 1);
      for (const m of [...ops.getPlayer(ops.getEnemySide(side)).board]) {
        ops.dealDamage(m.uid, dmg, side, 'ARCANE_BOLT');
      }
    },
  },
  CS2_024: {
    // 얼음 화살 (피해 3 + 빙결)
    targetKind: 'ANY_CHARACTER',
    vfx: 'FROSTBOLT',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      ops.dealDamage(targetId, ops.getSpellDamageValue(side, 3), side, 'FROSTBOLT');
      ops.freezeTarget(targetId);
    },
  },
  CS2_023: {
    // 신비한 지능 (카드 2장 드로우)
    onCastSpell: (ops, side) => {
      ops.drawCards(side, 2);
    },
  },
  CS2_026: {
    // 얼음 회오리 (모든 적 하수인 빙결)
    vfx: 'BLIZZARD',
    onCastSpell: (ops, side) => {
      for (const m of ops.getPlayer(ops.getEnemySide(side)).board) {
        ops.freezeTarget(m.uid);
      }
      ops.pushVfx('BLIZZARD', `${ops.getEnemySide(side)}_HERO`);
    },
  },
  EX1_612: {
    // 키린 토 마법사 (이번 턴 다음 비밀 비용 0)
    onBattlecry: (ops, side) => {
      ops.getPlayer(side).nextSecretZeroThisTurn = true;
    },
  },
  EX1_275: {
    // 냉기 돌풍 (대상과 양옆 하수인 피해 1 + 빙결)
    targetKind: 'ANY_MINION',
    vfx: 'FROSTBOLT',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      const adj = ops.getAdjacentMinions(targetId);
      const dmg = ops.getSpellDamageValue(side, 1);
      for (const uid of [targetId, ...adj.map((a) => a.uid)]) {
        ops.dealDamage(uid, dmg, side, 'FROSTBOLT');
        ops.freezeTarget(uid);
      }
    },
  },
  CS2_022: {
    // 변이 (1/1 양으로 변신)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.transformMinion(targetId, 'CS2_tk1');
    },
  },
  CS2_029: {
    // 화염구 (피해 6)
    targetKind: 'ANY_CHARACTER',
    vfx: 'FIREBALL',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 6), side, 'FIREBALL');
    },
  },
  CS2_028: {
    // 눈보라 (모든 적 하수인 피해 2 + 빙결)
    vfx: 'BLIZZARD',
    onCastSpell: (ops, side) => {
      const dmg = ops.getSpellDamageValue(side, 2);
      const enemies = [...ops.getPlayer(ops.getEnemySide(side)).board];
      ops.pushVfx('BLIZZARD', `${ops.getEnemySide(side)}_HERO`);
      for (const m of enemies) {
        ops.dealDamage(m.uid, dmg, side, 'FROSTBOLT');
        ops.freezeTarget(m.uid);
      }
    },
  },
  CS2_032: {
    // 불기둥 (모든 적 하수인 피해 4)
    vfx: 'FLAMESTRIKE',
    onCastSpell: (ops, side) => {
      const dmg = ops.getSpellDamageValue(side, 4);
      const enemySide = ops.getEnemySide(side);
      ops.pushVfx('FLAMESTRIKE', `${enemySide}_HERO`);
      for (const m of [...ops.getPlayer(enemySide).board]) {
        ops.dealDamage(m.uid, dmg, side, 'FIREBALL');
      }
    },
  },
  EX1_279: {
    // 불덩이 작렬 (피해 10)
    targetKind: 'ANY_CHARACTER',
    vfx: 'FIREBALL',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 10), side, 'EXPLOSION');
    },
  },

  // ==================== PALADIN (25) ====================
  EX1_360: {
    // 겸손 (공격력을 1로 만듦)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      const f = targetId ? ops.findMinion(targetId) : null;
      if (f) {
        f.minion.permAttack = 1;
        f.minion.tempAttack = 0;
        ops.pushVfx('BUFF_POP', f.minion.uid, undefined, undefined, '공격력 → 1');
      }
    },
  },
  EX1_371: {
    // 보호의 손길 (천상의 보호막 부여)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.buffMinion(targetId, 0, 0, { divineShield: true });
    },
  },
  EX1_363: {
    // 지혜의 축복 (공격할 때마다 시전자가 드로우)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, side, targetId) => {
      const f = targetId ? ops.findMinion(targetId) : null;
      if (f) {
        f.minion.blessingOfWisdomOwners.push(side);
        ops.pushVfx('HOLY_LIGHT', f.minion.uid, undefined, undefined, '지혜의 축복');
      }
    },
  },
  CS2_087: {
    // 힘의 축복 (+3 공격력)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.buffMinion(targetId, 3, 0);
    },
  },
  CS2_089: {
    // 성스러운 빛 (생명력 6 회복)
    targetKind: 'ANY_CHARACTER',
    vfx: 'HOLY_LIGHT',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.healTarget(targetId, ops.getHealValue(side, 6), side);
    },
  },
  EX1_362: {
    // 여명회 파수병 (아군 하수인에게 천상의 보호막 부여)
    targetKind: 'FRIENDLY_MINION',
    onBattlecry: (ops, _side, _self, targetId) => {
      if (targetId) ops.buffMinion(targetId, 0, 0, { divineShield: true });
    },
  },
  EX1_619: {
    // 평등 (모든 하수인의 생명력을 1로 변경)
    vfx: 'CONSECRATION',
    onCastSpell: (ops) => {
      for (const m of [...ops.state.player.board, ...ops.state.opponent.board]) {
        m.maxHealth = 1;
        m.health = 1;
      }
      ops.pushVfx('CONSECRATION', 'OPPONENT_HERO', undefined, undefined, '평등!');
    },
  },
  EX1_349: {
    // 신의 은총 (상대 손패 수와 같아질 때까지 드로우)
    onCastSpell: (ops, side) => {
      const p = ops.getPlayer(side);
      const opp = ops.getPlayer(ops.getEnemySide(side));
      const diff = opp.hand.length - p.hand.length;
      if (diff > 0) ops.drawCards(side, diff);
    },
  },
  EX1_382: {
    // 알도르 평화감시단 (적 하수인 공격력 1로 변경)
    targetKind: 'ENEMY_MINION',
    onBattlecry: (ops, _side, _self, targetId) => {
      const f = targetId ? ops.findMinion(targetId) : null;
      if (f) {
        f.minion.permAttack = 1;
        f.minion.tempAttack = 0;
        ops.pushVfx('HOLY_LIGHT', f.minion.uid, undefined, undefined, '법규를 따르라!');
      }
    },
  },
  CS2_093: {
    // 신성화 (모든 적에게 피해 2)
    vfx: 'CONSECRATION',
    onCastSpell: (ops, side) => {
      const enemySide = ops.getEnemySide(side);
      const dmg = ops.getSpellDamageValue(side, 2);
      ops.pushVfx('CONSECRATION', `${enemySide}_HERO`);
      ops.dealDamage(`${enemySide}_HERO`, dmg, side, 'HOLY_LIGHT');
      for (const m of [...ops.getPlayer(enemySide).board]) {
        ops.dealDamage(m.uid, dmg, side, 'HOLY_LIGHT');
      }
    },
  },
  CS2_092: {
    // 왕의 축복 (+4/+4)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.buffMinion(targetId, 4, 4);
    },
  },
  CS2_094: {
    // 천벌의 망치 (피해 3 + 드로우 1)
    targetKind: 'ANY_CHARACTER',
    vfx: 'HOLY_LIGHT',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 3), side, 'HOLY_LIGHT');
      ops.drawCards(side, 1);
    },
  },
  EX1_365: {
    // 신의 격노 (카드 1장 뽑고 그 카드 비용만큼 피해)
    targetKind: 'ANY_CHARACTER',
    vfx: 'HOLY_LIGHT',
    onCastSpell: (ops, side, targetId) => {
      const drawn = ops.drawCards(side, 1);
      const baseCost = drawn[0] ? cardDb.getCard(drawn[0])?.cost || 0 : 0;
      if (targetId) {
        ops.dealDamage(targetId, ops.getSpellDamageValue(side, baseCost), side, 'HOLY_LIGHT');
      }
    },
  },
  EX1_355: {
    // 축복받은 용사 (공격력 2배)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      const f = targetId ? ops.findMinion(targetId) : null;
      if (f) {
        const cur = f.minion.permAttack + f.minion.tempAttack + f.minion.auraAttack;
        ops.buffMinion(f.minion.uid, cur, 0);
      }
    },
  },
  EX1_384: {
    // 응징의 격노 (무작위 적들에게 총 8 피해 분할)
    vfx: 'HOLY_LIGHT',
    onCastSpell: (ops, side) => {
      const shots = ops.getSpellDamageValue(side, 8);
      const enemySide = ops.getEnemySide(side);
      for (let i = 0; i < shots; i++) {
        const living = ops.getPlayer(enemySide).board.filter((m) => m.health > 0);
        const pool = [`${enemySide}_HERO`, ...living.map((m) => m.uid)];
        const pick = pool[Math.floor(Math.random() * pool.length)];
        ops.dealDamage(pick, 1, side, 'HOLY_LIGHT');
      }
    },
  },
  CS2_088: {
    // 왕의 수호자 (내 영웅 생명력 6 회복)
    onBattlecry: (ops, side) => {
      ops.healTarget(`${side}_HERO`, 6, side);
    },
  },
  EX1_354: {
    // 신의 축복 (생명력 8 회복 + 카드 3장 드로우)
    targetKind: 'ANY_CHARACTER',
    vfx: 'HOLY_LIGHT',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.healTarget(targetId, ops.getHealValue(side, 8), side);
      ops.drawCards(side, 3);
    },
  },

  // ==================== PRIEST (25) ====================
  EX1_621: {
    // 치유의 마법진 (모든 하수인 생명력 4 회복)
    vfx: 'HOLY_NOVA',
    onCastSpell: (ops, side) => {
      const amt = ops.getHealValue(side, 4);
      for (const m of [...ops.state.player.board, ...ops.state.opponent.board]) {
        ops.healTarget(m.uid, amt, side);
      }
    },
  },
  EX1_332: {
    // 침묵
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.silenceMinion(targetId);
    },
  },
  CS1_129: {
    // 내면의 열정 (공격력을 현재 생명력과 같게 변경)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      const f = targetId ? ops.findMinion(targetId) : null;
      if (f) {
        const curHp = f.minion.health + f.minion.auraHealth;
        f.minion.permAttack = curHp;
        f.minion.tempAttack = 0;
        ops.pushVfx('BUFF_POP', f.minion.uid, undefined, curHp, `공격력 ${curHp}!`);
      }
    },
  },
  CS2_003: {
    // 마음의 눈 (상대 손패 무작위 1장 복사)
    onCastSpell: (ops, side) => {
      const oppHand = ops.getPlayer(ops.getEnemySide(side)).hand;
      if (oppHand.length > 0) {
        const pick = oppHand[Math.floor(Math.random() * oppHand.length)];
        ops.addCardToHand(side, pick.cardId);
      }
    },
  },
  CS1_130: {
    // 성스러운 일격 (피해 2)
    targetKind: 'ANY_CHARACTER',
    vfx: 'HOLY_LIGHT',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 2), side, 'HOLY_LIGHT');
    },
  },
  CS2_004: {
    // 신의 권능: 보호막 (+2 생명력 + 드로우 1)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.buffMinion(targetId, 0, 2);
      ops.drawCards(side, 1);
    },
  },
  CS2_234: {
    // 어둠의 권능: 고통 (공격력 3 이하 하수인 처치)
    targetKind: 'ATK_3_OR_LESS_MINION',
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.destroyMinion(targetId);
    },
  },
  DS1_233: {
    // 정신 분열 (적 영웅에게 피해 5)
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, side) => {
      ops.dealDamage(`${ops.getEnemySide(side)}_HERO`, ops.getSpellDamageValue(side, 5), side, 'SHADOW_BOLT');
    },
  },
  CS2_236: {
    // 천상의 정신 (생명력 2배)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      const f = targetId ? ops.findMinion(targetId) : null;
      if (f) {
        const curHp = f.minion.health;
        ops.buffMinion(f.minion.uid, 0, curHp);
      }
    },
  },
  EX1_339: {
    // 생각 훔치기 (상대 덱에서 2장 복사해 내 손으로)
    onCastSpell: (ops, side) => {
      const oppDeck = [...ops.getPlayer(ops.getEnemySide(side)).deck];
      const picks = oppDeck.sort(() => Math.random() - 0.5).slice(0, 2);
      for (const cid of picks) ops.addCardToHand(side, cid);
    },
  },
  EX1_622: {
    // 어둠의 권능: 죽음 (공격력 5 이상 하수인 처치)
    targetKind: 'ATK_5_PLUS_MINION',
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.destroyMinion(targetId);
    },
  },
  EX1_625: {
    // 어둠의 형상 (영웅 능력이 피해 2로 변경, 이미 어둠의 형상이면 피해 3)
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, side) => {
      const p = ops.getPlayer(side);
      p.shadowformTier = Math.min(2, p.shadowformTier + 1);
      p.heroPowerId = p.shadowformTier === 1 ? 'EX1_625t' : 'EX1_625t2';
      p.heroPowerNameKo = p.shadowformTier === 1 ? '정신의 쐐기' : '정신 붕괴';
      p.heroPowerTextKo = p.shadowformTier === 1 ? '피해를 2 줍니다.' : '피해를 3 줍니다.';
      p.heroPowerNeedsTarget = true;
      p.heroPowerUsedThisTurn = false;
    },
  },
  EX1_626: {
    // 대규모 무효화 (모든 적 하수인 침묵 + 드로우 1)
    vfx: 'SILENCE_RING',
    onCastSpell: (ops, side) => {
      for (const m of ops.getPlayer(ops.getEnemySide(side)).board) {
        ops.silenceMinion(m.uid);
      }
      ops.drawCards(side, 1);
    },
  },
  EX1_345: {
    // 심리 조작 (상대 덱 무작위 하수인 복사 소환, 없으면 0/1 허무의 그림자!)
    onCastSpell: (ops, side) => {
      const oppDeckMinions = ops
        .getPlayer(ops.getEnemySide(side))
        .deck.filter((cid) => cardDb.getCard(cid)?.type === 'MINION');
      if (oppDeckMinions.length > 0) {
        const pick = oppDeckMinions[Math.floor(Math.random() * oppDeckMinions.length)];
        ops.summonMinion(side, pick);
      } else {
        ops.summonMinion(side, 'EX1_345t');
      }
    },
  },
  EX1_334: {
    // 암흑의 광기 (공격력 3 이하 적 하수인 이번 턴 조종 + 즉시 공격 가능!)
    targetKind: 'ENEMY_ATK_3_OR_LESS_MINION',
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.takeControlOfMinion(targetId, side, true);
    },
  },
  CS1_112: {
    // 신성한 폭발 (모든 적 피해 2, 모든 아군 생명력 2 회복)
    vfx: 'HOLY_NOVA',
    onCastSpell: (ops, side) => {
      const enemySide = ops.getEnemySide(side);
      const dmg = ops.getSpellDamageValue(side, 2);
      const heal = ops.getHealValue(side, 2);
      ops.pushVfx('HOLY_NOVA', `${side}_HERO`);
      ops.dealDamage(`${enemySide}_HERO`, dmg, side, 'HOLY_LIGHT');
      for (const m of [...ops.getPlayer(enemySide).board]) {
        ops.dealDamage(m.uid, dmg, side, 'HOLY_LIGHT');
      }
      ops.healTarget(`${side}_HERO`, heal, side);
      for (const m of [...ops.getPlayer(side).board]) {
        ops.healTarget(m.uid, heal, side);
      }
    },
  },
  EX1_091: {
    // 비밀결사단 어둠사제 (공격력 2 이하 적 하수인 영구 강탈)
    targetKind: 'ENEMY_ATK_2_OR_LESS_MINION',
    onBattlecry: (ops, side, _self, targetId) => {
      if (targetId) ops.takeControlOfMinion(targetId, side, false);
    },
  },
  EX1_623: {
    // 사원 집행자 (아군 하수인 생명력 +3)
    targetKind: 'FRIENDLY_MINION',
    onBattlecry: (ops, _side, _self, targetId) => {
      if (targetId) ops.buffMinion(targetId, 0, 3);
    },
  },
  EX1_624: {
    // 신성한 불꽃 (피해 5 + 내 영웅 생명력 5 회복)
    targetKind: 'ANY_CHARACTER',
    vfx: 'FIREBALL',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 5), side, 'FIREBALL');
      ops.healTarget(`${side}_HERO`, ops.getHealValue(side, 5), side);
    },
  },
  CS1_113: {
    // 정신 지배 (적 하수인 영구 강탈)
    targetKind: 'ENEMY_MINION',
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.takeControlOfMinion(targetId, side, false);
    },
  },

  // ==================== ROGUE (25) ====================
  EX1_144: {
    // 그림자 밟기 (아군 하수인을 내 손으로 가져오고 비용 -2)
    targetKind: 'FRIENDLY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.bounceMinionToHand(targetId, -2);
    },
  },
  CS2_072: {
    // 기습 (피해 입지 않은 하수인에게 피해 2)
    targetKind: 'UNDAMAGED_MINION',
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 2), side, 'SHADOW_BOLT');
    },
  },
  EX1_145: {
    // 마음가짐 (이번 턴 다음 주문 비용 -3)
    onCastSpell: (ops, side) => {
      ops.getPlayer(side).nextSpellDiscountThisTurn += 3;
    },
  },
  CS2_073: {
    // 냉혈 (+2 공격력, 연계: +4 공격력)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId, isCombo) => {
      if (targetId) ops.buffMinion(targetId, isCombo ? 4 : 2, 0);
    },
  },
  CS2_074: {
    // 맹독 (내 무기에 공격력 +2)
    onCastSpell: (ops, side) => {
      const w = ops.getPlayer(side).weapon;
      if (w) {
        w.attack += 2;
        ops.pushVfx('BUFF_POP', `${side}_HERO`, undefined, 2, '맹독 +2');
      }
    },
  },
  CS2_075: {
    // 사악한 일격 (적 영웅에게 피해 3)
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, side) => {
      ops.dealDamage(`${ops.getEnemySide(side)}_HERO`, ops.getSpellDamageValue(side, 3), side, 'SHADOW_BOLT');
    },
  },
  EX1_128: {
    // 은폐 (다음 내 턴까지 아군 하수인들에게 은신 부여)
    onCastSpell: (ops, side) => {
      for (const m of ops.getPlayer(side).board) {
        m.stealth = true;
        m.concealedUntilNextTurn = true;
      }
    },
  },
  EX1_131: {
    // 데피아즈단 두목 (연계: 2/1 데피아즈단 무법자 소환)
    onBattlecry: (ops, side, _self, _targetId, isCombo) => {
      if (isCombo) ops.summonMinion(side, 'EX1_131t');
    },
  },
  EX1_278: {
    // 독칼 (피해 1 + 드로우 1)
    targetKind: 'ANY_CHARACTER',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 1), side, 'SHADOW_BOLT');
      ops.drawCards(side, 1);
    },
  },
  EX1_126: {
    // 배신 (적 하수인이 양옆 하수인에게 자신의 공격력만큼 피해)
    targetKind: 'ENEMY_MINION',
    onCastSpell: (ops, side, targetId) => {
      const f = targetId ? ops.findMinion(targetId) : null;
      if (!f) return;
      const atk = f.minion.permAttack + f.minion.tempAttack + f.minion.auraAttack;
      if (atk <= 0) return;
      for (const adj of ops.getAdjacentMinions(targetId!)) {
        ops.dealDamage(adj.uid, atk, side, 'EXPLOSION');
        if (f.minion.poisonous && !f.minion.silenced) {
          ops.destroyMinion(adj.uid);
        }
      }
    },
  },
  EX1_124: {
    // 절개 (피해 2, 연계: 피해 4)
    targetKind: 'ANY_CHARACTER',
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, side, targetId, isCombo) => {
      if (targetId) {
        const base = isCombo ? 4 : 2;
        ops.dealDamage(targetId, ops.getSpellDamageValue(side, base), side, 'SHADOW_BOLT');
      }
    },
  },
  CS2_233: {
    // 폭풍의 칼날 (내 무기를 파괴하고 그 공격력만큼 모든 적에게 피해 — 정통 클래식!)
    vfx: 'WHIRLWIND',
    onCastSpell: (ops, side) => {
      const destroyed = ops.destroyWeapon(side);
      if (!destroyed) return;
      const dmg = ops.getSpellDamageValue(side, destroyed.attack);
      const enemySide = ops.getEnemySide(side);
      ops.dealDamage(`${enemySide}_HERO`, dmg, side, 'WHIRLWIND');
      for (const m of [...ops.getPlayer(enemySide).board]) {
        ops.dealDamage(m.uid, dmg, side, 'WHIRLWIND');
      }
    },
  },
  EX1_581: {
    // 혼절시키기 (적 하수인을 상대 손으로)
    targetKind: 'ENEMY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.bounceMinionToHand(targetId, 0);
    },
  },
  EX1_134: {
    // SI:7 요원 (연계: 피해 2)
    comboTargetKind: 'ANY_CHARACTER',
    onBattlecry: (ops, side, _self, targetId, isCombo) => {
      if (isCombo && targetId) {
        ops.dealDamage(targetId, 2, side, 'SHADOW_BOLT');
      }
    },
  },
  EX1_137: {
    // 머리 후려치기 (적 영웅 피해 2, 연계: 손으로 다시 복귀)
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, side, _targetId, isCombo) => {
      ops.dealDamage(`${ops.getEnemySide(side)}_HERO`, ops.getSpellDamageValue(side, 2), side, 'SHADOW_BOLT');
      if (isCombo) {
        ops.addCardToHand(side, 'EX1_137');
      }
    },
  },
  EX1_613: {
    // 에드윈 밴클리프 (연계: 앞서 낸 카드 1장당 +2/+2)
    onBattlecry: (ops, side, self, _targetId, isCombo) => {
      if (isCombo) {
        // cardsPlayedThisTurn was incremented BEFORE battlecry or includes prior cards; priorCount = cardsPlayedThisTurn - 1
        const prior = Math.max(0, ops.getPlayer(side).cardsPlayedThisTurn - 1);
        if (prior > 0) {
          ops.buffMinion(self.uid, prior * 2, prior * 2);
        }
      }
    },
  },
  EX1_133: {
    // 전멸의 비수 (무기 전함: 피해 1, 연계: 피해 2)
    targetKind: 'ANY_CHARACTER',
    onCastSpell: (ops, side, targetId, isCombo) => {
      if (targetId) {
        ops.dealDamage(targetId, isCombo ? 2 : 1, side, 'SHADOW_BOLT');
      }
    },
  },
  EX1_129: {
    // 칼날 부채 (모든 적 하수인 피해 1 + 드로우 1)
    vfx: 'WHIRLWIND',
    onCastSpell: (ops, side) => {
      const dmg = ops.getSpellDamageValue(side, 1);
      for (const m of [...ops.getPlayer(ops.getEnemySide(side)).board]) {
        ops.dealDamage(m.uid, dmg, side, 'WHIRLWIND');
      }
      ops.drawCards(side, 1);
    },
  },
  NEW1_014: {
    // 위장의 대가 (아군 하수인에게 은신 부여)
    targetKind: 'FRIENDLY_MINION',
    onBattlecry: (ops, _side, _self, targetId) => {
      if (targetId) ops.buffMinion(targetId, 0, 0, { stealth: true });
    },
  },
  CS2_076: {
    // 암살 (적 하수인 처치)
    targetKind: 'ENEMY_MINION',
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.destroyMinion(targetId);
    },
  },
  NEW1_005: {
    // 납치범 (연계: 하수인을 주인의 손으로 돌려보냄)
    comboTargetKind: 'ANY_MINION',
    onBattlecry: (ops, _side, _self, targetId, isCombo) => {
      if (isCombo && targetId) ops.bounceMinionToHand(targetId, 0);
    },
  },
  NEW1_004: {
    // 소멸 (모든 하수인을 주인의 손으로 돌려보냄; 손패 10장 초과 시 파괴!)
    onCastSpell: (ops) => {
      const all = [...ops.state.player.board, ...ops.state.opponent.board].sort(
        (a, b) => a.playOrder - b.playOrder,
      );
      for (const m of all) {
        ops.bounceMinionToHand(m.uid, 0);
      }
    },
  },
  CS2_077: {
    // 전력 질주 (카드 4장 드로우)
    onCastSpell: (ops, side) => {
      ops.drawCards(side, 4);
    },
  },

  // ==================== SHAMAN (25) ====================
  CS2_041: {
    // 선인의 치유력 (하수인 생명력 모두 회복 + 도발 부여)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, side, targetId) => {
      const f = targetId ? ops.findMinion(targetId) : null;
      if (f) {
        ops.healTarget(f.minion.uid, f.minion.maxHealth, side);
        ops.buffMinion(f.minion.uid, 0, 0, { taunt: true });
      }
    },
  },
  EX1_244: {
    // 토템의 힘 (내 토템들에게 생명력 +2)
    onCastSpell: (ops, side) => {
      for (const m of ops.getPlayer(side).board) {
        if (m.race === 'TOTEM') ops.buffMinion(m.uid, 0, 2);
      }
    },
  },
  EX1_251: {
    // 갈래 번개 (무작위 적 하수인 둘에게 피해 2)
    vfx: 'LIGHTNING',
    onCastSpell: (ops, side) => {
      const enemies = [...ops.getPlayer(ops.getEnemySide(side)).board];
      const picks = enemies.sort(() => Math.random() - 0.5).slice(0, 2);
      const dmg = ops.getSpellDamageValue(side, 2);
      for (const m of picks) ops.dealDamage(m.uid, dmg, side, 'LIGHTNING');
    },
  },
  CS2_037: {
    // 냉기 충격 (적 캐릭터 피해 1 + 빙결)
    targetKind: 'ENEMY_CHARACTER',
    vfx: 'FROSTBOLT',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      ops.dealDamage(targetId, ops.getSpellDamageValue(side, 1), side, 'FROSTBOLT');
      ops.freezeTarget(targetId);
    },
  },
  EX1_245: {
    // 대지 충격 (하수인 침묵 후 피해 1 — 천보/죽메 완벽 카운터!)
    targetKind: 'ANY_MINION',
    vfx: 'SILENCE_RING',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      ops.silenceMinion(targetId);
      ops.dealDamage(targetId, ops.getSpellDamageValue(side, 1), side, 'NATURE_WRATH');
    },
  },
  CS2_045: {
    // 대지의 무기 (이번 턴 아군 캐릭터 공격력 +3)
    targetKind: 'FRIENDLY_CHARACTER',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      if (targetId === `${side}_HERO`) {
        ops.getPlayer(side).tempAttack += 3;
        ops.pushVfx('BUFF_POP', targetId, undefined, 3, '+3 공격력');
      } else {
        ops.buffMinion(targetId, 0, 0, { tempAtk: 3 });
      }
    },
  },
  EX1_238: {
    // 번개 화살 (피해 3)
    targetKind: 'ANY_CHARACTER',
    vfx: 'LIGHTNING',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 3), side, 'LIGHTNING');
    },
  },
  CS2_038: {
    // 고대의 영혼 (처치되면 다시 소환)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      const f = targetId ? ops.findMinion(targetId) : null;
      if (f) {
        f.minion.ancestralSpiritCount += 1;
        ops.pushVfx('HOLY_LIGHT', f.minion.uid, undefined, undefined, '고대의 영혼');
      }
    },
  },
  CS2_039: {
    // 질풍
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.buffMinion(targetId, 0, 0, { windfury: true });
    },
  },
  EX1_259: {
    // 번개 폭풍 (모든 적 하수인에게 2~3 피해)
    vfx: 'LIGHTNING',
    onCastSpell: (ops, side) => {
      for (const m of [...ops.getPlayer(ops.getEnemySide(side)).board]) {
        const base = 2 + Math.floor(Math.random() * 2);
        ops.dealDamage(m.uid, ops.getSpellDamageValue(side, base), side, 'LIGHTNING');
      }
    },
  },
  EX1_246: {
    // 사술 (0/1 도발 개구리로 변신)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.transformMinion(targetId, 'hexfrog');
    },
  },
  EX1_248: {
    // 야수 정령 (2/3 도발 늑대 정령 둘 소환)
    onCastSpell: (ops, side) => {
      ops.summonMinion(side, 'EX1_tk11');
      ops.summonMinion(side, 'EX1_tk11');
    },
  },
  EX1_241: {
    // 용암 폭발 (피해 5)
    targetKind: 'ANY_CHARACTER',
    vfx: 'FIREBALL',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 5), side, 'FIREBALL');
    },
  },
  CS2_053: {
    // 천리안 (카드 1장 뽑고 그 카드 비용 -3)
    onCastSpell: (ops, side) => {
      ops.drawCards(side, 1, -3);
    },
  },
  EX1_587: {
    // 바람예언자 (아군 하수인에게 질풍 부여)
    targetKind: 'FRIENDLY_MINION',
    onBattlecry: (ops, _side, _self, targetId) => {
      if (targetId) ops.buffMinion(targetId, 0, 0, { windfury: true });
    },
  },
  CS2_046: {
    // 피의 욕망 (이번 턴 내 하수인들에게 공격력 +3)
    onCastSpell: (ops, side) => {
      for (const m of ops.getPlayer(side).board) {
        ops.buffMinion(m.uid, 0, 0, { tempAtk: 3 });
      }
      ops.pushVfx('EXPLOSION', `${side}_HERO`, undefined, 3, '피의 욕망!');
    },
  },
  CS2_042: {
    // 불의 정령 (전투의 함성: 피해 3)
    targetKind: 'ANY_CHARACTER',
    onBattlecry: (ops, side, self, targetId) => {
      if (targetId) ops.dealDamage(targetId, 3, side, 'FIREBALL', self.uid);
    },
  },

  // ==================== WARLOCK (25) ====================
  EX1_308: {
    // 영혼의 불꽃 (피해 4 + 무작위 카드 1장 버림)
    targetKind: 'ANY_CHARACTER',
    vfx: 'FIREBALL',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 4), side, 'FIREBALL');
      ops.discardRandomCards(side, 1);
    },
  },
  NEW1_003: {
    // 희생의 서약 (악마 처치 + 내 영웅 생명력 5 회복)
    targetKind: 'ANY_DEMON',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.destroyMinion(targetId);
      ops.healTarget(`${side}_HERO`, ops.getHealValue(side, 5), side);
    },
  },
  CS2_063: {
    // 부패 (다음 내 턴 시작 시 적 하수인 처치)
    targetKind: 'ENEMY_MINION',
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, side, targetId) => {
      const f = targetId ? ops.findMinion(targetId) : null;
      if (f) {
        f.minion.corruptionOwner = side;
        ops.pushVfx('SHADOW_BOLT', f.minion.uid, undefined, undefined, '부패');
      }
    },
  },
  EX1_316: {
    // 압도적인 힘 (아군 하수인 +4/+4, 턴 종료 시 죽음)
    targetKind: 'FRIENDLY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      const f = targetId ? ops.findMinion(targetId) : null;
      if (f) {
        ops.buffMinion(f.minion.uid, 4, 4);
        f.minion.powerOverwhelmingDieAtEndTurn = true;
      }
    },
  },
  EX1_302: {
    // 필멸의 고리 (하수인에게 피해 1, 죽으면 드로우 1)
    targetKind: 'ANY_MINION',
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      const res = ops.dealDamage(targetId, ops.getSpellDamageValue(side, 1), side, 'SHADOW_BOLT');
      const fAfter = ops.findMinion(targetId);
      if (res.killed || !fAfter || fAfter.minion.health <= 0) {
        ops.drawCards(side, 1);
      }
    },
  },
  EX1_319: {
    // 화염 임프 (내 영웅에게 피해 3)
    onBattlecry: (ops, side, self) => {
      ops.dealDamage(`${side}_HERO`, 3, side, 'FIREBALL', self.uid);
    },
  },
  EX1_596: {
    // 악마의 불꽃 (적이나 비악마면 피해 2, 아군 악마면 +2/+2)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, side, targetId) => {
      const f = targetId ? ops.findMinion(targetId) : null;
      if (!f) return;
      if (f.side === side && f.minion.race === 'DEMON') {
        ops.buffMinion(f.minion.uid, 2, 2);
      } else {
        ops.dealDamage(f.minion.uid, ops.getSpellDamageValue(side, 2), side, 'FIREBALL');
      }
    },
  },
  EX1_306: {
    // 지옥파수견 (무작위 카드 1장 버림)
    onBattlecry: (ops, side) => {
      ops.discardRandomCards(side, 1);
    },
  },
  EX1_304: {
    // 공허의 괴물 (양옆 하수인 처치 후 공격력/생명력 흡수)
    onBattlecry: (ops, _side, self) => {
      const adj = ops.getAdjacentMinions(self.uid);
      let gainAtk = 0;
      let gainHp = 0;
      for (const a of adj) {
        gainAtk += a.permAttack + a.tempAttack + a.auraAttack;
        gainHp += Math.max(0, a.health + a.auraHealth);
        ops.destroyMinion(a.uid);
      }
      if (gainAtk > 0 || gainHp > 0) {
        ops.buffMinion(self.uid, gainAtk, gainHp);
      }
    },
  },
  CS2_061: {
    // 생명력 흡수 (피해 2 + 내 영웅 생명력 2 회복)
    targetKind: 'ANY_CHARACTER',
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 2), side, 'SHADOW_BOLT');
      ops.healTarget(`${side}_HERO`, ops.getHealValue(side, 2), side);
    },
  },
  EX1_317: {
    // 악마 감지 (내 덱에서 악마 2장 뽑기, 부족하면 1/1 쓸모없는 임프!)
    onCastSpell: (ops, side) => {
      const p = ops.getPlayer(side);
      for (let i = 0; i < 2; i++) {
        const idx = p.deck.findIndex((cid) => cardDb.getCard(cid)?.race === 'DEMON');
        if (idx >= 0) {
          const [cid] = p.deck.splice(idx, 1);
          ops.addCardToHand(side, cid);
        } else {
          ops.addCardToHand(side, 'EX1_598');
        }
      }
    },
  },
  CS2_057: {
    // 어둠의 화살 (하수인에게 피해 4)
    targetKind: 'ANY_MINION',
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.dealDamage(targetId, ops.getSpellDamageValue(side, 4), side, 'SHADOW_BOLT');
    },
  },
  EX1_301: {
    // 지옥수호병 (내 마나 수정 1개 파괴)
    onBattlecry: (ops, side) => {
      const p = ops.getPlayer(side);
      p.maxMana = Math.max(0, p.maxMana - 1);
      p.mana = Math.min(p.mana, p.maxMana);
    },
  },
  EX1_303: {
    // 암흑불길 (아군 하수인 처치 후 그 공격력만큼 모든 적 하수인에게 피해)
    targetKind: 'FRIENDLY_MINION',
    vfx: 'FLAMESTRIKE',
    onCastSpell: (ops, side, targetId) => {
      const f = targetId ? ops.findMinion(targetId) : null;
      if (!f) return;
      const baseAtk = f.minion.permAttack + f.minion.tempAttack + f.minion.auraAttack;
      ops.destroyMinion(f.minion.uid);
      const dmg = ops.getSpellDamageValue(side, baseAtk);
      for (const m of [...ops.getPlayer(ops.getEnemySide(side)).board]) {
        ops.dealDamage(m.uid, dmg, side, 'SHADOW_BOLT');
      }
    },
  },
  EX1_313: {
    // 지옥의 군주 (내 영웅에게 피해 5)
    onBattlecry: (ops, side, self) => {
      ops.dealDamage(`${side}_HERO`, 5, side, 'FIREBALL', self.uid);
    },
  },
  CS2_062: {
    // 지옥의 불길 (모든 캐릭터에게 피해 3)
    vfx: 'FLAMESTRIKE',
    onCastSpell: (ops, side) => {
      const dmg = ops.getSpellDamageValue(side, 3);
      const all = [
        'PLAYER_HERO',
        'OPPONENT_HERO',
        ...ops.state.player.board.map((m) => m.uid),
        ...ops.state.opponent.board.map((m) => m.uid),
      ];
      for (const tid of all) ops.dealDamage(tid, dmg, side, 'FIREBALL');
    },
  },
  EX1_320: {
    // 운명의 파멸 (캐릭터 피해 2; 클래식/최신 텍스트 호환 피해 3, 죽으면 무작위 악마 소환)
    targetKind: 'ANY_CHARACTER',
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      const res = ops.dealDamage(targetId, ops.getSpellDamageValue(side, 3), side, 'SHADOW_BOLT');
      const fAfter = ops.findMinion(targetId);
      const died =
        res.killed ||
        (targetId !== 'PLAYER_HERO' && targetId !== 'OPPONENT_HERO' && (!fAfter || fAfter.minion.health <= 0));
      if (died) {
        const demons = cardDb
          .getAllCollectible()
          .filter((c) => c.type === 'MINION' && c.race === 'DEMON');
        if (demons.length > 0) {
          ops.summonMinion(side, demons[Math.floor(Math.random() * demons.length)].id);
        }
      }
    },
  },
  EX1_310: {
    // 파멸수호병 (돌진 + 무작위 카드 2장 버림)
    onBattlecry: (ops, side) => {
      ops.discardRandomCards(side, 2);
    },
  },
  CS2_064: {
    // 공포의 지옥불악마 (다른 모든 캐릭터에게 피해 1)
    onBattlecry: (ops, side, self) => {
      const all = [
        'PLAYER_HERO',
        'OPPONENT_HERO',
        ...ops.state.player.board.map((m) => m.uid),
        ...ops.state.opponent.board.map((m) => m.uid),
      ];
      for (const tid of all) {
        if (tid !== self.uid) ops.dealDamage(tid, 1, side, 'FIREBALL', self.uid);
      }
    },
  },
  EX1_309: {
    // 영혼 착취 (하수인 처치 + 내 영웅 생명력 3 회복)
    targetKind: 'ANY_MINION',
    vfx: 'SHADOW_BOLT',
    onCastSpell: (ops, side, targetId) => {
      if (targetId) ops.destroyMinion(targetId);
      ops.healTarget(`${side}_HERO`, ops.getHealValue(side, 3), side);
    },
  },
  EX1_312: {
    // 뒤틀린 황천 (모든 하수인 처치!)
    vfx: 'EXPLOSION',
    onCastSpell: (ops) => {
      ops.pushVfx('EXPLOSION', 'OPPONENT_HERO', undefined, undefined, '뒤틀린 황천!');
      for (const m of [...ops.state.player.board, ...ops.state.opponent.board]) {
        ops.destroyMinion(m.uid);
      }
    },
  },
  EX1_323: {
    // 군주 자락서스!! (정통 2014 클래식: 내 영웅을 생명력 15 군주 자락서스로 교체 + 3/8 피의 격노 무기 장착 + 6/6 지옥불! 영웅 능력!)
    onBattlecry: (ops, side, self) => {
      const p = ops.getPlayer(side);
      // Remove Jaraxxus minion from board and replace Hero!
      p.board = p.board.filter((m) => m.uid !== self.uid);
      p.isJaraxxus = true;
      p.heroId = 'EX1_323h';
      p.heroNameKo = '군주 자락서스';
      p.maxHealth = 15;
      p.health = 15;
      p.armor = 0;
      p.heroPowerId = 'EX1_tk33';
      p.heroPowerNameKo = '지옥불!';
      p.heroPowerTextKo = '6/6 지옥불악마를 소환합니다.';
      p.heroPowerNeedsTarget = false;
      p.heroPowerUsedThisTurn = false;
      ops.equipWeapon(side, 'EX1_323w');
      ops.pushVfx('LEGENDARY_SLAM', `${side}_HERO`, undefined, 15, '불타는 군단의 에레다르 군주, 자락서스 님이 상대해 주마!');
    },
  },

  // ==================== WARRIOR (25) ====================
  EX1_607: {
    // 내면의 분노 (하수인에게 피해 1 + 공격력 +2)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      ops.dealDamage(targetId, ops.getSpellDamageValue(side, 1), side, 'FIREBALL');
      const f = ops.findMinion(targetId);
      if (f && f.minion.health > 0) {
        ops.buffMinion(targetId, 2, 0);
      }
    },
  },
  EX1_409: {
    // 강화! (무기 있으면 +1/+1, 없으면 1/3 무거운 도끼 장착)
    onCastSpell: (ops, side) => {
      const p = ops.getPlayer(side);
      if (p.weapon) {
        p.weapon.baseAttack += 1;
        p.weapon.attack += 1;
        p.weapon.durability += 1;
        p.weapon.maxDurability += 1;
      } else {
        ops.equipWeapon(side, 'EX1_409t');
      }
    },
  },
  CS2_108: {
    // 마무리 일격 (피해를 받은 적 하수인 처치)
    targetKind: 'DAMAGED_ENEMY_MINION',
    vfx: 'EXPLOSION',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.destroyMinion(targetId);
    },
  },
  EX1_410: {
    // 방패 밀쳐내기 (내 방어도만큼 하수인에게 피해)
    targetKind: 'ANY_MINION',
    vfx: 'EXPLOSION',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      const armor = ops.getPlayer(side).armor;
      ops.dealDamage(targetId, ops.getSpellDamageValue(side, armor), side, 'EXPLOSION');
    },
  },
  EX1_400: {
    // 소용돌이 (모든 하수인 피해 1)
    vfx: 'WHIRLWIND',
    onCastSpell: (ops, side) => {
      const dmg = ops.getSpellDamageValue(side, 1);
      ops.pushVfx('WHIRLWIND', 'PLAYER_HERO');
      for (const m of [...ops.state.player.board, ...ops.state.opponent.board]) {
        ops.dealDamage(m.uid, dmg, side, 'WHIRLWIND');
      }
    },
  },
  EX1_391: {
    // 격돌 (하수인 피해 2, 생존하면 드로우 1)
    targetKind: 'ANY_MINION',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      ops.dealDamage(targetId, ops.getSpellDamageValue(side, 2), side, 'EXPLOSION');
      const f = ops.findMinion(targetId);
      if (f && f.minion.health > 0) {
        ops.drawCards(side, 1);
      }
    },
  },
  CS2_104: {
    // 광란 (피해 입은 하수인 +3/+3)
    targetKind: 'DAMAGED_MINION',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.buffMinion(targetId, 3, 3);
    },
  },
  CS2_105: {
    // 영웅의 일격 (이번 턴 내 영웅 공격력 +4)
    onCastSpell: (ops, side) => {
      ops.getPlayer(side).tempAttack += 4;
      ops.pushVfx('BUFF_POP', `${side}_HERO`, undefined, 4, '+4 공격력');
    },
  },
  EX1_603: {
    // 잔인한 감독관 (하수인에게 피해 1 + 공격력 +2)
    targetKind: 'ANY_MINION',
    onBattlecry: (ops, side, self, targetId) => {
      if (!targetId) return;
      ops.dealDamage(targetId, 1, side, 'WHIRLWIND', self.uid);
      const f = ops.findMinion(targetId);
      if (f && f.minion.health > 0) {
        ops.buffMinion(targetId, 2, 0);
      }
    },
  },
  EX1_392: {
    // 전투 격노 (피해를 받은 아군 캐릭터 수만큼 카드 드로우)
    onCastSpell: (ops, side) => {
      const p = ops.getPlayer(side);
      let count = p.health < p.maxHealth ? 1 : 0;
      for (const m of p.board) {
        if (m.health < m.maxHealth) count += 1;
      }
      if (count > 0) ops.drawCards(side, count);
    },
  },
  NEW1_036: {
    // 지휘의 외침 (이번 턴 내 하수인 생명력이 1 미만으로 내려가지 않음 + 드로우 1)
    onCastSpell: (ops, side) => {
      const p = ops.getPlayer(side);
      p.commandingShoutThisTurn = true;
      for (const m of p.board) m.cannotReduceBelow1ThisTurn = true;
      ops.drawCards(side, 1);
    },
  },
  CS2_114: {
    // 회전베기 (무작위 적 하수인 둘에게 피해 2)
    vfx: 'WHIRLWIND',
    onCastSpell: (ops, side) => {
      const enemies = [...ops.getPlayer(ops.getEnemySide(side)).board];
      const picks = enemies.sort(() => Math.random() - 0.5).slice(0, 2);
      const dmg = ops.getSpellDamageValue(side, 2);
      for (const m of picks) ops.dealDamage(m.uid, dmg, side, 'WHIRLWIND');
    },
  },
  CS2_103: {
    // 돌진 (정통 2014 클래식: 아군 하수인 하나에게 공격력 +2와 돌진 부여!)
    targetKind: 'FRIENDLY_MINION',
    onCastSpell: (ops, _side, targetId) => {
      if (targetId) ops.buffMinion(targetId, 2, 0, { charge: true });
    },
  },
  EX1_606: {
    // 방패 올리기 (+5 방어도 + 드로우 1)
    onCastSpell: (ops, side) => {
      ops.addArmor(side, 5);
      ops.drawCards(side, 1);
    },
  },
  EX1_398: {
    // 아라시 무기제작자 (2/2 전투 도끼 장착)
    onBattlecry: (ops, side) => {
      ops.equipWeapon(side, 'EX1_398t');
    },
  },
  EX1_408: {
    // 필사의 일격 (피해 4, 내 생명력이 12 이하면 피해 6)
    targetKind: 'ANY_CHARACTER',
    vfx: 'EXPLOSION',
    onCastSpell: (ops, side, targetId) => {
      if (!targetId) return;
      const base = ops.getPlayer(side).health <= 12 ? 6 : 4;
      ops.dealDamage(targetId, ops.getSpellDamageValue(side, base), side, 'EXPLOSION');
    },
  },
  EX1_407: {
    // 난투 (무작위 하수인 하나를 제외한 모든 하수인 처치!)
    vfx: 'EXPLOSION',
    onCastSpell: (ops) => {
      const all = [...ops.state.player.board, ...ops.state.opponent.board];
      if (all.length <= 1) return;
      const survivor = all[Math.floor(Math.random() * all.length)];
      ops.pushVfx('EXPLOSION', survivor.uid, undefined, undefined, '난투!');
      for (const m of all) {
        if (m.uid !== survivor.uid) ops.destroyMinion(m.uid);
      }
    },
  },

  // ==================== NEUTRAL BATTLECRIES (ALL) ====================
  CS2_188: {
    // 가혹한 하사관 (이번 턴 하수인 공격력 +2)
    targetKind: 'OTHER_MINION',
    onBattlecry: (ops, _side, _self, targetId) => {
      if (targetId) ops.buffMinion(targetId, 0, 0, { tempAtk: 2 });
    },
  },
  NEW1_017: {
    // 굶주린 게 (멀록 처치 후 +2/+2)
    targetKind: 'ANY_MURLOC',
    onBattlecry: (ops, _side, self, targetId) => {
      if (targetId) {
        ops.destroyMinion(targetId);
        ops.buffMinion(self.uid, 2, 2);
      }
    },
  },
  EX1_011: {
    // 부두교 의술사 (생명력 2 회복)
    targetKind: 'ANY_CHARACTER',
    onBattlecry: (ops, side, _self, targetId) => {
      if (targetId) ops.healTarget(targetId, 2, side);
    },
  },
  NEW1_025: {
    // 붉은해적단 바다사냥꾼 (상대 무기 내구도 -1)
    onBattlecry: (ops, side) => {
      const enemy = ops.getPlayer(ops.getEnemySide(side));
      if (enemy.weapon) {
        enemy.weapon.durability -= 1;
        if (enemy.weapon.durability <= 0) ops.destroyWeapon(ops.getEnemySide(side));
      }
    },
  },
  CS2_189: {
    // 엘프 궁수 (피해 1)
    targetKind: 'ANY_CHARACTER',
    onBattlecry: (ops, side, self, targetId) => {
      if (targetId) ops.dealDamage(targetId, 1, side, 'ARCANE_BOLT', self.uid);
    },
  },
  EX1_059: {
    // 광기의 연금술사 (하수인 공격력과 생명력 교환)
    targetKind: 'OTHER_MINION',
    onBattlecry: (ops, _side, _self, targetId) => {
      const f = targetId ? ops.findMinion(targetId) : null;
      if (!f) return;
      const curAtk = Math.max(0, f.minion.permAttack + f.minion.tempAttack + f.minion.auraAttack);
      const curHp = Math.max(0, f.minion.health + f.minion.auraHealth);
      f.minion.permAttack = curHp;
      f.minion.tempAttack = 0;
      f.minion.maxHealth = curAtk;
      f.minion.health = curAtk;
      if (curAtk <= 0) ops.destroyMinion(f.minion.uid);
    },
  },
  EX1_506: {
    // 멀록 바다사냥꾼 (1/1 멀록 정찰병 소환)
    onBattlecry: (ops, side) => {
      ops.summonMinion(side, 'EX1_506a');
    },
  },
  CS2_203: {
    // 무쇠부리 올빼미 (하수인 침묵)
    targetKind: 'OTHER_MINION',
    onBattlecry: (ops, _side, _self, targetId) => {
      if (targetId) ops.silenceMinion(targetId);
    },
  },
  NEW1_029: {
    // 밀하우스 마나스톰 (다음 상대 턴에 상대 주문 비용 0)
    onBattlecry: (ops, side) => {
      ops.getPlayer(ops.getEnemySide(side)).spellsZeroThisTurn = true;
    },
  },
  NEW1_018: {
    // 붉은해적단 약탈자 (내 무기 공격력만큼 공격력 획득)
    onBattlecry: (ops, side, self) => {
      const w = ops.getPlayer(side).weapon;
      if (w && w.attack > 0) ops.buffMinion(self.uid, w.attack, 0);
    },
  },
  EX1_066: {
    // 산성 늪수액괴물 (상대 무기 파괴)
    onBattlecry: (ops, side) => {
      ops.destroyWeapon(ops.getEnemySide(side));
    },
  },
  NEW1_016: {
    // 선장의 앵무새 (내 덱에서 해적 뽑기)
    onBattlecry: (ops, side) => {
      const p = ops.getPlayer(side);
      const idx = p.deck.findIndex((cid) => cardDb.getCard(cid)?.race === 'PIRATE');
      if (idx >= 0) {
        const [cid] = p.deck.splice(idx, 1);
        ops.addCardToHand(side, cid);
      }
    },
  },
  EX1_058: {
    // 성난태양 파수병 (양옆 하수인 도발 부여)
    onBattlecry: (ops, _side, self) => {
      for (const a of ops.getAdjacentMinions(self.uid)) {
        ops.buffMinion(a.uid, 0, 0, { taunt: true });
      }
    },
  },
  EX1_049: {
    // 젊은 양조사 (아군 하수인을 내 손으로)
    targetKind: 'FRIENDLY_MINION',
    onBattlecry: (ops, _side, self, targetId) => {
      if (targetId && targetId !== self.uid) ops.bounceMinionToHand(targetId, 0);
    },
  },
  EX1_082: {
    // 정신 나간 폭격수 (다른 모든 캐릭터에게 3 피해 무작위 분할)
    onBattlecry: (ops, side, self) => {
      for (let i = 0; i < 3; i++) {
        const pool = [
          'PLAYER_HERO',
          'OPPONENT_HERO',
          ...ops.state.player.board.filter((m) => m.uid !== self.uid && m.health > 0).map((m) => m.uid),
          ...ops.state.opponent.board.filter((m) => m.uid !== self.uid && m.health > 0).map((m) => m.uid),
        ];
        const pick = pool[Math.floor(Math.random() * pool.length)];
        ops.dealDamage(pick, 1, side, 'EXPLOSION', self.uid);
      }
    },
  },
  EX1_015: {
    // 풋내기 기술자 (드로우 1)
    onBattlecry: (ops, side) => {
      ops.drawCards(side, 1);
    },
  },
  CS2_196: {
    // 가시덩굴 사냥꾼 (1/1 멧돼지 소환)
    onBattlecry: (ops, side) => {
      ops.summonMinion(side, 'CS2_boar');
    },
  },
  EX1_005: {
    // 나 이런 사냥꾼이야 (공격력 7 이상 하수인 처치)
    targetKind: 'ATK_7_PLUS_MINION',
    onBattlecry: (ops, _side, _self, targetId) => {
      if (targetId) ops.destroyMinion(targetId);
    },
  },
  CS2_117: {
    // 대지 고리회 선견자 (생명력 3 회복)
    targetKind: 'ANY_CHARACTER',
    onBattlecry: (ops, side, _self, targetId) => {
      if (targetId) ops.healTarget(targetId, 3, side);
    },
  },
  EX1_019: {
    // 무너진 태양 성직자 (아군 하수인 +1/+1)
    targetKind: 'FRIENDLY_MINION',
    onBattlecry: (ops, _side, self, targetId) => {
      if (targetId && targetId !== self.uid) ops.buffMinion(targetId, 1, 1);
    },
  },
  EX1_014: {
    // 밀림의 왕 무클라 (상대에게 바나나 2개 지급)
    onBattlecry: (ops, side) => {
      const opp = ops.getEnemySide(side);
      ops.addCardToHand(opp, 'EX1_014t');
      ops.addCardToHand(opp, 'EX1_014t');
    },
  },
  CS2_181: {
    // 부상당한 검귀 (자신에게 피해 4)
    onBattlecry: (ops, side, self) => {
      ops.dealDamage(self.uid, 4, side, 'WHIRLWIND', self.uid);
    },
  },
  EX1_089: {
    // 비전 골렘 (상대에게 마나 수정 +1)
    onBattlecry: (ops, side) => {
      const opp = ops.getPlayer(ops.getEnemySide(side));
      opp.maxMana = Math.min(10, opp.maxMana + 1);
      opp.mana = Math.min(10, opp.mana + 1);
    },
  },
  EX1_083: {
    // 수석땜장이 오버스파크 (다른 무작위 하수인을 5/5 데빌사우루스 또는 1/1 다람쥐로 변신!)
    onBattlecry: (ops, _side, self) => {
      const others = [...ops.state.player.board, ...ops.state.opponent.board].filter(
        (m) => m.uid !== self.uid,
      );
      if (others.length > 0) {
        const pick = others[Math.floor(Math.random() * others.length)];
        ops.transformMinion(pick.uid, Math.random() < 0.5 ? 'EX1_tk29' : 'EX1_tk28');
      }
    },
  },
  EX1_103: {
    // 시린빛 예언자 (다른 모든 멀록에게 생명력 +2)
    onBattlecry: (ops, _side, self) => {
      for (const m of [...ops.state.player.board, ...ops.state.opponent.board]) {
        if (m.uid !== self.uid && m.race === 'MURLOC') ops.buffMinion(m.uid, 0, 2);
      }
    },
  },
  EX1_050: {
    // 시린빛 점쟁이 (각 플레이어가 카드 2장씩 드로우)
    onBattlecry: (ops, side) => {
      ops.drawCards(side, 2);
      ops.drawCards(ops.getEnemySide(side), 2);
    },
  },
  CS2_141: {
    // 아이언포지 소총병 (피해 1)
    targetKind: 'ANY_CHARACTER',
    onBattlecry: (ops, side, self, targetId) => {
      if (targetId) ops.dealDamage(targetId, 1, side, 'FIREBALL', self.uid);
    },
  },
  EX1_085: {
    // 정신 지배 기술자 (상대 하수인 4기 이상이면 무작위 적 하수인 1기 강탈!)
    onBattlecry: (ops, side) => {
      const enemies = ops.getPlayer(ops.getEnemySide(side)).board;
      if (enemies.length >= 4) {
        const pick = enemies[Math.floor(Math.random() * enemies.length)];
        ops.takeControlOfMinion(pick.uid, side, false);
      }
    },
  },
  EX1_590: {
    // 혈기사 (모든 하수인의 천상의 보호막을 흡수해 하나당 +3/+3)
    onBattlecry: (ops, _side, self) => {
      let absorbed = 0;
      for (const m of [...ops.state.player.board, ...ops.state.opponent.board]) {
        if (m.divineShield) {
          m.divineShield = false;
          absorbed += 1;
          ops.pushVfx('DIVINE_BREAK', m.uid);
        }
      }
      if (absorbed > 0) ops.buffMinion(self.uid, absorbed * 3, absorbed * 3);
    },
  },
  EX1_046: {
    // 검은무쇠 드워프 (이번 턴 하수인 공격력 +2)
    targetKind: 'OTHER_MINION',
    onBattlecry: (ops, _side, _self, targetId) => {
      if (targetId) ops.buffMinion(targetId, 0, 0, { tempAtk: 2 });
    },
  },
  EX1_584: {
    // 고대의 마법사 (양옆 하수인 주문 공격력 +1 부여)
    onBattlecry: (ops, _side, self) => {
      for (const a of ops.getAdjacentMinions(self.uid)) {
        ops.buffMinion(a.uid, 0, 0, { spellDamage: 1 });
      }
    },
  },
  EX1_057: {
    // 고대의 양조사 (아군 하수인을 내 손으로)
    targetKind: 'FRIENDLY_MINION',
    onBattlecry: (ops, _side, self, targetId) => {
      if (targetId && targetId !== self.uid) ops.bounceMinionToHand(targetId, 0);
    },
  },
  EX1_025: {
    // 기계용 정비사 (2/1 소형 기계용 소환)
    onBattlecry: (ops, side) => {
      ops.summonMinion(side, 'EX1_025t');
    },
  },
  CS2_147: {
    // 노움 발명가 (드로우 1)
    onBattlecry: (ops, side) => {
      ops.drawCards(side, 1);
    },
  },
  EX1_116: {
    // 리로이 젠킨스 (상대편에게 1/1 새끼용 2마리 소환!)
    onBattlecry: (ops, side) => {
      const opp = ops.getEnemySide(side);
      ops.summonMinion(opp, 'EX1_116t');
      ops.summonMinion(opp, 'EX1_116t');
    },
  },
  EX1_093: {
    // 아르거스의 수호자 (양옆 하수인 +1/+1 & 도발)
    onBattlecry: (ops, _side, self) => {
      for (const a of ops.getAdjacentMinions(self.uid)) {
        ops.buffMinion(a.uid, 1, 1, { taunt: true });
      }
    },
  },
  EX1_048: {
    // 주문파괴자 (하수인 침묵)
    targetKind: 'OTHER_MINION',
    onBattlecry: (ops, _side, _self, targetId) => {
      if (targetId) ops.silenceMinion(targetId);
    },
  },
  EX1_043: {
    // 황혼의 비룡 (내 손에 있는 카드 1장당 생명력 +1)
    onBattlecry: (ops, side, self) => {
      const cnt = ops.getPlayer(side).hand.length;
      if (cnt > 0) ops.buffMinion(self.uid, 0, cnt);
    },
  },
  NEW1_041: {
    // 날뛰는 코도 (공격력 2 이하 무작위 적 하수인 처치)
    onBattlecry: (ops, side) => {
      const candidates = ops
        .getPlayer(ops.getEnemySide(side))
        .board.filter((m) => m.permAttack + m.tempAttack + m.auraAttack <= 2);
      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        ops.destroyMinion(pick.uid);
      }
    },
  },
  CS2_226: {
    // 서리늑대 전쟁군주 (전장의 다른 아군 하수인 하나당 +1/+1)
    onBattlecry: (ops, side, self) => {
      const others = ops.getPlayer(side).board.filter((m) => m.uid !== self.uid).length;
      if (others > 0) ops.buffMinion(self.uid, others, others);
    },
  },
  NEW1_024: {
    // 선장 그린스킨 (내 무기 +1/+1)
    onBattlecry: (ops, side) => {
      const w = ops.getPlayer(side).weapon;
      if (w) {
        w.baseAttack += 1;
        w.attack += 1;
        w.durability += 1;
        w.maxDurability += 1;
      }
    },
  },
  CS2_150: {
    // 스톰파이크 특공대 (피해 2)
    targetKind: 'ANY_CHARACTER',
    onBattlecry: (ops, side, self, targetId) => {
      if (targetId) ops.dealDamage(targetId, 2, side, 'EXPLOSION', self.uid);
    },
  },
  EX1_593: {
    // 암흑칼날 (적 영웅에게 피해 3)
    onBattlecry: (ops, side, self) => {
      ops.dealDamage(`${ops.getEnemySide(side)}_HERO`, 3, side, 'SHADOW_BOLT', self.uid);
    },
  },
  DS1_055: {
    // 어둠비늘 치유사 (모든 아군 캐릭터 생명력 2 회복)
    onBattlecry: (ops, side) => {
      ops.healTarget(`${side}_HERO`, 2, side);
      for (const m of ops.getPlayer(side).board) {
        ops.healTarget(m.uid, 2, side);
      }
    },
  },
  EX1_564: {
    // 얼굴 없는 배후자 (선택한 하수인으로 완벽 복사 변신!)
    targetKind: 'OTHER_MINION',
    onBattlecry: (ops, _side, self, targetId) => {
      const f = targetId ? ops.findMinion(targetId) : null;
      if (!f) return;
      const src = f.minion;
      self.cardId = src.cardId;
      self.name = src.name;
      self.baseAttack = src.baseAttack;
      self.baseHealth = src.baseHealth;
      self.permAttack = src.permAttack;
      self.tempAttack = src.tempAttack;
      self.maxHealth = src.maxHealth;
      self.health = src.health;
      self.race = src.race;
      self.rarity = src.rarity;
      self.taunt = src.taunt;
      self.divineShield = src.divineShield;
      self.charge = src.charge;
      self.windfury = src.windfury;
      self.stealth = src.stealth;
      self.frozen = src.frozen;
      self.silenced = src.silenced;
      self.poisonous = src.poisonous;
      self.elusive = src.elusive;
      self.cantAttack = src.cantAttack;
      self.spellDamage = src.spellDamage;
      self.exhausted = !(src.charge || src.auraCharge);
      self.soulOfTheForestCount = src.soulOfTheForestCount;
      self.ancestralSpiritCount = src.ancestralSpiritCount;
    },
  },
  CS2_151: {
    // 은빛 성기사단 기사 (2/2 종자 소환)
    onBattlecry: (ops, side) => {
      ops.summonMinion(side, 'CS2_152');
    },
  },
  PRO_001: {
    // 정예 타우렌 족장 (양 플레이어에게 무작위 파워 코드 지급!)
    onBattlecry: (ops, side) => {
      const chords = ['PRO_001a', 'PRO_001b', 'PRO_001c'];
      ops.addCardToHand(side, chords[Math.floor(Math.random() * chords.length)]);
      ops.addCardToHand(ops.getEnemySide(side), chords[Math.floor(Math.random() * chords.length)]);
    },
  },
  EX1_284: {
    // 하늘빛 비룡 (주문 공격력 +1, 전함: 드로우 1)
    onBattlecry: (ops, side) => {
      ops.drawCards(side, 1);
    },
  },
  EX1_558: {
    // 해리슨 존스 (상대 무기 파괴 + 그 내구도만큼 카드 드로우!)
    onBattlecry: (ops, side) => {
      const destroyed = ops.destroyWeapon(ops.getEnemySide(side));
      if (destroyed && destroyed.durability > 0) {
        ops.drawCards(side, destroyed.durability);
      }
    },
  },
  EX1_112: {
    // 겔빈 멕카토크 (끝내주는 발명품 4종 중 무작위 소환!)
    onBattlecry: (ops, side) => {
      const invs = ['Mekka1', 'Mekka2', 'Mekka3', 'Mekka4'];
      ops.summonMinion(side, invs[Math.floor(Math.random() * invs.length)]);
    },
  },
  EX1_283: {
    // 냉기 정령 (캐릭터 빙결)
    targetKind: 'ANY_CHARACTER',
    onBattlecry: (ops, _side, _self, targetId) => {
      if (targetId) ops.freezeTarget(targetId);
    },
  },
  EX1_583: {
    // 엘룬의 여사제 (내 영웅 생명력 4 회복)
    onBattlecry: (ops, side) => {
      ops.healTarget(`${side}_HERO`, 4, side);
    },
  },
  EX1_002: {
    // 흑기사 (적 도발 하수인 처치)
    targetKind: 'ENEMY_TAUNT_MINION',
    onBattlecry: (ops, _side, _self, targetId) => {
      if (targetId) ops.destroyMinion(targetId);
    },
  },
  EX1_561: {
    // 알렉스트라자 (선택한 영웅의 남은 생명력을 15로 만듦!)
    targetKind: 'ANY_HERO',
    onBattlecry: (ops, _side, self, targetId) => {
      if (!targetId) return;
      const heroSide: PlayerSide = targetId === 'PLAYER_HERO' ? 'PLAYER' : 'OPPONENT';
      const p = ops.getPlayer(heroSide);
      if (p.maxHealth < 15) p.maxHealth = 15;
      p.health = 15;
      ops.pushVfx('FIREBALL', targetId, self.uid, 15, '생명력 15!');
    },
  },
  EX1_562: {
    // 오닉시아 (내 전장을 1/1 새끼용으로 가득 채움!)
    onBattlecry: (ops, side) => {
      while (ops.getPlayer(side).board.length < 7) {
        if (!ops.summonMinion(side, 'EX1_116t')) break;
      }
    },
  },
  NEW1_030: {
    // 데스윙 (전장의 다른 모든 하수인 처치 + 내 손패 모두 버림!!)
    onBattlecry: (ops, side, self) => {
      ops.pushVfx('EXPLOSION', 'OPPONENT_HERO', self.uid, undefined, '나는 힘의 화신이다!!');
      const p = ops.getPlayer(side);
      p.hand = [];
      for (const m of [...ops.state.player.board, ...ops.state.opponent.board]) {
        if (m.uid !== self.uid) ops.destroyMinion(m.uid);
      }
    },
  },
};

export function isCardCoveredByEngine(def: ClassicCardDef): boolean {
  if (CARD_SCRIPTS[def.id]) return true;
  if (def.mechanics.includes('SECRET')) return true;
  if (def.type === 'WEAPON') return true;
  // Pure vanilla or passive/trigger/deathrattle minions handled natively in GameEngine
  return def.type === 'MINION';
}
