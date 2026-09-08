import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCryzenGameProps {
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

export const PokiCryzenGame: React.FC<PokiCryzenGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 8;

  const [kills, setKills] = useState(0);
  const [score, setScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    px: 200,
    py: 400,
    targetX: 200,
    targetY: 400,
    kills: 0,
    score: 0,
    won: false,
    startTime: Date.now(),
    bullets: [] as { x: number; y: number; vx: number; vy: number }[],
    bots: [] as { x: number; y: number; hp: number; vx: number }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[]
  });

  const triggerHaptic = (ms = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch {}
    }
  };

  const handlePointerDown = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const tx = clientX - rect.left;
    const ty = clientY - rect.top;
    const gs = gameStateRef.current;

    // Fire bullet toward tap/click
    const angle = Math.atan2(ty - gs.py, tx - gs.px);
    gs.bullets.push({
      x: gs.px,
      y: gs.py,
      vx: Math.cos(angle) * 12,
      vy: Math.sin(angle) * 12
    });
    triggerHaptic(15);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    gameStateRef.current.targetX = clientX - rect.left;
    gameStateRef.current.targetY = clientY - rect.top;
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
      if (gs.bots.length === 0) {
        for (let i = 0; i < 5; i++) {
          gs.bots.push({ x: 40 + Math.random() * (canvas.width - 80), y: 100 + Math.random() * 200, hp: 3, vx: 2 });
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const gs = gameStateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      if (!gs.won) {
        // Player smooth move
        gs.px += (gs.targetX - gs.px) * 0.15;
        gs.py += (gs.targetY - gs.py) * 0.15;

        // Bullets
        for (let i = gs.bullets.length - 1; i >= 0; i--) {
          const b = gs.bullets[i];
          b.x += b.vx;
          b.y += b.vy;
          if (b.x < 0 || b.x > w || b.y < 0 || b.y > h) {
            gs.bullets.splice(i, 1);
            continue;
          }

          // Hit bot
          for (let j = gs.bots.length - 1; j >= 0; j--) {
            const bot = gs.bots[j];
            if (Math.hypot(b.x - bot.x, b.y - bot.y) < 22) {
              bot.hp--;
              gs.bullets.splice(i, 1);
              triggerHaptic(20);
              if (bot.hp <= 0) {
                gs.bots.splice(j, 1);
                gs.kills++;
                gs.score += 150;
                setKills(gs.kills);
                setScore(gs.score);
                // Respawn bot
                gs.bots.push({ x: 40 + Math.random() * (w - 80), y: 100 + Math.random() * 200, hp: 3, vx: (Math.random() - 0.5) * 4 });
              }
              break;
            }
          }
        }

        // Bots movement
        for (const bot of gs.bots) {
          bot.x += bot.vx;
          if (bot.x < 30 || bot.x > w - 30) bot.vx = -bot.vx;
        }

        // Victory: 8 kills
        if (gs.kills >= 8 && !gs.won) {
          gs.won = true;
          triggerHaptic(60);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          const elapsedSec = Math.max(5, Math.floor((Date.now() - gs.startTime) / 1000));
          const receipt = calculateAndDepositMissionReward({
            gameId: 'poki_cryzen',
            gameTitle: isKo ? '크라이젠 io' : 'Cryzen.io',
            durationSeconds: elapsedSec,
            score: gs.score,
            maxTargetScore: 1200,
            isVictory: true
          });
          setRewardReceipt(receipt);
          setGameWon(true);
          onReward?.(receipt.totalSns);
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Bullets
      ctx.fillStyle = '#f59e0b';
      for (const b of gs.bullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bots
      for (const bot of gs.bots) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(bot.x, bot.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`HP ${bot.hp}`, bot.x, bot.y - 20);
      }

      // Player Hero
      const pSize = 48;
      drawCardSprite(ctx, effectiveCardId, gs.px - pSize / 2, gs.py - pSize / 2, pSize, pSize, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#38bdf8',
        shadowBlur: 10,
        shadowColor: '#38bdf8'
      });

      animId = requestAnimationFrame(loop);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const gs = gameStateRef.current;
      const step = 30;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') gs.targetX = Math.max(30, gs.targetX - step);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') gs.targetX = Math.min(canvas.width - 30, gs.targetX + step);
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') gs.targetY = Math.max(80, gs.targetY - step);
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') gs.targetY = Math.min(canvas.height - 80, gs.targetY + step);
      if (e.key === ' ' || e.key === 'Spacebar') {
        handlePointerDown(gs.targetX, gs.targetY - 100);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [effectiveCardId, isKo, onReward, playSfx]);

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (t) handlePointerDown(t.clientX, t.clientY);
      }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        if (t) handlePointerMove(t.clientX, t.clientY);
      }}
      onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block cursor-crosshair" />

      <MinimalistMissionHUD
        title={isKo ? '크라이젠 io' : 'Cryzen.io'}
        score={score}
        targetScore={1200}
        stageInfo={`KILLS: ${kills} / 8`}
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

export default PokiCryzenGame;
