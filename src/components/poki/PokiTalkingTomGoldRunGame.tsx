import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiTalkingTomGoldRunGameProps {
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

interface Item {
  lane: number;
  y: number;
  type: 'gold' | 'obstacle' | 'bus';
  collected?: boolean;
}

export const PokiTalkingTomGoldRunGame: React.FC<PokiTalkingTomGoldRunGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 13;

  const [goldBars, setGoldBars] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    currentLane: 1, // 0, 1, 2
    laneX: [80, 200, 320],
    playerX: 200,
    playerY: 520,
    isJumping: false,
    jumpY: 0,
    jumpVy: 0,
    speed: 300,
    dist: 0,
    goldCollected: 0,
    items: [] as Item[],
    spawnTimer: 0,
    touchStartX: 0,
    touchStartY: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokitalkingtomgoldrun',
      gameTitle: isKo ? 'Talking Tom Gold Run (골드 런)' : 'Gold Run',
      durationSeconds: 30,
      score: gameState.current.goldCollected * 30 + 400,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const changeLane = useCallback((dir: -1 | 1) => {
    const s = gameState.current;
    const nextLane = Math.max(0, Math.min(2, s.currentLane + dir));
    if (nextLane !== s.currentLane) {
      s.currentLane = nextLane;
      if (playSfx) playSfx('/sfx/swoosh.mp3');
      if (navigator.vibrate) navigator.vibrate(20);
    }
  }, [playSfx]);

  const jump = useCallback(() => {
    const s = gameState.current;
    if (!s.isJumping) {
      s.isJumping = true;
      s.jumpVy = -16;
      if (playSfx) playSfx('/sfx/jump.mp3');
      if (navigator.vibrate) navigator.vibrate(30);
    }
  }, [playSfx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      const w = canvas.width;
      gameState.current.laneX = [w * 0.22, w * 0.5, w * 0.78];
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon) {
        s.dist += s.speed * dt * 0.1;
        setDistance(Math.floor(s.dist));

        if (s.dist >= 500) {
          handleVictory();
        }

        // Jump physics
        if (s.isJumping) {
          s.jumpY += s.jumpVy;
          s.jumpVy += 38 * dt;
          if (s.jumpY >= 0) {
            s.jumpY = 0;
            s.isJumping = false;
          }
        }

        // Smooth lane change
        const targetX = s.laneX[s.currentLane];
        s.playerX += (targetX - s.playerX) * 15 * dt;

        // Spawn items
        s.spawnTimer += dt;
        if (s.spawnTimer > 0.8) {
          s.spawnTimer = 0;
          const lane = Math.floor(Math.random() * 3);
          const isObstacle = Math.random() < 0.45;
          s.items.push({
            lane,
            y: -50,
            type: isObstacle ? (Math.random() < 0.3 ? 'bus' : 'obstacle') : 'gold'
          });
        }

        // Update items
        for (let i = s.items.length - 1; i >= 0; i--) {
          const it = s.items[i];
          it.y += s.speed * dt;

          // Collision check
          if (!it.collected && Math.abs(it.y - s.playerY) < 40 && s.currentLane === it.lane) {
            if (it.type === 'gold') {
              it.collected = true;
              s.goldCollected++;
              setGoldBars(s.goldCollected);
              if (playSfx) playSfx('/sfx/coin.mp3');
              if (navigator.vibrate) navigator.vibrate(15);
            } else {
              // Obstacle hit
              if (!s.isJumping) {
                // Crash bounce back
                s.dist = Math.max(0, s.dist - 30);
                if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
                it.collected = true;
              }
            }
          }

          if (it.y > canvas.height + 50) {
            s.items.splice(i, 1);
          }
        }
      }

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Road Lanes
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(canvas.width * 0.08, 0, canvas.width * 0.84, canvas.height);

      // Lane dividers
      ctx.strokeStyle = '#e2e8f0';
      ctx.setLineDash([20, 20]);
      ctx.lineWidth = 3;
      const w = canvas.width;
      ctx.beginPath();
      ctx.moveTo(w * 0.36, 0);
      ctx.lineTo(w * 0.36, canvas.height);
      ctx.moveTo(w * 0.64, 0);
      ctx.lineTo(w * 0.64, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Items
      for (const it of s.items) {
        if (it.collected) continue;
        const ix = s.laneX[it.lane];
        if (it.type === 'gold') {
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.roundRect(ix - 18, it.y - 12, 36, 24, 4);
          ctx.fill();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('GOLD', ix - 14, it.y + 4);
        } else if (it.type === 'obstacle') {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(ix - 25, it.y - 15, 50, 30);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ix - 20, it.y - 10, 40, 5);
        } else if (it.type === 'bus') {
          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          ctx.roundRect(ix - 28, it.y - 45, 56, 90, 8);
          ctx.fill();
          ctx.fillStyle = '#93c5fd';
          ctx.fillRect(ix - 22, it.y - 35, 44, 20);
        }
      }

      // Player
      const py = s.playerY + s.jumpY;
      drawCardSprite(ctx, effectiveCardId, s.playerX - 25, py - 35, 50, 50);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') changeLane(-1);
      if (e.key === 'ArrowRight' || e.key === 'd') changeLane(1);
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') jump();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [changeLane, effectiveCardId, gameWon, handleVictory, jump, playSfx]);

  const handleStart = (clientX: number, clientY: number) => {
    gameState.current.touchStartX = clientX;
    gameState.current.touchStartY = clientY;
  };

  const handleEnd = (clientX: number, clientY: number) => {
    const dx = clientX - gameState.current.touchStartX;
    const dy = clientY - gameState.current.touchStartY;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
      if (dx > 0) changeLane(1);
      else changeLane(-1);
    } else if (dy < -30) {
      jump();
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
        gameTitle={isKo ? 'Talking Tom Gold Run (골드 런)' : 'Gold Run'}
        currentScore={goldBars}
        targetScore={25}
        onBack={handleExit}
        stageInfo={`${distance}m / 500m | 🥇 ${goldBars}`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Pure Touch Controls for Easy Tapping */}
      <div className="absolute bottom-6 inset-x-4 flex justify-between gap-3 z-20 pointer-events-none">
        <button
          className="pointer-events-auto flex-1 h-20 bg-slate-800/80 active:bg-amber-600/80 text-white rounded-2xl border-2 border-slate-600 flex items-center justify-center font-bold text-2xl backdrop-blur-md active:scale-95 transition-transform"
          onClick={() => changeLane(-1)}
        >
          ◀ LANE
        </button>
        <button
          className="pointer-events-auto flex-1 h-20 bg-amber-600/90 active:bg-amber-500 text-white rounded-2xl border-2 border-amber-400 flex items-center justify-center font-bold text-2xl backdrop-blur-md active:scale-95 transition-transform"
          onClick={jump}
        >
          ▲ JUMP
        </button>
        <button
          className="pointer-events-auto flex-1 h-20 bg-slate-800/80 active:bg-amber-600/80 text-white rounded-2xl border-2 border-slate-600 flex items-center justify-center font-bold text-2xl backdrop-blur-md active:scale-95 transition-transform"
          onClick={() => changeLane(1)}
        >
          LANE ▶
        </button>
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

export default PokiTalkingTomGoldRunGame;
