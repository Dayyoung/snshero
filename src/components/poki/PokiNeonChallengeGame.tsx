import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiNeonChallengeGameProps {
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
  x: number;
  type: 'spike' | 'block' | 'jumpPad';
  w: number;
  h: number;
}

export const PokiNeonChallengeGame: React.FC<PokiNeonChallengeGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 17;

  const [distance, setDistance] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 80,
    py: 400,
    vy: 0,
    isGrounded: true,
    rotation: 0,
    speed: 280,
    dist: 0,
    obstacles: [] as Obstacle[],
    groundY: 400
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokineonchallenge',
      gameTitle: isKo ? 'Neon Challenge Legends (네온 챌린지)' : 'Neon Challenge',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const jump = useCallback(() => {
    const s = gameState.current;
    if (s.isGrounded) {
      s.vy = -14.5;
      s.isGrounded = false;
      if (playSfx) playSfx('/sfx/jump.mp3');
      if (navigator.vibrate) navigator.vibrate(25);
    }
  }, [playSfx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate neon track
    const obs: Obstacle[] = [];
    let curX = 400;
    for (let i = 0; i < 35; i++) {
      curX += 220 + Math.random() * 180;
      const r = Math.random();
      const type = r < 0.5 ? 'spike' : r < 0.8 ? 'block' : 'jumpPad';
      obs.push({
        x: curX,
        type,
        w: type === 'spike' ? 30 : 40,
        h: type === 'spike' ? 30 : 40
      });
    }
    gameState.current.obstacles = obs;

    let animId: number;
    let lastTime = performance.now();

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      gameState.current.groundY = canvas.height * 0.68;
      gameState.current.py = gameState.current.groundY;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon) {
        s.dist += s.speed * dt * 0.2;
        setDistance(Math.floor(s.dist));

        if (s.dist >= 500) {
          handleVictory();
        }

        // Gravity
        s.vy += 38 * dt;
        s.py += s.vy;

        if (s.py >= s.groundY) {
          s.py = s.groundY;
          s.vy = 0;
          s.isGrounded = true;
          s.rotation = 0;
        } else {
          s.rotation += 8 * dt;
        }

        // Obstacles move left
        for (const o of s.obstacles) {
          o.x -= s.speed * dt;

          // Collision check
          if (Math.abs(s.px - o.x) < 25 && s.py >= s.groundY - 20) {
            if (o.type === 'jumpPad') {
              s.vy = -18;
              s.isGrounded = false;
              if (navigator.vibrate) navigator.vibrate(30);
            } else {
              // Spike or block hit -> respawn back slightly
              s.dist = Math.max(0, s.dist - 35);
              o.x += 150;
              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
          }
        }
      }

      // Render Neon Cyberpunk
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Neon grid
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      const offset = (now * 0.1) % 40;
      for (let x = -offset; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Neon ground
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, s.groundY + 20);
      ctx.lineTo(canvas.width, s.groundY + 20);
      ctx.stroke();

      // Obstacles
      for (const o of s.obstacles) {
        if (o.x < -50 || o.x > canvas.width + 50) continue;
        if (o.type === 'spike') {
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.moveTo(o.x, s.groundY + 20);
          ctx.lineTo(o.x + 15, s.groundY - 15);
          ctx.lineTo(o.x + 30, s.groundY + 20);
          ctx.closePath();
          ctx.fill();
        } else if (o.type === 'block') {
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(o.x, s.groundY - 20, 35, 40);
          ctx.strokeStyle = '#e9d5ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(o.x, s.groundY - 20, 35, 40);
        } else if (o.type === 'jumpPad') {
          ctx.fillStyle = '#eab308';
          ctx.fillRect(o.x, s.groundY + 10, 35, 10);
        }
      }

      // Player Neon Cube
      ctx.save();
      ctx.translate(s.px, s.py - 10);
      ctx.rotate(s.rotation);
      drawCardSprite(ctx, effectiveCardId, -22, -22, 44, 44);
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') jump();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [effectiveCardId, gameWon, handleVictory, jump]);

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onClick={jump}
    >
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Neon Challenge Legends (네온 챌린지)' : 'Neon Challenge'}
        currentScore={distance}
        targetScore={500}
        onBack={handleExit}
        stageInfo={`${distance}m / 500m (${Math.floor((distance / 500) * 100)}%)`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-6 inset-x-6 text-center z-20 pointer-events-none">
        <span className="inline-block bg-cyan-900/80 border border-cyan-500 text-cyan-200 font-bold py-3 px-8 rounded-full text-base backdrop-blur-md animate-pulse">
          {isKo ? '화면 아무 곳이나 탭하여 점프!' : 'TAP ANYWHERE TO JUMP!'}
        </span>
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

export default PokiNeonChallengeGame;
