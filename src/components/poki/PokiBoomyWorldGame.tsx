import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBoomyWorldGameProps {
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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  popped: boolean;
}

export const PokiBoomyWorldGame: React.FC<PokiBoomyWorldGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 82;

  const [poppedCount, setPoppedCount] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    particles: [] as Particle[],
    blasts: [] as { x: number; y: number; r: number; maxR: number }[],
    totalPopped: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiboomyworld',
      gameTitle: isKo ? '부미 월드: 연쇄 폭파' : 'Boomy World',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const triggerBlast = useCallback((x: number, y: number) => {
    const s = gameState.current;
    s.blasts.push({ x, y, r: 0, maxR: 70 });
    if (playSfx) playSfx('/sfx/pop.mp3');
    if (navigator.vibrate) navigator.vibrate(20);
  }, [playSfx]);

  useEffect(() => {
    const pList: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      pList.push({
        x: 40 + Math.random() * 320,
        y: 120 + Math.random() * 400,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        r: 14,
        popped: false
      });
    }
    gameState.current.particles = pList;

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
        // Move particles
        for (const p of s.particles) {
          if (!p.popped) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            if (p.x < 20 || p.x > canvas.width - 20) p.vx = -p.vx;
            if (p.y < 100 || p.y > canvas.height - 50) p.vy = -p.vy;
          }
        }

        // Expand blasts
        for (let i = s.blasts.length - 1; i >= 0; i--) {
          const b = s.blasts[i];
          b.r += 140 * dt;

          // Check particle overlap -> chain reaction!
          for (const p of s.particles) {
            if (!p.popped && Math.hypot(p.x - b.x, p.y - b.y) < b.r + p.r) {
              p.popped = true;
              s.totalPopped++;
              setPoppedCount(s.totalPopped);
              // Trigger new blast!
              s.blasts.push({ x: p.x, y: p.y, r: 0, maxR: 60 });
              if (navigator.vibrate) navigator.vibrate(15);

              if (s.totalPopped >= 15) {
                handleVictory();
              }
            }
          }

          if (b.r >= b.maxR) {
            s.blasts.splice(i, 1);
          }
        }
      }

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Blasts
      for (const b of s.blasts) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Particles
      for (const p of s.particles) {
        if (!p.popped) {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Companion Card Sprite
      drawCardSprite(ctx, effectiveCardId, 30, 80, 44, 44);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      triggerBlast(e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.addEventListener('pointerdown', onPointerDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [effectiveCardId, gameWon, handleVictory, triggerBlast]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '부미 월드: 연쇄 폭파' : 'Boomy World'}
        currentScore={poppedCount}
        targetScore={15}
        onBack={handleExit}
        stageInfo={`💥 Chain: ${poppedCount}/15`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-cyan-200 pointer-events-none">
        {isKo ? '화면을 탭하여 첫 폭파를 일으키고 연쇄 반응으로 15개를 터뜨리세요!' : 'Tap anywhere to trigger a chain explosion!'}
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

export default PokiBoomyWorldGame;
