import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStealBrainrotGameProps {
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

interface Guard {
  x: number;
  y: number;
  angle: number;
  speed: number;
  radius: number;
}

export const PokiStealBrainrotGame: React.FC<PokiStealBrainrotGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 21;

  const [hasCube, setHasCube] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 180,
    py: 550,
    targetX: 180,
    targetY: 550,
    speed: 160,
    stolen: false,
    vault: { x: 180, y: 140, r: 25 },
    escapeZone: { x: 180, y: 560, w: 120, h: 40 },
    guards: [
      { x: 100, y: 320, angle: 0, speed: 1.5, radius: 60 },
      { x: 260, y: 240, angle: Math.PI, speed: -1.2, radius: 60 },
    ] as Guard[]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokistealbrainrot',
      gameTitle: isKo ? 'Steal a Brainrot (브레인롯 탈취)' : 'Steal a Brainrot',
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
      gameState.current.vault.x = canvas.width / 2;
      gameState.current.escapeZone.x = canvas.width / 2 - 60;
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

        // Steal cube check
        if (!s.stolen && Math.hypot(s.px - s.vault.x, s.py - s.vault.y) < 35) {
          s.stolen = true;
          setHasCube(true);
          if (playSfx) playSfx('/sfx/alarm.mp3');
          if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
        }

        // Escape check
        if (s.stolen && s.py > 530) {
          handleVictory();
        }

        // Guards patrol & sight cones
        for (const g of s.guards) {
          g.angle += g.speed * dt;
          const cx = g.x + Math.cos(g.angle) * g.radius;
          const cy = g.y + Math.sin(g.angle) * 30;

          // Guard sight cone check
          const gToPlayerDist = Math.hypot(s.px - cx, s.py - cy);
          if (gToPlayerDist < 80) {
            // Spotted! Respawn player
            s.px = canvas.width / 2;
            s.py = 550;
            s.targetX = s.px;
            s.targetY = s.py;
            s.stolen = false;
            setHasCube(false);
            if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
          }
        }
      }

      // Render Vault Room
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Escape zone
      ctx.fillStyle = s.stolen ? '#22c55e33' : '#334155';
      ctx.fillRect(s.escapeZone.x, s.escapeZone.y, s.escapeZone.w, s.escapeZone.h);
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText(s.stolen ? 'ESCAPE HERE!' : 'START', s.escapeZone.x + 20, s.escapeZone.y + 24);

      // Vault with Brainrot Cube
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(s.vault.x, s.vault.y, s.vault.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (!s.stolen) {
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(s.vault.x - 12, s.vault.y - 12, 24, 24);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('ROT', s.vault.x - 8, s.vault.y + 4);
      }

      // Guards & Flashlight cones
      for (const g of s.guards) {
        const cx = g.x + Math.cos(g.angle) * g.radius;
        const cy = g.y + Math.sin(g.angle) * 30;

        // Sight cone
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.beginPath();
        ctx.arc(cx, cy, 80, g.angle - 0.5, g.angle + 0.5);
        ctx.lineTo(cx, cy);
        ctx.fill();

        // Guard body
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player
      drawCardSprite(ctx, effectiveCardId, s.px - 22, s.py - 22, 44, 44);

      // If holding cube
      if (s.stolen) {
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(s.px + 14, s.py - 25, 16, 16);
      }

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
        gameTitle={isKo ? 'Steal a Brainrot (브레인롯 탈취)' : 'Steal a Brainrot'}
        currentScore={hasCube ? 1 : 0}
        targetScore={1}
        onBack={handleExit}
        stageInfo={hasCube ? (isKo ? '탈출 구역으로 귀환하세요!' : 'ESCAPE TO EXIT!') : (isKo ? '금고의 브레인롯을 훔치세요!' : 'Steal Brainrot!')}
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

export default PokiStealBrainrotGame;
