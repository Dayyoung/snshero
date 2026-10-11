import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Zap, Shield, Flame, RotateCcw, Volume2, VolumeX, 
  Sparkles, Check, Trophy, Award, Bot, RefreshCw, Star,
  Coffee, BookOpen, Film, Play, ShoppingBag, ArrowUpRight
} from 'lucide-react';
import { CardData, UserStats, Skill, Item, CardRarity } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { 
  INITIAL_CARDS, 
  generateUniqueDeck, 
  ensureUniqueDeck, 
  syncCardWithDatabase, 
  generateAiName, 
  getCardPower,
  generateCard
} from '../constants';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { AdSenseBanner } from '../components/AdSenseBanner';
import { CardItem } from '../components/CardItem';
import { t } from '../lib/i18n';
import { triggerRainbowFlip, RainbowFlipEffect } from '../components/RainbowFlipEffect';
import { MissionDialogueIntro } from '../components/MissionDialogueIntro';
import { pickNewRankOpponent, RankOpponentInfo } from '../data/rankingOpponents';
import { getDynamicDifficultyProfile, DynamicDifficultyProfile } from '../lib/dynamicDifficulty';
import { WEBTOON_SEASONS } from '../content/webtoonEpisodes';
import { MOVIE_EPISODES } from '../content/movieEpisodeMapping';

export interface MobileCardPlayScreenProps {
  playerDeck?: CardData[];
  onUpdateDeck?: (newDeck: CardData[]) => void;
  targetCardId?: number | null;
  opponentCustomDeck?: CardData[];
  opponentName?: string;
  onBack: () => void;
  language?: string;
  playSfx?: (url: string) => void;
  userStats?: UserStats;
  updateStats?: (newStats: Partial<UserStats>) => void;
  sns?: number;
  updateSns?: (amount: number, reason?: string, type?: 'earned' | 'spent') => void;
  inventory?: any[];
  addCard?: (rarity: CardRarity, indexOverride?: number, isSilent?: boolean) => void;
  isAdRemoved?: boolean;
  initialAutoBattle?: boolean;
  onToggleAutoBattle?: () => void;
  skills?: Skill[];
  onEarnXp?: (amount: number) => void;
  recordMatchResult?: (
    result: 'win' | 'loss' | 'draw',
    rewardOverride?: number,
    sessionPatterns?: any,
    battleType?: 'robot' | 'user' | 'pvp_attack',
    opponentInfo?: { id: string; name: string; sns?: number; wins?: number; losses?: number; draws?: number }
  ) => void;
  autoCloseOnComplete?: boolean;
  isTutorialMode?: boolean;
  tutorialStep?: number;
  onTutorialToShop?: () => void;
  towerFloor?: number | null;
  isRankingMatch?: boolean;
  onNavigate?: (view: any) => void;
}

