import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiHideAndPaintGameProps {
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

export const PokiHideAndPaintGame: React.FC<PokiHideAndPaintGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 2;

  const [paintedPct, setPaintedPct] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [isCamouflaged, setIsCamouflaged] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    playerX: 200,
    playerY: 200,
    targetX: 200,
    targetY: 200,
    isMoving: false,
    lives: 3,
    score: 0,
    won: false,
    startTime: Date.now(),
    grid: [] as boolean[][],
    cols: 25,
    rows: 35,
    tileSize: 24,
    guards: [
      { x: 100, y: 150, angle: 0, speed: 2, radius: 110, fov: 0.7, sweepDir: 1 },
      { x: 300, y: 400, angle: Math.PI, speed: 1.8, radius: 120, fov: 0.7, sweepDir: -1 }
    ]
  });

  const triggerHaptic = (ms = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch {}
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    gameStateRef.current.targetX = clientX - rect.left;
    gameStateRef.current.targetY = clientY - rect.top;
    gameStateRef.current.isMoving = true;
  };

  const handlePointerEnd = () => {
    gameStateRef.current.isMoving = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const gs = gameStateRef.current;
      gs.cols = Math.floor(canvas.width / 24);
      gs.rows = Math.floor(canvas.height / 24);
      gs.grid = Array.from({ length: gs.rows }, () => Array(gs.cols).fill(false));
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const gs = gameStateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      if (!gs.won && gs.lives > 0) {
        const dx = gs.targetX - gs.playerX;
        const dy = gs.targetY - gs.playerY;
        if (Math.hypot(dx, dy) > 4) {
          gs.playerX += dx * 0.2;
          gs.playerY += dy * 0.2;
          gs.isMoving = true;
        } else {
          gs.isMoving = false;
        }

        const tileCol = Math.floor(gs.playerX / gs.tileSize);
        const tileRow = Math.floor(gs.playerY / gs.tileSize);
        if (tileRow >= 0 && tileRow < gs.rows && tileCol >= 0 && tileCol < gs.cols) {
          if (!gs.grid[tileRow][tileCol]) {
            gs.grid[tileRow][tileCol] = true;
            gs.score += 15;
            setScore(gs.score);
          }
        }

        let paintedCount = 0;
        const totalTiles = gs.rows * gs.cols;
        for (let r = 0; r < gs.rows; r++) {
          for (let c = 0; c < gs.cols; c++) {
            if (gs.grid[r][c]) paintedCount++;
          }
        }
        const pct = Math.floor((paintedCount / totalTiles) * 100);
        setPaintedPct(pct);

        const onPainted = gs.grid[tileRow]?.[tileCol] ?? false;
        const camouflaged = onPainted && !gs.isMoving;
        setIsCamouflaged(camouflaged);

        for (const guard of gs.guards) {
          guard.angle += 0.02 * guard.sweepDir;
          if (Math.sin(guard.angle) > 0.8) guard.sweepDir = -1;
          if (Math.sin(guard.angle) < -0.8) guard.sweepDir = 1;
          guard.x += Math.cos(guard.angle) * guard.speed;
          guard.y += Math.sin(guard.angle) * guard.speed;
          if (guard.x < 50 || guard.x > w - 50) guard.angle = Math.PI - guard.angle;
          if (guard.y < 80 || guard.y > h - 80) guard.angle = -guard.angle;

          const toPlayerX = gs.playerX - guard.x;
          const toPlayerY = gs.playerY - guard.y;
          if (Math.hypot(toPlayerX, toPlayerY) < guard.radius) {
            const angleToPlayer = Math.atan2(toPlayerY, toPlayerX);
            let diff = Math.abs(angleToPlayer - guard.angle);
            while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
            if (diff < guard.fov / 2 && !camouflaged) {
              gs.lives--;
              setLives(gs.lives);
              triggerHaptic(50);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              guard.angle += Math.PI;
              break;
            }
          }
        }

        if (pct >= 60 && !gs.won) {
          gs.won = true;
          triggerHaptic(60);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          const elapsedSec = Math.max(5, Math.floor((Date.now() - gs.startTime) / 1000));
          const receipt = calculateAndDepositMissionReward({
            gameId: 'poki_hide_and_paint',
            gameTitle: isKo ? '하이드 앤 페인트' : 'Hide and Paint',
            durationSeconds: elapsedSec,
            score: gs.score,
            maxTargetScore: 1200,
            isVictory: true
          });
          setRewardReceipt(receipt);
          setGameWon(true);
          onReward?.(receipt.totalSns);
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, w, h);

      // Grid
      for (let r = 0; r < gs.rows; r++) {
        for (let c = 0; c < gs.cols; c++) {
          const x = c * gs.tileSize;
          const y = r * gs.tileSize;
          if (gs.grid[r]?.[c]) {
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(x, y, gs.tileSize, gs.tileSize);
          } else {
            ctx.strokeStyle = 'rgba(255,255,255,0.03)';
            ctx.strokeRect(x, y, gs.tileSize, gs.tileSize);
          }
        }
      }

      // Guards
      for (const guard of gs.guards) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.beginPath();
        ctx.moveTo(guard.x, guard.y);
        ctx.arc(guard.x, guard.y, guard.radius, guard.angle - guard.fov / 2, guard.angle + guard.fov / 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player
      const pSize = 48;
      const camouGlow = isCamouflaged ? '#10b981' : '#38bdf8';
      drawCardSprite(ctx, effectiveCardId, gs.playerX - pSize / 2, gs.playerY - pSize / 2, pSize, pSize, {
        circleClip: true,
        borderWidth: 2,
        borderColor: camouGlow,
        shadowBlur: 10,
        shadowColor: camouGlow
      });

      animId = requestAnimationFrame(loop);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const gs = gameStateRef.current;
      const step = 25;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') gs.targetX = Math.max(20, gs.targetX - step);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') gs.targetX = Math.min(canvas.width - 20, gs.targetX + step);
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') gs.targetY = Math.max(60, gs.targetY - step);
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') gs.targetY = Math.min(canvas.height - 60, gs.targetY + step);
      gs.isMoving = true;
    };
    const onKeyUp = () => {
      gameStateRef.current.isMoving = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [effectiveCardId, isCamouflaged, isKo, onReward, playSfx]);

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (t) handlePointerMove(t.clientX, t.clientY);
      }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        if (t) handlePointerMove(t.clientX, t.clientY);
      }}
      onTouchEnd={handlePointerEnd}
      onMouseDown={(e) => handlePointerMove(e.clientX, e.clientY)}
      onMouseMove={(e) => {
        if (e.buttons > 0) handlePointerMove(e.clientX, e.clientY);
      }}
      onMouseUp={handlePointerEnd}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block cursor-pointer" />

      <MinimalistMissionHUD
        title={isKo ? '하이드 앤 페인트' : 'Hide and Paint'}
        score={score}
        targetScore={1200}
        stageInfo={`${paintedPct}% / 60%`}
        lives={lives}
        onExit={handleExit}
        unit="pt"
      />

      {gameWon && (
        <VictoryRewardModal
          isOpen={gameWon}
          rewardReceipt={rewardReceipt}
          onClose={handleExit}
          onClaimBonus={handleExit}
          language={isKo ? 'ko' : 'en'}
        />
      )}
    </div>
  );
};

export default PokiHideAndPaintGame;
