import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBulletBrosGameProps {
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

export const PokiBulletBrosGame: React.FC<PokiBulletBrosGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 98;

  const [score, setScore] = useState(0);
  const targetScore = 5;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    playerX: 200,
    playerY: 450,
    playerVx: 0,
    playerVy: 0,
    aiming: false,
    dragStart: { x: 0, y: 0 },
    enemies: [] as { x: number; y: number; alive: boolean }[]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokibulletbros',
      gameTitle: isKo ? '불릿 브로스' : 'Bullet Bros',
      durationSeconds: 15,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const initEnemies = useCallback((w: number, h: number) => {
    const enemies = [];
    for (let i = 0; i < 5; i++) {
      enemies.push({
        x: Math.random() * (w - 120) + 60,
        y: Math.random() * (h * 0.4) + h * 0.22,
        alive: true
      });
    }
    gameState.current.enemies = enemies;
    gameState.current.playerX = w / 2;
    gameState.current.playerY = h * 0.7;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initEnemies(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Card Avatar
      drawCardSprite(ctx, effectiveCardId, w / 2, h * 0.12, 50, 50);

      const s = gameState.current;

      // Player Physics
      s.playerVy += 0.25;
      s.playerX += s.playerVx;
      s.playerY += s.playerVy;
      s.playerVx *= 0.95;

      if (s.playerY > h * 0.78) {
        s.playerY = h * 0.78;
        s.playerVy = 0;
      }
      if (s.playerX < 30) s.playerX = 30;
      if (s.playerX > w - 30) s.playerX = w - 30;

      // Enemies
      s.enemies.forEach((en) => {
        if (en.alive) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(en.x - 14, en.y - 18, 28, 36);
          ctx.fillStyle = '#fff';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💀', en.x, en.y + 5);
        }
      });

      // Player
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(s.playerX - 14, s.playerY - 20, 28, 40);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(s.playerX - 10, s.playerY - 14, 20, 10);

      // Aim line
      if (s.aiming) {
        ctx.beginPath();
        ctx.moveTo(s.playerX, s.playerY);
        ctx.lineTo(s.dragStart.x, s.dragStart.y);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Guide
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '터치 조준 & 손을 떼 반동 점프로 적을 저격하세요!' : 'Aim with touch and release to recoil-shoot enemies!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, initEnemies, isKo]);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameWon) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    gameState.current.aiming = true;
    gameState.current.dragStart = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!gameState.current.aiming) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    gameState.current.dragStart = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const handleTouchEnd = () => {
    const s = gameState.current;
    if (s.aiming) {
      const dx = s.playerX - s.dragStart.x;
      const dy = s.playerY - s.dragStart.y;
      s.playerVx = dx * 0.12;
      s.playerVy = dy * 0.12;
      s.aiming = false;

      // Kill enemy near crosshair
      s.enemies.forEach((en) => {
        if (en.alive && Math.hypot(en.x - s.dragStart.x, en.y - s.dragStart.y) < 65) {
          en.alive = false;
          if (navigator.vibrate) navigator.vibrate(40);
          setScore((prev) => {
            const next = prev + 1;
            if (next >= targetScore) handleVictory();
            return next;
          });
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '불릿 브로스' : 'Bullet Bros'}
        subtitle="BULLET TIME GUNFIGHT"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '조준 후 손을 떼 저격하세요!' : 'Aim and recoil shoot!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart as any}
        onMouseMove={handleTouchMove as any}
        onMouseUp={handleTouchEnd}
      />

      {gameWon && rewardReceipt && (
        <VictoryRewardModal
          isOpen={true}
          isVictory={true}
          score={score}
          targetScore={targetScore}
          rewardAmount={rewardReceipt.totalSns}
          onClose={handleExit}
        />
      )}
    </div>
  );
};

export default PokiBulletBrosGame;
