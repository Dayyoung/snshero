import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBackroomsRecoveryGameProps {
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

interface Tape {
  x: number;
  y: number;
  collected: boolean;
}

export const PokiBackroomsRecoveryGame: React.FC<PokiBackroomsRecoveryGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 19;

  const [tapes, setTapes] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 180,
    py: 450,
    targetX: 180,
    targetY: 450,
    speed: 160,
    tapesList: [
      { x: 70, y: 150, collected: false },
      { x: 310, y: 160, collected: false },
      { x: 80, y: 350, collected: false },
      { x: 300, y: 360, collected: false },
    ] as Tape[],
    exitPos: { x: 200, y: 120, open: false },
    entity: { x: 200, y: 220, vx: 60, vy: 40 }
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokibackroomsrecovery',
      gameTitle: isKo ? 'Backrooms Recovery (백룸 리커버리)' : 'Backrooms Recovery',
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
        // Player move to target
        const dx = s.targetX - s.px;
        const dy = s.targetY - s.py;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          s.px += (dx / dist) * s.speed * dt;
          s.py += (dy / dist) * s.speed * dt;
        }

        // Entity patrol
        s.entity.x += s.entity.vx * dt;
        s.entity.y += s.entity.vy * dt;
        if (s.entity.x < 60 || s.entity.x > canvas.width - 60) s.entity.vx = -s.entity.vx;
        if (s.entity.y < 160 || s.entity.y > 420) s.entity.vy = -s.entity.vy;

        // Collect VHS
        for (const t of s.tapesList) {
          if (!t.collected && Math.hypot(s.px - t.x, s.py - t.y) < 30) {
            t.collected = true;
            const collectedCount = s.tapesList.filter(it => it.collected).length;
            setTapes(collectedCount);
            if (playSfx) playSfx('/sfx/tape.mp3');
            if (navigator.vibrate) navigator.vibrate(20);

            if (collectedCount >= s.tapesList.length) {
              s.exitPos.open = true;
            }
          }
        }

        // Check Exit
        if (s.exitPos.open && Math.hypot(s.px - s.exitPos.x, s.py - s.exitPos.y) < 40) {
          handleVictory();
        }

        // Entity touch penalty
        if (Math.hypot(s.px - s.entity.x, s.py - s.entity.y) < 25) {
          s.px = 180;
          s.py = 450;
          if (navigator.vibrate) navigator.vibrate([100, 100]);
        }
      }

      // Render Yellow Wallpaper Maze
      ctx.fillStyle = '#42371c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Maze walls
      ctx.fillStyle = '#715a24';
      ctx.fillRect(30, 90, canvas.width - 60, 15);
      ctx.fillRect(30, 480, canvas.width - 60, 15);
      ctx.fillRect(30, 90, 15, 405);
      ctx.fillRect(canvas.width - 45, 90, 15, 405);
      ctx.fillRect(140, 220, 100, 15);

      // Exit Door
      ctx.fillStyle = s.exitPos.open ? '#22c55e' : '#64748b';
      ctx.fillRect(s.exitPos.x - 20, s.exitPos.y - 20, 40, 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(s.exitPos.open ? 'EXIT' : 'LOCKED', s.exitPos.x - 18, s.exitPos.y + 4);

      // VHS Tapes
      for (const t of s.tapesList) {
        if (!t.collected) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(t.x - 12, t.y - 8, 24, 16);
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px monospace';
          ctx.fillText('VHS', t.x - 8, t.y + 4);
        }
      }

      // Entity
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(s.entity.x, s.entity.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(s.entity.x - 4, s.entity.y - 2, 2.5, 0, Math.PI * 2);
      ctx.arc(s.entity.x + 4, s.entity.y - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Flashlight Radial Vision
      const gradient = ctx.createRadialGradient(s.px, s.py, 30, s.px, s.py, 150);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.8, 'rgba(0,0,0,0.6)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.95)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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
        gameTitle={isKo ? 'Backrooms Recovery (백룸 리커버리)' : 'Backrooms Recovery'}
        currentScore={tapes}
        targetScore={4}
        onBack={handleExit}
        stageInfo={`VHS: ${tapes}/4 | ${tapes === 4 ? (isKo ? '탈출구 개방!' : 'EXIT OPEN!') : (isKo ? '테이프 수색 중' : 'Searching')}`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-amber-200 pointer-events-none bg-slate-950/70 p-2 rounded-lg backdrop-blur-md">
        {isKo ? '터치하여 이동하세요. 괴물을 피해 VHS 테이프 4개를 모으고 비상구로 탈출하세요!' : 'Tap to move. Avoid entities, collect 4 tapes, and escape!'}
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

export default PokiBackroomsRecoveryGame;
