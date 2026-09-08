import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBlastBuddiesGameProps {
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

interface Bomb {
  x: number;
  y: number;
  timer: number;
  exploded: boolean;
}

export const PokiBlastBuddiesGame: React.FC<PokiBlastBuddiesGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 62;

  const [blocksDestroyed, setBlocksDestroyed] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 180,
    py: 450,
    targetX: 180,
    targetY: 450,
    bombs: [] as Bomb[],
    totalBlocks: 0,
    blocks: [
      { x: 80, y: 200, alive: true },
      { x: 180, y: 200, alive: true },
      { x: 280, y: 200, alive: true },
      { x: 120, y: 320, alive: true },
      { x: 240, y: 320, alive: true },
    ]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiblastbuddies',
      gameTitle: isKo ? '블래스트 버디즈' : 'Blast Buddies',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const placeBomb = useCallback(() => {
    const s = gameState.current;
    s.bombs.push({ x: s.px, y: s.py, timer: 1.5, exploded: false });
    if (playSfx) playSfx('/sfx/bomb_drop.mp3');
    if (navigator.vibrate) navigator.vibrate(20);
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
        // Move
        const dx = s.targetX - s.px;
        const dy = s.targetY - s.py;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          s.px += (dx / dist) * 160 * dt;
          s.py += (dy / dist) * 160 * dt;
        }

        // Update Bombs
        for (let i = s.bombs.length - 1; i >= 0; i--) {
          const b = s.bombs[i];
          b.timer -= dt;
          if (b.timer <= 0 && !b.exploded) {
            b.exploded = true;
            if (playSfx) playSfx('/sfx/explosion.mp3');
            if (navigator.vibrate) navigator.vibrate([60, 40, 60]);

            // Blast blocks
            for (const bl of s.blocks) {
              if (bl.alive && Math.hypot(b.x - bl.x, b.y - bl.y) < 90) {
                bl.alive = false;
                s.totalBlocks++;
                setBlocksDestroyed(s.totalBlocks);
                if (s.totalBlocks >= s.blocks.length) {
                  handleVictory();
                }
              }
            }
          }

          if (b.timer < -0.3) {
            s.bombs.splice(i, 1);
          }
        }
      }

      // Render Grid Arena
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Blocks
      for (const bl of s.blocks) {
        if (bl.alive) {
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.roundRect(bl.x - 20, bl.y - 20, 40, 40, 6);
          ctx.fill();
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Bombs
      for (const b of s.bombs) {
        if (!b.exploded) {
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(b.x, b.y, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(b.x - 3, b.y - 22, 6, 8);
        } else {
          // Cross fire
          ctx.fillStyle = '#f97316';
          ctx.fillRect(b.x - 80, b.y - 12, 160, 24);
          ctx.fillRect(b.x - 12, b.y - 80, 24, 160);
        }
      }

      // Player Buddy Card Sprite
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
        gameTitle={isKo ? '블래스트 버디즈' : 'Blast Buddies'}
        currentScore={blocksDestroyed}
        targetScore={5}
        onBack={handleExit}
        stageInfo={`💣 Blocks: ${blocksDestroyed}/5`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Bomb Button */}
      <div className="absolute bottom-6 inset-x-6 flex justify-center z-20">
        <button
          className="w-full max-w-sm h-20 bg-rose-600 active:bg-rose-500 border-2 border-rose-400 text-white font-bold text-2xl rounded-2xl shadow-xl active:scale-95 transition-transform"
          onClick={placeBomb}
        >
          {isKo ? '폭탄 설치! 💣' : 'PLACE BOMB! 💣'}
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

export default PokiBlastBuddiesGame;
