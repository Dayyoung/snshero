import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiVectariaGameProps {
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

export const PokiVectariaGame: React.FC<PokiVectariaGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 7;

  const [wood, setWood] = useState(0);
  const [stone, setStone] = useState(0);
  const [score, setScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    px: 200,
    py: 300,
    wood: 0,
    stone: 0,
    score: 0,
    won: false,
    startTime: Date.now(),
    nodes: [] as { x: number; y: number; type: 'tree' | 'rock'; hp: number }[],
    zombies: [] as { x: number; y: number; hp: number }[]
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

    // Move player toward touch/click
    gs.px = tx;
    gs.py = ty;

    // Harvest nearby resource
    for (let i = gs.nodes.length - 1; i >= 0; i--) {
      const n = gs.nodes[i];
      if (Math.hypot(n.x - tx, n.y - ty) < 45) {
        n.hp--;
        triggerHaptic(15);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        if (n.hp <= 0) {
          if (n.type === 'tree') { gs.wood += 3; setWood(gs.wood); }
          else { gs.stone += 2; setStone(gs.stone); }
          gs.score += 40;
          setScore(gs.score);
          gs.nodes.splice(i, 1);
        }
        return;
      }
    }

    // Strike nearby zombie
    for (let i = gs.zombies.length - 1; i >= 0; i--) {
      const z = gs.zombies[i];
      if (Math.hypot(z.x - tx, z.y - ty) < 45) {
        z.hp--;
        triggerHaptic(30);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        if (z.hp <= 0) {
          gs.zombies.splice(i, 1);
          gs.score += 100;
          setScore(gs.score);
        }
        return;
      }
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
      if (gs.nodes.length === 0) {
        for (let i = 0; i < 8; i++) {
          gs.nodes.push({ x: 60 + Math.random() * (canvas.width - 120), y: 100 + Math.random() * (canvas.height - 180), type: 'tree', hp: 2 });
          gs.nodes.push({ x: 60 + Math.random() * (canvas.width - 120), y: 100 + Math.random() * (canvas.height - 180), type: 'rock', hp: 3 });
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let zTimer = 0;

    const loop = () => {
      const gs = gameStateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      if (!gs.won) {
        zTimer++;
        if (zTimer > 90 && gs.zombies.length < 4) {
          zTimer = 0;
          gs.zombies.push({
            x: Math.random() < 0.5 ? 20 : w - 20,
            y: Math.random() * h,
            hp: 2
          });
        }

        for (const z of gs.zombies) {
          const angle = Math.atan2(gs.py - z.y, gs.px - z.x);
          z.x += Math.cos(angle) * 1.3;
          z.y += Math.sin(angle) * 1.3;
        }

        if (gs.wood >= 12 && gs.stone >= 8 && !gs.won) {
          gs.won = true;
          triggerHaptic(60);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          const elapsedSec = Math.max(5, Math.floor((Date.now() - gs.startTime) / 1000));
          const receipt = calculateAndDepositMissionReward({
            gameId: 'poki_vectaria',
            gameTitle: isKo ? '벡타리아 io' : 'Vectaria.io',
            durationSeconds: elapsedSec,
            score: gs.score,
            maxTargetScore: 600,
            isVictory: true
          });
          setRewardReceipt(receipt);
          setGameWon(true);
          onReward?.(receipt.totalSns);
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#14532d'; // Grassland
      ctx.fillRect(0, 0, w, h);

      // Draw resource nodes
      for (const n of gs.nodes) {
        if (n.type === 'tree') {
          ctx.fillStyle = '#166534';
          ctx.beginPath();
          ctx.arc(n.x, n.y, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('🌲', n.x, n.y + 4);
        } else {
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.roundRect(n.x - 14, n.y - 12, 28, 24, 6);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('🪨', n.x, n.y + 4);
        }
      }

      // Draw zombies
      for (const z of gs.zombies) {
        ctx.fillStyle = '#84cc16';
        ctx.beginPath();
        ctx.arc(z.x, z.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🧟', z.x, z.y + 4);
      }

      // Draw player hero
      const pSize = 48;
      drawCardSprite(ctx, effectiveCardId, gs.px - pSize / 2, gs.py - pSize / 2, pSize, pSize, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#fbbf24',
        shadowBlur: 10,
        shadowColor: '#fbbf24'
      });

      animId = requestAnimationFrame(loop);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const gs = gameStateRef.current;
      const step = 30;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') gs.px = Math.max(30, gs.px - step);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') gs.px = Math.min(canvas.width - 30, gs.px + step);
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') gs.py = Math.max(80, gs.py - step);
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') gs.py = Math.min(canvas.height - 80, gs.py + step);
      if (e.key === ' ' || e.key === 'Spacebar') {
        handlePointerDown(gs.px, gs.py);
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
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono cursor-pointer"
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (t) handlePointerDown(t.clientX, t.clientY);
      }}
      onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <MinimalistMissionHUD
        title={isKo ? '벡타리아 io' : 'Vectaria.io'}
        score={score}
        targetScore={600}
        stageInfo={`WOOD: ${wood}/12 | STONE: ${stone}/8`}
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

export default PokiVectariaGame;
