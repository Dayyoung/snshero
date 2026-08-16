import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Zap, Shield, Navigation } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn, getAssetUrl, getCardSpriteStyle } from '../lib/utils';

interface CardRushGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';
type CellKind = 'empty' | 'player' | 'ally' | 'enemy' | 'gate';

interface Cell {
  kind: CellKind;
  cardId: number;
  backgroundCardId: number;
}

interface Position {
  row: number;
  col: number;
}

const SWIPE_THRESHOLD = 15;
const FAST_SWIPE_MS = 200;
const CARD_POOL = Object.keys(CARD_DATABASE)
  .map(Number)
  .filter((id) => Number.isFinite(id) && id > 0);

const getValidCardId = (card?: CardData | null): number => {
  const imageIndex = card?.imageIndex;
  if (typeof imageIndex === 'number' && imageIndex > 0) return imageIndex;
  const parsed = Number(card?.id ?? NaN);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 1;
};

const pickRandomCardId = (exclude = new Set<number>()): number => {
  const available = CARD_POOL.filter((id) => !exclude.has(id));
  const pool = available.length > 0 ? available : CARD_POOL;
  return pool[Math.floor(Math.random() * pool.length)] || 1;
};

const createCell = (backgroundCardId: number, kind: CellKind = 'empty', cardId = backgroundCardId): Cell => ({
  kind,
  cardId,
  backgroundCardId,
});

