import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBulletBrosGameProps {
  onBack: () => void;
}

interface Enemy {
  x: number;
  y: number;
  alive: boolean;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounces: number;
}

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

const STAGES: Array<{
  enemies: Enemy[];
  obstacles: Obstacle[];
}> = [
  // Stage 1
  {
    enemies: [
      { x: 320, y: 220, alive: true },
      { x: 320, y: 380, alive: true },
    ],
    obstacles: [
      { x: 220, y: 150, w: 20, h: 120 },
      { x: 220, y: 320, w: 20, h: 120 },
    ],
  },
  // Stage 2
  {
    enemies: [
      { x: 200, y: 150, alive: true },
      { x: 330, y: 280, alive: true },
      { x: 120, y: 380, alive: true },
    ],
    obstacles: [
      { x: 160, y: 220, w: 140, h: 20 },
      { x: 240, y: 330, w: 120, h: 20 },
    ],
  },
  // Stage 3
  {
    enemies: [
      { x: 330, y: 140, alive: true },
      { x: 330, y: 440, alive: true },
      { x: 200, y: 280, alive: true },
    ],
    obstacles: [
      { x: 140, y: 180, w: 120, h: 20 },
      { x: 220, y: 360, w: 120, h: 20 },
      { x: 260, y: 220, w: 20, h: 80 },
    ],
  },
];

