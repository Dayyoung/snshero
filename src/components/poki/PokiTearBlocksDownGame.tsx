import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiTearBlocksDownGameProps {
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

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  hit: boolean;
}

export const PokiTearBlocksDownGame: React.FC<PokiTearBlocksDownGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 58;

  const [hitCount, setHitCount] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    blocks: [] as Block[],
    cannonball: null as { x: number; y: number; vx: number; vy: number } | null,
    totalHits: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokitearblocksdown',
      gameTitle: isKo ? '블록 타워 물리 폭파' : 'Tear Blocks Down',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const shootCannon = useCallback((tx: number, ty: number) => {
    const s = gameState.current;
    if (s.cannonball) return;

    const angle = Math.atan2(ty - 500, tx - 80);
    const speed = 650;
    s.cannonball = {
      x: 80,
      y: 500,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed
    };
    if (playSfx) playSfx('/sfx/cannon.mp3');
    if (navigator.vibrate) navigator.vibrate(25);
  }, [playSfx]);

  useEffect(() => {
    // Generate Block Tower
    const bList: Block[] = [];
    const bx = 260;
    for (let r = 0; r < 8; r++) {
      bList.push({
        x: bx,
        y: 480 - r * 35,
        w: 60,
        h: 30,
        hit: false
      });
    }
    gameState.current.blocks = bList;

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
        if (s.cannonball) {
          s.cannonball.vy += 350 * dt; // Gravity
          s.cannonball.x += s.cannonball.vx * dt;
          s.cannonball.y += s.cannonball.vy * dt;

          // Check hit blocks
          for (const b of s.blocks) {
            if (!b.hit && Math.hypot(s.cannonball.x - (b.x + b.w / 2), s.cannonball.y - (b.y + b.h / 2)) < 35) {
              b.hit = true;
              s.totalHits++;
              setHitCount(s.totalHits);
              if (navigator.vibrate) navigator.vibrate([40, 40]);

              if (s.totalHits >= 5) {
                handleVictory();
              }
            }
          }

          if (s.cannonball.y > canvas.height || s.cannonball.x > canvas.width + 50) {
            s.cannonball = null;
          }
        }
      }

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ground
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 510, canvas.width, canvas.height - 510);

      // Block Tower
      for (const b of s.blocks) {
        if (b.hit) {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(b.x + 40, 500, b.w, 10);
        } else {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.roundRect(b.x, b.y, b.w, b.h, 4);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Cannon
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(80, 500, 25, 0, Math.PI * 2);
      ctx.fill();

      // Cannonball
      if (s.cannonball) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(s.cannonball.x, s.cannonball.y, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      // Demolition Expert Card Sprite
      drawCardSprite(ctx, effectiveCardId, 25, 460, 44, 44);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      shootCannon(e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.addEventListener('pointerdown', onPointerDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [effectiveCardId, gameWon, handleVictory, shootCannon]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '블록 타워 물리 폭파' : 'Tear Blocks Down'}
        currentScore={hitCount}
        targetScore={5}
        onBack={handleExit}
        stageInfo={`🧱 Collapsed: ${hitCount}/5`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-amber-200 pointer-events-none">
        {isKo ? '타워의 약점을 터치 조준하여 대포를 발사하고 타워를 무너뜨리세요!' : 'Aim and tap on tower weak points to demolish!'}
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

export default PokiTearBlocksDownGame;
