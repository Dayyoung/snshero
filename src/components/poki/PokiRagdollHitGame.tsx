import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiRagdollHitGameProps {
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

interface RagdollTarget {
  x: number;
  y: number;
  hp: number;
  knocked: boolean;
  vx: number;
  vy: number;
}

export const PokiRagdollHitGame: React.FC<PokiRagdollHitGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 24;

  const [knockedCount, setKnockedCount] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    slingshotOrigin: { x: 100, y: 450 },
    playerPos: { x: 100, y: 450 },
    playerVel: { x: 0, y: 0 },
    isAiming: false,
    isFlying: false,
    targets: [
      { x: 260, y: 430, hp: 1, knocked: false, vx: 0, vy: 0 },
      { x: 300, y: 360, hp: 1, knocked: false, vx: 0, vy: 0 },
      { x: 330, y: 430, hp: 1, knocked: false, vx: 0, vy: 0 },
    ] as RagdollTarget[],
    dragX: 100,
    dragY: 450
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiragdollhit',
      gameTitle: isKo ? 'Ragdoll Hit (래그돌 히트)' : 'Ragdoll Hit',
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
        if (s.isFlying) {
          s.playerVel.y += 24 * dt; // Gravity
          s.playerPos.x += s.playerVel.x * dt;
          s.playerPos.y += s.playerVel.y * dt;

          // Hit targets
          for (const t of s.targets) {
            if (!t.knocked && Math.hypot(s.playerPos.x - t.x, s.playerPos.y - t.y) < 40) {
              t.knocked = true;
              t.vx = s.playerVel.x * 0.7;
              t.vy = s.playerVel.y * 0.7 - 50;
              const count = s.targets.filter(it => it.knocked).length;
              setKnockedCount(count);
              if (playSfx) playSfx('/sfx/hit.mp3');
              if (navigator.vibrate) navigator.vibrate(30);

              if (count >= s.targets.length) {
                handleVictory();
              }
            }
          }

          // Ground bounce
          if (s.playerPos.y > canvas.height - 60) {
            s.playerPos.y = canvas.height - 60;
            s.playerVel.y = -s.playerVel.y * 0.5;
            s.playerVel.x *= 0.8;

            if (Math.abs(s.playerVel.x) < 20 && Math.abs(s.playerVel.y) < 20) {
              // Reset
              s.isFlying = false;
              s.playerPos = { ...s.slingshotOrigin };
            }
          }
        }

        // Targets physics
        for (const t of s.targets) {
          if (t.knocked) {
            t.vy += 30 * dt;
            t.x += t.vx * dt;
            t.y += t.vy * dt;
          }
        }
      }

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Slingshot pole
      ctx.fillStyle = '#b45309';
      ctx.fillRect(s.slingshotOrigin.x - 5, s.slingshotOrigin.y, 10, 80);

      // Band
      if (s.isAiming) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(s.slingshotOrigin.x, s.slingshotOrigin.y);
        ctx.lineTo(s.dragX, s.dragY);
        ctx.stroke();
      }

      // Targets
      for (const t of s.targets) {
        ctx.fillStyle = t.knocked ? '#64748b' : '#ef4444';
        ctx.beginPath();
        ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Player
      const px = s.isAiming ? s.dragX : s.playerPos.x;
      const py = s.isAiming ? s.dragY : s.playerPos.y;
      drawCardSprite(ctx, effectiveCardId, px - 22, py - 22, 44, 44);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (Math.hypot(mx - gameState.current.slingshotOrigin.x, my - gameState.current.slingshotOrigin.y) < 60) {
        gameState.current.isAiming = true;
        gameState.current.dragX = mx;
        gameState.current.dragY = my;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!gameState.current.isAiming) return;
      const rect = canvas.getBoundingClientRect();
      gameState.current.dragX = e.clientX - rect.left;
      gameState.current.dragY = e.clientY - rect.top;
    };

    const onPointerUp = () => {
      const s = gameState.current;
      if (s.isAiming) {
        s.isAiming = false;
        s.isFlying = true;
        const dx = s.slingshotOrigin.x - s.dragX;
        const dy = s.slingshotOrigin.y - s.dragY;
        s.playerVel.x = dx * 4;
        s.playerVel.y = dy * 4;
        s.playerPos = { x: s.dragX, y: s.dragY };
        if (playSfx) playSfx('/sfx/sling.mp3');
        if (navigator.vibrate) navigator.vibrate(25);
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [effectiveCardId, gameWon, handleVictory, playSfx]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Ragdoll Hit (래그돌 히트)' : 'Ragdoll Hit'}
        currentScore={knockedCount}
        targetScore={3}
        onBack={handleExit}
        stageInfo={`🎯 ${knockedCount}/3`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-slate-300 pointer-events-none">
        {isKo ? '캐릭터를 뒤로 당겼다 놓아 악당 래그돌들을 날려버리세요!' : 'Drag back and release to sling into the enemy ragdolls!'}
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

export default PokiRagdollHitGame;
