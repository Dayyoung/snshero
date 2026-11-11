import { CLASSIC_PRESET_DECKS, cardDb } from '../cardDb';
import {
  BattleMatchState,
  CLASSIC_HEROES,
  GameMode,
  HERO_CLASS_ORDER,
  HeroClass,
  MinionInstance,
  PlayerSide,
} from '../types';
import { CARD_SCRIPTS } from './cardEffects';
import {
  createEngine,
  getHeroAttack,
  getMinionAttack,
  getMinionHealth,
  getMinionMaxHealth,
  hasMinionTaunt,
} from './GameEngine';

export type AiAction =
  | {
      kind: 'PLAY_CARD';
      handUid: string;
      cardId: string;
      targetId?: string;
      insertIndex?: number;
      chooseOptionIndex?: 0 | 1;
    }
  | {
      kind: 'HERO_POWER';
      targetId?: string;
    }
  | {
      kind: 'ATTACK';
      attackerId: string;
      defenderId: string;
    }
  | {
      kind: 'END_TURN';
    };

/**
 * Iconic 2014 Classic Expert / Ranked Meta Decks (30 cards each)
 */
export const CLASSIC_EXPERT_AI_DECKS: Record<HeroClass, { name: string; cards: string[] }> = {
  MAGE: {
    name: '물종족의 포세이돈 심해 비전덱',
    cards: [
      'NEW1_012', 'NEW1_012',
      'EX1_277', 'EX1_277',
      'CS2_027',
      'CS2_024', 'CS2_024',
      'EX1_608', 'EX1_608',
      'EX1_012',
      'EX1_096', 'EX1_096',
      'CS2_023', 'CS2_023',
      'EX1_294', 'EX1_287',
      'EX1_612', 'EX1_612',
      'CS2_022', 'CS2_022',
      'CS2_029', 'CS2_029',
      'CS2_033', 'CS2_033',
      'EX1_284', 'EX1_284',
      'CS2_028',
      'EX1_559',
      'CS2_032',
      'EX1_298',
    ],
  },
  WARRIOR: {
    name: '불종족의 이그니시우스 홍련 중장덱',
    cards: [
      'EX1_607', 'EX1_607',
      'CS2_108', 'CS2_108',
      'EX1_410', 'EX1_410',
      'EX1_400', 'EX1_400',
      'CS2_106', 'CS2_106',
      'EX1_603', 'EX1_603',
      'EX1_391', 'EX1_391',
      'EX1_402', 'EX1_402',
      'EX1_606', 'EX1_606',
      'EX1_007', 'EX1_007',
      'EX1_604', 'EX1_604',
      'NEW1_011', 'NEW1_011',
      'EX1_407',
      'EX1_016',
      'EX1_110',
      'EX1_411',
      'EX1_414',
      'EX1_298',
    ],
  },
  HUNTER: {
    name: '바람종족의 토람 질풍 추격덱',
    cards: [
      'CS2_084', 'CS2_084',
      'EX1_544',
      'DS1_184', 'DS1_184',
      'DS1_175', 'DS1_175',
      'CS2_172', 'CS2_172',
      'CS2_237', 'CS2_237',
      'EX1_531', 'EX1_531',
      'EX1_610', 'EX1_611',
      'EX1_536',
      'NEW1_031', 'NEW1_031',
      'EX1_539', 'EX1_539',
      'EX1_538', 'EX1_538',
      'EX1_617',
      'DS1_070', 'DS1_070',
      'DS1_178',
      'EX1_116',
      'EX1_534', 'EX1_534',
      'EX1_543',
    ],
  },
  PALADIN: {
    name: '땅종족의 콜로서스 금강 성채덱',
    cards: [
      'EX1_360',
      'EX1_130',
      'EX1_619', 'EX1_619',
      'NEW1_020', 'NEW1_020',
      'EX1_362', 'EX1_362',
      'EX1_382', 'EX1_382',
      'EX1_556', 'EX1_556',
      'CS2_117', 'CS2_117',
      'CS2_097', 'CS2_097',
      'CS2_093', 'CS2_093',
      'CS2_092', 'CS2_092',
      'CS2_094', 'CS2_094',
      'EX1_284', 'EX1_284',
      'EX1_384',
      'EX1_110',
      'CS2_088',
      'EX1_354',
      'EX1_383',
      'EX1_298',
    ],
  },
  PRIEST: {
    name: '인간종족의 카단 설원 수호덱',
    cards: [
      'EX1_621', 'EX1_621',
      'CS2_004', 'CS2_004',
      'CS2_235', 'CS2_235',
      'CS1_130', 'CS1_130',
      'NEW1_020', 'NEW1_020',
      'CS2_234', 'CS2_234',
      'CS2_181', 'CS2_181',
      'EX1_622', 'EX1_622',
      'EX1_339', 'EX1_339',
      'EX1_591', 'EX1_591',
      'CS2_179', 'CS2_179',
      'CS1_112', 'CS1_112',
      'EX1_284',
      'EX1_624', 'EX1_624',
      'EX1_091',
      'EX1_016',
      'CS1_113',
    ],
  },
  ROGUE: {
    name: '언데드종족의 아르투스 암영 연격덱',
    cards: [
      'CS2_072', 'CS2_072',
      'EX1_144',
      'EX1_145', 'EX1_145',
      'CS2_074', 'CS2_074',
      'CS2_073', 'CS2_073',
      'EX1_124', 'EX1_124',
      'EX1_581', 'EX1_581',
      'CS2_233',
      'EX1_278', 'EX1_278',
      'EX1_012',
      'EX1_131', 'EX1_131',
      'EX1_129', 'EX1_129',
      'EX1_134', 'EX1_134',
      'EX1_613',
      'CS2_117',
      'EX1_116',
      'EX1_095', 'EX1_095',
      'EX1_284', 'EX1_284',
    ],
  },
  SHAMAN: {
    name: '엘프종족의 에일라 정령 감응덱',
    cards: [
      'EX1_245', 'EX1_245',
      'CS2_045', 'CS2_045',
      'EX1_238', 'EX1_238',
      'EX1_008', 'EX1_008',
      'EX1_565', 'EX1_565',
      'EX1_247',
      'EX1_259', 'EX1_259',
      'EX1_246', 'EX1_246',
      'EX1_248', 'EX1_248',
      'EX1_258', 'EX1_258',
      'EX1_575',
      'EX1_556', 'EX1_556',
      'EX1_093', 'EX1_093',
      'EX1_284', 'EX1_284',
      'EX1_567',
      'CS2_042', 'CS2_042',
      'NEW1_010',
    ],
  },
  WARLOCK: {
    name: '드워프종족의 아이언포지 용광로 속공덱',
    cards: [
      'EX1_308', 'EX1_308',
      'CS2_065', 'CS2_065',
      'EX1_319', 'EX1_319',
      'CS2_188', 'CS2_188',
      'EX1_008', 'EX1_008',
      'EX1_302', 'EX1_302',
      'EX1_004', 'EX1_004',
      'NEW1_019', 'NEW1_019',
      'EX1_162', 'EX1_162',
      'EX1_019', 'EX1_019',
      'EX1_556', 'EX1_556',
      'EX1_020', 'EX1_020',
      'EX1_046', 'EX1_046',
      'EX1_093', 'EX1_093',
      'EX1_310', 'EX1_310',
    ],
  },
  DRUID: {
    name: '동물종족의 펜릴 고대림 야성덱',
    cards: [
      'EX1_169', 'EX1_169',
      'CS2_013', 'CS2_013',
      'EX1_154', 'EX1_154',
      'CS2_011', 'CS2_011',
      'EX1_556', 'EX1_556',
      'CS2_117',
      'EX1_005',
      'CS2_012', 'CS2_012',
      'EX1_166', 'EX1_166',
      'CS2_182', 'CS2_182',
      'EX1_165', 'EX1_165',
      'EX1_284', 'EX1_284',
      'EX1_571', 'EX1_571',
      'EX1_002',
      'EX1_110',
      'NEW1_008', 'NEW1_008',
      'EX1_298',
      'EX1_573',
    ],
  },
};

