import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MobileSafeAreaHUD } from './MobileSafeAreaHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { get2DGameTutorialSteps } from '../lib/mission2DCardTutorialEngine';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface CardSlidePuzzleGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const DIFFICULTY_CONFIG = [
  { size: 3, reward: 20 },
  { size: 4, reward: 40 },
  { size: 5, reward: 60 },
];

const SWIPE_THRESHOLD = 15;

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

  const emptyIdx = tiles.indexOf(-1);
  const emptyRowFromBottom = size - Math.floor(emptyIdx / size);

  let solvable: boolean;
  if (size % 2 === 1) {
    solvable = inversions % 2 === 0;
  } else {
    solvable = (inversions + emptyRowFromBottom) % 2 === 0;
  }

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
  const isKo = language === 'ko';
  const [level, setLevel] = useState(0);
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_2d_card_slide') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);
  const [swipeHint, setSwipeHint] = useState<'up' | 'down' | 'left' | 'right' | null>(null);

  const rewardedRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const startTimeRef = useRef(Date.now());

  const { size } = DIFFICULTY_CONFIG[Math.min(level, DIFFICULTY_CONFIG.length - 1)];
  const totalTiles = size * size;

  const initGame = useCallback(() => {
    const newTiles = shufflePuzzle(size);
    setTiles(newTiles);
    setMoves(0);
    setIsComplete(false);
    setSettlementReceipt(null);
    setSwipeHint(null);
    rewardedRef.current = false;
    startTimeRef.current = Date.now();
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const checkComplete = useCallback((t: number[]) => {
    for (let i = 0; i < totalTiles - 1; i++) {
      if (t[i] !== i) return false;
    }
    return t[totalTiles - 1] === -1;
  }, [totalTiles]);

  const moveTile = useCallback((tileIdx: number) => {
    if (isComplete || isPaused || showTutorial) return;

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

    const nextMoves = moves + 1;
    setTiles(newTiles);
    setMoves(nextMoves);

    if (checkComplete(newTiles)) {
      setIsComplete(true);
      playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

      if (!rewardedRef.current) {
        rewardedRef.current = true;
        const durationSeconds = Math.max(10, Math.round((Date.now() - startTimeRef.current) / 1000));
        const score = Math.max(100, 1000 - nextMoves * 15 + level * 200);

        const receipt = calculateAndDepositMissionReward({
          gameId: 'card_slide',
          gameTitle: isKo ? '2D 카드 슬라이드 퍼즐' : '2D Card Slide Puzzle',
          durationSeconds,
          score,
          maxTargetScore: 1500,
          isVictory: true,
          difficulty: level >= 2 ? 'HARD' : 'NORMAL',
          comboCount: Math.max(1, 10 - Math.floor(nextMoves / 5)),
          perfectClear: nextMoves <= size * size * 2,
        });

        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      }
    }
  }, [tiles, size, playSfx, checkComplete, isComplete, isPaused, showTutorial, moves, level, isKo, onReward]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy && absDx > SWIPE_THRESHOLD * 0.6) {
      setSwipeHint(dx > 0 ? 'right' : 'left');
    } else if (absDy > absDx && absDy > SWIPE_THRESHOLD * 0.6) {
      setSwipeHint(dy > 0 ? 'down' : 'up');
    } else {
      setSwipeHint(null);
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    setSwipeHint(null);
    if (!start) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const dt = Date.now() - start.time;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const threshold = dt < 200 ? SWIPE_THRESHOLD * 0.6 : SWIPE_THRESHOLD;

    const emptyIdx = tiles.indexOf(-1);
    if (emptyIdx === -1) return;
    const emptyRow = Math.floor(emptyIdx / size);
    const emptyCol = emptyIdx % size;

    if (absDx > absDy && absDx > threshold) {
      if (dx > 0 && emptyCol > 0) {
        moveTile(emptyIdx - 1);
      } else if (dx < 0 && emptyCol < size - 1) {
        moveTile(emptyIdx + 1);
      }
    } else if (absDy > absDx && absDy > threshold) {
      if (dy > 0 && emptyRow > 0) {
        moveTile(emptyIdx - size);
      } else if (dy < 0 && emptyRow < size - 1) {
        moveTile(emptyIdx + size);
      }
    }
  }, [tiles, size, moveTile]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComplete || isPaused || showTutorial) return;
      const emptyIdx = tiles.indexOf(-1);
      if (emptyIdx === -1) return;
      const emptyRow = Math.floor(emptyIdx / size);
      const emptyCol = emptyIdx % size;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          if (emptyRow < size - 1) moveTile(emptyIdx + size);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          if (emptyRow > 0) moveTile(emptyIdx - size);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          if (emptyCol < size - 1) moveTile(emptyIdx + 1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          if (emptyCol > 0) moveTile(emptyIdx - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tiles, size, moveTile, isComplete, isPaused, showTutorial]);

  const cardPool: number[] = [];
  for (let i = 0; i < totalTiles - 1; i++) {
    const deckCard = deck[i % Math.max(deck.length, 1)];
    const cardId = deckCard?.imageIndex || (deckCard?.id as number) || (i % 110) + 1;
    cardPool.push(CARD_DATABASE[cardId] ? cardId : (i % 110) + 1);
  }

  const tutorialSteps = get2DGameTutorialSteps('card_slide', isKo);

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#0f1117] text-slate-100 flex flex-col justify-between font-mono select-none w-full overflow-hidden">
      {/* Top Safe Area HUD */}
      <MobileSafeAreaHUD
        gameTitle={isKo ? '카드 슬라이드 퍼즐' : 'Card Slide Puzzle'}
        score={isComplete ? 1000 : Math.max(0, 500 - moves * 10)}
        customMetricLabel={isKo ? '이동 수' : 'Moves'}
        customMetricValue={moves}
        isPaused={isPaused}
        language={language}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onTogglePause={() => setIsPaused(prev => !prev)}
      />

      {/* Info Stats Banner */}
      <div className="w-full max-w-sm mx-auto px-3 flex items-center justify-between text-xs py-1.5 bg-white/5 border border-white/10 rounded-none shrink-0">
        <span className="text-slate-400">
          {isKo ? '난이도' : 'STAGE'}: <span className="text-amber-400 font-bold">LV.{level + 1} ({size}x{size})</span>
        </span>
        <div className="w-px h-3 bg-white/10" />
        <span className="text-slate-300">
          {isKo ? '완성 목표' : 'GOAL'}: <span className="text-emerald-400 font-bold">{isKo ? '순서대로 정렬' : 'Sort in order'}</span>
        </span>
      </div>

      {/* Swipe direction hint */}
      {swipeHint && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-sm text-xs font-mono font-bold bg-amber-500 text-slate-950 shadow-md">
          {swipeHint === 'up' && (isKo ? '↑ 위로 슬라이드' : '↑ SLIDE UP')}
          {swipeHint === 'down' && (isKo ? '↓ 아래로 슬라이드' : '↓ SLIDE DOWN')}
          {swipeHint === 'left' && (isKo ? '← 왼쪽으로 슬라이드' : '← SLIDE LEFT')}
          {swipeHint === 'right' && (isKo ? '→ 오른쪽으로 슬라이드' : '→ SLIDE RIGHT')}
        </div>
      )}

      {/* Puzzle Viewport */}
      <div
        className="flex-1 min-h-0 flex items-center justify-center p-3 relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <div
          className="w-full max-w-[340px] aspect-square bg-black/40 border border-white/10 p-1 relative overflow-hidden"
        >
          <div
            className="grid gap-1 w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
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
                    'aspect-square rounded-sm border transition-all duration-100 select-none outline-none relative overflow-hidden',
                    isEmpty && 'border-white/5 bg-transparent',
                    !isEmpty && 'border-white/15 bg-slate-900 cursor-pointer active:scale-95',
                    isCorrect && 'border-emerald-400/60 bg-slate-900',
                    isComplete && 'border-amber-400 ring-1 ring-amber-400',
                    !lowSpecMode && !isEmpty && 'hover:border-white/30'
                  )}
                >
                  {!isEmpty && (
                    <div
                      className="w-full h-full rounded-none"
                      style={getCardSpriteStyle(cardPool[tileVal])}
                    >
                      <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold text-white/70 bg-black/60 px-1 rounded-sm">
                        {tileVal + 1}
                      </span>
                    </div>
                  )}
                  {isEmpty && (
                    <div className="w-full h-full flex items-center justify-center bg-white/5 border border-dashed border-white/10">
                      <span className="text-[10px] text-slate-500 font-mono">[-]</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* D-Pad & Controls for One-Handed Mobile Play */}
      <div className="shrink-0 flex flex-col items-center gap-1 select-none pb-2">
        <button
          type="button"
          onClick={() => {
            const emptyIdx = tiles.indexOf(-1);
            if (emptyIdx !== -1 && Math.floor(emptyIdx / size) < size - 1) {
              moveTile(emptyIdx + size);
            }
          }}
          className="w-14 h-11 rounded-sm bg-white/10 active:bg-amber-500/30 border border-white/20 flex items-center justify-center text-sm font-mono text-white active:scale-95 touch-manipulation min-h-[44px]"
          aria-label="Slide Up"
        >
          ▲
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              const emptyIdx = tiles.indexOf(-1);
              if (emptyIdx !== -1 && emptyIdx % size < size - 1) {
                moveTile(emptyIdx + 1);
              }
            }}
            className="w-14 h-11 rounded-sm bg-white/10 active:bg-amber-500/30 border border-white/20 flex items-center justify-center text-sm font-mono text-white active:scale-95 touch-manipulation min-h-[44px]"
            aria-label="Slide Left"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => {
              const emptyIdx = tiles.indexOf(-1);
              if (emptyIdx !== -1 && Math.floor(emptyIdx / size) > 0) {
                moveTile(emptyIdx - size);
              }
            }}
            className="w-14 h-11 rounded-sm bg-white/10 active:bg-amber-500/30 border border-white/20 flex items-center justify-center text-sm font-mono text-white active:scale-95 touch-manipulation min-h-[44px]"
            aria-label="Slide Down"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => {
              const emptyIdx = tiles.indexOf(-1);
              if (emptyIdx !== -1 && emptyIdx % size > 0) {
                moveTile(emptyIdx - 1);
              }
            }}
            className="w-14 h-11 rounded-sm bg-white/10 active:bg-amber-500/30 border border-white/20 flex items-center justify-center text-sm font-mono text-white active:scale-95 touch-manipulation min-h-[44px]"
            aria-label="Slide Right"
          >
            ▶
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center font-mono">
          {isKo ? '타일 터치, 화면 스와이프 또는 D-패드로 1손 조작' : 'Tap tiles, swipe, or use D-pad to slide'}
        </p>
      </div>

      {/* 2D Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="2d_card_slide"
          gameTitle={isKo ? '2D 카드 슬라이드 퍼즐' : '2D Card Slide Puzzle'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Settlement Modal */}
      {isComplete && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={() => {
            if (level < DIFFICULTY_CONFIG.length - 1) {
              setLevel(l => l + 1);
            } else {
              initGame();
            }
          }}
          onExit={onExit}
        />
      )}
    </div>
  );
};
