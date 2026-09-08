import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiRepulsGameProps {
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

interface RobotFoe {
  x: number;
  y: number;
  hp: number;
}

export const PokiRepulsGame: React.FC<PokiRepulsGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 48;

  const [kills, setKills] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 200,
    py: 450,
    targetX: 200,
    targetY: 450,
    robots: [] as RobotFoe[],
    totalKills: 0,
    shootTimer: 0,
    laserBeam: null as { x1: number; y1: number; x2: number; y2: number; alpha: number } | null
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokirepuls',
      gameTitle: isKo ? '리펄스 SF 슈팅' : 'Repuls.io',
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
        // Move to touch
        const dx = s.targetX - s.px;
        const dy = s.targetY - s.py;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          s.px += (dx / dist) * 200 * dt;
          s.py += (dy / dist) * 200 * dt;
        }

        // Spawn robots
        if (s.robots.length < 5 && Math.random() < 0.04) {
          s.robots.push({
            x: 30 + Math.random() * (canvas.width - 60),
            y: 80 + Math.random() * 200,
            hp: 2
          });
        }

        // Auto Laser Shoot nearest robot
        s.shootTimer += dt;
        if (s.shootTimer > 0.25 && s.robots.length > 0) {
          s.shootTimer = 0;
          const target = s.robots[0];
          target.hp--;
          s.laserBeam = { x1: s.px, y1: s.py, x2: target.x, y2: target.y, alpha: 1.0 };

          if (target.hp <= 0) {
            s.robots.shift();
            s.totalKills++;
            setKills(s.totalKills);
            if (navigator.vibrate) navigator.vibrate(20);
            if (s.totalKills >= 15) {
              handleVictory();
            }
          }
        }

        if (s.laserBeam) {
          s.laserBeam.alpha -= dt * 5;
          if (s.laserBeam.alpha <= 0) s.laserBeam = null;
        }
      }

      // Render Cyber Arena
      ctx.fillStyle = '#050b14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Laser Beam
      if (s.laserBeam) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, s.laserBeam.alpha);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(s.laserBeam.x1, s.laserBeam.y1);
        ctx.lineTo(s.laserBeam.x2, s.laserBeam.y2);
        ctx.stroke();
        ctx.restore();
      }

      // Robots
      for (const r of s.robots) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(r.x - 16, r.y - 16, 32, 32, 6);
        ctx.fill();
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(r.x, r.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player SF Soldier
      drawCardSprite(ctx, effectiveCardId, s.px - 24, s.py - 24, 48, 48);

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
  }, [effectiveCardId, gameWon, handleVictory]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '리펄스 SF 슈팅' : 'Repuls.io'}
        currentScore={kills}
        targetScore={15}
        onBack={handleExit}
        stageInfo={`🤖 Bots: ${kills}/15`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-cyan-200 pointer-events-none">
        {isKo ? '터치하여 이동하세요. 플라즈마 건이 자동으로 적 로봇을 조준 격파합니다!' : 'Tap anywhere to move. Plasma weapon auto-fires!'}
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

export default PokiRepulsGame;
