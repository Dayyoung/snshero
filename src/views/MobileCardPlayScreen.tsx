import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Zap, Shield, Flame, RotateCcw, Volume2, VolumeX, 
  Sparkles, Check, Trophy, Award, Bot, RefreshCw, Star
} from 'lucide-react';
import { CardData, UserStats, Skill, Item, CardRarity } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { 
  INITIAL_CARDS, 
  generateUniqueDeck, 
  ensureUniqueDeck, 
  syncCardWithDatabase, 
  generateAiName, 
  getCardPower 
} from '../constants';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { AdSenseBanner } from '../components/AdSenseBanner';
import { CardItem } from '../components/CardItem';
import { t } from '../lib/i18n';
import { CardFlipParticleEffect, FlipEffectTrigger } from '../components/CardFlipParticleEffect';
import { BattleIntermissionScreen } from '../components/BattleIntermissionScreen';

export interface MobileCardPlayScreenProps {
  playerDeck?: CardData[];
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
  recordMatchResult?: (result: 'win' | 'loss' | 'draw') => void;
  autoCloseOnComplete?: boolean;
  isTutorialMode?: boolean;
  tutorialStep?: number;
  onTutorialToShop?: () => void;
  towerFloor?: number | null;
  isRankingMatch?: boolean;
}

