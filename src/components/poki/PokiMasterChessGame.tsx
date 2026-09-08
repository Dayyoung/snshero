import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiMasterChessGameProps {
  onBack?: () => void;
  onExit?: () => void;
  onClose?: () => void;
  deck?: any[];
  cardId?: number;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onReward?: (amount: number) => void;
}

interface Piece {
  x: number;
  y: number;
  type: 'knight' | 'pawn';
  captured: boolean;
}

export const PokiMasterChessGame: React.FC<PokiMasterChessGameProps> = ({
  onBack,
  onExit,
  onClose,
  deck = [],
  cardId,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 27;

  const [pawnsLeft, setPawnsLeft] = useState(3);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    knightPos: { x: 2, y: 4 },
    pawns: [
      { x: 1, y: 1, type: 'pawn', captured: false },
      { x: 3, y: 0, type: 'pawn', captured: false },
      { x: 4, y: 2, type: 'pawn', captured: false },
    ] as Piece[],
    validMoves: [] as { x: number; y: number }[]
  });

  const updateValidMoves = useCallback(() => {
    const moves = [
      { dx: 1, dy: 2 }, { dx: 2, dy: 1 }, { dx: -1, dy: 2 }, { dx: -2, dy: 1 },
      { dx: 1, dy: -2 }, { dx: 2, dy: -1 }, { dx: -1, dy: -2 }, { dx: -2, dy: -1 }
    ];
    const s = gameState.current;
    const valids: { x: number; y: number }[] = [];
    for (const m of moves) {
      const nx = s.knightPos.x + m.dx;
      const ny = s.knightPos.y + m.dy;
      if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5) {
        valids.push({ x: nx, y: ny });
      }
    }
    s.validMoves = valids;
  }, []);

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokimasterchess',
      gameTitle: isKo ? 'Master Chess (마스터 체스)' : 'Master Chess',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const moveKnight = useCallback((tx: number, ty: number) => {
    const s = gameState.current;
    const isValid = s.validMoves.some(m => m.x === tx && m.y === ty);
    if (isValid) {
      s.knightPos = { x: tx, y: ty };

      // Capture check
      for (const p of s.pawns) {
        if (!p.captured && p.x === tx && p.y === ty) {
          p.captured = true;
          if (playSfx) playSfx('/sfx/capture.mp3');
          if (navigator.vibrate) navigator.vibrate(30);
        }
      }

      updateValidMoves();
      const remaining = s.pawns.filter(p => !p.captured).length;
      setPawnsLeft(remaining);
      if (remaining === 0) {
        handleVictory();
      }
    }
  }, [handleVictory, playSfx, updateValidMoves]);

  useEffect(() => {
    updateValidMoves();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const tileSize = Math.min(canvas.width - 40, 320) / 5;
      const startX = (canvas.width - tileSize * 5) / 2;
      const startY = 160;

      const s = gameState.current;

      // Board
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const isDark = (x + y) % 2 === 1;
          const px = startX + x * tileSize;
          const py = startY + y * tileSize;

          ctx.fillStyle = isDark ? '#334155' : '#64748b';
          ctx.fillRect(px, py, tileSize, tileSize);

          // Highlight valid moves
          const isValid = s.validMoves.some(m => m.x === x && m.y === y);
          if (isValid) {
            ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
            ctx.beginPath();
            ctx.arc(px + tileSize / 2, py + tileSize / 2, 12, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Pawns
      for (const p of s.pawns) {
        if (!p.captured) {
          const px = startX + p.x * tileSize + tileSize / 2;
          const py = startY + p.y * tileSize + tileSize / 2;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(px, py, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('PAWN', px - 15, py + 4);
        }
      }

      // Knight Card Character
      const kpx = startX + s.knightPos.x * tileSize + tileSize / 2;
      const kpy = startY + s.knightPos.y * tileSize + tileSize / 2;
      drawCardSprite(ctx, effectiveCardId, kpx - 22, kpy - 22, 44, 44);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const tileSize = Math.min(canvas.width - 40, 320) / 5;
      const startX = (canvas.width - tileSize * 5) / 2;
      const startY = 160;

      const tx = Math.floor((mx - startX) / tileSize);
      const ty = Math.floor((my - startY) / tileSize);

      if (tx >= 0 && tx < 5 && ty >= 0 && ty < 5) {
        moveKnight(tx, ty);
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [effectiveCardId, moveKnight, updateValidMoves]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Master Chess (마스터 체스)' : 'Master Chess'}
        currentScore={3 - pawnsLeft}
        targetScore={3}
        onBack={handleExit}
        stageInfo={`${isKo ? '적 폰' : 'Pawns'}: ${pawnsLeft} left`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-slate-300 pointer-events-none">
        {isKo ? '노란 점으로 표시된 나이트의 L자 이동 경로를 탭하여 모든 폰을 잡으세요!' : 'Tap highlighted yellow dots to move your knight and capture pawns!'}
      </div>

      {rewardReceipt && (
        <VictoryRewardModal
          isOpen={gameWon}
          reward={rewardReceipt}
          onConfirm={handleExit}
        />
      )}
    </div>
  );
};

export default PokiMasterChessGame;