export const LADDER_OPPONENT_NAMES: Record<HeroClass, string[]> = {
  MAGE: ['심해 신전 수석술사', '해심의 물결지기', '청해의 현자 님프'],
  WARRIOR: ['화염성채 백인대장', '적염의 투사 벨페고르', '홍련 선봉장 불칸'],
  HUNTER: ['바람섬 풍궁 명사수', '창공 추적자 제피르', '광풍의 정찰병 시로코'],
  PALADIN: ['거암 성채 파수대장', '황토 평원 수호기사', '대지 결계사 골렘'],
  PRIEST: ['아케 성기사단 분대장', '엘윈마을 설원사제', '붉은 유리 궁정 루시안'],
  ROGUE: ['칠흑 성채 암영자객', '망령 회랑 추적자', '심연 그림자 팬텀'],
  SHAMAN: ['고대림 정령 감응사', '은빛 가지 현자 실피', '별빛 숲지기 오베론'],
  WARLOCK: ['딥포지 화로 장인', '강철산맥 룬대장장이', '흑철 용광로 투사'],
  DRUID: ['만년설 야성 수호자', '은빛 송곳니 조련사', '고대림 영수 인도자'],
};

export function buildAiOpponentSetup(
  mode: GameMode,
  preferredOpponentClass?: HeroClass,
): {
  opponentName: string;
  opponentClass: HeroClass;
  opponentDeck: string[];
} {
  if (mode === 'TUTORIAL') {
    const tutClass = preferredOpponentClass || 'ROGUE';
    const preset =
      CLASSIC_PRESET_DECKS.find((d) => d.heroClass === tutClass) || CLASSIC_PRESET_DECKS[0];
    return {
      opponentName: '심연 그림자 아르투스',
      opponentClass: tutClass,
      opponentDeck: [...preset.cards],
    };
  }

  const oppClass =
    preferredOpponentClass ||
    HERO_CLASS_ORDER[Math.floor(Math.random() * HERO_CLASS_ORDER.length)];

  if (mode === 'PRACTICE_NORMAL') {
    const preset =
      CLASSIC_PRESET_DECKS.find((d) => d.heroClass === oppClass) || CLASSIC_PRESET_DECKS[0];
    return {
      opponentName: `AI대전 상대 (${CLASSIC_HEROES[oppClass].classNameKo})`,
      opponentClass: oppClass,
      opponentDeck: [...preset.cards],
    };
  }

  if (mode === 'PRACTICE_EXPERT') {
    const expert = CLASSIC_EXPERT_AI_DECKS[oppClass];
    return {
      opponentName: `숙련 AI 대표 (${CLASSIC_HEROES[oppClass].classNameKo})`,
      opponentClass: oppClass,
      opponentDeck: [...expert.cards],
    };
  }

  // RANKED or CASUAL
  const names = LADDER_OPPONENT_NAMES[oppClass];
  const opponentName = names[Math.floor(Math.random() * names.length)];
  const expert = CLASSIC_EXPERT_AI_DECKS[oppClass];
  return {
    opponentName,
    opponentClass: oppClass,
    opponentDeck: [...expert.cards],
  };
}

