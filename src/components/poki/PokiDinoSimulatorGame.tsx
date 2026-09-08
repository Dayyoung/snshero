import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiDinoSimulatorGameProps {
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

interface MeatItem {
  x: number;
  y: number;
  eaten: boolean;
}

export const PokiDinoSimulatorGame: React.FC<PokiDinoSimulatorGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 57;

  const [eatenCount, setEatenCount] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 80,
    py: 450,
    vy: 0,
    isGrounded: true,
    speed: 260,
    items: [] as MeatItem[],
    spawnTimer: 0,
    totalEaten: 0,
    groundY: 450
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokidinosimulator',
      gameTitle: isKo ? '디노 시뮬레이터' : 'Dino Simulator',
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
      gameState.current.groundY = canvas.height * 0.7;
      gameState.current.py = gameState.current.groundY;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon) {
        // Gravity
        s.vy += 36 * dt;
        s.py += s.vy;
        if (s.py >= s.groundY) {
          s.py = s.groundY;
          s.vy = 0;
          s.isGrounded = true;
        }

        // Spawn meat
        s.spawnTimer += dt;
        if (s.spawnTimer > 1.2) {
          s.spawnTimer = 0;
          s.items.push({ x: canvas.width + 40, y: s.groundY - 20, eaten: false });
        }

        // Update items
        for (let i = s.items.length - 1; i >= 0; i--) {
          const it = s.items[i];
          it.x -= s.speed * dt;

          if (!it.eaten && Math.hypot(s.px - it.x, s.py - it.y) < 40) {
            it.eaten = true;
            s.totalEaten++;
            setEatenCount(s.totalEaten);
            if (playSfx) playSfx('/sfx/eat.mp3');
            if (navigator.vibrate) navigator.vibrate(20);
            if (s.totalEaten >= 8) {
              handleVictory();
            }
          }

          if (it.x < -40) s.items.splice(i, 1);
        }
      }

      // Render Jurassic Landscape
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dirt ground
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, s.groundY + 20, canvas.width, canvas.height - s.groundY);

      // Meats
      for (const it of s.items) {
        if (!it.eaten) {
          ctx.font = '24px monospace';
          ctx.fillText('🥩', it.x - 12, it.y + 10);
        }
      }

      // T-Rex Card Sprite
      drawCardSprite(ctx, effectiveCardId, s.px - 28, s.py - 35, 56, 56);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, gameWon, handleVictory, playSfx]);

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onClick={jump}
    >
      <MinimalistMissionHUD
        gameTitle={isKo ? '디노 시뮬레이터' : 'Dino Simulator'}
        currentScore={eatenCount}
        targetScore={8}
        onBack={handleExit}
        stageInfo={`🥩 Eaten: ${eatenCount}/8`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-6 inset-x-6 text-center z-20 pointer-events-none">
        <span className="inline-block bg-slate-900/80 border border-slate-700 text-white font-bold py-3 px-8 rounded-full text-base backdrop-blur-md animate-pulse">
          {isKo ? '화면 아무 곳이나 탭하여 점프 & 고기 먹기!' : 'TAP ANYWHERE TO JUMP & EAT!'}
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

export default PokiDinoSimulatorGame;
