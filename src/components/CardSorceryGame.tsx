import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Flame, Droplets, Mountain, Wind } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MobileSafeAreaHUD } from './MobileSafeAreaHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { get2DGameTutorialSteps } from '../lib/mission2DCardTutorialEngine';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface CardSorceryGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const GAME_DURATION = 45;
const BASE_ENEMY_INTERVAL = 2500;
const MIN_ENEMY_INTERVAL = 800;

// Element counter cycle: water > fire > wind > land > water
const ELEMENT_COUNTER: Record<string, string> = {
  water: 'fire',
  fire: 'wind',
  wind: 'land',
  land: 'water',
};

const ELEMENT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  water: Droplets,
  fire: Flame,
  wind: Wind,
  land: Mountain,
};

const ELEMENT_BG: Record<string, string> = {
  water: 'bg-blue-500/20 border-blue-400/40 text-blue-300',
  fire: 'bg-red-500/20 border-red-400/40 text-red-300',
  wind: 'bg-teal-500/20 border-teal-400/40 text-teal-300',
  land: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
};

type GameStatus = 'ready' | 'playing' | 'gameover';

interface EnemyState {
  id: number;
  cardId: number;
  element: string;
  expiresAt: number;
}

const getCardElement = (card: CardData): string | null => {
  const dbCard = card.imageIndex ? CARD_DATABASE[card.imageIndex] : null;
  const el = card.element || dbCard?.element;
  if (!el) return null;
  const lower = el.toLowerCase();
  if (lower === 'air') return 'wind';
  if (lower === 'earth') return 'land';
  return lower;
};

