import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';

interface TictactoeGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const MIN_BOARD_SIZE = 3;
const MAX_BOARD_SIZE = 12;
const SIZE_STEPS = [3, 6, 12];

type CellValue = '' | 'X' | 'O';

export const TictactoeGame: React.FC<TictactoeGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const playerCardId = (() => {
    const c = deck[0];
    const id = typeof c?.id === 'number' ? c.id : 1;
    return CARD_DATABASE[id] ? id : 1;
  })();
  const aiCardId = (() => {
    const c = deck[1] || deck[0];
    const id = typeof c?.id === 'number' ? c.id : 2;
    return CARD_DATABASE[id] ? id : 2;
  })();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);
  const cardImgRef = useRef<HTMLImageElement | null>(null);
  const rewardedRef = useRef(false);

  const boardSizeRef = useRef(MIN_BOARD_SIZE);
  const [boardSize, setBoardSize] = useState(MIN_BOARD_SIZE);

  const gameRef = useRef({
    board: [] as CellValue[],
    isPlayerTurn: true,
    isGameOver: false,
    winner: '' as CellValue,
    winLine: null as number[] | null,
    animTimer: 0,
    aiThinking: false,
  });

  const [hudGameOver, setHudGameOver] = useState(false);
  const [hudWinner, setHudWinner] = useState<CellValue>('');
  const animTimerRef = useRef(0);

  useEffect(() => {
    const img = new Image();
    img.src = '/card100.png';
    cardImgRef.current = img;
  }, []);

  const cellIndex = (row: number, col: number, size: number) => row * size + col;
  const boardPoint = (index: number, size: number) => ({ row: Math.floor(index / size), col: index % size });

  const buildWinLines = (size: number): number[][] => {
    const lines: number[][] = [];

    for (let r = 0; r < size; r++) {
      const line: number[] = [];
      for (let c = 0; c < size; c++) line.push(cellIndex(r, c, size));
      lines.push(line);
    }

    for (let c = 0; c < size; c++) {
      const line: number[] = [];
      for (let r = 0; r < size; r++) line.push(cellIndex(r, c, size));
      lines.push(line);
    }

    for (let k = -(size - 1); k <= size - 1; k++) {
      const main: number[] = [];
      const anti: number[] = [];
      for (let r = 0; r < size; r++) {
        if (r + k >= 0 && r + k < size) main.push(cellIndex(r, r + k, size));
        if (size - 1 - r + k >= 0 && size - 1 - r + k < size) anti.push(cellIndex(r, size - 1 - r + k, size));
      }
      if (main.length >= MIN_BOARD_SIZE) lines.push(main);
      if (anti.length >= MIN_BOARD_SIZE) lines.push(anti);
    }

    return lines;
  };

  const getWinLinesForSize = (size: number) => buildWinLines(size);

  const checkWin = (board: CellValue[], size: number): { winner: CellValue; line: number[] | null } => {
    const lines = getWinLinesForSize(size);
    for (const line of lines) {
      for (let i = 0; i <= line.length - 3; i++) {
        const a = line[i];
        const b = line[i + 1];
        const c = line[i + 2];
        if (board[a] && board[a] === board[b] && board[b] === board[c]) {
          return { winner: board[a], line: [a, b, c] };
        }
      }
    }
    return { winner: '', line: null };
  };

  const isBoardFull = (board: CellValue[]): boolean => {
    return board.every(cell => cell !== '');
  };

  const expandBoard = (board: CellValue[], oldSize: number): { board: CellValue[]; size: number } => {
    const idx = SIZE_STEPS.indexOf(oldSize);
    const nextIdx = Math.min(idx + 1, SIZE_STEPS.length - 1);
    const newSize = SIZE_STEPS[nextIdx];
    const newBoard = Array(newSize * newSize).fill('') as CellValue[];
    const offsetR = Math.floor((newSize - oldSize) / 2);
    const offsetC = Math.floor((newSize - oldSize) / 2);

    for (let r = 0; r < oldSize; r++) {
      for (let c = 0; c < oldSize; c++) {
        newBoard[cellIndex(r + offsetR, c + offsetC, newSize)] = board[cellIndex(r, c, oldSize)];
      }
    }

    return { board: newBoard, size: newSize };
  };

  const scoreLineMove = (cells: CellValue[]) => {
    for (let i = 0; i <= cells.length - 3; i++) {
      const a = cells[i];
      const b = cells[i + 1];
      const c = cells[i + 2];
      if (a !== '' && a === b && b === c) return null;
      if (a === '') {
        if (b !== '' && b === c) return i;
      } else if (b === '' && a === c) {
        return i + 1;
      } else if (c === '' && a === b) {
        return i + 2;
      }
    }
    return null;
  };

  const getAiMove = (board: CellValue[], size: number): number => {
    const lines = getWinLinesForSize(size);
    for (const line of lines) {
      if (line.length < 3) continue;
      const cells = line.map((i) => board[i]);
      const move = scoreLineMove(cells);
      if (move !== null && cells[move] === '' && cells.filter((x) => x === 'O').length === 2) {
        return line[move];
      }
    }

    for (const line of lines) {
      if (line.length < 3) continue;
      const cells = line.map((i) => board[i]);
      const move = scoreLineMove(cells);
      if (move !== null && cells[move] === '' && cells.filter((x) => x === 'X').length === 2) {
        return line[move];
      }
    }

    const center = cellIndex(Math.floor(size / 2), Math.floor(size / 2), size);
    if (board[center] === '') return center;

    const corners = [];
    for (const r of [0, size - 1]) {
      for (const c of [0, size - 1]) corners.push(cellIndex(r, c, size));
    }
    const emptyCorners = corners.filter(i => board[i] === '');
    if (emptyCorners.length > 0) return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];

    const empty = board.map((cell, idx) => (cell === '' ? idx : -1)).filter(idx => idx >= 0);
    return empty[Math.floor(Math.random() * empty.length)];
  };

  const initGame = useCallback((size?: number) => {
    const g = gameRef.current;
    const nextSize = size ?? boardSizeRef.current;
    g.board = Array(nextSize * nextSize).fill('') as CellValue[];
    g.isPlayerTurn = true;
    g.isGameOver = false;
    g.winner = '';
    g.winLine = null;
    g.animTimer = 0;
    g.aiThinking = false;
    rewardedRef.current = false;
    setHudGameOver(false);
    setHudWinner('');
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (hudGameOver && !rewardedRef.current) {
      rewardedRef.current = true;
      const reward = hudWinner === 'X' ? 50 : hudWinner === 'O' ? 0 : 10;
      onReward(reward);
    }
  }, [hudGameOver, hudWinner, onReward]);

  const handleCellClick = useCallback((index: number) => {
    const g = gameRef.current;
    const size = boardSizeRef.current;
    if (g.isGameOver || !g.isPlayerTurn || g.board[index] !== '' || g.aiThinking) return;

    g.board[index] = 'X';

    const result = checkWin(g.board, size);
    if (result.winner) {
      g.isGameOver = true;
      g.winner = result.winner;
      g.winLine = result.line;
      setHudGameOver(true);
      setHudWinner(result.winner);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      return;
    }

    if (isBoardFull(g.board)) {
      if (size >= MAX_BOARD_SIZE) {
        g.isGameOver = true;
        g.winner = '';
        g.winLine = null;
        setHudGameOver(true);
        setHudWinner('');
        playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        return;
      }

      const prevPlayerTurn = g.isPlayerTurn;
      const expanded = expandBoard(g.board, size);
      boardSizeRef.current = expanded.size;
      setBoardSize(expanded.size);
      g.board = expanded.board;
      g.isGameOver = false;
      g.winner = '';
      g.winLine = null;
      setHudGameOver(false);
      setHudWinner('');

      const shouldAiMove = !prevPlayerTurn;
      if (!shouldAiMove) {
        return;
      }
    }

    g.isPlayerTurn = false;
    g.aiThinking = true;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

    setTimeout(() => {
      const aiMove = getAiMove(g.board, boardSizeRef.current);
      g.board[aiMove] = 'O';
      g.aiThinking = false;

      const nextSize = boardSizeRef.current;
      const aiResult = checkWin(g.board, nextSize);
      if (aiResult.winner) {
        g.isGameOver = true;
        g.winner = aiResult.winner;
        g.winLine = aiResult.line;
        setHudGameOver(true);
        setHudWinner(aiResult.winner);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
        return;
      }

      if (isBoardFull(g.board)) {
        if (nextSize >= MAX_BOARD_SIZE) {
          g.isGameOver = true;
          g.winner = '';
          g.winLine = null;
          setHudGameOver(true);
          setHudWinner('');
          playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          return;
        }

        const expanded = expandBoard(g.board, nextSize);
        boardSizeRef.current = expanded.size;
        setBoardSize(expanded.size);
        g.board = expanded.board;
        g.isGameOver = false;
        g.winner = '';
        g.winLine = null;
        setHudGameOver(false);
        setHudWinner('');
      }

      g.isPlayerTurn = true;
    }, 500);
  }, [playSfx]);

  useEffect(() => {
    const renderLoop = (timestamp: number) => {
      animTimerRef.current = timestamp;
      renderCanvas(timestamp);
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };
    animFrameRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [language, lowSpecMode, boardSize, playerCardId, aiCardId]);

  const renderCanvas = (timestamp: number) => {
    const g = gameRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = boardSizeRef.current;
    const cellSize = CANVAS_SIZE / size;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (let i = 1; i < size; i++) {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 8);
      ctx.lineTo(i * cellSize, CANVAS_SIZE - 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, i * cellSize);
      ctx.lineTo(8, CANVAS_SIZE - i * cellSize);
      ctx.stroke();
    }

    const img = cardImgRef.current;
    const drawCard = (cardId: number, cx: number, cy: number, size: number) => {
      if (!img || !img.complete || img.naturalWidth <= 0) {
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
        return;
      }
      const idx = CARD_DATABASE[cardId] ? cardId : 1;
      const col = (idx - 1) % 10;
      const row = Math.floor((idx - 1) / 10);
      const spriteW = img.naturalWidth / 10;
      const spriteH = img.naturalHeight / 11;
      ctx.drawImage(img, col * spriteW, row * spriteH, spriteW, spriteH, cx - size / 2, cy - size / 2, size, size);
    };

    for (let i = 0; i < size * size; i++) {
      const row = Math.floor(i / size);
      const col = i % size;
      const cx = col * cellSize + cellSize / 2;
      const cy = row * cellSize + cellSize / 2;
      const cell = g.board[i];

      if (cell === 'X') {
        ctx.save();
        if (g.winLine && g.winLine.includes(i)) {
          ctx.globalAlpha = 0.8 + 0.2 * Math.sin(timestamp / 200);
        }
        drawCard(playerCardId, cx, cy, cellSize - 12);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, cellSize / 2 - 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (cell === 'O') {
        ctx.save();
        if (g.winLine && g.winLine.includes(i)) {
          ctx.globalAlpha = 0.8 + 0.2 * Math.sin(timestamp / 200);
        }
        drawCard(aiCardId, cx, cy, cellSize - 12);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, cellSize / 2 - 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (!g.isGameOver && g.isPlayerTurn && !g.aiThinking) {
        ctx.save();
        ctx.globalAlpha = 0.08 + 0.04 * Math.sin(timestamp / 300);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(col * cellSize + 4, row * cellSize + 4, cellSize - 8, cellSize - 8);
        ctx.restore();
      }
    }

    if (g.winLine && g.winLine.length >= 2) {
      const a = g.winLine[0];
      const c = g.winLine[g.winLine.length - 1];
      const start = boardPoint(a, size);
      const end = boardPoint(c, size);

      ctx.save();
      ctx.strokeStyle = g.winner === 'X' ? '#3b82f6' : '#ef4444';
      ctx.lineWidth = 4;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = lowSpecMode ? 0 : 10;
      ctx.beginPath();
      ctx.moveTo(start.col * cellSize + cellSize / 2, start.row * cellSize + cellSize / 2);
      ctx.lineTo(end.col * cellSize + cellSize / 2, end.row * cellSize + cellSize / 2);
      ctx.stroke();
      ctx.restore();
    }

    if (g.aiThinking) {
      ctx.save();
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(timestamp / 200);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(language === 'ko' ? 'AI 생각 중...' : 'AI thinking...', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
      ctx.restore();
    }
  };

  const CANVAS_SIZE = 300;

  const handleCanvasClick = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const g = gameRef.current;
    if (g.isGameOver || g.aiThinking) return;

    const size = boardSizeRef.current;
    const cellSize = CANVAS_SIZE / size;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const col = Math.floor(px / cellSize);
    const row = Math.floor(py / cellSize);
    if (col < 0 || col >= size || row < 0 || row >= size) return;
    const index = row * size + col;
    handleCellClick(index);
  };

  const getResultText = () => {
    const g = gameRef.current;
    if (g.winner === 'X') return language === 'ko' ? '승리!' : 'YOU WIN!';
    if (g.winner === 'O') return language === 'ko' ? '패배!' : 'YOU LOSE!';
    return language === 'ko' ? '무승부!' : 'DRAW!';
  };

  const getRewardText = () => {
    const g = gameRef.current;
    const reward = g.winner === 'X' ? 50 : g.winner === 'O' ? 0 : 10;
    return t('tictactoe_reward', language).replace('{amount}', String(reward));
  };

  const currentSize = boardSizeRef.current;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center font-sans select-none">
      <header className="w-full max-w-md flex items-center justify-between p-3">
        <button onClick={onExit} className="p-2 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black uppercase tracking-tight">{t('mode_tictactoe', language)}</h1>
          <p className="text-[10px] text-slate-400 font-bold">
            {language === 'ko' ? `${currentSize}x${currentSize} 보드` : `${currentSize}x${currentSize} board`}
          </p>
        </div>
        <div className="w-20" />
      </header>

      <div className="flex items-center gap-4 mb-3 text-sm font-bold">
        <div className="flex items-center gap-1">
          <span className="text-blue-400">{language === 'ko' ? '나' : 'YOU'}</span>
        </div>
        <span className="text-slate-500">vs</span>
        <div className="flex items-center gap-1">
          <span className="text-red-400">AI</span>
        </div>
      </div>

      <div
        className={cn('relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl')}
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, touchAction: 'none' }}
        onPointerDown={handleCanvasClick}
      >
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="w-full h-full" />

        {hudGameOver && (
          <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl">
              <Trophy size={42} className={cn('mx-auto mb-3', gameRef.current.winner === 'O' ? 'text-red-500' : 'text-amber-500')} />
              <h2 className="text-xl font-black mb-2">{getResultText()}</h2>
              <p className="text-sm font-bold text-indigo-600 mb-4">{getRewardText()}</p>
              <div className="flex gap-2">
                <button onClick={() => initGame(currentSize)} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 cursor-pointer">
                  <RotateCcw size={16} />
                  {language === 'ko' ? '재시작' : 'Restart'}
                </button>
                <button onClick={onExit} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black cursor-pointer">
                  {t('home', language)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 px-4 py-2 bg-white/5 rounded-2xl text-[10px] text-slate-400 font-bold text-center max-w-md">
        {language === 'ko'
          ? '셀을 탭하여 X를 놓으세요 | AI는 자동으로 응답합니다 | 무승부 시 보드가 확장됩니다'
          : 'Tap a cell to place X | AI responds automatically | Board expands on draw'}
      </div>
    </div>
  );
};
