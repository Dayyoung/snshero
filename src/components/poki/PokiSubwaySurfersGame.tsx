import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSubwaySurfersGameProps {
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

interface Obstacle {
  lane: number;
  y: number;
  type: 'train' | 'barrier' | 'coin';
  collected?: boolean;
}

export const PokiSubwaySurfersGame: React.FC<PokiSubwaySurfersGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 26;

  const [distance, setDistance] = useState(0);
  const [coins, setCoins] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    lane: 1, // 0, 1, 2
    laneX: [80, 200, 320],
    playerX: 200,
    playerY: 520,
    isJumping: false,
    jumpY: 0,
    jumpVy: 0,
    isSliding: false,
    slideTimer: 0,
    speed: 320,
    dist: 0,
    coinsCount: 0,
    obstacles: [] as Obstacle[],
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
      gameId: 'pokisubwaysurfers',
      gameTitle: isKo ? 'Subway Surfers (서브웨이 서퍼)' : 'Subway Surfers',
      durationSeconds: 30,
      score: gameState.current.coinsCount * 40 + 500,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const changeLane = useCallback((dir: -1 | 1) => {
    const s = gameState.current;
    const nextLane = Math.max(0, Math.min(2, s.lane + dir));
    if (nextLane !== s.lane) {
      s.lane = nextLane;
      if (navigator.vibrate) navigator.vibrate(15);
    }
  }, []);

  const jump = useCallback(() => {
    const s = gameState.current;
    if (!s.isJumping) {
      s.isJumping = true;
      s.jumpVy = -16;
      if (playSfx) playSfx('/sfx/jump.mp3');
      if (navigator.vibrate) navigator.vibrate(25);
    }
  }, [playSfx]);

  const slide = useCallback(() => {
    const s = gameState.current;
    s.isSliding = true;
    s.slideTimer = 0.5;
    if (navigator.vibrate) navigator.vibrate(20);
  }, []);

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
        s.dist += s.speed * dt * 0.12;
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

        // Slide timer
        if (s.isSliding) {
          s.slideTimer -= dt;
          if (s.slideTimer <= 0) s.isSliding = false;
        }

        // Smooth move
        const targetX = s.laneX[s.lane];
        s.playerX += (targetX - s.playerX) * 16 * dt;

        // Spawn items
        s.spawnTimer += dt;
        if (s.spawnTimer > 0.8) {
          s.spawnTimer = 0;
          const l = Math.floor(Math.random() * 3);
          const r = Math.random();
          s.obstacles.push({
            lane: l,
            y: -60,
            type: r < 0.4 ? 'coin' : r < 0.7 ? 'barrier' : 'train'
          });
        }

        // Update items
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const ob = s.obstacles[i];
          ob.y += s.speed * dt;

          if (!ob.collected && Math.abs(ob.y - s.playerY) < 40 && s.lane === ob.lane) {
            if (ob.type === 'coin') {
              ob.collected = true;
              s.coinsCount++;
              setCoins(s.coinsCount);
              if (playSfx) playSfx('/sfx/coin.mp3');
              if (navigator.vibrate) navigator.vibrate(15);
            } else if (ob.type === 'barrier') {
              if (!s.isJumping && !s.isSliding) {
                s.dist = Math.max(0, s.dist - 25);
                ob.collected = true;
                if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
              }
            } else if (ob.type === 'train') {
              s.dist = Math.max(0, s.dist - 40);
              ob.collected = true;
              if (navigator.vibrate) navigator.vibrate([100, 80, 100]);
            }
          }

          if (ob.y > canvas.height + 80) {
            s.obstacles.splice(i, 1);
          }
        }
      }

      // Render Tracks
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Rails
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(canvas.width * 0.08, 0, canvas.width * 0.84, canvas.height);

      // Sleepers
      ctx.fillStyle = '#334155';
      const offset = (now * 0.3) % 40;
      for (let y = -offset; y < canvas.height; y += 40) {
        ctx.fillRect(canvas.width * 0.08, y, canvas.width * 0.84, 8);
      }

      // Obstacles
      for (const ob of s.obstacles) {
        if (ob.collected) continue;
        const ox = s.laneX[ob.lane];
        if (ob.type === 'coin') {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(ox, ob.y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (ob.type === 'barrier') {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(ox - 30, ob.y - 15, 60, 30);
          ctx.fillStyle = '#fff';
          ctx.fillRect(ox - 25, ob.y - 10, 50, 5);
        } else if (ob.type === 'train') {
          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          ctx.roundRect(ox - 32, ob.y - 60, 64, 120, 8);
          ctx.fill();
          ctx.fillStyle = '#93c5fd';
          ctx.fillRect(ox - 25, ob.y - 45, 50, 25);
        }
      }

      // Player Card Character
      const py = s.playerY + s.jumpY + (s.isSliding ? 15 : 0);
      const ph = s.isSliding ? 25 : 48;
      drawCardSprite(ctx, effectiveCardId, s.playerX - 24, py - ph / 2, 48, ph);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') changeLane(-1);
      if (e.key === 'ArrowRight' || e.key === 'd') changeLane(1);
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') jump();
      if (e.key === 'ArrowDown' || e.key === 's') slide();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [changeLane, effectiveCardId, gameWon, handleVictory, jump, playSfx, slide]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    gameState.current.touchStartX = t.clientX;
    gameState.current.touchStartY = t.clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - gameState.current.touchStartX;
    const dy = t.clientY - gameState.current.touchStartY;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 25) {
      changeLane(dx > 0 ? 1 : -1);
    } else if (dy < -25) {
      jump();
    } else if (dy > 25) {
      slide();
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Subway Surfers (서브웨이 서퍼)' : 'Subway Surfers'}
        currentScore={distance}
        targetScore={500}
        onBack={handleExit}
        stageInfo={`${distance}m / 500m | 🪙 ${coins}`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Touch Buttons */}
      <div className="absolute bottom-6 inset-x-4 flex justify-between gap-2 z-20 pointer-events-none">
        <button
          className="pointer-events-auto flex-1 h-18 bg-slate-800/80 active:bg-blue-600 text-white rounded-2xl border border-slate-600 font-bold text-xl flex items-center justify-center backdrop-blur-md"
          onClick={() => changeLane(-1)}
        >
          ◀
        </button>
        <button
          className="pointer-events-auto flex-1 h-18 bg-amber-600/90 active:bg-amber-500 text-white rounded-2xl border border-amber-400 font-bold text-xl flex items-center justify-center backdrop-blur-md"
          onClick={jump}
        >
          ▲ JUMP
        </button>
        <button
          className="pointer-events-auto flex-1 h-18 bg-purple-600/90 active:bg-purple-500 text-white rounded-2xl border border-purple-400 font-bold text-xl flex items-center justify-center backdrop-blur-md"
          onClick={slide}
        >
          ▼ SLIDE
        </button>
        <button
          className="pointer-events-auto flex-1 h-18 bg-slate-800/80 active:bg-blue-600 text-white rounded-2xl border border-slate-600 font-bold text-xl flex items-center justify-center backdrop-blur-md"
          onClick={() => changeLane(1)}
        >
          ▶
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

export default PokiSubwaySurfersGame;
