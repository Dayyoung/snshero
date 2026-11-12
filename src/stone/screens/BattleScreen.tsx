import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hsAudio } from '../audio';
import {
  CLASSIC_RANK_NAMES,
  CLASS_CREST_URL,
  cardDb,
  getCardArtUrl,
  getCardTileUrl,
  getHeroArtUrl,
} from '../cardDb';
import {
  BoardMinionToken,
  HearthstoneCard,
  HeroPortraitZone,
  HsGoldCoinIcon,
  HsManaGem,
} from '../components/CardVisual';
import { CardZoomAction, CardZoomModal } from '../components/CardZoomModal';
import { AiAction, buildAiOpponentSetup, computeNextAiAction } from '../engine/aiController';
import {
  createBattleMatch,
  createEngine,
  getHeroAttack,
  getMinionAttack,
  getMinionHealth,
  getMinionMaxHealth,
  hasMinionTaunt,
} from '../engine/GameEngine';
import { hsStorage } from '../storage';
import {
  ActionHistoryItem,
  BattleMatchState,
  BoardThemeId,
  CLASSIC_HEROES,
  CustomDeck,
  GameMode,
  HeroClass,
  MinionInstance,
} from '../types';
import { BoardVfxCanvas, recordEntityStagePosition } from '../vfx/BoardVfxCanvas';
import { CardRarity } from '../types';

interface PhysicalAttackAnimState {
  id: number;
  side: 'PLAYER' | 'OPPONENT';
  attackerId: string;
  defenderId: string;
  isHeroAttacker: boolean;
  artUrl: string;
  nameKo: string;
  attackVal: number;
  healthVal: number;
  armorVal: number;
  taunt: boolean;
  divineShield: boolean;
  rarity?: CardRarity;
  frameGradient: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  defenderDamage: number;
  attackerCounterDamage: number;
  attackerWillDie: boolean;
  phase: 'WINDUP' | 'LUNGE' | 'IMPACT_RETURN';
}

export interface BattleScreenProps {
  mode: GameMode;
  playerDeck: CustomDeck;
  preferredOpponentClass?: HeroClass;
  preferredBoardTheme?: BoardThemeId;
  onOpenOptions: (concedeHandler: () => void) => void;
  onExitBattle: () => void;
}

type PendingSelection =
  | {
      kind: 'HAND_CARD';
      handUid: string;
      cardId: string;
      needsTarget: boolean;
      validTargets: string[];
      isMinion: boolean;
      hasChooseOne: boolean;
    }
  | {
      kind: 'CHOOSE_OPTION_TARGET';
      handUid: string;
      cardId: string;
      optionIndex: 0 | 1;
      insertIndex: number;
      validTargets: string[];
    }
  | {
      kind: 'HERO_POWER';
      validTargets: string[];
    }
  | {
      kind: 'ATTACKER';
      attackerId: string;
      validTargets: string[];
    };

type BattleZoomState =
  | { kind: 'HAND_CARD'; handUid: string }
  | { kind: 'MULLIGAN_CARD'; handUid: string }
  | { kind: 'CHOOSE_ONE_CARD'; optionIndex: 0 | 1 }
  | { kind: 'TRACKING_CARD'; cardId: string }
  | { kind: 'BOARD_MINION'; minion: MinionInstance; isFriendly: boolean }
  | { kind: 'HISTORY_ITEM'; item: ActionHistoryItem };

const BOARD_BG_URL: Record<BoardThemeId, string> = {
  STORMWIND: '/stone-assets/ui/board_stormwind.webp',
  ORGRIMMAR: '/stone-assets/ui/board_orgrimmar.webp',
  PANDARIA: '/stone-assets/ui/board_pandaria.webp',
};

const BOARD_CORNER_TOYS: Record<
  BoardThemeId,
  { pos: 'TL' | 'TR' | 'BL' | 'BR'; icon: string; name: string; reaction: string }[]
> = {
  STORMWIND: [
    { pos: 'TL', icon: '🔔', name: '대성당 종탑', reaction: '땡~ 땡~! 스톰윈드 대성당 종이 울려 퍼집니다!' },
    { pos: 'TR', icon: '🦅', name: '그리폰 둥지', reaction: '끼룩! 그리폰이 마우스 커서를 날카롭게 쪼았습니다!' },
    { pos: 'BL', icon: '⚒', name: '드워프 대장간', reaction: '깡! 깡! 달궈진 모루에서 불꽃이 튱니다!' },
    { pos: 'BR', icon: '🪣', name: '마을 우물', reaction: '첨벙! 우물 속에서 황금 동전이 반짝입니다!' },
  ],
  ORGRIMMAR: [
    { pos: 'TL', icon: '🪨', name: '공성 투석기', reaction: '부우웅— 쾅!! 투석기 바위가 성벽 너머로 날아갑니다!' },
    { pos: 'TR', icon: '🛸', name: '고블린 비행선', reaction: '뿌우우—! 제플린 비행선 경적이 울립니다!' },
    { pos: 'BL', icon: '🔥', name: '전쟁 용광로', reaction: '화르륵! 용광로 불길이 거세게 타오릅니다!' },
    { pos: 'BR', icon: '🥁', name: '전쟁 북', reaction: '둥! 둥! 록타르 오가르 전쟁 북소리가 울립니다!' },
  ],
  PANDARIA: [
    { pos: 'TL', icon: '🛎', name: '옥룡사 징', reaction: '징~~~! 고요한 판다리아 계곡에 울림이 퍼집니다!' },
    { pos: 'TR', icon: '🌊', name: '비취 물레방아', reaction: '쏴아아~ 맑은 폭포수가 시원하게 흘러내립니다!' },
    { pos: 'BL', icon: '🥕', name: '농장 순무 밭', reaction: '쑥! 탐스러운 판다리아 황금 순무가 뽑혔습니다!' },
    { pos: 'BR', icon: '🪁', name: '바람 연', reaction: '펄럭~ 연이 구름 위로 높이 날아오릅니다!' },
  ],
};

const CARD_BACK_MAP: Record<string, string> = {
  classic: '/stone-assets/ui/cardback_classic.webp',
  legend: '/stone-assets/ui/cardback_legend.webp',
  frost: '/stone-assets/ui/cardback_frost.webp',
  gold: '/stone-assets/ui/cardback_gold.webp',
};

