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
import { KadanJourneyStoryModal } from '../components/KadanJourneyStoryModal';
import { useModalDismiss } from '../useModalDismiss';
import {
  SNS_LOCATIONS,
  SnsBoosterPackArt,
  SnsCardBackArt,
  SnsRankMedallion,
} from '../components/SnsHeroArtKit';
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
import {
  buildJourneyBossDeck,
  buildJourneyPlayerDeckAndMultipliers,
  getJourneyDifficultySpec,
  getJourneyEpisodeDef,
} from '../kadanJourneyData';
import { OpenedPackCard, hsStorage } from '../storage';
import {
  clientToStagePoint,
  elementCenterInStage,
  getStageSize,
} from '../stageCoords';
import {
  ActionHistoryItem,
  BattleMatchState,
  BoardThemeId,
  CLASSIC_HEROES,
  CustomDeck,
  GameMode,
  HeroClass,
  MatchRewardBreakdown,
  MinionInstance,
  PlayerBattleState,
  PlayerSide,
} from '../types';
import { BoardVfxCanvas, recordEntityStagePosition } from '../vfx/BoardVfxCanvas';

export interface BattleScreenProps {
  mode: GameMode;
  playerDeck: CustomDeck;
  preferredOpponentClass?: HeroClass;
  preferredBoardTheme?: BoardThemeId;
  journeyEpisodeOverride?: number;
  skipStoryIntro?: boolean;
  onOpenOptions: (concedeHandler: () => void) => void;
  onExitBattle: () => void;
  onOpenShopFromBattle?: () => void;
  onGoOpenPacksFromBattle?: () => void;
  onGoCollectionFromBattle?: () => void;
  onStartJourneyEpisode?: (episode: number, skipStoryIntro?: boolean) => void;
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

interface ActiveAttackAnim {
  id: number;
  side: PlayerSide;
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
  rarity?: string;
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

const BOARD_BG_URL: Record<BoardThemeId, string> = {
  STORMWIND: SNS_LOCATIONS.BOARD_LIGHTHAVEN,
  ORGRIMMAR: SNS_LOCATIONS.BOARD_RED_PALACE,
  PANDARIA: SNS_LOCATIONS.BOARD_WIND_ISLE,
};

const BOARD_CORNER_TOYS: Record<
  BoardThemeId,
  { pos: 'TL' | 'TR' | 'BL' | 'BR'; icon: string; name: string; reaction: string }[]
> = {
  STORMWIND: [
    { pos: 'TL', icon: '🔔', name: '엘윈마을 설원 종탑', reaction: '땡~ 땡~! 엘윈마을 설원 종탑의 종소리가 맑게 울려 퍼집니다!' },
    { pos: 'TR', icon: '🏮', name: '설원 온기 등불', reaction: '화르륵! 엘윈마을 청동 등불이 따스하게 타오릅니다!' },
    { pos: 'BL', icon: '🛡', name: '눈꽃 방패 거치대', reaction: '챙! 카단의 눈꽃 방패에서 푸른 서리빛이 반짝입니다!' },
    { pos: 'BR', icon: '❄️', name: '엘윈 빙결 수정', reaction: '반짝! 만년설 빙결 수정 속에서 오로라 빛이 춤춥니다!' },
  ],
  ORGRIMMAR: [
    { pos: 'TL', icon: '🔥', name: '불꽃 성채 화로', reaction: '활활! 불꽃 성채의 용암 화로에서 뜨거운 불길이 솟구칩니다!' },
    { pos: 'TR', icon: '⚒', name: '황금 제련 모루', reaction: '깡! 깡! 달궈진 강철 모루에서 불꽃 파편이 튱니다!' },
    { pos: 'BL', icon: '🦁', name: '태양 사자 부조', reaction: '크르르! 성채 수호 사자상의 붉은 보석 눈이 번쩍입니다!' },
    { pos: 'BR', icon: '🥁', name: '결투장 전고', reaction: '둥! 둥! 불꽃 성채 결투장의 우렁찬 북소리가 울립니다!' },
  ],
  PANDARIA: [
    { pos: 'TL', icon: '🎐', name: '바람 신전 비취 풍경', reaction: '딸랑~! 바람의 신전 비취 풍경 소리가 은은하게 퍼집니다!' },
    { pos: 'TR', icon: '🌊', name: '천공 폭포 수차', reaction: '쏴아아~ 구름 너머 천공 폭포수가 시원하게 쏟아집니다!' },
    { pos: 'BL', icon: '🏹', name: '청풍 활터 과녁', reaction: '핑— 퍽! 바람 화살이 과녁 정중앙을 꿰뚫었습니다!' },
    { pos: 'BR', icon: '🍃', name: '신록의 에메랄드 석등', reaction: '반짝~ 에메랄드 룬 석등에서 청량한 바람 기운이 피어오릅니다!' },
  ],
};

const EndTurnLeverPlate: React.FC<{
  isPlayerTurn: boolean;
  noMovesLeft: boolean;
  compact?: boolean;
}> = ({ isPlayerTurn, noMovesLeft, compact = false }) => {
  const fillGrad = !isPlayerTurn
    ? 'linear-gradient(180deg, #57534e 0%, #292524 55%, #1c1917 100%)'
    : noMovesLeft
      ? 'linear-gradient(180deg, #34d399 0%, #059669 52%, #064e3b 100%)'
      : 'linear-gradient(180deg, #fde047 0%, #d97706 52%, #78350f 100%)';

  const rimColor = !isPlayerTurn ? '#78716c' : noMovesLeft ? '#a7f3d0' : '#fef08a';

  return (
    <div
      style={{
        background: fillGrad,
        borderColor: rimColor,
        boxShadow: !isPlayerTurn
          ? 'inset 0 1px 1px rgba(255,255,255,0.25), 0 4px 10px rgba(0,0,0,0.8)'
          : noMovesLeft
            ? '0 0 18px rgba(52,211,153,0.9), inset 0 1.5px 1px rgba(255,255,255,0.8)'
            : '0 6px 14px rgba(0,0,0,0.85), inset 0 1.5px 1px rgba(255,255,255,0.85)',
      }}
      className={`flex h-full w-full items-center justify-center rounded-2xl border-[2.5px] px-2 ${
        compact ? 'rounded-xl border-2' : ''
      }`}
    >
      <span
        className={`hs-title hs-outline-sm font-extrabold tracking-wide ${
          compact ? 'text-[10.5px]' : 'text-xs'
        } ${!isPlayerTurn ? 'text-stone-300' : 'text-white'}`}
      >
        {!isPlayerTurn ? '상대 턴' : noMovesLeft ? '할 일 없음' : '턴 종료'}
      </span>
    </div>
  );
};

export const BattleScreen: React.FC<BattleScreenProps> = ({
  mode,
  playerDeck,
  preferredOpponentClass,
  preferredBoardTheme,
  journeyEpisodeOverride,
  skipStoryIntro = false,
  onOpenOptions,
  onExitBattle,
  onOpenShopFromBattle,
  onGoOpenPacksFromBattle,
  onGoCollectionFromBattle,
  onStartJourneyEpisode,
}) => {
  const buildBattleMatchState = useCallback(
    (targetEpisode?: number): BattleMatchState => {
      if (mode === 'TUTORIAL') {
        hsStorage.markJourneyGuideDone();
        const curProfile = hsStorage.getProfile();
        const ep = targetEpisode ?? journeyEpisodeOverride ?? curProfile.journeyEpisode;
        const reinc = curProfile.journeyReincarnation;
        const epDef = getJourneyEpisodeDef(ep);
        const diffSpec = getJourneyDifficultySpec(ep, reinc);
        const col = hsStorage.getCollection();
        const playerJourney = buildJourneyPlayerDeckAndMultipliers(col);
        const bossDeck = buildJourneyBossDeck(epDef.bossHeroClass, ep, reinc);

        return createBattleMatch({
          mode: 'TUTORIAL',
          playerName: epDef.playerHeroSpec.heroNameKo,
          playerClass: 'PRIEST',
          playerDeck: playerJourney.deckCards,
          playerCustomHero: epDef.playerHeroSpec,
          opponentName: epDef.bossNameKo,
          opponentClass: epDef.bossHeroClass,
          opponentDeck: bossDeck,
          opponentCustomHero: epDef.bossHeroSpec,
          boardTheme: diffSpec.boardTheme,
          journeyMeta: {
            episode: epDef.episode,
            reincarnation: reinc,
            episodeTitle: epDef.titleKo,
            actTitle: epDef.actTitle,
            opponentTitle: epDef.bossHeroSpec.titleKo,
            enemyHeroHealth: diffSpec.enemyHeroHealth,
            enemyStatScale: diffSpec.enemyStatScale,
            playerCardMultipliers: playerJourney.playerCardMultipliers,
          },
        });
      }

      const opp = buildAiOpponentSetup(mode, preferredOpponentClass);
      return createBattleMatch({
        mode,
        playerName: '엘윈마을 모험가',
        playerClass: playerDeck.heroClass,
        playerDeck: playerDeck.cards,
        opponentName: opp.opponentName,
        opponentClass: opp.opponentClass,
        opponentDeck: opp.opponentDeck,
        boardTheme: preferredBoardTheme,
      });
    },
    [mode, playerDeck, preferredOpponentClass, preferredBoardTheme, journeyEpisodeOverride],
  );

  const [matchState, setMatchState] = useState<BattleMatchState>(() =>
    buildBattleMatchState(),
  );
  const [liveProfile, setLiveProfile] = useState(() => hsStorage.getProfile());

  // 카단의 여정 = 에피소드 스토리 극장 먼저 오픈(패배 직후 단일 카드 뽑기 재도전 시에는 즉시 전투!) + 자동 플레이 기본 ON
  // 나머지 모드(대전/수련) = 스토리 없이 즉시 대결 + 수동 플레이 기본
  const [storyPhase, setStoryPhase] = useState<'PRE_BATTLE' | 'CLOSED' | 'REVIEW'>(() =>
    mode === 'TUTORIAL' && !skipStoryIntro ? 'PRE_BATTLE' : 'CLOSED',
  );
  const [autoPlay, setAutoPlay] = useState<boolean>(() => mode === 'TUTORIAL');

  const [vsIntroActive, setVsIntroActive] = useState(
    () => mode !== 'TUTORIAL' || skipStoryIntro,
  );
  const [selection, setSelection] = useState<PendingSelection | null>(null);
  const [zoomState, setZoomState] = useState<BattleZoomState | null>(null);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [emoteMenuOpen, setEmoteMenuOpen] = useState(false);

  useModalDismiss(Boolean(selection), () => {
    hsAudio.playSfx('ui_click', 0.45);
    setSelection(null);
  });
  useModalDismiss(emoteMenuOpen, () => setEmoteMenuOpen(false));
  useModalDismiss(mobileHistoryOpen, () => setMobileHistoryOpen(false));
  const [isCompactMobile, setIsCompactMobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.innerWidth < 640 &&
      window.innerHeight >= window.innerWidth,
  );
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [insertPreviewIdx, setInsertPreviewIdx] = useState<number>(0);

  const [hoveredBoardMinion, setHoveredBoardMinion] = useState<MinionInstance | null>(null);
  const [hoveredHistoryItem, setHoveredHistoryItem] = useState<ActionHistoryItem | null>(null);
  const [playerEmoteText, setPlayerEmoteText] = useState<string | null>(null);
  const [opponentEmoteText, setOpponentEmoteText] = useState<string | null>(null);
  const [toyToast, setToyToast] = useState<string | null>(null);
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
    durationMs: 240,
  });
  const [aiHighlightText, setAiHighlightText] = useState<string | null>(null);
  const [outcomeSummary, setOutcomeSummary] = useState<MatchRewardBreakdown | null>(null);
  const [postGameAutoPaused, setPostGameAutoPaused] = useState<boolean>(false);
  const [postGameRemainingMs, setPostGameRemainingMs] = useState<number>(3000);
  const [defeatDrawResult, setDefeatDrawResult] = useState<{
    drawn: OpenedPackCard;
    goldSpent: number;
    flipped: boolean;
  } | null>(null);
  const [drawRetryRemainingMs, setDrawRetryRemainingMs] = useState<number>(3000);
  const [attackAnim, setAttackAnim] = useState<ActiveAttackAnim | null>(null);

