import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPaperIoGameProps {
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

export const PokiPaperIoGame: React.FC<PokiPaperIoGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 4;

  const [territoryPct, setTerritoryPct] = useState(5);
  const [score, setScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    playerX: 300,
    playerY: 400,
    angle: 0,
    speed: 3.5,
    trail: [] as { x: number; y: number }[],
    baseCenter: { x: 300, y: 400 },
    baseRadius: 70,
    outside: false,
    score: 0,
    won: false,
    startTime: Date.now()
  });

  const triggerHaptic = (ms = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch {}
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const tx = t.clientX - rect.left;
    const ty = t.clientY - rect.top;
    gameStateRef.current.angle = Math.atan2(ty - gameStateRef.current.playerY, tx - gameStateRef.current.playerX);
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
      gameStateRef.current.playerX = canvas.width / 2;
      gameStateRef.current.playerY = canvas.height / 2;
      gameStateRef.current.baseCenter = { x: canvas.width / 2, y: canvas.height / 2 };
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const gs = gameStateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      if (!gs.won) {
        gs.playerX += Math.cos(gs.angle) * gs.speed;
        gs.playerY += Math.sin(gs.angle) * gs.speed;
        gs.playerX = Math.max(30, Math.min(w - 30, gs.playerX));
        gs.playerY = Math.max(80, Math.min(h - 40, gs.playerY));

        const distToBase = Math.hypot(gs.playerX - gs.baseCenter.x, gs.playerY - gs.baseCenter.y);
        const inBase = distToBase < gs.baseRadius;

        if (!inBase) {
          gs.outside = true;
          gs.trail.push({ x: gs.playerX, y: gs.playerY });
        } else if (gs.outside && inBase) {
          gs.outside = false;
          gs.baseRadius = Math.min(220, gs.baseRadius + gs.trail.length * 0.4);
          gs.score += gs.trail.length * 10;
          gs.trail = [];
          triggerHaptic(20);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

          const pct = Math.min(100, Math.floor((Math.PI * gs.baseRadius * gs.baseRadius) / (w * h * 0.5) * 100));
          setTerritoryPct(pct);
          setScore(gs.score);
        }

        if (territoryPct >= 30 && !gs.won) {
          gs.won = true;
          triggerHaptic(60);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          const elapsedSec = Math.max(5, Math.floor((Date.now() - gs.startTime) / 1000));
          const receipt = calculateAndDepositMissionReward({
            gameId: 'poki_paperio',
            gameTitle: isKo ? '페이퍼 io 2' : 'Paper.io 2',
            durationSeconds: elapsedSec,
            score: gs.score,
            maxTargetScore: 1000,
            isVictory: true
          });
          setRewardReceipt(receipt);
          setGameWon(true);
          onReward?.(receipt.totalSns);
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, w, h);

      // Base
      ctx.fillStyle = 'rgba(14, 165, 233, 0.35)';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(gs.baseCenter.x, gs.baseCenter.y, gs.baseRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ribbon
      if (gs.trail.length > 1) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(gs.trail[0].x, gs.trail[0].y);
        for (let i = 1; i < gs.trail.length; i++) ctx.lineTo(gs.trail[i].x, gs.trail[i].y);
        ctx.stroke();
      }

      // Player Head
      const pSize = 44;
      drawCardSprite(ctx, effectiveCardId, gs.playerX - pSize / 2, gs.playerY - pSize / 2, pSize, pSize, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#38bdf8',
        shadowBlur: 8,
        shadowColor: '#38bdf8'
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, isKo, onReward, playSfx, territoryPct]);

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchMove={handleTouchMove}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <MinimalistMissionHUD
        title={isKo ? '페이퍼 io 2' : 'Paper.io 2'}
        score={score}
        targetScore={1000}
        stageInfo={`${territoryPct}% / 30%`}
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

export default PokiPaperIoGame;
