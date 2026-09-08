import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiRagdollChaosGameProps {
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

export const PokiRagdollChaosGame: React.FC<PokiRagdollChaosGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 10;

  const [score, setScore] = useState(0);
  const [bounces, setBounces] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    rx: 200,
    ry: 200,
    vx: 0,
    vy: 0,
    isDragging: false,
    score: 0,
    bounces: 0,
    won: false,
    startTime: Date.now(),
    bumpers: [
      { x: 120, y: 350, r: 40 },
      { x: 280, y: 320, r: 45 },
      { x: 200, y: 500, r: 50 }
    ]
  });

  const triggerHaptic = (ms = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch {}
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const tx = t.clientX - rect.left;
    const ty = t.clientY - rect.top;
    const gs = gameStateRef.current;

    if (Math.hypot(tx - gs.rx, ty - gs.ry) < 60) {
      gs.isDragging = true;
      gs.vx = 0;
      gs.vy = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const gs = gameStateRef.current;
    if (gs.isDragging) {
      const tx = t.clientX - rect.left;
      const ty = t.clientY - rect.top;
      gs.vx = (tx - gs.rx) * 0.8;
      gs.vy = (ty - gs.ry) * 0.8;
      gs.rx = tx;
      gs.ry = ty;
    }
  };

  const handleTouchEnd = () => {
    const gs = gameStateRef.current;
    if (gs.isDragging) {
      gs.isDragging = false;
      triggerHaptic(25);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const gs = gameStateRef.current;
      gs.bumpers = [
        { x: canvas.width * 0.3, y: canvas.height * 0.45, r: 40 },
        { x: canvas.width * 0.7, y: canvas.height * 0.42, r: 45 },
        { x: canvas.width * 0.5, y: canvas.height * 0.65, r: 50 }
      ];
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const gs = gameStateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      if (!gs.won) {
        if (!gs.isDragging) {
          gs.vy += 0.5; // Gravity
          gs.rx += gs.vx;
          gs.ry += gs.vy;

          // Wall bounces
          if (gs.rx < 30) { gs.rx = 30; gs.vx = -gs.vx * 0.8; }
          if (gs.rx > w - 30) { gs.rx = w - 30; gs.vx = -gs.vx * 0.8; }
          if (gs.ry > h - 40) { gs.ry = h - 40; gs.vy = -gs.vy * 0.7; }
          if (gs.ry < 80) { gs.ry = 80; gs.vy = -gs.vy * 0.8; }

          // Bumper collision
          for (const b of gs.bumpers) {
            const dist = Math.hypot(gs.rx - b.x, gs.ry - b.y);
            if (dist < b.r + 26) {
              const angle = Math.atan2(gs.ry - b.y, gs.rx - b.x);
              gs.vx = Math.cos(angle) * 16;
              gs.vy = Math.sin(angle) * 16;
              gs.bounces++;
              gs.score += 50;
              setBounces(gs.bounces);
              setScore(gs.score);
              triggerHaptic(30);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            }
          }
        }

        // Victory condition: 500 score
        if (gs.score >= 500 && !gs.won) {
          gs.won = true;
          triggerHaptic(60);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          const elapsedSec = Math.max(5, Math.floor((Date.now() - gs.startTime) / 1000));
          const receipt = calculateAndDepositMissionReward({
            gameId: 'poki_ragdollchaos',
            gameTitle: isKo ? '래그돌 카오스' : 'Ragdoll Chaos',
            durationSeconds: elapsedSec,
            score: gs.score,
            maxTargetScore: 500,
            isVictory: true
          });
          setRewardReceipt(receipt);
          setGameWon(true);
          onReward?.(receipt.totalSns);
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Bumpers
      for (const b of gs.bumpers) {
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r - 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BOUNCE', b.x, b.y);
      }
      ctx.shadowBlur = 0;

      // Floppy hero ragdoll
      const pSize = 52;
      drawCardSprite(ctx, effectiveCardId, gs.rx - pSize / 2, gs.ry - pSize / 2, pSize, pSize, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#ec4899',
        shadowBlur: 10,
        shadowColor: '#ec4899'
      });

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '래그돌을 잡아서 힘껏 던지세요! (범퍼 충돌 점수)' : 'Fling the ragdoll into bumpers!', w / 2, h - 30);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, isKo]);

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <MinimalistMissionHUD
        title={isKo ? '래그돌 카오스' : 'Ragdoll Chaos'}
        score={score}
        targetScore={500}
        stageInfo={`BOUNCES: ${bounces}`}
        onExit={handleExit}
        unit="pt"
      />

      {gameWon && (
        <VictoryRewardModal
          isOpen={gameWon}
          rewardReceipt={rewardReceipt}
          onClose={handleExit}
          onClaimBonus={handleExit}
          language={isKo ? 'ko' : 'en'}
        />
      )}
    </div>
  );
};

export default PokiRagdollChaosGame;
