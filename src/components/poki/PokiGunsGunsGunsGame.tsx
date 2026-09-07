import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiGunsGunsGunsGameProps {
  onBack: () => void;
  cardId?: number;
}

interface Soldier {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  team: 'player' | 'enemy';
  shootCooldown: number;
  isDead: boolean;
  targetX: number;
  targetY: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  team: 'player' | 'enemy';
}

interface Cover {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PokiGunsGunsGunsGame: React.FC<PokiGunsGunsGunsGameProps> = ({ onBack, cardId = 23 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [kills, setKills] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [ammo, setAmmo] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    player: {
      x: 150,
      y: 350,
      targetX: 150,
      targetY: 350,
      hp: 100,
      maxHp: 100,
      ammo: 30,
      reloading: false,
    },
    enemies: [
      { id: 1, x: 650, y: 200, hp: 50, maxHp: 50, team: 'enemy' as const, shootCooldown: 60, isDead: false, targetX: 650, targetY: 200 },
      { id: 2, x: 700, y: 350, hp: 50, maxHp: 50, team: 'enemy' as const, shootCooldown: 90, isDead: false, targetX: 700, targetY: 350 },
      { id: 3, x: 650, y: 500, hp: 50, maxHp: 50, team: 'enemy' as const, shootCooldown: 120, isDead: false, targetX: 650, targetY: 500 },
    ] as Soldier[],
    covers: [
      { x: 300, y: 200, w: 40, h: 80 },
      { x: 300, y: 420, w: 40, h: 80 },
      { x: 500, y: 280, w: 40, h: 140 },
    ] as Cover[],
    bullets: [] as Bullet[],
    killCount: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;
      const p = state.player;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.min(cw / 840, ch / 680);
      const offsetX = (cw - 840 * scale) / 2;
      const offsetY = (ch - 680 * scale) / 2;

      if (!gameOver && !gameWon) {
        // Player move to target
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          p.x += (dx / dist) * Math.min(dist, 3.2);
          p.y += (dy / dist) * Math.min(dist, 3.2);
        }

        // Enemies AI: move occasionally and shoot at player
        state.enemies.forEach(e => {
          if (e.isDead) return;

          // Patrol move
          const edx = e.targetX - e.x;
          const edy = e.targetY - e.y;
          const edist = Math.hypot(edx, edy);
          if (edist > 4) {
            e.x += (edx / edist) * Math.min(edist, 1.8);
            e.y += (edy / edist) * Math.min(edist, 1.8);
          } else if (Math.random() < 0.02) {
            e.targetX = 600 + Math.random() * 140;
            e.targetY = 150 + Math.random() * 400;
          }

          // Shoot at player
          e.shootCooldown -= 1;
          if (e.shootCooldown <= 0) {
            e.shootCooldown = 75 + Math.floor(Math.random() * 45);
            const bulletAngle = Math.atan2(p.y - e.y, p.x - e.x) + (Math.random() - 0.5) * 0.2;
            state.bullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(bulletAngle) * 7.5,
              vy: Math.sin(bulletAngle) * 7.5,
              team: 'enemy',
            });
          }
        });

