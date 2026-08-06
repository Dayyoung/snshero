import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Zap, Move } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';

interface CardSlidePuzzleGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const DIFFICULTY_CONFIG = [
  { size: 3, reward: 30 },
  { size: 4, reward: 80 },
  { size: 5, reward: 160 },
];

const SWIPE_THRESHOLD = 15;

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

// Generate shuffled, solvable puzzle
const shufflePuzzle = (size: number): number[] => {
  const total = size * size;
  const tiles: number[] = [];
  for (let i = 0; i < total - 1; i++) tiles.push(i);
  tiles.push(-1); // empty

  // Fisher-Yates shuffle
  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  // Count inversions for solvability. Exclude the row containing empty.
  let inversions = 0;
  for (let i = 0; i < total; i++) {
    if (tiles[i] === -1) continue;
    for (let j = i + 1; j < total; j++) {
      if (tiles[j] === -1) continue;
      if (tiles[i] > tiles[j]) inversions++;
    }
  }

  // For odd grid size, inversions must be even
  // For even grid size, inversions + row of blank from bottom must be even
  const emptyIdx = tiles.indexOf(-1);
  const emptyRowFromBottom = size - Math.floor(emptyIdx / size);

  let solvable: boolean;
  if (size % 2 === 1) {
    solvable = inversions % 2 === 0;
  } else {
    solvable = (inversions + emptyRowFromBottom) % 2 === 0;
  }

  // If not solvable, swap first two non-empty tiles
  if (!solvable) {
    const nonEmpty: number[] = [];
    for (let i = 0; i < total; i++) {
      if (tiles[i] !== -1) nonEmpty.push(i);
    }
    if (nonEmpty.length >= 2) {
      const a = nonEmpty[0];
      const b = nonEmpty[1];
      [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
    }
  }

  return tiles;
};

export const CardSlidePuzzleGame: React.FC<CardSlidePuzzleGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const [level, setLevel] = useState(0);
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const rewardedRef = useRef(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [swipeHint, setSwipeHint] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const moveRef = useRef(moves);
  moveRef.current = moves;

  const { size, reward } = DIFFICULTY_CONFIG[Math.min(level, DIFFICULTY_CONFIG.length - 1)];
  const totalTiles = size * size;

  const initGame = useCallback(() => {
    const newTiles = shufflePuzzle(size);
    setTiles(newTiles);
    setMoves(0);
    setIsComplete(false);
    rewardedRef.current = false;
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleReward = useCallback(() => {
    if (rewardedRef.current) return;
    rewardedRef.current = true;
    // Efficiency bonus: fewer moves = better reward
    const optimalMin = size * size * 3;
    const efficiency = moves > 0 ? Math.max(0.4, optimalMin / Math.max(moves, optimalMin)) : 1;
    const totalReward = Math.floor(reward * efficiency);
    onReward(totalReward);
  }, [reward, moves, size, onReward]);

  useEffect(() => {
    if (isComplete && !rewardedRef.current) {
      handleReward();
    }
  }, [isComplete, handleReward]);

  // Check if tiles are in order
  const checkComplete = useCallback((t: number[]) => {
    for (let i = 0; i < totalTiles - 1; i++) {
      if (t[i] !== i) return false;
    }
    return t[totalTiles - 1] === -1;
  }, [totalTiles]);

  const moveTile = useCallback((tileIdx: number) => {
    const emptyIdx = tiles.indexOf(-1);
    if (emptyIdx === -1) return;

    const tileRow = Math.floor(tileIdx / size);
    const tileCol = tileIdx % size;
    const emptyRow = Math.floor(emptyIdx / size);
    const emptyCol = emptyIdx % size;

    const isAdjacent =
      (tileRow === emptyRow && Math.abs(tileCol - emptyCol) === 1) ||
      (tileCol === emptyCol && Math.abs(tileRow - emptyRow) === 1);

    if (!isAdjacent) return;

    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    const newTiles = [...tiles];
    newTiles[emptyIdx] = newTiles[tileIdx];
    newTiles[tileIdx] = -1;

    setTiles(newTiles);
    setMoves(m => m + 1);

    if (checkComplete(newTiles)) {
      setIsComplete(true);
      playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    }
  }, [tiles, size, playSfx, checkComplete]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY, time: Date.now() });
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchStart) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy && absDx > SWIPE_THRESHOLD * 0.6) {
      setSwipeHint(dx > 0 ? 'right' : 'left');
    } else if (absDy > absDx && absDy > SWIPE_THRESHOLD * 0.6) {
      setSwipeHint(dy > 0 ? 'down' : 'up');
    } else {
      setSwipeHint(null);
    }
  }, [touchStart]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    const dt = Date.now() - touchStart.time;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Fast swipe uses lower threshold
    const threshold = dt < 200 ? SWIPE_THRESHOLD * 0.6 : SWIPE_THRESHOLD;

    const emptyIdx = tiles.indexOf(-1);
    if (emptyIdx === -1) { setTouchStart(null); setSwipeHint(null); return; }
    const emptyRow = Math.floor(emptyIdx / size);
    const emptyCol = emptyIdx % size;

    if (absDx > absDy && absDx > threshold) {
      // Horizontal swipe
      if (dx > 0 && emptyCol > 0) {
        moveTile(emptyIdx - 1);
      } else if (dx < 0 && emptyCol < size - 1) {
        moveTile(emptyIdx + 1);
      }
    } else if (absDy > absDx && absDy > threshold) {
      // Vertical swipe
      if (dy > 0 && emptyRow > 0) {
        moveTile(emptyIdx - size);
      } else if (dy < 0 && emptyRow < size - 1) {
        moveTile(emptyIdx + size);
      }
    }

    setTouchStart(null);
    setSwipeHint(null);
  }, [touchStart, tiles, size, moveTile]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComplete) return;
      const emptyIdx = tiles.indexOf(-1);
      if (emptyIdx === -1) return;
      const emptyRow = Math.floor(emptyIdx / size);
      const emptyCol = emptyIdx % size;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (emptyRow < size - 1) moveTile(emptyIdx + size);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (emptyRow > 0) moveTile(emptyIdx - size);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (emptyCol < size - 1) moveTile(emptyIdx + 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (emptyCol > 0) moveTile(emptyIdx - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tiles, size, moveTile, isComplete]);

  // Build card pool from deck
  const cardPool: number[] = [];
  for (let i = 0; i < totalTiles - 1; i++) {
    const deckCard = deck[i % Math.max(deck.length, 1)];
    const cardId = deckCard?.imageIndex || (deckCard?.id as number) || (i % 110) + 1;
    cardPool.push(CARD_DATABASE[cardId] ? cardId : (i % 110) + 1);
  }

  const emptyIdx = tiles.indexOf(-1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col items-center font-sans select-none pb-12 w-full overflow-x-hidden">
      {/* Header */}
      <header className="w-full h-16 flex items-center justify-between border-b border-white/10 px-4 md:px-6 bg-black/20 backdrop-blur-sm shrink-0">
        <button
          onClick={onExit}
          className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-amber-400 transition-colors shadow-sm cursor-pointer text-slate-300 flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-base md:text-lg font-black text-white tracking-wider uppercase">
            {language === 'ko' ? '카드 슬라이드 퍼즐' : 'Card Slide Puzzle'}
          </h1>
          <div className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest mt-0.5">
            Lv.{level + 1} ({size}&times;{size})
          </div>
        </div>
        <button
          onClick={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            initGame();
          }}
          className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-indigo-300 transition-colors shadow-sm cursor-pointer text-slate-300 flex items-center justify-center"
        >
          <RotateCcw size={18} />
        </button>
      </header>

      {/* Info Stats */}
      <div className="flex items-center gap-4 text-xs font-bold my-4 py-1.5 px-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl">
        <span className="text-indigo-300/60">
          {language === 'ko' ? '이동' : 'Moves'}: <span className="text-white">{moves}</span>
        </span>
        <div className="w-px h-3 bg-white/10" />
        <span className="text-amber-400">
          <Move size={12} className="inline mr-1" />
          {language === 'ko' ? '밀어서 맞추기' : 'Slide to solve'}
        </span>
      </div>

      {/* Swipe direction hint */}
      {swipeHint && (
        <div className={cn(
          'fixed top-24 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-100',
          'bg-amber-500/90 text-slate-950 shadow-lg',
        )}>
          {swipeHint === 'up' && (language === 'ko' ? '↑ 위로' : '↑ UP')}
          {swipeHint === 'down' && (language === 'ko' ? '↓ 아래로' : '↓ DOWN')}
          {swipeHint === 'left' && (language === 'ko' ? '← 왼쪽' : '← LEFT')}
          {swipeHint === 'right' && (language === 'ko' ? '→ 오른쪽' : '→ RIGHT')}
        </div>
      )}

      {/* Puzzle Grid */}
      <div
        className="w-full max-w-md px-4 flex justify-center"
        onTouchStart={onTouchStart}
        onTouchMove={e => e.preventDefault()}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <div
          className={cn(
            'grid p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl w-full select-none',
            size <= 3 ? 'max-w-[320px]' : size <= 4 ? 'max-w-[360px]' : 'max-w-[400px]',
          )}
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            gap: size <= 3 ? '6px' : size <= 4 ? '5px' : '4px',
          }}
        >
          {tiles.map((tileVal, idx) => {
            const isEmpty = tileVal === -1;
            const isCorrect = !isEmpty && tileVal === idx;
            return (
              <button
                key={idx}
                onClick={() => {
                  if (!isEmpty) moveTile(idx);
                }}
                className={cn(
                  'aspect-square rounded-xl border-2 transition-all duration-100 select-none outline-none relative overflow-hidden',
                  isEmpty && 'border-white/5 bg-transparent',
                  !isEmpty && 'border-white/10 bg-slate-900/50 cursor-pointer hover:scale-[1.03] active:scale-95 shadow-sm hover:border-amber-500/30',
                  isCorrect && 'border-emerald-500/40 bg-slate-900/80 ring-1 ring-emerald-500/20 shadow-emerald-500/10',
                  isComplete && 'border-emerald-500/50 ring-2 ring-emerald-500/20',
                )}
              >
                {!isEmpty && (
                  <div
                    className="w-full h-full rounded-lg"
                    style={getCardSpriteStyle(cardPool[tileVal])}
                  />
                )}
                {isEmpty && (
                  <div className="w-full h-full rounded-lg opacity-20">
                    <div className="w-full h-full bg-gradient-to-br from-indigo-900/30 via-slate-800/20 to-indigo-900/30 rounded-lg border border-white/5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hint text */}
      <p className="mt-4 text-[11px] font-bold text-indigo-300/40 tracking-wider uppercase px-4 text-center">
        {language === 'ko'
          ? '스와이프로 빈 칸 옆 타일을 밀어서 그림을 완성하세요!'
          : 'Swipe to slide tiles into the empty space. Complete the picture!'}
      </p>

      {/* Keyboard hint */}
      <p className="mt-1 text-[10px] font-semibold text-indigo-300/20 tracking-wider">
        {language === 'ko' ? '⌨ 방향키로도 조작 가능' : '⌨ Arrow keys also work'}
      </p>

      {/* Complete Modal */}
      {isComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-lg px-4">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 text-slate-100 w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3 animate-bounce" />
            <h3 className="text-lg font-black text-white mb-1">
              {language === 'ko' ? '완성!' : 'Complete!'}
            </h3>
            <p className="text-sm font-medium text-indigo-300/60 mb-4">
              {language === 'ko'
                ? `${moves}번 만에 완성!`
                : `Solved in ${moves} moves!`}
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-3xl font-extrabold text-amber-400">
                +{Math.floor(reward * (size * size * 3 / Math.max(moveRef.current, 1)))}
              </span>
              <span className="text-xs font-semibold text-indigo-300/40">SNS</span>
            </div>
            <div className="flex flex-col gap-2">
              {level < DIFFICULTY_CONFIG.length - 1 && (
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    setLevel(l => l + 1);
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-xl shadow-indigo-600/20 hover:shadow-2xl active:scale-95 transition-all cursor-pointer tracking-wider"
                >
                  {language === 'ko' ? '다음 레벨' : 'Next Level'}
                </button>
              )}
              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  initGame();
                }}
                className="w-full py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 font-black rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 tracking-wider"
              >
                <RotateCcw size={14} />
                <span>{language === 'ko' ? '다시하기' : 'Retry'}</span>
              </button>
              <button
                onClick={onExit}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl shadow-xl shadow-rose-600/20 hover:shadow-2xl active:scale-95 transition-all cursor-pointer tracking-wider"
              >
                {language === 'ko' ? '종료' : 'Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
