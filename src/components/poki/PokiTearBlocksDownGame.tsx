import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiTearBlocksDownGameProps {
  onBack: () => void;
  cardId?: number;
}

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  broken: boolean;
}

interface TargetZombie {
  x: number;
  y: number;
  hp: number;
  knockedDown: boolean;
}

export const PokiTearBlocksDownGame: React.FC<PokiTearBlocksDownGameProps> = ({ onBack, cardId = 58 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stage, setStage] = useState(1);
  const [cannonballsLeft, setCannonballsLeft] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    stage: 1,
    ballsLeft: 5,
    cannon: { x: 70, y: 0, angle: -Math.PI / 6 },
    cannonball: null as { x: number; y: number; vx: number; vy: number } | null,
    blocks: [] as Block[],
    zombies: [] as TargetZombie[],
    isAiming: false,
    dragStart: { x: 0, y: 0 },
    dragCurrent: { x: 0, y: 0 },
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
    startTime: Date.now(),
  });

  const loadStage = (stg: number) => {
    const s = gameStateRef.current;
    s.stage = stg;
    setStage(stg);
    s.ballsLeft = 5;
    setCannonballsLeft(5);
    s.cannonball = null;

    const baseY = window.innerHeight * 0.7;
    const towerX = window.innerWidth * 0.65;

    s.blocks = [];
    s.zombies = [];

    // Build block tower
    const rows = 3 + stg;
    const cols = 2 + (stg > 1 ? 1 : 0);
    const bW = 36;
    const bH = 26;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        s.blocks.push({
          x: towerX + c * (bW + 4) - (cols * bW) / 2,
          y: baseY - (r + 1) * (bH + 4),
          w: bW,
          h: bH,
          hp: 30,
          broken: false,
        });
      }
    }

    // Place zombies on top
    s.zombies.push({
      x: towerX,
      y: baseY - (rows + 1) * (bH + 4),
      hp: 30,
      knockedDown: false,
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gameStateRef.current.cannon.y = canvas.height * 0.68;
      loadStage(gameStateRef.current.stage);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const state = gameStateRef.current;
      const cb = state.cannonball;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Update cannonball
      if (cb) {
        cb.x += cb.vx;
        cb.y += cb.vy;
        cb.vy += 0.38; // gravity

        // Check block collision
        for (const b of state.blocks) {
          if (!b.broken) {
            if (cb.x > b.x && cb.x < b.x + b.w && cb.y > b.y && cb.y < b.y + b.h) {
              b.broken = true;
              cb.vx *= 0.6;
              cb.vy *= 0.6;

              // Debris sparks
              for (let k = 0; k < 8; k++) {
                state.particles.push({
                  x: b.x + b.w / 2,
                  y: b.y + b.h / 2,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  color: '#78716c',
                  life: 20,
                });
              }
            }
          }
        }

        // Check zombie hit
        for (const z of state.zombies) {
          if (!z.knockedDown) {
            if (Math.hypot(cb.x - z.x, cb.y - z.y) < 32) {
              z.knockedDown = true;
              for (let k = 0; k < 15; k++) {
                state.particles.push({
                  x: z.x,
                  y: z.y,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  color: '#ef4444',
                  life: 25,
                });
              }
            }
          }
        }

        // Out of bounds or hit ground
        if (cb.y > canvas.height * 0.72 || cb.x > canvas.width + 50) {
          state.cannonball = null;

          // Check if all zombies knocked down
          const allDown = state.zombies.every((z) => z.knockedDown);
          if (allDown) {
            if (state.stage >= 3) {
              // Complete!
              setGameWon(true);
              setGameOver(true);
              const reward = calculateAndDepositMissionReward({
                gameId: 'pokitearblocksdown',
                gameTitle: 'Tear Blocks Down',
                isVictory: true,
                score: 1000,
                maxTargetScore: 1000,
                durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
              });
              setRewardResult(reward);
              return;
            } else {
              loadStage(state.stage + 1);
            }
          } else if (state.ballsLeft <= 0 && !gameOver) {
            // Out of shots
            setGameOver(true);
            const reward = calculateAndDepositMissionReward({
              gameId: 'pokitearblocksdown',
              gameTitle: 'Tear Blocks Down',
              isVictory: false,
              score: (state.stage - 1) * 333,
              maxTargetScore: 1000,
              durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
            });
            setRewardResult(reward);
            return;
          }
        }
      }

      // Drawing
      // Sky & Ground
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const groundY = canvas.height * 0.7;
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Draw Blocks
      for (const b of state.blocks) {
        if (!b.broken) {
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(b.x, b.y, b.w, b.h);
        }
      }

      // Draw Zombies
      for (const z of state.zombies) {
        if (!z.knockedDown) {
          ctx.font = '28px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🧟', z.x, z.y);
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('TARGET', z.x, z.y - 20);
        }
      }

      // Draw Cannon Base & Hero Sprite
      const cn = state.cannon;
      drawCardSprite(ctx, cardId, cn.x - 40, cn.y - 45, 45, 55);

      ctx.save();
      ctx.translate(cn.x, cn.y);
      ctx.rotate(cn.angle);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, -10, 42, 20);
      ctx.restore();

      // Slingshot aim line
      if (state.isAiming) {
        const dx = state.dragStart.x - state.dragCurrent.x;
        const dy = state.dragStart.y - state.dragCurrent.y;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(cn.x, cn.y);
        ctx.lineTo(cn.x + dx * 1.5, cn.y + dy * 1.5);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Flying Cannonball
      if (cb) {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(cb.x, cb.y, 11, 0, Math.PI * 2);
        ctx.fill();
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

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (gameStateRef.current.cannonball || gameOver) return;
    gameStateRef.current.isAiming = true;
    gameStateRef.current.dragStart = { x: clientX, y: clientY };
    gameStateRef.current.dragCurrent = { x: clientX, y: clientY };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (gameStateRef.current.isAiming) {
      gameStateRef.current.dragCurrent = { x: clientX, y: clientY };
    }
  };

  const handlePointerUp = () => {
    const s = gameStateRef.current;
    if (s.isAiming && !s.cannonball && s.ballsLeft > 0) {
      s.isAiming = false;
      const dx = s.dragStart.x - s.dragCurrent.x;
      const dy = s.dragStart.y - s.dragCurrent.y;

      if (Math.hypot(dx, dy) > 20) {
        s.ballsLeft--;
        setCannonballsLeft(s.ballsLeft);
        s.cannonball = {
          x: s.cannon.x + 30,
          y: s.cannon.y - 5,
          vx: Math.max(5, (dx / 10) * 1.5),
          vy: Math.min(-3, (dy / 10) * 1.5),
        };
      }
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#f8fafc] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Tear Blocks Down"
        score={stage}
        targetScore={3}
        lives={cannonballsLeft}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onTouchStart={(e) => {
          const t = e.touches[0];
          handlePointerDown(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          handlePointerMove(t.clientX, t.clientY);
        }}
        onTouchEnd={handlePointerUp}
      />

      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none text-xs text-stone-700">
        대포를 뒤로 당겨 각도와 힘을 조절하고 발사하여 좀비 요새를 무너뜨리세요! (남은 포탄: {cannonballsLeft}발)
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={stage * 333}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          loadStage(1);
          gameStateRef.current.startTime = Date.now();
        }}
      />
    </div>
  );
};