function scoreMinion(m: MinionInstance): number {
  const atk = getMinionAttack(m);
  const hp = getMinionHealth(m);
  if (hp <= 0) return 0;
  let score = atk * 3.4 + hp * 2.7 + 2.5;
  if (hasMinionTaunt(m)) score += 3.2;
  if (m.divineShield) score += Math.max(3.5, atk * 0.9 + 2);
  if (m.windfury) score += atk * 1.8;
  if (m.stealth) score += 2.2;
  if (m.poisonous) score += 4.5;
  if (m.spellDamage > 0) score += m.spellDamage * 2.5;
  if (m.frozen) score -= atk * 1.1;
  if (!m.silenced) {
    // High-priority continuous value / legendary threats
    if (
      m.cardId === 'EX1_559' || // 안토니다스
      m.cardId === 'EX1_298' || // 라그나로스
      m.cardId === 'EX1_572' || // 이세라
      m.cardId === 'EX1_095' || // 가젯잔 경매인
      m.cardId === 'CS2_237' || // 굶주린 대머리수리
      m.cardId === 'EX1_565' || // 불꽃의 토템
      m.cardId === 'EX1_575' || // 마나 해일 토템
      m.cardId === 'CS2_235' // 북녘골 성직자
    ) {
      score += 7.5;
    }
    if (
      m.cardId === 'EX1_534' || // 사바나 사자
      m.cardId === 'EX1_110' || // 케른
      m.cardId === 'EX1_383' || // 티리온
      m.cardId === 'EX1_016' // 실바나스
    ) {
      score += 6.0;
    }
  }
  return score;
}

