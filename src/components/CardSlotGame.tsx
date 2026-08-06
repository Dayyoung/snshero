import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Zap, Trophy, Gem } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';

interface CardSlotGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const COLS = 3;
const ROWS = 3;
const FREE_SPINS = 5;
const SPIN_COST = 10;
const SWIPE_THRESHOLD = 15;
const FAST_SWIPE_MS = 200;

const ELEMENTS = ['water', 'fire', 'wind', 'land'] as const;
const ELEMENT_EMOJI: Record<string, string> = {
  water: '💧', fire: '🔥', wind: '💨', land: '🏔️', air: '💨', earth: '🏔️',
};

type GameStatus = 'ready' | 'spinning' | 'stopping' | 'gameover';

interface SymbolData {
  cardId: number;
  element: string;
  isWild: boolean;
}

// Card sprite helper
const getCardSpriteStyle = (cardId: number): React.CSSProperties => {
  const idx = CARD_DATABASE[cardId] ? cardId : 1;
  const x = ((idx - 1) % 10) * (100 / 9);
  const y = Math.floor((idx - 1) / 10) * (100 / 10);
  return {
    backgroundImage: 'url(/card100.png)',
    backgroundSize: '1000% 1100%',
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated' as const,
  };
};

const getElement = (cardId: number): string => {
  const db = CARD_DATABASE[cardId];
  if (!db?.element) return 'neutral';
  const el = db.element.toLowerCase();
  if (el === 'air') return 'wind';
  if (el === 'earth') return 'land';
  return el;
};

const ELEMENT_COLORS: Record<string, string> = {
  water: 'from-blue-500 to-cyan-400',
  fire: 'from-red-500 to-orange-500',
  wind: 'from-teal-400 to-emerald-500',
  land: 'from-amber-600 to-yellow-600',
  neutral: 'from-slate-500 to-slate-400',
};

const randomCardId = (): number => Math.floor(Math.random() * 110) + 1;

