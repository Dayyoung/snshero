import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Zap, Timer, Flame, Droplets, Mountain, Wind } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn, getCardSpriteStyle } from '../lib/utils';

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
const SWIPE_THRESHOLD = 15;
const FAST_SWIPE_MS = 200;

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

const ELEMENT_COLORS: Record<string, string> = {
  water: 'from-blue-500 to-cyan-400',
  fire: 'from-red-500 to-orange-500',
  wind: 'from-teal-400 to-emerald-500',
  land: 'from-amber-600 to-yellow-600',
};

const ELEMENT_BG: Record<string, string> = {
  water: 'bg-blue-500/20 border-blue-400/30',
  fire: 'bg-red-500/20 border-red-400/30',
  wind: 'bg-teal-500/20 border-teal-400/30',
  land: 'bg-amber-500/20 border-amber-400/30',
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
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);

  const gameTimerRef = useRef<number>(0);
  const enemyTimerRef = useRef<number>(0);
  const endTimeRef = useRef(0);
  const nextEnemyIdRef = useRef(0);
  const rewardedRef = useRef(false);
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(5);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const feedbackTimerRef = useRef<number>(0);
  const playerCardsRef = useRef<CardData[]>([]);

  const isKo = language === 'ko';

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('hero_cardsorcery_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Pick player cards from deck — prefer cards with valid elements
  useEffect(() => {
    const validElements = ['water', 'fire', 'wind', 'land', 'air', 'earth'];
    const deckCards = deck.filter(c => {
      const el = getCardElement(c);
      return el && validElements.includes(el);
    });
    // Pick up to 5 cards, fill with elemental database cards if needed
    const picks: CardData[] = deckCards.slice(0, 5);
    if (picks.length < 5) {
      const elementDbCards = [1, 11, 21, 31]; // Water1, Fire1, Wind1, Land1
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

  const playSound = useCallback((url: string) => {
    playSfx(url);
  }, [playSfx]);

  const getEnemyInterval = useCallback((): number => {
    if (status !== 'playing') return BASE_ENEMY_INTERVAL;
    const elapsed = (Date.now() - (endTimeRef.current - GAME_DURATION * 1000)) / 1000;
    const progress = Math.min(elapsed / GAME_DURATION, 1);
    return BASE_ENEMY_INTERVAL - (BASE_ENEMY_INTERVAL - MIN_ENEMY_INTERVAL) * progress;
  }, [status]);

  const spawnEnemy = useCallback(() => {
    if (status !== 'playing') return;
    // Pick a random element from the 4 main elements
    const elements = ['water', 'fire', 'wind', 'land'];
    const element = elements[Math.floor(Math.random() * elements.length)];
    // Find a database card with that element
    let cardId = 1;
    if (element === 'water') cardId = 1 + Math.floor(Math.random() * 10); // 1-10
    else if (element === 'fire') cardId = 11 + Math.floor(Math.random() * 10); // 11-20
    else if (element === 'wind') cardId = 21 + Math.floor(Math.random() * 10); // 21-30
    else if (element === 'land') cardId = 31 + Math.floor(Math.random() * 10); // 31-40

    const id = nextEnemyIdRef.current++;
    const interval = getEnemyInterval();
    const newEnemy: EnemyState = {
      id,
      cardId: Math.min(cardId, 110),
      element,
      expiresAt: Date.now() + interval + 500,
    };
    setEnemy(newEnemy);
    setSelectedCardIdx(null);

    // Schedule next enemy
    enemyTimerRef.current = window.setTimeout(() => {
      // If still alive and no correct answer in time, lose a life
      setEnemy(prev => {
        if (prev && prev.id === id) {
          livesRef.current = Math.max(0, livesRef.current - 1);
          setLives(livesRef.current);
          comboRef.current = 0;
          setCombo(0);
          showFeedback('wrong', isKo ? '시간 초과!' : 'Time\'s up!');
          if (livesRef.current <= 0) {
            endGame();
          }
        }
        return prev;
      });
      spawnEnemy();
    }, interval + 600);
  }, [status, getEnemyInterval, isKo]);

  const showFeedback = useCallback((type: 'correct' | 'wrong', text: string) => {
    setFeedbackText(text);
    setFeedbackType(type);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedbackText('');
      setFeedbackType('');
    }, 700);
  }, []);

  const endGame = useCallback(() => {
    setStatus('gameover');
    const finalScore = scoreRef.current;
    if (!rewardedRef.current) {
      rewardedRef.current = true;
      const rawReward = Math.floor(finalScore * 2);
      const reward = finalScore > 0 ? Math.min(60, Math.max(10, rawReward)) : 5;
      if (reward > 0) onReward(reward);
      // Save high score
      const saved = localStorage.getItem('hero_cardsorcery_highscore');
      const prev = saved ? parseInt(saved, 10) : 0;
      if (finalScore > prev) {
        localStorage.setItem('hero_cardsorcery_highscore', String(finalScore));
        setHighScore(finalScore);
      }
    }
  }, [onReward]);

  const handleCounterPick = useCallback((playerCard: CardData, idx: number) => {
    if (status !== 'playing' || !enemy) return;
    setSelectedCardIdx(idx);

    const playerElement = getCardElement(playerCard);
    const enemyElement = enemy.element;
    const counterElement = ELEMENT_COUNTER[enemyElement];

    if (playerElement === counterElement) {
      // Correct counter!
      comboRef.current += 1;
      setCombo(comboRef.current);
      scoreRef.current += 1 + comboRef.current;
      setScore(scoreRef.current);
      showFeedback('correct', isKo ? '완벽!' : 'Perfect!');
      playSound('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      // Clear current enemy and spawn new one
      if (enemyTimerRef.current) clearTimeout(enemyTimerRef.current);
      setEnemy(null);
      setTimeout(() => spawnEnemy(), 300);
    } else {
      // Wrong pick!
      comboRef.current = 0;
      setCombo(0);
      livesRef.current = Math.max(0, livesRef.current - 1);
      setLives(livesRef.current);
      showFeedback('wrong', isKo ? '틀렸어요!' : 'Wrong!');
      playSound('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');

      if (livesRef.current <= 0) {
        endGame();
      }
    }
  }, [status, enemy, isKo, showFeedback, playSound, spawnEnemy, endGame]);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    comboRef.current = 0;
    livesRef.current = 5;
    rewardedRef.current = false;
    nextEnemyIdRef.current = 0;
    setScore(0);
    setCombo(0);
    setLives(5);
    setTimeLeft(GAME_DURATION);
    setEnemy(null);
    setFeedbackText('');
    setFeedbackType('');
    setSelectedCardIdx(null);
    setStatus('playing');

    endTimeRef.current = Date.now() + GAME_DURATION * 1000;

    // Start timer
    gameTimerRef.current = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        endGame();
      }
    }, 200);

    // Spawn first enemy after short delay
    setTimeout(() => spawnEnemy(), 500);
  }, [spawnEnemy, endGame]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (enemyTimerRef.current) clearTimeout(enemyTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // Touch handlers for swipe to select card
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      setSwipeDirection(dx > 0 ? 'right' : 'left');
    } else if (Math.abs(dy) > SWIPE_THRESHOLD) {
      setSwipeDirection(dy > 0 ? 'down' : 'up');
    }
    if (!lowSpecMode) {
      e.preventDefault();
    }
  }, [lowSpecMode]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    const isFast = dt < FAST_SWIPE_MS && (Math.abs(dx) > SWIPE_THRESHOLD * 0.6 || Math.abs(dy) > SWIPE_THRESHOLD * 0.6);

    if (isFast || Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD) {
      // Swipe detected — select card based on direction
      const cards = playerCardsRef.current;
      if (cards.length === 0) return;
      let idx = 0;
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal: map x position to card index
        const touchX = e.changedTouches[0].clientX;
        const containerWidth = window.innerWidth;
        idx = Math.min(cards.length - 1, Math.floor((touchX / containerWidth) * cards.length));
      } else {
        // Vertical: up = first card, down = last
        idx = dy < 0 ? 0 : cards.length - 1;
      }
      handleCounterPick(cards[idx], idx);
    }

    setSwipeDirection(null);
    touchStartRef.current = null;
  }, [handleCounterPick]);

  // Keyboard support
  useEffect(() => {
    if (status !== 'playing') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const cards = playerCardsRef.current;
      if (cards.length === 0) return;
      const keys = ['1', '2', '3', '4', '5'];
      const idx = keys.indexOf(e.key);
      if (idx >= 0 && idx < cards.length) {
        handleCounterPick(cards[idx], idx);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, handleCounterPick]);

  const timeProgress = timeLeft / GAME_DURATION;
  const playerCards = playerCardsRef.current;

  // Show element hint for the enemy
  const enemyElementLabel = enemy ? (
    isKo
      ? { water: '물', fire: '불', wind: '바람', land: '대지' }[enemy.element]
      : { water: 'Water', fire: 'Fire', wind: 'Wind', land: 'Earth' }[enemy.element]
  ) : '';

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 font-sans text-white overflow-hidden relative flex flex-col justify-between select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <button
          onClick={onExit}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-wider text-amber-400">
            {status === 'playing' ? score : '⚡'}
          </span>
          <span className="text-2xl font-black tracking-widest bg-gradient-to-r from-indigo-400 to-amber-400 bg-clip-text text-transparent">
            {isKo ? '카드 소서리' : 'CARD SORCERY'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2.5 h-2.5 rounded-full border transition-all',
                i < lives ? 'bg-rose-500 border-rose-400 shadow-sm shadow-rose-500/50' : 'bg-white/10 border-white/10'
              )}
            />
          ))}
        </div>
      </div>

      {/* Timer bar */}
      {status === 'playing' && (
        <div className="h-1.5 bg-white/5">
          <div
            className={cn(
              'h-full transition-all duration-300 rounded-r-full',
              timeProgress > 0.5 ? 'bg-gradient-to-r from-indigo-500 to-amber-500' :
              timeProgress > 0.25 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
              'bg-gradient-to-r from-red-500 to-rose-500'
            )}
            style={{ width: `${timeProgress * 100}%` }}
          />
        </div>
      )}

      {/* Main game area */}
      <div className="flex flex-col items-center justify-between h-[calc(100vh-10rem)] px-4 py-6">
        {/* Enemy zone */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          {status === 'ready' && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">⚔️</div>
              <h2 className="text-2xl font-black tracking-wider text-white">
                {isKo ? '카드 소서리' : 'CARD SORCERY'}
              </h2>
              <p className="text-sm text-indigo-300/70 font-medium max-w-xs mx-auto leading-relaxed">
                {isKo
                  ? '적 카드의 원소를 보고 카운터 원소를 가진 카드를 선택하세요!'
                  : 'Study the enemy\'s element and pick the counter-element card!'}
              </p>
              <div className="flex gap-2 justify-center text-xs text-white/50">
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10">
                  💧 {isKo ? '물' : 'Water'} {'>'} 🔥
                </span>
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10">
                  🔥 {isKo ? '불' : 'Fire'} {'>'} 💨
                </span>
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10">
                  💨 {isKo ? '바람' : 'Wind'} {'>'} 🏔️
                </span>
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10">
                  🏔️ {isKo ? '대지' : 'Earth'} {'>'} 💧
                </span>
              </div>
              <button
                onClick={startGame}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-lg tracking-wider rounded-2xl shadow-xl shadow-indigo-900/30 transition-all active:scale-95 border border-white/10"
              >
                {isKo ? '게임 시작' : 'START'}
              </button>
              {highScore > 0 && (
                <p className="text-xs text-amber-400/60 font-medium">
                  {isKo ? `최고 점수: ${highScore}` : `High Score: ${highScore}`}
                </p>
              )}
            </div>
          )}

          {status === 'playing' && (
            <div className="flex-1 flex flex-col items-center justify-center w-full space-y-6">
              {/* Enemy card display */}
              <AnimateEnemyCard
                enemy={enemy}
                elementLabel={enemyElementLabel}
                lowSpecMode={lowSpecMode}
                isKo={isKo}
              />

              {/* Feedback text */}
              {feedbackText && (
                <div
                  className={cn(
                    'text-2xl font-black tracking-wider animate-bounce px-6 py-3 rounded-2xl border backdrop-blur-sm',
                    feedbackType === 'correct'
                      ? 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20'
                      : 'text-rose-300 bg-rose-500/10 border-rose-400/20'
                  )}
                >
                  {feedbackText}
                  {combo > 1 && feedbackType === 'correct' && (
                    <span className="text-amber-400 ml-2">x{combo}</span>
                  )}
                </div>
              )}

              {/* Combo indicator */}
              {combo > 1 && !feedbackText && (
                <div className="text-sm text-amber-400/80 font-black tracking-wider">
                  {isKo ? `콤보 ` : 'Combo '}x{combo}
                </div>
              )}
            </div>
          )}

          {status === 'gameover' && (
            <div className="text-center space-y-6">
              <div className="text-5xl mb-2">{score >= 10 ? '🏆' : score >= 5 ? '🎯' : '💪'}</div>
              <h2 className="text-2xl font-black tracking-wider text-white">
                {isKo ? '게임 종료!' : 'Game Over!'}
              </h2>
              <div className="space-y-2">
                <p className="text-4xl font-black text-amber-400 tracking-widest">{score}</p>
                <p className="text-xs text-indigo-300/60 font-medium">
                  {isKo ? '최종 점수' : 'Final Score'}
                </p>
                {score >= (highScore || 0) && score > 0 && (
                  <p className="text-xs text-amber-400 font-black tracking-wider">
                    🏆 {isKo ? '최고 기록!' : 'New High Score!'}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <p className="text-sm text-indigo-200/70 font-medium">
                  {isKo
                    ? `보상: ${score > 0 ? Math.min(60, Math.max(10, Math.floor(score * 2))) : 5} SNS`
                    : `Reward: ${score > 0 ? Math.min(60, Math.max(10, Math.floor(score * 2))) : 5} SNS`}
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={onExit}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-bold text-sm tracking-wider rounded-xl transition-all"
                  >
                    {isKo ? '나가기' : 'EXIT'}
                  </button>
                  <button
                    onClick={startGame}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm tracking-wider rounded-xl shadow-lg shadow-indigo-900/30 transition-all active:scale-95"
                  >
                    {isKo ? '다시하기' : 'RETRY'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Player cards row */}
        {status === 'playing' && (
          <div
            className="w-full max-w-md mx-auto"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ touchAction: 'none' }}
          >
            <p className="text-[10px] text-indigo-300/50 text-center mb-2 font-medium tracking-wider">
              {isKo ? '카운터 원소 카드를 선택하세요!' : 'Pick the counter-element card!'}
            </p>
            <div className="flex justify-center gap-2">
              {playerCards.map((card, i) => {
                const el = getCardElement(card);
                const isCounter = enemy && el === ELEMENT_COUNTER[enemy.element];
                return (
                  <button
                    key={i}
                    onClick={() => handleCounterPick(card, i)}
                    className={cn(
                      'relative w-16 h-20 rounded-xl border-2 transition-all duration-200 active:scale-90 overflow-hidden',
                      selectedCardIdx === i
                        ? feedbackType === 'correct'
                          ? 'border-emerald-400 shadow-lg shadow-emerald-400/30 scale-105'
                          : 'border-rose-400 shadow-lg shadow-rose-400/30'
                        : isCounter && !selectedCardIdx
                          ? 'border-amber-400/50 bg-amber-400/5 hover:border-amber-400'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    )}
                  >
                    <div
                      style={getCardSpriteStyle(card.imageIndex || card.id || 1)}
                      className="absolute inset-0 scale-125"
                    />
                    {el && (
                      <div className="absolute bottom-0.5 left-0.5 right-0.5 text-center">
                        <span className={cn(
                          'text-[8px] font-extrabold tracking-wider px-1 py-0.5 rounded',
                          ELEMENT_BG[el] || 'bg-white/10 border-white/10'
                        )}>
                          {{ water: '💧', fire: '🔥', wind: '💨', land: '🏔️' }[el] || '?'}
                        </span>
                      </div>
                    )}
                    {/* Keyboard hint */}
                    <div className="absolute top-0.5 right-1 text-[8px] font-black text-white/30">
                      {i + 1}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] text-indigo-300/30 text-center mt-2 font-medium">
              {isKo ? '키보드 1-5 또는 스와이프로 선택' : 'Keys 1-5 or swipe to select'}
            </p>
          </div>
        )}
      </div>

      {/* Swipe direction visual feedback */}
      {swipeDirection && status === 'playing' && !lowSpecMode && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={cn(
            'text-6xl font-black text-white/20 transition-all',
            swipeDirection === 'left' && '-translate-x-8',
            swipeDirection === 'right' && 'translate-x-8',
            swipeDirection === 'up' && '-translate-y-8',
            swipeDirection === 'down' && 'translate-y-8',
          )}>
            {swipeDirection === 'left' ? '←' : swipeDirection === 'right' ? '→' : swipeDirection === 'up' ? '↑' : '↓'}
          </div>
        </div>
      )}
    </div>
  );
};

// Animated enemy card component
const AnimateEnemyCard: React.FC<{
  enemy: EnemyState | null;
  elementLabel: string;
  lowSpecMode: boolean;
  isKo: boolean;
}> = ({ enemy, elementLabel, lowSpecMode, isKo }) => {
  if (!enemy) {
    return (
      <div className="w-32 h-40 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <span className="text-white/20 text-sm font-black">...</span>
      </div>
    );
  }

  const IconComp = ELEMENT_ICONS[enemy.element] || Flame;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Element badge */}
      <div className={cn(
        'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black tracking-wider border',
        ELEMENT_BG[enemy.element] || 'bg-white/10 border-white/10'
      )}>
        <IconComp className="w-3.5 h-3.5" />
        <span>{elementLabel}</span>
      </div>

      {/* Card sprite */}
      <div className={cn(
        'w-28 h-36 rounded-2xl border-2 border-white/10 bg-white/5 backdrop-blur-sm shadow-xl shadow-indigo-900/20 overflow-hidden',
        !lowSpecMode && 'animate-pulse'
      )}>
        <div
          style={getCardSpriteStyle(enemy.cardId)}
          className="w-full h-full scale-125"
        />
      </div>

      {/* Enemy name */}
      <p className="text-[10px] text-white/40 font-medium tracking-wider">
        {CARD_DATABASE[enemy.cardId]?.title || (isKo ? '적 카드' : 'Enemy Card')}
      </p>
    </div>
  );
};