export const MobileCardPlayScreen: React.FC<MobileCardPlayScreenProps> = ({
  playerDeck,
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
  isRankingMatch
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

  // 사용자 요청: Flip! & Doble Flip! 무지개색 파티클 이펙트
  const [flipEffectTrigger, setFlipEffectTrigger] = useState<FlipEffectTrigger | null>(null);

  // 사용자 요청: 랭킹대전 3초 검색 & 미션 게임 3초 대사 인터미션
  const [intermissionMode, setIntermissionMode] = useState<'ranking_search' | 'mission_dialogue' | null>(null);

  // Auto Battle & Speed (시작 시 자동전투 시작)
  const [isAutoBattle, setIsAutoBattle] = useState(initialAutoBattle !== false);
  const [battleSpeed, setBattleSpeed] = useState<1 | 2>(1);

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

  // Target card details (if launched from mission)
  const missionCardData = useMemo(() => {
    if (targetCardId && CARD_DATABASE[targetCardId]) {
      return CARD_DATABASE[targetCardId];
    }
    return null;
  }, [targetCardId]);

  // Opponent name
  const effectiveOpponentName = useMemo(() => {
    if (opponentName) return opponentName;
    if (missionCardData) {
      return language === 'ko' ? missionCardData.title : (missionCardData.title_en || missionCardData.title);
    }
    return generateAiName();
  }, [opponentName, missionCardData, language]);

  // 배틀 모드 판별: 미션 게임 vs 랭킹 대전
  const isMissionBattle = useMemo(() => Boolean(targetCardId && targetCardId > 0), [targetCardId]);
  const isRankingBattle = useMemo(() => {
    if (isRankingMatch !== undefined) return isRankingMatch;
    if (isMissionBattle) return false;
    if (towerFloor !== null) return false;
    if (opponentName && (opponentName.includes('스토리') || opponentName.includes('보스') || opponentName.includes('토너먼트'))) return false;
    return Boolean(opponentCustomDeck || (opponentName && !opponentName.startsWith('Bot ')));
  }, [isRankingMatch, isMissionBattle, towerFloor, opponentName, opponentCustomDeck]);

  // Deck generation helper
  const initMatchDecks = useCallback(() => {
    // 1. Player Deck (5 cards)
    let pCards: CardData[] = [];
    if (playerDeck && playerDeck.length >= 5) {
      pCards = playerDeck.slice(0, 5).map((c, i) => syncCardWithDatabase({
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
    if (opponentCustomDeck && opponentCustomDeck.length >= 5) {
      oCards = opponentCustomDeck.slice(0, 5).map((c, i) => syncCardWithDatabase({
        ...c,
        id: `opp-${i}-${Date.now()}`,
        owner: 'ai'
      }));
    } else if (targetCardId && CARD_DATABASE[targetCardId]) {
      // 5 identical target cards for mission battle as per AGENTS.md
      const dbCard = CARD_DATABASE[targetCardId];
      oCards = Array(5).fill(null).map((_, i) => syncCardWithDatabase({
        id: `mission-opp-${targetCardId}-${i}-${Date.now()}`,
        imageIndex: targetCardId,
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
    setMatchResultReported(false);
    setRematchCountdown(null);
    setTutorialShopCountdown(null);
    setFlippedSlots([]);
    setIsEvaluating(false);
    setActiveSkill(null);
    setSkillCharges({ power: 1, shield: 1, burst: 1 });
  }, [playerDeck, opponentCustomDeck, targetCardId]);

  // Initial game setup
  useEffect(() => {
    initMatchDecks();
  }, [initMatchDecks]);

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

      // 사용자 요청: 카드가 뒤짚어 질때 Flip! 텍스트와 무지개색 터지는 파티클 표시. 1개 이상 뒤짚힐 경우 Doble Flip! 과 수많은 파티클 표시.
      // 1개: Flip!, 2개 이상: Doble Flip!
      setFlipEffectTrigger({
        id: Date.now() + Math.random(),
        count: flippedIndices.length,
        slotIndices: flippedIndices,
      });

      setTimeout(() => setFlippedSlots([]), 800);
      setTimeout(() => setFlipEffectTrigger(null), 2000);
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
        let pScore = 0;
        let oScore = 0;
        updatedBoard.forEach(c => {
          if (!c) return;
          if (c.owner === 'player') pScore += 1;
          else if (c.owner === 'ai') oScore += 1;
        });

        const winState: 'player' | 'ai' | 'draw' = pScore > oScore ? 'player' : (pScore < oScore ? 'ai' : 'draw');
        setWinner(winState);
        setGameOver(true);
        setIsEvaluating(false);

        const calculatedResult: 'win' | 'loss' | 'draw' = winState === 'player' ? 'win' : (winState === 'ai' ? 'loss' : 'draw');
        if (recordMatchResult && !matchResultReported) {
          recordMatchResult(calculatedResult);
          setMatchResultReported(true);
        }

        if (winState === 'player') {
          playSound('win');
          const earnSns = 30;
          if (updateSns) updateSns(earnSns, 'battle_victory', 'earned');
          if (updateStats) {
            updateStats({
              wins: (userStats?.wins || 0) + 1,
              winStreak: (userStats?.winStreak || 0) + 1
            });
          }
          if (onEarnXp) onEarnXp(50);

          // If mission battle target: handle drop or enhancement
          if (targetCardId && addCard) {
            const isOwned = inventory.some((item: any) => item.cardId === targetCardId || item.index === targetCardId);
            const dbCard = CARD_DATABASE[targetCardId];
            const cardRarity = (dbCard?.rarity || 'bronze') as CardRarity;
            if (!isOwned) {
              addCard(cardRarity, targetCardId);
            } else {
              // 45% potential enhancement
              if (Math.random() < 0.45) {
                addCard(cardRarity, targetCardId, true);
                try {
                  const key = `hero_card_enhancement_${targetCardId}`;
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
          if (updateStats) {
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
          if (updateStats) {
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
    if (gameOver || isEvaluating) return;

    // 1. AI Opponent's Turn
    if (turn === 'ai') {
      if (opponentHand.length === 0) return;

      const emptySlots = board.map((c, i) => (c === null ? i : -1)).filter(i => i !== -1);
      if (emptySlots.length === 0) return;

      const delay = (700 / battleSpeed);
      const timer = setTimeout(() => {
        // Pick best card and slot (max flips or center/corners)
        let bestSlot = emptySlots[0];
        let bestCard = opponentHand[0];
        let maxFlips = -1;

        for (const card of opponentHand) {
          for (const slot of emptySlots) {
            const tempPlaced = { ...card, owner: 'ai' as const };
            const { flippedIndices } = executeFlips(tempPlaced, slot, board, boardShields);
            if (flippedIndices.length > maxFlips) {
              maxFlips = flippedIndices.length;
              bestSlot = slot;
              bestCard = card;
            }
          }
        }

        handlePlaceCard(bestSlot, bestCard, false);
      }, delay);

      return () => clearTimeout(timer);
    }

    // 2. Player's Turn with Auto-Battle ON
    if (turn === 'player' && isAutoBattle) {
      if (playerHand.length === 0) return;

      const emptySlots = board.map((c, i) => (c === null ? i : -1)).filter(i => i !== -1);
      if (emptySlots.length === 0) return;

      const delay = (600 / battleSpeed);
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
  }, [turn, isAutoBattle, gameOver, isEvaluating, opponentHand, playerHand, board, boardShields, battleSpeed, executeFlips, handlePlaceCard]);

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
    if (gameOver && winner && recordMatchResult && !matchResultReported) {
      const calculatedResult: 'win' | 'loss' | 'draw' = winner === 'player' ? 'win' : (winner === 'ai' ? 'loss' : 'draw');
      recordMatchResult(calculatedResult);
      setMatchResultReported(true);
    }
    onBack();
  }, [gameOver, winner, recordMatchResult, matchResultReported, onBack, playSound]);

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

  // 미션 및 카드 플레이: 승/패/무승부 처리 (튜토리얼 vs 일반 모드 분기)
  useEffect(() => {
    if (!gameOver || !winner) {
      setRematchCountdown(null);
      setTutorialShopCountdown(null);
      return;
    }

    // 1) 탑 등반 5층 보스 클리어 모달이 뜬 경우: 모달 확인을 위해 카운트다운 중지
    if (towerBossClearModal) {
      setRematchCountdown(null);
      setTutorialShopCountdown(null);
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

    // 4) 일반/미션 모드: 승/패/무승부 상관없이 3초 카운터 후 다시 카드 플레이
    setTutorialShopCountdown(null);
    setRematchCountdown(3);
  }, [gameOver, winner, isTutorialMode, tutorialStep, autoCloseOnComplete, towerBossClearModal]);

  // 사용자 요청: 랭킹대전 승패 결정 시 바로 재시작하지 않고 다시 3초 검색하고 시작, 미션 게임도 3초 대사 보여주고 시작
  const startNextBattleWithIntermission = useCallback(() => {
    setRematchCountdown(null);
    if (isRankingBattle) {
      setIntermissionMode('ranking_search');
    } else if (isMissionBattle) {
      setIntermissionMode('mission_dialogue');
    } else {
      initMatchDecks();
    }
  }, [isRankingBattle, isMissionBattle, initMatchDecks]);

  // 3초 카운트다운 감소 및 0초 도달 시 인터미션을 거쳐 시작
  useEffect(() => {
    if (rematchCountdown === null) return;
    if (rematchCountdown <= 0) {
      startNextBattleWithIntermission();
      return;
    }
    const timer = setTimeout(() => {
      setRematchCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [rematchCountdown, startNextBattleWithIntermission]);

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
      {/* ─── Compact Header (36px) ─────────────────────────────────── */}
      <header className="w-full h-9 px-2 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between shrink-0 z-30">
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
              : (targetCardId ? `🎯 No.${targetCardId} ${effectiveOpponentName}` : `⚔️ ${effectiveOpponentName}`)}
          </span>
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

      {/* ─── 2. 상대 덱 (Opponent Deck: 5 cards, ~56px) ─────────────── */}
      <div 
        id="mobile-card-opponent-deck"
        className="w-full px-2 py-1 bg-[#090d16] border-b border-stone-800/60 flex items-center justify-center gap-1.5 shrink-0"
      >
        <div className="flex items-center gap-1.5 max-w-sm w-full justify-between">
          <span className="text-[9px] font-bold text-rose-400 shrink-0 uppercase tracking-tight">
            [OPP: {opponentHand.length}]
          </span>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const card = opponentHand[i];
              const isRem = !!card;
              return (
                <div
                  key={`opp-card-${i}`}
                  className={cn(
                    "w-[34px] sm:w-[38px] aspect-[5/7] rounded-xs relative transition-all overflow-hidden flex items-center justify-center",
                    isRem
                      ? "ring-1 ring-rose-500/80 shadow-xs shadow-rose-900/40"
                      : "border border-stone-800/40 bg-stone-900/30 opacity-25"
                  )}
                >
                  {isRem && card ? (
                    <CardItem
                      card={card}
                      isLocked={true}
                      language={language}
                      className="w-full h-full pointer-events-none rounded-xs"
                    />
                  ) : (
                    <span className="text-[8px] text-stone-600 font-mono">--</span>
                  )}
                </div>
              );
            })}
          </div>
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
                    if (turn === 'player' && !isOccupied && isSelectedHand) {
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
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3"
          >
            <motion.div
              initial={{ scale: 0.85, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 15 }}
              className={cn(
                "w-full max-w-xs rounded-sm border p-4 flex flex-col items-center text-center shadow-2xl font-mono",
                winner === 'player'
                  ? "bg-[#0b1b16] border-emerald-500 shadow-emerald-950/60"
                  : winner === 'ai'
                  ? "bg-[#1f0f13] border-rose-500 shadow-rose-950/60"
                  : "bg-stone-900 border-amber-500 shadow-amber-950/60"
              )}
            >
              {/* Winner Icon & Header */}
              <div className="mb-2">
                {winner === 'player' ? (
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 mx-auto animate-bounce">
                    <Trophy size={24} />
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
                "text-lg font-black tracking-wider uppercase",
                winner === 'player' ? "text-emerald-300" : winner === 'ai' ? "text-rose-400" : "text-amber-300"
              )}>
                {winner === 'player' 
                  ? (language === 'ko' ? '🎉 승리 (VICTORY)' : 'VICTORY') 
                  : winner === 'ai' 
                  ? (language === 'ko' ? '💀 패배 (DEFEAT)' : 'DEFEAT') 
                  : (language === 'ko' ? '🤝 무승부 (DRAW)' : 'DRAW')}
              </h2>

              {/* Final Score */}
              <div className="my-2 py-1 px-3 bg-black/60 border border-white/10 rounded-xs flex items-baseline gap-2">
                <span className="text-xl font-black text-cyan-400">{score.player}</span>
                <span className="text-stone-500 font-bold">:</span>
                <span className="text-xl font-black text-rose-400">{score.opponent}</span>
              </div>

              {/* Rewards Description */}
              <div className="w-full bg-black/40 border border-white/5 rounded-xs p-2 my-2 text-[10px] text-stone-300 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span>SNS {language === 'ko' ? '보상' : 'Reward'}:</span>
                  <span className="font-bold text-amber-400">
                    +{winner === 'player' ? 30 : (winner === 'ai' ? 10 : 15)} SNS
                  </span>
                </div>
                {targetCardId && winner === 'player' && (
                  <div className="flex justify-between items-center text-emerald-400 font-bold border-t border-white/5 pt-1">
                    <span>{language === 'ko' ? '미션 카드 달성' : 'Mission Card'}:</span>
                    <span>No.{targetCardId} {effectiveOpponentName}</span>
                  </div>
                )}
              </div>

              {/* Target Card Visual Reward Preview */}
              {targetCardId && winner === 'player' && CARD_DATABASE[targetCardId] && (
                <div className="flex flex-col items-center my-1 p-1.5 bg-black/60 rounded-xs border border-emerald-500/40 w-full">
                  <div className="w-[68px] aspect-[5/7] my-1 shadow-lg shadow-emerald-500/30">
                    <CardItem
                      card={CARD_DATABASE[targetCardId]}
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

              {/* 1) 튜토리얼 모드: 상점으로 자동 이동 알림 */}
              {(isTutorialMode || (tutorialStep > 0 && tutorialStep <= 7)) && (
                <div className="w-full my-1.5 p-2 bg-amber-950/80 border border-amber-500/50 rounded-xs flex flex-col items-center justify-center gap-1.5 font-mono shadow-md">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-300 tracking-wider">
                    <Sparkles size={14} className="animate-spin text-amber-400 shrink-0" />
                    <span>
                      {language === 'ko'
                        ? `🛒 튜토리얼 완료: ${tutorialShopCountdown ?? 2}초 후 상점으로 이동...`
                        : `🛒 Tutorial: Moving to Shop in ${tutorialShopCountdown ?? 2}s...`}
                    </span>
                  </div>
                  <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden border border-amber-500/30">
                    <div 
                      className="bg-amber-400 h-full transition-all duration-1000 ease-linear"
                      style={{ width: `${((tutorialShopCountdown ?? 2) / 2) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 2) 일반/미션/랭킹 모드: 3초 카운터 후에 인터미션/재시작 안내 */}
              {!(isTutorialMode || (tutorialStep > 0 && tutorialStep <= 7)) && rematchCountdown !== null && rematchCountdown > 0 && (
                <div className="w-full my-1.5 p-2 bg-emerald-950/80 border border-emerald-500/40 rounded-xs flex flex-col items-center justify-center gap-1.5 font-mono shadow-md">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-400 tracking-wider">
                    <RotateCcw size={14} className="animate-spin text-emerald-400 shrink-0" />
                    <span>
                      {isRankingBattle
                        ? (language === 'ko'
                            ? `🔍 [ ${rematchCountdown}초 ] 후 3초 상대 검색 시작...`
                            : `🔍 Starting 3s search in [ ${rematchCountdown}s ]...`)
                        : isMissionBattle
                        ? (language === 'ko'
                            ? `💬 [ ${rematchCountdown}초 ] 후 3초 결투 대사 시작...`
                            : `💬 Starting 3s dialogue in [ ${rematchCountdown}s ]...`)
                        : (language === 'ko'
                            ? `⏱️ [ ${rematchCountdown}초 ] 후 다시 카드 플레이...`
                            : `⏱️ Restarting in [ ${rematchCountdown}s ]...`)}
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
              <div className="flex items-center gap-2 w-full mt-2">
                {(isTutorialMode || (tutorialStep > 0 && tutorialStep <= 7)) ? (
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
                        startNextBattleWithIntermission();
                      }}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs uppercase rounded-xs transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <RefreshCw size={13} />
                      <span>
                        {isRankingBattle 
                          ? (language === 'ko' ? '검색 후 대전' : 'Search & Duel')
                          : isMissionBattle 
                          ? (language === 'ko' ? '대사 후 대전' : 'Dialogue & Duel')
                          : (language === 'ko' ? '재대결' : 'Rematch')}
                      </span>
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
      {/* ─── Flip! & Doble Flip! 무지개색 파티클 이펙트 ─────────────── */}
      <CardFlipParticleEffect trigger={flipEffectTrigger} />

      {/* ─── 랭킹 3초 검색 & 미션 3초 대사 인터미션 오버레이 ─────────── */}
      {intermissionMode && (
        <BattleIntermissionScreen
          mode={intermissionMode}
          targetCard={missionCardData ? syncCardWithDatabase({ ...missionCardData, owner: 'ai' } as any) : (board.find(c => c !== null) ?? null)}
          targetCardId={targetCardId}
          opponentName={effectiveOpponentName}
          lastResult={winner === 'player' ? 'win' : (winner === 'ai' ? 'loss' : 'draw')}
          language={language}
          onComplete={() => {
            setIntermissionMode(null);
            initMatchDecks();
          }}
          onCancel={() => {
            setIntermissionMode(null);
            handleExitGame();
          }}
        />
      )}
    </div>
  );
};

export default MobileCardPlayScreen;
