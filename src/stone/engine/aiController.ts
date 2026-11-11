import { CLASSIC_PRESET_DECKS, cardDb } from '../cardDb';
import {
  BattleMatchState,
  CLASSIC_HEROES,
  GameMode,
  HERO_CLASS_ORDER,
  HeroClass,
  MinionInstance,
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
    name: '안토니다스 템포 마법사',
    cards: [
      'NEW1_012', 'NEW1_012', // 마나 지룡 x2
      'EX1_277', 'EX1_277', // 신비한 화살 x2
      'CS2_027', // 환영 복제
      'CS2_024', 'CS2_024', // 얼음 화살 x2
      'EX1_608', 'EX1_608', // 마술사의 수습생 x2
      'EX1_012', // 혈법사 탈노스
      'EX1_096', 'EX1_096', // 전리품 수집가 x2
      'CS2_023', 'CS2_023', // 신비한 지능 x2
      'EX1_294', 'EX1_287', // 거울상 + 마법 차단
      'EX1_612', 'EX1_612', // 키린 토 마법사 x2
      'CS2_022', 'CS2_022', // 변이 x2
      'CS2_029', 'CS2_029', // 화염구 x2
      'CS2_033', 'CS2_033', // 물의 정령 x2
      'EX1_284', 'EX1_284', // 하늘빛 비룡 x2
      'CS2_028', // 눈보라
      'EX1_559', // 대마법사 안토니다스
      'CS2_032', // 불기둥
      'EX1_298', // 불의 군주 라그나로스
    ],
  },
  WARRIOR: {
    name: '그롬마쉬 방밀 컨트롤 전사',
    cards: [
      'EX1_607', 'EX1_607', // 내면의 분노 x2
      'CS2_108', 'CS2_108', // 마무리 일격 x2
      'EX1_410', 'EX1_410', // 방패 밀쳐내기 x2
      'EX1_400', 'EX1_400', // 소용돌이 x2
      'CS2_106', 'CS2_106', // 이글거리는 전쟁 도끼 x2
      'EX1_603', 'EX1_603', // 잔인한 감독관 x2
      'EX1_391', 'EX1_391', // 격돌 x2
      'EX1_402', 'EX1_402', // 방어구 제작자 x2
      'EX1_606', 'EX1_606', // 방패 올리기 x2
      'EX1_007', 'EX1_007', // 고통의 수행사제 x2
      'EX1_604', 'EX1_604', // 거품 무는 광전사 x2
      'NEW1_011', 'NEW1_011', // 코르크론 정예병 x2
      'EX1_407', // 난투
      'EX1_016', // 실바나스 윈드러너
      'EX1_110', // 케른 블러드후프
      'EX1_411', // 피의 울음소리
      'EX1_414', // 그롬마쉬 헬스크림
      'EX1_298', // 불의 군주 라그나로스
    ],
  },
  HUNTER: {
    name: '사바나 미드레인지 사냥꾼',
    cards: [
      'CS2_084', 'CS2_084', // 사냥꾼의 징표 x2
      'EX1_544', // 섬광
      'DS1_184', 'DS1_184', // 추적 x2
      'DS1_175', 'DS1_175', // 회갈색 늑대 x2
      'CS2_172', 'CS2_172', // 붉은늪지랩터 x2
      'CS2_237', 'CS2_237', // 굶주린 대머리수리 x2
      'EX1_531', 'EX1_531', // 청소부 하이에나 x2
      'EX1_610', 'EX1_611', // 폭발의 덫 + 빙결의 덫
      'EX1_536', // 독수리뿔 장궁
      'NEW1_031', 'NEW1_031', // 야생의 벗 x2
      'EX1_539', 'EX1_539', // 살상 명령 x2
      'EX1_538', 'EX1_538', // 개들을 풀어라 x2
      'EX1_617', // 치명적인 사격
      'DS1_070', 'DS1_070', // 사냥개조련사 x2
      'DS1_178', // 툰드라 코뿔소
      'EX1_116', // 리로이 젠킨스
      'EX1_534', 'EX1_534', // 사바나 사자 x2
      'EX1_543', // 왕 크루쉬
    ],
  },
  PALADIN: {
    name: '티리온 미드레인지 성기사',
    cards: [
      'EX1_360', // 겸손
      'EX1_130', // 고귀한 희생
      'EX1_619', 'EX1_619', // 평등 x2
      'NEW1_020', 'NEW1_020', // 광기의 화염술사 x2
      'EX1_362', 'EX1_362', // 여명회 파수병 x2
      'EX1_382', 'EX1_382', // 알도르 평화감시단 x2
      'EX1_556', 'EX1_556', // 허수아비골렘 x2
      'CS2_117', 'CS2_117', // 대지 고리회 선견자 x2
      'CS2_097', 'CS2_097', // 용사의 진은검 x2
      'CS2_093', 'CS2_093', // 신성화 x2
      'CS2_092', 'CS2_092', // 왕의 축복 x2
      'CS2_094', 'CS2_094', // 천벌의 망치 x2
      'EX1_284', 'EX1_284', // 하늘빛 비룡 x2
      'EX1_384', // 응징의 격노
      'EX1_110', // 케른 블러드후프
      'CS2_088', // 왕의 수호자
      'EX1_354', // 신의 축복
      'EX1_383', // 티리온 폴드링
      'EX1_298', // 불의 군주 라그나로스
    ],
  },
  PRIEST: {
    name: '아키나이 검귀 컨트롤 사제',
    cards: [
      'EX1_621', 'EX1_621', // 치유의 마법진 x2
      'CS2_004', 'CS2_004', // 신의 권능: 보호막 x2
      'CS2_235', 'CS2_235', // 북녘골 성직자 x2
      'CS1_130', 'CS1_130', // 성스러운 일격 x2
      'NEW1_020', 'NEW1_020', // 광기의 화염술사 x2
      'CS2_234', 'CS2_234', // 어둠의 권능: 고통 x2
      'CS2_181', 'CS2_181', // 부상당한 검귀 x2
      'EX1_622', 'EX1_622', // 어둠의 권능: 죽음 x2
      'EX1_339', 'EX1_339', // 생각 훔치기 x2
      'EX1_591', 'EX1_591', // 아키나이 영혼사제 x2
      'CS2_179', 'CS2_179', // 센진 방패대가 x2
      'CS1_112', 'CS1_112', // 신성한 폭발 x2
      'EX1_284', // 하늘빛 비룡
      'EX1_624', 'EX1_624', // 신성한 불꽃 x2
      'EX1_091', // 비밀결사단 어둠사제
      'EX1_016', // 실바나스 윈드러너
      'CS1_113', // 정신 지배
    ],
  },
  ROGUE: {
    name: '밴클리프 미라클 템포 도적',
    cards: [
      'CS2_072', 'CS2_072', // 기습 x2
      'EX1_144', // 그림자 밟기
      'EX1_145', 'EX1_145', // 마음가짐 x2
      'CS2_074', 'CS2_074', // 맹독 x2
      'CS2_073', 'CS2_073', // 냉혈 x2
      'EX1_124', 'EX1_124', // 절개 x2
      'EX1_581', 'EX1_581', // 혼절시키기 x2
      'CS2_233', // 폭풍의 칼날
      'EX1_278', 'EX1_278', // 독칼 x2
      'EX1_012', // 혈법사 탈노스
      'EX1_131', 'EX1_131', // 데피아즈단 두목 x2
      'EX1_129', 'EX1_129', // 칼날 부채 x2
      'EX1_134', 'EX1_134', // SI:7 요원 x2
      'EX1_613', // 에드윈 밴클리프
      'CS2_117', // 대지 고리회 선견자
      'EX1_116', // 리로이 젠킨스
      'EX1_095', 'EX1_095', // 가젯잔 경매인 x2
      'EX1_284', 'EX1_284', // 하늘빛 비룡 x2
    ],
  },
  SHAMAN: {
    name: '알아키르 정통 미드레인지 주술사',
    cards: [
      'EX1_245', 'EX1_245', // 대지 충격 x2
      'CS2_045', 'CS2_045', // 대지의 무기 x2
      'EX1_238', 'EX1_238', // 번개 화살 x2
      'EX1_008', 'EX1_008', // 은빛십자군 종자 x2
      'EX1_565', 'EX1_565', // 불꽃의 토템 x2
      'EX1_247', // 폭풍으로 벼려낸 도끼
      'EX1_259', 'EX1_259', // 번개 폭풍 x2
      'EX1_246', 'EX1_246', // 사술 x2
      'EX1_248', 'EX1_248', // 야수 정령 x2
      'EX1_258', 'EX1_258', // 속박 풀린 정령 x2
      'EX1_575', // 마나 해일 토템
      'EX1_556', 'EX1_556', // 허수아비골렘 x2
      'EX1_093', 'EX1_093', // 아르거스의 수호자 x2
      'EX1_284', 'EX1_284', // 하늘빛 비룡 x2
      'EX1_567', // 둠해머
      'CS2_042', 'CS2_042', // 불의 정령 x2
      'NEW1_010', // 바람의 군주 알아키르
    ],
  },
  WARLOCK: {
    name: '파멸수호병 클래식 위니 흑마법사',
    cards: [
      'EX1_308', 'EX1_308', // 영혼의 불꽃 x2
      'CS2_065', 'CS2_065', // 공허방랑자 x2
      'EX1_319', 'EX1_319', // 화염 임프 x2
      'CS2_188', 'CS2_188', // 가혹한 하사관 x2
      'EX1_008', 'EX1_008', // 은빛십자군 종자 x2
      'EX1_302', 'EX1_302', // 필멸의 고리 x2
      'EX1_004', 'EX1_004', // 젊은 여사제 x2
      'NEW1_019', 'NEW1_019', // 단검 곡예사 x2
      'EX1_162', 'EX1_162', // 광포한 늑대 우두머리 x2
      'EX1_019', 'EX1_019', // 무너진 태양 성직자 x2
      'EX1_556', 'EX1_556', // 허수아비골렘 x2
      'EX1_020', 'EX1_020', // 붉은십자군 성전사 x2
      'EX1_046', 'EX1_046', // 검은무쇠 드워프 x2
      'EX1_093', 'EX1_093', // 아르거스의 수호자 x2
      'EX1_310', 'EX1_310', // 파멸수호병 x2
    ],
  },
  DRUID: {
    name: '세나리우스 자군야포 드루이드',
    cards: [
      'EX1_169', 'EX1_169', // 정신 자극 x2
      'CS2_013', 'CS2_013', // 급속 성장 x2
      'EX1_154', 'EX1_154', // 천벌 x2
      'CS2_011', 'CS2_011', // 야생의 포효 x2
      'EX1_556', 'EX1_556', // 허수아비골렘 x2
      'CS2_117', // 대지 고리회 선견자
      'EX1_005', // 나 이런 사냥꾼이야
      'CS2_012', 'CS2_012', // 휘둘러치기 x2
      'EX1_166', 'EX1_166', // 숲의 수호자 x2
      'CS2_182', 'CS2_182', // 서리바람 설인 x2
      'EX1_165', 'EX1_165', // 발톱의 드루이드 x2
      'EX1_284', 'EX1_284', // 하늘빛 비룡 x2
      'EX1_571', 'EX1_571', // 자연의 군대 x2
      'EX1_002', // 흑기사
      'EX1_110', // 케른 블러드후프
      'NEW1_008', 'NEW1_008', // 지식의 고대정령 x2
      'EX1_298', // 불의 군주 라그나로스
      'EX1_573', // 세나리우스
    ],
  },
};

