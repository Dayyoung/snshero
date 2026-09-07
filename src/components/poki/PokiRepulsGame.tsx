import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiRepulsGameProps {
  onBack: () => void;
  cardId?: number;
}

interface EnemyBot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  shootTimer: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPlayer: boolean;
}

export const PokiRepulsGame: React.FC<PokiRepulsGameProps> = ({ onBack, cardId = 48 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frags, setFrags] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    player: {
      x: 200,
      y: 350,
      hp: 100,
      shield: 50,
      angle: 0,
    },
    moveTarget: { x: 200, y: 350 },
    enemies: [] as EnemyBot[],
    bullets: [] as Bullet[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
    frags: 0,
    startTime: Date.now(),
    lastShootTime: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gameStateRef.current.player.x = canvas.width / 2;
      gameStateRef.current.player.y = canvas.height * 0.65;
      gameStateRef.current.moveTarget.x = gameStateRef.current.player.x;
      gameStateRef.current.moveTarget.y = gameStateRef.current.player.y;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Initial enemies
    for (let i = 0; i < 4; i++) {
      gameStateRef.current.enemies.push({
        x: Math.random() * (canvas.width - 80) + 40,
        y: 120 + Math.random() * 160,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 1.5,
        hp: 40,
        maxHp: 40,
        shootTimer: 60 + Math.floor(Math.random() * 60),
      });
    }

    const render = () => {
      const state = gameStateRef.current;
      const p = state.player;

      // Update player movement towards target
      p.x += (state.moveTarget.x - p.x) * 0.12;
      p.y += (state.moveTarget.y - p.y) * 0.12;
      p.x = Math.max(30, Math.min(canvas.width - 30, p.x));
      p.y = Math.max(120, Math.min(canvas.height - 120, p.y));

      // Update enemies
      for (let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i];
        e.x += e.vx;
        e.y += e.vy;
        if (e.x < 40 || e.x > canvas.width - 40) e.vx *= -1;
        if (e.y < 100 || e.y > canvas.height * 0.5) e.vy *= -1;

        // Enemy shooting
        e.shootTimer--;
        if (e.shootTimer <= 0) {
          e.shootTimer = 75 + Math.floor(Math.random() * 40);
          const angle = Math.atan2(p.y - e.y, p.x - e.x);
          state.bullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(angle) * 5,
            vy: Math.sin(angle) * 5,
            isPlayer: false,
          });
        }
      }

      // Update bullets
      for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        if (b.isPlayer) {
          // Check collision with enemies
          for (let j = state.enemies.length - 1; j >= 0; j--) {
            const enemy = state.enemies[j];
            const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
            if (dist < 26) {
              enemy.hp -= 20;
              state.bullets.splice(i, 1);

              // Sparks
              for (let k = 0; k < 6; k++) {
                state.particles.push({
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  color: '#38bdf8',
                  life: 15,
                });
              }

              if (enemy.hp <= 0) {
                state.enemies.splice(j, 1);
                state.frags++;
                setFrags(state.frags);

                // Respawn new enemy
                state.enemies.push({
                  x: Math.random() * (canvas.width - 80) + 40,
                  y: 120 + Math.random() * 160,
                  vx: (Math.random() - 0.5) * 2.5,
                  vy: (Math.random() - 0.5) * 1.5,
                  hp: 40,
                  maxHp: 40,
                  shootTimer: 60,
                });

                // Win check
                if (state.frags >= 10 && !gameWon) {
                  setGameWon(true);
                  setGameOver(true);
                  const reward = calculateAndDepositMissionReward({
                    gameId: 'pokirepuls',
                    gameTitle: 'Repuls.io',
                    isVictory: true,
                    score: 1000,
                    maxTargetScore: 1000,
                    durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
                  });
                  setRewardResult(reward);
                  return;
                }
              }
              break;
            }
          }
        } else {
          // Check collision with player
          const dist = Math.hypot(b.x - p.x, b.y - p.y);
          if (dist < 26) {
            state.bullets.splice(i, 1);
            p.hp -= 15;
            setPlayerHp(Math.max(0, p.hp));

            for (let k = 0; k < 6; k++) {
              state.particles.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: '#ef4444',
                life: 15,
              });
            }

            if (p.hp <= 0 && !gameOver) {
              setGameOver(true);
              const reward = calculateAndDepositMissionReward({
                gameId: 'pokirepuls',
                gameTitle: 'Repuls.io',
                isVictory: false,
                score: state.frags * 100,
                maxTargetScore: 1000,
                durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
              });
              setRewardResult(reward);
              return;
            }
          }
        }

        // Out of bounds
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
          state.bullets.splice(i, 1);
        }
      }

      // Render
      ctx.fillStyle = '#090d16'; // Deep sci-fi dark blue
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sci-fi grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Enemies
      for (const e of state.enemies) {
        ctx.save();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(e.x, e.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.stroke();

        // HP bar
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(e.x - 16, e.y - 28, 32, 5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(e.x - 16, e.y - 28, (e.hp / e.maxHp) * 32, 5);
        ctx.restore();
      }

      // Draw Bullets
      for (const b of state.bullets) {
        ctx.save();
        ctx.fillStyle = b.isPlayer ? '#38bdf8' : '#f87171';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.isPlayer ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Player Hero Sprite
      drawCardSprite(ctx, cardId, p.x - 20, p.y - 25, 40, 50);

      // Player Aim Reticle towards closest enemy
      if (state.enemies.length > 0) {
        const closest = state.enemies.reduce((prev, curr) =>
          Math.hypot(curr.x - p.x, curr.y - p.y) < Math.hypot(prev.x - p.x, prev.y - p.y) ? curr : prev
        );
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(closest.x, closest.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(1, pt.life * 0.2), 0, Math.PI * 2);
        ctx.fill();
        if (pt.life <= 0) state.particles.splice(i, 1);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [cardId, gameOver, gameWon]);

  const handlePointer = (clientX: number, clientY: number) => {
    if (gameOver) return;
    const s = gameStateRef.current;
    s.moveTarget.x = clientX;
    s.moveTarget.y = clientY;

    // Auto-fire towards closest enemy on tap/drag
    const now = Date.now();
    if (now - s.lastShootTime > 220) {
      s.lastShootTime = now;
      if (s.enemies.length > 0) {
        const p = s.player;
        const closest = s.enemies.reduce((prev, curr) =>
          Math.hypot(curr.x - p.x, curr.y - p.y) < Math.hypot(prev.x - p.x, prev.y - p.y) ? curr : prev
        );
        const angle = Math.atan2(closest.y - p.y, closest.x - p.x);
        s.bullets.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(angle) * 11,
          vy: Math.sin(angle) * 11,
          isPlayer: true,
        });
      }
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#090d16] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Repuls.io"
        score={frags}
        targetScore={10}
        lives={Math.ceil(playerHp / 25)}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        onMouseMove={(e) => handlePointer(e.clientX, e.clientY)}
        onMouseDown={(e) => handlePointer(e.clientX, e.clientY)}
        onTouchMove={(e) => {
          const t = e.touches[0];
          handlePointer(t.clientX, t.clientY);
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          handlePointer(t.clientX, t.clientY);
        }}
      />

      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none text-xs text-sky-400">
        터치/드래그로 이동하며 적 사이버 드론을 10회 제압(FRAG)하세요!
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={frags * 100}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setFrags(0);
          setPlayerHp(100);
          const s = gameStateRef.current;
          s.frags = 0;
          s.player.hp = 100;
          s.startTime = Date.now();
        }}
      />
    </div>
  );
};