/**
 * Evaluates a BattleMatchState from `actorSide`'s perspective ('OPPONENT' or 'PLAYER' for Auto-Play).
 */
export function evaluateStateForAi(
  s: BattleMatchState,
  actorSide: PlayerSide = 'OPPONENT',
): number {
  const enemySide: PlayerSide = actorSide === 'OPPONENT' ? 'PLAYER' : 'OPPONENT';
  if (s.phase === 'GAME_OVER') {
    if (s.winner === actorSide) return 100000;
    if (s.winner === enemySide) return -100000;
  }
  const me = actorSide === 'OPPONENT' ? s.opponent : s.player;
  const foe = actorSide === 'OPPONENT' ? s.player : s.opponent;

  let score = 0;

  // 1. Hero Health & Armor (non-linear urgency when low!)
  const meEhp = me.health + me.armor;
  const foeEhp = foe.health + foe.armor;
  score += meEhp * 1.85;
  if (me.health <= 10) score -= (11 - me.health) * 4.5;
  score -= foeEhp * 2.35;
  if (foe.health <= 12) score += (13 - foe.health) * 5.0;

  // 2. Board Presence
  for (const m of me.board) {
    score += scoreMinion(m);
  }
  for (const m of foe.board) {
    score -= scoreMinion(m) * 1.18;
  }

  // 3. Hand & Card Advantage + Weapon + Secrets + Max Mana
  score += me.hand.length * 3.1;
  score -= foe.hand.length * 2.2;
  score += me.maxMana * 2.6;
  score -= me.pendingOverload * 1.3;

  if (me.weapon) {
    score += me.weapon.attack * me.weapon.durability * 1.65;
  }
  if (foe.weapon) {
    score -= foe.weapon.attack * foe.weapon.durability * 1.65;
  }

  score += me.secrets.length * 4.5;
  score -= foe.secrets.length * 3.5;

  return score;
}

const ADJACENT_MATTERS_CARDS = new Set([
  'EX1_162', // 광포한 늑대 우두머리
  'EX1_565', // 불꽃의 토템
  'EX1_093', // 아르거스의 수호자
  'EX1_058', // 성난태양 파수병
  'EX1_584', // 고대의 마법사
  'EX1_304', // 공허의 괴물
]);

/**
 * Computes the single best next action for `actorSide` ('OPPONENT' AI or 'PLAYER' Auto-Play).
 * Called repeatedly with animation spacing until it returns `{ kind: 'END_TURN' }`.
 */