        // Update Bullets
        for (let i = state.bullets.length - 1; i >= 0; i--) {
          const b = state.bullets[i];
          b.x += b.vx;
          b.y += b.vy;

          // Check covers
          let hitCover = false;
          for (const c of state.covers) {
            if (b.x >= c.x && b.x <= c.x + c.w && b.y >= c.y && b.y <= c.y + c.h) {
              hitCover = true;
              break;
            }
          }
          if (hitCover || b.x < 40 || b.x > 800 || b.y < 80 || b.y > 620) {
            state.bullets.splice(i, 1);
            continue;
          }

          // Bullet hits player
          if (b.team === 'enemy') {
            const hitDist = Math.hypot(b.x - p.x, b.y - p.y);
            if (hitDist < 18) {
              state.bullets.splice(i, 1);
              p.hp = Math.max(0, p.hp - 12);
              setPlayerHp(p.hp);
              if (p.hp <= 0) {
                setGameOver(true);
              }
              continue;
            }
          }

          // Bullet hits enemies
          if (b.team === 'player') {
            let hitEnemy = false;
            for (const e of state.enemies) {
              if (e.isDead) continue;
              const hitDist = Math.hypot(b.x - e.x, b.y - e.y);
              if (hitDist < 18) {
                state.bullets.splice(i, 1);
                e.hp -= 25;
                if (e.hp <= 0) {
                  e.isDead = true;
                  state.killCount += 1;
                  setKills(state.killCount);

                  // Check win
                  if (state.killCount >= 5) {
                    setGameWon(true);
                    const deposit = calculateAndDepositMissionReward({
                      gameId: 'poki_guns_guns_guns',
                      gameTitle: 'Guns Guns Guns',
                      isVictory: true,
                      score: 100,
                      maxTargetScore: 100,
                      durationSeconds: 45,
                    });
                    setRewardResult(deposit);
                    return;
                  } else {
                    // Respawn enemy after 2 seconds
                    setTimeout(() => {
                      e.isDead = false;
                      e.hp = e.maxHp;
                      e.x = 720;
                      e.y = 150 + Math.random() * 400;
                    }, 2000);
                  }
                }
                hitEnemy = true;
                break;
              }
            }
            if (hitEnemy) continue;
          }
        }
      }

      // Render
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Arena Floor
      ctx.fillStyle = '#27272a';
      ctx.fillRect(40, 80, 760, 540);
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 80, 760, 540);

      // Concrete Covers
      state.covers.forEach(c => {
        ctx.fillStyle = '#52525b';
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 2;
        ctx.strokeRect(c.x, c.y, c.w, c.h);
      });

      // Bullets
      state.bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = b.team === 'player' ? '#38bdf8' : '#ef4444';
        ctx.fill();
      });

      // Enemies
      state.enemies.forEach(e => {
        if (e.isDead) return;
        drawCardSprite(ctx, 66, e.x - 16, e.y - 16, 32, 32);

        // HP bar
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(e.x - 16, e.y - 24, 32, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(e.x - 16, e.y - 24, (e.hp / e.maxHp) * 32, 4);
      });

      // Player
      drawCardSprite(ctx, cardId, p.x - 18, p.y - 18, 36, 36);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId]);

  // Pointer interaction
  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.min(cw / 840, ch / 680);
    const offsetX = (cw - 840 * scale) / 2;
    const offsetY = (ch - 680 * scale) / 2;

    const clickX = (e.clientX - rect.left - offsetX) / scale;
    const clickY = (e.clientY - rect.top - offsetY) / scale;

    const state = gameStateRef.current;
    const p = state.player;

    // Check if clicked an enemy to shoot
    let targetEnemy = false;
    for (const en of state.enemies) {
      if (!en.isDead && Math.hypot(clickX - en.x, clickY - en.y) < 32) {
        targetEnemy = true;
        break;
      }
    }

    if (targetEnemy || clickX > 400) {
      // Shoot towards click target
      if (p.ammo > 0 && !p.reloading) {
        p.ammo -= 1;
        setAmmo(p.ammo);
        const angle = Math.atan2(clickY - p.y, clickX - p.x);
        state.bullets.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(angle) * 11,
          vy: Math.sin(angle) * 11,
          team: 'player',
        });

        if (p.ammo === 0) {
          p.reloading = true;
          setTimeout(() => {
            p.ammo = 30;
            p.reloading = false;
            setAmmo(30);
          }, 1200);
        }
      }
    } else {
      // Move player
      p.targetX = Math.min(380, Math.max(70, clickX));
      p.targetY = Math.min(580, Math.max(110, clickY));
    }
  };

  const handleRestart = () => {
    gameStateRef.current = {
      player: {
        x: 150,
        y: 350,
        targetX: 150,
        targetY: 350,
        hp: 100,
        maxHp: 100,
        ammo: 30,
        reloading: false,
      },
      enemies: [
        { id: 1, x: 650, y: 200, hp: 50, maxHp: 50, team: 'enemy', shootCooldown: 60, isDead: false, targetX: 650, targetY: 200 },
        { id: 2, x: 700, y: 350, hp: 50, maxHp: 50, team: 'enemy', shootCooldown: 90, isDead: false, targetX: 700, targetY: 350 },
        { id: 3, x: 650, y: 500, hp: 50, maxHp: 50, team: 'enemy', shootCooldown: 120, isDead: false, targetX: 650, targetY: 500 },
      ],
      covers: gameStateRef.current.covers,
      bullets: [],
      killCount: 0,
    };
    setKills(0);
    setPlayerHp(100);
    setAmmo(30);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#18181b] overflow-hidden select-none font-mono touch-none">
      <MinimalistMissionHUD
        title="GUNS GUNS GUNS"
        score={kills}
        goalScore={5}
        onBack={onBack}
        unit="KILLS"
      />

      {/* HP & Ammo Status Bar */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center text-xs bg-zinc-900/80 border border-zinc-700 px-3 py-1.5 rounded-sm">
        <div className="flex items-center gap-2">
          <span>HP:</span>
          <div className="w-20 h-2 bg-zinc-800 rounded-xs overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${playerHp}%` }} />
          </div>
          <span className="font-bold text-emerald-400">{playerHp}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-sky-400">AMMO: {ammo} / 30</span>
          <span className="font-bold text-rose-400">KILLS: {kills} / 5</span>
        </div>
      </div>

      {/* Touch Guide */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-[11px] text-zinc-400 bg-zinc-900/90 border border-zinc-700 px-4 py-1.5 rounded-sm pointer-events-none whitespace-nowrap">
        좌측 영역 탭: 엄폐 이동 • 우측 적 영역 탭: 타깃 조준 사격
      </div>

      <canvas ref={canvasRef} onPointerDown={handlePointer} className="w-full h-full block cursor-crosshair" />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ KIA - KILLED IN ACTION ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            적군의 집중 사격에 쓰러졌습니다! 엄폐물을 활용해 공격을 피하세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 출격
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-sm transition-colors cursor-pointer"
            >
              미션 목록
            </button>
          </div>
        </div>
      )}

      {/* Victory Reward Modal */}
      {gameWon && (
        <VictoryRewardModal
          isOpen={true}
          onClose={onBack}
          rewardAmount={rewardResult?.rewardAmount || 38}
          message="아레나의 모든 적 분대원을 제압하고 전술 승리를 거두었습니다!"
        />
      )}
    </div>
  );
};

export default PokiGunsGunsGunsGame;
