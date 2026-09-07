import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiGoingUpRooftopGameProps {
  onBack: () => void;
}

interface Platform {
  x: number;
  y: number; // world Y (0 is bottom ground, positive goes up)
  w: number;
  h: number;
  type: 'ground' | 'beam' | 'ac' | 'ladder' | 'helipad';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export const PokiGoingUpRooftopGame: React.FC<PokiGoingUpRooftopGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover' | 'victory'>('ready');
  const [altitude, setAltitude] = useState(0); // in meters, 0 to 50
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // Game physics state
  const stateRef = useRef({
    hero: {
      x: 180,
      y: 40, // relative to bottom
      vx: 0,
      vy: 0,
      w: 32,
      h: 46,
      facing: 1 as 1 | -1,
      isGrounded: true,
      canWallJump: false,
      wallSide: 0 as -1 | 0 | 1, // -1 left wall, 1 right wall
    },
    cameraY: 0,
    platforms: [] as Platform[],
    particles: [] as Particle[],
    targetAltitude: 50, // 50m roof helipad
    touchX: null as number | null,
    isHoldingJump: false,
    combo: 0,
  });

  const initWorld = useCallback(() => {
    const plats: Platform[] = [
      // Ground
      { x: 0, y: 0, w: 400, h: 30, type: 'ground' },
      // Left/Right building outer bounds
      { x: 0, y: 30, w: 24, h: 2500, type: 'beam' },
      { x: 376, y: 30, w: 24, h: 2500, type: 'beam' },
    ];

    // Procedural platforms leading up to 2200px (~50m)
    let curY = 80;
    const types: ('beam' | 'ac' | 'ladder')[] = ['beam', 'ac', 'ladder'];
    while (curY < 2000) {
      const w = Math.floor(60 + Math.random() * 50);
      const x = Math.floor(35 + Math.random() * (350 - w - 35));
      const t = types[Math.floor(Math.random() * types.length)];
      plats.push({ x, y: curY, w, h: 14, type: t });
      curY += Math.floor(70 + Math.random() * 50);
    }

    // Top Helipad at 2050
    plats.push({ x: 80, y: 2050, w: 240, h: 24, type: 'helipad' });

    stateRef.current.platforms = plats;
    stateRef.current.hero = {
      x: 180,
      y: 40,
      vx: 0,
      vy: 0,
      w: 32,
      h: 46,
      facing: 1,
      isGrounded: true,
      canWallJump: false,
      wallSide: 0,
    };
    stateRef.current.cameraY = 0;
    stateRef.current.particles = [];
    stateRef.current.combo = 0;
  }, []);

  const handleStart = () => {
    initWorld();
    setGameState('playing');
    setRewardReceipt(null);
  };

