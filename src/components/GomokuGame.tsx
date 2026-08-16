import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, ZoomIn, ZoomOut, Move, Zap } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn, getAssetUrl } from '../lib/utils';

interface GomokuGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

type CellValue = '' | 'B' | 'W';

const BOARD_SIZE = 15;
const WIN_COUNT = 5;
const INITIAL_SCALE = 2.0;
const MIN_SCALE = 1.0;
const MAX_SCALE = 4.0;
const DRAG_THRESHOLD = 6;

export const GomokuGame: React.FC<GomokuGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cards1ImgRef = useRef<HTMLImageElement | null>(null);
  const cards2ImgRef = useRef<HTMLImageElement | null>(null);
  const rewardedRef = useRef(false);

  const gameRef = useRef({
    board: [] as CellValue[],
    turn: 'player' as 'player' | 'ai',
    gameOver: false,
    winner: '' as CellValue,
    winLine: null as number[] | null,
    lastMove: null as number | null,
  });

  // ── Zoom / Pan state ──
  const viewRef = useRef({ ox: 0, oy: 0, scale: INITIAL_SCALE });
  const pointerRef = useRef({ down: false, sx: 0, sy: 0, ox0: 0, oy0: 0, dragged: false });
  const [showTutorial, setShowTutorial] = useState(true);
  const showTutorialRef = useRef(showTutorial);
  useEffect(() => {
    showTutorialRef.current = showTutorial;
  }, [showTutorial]);
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');
  const [winner, setWinner] = useState<CellValue>('');
  const [renderTick, setRenderTick] = useState(0);
  const [viewScale, setViewScale] = useState(INITIAL_SCALE);
  const [isPanning, setIsPanning] = useState(false);

  // ── Init view → center the board at 2x ──
  const resetView = useCallback(() => {
    viewRef.current = { ox: 0, oy: 0, scale: INITIAL_SCALE };
    setViewScale(INITIAL_SCALE);
    setIsPanning(false);
    pointerRef.current = { down: false, sx: 0, sy: 0, ox0: 0, oy0: 0, dragged: false };
  }, []);

  const initGame = useCallback((forceSkipTutorial = false) => {
    const g = gameRef.current;
    g.board = Array(BOARD_SIZE * BOARD_SIZE).fill('') as CellValue[];
    g.turn = 'player';
    g.gameOver = false;
    g.winner = '';
    g.winLine = null;
    g.lastMove = null;
    rewardedRef.current = false;
    setPhase('playing');
    setWinner('');
    setRenderTick(0);
    resetView();
    if (forceSkipTutorial) {
      setShowTutorial(false);
    }
  }, [resetView]);

  useEffect(() => { initGame(); }, [initGame]);
  useEffect(() => {
    const img1 = new Image(); img1.src = getAssetUrl('/cards1.png'); cards1ImgRef.current = img1;
    const img2 = new Image(); img2.src = getAssetUrl('/cards2.png'); cards2ImgRef.current = img2;
  }, []);

  const [defeatCountdown, setDefeatCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (phase === 'ended' && winner === 'W') {
      setDefeatCountdown(5);
    } else {
      setDefeatCountdown(null);
    }
  }, [phase, winner]);

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

  useEffect(() => {
    if (phase !== 'ended' || rewardedRef.current) return;
    rewardedRef.current = true;
    const reward = winner === 'B' ? 50 : winner === 'W' ? 5 : 10;
    onReward(reward);
  }, [phase, winner, onReward]);

  // ── AI turn ──
  useEffect(() => {
    const g = gameRef.current;
    if (showTutorial || phase !== 'playing' || g.gameOver || g.turn !== 'ai') return;
    const timer = window.setTimeout(() => {
      const move = aiPick(g.board);
      if (move === null) return;
      g.board[move] = 'W';
      g.lastMove = move;
      const line = checkWin(g.board, Math.floor(move / BOARD_SIZE), move % BOARD_SIZE, 'W');
      if (line) {
        g.gameOver = true; g.winner = 'W'; g.winLine = line;
        setWinner('W'); setPhase('ended');
        playSfx('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
      } else if (g.board.every(cell => cell !== '')) {
        g.gameOver = true; g.winner = '';
        setWinner(''); setPhase('ended');
        playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      } else {
        g.turn = 'player';
      }
      setRenderTick(t => t + 1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [phase, renderTick, playSfx, showTutorial]);

  // ── Render loop ──
  useEffect(() => {
    const renderLoop = () => { renderCanvas(); animFrameRef.current = requestAnimationFrame(renderLoop); };
    animFrameRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const animFrameRef = useRef(0);

  // ── Canvas rendering with view transform ──
  const renderCanvas = () => {
    const g = gameRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    if (w === 0) return;
    const h = w;

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // ── Background ──
    ctx.fillStyle = '#f6d9a0';
    ctx.fillRect(0, 0, w, h);

    const { ox, oy, scale } = viewRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const padding = 12;
    const cellSize = (w - padding * 2) / (BOARD_SIZE - 1);
    const boardPixelW = (BOARD_SIZE - 1) * cellSize;

    // Transform: center origin, scale, then offset
    ctx.save();
    ctx.translate(cx + ox, cy + oy);
    ctx.scale(scale, scale);
    ctx.translate(-boardPixelW / 2 - padding, -boardPixelW / 2 - padding);

    // ── Board grid ──
    ctx.strokeStyle = '#5a3a1a';
    ctx.lineWidth = 1 / scale;
    ctx.beginPath();
    for (let i = 0; i < BOARD_SIZE; i++) {
      const x = padding + i * cellSize;
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + boardPixelW);
      const y = padding + i * cellSize;
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + boardPixelW, y);
    }
    ctx.stroke();

    // Star points
    const starPts = [3, 7, 11];
    ctx.fillStyle = '#5a3a1a';
    for (const r of starPts) {
      for (const c of starPts) {
        ctx.beginPath();
        ctx.arc(padding + c * cellSize, padding + r * cellSize, Math.max(1.5, cellSize * 0.08), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Stones with card sprites ──
    const drawCard = (cardId: number, cx2: number, cy2: number, size: number) => {
      const idx2 = CARD_DATABASE[cardId] ? cardId : 1;
      const isCards2 = idx2 >= 101;
      const targetImg = isCards2 ? cards2ImgRef.current : cards1ImgRef.current;
      if (!targetImg || !targetImg.complete || targetImg.naturalWidth <= 0) return;
      const col = isCards2 ? (idx2 - 101) % 10 : (idx2 - 1) % 10;
      const row = isCards2 ? 0 : Math.floor(((idx2 - 1) % 100) / 10);
      const sw = targetImg.naturalWidth / 10;
      const sh = targetImg.naturalHeight / 10;
      ctx.drawImage(targetImg, col * sw, row * sh, sw, sh, cx2 - size / 2, cy2 - size / 2, size, size);
    };

    const stoneRadius = cellSize * 0.42;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const idx = r * BOARD_SIZE + c;
        const x = padding + c * cellSize;
        const y = padding + r * cellSize;
        const value = g.board[idx];
        if (value === 'B') {
          ctx.save();
          ctx.beginPath(); ctx.arc(x, y, stoneRadius, 0, Math.PI * 2); ctx.clip();
          ctx.fillStyle = '#0b0b0b'; ctx.fill();
          drawCard((r * BOARD_SIZE + c) % 110 + 1, x, y, stoneRadius * 2);
          ctx.restore();
          ctx.strokeStyle = '#333'; ctx.lineWidth = 1 / scale;
          ctx.beginPath(); ctx.arc(x, y, stoneRadius, 0, Math.PI * 2); ctx.stroke();
        } else if (value === 'W') {
          ctx.save();
          ctx.beginPath(); ctx.arc(x, y, stoneRadius, 0, Math.PI * 2); ctx.clip();
          ctx.fillStyle = '#fafafa'; ctx.fill();
          drawCard(((r * BOARD_SIZE + c) * 3) % 110 + 1, x, y, stoneRadius * 2);
          ctx.restore();
          ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1 / scale;
        }
      }
    }

    // Last move indicator
    if (g.lastMove !== null && g.lastMove !== undefined) {
      const lmIdx = g.lastMove;
      const lx = padding + (lmIdx % BOARD_SIZE) * cellSize;
      const ly = padding + Math.floor(lmIdx / BOARD_SIZE) * cellSize;
      ctx.strokeStyle = '#f59e0b'; // Amber-500
      ctx.lineWidth = Math.max(2, cellSize * 0.12) / scale;
      ctx.beginPath();
      // Pulsing effect based on timestamp
      const pulseRadius = stoneRadius * (1.1 + Math.sin(Date.now() / 150) * 0.15);
      ctx.arc(lx, ly, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Win line
    if (g.winLine && g.winLine.length > 0) {
      ctx.strokeStyle = '#ff3b3b';
      ctx.lineWidth = Math.max(3, cellSize * 0.18) / scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < g.winLine.length; i++) {
        const idx = g.winLine[i];
        const x = padding + (idx % BOARD_SIZE) * cellSize;
        const y = padding + Math.floor(idx / BOARD_SIZE) * cellSize;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.restore();
  };

  // ── Zoom controls ──
  const zoomIn = useCallback(() => {
    viewRef.current.scale = Math.min(MAX_SCALE, viewRef.current.scale + 0.5);
    setViewScale(viewRef.current.scale);
  }, []);
  const zoomOut = useCallback(() => {
    viewRef.current.scale = Math.max(MIN_SCALE, viewRef.current.scale - 0.5);
    setViewScale(viewRef.current.scale);
  }, []);

  // ── Wheel scroll zoom ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      if (showTutorialRef.current || gameRef.current.gameOver) return;
      e.preventDefault();
      const delta = e.deltaY;
      const zoomFactor = 0.12;
      let nextScale = viewRef.current.scale;

      if (delta < 0) {
        nextScale = Math.min(MAX_SCALE, nextScale + zoomFactor);
      } else {
        nextScale = Math.max(MIN_SCALE, nextScale - zoomFactor);
      }

      viewRef.current.scale = nextScale;
      setViewScale(nextScale);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // ── Pointer events: pan + click ──
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointerRef.current = {
      down: true,
      sx: e.clientX, sy: e.clientY,
      ox0: viewRef.current.ox, oy0: viewRef.current.oy,
      dragged: false,
    };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointerRef.current.down) return;
    const dx = e.clientX - pointerRef.current.sx;
    const dy = e.clientY - pointerRef.current.sy;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      pointerRef.current.dragged = true;
      setIsPanning(true);
    }
    viewRef.current.ox = pointerRef.current.ox0 + dx;
    viewRef.current.oy = pointerRef.current.oy0 + dy;
  }, []);

  // ── Convert screen coord → board index, then place stone ──
  const placeStone = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gameRef.current;
    if (showTutorialRef.current || phase !== 'playing' || g.gameOver || g.turn !== 'player') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const padding = 12;
    const cellSize = (w - padding * 2) / (BOARD_SIZE - 1);
    const boardPixelW = (BOARD_SIZE - 1) * cellSize;
    const { scale, ox, oy } = viewRef.current;
    const cx = w / 2;

    // Inverse transform: screen → board coords
    const sx = (e.clientX - rect.left - cx - ox) / scale + boardPixelW / 2 + padding;
    const sy = (e.clientY - rect.top - cx - oy) / scale + boardPixelW / 2 + padding;

    const col = Math.round((sx - padding) / cellSize);
    const row = Math.round((sy - padding) / cellSize);
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;

    const nearestX = padding + col * cellSize;
    const nearestY = padding + row * cellSize;
    if (Math.hypot(sx - nearestX, sy - nearestY) > cellSize * 0.72) return;

    const idx = row * BOARD_SIZE + col;
    if (g.board[idx] !== '') return;

    g.board[idx] = 'B';
    g.lastMove = idx;
    const line = checkWin(g.board, row, col, 'B');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

    if (line) {
      g.gameOver = true; g.winner = 'B'; g.winLine = line;
      setWinner('B'); setPhase('ended');
    } else if (g.board.every(cell => cell !== '')) {
      g.gameOver = true; g.winner = '';
      setWinner(''); setPhase('ended');
    } else {
      g.turn = 'ai';
    }
    setRenderTick(t => t + 1);
  }, [phase, playSfx]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsPanning(false);
    if (!pointerRef.current.down) return;
    pointerRef.current.down = false;

    // If not dragged → treat as click (place stone)
    if (!pointerRef.current.dragged) {
      placeStone(e);
    }
    pointerRef.current.dragged = false;
  }, [phase, playSfx, placeStone]);

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-50/30 text-slate-800 flex flex-col items-center justify-between font-sans select-none pb-2 w-full overflow-hidden">
      {/* Header */}
      <header className="w-full h-14 flex items-center justify-between border-b border-slate-100 px-4 md:px-6 bg-white shrink-0">
        <button
          onClick={onExit}
          className="p-2 bg-slate-50 border border-slate-200/60 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-colors shadow-sm cursor-pointer text-slate-600 flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h1 className="text-sm md:text-base font-bold text-slate-800 tracking-tight">
            {language === 'ko' ? '오목' : 'Gomoku'}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-0.5 text-[9px] sm:text-[10px] font-bold text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-black border border-slate-700" />
              {language === 'ko' ? '나' : 'Me'}
            </span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white border border-slate-350" />
              AI
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            initGame(true);
          }}
          className="p-2 bg-slate-50 border border-slate-200/60 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-colors shadow-sm cursor-pointer text-slate-600 flex items-center justify-center"
        >
          <RotateCcw size={18} />
        </button>
      </header>

      {/* Zoom controls */}
      <div className="flex items-center gap-2 my-2 px-3 py-1 bg-white border border-slate-150 rounded-full shadow-xs shrink-0">
        <button
          onClick={zoomOut}
          disabled={viewScale <= MIN_SCALE}
          className="p-1.5 text-slate-500 hover:text-indigo-650 disabled:opacity-30 transition-colors cursor-pointer"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-xs font-bold text-slate-600 min-w-[40px] text-center">
          {viewScale.toFixed(1)}x
        </span>
        <button
          onClick={zoomIn}
          disabled={viewScale >= MAX_SCALE}
          className="p-1.5 text-slate-500 hover:text-indigo-650 disabled:opacity-30 transition-colors cursor-pointer"
        >
          <ZoomIn size={16} />
        </button>
        <div className="w-px h-3 bg-slate-200" />
        <button
          onClick={resetView}
          className="p-1.5 text-slate-500 hover:text-indigo-650 transition-colors cursor-pointer"
          title={language === 'ko' ? '위치 초기화' : 'Reset View'}
        >
          <Move size={16} />
        </button>
      </div>

      {/* Board canvas (Responsive Wrapper) */}
      <div className="w-full max-w-md px-4 flex-1 min-h-0 flex items-center justify-center">
        <div
          className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/5 shadow-xl w-full max-w-[340px] max-h-[60vh] aspect-square"
          style={{ touchAction: 'none', cursor: isPanning ? 'grabbing' : 'grab' }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        </div>
      </div>

      {/* Hint */}
      <p className="py-1 text-[9px] sm:text-[10px] font-bold text-slate-400 text-center tracking-wide shrink-0">
        {language === 'ko'
          ? '드래그: 이동  |  클릭: 돌 놓기  |  +/- : 확대/축소'
          : 'Drag: pan  |  Click: place  |  +/- : zoom'}
      </p>

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
              {t('tutorial_gomoku', language)}
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

      {/* Game over panel */}
      {phase === 'ended' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
          <div className="bg-white text-slate-800 w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl border border-slate-100/80 p-6 text-center animate-in zoom-in-95 duration-200">
            <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-bounce" />
            <h3 className="text-xl font-bold text-slate-800 mb-1">
              {winner === 'B' ? (language === 'ko' ? '승리!' : 'Victory!')
                : winner === 'W' ? (language === 'ko' ? '패배...' : 'Defeat...')
                : (language === 'ko' ? '무승부' : 'Draw')}
            </h3>
            <p className="text-sm font-medium text-slate-500 mb-4">
              {winner === 'B'
                ? (language === 'ko' ? '환상적인 전술이었습니다!' : 'Fantastic tactics!')
                : (language === 'ko' ? '다음 판에 도전해 보세요.' : 'Try your luck in the next game.')}
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-3xl font-extrabold text-indigo-600">
                +{winner === 'B' ? 50 : winner === 'W' ? 5 : 10}
              </span>
              <span className="text-xs font-semibold text-slate-400">SNS</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  initGame(true);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>{language === 'ko' ? '한판 더' : 'Play Again'}</span>
              </button>
              <button
                onClick={onExit}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/85 text-slate-700 font-semibold rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                {language === 'ko' 
                  ? `종료${defeatCountdown !== null ? ` (${defeatCountdown}초)` : ''}` 
                  : `Exit${defeatCountdown !== null ? ` (${defeatCountdown}s)` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Helper functions ──
function checkWin(board: CellValue[], row: number, col: number, value: CellValue): number[] | null {
  if (!value) return null;
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]] as const) {
    const line: number[] = [row * BOARD_SIZE + col];
    for (const sign of [-1, 1] as const) {
      let r = row + dr * sign, c = col + dc * sign;
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r * BOARD_SIZE + c] === value) {
        line.push(r * BOARD_SIZE + c); r += dr * sign; c += dc * sign;
      }
    }
    if (line.length >= WIN_COUNT) return line.slice(0, WIN_COUNT);
  }
  return null;
}

function scoreMove(board: CellValue[], row: number, col: number, player: CellValue): number {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE || board[row * BOARD_SIZE + col] !== '') return 0;
  let score = 0;
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]] as const) {
    let count = 1, openEnds = 0;
    for (const dir of [-1, 1] as const) {
      let r = row + dr * dir, c = col + dc * dir, consecutive = 0;
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r * BOARD_SIZE + c] === player) {
        consecutive++; r += dr * dir; c += dc * dir;
      }
      count += consecutive;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r * BOARD_SIZE + c] === '') openEnds++;
    }
    if (count >= 5) score += 100000;
    else if (count === 4 && openEnds > 0) score += 10000;
    else if (count === 3 && openEnds === 2) score += 5000;
    else if (count === 3 && openEnds === 1) score += 500;
    else if (count === 2 && openEnds === 2) score += 200;
    else if (count === 2 && openEnds === 1) score += 50;
    else if (count === 1 && openEnds === 2) score += 20;
  }
  return score;
}

function aiPick(board: CellValue[]): number | null {
  if (!board.some(cell => cell !== '')) return 7 * BOARD_SIZE + 7;
  const candidates: { idx: number; score: number }[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const idx = r * BOARD_SIZE + c;
      if (board[idx] !== '') continue;
      let hasNeighbor = false;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr * BOARD_SIZE + nc] !== '') hasNeighbor = true;
        }
      }
      if (!hasNeighbor) continue;
      candidates.push({ idx, score: scoreMove(board, r, c, 'W') * 1.1 + scoreMove(board, r, c, 'B') });
    }
  }
  if (candidates.length === 0) {
    for (let r = 0; r < BOARD_SIZE; r++) for (let c = 0; c < BOARD_SIZE; c++) if (board[r * BOARD_SIZE + c] === '') return r * BOARD_SIZE + c;
    return null;
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].idx;
}