  const friendlyRowRef = useRef<HTMLDivElement | null>(null);
  const recordedResultRef = useRef(false);
  const postGameFiredRef = useRef(false);
  const drawRetryFiredRef = useRef(false);
  const matchStateRef = useRef<BattleMatchState>(matchState);
  matchStateRef.current = matchState;
  const attackLockRef = useRef(false);
  const attackSeqRef = useRef(0);
  const attackTimersRef = useRef<number[]>([]);
  const shakeTimerRef = useRef<number | null>(null);
  const activeShakeRef = useRef<{ until: number; strength: number }>({ until: 0, strength: 0 });
  const profile = liveProfile;

  useEffect(() => {
    return () => {
      for (const tid of attackTimersRef.current) window.clearTimeout(tid);
      attackTimersRef.current = [];
      if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
      attackLockRef.current = false;
    };
  }, []);

  const resolveHeroPortraitUrl = useCallback((p: PlayerBattleState): string => {
    if (p.isJaraxxus) return '/anime-character-sheets/cutouts/080_Ironforge.png';
    if (p.customHero?.portraitUrl) return p.customHero.portraitUrl;
    return getHeroArtUrl(CLASSIC_HEROES[p.heroClass].heroId);
  }, []);

  const resolveHistoryIconUrl = useCallback(
    (item: ActionHistoryItem): string => {
      const p = item.actorSide === 'PLAYER' ? matchState.player : matchState.opponent;
      if (
        p.customHero &&
        (item.cardId === p.heroId || item.cardId === p.heroPowerId || item.kind === 'HERO_POWER')
      ) {
        return p.customHero.portraitUrl;
      }
      return getCardTileUrl(item.cardId);
    },
    [matchState.player, matchState.opponent],
  );

  useEffect(() => {
    const syncProfile = () => setLiveProfile(hsStorage.getProfile());
    window.addEventListener('snshero:state-changed', syncProfile);
    return () => window.removeEventListener('snshero:state-changed', syncProfile);
  }, []);

  const journeyDeckStats = useMemo(() => {
    const multMap: Record<string, number> =
      matchState.journeyMeta?.playerCardMultipliers || {};
    const vals: number[] = Object.values(multMap);
    return {
      boostedCount: vals.filter((v) => v > 1).length,
      maxMultiplier: vals.length > 0 ? Math.max(1, ...vals) : 1,
    };
  }, [matchState.journeyMeta]);

  const getPlayerCardMult = useCallback(
    (cardId: string): number => {
      if (mode !== 'TUTORIAL') return 1;
      return matchState.journeyMeta?.playerCardMultipliers[cardId] || 1;
    },
    [mode, matchState.journeyMeta],
  );

  const engine = useMemo(() => createEngine(matchState), [matchState]);
  const playerSpellPower = engine.getTotalSpellPower('PLAYER');
  const playerVelenMult = matchState.player.board.some(
    (m) => !m.silenced && m.cardId === 'EX1_350',
  )
    ? 2
    : 1;

  // Ensure removed/destroyed/returned minions or evicted history entries NEVER linger beside End Turn
  const liveHoveredBoardMinion = useMemo(() => {
    if (!hoveredBoardMinion || matchState.phase !== 'PLAYING') return null;
    return (
      matchState.player.board.find((m) => m.uid === hoveredBoardMinion.uid) ||
      matchState.opponent.board.find((m) => m.uid === hoveredBoardMinion.uid) ||
      null
    );
  }, [hoveredBoardMinion, matchState.phase, matchState.player.board, matchState.opponent.board]);

  const liveHoveredHistoryItem = useMemo(() => {
    if (!hoveredHistoryItem) return null;
    return matchState.history.slice(0, 7).find((it) => it.id === hoveredHistoryItem.id) || null;
  }, [hoveredHistoryItem, matchState.history]);

  useEffect(() => {
    if (hoveredBoardMinion && !liveHoveredBoardMinion) {
      setHoveredBoardMinion(null);
    }
  }, [hoveredBoardMinion, liveHoveredBoardMinion]);

  useEffect(() => {
    if (hoveredHistoryItem && !liveHoveredHistoryItem) {
      setHoveredHistoryItem(null);
    }
  }, [hoveredHistoryItem, liveHoveredHistoryItem]);

