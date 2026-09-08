import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiDisasterArenaGameProps {
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

interface Meteor {
  x: number;
  y: number;
  warningTime: number;
  exploded: boolean;
  radius: number;
}

export const PokiDisasterArenaGame: React.FC<PokiDisasterArenaGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 30;

  const [timeLeft, setTimeLeft] = useState(30);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 200,
    py: 400,
    targetX: 200,
    targetY: 400,
    speed: 200,
    surviveTime: 30,
    meteors: [] as Meteor[],
    spawnTimer: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokidisasterarena',
      gameTitle: isKo ? 'Disaster Arena (재난 아레나)' : 'Disaster Arena',
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
        s.surviveTime -= dt;
        setTimeLeft(Math.max(0, Math.ceil(s.surviveTime)));

        if (s.surviveTime <= 0) {
          handleVictory();
        }

        // Move to target
        const dx = s.targetX - s.px;
        const dy = s.targetY - s.py;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          s.px += (dx / dist) * s.speed * dt;
          s.py += (dy / dist) * s.speed * dt;
        }

        // Spawn meteors
        s.spawnTimer += dt;
        if (s.spawnTimer > 0.6) {
          s.spawnTimer = 0;
          s.meteors.push({
            x: 50 + Math.random() * (canvas.width - 100),
            y: 120 + Math.random() * (canvas.height - 200),
            warningTime: 1.2,
            exploded: false,
            radius: 40
          });
        }

        // Update meteors
        for (let i = s.meteors.length - 1; i >= 0; i--) {
          const m = s.meteors[i];
          m.warningTime -= dt;

          if (m.warningTime <= 0 && !m.exploded) {
            m.exploded = true;
            if (playSfx) playSfx('/sfx/explosion.mp3');

            // Hit check
            if (Math.hypot(s.px - m.x, s.py - m.y) < m.radius) {
              // Pushback & penalty
              s.px += (s.px - m.x) * 1.5;
              s.py += (s.py - m.y) * 1.5;
              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
          }

          if (m.warningTime < -0.4) {
            s.meteors.splice(i, 1);
          }
        }

        // Bounds
        s.px = Math.max(30, Math.min(canvas.width - 30, s.px));
        s.py = Math.max(100, Math.min(canvas.height - 50, s.py));
      }

      // Render Lava Arena
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Meteors Warning & Explosion
      for (const m of s.meteors) {
        if (!m.exploded) {
          // Warning Circle
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.radius * (1 - m.warningTime / 1.2), 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Explosion Fire
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Player
      drawCardSprite(ctx, effectiveCardId, s.px - 22, s.py - 22, 44, 44);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      gameState.current.targetX = e.clientX - rect.left;
      gameState.current.targetY = e.clientY - rect.top;
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
        gameTitle={isKo ? 'Disaster Arena (재난 아레나)' : 'Disaster Arena'}
        currentScore={30 - timeLeft}
        targetScore={30}
        onBack={handleExit}
        stageInfo={`${isKo ? '생존 시간' : 'Time'}: ${timeLeft}s`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-orange-200 pointer-events-none">
        {isKo ? '화면을 터치하여 이동하세요. 붉은 경고 원 안으로 떨어지는 운석을 회피하세요!' : 'Tap anywhere to move. Evade incoming meteors in red circles!'}
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

export default PokiDisasterArenaGame;
