import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiRailInAirGameProps {
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

export const PokiRailInAirGame: React.FC<PokiRailInAirGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 67;

  const [dist, setDist] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 80,
    py: 420,
    vy: 0,
    isGrounded: true,
    speed: 280,
    distance: 0,
    gaps: [500, 1100, 1600]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokirailinair',
      gameTitle: isKo ? '레일 인 디 에어' : 'Rail in the Air',
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
      if (navigator.vibrate) navigator.vibrate(20);
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
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon) {
        s.distance += s.speed * dt * 0.15;
        setDist(Math.floor(s.distance));

        if (s.distance >= 500) {
          handleVictory();
        }

        s.vy += 38 * dt;
        s.py += s.vy;

        if (s.py >= 420) {
          s.py = 420;
          s.vy = 0;
          s.isGrounded = true;
        }
      }

      // Render Sky
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(80, 160, 40, 0, Math.PI * 2);
      ctx.arc(260, 220, 55, 0, Math.PI * 2);
      ctx.fill();

      // Rail in Air
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(0, 440);
      ctx.lineTo(canvas.width, 440);
      ctx.stroke();

      // Rail ties
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4;
      const offset = (s.distance * 30) % 30;
      for (let x = -offset; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 432);
        ctx.lineTo(x, 448);
        ctx.stroke();
      }

      // Coaster Cart
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(s.px - 25, s.py - 10, 50, 25, 6);
      ctx.fill();

      // Rider Card Sprite
      drawCardSprite(ctx, effectiveCardId, s.px - 18, s.py - 38, 36, 36);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, gameWon, handleVictory]);

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onClick={jump}
    >
      <MinimalistMissionHUD
        gameTitle={isKo ? '레일 인 디 에어' : 'Rail in the Air'}
        currentScore={dist}
        targetScore={500}
        onBack={handleExit}
        stageInfo={`🎢 ${dist}m / 500m`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-6 inset-x-6 text-center z-20 pointer-events-none">
        <span className="inline-block bg-slate-900/80 border border-slate-700 text-white font-bold py-3 px-8 rounded-full text-base backdrop-blur-md animate-pulse">
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

export default PokiRailInAirGame;
