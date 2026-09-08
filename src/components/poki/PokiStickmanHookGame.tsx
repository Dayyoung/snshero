import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStickmanHookGameProps {
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

interface HookPoint {
  x: number;
  y: number;
}

export const PokiStickmanHookGame: React.FC<PokiStickmanHookGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 20;

  const [progress, setProgress] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 80,
    py: 350,
    vx: 6,
    vy: 0,
    cameraX: 0,
    hookedIndex: null as number | null,
    ropeLength: 0,
    ropeAngle: 0,
    angularVelocity: 0,
    isHolding: false,
    hookPoints: [] as HookPoint[],
    finishX: 2400
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokistickmanhook',
      gameTitle: isKo ? 'Stickman Hook (스틱맨 훅)' : 'Stickman Hook',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const attachHook = useCallback(() => {
    const s = gameState.current;
    if (s.hookedIndex !== null) return;

    // Find nearest hook point ahead of player
    let bestIdx = -1;
    let minDist = 300;
    for (let i = 0; i < s.hookPoints.length; i++) {
      const p = s.hookPoints[i];
      const dist = Math.hypot(p.x - s.px, p.y - s.py);
      if (dist < minDist && p.x >= s.px - 50) {
        minDist = dist;
        bestIdx = i;
      }
    }

    if (bestIdx !== -1) {
      const target = s.hookPoints[bestIdx];
      s.hookedIndex = bestIdx;
      s.ropeLength = Math.hypot(s.px - target.x, s.py - target.y);
      s.ropeAngle = Math.atan2(s.py - target.y, s.px - target.x);
      // Tangential velocity
      s.angularVelocity = (s.vx * Math.sin(s.ropeAngle) - s.vy * Math.cos(s.ropeAngle)) / s.ropeLength;
      if (playSfx) playSfx('/sfx/hook.mp3');
      if (navigator.vibrate) navigator.vibrate(20);
    }
  }, [playSfx]);

  const releaseHook = useCallback(() => {
    const s = gameState.current;
    if (s.hookedIndex === null) return;

    const target = s.hookPoints[s.hookedIndex];
    // Convert angular velocity to linear
    const speed = s.angularVelocity * s.ropeLength;
    s.vx = -speed * Math.sin(s.ropeAngle);
    s.vy = speed * Math.cos(s.ropeAngle);
    s.hookedIndex = null;
    if (navigator.vibrate) navigator.vibrate(15);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate Hook Points
    const hPoints: HookPoint[] = [];
    for (let x = 200; x <= 2400; x += 180 + Math.random() * 40) {
      hPoints.push({ x, y: 140 + Math.random() * 80 });
    }
    gameState.current.hookPoints = hPoints;

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
        if (s.hookedIndex !== null) {
          // Pendulum swing physics
          const anchor = s.hookPoints[s.hookedIndex];
          const gravityTorque = (32 / s.ropeLength) * Math.sin(s.ropeAngle);
          s.angularVelocity -= gravityTorque * dt;
          s.ropeAngle += s.angularVelocity;
          s.px = anchor.x + s.ropeLength * Math.cos(s.ropeAngle);
          s.py = anchor.y + s.ropeLength * Math.sin(s.ropeAngle);
        } else {
          // Free flight physics
          s.vy += 22 * dt;
          s.px += s.vx;
          s.py += s.vy;

          // Ground bounce pad
          if (s.py > canvas.height - 60) {
            s.py = canvas.height - 60;
            s.vy = -14;
            if (navigator.vibrate) navigator.vibrate(25);
          }
        }

        // Camera follow
        s.cameraX += (s.px - canvas.width * 0.3 - s.cameraX) * 0.1;

        // Progress
        const pct = Math.min(100, Math.floor((s.px / s.finishX) * 100));
        setProgress(pct);
        if (s.px >= s.finishX) {
          handleVictory();
        }
      }

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-s.cameraX, 0);

      // Trampolines on floor
      ctx.fillStyle = '#eab308';
      for (let x = 0; x < s.finishX + 400; x += 300) {
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - 50, 120, 15, 6);
        ctx.fill();
      }

      // Hook Points
      for (let i = 0; i < s.hookPoints.length; i++) {
        const hp = s.hookPoints[i];
        ctx.fillStyle = s.hookedIndex === i ? '#f97316' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Rope Line
      if (s.hookedIndex !== null) {
        const anchor = s.hookPoints[s.hookedIndex];
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(anchor.x, anchor.y);
        ctx.lineTo(s.px, s.py);
        ctx.stroke();
      }

      // Finish Line
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(s.finishX, 80, 20, canvas.height - 80);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('FINISH', s.finishX - 25, 60);

      // Player
      drawCardSprite(ctx, effectiveCardId, s.px - 22, s.py - 22, 44, 44);

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, gameWon, handleVictory]);

  const onTouchStart = () => {
    gameState.current.isHolding = true;
    attachHook();
  };

  const onTouchEnd = () => {
    gameState.current.isHolding = false;
    releaseHook();
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onTouchStart}
      onMouseUp={onTouchEnd}
    >
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Stickman Hook (스틱맨 훅)' : 'Stickman Hook'}
        currentScore={progress}
        targetScore={100}
        onBack={handleExit}
        stageInfo={`${progress}% / 100%`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-6 inset-x-6 text-center z-20 pointer-events-none">
        <span className="inline-block bg-slate-900/80 border border-slate-700 text-white font-bold py-3 px-8 rounded-full text-base backdrop-blur-md animate-pulse">
          {isKo ? '누르고 있으면 로프 스윙! 떼면 발사!' : 'HOLD TO HOOK & SWING! RELEASE TO FLY!'}
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

export default PokiStickmanHookGame;