export const CardRushGame: React.FC<CardRushGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const boardSize = lowSpecMode ? 5 : 6;
  const allyTargetCount = lowSpecMode ? 2 : 3;
  const enemyCount = lowSpecMode ? 2 : 3;

  const heroCardId = useMemo(() => getValidCardId(deck[0]), [deck]);
  const allyCardIds = useMemo(() => {
    const used = new Set<number>([heroCardId]);
    const ids: number[] = [];
    for (let i = 1; i < deck.length && ids.length < allyTargetCount; i += 1) {
      const id = getValidCardId(deck[i]);
      if (!used.has(id)) {
        used.add(id);
        ids.push(id);
      }
    }
    while (ids.length < allyTargetCount) {
      const fallback = pickRandomCardId(used);
      used.add(fallback);
      ids.push(fallback);
    }
    return ids;
  }, [deck, heroCardId, allyTargetCount]);

  const [board, setBoard] = useState<Cell[][]>(() => []);
  const [playerPos, setPlayerPos] = useState<Position>({ row: boardSize - 1, col: Math.floor(boardSize / 2) });
  const [collected, setCollected] = useState(0);
  const [turns, setTurns] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [swipeHint, setSwipeHint] = useState<Direction | null>(null);
  const [statusText, setStatusText] = useState<string>('');
  const [defeatCountdown, setDefeatCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (isGameOver && !isWin) {
      setDefeatCountdown(5);
    } else {
      setDefeatCountdown(null);
    }
  }, [isGameOver, isWin]);

  useEffect(() => {
    if (defeatCountdown === null) return;
    if (defeatCountdown <= 0) {
      setDefeatCountdown(null);
      onExit();
      return;
    }
    const timer = setTimeout(() => {
      setDefeatCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [defeatCountdown, onExit]);

  const rewardedRef = useRef(false);
  const boardRef = useRef<Cell[][]>([]);
  const playerPosRef = useRef<Position>(playerPos);
  const collectedRef = useRef(0);
  const turnsRef = useRef(0);
  const gateOpenRef = useRef(false);
  const isGameOverRef = useRef(false);
  const isWinRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const statusTimerRef = useRef<number | null>(null);

  const clearStatusTimer = useCallback(() => {
    if (statusTimerRef.current) {
      window.clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  }, []);

  const showStatus = useCallback((message: string) => {
    clearStatusTimer();
    setStatusText(message);
    statusTimerRef.current = window.setTimeout(() => setStatusText(''), 1000);
  }, [clearStatusTimer]);

  const buildBoard = useCallback(() => {
    const newBoard: Cell[][] = Array.from({ length: boardSize }, (_, row) =>
      Array.from({ length: boardSize }, (_, col) => {
        const backgroundCardId = CARD_POOL[(row * boardSize + col) % CARD_POOL.length] || 1;
        return createCell(backgroundCardId);
      })
    );

    const occupied = new Set<string>();
    const placeCell = (pos: Position, kind: CellKind, cardId: number) => {
      occupied.add(`${pos.row},${pos.col}`);
      newBoard[pos.row][pos.col] = createCell(newBoard[pos.row][pos.col].backgroundCardId, kind, cardId);
    };

    const findSpot = (avoid: Position[] = []): Position => {
      for (let i = 0; i < 200; i += 1) {
        const row = Math.floor(Math.random() * boardSize);
        const col = Math.floor(Math.random() * boardSize);
        const key = `${row},${col}`;
        const tooClose = avoid.some((pos) => Math.abs(pos.row - row) + Math.abs(pos.col - col) <= 1);
        if (!occupied.has(key) && !tooClose) {
          return { row, col };
        }
      }
      for (let row = 0; row < boardSize; row += 1) {
        for (let col = 0; col < boardSize; col += 1) {
          const key = `${row},${col}`;
          const tooClose = avoid.some((pos) => Math.abs(pos.row - row) + Math.abs(pos.col - col) <= 1);
          if (!occupied.has(key) && !tooClose) {
            return { row, col };
          }
        }
      }
      return { row: 1, col: 1 };
    };

    const playerStart = { row: boardSize - 1, col: Math.floor(boardSize / 2) };
    const gatePos = { row: 0, col: Math.floor(boardSize / 2) };
    placeCell(playerStart, 'player', heroCardId);
    placeCell(gatePos, 'gate', pickRandomCardId(new Set([heroCardId])));

    allyCardIds.forEach((cardId) => {
      const pos = findSpot([playerStart, gatePos]);
      placeCell(pos, 'ally', cardId);
    });

    const usedForEnemies = new Set<number>([heroCardId, ...allyCardIds]);
    for (let i = 0; i < enemyCount; i += 1) {
      const pos = findSpot([playerStart, gatePos]);
      const enemyCardId = pickRandomCardId(usedForEnemies);
      usedForEnemies.add(enemyCardId);
      placeCell(pos, 'enemy', enemyCardId);
    }

    boardRef.current = newBoard;
    playerPosRef.current = playerStart;
    setBoard(newBoard);
    setPlayerPos(playerStart);
    setCollected(0);
    setTurns(0);
    setGateOpen(false);
    setIsGameOver(false);
    setIsWin(false);
    setSwipeHint(null);
    setStatusText('');
    collectedRef.current = 0;
    turnsRef.current = 0;
    gateOpenRef.current = false;
    isGameOverRef.current = false;
    isWinRef.current = false;
    rewardedRef.current = false;
  }, [allyCardIds, boardSize, enemyCount, heroCardId]);

  useEffect(() => {
    buildBoard();
    return () => clearStatusTimer();
  }, [buildBoard, clearStatusTimer]);

  const finalizeWin = useCallback((nextTurns: number, nextCollected: number) => {
    if (rewardedRef.current) return;
    rewardedRef.current = true;
    const reward = Math.min(60, Math.max(15, 25 + nextCollected * 10 - Math.floor(nextTurns * 0.5)));
    onReward(reward);
    setIsGameOver(true);
    setIsWin(true);
    isGameOverRef.current = true;
    isWinRef.current = true;
    showStatus(language === 'ko' ? '[게이트 탈출 성공!]' : '[Gate escape success!]');
    playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
  }, [language, onReward, playSfx, showStatus]);

  const finalizeLoss = useCallback(() => {
    setIsGameOver(true);
    setIsWin(false);
    isGameOverRef.current = true;
    isWinRef.current = false;
    showStatus(language === 'ko' ? '적 카드에 붙잡혔습니다.' : 'Captured by rogue cards!');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
  }, [language, playSfx, showStatus]);

  const moveEnemies = useCallback((currentBoard: Cell[][], nextPlayerPos: Position) => {
    const nextBoard = currentBoard.map((row) => row.map((cell) => ({ ...cell })));
    const enemyPositions: Array<{ pos: Position; cardId: number }> = [];

    for (let row = 0; row < boardSize; row += 1) {
      for (let col = 0; col < boardSize; col += 1) {
        const cell = nextBoard[row][col];
        if (cell.kind === 'enemy') {
          enemyPositions.push({ pos: { row, col }, cardId: cell.cardId });
        }
      }
    }

    for (const enemy of enemyPositions) {
      const { row, col } = enemy.pos;
      if (nextBoard[row]?.[col]?.kind !== 'enemy') continue;

      const dx = nextPlayerPos.col - col;
      const dy = nextPlayerPos.row - row;
      const options: Direction[] = [];
      if (Math.abs(dx) >= Math.abs(dy)) {
        options.push(dx > 0 ? 'right' : 'left');
        options.push(dy > 0 ? 'down' : 'up');
      } else {
        options.push(dy > 0 ? 'down' : 'up');
        options.push(dx > 0 ? 'right' : 'left');
      }
      options.push('left', 'right', 'up', 'down');

      let moved = false;
      for (const dir of options) {
        let nr = row;
        let nc = col;
        if (dir === 'up') nr -= 1;
        if (dir === 'down') nr += 1;
        if (dir === 'left') nc -= 1;
        if (dir === 'right') nc += 1;

        if (nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) continue;
        const target = nextBoard[nr][nc];
        if (target.kind === 'player') {
          return { board: nextBoard, hitPlayer: true };
        }
        if (target.kind !== 'empty') continue;

        nextBoard[nr][nc] = { ...nextBoard[row][col] };
        nextBoard[row][col] = createCell(nextBoard[row][col].backgroundCardId);
        moved = true;
        break;
      }

      if (!moved) {
        continue;
      }
    }

    return { board: nextBoard, hitPlayer: false };
  }, [boardSize]);

  const movePlayer = useCallback((direction: Direction) => {
    if (isGameOverRef.current) return;

    const delta = {
      up: { row: -1, col: 0 },
      down: { row: 1, col: 0 },
      left: { row: 0, col: -1 },
      right: { row: 0, col: 1 },
    }[direction];

    const currentPos = playerPosRef.current;
    const nextPos = { row: currentPos.row + delta.row, col: currentPos.col + delta.col };
    if (nextPos.row < 0 || nextPos.row >= boardSize || nextPos.col < 0 || nextPos.col >= boardSize) {
      showStatus(language === 'ko' ? '이동할 수 없습니다.' : 'Cannot move there.');
      playSfx('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
      return;
    }

    const currentBoard = boardRef.current.map((row) => row.map((cell) => ({ ...cell })));
    const currentCell = currentBoard[currentPos.row][currentPos.col];
    const targetCell = currentBoard[nextPos.row][nextPos.col];

    if (targetCell.kind === 'enemy') {
      boardRef.current = currentBoard;
      setBoard(currentBoard);
      finalizeLoss();
      return;
    }

    if (targetCell.kind === 'gate' && !gateOpenRef.current) {
      showStatus(language === 'ko' ? '게이트가 잠겨 있습니다.' : 'The gate is locked.');
      playSfx('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
      return;
    }

    currentBoard[currentPos.row][currentPos.col] = createCell(currentCell.backgroundCardId);
    currentBoard[nextPos.row][nextPos.col] = createCell(targetCell.backgroundCardId, 'player', heroCardId);

    let nextCollected = collectedRef.current;
    let nextGateOpen = gateOpenRef.current;
    const wasGateOpen = gateOpenRef.current;
    let nextTurns = turnsRef.current + 1;
    let nextMessage = '';

    if (targetCell.kind === 'ally') {
      nextCollected += 1;
      nextGateOpen = nextCollected >= allyTargetCount;
      nextMessage = language === 'ko' ? '동료 카드를 구출했습니다!' : 'Ally card rescued!';
      playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    } else {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }

    const enemyStep = moveEnemies(currentBoard, nextPos);
    const postEnemyBoard = enemyStep.board;

    if (enemyStep.hitPlayer) {
      boardRef.current = postEnemyBoard;
      setBoard(postEnemyBoard);
      playerPosRef.current = nextPos;
      setPlayerPos(nextPos);
      setCollected(nextCollected);
      setTurns(nextTurns);
      setGateOpen(nextGateOpen);
      collectedRef.current = nextCollected;
      turnsRef.current = nextTurns;
      gateOpenRef.current = nextGateOpen;
      finalizeLoss();
      return;
    }

    if (nextGateOpen && targetCell.kind === 'gate') {
      boardRef.current = postEnemyBoard;
      setBoard(postEnemyBoard);
      playerPosRef.current = nextPos;
      setPlayerPos(nextPos);
      setCollected(nextCollected);
      setTurns(nextTurns);
      setGateOpen(nextGateOpen);
      collectedRef.current = nextCollected;
      turnsRef.current = nextTurns;
      gateOpenRef.current = nextGateOpen;
      finalizeWin(nextTurns, nextCollected);
      return;
    }

    boardRef.current = postEnemyBoard;
    playerPosRef.current = nextPos;
    collectedRef.current = nextCollected;
    turnsRef.current = nextTurns;
    gateOpenRef.current = nextGateOpen;
    setBoard(postEnemyBoard);
    setPlayerPos(nextPos);
    setCollected(nextCollected);
    setTurns(nextTurns);
    setGateOpen(nextGateOpen);

    if (nextMessage) showStatus(nextMessage);
    if (nextGateOpen && !wasGateOpen) {
      showStatus(language === 'ko' ? '게이트가 열렸습니다!' : 'The gate opened!');
    }
  }, [allyTargetCount, boardSize, finalizeLoss, finalizeWin, heroCardId, language, moveEnemies, playSfx, showStatus]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.defaultPrevented) return;
    const key = event.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(key)) {
      event.preventDefault();
      const direction =
        key === 'ArrowUp' || key === 'w' || key === 'W' ? 'up'
          : key === 'ArrowDown' || key === 's' || key === 'S' ? 'down'
          : key === 'ArrowLeft' || key === 'a' || key === 'A' ? 'left'
            : 'right';
      movePlayer(direction);
    }
  }, [movePlayer]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown as EventListener);
  }, [handleKeyDown]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    setSwipeHint(null);
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    const start = touchStartRef.current;
    if (!start) return;
    const touch = event.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const threshold = (Date.now() - start.time) < FAST_SWIPE_MS ? SWIPE_THRESHOLD * 0.6 : SWIPE_THRESHOLD;

    if (absDx < threshold && absDy < threshold) {
      setSwipeHint(null);
      return;
    }

    if (absDx > absDy) {
      setSwipeHint(dx > 0 ? 'right' : 'left');
    } else {
      setSwipeHint(dy > 0 ? 'down' : 'up');
    }
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const elapsed = Date.now() - start.time;
    const threshold = elapsed < FAST_SWIPE_MS ? SWIPE_THRESHOLD * 0.6 : SWIPE_THRESHOLD;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    setSwipeHint(null);

    if (Math.max(absDx, absDy) < threshold) return;

    if (absDx > absDy) {
      movePlayer(dx > 0 ? 'right' : 'left');
    } else {
      movePlayer(dy > 0 ? 'down' : 'up');
    }
  }, [movePlayer]);

  const restartGame = useCallback(() => {
    buildBoard();
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  }, [buildBoard, playSfx]);

  const boardStatus = gateOpen
    ? (language === 'ko' ? '게이트 개방 완료' : 'Gate unlocked')
    : (language === 'ko' ? '동료 카드 구출 중' : 'Rescue ally cards');

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between select-none font-mono bg-[#0f1117] text-slate-100 p-2 sm:p-4">
      <div className="w-full max-w-4xl mx-auto flex flex-col h-full justify-between gap-1 sm:gap-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 shrink-0">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1.5 rounded-sm bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-mono tracking-wider hover:bg-white/10 transition-colors min-h-[44px]"
          >
            <ArrowLeft size={14} />
            <span>[ {language === 'ko' ? '뒤로' : 'BACK'} ]</span>
          </button>
          <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold tracking-wider text-xs sm:text-sm">
            <Navigation size={14} />
            <span>[{t('mode_cardrush', language)}]</span>
          </div>
          <button
            onClick={restartGame}
            className="inline-flex items-center gap-1.5 rounded-sm bg-amber-500/10 border border-amber-400/30 px-3 py-1.5 text-xs font-mono text-amber-300 tracking-wider hover:bg-amber-500/20 transition-colors min-h-[44px]"
          >
            <RotateCcw size={14} />
            <span>[ {language === 'ko' ? '재시작' : 'RETRY'} ]</span>
          </button>
        </div>

        {/* Top Status Banner */}
        <div className="grid grid-cols-4 gap-1.5 text-center shrink-0 border border-white/10 bg-white/5 p-1.5 rounded-none text-xs">
          <div>
            <div className="text-[10px] text-slate-400">{language === 'ko' ? '구출' : 'RESCUE'}</div>
            <div className="font-bold text-amber-400">{collected}/{allyTargetCount}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">{language === 'ko' ? '턴' : 'TURNS'}</div>
            <div className="font-bold text-slate-100">{turns}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">{language === 'ko' ? '게이트' : 'GATE'}</div>
            <div className={cn('font-bold', gateOpen ? 'text-emerald-400' : 'text-rose-400')}>
              {gateOpen ? (language === 'ko' ? '열림' : 'OPEN') : (language === 'ko' ? '잠김' : 'LOCKED')}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">{language === 'ko' ? '보상' : 'REWARD'}</div>
            <div className="font-bold text-amber-400">{Math.min(60, Math.max(15, 25 + collected * 10 - Math.floor(turns * 0.5)))} SNS</div>
          </div>
        </div>

        {statusText && (
          <div className="rounded-sm border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-center text-xs font-mono text-amber-300 shrink-0">
            {statusText}
          </div>
        )}

        {/* Board Container */}
        <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden">
          <div
            className="w-full max-w-[340px] sm:max-w-[400px] aspect-square bg-black/40 border border-white/10 p-1 relative overflow-hidden touch-none"
            style={{ touchAction: 'none' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="relative grid gap-1 w-full h-full" style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}>
              {board.map((row, rowIndex) => row.map((cell, colIndex) => {
                const isPlayer = cell.kind === 'player';
                const isAlly = cell.kind === 'ally';
                const isEnemy = cell.kind === 'enemy';
                const isGate = cell.kind === 'gate';
                const hintActive = swipeHint === 'up' || swipeHint === 'down' || swipeHint === 'left' || swipeHint === 'right';
                const isHinted = hintActive && (
                  (swipeHint === 'up' && rowIndex === playerPos.row - 1 && colIndex === playerPos.col) ||
                  (swipeHint === 'down' && rowIndex === playerPos.row + 1 && colIndex === playerPos.col) ||
                  (swipeHint === 'left' && rowIndex === playerPos.row && colIndex === playerPos.col - 1) ||
                  (swipeHint === 'right' && rowIndex === playerPos.row && colIndex === playerPos.col + 1)
                );

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={cn(
                      'relative aspect-square rounded-sm overflow-hidden border transition-all duration-100',
                      'border-white/10 bg-slate-900',
                      isHinted && 'ring-1 ring-amber-400 scale-[1.02]',
                      isPlayer && 'ring-2 ring-amber-400 bg-amber-500/20',
                      isAlly && 'ring-1 ring-emerald-400 bg-emerald-500/20',
                      isEnemy && 'ring-1 ring-rose-400 bg-rose-500/20',
                      isGate && (gateOpen ? 'ring-2 ring-indigo-400 bg-indigo-500/20' : 'ring-1 ring-slate-600')
                    )}
                  >
                    <div className="absolute inset-0 opacity-15">
                      <div className="w-full h-full" style={getCardSpriteStyle(cell.backgroundCardId)} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center p-0.5">
                      {isPlayer ? (
                        <div className="w-[90%] h-[90%] rounded-sm overflow-hidden border border-amber-400">
                          <div className="w-full h-full" style={getCardSpriteStyle(heroCardId)} />
                        </div>
                      ) : isAlly ? (
                        <div className="w-[85%] h-[85%] rounded-sm overflow-hidden border border-emerald-400">
                          <div className="w-full h-full" style={getCardSpriteStyle(cell.cardId)} />
                        </div>
                      ) : isEnemy ? (
                        <div className="w-[85%] h-[85%] rounded-sm overflow-hidden border border-rose-400">
                          <div className="w-full h-full" style={getCardSpriteStyle(cell.cardId)} />
                        </div>
                      ) : isGate ? (
                        <div className={cn('w-[80%] h-[80%] rounded-sm overflow-hidden border', gateOpen ? 'border-indigo-400' : 'border-slate-500')}>
                          <div className="w-full h-full" style={getCardSpriteStyle(cell.cardId)} />
                        </div>
                      ) : null}
                    </div>
                    {isGate && !gateOpen && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
                        <Shield size={14} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>
        </div>

        {/* Mobile One-Handed D-Pad & Controls */}
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

        {/* Game Over Modal */}
        {isGameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
            <div className={cn('w-full max-w-xs border p-5 rounded-none text-center bg-slate-900', isWin ? 'border-amber-400' : 'border-rose-400')}>
              <div className="text-base font-bold uppercase tracking-wider mb-2">
                {isWin ? (language === 'ko' ? '[ 승리: 게이트 탈출 성공 ]' : '[ VICTORY: ESCAPED ]') : (language === 'ko' ? '[ 패배: 적에게 포획됨 ]' : '[ DEFEAT: CAUGHT ]')}
              </div>
              <div className="text-xs text-slate-300 mb-3">
                {isWin
                  ? (language === 'ko' ? `보상 획득: +${Math.min(60, Math.max(15, 25 + collected * 10 - Math.floor(turns * 0.5)))} SNS` : `Reward: +${Math.min(60, Math.max(15, 25 + collected * 10 - Math.floor(turns * 0.5)))} SNS`)
                  : (language === 'ko' ? '적 카드에 도달당했습니다.' : 'Caught by rogue cards.')}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={restartGame}
                  className="flex-1 py-2.5 rounded-sm bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 min-h-[44px]"
                >
                  {language === 'ko' ? '재도전' : 'RETRY'}
                </button>
                <button
                  onClick={onExit}
                  className="flex-1 py-2.5 rounded-sm bg-white/10 text-white font-bold text-xs border border-white/20 hover:bg-white/15 min-h-[44px]"
                >
                  {language === 'ko' 
                    ? `나가기${defeatCountdown !== null ? ` (${defeatCountdown}s)` : ''}` 
                    : `EXIT${defeatCountdown !== null ? ` (${defeatCountdown}s)` : ''}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