export const PokiBulletBrosGame: React.FC<PokiBulletBrosGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [bulletsLeft, setBulletsLeft] = useState(5);
  const [enemiesEliminated, setEnemiesEliminated] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    stageIdx: number;
    playerX: number;
    playerY: number;
    aimStart: { x: number; y: number } | null;
    aimCurrent: { x: number; y: number } | null;
    bullets: Bullet[];
    bulletsLeft: number;
    enemies: Enemy[];
    obstacles: Obstacle[];
    totalEliminated: number;
    gameWon: boolean;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    stageIdx: 0,
    playerX: 60,
    playerY: 280,
    aimStart: null,
    aimCurrent: null,
    bullets: [],
    bulletsLeft: 5,
    enemies: JSON.parse(JSON.stringify(STAGES[0].enemies)),
    obstacles: STAGES[0].obstacles,
    totalEliminated: 0,
    gameWon: false,
    particles: [],
  });

  const loadStage = (idx: number) => {
    const st = stateRef.current;
    if (idx >= STAGES.length) {
      if (!st.gameWon) {
        st.gameWon = true;
        setGameWon(true);
        const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        const receipt = calculateAndDepositMissionReward({
          gameId: 'bullet-bros',
          gameTitle: 'Bullet Bros',
          score: st.totalEliminated * 100,
          durationSeconds: duration,
        });
        setRewardReceipt(receipt);
      }
      return;
    }
    st.stageIdx = idx;
    setCurrentStageIdx(idx);
    st.bulletsLeft = 5;
    setBulletsLeft(5);
    st.bullets = [];
    st.enemies = JSON.parse(JSON.stringify(STAGES[idx].enemies));
    st.obstacles = STAGES[idx].obstacles;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const st = stateRef.current;

      // Dark Warehouse Background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, w, h);

      // Top Banner
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 98, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`BULLET BROS // 스테이지 ${st.stageIdx + 1}/3`, 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#f59e0b';
      const aliveCount = st.enemies.filter((e) => e.alive).length;
      ctx.fillText(`남은 총탄: ${st.bulletsLeft}발 | 생존 적: ${aliveCount}명`, 84, 56);

      // Draw Obstacles (Walls)
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      st.obstacles.forEach((obs) => {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      });

      // Draw Aim Trajectory
      if (st.aimStart && st.aimCurrent) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        const dx = st.aimCurrent.x - st.aimStart.x;
        const dy = st.aimCurrent.y - st.aimStart.y;
        ctx.beginPath();
        ctx.moveTo(st.playerX, st.playerY);
        ctx.lineTo(st.playerX + dx * 2, st.playerY + dy * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Player Bro
      ctx.save();
      ctx.translate(st.playerX, st.playerY);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(-12, -18, 24, 36);
      ctx.fillStyle = '#fde047'; // Bandana
      ctx.fillRect(-12, -18, 24, 8);
      // Gun
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(10, -4, 14, 6);
      ctx.restore();

      // Draw Enemies
      st.enemies.forEach((enemy) => {
        if (enemy.alive) {
          ctx.save();
          ctx.translate(enemy.x, enemy.y);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-12, -18, 24, 36);
          ctx.fillStyle = '#1e293b'; // Sunglasses
          ctx.fillRect(-10, -12, 10, 5);
          ctx.fillRect(2, -12, 10, 5);
          ctx.restore();
        }
      });

      // Update & Draw Bullets
      for (let i = st.bullets.length - 1; i >= 0; i--) {
        const b = st.bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        // Bounce on Screen boundaries
        if (b.x < 15 || b.x > w - 15) {
          b.vx *= -1;
          b.bounces += 1;
        }
        if (b.y < 90 || b.y > h - 40) {
          b.vy *= -1;
          b.bounces += 1;
        }

        // Bounce on Obstacles
        st.obstacles.forEach((obs) => {
          if (b.x >= obs.x && b.x <= obs.x + obs.w && b.y >= obs.y && b.y <= obs.y + obs.h) {
            b.vx *= -1;
            b.vy *= -1;
            b.bounces += 1;
          }
        });

        // Hit Enemies
        st.enemies.forEach((enemy) => {
          if (enemy.alive) {
            if (Math.abs(b.x - enemy.x) < 18 && Math.abs(b.y - enemy.y) < 22) {
              enemy.alive = false;
              st.totalEliminated += 1;
              setEnemiesEliminated(st.totalEliminated);

              // Elimination blood/spark particles
              for (let p = 0; p < 18; p++) {
                st.particles.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  color: '#ef4444',
                  life: 1.0,
                });
              }
            }
          }
        });

        // Bullet expiry after 5 bounces
        if (b.bounces >= 5) {
          st.bullets.splice(i, 1);
          continue;
        }

        // Draw Bullet (Glowing yellow spark)
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fde047';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.stroke();
      }

      // Check Stage Completion
      const allDead = st.enemies.every((e) => !e.alive);
      if (allDead && st.bullets.length === 0) {
        loadStage(st.stageIdx + 1);
      } else if (st.bulletsLeft <= 0 && st.bullets.length === 0 && !allDead) {
        // Reset stage if ran out of bullets
        loadStage(st.stageIdx);
      }

      // Draw Particles
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const p = st.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) {
          st.particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1.0;
      }

      // Bottom Instructions
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ 화면을 드래그하여 조준선을 맞추고 손을 떼어 발사하세요 ]', w / 2, h - 15);
      ctx.textAlign = 'left';

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    stateRef.current.aimStart = { x, y };
    stateRef.current.aimCurrent = { x, y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.aimStart) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    stateRef.current.aimCurrent = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerUp = () => {
    const st = stateRef.current;
    if (st.aimStart && st.aimCurrent && st.bulletsLeft > 0) {
      const dx = st.aimCurrent.x - st.aimStart.x;
      const dy = st.aimCurrent.y - st.aimStart.y;
      const angle = Math.atan2(dy, dx);
      const speed = 8.5;

      st.bullets.push({
        x: st.playerX + 15,
        y: st.playerY - 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        bounces: 0,
      });

      st.bulletsLeft -= 1;
      setBulletsLeft(st.bulletsLeft);
    }
    st.aimStart = null;
    st.aimCurrent = null;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Bullet Bros"
        score={enemiesEliminated}
        targetScore={7}
        onBack={onBack}
      />

      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="max-w-full max-h-full border border-black/10 bg-[#fdfcfc] touch-none shadow-sm cursor-crosshair"
        />
      </div>

      {rewardReceipt && (
        <VictoryRewardModal
          isOpen={gameWon}
          receipt={rewardReceipt}
          onConfirm={onBack}
        />
      )}
    </div>
  );
};

export default PokiBulletBrosGame;

