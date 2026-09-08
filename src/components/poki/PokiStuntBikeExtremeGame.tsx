import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStuntBikeExtremeGameProps {
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

export const PokiStuntBikeExtremeGame: React.FC<PokiStuntBikeExtremeGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 33;

  const [distance, setDistance] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 100,
    py: 400,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVel: 0,
    isGas: false,
    isBrake: false,
    cameraX: 0,
    finishX: 2000
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokistuntbike',
      gameTitle: isKo ? 'Stunt Bike Extreme (스턴트 바이크)' : 'Stunt Bike',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const getGroundY = (x: number) => {
    return 420 - Math.sin(x * 0.008) * 60 - Math.sin(x * 0.02) * 30;
  };

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
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon) {
        // Controls
        if (s.isGas) {
          s.vx = Math.min(380, s.vx + 450 * dt);
          s.angularVel = 2;
        } else if (s.isBrake) {
          s.vx = Math.max(0, s.vx - 500 * dt);
          s.angularVel = -2;
        } else {
          s.vx *= 0.98;
          s.angularVel = 0;
        }

        s.px += s.vx * dt;
        setDistance(Math.floor(s.px));

        const gy = getGroundY(s.px);
        if (s.py >= gy - 15) {
          s.py = gy - 15;
          s.vy = 0;
          // Align bike to slope
          const gyNext = getGroundY(s.px + 20);
          const slope = Math.atan2(gyNext - gy, 20);
          s.angle += (slope - s.angle) * 10 * dt;
        } else {
          s.vy += 500 * dt; // Gravity in air
          s.py += s.vy * dt;
          s.angle += s.angularVel * dt;
        }

        s.cameraX += (s.px - canvas.width * 0.3 - s.cameraX) * 0.1;

        if (s.px >= s.finishX) {
          handleVictory();
        }
      }

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-s.cameraX, 0);

      // Hill Ground Terrain
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(s.cameraX - 50, canvas.height);
      for (let x = s.cameraX - 50; x < s.cameraX + canvas.width + 50; x += 20) {
        ctx.lineTo(x, getGroundY(x));
      }
      ctx.lineTo(s.cameraX + canvas.width + 50, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Finish Line
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(s.finishX, 200, 20, 260);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('GOAL', s.finishX - 15, 180);

      // Stunt Bike
      ctx.save();
      ctx.translate(s.px, s.py);
      ctx.rotate(s.angle);

      // Wheels
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-20, 10, 10, 0, Math.PI * 2);
      ctx.arc(20, 10, 10, 0, Math.PI * 2);
      ctx.fill();

      // Bike Frame
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-20, 10);
      ctx.lineTo(0, -5);
      ctx.lineTo(20, 10);
      ctx.stroke();

      // Rider Card Sprite
      drawCardSprite(ctx, effectiveCardId, -15, -35, 32, 32);

      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, gameWon, handleVictory]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Stunt Bike Extreme (스턴트 바이크)' : 'Stunt Bike'}
        currentScore={distance}
        targetScore={2000}
        onBack={handleExit}
        stageInfo={`${distance}m / 2000m`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Gas / Brake Touch Pedals */}
      <div className="absolute bottom-6 inset-x-6 flex justify-between gap-6 z-20 pointer-events-none">
        <button
          className="pointer-events-auto flex-1 h-20 bg-rose-700/80 active:bg-rose-600 text-white rounded-2xl border-2 border-rose-400 font-bold text-xl flex items-center justify-center backdrop-blur-md active:scale-95"
          onTouchStart={() => { gameState.current.isBrake = true; }}
          onTouchEnd={() => { gameState.current.isBrake = false; }}
          onMouseDown={() => { gameState.current.isBrake = true; }}
          onMouseUp={() => { gameState.current.isBrake = false; }}
        >
          BRAKE
        </button>
        <button
          className="pointer-events-auto flex-1 h-20 bg-emerald-600/80 active:bg-emerald-500 text-white rounded-2xl border-2 border-emerald-400 font-bold text-xl flex items-center justify-center backdrop-blur-md active:scale-95"
          onTouchStart={() => { gameState.current.isGas = true; }}
          onTouchEnd={() => { gameState.current.isGas = false; }}
          onMouseDown={() => { gameState.current.isGas = true; }}
          onMouseUp={() => { gameState.current.isGas = false; }}
        >
          GAS ▶
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

export default PokiStuntBikeExtremeGame;