export const CardSorceryGame: React.FC<CardSorceryGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const [status, setStatus] = useState<GameStatus>('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [highScore, setHighScore] = useState(0);
  const [enemy, setEnemy] = useState<EnemyState | null>(null);
  const [combo, setCombo] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<'correct' | 'wrong' | ''>('');
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_2d_card_sorcery') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameTimerRef = useRef<number>(0);
  const enemyTimerRef = useRef<number>(0);
  const endTimeRef = useRef(0);
  const nextEnemyIdRef = useRef(0);
  const rewardedRef = useRef(false);
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(5);
  const feedbackTimerRef = useRef<number>(0);
  const playerCardsRef = useRef<CardData[]>([]);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const saved = localStorage.getItem('hero_cardsorcery_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    const validElements = ['water', 'fire', 'wind', 'land', 'air', 'earth'];
    const deckCards = deck.filter(c => {
      const el = getCardElement(c);
      return el && validElements.includes(el);
    });
    const picks: CardData[] = deckCards.slice(0, 5);
    if (picks.length < 5) {
      const elementDbCards = [1, 11, 21, 31];
      for (let i = picks.length; i < 5; i++) {
        const dbCardId = elementDbCards[i % 4];
        const dbCard = CARD_DATABASE[dbCardId];
        if (dbCard) {
          picks.push({ ...dbCard, imageIndex: dbCardId, element: dbCard.element } as unknown as CardData);
        }
      }
    }
    playerCardsRef.current = picks.slice(0, 5);
  }, [deck]);

  const triggerSettlement = useCallback((finalScore: number, finalLives: number) => {
    if (rewardedRef.current) return;
    rewardedRef.current = true;

    const durationSeconds = Math.max(10, Math.round((Date.now() - startTimeRef.current) / 1000));
    const isVictory = finalScore >= 30;

    const receipt = calculateAndDepositMissionReward({
      gameId: 'card_sorcery',
      gameTitle: isKo ? '2D 카드 소서리 마법결투' : '2D Card Sorcery Spell Duel',
      durationSeconds,
      score: finalScore * 20 + finalLives * 50,
      maxTargetScore: 1800,
      isVictory,
      difficulty: finalScore >= 50 ? 'NIGHTMARE' : finalScore >= 30 ? 'HARD' : 'NORMAL',
      comboCount: comboRef.current,
      perfectClear: finalScore >= 50 && finalLives === 5,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  }, [isKo, onReward]);

  const endGame = useCallback(() => {
    clearInterval(gameTimerRef.current);
    clearTimeout(enemyTimerRef.current);
    setStatus('gameover');
    setEnemy(null);
    triggerSettlement(scoreRef.current, livesRef.current);
  }, [triggerSettlement]);

  const spawnEnemy = useCallback(() => {
    if (status !== 'playing') return;
    const elements = ['water', 'fire', 'wind', 'land'];
    const element = elements[Math.floor(Math.random() * elements.length)];

    const candidateIds: number[] = [];
    for (const [idStr, dbCard] of Object.entries(CARD_DATABASE)) {
      if (dbCard.element && dbCard.element.toLowerCase() === element) {
        candidateIds.push(Number(idStr));
      }
    }
    const cardId = candidateIds.length > 0
      ? candidateIds[Math.floor(Math.random() * candidateIds.length)]
      : Math.floor(Math.random() * 110) + 1;

    const enemyId = ++nextEnemyIdRef.current;
    const expiresAt = Date.now() + 3000;

    setEnemy({ id: enemyId, cardId, element, expiresAt });

    const scheduleNext = () => {
      const elapsed = (Date.now() - (endTimeRef.current - GAME_DURATION * 1000)) / 1000;
      const progress = Math.min(elapsed / GAME_DURATION, 1);
      const interval = BASE_ENEMY_INTERVAL - (BASE_ENEMY_INTERVAL - MIN_ENEMY_INTERVAL) * progress;

      enemyTimerRef.current = window.setTimeout(() => {
        setEnemy(curr => {
          if (curr && curr.id === enemyId) {
            livesRef.current -= 1;
            setLives(livesRef.current);
            comboRef.current = 0;
            setCombo(0);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');

            if (livesRef.current <= 0) {
              endGame();
              return null;
            }
          }
          return curr;
        });

        if (livesRef.current > 0 && status === 'playing') {
          spawnEnemy();
        }
      }, interval);
    };

    scheduleNext();
  }, [status, playSfx, endGame]);

  const startGame = useCallback(() => {
    clearInterval(gameTimerRef.current);
    clearTimeout(enemyTimerRef.current);
    clearTimeout(feedbackTimerRef.current);

    scoreRef.current = 0;
    livesRef.current = 5;
    comboRef.current = 0;
    rewardedRef.current = false;
    startTimeRef.current = Date.now();

    setScore(0);
    setLives(5);
    setTimeLeft(GAME_DURATION);
    setCombo(0);
    setFeedbackText('');
    setFeedbackType('');
    setSelectedCardIdx(null);
    setSettlementReceipt(null);
    setStatus('playing');

    endTimeRef.current = Date.now() + GAME_DURATION * 1000;

    gameTimerRef.current = window.setInterval(() => {
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        endGame();
      }
    }, 250);

    spawnEnemy();
  }, [spawnEnemy, endGame]);

  const handleCounterPick = useCallback((card: CardData, idx: number) => {
    if (status !== 'playing' || !enemy || isPaused || showTutorial) return;

    setSelectedCardIdx(idx);
    const cardEl = getCardElement(card);
    const requiredCounter = ELEMENT_COUNTER[enemy.element];

    if (cardEl && cardEl === requiredCounter) {
      clearTimeout(enemyTimerRef.current);
      comboRef.current += 1;
      setCombo(comboRef.current);
      const points = 1 + Math.floor(comboRef.current / 3);
      scoreRef.current += points;
      setScore(scoreRef.current);

      if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current);
        localStorage.setItem('hero_cardsorcery_highscore', String(scoreRef.current));
      }

      setFeedbackText(isKo ? '카운터 성공!' : 'COUNTER!');
      setFeedbackType('correct');
      playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = window.setTimeout(() => {
        setFeedbackText('');
        setFeedbackType('');
        setSelectedCardIdx(null);
      }, 500);

      spawnEnemy();
    } else {
      comboRef.current = 0;
      setCombo(0);
      livesRef.current -= 1;
      setLives(livesRef.current);

      setFeedbackText(isKo ? '원소 상성 실패!' : 'WEAK!');
      setFeedbackType('wrong');
      playSfx('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');

      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = window.setTimeout(() => {
        setFeedbackText('');
        setFeedbackType('');
        setSelectedCardIdx(null);
      }, 500);

      if (livesRef.current <= 0) {
        endGame();
      }
    }
  }, [status, enemy, isPaused, showTutorial, highScore, isKo, playSfx, spawnEnemy, endGame]);

  useEffect(() => {
    return () => {
      clearInterval(gameTimerRef.current);
      clearTimeout(enemyTimerRef.current);
      clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const tutorialSteps = get2DGameTutorialSteps('card_sorcery', isKo);
  const playerCards = playerCardsRef.current;

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#0f1117] text-slate-100 flex flex-col justify-between font-mono select-none w-full overflow-hidden">
      {/* Top Safe Area HUD */}
      <MobileSafeAreaHUD
        gameTitle={isKo ? '카드 소서리 결투' : 'Card Sorcery Duel'}
        score={score}
        customMetricLabel={isKo ? '생명' : 'HP'}
        customMetricValue={`♥ ${lives}/5`}
        isPaused={isPaused}
        language={language}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onTogglePause={() => setIsPaused(prev => !prev)}
      />

      {/* Info Bar */}
      <div className="w-full max-w-md mx-auto px-3 flex items-center justify-between text-xs py-1 bg-white/5 border border-white/10 shrink-0">
        <span className="text-slate-400">
          {isKo ? '시간' : 'TIME'}: <span className="text-amber-400 font-bold">{timeLeft}s</span>
        </span>
        <span className="text-slate-300">
          {isKo ? '콤보' : 'COMBO'}: <span className="text-emerald-400 font-bold">x{combo}</span>
        </span>
      </div>

      {/* Duel Arena Center */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-2 relative">
        {status === 'ready' && (
          <div className="text-center p-4 bg-black/40 border border-white/10 rounded-none max-w-xs">
            <p className="text-amber-400 font-bold text-sm mb-2">
              {isKo ? '[ 4원소 상성 마법 대결 ]' : '[ 4-ELEMENT SPELL DUEL ]'}
            </p>
            <p className="text-xs text-slate-400 mb-4">
              {isKo ? '물 > 불 > 바람 > 땅 > 물' : 'Water > Fire > Wind > Land > Water'}
            </p>
            <button
              onClick={startGame}
              className="w-full py-3 bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-amber-400 active:scale-95 transition-all"
            >
              {isKo ? '대결 시작' : 'START DUEL'}
            </button>
          </div>
        )}

        {status === 'playing' && enemy && (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className={cn('px-3 py-1 rounded-sm text-xs font-bold border flex items-center gap-1.5', ELEMENT_BG[enemy.element])}>
              {enemy.element === 'water' && <Droplets size={14} />}
              {enemy.element === 'fire' && <Flame size={14} />}
              {enemy.element === 'wind' && <Wind size={14} />}
              {enemy.element === 'land' && <Mountain size={14} />}
              <span className="uppercase">{enemy.element}</span>
            </div>

            <div className="w-28 h-36 border border-white/20 bg-slate-900/80 rounded-sm overflow-hidden p-1 shadow-lg">
              <div
                style={getCardSpriteStyle(enemy.cardId)}
                className="w-full h-full bg-contain bg-center bg-no-repeat"
              />
            </div>

            {feedbackText && (
              <div
                className={cn(
                  'text-sm font-bold tracking-wider px-3 py-1 rounded-sm border',
                  feedbackType === 'correct'
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-400/40'
                    : 'text-rose-400 bg-rose-950/60 border-rose-400/40'
                )}
              >
                {feedbackText}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Player Cards Selection Row */}
      {status === 'playing' && (
        <div className="shrink-0 w-full max-w-md mx-auto pb-3 px-2 select-none">
          <p className="text-[10px] text-slate-400 text-center mb-1.5 font-mono">
            {isKo ? '카운터 원소 카드를 탭하여 마법을 시전하세요' : 'Tap counter-element card to cast spell'}
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {playerCards.map((card, i) => {
              const el = getCardElement(card);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleCounterPick(card, i)}
                  className={cn(
                    'aspect-[3/4] rounded-sm border p-0.5 flex flex-col items-center justify-between transition-all active:scale-95 min-h-[44px]',
                    selectedCardIdx === i
                      ? 'border-amber-400 bg-amber-500/20 ring-1 ring-amber-400'
                      : 'border-white/10 bg-slate-900/60 hover:border-white/30'
                  )}
                >
                  <div
                    style={getCardSpriteStyle(card.imageIndex || card.id || 1)}
                    className="w-full flex-1 bg-contain bg-center bg-no-repeat"
                  />
                  {el && (
                    <span className={cn('text-[9px] font-bold px-1 rounded-none border w-full text-center', ELEMENT_BG[el])}>
                      {el === 'water' ? '💧' : el === 'fire' ? '🔥' : el === 'wind' ? '💨' : '🏔️'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2D Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="2d_card_sorcery"
          gameTitle={isKo ? '2D 카드 소서리 마법결투' : '2D Card Sorcery Spell Duel'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory / Game Over Reward Modal */}
      {status === 'gameover' && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={startGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