export const BattleScreen: React.FC<BattleScreenProps> = ({
  mode,
  playerDeck,
  preferredOpponentClass,
  preferredBoardTheme,
  onOpenOptions,
  onExitBattle,
}) => {
  const [matchState, setMatchState] = useState<BattleMatchState>(() => {
    const opp = buildAiOpponentSetup(mode, preferredOpponentClass);
    return createBattleMatch({
      mode,
      playerName: '여관 도전자',
      playerClass: playerDeck.heroClass,
      playerDeck: playerDeck.cards,
      opponentName: opp.opponentName,
      opponentClass: opp.opponentClass,
      opponentDeck: opp.opponentDeck,
      boardTheme: preferredBoardTheme,
    });
  });

  const [vsIntroActive, setVsIntroActive] = useState(true);
  const [selection, setSelection] = useState<PendingSelection | null>(null);
  const [zoomState, setZoomState] = useState<BattleZoomState | null>(null);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [isCompactMobile, setIsCompactMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640,
  );
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [insertPreviewIdx, setInsertPreviewIdx] = useState<number>(0);

  const [hoveredBoardMinion, setHoveredBoardMinion] = useState<MinionInstance | null>(null);
  const [hoveredHistoryItem, setHoveredHistoryItem] = useState<ActionHistoryItem | null>(null);
  const [emoteMenuOpen, setEmoteMenuOpen] = useState(false);
  const [playerEmoteText, setPlayerEmoteText] = useState<string | null>(null);
  const [opponentEmoteText, setOpponentEmoteText] = useState<string | null>(null);
  const [toyToast, setToyToast] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [shakeState, setShakeState] = useState<{
    active: boolean;
    seq: number;
    damage: number;
    ampX: number;
    ampY: number;
    rotDeg: number;
    durationMs: number;
  }>({
    active: false,
    seq: 0,
    damage: 0,
    ampX: 0,
    ampY: 0,
    rotDeg: 0,
    durationMs: 220,
  });
  const [attackAnim, setAttackAnim] = useState<PhysicalAttackAnimState | null>(null);
  const [aiHighlightText, setAiHighlightText] = useState<string | null>(null);
  const [outcomeSummary, setOutcomeSummary] = useState<{
    goldEarned: number;
    prevRank: number;
    newRank: number;
    newStars: number;
    streakBonus: boolean;
  } | null>(null);

  const friendlyRowRef = useRef<HTMLDivElement | null>(null);
  const recordedResultRef = useRef(false);
  const matchStateRef = useRef(matchState);
  matchStateRef.current = matchState;
  const shakeTimerRef = useRef<number | null>(null);
  const activeShakeRef = useRef<{ until: number; strength: number }>({ until: 0, strength: 0 });
  const attackLockRef = useRef(false);
  const attackSeqRef = useRef(0);
  const attackTimersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
      attackTimersRef.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const liveHoveredBoardMinion = useMemo(() => {
    if (!hoveredBoardMinion || matchState.phase !== 'PLAYING') return null;
    return (
      matchState.player.board.find((m) => m.uid === hoveredBoardMinion.uid) ||
      matchState.opponent.board.find((m) => m.uid === hoveredBoardMinion.uid) ||
      null
    );
  }, [hoveredBoardMinion, matchState.phase, matchState.player.board, matchState.opponent.board]);

  useEffect(() => {
    if (hoveredBoardMinion && !liveHoveredBoardMinion) {
      setHoveredBoardMinion(null);
    }
  }, [hoveredBoardMinion, liveHoveredBoardMinion]);

  useEffect(() => {
    if (matchState.phase === 'GAME_OVER' && autoPlay) {
      setAutoPlay(false);
    }
  }, [matchState.phase, autoPlay]);
  const profile = useMemo(() => hsStorage.getProfile(), []);
  const backImg = CARD_BACK_MAP[profile.selectedCardBack] || CARD_BACK_MAP.classic;

  const engine = useMemo(() => createEngine(matchState), [matchState]);
  const playerSpellPower = engine.getTotalSpellPower('PLAYER');
  const playerVelenMult = matchState.player.board.some(
    (m) => !m.silenced && m.cardId === 'EX1_350',
  )
    ? 2
    : 1;

  // Opening VS Clash + Korean Matchup Announcer
  useEffect(() => {
    hsAudio.playBgm('mulligan');
    hsAudio.playMatchupAnnouncement(matchState.player.heroClass, matchState.opponent.heroClass);
    const t1 = window.setTimeout(() => {
      setVsIntroActive(false);
      hsAudio.playHeroVo(matchState.opponent.heroClass, 'start');
    }, 2450);
    return () => clearTimeout(t1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear banner / error messages smoothly
  useEffect(() => {
    if (!matchState.bannerMessage) return;
    if (matchState.bannerMessage === '내 턴!') {
      hsAudio.playSfx('player_turn', 0.85);
      hsAudio.playProceduralVfxSound('MANA_GAIN');
    }
    const t = window.setTimeout(() => {
      setMatchState((s) => ({ ...s, bannerMessage: null }));
    }, 1450);
    return () => clearTimeout(t);
  }, [matchState.bannerMessage, matchState.turnNumber]);

  useEffect(() => {
    if (!matchState.errorBanner) return;
    const t = window.setTimeout(() => {
      setMatchState((s) => ({ ...s, errorBanner: null }));
    }, 2100);
    return () => clearTimeout(t);
  }, [matchState.errorBanner]);

  useEffect(() => {
    const onResize = () => setIsCompactMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Record match outcome & rewards once when GAME_OVER triggers
  useEffect(() => {
    if (matchState.phase === 'GAME_OVER' && !recordedResultRef.current) {
      recordedResultRef.current = true;
      setSelection(null);
      setZoomState(null);
      const didWin = matchState.winner === 'PLAYER';
      if (didWin) {
        hsAudio.playHeroVo(matchState.opponent.heroClass, 'concede');
      } else {
        hsAudio.playHeroVo(matchState.player.heroClass, 'concede');
      }
      const summary = hsStorage.recordMatchOutcome(
        matchState.player.heroClass,
        didWin,
        mode === 'RANKED',
      );
      setOutcomeSummary(summary);
    }
  }, [matchState.phase, matchState.winner, matchState.player.heroClass, matchState.opponent.heroClass, mode]);

  // 75-second Turn Timer + 15-second Burning Rope Fuse!
  useEffect(() => {
    if (matchState.phase !== 'PLAYING' || matchState.activeSide !== 'PLAYER') return;
    const iv = window.setInterval(() => {
      setMatchState((prev) => {
        if (prev.phase !== 'PLAYING' || prev.activeSide !== 'PLAYER') return prev;
        const nextSec = prev.turnSecondsLeft - 1;
        if (nextSec === 15) {
          hsAudio.playHeroVo(prev.player.heroClass, 'time');
        }
        if (nextSec <= 15 && nextSec > 0) {
          hsAudio.playProceduralVfxSound('ROPE_TICK');
        }
        if (nextSec <= 0) {
          setSelection(null);
          const nextEng = createEngine(prev);
          hsAudio.playSfx('end_turn');
          return nextEng.endTurn();
        }
        return { ...prev, turnSecondsLeft: nextSec };
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [matchState.phase, matchState.activeSide, matchState.turnNumber]);

  const triggerDamageImpact = useCallback(
    (rawDamage: number, opts?: { isFinisher?: boolean }) => {
      const dmg = Math.max(1, Math.round(rawDamage || 1));
      const isFinisher = Boolean(opts?.isFinisher);
      const strength = isFinisher ? 120 : dmg;
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now < activeShakeRef.current.until && strength < activeShakeRef.current.strength) {
        return;
      }

      let ampX: number;
      const rotDeg = 0; // GPU 60fps pure translate3d without rasterization blur
      let durationMs: number;

      if (isFinisher) {
        ampX = 12;
        durationMs = 360;
      } else if (dmg <= 2) {
        ampX = Number((1.2 + dmg * 0.5).toFixed(2));
        durationMs = 180;
      } else if (dmg <= 4) {
        ampX = Number((1.8 + dmg * 0.6).toFixed(2));
        durationMs = 210;
      } else if (dmg <= 7) {
        ampX = Number((2.6 + dmg * 0.6).toFixed(2));
        durationMs = 250;
      } else if (dmg <= 11) {
        ampX = Number((3.6 + Math.min(11, dmg) * 0.55).toFixed(2));
        durationMs = 290;
      } else {
        ampX = Number(Math.min(10.8, 7.2 + (dmg - 12) * 0.2).toFixed(2));
        durationMs = 310;
      }

      const ampY = Number((ampX * 0.68).toFixed(2));
      activeShakeRef.current = { until: now + durationMs * 0.85, strength };

      setShakeState((prev) => ({
        active: true,
        seq: prev.seq + 1,
        damage: dmg,
        ampX,
        ampY,
        rotDeg,
        durationMs,
      }));

      if (shakeTimerRef.current !== null) {
        window.clearTimeout(shakeTimerRef.current);
      }
      shakeTimerRef.current = window.setTimeout(() => {
        setShakeState((prev) => ({ ...prev, active: false }));
      }, durationMs + 25);
    },
    [],
  );

  const triggerPhysicalAttack = useCallback(
    (side: 'PLAYER' | 'OPPONENT', attackerId: string, defenderId: string) => {
      if (attackLockRef.current) return;
      const current = matchStateRef.current;
      if (current.phase !== 'PLAYING') return;

      const atkPlayer = side === 'PLAYER' ? current.player : current.opponent;
      const enemySide = side === 'PLAYER' ? 'OPPONENT' : 'PLAYER';
      const defPlayer = enemySide === 'PLAYER' ? current.player : current.opponent;

      const isHeroAttacker = attackerId === 'PLAYER_HERO' || attackerId === 'OPPONENT_HERO';
      const isHeroDefender = defenderId === 'PLAYER_HERO' || defenderId === 'OPPONENT_HERO';

      const atkMinion = isHeroAttacker
        ? null
        : atkPlayer.board.find((m) => m.uid === attackerId) || null;
      if (!isHeroAttacker && !atkMinion) return;

      const defMinion = isHeroDefender
        ? null
        : defPlayer.board.find((m) => m.uid === defenderId) || null;
      if (!isHeroDefender && !defMinion) return;

      const w = window.innerWidth || 1280;
      const h = window.innerHeight || 720;
      const atkEl = document.querySelector(`[data-hs-entity="${attackerId}"]`);
      const defEl = document.querySelector(`[data-hs-entity="${defenderId}"]`);

      const startPos = atkEl
        ? (() => {
            const r = atkEl.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          })()
        : {
            x: w * 0.5,
            y: side === 'PLAYER' ? h * 0.62 : h * 0.34,
          };
      const targetPos = defEl
        ? (() => {
            const r = defEl.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          })()
        : {
            x: w * 0.5,
            y: enemySide === 'PLAYER' ? h * 0.77 : h * 0.17,
          };

      recordEntityStagePosition(attackerId, startPos);
      recordEntityStagePosition(defenderId, targetPos);

      const attackVal = isHeroAttacker
        ? getHeroAttack(atkPlayer, true)
        : getMinionAttack(atkMinion!);
      const healthVal = isHeroAttacker ? atkPlayer.health : getMinionHealth(atkMinion!);
      const armorVal = isHeroAttacker ? atkPlayer.armor : 0;
      const counterDmg = isHeroDefender ? 0 : getMinionAttack(defMinion!);
      const attackerWillDie =
        !isHeroAttacker && !atkMinion!.divineShield && counterDmg >= healthVal;

      const minionDef = atkMinion ? cardDb.mustGetCard(atkMinion.cardId) : null;
      const artUrl = isHeroAttacker
        ? getHeroArtUrl(atkPlayer.isJaraxxus ? 'EX1_323h' : atkPlayer.heroId)
        : getCardArtUrl(minionDef!.artId);
      const nameKo = isHeroAttacker ? atkPlayer.heroNameKo : atkMinion!.name;
      const defNameKo = isHeroDefender ? defPlayer.heroNameKo : defMinion!.name;
      const frameGradient = CLASSIC_HEROES[atkPlayer.heroClass].frameGradient;

      attackLockRef.current = true;
      attackSeqRef.current += 1;
      const animId = attackSeqRef.current;

      hsAudio.playSfx('whoosh', 0.85);
      setAiHighlightText(
        `${side === 'PLAYER' ? '⚔ 아군 타격' : '💥 적군 타격'}: [${nameKo}](${attackVal}) ➔ [${defNameKo}]!`,
      );

      setAttackAnim({
        id: animId,
        side,
        attackerId,
        defenderId,
        isHeroAttacker,
        artUrl,
        nameKo,
        attackVal,
        healthVal,
        armorVal,
        taunt: atkMinion ? hasMinionTaunt(atkMinion) : false,
        divineShield: atkMinion ? atkMinion.divineShield : false,
        rarity: minionDef?.rarity,
        frameGradient,
        startX: startPos.x,
        startY: startPos.y,
        targetX: targetPos.x,
        targetY: targetPos.y,
        defenderDamage: attackVal,
        attackerCounterDamage: counterDmg,
        attackerWillDie,
        phase: 'WINDUP',
      });

      const tLunge = window.setTimeout(() => {
        setAttackAnim((prev) =>
          prev && prev.id === animId ? { ...prev, phase: 'LUNGE' } : prev,
        );
      }, 115);

      const tImpact = window.setTimeout(() => {
        const exchangedDamage = Math.max(1, attackVal + counterDmg);
        hsAudio.vibrateByDamage(exchangedDamage);
        const latest = matchStateRef.current;
        if (latest.phase === 'PLAYING') {
          const sim = createEngine(latest);
          const next = sim.performAttack(side, attackerId, defenderId);
          setMatchState(next);
        }
        hsAudio.playSfx(
          exchangedDamage >= 7 || attackVal >= 5 ? 'big_attack' : 'attack',
          Math.min(1, 0.72 + Math.min(12, exchangedDamage) * 0.024),
        );
        triggerDamageImpact(exchangedDamage);
        setAttackAnim((prev) =>
          prev && prev.id === animId ? { ...prev, phase: 'IMPACT_RETURN' } : prev,
        );
      }, 270);

      const tDone = window.setTimeout(() => {
        setAttackAnim((prev) => (prev && prev.id === animId ? null : prev));
        attackLockRef.current = false;
      }, 500);

      attackTimersRef.current = [
        ...attackTimersRef.current.slice(-12),
        tLunge,
        tImpact,
        tDone,
      ];
    },
    [triggerDamageImpact],
  );

  // Step-by-Step AI Turn Execution Loop
  useEffect(() => {
    if (matchState.phase !== 'PLAYING' || matchState.activeSide !== 'OPPONENT') {
      setAiHighlightText(null);
      return;
    }

    const difficulty = mode === 'PRACTICE_NORMAL' || mode === 'TUTORIAL' ? 'NORMAL' : 'EXPERT';
    const timer = window.setTimeout(() => {
      const action: AiAction = computeNextAiAction(matchState, difficulty);
      const sim = createEngine(matchState);

      if (action.kind === 'PLAY_CARD') {
        const def = cardDb.mustGetCard(action.cardId);
        hsAudio.playSfx('card_place', 0.85);
        setAiHighlightText(`${matchState.opponent.heroNameKo}: [${def.name}] 사용!`);
        setMatchState(
          sim.playCardFromHand('OPPONENT', action.handUid, {
            targetId: action.targetId,
            insertIndex: action.insertIndex,
            chooseOptionIndex: action.chooseOptionIndex,
          }),
        );
      } else if (action.kind === 'HERO_POWER') {
        hsAudio.playSfx('hero_power', 0.85);
        setAiHighlightText(
          `${matchState.opponent.heroNameKo}: 영웅 능력 [${matchState.opponent.heroPowerNameKo}]!`,
        );
        setMatchState(sim.useHeroPower('OPPONENT', action.targetId));
      } else if (action.kind === 'ATTACK') {
        triggerPhysicalAttack('OPPONENT', action.attackerId, action.defenderId);
      } else {
        hsAudio.playSfx('end_turn', 0.85);
        setAiHighlightText(null);
        setMatchState(sim.endTurn());
      }
    }, 760);

    return () => clearTimeout(timer);
  }, [matchState, mode, triggerPhysicalAttack]);

  // Step-by-Step Player Auto-Play Loop (when autoPlay === true)
  useEffect(() => {
    if (!autoPlay || vsIntroActive) return;
    if (matchState.phase === 'MULLIGAN') {
      const t = window.setTimeout(() => {
        const sim = createEngine(matchState);
        setMatchState(sim.confirmMulligan(new Set()));
      }, 420);
      return () => clearTimeout(t);
    }
    if (matchState.phase !== 'PLAYING' || matchState.activeSide !== 'PLAYER') return;
    if (attackLockRef.current) return;

    const timer = window.setTimeout(() => {
      const simStateForPlayer = {
        ...matchState,
        activeSide: 'OPPONENT' as const,
        player: matchState.opponent,
        opponent: matchState.player,
      };
      const action: AiAction = computeNextAiAction(simStateForPlayer, 'EXPERT');
      const sim = createEngine(matchState);

      const mapTarget = (tid?: string) => {
        if (!tid) return undefined;
        if (tid === 'OPPONENT_HERO') return 'PLAYER_HERO';
        if (tid === 'PLAYER_HERO') return 'OPPONENT_HERO';
        return tid;
      };

      if (action.kind === 'PLAY_CARD') {
        const def = cardDb.mustGetCard(action.cardId);
        hsAudio.playSfx('card_place', 0.85);
        setAiHighlightText(`자동플레이: [${def.name}] 사용!`);
        setMatchState(
          sim.playCardFromHand('PLAYER', action.handUid, {
            targetId: mapTarget(action.targetId),
            insertIndex: action.insertIndex,
            chooseOptionIndex: action.chooseOptionIndex,
          }),
        );
      } else if (action.kind === 'HERO_POWER') {
        hsAudio.playSfx('hero_power', 0.85);
        setAiHighlightText(`자동플레이: 영웅 능력 [${matchState.player.heroPowerNameKo}]!`);
        setMatchState(sim.useHeroPower('PLAYER', mapTarget(action.targetId)));
      } else if (action.kind === 'ATTACK') {
        const mappedAtk =
          action.attackerId === 'OPPONENT_HERO' ? 'PLAYER_HERO' : action.attackerId;
        const mappedDef = mapTarget(action.defenderId) || 'OPPONENT_HERO';
        triggerPhysicalAttack('PLAYER', mappedAtk, mappedDef);
      } else {
        hsAudio.playSfx('end_turn', 0.85);
        setAiHighlightText(null);
        setMatchState(sim.endTurn());
      }
    }, 640);

    return () => clearTimeout(timer);
  }, [autoPlay, vsIntroActive, matchState, triggerPhysicalAttack]);

  // Pointer Move & Right-Click / Escape Cancel
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      setPointerPos({ x: e.clientX, y: e.clientY });
      if (friendlyRowRef.current) {
        const children = Array.from(
          friendlyRowRef.current.querySelectorAll('[data-hs-entity]'),
        ) as HTMLElement[];
        let idx = children.length;
        for (let i = 0; i < children.length; i++) {
          const rect = children[i].getBoundingClientRect();
          if (e.clientX < rect.left + rect.width / 2) {
            idx = i;
            break;
          }
        }
        setInsertPreviewIdx(idx);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelection(null);
        setEmoteMenuOpen(false);
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleConcede = useCallback(() => {
    if (matchState.phase === 'GAME_OVER') return;
    const eng = createEngine(matchState);
    setMatchState(eng.concede('PLAYER'));
  }, [matchState]);

  // Toggle Mulligan Card Selection
  const toggleMulliganCard = (uid: string) => {
    hsAudio.playSfx('card_flip', 0.7);
    setMatchState((prev) => {
      const exists = prev.mulliganSelectedUids.includes(uid);
      return {
        ...prev,
        mulliganSelectedUids: exists
          ? prev.mulliganSelectedUids.filter((x) => x !== uid)
          : [...prev.mulliganSelectedUids, uid],
      };
    });
  };

  const confirmMulliganNow = () => {
    hsAudio.playSfx('box_press');
    hsAudio.playBgm(Math.random() < 0.5 ? 'duel_1' : 'duel_2');
    if (matchState.firstPlayer === 'OPPONENT') {
      hsAudio.playInnkeeper('coin');
    }
    const eng = createEngine(matchState);
    setMatchState(eng.confirmMulligan(matchState.mulliganSelectedUids));
  };

  // Play an untargeted or targeted card
  const executePlayPlayerCard = (
    handUid: string,
    opts?: { targetId?: string; insertIndex?: number; chooseOptionIndex?: 0 | 1 },
  ) => {
    const hc = matchState.player.hand.find((h) => h.uid === handUid);
    if (!hc) return;
    const def = cardDb.mustGetCard(hc.cardId);
    hsAudio.playSfx('card_place', 0.9);
    const eng = createEngine(matchState);
    const next = eng.playCardFromHand('PLAYER', handUid, opts);
    // Quest tracking!
    if (next.chooseOnePrompt === null) {
      if (def.type === 'MINION') hsStorage.recordQuestProgress('MINION', 1);
      else if (def.type === 'SPELL') hsStorage.recordQuestProgress('SPELL', 1);
    }
    setSelection(null);
    setMatchState(next);
  };

  // Click a card in Player's Hand -> Select & Enlarge Card first (never play immediately!)
  const handleHandCardClick = (handUid: string) => {
    if (matchState.phase !== 'PLAYING') return;
    const hc = matchState.player.hand.find((h) => h.uid === handUid);
    if (!hc) return;

    hsAudio.playSfx('card_hover', 0.7);
    setSelection(null);
    setZoomState({ kind: 'HAND_CARD', handUid });
  };

  // Resolve clicking a target entity (`PLAYER_HERO`, `OPPONENT_HERO`, or minion `uid`)
  const handleEntityClick = (entityId: string, isFriendlyMinionOrHero: boolean) => {
    if (matchState.phase !== 'PLAYING') return;

    // 1. Complete active targeting selection!
    if (selection && matchState.activeSide === 'PLAYER') {
      if (selection.kind === 'HAND_CARD' && selection.needsTarget) {
        if (selection.validTargets.includes(entityId)) {
          executePlayPlayerCard(selection.handUid, {
            targetId: entityId,
            insertIndex: matchState.player.board.length,
          });
        } else {
          setMatchState((s) => ({ ...s, errorBanner: '올바른 대상이 아닙니다!' }));
        }
        return;
      }

      if (selection.kind === 'CHOOSE_OPTION_TARGET') {
        if (selection.validTargets.includes(entityId)) {
          executePlayPlayerCard(selection.handUid, {
            chooseOptionIndex: selection.optionIndex,
            insertIndex: selection.insertIndex,
            targetId: entityId,
          });
        } else {
          setMatchState((s) => ({ ...s, errorBanner: '올바른 대상이 아닙니다!' }));
        }
        return;
      }

      if (selection.kind === 'HERO_POWER') {
        if (selection.validTargets.includes(entityId)) {
          hsAudio.playSfx('hero_power', 0.9);
          const eng = createEngine(matchState);
          setSelection(null);
          setMatchState(eng.useHeroPower('PLAYER', entityId));
        } else {
          setMatchState((s) => ({ ...s, errorBanner: '올바른 대상이 아닙니다!' }));
        }
        return;
      }

      if (selection.kind === 'ATTACKER') {
        if (selection.attackerId === entityId) {
          setSelection(null);
          return;
        }
        if (selection.validTargets.includes(entityId)) {
          if (selection.attackerId === 'PLAYER_HERO') {
            hsAudio.playHeroVo(matchState.player.heroClass, 'attack');
          }
          const attackerId = selection.attackerId;
          setSelection(null);
          triggerPhysicalAttack('PLAYER', attackerId, entityId);
        } else {
          const enemyHasTaunt = matchState.opponent.board.some(
            (m) => !m.stealth && (m.taunt || m.auraTaunt),
          );
          if (enemyHasTaunt) {
            hsAudio.playHeroVo(matchState.player.heroClass, 'error_taunt');
            setMatchState((s) => ({
              ...s,
              errorBanner: '도발 능력이 있는 하수인이 가로막고 있습니다!',
            }));
          } else {
            setMatchState((s) => ({ ...s, errorBanner: '공격할 수 없는 대상입니다!' }));
          }
        }
        return;
      }

      // If holding an untargeted minion and clicking the friendly board area -> drop minion!
      if (selection.kind === 'HAND_CARD' && !selection.needsTarget && selection.isMinion) {
        executePlayPlayerCard(selection.handUid, { insertIndex: insertPreviewIdx });
        return;
      }
    }

    // 2. When no active targeting is pending:
    // Clicking an enemy minion enlarges it for crisp reading!
    if (!isFriendlyMinionOrHero) {
      if (entityId !== 'OPPONENT_HERO') {
        const oppMinion = matchState.opponent.board.find((m) => m.uid === entityId);
        if (oppMinion) {
          hsAudio.playSfx('card_hover', 0.65);
          setZoomState({ kind: 'BOARD_MINION', minion: oppMinion, isFriendly: false });
        }
      }
      return;
    }

    // Clicking a friendly minion or Hero:
    if (matchState.activeSide !== 'PLAYER') {
      if (entityId !== 'PLAYER_HERO') {
        const myMinion = matchState.player.board.find((m) => m.uid === entityId);
        if (myMinion) {
          hsAudio.playSfx('card_hover', 0.65);
          setZoomState({ kind: 'BOARD_MINION', minion: myMinion, isFriendly: true });
        }
      }
      return;
    }

    const swing = engine.canAttackerSwing('PLAYER', entityId);
    if (!swing.ok) {
      if (entityId !== 'PLAYER_HERO') {
        const myMinion = matchState.player.board.find((m) => m.uid === entityId);
        if (myMinion) {
          hsAudio.playSfx('card_hover', 0.65);
          setZoomState({ kind: 'BOARD_MINION', minion: myMinion, isFriendly: true });
          return;
        }
      } else if (getHeroAttack(matchState.player, true) > 0) {
        setMatchState((s) => ({ ...s, errorBanner: swing.reason || '공격할 수 없습니다.' }));
        if (swing.errorCode === 'exhausted' || swing.errorCode === 'attacked') {
          hsAudio.playHeroVo(matchState.player.heroClass, 'error_attacked');
        }
      }
      return;
    }

    const validTargets = engine.getValidAttackTargets('PLAYER', entityId);
    if (validTargets.length > 0) {
      hsAudio.playSfx('ui_click', 0.7);
      setSelection({
        kind: 'ATTACKER',
        attackerId: entityId,
        validTargets,
      });
    }
  };

  // Click Player Hero Power
  const handlePlayerHeroPower = () => {
    if (matchState.phase !== 'PLAYING' || matchState.activeSide !== 'PLAYER') return;
    if (selection?.kind === 'HERO_POWER') {
      setSelection(null);
      return;
    }
    const hpCheck = engine.inspectHeroPower('PLAYER');
    if (!hpCheck.canUse) {
      setMatchState((s) => ({ ...s, errorBanner: hpCheck.reason || '사용할 수 없습니다.' }));
      if (hpCheck.reason?.includes('마나')) {
        hsAudio.playHeroVo(matchState.player.heroClass, 'error_mana');
      }
      return;
    }
    if (hpCheck.needsTarget) {
      hsAudio.playSfx('ui_click', 0.8);
      setSelection({
        kind: 'HERO_POWER',
        validTargets: hpCheck.validTargets,
      });
    } else {
      hsAudio.playSfx('hero_power', 0.9);
      const eng = createEngine(matchState);
      setSelection(null);
      setMatchState(eng.useHeroPower('PLAYER'));
    }
  };

  // Emote Trigger + Polite AI Reply
  const triggerPlayerEmote = (
    emoteKey: 'greetings' | 'well_played' | 'thanks' | 'wow' | 'oops' | 'threaten',
  ) => {
    setEmoteMenuOpen(false);
    const pHero = CLASSIC_HEROES[matchState.player.heroClass];
    setPlayerEmoteText(pHero.emotesKo[emoteKey]);
    hsAudio.playHeroVo(matchState.player.heroClass, emoteKey);
    window.setTimeout(() => setPlayerEmoteText(null), 2800);

    // Friendly Innkeeper / Opponent Emote Response!
    window.setTimeout(() => {
      const replyKey =
        emoteKey === 'greetings'
          ? 'greetings'
          : emoteKey === 'threaten'
            ? 'threaten'
            : emoteKey === 'well_played'
              ? 'thanks'
              : 'wow';
      const oHero = CLASSIC_HEROES[matchState.opponent.heroClass];
      setOpponentEmoteText(oHero.emotesKo[replyKey]);
      hsAudio.playHeroVo(matchState.opponent.heroClass, replyKey);
      window.setTimeout(() => setOpponentEmoteText(null), 2800);
    }, 1500);
  };

  // Compute live Targeting Arrow source coordinates
  const targetingArrow = useMemo(() => {
    if (!selection) return null;
    const needsArrow =
      (selection.kind === 'HAND_CARD' && selection.needsTarget) ||
      selection.kind === 'CHOOSE_OPTION_TARGET' ||
      selection.kind === 'HERO_POWER' ||
      selection.kind === 'ATTACKER';
    if (!needsArrow) return null;

    let sx = window.innerWidth * 0.5;
    let sy = window.innerHeight * 0.82;
    if (selection.kind === 'ATTACKER') {
      const el = document.querySelector(`[data-hs-entity="${selection.attackerId}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        sx = r.left + r.width / 2;
        sy = r.top + r.height / 2;
      }
    } else if (selection.kind === 'HERO_POWER') {
      sx = window.innerWidth * 0.58;
      sy = window.innerHeight * 0.77;
    } else if (selection.kind === 'HAND_CARD') {
      const el = document.querySelector(`[data-hand-uid="${selection.handUid}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        sx = r.left + r.width / 2;
        sy = r.top + 24;
      }
    }
    return { sx, sy, ex: pointerPos.x, ey: pointerPos.y };
  }, [selection, pointerPos]);

  const activeValidTargetSet = useMemo(() => {
    if (!selection) return new Set<string>();
    if ('validTargets' in selection) return new Set(selection.validTargets);
    return new Set<string>();
  }, [selection]);

  const isPlayerTurn = matchState.phase === 'PLAYING' && matchState.activeSide === 'PLAYER';
  const noMovesLeft = isPlayerTurn && !engine.hasAnyAvailableMove('PLAYER');
  const cornerToys = BOARD_CORNER_TOYS[matchState.boardTheme];

  const buildMinionStatusPills = (m: MinionInstance): string[] => {
    const pills: string[] = [];
    if (m.silenced) pills.push('침묵 상태');
    if (hasMinionTaunt(m)) pills.push('도발');
    if (m.divineShield) pills.push('천상의 보호막');
    if (m.stealth || m.concealedUntilNextTurn) pills.push('은신');
    if (m.windfury) pills.push('질풍');
    if (m.frozen) pills.push('빙결');
    if (m.charge || m.auraCharge) pills.push('돌진');
    if (m.poisonous && !m.silenced) pills.push('독성');
    if (m.elusive && !m.silenced) pills.push('주문·영웅 능력 대상 불가');
    if (m.cantAttack) pills.push('공격 불가');
    if (m.spellDamage > 0 && !m.silenced) pills.push(`주문 공격력 +${m.spellDamage}`);
    if (m.exhausted && !m.charge && !m.auraCharge && !m.cantAttack) {
      pills.push('소환 후유증 (다음 턴 공격 가능)');
    } else if (m.attacksMadeThisTurn > 0 && (!m.windfury || m.attacksMadeThisTurn >= 2)) {
      pills.push('이번 턴 공격 완료');
    }
    return pills;
  };

  const renderActiveZoomModal = () => {
    if (!zoomState) return null;

    if (zoomState.kind === 'HAND_CARD') {
      const hc = matchState.player.hand.find((h) => h.uid === zoomState.handUid);
      if (!hc) return null;
      const def = cardDb.mustGetCard(hc.cardId);
      const check = engine.inspectPlayability('PLAYER', hc);
      const canPlayNow = isPlayerTurn && check.canPlay;

      const primaryAction: CardZoomAction = !isPlayerTurn
        ? {
            label: '상대 턴에는 카드를 사용할 수 없습니다',
            disabled: true,
            onClick: () => {},
          }
        : !check.canPlay
          ? {
              label: check.reason ? `사용 불가 · ${check.reason}` : '마나가 부족합니다',
              disabled: true,
              onClick: () => {},
            }
          : {
              label: check.hasChooseOne
                ? `카드 사용 · 효과 선택 (마나 ${check.cost})`
                : check.needsTarget
                  ? `카드 사용 · 대상 지정 (마나 ${check.cost})`
                  : `카드 사용 (마나 ${check.cost})`,
              variant: 'emerald',
              onClick: () => {
                setZoomState(null);
                if (check.hasChooseOne || !check.needsTarget) {
                  executePlayPlayerCard(hc.uid, {
                    insertIndex: matchState.player.board.length,
                  });
                } else {
                  setSelection({
                    kind: 'HAND_CARD',
                    handUid: hc.uid,
                    cardId: def.id,
                    needsTarget: true,
                    validTargets: check.validTargets,
                    isMinion: def.type === 'MINION',
                    hasChooseOne: false,
                  });
                }
              },
            };

      const secondaryActions: CardZoomAction[] =
        canPlayNow &&
        def.type === 'MINION' &&
        !check.needsTarget &&
        !check.hasChooseOne &&
        matchState.player.board.length > 0
          ? [
              {
                label: '전장 위치 직접 지정하여 놓기',
                variant: 'brass',
                onClick: () => {
                  setZoomState(null);
                  setSelection({
                    kind: 'HAND_CARD',
                    handUid: hc.uid,
                    cardId: def.id,
                    needsTarget: false,
                    validTargets: [],
                    isMinion: true,
                    hasChooseOne: false,
                  });
                },
              },
            ]
          : [];

      return (
        <CardZoomModal
          card={def}
          effectiveCost={check.cost}
          spellPowerBonus={playerSpellPower}
          velenMultiplier={playerVelenMult}
          playableGlow={
            !canPlayNow ? 'NONE' : check.isComboReady ? 'COMBO' : 'GREEN'
          }
          subtitleBadge={`내 손패 · 보유 마나 ${matchState.player.mana}/${matchState.player.maxMana}`}
          primaryAction={primaryAction}
          secondaryActions={secondaryActions}
          onCancel={() => setZoomState(null)}
        />
      );
    }

    if (zoomState.kind === 'MULLIGAN_CARD') {
      const hc = matchState.player.hand.find((h) => h.uid === zoomState.handUid);
      if (!hc) return null;
      const def = cardDb.mustGetCard(hc.cardId);
      const marked = matchState.mulliganSelectedUids.includes(hc.uid);
      return (
        <CardZoomModal
          card={def}
          subtitleBadge={
            marked
              ? '시작 손패 교체 · 현재 [교체 예정 ✕]'
              : '시작 손패 교체 · 현재 [손패 유지]'
          }
          primaryAction={{
            label: marked ? '교체 취소 (시작 손패에 유지)' : '교체 표시하기 (덱으로 교체)',
            variant: marked ? 'arcane' : 'crimson',
            onClick: () => {
              toggleMulliganCard(hc.uid);
              setZoomState(null);
            },
          }}
          onCancel={() => setZoomState(null)}
        />
      );
    }

    if (zoomState.kind === 'CHOOSE_ONE_CARD') {
      const prompt = matchState.chooseOnePrompt;
      if (!prompt) return null;
      const opt = prompt.options.find((o) => o.index === zoomState.optionIndex);
      if (!opt) return null;
      const optCard = cardDb.mustGetCard(opt.optionCardId);
      return (
        <CardZoomModal
          card={optCard}
          subtitleBadge={`운명의 선택 · ${opt.title}`}
          primaryAction={{
            label: opt.needsTarget ? '이 효과 선택 · 대상 지정' : '이 효과 사용',
            variant: 'emerald',
            onClick: () => {
              setZoomState(null);
              if (opt.needsTarget && opt.validTargets.length > 0) {
                setMatchState((s) => ({ ...s, chooseOnePrompt: null }));
                setSelection({
                  kind: 'CHOOSE_OPTION_TARGET',
                  handUid: prompt.sourceHandUid,
                  cardId: prompt.cardId,
                  optionIndex: opt.index,
                  insertIndex: prompt.insertIndex,
                  validTargets: opt.validTargets,
                });
              } else {
                executePlayPlayerCard(prompt.sourceHandUid, {
                  chooseOptionIndex: opt.index,
                  insertIndex: prompt.insertIndex,
                });
              }
            },
          }}
          onCancel={() => setZoomState(null)}
        />
      );
    }

    if (zoomState.kind === 'TRACKING_CARD') {
      const prompt = matchState.trackingPrompt;
      if (!prompt) return null;
      const def = cardDb.mustGetCard(zoomState.cardId);
      return (
        <CardZoomModal
          card={def}
          subtitleBadge="추적 — 가져올 카드 1장 선택 (나머지 2장 버림)"
          primaryAction={{
            label: '이 카드 손으로 가져오기',
            variant: 'emerald',
            onClick: () => {
              setZoomState(null);
              hsAudio.playSfx('card_place');
              const eng = createEngine(matchState);
              setMatchState(eng.resolveTrackingChoice(zoomState.cardId));
            },
          }}
          onCancel={() => setZoomState(null)}
        />
      );
    }

    if (zoomState.kind === 'BOARD_MINION') {
      const liveMinion =
        (zoomState.isFriendly
          ? matchState.player.board.find((m) => m.uid === zoomState.minion.uid)
          : matchState.opponent.board.find((m) => m.uid === zoomState.minion.uid)) ||
        zoomState.minion;
      const def = cardDb.mustGetCard(liveMinion.cardId);
      const canSwing =
        zoomState.isFriendly &&
        isPlayerTurn &&
        engine.canAttackerSwing('PLAYER', liveMinion.uid).ok;
      const validTargets = canSwing
        ? engine.getValidAttackTargets('PLAYER', liveMinion.uid)
        : [];

      return (
        <CardZoomModal
          card={def}
          subtitleBadge={zoomState.isFriendly ? '아군 전장 하수인 정보' : '적 전장 하수인 정보'}
          liveStats={{
            attack: getMinionAttack(liveMinion),
            health: getMinionHealth(liveMinion),
            maxHealth: getMinionMaxHealth(liveMinion),
            statuses: buildMinionStatusPills(liveMinion),
          }}
          primaryAction={
            canSwing && validTargets.length > 0
              ? {
                  label: '이 하수인으로 공격 대상 선택',
                  variant: 'emerald',
                  onClick: () => {
                    setZoomState(null);
                    setSelection({
                      kind: 'ATTACKER',
                      attackerId: liveMinion.uid,
                      validTargets,
                    });
                  },
                }
              : {
                  label: '확인 (닫기)',
                  variant: 'brass',
                  onClick: () => setZoomState(null),
                }
          }
          onCancel={() => setZoomState(null)}
        />
      );
    }

    if (zoomState.kind === 'HISTORY_ITEM') {
      const item = zoomState.item;
      const def = cardDb.mustGetCard(item.cardId);
      return (
        <CardZoomModal
          card={def}
          subtitleBadge={`${item.turn}턴 기록 · ${item.actorSide === 'PLAYER' ? '아군 행동' : '상대 행동'} — ${item.detail}`}
          primaryAction={{
            label: '확인 (닫기)',
            variant: 'brass',
            onClick: () => setZoomState(null),
          }}
          onCancel={() => setZoomState(null)}
        />
      );
    }

    return null;
  };

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        if (selection) setSelection(null);
      }}
      onClick={() => {
        if (emoteMenuOpen) setEmoteMenuOpen(false);
        if (selection) setSelection(null);
      }}
      style={
        {
          backgroundImage: `url(${BOARD_BG_URL[matchState.boardTheme]})`,
          '--hs-sx': `${shakeState.ampX}px`,
          '--hs-sy': `${shakeState.ampY}px`,
          '--hs-sr': `${shakeState.rotDeg}deg`,
          '--hs-sd': `${shakeState.durationMs}ms`,
        } as React.CSSProperties
      }
      className={`relative flex h-[100dvh] w-full select-none flex-col justify-between overflow-hidden bg-cover bg-center ${
        shakeState.active
          ? shakeState.seq % 2 === 0
            ? 'hs-damage-shake-a'
            : 'hs-damage-shake-b'
          : ''
      }`}
    >
      {/* Subtle Board Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-black/15 to-black/75" />

      {/* 60fps Particle & Spell Projectile Canvas */}
      <BoardVfxCanvas events={matchState.vfxQueue} onDamageImpact={triggerDamageImpact} />

      {/* Active Targeting / Placement Helper Bar (Cancelable & Inspectable on Mobile!) */}
      {selection && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed left-1/2 top-11 z-[76] flex w-[94%] max-w-md -translate-x-1/2 items-center justify-between gap-2 rounded-2xl border-2 border-amber-300 bg-stone-950/95 px-3 py-1.5 text-xs font-extrabold text-amber-100 shadow-2xl sm:top-14"
        >
          <span className="truncate">
            {selection.kind === 'ATTACKER'
              ? '⚔ 공격할 적 영웅 또는 하수인을 터치하세요'
              : selection.kind === 'HERO_POWER'
                ? '✦ 영웅 능력 대상을 터치하세요'
                : selection.kind === 'CHOOSE_OPTION_TARGET'
                  ? '✦ 선택한 효과의 대상을 터치하세요'
                  : selection.needsTarget
                    ? `✦ [${cardDb.mustGetCard(selection.cardId).name}] 대상을 터치하세요`
                    : `✦ [${cardDb.mustGetCard(selection.cardId).name}] 놓을 전장 위치를 터치하세요`}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            {selection.kind === 'ATTACKER' && selection.attackerId !== 'PLAYER_HERO' && (
              <button
                type="button"
                onClick={() => {
                  const m = matchState.player.board.find((x) => x.uid === selection.attackerId);
                  if (m) {
                    setSelection(null);
                    setZoomState({ kind: 'BOARD_MINION', minion: m, isFriendly: true });
                  }
                }}
                className="hs-brass-btn rounded-lg px-2 py-1 text-[10.5px] font-extrabold text-amber-100"
              >
                카드 확대
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelection(null)}
              className="rounded-lg border border-red-300/75 bg-red-900 px-2 py-1 text-[10.5px] font-extrabold text-white"
            >
              취소 ✕
            </button>
          </div>
        </div>
      )}

      {/* Curved Red Targeting Bezier Arrow + Crosshair Reticle */}
      {targetingArrow && (
        <svg className="pointer-events-none fixed inset-0 z-[75] h-full w-full">
          <defs>
            <filter id="hsArrowGlow">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={`M ${targetingArrow.sx} ${targetingArrow.sy} Q ${(targetingArrow.sx + targetingArrow.ex) / 2} ${Math.min(targetingArrow.sy, targetingArrow.ey) - 85} ${targetingArrow.ex} ${targetingArrow.ey}`}
            fill="none"
            stroke="#ef4444"
            strokeWidth={9}
            strokeDasharray="18 10"
            strokeLinecap="round"
            filter="url(#hsArrowGlow)"
          />
          <circle
            cx={targetingArrow.ex}
            cy={targetingArrow.ey}
            r={22}
            fill="rgba(239,68,68,0.22)"
            stroke="#fecaca"
            strokeWidth={3.5}
          />
          <line
            x1={targetingArrow.ex - 28}
            y1={targetingArrow.ey}
            x2={targetingArrow.ex + 28}
            y2={targetingArrow.ey}
            stroke="#ef4444"
            strokeWidth={3}
          />
          <line
            x1={targetingArrow.ex}
            y1={targetingArrow.ey - 28}
            x2={targetingArrow.ex}
            y2={targetingArrow.ey + 28}
            stroke="#ef4444"
            strokeWidth={3}
          />
        </svg>
      )}

      {/* 4 Interactive Battlefield Corner Toys! */}
      {cornerToys.map((toy) => {
        const posCls =
          toy.pos === 'TL'
            ? 'left-3 top-14'
            : toy.pos === 'TR'
              ? 'right-3 top-14'
              : toy.pos === 'BL'
                ? 'left-3 bottom-24'
                : 'right-3 bottom-24';
        return (
          <button
            key={toy.pos}
            type="button"
            title={`전장 기물: ${toy.name} (클릭해 상호작용!)`}
            onClick={(e) => {
              e.stopPropagation();
              hsAudio.playSfx('ui_click', 0.85);
              setToyToast(toy.reaction);
              window.setTimeout(
                () => setToyToast((prev) => (prev === toy.reaction ? null : prev)),
                2200,
              );
            }}
            className={`fixed ${posCls} z-30 hidden h-12 w-12 items-center justify-center rounded-2xl border-2 border-amber-400/50 bg-stone-950/65 text-2xl shadow-xl transition hover:scale-115 hover:border-amber-200 active:scale-90 md:flex`}
          >
            {toy.icon}
          </button>
        );
      })}

      {/* Left Action History Bar (Desktop / Tablet >= sm) */}
      <aside className="fixed left-2.5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-1.5 rounded-2xl border-2 border-[#a88344] bg-stone-950/80 p-1.5 shadow-2xl sm:flex">
        <div className="text-center text-[9px] font-extrabold text-amber-300">기록</div>
        {matchState.history.slice(0, 7).map((item) => (
          <div
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              hsAudio.playSfx('card_hover', 0.65);
              setZoomState({ kind: 'HISTORY_ITEM', item });
            }}
            onMouseEnter={() => setHoveredHistoryItem(item)}
            onMouseLeave={() => setHoveredHistoryItem(null)}
            className={`relative h-9 w-9 cursor-pointer overflow-hidden rounded-lg border-2 shadow transition hover:scale-110 ${
              item.actorSide === 'PLAYER' ? 'border-sky-400' : 'border-red-500'
            }`}
          >
            <img
              src={getCardTileUrl(item.cardId)}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
        {matchState.history.length === 0 && (
          <div className="px-1 py-3 text-[9px] text-stone-500">대기</div>
        )}
      </aside>

      {/* History Hover Card Tooltip */}
      {hoveredHistoryItem && (
        <div className="pointer-events-none fixed left-16 top-1/2 z-[80] hidden -translate-y-1/2 items-center gap-3 rounded-2xl border-2 border-amber-300 bg-stone-950/95 p-3 text-amber-100 shadow-2xl sm:flex">
          <HearthstoneCard card={cardDb.mustGetCard(hoveredHistoryItem.cardId)} size="SM" />
          <div className="max-w-[200px]">
            <div className="text-xs font-extrabold text-yellow-300">
              {hoveredHistoryItem.turn}턴 ·{' '}
              {hoveredHistoryItem.actorSide === 'PLAYER' ? '아군 행동' : '상대 행동'}
            </div>
            <div className="mt-1 text-sm font-extrabold text-white">
              {hoveredHistoryItem.title}
            </div>
            <p className="mt-1 text-xs text-amber-200/85">{hoveredHistoryItem.detail}</p>
          </div>
        </div>
      )}

      {/* Board Minion Hover Full-Card Inspector (Desktop XL) */}
      {liveHoveredBoardMinion && !selection && (
        <div className="pointer-events-none fixed right-24 top-1/2 z-[80] hidden -translate-y-1/2 xl:block">
          <HearthstoneCard
            card={cardDb.mustGetCard(liveHoveredBoardMinion.cardId)}
            size="MD"
          />
        </div>
      )}

      {/* Right Deck Stacks & Authentic 3-State Sculpted End Turn Button (Desktop / Tablet >= sm) */}
      <aside className="fixed right-2.5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-4 sm:flex">
        {/* Opponent Remaining Deck Stack */}
        <div
          title={
            matchState.opponent.deck.length > 0
              ? `상대 남은 덱: ${matchState.opponent.deck.length}장`
              : `상대 덱 소진! (다음 탈진 피해: ${matchState.opponent.fatigueCounter + 1})`
          }
          className="relative flex h-14 w-11 flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-[#c8a158]/80 bg-stone-950/90 shadow-xl"
        >
          <img
            src={backImg}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55"
          />
          <span className="hs-outline-sm relative z-10 text-[9px] font-extrabold text-red-200">
            상대 덱
          </span>
          <span className="hs-num relative z-10 text-sm text-white">
            {matchState.opponent.deck.length}
          </span>
        </div>

        {/* Authentic Extracted 3-State Stone & Brass End Turn Lever */}
        <button
          type="button"
          disabled={!isPlayerTurn}
          onClick={(e) => {
            e.stopPropagation();
            if (!isPlayerTurn) return;
            setSelection(null);
            hsAudio.playSfx('end_turn');
            const eng = createEngine(matchState);
            setMatchState(eng.endTurn());
          }}
          className={`group relative flex h-[62px] w-[118px] items-center justify-center transition ${
            !isPlayerTurn
              ? 'cursor-not-allowed opacity-90'
              : noMovesLeft
                ? 'cursor-pointer drop-shadow-[0_0_18px_rgba(52,211,153,0.95)] hover:scale-105'
                : 'cursor-pointer drop-shadow-[0_8px_16px_rgba(0,0,0,0.88)] hover:scale-105 hover:brightness-110'
          }`}
        >
          <img
            src={
              !isPlayerTurn
                ? '/stone-assets/ui/endturn_stone.webp'
                : noMovesLeft
                  ? '/stone-assets/ui/endturn_green.webp'
                  : '/stone-assets/ui/endturn_yellow.webp'
            }
            alt="턴 종료"
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          />
          <span
            className={`hs-title hs-outline-sm relative z-10 text-xs font-extrabold tracking-wide ${
              !isPlayerTurn ? 'text-stone-300' : 'text-white'
            }`}
          >
            {!isPlayerTurn ? '상대 턴' : noMovesLeft ? '할 일 없음' : '턴 종료'}
          </span>
        </button>

        {/* Player Remaining Deck Stack */}
        <div
          title={
            matchState.player.deck.length > 0
              ? `내 남은 덱: ${matchState.player.deck.length}장`
              : `내 덱 소진! (다음 탈진 피해: ${matchState.player.fatigueCounter + 1})`
          }
          className="relative flex h-14 w-11 flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-[#c8a158]/80 bg-stone-950/90 shadow-xl"
        >
          <img
            src={backImg}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55"
          />
          <span className="hs-outline-sm relative z-10 text-[9px] font-extrabold text-sky-200">
            내 덱
          </span>
          <span className="hs-num relative z-10 text-sm text-white">
            {matchState.player.deck.length}
          </span>
        </div>
      </aside>

      {/* ==================== TOP ZONE: OPPONENT HAND + OPPONENT HERO ==================== */}
      <header className="relative z-20 flex flex-col items-center pt-1">
        {/* Top Utility Strip: Opponent Mana + Opponent Hand + Corner Toy + Options */}
        <div className="flex w-full items-center justify-between gap-1.5 px-2 sm:px-3">
          <div className="flex min-w-0 items-center gap-1.5 rounded-xl border-2 border-[#b8924d]/75 bg-stone-950/90 px-2 py-1 text-[10.5px] text-amber-100 shadow-lg sm:gap-2 sm:px-3 sm:text-xs">
            <img
              src={CLASS_CREST_URL[matchState.opponent.heroClass]}
              alt=""
              className="h-4 w-4 shrink-0 rounded-full object-cover"
            />
            <span className="max-w-[72px] truncate font-extrabold text-red-200 sm:max-w-none">
              {matchState.opponent.name}
            </span>
            <span className="text-stone-500">·</span>
            <span className="shrink-0 font-extrabold text-sky-300">
              마나 {matchState.opponent.mana}/{matchState.opponent.maxMana}
            </span>
            <span className="hidden text-stone-500 sm:inline">·</span>
            <span className="hidden font-bold text-amber-200/85 sm:inline">
              손패 {matchState.opponent.hand.length}장
            </span>
          </div>

          {/* Opponent Face-Down Curved Hand (Visible on BOTH Mobile Portrait & Desktop!) */}
          <div
            title={`상대 손패: ${matchState.opponent.hand.length}장`}
            className="flex shrink-0 items-center justify-center -space-x-3 sm:-space-x-3"
          >
            {matchState.opponent.hand.map((hc, idx) => {
              const rot = (idx - (matchState.opponent.hand.length - 1) / 2) * 3;
              return (
                <div
                  key={hc.uid}
                  style={{ transform: `rotate(${rot}deg)` }}
                  className="h-7 w-5 overflow-hidden rounded-[4px] border border-amber-300/65 shadow sm:h-14 sm:w-10 sm:rounded-md"
                >
                  <img src={backImg} alt="" className="h-full w-full object-cover" />
                </div>
              );
            })}
            {matchState.opponent.hand.length === 0 && (
              <span className="rounded border border-stone-700 bg-stone-950/80 px-1.5 py-0.5 text-[9.5px] font-bold text-stone-400">
                손패 0장
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              data-testid="toggle-autoplay"
              data-autoplay-active={autoPlay ? 'true' : 'false'}
              onClick={(e) => {
                e.stopPropagation();
                hsAudio.playSfx('ui_click', 0.8);
                setAutoPlay((prev) => !prev);
              }}
              className={`rounded-xl border px-2 py-1 text-[10.5px] font-extrabold transition sm:px-2.5 sm:text-xs ${
                autoPlay
                  ? 'border-emerald-300 bg-emerald-700 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'hs-brass-btn text-amber-100'
              }`}
            >
              {autoPlay ? '⚙ 자동 ON' : '⚙ 자동 OFF'}
            </button>

            {/* Mobile Corner Toy Interaction Button (< md) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const toy = cornerToys[Math.floor(Math.random() * cornerToys.length)];
                hsAudio.playSfx('ui_click', 0.85);
                setToyToast(`${toy.icon} ${toy.reaction}`);
                window.setTimeout(() => setToyToast(null), 2200);
              }}
              className="hs-brass-btn rounded-xl px-2 py-1 text-[10.5px] font-extrabold text-amber-100 md:hidden"
            >
              기물
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                hsAudio.playSfx('open_menu');
                onOpenOptions(handleConcede);
              }}
              className="hs-brass-btn rounded-xl px-2.5 py-1 text-[10.5px] font-extrabold text-amber-100 sm:px-3 sm:text-xs"
            >
              메뉴 · 항복
            </button>
          </div>
        </div>

        {/* Opponent Hero Arch */}
        <div className="mt-0.5 sm:mt-1">
          <HeroPortraitZone
            player={matchState.opponent}
            isFriendly={false}
            isActiveTurn={matchState.activeSide === 'OPPONENT'}
            canHeroAttack={false}
            isHeroSelectedAttacker={false}
            isHeroValidTarget={activeValidTargetSet.has('OPPONENT_HERO')}
            canUseHeroPower={false}
            isHeroPowerSelected={false}
            emoteBubbleText={opponentEmoteText}
            onClickHero={() => handleEntityClick('OPPONENT_HERO', false)}
            onClickHeroPower={() => {}}
          />
        </div>
      </header>

      {/* ==================== CENTER ZONE: 7v7 BATTLEFIELD ARENA ==================== */}
      <main className="relative z-20 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-1 px-1.5 sm:gap-2 sm:px-12">
        {/* Tutorial Step Coach Banner */}
        {mode === 'TUTORIAL' && isPlayerTurn && matchState.turnNumber <= 6 && (
          <div className="mx-auto rounded-2xl border-2 border-emerald-300 bg-emerald-950/90 px-3 py-1 text-center text-[11px] font-extrabold text-emerald-100 shadow-lg sm:px-4 sm:py-1.5 sm:text-xs">
            💡 튜토리얼: 초록색 테두리 카드를 터치해 확대한 뒤 [카드 사용]을 누르고, 다음 턴 깨어난 하수인으로 적을 공격하세요!
          </div>
        )}

        {/* Opponent Minion Row (Max 7) */}
        <div className="flex min-h-[70px] items-center justify-center gap-1 sm:min-h-[122px] sm:gap-3">
          {matchState.opponent.board.map((m) => (
            <BoardMinionToken
              key={m.uid}
              minion={m}
              canAttack={false}
              isSelectedAttacker={false}
              isValidTarget={activeValidTargetSet.has(m.uid)}
              onSelect={() => handleEntityClick(m.uid, false)}
              onHoverChange={(hov) => setHoveredBoardMinion(hov ? m : null)}
            />
          ))}
          {matchState.opponent.board.length === 0 && (
            <div className="text-[11px] font-bold text-amber-100/30 sm:text-xs">상대 전장</div>
          )}
        </div>

        {/* Desktop Center Board Divider + Burning Rope Fuse (>= sm) */}
        <div className="relative mx-auto hidden h-2 w-[86%] rounded-full bg-amber-950/60 sm:block">
          {isPlayerTurn && matchState.turnSecondsLeft <= 15 && (
            <div className="absolute inset-0 flex items-center">
              <div
                style={{ width: `${(matchState.turnSecondsLeft / 15) * 100}%` }}
                className="h-2 rounded-full bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-200 transition-all duration-1000"
              />
              <span className="hs-num ml-2 whitespace-nowrap rounded-full bg-red-900 px-2 py-0.5 text-xs text-yellow-200 shadow">
                🔥 {matchState.turnSecondsLeft}초!
              </span>
            </div>
          )}
        </div>

        {/* Mobile Portrait Center Tactical Divider Bar (< sm: History + Decks + Rope + End Turn!) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="mx-auto flex w-full items-center justify-between gap-1.5 rounded-2xl border border-[#b8924d]/70 bg-stone-950/88 px-2 py-1 shadow-lg sm:hidden"
        >
          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('ui_click', 0.75);
              setMobileHistoryOpen(true);
            }}
            className="hs-brass-btn rounded-xl px-2.5 py-1 text-[10.5px] font-extrabold text-amber-100"
          >
            기록 ({matchState.history.length})
          </button>

          <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold">
            <span className="rounded-lg border border-red-400/45 bg-stone-900/95 px-2 py-0.5 text-red-200">
              상대덱 {matchState.opponent.deck.length}
            </span>
            <span className="rounded-lg border border-sky-400/45 bg-stone-900/95 px-2 py-0.5 text-sky-200">
              내덱 {matchState.player.deck.length}
            </span>
            {isPlayerTurn && matchState.turnSecondsLeft <= 15 && (
              <span className="rounded-lg bg-red-900 px-1.5 py-0.5 text-[10px] text-yellow-200">
                🔥{matchState.turnSecondsLeft}초
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!isPlayerTurn}
            onClick={() => {
              if (!isPlayerTurn) return;
              setSelection(null);
              hsAudio.playSfx('end_turn');
              const eng = createEngine(matchState);
              setMatchState(eng.endTurn());
            }}
            className={`relative flex h-[36px] w-[88px] shrink-0 items-center justify-center transition ${
              !isPlayerTurn
                ? 'cursor-not-allowed opacity-90'
                : noMovesLeft
                  ? 'drop-shadow-[0_0_12px_rgba(52,211,153,0.95)] active:scale-95'
                  : 'active:scale-95'
            }`}
          >
            <img
              src={
                !isPlayerTurn
                  ? '/stone-assets/ui/endturn_stone.webp'
                  : noMovesLeft
                    ? '/stone-assets/ui/endturn_green.webp'
                    : '/stone-assets/ui/endturn_yellow.webp'
              }
              alt="턴 종료"
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            />
            <span
              className={`hs-title hs-outline-sm relative z-10 text-[10.5px] font-extrabold ${
                !isPlayerTurn ? 'text-stone-300' : 'text-white'
              }`}
            >
              {!isPlayerTurn ? '상대 턴' : noMovesLeft ? '할 일 없음' : '턴 종료'}
            </span>
          </button>
        </div>

        {/* Friendly Minion Row (Max 7 + Positional Drop Slot Preview!) */}
        <div
          ref={friendlyRowRef}
          onClick={(e) => {
            if (selection?.kind === 'HAND_CARD' && !selection.needsTarget) {
              e.stopPropagation();
              executePlayPlayerCard(selection.handUid, { insertIndex: insertPreviewIdx });
            }
          }}
          className={`flex min-h-[70px] items-center justify-center gap-1 rounded-3xl transition sm:min-h-[124px] sm:gap-3 ${
            selection?.kind === 'HAND_CARD' && !selection.needsTarget
              ? 'cursor-pointer bg-emerald-500/15 ring-2 ring-emerald-400/60'
              : ''
          }`}
        >
          {matchState.player.board.map((m, idx) => (
            <React.Fragment key={m.uid}>
              {selection?.kind === 'HAND_CARD' &&
                !selection.needsTarget &&
                selection.isMinion &&
                insertPreviewIdx === idx && (
                  <div className="flex h-[64px] w-11 items-center justify-center rounded-[50%] border-2 border-dashed border-emerald-300 bg-emerald-400/25 text-center text-[9px] font-extrabold text-emerald-100 sm:h-[102px] sm:w-14 sm:text-[10px]">
                    여기 배치
                  </div>
                )}
              <BoardMinionToken
                minion={m}
                canAttack={isPlayerTurn && engine.canAttackerSwing('PLAYER', m.uid).ok}
                isSelectedAttacker={
                  selection?.kind === 'ATTACKER' && selection.attackerId === m.uid
                }
                isValidTarget={activeValidTargetSet.has(m.uid)}
                onSelect={() => handleEntityClick(m.uid, true)}
                onHoverChange={(hov) => setHoveredBoardMinion(hov ? m : null)}
              />
            </React.Fragment>
          ))}

          {selection?.kind === 'HAND_CARD' &&
            !selection.needsTarget &&
            selection.isMinion &&
            insertPreviewIdx >= matchState.player.board.length && (
              <div className="flex h-[64px] w-12 items-center justify-center rounded-[50%] border-2 border-dashed border-emerald-300 bg-emerald-400/25 text-center text-[9px] font-extrabold text-emerald-100 sm:h-[102px] sm:w-16 sm:text-[10px]">
                소환 위치
              </div>
            )}

          {selection?.kind === 'HAND_CARD' &&
            !selection.needsTarget &&
            !selection.isMinion && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  executePlayPlayerCard(selection.handUid);
                }}
                className="rounded-2xl border-2 border-emerald-200 bg-emerald-600 px-4 py-1.5 text-xs font-extrabold text-white shadow-xl sm:px-5 sm:py-2 sm:text-sm"
              >
                ✨ 클릭하여 시전!
              </button>
            )}

          {matchState.player.board.length === 0 && !selection && (
            <div className="text-[11px] font-bold text-amber-100/30 sm:text-xs">내 전장</div>
          )}
        </div>
      </main>

      {/* ==================== BOTTOM ZONE: PLAYER HERO + MANA TRAY + CURVED HAND ==================== */}
      <footer className="relative z-30 flex flex-col items-center pb-1">
        {/* Centered Player Hero + Bottom-Right Mana Crystal Tray */}
        <div className="relative flex w-full max-w-5xl flex-col items-center justify-center gap-1 px-2 sm:px-4">
          <div className="relative flex items-center justify-center">
            {/* Emote Menu Brass Trigger (Positioned outside flex flow so Hero stays dead-center!) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEmoteMenuOpen((v) => !v);
              }}
              className="hs-brass-btn absolute -left-14 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-[10px] font-extrabold text-amber-100 sm:-left-20 sm:px-2.5 sm:text-[11px]"
            >
              감정표현
            </button>

            <HeroPortraitZone
              player={matchState.player}
              isFriendly
              isActiveTurn={isPlayerTurn}
              canHeroAttack={isPlayerTurn && engine.canAttackerSwing('PLAYER', 'PLAYER_HERO').ok}
              isHeroSelectedAttacker={
                selection?.kind === 'ATTACKER' && selection.attackerId === 'PLAYER_HERO'
              }
              isHeroValidTarget={activeValidTargetSet.has('PLAYER_HERO')}
              canUseHeroPower={isPlayerTurn && engine.inspectHeroPower('PLAYER').canUse}
              isHeroPowerSelected={selection?.kind === 'HERO_POWER'}
              emoteBubbleText={playerEmoteText}
              onClickHero={() => handleEntityClick('PLAYER_HERO', true)}
              onClickHeroPower={handlePlayerHeroPower}
            />

            {/* 6-Petal Korean Emote Radial Menu */}
            {emoteMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="hs-wood-panel absolute -top-28 left-1/2 z-50 grid w-64 -translate-x-1/2 grid-cols-3 gap-1.5 rounded-2xl p-2.5 shadow-2xl sm:-top-32"
              >
                {(
                  [
                    { key: 'greetings', label: '인사' },
                    { key: 'well_played', label: '칭찬' },
                    { key: 'thanks', label: '감사' },
                    { key: 'wow', label: '감탄' },
                    { key: 'oops', label: '실수' },
                    { key: 'threaten', label: '위협' },
                  ] as const
                ).map((em) => (
                  <button
                    key={em.key}
                    type="button"
                    onClick={() => triggerPlayerEmote(em.key)}
                    className="hs-ivory-plate rounded-xl py-1.5 text-xs font-extrabold text-[#2b180a]"
                  >
                    {em.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Authentic 10-Crystal Faceted Sapphire Mana Tray (Bottom-Right on Desktop/Tablet) */}
          <div className="flex items-center gap-1.5 rounded-2xl border-2 border-[#c8a158] bg-stone-950/90 px-2.5 py-1 shadow-[0_10px_24px_rgba(0,0,0,0.88)] sm:absolute sm:bottom-1 sm:right-4 sm:gap-2 sm:px-3 sm:py-1.5">
            <HsManaGem
              value={`${matchState.player.mana}/${matchState.player.maxMana}`}
              size={isCompactMobile ? 24 : 30}
              active={matchState.player.mana > 0}
            />
            <div className="flex items-center gap-0.5 sm:gap-1">
              {Array.from({ length: 10 }).map((_, idx) => {
                const isUnlocked = idx < matchState.player.maxMana;
                const isFilled = idx < matchState.player.mana;
                const isOverloadedNow =
                  isUnlocked &&
                  idx >= matchState.player.maxMana - matchState.player.overloadedMana;
                return (
                  <div
                    key={idx}
                    title={isOverloadedNow ? '과부하로 잠긴 마나 수정' : undefined}
                    style={{
                      clipPath:
                        'polygon(50% 4%, 94% 26%, 94% 74%, 50% 96%, 6% 74%, 6% 26%)',
                    }}
                    className={`h-3.5 w-3 transition sm:h-5 sm:w-4 ${
                      isOverloadedNow
                        ? 'bg-gradient-to-b from-red-400 to-red-800 shadow-[0_0_8px_#ef4444]'
                        : isFilled
                          ? 'bg-gradient-to-b from-sky-200 via-blue-500 to-indigo-900 shadow-[0_0_8px_#38bdf8]'
                          : isUnlocked
                            ? 'bg-sky-950/85 opacity-70'
                            : 'bg-stone-800/45 opacity-45'
                    }`}
                  />
                );
              })}
            </div>
            {matchState.player.pendingOverload > 0 && (
              <span className="ml-0.5 rounded-md border border-red-400/50 bg-red-950 px-1.5 py-0.5 text-[9.5px] font-extrabold text-red-200 sm:text-[10px]">
                과부하 {matchState.player.pendingOverload}
              </span>
            )}
          </div>
        </div>

        {/* Player Curved Hand Fan (Tap any card -> Select & Enlarge in CardZoomModal!) */}
        <div className="hs-no-scrollbar mt-0.5 flex min-h-[146px] w-full items-end overflow-x-auto px-3 pb-0.5 pt-2 sm:min-h-[192px] sm:justify-center sm:overflow-x-visible sm:px-4 sm:pb-1">
          <div className="mx-auto flex w-max items-end -space-x-6 sm:-space-x-5">
            {matchState.player.hand.map((hc, idx) => {
              const def = cardDb.mustGetCard(hc.cardId);
              const check = engine.inspectPlayability('PLAYER', hc);
              const isSelectedCard =
                (selection?.kind === 'HAND_CARD' && selection.handUid === hc.uid) ||
                (zoomState?.kind === 'HAND_CARD' && zoomState.handUid === hc.uid);
              const mid = (matchState.player.hand.length - 1) / 2;
              const angle = (idx - mid) * (isCompactMobile ? 1.5 : 2.4);
              const liftY = Math.min(isCompactMobile ? 4 : 8, Math.abs(idx - mid) * 1.2);

              return (
                <div
                  key={hc.uid}
                  data-hand-uid={hc.uid}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHandCardClick(hc.uid);
                  }}
                  style={{
                    transform: isSelectedCard
                      ? 'translateY(-18px) scale(1.08)'
                      : `translateY(${liftY}px) rotate(${angle}deg)`,
                  }}
                  className={`transition-all duration-150 ${
                    isSelectedCard
                      ? 'z-50'
                      : 'hover:z-50 sm:hover:-translate-y-7 sm:hover:rotate-0 sm:hover:scale-110'
                  }`}
                >
                  <HearthstoneCard
                    card={def}
                    effectiveCost={check.cost}
                    spellPowerBonus={playerSpellPower}
                    velenMultiplier={playerVelenMult}
                    playableGlow={
                      !isPlayerTurn || !check.canPlay
                        ? 'NONE'
                        : check.isComboReady
                          ? 'COMBO'
                          : 'GREEN'
                    }
                    size={isCompactMobile ? 'XS' : 'SM'}
                    className="cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </footer>

      {/* ==================== MOBILE HISTORY OVERLAY (< sm) ==================== */}
      {mobileHistoryOpen && (
        <div
          onClick={() => setMobileHistoryOpen(false)}
          className="fixed inset-0 z-[105] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="hs-wood-panel flex max-h-[78dvh] w-full max-w-sm flex-col rounded-3xl p-4 text-amber-100 shadow-2xl"
          >
            <div className="mb-2.5 flex items-center justify-between border-b border-amber-500/30 pb-2">
              <h3 className="hs-title text-base font-extrabold text-amber-200">
                전투 행동 기록 (카드를 터치해 확대)
              </h3>
              <button
                type="button"
                onClick={() => setMobileHistoryOpen(false)}
                className="hs-brass-btn rounded-xl px-2.5 py-1 text-xs font-extrabold text-amber-100"
              >
                닫기 ✕
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {matchState.history.length === 0 ? (
                <div className="py-8 text-center text-xs font-bold text-amber-200/65">
                  아직 기록된 행동이 없습니다.
                </div>
              ) : (
                matchState.history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      hsAudio.playSfx('card_hover', 0.65);
                      setZoomState({ kind: 'HISTORY_ITEM', item });
                    }}
                    className="flex w-full items-center gap-2.5 rounded-2xl border border-amber-400/35 bg-stone-950/85 p-2 text-left transition active:scale-[0.99]"
                  >
                    <img
                      src={getCardTileUrl(item.cardId)}
                      alt={item.title}
                      className={`h-10 w-10 shrink-0 rounded-lg border-2 object-cover ${
                        item.actorSide === 'PLAYER' ? 'border-sky-400' : 'border-red-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-extrabold text-yellow-300">
                        {item.turn}턴 · {item.actorSide === 'PLAYER' ? '아군' : '상대'} · {item.title}
                      </div>
                      <div className="truncate text-xs font-bold text-amber-100/90">
                        {item.detail}
                      </div>
                    </div>
                    <span className="shrink-0 text-[10.5px] font-extrabold text-amber-300">
                      확대 ›
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== FLOATING BANNERS & MODALS ==================== */}

      {/* Turn Change Banner ("내 턴!" / "상대 턴") */}
      {matchState.bannerMessage && !vsIntroActive && (
        <div className="hs-wood-panel pointer-events-none fixed left-1/2 top-1/2 z-[82] -translate-x-1/2 -translate-y-1/2 animate-[hsCardPop_0.3s_ease-out] rounded-3xl px-8 py-3 sm:px-12 sm:py-4">
          <div className="hs-title hs-outline text-2xl font-extrabold tracking-widest text-amber-200 sm:text-3xl">
            {matchState.bannerMessage}
          </div>
        </div>
      )}

      {/* AI Action Callout Pill */}
      {aiHighlightText && (
        <div className="pointer-events-none fixed left-1/2 top-24 z-[78] max-w-[90%] -translate-x-1/2 truncate rounded-full border-2 border-red-300 bg-stone-950/92 px-4 py-1.5 text-xs font-extrabold text-amber-100 shadow-xl sm:top-28 sm:px-5">
          {aiHighlightText}
        </div>
      )}

      {/* Play Error Banner */}
      {matchState.errorBanner && (
        <div className="pointer-events-none fixed bottom-44 left-1/2 z-[85] max-w-[92%] -translate-x-1/2 rounded-2xl border-2 border-red-300 bg-red-950/95 px-4 py-2 text-center text-xs font-extrabold text-red-100 shadow-2xl sm:bottom-48 sm:px-6 sm:text-sm">
          {matchState.errorBanner}
        </div>
      )}

      {/* Corner Toy Reaction Toast */}
      {toyToast && (
        <div className="pointer-events-none fixed left-1/2 top-14 z-[85] max-w-[92%] -translate-x-1/2 rounded-2xl border border-amber-300 bg-stone-950/92 px-4 py-1.5 text-center text-xs font-bold text-amber-200 shadow-xl sm:top-16 sm:px-5">
          {toyToast}
        </div>
      )}

      {/* 1. VS Clash Intro Overlay with Sculpted Hero Arch Portraits */}
      {vsIntroActive && (
        <div className="fixed inset-0 z-[92] flex flex-col items-center justify-center bg-black/84 px-3 backdrop-blur-sm">
          <div className="flex items-center gap-3 sm:gap-14">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2.5 h-32 w-24 overflow-hidden rounded-t-[48px] rounded-b-xl border-[3.5px] border-[#e7c57c] bg-stone-950 shadow-[0_14px_30px_rgba(0,0,0,0.95)] sm:mb-3 sm:h-44 sm:w-36 sm:rounded-t-[58px] sm:border-[4px]">
                <img
                  src={getHeroArtUrl(CLASSIC_HEROES[matchState.player.heroClass].heroId)}
                  alt=""
                  className="h-full w-full scale-110 object-cover object-top"
                />
                <img
                  src={CLASS_CREST_URL[matchState.player.heroClass]}
                  alt=""
                  className="absolute bottom-1.5 right-1.5 h-7 w-7 rounded-full border border-amber-200 object-cover shadow sm:h-8 sm:w-8"
                />
              </div>
              <div className="hs-title hs-outline text-lg font-extrabold text-sky-300 sm:text-3xl">
                {matchState.player.heroNameKo}
              </div>
              <div className="mt-0.5 text-xs font-bold text-amber-200">
                {CLASSIC_HEROES[matchState.player.heroClass].classNameKo}
              </div>
            </div>

            <img
              src="/stone-assets/ui/vs_emblem.webp"
              alt="VS"
              className="h-20 w-20 shrink-0 animate-[hsCardPop_0.5s_ease-out] object-contain drop-shadow-[0_0_32px_rgba(250,204,21,0.9)] sm:h-36 sm:w-36"
            />

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2.5 h-32 w-24 overflow-hidden rounded-t-[48px] rounded-b-xl border-[3.5px] border-[#e7c57c] bg-stone-950 shadow-[0_14px_30px_rgba(0,0,0,0.95)] sm:mb-3 sm:h-44 sm:w-36 sm:rounded-t-[58px] sm:border-[4px]">
                <img
                  src={getHeroArtUrl(CLASSIC_HEROES[matchState.opponent.heroClass].heroId)}
                  alt=""
                  className="h-full w-full scale-110 object-cover object-top"
                />
                <img
                  src={CLASS_CREST_URL[matchState.opponent.heroClass]}
                  alt=""
                  className="absolute bottom-1.5 right-1.5 h-7 w-7 rounded-full border border-amber-200 object-cover shadow sm:h-8 sm:w-8"
                />
              </div>
              <div className="hs-title hs-outline text-lg font-extrabold text-red-300 sm:text-3xl">
                {matchState.opponent.heroNameKo}
              </div>
              <div className="mt-0.5 text-xs font-bold text-amber-200">
                {matchState.opponent.name}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Mulligan (시작 손패 교체) Overlay — Tap Card to Enlarge & Toggle Replace! */}
      {!vsIntroActive && matchState.phase === 'MULLIGAN' && (
        <div className="fixed inset-0 z-[88] flex flex-col items-center justify-center overflow-y-auto bg-black/82 p-3 text-center backdrop-blur-sm sm:p-4">
          <h2 className="hs-title hs-outline text-xl font-extrabold text-amber-200 sm:text-3xl">
            시작 카드 선택 ({matchState.firstPlayer === 'PLAYER' ? '선공 · 3장' : '후공 · 4장 + 동전 한 닢'})
          </h2>
          <p className="mt-1 max-w-md text-xs font-bold text-amber-200/90">
            카드를 터치해 크게 확대하고 하단 버튼으로 교체(✕) 여부를 선택한 뒤 [확인]을 누르세요.
          </p>

          <div
            className={`my-4 items-center justify-center gap-2.5 sm:my-6 sm:flex sm:flex-wrap sm:gap-4 ${
              isCompactMobile && matchState.player.hand.length >= 4
                ? 'grid grid-cols-2'
                : 'flex flex-wrap'
            }`}
          >
            {matchState.player.hand.map((hc) => {
              const def = cardDb.mustGetCard(hc.cardId);
              const marked = matchState.mulliganSelectedUids.includes(hc.uid);
              return (
                <div
                  key={hc.uid}
                  onClick={(e) => {
                    e.stopPropagation();
                    hsAudio.playSfx('card_hover', 0.7);
                    setZoomState({ kind: 'MULLIGAN_CARD', handUid: hc.uid });
                  }}
                  className="relative cursor-pointer transition hover:scale-105"
                >
                  <HearthstoneCard card={def} size={isCompactMobile ? 'XS' : 'MD'} />
                  {marked && (
                    <div className="absolute inset-x-2 inset-y-2.5 z-40 flex flex-col items-center justify-center rounded-2xl border-2 border-red-400/75 bg-red-950/75 backdrop-blur-[1px]">
                      <span className="hs-outline text-4xl font-black text-red-400 sm:text-6xl">✕</span>
                      <span className="mt-0.5 rounded-md border border-red-300/60 bg-red-900 px-2 py-0.5 text-[10px] font-extrabold text-white sm:text-xs">
                        교체 예정
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={confirmMulliganNow}
            className="hs-arcane-btn hs-title hs-outline-sm rounded-2xl px-10 py-2.5 text-lg font-extrabold tracking-wider text-white sm:px-12 sm:py-3 sm:text-xl"
          >
            확인 (전투 개시)
          </button>
        </div>
      )}

      {/* 3. Druid Choose One (선택) Modal — Tap Option Card to Enlarge & Confirm! */}
      {matchState.chooseOnePrompt && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-y-auto bg-black/82 p-3 text-center backdrop-blur-sm sm:p-4">
          <h3 className="hs-title hs-outline mb-3 text-xl font-extrabold text-amber-200 sm:mb-4 sm:text-2xl">
            운명의 선택 — 카드를 터치해 확대 후 선택하세요
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            {matchState.chooseOnePrompt.options.map((opt) => {
              const optCard = cardDb.mustGetCard(opt.optionCardId);
              return (
                <button
                  key={opt.index}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    hsAudio.playSfx('card_hover', 0.7);
                    setZoomState({ kind: 'CHOOSE_ONE_CARD', optionIndex: opt.index });
                  }}
                  className="hs-wood-panel flex max-w-[162px] flex-col items-center rounded-2xl p-2.5 transition hover:scale-105 hover:border-emerald-300 sm:max-w-none sm:p-4"
                >
                  <HearthstoneCard card={optCard} size={isCompactMobile ? 'XS' : 'MD'} />
                  <div className="hs-title mt-1.5 text-xs font-extrabold text-amber-200 sm:mt-2 sm:text-sm">
                    {opt.title}
                  </div>
                  <div className="mt-0.5 text-[11px] font-bold text-amber-100/85 sm:text-xs">
                    {opt.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Hunter Tracking (추적) 3-Card Picker Modal — Tap Card to Enlarge & Pick! */}
      {matchState.trackingPrompt && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-y-auto bg-black/82 p-3 text-center backdrop-blur-sm sm:p-4">
          <h3 className="hs-title hs-outline mb-1.5 text-xl font-extrabold text-emerald-300 sm:mb-2 sm:text-2xl">
            추적 — 카드를 터치해 확대 후 1장을 가져오세요
          </h3>
          <p className="mb-4 text-xs font-bold text-amber-200/85 sm:mb-5">
            선택하지 않은 나머지 카드는 버려집니다.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-5">
            {matchState.trackingPrompt.cards.map((cid, idx) => (
              <div
                key={`${cid}_${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  hsAudio.playSfx('card_hover', 0.7);
                  setZoomState({ kind: 'TRACKING_CARD', cardId: cid });
                }}
                className="cursor-pointer transition hover:scale-108"
              >
                <HearthstoneCard card={cardDb.mustGetCard(cid)} size={isCompactMobile ? 'XS' : 'MD'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Victory / Defeat Heraldry Banner & Ranked Star / Gold Reward Overlay */}
      {matchState.phase === 'GAME_OVER' && (
        <div className="fixed inset-0 z-[94] flex items-center justify-center bg-black/82 p-4 backdrop-blur-md">
          <div className="hs-wood-panel relative flex w-full max-w-md flex-col items-center overflow-hidden rounded-3xl p-6 text-center text-amber-100 sm:p-7">
            {matchState.winner === 'PLAYER' && (
              <img
                src="/stone-assets/ui/hs_godrays1.webp"
                alt=""
                className="pointer-events-none absolute -top-16 h-80 w-80 animate-[hsSlowSpin_24s_linear_infinite] object-contain opacity-45 mix-blend-screen"
              />
            )}

            <img
              src={
                matchState.winner === 'PLAYER'
                  ? '/stone-assets/ui/medal_legend.webp'
                  : '/stone-assets/ui/medal_bronze.webp'
              }
              alt=""
              className={`relative z-10 h-20 w-20 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] sm:h-24 sm:w-24 ${
                matchState.winner === 'PLAYER' ? '' : 'grayscale opacity-75'
              }`}
            />

            <h2
              className={`hs-title hs-outline relative z-10 mt-2 text-3xl font-extrabold sm:text-4xl ${
                matchState.winner === 'PLAYER' ? 'text-yellow-300' : 'text-slate-300'
              }`}
            >
              {matchState.winner === 'PLAYER' ? '승리!' : '패배'}
            </h2>
            <p className="relative z-10 mt-1 text-xs font-bold text-amber-200/90">
              {matchState.winner === 'PLAYER'
                ? `${matchState.opponent.name}의 초상화가 산산조각 나며 승리를 거두었습니다!`
                : '아군 영웅이 쓰러졌습니다. 덱을 가다듬고 다시 도전해 보세요!'}
            </p>

            {outcomeSummary && (
              <div className="relative z-10 my-4 w-full space-y-2 rounded-2xl border-2 border-[#c8a158]/55 bg-black/45 p-3.5 text-sm sm:my-5 sm:p-4">
                {outcomeSummary.goldEarned > 0 && (
                  <div className="flex items-center justify-center gap-1.5 font-extrabold text-yellow-300">
                    <HsGoldCoinIcon size={20} />
                    <span>승리 · 퀘스트 보상: +{outcomeSummary.goldEarned} 골드 획득!</span>
                  </div>
                )}
                {mode === 'RANKED' && (
                  <div className="text-xs font-bold text-amber-100">
                    등급 현황:{' '}
                    <span className="text-sky-300">
                      {outcomeSummary.newRank === 0
                        ? '전설 등급!'
                        : `${outcomeSummary.newRank}등급 (${CLASSIC_RANK_NAMES[outcomeSummary.newRank]}) · ★${outcomeSummary.newStars}`}
                    </span>
                    {outcomeSummary.streakBonus && (
                      <span className="ml-1.5 rounded bg-amber-600 px-1.5 py-0.5 text-[10px] text-white">
                        연승 별 ×2!
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                hsAudio.playSfx('menu_select');
                hsAudio.playBgm('tavern_hub');
                onExitBattle();
              }}
              className="hs-arcane-btn hs-title hs-outline-sm relative z-10 w-full rounded-2xl py-3 text-lg font-extrabold text-white"
            >
              여관으로 돌아가기
            </button>
          </div>
        </div>
      )}

      {/* Physical Card Lunge -> Impact -> Recoil Overlay */}
      {attackAnim && (() => {
        const isPlayerSide = attackAnim.side === 'PLAYER';
        const dx = attackAnim.targetX - attackAnim.startX;
        const dy = attackAnim.targetY - attackAnim.startY;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const ux = dx / dist;
        const uy = dy / dist;
        const lungeX = attackAnim.targetX - ux * 28;
        const lungeY = attackAnim.targetY - uy * 28;
        const windupX = attackAnim.startX - ux * 16;
        const windupY = attackAnim.startY - uy * 16;

        let cx = attackAnim.startX;
        let cy = attackAnim.startY;
        let scale = 1.18;
        let rot = isPlayerSide ? -4 : 4;
        let opacity = 1;
        let transitionCss = 'transform 115ms cubic-bezier(0.22, 1, 0.36, 1), opacity 140ms ease';

        if (attackAnim.phase === 'WINDUP') {
          cx = windupX;
          cy = windupY;
          scale = 1.24;
          rot = isPlayerSide ? -7 : 7;
        } else if (attackAnim.phase === 'LUNGE') {
          cx = lungeX;
          cy = lungeY;
          scale = 1.32;
          rot = isPlayerSide ? 6 : -6;
          transitionCss = 'transform 155ms cubic-bezier(0.15, 0.85, 0.25, 1)';
        } else if (attackAnim.phase === 'IMPACT_RETURN') {
          cx = attackAnim.startX;
          cy = attackAnim.startY;
          scale = attackAnim.attackerWillDie ? 0.55 : 1.0;
          rot = 0;
          opacity = attackAnim.attackerWillDie ? 0 : 1;
          transitionCss = 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 210ms ease-out';
        }

        return (
          <div className="pointer-events-none fixed inset-0 z-[75] overflow-hidden">
            <svg className="absolute inset-0 h-full w-full">
              {attackAnim.phase === 'LUNGE' && (
                <>
                  <line
                    x1={attackAnim.startX}
                    y1={attackAnim.startY}
                    x2={lungeX}
                    y2={lungeY}
                    stroke={isPlayerSide ? 'rgba(56,189,248,0.65)' : 'rgba(248,113,113,0.65)'}
                    strokeWidth={8}
                    strokeLinecap="round"
                  />
                  <circle
                    cx={attackAnim.targetX}
                    cy={attackAnim.targetY}
                    r={38}
                    fill="rgba(239,68,68,0.16)"
                    stroke="#fca5a5"
                    strokeWidth={3.5}
                    strokeDasharray="10 6"
                  />
                </>
              )}
              {attackAnim.phase === 'IMPACT_RETURN' && (
                <g transform={`translate(${attackAnim.targetX}, ${attackAnim.targetY})`}>
                  <circle
                    r={58}
                    fill="rgba(251,191,36,0.22)"
                    stroke="#fde047"
                    strokeWidth={4}
                  />
                  <line x1={-46} y1={-36} x2={46} y2={36} stroke="#fef08a" strokeWidth={6} strokeLinecap="round" />
                  <line x1={46} y1={-36} x2={-46} y2={36} stroke="#f87171" strokeWidth={5} strokeLinecap="round" />
                </g>
              )}
            </svg>

            <div
              style={{
                left: 0,
                top: 0,
                transform: `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%) scale(${scale}) rotate(${rot}deg)`,
                opacity,
                transition: transitionCss,
                willChange: 'transform, opacity',
              }}
              className="absolute"
            >
              <div
                style={{
                  background: attackAnim.isHeroAttacker
                    ? attackAnim.frameGradient
                    : 'radial-gradient(circle at 50% 35%, #475569 0%, #0f172a 100%)',
                  boxShadow: isPlayerSide
                    ? '0 24px 36px rgba(0,0,0,0.92), 0 0 24px rgba(56,189,248,0.95)'
                    : '0 24px 36px rgba(0,0,0,0.92), 0 0 24px rgba(248,113,113,0.95)',
                }}
                className={`relative overflow-hidden border-[3.5px] ${
                  attackAnim.isHeroAttacker
                    ? 'h-[82px] w-[72px] rounded-t-[40px] rounded-b-xl border-[#f5d98e] sm:h-[116px] sm:w-[100px] sm:rounded-t-[52px]'
                    : `h-[74px] w-[58px] rounded-[50%] sm:h-[112px] sm:w-[88px] ${
                        isPlayerSide ? 'border-sky-300' : 'border-red-400'
                      }`
                }`}
              >
                <img
                  src={attackAnim.artUrl}
                  alt={attackAnim.nameKo}
                  draggable={false}
                  className="pointer-events-none absolute inset-0 h-full w-full scale-[1.06] object-cover object-center"
                />
                {attackAnim.divineShield && (
                  <div className="pointer-events-none absolute inset-0 rounded-[50%] border-2 border-yellow-200 bg-yellow-300/25" />
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Universal Enlarged Card Inspection & Bottom Action Modal */}
      {renderActiveZoomModal()}
    </div>
  );
};
