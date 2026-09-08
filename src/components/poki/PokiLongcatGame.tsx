import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiLongcatGameProps {
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

const GRID_SIZE = 5;

export const PokiLongcatGame: React.FC<PokiLongcatGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 22;

  const [filledCount, setFilledCount] = useState(1);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    grid: Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0)), // 0: empty, 1: cat body, 2: obstacle
    headX: 0,
    headY: 0,
    body: [{ x: 0, y: 0 }],
    touchStartX: 0,
    touchStartY: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokilongcat',
      gameTitle: isKo ? 'Longcat (롱캣 퍼즐)' : 'Longcat',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const slide = useCallback((dx: number, dy: number) => {
    const s = gameState.current;
    if (gameWon) return;

    let moved = false;
    let cx = s.headX;
    let cy = s.headY;

    while (true) {
      const nx = cx + dx;
      const ny = cy + dy;

      if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) break;
      if (s.grid[ny][nx] !== 0) break; // blocked by body or obstacle

      cx = nx;
      cy = ny;
      s.grid[cy][cx] = 1;
      s.body.push({ x: cx, y: cy });
      moved = true;
    }

    if (moved) {
      s.headX = cx;
      s.headY = cy;
      const totalFilled = s.body.length;
      setFilledCount(totalFilled);
      if (playSfx) playSfx('/sfx/stretch.mp3');
      if (navigator.vibrate) navigator.vibrate(20);

      const targetFill = GRID_SIZE * GRID_SIZE - 3; // obstacles excluded
      if (totalFilled >= targetFill) {
        handleVictory();
      }
    }
  }, [gameWon, handleVictory, playSfx]);

  useEffect(() => {
    // Init obstacles
    const s = gameState.current;
    s.grid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    s.grid[1][2] = 2;
    s.grid[3][1] = 2;
    s.grid[2][4] = 2;
    s.grid[0][0] = 1;
    s.headX = 0;
    s.headY = 0;
    s.body = [{ x: 0, y: 0 }];

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

      // Grid board
      const tileSize = Math.min(canvas.width - 60, 320) / GRID_SIZE;
      const startX = (canvas.width - tileSize * GRID_SIZE) / 2;
      const startY = 160;

      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const val = s.grid[y][x];
          const px = startX + x * tileSize;
          const py = startY + y * tileSize;

          ctx.fillStyle = val === 2 ? '#334155' : '#1e293b';
          ctx.beginPath();
          ctx.roundRect(px + 3, py + 3, tileSize - 6, tileSize - 6, 8);
          ctx.fill();

          if (val === 2) {
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 16px monospace';
            ctx.fillText('X', px + tileSize / 2 - 6, py + tileSize / 2 + 6);
          } else if (val === 1) {
            // Cat body
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.roundRect(px + 6, py + 6, tileSize - 12, tileSize - 12, 6);
            ctx.fill();
          }
        }
      }

      // Cat Head
      const hpx = startX + s.headX * tileSize + tileSize / 2;
      const hpy = startY + s.headY * tileSize + tileSize / 2;
      drawCardSprite(ctx, effectiveCardId, hpx - 22, hpy - 22, 44, 44);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') slide(0, -1);
      if (e.key === 'ArrowDown' || e.key === 's') slide(0, 1);
      if (e.key === 'ArrowLeft' || e.key === 'a') slide(-1, 0);
      if (e.key === 'ArrowRight' || e.key === 'd') slide(1, 0);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [effectiveCardId, slide]);

  const handleStart = (clientX: number, clientY: number) => {
    gameState.current.touchStartX = clientX;
    gameState.current.touchStartY = clientY;
  };

  const handleEnd = (clientX: number, clientY: number) => {
    const dx = clientX - gameState.current.touchStartX;
    const dy = clientY - gameState.current.touchStartY;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 25) {
      slide(dx > 0 ? 1 : -1, 0);
    } else if (Math.abs(dy) > 25) {
      slide(0, dy > 0 ? 1 : -1);
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono cursor-grab active:cursor-grabbing"
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (t) handleStart(t.clientX, t.clientY);
      }}
      onTouchEnd={(e) => {
        const t = e.changedTouches[0];
        if (t) handleEnd(t.clientX, t.clientY);
      }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseUp={(e) => handleEnd(e.clientX, e.clientY)}
    >
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Longcat (롱캣 퍼즐)' : 'Longcat'}
        currentScore={filledCount}
        targetScore={22}
        onBack={handleExit}
        stageInfo={`${filledCount}/22 Tiles`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* D-Pad Buttons for Touch */}
      <div className="absolute bottom-6 inset-x-6 flex flex-col items-center gap-2 z-20 pointer-events-none">
        <button
          className="pointer-events-auto w-16 h-16 bg-slate-800/80 active:bg-amber-600 text-white rounded-xl border border-slate-600 font-bold text-2xl flex items-center justify-center backdrop-blur-md"
          onClick={() => slide(0, -1)}
        >
          ▲
        </button>
        <div className="flex gap-4">
          <button
            className="pointer-events-auto w-16 h-16 bg-slate-800/80 active:bg-amber-600 text-white rounded-xl border border-slate-600 font-bold text-2xl flex items-center justify-center backdrop-blur-md"
            onClick={() => slide(-1, 0)}
          >
            ◀
          </button>
          <button
            className="pointer-events-auto w-16 h-16 bg-slate-800/80 active:bg-amber-600 text-white rounded-xl border border-slate-600 font-bold text-2xl flex items-center justify-center backdrop-blur-md"
            onClick={() => slide(0, 1)}
          >
            ▼
          </button>
          <button
            className="pointer-events-auto w-16 h-16 bg-slate-800/80 active:bg-amber-600 text-white rounded-xl border border-slate-600 font-bold text-2xl flex items-center justify-center backdrop-blur-md"
            onClick={() => slide(1, 0)}
          >
            ▶
          </button>
        </div>
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

export default PokiLongcatGame;
