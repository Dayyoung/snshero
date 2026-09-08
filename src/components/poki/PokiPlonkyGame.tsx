import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPlonkyGameProps {
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

interface Peg {
  x: number;
  y: number;
  r: number;
  hit: boolean;
  color: string;
  points: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  active: boolean;
}

export const PokiPlonkyGame: React.FC<PokiPlonkyGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 18;

  const [score, setScore] = useState(0);
  const [ballsLeft, setBallsLeft] = useState(5);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    cannonAngle: Math.PI / 2,
    aimX: 200,
    aimY: 200,
    pegs: [] as Peg[],
    ball: null as Ball | null,
    basketX: 200,
    basketDir: 1,
    currentScore: 0,
    remainingBalls: 5
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiplonky',
      gameTitle: isKo ? 'Plonky (플롱키)' : 'Plonky',
      durationSeconds: 30,
      score: gameState.current.currentScore,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const dropBall = useCallback(() => {
    const s = gameState.current;
    if (s.ball || s.remainingBalls <= 0) return;

    const angle = s.cannonAngle;
    const speed = 12;
    s.ball = {
      x: 200,
      y: 90,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 10,
      active: true
    };
    s.remainingBalls--;
    setBallsLeft(s.remainingBalls);
    if (playSfx) playSfx('/sfx/pop.mp3');
    if (navigator.vibrate) navigator.vibrate(25);
  }, [playSfx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate Pegs
    const pList: Peg[] = [];
    const rows = 6;
    for (let r = 0; r < rows; r++) {
      const count = r % 2 === 0 ? 6 : 7;
      const startX = r % 2 === 0 ? 60 : 40;
      for (let c = 0; c < count; c++) {
        const isOrange = Math.random() < 0.35;
        pList.push({
          x: startX + c * 50,
          y: 180 + r * 50,
          r: 10,
          hit: false,
          color: isOrange ? '#f97316' : '#38bdf8',
          points: isOrange ? 100 : 30
        });
      }
    }
    gameState.current.pegs = pList;

    let animId: number;
    let lastTime = performance.now();

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon) {
        // Basket movement
        s.basketX += s.basketDir * 120 * dt;
        if (s.basketX < 80 || s.basketX > canvas.width - 80) s.basketDir = -s.basketDir;

        // Ball physics
        if (s.ball && s.ball.active) {
          s.ball.vy += 26 * dt; // Gravity
          s.ball.x += s.ball.vx;
          s.ball.y += s.ball.vy;

          // Wall bounces
          if (s.ball.x < 15 || s.ball.x > canvas.width - 15) {
            s.ball.vx = -s.ball.vx * 0.8;
            s.ball.x = Math.max(15, Math.min(canvas.width - 15, s.ball.x));
          }

          // Peg collisions
          for (const p of s.pegs) {
            const dist = Math.hypot(s.ball.x - p.x, s.ball.y - p.y);
            if (dist < s.ball.r + p.r) {
              // Reflect
              const nx = (s.ball.x - p.x) / dist;
              const ny = (s.ball.y - p.y) / dist;
              const dot = s.ball.vx * nx + s.ball.vy * ny;
              s.ball.vx = (s.ball.vx - 2 * dot * nx) * 0.8;
              s.ball.vy = (s.ball.vy - 2 * dot * ny) * 0.8;

              if (!p.hit) {
                p.hit = true;
                s.currentScore += p.points;
                setScore(s.currentScore);
                if (navigator.vibrate) navigator.vibrate(15);
                if (s.currentScore >= 600) {
                  handleVictory();
                }
              }
            }
          }

          // Bottom check
          if (s.ball.y > canvas.height - 40) {
            // Check basket
            if (Math.abs(s.ball.x - s.basketX) < 40) {
              s.currentScore += 200;
              s.remainingBalls++;
              setBallsLeft(s.remainingBalls);
              setScore(s.currentScore);
              if (navigator.vibrate) navigator.vibrate([40, 40]);
            }
            s.ball = null;

            if (s.remainingBalls <= 0 && s.currentScore < 600) {
              // Free retry refill
              s.remainingBalls = 3;
              setBallsLeft(3);
            }
          }
        }
      }

      // Render
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pegs
      for (const p of s.pegs) {
        ctx.fillStyle = p.hit ? '#94a3b8' : p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Moving Basket
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.roundRect(s.basketX - 35, canvas.height - 50, 70, 20, 6);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('+200 & 🏀', s.basketX - 25, canvas.height - 36);

      // Cannon & Character
      const cannonX = canvas.width / 2;
      ctx.save();
      ctx.translate(cannonX, 70);
      ctx.rotate(s.cannonAngle - Math.PI / 2);
      ctx.fillStyle = '#475569';
      ctx.fillRect(-10, 0, 20, 35);
      ctx.restore();

      drawCardSprite(ctx, effectiveCardId, cannonX - 24, 25, 48, 48);

      // Active Ball
      if (s.ball && s.ball.active) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cannonX = canvas.width / 2;
      gameState.current.cannonAngle = Math.atan2(my - 70, mx - cannonX);
    };

    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerdown', onPointer);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('pointerdown', onPointer);
    };
  }, [effectiveCardId, gameWon, handleVictory]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Plonky (플롱키)' : 'Plonky'}
        currentScore={score}
        targetScore={600}
        onBack={handleExit}
        stageInfo={`${score}/600 | 🏀 ${ballsLeft}`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Action Button */}
      <div className="absolute bottom-6 inset-x-6 flex justify-center z-20">
        <button
          className="w-full max-w-sm h-16 bg-blue-600 active:bg-blue-500 border-2 border-blue-400 text-white font-bold text-xl rounded-2xl shadow-xl active:scale-95 transition-transform"
          onClick={dropBall}
        >
          {isKo ? '구슬 발사 (DROP BALL)' : 'DROP BALL'}
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

export default PokiPlonkyGame;
