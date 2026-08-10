import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Zap, Shield, Navigation } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn, getAssetUrl } from '../lib/utils';

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

const getCardSpriteStyle = (cardId: number): React.CSSProperties => {
  const safeId = CARD_DATABASE[cardId] ? cardId : 1;
  const x = ((safeId - 1) % 10) * (100 / 9);
  const y = Math.floor((safeId - 1) / 10) * (100 / 10);
  return {
    backgroundImage: `url('${getAssetUrl('/card100.png')}')`,
    backgroundSize: '1000% 1100%',
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated' as const,
  };
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
    const reward = Math.max(40, 60 + nextCollected * 25 - Math.floor(nextTurns * 1.5));
    onReward(reward);
    setIsGameOver(true);
    setIsWin(true);
    isGameOverRef.current = true;
    isWinRef.current = true;
    showStatus(language === 'ko' ? '게이트 탈출 성공!' : 'Gate escape success!');
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 text-white overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 md:py-8 flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl shadow-indigo-900/20 px-4 py-3 text-xs sm:text-sm font-extrabold tracking-wider uppercase hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={16} />
            {language === 'ko' ? '뒤로' : 'Back'}
          </button>
          <div className="flex items-center gap-2 text-amber-300 font-extrabold tracking-wider uppercase text-xs sm:text-sm">
            <Navigation size={16} />
            {t('mode_cardrush', language)}
          </div>
          <button
            onClick={restartGame}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500/15 backdrop-blur-sm border border-amber-300/20 shadow-xl shadow-amber-900/10 px-4 py-3 text-xs sm:text-sm font-extrabold tracking-wider uppercase hover:bg-amber-500/25 transition-colors"
          >
            <RotateCcw size={16} />
            {language === 'ko' ? '재시작' : 'Restart'}
          </button>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-indigo-900/20 p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-amber-300/30 shadow-xl shadow-amber-900/20 shrink-0">
                <div className="w-full h-full" style={getCardSpriteStyle(heroCardId)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.35em] text-indigo-300/70 font-extrabold mb-1">
                  {boardStatus}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-wider text-white truncate">
                  {t('mode_cardrush', language)}
                </div>
                <div className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {t('mode_cardrush_guide', language)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center min-w-0">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-3">
                <div className="text-[10px] uppercase tracking-wider text-indigo-300/60 font-extrabold">{language === 'ko' ? '구출' : 'Rescued'}</div>
                <div className="mt-1 text-xl font-extrabold text-amber-300">{collected}/{allyTargetCount}</div>
              </div>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-3">
                <div className="text-[10px] uppercase tracking-wider text-indigo-300/60 font-extrabold">{language === 'ko' ? '턴' : 'Turns'}</div>
                <div className="mt-1 text-xl font-extrabold text-white">{turns}</div>
              </div>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-3">
                <div className="text-[10px] uppercase tracking-wider text-indigo-300/60 font-extrabold">{language === 'ko' ? '게이트' : 'Gate'}</div>
                <div className={cn('mt-1 text-xl font-extrabold', gateOpen ? 'text-emerald-300' : 'text-rose-300')}>
                  {gateOpen ? (language === 'ko' ? '개방' : 'Open') : (language === 'ko' ? '잠금' : 'Locked')}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-3">
                <div className="text-[10px] uppercase tracking-wider text-indigo-300/60 font-extrabold">{language === 'ko' ? '상태' : 'Status'}</div>
                <div className="mt-1 text-xl font-extrabold text-amber-300">
                  {isGameOver ? (isWin ? (language === 'ko' ? '승리' : 'Win') : (language === 'ko' ? '실패' : 'Lose')) : (language === 'ko' ? '진행중' : 'Live')}
                </div>
              </div>
            </div>
          </div>

          {statusText && (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm font-extrabold tracking-wider text-amber-100">
              {statusText}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4 sm:gap-6 items-start">
          <div
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-indigo-900/20 p-3 sm:p-4 relative overflow-hidden touch-none"
            style={{ touchAction: 'none' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_45%)]" />
            <div className="relative grid gap-2 aspect-square" style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}>
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
                      'relative aspect-square rounded-2xl overflow-hidden border shadow-xl transition-all duration-150',
                      'border-white/10 bg-slate-900/60',
                      isHinted && 'ring-2 ring-amber-400/70 scale-[1.03]',
                      isPlayer && 'ring-2 ring-amber-300/80 scale-[1.02] shadow-amber-500/20',
                      isAlly && 'ring-2 ring-emerald-300/60',
                      isEnemy && 'ring-2 ring-rose-400/60',
                      isGate && (gateOpen ? 'ring-2 ring-indigo-300/80' : 'ring-2 ring-slate-500/60')
                    )}
                  >
                    <div className="absolute inset-0 opacity-15">
                      <div className="w-full h-full" style={getCardSpriteStyle(cell.backgroundCardId)} />
                    </div>
                    <div className={cn('absolute inset-0', isPlayer && 'bg-amber-500/10', isAlly && 'bg-emerald-500/10', isEnemy && 'bg-rose-500/10', isGate && 'bg-indigo-500/10')} />
                    <div className="absolute inset-0 flex items-center justify-center p-1 sm:p-2">
                      {isPlayer ? (
                        <div className="w-[88%] h-[88%] rounded-xl overflow-hidden border border-amber-300/50 shadow-xl shadow-amber-900/30">
                          <div className="w-full h-full" style={getCardSpriteStyle(heroCardId)} />
                        </div>
                      ) : isAlly ? (
                        <div className="w-[82%] h-[82%] rounded-xl overflow-hidden border border-emerald-300/50 shadow-xl shadow-emerald-900/20">
                          <div className="w-full h-full" style={getCardSpriteStyle(cell.cardId)} />
                        </div>
                      ) : isEnemy ? (
                        <div className="w-[82%] h-[82%] rounded-xl overflow-hidden border border-rose-300/50 shadow-xl shadow-rose-900/20 animate-pulse">
                          <div className="w-full h-full" style={getCardSpriteStyle(cell.cardId)} />
                        </div>
                      ) : isGate ? (
                        <div className={cn('w-[78%] h-[78%] rounded-xl overflow-hidden border shadow-xl', gateOpen ? 'border-indigo-300/60 shadow-indigo-900/30' : 'border-slate-300/40 shadow-slate-900/20')}>
                          <div className="w-full h-full" style={getCardSpriteStyle(cell.cardId)} />
                        </div>
                      ) : null}
                    </div>
                    {isGate && !gateOpen && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35 backdrop-blur-[1px]">
                        <Shield size={18} className="text-slate-100/80" />
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>

            <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-none">
              {swipeHint && (
                <div className="rounded-full bg-amber-500/20 border border-amber-300/30 px-3 py-1 text-[11px] font-extrabold tracking-wider text-amber-100 shadow-xl shadow-amber-900/10">
                  {swipeHint.toUpperCase()}
                </div>
              )}
              <div className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-[11px] font-extrabold tracking-wider text-white/80">
                {language === 'ko' ? '스와이프 / 방향키' : 'Swipe / Arrows'}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-indigo-200/80 font-extrabold tracking-wider uppercase">
              <span>{language === 'ko' ? '터치는 부드럽게, 빠른 스와이프는 더 민감하게' : 'Fast swipes use a lower threshold'}</span>
              <span>{language === 'ko' ? '15px' : '15px'}</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-indigo-900/20 p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-amber-300/30 shadow-xl shadow-amber-900/20 shrink-0">
                <div className="w-full h-full" style={getCardSpriteStyle(heroCardId)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.35em] text-indigo-300/70 font-extrabold mb-1">
                  {language === 'ko' ? '플레이어 카드' : 'Player Card'}
                </div>
                <div className="text-lg sm:text-xl font-extrabold tracking-wider text-white truncate">
                  {deck[0]?.title || deck[0]?.title_en || deck[0]?.title_dis || (language === 'ko' ? '대표 카드' : 'Main Hero')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-black/20 border border-white/10 p-3 text-center">
                <Zap className="mx-auto mb-1 text-amber-300" size={18} />
                <div className="text-[10px] text-indigo-300/60 uppercase tracking-wider font-extrabold">{language === 'ko' ? '난이도' : 'Mode'}</div>
                <div className="mt-1 text-sm font-extrabold text-white">{lowSpecMode ? 'LOW' : 'NORMAL'}</div>
              </div>
              <div className="rounded-2xl bg-black/20 border border-white/10 p-3 text-center">
                <Trophy className="mx-auto mb-1 text-amber-300" size={18} />
                <div className="text-[10px] text-indigo-300/60 uppercase tracking-wider font-extrabold">{language === 'ko' ? '보상' : 'Reward'}</div>
                <div className="mt-1 text-sm font-extrabold text-white">{Math.max(40, 60 + collected * 25 - Math.floor(turns * 1.5))} SNS</div>
              </div>
              <div className="rounded-2xl bg-black/20 border border-white/10 p-3 text-center">
                <Shield className="mx-auto mb-1 text-emerald-300" size={18} />
                <div className="text-[10px] text-indigo-300/60 uppercase tracking-wider font-extrabold">{language === 'ko' ? '게이트' : 'Gate'}</div>
                <div className="mt-1 text-sm font-extrabold text-white">{gateOpen ? (language === 'ko' ? '열림' : 'OPEN') : (language === 'ko' ? '잠김' : 'LOCKED')}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs font-extrabold tracking-wider uppercase text-indigo-300/70 mb-3">
                {language === 'ko' ? '구출 카드' : 'Rescue Cards'}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {allyCardIds.map((cardId) => (
                  <div key={cardId} className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-950/40">
                    <div className="w-full h-full" style={getCardSpriteStyle(cardId)} />
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-300 leading-relaxed">
                {language === 'ko'
                  ? '동료 카드를 모두 구출하면 게이트가 열립니다. 게이트까지 도달하면 승리합니다.'
                  : 'Rescue every ally card to open the gate. Reach the gate to win.'}
              </div>
            </div>

            {isGameOver && (
              <div className={cn('rounded-2xl border p-4 text-center', isWin ? 'border-emerald-300/30 bg-emerald-500/10' : 'border-rose-300/30 bg-rose-500/10')}>
                <div className="text-sm font-extrabold tracking-[0.25em] uppercase text-white mb-2">
                  {isWin ? (language === 'ko' ? '승리' : 'Victory') : (language === 'ko' ? '패배' : 'Defeat')}
                </div>
                <div className="text-sm text-slate-200 mb-4">
                  {isWin
                    ? (language === 'ko' ? '보상을 획득했습니다.' : 'You earned the SNS reward.')
                    : (language === 'ko' ? '적 카드에게 포획되었습니다.' : 'The rogue cards caught you.')}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={restartGame}
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-xs font-extrabold tracking-wider uppercase shadow-xl shadow-indigo-900/20 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={16} />
                    {language === 'ko' ? '다시하기' : 'Play Again'}
                  </button>
                  <button
                    onClick={onExit}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-3 text-xs font-extrabold tracking-wider uppercase shadow-xl transition-colors text-slate-200 cursor-pointer"
                  >
                    {language === 'ko' 
                      ? `나가기${defeatCountdown !== null ? ` (${defeatCountdown}초)` : ''}` 
                      : `Exit${defeatCountdown !== null ? ` (${defeatCountdown}s)` : ''}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