export const LADDER_OPPONENT_NAMES: Record<HeroClass, string[]> = {
  MAGE: ['키린 토 수석마법사', '달라란 비전술사', '서리불꽃 연구원'],
  WARRIOR: ['오그리마 백인대장', '검은바위 산 투사', '전쟁노래 선봉장'],
  HUNTER: ['가시덤불 사냥명수', '은빛소나무 추적자', '렉사르의 정찰병'],
  PALADIN: ['은빛손 성전사', '빛의 수호기사', '스톰윈드 성기사'],
  PRIEST: ['대성당 고위사제', '어둠달 예언자', '북녘골 수호사제'],
  ROGUE: ['SI:7 그림자요원', '붉은해적단 자객', '라벤홀트 암살단'],
  SHAMAN: ['대지고리회 주술사', '선더블러프 현자', '폭풍우 소환사'],
  WARLOCK: ['어둠의 의회 흑마술사', '지옥불 소환사', '성난불길 비술사'],
  DRUID: ['세나리온 대드루이드', '달숲의 수호자', '에메랄드 꿈지기'],
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
    const preset = CLASSIC_PRESET_DECKS.find((d) => d.heroClass === 'WARRIOR')!;
    return {
      opponentName: '밀하우스 & 들창코 교관',
      opponentClass: 'WARRIOR',
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
      opponentName: `여관주인 (${CLASSIC_HEROES[oppClass].classNameKo})`,
      opponentClass: oppClass,
      opponentDeck: [...preset.cards],
    };
  }

  if (mode === 'PRACTICE_EXPERT') {
    const expert = CLASSIC_EXPERT_AI_DECKS[oppClass];
    return {
      opponentName: `숙련 여관주인 (${CLASSIC_HEROES[oppClass].classNameKo})`,
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
 * Evaluates a BattleMatchState from OPPONENT's (AI's) perspective.
 */
export function evaluateStateForAi(s: BattleMatchState): number {
  if (s.phase === 'GAME_OVER') {
    if (s.winner === 'OPPONENT') return 100000;
    if (s.winner === 'PLAYER') return -100000;
  }
  const ai = s.opponent;
  const pl = s.player;

  let score = 0;

  // 1. Hero Health & Armor (non-linear urgency when low!)
  const aiEhp = ai.health + ai.armor;
  const plEhp = pl.health + pl.armor;
  score += aiEhp * 1.85;
  if (ai.health <= 10) score -= (11 - ai.health) * 4.5;
  score -= plEhp * 2.35;
  if (pl.health <= 12) score += (13 - pl.health) * 5.0;

  // 2. Board Presence
  for (const m of ai.board) {
    score += scoreMinion(m);
  }
  for (const m of pl.board) {
    score -= scoreMinion(m) * 1.18; // Slightly prioritize clearing player threats!
  }

  // 3. Hand & Card Advantage + Weapon + Secrets + Max Mana
  score += ai.hand.length * 3.1;
  score -= pl.hand.length * 2.2;
  score += ai.maxMana * 2.6;
  score -= ai.pendingOverload * 1.3;

  if (ai.weapon) {
    score += ai.weapon.attack * ai.weapon.durability * 1.65;
  }
  if (pl.weapon) {
    score -= pl.weapon.attack * pl.weapon.durability * 1.65;
  }

  score += ai.secrets.length * 4.5;
  score -= pl.secrets.length * 3.5;

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
 * Computes the single best next action for OPPONENT (`AI`).
 * Called repeatedly with ~650ms animation spacing until it returns `{ kind: 'END_TURN' }`.
 */
export function computeNextAiAction(
  rawState: BattleMatchState,
  difficulty: 'NORMAL' | 'EXPERT' = 'EXPERT',
): AiAction {
  if (rawState.phase !== 'PLAYING' || rawState.activeSide !== 'OPPONENT') {
    return { kind: 'END_TURN' };
  }

  const baseEngine = createEngine(rawState);
  const ai = rawState.opponent;
  const baselineScore = evaluateStateForAi(rawState);

  interface ScoredCandidate {
    action: AiAction;
    score: number;
  }
  const candidates: ScoredCandidate[] = [];

  // Check if holding Coin / Innervate / Preparation: only play mana acceleration if needed for another card or Combo!
  const hasComboInHand = ai.hand.some((h) => {
    const d = cardDb.mustGetCard(h.cardId);
    return d.mechanics.includes('COMBO') || Boolean(CARD_SCRIPTS[d.id]?.comboTargetKind);
  });

  // 1. Evaluate Playing Cards from Hand
  for (const hc of ai.hand) {
    const check = baseEngine.inspectPlayability('OPPONENT', hc);
    if (!check.canPlay) continue;
    const def = cardDb.mustGetCard(hc.cardId);
    const spec = CARD_SCRIPTS[def.id];

    // Guard temporary mana rituals (`GAME_005` 동전, `EX1_169` 정신 자극) so AI doesn't waste them with nothing to spend on!
    if (def.id === 'GAME_005' || def.id === 'EX1_169') {
      const gain = def.id === 'GAME_005' ? 1 : 2;
      const futureMana = Math.min(10, ai.mana + gain);
      const unlocksPlay = ai.hand.some((other) => {
        if (other.uid === hc.uid) return false;
        const c = baseEngine.getEffectiveCardCost('OPPONENT', other);
        return (c > ai.mana && c <= futureMana) || (hasComboInHand && ai.cardsPlayedThisTurn === 0 && c <= futureMana);
      });
      if (!unlocksPlay) continue;
      // Give slight bonus when it unlocks a big play or combo!
      candidates.push({
        action: { kind: 'PLAY_CARD', handUid: hc.uid, cardId: def.id },
        score: baselineScore + 5.5,
      });
      continue;
    }

    if (def.id === 'EX1_145') {
      // 마음가짐 (Preparation): only cast if holding a spell costing >= 2
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

    // Determine board insert indices to test
    const insertPositions =
      def.type === 'MINION' && ADJACENT_MATTERS_CARDS.has(def.id) && ai.board.length >= 2
        ? [Math.floor(ai.board.length / 2), ai.board.length]
        : [ai.board.length];

    if (check.hasChooseOne && spec?.chooseOne) {
      for (const optIdx of [0, 1] as const) {
        const sub = spec.chooseOne[optIdx];
        const simPreview = createEngine(rawState);
        // Trigger prompt to get valid targets for this option
        simPreview.playCardFromHand('OPPONENT', hc.uid, { insertIndex: insertPositions[0] });
        const promptOpt = simPreview.state.chooseOnePrompt?.options[optIdx];
        const targets =
          promptOpt && promptOpt.needsTarget ? promptOpt.validTargets : [undefined];

        for (const tid of targets) {
          const sim = createEngine(rawState);
          sim.playCardFromHand('OPPONENT', hc.uid, {
            chooseOptionIndex: optIdx,
            targetId: tid,
            insertIndex: insertPositions[0],
          });
          const sc = evaluateStateForAi(sim.state) + 1.2; // slight tempo preference for spending mana
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
        sim.playCardFromHand('OPPONENT', hc.uid, {
          targetId: tid,
          insertIndex: pos,
        });
        let sc = evaluateStateForAi(sim.state);
        // Encourage developing minions on curve
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
  const hpCheck = baseEngine.inspectHeroPower('OPPONENT');
  if (hpCheck.canUse) {
    const hpTargets = hpCheck.needsTarget ? hpCheck.validTargets : [undefined];
    for (const tid of hpTargets) {
      // Avoid Warlock Life Tap when low HP or hand >= 9!
      if (ai.heroPowerId === 'HERO_07bp' && (ai.health <= 8 || ai.hand.length >= 9 || ai.deck.length === 0)) {
        continue;
      }
      // Avoid Rogue Dagger Mastery if already holding a weapon with attack >= 2!
      if (ai.heroPowerId === 'HERO_03bp' && ai.weapon && ai.weapon.attack >= 2) {
        continue;
      }
      const sim = createEngine(rawState);
      sim.useHeroPower('OPPONENT', tid);
      const sc = evaluateStateForAi(sim.state) + 0.8;
      candidates.push({
        action: { kind: 'HERO_POWER', targetId: tid },
        score: sc,
      });
    }
  }

  // 3. Evaluate Attacks (Minions & Hero)
  // Calculate if total available board+hero attack can LETHAL the player right now when no Taunt blocks!
  const playerHasTaunt = rawState.player.board.some((m) => !m.stealth && hasMinionTaunt(m));
  let totalFaceAttack = 0;
  if (!playerHasTaunt) {
    if (baseEngine.canAttackerSwing('OPPONENT', 'OPPONENT_HERO').ok) {
      totalFaceAttack += getHeroAttack(ai, true);
    }
    for (const m of ai.board) {
      if (baseEngine.canAttackerSwing('OPPONENT', m.uid).ok) {
        const swings = (m.windfury ? 2 : 1) - m.attacksMadeThisTurn;
        totalFaceAttack += getMinionAttack(m) * Math.max(0, swings);
      }
    }
  }
  const hasBoardLethal = !playerHasTaunt && totalFaceAttack >= rawState.player.health + rawState.player.armor;

  const attackerIds = ['OPPONENT_HERO', ...ai.board.map((m) => m.uid)];
  for (const atkId of attackerIds) {
    const validDefs = baseEngine.getValidAttackTargets('OPPONENT', atkId);
    for (const defId of validDefs) {
      if (hasBoardLethal && defId === 'PLAYER_HERO') {
        return { kind: 'ATTACK', attackerId: atkId, defenderId: 'PLAYER_HERO' };
      }
      // Prevent AI Hero from suiciding or taking >= 6 face damage into a giant minion when low HP
      if (atkId === 'OPPONENT_HERO' && defId !== 'PLAYER_HERO') {
        const targetM = rawState.player.board.find((pm) => pm.uid === defId);
        if (targetM) {
          const mAtk = getMinionAttack(targetM);
          if (ai.health + ai.armor - mAtk <= 4) continue;
        }
      }
      const sim = createEngine(rawState);
      sim.performAttack('OPPONENT', atkId, defId);
      let sc = evaluateStateForAi(sim.state) + 0.9;
      // Bonus for clean value trades (enemy minion dies while AI minion survives!)
      if (defId !== 'PLAYER_HERO' && atkId !== 'OPPONENT_HERO') {
        const survived = sim.state.opponent.board.some((m) => m.uid === atkId && getMinionHealth(m) > 0);
        const killed = !sim.state.player.board.some((m) => m.uid === defId);
        if (survived && killed) sc += 3.2;
      }
      // Bonus for popping enemy Divine Shield with a 1-attack minion!
      if (defId !== 'PLAYER_HERO') {
        const targetBefore = rawState.player.board.find((pm) => pm.uid === defId);
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

  // Filter out strictly self-harming moves (e.g., Fireballing own face or Silencing own buffed minion!)
  const positiveMoves = candidates.filter((c) => c.score >= baselineScore - 0.5);
  if (positiveMoves.length === 0) {
    // Check if there are still unattacked minions that can hit PLAYER_HERO for free damage!
    for (const atkId of attackerIds) {
      const validDefs = baseEngine.getValidAttackTargets('OPPONENT', atkId);
      if (validDefs.includes('PLAYER_HERO')) {
        return { kind: 'ATTACK', attackerId: atkId, defenderId: 'PLAYER_HERO' };
      }
    }
    return { kind: 'END_TURN' };
  }

  positiveMoves.sort((a, b) => b.score - a.score);

  if (difficulty === 'NORMAL' && positiveMoves.length >= 2 && Math.random() < 0.25) {
    // Normal Innkeeper occasionally picks the 2nd-best move for forgiving beginner pacing
    const second = positiveMoves[1];
    if (second.score >= baselineScore) {
      return second.action;
    }
  }

  // Ensure healing Hero Power isn't used on full-HP targets with zero benefit
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
