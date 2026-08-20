import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Flag } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn, getAssetUrl } from '../lib/utils';

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
  const cards1ImgRef = useRef<HTMLImageElement | null>(null);
  const cards2ImgRef = useRef<HTMLImageElement | null>(null);
  const rewardedRef = useRef(false);

  const [level, setLevel] = useState(1);

  const currentLevelConfig = LEVEL_CONFIG[Math.min(level - 1, LEVEL_CONFIG.length - 1)];
  const gridSize = currentLevelConfig.grid;
  const minesCount = currentLevelConfig.mines;
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
  const [earnedReward, setEarnedReward] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const img1 = new Image(); img1.src = getAssetUrl('/cards1.png'); cards1ImgRef.current = img1;
    const img2 = new Image(); img2.src = getAssetUrl('/cards2.png'); cards2ImgRef.current = img2;
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
    setEarnedReward(0);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [gridSize, minesCount]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const [flagMode, setFlagMode] = useState(false);

  const calcReward = useCallback((isWin: boolean, lvl: number, timeSec: number, revealedRatio = 0) => {
    if (isWin) {
      // Base win reward scaled from 25 to 55 SNS + time bonus up to +5 SNS
      const baseWin = 20 + lvl * 3.5;
      const speedBonus = timeSec < 20 ? 5 : timeSec < 45 ? 3 : timeSec < 90 ? 1 : 0;
      return Math.min(60, Math.max(25, Math.floor(baseWin + speedBonus)));
    }
    // Loss reward: fair participation reward based on how much was explored (10~22 SNS)
    const baseMin = 10;
    const progressBonus = Math.floor(revealedRatio * (10 + lvl));
    return Math.min(25, baseMin + progressBonus);
  }, []);

  const getRevealedRatio = useCallback(() => {
    const g = gameRef.current;
    let revealed = 0;
    let totalSafe = 0;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (!g.mines[y]?.[x]) totalSafe++;
        if (g.cellStates[y]?.[x] === 'revealed') revealed++;
      }
    }
    return totalSafe > 0 ? revealed / totalSafe : 0;
  }, [gridSize]);

  useEffect(() => {
    if ((hudGameOver || hudWin) && !rewardedRef.current) {
      rewardedRef.current = true;
      const ratio = getRevealedRatio();
      const finalReward = calcReward(hudWin, level, gameRef.current.timer, ratio);
      setEarnedReward(finalReward);
      onReward(finalReward);
    }
  }, [calcReward, getRevealedRatio, hudGameOver, hudWin, level, onReward]);

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

    const drawCard = (cardId: number, cx: number, cy: number, size: number) => {
      const idx = CARD_DATABASE[cardId] ? cardId : 1;
      const isCards2 = idx >= 101;
      const targetImg = isCards2 ? cards2ImgRef.current : cards1ImgRef.current;
      if (!targetImg || !targetImg.complete || targetImg.naturalWidth <= 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy, size / 3, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      const col = isCards2 ? (idx - 101) % 10 : (idx - 1) % 10;
      const row = isCards2 ? Math.floor((idx - 101) / 10) : Math.floor(((idx - 1) % 100) / 10);
      const spriteW = targetImg.naturalWidth / 10;
      const spriteH = targetImg.naturalHeight / 10;
      ctx.drawImage(targetImg, col * spriteW, row * spriteH, spriteW, spriteH, cx - size / 2, cy - size / 2, size, size);
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

    if (flagMode) {
      toggleFlag(cell.x, cell.y);
      return;
    }

    touchStartRef.current = { x: cell.x, y: cell.y, time: Date.now() };

    longPressTimerRef.current = window.setTimeout(() => {
      toggleFlag(cell.x, cell.y);
      touchStartRef.current = null;
    }, 400);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (flagMode) return;

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
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-950 text-white flex flex-col items-center justify-between font-mono select-none overflow-hidden pb-3">
      <header className="w-full max-w-md flex items-center justify-between px-3 py-2 shrink-0">
        <button onClick={onExit} className="p-2 rounded-sm bg-white/10 hover:bg-white/15 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h1 className="text-sm sm:text-base font-bold tracking-tight">{t('mode_minesweeper', language)}</h1>
          <div className="text-[10px] sm:text-xs text-indigo-300 font-bold">Lv.{level} ({gridSize}×{gridSize} / 💣{minesCount})</div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="px-2 py-1 rounded-sm bg-red-500/20 border border-red-400/30 text-red-100 font-bold text-xs sm:text-sm tabular-nums">
            🚩{hudMinesLeft}
          </div>
          <div className="px-2 py-1 rounded-sm bg-indigo-500/20 border border-indigo-400/30 text-indigo-100 font-bold text-xs sm:text-sm tabular-nums">
            ⏱{hudTimer}s
          </div>
        </div>
      </header>

      {/* Difficulty Presets (초급/중급/고급) & Level Selector */}
      <div className="w-full max-w-md px-3 flex items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-1">
          {[
            { id: 'beg', nameKo: '초급(1)', nameEn: 'Easy(1)', lvl: 1 },
            { id: 'mid', nameKo: '중급(5)', nameEn: 'Mid(5)', lvl: 5 },
            { id: 'exp', nameKo: '고급(10)', nameEn: 'Hard(10)', lvl: 10 },
          ].map((preset) => {
            const active = level === preset.lvl;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setLevel(preset.lvl);
                }}
                className={cn(
                  "px-2 py-1 text-xs rounded-sm border transition-all cursor-pointer min-h-[36px]",
                  active
                    ? "bg-indigo-600 text-white border-indigo-500 font-bold"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                )}
              >
                [{language === 'ko' ? preset.nameKo : preset.nameEn}]
              </button>
            );
          })}
        </div>

        {/* Level step controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={level <= 1}
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              setLevel(prev => Math.max(1, prev - 1));
            }}
            className="px-2 py-1 bg-white/10 disabled:opacity-30 rounded-sm text-xs font-bold min-h-[36px] cursor-pointer"
          >
            [-]
          </button>
          <span className="text-xs font-bold text-slate-300 min-w-[32px] text-center">L{level}</span>
          <button
            type="button"
            disabled={level >= LEVEL_CONFIG.length}
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              setLevel(prev => Math.min(LEVEL_CONFIG.length, prev + 1));
            }}
            className="px-2 py-1 bg-white/10 disabled:opacity-30 rounded-sm text-xs font-bold min-h-[36px] cursor-pointer"
          >
            [+]
          </button>
        </div>
      </div>

      <main className="w-full max-w-md flex-1 min-h-0 flex flex-col items-center justify-center px-3">
        <div
          className={cn('relative overflow-hidden rounded-sm border border-white/10 max-h-[58vh] aspect-square w-full max-w-[340px]')}
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="w-full h-full object-contain" />

          {(hudGameOver || hudWin) && (
            <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white text-slate-900 rounded-sm p-5 max-w-xs w-full text-center border border-slate-300 shadow-lg">
                {hudWin ? (
                  <Trophy size={36} className="mx-auto text-amber-500 mb-2" />
                ) : (
                  <Flag size={36} className="mx-auto text-red-500 mb-2" />
                )}
                <h2 className="text-lg font-bold mb-1">
                  {hudWin ? (language === 'ko' ? '[승리! 지뢰 탐지 완료]' : '[VICTORY! MINES CLEARED]') : (language === 'ko' ? '[지뢰 폭발!]' : '[BOOM! GAME OVER]')}
                </h2>
                <div className="text-xs text-slate-600 space-y-1 mb-3 bg-slate-50 p-2.5 rounded-sm border border-slate-200">
                  <div className="flex justify-between">
                    <span>{language === 'ko' ? '도전 레벨' : 'Level'}:</span>
                    <span className="font-bold text-slate-900">Lv.{level} ({gridSize}×{gridSize})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'ko' ? '소요 시간' : 'Time'}:</span>
                    <span className="font-bold text-slate-900">{gameRef.current.timer}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'ko' ? '탐지 상태' : 'Explored'}:</span>
                    <span className="font-bold text-slate-900">
                      {hudWin ? '100% Complete' : `${Math.round(getRevealedRatio() * 100)}% Safe`}
                    </span>
                  </div>
                </div>

                <div className="mb-3.5 py-2 px-3 bg-indigo-50 border border-indigo-200 rounded-sm">
                  <span className="text-xs text-indigo-700 font-bold">
                    {language === 'ko' ? `보상 지급: +${earnedReward} SNS 포인트` : `Reward Earned: +${earnedReward} SNS Points`}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button onClick={initGame} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm font-bold flex items-center justify-center gap-1 cursor-pointer min-h-[44px] text-xs">
                    <RotateCcw size={14} />
                    {language === 'ko' ? '재도전' : 'Retry'}
                  </button>
                  {hudWin && level < LEVEL_CONFIG.length && (
                    <button onClick={handleNextLevel} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm font-bold cursor-pointer min-h-[44px] text-xs">
                      {language === 'ko' ? `Lv.${level + 1} ▶` : `Lv.${level + 1} ▶`}
                    </button>
                  )}
                  {!hudWin && (
                    <button onClick={onExit} className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm font-bold cursor-pointer min-h-[44px] text-xs">
                      {t('home', language)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile One-Hand Mode Toggle (Reveal vs Flag) */}
        <div className="mt-2.5 flex items-center justify-center gap-3 w-full max-w-xs select-none shrink-0">
          <button
            type="button"
            onClick={() => setFlagMode(false)}
            className={cn(
              'flex-1 py-2.5 rounded-sm font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all border touch-manipulation min-h-[44px]',
              !flagMode
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-white/10 border-white/20 text-slate-300 active:scale-95'
            )}
          >
            [🔍 {language === 'ko' ? '열기 모드' : 'Dig'}]
          </button>
          <button
            type="button"
            onClick={() => setFlagMode(true)}
            className={cn(
              'flex-1 py-2.5 rounded-sm font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all border touch-manipulation min-h-[44px]',
              flagMode
                ? 'bg-rose-600 border-rose-500 text-white'
                : 'bg-white/10 border-white/20 text-slate-300 active:scale-95'
            )}
          >
            [🚩 {language === 'ko' ? '깃발 모드' : 'Flag'}]
          </button>
        </div>
      </main>

      <div className="px-3 py-1 bg-white/5 rounded-sm text-[10px] text-slate-400 font-mono text-center max-w-md shrink-0 border border-white/5">
        {language === 'ko'
          ? '모드 버튼으로 원터치 전환 | 길게 누르기로 깃발 | 레벨/시간별 25~60 SNS 지급'
          : 'Toggle mode for one-touch | Long press flags | 25~60 SNS reward'}
      </div>
    </div>
  );
};