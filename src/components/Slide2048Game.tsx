import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, ArrowUp, ArrowDown, ArrowLeftIcon, ArrowRight, Swords, Zap } from 'lucide-react';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import { CARD_DATABASE } from '../cardDatabase';

interface Slide2048GameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

type TileValue = 0 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192;

interface Tile {
  id: number;
  value: TileValue;
  row: number;
  col: number;
  mergedFrom?: boolean;
  isNew?: boolean;
}

const GRID_SIZE = 4;
const WIN_VALUE = 2048;
const SWIPE_THRESHOLD = 15; // lowered for mobile responsiveness

// SNSHero-themed tile colors (indigo/gold/amber palette)
const TILE_STYLES: Record<number, { bg: string; text: string; glow: string }> = {
  0: { bg: 'bg-indigo-950/30', text: 'text-transparent', glow: '' },
  2: { bg: 'bg-indigo-200/80', text: 'text-indigo-900', glow: '' },
  4: { bg: 'bg-indigo-300/80', text: 'text-indigo-900', glow: '' },
  8: { bg: 'bg-amber-200/80', text: 'text-amber-900', glow: '' },
  16: { bg: 'bg-amber-400/80', text: 'text-white', glow: 'shadow-amber-400/30' },
  32: { bg: 'bg-orange-400/80', text: 'text-white', glow: 'shadow-orange-400/30' },
  64: { bg: 'bg-orange-500/80', text: 'text-white', glow: 'shadow-orange-500/30' },
  128: { bg: 'bg-amber-500/80', text: 'text-white', glow: 'shadow-amber-500/30' },
  256: { bg: 'bg-yellow-500/80', text: 'text-white', glow: 'shadow-yellow-500/30' },
  512: { bg: 'bg-red-400/80', text: 'text-white', glow: 'shadow-red-400/30' },
  1024: { bg: 'bg-red-500/80', text: 'text-white', glow: 'shadow-red-500/40' },
  2048: { bg: 'bg-rose-500/80', text: 'text-white', glow: 'shadow-rose-500/50' },
  4096: { bg: 'bg-pink-500/80', text: 'text-white', glow: 'shadow-pink-500/50' },
  8192: { bg: 'bg-purple-500/80', text: 'text-white', glow: 'shadow-purple-500/50' },
};

const FONT_SIZES: Record<number, string> = {
  2: 'text-xl', 4: 'text-xl', 8: 'text-xl',
  16: 'text-lg', 32: 'text-lg', 64: 'text-lg',
  128: 'text-base', 256: 'text-base', 512: 'text-base',
  1024: 'text-sm', 2048: 'text-xs', 4096: 'text-[10px]', 8192: 'text-[10px]',
};

let tileIdCounter = 0;
function nextTileId(): number { return ++tileIdCounter; }

function getEmptyCells(grid: TileValue[][]): [number, number][] {
  const empty: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (grid[r][c] === 0) empty.push([r, c]);
  return empty;
}

function addRandomTile(grid: TileValue[][]): { grid: TileValue[][]; newTile: Tile | null } {
  const empty = getEmptyCells(grid);
  if (empty.length === 0) return { grid, newTile: null };
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const value: TileValue = Math.random() < 0.9 ? 2 : 4;
  const newGrid = grid.map(row => [...row]);
  newGrid[r][c] = value;
  return { grid: newGrid, newTile: { id: nextTileId(), value, row: r, col: c, isNew: true } };
}

type Direction = 'up' | 'down' | 'left' | 'right';

function slideRow(row: TileValue[]): { newRow: TileValue[]; score: number; merges: { col: number }[] } {
  const filtered = row.filter(v => v !== 0) as TileValue[];
  const merged: TileValue[] = [];
  let score = 0;
  const merges: { col: number }[] = [];
  let mergeIdx = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
      merged.push((filtered[i] * 2) as TileValue);
      score += filtered[i] * 2;
      merges.push({ col: mergeIdx });
      i++;
    } else {
      merged.push(filtered[i]);
    }
    mergeIdx++;
  }
  while (merged.length < GRID_SIZE) merged.push(0 as TileValue);
  return { newRow: merged, score, merges };
}

