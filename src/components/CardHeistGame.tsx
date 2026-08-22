import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MobileSafeAreaHUD } from './MobileSafeAreaHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { get2DGameTutorialSteps } from '../lib/mission2DCardTutorialEngine';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';
import { Eye, EyeOff } from 'lucide-react';

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

export const CardHeistGame: React.FC<CardHeistGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
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
  const [isPaused, setIsPaused] = useState(false);
  const [showDangerZones, setShowDangerZones] = useState(false);
  const [swipeDir, setSwipeDir] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_2d_card_heist') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const rewardedRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());

  const playerCardId = deck[0]?.imageIndex || deck[0]?.id as number || 1;

  const getEnemyPatrolCards = useCallback(() => {
    const enemies: number[] = [];
    const pools: Record<number, number[]> = {
      1: [51, 52, 53, 54, 55],
      2: [81, 82, 83, 84, 85],
      3: [91, 92, 93, 94, 95, 96],
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
    const treasurePool = [106, 107, 108, 109, 110];
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

    const enemyCardIds = getEnemyPatrolCards();
    enemyCardIds.forEach((cardId, i) => {
      const row = 2 + i;
      const col = i % 2 === 0 ? 1 : GRID - 2;
      if (row < GRID - 1) {
        newGrid[row][col] = {
          type: 'enemy',
          cardId,
          patrolDir: i % 2 === 0 ? 'right' : 'left',
          patrolStep: 0,
        };
      }
    });

    const treasureCardIds = getTreasureCards();
    let placedTreasures = 0;
    treasureCardIds.forEach((cardId, i) => {
      const row = i % 2 === 0 ? 0 : 1;
      const col = 1 + i * 2;
      if (col < GRID && newGrid[row][col].type === 'empty') {
        newGrid[row][col] = { type: 'treasure', cardId };
        placedTreasures++;
      }
    });

    setGrid(newGrid);
    setPlayerPos({ row: playerRow, col: playerCol });
    setTreasuresCollected(0);
    setTotalTreasures(placedTreasures);
    setMoves(0);
    setIsGameOver(false);
    setIsWin(false);
    setSettlementReceipt(null);
    rewardedRef.current = false;
    startTimeRef.current = Date.now();
  }, [playerCardId, getEnemyPatrolCards, getTreasureCards]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const getDangerNeighbors = useCallback((g: GridCell[][]) => {
    const danger = new Set<string>();
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (g[r]?.[c]?.type === 'enemy') {
          const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          dirs.forEach(([dr, dc]) => {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < GRID && nc >= 0 && nc < GRID) {
              danger.add(`${nr},${nc}`);
            }
          });
        }
      }
    }
    return danger;
  }, []);

  const moveEnemies = useCallback((currentGrid: GridCell[][]): GridCell[][] => {
    const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
    const enemyPositions: { row: number; col: number; cell: GridCell }[] = [];

    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (newGrid[r][c].type === 'enemy') {
          enemyPositions.push({ row: r, col: c, cell: newGrid[r][c] });
          newGrid[r][c] = { type: 'empty', cardId: 0 };
        }
      }
    }

    for (const { row, col, cell } of enemyPositions) {
      let dir = cell.patrolDir || 'right';
      let dc = dir === 'right' ? 1 : -1;
      let nc = col + dc;

      if (nc < 0 || nc >= GRID || newGrid[row][nc].type === 'treasure') {
        dir = dir === 'right' ? 'left' : 'right';
        dc = dir === 'right' ? 1 : -1;
        nc = col + dc;
      }

      if (nc >= 0 && nc < GRID && newGrid[row][nc].type !== 'treasure') {
        newGrid[row][nc] = { ...cell, patrolDir: dir };
      } else {
        newGrid[row][col] = { ...cell, patrolDir: dir };
      }
    }
    return newGrid;
  }, []);

  const triggerSettlement = useCallback((win: boolean, finalTreasures: number, finalMoves: number) => {
    if (rewardedRef.current) return;
    rewardedRef.current = true;

    const durationSeconds = Math.max(10, Math.round((Date.now() - startTimeRef.current) / 1000));
    const calculatedScore = win
      ? 1000 + finalTreasures * 200 - finalMoves * 10
      : finalTreasures * 150;

    const receipt = calculateAndDepositMissionReward({
      gameId: 'card_heist',
      gameTitle: isKo ? '2D 카드 하이스트 탈출' : '2D Card Heist Infiltration',
      durationSeconds,
      score: Math.max(100, calculatedScore),
      maxTargetScore: 1600,
      isVictory: win,
      difficulty: level >= 3 ? 'NIGHTMARE' : level >= 2 ? 'HARD' : 'NORMAL',
      comboCount: finalTreasures,
      perfectClear: win && finalTreasures >= totalTreasures && finalMoves <= 20,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  }, [isKo, level, totalTreasures, onReward]);

  const movePlayer = useCallback((dr: number, dc: number) => {
    if (isGameOver || isPaused || showTutorial) return;

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
        newGrid[nr][nc] = { type: 'player', cardId: playerCardId };
        newGrid[row][col] = { type: 'empty', cardId: 0 };
        setPlayerPos({ row: nr, col: nc });
        setIsGameOver(true);
        setIsWin(false);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
        triggerSettlement(false, treasuresCollected, moves + 1);
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
          triggerSettlement(true, newTreasures, moves + 1);
        }
        return newGrid;
      }

      newGrid[nr][nc] = { type: 'player', cardId: playerCardId };
      newGrid[row][col] = { type: 'empty', cardId: 0 };
      setPlayerPos({ row: nr, col: nc });
      setMoves(prev => prev + 1);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      const gridAfterEnemies = moveEnemies(newGrid);

      const { row: pr, col: pc } = { row: nr, col: nc };
      if (gridAfterEnemies[pr][pc].type === 'enemy') {
        setIsGameOver(true);
        setIsWin(false);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
        triggerSettlement(false, treasuresCollected, moves + 1);
      }

      return gridAfterEnemies;
    });
  }, [playerPos, playerCardId, treasuresCollected, totalTreasures, level, moves, moveEnemies, playSfx, isGameOver, isPaused, showTutorial, triggerSettlement]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || isGameOver || isPaused || showTutorial) return;
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
  }, [movePlayer, isGameOver, isPaused, showTutorial]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isGameOver || isPaused || showTutorial) return;
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
  }, [movePlayer, isGameOver, isPaused, showTutorial]);

  const dangerNeighbors = getDangerNeighbors(grid);
  const is = (row: number, col: number) => grid[row]?.[col];
  const tutorialSteps = get2DGameTutorialSteps('card_heist', isKo);

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#0f1117] text-slate-100 flex flex-col justify-between font-mono select-none w-full overflow-hidden">
      {/* Top Safe Area HUD */}
      <MobileSafeAreaHUD
        gameTitle={isKo ? '카드 하이스트 탈출' : 'Card Heist Infiltration'}
        score={isWin ? 1000 + treasuresCollected * 100 : treasuresCollected * 80}
        customMetricLabel={isKo ? '보물' : 'Treasure'}
        customMetricValue={`${treasuresCollected}/${totalTreasures}`}
        isPaused={isPaused}
        language={language}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onTogglePause={() => setIsPaused(prev => !prev)}
      />

      {/* Info Status Bar */}
      <div className="w-full max-w-md mx-auto px-3 flex items-center justify-between text-xs py-1 bg-white/5 border border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">
            LV.<span className="text-amber-400 font-bold">{level}</span>
          </span>
          <span className="text-slate-400">
            {isKo ? '이동' : 'MOVES'}: <span className="text-white font-bold">{moves}</span>
          </span>
        </div>
        <button
          onClick={() => setShowDangerZones(!showDangerZones)}
          className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 hover:text-amber-300 transition-colors"
        >
          {showDangerZones ? <EyeOff size={13} /> : <Eye size={13} />}
          <span>{showDangerZones ? (isKo ? '[위험구역 ON]' : '[DANGER ON]') : (isKo ? '[위험구역 OFF]' : '[DANGER OFF]')}</span>
        </button>
      </div>

      {/* Swipe Direction Indicator */}
      {swipeDir && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-sm text-xs font-mono font-bold bg-amber-500 text-slate-950 shadow-md">
          {swipeDir === 'up' && '▲ UP'}
          {swipeDir === 'down' && '▼ DOWN'}
          {swipeDir === 'left' && '◀ LEFT'}
          {swipeDir === 'right' && '▶ RIGHT'}
        </div>
      )}

      {/* Game Grid Viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2">
        <div
          ref={gridRef}
          className="w-full max-w-[340px] aspect-square bg-black/40 border border-white/10 p-1 relative overflow-hidden touch-none select-none"
          style={{ touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={e => e.preventDefault()}
        >
          <div
            className="grid gap-1 w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${GRID}, 1fr)`,
              gridTemplateRows: `repeat(${GRID}, 1fr)`,
            }}
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
                    cell?.type === 'enemy' && 'bg-red-950/60 border-red-500/60'
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
      <div className="shrink-0 flex flex-col items-center gap-1 select-none pb-2">
        <button
          type="button"
          onClick={() => movePlayer(-1, 0)}
          className="w-14 h-11 rounded-sm bg-white/10 active:bg-amber-500/30 border border-white/20 flex items-center justify-center text-sm font-mono text-white active:scale-95 touch-manipulation min-h-[44px]"
          aria-label="Move Up"
        >
          ▲
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => movePlayer(0, -1)}
            className="w-14 h-11 rounded-sm bg-white/10 active:bg-amber-500/30 border border-white/20 flex items-center justify-center text-sm font-mono text-white active:scale-95 touch-manipulation min-h-[44px]"
            aria-label="Move Left"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => movePlayer(1, 0)}
            className="w-14 h-11 rounded-sm bg-white/10 active:bg-amber-500/30 border border-white/20 flex items-center justify-center text-sm font-mono text-white active:scale-95 touch-manipulation min-h-[44px]"
            aria-label="Move Down"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => movePlayer(0, 1)}
            className="w-14 h-11 rounded-sm bg-white/10 active:bg-amber-500/30 border border-white/20 flex items-center justify-center text-sm font-mono text-white active:scale-95 touch-manipulation min-h-[44px]"
            aria-label="Move Right"
          >
            ▶
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center font-mono">
          {isKo ? 'D-패드 터치 또는 화면 스와이프로 1손 조작' : 'D-Pad or swipe to move'}
        </p>
      </div>

      {/* 2D Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="2d_card_heist"
          gameTitle={isKo ? '2D 카드 하이스트 탈출' : '2D Card Heist Infiltration'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory / Defeat Reward Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={() => {
            if (isWin) setLevel(prev => Math.min(prev + 1, 5));
            initGame();
          }}
          onExit={onExit}
        />
      )}
    </div>
  );
};
