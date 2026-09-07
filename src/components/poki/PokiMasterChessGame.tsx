import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiMasterChessGameProps {
  onBack: () => void;
  cardId?: number;
}

type PieceType = 'P' | 'R' | 'N' | 'B' | 'Q' | 'K';
type PieceColor = 'w' | 'b';

interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

type Board = (ChessPiece | null)[][];

export const PokiMasterChessGame: React.FC<PokiMasterChessGameProps> = ({ onBack, cardId = 27 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [captured, setCaptured] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const initialBoard = (): Board => {
    const b: Board = Array(8).fill(null).map(() => Array(8).fill(null));
    // Black back row
    const backRow: PieceType[] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
    for (let c = 0; c < 8; c++) {
      b[0][c] = { type: backRow[c], color: 'b' };
      b[1][c] = { type: 'P', color: 'b' };
      b[6][c] = { type: 'P', color: 'w' };
      b[7][c] = { type: backRow[c], color: 'w' };
    }
    return b;
  };

  const gameStateRef = useRef({
    board: initialBoard(),
    selectedCell: null as { r: number; c: number } | null,
    validMoves: [] as { r: number; c: number }[],
    turn: 'w' as PieceColor,
    capturedEnemies: 0,
  });

  const getValidMoves = (r: number, c: number, board: Board): { r: number; c: number }[] => {
    const p = board[r][c];
    if (!p) return [];
    const moves: { r: number; c: number }[] = [];

    // Helper
    const addIfValid = (nr: number, nc: number, onlyCapture = false, onlyEmpty = false) => {
      if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) return false;
      const target = board[nr][nc];
      if (onlyCapture) {
        if (target && target.color !== p.color) { moves.push({ r: nr, c: nc }); }
        return false;
      }
      if (onlyEmpty) {
        if (!target) { moves.push({ r: nr, c: nc }); return true; }
        return false;
      }
      if (!target) {
        moves.push({ r: nr, c: nc });
        return true;
      }
      if (target.color !== p.color) {
        moves.push({ r: nr, c: nc });
      }
      return false; // hit piece
    };

    if (p.type === 'P') {
      const dir = p.color === 'w' ? -1 : 1;
      if (addIfValid(r + dir, c, false, true)) {
        if ((p.color === 'w' && r === 6) || (p.color === 'b' && r === 1)) {
          addIfValid(r + dir * 2, c, false, true);
        }
      }
      addIfValid(r + dir, c - 1, true);
      addIfValid(r + dir, c + 1, true);
    } else if (p.type === 'N') {
      const deltas = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      deltas.forEach(([dr, dc]) => addIfValid(r + dr, c + dc));
    } else if (p.type === 'B' || p.type === 'R' || p.type === 'Q') {
      const directions: number[][] = [];
      if (p.type === 'B' || p.type === 'Q') {
        directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      if (p.type === 'R' || p.type === 'Q') {
        directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }
      directions.forEach(([dr, dc]) => {
        let step = 1;
        while (addIfValid(r + dr * step, c + dc * step)) {
          step++;
        }
      });
    } else if (p.type === 'K') {
      const deltas = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];
      deltas.forEach(([dr, dc]) => addIfValid(r + dr, c + dc));
    }

    return moves;
  };

  const makeAiMove = () => {
    const state = gameStateRef.current;
    const allAiPieces: { r: number; c: number }[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (state.board[r][c]?.color === 'b') {
          allAiPieces.push({ r, c });
        }
      }
    }

    // Collect all valid AI moves
    const allMoves: { from: { r: number; c: number }; to: { r: number; c: number }; isCapture: boolean }[] = [];
    allAiPieces.forEach(from => {
      const moves = getValidMoves(from.r, from.c, state.board);
      moves.forEach(to => {
        const isCapture = state.board[to.r][to.c] !== null;
        allMoves.push({ from, to, isCapture });
      });
    });

    if (allMoves.length === 0) return;

    // Prioritize captures
    const captureMoves = allMoves.filter(m => m.isCapture);
    const chosenMove = captureMoves.length > 0
      ? captureMoves[Math.floor(Math.random() * captureMoves.length)]
      : allMoves[Math.floor(Math.random() * allMoves.length)];

    const targetPiece = state.board[chosenMove.to.r][chosenMove.to.c];
    state.board[chosenMove.to.r][chosenMove.to.c] = state.board[chosenMove.from.r][chosenMove.from.c];
    state.board[chosenMove.from.r][chosenMove.from.c] = null;

    // Check if player king captured
    if (targetPiece?.type === 'K' && targetPiece.color === 'w') {
      setGameOver(true);
    }

    state.turn = 'w';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, cw, ch);

      const boardSize = Math.min(cw - 40, ch - 220, 520);
      const cellSize = boardSize / 8;
      const startX = (cw - boardSize) / 2;
      const startY = (ch - boardSize) / 2 + 20;

      // Draw Board Tiles
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const x = startX + c * cellSize;
          const y = startY + r * cellSize;
          const isLight = (r + c) % 2 === 0;

          ctx.fillStyle = isLight ? '#e2e8f0' : '#475569';
          ctx.fillRect(x, y, cellSize, cellSize);

          // Highlight selected cell
          if (state.selectedCell?.r === r && state.selectedCell?.c === c) {
            ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, cellSize, cellSize);
          }

          // Highlight valid moves
          if (state.validMoves.some(m => m.r === r && m.c === c)) {
            ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.18, 0, Math.PI * 2);
            ctx.fillStyle = '#22c55e';
            ctx.fill();
          }

          // Draw Piece
          const p = state.board[r][c];
          if (p) {
            if (p.type === 'K' && p.color === 'w') {
              // Custom Hero King
              drawCardSprite(ctx, cardId, x + 4, y + 4, cellSize - 8, cellSize - 8);
            } else {
              // Chess unicode glyphs
              const symbols: Record<PieceColor, Record<PieceType, string>> = {
                w: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
                b: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' },
              };
              ctx.font = `${Math.floor(cellSize * 0.7)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = p.color === 'w' ? '#0f172a' : '#ef4444';
              ctx.fillText(symbols[p.color][p.type], x + cellSize / 2, y + cellSize / 2 + 3);
            }
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [captured, cardId]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || gameStateRef.current.turn !== 'w' || gameOver || gameWon) return;

    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const cw = canvas.width;
    const ch = canvas.height;
    const boardSize = Math.min(cw - 40, ch - 220, 520);
    const cellSize = boardSize / 8;
    const startX = (cw - boardSize) / 2;
    const startY = (ch - boardSize) / 2 + 20;

    const c = Math.floor((touchX - startX) / cellSize);
    const r = Math.floor((touchY - startY) / cellSize);

    if (r < 0 || r >= 8 || c < 0 || c >= 8) return;

    const state = gameStateRef.current;

    // Check if clicking a valid destination move
    if (state.selectedCell && state.validMoves.some(m => m.r === r && m.c === c)) {
      const targetPiece = state.board[r][c];
      state.board[r][c] = state.board[state.selectedCell.r][state.selectedCell.c];
      state.board[state.selectedCell.r][state.selectedCell.c] = null;

      if (targetPiece) {
        state.capturedEnemies += 1;
        setCaptured(state.capturedEnemies);

        // Win if King captured or 4 pieces captured
        if (targetPiece.type === 'K' || state.capturedEnemies >= 4) {
          setGameWon(true);
          const deposit = calculateAndDepositMissionReward({
            gameId: 'poki_master_chess',
            gameTitle: 'Master Chess',
            isVictory: true,
            score: 100,
            maxTargetScore: 100,
            durationSeconds: 45,
          });
          setRewardResult(deposit);
          return;
        }
      }

      state.selectedCell = null;
      state.validMoves = [];
      state.turn = 'b';

      // Trigger AI turn
      setTimeout(makeAiMove, 500);
      return;
    }

    // Select White Piece
    const piece = state.board[r][c];
    if (piece && piece.color === 'w') {
      state.selectedCell = { r, c };
      state.validMoves = getValidMoves(r, c, state.board);
    } else {
      state.selectedCell = null;
      state.validMoves = [];
    }
  };

  const handleRestart = () => {
    gameStateRef.current = {
      board: initialBoard(),
      selectedCell: null,
      validMoves: [],
      turn: 'w',
      capturedEnemies: 0,
    };
    setCaptured(0);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#0f172a] overflow-hidden select-none font-mono touch-none">
      <MinimalistMissionHUD
        title="MASTER CHESS"
        score={captured}
        goalScore={4}
        onBack={onBack}
        unit="CAPTURES"
      />

      {/* Header Info */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-sm text-xs">
        <span className="text-amber-400 font-bold">♟️ CAPTURES: {captured} / 4 OR CHECKMATE</span>
        <span className="text-slate-300">TURN: {gameStateRef.current.turn === 'w' ? 'YOU (WHITE)' : 'AI (BLACK)'}</span>
      </div>

      {/* Touch Guide */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-slate-400 bg-slate-900/90 border border-slate-700 px-4 py-2 rounded-sm pointer-events-none text-center whitespace-nowrap">
        내 체스말을 탭하고 <span className="text-emerald-400 font-bold">초록색 하이라이트 칸</span>으로 이동하여 적 기물을 잡으세요!
      </div>

      <canvas ref={canvasRef} onPointerDown={handlePointerDown} className="w-full h-full block cursor-pointer" />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ CHECKMATE - DEFEAT ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            체스 킹이 체크메이트 당했습니다! 행마법을 신중히 계산해 다시 승리해보세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 대전
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-sm transition-colors cursor-pointer"
            >
              미션 목록
            </button>
          </div>
        </div>
      )}

      {/* Victory Reward Modal */}
      {gameWon && (
        <VictoryRewardModal
          isOpen={true}
          onClose={onBack}
          rewardAmount={rewardResult?.rewardAmount || 40}
          message="뛰어난 전략으로 AI 체스 군단을 제압하고 체크메이트 승리를 거두었습니다!"
        />
      )}
    </div>
  );
};

export default PokiMasterChessGame;