function moveGrid(grid: TileValue[][], direction: Direction): { newGrid: TileValue[][]; score: number; mergedPositions: [number, number][] } {
  let score = 0;
  let newGrid = grid.map(row => [...row]);
  const mergedPositions: [number, number][] = [];
  if (direction === 'left') {
    for (let r = 0; r < GRID_SIZE; r++) {
      const result = slideRow(newGrid[r]);
      newGrid[r] = result.newRow;
      score += result.score;
      result.merges.forEach(m => mergedPositions.push([r, m.col]));
    }
  } else if (direction === 'right') {
    for (let r = 0; r < GRID_SIZE; r++) {
      const reversed = [...newGrid[r]].reverse();
      const result = slideRow(reversed);
      newGrid[r] = result.newRow.reverse();
      score += result.score;
      result.merges.forEach(m => mergedPositions.push([r, GRID_SIZE - 1 - m.col]));
    }
  } else if (direction === 'up') {
    for (let c = 0; c < GRID_SIZE; c++) {
      const col: TileValue[] = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
      const result = slideRow(col);
      for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = result.newRow[r];
      score += result.score;
      result.merges.forEach(m => mergedPositions.push([m.col, c]));
    }
  } else {
    for (let c = 0; c < GRID_SIZE; c++) {
      const col: TileValue[] = [newGrid[3][c], newGrid[2][c], newGrid[1][c], newGrid[0][c]];
      const result = slideRow(col);
      for (let r = 0; r < GRID_SIZE; r++) newGrid[GRID_SIZE - 1 - r][c] = result.newRow[r];
      score += result.score;
      result.merges.forEach(m => mergedPositions.push([GRID_SIZE - 1 - m.col, c]));
    }
  }
  return { newGrid, score, mergedPositions };
}

function gridsEqual(a: TileValue[][], b: TileValue[][]): boolean {
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (a[r][c] !== b[r][c]) return false;
  return true;
}

function canMove(grid: TileValue[][]): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true;
      if (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}

const BEST_SCORE_KEY = 'hero_2048_best';

