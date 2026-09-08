import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiHillClimbRacingLiteGameProps {
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

export const PokiHillClimbRacingLiteGame: React.FC<PokiHillClimbRacingLiteGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 88;

  const [dist, setDist] = useState(0);
  const [coins, setCoins] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 60,
    py: 420,
    vx: 0,
    isGas: false,
    isBrake: false,
    coinsCollected: 0,
    distance: 0,
    cameraX: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokihillclimbracinglite',
      gameTitle: isKo ? '힐 클라임 레이싱 라이트' : 'Hill Climb Racing',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const getTerrainY = (x: number) => {
    return 430 - Math.sin(x * 0.006) * 50 - Math.cos(x * 0.015) * 20;
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
        if (s.isGas) s.vx = Math.min(280, s.vx + 320 * dt);
        else if (s.isBrake) s.vx = Math.max(0, s.vx - 400 * dt);
        else s.vx *= 0.98;

        s.px += s.vx * dt;
        s.py = getTerrainY(s.px);
        s.distance = Math.floor(s.px);
        setDist(s.distance);

        s.cameraX += (s.px - canvas.width * 0.3 - s.cameraX) * 0.1;

        if (s.distance >= 500) {
          handleVictory();
        }
      }

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-s.cameraX, 0);

      // Hills
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(s.cameraX - 50, canvas.height);
      for (let x = s.cameraX - 50; x < s.cameraX + canvas.width + 50; x += 20) {
        ctx.lineTo(x, getTerrainY(x));
      }
      ctx.lineTo(s.cameraX + canvas.width + 50, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Hill Climb Jeep
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(s.px - 25, s.py - 25, 50, 20, 4);
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(s.px - 16, s.py - 5, 8, 0, Math.PI * 2);
      ctx.arc(s.px + 16, s.py - 5, 8, 0, Math.PI * 2);
      ctx.fill();

      // Driver Sprite
      drawCardSprite(ctx, effectiveCardId, s.px - 14, s.py - 42, 28, 28);

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
        gameTitle={isKo ? '힐 클라임 레이싱 라이트' : 'Hill Climb Racing'}
        currentScore={dist}
        targetScore={500}
        onBack={handleExit}
        stageInfo={`🚗 ${dist}m / 500m`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Gas / Brake Pedals */}
      <div className="absolute bottom-6 inset-x-6 flex justify-between gap-6 z-20">
        <button
          className="flex-1 h-20 bg-rose-700/80 active:bg-rose-600 border-2 border-rose-400 text-white font-bold text-xl rounded-2xl backdrop-blur-md"
          onTouchStart={() => { gameState.current.isBrake = true; }}
          onTouchEnd={() => { gameState.current.isBrake = false; }}
          onMouseDown={() => { gameState.current.isBrake = true; }}
          onMouseUp={() => { gameState.current.isBrake = false; }}
        >
          BRAKE
        </button>
        <button
          className="flex-1 h-20 bg-emerald-600/80 active:bg-emerald-500 border-2 border-emerald-400 text-white font-bold text-xl rounded-2xl backdrop-blur-md"
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

export default PokiHillClimbRacingLiteGame;
