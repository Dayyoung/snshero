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
    const total = isWin 
      ? Math.min(60, 20 + level * 5 + treasuresCollected * 4)
      : Math.min(20, 5 + treasuresCollected * 3);
    onReward(Math.max(total, 5));
  }, [level, treasuresCollected, isWin, onReward]);

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
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between select-none font-mono bg-[#0f1117] text-slate-100 p-2 sm:p-4">
      <div className="w-full max-w-md mx-auto flex flex-col h-full justify-between gap-1 sm:gap-2">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 shrink-0">
          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              onExit();
            }}
            className="inline-flex items-center gap-1.5 rounded-sm bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-mono text-white tracking-wider hover:bg-white/10 transition-colors min-h-[44px]"
          >
            <ArrowLeft size={14} />
            <span>[ {language === 'ko' ? '뒤로' : 'BACK'} ]</span>
          </button>
          <div className="text-xs sm:text-sm font-mono font-bold tracking-wider text-amber-400 uppercase">
            [{t('mode_cardheist', language)}]
          </div>
          <button
            onClick={() => setShowDangerZones(!showDangerZones)}
            className="inline-flex items-center gap-1.5 rounded-sm bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-mono text-white tracking-wider hover:bg-white/10 transition-colors min-h-[44px]"
            title={showDangerZones ? 'Hide danger zones' : 'Show danger zones'}
          >
            {showDangerZones ? <EyeOff size={14} className="text-amber-400" /> : <Eye size={14} className="text-slate-400" />}
            <span className="text-[10px]">{showDangerZones ? '[ON]' : '[OFF]'}</span>
          </button>
        </div>

        {/* Top Status Bar */}
        <div className="grid grid-cols-4 gap-1.5 text-center shrink-0 border border-white/10 bg-white/5 p-1.5 rounded-none text-xs">
          <div>
            <div className="text-[10px] text-slate-400">{language === 'ko' ? '레벨' : 'LVL'}</div>
            <div className="font-bold text-amber-400">LV.{level}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">{language === 'ko' ? '보물' : 'TREASURE'}</div>
            <div className="font-bold text-slate-100">{treasuresCollected}/{totalTreasures}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">{language === 'ko' ? '이동' : 'MOVES'}</div>
            <div className="font-bold text-slate-100">{moves}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">{language === 'ko' ? '보상' : 'REWARD'}</div>
            <div className="font-bold text-amber-400">{isWin ? Math.min(60, 20 + level * 5 + treasuresCollected * 4) : Math.min(20, 5 + treasuresCollected * 3)} SNS</div>
          </div>
        </div>

        {/* Game Grid */}
        <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden">
          <div
            ref={gridRef}
            className="w-full max-w-[340px] aspect-square bg-black/40 border border-white/10 p-1 relative overflow-hidden touch-none select-none"
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
                      'rounded-sm flex items-center justify-center relative transition-all duration-100 border',
                      cell?.type === 'empty' && !isDanger && 'bg-slate-900/60 border-white/5',
                      isDanger && cell?.type === 'empty' && 'bg-red-950/40 border-red-500/30',
                      cell?.type === 'treasure' && 'bg-amber-950/40 border-amber-400/60',
                      cell?.type === 'player' && 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400',
                      cell?.type === 'enemy' && 'bg-red-950/60 border-red-500/60',
                    )}
                  >
                    {(cell?.type === 'player' || cell?.type === 'enemy' || cell?.type === 'treasure') && cell.cardId > 0 && (
                      <div
                        className="w-full h-full bg-contain bg-center bg-no-repeat p-0.5"
                        style={getCardSpriteStyle(cell.cardId)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile One-Handed D-Pad */}
        <div className="shrink-0 flex flex-col items-center gap-1 select-none pb-1">
          <button
            type="button"
            onClick={() => movePlayer('up')}
            className="w-14 h-11 rounded-sm bg-white/10 active:bg-amber-500/30 border border-white/20 flex items-center justify-center text-sm font-mono text-white active:scale-95 touch-manipulation min-h-[44px]"
            aria-label="Up"
          >
            ▲
          </button>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => movePlayer('left')}
              className="w-14 h-11 rounded-sm bg-white/10 active:bg-amber-500/30 border border-white/20 flex items-center justify-center text-sm font-mono text-white active:scale-95 touch-manipulation min-h-[44px]"
              aria-label="Left"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => movePlayer('down')}
              className="w-14 h-11 rounded-sm bg-white/10 active:bg-amber-500/30 border border-white/20 flex items-center justify-center text-sm font-mono text-white active:scale-95 touch-manipulation min-h-[44px]"
              aria-label="Down"
            >
              ▼
            </button>
            <button
              type="button"
              onClick={() => movePlayer('right')}
              className="w-14 h-11 rounded-sm bg-white/10 active:bg-amber-500/30 border border-white/20 flex items-center justify-center text-sm font-mono text-white active:scale-95 touch-manipulation min-h-[44px]"
              aria-label="Right"
            >
              ▶
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center font-mono">
            {language === 'ko' ? 'D-패드 터치 또는 화면 스와이프로 1손 조작' : 'D-Pad or swipe to move'}
          </p>
        </div>

        {/* Swipe Direction Indicator */}
        {swipeDir && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none bg-slate-900 border border-amber-400 text-amber-300 px-4 py-2 font-mono text-lg font-bold">
            [{swipeDir === 'up' && '▲'}{swipeDir === 'down' && '▼'}{swipeDir === 'left' && '◀'}{swipeDir === 'right' && '▶'}]
          </div>
        )}

        {/* Game Over / Win Overlay */}
        {isGameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
            <div className={cn(
              'w-full max-w-xs p-5 border text-center rounded-none bg-slate-900',
              isWin ? 'border-amber-400' : 'border-red-500'
            )}>
              <h2 className={cn(
                'text-base font-bold tracking-wider mb-2 uppercase',
                isWin ? 'text-amber-400' : 'text-red-400'
              )}>
                {isWin
                  ? (language === 'ko' ? '[ 탈출 성공! ]' : '[ ESCAPED! ]')
                  : (language === 'ko' ? '[ 적에게 발각됨! ]' : '[ CAUGHT! ]')
                }
              </h2>
              <p className="text-slate-300 text-xs mb-2">
                {language === 'ko'
                  ? `보물 ${treasuresCollected}개 수집 · ${moves}회 이동`
                  : `${treasuresCollected} treasures · ${moves} moves`
                }
              </p>
              <div className="text-amber-400 text-sm font-bold mb-4">
                +{isWin ? Math.min(60, 20 + level * 5 + treasuresCollected * 4) : Math.min(20, 5 + treasuresCollected * 3)} SNS
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    if (isWin) setLevel(prev => Math.min(prev + 1, 5));
                    initGame();
                  }}
                  className="flex-1 py-2.5 rounded-sm font-bold text-xs bg-amber-500 text-slate-950 hover:bg-amber-400 min-h-[44px]"
                >
                  {isWin
                    ? (language === 'ko' ? '다음 레벨' : 'NEXT')
                    : (language === 'ko' ? '재도전' : 'RETRY')
                  }
                </button>
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    onExit();
                  }}
                  className="flex-1 py-2.5 rounded-sm bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 min-h-[44px]"
                >
                  {language === 'ko' ? '나가기' : 'EXIT'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
