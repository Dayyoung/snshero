import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'motion/react';
import { 
  ArrowLeft, Zap, Shield, Flame, RotateCcw, Volume2, VolumeX, 
  Sparkles, Check, Trophy, Award, Bot, RefreshCw, Star,
  Coffee, BookOpen, Film, Play, ShoppingBag, ArrowUpRight,
  Waves, Wind, Mountain, User, Skull, Leaf, Hammer, Ghost,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { CardData, UserStats, Skill, Item, CardRarity, Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { 
  INITIAL_CARDS, 
  generateUniqueDeck, 
  ensureUniqueDeck, 
  syncCardWithDatabase, 
  generateAiName, 
  getCardPower,
  generateCard,
  getNormalizedElement,
  getCardStatWithBonus
} from '../constants';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { AdSenseBanner } from '../components/AdSenseBanner';
import { CardItem } from '../components/CardItem';
import { t } from '../lib/i18n';
import { MissionDialogueIntro } from '../components/MissionDialogueIntro';
import { pickNewRankOpponent, RankOpponentInfo } from '../data/rankingOpponents';
import { getDynamicDifficultyProfile, DynamicDifficultyProfile } from '../lib/dynamicDifficulty';
import { isRankingDiverted, getDivertedMode, getDivertedLossCount, isDivertVerified } from '../lib/rankingDivertService';
import { isDemoPlayActive, setDemoPlayStep } from '../lib/demoPlayService';

export interface ElementDef {
  nameKo: string;
  nameEn: string;
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}

export const ELEMENT_DEFINITIONS: Record<string, ElementDef> = {
  water: { nameKo: '물', nameEn: 'WATER', Icon: Waves },
  fire: { nameKo: '불', nameEn: 'FIRE', Icon: Flame },
  wind: { nameKo: '바람', nameEn: 'WIND', Icon: Wind },
  land: { nameKo: '대지', nameEn: 'EARTH', Icon: Mountain },
  earth: { nameKo: '대지', nameEn: 'EARTH', Icon: Mountain },
  human: { nameKo: '인간', nameEn: 'HUMAN', Icon: User },
  undead: { nameKo: '언데드', nameEn: 'UNDEAD', Icon: Skull },
  elf: { nameKo: '엘프', nameEn: 'ELF', Icon: Leaf },
  dwarf: { nameKo: '드워프', nameEn: 'DWARF', Icon: Hammer },
  monster: { nameKo: '몬스터', nameEn: 'MONSTER', Icon: Ghost },
  robot: { nameKo: '로봇', nameEn: 'ROBOT', Icon: Bot },
  dragon: { nameKo: '드래곤', nameEn: 'DRAGON', Icon: Zap },
};

export const ELEMENT_META = ELEMENT_DEFINITIONS;
import { WEBTOON_SEASONS } from '../content/webtoonEpisodes';
import { MOVIE_EPISODES } from '../content/movieEpisodeMapping';
import { createBattleWebMcpTools, useWebMcpTools } from '../lib/webMcp/index';
import { RewardedAdModal } from '../components/RewardedAdModal';
import { checkIsAdRemoved } from '../lib/rewardedAdService';
import { useGameSettings } from '../contexts/GameSettingsContext';

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
  language: requestedLanguage = 'ko',
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
  const language = requestedLanguage as Language;
  const { lowSpecMode } = useGameSettings();
  const reducedMotion = useReducedMotion();
  const suppressMotion = lowSpecMode || Boolean(reducedMotion);

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
  const [elementalBoard, setElementalBoard] = useState<(string | null)[]>(() => {
    const elements: (string | null)[] = Array(9).fill(null);
    const possibleElements = ['water', 'fire', 'wind', 'land', 'human', 'undead', 'elf', 'monster', 'dragon'];
    for (let i = 0; i < 9; i++) {
      if (Math.random() < 0.45) {
        elements[i] = possibleElements[Math.floor(Math.random() * possibleElements.length)];
      }
    }
    return elements;
  });
  const [boardShields, setBoardShields] = useState<boolean[]>(() => Array(9).fill(false));
  const [playerHand, setPlayerHand] = useState<CardData[]>([]);
  const [opponentHand, setOpponentHand] = useState<CardData[]>([]);
  // 상대 카드덱 접기/펼치기 상태 (기본은 접은 상태: false)
  const [isOpponentDeckExpanded, setIsOpponentDeckExpanded] = useState<boolean>(false);
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

  // Auto Battle & Speed (시작 시 자동전투 시작 및 로컬스토리지 광고 차단 동기화)
  const [isAutoBattle, setIsAutoBattle] = useState(() => {
    if (typeof initialAutoBattle === 'boolean') return initialAutoBattle;
    try {
      const stored = localStorage.getItem('hero_auto_battle');
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });
  const [battleSpeed, setBattleSpeed] = useState<1 | 2>(1);

  useEffect(() => {
    try {
      localStorage.setItem('hero_auto_battle', JSON.stringify(isAutoBattle));
    } catch {}
  }, [isAutoBattle]);

  // WebMCP (Chrome 149+ AI Model Context Protocol) Card Battle Tools Registration
  const battleMcpTools = useMemo(() => {
    return createBattleWebMcpTools({
      onPlayCard: (slotIndex) => {
        if (playerHand && playerHand[slotIndex]) {
          setSelectedHandIndex(slotIndex);
        }
      },
      onEndTurn: () => {
        setTurn('ai');
      },
      getBattleState: () => ({
        turn,
        turnCount,
        gameOver,
        winner,
        playerHandCount: playerHand.length,
        opponentHandCount: opponentHand.length,
        isAutoBattle
      })
    });
  }, [playerHand, opponentHand, turn, turnCount, gameOver, winner, isAutoBattle]);
  useWebMcpTools(battleMcpTools, [battleMcpTools]);

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

  // 3대 핵심 보상 루프 1: 승리 보상 2배 (x2) 상태
  const [isDoubleRewardClaimed, setIsDoubleRewardClaimed] = useState<boolean>(false);
  const [isRewardedModalOpen, setIsRewardedModalOpen] = useState<boolean>(false);
  const isVipUser = checkIsAdRemoved();

  const handleDoubleRewardGranted = () => {
    setIsDoubleRewardClaimed(true);
    const bonusSns = winner === 'player' ? 30 : 15;
    if (updateSns) {
      updateSns(bonusSns, 'battle_victory_2x_rewarded', 'earned');
    } else {
      try {
        const cur = parseInt(localStorage.getItem('hero_sns') || '0', 10);
        localStorage.setItem('hero_sns', String(cur + bonusSns));
        window.dispatchEvent(new Event('hero_sns_updated'));
      } catch {}
    }
    playSound('fanfare');
  };

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
    // 3x3 보드 속성 타일 랜덤 생성 (시너지 전략 플레이)
    const newElements: (string | null)[] = Array(9).fill(null);
    const possibleElements = ['water', 'fire', 'wind', 'land', 'human', 'undead', 'elf', 'monster', 'dragon'];
    for (let i = 0; i < 9; i++) {
      if (Math.random() < 0.45) {
        newElements[i] = possibleElements[Math.floor(Math.random() * possibleElements.length)];
      }
    }
    setElementalBoard(newElements);
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
    // 자동플레이 모드 시 광고/외부 미디어 팝업 완전 차단 (민망함 방지)
    if (isAutoBattle) return;

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
  }, [language, isAutoBattle]);

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
  const executeFlips = useCallback((placedCard: CardData, slotIdx: number, currentBoard: (CardData | null)[], currentShields: boolean[], currentElements: (string | null)[] = elementalBoard) => {
    const row = Math.floor(slotIdx / 3);
    const col = slotIdx % 3;
    const flips: number[] = [];
    const newBoard = [...currentBoard];

    // [Top, Right, Bottom, Left] with tile synergy calculation
    const placedTile = currentElements?.[slotIdx] || null;
    const pStats = [
      getCardStatWithBonus(placedCard, 0, placedTile),
      getCardStatWithBonus(placedCard, 1, placedTile),
      getCardStatWithBonus(placedCard, 2, placedTile),
      getCardStatWithBonus(placedCard, 3, placedTile),
    ];

    // 1. Check Top (row > 0, neighbor is slotIdx - 3)
    if (row > 0) {
      const topIdx = slotIdx - 3;
      const target = newBoard[topIdx];
      if (target && target.owner !== placedCard.owner && !currentShields[topIdx]) {
        const myStat = pStats[0]; // My Top
        const targetTile = currentElements?.[topIdx] || null;
        const targetStat = getCardStatWithBonus(target, 2, targetTile); // Target's Bottom
        if (myStat > targetStat) flips.push(topIdx);
      }
    }

    // 2. Check Right (col < 2, neighbor is slotIdx + 1)
    if (col < 2) {
      const rightIdx = slotIdx + 1;
      const target = newBoard[rightIdx];
      if (target && target.owner !== placedCard.owner && !currentShields[rightIdx]) {
        const myStat = pStats[1]; // My Right
        const targetTile = currentElements?.[rightIdx] || null;
        const targetStat = getCardStatWithBonus(target, 3, targetTile); // Target's Left
        if (myStat > targetStat) flips.push(rightIdx);
      }
    }

    // 3. Check Bottom (row < 2, neighbor is slotIdx + 3)
    if (row < 2) {
      const bottomIdx = slotIdx + 3;
      const target = newBoard[bottomIdx];
      if (target && target.owner !== placedCard.owner && !currentShields[bottomIdx]) {
        const myStat = pStats[2]; // My Bottom
        const targetTile = currentElements?.[bottomIdx] || null;
        const targetStat = getCardStatWithBonus(target, 0, targetTile); // Target's Top
        if (myStat > targetStat) flips.push(bottomIdx);
      }
    }

    // 4. Check Left (col > 0, neighbor is slotIdx - 1)
    if (col > 0) {
      const leftIdx = slotIdx - 1;
      const target = newBoard[leftIdx];
      if (target && target.owner !== placedCard.owner && !currentShields[leftIdx]) {
        const myStat = pStats[3]; // My Left
        const targetTile = currentElements?.[leftIdx] || null;
        const targetStat = getCardStatWithBonus(target, 1, targetTile); // Target's Right
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
  }, [elementalBoard]);

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

    // Evaluate flips with elementalBoard synergy
    const { updatedBoard, flippedIndices } = executeFlips(cardToPlace, slotIdx, tempBoard, nextShields, elementalBoard);

    if (flippedIndices.length > 0) {
      setFlippedSlots(flippedIndices);
      playSound('flip');
      setTimeout(() => setFlippedSlots([]), 800);
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

      const curSns = (() => {
        try {
          const raw = parseInt(localStorage.getItem('hero_user_sns') || '0', 10);
          return Math.max(raw, sns || 0);
        } catch {
          return sns || 0;
        }
      })();

      // [1] 데모플레이 모드 승리 시 또는 스마트 루프 승리/보유 SNS 10 이상인 경우 상점에서 카드 뽑기 진행!
      const isDemo = isDemoPlayActive();
      const shouldDrawPack = (isDemo && winner === 'player') || (smartLifeCycleActive && (winner === 'player' || curSns >= 10));
      if (shouldDrawPack) {
        if (isDemo) {
          setDemoPlayStep('shop');
        }
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

      // [2] 매 3번째 경기 완료 시 웹툰/동영상 시청 기분전환 (자동플레이 모드에서는 100% 완전 차단)
      if (!isAutoBattle && smartLifeCycleActive && nextCount > 0 && nextCount % 3 === 0) {
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
    setIsDoubleRewardClaimed(false);
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
    <MotionConfig reducedMotion={suppressMotion ? 'always' : 'never'} transition={suppressMotion ? { duration: 0 } : undefined}>
    <div 
      id="mobile-card-play-viewport"
      className={cn(
        "fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-pan-y bg-[#fdfcfc] text-[#201d1d] flex flex-col font-mono z-[100] [&_button]:min-h-11 [&_button]:min-w-11 [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-[#201d1d]",
        suppressMotion && "[&_*]:animate-none [&_*]:transition-none"
      )}
    >
      {/* Header actions retain 44px touch targets plus the top safe area - z-[9999] 최상위 우선순위 부여 */}
      <header className="sticky top-0 w-full pt-[env(safe-area-inset-top,0px)] px-2 border-b border-[#0f0000]/12 flex items-center gap-2 shrink-0 z-[9999] bg-[#fdfcfc] shadow-2xs">
        <button
          type="button"
          onClick={handleExitGame}
          className="h-11 px-3 rounded-sm flex items-center justify-center gap-1.5 border border-[#0f0000]/20 bg-[#fdfcfc] hover:bg-[#f1eeee] active:scale-95 shrink-0 z-[10000] cursor-pointer text-[#201d1d] font-bold select-none touch-manipulation shadow-2xs"
          aria-label={t('exit_battle', language)}
          title={t('exit_battle', language)}
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
          <span className="text-[11px] font-black tracking-tight">{language === 'ko' ? '종료' : 'EXIT'}</span>
        </button>

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <span className="text-[11px] font-bold truncate">
            {towerFloor
              ? `[${towerFloor}F] ${effectiveOpponentName}`
              : (effectiveTargetCardId ? `#${effectiveTargetCardId} ${effectiveOpponentName}` : effectiveOpponentName)}
          </span>
          {isRankingMatch && (
            <span className="text-[10px] text-[#646262] truncate">
              {language === 'ko' ? difficultyProfile.labelKo : difficultyProfile.labelEn}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMuted(prev => !prev)}
             className="w-11 h-11 hover:bg-[#f1eeee] rounded-sm flex items-center justify-center"
            aria-label={t(isMuted ? 'hud_audio_unmute' : 'hud_audio_mute', language)}
            aria-pressed={isMuted}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            type="button"
            onClick={() => {
              playSound('tap');
              initMatchDecks();
            }}
            className="w-11 h-11 hover:bg-[#f1eeee] rounded-sm flex items-center justify-center"
            aria-label={t('rematch', language)}
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      {/* ─── 랭킹 전환 모드 (/main 또는 /play 신규 덱 검증) HUD 바 ───────── */}
      {isRankingDiverted() && (
        <div 
          id="ranking-diverted-hud"
          className={cn(
            "w-full px-3 py-1 border-b flex items-center justify-between shrink-0 text-[11px] gap-2 z-20 font-mono",
            isDivertVerified()
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900"
              : "bg-amber-500/10 border-amber-500/30 text-amber-900"
          )}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold truncate">
              {isDivertVerified() ? '✅ ' : '🎴 '}
              {language === 'ko' 
                ? (isDivertVerified() 
                    ? `[신규 덱 검증 성공] ${getDivertedMode() === 'main' ? '/main (카단 RPG)' : '/play (미션 게임)'} 진행 중` 
                    : `[신규 덱 검증 중] ${getDivertedMode() === 'main' ? '/main' : '/play'}`)
                : (isDivertVerified()
                    ? `[Deck Verified] ${getDivertedMode() === 'main' ? '/main' : '/play'} in progress`
                    : `[New Deck Trial] ${getDivertedMode() === 'main' ? '/main' : '/play'}`)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 border",
              getDivertedLossCount() >= 2
                ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                : isDivertVerified()
                  ? "bg-emerald-500/20 text-emerald-800 border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-800 border-amber-500/40"
            )}>
              {language === 'ko' ? `연속 패배: ${getDivertedLossCount()}/3` : `Losses: ${getDivertedLossCount()}/3`}
            </span>
          </div>
        </div>
      )}

      {/* ─── 스마트 자동 라이프사이클 HUD 바 (Smart LifeCycle Bar) ───────── */}
      {isRankingMatch && (
        <div 
          id="smart-lifecycle-hud"
          className="w-full px-3 border-b border-[#0f0000]/12 flex items-center justify-between shrink-0 text-[11px] gap-2 z-20 [@media(max-height:500px)]:hidden"
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="shrink-0 flex items-center gap-1">
              <Bot size={14} />
              <span>{t('macro_loop_play', language)}</span>
            </span>
            <span className="text-[#646262] truncate">
              [{matchLoopCount % 4}/4]
            </span>
            <span className="font-bold shrink-0">
              {sns} SNS
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {lifeCycleNotice && (
              <span className="text-[#646262] text-[10px] max-w-[130px] truncate hidden sm:inline">
                {lifeCycleNotice.text}
              </span>
            )}
            <button
              type="button"
              aria-label={t('macro_loop_play', language)}
              aria-pressed={smartLifeCycleActive}
              onClick={() => {
                setSmartLifeCycleActive(prev => !prev);
                playSound('tap');
              }}
              className={cn(
                "px-2 rounded-sm text-[11px] font-bold border cursor-pointer",
                smartLifeCycleActive 
                  ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]"
                  : "border-[#0f0000]/12 text-[#646262]"
              )}
            >
              {smartLifeCycleActive ? '[+]' : '[-]'}
            </button>
          </div>
        </div>
      )}

      {/* ─── 1. 상단 광고 (Top Ad Banner: 자동플레이 모드 또는 광고 제거 시 100% 완전 제거) ────────────────── */}
      {!isAutoBattle && !isAdRemoved && (
        <div 
          id="mobile-card-top-ad"
          className="w-full h-11 max-h-11 border-b border-[#0f0000]/12 px-2 flex items-center justify-center relative overflow-hidden shrink-0 [@media(max-height:700px)]:hidden"
        >
          <AdSenseBanner isAdRemoved={isAdRemoved || isAutoBattle} isAutoBattle={isAutoBattle} format="horizontal" className="w-full h-full max-h-11" />
          {/* Ad Fallback / Sponsor Banner */}
          <div className="flex items-center justify-between w-full max-w-sm px-2 text-[10px] text-[#646262] tracking-tight pointer-events-none">
            <span className="flex items-center gap-1">
              <strong>SNSHERO REVOLUTION</strong>
            </span>
            <span className="text-[10px] border border-[#0f0000]/12 px-1.5">
              {t('opponent_deck', language)}
            </span>
          </div>
        </div>
      )}

      {/* ─── 상하 스크롤 배틀 컨테이너 (UI 축소 원천 차단 및 시원한 크기 보장) ─── */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden touch-pan-y overscroll-y-contain flex flex-col items-center gap-3 p-2.5 pb-[max(32px,env(safe-area-inset-bottom,0px))] [@media(max-height:500px)_and_(min-width:480px)]:grid [@media(max-height:500px)_and_(min-width:480px)]:grid-cols-[minmax(140px,1fr)_minmax(144px,1.4fr)_minmax(140px,1fr)] [@media(max-height:500px)_and_(min-width:480px)]:grid-rows-[48px_minmax(0,1fr)_48px] [@media(max-height:500px)_and_(min-width:480px)]:overflow-hidden">
      {/* ─── 2. 상대 덱 (Opponent Deck: 접기 가능 홀더 바 & 기본 접힌 상태) ─────────────── */}
      <div 
        id="mobile-card-opponent-deck"
        className="w-full max-w-[440px] shrink-0 flex flex-col border border-red-500/70 rounded-sm bg-red-50/20 shadow-xs overflow-hidden transition-all duration-200 [@media(max-height:500px)_and_(min-width:480px)]:col-start-1 [@media(max-height:500px)_and_(min-width:480px)]:row-start-2 [@media(max-height:500px)_and_(min-width:480px)]:overflow-y-auto"
      >
        {/* 접기/펼치기 홀더 바 (기본: 접은 상태) */}
        <button
          type="button"
          onClick={() => {
            playSound('tap');
            setIsOpponentDeckExpanded(prev => !prev);
          }}
          className="w-full min-h-[44px] px-2.5 py-1.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-red-100/40 active:bg-red-100/60 transition-colors select-none touch-manipulation"
          aria-expanded={isOpponentDeckExpanded}
          aria-controls="mobile-card-opponent-deck-content"
          title={isOpponentDeckExpanded ? (language === 'ko' ? '상대 카드덱 접기' : 'Collapse Opponent Deck') : (language === 'ko' ? '상대 카드덱 펼치기' : 'Expand Opponent Deck')}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-white bg-red-600 border border-red-700 px-2 py-0.5 rounded-xs flex items-center gap-1 shadow-2xs text-[11px] shrink-0">
              <span className="w-2 h-2 rounded-full bg-white inline-block animate-pulse" />
              {t('opponent_deck', language)} [{opponentHand.length}/5]
            </span>
            <span className="text-[11px] text-red-600 font-semibold truncate" role="status">
              {gameOver ? t('snake_game_over', language)
                : turn === 'ai' ? (language === 'ko' ? '🔴 상대 턴 진행 중...' : '🔴 Opponent Turn')
                : (language === 'ko' ? '상대 카드 대기' : 'Opponent Ready')}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 px-2 py-1 text-[11px] font-bold text-red-700 bg-white/90 border border-red-300 rounded-xs shadow-2xs">
            <span>{isOpponentDeckExpanded ? (language === 'ko' ? '접기' : 'Hide') : (language === 'ko' ? '펼치기' : 'Show')}</span>
            {isOpponentDeckExpanded ? <ChevronUp size={13} strokeWidth={2.5} /> : <ChevronDown size={13} strokeWidth={2.5} />}
          </div>
        </button>

        {/* 접기 홀더를 누르면 표시되는 상대 5장 카드 그리드 */}
        {isOpponentDeckExpanded && (
          <div 
            id="mobile-card-opponent-deck-content"
            className="p-2 pt-1.5 border-t border-red-200/80 grid grid-cols-5 gap-1.5 w-full [@media(max-height:500px)_and_(min-width:480px)]:grid-cols-2 [@media(max-height:500px)_and_(min-width:560px)]:grid-cols-3"
          >
            {opponentHand.map((card, i) => {
              const oppEl = getNormalizedElement(card);
              const oppDef = oppEl ? ELEMENT_DEFINITIONS[oppEl] : null;
              return (
                <div
                  key={`opp-card-${card.id || i}`}
                  className="aspect-[2.8/4] min-h-[96px] sm:min-h-[115px] max-h-[135px] rounded-sm relative overflow-hidden border-2 border-red-400/90 bg-red-50/10 shadow-2xs [@media(max-height:500px)_and_(min-width:480px)]:h-[clamp(44px,24dvh,80px)]"
                >
                  <CardItem
                    card={card}
                    isLocked={true}
                    language={language}
                    lowSpecMode={suppressMotion}
                    className="w-full h-full pointer-events-none rounded-none shadow-none"
                  />
                  {oppDef && (
                    <div 
                      className="absolute top-0.5 right-0.5 z-30 flex items-center gap-0.5 px-1 py-0.5 rounded-xs bg-[#fdfcfc]/95 text-[#201d1d] border border-[#201d1d]/30 font-mono text-[7.5px] font-bold leading-none shadow-2xs pointer-events-none select-none"
                      title={`${language === 'ko' ? oppDef.nameKo : oppDef.nameEn} ${language === 'ko' ? '속성' : 'Element'}`}
                    >
                      <oppDef.Icon size={8.5} strokeWidth={2} className="text-[#201d1d] shrink-0" />
                      <span className="hidden sm:inline tracking-tight">[{language === 'ko' ? oppDef.nameKo : oppDef.nameEn}]</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Placeholders for used opponent cards */}
            {Array.from({ length: Math.max(0, 5 - opponentHand.length) }).map((_, idx) => (
              <div
                key={`empty-opp-hand-${idx}`}
                className="aspect-[2.8/4] min-h-[96px] sm:min-h-[115px] max-h-[135px] border-2 border-dashed border-red-300 bg-red-50/10 rounded-sm flex items-center justify-center text-red-400 font-mono [@media(max-height:500px)_and_(min-width:480px)]:h-[clamp(44px,24dvh,80px)]"
              >
                <span className="text-[11px] font-bold">[-]</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── 3. 메인 전투 영역 (좌측 정보 + 카드판 + 우측 액션) ──────── */}
      <main className="w-full max-w-[440px] shrink-0 flex flex-col items-center gap-2.5 [@media(max-height:500px)_and_(min-width:480px)]:contents">
        {/* ── 상단/좌측: 현재스코어 및 턴 정보 위젯 ── */}
        <aside 
          id="mobile-card-left-panel"
          className="w-full shrink-0 grid grid-cols-[1fr_1fr_44px] items-center gap-2 [@media(max-height:500px)_and_(min-width:480px)]:col-start-1 [@media(max-height:500px)_and_(min-width:480px)]:row-start-1 [@media(max-height:500px)_and_(min-width:480px)]:grid-cols-[1fr_44px]"
        >
          {/* 스코어 위젯 */}
          <div className="flex flex-col min-w-0 border border-[#0f0000]/12 bg-[#fdfcfc] p-1 rounded-sm text-center [@media(max-height:500px)_and_(min-width:480px)]:hidden">
            <span className="text-[10px] text-[#646262] truncate">{t('my_score', language)} / {t('opp_score', language)}</span>
            <div className="flex items-baseline justify-center gap-1.5 my-0.5">
              <span className="text-2xl font-bold text-[#2563eb] leading-none tabular-nums">
                {score.player}
              </span>
              <span className="text-sm text-[#9a9898]">:</span>
              <span className="text-2xl font-bold text-[#dc2626] leading-none tabular-nums">
                {score.opponent}
              </span>
            </div>
          </div>

          {/* 턴 위젯 */}
          <div className={cn(
            "min-h-11 px-2.5 flex flex-col justify-center border text-[11px] rounded-sm",
            turn === 'player'
              ? "bg-[#201d1d] border-[#201d1d] text-[#fdfcfc]"
              : "border-[#0f0000]/12 text-[#646262]"
          )}>
            <span className="font-bold truncate" role="status">
              {t(gameOver ? 'snake_game_over' : turn === 'player' ? 'your_turn' : 'opponent_turn', language)}
            </span>
            <span className="text-[10px] tabular-nums flex items-center justify-between gap-1">
              [{turnCount}/9] <span aria-label={`${t('my_score', language)} ${score.player}, ${t('opp_score', language)} ${score.opponent}`} className="hidden font-bold text-base leading-none [@media(max-height:500px)_and_(min-width:480px)]:inline">{score.player}:{score.opponent}</span>
            </span>
          </div>

          {/* 배속 전환 */}
          <button
            type="button"
            onClick={() => {
              playSound('tap');
              setBattleSpeed(prev => (prev === 1 ? 2 : 1));
            }}
            className="h-11 border border-[#0f0000]/12 rounded-sm text-xs font-bold hover:bg-[#f1eeee] tabular-nums"
          >
            {battleSpeed}x
          </button>
        </aside>

        {/* ── 중앙: 3x3 카드판 (축소 없이 큼직하고 시원한 정방형 크기 보장) ── */}
        <div 
          id="mobile-card-center-board"
          className="w-full shrink-0 flex items-center justify-center my-0.5 [@media(max-height:500px)_and_(min-width:480px)]:col-start-2 [@media(max-height:500px)_and_(min-width:480px)]:row-start-1 [@media(max-height:500px)_and_(min-width:480px)]:row-span-2"
        >
          <div className="w-full aspect-square min-h-[300px] sm:min-h-[360px] grid grid-cols-3 grid-rows-3 gap-1.5 bg-[#f1eeee] border border-[#0f0000]/12 p-1.5 rounded-sm shadow-xs">
            {board.map((cell, idx) => {
              const isOccupied = cell !== null;
              const isFlipped = flippedSlots.includes(idx);
              const isSelectedHand = selectedHandIndex !== null && playerHand[selectedHandIndex];
              const isShielded = boardShields[idx];
              const isPlayable = !isOccupied && Boolean(isSelectedHand) && turn === 'player' && !gameOver && !isEvaluating && rankingSearchCountdown === null && !showMissionDialogue;
              const tileEl = elementalBoard[idx];
              const tileDef = tileEl ? ELEMENT_DEFINITIONS[tileEl] : null;
              const cardEl = isOccupied && cell ? getNormalizedElement(cell) : null;
              const cardDef = cardEl ? ELEMENT_DEFINITIONS[cardEl] : null;
              const isSynergy = Boolean(isOccupied && cell && tileEl && cardEl && cardEl === (tileEl === 'air' ? 'wind' : tileEl === 'earth' ? 'land' : tileEl));

              return (
                <button
                  type="button"
                  key={`board-slot-${idx}`}
                  id={`board-slot-${idx}`}
                  disabled={!isPlayable}
                  aria-label={`${t(isOccupied ? cell.owner === 'player' ? 'my_deck_title' : 'opponent_deck' : 'toast_select_empty_slot', language)} ${idx + 1}${isOccupied ? `: ${language === 'ko' ? cell.title : cell.title_en || cell.title}` : ''}${cardEl ? ` (${cardEl})` : ''}${isShielded ? `, ${t('ability_shield', language)}` : ''}`}
                  onClick={() => {
                    if (turn === 'player' && !isOccupied && isSelectedHand && rankingSearchCountdown === null && !showMissionDialogue) {
                      handlePlaceCard(idx, isSelectedHand, true);
                    }
                  }}
                  className={cn(
                    "relative w-full h-full min-w-0 rounded-sm flex flex-col items-center justify-center overflow-hidden transition-all select-none",
                    isPlayable && "border border-dashed border-[#201d1d] bg-[#fdfcfc] hover:bg-[#e5e1e1] cursor-pointer",
                    !isOccupied && !isPlayable && (tileDef ? "border border-[#201d1d]/25 bg-[#f8f7f7] text-[#201d1d]" : "border border-[#0f0000]/12 bg-[#f8f7f7] text-[#9a9898]"),
                    isOccupied && cell.owner === 'player' && "border-2 border-[#2563eb] bg-[#2563eb]",
                    isOccupied && cell.owner === 'ai' && "border-2 border-[#dc2626] bg-[#dc2626]",
                    isSynergy && "ring-2 ring-[#201d1d] shadow-[0_0_8px_rgba(32,29,29,0.35)]",
                    isFlipped && "outline outline-2 outline-offset-[-4px] outline-[#fdfcfc]"
                  )}
                >
                  {isOccupied && cell ? (
                    <motion.div
                      initial={suppressMotion ? false : { opacity: 0, scale: 0.94 }}
                      animate={isFlipped && !suppressMotion ? { opacity: 1, scale: [1, 0.94, 1], x: [0, cell.owner === 'player' ? -3 : 3, 0] } : { opacity: 1, scale: 1, x: 0 }}
                      transition={{ duration: suppressMotion ? 0 : 0.22, ease: 'easeOut' }}
                      className="w-full h-full relative p-0.5 flex items-center justify-center"
                    >
                      <CardItem
                        card={cell}
                        isOnBoard={true}
                        isLocked={true}
                        language={language}
                        lowSpecMode={suppressMotion}
                        cellElement={tileEl}
                        className={cn(
                          "w-full h-full rounded-none shadow-none pointer-events-none"
                        )}
                      />

                      {/* 각 카드별 속성 배지 (우측 하단) */}
                      {cardDef && (
                        <div 
                          className="absolute bottom-0.5 right-0.5 z-30 flex items-center gap-0.5 px-1 py-0.5 rounded-xs bg-[#fdfcfc]/95 text-[#201d1d] border border-[#201d1d]/30 font-mono text-[7.5px] font-bold leading-none shadow-2xs pointer-events-none select-none"
                          title={`${language === 'ko' ? cardDef.nameKo : cardDef.nameEn} ${language === 'ko' ? '속성' : 'Element'}`}
                        >
                          <cardDef.Icon size={8.5} strokeWidth={2} className="text-[#201d1d] shrink-0" />
                          <span className="tracking-tight uppercase">[{language === 'ko' ? cardDef.nameKo : cardDef.nameEn}]</span>
                        </div>
                      )}

                      {/* 타일 속성 일치 시 시너지 효과 배지 (좌측 상단) */}
                      {isSynergy && (
                        <div className="absolute top-0.5 left-0.5 z-35 flex items-center gap-0.5 px-1 py-0.5 rounded-xs bg-[#201d1d] text-[#fdfcfc] border border-[#201d1d] font-mono text-[8px] font-black shadow-xs pointer-events-none">
                          <Sparkles size={8.5} strokeWidth={2} className="text-amber-300" />
                          <span>[+1 SYNERGY]</span>
                        </div>
                      )}

                      {/* Shield Indicator */}
                      {isShielded && (
                        <div className="absolute top-0.5 right-0.5 z-35 bg-[#fdfcfc] text-[#201d1d] border border-[#201d1d] rounded-sm p-0.5">
                          <Shield size={11} />
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pointer-events-none select-none">
                      {tileDef ? (
                        <div className="flex flex-col items-center justify-center gap-1 text-[#201d1d]">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm bg-[#fdfcfc] border border-[#201d1d]/25 flex items-center justify-center shadow-2xs">
                            <tileDef.Icon size={19} strokeWidth={1.8} className="text-[#201d1d]" />
                          </div>
                          <span className="font-mono text-[9px] font-black uppercase tracking-wider text-[#201d1d] leading-none">
                            [{language === 'ko' ? tileDef.nameKo : tileDef.nameEn}]
                          </span>
                          <span className="font-mono text-[7.5px] font-bold text-[#646262] leading-none tracking-tight">
                            [+1 PWR]
                          </span>
                        </div>
                      ) : (
                        <>
                          <span className="text-lg font-bold">{isPlayable ? '[+]' : '+'}</span>
                          <span className="text-[10px] text-[#646262]">{String(idx + 1).padStart(2, '0')}</span>
                        </>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 하단/우측: 사용할 스킬 과 자동전투 토글 바 ── */}
        <aside 
          id="mobile-card-right-panel"
          className="w-full shrink-0 grid grid-cols-[1fr_1fr_1fr_1.3fr] gap-1.5 border-t border-[#0f0000]/12 pt-2 [@media(max-height:500px)_and_(min-width:480px)]:col-start-1 [@media(max-height:500px)_and_(min-width:480px)]:col-span-3 [@media(max-height:500px)_and_(min-width:480px)]:row-start-3 [@media(max-height:500px)_and_(min-width:480px)]:pt-1"
        >
          {/* 스킬 1: 파워 부스트 (+2) */}
          <button
            type="button"
            onClick={handleUsePowerSkill}
            disabled={turn !== 'player' || skillCharges.power <= 0 || gameOver || isEvaluating}
            aria-pressed={activeSkill === 'power'}
            aria-label={`${t('wiki_power', language)} +2 [${skillCharges.power}]`}
            className={cn(
              "min-w-0 px-1 rounded-sm border flex items-center justify-center gap-1 text-[11px] disabled:opacity-40",
              activeSkill === 'power'
                ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] font-bold"
                : skillCharges.power > 0 && turn === 'player'
                ? "border-[#0f0000]/12 hover:bg-[#f1eeee]"
                : "border-[#0f0000]/12 text-[#646262]"
            )}
          >
            <Zap size={14} className="shrink-0" />
            <span>+2</span><span className="text-[9px]">[{skillCharges.power}]</span>
          </button>

          {/* 스킬 2: 방어 실드 */}
          <button
            type="button"
            onClick={handleUseShieldSkill}
            disabled={turn !== 'player' || skillCharges.shield <= 0 || gameOver || isEvaluating}
            aria-pressed={activeSkill === 'shield'}
            aria-label={`${t('ability_shield', language)} [${skillCharges.shield}]`}
            className={cn(
              "min-w-0 px-1 rounded-sm border flex items-center justify-center gap-1 text-[11px] disabled:opacity-40",
              activeSkill === 'shield'
                ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] font-bold"
                : skillCharges.shield > 0 && turn === 'player'
                ? "border-[#0f0000]/12 hover:bg-[#f1eeee]"
                : "border-[#0f0000]/12 text-[#646262]"
            )}
          >
            <Shield size={14} className="shrink-0" />
            <span className="text-[10px]">[{skillCharges.shield}]</span>
          </button>

          {/* 스킬 3: 원소 버스트 */}
          <button
            type="button"
            onClick={handleUseBurstSkill}
            disabled={turn !== 'player' || skillCharges.burst <= 0 || gameOver || isEvaluating}
            aria-label={`${t('wiki_power', language)} +1 [${skillCharges.burst}]`}
            className={cn(
              "min-w-0 px-1 rounded-sm border flex items-center justify-center gap-1 text-[11px] disabled:opacity-40",
              skillCharges.burst > 0 && turn === 'player'
                ? "border-[#0f0000]/12 hover:bg-[#f1eeee]"
                : "border-[#0f0000]/12 text-[#646262]"
            )}
          >
            <Flame size={14} className="shrink-0" />
            <span>+1</span><span className="text-[9px]">[{skillCharges.burst}]</span>
          </button>

          {/* 자동전투 토글 버튼 */}
          <button
            type="button"
            onClick={toggleAuto}
            aria-label={t('auto_battle', language)}
            aria-pressed={isAutoBattle}
            className={cn(
              "min-w-0 px-1 rounded-sm border flex items-center justify-center gap-1 text-[10px] font-bold",
              isAutoBattle
                ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]"
                : "border-[#0f0000]/12 text-[#646262] hover:bg-[#f1eeee]"
            )}
          >
            <Bot size={14} className="shrink-0" />
            <span className="truncate">
              {t('auto_battle', language)}
            </span>
            <span>{isAutoBattle ? '[+]' : '[-]'}</span>
          </button>
        </aside>
      </main>

      {/* ─── 4. 내 카드 덱 (My Card Deck: 상대 카드와 동등한 크기 + 파란선 영역 표시) ───────────── */}
      <footer 
        id="mobile-card-my-deck"
        className="w-full max-w-[440px] shrink-0 flex flex-col items-center gap-1.5 border-2 border-blue-500 rounded-sm bg-blue-50/20 p-2 shadow-xs [@media(max-height:500px)_and_(min-width:480px)]:col-start-3 [@media(max-height:500px)_and_(min-width:480px)]:row-start-1 [@media(max-height:500px)_and_(min-width:480px)]:row-span-2 [@media(max-height:500px)_and_(min-width:480px)]:overflow-y-auto [@media(max-height:500px)_and_(min-width:480px)]:touch-pan-y"
      >
        <div className="w-full flex flex-wrap items-center justify-between gap-x-2 text-[11px]">
          <span className="font-bold text-white bg-blue-600 border border-blue-700 px-2 py-0.5 rounded-xs flex items-center gap-1 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-white inline-block" />
            {t('my_deck_title', language)} [{playerHand.length}/5]
          </span>
          <span className="text-[11px] text-blue-700 font-semibold" role="status">
            {gameOver ? t('snake_game_over', language)
              : turn === 'ai' ? t('opponent_turn', language)
              : isAutoBattle ? t('auto_battle', language)
              : selectedHandIndex !== null && playerHand[selectedHandIndex]
              ? (language === 'ko' ? '🔵 보드 빈칸을 터치하여 배치' : 'Tap board to place card')
              : (language === 'ko' ? '내 카드 터치하여 선택' : t('select_card', language))}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 w-full [@media(max-height:500px)_and_(min-width:480px)]:grid-cols-2 [@media(max-height:500px)_and_(min-width:560px)]:grid-cols-3">
          {playerHand.map((card, i) => {
            const isSelected = selectedHandIndex === i;
            const myEl = getNormalizedElement(card);
            const myDef = myEl ? ELEMENT_DEFINITIONS[myEl] : null;
            return (
              <button
                type="button"
                key={card.id}
                aria-pressed={isSelected}
                aria-label={`${t('select_card', language)}: ${language === 'ko' ? card.title : card.title_en || card.title}${myEl ? ` (${myEl})` : ''}`}
                onClick={() => {
                  playSound('tap');
                  setSelectedHandIndex(i);
                }}
                className={cn(
                  "aspect-[2.8/4] min-h-[96px] sm:min-h-[115px] max-h-[135px] rounded-sm relative overflow-hidden cursor-pointer border-2 transition-colors select-none [@media(max-height:500px)_and_(min-width:480px)]:h-[clamp(44px,24dvh,80px)]",
                  isSelected
                    ? "border-blue-600 shadow-sm"
                    : "border-blue-400/80 hover:border-blue-500 bg-blue-50/10"
                )}
              >
                <CardItem
                  card={card}
                  isLocked={turn !== 'player'}
                  isSelected={isSelected}
                  language={language}
                  lowSpecMode={suppressMotion}
                  className="w-full h-full pointer-events-none rounded-none shadow-none"
                />
                {myDef && (
                  <div 
                    className="absolute top-0.5 right-0.5 z-30 flex items-center gap-0.5 px-1 py-0.5 rounded-xs bg-[#fdfcfc]/95 text-[#201d1d] border border-[#201d1d]/30 font-mono text-[7.5px] font-bold leading-none shadow-2xs pointer-events-none select-none"
                    title={`${language === 'ko' ? myDef.nameKo : myDef.nameEn} ${language === 'ko' ? '속성' : 'Element'}`}
                  >
                    <myDef.Icon size={8.5} strokeWidth={2} className="text-[#201d1d] shrink-0" />
                    <span className="hidden sm:inline tracking-tight">[{language === 'ko' ? myDef.nameKo : myDef.nameEn}]</span>
                  </div>
                )}
              </button>
            );
          })}

          {/* Placeholders for used hand cards */}
          {Array.from({ length: Math.max(0, 5 - playerHand.length) }).map((_, idx) => (
            <div
              key={`empty-hand-${idx}`}
              className="aspect-[2.8/4] min-h-[96px] sm:min-h-[115px] max-h-[135px] border-2 border-dashed border-blue-300 bg-blue-50/10 rounded-sm flex items-center justify-center text-blue-400 font-mono [@media(max-height:500px)_and_(min-width:480px)]:h-[clamp(44px,24dvh,80px)]"
            >
              <span className="text-[11px] font-bold">[-]</span>
            </div>
          ))}
        </div>
      </footer>
      </div>

      {/* ─── Game Over Result Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={suppressMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={suppressMotion ? undefined : { opacity: 0 }}
            className="fixed inset-0 z-[250] bg-[#201d1d]/60 flex items-center justify-center p-3"
          >
            <motion.div
              initial={suppressMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={suppressMotion ? undefined : { opacity: 0, y: 8 }}
              className="w-full max-w-sm max-h-[calc(100dvh-24px)] overflow-y-auto touch-pan-y overscroll-contain rounded-none border border-[#0f0000]/12 bg-[#fdfcfc] p-4 sm:p-5 flex flex-col items-center text-center font-mono shrink-0"
            >
              {/* Winner Icon & Header */}
              <div className="mb-2">
                {winner === 'player' ? (
                  <div className="w-14 h-14 border border-[#0f0000]/12 flex items-center justify-center mx-auto">
                    <Trophy size={28} />
                  </div>
                ) : winner === 'ai' ? (
                  <div className="w-12 h-12 border border-[#0f0000]/12 flex items-center justify-center mx-auto">
                    <Award size={24} />
                  </div>
                ) : (
                  <div className="w-12 h-12 border border-[#0f0000]/12 flex items-center justify-center mx-auto">
                    <RotateCcw size={24} />
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold tracking-tight uppercase">
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
              <div className="my-2 py-1 px-4 border border-[#0f0000]/12 flex items-baseline gap-2 tabular-nums">
                <span className="text-2xl font-bold">{score.player}</span>
                <span className="text-[#9a9898]">:</span>
                <span className="text-2xl font-bold text-[#646262]">{score.opponent}</span>
              </div>

              {/* 무승부 시 서로의 덱 TP 비교 시각화 카드 */}
              {tieBreakerInfo && (
                <div className="w-full my-2 p-2.5 border border-[#0f0000]/12 flex flex-col gap-1.5 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-bold border-b border-[#0f0000]/12 pb-1">
                    <span className="flex items-center gap-1">
                      <span>⚖️</span>
                      <span>{language === 'ko' ? '무승부 동점 덱 TP 판정' : 'Tie-Breaker: Deck TP Comparison'}</span>
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold border border-[#0f0000]/12">
                      {tieBreakerInfo.winner === 'player'
                        ? (language === 'ko' ? '🏆 플레이어 TP 우세 승리' : '🏆 Player TP Win')
                        : (language === 'ko' ? '💀 상대 TP 우세 패배' : '💀 Rival TP Win')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs px-2 pt-1">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-[#646262]">{language === 'ko' ? '내 덱 TP' : 'My Deck TP'}</span>
                      <span className="text-sm font-bold">{tieBreakerInfo.playerTp.toLocaleString()}</span>
                    </div>
                    <div className="text-[#9a9898] font-bold text-xs px-2">VS</div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-[#646262]">{language === 'ko' ? '상대 덱 TP' : 'Rival Deck TP'}</span>
                      <span className="text-sm font-bold">{tieBreakerInfo.opponentTp.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#646262] text-center pt-1 border-t border-[#0f0000]/12">
                    {tieBreakerInfo.winner === 'player'
                      ? (language === 'ko' ? '✨ 내 덱 TP가 더 높아 승리로 판정되어 승률이 반영되었습니다!' : '✨ Win awarded due to higher Deck TP!')
                      : (language === 'ko' ? '상대 덱 TP가 더 높아 아쉽게 패배로 판정되었습니다.' : 'Loss awarded due to lower Deck TP.')}
                  </div>
                </div>
              )}

              {/* Rewards Description & Prominent SNS Notification */}
              <div className="w-full border border-[#0f0000]/12 p-3 my-2 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs border-b border-[#0f0000]/12 pb-1.5">
                  <span className="font-bold flex items-center gap-1">
                    <span>💰</span>
                    <span>{language === 'ko' ? '획득 SNS 보상' : 'Earned SNS'}</span>:
                  </span>
                  <span className="font-bold text-base flex items-center gap-1">
                    +{winner === 'player' ? 30 : (winner === 'ai' ? 10 : 15)} SNS
                  </span>
                </div>

                {/* 3대 핵심 보상 루프 1: 배틀 승리 보상 2배 버튼 (자동플레이 모드에서는 광고 버튼 완전 제거) */}
                {winner === 'player' && !isAutoBattle && (
                  <div className="my-1">
                    {isDoubleRewardClaimed ? (
                      <div className="py-1 px-2.5 border border-[#0f0000]/12 text-[10px] font-bold text-center flex items-center justify-center gap-1">
                        <span>✨</span>
                        <span>{language === 'ko' ? '보상 2배 수령 완료 (+30 SNS 추가 입금됨)' : '2x Reward Claimed (+30 SNS Added)'}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsRewardedModalOpen(true)}
                        className="w-full py-2 px-3 text-[11px] font-bold rounded-sm cursor-pointer flex items-center justify-center gap-1.5 bg-[#201d1d] text-[#fdfcfc]"
                      >
                        {isVipUser ? (
                          <>
                            <span>👑</span>
                            <span>{language === 'ko' ? 'VIP 원클릭 승리 보상 2배 받기 (+30 SNS)' : 'VIP 1-Click 2x Reward (+30 SNS)'}</span>
                          </>
                        ) : (
                          <>
                            <span>🎬</span>
                            <span>{language === 'ko' ? '광고 보고 승리 보상 2배 받기 (+30 SNS)' : 'Watch Ad for 2x Reward (+30 SNS)'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* 랭킹대전 전용 승리 혜택 및 스마트 루프 안내 */}
                {isRankingMatch && (
                  <div className="flex flex-col gap-1.5 pt-0.5 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#646262]">{language === 'ko' ? '현재 보유 SNS 잔액:' : 'Current Balance:'}</span>
                      <span className="font-bold text-sm">{sns} SNS</span>
                    </div>
                  </div>
                )}

                {effectiveTargetCardId && winner === 'player' && (
                  <div className="flex flex-wrap justify-between items-center gap-1 font-bold border-t border-[#0f0000]/12 pt-1 text-xs">
                    <span>{language === 'ko' ? '미션 카드 달성' : 'Mission Card'}:</span>
                    <span>No.{effectiveTargetCardId} {effectiveOpponentName}</span>
                  </div>
                )}
              </div>

              {/* Target Card Visual Reward Preview */}
              {effectiveTargetCardId && winner === 'player' && CARD_DATABASE[effectiveTargetCardId] && (
                <div className="flex flex-col items-center my-1 p-1.5 border border-[#0f0000]/12 w-full">
                  <div className="w-[68px] aspect-[5/7] my-1">
                    <CardItem
                      card={CARD_DATABASE[effectiveTargetCardId]}
                      isLocked={true}
                      language={language}
                      lowSpecMode={suppressMotion}
                      className="w-full h-full pointer-events-none rounded-none shadow-none"
                    />
                  </div>
                  <span className="text-[10px] font-bold">
                    {effectiveOpponentName}
                  </span>
                </div>
              )}

              {/* 1) 랭킹대전 스마트 루프 카운트다운 바 (무조건 3초) */}
              {isRankingMatch && rankingAutoLoopCountdown !== null && rankingAutoLoopCountdown > 0 && (
                <div className="w-full my-1.5 p-2 border border-[#0f0000]/12 flex flex-col items-center justify-center gap-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <RotateCcw size={14} className="shrink-0" />
                    <span>
                      {winner === 'player'
                        ? (language === 'ko'
                            ? `🛒 [ ${rankingAutoLoopCountdown}초 ] 후 상점에서 카드 뽑기 및 덱 강화...`
                            : `🛒 Summoning Cards in Shop in [ ${rankingAutoLoopCountdown}s ]...`)
                        : (language === 'ko'
                            ? `⚔️ [ ${rankingAutoLoopCountdown}초 ] 후 다음 라이벌 대전...`
                            : `⚔️ Next Match in [ ${rankingAutoLoopCountdown}s ]...`)}
                    </span>
                  </div>
                  <div className="w-full bg-[#f1eeee] h-1.5 overflow-hidden">
                    <div 
                      className="bg-[#201d1d] h-full"
                      style={{ width: `${(rankingAutoLoopCountdown / 3) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 2) 일반/미션 모드: 3초 카운터 후에 다시 카드 플레이 */}
              {!(isTutorialMode || (tutorialStep > 0 && tutorialStep <= 7)) && !isRankingMatch && rematchCountdown !== null && rematchCountdown > 0 && (
                <div className="w-full my-1.5 p-2 border border-[#0f0000]/12 flex flex-col items-center justify-center gap-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <RotateCcw size={14} className="shrink-0" />
                    <span>
                      {language === 'ko'
                        ? `⏱️ [ ${rematchCountdown}초 ] 후 다시 카드 플레이...`
                        : `⏱️ Restarting in [ ${rematchCountdown}s ]...`}
                    </span>
                  </div>
                  <div className="w-full bg-[#f1eeee] h-1.5 overflow-hidden">
                    <div 
                      className="bg-[#201d1d] h-full"
                      style={{ width: `${(rematchCountdown / 3) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full mt-2">
                {isRankingMatch ? (
                  <>
                    {winner === 'player' ? (
                      <>
                        <button
                          type="button"
                          onClick={handleImmediateShopGo}
                          className="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs rounded-sm cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>🛒</span>
                          <span>{language === 'ko' ? '지금 바로 상점에서 카드 뽑기' : 'Go to Shop Now'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleImmediateNextRankBattle}
                          className="w-full py-2 border border-[#0f0000]/12 font-bold text-xs rounded-sm cursor-pointer flex items-center justify-center gap-1.5 hover:bg-[#f1eeee]"
                        >
                          <span>⚔️</span>
                          <span>{language === 'ko' ? '상점 건너뛰고 다음 랭킹전' : 'Skip Shop & Next Battle'}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleImmediateNextRankBattle}
                        className="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs rounded-sm cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>⚔️</span>
                        <span>{language === 'ko' ? '지금 바로 랭킹플레이 재시작' : 'Restart Rank Play Now'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleExitGame}
                      className="w-full py-2 hover:bg-[#f1eeee] font-bold text-xs rounded-sm border border-[#0f0000]/12 cursor-pointer"
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
                    className="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs rounded-sm cursor-pointer flex items-center justify-center gap-1"
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
                      className="w-full py-2 font-bold text-xs rounded-sm cursor-pointer flex items-center justify-center gap-1 bg-[#201d1d] text-[#fdfcfc]"
                    >
                      <RefreshCw size={13} />
                      <span>{language === 'ko' ? '재대결' : 'Rematch'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExitGame}
                      className="w-full py-2 hover:bg-[#f1eeee] font-bold text-xs rounded-sm border border-[#0f0000]/12 cursor-pointer"
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

      {/* 보상형 광고 모달 (승리 보상 2배, 자동플레이 시 완전 차단) */}
      <RewardedAdModal
        isOpen={isRewardedModalOpen && !isAutoBattle}
        type="victory_2x"
        title={language === 'ko' ? '배틀 승리 보상 2배 스폰서 광고' : '2x Victory Reward Sponsored Ad'}
        rewardDescription={language === 'ko' ? '+30 SNS 코인 추가 입금' : '+30 SNS Coin Bonus Deposit'}
        onRewardGranted={handleDoubleRewardGranted}
        onClose={() => setIsRewardedModalOpen(false)}
        language={language}
      />

      {/* ─── Tower of Trials Boss Clear Dopamine Modal ─────────────── */}
      <AnimatePresence>
        {towerBossClearModal && (
          <motion.div
            initial={suppressMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={suppressMotion ? undefined : { opacity: 0 }}
            className="fixed inset-0 z-[120] bg-[#201d1d]/60 flex items-center justify-center p-4 font-mono select-none"
          >
            <motion.div
              initial={suppressMotion ? false : { opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={suppressMotion ? undefined : { opacity: 0, y: 8 }}
              className="w-full max-w-sm max-h-[calc(100dvh-32px)] overflow-y-auto touch-pan-y overscroll-contain bg-[#fdfcfc] border border-[#0f0000]/12 rounded-none p-5 text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto border border-[#0f0000]/12 flex items-center justify-center">
                <Trophy size={32} />
              </div>

              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 border border-[#0f0000]/12">
                  {language === 'ko' ? `🗼 시련의 탑 ${towerBossClearModal.floor}층 클리어!` : `🗼 Tower of Trials Floor ${towerBossClearModal.floor} Cleared!`}
                </span>
                <h3 className="text-lg font-bold mt-1 tracking-tight">
                  {language === 'ko' ? '👑 보스 격파 대승리!' : '👑 Boss Defeated!'}
                </h3>
              </div>

              <div className="border border-[#0f0000]/12 p-3.5 space-y-2 text-left text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#646262] flex items-center gap-1.5">
                    <span>🪙</span>
                    <span>SNS {language === 'ko' ? '보상' : 'Reward'}</span>
                  </span>
                  <span className="font-bold">+{towerBossClearModal.snsReward} SNS</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#646262] flex items-center gap-1.5">
                    <span>💎</span>
                    <span>{language === 'ko' ? '다이아몬드' : 'Diamonds'}</span>
                  </span>
                  <span className="font-bold">+{towerBossClearModal.diamonds} Gems</span>
                </div>

                {towerBossClearModal.title && (
                  <div className="flex items-center justify-between pt-1 border-t border-[#0f0000]/12">
                    <span className="text-[#646262] flex items-center gap-1.5">
                      <Award size={13} />
                      <span>{language === 'ko' ? '획득 칭호' : 'Title'}</span>
                    </span>
                    <span className="font-bold text-[11px] truncate max-w-[150px]">
                      [{towerBossClearModal.title}]
                    </span>
                  </div>
                )}

                {towerBossClearModal.costume && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#646262] flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span>{language === 'ko' ? '획득 코스튬' : 'Costume'}</span>
                    </span>
                    <span className="font-bold text-[11px] truncate max-w-[150px]">
                      ✨ {towerBossClearModal.costume}
                    </span>
                  </div>
                )}

                {towerBossClearModal.isWelcomeFirstBoss && (
                  <div className="p-2 border border-[#0f0000]/12 text-[10px] font-bold text-center">
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
                className="w-full py-3 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs rounded-sm cursor-pointer"
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
            initial={suppressMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={suppressMotion ? undefined : { opacity: 0 }}
            className="fixed inset-0 z-[220] bg-[#201d1d]/60 flex flex-col items-center justify-center p-4 font-mono select-none"
          >
            <motion.div
              initial={suppressMotion ? false : { opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={suppressMotion ? undefined : { opacity: 0, y: 8 }}
              className="w-full max-w-sm max-h-[calc(100dvh-32px)] bg-[#fdfcfc] border border-[#0f0000]/12 p-5 rounded-none flex flex-col items-center text-center relative overflow-y-auto touch-pan-y overscroll-contain"
            >
              <div className="relative w-20 h-20 my-2 flex items-center justify-center shrink-0">
                <div className="w-14 h-14 border border-[#0f0000]/12 flex items-center justify-center text-2xl">
                  {activeRankOpponent.avatar || '⚔️'}
                </div>
              </div>

              <div className="text-[10px] font-bold text-[#646262] mb-1">
                {language === 'ko' ? '새로운 랭킹 대전 상대를 검색 중...' : 'SEARCHING FOR RANK RIVAL...'}
              </div>

              <h3 className="text-base font-bold">
                {activeRankOpponent.name}
              </h3>

              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="px-2 py-0.5 border border-[#0f0000]/12 font-bold">
                  {activeRankOpponent.tier}
                </span>
                <span className="px-2 py-0.5 border border-[#0f0000]/12 font-bold">
                  {t('total_power', language)} {activeRankOpponent.totalPower}
                </span>
              </div>

              {/* Big 3s Countdown */}
              <div className="text-5xl font-bold my-4 tracking-tighter tabular-nums">
                {rankingSearchCountdown}s
              </div>

              <div className="w-full h-1.5 bg-[#f1eeee] overflow-hidden shrink-0">
                <motion.div
                  className="h-full bg-[#201d1d]"
                  initial={suppressMotion ? false : { width: '0%' }}
                  animate={{ width: `${((3 - rankingSearchCountdown) / 3) * 100}%` }}
                  transition={{ duration: suppressMotion ? 0 : 0.3 }}
                />
              </div>

              <p className="text-[11px] text-[#646262] mt-3">
                {language === 'ko' ? '3초 후 새로운 상대와 즉시 배틀이 시작됩니다.' : 'Battle begins in 3 seconds with new rival.'}
              </p>

              <button
                type="button"
                onClick={handleExitGame}
                className="mt-4 w-full py-2 bg-[#201d1d] text-[#fdfcfc] rounded-sm font-bold text-xs cursor-pointer shrink-0"
              >
                {language === 'ko' ? '매칭 취소 및 나가기' : 'Cancel & Exit'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 스마트 자동 라이프사이클: 웹툰/동영상 기분전환 힐링 모달 (자동플레이 모드 시 완전 차단) ── */}
      <AnimatePresence>
        {showRefreshBreakModal && !isAutoBattle && (
          <motion.div
            initial={suppressMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={suppressMotion ? undefined : { opacity: 0 }}
            className="fixed inset-0 z-[230] bg-[#201d1d]/60 flex flex-col items-center justify-center p-4 font-mono select-none"
          >
            <motion.div
              initial={suppressMotion ? false : { opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={suppressMotion ? undefined : { opacity: 0, y: 8 }}
              className="w-full max-w-sm max-h-[calc(100dvh-32px)] bg-[#fdfcfc] border border-[#0f0000]/12 p-5 rounded-none flex flex-col items-center text-center relative overflow-y-auto touch-pan-y overscroll-contain"
            >
              {/* 상단 뱃지 & 아이콘 */}
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 border border-[#0f0000]/12">
                  {refreshBreakType === 'webtoon' ? <BookOpen size={16} /> : <Film size={16} />}
                </span>
                <span className="text-xs font-bold">
                  {refreshBreakType === 'webtoon' ? '[☕ 웹툰 기분전환 라운지]' : '[🎬 시네마 힐링 라운지]'}
                </span>
              </div>

              <h3 className="text-sm font-bold truncate max-w-full shrink-0">
                {language === 'ko' ? refreshEpisodeData.titleKo : refreshEpisodeData.titleEn}
              </h3>

              {/* 미디어 뷰 영역 */}
              {refreshBreakType === 'webtoon' ? (
                <div className="relative w-full h-44 bg-[#f1eeee] border border-[#0f0000]/12 overflow-hidden my-3 flex items-center justify-center shrink-0">
                  {refreshEpisodeData.imageUrl ? (
                    <img
                      src={refreshEpisodeData.imageUrl}
                      alt="Webtoon Panel"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-[#646262]">
                      <BookOpen size={32} />
                      <span className="text-xs mt-2">{language === 'ko' ? '웹툰 컷 로딩 중...' : 'Loading panel...'}</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-[#201d1d] p-2 text-[10px] text-[#fdfcfc] text-left line-clamp-2">
                    💬 {language === 'ko' ? refreshEpisodeData.captionKo : refreshEpisodeData.captionEn}
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-44 bg-[#f1eeee] border border-[#0f0000]/12 overflow-hidden my-3 shrink-0">
                  {refreshEpisodeData.videoId ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${refreshEpisodeData.videoId}?autoplay=1&mute=1&controls=0&playsinline=1`}
                      title="Episode Video"
                      className="w-full h-full border-0 pointer-events-none"
                      allow="autoplay; encrypted-media"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#646262]">
                      <Film size={32} />
                      <span className="text-xs mt-2">{language === 'ko' ? '영상 로딩 중...' : 'Loading video...'}</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-[#201d1d] p-2 text-[10px] text-[#fdfcfc] text-left line-clamp-1">
                    🎬 {language === 'ko' ? refreshEpisodeData.captionKo : refreshEpisodeData.captionEn}
                  </div>
                </div>
              )}

              {/* 보너스 및 카운트다운 */}
              <div className="w-full border border-[#0f0000]/12 p-2.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <Coffee size={14} />
                  <span>{language === 'ko' ? '기분전환 보너스' : 'Refresh Bonus'}</span>
                </span>
                <span className="font-bold text-xs">
                  +10 SNS 지급 완료
                </span>
              </div>

              {/* 카운트다운 바 */}
              <div className="w-full mt-3">
                <div className="w-full bg-[#f1eeee] h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-[#201d1d]"
                    initial={suppressMotion ? false : { width: '100%' }}
                    animate={{ width: `${((refreshBreakCountdown ?? 4) / 4) * 100}%` }}
                    transition={{ duration: suppressMotion ? 0 : 0.3 }}
                  />
                </div>
                <p className="text-[11px] text-[#646262] mt-2">
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
                className="mt-4 w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs cursor-pointer rounded-sm shrink-0"
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
    </div>
    </MotionConfig>
  );
};

export default MobileCardPlayScreen;