export function computeNextAiAction(
  rawState: BattleMatchState,
  difficulty: 'NORMAL' | 'EXPERT' = 'EXPERT',
  actorSide: PlayerSide = 'OPPONENT',
): AiAction {
  if (rawState.phase !== 'PLAYING' || rawState.activeSide !== actorSide) {
    return { kind: 'END_TURN' };
  }

  const enemySide: PlayerSide = actorSide === 'OPPONENT' ? 'PLAYER' : 'OPPONENT';
  const myHeroId = `${actorSide}_HERO`;
  const enemyHeroId = `${enemySide}_HERO`;

  const baseEngine = createEngine(rawState);
  const ai = actorSide === 'OPPONENT' ? rawState.opponent : rawState.player;
  const foe = actorSide === 'OPPONENT' ? rawState.player : rawState.opponent;
  const baselineScore = evaluateStateForAi(rawState, actorSide);

  interface ScoredCandidate {
    action: AiAction;
    score: number;
  }
  const candidates: ScoredCandidate[] = [];

  const hasComboInHand = ai.hand.some((h) => {
    const d = cardDb.mustGetCard(h.cardId);
    return d.mechanics.includes('COMBO') || Boolean(CARD_SCRIPTS[d.id]?.comboTargetKind);
  });

  // 1. Evaluate Playing Cards from Hand
  for (const hc of ai.hand) {
    const check = baseEngine.inspectPlayability(actorSide, hc);
    if (!check.canPlay) continue;
    const def = cardDb.mustGetCard(hc.cardId);
    const spec = CARD_SCRIPTS[def.id];

    if (def.id === 'GAME_005' || def.id === 'EX1_169') {
      const gain = def.id === 'GAME_005' ? 1 : 2;
      const futureMana = Math.min(10, ai.mana + gain);
      const unlocksPlay = ai.hand.some((other) => {
        if (other.uid === hc.uid) return false;
        const c = baseEngine.getEffectiveCardCost(actorSide, other);
        return (c > ai.mana && c <= futureMana) || (hasComboInHand && ai.cardsPlayedThisTurn === 0 && c <= futureMana);
      });
      if (!unlocksPlay) continue;
      candidates.push({
        action: { kind: 'PLAY_CARD', handUid: hc.uid, cardId: def.id },
        score: baselineScore + 5.5,
      });
      continue;
    }

    if (def.id === 'EX1_145') {
      const hasWorthwhileSpell = ai.hand.some((other) => {
        if (other.uid === hc.uid) return false;
        const od = cardDb.mustGetCard(other.cardId);
        return od.type === 'SPELL' && od.cost >= 2;
      });
      if (!hasWorthwhileSpell) continue;
      candidates.push({
        action: { kind: 'PLAY_CARD', handUid: hc.uid, cardId: def.id },
        score: baselineScore + 5.0,
      });
      continue;
    }

    const insertPositions =
      def.type === 'MINION' && ADJACENT_MATTERS_CARDS.has(def.id) && ai.board.length >= 2
        ? [Math.floor(ai.board.length / 2), ai.board.length]
        : [ai.board.length];

    if (check.hasChooseOne && spec?.chooseOne) {
      for (const optIdx of [0, 1] as const) {
        const simPreview = createEngine(rawState);
        simPreview.playCardFromHand(actorSide, hc.uid, { insertIndex: insertPositions[0] });
        const promptOpt = simPreview.state.chooseOnePrompt?.options[optIdx];
        const targets =
          promptOpt && promptOpt.needsTarget ? promptOpt.validTargets : [undefined];

        for (const tid of targets) {
          const sim = createEngine(rawState);
          sim.playCardFromHand(actorSide, hc.uid, {
            chooseOptionIndex: optIdx,
            targetId: tid,
            insertIndex: insertPositions[0],
          });
          const sc = evaluateStateForAi(sim.state, actorSide) + 1.2;
          candidates.push({
            action: {
              kind: 'PLAY_CARD',
              handUid: hc.uid,
              cardId: def.id,
              chooseOptionIndex: optIdx,
              targetId: tid,
              insertIndex: insertPositions[0],
            },
            score: sc,
          });
        }
      }
      continue;
    }

    const targets = check.needsTarget ? check.validTargets : [undefined];
    for (const pos of insertPositions) {
      for (const tid of targets) {
        const sim = createEngine(rawState);
        sim.playCardFromHand(actorSide, hc.uid, {
          targetId: tid,
          insertIndex: pos,
        });
        let sc = evaluateStateForAi(sim.state, actorSide);
        if (def.type === 'MINION') sc += 1.6 + def.cost * 0.35;
        if (def.mechanics.includes('SECRET')) sc += 2.2;
        candidates.push({
          action: {
            kind: 'PLAY_CARD',
            handUid: hc.uid,
            cardId: def.id,
            targetId: tid,
            insertIndex: pos,
          },
          score: sc,
        });
      }
    }
  }

  // 2. Evaluate Hero Power
  const hpCheck = baseEngine.inspectHeroPower(actorSide);
  if (hpCheck.canUse) {
    const hpTargets = hpCheck.needsTarget ? hpCheck.validTargets : [undefined];
    for (const tid of hpTargets) {
      if (ai.heroPowerId === 'HERO_07bp' && (ai.health <= 8 || ai.hand.length >= 9 || ai.deck.length === 0)) {
        continue;
      }
      if (ai.heroPowerId === 'HERO_03bp' && ai.weapon && ai.weapon.attack >= 2) {
        continue;
      }
      const sim = createEngine(rawState);
      sim.useHeroPower(actorSide, tid);
      const sc = evaluateStateForAi(sim.state, actorSide) + 0.8;
      candidates.push({
        action: { kind: 'HERO_POWER', targetId: tid },
        score: sc,
      });
    }
  }

  // 3. Evaluate Attacks (Minions & Hero)
  const foeHasTaunt = foe.board.some((m) => !m.stealth && hasMinionTaunt(m));
  let totalFaceAttack = 0;
  if (!foeHasTaunt) {
    if (baseEngine.canAttackerSwing(actorSide, myHeroId).ok) {
      totalFaceAttack += getHeroAttack(ai, true);
    }
    for (const m of ai.board) {
      if (baseEngine.canAttackerSwing(actorSide, m.uid).ok) {
        const swings = (m.windfury ? 2 : 1) - m.attacksMadeThisTurn;
        totalFaceAttack += getMinionAttack(m) * Math.max(0, swings);
      }
    }
  }
  const hasBoardLethal = !foeHasTaunt && totalFaceAttack >= foe.health + foe.armor;

  const attackerIds = [myHeroId, ...ai.board.map((m) => m.uid)];
  for (const atkId of attackerIds) {
    const validDefs = baseEngine.getValidAttackTargets(actorSide, atkId);
    for (const defId of validDefs) {
      if (hasBoardLethal && defId === enemyHeroId) {
        return { kind: 'ATTACK', attackerId: atkId, defenderId: enemyHeroId };
      }
      if (atkId === myHeroId && defId !== enemyHeroId) {
        const targetM = foe.board.find((pm) => pm.uid === defId);
        if (targetM) {
          const mAtk = getMinionAttack(targetM);
          if (ai.health + ai.armor - mAtk <= 4) continue;
        }
      }
      const sim = createEngine(rawState);
      sim.performAttack(actorSide, atkId, defId);
      let sc = evaluateStateForAi(sim.state, actorSide) + 0.9;
      const simMe = actorSide === 'OPPONENT' ? sim.state.opponent : sim.state.player;
      const simFoe = actorSide === 'OPPONENT' ? sim.state.player : sim.state.opponent;
      if (defId !== enemyHeroId && atkId !== myHeroId) {
        const survived = simMe.board.some((m) => m.uid === atkId && getMinionHealth(m) > 0);
        const killed = !simFoe.board.some((m) => m.uid === defId);
        if (survived && killed) sc += 3.2;
      }
      if (defId !== enemyHeroId) {
        const targetBefore = foe.board.find((pm) => pm.uid === defId);
        const atkMinion = ai.board.find((am) => am.uid === atkId);
        if (targetBefore?.divineShield && atkMinion && getMinionAttack(atkMinion) <= 2) {
          sc += 2.5;
        }
      }
      candidates.push({
        action: { kind: 'ATTACK', attackerId: atkId, defenderId: defId },
        score: sc,
      });
    }
  }

  const positiveMoves = candidates.filter((c) => c.score >= baselineScore - 0.5);
  if (positiveMoves.length === 0) {
    for (const atkId of attackerIds) {
      const validDefs = baseEngine.getValidAttackTargets(actorSide, atkId);
      if (validDefs.includes(enemyHeroId)) {
        return { kind: 'ATTACK', attackerId: atkId, defenderId: enemyHeroId };
      }
    }
    return { kind: 'END_TURN' };
  }

  positiveMoves.sort((a, b) => b.score - a.score);

  if (difficulty === 'NORMAL' && actorSide === 'OPPONENT' && positiveMoves.length >= 2 && Math.random() < 0.25) {
    const second = positiveMoves[1];
    if (second.score >= baselineScore) {
      return second.action;
    }
  }

  const best = positiveMoves[0];
  if (best.action.kind === 'HERO_POWER' && ai.heroPowerId === 'HERO_09bp' && ai.shadowformTier === 0) {
    const hasDamagedFriendly =
      ai.health < ai.maxHealth || ai.board.some((m) => getMinionHealth(m) < getMinionMaxHealth(m));
    const hasAuchenai = ai.board.some((m) => !m.silenced && m.cardId === 'EX1_591');
    if (!hasDamagedFriendly && !hasAuchenai) {
      return { kind: 'END_TURN' };
    }
  }

  return best.action;
}
