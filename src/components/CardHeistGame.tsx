import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Zap, Shield, Eye, EyeOff } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn, getCardSpriteStyle } from '../lib/utils';

interface CardHeistGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const GRID = 7;
const SWIPE_THRESHOLD = 15;
const FAST_SWIPE_MS = 200;

interface GridCell {
  type: 'empty' | 'player' | 'enemy' | 'treasure';
  cardId: number;
  patrolDir?: 'up' | 'down' | 'left' | 'right';
  patrolStep?: number;
}

// Uses getCardSpriteStyle from utils

export const CardHeistGame: React.FC<CardHeistGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const [grid, setGrid] = useState<GridCell[][]>(() =>
    Array.from({ length: GRID }, () =>
      Array.from({ length: GRID }, (): GridCell => ({ type: 'empty', cardId: 0 }))
    )
  );
  const [playerPos, setPlayerPos] = useState({ row: GRID - 1, col: Math.floor(GRID / 2) });
  const [score, setScore] = useState(0);
  const [treasuresCollected, setTreasuresCollected] = useState(0);
  const [totalTreasures, setTotalTreasures] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [level, setLevel] = useState(1);
  const [showDangerZones, setShowDangerZones] = useState(false);
  const [swipeDir, setSwipeDir] = useState<string | null>(null);
  const rewardedRef = useRef(false);
  const enemyMoveTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const playerCardId = deck[0]?.imageIndex || deck[0]?.id as number || 1;
  const playerCard = CARD_DATABASE[playerCardId] || CARD_DATABASE[1];

  const getEnemyPatrolCards = useCallback(() => {
    const enemies: number[] = [];
    // Use themed enemies based on level
    const pools: Record<number, number[]> = {
      1: [51, 52, 53, 54, 55], // Undead
      2: [81, 82, 83, 84, 85], // Monster
      3: [91, 92, 93, 94, 95, 96], // Robot
    };
    const pool = pools[Math.min(level, 3)] || pools[3];
    const count = Math.min(level + 2, 5);
    for (let i = 0; i < count; i++) {
      enemies.push(pool[i % pool.length]);
    }
    return enemies;
  }, [level]);

  const getTreasureCards = useCallback(() => {
    const cards: number[] = [];
    const treasurePool = [106, 107, 108, 109, 110]; // Dragons as treasure
    const count = Math.min(level + 1, 4);
    for (let i = 0; i < count; i++) {
      cards.push(treasurePool[i % treasurePool.length]);
    }
    return cards;
  }, [level]);

  const initGame = useCallback(() => {
    const newGrid: GridCell[][] = Array.from({ length: GRID }, () =>
      Array.from({ length: GRID }, (): GridCell => ({ type: 'empty', cardId: 0 }))
    );

    const playerRow = GRID - 1;
    const playerCol = Math.floor(GRID / 2);
    newGrid[playerRow][playerCol] = { type: 'player', cardId: playerCardId };

    // Place enemies in the middle rows
    const enemyCardIds = getEnemyPatrolCards();
    enemyCardIds.forEach((cardId, i) => {
      const row = 2 + i;
      const col = i % 2 === 0 ? 1 : GRID - 2;
      const dirs: Array<'up' | 'down' | 'left' | 'right'> = i % 2 === 0
        ? ['left', 'right']
        : ['up', 'down'];
      if (row < GRID - 1 && col < GRID) {
        newGrid[row][col] = {
          type: 'enemy',
          cardId,
          patrolDir: dirs[0],
          patrolStep: 0,
        };
      }
    });

    // Place treasures in the top area
    const treasureCardIds = getTreasureCards();
    const treasurePositions = [
      { row: 0, col: 0 },
      { row: 0, col: GRID - 1 },
      { row: 0, col: Math.floor(GRID / 2) },
      { row: 1, col: 1 },
    ];
    treasureCardIds.forEach((cardId, i) => {
      const pos = treasurePositions[i] || treasurePositions[treasurePositions.length - 1];
      if (pos.row < GRID && pos.col < GRID && newGrid[pos.row][pos.col].type === 'empty') {
        newGrid[pos.row][pos.col] = { type: 'treasure', cardId };
      }
    });

    setGrid(newGrid);
    setPlayerPos({ row: playerRow, col: playerCol });
    setScore(0);
    setTreasuresCollected(0);
    setTotalTreasures(treasureCardIds.length);
    setMoves(0);
    setIsGameOver(false);
    setIsWin(false);
    setShowDangerZones(false);
    rewardedRef.current = false;
  }, [playerCardId, getEnemyPatrolCards, getTreasureCards]);

  useEffect(() => {
    initGame();
  }, [level]);

  const getDangerNeighbors = useCallback((grid: GridCell[][]): Set<string> => {
    const danger = new Set<string>();
    if (!grid || grid.length === 0) return danger;
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (grid[r]?.[c]?.type === 'enemy') {
          for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < GRID && nc >= 0 && nc < GRID) {
              danger.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
    return danger;
  }, []);

  const moveEnemies = useCallback((prevGrid: GridCell[][]): GridCell[][] => {
    if (!prevGrid || prevGrid.length === 0) return prevGrid;
    const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const cell = newGrid[r][c];
        if (cell.type === 'enemy' && cell.patrolDir) {
          const step = (cell.patrolStep || 0) + 1;
          let dir = cell.patrolDir;

          // Reverse direction at edges
          if (dir === 'right' && c >= GRID - 1) dir = 'left';
          if (dir === 'left' && c <= 0) dir = 'right';
          if (dir === 'down' && r >= GRID - 2) dir = 'up';
          if (dir === 'up' && r <= 1) dir = 'down';

          let [dr, dc] = [0, 0];
          if (dir === 'up') dr = -1;
          if (dir === 'down') dr = 1;
          if (dir === 'left') dc = -1;
          if (dir === 'right') dc = 1;

          const nr = r + dr;
          const nc = c + dc;

          if (
            nr >= 0 && nr < GRID && nc >= 0 && nc < GRID &&
            newGrid[nr][nc].type === 'empty'
          ) {
            newGrid[nr][nc] = { ...cell, patrolDir: dir, patrolStep: step };
            newGrid[r][c] = { type: 'empty', cardId: 0 };
          } else {
            // Reverse if blocked
            const reversed = dir === 'up' ? 'down' : dir === 'down' ? 'up'
              : dir === 'left' ? 'right' : 'left';
            newGrid[r][c] = { ...cell, patrolDir: reversed as 'up' | 'down' | 'left' | 'right', patrolStep: step };
          }
        }
      }
    }
    return newGrid;
  }, []);

  const movePlayer = useCallback((dr: number, dc: number) => {
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
      const { row, col } = playerPos;
      const nr = row + dr;
      const nc = col + dc;

      if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) {
        playSfx('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
        return prevGrid;
      }

      const targetCell = newGrid[nr][nc];

      if (targetCell.type === 'enemy') {
        // Caught!
        newGrid[nr][nc] = { type: 'player', cardId: playerCardId };
        newGrid[row][col] = { type: 'empty', cardId: 0 };
        setPlayerPos({ row: nr, col: nc });
        setIsGameOver(true);
        setIsWin(false);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
        return newGrid;
      }

      if (targetCell.type === 'treasure') {
        const newTreasures = treasuresCollected + 1;
        setTreasuresCollected(newTreasures);
        setScore(prev => prev + (level * 50) + moves * 2);
        newGrid[nr][nc] = { type: 'player', cardId: playerCardId };
        newGrid[row][col] = { type: 'empty', cardId: 0 };
        setPlayerPos({ row: nr, col: nc });
        playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

        if (newTreasures >= totalTreasures) {
          setIsGameOver(true);
          setIsWin(true);
        }
        return newGrid;
      }

      // Move to empty
      newGrid[nr][nc] = { type: 'player', cardId: playerCardId };
      newGrid[row][col] = { type: 'empty', cardId: 0 };
      setPlayerPos({ row: nr, col: nc });
      setMoves(prev => prev + 1);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      // Move enemies after player
      const gridAfterEnemies = moveEnemies(newGrid);

      // Check if player got caught after enemy move
      const { row: pr, col: pc } = { row: nr, col: nc };
      if (gridAfterEnemies[pr][pc].type === 'enemy') {
        setIsGameOver(true);
        setIsWin(false);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
      }

      return gridAfterEnemies;
    });
  }, [playerPos, playerCardId, treasuresCollected, totalTreasures, level, moves, moveEnemies, playSfx]);

  const handleReward = useCallback(() => {
    if (rewardedRef.current) return;
    rewardedRef.current = true;
    const baseReward = level * 50;
    const treasureBonus = treasuresCollected * 30;
    const moveBonus = Math.max(0, 100 - moves);
    const total = isWin ? baseReward + treasureBonus + moveBonus : Math.floor((treasureBonus) / 2);
    onReward(Math.max(total, isWin ? 30 : 5));
  }, [level, treasuresCollected, moves, isWin, onReward]);

  useEffect(() => {
    if (isGameOver) {
      handleReward();
    }
  }, [isGameOver, handleReward]);

  // Touch handlers with swipe support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || isGameOver) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;
    const threshold = elapsed < FAST_SWIPE_MS ? SWIPE_THRESHOLD * 0.6 : SWIPE_THRESHOLD;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      if (dx > 0) {
        setSwipeDir('right');
        movePlayer(0, 1);
      } else {
        setSwipeDir('left');
        movePlayer(0, -1);
      }
    } else if (Math.abs(dy) > threshold) {
      if (dy > 0) {
        setSwipeDir('down');
        movePlayer(1, 0);
      } else {
        setSwipeDir('up');
        movePlayer(-1, 0);
      }
    }
    setTimeout(() => setSwipeDir(null), 200);
    touchStartRef.current = null;
  }, [movePlayer, isGameOver]);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isGameOver) return;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          movePlayer(-1, 0);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          movePlayer(1, 0);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePlayer(0, -1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePlayer(0, 1);
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [movePlayer, isGameOver]);

  const dangerNeighbors = getDangerNeighbors(grid);
  const is = (row: number, col: number) => grid[row]?.[col];

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 flex flex-col items-center px-4 py-4 gap-4 font-sans">
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between">
        <button
          onClick={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            onExit();
          }}
          className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center border border-white/10 transition-all"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="text-lg font-black tracking-wider text-white uppercase">
          {t('mode_cardheist', language)}
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowDangerZones(!showDangerZones)}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center border border-white/10 transition-all"
            title={showDangerZones ? 'Hide danger zones' : 'Show danger zones'}
          >
            {showDangerZones ? <EyeOff size={18} className="text-amber-400" /> : <Eye size={18} className="text-indigo-300/60" />}
          </button>
        </div>
      </div>

      {/* Player Card Banner */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 px-4 py-3 flex items-center gap-3 shadow-xl shadow-indigo-900/20">
        <div
          className="w-12 h-12 rounded-xl border-2 border-amber-400/40 bg-cover bg-center shrink-0"
          style={getCardSpriteStyle(playerCardId)}
        />
        <div className="flex-1 min-w-0">
          <p className="text-amber-300 text-xs font-semibold">
            {language === 'ko' ? '침투 요원' : 'INFILTRATOR'}
          </p>
          <p className="text-white text-sm font-bold truncate">{playerCard?.title || playerCard?.title_en || ''}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-indigo-300/60 font-semibold uppercase tracking-wider">
            {language === 'ko' ? '레벨' : 'LVL'}
          </p>
          <p className="text-amber-400 text-lg font-black">{level}</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="w-full max-w-md flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 px-3 py-2">
          <Trophy size={14} className="text-amber-400" />
          <span className="text-amber-400 text-sm font-black">{score}</span>
        </div>
        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 px-3 py-2">
          <Zap size={14} className="text-indigo-400" />
          <span className="text-white text-sm font-black">
            {treasuresCollected}/{totalTreasures}
          </span>
        </div>
        <button
          onClick={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            initGame();
          }}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 px-3 py-2 transition-all"
        >
          <RotateCcw size={14} className="text-indigo-300/60" />
        </button>
      </div>

      {/* Game Grid */}
      <div
        ref={gridRef}
        className="w-full max-w-md aspect-square bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-3 shadow-xl shadow-indigo-900/20 touch-none select-none"
        style={{ touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={(e) => e.preventDefault()}
      >
        <div
          className="grid gap-1 w-full h-full"
          style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)`, gridTemplateRows: `repeat(${GRID}, 1fr)` }}
        >
          {Array.from({ length: GRID * GRID }, (_, i) => {
            const row = Math.floor(i / GRID);
            const col = i % GRID;
            const cell = is(row, col);
            const isDanger = showDangerZones && dangerNeighbors.has(`${row},${col}`);

            return (
              <div
                key={`${row}-${col}`}
                className={cn(
                  'rounded-lg flex items-center justify-center relative transition-all duration-150',
                  cell?.type === 'empty' && !isDanger && 'bg-white/5',
                  isDanger && cell?.type === 'empty' && 'bg-red-900/20 border border-red-500/20',
                  cell?.type === 'treasure' && 'bg-amber-900/30 ring-1 ring-amber-400/60',
                  cell?.type === 'player' && 'bg-indigo-600/30 ring-2 ring-indigo-400/80',
                  cell?.type === 'enemy' && 'bg-red-900/40 ring-1 ring-red-500/60',
                )}
              >
                {(cell?.type === 'player' || cell?.type === 'enemy' || cell?.type === 'treasure') && cell.cardId > 0 && (
                  <div
                    className="w-full h-full bg-contain bg-center bg-no-repeat"
                    style={{
                      ...getCardSpriteStyle(cell.cardId),
                      filter: cell.type === 'treasure'
                        ? 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.6)) brightness(1.2)'
                        : cell.type === 'enemy'
                          ? 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.5)) brightness(0.9)'
                          : 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.7)) brightness(1.1)',
                    }}
                  />
                )}
                {cell?.type === 'treasure' && !lowSpecMode && (
                  <div className="absolute inset-0 rounded-lg animate-pulse bg-amber-400/10" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Touch hint */}
      <p className="text-[10px] font-bold text-indigo-300/40 text-center mt-2 tracking-wide">
        {language === 'ko' ? '스와이프 또는 방향키로 이동 · 적을 피해 보물을 수집하세요!' : 'Swipe or arrow keys to move · Avoid enemies and collect treasures!'}
      </p>

      {/* Swipe Direction Indicator */}
      {swipeDir && (
        <div className={cn(
          'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none',
          'bg-indigo-600/80 backdrop-blur-sm text-white px-6 py-3 rounded-2xl',
          'font-black text-xl tracking-wider uppercase shadow-2xl',
          'animate-in fade-in zoom-in duration-150'
        )}>
          {swipeDir === 'up' && '▲'}
          {swipeDir === 'down' && '▼'}
          {swipeDir === 'left' && '◀'}
          {swipeDir === 'right' && '▶'}
        </div>
      )}

      {/* Game Over / Win Overlay */}
      {isGameOver && (
        <div className="fixed inset-0 z-[11000] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-lg pointer-events-auto">
          <div className={cn(
            'w-64 p-6 rounded-2xl border shadow-2xl text-center',
            isWin
              ? 'bg-white/5 backdrop-blur-sm border-amber-400/30'
              : 'bg-white/5 backdrop-blur-sm border-red-500/30'
          )}>
            <div className={cn(
              'w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4',
              isWin ? 'bg-amber-400/20' : 'bg-red-500/20'
            )}>
              {isWin
                ? <Trophy size={32} className="text-amber-400" />
                : <Shield size={32} className="text-red-400" />
              }
            </div>
            <h2 className={cn(
              'text-xl font-black tracking-wider mb-2',
              isWin ? 'text-amber-400' : 'text-red-400'
            )}>
              {isWin
                ? (language === 'ko' ? '탈출 성공!' : 'ESCAPED!')
                : (language === 'ko' ? '발각됨!' : 'CAUGHT!')
              }
            </h2>
            <p className="text-indigo-300/60 text-sm mb-4">
              {language === 'ko'
                ? `보물 ${treasuresCollected}개 수집 · ${moves}회 이동`
                : `${treasuresCollected} treasures · ${moves} moves`
              }
            </p>
            <div className="flex items-center gap-1 justify-center mb-4">
              <Trophy size={14} className="text-amber-400" />
              <span className="text-amber-400 text-2xl font-black">+{isWin ? (level * 50 + treasuresCollected * 30 + Math.max(0, 100 - moves)) : Math.floor(treasuresCollected * 15)}</span>
              <span className="text-indigo-300/60 text-xs ml-1">SNS</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  if (isWin) setLevel(prev => Math.min(prev + 1, 5));
                  initGame();
                }}
                className={cn(
                  'w-full py-2.5 rounded-xl font-black text-sm tracking-wider transition-all',
                  isWin
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                )}
              >
                {isWin
                  ? (language === 'ko' ? '다음 레벨' : 'NEXT LEVEL')
                  : (language === 'ko' ? '재도전' : 'RETRY')
                }
              </button>
              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  onExit();
                }}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-black text-sm tracking-wider border border-white/10 transition-all"
              >
                {language === 'ko' ? '나가기' : 'EXIT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Controls Hint */}
      <p className="text-[10px] text-indigo-300/40 font-semibold tracking-wider text-center">
        {language === 'ko'
          ? '스와이프 또는 방향키로 이동 · 적을 피해 보물을 수집하세요!'
          : 'SWIPE or ARROW KEYS to move · Avoid enemies & collect treasures!'
        }
      </p>
    </div>
  );
};
