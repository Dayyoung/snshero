import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStickmanDragonFightGameProps {
  onBack: () => void;
}

interface Fighter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  facing: 1 | -1;
  attackCooldown: number;
  isHit: number; // flash counter
  chargeKi: number;
  kiMax: number;
}

interface Beam {
  x: number;
  y: number;
  w: number;
  h: number;
  dir: 1 | -1;
  damage: number;
  duration: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export const PokiStickmanDragonFightGame: React.FC<PokiStickmanDragonFightGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover' | 'victory'>('ready');
  const [defeatedCount, setDefeatedCount] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [playerKi, setPlayerKi] = useState(0);

  const stateRef = useRef({
    player: {
      x: 100,
      y: 300,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      facing: 1 as 1 | -1,
      attackCooldown: 0,
      isHit: 0,
      chargeKi: 0,
      kiMax: 100,
    } as Fighter,
    enemies: [] as Fighter[],
    beams: [] as Beam[],
    particles: [] as Particle[],
    targetTouch: null as { x: number; y: number } | null,
    totalEnemiesDefeated: 0,
  });

  const initGame = useCallback(() => {
    stateRef.current.player = {
      x: 80,
      y: 300,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      facing: 1,
      attackCooldown: 0,
      isHit: 0,
      chargeKi: 30,
      kiMax: 100,
    };
    stateRef.current.enemies = [
      {
        x: 300,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 70,
        maxHp: 70,
        facing: -1,
        attackCooldown: 40,
        isHit: 0,
        chargeKi: 0,
        kiMax: 50,
      },
      {
        x: 320,
        y: 400,
        vx: 0,
        vy: 0,
        hp: 85,
        maxHp: 85,
        facing: -1,
        attackCooldown: 60,
        isHit: 0,
        chargeKi: 0,
        kiMax: 50,
      },
    ];
    stateRef.current.beams = [];
    stateRef.current.particles = [];
    stateRef.current.totalEnemiesDefeated = 0;
    setDefeatedCount(0);
    setPlayerKi(30);
  }, []);

  const handleStart = () => {
    initGame();
    setGameState('playing');
    setRewardReceipt(null);
  };

