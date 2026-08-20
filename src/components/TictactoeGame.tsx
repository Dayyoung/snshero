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

export type TictactoeDifficulty = 'easy' | 'normal' | 'hard';

export interface TictactoeDifficultyConfig {
  nameKo: string;
  nameEn: string;
  initialSize: number;
  aiSmartness: number; // 0..1 probability of optimal move vs random
  reward: {
    win: number;
    draw: number;
    loss: number;
  };
}

export const TICTACTOE_DIFFICULTY_CONFIG: Record<TictactoeDifficulty, TictactoeDifficultyConfig> = {
  easy: {
    nameKo: '쉬움',
    nameEn: 'Easy',
    initialSize: 3,
    aiSmartness: 0.45,
    reward: { win: 30, draw: 12, loss: 8 }
  },
  normal: {
    nameKo: '보통',
    nameEn: 'Normal',
    initialSize: 3,
    aiSmartness: 0.85,
    reward: { win: 45, draw: 18, loss: 10 }
  },
  hard: {
    nameKo: '어려움 (6x6)',
    nameEn: 'Hard (6x6)',
    initialSize: 6,
    aiSmartness: 0.95,
    reward: { win: 60, draw: 24, loss: 15 }
  }
};

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

  const [difficulty, setDifficulty] = useState<TictactoeDifficulty>('normal');
  const dCfg = TICTACTOE_DIFFICULTY_CONFIG[difficulty];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);
  const cardImgRef = useRef<HTMLImageElement | null>(null);
  const rewardedRef = useRef(false);

  const boardSizeRef = useRef(dCfg.initialSize);
  const [boardSize, setBoardSize] = useState(dCfg.initialSize);

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
  const [earnedReward, setEarnedReward] = useState(0);
  const [defeatCountdown, setDefeatCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (hudGameOver && hudWinner === 'O') {
      setDefeatCountdown(5);
    } else {
      setDefeatCountdown(null);
    }
  }, [hudGameOver, hudWinner]);

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

  const getAiMove = (board: CellValue[], size: number, diffKey: TictactoeDifficulty = difficulty): number => {
    const cfg = TICTACTOE_DIFFICULTY_CONFIG[diffKey];
    const empty = board.map((cell, idx) => (cell === '' ? idx : -1)).filter(idx => idx >= 0);
    if (empty.length === 0) return 0;

    // In easy or normal mode, occasionally make random moves
    if (Math.random() > cfg.aiSmartness) {
      return empty[Math.floor(Math.random() * empty.length)];
    }

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

    return empty[Math.floor(Math.random() * empty.length)];
  };

  const initGame = useCallback((size?: number, diffKey: TictactoeDifficulty = difficulty) => {
    const cfg = TICTACTOE_DIFFICULTY_CONFIG[diffKey];
    const nextSize = size ?? cfg.initialSize;
    boardSizeRef.current = nextSize;
    setBoardSize(nextSize);

    const g = gameRef.current;
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
    setEarnedReward(0);
  }, [difficulty]);

  useEffect(() => {
    initGame(undefined, difficulty);
  }, [difficulty, initGame]);

  const calcReward = useCallback((winner: CellValue, diffKey: TictactoeDifficulty) => {
    const cfg = TICTACTOE_DIFFICULTY_CONFIG[diffKey];
    if (winner === 'X') return cfg.reward.win;
    if (winner === 'O') return cfg.reward.loss;
    return cfg.reward.draw;
  }, []);

  useEffect(() => {
    if (hudGameOver && !rewardedRef.current) {
      rewardedRef.current = true;
      const finalReward = calcReward(hudWinner, difficulty);
      setEarnedReward(finalReward);
      onReward(finalReward);
    }
  }, [calcReward, difficulty, hudGameOver, hudWinner, onReward]);

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
      const aiMove = getAiMove(g.board, boardSizeRef.current, difficulty);
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
    }, 450);
  }, [difficulty, playSfx]);

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

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;

    for (let r = 1; r < size; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellSize);
      ctx.lineTo(CANVAS_SIZE, r * cellSize);
      ctx.stroke();
    }
    for (let c = 1; c < size; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellSize, 0);
      ctx.lineTo(c * cellSize, CANVAS_SIZE);
      ctx.stroke();
    }

    const img = cardImgRef.current;
    const drawCardSprite = (cardId: number, cx: number, cy: number, sz: number) => {
      if (!img || !img.complete || img.naturalWidth <= 0) {
        ctx.fillStyle = cardId === playerCardId ? '#3b82f6' : '#ef4444';
        ctx.fillRect(cx - sz / 2, cy - sz / 2, sz, sz);
        return;
      }
      const idx = CARD_DATABASE[cardId] ? cardId : 1;
      const col = (idx - 1) % 10;
      const row = Math.floor((idx - 1) / 10);
      const spriteW = img.naturalWidth / 10;
      const spriteH = img.naturalHeight / 11;
      ctx.drawImage(img, col * spriteW, row * spriteH, spriteW, spriteH, cx - sz / 2, cy - sz / 2, sz, sz);
    };

    const cardSize = cellSize * 0.75;

    for (let i = 0; i < g.board.length; i++) {
      const cell = g.board[i];
      if (cell === '') continue;
      const { row, col } = boardPoint(i, size);
      const cx = col * cellSize + cellSize / 2;
      const cy = row * cellSize + cellSize / 2;

      if (cell === 'X') {
        drawCardSprite(playerCardId, cx, cy, cardSize);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - cardSize / 2, cy - cardSize / 2, cardSize, cardSize);
      } else if (cell === 'O') {
        drawCardSprite(aiCardId, cx, cy, cardSize);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - cardSize / 2, cy - cardSize / 2, cardSize, cardSize);
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
      ctx.font = 'bold 14px monospace';
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
    if (g.winner === 'X') return language === 'ko' ? '[승리!]' : '[YOU WIN!]';
    if (g.winner === 'O') return language === 'ko' ? '[패배!]' : '[YOU LOSE!]';
    return language === 'ko' ? '[무승부!]' : '[DRAW!]';
  };

  const currentSize = boardSizeRef.current;

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-950 text-white flex flex-col items-center justify-between font-mono select-none overflow-hidden pb-3">
      <header className="w-full max-w-md flex items-center justify-between px-3 py-2 shrink-0">
        <button onClick={onExit} className="p-2 rounded-sm bg-white/10 hover:bg-white/15 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h1 className="text-sm sm:text-base font-bold tracking-tight">{t('mode_tictactoe', language)}</h1>
          <p className="text-[10px] text-slate-400 font-bold">
            {language === 'ko' ? `${currentSize}x${currentSize} 격자 전장` : `${currentSize}x${currentSize} grid`}
          </p>
        </div>
        <div className="px-2 py-1 bg-white/10 rounded-sm text-xs font-bold">
          {gameRef.current.isPlayerTurn ? 'YOU TURN' : 'AI TURN'}
        </div>
      </header>

      {/* Difficulty Selector Tabs */}
      <div className="w-full max-w-md px-3 flex items-center justify-between gap-1 shrink-0">
        <div className="flex items-center gap-1">
          {(['easy', 'normal', 'hard'] as TictactoeDifficulty[]).map((d) => {
            const active = difficulty === d;
            const dName = language === 'ko' ? TICTACTOE_DIFFICULTY_CONFIG[d].nameKo : TICTACTOE_DIFFICULTY_CONFIG[d].nameEn;
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  if (difficulty !== d) {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    setDifficulty(d);
                    initGame(TICTACTOE_DIFFICULTY_CONFIG[d].initialSize, d);
                  }
                }}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-sm border transition-all cursor-pointer min-h-[36px]",
                  active
                    ? "bg-indigo-600 text-white border-indigo-500 font-bold"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                )}
              >
                [{dName}]
              </button>
            );
          })}
        </div>
        <div className="text-xs text-slate-400">
          WIN: +{dCfg.reward.win} SNS
        </div>
      </div>

      <div className="flex items-center gap-4 py-1 text-xs font-bold shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-blue-400">[나 (X)]</span>
        </div>
        <span className="text-slate-500">vs</span>
        <div className="flex items-center gap-1">
          <span className="text-red-400">[AI (O)]</span>
        </div>
      </div>

      <main className="w-full max-w-md flex-1 min-h-0 flex items-center justify-center px-3">
        <div
          className={cn('relative overflow-hidden rounded-sm border border-white/15 max-h-[55vh] aspect-square w-full max-w-[320px]')}
          style={{ touchAction: 'none' }}
          onPointerDown={handleCanvasClick}
        >
          <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="w-full h-full object-contain" />

          {hudGameOver && (
            <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white text-slate-900 rounded-sm p-5 max-w-xs w-full text-center border border-slate-300 shadow-lg">
                <Trophy size={36} className={cn('mx-auto mb-2', gameRef.current.winner === 'O' ? 'text-rose-500' : 'text-amber-500')} />
                <h2 className="text-lg font-bold mb-1">{getResultText()}</h2>

                <div className="text-xs text-slate-600 space-y-1 mb-3 bg-slate-50 p-2.5 rounded-sm border border-slate-200">
                  <div className="flex justify-between">
                    <span>{language === 'ko' ? '난이도' : 'Difficulty'}:</span>
                    <span className="font-bold text-slate-900">[{language === 'ko' ? dCfg.nameKo : dCfg.nameEn}]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'ko' ? '결과' : 'Outcome'}:</span>
                    <span className="font-bold text-slate-900">
                      {hudWinner === 'X' ? (language === 'ko' ? '승리' : 'Victory') : hudWinner === 'O' ? (language === 'ko' ? '패배' : 'Defeat') : (language === 'ko' ? '무승부' : 'Draw')}
                    </span>
                  </div>
                </div>

                <div className="mb-3.5 py-2 px-3 bg-indigo-50 border border-indigo-200 rounded-sm">
                  <span className="text-xs text-indigo-700 font-bold">
                    {language === 'ko' ? `보상 지급: +${earnedReward} SNS 포인트` : `Reward Earned: +${earnedReward} SNS Points`}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => initGame(dCfg.initialSize, difficulty)} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm font-bold flex items-center justify-center gap-1 cursor-pointer min-h-[44px] text-xs">
                    <RotateCcw size={14} />
                    {language === 'ko' ? '재대결' : 'Rematch'}
                  </button>
                  <button onClick={onExit} className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm font-bold cursor-pointer min-h-[44px] text-xs">
                    {t('home', language)}{defeatCountdown !== null ? ` (${defeatCountdown}s)` : ''}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="px-3 py-1.5 bg-white/5 rounded-sm text-[10px] text-slate-400 font-mono text-center max-w-md shrink-0 border border-white/5">
        {language === 'ko'
          ? '칸을 터치하여 수 놓기 | 난이도별 30~60 SNS 포인트 보상'
          : 'Tap cell to place card | 30~60 SNS points reward based on difficulty'}
      </div>
    </div>
  );
};
