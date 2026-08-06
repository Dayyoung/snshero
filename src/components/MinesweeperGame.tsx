import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Flag } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';

interface MinesweeperGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const LEVEL_CONFIG = [
  { grid: 7, mines: 4 },
  { grid: 7, mines: 6 },
  { grid: 8, mines: 7 },
  { grid: 8, mines: 9 },
  { grid: 9, mines: 10 },
  { grid: 9, mines: 13 },
  { grid: 9, mines: 15 },
  { grid: 10, mines: 16 },
  { grid: 10, mines: 20 },
  { grid: 10, mines: 24 },
];

const CANVAS_SIZE = 360;

type CellState = 'hidden' | 'revealed' | 'flagged';

export const MinesweeperGame: React.FC<MinesweeperGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);
  const cardImgRef = useRef<HTMLImageElement | null>(null);
  const rewardedRef = useRef(false);

  const [level, setLevel] = useState(1);

  const gridSize = LEVEL_CONFIG[Math.min(level - 1, LEVEL_CONFIG.length - 1)].grid;
  const minesCount = LEVEL_CONFIG[Math.min(level - 1, LEVEL_CONFIG.length - 1)].mines;
  const cellSize = CANVAS_SIZE / gridSize;

  const gameRef = useRef({
    mines: [] as boolean[][],
    numbers: [] as number[][],
    cellStates: [] as CellState[][],
    isGameOver: false,
    isWin: false,
    firstTap: true,
    timer: 0,
    started: false,
    timerStart: 0,
    explodedCell: null as { x: number; y: number } | null,
  });

  const longPressTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const [hudTimer, setHudTimer] = useState(0);
  const [hudMinesLeft, setHudMinesLeft] = useState(minesCount);
  const [hudGameOver, setHudGameOver] = useState(false);
  const [hudWin, setHudWin] = useState(false);
  const [hudScore, setHudScore] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/card100.png';
    cardImgRef.current = img;
  }, []);

  const calculateNumbers = (mines: boolean[][], gs: number): number[][] => {
    const numbers: number[][] = [];
    for (let y = 0; y < gs; y++) {
      numbers[y] = [];
      for (let x = 0; x < gs; x++) {
        if (mines[y][x]) { numbers[y][x] = -1; continue; }
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy, nx = x + dx;
            if (ny >= 0 && ny < gs && nx >= 0 && nx < gs && mines[ny][nx]) count++;
          }
        }
        numbers[y][x] = count;
      }
    }
    return numbers;
  };

  const placeMines = (safeX: number, safeY: number, gs: number, numMines: number) => {
    const mines: boolean[][] = [];
    for (let y = 0; y < gs; y++) {
      mines[y] = [];
      for (let x = 0; x < gs; x++) {
        mines[y][x] = false;
      }
    }

    let placed = 0;
    while (placed < numMines) {
      const y = Math.floor(Math.random() * gs);
      const x = Math.floor(Math.random() * gs);
      if (mines[y][x]) continue;
      if (Math.abs(y - safeY) <= 1 && Math.abs(x - safeX) <= 1) continue;
      mines[y][x] = true;
      placed++;
    }
    return mines;
  };

  const initGame = useCallback(() => {
    const g = gameRef.current;
    g.cellStates = [];
    g.mines = [];
    g.numbers = [];
    for (let y = 0; y < gridSize; y++) {
      g.cellStates[y] = [];
      g.mines[y] = [];
      g.numbers[y] = [];
      for (let x = 0; x < gridSize; x++) {
        g.cellStates[y][x] = 'hidden';
        g.mines[y][x] = false;
        g.numbers[y][x] = 0;
      }
    }
    g.isGameOver = false;
    g.isWin = false;
    g.firstTap = true;
    g.timer = 0;
    g.started = false;
    g.timerStart = 0;
    g.explodedCell = null;
    rewardedRef.current = false;
    setHudTimer(0);
    setHudMinesLeft(minesCount);
    setHudGameOver(false);
    setHudWin(false);
    setHudScore(0);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [gridSize, minesCount]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if ((hudGameOver || hudWin) && !rewardedRef.current) {
      rewardedRef.current = true;
      onReward(hudScore);
    }
  }, [hudGameOver, hudWin, onReward, hudScore]);

  const revealCell = (x: number, y: number) => {
    const g = gameRef.current;
    if (g.isGameOver || g.isWin) return;
    if (g.cellStates[y][x] !== 'hidden') return;

    if (g.firstTap) {
      g.firstTap = false;
      g.mines = placeMines(x, y, gridSize, minesCount);
      g.numbers = calculateNumbers(g.mines, gridSize);
      g.started = true;
      g.timerStart = Date.now();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = window.setInterval(() => {
        if (!g.isGameOver && !g.isWin) {
          g.timer = Math.floor((Date.now() - g.timerStart) / 1000);
          setHudTimer(g.timer);
        }
      }, 1000);
    }

    if (g.mines[y][x]) {
      g.isGameOver = true;
      g.explodedCell = { x, y };
      setHudGameOver(true);
      for (let my = 0; my < gridSize; my++) {
        for (let mx = 0; mx < gridSize; mx++) {
          if (g.mines[my][mx]) g.cellStates[my][mx] = 'revealed';
        }
      }
      playSfx('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      const score = Math.max(0, 999 - g.timer * 5);
      setHudScore(score);
      return;
    }

    g.cellStates[y][x] = 'revealed';

    if (g.numbers[y][x] === 0) {
      const queue: [number, number][] = [[x, y]];
      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx, ny = cy + dy;
            if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && g.cellStates[ny][nx] === 'hidden') {
              g.cellStates[ny][nx] = 'revealed';
              if (g.numbers[ny][nx] === 0) {
                queue.push([nx, ny]);
              }
            }
          }
        }
      }
    }

    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

    let revealed = 0;
    let totalSafe = 0;
    for (let my = 0; my < gridSize; my++) {
      for (let mx = 0; mx < gridSize; mx++) {
        if (!g.mines[my]?.[mx]) totalSafe++;
        if (g.cellStates[my][mx] === 'revealed') revealed++;
      }
    }
    if (revealed >= totalSafe) {
      g.isWin = true;
      setHudWin(true);
      for (let my = 0; my < gridSize; my++) {
        for (let mx = 0; mx < gridSize; mx++) {
          if (g.mines[my]?.[mx]) g.cellStates[my][mx] = 'flagged';
        }
      }
      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      const baseScore = Math.max(10, 999 - g.timer * 5);
      const levelBonus = level * 50;
      setHudScore(baseScore + levelBonus);
    }
  };

  const toggleFlag = (x: number, y: number) => {
    const g = gameRef.current;
    if (g.isGameOver || g.isWin) return;
    if (g.cellStates[y][x] === 'revealed') return;
    g.cellStates[y][x] = g.cellStates[y][x] === 'flagged' ? 'hidden' : 'flagged';
    let flags = 0;
    for (let my = 0; my < gridSize; my++) {
      for (let mx = 0; mx < gridSize; mx++) {
        if (g.cellStates[my][mx] === 'flagged') flags++;
      }
    }
    setHudMinesLeft(minesCount - flags);
  };

  const getCellFromPointer = (e: React.PointerEvent<HTMLDivElement>): { x: number; y: number } | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const x = Math.floor(px / cellSize);
    const y = Math.floor(py / cellSize);
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return null;
    return { x, y };
  };

  useEffect(() => {
    const renderLoop = (timestamp: number) => {
      renderCanvas(timestamp);
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };
    animFrameRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [level, language, lowSpecMode]);

  const renderCanvas = (timestamp: number) => {
    const g = gameRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const img = cardImgRef.current;
    const drawCard = (cardId: number, cx: number, cy: number, size: number) => {
      if (!img || !img.complete || img.naturalWidth <= 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy, size / 3, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      const idx = CARD_DATABASE[cardId] ? cardId : 1;
      const col = (idx - 1) % 10;
      const row = Math.floor((idx - 1) / 10);
      const spriteW = img.naturalWidth / 10;
      const spriteH = img.naturalHeight / 11;
      ctx.drawImage(img, col * spriteW, row * spriteH, spriteW, spriteH, cx - size / 2, cy - size / 2, size, size);
    };

    const numberColors = ['', '#3b82f6', '#22c55e', '#ef4444', '#7c3aed', '#b91c1c', '#0891b2', '#1f2937', '#6b7280'];

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const px = x * cellSize;
        const py = y * cellSize;
        const state = g.cellStates[y]?.[x] || 'hidden';

        if (state === 'hidden') {
          ctx.fillStyle = '#334155';
          ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
        } else if (state === 'flagged') {
          ctx.fillStyle = '#1e3a5f';
          ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
          ctx.fillStyle = '#3b82f6';
          ctx.font = `bold ${Math.max(10, cellSize * 0.5)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🚩', px + cellSize / 2, py + cellSize / 2);
        } else if (state === 'revealed') {
          const isMine = g.mines[y]?.[x];
          const isExploded = g.explodedCell && g.explodedCell.x === x && g.explodedCell.y === y;

          if (isMine) {
            ctx.fillStyle = isExploded ? '#7f1d1d' : '#1e293b';
            ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
            const mineCardId = ((y * gridSize + x) % 110) + 1;
            drawCard(mineCardId, px + cellSize / 2, py + cellSize / 2, cellSize - 6);
            if (isExploded) {
              ctx.save();
              ctx.strokeStyle = '#f87171';
              ctx.lineWidth = 2;
              ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
              ctx.restore();
            }
          } else {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
            const num = g.numbers[y]?.[x] || 0;
            if (num > 0) {
              ctx.fillStyle = numberColors[num] || '#9ca3af';
              ctx.font = `bold ${Math.max(12, cellSize * 0.55)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(String(num), px + cellSize / 2, py + cellSize / 2);
            }
          }
        }
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const cell = getCellFromPointer(e);
    if (!cell) return;

    touchStartRef.current = { x: cell.x, y: cell.y, time: Date.now() };

    longPressTimerRef.current = window.setTimeout(() => {
      toggleFlag(cell.x, cell.y);
      touchStartRef.current = null;
    }, 400);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!touchStartRef.current) return;
    const cell = getCellFromPointer(e);
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (!cell) return;
    if (cell.x !== start.x || cell.y !== start.y) return;

    const elapsed = Date.now() - start.time;
    if (elapsed < 400) {
      revealCell(cell.x, cell.y);
    }
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const handleNextLevel = () => {
    const nextLevel = Math.min(level + 1, LEVEL_CONFIG.length);
    setLevel(nextLevel);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center font-sans select-none">
      <header className="w-full max-w-md flex items-center justify-between p-3">
        <button onClick={onExit} className="p-2 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black uppercase tracking-tight">{t('mode_minesweeper', language)}</h1>
          <div className="text-xs font-bold text-indigo-300">Lv.{level} ({gridSize}×{gridSize} / {minesCount})</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 rounded-xl bg-red-500/20 border border-red-400/20 text-red-100 font-black text-sm tabular-nums">
            {hudMinesLeft}
          </div>
          <div className="px-2 py-1 rounded-xl bg-indigo-500/20 border border-indigo-400/20 text-indigo-100 font-black text-sm tabular-nums">
            {hudTimer}s
          </div>
        </div>
      </header>

      <div
        className={cn('relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl')}
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="w-full h-full" />

        {(hudGameOver || hudWin) && (
          <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl">
              {hudWin ? (
                <Trophy size={42} className="mx-auto text-amber-500 mb-3" />
              ) : (
                <Flag size={42} className="mx-auto text-red-500 mb-3" />
              )}
              <h2 className="text-xl font-black mb-1">
                {hudWin ? (language === 'ko' ? '승리!' : 'WIN!') : (language === 'ko' ? '지뢰 폭발!' : 'BOOM!')}
              </h2>
              <p className="text-sm font-bold text-slate-500 mb-1">
                {language === 'ko' ? `시간: ${gameRef.current.timer}초` : `Time: ${gameRef.current.timer}s`}
              </p>
              {hudWin && level < LEVEL_CONFIG.length && (
                <p className="text-xs font-bold text-emerald-600 mb-1">
                  {language === 'ko' ? `레벨 보너스: +${level * 50}` : `Level bonus: +${level * 50}`}
                </p>
              )}
              <p className="text-sm font-bold text-indigo-600 mb-4">
                {t('minesweeper_reward', language).replace('{amount}', String(hudScore))}
              </p>
              <div className="flex gap-2">
                <button onClick={initGame} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 cursor-pointer">
                  <RotateCcw size={16} />
                  {language === 'ko' ? '재시작' : 'Restart'}
                </button>
                {hudWin && level < LEVEL_CONFIG.length && (
                  <button onClick={handleNextLevel} className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl font-black cursor-pointer">
                    {language === 'ko' ? `Lv.${level + 1} ▶` : `Lv.${level + 1} ▶`}
                  </button>
                )}
                {!hudWin && (
                  <button onClick={onExit} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black cursor-pointer">
                    {t('home', language)}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 px-4 py-2 bg-white/5 rounded-2xl text-[10px] text-slate-400 font-bold text-center max-w-md">
        {language === 'ko' ? '탭: 열기 | 길게 누르기: 깃발' : 'Tap: Reveal | Long press: Flag'}
      </div>
    </div>
  );
};