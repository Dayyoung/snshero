import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSnakeVsWormsGameProps {
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

export const PokiSnakeVsWormsGame: React.FC<PokiSnakeVsWormsGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 6;

  const [score, setScore] = useState(0);
  const [snakeLength, setSnakeLength] = useState(15);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    headX: 300,
    headY: 400,
    angle: 0,
    speed: 3.5,
    isBoosting: false,
    body: [] as { x: number; y: number }[],
    length: 20,
    score: 0,
    won: false,
    startTime: Date.now(),
    pellets: [] as { x: number; y: number; color: string; radius: number }[],
    worms: [
      { x: 100, y: 150, angle: 0.5, body: [] as { x: number; y: number }[], color: '#ef4444', len: 18 },
      { x: 400, y: 250, angle: 2.1, body: [] as { x: number; y: number }[], color: '#eab308', len: 22 }
    ]
  });

  const triggerHaptic = (ms = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch {}
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const tx = clientX - rect.left;
    const ty = clientY - rect.top;
    const gs = gameStateRef.current;
    gs.angle = Math.atan2(ty - gs.headY, tx - gs.headX);
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
      if (gs.pellets.length === 0) {
        for (let i = 0; i < 40; i++) {
          gs.pellets.push({
            x: Math.random() * canvas.width,
            y: 80 + Math.random() * (canvas.height - 120),
            color: ['#38bdf8', '#4ade80', '#f472b6', '#facc15'][Math.floor(Math.random() * 4)],
            radius: 4 + Math.random() * 3
          });
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
        const curSpeed = gs.isBoosting ? gs.speed * 1.6 : gs.speed;
        gs.headX += Math.cos(gs.angle) * curSpeed;
        gs.headY += Math.sin(gs.angle) * curSpeed;
        if (gs.headX < 20) gs.headX = w - 20;
        if (gs.headX > w - 20) gs.headX = 20;
        if (gs.headY < 70) gs.headY = h - 30;
        if (gs.headY > h - 30) gs.headY = 70;

        gs.body.unshift({ x: gs.headX, y: gs.headY });
        if (gs.body.length > gs.length) gs.body.pop();

        // Eat pellets
        for (let i = gs.pellets.length - 1; i >= 0; i--) {
          const p = gs.pellets[i];
          if (Math.hypot(gs.headX - p.x, gs.headY - p.y) < p.radius + 14) {
            gs.pellets.splice(i, 1);
            gs.length += 2;
            gs.score += 25;
            setScore(gs.score);
            setSnakeLength(gs.length);
            triggerHaptic(10);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

            // Respawn pellet
            gs.pellets.push({
              x: Math.random() * w,
              y: 80 + Math.random() * (h - 120),
              color: ['#38bdf8', '#4ade80', '#f472b6', '#facc15'][Math.floor(Math.random() * 4)],
              radius: 4 + Math.random() * 3
            });
          }
        }

        // Move rival worms
        for (const worm of gs.worms) {
          worm.angle += (Math.random() - 0.5) * 0.2;
          worm.x += Math.cos(worm.angle) * 2.5;
          worm.y += Math.sin(worm.angle) * 2.5;
          if (worm.x < 20 || worm.x > w - 20) worm.angle = Math.PI - worm.angle;
          if (worm.y < 80 || worm.y > h - 40) worm.angle = -worm.angle;
          worm.body.unshift({ x: worm.x, y: worm.y });
          if (worm.body.length > worm.len) worm.body.pop();
        }

        // Victory condition: score 600 or length 60
        if (gs.score >= 600 && !gs.won) {
          gs.won = true;
          triggerHaptic(60);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          const elapsedSec = Math.max(5, Math.floor((Date.now() - gs.startTime) / 1000));
          const receipt = calculateAndDepositMissionReward({
            gameId: 'poki_snakevsworms',
            gameTitle: isKo ? '스네이크 vs 웜스' : 'Snake vs Worms',
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

      // Drawing
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#060d17';
      ctx.fillRect(0, 0, w, h);

      // Pellets
      for (const p of gs.pellets) {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Worms
      for (const worm of gs.worms) {
        ctx.fillStyle = worm.color;
        for (const seg of worm.body) {
          ctx.beginPath();
          ctx.arc(seg.x, seg.y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Player Snake Body
      for (let i = gs.body.length - 1; i >= 0; i--) {
        const seg = gs.body[i];
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player Snake Head Sprite
      const pSize = 40;
      drawCardSprite(ctx, effectiveCardId, gs.headX - pSize / 2, gs.headY - pSize / 2, pSize, pSize, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#38bdf8',
        shadowBlur: 8,
        shadowColor: '#38bdf8'
      });

      animId = requestAnimationFrame(loop);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const gs = gameStateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') gs.angle = Math.PI;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') gs.angle = 0;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') gs.angle = -Math.PI / 2;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') gs.angle = Math.PI / 2;
      if (e.key === ' ' || e.key === 'Spacebar') {
        gs.isBoosting = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        gameStateRef.current.isBoosting = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [effectiveCardId, isKo, onReward, playSfx]);

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={() => { gameStateRef.current.isBoosting = true; }}
      onTouchEnd={() => { gameStateRef.current.isBoosting = false; }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        if (t) handlePointerMove(t.clientX, t.clientY);
      }}
      onMouseDown={() => { gameStateRef.current.isBoosting = true; }}
      onMouseUp={() => { gameStateRef.current.isBoosting = false; }}
      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block cursor-crosshair" />

      <MinimalistMissionHUD
        title={isKo ? '스네이크 vs 웜스' : 'Snake vs Worms'}
        score={score}
        targetScore={600}
        stageInfo={`LEN: ${snakeLength} / 60`}
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

export default PokiSnakeVsWormsGame;