  const handleVictory = useCallback(() => {
    setGameState('victory');
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokistickmandragonfight',
      gameTitle: 'Stickman Dragon Fight',
      isVictory: true,
      score: 2,
      maxTargetScore: 2,
      durationSeconds: 30,
    });
    setRewardReceipt(receipt);
  }, []);

  // Player Melee Strike
  const triggerPunch = useCallback(() => {
    const { player, enemies, particles } = stateRef.current;
    if (player.attackCooldown > 0) return;
    player.attackCooldown = 14;

    // Spark
    const hitBox = {
      x: player.facing === 1 ? player.x + 36 : player.x - 30,
      y: player.y - 15,
      w: 40,
      h: 50,
    };

    let didHit = false;
    enemies.forEach((enemy) => {
      if (
        hitBox.x < enemy.x + 36 &&
        hitBox.x + hitBox.w > enemy.x &&
        hitBox.y < enemy.y + 46 &&
        hitBox.y + hitBox.h > enemy.y
      ) {
        enemy.hp -= 20;
        enemy.isHit = 10;
        enemy.vx = player.facing * 8;
        enemy.vy = -3;
        player.chargeKi = Math.min(player.kiMax, player.chargeKi + 15);
        setPlayerKi(player.chargeKi);
        didHit = true;

        for (let i = 0; i < 8; i++) {
          particles.push({
            x: enemy.x + 18,
            y: enemy.y + 20,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 15,
            color: '#f59e0b',
            size: 4,
          });
        }
      }
    });

    if (!didHit) {
      // Dash swing forward
      player.vx = player.facing * 5;
    }
  }, []);

  // Player Dragon Beam Skill
  const triggerDragonBeam = useCallback(() => {
    const { player, beams, particles } = stateRef.current;
    if (player.chargeKi < 50) return;
    player.chargeKi -= 50;
    setPlayerKi(player.chargeKi);

    const bx = player.facing === 1 ? player.x + 40 : 0;
    const bw = player.facing === 1 ? 400 - (player.x + 40) : player.x;

    beams.push({
      x: player.facing === 1 ? player.x + 40 : 0,
      y: player.y + 10,
      w: bw,
      h: 30,
      dir: player.facing,
      damage: 60,
      duration: 25,
    });

    // Recoil
    player.vx = -player.facing * 7;

    for (let i = 0; i < 20; i++) {
      particles.push({
        x: player.x + 20,
        y: player.y + 25,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 25,
        color: '#38bdf8',
        size: 5,
      });
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
      const { player, enemies, beams, particles } = stateRef.current;

      ctx.clearRect(0, 0, width, height);

      // Cosmic arena space background
      const bgGrad = ctx.createRadialGradient(200, 300, 50, 200, 300, 350);
      bgGrad.addColorStop(0, '#1e1b4b');
      bgGrad.addColorStop(0.7, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant stars / nebula aura
      ctx.fillStyle = 'rgba(236, 72, 153, 0.15)';
      ctx.beginPath();
      ctx.arc(200, 300, 160, 0, Math.PI * 2);
      ctx.fill();

      if (gameState === 'playing') {
        // Player Flight Movement
        if (stateRef.current.targetTouch) {
          const dx = stateRef.current.targetTouch.x - (player.x + 18);
          const dy = stateRef.current.targetTouch.y - (player.y + 23);
          player.vx += dx * 0.08;
          player.vy += dy * 0.08;
          if (Math.abs(dx) > 10) {
            player.facing = dx > 0 ? 1 : -1;
          }
        }

        // Damping
        player.vx *= 0.85;
        player.vy *= 0.85;
        player.x += player.vx;
        player.y += player.vy;

        // Bounds
        player.x = Math.max(10, Math.min(width - 50, player.x));
        player.y = Math.max(30, Math.min(height - 70, player.y));

        if (player.attackCooldown > 0) player.attackCooldown--;
        if (player.isHit > 0) player.isHit--;

        // Passive Ki recovery
        if (player.chargeKi < player.kiMax) {
          player.chargeKi += 0.08;
          setPlayerKi(Math.floor(player.chargeKi));
        }

        // Enemies AI & Combat
        for (let i = enemies.length - 1; i >= 0; i--) {
          const en = enemies[i];
          if (en.isHit > 0) en.isHit--;

          // Track player
          const edx = player.x - en.x;
          const edy = player.y - en.y;
          const dist = Math.hypot(edx, edy);

          en.facing = edx > 0 ? 1 : -1;

          if (dist > 70) {
            en.vx += (edx / dist) * 1.8;
            en.vy += (edy / dist) * 1.8;
          } else {
            // Enemy attack
            if (en.attackCooldown <= 0) {
              en.attackCooldown = 50;
              player.hp -= 12;
              player.isHit = 12;
              player.vx = en.facing * 7;
              for (let p = 0; p < 6; p++) {
                particles.push({
                  x: player.x + 18,
                  y: player.y + 20,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  life: 14,
                  color: '#ef4444',
                  size: 3,
                });
              }
              if (player.hp <= 0) {
                player.hp = 0;
                setGameState('gameover');
              }
            }
          }

          if (en.attackCooldown > 0) en.attackCooldown--;

          en.vx *= 0.85;
          en.vy *= 0.85;
          en.x += en.vx;
          en.y += en.vy;

          // Enemy defeated check
          if (en.hp <= 0) {
            enemies.splice(i, 1);
            stateRef.current.totalEnemiesDefeated++;
            setDefeatedCount(stateRef.current.totalEnemiesDefeated);

            for (let p = 0; p < 25; p++) {
              particles.push({
                x: en.x + 18,
                y: en.y + 20,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                life: 30,
                color: '#fbbf24',
                size: 5,
              });
            }

            if (stateRef.current.totalEnemiesDefeated >= 2) {
              handleVictory();
              return;
            }
          }
        }

        // Beams Collision & Lifespan
        for (let b = beams.length - 1; b >= 0; b--) {
          const bm = beams[b];
          bm.duration--;

          // Check hit enemies
          enemies.forEach((en) => {
            if (en.y + 40 > bm.y && en.y < bm.y + bm.h) {
              en.hp -= bm.damage * 0.1;
              en.isHit = 5;
              en.vx = bm.dir * 4;
              particles.push({
                x: en.x + 18,
                y: en.y + 20,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 10,
                color: '#00ffff',
                size: 4,
              });
            }
          });

          if (bm.duration <= 0) {
            beams.splice(b, 1);
          }
        }
      }

      // Draw Beams
      for (const bm of beams) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.fillRect(bm.x, bm.y, bm.w, bm.h);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bm.x, bm.y + 8, bm.w, bm.h - 16);
      }

      // Draw Particles
      for (let p = particles.length - 1; p >= 0; p--) {
        const pt = particles[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        if (pt.life <= 0) {
          particles.splice(p, 1);
          continue;
        }
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Enemies (Dark Dragon Warriors)
      for (const en of enemies) {
        ctx.save();
        if (en.isHit > 0) {
          ctx.filter = 'brightness(2) drop-shadow(0 0 8px #ef4444)';
        }
        // Enemy sprite (Dark silhouette warrior)
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(en.x + 18, en.y + 12, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(en.x + 18, en.y + 22);
        ctx.lineTo(en.x + 18, en.y + 40);
        ctx.lineTo(en.x + 8, en.y + 52);
        ctx.moveTo(en.x + 18, en.y + 40);
        ctx.lineTo(en.x + 28, en.y + 52);
        ctx.moveTo(en.x + 6, en.y + 30);
        ctx.lineTo(en.x + 30, en.y + 30);
        ctx.stroke();

        // Enemy HP Bar
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(en.x, en.y - 12, 36, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(en.x, en.y - 12, 36 * (en.hp / en.maxHp), 6);
        ctx.restore();
      }

      // Draw Player Hero (Card #77 Dragon Fighter)
      ctx.save();
      // Ki Aura
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.arc(player.x + 18, player.y + 23, 30 + Math.sin(Date.now() * 0.01) * 4, 0, Math.PI * 2);
      ctx.fill();

      if (player.isHit > 0) {
        ctx.filter = 'brightness(2)';
      }
      if (player.facing === -1) {
        ctx.translate(player.x + 36, player.y);
        ctx.scale(-1, 1);
        drawCardSprite(ctx, 77, 0, 0, 36, 46);
      } else {
        drawCardSprite(ctx, 77, player.x, player.y, 36, 46);
      }
      ctx.restore();

      // Draw Player HUD (HP & Ki Bar)
      // HP Bar
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(20, 20, 140, 12);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(20, 20, 140 * (player.hp / player.maxHp), 12);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`HP ${Math.round(player.hp)} / 100`, 24, 29);

      // Ki Bar
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(20, 36, 140, 10);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(20, 36, 140 * (player.chargeKi / player.kiMax), 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`KI ${Math.round(player.chargeKi)} / 100`, 24, 44);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, handleVictory]);

  // Touch Handlers for Movement
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = e.touches[0];
    stateRef.current.targetTouch = {
      x: ((t.clientX - rect.left) / rect.width) * 400,
      y: ((t.clientY - rect.top) / rect.height) * 600,
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = e.touches[0];
    stateRef.current.targetTouch = {
      x: ((t.clientX - rect.left) / rect.width) * 400,
      y: ((t.clientY - rect.top) / rect.height) * 600,
    };
  };

  const handleTouchEnd = () => {
    stateRef.current.targetTouch = null;
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] bg-[#020617] text-[#fdfcfc] select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Stickman Dragon Fight"
        missionTarget="다크 전사 2명 격퇴"
        currentScore={defeatedCount}
        maxScore={2}
        scoreUnit="명"
        onBack={onBack}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="w-full h-full object-contain rounded border border-white/20 bg-slate-950 touch-none shadow-2xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            stateRef.current.targetTouch = {
              x: ((e.clientX - rect.left) / rect.width) * 400,
              y: ((e.clientY - rect.top) / rect.height) * 600,
            };
          }}
          onMouseMove={(e) => {
            if (stateRef.current.targetTouch) {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;
              stateRef.current.targetTouch = {
                x: ((e.clientX - rect.left) / rect.width) * 400,
                y: ((e.clientY - rect.top) / rect.height) * 600,
              };
            }
          }}
          onMouseUp={() => {
            stateRef.current.targetTouch = null;
          }}
        />

        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-sky-400 mb-2">[ Stickman Dragon Fight ]</h2>
            <p className="text-sm text-slate-300 mb-6">
              공중을 비행하며 강력한 드래곤 격투술로 악의 전사들을 제압하세요!<br />
              <b>터치 드래그</b>: 자유 공중 비행<br />
              <b>[PUNCH]</b>: 근접 콤보 타격 & 기 충전<br />
              <b>[DRAGON BEAM]</b>: 기 50 소모 광선포 발사!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-lg rounded-sm active:scale-95 transition-all shadow-lg"
            >
              결투 개시 [START]
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-rose-500 mb-2">[ 전사 패배 ]</h2>
            <p className="text-sm text-slate-300 mb-4">격퇴한 전사: {defeatedCount} / 2</p>
            <button
              onClick={handleStart}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-sm active:scale-95 transition-all"
            >
              재도전
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

      {/* Combat Actions Bar */}
      {gameState === 'playing' && (
        <div className="w-full max-w-md p-3 bg-slate-950/90 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex-1">
            화면 터치로 비행 조종
          </div>
          <button
            onClick={triggerPunch}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-sm text-sm active:scale-95 transition-all shadow"
          >
            👊 콤보 타격
          </button>
          <button
            onClick={triggerDragonBeam}
            disabled={playerKi < 50}
            className={`flex-1 py-3 font-bold rounded-sm text-sm active:scale-95 transition-all shadow ${
              playerKi >= 50
                ? 'bg-sky-400 hover:bg-sky-500 text-slate-950 animate-pulse'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            ⚡ 드래곤 빔 (50KI)
          </button>
        </div>
      )}
    </div>
  );
};
export default PokiStickmanDragonFightGame;