  // Opening VS Clash + Matchup Fanfare (runs immediately for non-TUTORIAL or skipStoryIntro retry, or right after Story Theater closes in TUTORIAL)
  useEffect(() => {
    hsAudio.playBgm('mulligan');
    if (mode === 'TUTORIAL' && !skipStoryIntro) return;
    hsAudio.playMatchupAnnouncement(matchState.player.heroClass, matchState.opponent.heroClass);
    const t1 = window.setTimeout(() => {
      setVsIntroActive(false);
      hsAudio.playHeroVo(matchState.opponent.heroClass, 'start');
      if (matchState.opponent.customHero?.emotesKo.start) {
        setOpponentEmoteText(matchState.opponent.customHero.emotesKo.start);
        window.setTimeout(() => setOpponentEmoteText(null), 2900);
      }
    }, skipStoryIntro ? 1450 : 2200);
    return () => clearTimeout(t1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCompletePreBattleStory = useCallback(
    (selectedEpisode?: number) => {
      const curP = hsStorage.getProfile();
      let activeMatch = matchState;
      if (
        mode === 'TUTORIAL' &&
        selectedEpisode &&
        selectedEpisode !== matchState.journeyMeta?.episode
      ) {
        hsStorage.setJourneyProgress(selectedEpisode, curP.journeyReincarnation);
        activeMatch = buildBattleMatchState(selectedEpisode);
        setMatchState(activeMatch);
      }
      setStoryPhase('CLOSED');
      setVsIntroActive(true);
      hsAudio.playMatchupAnnouncement(
        activeMatch.player.heroClass,
        activeMatch.opponent.heroClass,
      );
      window.setTimeout(() => {
        setVsIntroActive(false);
        hsAudio.playHeroVo(activeMatch.opponent.heroClass, 'start');
        if (activeMatch.opponent.customHero?.emotesKo.start) {
          setOpponentEmoteText(activeMatch.opponent.customHero.emotesKo.start);
          window.setTimeout(() => setOpponentEmoteText(null), 2900);
        }
      }, 1650);
    },
    [mode, matchState, buildBattleMatchState],
  );

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
    const onResize = () =>
      setIsCompactMobile(
        window.innerWidth < 640 && window.innerHeight >= window.innerWidth,
      );
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  // Record match outcome & rewards once when GAME_OVER triggers
  useEffect(() => {
    if (matchState.phase === 'GAME_OVER' && !recordedResultRef.current) {
      recordedResultRef.current = true;
      setSelection(null);
      setZoomState(null);
      setAiHighlightText(null);
      const didWin = matchState.winner === 'PLAYER';
      if (didWin) {
        hsAudio.playHeroVo(matchState.opponent.heroClass, 'concede');
        if (matchState.opponent.customHero?.emotesKo.concede) {
          setOpponentEmoteText(matchState.opponent.customHero.emotesKo.concede);
        }
      } else {
        hsAudio.playHeroVo(matchState.player.heroClass, 'concede');
        if (matchState.player.customHero?.emotesKo.concede) {
          setPlayerEmoteText(matchState.player.customHero.emotesKo.concede);
        }
      }
      const summary = hsStorage.recordMatchOutcome(
        matchState.player.heroClass,
        didWin,
        mode,
        matchState.opponent.heroClass,
      );
      setOutcomeSummary(summary);
      setLiveProfile(hsStorage.getProfile());
      setPostGameRemainingMs(3000);
      postGameFiredRef.current = false;
    }
  }, [
    matchState.phase,
    matchState.winner,
    matchState.player.heroClass,
    matchState.opponent.heroClass,
    mode,
  ]);

  const triggerDefeatSingleCardDraw = useCallback(() => {
    const res = hsStorage.drawSingleReinforcementCard();
    setLiveProfile(hsStorage.getProfile());
    hsAudio.playSfx('pack_open', 0.9);
    setDefeatDrawResult({ ...res, flipped: false });
    setDrawRetryRemainingMs(3000);
    drawRetryFiredRef.current = false;

    window.setTimeout(() => {
      setDefeatDrawResult((prev) => (prev ? { ...prev, flipped: true } : null));
      const rar = res.drawn.card.rarity;
      if (rar === 'LEGENDARY') {
        hsAudio.playSfx('pack_legendary', 0.95);
        hsAudio.playInnkeeper(res.drawn.isGolden ? 'golden_legendary' : 'legendary');
      } else if (rar === 'EPIC') {
        hsAudio.playSfx('pack_epic', 0.9);
        hsAudio.playInnkeeper(res.drawn.isGolden ? 'golden_epic' : 'epic');
      } else if (rar === 'RARE') {
        hsAudio.playSfx('pack_rare', 0.85);
        hsAudio.playInnkeeper(res.drawn.isGolden ? 'golden_rare' : 'rare');
      } else if (res.drawn.isGolden) {
        hsAudio.playSfx('pack_rare', 0.78);
        hsAudio.playInnkeeper('golden_common');
      } else {
        hsAudio.playSfx('card_flip', 0.85);
      }
    }, 220);
  }, []);

  // Auto-advance Victory / Defeat popup after 3 seconds when Auto-Play is ON
  useEffect(() => {
    if (
      matchState.phase !== 'GAME_OVER' ||
      !outcomeSummary ||
      !autoPlay ||
      postGameAutoPaused ||
      defeatDrawResult !== null
    ) {
      return;
    }

    const tickMs = 100;
    const id = window.setInterval(() => {
      setPostGameRemainingMs((prev) => {
        const next = Math.max(0, prev - tickMs);
        if (next === 0 && !postGameFiredRef.current) {
          postGameFiredRef.current = true;
          window.setTimeout(() => {
            if (matchState.winner === 'PLAYER') {
              if (
                mode === 'TUTORIAL' &&
                onStartJourneyEpisode &&
                outcomeSummary.nextEpisode
              ) {
                hsAudio.playSfx('box_press');
                onStartJourneyEpisode(outcomeSummary.nextEpisode, false);
              } else {
                hsAudio.playSfx('menu_select');
                hsAudio.playBgm('tavern_hub');
                onExitBattle();
              }
            } else if (mode === 'TUTORIAL') {
              triggerDefeatSingleCardDraw();
            } else {
              hsAudio.playSfx('menu_select');
              hsAudio.playBgm('tavern_hub');
              onExitBattle();
            }
          }, 0);
        }
        return next;
      });
    }, tickMs);

    return () => window.clearInterval(id);
  }, [
    matchState.phase,
    matchState.winner,
    outcomeSummary,
    autoPlay,
    postGameAutoPaused,
    defeatDrawResult,
    mode,
    onStartJourneyEpisode,
    onExitBattle,
    triggerDefeatSingleCardDraw,
  ]);

  // After drawing 1 reinforcement card on Defeat, auto-retry the SAME episode after 3 seconds!
  useEffect(() => {
    if (
      !defeatDrawResult ||
      !autoPlay ||
      postGameAutoPaused ||
      !onStartJourneyEpisode
    ) {
      return;
    }

    const retryEp = matchState.journeyMeta?.episode || profile.journeyEpisode || 1;
    const tickMs = 100;
    const id = window.setInterval(() => {
      setDrawRetryRemainingMs((prev) => {
        const next = Math.max(0, prev - tickMs);
        if (next === 0 && !drawRetryFiredRef.current) {
          drawRetryFiredRef.current = true;
          window.setTimeout(() => {
            hsAudio.playSfx('box_press');
            onStartJourneyEpisode(retryEp, true);
          }, 0);
        }
        return next;
      });
    }, tickMs);

    return () => window.clearInterval(id);
  }, [
    defeatDrawResult,
    autoPlay,
    postGameAutoPaused,
    onStartJourneyEpisode,
    matchState.journeyMeta?.episode,
    profile.journeyEpisode,
  ]);

  // 75-second Turn Timer + 15-second Burning Rope Fuse!
  useEffect(() => {
    if (
      storyPhase !== 'CLOSED' ||
      matchState.phase !== 'PLAYING' ||
      matchState.activeSide !== 'PLAYER'
    ) {
      return;
    }
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
  }, [storyPhase, matchState.phase, matchState.activeSide, matchState.turnNumber]);

  /**
   * 카드가 주고받는 데미지(공격 피해 + 반격 피해, 또는 주문 피해량)에 비례한 정밀 화면 흔들림 엔진
   * - 1~2 경미한 진동(±2px, 195ms) ➔ 4~6 일반 타격(±5.5px, 285ms) ➔ 8~11 강타(±10.5px, 385ms) ➔ 12+ 대격돌(±15~22px, 490~560ms)
   */
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
      let rotDeg: number;
      let durationMs: number;

      if (isFinisher) {
        ampX = 22;
        rotDeg = 1.45;
        durationMs = 560;
      } else if (dmg <= 2) {
        ampX = Number((1.6 + dmg * 0.85).toFixed(2));
        rotDeg = 0.16;
        durationMs = 195;
      } else if (dmg <= 4) {
        ampX = Number((2.2 + dmg * 0.95).toFixed(2));
        rotDeg = 0.34;
        durationMs = 265;
      } else if (dmg <= 7) {
        ampX = Number((3.5 + dmg * 0.95).toFixed(2));
        rotDeg = 0.58;
        durationMs = 345;
      } else if (dmg <= 11) {
        ampX = Number((4.8 + dmg * 0.88).toFixed(2));
        rotDeg = 0.88;
        durationMs = 425;
      } else {
        ampX = Number(Math.min(21, 14 + (dmg - 12) * 0.65).toFixed(2));
        rotDeg = 1.25;
        durationMs = 510;
      }

      const ampY = Number((ampX * 0.72).toFixed(2));
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

  /**
   * 오리지널 하스스톤 물리 돌진·충돌·반동 타격 애니메이션 (Physical Card Lunge -> Impact -> Recoil)
   * - 아군 수동 공격 / 아군 자동플레이 공격 / 적군 AI 공격 모두 동일하게 실제 카드 토큰·영웅 초상화가
   *   공중으로 부양(WINDUP) -> 대상에게 고속 돌진(LUNGE) -> 정면 충돌 파열 & 피해 반영(IMPACT) -> 제자리 복귀(RETURN) 수행!
   */
  const triggerPhysicalAttack = useCallback(
    (side: PlayerSide, attackerId: string, defenderId: string) => {
      if (attackLockRef.current) return;
      const cur = matchStateRef.current;
      if (cur.phase !== 'PLAYING') return;

      const enemySide: PlayerSide = side === 'PLAYER' ? 'OPPONENT' : 'PLAYER';
      const atkPlayer = side === 'PLAYER' ? cur.player : cur.opponent;
      const defPlayer = enemySide === 'PLAYER' ? cur.player : cur.opponent;
      const isHeroAttacker = attackerId === `${side}_HERO`;
      const isHeroDefender = defenderId === 'PLAYER_HERO' || defenderId === 'OPPONENT_HERO';

      const atkMinion = isHeroAttacker
        ? null
        : atkPlayer.board.find((m) => m.uid === attackerId) || null;
      if (!isHeroAttacker && !atkMinion) return;

      const defMinion = isHeroDefender
        ? null
        : defPlayer.board.find((m) => m.uid === defenderId) || null;
      if (!isHeroDefender && !defMinion) return;

      const { width: stageW, height: stageH } = getStageSize();
      const atkEl = document.querySelector(`[data-hs-entity="${attackerId}"]`);
      const defEl = document.querySelector(`[data-hs-entity="${defenderId}"]`);

      const startPos = atkEl
        ? elementCenterInStage(atkEl)
        : {
            x: stageW * 0.5,
            y: side === 'PLAYER' ? stageH * 0.62 : stageH * 0.34,
          };
      const targetPos = defEl
        ? elementCenterInStage(defEl)
        : {
            x: stageW * 0.5,
            y: enemySide === 'PLAYER' ? stageH * 0.77 : stageH * 0.17,
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
        !isHeroAttacker &&
        !atkMinion!.divineShield &&
        counterDmg >= healthVal;

      const minionDef = atkMinion ? cardDb.mustGetCard(atkMinion.cardId) : null;
      const artUrl = isHeroAttacker
        ? resolveHeroPortraitUrl(atkPlayer)
        : getCardArtUrl(minionDef!);
      const nameKo = isHeroAttacker ? atkPlayer.heroNameKo : atkMinion!.name;
      const defNameKo = isHeroDefender ? defPlayer.heroNameKo : defMinion!.name;
      const frameGradient =
        atkPlayer.customHero?.frameGradient || CLASSIC_HEROES[atkPlayer.heroClass].frameGradient;

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
        // 주고받는 총 데미지 (공격 피해 + 반격으로 받은 피해) 비례 화면 흔들림 & 안드로이드 진동 강도 차등 적용
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
    [resolveHeroPortraitUrl, triggerDamageImpact],
  );

  // ==================== PLAYER AUTO-PLAY ENGINE (카단의 여정 기본 ON, 수동 전환 즉시 해제) ====================
  useEffect(() => {
    if (!autoPlay || storyPhase !== 'CLOSED' || vsIntroActive) return;
    if (matchState.phase === 'GAME_OVER') return;
    if (attackAnim || attackLockRef.current) return;

    // 1. Auto-Mulligan: swap cards costing >= 4 and start duel!
    if (matchState.phase === 'MULLIGAN') {
      const t = window.setTimeout(() => {
        const replaceUids = matchState.player.hand
          .filter((hc) => cardDb.mustGetCard(hc.cardId).cost >= 4)
          .map((hc) => hc.uid);
        hsAudio.playSfx('box_press', 0.8);
        hsAudio.playBgm(Math.random() < 0.5 ? 'duel_1' : 'duel_2');
        const eng = createEngine(matchState);
        setMatchState(eng.confirmMulligan(replaceUids));
      }, 750);
      return () => window.clearTimeout(t);
    }

    if (matchState.phase !== 'PLAYING' || matchState.activeSide !== 'PLAYER') {
      return;
    }

    // Pause auto-play tick while player is inspecting an enlarged card
    if (zoomState) return;
    if (selection) setSelection(null);

    const timer = window.setTimeout(() => {
      if (attackLockRef.current) return;
      const sim = createEngine(matchState);

      // Handle Choose-One prompt automatically
      if (matchState.chooseOnePrompt) {
        const prompt = matchState.chooseOnePrompt;
        const opt = prompt.options[0];
        const targetId = opt.needsTarget ? opt.validTargets[0] : undefined;
        hsAudio.playSfx('card_place', 0.8);
        setMatchState(
          sim.playCardFromHand('PLAYER', prompt.sourceHandUid, {
            chooseOptionIndex: opt.index,
            insertIndex: prompt.insertIndex,
            targetId,
          }),
        );
        return;
      }

      // Handle Tracking prompt automatically
      if (matchState.trackingPrompt) {
        const pickId = matchState.trackingPrompt.cards[0];
        hsAudio.playSfx('card_place', 0.8);
        setMatchState(sim.resolveTrackingChoice(pickId));
        return;
      }

      const action: AiAction = computeNextAiAction(matchState, 'EXPERT', 'PLAYER');
      if (action.kind === 'PLAY_CARD') {
        const def = cardDb.mustGetCard(action.cardId);
        hsAudio.playSfx('card_place', 0.85);
        setAiHighlightText(`⚡ 자동 전투: [${def.name}] 사용!`);
        const next = sim.playCardFromHand('PLAYER', action.handUid, {
          targetId: action.targetId,
          insertIndex: action.insertIndex,
          chooseOptionIndex: action.chooseOptionIndex,
        });
        if (next.chooseOnePrompt === null) {
          if (def.type === 'MINION') hsStorage.recordQuestProgress('MINION', 1);
          else if (def.type === 'SPELL') hsStorage.recordQuestProgress('SPELL', 1);
        }
        setMatchState(next);
      } else if (action.kind === 'HERO_POWER') {
        hsAudio.playSfx('hero_power', 0.85);
        setAiHighlightText(`⚡ 자동 전투: 영웅 능력 [${matchState.player.heroPowerNameKo}]!`);
        setMatchState(sim.useHeroPower('PLAYER', action.targetId));
      } else if (action.kind === 'ATTACK') {
        triggerPhysicalAttack('PLAYER', action.attackerId, action.defenderId);
      } else {
        hsAudio.playSfx('end_turn', 0.85);
        setAiHighlightText(null);
        setMatchState(sim.endTurn());
      }
    }, 560);

    return () => window.clearTimeout(timer);
  }, [
    autoPlay,
    storyPhase,
    vsIntroActive,
    matchState,
    selection,
    zoomState,
    attackAnim,
    triggerPhysicalAttack,
  ]);

  // Step-by-Step Opponent AI Turn Execution Loop
  useEffect(() => {
    if (
      storyPhase !== 'CLOSED' ||
      matchState.phase !== 'PLAYING' ||
      matchState.activeSide !== 'OPPONENT'
    ) {
      if (matchState.activeSide !== 'PLAYER' && !attackAnim) setAiHighlightText(null);
      return;
    }
    if (attackAnim || attackLockRef.current) return;

    const difficulty =
      mode === 'TUTORIAL'
        ? getJourneyDifficultySpec(
            matchState.journeyMeta?.episode || 1,
            matchState.journeyMeta?.reincarnation || 0,
          ).aiDifficulty
        : mode === 'PRACTICE_NORMAL'
          ? 'NORMAL'
          : 'EXPERT';

    const timer = window.setTimeout(() => {
      if (attackLockRef.current) return;
      const action: AiAction = computeNextAiAction(matchState, difficulty, 'OPPONENT');
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
    }, 620);

    return () => clearTimeout(timer);
  }, [storyPhase, matchState, mode, attackAnim, triggerPhysicalAttack]);

  // Pointer Move & Escape Cancel
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      setPointerPos(clientToStagePoint(e.clientX, e.clientY));
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
    if (matchState.phase !== 'PLAYING' || attackAnim) return;
    const hc = matchState.player.hand.find((h) => h.uid === handUid);
    if (!hc) return;

    hsAudio.playSfx('card_hover', 0.7);
    setSelection(null);
    setZoomState({ kind: 'HAND_CARD', handUid });
  };

  // Resolve clicking a target entity (`PLAYER_HERO`, `OPPONENT_HERO`, or minion `uid`)
  const handleEntityClick = (entityId: string, isFriendlyMinionOrHero: boolean) => {
    if (matchState.phase !== 'PLAYING' || attackAnim) return;

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
          const atkId = selection.attackerId;
          setSelection(null);
          triggerPhysicalAttack('PLAYER', atkId, entityId);
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

  // Emote Trigger + Polite Rival Reply
  const triggerPlayerEmote = (
    emoteKey: 'greetings' | 'well_played' | 'thanks' | 'wow' | 'oops' | 'threaten',
  ) => {
    setEmoteMenuOpen(false);
    const pEmotes =
      matchState.player.customHero?.emotesKo || CLASSIC_HEROES[matchState.player.heroClass].emotesKo;
    setPlayerEmoteText(pEmotes[emoteKey]);
    hsAudio.playHeroVo(matchState.player.heroClass, emoteKey);
    window.setTimeout(() => setPlayerEmoteText(null), 2800);

    window.setTimeout(() => {
      const replyKey =
        emoteKey === 'greetings'
          ? 'greetings'
          : emoteKey === 'threaten'
            ? 'threaten'
            : emoteKey === 'well_played'
              ? 'thanks'
              : 'wow';
      const oEmotes =
        matchState.opponent.customHero?.emotesKo ||
        CLASSIC_HEROES[matchState.opponent.heroClass].emotesKo;
      setOpponentEmoteText(oEmotes[replyKey]);
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

    const { width: stageW, height: stageH } = getStageSize();
    let sx = stageW * 0.5;
    let sy = stageH * 0.82;
    if (selection.kind === 'ATTACKER') {
      const el = document.querySelector(`[data-hs-entity="${selection.attackerId}"]`);
      if (el) {
        const c = elementCenterInStage(el);
        sx = c.x;
        sy = c.y;
      }
    } else if (selection.kind === 'HERO_POWER') {
      sx = stageW * 0.58;
      sy = stageH * 0.77;
    } else if (selection.kind === 'HAND_CARD') {
      const el = document.querySelector(`[data-hand-uid="${selection.handUid}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        const pt = clientToStagePoint(r.left + r.width / 2, r.top + 24);
        sx = pt.x;
        sy = pt.y;
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
    if (m.divineShield) pills.push('빛의 보호막');
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

      const cardMult = getPlayerCardMult(def.id);
      return (
        <CardZoomModal
          card={def}
          effectiveCost={check.cost}
          spellPowerBonus={playerSpellPower}
          velenMultiplier={playerVelenMult}
          journeyMultiplier={cardMult}
          playableGlow={
            !canPlayNow ? 'NONE' : check.isComboReady ? 'COMBO' : 'GREEN'
          }
          subtitleBadge={`내 손패 · 보유 마나 ${matchState.player.mana}/${matchState.player.maxMana}${cardMult > 1 ? ` · 스토리모드 ×${cardMult}배` : ''}`}
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
      const cardMult = getPlayerCardMult(def.id);
      return (
        <CardZoomModal
          card={def}
          journeyMultiplier={cardMult}
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
          subtitleBadge="정찰 추적 — 가져올 카드 1장 선택 (나머지 2장 버림)"
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
          subtitleBadge={zoomState.isFriendly ? '아군 전장 영웅·동료 정보' : '적 전장 영웅·동료 정보'}
          liveStats={{
            attack: getMinionAttack(liveMinion),
            health: getMinionHealth(liveMinion),
            maxHealth: getMinionMaxHealth(liveMinion),
            statuses: buildMinionStatusPills(liveMinion),
          }}
          primaryAction={
            canSwing && validTargets.length > 0
              ? {
                  label: '이 동료로 공격 대상 선택',
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
      data-testid="battle-stage-root"
      data-shake-damage={shakeState.active ? shakeState.damage : 0}
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
          '--hs-shake-x': `${shakeState.ampX}px`,
          '--hs-shake-y': `${shakeState.ampY}px`,
          '--hs-shake-rot': `${shakeState.rotDeg}deg`,
          '--hs-shake-dur': `${shakeState.durationMs}ms`,
        } as React.CSSProperties
      }
      className={`relative flex h-full w-full select-none flex-col justify-between overflow-hidden bg-cover bg-center ${
        shakeState.active
          ? shakeState.seq % 2 === 0
            ? 'hs-damage-shake-a'
            : 'hs-damage-shake-b'
          : ''
      }`}
    >
      {/* Subtle Board Vignette (Light Center so Original Arena Art Shines Clearly!) */}
      <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-black/18 to-black/68" />

      {/* 60fps Particle & Spell Projectile Canvas */}
      <BoardVfxCanvas events={matchState.vfxQueue} onDamageImpact={triggerDamageImpact} />

      {/* Active Targeting / Placement Helper Bar (Cancelable & Inspectable on Mobile!) */}
      {selection && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-1/2 top-11 z-[76] flex w-[94%] max-w-md -translate-x-1/2 items-center justify-between gap-2 rounded-2xl border-2 border-amber-300 bg-stone-950/95 px-3 py-1.5 text-xs font-extrabold text-amber-100 shadow-2xl sm:top-14"
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
        <svg className="pointer-events-none absolute inset-0 z-[75] h-full w-full">
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

      {/* ==================== ORIGINAL HEARTHSTONE PHYSICAL CARD LUNGE / SLAM COMBAT LAYER ==================== */}
      {attackAnim &&
        (() => {
          const dx = attackAnim.targetX - attackAnim.startX;
          const dy = attackAnim.targetY - attackAnim.startY;
          const dist = Math.max(1, Math.hypot(dx, dy));
          const ux = dx / dist;
          const uy = dy / dist;
          const tiltDeg = Math.max(-18, Math.min(18, (dx / 300) * 15));
          const isCutout = attackAnim.artUrl.includes('/cutouts/');
          const isPlayerSide = attackAnim.side === 'PLAYER';

          let cx = attackAnim.startX;
          let cy = attackAnim.startY;
          let scale = 1;
          let rot = 0;
          let opacity = 1;
          let transitionCss = 'transform 110ms cubic-bezier(0.2, 0.9, 0.3, 1)';

          if (attackAnim.phase === 'WINDUP') {
            cx = attackAnim.startX - ux * 16;
            cy = attackAnim.startY - uy * 16;
            scale = 1.22;
            rot = -tiltDeg * 0.35;
            transitionCss = 'transform 110ms cubic-bezier(0.2, 0.9, 0.3, 1)';
          } else if (attackAnim.phase === 'LUNGE') {
            cx = attackAnim.targetX - ux * 14;
            cy = attackAnim.targetY - uy * 14;
            scale = 1.28;
            rot = tiltDeg;
            transitionCss = 'transform 155ms cubic-bezier(0.62, 0.04, 0.96, 0.36)';
          } else {
            // IMPACT_RETURN
            if (attackAnim.attackerWillDie) {
              cx = attackAnim.startX + dx * 0.48;
              cy = attackAnim.startY + dy * 0.48;
              scale = 0.78;
              rot = tiltDeg * 0.5;
              opacity = 0;
            } else {
              cx = attackAnim.startX;
              cy = attackAnim.startY;
              scale = 1.0;
              rot = 0;
              opacity = 1;
            }
            transitionCss =
              'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 215ms ease-out';
          }

          return (
            <div className="pointer-events-none absolute inset-0 z-[84] overflow-hidden">
              {/* Directional Attack Wake Line + Target Lock Ring */}
              <svg className="absolute inset-0 h-full w-full">
                {(attackAnim.phase === 'WINDUP' || attackAnim.phase === 'LUNGE') && (
                  <>
                    <line
                      x1={attackAnim.startX}
                      y1={attackAnim.startY}
                      x2={attackAnim.targetX}
                      y2={attackAnim.targetY}
                      stroke={isPlayerSide ? 'rgba(56,189,248,0.72)' : 'rgba(248,113,113,0.78)'}
                      strokeWidth={6}
                      strokeDasharray="14 10"
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
                    <line
                      x1={-46}
                      y1={-36}
                      x2={46}
                      y2={36}
                      stroke="#fef08a"
                      strokeWidth={6}
                      strokeLinecap="round"
                    />
                    <line
                      x1={46}
                      y1={-36}
                      x2={-46}
                      y2={36}
                      stroke="#f87171"
                      strokeWidth={5}
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </svg>

              {/* Physical Flying Attacker Token (Minion Oval or Hero Arch Portrait) */}
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
                    className={
                      isCutout
                        ? 'pointer-events-none absolute left-1/2 top-[3%] h-[156%] w-[124%] max-w-none -translate-x-1/2 object-cover object-top'
                        : 'pointer-events-none absolute inset-0 h-full w-full scale-[1.06] object-cover object-center'
                    }
                  />
                  {attackAnim.divineShield && (
                    <div className="pointer-events-none absolute inset-0 rounded-[50%] border-2 border-yellow-200 bg-yellow-300/25" />
                  )}
                </div>

                {/* Attacker Nameplate + Live Attack / Health Badges */}
                <div className="hs-outline-sm absolute left-1/2 top-[60%] z-20 -translate-x-1/2 whitespace-nowrap rounded-md border border-amber-300/70 bg-stone-950/90 px-1.5 py-0.2 text-[9.5px] font-extrabold text-amber-100 shadow sm:text-[10.5px]">
                  {attackAnim.nameKo}
                </div>
                <div className="hs-num absolute -bottom-1.5 -left-2 z-30 flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-100 bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-800 text-xs font-black text-white shadow-lg sm:h-8 sm:w-8 sm:text-sm">
                  ⚔{attackAnim.attackVal}
                </div>
                <div className="hs-num absolute -bottom-1.5 -right-2 z-30 flex h-7 w-7 items-center justify-center rounded-full border-2 border-rose-100 bg-gradient-to-b from-red-400 via-red-600 to-red-950 text-xs font-black text-white shadow-lg sm:h-8 sm:w-8 sm:text-sm">
                  {attackAnim.healthVal}
                </div>
              </div>

              {/* Crisp Hearthstone Red Starburst Impact Damage Splats right at Collision Point! */}
              {attackAnim.phase === 'IMPACT_RETURN' && attackAnim.defenderDamage > 0 && (
                <div
                  style={{
                    left: attackAnim.targetX,
                    top: attackAnim.targetY,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-40 flex h-16 w-16 animate-[hsCardPop_0.22s_ease-out] items-center justify-center rounded-full border-[3px] border-yellow-200 bg-gradient-to-b from-red-500 via-red-700 to-rose-950 shadow-[0_0_26px_rgba(239,68,68,0.98)] sm:h-20 sm:w-20"
                >
                  <span className="hs-num hs-outline text-2xl font-black text-white sm:text-3xl">
                    -{attackAnim.defenderDamage}
                  </span>
                </div>
              )}

              {attackAnim.phase === 'IMPACT_RETURN' && attackAnim.attackerCounterDamage > 0 && (
                <div
                  style={{
                    left: attackAnim.targetX - ux * 58,
                    top: attackAnim.targetY - uy * 58,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-40 flex h-13 w-13 animate-[hsCardPop_0.22s_ease-out] items-center justify-center rounded-full border-2 border-amber-200 bg-gradient-to-b from-orange-500 via-red-700 to-stone-950 shadow-[0_0_20px_rgba(249,115,22,0.95)] sm:h-15 sm:w-15"
                >
                  <span className="hs-num hs-outline text-lg font-black text-white sm:text-2xl">
                    -{attackAnim.attackerCounterDamage}
                  </span>
                </div>
              )}
            </div>
          );
        })()}

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
            className={`absolute ${posCls} z-30 hidden h-12 w-12 items-center justify-center rounded-2xl border-2 border-amber-400/50 bg-stone-950/65 text-2xl shadow-xl transition hover:scale-115 hover:border-amber-200 active:scale-90 md:flex`}
          >
            {toy.icon}
          </button>
        );
      })}

      {/* Left Action History Bar (Desktop / Tablet >= sm) */}
      <aside className="absolute left-2.5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-1.5 rounded-2xl border-2 border-[#a88344] bg-stone-950/80 p-1.5 shadow-2xl sm:flex">
        <div className="text-center text-[9px] font-extrabold text-amber-300">기록</div>
        {matchState.history.slice(0, 7).map((item) => (
          <div
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              hsAudio.playSfx('card_hover', 0.65);
              setZoomState({ kind: 'HISTORY_ITEM', item });
            }}
            onPointerEnter={(e) => {
              if (e.pointerType !== 'mouse') return;
              setHoveredHistoryItem(item);
            }}
            onPointerLeave={(e) => {
              if (e.pointerType !== 'mouse') return;
              setHoveredHistoryItem((prev) => (prev?.id === item.id ? null : prev));
            }}
            className={`relative h-9 w-9 cursor-pointer overflow-hidden rounded-lg border-2 shadow transition hover:scale-110 ${
              item.actorSide === 'PLAYER' ? 'border-sky-400' : 'border-red-500'
            }`}
          >
            <img
              src={resolveHistoryIconUrl(item)}
              alt={item.title}
              className="h-full w-full object-cover object-top"
            />
          </div>
        ))}
        {matchState.history.length === 0 && (
          <div className="px-1 py-3 text-[9px] text-stone-500">대기</div>
        )}
      </aside>

      {/* History Hover Card Tooltip */}
      {liveHoveredHistoryItem && !zoomState && (
        <div className="pointer-events-none absolute left-16 top-1/2 z-[80] hidden -translate-y-1/2 items-center gap-3 rounded-2xl border-2 border-amber-300 bg-stone-950/95 p-3 text-amber-100 shadow-2xl sm:flex">
          <HearthstoneCard card={cardDb.mustGetCard(liveHoveredHistoryItem.cardId)} size="SM" />
          <div className="max-w-[200px]">
            <div className="text-xs font-extrabold text-yellow-300">
              {liveHoveredHistoryItem.turn}턴 ·{' '}
              {liveHoveredHistoryItem.actorSide === 'PLAYER' ? '아군 행동' : '상대 행동'}
            </div>
            <div className="mt-1 text-sm font-extrabold text-white">
              {liveHoveredHistoryItem.title}
            </div>
            <p className="mt-1 text-xs text-amber-200/85">{liveHoveredHistoryItem.detail}</p>
          </div>
        </div>
      )}

      {/* Board Minion Hover Full-Card Inspector (Desktop XL) */}
      {liveHoveredBoardMinion &&
        !selection &&
        !attackAnim &&
        !zoomState &&
        matchState.phase === 'PLAYING' && (
          <div className="pointer-events-none absolute right-24 top-1/2 z-[80] hidden -translate-y-1/2 xl:block">
            <HearthstoneCard
              card={cardDb.mustGetCard(liveHoveredBoardMinion.cardId)}
              journeyMultiplier={
                matchState.player.board.some((m) => m.uid === liveHoveredBoardMinion.uid)
                  ? getPlayerCardMult(liveHoveredBoardMinion.cardId)
                  : 1
              }
              size="MD"
            />
          </div>
        )}

      {/* Right-Middle Controls: Deck Stacks, Spinning Auto-Play Button & 3-State End Turn Button (Desktop / Tablet >= sm) */}
      <aside className="absolute right-2.5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 sm:flex">
        {/* Opponent Remaining Deck Stack */}
        <div
          title={
            matchState.opponent.deck.length > 0
              ? `상대 남은 덱: ${matchState.opponent.deck.length}장`
              : `상대 덱 소진! (다음 탈진 피해: ${matchState.opponent.fatigueCounter + 1})`
          }
          className="relative flex h-14 w-11 flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-[#c8a158]/80 bg-stone-950/90 shadow-xl"
        >
          <div className="pointer-events-none absolute inset-0 opacity-45">
            <SnsCardBackArt variant={profile.selectedCardBack} />
          </div>
          <span className="hs-outline-sm relative z-10 text-[9px] font-extrabold text-red-200">
            상대 덱
          </span>
          <span className="hs-num relative z-10 text-sm text-white">
            {matchState.opponent.deck.length}
          </span>
        </div>

        {/* Right-Middle Spinning Auto-Play Toggle Button */}
        <button
          type="button"
          data-testid="autoplay-toggle-desktop"
          onClick={(e) => {
            e.stopPropagation();
            hsAudio.playSfx('ui_click', 0.85);
            setAutoPlay((prev) => !prev);
          }}
          className={`group relative flex w-[114px] flex-col items-center justify-center gap-0.5 rounded-2xl border-[2.5px] px-2 py-2 shadow-xl transition hover:scale-105 ${
            autoPlay
              ? 'border-emerald-300 bg-gradient-to-b from-emerald-600 via-teal-800 to-emerald-950 text-white shadow-[0_0_22px_rgba(52,211,153,0.85)]'
              : 'border-[#c8a158]/80 bg-gradient-to-b from-stone-800 to-stone-950 text-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className={`h-4 w-4 shrink-0 ${
                autoPlay ? 'animate-spin text-yellow-200' : 'text-amber-300'
              }`}
            >
              <path
                d="M12 2v3m0 14v3M4.93 4.93l2.12 2.12m9.9 9.9 2.12 2.12M2 12h3m14 0h3M4.93 19.07l2.12-2.12m9.9-9.9 2.12-2.12"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2.2" />
            </svg>
            <span className="hs-title hs-outline-sm text-[11px] font-extrabold">
              {autoPlay ? '자동 플레이' : '수동 플레이'}
            </span>
          </div>
          <span
            className={`text-[9.5px] font-extrabold ${
              autoPlay ? 'text-emerald-100' : 'text-amber-300/75'
            }`}
          >
            {autoPlay ? '진행 중 · 클릭 시 수동' : '클릭 시 자동 진행'}
          </span>
        </button>

        {/* 3-State Stone & Brass End Turn Lever */}
        <button
          type="button"
          disabled={!isPlayerTurn || Boolean(attackAnim)}
          onClick={(e) => {
            e.stopPropagation();
            if (!isPlayerTurn || attackAnim) return;
            setSelection(null);
            setHoveredBoardMinion(null);
            setHoveredHistoryItem(null);
            hsAudio.playSfx('end_turn');
            const eng = createEngine(matchState);
            setMatchState(eng.endTurn());
          }}
          className={`group relative flex h-[54px] w-[114px] items-center justify-center transition ${
            !isPlayerTurn
              ? 'cursor-not-allowed opacity-90'
              : 'cursor-pointer hover:scale-105'
          }`}
        >
          <EndTurnLeverPlate isPlayerTurn={isPlayerTurn} noMovesLeft={noMovesLeft} />
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
          <div className="pointer-events-none absolute inset-0 opacity-45">
            <SnsCardBackArt variant={profile.selectedCardBack} />
          </div>
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
            <span className="max-w-[82px] truncate font-extrabold text-red-200 sm:max-w-none">
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
                  className="h-7 w-5 overflow-hidden rounded-[4px] shadow sm:h-14 sm:w-10 sm:rounded-md"
                >
                  <SnsCardBackArt variant={profile.selectedCardBack} />
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
            {mode === 'TUTORIAL' && matchState.journeyMeta && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  hsAudio.playSfx('open_menu', 0.75);
                  setStoryPhase('REVIEW');
                }}
                className="rounded-xl border border-emerald-300/70 bg-emerald-950/90 px-2 py-1 text-[10px] font-extrabold text-emerald-200 shadow sm:px-2.5 sm:text-xs"
              >
                📖 제{matchState.journeyMeta.episode}화 줄거리
              </button>
            )}

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
            isAttackingHidden={attackAnim?.attackerId === 'OPPONENT_HERO'}
            isIncomingAttackTarget={attackAnim?.defenderId === 'OPPONENT_HERO'}
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
        {/* Kadan's Journey Stage Status Strip */}
        {mode === 'TUTORIAL' && matchState.journeyMeta && (
          <div className="mx-auto flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-emerald-400/55 bg-stone-950/88 px-3 py-1 text-[10.5px] font-extrabold text-emerald-100 shadow-lg sm:px-4 sm:text-xs">
            <span className="text-yellow-300">
              {matchState.journeyMeta.reincarnation > 0
                ? `환생 ${matchState.journeyMeta.reincarnation}회차 · `
                : ''}
              제{matchState.journeyMeta.episode}화 「{matchState.journeyMeta.episodeTitle}」
            </span>
            <span className="text-stone-500">|</span>
            <span>적 스탯 ×{matchState.journeyMeta.enemyStatScale}배</span>
            {journeyDeckStats.boostedCount > 0 && (
              <>
                <span className="text-stone-500">|</span>
                <span className="text-emerald-300">
                  내 3장+ 배수 강화 {journeyDeckStats.boostedCount}종 (최대 ×{journeyDeckStats.maxMultiplier}배)
                </span>
              </>
            )}
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
              isAttackingHidden={attackAnim?.attackerId === m.uid}
              isIncomingAttackTarget={attackAnim?.defenderId === m.uid}
              onSelect={() => handleEntityClick(m.uid, false)}
              onHoverChange={(hov) =>
                setHoveredBoardMinion((prev) => (hov ? m : prev?.uid === m.uid ? null : prev))
              }
            />
          ))}
          {matchState.opponent.board.length === 0 && (
            <div className="text-[11px] font-bold text-amber-100/35 sm:text-xs">상대 전장</div>
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

        {/* Mobile Portrait Center Tactical Divider Bar (< sm: History + Decks + Spinning Auto-Play + End Turn!) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="mx-auto flex w-full items-center justify-between gap-1 rounded-2xl border border-[#b8924d]/70 bg-stone-950/88 px-1.5 py-1 shadow-lg sm:hidden"
        >
          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('ui_click', 0.75);
              setMobileHistoryOpen(true);
            }}
            className="hs-brass-btn rounded-xl px-2 py-1 text-[10px] font-extrabold text-amber-100"
          >
            기록 ({matchState.history.length})
          </button>

          <div className="flex items-center gap-1 text-[10px] font-extrabold">
            <span className="rounded-lg border border-red-400/45 bg-stone-900/95 px-1.5 py-0.5 text-red-200">
              적{matchState.opponent.deck.length}
            </span>
            <span className="rounded-lg border border-sky-400/45 bg-stone-900/95 px-1.5 py-0.5 text-sky-200">
              덱{matchState.player.deck.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Mobile Right-Middle Spinning Auto-Play Button */}
            <button
              type="button"
              data-testid="autoplay-toggle-mobile"
              onClick={() => {
                hsAudio.playSfx('ui_click', 0.85);
                setAutoPlay((prev) => !prev);
              }}
              className={`flex h-[34px] items-center gap-1 rounded-xl border px-2 text-[10px] font-extrabold transition ${
                autoPlay
                  ? 'border-emerald-300 bg-gradient-to-b from-emerald-600 to-emerald-900 text-white shadow-[0_0_12px_rgba(52,211,153,0.85)]'
                  : 'border-amber-400/50 bg-stone-900 text-amber-200'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className={`h-3.5 w-3.5 shrink-0 ${
                  autoPlay ? 'animate-spin text-yellow-200' : 'text-amber-300'
                }`}
              >
                <path
                  d="M12 2v3m0 14v3M4.93 4.93l2.12 2.12m9.9 9.9 2.12 2.12M2 12h3m14 0h3M4.93 19.07l2.12-2.12m9.9-9.9 2.12-2.12"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2.2" />
              </svg>
              <span>{autoPlay ? '자동ON' : '수동'}</span>
            </button>

            <button
              type="button"
              disabled={!isPlayerTurn || Boolean(attackAnim)}
              onClick={() => {
                if (!isPlayerTurn || attackAnim) return;
                setSelection(null);
                hsAudio.playSfx('end_turn');
                const eng = createEngine(matchState);
                setMatchState(eng.endTurn());
              }}
              className={`relative flex h-[34px] w-[76px] shrink-0 items-center justify-center transition ${
                !isPlayerTurn ? 'cursor-not-allowed opacity-90' : 'active:scale-95'
              }`}
            >
              <EndTurnLeverPlate isPlayerTurn={isPlayerTurn} noMovesLeft={noMovesLeft} compact />
            </button>
          </div>
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
                canAttack={isPlayerTurn && !attackAnim && engine.canAttackerSwing('PLAYER', m.uid).ok}
                isSelectedAttacker={
                  selection?.kind === 'ATTACKER' && selection.attackerId === m.uid
                }
                isValidTarget={activeValidTargetSet.has(m.uid)}
                isAttackingHidden={attackAnim?.attackerId === m.uid}
                isIncomingAttackTarget={attackAnim?.defenderId === m.uid}
                onSelect={() => handleEntityClick(m.uid, true)}
                onHoverChange={(hov) =>
                setHoveredBoardMinion((prev) => (hov ? m : prev?.uid === m.uid ? null : prev))
              }
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
            <div className="text-[11px] font-bold text-amber-100/35 sm:text-xs">내 전장</div>
          )}
        </div>
      </main>

      {/* ==================== BOTTOM ZONE: PLAYER HERO + MANA TRAY + CURVED HAND ==================== */}
      <footer className="relative z-30 flex flex-col items-center pb-1">
        {/* Player Hero + Emote Trigger + 10 Sapphire Mana Crystal Tray */}
        <div className="flex w-full max-w-5xl flex-col items-center justify-center gap-1 px-2 sm:flex-row sm:flex-wrap sm:gap-4 sm:px-4">
          <div className="relative flex items-center gap-1.5">
            {/* Emote Menu Brass Trigger (Always visible & unclipped on mobile!) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEmoteMenuOpen((v) => !v);
              }}
              className="hs-brass-btn rounded-xl px-2 py-1 text-[10px] font-extrabold text-amber-100 sm:px-2.5 sm:text-[11px]"
            >
              감정표현
            </button>

            <HeroPortraitZone
              player={matchState.player}
              isFriendly
              isActiveTurn={isPlayerTurn}
              canHeroAttack={
                isPlayerTurn && !attackAnim && engine.canAttackerSwing('PLAYER', 'PLAYER_HERO').ok
              }
              isHeroSelectedAttacker={
                selection?.kind === 'ATTACKER' && selection.attackerId === 'PLAYER_HERO'
              }
              isHeroValidTarget={activeValidTargetSet.has('PLAYER_HERO')}
              isAttackingHidden={attackAnim?.attackerId === 'PLAYER_HERO'}
              isIncomingAttackTarget={attackAnim?.defenderId === 'PLAYER_HERO'}
              canUseHeroPower={isPlayerTurn && !attackAnim && engine.inspectHeroPower('PLAYER').canUse}
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

          {/* 10-Crystal Faceted Sapphire Mana Tray */}
          <div className="flex items-center gap-1.5 rounded-2xl border-2 border-[#c8a158] bg-stone-950/90 px-2.5 py-1 shadow-[0_10px_24px_rgba(0,0,0,0.88)] sm:gap-2.5 sm:px-3 sm:py-1.5">
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
                    journeyMultiplier={getPlayerCardMult(def.id)}
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
            className="hs-wood-panel flex max-h-[78%] w-full max-w-sm flex-col rounded-3xl p-4 text-amber-100 shadow-2xl"
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
                      src={resolveHistoryIconUrl(item)}
                      alt={item.title}
                      className={`h-10 w-10 shrink-0 rounded-lg border-2 object-cover object-top ${
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
        <div className="hs-wood-panel pointer-events-none absolute left-1/2 top-1/2 z-[82] -translate-x-1/2 -translate-y-1/2 animate-[hsCardPop_0.3s_ease-out] rounded-3xl px-8 py-3 sm:px-12 sm:py-4">
          <div className="hs-title hs-outline text-2xl font-extrabold tracking-widest text-amber-200 sm:text-3xl">
            {matchState.bannerMessage}
          </div>
        </div>
      )}

      {/* AI Action Callout Pill */}
      {aiHighlightText && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-[78] max-w-[90%] -translate-x-1/2 truncate rounded-full border-2 border-red-300 bg-stone-950/92 px-4 py-1.5 text-xs font-extrabold text-amber-100 shadow-xl sm:top-28 sm:px-5">
          {aiHighlightText}
        </div>
      )}

      {/* Play Error Banner */}
      {matchState.errorBanner && (
        <div className="pointer-events-none absolute bottom-44 left-1/2 z-[85] max-w-[92%] -translate-x-1/2 rounded-2xl border-2 border-red-300 bg-red-950/95 px-4 py-2 text-center text-xs font-extrabold text-red-100 shadow-2xl sm:bottom-48 sm:px-6 sm:text-sm">
          {matchState.errorBanner}
        </div>
      )}

      {/* Corner Toy Reaction Toast */}
      {toyToast && (
        <div className="pointer-events-none absolute left-1/2 top-14 z-[85] max-w-[92%] -translate-x-1/2 rounded-2xl border border-amber-300 bg-stone-950/92 px-4 py-1.5 text-center text-xs font-bold text-amber-200 shadow-xl sm:top-16 sm:px-5">
          {toyToast}
        </div>
      )}

      {/* 1. VS Clash Intro Overlay with Sculpted Hero Arch Portraits */}
      {vsIntroActive &&
        (() => {
          const pPortrait = resolveHeroPortraitUrl(matchState.player);
          const oPortrait = resolveHeroPortraitUrl(matchState.opponent);
          const pIsCutout = pPortrait.includes('/cutouts/');
          const oIsCutout = oPortrait.includes('/cutouts/');
          const pGrad =
            matchState.player.customHero?.frameGradient ||
            CLASSIC_HEROES[matchState.player.heroClass].frameGradient;
          const oGrad =
            matchState.opponent.customHero?.frameGradient ||
            CLASSIC_HEROES[matchState.opponent.heroClass].frameGradient;
          const pSubTitle =
            matchState.player.customHero?.titleKo ||
            CLASSIC_HEROES[matchState.player.heroClass].classNameKo;
          const oSubTitle =
            matchState.opponent.customHero?.titleKo || matchState.opponent.name;

          return (
            <div className="absolute inset-0 z-[92] flex flex-col items-center justify-center bg-black/84 px-3 backdrop-blur-sm">
              <div className="flex items-center gap-3 sm:gap-14">
                <div className="flex flex-col items-center text-center">
                  <div
                    style={{ background: pGrad }}
                    className="relative mb-2.5 h-32 w-24 overflow-hidden rounded-t-[48px] rounded-b-xl border-[3.5px] border-[#e7c57c] shadow-[0_14px_30px_rgba(0,0,0,0.95)] sm:mb-3 sm:h-44 sm:w-36 sm:rounded-t-[58px] sm:border-[4px]"
                  >
                    <img
                      src={pPortrait}
                      alt=""
                      className={
                        pIsCutout
                          ? 'absolute left-1/2 top-[3%] h-[155%] w-[124%] max-w-none -translate-x-1/2 object-cover object-top'
                          : 'absolute inset-0 h-full w-full scale-[1.04] object-cover object-center'
                      }
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
                  <div className="mt-0.5 max-w-[160px] truncate text-xs font-bold text-amber-200 sm:max-w-[240px]">
                    {pSubTitle}
                  </div>
                </div>

                {/* Sculpted Gold & Sapphire VS Crest */}
                <div className="flex h-20 w-20 shrink-0 animate-[hsCardPop_0.5s_ease-out] items-center justify-center rounded-full border-4 border-amber-300 bg-radial from-amber-300 via-amber-700 to-stone-950 shadow-[0_0_32px_rgba(250,204,21,0.9)] sm:h-32 sm:w-32">
                  <span className="hs-title hs-outline text-2xl font-black tracking-tighter text-white sm:text-5xl">
                    VS
                  </span>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div
                    style={{ background: oGrad }}
                    className="relative mb-2.5 h-32 w-24 overflow-hidden rounded-t-[48px] rounded-b-xl border-[3.5px] border-[#e7c57c] shadow-[0_14px_30px_rgba(0,0,0,0.95)] sm:mb-3 sm:h-44 sm:w-36 sm:rounded-t-[58px] sm:border-[4px]"
                  >
                    <img
                      src={oPortrait}
                      alt=""
                      className={
                        oIsCutout
                          ? 'absolute left-1/2 top-[3%] h-[155%] w-[124%] max-w-none -translate-x-1/2 object-cover object-top'
                          : 'absolute inset-0 h-full w-full scale-[1.04] object-cover object-center'
                      }
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
                  <div className="mt-0.5 max-w-[160px] truncate text-xs font-bold text-amber-200 sm:max-w-[240px]">
                    {oSubTitle}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* 2. Mulligan (시작 손패 교체) Overlay — Tap Card to Enlarge & Toggle Replace! */}
      {storyPhase === 'CLOSED' && !vsIntroActive && matchState.phase === 'MULLIGAN' && (
        <div className="absolute inset-0 z-[88] flex flex-col items-center justify-center overflow-y-auto bg-black/82 p-3 text-center backdrop-blur-sm sm:p-4">
          <h2 className="hs-title hs-outline text-xl font-extrabold text-amber-200 sm:text-3xl">
            시작 카드 선택 ({matchState.firstPlayer === 'PLAYER' ? '선공 · 3장' : '후공 · 4장 + 엘윈의 은화'})
          </h2>
          <p className="mt-1 max-w-md text-xs font-bold text-amber-200/90">
            {autoPlay
              ? '⚡ 자동 플레이가 시작 손패를 최적화하여 곧 전투를 개시합니다...'
              : '카드를 터치해 크게 확대하고 하단 버튼으로 교체(✕) 여부를 선택한 뒤 [확인]을 누르세요.'}
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
                  <HearthstoneCard
                    card={def}
                    journeyMultiplier={getPlayerCardMult(def.id)}
                    size={isCompactMobile ? 'XS' : 'MD'}
                  />
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

      {/* 3. Choose One (선택) Modal — Tap Option Card to Enlarge & Confirm! */}
      {matchState.chooseOnePrompt && (
        <div className="absolute inset-0 z-[90] flex flex-col items-center justify-center overflow-y-auto bg-black/82 p-3 text-center backdrop-blur-sm sm:p-4">
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

      {/* 4. Tracking (정찰 추적) 3-Card Picker Modal — Tap Card to Enlarge & Pick! */}
      {matchState.trackingPrompt && (
        <div className="absolute inset-0 z-[90] flex flex-col items-center justify-center overflow-y-auto bg-black/82 p-3 text-center backdrop-blur-sm sm:p-4">
          <h3 className="hs-title hs-outline mb-1.5 text-xl font-extrabold text-emerald-300 sm:mb-2 sm:text-2xl">
            정찰 추적 — 카드를 터치해 확대 후 1장을 가져오세요
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

      {/* 5. Victory / Defeat Heraldry Banner, 3s Auto-Advance & 1-Card Draw Auto-Retry Loop */}
      {matchState.phase === 'GAME_OVER' && (
        <div className="absolute inset-0 z-[94] flex items-center justify-center overflow-y-auto bg-black/84 p-3 backdrop-blur-md sm:p-4">
          {defeatDrawResult ? (
            <div className="hs-wood-panel relative flex max-h-[94%] w-full max-w-md flex-col items-center overflow-hidden rounded-3xl p-5 text-center text-amber-100 shadow-2xl sm:p-6">
              {autoPlay && !postGameAutoPaused && (
                <div className="absolute left-0 right-0 top-0 h-1.5 bg-stone-900">
                  <div
                    style={{
                      width: `${Math.min(100, ((3000 - drawRetryRemainingMs) / 3000) * 100)}%`,
                    }}
                    className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-300 transition-all duration-100"
                  />
                </div>
              )}

              <div className="flex w-full items-center justify-between gap-2">
                <span className="rounded-full border border-emerald-300/70 bg-emerald-950 px-3 py-0.5 text-xs font-extrabold text-emerald-200">
                  ✨ 패배 구호 · 영웅 카드 1장 소환!
                </span>
                {autoPlay && (
                  <button
                    type="button"
                    onClick={() => setPostGameAutoPaused((p) => !p)}
                    className={`rounded-lg border px-2.5 py-0.5 text-[11px] font-extrabold ${
                      !postGameAutoPaused
                        ? 'border-emerald-300/70 bg-emerald-950/90 text-emerald-200'
                        : 'border-amber-400/50 bg-stone-900 text-amber-200'
                    }`}
                  >
                    {!postGameAutoPaused
                      ? `⏱ ${Math.max(1, Math.ceil(drawRetryRemainingMs / 1000))}초 후 재도전 (정지)`
                      : '▶ 자동 재도전 재개'}
                  </button>
                )}
              </div>

              <h3 className="hs-title mt-2 text-xl font-extrabold text-yellow-300 sm:text-2xl">
                {defeatDrawResult.drawn.card.name} 합류!
              </h3>
              <p className="mt-0.5 text-xs font-bold text-amber-200/85">
                {defeatDrawResult.goldSpent > 0
                  ? `성소 단품 소환 (-${defeatDrawResult.goldSpent}G · 남은 골드 ${profile.gold}G)`
                  : '엘윈 성소 무상 증원 보급 (0G)'}
              </p>

              {/* 3D Flip Single Card Reveal */}
              <div
                style={{ perspective: '1100px' }}
                className="my-3.5 flex items-center justify-center"
              >
                <div
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: defeatDrawResult.flipped
                      ? 'rotateY(180deg) scale(1)'
                      : 'rotateY(0deg) scale(0.92)',
                    transition: 'transform 0.52s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                  className="relative"
                >
                  <div
                    style={{ backfaceVisibility: 'hidden' }}
                    className="h-[252px] w-[180px] overflow-hidden rounded-2xl shadow-2xl"
                  >
                    <SnsCardBackArt variant={profile.selectedCardBack} />
                  </div>
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <HearthstoneCard
                      card={defeatDrawResult.drawn.card}
                      isGolden={defeatDrawResult.drawn.isGolden}
                      journeyMultiplier={defeatDrawResult.drawn.newJourneyMultiplier}
                      size="MD"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3.5 w-full rounded-2xl border border-emerald-400/50 bg-stone-950/80 px-3.5 py-2.5 text-xs font-extrabold">
                <div className="text-amber-100">
                  현재 보유 수량:{' '}
                  <span className="text-yellow-300">
                    {defeatDrawResult.drawn.newOwnedCount}장
                  </span>{' '}
                  {defeatDrawResult.drawn.isNew ? '(신규 영웅 합류!)' : ''}
                </div>
                {defeatDrawResult.drawn.newJourneyMultiplier > 1 ? (
                  <div className="mt-1 text-emerald-300">
                    ⚡ 스토리모드 전용 공격력·생명력 ×
                    {defeatDrawResult.drawn.newJourneyMultiplier}배 각성 적용!
                  </div>
                ) : (
                  <div className="mt-1 text-amber-200/80">
                    스토리모드에서 동일 하수인·무기 3장 달성 시 공격력·생명력 ×3배 각성!
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col gap-2">
                {onStartJourneyEpisode && (
                  <button
                    type="button"
                    onClick={() => {
                      drawRetryFiredRef.current = true;
                      hsAudio.playSfx('box_press');
                      onStartJourneyEpisode(
                        matchState.journeyMeta?.episode || profile.journeyEpisode || 1,
                        true,
                      );
                    }}
                    className="hs-arcane-btn hs-title hs-outline-sm w-full rounded-2xl py-3 text-base font-extrabold text-white sm:text-lg"
                  >
                    ⚔ 강화된 덱으로 제
                    {matchState.journeyMeta?.episode || profile.journeyEpisode}화 자동플레이
                    {autoPlay && !postGameAutoPaused
                      ? ` (${Math.max(1, Math.ceil(drawRetryRemainingMs / 1000))}초)`
                      : ' ▶'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    drawRetryFiredRef.current = true;
                    hsAudio.playSfx('menu_select');
                    hsAudio.playBgm('tavern_hub');
                    onExitBattle();
                  }}
                  className="hs-brass-btn w-full rounded-xl py-2 text-xs font-extrabold text-amber-100"
                >
                  엘윈마을 로비로 돌아가기
                </button>
              </div>
            </div>
          ) : (
          <div className="hs-wood-panel relative flex max-h-[94%] w-full max-w-lg flex-col items-center overflow-y-auto rounded-3xl p-5 text-center text-amber-100 sm:p-6">
            {autoPlay && !postGameAutoPaused && (
              <div className="absolute left-0 right-0 top-0 h-1.5 bg-stone-900">
                <div
                  style={{
                    width: `${Math.min(100, ((3000 - postGameRemainingMs) / 3000) * 100)}%`,
                  }}
                  className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-300 transition-all duration-100"
                />
              </div>
            )}

            {autoPlay && (
              <div className="relative z-20 mb-1 flex w-full justify-end">
                <button
                  type="button"
                  onClick={() => setPostGameAutoPaused((p) => !p)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-extrabold ${
                    !postGameAutoPaused
                      ? 'border-emerald-300/70 bg-emerald-950/90 text-emerald-200'
                      : 'border-amber-400/50 bg-stone-900 text-amber-200'
                  }`}
                >
                  {!postGameAutoPaused
                    ? `⏱ 자동이동 ${Math.max(1, Math.ceil(postGameRemainingMs / 1000))}초 (정지)`
                    : '▶ 자동이동 재개'}
                </button>
              </div>
            )}
            {matchState.winner === 'PLAYER' && (
              <div
                style={{
                  animation: 'hsSlowSpin 24s linear infinite',
                  background:
                    'conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,0.38) 40deg, transparent 80deg, rgba(56,189,248,0.3) 170deg, transparent 210deg, rgba(251,191,36,0.38) 300deg, transparent 360deg)',
                }}
                className="pointer-events-none absolute -top-16 h-80 w-80 rounded-full blur-md"
              />
            )}

            <div className={`relative z-10 ${matchState.winner === 'PLAYER' ? '' : 'grayscale opacity-75'}`}>
              <SnsRankMedallion
                rank={matchState.winner === 'PLAYER' ? 0 : profile.rank}
                size={76}
                className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]"
              />
            </div>

            <h2
              className={`hs-title hs-outline relative z-10 mt-1.5 text-2xl font-extrabold sm:text-4xl ${
                matchState.winner === 'PLAYER' ? 'text-yellow-300' : 'text-slate-200'
              }`}
            >
              {matchState.winner === 'PLAYER'
                ? mode === 'TUTORIAL' && matchState.journeyMeta
                  ? `제${matchState.journeyMeta.episode}화 돌파 승리!`
                  : '승리!'
                : mode === 'TUTORIAL' && matchState.journeyMeta
                  ? `제${matchState.journeyMeta.episode}화 결투 패배`
                  : '패배'}
            </h2>
            <p className="relative z-10 mt-1 text-xs font-bold text-amber-200/90">
              {matchState.winner === 'PLAYER'
                ? `${matchState.opponent.name}을(를) 제압하고 확정 보상을 수령했습니다!`
                : mode === 'TUTORIAL' && matchState.journeyMeta
                  ? `회차·환생이 높아질수록 적 보스(체력 ${matchState.journeyMeta.enemyHeroHealth} · 스탯 ×${matchState.journeyMeta.enemyStatScale}배)가 강력해집니다!`
                  : '아군 영웅이 쓰러졌습니다. 덱을 정비하고 다시 도전해 보세요!'}
            </p>

            {/* Itemized Victory / Match Reward Receipt */}
            {outcomeSummary && (
              <div className="relative z-10 my-3.5 w-full space-y-1.5 rounded-2xl border-2 border-[#c8a158]/60 bg-black/50 p-3.5 text-left text-xs sm:p-4">
                <div className="mb-1 border-b border-amber-500/25 pb-1 text-center font-extrabold text-amber-200">
                  {outcomeSummary.didWin ? '🏆 확정 승리 보상 지급 명세' : '📋 대결 결과 안내'}
                </div>

                {outcomeSummary.didWin ? (
                  <>
                    <div className="flex items-center justify-between font-bold text-amber-100">
                      <span>• 기본 승리 골드</span>
                      <span className="font-extrabold text-yellow-300">
                        +{outcomeSummary.baseWinGold} 골드
                      </span>
                    </div>

                    {outcomeSummary.bonusGold > 0 && outcomeSummary.bonusLabel && (
                      <div className="flex items-center justify-between font-bold text-emerald-200">
                        <span>• {outcomeSummary.bonusLabel}</span>
                        <span className="font-extrabold text-emerald-300">
                          +{outcomeSummary.bonusGold} 골드
                        </span>
                      </div>
                    )}

                    {outcomeSummary.questGold > 0 && (
                      <div className="flex items-center justify-between font-bold text-sky-200">
                        <span>• 일일 의뢰 달성 보상</span>
                        <span className="font-extrabold text-sky-300">
                          +{outcomeSummary.questGold} 골드
                        </span>
                      </div>
                    )}

                    <div className="mt-1 flex items-center justify-between border-t border-amber-500/30 pt-1.5 text-sm font-extrabold">
                      <span className="text-amber-100">총 획득 골드 (보유 {profile.gold}G)</span>
                      <span className="flex items-center gap-1 text-yellow-300">
                        <HsGoldCoinIcon size={18} />
                        <span>+{outcomeSummary.goldEarned}G</span>
                      </span>
                    </div>

                    {outcomeSummary.packsEarned > 0 && (
                      <div className="mt-1.5 flex items-center justify-between rounded-xl border border-yellow-300/60 bg-amber-950/70 px-3 py-2 font-extrabold text-yellow-200">
                        <span className="truncate pr-2">
                          🎁 {outcomeSummary.packReason || '특전 눈히어로 팩 보상'}
                        </span>
                        <span className="shrink-0 text-yellow-300">
                          +{outcomeSummary.packsEarned}팩!
                        </span>
                      </div>
                    )}

                    {outcomeSummary.reincarnatedNow && (
                      <div className="mt-1.5 rounded-xl border border-purple-300/70 bg-purple-950/80 px-3 py-2 text-center font-extrabold text-purple-200">
                        ✦ 40화 대단원 완주! [환생 {outcomeSummary.nextReincarnation}회차]가 개방되었습니다!
                      </div>
                    )}

                    {(mode === 'RANKED' || mode === 'CASUAL') && (
                      <div className="mt-1 flex items-center justify-between text-[11px] font-bold text-amber-200/85">
                        <span>3승 달성 추가 보너스 진행도</span>
                        <span className="text-yellow-300">{outcomeSummary.threeWinProgress} / 3승</span>
                      </div>
                    )}

                    {mode === 'RANKED' && (
                      <div className="mt-1 flex items-center justify-between text-[11px] font-bold text-sky-200">
                        <span>현재 눈히어로 등급</span>
                        <span>
                          {outcomeSummary.newRank === 0
                            ? '전설의 눈히어로!'
                            : `${outcomeSummary.newRank}등급 (${CLASSIC_RANK_NAMES[outcomeSummary.newRank]}) · ★${outcomeSummary.newStars}`}
                          {outcomeSummary.streakBonus ? ' (연승 ×2!)' : ''}
                        </span>
                      </div>
                    )}
                  </>
                ) : mode === 'TUTORIAL' ? (
                  <div className="space-y-1.5 text-center leading-relaxed text-amber-100">
                    <div className="font-extrabold text-emerald-300">
                      ⚡ 『스토리모드』 전용 돌파 비결: 동일 카드 3장 = 능력치 3배!
                    </div>
                    <p className="text-[11.5px] font-semibold text-amber-100/90">
                      보급소에서 골드(100G) 또는 결제로 <b className="text-yellow-300">눈히어로 팩을 구매·개봉</b>하여 동일 하수인·무기 카드를{' '}
                      <b className="text-emerald-300">3장 이상 모으면 스토리모드 한정으로 공격력·생명력이 3배(N장=N배)</b>로 강화됩니다!
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-[11.5px] font-semibold text-amber-200/85">
                    승리 시 확정 골드와 일일 의뢰 보상이 지급됩니다. 덱 구성을 점검하고 다시 도전해 보세요!
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons: Journey Progression / Upgrade Loop vs Standard Return */}
            {mode === 'TUTORIAL' ? (
              matchState.winner === 'PLAYER' ? (
                <div className="relative z-10 flex w-full flex-col gap-2">
                  {onStartJourneyEpisode && outcomeSummary?.nextEpisode && (
                    <button
                      type="button"
                      onClick={() => {
                        postGameFiredRef.current = true;
                        hsAudio.playSfx('box_press');
                        onStartJourneyEpisode(outcomeSummary.nextEpisode!, false);
                      }}
                      className="hs-arcane-btn hs-title hs-outline-sm w-full rounded-2xl py-3 text-base font-extrabold text-white sm:text-lg"
                    >
                      ⚔ 다음 여정 진행 (
                      {outcomeSummary.nextReincarnation && outcomeSummary.nextReincarnation > 0
                        ? `환생 ${outcomeSummary.nextReincarnation} · `
                        : ''}
                      제{outcomeSummary.nextEpisode}화)
                      {autoPlay && !postGameAutoPaused
                        ? ` · ${Math.max(1, Math.ceil(postGameRemainingMs / 1000))}초`
                        : ' ▶'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      postGameFiredRef.current = true;
                      hsAudio.playSfx('menu_select');
                      hsAudio.playBgm('tavern_hub');
                      onExitBattle();
                    }}
                    className="hs-brass-btn w-full rounded-xl py-2.5 text-xs font-extrabold text-amber-100 sm:text-sm"
                  >
                    엘윈마을 로비로 돌아가기
                  </button>
                </div>
              ) : (
                <div className="relative z-10 flex w-full flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      postGameFiredRef.current = true;
                      triggerDefeatSingleCardDraw();
                    }}
                    className="hs-arcane-btn hs-title hs-outline-sm flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-extrabold text-white sm:text-base"
                  >
                    <span>
                      🃏 카드 1장 뽑고 제
                      {matchState.journeyMeta?.episode || profile.journeyEpisode}화 다시 자동플레이
                      {autoPlay && !postGameAutoPaused
                        ? ` (${Math.max(1, Math.ceil(postGameRemainingMs / 1000))}초)`
                        : ' ▶'}
                    </span>
                  </button>

                  {profile.packs > 0 && onGoOpenPacksFromBattle && (
                    <button
                      type="button"
                      onClick={() => {
                        postGameFiredRef.current = true;
                        setPostGameAutoPaused(true);
                        hsAudio.playSfx('pack_open', 0.8);
                        onGoOpenPacksFromBattle();
                      }}
                      className="hs-brass-btn flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border-sky-300/70 py-2 text-xs font-extrabold text-sky-100 sm:text-sm"
                    >
                      <div className="h-5 w-3.5 shrink-0">
                        <SnsBoosterPackArt />
                      </div>
                      <span>보유 5장 카드팩 개봉하러 가기 ({profile.packs}팩 보유)</span>
                    </button>
                  )}

                  {onOpenShopFromBattle && (
                    <button
                      type="button"
                      onClick={() => {
                        setPostGameAutoPaused(true);
                        hsAudio.playSfx('ui_click');
                        onOpenShopFromBattle();
                      }}
                      className="hs-brass-btn flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl border-yellow-300/80 py-2 text-xs font-extrabold text-yellow-200 sm:text-sm"
                    >
                      <HsGoldCoinIcon size={16} />
                      <span>눈히어로 보급소에서 카드팩 구매 (골드 {profile.gold}G / $1·$4)</span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {onGoCollectionFromBattle && (
                      <button
                        type="button"
                        onClick={() => {
                          postGameFiredRef.current = true;
                          setPostGameAutoPaused(true);
                          hsAudio.playSfx('ui_click');
                          onGoCollectionFromBattle();
                        }}
                        className="hs-brass-btn min-h-[40px] rounded-xl py-2 text-xs font-extrabold text-sky-200"
                      >
                        내 카드첩 · 3배 확인
                      </button>
                    )}
                    {onStartJourneyEpisode && (
                      <button
                        type="button"
                        onClick={() => {
                          postGameFiredRef.current = true;
                          hsAudio.playSfx('box_press');
                          onStartJourneyEpisode(
                            matchState.journeyMeta?.episode || profile.journeyEpisode,
                            true,
                          );
                        }}
                        className="hs-brass-btn min-h-[40px] rounded-xl border-emerald-300/70 py-2 text-xs font-extrabold text-emerald-200"
                      >
                        제{matchState.journeyMeta?.episode || profile.journeyEpisode}화 즉시 재도전
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      postGameFiredRef.current = true;
                      hsAudio.playSfx('menu_select');
                      hsAudio.playBgm('tavern_hub');
                      onExitBattle();
                    }}
                    className="mt-0.5 text-xs font-bold text-amber-200/75 underline hover:text-white"
                  >
                    엘윈마을 로비로 돌아가기
                  </button>
                </div>
              )
            ) : (
              <button
                type="button"
                onClick={() => {
                  postGameFiredRef.current = true;
                  hsAudio.playSfx('menu_select');
                  hsAudio.playBgm('tavern_hub');
                  onExitBattle();
                }}
                className="hs-arcane-btn hs-title hs-outline-sm relative z-10 w-full rounded-2xl py-3 text-lg font-extrabold text-white"
              >
                엘윈마을로 돌아가기
                {autoPlay && !postGameAutoPaused
                  ? ` (${Math.max(1, Math.ceil(postGameRemainingMs / 1000))}초)`
                  : ''}
              </button>
            )}
          </div>
          )}
        </div>
      )}

      {/* Episode Novel Storyboard Theater (Pre-Battle & Mid-Battle Review in 카단의 여정) */}
      {mode === 'TUTORIAL' && storyPhase !== 'CLOSED' && matchState.journeyMeta && (
        <KadanJourneyStoryModal
          episode={matchState.journeyMeta.episode}
          reincarnation={matchState.journeyMeta.reincarnation}
          maxClearedEpisode={
            matchState.journeyMeta.reincarnation > 0 ? 40 : profile.journeyMaxStageCleared
          }
          playerBoostedCount={journeyDeckStats.boostedCount}
          playerMaxMultiplier={journeyDeckStats.maxMultiplier}
          autoPlayEnabled={autoPlay}
          isMidBattleReview={storyPhase === 'REVIEW'}
          onStartBattle={handleCompletePreBattleStory}
          onCloseReview={() => setStoryPhase('CLOSED')}
        />
      )}

      {/* Universal Enlarged Card Inspection & Bottom Action Modal */}
      {renderActiveZoomModal()}
    </div>
  );
};