export const MobileCardPlayScreen: React.FC<MobileCardPlayScreenProps> = ({
  playerDeck,
  onUpdateDeck,
  targetCardId = null,
  opponentCustomDeck,
  opponentName,
  onBack,
  language = 'ko',
  playSfx = (_url?: string) => {},
  userStats,
  updateStats,
  sns = 0,
  updateSns,
  inventory = [],
  addCard,
  isAdRemoved = false,
  initialAutoBattle = true,
  onToggleAutoBattle,
  onEarnXp,
  recordMatchResult,
  autoCloseOnComplete = false,
  isTutorialMode = false,
  tutorialStep = 0,
  onTutorialToShop,
  towerFloor = null,
  isRankingMatch = false,
  onNavigate
}) => {
  // ─── Sound FX Helper ──────────────────────────────────────────────
  const [isMuted, setIsMuted] = useState(false);
  const playSound = useCallback((type: 'place' | 'flip' | 'win' | 'defeat' | 'tap' | 'skill') => {
    if (isMuted) return;
    const sfxMap = {
      place: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      flip: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
      win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
      defeat: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
      tap: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
      skill: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'
    };
    try {
      playSfx(sfxMap[type]);
    } catch {}
  }, [isMuted, playSfx]);

  // ─── Game State Initialization ─────────────────────────────────────
  const [board, setBoard] = useState<(CardData | null)[]>(() => Array(9).fill(null));
  const [boardShields, setBoardShields] = useState<boolean[]>(() => Array(9).fill(false));
  const [playerHand, setPlayerHand] = useState<CardData[]>([]);
  const [opponentHand, setOpponentHand] = useState<CardData[]>([]);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [turnCount, setTurnCount] = useState(1);
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'ai' | 'draw' | null>(null);
  const [flippedSlots, setFlippedSlots] = useState<number[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [matchResultReported, setMatchResultReported] = useState(false);
  const [rematchCountdown, setRematchCountdown] = useState<number | null>(null);
  const [tutorialShopCountdown, setTutorialShopCountdown] = useState<number | null>(null);
  const [rankingAutoLoopCountdown, setRankingAutoLoopCountdown] = useState<number | null>(null);

  // Auto Battle & Speed (시작 시 자동전투 시작)
  const [isAutoBattle, setIsAutoBattle] = useState(initialAutoBattle !== false);
  const [battleSpeed, setBattleSpeed] = useState<1 | 2>(1);

  // Sync initialAutoBattle prop changes from parent view
  useEffect(() => {
    if (initialAutoBattle !== undefined) {
      setIsAutoBattle(initialAutoBattle !== false);
    }
  }, [initialAutoBattle]);

  // Skills State
  const [activeSkill, setActiveSkill] = useState<'power' | 'shield' | null>(null);
  const [skillCharges, setSkillCharges] = useState<{ power: number; shield: number; burst: number }>({
    power: 1,
    shield: 1,
    burst: 1
  });

  // Tower of Trials Boss Clear Dopamine Modal State
  const [towerBossClearModal, setTowerBossClearModal] = useState<{
    floor: number;
    title?: string;
    costume?: string;
    diamonds: number;
    snsReward: number;
    isWelcomeFirstBoss: boolean;
  } | null>(null);

  // Resolve effective target card ID (prop or URL query parameter fallback: ?card=, ?id=, ?target=, ?cardId=)
  const effectiveTargetCardId = useMemo(() => {
    if (targetCardId && CARD_DATABASE[targetCardId]) return targetCardId;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('card') || params.get('cardId') || params.get('target') || params.get('id');
      if (q && !isNaN(Number(q)) && CARD_DATABASE[Number(q)]) {
        return Number(q);
      }
    }
    return targetCardId || null;
  }, [targetCardId]);

  // Target card details (if launched from mission)
  const missionCardData = useMemo(() => {
    if (effectiveTargetCardId && CARD_DATABASE[effectiveTargetCardId]) {
      return CARD_DATABASE[effectiveTargetCardId];
    }
    return null;
  }, [effectiveTargetCardId]);

  // ─── 전적 기반 동적 난이도 조정 (DDA) ───────────────────────────
  const playerTotalPower = useMemo(() => {
    if (userStats?.totalPower && userStats.totalPower > 0) return userStats.totalPower;
    if (playerDeck && playerDeck.length > 0) {
      return playerDeck.reduce((acc, c) => acc + (c.power || getCardPower(c) || 100), 0);
    }
    return 1500;
  }, [userStats?.totalPower, playerDeck]);

  const [difficultyProfile, setDifficultyProfile] = useState<DynamicDifficultyProfile>(() =>
    getDynamicDifficultyProfile(playerTotalPower)
  );

  const refreshDifficulty = useCallback(() => {
    setDifficultyProfile(getDynamicDifficultyProfile(playerTotalPower));
  }, [playerTotalPower]);

  // Ranking Match Opponent & 3s Search State (DDA 전적 반영 초기화)
  const [activeRankOpponent, setActiveRankOpponent] = useState<RankOpponentInfo | null>(() => {
    if (!targetCardId && !opponentCustomDeck) {
      return pickNewRankOpponent(null, playerTotalPower, getDynamicDifficultyProfile(playerTotalPower));
    }
    return null;
  });
  const [rankingSearchCountdown, setRankingSearchCountdown] = useState<number | null>(null);

  // ─── 스마트 자동 라이프사이클 상태 (Auto LifeCycle Loop) ──────────
  const [smartLifeCycleActive, setSmartLifeCycleActive] = useState<boolean>(true);
  const [matchLoopCount, setMatchLoopCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hero_auto_loop_match_count');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [lifeCycleNotice, setLifeCycleNotice] = useState<{
    text: string;
    type: 'gacha' | 'upgrade' | 'break' | 'info';
    timestamp: number;
  } | null>(null);
  const [showRefreshBreakModal, setShowRefreshBreakModal] = useState<boolean>(false);
  const [refreshBreakType, setRefreshBreakType] = useState<'webtoon' | 'video'>('webtoon');
  const [refreshBreakCountdown, setRefreshBreakCountdown] = useState<number | null>(null);
  const [refreshEpisodeData, setRefreshEpisodeData] = useState<{
    titleKo: string;
    titleEn: string;
    imageUrl?: string;
    captionKo?: string;
    captionEn?: string;
    videoId?: string;
  }>({
    titleKo: '카단과 아케인의 메아리',
    titleEn: 'Kadan & Arcane Echoes',
    captionKo: '우직한 청년 카단의 모험이 아케인 대륙에서 펼쳐집니다.',
    captionEn: 'The journey of young Kadan begins in the realm of Arcane.'
  });

  // Mission Game 3s Dialogue Intro State
  const [showMissionDialogue, setShowMissionDialogue] = useState<boolean>(Boolean(effectiveTargetCardId));

  // 무승부 덱 TP 비교 타이 브레이커 상태
  const [tieBreakerInfo, setTieBreakerInfo] = useState<{
    playerTp: number;
    opponentTp: number;
    winner: 'player' | 'ai' | 'draw';
  } | null>(null);

  // Opponent name
  const effectiveOpponentName = useMemo(() => {
    if (activeRankOpponent) return activeRankOpponent.name;
    if (opponentName) return opponentName;
    if (missionCardData) {
      return language === 'ko' ? missionCardData.title : (missionCardData.title_en || missionCardData.title);
    }
    return generateAiName();
  }, [activeRankOpponent, opponentName, missionCardData, language]);

  // Props refs to prevent accidental game resets on prop updates (e.g. XP earn on victory)
  const playerDeckRef = useRef(playerDeck);
  playerDeckRef.current = playerDeck;
  const opponentCustomDeckRef = useRef(opponentCustomDeck);
  opponentCustomDeckRef.current = opponentCustomDeck;
  const activeRankOpponentRef = useRef(activeRankOpponent);
  activeRankOpponentRef.current = activeRankOpponent;
  const difficultyProfileRef = useRef(difficultyProfile);
  difficultyProfileRef.current = difficultyProfile;
  const effectiveTargetCardIdRef = useRef(effectiveTargetCardId);
  effectiveTargetCardIdRef.current = effectiveTargetCardId;

  // Deck generation helper
  const initMatchDecks = useCallback((overrideDeck?: CardData[]) => {
    const curPlayerDeck = playerDeckRef.current;
    const curOppCustomDeck = opponentCustomDeckRef.current;
    const curRankOpp = activeRankOpponentRef.current;
    const curDiffProfile = difficultyProfileRef.current;
    const curTargetCardId = effectiveTargetCardIdRef.current;

    // 1. Player Deck (5 cards)
    let pCards: CardData[] = [];
    if (curPlayerDeck && curPlayerDeck.length >= 5) {
      pCards = curPlayerDeck.slice(0, 5).map((c, i) => syncCardWithDatabase({
        ...c,
        id: `p-${i}-${Date.now()}`,
        owner: 'player'
      }));
    } else {
      pCards = INITIAL_CARDS.slice(0, 5).map((c, i) => syncCardWithDatabase({
        ...c,
        id: `p-${i}-${Date.now()}`,
        owner: 'player'
      }));
    }

    // 2. Opponent Deck (5 cards)
    let oCards: CardData[] = [];
    if (overrideDeck && overrideDeck.length >= 5) {
      oCards = overrideDeck.slice(0, 5).map((c, i) => syncCardWithDatabase({
        ...c,
        id: `opp-${i}-${Date.now()}`,
        owner: 'ai'
      }));
    } else if (curRankOpp) {
      const oppPower = curRankOpp.totalPower;
      const rankDeck = generateUniqueDeck(5);
      const allowedLevel = Math.min(curDiffProfile.maxCardLevel, Math.max(1, Math.floor(oppPower / 1200)));
      rankDeck.forEach(c => {
        c.owner = 'ai';
        c.level = allowedLevel;
        // DDA mercy(연패 구제)인 경우 상대 카드 능력치 소폭 완화
        if (curDiffProfile.tier === 'mercy') {
          c.stats = c.stats.map(s => Math.max(1, s - 1)) as [number, number, number, number];
        }
      });
      oCards = rankDeck.map((c, i) => syncCardWithDatabase({
        ...c,
        id: `rank-opp-${i}-${Date.now()}`,
        owner: 'ai'
      }));
    } else if (curOppCustomDeck && curOppCustomDeck.length >= 5) {
      oCards = curOppCustomDeck.slice(0, 5).map((c, i) => syncCardWithDatabase({
        ...c,
        id: `opp-${i}-${Date.now()}`,
        owner: 'ai'
      }));
    } else if (curTargetCardId && CARD_DATABASE[curTargetCardId]) {
      // 5 identical target cards for mission battle as per AGENTS.md
      const dbCard = CARD_DATABASE[curTargetCardId];
      oCards = Array(5).fill(null).map((_, i) => syncCardWithDatabase({
        id: `mission-opp-${curTargetCardId}-${i}-${Date.now()}`,
        imageIndex: curTargetCardId,
        title: dbCard.title,
        title_dis: dbCard.title_dis,
        title_en: dbCard.title_en,
        power: dbCard.power || 10,
        rarity: dbCard.rarity || 'bronze',
        owner: 'ai',
        stats: [...dbCard.stats],
        ability: dbCard.ability,
        element: dbCard.element,
        level: 1
      }));
    } else {
      oCards = ensureUniqueDeck(generateUniqueDeck(5), 5).map((c, i) => syncCardWithDatabase({
        ...c,
        id: `opp-ai-${i}-${Date.now()}`,
        owner: 'ai'
      }));
    }

    setPlayerHand(pCards);
    setOpponentHand(oCards);
    setBoard(Array(9).fill(null));
    setBoardShields(Array(9).fill(false));
    setTurn(Math.random() > 0.5 ? 'player' : 'ai');
    setTurnCount(1);
    setSelectedHandIndex(0); // auto-select first card for 1-tap UX
    setGameOver(false);
    setWinner(null);
    setTieBreakerInfo(null);
    setMatchResultReported(false);
    setRematchCountdown(null);
    setTutorialShopCountdown(null);
    setRankingAutoLoopCountdown(null);
    setFlippedSlots([]);
    setIsEvaluating(false);
    setActiveSkill(null);
    setSkillCharges({ power: 1, shield: 1, burst: 1 });
  }, []);

  // Initial game setup: mount 1회만 초기화하여 승리/보상 갱신 시 보드 리셋 방지
  const isInitialMountRef = useRef(false);
  useEffect(() => {
    if (!isInitialMountRef.current) {
      isInitialMountRef.current = true;
      initMatchDecks();
    }
  }, [initMatchDecks]);

  // ─── 스마트 자동 라이프사이클: 상점 뽑기 & 덱 자동 비교 교체 ───────
  const triggerAutoGachaAndUpgrade = useCallback(() => {
    const currentSns = sns || 0;
    if (currentSns < 100) return null;

    // 100 SNS 소모하여 상점 팩 뽑기
    if (updateSns) {
      updateSns(-100, 'auto_gacha_pack', 'spent');
    }

    // 카드 뽑기 (10% Gold, 30% Silver, 60% Bronze)
    const roll = Math.random();
    const rarity: CardRarity = roll < 0.10 ? 'gold' : (roll < 0.40 ? 'silver' : 'bronze');

    const allDbCards = Object.values(CARD_DATABASE);
    const pool = allDbCards.filter(c => (c.rarity || 'bronze').toLowerCase() === rarity.toLowerCase());
    const pickedCard = pool.length > 0
      ? pool[Math.floor(Math.random() * pool.length)]
      : allDbCards[Math.floor(Math.random() * allDbCards.length)];

    const cardId = pickedCard.id;
    if (addCard) {
      addCard(rarity, cardId, true);
    }

    const newCardData = syncCardWithDatabase({
      ...pickedCard,
      id: `auto-card-${cardId}-${Date.now()}`,
      owner: 'player',
      imageIndex: cardId
    });

    const newPower = getCardPower(newCardData);

    // 현재 5장 덱과 파워 비교 (가장 약한 카드 탐색)
    const curHand = playerHand.length === 5 ? playerHand : (playerDeck && playerDeck.length >= 5 ? playerDeck.slice(0, 5) : INITIAL_CARDS.slice(0, 5));
    let minPowerIdx = 0;
    let minPower = getCardPower(curHand[0]);

    curHand.forEach((c, idx) => {
      const p = getCardPower(c);
      if (p < minPower) {
        minPower = p;
        minPowerIdx = idx;
      }
    });

    const isUpgrade = newPower > minPower;
    if (isUpgrade) {
      const updatedDeck = [...curHand];
      const replacedCard = updatedDeck[minPowerIdx];
      updatedDeck[minPowerIdx] = syncCardWithDatabase({
        ...newCardData,
        id: `p-${minPowerIdx}-${Date.now()}`,
        owner: 'player'
      });

      setPlayerHand(updatedDeck);
      if (onUpdateDeck) {
        onUpdateDeck(updatedDeck);
      }

      setLifeCycleNotice({
        text: language === 'ko'
          ? `⚡ [덱 자동 강화] #${cardId} ${pickedCard.title} (${newPower}PW) 장착! (기존 #${replacedCard.imageIndex ?? replacedCard.id} ${minPower}PW 교체)`
          : `⚡ [Deck Auto-Upgraded] Equipped #${cardId} ${pickedCard.title_en || pickedCard.title} (${newPower}PW)!`,
        type: 'upgrade',
        timestamp: Date.now()
      });
      playSound('win');
      return { card: newCardData, isUpgrade: true, replacedCard };
    } else {
      setLifeCycleNotice({
        text: language === 'ko'
          ? `🎁 [상점 뽑기 완료] #${cardId} ${pickedCard.title} (${newPower}PW) 획득! (현재 덱이 더 강력하여 보관)`
          : `🎁 [Shop Draw] #${cardId} ${pickedCard.title_en || pickedCard.title} acquired (Existing deck is stronger).`,
        type: 'gacha',
        timestamp: Date.now()
      });
      playSound('tap');
      return { card: newCardData, isUpgrade: false };
    }
  }, [sns, updateSns, addCard, playerHand, playerDeck, onUpdateDeck, language, playSound]);

  // ─── 스마트 자동 라이프사이클: 웹툰/동영상 기분전환 라운지 ─────────
  const triggerRefreshBreak = useCallback(() => {
    // 50% 확률로 웹툰 or 비디오
    const isWebtoon = Math.random() < 0.5;
    const breakType: 'webtoon' | 'video' = isWebtoon ? 'webtoon' : 'video';
    setRefreshBreakType(breakType);

    if (isWebtoon) {
      const s1 = WEBTOON_SEASONS[0];
      const epCount = s1 ? s1.episodes.length : 1;
      const randomEpIdx = Math.floor(Math.random() * Math.max(1, epCount));
      const ep = s1?.episodes[randomEpIdx];
      const panel = ep?.panels && ep.panels.length > 0 ? ep.panels[0] : null;
      const pad = String(randomEpIdx + 1).padStart(2, '0');
      const fallbackImg = `https://dayyoung.github.io/image/cartoon/episode_${pad}/00_SNSHERO_Episode_${pad}_title_card_202608311350.jpeg`;

      setRefreshEpisodeData({
        titleKo: ep ? `카단과 아케인의 메아리 제${ep.episodeNumber}화` : '카단과 아케인의 메아리',
        titleEn: ep ? `Kadan & Arcane Echoes Ep.${ep.episodeNumber}` : 'Kadan & Arcane Echoes',
        imageUrl: panel?.imageUrl || fallbackImg,
        captionKo: panel?.narrationKo || '우직한 청년 카단의 모험이 아케인 대륙에서 펼쳐집니다.',
        captionEn: panel?.narrationEn || 'The journey of young Kadan begins in the realm of Arcane.'
      });
    } else {
      const epEntries = Object.entries(MOVIE_EPISODES);
      const randomEntry = epEntries[Math.floor(Math.random() * epEntries.length)];
      const epMeta = randomEntry ? randomEntry[1] : MOVIE_EPISODES[1];
      setRefreshEpisodeData({
        titleKo: `시즌 공식 애니메이션: ${epMeta.titleKo}`,
        titleEn: `Official Anime: ${epMeta.titleEn}`,
        videoId: epMeta.videoId || 'L01HUesRGvQ',
        captionKo: `${epMeta.titleKo} — 화려한 영웅들의 시네마틱 컷씬`,
        captionEn: `${epMeta.titleEn} — Cinematic highlight`
      });
    }

    setRefreshBreakCountdown(4);
    setShowRefreshBreakModal(true);
    setLifeCycleNotice({
      text: language === 'ko'
        ? `☕ [기분전환 타임] ${isWebtoon ? '웹툰' : '동영상'} 감상으로 멘탈 충전 중... (+10 SNS 보너스)`
        : `☕ [Refresh Break] Enjoying ${isWebtoon ? 'Webtoon' : 'Video'}... (+10 SNS Bonus)`,
      type: 'break',
      timestamp: Date.now()
    });
  }, [language]);

  // 기분전환 4초 카운트다운 타이머 제어
  useEffect(() => {
    if (!showRefreshBreakModal || refreshBreakCountdown === null) return;
    if (refreshBreakCountdown <= 0) {
      setShowRefreshBreakModal(false);
      setRefreshBreakCountdown(null);
      // 힐링 보너스 +10 SNS 지급
      if (updateSns) {
        updateSns(10, 'mental_refresh_bonus', 'earned');
      }
      playSound('win');
      // 다음 랭킹 상대 검색 시작 (전적 기반 DDA 반영)
      refreshDifficulty();
      const nextOpp = pickNewRankOpponent(activeRankOpponent?.name || effectiveOpponentName, playerTotalPower, getDynamicDifficultyProfile(playerTotalPower));
      setActiveRankOpponent(nextOpp);
      if (isAutoBattle) {
        setRankingSearchCountdown(null);
        initMatchDecks();
      } else {
        setRankingSearchCountdown(3);
      }
      return;
    }

    const timer = setTimeout(() => {
      setRefreshBreakCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [showRefreshBreakModal, refreshBreakCountdown, updateSns, playSound, activeRankOpponent?.name, effectiveOpponentName]);

  // ─── Score Computation ─────────────────────────────────────────────
  const score = useMemo(() => {
    let p = playerHand.length;
    let o = opponentHand.length;
    board.forEach(cell => {
      if (!cell) return;
      if (cell.owner === 'player') p += 1;
      else if (cell.owner === 'ai') o += 1;
    });
    return { player: p, opponent: o };
  }, [playerHand, opponentHand, board]);

  // ─── Flip Adjacency Logic (Triple Triad) ───────────────────────────
  const executeFlips = useCallback((placedCard: CardData, slotIdx: number, currentBoard: (CardData | null)[], currentShields: boolean[]) => {
    const row = Math.floor(slotIdx / 3);
    const col = slotIdx % 3;
    const flips: number[] = [];
    const newBoard = [...currentBoard];

    // [Top, Right, Bottom, Left]
    const pStats = placedCard.stats || [5, 5, 5, 5];

    // 1. Check Top (row > 0, neighbor is slotIdx - 3)
    if (row > 0) {
      const topIdx = slotIdx - 3;
      const target = newBoard[topIdx];
      if (target && target.owner !== placedCard.owner && !currentShields[topIdx]) {
        const myStat = pStats[0]; // My Top
        const targetStat = (target.stats || [5, 5, 5, 5])[2]; // Target's Bottom
        if (myStat > targetStat) flips.push(topIdx);
      }
    }

    // 2. Check Right (col < 2, neighbor is slotIdx + 1)
    if (col < 2) {
      const rightIdx = slotIdx + 1;
      const target = newBoard[rightIdx];
      if (target && target.owner !== placedCard.owner && !currentShields[rightIdx]) {
        const myStat = pStats[1]; // My Right
        const targetStat = (target.stats || [5, 5, 5, 5])[3]; // Target's Left
        if (myStat > targetStat) flips.push(rightIdx);
      }
    }

    // 3. Check Bottom (row < 2, neighbor is slotIdx + 3)
    if (row < 2) {
      const bottomIdx = slotIdx + 3;
      const target = newBoard[bottomIdx];
      if (target && target.owner !== placedCard.owner && !currentShields[bottomIdx]) {
        const myStat = pStats[2]; // My Bottom
        const targetStat = (target.stats || [5, 5, 5, 5])[0]; // Target's Top
        if (myStat > targetStat) flips.push(bottomIdx);
      }
    }

    // 4. Check Left (col > 0, neighbor is slotIdx - 1)
    if (col > 0) {
      const leftIdx = slotIdx - 1;
      const target = newBoard[leftIdx];
      if (target && target.owner !== placedCard.owner && !currentShields[leftIdx]) {
        const myStat = pStats[3]; // My Left
        const targetStat = (target.stats || [5, 5, 5, 5])[1]; // Target's Right
        if (myStat > targetStat) flips.push(leftIdx);
      }
    }

    // Apply flips to board
    flips.forEach(idx => {
      if (newBoard[idx]) {
        newBoard[idx] = { ...newBoard[idx]!, owner: placedCard.owner };
      }
    });

    return { updatedBoard: newBoard, flippedIndices: flips };
  }, []);

  // ─── Play Move on Board ─────────────────────────────────────────────
  const handlePlaceCard = useCallback((slotIdx: number, card: CardData, isPlayer: boolean) => {
    if (board[slotIdx] !== null || gameOver || isEvaluating) return;

    setIsEvaluating(true);
    playSound('place');

    // Apply active skill buffs if player move
    let cardToPlace = { ...card, owner: isPlayer ? ('player' as const) : ('ai' as const) };
    const nextShields = [...boardShields];

    if (isPlayer && activeSkill === 'power') {
      // Power Boost: +2 to all 4 directional stats
      cardToPlace.stats = cardToPlace.stats.map(s => s + 2) as [number, number, number, number];
      cardToPlace.bonusPower = (cardToPlace.bonusPower || 0) + 20;
    }
    if (isPlayer && activeSkill === 'shield') {
      nextShields[slotIdx] = true;
    }

    // Put card on board
    const tempBoard = [...board];
    tempBoard[slotIdx] = cardToPlace;

    // Evaluate flips
    const { updatedBoard, flippedIndices } = executeFlips(cardToPlace, slotIdx, tempBoard, nextShields);

    if (flippedIndices.length > 0) {
      setFlippedSlots(flippedIndices);
      playSound('flip');
      setTimeout(() => setFlippedSlots([]), 800);
      try {
        const origins: { x: number; y: number }[] = [];
        flippedIndices.forEach(idx => {
          const el = document.getElementById(`board-slot-${idx}`);
          if (el) {
            const r = el.getBoundingClientRect();
            origins.push({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
          }
        });
        triggerRainbowFlip(flippedIndices.length, origins.length > 0 ? origins : undefined);
      } catch {
        triggerRainbowFlip(flippedIndices.length);
      }
    }

    setBoard(updatedBoard);
    setBoardShields(nextShields);

    // Remove played card from hand
    if (isPlayer) {
      setPlayerHand(prev => prev.filter(c => c.id !== card.id));
      setActiveSkill(null);
      setSelectedHandIndex(null);
    } else {
      setOpponentHand(prev => prev.filter(c => c.id !== card.id));
    }

    // Check match completion
    const filledCount = updatedBoard.filter(c => c !== null).length;
    if (filledCount >= 9 || (isPlayer ? playerHand.length <= 1 : opponentHand.length <= 1)) {
      // Game Over
      setTimeout(() => {
        let pScore = isPlayer ? playerHand.filter(c => c.id !== card.id).length : playerHand.length;
        let oScore = !isPlayer ? opponentHand.filter(c => c.id !== card.id).length : opponentHand.length;
        updatedBoard.forEach(c => {
          if (!c) return;
          if (c.owner === 'player') pScore += 1;
          else if (c.owner === 'ai') oScore += 1;
        });

        let winState: 'player' | 'ai' | 'draw' = pScore > oScore ? 'player' : (pScore < oScore ? 'ai' : 'draw');

        // 무승부인 경우 서로의 덱 TP를 표시하여 비교하고 높은 사람을 승으로 처리 (승률 및 전적 반영)
        if (winState === 'draw') {
          const curPDeck = playerDeckRef.current;
          let pTp = 0;
          if (curPDeck && curPDeck.length > 0) {
            pTp = curPDeck.slice(0, 5).reduce((acc, c) => acc + (c.power || getCardPower(c) || 100), 0);
          } else {
            pTp = playerTotalPower;
          }

          let oTp = 0;
          if (activeRankOpponentRef.current?.totalPower) {
            oTp = activeRankOpponentRef.current.totalPower;
          } else if (opponentCustomDeckRef.current && opponentCustomDeckRef.current.length > 0) {
            oTp = opponentCustomDeckRef.current.slice(0, 5).reduce((acc, c) => acc + (c.power || getCardPower(c) || 100), 0);
          } else if (effectiveTargetCardIdRef.current && CARD_DATABASE[effectiveTargetCardIdRef.current]) {
            oTp = (CARD_DATABASE[effectiveTargetCardIdRef.current].power || 10) * 5;
          } else {
            oTp = Math.round(pTp * 0.98);
          }

          if (pTp > oTp) {
            winState = 'player';
          } else if (pTp < oTp) {
            winState = 'ai';
          } else {
            winState = 'draw';
          }

          setTieBreakerInfo({
            playerTp: pTp,
            opponentTp: oTp,
            winner: winState,
          });
        } else {
          setTieBreakerInfo(null);
        }

        setWinner(winState);
        setGameOver(true);
        setIsEvaluating(false);

        const calculatedResult: 'win' | 'loss' | 'draw' = winState === 'player' ? 'win' : (winState === 'ai' ? 'loss' : 'draw');
        const currentBattleType: 'pvp_attack' | 'robot' = isRankingMatch ? 'pvp_attack' : 'robot';
        const currentOppInfo = activeRankOpponent ? {
          id: activeRankOpponent.id,
          name: activeRankOpponent.name,
          sns: activeRankOpponent.sns,
          wins: activeRankOpponent.wins,
          losses: activeRankOpponent.losses,
          draws: activeRankOpponent.draws
        } : (opponentName ? { id: `opp-${Date.now()}`, name: opponentName } : undefined);

        if (recordMatchResult && !matchResultReported) {
          const rewardAmount = winState === 'player' ? 30 : (winState === 'draw' ? 15 : 10);
          recordMatchResult(calculatedResult, rewardAmount, undefined, currentBattleType, currentOppInfo);
          setMatchResultReported(true);
        }

        if (winState === 'player') {
          playSound('win');
          const earnSns = 30;
          if (!recordMatchResult && updateSns) updateSns(earnSns, 'battle_victory', 'earned');
          if (!recordMatchResult && updateStats) {
            updateStats({
              wins: (userStats?.wins || 0) + 1,
              winStreak: (userStats?.winStreak || 0) + 1
            });
          }
          if (onEarnXp) onEarnXp(50);

          // If mission battle target: handle drop or enhancement
          if (effectiveTargetCardId && addCard) {
            const isOwned = inventory.some((item: any) => item.cardId === effectiveTargetCardId || item.index === effectiveTargetCardId);
            const dbCard = CARD_DATABASE[effectiveTargetCardId];
            const cardRarity = (dbCard?.rarity || 'bronze') as CardRarity;
            if (!isOwned) {
              addCard(cardRarity, effectiveTargetCardId);
            } else {
              // 45% potential enhancement
              if (Math.random() < 0.45) {
                addCard(cardRarity, effectiveTargetCardId, true);
                try {
                  const key = `hero_card_enhancement_${effectiveTargetCardId}`;
                  const currentLv = parseInt(localStorage.getItem(key) || '1', 10);
                  localStorage.setItem(key, String(currentLv + 1));
                } catch {}
              }
            }
          }

          // Tower of Trials: Floor Victory & Boss Milestone Rewards
          if (towerFloor) {
            try {
              const prevFloor = parseInt(localStorage.getItem('hero_tower_trials_floor_v1') || '0', 10);
              if (towerFloor > prevFloor) {
                localStorage.setItem('hero_tower_trials_floor_v1', towerFloor.toString());
              }
              const isBoss = towerFloor % 5 === 0;
              let rewardDiamonds = isBoss ? (towerFloor === 50 ? 500 : 50 + towerFloor * 2) : 15;
              let rewardSns = isBoss ? 100 + towerFloor * 5 : 30;

              // 첫 5층 보스 격파 웰컴 보너스 (+50 SNS, +20 Gems)
              let isWelcomeFirstBoss = false;
              if (isBoss && towerFloor >= 5) {
                const welcomeKey = 'hero_tower_first_boss_reward';
                if (!localStorage.getItem(welcomeKey)) {
                  localStorage.setItem(welcomeKey, 'true');
                  rewardSns += 50;
                  rewardDiamonds += 20;
                  isWelcomeFirstBoss = true;
                }
              }

              // 칭호 & 코스튬 해금 매핑
              const MILESTONE_TITLES: Record<number, { titleKo: string; titleEn: string; costumeKo?: string; costumeEn?: string }> = {
                5: { titleKo: '탑의 도전자', titleEn: 'Tower Challenger' },
                10: { titleKo: '철벽의 수호파괴자', titleEn: 'Shieldbreaker', costumeKo: '타워 크림슨 아우라', costumeEn: 'Tower Crimson Aura' },
                20: { titleKo: '심연의 지배자', titleEn: 'Abyssal Ruler', costumeKo: '심연의 보이드 아우라', costumeEn: 'Abyssal Void Aura' },
                30: { titleKo: '절대 전술사령관', titleEn: 'Grand Tactician', costumeKo: '황금 불꽃 절대 아우라', costumeEn: 'Golden Flame Absolute Aura' },
                50: { titleKo: '시련의 탑 절대 패왕', titleEn: 'Overlord of the Tower', costumeKo: '성운의 패왕 풀세트', costumeEn: 'Nebula Overlord Full Set' },
              };
              const milestone = MILESTONE_TITLES[towerFloor];
              let unlockedTitleName: string | undefined;
              let unlockedCostumeName: string | undefined;
              if (milestone) {
                const titleToSave = language === 'ko' ? milestone.titleKo : milestone.titleEn;
                unlockedTitleName = titleToSave;
                const currentTitles: string[] = JSON.parse(localStorage.getItem('hero_tower_titles_v1') || '[]');
                if (!currentTitles.includes(titleToSave)) {
                  currentTitles.push(titleToSave);
                  localStorage.setItem('hero_tower_titles_v1', JSON.stringify(currentTitles));
                }
                if (milestone.costumeKo) {
                  const costumeToSave = language === 'ko' ? milestone.costumeKo : milestone.costumeEn!;
                  unlockedCostumeName = costumeToSave;
                  const currentCostumes: string[] = JSON.parse(localStorage.getItem('hero_tower_costumes_v1') || '[]');
                  if (!currentCostumes.includes(costumeToSave)) {
                    currentCostumes.push(costumeToSave);
                    localStorage.setItem('hero_tower_costumes_v1', JSON.stringify(currentCostumes));
                  }
                }
              }

              // 보상 지급 (SNS 지갑 및 다이아몬드 반영)
              const curSns = parseInt(localStorage.getItem('hero_user_sns') || '0', 10);
              localStorage.setItem('hero_user_sns', (curSns + rewardSns).toString());
              window.dispatchEvent(new Event('snshero_sns_updated'));

              const curDiamonds = parseInt(localStorage.getItem('hero_user_diamonds') || '0', 10);
              localStorage.setItem('hero_user_diamonds', (curDiamonds + rewardDiamonds).toString());
              window.dispatchEvent(new Event('snshero_diamonds_updated'));

              if (isBoss) {
                setTimeout(() => {
                  setTowerBossClearModal({
                    floor: towerFloor,
                    title: unlockedTitleName,
                    costume: unlockedCostumeName,
                    diamonds: rewardDiamonds,
                    snsReward: rewardSns,
                    isWelcomeFirstBoss,
                  });
                }, 500);
              }
            } catch {}
          }
        } else if (winState === 'ai') {
          playSound('defeat');
          const earnSns = 10;
          if (updateSns) updateSns(earnSns, 'battle_defeat_reward', 'earned');
          if (!recordMatchResult && updateStats) {
            updateStats({
              losses: (userStats?.losses || 0) + 1,
              winStreak: 0
            });
          }
        } else {
          // Draw
          playSound('place');
          const earnSns = 15;
          if (updateSns) updateSns(earnSns, 'battle_draw', 'earned');
          if (!recordMatchResult && updateStats) {
            updateStats({ draws: (userStats?.draws || 0) + 1 });
          }
        }
      }, 500 / battleSpeed);
      return;
    }

    // Switch turn
    setTimeout(() => {
      setTurn(isPlayer ? 'ai' : 'player');
      setTurnCount(prev => prev + 1);
      setIsEvaluating(false);
      if (!isPlayer) {
        // Automatically pre-select first remaining card for player convenience
        setSelectedHandIndex(0);
      }
    }, 400 / battleSpeed);
  }, [board, gameOver, isEvaluating, boardShields, activeSkill, executeFlips, playSound, battleSpeed, playerHand.length, opponentHand.length, updateSns, updateStats, userStats, onEarnXp, targetCardId, addCard, inventory]);

  // ─── AI Opponent / Auto Player Logic ───────────────────────────────
  useEffect(() => {
    if (gameOver || isEvaluating || rankingSearchCountdown !== null || showMissionDialogue) return;

    const isFirstMove = board.every(c => c === null);

    // 1. AI Opponent's Turn
    if (turn === 'ai') {
      if (opponentHand.length === 0) return;

      const emptySlots = board.map((c, i) => (c === null ? i : -1)).filter(i => i !== -1);
      if (emptySlots.length === 0) return;

      const delay = isFirstMove ? Math.round(350 / battleSpeed) : Math.round(700 / battleSpeed);
      const timer = setTimeout(() => {
        // DDA: AI 휴먼 에러율 (전적에 따라 최선 수가 아닌 차선 수를 둘 확률)
        const shouldMakeMistake = Math.random() < difficultyProfile.aiMistakeChance;

        const candidateMoves: { slot: number; card: CardData; flips: number }[] = [];
        for (const card of opponentHand) {
          for (const slot of emptySlots) {
            const tempPlaced = { ...card, owner: 'ai' as const };
            const { flippedIndices } = executeFlips(tempPlaced, slot, board, boardShields);
            candidateMoves.push({ slot, card, flips: flippedIndices.length });
          }
        }

        // 플립 수 기준 내림차순 정렬
        candidateMoves.sort((a, b) => b.flips - a.flips);

        let chosenMove = candidateMoves[0];
        if (shouldMakeMistake && candidateMoves.length > 1) {
          // 최선의 수 대신 2위나 3위 수 선택 (유저에게 역전/뒤집기 찬스 제공)
          const mistakeCandidates = candidateMoves.slice(1, Math.min(3, candidateMoves.length));
          chosenMove = mistakeCandidates[Math.floor(Math.random() * mistakeCandidates.length)] || candidateMoves[0];
        }

        handlePlaceCard(chosenMove.slot, chosenMove.card, false);
      }, delay);

      return () => clearTimeout(timer);
    }

    // 2. Player's Turn with Auto-Battle ON
    if (turn === 'player' && isAutoBattle) {
      if (playerHand.length === 0) return;

      const emptySlots = board.map((c, i) => (c === null ? i : -1)).filter(i => i !== -1);
      if (emptySlots.length === 0) return;

      const delay = isFirstMove ? Math.round(300 / battleSpeed) : Math.round(600 / battleSpeed);
      const timer = setTimeout(() => {
        let bestSlot = emptySlots[0];
        let bestCard = playerHand[0];
        let maxFlips = -1;

        for (const card of playerHand) {
          for (const slot of emptySlots) {
            const tempPlaced = { ...card, owner: 'player' as const };
            const { flippedIndices } = executeFlips(tempPlaced, slot, board, boardShields);
            if (flippedIndices.length > maxFlips) {
              maxFlips = flippedIndices.length;
              bestSlot = slot;
              bestCard = card;
            }
          }
        }

        handlePlaceCard(bestSlot, bestCard, true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [turn, isAutoBattle, gameOver, isEvaluating, rankingSearchCountdown, showMissionDialogue, opponentHand, playerHand, board, boardShields, battleSpeed, executeFlips, handlePlaceCard, difficultyProfile.aiMistakeChance]);

  // ─── Interactive Skill Activations ─────────────────────────────────
  const handleUsePowerSkill = () => {
    if (turn !== 'player' || gameOver || isEvaluating || skillCharges.power <= 0) return;
    playSound('skill');
    setActiveSkill(prev => (prev === 'power' ? null : 'power'));
    setSkillCharges(prev => ({ ...prev, power: Math.max(0, prev.power - 1) }));
  };

  const handleUseShieldSkill = () => {
    if (turn !== 'player' || gameOver || isEvaluating || skillCharges.shield <= 0) return;
    playSound('skill');
    setActiveSkill(prev => (prev === 'shield' ? null : 'shield'));
    setSkillCharges(prev => ({ ...prev, shield: Math.max(0, prev.shield - 1) }));
  };

  const handleUseBurstSkill = () => {
    if (turn !== 'player' || gameOver || isEvaluating || skillCharges.burst <= 0) return;
    playSound('skill');
    // Burst skill: immediately boost all player cards currently on board by +1
    setBoard(prev => prev.map(c => {
      if (!c || c.owner !== 'player') return c;
      return {
        ...c,
        stats: c.stats.map(s => s + 1) as [number, number, number, number],
        power: (c.power || 10) + 10
      };
    }));
    setSkillCharges(prev => ({ ...prev, burst: 0 }));
  };

  const toggleAuto = () => {
    playSound('tap');
    setIsAutoBattle(prev => {
      const next = !prev;
      if (onToggleAutoBattle) onToggleAutoBattle();
      return next;
    });
  };

  const handleExitGame = useCallback(() => {
    playSound('tap');
    setRematchCountdown(null);
    setTutorialShopCountdown(null);
    setRankingSearchCountdown(null);
    if (gameOver && winner && recordMatchResult && !matchResultReported) {
      const calculatedResult: 'win' | 'loss' | 'draw' = winner === 'player' ? 'win' : (winner === 'ai' ? 'loss' : 'draw');
      const currentBattleType: 'pvp_attack' | 'robot' = isRankingMatch ? 'pvp_attack' : 'robot';
      const currentOppInfo = activeRankOpponent ? {
        id: activeRankOpponent.id,
        name: activeRankOpponent.name,
        sns: activeRankOpponent.sns,
        wins: activeRankOpponent.wins,
        losses: activeRankOpponent.losses,
        draws: activeRankOpponent.draws
      } : (opponentName ? { id: `opp-${Date.now()}`, name: opponentName } : undefined);

      recordMatchResult(calculatedResult, undefined, undefined, currentBattleType, currentOppInfo);
      setMatchResultReported(true);
    }
    try {
      localStorage.removeItem('hero_auto_loop_is_ranking');
    } catch {}
    onBack();
  }, [gameOver, winner, recordMatchResult, matchResultReported, onBack, playSound, isRankingMatch, activeRankOpponent, opponentName]);

  useEffect(() => {
    if (isRankingMatch) {
      try {
        localStorage.setItem('hero_auto_loop_is_ranking', 'true');
      } catch {}
    }
  }, [isRankingMatch]);

  useEffect(() => {
    if (!gameOver || !winner) return;
    if (autoCloseOnComplete) {
      const timer = setTimeout(() => {
        handleExitGame();
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [gameOver, winner, autoCloseOnComplete, handleExitGame]);

  // 브라우저/스마트폰 물리 뒤로가기 버튼/제스처 시 게임 재시작 방지 및 안전한 종료
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.history.pushState({ screen: 'mobile-card-play' }, '');
    } catch {
      // ignore
    }

    const handlePopState = () => {
      handleExitGame();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleExitGame]);

  // 미션 및 카드 플레이: 승/패/무승부 처리 (튜토리얼 vs 랭킹대전 vs 미션 게임 분기)
  useEffect(() => {
    if (!gameOver || !winner) {
      setRematchCountdown(null);
      setTutorialShopCountdown(null);
      setRankingSearchCountdown(null);
      return;
    }

    // 1) 탑 등반 5층 보스 클리어 모달이 뜬 경우: 모달 확인을 위해 카운트다운 중지
    if (towerBossClearModal) {
      setRematchCountdown(null);
      setTutorialShopCountdown(null);
      setRankingSearchCountdown(null);
      return;
    }

    // 2) 튜토리얼 모드일 때: 재대결하지 않고 상점으로 이동
    if (isTutorialMode || (tutorialStep > 0 && tutorialStep <= 7)) {
      setRematchCountdown(null);
      setTutorialShopCountdown(2); // 2초 후 상점 자동 이동
      return;
    }

    // 3) RPG 자동완료 모드인 경우
    if (autoCloseOnComplete) {
      setRematchCountdown(null);
      setTutorialShopCountdown(null);
      return;
    }

    // 4) 랭킹대전인 경우: 승패팝업 무조건 3초 표시 후 재시작
    if (isRankingMatch) {
      setTutorialShopCountdown(null);
      setRematchCountdown(null);
      setRankingSearchCountdown(null);
      // 승패팝업 무조건 3초 표시
      setRankingAutoLoopCountdown(3);
      return;
    }

    // 5) 미션 게임 또는 일반 모드: 무조건 3초 후 재대결
    setTutorialShopCountdown(null);
    setRankingAutoLoopCountdown(null);
    setRematchCountdown(3);
  }, [gameOver, winner, isTutorialMode, tutorialStep, autoCloseOnComplete, towerBossClearModal, isRankingMatch, isAutoBattle]);

  // 랭킹대전 스마트 루프 카운트다운 감소 및 0초 도달 시 분기 실행
  useEffect(() => {
    if (rankingAutoLoopCountdown === null) return;
    if (rankingAutoLoopCountdown <= 0) {
      setRankingAutoLoopCountdown(null);
      const canDrawPack = smartLifeCycleActive && (sns || 0) >= 100;

      // [1] 일정 수준 SNS(100 이상)가 모이면 상점에서 카드 뽑기 진행! (승리/패배 불문)
      if (canDrawPack) {
        try {
          localStorage.setItem('hero_auto_loop_mode', 'gacha_start');
          localStorage.setItem('hero_auto_loop_is_ranking', 'true');
        } catch {}
        if (onNavigate) {
          onNavigate('shop');
        } else {
          handleExitGame();
        }
        return;
      }

      const nextCount = matchLoopCount + 1;
      setMatchLoopCount(nextCount);
      try {
        localStorage.setItem('hero_auto_loop_match_count', String(nextCount));
      } catch {}

      // [2] 매 3번째 경기 완료 시 가끔 웹툰/동영상 시청으로 기분전환 타임!
      if (smartLifeCycleActive && nextCount > 0 && nextCount % 3 === 0) {
        setGameOver(false);
        triggerRefreshBreak();
      } else {
        // [3] 일반 대전: 결과 모달 닫고 새로운 라이벌 매칭 후 즉시 랭킹플레이 재시작
        setGameOver(false);
        setWinner(null);
        setTieBreakerInfo(null);
        refreshDifficulty();
        const nextOpp = pickNewRankOpponent(activeRankOpponent?.name || effectiveOpponentName, playerTotalPower, getDynamicDifficultyProfile(playerTotalPower));
        setActiveRankOpponent(nextOpp);
        setRankingSearchCountdown(null);
        setLifeCycleNotice({
          text: language === 'ko'
            ? `⚔️ [랭킹대전] 새로운 라이벌 [${nextOpp.name}] 매칭 완료!`
            : `⚔️ [Rank Match] Matched with [${nextOpp.name}]!`,
          type: 'info',
          timestamp: Date.now()
        });
        initMatchDecks();
      }
      return;
    }

    const timer = setTimeout(() => {
      setRankingAutoLoopCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [rankingAutoLoopCountdown, winner, smartLifeCycleActive, sns, onNavigate, handleExitGame, matchLoopCount, triggerRefreshBreak, playerTotalPower, activeRankOpponent?.name, effectiveOpponentName, refreshDifficulty, pickNewRankOpponent]);

  const handleImmediateShopGo = () => {
    setRankingAutoLoopCountdown(null);
    try {
      localStorage.setItem('hero_auto_loop_mode', 'gacha_start');
      localStorage.setItem('hero_auto_loop_is_ranking', 'true');
    } catch {}
    if (onNavigate) {
      onNavigate('shop');
    } else {
      handleExitGame();
    }
  };

  const handleImmediateNextRankBattle = () => {
    playSound('tap');
    setRankingAutoLoopCountdown(null);
    setGameOver(false);
    setWinner(null);
    setTieBreakerInfo(null);
    refreshDifficulty();
    const nextOpp = pickNewRankOpponent(activeRankOpponent?.name || effectiveOpponentName, playerTotalPower, getDynamicDifficultyProfile(playerTotalPower));
    setActiveRankOpponent(nextOpp);
    setRankingSearchCountdown(null);
    initMatchDecks();
  };

  // 랭킹대전: 3초 검색 카운트다운 후 새로운 상대와 매치 시작
  useEffect(() => {
    if (rankingSearchCountdown === null) return;
    if (rankingSearchCountdown <= 0) {
      setRankingSearchCountdown(null);
      initMatchDecks();
      return;
    }
    const timer = setTimeout(() => {
      setRankingSearchCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [rankingSearchCountdown, initMatchDecks]);

  // 3초 카운트다운 감소 및 0초 도달 시 자동 재대결 (미션 게임은 3초 대사 보여주고 시작)
  useEffect(() => {
    if (rematchCountdown === null) return;
    if (rematchCountdown <= 0) {
      setRematchCountdown(null);
      if (effectiveTargetCardId) {
        // 미션 게임: 3초 대사 보여주고 시작
        setShowMissionDialogue(true);
      }
      initMatchDecks();
      return;
    }
    const timer = setTimeout(() => {
      setRematchCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [rematchCountdown, effectiveTargetCardId, initMatchDecks]);

  // 튜토리얼 모드: 카운트다운 후 상점으로 이동
  useEffect(() => {
    if (tutorialShopCountdown === null) return;
    if (tutorialShopCountdown <= 0) {
      setTutorialShopCountdown(null);
      if (onTutorialToShop) {
        onTutorialToShop();
      } else {
        handleExitGame();
      }
      return;
    }
    const timer = setTimeout(() => {
      setTutorialShopCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [tutorialShopCountdown, onTutorialToShop, handleExitGame]);

  return (
    <div 
      id="mobile-card-play-viewport"
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#070a10] text-slate-100 flex flex-col justify-between font-mono z-[100]"
    >
      {/* ─── Compact Header (36px + safe-area) ─────────────────────────────────── */}
      <header className="w-full h-[calc(env(safe-area-inset-top,0px)+2.25rem)] pt-[env(safe-area-inset-top,0px)] px-2 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between shrink-0 z-30">
        <button
          type="button"
          onClick={handleExitGame}
          className="h-7 px-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 rounded-sm text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-1.5 truncate px-1">
          <span className="text-[10px] text-amber-400 font-black tracking-wider uppercase truncate">
            {towerFloor
              ? (towerFloor % 5 === 0
                  ? `👑 [${towerFloor}F BOSS] ${effectiveOpponentName}`
                  : `🗼 [${towerFloor}F] ${effectiveOpponentName}`)
              : (effectiveTargetCardId ? `🎯 No.${effectiveTargetCardId} ${effectiveOpponentName}` : `⚔️ ${effectiveOpponentName}`)}
          </span>
          {isRankingMatch && (
            <span className={cn("text-[9px] px-1 py-0.2 rounded-xs font-mono font-bold shrink-0 border", difficultyProfile.badgeColor)}>
              {language === 'ko' ? difficultyProfile.labelKo : difficultyProfile.labelEn}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMuted(prev => !prev)}
            className="w-7 h-7 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 rounded-sm flex items-center justify-center text-[10px] active:scale-95 cursor-pointer"
            aria-label="Sound Toggle"
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
          <button
            type="button"
            onClick={() => {
              playSound('tap');
              initMatchDecks();
            }}
            className="w-7 h-7 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 rounded-sm flex items-center justify-center text-[10px] active:scale-95 cursor-pointer"
            aria-label="Restart Match"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </header>

      {/* ─── 스마트 자동 라이프사이클 HUD 바 (Smart LifeCycle Bar) ───────── */}
      {isRankingMatch && (
        <div 
          id="smart-lifecycle-hud"
          className="w-full px-2 py-1 bg-[#0c101a] border-b border-stone-800 flex items-center justify-between shrink-0 text-[10px] text-stone-300 font-mono gap-1 z-20"
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="px-1 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black rounded-xs text-[9px] shrink-0 flex items-center gap-0.5">
              <Bot size={10} className="animate-spin text-amber-300" />
              <span>LOOP</span>
            </span>
            <span className="font-bold text-stone-300 truncate">
              ⚔️ {language === 'ko' ? `매치 (${matchLoopCount % 4}/4)` : `Match (${matchLoopCount % 4}/4)`}
            </span>
            <span className="text-amber-400 font-bold shrink-0">
              🪙 {sns} SNS {sns >= 100 ? '🎁[뽑기대기]' : ''}
            </span>
            <span className="text-stone-400 shrink-0 hidden sm:inline">
              ☕ {4 - (matchLoopCount % 4)}판 후 기분전환
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {lifeCycleNotice && (
              <span className="px-1.5 py-0.5 bg-stone-900 border border-amber-500/40 text-amber-300 rounded-xs text-[9px] max-w-[130px] sm:max-w-[180px] truncate animate-pulse">
                {lifeCycleNotice.text}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSmartLifeCycleActive(prev => !prev);
                playSound('tap');
              }}
              className={cn(
                "px-1.5 py-0.5 rounded-xs text-[9px] font-bold border transition-colors cursor-pointer",
                smartLifeCycleActive 
                  ? "bg-emerald-950 text-emerald-300 border-emerald-500/40" 
                  : "bg-stone-900 text-stone-500 border-stone-700"
              )}
            >
              {smartLifeCycleActive ? '루프:ON' : '루프:OFF'}
            </button>
          </div>
        </div>
      )}

      {/* ─── 1. 상단 광고 (Top Ad Banner: max 48px) ────────────────── */}
      <div 
        id="mobile-card-top-ad"
        className="w-full h-11 max-h-11 bg-black/80 border-b border-stone-800/80 px-2 flex items-center justify-center relative overflow-hidden shrink-0"
      >
        <AdSenseBanner isAdRemoved={isAdRemoved} format="horizontal" className="w-full h-full max-h-11" />
        {/* Ad Fallback / Sponsor Banner */}
        <div className="flex items-center justify-between w-full max-w-sm px-2 text-[10px] text-amber-300/90 font-mono tracking-tight pointer-events-none">
          <span className="flex items-center gap-1">
            <Sparkles size={12} className="text-amber-400 animate-pulse" />
            <strong className="text-white">SNSHERO REVOLUTION</strong>
          </span>
          <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded-xs">
            {language === 'ko' ? '시즌1 카드 배틀' : 'Season 1'}
          </span>
        </div>
      </div>

      {/* ─── 2. 상대 덱 (Opponent Deck: 5 cards, 우리 카드와 동일 규격) ─────────────── */}
      <div 
        id="mobile-card-opponent-deck"
        className="w-full px-2 py-1.5 bg-[#090d16] border-b border-stone-800/80 flex flex-col items-center shrink-0"
      >
        <div className="w-full max-w-sm flex items-center justify-between mb-1 text-[9px] text-stone-400">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-rose-400">
              {language === 'ko' ? '상대 카드 덱' : 'OPPONENT DECK'} ({opponentHand.length}/5)
            </span>
            {isRankingMatch && (
              <span className={cn("text-[8px] px-1 py-0.2 rounded-xs font-mono font-bold border", difficultyProfile.badgeColor)}>
                {language === 'ko' ? difficultyProfile.labelKo : difficultyProfile.labelEn}
              </span>
            )}
          </div>
          <span className="text-[8px] text-stone-500">
            {turn === 'ai' 
              ? (language === 'ko' ? '▶ 상대 턴 진행 중...' : '▶ Opponent thinking...') 
              : (language === 'ko' ? '상대 패 대기 중' : 'Opponent waiting')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 w-full max-w-sm justify-center">
          {opponentHand.map((card, i) => (
            <div
              key={`opp-card-${card.id || i}`}
              className="flex-1 max-w-[64px] aspect-[5/7] rounded-xs relative transition-all overflow-hidden flex items-center justify-center ring-1 ring-rose-500/80 shadow-xs shadow-rose-900/40"
            >
              <CardItem
                card={card}
                isLocked={true}
                language={language}
                className="w-full h-full pointer-events-none rounded-xs"
              />
            </div>
          ))}

          {/* Placeholders for used opponent cards */}
          {Array.from({ length: Math.max(0, 5 - opponentHand.length) }).map((_, idx) => (
            <div
              key={`empty-opp-hand-${idx}`}
              className="flex-1 max-w-[64px] aspect-[5/7] rounded-xs border border-stone-800/40 bg-stone-950/40 opacity-30 flex items-center justify-center"
            >
              <span className="text-[8px] text-stone-600 font-bold">USED</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 3. 메인 전투 영역 (좌측 정보 + 카드판 + 우측 액션) ──────── */}
      <main className="w-full flex-1 flex items-center justify-between px-1 sm:px-2 gap-1 overflow-hidden">
        {/* ── 좌측: 현재스코어 및 턴 ── */}
        <aside 
          id="mobile-card-left-panel"
          className="w-14 sm:w-16 h-full flex flex-col justify-center items-center gap-2 py-1 shrink-0 z-10"
        >
          {/* 스코어 위젯 */}
          <div className="w-full bg-stone-950/90 border border-stone-800 rounded-xs p-1 flex flex-col items-center shadow-md">
            <span className="text-[8px] text-stone-400 font-bold tracking-wider">SCORE</span>
            <div className="flex items-baseline justify-center gap-1 my-0.5">
              <span className="text-base sm:text-lg font-black text-cyan-400 leading-none">
                {score.player}
              </span>
              <span className="text-[10px] text-stone-500 font-bold">:</span>
              <span className="text-base sm:text-lg font-black text-rose-400 leading-none">
                {score.opponent}
              </span>
            </div>
            <div className="flex items-center justify-between w-full text-[7px] text-stone-500 px-0.5">
              <span className="text-cyan-400/80">YOU</span>
              <span className="text-rose-400/80">OPP</span>
            </div>
          </div>

          {/* 턴 위젯 */}
          <div className={cn(
            "w-full rounded-xs p-1 flex flex-col items-center border transition-colors shadow-md",
            turn === 'player'
              ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-cyan-950/50"
              : "bg-rose-950/80 border-rose-500 text-rose-200 shadow-rose-950/50"
          )}>
            <span className="text-[8px] font-bold text-stone-400 uppercase">TURN</span>
            <span className="text-[10px] font-black tracking-tight mt-0.5 flex items-center gap-0.5">
              <span className={cn("w-1.5 h-1.5 rounded-full animate-ping", turn === 'player' ? "bg-cyan-400" : "bg-rose-400")} />
              <span>{turn === 'player' ? (language === 'ko' ? '내 턴' : 'YOU') : (language === 'ko' ? '상대' : 'AI')}</span>
            </span>
            <span className="text-[8px] font-mono text-stone-400 mt-0.5">
              T{turnCount}/9
            </span>
          </div>

          {/* 배속 전환 */}
          <button
            type="button"
            onClick={() => {
              playSound('tap');
              setBattleSpeed(prev => (prev === 1 ? 2 : 1));
            }}
            className="w-full py-1 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-700 rounded-xs text-[9px] font-black tracking-tight active:scale-95 cursor-pointer text-center"
          >
            {battleSpeed}x SPEED
          </button>
        </aside>

        {/* ── 중앙: 3x3 카드판 ── */}
        <div 
          id="mobile-card-center-board"
          className="flex-1 h-full flex items-center justify-center p-0.5"
        >
          <div className="w-[min(264px,64vw)] h-[min(264px,64vw)] max-w-[280px] max-h-[280px] aspect-square grid grid-cols-3 grid-rows-3 gap-1 bg-[#0b0e17] border-2 border-stone-800/80 p-1 rounded-sm shadow-xl">
            {board.map((cell, idx) => {
              const isOccupied = cell !== null;
              const isFlipped = flippedSlots.includes(idx);
              const isSelectedHand = selectedHandIndex !== null && playerHand[selectedHandIndex];
              const isShielded = boardShields[idx];

              return (
                <div
                  key={`board-slot-${idx}`}
                  id={`board-slot-${idx}`}
                  onClick={() => {
                    if (turn === 'player' && !isOccupied && isSelectedHand && rankingSearchCountdown === null && !showMissionDialogue) {
                      handlePlaceCard(idx, isSelectedHand, true);
                    }
                  }}
                  className={cn(
                    "relative w-full h-full rounded-xs flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden",
                    !isOccupied && isSelectedHand && turn === 'player' && "border-2 border-dashed border-cyan-400/80 bg-cyan-950/20 hover:bg-cyan-900/30 animate-pulse",
                    !isOccupied && (!isSelectedHand || turn !== 'player') && "border border-stone-800/80 bg-stone-950/50 hover:border-stone-700",
                    isOccupied && cell.owner === 'player' && "border-2 border-cyan-400 bg-cyan-950/90 shadow-sm shadow-cyan-500/20",
                    isOccupied && cell.owner === 'ai' && "border-2 border-rose-500 bg-rose-950/90 shadow-sm shadow-rose-500/20"
                  )}
                >
                  {isOccupied && cell ? (
                    <motion.div
                      animate={isFlipped ? { rotateY: [0, 180, 360], scale: [1, 1.08, 1] } : {}}
                      transition={{ duration: 0.35 }}
                      className="w-full h-full relative p-0.5 flex items-center justify-center"
                    >
                      <CardItem
                        card={cell}
                        isOnBoard={true}
                        isLocked={true}
                        language={language}
                        className={cn(
                          "w-full h-full rounded-xs shadow-md pointer-events-none",
                          cell.owner === 'player' ? "ring-1 ring-cyan-400" : "ring-1 ring-rose-500"
                        )}
                      />

                      {/* Shield Indicator */}
                      {isShielded && (
                        <div className="absolute top-0.5 right-0.5 z-30 bg-amber-400 text-stone-950 rounded-full p-0.5 shadow-md">
                          <Shield size={10} className="fill-current" />
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-stone-700 pointer-events-none">
                      <span className="text-[10px] font-bold">+</span>
                      <span className="text-[7px] text-stone-600">#{idx + 1}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 우측: 사용할 스킬 과 자동전투여부 ── */}
        <aside 
          id="mobile-card-right-panel"
          className="w-14 sm:w-16 h-full flex flex-col justify-center items-center gap-1.5 py-1 shrink-0 z-10"
        >
          {/* 스킬 1: 파워 부스트 (+2) */}
          <button
            type="button"
            onClick={handleUsePowerSkill}
            disabled={turn !== 'player' || skillCharges.power <= 0}
            className={cn(
              "w-full py-1.5 px-0.5 rounded-xs border flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95",
              activeSkill === 'power'
                ? "bg-amber-400 text-stone-950 border-amber-300 font-black shadow-md shadow-amber-400/40 animate-pulse"
                : skillCharges.power > 0 && turn === 'player'
                ? "bg-stone-900 hover:bg-stone-800 text-amber-300 border-amber-500/50"
                : "bg-stone-950/60 text-stone-600 border-stone-800/80 cursor-not-allowed"
            )}
          >
            <Zap size={13} />
            <span className="text-[8px] font-black leading-tight mt-0.5">
              {language === 'ko' ? '파워+2' : 'POW+2'}
            </span>
            <span className="text-[7px] text-stone-400 scale-90">[{skillCharges.power}]</span>
          </button>

          {/* 스킬 2: 방어 실드 */}
          <button
            type="button"
            onClick={handleUseShieldSkill}
            disabled={turn !== 'player' || skillCharges.shield <= 0}
            className={cn(
              "w-full py-1.5 px-0.5 rounded-xs border flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95",
              activeSkill === 'shield'
                ? "bg-cyan-400 text-stone-950 border-cyan-300 font-black shadow-md shadow-cyan-400/40 animate-pulse"
                : skillCharges.shield > 0 && turn === 'player'
                ? "bg-stone-900 hover:bg-stone-800 text-cyan-300 border-cyan-500/50"
                : "bg-stone-950/60 text-stone-600 border-stone-800/80 cursor-not-allowed"
            )}
          >
            <Shield size={13} />
            <span className="text-[8px] font-black leading-tight mt-0.5">
              {language === 'ko' ? '가드실드' : 'SHIELD'}
            </span>
            <span className="text-[7px] text-stone-400 scale-90">[{skillCharges.shield}]</span>
          </button>

          {/* 스킬 3: 원소 버스트 */}
          <button
            type="button"
            onClick={handleUseBurstSkill}
            disabled={turn !== 'player' || skillCharges.burst <= 0}
            className={cn(
              "w-full py-1.5 px-0.5 rounded-xs border flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95",
              skillCharges.burst > 0 && turn === 'player'
                ? "bg-stone-900 hover:bg-stone-800 text-rose-300 border-rose-500/50"
                : "bg-stone-950/60 text-stone-600 border-stone-800/80 cursor-not-allowed"
            )}
          >
            <Flame size={13} />
            <span className="text-[8px] font-black leading-tight mt-0.5">
              {language === 'ko' ? '원소+1' : 'BURST'}
            </span>
            <span className="text-[7px] text-stone-400 scale-90">[{skillCharges.burst}]</span>
          </button>

          {/* 자동전투 토글 버튼 */}
          <button
            type="button"
            onClick={toggleAuto}
            className={cn(
              "w-full py-1.5 px-0.5 rounded-xs border flex flex-col items-center justify-center transition-all cursor-pointer mt-0.5 active:scale-95",
              isAutoBattle
                ? "bg-emerald-500 text-stone-950 border-emerald-400 font-black shadow-md shadow-emerald-500/40 animate-pulse"
                : "bg-stone-900 hover:bg-stone-800 text-stone-400 border-stone-700 font-bold"
            )}
          >
            <Bot size={14} />
            <span className="text-[8px] font-black tracking-tight leading-tight mt-0.5">
              {isAutoBattle ? 'AUTO:ON' : 'AUTO:OFF'}
            </span>
          </button>
        </aside>
      </main>

      {/* ─── 4. 내 카드 덱 (My Card Deck: 5 cards, ~76px) ───────────── */}
      <footer 
        id="mobile-card-my-deck"
        className="w-full px-2 py-1.5 bg-[#090d16] border-t border-stone-800/80 flex flex-col items-center shrink-0"
      >
        <div className="w-full max-w-sm flex items-center justify-between mb-1 text-[9px] text-stone-400">
          <span className="font-bold text-cyan-400">
            {language === 'ko' ? '내 카드 덱' : 'MY DECK'} ({playerHand.length}/5)
          </span>
          <span className="text-[8px] text-stone-500">
            {selectedHandIndex !== null && playerHand[selectedHandIndex] 
              ? (language === 'ko' ? '▶ 보드의 빈 칸을 터치하세요' : '▶ Tap an empty board slot')
              : (language === 'ko' ? '카드를 탭하여 선택' : 'Tap a card to select')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 w-full max-w-sm justify-center">
          {playerHand.map((card, i) => {
            const isSelected = selectedHandIndex === i;
            return (
              <div
                key={card.id}
                onClick={() => {
                  playSound('tap');
                  setSelectedHandIndex(i);
                }}
                className={cn(
                  "flex-1 max-w-[64px] aspect-[5/7] rounded-xs relative transition-all cursor-pointer select-none",
                  isSelected
                    ? "-translate-y-2 ring-2 ring-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.7)] z-30 scale-105"
                    : "hover:-translate-y-0.5 opacity-95 hover:opacity-100 ring-1 ring-white/10"
                )}
              >
                <CardItem
                  card={card}
                  isLocked={turn !== 'player'}
                  isSelected={isSelected}
                  language={language}
                  className="w-full h-full pointer-events-none rounded-xs"
                />

                {/* Selected Tag */}
                {isSelected && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-stone-950 font-black text-[7px] px-1.5 py-0.2 rounded-full shadow-sm whitespace-nowrap z-40 animate-bounce">
                    PICK
                  </div>
                )}
              </div>
            );
          })}

          {/* Placeholders for used hand cards */}
          {Array.from({ length: Math.max(0, 5 - playerHand.length) }).map((_, idx) => (
            <div
              key={`empty-hand-${idx}`}
              className="flex-1 max-w-[64px] aspect-[5/7] rounded-xs border border-stone-800/40 bg-stone-950/40 opacity-30 flex items-center justify-center"
            >
              <span className="text-[8px] text-stone-600 font-bold">USED</span>
            </div>
          ))}
        </div>
      </footer>

      {/* ─── Game Over Result Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-xs flex items-center justify-center p-3"
          >
            <motion.div
              initial={{ scale: 0.85, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 15 }}
              className={cn(
                "w-full max-w-sm rounded-sm border p-4 sm:p-5 flex flex-col items-center text-center shadow-2xl font-mono",
                winner === 'player'
                  ? "bg-[#091512] border-2 border-emerald-400 shadow-emerald-500/40"
                  : winner === 'ai'
                  ? "bg-[#1f0f13] border-2 border-rose-500 shadow-rose-950/60"
                  : "bg-stone-900 border-2 border-amber-500 shadow-amber-950/60"
              )}
            >
              {/* Winner Icon & Header */}
              <div className="mb-2">
                {winner === 'player' ? (
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 mx-auto animate-bounce shadow-lg shadow-emerald-500/30">
                    <Trophy size={28} className="text-amber-400" />
                  </div>
                ) : winner === 'ai' ? (
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-rose-300 mx-auto">
                    <Award size={24} />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 mx-auto">
                    <RotateCcw size={24} />
                  </div>
                )}
              </div>

              <h2 className={cn(
                "text-xl font-black tracking-wider uppercase",
                winner === 'player' ? "text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" : winner === 'ai' ? "text-rose-400" : "text-amber-300"
              )}>
                {winner === 'player' 
                  ? (tieBreakerInfo 
                      ? (language === 'ko' ? '🎉 VICTORY! (덱 TP 판정 승리)' : '🎉 VICTORY! (Deck TP Win)')
                      : (language === 'ko' ? '🎉 VICTORY! 배틀 승리' : '🎉 VICTORY!'))
                  : winner === 'ai' 
                  ? (tieBreakerInfo
                      ? (language === 'ko' ? '💀 DEFEAT (덱 TP 판정 패배)' : '💀 DEFEAT (Deck TP Loss)')
                      : (language === 'ko' ? '💀 DEFEAT 패배' : 'DEFEAT'))
                  : (language === 'ko' ? '🤝 DRAW 무승부' : 'DRAW')}
              </h2>

              {/* Final Score */}
              <div className="my-2 py-1 px-4 bg-black/70 border border-white/10 rounded-xs flex items-baseline gap-2">
                <span className="text-2xl font-black text-cyan-400">{score.player}</span>
                <span className="text-stone-500 font-bold">:</span>
                <span className="text-2xl font-black text-rose-400">{score.opponent}</span>
              </div>

              {/* 무승부 시 서로의 덱 TP 비교 시각화 카드 */}
              {tieBreakerInfo && (
                <div className="w-full my-2 p-2.5 bg-stone-900/90 border border-amber-400/60 rounded-xs flex flex-col gap-1.5 font-mono shadow-md text-left">
                  <div className="flex items-center justify-between text-[11px] font-black text-amber-300 border-b border-amber-400/30 pb-1">
                    <span className="flex items-center gap-1">
                      <span>⚖️</span>
                      <span>{language === 'ko' ? '무승부 동점 덱 TP 판정' : 'Tie-Breaker: Deck TP Comparison'}</span>
                    </span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-2xs text-[10px] font-black",
                      tieBreakerInfo.winner === 'player' ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-rose-500/20 text-rose-300 border border-rose-400/40"
                    )}>
                      {tieBreakerInfo.winner === 'player'
                        ? (language === 'ko' ? '🏆 플레이어 TP 우세 승리' : '🏆 Player TP Win')
                        : (language === 'ko' ? '💀 상대 TP 우세 패배' : '💀 Rival TP Win')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs px-2 pt-1">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-stone-400">{language === 'ko' ? '내 덱 TP' : 'My Deck TP'}</span>
                      <span className="text-sm font-black text-cyan-400 font-mono">{tieBreakerInfo.playerTp.toLocaleString()}</span>
                    </div>
                    <div className="text-amber-400 font-black text-xs px-2">VS</div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-stone-400">{language === 'ko' ? '상대 덱 TP' : 'Rival Deck TP'}</span>
                      <span className="text-sm font-black text-rose-400 font-mono">{tieBreakerInfo.opponentTp.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-stone-300 text-center pt-1 border-t border-white/5">
                    {tieBreakerInfo.winner === 'player'
                      ? (language === 'ko' ? '✨ 내 덱 TP가 더 높아 승리로 판정되어 승률이 반영되었습니다!' : '✨ Win awarded due to higher Deck TP!')
                      : (language === 'ko' ? '상대 덱 TP가 더 높아 아쉽게 패배로 판정되었습니다.' : 'Loss awarded due to lower Deck TP.')}
                  </div>
                </div>
              )}

              {/* Rewards Description & Prominent SNS Notification */}
              <div className="w-full bg-black/60 border border-white/10 rounded-xs p-3 my-2 text-stone-200 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs border-b border-white/10 pb-1.5">
                  <span className="font-bold flex items-center gap-1">
                    <span>💰</span>
                    <span>{language === 'ko' ? '획득 SNS 보상' : 'Earned SNS'}</span>:
                  </span>
                  <span className="font-black text-amber-300 text-base font-mono flex items-center gap-1 animate-pulse">
                    +{winner === 'player' ? 30 : (winner === 'ai' ? 10 : 15)} SNS
                  </span>
                </div>

                {/* 랭킹대전 전용 승리 혜택 및 스마트 루프 안내 */}
                {isRankingMatch && (
                  <div className="flex flex-col gap-1.5 pt-0.5 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-400">{language === 'ko' ? '현재 보유 SNS 잔액:' : 'Current Balance:'}</span>
                      <span className="font-black text-amber-300 font-mono text-sm">🪙 {sns} SNS</span>
                    </div>

                    {winner === 'player' && smartLifeCycleActive && (sns || 0) >= 100 && (
                      <div className="p-2 bg-amber-500/20 border border-amber-400/60 rounded-xs text-[11px] text-amber-200 font-bold text-center">
                        🛒 {language === 'ko' ? '카드 뽑기 여유 충족 (100 SNS 이상)!' : 'Pack Draw Ready (100+ SNS)!'}
                        <div className="text-[10px] text-amber-300/80 mt-0.5">
                          {language === 'ko' ? '상점으로 이동하여 새 카드를 소환할 수 있습니다.' : 'You can visit Shop to summon cards.'}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {effectiveTargetCardId && winner === 'player' && (
                  <div className="flex justify-between items-center text-emerald-400 font-bold border-t border-white/10 pt-1 text-xs">
                    <span>{language === 'ko' ? '미션 카드 달성' : 'Mission Card'}:</span>
                    <span>No.{effectiveTargetCardId} {effectiveOpponentName}</span>
                  </div>
                )}
              </div>

              {/* Target Card Visual Reward Preview */}
              {effectiveTargetCardId && winner === 'player' && CARD_DATABASE[effectiveTargetCardId] && (
                <div className="flex flex-col items-center my-1 p-1.5 bg-black/60 rounded-xs border border-emerald-500/40 w-full">
                  <div className="w-[68px] aspect-[5/7] my-1 shadow-lg shadow-emerald-500/30">
                    <CardItem
                      card={CARD_DATABASE[effectiveTargetCardId]}
                      isLocked={true}
                      language={language}
                      className="w-full h-full pointer-events-none rounded-xs"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-300">
                    {effectiveOpponentName}
                  </span>
                </div>
              )}

              {/* 1) 랭킹대전 스마트 루프 카운트다운 바 (무조건 3초) */}
              {isRankingMatch && rankingAutoLoopCountdown !== null && rankingAutoLoopCountdown > 0 && (
                <div className="w-full my-1.5 p-2 bg-stone-900/90 border border-amber-500/40 rounded-xs flex flex-col items-center justify-center gap-1.5 font-mono shadow-md">
                  <div className="flex items-center gap-2 text-xs font-black tracking-wider text-amber-300">
                    <RotateCcw size={14} className="animate-spin text-amber-400 shrink-0" />
                    <span>
                      {language === 'ko'
                        ? `⚔️ [ ${rankingAutoLoopCountdown}초 ] 후 랭킹플레이 재시작...`
                        : `⚔️ Restarting Rank Play in [ ${rankingAutoLoopCountdown}s ]...`}
                    </span>
                  </div>
                  <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden border border-amber-500/30">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full transition-all duration-1000 ease-linear"
                      style={{ width: `${(rankingAutoLoopCountdown / 3) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 2) 일반/미션 모드: 3초 카운터 후에 다시 카드 플레이 */}
              {!(isTutorialMode || (tutorialStep > 0 && tutorialStep <= 7)) && !isRankingMatch && rematchCountdown !== null && rematchCountdown > 0 && (
                <div className="w-full my-1.5 p-2 bg-emerald-950/80 border border-emerald-500/40 rounded-xs flex flex-col items-center justify-center gap-1.5 font-mono shadow-md">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-400 tracking-wider">
                    <RotateCcw size={14} className="animate-spin text-emerald-400 shrink-0" />
                    <span>
                      {language === 'ko'
                        ? `⏱️ [ ${rematchCountdown}초 ] 후 다시 카드 플레이...`
                        : `⏱️ Restarting in [ ${rematchCountdown}s ]...`}
                    </span>
                  </div>
                  <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden border border-emerald-500/30">
                    <div 
                      className="bg-emerald-400 h-full transition-all duration-1000 ease-linear"
                      style={{ width: `${(rematchCountdown / 3) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full mt-2">
                {isRankingMatch ? (
                  <>
                    <button
                      type="button"
                      onClick={handleImmediateNextRankBattle}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs uppercase rounded-xs transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30"
                    >
                      <span>⚔️</span>
                      <span>{language === 'ko' ? '지금 바로 랭킹플레이 재시작' : 'Restart Rank Play Now'}</span>
                    </button>
                    {smartLifeCycleActive && (sns || 0) >= 100 && (
                      <button
                        type="button"
                        onClick={handleImmediateShopGo}
                        className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-xs uppercase rounded-xs transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                      >
                        <span>🛒</span>
                        <span>{language === 'ko' ? '상점에서 카드 뽑기' : 'Go to Shop'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleExitGame}
                      className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase rounded-xs border border-stone-600 transition-transform active:scale-95 cursor-pointer"
                    >
                      {language === 'ko' ? '나가기' : 'Exit'}
                    </button>
                  </>
                ) : (isTutorialMode || (tutorialStep > 0 && tutorialStep <= 7)) ? (
                  <button
                    type="button"
                    onClick={() => {
                      playSound('tap');
                      setTutorialShopCountdown(null);
                      if (onTutorialToShop) {
                        onTutorialToShop();
                      } else {
                        handleExitGame();
                      }
                    }}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase rounded-xs transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-amber-500/20"
                  >
                    <span>🛒</span>
                    <span>{language === 'ko' ? '상점으로 이동' : 'Go to Shop'}</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        playSound('tap');
                        setRematchCountdown(null);
                        if (effectiveTargetCardId) {
                          setShowMissionDialogue(true);
                          initMatchDecks();
                        } else {
                          initMatchDecks();
                        }
                      }}
                      className="flex-1 py-2 font-black text-xs uppercase rounded-xs transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-stone-950"
                    >
                      <RefreshCw size={13} />
                      <span>{language === 'ko' ? '재대결' : 'Rematch'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExitGame}
                      className="flex-1 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs uppercase rounded-xs border border-stone-600 transition-transform active:scale-95 cursor-pointer"
                    >
                      {language === 'ko' ? '나가기' : 'Exit'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Tower of Trials Boss Clear Dopamine Modal ─────────────── */}
      <AnimatePresence>
        {towerBossClearModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="w-full max-w-sm bg-stone-900 border-2 border-amber-400/80 rounded-sm p-5 shadow-[0_0_50px_rgba(245,158,11,0.3)] text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-bounce">
                <Trophy size={32} className="text-amber-400" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/90 bg-amber-500/10 px-2.5 py-0.5 border border-amber-400/30 rounded-xs">
                  {language === 'ko' ? `🗼 시련의 탑 ${towerBossClearModal.floor}층 클리어!` : `🗼 Tower of Trials Floor ${towerBossClearModal.floor} Cleared!`}
                </span>
                <h3 className="text-lg font-black text-white mt-1 uppercase tracking-tight">
                  {language === 'ko' ? '👑 보스 격파 대승리!' : '👑 Boss Defeated!'}
                </h3>
              </div>

              <div className="bg-stone-950/80 border border-stone-800 rounded-xs p-3.5 space-y-2 text-left text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400 flex items-center gap-1.5">
                    <span>🪙</span>
                    <span>SNS {language === 'ko' ? '보상' : 'Reward'}</span>
                  </span>
                  <span className="font-black text-amber-400">+{towerBossClearModal.snsReward} SNS</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-400 flex items-center gap-1.5">
                    <span>💎</span>
                    <span>{language === 'ko' ? '다이아몬드' : 'Diamonds'}</span>
                  </span>
                  <span className="font-black text-cyan-400">+{towerBossClearModal.diamonds} Gems</span>
                </div>

                {towerBossClearModal.title && (
                  <div className="flex items-center justify-between pt-1 border-t border-stone-850">
                    <span className="text-stone-400 flex items-center gap-1.5">
                      <Award size={13} className="text-amber-400" />
                      <span>{language === 'ko' ? '획득 칭호' : 'Title'}</span>
                    </span>
                    <span className="font-bold text-amber-300 text-[11px] truncate max-w-[150px]">
                      [{towerBossClearModal.title}]
                    </span>
                  </div>
                )}

                {towerBossClearModal.costume && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-purple-400" />
                      <span>{language === 'ko' ? '획득 코스튬' : 'Costume'}</span>
                    </span>
                    <span className="font-bold text-purple-300 text-[11px] truncate max-w-[150px]">
                      ✨ {towerBossClearModal.costume}
                    </span>
                  </div>
                )}

                {towerBossClearModal.isWelcomeFirstBoss && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xs text-[10px] text-amber-300 font-bold text-center">
                    🎉 {language === 'ko' ? '첫 5층 보스 격파 기념 보너스 (+50 SNS, +20 Gems) 지급!' : 'First 5F Boss Victory Bonus (+50 SNS, +20 Gems) Granted!'}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  playSound('tap');
                  setTowerBossClearModal(null);
                  handleExitGame();
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase rounded-xs transition-transform active:scale-95 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {language === 'ko' ? '보상 수령 및 탑으로 이동' : 'Claim Rewards & Return'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 랭킹대전: 승패 결정 후 다시 3초 검색 오버레이 ────────── */}
      <AnimatePresence>
        {rankingSearchCountdown !== null && !gameOver && !isAutoBattle && activeRankOpponent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-4 font-mono select-none"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="w-full max-w-sm bg-[#0b1017] border-2 border-amber-500/90 p-5 rounded-none shadow-[0_0_50px_rgba(245,158,11,0.4)] flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Radar pulse effect */}
              <div className="relative w-20 h-20 my-2 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-amber-400/40 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-amber-400/60 animate-pulse" />
                <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl shadow-lg">
                  {activeRankOpponent.avatar || '⚔️'}
                </div>
              </div>

              <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider mb-1">
                {language === 'ko' ? '새로운 랭킹 대전 상대를 검색 중...' : 'SEARCHING FOR RANK RIVAL...'}
              </div>

              <h3 className="text-base font-black text-white">
                {activeRankOpponent.name}
              </h3>

              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-400/60 text-amber-300 font-bold rounded-xs">
                  {activeRankOpponent.tier}
                </span>
                <span className="px-2 py-0.5 bg-stone-900 border border-stone-700 text-stone-300 font-bold rounded-xs">
                  전투력 {activeRankOpponent.totalPower}
                </span>
              </div>

              {/* Big 3s Countdown */}
              <div className="text-5xl font-black text-amber-400 my-4 tracking-tighter drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-pulse">
                {rankingSearchCountdown}s
              </div>

              <div className="w-full h-1.5 bg-stone-800 rounded-none overflow-hidden border border-amber-500/30">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((3 - rankingSearchCountdown) / 3) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <p className="text-[11px] text-stone-400 mt-3">
                {language === 'ko' ? '3초 후 새로운 상대와 즉시 배틀이 시작됩니다.' : 'Battle begins in 3 seconds with new rival.'}
              </p>

              <button
                type="button"
                onClick={handleExitGame}
                className="mt-4 w-full py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 rounded-none font-bold text-xs uppercase cursor-pointer active:scale-95 transition-all"
              >
                {language === 'ko' ? '매칭 취소 및 나가기' : 'Cancel & Exit'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 스마트 자동 라이프사이클: 웹툰/동영상 기분전환 힐링 모달 ── */}
      <AnimatePresence>
        {showRefreshBreakModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[230] bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-4 font-mono select-none"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="w-full max-w-sm bg-[#0b1017] border-2 border-emerald-500/80 p-5 rounded-none shadow-[0_0_40px_rgba(16,185,129,0.3)] flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* 상단 뱃지 & 아이콘 */}
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xs">
                  {refreshBreakType === 'webtoon' ? <BookOpen size={16} /> : <Film size={16} />}
                </span>
                <span className="text-xs font-black text-emerald-400 tracking-wider uppercase">
                  {refreshBreakType === 'webtoon' ? '[☕ 웹툰 기분전환 라운지]' : '[🎬 시네마 힐링 라운지]'}
                </span>
              </div>

              <h3 className="text-sm font-black text-white truncate max-w-full">
                {language === 'ko' ? refreshEpisodeData.titleKo : refreshEpisodeData.titleEn}
              </h3>

              {/* 미디어 뷰 영역 */}
              {refreshBreakType === 'webtoon' ? (
                <div className="relative w-full h-44 bg-stone-900 border border-stone-800 rounded-none overflow-hidden my-3 flex items-center justify-center">
                  {refreshEpisodeData.imageUrl ? (
                    <img
                      src={refreshEpisodeData.imageUrl}
                      alt="Webtoon Panel"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-stone-500">
                      <BookOpen size={32} />
                      <span className="text-xs mt-2">{language === 'ko' ? '웹툰 컷 로딩 중...' : 'Loading panel...'}</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/85 p-2 text-[10px] text-emerald-200 text-left line-clamp-2 border-t border-emerald-500/20">
                    💬 {language === 'ko' ? refreshEpisodeData.captionKo : refreshEpisodeData.captionEn}
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-44 bg-stone-900 border border-stone-800 rounded-none overflow-hidden my-3">
                  {refreshEpisodeData.videoId ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${refreshEpisodeData.videoId}?autoplay=1&mute=1&controls=0&playsinline=1`}
                      title="Episode Video"
                      className="w-full h-full border-0 pointer-events-none"
                      allow="autoplay; encrypted-media"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-500">
                      <Film size={32} />
                      <span className="text-xs mt-2">{language === 'ko' ? '영상 로딩 중...' : 'Loading video...'}</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/85 p-2 text-[10px] text-emerald-200 text-left line-clamp-1 border-t border-emerald-500/20">
                    🎬 {language === 'ko' ? refreshEpisodeData.captionKo : refreshEpisodeData.captionEn}
                  </div>
                </div>
              )}

              {/* 보너스 및 카운트다운 */}
              <div className="w-full bg-stone-900/80 border border-stone-800 p-2.5 rounded-none flex items-center justify-between text-xs">
                <span className="text-stone-300 flex items-center gap-1.5">
                  <Coffee size={14} className="text-amber-400" />
                  <span>{language === 'ko' ? '기분전환 보너스' : 'Refresh Bonus'}</span>
                </span>
                <span className="font-bold text-amber-400 text-xs">
                  +10 SNS 지급 완료
                </span>
              </div>

              {/* 카운트다운 바 */}
              <div className="w-full mt-3">
                <div className="w-full bg-stone-800 h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500"
                    initial={{ width: '100%' }}
                    animate={{ width: `${((refreshBreakCountdown ?? 4) / 4) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-2">
                  {language === 'ko'
                    ? `${refreshBreakCountdown ?? 0}초 후 랭킹대전 자동 복귀`
                    : `Returning to battle in ${refreshBreakCountdown ?? 0}s`}
                </p>
              </div>

              {/* 즉시 복귀 버튼 */}
              <button
                type="button"
                onClick={() => {
                  playSound('tap');
                  setShowRefreshBreakModal(false);
                  setRefreshBreakCountdown(null);
                  if (updateSns) {
                    updateSns(10, 'mental_refresh_bonus', 'earned');
                  }
                  refreshDifficulty();
                  const nextOpp = pickNewRankOpponent(activeRankOpponent?.name || effectiveOpponentName, playerTotalPower, getDynamicDifficultyProfile(playerTotalPower));
                  setActiveRankOpponent(nextOpp);
                  setRankingSearchCountdown(3);
                }}
                className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-black text-xs uppercase cursor-pointer active:scale-95 transition-all rounded-xs shadow-md"
              >
                {language === 'ko' ? '⚡ 힐링 완료! 즉시 랭킹대전 복귀' : '⚡ Return to Battle Now'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 미션 게임 3초 대사 인트로 모달 ────────────────────────── */}
      {effectiveTargetCardId && (
        <MissionDialogueIntro
          isOpen={showMissionDialogue}
          cardId={effectiveTargetCardId}
          language={language}
          onComplete={() => setShowMissionDialogue(false)}
          onSkip={() => setShowMissionDialogue(false)}
        />
      )}

      {/* ─── 카드 뒤집기 무지개 파티클 이펙트 오버레이 ───────────────── */}
      <RainbowFlipEffect isFixed={true} className="z-[999999]" />
    </div>
  );
};

export default MobileCardPlayScreen;
