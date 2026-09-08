import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSprintLeagueGameProps {
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

export const PokiSprintLeagueGame: React.FC<PokiSprintLeagueGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 64;

  const [dist, setDist] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 200,
    py: 520,
    speed: 0,
    distance: 0,
    lastFoot: '' as 'left' | 'right' | '',
    finishDist: 100
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokisprintleague',
      gameTitle: isKo ? '스프린트 리그' : 'Sprint League',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const tapFoot = useCallback((foot: 'left' | 'right') => {
    const s = gameState.current;
    if (s.lastFoot !== foot) {
      s.lastFoot = foot;
      s.speed = Math.min(25, s.speed + 4);
      if (navigator.vibrate) navigator.vibrate(15);
    }
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
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon) {
        s.speed = Math.max(0, s.speed - 6 * dt);
        s.distance += s.speed * dt;
        setDist(Math.floor(s.distance));

        if (s.distance >= s.finishDist) {
          handleVictory();
        }
      }

      // Render Track
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Track Lanes
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      const offset = (s.distance * 40) % 60;
      for (let y = -offset; y < canvas.height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(60, y);
        ctx.lineTo(canvas.width - 60, y);
        ctx.stroke();
      }

      // Sprinter Card Sprite
      drawCardSprite(ctx, effectiveCardId, canvas.width / 2 - 25, s.py - 30, 50, 50);

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
        gameTitle={isKo ? '스프린트 리그' : 'Sprint League'}
        currentScore={dist}
        targetScore={100}
        onBack={handleExit}
        stageInfo={`🏃 Distance: ${dist}m / 100m`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Left/Right Foot Sprint Buttons */}
      <div className="absolute bottom-6 inset-x-6 flex justify-between gap-6 z-20">
        <button
          className="flex-1 h-24 bg-blue-600 active:bg-blue-500 border-2 border-blue-400 text-white font-bold text-3xl rounded-3xl shadow-xl active:scale-95 transition-transform"
          onClick={() => tapFoot('left')}
        >
          LEFT 👟
        </button>
        <button
          className="flex-1 h-24 bg-red-600 active:bg-red-500 border-2 border-red-400 text-white font-bold text-3xl rounded-3xl shadow-xl active:scale-95 transition-transform"
          onClick={() => tapFoot('right')}
        >
          RIGHT 👟
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

export default PokiSprintLeagueGame;