export const CardSlotGame: React.FC<CardSlotGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const [status, setStatus] = useState<GameStatus>('ready');
  const [spinsLeft, setSpinsLeft] = useState(FREE_SPINS);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [grid, setGrid] = useState<SymbolData[][]>([]);
  const [spinningCols, setSpinningCols] = useState<boolean[]>([false, false, false]);
  const [winLines, setWinLines] = useState<number[][]>([]);
  const [lastWin, setLastWin] = useState(0);
  const [showWinFlash, setShowWinFlash] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);

  const rewardedRef = useRef(false);
  const scoreRef = useRef(0);
  const spinTimersRef = useRef<number[]>([]);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const wildCardIdsRef = useRef<number[]>([]);

  const isKo = language === 'ko';

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('hero_cardslot_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Extract wild card IDs from player deck
  useEffect(() => {
    const ids: number[] = [];
    for (const card of deck.slice(0, 5)) {
      const imgIdx = card.imageIndex || card.id || 0;
      if (imgIdx > 0 && imgIdx <= 110) ids.push(imgIdx);
    }
    wildCardIdsRef.current = ids;
  }, [deck]);

  // Initialize grid
  const initGrid = useCallback((): SymbolData[][] => {
    const g: SymbolData[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: SymbolData[] = [];
      for (let c = 0; c < COLS; c++) {
        const cardId = randomCardId();
        row.push({ cardId, element: getElement(cardId), isWild: false });
      }
      g.push(row);
    }
    return g;
  }, []);

  // Generate a single symbol (with chance of WILD from deck)
  const randomSymbol = useCallback((): SymbolData => {
    const wildIds = wildCardIdsRef.current;
    // ~15% chance of WILD if player has deck cards
    if (wildIds.length > 0 && Math.random() < 0.15) {
      const wildId = wildIds[Math.floor(Math.random() * wildIds.length)];
      return { cardId: wildId, element: getElement(wildId), isWild: true };
    }
    const cardId = randomCardId();
    return { cardId, element: getElement(cardId), isWild: false };
  }, []);

  // Check win lines
  const checkWinLines = useCallback((g: SymbolData[][]): { lines: number[][]; totalWin: number } => {
    const lines: number[][] = [];
    let totalWin = 0;

    // Check 3 horizontal rows
    for (let r = 0; r < ROWS; r++) {
      const a = g[r][0];
      const b = g[r][1];
      const c = g[r][2];
      if (isMatch(a, b) && isMatch(a, c)) {
        lines.push([r * COLS, r * COLS + 1, r * COLS + 2]);
        totalWin += getWinAmount(a, b, c);
      }
    }

    // Check 2 diagonals
    const d1a = g[0][0]; const d1b = g[1][1]; const d1c = g[2][2];
    if (isMatch(d1a, d1b) && isMatch(d1a, d1c)) {
      lines.push([0, 4, 8]);
      totalWin += getWinAmount(d1a, d1b, d1c);
    }

    const d2a = g[0][2]; const d2b = g[1][1]; const d2c = g[2][0];
    if (isMatch(d2a, d2b) && isMatch(d2a, d2c)) {
      lines.push([2, 4, 6]);
      totalWin += getWinAmount(d2a, d2b, d2c);
    }

    return { lines, totalWin };
  }, []);

  // Check if two symbols match (WILD matches anything)
  const isMatch = (a: SymbolData, b: SymbolData): boolean => {
    if (a.isWild || b.isWild) return true;
    return a.cardId === b.cardId || a.element === b.element;
  };

  // Calculate win amount
  const getWinAmount = (a: SymbolData, b: SymbolData, c: SymbolData): number => {
    let base = 5;
    // Exact card match bonus
    if (a.cardId === b.cardId && b.cardId === c.cardId) base = 20;
    // Element match bonus
    else if (a.element === b.element && b.element === c.element && a.element !== 'neutral') base = 10;
    // WILD bonus
    const wildCount = (a.isWild ? 1 : 0) + (b.isWild ? 1 : 0) + (c.isWild ? 1 : 0);
    if (wildCount >= 2) base *= 3;
    else if (wildCount === 1) base *= 2;

    return base;
  };

  // Spin one column
  const spinColumn = useCallback((colIdx: number, finalSymbols?: SymbolData[]) => {
    if (!lowSpecMode) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }

    let tickCount = 0;
    const maxTicks = 8 + colIdx * 3; // Stagger stop: col 0 stops first, col 2 last
    const tickInterval = lowSpecMode ? 50 : 80; // Faster ticks for low-spec

    const tick = () => {
      tickCount++;
      setGrid(prev => {
        const next = prev.map(row => [...row]);
        for (let r = 0; r < ROWS; r++) {
          next[r][colIdx] = randomSymbol();
        }
        return next;
      });

      if (tickCount < maxTicks) {
        spinTimersRef.current[colIdx] = window.setTimeout(tick, tickInterval + tickCount * 8);
      } else {
        // Set final symbols
        setGrid(prev => {
          const next = prev.map(row => [...row]);
          if (finalSymbols) {
            for (let r = 0; r < ROWS; r++) {
              next[r][colIdx] = finalSymbols[r];
            }
          }
          return next;
        });

        setSpinningCols(prev => {
          const next = [...prev];
          next[colIdx] = false;
          return next;
        });

        // When all columns stopped, evaluate
        setSpinningCols(prevSpinning => {
          if (prevSpinning.every(s => !s) || (prevSpinning.filter(s => s).length === 0)) {
            setTimeout(() => evaluateResult(), 400);
          }
          return prevSpinning;
        });
      }
    };

    spinTimersRef.current[colIdx] = window.setTimeout(tick, 100);
  }, [lowSpecMode, playSfx, randomSymbol]);

  // Generate final symbols for a column
  const generateFinalSymbols = useCallback((): SymbolData[] => {
    const symbols: SymbolData[] = [];
    for (let r = 0; r < ROWS; r++) {
      symbols.push(randomSymbol());
    }
    return symbols;
  }, [randomSymbol]);

  // Evaluate the final grid for wins
  const evaluateResult = useCallback(() => {
    setGrid(prev => {
      const { lines, totalWin } = checkWinLines(prev);
      setWinLines(lines);
      setLastWin(totalWin);

      if (totalWin > 0) {
        setShowWinFlash(true);
        setTimeout(() => setShowWinFlash(false), 1200);
        scoreRef.current += totalWin;
        setScore(scoreRef.current);
        playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

        // Update high score
        const saved = localStorage.getItem('hero_cardslot_highscore');
        const prev = saved ? parseInt(saved, 10) : 0;
        if (scoreRef.current > prev) {
          localStorage.setItem('hero_cardslot_highscore', String(scoreRef.current));
          setHighScore(scoreRef.current);
        }
      } else {
        setWinLines([]);
      }

      setStatus(spinsLeft > 0 ? 'ready' : 'gameover');
      return prev;
    });
  }, [spinsLeft, checkWinLines, playSfx]);

  // Handle game over
  useEffect(() => {
    if (status === 'gameover' && !rewardedRef.current) {
      rewardedRef.current = true;
      const reward = Math.floor(scoreRef.current * 3);
      if (reward > 0) onReward(reward);
    }
  }, [status, onReward]);

  // Perform a spin
  const handleSpin = useCallback(() => {
    if (status !== 'ready') return;
    if (spinsLeft <= 0) return;

    setSpinsLeft(prev => prev - 1);
    setSpinningCols([true, true, true]);
    setWinLines([]);
    setLastWin(0);
    setStatus('spinning');

    // Pre-generate final symbols for each column
    const finalGrid: SymbolData[][] = [];
    for (let c = 0; c < COLS; c++) {
      const symbols = generateFinalSymbols();
      finalGrid.push(symbols);
    }

    // Start all columns spinning with staggered stops
    setTimeout(() => spinColumn(0, finalGrid[0]), 100);
    setTimeout(() => spinColumn(1, finalGrid[1]), 300);
    setTimeout(() => spinColumn(2, finalGrid[2]), 500);
  }, [status, spinsLeft, generateFinalSymbols, spinColumn]);

  // Start game
  const startGame = useCallback(() => {
    scoreRef.current = 0;
    rewardedRef.current = false;
    setScore(0);
    setSpinsLeft(FREE_SPINS);
    setWinLines([]);
    setLastWin(0);
    setGrid(initGrid());
    setStatus('ready');
  }, [initGrid]);

  // Initialize grid on mount
  useEffect(() => {
    setGrid(initGrid());
  }, [initGrid]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      spinTimersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // Touch handlers
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
    e.preventDefault();
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStartRef.current) return;
    const dt = Date.now() - touchStartRef.current.time;
    // Tap → spin
    if (dt < FAST_SWIPE_MS) {
      handleSpin();
    }
    setSwipeDirection(null);
    touchStartRef.current = null;
  }, [handleSpin]);

  // Keyboard: space to spin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleSpin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSpin]);

  const allSpinning = spinningCols.some(s => s);
  const wildCount = wildCardIdsRef.current.length;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 font-sans text-white overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <button
          onClick={onExit}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Gem className="w-4 h-4 text-amber-400" />
            <span className="text-xl font-black tracking-wider text-amber-400">{score}</span>
          </div>
          <span className="text-xl font-black tracking-widest bg-gradient-to-r from-indigo-400 to-amber-400 bg-clip-text text-transparent">
            {isKo ? '카드 슬롯' : 'CARD SLOT'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-sm font-black text-amber-400">{spinsLeft}</span>
          </div>
        </div>
      </div>

      {/* Score / High Score bar */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-[10px] text-indigo-300/50 font-semibold tracking-wider uppercase">
          {isKo ? '최고 점수' : 'HIGH SCORE'}
        </span>
        <span className="text-sm font-black text-amber-400/80 tracking-wider">{highScore}</span>
        <span className="text-[10px] text-indigo-300/50 font-semibold tracking-wider uppercase">
          {isKo ? `WILD ${wildCount}장` : `WILD x${wildCount}`}
        </span>
      </div>

      {/* Main game area */}
      <div
        className="flex flex-col items-center justify-center px-4 py-6 gap-6"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'none' }}
      >
        {/* Ready state */}
        {status === 'ready' && (
          <div className="text-center space-y-6 flex-1 flex flex-col items-center justify-center">
            <div className="text-6xl mb-4">🎰</div>
            <h2 className="text-2xl font-black tracking-wider text-white">
              {isKo ? '카드 슬롯머신' : 'CARD SLOTS'}
            </h2>
            <p className="text-sm text-indigo-300/70 font-medium max-w-xs mx-auto leading-relaxed">
              {isKo
                ? '3줄 맞추면 SNS 보상! 내 덱 카드가 WILD로 등장합니다. 가로줄/대각선 5개 라인을 노리세요!'
                : 'Match 3 for SNS rewards! Your deck cards appear as WILDs. Hit 5 paylines for big wins!'}
            </p>

            {/* Element bonus guide */}
            <div className="flex gap-2 justify-center text-xs text-white/50 flex-wrap max-w-xs">
              <span className="px-2 py-1 rounded bg-white/5 border border-white/10">💧💧💧 x2</span>
              <span className="px-2 py-1 rounded bg-white/5 border border-white/10">🃏💧💧 x2</span>
              <span className="px-2 py-1 rounded bg-white/5 border border-white/10">🃏🃏💧 x3</span>
              <span className="px-2 py-1 rounded bg-white/5 border border-white/10">🔥🔥🔥 x2</span>
            </div>

            <button
              onClick={handleSpin}
              disabled={allSpinning || spinsLeft <= 0}
              className={cn(
                'px-8 py-4 rounded-2xl font-black text-lg tracking-wider transition-all active:scale-95 border border-white/10',
                spinsLeft > 0
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-900/30'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              )}
            >
              {spinsLeft > 0
                ? isKo ? `SPIN! (${spinsLeft}회 남음)` : `SPIN! (${spinsLeft} left)`
                : isKo ? '스핀 소진' : 'NO SPINS'
              }
            </button>
            <p className="text-[9px] text-indigo-300/30 font-medium">
              {isKo ? '화면 탭 / Space / Enter 로 스핀' : 'Tap screen / Space / Enter to spin'}
            </p>
          </div>
        )}

        {/* Spinning / Stopping state */}
        {(status === 'spinning' || (status === 'ready' && lastWin > 0)) && (
          <div className="flex flex-col items-center gap-4 flex-1 justify-center w-full max-w-sm">
            {/* Slot grid */}
            <div className={cn(
              'relative w-full aspect-square rounded-2xl border-2 p-2 transition-all duration-300',
              showWinFlash
                ? 'border-amber-400 shadow-lg shadow-amber-400/30 bg-amber-400/5'
                : 'border-white/10 bg-white/5'
            )}>
              <div className="grid grid-cols-3 gap-1.5 h-full">
                {grid.map((row, r) =>
                  row.map((sym, c) => {
                    const cellIdx = r * COLS + c;
                    const isWinCell = winLines.some(line => line.includes(cellIdx));
                    const isSpinning = spinningCols[c];

                    return (
                      <div
                        key={`${r}-${c}`}
                        className={cn(
                          'relative rounded-xl overflow-hidden transition-all duration-200',
                          isSpinning && !lowSpecMode && 'animate-pulse',
                          isWinCell && 'ring-2 ring-amber-400 shadow-lg shadow-amber-400/50 scale-105 z-10',
                          sym.isWild && 'ring-1 ring-purple-400/60'
                        )}
                        style={{ aspectRatio: '3/4' }}
                      >
                        <div
                          style={getCardSpriteStyle(sym.cardId)}
                          className="absolute inset-0 scale-125"
                        />
                        {/* Element indicator */}
                        {sym.element !== 'neutral' && (
                          <div className="absolute bottom-0.5 left-0.5 right-0.5 flex justify-center">
                            <span className="text-[10px]">
                              {ELEMENT_EMOJI[sym.element] || '?'}
                            </span>
                          </div>
                        )}
                        {/* WILD badge */}
                        {sym.isWild && (
                          <div className="absolute top-0.5 right-0.5">
                            <span className="text-[8px] font-black text-purple-400 bg-purple-950/80 px-1 rounded">
                              WILD
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Win flash overlay */}
              {showWinFlash && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={cn("text-4xl font-black text-amber-400 drop-shadow-lg tracking-widest", !lowSpecMode && "animate-bounce")}>
                    +{lastWin}
                  </div>
                </div>
              )}

              {/* Spinning overlay */}
              {allSpinning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-indigo-950/60 rounded-2xl">
                  <div className="flex gap-2">
                    {spinningCols.map((s, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-3 h-3 rounded-full',
                          s ? cn('bg-amber-400', !lowSpecMode && 'animate-pulse') : 'bg-emerald-400'
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Spin again button (after stop) */}
            {!allSpinning && status === 'ready' && lastWin >= 0 && (
              <button
                onClick={handleSpin}
                disabled={spinsLeft <= 0}
                className={cn(
                  'px-8 py-4 rounded-2xl font-black text-lg tracking-wider transition-all active:scale-95 border border-white/10',
                  spinsLeft > 0
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-900/30'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                )}
              >
                {spinsLeft > 0
                  ? isKo ? `SPIN! (${spinsLeft}회 남음)` : `SPIN! (${spinsLeft} left)`
                  : isKo ? '스핀 소진' : 'NO SPINS'
                }
              </button>
            )}

            {/* Win amount display */}
            {lastWin > 0 && !showWinFlash && !allSpinning && (
              <div className="text-center">
                <span className="text-amber-400 font-black text-lg tracking-wider">
                  +{lastWin} SNS
                </span>
              </div>
            )}
          </div>
        )}

        {/* Game over state */}
        {status === 'gameover' && (
          <div className="text-center space-y-6 flex-1 flex flex-col items-center justify-center">
            <div className="text-5xl mb-2">{score >= 100 ? '🏆' : score >= 50 ? '🎯' : '💪'}</div>
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
                  ? `보상: ${Math.floor(score * 3)} SNS`
                  : `Reward: ${Math.floor(score * 3)} SNS`}
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

      {/* Swipe direction visual feedback */}
      {swipeDirection && !allSpinning && !lowSpecMode && (
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
