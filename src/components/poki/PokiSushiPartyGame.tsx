import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSushiPartyGameProps {
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

interface Sushi {
  x: number;
  y: number;
  type: string;
}

export const PokiSushiPartyGame: React.FC<PokiSushiPartyGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 34;

  const [length, setLength] = useState(5);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    snake: [{ x: 200, y: 350 }] as { x: number; y: number }[],
    angle: 0,
    speed: 150,
    sushis: [] as Sushi[],
    targetX: 200,
    targetY: 350
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokisushiparty',
      gameTitle: isKo ? 'Sushi Party (스시 파티)' : 'Sushi Party',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  useEffect(() => {
    const s = gameState.current;
    s.snake = [];
    for (let i = 0; i < 5; i++) {
      s.snake.push({ x: 200, y: 350 + i * 15 });
    }

    const sList: Sushi[] = [];
    for (let i = 0; i < 20; i++) {
      sList.push({
        x: 40 + Math.random() * 300,
        y: 100 + Math.random() * 500,
        type: '🍣'
      });
    }
    s.sushis = sList;

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

      if (!gameWon) {
        // Turn angle towards target
        const head = s.snake[0];
        const targetAngle = Math.atan2(s.targetY - head.y, s.targetX - head.x);
        s.angle = targetAngle;

        // Move head
        const nx = head.x + Math.cos(s.angle) * s.speed * dt;
        const ny = head.y + Math.sin(s.angle) * s.speed * dt;
        s.snake.unshift({ x: nx, y: ny });
        s.snake.pop();

        // Collect sushi
        for (let i = s.sushis.length - 1; i >= 0; i--) {
          const su = s.sushis[i];
          if (Math.hypot(head.x - su.x, head.y - su.y) < 25) {
            s.sushis.splice(i, 1);
            // Grow snake
            const tail = s.snake[s.snake.length - 1];
            s.snake.push({ ...tail });
            setLength(s.snake.length);
            if (playSfx) playSfx('/sfx/eat.mp3');
            if (navigator.vibrate) navigator.vibrate(15);

            if (s.snake.length >= 15) {
              handleVictory();
            }
          }
        }
      }

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sushi items
      for (const su of s.sushis) {
        ctx.font = '20px monospace';
        ctx.fillText(su.type, su.x - 10, su.y + 8);
      }

      // Snake body (Sushi rolls)
      for (let i = s.snake.length - 1; i >= 1; i--) {
        const seg = s.snake[i];
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Snake Head Card Sprite
      const head = s.snake[0];
      drawCardSprite(ctx, effectiveCardId, head.x - 22, head.y - 22, 44, 44);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      s.targetX = e.clientX - rect.left;
      s.targetY = e.clientY - rect.top;
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
        gameTitle={isKo ? 'Sushi Party (스시 파티)' : 'Sushi Party'}
        currentScore={length}
        targetScore={15}
        onBack={handleExit}
        stageInfo={`🍣 ${length}/15 Sushi Length`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-slate-300 pointer-events-none">
        {isKo ? '화면을 터치하여 스시 뱀을 조종하고 맛있는 초밥을 먹어 성장하세요!' : 'Touch to guide your sushi snake and eat delicious rolls!'}
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

export default PokiSushiPartyGame;
