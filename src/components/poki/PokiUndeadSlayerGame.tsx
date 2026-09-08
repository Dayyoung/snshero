import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiUndeadSlayerGameProps {
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

export const PokiUndeadSlayerGame: React.FC<PokiUndeadSlayerGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 100;

  const [score, setScore] = useState(0);
  const targetScore = 15;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    playerX: 200,
    playerY: 400,
    undead: [] as { x: number; y: number; alive: boolean }[],
    slashMarks: [] as { x: number; y: number; alpha: number }[]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiundeadslayer',
      gameTitle: isKo ? '언데드 슬레이어' : 'Undead Slayer',
      durationSeconds: 15,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const initUndead = useCallback((w: number, h: number) => {
    const undead = [];
    const cx = w / 2;
    const cy = h * 0.55;
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI * 2) / 8;
      undead.push({
        x: cx + Math.cos(ang) * 140,
        y: cy + Math.sin(ang) * 140,
        alive: true
      });
    }
    gameState.current.undead = undead;
    gameState.current.playerX = cx;
    gameState.current.playerY = cy;
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
      initUndead(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Card Avatar
      drawCardSprite(ctx, effectiveCardId, w / 2, h * 0.14, 50, 50);

      const s = gameState.current;

      // Render Slashes
      s.slashMarks.forEach((sm, idx) => {
        ctx.strokeStyle = `rgba(239, 68, 68, ${sm.alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(sm.x, sm.y, 24, 0, Math.PI * 2);
        ctx.stroke();
        sm.alpha -= 0.05;
        if (sm.alpha <= 0) s.slashMarks.splice(idx, 1);
      });

      // Render Undead
      s.undead.forEach((un) => {
        if (un.alive) {
          const ang = Math.atan2(s.playerY - un.y, s.playerX - un.x);
          un.x += Math.cos(ang) * 0.6;
          un.y += Math.sin(ang) * 0.6;

          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.arc(un.x, un.y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(un.x - 4, un.y - 4, 3, 3);
          ctx.fillRect(un.x + 2, un.y - 4, 3, 3);
        }
      });

      // Player Slayer
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.arc(s.playerX, s.playerY, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Guide
      ctx.fillStyle = '#c4b5fd';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '화면을 탭/스와이프하여 접근하는 언데드를 베어 넘기세요!' : 'Tap/swipe to slash approaching undead!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, initUndead, isKo]);

  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameWon) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const tx = touch.clientX - rect.left;
    const ty = touch.clientY - rect.top;

    gameState.current.slashMarks.push({ x: tx, y: ty, alpha: 1.0 });

    gameState.current.undead.forEach((un) => {
      if (un.alive && Math.hypot(tx - un.x, ty - un.y) < 45) {
        un.alive = false;
        if (navigator.vibrate) navigator.vibrate(30);
        setScore((prev) => {
          const next = prev + 1;
          if (next >= targetScore) handleVictory();
          return next;
        });
        setTimeout(() => {
          const ang = Math.random() * Math.PI * 2;
          un.x = gameState.current.playerX + Math.cos(ang) * 160;
          un.y = gameState.current.playerY + Math.sin(ang) * 160;
          un.alive = true;
        }, 1000);
      }
    });
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '언데드 슬레이어' : 'Undead Slayer'}
        subtitle="UNDEAD SWORD SLASH ACTION"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '언데드를 터치해 베어내세요!' : 'Slash undead!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onMouseDown={handleTouch as any}
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

export default PokiUndeadSlayerGame;
