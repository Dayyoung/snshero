import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPingPongGoGameProps {
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

export const PokiPingPongGoGame: React.FC<PokiPingPongGoGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 74;

  const [score, setScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    paddleX: 200,
    targetPaddleX: 200,
    aiPaddleX: 200,
    ballX: 200,
    ballY: 300,
    ballVx: 180,
    ballVy: 260,
    playerScore: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokipingponggo',
      gameTitle: isKo ? '핑퐁 고!' : 'Ping Pong Go!',
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
        // Player paddle move
        s.paddleX += (s.targetPaddleX - s.paddleX) * 15 * dt;

        // AI paddle follow ball
        s.aiPaddleX += (s.ballX - s.aiPaddleX) * 4 * dt;

        // Ball move
        s.ballX += s.ballVx * dt;
        s.ballY += s.ballVy * dt;

        // Wall bounce
        if (s.ballX < 20 || s.ballX > canvas.width - 20) {
          s.ballVx = -s.ballVx;
        }

        // Top AI paddle hit
        if (s.ballVy < 0 && s.ballY < 130 && Math.abs(s.ballX - s.aiPaddleX) < 45) {
          s.ballVy = -s.ballVy;
          if (navigator.vibrate) navigator.vibrate(15);
        }

        // Bottom Player paddle hit
        if (s.ballVy > 0 && s.ballY > 480 && Math.abs(s.ballX - s.paddleX) < 50) {
          s.ballVy = -s.ballVy;
          s.playerScore++;
          setScore(s.playerScore);
          if (playSfx) playSfx('/sfx/hit.mp3');
          if (navigator.vibrate) navigator.vibrate(20);

          if (s.playerScore >= 5) {
            handleVictory();
          }
        }

        // Reset if lost
        if (s.ballY > 520 || s.ballY < 90) {
          s.ballX = canvas.width / 2;
          s.ballY = 300;
          s.ballVy = 260;
        }
      }

      // Render Ping Pong Table
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Table net
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 300);
      ctx.lineTo(canvas.width, 300);
      ctx.stroke();

      // AI Paddle
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(s.aiPaddleX - 35, 110, 70, 14);

      // Player Paddle
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(s.paddleX - 40, 490, 80, 14);

      // Ball
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, 10, 0, Math.PI * 2);
      ctx.fill();

      // Player Card Sprite
      drawCardSprite(ctx, effectiveCardId, s.paddleX - 20, 520, 40, 40);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      gameState.current.targetPaddleX = e.clientX - rect.left;
    };

    canvas.addEventListener('pointerdown', onPointer);
    canvas.addEventListener('pointermove', (e: PointerEvent) => {
      if (e.buttons > 0) onPointer(e);
    });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointer);
    };
  }, [effectiveCardId, gameWon, handleVictory, playSfx]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '핑퐁 고!' : 'Ping Pong Go!'}
        currentScore={score}
        targetScore={5}
        onBack={handleExit}
        stageInfo={`🏓 Rally: ${score}/5`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

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

export default PokiPingPongGoGame;