export const Slide2048Game: React.FC<Slide2048GameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  // ── SNSHero character / card identity ──
  const playerCard = deck[0];
  const cardId = typeof playerCard?.id === 'number' ? playerCard.id : 1;
  const cardData = CARD_DATABASE[cardId] || CARD_DATABASE[1];
  const cardImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/card100.png';
    cardImageRef.current = img;
  }, []);

  const gridRef = useRef<TileValue[][]>([]);
  const scoreRef = useRef(0);
  const bestScoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const wonRef = useRef(false);
  const rewardedRef = useRef(false);
  const moveCountRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [swipeDir, setSwipeDir] = useState<Direction | null>(null);

  const [showTutorial, setShowTutorial] = useState(true);
  const [grid, setGrid] = useState<TileValue[][]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [mergedPositions, setMergedPositions] = useState<Set<string>>(new Set());
  const [newPositions, setNewPositions] = useState<Set<string>>(new Set());
  const [animating, setAnimating] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [showCombo, setShowCombo] = useState(false);

  const initGame = useCallback((forceSkipTutorial = false) => {
    const emptyGrid: TileValue[][] = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(0 as TileValue)
    );
    const after1 = addRandomTile(emptyGrid);
    const after2 = addRandomTile(after1.grid);
    gridRef.current = after2.grid;
    scoreRef.current = 0;
    gameOverRef.current = false;
    wonRef.current = false;
    rewardedRef.current = false;
    moveCountRef.current = 0;
    setGrid(after2.grid);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setMergedPositions(new Set());
    setNewPositions(new Set());
    setComboCount(0);
    setShowCombo(false);
    setSwipeDir(null);
    if (forceSkipTutorial) {
      setShowTutorial(false);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BEST_SCORE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) {
          bestScoreRef.current = parsed;
          setBestScore(parsed);
        }
      }
    } catch { /* ignore */ }
    initGame();
  }, [initGame]);

  const handleMove = useCallback((direction: Direction) => {
    if (gameOverRef.current || animating) return;

    const { newGrid, score: gained, mergedPositions: merged } = moveGrid(gridRef.current, direction);
    if (gridsEqual(gridRef.current, newGrid)) return;

    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    gridRef.current = newGrid;
    scoreRef.current += gained;
    moveCountRef.current++;

    // Combo tracking
    if (merged.length > 0) {
      const newCombo = comboCount + 1;
      setComboCount(newCombo);
      if (newCombo >= 3) {
        setShowCombo(true);
        setTimeout(() => setShowCombo(false), 1000);
      }
    } else {
      setComboCount(0);
    }

    const mergedSet = new Set<string>();
    merged.forEach(([r, c]) => mergedSet.add(`${r},${c}`));
    setMergedPositions(mergedSet);

    const afterAdd = addRandomTile(newGrid);
    gridRef.current = afterAdd.grid;

    const newSet = new Set<string>();
    if (afterAdd.newTile) newSet.add(`${afterAdd.newTile.row},${afterAdd.newTile.col}`);
    setNewPositions(newSet);

    setAnimating(true);
    setTimeout(() => {
      setGrid([...gridRef.current.map(row => [...row])]);
      setScore(scoreRef.current);
      setAnimating(false);
      setMergedPositions(new Set());
      setNewPositions(new Set());

      if (!wonRef.current) {
        for (let r = 0; r < GRID_SIZE; r++)
          for (let c = 0; c < GRID_SIZE; c++)
            if (gridRef.current[r][c] >= WIN_VALUE) {
              wonRef.current = true;
              setWon(true);
              playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
            }
      }

      if (scoreRef.current > bestScoreRef.current) {
        bestScoreRef.current = scoreRef.current;
        setBestScore(scoreRef.current);
        try { localStorage.setItem(BEST_SCORE_KEY, String(scoreRef.current)); } catch { /* ignore */ }
      }

      if (!canMove(gridRef.current)) {
        gameOverRef.current = true;
        setGameOver(true);
        if (!rewardedRef.current) {
          rewardedRef.current = true;
          const reward = Math.floor(scoreRef.current / 10);
          if (reward > 0) onReward(reward);
        }
      }
    }, lowSpecMode ? 0 : 100);
  }, [animating, playSfx, lowSpecMode, onReward, comboCount]);

  // ── Keyboard ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameOverRef.current) return;
      const map: Record<string, Direction> = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
      const dir = map[e.key];
      if (dir) { e.preventDefault(); handleMove(dir); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleMove]);

  // ── Enhanced Touch (swipe + visual feedback) ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    setSwipeDir(null);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || gameOverRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) { setSwipeDir(null); return; }
    setSwipeDir(absDx > absDy ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || gameOverRef.current) { setSwipeDir(null); return; }
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const elapsed = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Fast swipe → lower threshold
    const threshold = elapsed < 200 ? SWIPE_THRESHOLD * 0.6 : SWIPE_THRESHOLD;
    if (Math.max(absDx, absDy) < threshold) { setSwipeDir(null); return; }

    const dir: Direction = absDx > absDy ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    setSwipeDir(dir);
    handleMove(dir);

    // Clear visual indicator after animation
    setTimeout(() => setSwipeDir(null), 250);
  }, [handleMove]);

  // ── Tile rendering with SNSHero card sprite backgrounds ──
  const tileStyle = (value: TileValue, r: number, c: number): React.CSSProperties & { className: string } => {
    const styles = TILE_STYLES[value] || TILE_STYLES[0];
    const fontSize = FONT_SIZES[value] || 'text-sm';
    const posKey = `${r},${c}`;
    const isMerged = mergedPositions.has(posKey);
    const isNew = newPositions.has(posKey);

    // Card sprite background for non-zero tiles
    const cardIndex = cardId % 110; // use a deterministic offset based on card ID
    const spriteCol = (cardIndex % 10);
    const spriteRow = Math.floor(cardIndex / 10);
    const bgX = Math.min(spriteCol * (100 / 9), 100);
    const bgY = Math.min(spriteRow * 10, 100);

    const className = cn(
      'absolute inset-0 flex items-center justify-center rounded-xl font-extrabold select-none transition-all',
      styles.bg,
      styles.text,
      fontSize,
      value === 0 ? 'border-2 border-indigo-200/40' : cn('shadow-md', styles.glow),
      isMerged && !lowSpecMode && 'scale-115 z-10 ring-4 ring-amber-500/80 animate-bounce duration-150',
      isNew && !lowSpecMode && 'animate-pop',
      !lowSpecMode && 'duration-100',
    );

    return {
      className,
      style: value !== 0 ? {
        backgroundImage: cardImageRef.current ? `url('/card100.png')` : undefined,
        backgroundSize: '1000% 1100%',
        backgroundPosition: `${bgX}% ${bgY}%`,
        backgroundBlendMode: 'overlay',
        opacity: 0.95,
      } as React.CSSProperties : undefined,
    };
  };

  // ── Swipe direction arrow indicator ──
  const swipeIndicator = (): React.ReactNode => {
    if (!swipeDir) return null;
    const Arrows: Record<Direction, React.ReactNode> = {
      up: <ArrowUp className="w-8 h-8 animate-bounce" />,
      down: <ArrowDown className="w-8 h-8 animate-bounce" />,
      left: <ArrowLeftIcon className="w-8 h-8 animate-bounce" />,
      right: <ArrowRight className="w-8 h-8 animate-bounce" />,
    };
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="bg-indigo-600/30 rounded-full p-3">
          {Arrows[swipeDir]}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-slate-50/30 text-slate-800 font-sans select-none pb-12 overflow-x-hidden">
      {/* Header */}
      <header className="w-full h-16 flex items-center justify-between border-b border-slate-100 px-4 md:px-6 bg-white shrink-0">
        <button
          onClick={onExit}
          className="p-2 bg-slate-50 border border-slate-200/60 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-colors shadow-sm cursor-pointer text-slate-600 flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center flex items-center gap-2 justify-center">
          <div
            className="w-7 h-7 rounded-lg border border-amber-400 bg-cover bg-center"
            style={{
              backgroundImage: `url('/card100.png')`,
              backgroundSize: '1000% 1100%',
              backgroundPosition: `${((cardId - 1) % 10) * (100 / 9)}% ${Math.floor((cardId - 1) / 10) * (100 / 10)}%`,
              imageRendering: 'pixelated',
            }}
          />
          <h1 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">
            {t('mode_slide2048', language) || '2048'}
          </h1>
        </div>
        <button
          onClick={() => { playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); initGame(true); }}
          className="p-2 bg-slate-50 border border-slate-200/60 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-colors shadow-sm cursor-pointer text-slate-600 flex items-center justify-center"
        >
          <RotateCcw size={18} />
        </button>
      </header>

      <div className="w-full max-w-md px-4 mt-4 flex flex-col items-center">
        {/* Companion Card Info */}
        <div className="w-full bg-white rounded-2xl border border-slate-100 p-3 mb-4 flex items-center gap-3 shadow-xs">
          <div
            className="w-10 h-10 rounded-xl border border-amber-400 bg-cover bg-center shrink-0"
            style={{
              backgroundImage: `url('/card100.png')`,
              backgroundSize: '1000% 1100%',
              backgroundPosition: `${((cardId - 1) % 10) * (100 / 9)}% ${Math.floor((cardId - 1) / 10) * (100 / 10)}%`,
              imageRendering: 'pixelated',
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">
              {language === 'ko' ? '함께하는 캐릭터' : 'Companion'}
            </p>
            <p className="text-slate-800 text-xs font-bold truncate">
              {cardData?.title || cardData?.title_en || 'Hero'}
            </p>
          </div>
        </div>

        {/* Score Board */}
        <div className="flex items-center gap-3 w-full mb-4">
          <div className="flex-1 bg-white rounded-2xl border border-slate-100 py-2.5 text-center shadow-xs">
            <div className="text-[9px] text-indigo-500 uppercase tracking-widest font-bold">
              {language === 'ko' ? '점수' : 'SCORE'}
            </div>
            <div className="text-lg font-extrabold text-slate-850">{score.toLocaleString()}</div>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-slate-100 py-2.5 text-center shadow-xs">
            <div className="text-[9px] text-amber-500 uppercase tracking-widest font-bold flex items-center justify-center gap-1">
              <Trophy size={10} />
              {language === 'ko' ? '최고' : 'BEST'}
            </div>
            <div className="text-lg font-extrabold text-slate-850">{bestScore.toLocaleString()}</div>
          </div>
        </div>

        {/* Combo */}
        {showCombo && !lowSpecMode && (
          <div className="mb-3 px-4 py-1 bg-amber-50 border border-amber-250 text-amber-700 font-bold text-xs rounded-full shadow-xs animate-pop">
            🔥 {comboCount}x {language === 'ko' ? '연속 합체!' : 'COMBO!'}
          </div>
        )}

        {/* Game Board */}
        <div
          ref={containerRef}
          className="relative w-full aspect-square max-w-[340px] bg-slate-900/90 rounded-3xl border border-slate-950 p-2.5 shadow-xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Grid Background */}
          <div className="absolute inset-2.5 grid grid-cols-4 gap-2.5">
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
              <div key={i} className="rounded-xl bg-slate-800/40" />
            ))}
          </div>

          {/* Tiles */}
          <div className="relative w-full h-full">
            <div className="absolute inset-0 grid grid-cols-4 gap-2.5 p-0">
              {Array.from({ length: GRID_SIZE }).map((_, r) =>
                Array.from({ length: GRID_SIZE }).map((_, c) => {
                  const value = grid[r]?.[c] ?? 0;
                  const { className: tileClass, style } = tileStyle(value, r, c);
                  
                  // Add high value card premium frames decoration
                  const borderClass = value >= 64 ? 'ring-2 ring-amber-400 ring-offset-1 shadow-lg' : '';

                  return (
                    <div key={`${r}-${c}`} className="relative">
                      <div className="w-full pb-[100%]" />
                      <div className={cn(tileClass, borderClass)} style={style}>
                        {value !== 0 && value}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* Swipe direction visual */}
            {swipeIndicator()}
          </div>
        </div>

        {/* Controls Hint */}
        <div className="mt-4 flex items-center gap-4 text-slate-400">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="flex gap-1"><ArrowUp size={12} /></div>
            <div className="flex gap-1"><ArrowLeftIcon size={12} /><ArrowDown size={12} /><ArrowRight size={12} /></div>
            <span className="text-[9px] uppercase font-bold">{language === 'ko' ? '키보드' : 'KEYS'}</span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-[10px] font-medium leading-relaxed">
            {language === 'ko' ? '↔ 화면 스와이프로 타일을 합치세요' : '↔ Swipe screen to merge tiles'}
          </div>
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
          <div className="bg-white text-slate-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100/80 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-3">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Zap size={16} />
              </span>
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">
                {t('tutorial_title', language)}
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mb-6 whitespace-pre-line">
              {t('tutorial_slide2048', language)}
            </p>
            <button
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                setShowTutorial(false);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              {t('tutorial_start_game', language)}
            </button>
          </div>
        </div>
      )}

      {/* Win Notification Overlay */}
      {won && !gameOver && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl shadow-lg text-center animate-bounce text-xs font-bold whitespace-nowrap">
          {language === 'ko' ? '🎉 2048 달성! 계속해서 점수를 올리세요!' : '🎉 Reached 2048! Keep pushing the limits!'}
        </div>
      )}

      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
          <div className="bg-white text-slate-800 w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl border border-slate-100/80 p-6 text-center animate-in zoom-in-95 duration-200">
            <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-bounce" />
            <h3 className="text-xl font-bold text-slate-800 mb-1">
              {language === 'ko' ? '게임 오버' : 'Game Over'}
            </h3>
            <p className="text-sm font-medium text-slate-500 mb-4">
              {language === 'ko' ? `최종 점수: ${score.toLocaleString()}` : `Final Score: ${score.toLocaleString()}`}
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-3xl font-extrabold text-indigo-600">+{Math.floor(scoreRef.current / 10)}</span>
              <span className="text-xs font-semibold text-slate-400">SNS</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); initGame(true); }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>{language === 'ko' ? '다시 하기' : 'Play Again'}</span>
              </button>
              <button
                onClick={onExit}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/85 text-slate-700 font-semibold rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                {language === 'ko' ? '종료' : 'Exit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop animation keyframes */}
      {!lowSpecMode && (
        <style>{`
          @keyframes pop { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
          .animate-pop { animation: pop 0.2s ease-out; }
        `}</style>
      )}
    </div>
  );
};