  const handleVictory = useCallback(() => {
    setGameState('victory');
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokigoinguprooftop',
      gameTitle: 'Going Up! Rooftop Parkour',
      isVictory: true,
      score: 50,
      maxTargetScore: 50,
      durationSeconds: 30,
    });
    setRewardReceipt(receipt);
  }, []);

  // Jump logic
  const triggerJump = useCallback(() => {
    const { hero, particles } = stateRef.current;
    if (hero.isGrounded) {
      hero.vy = 14;
      hero.isGrounded = false;
      // jump puff
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: hero.x + hero.w / 2,
          y: hero.y,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 2,
          life: 18,
          color: '#f59e0b',
        });
      }
    } else if (hero.canWallJump) {
      // Wall jump bounces away from the wall
      hero.vy = 15;
      hero.vx = -hero.wallSide * 9;
      hero.facing = hero.wallSide === 1 ? -1 : 1;
      hero.canWallJump = false;
      hero.wallSide = 0;
      stateRef.current.combo++;

      for (let i = 0; i < 8; i++) {
        particles.push({
          x: hero.x + (hero.facing === 1 ? 0 : hero.w),
          y: hero.y + hero.h / 2,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 20,
          color: '#38bdf8',
        });
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const { hero, platforms, particles } = stateRef.current;

      ctx.clearRect(0, 0, width, height);

      // Sky gradient (dusk city skyline)
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.6, '#1e293b');
      grad.addColorStop(1, '#334155');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Background buildings (parallax)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      const cam = stateRef.current.cameraY;
      for (let i = 0; i < 6; i++) {
        const bx = i * 75 - (cam * 0.1) % 40;
        const bw = 50;
        const bh = 300 + (i % 3) * 60;
        ctx.fillRect(bx, height - bh + (cam * 0.15) % 150, bw, bh);
      }

      if (gameState === 'playing') {
        // Physics
        // Gravity
        hero.vy -= 0.65;
        if (hero.vy < -16) hero.vy = -16;

        // Horizontal damping
        hero.vx *= 0.88;

        // Touch steer
        if (stateRef.current.touchX !== null) {
          const center = width / 2;
          const delta = stateRef.current.touchX - center;
          if (Math.abs(delta) > 20) {
            const dir = Math.sign(delta);
            hero.vx += dir * 0.9;
            hero.facing = dir as 1 | -1;
          }
        }

        hero.x += hero.vx;
        hero.y += hero.vy;

        // Wall collisions (left/right bounds)
        hero.canWallJump = false;
        hero.wallSide = 0;

        if (hero.x <= 24) {
          hero.x = 24;
          hero.vx = 0;
          if (!hero.isGrounded && hero.vy < 0) {
            hero.canWallJump = true;
            hero.wallSide = -1;
            hero.vy *= 0.7; // Wall slide friction
          }
        } else if (hero.x + hero.w >= 376) {
          hero.x = 376 - hero.w;
          hero.vx = 0;
          if (!hero.isGrounded && hero.vy < 0) {
            hero.canWallJump = true;
            hero.wallSide = 1;
            hero.vy *= 0.7; // Wall slide friction
          }
        }

        // Platform collisions
        hero.isGrounded = false;
        for (const p of platforms) {
          if (p.type === 'beam' && p.h > 100) continue; // skip side walls here
          if (
            hero.x + hero.w > p.x &&
            hero.x < p.x + p.w &&
            hero.y <= p.y + p.h &&
            hero.y >= p.y + p.h - 14 &&
            hero.vy <= 0
          ) {
            hero.y = p.y + p.h;
            hero.vy = 0;
            hero.isGrounded = true;

            if (p.type === 'helipad') {
              handleVictory();
              return;
            }
          }
        }

        // Camera follow
        const targetCam = Math.max(0, hero.y - 180);
        stateRef.current.cameraY += (targetCam - stateRef.current.cameraY) * 0.1;

        // Current Altitude in meters (0m to 50m)
        const currentM = Math.min(50, Math.floor(hero.y / 41));
        setAltitude(Math.max(0, currentM));

        // Fell off screen below
        if (hero.y < stateRef.current.cameraY - 60) {
          setGameState('gameover');
        }
      }

      // Convert world coordinate Y to canvas Y: cy = height - (wy - cameraY)
      const toScreenY = (wy: number) => height - (wy - stateRef.current.cameraY);

      // Render Platforms
      for (const p of platforms) {
        const sy = toScreenY(p.y + p.h);
        if (sy > height + 50 || sy + p.h < -50) continue;

        if (p.type === 'ground') {
          ctx.fillStyle = '#475569';
          ctx.fillRect(p.x, sy, p.w, p.h);
        } else if (p.type === 'beam') {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(p.x, sy, p.w, p.h);
          ctx.strokeStyle = '#94a3b8';
          ctx.strokeRect(p.x, sy, p.w, p.h);
        } else if (p.type === 'ac') {
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(p.x, sy, p.w, p.h);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(p.x + 4, sy + 3, p.w - 8, p.h - 6);
        } else if (p.type === 'ladder') {
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(p.x, sy, p.w, p.h);
        } else if (p.type === 'helipad') {
          // Helipad
          ctx.fillStyle = '#eab308';
          ctx.fillRect(p.x, sy, p.w, p.h);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('[ H - 50M ROOFTOP ]', p.x + p.w / 2, sy + 17);
        }
      }

      // Render Hero (Card #76)
      const heroSY = toScreenY(hero.y + hero.h);
      ctx.save();
      if (hero.facing === -1) {
        ctx.translate(hero.x + hero.w, heroSY);
        ctx.scale(-1, 1);
        drawCardSprite(ctx, 76, 0, 0, hero.w, hero.h);
      } else {
        drawCardSprite(ctx, 76, hero.x, heroSY, hero.w, hero.h);
      }
      ctx.restore();

      // Wall jump indicator
      if (hero.canWallJump) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡WALL JUMP!', hero.x + hero.w / 2, heroSY - 10);
      }

      // Render Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        if (pt.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        const psy = toScreenY(pt.y);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, psy, 3, 3);
      }

      // Height Gauge Bar (Right side)
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(width - 18, 50, 10, height - 100);
      const progress = Math.min(1, altitude / 50);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(width - 18, 50 + (height - 100) * (1 - progress), 10, (height - 100) * progress);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, altitude, handleVictory]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const tx = ((touch.clientX - rect.left) / rect.width) * 400;
    stateRef.current.touchX = tx;
    stateRef.current.isHoldingJump = true;
    triggerJump();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const tx = ((touch.clientX - rect.left) / rect.width) * 400;
    stateRef.current.touchX = tx;
  };

  const handleTouchEnd = () => {
    stateRef.current.touchX = null;
    stateRef.current.isHoldingJump = false;
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] bg-[#0f172a] text-[#fdfcfc] select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Going Up! Rooftop Parkour"
        missionTarget="50m 헬리패드 등반"
        currentScore={altitude}
        maxScore={50}
        scoreUnit="m"
        onBack={onBack}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="w-full h-full object-contain rounded border border-white/20 bg-slate-900 touch-none shadow-2xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            const mx = ((e.clientX - rect.left) / rect.width) * 400;
            stateRef.current.touchX = mx;
            triggerJump();
          }}
          onMouseMove={(e) => {
            if (stateRef.current.touchX !== null) {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;
              stateRef.current.touchX = ((e.clientX - rect.left) / rect.width) * 400;
            }
          }}
          onMouseUp={() => {
            stateRef.current.touchX = null;
          }}
        />

        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-amber-400 mb-2">[ Going Up! Rooftop ]</h2>
            <p className="text-sm text-slate-300 mb-6">
              도시 빌딩을 박차고 50m 정상 헬리패드까지 등반하세요!<br />
              화면 터치로 점프하고, 벽면에 닿았을 때 탭하면 <b>벽점프(Wall Jump)</b>로 더 높이 솟구칩니다!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-lg rounded-sm active:scale-95 transition-all shadow-lg"
            >
              등반 시작 [TAP]
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-rose-500 mb-2">[ 등반 실패 - 낙하 ]</h2>
            <p className="text-sm text-slate-300 mb-4">도달 고도: {altitude}m / 50m</p>
            <button
              onClick={handleStart}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-sm active:scale-95 transition-all"
            >
              다시 도전
            </button>
          </div>
        )}

        {gameState === 'victory' && rewardReceipt && (
          <VictoryRewardModal
            receipt={rewardReceipt}
            language="ko"
            onPlayAgain={handleStart}
            onExit={onBack}
          />
        )}
      </div>

      {/* Guide Footer */}
      <div className="w-full max-w-md p-2 bg-slate-900/90 border-t border-white/10 text-center text-xs text-slate-400">
        좌우 드래그: 이동 | 탭: 점프 & 벽점프(Wall Jump) | 50m 헬리패드 착봉 시 미션 클리어!
      </div>
    </div>
  );
};
export default PokiGoingUpRooftopGame;
