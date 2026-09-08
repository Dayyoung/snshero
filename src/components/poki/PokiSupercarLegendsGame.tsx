import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSupercarLegendsGameProps {
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

export const PokiSupercarLegendsGame: React.FC<PokiSupercarLegendsGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 72;

  const [laps, setLaps] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    carX: 200,
    carY: 480,
    angle: -Math.PI / 2,
    speed: 0,
    isSteerLeft: false,
    isSteerRight: false,
    lapProgress: 0,
    totalLaps: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokisupercarlegends',
      gameTitle: isKo ? '슈퍼카 레전드' : 'Supercar Legends',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

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
        s.speed = 260;

        if (s.isSteerLeft) s.angle -= 3.5 * dt;
        if (s.isSteerRight) s.angle += 3.5 * dt;

        s.carX += Math.cos(s.angle) * s.speed * dt;
        s.carY += Math.sin(s.angle) * s.speed * dt;

        s.lapProgress += dt;
        if (s.lapProgress >= 8) {
          s.lapProgress = 0;
          s.totalLaps++;
          setLaps(s.totalLaps);
          if (navigator.vibrate) navigator.vibrate(25);
          if (s.totalLaps >= 2) {
            handleVictory();
          }
        }

        // Screen boundary bounce
        s.carX = Math.max(40, Math.min(canvas.width - 40, s.carX));
        s.carY = Math.max(100, Math.min(canvas.height - 100, s.carY));
      }

      // Render Circuit
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Oval Asphalt Track
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, 330, 150, 180, 0, 0, Math.PI * 2);
      ctx.fill();

      // Infield Grass
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, 330, 80, 110, 0, 0, Math.PI * 2);
      ctx.fill();

      // Supercar
      ctx.save();
      ctx.translate(s.carX, s.carY);
      ctx.rotate(s.angle + Math.PI / 2);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(-16, -28, 32, 56, 6);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(-12, -18, 24, 16);

      // Driver Sprite
      drawCardSprite(ctx, effectiveCardId, -12, -12, 24, 24);
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
        gameTitle={isKo ? '슈퍼카 레전드' : 'Supercar Legends'}
        currentScore={laps}
        targetScore={2}
        onBack={handleExit}
        stageInfo={`🏎️ Laps: ${laps}/2`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Steer Buttons */}
      <div className="absolute bottom-6 inset-x-6 flex justify-between gap-6 z-20">
        <button
          className="flex-1 h-22 bg-slate-800/80 active:bg-amber-600 border-2 border-slate-600 text-white font-bold text-3xl rounded-3xl backdrop-blur-md"
          onTouchStart={() => { gameState.current.isSteerLeft = true; }}
          onTouchEnd={() => { gameState.current.isSteerLeft = false; }}
          onMouseDown={() => { gameState.current.isSteerLeft = true; }}
          onMouseUp={() => { gameState.current.isSteerLeft = false; }}
        >
          ◀ STEER
        </button>
        <button
          className="flex-1 h-22 bg-slate-800/80 active:bg-amber-600 border-2 border-slate-600 text-white font-bold text-3xl rounded-3xl backdrop-blur-md"
          onTouchStart={() => { gameState.current.isSteerRight = true; }}
          onTouchEnd={() => { gameState.current.isSteerRight = false; }}
          onMouseDown={() => { gameState.current.isSteerRight = true; }}
          onMouseUp={() => { gameState.current.isSteerRight = false; }}
        >
          STEER ▶
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

export default PokiSupercarLegendsGame;
