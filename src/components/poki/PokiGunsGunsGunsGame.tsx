import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiGunsGunsGunsGameProps {
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

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface ZombieEnemy {
  x: number;
  y: number;
  hp: number;
  speed: number;
}

export const PokiGunsGunsGunsGame: React.FC<PokiGunsGunsGunsGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 23;

  const [kills, setKills] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 200,
    py: 400,
    targetX: 200,
    targetY: 400,
    bullets: [] as Bullet[],
    enemies: [] as ZombieEnemy[],
    totalKills: 0,
    shootCooldown: 0,
    spawnTimer: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokigunsgunsguns',
      gameTitle: isKo ? 'Guns Guns Guns (건즈 건즈)' : 'Guns Guns Guns',
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
        // Move player
        const dx = s.targetX - s.px;
        const dy = s.targetY - s.py;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          s.px += (dx / dist) * 180 * dt;
          s.py += (dy / dist) * 180 * dt;
        }

        // Auto Shoot nearest enemy
        s.shootCooldown -= dt;
        if (s.shootCooldown <= 0 && s.enemies.length > 0) {
          s.shootCooldown = 0.16;
          // Find nearest
          let nearest = s.enemies[0];
          let minDist = 9999;
          for (const e of s.enemies) {
            const d = Math.hypot(e.x - s.px, e.y - s.py);
            if (d < minDist) {
              minDist = d;
              nearest = e;
            }
          }

          const angle = Math.atan2(nearest.y - s.py, nearest.x - s.px);
          s.bullets.push({
            x: s.px,
            y: s.py,
            vx: Math.cos(angle) * 500,
            vy: Math.sin(angle) * 500
          });
          if (playSfx) playSfx('/sfx/shoot.mp3');
        }

        // Spawn enemies
        s.spawnTimer += dt;
        if (s.spawnTimer > 0.6) {
          s.spawnTimer = 0;
          const side = Math.floor(Math.random() * 4);
          let ex = 0, ey = 0;
          if (side === 0) { ex = Math.random() * canvas.width; ey = -20; }
          else if (side === 1) { ex = canvas.width + 20; ey = Math.random() * canvas.height; }
          else if (side === 2) { ex = Math.random() * canvas.width; ey = canvas.height + 20; }
          else { ex = -20; ey = Math.random() * canvas.height; }

          s.enemies.push({ x: ex, y: ey, hp: 2, speed: 70 + Math.random() * 40 });
        }

        // Update Bullets
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;

          // Bullet vs Enemy
          for (let j = s.enemies.length - 1; j >= 0; j--) {
            const e = s.enemies[j];
            if (Math.hypot(b.x - e.x, b.y - e.y) < 20) {
              e.hp--;
              s.bullets.splice(i, 1);
              if (e.hp <= 0) {
                s.enemies.splice(j, 1);
                s.totalKills++;
                setKills(s.totalKills);
                if (navigator.vibrate) navigator.vibrate(15);
                if (s.totalKills >= 25) {
                  handleVictory();
                }
              }
              break;
            }
          }

          if (b.x < -50 || b.x > canvas.width + 50 || b.y < -50 || b.y > canvas.height + 50) {
            s.bullets.splice(i, 1);
          }
        }

        // Update Enemies
        for (const e of s.enemies) {
          const edx = s.px - e.x;
          const edy = s.py - e.y;
          const edist = Math.hypot(edx, edy);
          if (edist > 4) {
            e.x += (edx / edist) * e.speed * dt;
            e.y += (edy / edist) * e.speed * dt;
          }
        }
      }

      // Render
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bullets
      ctx.fillStyle = '#facc15';
      for (const b of s.bullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Enemies
      for (const e of s.enemies) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(e.x, e.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Player
      drawCardSprite(ctx, effectiveCardId, s.px - 22, s.py - 22, 44, 44);

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
  }, [effectiveCardId, gameWon, handleVictory, playSfx]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Guns Guns Guns (건즈 건즈)' : 'Guns Guns Guns'}
        currentScore={kills}
        targetScore={25}
        onBack={handleExit}
        stageInfo={`${isKo ? '처치' : 'Kills'}: ${kills}/25`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-slate-300 pointer-events-none">
        {isKo ? '화면을 터치하여 이동하세요. 총기는 자동으로 가장 가까운 적을 조준 사격합니다!' : 'Tap anywhere to move. Guns automatically target nearest foes!'}
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

export default PokiGunsGunsGunsGame;
